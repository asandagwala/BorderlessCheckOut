'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { Order, Transaction } from '@/lib/database/types';
import { RefundsView } from './RefundsView';

type MerchantOption = { id: string; businessName: string };

export function RefundsPageView() {
  const [merchantId, setMerchantId] = useState('merch_kigali_01');
  const [merchants, setMerchants] = useState<MerchantOption[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/auth').then((response) => response.json()).then((data) => {
      const options: MerchantOption[] = data.merchants || [];
      setMerchants(options);
      if (options.length && !options.some((merchant) => merchant.id === merchantId)) setMerchantId(options[0].id);
    }).catch(() => setError('Unable to load merchants.')).finally(() => setLoading(false));
  }, [merchantId]);

  const loadOrders = useCallback(async () => {
    const response = await fetch(`/api/dashboard/stats?merchantId=${encodeURIComponent(merchantId)}`, { cache: 'no-store' });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || 'Unable to load merchant payments.');
    setOrders(data.allOrders || []);
    setTransactions(data.recentTransactions || []);
  }, [merchantId]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadOrders().catch((reason) => setError(reason instanceof Error ? reason.message : 'Unable to load merchant payments.')).finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [loadOrders]);

  return (
    <main className="min-h-screen bg-[#fff3e2] px-4 py-8 text-zinc-900 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#700c20]">Borderless Checkout</p><h1 className="mt-2 font-montserrat-extrabold text-3xl">Merchant refunds</h1><p className="mt-1 text-sm text-zinc-600">Standalone Base Sepolia refund workspace</p></div>
          <Link href="/dashboard" className="rounded-full border-2 border-[#700c20] px-4 py-2 text-sm font-bold text-[#700c20] hover:bg-[#700c20] hover:text-white">Back to dashboard</Link>
        </header>
        <label className="block max-w-md text-sm font-bold">Merchant account
          <select className="mt-2 w-full rounded-xl border border-zinc-300 bg-white p-3" value={merchantId} onChange={(event) => setMerchantId(event.target.value)}>
            {merchants.map((merchant) => <option key={merchant.id} value={merchant.id}>{merchant.businessName}</option>)}
          </select>
        </label>
        {loading && <p role="status" className="text-sm text-zinc-600">Loading merchant payment data…</p>}
        {error && <p role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">{error}</p>}
        {!loading && merchants.length === 0 && <p className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm">No merchants are available. Create a merchant account before requesting a refund.</p>}
        {merchants.length > 0 && <RefundsView orders={orders} transactions={transactions} merchantId={merchantId} onComplete={loadOrders} />}
      </div>
    </main>
  );
}
