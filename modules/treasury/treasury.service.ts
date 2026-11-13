import { db } from '@/lib/database/db';
import { PolicyEngine } from './policy-engine.service';
import { getTreasuryWalletClient, publicClient } from '@/modules/blockchain/viem-client';
import { CHAIN_CONFIG, ERC20_ABI } from '@/modules/blockchain/config';
import { BlockchainPaymentVerifier } from '@/modules/blockchain/verifier.service';
import { AgentAuditLog, Transaction } from '@/lib/database/types';
import { formatUnits, parseUnits } from 'viem';

export interface TreasuryExecutionResult {
  success: boolean;
  decision: string;
  reason: string;
  invoiceId: string;
  txHash?: string | null;
  amount: number;
  supplierName?: string;
  auditLogId: string;
}

export class TreasuryService {
  /**
   * Calculates current treasury balance for the merchant.
   * Derived from verified incoming customer payments minus paid supplier payouts.
   */
  static async getTreasuryBalance(merchantId: string): Promise<{
    totalReceivedUsdc: number;
    totalDisbursedUsdc: number;
    currentBalanceUsdc: number;
    indicativeZarValue: number;
  }> {
    const transactions = await db.getTransactionsByMerchantId(merchantId);
    let totalReceivedUsdc = 0;
    let totalDisbursedUsdc = 0;

    for (const tx of transactions) {
      if (tx.verificationStatus === 'VERIFIED') {
        if (tx.type === 'CUSTOMER_PAYMENT') {
          totalReceivedUsdc += Number(tx.amount);
        } else if (tx.type === 'SUPPLIER_PAYOUT') {
          totalDisbursedUsdc += Number(tx.amount);
        }
      }
    }

    // Treasury liquidity comes from the configured treasury wallet on Base Sepolia.
    // Do not report a seeded buffer as spendable funds.
    const signer = getTreasuryWalletClient();
    const balanceUnits = signer
      ? await publicClient.readContract({
          address: CHAIN_CONFIG.usdcContractAddress,
          abi: ERC20_ABI,
          functionName: 'balanceOf',
          args: [signer.account.address],
        })
      : BigInt(0);
    const currentBalanceUsdc = Number(formatUnits(balanceUnits, CHAIN_CONFIG.usdcDecimals));
    const indicativeZarValue = currentBalanceUsdc * 18.50;

    return {
      totalReceivedUsdc,
      totalDisbursedUsdc,
      currentBalanceUsdc,
      indicativeZarValue,
    };
  }

  /**
   * Protected execution pipeline for an AI Treasury Agent proposed payment.
   * Strictly enforces:
   * 1. Independent policy engine validation.
   * 2. Audit logging for both approved AND rejected payments.
   * 3. On-chain execution only when policy passes.
   */
  static async executeSupplierPaymentProposal(
    merchantId: string,
    invoiceId: string,
    agentAction: string = 'AI_TREASURY_AUTO_PAYMENT'
  ): Promise<TreasuryExecutionResult> {
    // 1. Evaluate with the independent policy engine
    const evaluation = await PolicyEngine.evaluatePaymentProposal(merchantId, invoiceId);
    const invoice = evaluation.invoice;
    const supplier = evaluation.supplier;
    const amount = invoice ? Number(invoice.invoiceAmount) : 0;
    const supplierName = supplier?.supplierName || 'Unknown Supplier';
    const supplierWallet = supplier?.walletAddress || '0x0000000000000000000000000000000000000000';

    const writeAuditLog = async (
      executionStatus: AgentAuditLog['executionStatus'],
      policyReason: string,
      txHash: string | null = null
    ) => {
      const auditLog: AgentAuditLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        merchantId,
        agentAction,
        proposedAmount: amount,
        supplier: supplierName,
        supplierWallet,
        policyDecision: evaluation.decision,
        policyReason,
        executionStatus,
        txHash,
        timestamp: new Date().toISOString(),
      };
      await db.createAuditLog(auditLog);
      return auditLog;
    };

