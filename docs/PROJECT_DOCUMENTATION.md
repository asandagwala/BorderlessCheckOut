# Borderless Checkout: Project Guide

This guide explains how the project is organized, how to run it, and what each feature currently does. It uses simple English and describes the code as it works today.

## 1. Project overview

Borderless Checkout is a merchant payment demo. A merchant creates an order. A customer pays the merchant in USDC on Base Sepolia. The server checks the transaction receipt on the blockchain before it records the order as paid.

The project also has merchant tools for orders, refunds, simulated cash-outs, suppliers, treasury policies, audit records, and AI help.

**All blockchain payment and refund flows use Base Sepolia testnet.** Testnet funds have no real-world value. The cash-out feature is a simulation and does not send money to a bank.

## 2. Technology

| Area | Technology |
| --- | --- |
| Web app | Next.js 16 App Router, React 19, TypeScript |
| Styling | Tailwind CSS and local UI components |
| Database | PostgreSQL through Drizzle ORM; Supabase PostgreSQL can be used |
| Blockchain | Base Sepolia, viem, Circle USDC test contract |
| AI | Anthropic Claude for chat; Gemini for invoice proposals |
| Validation | Zod |

## 3. Local setup

### Requirements

- Node.js 20 or later
- pnpm 12.18.0 (the version recorded in `package.json`)
- PostgreSQL for persistent storage; Supabase can provide it
- A browser wallet on Base Sepolia for testnet payment and refund transactions
- Test USDC and test ETH in the merchant wallet to send transactions

### Install

```bash
git clone <repository-url>
cd BorderlessCheckOut
pnpm install
```

If `.env` does not exist yet, create it from the example:

```bash
cp .env.example .env
```

Open `.env` and set the values you need. Next.js also supports `.env.local`, but Drizzle commands load `.env`, so keep `DATABASE_URL` in `.env` when using the database commands. Restart the development server after changing environment values.

### Environment variables

| Variable | Required | Description |
| --- | --- | --- |
| `DATABASE_URL` | Recommended | PostgreSQL connection string. Required for persistent records and refunds. |
| `POSTGRES_URL` | Alternative | Used if `DATABASE_URL` is empty. |
| `NEXT_PUBLIC_BASE_SEPOLIA_RPC` | No | Base Sepolia RPC URL. Defaults to `https://sepolia.base.org`. |
| `NEXT_PUBLIC_BASE_SEPOLIA_RPC_FALLBACK` | No | Backup RPC URL. |
| `NEXT_PUBLIC_BASE_CHAIN_ID` | No | Chain ID. Defaults to `84532`. |
| `NEXT_PUBLIC_USDC_CONTRACT` | No | Testnet USDC contract address. Defaults to Circle's Base Sepolia contract. |
| `NEXT_PUBLIC_BLOCK_EXPLORER` | No | Explorer URL. Defaults to BaseScan Sepolia. |
| `MERCHANT_WALLET_ADDRESS` | No | Default merchant settlement wallet. This is a public address, not a secret. |
| `ANTHROPIC_API_KEY` | No | Enables Anthropic-backed merchant chat. Without it, a local rule-based reply is used. `CLAUDE_API_KEY` is also accepted as an alias. |
| `GEMINI_API_KEY` | No | Enables Gemini invoice proposals. |
| `GEMINI_MODEL` | No | Gemini model name. Defaults to `gemini-3.6-flash`. |
| `NEXT_PUBLIC_APP_URL` | No | App URL used when a complete URL is needed. Defaults to `http://localhost:3000`. |
| `TREASURY_EXECUTION_ENABLED` | No | Must be `true` to allow the treasury service to submit a testnet transfer. Defaults to `false`. |
| `TREASURY_PRIVATE_KEY` | No | Server-only test wallet key for treasury execution. Do not use a mainnet key. |
| `TREASURY_EXECUTION_API_KEY` | No | Server-side treasury API authorization value. Keep it private. |

The `NEXT_PUBLIC_` values are included in browser code. Never put private keys, database passwords, or API secrets in variables with that prefix. Do not commit `.env.local`.

### Supabase database setup

The app connects to Supabase as a PostgreSQL database through Drizzle. It does not need Supabase Auth or a Supabase publishable key for its current database access.

1. Create a Supabase project.
2. In Supabase, open the database connection details and copy a PostgreSQL connection string. A pooler connection string can also be used.
3. Put the connection string in `.env` as `DATABASE_URL`.
4. Replace the password placeholder with the database password. URL-encode reserved characters in the password, for example `@` as `%40`.
5. Apply the schema and start the app:

```bash
pnpm db:push
pnpm dev
```

Use a development database when trying schema changes. Back up important data before applying schema updates. Refund endpoints intentionally refuse to work without persistent PostgreSQL storage because refund reservations must survive process restarts.

### Run the app

```bash
pnpm dev
```

Then visit:

| URL | Page |
| --- | --- |
| `/` | Home page |
| `/dashboard` | Merchant dashboard and feature tabs |
| `/checkout/<order-id>` | Customer checkout page for an order |
| `/refunds` | Standalone refunds page |
| `/cash-out` | Standalone simulated cash-out page |
| `/login` | Demo login page |
| `/register` | Demo merchant registration page |

