'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Building2, 
  FileText, 
  Plus, 
  ExternalLink, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Play, 
  Loader2 
} from 'lucide-react';
import { Supplier, SupplierInvoice } from '@/lib/database/types';

interface SuppliersAndInvoicesProps {
  merchantId: string;
  onRunInvoicePayment?: (invoiceId: string) => void;
}

export function SuppliersAndInvoicesView({ merchantId, onRunInvoicePayment }: SuppliersAndInvoicesProps) {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [invoices, setInvoices] = useState<SupplierInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  // New supplier modal state
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [newSuppName, setNewSuppName] = useState('');
  const [newSuppWallet, setNewSuppWallet] = useState('');
  const [newSuppStatus, setNewSuppStatus] = useState<'APPROVED' | 'PENDING'>('APPROVED');

  // New invoice modal state
  const [showAddInvoice, setShowAddInvoice] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [newInvoiceNum, setNewInvoiceNum] = useState('');
  const [newInvoiceAmount, setNewInvoiceAmount] = useState('150.00');

  const fetchData = async () => {
    try {
      const [suppRes, invRes] = await Promise.all([
        fetch(`/api/suppliers?merchantId=${merchantId}`),
        fetch(`/api/invoices?merchantId=${merchantId}`),
      ]);
      const suppData = await suppRes.json();
      const invData = await invRes.json();
      setSuppliers(suppData.suppliers || []);
      setInvoices(invData.invoices || []);
      if (suppData.suppliers?.length > 0) {
        setSelectedSupplierId(suppData.suppliers[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [merchantId]);

  const handleCreateSupplier = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSuppName || !newSuppWallet) return;
    try {
      await fetch('/api/suppliers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          supplierName: newSuppName,
          walletAddress: newSuppWallet,
          approvalStatus: newSuppStatus,
        }),
      });
      setShowAddSupplier(false);
      setNewSuppName('');
      setNewSuppWallet('');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSupplierId || !newInvoiceNum || !newInvoiceAmount) return;
    try {
      await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchantId,
          supplierId: selectedSupplierId,
          invoiceNumber: newInvoiceNum,
          invoiceAmount: parseFloat(newInvoiceAmount),
        }),
      });
      setShowAddInvoice(false);
      setNewInvoiceNum('');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-xs text-zinc-500 flex items-center justify-center gap-2">
        <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
        <span>Loading supplier & invoice registry...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Suppliers Table Section */}
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-emerald-600" />
              Approved Suppliers & Vendors
            </CardTitle>
            <CardDescription className="text-xs">
              Treasury policy mandates payments can only be disbursed to APPROVED vendors
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowAddSupplier(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" /> Add Supplier
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 uppercase tracking-wider font-semibold border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-4 py-3">Supplier Name</th>
                  <th className="px-4 py-3">Base Sepolia Wallet</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Added</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-100">{s.supplierName}</td>
                    <td className="px-4 py-3 font-mono text-[11px] text-zinc-600 dark:text-zinc-400 truncate max-w-[200px]">
                      {s.walletAddress}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={s.approvalStatus === 'APPROVED' ? 'success' : s.approvalStatus === 'PENDING' ? 'warning' : 'destructive'} className="text-[10px]">
                        {s.approvalStatus}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right text-zinc-400">
                      {new Date(s.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Supplier Invoices Section */}
      <Card className="border-zinc-200 dark:border-zinc-800 shadow-sm">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              Outstanding & Settled Supplier Invoices
            </CardTitle>
            <CardDescription className="text-xs">
              Invoices evaluated by the AI Treasury Agent against merchant limits ($500.00)
            </CardDescription>
          </div>
          <Button size="sm" onClick={() => setShowAddInvoice(true)} className="bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 text-xs">
            <Plus className="w-3.5 h-3.5 mr-1" /> New Invoice
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-zinc-500 uppercase tracking-wider font-semibold border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="px-4 py-3">Invoice #</th>
                  <th className="px-4 py-3">Supplier</th>
                  <th className="px-4 py-3">Amount (USDC)</th>
                  <th className="px-4 py-3">Due Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Agent Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
                {invoices.map((inv) => {
                  const supp = suppliers.find(s => s.id === inv.supplierId);
                  return (
                    <tr key={inv.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-800/30">
                      <td className="px-4 py-3 font-mono font-medium text-zinc-900 dark:text-zinc-100">{inv.invoiceNumber}</td>
                      <td className="px-4 py-3 text-zinc-700 dark:text-zinc-300">
                        {supp?.supplierName || 'Unknown Vendor'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-zinc-900 dark:text-zinc-50">
                        ${inv.invoiceAmount.toFixed(2)} USDC
                      </td>
                      <td className="px-4 py-3 text-zinc-500">
                        {new Date(inv.dueDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3">
                        <Badge 
                          variant={
                            inv.paymentStatus === 'PAID' ? 'success' :
                            inv.paymentStatus === 'REJECTED' ? 'destructive' : 'warning'
                          } 
                          className="text-[10px]"
                        >
                          {inv.paymentStatus}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {inv.paymentStatus === 'PENDING' && onRunInvoicePayment && (
                          <Button
                            size="xs"
                            onClick={() => onRunInvoicePayment(inv.id)}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px]"
                          >
                            <Play className="w-3 h-3 mr-1" /> Dispatch Agent
                          </Button>
                        )}
                        {inv.paymentStatus === 'PAID' && (
                          <span className="text-emerald-600 text-[11px] font-medium flex items-center justify-end gap-1">
                            <CheckCircle className="w-3.5 h-3.5" /> Settled
                          </span>
                        )}
                        {inv.paymentStatus === 'REJECTED' && (
                          <span className="text-rose-600 text-[11px] font-medium flex items-center justify-end gap-1">
                            <AlertCircle className="w-3.5 h-3.5" /> Blocked by Policy
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Add Supplier Modal */}
      {showAddSupplier && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-base">Register Vendor / Supplier</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateSupplier} className="space-y-3">
                <div>
                  <label className="text-xs font-medium block mb-1">Supplier Company Name</label>
                  <Input value={newSuppName} onChange={e => setNewSuppName(e.target.value)} placeholder="e.g. Durban Cold Stores Ltd" required />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">Base Sepolia Wallet Address</label>
                  <Input value={newSuppWallet} onChange={e => setNewSuppWallet(e.target.value)} placeholder="0x..." required />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">Approval Status</label>
                  <select 
                    value={newSuppStatus} 
                    onChange={e => setNewSuppStatus(e.target.value as any)}
                    className="w-full text-xs rounded-md border border-zinc-200 dark:border-zinc-800 p-2 bg-transparent"
                  >
                    <option value="APPROVED">APPROVED (Whitelisted for Treasury)</option>
                    <option value="PENDING">PENDING (Unapproved)</option>
                  </select>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddSupplier(false)}>Cancel</Button>
                  <Button type="submit" size="sm" className="bg-emerald-600 text-white">Save Supplier</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Add Invoice Modal */}
      {showAddInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <Card className="max-w-md w-full border-zinc-200 dark:border-zinc-800">
            <CardHeader>
              <CardTitle className="text-base">Create Supplier Invoice</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreateInvoice} className="space-y-3">
                <div>
                  <label className="text-xs font-medium block mb-1">Select Supplier</label>
                  <select
                    value={selectedSupplierId}
                    onChange={e => setSelectedSupplierId(e.target.value)}
                    className="w-full text-xs rounded-md border border-zinc-200 dark:border-zinc-800 p-2 bg-transparent"
                    required
                  >
                    {suppliers.map(s => (
                      <option key={s.id} value={s.id}>{s.supplierName} ({s.approvalStatus})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">Invoice Number</label>
                  <Input value={newInvoiceNum} onChange={e => setNewInvoiceNum(e.target.value)} placeholder="e.g. INV-2026-99" required />
                </div>
                <div>
                  <label className="text-xs font-medium block mb-1">Amount (USDC)</label>
                  <Input type="number" step="0.01" value={newInvoiceAmount} onChange={e => setNewInvoiceAmount(e.target.value)} placeholder="100.00" required />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => setShowAddInvoice(false)}>Cancel</Button>
                  <Button type="submit" size="sm" className="bg-emerald-600 text-white">Create Invoice</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
