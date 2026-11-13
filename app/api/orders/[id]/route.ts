import { NextResponse } from 'next/server';
import { db } from '@/lib/database/db';
import { CHAIN_CONFIG } from '@/modules/blockchain/config';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const order = await db.getOrderById(id);

  if (!order) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }

  const merchant = await db.getMerchantById(order.merchantId);

  return NextResponse.json({
    order,
    merchant: merchant
      ? {
          businessName: merchant.businessName,
          walletAddress: merchant.walletAddress,
          email: merchant.email,
        }
      : null,
    blockchainConfig: {
      chainId: CHAIN_CONFIG.chainId,
      chainName: CHAIN_CONFIG.chain.name,
      usdcContract: CHAIN_CONFIG.usdcContractAddress,
      explorerUrl: CHAIN_CONFIG.explorerUrl,
    },
  });
}
