import { NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { TreasuryService } from '@/modules/treasury/treasury.service';
import { authorizeMerchant } from '@/lib/auth/session';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const authorization = await authorizeMerchant(searchParams.get('merchantId'));
  if (!authorization.ok) {
    return NextResponse.json({ error: 'Authentication required or merchant access denied.' }, { status: authorization.status });
  }
  const merchantId = authorization.merchantId;

  const merchant = await db.getMerchantById(merchantId);
  const orders = await db.getOrdersByMerchantId(merchantId);
  const transactions = await db.getTransactionsByMerchantId(merchantId);
  const balance = await TreasuryService.getTreasuryBalance(merchantId);
  const policy = await db.getPolicyByMerchantId(merchantId);

  const paidOrders = orders.filter(o => o.paymentStatus === 'PAID');
  const unpaidOrders = orders.filter(o => o.paymentStatus === 'PENDING' || o.paymentStatus === 'CONFIRMING');

  return NextResponse.json({
    merchant,
    stats: {
      totalReceivedUsdc: balance.totalReceivedUsdc,
      currentBalanceUsdc: balance.currentBalanceUsdc,
      indicativeZarValue: balance.indicativeZarValue,
      totalDisbursedUsdc: balance.totalDisbursedUsdc,
      paidOrdersCount: paidOrders.length,
      unpaidOrdersCount: unpaidOrders.length,
      totalOrdersCount: orders.length,
      spendingLimit: policy?.spendingLimit || 500.00,
    },
    recentTransactions: transactions.slice(0, 8),
    recentOrders: orders.slice(0, 8),
  });
}
