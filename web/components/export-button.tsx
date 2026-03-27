"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { exportTransactions } from "@/lib/actions/transactions";
import type { FilterState, TransactionWithCategory } from "@/types";

type ExportButtonProps = {
  filter: FilterState;
};

function buildCsvRow(t: TransactionWithCategory): string {
  const description = (t.description ?? t.category?.name ?? "").replace(/"/g, '""');
  const category = (t.category?.name ?? "Uncategorized").replace(/"/g, '""');
  const sign = t.type === "expense" ? "-" : "";
  const amount = Math.abs(parseFloat(t.amount)).toFixed(2);
  return `"${t.date}","${description}","${category}",${t.type},${sign}${amount}`;
}

function downloadCsv(rows: TransactionWithCategory[]): void {
  const csv = [
    "date,description,category,type,amount",
    ...rows.map(buildCsvRow),
  ].join("\n");

  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const date = new Date().toISOString().split("T")[0];
  const a = document.createElement("a");
  a.href = url;
  a.download = `transactions-${date}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

export function ExportButton({ filter }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);
    try {
      const rows = await exportTransactions(filter);

      if (rows.length === 0) {
        toast.error("No transactions to export");
        return;
      }

      downloadCsv(rows);
    } catch {
      toast.error("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
      className="min-h-[44px]"
    >
      {isExporting ? "Exporting..." : "Export"}
    </Button>
  );
}
