"use client";

import { useEffect, useState } from "react";
import { updateFinancialProfile } from "@/lib/actions/financial-profile";
import {
  formatCurrency,
  BUCKET_DEFINITIONS,
  BUCKET_ORDER,
} from "@/lib/finance-utils";
import { cn } from "@/lib/utils";
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

function getAmountFontSize(len: number): string {
  if (len <= 5) return "text-5xl";
  if (len <= 7) return "text-4xl";
  if (len <= 9) return "text-3xl";
  return "text-2xl";
}

function bucketsFromProfile(profile: FinancialProfile) {
  return {
    needs: Number(profile.needsPercentage),
    wants: Number(profile.wantsPercentage),
    future: Number(profile.futurePercentage),
  };
}

function getAllocationCounterText(total: number): string {
  if (total === 100) return "100%";
  if (total < 100) return `−${100 - total}% remaining`;
  return `+${total - 100}% over`;
}

const SLIDER_CLASS = cn(
  "w-full appearance-none cursor-pointer",
  "[&::-webkit-slider-runnable-track]:h-1.5",
  "[&::-webkit-slider-runnable-track]:rounded-full",
  "[&::-webkit-slider-runnable-track]:bg-muted",
  "[&::-moz-range-track]:h-1.5",
  "[&::-moz-range-track]:rounded-full",
  "[&::-moz-range-track]:bg-muted",
  "[&::-webkit-slider-thumb]:appearance-none",
  "[&::-webkit-slider-thumb]:w-5",
  "[&::-webkit-slider-thumb]:h-5",
  "[&::-webkit-slider-thumb]:rounded-full",
  "[&::-webkit-slider-thumb]:cursor-grab",
  "[&::-webkit-slider-thumb]:active:cursor-grabbing",
  "[&::-webkit-slider-thumb]:bg-[var(--thumb-color)]",
  "[&::-moz-range-thumb]:border-0",
  "[&::-moz-range-thumb]:w-5",
  "[&::-moz-range-thumb]:h-5",
  "[&::-moz-range-thumb]:rounded-full",
  "[&::-moz-range-thumb]:bg-[var(--thumb-color)]",
);

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
  const [buckets, setBuckets] = useState<Buckets>(() =>
    bucketsFromProfile(profile),
  );
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Reset state when the sheet opens (to pick up any profile prop changes)
  useEffect(() => {
    if (open) {
      setIncome(profile.monthlyIncomeTarget.toString());
      setBuckets(bucketsFromProfile(profile));
      setError("");
    }
  }, [open, profile]);

  const total = buckets.needs + buckets.wants + buckets.future;
  const isValid = total === 100 && parseFloat(income) > 0;
  const incomeNum = parseFloat(income) || 0;
  const fontSizeClass = getAmountFontSize(income.length);

  function resetState() {
    setIncome(profile.monthlyIncomeTarget.toString());
    setBuckets(bucketsFromProfile(profile));
    setError("");
  }

  function updateBucket(key: keyof Buckets, value: number) {
    setBuckets((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    if (!isValid) return;
    setLoading(true);
    setError("");

    try {
      const result = await updateFinancialProfile({
        monthlyIncomeTarget: parseFloat(income),
        needsPercentage: buckets.needs,
        wantsPercentage: buckets.wants,
        futurePercentage: buckets.future,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      onOpenChange(false);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

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
            <div
              className="relative rounded-2xl px-4 py-5 text-center transition-all duration-300"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 100%, #c4714a18 0%, transparent 70%)",
              }}
            >
              <div className="flex items-center justify-center">
                <span
                  className={cn(
                    "mr-2 font-mono font-extrabold text-primary transition-all duration-200",
                    fontSizeClass,
                  )}
                >
                  $
                </span>
                <Input
                  id="income"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  aria-label="Monthly income amount"
                  className={cn(
                    "w-full border-none bg-transparent p-0 text-center font-mono font-extrabold shadow-none transition-all duration-200",
                    "placeholder:text-muted-foreground/20 focus-visible:ring-0",
                    fontSizeClass,
                  )}
                  value={income}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9.]/g, "");
                    if ((val.match(/\./g) ?? []).length <= 1) setIncome(val);
                  }}
                />
              </div>
            </div>
            {incomeNum > 0 && (
              <p className="text-center text-xs text-muted-foreground tabular-nums">
                = {formatCurrency(incomeNum * 12)} / year
              </p>
            )}
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>Allocation split</Label>
              <span
                className={cn(
                  "text-xs font-medium",
                  total === 100 ? "text-income" : "text-destructive",
                )}
              >
                {getAllocationCounterText(total)}
              </span>
            </div>

            <div
              className="flex rounded-full overflow-hidden h-2"
              aria-label={`Allocation: Needs ${buckets.needs}%, Wants ${buckets.wants}%, Future ${buckets.future}%`}
            >
              {BUCKET_ORDER.map((key) => {
                const { color } = BUCKET_DEFINITIONS[key];
                return (
                  <div
                    key={key}
                    className="motion-safe:transition-all motion-safe:duration-200"
                    style={{
                      width: `${buckets[key]}%`,
                      backgroundColor: color,
                    }}
                  />
                );
              })}
              {total < 100 && (
                <div
                  className="bg-muted/40 motion-safe:transition-all motion-safe:duration-200"
                  style={{ width: `${100 - total}%` }}
                />
              )}
            </div>

            {BUCKET_ORDER.map((key) => {
              const { label, color } = BUCKET_DEFINITIONS[key];
              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color }}>{label}</span>
                    <span className="font-semibold">{buckets[key]}%</span>
                  </div>
                  <div
                    className="min-h-[44px] flex items-center"
                    style={{ "--thumb-color": color } as React.CSSProperties}
                  >
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={buckets[key]}
                      onChange={(event) =>
                        updateBucket(key, Number(event.target.value))
                      }
                      className={SLIDER_CLASS}
                      aria-label={`${label} percentage`}
                    />
                  </div>
                  {incomeNum > 0 && (
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium tabular-nums"
                      style={{ color, backgroundColor: `${color}18` }}
                      aria-hidden="true"
                    >
                      {formatCurrency((incomeNum * buckets[key]) / 100)} / month
                    </span>
                  )}
                </div>
              );
            })}
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
              onClick={() => {
                resetState();
                onOpenChange(false);
              }}
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
