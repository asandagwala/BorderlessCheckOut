import { 
  Merchant, 
  Order, 
  Transaction, 
  Supplier, 
  SupplierInvoice, 
  TreasuryPolicy, 
  AgentAuditLog 
} from './types';
import { ENV } from '@/lib/env';

export const SEED_MERCHANTS: Merchant[] = [
  {
    id: 'merch_kigali_01',
    businessName: 'Kigali Fresh Market Ltd',
    email: 'merchant@kigalifresh.rw',
    walletAddress: ENV.MERCHANT_WALLET_ADDRESS,
    createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'merch_cape_02',
    businessName: 'Cape Artisans & Exporters',
    email: 'finance@capeartisans.co.za',
    walletAddress: '0x71C83D9A167e43eFa4943E4a132B038B31f6Ccf7',
    createdAt: new Date(Date.now() - 60 * 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
  }
];

export const SEED_ORDERS: Order[] = [
  {
    id: 'ord_live_checkout_01',
    merchantId: 'merch_kigali_01',
    customerReference: 'CUST-AFR-8921',
    orderAmount: 925.00, // ZAR
    currency: 'ZAR',
    usdcAmount: 50.00, // $50 USDC
    paymentReference: 'BC-ORD-KIGALI-001',
    paymentStatus: 'PENDING',
    createdAt: new Date(Date.now() - 15 * 60000).toISOString(), // 15 mins ago
  },
  {
    id: 'ord_sample_paid_02',
    merchantId: 'merch_kigali_01',
    customerReference: 'CUST-JHB-4402',
    orderAmount: 2775.00, // ZAR
    currency: 'ZAR',
    usdcAmount: 150.00,
    paymentReference: 'BC-ORD-KIGALI-002',
    paymentStatus: 'PENDING',
    createdAt: new Date(Date.now() - 2 * 3600000).toISOString(), // 2 hours ago
  },
  {
    id: 'ord_sample_paid_03',
    merchantId: 'merch_kigali_01',
    customerReference: 'CUST-NBO-1129',
    orderAmount: 4625.00, // ZAR
    currency: 'ZAR',
    usdcAmount: 250.00,
    paymentReference: 'BC-ORD-KIGALI-003',
    paymentStatus: 'PENDING',
    createdAt: new Date(Date.now() - 24 * 3600000).toISOString(), // 1 day ago
  },
  {
    id: 'ord_sample_expired_04',
    merchantId: 'merch_kigali_01',
    customerReference: 'CUST-EBB-9014',
    orderAmount: 555.00, // ZAR
    currency: 'ZAR',
    usdcAmount: 30.00,
    paymentReference: 'BC-ORD-KIGALI-004',
    paymentStatus: 'EXPIRED',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  }
];

export const SEED_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_cust_002',
    orderId: 'ord_sample_paid_02',
    merchantId: 'merch_kigali_01',
    txHash: '0x3e18a902b4d91361c402e3b2e7e31d45763bf45304b2c28892120e891b0c9581',
    tokenContract: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    senderAddress: '0x5380540dC9Ccf4f0521eD5cEa5C53896568205C9',
    recipientAddress: '0x89D24A6b4CcB1B6fAA2625fE562bDD9a23260359',
    amount: 150.00,
    verificationStatus: 'FAILED',
    type: 'CUSTOMER_PAYMENT',
    blockNumber: 19827364,
    timestamp: new Date(Date.now() - 2 * 3600000).toISOString(),
  },
  {
    id: 'tx_cust_003',
    orderId: 'ord_sample_paid_03',
    merchantId: 'merch_kigali_01',
    txHash: '0x8b3294c798028fe2a4d0482bf12cc491902741829bc1265891d2001a4e12e752',
    tokenContract: '0x036CbD53842c5426634e7929541eC2318f3dCF7e',
    senderAddress: '0xAb5801a7D398351b8bE11C439e05C5B3259aeC9B',
    recipientAddress: '0x89D24A6b4CcB1B6fAA2625fE562bDD9a23260359',
    amount: 250.00,
    verificationStatus: 'FAILED',
    type: 'CUSTOMER_PAYMENT',
    blockNumber: 19782103,
    timestamp: new Date(Date.now() - 24 * 3600000).toISOString(),
  }
];

