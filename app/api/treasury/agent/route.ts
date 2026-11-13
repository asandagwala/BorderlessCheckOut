import { NextResponse } from 'next/server';
import { TreasuryAgentService } from '@/modules/ai-treasury-agent/treasury-agent.service';
import { GeminiProposalService } from '@/modules/ai-treasury-agent/gemini-proposal.service';
import { treasuryAgentActionSchema } from '@/lib/validations';
import { ENV } from '@/lib/env';

export async function POST(request: Request) {
  try {
    if (ENV.TREASURY_EXECUTION_ENABLED) {
      const suppliedKey = request.headers.get('x-treasury-execution-key');
      if (!ENV.TREASURY_EXECUTION_API_KEY || suppliedKey !== ENV.TREASURY_EXECUTION_API_KEY) {
        return NextResponse.json({ error: 'Treasury execution requires server-side authorization.' }, { status: 403 });
      }
    }

    const json = await request.json();
    const result = treasuryAgentActionSchema.safeParse(json);

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues[0].message, details: result.error.issues },
        { status: 400 }
      );
    }

    const { merchantId, action, invoiceId } = result.data;

    if (action === 'RUN_SCENARIO_1') {
      const scenarioResult = await TreasuryAgentService.runScenario1Approved(merchantId);
      return NextResponse.json(scenarioResult);
    }

    if (action === 'RUN_SCENARIO_2') {
      const scenarioResult = await TreasuryAgentService.runScenario2Rejected(merchantId);
      return NextResponse.json(scenarioResult);
    }

    if (action === 'ANALYZE_INVOICE' && invoiceId) {
      const proposal = await GeminiProposalService.generateForInvoice(merchantId, invoiceId);
      return NextResponse.json(proposal);
    }

    if (action === 'RUN_INVOICE' && invoiceId) {
      const invoiceResult = await TreasuryAgentService.runWorkflowForInvoice(merchantId, invoiceId);
      return NextResponse.json(invoiceResult);
    }

    return NextResponse.json({ error: 'Unsupported action' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Internal server error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
