import Anthropic from '@anthropic-ai/sdk';
import { z } from 'zod';
import { db } from '@/lib/database/db';
import { TreasuryService } from '@/modules/treasury/treasury.service';
import { ENV } from '@/lib/env';

// Tool input schemas validated by Zod
export const recentTransactionsToolSchema = z.object({
  limit: z.number().int().min(1).max(50).default(5).optional(),
});

// System prompt enforcing security boundaries and read-only constraints
const CHATBOT_SYSTEM_PROMPT = `
You are the Borderless Checkout Merchant AI Assistant.
Your job is to assist African SME merchants with accurate financial insights, order statuses, and payment summaries using their actual verified on-chain and store data.

STRICT CONSTRAINTS:
1. You have read-only access to store information via your tools.
2. You CANNOT execute, initiate, or authorize financial transactions.
3. NEVER fabricate or hallucinate transaction hashes, order amounts, or dates.
4. Always clearly specify amounts in USDC and indicate the estimated Rand (ZAR) equivalent when helpful (using the indicative rate of ~18.50 ZAR/USDC). Clearly state that ZAR conversions are indicative and not guaranteed.
5. Answer questions concisely, professionally, and accurately.
`;

export class ChatbotService {
  /**
   * Dispatches read-only tools to retrieve real merchant data.
   */
  static async executeTool(merchantId: string, toolName: string, toolInput: any): Promise<any> {
    switch (toolName) {
      case 'get_merchant_balance': {
        const balance = await TreasuryService.getTreasuryBalance(merchantId);
        return {
          totalReceivedUsdc: balance.totalReceivedUsdc,
          totalDisbursedUsdc: balance.totalDisbursedUsdc,
          currentBalanceUsdc: balance.currentBalanceUsdc,
          indicativeZarValue: balance.indicativeZarValue,
          currency: 'USDC',
          indicativeCurrency: 'ZAR',
          indicativeRate: ENV.INDICATIVE_USD_TO_ZAR_RATE,
        };
      }

      case 'get_unpaid_orders': {
        const orders = await db.getOrdersByMerchantId(merchantId);
        const unpaid = orders.filter(o => o.paymentStatus === 'PENDING' || o.paymentStatus === 'CONFIRMING');
        return {
          count: unpaid.length,
          orders: unpaid.map(o => ({
            id: o.id,
            customerReference: o.customerReference,
            usdcAmount: o.usdcAmount,
            orderAmountZar: o.orderAmount,
            paymentReference: o.paymentReference,
            status: o.paymentStatus,
            createdAt: o.createdAt,
          })),
        };
      }

      case 'get_recent_transactions': {
        const parsed = recentTransactionsToolSchema.safeParse(toolInput || {});
        const limit = parsed.success ? (parsed.data.limit || 5) : 5;
        const txs = await db.getTransactionsByMerchantId(merchantId);
        const recent = txs.slice(0, limit);
        return {
          count: recent.length,
          transactions: recent.map(t => ({
            id: t.id,
            type: t.type,
            amount: t.amount,
            txHash: t.txHash,
            sender: t.senderAddress,
            recipient: t.recipientAddress,
            status: t.verificationStatus,
            timestamp: t.timestamp,
            explorerUrl: `${ENV.BLOCK_EXPLORER_URL}/tx/${t.txHash}`,
          })),
        };
      }

      case 'get_today_received_volume': {
        const txs = await db.getTransactionsByMerchantId(merchantId);
        const todayStr = new Date().toISOString().split('T')[0];
        const todaysTxs = txs.filter(t => 
          t.verificationStatus === 'VERIFIED' && 
          t.type === 'CUSTOMER_PAYMENT' &&
          t.timestamp.startsWith(todayStr)
        );
        const total = todaysTxs.reduce((acc, curr) => acc + curr.amount, 0);
        return {
          date: todayStr,
          transactionCount: todaysTxs.length,
          totalReceivedUsdc: total,
          indicativeZar: total * ENV.INDICATIVE_USD_TO_ZAR_RATE,
        };
      }

      case 'get_weekly_summary': {
        const orders = await db.getOrdersByMerchantId(merchantId);
        const txs = await db.getTransactionsByMerchantId(merchantId);
        const oneWeekAgo = Date.now() - 7 * 86400000;
        
        const recentPaidTxs = txs.filter(t => 
          t.verificationStatus === 'VERIFIED' && 
          t.type === 'CUSTOMER_PAYMENT' &&
          new Date(t.timestamp).getTime() >= oneWeekAgo
        );

        const totalUsdc = recentPaidTxs.reduce((sum, t) => sum + t.amount, 0);
        const paidOrders = orders.filter(o => o.paymentStatus === 'PAID' && new Date(o.createdAt).getTime() >= oneWeekAgo);
        const pendingOrders = orders.filter(o => o.paymentStatus === 'PENDING' && new Date(o.createdAt).getTime() >= oneWeekAgo);

        return {
          period: 'Past 7 days',
          totalVolumeUsdc: totalUsdc,
          indicativeZar: totalUsdc * ENV.INDICATIVE_USD_TO_ZAR_RATE,
          paidOrdersCount: paidOrders.length,
          pendingOrdersCount: pendingOrders.length,
          totalTransactions: recentPaidTxs.length,
        };
      }

      default:
        throw new Error(`Unknown tool: ${toolName}`);
    }
  }

