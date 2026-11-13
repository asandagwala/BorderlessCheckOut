import { createPublicClient, createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { CHAIN_CONFIG } from './config';
import { ENV } from '@/lib/env';

// Public RPC Client for reading Base Sepolia blockchain data
export const publicClient = createPublicClient({
  chain: CHAIN_CONFIG.chain,
  transport: http(CHAIN_CONFIG.rpcUrl),
});

// Optional backend wallet signer for autonomous treasury payments
export function getTreasuryWalletClient() {
  if (!ENV.TREASURY_PRIVATE_KEY || !ENV.TREASURY_PRIVATE_KEY.startsWith('0x') || ENV.TREASURY_PRIVATE_KEY.length !== 66) {
    return null;
  }
  try {
    const account = privateKeyToAccount(ENV.TREASURY_PRIVATE_KEY);
    const client = createWalletClient({
      account,
      chain: CHAIN_CONFIG.chain,
      transport: http(CHAIN_CONFIG.rpcUrl),
    });
    return { client, account };
  } catch (err) {
    console.error('Failed to create treasury wallet client:', err);
    return null;
  }
}
