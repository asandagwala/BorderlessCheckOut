'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowUpRight, Building2, CheckCircle2, Clock3, Coins, Cpu, FileText,
  Plus, RefreshCw, ShieldCheck, ShoppingBag, TrendingUp, MessageCircle,
  X, Wallet, AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { OrdersTable } from '@/modules/dashboard/components/OrdersTable';
import { TransactionsTable } from '@/modules/dashboard/components/TransactionsTable';
import { CreateOrderModal } from '@/modules/dashboard/components/CreateOrderModal';
import { ChatbotView } from '@/modules/ai-chatbot/components/ChatbotView';
import { TreasuryAgentView } from '@/modules/ai-treasury-agent/components/TreasuryAgentView';
import { SuppliersAndInvoicesView } from '@/modules/suppliers/components/SuppliersAndInvoicesView';
import { AuditLogsTable } from '@/modules/audit-logs/components/AuditLogsTable';

type TabType = 'overview' | 'orders' | 'transactions' | 'treasury-agent' | 'suppliers' | 'audit-logs';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [merchantId, setMerchantId] = useState('merch_kigali_01');
  const [merchantsList, setMerchantsList] = useState<any[]>([]);
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [chatbotOpen, setChatbotOpen] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [statsRes, merchRes] = await Promise.all([
        fetch(`/api/dashboard/stats?merchantId=${merchantId}`),
        fetch('/api/auth'),
      ]);
      const [stats, merch] = await Promise.all([statsRes.json(), merchRes.json()]);
      setStatsData(stats);
      setMerchantsList(merch.merchants || []);
    } catch (err) {
      console.error('Unable to refresh dashboard data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDashboardData(); }, [merchantId]);

  const stats = statsData?.stats;
  const orderSummary = statsData?.orderSummary;
  const tabs = [
    { id: 'overview', label: 'Overview', icon: TrendingUp },
    { id: 'orders', label: 'Customer Orders', icon: ShoppingBag },
    { id: 'transactions', label: 'Transactions', icon: Coins },
    { id: 'treasury-agent', label: 'AI Treasury Agent', icon: Cpu },
    { id: 'suppliers', label: 'Suppliers & Invoices', icon: FileText },
    { id: 'audit-logs', label: 'Audit Logs', icon: ShieldCheck },
  ] as const;

  return (
    <main className="dashboard-page">
      <header className="dashboard-header">
        <div className="dashboard-header-inner">
          <Link href="/dashboard" className="flex items-center gap-3 min-w-0">
            <span className="brand-mark shrink-0">BC</span>
            <span className="min-w-0">
              <span className="block font-black text-lg leading-tight" style={{fontFamily:'var(--font-montserrat)'}}>Borderless Checkout</span>
              <span className="block text-xs text-[#756d6f]">Merchant workspace · Base Sepolia</span>
            </span>
          </Link>
          <div className="flex items-center gap-3 flex-wrap">
            <label className="flex items-center gap-2 rounded-full border border-[#eadfe2] bg-white px-4 py-2 text-xs font-bold text-[#756d6f]">
              <Building2 size={15} className="text-[#700c20]"/>
              <select value={merchantId} onChange={e => setMerchantId(e.target.value)} className="max-w-[190px] bg-transparent text-[#20191b] outline-none">
                {merchantsList.map(m => <option key={m.id} value={m.id}>{m.businessName}</option>)}
              </select>
            </label>
            <Button onClick={() => setShowCreateModal(true)} className="bg-[#700c20] hover:bg-[#580918] text-white">
              <Plus size={16}/> New Order
            </Button>
          </div>
        </div>
      </header>

      <section className="dashboard-content">
        <div className="dashboard-intro flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[.16em] text-[#700c20] mb-2">Merchant overview</p>
            <h1>{activeTab === 'overview' ? 'Good to see you again.' : tabs.find(t => t.id === activeTab)?.label}</h1>
            <p>{statsData?.merchant?.businessName || 'Your business'} · A clear view of your payments and operations.</p>
          </div>
          <Button variant="outline" onClick={fetchDashboardData} disabled={loading}>
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''}/> Refresh data
          </Button>
        </div>

        <nav className="dashboard-tabs" aria-label="Dashboard sections">
          {tabs.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`dashboard-tab ${activeTab === tab.id ? 'active' : ''}`}>
                <Icon size={16}/>{tab.label}
              </button>
            );
          })}
        </nav>

        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              <article className="metric-card">
                <div className="flex items-center justify-between"><span className="metric-label">Total received</span><Coins size={19} className="text-[#700c20]"/></div>
                <div className="metric-value">${stats?.totalReceivedUsdc?.toFixed(2) || '0.00'}</div>
                <p className="metric-foot">USDC · Verified customer payments</p>
              </article>
              <article className="metric-card">
                <div className="flex items-center justify-between"><span className="metric-label">Treasury balance</span><Wallet size={19} className="text-[#700c20]"/></div>
                <div className="metric-value">${stats?.currentBalanceUsdc?.toFixed(2) || '0.00'}</div>
                <p className="metric-foot">≈ R {stats?.indicativeZarValue?.toFixed(2) || '0.00'} · Indicative</p>
              </article>
              <article className="metric-card">
                <div className="flex items-center justify-between"><span className="metric-label">Orders paid</span><CheckCircle2 size={19} className="text-[#16835b]"/></div>
                <div className="metric-value">{orderSummary?.paid?.count ?? stats?.paidOrdersCount ?? 0}</div>
                <p className="metric-foot">${(orderSummary?.paid?.usdcTotal ?? 0).toFixed(2)} USDC settled</p>
              </article>
              <article className="metric-card">
                <div className="flex items-center justify-between"><span className="metric-label">Awaiting payment</span><Clock3 size={19} className="text-[#d18a18]"/></div>
                <div className="metric-value">{orderSummary?.pending?.count ?? stats?.unpaidOrdersCount ?? 0}</div>
                <p className="metric-foot">${(orderSummary?.pending?.usdcTotal ?? 0).toFixed(2)} USDC pending</p>
              </article>
            </div>

            <section className="demo-banner">
              <div>
                <div className="flex items-center gap-2 mb-2"><ShieldCheck size={19}/><h2 className="font-black text-lg">Protected payments. Clear decisions.</h2></div>
                <p>Explore the end-to-end customer checkout journey or run the AI Treasury Agent scenarios. Payments are verified on Base Sepolia and supplier settlements are governed by an independent policy engine.</p>
              </div>
              <div className="flex flex-wrap gap-2 shrink-0">
                <Button onClick={() => setActiveTab('treasury-agent')} className="bg-white text-[#700c20] hover:bg-[#f8edf0]">Launch AI Agent <ArrowUpRight size={15}/></Button>
                {statsData?.recentOrders?.[0] && <Link href={`/checkout/${statsData.recentOrders[0].id}`} target="_blank"><Button variant="outline" className="border-white text-white bg-transparent hover:bg-white hover:text-[#700c20]">Open Checkout <ArrowUpRight size={15}/></Button></Link>}
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <OrdersTable orders={statsData?.recentOrders || []} summary={orderSummary} onOpenCreateModal={() => setShowCreateModal(true)}/>
              <TransactionsTable transactions={statsData?.recentTransactions || []}/>
            </div>
          </div>
        )}

        {activeTab === 'orders' && <OrdersTable orders={statsData?.allOrders || statsData?.recentOrders || []} summary={orderSummary} onOpenCreateModal={() => setShowCreateModal(true)}/>}
        {activeTab === 'transactions' && <TransactionsTable transactions={statsData?.recentTransactions || []}/>}
        {activeTab === 'treasury-agent' && <TreasuryAgentView merchantId={merchantId} onActionComplete={fetchDashboardData}/>}
        {activeTab === 'suppliers' && <SuppliersAndInvoicesView merchantId={merchantId} onRunInvoicePayment={() => setActiveTab('treasury-agent')}/>}
        {activeTab === 'audit-logs' && <AuditLogsTable merchantId={merchantId}/>}
      </section>

      <CreateOrderModal merchantId={merchantId} isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} onOrderCreated={fetchDashboardData}/>

      {chatbotOpen && (
        <div className="chat-panel">
          <ChatbotView merchantId={merchantId} onClose={() => setChatbotOpen(false)}/>
        </div>
      )}
      <button className="chat-fab" onClick={() => setChatbotOpen(open => !open)} aria-label={chatbotOpen ? 'Close merchant assistant' : 'Open merchant assistant'} title="Ask the merchant assistant">
        {chatbotOpen ? <X size={25}/> : <MessageCircle size={25}/>}
      </button>
    </main>
  );
}
