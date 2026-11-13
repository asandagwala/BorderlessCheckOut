Don Kolony: Developer
Ndumiso Mkhasibe: Developer
Anita Kanayo: Researcher
Asanda Dunn: Business Analyst

Progress summary
Our team has selected the Merchant & Machine Payments track and developed Borderless Checkout, a concept for helping African online merchants accept USDC. We have outlined a checkout flow where a customer receives an order-specific payment request, pays from a wallet, and the system verifies the transaction on Base Sepolia before matching it to the order. We have also chosen our proposed technology stack: React, TypeScript, Node.js, Express, Supabase, viem, and Claude. Our planned demo includes a merchant dashboard and AI features for payment insights and controlled supplier payments. We are now moving from concept design into implementation, prioritising a complete testnet payment flow.

Next steps
1. Set up the app, backend, and database for orders and payment status.
2. Build a simple sample store checkout that displays the rand price and exact USDC payment request.
3. Connect a wallet and make a USDC payment on Base Sepolia.
4. Verify the payment on the backend, match it to the order, and update its status automatically.
5. Build the merchant dashboard to show the order and transaction.
6. If time allows, add the read-only payment chatbot, then a tightly limited treasury-agent demo. Show rand cash-out as simulated unless you integrate a real payout provider.
