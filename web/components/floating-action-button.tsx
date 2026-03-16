"use client";

import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTransactionSheet } from "@/components/transaction-sheet-context";

export function FloatingActionButton() {
  const { openCreate } = useTransactionSheet();

  return (
    <Button
      type="button"
      onClick={openCreate}
      className="fixed bottom-24 right-5 z-40 h-14 w-14 rounded-full bg-accent text-accent-foreground shadow-lg hover:bg-accent/90 lg:hidden"
      aria-label="Add transaction"
    >
      <Plus className="h-5 w-5" />
    </Button>
  );
}
