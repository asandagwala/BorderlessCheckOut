import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_BASE_SEPOLIA_RPC: z.string().url().default('https://sepolia.base.org'),
  NEXT_PUBLIC_BASE_SEPOLIA_RPC_FALLBACK: z.string().url().default('https://base-sepolia-rpc.publicnode.com'),
  NEXT_PUBLIC_BASE_CHAIN_ID: z.coerce.number().default(84532),
  NEXT_PUBLIC_USDC_CONTRACT: z.string().default('0x036CbD53842c5426634e7929541eC2318f3dCF7e'),
  NEXT_PUBLIC_BLOCK_EXPLORER: z.string().url().default('https://sepolia.basescan.org'),
  MERCHANT_WALLET_ADDRESS: z.string().regex(/^0x[a-fA-F0-9]{40}$/).default('0xA8f73eb996C58688240474D442C1D467f7171D58'),
  ANTHROPIC_API_KEY: z.string().optional().default(''),
  CLAUDE_API_KEY: z.string().optional().default(''),
  GEMINI_API_KEY: z.string().optional().default(''),
  GEMINI_MODEL: z.string().min(1).default('gemini-3.6-flash'),
  TREASURY_PRIVATE_KEY: z.string().optional().default(''),
  TREASURY_EXECUTION_ENABLED: z.enum(['true', 'false']).optional().default('false'),
  TREASURY_EXECUTION_API_KEY: z.string().optional().default(''),
  DATABASE_URL: z.string().optional().default(''),
  POSTGRES_URL: z.string().optional().default(''),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);
const rawEnv = parsed.success ? parsed.data : envSchema.parse({});

export const ENV = {
  BASE_SEPOLIA_CHAIN_ID: rawEnv.NEXT_PUBLIC_BASE_CHAIN_ID,
  BASE_SEPOLIA_RPC_URL: rawEnv.NEXT_PUBLIC_BASE_SEPOLIA_RPC,
  BASE_SEPOLIA_RPC_FALLBACK_URL: rawEnv.NEXT_PUBLIC_BASE_SEPOLIA_RPC_FALLBACK,
  USDC_CONTRACT_ADDRESS: rawEnv.NEXT_PUBLIC_USDC_CONTRACT as `0x${string}`,
  BLOCK_EXPLORER_URL: rawEnv.NEXT_PUBLIC_BLOCK_EXPLORER,
  MERCHANT_WALLET_ADDRESS: rawEnv.MERCHANT_WALLET_ADDRESS,
  CLAUDE_API_KEY: rawEnv.ANTHROPIC_API_KEY || rawEnv.CLAUDE_API_KEY || '',
  GEMINI_API_KEY: rawEnv.GEMINI_API_KEY,
  GEMINI_MODEL: rawEnv.GEMINI_MODEL,
  TREASURY_PRIVATE_KEY: rawEnv.TREASURY_PRIVATE_KEY as `0x${string}`,
  TREASURY_EXECUTION_ENABLED: rawEnv.TREASURY_EXECUTION_ENABLED === 'true',
  TREASURY_EXECUTION_API_KEY: rawEnv.TREASURY_EXECUTION_API_KEY,
  DATABASE_URL: rawEnv.DATABASE_URL || rawEnv.POSTGRES_URL || '',
  APP_URL: rawEnv.NEXT_PUBLIC_APP_URL,
  INDICATIVE_USD_TO_ZAR_RATE: 18.50, // Clearly labeled indicative rate
};
