export const ENV = {
  BASE_SEPOLIA_CHAIN_ID: 84532,
  BASE_SEPOLIA_RPC_URL: process.env.NEXT_PUBLIC_BASE_SEPOLIA_RPC || 'https://sepolia.base.org',
  USDC_CONTRACT_ADDRESS: (process.env.NEXT_PUBLIC_USDC_CONTRACT || '0x036CbD53842c5426634e7929541eC2318f3dCF7e') as `0x${string}`,
  BLOCK_EXPLORER_URL: process.env.NEXT_PUBLIC_BLOCK_EXPLORER || 'https://sepolia.basescan.org',
  CLAUDE_API_KEY: process.env.ANTHROPIC_API_KEY || process.env.CLAUDE_API_KEY || '',
  TREASURY_PRIVATE_KEY: (process.env.TREASURY_PRIVATE_KEY || '') as `0x${string}`,
  DATABASE_URL: process.env.DATABASE_URL || process.env.POSTGRES_URL || '',
  APP_URL: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  INDICATIVE_USD_TO_ZAR_RATE: 18.50, // Clearly labeled indicative rate
};
