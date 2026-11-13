import { z } from 'zod';

// Merchant Schemas
export const createMerchantInputSchema = z.object({
  businessName: z.string().min(2, 'Business name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid EVM wallet address (0x...)'),
});

export const getMerchantQuerySchema = z.object({
  email: z.string().email().optional(),
  id: z.string().min(1).optional(),
});

// Order Schemas
export const createOrderInputSchema = z.strictObject({
  merchantId: z.string().min(1, 'merchantId is required'),
  customerReference: z.string().min(1, 'customerReference is required'),
  orderAmountZar: z.union([z.number(), z.string()]).transform(val => Number(val)).pipe(z.number().positive('Order amount must be positive')),
});

export const getOrdersQuerySchema = z.object({
  merchantId: z.string().min(1).default('merch_kigali_01'),
});

// Checkout Verification Schema
export const verifyPaymentInputSchema = z.strictObject({
  orderId: z.string().min(1, 'orderId is required'),
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'txHash must be a valid 32-byte hex string (0x...)'),
});

// AI Chatbot Schema
export const chatMessageInputSchema = z.object({
  merchantId: z.string().min(1, 'merchantId is required'),
  message: z.string().min(1, 'message cannot be empty'),
  history: z.array(z.object({
    role: z.enum(['user', 'assistant']),
    content: z.string(),
  })).optional().default([]),
});

// AI Treasury Agent Action Schema
export const treasuryAgentActionSchema = z.object({
  merchantId: z.string().min(1, 'merchantId is required'),
  action: z.enum(['RUN_SCENARIO_1', 'RUN_SCENARIO_2', 'RUN_INVOICE']),
  invoiceId: z.string().optional(),
}).refine(data => {
  if (data.action === 'RUN_INVOICE' && !data.invoiceId) {
    return false;
  }
  return true;
}, {
  message: "invoiceId is required when action is 'RUN_INVOICE'",
  path: ['invoiceId'],
});

// Supplier Schemas
export const createSupplierInputSchema = z.object({
  merchantId: z.string().min(1, 'merchantId is required'),
  supplierName: z.string().min(2, 'Supplier name must be at least 2 characters'),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid EVM wallet address'),
  approvalStatus: z.enum(['APPROVED', 'PENDING', 'BLOCKED']).default('PENDING'),
});

// Supplier Invoice Schemas
export const createInvoiceInputSchema = z.object({
  merchantId: z.string().min(1, 'merchantId is required'),
  supplierId: z.string().min(1, 'supplierId is required'),
  invoiceNumber: z.string().min(1, 'invoiceNumber is required'),
  invoiceAmount: z.union([z.number(), z.string()]).transform(val => Number(val)).pipe(z.number().positive('Invoice amount must be positive')),
  dueDate: z.string().datetime().optional(),
});

// Treasury Policy Schemas
export const updatePolicyInputSchema = z.object({
  merchantId: z.string().min(1, 'merchantId is required'),
  spendingLimit: z.union([z.number(), z.string()]).transform(val => Number(val)).pipe(z.number().positive('Spending limit must be positive')),
  requireApprovalAbove: z.union([z.number(), z.string()]).optional().transform(val => val !== undefined ? Number(val) : 300),
  approvedSuppliersOnly: z.boolean().optional().default(true),
});

export type CreateMerchantInput = z.infer<typeof createMerchantInputSchema>;
export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentInputSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageInputSchema>;
export type TreasuryAgentAction = z.infer<typeof treasuryAgentActionSchema>;
export type CreateSupplierInput = z.infer<typeof createSupplierInputSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceInputSchema>;
export type UpdatePolicyInput = z.infer<typeof updatePolicyInputSchema>;
