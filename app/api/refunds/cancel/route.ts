import { NextResponse } from 'next/server';
import { and, eq } from 'drizzle-orm';
import { drizzleDb, schema } from '@/lib/database/drizzle/db';

export async function POST(request: Request) {
  if (!drizzleDb) return NextResponse.json({ error: 'Persistent storage required.' }, { status: 503 });
  const { refundId } = await request.json();
  if (typeof refundId !== 'string') return NextResponse.json({ error: 'Refund ID required.' }, { status: 400 });
  const [refund] = await drizzleDb.update(schema.refunds).set({ status: 'CANCELLED', failureReason: 'Merchant cancelled before transaction submission.' })
    .where(and(eq(schema.refunds.id, refundId), eq(schema.refunds.status, 'PENDING'))).returning();
  return NextResponse.json({ refund });
}
