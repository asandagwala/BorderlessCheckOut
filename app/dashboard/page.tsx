'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { OrdersTable } from '@/modules/dashboard/components/OrdersTable';
import { TransactionsTable } from '@/modules/dashboard/components/TransactionsTable';
import { CreateOrderModal } from '@/modules/dashboard/components/CreateOrderModal';
import { TreasuryAgentView } from '@/modules/ai-treasury-agent/components/TreasuryAgentView';
import { SuppliersAndInvoicesView } from '@/modules/suppliers/components/SuppliersAndInvoicesView';
import { AuditLogsTable } from '@/modules/audit-logs/components/AuditLogsTable';
import { FloatingChatbot } from '@/modules/ai-chatbot/components/FloatingChatbot';
import Link from 'next/link';

type TabType = 'overview' | 'orders' | 'transactions' | 'treasury-agent' | 'suppliers' | 'audit-logs';

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

  const tabs: { id: TabType; label: string }[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'orders', label: 'Customer Orders' },
    { id: 'transactions', label: 'Transactions' },
    { id: 'treasury-agent', label: 'AI Treasury Agent' },
    { id: 'suppliers', label: 'Suppliers & Invoices' },
    { id: 'audit-logs', label: 'Audit Logs' },
  ];

  return (
    <div className="min-h-screen bg-[#fff3e2] text-zinc-900 flex flex-col selection:bg-[#700c20] selection:text-white">
      {/* Top Header */}
      <header className="border-b-2 border-[#700c20]/20 bg-[#fff3e2]/95 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          {/* BC Logo Button: Always takes user back to Overview / Dashboard */}
          <button
            onClick={() => setActiveTab('overview')}
            className="flex items-center gap-3.5 group cursor-pointer text-left"
            title="Return to Main Overview Dashboard"
          >
            <div className="w-11 h-11 rounded-[14px] bg-[#700c20] flex items-center justify-center text-white font-black text-lg shadow-sm transition-transform group-hover:scale-105">
              BC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-montserrat-extrabold text-base sm:text-xl tracking-tight text-zinc-950">
                  Borderless Checkout
                </span>
                <span className="text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#700c20]/10 text-[#700c20] border border-[#700c20]/30 font-play">
                  Node Engine 2026
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-600 font-play hidden sm:block">
                Merchant Workspace • Base Sepolia USDC
              </p>
            </div>
          </button>

          {/* Right Header Actions */}
          <div className="flex items-center gap-3">
            {/* Merchant Selector Switcher */}
            <div className="relative">
              <select
                value={merchantId}
                onChange={(e) => setMerchantId(e.target.value)}
                className="text-xs font-play font-bold bg-white text-zinc-800 border-2 border-[#700c20] rounded-[24px] px-3.5 py-2 pr-8 shadow-xs focus:outline-none cursor-pointer appearance-none"
              >
                {merchantsList.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.businessName}
                  </option>
                ))}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-[#700c20]">
                ▼
              </div>
            </div>

            <button
              onClick={() => setShowCreateModal(true)}
              className="px-5 py-2.5 rounded-[35px] bg-[#700c20] text-white font-play font-bold text-xs uppercase tracking-wider hover:bg-[#520917] transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New Order</span>
            </button>
          </div>
        </div>
      </header>

      {/* Secondary Sub-Nav: Tabs styled with 35px rounding, 5px borders */}
      <nav className="border-b border-[#700c20]/20 bg-[#fff3e2]/60 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4 py-3 overflow-x-auto">
          <div className="flex items-center gap-2">
            {tabs.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-5 py-2 rounded-[35px] font-play font-bold text-xs whitespace-nowrap transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#700c20] text-white border-2 border-[#700c20] shadow-xs'
                      : 'bg-white text-[#700c20] border-2 border-[#700c20] hover:bg-[#700c20] hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <button
            onClick={fetchDashboardData}
            title="Refresh Store Data"
            className="p-2 rounded-full bg-white text-[#700c20] border border-[#700c20]/30 hover:bg-[#700c20] hover:text-white transition-colors cursor-pointer shrink-0"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-8">
        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Top Stat Cards: 5px border, 35px rounding, solid red with white text */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Available Balance */}
              <div className="rounded-[35px] border-[5px] border-[#700c20] bg-[#700c20] text-white p-7 shadow-sm transition-all duration-300 hover:shadow-lg">
                <div className="space-y-2">
                  <span className="text-xs uppercase tracking-wider font-montserrat-extrabold text-white/90">
                    Available Balance
                  </span>
                  <div className="text-3xl sm:text-4xl font-black font-montserrat-extrabold text-white">
                    ${stats?.availableBalanceUsdc?.toFixed(2) || '0.00'}
                  </div>
                  <p className="text-xs font-play text-white/90 pt-1">
                    Base Sepolia Circle USDC
                  </p>
                </div>
              </div>

              {/* Indicative Rate */}
              <div className="rounded-[35px] border-[5px] border-[#700c20] bg-[#700c20] text-white p-7 shadow-sm transition-all duration-300 hover:shadow-lg">
                <div className="space-y-2">
                  <span className="text-xs uppercase tracking-wider font-montserrat-extrabold text-white/90">
                    Indicative Rate
                  </span>
                  <div className="text-3xl sm:text-4xl font-black font-montserrat-extrabold text-white">
                    ~R 18.50
                  </div>
                  <p className="text-xs font-play text-white/90 pt-1">
                    South African Rand per USDC
                  </p>
                </div>
              </div>

              {/* Paid Orders */}
              <div className="rounded-[35px] border-[5px] border-[#700c20] bg-[#700c20] text-white p-7 shadow-sm transition-all duration-300 hover:shadow-lg">
                <div className="space-y-2">
                  <span className="text-xs uppercase tracking-wider font-montserrat-extrabold text-white/90">
                    Paid orders
                  </span>
                  <div className="text-3xl sm:text-4xl font-black font-montserrat-extrabold text-white">
                    {stats?.paidOrdersCount || 0}
                  </div>
                  <p className="text-xs font-play text-white/90 pt-1">
                    ${stats?.totalReceivedUsdc?.toFixed(2) || '0.00'} USDC settled
                  </p>
                </div>
              </div>

              {/* Awaiting payment */}
              <div className="rounded-[35px] border-[5px] border-[#700c20] bg-[#700c20] text-white p-7 shadow-sm transition-all duration-300 hover:shadow-lg">
                <div className="space-y-2">
                  <span className="text-xs uppercase tracking-wider font-montserrat-extrabold text-white/90">
                    Awaiting payment
                  </span>
                  <div className="text-3xl sm:text-4xl font-black font-montserrat-extrabold text-white">
                    {stats?.unpaidOrdersCount || 0}
                  </div>
                  <p className="text-xs font-play text-white/90 pt-1">
                    USDC pending checkout
                  </p>
                </div>
              </div>
            </div>

            {/* Base Sepolia Settlement Wallet Card */}
            <div className="rounded-[35px] border-[5px] border-[#700c20] bg-white p-6 sm:p-8 shadow-sm">
              <div className="pb-4 border-b border-[#700c20]/20">
                <h2 className="font-montserrat-extrabold text-xl text-zinc-950">
                  Base Sepolia Settlement Wallet
                </h2>
                <p className="text-xs sm:text-sm font-play text-zinc-600 mt-1">
                  Customer USDC transfers are verified and sent to this merchant-controlled address.
                </p>
              </div>
              <div className="pt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
                <Input
                  value={walletDraft || merchant?.walletAddress || ''}
                  onChange={(event) => setWalletDraft(event.target.value)}
                  placeholder="0x..."
                  aria-label="Merchant settlement wallet address"
                  className="font-mono text-xs bg-[#fff3e2]/50 border-2 border-[#700c20] rounded-[24px] h-11 px-4 flex-1"
                />
                <button
                  onClick={saveMerchantWallet}
                  disabled={savingWallet || !(walletDraft || merchant?.walletAddress)}
                  className="px-6 py-2.5 rounded-[35px] bg-[#700c20] text-white font-play font-bold text-xs uppercase tracking-wider hover:bg-[#520917] disabled:opacity-50 transition-all cursor-pointer shadow-sm shrink-0"
                >
                  {savingWallet ? 'Saving…' : 'Save wallet'}
                </button>
              </div>
              {walletSaveMessage && (
                <p className="pt-3 text-xs font-play text-zinc-700">{walletSaveMessage}</p>
              )}
            </div>

            {/* Recent Orders & Transactions Preview Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <OrdersTable
                orders={statsData?.recentOrders || []}
                onOpenCreateModal={() => setShowCreateModal(true)}
                showTopStats={false}
              />
              <TransactionsTable transactions={statsData?.recentTransactions || []} />
            </div>
          </div>
        )}

        {/* TAB 2: CUSTOMER ORDERS (WITH 3 STATS BOXES AT TOP) */}
        {activeTab === 'orders' && (
          <OrdersTable
            orders={statsData?.recentOrders || []}
            onOpenCreateModal={() => setShowCreateModal(true)}
            showTopStats={true}
          />
        )}

        {/* TAB 3: TRANSACTIONS */}
        {activeTab === 'transactions' && (
          <TransactionsTable transactions={statsData?.recentTransactions || []} />
        )}

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

      {/* Floating Chatbot: Bottom-Right button in brand red (#700c20) */}
      <FloatingChatbot merchantId={merchantId} />

      {/* Create Order Modal */}
      <CreateOrderModal
        merchantId={merchantId}
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onOrderCreated={fetchDashboardData}
      />
    </div>
  );
}
