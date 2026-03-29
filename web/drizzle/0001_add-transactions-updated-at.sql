ALTER TABLE "account" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "session" ALTER COLUMN "updated_at" SET DEFAULT now();--> statement-breakpoint
ALTER TABLE "transactions" ADD COLUMN "updated_at" timestamp DEFAULT now() NOT NULL;--> statement-breakpoint
CREATE INDEX "budgets_userId_idx" ON "budgets" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "categories_userId_idx" ON "categories" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "recurring_userId_idx" ON "recurring_transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transactions_userId_idx" ON "transactions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "transactions_date_idx" ON "transactions" USING btree ("date");