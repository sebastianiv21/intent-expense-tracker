"use client";

import { useFormatter, useTranslations } from "next-intl";
import { useCurrency } from "@/components/currency-provider";

type QuickStat = {
  label: string;
  value: string | number;
};

type HeroBalanceCardProps = {
  balance: number;
  monthIncome: number;
  monthExpenses: number;
  quickStats: {
    dailyAverage: number;
    safeToSpend: number;
    daysRemaining: number;
  };
};

function QuickStatItem({ label, value }: QuickStat) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-primary-foreground/70">{label}</span>
      <span className="text-sm font-semibold text-primary-foreground">
        {value}
      </span>
    </div>
  );
}

export function HeroBalanceCard({
  balance,
  monthIncome,
  monthExpenses,
  quickStats,
}: HeroBalanceCardProps) {
  const { formatCurrency, formatCurrencyCompact } = useCurrency();
  const t = useTranslations("dashboard");
  const format = useFormatter();

  return (
    <div className="relative overflow-hidden rounded-xl bg-primary">
      <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
      <div className="relative p-6 space-y-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-primary-foreground/70 uppercase tracking-wide">
            {t("monthlyBalance")}
          </span>
          <span className="text-4xl font-bold tracking-tight text-primary-foreground">
            {balance < 0
              ? `-${formatCurrency(Math.abs(balance))}`
              : formatCurrency(balance)}
          </span>
          <span className="text-xs text-primary-foreground/80">
            {t("incomeExpenses", {
              income: formatCurrencyCompact(monthIncome),
              expenses: formatCurrencyCompact(monthExpenses),
            })}
          </span>
        </div>
        <div className="flex items-center gap-6 border-t border-primary-foreground/20 pt-4">
          <QuickStatItem
            label={t("dailyAverage")}
            value={formatCurrencyCompact(quickStats.dailyAverage)}
          />
          <QuickStatItem
            label={t("safeToSpend")}
            value={formatCurrencyCompact(quickStats.safeToSpend)}
          />
          <QuickStatItem
            label={t("daysRemaining")}
            value={format.number(quickStats.daysRemaining, "integer")}
          />
        </div>
      </div>
    </div>
  );
}
