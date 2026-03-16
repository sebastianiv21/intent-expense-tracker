"use client";

import { useMemo, useState } from "react";
import { CalendarIcon, Plus, Search } from "lucide-react";
import { format } from "date-fns";
import { useTransactionSheet } from "@/components/transaction-sheet-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatCurrency, getBucketColor } from "@/lib/finance-utils";
import { createTransaction, updateTransaction } from "@/lib/actions/transactions";
import type { Category, TransactionType } from "@/types";

const typeOptions: Array<{ label: string; value: TransactionType }> = [
  { label: "Expense", value: "expense" },
  { label: "Income", value: "income" },
];

type TransactionSheetProps = {
  categories: Category[];
};

export function TransactionSheet({ categories }: TransactionSheetProps) {
  const { isOpen, mode, transaction, close } = useTransactionSheet();
  const [step, setStep] = useState<"main" | "category">("main");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<TransactionType>("expense");
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [date, setDate] = useState<Date>(new Date());
  const [description, setDescription] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");

  const filteredCategories = useMemo(() => {
    const term = categorySearch.trim().toLowerCase();
    return categories.filter((cat) => {
      if (cat.type !== type) return false;
      if (!term) return true;
      return cat.name.toLowerCase().includes(term);
    });
  }, [categories, categorySearch, type]);

  function syncStateFromProps() {
    if (mode === "edit" && transaction) {
      setAmount(transaction.amount.toString());
      setType(transaction.type);
      setCategoryId(transaction.categoryId ?? null);
      setDate(new Date(transaction.date));
      setDescription(transaction.description ?? "");
    } else {
      setAmount("");
      setType("expense");
      setCategoryId(null);
      setDate(new Date());
      setDescription("");
    }
    setError("");
    setStep("main");
    setCategorySearch("");
  }

  const selectedCategory = categories.find((cat) => cat.id === categoryId) ?? null;

  const canSave = parseFloat(amount) > 0 && !!date;

  async function handleSave() {
    if (!canSave) return;
    setLoading(true);
    setError("");

    const payload = {
      amount: parseFloat(amount),
      type,
      description: description.trim() || undefined,
      date: format(date, "yyyy-MM-dd"),
      categoryId: categoryId ?? undefined,
    };

    const result =
      mode === "edit" && transaction
        ? await updateTransaction(transaction.id, payload)
        : await createTransaction(payload);

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    close();
  }

  function handleClose() {
    if (!loading) {
      close();
      setStep("main");
      setCategorySearch("");
    }
  }

  function handleOpenChange(open: boolean) {
    if (open) {
      syncStateFromProps();
    } else {
      handleClose();
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={handleOpenChange}>
      <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-6">
        {step === "main" ? (
          <div className="space-y-5">
            <SheetHeader className="text-left">
              <SheetTitle>
                {mode === "edit" ? "Edit transaction" : "New transaction"}
              </SheetTitle>
              <SheetDescription>
                {mode === "edit"
                  ? "Update the details below."
                  : "Record income or expenses."}
              </SheetDescription>
            </SheetHeader>

            <div className="space-y-3">
              <Label htmlFor="amount">Amount</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">
                  $
                </span>
                <Input
                  id="amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  inputMode="decimal"
                  placeholder="0.00"
                  className="pl-7 text-lg font-semibold"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                />
              </div>
              {amount && (
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(amount)}
                </p>
              )}
            </div>

            <div className="space-y-3">
              <Label>Type</Label>
              <Tabs value={type} onValueChange={(value) => setType(value as TransactionType)}>
                <TabsList className="w-full">
                  {typeOptions.map((option) => (
                    <TabsTrigger
                      key={option.value}
                      value={option.value}
                      className="flex-1"
                    >
                      {option.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            <div className="space-y-3">
              <Label>Category</Label>
              <Button
                type="button"
                variant="outline"
                className="w-full justify-between"
                onClick={() => setStep("category")}
              >
                <span className="flex items-center gap-2">
                  {selectedCategory?.icon ? (
                    <span className="text-lg leading-none">{selectedCategory.icon}</span>
                  ) : (
                    <Plus className="h-4 w-4 text-muted-foreground" />
                  )}
                  {selectedCategory?.name ?? "Choose category"}
                </span>
                <span
                  className="text-xs"
                  style={{ color: getBucketColor(selectedCategory?.allocationBucket ?? null) }}
                >
                  {selectedCategory?.allocationBucket ?? ""}
                </span>
              </Button>
            </div>

            <div className="space-y-3">
              <Label>Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {date ? format(date, "MMM d, yyyy") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={date}
                    onSelect={(value) => value && setDate(value)}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-3">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="Add a note"
                value={description}
                onChange={(event) => setDescription(event.target.value)}
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <Button type="button" variant="outline" className="flex-1" onClick={handleClose}>
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={handleSave}
                disabled={loading || !canSave}
              >
                {loading ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold">Choose category</h2>
                <p className="text-sm text-muted-foreground">
                  {type === "expense" ? "Spending bucket" : "Income source"}
                </p>
              </div>
              <Button variant="ghost" onClick={() => setStep("main")}>
                Done
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search categories"
                value={categorySearch}
                onChange={(event) => setCategorySearch(event.target.value)}
                className="pl-9"
              />
            </div>

            <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
              {filteredCategories.length === 0 ? (
                <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No categories found.
                </div>
              ) : (
                filteredCategories.map((cat) => (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setCategoryId(cat.id);
                      setStep("main");
                    }}
                    className={cn(
                      "w-full rounded-lg border border-border p-3 text-left transition hover:bg-muted flex items-center justify-between",
                      categoryId === cat.id && "border-accent"
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <span className="text-lg leading-none">{cat.icon ?? "•"}</span>
                      <span>
                        <span className="block font-medium text-foreground">
                          {cat.name}
                        </span>
                        {cat.allocationBucket && (
                          <span className="text-xs text-muted-foreground">
                            {cat.allocationBucket}
                          </span>
                        )}
                      </span>
                    </span>
                    {cat.allocationBucket && (
                      <span
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: getBucketColor(cat.allocationBucket) }}
                        aria-hidden
                      />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
