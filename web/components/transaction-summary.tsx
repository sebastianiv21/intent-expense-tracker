"use client";

import { useCurrency } from "@/components/currency-provider";
import type { TransactionTotals } from "@/types";

type TransactionSummaryProps = {
  totals: TransactionTotals;
};

export function TransactionSummary({ totals }: TransactionSummaryProps) {
  const { formatCurrency } = useCurrency();

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
      <span>
        {totals.count} transaction{totals.count !== 1 ? "s" : ""}
      </span>
      <span>·</span>
      <span className="text-emerald-500">
        +{formatCurrency(totals.totalIncome)}
      </span>
      <span>·</span>
      <span className="text-red-400">
        −{formatCurrency(totals.totalExpenses)}
      </span>
    </div>
  );
}
