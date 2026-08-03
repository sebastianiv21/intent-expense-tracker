import type { AllocationBucket } from "@/types";
import { DEFAULT_CURRENCY } from "@/lib/currencies";

// ─── Bucket Definitions ───────────────────────────────────────────────────────

// Colors are token references rather than literals so a single value follows the
// active theme. Valid anywhere CSS is: inline styles, and SVG `fill`/`stroke`.
export const BUCKET_DEFINITIONS = {
  needs: {
    label: "Needs",
    color: "var(--bucket-needs)",
    defaultPercentage: 50,
    description: "Essential expenses",
  },
  wants: {
    label: "Wants",
    color: "var(--bucket-wants)",
    defaultPercentage: 30,
    description: "Non-essential spending",
  },
  future: {
    label: "Future",
    color: "var(--bucket-future)",
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
  if (!bucket) return "var(--muted-foreground)";
  return BUCKET_DEFINITIONS[bucket].color;
}

export function getTransactionColor(type: "income" | "expense"): string {
  return type === "income" ? "var(--income)" : "var(--expense)";
}

/** Token-safe replacement for appending a hex alpha suffix to a color literal. */
export function withAlpha(color: string, percent: number): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`;
}

// ─── Currency Formatter ───────────────────────────────────────────────────────

const formatterCache = new Map<string, Intl.NumberFormat>();
const compactFormatterCache = new Map<string, Intl.NumberFormat>();

const ZERO_DECIMAL_CURRENCIES = new Set(["COP", "JPY", "KRW", "CLP", "HUF", "TWD"]);

export function getCurrencyDecimals(currency: string): number {
  return ZERO_DECIMAL_CURRENCIES.has(currency) ? 0 : 2;
}

function getCurrencyFormatter(currency: string): Intl.NumberFormat {
  let formatter = formatterCache.get(currency);
  if (!formatter) {
    const decimals = getCurrencyDecimals(currency);
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    formatterCache.set(currency, formatter);
  }
  return formatter;
}

function getCompactCurrencyFormatter(currency: string): Intl.NumberFormat {
  let formatter = compactFormatterCache.get(currency);
  if (!formatter) {
    // Compact precision is independent of the currency's decimals: COP has no cents,
    // but 1,500,000 still has to read as 1.5M rather than 2M.
    formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      notation: "compact",
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
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

export type AmountDecimalSeparator = "." | "," | null;

/** Integer parts that a thousands separator could plausibly have grouped. */
const GROUPED_INTEGER = {
  ".": /^[1-9]\d{0,2}(?:\.\d{3})*$/,
  ",": /^[1-9]\d{0,2}(?:,\d{3})*$/,
} as const;

function inferDecimalSeparator(input: string): AmountDecimalSeparator {
  const matches = [...input.matchAll(/[.,]/g)];
  if (matches.length === 0) return null;

  const lastMatch = matches[matches.length - 1];
  const index = lastMatch.index ?? 0;
  const separator = lastMatch[0] as "." | ",";
  const digitsAfter = input.length - index - 1;

  // Three or more trailing digits are either a thousands group ("1.234") or a
  // decimal being typed into ("1234.567"); appending a digit makes both the same
  // length. Only the integer part tells them apart — a thousands separator can
  // follow nothing but a validly grouped one.
  if (
    digitsAfter >= 3 &&
    GROUPED_INTEGER[separator].test(input.slice(0, index))
  ) {
    return null;
  }

  return separator;
}

/**
 * Formats a normalized numeric string for display inside amount input fields,
 * adding thousand separators while preserving a trailing decimal separator or
 * trailing zeros after the decimal.
 *
 * Examples:
 *   ("10000000", null) → "10,000,000"
 *   ("1234.5", ",")    → "1,234,5"
 *   ("1234.", ",")     → "1,234,"
 *   ("1234.50", ".")   → "1,234.50"
 *   ("", null)         → ""
 */
export function formatAmountDisplay(
  raw: string,
  decimalSeparator: AmountDecimalSeparator = null,
): string {
  if (!raw) return "";
  const [intPart, ...decParts] = raw.split(".");
  const hasDot = raw.includes(".");
  const formatted = intPart ? Number(intPart).toLocaleString("en-US") : "";
  if (hasDot) {
    return formatted + (decimalSeparator ?? ".") + (decParts[0] ?? "");
  }
  return formatted;
}

/**
 * Converts a user-entered amount string into a normalized numeric string
 * using "." for the decimal separator while tracking which separator should
 * be shown back to the user.
 */
export function parseAmountInput(
  display: string,
  fallbackDecimalSeparator: AmountDecimalSeparator = null,
): {
  normalizedValue: string;
  decimalSeparator: AmountDecimalSeparator;
} {
  const clean = display.replace(/[^0-9.,]/g, "");
  if (!clean) {
    return { normalizedValue: "", decimalSeparator: null };
  }

  const inferredSeparator = inferDecimalSeparator(clean);
  const decimalSeparator =
    inferredSeparator ??
    (fallbackDecimalSeparator && clean.includes(fallbackDecimalSeparator)
      ? fallbackDecimalSeparator
      : null);

  if (!decimalSeparator) {
    return {
      normalizedValue: clean.replace(/[.,]/g, ""),
      decimalSeparator: null,
    };
  }

  const decimalIndex = clean.lastIndexOf(decimalSeparator);
  const intPart = clean.slice(0, decimalIndex).replace(/[.,]/g, "");
  const decPart = clean.slice(decimalIndex + 1).replace(/[.,]/g, "");

  return {
    normalizedValue: `${intPart || "0"}.${decPart}`,
    decimalSeparator,
  };
}

/**
 * The separator an amount input should start out tracking for an already
 * normalized value. `formatAmountDisplay` renders an untracked fraction with a
 * dot, so seeding anything else would make the next keystroke re-read that dot
 * as a thousands group and multiply the amount by 1000.
 */
export function initialDecimalSeparator(raw: string): AmountDecimalSeparator {
  return raw.includes(".") ? "." : null;
}

export function parseStoredAmount(raw: string): number {
  const amount = Number.parseFloat(raw);
  return Number.isFinite(amount) ? amount : Number.NaN;
}

export function getAmountInputLength(raw: string): number {
  return raw.replace(/[.,]/g, "").length;
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
