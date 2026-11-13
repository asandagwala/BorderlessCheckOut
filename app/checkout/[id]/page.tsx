'use client';

import React, { useState, useEffect, Suspense, use } from 'react';
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
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import { encodeFunctionData, getAddress, isAddress, parseUnits, zeroAddress } from 'viem';

const erc20TransferAbi = [{
  type: 'function',
  name: 'transfer',
  stateMutability: 'nonpayable',
  inputs: [
    { name: 'to', type: 'address' },
    { name: 'value', type: 'uint256' },
  ],
  outputs: [{ name: '', type: 'bool' }],
}] as const;

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
                params: [{
                  chainId: '0x14A34',
                  chainName: 'Base Sepolia',
                  nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
                  rpcUrls: ['https://sepolia.base.org', 'https://base-sepolia-rpc.publicnode.com'],
                  blockExplorerUrls: ['https://sepolia.basescan.org'],
                }],
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
        throw new Error('No web3 provider detected. Connect a browser wallet to submit a Base Sepolia transaction.');
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
        params: [{
          from: currentSender,
          to: usdcContractAddress,
          data,
          value: '0x0',
        }],
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
      <div className="min-h-screen bg-[#fff3e2] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#700c20]" />
          <p className="text-sm font-play font-bold text-zinc-700">Loading secure checkout...</p>
        </div>
      </div>
    );
  }

  if (error || !order || !merchant) {
    return (
      <div className="min-h-screen bg-[#fff3e2] flex items-center justify-center p-4">
        <div className="max-w-md w-full rounded-[35px] border-[5px] border-[#700c20] bg-white p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <h2 className="font-montserrat-extrabold text-xl text-zinc-950">Checkout Unavailable</h2>
          <p className="text-xs font-play text-zinc-600">{error || 'This order does not exist or has expired.'}</p>
          <Link href="/dashboard" className="inline-block mt-4">
            <button className="px-6 py-2.5 rounded-[35px] bg-[#700c20] text-white font-play font-bold text-xs">
              Return to Dashboard
            </button>
          </Link>
        </div>
      </div>
    );
  }

  const isPaid = order.paymentStatus === 'PAID';

  return (
    <div className="min-h-screen bg-[#fff3e2] text-zinc-900 flex flex-col justify-between p-4 sm:p-6 lg:p-8 selection:bg-[#700c20] selection:text-white">
      {/* Top Header */}
      <header className="max-w-5xl mx-auto w-full flex items-center justify-between pb-6 border-b-2 border-[#700c20]/20 mb-8">
        <Link href="/dashboard" className="flex items-center gap-3.5 group cursor-pointer" title="Return to Dashboard">
          <div className="w-11 h-11 rounded-[14px] bg-[#700c20] flex items-center justify-center text-white font-black text-lg shadow-sm transition-transform group-hover:scale-105">
            BC
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-montserrat-extrabold text-lg sm:text-xl tracking-tight text-zinc-950">
                Borderless Checkout
              </span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-[#700c20]/10 text-[#700c20] border border-[#700c20]/30 font-play">
                Base Sepolia
              </span>
            </div>
            <p className="text-xs text-zinc-600 font-play">Official Circle USDC Gateway (6 Decimals)</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span className="text-xs font-play font-bold text-zinc-700 hidden sm:inline">
            Smart Contract Verified
          </span>
        </div>
      </header>

      {/* Main Checkout Container */}
      <main className="max-w-5xl mx-auto w-full grid grid-cols-1 md:grid-cols-12 gap-8 my-auto">
        {/* Left Column: Store & Order Summary */}
        <div className="md:col-span-5 flex flex-col gap-6">
          <div className="rounded-[35px] border-[5px] border-[#700c20] bg-white p-6 sm:p-8 shadow-sm space-y-4">
            <div className="border-b border-[#700c20]/20 pb-4">
              <span className="text-[11px] font-montserrat-extrabold uppercase tracking-wider text-[#700c20] block mb-1">
                Merchant Store
              </span>
              <h2 className="font-montserrat-extrabold text-2xl text-zinc-950 tracking-tight">
                {merchant.businessName}
              </h2>
              <p className="text-xs font-play text-zinc-500 mt-0.5">
                Verified African SME Merchant • {merchant.email}
              </p>
            </div>

            <div className="space-y-3 font-play text-xs sm:text-sm">
              <div className="flex justify-between items-center text-zinc-600">
                <span>Customer Ref:</span>
                <span className="font-mono font-bold text-zinc-900">{order.customerReference}</span>
              </div>
              <div className="flex justify-between items-center text-zinc-600">
                <span>Order Reference:</span>
                <div className="flex items-center gap-1.5 font-mono font-bold text-[#700c20]">
                  <span>{order.paymentReference}</span>
                  <button onClick={() => copyToClipboard(order.paymentReference, 'ref')} className="hover:opacity-70 cursor-pointer">
                    {copiedRef ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center text-zinc-600">
                <span>Order Total (ZAR):</span>
                <span className="font-medium text-zinc-800">R {order.orderAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-[#700c20]/20 flex justify-between items-baseline">
              <span className="text-xs font-play font-bold text-zinc-700 uppercase tracking-wider">
                Total Due:
              </span>
              <div className="text-right">
                <span className="text-3xl font-black font-montserrat-extrabold text-[#700c20]">
                  ${order.usdcAmount.toFixed(2)}
                </span>
                <span className="text-xs font-play font-bold text-zinc-600 ml-1.5">USDC</span>
              </div>
            </div>
          </div>

          {/* Trust Banner */}
          <div className="p-4 rounded-[24px] bg-[#fff3e2] border-2 border-[#700c20]/30 flex items-center gap-3">
            <Coins className="w-5 h-5 text-[#700c20] shrink-0" />
            <p className="text-xs font-play text-zinc-700 leading-snug">
              Payments are verified directly on Base Sepolia. Funds settle immediately to the merchant&apos;s wallet.
            </p>
          </div>
        </div>

        {/* Right Column: Payment Actions & Status */}
        <div className="md:col-span-7">
          <div className="rounded-[35px] border-[5px] border-[#700c20] bg-white p-6 sm:p-8 shadow-sm">
            <div className="pb-4 border-b border-[#700c20]/20 flex justify-between items-center mb-6">
              <h3 className="font-montserrat-extrabold text-xl text-zinc-950">
                Payment Verification
              </h3>
              <span
                className={`px-3 py-1 rounded-full text-xs font-bold font-play uppercase tracking-wider ${
                  isPaid
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}
              >
                {order.paymentStatus}
              </span>
            </div>

            <div className="space-y-6">
              {isPaid ? (
                <div className="text-center py-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 border-2 border-emerald-300 flex items-center justify-center mx-auto">
                    <CheckCircle2 className="w-9 h-9" />
                  </div>
                  <div>
                    <h3 className="font-montserrat-extrabold text-2xl text-zinc-950">
                      Payment Successfully Verified!
                    </h3>
                    <p className="text-xs font-play text-zinc-600 mt-1 max-w-sm mx-auto">
                      On-chain Transfer event was decoded and reconciled on Base Sepolia.
                    </p>
                  </div>

                  {confirmedTxHash && (
                    <div className="pt-2">
                      <a
                        href={`https://sepolia.basescan.org/tx/${confirmedTxHash}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#fff3e2] border border-[#700c20]/30 text-xs font-mono font-bold text-[#700c20] hover:underline"
                      >
                        <span>Tx: {confirmedTxHash.slice(0, 10)}...{confirmedTxHash.slice(-8)}</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  )}

                  <div className="pt-4">
                    <Link href="/dashboard">
                      <button className="px-6 py-3 rounded-[35px] bg-[#700c20] text-white font-play font-bold text-xs uppercase tracking-wider hover:bg-[#520917] transition-all cursor-pointer">
                        Return to Dashboard
                      </button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* Step 1: Wallet Connection */}
                  <div className="p-4 bg-[#fff3e2] rounded-[24px] border-2 border-[#700c20]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <span className="text-xs font-play font-bold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-[#700c20]" />
                      <span>1. Connect Browser Wallet</span>
                    </span>
                    {walletConnected ? (
                      <span className="px-3 py-1 rounded-full text-[11px] font-bold font-mono bg-emerald-100 text-emerald-800 border border-emerald-300">
                        {userAccount?.slice(0, 6)}...{userAccount?.slice(-4)}
                      </span>
                    ) : (
                      <button
                        onClick={connectWallet}
                        className="px-4 py-2 rounded-[35px] bg-[#700c20] text-white font-play font-bold text-xs uppercase tracking-wider hover:bg-[#520917] transition-all cursor-pointer shadow-xs"
                      >
                        Connect Wallet
                      </button>
                    )}
                  </div>
                  {walletConnected && walletChainId !== 84532 && (
                    <p className="text-xs font-play text-rose-700">
                      Please switch your connected wallet to Base Sepolia (Chain ID 84532).
                    </p>
                  )}

                  {/* Step 2: Payment Details & QR Code */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                    {/* QR Code */}
                    <div className="flex flex-col items-center justify-center p-4 bg-[#fff3e2] rounded-[24px] border-2 border-[#700c20]/30 text-center">
                      <QRCodeSVG
                        value={`ethereum:0x036CbD53842c5426634e7929541eC2318f3dCF7e@84532/transfer?address=${merchant.walletAddress}&uint256=${parseUnits(order.usdcAmount.toString(), 6).toString()}`}
                        size={135}
                        level="M"
                      />
                      <span className="text-[10px] font-play text-zinc-500 mt-2">Scan with mobile web3 wallet</span>
                    </div>

                    {/* Merchant Wallet Info */}
                    <div className="space-y-3 text-xs font-play">
                      <div>
                        <span className="text-zinc-600 block mb-1">Merchant Settlement Address:</span>
                        <div className="flex items-center gap-1 font-mono text-[11px] text-zinc-900 bg-[#fff3e2] p-2 rounded-[14px] border border-[#700c20]/30">
                          <span className="truncate flex-1">{merchant.walletAddress}</span>
                          <button onClick={() => copyToClipboard(merchant.walletAddress, 'address')} className="text-[#700c20] hover:opacity-70 cursor-pointer">
                            {copiedAddress ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </div>
                      <div>
                        <span className="text-zinc-600 block mb-1">Circle USDC Token Contract:</span>
                        <div className="font-mono text-[11px] text-zinc-800 truncate bg-[#fff3e2] p-2 rounded-[14px] border border-[#700c20]/30">
                          0x036CbD53842c5426634e7929541eC2318f3dCF7e
                        </div>
                      </div>
                    </div>
                  </div>

                  {verificationError && (
                    <div className="p-3.5 bg-rose-50 border-2 border-rose-300 text-rose-900 text-xs font-play rounded-[20px] flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                      <span>{verificationError}</span>
                    </div>
                  )}

                  {/* Step 3: Payment Buttons */}
                  <div className="pt-2">
                    <button
                      onClick={handlePayUsdc}
                      disabled={submittingPayment || verifyingOnChain || !walletConnected}
                      className="w-full py-4 rounded-[35px] bg-[#700c20] text-white font-play font-bold text-sm uppercase tracking-wider hover:bg-[#520917] disabled:opacity-50 transition-all cursor-pointer shadow-md flex items-center justify-center gap-2"
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
      <footer className="max-w-5xl mx-auto w-full text-center text-xs font-play text-zinc-600 pt-8">
        Borderless Checkout • Node Engine Hackathon 2026 • Base Sepolia Chain ID 84532
      </footer>
    </div>
  );
}

export default function CheckoutPage({ params }: { params: Promise<{ id: string }> }) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#fff3e2] flex items-center justify-center p-4">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#700c20]" />
            <p className="text-sm font-play font-bold text-zinc-700">Loading secure checkout...</p>
          </div>
        </div>
      }
    >
      <CheckoutContent paramsPromise={params} />
    </Suspense>
  );
}
