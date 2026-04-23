"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { ChevronDown, ChevronUp, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getTransactionColor, formatCurrency as formatCurrencyRaw } from "@/lib/finance-utils";
import { useCurrency } from "@/components/currency-provider";
import { useTransactionSheet } from "@/components/transaction-sheet-context";
import type { TransactionWithCategory } from "@/types";

type TransactionItemProps = {
  transaction: TransactionWithCategory;
  onDelete?: (transaction: TransactionWithCategory) => void;
};

export function TransactionItem({
  transaction,
  onDelete,
}: TransactionItemProps) {
  const { openEdit } = useTransactionSheet();
  const { formatCurrency: formatBase, currency: baseCurrency } = useCurrency();

  const amountColor = getTransactionColor(transaction.type);
  const parsedDate = parseISO(transaction.date);

  const [expanded, setExpanded] = useState(false);

  const isForeign = transaction.currency !== baseCurrency;

  const sign = transaction.type === "expense" ? "-" : "+";
  const displayAmount = isForeign
    ? formatCurrencyRaw(transaction.originalAmount, transaction.currency)
    : formatBase(transaction.amount);

  const rawRate = parseFloat(transaction.exchangeRate ?? "0");
  const invertedRate =
    isForeign && rawRate > 0
      ? Math.round(1 / rawRate).toLocaleString("en-US")
      : null;

  const txLabel =
    transaction.description || transaction.category?.name || "transaction";

  return (
    <div className="rounded-xl border border-border bg-card p-4 motion-safe:transition-colors motion-safe:duration-150 hover:bg-muted/30">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg shrink-0">
            {transaction.category?.icon ?? "•"}
          </div>
          <div className="min-w-0">
            <p className="font-medium text-foreground truncate">
              {transaction.description ||
                transaction.category?.name ||
                "Transaction"}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {format(parsedDate, "MMM d, yyyy")}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right">
            <p
              className="text-sm font-semibold whitespace-nowrap"
              style={{ color: amountColor }}
            >
              {`${sign}${displayAmount}`}
            </p>
          </div>
          {isForeign && (
            <Button
              variant="ghost"
              size="icon"
              className="min-h-11 min-w-11 shrink-0"
              aria-expanded={expanded}
              aria-label={`${expanded ? "Hide" : "Show"} conversion details for ${txLabel}`}
              onClick={() => setExpanded((prev) => !prev)}
            >
              {expanded ? (
                <ChevronUp className="h-4 w-4" style={{ color: "var(--accent)" }} />
              ) : (
                <ChevronDown className="h-4 w-4" style={{ color: "var(--accent)" }} />
              )}
            </Button>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="min-h-11 min-w-11 -mr-2 shrink-0"
                aria-label={`Options for ${transaction.description || transaction.category?.name || "transaction"}`}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEdit(transaction)}>
                Edit
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(transaction)}
                >
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {isForeign && expanded && invertedRate !== null && (
        <div className="pt-2 pl-[52px]">
          <p className="text-xs text-muted-foreground">
            {`→ ${formatBase(transaction.amount)} ${baseCurrency}  ·  ${invertedRate} ${transaction.currency}/${baseCurrency}  ·  ${format(parsedDate, "MMM d, yyyy")}`}
          </p>
        </div>
      )}
    </div>
  );
}
