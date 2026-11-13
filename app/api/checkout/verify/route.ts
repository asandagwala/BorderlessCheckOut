import { NextResponse } from 'next/server';
import { ReconciliationService } from '@/modules/reconciliation/reconciliation.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { orderId, txHash, simulated } = body;

    if (!orderId || !txHash) {
      return NextResponse.json(
        { error: 'orderId and txHash are required.' },
        { status: 400 }
      );
    }

    const result = await ReconciliationService.reconcileOrderPayment(
      orderId,
      txHash,
      Boolean(simulated)
    );

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          message: result.message,
          orderStatus: result.orderStatus,
        },
        { status: 422 }
      );
    }

    return NextResponse.json({
      success: true,
      orderStatus: result.orderStatus,
      message: result.message,
      transaction: result.transaction,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
