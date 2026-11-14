import { NextResponse } from 'next/server';
import { and, desc, eq, sql } from 'drizzle-orm';
import { verifyMessage } from 'viem';
import { drizzleDb, schema } from '@/lib/database/drizzle/db';
import { parseUnits } from 'viem';

const reasons = ['Customer request', 'Order cancelled', 'Product unavailable', 'Duplicate payment', 'Incorrect order', 'Other'];
const messageFor = (merchantId: string, orderId: string, amount: string, reason: string, key: string) =>
  `Borderless Checkout testnet refund\nMerchant: ${merchantId}\nOrder: ${orderId}\nAmount: ${amount} USDC\nReason: ${reason}\nRequest: ${key}`;

export async function GET(request: Request) {
  if (!drizzleDb) return NextResponse.json({ error: 'Persistent refund storage is required.' }, { status: 503 });
  const merchantId = new URL(request.url).searchParams.get('merchantId');
  if (!merchantId) return NextResponse.json({ error: 'Merchant ID required.' }, { status: 400 });
  const refunds = await drizzleDb.select().from(schema.refunds).where(eq(schema.refunds.merchantId, merchantId)).orderBy(desc(schema.refunds.createdAt));
  return NextResponse.json({ refunds });
}

export async function POST(request: Request) {
  try {
    if (!drizzleDb) return NextResponse.json({ error: 'Refunds require persistent DATABASE_URL storage; in-memory mode is not safe for financial reservations.' }, { status: 503 });
    const body = await request.json();
    const { merchantId, orderId, amount, reason, idempotencyKey, walletAddress, signature } = body ?? {};
    if (![merchantId, orderId, amount, reason, idempotencyKey, walletAddress, signature].every((v) => typeof v === 'string')) return NextResponse.json({ error: 'Invalid refund request.' }, { status: 400 });
    if (!reasons.includes(reason) || !/^\d+(\.\d{1,6})?$/.test(amount) || !/^[a-fA-F0-9-]{16,80}$/.test(idempotencyKey)) return NextResponse.json({ error: 'Invalid reason, USDC amount, or idempotency key.' }, { status: 400 });
    const merchant = await drizzleDb.select().from(schema.merchants).where(eq(schema.merchants.id, merchantId)).limit(1);
    if (!merchant.length || merchant[0].walletAddress.toLowerCase() !== walletAddress.toLowerCase()) return NextResponse.json({ error: 'Connected wallet is not the merchant settlement wallet.' }, { status: 403 });
    const message = messageFor(merchantId, orderId, amount, reason, idempotencyKey);
    if (!await verifyMessage({ address: walletAddress, message, signature })) return NextResponse.json({ error: 'Merchant wallet signature is invalid.' }, { status: 403 });

    const created = await drizzleDb.transaction(async (tx) => {
      await tx.execute(sql`select pg_advisory_xact_lock(hashtext(${orderId}))`);
      const duplicate = await tx.select().from(schema.refunds).where(eq(schema.refunds.idempotencyKey, idempotencyKey)).limit(1);
      if (duplicate.length) return duplicate[0];
      const rows = await tx.select({ order: schema.orders, payment: schema.transactions })
        .from(schema.orders).innerJoin(schema.transactions, eq(schema.transactions.orderId, schema.orders.id))
        .where(and(eq(schema.orders.id, orderId), eq(schema.orders.merchantId, merchantId), eq(schema.orders.paymentStatus, 'PAID'), eq(schema.transactions.type, 'CUSTOMER_PAYMENT'), eq(schema.transactions.verificationStatus, 'VERIFIED'))).limit(1);
      if (!rows.length) throw new Error('Order has no verified paid transaction for this merchant.');
      const { payment } = rows[0];
      const requested = parseUnits(amount, 6);
      const prior = await tx.select({ amount: schema.refunds.amount }).from(schema.refunds)
        .where(and(eq(schema.refunds.orderId, orderId), sql`${schema.refunds.status} in ('PENDING','PROCESSING','COMPLETED')`));
      const reserved = prior.reduce((total, row) => total + parseUnits(String(row.amount), 6), BigInt(0));
      const paid = parseUnits(String(payment.amount), 6);
      if (requested <= BigInt(0) || reserved + requested > paid) throw new Error('Refund exceeds the remaining verified payment amount.');
      const [record] = await tx.insert(schema.refunds).values({
        id: `ref_${crypto.randomUUID()}`, merchantId, orderId, originalPaymentId: payment.id,
        amount, recipientAddress: payment.senderAddress, reason, idempotencyKey, status: 'PENDING', feePayer: 'MERCHANT',
      }).returning();
      return record;
    });
    return NextResponse.json({ refund: created, message: 'Refund reserved. Submit the displayed USDC transfer from the connected merchant wallet.' }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unable to reserve refund.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
