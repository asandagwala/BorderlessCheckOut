import { NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { authorizeMerchant, clearMerchantSession } from '@/lib/auth/session';
import { createMerchantInputSchema } from '@/lib/validations';

export async function GET() {
  const authorization = await authorizeMerchant();
  if (!authorization.ok) {
    return NextResponse.json({ error: 'Authentication required.' }, { status: authorization.status });
  }

  const merchant = await db.getMerchantById(authorization.merchantId);
  if (!merchant) return NextResponse.json({ error: 'Merchant account not found.' }, { status: 404 });
  return NextResponse.json({ merchant });
}

export async function DELETE() {
  await clearMerchantSession();
  return NextResponse.json({ success: true });
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = createMerchantInputSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message, details: result.error.issues },
        { status: 400 }
      );
    }

    const { businessName, email, walletAddress } = result.data;

    const existing = await db.getMerchantByEmail(email);
    if (existing) {
      return NextResponse.json({ error: 'An account with this email is already registered.' }, { status: 409 });
    }

    const newMerchant = await db.createMerchant({
      id: `merch_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      businessName,
      email,
      walletAddress,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ merchant: newMerchant, isNew: true }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
