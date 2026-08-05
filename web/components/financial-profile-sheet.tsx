"use client";

import { useEffect, useState } from "react";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { updateFinancialProfile } from "@/lib/actions/financial-profile";
import {
  formatAmountDisplay,
  getAmountInputLength,
  initialDecimalSeparator,
  parseAmountInput,
  parseStoredAmount,
  BUCKET_DEFINITIONS,
  BUCKET_ORDER,
} from "@/lib/finance-utils";
import { getCurrencySymbol } from "@/lib/currencies";
import { formatMoney, formatPercent } from "@/lib/i18n/money";
import { CurrencySelector } from "@/components/currency-selector";
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
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const tBuckets = useTranslations("buckets");
  const format = useFormatter();
  const locale = useLocale();

  const [income, setIncome] = useState(profile.monthlyIncomeTarget.toString());
  const [buckets, setBuckets] = useState<Buckets>(() =>
    bucketsFromProfile(profile),
  );
  const [currency, setCurrency] = useState(profile.currency ?? "USD");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [incomeDecimalSeparator, setIncomeDecimalSeparator] = useState<
    "." | "," | null
  >(() => initialDecimalSeparator(income));

  // Reset state when the sheet opens (to pick up any profile prop changes)
  useEffect(() => {
    if (open) {
      setIncome(profile.monthlyIncomeTarget.toString());
      setBuckets(bucketsFromProfile(profile));
      setCurrency(profile.currency ?? "USD");
      setError("");
      setIncomeDecimalSeparator(
        initialDecimalSeparator(profile.monthlyIncomeTarget.toString()),
      );
    }
  }, [open, profile]);

  const total = buckets.needs + buckets.wants + buckets.future;
  const isValid = total === 100 && parseStoredAmount(income) > 0;
  const incomeNum = parseStoredAmount(income) || 0;
  const fontSizeClass = getAmountFontSize(getAmountInputLength(income));

  function allocationCounterText(): string {
    if (total === 100) return formatPercent(format, 100);
    if (total < 100)
      return t("allocationRemaining", {
        percentage: formatPercent(format, 100 - total),
      });
    return t("allocationOver", {
      percentage: formatPercent(format, total - 100),
    });
  }

  function resetState() {
    setIncome(profile.monthlyIncomeTarget.toString());
    setBuckets(bucketsFromProfile(profile));
    setCurrency(profile.currency ?? "USD");
    setError("");
    setIncomeDecimalSeparator(
      initialDecimalSeparator(profile.monthlyIncomeTarget.toString()),
    );
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
        monthlyIncomeTarget: parseStoredAmount(income),
        needsPercentage: buckets.needs,
        wantsPercentage: buckets.wants,
        futurePercentage: buckets.future,
        currency,
      });

      if (!result.success) {
        setError(result.error);
        return;
      }

      onOpenChange(false);
    } catch {
      setError(tCommon("somethingWentWrong"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl px-4 pb-6 lg:left-1/2 lg:w-[min(100%-2rem,58rem)] lg:-translate-x-1/2 lg:rounded-3xl"
      >
        <SheetHeader className="text-left">
          <SheetTitle>{t("sheetTitle")}</SheetTitle>
          <SheetDescription>{t("sheetDescription")}</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-4">
          <div className="space-y-2">
            <Label htmlFor="income">{t("monthlyIncome")}</Label>
            <div
              className="relative rounded-2xl px-4 py-5 text-center transition-all duration-300"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 100%, var(--primary-glow) 0%, transparent 70%)",
              }}
            >
              <div className="flex items-center justify-center">
                <span
                  className={cn(
                    "mr-2 font-mono font-extrabold text-primary transition-all duration-200",
                    fontSizeClass,
                  )}
                >
                  {getCurrencySymbol(currency)}
                </span>
                <Input
                  id="income"
                  type="text"
                  inputMode="decimal"
                  placeholder="0.00"
                  aria-label={t("monthlyIncomeAmount")}
                  className={cn(
                    "w-full border-none bg-transparent p-0 text-center font-mono font-extrabold shadow-none transition-all duration-200",
                    "placeholder:text-muted-foreground/20 focus-visible:ring-0",
                    fontSizeClass,
                  )}
                  value={formatAmountDisplay(
                    income,
                    incomeDecimalSeparator,
                    locale,
                  )}
                  onChange={(e) => {
                    const parsed = parseAmountInput(
                      e.target.value,
                      incomeDecimalSeparator,
                    );
                    setIncome(parsed.normalizedValue);
                    setIncomeDecimalSeparator(parsed.decimalSeparator);
                  }}
                />
              </div>
            </div>
            {incomeNum > 0 && (
              <p className="text-center text-xs text-muted-foreground tabular-nums">
                {tCommon("perYear", {
                  amount: formatMoney(format, incomeNum * 12, currency),
                })}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label>{t("currency")}</Label>
            <CurrencySelector value={currency} onChange={setCurrency} />
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label>{t("allocationSplit")}</Label>
              <span
                className={cn(
                  "text-xs font-medium",
                  total === 100 ? "text-income" : "text-destructive",
                )}
              >
                {allocationCounterText()}
              </span>
            </div>

            <div
              className="flex rounded-full overflow-hidden h-2"
              aria-label={t("allocationSummary", {
                needs: formatPercent(format, buckets.needs),
                wants: formatPercent(format, buckets.wants),
                future: formatPercent(format, buckets.future),
              })}
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
              const { color } = BUCKET_DEFINITIONS[key];
              const label = tBuckets(key);
              return (
                <div key={key} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color }}>{label}</span>
                    <span className="font-semibold">
                      {formatPercent(format, buckets[key])}
                    </span>
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
                      aria-label={tBuckets("percentageSlider", {
                        bucket: label,
                      })}
                    />
                  </div>
                  {incomeNum > 0 && (
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium tabular-nums"
                      style={{ color, backgroundColor: `${color}18` }}
                      aria-hidden="true"
                    >
                      {tCommon("perMonth", {
                        amount: formatMoney(
                          format,
                          (incomeNum * buckets[key]) / 100,
                          currency,
                        ),
                      })}
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
              {tCommon("cancel")}
            </Button>
            <Button
              type="button"
              className="flex-1"
              onClick={handleSave}
              disabled={!isValid || loading}
            >
              {loading ? tCommon("saving") : tCommon("save")}
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
