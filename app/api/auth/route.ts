import { NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { createMerchantInputSchema, getMerchantQuerySchema } from '@/lib/validations';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = getMerchantQuerySchema.safeParse({
    email: searchParams.get('email') || undefined,
    id: searchParams.get('id') || undefined,
  });

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 });
  }

  const { id, email } = parsed.data;

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
      return NextResponse.json({ merchant: existing, isNew: false });
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
