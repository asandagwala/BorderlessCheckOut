import { NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { createInvoiceInputSchema } from '@/lib/validations';
import { authorizeMerchant } from '@/lib/auth/session';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const authorization = await authorizeMerchant(searchParams.get('merchantId'));
  if (!authorization.ok) {
    return NextResponse.json({ error: 'Authentication required or merchant access denied.' }, { status: authorization.status });
  }
  const merchantId = authorization.merchantId;
  const invoices = await db.getInvoicesByMerchantId(merchantId);
  return NextResponse.json({ invoices });
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = createInvoiceInputSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message, details: result.error.issues },
        { status: 400 }
      );
    }

    const { merchantId, supplierId, invoiceNumber, invoiceAmount, dueDate } = result.data;
    const authorization = await authorizeMerchant(merchantId);
    if (!authorization.ok) {
      return NextResponse.json({ error: 'Authentication required or merchant access denied.' }, { status: authorization.status });
    }

    const newInvoice = await db.createInvoice({
      id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      merchantId,
      supplierId,
      invoiceNumber,
      invoiceAmount,
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
