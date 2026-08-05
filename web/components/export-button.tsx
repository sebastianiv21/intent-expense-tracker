"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { exportTransactions } from "@/lib/actions/transactions";
import type { FilterState, TransactionWithCategory } from "@/types";

type ExportButtonProps = {
  filter: FilterState;
};

function buildCsvRow(
  t: TransactionWithCategory,
  uncategorized: string,
): string {
  const description = (t.description ?? t.category?.name ?? "").replace(/"/g, '""');
  const category = (t.category?.name ?? uncategorized).replace(/"/g, '""');
  const sign = t.type === "expense" ? "-" : "";
  const amount = Math.abs(parseFloat(t.amount)).toFixed(2);
  return `"${t.date}","${description}","${category}",${t.type},${sign}${amount}`;
}

function downloadCsv(
  rows: TransactionWithCategory[],
  header: string,
  uncategorized: string,
): void {
  const csv = [
    header,
    ...rows.map((row) => buildCsvRow(row, uncategorized)),
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
  const t = useTranslations("transactions");

  async function handleExport() {
    setIsExporting(true);
    try {
      const rows = await exportTransactions(filter);

      if (rows.length === 0) {
        toast.error(t("exportEmpty"));
        return;
      }

      // Column labels are prose and get translated; the ISO date and the
      // type enum next to them stay stable, so a saved spreadsheet formula
      // does not break when the reader switches language.
      downloadCsv(rows, t("csvHeader"), t("uncategorized"));
    } catch {
      toast.error(t("exportFailed"));
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
      {isExporting ? t("exporting") : t("export")}
    </Button>
  );
}
