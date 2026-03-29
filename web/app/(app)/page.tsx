import Link from "next/link";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { getDashboardData } from "@/lib/queries/dashboard";
import { getAuthenticatedUser } from "@/lib/queries/auth";
import { getBucketColor, formatCurrencyCompact, getTransactionColor } from "@/lib/finance-utils";
import { Button } from "@/components/ui/button";
import { TransactionItem } from "@/components/transaction-item";
import { PageHeader } from "@/components/page-header";
import { BucketCard } from "@/components/bucket-card";
import { HeroBalanceCard } from "@/components/hero-balance-card";
import type { TransactionWithCategory } from "@/types";

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
      {children}
    </h2>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
      {message}
    </div>
  );
}

function getGreeting(hour: number, name: string): string {
  const salutations: [number, number, string][] = [
    [5, 12, "Good morning"],
    [12, 17, "Good afternoon"],
    [17, 21, "Good evening"],
  ];
  
  const salutation = salutations.find(([start, end]) => hour >= start && hour < end)?.[2] ?? "Good night";
  return name ? `${salutation}, ${name}` : salutation;
}

type DateGroup = {
  label: string;
  transactions: TransactionWithCategory[];
};

function groupByDate(transactions: TransactionWithCategory[]): DateGroup[] {
  const groups = new Map<string, TransactionWithCategory[]>();
  
  for (const t of transactions) {
    const existing = groups.get(t.date);
    if (existing) {
      existing.push(t);
    } else {
      groups.set(t.date, [t]);
    }
  }

  return Array.from(groups.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([dateKey, txs]) => {
      const date = parseISO(dateKey);
      const label = isToday(date) ? "Today" : isYesterday(date) ? "Yesterday" : format(date, "MMM d");
      return { label, transactions: txs };
    });
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

      <HeroBalanceCard
        balance={data.balance}
        monthIncome={data.monthIncome}
        monthExpenses={data.monthExpenses}
        quickStats={data.quickStats}
      />

      {data.bucketSummaries.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <SectionHeading>50/30/20 harmony</SectionHeading>
            <span className="text-xs text-muted-foreground">This month</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {data.bucketSummaries.map((bucket) => (
              <BucketCard key={bucket.bucket} {...bucket} />
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionHeading>Recent transactions</SectionHeading>
          <Button asChild variant="ghost" size="sm">
            <Link href="/transactions">View all</Link>
          </Button>
        </div>
        {data.recentTransactions.length === 0 ? (
          <EmptyState message="No transactions yet. Add your first one to see insights here." />
        ) : (
          <div className="space-y-4">
            {groupByDate(data.recentTransactions as TransactionWithCategory[]).map((group) => (
              <section key={group.label}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 pb-2 pt-1">
                  {group.label}
                </p>
                <div className="space-y-3">
                  {group.transactions.map((t) => (
                    <TransactionItem key={t.id} transaction={t} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionHeading>Upcoming recurring</SectionHeading>
        </div>
        {data.upcomingRecurring.length === 0 ? (
          <EmptyState message="No recurring items yet." />
        ) : (
          <div className="space-y-3">
            {data.upcomingRecurring.map((recurring) => (
              <div
                key={recurring.id}
                className="rounded-xl border border-border bg-card p-4 motion-safe:transition-colors motion-safe:duration-150 hover:bg-muted/30"
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg">
                      {recurring.category?.icon ?? "•"}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {recurring.description || recurring.category?.name || "Recurring"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Next {format(new Date(recurring.nextDueDate), "MMM d")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-sm font-semibold" style={{ color: recurring.category?.allocationBucket ? getBucketColor(recurring.category.allocationBucket) : getTransactionColor(recurring.type) }}>
                    {formatCurrencyCompact(recurring.amount)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
