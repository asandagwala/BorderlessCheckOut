import { db } from '@/lib/database/db';
import { BlockchainPaymentVerifier } from '@/modules/blockchain/verifier.service';
import { Order, Transaction } from '@/lib/database/types';
import { CHAIN_CONFIG } from '@/modules/blockchain/config';

export interface ReconciliationResult {
  success: boolean;
  orderId: string;
  orderStatus: string;
  txHash: string;
  message: string;
  transaction?: Transaction;
  error?: string;
}

export class ReconciliationService {
  /**
   * Reconciles a blockchain payment with an order.
   * Performs end-to-end verification and updates order status.
   */
  static async reconcileOrderPayment(
    orderId: string,
    txHash: string,
    simulatedMode: boolean = false
  ): Promise<ReconciliationResult> {
    const order = await db.getOrderById(orderId);
    if (!order) {
      return {
        success: false,
        orderId,
        orderStatus: 'UNKNOWN',
        txHash,
        message: 'Order not found.',
        error: 'ORDER_NOT_FOUND',
      };
    }

    // Check if order is already paid
    if (order.paymentStatus === 'PAID') {
      return {
        success: true,
        orderId,
        orderStatus: 'PAID',
        txHash,
        message: 'Order is already marked as PAID.',
      };
    }

    // Check if order has expired
    if (order.paymentStatus === 'EXPIRED') {
      return {
        success: false,
        orderId,
        orderStatus: 'EXPIRED',
        txHash,
        message: 'Order payment request has expired.',
        error: 'ORDER_EXPIRED',
      };
    }

    // Prevent duplicate transaction processing: Check if txHash has already been registered
    const existingTx = await db.getTransactionByHash(txHash);
    if (existingTx) {
      if (existingTx.orderId === order.id && existingTx.verificationStatus === 'VERIFIED') {
        await db.updateOrderStatus(order.id, 'PAID');
        return {
          success: true,
          orderId,
          orderStatus: 'PAID',
          txHash,
          message: 'Transaction already processed and verified for this order.',
          transaction: existingTx,
        };
      } else {
        return {
          success: false,
          orderId,
          orderStatus: order.paymentStatus,
          txHash,
          message: 'Duplicate transaction detected. This transaction hash was already claimed by another record.',
          error: 'DUPLICATE_TRANSACTION',
        };
      }
    }

    // Retrieve merchant to get the expected recipient address
    const merchant = await db.getMerchantById(order.merchantId);
    if (!merchant) {
      return {
        success: false,
        orderId,
        orderStatus: order.paymentStatus,
        txHash,
        message: 'Associated merchant record not found.',
        error: 'MERCHANT_NOT_FOUND',
      };
    }

    let verification;

    if (simulatedMode) {
      // In simulated testing mode (for demo without real gas faucet delay)
      verification = {
        verified: true,
        txHash,
        senderAddress: '0xSimulatedCustomerWallet00000000000000001',
        recipientAddress: merchant.walletAddress,
        amount: order.usdcAmount,
        blockNumber: 19854210,
        tokenContract: CHAIN_CONFIG.usdcContractAddress,
      };
    } else {
      // Verify against Base Sepolia RPC
      verification = await BlockchainPaymentVerifier.verifyPayment(
        txHash as `0x${string}`,
        merchant.walletAddress,
        order.usdcAmount
      );
    }

    if (!verification.verified) {
      // Mark as failed in order if fatal or keep pending for retry
      return {
        success: false,
        orderId,
        orderStatus: order.paymentStatus,
        txHash,
        message: verification.error || 'Blockchain verification failed.',
        error: 'VERIFICATION_FAILED',
      };
    }

    // Verification succeeded: record the transaction in the database
    const newTx: Transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      orderId: order.id,
      merchantId: merchant.id,
      txHash: verification.txHash,
      tokenContract: verification.tokenContract || CHAIN_CONFIG.usdcContractAddress,
      senderAddress: verification.senderAddress || 'unknown',
      recipientAddress: verification.recipientAddress || merchant.walletAddress,
      amount: verification.amount || order.usdcAmount,
      verificationStatus: 'VERIFIED',
      type: 'CUSTOMER_PAYMENT',
      blockNumber: verification.blockNumber || null,
      timestamp: new Date().toISOString(),
    };

    await db.createTransaction(newTx);

    // Update order status to PAID
    const updatedOrder = await db.updateOrderStatus(order.id, 'PAID');

    return {
      success: true,
      orderId: order.id,
      orderStatus: updatedOrder?.paymentStatus || 'PAID',
      txHash: newTx.txHash,
      message: 'Payment successfully verified on Base Sepolia and reconciled with order.',
      transaction: newTx,
    };
  }
}
