"use client";

import { createContext, useContext, useMemo, useState } from "react";
import type { TransactionWithCategory } from "@/types";

type TransactionSheetState = {
  isOpen: boolean;
  mode: "create" | "edit";
  transaction?: TransactionWithCategory | null;
};

type TransactionSheetContextValue = TransactionSheetState & {
  openCreate: () => void;
  openEdit: (transaction: TransactionWithCategory) => void;
  close: () => void;
};

const TransactionSheetContext = createContext<TransactionSheetContextValue | null>(
  null
);

export function TransactionSheetProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<TransactionSheetState>({
    isOpen: false,
    mode: "create",
    transaction: null,
  });

  const value = useMemo<TransactionSheetContextValue>(
    () => ({
      ...state,
      openCreate: () =>
        setState({ isOpen: true, mode: "create", transaction: null }),
      openEdit: (transaction) =>
        setState({ isOpen: true, mode: "edit", transaction }),
      close: () => setState((prev) => ({ ...prev, isOpen: false })),
    }),
    [state]
  );

  return (
    <TransactionSheetContext.Provider value={value}>
      {children}
    </TransactionSheetContext.Provider>
  );
}

export function useTransactionSheet() {
  const context = useContext(TransactionSheetContext);
  if (!context) {
    throw new Error("useTransactionSheet must be used within TransactionSheetProvider");
  }

  return context;
}
