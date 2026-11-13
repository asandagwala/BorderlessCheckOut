import { NextResponse } from 'next/server';
import { verifyMessage, type Address, type Hex } from 'viem';
import { db } from '@/lib/database/db';
import { clearAuthChallenge, createMerchantSession, readAuthChallenge } from '@/lib/auth/session';
import { authVerifyInputSchema } from '@/lib/validations';
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
    const result = authVerifyInputSchema.safeParse(await request.json());
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 });
    }

    const challenge = await readAuthChallenge();
    if (!challenge) {
      await clearAuthChallenge();
      return NextResponse.json({ error: 'Login challenge expired. Request a new one.' }, { status: 401 });
    }

    const merchant = await db.getMerchantById(challenge.merchantId);
    if (
      !merchant ||
      merchant.email.toLowerCase() !== challenge.email.toLowerCase() ||
      merchant.walletAddress.toLowerCase() !== challenge.walletAddress.toLowerCase()
    ) {
      await clearAuthChallenge();
      return NextResponse.json({ error: 'Login challenge is no longer valid.' }, { status: 401 });
    }

    const signatureIsValid = await verifyMessage({
      address: merchant.walletAddress as Address,
      message: challenge.message,
      signature: result.data.signature as Hex,
    });

    await clearAuthChallenge();
    if (!signatureIsValid) {
      return NextResponse.json({ error: 'Wallet signature did not match this merchant.' }, { status: 401 });
    }

    await createMerchantSession(merchant.id);
    return NextResponse.json({ success: true, merchant });
  } catch {
    await clearAuthChallenge();
    return NextResponse.json({ error: 'Unable to verify wallet signature.' }, { status: 500 });
  }
}
