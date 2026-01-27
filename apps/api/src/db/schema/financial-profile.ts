import { pgTable, text, timestamp, numeric } from "drizzle-orm/pg-core";
import { user } from "./auth";

export const financialProfile = pgTable("financial_profile", {
  userId: text("user_id")
    .primaryKey()
    .references(() => user.id, { onDelete: "cascade" }),
  monthlyIncomeTarget: numeric("monthly_income_target", {
    precision: 10,
    scale: 2,
  }).notNull(),
  needsPercentage: numeric("needs_percentage", { precision: 5, scale: 2 })
    .notNull()
    .default("50.00"),
  wantsPercentage: numeric("wants_percentage", { precision: 5, scale: 2 })
    .notNull()
    .default("30.00"),
  futurePercentage: numeric("future_percentage", { precision: 5, scale: 2 })
    .notNull()
    .default("20.00"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export type FinancialProfile = typeof financialProfile.$inferSelect;
export type NewFinancialProfile = typeof financialProfile.$inferInsert;
