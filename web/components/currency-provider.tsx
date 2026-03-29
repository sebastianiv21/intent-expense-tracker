"use client";

import { createContext, useContext } from "react";
import { DEFAULT_CURRENCY } from "@/lib/currencies";
import { formatCurrency, formatCurrencyCompact } from "@/lib/finance-utils";

type CurrencyContextValue = {
  currency: string;
  formatCurrency: (amount: number | string) => string;
  formatCurrencyCompact: (amount: number | string) => string;
};

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: DEFAULT_CURRENCY,
  formatCurrency: (amount) => formatCurrency(amount, DEFAULT_CURRENCY),
  formatCurrencyCompact: (amount) =>
    formatCurrencyCompact(amount, DEFAULT_CURRENCY),
});

export function CurrencyProvider({
  currency,
  children,
}: {
  currency: string;
  children: React.ReactNode;
}) {
  const value: CurrencyContextValue = {
    currency,
    formatCurrency: (amount) => formatCurrency(amount, currency),
    formatCurrencyCompact: (amount) =>
      formatCurrencyCompact(amount, currency),
  };

  return (
    <CurrencyContext.Provider value={value}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency(): CurrencyContextValue {
  return useContext(CurrencyContext);
}
