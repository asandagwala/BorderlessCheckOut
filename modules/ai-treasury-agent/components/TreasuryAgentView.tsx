'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  XCircle, 
  ExternalLink, 
  Loader2, 
  Play, 
  Cpu,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import type { TreasuryAgentRunResult } from '../treasury-agent.service';
import type { GeminiProposalResponse } from '../gemini-proposal.service';

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
  const [proposal, setProposal] = useState<GeminiProposalResponse | null>(null);
  const [proposalError, setProposalError] = useState<string | null>(null);
  const [analyzingInvoiceId, setAnalyzingInvoiceId] = useState<string | null>(null);

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

  const analyzeInvoice = async (invoiceId: string) => {
    setAnalyzingInvoiceId(invoiceId);
    setProposal(null);
    setProposalError(null);

    try {
      const response = await fetch('/api/treasury/agent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId, action: 'ANALYZE_INVOICE', invoiceId }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(typeof data.error === 'string' ? data.error : 'Gemini could not analyze this invoice.');
      }
      setProposal(data as GeminiProposalResponse);
    } catch (error: unknown) {
      setProposalError(error instanceof Error ? error.message : 'Gemini could not analyze this invoice.');
    } finally {
      setAnalyzingInvoiceId(null);
    }
  };

  const decision = result ? (result.decision || (result as any).policyDecision) : null;
  const isApproved = decision === 'APPROVED';
  const reasonText = result ? (result.reason || (result as any).policyReason || (result as any).summary) : '';

  return (
    <div className="space-y-8">
      {/* Top Banner / Test Bench Description */}
      <div className="rounded-[35px] border-[5px] border-[#700c20] bg-white p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-5 h-5 text-[#700c20]" />
            <h2 className="font-montserrat-extrabold text-xl sm:text-2xl text-zinc-950 tracking-tight">
              Autonomous AI Treasury Agent Test Bench
            </h2>
          </div>
          <p className="text-xs sm:text-sm font-play text-zinc-600 max-w-2xl">
            Autonomous settlement agent governed by an independent policy engine. Gemini analyzes invoices and returns structured proposals, while policies strictly enforce a $500.00 USDC cap and approved supplier whitelists.
          </p>
        </div>
        <div className="flex items-center gap-2 bg-[#fff3e2] px-4 py-2 rounded-full border-2 border-[#700c20]/20 text-xs font-play shrink-0">
          <ShieldCheck className="w-4 h-4 text-[#700c20]" />
          <span>Spending Limit: <strong className="text-[#700c20] font-bold">$500.00 USDC</strong></span>
        </div>
      </div>

      {/* Two Scenario Trigger Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
        {/* Scenario 1 Card: Approved */}
        <div className="rounded-[35px] border-[5px] border-[#700c20] bg-white p-7 sm:p-8 flex flex-col justify-between shadow-sm transition-all duration-300 hover:shadow-lg">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="px-3 py-1 rounded-full text-xs font-bold font-play uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-300">
                Scenario 1: Approved
              </span>
              <span className="font-montserrat-extrabold text-xl font-black text-[#700c20]">
                $100.00 USDC
              </span>
            </div>

            <div>
              <h3 className="font-montserrat-extrabold text-xl sm:text-2xl text-zinc-950 tracking-tight leading-snug">
                Authorized Supplier Settlement
              </h3>
              <p className="text-xs sm:text-sm font-play text-zinc-600 mt-2 leading-relaxed">
                Supplier is approved (&ldquo;Cape Agro Packaging&rdquo;), balance is sufficient, and invoice ($100) is well within $500 spending limit.
              </p>
            </div>

            <div className="p-4 rounded-[20px] bg-[#fff3e2] border-2 border-[#700c20]/20 space-y-2 text-xs font-play text-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-emerald-700 font-bold">✓</span>
                <span><strong>Vendor:</strong> Cape Agro Packaging Ltd (Status: APPROVED)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-700 font-bold">✓</span>
                <span><strong>Proposed Amount:</strong> $100.00 USDC (Limit: $500.00)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-700 font-bold">✓</span>
                <span><strong>Policy Engine:</strong> APPROVES</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-emerald-700 font-bold">✓</span>
                <span><strong>Execution:</strong> Submitted to Base Sepolia testnet</span>
              </div>
            </div>
          </div>

          <div className="pt-6 space-y-3">
            <button
              onClick={() => analyzeInvoice('inv_demo_approved_100')}
              disabled={Boolean(analyzingInvoiceId)}
              className="w-full py-3 px-6 rounded-[35px] bg-[#fff3e2] text-[#700c20] border-2 border-[#700c20] font-play font-bold text-xs uppercase tracking-wider hover:bg-[#700c20] hover:text-white disabled:opacity-50 transition-all duration-200 cursor-pointer shadow-xs flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{analyzingInvoiceId === 'inv_demo_approved_100' ? 'Gemini is analyzing…' : 'Generate Gemini Proposal'}</span>
            </button>
            <button
              onClick={() => runScenario('SCENARIO_1')}
              disabled={running}
              className="w-full py-3.5 px-6 rounded-[35px] bg-[#700c20] text-white font-play font-bold text-xs uppercase tracking-wider hover:bg-[#520917] disabled:opacity-50 transition-all duration-200 cursor-pointer shadow-xs flex items-center justify-center gap-2"
            >
              {running && activeScenario === 'SCENARIO_1' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Agent Executing Scenario 1...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Run Scenario 1 ($100 Approved)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Scenario 2 Card: Rejected */}
        <div className="rounded-[35px] border-[5px] border-[#700c20] bg-white p-7 sm:p-8 flex flex-col justify-between shadow-sm transition-all duration-300 hover:shadow-lg">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="px-3 py-1 rounded-full text-xs font-bold font-play uppercase tracking-wider bg-rose-100 text-rose-800 border border-rose-300">
                Scenario 2: Rejected
              </span>
              <span className="font-montserrat-extrabold text-xl font-black text-[#700c20]">
                $700.00 USDC
              </span>
            </div>

            <div>
              <h3 className="font-montserrat-extrabold text-xl sm:text-2xl text-zinc-950 tracking-tight leading-snug">
                Policy Limit Violation Guardrail
              </h3>
              <p className="text-xs sm:text-sm font-play text-zinc-600 mt-2 leading-relaxed">
                Autonomous agent attempts payment of $700.00 for machinery maintenance. Independent policy engine blocks on-chain submission immediately.
              </p>
            </div>

            <div className="p-4 rounded-[20px] bg-[#fff3e2] border-2 border-[#700c20]/20 space-y-2 text-xs font-play text-zinc-800">
              <div className="flex items-center gap-2">
                <span className="text-emerald-700 font-bold">✓</span>
                <span><strong>Vendor:</strong> Kigali Cold Storage Ltd (Status: APPROVED)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-rose-700 font-bold">✕</span>
                <span><strong>Proposed Amount:</strong> $700.00 USDC (Limit: $500.00)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-rose-700 font-bold">✕</span>
                <span><strong>Policy Engine:</strong> REJECTS (Spending limit exceeded)</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-rose-700 font-bold">✕</span>
                <span><strong>Execution:</strong> BLOCKED (No blockchain tx submitted)</span>
              </div>
            </div>
          </div>

          <div className="pt-6 space-y-3">
            <button
              onClick={() => analyzeInvoice('inv_demo_rejected_700')}
              disabled={Boolean(analyzingInvoiceId)}
              className="w-full py-3 px-6 rounded-[35px] bg-[#fff3e2] text-[#700c20] border-2 border-[#700c20] font-play font-bold text-xs uppercase tracking-wider hover:bg-[#700c20] hover:text-white disabled:opacity-50 transition-all duration-200 cursor-pointer shadow-xs flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{analyzingInvoiceId === 'inv_demo_rejected_700' ? 'Gemini is analyzing…' : 'Generate Gemini Proposal'}</span>
            </button>
            <button
              onClick={() => runScenario('SCENARIO_2')}
              disabled={running}
              className="w-full py-3.5 px-6 rounded-[35px] bg-[#700c20] text-white font-play font-bold text-xs uppercase tracking-wider hover:bg-[#520917] disabled:opacity-50 transition-all duration-200 cursor-pointer shadow-xs flex items-center justify-center gap-2"
            >
              {running && activeScenario === 'SCENARIO_2' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Agent Evaluating Policy Cap...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current text-white" />
                  <span>Run Scenario 2 ($700 Limit Exceeded)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Gemini Proposal Result Card */}
      {proposal && (
        <div className="rounded-[35px] border-[5px] border-[#700c20] bg-white p-7 sm:p-8 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#700c20]/20">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#700c20]" />
                <h3 className="font-montserrat-extrabold text-xl text-zinc-950">
                  Gemini Proposal Analysis
                </h3>
              </div>
              <p className="text-xs font-play text-zinc-600 mt-1">
                Generated by {proposal.model} • Supplier: {proposal.supplierName} (${proposal.invoiceAmount.toFixed(2)} USDC)
              </p>
            </div>
            <span className="px-4 py-1.5 rounded-full text-xs font-bold font-play uppercase tracking-wider bg-[#700c20] text-white">
              Action: {proposal.recommendation}
            </span>
          </div>

          <div className="p-4 rounded-[20px] bg-[#fff3e2] border-2 border-[#700c20]/20 space-y-3 text-xs sm:text-sm font-play text-zinc-800">
            <div>
              <span className="font-bold block text-zinc-950 text-base font-montserrat">
                Rationale & Analysis:
              </span>
              <p className="mt-1 text-zinc-700 leading-relaxed">{proposal.rationale}</p>
            </div>

            {proposal.riskFlags && proposal.riskFlags.length > 0 && (
              <div className="pt-2 border-t border-[#700c20]/20 space-y-1">
                <span className="text-xs font-bold text-zinc-950 block">Risk Evaluation Flags:</span>
                <ul className="list-disc list-inside text-xs text-zinc-700 space-y-0.5">
                  {proposal.riskFlags.map((flag, idx) => (
                    <li key={idx}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-2 border-t border-[#700c20]/20 flex items-center justify-between text-xs font-bold">
              <span>Policy Engine Alignment:</span>
              <span className={proposal.policyDecision === 'APPROVED' ? 'text-emerald-700' : 'text-rose-700'}>
                {proposal.policyDecision} ({proposal.policyReason})
              </span>
            </div>
          </div>
        </div>
      )}

      {proposalError && (
        <div className="p-4 rounded-[24px] bg-rose-50 border-2 border-rose-300 text-rose-900 text-xs font-play flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{proposalError}</span>
        </div>
      )}

      {/* Execution Results & Step Trace */}
      {result && (
        <div className="rounded-[35px] border-[5px] border-[#700c20] bg-white p-7 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#700c20]/20">
            <div>
              <h3 className="font-montserrat-extrabold text-xl text-zinc-950">
                Agent Decision &amp; Verification Trace
              </h3>
              <p className="text-xs font-play text-zinc-600 mt-1">
                Run ID: <span className="font-mono font-bold">{result.runId}</span> • Invoice: <span className="font-mono font-bold">${result.invoiceAmount?.toFixed(2)} USDC</span> to {result.supplierName}
              </p>
            </div>
            <span
              className={`px-4 py-1.5 rounded-full text-xs font-bold font-play uppercase tracking-wider ${
                isApproved
                  ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                  : 'bg-rose-100 text-rose-800 border border-rose-300'
              }`}
            >
              Policy Decision: {decision}
            </span>
          </div>

          {/* Outcome summary alert */}
          <div
            className={`p-5 rounded-[24px] border-2 flex items-start gap-3 ${
              isApproved
                ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
                : 'bg-rose-50 border-rose-300 text-rose-950'
            }`}
          >
            {isApproved ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            )}
            <div className="text-xs sm:text-sm font-play space-y-1">
              <p className="font-bold">Formal Decision: {decision}</p>
              <p className="text-zinc-600 leading-relaxed">{reasonText}</p>
              {result.txHash && (
                <div className="pt-2">
                  <a
                    href={`https://sepolia.basescan.org/tx/${result.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#700c20] hover:underline"
                  >
                    <span>View Base Sepolia Tx: {result.txHash.slice(0, 10)}...{result.txHash.slice(-6)}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Step traces */}
          <div className="space-y-3 pt-2">
            <h4 className="font-montserrat-extrabold text-sm uppercase tracking-wider text-zinc-900">
              Audit Steps &amp; Reasoning Log
            </h4>
            <div className="space-y-2.5 font-play text-xs">
              {(result.traces || (result as any).steps || []).map((st: any, i: number) => (
                <div
                  key={i}
                  className="p-3.5 rounded-[18px] bg-[#fff3e2] border border-[#700c20]/20 flex items-start gap-3"
                >
                  <span className="w-6 h-6 rounded-full bg-[#700c20] text-white flex items-center justify-center shrink-0 font-bold text-[10px]">
                    {st.step || i + 1}
                  </span>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-zinc-950 uppercase tracking-wide text-[11px]">
                        {st.action || st.step}
                      </span>
                      <span className="text-[10px] text-zinc-500">{st.timestamp}</span>
                    </div>
                    <p className="text-zinc-700 leading-relaxed">{st.detail || st.details}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
