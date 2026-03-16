"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatCurrency, getTransactionColor } from "@/lib/finance-utils";
import { deleteTransaction } from "@/lib/actions/transactions";
import { useTransactionSheet } from "@/components/transaction-sheet-context";
import type { TransactionWithCategory } from "@/types";

type TransactionItemProps = {
  transaction: TransactionWithCategory;
};

export function TransactionItem({ transaction }: TransactionItemProps) {
  const { openEdit } = useTransactionSheet();
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setIsDeleting(true);
    setError("");
    const result = await deleteTransaction(transaction.id);
    if (!result.success) {
      setError(result.error);
      setIsDeleting(false);
      return;
    }
  }

  const amountColor = getTransactionColor(transaction.type);

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg">
            {transaction.category?.icon ?? "•"}
          </div>
          <div>
            <p className="font-medium text-foreground">
              {transaction.description || transaction.category?.name || "Transaction"}
            </p>
            <p className="text-xs text-muted-foreground">
              {transaction.category?.name ?? "Uncategorized"} • {format(new Date(transaction.date), "MMM d")}
            </p>
          </div>
        </div>
        <div className="text-right">
          <p className="text-sm font-semibold" style={{ color: amountColor }}>
            {transaction.type === "expense" ? "-" : "+"}
            {formatCurrency(transaction.amount)}
          </p>
          <p className="text-xs text-muted-foreground">
            {format(new Date(transaction.date), "yyyy")}
          </p>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="min-h-[44px]"
          onClick={() => openEdit(transaction)}
          aria-label={`Edit ${transaction.description || transaction.category?.name || "transaction"}`}
        >
          <Pencil className="h-4 w-4" />
          Edit
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="min-h-[44px] text-destructive hover:text-destructive"
          onClick={handleDelete}
          disabled={isDeleting}
          aria-label={`Delete ${transaction.description || transaction.category?.name || "transaction"}`}
        >
          <Trash2 className="h-4 w-4" />
          {isDeleting ? "Deleting…" : "Delete"}
        </Button>
      </div>

      {error && (
        <p className="mt-2 text-xs text-destructive" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
