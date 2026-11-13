'use client';

import React from 'react';
import { ExternalLink, Copy, Check } from 'lucide-react';
import Link from 'next/link';
import { Order } from '@/lib/database/types';

interface OrdersTableProps {
  orders: Order[];
  onOpenCreateModal: () => void;
  showTopStats?: boolean;
  summary?: {
    paid?: { count: number; usdcTotal: number };
    pending?: { count: number; usdcTotal: number };
    expired?: { count: number; usdcTotal: number };
  };
}

export function OrdersTable({ orders, onOpenCreateModal, showTopStats = true, summary }: OrdersTableProps) {
  const [copiedId, setCopiedId] = React.useState<string | null>(null);

  const copyCheckoutUrl = (orderId: string) => {
    const url = `${window.location.origin}/checkout/${orderId}`;
    navigator.clipboard.writeText(url);
    setCopiedId(orderId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Compute order statistics dynamically
  const paidOrders = orders.filter((o) => o.paymentStatus === 'PAID');
  const pendingOrders = orders.filter((o) => o.paymentStatus === 'PENDING' || o.paymentStatus === 'CONFIRMING');
  const expiredOrders = orders.filter((o) => o.paymentStatus === 'EXPIRED' || o.paymentStatus === 'FAILED');

  const paidCount = summary?.paid?.count ?? paidOrders.length;
  const paidTotalUsdc = summary?.paid?.usdcTotal ?? paidOrders.reduce((sum, o) => sum + (Number(o.usdcAmount) || 0), 0);

  const pendingCount = summary?.pending?.count ?? pendingOrders.length;
  const pendingTotalUsdc = summary?.pending?.usdcTotal ?? pendingOrders.reduce((sum, o) => sum + (Number(o.usdcAmount) || 0), 0);

  const expiredCount = summary?.expired?.count ?? expiredOrders.length;
  const expiredTotalUsdc = summary?.expired?.usdcTotal ?? expiredOrders.reduce((sum, o) => sum + (Number(o.usdcAmount) || 0), 0);

  return (
    <div className="space-y-6">
      {/* 3 Top Stats Boxes: Paid, Pending, Expired outside the box & at top with red fill & white text */}
      {showTopStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Paid Box */}
          <div className="rounded-[35px] border-[5px] border-[#700c20] bg-[#700c20] text-white p-7 shadow-sm transition-all duration-300 hover:shadow-lg">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-wider font-montserrat-extrabold text-white/90">
                Paid
              </span>
              <div className="text-4xl sm:text-5xl font-black font-montserrat-extrabold text-white">
                {paidCount}
              </div>
              <p className="text-sm font-play text-white/90 pt-1">
                ${paidTotalUsdc.toFixed(2)} USDC received
              </p>
            </div>
          </div>

          {/* Pending Box */}
          <div className="rounded-[35px] border-[5px] border-[#700c20] bg-[#700c20] text-white p-7 shadow-sm transition-all duration-300 hover:shadow-lg">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-wider font-montserrat-extrabold text-white/90">
                Pending
              </span>
              <div className="text-4xl sm:text-5xl font-black font-montserrat-extrabold text-white">
                {pendingCount}
              </div>
              <p className="text-sm font-play text-white/90 pt-1">
                ${pendingTotalUsdc.toFixed(2)} USDC awaiting
              </p>
            </div>
          </div>

          {/* Expired Box */}
          <div className="rounded-[35px] border-[5px] border-[#700c20] bg-[#700c20] text-white p-7 shadow-sm transition-all duration-300 hover:shadow-lg">
            <div className="space-y-2">
              <span className="text-xs uppercase tracking-wider font-montserrat-extrabold text-white/90">
                Expired
              </span>
              <div className="text-4xl sm:text-5xl font-black font-montserrat-extrabold text-white">
                {expiredCount}
              </div>
              <p className="text-sm font-play text-white/90 pt-1">
                ${expiredTotalUsdc.toFixed(2)} USDC expired
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Orders Table Card: 5px border, 35px rounding, clean title with NO icon */}
      <div className="rounded-[35px] border-[5px] border-[#700c20] bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#700c20]/20">
          <div>
            <h2 className="font-montserrat-extrabold text-xl sm:text-2xl text-zinc-950 tracking-tight">
              Customer Orders &amp; Payment Links
            </h2>
            <p className="text-xs sm:text-sm font-play text-zinc-600 mt-1">
              Manage customer checkouts, unique payment references, and settlement statuses
            </p>
          </div>
          <button
            onClick={onOpenCreateModal}
            className="px-6 py-2.5 rounded-[35px] bg-white text-[#700c20] border-[2px] border-[#700c20] font-play font-bold text-xs uppercase tracking-wider hover:bg-[#700c20] hover:text-white transition-all duration-200 cursor-pointer shadow-xs"
          >
            Create Order
          </button>
        </div>

        <div className="overflow-x-auto pt-4">
          <table className="w-full text-xs text-left">
            <thead className="text-zinc-600 uppercase tracking-wider font-montserrat-extrabold text-[11px] border-b-2 border-[#700c20]/20">
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
            <tbody className="divide-y divide-[#700c20]/10 font-play">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-[#fff3e2]/40 transition-colors">
                  <td className="px-4 py-3.5 font-mono text-zinc-600 font-medium">{order.id}</td>
                  <td className="px-4 py-3.5 font-semibold text-zinc-900">{order.customerReference}</td>
                  <td className="px-4 py-3.5 font-mono font-bold text-[#700c20]">{order.paymentReference}</td>
                  <td className="px-4 py-3.5 text-zinc-700">R {order.orderAmount.toFixed(2)}</td>
                  <td className="px-4 py-3.5 font-bold text-zinc-950 font-montserrat">${order.usdcAmount.toFixed(2)}</td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold font-play uppercase tracking-wider ${
                        order.paymentStatus === 'PAID'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : order.paymentStatus === 'PENDING' || order.paymentStatus === 'CONFIRMING'
                          ? 'bg-amber-100 text-amber-800 border border-amber-300'
                          : 'bg-rose-100 text-rose-800 border border-rose-300'
                      }`}
                    >
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right space-x-3">
                    <button
                      onClick={() => copyCheckoutUrl(order.id)}
                      className="inline-flex items-center gap-1.5 text-xs text-zinc-600 hover:text-[#700c20] font-bold cursor-pointer transition-colors"
                      title="Copy Checkout Link"
                    >
                      {copiedId === order.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>Copy Link</span>
                    </button>
                    <Link
                      href={`/checkout/${order.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 text-xs text-[#700c20] hover:underline font-bold transition-colors"
                    >
                      <span>Checkout</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-10 text-center text-zinc-500 font-play">
                    No orders created yet. Click &ldquo;Create Order&rdquo; to generate your first customer checkout.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
