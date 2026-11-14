# Borderless Checkout

[![Live Demo](https://img.shields.io/badge/Demo-Video-red?style=for-the-badge&logo=youtube)](https://youtu.be/R2BtQFe14NU)
[![Frontend](https://img.shields.io/badge/Frontend-Live-blue?style=for-the-badge)](https://uhuru-one.vercel.app/)

Borderless Checkout is a demo payment platform for African merchants. Customers can pay with USDC on Base Sepolia. The server checks each payment on the blockchain before it marks an order as paid.

The project also includes a merchant dashboard, payment refunds, a simulated USDC-to-ZAR cash-out flow, supplier invoices, treasury policy checks, audit logs, and AI helpers.

> **Demo network:** The app is set up for Base Sepolia testnet. Test tokens have no real-world value. Cash-outs are simulations and do not send money to a bank.

## What it can do

- Create customer orders and checkout links.
- Connect a browser wallet and send USDC to a merchant wallet.
- Verify the mined payment receipt, official USDC contract, recipient, and exact amount on the server.
- Track orders, verified payments, suppliers, invoices, and treasury activity in the dashboard.
- Refund verified payments to the original payer from the merchant's connected wallet. Refunds need PostgreSQL storage and Base Sepolia USDC and test ETH in the merchant wallet.
- Preview and simulate a cash-out quote. The bank payout provider is a mock; no real funds move.
- Ask the merchant chatbot about payment data. It is read-only; an Anthropic key is optional.
- Run supplier payment proposals through an independent policy engine. Real treasury submission is off by default and needs explicit server-side configuration.

See [Project documentation](docs/PROJECT_DOCUMENTATION.md) for the architecture, setup details, API list, data model, feature flows, and current limitations.

## Quick start

### Requirements

- Node.js 20 or later
- pnpm (the project declares pnpm 12.18.0)
- A Base Sepolia-compatible browser wallet for on-chain payment and refund flows
- PostgreSQL or a Supabase PostgreSQL database for persistent data and refunds

### Install and configure

```bash
git clone <repository-url>
cd BorderlessCheckOut
pnpm install
```

If you do not already have one, copy the example file to `.env`:

```bash
cp .env.example .env
```

Edit `.env`. Next.js also supports `.env.local`, but Drizzle commands load `.env`, so put `DATABASE_URL` there when running database commands. The Base Sepolia settings have defaults in the app. Set `DATABASE_URL` to your PostgreSQL connection string to keep records between restarts and to enable refunds. Supabase works as the PostgreSQL host; use its database connection string, not a Supabase publishable key.

```env
DATABASE_URL=postgresql://postgres:<password>@<host>:5432/postgres
```

If the database password has characters such as `@`, `:`, `/`, or `#`, URL-encode those characters in the connection string. Keep `.env` and `.env.local` private and do not commit them.

Create or update the database tables, then start the app:

```bash
pnpm db:push
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Main pages include:

- `/dashboard` — merchant workspace
- `/checkout/<order-id>` — customer checkout for an order
- `/refunds` — standalone refund page
- `/cash-out` — standalone simulated cash-out page

The app also has a local seeded-data mode when no database is configured. It is useful for exploring the UI, but it is not persistent and cannot be used for refunds.

## Common commands

```bash
pnpm dev          # Start the local development server
pnpm build        # Create a production build
pnpm start        # Start the production build
pnpm lint         # Run ESLint
pnpm test         # Run the project test runner
pnpm db:generate  # Generate a Drizzle migration from the schema
pnpm db:push      # Apply the schema to the configured database
pnpm db:studio    # Open Drizzle Studio
```

## Important network and safety settings

- Chain: Base Sepolia, chain ID `84532`
- USDC test token: `0x036CbD53842c5426634e7929541eC2318f3dCF7e` (6 decimals)
- Merchant wallet: `0xA8f73eb996C58688240474D442C1D467f7171D58`
- Customer wallet: `0x6564309C50f907C3E8CA86f014A1A879754ED919` (connect it on the checkout page)
- RPC: `https://sepolia.base.org`
- Explorer: [BaseScan Sepolia](https://sepolia.basescan.org)
- Treasury execution: disabled unless `TREASURY_EXECUTION_ENABLED=true` is set on the server with a test-only private key and API key.

Never use a mainnet wallet key for this demo. Never place private keys or server API keys in a `NEXT_PUBLIC_` variable.

## Current limitations

- Registration and merchant selection are demo flows, not production authentication.
- The cash-out feature uses an in-memory mock provider. It does not integrate with a bank, mobile-money service, or blockchain.
- Refunds submit real testnet USDC transfers. They require `DATABASE_URL`, an eligible verified payment, and a merchant wallet funded with testnet USDC and ETH for gas.
- The displayed exchange rate is a fixed indicative demo rate. It is not a live quote or a promise of settlement.
- AI tools can summarize data, but they do not have permission to sign or submit transactions.

## License

MIT License. Built for the Node Engine Hackathon 2026, Merchant & Machine Payments track.
