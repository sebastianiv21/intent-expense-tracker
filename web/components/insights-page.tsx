"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { Cell, Pie, Bar, XAxis, YAxis, Tooltip } from "recharts";
import { format, addMonths, subMonths } from "date-fns";
import { useFormatter, useTranslations } from "next-intl";
import {
  Home,
  Coffee,
  PiggyBank,
  ChevronLeft,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { getBucketColor, getTransactionColor } from "@/lib/finance-utils";
import { formatPercent } from "@/lib/i18n/money";
import { useCurrency } from "@/components/currency-provider";
import type { AllocationBucket } from "@/types";

// Only container-level Recharts components need dynamic import to avoid SSR.
// Child components (Cell, Pie, Bar, XAxis, YAxis, Tooltip) are imported directly
// because Recharts identifies them by component type — wrapping with next/dynamic
// breaks that identity and causes props like `fill` on Cell to be silently ignored.
const PieChart = dynamic(() => import("recharts").then((mod) => mod.PieChart), {
  ssr: false,
});
const ResponsiveContainer = dynamic(
  () => import("recharts").then((mod) => mod.ResponsiveContainer),
  { ssr: false },
);
const BarChart = dynamic(() => import("recharts").then((mod) => mod.BarChart), {
  ssr: false,
});

type InsightsPageProps = {
  insights: {
    totalExpenses: number;
    totalIncome: number;
    balance: number;
    spendingByCategory: Array<{
      name: string;
      icon: string | null;
      value: number;
      bucket: AllocationBucket;
    }>;
    transactionCount: number;
  };
  allocation: {
    income: number;
    targets: Record<AllocationBucket, number>;
    actual: Record<AllocationBucket, number>;
  };
  initialMonth: string;
};

const ANIMATION = {
  complianceChart: { begin: 100, duration: 800, easing: "ease-out" },
  spendingChart: { begin: 300, duration: 800, easing: "ease-out" },
} as const;

const BUCKET_ICONS: Record<AllocationBucket, LucideIcon> = {
  needs: Home,
  wants: Coffee,
  future: PiggyBank,
};

export function InsightsPage({
  insights,
  allocation,
  initialMonth,
}: InsightsPageProps) {
  const router = useRouter();
  const { formatCurrencyCompact } = useCurrency();
  const t = useTranslations("insights");
  const tCommon = useTranslations("common");
  const tBuckets = useTranslations("buckets");
  const intl = useFormatter();
  const [month, setMonth] = useState(initialMonth);
  const monthDate = new Date(`${month}-01T00:00:00`);

  const bucketSplitLabel = useMemo(() => {
    if (allocation.income <= 0) return t("complianceFallback");
    const parts = (["needs", "wants", "future"] as AllocationBucket[]).map(
      (bucket) =>
        Math.round((allocation.targets[bucket] / allocation.income) * 100),
    );
    return t("compliance", { split: parts.join("/") });
  }, [allocation, t]);

  const bucketData = useMemo(() => {
    return (Object.keys(allocation.actual) as AllocationBucket[]).map(
      (bucket) => ({
        name: bucket,
        value: allocation.actual[bucket],
        color: getBucketColor(bucket),
        target: allocation.targets[bucket],
      }),
    );
  }, [allocation]);

  const complianceScore = useMemo(() => {
    const totals = bucketData.reduce((sum, item) => sum + item.value, 0);
    const targetTotal = bucketData.reduce((sum, item) => sum + item.target, 0);
    if (totals === 0 || targetTotal === 0) return 0;

    const diff = bucketData.reduce(
      (sum, item) => sum + Math.abs(item.value - item.target),
      0,
    );
    return Math.max(0, Math.round(100 - (diff / targetTotal) * 100));
  }, [bucketData]);

  const hasData = bucketData.some((b) => b.value > 0);
  const hasIncomeTarget = allocation.income > 0;
  const showEmptyState = !hasData || !hasIncomeTarget;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {t("title")}
          </h1>
          <p className="text-sm text-muted-foreground">{t("description")}</p>
        </div>
        <div className="text-xs text-muted-foreground">
          {t("updated", {
            date: intl.dateTime(new Date(), "dayMonth"),
          })}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border bg-card p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            const newMonth = format(subMonths(monthDate, 1), "yyyy-MM");
            setMonth(newMonth);
            router.push(`/insights?month=${newMonth}`);
          }}
          aria-label={tCommon("previousMonth")}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <p className="text-sm font-medium text-foreground">
          {intl.dateTime(monthDate, "monthYear")}
        </p>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            const newMonth = format(addMonths(monthDate, 1), "yyyy-MM");
            setMonth(newMonth);
            router.push(`/insights?month=${newMonth}`);
          }}
          aria-label={tCommon("nextMonth")}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {bucketSplitLabel}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("allocationVsTarget")}
                </p>
              </div>
              <span className="text-3xl font-bold text-foreground tabular-nums">
                {showEmptyState ? "—" : formatPercent(intl, complianceScore)}
              </span>
            </div>

            <div className="h-48 sm:h-56 md:h-64 lg:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={bucketData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    animationBegin={ANIMATION.complianceChart.begin}
                    animationDuration={ANIMATION.complianceChart.duration}
                    animationEasing={ANIMATION.complianceChart.easing}
                  >
                    {bucketData.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) =>
                      formatCurrencyCompact(Number(value ?? 0))
                    }
                    contentStyle={{
                      background: "var(--popover)",
                      borderColor: "var(--border)",
                    }}
                    itemStyle={{ color: "var(--foreground)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {!hasData || !hasIncomeTarget ? (
              <div className="rounded-xl border border-dashed border-border p-6 text-center">
                <p className="text-sm text-muted-foreground">
                  {hasIncomeTarget
                    ? t("emptyNoExpenses")
                    : t("emptyNoIncome")}
                </p>
              </div>
            ) : (
              <div className="grid gap-2">
                {bucketData.map((bucket) => {
                  const Icon = BUCKET_ICONS[bucket.name];
                  return (
                    <div
                      key={bucket.name}
                      className="flex items-center justify-between text-xs"
                    >
                      <span
                        className="flex items-center gap-1.5"
                        style={{ color: bucket.color }}
                      >
                        <Icon className="h-3 w-3" />
                        {tBuckets(bucket.name)}
                      </span>
                      <span className="text-foreground tabular-nums">
                        {formatCurrencyCompact(bucket.value)} /{" "}
                        {formatCurrencyCompact(bucket.target)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-5 space-y-4">
            <p className="text-sm font-semibold text-foreground">
              {t("summary")}
            </p>
            <div className="grid gap-3">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("totalIncome")}
                </span>
                <span className="text-foreground tabular-nums font-medium">
                  {formatCurrencyCompact(insights.totalIncome)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("totalExpenses")}
                </span>
                <span className="text-foreground tabular-nums font-medium">
                  {formatCurrencyCompact(insights.totalExpenses)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm pt-1 border-t border-border">
                <span className="text-muted-foreground">{t("balance")}</span>
                <span
                  className={cn(
                    "tabular-nums font-semibold",
                    insights.balance < 0
                      ? "text-destructive"
                      : "text-foreground",
                  )}
                >
                  {formatCurrencyCompact(insights.balance)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("transactions")}
                </span>
                <span className="text-foreground tabular-nums font-medium">
                  {t("transactionCount", {
                    count: insights.transactionCount,
                    formatted: intl.number(
                      insights.transactionCount,
                      "integer",
                    ),
                  })}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="overflow-hidden">
        <CardContent className="p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-foreground">
                {t("spendingByCategory")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("spendingByCategoryHint")}
              </p>
            </div>
          </div>

          {insights.spendingByCategory.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-8 text-center">
              <p className="text-sm text-muted-foreground">
                {t("emptyNoCategorized")}
              </p>
            </div>
          ) : (
            <div className="h-56 sm:h-64 lg:h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={insights.spendingByCategory}
                  barSize={20}
                  margin={{ left: 8, right: 16 }}
                >
                  <XAxis
                    dataKey="icon"
                    tick={{ fill: "var(--muted-foreground)", fontSize: 16 }}
                    tickLine={false}
                    axisLine={false}
                    height={36}
                    allowDuplicatedCategory={false}
                  />
                  <YAxis
                    tick={{ fill: "var(--muted-foreground)", fontSize: 11 }}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) =>
                      formatCurrencyCompact(Number(value))
                    }
                  />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null;
                      const data = payload[0].payload;
                      return (
                        <div
                          className="rounded-lg border border-border bg-popover px-3 py-2 text-sm shadow-lg"
                          style={{ fontSize: "12px" }}
                        >
                          <div className="flex items-center gap-2 text-foreground">
                            <span className="text-base">{data.icon}</span>
                            <span>{data.name}</span>
                            <span className="font-medium">
                              {formatCurrencyCompact(Number(data.value ?? 0))}
                            </span>
                          </div>
                        </div>
                      );
                    }}
                    cursor={{ fill: "var(--muted)", opacity: 0.3 }}
                  />
                  <Bar
                    dataKey="value"
                    radius={[4, 4, 0, 0]}
                    animationBegin={ANIMATION.spendingChart.begin}
                    animationDuration={ANIMATION.spendingChart.duration}
                    animationEasing={ANIMATION.spendingChart.easing}
                  >
                    {insights.spendingByCategory.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={
                          entry.bucket
                            ? getBucketColor(entry.bucket)
                            : getTransactionColor("expense")
                        }
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-4 sm:grid-cols-3">
        {(Object.keys(allocation.actual) as AllocationBucket[]).map(
          (bucket) => {
            const actual = allocation.actual[bucket];
            const target = allocation.targets[bucket];
            const variance = actual - target;
            const Icon = BUCKET_ICONS[bucket];
            const isOverBudget = variance > 0;
            const percentage = target > 0 ? (actual / target) * 100 : 0;
            const displayPercentage = Math.min(percentage, 100);
            const overagePercentage = Math.max(0, percentage - 100);

            return (
              <Card
                key={bucket}
                className={cn(isOverBudget && "border-destructive/50")}
              >
                <CardContent className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <p
                      className="flex items-center gap-1.5 text-sm font-semibold"
                      style={{ color: getBucketColor(bucket) }}
                    >
                      <Icon className="h-4 w-4" />
                      {tBuckets(bucket)}
                    </p>
                    <span
                      className={cn(
                        "text-xs font-bold tabular-nums",
                        isOverBudget
                          ? "text-destructive"
                          : "text-muted-foreground",
                      )}
                    >
                      {variance >= 0 ? "+" : ""}
                      {formatCurrencyCompact(variance)}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {t("actual")}
                      </span>
                      <span className="text-foreground tabular-nums font-medium">
                        {formatCurrencyCompact(actual)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {t("target")}
                      </span>
                      <span className="text-muted-foreground tabular-nums">
                        {formatCurrencyCompact(target)}
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="relative h-2 rounded-full bg-secondary overflow-hidden">
                      <div
                        className="absolute h-2 rounded-full transition-all"
                        style={{
                          width: `${displayPercentage}%`,
                          backgroundColor: getBucketColor(bucket),
                        }}
                      />
                      {overagePercentage > 0 && (
                        <div
                          className="absolute h-2 rounded-full bg-destructive/70"
                          style={{
                            left: `${displayPercentage}%`,
                            width: `${Math.min(overagePercentage, 20)}%`,
                          }}
                        />
                      )}
                    </div>
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>{formatPercent(intl, 0)}</span>
                      <span
                        className={cn(
                          isOverBudget && "text-destructive font-medium",
                        )}
                      >
                        {formatPercent(intl, percentage)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          },
        )}
      </div>
    </div>
  );
}
