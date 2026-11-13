'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

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
    <div className="min-h-screen bg-[#fff3e2] text-zinc-900 flex flex-col justify-center items-center p-4 selection:bg-[#700c20] selection:text-white">
      <div className="max-w-md w-full space-y-6">
        <Link href="/dashboard" className="block text-center space-y-2 cursor-pointer group">
          <div className="w-12 h-12 rounded-[14px] bg-[#700c20] flex items-center justify-center text-white font-black text-xl mx-auto shadow-md transition-transform group-hover:scale-105">
            BC
          </div>
          <h1 className="text-2xl sm:text-3xl font-black font-montserrat-extrabold text-zinc-950">
            Merchant Portal Login
          </h1>
          <p className="text-xs font-play text-zinc-600">Access your store orders, treasury, and AI assistant</p>
        </Link>

        <div className="rounded-[35px] border-[5px] border-[#700c20] bg-white p-8 shadow-xl space-y-6">
          <div className="border-b border-[#700c20]/20 pb-4">
            <h2 className="font-montserrat-extrabold text-lg text-zinc-950">Sign In</h2>
            <p className="text-xs font-play text-zinc-500 mt-0.5">
              Enter your registered merchant email to authenticate
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-play font-bold text-zinc-700 block mb-1">
                Merchant Email Address
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@company.com"
                required
                className="bg-[#fff3e2]/50 border-2 border-[#700c20] rounded-[20px] text-xs font-play h-11 px-4"
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
                  <span>Authenticating...</span>
                </>
              ) : (
                <span>Sign In to Merchant Dashboard</span>
              )}
            </button>
          </form>

          <div className="pt-4 border-t border-[#700c20]/20 text-center space-y-2">
            <span className="text-xs font-play text-zinc-500 block">Preset Demo Merchants:</span>
            <div className="flex flex-wrap justify-center gap-2">
              <button
                type="button"
                onClick={() => setEmail('merchant@kigalifresh.rw')}
                className="px-3 py-1 text-[11px] font-play font-bold rounded-full bg-[#fff3e2] text-[#700c20] border border-[#700c20] hover:bg-[#700c20] hover:text-white transition-colors cursor-pointer"
              >
                Kigali Fresh Market
              </button>
              <button
                type="button"
                onClick={() => setEmail('finance@capeartisans.co.za')}
                className="px-3 py-1 text-[11px] font-play font-bold rounded-full bg-[#fff3e2] text-[#700c20] border border-[#700c20] hover:bg-[#700c20] hover:text-white transition-colors cursor-pointer"
              >
                Cape Town Artisans
              </button>
            </div>
          </div>
        </div>

        <div className="text-center">
          <Link href="/register" className="text-xs font-play font-bold text-[#700c20] hover:underline">
            Don&apos;t have a merchant account? Register Store
          </Link>
        </div>
      </div>
    </div>
  );
}
