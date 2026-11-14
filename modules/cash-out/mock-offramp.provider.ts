import { SimulatedPayout } from './types';

/** This adapter is intentionally offline: it never calls a payment provider or blockchain. */
export class MockOfframpProvider {
  static async submit(quote: SimulatedPayout): Promise<Pick<SimulatedPayout, 'status' | 'reference'>> {
    return { status: 'PROCESSING', reference: `DEMO-PAYOUT-${quote.id.slice(-10).toUpperCase()}` };
  }
}
