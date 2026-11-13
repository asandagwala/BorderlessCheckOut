import { pgTable, text, numeric, timestamp, jsonb, bigint, varchar } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema, createSelectSchema } from 'drizzle-zod';

// 1. Merchants Table
export const merchants = pgTable('merchants', {
  id: text('id').primaryKey(),
  businessName: text('business_name').notNull(),
  email: text('email').unique().notNull(),
  walletAddress: text('wallet_address').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 2. Orders Table
export const orders = pgTable('orders', {
  id: text('id').primaryKey(),
  merchantId: text('merchant_id').notNull().references(() => merchants.id, { onDelete: 'cascade' }),
  customerReference: text('customer_reference').notNull(),
  orderAmount: numeric('order_amount', { precision: 14, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('ZAR').notNull(),
  usdcAmount: numeric('usdc_amount', { precision: 14, scale: 6 }).notNull(),
  paymentReference: text('payment_reference').unique().notNull(),
  paymentStatus: varchar('payment_status', { length: 20 }).default('PENDING').notNull(), // PENDING, CONFIRMING, PAID, FAILED, EXPIRED
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 3. Transactions Table
export const transactions = pgTable('transactions', {
  id: text('id').primaryKey(),
  orderId: text('order_id').references(() => orders.id, { onDelete: 'set null' }),
  merchantId: text('merchant_id').notNull().references(() => merchants.id, { onDelete: 'cascade' }),
  txHash: text('tx_hash').unique().notNull(),
  tokenContract: text('token_contract').default('0x036CbD53842c5426634e7929541eC2318f3dCF7e').notNull(),
  senderAddress: text('sender_address').notNull(),
  recipientAddress: text('recipient_address').notNull(),
  amount: numeric('amount', { precision: 14, scale: 6 }).notNull(),
  verificationStatus: varchar('verification_status', { length: 20 }).default('VERIFIED').notNull(), // PENDING, VERIFIED, FAILED
  type: varchar('type', { length: 30 }).default('CUSTOMER_PAYMENT').notNull(), // CUSTOMER_PAYMENT, SUPPLIER_PAYOUT
  blockNumber: bigint('block_number', { mode: 'number' }),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
});

// 4. Suppliers Table
export const suppliers = pgTable('suppliers', {
  id: text('id').primaryKey(),
  merchantId: text('merchant_id').notNull().references(() => merchants.id, { onDelete: 'cascade' }),
  supplierName: text('supplier_name').notNull(),
  walletAddress: text('wallet_address').notNull(),
  approvalStatus: varchar('approval_status', { length: 20 }).default('PENDING').notNull(), // APPROVED, PENDING, BLOCKED
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 5. Supplier Invoices Table
export const supplierInvoices = pgTable('supplier_invoices', {
  id: text('id').primaryKey(),
  supplierId: text('supplier_id').notNull().references(() => suppliers.id, { onDelete: 'cascade' }),
  merchantId: text('merchant_id').notNull().references(() => merchants.id, { onDelete: 'cascade' }),
  invoiceNumber: text('invoice_number').notNull(),
  invoiceAmount: numeric('invoice_amount', { precision: 14, scale: 2 }).notNull(),
  currency: varchar('currency', { length: 10 }).default('USDC').notNull(),
  dueDate: timestamp('due_date', { withTimezone: true }).notNull(),
  paymentStatus: varchar('payment_status', { length: 20 }).default('PENDING').notNull(), // PENDING, PAID, REJECTED, APPROVAL_REQUIRED
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 6. Treasury Policies Table
export const treasuryPolicies = pgTable('treasury_policies', {
  id: text('id').primaryKey(),
  merchantId: text('merchant_id').unique().notNull().references(() => merchants.id, { onDelete: 'cascade' }),
  spendingLimit: numeric('spending_limit', { precision: 14, scale: 2 }).default('500.00').notNull(),
  approvalRequirements: jsonb('approval_requirements').$type<{
    requireApprovalAbove: number;
    approvedSuppliersOnly: boolean;
  }>().default({ requireApprovalAbove: 300, approvedSuppliersOnly: true }).notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow(),
});

// 7. Agent Audit Logs Table
export const agentAuditLogs = pgTable('agent_audit_logs', {
  id: text('id').primaryKey(),
  merchantId: text('merchant_id').notNull().references(() => merchants.id, { onDelete: 'cascade' }),
  agentAction: varchar('agent_action', { length: 50 }).notNull(),
  proposedAmount: numeric('proposed_amount', { precision: 14, scale: 2 }),
  supplier: text('supplier'),
  policyDecision: varchar('policy_decision', { length: 30 }).notNull(), // APPROVED, REJECTED, REQUIRES_APPROVAL
  policyReason: text('policy_reason'),
  executionStatus: varchar('execution_status', { length: 30 }).notNull(), // SUBMITTED, EXECUTED, BLOCKED, PENDING_APPROVAL, FAILED
  txHash: text('tx_hash'),
  timestamp: timestamp('timestamp', { withTimezone: true }).defaultNow().notNull(),
});

// Relations
export const merchantsRelations = relations(merchants, ({ many, one }) => ({
  orders: many(orders),
  transactions: many(transactions),
  suppliers: many(suppliers),
  invoices: many(supplierInvoices),
  policy: one(treasuryPolicies, {
    fields: [merchants.id],
    references: [treasuryPolicies.merchantId],
  }),
  auditLogs: many(agentAuditLogs),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  merchant: one(merchants, {
    fields: [orders.merchantId],
    references: [merchants.id],
  }),
  transactions: many(transactions),
}));

export const suppliersRelations = relations(suppliers, ({ one, many }) => ({
  merchant: one(merchants, {
    fields: [suppliers.merchantId],
    references: [merchants.id],
  }),
  invoices: many(supplierInvoices),
}));

export const supplierInvoicesRelations = relations(supplierInvoices, ({ one }) => ({
  merchant: one(merchants, {
    fields: [supplierInvoices.merchantId],
    references: [merchants.id],
  }),
  supplier: one(suppliers, {
    fields: [supplierInvoices.supplierId],
    references: [suppliers.id],
  }),
}));

export type DrizzleMerchant = typeof merchants.$inferSelect;
export type DrizzleOrder = typeof orders.$inferSelect;
export type DrizzleTransaction = typeof transactions.$inferSelect;
export type DrizzleSupplier = typeof suppliers.$inferSelect;
export type DrizzleSupplierInvoice = typeof supplierInvoices.$inferSelect;
export type DrizzleTreasuryPolicy = typeof treasuryPolicies.$inferSelect;
export type DrizzleAgentAuditLog = typeof agentAuditLogs.$inferSelect;

// Drizzle-Zod Schemas for Type-Safe Validation
export const insertMerchantSchema = createInsertSchema(merchants);
export const selectMerchantSchema = createSelectSchema(merchants);

export const insertOrderSchema = createInsertSchema(orders);
export const selectOrderSchema = createSelectSchema(orders);

export const insertTransactionSchema = createInsertSchema(transactions);
export const selectTransactionSchema = createSelectSchema(transactions);

export const insertSupplierSchema = createInsertSchema(suppliers);
export const selectSupplierSchema = createSelectSchema(suppliers);

export const insertSupplierInvoiceSchema = createInsertSchema(supplierInvoices);
export const selectSupplierInvoiceSchema = createSelectSchema(supplierInvoices);

export const insertTreasuryPolicySchema = createInsertSchema(treasuryPolicies);
export const selectTreasuryPolicySchema = createSelectSchema(treasuryPolicies);

export const insertAgentAuditLogSchema = createInsertSchema(agentAuditLogs);
export const selectAgentAuditLogSchema = createSelectSchema(agentAuditLogs);
