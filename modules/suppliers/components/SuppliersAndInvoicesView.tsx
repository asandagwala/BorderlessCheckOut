'use client';

import React, { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Plus, Play, Loader2, X } from 'lucide-react';
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
      <div className="p-12 text-center text-xs text-[#685D55] flex items-center justify-center gap-2">
        <Loader2 className="w-5 h-5 animate-spin text-[#C84B24]" />
        <span>Loading supplier and invoice registry...</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Suppliers Table Section */}
      <div className="rounded-2xl border border-[#E8DCD0] bg-white p-6 sm:p-8 shadow-[0_12px_32px_-12px_rgba(24,20,18,0.06)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#EFE5DA]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#1E6B45]">
              Vendor Whitelist
            </p>
            <h2 className="mt-1 font-montserrat-extrabold text-xl sm:text-2xl text-[#181412] tracking-tight">
              Approved Suppliers &amp; Vendors
            </h2>
            <p className="text-xs sm:text-sm text-[#685D55] mt-1">
              Treasury policy mandates payments can only be disbursed to APPROVED vendors
            </p>
          </div>
          <button
            onClick={() => setShowAddSupplier(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border-2 border-[#C84B24] bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-[#C84B24] transition hover:bg-[#C84B24] hover:text-white cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Supplier</span>
          </button>
        </div>

        <div className="overflow-x-auto pt-4">
          <table className="w-full text-xs text-left">
            <thead className="text-[#685D55] uppercase tracking-wider font-montserrat-extrabold text-[11px] border-b border-[#EFE5DA] bg-[#FFF8EE]/60">
              <tr>
                <th className="px-4 py-3.5 rounded-l-lg">Supplier Name</th>
                <th className="px-4 py-3.5">Base Sepolia Wallet</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right rounded-r-lg">Added</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2E8DC]">
              {suppliers.map((s) => (
                <tr key={s.id} className="hover:bg-[#FFF8EE]/50 transition-colors">
                  <td className="px-4 py-4 font-bold text-[#181412]">{s.supplierName}</td>
                  <td className="px-4 py-4 font-mono text-[11px] text-[#685D55] truncate max-w-[240px]">
                    {s.walletAddress}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        s.approvalStatus === 'APPROVED'
                          ? 'bg-[#EAF6F0] text-[#1E6B45] border border-[#1E6B45]/25'
                          : 'bg-[#FFF6E0] text-[#9A6004] border border-[#E59A18]/40'
                      }`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${
                          s.approvalStatus === 'APPROVED' ? 'bg-[#1E6B45]' : 'bg-[#E59A18]'
                        }`}
                      />
                      {s.approvalStatus}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right text-[#685D55] whitespace-nowrap font-mono">
                    {new Date(s.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {suppliers.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[#685D55]">
                    No approved suppliers yet. Add one above.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoices Table Section */}
      <div className="rounded-2xl border border-[#E8DCD0] bg-white p-6 sm:p-8 shadow-[0_12px_32px_-12px_rgba(24,20,18,0.06)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-[#EFE5DA]">
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-[#C84B24]">
              Payables &amp; Settlements
            </p>
            <h2 className="mt-1 font-montserrat-extrabold text-xl sm:text-2xl text-[#181412] tracking-tight">
              Supplier Invoices Awaiting Settlement
            </h2>
            <p className="text-xs sm:text-sm text-[#685D55] mt-1">
              Evaluated by AI Treasury Agent against $500 spending limits and whitelist
            </p>
          </div>
          <button
            onClick={() => setShowAddInvoice(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#C84B24] px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white shadow-[0_6px_18px_-4px_rgba(200,75,36,0.4)] transition hover:bg-[#A63816] cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Record Invoice</span>
          </button>
        </div>

        <div className="overflow-x-auto pt-4">
          <table className="w-full text-xs text-left">
            <thead className="text-[#685D55] uppercase tracking-wider font-montserrat-extrabold text-[11px] border-b border-[#EFE5DA] bg-[#FFF8EE]/60">
              <tr>
                <th className="px-4 py-3.5 rounded-l-lg">Invoice #</th>
                <th className="px-4 py-3.5">Supplier</th>
                <th className="px-4 py-3.5">Amount (USDC)</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5">Due Date</th>
                <th className="px-4 py-3.5 text-right rounded-r-lg">Settlement Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F2E8DC]">
              {invoices.map((inv) => {
                const supplier = suppliers.find((s) => s.id === inv.supplierId);
                const isPaid = inv.paymentStatus === 'PAID';
                const isRejected = inv.paymentStatus === 'REJECTED';
                return (
                  <tr key={inv.id} className="hover:bg-[#FFF8EE]/50 transition-colors">
                    <td className="px-4 py-4 font-mono font-bold text-[#181412]">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-4 py-4 font-bold text-[#3D342E]">
                      {supplier?.supplierName || 'Approved Supplier'}
                    </td>
                    <td className="px-4 py-4 font-slogan font-bold text-[#181412] text-sm">
                      ${inv.invoiceAmount.toFixed(2)} USDC
                    </td>
                    <td className="px-4 py-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isPaid
                            ? 'bg-[#EAF6F0] text-[#1E6B45] border border-[#1E6B45]/25'
                            : isRejected
                            ? 'bg-[#FCECEE] text-[#8B1E24] border border-[#8B1E24]/25'
                            : 'bg-[#FFF6E0] text-[#9A6004] border border-[#E59A18]/40'
                        }`}
                      >
                        {inv.paymentStatus}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-[#685D55] whitespace-nowrap font-mono">
                      {new Date(inv.dueDate).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-4 text-right">
                      {!isPaid && !isRejected ? (
                        <button
                          onClick={() => onRunInvoicePayment && onRunInvoicePayment(inv.id)}
                          className="px-4 py-1.5 rounded-lg bg-[#C84B24] text-white font-bold text-[11px] uppercase tracking-wider hover:bg-[#A63816] transition-all cursor-pointer shadow-xs inline-flex items-center gap-1.5"
                        >
                          <Play className="w-3 h-3 fill-white" />
                          <span>Evaluate Agent</span>
                        </button>
                      ) : isPaid ? (
                        <span className="text-[#1E6B45] font-bold text-xs">Paid on-chain</span>
                      ) : (
                        <span className="text-[#8B1E24] font-bold text-xs">Blocked by Policy</span>
                      )}
                    </td>
                  </tr>
                );
              })}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-[#685D55]">
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
        <div className="fixed inset-0 z-50 bg-[#181412]/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="rounded-2xl border border-[#E8DCD0] bg-white p-7 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFE5DA]">
              <div>
                <h3 className="font-montserrat-extrabold text-xl text-[#181412]">
                  Add Approved Supplier
                </h3>
                <p className="text-xs text-[#685D55] mt-1">
                  Whitelisted vendor eligible for automated AI payouts.
                </p>
              </div>
              <button
                onClick={() => setShowAddSupplier(false)}
                className="w-8 h-8 rounded-lg bg-[#FFF8EE] border border-[#E4D5C5] flex items-center justify-center text-[#463C35] hover:bg-[#C84B24] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateSupplier} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#3D342E] block mb-1.5">
                  Supplier / Vendor Name
                </label>
                <Input
                  value={newSuppName}
                  onChange={(e) => setNewSuppName(e.target.value)}
                  placeholder="e.g. Cape Agro Packaging Ltd"
                  required
                  className="bg-[#FFF8EE]/60 border border-[#DCCBC0] rounded-xl text-xs h-11 px-4"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#3D342E] block mb-1.5">
                  Base Sepolia Wallet Address
                </label>
                <Input
                  value={newSuppWallet}
                  onChange={(e) => setNewSuppWallet(e.target.value)}
                  placeholder="0x..."
                  required
                  className="bg-[#FFF8EE]/60 border border-[#DCCBC0] rounded-xl text-xs font-mono h-11 px-4"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddSupplier(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white text-[#463C35] border border-[#E4D5C5] font-bold text-xs hover:border-[#C84B24] hover:text-[#C84B24] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#C84B24] text-white font-bold text-xs hover:bg-[#A63816] transition-all cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-[#181412]/65 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="rounded-2xl border border-[#E8DCD0] bg-white p-7 sm:p-8 max-w-md w-full shadow-2xl space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-[#EFE5DA]">
              <div>
                <h3 className="font-montserrat-extrabold text-xl text-[#181412]">
                  Record Supplier Invoice
                </h3>
                <p className="text-xs text-[#685D55] mt-1">
                  Submit an invoice for the AI Treasury Agent to evaluate.
                </p>
              </div>
              <button
                onClick={() => setShowAddInvoice(false)}
                className="w-8 h-8 rounded-lg bg-[#FFF8EE] border border-[#E4D5C5] flex items-center justify-center text-[#463C35] hover:bg-[#C84B24] hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleCreateInvoice} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-[#3D342E] block mb-1.5">
                  Select Supplier
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  className="w-full bg-[#FFF8EE]/60 border border-[#DCCBC0] rounded-xl text-xs px-3.5 py-2.5 h-11 font-bold text-[#181412]"
                >
                  {suppliers.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.supplierName} ({s.approvalStatus})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-bold text-[#3D342E] block mb-1.5">
                  Invoice Number
                </label>
                <Input
                  value={newInvoiceNum}
                  onChange={(e) => setNewInvoiceNum(e.target.value)}
                  placeholder="INV-..."
                  required
                  className="bg-[#FFF8EE]/60 border border-[#DCCBC0] rounded-xl text-xs font-mono h-11 px-4"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-[#3D342E] block mb-1.5">
                  Amount (USDC)
                </label>
                <Input
                  type="number"
                  step="0.01"
                  value={newInvoiceAmount}
                  onChange={(e) => setNewInvoiceAmount(e.target.value)}
                  placeholder="150.00"
                  required
                  className="bg-[#FFF8EE]/60 border border-[#DCCBC0] rounded-xl text-xs font-slogan font-bold h-11 px-4"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddInvoice(false)}
                  className="flex-1 py-2.5 rounded-xl bg-white text-[#463C35] border border-[#E4D5C5] font-bold text-xs hover:border-[#C84B24] hover:text-[#C84B24] transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#C84B24] text-white font-bold text-xs hover:bg-[#A63816] transition-all cursor-pointer"
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
