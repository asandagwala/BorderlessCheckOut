import Anthropic from '@anthropic-ai/sdk';
import { db } from '@/lib/database/db';
import { TreasuryService, TreasuryExecutionResult } from '@/modules/treasury/treasury.service';
import { PolicyEngine } from '@/modules/treasury/policy-engine.service';
import { ENV } from '@/lib/env';

export interface AgentStepTrace {
  step: number;
  action: string;
  detail: string;
  status: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
}

export interface TreasuryAgentRunResult {
  runId: string;
  invoiceId: string;
  invoiceAmount: number;
  supplierName: string;
  policyLimit: number;
  decision: 'APPROVED' | 'REJECTED' | 'REQUIRES_APPROVAL';
  reason: string;
  executedOnChain: boolean;
  txHash: string | null;
  traces: AgentStepTrace[];
  executionResult: TreasuryExecutionResult;
}

const TREASURY_AGENT_SYSTEM_PROMPT = `
You are the Autonomous AI Treasury Agent for Borderless Checkout.
Your responsibility is to monitor outstanding supplier invoices, verify them against approved vendor lists, check merchant spending limits, and safely initiate authorized settlements.

SECURITY DIRECTIVES:
1. You do not possess direct private keys or direct access to blockchain wallets.
2. All payment actions must be initiated through the protected tool 'propose_and_execute_supplier_payment'.
3. An independent backend policy engine validates every request. You cannot alter policies or override spending caps.
4. Report your reasoning clearly at each step.
`;

