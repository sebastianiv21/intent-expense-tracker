"use client";

import { useState, useTransition } from "react";
import { format, isToday, isYesterday, parseISO } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { TransactionItem } from "@/components/transaction-item";
import { TransactionSummary } from "@/components/transaction-summary";
import {
  deleteTransaction,
  loadMoreTransactions,
} from "@/lib/actions/transactions";
import type {
  FilterState,
  TransactionTotals,
  TransactionWithCategory,
} from "@/types";

type DateGroup = {
  dateKey: string;
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
        label = format(date, "MMM d, yyyy");
      }
      return { dateKey, label, transactions: txs };
    });
}

type TransactionListProps = {
  initialTransactions: TransactionWithCategory[];
  initialHasMore: boolean;
  filter: FilterState;
  totals: TransactionTotals;
};

export function TransactionList(props: TransactionListProps) {
  const [prevInitial, setPrevInitial] = useState(props.initialTransactions);
  const [rows, setRows] = useState<TransactionWithCategory[]>(
    props.initialTransactions,
  );
  const [hasMore, setHasMore] = useState(props.initialHasMore);

  // Sync local state when the server re-renders with fresh data (e.g. after router.refresh)
  if (props.initialTransactions !== prevInitial) {
    setPrevInitial(props.initialTransactions);
    setRows(props.initialTransactions);
    setHasMore(props.initialHasMore);
  }
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
        setRows((prev) => [...prev, ...result.transactions]);
        setHasMore(result.hasMore);
      } catch {
        setLoadError("Failed to load more. Please try again.");
      }
    });
  }

  function handleDelete(transaction: TransactionWithCategory) {
    const originalIndex = rows.findIndex((t) => t.id === transaction.id);
    setRows((prev) => prev.filter((t) => t.id !== transaction.id));

    // Use a ref object to track state across callbacks and prevent double-delete
    const state = { undone: false, deleted: false };

    function executeDelete() {
      if (state.undone || state.deleted) return;
      state.deleted = true;
      deleteTransaction(transaction.id).catch((err) => {
        console.error("Failed to delete transaction:", err);
      });
    }

    toast(
      `"${transaction.description ?? transaction.category?.name ?? "Transaction"}" deleted`,
      {
        duration: 5000,
        action: {
          label: "Undo",
          onClick: () => {
            state.undone = true;
            setRows((prev) => {
              const next = [...prev];
              const insertIndex = Math.min(originalIndex, next.length);
              next.splice(insertIndex, 0, transaction);
              return next;
            });
          },
        },
        onAutoClose: executeDelete,
        onDismiss: executeDelete,
      },
    );
  }

  const groups = groupByDate(rows);

  return (
    <div className="space-y-4">
      {props.totals.count > 0 && <TransactionSummary totals={props.totals} />}
      {groups.map((group) => (
        <section key={group.dateKey}>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground px-1 pb-2 pt-1">
            {group.label}
          </p>
          <div className="space-y-4">
            {group.transactions.map((t) => (
              <TransactionItem
                key={t.id}
                transaction={t}
                onDelete={handleDelete}
              />
            ))}
          </div>
        </section>
      ))}
      {hasMore && (
        <Button
          variant="outline"
          className="w-full min-h-11"
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
