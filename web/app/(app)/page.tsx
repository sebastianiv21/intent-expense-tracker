import Link from "next/link";
import { format } from "date-fns";
import { getDashboardData } from "@/lib/queries/dashboard";
import { getCategories } from "@/lib/queries/categories";
import { getBucketColor, formatCurrencyCompact, formatCurrency } from "@/lib/finance-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { TransactionItem } from "@/components/transaction-item";
import { PageHeader } from "@/components/page-header";
import { TransactionSheetProvider } from "@/components/transaction-sheet-context";
import { TransactionSheet } from "@/components/transaction-sheet";

export default async function DashboardPage() {
  const [data, categories] = await Promise.all([
    getDashboardData(),
    getCategories(),
  ]);
  const now = new Date();
  const dateLabel = format(now, "EEEE, MMM d");

  return (
    <TransactionSheetProvider>
      <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description={`Today is ${dateLabel}`}
        action={
          <Button asChild variant="outline" size="sm" className="hidden sm:inline-flex">
            <Link href="/transactions">View activity</Link>
          </Button>
        }
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">Monthly balance</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col gap-1">
            <span className="text-3xl font-semibold text-foreground">
              {formatCurrency(data.balance)}
            </span>
            <span className="text-sm text-muted-foreground">
              Income {formatCurrencyCompact(data.monthIncome)} · Expenses {formatCurrencyCompact(data.monthExpenses)}
            </span>
          </div>
        </CardContent>
      </Card>

      {data.bucketSummaries.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">50/30/20 harmony</h2>
            <span className="text-xs text-muted-foreground">This month</span>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2">
            {data.bucketSummaries.map((bucket) => (
              <Card key={bucket.bucket} className="min-w-[220px] flex-1">
                <CardContent className="space-y-3 p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-foreground">{bucket.label}</p>
                      <p className="text-xs text-muted-foreground">Target {formatCurrencyCompact(bucket.target)}</p>
                    </div>
                    <span
                      className="text-xs font-semibold"
                      style={{ color: bucket.color }}
                    >
                      {bucket.progress}%
                    </span>
                  </div>
                  <Progress
                    value={bucket.progress}
                    className="h-2"
                    style={{ backgroundColor: `${bucket.color}22` }}
                  />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Spent {formatCurrencyCompact(bucket.spent)}</span>
                    <span style={{ color: bucket.color }}>{bucket.label}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Daily avg spend</p>
            <p className="text-lg font-semibold text-foreground">
              {formatCurrencyCompact(data.quickStats.dailyAverage)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Safe to spend</p>
            <p className="text-lg font-semibold text-foreground">
              {formatCurrencyCompact(data.quickStats.safeToSpend)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 space-y-1">
            <p className="text-xs text-muted-foreground">Days remaining</p>
            <p className="text-lg font-semibold text-foreground">
              {data.quickStats.daysRemaining}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Recent transactions</CardTitle>
              <Button asChild variant="ghost" size="sm">
                <Link href="/transactions">View all</Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentTransactions.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No transactions yet. Add your first one to see insights here.
              </div>
            ) : (
              data.recentTransactions.map((transaction) => (
                <TransactionItem key={transaction.id} transaction={transaction} />
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Upcoming recurring</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.upcomingRecurring.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                No recurring items yet.
              </div>
            ) : (
              data.upcomingRecurring.map((recurring) => (
                <div
                  key={recurring.id}
                  className="flex items-center justify-between rounded-lg border border-border p-3"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg">
                      {recurring.category?.icon ?? "•"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        {recurring.description || recurring.category?.name || "Recurring"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Next {format(new Date(recurring.nextDueDate), "MMM d")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm font-semibold" style={{ color: getBucketColor(recurring.category?.allocationBucket ?? null) }}>
                    {formatCurrencyCompact(recurring.amount)}
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
      </div>

      <TransactionSheet categories={categories} />
    </TransactionSheetProvider>
  );
}
