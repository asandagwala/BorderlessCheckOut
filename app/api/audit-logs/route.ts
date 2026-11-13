import { NextResponse } from 'next/server';
import { db } from '@/lib/database/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const merchantId = searchParams.get('merchantId') || 'merch_kigali_01';
  const logs = await db.getAuditLogsByMerchantId(merchantId);
  return NextResponse.json({ logs });
}
