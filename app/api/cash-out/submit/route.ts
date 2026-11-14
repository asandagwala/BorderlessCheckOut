import { NextResponse } from 'next/server';
import { CashOutService } from '@/modules/cash-out/cash-out.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const payout = await CashOutService.submit(body.quoteId, body.merchantId || 'merch_kigali_01', body.confirmed);
    return NextResponse.json({ payout }, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Cash-out simulation was rejected.';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
