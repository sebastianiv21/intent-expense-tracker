"use client";

import { createContext, useContext, useMemo } from "react";
import { useFormatter } from "next-intl";
import { DEFAULT_CURRENCY } from "@/lib/currencies";
import { formatMoney, formatMoneyCompact } from "@/lib/i18n/money";

type CurrencyContextValue = {
  /** The user's own currency, from their financial profile. */
  currency: string;
  formatCurrency: (amount: number | string) => string;
  formatCurrencyCompact: (amount: number | string) => string;
  /** For amounts held in some *other* currency — a foreign transaction. */
  formatCurrencyIn: (amount: number | string, currency: string) => string;
};

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

export function CurrencyProvider({
  currency,
  children,
}: {
  currency: string;
  children: React.ReactNode;
}) {
  const format = useFormatter();

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      formatCurrency: (amount) => formatMoney(format, amount, currency),
      formatCurrencyCompact: (amount) =>
        formatMoneyCompact(format, amount, currency),
      formatCurrencyIn: (amount, code) => formatMoney(format, amount, code),
    }),
    [format, currency],
  );

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

/**
 * Outside a provider — the auth screens, which have no profile yet — amounts
 * still have to format, so the default currency stands in while the locale keeps
 * coming from next-intl.
 */
export function useCurrency(): CurrencyContextValue {
  const context = useContext(CurrencyContext);
  const format = useFormatter();

  const fallback = useMemo<CurrencyContextValue>(
    () => ({
      currency: DEFAULT_CURRENCY,
      formatCurrency: (amount) => formatMoney(format, amount, DEFAULT_CURRENCY),
      formatCurrencyCompact: (amount) =>
        formatMoneyCompact(format, amount, DEFAULT_CURRENCY),
      formatCurrencyIn: (amount, code) => formatMoney(format, amount, code),
    }),
    [format],
  );

  return context ?? fallback;
}
