import {
  pgTable,
  pgEnum,
  text,
  boolean,
  timestamp,
  varchar,
  uuid,
  numeric,
  date,
  index,
} from "drizzle-orm/pg-core";

import { relations } from "drizzle-orm";

// ─── Enums ───────────────────────────────────────────────────────────────────

export const transactionTypeEnum = pgEnum("transaction_type", [
  "expense",
  "income",
]);

export const budgetPeriodEnum = pgEnum("budget_period", ["monthly", "weekly"]);

export const allocationBucketEnum = pgEnum("allocation_bucket", [
  "needs",
  "wants",
  "future",
]);

export const recurrenceFrequencyEnum = pgEnum("recurrence_frequency", [
  "daily",
  "weekly",
  "biweekly",
  "monthly",
  "quarterly",
  "yearly",
]);

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable(
  "session",
  {
    id: text("id").primaryKey(),
    expiresAt: timestamp("expires_at").notNull(),
    token: text("token").notNull().unique(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text("ip_address"),
    userAgent: text("user_agent"),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
  },
  (table) => [index("session_userId_idx").on(table.userId)],
);

export const account = pgTable(
  "account",
  {
    id: text("id").primaryKey(),
    accountId: text("account_id").notNull(),
    providerId: text("provider_id").notNull(),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    accessToken: text("access_token"),
    refreshToken: text("refresh_token"),
    idToken: text("id_token"),
    accessTokenExpiresAt: timestamp("access_token_expires_at"),
    refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
    scope: text("scope"),
    password: text("password"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("account_userId_idx").on(table.userId)],
);

export const verification = pgTable(
  "verification",
  {
    id: text("id").primaryKey(),
    identifier: text("identifier").notNull(),
    value: text("value").notNull(),
    expiresAt: timestamp("expires_at").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index("verification_identifier_idx").on(table.identifier)],
);

export const financialProfile = pgTable("financial_profile", {
  userId: varchar("user_id", { length: 255 }).primaryKey(),
  monthlyIncomeTarget: numeric("monthly_income_target", {
    precision: 10,
    scale: 2,
  }).notNull(),
  needsPercentage: numeric("needs_percentage", {
    precision: 5,
    scale: 2,
  })
    .notNull()
    .default("50.00"),
  wantsPercentage: numeric("wants_percentage", {
    precision: 5,
    scale: 2,
  })
    .notNull()
    .default("30.00"),
  futurePercentage: numeric("future_percentage", {
    precision: 5,
    scale: 2,
  })
    .notNull()
    .default("20.00"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const categories = pgTable("categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  type: transactionTypeEnum("type").notNull(),
  allocationBucket: allocationBucketEnum("allocation_bucket"),
  icon: varchar("icon", { length: 10 }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const transactions = pgTable("transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  type: transactionTypeEnum("type").notNull(),
  description: text("description"),
  date: date("date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const budgets = pgTable("budgets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  categoryId: uuid("category_id")
    .notNull()
    .references(() => categories.id, { onDelete: "cascade" }),
  amount: numeric("amount", { precision: 12, scale: 2 }).notNull(),
  period: budgetPeriodEnum("period").notNull(),
  startDate: date("start_date").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const recurringTransactions = pgTable("recurring_transactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: varchar("user_id", { length: 255 }).notNull(),
  categoryId: uuid("category_id").references(() => categories.id, {
    onDelete: "set null",
  }),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull(),
  type: transactionTypeEnum("type").notNull(),
  description: varchar("description", { length: 255 }),
  frequency: recurrenceFrequencyEnum("frequency").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date"),
  nextDueDate: date("next_due_date").notNull(),
  lastGeneratedDate: date("last_generated_date"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// ─── Relations ───────────────────────────────────────────────────────────────

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}));
export const userRelations = relations(user, ({ one, many }) => ({
  financialProfile: one(financialProfile, {
    fields: [user.id],
    references: [financialProfile.userId],
  }),
  sessions: many(session),
  accounts: many(account),
  categories: many(categories),
  transactions: many(transactions),
  budgets: many(budgets),
  recurringTransactions: many(recurringTransactions),
}));

export const financialProfileRelations = relations(
  financialProfile,
  ({ one }) => ({
    user: one(user, {
      fields: [financialProfile.userId],
      references: [user.id],
    }),
  }),
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  transactions: many(transactions),
  budgets: many(budgets),
  recurringTransactions: many(recurringTransactions),
}));

export const transactionsRelations = relations(transactions, ({ one }) => ({
  category: one(categories, {
    fields: [transactions.categoryId],
    references: [categories.id],
  }),
}));

export const budgetsRelations = relations(budgets, ({ one }) => ({
  category: one(categories, {
    fields: [budgets.categoryId],
    references: [categories.id],
  }),
}));

export const recurringTransactionsRelations = relations(
  recurringTransactions,
  ({ one }) => ({
    category: one(categories, {
      fields: [recurringTransactions.categoryId],
      references: [categories.id],
    }),
  }),
);
