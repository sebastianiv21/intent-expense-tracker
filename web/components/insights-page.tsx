"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatCurrencyCompact, getBucketColor } from "@/lib/finance-utils";
import type { AllocationBucket } from "@/types";

const PieChart = dynamic(() => import("recharts").then((mod) => mod.PieChart), {
  ssr: false,
});
const Pie = dynamic(() => import("recharts").then((mod) => mod.Pie), { ssr: false });
const Cell = dynamic(() => import("recharts").then((mod) => mod.Cell), { ssr: false });
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false }
);
const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), {
  ssr: false,
});
const Bar = dynamic(() => import("recharts").then((mod) => mod.Bar), { ssr: false });
const XAxis = dynamic(() => import("recharts").then((mod) => mod.XAxis), { ssr: false });
const YAxis = dynamic(() => import("recharts").then((mod) => mod.YAxis), { ssr: false });
const Tooltip = dynamic(() => import("recharts").then((mod) => mod.Tooltip), {
  ssr: false,
});

type InsightsPageProps = {
  insights: {
    totalExpenses: number;
    totalIncome: number;
    balance: number;
    spendingByCategory: Array<{ name: string; value: number; bucket: AllocationBucket }>;
    transactionCount: number;
  };
  allocation: {
    income: number;
    targets: Record<AllocationBucket, number>;
    actual: Record<AllocationBucket, number>;
  };
};

const PERIODS = [
  { label: "This Month", value: "month" },
  { label: "3 Months", value: "3months" },
  { label: "6 Months", value: "6months" },
  { label: "Year", value: "year" },
] as const;

export function InsightsPage({ insights, allocation }: InsightsPageProps) {
  const [period, setPeriod] = useState<(typeof PERIODS)[number]["value"]>("month");
  const isPeriodLocked = true;

  const bucketData = useMemo(() => {
    return (Object.keys(allocation.actual) as AllocationBucket[]).map((bucket) => ({
      name: bucket,
      value: allocation.actual[bucket],
      color: getBucketColor(bucket),
      target: allocation.targets[bucket],
    }));
  }, [allocation]);

  const complianceScore = useMemo(() => {
    const totals = bucketData.reduce((sum, item) => sum + item.value, 0);
    if (totals === 0) return 0;
    const targetTotal = bucketData.reduce((sum, item) => sum + item.target, 0);
    if (targetTotal === 0) return 0;
    const diff = bucketData.reduce(
      (sum, item) => sum + Math.abs(item.value - item.target),
      0
    );
    return Math.max(0, Math.round(100 - (diff / targetTotal) * 100));
  }, [bucketData]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Insights</h1>
          <p className="text-sm text-muted-foreground">
            Track allocation performance and spending patterns.
          </p>
        </div>
        <div className="text-xs text-muted-foreground">
          Updated {format(new Date(), "MMM d")}
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {PERIODS.map((option) => (
          <Button
            key={option.value}
            variant={period === option.value ? "default" : "outline"}
            size="sm"
            className="min-h-[44px]"
            onClick={() => setPeriod(option.value)}
            disabled={isPeriodLocked}
          >
            {option.label}
          </Button>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">50/30/20 compliance</p>
                <p className="text-xs text-muted-foreground">Allocation vs target</p>
              </div>
              <span className="text-2xl font-semibold text-foreground">
                {complianceScore}%
              </span>
            </div>

            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bucketData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                  >
                    {bucketData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => formatCurrencyCompact(Number(value ?? 0))}
                    contentStyle={{ background: "var(--popover)", borderColor: "var(--border)" }}
                    itemStyle={{ color: "var(--foreground)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            <div className="grid gap-2">
              {bucketData.map((bucket) => (
                <div key={bucket.name} className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground capitalize">{bucket.name}</span>
                  <span className="text-foreground">
                    {formatCurrencyCompact(bucket.value)} / {formatCurrencyCompact(bucket.target)}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 space-y-3">
            <p className="text-sm font-medium text-foreground">Summary</p>
            <div className="grid gap-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total income</span>
                <span className="text-foreground">
                  {formatCurrencyCompact(insights.totalIncome)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Total expenses</span>
                <span className="text-foreground">
                  {formatCurrencyCompact(insights.totalExpenses)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Balance</span>
                <span className="text-foreground">
                  {formatCurrencyCompact(insights.balance)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Transactions</span>
                <span className="text-foreground">{insights.transactionCount}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Spending by category</p>
              <p className="text-xs text-muted-foreground">Expense totals</p>
            </div>
          </div>

          {insights.spendingByCategory.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
              No spending data yet.
            </div>
          ) : (
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={insights.spendingByCategory} barSize={24}>
                  <XAxis dataKey="name" tick={{ fill: "var(--muted-foreground)" }} />
                  <YAxis tick={{ fill: "var(--muted-foreground)" }} />
                  <Tooltip
                    formatter={(value) => formatCurrencyCompact(Number(value ?? 0))}
                    contentStyle={{ background: "var(--popover)", borderColor: "var(--border)" }}
                    itemStyle={{ color: "var(--foreground)" }}
                  />
                  <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                    {insights.spendingByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={getBucketColor(entry.bucket)} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {(Object.keys(allocation.actual) as AllocationBucket[]).map((bucket) => {
          const actual = allocation.actual[bucket];
          const target = allocation.targets[bucket];
          const variance = actual - target;

          return (
            <Card key={bucket}>
              <CardContent className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground capitalize">{bucket}</p>
                  <span
                    className="text-xs font-semibold"
                    style={{ color: getBucketColor(bucket) }}
                  >
                    {variance >= 0 ? "+" : ""}
                    {formatCurrencyCompact(variance)}
                  </span>
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatCurrencyCompact(actual)} / {formatCurrencyCompact(target)}
                </div>
                <div
                  className={cn(
                    "h-2 rounded-full",
                    variance > 0 ? "bg-destructive/30" : "bg-secondary"
                  )}
                >
                  <div
                    className="h-2 rounded-full"
                    style={{
                      width: `${Math.min(100, (actual / (target || 1)) * 100)}%`,
                      backgroundColor: getBucketColor(bucket),
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
