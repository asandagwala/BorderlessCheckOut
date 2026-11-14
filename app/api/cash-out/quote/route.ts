import { NextResponse } from 'next/server';
import { CashOutService } from '@/modules/cash-out/cash-out.service';

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const merchantId = url.searchParams.get('merchantId') || 'merch_kigali_01';
    const reserve = Number(url.searchParams.get('reserve') ?? 50);
    const summary = await CashOutService.getSummary(merchantId, reserve);
    return NextResponse.json({ summary });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to calculate availability.' }, { status: 400 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const quote = await CashOutService.createQuote(body.merchantId || 'merch_kigali_01', Number(body.amountUsdc), Number(body.reserveUsdc));
    return NextResponse.json({ quote }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unable to create quote.' }, { status: 400 });
  }
}
