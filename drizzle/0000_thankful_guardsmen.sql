CREATE TABLE "agent_audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL,
	"agent_action" varchar(50) NOT NULL,
	"proposed_amount" numeric(14, 2),
	"supplier" text,
	"policy_decision" varchar(30) NOT NULL,
	"policy_reason" text,
	"execution_status" varchar(30) NOT NULL,
	"tx_hash" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "merchants" (
	"id" text PRIMARY KEY NOT NULL,
	"business_name" text NOT NULL,
	"email" text NOT NULL,
	"wallet_address" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "merchants_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "orders" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL,
	"customer_reference" text NOT NULL,
	"order_amount" numeric(14, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'ZAR' NOT NULL,
	"usdc_amount" numeric(14, 6) NOT NULL,
	"payment_reference" text NOT NULL,
	"payment_status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "orders_payment_reference_unique" UNIQUE("payment_reference")
);
--> statement-breakpoint
CREATE TABLE "supplier_invoices" (
	"id" text PRIMARY KEY NOT NULL,
	"supplier_id" text NOT NULL,
	"merchant_id" text NOT NULL,
	"invoice_number" text NOT NULL,
	"invoice_amount" numeric(14, 2) NOT NULL,
	"currency" varchar(10) DEFAULT 'USDC' NOT NULL,
	"due_date" timestamp with time zone NOT NULL,
	"payment_status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "suppliers" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL,
	"supplier_name" text NOT NULL,
	"wallet_address" text NOT NULL,
	"approval_status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "transactions" (
	"id" text PRIMARY KEY NOT NULL,
	"order_id" text,
	"merchant_id" text NOT NULL,
	"tx_hash" text NOT NULL,
	"token_contract" text DEFAULT '0x036CbD53842c5426634e7929541eC2318f3dCF7e' NOT NULL,
	"sender_address" text NOT NULL,
	"recipient_address" text NOT NULL,
	"amount" numeric(14, 6) NOT NULL,
	"verification_status" varchar(20) DEFAULT 'VERIFIED' NOT NULL,
	"type" varchar(30) DEFAULT 'CUSTOMER_PAYMENT' NOT NULL,
	"block_number" bigint,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "transactions_tx_hash_unique" UNIQUE("tx_hash")
);
--> statement-breakpoint
CREATE TABLE "treasury_policies" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL,
	"spending_limit" numeric(14, 2) DEFAULT '500.00' NOT NULL,
	"approval_requirements" jsonb DEFAULT '{"requireApprovalAbove":300,"approvedSuppliersOnly":true}'::jsonb NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now(),
	CONSTRAINT "treasury_policies_merchant_id_unique" UNIQUE("merchant_id")
);
--> statement-breakpoint
ALTER TABLE "agent_audit_logs" ADD CONSTRAINT "agent_audit_logs_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "orders" ADD CONSTRAINT "orders_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_invoices" ADD CONSTRAINT "supplier_invoices_supplier_id_suppliers_id_fk" FOREIGN KEY ("supplier_id") REFERENCES "public"."suppliers"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "supplier_invoices" ADD CONSTRAINT "supplier_invoices_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "suppliers" ADD CONSTRAINT "suppliers_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "treasury_policies" ADD CONSTRAINT "treasury_policies_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;