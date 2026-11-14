'use client';

import React from 'react';
import { ArrowDownLeft, ArrowUpRight, ExternalLink } from 'lucide-react';
import { Transaction } from '@/lib/database/types';

export function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  return (
    <div className="rounded-2xl border border-[#E8DCD0] bg-white p-6 sm:p-8 shadow-[0_12px_32px_-12px_rgba(24,20,18,0.06)]">
      <div className="pb-6 border-b border-[#EFE5DA] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1E6B45]">
            On-Chain Settlement Ledger
          </p>
          <h2 className="mt-1 font-montserrat-extrabold text-xl sm:text-2xl text-[#181412] tracking-tight">
            Blockchain Transactions (Base Sepolia)
          </h2>
          <p className="text-xs sm:text-sm text-[#685D55] mt-1">
            Verified on-chain USDC customer payments and policy-approved supplier payouts
          </p>
        </div>
        <span className="inline-flex items-center gap-2 self-start sm:self-auto rounded-full bg-[#EAF6F0] border border-[#1E6B45]/20 px-3.5 py-1.5 text-xs font-bold text-[#1E6B45]">
          <span className="h-2 w-2 rounded-full bg-[#1E6B45]" />
          Chain ID 84532
        </span>
      </div>

      <div className="overflow-x-auto pt-4">
        <table className="w-full text-xs text-left">
          <thead className="text-[#685D55] uppercase tracking-wider font-montserrat-extrabold text-[11px] border-b border-[#EFE5DA] bg-[#FFF8EE]/60">
            <tr>
              <th className="px-4 py-3.5 rounded-l-lg">Type</th>
              <th className="px-4 py-3.5">Tx Hash</th>
              <th className="px-4 py-3.5">Amount</th>
              <th className="px-4 py-3.5">Counterparty</th>
              <th className="px-4 py-3.5">Verification</th>
              <th className="px-4 py-3.5 text-right rounded-r-lg">Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F2E8DC]">
            {transactions.map((tx) => {
              const isIncoming = tx.type === 'CUSTOMER_PAYMENT';
              return (
                <tr key={tx.id} className="hover:bg-[#FFF8EE]/50 transition-colors">
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 font-bold ${
                        isIncoming
                          ? 'bg-[#EAF6F0] text-[#1E6B45]'
                          : 'bg-[#FFF1EB] text-[#C84B24]'
                      }`}
                    >
                      {isIncoming ? (
                        <ArrowDownLeft className="w-3.5 h-3.5" />
                      ) : (
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      )}
                      <span>{isIncoming ? 'Payment In' : 'Supplier Payout'}</span>
                    </span>
                  </td>
                  <td className="px-4 py-4 font-mono text-[11px]">
                    <a
                      href={`https://sepolia.basescan.org/tx/${tx.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1.5 text-[#181412] hover:text-[#C84B24] font-bold transition-colors"
                    >
                      <span>
                        {tx.txHash.slice(0, 8)}...{tx.txHash.slice(-6)}
                      </span>
                      <ExternalLink className="w-3 h-3 text-[#C84B24]" />
                    </a>
                  </td>
                  <td
                    className={`px-4 py-4 font-slogan font-bold text-sm ${
                      isIncoming ? 'text-[#1E6B45]' : 'text-[#C84B24]'
                    }`}
                  >
                    {isIncoming ? '+' : '-'}${tx.amount.toFixed(2)} USDC
                  </td>
                  <td className="px-4 py-4 font-mono text-[11px] text-[#685D55] truncate max-w-[160px]">
                    {isIncoming ? tx.senderAddress : tx.recipientAddress}
                  </td>
                  <td className="px-4 py-4">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-[#EAF6F0] text-[#1E6B45] border border-[#1E6B45]/25">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#1E6B45]" />
                      {tx.verificationStatus}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right text-[#685D55] whitespace-nowrap font-mono">
                    {new Date(tx.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                </tr>
              );
            })}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-[#685D55]">
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
