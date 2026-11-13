import { NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { authorizeMerchant } from '@/lib/auth/session';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const authorization = await authorizeMerchant(searchParams.get('merchantId'));
  if (!authorization.ok) {
    return NextResponse.json({ error: 'Authentication required or merchant access denied.' }, { status: authorization.status });
  }
  const merchantId = authorization.merchantId;
  const logs = await db.getAuditLogsByMerchantId(merchantId);
  return NextResponse.json({ logs });
}
