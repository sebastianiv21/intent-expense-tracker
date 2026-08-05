import Link from "next/link";
import { isToday, isYesterday, parseISO } from "date-fns";
import { getFormatter, getTranslations } from "next-intl/server";
import { getDashboardData } from "@/lib/queries/dashboard";
import { getAuthenticatedUser } from "@/lib/queries/auth";

import { UpcomingRecurringList } from "@/components/upcoming-recurring-list";
import { Button } from "@/components/ui/button";
import { TransactionItem } from "@/components/transaction-item";
import { PageHeader } from "@/components/page-header";
import { BucketCard } from "@/components/bucket-card";
import { HeroBalanceCard } from "@/components/hero-balance-card";
import { toDisplayDate } from "@/lib/i18n/dates";
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

const GREETINGS = [
  [5, 12, "greetingMorning"],
  [12, 17, "greetingAfternoon"],
  [17, 21, "greetingEvening"],
] as const;

function greetingKey(hour: number) {
  return (
    GREETINGS.find(([start, end]) => hour >= start && hour < end)?.[2] ??
    "greetingNight"
  );
}

type DateGroup = {
  label: string;
  transactions: TransactionWithCategory[];
};

export default async function DashboardPage() {
  const [data, { name }, t, format] = await Promise.all([
    getDashboardData(),
    getAuthenticatedUser(),
    getTranslations("dashboard"),
    getFormatter(),
  ]);

  const now = new Date();
  const dateLabel = format.dateTime(now, "weekdayDayMonth");
  const greeting = t(greetingKey(now.getHours()));

  function groupByDate(transactions: TransactionWithCategory[]): DateGroup[] {
    const groups = new Map<string, TransactionWithCategory[]>();

    for (const tx of transactions) {
      const existing = groups.get(tx.date);
      if (existing) {
        existing.push(tx);
      } else {
        groups.set(tx.date, [tx]);
      }
    }

    return Array.from(groups.entries())
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([dateKey, txs]) => {
        // "Is this today?" is a question about the reader's own calendar, so it
        // stays on the local-midnight date; only the label is a display value.
        const local = parseISO(dateKey);
        const label = isToday(local)
          ? t("today")
          : isYesterday(local)
            ? t("yesterday")
            : format.dateTime(toDisplayDate(dateKey), "dayMonth");
        return { label, transactions: txs };
      });
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={name ? t("greetingWithName", { greeting, name }) : greeting}
        description={t("todayIs", { date: dateLabel })}
        action={
          <Button
            asChild
            variant="outline"
            size="sm"
            className="hidden sm:inline-flex"
          >
            <Link href="/transactions">{t("viewActivity")}</Link>
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
            <SectionHeading>
              {t("harmony", {
                split: data.bucketSummaries.map((b) => b.percentage).join("/"),
              })}
            </SectionHeading>
            <span className="text-xs text-muted-foreground">
              {t("thisMonth")}
            </span>
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
          <SectionHeading>{t("recentTransactions")}</SectionHeading>
          <Button asChild variant="ghost" size="sm">
            <Link href="/transactions">{t("viewAll")}</Link>
          </Button>
        </div>
        {data.recentTransactions.length === 0 ? (
          <EmptyState message={t("noTransactions")} />
        ) : (
          <div className="space-y-4">
            {groupByDate(
              data.recentTransactions as TransactionWithCategory[],
            ).map((group) => (
              <section key={group.label}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 pb-2 pt-1">
                  {group.label}
                </p>
                <div className="space-y-3">
                  {group.transactions.map((tx) => (
                    <TransactionItem key={tx.id} transaction={tx} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <SectionHeading>{t("upcomingRecurring")}</SectionHeading>
        </div>
        <UpcomingRecurringList items={data.upcomingRecurring} />
      </div>
    </div>
  );
}
