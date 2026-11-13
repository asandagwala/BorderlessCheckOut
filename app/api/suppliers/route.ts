import { NextResponse } from 'next/server';
import { db } from '@/lib/database/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const merchantId = searchParams.get('merchantId') || 'merch_kigali_01';
  const suppliers = await db.getSuppliersByMerchantId(merchantId);
  return NextResponse.json({ suppliers });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { merchantId, supplierName, walletAddress, approvalStatus } = body;

    if (!merchantId || !supplierName || !walletAddress) {
      return NextResponse.json(
        { error: 'merchantId, supplierName, and walletAddress are required' },
        { status: 400 }
      );
    }

    const newSupplier = await db.createSupplier({
      id: `supp_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      merchantId,
      supplierName,
      walletAddress,
      approvalStatus: approvalStatus || 'PENDING',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ supplier: newSupplier }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
