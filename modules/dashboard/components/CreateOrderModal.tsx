'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { X, Plus, Loader2, Check, Copy, ExternalLink } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <Card className="max-w-md w-full border-zinc-200 dark:border-zinc-800 shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">Create Customer Order</CardTitle>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <X className="w-5 h-5" />
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          {createdOrder ? (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                <Check className="w-6 h-6" />
              </div>
              <div>
                <h4 className="font-semibold text-zinc-900 dark:text-zinc-50">Checkout Link Generated!</h4>
                <p className="text-xs text-zinc-500 mt-1">
                  Order #{createdOrder.id} • ${createdOrder.usdcAmount.toFixed(2)} USDC (~R {createdOrder.orderAmount.toFixed(2)} ZAR)
                </p>
              </div>

              <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 p-2 rounded-lg text-xs font-mono truncate">
                <span className="truncate flex-1 text-left">{checkoutUrl}</span>
                <button onClick={copyLink} className="p-1 hover:text-emerald-600">
                  {copiedLink ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex gap-2 pt-2">
                <Link href={`/checkout/${createdOrder.id}`} target="_blank" className="flex-1">
                  <Button className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
                    Open Checkout Page <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
                <Button variant="outline" onClick={() => { setCreatedOrder(null); onClose(); }} className="text-xs">
                  Done
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                  Customer Reference / Name
                </label>
                <Input
                  placeholder="e.g. CUST-KGL-104 or customer@company.com"
                  value={customerRef}
                  onChange={(e) => setCustomerRef(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                  Order Amount (ZAR)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="555.00"
                  value={amountZar}
                  onChange={(e) => setAmountZar(e.target.value)}
                  required
                />
                <span className="text-[11px] text-zinc-500 mt-1 block">
                  Indicative rate (18.50 ZAR/USDC) = approx ${(parseFloat(amountZar || '0') / 18.50).toFixed(2)} USDC
                </span>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" size="sm" disabled={loading} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Plus className="w-4 h-4 mr-1.5" />}
                  Generate Order
                </Button>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