  /**
   * Handles user chat messages, invoking Claude API with tool calling or deterministic local fallback.
   */
  static async handleChatMessage(
    merchantId: string,
    userMessage: string,
    history: { role: 'user' | 'assistant'; content: string }[] = []
  ): Promise<{ response: string; toolUsed?: string; toolResult?: any }> {
    const merchant = await db.getMerchantById(merchantId);
    const merchantName = merchant?.businessName || 'Merchant';

    // Tool schemas for Claude
    const tools: Anthropic.Tool[] = [
      {
        name: 'get_merchant_balance',
        description: 'Retrieves the merchant\'s total received USDC, disbursed payouts, and current treasury balance with indicative ZAR value.',
        input_schema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_today_received_volume',
        description: 'Calculates the total USDC payment volume received by the merchant today.',
        input_schema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_unpaid_orders',
        description: 'Retrieves all customer orders that are currently unpaid or pending.',
        input_schema: {
          type: 'object',
          properties: {},
        },
      },
      {
        name: 'get_recent_transactions',
        description: 'Retrieves the most recent customer payment and payout transactions.',
        input_schema: {
          type: 'object',
          properties: {
            limit: { type: 'number', description: 'Number of transactions to return' },
          },
        },
      },
      {
        name: 'get_weekly_summary',
        description: 'Summarises the merchant\'s payment activity and order volume for the past 7 days.',
        input_schema: {
          type: 'object',
          properties: {},
        },
      },
    ];

    if (ENV.CLAUDE_API_KEY) {
      try {
        const client = new Anthropic({ apiKey: ENV.CLAUDE_API_KEY });
        const messages: Anthropic.MessageParam[] = [
          ...history.map(h => ({ role: h.role, content: h.content })),
          { role: 'user', content: userMessage },
        ];

        const response = await client.messages.create({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          system: `${CHATBOT_SYSTEM_PROMPT}\nYou are interacting with merchant: ${merchantName} (ID: ${merchantId}).`,
          tools,
          messages,
        });

        // Check if Claude requested tool use
        const toolUseBlock = response.content.find(block => block.type === 'tool_use');
        if (toolUseBlock && toolUseBlock.type === 'tool_use') {
          const toolResult = await this.executeTool(merchantId, toolUseBlock.name, toolUseBlock.input);

          // Return tool result to Claude to generate natural answer
          const followUp = await client.messages.create({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 1024,
            system: CHATBOT_SYSTEM_PROMPT,
            tools,
            messages: [
              ...messages,
              { role: 'assistant', content: response.content },
              {
                role: 'user',
                content: [
                  {
                    type: 'tool_result',
                    tool_use_id: toolUseBlock.id,
                    content: JSON.stringify(toolResult),
                  },
                ],
              },
            ],
          });

          const finalReply = followUp.content.find(b => b.type === 'text');
          return {
            response: (finalReply && finalReply.type === 'text') ? finalReply.text : 'Data retrieved successfully.',
            toolUsed: toolUseBlock.name,
            toolResult,
          };
        }

        const textReply = response.content.find(b => b.type === 'text');
        return {
          response: (textReply && textReply.type === 'text') ? textReply.text : 'I am here to assist with your store payments and metrics.',
        };
      } catch (err: any) {
        console.warn('Claude API call fallback:', err.message);
      }
    }

    // Deterministic Rule-Based Fallback for Instant Local Testing without API Key
    const query = userMessage.toLowerCase();

    if (query.includes('received today') || query.includes('today')) {
      const data = await this.executeTool(merchantId, 'get_today_received_volume', {});
      return {
        response: `Today you have received **$${data.totalReceivedUsdc.toFixed(2)} USDC** across **${data.transactionCount}** confirmed transactions (indicative value: ~R ${data.indicativeZar.toFixed(2)} ZAR).`,
        toolUsed: 'get_today_received_volume',
        toolResult: data,
      };
    }

    if (query.includes('unpaid') || query.includes('pending order')) {
      const data = await this.executeTool(merchantId, 'get_unpaid_orders', {});
      if (data.count === 0) {
        return {
          response: 'All customer orders are currently paid in full. There are no pending or unpaid orders.',
          toolUsed: 'get_unpaid_orders',
          toolResult: data,
        };
      }
      const list = data.orders.map((o: any) => `• Order #${o.id} (${o.customerReference}): **$${o.usdcAmount.toFixed(2)} USDC** (Status: ${o.status})`).join('\n');
      return {
        response: `You currently have **${data.count} unpaid order(s)**:\n\n${list}\n\nCustomers can settle these via their unique payment links.`,
        toolUsed: 'get_unpaid_orders',
        toolResult: data,
      };
    }

    if (query.includes('recent') || query.includes('transaction')) {
      const data = await this.executeTool(merchantId, 'get_recent_transactions', { limit: 5 });
      const list = data.transactions.map((t: any) => `• **${t.type === 'CUSTOMER_PAYMENT' ? 'Received' : 'Payout'}**: $${t.amount.toFixed(2)} USDC | Tx: \`${t.txHash.slice(0, 10)}...${t.txHash.slice(-6)}\` | ${new Date(t.timestamp).toLocaleTimeString()}`).join('\n');
      return {
        response: `Here are your recent Base Sepolia transactions:\n\n${list}\n\nAll verified on-chain via USDC contract.`,
        toolUsed: 'get_recent_transactions',
        toolResult: data,
      };
    }

    if (query.includes('balance') || query.includes('current balance') || query.includes('how much do i have')) {
      const data = await this.executeTool(merchantId, 'get_merchant_balance', {});
      return {
        response: `Your current available balance is **$${data.currentBalanceUsdc.toFixed(2)} USDC**.\n\n• Total Received: $${data.totalReceivedUsdc.toFixed(2)} USDC\n• Total Supplier Disbursements: $${data.totalDisbursedUsdc.toFixed(2)} USDC\n• Indicative Rand Equivalent: **~R ${data.indicativeZarValue.toFixed(2)} ZAR** *(indicative conversion rate: R 18.50 per USDC)*.`,
        toolUsed: 'get_merchant_balance',
        toolResult: data,
      };
    }

    if (query.includes('week') || query.includes('summary')) {
      const data = await this.executeTool(merchantId, 'get_weekly_summary', {});
      return {
        response: `**Weekly Payment Summary (Past 7 Days):**\n\n• Total Volume Received: **$${data.totalVolumeUsdc.toFixed(2)} USDC** (~R ${data.indicativeZar.toFixed(2)} ZAR)\n• Settled Orders: **${data.paidOrdersCount}**\n• Pending Orders: **${data.pendingOrdersCount}**\n• Verified Blockchain Transactions: **${data.totalTransactions}**`,
        toolUsed: 'get_weekly_summary',
        toolResult: data,
      };
    }

    return {
      response: `Hello! I am your AI Merchant Assistant for **${merchantName}**. You can ask me:\n\n- "How much have I received today?"\n- "Which orders are still unpaid?"\n- "Show me my recent transactions."\n- "What is my current USDC balance?"\n- "Summarise my payment activity this week."`,
    };
  }
}
