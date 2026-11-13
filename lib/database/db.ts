import { 
  Merchant, 
  Order, 
  Transaction, 
  Supplier, 
  SupplierInvoice, 
  TreasuryPolicy, 
  AgentAuditLog,
  PaymentStatus,
  InvoiceStatus,
  ApprovalStatus,
  PolicyDecision,
  ExecutionStatus
} from './types';
import { 
  SEED_MERCHANTS, 
  SEED_ORDERS, 
  SEED_TRANSACTIONS, 
  SEED_SUPPLIERS, 
  SEED_INVOICES, 
  SEED_TREASURY_POLICY, 
  SEED_AUDIT_LOGS 
} from './seed-data';
import { drizzleDb, schema } from './drizzle/db';
import { eq, desc, and } from 'drizzle-orm';

// In-Memory store initialized with rich seed data for immediate evaluation & test stability
class MemoryStore {
  merchants: Map<string, Merchant> = new Map();
  orders: Map<string, Order> = new Map();
  transactions: Map<string, Transaction> = new Map();
  suppliers: Map<string, Supplier> = new Map();
  invoices: Map<string, SupplierInvoice> = new Map();
  policies: Map<string, TreasuryPolicy> = new Map();
  auditLogs: AgentAuditLog[] = [];

  constructor() {
    this.reset();
  }

  reset() {
    this.merchants.clear();
    this.orders.clear();
    this.transactions.clear();
    this.suppliers.clear();
    this.invoices.clear();
    this.policies.clear();
    this.auditLogs = [];

    SEED_MERCHANTS.forEach(m => this.merchants.set(m.id, { ...m }));
    SEED_ORDERS.forEach(o => this.orders.set(o.id, { ...o }));
    SEED_TRANSACTIONS.forEach(t => this.transactions.set(t.id, { ...t }));
    SEED_SUPPLIERS.forEach(s => this.suppliers.set(s.id, { ...s }));
    SEED_INVOICES.forEach(i => this.invoices.set(i.id, { ...i }));
    this.policies.set(SEED_TREASURY_POLICY.merchantId, { ...SEED_TREASURY_POLICY });
    this.auditLogs = SEED_AUDIT_LOGS.map(a => ({ ...a }));
  }
}

// Global singleton memory store for development hot reloading
const globalForStore = globalThis as unknown as { appStore?: MemoryStore };
export const memoryStore = globalForStore.appStore ?? new MemoryStore();
if (process.env.NODE_ENV !== 'production') globalForStore.appStore = memoryStore;

