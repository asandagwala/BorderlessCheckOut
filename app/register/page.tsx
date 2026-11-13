'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, ArrowLeft, Store } from 'lucide-react';

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
        body: JSON.stringify({ businessName, email, walletAddress }),
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
    <main className="auth-page">
      <div className="auth-wrap">
        <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-[#700c20] mb-6"><ArrowLeft size={16}/> Back to Borderless Checkout</Link>
        <div className="auth-brand">
          <span className="brand-mark">BC</span>
          <span><strong className="block text-xl font-black" style={{fontFamily:'var(--font-montserrat)'}}>Borderless Checkout</strong><span className="text-xs text-[#756d6f]">Merchant workspace</span></span>
        </div>
        <section className="auth-card">
          <div className="mb-7">
            <p className="text-xs uppercase tracking-[.16em] text-[#700c20] font-bold mb-2">Get started</p>
            <h1>Register your store</h1>
            <p className="text-sm text-[#756d6f] mt-2">Set up your merchant profile and Base Sepolia settlement wallet.</p>
          </div>
          <form onSubmit={handleRegister} className="space-y-5">
            <div><label htmlFor="businessName">Business / store name</label><input id="businessName" value={businessName} onChange={e => setBusinessName(e.target.value)} placeholder="e.g. Lagos Coffee Exporters Ltd" required/></div>
            <div><label htmlFor="businessEmail">Business email</label><input id="businessEmail" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="finance@yourbusiness.com" required/></div>
            <div><label htmlFor="walletAddress">Settlement wallet address (Base Sepolia)</label><input id="walletAddress" value={walletAddress} onChange={e => setWalletAddress(e.target.value)} placeholder="0x..." required/></div>
            {error && <p role="alert" className="rounded-xl bg-rose-50 text-rose-700 p-3 text-sm">{error}</p>}
            <button className="auth-submit" type="submit" disabled={loading}>{loading ? <Loader2 className="inline mr-2 animate-spin" size={17}/> : <Store className="inline mr-2" size={17}/>}Complete registration</button>
          </form>
          <p className="text-sm text-center text-[#756d6f] mt-6">Already registered? <Link href="/login" className="font-bold text-[#700c20]">Sign in</Link></p>
        </section>
      </div>
    </main>
  );
}