export const SEED_SUPPLIERS: Supplier[] = [
  {
    id: 'supp_cape_agro_01',
    merchantId: 'merch_kigali_01',
    supplierName: 'Cape Agro Packaging Ltd',
    walletAddress: '0x2546BcD3c84621e976D8185a91A922aE77ECEc30',
    approvalStatus: 'APPROVED',
    createdAt: new Date(Date.now() - 40 * 86400000).toISOString(),
  },
  {
    id: 'supp_nairobi_cold_02',
    merchantId: 'merch_kigali_01',
    supplierName: 'Nairobi Cold-Chain Logistics',
    walletAddress: '0xcd3B766CCDd6AE721141F452C550Ca635964ce71',
    approvalStatus: 'APPROVED',
    createdAt: new Date(Date.now() - 35 * 86400000).toISOString(),
  },
  {
    id: 'supp_unapproved_grain_03',
    merchantId: 'merch_kigali_01',
    supplierName: 'Unverified Grain Traders',
    walletAddress: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    approvalStatus: 'PENDING',
    createdAt: new Date(Date.now() - 10 * 86400000).toISOString(),
  }
];

export const SEED_INVOICES: SupplierInvoice[] = [
  {
    id: 'inv_demo_approved_100',
    supplierId: 'supp_cape_agro_01',
    merchantId: 'merch_kigali_01',
    invoiceNumber: 'INV-CAP-2026-081',
    invoiceAmount: 100.00, // Scenario 1: $100 (<= $500 limit, APPROVED)
    currency: 'USDC',
    dueDate: new Date(Date.now() + 5 * 86400000).toISOString(),
    paymentStatus: 'PENDING',
    createdAt: new Date(Date.now() - 2 * 86400000).toISOString(),
  },
  {
    id: 'inv_demo_rejected_700',
    supplierId: 'supp_nairobi_cold_02',
    merchantId: 'merch_kigali_01',
    invoiceNumber: 'INV-NCC-2026-902',
    invoiceAmount: 700.00, // Scenario 2: $700 (> $500 limit, REJECTED)
    currency: 'USDC',
    dueDate: new Date(Date.now() + 3 * 86400000).toISOString(),
    paymentStatus: 'PENDING',
    createdAt: new Date(Date.now() - 1 * 86400000).toISOString(),
  },
  {
    id: 'inv_demo_unapproved_250',
    supplierId: 'supp_unapproved_grain_03',
    merchantId: 'merch_kigali_01',
    invoiceNumber: 'INV-UGT-2026-104',
    invoiceAmount: 250.00,
    currency: 'USDC',
    dueDate: new Date(Date.now() + 8 * 86400000).toISOString(),
    paymentStatus: 'PENDING',
    createdAt: new Date(Date.now() - 3 * 86400000).toISOString(),
  }
];

export const SEED_TREASURY_POLICY: TreasuryPolicy = {
  id: 'pol_kigali_default',
  merchantId: 'merch_kigali_01',
  spendingLimit: 500.00, // $500 spending limit
  approvalRequirements: {
    requireApprovalAbove: 300.00,
    approvedSuppliersOnly: true,
  },
  createdAt: new Date(Date.now() - 30 * 86400000).toISOString(),
  updatedAt: new Date().toISOString(),
};

export const SEED_AUDIT_LOGS: AgentAuditLog[] = [
  {
    id: 'log_init_01',
    merchantId: 'merch_kigali_01',
    agentAction: 'POLICY_INITIALIZED',
    proposedAmount: 500.00,
    supplier: 'System Policy',
    policyDecision: 'APPROVED',
    policyReason: 'Initial treasury policy established with $500.00 spending cap per transaction.',
    executionStatus: 'EXECUTED',
    txHash: null,
    timestamp: new Date(Date.now() - 7 * 86400000).toISOString(),
  }
];
