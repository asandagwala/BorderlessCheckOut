'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Plus, ExternalLink, Play, Loader2 } from 'lucide-react';
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
          dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
        }),
      });
      setShowAddInvoice(false);
      setNewInvoiceNum('');
      setNewInvoiceAmount('150.00');
      fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="p-12 text-center text-xs text-zinc-600 flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-[#700c20]" />
        <span className="font-play">Loading supplier and invoice registry...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Suppliers Table Section: Clean title WITHOUT icon */}
      <div className="rounded-[35px] border-[5px] border-[#700c20] bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#700c20]/20">
          <div>
            <h2 className="font-montserrat-extrabold text-xl sm:text-2xl text-zinc-950 tracking-tight">
              Approved Suppliers &amp; Vendors
            </h2>
            <p className="text-xs sm:text-sm font-play text-zinc-600 mt-1">
              Treasury policy mandates payments can only be disbursed to APPROVED vendors
            </p>
          </div>
          <button
            onClick={() => setShowAddSupplier(true)}
            className="px-6 py-2.5 rounded-[35px] bg-white text-[#700c20] border-[2px] border-[#700c20] font-play font-bold text-xs uppercase tracking-wider hover:bg-[#700c20] hover:text-white transition-all duration-200 cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Supplier</span>
          </button>
        </div>

        <div className="overflow-x-auto pt-4">
          <table className="w-full text-xs text-left">
            <thead className="text-zinc-600 uppercase tracking-wider font-montserrat-extrabold text-[11px] border-b-2 border-[#700c20]/20">
              <tr>
                <th className="px-4 py-3">Supplier Name</th>
                <th className="px-4 py-3">Base Sepolia Wallet</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#700c20]/10 font-play">
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-[#fff3e2]/40 transition-colors">
                  <td className="px-4 py-3.5 font-semibold text-zinc-900">{s.supplierName}</td>
                  <td className="px-4 py-3.5 font-mono text-[11px] text-zinc-600 truncate max-w-[240px]">
                    {s.walletAddress}
                  </td>
                  <td className="px-4 py-3.5">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold font-play uppercase tracking-wider ${
                        s.approvalStatus === 'APPROVED'
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                          : 'bg-amber-100 text-amber-800 border border-amber-300'
                      }`}
                    >
                      {s.approvalStatus}
                    </span>
                  </td>
                  <td className="px-4 py-3.5 text-right text-zinc-500 whitespace-nowrap font-mono">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                    No approved suppliers yet. Add one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoices Table Section: Clean title WITHOUT icon */}
      <div className="rounded-[35px] border-[5px] border-[#700c20] bg-white p-6 sm:p-8 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#700c20]/20">
          <div>
            <h2 className="font-montserrat-extrabold text-xl sm:text-2xl text-zinc-950 tracking-tight">
              Supplier Invoices Awaiting Settlement
            </h2>
            <p className="text-xs sm:text-sm font-play text-zinc-600 mt-1">
              Evaluated by AI Treasury Agent against $500 spending limits and whitelist
            </p>
          </div>
          <button
            onClick={() => setShowAddInvoice(true)}
            className="px-6 py-2.5 rounded-[35px] bg-white text-[#700c20] border-[2px] border-[#700c20] font-play font-bold text-xs uppercase tracking-wider hover:bg-[#700c20] hover:text-white transition-all duration-200 cursor-pointer shadow-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Invoice</span>
          </button>
        </div>

        <div className="overflow-x-auto pt-4">
          <table className="w-full text-xs text-left">
            <thead className="text-zinc-600 uppercase tracking-wider font-montserrat-extrabold text-[11px] border-b-2 border-[#700c20]/20">
              <tr>
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Amount (USDC)</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Due Date</th>
                <th className="px-4 py-3 text-right">Settlement Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#700c20]/10 font-play">
              {invoices.map((inv) => {
                const supplier = suppliers.find((s) => s.id === inv.supplierId);
                const isPaid = inv.paymentStatus === 'PAID';
                const isRejected = inv.paymentStatus === 'REJECTED';
                return (
                  <tr key={inv.id} className="hover:bg-[#fff3e2]/40 transition-colors">
                    <td className="px-4 py-3.5 font-mono font-bold text-zinc-900">{inv.invoiceNumber}</td>
                    <td className="px-4 py-3.5 font-semibold text-zinc-800">{supplier?.supplierName || 'Approved Supplier'}</td>
                    <td className="px-4 py-3.5 font-montserrat font-bold text-zinc-950">
                      ${inv.invoiceAmount.toFixed(2)} USDC
                    </td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-block px-3 py-1 rounded-full text-[10px] font-bold font-play uppercase tracking-wider ${
                          isPaid
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : isRejected
                            ? 'bg-rose-100 text-rose-800 border border-rose-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-zinc-500 whitespace-nowrap font-mono">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {!isPaid && !isRejected ? (
                        <button
                          onClick={() => onRunInvoicePayment && onRunInvoicePayment(inv.id)}
                          className="px-4 py-1.5 rounded-[35px] bg-[#700c20] text-white font-play font-bold text-[11px] uppercase tracking-wider hover:bg-[#520917] transition-all cursor-pointer shadow-xs inline-flex items-center gap-1"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>Evaluate Agent</span>
                        </button>
                      ) : isPaid ? (
                        <span className="text-emerald-700 font-bold font-play text-xs">Paid on-chain</span>
                      ) : (
                        <span className="text-zinc-400 italic text-xs">Blocked by Policy</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                    No supplier invoices on file. Click &ldquo;Record Invoice&rdquo; above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Supplier Modal */}
      {showAddSupplier && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="rounded-[35px] border-[5px] border-[#700c20] bg-[#fff3e2] p-8 max-w-md w-full shadow-2xl space-y-6">
            <div>
              <h3 className="font-montserrat-extrabold text-xl text-zinc-950">Add Approved Supplier</h3>
              <p className="text-xs font-play text-zinc-600 mt-1">Whitelisted vendor eligible for automated AI payouts.</p>
            </div>
            <form onSubmit={handleCreateSupplier} className="space-y-4">
              <div>
                <label className="text-xs font-bold font-play text-zinc-700 block mb-1">Supplier / Vendor Name</label>
                <Input
                  value={newSuppName}
                  onChange={(e) => setNewSuppName(e.target.value)}
                  placeholder="e.g. Cape Agro Packaging Ltd"
                  required
                  className="bg-white border-2 border-[#700c20] rounded-[20px] text-xs font-play"
                />
              </div>
              <div>
                <label className="text-xs font-bold font-play text-zinc-700 block mb-1">Base Sepolia Wallet Address</label>
                <Input
                  value={newSuppWallet}
                  onChange={(e) => setNewSuppWallet(e.target.value)}
                  placeholder="0x..."
                  required
                  className="bg-white border-2 border-[#700c20] rounded-[20px] text-xs font-mono"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddSupplier(false)}
                  className="flex-1 py-2.5 rounded-[35px] bg-white text-[#700c20] border-2 border-[#700c20] font-play font-bold text-xs hover:bg-[#700c20] hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-[35px] bg-[#700c20] text-white font-play font-bold text-xs hover:bg-[#520917] transition-all cursor-pointer"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Invoice Modal */}
      {showAddInvoice && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="rounded-[35px] border-[5px] border-[#700c20] bg-[#fff3e2] p-8 max-w-md w-full shadow-2xl space-y-6">
            <div>
              <h3 className="font-montserrat-extrabold text-xl text-zinc-950">Record Supplier Invoice</h3>
              <p className="text-xs font-play text-zinc-600 mt-1">Submit an invoice for the AI Treasury Agent to evaluate.</p>
            </div>
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="text-xs font-bold font-play text-zinc-700 block mb-1">Select Supplier</label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full bg-white border-2 border-[#700c20] rounded-[20px] text-xs font-play px-3 py-2.5"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.supplierName} ({s.approvalStatus})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold font-play text-zinc-700 block mb-1">Invoice Number</label>
                <Input
                  value={newInvoiceNum}
                  onChange={(e) => setNewInvoiceNum(e.target.value)}
                  placeholder="INV-..."
                  required
                  className="bg-white border-2 border-[#700c20] rounded-[20px] text-xs font-mono"
                />
              </div>
              <div>
                <label className="text-xs font-bold font-play text-zinc-700 block mb-1">Amount (USDC)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={newInvoiceAmount}
                  onChange={(e) => setNewInvoiceAmount(e.target.value)}
                  placeholder="150.00"
                  required
                  className="bg-white border-2 border-[#700c20] rounded-[20px] text-xs font-montserrat font-bold"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddInvoice(false)}
                  className="flex-1 py-2.5 rounded-[35px] bg-white text-[#700c20] border-2 border-[#700c20] font-play font-bold text-xs hover:bg-[#700c20] hover:text-white transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-[35px] bg-[#700c20] text-white font-play font-bold text-xs hover:bg-[#520917] transition-all cursor-pointer"
                >
                  Save Invoice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
