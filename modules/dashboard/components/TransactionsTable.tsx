'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowDownLeft, ArrowUpRight, ExternalLink } from 'lucide-react';
import { Transaction } from '@/lib/database/types';

export function TransactionsTable({ transactions }: { transactions: Transaction[] }) {
  return (
    <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          Blockchain Transactions (Base Sepolia)
        </CardTitle>
        <CardDescription className="text-xs">
          Verified on-chain USDC customer payments and agent-initiated supplier payouts
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 uppercase tracking-wider font-semibold border-b border-zinc-200 dark:border-zinc-800">
              <tr>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Tx Hash</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">From / To</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {transactions.map((tx) => {
                const isIncoming = tx.type === 'CUSTOMER_PAYMENT';
                return (
                  <tr key={tx.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 font-medium ${isIncoming ? 'text-emerald-600' : 'text-blue-600'}`}>
                        {isIncoming ? <ArrowDownLeft className="w-3.5 h-3.5" /> : <ArrowUpRight className="w-3.5 h-3.5" />}
                        {isIncoming ? 'Payment In' : 'Supplier Payout'}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px]">
                      <a
                        href={`https://sepolia.basescan.org/tx/${tx.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-zinc-900 dark:text-zinc-100 hover:text-emerald-600 font-medium"
                      >
                        <span>{tx.txHash.slice(0, 8)}...{tx.txHash.slice(-6)}</span>
                        <ExternalLink className="w-3 h-3 text-zinc-400" />
                      </a>
                    </td>
                    <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-50">
                      {isIncoming ? '+' : '-'}${tx.amount.toFixed(2)} USDC
                    </td>
                    <td className="px-4 py-3 font-mono text-[11px] text-zinc-500 truncate max-w-[150px]">
                      {isIncoming ? tx.senderAddress : tx.recipientAddress}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="success" className="text-[10px]">
                        {tx.verificationStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-400 whitespace-nowrap">
                      {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                );
              })}
              {transactions.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-400">
                    No transactions recorded on Base Sepolia testnet yet.
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
