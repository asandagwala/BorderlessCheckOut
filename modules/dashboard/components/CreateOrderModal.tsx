'use client';

import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { X, Check, Copy, ExternalLink, Loader2, Sparkles } from 'lucide-react';
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
  const estimatedUsdc = ((parseFloat(amountZar) || 0) / 18.5).toFixed(2);

  const copyLink = () => {
    navigator.clipboard.writeText(checkoutUrl);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#181412]/65 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="max-w-md w-full overflow-hidden rounded-2xl border border-[#E8DCD0] bg-white shadow-2xl">
        {/* Top vibrant stripe */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[#C84B24] via-[#E59A18] to-[#1E6B45]" />

        <div className="p-7 sm:p-8 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-[#EFE5DA]">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C84B24]">
                Borderless Checkout
              </p>
              <h3 className="font-montserrat-extrabold text-xl text-[#181412] mt-0.5">
                Create Customer Order
              </h3>
            </div>
            <button
              onClick={() => {
                setCreatedOrder(null);
                onClose();
              }}
              className="w-8 h-8 rounded-lg bg-[#FFF8EE] border border-[#E4D5C5] flex items-center justify-center text-[#463C35] hover:bg-[#C84B24] hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {createdOrder ? (
            <div className="space-y-5 text-center py-2">
              <div className="w-14 h-14 rounded-2xl bg-[#EAF6F0] text-[#1E6B45] border border-[#1E6B45]/25 flex items-center justify-center mx-auto">
                <Check className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-montserrat-extrabold text-lg text-[#181412]">
                  Checkout Link Generated!
                </h4>
                <p className="text-xs text-[#685D55] mt-1">
                  Order #{createdOrder.id} &bull;{' '}
                  <strong className="text-[#C84B24]">${createdOrder.usdcAmount.toFixed(2)} USDC</strong>{' '}
                  (~R {createdOrder.orderAmount.toFixed(2)} ZAR)
                </p>
              </div>

              <div className="flex items-center gap-2 bg-[#FFF8EE] p-3 rounded-xl border border-[#E4D5C5] text-xs font-mono">
                <span className="truncate flex-1 text-left text-[#181412]">{checkoutUrl}</span>
                <button
                  onClick={copyLink}
                  className="p-1.5 rounded-lg hover:bg-white text-[#C84B24] cursor-pointer"
                  title="Copy Link"
                >
                  {copiedLink ? (
                    <Check className="w-4 h-4 text-[#1E6B45]" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link href={`/checkout/${createdOrder.id}`} target="_blank" className="flex-1">
                  <button className="w-full py-3 px-5 rounded-xl bg-[#C84B24] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#A63816] transition-all cursor-pointer shadow-sm flex items-center justify-center gap-1.5">
                    <span>Open Checkout</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </button>
                </Link>
                <button
                  onClick={() => {
                    setCreatedOrder(null);
                    onClose();
                  }}
                  className="py-3 px-5 rounded-xl bg-white text-[#3D342E] border border-[#E4D5C5] font-bold text-xs uppercase tracking-wider hover:border-[#C84B24] hover:text-[#C84B24] transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#3D342E] block mb-1.5">
                  Customer Reference / ID (Optional)
                </label>
                <Input
                  value={customerRef}
                  onChange={(e) => setCustomerRef(e.target.value)}
                  placeholder="e.g. CUST-JHB-8490"
                  className="bg-[#FFF8EE]/60 border border-[#DCCBC0] rounded-xl text-xs h-11 px-4"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-[#3D342E] block mb-1.5">
                  Order Amount in South African Rand (ZAR)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={amountZar}
                  onChange={(e) => setAmountZar(e.target.value)}
                  placeholder="555.00"
                  required
                  className="bg-[#FFF8EE]/60 border border-[#DCCBC0] rounded-xl text-xs font-slogan font-bold h-11 px-4"
                />
                <div className="mt-2.5 flex items-center justify-between rounded-xl bg-[#FFF6E0] px-3.5 py-2 text-xs">
                  <span className="font-bold text-[#9A6004] flex items-center gap-1.5">
                    <Sparkles className="size-3.5 text-[#E59A18]" />
                    Indicative USDC Quote:
                  </span>
                  <span className="font-slogan font-extrabold text-[#181412]">
                    ~${estimatedUsdc} USDC
                  </span>
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-3 rounded-xl bg-white text-[#463C35] border border-[#E4D5C5] font-bold text-xs uppercase tracking-wider hover:border-[#C84B24] hover:text-[#C84B24] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl bg-[#C84B24] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#A63816] disabled:opacity-50 transition-all cursor-pointer shadow-[0_6px_18px_-4px_rgba(200,75,36,0.45)] flex items-center justify-center gap-1.5"
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
    </div>
  );
}
