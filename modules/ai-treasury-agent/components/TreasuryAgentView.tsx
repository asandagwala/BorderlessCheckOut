'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Loader2,
  Play,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import type { TreasuryAgentRunResult } from '../treasury-agent.service';
import type { GeminiProposalResponse } from '../gemini-proposal.service';

export function TreasuryAgentView({
  merchantId,
  onActionComplete,
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

  const decision = result ? result.decision || (result as any).policyDecision : null;
  const isApproved = decision === 'APPROVED';
  const reasonText = result ? result.reason || (result as any).policyReason || (result as any).summary : '';

  return (
    <div className="space-y-8">
      {/* Editorial Treasury Protection Banner */}
      <div className="relative overflow-hidden rounded-2xl border border-[#E8DCD0] bg-[#181412] text-white shadow-sm">
        <Image
          src="/uhuru/textiles.png"
          alt="African heritage woven textiles"
          fill
          className="object-cover opacity-35"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#181412] via-[#181412]/85 to-[#181412]/40" />
        <div className="relative p-6 sm:p-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#E59A18] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#181412]">
              <ShieldCheck className="size-3.5" />
              Independent Policy Engine Active
            </div>
            <h2 className="mt-3 font-montserrat-extrabold text-2xl sm:text-3xl tracking-tight text-white">
              Supplier Payout Governance
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-white/80 leading-relaxed">
              Every supplier invoice proposal is evaluated against your $500.00 USDC transaction limit
              and approved vendor whitelist before any Base Sepolia settlement can execute.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 shrink-0">
            <div className="rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-md">
              <span className="block text-[10px] uppercase tracking-wider text-[#E59A18] font-bold">
                Max Per-Tx Limit
              </span>
              <span className="font-montserrat-extrabold text-xl text-white">$500.00 USDC</span>
            </div>
          </div>
        </div>
      </div>

      {/* Two Scenario Trigger Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-7 items-stretch">
        {/* Scenario 1 Card: Approved */}
        <div className="rounded-2xl border-2 border-[#1E6B45]/25 bg-white p-7 sm:p-8 flex flex-col justify-between shadow-[0_12px_32px_-12px_rgba(24,20,18,0.06)]">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#EAF6F0] text-[#1E6B45] border border-[#1E6B45]/25">
                Ready to pay
              </span>
              <span className="font-montserrat-extrabold text-xl font-black text-[#1E6B45]">
                $100.00 USDC
              </span>
            </div>

            <div>
              <h3 className="font-montserrat-extrabold text-xl sm:text-2xl text-[#181412] tracking-tight leading-snug">
                Authorized Supplier Settlement
              </h3>
              <p className="text-xs sm:text-sm text-[#544940] mt-2 leading-relaxed">
                Supplier is approved (&ldquo;Cape Agro Packaging&rdquo;), balance is sufficient, and
                invoice ($100) is well within your $500 spending limit.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FFF8EE] border border-[#E8DCD0] space-y-2 text-xs text-[#2C241E]">
              <div className="flex items-center gap-2">
                <span className="text-[#1E6B45] font-bold">✓</span>
                <span>
                  <strong>Vendor:</strong> Cape Agro Packaging Ltd (Status: APPROVED)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#1E6B45] font-bold">✓</span>
                <span>
                  <strong>Proposed Amount:</strong> $100.00 USDC (Limit: $500.00)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#1E6B45] font-bold">✓</span>
                <span>
                  <strong>Policy Engine:</strong> APPROVES
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#1E6B45] font-bold">✓</span>
                <span>
                  <strong>Execution:</strong> Submitted to Base Sepolia testnet
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6 space-y-3">
            <button
              onClick={() => analyzeInvoice('inv_demo_approved_100')}
              disabled={Boolean(analyzingInvoiceId)}
              className="w-full py-3 px-5 rounded-xl bg-[#FFF8EE] text-[#C84B24] border border-[#C84B24]/40 font-bold text-xs uppercase tracking-wider hover:bg-[#C84B24] hover:text-white disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {analyzingInvoiceId === 'inv_demo_approved_100'
                  ? 'Reviewing invoice…'
                  : 'Review this invoice'}
              </span>
            </button>
            <button
              onClick={() => runScenario('SCENARIO_1')}
              disabled={running}
              className="w-full py-3.5 px-6 rounded-xl bg-[#1E6B45] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#165234] disabled:opacity-50 transition-all cursor-pointer shadow-[0_8px_20px_-6px_rgba(30,107,69,0.45)] flex items-center justify-center gap-2"
            >
              {running && activeScenario === 'SCENARIO_1' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Agent Executing Scenario 1...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current" />
                  <span>Pay $100 invoice</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Scenario 2 Card: Rejected */}
        <div className="rounded-2xl border-2 border-[#8B1E24]/25 bg-white p-7 sm:p-8 flex flex-col justify-between shadow-[0_12px_32px_-12px_rgba(24,20,18,0.06)]">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[#FCECEE] text-[#8B1E24] border border-[#8B1E24]/25">
                Needs review
              </span>
              <span className="font-montserrat-extrabold text-xl font-black text-[#8B1E24]">
                $700.00 USDC
              </span>
            </div>

            <div>
              <h3 className="font-montserrat-extrabold text-xl sm:text-2xl text-[#181412] tracking-tight leading-snug">
                Policy Limit Violation Guardrail
              </h3>
              <p className="text-xs sm:text-sm text-[#544940] mt-2 leading-relaxed">
                Autonomous agent attempts payment of $700.00 for machinery maintenance. Independent
                policy engine blocks on-chain submission immediately.
              </p>
            </div>

            <div className="p-4 rounded-xl bg-[#FFF8EE] border border-[#E8DCD0] space-y-2 text-xs text-[#2C241E]">
              <div className="flex items-center gap-2">
                <span className="text-[#1E6B45] font-bold">✓</span>
                <span>
                  <strong>Vendor:</strong> Kigali Cold Storage Ltd (Status: APPROVED)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#8B1E24] font-bold">✕</span>
                <span>
                  <strong>Proposed Amount:</strong> $700.00 USDC (Limit: $500.00)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#8B1E24] font-bold">✕</span>
                <span>
                  <strong>Policy Engine:</strong> REJECTS (Spending limit exceeded)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[#8B1E24] font-bold">✕</span>
                <span>
                  <strong>Execution:</strong> BLOCKED (No blockchain tx submitted)
                </span>
              </div>
            </div>
          </div>

          <div className="pt-6 space-y-3">
            <button
              onClick={() => analyzeInvoice('inv_demo_rejected_700')}
              disabled={Boolean(analyzingInvoiceId)}
              className="w-full py-3 px-5 rounded-xl bg-[#FFF8EE] text-[#8B1E24] border border-[#8B1E24]/35 font-bold text-xs uppercase tracking-wider hover:bg-[#8B1E24] hover:text-white disabled:opacity-50 transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {analyzingInvoiceId === 'inv_demo_rejected_700'
                  ? 'Reviewing invoice…'
                  : 'Review this invoice'}
              </span>
            </button>
            <button
              onClick={() => runScenario('SCENARIO_2')}
              disabled={running}
              className="w-full py-3.5 px-6 rounded-xl bg-[#C84B24] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#A63816] disabled:opacity-50 transition-all cursor-pointer shadow-[0_8px_20px_-6px_rgba(200,75,36,0.45)] flex items-center justify-center gap-2"
            >
              {running && activeScenario === 'SCENARIO_2' ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span>Agent Evaluating Policy Cap...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 fill-current text-white" />
                  <span>Review $700 invoice</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Gemini Proposal Result Card */}
      {proposal && (
        <div className="rounded-2xl border border-[#E8DCD0] bg-white p-7 sm:p-8 space-y-4 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#EFE5DA]">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#C84B24]" />
                <h3 className="font-montserrat-extrabold text-xl text-[#181412]">
                  Invoice review
                </h3>
              </div>
              <p className="text-xs text-[#685D55] mt-1">
                Generated by {proposal.model} &bull; Supplier: {proposal.supplierName} ($
                {proposal.invoiceAmount.toFixed(2)} USDC)
              </p>
            </div>
            <span className="px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-[#C84B24] text-white">
              Action: {proposal.recommendation}
            </span>
          </div>

          <div className="p-5 rounded-xl bg-[#FFF8EE] border border-[#E8DCD0] space-y-3 text-xs sm:text-sm text-[#2C241E]">
            <div>
              <span className="font-bold block text-[#181412] text-base font-slogan">
                Rationale &amp; Analysis:
              </span>
              <p className="mt-1 text-[#4E443C] leading-relaxed">{proposal.rationale}</p>
            </div>

            {proposal.riskFlags && proposal.riskFlags.length > 0 && (
              <div className="pt-2 border-t border-[#E8DCD0] space-y-1">
                <span className="text-xs font-bold text-[#181412] block">Risk Evaluation Flags:</span>
                <ul className="list-disc list-inside text-xs text-[#4E443C] space-y-0.5">
                  {proposal.riskFlags.map((flag, idx) => (
                    <li key={idx}>{flag}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="pt-2 border-t border-[#E8DCD0] flex items-center justify-between text-xs font-bold">
              <span>Policy Engine Alignment:</span>
              <span
                className={
                  proposal.policyDecision === 'APPROVED' ? 'text-[#1E6B45]' : 'text-[#8B1E24]'
                }
              >
                {proposal.policyDecision} ({proposal.policyReason})
              </span>
            </div>
          </div>
        </div>
      )}

      {proposalError && (
        <div className="p-4 rounded-xl bg-[#FCECEE] border border-[#8B1E24]/30 text-[#8B1E24] text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#8B1E24] shrink-0" />
          <span>{proposalError}</span>
        </div>
      )}

      {/* Execution Results & Step Trace */}
      {result && (
        <div className="rounded-2xl border border-[#E8DCD0] bg-white p-7 sm:p-8 space-y-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-[#EFE5DA]">
            <div>
              <h3 className="font-montserrat-extrabold text-xl text-[#181412]">
                Agent Decision &amp; Verification Trace
              </h3>
              <p className="text-xs text-[#685D55] mt-1">
                Run ID: <span className="font-mono font-bold">{result.runId}</span> &bull; Invoice:{' '}
                <span className="font-mono font-bold">${result.invoiceAmount?.toFixed(2)} USDC</span>{' '}
                to {result.supplierName}
              </p>
            </div>
            <span
              className={`px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                isApproved
                  ? 'bg-[#EAF6F0] text-[#1E6B45] border border-[#1E6B45]/25'
                  : 'bg-[#FCECEE] text-[#8B1E24] border border-[#8B1E24]/25'
              }`}
            >
              Policy Decision: {decision}
            </span>
          </div>

          {/* Outcome summary alert */}
          <div
            className={`p-5 rounded-xl border flex items-start gap-3 ${
              isApproved
                ? 'bg-[#EAF6F0]/70 border-[#1E6B45]/30 text-[#143D29]'
                : 'bg-[#FCECEE]/70 border-[#8B1E24]/30 text-[#5C1216]'
            }`}
          >
            {isApproved ? (
              <CheckCircle2 className="w-5 h-5 text-[#1E6B45] shrink-0 mt-0.5" />
            ) : (
              <XCircle className="w-5 h-5 text-[#8B1E24] shrink-0 mt-0.5" />
            )}
            <div className="text-xs sm:text-sm space-y-1">
              <p className="font-bold">Formal Decision: {decision}</p>
              <p className="text-[#4E443C] leading-relaxed">{reasonText}</p>
              {result.txHash && (
                <div className="pt-2">
                  <a
                    href={`https://sepolia.basescan.org/tx/${result.txHash}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 font-mono text-xs font-bold text-[#C84B24] hover:underline"
                  >
                    <span>
                      View Base Sepolia Tx: {result.txHash.slice(0, 10)}...{result.txHash.slice(-6)}
                    </span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Step traces */}
          <div className="space-y-3 pt-2">
            <h4 className="font-montserrat-extrabold text-sm uppercase tracking-wider text-[#181412]">
              Audit Steps &amp; Reasoning Log
            </h4>
            <div className="space-y-2.5 text-xs">
              {(result.traces || (result as any).steps || []).map((st: any, i: number) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-[#FFF8EE] border border-[#E8DCD0] flex items-start gap-3"
                >
                  <span className="w-6 h-6 rounded-full bg-[#C84B24] text-white flex items-center justify-center shrink-0 font-bold text-[10px]">
                    {st.step || i + 1}
                  </span>
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[#181412] uppercase tracking-wide text-[11px]">
                        {st.action || st.step}
                      </span>
                      <span className="text-[10px] text-[#685D55]">{st.timestamp}</span>
                    </div>
                    <p className="text-[#4E443C] leading-relaxed">{st.detail || st.details}</p>
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
