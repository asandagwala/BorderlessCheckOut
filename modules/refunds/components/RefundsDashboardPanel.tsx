'use client';

import { useCallback, useEffect, useState } from 'react';
import { Order, Transaction } from '@/lib/database/types';
import { RefundsView } from './RefundsView';

export function RefundsDashboardPanel({ merchantId }: { merchantId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const response = await fetch(`/api/refunds/context?merchantId=${encodeURIComponent(merchantId)}`, { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to load order payment data.');
    setOrders(data.orders || []);
    setTransactions(data.transactions || []);
  }, [merchantId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      load().catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load refund data.')).finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  if (loading) return <p role="status" className="rounded-xl border border-[#E6D7C7] bg-white p-5 text-sm text-[#685D55]">Loading refund eligibility…</p>;
  if (error) return <p role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">{error}</p>;
  return <RefundsView orders={orders} transactions={transactions} merchantId={merchantId} onComplete={load} />;
}
