import { NextResponse } from 'next/server';
import { ReconciliationService } from '@/modules/reconciliation/reconciliation.service';
import { verifyPaymentInputSchema } from '@/lib/validations';

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = verifyPaymentInputSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message, details: result.error.issues },
        { status: 400 }
      );
    }

    const { orderId, txHash } = result.data;

    const recon = await ReconciliationService.reconcileOrderPayment(
      orderId,
      txHash
    );

    if (!recon.success) {
      return NextResponse.json(
        {
          success: false,
          error: recon.error,
          message: recon.message,
          orderStatus: recon.orderStatus,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      orderStatus: recon.orderStatus,
      message: recon.message,
      transaction: recon.transaction,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
