'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { X, Check, Copy, ExternalLink, Loader2 } from 'lucide-react';
import Link from 'next/link';

interface CreateOrderModalProps {
  merchantId: string;
  isOpen: boolean;
  onClose: () => void;
  onOrderCreated: () => void;
}

export function CreateOrderModal({ merchantId, isOpen, onClose, onOrderCreated }: CreateOrderModalProps) {
  const [customerRef, setCustomerRef] = useState('');
  const [amountZar, setAmountZar] = useState('555.00');
  const [loading, setLoading] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<any | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          customerReference: customerRef || `CUST-${Math.floor(Math.random() * 9000 + 1000)}`,
          orderAmountZar: parseFloat(amountZar) || 0,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setCreatedOrder(data.order);
        onOrderCreated();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkoutUrl = createdOrder ? `${window.location.origin}/checkout/${createdOrder.id}` : '';

  const copyLink = () => {
    navigator.clipboard.writeText(checkoutUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="max-w-md w-full rounded-[35px] border-[5px] border-[#700c20] bg-[#fff3e2] p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between pb-4 border-b border-[#700c20]/20">
          <h3 className="font-montserrat-extrabold text-xl text-zinc-950">
            Create Customer Order
          </h3>
          <button
            onClick={() => {
              setCreatedOrder(null);
              onClose();
            }}
            className="w-8 h-8 rounded-full bg-white border border-[#700c20]/30 flex items-center justify-center text-[#700c20] hover:bg-[#700c20] hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {createdOrder ? (
          <div className="space-y-5 text-center py-2">
            <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 border-2 border-emerald-300 flex items-center justify-center mx-auto">
              <Check className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-montserrat-extrabold text-lg text-zinc-950">
                Checkout Link Generated!
              </h4>
              <p className="text-xs font-play text-zinc-600 mt-1">
                Order #{createdOrder.id} • ${createdOrder.usdcAmount.toFixed(2)} USDC (~R {createdOrder.orderAmount.toFixed(2)} ZAR)
              </p>
            </div>

            <div className="flex items-center gap-2 bg-white p-3 rounded-[20px] border border-[#700c20]/30 text-xs font-mono">
              <span className="truncate flex-1 text-left text-zinc-800">{checkoutUrl}</span>
              <button
                onClick={copyLink}
                className="p-1.5 rounded-full hover:bg-[#fff3e2] text-[#700c20] cursor-pointer"
                title="Copy Link"
              >
                {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link href={`/checkout/${createdOrder.id}`} target="_blank" className="flex-1">
                <button className="w-full py-3 px-5 rounded-[35px] bg-[#700c20] text-white font-play font-bold text-xs uppercase tracking-wider hover:bg-[#520917] transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5">
                  <span>Open Checkout</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </button>
              </Link>
              <button
                onClick={() => {
                  setCreatedOrder(null);
                  onClose();
                }}
                className="py-3 px-5 rounded-[35px] bg-white text-[#700c20] border-2 border-[#700c20] font-play font-bold text-xs uppercase tracking-wider hover:bg-[#700c20] hover:text-white transition-all cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-xs font-bold font-play text-zinc-700 block mb-1">
                Customer Reference / ID (Optional)
              </label>
              <Input
                value={customerRef}
                onChange={(e) => setCustomerRef(e.target.value)}
                placeholder="e.g. CUST-JHB-8490"
                className="bg-white border-2 border-[#700c20] rounded-[20px] text-xs font-play h-11 px-4"
              />
            </div>

            <div>
              <label className="text-xs font-bold font-play text-zinc-700 block mb-1">
                Order Amount in South African Rand (ZAR)
              </label>
              <Input
                type="number"
                step="0.01"
                value={amountZar}
                onChange={(e) => setAmountZar(e.target.value)}
                placeholder="555.00"
                required
                className="bg-white border-2 border-[#700c20] rounded-[20px] text-xs font-montserrat font-bold h-11 px-4"
              />
              <p className="text-[11px] font-play text-zinc-500 mt-1">
                Calculates USDC due based on indicative rate (~18.50 ZAR per 1.00 USDC).
              </p>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-[35px] bg-white text-[#700c20] border-2 border-[#700c20] font-play font-bold text-xs uppercase tracking-wider hover:bg-[#700c20] hover:text-white transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-3 rounded-[35px] bg-[#700c20] text-white font-play font-bold text-xs uppercase tracking-wider hover:bg-[#520917] disabled:opacity-50 transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Creating...</span>
                  </>
                ) : (
                  <span>Generate Link</span>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
