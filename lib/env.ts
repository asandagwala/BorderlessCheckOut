import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_BASE_SEPOLIA_RPC: z.string().url().default('https://sepolia.base.org'),
  NEXT_PUBLIC_BASE_CHAIN_ID: z.coerce
    .number()
    .refine(chainId => chainId === 84532, 'must be 84532 for Base Sepolia')
    .default(84532),
  NEXT_PUBLIC_USDC_CONTRACT: z.string().default('0x036CbD53842c5426634e7929541eC2318f3dCF7e'),
  NEXT_PUBLIC_BLOCK_EXPLORER: z.string().url().default('https://sepolia.basescan.org'),
  ANTHROPIC_API_KEY: z.string().optional().default(''),
  CLAUDE_API_KEY: z.string().optional().default(''),
  TREASURY_PRIVATE_KEY: z.string().optional().default(''),
  APP_SESSION_SECRET: z.string().optional().default(''),
  DATABASE_URL: z.string().optional().default(''),
  POSTGRES_URL: z.string().optional().default(''),
  NEXT_PUBLIC_APP_URL: z.string().url().default('http://localhost:3000'),
});

const parsed = envSchema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues
    .map(issue => `${issue.path.join('.') || 'environment'}: ${issue.message}`)
    .join('; ');

  throw new Error(`Invalid environment configuration: ${issues}`);
}

const rawEnv = parsed.data;

if (process.env.NODE_ENV === 'production' && rawEnv.APP_SESSION_SECRET.length < 32) {
  throw new Error('Invalid environment configuration: APP_SESSION_SECRET must be at least 32 characters in production.');
}

export const ENV = {
  BASE_SEPOLIA_CHAIN_ID: rawEnv.NEXT_PUBLIC_BASE_CHAIN_ID,
  BASE_SEPOLIA_RPC_URL: rawEnv.NEXT_PUBLIC_BASE_SEPOLIA_RPC,
  USDC_CONTRACT_ADDRESS: rawEnv.NEXT_PUBLIC_USDC_CONTRACT as `0x${string}`,
  BLOCK_EXPLORER_URL: rawEnv.NEXT_PUBLIC_BLOCK_EXPLORER,
  CLAUDE_API_KEY: rawEnv.ANTHROPIC_API_KEY || rawEnv.CLAUDE_API_KEY || '',
  TREASURY_PRIVATE_KEY: rawEnv.TREASURY_PRIVATE_KEY as `0x${string}`,
  APP_SESSION_SECRET: rawEnv.APP_SESSION_SECRET,
  DATABASE_URL: rawEnv.DATABASE_URL || rawEnv.POSTGRES_URL || '',
  APP_URL: rawEnv.NEXT_PUBLIC_APP_URL,
  INDICATIVE_USD_TO_ZAR_RATE: 18.50, // Clearly labeled indicative rate
};
