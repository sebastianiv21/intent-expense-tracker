"use client";

import { useTranslations } from "next-intl";
import { useCurrency } from "@/components/currency-provider";
import type { TransactionTotals } from "@/types";

type TransactionSummaryProps = {
  totals: TransactionTotals;
};

export function TransactionSummary({ totals }: TransactionSummaryProps) {
  const { formatCurrency } = useCurrency();
  const t = useTranslations("transactions");

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground px-1">
      <span>{t("summaryCount", { count: totals.count })}</span>
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
