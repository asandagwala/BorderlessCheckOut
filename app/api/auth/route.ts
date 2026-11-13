import { NextResponse } from 'next/server';
import { db } from '@/lib/database/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');
  const id = searchParams.get('id');

  if (id) {
    const merchant = await db.getMerchantById(id);
    return NextResponse.json({ merchant });
  }

  if (email) {
    const merchant = await db.getMerchantByEmail(email);
    return NextResponse.json({ merchant });
  }

  const all = await db.getAllMerchants();
  return NextResponse.json({ merchants: all });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { businessName, email, walletAddress } = body;

    if (!businessName || !email || !walletAddress) {
      return NextResponse.json(
        { error: 'businessName, email, and walletAddress are required' },
        { status: 400 }
      );
    }

    const existing = await db.getMerchantByEmail(email);
    if (existing) {
      return NextResponse.json({ merchant: existing, isNew: false });
    }

    const newMerchant = await db.createMerchant({
      id: `merch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessName,
      email,
      walletAddress,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ merchant: newMerchant, isNew: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
