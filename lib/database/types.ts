// Database Entity Types for Borderless Checkout
// Modular Architecture

export type PaymentStatus = 'PENDING' | 'CONFIRMING' | 'PAID' | 'FAILED' | 'EXPIRED';
export type VerificationStatus = 'PENDING' | 'VERIFIED' | 'FAILED';
export type TransactionType = 'CUSTOMER_PAYMENT' | 'SUPPLIER_PAYOUT';
export type ApprovalStatus = 'APPROVED' | 'PENDING' | 'BLOCKED';
export type InvoiceStatus = 'PENDING' | 'CONFIRMING' | 'PAID' | 'FAILED' | 'REJECTED' | 'APPROVAL_REQUIRED';
export type PolicyDecision = 'APPROVED' | 'REJECTED' | 'REQUIRES_APPROVAL';
export type ExecutionStatus = 'EXECUTED' | 'BLOCKED' | 'PENDING_APPROVAL' | 'FAILED';

export interface Merchant {
  id: string;
  businessName: string;
  email: string;
  walletAddress: string;
  createdAt: string;
  updatedAt?: string;
}

export interface Order {
  id: string;
  merchantId: string;
  customerReference: string;
  orderAmount: number;
  currency: string; // e.g. "ZAR", "USD"
  usdcAmount: number;
  paymentReference: string;
  paymentStatus: PaymentStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface Transaction {
  id: string;
  orderId?: string | null;
  merchantId: string;
  txHash: string;
  tokenContract: string;
  senderAddress: string;
  recipientAddress: string;
  amount: number;
  verificationStatus: VerificationStatus;
  type: TransactionType;
  blockNumber?: number | null;
  timestamp: string;
}

export interface Supplier {
  id: string;
  merchantId: string;
  supplierName: string;
  walletAddress: string;
  approvalStatus: ApprovalStatus;
  createdAt: string;
}

export interface SupplierInvoice {
  id: string;
  supplierId: string;
  merchantId: string;
  invoiceNumber: string;
  invoiceAmount: number;
  currency: string; // "USDC"
  dueDate: string;
  paymentStatus: InvoiceStatus;
  createdAt: string;
}

export interface TreasuryPolicy {
  id: string;
  merchantId: string;
  spendingLimit: number; // e.g. 500.00
  approvalRequirements: {
    requireApprovalAbove: number;
    approvedSuppliersOnly: boolean;
  };
  createdAt: string;
  updatedAt?: string;
}

export interface AgentAuditLog {
  id: string;
  merchantId: string;
  agentAction: string;
  proposedAmount?: number;
  supplier?: string;
  supplierWallet?: string;
  policyDecision: PolicyDecision;
  policyReason?: string;
  executionStatus: ExecutionStatus;
  txHash?: string | null;
  timestamp: string;
}
