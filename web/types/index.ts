import type { ZodIssue } from "zod";

// ─── Enums ────────────────────────────────────────────────────────────────────

export type TransactionType = "expense" | "income";
export type BudgetPeriod = "monthly" | "weekly";
export type AllocationBucket = "needs" | "wants" | "future";
export type RecurrenceFrequency =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "yearly";

// ─── Core Entities ────────────────────────────────────────────────────────────

export type Category = {
  id: string;
  userId: string;
  name: string;
  type: TransactionType;
  allocationBucket: AllocationBucket | null;
  icon: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Transaction = {
  id: string;
  userId: string;
  categoryId: string | null;
  amount: string;
  type: TransactionType;
  description: string | null;
  date: string;
  createdAt: Date;
  updatedAt: Date;
};

export type Budget = {
  id: string;
  userId: string;
  categoryId: string;
  amount: string;
  period: BudgetPeriod;
  startDate: string;
  createdAt: Date;
};

export type RecurringTransaction = {
  id: string;
  userId: string;
  categoryId: string | null;
  amount: string;
  type: TransactionType;
  description: string | null;
  frequency: RecurrenceFrequency;
  startDate: string;
  endDate: string | null;
  nextDueDate: string;
  lastGeneratedDate: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type FinancialProfile = {
  userId: string;
  monthlyIncomeTarget: string;
  needsPercentage: string;
  wantsPercentage: string;
  futurePercentage: string;
  currency: string;
  createdAt: Date;
  updatedAt: Date;
};

// ─── With Relations ───────────────────────────────────────────────────────────

export type TransactionWithCategory = Transaction & {
  category: Category | null;
};

export type BudgetWithCategory = Budget & {
  category: Category;
};

export type BudgetWithSpending = BudgetWithCategory & {
  spent: number;
};

export type RecurringTransactionWithCategory = RecurringTransaction & {
  category: Category | null;
};

// ─── Action Result ────────────────────────────────────────────────────────────

export type ActionResult<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string; issues?: ZodIssue[] };

// ─── Transaction Batching & Filtering ─────────────────────────────────────────

export type TransactionBatch = {
  transactions: TransactionWithCategory[];
  hasMore: boolean;
};

export type TransactionTotals = {
  count: number;
  totalIncome: number;
  totalExpenses: number;
};

export type FilterState = {
  type?: TransactionType;
  search?: string;
};
