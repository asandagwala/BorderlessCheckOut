import { NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { createAuthChallenge, createChallengeMessage } from '@/lib/auth/session';
import { authChallengeInputSchema } from '@/lib/validations';
import { ENV } from '@/lib/env';

function hasTrustedOrigin(request: Request): boolean {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    return new URL(origin).origin === new URL(ENV.APP_URL).origin;
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  if (!hasTrustedOrigin(request)) {
    return NextResponse.json({ error: 'Invalid request origin.' }, { status: 403 });
  }

  try {
    const result = authChallengeInputSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const merchant = await db.getMerchantByEmail(result.data.email);
    if (!merchant) return NextResponse.json({ error: 'Merchant account not found.' }, { status: 404 });

    const message = createChallengeMessage({
      email: merchant.email,
      walletAddress: merchant.walletAddress,
      appUrl: ENV.APP_URL,
    });

    await createAuthChallenge({
      merchantId: merchant.id,
      email: merchant.email,
      walletAddress: merchant.walletAddress,
      message,
    });

    return NextResponse.json({ message, walletAddress: merchant.walletAddress });
  } catch {
    return NextResponse.json({ error: 'Unable to create a login challenge.' }, { status: 500 });
  }
}
