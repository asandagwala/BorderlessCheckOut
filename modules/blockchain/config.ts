import { baseSepolia } from 'viem/chains';
import { parseAbi } from 'viem';
import { ENV } from '@/lib/env';

export const CHAIN_CONFIG = {
  chain: baseSepolia,
  chainId: ENV.BASE_SEPOLIA_CHAIN_ID,
  rpcUrl: ENV.BASE_SEPOLIA_RPC_URL,
  usdcContractAddress: ENV.USDC_CONTRACT_ADDRESS,
  usdcDecimals: 6,
  explorerUrl: ENV.BLOCK_EXPLORER_URL,
};

export const ERC20_ABI = parseAbi([
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
  'function totalSupply() view returns (uint256)',
  'function balanceOf(address owner) view returns (uint256)',
  'function transfer(address to, uint256 value) returns (bool)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 value) returns (bool)',
  'event Transfer(address indexed from, address indexed to, uint256 value)',
  'event Approval(address indexed owner, address indexed spender, uint256 value)'
]);
