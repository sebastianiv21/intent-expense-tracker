"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { ChevronDown, ChevronUp, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getTransactionColor } from "@/lib/finance-utils";
import { useCurrency } from "@/components/currency-provider";
import { useTransactionSheet } from "@/components/transaction-sheet-context";
import { toDisplayDate } from "@/lib/i18n/dates";
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
  const {
    formatCurrency: formatBase,
    formatCurrencyIn,
    currency: baseCurrency,
  } = useCurrency();
  const t = useTranslations("transactions");
  const tCommon = useTranslations("common");
  const format = useFormatter();

  const amountColor = getTransactionColor(transaction.type);
  const displayDate = toDisplayDate(transaction.date);

  const [expanded, setExpanded] = useState(false);

  const isForeign = transaction.currency !== baseCurrency;

  const sign = transaction.type === "expense" ? "-" : "+";
  const displayAmount = isForeign
    ? formatCurrencyIn(transaction.originalAmount, transaction.currency)
    : formatBase(transaction.amount);

  const rawRate = parseFloat(transaction.exchangeRate ?? "0");
  const invertedRate =
    isForeign && rawRate > 0
      ? format.number(Math.round(1 / rawRate), "integer")
      : null;

  const txLabel =
    transaction.description ||
    transaction.category?.name ||
    t("fallbackNameLower");

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
                t("fallbackName")}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              {format.dateTime(displayDate, "dayMonthYear")}
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
              aria-label={t("conversionToggle", {
                expanded: String(expanded),
                name: txLabel,
              })}
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
                aria-label={tCommon("optionsFor", { name: txLabel })}
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => openEdit(transaction)}>
                {tCommon("edit")}
              </DropdownMenuItem>
              {onDelete && (
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={() => onDelete(transaction)}
                >
                  {tCommon("delete")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      {isForeign && expanded && invertedRate !== null && (
        <div className="pt-2 pl-[52px]">
          <p className="text-xs text-muted-foreground">
            {t("conversionDetail", {
              amount: formatBase(transaction.amount),
              baseCurrency,
              rate: invertedRate,
              currency: transaction.currency,
              date: format.dateTime(displayDate, "dayMonthYear"),
            })}
          </p>
        </div>
      )}
    </div>
  );
}
