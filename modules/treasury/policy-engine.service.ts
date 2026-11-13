import { db } from '@/lib/database/db';
import { Supplier, SupplierInvoice, TreasuryPolicy, PolicyDecision } from '@/lib/database/types';

export interface PolicyEvaluationResult {
  decision: PolicyDecision;
  isAllowed: boolean;
  reason: string;
  policy: TreasuryPolicy;
  supplier: Supplier | null;
  invoice: SupplierInvoice | null;
}

export class PolicyEngine {
  /**
   * Evaluates whether a proposed supplier payment complies with the merchant's financial policies.
   * This engine is completely independent of the AI agent and enforces non-bypassable constraints.
   */
  static async evaluatePaymentProposal(
    merchantId: string,
    invoiceId: string
  ): Promise<PolicyEvaluationResult> {
    // 1. Fetch policy for merchant (default spending limit: $500.00)
    let policy = await db.getPolicyByMerchantId(merchantId);
    if (!policy) {
      policy = {
        id: `pol_${merchantId}`,
        merchantId,
        spendingLimit: 50.00,
        approvalRequirements: {
          requireApprovalAbove: 300.00,
          approvedSuppliersOnly: true,
        },
        createdAt: new Date().toISOString(),
      };
      await db.updatePolicy(policy);
    }

    // 2. Fetch invoice
    const invoice = await db.getInvoiceById(invoiceId);
    if (!invoice) {
      return {
        decision: 'REJECTED',
        isAllowed: false,
        reason: `Invoice '${invoiceId}' was not found in the merchant's records.`,
        policy,
        supplier: null,
        invoice: null,
      };
    }

    // Check if invoice belongs to this merchant
    if (invoice.merchantId !== merchantId) {
      return {
        decision: 'REJECTED',
        isAllowed: false,
        reason: 'Security violation: Invoice does not belong to the authenticated merchant.',
        policy,
        supplier: null,
        invoice,
      };
    }

    // Check if already paid
    if (invoice.paymentStatus === 'PAID') {
      return {
        decision: 'REJECTED',
        isAllowed: false,
        reason: `Duplicate payment prevention: Invoice ${invoice.invoiceNumber} is already marked as PAID.`,
        policy,
        supplier: null,
        invoice,
      };
    }

    // 3. Fetch supplier and verify approval status
    const supplier = await db.getSupplierById(invoice.supplierId);
    if (!supplier) {
      return {
        decision: 'REJECTED',
        isAllowed: false,
        reason: `Supplier for invoice ${invoice.invoiceNumber} does not exist in registry.`,
        policy,
        supplier: null,
        invoice,
      };
    }

    if (policy.approvalRequirements.approvedSuppliersOnly && supplier.approvalStatus !== 'APPROVED') {
      return {
        decision: 'REJECTED',
        isAllowed: false,
        reason: `Compliance violation: Supplier '${supplier.supplierName}' is not approved (Current status: ${supplier.approvalStatus}). Treasury policy strictly requires pre-approved vendors.`,
        policy,
        supplier,
        invoice,
      };
    }

    // 4. Verify spending limits ($500.00 limit)
    const invoiceAmount = Number(invoice.invoiceAmount);
    const spendingLimit = Number(policy.spendingLimit);

    if (invoiceAmount > spendingLimit) {
      return {
        decision: 'REJECTED',
        isAllowed: false,
        reason: `Spending limit exceeded: Invoice amount $${invoiceAmount.toFixed(2)} exceeds merchant authorized spending limit of $${spendingLimit.toFixed(2)}.`,
        policy,
        supplier,
        invoice,
      };
    }

    // 5. Check if additional human approval is required
    const threshold = Number(policy.approvalRequirements.requireApprovalAbove);
    if (threshold && invoiceAmount > threshold) {
      return {
        decision: 'REQUIRES_APPROVAL',
        isAllowed: false,
        reason: `Invoice amount $${invoiceAmount.toFixed(2)} is within spending limit of $${spendingLimit.toFixed(2)}, but exceeds the human dual-control threshold of $${threshold.toFixed(2)}. Execution is blocked until an explicit approval workflow is implemented.`,
        policy,
        supplier,
        invoice,
      };
    }

    // Fully approved
    return {
      decision: 'APPROVED',
      isAllowed: true,
      reason: `Invoice amount $${invoiceAmount.toFixed(2)} is within $${spendingLimit.toFixed(2)} spending limit and supplier '${supplier.supplierName}' is approved.`,
      policy,
      supplier,
      invoice,
    };
  }
}
