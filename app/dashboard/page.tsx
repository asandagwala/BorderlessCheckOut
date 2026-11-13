'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { 
  Building2, 
  Coins, 
  ShoppingBag, 
  Clock, 
  CheckCircle2, 
  Cpu, 
  Bot, 
  ShieldCheck, 
  FileText, 
  Plus, 
  RefreshCw, 
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Sparkles,
  ArrowUpRight
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OrdersTable } from '@/modules/dashboard/components/OrdersTable';
import { TransactionsTable } from '@/modules/dashboard/components/TransactionsTable';
import { CreateOrderModal } from '@/modules/dashboard/components/CreateOrderModal';
import { ChatbotView } from '@/modules/ai-chatbot/components/ChatbotView';
import { TreasuryAgentView } from '@/modules/ai-treasury-agent/components/TreasuryAgentView';
import { SuppliersAndInvoicesView } from '@/modules/suppliers/components/SuppliersAndInvoicesView';
import { AuditLogsTable } from '@/modules/audit-logs/components/AuditLogsTable';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

type TabType = 'overview' | 'orders' | 'transactions' | 'treasury-agent' | 'suppliers' | 'chatbot' | 'audit-logs';

export default function DashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [merchantId, setMerchantId] = useState('');
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Fetch merchants and dashboard stats
  const fetchDashboardData = useCallback(async () => {
    try {
      setLoading(true);
      const authRes = await fetch('/api/auth', { cache: 'no-store' });
      if (!authRes.ok) {
        router.replace('/login');
        return;
      }

      const auth = await authRes.json();
      const currentMerchantId = auth.merchant?.id;
      if (!currentMerchantId) {
        router.replace('/login');
        return;
      }

      setMerchantId(currentMerchantId);
      const statsRes = await fetch(`/api/dashboard/stats?merchantId=${encodeURIComponent(currentMerchantId)}`, { cache: 'no-store' });
      if (statsRes.status === 401 || statsRes.status === 403) {
        router.replace('/login');
        return;
      }
      const stats = await statsRes.json();
      setStatsData(stats);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const stats = statsData?.stats;
  const merchant = statsData?.merchant;

  const handleLogout = async () => {
    await fetch('/api/auth', { method: 'DELETE' });
    router.replace('/login');
  };

  if (loading && !merchantId) {
    return <div className="min-h-screen flex items-center justify-center text-sm text-zinc-500">Loading merchant dashboard...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 flex flex-col">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md border-b border-zinc-200 dark:border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white font-bold text-base shadow-sm">
              BC
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-zinc-900 dark:text-zinc-50 text-sm sm:text-base">Borderless Checkout</span>
                <Badge variant="outline" className="text-[10px] text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200">
                  Base Sepolia
                </Badge>
              </div>
              <p className="text-[11px] text-zinc-500 hidden sm:block">Modular Stablecoin Gateway for African SMEs</p>
            </div>
          </div>

          {/* Right Header Actions: Current Merchant & Create Order */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 bg-zinc-100 dark:bg-zinc-800 px-3 py-2 rounded-lg text-xs font-medium text-zinc-800 dark:text-zinc-200">
              <Building2 className="w-3.5 h-3.5 text-zinc-500 ml-1.5" />
              <span>{merchant?.businessName || 'Merchant account'}</span>
            </div>

            <Button size="sm" variant="outline" onClick={handleLogout} className="text-xs">Sign out</Button>

            <Button
              size="sm"
              onClick={() => setShowCreateModal(true)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> New Order
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 w-full flex-1 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex border-b border-zinc-200 dark:border-zinc-800 space-x-1 sm:space-x-2 overflow-x-auto pb-1 text-xs sm:text-sm font-medium">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'orders', label: 'Customer Orders', icon: ShoppingBag },
            { id: 'transactions', label: 'Transactions', icon: Coins },
            { id: 'treasury-agent', label: 'AI Treasury Agent', icon: Cpu, highlight: true },
            { id: 'suppliers', label: 'Suppliers & Invoices', icon: FileText },
            { id: 'chatbot', label: 'AI Chatbot', icon: Bot },
            { id: 'audit-logs', label: 'Audit Logs', icon: ShieldCheck },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-medium whitespace-nowrap transition-colors cursor-pointer ${
                  isActive
                    ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400'
                    : 'border-transparent text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200'
                } ${tab.highlight ? 'font-semibold' : ''}`}
              >
                <Icon className={`w-4 h-4 ${tab.highlight && !isActive ? 'text-emerald-500' : ''}`} />
                <span>{tab.label}</span>
                {tab.highlight && (
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                )}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Top Metrics Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Total USDC Received */}
              <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500">Total Payments Received</span>
                  <Coins className="w-4 h-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    ${stats?.totalReceivedUsdc?.toFixed(2) || '0.00'} <span className="text-xs font-normal text-zinc-500">USDC</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Confirmed on Base Sepolia
                  </p>
                </CardContent>
              </Card>

              {/* Current Treasury Balance + Indicative Rand */}
              <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500">Available Treasury Balance</span>
                  <Building2 className="w-4 h-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    ${stats?.currentBalanceUsdc?.toFixed(2) || '0.00'} <span className="text-xs font-normal text-zinc-500">USDC</span>
                  </div>
                  <p className="text-[11px] text-emerald-600 font-medium mt-1">
                    ≈ R {stats?.indicativeZarValue?.toFixed(2) || '0.00'} ZAR <span className="text-[10px] text-zinc-400 italic font-normal">(Indicative)</span>
                  </p>
                </CardContent>
              </Card>

              {/* Paid Orders */}
              <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500">Settled Customer Orders</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-emerald-600">
                    {stats?.paidOrdersCount || 0} <span className="text-xs font-normal text-zinc-500">PAID</span>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-1">
                    Automatically reconciled
                  </p>
                </CardContent>
              </Card>

              {/* Unpaid Orders & Policy Cap */}
              <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <span className="text-xs font-medium text-zinc-500">Treasury Spending Limit</span>
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
                    ${stats?.spendingLimit?.toFixed(2) || '500.00'} <span className="text-xs font-normal text-zinc-500">USDC</span>
                  </div>
                  <p className="text-[11px] text-amber-600 font-medium mt-1">
                    {stats?.unpaidOrdersCount || 0} unpaid checkout(s) pending
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Quick Demonstration CTA Card */}
            <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white rounded-xl shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-200" />
                  <h3 className="font-semibold text-base">Node Engine Hackathon 2026: Fast-Track Demonstration</h3>
                </div>
                <p className="text-xs text-emerald-100 mt-1 max-w-2xl leading-relaxed">
                  Test the complete end-to-end journey: open a customer checkout page to pay with USDC on Base Sepolia, or run the AI Treasury Agent to evaluate Scenario 1 ($100 Approved) and Scenario 2 ($700 Rejected).
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Button
                  onClick={() => setActiveTab('treasury-agent')}
                  className="bg-white text-emerald-800 hover:bg-emerald-50 text-xs font-semibold"
                >
                  <Cpu className="w-3.5 h-3.5 mr-1.5" /> Launch AI Agent Demo
                </Button>
                {statsData?.recentOrders?.length > 0 && (
                  <Link href={`/checkout/${statsData.recentOrders[0].id}`} target="_blank">
                    <Button variant="outline" className="border-white/40 text-white hover:bg-white/10 text-xs">
                      Open Checkout <ArrowUpRight className="w-3.5 h-3.5 ml-1" />
                    </Button>
                  </Link>
                )}
              </div>
            </div>

            {/* Recent Orders & Transactions Preview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <OrdersTable
                orders={statsData?.recentOrders || []}
                onOpenCreateModal={() => setShowCreateModal(true)}
              />
              <TransactionsTable transactions={statsData?.recentTransactions || []} />
            </div>
          </div>
        )}

        {/* Tab 2: Orders */}
        {activeTab === 'orders' && (
          <OrdersTable
            orders={statsData?.recentOrders || []}
            onOpenCreateModal={() => setShowCreateModal(true)}
          />
        )}

        {/* Tab 3: Transactions */}
        {activeTab === 'transactions' && (
          <TransactionsTable transactions={statsData?.recentTransactions || []} />
        )}

        {/* Tab 4: AI Treasury Agent */}
        {activeTab === 'treasury-agent' && (
          <TreasuryAgentView
            merchantId={merchantId}
            onActionComplete={fetchDashboardData}
          />
        )}

        {/* Tab 5: Suppliers & Invoices */}
        {activeTab === 'suppliers' && (
          <SuppliersAndInvoicesView
            merchantId={merchantId}
            onRunInvoicePayment={(invId) => {
              setActiveTab('treasury-agent');
            }}
          />
        )}

        {/* Tab 6: AI Chatbot */}
        {activeTab === 'chatbot' && (
          <ChatbotView merchantId={merchantId} />
        )}

        {/* Tab 7: Audit Logs */}
        {activeTab === 'audit-logs' && (
          <AuditLogsTable merchantId={merchantId} />
        )}
      </div>

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
