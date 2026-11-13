import { NextResponse } from 'next/server';
import { db } from '@/lib/database/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const merchantId = searchParams.get('merchantId') || 'merch_kigali_01';
  let policy = await db.getPolicyByMerchantId(merchantId);

  if (!policy) {
    policy = {
      id: `pol_${merchantId}`,
      merchantId,
      spendingLimit: 500.00,
      approvalRequirements: {
        requireApprovalAbove: 300.00,
        approvedSuppliersOnly: true,
      },
      createdAt: new Date().toISOString(),
    };
    await db.updatePolicy(policy);
  }

  return NextResponse.json({ policy });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { merchantId, spendingLimit, requireApprovalAbove, approvedSuppliersOnly } = body;

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 });
    }

    const updated = await db.updatePolicy({
      id: `pol_${merchantId}`,
      merchantId,
      spendingLimit: Number(spendingLimit) || 500.00,
      approvalRequirements: {
        requireApprovalAbove: Number(requireApprovalAbove) || 300.00,
        approvedSuppliersOnly: approvedSuppliersOnly !== undefined ? Boolean(approvedSuppliersOnly) : true,
      },
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ policy: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