export const db = {
  // Merchant repository
  async getMerchantById(id: string): Promise<Merchant | null> {
    if (drizzleDb) {
      const rows = await drizzleDb.select().from(schema.merchants).where(eq(schema.merchants.id, id)).limit(1);
      if (rows.length > 0) {
        const r = rows[0];
        return {
          id: r.id,
          businessName: r.businessName,
          email: r.email,
          walletAddress: r.walletAddress,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt?.toISOString(),
        };
      }
    }
    return memoryStore.merchants.get(id) || null;
  },

  async getMerchantByEmail(email: string): Promise<Merchant | null> {
    if (drizzleDb) {
      const rows = await drizzleDb.select().from(schema.merchants).where(eq(schema.merchants.email, email)).limit(1);
      if (rows.length > 0) {
        const r = rows[0];
        return {
          id: r.id,
          businessName: r.businessName,
          email: r.email,
          walletAddress: r.walletAddress,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt?.toISOString(),
        };
      }
    }
    for (const m of memoryStore.merchants.values()) {
      if (m.email.toLowerCase() === email.toLowerCase()) return m;
    }
    return null;
  },

  async getAllMerchants(): Promise<Merchant[]> {
    if (drizzleDb) {
      const rows = await drizzleDb.select().from(schema.merchants);
      return rows.map(r => ({
        id: r.id,
        businessName: r.businessName,
        email: r.email,
        walletAddress: r.walletAddress,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt?.toISOString(),
      }));
    }
    return Array.from(memoryStore.merchants.values());
  },

  async createMerchant(merchant: Merchant): Promise<Merchant> {
    if (drizzleDb) {
      await drizzleDb.insert(schema.merchants).values({
        id: merchant.id,
        businessName: merchant.businessName,
        email: merchant.email,
        walletAddress: merchant.walletAddress,
      });
    }
    memoryStore.merchants.set(merchant.id, merchant);
    return merchant;
  },

  async updateMerchantWalletAddress(id: string, walletAddress: string): Promise<Merchant | null> {
    if (drizzleDb) {
      await drizzleDb.update(schema.merchants)
        .set({ walletAddress, updatedAt: new Date() })
        .where(eq(schema.merchants.id, id));
    }

    const existing = await this.getMerchantById(id);
    if (!existing) return null;

    const updated = { ...existing, walletAddress, updatedAt: new Date().toISOString() };
    memoryStore.merchants.set(id, updated);
    return updated;
  },

  // Orders repository
  async getOrderById(id: string): Promise<Order | null> {
    if (drizzleDb) {
      const rows = await drizzleDb.select().from(schema.orders).where(eq(schema.orders.id, id)).limit(1);
      if (rows.length > 0) {
        const r = rows[0];
        return {
          id: r.id,
          merchantId: r.merchantId,
          customerReference: r.customerReference,
          orderAmount: Number(r.orderAmount),
          currency: r.currency,
          usdcAmount: Number(r.usdcAmount),
          paymentReference: r.paymentReference,
          paymentStatus: r.paymentStatus as PaymentStatus,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt?.toISOString(),
        };
      }
    }
    return memoryStore.orders.get(id) || null;
  },

  async getOrderByPaymentReference(ref: string): Promise<Order | null> {
    if (drizzleDb) {
      const rows = await drizzleDb.select().from(schema.orders).where(eq(schema.orders.paymentReference, ref)).limit(1);
      if (rows.length > 0) {
        const r = rows[0];
        return {
          id: r.id,
          merchantId: r.merchantId,
          customerReference: r.customerReference,
          orderAmount: Number(r.orderAmount),
          currency: r.currency,
          usdcAmount: Number(r.usdcAmount),
          paymentReference: r.paymentReference,
          paymentStatus: r.paymentStatus as PaymentStatus,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt?.toISOString(),
        };
      }
    }
    for (const o of memoryStore.orders.values()) {
      if (o.paymentReference === ref) return o;
    }
    return null;
  },

  async getOrdersByMerchantId(merchantId: string): Promise<Order[]> {
    if (drizzleDb) {
      const rows = await drizzleDb.select().from(schema.orders)
        .where(eq(schema.orders.merchantId, merchantId))
        .orderBy(desc(schema.orders.createdAt));
      return rows.map(r => ({
        id: r.id,
        merchantId: r.merchantId,
        customerReference: r.customerReference,
        orderAmount: Number(r.orderAmount),
        currency: r.currency,
        usdcAmount: Number(r.usdcAmount),
        paymentReference: r.paymentReference,
        paymentStatus: r.paymentStatus as PaymentStatus,
        createdAt: r.createdAt.toISOString(),
        updatedAt: r.updatedAt?.toISOString(),
      }));
    }
    return Array.from(memoryStore.orders.values())
      .filter(o => o.merchantId === merchantId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async createOrder(order: Order): Promise<Order> {
    if (drizzleDb) {
      await drizzleDb.insert(schema.orders).values({
        id: order.id,
        merchantId: order.merchantId,
        customerReference: order.customerReference,
        orderAmount: order.orderAmount.toString(),
        currency: order.currency,
        usdcAmount: order.usdcAmount.toString(),
        paymentReference: order.paymentReference,
        paymentStatus: order.paymentStatus,
      });
    }
    memoryStore.orders.set(order.id, order);
    return order;
  },

  async updateOrderStatus(id: string, status: PaymentStatus): Promise<Order | null> {
    const updatedAt = new Date().toISOString();
    if (drizzleDb) {
      await drizzleDb.update(schema.orders)
        .set({ paymentStatus: status, updatedAt: new Date() })
        .where(eq(schema.orders.id, id));
    }
    const order = memoryStore.orders.get(id);
    if (order) {
      order.paymentStatus = status;
      order.updatedAt = updatedAt;
      memoryStore.orders.set(id, order);
      return order;
    }
    return null;
  },

  // Transactions repository
  async getTransactionByHash(txHash: string): Promise<Transaction | null> {
    if (drizzleDb) {
      const rows = await drizzleDb.select().from(schema.transactions)
        .where(eq(schema.transactions.txHash, txHash.toLowerCase())).limit(1);
      if (rows.length > 0) {
        const r = rows[0];
        return {
          id: r.id,
          orderId: r.orderId,
          merchantId: r.merchantId,
          txHash: r.txHash,
          tokenContract: r.tokenContract,
          senderAddress: r.senderAddress,
          recipientAddress: r.recipientAddress,
          amount: Number(r.amount),
          verificationStatus: r.verificationStatus as any,
          type: r.type as any,
          blockNumber: r.blockNumber,
          timestamp: r.timestamp.toISOString(),
        };
      }
    }
    for (const t of memoryStore.transactions.values()) {
      if (t.txHash.toLowerCase() === txHash.toLowerCase()) return t;
    }
    return null;
  },

  async getTransactionsByMerchantId(merchantId: string): Promise<Transaction[]> {
    if (drizzleDb) {
      const rows = await drizzleDb.select().from(schema.transactions)
        .where(eq(schema.transactions.merchantId, merchantId))
        .orderBy(desc(schema.transactions.timestamp));
      return rows.map(r => ({
        id: r.id,
        orderId: r.orderId,
        merchantId: r.merchantId,
        txHash: r.txHash,
        tokenContract: r.tokenContract,
        senderAddress: r.senderAddress,
        recipientAddress: r.recipientAddress,
        amount: Number(r.amount),
        verificationStatus: r.verificationStatus as any,
        type: r.type as any,
        blockNumber: r.blockNumber,
        timestamp: r.timestamp.toISOString(),
      }));
    }
    return Array.from(memoryStore.transactions.values())
      .filter(t => t.merchantId === merchantId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async createTransaction(tx: Transaction): Promise<Transaction> {
    if (drizzleDb) {
      await drizzleDb.insert(schema.transactions).values({
        id: tx.id,
        orderId: tx.orderId || null,
        merchantId: tx.merchantId,
        txHash: tx.txHash.toLowerCase(),
        tokenContract: tx.tokenContract,
        senderAddress: tx.senderAddress,
        recipientAddress: tx.recipientAddress,
        amount: tx.amount.toString(),
        verificationStatus: tx.verificationStatus,
        type: tx.type,
        blockNumber: tx.blockNumber || null,
      });
    }
    memoryStore.transactions.set(tx.id, tx);
    return tx;
  },

  // Suppliers repository
  async getSuppliersByMerchantId(merchantId: string): Promise<Supplier[]> {
    if (drizzleDb) {
      const rows = await drizzleDb.select().from(schema.suppliers)
        .where(eq(schema.suppliers.merchantId, merchantId));
      return rows.map(r => ({
        id: r.id,
        merchantId: r.merchantId,
        supplierName: r.supplierName,
        walletAddress: r.walletAddress,
        approvalStatus: r.approvalStatus as ApprovalStatus,
        createdAt: r.createdAt.toISOString(),
      }));
    }
    return Array.from(memoryStore.suppliers.values())
      .filter(s => s.merchantId === merchantId);
  },

  async getSupplierById(id: string): Promise<Supplier | null> {
    if (drizzleDb) {
      const rows = await drizzleDb.select().from(schema.suppliers).where(eq(schema.suppliers.id, id)).limit(1);
      if (rows.length > 0) {
        const r = rows[0];
        return {
          id: r.id,
          merchantId: r.merchantId,
          supplierName: r.supplierName,
          walletAddress: r.walletAddress,
          approvalStatus: r.approvalStatus as ApprovalStatus,
          createdAt: r.createdAt.toISOString(),
        };
      }
    }
    return memoryStore.suppliers.get(id) || null;
  },

  async createSupplier(supplier: Supplier): Promise<Supplier> {
    if (drizzleDb) {
      await drizzleDb.insert(schema.suppliers).values({
        id: supplier.id,
        merchantId: supplier.merchantId,
        supplierName: supplier.supplierName,
        walletAddress: supplier.walletAddress,
        approvalStatus: supplier.approvalStatus,
      });
    }
    memoryStore.suppliers.set(supplier.id, supplier);
    return supplier;
  },

  async updateSupplierStatus(id: string, status: ApprovalStatus): Promise<Supplier | null> {
    if (drizzleDb) {
      await drizzleDb.update(schema.suppliers)
        .set({ approvalStatus: status, updatedAt: new Date() })
        .where(eq(schema.suppliers.id, id));
    }
    const supp = memoryStore.suppliers.get(id);
    if (supp) {
      supp.approvalStatus = status;
      memoryStore.suppliers.set(id, supp);
      return supp;
    }
    return null;
  },

  // Supplier Invoices repository
  async getInvoicesByMerchantId(merchantId: string): Promise<SupplierInvoice[]> {
    if (drizzleDb) {
      const rows = await drizzleDb.select().from(schema.supplierInvoices)
        .where(eq(schema.supplierInvoices.merchantId, merchantId))
        .orderBy(desc(schema.supplierInvoices.createdAt));
      return rows.map(r => ({
        id: r.id,
        supplierId: r.supplierId,
        merchantId: r.merchantId,
        invoiceNumber: r.invoiceNumber,
        invoiceAmount: Number(r.invoiceAmount),
        currency: r.currency,
        dueDate: r.dueDate.toISOString(),
        paymentStatus: r.paymentStatus as InvoiceStatus,
        createdAt: r.createdAt.toISOString(),
      }));
    }
    return Array.from(memoryStore.invoices.values())
      .filter(i => i.merchantId === merchantId)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getInvoiceById(id: string): Promise<SupplierInvoice | null> {
    if (drizzleDb) {
      const rows = await drizzleDb.select().from(schema.supplierInvoices).where(eq(schema.supplierInvoices.id, id)).limit(1);
      if (rows.length > 0) {
        const r = rows[0];
        return {
          id: r.id,
          supplierId: r.supplierId,
          merchantId: r.merchantId,
          invoiceNumber: r.invoiceNumber,
          invoiceAmount: Number(r.invoiceAmount),
          currency: r.currency,
          dueDate: r.dueDate.toISOString(),
          paymentStatus: r.paymentStatus as InvoiceStatus,
          createdAt: r.createdAt.toISOString(),
        };
      }
    }
    return memoryStore.invoices.get(id) || null;
  },

  async updateInvoiceStatus(id: string, status: InvoiceStatus): Promise<SupplierInvoice | null> {
    if (drizzleDb) {
      await drizzleDb.update(schema.supplierInvoices)
        .set({ paymentStatus: status, updatedAt: new Date() })
        .where(eq(schema.supplierInvoices.id, id));
    }
    const inv = memoryStore.invoices.get(id);
    if (inv) {
      inv.paymentStatus = status;
      memoryStore.invoices.set(id, inv);
      return inv;
    }
    return null;
  },

  async createInvoice(invoice: SupplierInvoice): Promise<SupplierInvoice> {
    if (drizzleDb) {
      await drizzleDb.insert(schema.supplierInvoices).values({
        id: invoice.id,
        supplierId: invoice.supplierId,
        merchantId: invoice.merchantId,
        invoiceNumber: invoice.invoiceNumber,
        invoiceAmount: invoice.invoiceAmount.toString(),
        currency: invoice.currency,
        dueDate: new Date(invoice.dueDate),
        paymentStatus: invoice.paymentStatus,
      });
    }
    memoryStore.invoices.set(invoice.id, invoice);
    return invoice;
  },

  // Treasury Policy repository
  async getPolicyByMerchantId(merchantId: string): Promise<TreasuryPolicy | null> {
    if (drizzleDb) {
      const rows = await drizzleDb.select().from(schema.treasuryPolicies)
        .where(eq(schema.treasuryPolicies.merchantId, merchantId)).limit(1);
      if (rows.length > 0) {
        const r = rows[0];
        return {
          id: r.id,
          merchantId: r.merchantId,
          spendingLimit: Number(r.spendingLimit),
          approvalRequirements: r.approvalRequirements as any,
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt?.toISOString(),
        };
      }
    }
    return memoryStore.policies.get(merchantId) || null;
  },

  async updatePolicy(policy: TreasuryPolicy): Promise<TreasuryPolicy> {
    const updatedAt = new Date().toISOString();
    policy.updatedAt = updatedAt;
    if (drizzleDb) {
      await drizzleDb.insert(schema.treasuryPolicies).values({
        id: policy.id,
        merchantId: policy.merchantId,
        spendingLimit: policy.spendingLimit.toString(),
        approvalRequirements: policy.approvalRequirements,
        updatedAt: new Date(),
      }).onConflictDoUpdate({
        target: schema.treasuryPolicies.merchantId,
        set: {
          spendingLimit: policy.spendingLimit.toString(),
          approvalRequirements: policy.approvalRequirements,
          updatedAt: new Date(),
        }
      });
    }
    memoryStore.policies.set(policy.merchantId, policy);
    return policy;
  },

  // Audit Logs repository
  async getAuditLogsByMerchantId(merchantId: string): Promise<AgentAuditLog[]> {
    if (drizzleDb) {
      const rows = await drizzleDb.select().from(schema.agentAuditLogs)
        .where(eq(schema.agentAuditLogs.merchantId, merchantId))
        .orderBy(desc(schema.agentAuditLogs.timestamp));
      return rows.map(r => ({
        id: r.id,
        merchantId: r.merchantId,
        agentAction: r.agentAction,
        proposedAmount: r.proposedAmount ? Number(r.proposedAmount) : undefined,
        supplier: r.supplier || undefined,
        policyDecision: r.policyDecision as PolicyDecision,
        policyReason: r.policyReason || undefined,
        executionStatus: r.executionStatus as ExecutionStatus,
        txHash: r.txHash,
        timestamp: r.timestamp.toISOString(),
      }));
    }
    return memoryStore.auditLogs
      .filter(l => l.merchantId === merchantId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  async createAuditLog(log: AgentAuditLog): Promise<AgentAuditLog> {
    if (drizzleDb) {
      await drizzleDb.insert(schema.agentAuditLogs).values({
        id: log.id,
        merchantId: log.merchantId,
        agentAction: log.agentAction,
        proposedAmount: log.proposedAmount?.toString(),
        supplier: log.supplier,
        policyDecision: log.policyDecision,
        policyReason: log.policyReason,
        executionStatus: log.executionStatus,
        txHash: log.txHash,
      });
    }
    memoryStore.auditLogs.unshift(log);
    return log;
  },

  // Global reset for testing
  resetMemoryStore() {
    memoryStore.reset();
  }
};
