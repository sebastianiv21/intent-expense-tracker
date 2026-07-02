ALTER TABLE "recurring_transactions" ADD COLUMN "currency" varchar(3) DEFAULT 'USD' NOT NULL;--> statement-breakpoint
ALTER TABLE "recurring_transactions" ADD COLUMN "original_amount" numeric(10, 2);--> statement-breakpoint
UPDATE "recurring_transactions" SET "original_amount" = "amount" WHERE "original_amount" IS NULL;--> statement-breakpoint
ALTER TABLE "recurring_transactions" ALTER COLUMN "original_amount" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "recurring_transactions" ADD COLUMN "exchange_rate" numeric(20, 10) DEFAULT '1.0' NOT NULL;