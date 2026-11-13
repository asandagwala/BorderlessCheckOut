'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, Loader2, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const challengeRes = await fetch('/api/auth/challenge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const challenge = await challengeRes.json();
      if (!challengeRes.ok) throw new Error(challenge.error || 'Could not start wallet sign-in.');

      const ethereum = (window as Window & {
        ethereum?: { request: (args: { method: string; params?: string[] }) => Promise<unknown> };
      }).ethereum;
      if (!ethereum) throw new Error('Install a browser wallet to sign in.');

      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      const walletAddress = Array.isArray(accounts) && typeof accounts[0] === 'string' ? accounts[0] : undefined;
      if (!walletAddress || walletAddress.toLowerCase() !== challenge.walletAddress.toLowerCase()) {
        throw new Error('Connect the wallet registered to this merchant account.');
      }

      const signature = await ethereum.request({
        method: 'personal_sign',
        params: [challenge.message, walletAddress],
      });
      if (typeof signature !== 'string') throw new Error('The wallet returned an invalid signature.');

      const verifyRes = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ signature }),
      });
      const verification = await verifyRes.json();
      if (!verifyRes.ok) throw new Error(verification.error || 'Wallet sign-in failed.');

      router.push('/dashboard');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col justify-center items-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-emerald-600 flex items-center justify-center text-white font-bold text-xl mx-auto shadow-md">
            BC
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Merchant Portal Login</h2>
          <p className="text-xs text-zinc-500">Access your store orders, treasury, and AI assistant</p>
        </div>

        <Card className="border-zinc-200 dark:border-zinc-800 shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="text-base">Sign In</CardTitle>
            <CardDescription className="text-xs">
              Sign a login message with the wallet registered to your merchant account
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                  Merchant Account Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  required
                />
              </div>

              {error && (
                <div className="p-2.5 bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 text-xs rounded-lg">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold py-4"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <ShieldCheck className="w-4 h-4 mr-2" />}
                Sign In with Wallet
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-zinc-100 dark:border-zinc-800 pt-4 text-xs text-zinc-500">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="font-semibold text-emerald-600 hover:underline ml-1">
              Register store
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
