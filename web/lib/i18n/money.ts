import type { createFormatter } from "next-intl";
import {
  compactCurrencyFormatOptions,
  currencyFormatOptions,
  shouldFormatCompact,
  toAmountNumber,
} from "@/lib/finance-utils";

/**
 * next-intl's formatter, however it was obtained — `useFormatter()` in a client
 * component, `getFormatter()` on the server, `createFormatter()` in a test.
 */
export type Formatter = ReturnType<typeof createFormatter>;

/**
 * Currency and locale are independent inputs: the code comes from the user's
 * profile, the digit grouping, decimal mark and symbol placement come from the
 * language they read. $1,234.56 and 1234,56 US$ are the same money.
 */
export function formatMoney(
  format: Formatter,
  amount: number | string,
  currency: string,
): string {
  return format.number(toAmountNumber(amount), currencyFormatOptions(currency));
}

export function formatMoneyCompact(
  format: Formatter,
  amount: number | string,
  currency: string,
): string {
  const value = toAmountNumber(amount);
  return format.number(
    value,
    shouldFormatCompact(value)
      ? compactCurrencyFormatOptions(currency)
      : currencyFormatOptions(currency),
  );
}

/**
 * The app computes percentages as whole numbers (50 for 50%); `Intl`'s percent
 * style expects a ratio. Converting here keeps every call site honest and gets
 * the locale's own spacing — "50%" in English, "50 %" in Spanish.
 */
export function formatPercent(format: Formatter, percentage: number): string {
  return format.number(percentage / 100, "percent");
}
