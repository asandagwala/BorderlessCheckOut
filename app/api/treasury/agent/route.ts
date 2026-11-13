import { NextResponse } from 'next/server';
import { TreasuryAgentService } from '@/modules/ai-treasury-agent/treasury-agent.service';
import { treasuryAgentActionSchema } from '@/lib/validations';
import { authorizeMerchant } from '@/lib/auth/session';

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const result = treasuryAgentActionSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message, details: result.error.issues },
        { status: 400 }
      );
    }

    const { merchantId, action, invoiceId } = result.data;
    const authorization = await authorizeMerchant(merchantId);
    if (!authorization.ok) {
      return NextResponse.json({ error: 'Authentication required or merchant access denied.' }, { status: authorization.status });
    }

    if (action === 'RUN_SCENARIO_1') {
      const scenarioResult = await TreasuryAgentService.runScenario1Approved(authorization.merchantId);
      return NextResponse.json(scenarioResult);
    }

    if (action === 'RUN_SCENARIO_2') {
      const scenarioResult = await TreasuryAgentService.runScenario2Rejected(authorization.merchantId);
      return NextResponse.json(scenarioResult);
    }

    if (action === 'RUN_INVOICE' && invoiceId) {
      const invoiceResult = await TreasuryAgentService.runWorkflowForInvoice(authorization.merchantId, invoiceId);
      return NextResponse.json(invoiceResult);
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
