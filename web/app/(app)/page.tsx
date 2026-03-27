import Link from "next/link";
import { format } from "date-fns";
import { getDashboardData } from "@/lib/queries/dashboard";
import { getAuthenticatedUser } from "@/lib/queries/auth";
import { getBucketColor, formatCurrencyCompact, formatCurrency } from "@/lib/finance-utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { TransactionItem } from "@/components/transaction-item";
import { PageHeader } from "@/components/page-header";
import { BucketCard } from "@/components/bucket-card";
import { cn } from "@/lib/utils";

function QuickStat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm font-semibold text-foreground">{value}</span>
    </div>
  );
}

function getGreeting(hour: number, name: string): string {
  let salutation: string;
  if (hour >= 5 && hour < 12) salutation = "Good morning";
  else if (hour >= 12 && hour < 17) salutation = "Good afternoon";
  else if (hour >= 17 && hour < 21) salutation = "Good evening";
  else salutation = "Good night";
  return name ? `${salutation}, ${name}` : salutation;
}

export default async function DashboardPage() {
  const [data, { name }] = await Promise.all([getDashboardData(), getAuthenticatedUser()]);
  const now = new Date();
  const dateLabel = format(now, "EEEE, MMM d");
  const greeting = getGreeting(now.getHours(), name);

  return (
    <div className="space-y-6">
      <PageHeader
        title={greeting}
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
            <span className={cn("text-4xl font-bold tracking-tight", data.balance < 0 ? "text-destructive" : "text-foreground")}>
              {formatCurrency(data.balance)}
            </span>
            <span className="text-xs text-muted-foreground">
              Income {formatCurrencyCompact(data.monthIncome)} · Expenses {formatCurrencyCompact(data.monthExpenses)}
            </span>
          </div>
          <div className="flex items-center gap-6 border-t border-border pt-4">
            <QuickStat label="Daily avg spend" value={formatCurrencyCompact(data.quickStats.dailyAverage)} />
            <QuickStat label="Safe to spend" value={formatCurrencyCompact(data.quickStats.safeToSpend)} />
            <QuickStat label="Days remaining" value={data.quickStats.daysRemaining} />
          </div>
        </CardContent>
      </Card>

      {data.bucketSummaries.length > 0 ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">50/30/20 harmony</h2>
            <span className="text-xs text-muted-foreground">This month</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {data.bucketSummaries.map((bucket) => (
              <BucketCard key={bucket.bucket} {...bucket} />
            ))}
          </div>
        </div>
      ) : null}

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
                  className="flex items-center justify-between rounded-lg border border-border p-3 motion-safe:transition-colors motion-safe:duration-150 hover:bg-muted/30 cursor-default"
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
  );
}
