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
    expectedUsdcAmount: number
  ): Promise<VerificationResult> {
    try {
      if (!txHash || !txHash.startsWith('0x') || txHash.length !== 66) {
        return {
          verified: false,
          txHash,
          error: 'Invalid transaction hash format. Must be a 32-byte hex string (0x...).',
        };
      }

      // Query on-chain receipt from Base Sepolia
      let receipt;
      try {
        receipt = await publicClient.getTransactionReceipt({ hash: txHash });
      } catch (err: any) {
        // If the transaction is very recent, it might not be indexed yet, or might be simulated
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
      let transferFound = false;
      let sender = '';
      let recipient = '';
      let amountUnits = BigInt(0);

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
              sender = decoded.args.from;
              recipient = decoded.args.to;
              amountUnits = decoded.args.value;
              transferFound = true;
              break;
            }
          } catch {
            // Not a transfer event on this log, continue
          }
        }
      }

      if (!transferFound) {
        return {
          verified: false,
          txHash,
          error: `No USDC Transfer event found from contract ${CHAIN_CONFIG.usdcContractAddress}.`,
        };
      }

      // Validate recipient address
      if (recipient.toLowerCase() !== expectedRecipient.toLowerCase()) {
        return {
          verified: false,
          txHash,
          senderAddress: sender,
          recipientAddress: recipient,
          error: `Recipient mismatch. Expected ${expectedRecipient}, but USDC was sent to ${recipient}.`,
        };
      }

      // Validate amount (USDC has 6 decimals)
      const expectedUnits = parseUnits(expectedUsdcAmount.toString(), CHAIN_CONFIG.usdcDecimals);
      // Strict amount check with 0.1% tolerance for micro-rounding if applicable
      const parsedAmount = Number(formatUnits(amountUnits, CHAIN_CONFIG.usdcDecimals));

      if (amountUnits < expectedUnits) {
        return {
          verified: false,
          txHash,
          senderAddress: sender,
          recipientAddress: recipient,
          amount: parsedAmount,
          error: `Underpayment: expected ${expectedUsdcAmount} USDC, but received ${parsedAmount} USDC.`,
        };
      }

      return {
        verified: true,
        txHash,
        senderAddress: sender,
        recipientAddress: recipient,
        amount: parsedAmount,
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
