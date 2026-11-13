import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Coins, Bot, Cpu, ShieldCheck, ExternalLink } from "lucide-react";

const pillars = [
  {
    title: "Customer Checkout & Verification",
    kicker: "Base Sepolia & viem integration",
    body: "Unique payment requests for every order. Customers can connect a wallet or scan a QR code. Every payment is verified against the official USDC transfer event on Base Sepolia.",
    action: "Try live checkout",
    href: "/checkout/ord_live_checkout_01",
  },
  {
    title: "AI Merchant Chatbot",
    kicker: "Claude API with real data tool calling",
    body: "Ask questions about verified payments, outstanding orders and your USDC balance. The assistant uses real merchant records and remains read-only.",
    action: "Open merchant dashboard",
    href: "/dashboard",
  },
  {
    title: "AI Treasury Agent",
    kicker: "Independent policy engine & spending controls",
    body: "Automate supplier settlements with clear guardrails. An independent policy engine enforces approved suppliers, spending limits and audit logging.",
    action: "Launch test bench",
    href: "/dashboard",
  },
];

export default function Home() {
  return (
    <main className="landing-shell">
      <header className="landing-nav">
        <Link href="/" className="flex items-center gap-3">
          <span className="brand-mark">BC</span>
          <span>
            <span className="block font-black text-lg tracking-tight" style={{fontFamily:"var(--font-montserrat)"}}>Borderless Checkout</span>
            <span className="block text-xs text-[#756d6f]">Merchant & Machine Payments Track</span>
          </span>
        </Link>
        <Link href="/dashboard" className="landing-button primary">
          Launch Dashboard <ArrowRight size={17} />
        </Link>
      </header>

      <section className="landing-hero">
        <div className="relative">
          <Image
            src="/hero-natural.jpeg"
            alt="Fresh produce in a rural African market"
            width={620}
            height={924}
            priority
            className="hero-photo"
          />
        </div>
        <div>
          <p className="text-xs uppercase tracking-[.18em] font-bold text-[#700c20] mb-4">Borderless payments. More opportunity.</p>
          <h1 className="hero-title">Cross-border stablecoin</h1>
          <p className="hero-subtitle">Payments for African SMEs.</p>
          <p className="hero-copy">
            Accept USDC at checkout, verify transactions on Base Sepolia, automatically reconcile orders, and automate supplier settlements using an autonomous AI Treasury Agent protected by independent policy engines.
          </p>
          <div className="landing-actions">
            <Link href="/dashboard" className="landing-button primary">Launch Dashboard <ArrowRight size={17} /></Link>
            <Link href="/checkout/ord_live_checkout_01" target="_blank" className="landing-button secondary">
              Customer Checkout Demo <ExternalLink size={15} />
            </Link>
          </div>
          <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-xs text-[#756d6f]">
            <span className="inline-flex items-center gap-2"><ShieldCheck size={15} className="text-[#700c20]"/> Verified payments</span>
            <span className="inline-flex items-center gap-2"><Coins size={15} className="text-[#700c20]"/> USDC settlement</span>
            <span className="inline-flex items-center gap-2"><Cpu size={15} className="text-[#700c20]"/> Policy-protected AI</span>
          </div>
        </div>
      </section>

      <section className="pillar-grid" aria-label="Platform features">
        {pillars.map((pillar, index) => {
          const Icon = [Coins, Bot, Cpu][index];
          return (
            <article className="pillar-card" key={pillar.title}>
              <div className="w-11 h-11 rounded-2xl bg-[#f8edf0] text-[#700c20] flex items-center justify-center mb-5">
                <Icon size={21}/>
              </div>
              <h2>{pillar.title}</h2>
              <p className="pillar-kicker">{pillar.kicker}</p>
              <p>{pillar.body}</p>
              <Link href={pillar.href}>{pillar.action} <span aria-hidden>→</span></Link>
            </article>
          );
        })}
      </section>
      <footer className="landing-footer">
        Borderless Checkout · Node Engine Hackathon 2026 · Merchant & Machine Payments Track
      </footer>
    </main>
  );
}

