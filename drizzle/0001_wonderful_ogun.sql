CREATE TABLE "refunds" (
	"id" text PRIMARY KEY NOT NULL,
	"merchant_id" text NOT NULL,
	"order_id" text NOT NULL,
	"original_payment_id" text NOT NULL,
	"amount" numeric(14, 6) NOT NULL,
	"currency" varchar(10) DEFAULT 'USDC' NOT NULL,
	"recipient_address" text NOT NULL,
	"tx_hash" text,
	"status" varchar(20) DEFAULT 'PENDING' NOT NULL,
	"reason" varchar(80) NOT NULL,
	"gas_cost_wei" text,
	"fee_payer" varchar(20) DEFAULT 'MERCHANT' NOT NULL,
	"idempotency_key" text NOT NULL,
	"failure_reason" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	CONSTRAINT "refunds_tx_hash_unique" UNIQUE("tx_hash"),
	CONSTRAINT "refunds_idempotency_key_unique" UNIQUE("idempotency_key")
);
--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_merchant_id_merchants_id_fk" FOREIGN KEY ("merchant_id") REFERENCES "public"."merchants"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_order_id_orders_id_fk" FOREIGN KEY ("order_id") REFERENCES "public"."orders"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "refunds" ADD CONSTRAINT "refunds_original_payment_id_transactions_id_fk" FOREIGN KEY ("original_payment_id") REFERENCES "public"."transactions"("id") ON DELETE no action ON UPDATE no action;