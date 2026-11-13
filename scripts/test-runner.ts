import { db } from '../lib/database/db';
import { BlockchainPaymentVerifier } from '../modules/blockchain/verifier.service';
import { ReconciliationService } from '../modules/reconciliation/reconciliation.service';
import { PolicyEngine } from '../modules/treasury/policy-engine.service';
import { TreasuryService } from '../modules/treasury/treasury.service';
import { ChatbotService } from '../modules/ai-chatbot/chatbot.service';
import { TreasuryAgentService } from '../modules/ai-treasury-agent/treasury-agent.service';
import { CHAIN_CONFIG } from '../modules/blockchain/config';
import { getUsdcAmountMismatch } from '../modules/blockchain/verifier.service';

async function runTests() {
  if (CHAIN_CONFIG.chain.id !== 84532 || CHAIN_CONFIG.chainId !== CHAIN_CONFIG.chain.id) {
    throw new Error('Blockchain client and configured chain ID must both use Base Sepolia (84532)');
  }
  console.log('✓ Blockchain client and configured chain ID both use Base Sepolia (84532)');

  const expectedUsdcUnits = BigInt('1250000');
  if (getUsdcAmountMismatch(BigInt('1249999'), expectedUsdcUnits) !== 'UNDERPAYMENT') {
    throw new Error('USDC verifier must reject underpayments');
  }
  if (getUsdcAmountMismatch(expectedUsdcUnits, expectedUsdcUnits) !== null) {
    throw new Error('USDC verifier must accept an exact payment');
  }
  if (getUsdcAmountMismatch(BigInt('1250001'), expectedUsdcUnits) !== 'OVERPAYMENT') {
    throw new Error('USDC verifier must reject overpayments');
  }
  console.log('✓ USDC verifier requires exact amounts and rejects underpayments and overpayments');

  console.log('====================================================');
  console.log('🚀 Running Borderless Checkout Integration Test Suite');
  console.log('====================================================\n');

  // Test 1: Database Seed and Merchant Query
  console.log('Test 1: Merchant and Database Layer...');
  const merchant = await db.getMerchantById('merch_kigali_01');
  if (!merchant || merchant.businessName !== 'Kigali Fresh Market Ltd') {
    throw new Error('Merchant lookup failed');
  }
  console.log('  ✓ Merchant retrieved:', merchant.businessName, `(${merchant.id})`);

  // Test 2: Customer Checkout & Reconciliation Service
  console.log('\nTest 2: Automatic Payment Reconciliation...');
  const order = await db.getOrderById('ord_live_checkout_01');
  if (!order) throw new Error('Order lookup failed');
  console.log('  Initial order status:', order.paymentStatus);

  const testTxHash = '0x' + 'a1b2c3d4e5f6'.repeat(5) + '1234';
  const reconResult = await ReconciliationService.reconcileOrderPayment(
    order.id,
    testTxHash,
    true // simulated mode
  );
  console.log('  Reconciliation outcome:', reconResult.orderStatus, '-', reconResult.message);
  if (reconResult.orderStatus !== 'PAID') throw new Error('Order reconciliation failed');
  console.log('  ✓ Order successfully transitioned to PAID and tx recorded.');

  // Test 2b: Duplicate Transaction Prevention
  console.log('\nTest 2b: Duplicate Transaction Prevention...');
  const dupResult = await ReconciliationService.reconcileOrderPayment(
    'ord_sample_expired_04',
    testTxHash, // same txHash!
    true
  );
  if (dupResult.success) throw new Error('Duplicate tx should have been rejected');
  console.log('  ✓ Duplicate transaction prevented:', dupResult.message);

  // Test 3: AI Merchant Chatbot Tools
  console.log('\nTest 3: AI Merchant Chatbot Tool Calling...');
  const balanceReply = await ChatbotService.handleChatMessage('merch_kigali_01', 'What is my current USDC balance?');
  console.log('  ✓ Balance Query Response:', balanceReply.response.slice(0, 100) + '...');

  const unpaidReply = await ChatbotService.handleChatMessage('merch_kigali_01', 'Which orders are still unpaid?');
  console.log('  ✓ Unpaid Orders Query Tool:', unpaidReply.toolUsed);

  // Test 4: AI Treasury Agent - Scenario 1 (Approved $100 Payment)
  console.log('\nTest 4: AI Treasury Agent - Scenario 1 ($100 Approved Payment)...');
  const scenario1 = await TreasuryAgentService.runScenario1Approved('merch_kigali_01');
  console.log('  Decision:', scenario1.decision);
  console.log('  Executed on chain:', scenario1.executedOnChain);
  console.log('  Tx Hash:', scenario1.txHash);
  if (scenario1.decision !== 'APPROVED' || !scenario1.executedOnChain) {
    throw new Error('Scenario 1 should have been APPROVED and executed');
  }
  console.log('  ✓ Scenario 1 passed! Steps traced:', scenario1.traces.length);

  // Test 5: AI Treasury Agent - Scenario 2 (Rejected $700 Payment Exceeding $500 Cap)
  console.log('\nTest 5: AI Treasury Agent - Scenario 2 ($700 Rejected Payment)...');
  const scenario2 = await TreasuryAgentService.runScenario2Rejected('merch_kigali_01');
  console.log('  Decision:', scenario2.decision);
  console.log('  Executed on chain:', scenario2.executedOnChain);
  console.log('  Reason:', scenario2.reason);
  if (scenario2.decision !== 'REJECTED' || scenario2.executedOnChain) {
    throw new Error('Scenario 2 should have been REJECTED by policy engine');
  }
  console.log('  ✓ Scenario 2 passed! Blocked from blockchain. Steps traced:', scenario2.traces.length);

  // Test 6: Audit Log Integrity
  console.log('\nTest 6: Audit Log Verification...');
  const logs = await db.getAuditLogsByMerchantId('merch_kigali_01');
  console.log(`  ✓ Retrieved ${logs.length} audit log entries.`);
  const latestLog = logs[0];
  console.log(`  Latest log: [${latestLog.agentAction}] Decision: ${latestLog.policyDecision} - Status: ${latestLog.executionStatus}`);

  // Test 7: Zod & Drizzle-Zod Schema Validations
  console.log('\nTest 7: Zod & Drizzle-Zod Validation Layer...');
  const { 
    createMerchantInputSchema, 
    createOrderInputSchema, 
    verifyPaymentInputSchema,
    treasuryAgentActionSchema 
  } = await import('../lib/validations');
  const { insertMerchantSchema, insertOrderSchema } = await import('../lib/database/drizzle/schema');

  // Validate valid merchant input
  const validMerchant = createMerchantInputSchema.safeParse({
    businessName: 'Nairobi Fresh Foods',
    email: 'admin@nairobihub.ke',
    walletAddress: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
  });
  if (!validMerchant.success) throw new Error('Zod valid merchant should have passed');
  console.log('  ✓ Zod validated valid merchant creation payload');

  // Validate invalid wallet rejection
  const invalidMerchant = createMerchantInputSchema.safeParse({
    businessName: 'Invalid Co',
    email: 'bad-email',
    walletAddress: '0xNotAValidHexAddress',
  });
  if (invalidMerchant.success) throw new Error('Zod should reject invalid wallet and email');
  console.log('  ✓ Zod correctly rejected invalid email and malformed EVM address');

  // Validate Drizzle-Zod auto-generated schemas
  const drizzleOrderCheck = insertOrderSchema.safeParse({
    id: 'ord_test_zod',
    merchantId: 'merch_kigali_01',
    customerReference: 'CUST-ZOD-99',
    orderAmount: '500.00',
    currency: 'ZAR',
    usdcAmount: '27.027000',
    paymentReference: 'BC-ZOD-99',
  });
  if (!drizzleOrderCheck.success) throw new Error('Drizzle-Zod order validation failed');
  console.log('  ✓ Drizzle-Zod generated schema verified insertOrderSchema successfully');

  console.log('\n====================================================');
  console.log('✅ ALL INTEGRATION TESTS PASSED CLEANLY (INCL. ZOD)!');
  console.log('====================================================\n');
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
