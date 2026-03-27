"use client";

import { format } from "date-fns";
import { MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { formatCurrency, getTransactionColor } from "@/lib/finance-utils";
import { useTransactionSheet } from "@/components/transaction-sheet-context";
import type { TransactionWithCategory } from "@/types";

type TransactionItemProps = {
  transaction: TransactionWithCategory;
  onDelete?: (transaction: TransactionWithCategory) => void;
};

export function TransactionItem({ transaction, onDelete }: TransactionItemProps) {
  const { openEdit } = useTransactionSheet();

  const amountColor = getTransactionColor(transaction.type);

  return (
    <div className="rounded-xl border border-border bg-card p-4 motion-safe:transition-colors motion-safe:duration-150 hover:bg-muted/30">
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
        <div className="flex items-start gap-2">
          <div className="text-right">
            <p className="text-sm font-semibold" style={{ color: amountColor }}>
              {transaction.type === "expense" ? "-" : "+"}
              {formatCurrency(transaction.amount)}
            </p>
            <p className="text-xs text-muted-foreground">
              {format(new Date(transaction.date), "yyyy")}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="min-h-[44px] min-w-[44px] -mr-2 shrink-0">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEdit(transaction)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete?.(transaction)}
              >
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