The dashboard includes merchant selection and feature areas for orders, suppliers and invoices, treasury, AI treasury, audit logs, refunds, and cash-out.

## 4. Useful commands

```bash
pnpm dev          # Run the development server
pnpm build        # Build the production app
pnpm start        # Serve the production build
pnpm lint         # Run ESLint
pnpm test         # Run the project test runner
pnpm db:generate  # Generate a Drizzle migration from the schema
pnpm db:push      # Push schema changes to the configured database
pnpm db:studio    # Open Drizzle Studio
```

Database tables are defined in `lib/database/drizzle/schema.ts`. Generated migrations are kept in `drizzle/`. Do not make separate hand-written SQL schema files.

## 5. How the project is organized

```text
app/
  api/                 API route handlers
  checkout/[id]/       Customer checkout page
  dashboard/           Merchant dashboard
  refunds/             Standalone refunds page
  cash-out/            Standalone cash-out page
modules/
  ai-chatbot/          Read-only merchant chat
  ai-treasury-agent/   Invoice proposal and agent workflow
  audit-logs/          Audit log display
  blockchain/          Base Sepolia clients and payment verification
  cash-out/            Quote logic and mock off-ramp provider
  dashboard/           Dashboard order and transaction UI
  reconciliation/      Payment-to-order reconciliation
  refunds/             Refund UI and testnet flow
  suppliers/            Supplier and invoice UI
  treasury/             Policy checks and protected payment execution
lib/
  database/             Repository, seed data, and Drizzle schema
  validations/          Request validation schemas
  env.ts                Environment defaults and validation
drizzle/                Generated database migrations
scripts/test-runner.ts  Project test runner
```

### Main database tables

| Table | Stores |
| --- | --- |
| `merchants` | Merchant identity and settlement wallet address |
| `orders` | Customer reference, ZAR and USDC amounts, payment state |
| `transactions` | Verified payment and supplier payout records |
| `suppliers` | Supplier details and approval state |
| `supplier_invoices` | Invoice amount, due date, and payment state |
| `treasury_policies` | Merchant spending and approval rules |
| `agent_audit_logs` | Policy decisions, execution state, and transaction hash |
| `refunds` | Refund requests, reservations, receipt data, and status |

### Database behavior

`lib/database/db.ts` provides the app's repository methods. When `DATABASE_URL` or `POSTGRES_URL` is set, it uses Drizzle and PostgreSQL. Without a database, it uses seeded in-memory records so the dashboard can be explored locally. In-memory records are lost when the server process stops and are not shared between server instances.

The separate refund routes require a persistent Drizzle database. They return an error instead of using the in-memory fallback.

## 6. Features and flows

### Customer orders and payments

1. A merchant creates an order in the dashboard.
2. The app creates a checkout URL and a unique payment reference.
3. The customer connects a compatible browser wallet and sends the exact USDC amount to the merchant's wallet on Base Sepolia.
4. The checkout page sends the transaction hash to the server for verification.
5. `BlockchainPaymentVerifier` waits for a mined receipt and checks that it succeeded, contains a Transfer event from the configured USDC contract, pays the merchant, and transfers the exact order amount.
6. `ReconciliationService` prevents a transaction hash from being claimed by multiple orders, saves the verified transaction, and marks the order `PAID`.

The server does not trust a browser's claim that a payment succeeded. There is no simulated-payment bypass in reconciliation. The ZAR conversion is a fixed indicative demo rate, not a live exchange quote.

### Refunds

Refunds are available in the dashboard and at `/refunds`.

1. The merchant chooses an order with a verified, paid customer transaction.
2. The connected wallet must match the merchant's settlement wallet and sign a message describing the request.
3. The server checks the payment and reserves the requested amount in PostgreSQL. A database lock and idempotency key help prevent duplicate or excessive reservations.
4. The merchant's wallet sends USDC to the original payer. The merchant pays Base Sepolia gas.
5. The server checks the mined receipt, sender, official token contract, exact amount, and original payer as recipient before marking the refund complete.

Refund amounts cannot exceed the remaining amount of the verified payment. Refunds need a configured persistent database and a successful original payment. The merchant wallet needs Base Sepolia USDC and test ETH. The app does not currently calculate or retain an R85 checkout fee; refund previews use the verified payment amount. Gas cost is recorded after confirmation.

### Cash-out

Cash-out is available in the dashboard and at `/cash-out`. It shows ledger-based availability calculated from verified customer receipts, verified supplier payouts, unpaid or approval-required supplier invoices, simulated payouts, and a user-selected reserve.

The demo quote uses a fixed rate of R18.50 per USDC and a simulated 1% fee. It has a maximum of 1,000 USDC per payout and 2,000 USDC per day. The destination shown is a masked demo label. Submitting a quote only creates a mock payout record; the status changes from `PROCESSING` to `PAID` after a short delay when the history is read.

The mock provider makes no bank, mobile-money, or blockchain call. Quote and payout history is held in server memory and is lost when the process restarts. It is for UI and flow testing only.

