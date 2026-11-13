'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Building2, ArrowRight, Loader2, ShieldCheck } from 'lucide-react';

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
        // Successful login
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
              Enter your registered merchant email to authenticate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 block mb-1">
                  Merchant Email Address
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
                Sign In to Merchant Dashboard
              </Button>
            </form>

            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 text-center">
              <span className="text-xs text-zinc-500 block mb-2">Preset Demo Merchants:</span>
              <div className="flex justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setEmail('merchant@kigalifresh.rw')}
                  className="px-2 py-1 text-[11px] rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                >
                  Kigali Fresh Market
                </button>
                <button
                  type="button"
                  onClick={() => setEmail('finance@capeartisans.co.za')}
                  className="px-2 py-1 text-[11px] rounded bg-zinc-100 dark:bg-zinc-800 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                >
                  Cape Artisans
                </button>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-zinc-100 dark:border-zinc-800 pt-4 text-xs text-zinc-500">
            Don't have an account?{' '}
            <Link href="/register" className="font-semibold text-emerald-600 hover:underline ml-1">
              Register store
            </Link>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
