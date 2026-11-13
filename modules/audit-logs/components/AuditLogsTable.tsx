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
    <div className="rounded-[35px] border-[5px] border-[#700c20] bg-white p-6 sm:p-8 shadow-sm">
      {/* Header: Clean title WITHOUT icon */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#700c20]/20">
        <div>
          <h2 className="font-montserrat-extrabold text-xl sm:text-2xl text-zinc-950 tracking-tight">
            AI Treasury Agent Audit Log
          </h2>
          <p className="text-xs sm:text-sm font-play text-zinc-600 mt-1">
            Immutable log of all AI agent evaluations, independent policy engine decisions, and blockchain hashes
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="px-5 py-2 rounded-[35px] bg-white text-[#700c20] border-[2px] border-[#700c20] font-play font-bold text-xs uppercase tracking-wider hover:bg-[#700c20] hover:text-white transition-all duration-200 cursor-pointer shadow-xs flex items-center gap-1.5"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      <div className="overflow-x-auto pt-4">
        <table className="w-full text-xs text-left">
          <thead className="text-zinc-600 uppercase tracking-wider font-montserrat-extrabold text-[11px] border-b-2 border-[#700c20]/20">
            <tr>
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Agent Action</th>
              <th className="px-4 py-3">Supplier</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Policy Decision</th>
              <th className="px-4 py-3">Policy Reason</th>
              <th className="px-4 py-3">Execution Status</th>
              <th className="px-4 py-3 text-right">Blockchain Tx</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#700c20]/10 font-play">
            {logs.map((log) => (
              <tr key={log.id} className="hover:bg-[#fff3e2]/40 transition-colors">
                <td className="px-4 py-3.5 text-zinc-500 font-mono whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </td>
                <td className="px-4 py-3.5 font-mono font-bold text-zinc-900">
                  {log.agentAction}
                </td>
                <td className="px-4 py-3.5 text-zinc-800 font-semibold">
                  {log.supplier || 'N/A'}
                </td>
                <td className="px-4 py-3.5 font-montserrat font-bold text-zinc-950 whitespace-nowrap">
                  {log.proposedAmount ? `$${log.proposedAmount.toFixed(2)} USDC` : '-'}
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold font-play uppercase tracking-wider ${
                      log.policyDecision === 'APPROVED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-rose-100 text-rose-800 border border-rose-300'
                    }`}
                  >
                    {log.policyDecision}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-zinc-600 max-w-[280px] truncate" title={log.policyReason}>
                  {log.policyReason || '-'}
                </td>
                <td className="px-4 py-3.5">
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold font-play uppercase tracking-wider ${
                      log.executionStatus === 'EXECUTED'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                        : 'bg-zinc-100 text-zinc-700 border border-zinc-300'
                    }`}
                  >
                    {log.executionStatus}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right font-mono text-[11px]">
                  {log.txHash ? (
                    <a
                      href={`https://sepolia.basescan.org/tx/${log.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 font-bold text-[#700c20] hover:underline"
                    >
                      <span>{log.txHash.slice(0, 8)}...{log.txHash.slice(-4)}</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  ) : (
                    <span className="text-zinc-400 italic">none (Blocked)</span>
                  )}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={8} className="px-4 py-8 text-center text-zinc-500">
                  No audit logs recorded yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
