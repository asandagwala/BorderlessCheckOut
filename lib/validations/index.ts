import { z } from 'zod';

const identifierSchema = z.string().trim().min(1, 'Value is required').max(128, 'Value is too long');
const boundedText = (label: string, min: number, max: number) =>
  z.string().trim().min(min, `${label} must be at least ${min} characters`).max(max, `${label} must be at most ${max} characters`);

// Database numeric columns use precision 14, scale 2. Reject non-finite values
// and values that cannot be represented by those columns before persistence.
const numericInput = z.union([
  z.number().finite(),
  z.string().trim().regex(/^-?\d+(?:\.\d{1,2})?$/, 'Enter a decimal amount with at most two decimal places'),
]);
const twoDecimalPlaces = (value: number) => {
  const cents = value * 100;
  return Number.isSafeInteger(Math.round(cents)) && Math.abs(cents - Math.round(cents)) < 1e-8;
};
const positiveMoneyInput = numericInput
  .transform(value => Number(value))
  .pipe(z.number().finite().positive('Amount must be positive').max(999_999_999_999.99, 'Amount is too large').refine(twoDecimalPlaces, 'Amount must have at most two decimal places'));
const nonNegativeMoneyInput = numericInput
  .transform(value => Number(value))
  .pipe(z.number().finite().nonnegative('Value cannot be negative').max(999_999_999_999.99, 'Value is too large').refine(twoDecimalPlaces, 'Value must have at most two decimal places'));

// Merchant Schemas
export const createMerchantInputSchema = z.strictObject({
  businessName: boundedText('Business name', 2, 120),
  email: z.string().trim().max(254, 'Email address is too long').email('Invalid email address').transform(value => value.toLowerCase()),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid EVM wallet address (0x...)'),
});

export const getMerchantQuerySchema = z.strictObject({
  email: z.string().trim().max(254).email().optional(),
  id: identifierSchema.optional(),
});

export const authChallengeInputSchema = z.strictObject({
  email: z.string().trim().max(254).email().transform(value => value.toLowerCase()),
});

export const authVerifyInputSchema = z.strictObject({
  signature: z.string().regex(/^0x[a-fA-F0-9]{130}$/, 'A 65-byte wallet signature is required.'),
});

// Order Schemas
export const createOrderInputSchema = z.strictObject({
  merchantId: identifierSchema,
  customerReference: boundedText('Customer reference', 1, 120),
  orderAmountZar: positiveMoneyInput,
});

export const getOrdersQuerySchema = z.strictObject({
  merchantId: identifierSchema.optional(),
});

// Checkout Verification Schema
export const verifyPaymentInputSchema = z.strictObject({
  orderId: identifierSchema,
  txHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/, 'txHash must be a valid 32-byte hex string (0x...)'),
});

// AI Chatbot Schema
export const chatMessageInputSchema = z.strictObject({
  merchantId: identifierSchema,
  message: boundedText('Message', 1, 4000),
  history: z.array(z.strictObject({
    role: z.enum(['user', 'assistant']),
    content: boundedText('History message', 1, 4000),
  })).max(20, 'Conversation history cannot exceed 20 messages').optional().default([]),
});

// AI Treasury Agent Action Schema
export const treasuryAgentActionSchema = z.strictObject({
  merchantId: identifierSchema,
  action: z.enum(['RUN_SCENARIO_1', 'RUN_SCENARIO_2', 'RUN_INVOICE']),
  invoiceId: identifierSchema.optional(),
}).refine(data => {
  if (data.action === 'RUN_INVOICE' && !data.invoiceId) return false;
  return true;
}, {
  message: "invoiceId is required when action is 'RUN_INVOICE'",
  path: ['invoiceId'],
});

// Supplier Schemas
export const createSupplierInputSchema = z.strictObject({
  merchantId: identifierSchema,
  supplierName: boundedText('Supplier name', 2, 120),
  walletAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Must be a valid EVM wallet address'),
  approvalStatus: z.enum(['APPROVED', 'PENDING', 'BLOCKED']).default('PENDING'),
});

// Supplier Invoice Schemas
export const createInvoiceInputSchema = z.strictObject({
  merchantId: identifierSchema,
  supplierId: identifierSchema,
  invoiceNumber: boundedText('Invoice number', 1, 100),
  invoiceAmount: positiveMoneyInput,
  dueDate: z.string().datetime().optional(),
});

// Treasury Policy Schemas
export const updatePolicyInputSchema = z.strictObject({
  merchantId: identifierSchema,
  spendingLimit: positiveMoneyInput,
  requireApprovalAbove: nonNegativeMoneyInput.optional().default(300),
  approvedSuppliersOnly: z.boolean().optional().default(true),
}).refine(data => data.requireApprovalAbove <= data.spendingLimit, {
  message: 'Approval threshold cannot exceed the spending limit',
  path: ['requireApprovalAbove'],
});

export type CreateMerchantInput = z.infer<typeof createMerchantInputSchema>;
export type CreateOrderInput = z.infer<typeof createOrderInputSchema>;
export type VerifyPaymentInput = z.infer<typeof verifyPaymentInputSchema>;
export type ChatMessageInput = z.infer<typeof chatMessageInputSchema>;
export type TreasuryAgentAction = z.infer<typeof treasuryAgentActionSchema>;
export type CreateSupplierInput = z.infer<typeof createSupplierInputSchema>;
export type CreateInvoiceInput = z.infer<typeof createInvoiceInputSchema>;
export type UpdatePolicyInput = z.infer<typeof updatePolicyInputSchema>;
