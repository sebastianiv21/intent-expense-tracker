import type { AllocationBucket } from "@/types";
import { DEFAULT_CURRENCY } from "@/lib/currencies";

// ─── Bucket Definitions ───────────────────────────────────────────────────────

export const BUCKET_DEFINITIONS = {
  needs: {
    label: "Needs",
    color: "#8b9a7e",
    defaultPercentage: 50,
    description: "Essential expenses",
  },
  wants: {
    label: "Wants",
    color: "#c97a5a",
    defaultPercentage: 30,
    description: "Non-essential spending",
  },
  future: {
    label: "Future",
    color: "#a89562",
    defaultPercentage: 20,
    description: "Savings & investments",
  },
} as const satisfies Record<
  AllocationBucket,
  {
    label: string;
    color: string;
    defaultPercentage: number;
    description: string;
  }
>;

export const BUCKET_ORDER: AllocationBucket[] = ["needs", "wants", "future"];

// ─── Color Mappings ───────────────────────────────────────────────────────────

export function getBucketColor(bucket: AllocationBucket | null): string {
  if (!bucket) return "#888888";
  return BUCKET_DEFINITIONS[bucket].color;
}

export function getTransactionColor(type: "income" | "expense"): string {
  return type === "income" ? "#6aaa6a" : "#e05252";
}

// ─── Currency Formatter ───────────────────────────────────────────────────────

const formatterCache = new Map<string, Intl.NumberFormat>();
const compactFormatterCache = new Map<string, Intl.NumberFormat>();

function getCurrencyFormatter(currency: string): Intl.NumberFormat {
  let formatter = formatterCache.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    formatterCache.set(currency, formatter);
  }
  return formatter;
}

function getCompactCurrencyFormatter(currency: string): Intl.NumberFormat {
  let formatter = compactFormatterCache.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation: "compact",
      maximumFractionDigits: 1,
    });
    compactFormatterCache.set(currency, formatter);
  }
  return formatter;
}

function getZeroFormatted(currency: string): string {
  return getCurrencyFormatter(currency).format(0);
}

export function formatCurrency(
  amount: number | string,
  currency: string = DEFAULT_CURRENCY,
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (Number.isNaN(num)) return getZeroFormatted(currency);
  return getCurrencyFormatter(currency).format(num);
}

export function formatCurrencyCompact(
  amount: number | string,
  currency: string = DEFAULT_CURRENCY,
): string {
  const num = typeof amount === "string" ? parseFloat(amount) : amount;
  if (Number.isNaN(num)) return getZeroFormatted(currency);
  if (Math.abs(num) >= 1000) {
    return getCompactCurrencyFormatter(currency).format(num);
  }
  return getCurrencyFormatter(currency).format(num);
}

// ─── Amount Input Helpers ─────────────────────────────────────────────────────

/**
 * Formats a raw numeric string (digits + optional dot) for display inside
 * amount input fields, adding thousand separators while preserving a
 * trailing decimal point or trailing zeros after the decimal.
 *
 * Examples:
 *   "10000000"   → "10,000,000"
 *   "1234.5"     → "1,234.5"
 *   "1234."      → "1,234."
 *   "1234.50"    → "1,234.50"
 *   ""           → ""
 */
export function formatAmountDisplay(raw: string): string {
  if (!raw) return "";
  const [intPart, ...decParts] = raw.split(".");
  const hasDot = raw.includes(".");
  const formatted = intPart ? Number(intPart).toLocaleString("en-US") : "";
  if (hasDot) {
    return formatted + "." + (decParts[0] ?? "");
  }
  return formatted;
}

/**
 * Strips thousand-separator commas from a display string, keeping only
 * digits and at most one decimal point.  Safe to pass directly to
 * parseFloat() or store as raw state.
 */
export function parseAmountInput(display: string): string {
  const stripped = display.replace(/,/g, "");
  const clean = stripped.replace(/[^0-9.]/g, "");
  // allow at most one dot
  const parts = clean.split(".");
  if (parts.length > 2) return parts[0] + "." + parts.slice(1).join("");
  return clean;
}

// ─── Percentage Calculator ────────────────────────────────────────────────────

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

export function calculateBucketTarget(
  monthlyIncome: number,
  percentage: number,
): number {
  return (monthlyIncome * percentage) / 100;
}
