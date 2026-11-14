import { NextResponse } from 'next/server';
import { db } from '@/lib/database/db';

export async function GET(request: Request) {
  const merchantId = new URL(request.url).searchParams.get('merchantId');
  if (!merchantId) return NextResponse.json({ error: 'Merchant ID is required.' }, { status: 400 });
  const [merchant, orders, transactions] = await Promise.all([
    db.getMerchantById(merchantId),
    db.getOrdersByMerchantId(merchantId),
    db.getTransactionsByMerchantId(merchantId),
  ]);
  if (!merchant) return NextResponse.json({ error: 'Merchant not found.' }, { status: 404 });
  return NextResponse.json({ orders, transactions });
}
