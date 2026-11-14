import { randomUUID } from 'node:crypto';
import { db } from '@/lib/database/db';
import { CashOutQuote, CashOutSummary, SimulatedPayout } from './types';
import { MockOfframpProvider } from './mock-offramp.provider';

const RATE = 18.5;
const FEE_PERCENT = 1;
const PER_PAYOUT_CAP = 1000;
const DAILY_CAP = 2000;
const QUOTE_TTL_MS = 5 * 60 * 1000;
const DESTINATION = 'Demo SA bank account •••• 4242';

type CashOutState = { quotes: Map<string, CashOutQuote>; payouts: Map<string, SimulatedPayout>; locks: Map<string, Promise<void>> };
const globalCashOut = globalThis as typeof globalThis & { __cashOutDemo?: CashOutState };
const state = globalCashOut.__cashOutDemo ??= { quotes: new Map(), payouts: new Map(), locks: new Map() };

function units(value: number) { return BigInt(Math.round((Number(value) || 0) * 1_000_000)); }
function usdc(value: bigint) { return Number(value) / 1_000_000; }
function roundDiv(numerator: bigint, denominator: bigint) { return (numerator + denominator / BigInt(2)) / denominator; }
function localDay(date = new Date()) { return date.toISOString().slice(0, 10); }

async function serialize<T>(merchantId: string, task: () => Promise<T>): Promise<T> {
  const prior = state.locks.get(merchantId) ?? Promise.resolve();
  let release!: () => void;
  const current = new Promise<void>((resolve) => { release = resolve; });
  const queued = prior.then(() => current);
  state.locks.set(merchantId, queued);
  await prior;
  try { return await task(); }
  finally { release(); if (state.locks.get(merchantId) === queued) state.locks.delete(merchantId); }
}

function settleReadyPayouts(merchantId: string) {
  const now = Date.now();
  for (const [id, payout] of state.payouts) {
    if (payout.merchantId === merchantId && payout.status === 'PROCESSING' && now - new Date(payout.createdAt).getTime() >= 1800) {
      state.payouts.set(id, { ...payout, status: 'PAID', completedAt: new Date().toISOString() });
    }
  }
}

export class CashOutService {
  static async getSummary(merchantId: string, reserveUsdc = 50): Promise<CashOutSummary> {
    const merchant = await db.getMerchantById(merchantId);
    if (!merchant) throw new Error('Merchant not found.');
    const [transactions, invoices] = await Promise.all([db.getTransactionsByMerchantId(merchantId), db.getInvoicesByMerchantId(merchantId)]);
    const verifiedReceived = transactions.filter((tx) => tx.verificationStatus === 'VERIFIED' && tx.type === 'CUSTOMER_PAYMENT').reduce((sum, tx) => sum + units(tx.amount), BigInt(0));
    const supplierPaid = transactions.filter((tx) => tx.verificationStatus === 'VERIFIED' && tx.type === 'SUPPLIER_PAYOUT').reduce((sum, tx) => sum + units(tx.amount), BigInt(0));
    const commitments = invoices.filter((invoice) => invoice.paymentStatus === 'PENDING' || invoice.paymentStatus === 'APPROVAL_REQUIRED').reduce((sum, invoice) => sum + units(invoice.invoiceAmount), BigInt(0));
    settleReadyPayouts(merchantId);
    const merchantPayouts = [...state.payouts.values()].filter((payout) => payout.merchantId === merchantId);
    const usedPayouts = merchantPayouts.filter((payout) => payout.status === 'PROCESSING' || payout.status === 'PAID').reduce((sum, payout) => sum + units(payout.amountUsdc), BigInt(0));
    const dayTotal = merchantPayouts.filter((payout) => localDay(new Date(payout.createdAt)) === localDay() && (payout.status === 'PROCESSING' || payout.status === 'PAID')).reduce((sum, payout) => sum + units(payout.amountUsdc), BigInt(0));
    const reserve = units(reserveUsdc);
    const available = verifiedReceived - supplierPaid - commitments - usedPayouts - reserve;
    return {
      merchantId, merchantName: merchant.businessName,
      verifiedReceivedUsdc: usdc(verifiedReceived), verifiedSupplierPayoutsUsdc: usdc(supplierPaid),
      supplierCommitmentsUsdc: usdc(commitments), activeCashOutsUsdc: usdc(usedPayouts),
      safetyReserveUsdc: usdc(reserve), availableUsdc: usdc(available > BigInt(0) ? available : BigInt(0)),
      destinationLabel: DESTINATION, rateZarPerUsdc: RATE, simulatedFeePercent: FEE_PERCENT,
      perPayoutCapUsdc: PER_PAYOUT_CAP, dailyCapUsdc: DAILY_CAP, todayPaidAndProcessingUsdc: usdc(dayTotal),
      sourceNote: 'Ledger-based demo availability: verified incoming customer payments less verified supplier payouts, pending/approval-required supplier invoices, simulated cash-outs, and the selected safety reserve. This is not a live token balance.',
    };
  }

