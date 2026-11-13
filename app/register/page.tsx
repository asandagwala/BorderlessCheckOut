'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

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
    <div className="min-h-screen bg-[#fff3e2] text-zinc-900 flex flex-col justify-center items-center p-4 selection:bg-[#700c20] selection:text-white">
      <div className="max-w-md w-full space-y-6">
        <Link href="/dashboard" className="block text-center space-y-2 cursor-pointer group">
          <div className="w-12 h-12 rounded-[14px] bg-[#700c20] flex items-center justify-center text-white font-black text-xl mx-auto shadow-md transition-transform group-hover:scale-105">
            BC
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-montserrat-extrabold text-zinc-950">
            Register SME Merchant
          </h1>
          <p className="text-xs font-play text-zinc-600">Start accepting USDC on Base Sepolia in minutes</p>
        </Link>

        <div className="rounded-[35px] border-[5px] border-[#700c20] bg-white p-8 shadow-xl space-y-6">
          <div className="border-b border-[#700c20]/20 pb-4">
            <h2 className="font-montserrat-extrabold text-lg text-zinc-950">Store Details</h2>
            <p className="text-xs font-play text-zinc-500 mt-0.5">
              Configure your business and Base Sepolia settlement wallet
            </p>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            <div>
              <label className="text-xs font-play font-bold text-zinc-700 block mb-1">
                Business / Store Name
              </label>
              <Input
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="e.g. Lagos Coffee Exporters Ltd"
                required
                className="bg-[#fff3e2]/50 border-2 border-[#700c20] rounded-[20px] text-xs font-play h-11 px-4"
              />
            </div>

            <div>
              <label className="text-xs font-play font-bold text-zinc-700 block mb-1">
                Business Email
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="finance@lagoscoffee.ng"
                required
                className="bg-[#fff3e2]/50 border-2 border-[#700c20] rounded-[20px] text-xs font-play h-11 px-4"
              />
            </div>

            <div>
              <label className="text-xs font-play font-bold text-zinc-700 block mb-1">
                Settlement Wallet Address (Base Sepolia)
              </label>
              <Input
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                placeholder="0x..."
                required
                className="bg-[#fff3e2]/50 border-2 border-[#700c20] rounded-[20px] text-xs font-mono h-11 px-4"
              />
            </div>

            {error && (
              <div className="p-3 bg-rose-50 text-rose-800 border border-rose-300 text-xs font-play rounded-[18px]">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 rounded-[35px] bg-[#700c20] text-white font-play font-bold text-xs uppercase tracking-wider hover:bg-[#520917] disabled:opacity-50 transition-all duration-200 cursor-pointer shadow-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Registering Store...</span>
                </>
              ) : (
                <span>Complete Registration</span>
              )}
            </button>
          </form>
        </div>

        <div className="text-center">
          <Link href="/login" className="text-xs font-play font-bold text-[#700c20] hover:underline">
            Already have a merchant account? Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
