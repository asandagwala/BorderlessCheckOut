# Project Concept Document

**Project:** Borderless Checkout  
**Track:** Merchant & Machine Payments

## Problem statement

Small African online businesses can lose potential sales when customers cannot pay using the payment method or currency they have available. Borderless Checkout adds a USDC payment option to online checkout and automatically matches verified blockchain payments to the correct orders, while giving merchants a clear view of their payment activity.

## Target users in Africa

Our initial target users are **small and medium-sized online merchants in South Africa**, especially stores serving customers who already use digital wallets or stablecoins. Their customers can pay in USDC, while merchants can track payments and see the rand equivalent.

## Core features

- **USDC checkout:** Create a unique payment request with a QR code or wallet link for each order.
- **Payment verification and matching:** Verify USDC payments on Base Sepolia and automatically match them to the correct order.
- **Merchant dashboard:** Show paid and unpaid orders, incoming payments, transaction history, and USDC balances.
- **AI merchant assistant:** Answer questions about sales and payment activity using the merchant’s verified transaction records.
- **Controlled treasury agent:** Check approved suppliers and spending limits before initiating a supplier payment; reject payments that exceed the merchant’s limit.

## Track alignment

Borderless Checkout addresses the Merchant & Machine Payments track by letting an online merchant request stablecoin payment, confirm it on-chain, match it to an order, and track it through a dashboard. Its treasury agent extends the idea to machine-initiated payments by allowing a software agent to pay approved suppliers within limits set by the merchant. For the demo, any conversion from USDC to rand will be shown as a simulated payout path.
