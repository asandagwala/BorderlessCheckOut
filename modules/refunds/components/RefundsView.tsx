'use client';

import { useEffect, useMemo, useState } from 'react';
import { Order, Transaction } from '@/lib/database/types';
import { encodeFunctionData, parseUnits } from 'viem';
import { parseAbi } from 'viem';

const TESTNET_CHAIN_ID = 84532;
const USDC_ADDRESS = '0x036CbD53842c5426634e7929541eC2318f3dCF7e' as const;
const USDC_ABI = parseAbi(['function transfer(address to, uint256 value) returns (bool)']);

const REASONS = ['Customer request', 'Order cancelled', 'Product unavailable', 'Duplicate payment', 'Incorrect order', 'Other'];

function microUsdc(value: number) {
  return BigInt(Math.round((Number(value) + Number.EPSILON) * 1_000_000));
}

export function RefundsView({ orders, transactions, merchantId, onComplete }: { orders: Order[]; transactions: Transaction[]; merchantId: string; onComplete: () => void }) {
  const [orderId, setOrderId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState(REASONS[0]);
  const [prepared, setPrepared] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState<Array<{ id: string; orderId: string; amount: string; status: string; recipientAddress: string; reason: string; txHash: string | null; gasCostWei: string | null; createdAt: string }>>([]);

  useEffect(() => {
    fetch(`/api/refunds?merchantId=${encodeURIComponent(merchantId)}`).then((response) => response.ok ? response.json() : { refunds: [] }).then((data) => setHistory(data.refunds || [])).catch(() => setHistory([]));
  }, [merchantId]);

  const eligible = useMemo(() => orders.flatMap((order) => {
    if (order.paymentStatus !== 'PAID') return [];
    const payment = transactions.find((tx) => tx.orderId === order.id && tx.type === 'CUSTOMER_PAYMENT' && tx.verificationStatus === 'VERIFIED');
    return payment ? [{ order, payment }] : [];
  }), [orders, transactions]);
  const selected = eligible.find(({ order }) => order.id === orderId);
  const selectedRefunds = selected ? history.filter((refund) => refund.orderId === selected.order.id) : [];
  const alreadyRefundedUnits = selectedRefunds.filter((refund) => refund.status === 'COMPLETED').reduce((sum, refund) => sum + microUsdc(Number(refund.amount)), BigInt(0));
  const reservedUnits = selectedRefunds.filter((refund) => refund.status === 'PENDING' || refund.status === 'PROCESSING').reduce((sum, refund) => sum + microUsdc(Number(refund.amount)), BigInt(0));
  const refundableUnits = microUsdc(selected?.payment.amount || 0) - alreadyRefundedUnits - reservedUnits;
  const refundable = Number(refundableUnits > BigInt(0) ? refundableUnits : BigInt(0)) / 1_000_000;
  const refundUnits = microUsdc(Number(amount || 0));
  const maxUnits = microUsdc(refundable);
  const validAmount = refundUnits > BigInt(0) && refundUnits <= maxUnits;

  const submitRefund = async () => {
    const ethereum = (window as Window & { ethereum?: { request: (args: { method: string; params?: unknown[] }) => Promise<unknown> } }).ethereum;
    if (!selected || !validAmount || !ethereum) return;
    setSubmitting(true); setMessage('');
    let reservationId: string | undefined;
    try {
      const [wallet] = await ethereum.request({ method: 'eth_requestAccounts' }) as string[];
      const chainId = await ethereum.request({ method: 'eth_chainId' }) as string;
      if (Number(chainId) !== TESTNET_CHAIN_ID) throw new Error('Switch your wallet to Base Sepolia before continuing.');
      if (wallet.toLowerCase() !== (await fetch(`/api/auth?id=${merchantId}`).then((r) => r.json())).merchant?.walletAddress?.toLowerCase()) throw new Error('Connected wallet must match the merchant settlement wallet.');
      const idempotencyKey = crypto.randomUUID();
      const signedMessage = `Borderless Checkout testnet refund\nMerchant: ${merchantId}\nOrder: ${selected.order.id}\nAmount: ${amount} USDC\nReason: ${reason}\nRequest: ${idempotencyKey}`;
      const signature = await ethereum.request({ method: 'personal_sign', params: [signedMessage, wallet] }) as `0x${string}`;
      const reserveResponse = await fetch('/api/refunds', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ merchantId, orderId: selected.order.id, amount, reason, idempotencyKey, walletAddress: wallet, signature }) });
      const reserveData = await reserveResponse.json();
      if (!reserveResponse.ok) throw new Error(reserveData.error || 'Could not reserve refund.');
      reservationId = reserveData.refund.id;
      const data = encodeFunctionData({ abi: USDC_ABI, functionName: 'transfer', args: [selected.payment.senderAddress as `0x${string}`, parseUnits(amount, 6)] });
      const txHash = await ethereum.request({ method: 'eth_sendTransaction', params: [{ from: wallet, to: USDC_ADDRESS, data }] }) as `0x${string}`;
      const verifyResponse = await fetch('/api/refunds/confirm', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refundId: reservationId, txHash }) });
      const verifyData = await verifyResponse.json();
      if (!verifyResponse.ok && verifyResponse.status !== 202) throw new Error(verifyData.error || 'Refund transaction could not be verified.');
      setMessage(verifyData.message || 'Refund is processing on Base Sepolia.');
      const historyResponse = await fetch(`/api/refunds?merchantId=${encodeURIComponent(merchantId)}`);
      if (historyResponse.ok) setHistory((await historyResponse.json()).refunds || []);
      setPrepared(false); setAmount(''); onComplete();
    } catch (error) {
      if (reservationId) await fetch('/api/refunds/cancel', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ refundId: reservationId }) }).catch(() => undefined);
      setMessage(error instanceof Error ? error.message : 'Refund could not be submitted.');
    } finally { setSubmitting(false); }
  };

  return (
    <section className="space-y-6">
      <div className="rounded-[35px] border-[5px] border-[#700c20] bg-white p-6 sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[#700c20]/20 pb-5">
          <div>
            <h2 className="font-montserrat-extrabold text-2xl text-zinc-950">Refunds</h2>
            <p className="mt-1 text-sm text-zinc-600">Prepare a refund for a verified Base Sepolia payment.</p>
          </div>
          <span className="rounded-full border border-amber-400 bg-amber-50 px-3 py-1 text-xs font-bold text-amber-900">BASE SEPOLIA TESTNET</span>
        </div>

        <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950">
          Refund transfers are testnet only. Your merchant wallet must sign the request and pay Base Sepolia gas. Refunds are counted only after server receipt verification. Keep Base Sepolia USDC and test ETH in the merchant wallet.
        </div>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          <label className="block text-sm font-bold text-zinc-800">Verified paid order
            <select className="mt-2 w-full rounded-xl border border-zinc-300 bg-white p-3" value={orderId} onChange={(event) => { setOrderId(event.target.value); setPrepared(false); setAmount(''); }}>
              <option value="">Select an eligible order</option>
              {eligible.map(({ order }) => <option key={order.id} value={order.id}>{order.paymentReference} · ${order.usdcAmount.toFixed(2)} USDC</option>)}
            </select>
          </label>
          <label className="block text-sm font-bold text-zinc-800">Refund reason
            <select className="mt-2 w-full rounded-xl border border-zinc-300 bg-white p-3" value={reason} onChange={(event) => setReason(event.target.value)}>
              {REASONS.map((item) => <option key={item}>{item}</option>)}
            </select>
          </label>
          <label className="block text-sm font-bold text-zinc-800">Refund amount (USDC)
            <input className="mt-2 w-full rounded-xl border border-zinc-300 p-3" type="number" min="0.000001" step="0.000001" max={refundable} value={amount} onChange={(event) => { setAmount(event.target.value); setPrepared(false); }} placeholder="0.00" disabled={!selected} />
          </label>
          <div className="text-sm text-zinc-700"><span className="font-bold">Refund destination</span><p className="mt-2 break-all rounded-xl bg-zinc-50 p-3 font-mono text-xs">{selected?.payment.senderAddress || 'Original payer wallet appears after selecting an eligible order.'}</p></div>
        </div>

        {selected && <div className="mt-6 grid gap-3 rounded-2xl bg-[#fff3e2] p-5 text-sm sm:grid-cols-2">
          <p>Original verified payment: <b>${selected.payment.amount.toFixed(2)} USDC</b></p>
          <p>Previously refunded: <b>${(Number(alreadyRefundedUnits) / 1_000_000).toFixed(6)} USDC</b></p>
          <p>Remaining refundable: <b>${refundable.toFixed(6)} USDC</b>{reservedUnits > BigInt(0) && <span className="block text-xs text-zinc-600">Includes ${(Number(reservedUnits) / 1_000_000).toFixed(6)} USDC reserved by pending refunds.</span>}</p>
          <p>Customer receives: <b>${(Number(refundUnits) / 1_000_000).toFixed(6)} USDC</b></p>
          <p className="sm:col-span-2">Checkout fee: no R85 fee is currently calculated or recorded in the application. The refund preview excludes any checkout fee. Refund gas would be paid by the merchant wallet; actual gas is not yet available.</p>
        </div>}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button type="button" disabled={!selected || !validAmount} onClick={() => setPrepared(true)} className="rounded-full bg-[#700c20] px-5 py-3 text-sm font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">Review refund</button>
          {prepared && <button type="button" disabled={submitting} onClick={submitRefund} className="rounded-full bg-emerald-800 px-5 py-3 text-sm font-bold text-white disabled:opacity-40">{submitting ? 'Submitting on testnet…' : `Confirm & send $${(Number(refundUnits) / 1_000_000).toFixed(6)} USDC`}</button>}
          {message && <p role="status" className="w-full text-sm font-semibold text-zinc-700">{message}</p>}
        </div>
        {!eligible.length && <p className="mt-5 text-sm text-zinc-600">No eligible orders found. An order must be marked PAID and have a verified customer payment transaction.</p>}
      </div>
      <div className="rounded-[30px] border-2 border-[#700c20]/25 bg-white p-6">
        <h3 className="font-montserrat-extrabold text-lg">Refund history</h3>
        {history.length ? <ul className="mt-4 divide-y divide-zinc-200">{history.map((refund) => <li key={refund.id} className="grid gap-2 py-4 text-sm md:grid-cols-4"><span><b>${Number(refund.amount).toFixed(6)} USDC</b><br />{refund.reason}</span><span className="font-semibold">{refund.status}</span><span className="break-all font-mono text-xs">To {refund.recipientAddress}<br />Gas: {refund.gasCostWei ? `${refund.gasCostWei} wei` : 'Pending'}</span><span>{refund.txHash ? <a className="font-bold text-[#700c20] underline" href={`https://sepolia.basescan.org/tx/${refund.txHash}`} target="_blank" rel="noreferrer">View transaction</a> : 'No transaction hash'}<br />{new Date(refund.createdAt).toLocaleString()}</span></li>)}</ul> : <p className="mt-2 text-sm text-zinc-600">No refund records yet.</p>}
      </div>
    </section>
  );
}
