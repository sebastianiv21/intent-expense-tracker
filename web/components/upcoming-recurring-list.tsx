"use client";

import { useFormatter, useTranslations } from "next-intl";
import { getBucketColor, getTransactionColor } from "@/lib/finance-utils";
import { useCurrency } from "@/components/currency-provider";
import { toDisplayDate } from "@/lib/i18n/dates";
import type { RecurringTransactionWithCategory } from "@/types";

type UpcomingRecurringListProps = {
  items: RecurringTransactionWithCategory[];
};

export function UpcomingRecurringList({ items }: UpcomingRecurringListProps) {
  const { formatCurrencyCompact } = useCurrency();
  const t = useTranslations("dashboard");
  const format = useFormatter();

  if (items.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
        {t("noRecurring")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((recurring) => (
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
                  {recurring.description ||
                    recurring.category?.name ||
                    t("recurringFallback")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("nextDue", {
                    date: format.dateTime(
                      toDisplayDate(recurring.nextDueDate),
                      "dayMonth",
                    ),
                  })}
                </p>
              </div>
            </div>
            <div
              className="text-right text-sm font-semibold"
              style={{
                color: recurring.category?.allocationBucket
                  ? getBucketColor(recurring.category.allocationBucket)
                  : getTransactionColor(recurring.type),
              }}
            >
              {formatCurrencyCompact(recurring.amount)}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
