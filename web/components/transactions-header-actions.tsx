"use client";

import { Plus } from "lucide-react";
import { ExportButton } from "@/components/export-button";
import { useTransactionSheet } from "@/components/transaction-sheet-context";
import { Button } from "@/components/ui/button";
import type { FilterState } from "@/types";

type TransactionsHeaderActionsProps = {
  filter: FilterState;
};

export function TransactionsHeaderActions({
  filter,
}: TransactionsHeaderActionsProps) {
  const { openCreate } = useTransactionSheet();

  return (
    <div className="flex items-center gap-2">
      <ExportButton filter={filter} />
      <Button
        type="button"
        variant="default"
        size="sm"
        onClick={openCreate}
        className="hidden min-h-[44px] lg:inline-flex"
      >
        <Plus className="h-4 w-4" />
        <span className="ml-1">Add transaction</span>
      </Button>
    </div>
  );
}
