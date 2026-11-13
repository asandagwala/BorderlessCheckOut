import Link from 'next/link';
import { 
  ArrowRight, 
  ShieldCheck, 
  Cpu, 
  Bot, 
  Coins, 
  CheckCircle2, 
  Building2, 
  Layers, 
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-zinc-100 dark:from-zinc-950 dark:via-zinc-900 dark:to-black text-zinc-900 dark:text-zinc-50 flex flex-col justify-between">
      {/* Navigation */}
      <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
              BC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base sm:text-lg tracking-tight">Borderless Checkout</span>
                <Badge variant="outline" className="text-[10px] bg-emerald-50 text-emerald-700 dark:bg-emerald-950 border-emerald-200">
                  Node Engine 2026
                </Badge>
              </div>
              <p className="text-xs text-zinc-500">Merchant & Machine Payments Track</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/dashboard">
              <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm">
                Open Merchant Dashboard <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 space-y-16">
        <div className="text-center space-y-6 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Base Sepolia (84532) • Circle USDC • Claude AI • Drizzle ORM</span>
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-zinc-950 dark:text-zinc-50 leading-[1.15]">
            Cross-Border Stablecoin Payments for African SMEs.
          </h1>

          <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            Accept USDC at checkout, verify transactions on Base Sepolia, automatically reconcile orders, and automate supplier settlements using an autonomous AI Treasury Agent protected by independent policy engines.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link href="/dashboard" className="w-full sm:w-auto">
              <Button size="lg" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm px-6 py-6 shadow-md">
                Launch Merchant Dashboard <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link href="/checkout/ord_live_checkout_01" target="_blank" className="w-full sm:w-auto">
              <Button size="lg" variant="outline" className="w-full text-sm px-6 py-6 border-zinc-300 dark:border-zinc-700">
                <Coins className="w-4 h-4 mr-2 text-emerald-600" />
                Customer Checkout Demo <ExternalLink className="w-3.5 h-3.5 ml-1.5 text-zinc-400" />
              </Button>
            </Link>
          </div>
        </div>

        {/* Core Pillars / Architecture Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
          {/* Card 1: Customer Checkout */}
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center mb-2">
                <Coins className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg">Customer Checkout & Verification</CardTitle>
              <CardDescription className="text-xs">
                Base Sepolia & viem integration
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2 leading-relaxed">
              <p>
                Unique payment requests per order. Connect wallet or scan QR code. Never marks paid on frontend claims; backend verifies the official USDC transfer event on Base Sepolia.
              </p>
              <div className="pt-2">
                <Link href="/checkout/ord_live_checkout_01" className="text-emerald-600 font-semibold hover:underline inline-flex items-center gap-1">
                  Try live checkout <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Card 2: AI Merchant Chatbot */}
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-600 flex items-center justify-center mb-2">
                <Bot className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg">AI Merchant Chatbot</CardTitle>
              <CardDescription className="text-xs">
                Claude API with real data tool calling
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2 leading-relaxed">
              <p>
                Answers queries using actual verified transaction data: "How much did I receive today?", "Which orders are still unpaid?", "What is my USDC balance?". Read-only; no payment execution.
              </p>
              <div className="pt-2">
                <Link href="/dashboard" className="text-blue-600 font-semibold hover:underline inline-flex items-center gap-1">
                  Open Chatbot in Dashboard <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Card 3: AI Treasury Agent */}
          <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-600 flex items-center justify-center mb-2">
                <Cpu className="w-5 h-5" />
              </div>
              <CardTitle className="text-lg">AI Treasury Agent</CardTitle>
              <CardDescription className="text-xs">
                Independent policy engine & spending controls
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-zinc-600 dark:text-zinc-400 space-y-2 leading-relaxed">
              <p>
                Monitors invoices and initiates payments. Strictly enforced by policy:
                Scenario 1 ($100 invoice) is approved and executed; Scenario 2 ($700 invoice) exceeds $500 limit and is blocked!
              </p>
              <div className="pt-2">
                <Link href="/dashboard" className="text-purple-600 font-semibold hover:underline inline-flex items-center gap-1">
                  Launch Test Bench <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Modular Monolith & Tech Stack Banner */}
        <div className="p-6 bg-zinc-100 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 space-y-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            <Layers className="w-4 h-4 text-emerald-600" />
            <span>Modular Monolith Architecture</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
              <span className="text-zinc-400 block text-[10px] uppercase font-bold">Framework</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">Next.js 16 + React 19</span>
            </div>
            <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
              <span className="text-zinc-400 block text-[10px] uppercase font-bold">Database & ORM</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">Drizzle ORM + Postgres</span>
            </div>
            <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
              <span className="text-zinc-400 block text-[10px] uppercase font-bold">Blockchain</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">Base Sepolia (viem)</span>
            </div>
            <div className="p-3 bg-white dark:bg-zinc-800 rounded-xl border border-zinc-200/60 dark:border-zinc-700/60">
              <span className="text-zinc-400 block text-[10px] uppercase font-bold">Intelligence</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">Claude API Tool Calling</span>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-zinc-800 py-6 text-center text-xs text-zinc-500">
        <p>Borderless Checkout • Node Engine Hackathon 2026 • Merchant & Machine Payments Track</p>
      </footer>
    </div>
  );
}
