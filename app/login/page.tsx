'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ShieldCheck, ArrowLeft } from 'lucide-react';

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
      if (data.merchant) router.push('/dashboard');
      else setError('Merchant account not found. Please register or check your email.');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-wrap">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#700c20] mb-6"><ArrowLeft size={16}/> Back to Borderless Checkout</Link>
        <div className="auth-brand">
          <span className="brand-mark">BC</span>
          <span><strong className="block text-xl font-black" style={{fontFamily:'var(--font-montserrat)'}}>Borderless Checkout</strong><span className="text-xs text-[#756d6f]">Merchant workspace</span></span>
        </div>
        <section className="auth-card">
          <div className="mb-7">
            <p className="text-xs uppercase tracking-[.16em] text-[#700c20] font-bold mb-2">Welcome back</p>
            <h1>Sign in to your store</h1>
            <p className="text-sm text-[#756d6f] mt-2">Access your orders, payments and treasury activity.</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-5">
            <div><label htmlFor="email">Merchant email address</label><input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" required/></div>
            {error && <p role="alert" className="rounded-xl bg-rose-50 text-rose-700 p-3 text-sm">{error}</p>}
            <button className="auth-submit" type="submit" disabled={loading}>{loading ? <Loader2 className="inline mr-2 animate-spin" size={17}/> : <ShieldCheck className="inline mr-2" size={17}/>}Sign in to dashboard</button>
          </form>
          <div className="mt-6 border-t border-[#eadfe2] pt-5">
            <p className="text-xs text-[#756d6f] font-bold mb-3">Demo merchant accounts</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={() => setEmail('merchant@kigalifresh.rw')} className="rounded-full border border-[#eadfe2] px-3 py-2 text-xs hover:bg-[#f8edf0] hover:text-[#700c20]">Kigali Fresh Market</button>
              <button type="button" onClick={() => setEmail('finance@capeartisans.co.za')} className="rounded-full border border-[#eadfe2] px-3 py-2 text-xs hover:bg-[#f8edf0] hover:text-[#700c20]">Cape Artisans</button>
            </div>
          </div>
          <p className="text-sm text-center text-[#756d6f] mt-6">New to Borderless Checkout? <Link href="/register" className="font-bold text-[#700c20]">Register your store</Link></p>
        </section>
      </div>
    </main>
  );
}