    // If policy rejected the payment (e.g. limit exceeded or unapproved supplier)
    if (!evaluation.isAllowed) {
      const requiresApproval = evaluation.decision === 'REQUIRES_APPROVAL';
      const auditLog = await writeAuditLog(
        requiresApproval ? 'PENDING_APPROVAL' : 'BLOCKED',
        evaluation.reason
      );
      if (invoice) {
        await db.updateInvoiceStatus(invoice.id, requiresApproval ? 'APPROVAL_REQUIRED' : 'REJECTED');
      }

      return {
        success: false,
        decision: evaluation.decision,
        reason: evaluation.reason,
        invoiceId,
        txHash: null,
        amount,
        supplierName,
        auditLogId: auditLog.id,
      };
    }

    // 2. Policy passed: only submit a real Base Sepolia transaction.
    const signer = getTreasuryWalletClient();
    const failExecution = async (reason: string, txHash: string | null = null) => {
      const auditLog = await writeAuditLog('FAILED', reason, txHash);
      return {
        success: false,
        decision: evaluation.decision,
        reason,
        invoiceId,
        txHash,
        amount,
        supplierName,
        auditLogId: auditLog.id,
      } satisfies TreasuryExecutionResult;
    };

    if (!signer) {
      return failExecution('Treasury wallet is not configured. No supplier payment was submitted.');
    }
    if (!invoice || !supplier?.walletAddress) {
      return failExecution('Invoice or approved supplier wallet is unavailable. No supplier payment was submitted.');
    }

    const units = parseUnits(amount.toString(), CHAIN_CONFIG.usdcDecimals);
    let balanceUnits: bigint;
    try {
      balanceUnits = await publicClient.readContract({
        address: CHAIN_CONFIG.usdcContractAddress,
        abi: ERC20_ABI,
        functionName: 'balanceOf',
        args: [signer.account.address],
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown RPC error';
      return failExecution(`Could not verify treasury balance; no payment was submitted: ${message}`);
    }
    if (balanceUnits < units) {
      return failExecution(`Insufficient treasury USDC balance: need ${amount} USDC before submitting this payment.`);
    }

    let txHash: `0x${string}` | null = null;
    try {
      txHash = await signer.client.writeContract({
        address: CHAIN_CONFIG.usdcContractAddress,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [supplier.walletAddress as `0x${string}`, units],
      });
      await db.updateInvoiceStatus(invoice.id, 'CONFIRMING');
      const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash, confirmations: 1 });
      if (receipt.status !== 'success') {
        await db.updateInvoiceStatus(invoice.id, 'FAILED');
        return failExecution(`Supplier payment transaction failed on-chain with status ${receipt.status}.`, txHash);
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown blockchain error';
      return failExecution(`Live Base Sepolia payment failed or is awaiting confirmation: ${message}`, txHash);
    }

    if (!txHash) return failExecution('Blockchain provider returned no transaction hash.');
    const verification = await BlockchainPaymentVerifier.verifyPayment(
      txHash,
      supplier.walletAddress,
      amount
    );
    if (!verification.verified) {
      await db.updateInvoiceStatus(invoice.id, 'FAILED');
      return failExecution(
        verification.error || 'On-chain transfer could not be verified. Invoice remains unpaid.',
        txHash
      );
    }

    // Record a payout only after the successful on-chain receipt is verified.
    const payoutTx: Transaction = {
      id: `tx_payout_${Date.now()}`,
      orderId: null,
      merchantId,
      txHash,
      tokenContract: verification.tokenContract || CHAIN_CONFIG.usdcContractAddress,
      senderAddress: verification.senderAddress || signer.account.address,
      recipientAddress: verification.recipientAddress || supplier.walletAddress,
      amount: verification.amount ?? amount,
      verificationStatus: 'VERIFIED',
      type: 'SUPPLIER_PAYOUT',
      blockNumber: verification.blockNumber ?? null,
      timestamp: new Date().toISOString(),
    };
    await db.createTransaction(payoutTx);
    await db.updateInvoiceStatus(invoice.id, 'PAID');

    // 4. Record comprehensive audit log
    const auditLog = await writeAuditLog('EXECUTED', `${evaluation.reason} (Confirmed on Base Sepolia.)`, txHash);

    return {
      success: true,
      decision: evaluation.decision,
      reason: evaluation.reason,
      invoiceId,
      txHash,
      amount,
      supplierName,
      auditLogId: auditLog.id,
    };
  }
}
