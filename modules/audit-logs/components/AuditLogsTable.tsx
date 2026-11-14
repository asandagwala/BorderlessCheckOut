'use client';

import React, { useState, useEffect } from 'react';
import { ExternalLink, RefreshCw } from 'lucide-react';
import { AgentAuditLog } from '@/lib/database/types';

export function AuditLogsTable({ merchantId }: { merchantId: string }) {
  const [logs, setLogs] = useState<AgentAuditLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/audit-logs?merchantId=${merchantId}`);
      const data = await res.json();
      setLogs(data.logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [merchantId]);

  return (
    <div className="rounded-2xl border border-[#E8DCD0] bg-white p-6 sm:p-8 shadow-[0_12px_32px_-12px_rgba(24,20,18,0.06)]">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#EFE5DA]">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C84B24]">
            Immutable Governance Log
          </p>
          <h2 className="mt-1 font-montserrat-extrabold text-xl sm:text-2xl text-[#181412] tracking-tight">
            Monthly sales &amp; payment activity
          </h2>
          <p className="text-xs sm:text-sm text-[#685D55] mt-1">
            A clear record of supplier payments, policy decisions, and blockchain receipts for this month.
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="px-4 py-2 rounded-lg bg-white text-[#463C35] border border-[#E4D5C5] font-bold text-xs uppercase tracking-wider hover:border-[#C84B24] hover:text-[#C84B24] transition-all cursor-pointer flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-[#C84B24]' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="overflow-x-auto pt-4">
        <table className="w-full text-xs text-left">
          <thead className="text-[#685D55] uppercase tracking-wider font-montserrat-extrabold text-[11px] border-b border-[#EFE5DA] bg-[#FFF8EE]/60">
            <tr>
              <th className="px-4 py-3.5 rounded-l-lg">Timestamp</th>
              <th className="px-4 py-3.5">Activity</th>
              <th className="px-4 py-3.5">Payee</th>
              <th className="px-4 py-3.5">Amount</th>
              <th className="px-4 py-3.5">Policy Status</th>
              <th className="px-4 py-3.5">Details</th>
              <th className="px-4 py-3.5">Execution</th>
              <th className="px-4 py-3.5 text-right rounded-r-lg">Receipt</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F2E8DC]">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-[#FFF8EE]/50 transition-colors">
                <td className="px-4 py-4 text-[#685D55] font-mono whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  })}
                </td>
                <td className="px-4 py-4 font-mono font-bold text-[#181412]">
                  {log.agentAction}
                </td>
                <td className="px-4 py-4 text-[#3D342E] font-bold">
                  {log.supplier || 'N/A'}
                </td>
                <td className="px-4 py-4 font-slogan font-bold text-[#181412] whitespace-nowrap">
                  {log.proposedAmount ? `$${log.proposedAmount.toFixed(2)} USDC` : '-'}
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      log.policyDecision === 'APPROVED'
                        ? 'bg-[#EAF6F0] text-[#1E6B45] border border-[#1E6B45]/25'
                        : 'bg-[#FCECEE] text-[#8B1E24] border border-[#8B1E24]/25'
                    }`}
                  >
                    {log.policyDecision}
                  </span>
                </td>
                <td className="px-4 py-4 text-[#544940] max-w-[280px] truncate" title={log.policyReason}>
                  {log.policyReason || '-'}
                </td>
                <td className="px-4 py-4">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      log.executionStatus === 'EXECUTED'
                        ? 'bg-[#EAF6F0] text-[#1E6B45] border border-[#1E6B45]/25'
                        : 'bg-[#FFF6E0] text-[#9A6004] border border-[#E59A18]/40'
                    }`}
                  >
                    {log.executionStatus}
                  </span>
                </td>
                <td className="px-4 py-4 text-right font-mono text-[11px]">
                  {log.txHash ? (
                    <a
                      href={`https://sepolia.basescan.org/tx/${log.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-[#C84B24] hover:underline"
                    >
                      <span>
                        {log.txHash.slice(0, 8)}...{log.txHash.slice(-4)}
                      </span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-[#8B1E24]/70 italic">Blocked</span>
                  )}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-10 text-center text-[#685D55]">
                  No activity recorded for this period yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