### Suppliers and treasury rules

Merchants can manage suppliers and invoices. A payment proposal is checked by `PolicyEngine` before the treasury execution service can send anything. The policy checks that the invoice belongs to the merchant, is unpaid, the supplier is approved when required, the amount is within the merchant's spending limit, and whether extra human approval is required.

Policy rejections and failed execution attempts are written to the audit log. Treasury execution is disabled by default. If enabled, it needs a test-only server wallet key and the right API authorization. The transfer is submitted on Base Sepolia and checked against the USDC transfer event before it is recorded as paid. AI recommendations do not override policy and do not sign transactions.

### AI tools

- **Merchant chatbot:** Can answer questions using read-only tools for balance, today's receipts, unpaid orders, recent transactions, and weekly activity. With no Anthropic key, it uses a simple local rule-based reply for supported questions.
- **Gemini invoice proposal:** Can return a structured recommendation, rationale, and risk flags when `GEMINI_API_KEY` is set. It does not approve or execute payments. The backend policy engine remains the authority.

### Merchant login and registration

Login, registration, and merchant selection are demo flows. They do not provide production password authentication or full user-session security. Do not use this app as a production merchant account system without adding proper authentication and access controls.

## 7. API routes

These are the current app API routes. Request bodies are JSON unless stated otherwise.

| Method | Path | Purpose |
| --- | --- | --- |
| `GET`, `POST`, `PATCH` | `/api/auth` | List or find demo merchants, register a merchant, update its wallet address |
| `GET`, `POST` | `/api/orders` | List a merchant's orders or create an order |
| `GET` | `/api/orders/[id]` | Read an order and its merchant details |
| `POST` | `/api/checkout/verify` | Verify and reconcile a payment transaction hash |
| `GET` | `/api/dashboard/stats` | Read merchant orders and transaction data for the dashboard |
| `GET`, `POST` | `/api/suppliers` | List or add suppliers |
| `GET`, `POST` | `/api/invoices` | List or add supplier invoices |
| `GET`, `POST` | `/api/policies` | Read or update treasury policies |
| `POST` | `/api/treasury/agent` | Run a treasury agent workflow or invoice proposal |
| `GET` | `/api/audit-logs` | Read merchant audit records |
| `POST` | `/api/chatbot` | Send a merchant question and optional conversation history |
| `GET`, `POST` | `/api/refunds` | List refund history or reserve a signed refund request |
| `GET` | `/api/refunds/context` | Load refund page data for a merchant |
| `POST` | `/api/refunds/confirm` | Verify a submitted refund transaction |
| `POST` | `/api/refunds/cancel` | Cancel a refund that is still pending |
| `GET`, `POST` | `/api/cash-out/quote` | Read a cash-out summary or create a quote |
| `POST` | `/api/cash-out/submit` | Submit a confirmed quote to the mock provider |
| `GET` | `/api/cash-out/history` | Read simulated payout history |

See each `route.ts` file for the exact request fields and response shape. API validation is not a replacement for production authentication; merchant IDs are used by this demo to select records.

## 8. Network details

| Setting | Value |
| --- | --- |
| Network | Base Sepolia |
| Chain ID | `84532` |
| RPC | `https://sepolia.base.org` |
| USDC contract | `0x036CbD53842c5426634e7929541eC2318f3dCF7e` |
| USDC decimals | `6` |
| Explorer | [sepolia.basescan.org](https://sepolia.basescan.org) |

The configured demo merchant wallet is `0xA8f73eb996C58688240474D442C1D467f7171D58`. The customer wallet for the testnet demo is `0x6564309C50f907C3E8CA86f014A1A879754ED919`; connect it in the customer's browser wallet when testing checkout. The merchant address is the app's default already. The customer address is used in local sample transaction records; real checkout payments use whichever customer wallet is connected.

## 9. Checks and troubleshooting

### `pnpm db:push` cannot connect

- Check that `DATABASE_URL` is set in `.env` and that you replaced the full password placeholder, including its angle brackets, with your actual password.
- URL-encode reserved characters in the password.
- Check the Supabase connection host, port, username, and password.
- Confirm that the database allows your connection type and network.

### A payment or refund remains pending or fails

- Confirm the wallet is on Base Sepolia (chain ID `84532`).
- Check that the transaction is mined and succeeded on BaseScan Sepolia.
- Confirm the exact USDC amount and destination address.
- For refunds, confirm that the merchant wallet is the connected wallet and has test USDC and test ETH.
- Confirm the order has a verified payment and PostgreSQL is configured.

### AI features are unavailable

- Chat works with a local fallback for supported questions if `ANTHROPIC_API_KEY` is empty.
- Gemini proposals require a valid `GEMINI_API_KEY`.
- Restart `pnpm dev` after editing the environment file.

## 10. Project status and production work

This repository is a testnet/demo application. Cash-out is simulated, account authentication is not production-ready, exchange rates are fixed demo values, and real treasury execution is disabled by default. Before handling real merchants or funds, the project needs production-grade authentication and authorization, a real regulated cash-out provider, live pricing and operational controls, deployment secrets management, monitoring, and security review.

