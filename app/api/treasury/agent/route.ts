import { NextResponse } from 'next/server';
import { TreasuryAgentService } from '@/modules/ai-treasury-agent/treasury-agent.service';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { merchantId, action, invoiceId } = body;

    if (!merchantId) {
      return NextResponse.json({ error: 'merchantId is required' }, { status: 400 });
    }

    if (action === 'RUN_SCENARIO_1') {
      const result = await TreasuryAgentService.runScenario1Approved(merchantId);
      return NextResponse.json(result);
    }

    if (action === 'RUN_SCENARIO_2') {
      const result = await TreasuryAgentService.runScenario2Rejected(merchantId);
      return NextResponse.json(result);
    }

    if (action === 'RUN_INVOICE' && invoiceId) {
      const result = await TreasuryAgentService.runWorkflowForInvoice(merchantId, invoiceId);
      return NextResponse.json(result);
    }

    return NextResponse.json(
      { error: "Invalid action. Expected 'RUN_SCENARIO_1', 'RUN_SCENARIO_2', or 'RUN_INVOICE' with invoiceId." },
      { status: 400 }
    );
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
