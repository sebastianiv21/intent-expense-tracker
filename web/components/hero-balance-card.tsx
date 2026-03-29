"use client";

import { cn } from "@/lib/utils";
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

  return (
    <div className="relative overflow-hidden rounded-xl bg-primary">
      <div className="absolute inset-0 bg-gradient-to-br from-primary to-primary/80" />
      <div className="relative p-6 space-y-4">
        <div className="flex flex-col gap-1">
          <span className="text-xs font-medium text-primary-foreground/70 uppercase tracking-wide">
            Monthly balance
          </span>
          <span
            className={cn(
              "text-4xl font-bold tracking-tight",
              balance < 0 ? "text-destructive" : "text-primary-foreground",
            )}
          >
            {formatCurrency(balance)}
          </span>
          <span className="text-xs text-primary-foreground/80">
            Income {formatCurrencyCompact(monthIncome)} · Expenses{" "}
            {formatCurrencyCompact(monthExpenses)}
          </span>
        </div>
        <div className="flex items-center gap-6 border-t border-primary-foreground/20 pt-4">
          <QuickStatItem
            label="Daily avg spend"
            value={formatCurrencyCompact(quickStats.dailyAverage)}
          />
          <QuickStatItem
            label="Safe to spend"
            value={formatCurrencyCompact(quickStats.safeToSpend)}
          />
          <QuickStatItem
            label="Days remaining"
            value={quickStats.daysRemaining}
          />
        </div>
      </div>
    </div>
  );
}
