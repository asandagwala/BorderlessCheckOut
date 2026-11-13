import { NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { TreasuryService } from '@/modules/treasury/treasury.service';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const merchantId = searchParams.get('merchantId') || 'merch_kigali_01';

  const merchant = await db.getMerchantById(merchantId);
  const orders = await db.getOrdersByMerchantId(merchantId);
  const transactions = await db.getTransactionsByMerchantId(merchantId);
  const balance = await TreasuryService.getTreasuryBalance(merchantId);
  const policy = await db.getPolicyByMerchantId(merchantId);

  const paidOrders = orders.filter(o => o.paymentStatus === 'PAID');
  const pendingOrders = orders.filter(o => o.paymentStatus === 'PENDING' || o.paymentStatus === 'CONFIRMING');
  const expiredOrders = orders.filter(o => o.paymentStatus === 'EXPIRED');
  const sumUsdc = (items: typeof orders) => items.reduce((total, order) => total + Number(order.usdcAmount), 0);

  return NextResponse.json({
    merchant,
    stats: {
      totalReceivedUsdc: balance.totalReceivedUsdc,
      currentBalanceUsdc: balance.currentBalanceUsdc,
      indicativeZarValue: balance.indicativeZarValue,
      totalDisbursedUsdc: balance.totalDisbursedUsdc,
      paidOrdersCount: paidOrders.length,
      unpaidOrdersCount: pendingOrders.length,
      totalOrdersCount: orders.length,
      spendingLimit: policy?.spendingLimit || 500.00,
    },
    orderSummary: {
      paid: { count: paidOrders.length, usdcTotal: sumUsdc(paidOrders) },
      pending: { count: pendingOrders.length, usdcTotal: sumUsdc(pendingOrders) },
      expired: { count: expiredOrders.length, usdcTotal: sumUsdc(expiredOrders) },
    },
    recentTransactions: transactions.slice(0, 8),
    recentOrders: orders.slice(0, 8),
    allOrders: orders,
  });
}