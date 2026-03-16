"use client";

import { useState } from "react";
import { updateFinancialProfile } from "@/lib/actions/financial-profile";
import { formatCurrency } from "@/lib/finance-utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import type { FinancialProfile } from "@/types";

type Buckets = {
  needs: number;
  wants: number;
  future: number;
};

type FinancialProfileSheetProps = {
  profile: FinancialProfile;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function FinancialProfileSheet({
  profile,
  open,
  onOpenChange,
}: FinancialProfileSheetProps) {
  const [income, setIncome] = useState(profile.monthlyIncomeTarget.toString());
  const [buckets, setBuckets] = useState<Buckets>({
    needs: Number(profile.needsPercentage),
    wants: Number(profile.wantsPercentage),
    future: Number(profile.futurePercentage),
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const total = buckets.needs + buckets.wants + buckets.future;
  const isValid = total === 100 && parseFloat(income) > 0;

  const incomeNum = parseFloat(income) || 0;

  function updateBucket(key: keyof Buckets, value: number) {
    setBuckets((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!isValid) return;
    setLoading(true);
    setError("");

    const result = await updateFinancialProfile({
      monthlyIncomeTarget: parseFloat(income),
      needsPercentage: buckets.needs,
      wantsPercentage: buckets.wants,
      futurePercentage: buckets.future,
    });

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    onOpenChange(false);
  }

  const BUCKETS: Array<{ key: keyof Buckets; label: string; color: string }> = [
    { key: "needs", label: "Needs", color: "#8b9a7e" },
    { key: "wants", label: "Wants", color: "#c97a5a" },
    { key: "future", label: "Future", color: "#a89562" },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-6">
        <SheetHeader className="text-left">
          <SheetTitle>Update financial profile</SheetTitle>
          <SheetDescription>
            Adjust your income target and allocation percentages.
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="income">Monthly income</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                $
              </span>
              <Input
                id="income"
                type="number"
                min="0.01"
                step="0.01"
                value={income}
                onChange={(event) => setIncome(event.target.value)}
                className="pl-7 text-lg font-semibold"
                inputMode="decimal"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Allocation split</Label>
              <span
                className={
                  total === 100
                    ? "text-xs text-income font-medium"
                    : "text-xs text-destructive font-medium"
                }
              >
                {total}% / 100%
              </span>
            </div>

            {BUCKETS.map(({ key, label, color }) => (
              <div key={key} className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span style={{ color }}>{label}</span>
                  <span className="font-semibold">{buckets[key]}%</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={buckets[key]}
                  onChange={(event) => updateBucket(key, Number(event.target.value))}
                  style={{ accentColor: color }}
                  aria-label={`${label} percentage`}
                />
                {incomeNum > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {formatCurrency((incomeNum * buckets[key]) / 100)} / month
                  </p>
                )}
              </div>
            ))}
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              className="flex-1"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={handleSave}
              disabled={!isValid || loading}
            >
              {loading ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