  static async createQuote(merchantId: string, amountUsdc: number, reserveUsdc: number): Promise<CashOutQuote> {
    return serialize(merchantId, async () => {
      if (!Number.isFinite(amountUsdc) || amountUsdc <= 0) throw new Error('Enter a cash-out amount greater than zero.');
      if (!Number.isFinite(reserveUsdc) || reserveUsdc < 0) throw new Error('Safety reserve cannot be negative.');
      if (amountUsdc > PER_PAYOUT_CAP) throw new Error(`Per-payout demo cap is ${PER_PAYOUT_CAP} USDC.`);
      const summary = await this.getSummary(merchantId, reserveUsdc);
      if (amountUsdc > summary.availableUsdc) throw new Error(`Requested amount exceeds available ${summary.availableUsdc.toFixed(6)} USDC after supplier commitments and reserve.`);
      if (summary.todayPaidAndProcessingUsdc + amountUsdc > DAILY_CAP) throw new Error(`Daily demo cash-out cap is ${DAILY_CAP} USDC; ${Math.max(0, DAILY_CAP - summary.todayPaidAndProcessingUsdc).toFixed(6)} USDC remains today.`);
      const sourceUnits = units(amountUsdc);
      const grossCents = roundDiv(sourceUnits * BigInt(1850), BigInt(1_000_000));
      const feeCents = roundDiv(grossCents * BigInt(FEE_PERCENT), BigInt(100));
      const quote: CashOutQuote = {
        id: randomUUID(), merchantId, amountUsdc: usdc(sourceUnits), reserveUsdc: summary.safetyReserveUsdc,
        exchangeRate: RATE, feePercent: FEE_PERCENT, grossZar: Number(grossCents) / 100,
        feeZar: Number(feeCents) / 100, netZar: Number(grossCents - feeCents) / 100,
        currency: 'ZAR', destinationLabel: DESTINATION,
        expiresAt: new Date(Date.now() + QUOTE_TTL_MS).toISOString(), status: 'QUOTED',
        audit: {
          merchantId, merchantName: summary.merchantName, verifiedReceivedUsdc: summary.verifiedReceivedUsdc,
          verifiedSupplierPayoutsUsdc: summary.verifiedSupplierPayoutsUsdc, supplierCommitmentsUsdc: summary.supplierCommitmentsUsdc,
          activeCashOutsUsdc: summary.activeCashOutsUsdc, safetyReserveUsdc: summary.safetyReserveUsdc,
          availableUsdc: summary.availableUsdc, sourceNote: summary.sourceNote,
        },
      };
      state.quotes.set(quote.id, quote);
      return quote;
    });
  }

  static async submit(quoteId: string, merchantId: string, confirmed: boolean): Promise<SimulatedPayout> {
    return serialize(merchantId, async () => {
      if (confirmed !== true) throw new Error('Explicit confirmation is required.');
      const quote = state.quotes.get(quoteId);
      if (!quote || quote.merchantId !== merchantId) throw new Error('Quote was not found for this merchant.');
      if (state.payouts.has(quoteId)) throw new Error('This quote has already been submitted.');
      if (Date.now() > new Date(quote.expiresAt).getTime()) throw new Error('Quote expired. Request a new quote.');
      const summary = await this.getSummary(merchantId, quote.reserveUsdc);
      if (quote.amountUsdc > summary.availableUsdc) throw new Error('Available balance changed after this quote. Request a new quote.');
      if (quote.amountUsdc > PER_PAYOUT_CAP || summary.todayPaidAndProcessingUsdc + quote.amountUsdc > DAILY_CAP) throw new Error('A demo payout limit would be exceeded.');
      const payout = { ...quote, status: 'PROCESSING' as const, reference: `DEMO-PAYOUT-${quote.id.slice(-10).toUpperCase()}`, createdAt: new Date().toISOString() };
      const providerResult = await MockOfframpProvider.submit(payout);
      const accepted = { ...payout, ...providerResult };
      state.payouts.set(quoteId, accepted);
      state.quotes.delete(quoteId);
      return accepted;
    });
  }

  static async history(merchantId: string) {
    settleReadyPayouts(merchantId);
    return [...state.payouts.values()].filter((payout) => payout.merchantId === merchantId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}
