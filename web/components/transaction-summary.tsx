import { formatCurrency } from "@/lib/finance-utils";
import type { TransactionTotals } from "@/types";

type TransactionSummaryProps = {
  totals: TransactionTotals;
};

export function TransactionSummary({ totals }: TransactionSummaryProps) {
  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
      <span>
        {totals.count} transaction{totals.count !== 1 ? "s" : ""}
      </span>
      <span>·</span>
      <span className="text-emerald-500">+{formatCurrency(totals.totalIncome.toString())}</span>
      <span>·</span>
      <span className="text-red-400">−{formatCurrency(totals.totalExpenses.toString())}</span>
    </div>
  );
}
