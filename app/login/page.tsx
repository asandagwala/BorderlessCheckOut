'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { UhuruLogo } from '@/components/ui/uhuru-logo';
import { Loader2, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('merchant@kigalifresh.rw');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/auth?email=${encodeURIComponent(email)}`);
      const data = await res.json();

      if (data.merchant) {
        router.push('/dashboard');
      } else {
        setError('Merchant account not found. Please register or check your email.');
      }
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#181412] font-body-arial flex flex-col selection:bg-[#C84B24] selection:text-white">
      <div className="h-1.5 w-full bg-gradient-to-r from-[#C84B24] via-[#E59A18] to-[#1E6B45]" />

      <div className="flex-1 grid lg:grid-cols-2">
        {/* Left Form Column */}
        <div className="flex flex-col justify-between p-6 sm:p-12 lg:p-16">
          <div>
            <UhuruLogo href="/" size="md" theme="dark" showSlogan={true} />
          </div>

          <div className="max-w-md w-full mx-auto my-10 space-y-7">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-[#FFF8EE] border border-[#E59A18]/40 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#C84B24]">
                Merchant Workspace
              </span>
              <h1 className="mt-4 text-3xl sm:text-4xl font-black font-montserrat-extrabold text-[#181412] tracking-tight">
                Welcome back
              </h1>
              <p className="mt-2 text-sm text-[#685D55]">
                Sign in to manage customer payment links, verified Base Sepolia settlements, and
                supplier payouts.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E8DCD0] bg-white p-7 sm:p-8 shadow-[0_16px_40px_-15px_rgba(24,20,18,0.1)] space-y-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#3D342E] block mb-1.5">
                    Merchant Email Address
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    required
                    className="bg-[#FFF8EE]/60 border border-[#DCCBC0] rounded-xl text-xs h-11 px-4"
                  />
                </div>

                {error && (
                  <div className="p-3.5 bg-[#FCECEE] text-[#8B1E24] border border-[#8B1E24]/30 text-xs rounded-xl">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 rounded-xl bg-[#C84B24] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#A63816] disabled:opacity-50 transition-all cursor-pointer shadow-[0_8px_20px_-4px_rgba(200,75,36,0.45)] flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Sign In to Dashboard</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-5 border-t border-[#EFE5DA] space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#685D55] block">
                  Quick Demo Merchants:
                </span>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setEmail('merchant@kigalifresh.rw')}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#FFF8EE] text-[#C84B24] border border-[#C84B24]/30 hover:bg-[#C84B24] hover:text-white transition-colors cursor-pointer"
                  >
                    Kigali Fresh Market
                  </button>
                  <button
                    type="button"
                    onClick={() => setEmail('finance@capeartisans.co.za')}
                    className="px-3.5 py-1.5 text-xs font-bold rounded-lg bg-[#FFF8EE] text-[#C84B24] border border-[#C84B24]/30 hover:bg-[#C84B24] hover:text-white transition-colors cursor-pointer"
                  >
                    Cape Town Artisans
                  </button>
                </div>
              </div>
            </div>

            <div className="text-center">
              <Link
                href="/register"
                className="text-xs font-bold text-[#C84B24] hover:underline"
              >
                Don&apos;t have a merchant account? Register your business &rarr;
              </Link>
            </div>
          </div>

          <p className="text-xs text-[#8C7B6E]">
            UHURU &bull; Freedom to Pay. Freedom to Grow.
          </p>
        </div>

        {/* Right Photography Showcase Column */}
        <div className="hidden lg:block relative overflow-hidden bg-[#181412]">
          <Image
            src="/uhuru/baskets.png"
            alt="Vibrant handwoven African baskets"
            fill
            priority
            className="object-cover"
            sizes="50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#14100E]/90 via-[#14100E]/35 to-transparent" />
          <div className="absolute bottom-12 left-12 right-12 rounded-2xl border border-white/20 bg-[#14100E]/80 p-8 text-white backdrop-blur-md">
            <span className="inline-block rounded-full bg-[#E59A18] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[#181412]">
              Crafted for African Commerce
            </span>
            <h2 className="mt-4 font-montserrat-extrabold text-2xl leading-snug">
              Every payment verified on-chain. Every supplier payout protected by policy.
            </h2>
            <div className="mt-5 flex flex-wrap gap-5 text-xs font-bold text-white/85">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-[#E59A18]" /> Base Sepolia USDC
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-[#E59A18]" /> Instant Reconciliation
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="size-4 text-[#E59A18]" /> $500 Treasury Guardrail
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
