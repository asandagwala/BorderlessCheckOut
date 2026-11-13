import { createHmac, randomBytes, timingSafeEqual } from 'node:crypto';
import { cookies } from 'next/headers';
import { ENV } from '@/lib/env';

export const MERCHANT_SESSION_COOKIE = 'bc_merchant_session';
export const AUTH_CHALLENGE_COOKIE = 'bc_auth_challenge';
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8;
export const CHALLENGE_MAX_AGE_SECONDS = 5 * 60;

export interface AuthChallengePayload {
  kind: 'challenge';
  merchantId: string;
  email: string;
  walletAddress: string;
  message: string;
  expiresAt: number;
}

interface MerchantSessionPayload {
  kind: 'session';
  merchantId: string;
  expiresAt: number;
}

function sessionSecret(): string {
  if (ENV.APP_SESSION_SECRET.length >= 32) return ENV.APP_SESSION_SECRET;
  if (process.env.NODE_ENV !== 'production') {
    return 'borderless-checkout-local-development-session-secret';
  }
  throw new Error('APP_SESSION_SECRET must be at least 32 characters in production.');
}

function signatureFor(encodedPayload: string): Buffer {
  return createHmac('sha256', sessionSecret()).update(encodedPayload).digest();
}

function signPayload(payload: AuthChallengePayload | MerchantSessionPayload): string {
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = signatureFor(encodedPayload).toString('base64url');
  return `${encodedPayload}.${signature}`;
}

function verifyPayload(token: string | undefined): unknown | null {
  if (!token) return null;

  const [encodedPayload, encodedSignature, extra] = token.split('.');
  if (!encodedPayload || !encodedSignature || extra !== undefined) return null;

  try {
    const actualSignature = Buffer.from(encodedSignature, 'base64url');
    const expectedSignature = signatureFor(encodedPayload);
    if (actualSignature.length !== expectedSignature.length || !timingSafeEqual(actualSignature, expectedSignature)) {
      return null;
    }

    return JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf8')) as unknown;
  } catch {
    return null;
  }
}

function cookieOptions(path: string, maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    path,
    maxAge,
  };
}

export async function createAuthChallenge(payload: Omit<AuthChallengePayload, 'kind' | 'expiresAt'>): Promise<void> {
  const expiresAt = Math.floor(Date.now() / 1000) + CHALLENGE_MAX_AGE_SECONDS;
  const token = signPayload({ kind: 'challenge', ...payload, expiresAt });
  const cookieStore = await cookies();
  cookieStore.set(AUTH_CHALLENGE_COOKIE, token, cookieOptions('/api/auth', CHALLENGE_MAX_AGE_SECONDS));
}

export async function readAuthChallenge(): Promise<AuthChallengePayload | null> {
  const cookieStore = await cookies();
  const payload = verifyPayload(cookieStore.get(AUTH_CHALLENGE_COOKIE)?.value);
  if (!payload || typeof payload !== 'object') return null;

  const candidate = payload as Partial<AuthChallengePayload>;
  if (
    candidate.kind !== 'challenge' ||
    typeof candidate.merchantId !== 'string' ||
    typeof candidate.email !== 'string' ||
    typeof candidate.walletAddress !== 'string' ||
    typeof candidate.message !== 'string' ||
    typeof candidate.expiresAt !== 'number' ||
    candidate.expiresAt <= Math.floor(Date.now() / 1000)
  ) {
    return null;
  }

  return candidate as AuthChallengePayload;
}

export async function createMerchantSession(merchantId: string): Promise<void> {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS;
  const token = signPayload({ kind: 'session', merchantId, expiresAt });
  const cookieStore = await cookies();
  cookieStore.set(MERCHANT_SESSION_COOKIE, token, cookieOptions('/', SESSION_MAX_AGE_SECONDS));
  cookieStore.set(AUTH_CHALLENGE_COOKIE, '', cookieOptions('/api/auth', 0));
}

export async function clearMerchantSession(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete(MERCHANT_SESSION_COOKIE);
  cookieStore.set(AUTH_CHALLENGE_COOKIE, '', cookieOptions('/api/auth', 0));
}

export async function clearAuthChallenge(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(AUTH_CHALLENGE_COOKIE, '', cookieOptions('/api/auth', 0));
}

export async function getMerchantSessionId(): Promise<string | null> {
  const cookieStore = await cookies();
  const payload = verifyPayload(cookieStore.get(MERCHANT_SESSION_COOKIE)?.value);
  if (!payload || typeof payload !== 'object') return null;

  const candidate = payload as Partial<MerchantSessionPayload>;
  if (
    candidate.kind !== 'session' ||
    typeof candidate.merchantId !== 'string' ||
    typeof candidate.expiresAt !== 'number' ||
    candidate.expiresAt <= Math.floor(Date.now() / 1000)
  ) {
    return null;
  }

  return candidate.merchantId;
}

export async function authorizeMerchant(requestedMerchantId?: string | null): Promise<
  | { ok: true; merchantId: string }
  | { ok: false; status: 401 | 403 }
> {
  const merchantId = await getMerchantSessionId();
  if (!merchantId) return { ok: false, status: 401 };
  if (requestedMerchantId && requestedMerchantId !== merchantId) return { ok: false, status: 403 };
  return { ok: true, merchantId };
}

export function createChallengeMessage(input: {
  email: string;
  walletAddress: string;
  appUrl: string;
  nonce?: string;
}): string {
  const app = new URL(input.appUrl);
  const issuedAt = new Date().toISOString();
  const expirationTime = new Date(Date.now() + CHALLENGE_MAX_AGE_SECONDS * 1000).toISOString();
  const nonce = input.nonce || randomBytes(16).toString('hex');

  return [
    `${app.host} wants you to sign in to Borderless Checkout.`,
    '',
    `Email: ${input.email}`,
    `Wallet: ${input.walletAddress}`,
    `URI: ${app.origin}`,
    'Version: 1',
    'Chain ID: 84532',
    `Nonce: ${nonce}`,
    `Issued At: ${issuedAt}`,
    `Expiration Time: ${expirationTime}`,
  ].join('\n');
}
