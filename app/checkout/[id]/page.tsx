'use client';

import React, { useState, useEffect, Suspense, use } from 'react';
import Image from 'next/image';
import { QRCodeSVG } from 'qrcode.react';
import {
  CheckCircle2,
  AlertCircle,
  Loader2,
  Wallet,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Coins,
} from 'lucide-react';
import Link from 'next/link';
import { encodeFunctionData, getAddress, isAddress, parseUnits, zeroAddress } from 'viem';
import { UhuruLogo } from '@/components/ui/uhuru-logo';

const erc20TransferAbi = [
  {
    type: 'function',
    name: 'transfer',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'to', type: 'address' },
      { name: 'value', type: 'uint256' },
    ],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

interface OrderData {
  id: string;
  merchantId: string;
  customerReference: string;
  orderAmount: number;
  currency: string;
  usdcAmount: number;
  paymentReference: string;
  paymentStatus: 'PENDING' | 'CONFIRMING' | 'PAID' | 'FAILED' | 'EXPIRED';
  createdAt: string;
}

interface MerchantInfo {
  businessName: string;
  walletAddress: string;
  email: string;
}

function CheckoutContent({ paramsPromise }: { paramsPromise: Promise<{ id: string }> }) {
  const resolvedParams = use(paramsPromise);
  const orderId = resolvedParams.id;

  const [order, setOrder] = useState<OrderData | null>(null);
  const [merchant, setMerchant] = useState<MerchantInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Wallet and payment state
  const [walletConnected, setWalletConnected] = useState(false);
  const [userAccount, setUserAccount] = useState<string | null>(null);
  const [walletChainId, setWalletChainId] = useState<number | null>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [verifyingOnChain, setVerifyingOnChain] = useState(false);
  const [verificationError, setVerificationError] = useState<string | null>(null);
  const [confirmedTxHash, setConfirmedTxHash] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState(false);
  const [copiedRef, setCopiedRef] = useState(false);

  // Fetch order and merchant details
  const fetchOrder = async () => {
    if (!orderId) return;
    try {
      const res = await fetch(`/api/orders/${orderId}`);
      if (!res.ok) throw new Error('Order not found');
      const data = await res.json();
      setOrder(data.order);
      setMerchant(data.merchant);
      if (data.order.paymentStatus === 'PAID') {
        const txRes = await fetch(`/api/dashboard/stats?merchantId=${data.order.merchantId}`);
        const txData = await txRes.json();
        const found = txData.recentTransactions?.find((t: any) => t.orderId === orderId);
        if (found) setConfirmedTxHash(found.txHash);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load checkout details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    const interval = setInterval(fetchOrder, 6000);
    return () => clearInterval(interval);
  }, [orderId]);

  // Connect Injected Browser Wallet (MetaMask / Coinbase / etc.)
  const connectWallet = async () => {
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      try {
        const ethereum = (window as any).ethereum;
        const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
        const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
        const chainId = parseInt(chainIdHex, 16);
        setUserAccount(accounts[0]);
        setWalletChainId(chainId);
        setWalletConnected(true);

        if (chainId !== 84532) {
          try {
            await ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: '0x14A34' }],
            });
            setWalletChainId(84532);
          } catch (switchError: any) {
            if (switchError.code === 4902) {
              await ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [
                  {
                    chainId: '0x14A34',
                    chainName: 'Base Sepolia',
                    nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                    rpcUrls: ['https://sepolia.base.org', 'https://base-sepolia-rpc.publicnode.com'],
                    blockExplorerUrls: ['https://sepolia.basescan.org'],
                  },
                ],
              });
            }
          }
        }
      } catch (err: any) {
        console.error('Wallet connection error:', err);
        setVerificationError(err.message || 'Failed to connect wallet');
      }
    } else {
      setVerificationError('A compatible browser wallet is required to submit a USDC payment.');
    }
  };

  const handlePayUsdc = async () => {
    if (!order || !merchant) return;
    setSubmittingPayment(true);
    setVerificationError(null);

    let txHash: string | null = null;
    try {
      if (typeof window === 'undefined' || !(window as any).ethereum) {
        throw new Error(
          'No web3 provider detected. Connect a browser wallet to submit a Base Sepolia transaction.'
        );
      }

      const ethereum = (window as any).ethereum;
      const accounts = await ethereum.request({ method: 'eth_requestAccounts' });
      const currentSender = accounts[0];
      if (!currentSender) throw new Error('Please connect your web3 wallet first.');

      const chainIdHex = await ethereum.request({ method: 'eth_chainId' });
      if (parseInt(chainIdHex, 16) !== 84532) {
        throw new Error('Please switch network to Base Sepolia (Chain ID 84532).');
      }

      if (!isAddress(merchant.walletAddress) || getAddress(merchant.walletAddress) === zeroAddress) {
        throw new Error('Merchant settlement wallet is not configured on Base Sepolia.');
      }

      const usdcContractAddress = '0x036CbD53842c5426634e7929541eC2318f3dCF7e';
      const amountUnits = parseUnits(order.usdcAmount.toString(), 6);
      const data = encodeFunctionData({
        abi: erc20TransferAbi,
        functionName: 'transfer',
        args: [getAddress(merchant.walletAddress), amountUnits],
      });

      txHash = await ethereum.request({
        method: 'eth_sendTransaction',
        params: [
          {
            from: currentSender,
            to: usdcContractAddress,
            data,
            value: '0x0',
          },
        ],
      });

      setSubmittingPayment(false);
      setVerifyingOnChain(true);

      const verifyRes = await fetch('/api/checkout/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId: order.id,
          txHash,
        }),
      });

      const verifyData = await verifyRes.json();
      if (!verifyRes.ok) {
        throw new Error(verifyData.error || 'Payment verification failed on Base Sepolia.');
      }

      setConfirmedTxHash(txHash);
      await fetchOrder();
    } catch (err: any) {
      console.error('Payment execution error:', err);
      setVerificationError(err.message || 'Payment execution failed');
    } finally {
      setSubmittingPayment(false);
      setVerifyingOnChain(false);
    }
  };

  const copyToClipboard = (text: string, type: 'address' | 'ref') => {
    navigator.clipboard.writeText(text);
    if (type === 'address') {
      setCopiedAddress(true);
      setTimeout(() => setCopiedAddress(false), 2000);
    } else {
      setCopiedRef(true);
      setTimeout(() => setCopiedRef(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#C84B24]" />
          <p className="text-sm font-bold text-[#463C35]">Loading secure UHURU checkout...</p>
        </div>
      </div>
    );
  }

  if (error || !order || !merchant) {
    return (
      <div className="min-h-screen bg-[#FFF8EE] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-2xl border border-[#E8DCD0] bg-white p-8 text-center space-y-4 shadow-lg">
          <div className="w-12 h-12 rounded-2xl bg-[#FCECEE] text-[#8B1E24] flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="font-montserrat-extrabold text-xl text-[#181412]">Checkout Unavailable</h2>
          <p className="text-xs text-[#685D55]">
            {error || 'This order does not exist or has expired.'}
          </p>
          <Link href="/dashboard" className="inline-block mt-4">
            <button className="px-6 py-2.5 rounded-xl bg-[#C84B24] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#A63816]">
              Return to Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = order.paymentStatus === 'PAID';

  return (
    <div className="min-h-screen bg-white text-[#181412] font-body-arial flex flex-col justify-between selection:bg-[#C84B24] selection:text-white">
      <div className="h-1.5 w-full bg-gradient-to-r from-[#C84B24] via-[#E59A18] to-[#1E6B45]" />

      {/* Top Header */}
      <header className="border-b border-[#ECE0D3] bg-white">
        <div className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <UhuruLogo href="/dashboard" size="sm" theme="dark" showSlogan={true} />

          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[#EAF6F0] border border-[#1E6B45]/25 px-3 py-1 text-xs font-bold text-[#1E6B45]">
              <ShieldCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Base Sepolia Verified</span>
              <span className="sm:hidden">Base Sepolia</span>
            </span>
          </div>
        </div>
      </header>

      {/* Main Checkout Container */}
      <main className="max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 grid grid-cols-1 md:grid-cols-12 gap-8 my-auto">
        {/* Left Column: Store & Order Summary */}
        <div className="md:col-span-5 flex flex-col gap-6">
          <div className="overflow-hidden rounded-2xl border border-[#E8DCD0] bg-white shadow-[0_14px_36px_-15px_rgba(24,20,18,0.1)]">
            {/* Cultural Banner Header */}
            <div className="relative h-32 w-full overflow-hidden bg-[#181412]">
              <Image
                src="/uhuru/hero.png"
                alt="African merchant craft"
                fill
                className="object-cover opacity-80"
                sizes="(max-width: 768px) 100vw, 40vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#181412]/90 via-[#181412]/35 to-transparent" />
              <div className="absolute bottom-3.5 left-6 right-6 text-white">
                <span className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#E59A18] block">
                  Verified UHURU Merchant
                </span>
                <h2 className="font-montserrat-extrabold text-xl text-white tracking-tight truncate">
                  {merchant.businessName}
                </h2>
              </div>
            </div>

            <div className="p-6 sm:p-7 space-y-5">
              <div className="space-y-3 text-xs sm:text-sm">
                <div className="flex justify-between items-center text-[#685D55]">
                  <span>Merchant Contact:</span>
                  <span className="font-bold text-[#181412]">{merchant.email}</span>
                </div>
                <div className="flex justify-between items-center text-[#685D55]">
                  <span>Customer Ref:</span>
                  <span className="font-mono font-bold text-[#181412]">
                    {order.customerReference}
                  </span>
                </div>
                <div className="flex justify-between items-center text-[#685D55]">
                  <span>Order Reference:</span>
                  <div className="flex items-center gap-1.5 font-mono font-bold text-[#C84B24]">
                    <span>{order.paymentReference}</span>
                    <button
                      onClick={() => copyToClipboard(order.paymentReference, 'ref')}
                      className="hover:opacity-70 cursor-pointer"
                    >
                      {copiedRef ? (
                        <Check className="w-3.5 h-3.5 text-[#1E6B45]" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center text-[#685D55]">
                  <span>Order Total (ZAR):</span>
                  <span className="font-bold text-[#3D342E]">R {order.orderAmount.toFixed(2)}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-[#EFE5DA] flex justify-between items-baseline">
                <span className="text-xs font-bold text-[#685D55] uppercase tracking-wider">
                  Total Due:
                </span>
                <div className="text-right">
                  <span className="text-3xl font-black font-montserrat-extrabold text-[#C84B24]">
                    ${order.usdcAmount.toFixed(2)}
                  </span>
                  <span className="text-xs font-bold text-[#463C35] ml-1.5">USDC</span>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Banner */}
          <div className="p-4 rounded-xl bg-[#FFF8EE] border border-[#E8DCD0] flex items-center gap-3">
            <Coins className="w-5 h-5 text-[#C84B24] shrink-0" />
            <p className="text-xs text-[#4E443C] leading-snug">
              Payments are verified directly against Base Sepolia transaction receipts before
              marking your order complete.
            </p>
          </div>
        </div>

        {/* Right Column: Payment Actions & Status */}
        <div className="md:col-span-7">
          <div className="rounded-2xl border border-[#E8DCD0] bg-white p-6 sm:p-8 shadow-[0_14px_36px_-15px_rgba(24,20,18,0.1)]">
            <div className="pb-4 border-b border-[#EFE5DA] flex justify-between items-center mb-6">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#C84B24]">
                  Circle USDC Settlement
                </p>
                <h3 className="font-montserrat-extrabold text-xl text-[#181412] mt-0.5">
                  Payment Verification
                </h3>
              </div>
              <span
                className={`px-3.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  isPaid
                    ? 'bg-[#EAF6F0] text-[#1E6B45] border border-[#1E6B45]/25'
                    : 'bg-[#FFF6E0] text-[#9A6004] border border-[#E59A18]/40'
                }`}
              >
                {order.paymentStatus}
              </span>
            </div>

            <div className="space-y-6">
              {isPaid ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-2xl bg-[#EAF6F0] text-[#1E6B45] border border-[#1E6B45]/25 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <div>
                    <h3 className="font-montserrat-extrabold text-2xl text-[#181412]">
                      Payment Successfully Verified!
                    </h3>
                    <p className="text-xs text-[#685D55] mt-1 max-w-sm mx-auto">
                      On-chain Transfer event was decoded and reconciled on Base Sepolia.
                    </p>
                  </div>

                  {confirmedTxHash && (
                    <div className="pt-2">
                      <a
                        href={`https://sepolia.basescan.org/tx/${confirmedTxHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#FFF8EE] border border-[#E4D5C5] text-xs font-mono font-bold text-[#C84B24] hover:underline"
                      >
                        <span>
                          Tx: {confirmedTxHash.slice(0, 10)}...{confirmedTxHash.slice(-8)}
                        </span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}

                  <div className="pt-4">
                    <Link href="/dashboard">
                      <button className="px-6 py-3 rounded-xl bg-[#C84B24] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#A63816] transition-all cursor-pointer">
                        Return to Dashboard
                      </button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Step 1: Wallet Connection */}
                  <div className="p-4 bg-[#FFF8EE] rounded-xl border border-[#E8DCD0] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#181412] flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-[#C84B24]" />
                      <span>1. Connect Browser Wallet</span>
                    </span>
                    {walletConnected ? (
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold font-mono bg-[#EAF6F0] text-[#1E6B45] border border-[#1E6B45]/25">
                        {userAccount?.slice(0, 6)}...{userAccount?.slice(-4)}
                      </span>
                    ) : (
                      <button
                        onClick={connectWallet}
                        className="px-4 py-2 rounded-lg bg-[#C84B24] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#A63816] transition-all cursor-pointer shadow-xs"
                      >
                        Connect Wallet
                      </button>
                    )}
                  </div>
                  {walletConnected && walletChainId !== 84532 && (
                    <p className="text-xs font-bold text-[#8B1E24]">
                      Please switch your connected wallet to Base Sepolia (Chain ID 84532).
                    </p>
                  )}

                  {/* Step 2: Payment Details & QR Code */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    {/* QR Code */}
                    <div className="flex flex-col items-center justify-center p-4 bg-[#FFF8EE] rounded-xl border border-[#E8DCD0] text-center">
                      <QRCodeSVG
                        value={`ethereum:0x036CbD53842c5426634e7929541eC2318f3dCF7e@84532/transfer?address=${merchant.walletAddress}&uint256=${parseUnits(order.usdcAmount.toString(), 6).toString()}`}
                        size={135}
                        level="M"
                      />
                      <span className="text-[10px] text-[#685D55] mt-2">
                        Scan with mobile web3 wallet
                      </span>
                    </div>

                    {/* Merchant Wallet Info */}
                    <div className="space-y-3 text-xs">
                      <div>
                        <span className="text-[#685D55] font-bold block mb-1">
                          Merchant Settlement Address:
                        </span>
                        <div className="flex items-center gap-1 font-mono text-[11px] text-[#181412] bg-[#FFF8EE] p-2.5 rounded-xl border border-[#E4D5C5]">
                          <span className="truncate flex-1">{merchant.walletAddress}</span>
                          <button
                            onClick={() => copyToClipboard(merchant.walletAddress, 'address')}
                            className="text-[#C84B24] hover:opacity-70 cursor-pointer"
                          >
                            {copiedAddress ? (
                              <Check className="w-3.5 h-3.5 text-[#1E6B45]" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                          </button>
                        </div>
                      </div>
                      <div>
                        <span className="text-[#685D55] font-bold block mb-1">
                          Circle USDC Token Contract:
                        </span>
                        <div className="font-mono text-[11px] text-[#4E443C] truncate bg-[#FFF8EE] p-2.5 rounded-xl border border-[#E4D5C5]">
                          0x036CbD53842c5426634e7929541eC2318f3dCF7e
                        </div>
                      </div>
                    </div>
                  </div>

                  {verificationError && (
                    <div className="p-3.5 bg-[#FCECEE] border border-[#8B1E24]/30 text-[#8B1E24] text-xs rounded-xl flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-[#8B1E24] shrink-0 mt-0.5" />
                      <span>{verificationError}</span>
                    </div>
                  )}

                  {/* Step 3: Payment Buttons */}
                  <div className="pt-2">
                    <button
                      onClick={handlePayUsdc}
                      disabled={submittingPayment || verifyingOnChain || !walletConnected}
                      className="w-full py-4 rounded-xl bg-[#C84B24] text-white font-bold text-sm uppercase tracking-wider hover:bg-[#A63816] disabled:opacity-50 transition-all cursor-pointer shadow-[0_10px_24px_-6px_rgba(200,75,36,0.45)] flex items-center justify-center gap-2"
                    >
                      {submittingPayment ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Awaiting Wallet Signature...</span>
                        </>
                      ) : verifyingOnChain ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Verifying On-Chain via Base Sepolia RPC...</span>
                        </>
                      ) : (
                        `Approve & Pay $${order.usdcAmount.toFixed(2)} USDC`
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-[#ECE0D3] bg-[#FFF8EE] py-6">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#685D55]">
          <span className="font-bold text-[#181412]">
            UHURU &bull; Freedom to Pay. Freedom to Grow.
          </span>
          <span>Base Sepolia Chain ID 84532 &bull; Circle USDC (6 Decimals)</span>
        </div>
      </footer>
    </div>
  );
}

export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-white flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#C84B24]" />
            <p className="text-sm font-bold text-[#463C35]">Loading secure UHURU checkout...</p>
          </div>
        </div>
      }
    >
      <CheckoutContent paramsPromise={params} />
    </Suspense>
  );
}
