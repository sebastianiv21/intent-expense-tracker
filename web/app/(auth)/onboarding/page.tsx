"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createFinancialProfile } from "@/lib/actions/financial-profile";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatCurrency } from "@/lib/finance-utils";

type Buckets = {
  needs: number;
  wants: number;
  future: number;
};

export default function OnboardingPage() {
  const router = useRouter();
  const [income, setIncome] = useState("");
  const [buckets, setBuckets] = useState<Buckets>({
    needs: 50,
    wants: 30,
    future: 20,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const total = buckets.needs + buckets.wants + buckets.future;
  const isValid = total === 100 && parseFloat(income) > 0;

  function updateBucket(key: keyof Buckets, value: number) {
    setBuckets((prev) => ({ ...prev, [key]: value }));
  }

  const incomeNum = parseFloat(income) || 0;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) return;
    setError("");
    setLoading(true);

    const result = await createFinancialProfile({
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

    router.push("/");
  }

  const BUCKETS: Array<{ key: keyof Buckets; label: string; color: string }> =
    [
      { key: "needs", label: "Needs", color: "#8b9a7e" },
      { key: "wants", label: "Wants", color: "#c97a5a" },
      { key: "future", label: "Future", color: "#a89562" },
    ];

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-foreground">Set up your profile</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Enter your monthly income and allocation preferences
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
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
              placeholder="5000.00"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              required
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
                onChange={(e) => updateBucket(key, Number(e.target.value))}
                className="w-full accent-[var(--color)]"
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

        {/* Pie chart preview */}
        <div className="flex justify-center">
          <svg viewBox="0 0 100 100" className="w-32 h-32" aria-hidden="true">
            {(() => {
              const slices = BUCKETS.map(({ key, color }) => ({
                value: buckets[key],
                color,
              }));
              let cumulative = 0;
              return slices.map(({ value, color }, i) => {
                const pct = value / 100;
                const startAngle = cumulative * 2 * Math.PI - Math.PI / 2;
                const endAngle = (cumulative + pct) * 2 * Math.PI - Math.PI / 2;
                const x1 = 50 + 40 * Math.cos(startAngle);
                const y1 = 50 + 40 * Math.sin(startAngle);
                const x2 = 50 + 40 * Math.cos(endAngle);
                const y2 = 50 + 40 * Math.sin(endAngle);
                const largeArc = pct > 0.5 ? 1 : 0;
                cumulative += pct;
                if (value === 0) return null;
                return (
                  <path
                    key={i}
                    d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArc} 1 ${x2} ${y2} Z`}
                    fill={color}
                  />
                );
              });
            })()}
            <circle cx="50" cy="50" r="20" fill="var(--background)" />
          </svg>
        </div>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        <Button type="submit" className="w-full" disabled={loading || !isValid}>
          {loading ? "Setting up…" : "Complete setup"}
        </Button>
      </form>
    </div>
  );
}
