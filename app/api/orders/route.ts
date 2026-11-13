import { NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { ENV } from '@/lib/env';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const merchantId = searchParams.get('merchantId') || 'merch_kigali_01';

  const orders = await db.getOrdersByMerchantId(merchantId);
  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { merchantId, customerReference, orderAmountZar, usdcAmount } = body;

    if (!merchantId || !customerReference) {
      return NextResponse.json(
        { error: 'merchantId and customerReference are required' },
        { status: 400 }
      );
    }

    const zar = Number(orderAmountZar) || 0;
    // Calculate USDC amount if not directly provided
    const calculatedUsdc = usdcAmount ? Number(usdcAmount) : Number((zar / ENV.INDICATIVE_USD_TO_ZAR_RATE).toFixed(2));

    const shortId = Math.random().toString(36).substring(2, 7).toUpperCase();
    const orderId = `ord_${Date.now()}_${shortId}`;
    const paymentReference = `BC-ORD-${shortId}`;

    const newOrder = await db.createOrder({
      id: orderId,
      merchantId,
      customerReference,
      orderAmount: zar,
      currency: 'ZAR',
      usdcAmount: calculatedUsdc,
      paymentReference,
      paymentStatus: 'PENDING',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ order: newOrder }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
