'use client';

import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Cpu, 
  ShieldCheck, 
  ShieldAlert, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Loader2, 
  Play, 
  ArrowRight,
  AlertTriangle,
  History,
  Coins
} from 'lucide-react';
import { AgentStepTrace, TreasuryAgentRunResult } from '../treasury-agent.service';

export function TreasuryAgentView({ 
  merchantId, 
  onActionComplete 
}: { 
  merchantId: string;
  onActionComplete?: () => void;
}) {
  const [running, setRunning] = useState(false);
  const [activeScenario, setActiveScenario] = useState<'SCENARIO_1' | 'SCENARIO_2' | null>(null);
  const [result, setResult] = useState<TreasuryAgentRunResult | null>(null);

  const runScenario = async (scenario: 'SCENARIO_1' | 'SCENARIO_2') => {
    setRunning(true);
    setActiveScenario(scenario);
    setResult(null);

    try {
      const action = scenario === 'SCENARIO_1' ? 'RUN_SCENARIO_1' : 'RUN_SCENARIO_2';
      const res = await fetch('/api/treasury/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          action,
        }),
      });

      const data = await res.json();
      setResult(data);
      if (onActionComplete) onActionComplete();
    } catch (err) {
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Explanation */}
      <div className="p-4 bg-zinc-900 text-white rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Cpu className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-base">Autonomous AI Treasury Agent Test Bench</h3>
          </div>
          <p className="text-xs text-zinc-400 mt-1 max-w-2xl">
            Demonstrates controlled financial automation using Claude API tool calling and an independent policy engine. 
            The agent proposes payments; independent policy checks and a confirmed Base Sepolia transfer are both required before an invoice is marked paid.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-zinc-800 px-3 py-1.5 rounded-lg border border-zinc-700 text-xs">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Active Spending Limit: <strong className="text-emerald-400">$500.00 USDC</strong></span>
        </div>
      </div>

      {/* Two Scenario Trigger Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Scenario 1 Card */}
        <Card className="border-emerald-200 dark:border-emerald-900/50 bg-emerald-50/20 dark:bg-emerald-950/10">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <Badge variant="success" className="text-xs">Scenario 1: Approved</Badge>
              <span className="font-mono font-bold text-emerald-600 text-sm">$100.00 USDC</span>
            </div>
            <CardTitle className="text-base text-zinc-900 dark:text-zinc-50 pt-1">
              Authorized Supplier Settlement
            </CardTitle>
            <CardDescription className="text-xs">
              The approved supplier's $100 invoice is within policy limits. Settlement requires a configured, funded treasury wallet.
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
              <li>✓ Vendor: Cape Agro Packaging Ltd (Status: APPROVED)</li>
              <li>✓ Proposed Amount: $100.00 USDC (Limit: $500.00)</li>
              <li>✓ Policy Engine: APPROVES</li>
              <li>✓ Settlement: Paid only after Base Sepolia confirms the transfer</li>
            </ul>
            <Button
              onClick={() => runScenario('SCENARIO_1')}
              disabled={running}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs mt-2"
            >
              {running && activeScenario === 'SCENARIO_1' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Agent Executing Scenario 1...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 mr-2" />
                  Run Scenario 1 ($100 Approved)
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* Scenario 2 Card */}
        <Card className="border-rose-200 dark:border-rose-900/50 bg-rose-50/20 dark:bg-rose-950/10">
          <CardHeader className="pb-3">
            <div className="flex justify-between items-start">
              <Badge variant="destructive" className="text-xs">Scenario 2: Rejected</Badge>
              <span className="font-mono font-bold text-rose-600 text-sm">$700.00 USDC</span>
            </div>
            <CardTitle className="text-base text-zinc-900 dark:text-zinc-50 pt-1">
              Policy-Enforced Spending Cap Rejection
            </CardTitle>
            <CardDescription className="text-xs">
              Agent attempts to initiate payment for a $700 invoice. Independent policy engine blocks it ($700 &gt; $500 limit). No tx submitted!
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-0 space-y-3">
            <ul className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
              <li>✓ Vendor: Nairobi Cold-Chain Logistics</li>
              <li>✗ Proposed Amount: $700.00 USDC (Exceeds $500.00 limit)</li>
              <li>✗ Policy Engine: REJECTED & BLOCKED</li>
              <li>✗ Blockchain: No transaction submitted to network</li>
            </ul>
            <Button
              onClick={() => runScenario('SCENARIO_2')}
              disabled={running}
              variant="destructive"
              className="w-full text-xs mt-2"
            >
              {running && activeScenario === 'SCENARIO_2' ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />
                  Agent Evaluating Scenario 2...
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 mr-2" />
                  Run Scenario 2 ($700 Limit Exceeded)
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Live Agent Execution Trace View */}
      {result && (
        <Card className="border-zinc-200 dark:border-zinc-800 shadow-md animate-in fade-in duration-300">
          <CardHeader className="pb-3 border-b border-zinc-100 dark:border-zinc-800 flex flex-row items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">Agent Reasoning & Policy Evaluation Trace</CardTitle>
                <Badge variant={result.executedOnChain ? "success" : "destructive"}>
                  {result.decision}
                </Badge>
              </div>
              <CardDescription className="text-xs mt-0.5">
                Run ID: <span className="font-mono">{result.runId}</span> • Invoice: <span className="font-mono">${result.invoiceAmount.toFixed(2)} USDC</span> to {result.supplierName}
              </CardDescription>
            </div>
            {result.executedOnChain ? (
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 font-medium">
                <CheckCircle2 className="w-4 h-4" />
                <span>On-Chain Settlement Confirmed</span>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 font-medium">
                <ShieldAlert className="w-4 h-4" />
                <span>{result.decision === 'REQUIRES_APPROVAL' ? 'Human Approval Required' : result.decision === 'REJECTED' ? 'Blocked by Policy' : 'Settlement Not Confirmed'}</span>
              </div>
            )}
          </CardHeader>
          <CardContent className="p-4 space-y-4">
            {/* Step Traces */}
            <div className="space-y-2">
              {result.traces.map((trace) => {
                let badgeClass = "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300";
                if (trace.status === 'success') badgeClass = "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300";
                if (trace.status === 'warning') badgeClass = "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300";
                if (trace.status === 'error') badgeClass = "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300";

                return (
                  <div
                    key={trace.step}
                    className="flex items-start gap-3 p-2.5 rounded-lg border border-zinc-100 dark:border-zinc-800 text-xs bg-zinc-50/50 dark:bg-zinc-900/50"
                  >
                    <span className="w-5 h-5 rounded-full bg-zinc-200 dark:bg-zinc-700 flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                      {trace.step}
                    </span>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-medium ${badgeClass}`}>
                          {trace.action}
                        </span>
                        <span className="text-[10px] text-zinc-400">{trace.timestamp}</span>
                      </div>
                      <p className="mt-1 text-zinc-700 dark:text-zinc-300 leading-relaxed font-sans">
                        {trace.detail}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Outcome Summary Box */}
            <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-2 ${
              result.executedOnChain 
                ? 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-200' 
                : 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-800 text-rose-900 dark:text-rose-200'
            }`}>
              <div className="font-semibold text-sm flex items-center gap-2">
                {result.executedOnChain ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <XCircle className="w-4 h-4 text-rose-600" />}
                <span>Formal Decision: {result.decision}</span>
              </div>
              <p>{result.reason}</p>

              {result.txHash && (
                <div className="pt-2 border-t border-emerald-200 dark:border-emerald-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="font-mono text-[11px] truncate">
                    Base Sepolia Tx Hash: <span className="font-semibold">{result.txHash}</span>
                  </div>
                  <a
                    href={`https://sepolia.basescan.org/tx/${result.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 font-semibold text-emerald-700 dark:text-emerald-300 hover:underline shrink-0"
                  >
                    View on BaseScan <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
