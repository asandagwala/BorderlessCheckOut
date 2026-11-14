import { NextResponse } from 'next/server';
import { CashOutService } from '@/modules/cash-out/cash-out.service';

export async function GET(request: Request) {
  const merchantId = new URL(request.url).searchParams.get('merchantId') || 'merch_kigali_01';
  return NextResponse.json({ payouts: await CashOutService.history(merchantId) });
}
