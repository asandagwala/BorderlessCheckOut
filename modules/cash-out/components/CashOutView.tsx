'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { CashOutQuote, CashOutSummary, SimulatedPayout } from '../types';

const DEFAULT_MERCHANT_ID = 'merch_kigali_01';
const money = (value: number, currency = 'USDC') => currency === 'ZAR'
  ? `R${value.toLocaleString('en-ZA', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
  : `$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })} USDC`;

export function CashOutView({ merchantId = DEFAULT_MERCHANT_ID }: { merchantId?: string }) {
  const [summary, setSummary] = useState<CashOutSummary | null>(null);
  const [quote, setQuote] = useState<CashOutQuote | null>(null);
  const [payouts, setPayouts] = useState<SimulatedPayout[]>([]);
  const [amount, setAmount] = useState('100');
  const [reserve, setReserve] = useState('50');
  const [confirmationOpen, setConfirmationOpen] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const refresh = useCallback(async () => {
    const [summaryResponse, historyResponse] = await Promise.all([
      fetch(`/api/cash-out/quote?merchantId=${encodeURIComponent(merchantId)}&reserve=${encodeURIComponent(reserve)}`, { cache: 'no-store' }),
      fetch(`/api/cash-out/history?merchantId=${encodeURIComponent(merchantId)}`, { cache: 'no-store' }),
    ]);
    const summaryData = await summaryResponse.json();
    const historyData = await historyResponse.json();
    if (!summaryResponse.ok) throw new Error(summaryData.error || 'Could not load availability.');
    setSummary(summaryData.summary);
    setPayouts(historyData.payouts || []);
  }, [merchantId, reserve]);

  useEffect(() => {
    const timer = window.setTimeout(() => { refresh().catch((reason) => setError(reason instanceof Error ? reason.message : 'Could not load demo data.')); }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);
  useEffect(() => {
    if (!payouts.some((payout) => payout.status === 'PROCESSING')) return;
    const timer = window.setInterval(() => { refresh().catch(() => undefined); }, 1000);
    return () => window.clearInterval(timer);
  }, [payouts, refresh]);

  const requestQuote = async () => {
    setBusy(true); setError(''); setNotice(''); setQuote(null);
    try {
      const response = await fetch('/api/cash-out/quote', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ merchantId, amountUsdc: Number(amount), reserveUsdc: Number(reserve) }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Quote rejected.');
      setQuote(data.quote); setConfirmationOpen(true); setConfirmed(false);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Unable to create quote.'); }
    finally { setBusy(false); }
  };

  const confirmCashOut = async () => {
    if (!quote || !confirmed) return;
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/cash-out/submit', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ merchantId, quoteId: quote.id, confirmed }) });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Cash-out rejected.');
      setConfirmationOpen(false); setQuote(null); setNotice(`${data.payout.reference} is PROCESSING. This is a simulated payout only.`);
      await refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Cash-out was rejected.'); }
    finally { setBusy(false); }
  };

  const metrics = useMemo(() => summary ? [
    ['Verified USDC received', money(summary.verifiedReceivedUsdc)],
    ['Verified supplier payouts', money(summary.verifiedSupplierPayoutsUsdc)],
    ['Supplier invoices reserved', money(summary.supplierCommitmentsUsdc)],
    ['Active simulated cash-outs', money(summary.activeCashOutsUsdc)],
    ['Safety reserve', money(summary.safetyReserveUsdc)],
    ['Available to cash out', money(summary.availableUsdc)],
  ] : [], [summary]);

  return (
    <main className="min-h-screen bg-[#fff3e2] px-4 py-8 text-zinc-900 sm:px-6">
      <div className="mx-auto max-w-6xl space-y-7">
        <header className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-bold uppercase tracking-[0.18em] text-[#700c20]">Borderless Checkout · Merchant Treasury</p><h1 className="mt-2 font-montserrat-extrabold text-3xl sm:text-4xl">Cash out to ZAR</h1><p className="mt-2 text-sm text-zinc-600">{summary?.merchantName || 'Demo merchant'} · South Africa corridor</p></div>
          <a href="/dashboard" className="rounded-full border-2 border-[#700c20] px-4 py-2 text-sm font-bold text-[#700c20] hover:bg-[#700c20] hover:text-white">Back to dashboard</a>
        </header>

        <div role="note" className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-4 text-sm font-semibold text-amber-950">Simulated cash-out — no real funds will move. This demo does not contact a bank, payout provider, wallet, or blockchain.</div>

        <section className="grid gap-6 lg:grid-cols-[1.1fr_.9fr]">
          <div className="rounded-[30px] border-[5px] border-[#700c20] bg-white p-6 sm:p-8">
            <h2 className="font-montserrat-extrabold text-xl">Available balance</h2>
            <p className="mt-1 text-xs text-zinc-500">Verified ledger estimate · not a live token balance</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">{metrics.map(([label, value]) => <div key={label} className="rounded-2xl bg-[#fff3e2] p-4"><p className="text-xs text-zinc-600">{label}</p><p className="mt-1 text-lg font-extrabold">{value}</p></div>)}</div>
            <details className="mt-5 rounded-2xl border border-zinc-200 p-4"><summary className="cursor-pointer text-sm font-bold">Availability audit detail</summary><p className="mt-3 text-sm text-zinc-600">{summary?.sourceNote || 'Loading calculation method.'}</p><p className="mt-2 text-xs text-zinc-500">Only VERIFIED customer payments count. Pending/unverified payments are excluded; paid supplier invoices are represented by verified supplier payouts and are not reserved twice.</p></details>
          </div>

          <div className="rounded-[30px] border-[5px] border-[#700c20] bg-white p-6 sm:p-8">
            <h2 className="font-montserrat-extrabold text-xl">Create a demo payout</h2>
            <div className="mt-5 rounded-2xl bg-zinc-50 p-4"><p className="text-xs font-bold uppercase text-zinc-500">Demo destination</p><p className="mt-1 font-bold">{summary?.destinationLabel || 'South African bank account •••• 4242'}</p><p className="text-xs text-zinc-500">Example destination only. No bank data is collected.</p></div>
            <label className="mt-5 block text-sm font-bold">USDC amount<input aria-label="Cash-out amount in USDC" className="mt-2 w-full rounded-xl border border-zinc-300 p-3" type="number" min="0.000001" step="0.000001" value={amount} onChange={(event) => { setAmount(event.target.value); setQuote(null); }} /></label>
            <label className="mt-4 block text-sm font-bold">Safety reserve (USDC)<input aria-label="Safety reserve in USDC" className="mt-2 w-full rounded-xl border border-zinc-300 p-3" type="number" min="0" step="0.000001" value={reserve} onChange={(event) => { setReserve(event.target.value); setQuote(null); }} /></label>
            <div className="mt-4 rounded-xl border border-zinc-200 p-4 text-sm"><p>Simulated rate: <b>R18.50 / USDC</b></p><p>Simulated fee: <b>1%</b></p><p className="mt-2 text-xs text-zinc-500">Per payout cap: {summary?.perPayoutCapUsdc ?? 1000} USDC · Daily cap: {summary?.dailyCapUsdc ?? 2000} USDC · Used today: {summary?.todayPaidAndProcessingUsdc.toFixed(6) ?? '0.000000'} USDC</p></div>
            <button type="button" disabled={busy || !summary} onClick={requestQuote} className="mt-5 w-full rounded-full bg-[#700c20] px-5 py-3 text-sm font-bold text-white disabled:opacity-50">{busy ? 'Calculating…' : 'Get simulated quote'}</button>
          </div>
        </section>

        {error && <p role="alert" className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-900">{error}</p>}
        {notice && <p role="status" className="rounded-xl border border-emerald-300 bg-emerald-50 p-4 text-sm text-emerald-900">{notice}</p>}

        <section className="rounded-[30px] border-[5px] border-[#700c20] bg-white p-6 sm:p-8">
          <div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-montserrat-extrabold text-xl">Simulated payout history</h2><p className="mt-1 text-xs text-zinc-500">Temporary in-memory records; they reset when the server restarts.</p></div><span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-900">NO ON-CHAIN TRANSACTIONS</span></div>
          {payouts.length ? <div className="mt-5 space-y-3">{payouts.map((payout) => <article key={payout.id} className="grid gap-3 rounded-2xl border border-zinc-200 p-4 sm:grid-cols-[1fr_auto_auto]"><div><p className="font-bold">{money(payout.amountUsdc)} → {money(payout.netZar, 'ZAR')}</p><p className="text-xs text-zinc-500">{new Date(payout.createdAt).toLocaleString()} · {payout.destinationLabel}</p><p className="font-mono text-xs">{payout.reference}</p></div><span className="h-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-800">{payout.status} · SIMULATED</span><details><summary className="cursor-pointer text-xs font-bold">Quote & audit</summary><p className="mt-2 text-xs">Gross {money(payout.grossZar, 'ZAR')} · Fee {money(payout.feeZar, 'ZAR')} ({payout.feePercent}%) · Net {money(payout.netZar, 'ZAR')}</p><p className="mt-1 text-xs text-zinc-600">Source: {money(payout.audit.verifiedReceivedUsdc)} received less {money(payout.audit.verifiedSupplierPayoutsUsdc)} supplier payouts, {money(payout.audit.supplierCommitmentsUsdc)} invoice commitments, {money(payout.audit.activeCashOutsUsdc)} prior simulated payouts, and {money(payout.audit.safetyReserveUsdc)} reserve.</p></details></article>)}</div> : <p className="mt-5 text-sm text-zinc-600">No simulated payouts yet.</p>}
        </section>
      </div>

      {confirmationOpen && quote && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="presentation"><section role="dialog" aria-modal="true" aria-labelledby="confirm-title" className="w-full max-w-lg rounded-[28px] border-4 border-[#700c20] bg-white p-6 shadow-2xl"><h2 id="confirm-title" className="font-montserrat-extrabold text-xl">Confirm simulated cash-out</h2><p className="mt-1 text-xs text-amber-800">SIMULATION ONLY · NO REAL FUNDS MOVE</p><dl className="mt-5 space-y-2 text-sm"><div className="flex justify-between"><dt>Cash out</dt><dd className="font-bold">{money(quote.amountUsdc)}</dd></div><div className="flex justify-between"><dt>Demo rate</dt><dd>R{quote.exchangeRate.toFixed(2)} / USDC</dd></div><div className="flex justify-between"><dt>Gross payout</dt><dd>{money(quote.grossZar, 'ZAR')}</dd></div><div className="flex justify-between"><dt>Simulated fee ({quote.feePercent}%)</dt><dd>{money(quote.feeZar, 'ZAR')}</dd></div><div className="flex justify-between border-t pt-2 text-base"><dt>Estimated net</dt><dd className="font-extrabold">{money(quote.netZar, 'ZAR')}</dd></div><div className="pt-2"><dt>Destination</dt><dd className="font-bold">{quote.destinationLabel}</dd></div><div><dt>Quote expires</dt><dd>{new Date(quote.expiresAt).toLocaleTimeString()}</dd></div></dl><label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl bg-[#fff3e2] p-3 text-sm"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} /><span>I understand this is a simulation and no real bank payout will occur.</span></label><div className="mt-5 flex gap-3"><button type="button" onClick={() => { setConfirmationOpen(false); setQuote(null); }} className="flex-1 rounded-full border-2 border-zinc-300 px-4 py-2 font-bold">Cancel</button><button type="button" disabled={!confirmed || busy} onClick={confirmCashOut} className="flex-1 rounded-full bg-[#700c20] px-4 py-2 font-bold text-white disabled:opacity-40">Confirm simulation</button></div></section></div>}
    </main>
  );
}
