'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  RefreshCw,
  Plus,
  LayoutDashboard,
  ShoppingBag,
  ArrowLeftRight,
  ShieldCheck,
  Users,
  CalendarClock,
  Wallet,
  Sparkles,
  ExternalLink,
  CheckCircle2,
  Clock,
  RotateCcw,
  Banknote,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { UhuruLogo } from '@/components/ui/uhuru-logo';
import { OrdersTable } from '@/modules/dashboard/components/OrdersTable';
import { TransactionsTable } from '@/modules/dashboard/components/TransactionsTable';
import { CreateOrderModal } from '@/modules/dashboard/components/CreateOrderModal';
import { TreasuryAgentView } from '@/modules/ai-treasury-agent/components/TreasuryAgentView';
import { SuppliersAndInvoicesView } from '@/modules/suppliers/components/SuppliersAndInvoicesView';
import { AuditLogsTable } from '@/modules/audit-logs/components/AuditLogsTable';
import { FloatingChatbot } from '@/modules/ai-chatbot/components/FloatingChatbot';
import { RefundsDashboardPanel } from '@/modules/refunds/components/RefundsDashboardPanel';
import { CashOutView } from '@/modules/cash-out/components/CashOutView';

type TabType = 'overview' | 'orders' | 'transactions' | 'refunds' | 'cash-out' | 'treasury-agent' | 'suppliers' | 'audit-logs';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [merchantId, setMerchantId] = useState('merch_kigali_01');
  const [merchantsList, setMerchantsList] = useState<any[]>([]);
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [walletDraft, setWalletDraft] = useState('');
  const [savingWallet, setSavingWallet] = useState(false);
  const [walletSaveMessage, setWalletSaveMessage] = useState<string | null>(null);

  // Fetch merchants and dashboard stats
  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, merchRes] = await Promise.all([
        fetch(`/api/dashboard/stats?merchantId=${merchantId}`),
        fetch('/api/auth'),
      ]);
      const stats = await statsRes.json();
      const merch = await merchRes.json();
      setStatsData(stats);
      setMerchantsList(merch.merchants || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [merchantId]);

  const stats = statsData?.stats;
  const merchant = statsData?.merchant;

  const saveMerchantWallet = async () => {
    setSavingWallet(true);
    setWalletSaveMessage(null);
    try {
      const response = await fetch('/api/auth', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ merchantId, walletAddress: walletDraft || merchant?.walletAddress }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Unable to save settlement wallet');
      setWalletDraft(data.merchant.walletAddress);
      setWalletSaveMessage('Settlement wallet saved. New checkout payments will use this address.');
      await fetchDashboardData();
    } catch (error) {
      setWalletSaveMessage(error instanceof Error ? error.message : 'Unable to save settlement wallet');
    } finally {
      setSavingWallet(false);
    }
  };

  const tabs: {
    id: TabType;
    label: string;
    subtitle: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] = [
    { id: 'overview', label: 'Overview', subtitle: 'Balance & quick actions', icon: LayoutDashboard },
    { id: 'orders', label: 'Customer Orders', subtitle: 'Payment links & statuses', icon: ShoppingBag },
    { id: 'transactions', label: 'Transactions', subtitle: 'On-chain Base Sepolia ledger', icon: ArrowLeftRight },
    { id: 'refunds', label: 'Refunds', subtitle: 'Verified USDC returns', icon: RotateCcw },
    { id: 'cash-out', label: 'Cash-out', subtitle: 'Simulated ZAR payout', icon: Banknote },
    { id: 'treasury-agent', label: 'Treasury', subtitle: 'Policy-guarded payouts', icon: ShieldCheck },
    { id: 'suppliers', label: 'Suppliers & Invoices', subtitle: 'Approved vendors & bills', icon: Users },
    { id: 'audit-logs', label: 'Monthly activity', subtitle: 'Audit trail & decisions', icon: CalendarClock },
  ];

  const activeTabMeta = tabs.find((t) => t.id === activeTab) || tabs[0];
  const recentOrders = statsData?.recentOrders || [];
  const pendingOrdersCount =
    stats?.pendingOrdersCount ??
    recentOrders.filter((o: any) => o.paymentStatus === 'PENDING' || o.paymentStatus === 'CONFIRMING').length;

  return (
    <div className="min-h-screen bg-white text-[#181412] font-body-arial flex selection:bg-[#C84B24] selection:text-white">
      {/* Desktop Side Navigation */}
      <aside className="hidden lg:flex w-72 shrink-0 min-h-screen border-r border-[#ECE0D3] bg-[#FFF8EE] p-6 flex-col fixed inset-y-0 left-0 z-40">
        {/* Top vibrant stripe */}
        <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-[#C84B24] via-[#E59A18] to-[#1E6B45]" />

        <div className="pt-1">
          <button
            onClick={() => setActiveTab('overview')}
            className="text-left focus:outline-none cursor-pointer"
            title="Return to Dashboard Overview"
          >
            <UhuruLogo size="sm" theme="dark" showSlogan={true} />
          </button>
        </div>

        {/* Active Merchant Switcher */}
        <div className="mt-7 rounded-xl border border-[#E6D7C7] bg-white p-3.5 shadow-xs">
          <label
            htmlFor="desktop-merchant-select"
            className="block text-[10px] font-bold uppercase tracking-[0.16em] text-[#C84B24]"
          >
            Active Merchant Store
          </label>
          <div className="relative mt-1.5">
            <select
              id="desktop-merchant-select"
              value={merchantId}
              onChange={(e) => {
                setWalletDraft('');
                setWalletSaveMessage(null);
                setMerchantId(e.target.value);
              }}
              className="w-full appearance-none rounded-lg border border-[#E4D5C5] bg-[#FFF8EE]/60 px-3 py-2 pr-7 text-xs font-bold text-[#181412] focus:border-[#C84B24] focus:outline-none cursor-pointer"
            >
              {merchantsList.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.businessName}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute inset-y-0 right-2.5 flex items-center text-[10px] text-[#C84B24]">
              ▼
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="mt-6 space-y-1.5 flex-1">
          <p className="px-3 pb-1.5 text-[10px] font-bold uppercase tracking-[0.18em] text-[#7A6E65]">
            Workspace
          </p>
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`group w-full flex items-center gap-3 rounded-xl px-3.5 py-3 text-left transition-all cursor-pointer ${
                  isActive
                    ? 'bg-[#C84B24] text-white shadow-[0_8px_20px_-6px_rgba(200,75,36,0.45)]'
                    : 'text-[#3D342E] hover:bg-white hover:text-[#C84B24]'
                }`}
              >
                <Icon
                  className={`size-4.5 shrink-0 transition-colors ${
                    isActive ? 'text-[#FFF6E0]' : 'text-[#8C7B6E] group-hover:text-[#C84B24]'
                  }`}
                />
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold leading-tight truncate">{tab.label}</div>
                  <div
                    className={`text-[11px] truncate mt-0.5 ${
                      isActive ? 'text-white/80' : 'text-[#7A6E65]'
                    }`}
                  >
                    {tab.subtitle}
                  </div>
                </div>
              </button>
            );
          })}
        </nav>

        {/* Bottom Cultural Textile Accent Card */}
        <div className="mt-6 overflow-hidden rounded-2xl border border-[#E6D7C7] bg-[#181412] text-white shadow-sm">
          <div className="relative h-24 w-full overflow-hidden">
            <Image
              src="/uhuru/textiles.png"
              alt="African woven textiles"
              fill
              className="object-cover opacity-85"
              sizes="260px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#181412] via-[#181412]/35 to-transparent" />
            <span className="absolute bottom-2.5 left-3.5 inline-flex items-center gap-1.5 rounded-full bg-[#E59A18] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-[#181412]">
              Base Sepolia Live
            </span>
          </div>
          <div className="p-3.5">
            <p className="text-xs font-bold text-white/95">Treasury Limit: $500.00 USDC</p>
            <p className="mt-0.5 text-[11px] text-white/70">
              Independent policy engine active for all supplier settlements.
            </p>
            <Link
              href="/"
              className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-bold text-[#E59A18] hover:underline"
            >
              <span>View public site</span>
              <ExternalLink className="size-3" />
            </Link>
          </div>
        </div>
      </aside>

      {/* Main Workspace Column */}
      <div className="flex-1 lg:ml-72 flex flex-col min-w-0">
        {/* Top Sticky Header */}
        <header className="sticky top-0 z-30 border-b border-[#ECE0D3] bg-white/95 backdrop-blur-md">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
            {/* Left: Mobile Logo or Desktop Section Title */}
            <div className="flex items-center gap-4">
              <div className="lg:hidden">
                <button
                  onClick={() => setActiveTab('overview')}
                  className="text-left focus:outline-none cursor-pointer"
                >
                  <UhuruLogo size="sm" theme="dark" showSlogan={false} />
                </button>
              </div>
              <div className="hidden lg:block">
                <div className="flex items-center gap-2.5">
                  <h1 className="font-montserrat-extrabold text-2xl tracking-tight text-[#181412]">
                    {activeTabMeta.label}
                  </h1>
                  <span className="rounded-full bg-[#FFF6E0] border border-[#E59A18]/40 px-2.5 py-0.5 text-[11px] font-bold text-[#9A6004]">
                    {merchant?.businessName || 'Kigali Fresh Market'}
                  </span>
                </div>
                <p className="text-xs text-[#685D55] mt-0.5">{activeTabMeta.subtitle}</p>
              </div>
            </div>

            {/* Right Header Actions */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              {/* Mobile Merchant Selector */}
              <div className="relative lg:hidden">
                <select
                  value={merchantId}
                  onChange={(e) => {
                    setWalletDraft('');
                    setWalletSaveMessage(null);
                    setMerchantId(e.target.value);
                  }}
                  aria-label="Select active merchant"
                  className="text-xs font-bold bg-[#FFF8EE] text-[#181412] border border-[#E4D5C5] rounded-lg px-3 py-2 pr-7 focus:outline-none cursor-pointer appearance-none"
                >
                  {merchantsList.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.businessName}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-[#C84B24] text-[10px]">
                  ▼
                </div>
              </div>

              <button
                onClick={fetchDashboardData}
                title="Refresh workspace data"
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#E4D5C5] bg-white px-3.5 py-2.5 text-xs font-bold text-[#463C35] transition hover:border-[#C84B24] hover:text-[#C84B24] cursor-pointer"
              >
                <RefreshCw className={`size-3.5 ${loading ? 'animate-spin text-[#C84B24]' : ''}`} />
                <span className="hidden sm:inline">Refresh</span>
              </button>

              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 rounded-lg bg-[#C84B24] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-[0_6px_18px_-4px_rgba(200,75,36,0.45)] transition hover:bg-[#A63816] cursor-pointer"
              >
                <Plus className="size-4" />
                <span>Create Payment Link</span>
              </button>
            </div>
          </div>
        </header>

        {/* Mobile Horizontal Tab Bar */}
        <nav className="lg:hidden border-b border-[#ECE0D3] bg-[#FFF8EE]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center gap-2 py-3 overflow-x-auto">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg font-bold text-xs whitespace-nowrap transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#C84B24] text-white shadow-xs'
                      : 'bg-white text-[#463C35] border border-[#E4D5C5] hover:border-[#C84B24] hover:text-[#C84B24]'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
          {/* TAB 1: OVERVIEW */}
          {activeTab === 'overview' && (
            <div className="space-y-8">
              {/* Welcoming Merchant Editorial Banner */}
              <section className="relative overflow-hidden rounded-2xl border border-[#E8DCD0] bg-gradient-to-br from-[#FFF8EE] via-[#FFF2E2] to-[#FCE8D5] shadow-[0_14px_38px_-15px_rgba(24,20,18,0.08)]">
                <div className="grid gap-6 lg:grid-cols-[1.28fr_0.72fr] lg:items-center">
                  <div className="p-6 sm:p-8 lg:p-10">
                    <div className="inline-flex items-center gap-2 rounded-full border border-[#C84B24]/25 bg-white/85 px-3.5 py-1 text-[11px] font-bold uppercase tracking-[0.16em] text-[#C84B24]">
                      <Sparkles className="size-3.5 text-[#E59A18]" />
                      Welcome back to UHURU
                    </div>

                    <h2 className="mt-4 font-montserrat-extrabold text-2xl sm:text-3xl lg:text-4xl tracking-tight text-[#181412]">
                      {merchant?.businessName || 'Kigali Fresh Market'}
                    </h2>

                    <p className="mt-2.5 max-w-xl text-sm sm:text-base leading-relaxed text-[#4E443C]">
                      Create a customer payment link in seconds, track verified USDC settlements on
                      Base Sepolia, or review supplier invoices against your $500 spending limit.
                    </p>

                    <div className="mt-6 flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => setShowCreateModal(true)}
                        className="inline-flex items-center gap-2 rounded-lg bg-[#C84B24] px-5 py-3 text-xs font-bold uppercase tracking-wider text-white shadow-[0_8px_20px_-4px_rgba(200,75,36,0.45)] transition hover:bg-[#A63816] cursor-pointer"
                      >
                        <Plus className="size-4" />
                        New Customer Order
                      </button>
                      <button
                        onClick={() => setActiveTab('treasury-agent')}
                        className="inline-flex items-center gap-2 rounded-lg border-2 border-[#8B1E24]/25 bg-white px-5 py-3 text-xs font-bold uppercase tracking-wider text-[#8B1E24] transition hover:border-[#8B1E24] hover:bg-[#8B1E24] hover:text-white cursor-pointer"
                      >
                        <ShieldCheck className="size-4" />
                        Pay Supplier Invoice
                      </button>
                      <Link
                        href="/checkout/ord_live_checkout_01"
                        target="_blank"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-white/80 px-4 py-3 text-xs font-bold text-[#3D342E] border border-[#E4D5C5] transition hover:border-[#C84B24] hover:text-[#C84B24]"
                      >
                        <span>Open Live Checkout</span>
                        <ExternalLink className="size-3.5" />
                      </Link>
                    </div>
                  </div>

                  {/* Editorial Photography Accent */}
                  <div className="relative min-h-[240px] lg:min-h-[300px] overflow-hidden">
                    <Image
                      src="/uhuru/woman-bowl.png"
                      alt="African entrepreneur carrying a carved calabash bowl"
                      fill
                      className="object-cover object-top"
                      sizes="(max-width: 1024px) 100vw, 35vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#181412]/65 via-transparent to-transparent lg:bg-gradient-to-r lg:from-[#FCE8D5] lg:via-transparent lg:to-transparent" />
                    <div className="absolute bottom-4 right-4 left-4 lg:left-auto rounded-xl border border-white/25 bg-[#181412]/80 px-4 py-3 text-white backdrop-blur-md">
                      <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#E59A18]">
                        Indicative Exchange Rate
                      </p>
                      <p className="mt-0.5 font-slogan text-sm font-bold">
                        1.00 USDC &asymp; R 18.50 ZAR
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* Focused 3-Card Financial Hierarchy (Fixed contrast & vibrant accents) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                {/* Card 1: Available Balance (Vibrant Terracotta & Crimson) */}
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#C84B24] via-[#B23822] to-[#8B1E24] text-white p-6 sm:p-7 shadow-[0_14px_32px_-10px_rgba(200,75,36,0.4)]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.16em] font-montserrat-extrabold text-[#FFE5D6]">
                      Available Balance
                    </span>
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/15 text-white">
                      <Wallet className="size-4.5" />
                    </span>
                  </div>
                  <div className="mt-4 text-3xl sm:text-4xl font-black font-montserrat-extrabold text-white">
                    ${stats?.availableBalanceUsdc?.toFixed(2) || '0.00'}
                  </div>
                  <p className="mt-2 text-xs text-[#FFE5D6]/90">
                    Verified Circle USDC on Base Sepolia
                  </p>
                </div>

                {/* Card 2: Paid & Reconciled Orders (Natural Leaf Green Accent) */}
                <div className="rounded-2xl border-2 border-[#1E6B45]/20 bg-white p-6 sm:p-7 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.16em] font-montserrat-extrabold text-[#1E6B45]">
                      Paid Orders
                    </span>
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#EAF6F0] text-[#1E6B45]">
                      <CheckCircle2 className="size-4.5" />
                    </span>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2.5">
                    <span className="text-3xl sm:text-4xl font-black font-montserrat-extrabold text-[#181412]">
                      {stats?.paidOrdersCount || 0}
                    </span>
                    <span className="rounded-full bg-[#EAF6F0] px-2.5 py-0.5 text-xs font-bold text-[#1E6B45]">
                      ${stats?.totalReceivedUsdc?.toFixed(2) || '0.00'} USDC
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[#685D55]">
                    Confirmed on-chain customer settlements
                  </p>
                </div>

                {/* Card 3: Awaiting Payment & Rate (Warm Ochre Gold Accent) */}
                <div className="rounded-2xl border-2 border-[#E59A18]/35 bg-white p-6 sm:p-7 shadow-xs flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-xs uppercase tracking-[0.16em] font-montserrat-extrabold text-[#A86A06]">
                      Awaiting Payment
                    </span>
                    <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-[#FFF6E0] text-[#B87408]">
                      <Clock className="size-4.5" />
                    </span>
                  </div>
                  <div className="mt-4 flex items-baseline gap-2.5">
                    <span className="text-3xl sm:text-4xl font-black font-montserrat-extrabold text-[#181412]">
                      {pendingOrdersCount}
                    </span>
                    <span className="rounded-full bg-[#FFF6E0] px-2.5 py-0.5 text-xs font-bold text-[#9A6004]">
                      ~R 18.50 / USDC
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-[#685D55]">
                    Active payment links ready for customer checkout
                  </p>
                </div>
              </div>

              {/* Settlement Wallet Configuration Card */}
              <div className="rounded-2xl border border-[#E8DCD0] bg-[#FFF8EE]/70 p-6 sm:p-7 shadow-xs">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="max-w-xl">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full bg-[#1E6B45]" />
                      <h3 className="font-montserrat-extrabold text-lg text-[#181412]">
                        Merchant Settlement Wallet
                      </h3>
                    </div>
                    <p className="text-xs sm:text-sm text-[#544940] mt-1">
                      Customer checkout links send Circle USDC directly to this Base Sepolia address.
                    </p>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1 max-w-xl">
                    <Input
                      value={walletDraft || merchant?.walletAddress || ''}
                      onChange={(event) => setWalletDraft(event.target.value)}
                      placeholder="0x..."
                      aria-label="Merchant settlement wallet address"
                      className="font-mono text-xs bg-white border border-[#DCCBC0] rounded-xl h-11 px-4 flex-1 text-[#181412] focus-visible:ring-[#C84B24]"
                    />
                    <button
                      onClick={saveMerchantWallet}
                      disabled={savingWallet || !(walletDraft || merchant?.walletAddress)}
                      className="px-6 py-2.5 h-11 rounded-xl bg-[#181412] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#C84B24] disabled:opacity-50 transition-all cursor-pointer shadow-xs shrink-0"
                    >
                      {savingWallet ? 'Saving…' : 'Save Wallet'}
                    </button>
                  </div>
                </div>
                {walletSaveMessage && (
                  <p className="mt-3 text-xs font-bold text-[#1E6B45]">{walletSaveMessage}</p>
                )}
              </div>

              {/* Essential Business Views: Orders & Recent On-Chain Transactions */}
              <div className="space-y-8">
                <OrdersTable
                  orders={recentOrders}
                  onOpenCreateModal={() => setShowCreateModal(true)}
                  showTopStats={false}
                />
                <TransactionsTable transactions={statsData?.recentTransactions || []} />
              </div>
            </div>
          )}

          {/* TAB 2: CUSTOMER ORDERS */}
          {activeTab === 'orders' && (
            <OrdersTable
              orders={recentOrders}
              onOpenCreateModal={() => setShowCreateModal(true)}
              showTopStats={true}
            />
          )}

          {/* TAB 3: TRANSACTIONS */}
          {activeTab === 'transactions' && (
            <TransactionsTable transactions={statsData?.recentTransactions || []} />
          )}

          {activeTab === 'refunds' && <RefundsDashboardPanel merchantId={merchantId} />}

          {activeTab === 'cash-out' && <CashOutView key={merchantId} merchantId={merchantId} />}

          {/* TAB 4: AI TREASURY AGENT */}
          {activeTab === 'treasury-agent' && (
            <TreasuryAgentView
              merchantId={merchantId}
              onActionComplete={fetchDashboardData}
            />
          )}

          {/* TAB 5: SUPPLIERS & INVOICES */}
          {activeTab === 'suppliers' && (
            <SuppliersAndInvoicesView
              merchantId={merchantId}
              onRunInvoicePayment={() => {
                setActiveTab('treasury-agent');
              }}
            />
          )}

          {/* TAB 6: AUDIT LOGS */}
          {activeTab === 'audit-logs' && (
            <AuditLogsTable merchantId={merchantId} />
          )}
        </main>

        {/* Floating AI Business Helper */}
        <FloatingChatbot merchantId={merchantId} />

        {/* Create Order Modal */}
        <CreateOrderModal
          merchantId={merchantId}
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onOrderCreated={fetchDashboardData}
        />
      </div>
    </div>
  );
}
