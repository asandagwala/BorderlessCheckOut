'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { UhuruLogo } from '@/components/ui/uhuru-logo';
import { Loader2, ArrowRight, ShieldCheck } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const [businessName, setBusinessName] = useState('');
  const [email, setEmail] = useState('');
  const [walletAddress, setWalletAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName,
          email,
          walletAddress,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
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
              <span className="inline-flex items-center gap-2 rounded-full bg-[#EAF6F0] border border-[#1E6B45]/25 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#1E6B45]">
                New Merchant Onboarding
              </span>
              <h1 className="mt-4 text-3xl sm:text-4xl font-black font-montserrat-extrabold text-[#181412] tracking-tight">
                Create your UHURU account
              </h1>
              <p className="mt-2 text-sm text-[#685D55]">
                Start accepting verified USDC payments on Base Sepolia and automating supplier
                settlements in minutes.
              </p>
            </div>

            <div className="rounded-2xl border border-[#E8DCD0] bg-white p-7 sm:p-8 shadow-[0_16px_40px_-15px_rgba(24,20,18,0.1)] space-y-6">
              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#3D342E] block mb-1.5">
                    Business / Store Name
                  </label>
                  <Input
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Lagos Coffee Exporters Ltd"
                    required
                    className="bg-[#FFF8EE]/60 border border-[#DCCBC0] rounded-xl text-xs h-11 px-4"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#3D342E] block mb-1.5">
                    Business Email
                  </label>
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="finance@lagoscoffee.ng"
                    required
                    className="bg-[#FFF8EE]/60 border border-[#DCCBC0] rounded-xl text-xs h-11 px-4"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#3D342E] block mb-1.5">
                    Settlement Wallet Address (Base Sepolia)
                  </label>
                  <Input
                    value={walletAddress}
                    onChange={(e) => setWalletAddress(e.target.value)}
                    placeholder="0x..."
                    required
                    className="bg-[#FFF8EE]/60 border border-[#DCCBC0] rounded-xl text-xs font-mono h-11 px-4"
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
                      <span>Registering Store...</span>
                    </>
                  ) : (
                    <>
                      <span>Complete Registration</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>
            </div>

            <div className="text-center">
              <Link
                href="/login"
                className="text-xs font-bold text-[#C84B24] hover:underline"
              >
                Already have a merchant account? Sign In &rarr;
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
            src="/uhuru/hands-harvest.png"
            alt="Artisan hands holding fresh green shea fruit and golden shea butter"
            fill
            priority
            className="object-cover"
            sizes="50vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#14100E]/90 via-[#14100E]/35 to-transparent" />
          <div className="absolute bottom-12 left-12 right-12 rounded-2xl border border-white/20 bg-[#14100E]/80 p-8 text-white backdrop-blur-md">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#1E6B45] px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-white">
              <ShieldCheck className="size-3.5" />
              Direct Settlement
            </div>
            <h2 className="mt-4 font-montserrat-extrabold text-2xl leading-snug">
              Built for African makers, exporters, and growing enterprises.
            </h2>
            <p className="mt-2 text-xs text-white/80 leading-relaxed">
              Your customers pay via simple checkout links while funds settle directly to the Base
              Sepolia wallet you control.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
