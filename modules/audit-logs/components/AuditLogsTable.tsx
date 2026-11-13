'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ShieldCheck, ExternalLink, RefreshCw, CheckCircle, AlertCircle, Clock } from 'lucide-react';
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
    <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <div>
          <CardTitle className="text-base flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-[#700c20]" />
            AI Treasury Agent Audit Log
          </CardTitle>
          <CardDescription className="text-xs">
            Immutable log of all AI agent evaluations, independent policy engine decisions, and blockchain hashes
          </CardDescription>
        </div>
        <Button variant="outline" size="sm" onClick={fetchLogs} className="text-xs">
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 uppercase tracking-wider font-semibold border-b border-zinc-200 dark:border-zinc-800">
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
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                  <td className="px-4 py-3 text-zinc-400 whitespace-nowrap">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 font-mono font-medium text-zinc-900 dark:text-zinc-100">
                    {log.agentAction}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300 font-medium">
                    {log.supplier || 'N/A'}
                  </td>
                  <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-50 whitespace-nowrap">
                    {log.proposedAmount ? `$${log.proposedAmount.toFixed(2)} USDC` : '-'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={log.policyDecision === 'APPROVED' ? 'success' : 'destructive'} className="text-[10px]">
                      {log.policyDecision}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400 max-w-[280px] truncate" title={log.policyReason}>
                    {log.policyReason || '-'}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={log.executionStatus === 'EXECUTED' ? 'success' : 'destructive'} className="text-[10px]">
                      {log.executionStatus}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-right font-mono text-[11px]">
                    {log.txHash ? (
                      <a
                        href={`https://sepolia.basescan.org/tx/${log.txHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-[#700c20] hover:text-[#580918] font-semibold"
                      >
                        <span>{log.txHash.slice(0, 8)}...{log.txHash.slice(-4)}</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    ) : (
                      <span className="text-zinc-400">None (Blocked)</span>
                    )}
                  </td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-4 py-8 text-center text-zinc-400">
                    No audit records logged yet. Run Treasury Agent Scenario 1 or Scenario 2 above to view traces.
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
