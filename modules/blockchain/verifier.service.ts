import { publicClient } from './viem-client';
import { CHAIN_CONFIG, ERC20_ABI } from './config';
import { decodeEventLog, formatUnits, parseUnits } from 'viem';

export interface VerificationResult {
  verified: boolean;
  error?: string;
  txHash: string;
  senderAddress?: string;
  recipientAddress?: string;
  amount?: number;
  blockNumber?: number;
  tokenContract?: string;
}

type ReceiptClient = Pick<typeof publicClient, 'waitForTransactionReceipt'>;

export class BlockchainPaymentVerifier {
  /**
   * Verifies an on-chain USDC transfer on Base Sepolia testnet.
   * Ensures that:
   * 1. Transaction exists and was confirmed on Base Sepolia.
   * 2. Transaction status is 'success'.
   * 3. An ERC-20 Transfer event occurred on the official USDC testnet contract.
   * 4. The transfer recipient matches the expected merchant wallet address.
   * 5. The transferred amount matches the expected order amount.
   */
  static async verifyPayment(
    txHash: `0x${string}`,
    expectedRecipient: string,
    expectedUsdcAmount: number,
    receiptClient: ReceiptClient = publicClient
  ): Promise<VerificationResult> {
    try {
      if (!txHash || !txHash.startsWith('0x') || txHash.length !== 66) {
        return {
          verified: false,
          txHash,
          error: 'Invalid transaction hash format. Must be a 32-byte hex string (0x...).',
        };
      }

      // Wait for a mined Base Sepolia receipt rather than trusting a wallet submission hash.
      let receipt;
      try {
        receipt = await receiptClient.waitForTransactionReceipt({
          hash: txHash,
          confirmations: 1,
          timeout: 60_000,
        });
      } catch (err: any) {
        return {
          verified: false,
          txHash,
          error: `Transaction receipt not found on Base Sepolia: ${err.message || 'Pending confirmation'}`,
        };
      }

      if (!receipt) {
        return {
          verified: false,
          txHash,
          error: 'Transaction receipt is pending or not yet mined.',
        };
      }

      if (receipt.status !== 'success') {
        return {
          verified: false,
          txHash,
          error: `Transaction execution failed on-chain with status: ${receipt.status}`,
        };
      }

      // Check logs for official USDC contract Transfer event
      const usdcAddressLower = CHAIN_CONFIG.usdcContractAddress.toLowerCase();
      const expectedUnits = parseUnits(expectedUsdcAmount.toString(), CHAIN_CONFIG.usdcDecimals);
      let matchingTransfer: { sender: string; recipient: string; amountUnits: bigint } | null = null;

      for (const log of receipt.logs) {
        if (log.address.toLowerCase() === usdcAddressLower) {
          try {
            const decoded = decodeEventLog({
              abi: ERC20_ABI,
              eventName: 'Transfer',
              data: log.data,
              topics: log.topics,
            });

            if (decoded.eventName === 'Transfer') {
              const sender = decoded.args.from;
              const recipient = decoded.args.to;
              const amountUnits = decoded.args.value;
              if (
                recipient.toLowerCase() === expectedRecipient.toLowerCase() &&
                amountUnits === expectedUnits
              ) {
                matchingTransfer = { sender, recipient, amountUnits };
                break;
              }
            }
          } catch {
            // Not a transfer event on this log, continue
          }
        }
      }

      if (!matchingTransfer) {
        return {
          verified: false,
          txHash,
          error: `No exact USDC transfer of ${expectedUsdcAmount} to ${expectedRecipient} found on Base Sepolia.`,
        };
      }

      return {
        verified: true,
        txHash,
        senderAddress: matchingTransfer.sender,
        recipientAddress: matchingTransfer.recipient,
        amount: Number(formatUnits(matchingTransfer.amountUnits, CHAIN_CONFIG.usdcDecimals)),
        blockNumber: Number(receipt.blockNumber),
        tokenContract: CHAIN_CONFIG.usdcContractAddress,
      };
    } catch (error: any) {
      return {
        verified: false,
        txHash,
        error: `Blockchain verification failed: ${error.message || 'Unknown RPC error'}`,
      };
    }
  }
}
