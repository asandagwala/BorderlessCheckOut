import { NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { createSupplierInputSchema } from '@/lib/validations';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const merchantId = searchParams.get('merchantId') || 'merch_kigali_01';
  const suppliers = await db.getSuppliersByMerchantId(merchantId);
  return NextResponse.json({ suppliers });
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = createSupplierInputSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message, details: result.error.issues },
        { status: 400 }
      );
    }

    const { merchantId, supplierName, walletAddress, approvalStatus } = result.data;

    const newSupplier = await db.createSupplier({
      id: `supp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      merchantId,
      supplierName,
      walletAddress,
      approvalStatus,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ supplier: newSupplier }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
