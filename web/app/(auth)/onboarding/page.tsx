"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useFormatter, useLocale, useTranslations } from "next-intl";
import { createFinancialProfile } from "@/lib/actions/financial-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  formatAmountDisplay,
  getAmountInputLength,
  parseAmountInput,
  parseStoredAmount,
  BUCKET_DEFINITIONS,
  BUCKET_ORDER,
} from "@/lib/finance-utils";
import { formatMoney, formatPercent } from "@/lib/i18n/money";
import { getCurrencySymbol, DEFAULT_CURRENCY } from "@/lib/currencies";
import { cn } from "@/lib/utils";
import { CurrencySelector } from "@/components/currency-selector";

type Buckets = {
  needs: number;
  wants: number;
  future: number;
};

export default function OnboardingPage() {
  const router = useRouter();
  const t = useTranslations("onboarding");
  const tCommon = useTranslations("common");
  const tBuckets = useTranslations("buckets");
  const format = useFormatter();
  const locale = useLocale();

  const [income, setIncome] = useState("");
  const [buckets, setBuckets] = useState<Buckets>({
    needs: 50,
    wants: 30,
    future: 20,
  });
  const [currency, setCurrency] = useState<string>(DEFAULT_CURRENCY);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [incomeDecimalSeparator, setIncomeDecimalSeparator] = useState<
    "." | "," | null
  >(null);

  const total = buckets.needs + buckets.wants + buckets.future;
  const isValid = total === 100 && parseStoredAmount(income) > 0;

  function getAmountFontSize(len: number): string {
    if (len <= 5) return "text-5xl";
    if (len <= 7) return "text-4xl";
    if (len <= 9) return "text-3xl";
    return "text-2xl";
  }

  const fontSizeClass = getAmountFontSize(getAmountInputLength(income));

  function updateBucket(key: keyof Buckets, value: number) {
    setBuckets((prev) => ({ ...prev, [key]: value }));
  }

  const incomeNum = parseStoredAmount(income) || 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setError("");
    setLoading(true);

    const result = await createFinancialProfile({
      monthlyIncomeTarget: parseStoredAmount(income),
      needsPercentage: buckets.needs,
      wantsPercentage: buckets.wants,
      futurePercentage: buckets.future,
      currency,
    });

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    router.push("/");
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground mt-1">{t("description")}</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <Label>{t("currency")}</Label>
          <CurrencySelector value={currency} onChange={setCurrency} />
        </div>

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
                onChange={(e) => {
                  const parsed = parseAmountInput(
                    e.target.value,
                    incomeDecimalSeparator,
                  );
                  setIncome(parsed.normalizedValue);
                  setIncomeDecimalSeparator(parsed.decimalSeparator);
                }}
                value={formatAmountDisplay(
                  income,
                  incomeDecimalSeparator,
                  locale,
                )}
                required
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

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>{t("allocationSplit")}</Label>
            <span
              className={
                total === 100
                  ? "text-xs text-income font-medium"
                  : "text-xs text-destructive font-medium"
              }
            >
              {t("allocationTotal", {
                total: formatPercent(format, total),
                full: formatPercent(format, 100),
              })}
            </span>
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
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={buckets[key]}
                  onChange={(e) => updateBucket(key, Number(e.target.value))}
                  className="w-full accent-[var(--color)]"
                  style={{ accentColor: color }}
                  aria-label={tBuckets("percentageSlider", { bucket: label })}
                />
                {incomeNum > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {tCommon("perMonth", {
                      amount: formatMoney(
                        format,
                        (incomeNum * buckets[key]) / 100,
                        currency,
                      ),
                    })}
                  </p>
                )}
              </div>
            );
          })}
        </div>

        {/* Pie chart preview */}
        <div className="flex justify-center">
          <svg viewBox="0 0 100 100" className="w-32 h-32" aria-hidden="true">
            {BUCKET_ORDER.map((key, i) => {
              const value = buckets[key];
              if (value === 0) return null;

              // Each slice starts where the preceding ones ended; summing them
              // here keeps the geometry a pure function of `buckets`.
              const start =
                BUCKET_ORDER.slice(0, i).reduce(
                  (sum, earlier) => sum + buckets[earlier],
                  0,
                ) / 100;
              const pct = value / 100;
              const startAngle = start * 2 * Math.PI - Math.PI / 2;
              const endAngle = (start + pct) * 2 * Math.PI - Math.PI / 2;
              const x1 = 50 + 40 * Math.cos(startAngle);
              const y1 = 50 + 40 * Math.sin(startAngle);
              const x2 = 50 + 40 * Math.cos(endAngle);
              const y2 = 50 + 40 * Math.sin(endAngle);
              const largeArc = pct > 0.5 ? 1 : 0;

              return (
                <path
                  key={key}
                  d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                  fill={BUCKET_DEFINITIONS[key].color}
                />
              );
            })}
            <circle cx="50" cy="50" r="20" fill="var(--background)" />
          </svg>
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loading || !isValid}>
          {loading ? t("submitting") : t("submit")}
        </Button>
      </form>
    </div>
  );
}
