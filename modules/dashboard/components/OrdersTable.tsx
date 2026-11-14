'use client';

import React from 'react';
import Image from 'next/image';
import { ExternalLink, Copy, Check, Plus, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
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
      {/* 3 Top Stats Boxes on the Customer Orders tab */}
      {showTopStats && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Paid Box */}
          <div className="rounded-2xl border-2 border-[#1E6B45]/25 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.16em] font-montserrat-extrabold text-[#1E6B45]">
                Paid Orders
              </span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#EAF6F0] text-[#1E6B45]">
                <CheckCircle2 className="size-4" />
              </span>
            </div>
            <div className="mt-3 text-3xl sm:text-4xl font-black font-montserrat-extrabold text-[#181412]">
              {paidCount}
            </div>
            <p className="text-xs font-bold text-[#1E6B45] mt-1.5">
              ${paidTotalUsdc.toFixed(2)} USDC received
            </p>
          </div>

          {/* Pending Box */}
          <div className="rounded-2xl border-2 border-[#E59A18]/35 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.16em] font-montserrat-extrabold text-[#A86A06]">
                Awaiting Payment
              </span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#FFF6E0] text-[#B87408]">
                <Clock className="size-4" />
              </span>
            </div>
            <div className="mt-3 text-3xl sm:text-4xl font-black font-montserrat-extrabold text-[#181412]">
              {pendingCount}
            </div>
            <p className="text-xs font-bold text-[#9A6004] mt-1.5">
              ${pendingTotalUsdc.toFixed(2)} USDC awaiting
            </p>
          </div>

          {/* Expired Box */}
          <div className="rounded-2xl border-2 border-[#8B1E24]/25 bg-white p-6 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs uppercase tracking-[0.16em] font-montserrat-extrabold text-[#8B1E24]">
                Expired / Unpaid
              </span>
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[#FCECEE] text-[#8B1E24]">
                <AlertCircle className="size-4" />
              </span>
            </div>
            <div className="mt-3 text-3xl sm:text-4xl font-black font-montserrat-extrabold text-[#181412]">
              {expiredCount}
            </div>
            <p className="text-xs font-bold text-[#8B1E24] mt-1.5">
              ${expiredTotalUsdc.toFixed(2)} USDC expired
            </p>
          </div>
        </div>
      )}

      {/* Orders Table Card */}
      <div className="rounded-2xl border border-[#E8DCD0] bg-white p-6 sm:p-8 shadow-[0_12px_32px_-12px_rgba(24,20,18,0.06)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#EFE5DA]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C84B24]">
              Customer Checkouts
            </p>
            <h2 className="mt-1 font-montserrat-extrabold text-xl sm:text-2xl text-[#181412] tracking-tight">
              Customer Orders &amp; Payment Links
            </h2>
            <p className="text-xs sm:text-sm text-[#685D55] mt-1">
              Share a payment link with your customer and track verified USDC settlement in real time.
            </p>
          </div>
          <button
            onClick={onOpenCreateModal}
            className="inline-flex items-center gap-2 rounded-lg bg-[#C84B24] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-[0_6px_18px_-4px_rgba(200,75,36,0.4)] transition hover:bg-[#A63816] cursor-pointer"
          >
            <Plus className="size-4" />
            <span>Create Order</span>
          </button>
        </div>

        <div className="overflow-x-auto pt-4">
          <table className="w-full text-xs text-left">
            <thead className="text-[#685D55] uppercase tracking-wider font-montserrat-extrabold text-[11px] border-b border-[#EFE5DA] bg-[#FFF8EE]/60">
              <tr>
                <th className="px-4 py-3.5 rounded-l-lg">Order ID</th>
                <th className="px-4 py-3.5">Customer Ref</th>
                <th className="px-4 py-3.5">Payment Reference</th>
                <th className="px-4 py-3.5">Amount (ZAR)</th>
                <th className="px-4 py-3.5">USDC Due</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right rounded-r-lg">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2E8DC]">
              {orders.map((order) => (
                <tr key={order.id} className="hover:bg-[#FFF8EE]/50 transition-colors">
                  <td className="px-4 py-4 font-mono text-[#685D55] font-medium">{order.id}</td>
                  <td className="px-4 py-4 font-bold text-[#181412]">{order.customerReference}</td>
                  <td className="px-4 py-4">
                    <span className="inline-block rounded-md bg-[#FFF3E4] px-2.5 py-1 font-mono text-[11px] font-bold text-[#C84B24]">
                      {order.paymentReference}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-[#4E443C] font-medium">R {order.orderAmount.toFixed(2)}</td>
                  <td className="px-4 py-4 font-bold text-[#181412] font-slogan text-sm">
                    ${order.usdcAmount.toFixed(2)}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        order.paymentStatus === 'PAID'
                          ? 'bg-[#EAF6F0] text-[#1E6B45] border border-[#1E6B45]/25'
                          : order.paymentStatus === 'PENDING' || order.paymentStatus === 'CONFIRMING'
                          ? 'bg-[#FFF6E0] text-[#9A6004] border border-[#E59A18]/40'
                          : 'bg-[#FCECEE] text-[#8B1E24] border border-[#8B1E24]/25'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          order.paymentStatus === 'PAID'
                            ? 'bg-[#1E6B45]'
                            : order.paymentStatus === 'PENDING' || order.paymentStatus === 'CONFIRMING'
                            ? 'bg-[#E59A18]'
                            : 'bg-[#8B1E24]'
                        }`}
                      />
                      {order.paymentStatus}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right space-x-2 whitespace-nowrap">
                    <button
                      onClick={() => copyCheckoutUrl(order.id)}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4D5C5] bg-white px-3 py-1.5 text-xs text-[#3D342E] hover:border-[#C84B24] hover:text-[#C84B24] font-bold cursor-pointer transition-colors"
                      title="Copy Checkout Link"
                    >
                      {copiedId === order.id ? (
                        <Check className="w-3.5 h-3.5 text-[#1E6B45]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                      <span>{copiedId === order.id ? 'Copied' : 'Copy Link'}</span>
                    </button>
                    <Link
                      href={`/checkout/${order.id}`}
                      target="_blank"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#FFF3E4] px-3 py-1.5 text-xs text-[#C84B24] hover:bg-[#C84B24] hover:text-white font-bold transition-colors"
                    >
                      <span>Checkout</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12">
                    <div className="mx-auto flex max-w-md flex-col items-center text-center">
                      <div className="relative h-20 w-20 overflow-hidden rounded-2xl border border-[#E8DCD0] shadow-xs">
                        <Image
                          src="/uhuru/hands-harvest.png"
                          alt="Shea harvest"
                          fill
                          className="object-cover"
                          sizes="80px"
                        />
                      </div>
                      <p className="mt-4 font-slogan text-base font-bold text-[#181412]">
                        No customer orders yet
                      </p>
                      <p className="mt-1 text-xs text-[#685D55]">
                        Create your first payment link to start accepting verified Circle USDC on Base Sepolia.
                      </p>
                      <button
                        onClick={onOpenCreateModal}
                        className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-[#C84B24] px-4 py-2 text-xs font-bold uppercase tracking-wider text-white hover:bg-[#A63816] cursor-pointer"
                      >
                        <Plus className="size-3.5" />
                        Create First Order
                      </button>
                    </div>
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
