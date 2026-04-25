CREATE TABLE "exchange_rate_cache" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"from_currency" varchar(3) NOT NULL,
	"to_currency" varchar(3) NOT NULL,
	"rate_date" date NOT NULL,
	"rate" numeric(20, 10) NOT NULL,
	"fetched_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "currency" varchar(3) DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "original_amount" numeric(12, 2) NOT NULL DEFAULT '0';--> statement-breakpoint
UPDATE "transactions" SET "original_amount" = "amount";--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "exchange_rate" numeric(20, 10) DEFAULT '1.0' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "exchange_rate_cache_lookup_idx" ON "exchange_rate_cache" USING btree ("from_currency","to_currency","rate_date");