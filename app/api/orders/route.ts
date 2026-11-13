import { NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { ENV } from '@/lib/env';
import { createOrderInputSchema, getOrdersQuerySchema } from '@/lib/validations';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = getOrdersQuerySchema.safeParse({
    merchantId: searchParams.get('merchantId') || undefined,
  });

  const merchantId = parsed.success ? parsed.data.merchantId : 'merch_kigali_01';
  const orders = await db.getOrdersByMerchantId(merchantId);
  return NextResponse.json({ orders });
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = createOrderInputSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message, details: result.error.issues },
        { status: 400 }
      );
    }

    const { merchantId, customerReference, orderAmountZar } = result.data;
    const zar = orderAmountZar;
    const calculatedUsdc = Number((zar / ENV.INDICATIVE_USD_TO_ZAR_RATE).toFixed(2));

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
