import { NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { updatePolicyInputSchema } from '@/lib/validations';

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
    const json = await request.json();
    const result = updatePolicyInputSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message, details: result.error.issues },
        { status: 400 }
      );
    }

    const { merchantId, spendingLimit, requireApprovalAbove, approvedSuppliersOnly } = result.data;

    const updated = await db.updatePolicy({
      id: `pol_${merchantId}`,
      merchantId,
      spendingLimit,
      approvalRequirements: {
        requireApprovalAbove: requireApprovalAbove ?? 300.00,
        approvedSuppliersOnly,
      },
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ policy: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
