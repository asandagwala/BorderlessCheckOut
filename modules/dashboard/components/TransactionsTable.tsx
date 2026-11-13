'use client';

import React from 'react';
import { ArrowDownLeft, ArrowUpRight, ExternalLink } from 'lucide-react';
import { Transaction } from '@/lib/database/types';

export function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="rounded-[35px] border-[5px] border-[#700c20] bg-white p-6 sm:p-8 shadow-sm">
      <div className="pb-6 border-b border-[#700c20]/20">
        <h2 className="font-montserrat-extrabold text-xl sm:text-2xl text-zinc-950 tracking-tight">
          Blockchain Transactions (Base Sepolia)
        </h2>
        <p className="text-xs sm:text-sm font-play text-zinc-600 mt-1">
          Verified on-chain USDC customer payments and agent-initiated supplier payouts
        </p>
      </div>

      <div className="overflow-x-auto pt-4">
        <table className="w-full text-xs text-left">
          <thead className="text-zinc-600 uppercase tracking-wider font-montserrat-extrabold text-[11px] border-b-2 border-[#700c20]/20">
            <tr>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Tx Hash</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">From / To</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#700c20]/10 font-play">
            {transactions.map((tx) => {
              const isIncoming = tx.type === 'CUSTOMER_PAYMENT';
              return (
                <tr key={tx.id} className="hover:bg-[#fff3e2]/40 transition-colors">
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 font-bold ${
                        isIncoming ? 'text-emerald-700' : 'text-[#700c20]'
                      }`}
                    >
                      {isIncoming ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                      <span>{isIncoming ? 'Payment In' : 'Supplier Payout'}</span>
                    </span>
                  </td>
                  <td className="px-4 py-3.5 font-mono text-[11px]">
                    <a
                      href={`https://sepolia.basescan.org/tx/${tx.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 text-zinc-900 hover:text-[#700c20] font-bold"
                    >
                      <span>{tx.txHash.slice(0, 8)}...{tx.txHash.slice(-6)}</span>
                      <ExternalLink className="w-3 h-3 text-zinc-400" />
                    </a>
                  </td>
                  <td className="px-4 py-3.5 font-montserrat font-bold text-zinc-950">
                    {isIncoming ? '+' : '-'}${tx.amount.toFixed(2)} USDC
                  </td>
                  <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-600 truncate max-w-[160px]">
                    {isIncoming ? tx.senderAddress : tx.recipientAddress}
                  </td>
                  <td className="px-4 py-3.5">
                    <span className="inline-block px-3 py-1 rounded-full text-[10px] font-bold font-play uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                      {tx.verificationStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right text-zinc-500 whitespace-nowrap font-mono">
                    {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </td>
                </tr>
              );
            })}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  No transactions recorded on Base Sepolia testnet yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
