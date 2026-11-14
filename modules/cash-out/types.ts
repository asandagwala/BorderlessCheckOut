export type SimulatedPayoutStatus = 'QUOTED' | 'PROCESSING' | 'PAID' | 'FAILED' | 'REJECTED';

export interface CashOutSummary {
  merchantId: string;
  merchantName: string;
  verifiedReceivedUsdc: number;
  verifiedSupplierPayoutsUsdc: number;
  supplierCommitmentsUsdc: number;
  activeCashOutsUsdc: number;
  safetyReserveUsdc: number;
  availableUsdc: number;
  destinationLabel: string;
  rateZarPerUsdc: number;
  simulatedFeePercent: number;
  perPayoutCapUsdc: number;
  dailyCapUsdc: number;
  todayPaidAndProcessingUsdc: number;
  sourceNote: string;
}

export interface CashOutQuote {
  id: string;
  merchantId: string;
  amountUsdc: number;
  reserveUsdc: number;
  exchangeRate: number;
  feePercent: number;
  grossZar: number;
  feeZar: number;
  netZar: number;
  currency: 'ZAR';
  destinationLabel: string;
  expiresAt: string;
  status: 'QUOTED';
  audit: Omit<CashOutSummary, 'destinationLabel' | 'rateZarPerUsdc' | 'simulatedFeePercent' | 'perPayoutCapUsdc' | 'dailyCapUsdc' | 'todayPaidAndProcessingUsdc'>;
}

export type SimulatedPayout = Omit<CashOutQuote, 'status'> & {
  status: SimulatedPayoutStatus;
  reference: string;
  createdAt: string;
  completedAt?: string;
};
