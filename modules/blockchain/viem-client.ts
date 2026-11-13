import { createPublicClient, createWalletClient, fallback, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { CHAIN_CONFIG } from './config';
import { ENV } from '@/lib/env';

// Public RPC Client for reading Base Sepolia blockchain data
export const publicClient = createPublicClient({
  chain: CHAIN_CONFIG.chain,
  transport: fallback([
    http(CHAIN_CONFIG.rpcUrl),
    http(ENV.BASE_SEPOLIA_RPC_FALLBACK_URL),
  ]),
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
      transport: fallback([
        http(CHAIN_CONFIG.rpcUrl),
        http(ENV.BASE_SEPOLIA_RPC_FALLBACK_URL),
      ]),
    });
    return { client, account };
  } catch (err) {
    console.error('Failed to create treasury wallet client:', err);
    return null;
  }
}
