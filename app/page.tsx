'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#fff3e2] text-zinc-900 flex flex-col justify-between selection:bg-[#700c20] selection:text-white">
      {/* Navigation Header */}
      <header className="border-b-2 border-[#700c20]/20 bg-[#fff3e2]/90 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-3.5 group cursor-pointer" title="Back to Overview">
            <div className="w-11 h-11 rounded-[14px] bg-[#700c20] flex items-center justify-center text-white font-black text-lg shadow-sm transition-transform group-hover:scale-105">
              BC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-montserrat-extrabold text-lg sm:text-xl tracking-tight text-zinc-950">
                  Borderless Checkout
                </span>
                <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#700c20]/10 text-[#700c20] border border-[#700c20]/30 font-play">
                  Node Engine 2026
                </span>
              </div>
              <p className="text-xs text-zinc-600 font-play">Merchant & Machine Payments Track</p>
            </div>
          </Link>

          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <button className="px-5 py-2.5 rounded-[35px] bg-[#700c20] text-white font-play font-bold text-xs sm:text-sm hover:bg-[#520917] transition-all shadow-sm cursor-pointer">
                Launch Dashboard
              </button>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Hero & Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 space-y-14 flex-1">
        {/* Hero Section: Left Image, Right Headline & CTAs */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          {/* Left Column: Natural Hero Image */}
          <div className="lg:col-span-5 flex justify-center">
            <div className="relative w-full max-w-[420px] aspect-[4/5] rounded-[35px] overflow-hidden border-[5px] border-[#700c20] shadow-xl bg-white">
              <Image
                src="/hero-natural.jpeg"
                alt="African SME Natural Produce & Commerce"
                fill
                priority
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 420px"
              />
            </div>
          </div>

          {/* Right Column: Copy & Actions */}
          <div className="lg:col-span-7 space-y-6">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl tracking-tight leading-[1.08] text-zinc-950 font-montserrat">
              <span className="block font-black font-montserrat-extrabold">CROSS-BORDER</span>
              <span className="block font-black font-montserrat-extrabold">STABLECOIN</span>
              <span className="block font-normal font-montserrat-regular text-3xl sm:text-4xl lg:text-5xl mt-1 text-zinc-800">
                Payments for African SMEs.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-zinc-700 max-w-xl font-play font-normal leading-relaxed">
              Accept USDC at checkout, verify transactions on Base Sepolia, automatically reconcile orders, and automate supplier settlements using an autonomous AI Treasury Agent protected by independent policy engines.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <Link href="/dashboard" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-8 py-4 rounded-[35px] bg-[#700c20] text-white font-play font-bold text-sm sm:text-base hover:bg-[#520917] transition-all shadow-md cursor-pointer">
                  Launch Dashboard
                </button>
              </Link>
              <Link href="/checkout/ord_live_checkout_01" target="_blank" className="w-full sm:w-auto">
                <button className="w-full sm:w-auto px-8 py-4 rounded-[35px] bg-white text-[#700c20] border-[3px] border-[#700c20] font-play font-bold text-sm sm:text-base hover:bg-[#700c20] hover:text-white transition-all duration-200 shadow-sm cursor-pointer">
                  Customer Checkout Demo
                </button>
              </Link>
            </div>
          </div>
        </section>

        {/* 3 Pillar Cards: Clean with text only, NO icons, 5px border, 35px rounding */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6">
          {/* Card 1: Customer Checkout & Verification */}
          <div className="group rounded-[35px] border-[5px] border-[#700c20] bg-white p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="space-y-3">
              <h2 className="font-montserrat-extrabold text-xl sm:text-2xl text-zinc-950 tracking-tight leading-snug">
                Customer Checkout &amp; Verification
              </h2>
              <p className="text-xs font-semibold text-zinc-500 font-play uppercase tracking-wider">
                Base Sepolia &amp; viem integration
              </p>
              <p className="text-sm text-zinc-700 font-play font-normal leading-relaxed pt-2">
                Unique payment requests per order. Connect wallet or scan QR code. Never marks paid on frontend claims; backend verifies the official USDC transfer event on Base Sepolia.
              </p>
            </div>

            <div className="pt-6">
              <Link href="/checkout/ord_live_checkout_01" target="_blank">
                <button className="w-full py-3 px-5 rounded-[35px] bg-white text-[#700c20] border-[2px] border-[#700c20] font-play font-bold text-xs uppercase tracking-wider hover:bg-[#700c20] hover:text-white transition-all duration-200 cursor-pointer">
                  Try live checkout
                </button>
              </Link>
            </div>
          </div>

          {/* Card 2: AI Merchant Chatbot */}
          <div className="group rounded-[35px] border-[5px] border-[#700c20] bg-white p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="space-y-3">
              <h2 className="font-montserrat-extrabold text-xl sm:text-2xl text-zinc-950 tracking-tight leading-snug">
                AI Merchant Chatbot
              </h2>
              <p className="text-xs font-semibold text-zinc-500 font-play uppercase tracking-wider">
                Claude API with real data tool calling
              </p>
              <p className="text-sm text-zinc-700 font-play font-normal leading-relaxed pt-2">
                Answers queries using actual verified transaction data: &ldquo;How much did I receive today?&rdquo;, &ldquo;Which orders are still unpaid?&rdquo;, &ldquo;What is my USDC balance?&rdquo;. Read-only; no payment execution.
              </p>
            </div>

            <div className="pt-6">
              <Link href="/dashboard">
                <button className="w-full py-3 px-5 rounded-[35px] bg-white text-[#700c20] border-[2px] border-[#700c20] font-play font-bold text-xs uppercase tracking-wider hover:bg-[#700c20] hover:text-white transition-all duration-200 cursor-pointer">
                  Open Chatbot in Dashboard
                </button>
              </Link>
            </div>
          </div>

          {/* Card 3: AI Treasury Agent */}
          <div className="group rounded-[35px] border-[5px] border-[#700c20] bg-white p-7 sm:p-8 flex flex-col justify-between transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="space-y-3">
              <h2 className="font-montserrat-extrabold text-xl sm:text-2xl text-zinc-950 tracking-tight leading-snug">
                AI Treasury Agent
              </h2>
              <p className="text-xs font-semibold text-zinc-500 font-play uppercase tracking-wider">
                Independent policy engine &amp; spending controls
              </p>
              <p className="text-sm text-zinc-700 font-play font-normal leading-relaxed pt-2">
                Monitors invoices and initiates payments. Governed by strict dual-control limits: Scenario 1 ($100 invoice) executes on Base Sepolia; Scenario 2 ($700 invoice) is rejected and blocked.
              </p>
            </div>

            <div className="pt-6">
              <Link href="/dashboard">
                <button className="w-full py-3 px-5 rounded-[35px] bg-white text-[#700c20] border-[2px] border-[#700c20] font-play font-bold text-xs uppercase tracking-wider hover:bg-[#700c20] hover:text-white transition-all duration-200 cursor-pointer">
                  Launch Test Bench
                </button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#700c20]/20 py-8 bg-[#fff3e2]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-play text-zinc-600">
          <div>
            &copy; 2026 Borderless Checkout · Node Engine Hackathon · Merchant &amp; Machine Payments
          </div>
          <div className="flex items-center gap-6">
            <span>Base Sepolia (84532)</span>
            <span>Circle USDC</span>
            <span>Independent Policy Engine</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
