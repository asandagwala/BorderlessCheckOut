'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShoppingBag, ExternalLink, Copy, Check, CheckCircle2, Clock3, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Order } from '@/lib/database/types';

interface OrdersTableProps {
  orders: Order[];
  onOpenCreateModal: () => void;
  summary?: { paid?: { count: number; usdcTotal: number }; pending?: { count: number; usdcTotal: number }; expired?: { count: number; usdcTotal: number } };
}

export function OrdersTable({ orders, summary, onOpenCreateModal }: OrdersTableProps) {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const copyCheckoutUrl = (orderId: string) => {
    const url = `${window.location.origin}/checkout/${orderId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(orderId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-[#700c20]" />
            Customer Orders & Payment Links
          </CardTitle>
          <CardDescription className="text-xs">
            Manage customer checkouts, unique payment references, and settlement statuses
          </CardDescription>
        </div>
        <Button size="sm" onClick={onOpenCreateModal} className="bg-[#700c20] hover:bg-[#580918] text-white text-xs">
          Create Order
        </Button>
      </CardHeader>
      <div className="orders-summary">
        <div className="orders-summary-card paid">
          <div className="summary-label"><CheckCircle2 size={15} className="text-[#700c20]"/> Paid</div>
          <div className="summary-count">{summary?.paid?.count ?? orders.filter(o => o.paymentStatus === 'PAID').length}</div>
          <div className="summary-total">${(summary?.paid?.usdcTotal ?? orders.filter(o => o.paymentStatus === 'PAID').reduce((sum, o) => sum + Number(o.usdcAmount), 0)).toFixed(2)} USDC received</div>
        </div>
        <div className="orders-summary-card pending">
          <div className="summary-label"><Clock3 size={15} className="text-amber-600"/> Pending</div>
          <div className="summary-count">{summary?.pending?.count ?? orders.filter(o => ['PENDING', 'CONFIRMING'].includes(o.paymentStatus)).length}</div>
          <div className="summary-total">${(summary?.pending?.usdcTotal ?? orders.filter(o => ['PENDING', 'CONFIRMING'].includes(o.paymentStatus)).reduce((sum, o) => sum + Number(o.usdcAmount), 0)).toFixed(2)} USDC awaiting</div>
        </div>
        <div className="orders-summary-card expired">
          <div className="summary-label"><AlertCircle size={15} className="text-[#700c20]"/> Expired</div>
          <div className="summary-count">{summary?.expired?.count ?? orders.filter(o => o.paymentStatus === 'EXPIRED').length}</div>
          <div className="summary-total">${(summary?.expired?.usdcTotal ?? orders.filter(o => o.paymentStatus === 'EXPIRED').reduce((sum, o) => sum + Number(o.usdcAmount), 0)).toFixed(2)} USDC expired</div>
        </div>
      </div>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 uppercase tracking-wider font-semibold border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-3">Order ID</th>
                <th className="px-4 py-3">Customer Ref</th>
                <th className="px-4 py-3">Payment Reference</th>
                <th className="px-4 py-3">Amount (ZAR)</th>
                <th className="px-4 py-3">USDC Due</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                  <td className="px-4 py-3 font-mono text-zinc-500">{order.id}</td>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{order.customerReference}</td>
                  <td className="px-4 py-3 font-mono font-medium text-zinc-800 dark:text-zinc-200">{order.paymentReference}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">R {order.orderAmount.toFixed(2)}</td>
                  <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-50">${order.usdcAmount.toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <Badge variant={order.paymentStatus === 'PAID' ? 'success' : ['PENDING', 'CONFIRMING'].includes(order.paymentStatus) ? 'warning' : 'destructive'} className="text-[10px]">
                      {order.paymentStatus}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right space-x-2">
                    <button
                      onClick={() => copyCheckoutUrl(order.id)}
                      className="inline-flex items-center gap-1 text-[11px] text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 cursor-pointer"
                      title="Copy Checkout Link"
                    >
                      {copiedId === order.id ? <Check className="w-3 h-3 text-[#700c20]" /> : <Copy className="w-3 h-3" />}
                      <span>Copy Link</span>
                    </button>
                    <Link
                      href={`/checkout/${order.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1 text-[11px] text-[#700c20] hover:text-[#580918] font-semibold"
                    >
                      <span>Checkout</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-zinc-400">
                    No orders created yet. Click "Create Order" to generate your first customer checkout.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
