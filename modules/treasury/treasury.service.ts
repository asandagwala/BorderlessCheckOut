import { db } from '@/lib/database/db';
import { PolicyEngine } from './policy-engine.service';
import { getTreasuryWalletClient, publicClient } from '@/modules/blockchain/viem-client';
import { CHAIN_CONFIG, ERC20_ABI } from '@/modules/blockchain/config';
import { AgentAuditLog, PolicyDecision, Transaction } from '@/lib/database/types';
import { decodeEventLog, parseUnits } from 'viem';
import { ENV } from '@/lib/env';

export interface TreasuryExecutionResult {
  success: boolean;
  decision: PolicyDecision;
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

    // This is a reconciled ledger balance, not a token-balance RPC query.
    const currentBalanceUsdc = totalReceivedUsdc - totalDisbursedUsdc;
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
    const supplierWallet = supplier?.walletAddress;

    // If policy rejected the payment (e.g. limit exceeded or unapproved supplier)
    if (!evaluation.isAllowed) {
      const auditLog: AgentAuditLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        merchantId,
        agentAction,
        proposedAmount: amount,
        supplier: supplierName,
        supplierWallet,
        policyDecision: evaluation.decision,
        policyReason: evaluation.reason,
        executionStatus: evaluation.decision === 'REQUIRES_APPROVAL' ? 'PENDING_APPROVAL' : 'BLOCKED',
        txHash: null,
        timestamp: new Date().toISOString(),
      };

      await db.createAuditLog(auditLog);
      if (invoice) {
        await db.updateInvoiceStatus(
          invoice.id,
          evaluation.decision === 'REQUIRES_APPROVAL' ? 'APPROVAL_REQUIRED' : 'REJECTED'
        );
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

    // 2. Policy passed: submit and then verify the mined USDC transfer on Base Sepolia.
    const signer = getTreasuryWalletClient();
    const failExecution = async (reason: string, txHash: string | null = null): Promise<TreasuryExecutionResult> => {
      const auditLog: AgentAuditLog = {
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        merchantId,
        agentAction,
        proposedAmount: amount,
        supplier: supplierName,
        supplierWallet,
        policyDecision: evaluation.decision,
        policyReason: reason,
        executionStatus: 'FAILED',
        txHash,
        timestamp: new Date().toISOString(),
      };
      await db.createAuditLog(auditLog);
      return { success: false, decision: evaluation.decision, reason, invoiceId, txHash, amount, supplierName, auditLogId: auditLog.id };
    };

    if (!ENV.TREASURY_EXECUTION_ENABLED) {
      return failExecution('Treasury execution is disabled until an authenticated approval workflow is configured; no blockchain transaction was submitted.');
    }

    if (!signer || !supplier?.walletAddress) {
      return failExecution('Treasury signing is not configured; no blockchain transaction was submitted.');
    }

    let txHash: `0x${string}` | null = null;
    let receipt: Awaited<ReturnType<typeof publicClient.waitForTransactionReceipt>>;
    try {
      const connectedChainId = await publicClient.getChainId();
      if (connectedChainId !== CHAIN_CONFIG.chain.id) {
        return failExecution(`Treasury RPC returned chain ID ${connectedChainId}; Base Sepolia (${CHAIN_CONFIG.chain.id}) is required. No transaction was submitted.`);
      }

      const units = parseUnits(amount.toString(), CHAIN_CONFIG.usdcDecimals);
      const hash = await signer.client.writeContract({
        address: CHAIN_CONFIG.usdcContractAddress,
        abi: ERC20_ABI,
        functionName: 'transfer',
        args: [supplier.walletAddress as `0x${string}`, units],
      });
      txHash = hash;
      await db.createAuditLog({
        id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        merchantId,
        agentAction,
        proposedAmount: amount,
        supplier: supplierName,
        supplierWallet,
        policyDecision: evaluation.decision,
        policyReason: 'USDC transfer submitted to Base Sepolia; awaiting receipt confirmation.',
        executionStatus: 'SUBMITTED',
        txHash: hash,
        timestamp: new Date().toISOString(),
      });
      receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status !== 'success') {
        return failExecution('Treasury transaction reverted on Base Sepolia.', hash);
      }

      const transferVerified = receipt.logs.some((log) => {
        if (log.address.toLowerCase() !== CHAIN_CONFIG.usdcContractAddress.toLowerCase()) return false;
        try {
          const decoded = decodeEventLog({ abi: ERC20_ABI, eventName: 'Transfer', data: log.data, topics: log.topics });
          return decoded.args.from.toLowerCase() === signer.account.address.toLowerCase()
            && decoded.args.to.toLowerCase() === supplier.walletAddress.toLowerCase()
            && decoded.args.value === units;
        } catch {
          return false;
        }
      });

      if (!transferVerified) {
        return failExecution('Mined transaction did not contain the expected USDC transfer event.', hash);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      return failExecution(`Treasury submission or receipt verification failed: ${message}.`, txHash);
    }

    // 3. Record transaction in database
    if (invoice && supplier) {
      const payoutTx: Transaction = {
        id: `tx_payout_${Date.now()}`,
        orderId: null,
        merchantId,
        txHash: txHash!,
        tokenContract: CHAIN_CONFIG.usdcContractAddress,
        senderAddress: signer.account.address,
        recipientAddress: supplier.walletAddress,
        amount,
        verificationStatus: 'VERIFIED',
        type: 'SUPPLIER_PAYOUT',
        blockNumber: Number(receipt.blockNumber),
        timestamp: new Date().toISOString(),
      };
      await db.createTransaction(payoutTx);
      await db.updateInvoiceStatus(invoice.id, 'PAID');
    }

    // 4. Record comprehensive audit log
    const auditLog: AgentAuditLog = {
      id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      merchantId,
      agentAction,
      proposedAmount: amount,
      supplier: supplierName,
      supplierWallet,
      policyDecision: evaluation.decision,
      policyReason: `${evaluation.reason} (Mined and verified on Base Sepolia.)`,
      executionStatus: 'EXECUTED',
      txHash,
      timestamp: new Date().toISOString(),
    };

    await db.createAuditLog(auditLog);

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
