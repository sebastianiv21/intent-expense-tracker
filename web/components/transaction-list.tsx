"use client";

import { useState, useTransition } from "react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TransactionItem } from "@/components/transaction-item";
import { TransactionSummary } from "@/components/transaction-summary";
import { deleteTransaction, loadMoreTransactions } from "@/lib/actions/transactions";
import type { FilterState, TransactionTotals, TransactionWithCategory } from "@/types";

type DateGroup = {
  label: string;
  transactions: TransactionWithCategory[];
};

function groupByDate(transactions: TransactionWithCategory[]): DateGroup[] {
  const groups: Map<string, TransactionWithCategory[]> = new Map();

  for (const t of transactions) {
    const dateKey = t.date;
    if (!groups.has(dateKey)) {
      groups.set(dateKey, []);
    }
    groups.get(dateKey)!.push(t);
  }

  return Array.from(groups.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([dateKey, txs]) => {
      const date = parseISO(dateKey);
      let label: string;
      if (isToday(date)) {
        label = "Today";
      } else if (isYesterday(date)) {
        label = "Yesterday";
      } else {
        label = format(date, "MMM d");
      }
      return { label, transactions: txs };
    });
}

type TransactionListProps = {
  initialTransactions: TransactionWithCategory[];
  initialHasMore: boolean;
  filter: FilterState;
  totals: TransactionTotals;
};

export function TransactionList(props: TransactionListProps) {
  const [rows, setRows] = useState<TransactionWithCategory[]>(props.initialTransactions);
  const [hasMore, setHasMore] = useState(props.initialHasMore);
  const [isPending, startTransition] = useTransition();
  const [loadError, setLoadError] = useState<string | null>(null);

  function handleLoadMore() {
    startTransition(async () => {
      setLoadError(null);
      try {
        const result = await loadMoreTransactions({
          limit: 50,
          offset: rows.length,
          type: props.filter.type,
          search: props.filter.search,
        });
        setRows(prev => [...prev, ...result.transactions]);
        setHasMore(result.hasMore);
      } catch {
        setLoadError("Failed to load more. Please try again.");
      }
    });
  }

  function handleDelete(transaction: TransactionWithCategory) {
    const originalIndex = rows.findIndex(t => t.id === transaction.id);
    setRows(prev => prev.filter(t => t.id !== transaction.id));

    let undone = false;
    toast(`"${transaction.description ?? transaction.category?.name ?? "Transaction"}" deleted`, {
      duration: 5000,
      action: {
        label: "Undo",
        onClick: () => {
          undone = true;
          setRows(prev => {
            const next = [...prev];
            next.splice(originalIndex, 0, transaction);
            return next;
          });
        },
      },
      onAutoClose: () => {
        if (!undone) deleteTransaction(transaction.id);
      },
      onDismiss: () => {
        if (!undone) deleteTransaction(transaction.id);
      },
    });
  }

  const groups = groupByDate(rows);

  return (
    <div className="space-y-4">
      {props.totals.count > 0 && <TransactionSummary totals={props.totals} />}
      {groups.map((group) => (
        <section key={group.label}>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 pb-2 pt-1">
            {group.label}
          </p>
          <div className="space-y-4">
            {group.transactions.map((t) => (
              <TransactionItem key={t.id} transaction={t} onDelete={handleDelete} />
            ))}
          </div>
        </section>
      ))}
      {hasMore && (
        <Button
          variant="outline"
          className="w-full min-h-[44px]"
          onClick={handleLoadMore}
          disabled={isPending}
        >
          {isPending ? "Loading..." : "Load more"}
        </Button>
      )}
      {loadError && (
        <p className="text-sm text-destructive text-center" role="alert">
          {loadError}{" "}
          <button className="underline" onClick={handleLoadMore}>
            Retry
          </button>
        </p>
      )}
    </div>
  );
}
