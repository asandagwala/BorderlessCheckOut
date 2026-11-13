import { NextResponse } from 'next/server';
import { db } from '@/lib/database/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const merchantId = searchParams.get('merchantId') || 'merch_kigali_01';
  const invoices = await db.getInvoicesByMerchantId(merchantId);
  return NextResponse.json({ invoices });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { merchantId, supplierId, invoiceNumber, invoiceAmount, dueDate } = body;

    if (!merchantId || !supplierId || !invoiceNumber || !invoiceAmount) {
      return NextResponse.json(
        { error: 'merchantId, supplierId, invoiceNumber, and invoiceAmount are required' },
        { status: 400 }
      );
    }

    const newInvoice = await db.createInvoice({
      id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      merchantId,
      supplierId,
      invoiceNumber,
      invoiceAmount: Number(invoiceAmount),
      currency: 'USDC',
      dueDate: dueDate || new Date(Date.now() + 7 * 86400000).toISOString(),
      paymentStatus: 'PENDING',
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ invoice: newInvoice }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
