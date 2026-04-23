"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarIcon,
  CheckCircle,
  Coffee,
  Home,
  PiggyBank,
  X,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { useTransactionSheet } from "@/components/transaction-sheet-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  BUCKET_ORDER,
  formatAmountDisplay,
  formatCurrency,
  getAmountInputLength,
  getCurrencyDecimals,
  parseAmountInput,
  parseStoredAmount,
} from "@/lib/finance-utils";
import {
  createTransaction,
  getExchangeRateForPreview,
  updateTransaction,
} from "@/lib/actions/transactions";
import { useCurrency } from "@/components/currency-provider";
import type { AllocationBucket, Category, TransactionType } from "@/types";

// ─── Bucket config ────────────────────────────────────────────────────────────

const BUCKET_META: Record<
  AllocationBucket,
  {
    label: string;
    Icon: typeof Home;
    color: string;
    borderClass: string;
    textClass: string;
  }
> = {
  needs: {
    label: "NEEDS",
    Icon: Home,
    color: "#8b9a7e",
    borderClass: "border-bucket-needs",
    textClass: "text-bucket-needs",
  },
  wants: {
    label: "WANTS",
    Icon: Coffee,
    color: "#c4714a",
    borderClass: "border-bucket-wants",
    textClass: "text-bucket-wants",
  },
  future: {
    label: "FUTURE",
    Icon: PiggyBank,
    color: "#a89562",
    borderClass: "border-bucket-future",
    textClass: "text-bucket-future",
  },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getAmountFontSize(len: number): string {
  if (len <= 5) return "text-5xl";
  if (len <= 7) return "text-4xl";
  if (len <= 9) return "text-3xl";
  return "text-2xl";
}

function getCategoryColor(
  bucket: AllocationBucket | null,
  type: TransactionType,
): string {
  if (type === "income") return "#7aaa7a";
  return bucket ? BUCKET_META[bucket].color : "#c4714a";
}

function today(): string {
  return format(new Date(), "yyyy-MM-dd");
}

function firstCategoryId(
  categories: Category[],
  type: TransactionType,
  bucket?: AllocationBucket,
): string | null {
  const match = categories.find(
    (c) =>
      c.type === type && (type === "income" || c.allocationBucket === bucket),
  );
  return match?.id ?? null;
}

// ─── Form state ───────────────────────────────────────────────────────────────

interface FormState {
  amount: string;
  type: TransactionType;
  categoryId: string | null;
  date: string;
  description: string;
  selectedBucket: AllocationBucket;
  currency: string; // ISO 4217 code; defaults to baseCurrency on create, transaction.currency on edit
}

type EditableTransaction = {
  amount: string;
  originalAmount: string | null; // pre-fill edit form with this value, not amount (CONTEXT.md discretion)
  currency: string | null;       // pre-fill edit form currency badge
  type: TransactionType;
  categoryId: string | null;
  date: string;
  description: string | null;
  category?: { allocationBucket: AllocationBucket | null } | null;
};

function buildInitialState(
  mode: "create" | "edit",
  transaction: EditableTransaction | null | undefined,
  categories: Category[],
  baseCurrency: string, // required by D-03 (default) and edit pre-fill (CONTEXT.md discretion)
): FormState {
  if (mode === "edit" && transaction) {
    return {
      amount: transaction.originalAmount ?? transaction.amount ?? "", // CRITICAL: originalAmount, not amount (CONTEXT.md discretion)
      currency: transaction.currency ?? baseCurrency,
      type: transaction.type ?? "expense",
      categoryId: transaction.categoryId ?? null,
      date: transaction.date?.slice(0, 10) ?? today(),
      description: transaction.description ?? "",
      selectedBucket: transaction.category?.allocationBucket ?? "needs",
    };
  }
  return {
    amount: "",
    currency: baseCurrency, // D-03: always default to user's base currency; form does NOT remember last-used
    type: "expense",
    categoryId: firstCategoryId(categories, "expense", "needs"),
    date: today(),
    description: "",
    selectedBucket: "needs",
  };
}

// ─── Component ────────────────────────────────────────────────────────────────

type TransactionSheetProps = {
  categories: Category[];
};

export function TransactionSheet({ categories }: TransactionSheetProps) {
  const router = useRouter();
  const { isOpen, mode, transaction, close } = useTransactionSheet();
  const { currency: baseCurrency } = useCurrency();
  const [form, setForm] = useState<FormState>(() =>
    buildInitialState(mode, transaction, categories, baseCurrency),
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [amountDecimalSeparator, setAmountDecimalSeparator] = useState<
    "." | "," | null
  >(null);
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false);
  const [previewRate, setPreviewRate] = useState<number | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  // Reset form whenever the sheet opens
  useEffect(() => {
    if (isOpen) {
      setForm(buildInitialState(mode, transaction, categories, baseCurrency));
      setError(null);
      setDatePickerOpen(false);
      setAmountDecimalSeparator(null);
      setCurrencyPickerOpen(false);
      setPreviewRate(null);
      setPreviewLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  function updateField<K extends keyof FormState>(
    field: K,
    value: FormState[K],
  ): void {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function selectType(type: TransactionType): void {
    setForm((prev) => ({
      ...prev,
      type,
      selectedBucket: "needs",
      categoryId: firstCategoryId(categories, type, "needs"),
    }));
  }

  function selectBucket(bucket: AllocationBucket): void {
    setForm((prev) => ({
      ...prev,
      selectedBucket: bucket,
      categoryId: firstCategoryId(categories, "expense", bucket),
    }));
  }

  const filteredCategories = useMemo(() => {
    return categories.filter(
      (c) =>
        c.type === form.type &&
        (form.type === "income" || c.allocationBucket === form.selectedBucket),
    );
  }, [categories, form.type, form.selectedBucket]);

  async function handleCurrencySelect(newCurrency: string): Promise<void> {
    updateField("currency", newCurrency);
    setCurrencyPickerOpen(false);
    setPreviewRate(null);
    // No preview needed for same-currency transactions (D-06)
    if (newCurrency === baseCurrency) return;
    setPreviewLoading(true);
    const result = await getExchangeRateForPreview(newCurrency, baseCurrency, form.date);
    setPreviewLoading(false);
    if ("rate" in result) {
      setPreviewRate(result.rate);
    } else {
      // Rate fetch failed — surface error in the existing alert block; preview stays hidden
      setError("Couldn't fetch exchange rate — please try again.");
    }
  }

  async function handleSubmit(): Promise<void> {
    const amountNum = parseStoredAmount(form.amount);
    if (!amountNum || amountNum <= 0) return;

    setSaving(true);
    setError(null);

    try {
      const payload = {
        amount: amountNum,
        type: form.type,
        description: form.description.trim() || undefined,
        date: form.date,
        categoryId: form.categoryId ?? undefined,
        currency: form.currency,
        baseCurrency,
      };

      const result =
        mode === "edit" && transaction
          ? await updateTransaction(transaction.id, payload)
          : await createTransaction(payload);

      if (!result.success) {
        setError(result.error);
        return;
      }

      close();
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const canSave = parseStoredAmount(form.amount) > 0;
  const fontSizeClass = getAmountFontSize(getAmountInputLength(form.amount));
  const isIncome = form.type === "income";
  const amountGlow = isIncome
    ? "radial-gradient(ellipse at 50% 100%, #7aaa7a18 0%, transparent 70%)"
    : "radial-gradient(ellipse at 50% 100%, #c4714a18 0%, transparent 70%)";

  return (
    <Sheet
      open={isOpen}
      onOpenChange={(open) => {
        if (!open && !saving) close();
      }}
    >
      {/* [&>button]:hidden suppresses the default Radix close button */}
      <SheetContent
        side="bottom"
        className="max-h-[90vh] rounded-t-3xl border border-border bg-card p-0 [&>button]:hidden lg:left-1/2 lg:w-[min(100%-2rem,58rem)] lg:-translate-x-1/2 lg:rounded-3xl"
      >
        <div className="flex max-h-[90vh] flex-col">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border px-6 pb-4 pt-6">
            <SheetTitle className="text-2xl font-bold">
              {mode === "edit" ? "Edit Awareness" : "New Awareness"}
            </SheetTitle>
            <SheetDescription className="sr-only">
              {mode === "edit"
                ? "Update the details below."
                : "Record income or expenses."}
            </SheetDescription>
            <button
              onClick={close}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-border text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex-1 space-y-4 overflow-y-auto px-6 py-4">
            <div
              className="relative rounded-2xl px-4 py-5 text-center transition-all duration-300"
              style={{ background: amountGlow }}
            >
              <div className="flex items-center justify-center">
                <Popover open={currencyPickerOpen} onOpenChange={setCurrencyPickerOpen}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      aria-label="Select currency"
                      className={cn(
                        "mr-2 min-h-[44px] rounded-xl border px-3 py-2 font-mono font-bold transition-colors",
                        fontSizeClass,
                        currencyPickerOpen
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-muted text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {form.currency}
                    </button>
                  </PopoverTrigger>
                  <PopoverContent className="w-32 p-1" align="start">
                    {(["USD", "COP"] as const).map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => handleCurrencySelect(c)}
                        className={cn(
                          "w-full rounded-lg px-3 py-2.5 text-left text-sm font-bold transition-colors",
                          c === form.currency
                            ? "bg-primary/10 text-primary"
                            : "text-foreground hover:bg-muted",
                        )}
                      >
                        {c}
                      </button>
                    ))}
                  </PopoverContent>
                </Popover>
                <Input
                  id="amount"
                  type="text"
                  inputMode={getCurrencyDecimals(form.currency) === 0 ? "numeric" : "decimal"}
                  placeholder={getCurrencyDecimals(form.currency) === 0 ? "0" : "0.00"}
                  aria-label="Transaction amount"
                  className={cn(
                    "w-full border-none bg-transparent p-0 text-center font-mono font-extrabold shadow-none transition-all duration-200",
                    "placeholder:text-muted-foreground/20 focus-visible:ring-0",
                    fontSizeClass,
                    isIncome ? "text-income" : "text-foreground",
                  )}
                  value={form.amount}
                  onChange={(e) => {
                    if (getCurrencyDecimals(form.currency) === 0) {
                      // Zero-decimal currency: bypass the heuristic separator
                      // detection — the thousands comma in "50,000" confuses
                      // inferDecimalSeparator when a 5th digit is appended.
                      updateField("amount", e.target.value.replace(/[^0-9]/g, ""));
                      return;
                    }
                    const parsed = parseAmountInput(
                      e.target.value,
                      amountDecimalSeparator,
                    );
                    let { normalizedValue } = parsed;
                    // Clamp decimal places to what the currency supports (e.g. 2 for USD)
                    if (normalizedValue.includes(".")) {
                      const [int, dec] = normalizedValue.split(".");
                      normalizedValue = `${int}.${dec.slice(0, getCurrencyDecimals(form.currency))}`;
                    }
                    updateField("amount", normalizedValue);
                    setAmountDecimalSeparator(parsed.decimalSeparator);
                  }}
                />
              </div>
              {form.currency !== baseCurrency && (
                <p
                  aria-live="polite"
                  className={cn(
                    "mt-2 text-center text-sm tabular-nums",
                    previewLoading ? "text-muted-foreground/50" : "text-muted-foreground",
                  )}
                >
                  {previewLoading
                    ? "Fetching rate\u2026"
                    : previewRate !== null && parseStoredAmount(form.amount) > 0
                      ? `\u2248 ${formatCurrency(parseStoredAmount(form.amount) * previewRate, baseCurrency)} ${baseCurrency}`
                      : null}
                </p>
              )}
            </div>

            <div className="relative flex rounded-2xl bg-border p-1">
              <div
                className="absolute inset-y-1 w-[calc(50%-4px)] rounded-xl transition-all duration-200"
                style={{
                  left: isIncome ? "calc(50%)" : 4,
                  backgroundColor: isIncome ? "#7aaa7a" : "var(--primary)",
                }}
              />
              <button
                onClick={() => selectType("expense")}
                aria-pressed={!isIncome}
                className={cn(
                  "relative z-10 flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200",
                  !isIncome ? "text-white" : "text-foreground/25",
                )}
              >
                Expense
              </button>
              <button
                onClick={() => selectType("income")}
                aria-pressed={isIncome}
                className={cn(
                  "relative z-10 flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200",
                  isIncome ? "text-white" : "text-foreground/25",
                )}
              >
                Income
              </button>
            </div>

            {!isIncome && (
              <div className="grid grid-cols-3 gap-2">
                {BUCKET_ORDER.map((bucket) => {
                  const { label, Icon, borderClass, textClass, color } =
                    BUCKET_META[bucket];
                  const isActive = form.selectedBucket === bucket;
                  return (
                    <button
                      key={bucket}
                      type="button"
                      aria-pressed={isActive}
                      aria-label={label}
                      onClick={() => selectBucket(bucket)}
                      className={cn(
                        "flex flex-col items-center justify-center gap-2 rounded-2xl border-2 bg-background py-4 transition-all duration-200 active:scale-95",
                        isActive
                          ? `${borderClass} ${textClass}`
                          : "border-transparent text-muted-foreground hover:border-border",
                      )}
                      style={
                        isActive
                          ? { boxShadow: `0 0 16px ${color}30` }
                          : undefined
                      }
                    >
                      <Icon className="h-5 w-5" />
                      <span className="text-[10px] font-bold uppercase tracking-widest">
                        {label}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {filteredCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No categories available
              </p>
            ) : (
              <div className="relative -mx-6">
                <div className="flex gap-2 overflow-x-auto px-6 pb-1 [&::-webkit-scrollbar]:hidden">
                  {filteredCategories.map((cat) => {
                    const isActive = form.categoryId === cat.id;
                    const color = getCategoryColor(
                      cat.allocationBucket,
                      form.type,
                    );
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        aria-pressed={isActive}
                        aria-label={`Select ${cat.name}`}
                        onClick={() =>
                          updateField("categoryId", isActive ? null : cat.id)
                        }
                        className="min-h-[44px] shrink-0 whitespace-nowrap rounded-xl border px-3 py-1.5 text-sm font-medium transition-all duration-200 active:scale-95"
                        style={{
                          borderColor: isActive ? color : "var(--border)",
                          color: isActive ? color : "var(--muted-foreground)",
                          backgroundColor: isActive ? `${color}18` : undefined,
                        }}
                      >
                        <span className="flex items-center gap-1.5">
                          {cat.icon && (
                            <span className="text-sm">{cat.icon}</span>
                          )}
                          {cat.name}
                        </span>
                      </button>
                    );
                  })}
                </div>
                <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-card to-transparent" />
              </div>
            )}

            <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="h-12 w-full justify-start rounded-2xl border border-border bg-background font-normal hover:bg-background/80"
                >
                  <CalendarIcon className="mr-3 h-4 w-4 text-primary" />
                  {form.date ? (
                    <span className="text-foreground">
                      {format(parseISO(form.date), "MMMM d, yyyy")}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">Pick a date</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                className="w-[var(--radix-popover-trigger-width)] p-0"
                align="start"
              >
                <Calendar
                  mode="single"
                  selected={form.date ? parseISO(form.date) : undefined}
                  onSelect={(day) => {
                    if (day) {
                      updateField("date", format(day, "yyyy-MM-dd"));
                      setDatePickerOpen(false);
                    }
                  }}
                  className="w-full [--cell-size:2.25rem]"
                  classNames={{ root: "w-full" }}
                  autoFocus
                />
              </PopoverContent>
            </Popover>

            <textarea
              placeholder="Add a note..."
              aria-label="Notes"
              value={form.description}
              onChange={(e) => updateField("description", e.target.value)}
              className="h-20 w-full resize-none rounded-2xl border border-border bg-background p-4 text-sm text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/50"
            />

            {error && (
              <p
                role="alert"
                className="rounded-xl bg-destructive/10 p-3 text-center text-sm text-destructive"
              >
                {error}
              </p>
            )}
          </div>

          <div className="border-t border-border bg-card px-6 pb-8 pt-4">
            <Button
              onClick={handleSubmit}
              disabled={saving || !canSave}
              className={cn(
                "flex w-full items-center justify-center gap-2 rounded-3xl py-6 text-base font-bold text-white transition-all duration-200 hover:opacity-90 active:scale-[0.98] disabled:opacity-40",
                isIncome
                  ? "bg-income shadow-lg shadow-income/20"
                  : "bg-linear-to-r from-primary to-[#a36248] shadow-lg shadow-primary/25",
              )}
            >
              {saving ? "Saving…" : mode === "edit" ? "Update" : "Add"}
              <CheckCircle className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
