import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { decodeEventLog, parseUnits } from 'viem';
import { drizzleDb, schema } from '@/lib/database/drizzle/db';
import { publicClient } from '@/modules/blockchain/viem-client';
import { CHAIN_CONFIG, ERC20_ABI } from '@/modules/blockchain/config';

export async function POST(request: Request) {
  try {
    if (!drizzleDb) return NextResponse.json({ error: 'Persistent refund storage is required.' }, { status: 503 });
    const { refundId, txHash } = await request.json();
    if (typeof refundId !== 'string' || typeof txHash !== 'string' || !/^0x[a-fA-F0-9]{64}$/.test(txHash)) return NextResponse.json({ error: 'A valid refund ID and transaction hash are required.' }, { status: 400 });
    if (await publicClient.getChainId() !== CHAIN_CONFIG.chainId) return NextResponse.json({ error: 'RPC is not connected to Base Sepolia.' }, { status: 503 });
    const [refund] = await drizzleDb.select().from(schema.refunds).where(eq(schema.refunds.id, refundId)).limit(1);
    if (!refund) return NextResponse.json({ error: 'Refund not found.' }, { status: 404 });
    if (refund.status === 'COMPLETED') return NextResponse.json({ refund });
    if (refund.txHash && refund.txHash.toLowerCase() !== txHash.toLowerCase()) return NextResponse.json({ error: 'Refund already has a different transaction hash.' }, { status: 409 });
    const [merchant] = await drizzleDb.select().from(schema.merchants).where(eq(schema.merchants.id, refund.merchantId)).limit(1);
    const amount = parseUnits(String(refund.amount), 6);
    await drizzleDb.update(schema.refunds).set({ status: 'PROCESSING', txHash: txHash as `0x${string}` }).where(eq(schema.refunds.id, refundId));
    let receipt;
    try { receipt = await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}`, confirmations: 1, timeout: 20_000 }); }
    catch { return NextResponse.json({ refund: { ...refund, status: 'PROCESSING', txHash }, message: 'Transaction is pending confirmation. Retry verification later.' }, { status: 202 }); }
    const transaction = await publicClient.getTransaction({ hash: txHash as `0x${string}` });
    const correctTransfer = receipt.status === 'success' && transaction.from.toLowerCase() === merchant.walletAddress.toLowerCase() && receipt.logs.some((log) => {
      if (log.address.toLowerCase() !== CHAIN_CONFIG.usdcContractAddress.toLowerCase()) return false;
      try {
        const decoded = decodeEventLog({ abi: ERC20_ABI, eventName: 'Transfer', data: log.data, topics: log.topics });
        return decoded.args.from.toLowerCase() === merchant.walletAddress.toLowerCase() && decoded.args.to.toLowerCase() === refund.recipientAddress.toLowerCase() && decoded.args.value === amount;
      } catch { return false; }
    });
    if (!correctTransfer) {
      const [failed] = await drizzleDb.update(schema.refunds).set({ status: 'FAILED', failureReason: 'Mined transaction did not match the merchant, official USDC contract, refund amount, recipient, and successful receipt requirements.' }).where(eq(schema.refunds.id, refundId)).returning();
      return NextResponse.json({ error: failed.failureReason, refund: failed }, { status: 422 });
    }
    const gasCostWei = String(receipt.gasUsed * (receipt.effectiveGasPrice ?? transaction.gasPrice));
    const [completed] = await drizzleDb.update(schema.refunds).set({ status: 'COMPLETED', gasCostWei, completedAt: new Date(), failureReason: null }).where(and(eq(schema.refunds.id, refundId), eq(schema.refunds.status, 'PROCESSING'))).returning();
    return NextResponse.json({ refund: completed, message: 'Refund transfer verified on Base Sepolia.' });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to verify refund.' }, { status: 500 });
  }
}