export class TreasuryAgentService {
  /**
   * Runs the full automated treasury agent workflow for a given invoice.
   * Produces an auditable step-by-step execution trace.
   */
  static async runWorkflowForInvoice(
    merchantId: string,
    invoiceId: string
  ): Promise<TreasuryAgentRunResult> {
    const traces: AgentStepTrace[] = [];
    const runId = `run_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;

    const addTrace = (action: string, detail: string, status: AgentStepTrace['status'] = 'info') => {
      traces.push({
        step: traces.length + 1,
        action,
        detail,
        status,
        timestamp: new Date().toLocaleTimeString(),
      });
    };

    // Step 1: Retrieve invoice
    addTrace('INVOICE_INSPECTION', `Inspecting target invoice ID: ${invoiceId}...`);
    const invoice = await db.getInvoiceById(invoiceId);
    if (!invoice) {
      addTrace('ERROR', `Invoice ${invoiceId} could not be found.`, 'error');
      throw new Error(`Invoice not found: ${invoiceId}`);
    }

    const supplier = await db.getSupplierById(invoice.supplierId);
    const supplierName = supplier?.supplierName || 'Unknown Supplier';
    const amount = Number(invoice.invoiceAmount);
    addTrace('INVOICE_DETAILS', `Found invoice ${invoice.invoiceNumber} for $${amount.toFixed(2)} USDC due to '${supplierName}'.`, 'info');

    // Step 2: Check treasury balance
    addTrace('BALANCE_CHECK', 'Querying merchant treasury liquidity on Base Sepolia...');
    const balance = await TreasuryService.getTreasuryBalance(merchantId);
    const hasSufficientBalance = balance.currentBalanceUsdc >= amount;
    addTrace(
      hasSufficientBalance ? 'BALANCE_VERIFIED' : 'BALANCE_INSUFFICIENT',
      `On-chain treasury wallet balance: $${balance.currentBalanceUsdc.toFixed(2)} USDC; invoice requires $${amount.toFixed(2)} USDC.`,
      hasSufficientBalance ? 'success' : 'warning'
    );

    // Step 3: Check supplier approval status
    addTrace('SUPPLIER_VERIFICATION', `Verifying vendor '${supplierName}' in approved suppliers registry...`);
    const isSupplierApproved = supplier?.approvalStatus === 'APPROVED';
    if (isSupplierApproved) {
      addTrace('SUPPLIER_APPROVED', `Supplier '${supplierName}' is verified and APPROVED (Wallet: ${supplier?.walletAddress}).`, 'success');
    } else {
      addTrace('SUPPLIER_UNAPPROVED', `Supplier '${supplierName}' is NOT approved (Status: ${supplier?.approvalStatus || 'NONE'}). Policy check will flag this.`, 'warning');
    }

    // Step 4: Check merchant spending policy
    addTrace('POLICY_CHECK', 'Retrieving merchant spending limits and dual-control rules...');
    let policy = await db.getPolicyByMerchantId(merchantId);
    const spendingLimit = policy ? Number(policy.spendingLimit) : 500.00;
    addTrace('POLICY_RETRIEVED', `Merchant spending limit is set to $${spendingLimit.toFixed(2)} USDC per transaction.`, 'info');

    // Step 5: Agent reasoning & proposal
    if (amount <= spendingLimit && isSupplierApproved) {
      addTrace('AGENT_PROPOSAL', `Agent evaluated invoice: $${amount.toFixed(2)} is within $${spendingLimit.toFixed(2)} limit and vendor is approved. Proposing payment.`, 'success');
    } else if (amount > spendingLimit) {
      addTrace('AGENT_PROPOSAL', `Agent proposing payment of $${amount.toFixed(2)}. Alert: Amount exceeds $${spendingLimit.toFixed(2)} policy limit. Submitting to policy engine for formal check.`, 'warning');
    } else {
      addTrace('AGENT_PROPOSAL', `Agent proposing payment. Alert: Supplier '${supplierName}' has status ${supplier?.approvalStatus}.`, 'warning');
    }

    // Step 6: Invoke Independent Policy Engine & Protected Execution Tool
    addTrace('POLICY_ENGINE_ENFORCEMENT', 'Routing payment proposal to independent policy engine...');
    const executionResult = await TreasuryService.executeSupplierPaymentProposal(
      merchantId,
      invoice.id,
      'AI_TREASURY_AGENT_DISPATCH'
    );

    // Step 7: Record outcome
    if (executionResult.success && executionResult.txHash) {
      addTrace(
        'EXECUTION_SUCCESS',
        `Policy engine APPROVED payment. Executed on Base Sepolia! Tx Hash: ${executionResult.txHash}`,
        'success'
      );
    } else if (executionResult.decision === 'REQUIRES_APPROVAL') {
      addTrace('HUMAN_APPROVAL_REQUIRED', executionResult.reason, 'warning');
    } else if (executionResult.decision === 'REJECTED') {
      addTrace(
        'EXECUTION_BLOCKED',
        `Policy engine rejected the proposal: "${executionResult.reason}". On-chain transaction was blocked.`,
        'error'
      );
    } else {
      addTrace('EXECUTION_FAILED', executionResult.reason, 'error');
    }

    return {
      runId,
      invoiceId: invoice.id,
      invoiceAmount: amount,
      supplierName,
      policyLimit: spendingLimit,
      decision: executionResult.decision as any,
      reason: executionResult.reason,
      executedOnChain: executionResult.success,
      txHash: executionResult.txHash || null,
      traces,
      executionResult,
    };
  }

  /**
   * Convenience runner for Demonstration Scenario 1: Approved $100 Payment
   */
  static async runScenario1Approved(merchantId: string): Promise<TreasuryAgentRunResult> {
    const invoices = await db.getInvoicesByMerchantId(merchantId);
    let target = invoices.find(i => i.invoiceAmount === 100 && i.paymentStatus === 'PENDING');
    if (!target) {
      // Re-create or reset if already consumed in earlier run
      const supp = (await db.getSuppliersByMerchantId(merchantId)).find(s => s.approvalStatus === 'APPROVED');
      target = await db.createInvoice({
        id: `inv_demo_approved_100_${Date.now()}`,
        supplierId: supp ? supp.id : 'supp_cape_agro_01',
        merchantId,
        invoiceNumber: `INV-CAP-2026-${Math.floor(Math.random() * 800 + 100)}`,
        invoiceAmount: 100.00,
        currency: 'USDC',
        dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
        paymentStatus: 'PENDING',
        createdAt: new Date().toISOString(),
      });
    }
    return this.runWorkflowForInvoice(merchantId, target.id);
  }

  /**
   * Convenience runner for Demonstration Scenario 2: Rejected $700 Payment (Exceeds $500 Limit)
   */
  static async runScenario2Rejected(merchantId: string): Promise<TreasuryAgentRunResult> {
    const invoices = await db.getInvoicesByMerchantId(merchantId);
    let target = invoices.find(i => i.invoiceAmount === 700 && i.paymentStatus === 'PENDING');
    if (!target) {
      const supp = (await db.getSuppliersByMerchantId(merchantId)).find(s => s.approvalStatus === 'APPROVED');
      target = await db.createInvoice({
        id: `inv_demo_rejected_700_${Date.now()}`,
        supplierId: supp ? supp.id : 'supp_nairobi_cold_02',
        merchantId,
        invoiceNumber: `INV-NCC-2026-${Math.floor(Math.random() * 800 + 100)}`,
        invoiceAmount: 700.00,
        currency: 'USDC',
        dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
        paymentStatus: 'PENDING',
        createdAt: new Date().toISOString(),
      });
    }
    return this.runWorkflowForInvoice(merchantId, target.id);
  }
}
