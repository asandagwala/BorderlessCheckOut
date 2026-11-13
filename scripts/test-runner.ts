import { db } from '../lib/database/db';
import { ReconciliationService } from '../modules/reconciliation/reconciliation.service';
import { PolicyEngine } from '../modules/treasury/policy-engine.service';
import { TreasuryService } from '../modules/treasury/treasury.service';
import { ChatbotService } from '../modules/ai-chatbot/chatbot.service';
import { encodeAbiParameters, encodeEventTopics, parseUnits } from 'viem';
import { CHAIN_CONFIG, ERC20_ABI } from '../modules/blockchain/config';
import { BlockchainPaymentVerifier, getUsdcAmountMismatch } from '../modules/blockchain/verifier.service';
import { getTreasuryWalletClient, publicClient } from '../modules/blockchain/viem-client';

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

  const testTxHash = ('0x' + 'a1b2c3d4e5f6'.repeat(5) + '1234') as `0x${string}`;
  const testSender = '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65' as const;
  const expectedUnits = parseUnits(order.usdcAmount.toFixed(2), CHAIN_CONFIG.usdcDecimals);
  const exactTransferTopics = encodeEventTopics({
    abi: ERC20_ABI,
    eventName: 'Transfer',
    args: { from: testSender, to: merchant.walletAddress.toLowerCase() as `0x${string}` },
  });
  const mockReceipt = {
    status: 'success' as const,
    blockNumber: BigInt(19854210),
    logs: [{
      address: CHAIN_CONFIG.usdcContractAddress,
      topics: exactTransferTopics,
      data: encodeAbiParameters([{ type: 'uint256' }], [expectedUnits]),
    }],
  };
  const mockReceiptClient = {
    getTransactionReceipt: async () => mockReceipt,
  } as unknown as Pick<typeof publicClient, 'getTransactionReceipt'>;
  const verifyMockedBaseReceipt = (
    hash: `0x${string}`,
    recipient: string,
    amount: number
  ) => BlockchainPaymentVerifier.verifyPayment(hash, recipient, amount, mockReceiptClient);

  const exactReceiptResult = await verifyMockedBaseReceipt(testTxHash, merchant.walletAddress, order.usdcAmount);
  if (!exactReceiptResult.verified || exactReceiptResult.amount !== order.usdcAmount) {
    throw new Error(`A successful exact USDC receipt should verify: ${exactReceiptResult.error || 'amount mismatch'}`);
  }
  const wrongRecipientResult = await verifyMockedBaseReceipt(
    testTxHash,
    '0x2546BcD3c84621e976D8185a91A922aE77ECEc30',
    order.usdcAmount
  );
  if (wrongRecipientResult.verified) throw new Error('A transfer to another wallet must not verify');
  const wrongTokenReceiptClient = {
    getTransactionReceipt: async () => ({
      ...mockReceipt,
      logs: [{ ...mockReceipt.logs[0], address: '0x0000000000000000000000000000000000000001' }],
    }),
  } as unknown as Pick<typeof publicClient, 'getTransactionReceipt'>;
  const wrongTokenResult = await BlockchainPaymentVerifier.verifyPayment(
    testTxHash,
    merchant.walletAddress,
    order.usdcAmount,
    wrongTokenReceiptClient
  );
  if (wrongTokenResult.verified) throw new Error('A transfer from a different token contract must not verify');

  const revertedReceiptClient = {
    getTransactionReceipt: async () => ({ ...mockReceipt, status: 'reverted' as const }),
  } as unknown as Pick<typeof publicClient, 'getTransactionReceipt'>;
  const revertedResult = await BlockchainPaymentVerifier.verifyPayment(
    testTxHash,
    merchant.walletAddress,
    order.usdcAmount,
    revertedReceiptClient
  );
  if (revertedResult.verified) throw new Error('A reverted blockchain transaction must not verify');

  const overpaymentReceipt = {
    ...mockReceipt,
    logs: [{
      ...mockReceipt.logs[0],
      data: encodeAbiParameters([{ type: 'uint256' }], [expectedUnits + BigInt(1)]),
    }],
  };
  const overpaymentReceiptClient = {
    getTransactionReceipt: async () => overpaymentReceipt,
  } as unknown as Pick<typeof publicClient, 'getTransactionReceipt'>;
  const overpaymentReceiptResult = await BlockchainPaymentVerifier.verifyPayment(
    testTxHash,
    merchant.walletAddress,
    order.usdcAmount,
    overpaymentReceiptClient
  );
  if (overpaymentReceiptResult.verified || !overpaymentReceiptResult.error?.startsWith('Overpayment')) {
    throw new Error('The receipt verifier must reject on-chain overpayments');
  }
  console.log('  ✓ Receipt decoder verifies the USDC contract, merchant recipient, and exact amount.');

  const verifyPaymentWithMockReceipt = (
    hash: `0x${string}`,
    recipient: string,
    amount: number
  ) => BlockchainPaymentVerifier.verifyPayment(hash, recipient, amount, mockReceiptClient);
  const reconResult = await ReconciliationService.reconcileOrderPayment(
    order.id,
    testTxHash,
    verifyPaymentWithMockReceipt
  );
  console.log('  Reconciliation outcome:', reconResult.orderStatus, '-', reconResult.message);
  if (reconResult.orderStatus !== 'PAID') throw new Error('Order reconciliation failed');
  console.log('  ✓ Order successfully transitioned to PAID and tx recorded.');

  // Test 2b: Duplicate Transaction Prevention
  console.log('\nTest 2b: Duplicate Transaction Prevention...');
  const duplicateOrder = await db.createOrder({
    ...order,
    id: 'ord_test_duplicate_payment',
    customerReference: 'CUST-DUPLICATE-TEST',
    paymentReference: 'BC-DUPLICATE-TEST',
    paymentStatus: 'PENDING',
    createdAt: new Date().toISOString(),
  });
  const dupResult = await ReconciliationService.reconcileOrderPayment(
    duplicateOrder.id,
    testTxHash,
    verifyPaymentWithMockReceipt
  );
  if (dupResult.success || dupResult.error !== 'DUPLICATE_TRANSACTION') {
    throw new Error('A verified transaction hash must not be reused for another order');
  }
  console.log('  ✓ Duplicate verified transaction blocked from a second pending order.');

  // Test 3: AI Merchant Chatbot Tools
  console.log('\nTest 3: AI Merchant Chatbot Tool Calling...');
  const balanceReply = await ChatbotService.handleChatMessage('merch_kigali_01', 'What is my current USDC balance?');
  console.log('  ✓ Balance Query Response:', balanceReply.response.slice(0, 100) + '...');

  const unpaidReply = await ChatbotService.handleChatMessage('merch_kigali_01', 'Which orders are still unpaid?');
  console.log('  ✓ Unpaid Orders Query Tool:', unpaidReply.toolUsed);

  // Test 4: Independent policy approves an eligible invoice without sending funds.
  console.log('\nTest 4: Treasury policy approves an eligible $100 invoice...');
  const approvedInvoice = await PolicyEngine.evaluatePaymentProposal('merch_kigali_01', 'inv_demo_approved_100');
  if (!approvedInvoice.isAllowed || approvedInvoice.decision !== 'APPROVED') {
    throw new Error('An approved supplier invoice under the review threshold should pass policy');
  }
  console.log('  ✓ $100 invoice to an approved supplier passes policy; tests do not submit a payout.');

  if (!getTreasuryWalletClient()) {
    const unavailableBalance = await TreasuryService.getTreasuryBalance('merch_kigali_01');
    if (unavailableBalance.currentBalanceUsdc !== 0) {
      throw new Error('Treasury balance must not include a simulated starting buffer');
    }
    const noSignerResult = await TreasuryService.executeSupplierPaymentProposal(
      'merch_kigali_01',
      'inv_demo_approved_100',
      'TEST_NO_SIGNER'
    );
    const invoiceAfterNoSignerAttempt = await db.getInvoiceById('inv_demo_approved_100');
    if (noSignerResult.success || noSignerResult.txHash || invoiceAfterNoSignerAttempt?.paymentStatus !== 'PENDING') {
      throw new Error('A supplier payout without a configured signer must not create a fake tx or mark the invoice paid');
    }
    console.log('  ✓ No signer means zero reported treasury funds and no simulated supplier payout.');
  }

  // Test 5: Spending limit blocks a $700 invoice.
  console.log('\nTest 5: Treasury policy rejects a $700 invoice...');
  const rejectedInvoice = await PolicyEngine.evaluatePaymentProposal('merch_kigali_01', 'inv_demo_rejected_700');
  if (rejectedInvoice.isAllowed || rejectedInvoice.decision !== 'REJECTED') {
    throw new Error('An invoice above the spending cap must be rejected');
  }
  console.log('  ✓ $700 invoice is rejected by the $500 policy limit.');

  // Test 5b: Dual-control threshold is a hard stop until human approval.
  const reviewInvoice = await db.createInvoice({
    id: 'inv_test_dual_control',
    supplierId: 'supp_cape_agro_01',
    merchantId: 'merch_kigali_01',
    invoiceNumber: 'INV-TEST-DUAL-CONTROL',
    invoiceAmount: 350,
    currency: 'USDC',
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    paymentStatus: 'PENDING',
    createdAt: new Date().toISOString(),
  });
  const reviewResult = await TreasuryService.executeSupplierPaymentProposal('merch_kigali_01', reviewInvoice.id);
  const reviewedInvoice = await db.getInvoiceById(reviewInvoice.id);
  if (reviewResult.success || reviewResult.txHash || reviewResult.decision !== 'REQUIRES_APPROVAL' || reviewedInvoice?.paymentStatus !== 'APPROVAL_REQUIRED') {
    throw new Error('An invoice above the dual-control threshold must not execute without human approval');
  }
  console.log('  ✓ $350 invoice is flagged for approval and no transaction is submitted.');

  // Test 5c: A merchant cannot pay through another merchant's supplier record.
  await db.createSupplier({
    id: 'supp_test_foreign',
    merchantId: 'merch_foreign_test',
    supplierName: 'Foreign Supplier',
    walletAddress: '0x2546BcD3c84621e976D8185a91A922aE77ECEc30',
    approvalStatus: 'APPROVED',
    createdAt: new Date().toISOString(),
  });
  const foreignSupplierInvoice = await db.createInvoice({
    id: 'inv_test_foreign_supplier',
    supplierId: 'supp_test_foreign',
    merchantId: 'merch_kigali_01',
    invoiceNumber: 'INV-TEST-FOREIGN-SUPPLIER',
    invoiceAmount: 100,
    currency: 'USDC',
    dueDate: new Date(Date.now() + 86400000).toISOString(),
    paymentStatus: 'PENDING',
    createdAt: new Date().toISOString(),
  });
  const foreignSupplierDecision = await PolicyEngine.evaluatePaymentProposal('merch_kigali_01', foreignSupplierInvoice.id);
  if (foreignSupplierDecision.isAllowed || foreignSupplierDecision.decision !== 'REJECTED') {
    throw new Error('A merchant must not pay an invoice linked to another merchant\'s supplier');
  }
  console.log('  ✓ Cross-merchant supplier invoice is rejected.');

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
    treasuryAgentActionSchema,
    chatMessageInputSchema,
    createSupplierInputSchema,
    createInvoiceInputSchema,
    updatePolicyInputSchema,
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

  const whitespaceMerchant = createMerchantInputSchema.safeParse({
    businessName: '   ',
    email: 'admin@example.com',
    walletAddress: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
  });
  if (whitespaceMerchant.success) throw new Error('Merchant names containing only whitespace must be rejected');

  const invalidOrderAmount = createOrderInputSchema.safeParse({
    merchantId: 'merch_kigali_01',
    customerReference: 'CUST-INVALID',
    orderAmountZar: 'Infinity',
  });
  if (invalidOrderAmount.success) throw new Error('Non-finite order amounts must be rejected');

  const excessPrecisionOrder = createOrderInputSchema.safeParse({
    merchantId: 'merch_kigali_01',
    customerReference: 'CUST-PRECISION',
    orderAmountZar: 12.345,
  });
  if (excessPrecisionOrder.success) throw new Error('Order amounts must match the database currency precision');

  const validOrderAmount = createOrderInputSchema.safeParse({
    merchantId: 'merch_kigali_01',
    customerReference: 'CUST-VALID',
    orderAmountZar: 12.34,
  });
  if (!validOrderAmount.success) throw new Error('Valid two-decimal order amounts should be accepted');

  const invalidInvoiceAmount = createInvoiceInputSchema.safeParse({
    merchantId: 'merch_kigali_01',
    supplierId: 'supp_cape_agro_01',
    invoiceNumber: 'INV-NAN',
    invoiceAmount: 'NaN',
  });
  if (invalidInvoiceAmount.success) throw new Error('Non-numeric invoice amounts must be rejected');

  const invalidPolicyThreshold = updatePolicyInputSchema.safeParse({
    merchantId: 'merch_kigali_01',
    spendingLimit: '500',
    requireApprovalAbove: '-1',
    approvedSuppliersOnly: true,
  });
  if (invalidPolicyThreshold.success) throw new Error('Negative approval thresholds must be rejected');

  const mismatchedPolicyThreshold = updatePolicyInputSchema.safeParse({
    merchantId: 'merch_kigali_01',
    spendingLimit: '500',
    requireApprovalAbove: '501',
    approvedSuppliersOnly: true,
  });
  if (mismatchedPolicyThreshold.success) throw new Error('Approval thresholds must not exceed the spending cap');

  const unknownSupplierField = createSupplierInputSchema.safeParse({
    merchantId: 'merch_kigali_01',
    supplierName: 'Nairobi Supplier',
    walletAddress: '0x15d34AAf54267DB7D7c367839AAf71A00a2C6A65',
    approvalStatus: 'APPROVED',
    admin: true,
  });
  if (unknownSupplierField.success) throw new Error('Mutation schemas must reject unrecognized fields');

  const oversizedChatHistory = chatMessageInputSchema.safeParse({
    merchantId: 'merch_kigali_01',
    message: 'hello',
    history: Array.from({ length: 21 }, () => ({ role: 'user', content: 'hello' })),
  });
  if (oversizedChatHistory.success) throw new Error('Chat history must be capped at 20 messages');
  console.log('  Zod rejects whitespace-only, non-finite, out-of-range, oversized, and unknown inputs');

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
