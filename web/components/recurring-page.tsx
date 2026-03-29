"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { format, parseISO } from "date-fns";
import { toast } from "sonner";
import {
  CalendarIcon,
  Check,
  CheckCircle,
  Coffee,
  Home,
  MoreHorizontal,
  PiggyBank,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import {
  formatCurrencyCompact,
  getTransactionColor,
  getBucketColor,
  calculatePercentage,
  BUCKET_ORDER,
} from "@/lib/finance-utils";
import { PageHeader } from "@/components/page-header";
import {
  createRecurring,
  deleteRecurring,
  updateRecurring,
} from "@/lib/actions/recurring";
import type {
  AllocationBucket,
  Category,
  RecurrenceFrequency,
  RecurringTransactionWithCategory,
  TransactionType,
} from "@/types";

type RecurringPageProps = {
  recurring: RecurringTransactionWithCategory[];
  categories: Category[];
};

type RecurringFormState = {
  amount: string;
  type: TransactionType;
  description: string;
  frequency: RecurrenceFrequency;
  startDate: string;
  endDate: string;
  categoryId: string;
};

const FREQUENCIES: Array<{ label: string; value: RecurrenceFrequency }> = [
  { label: "Daily", value: "daily" },
  { label: "Weekly", value: "weekly" },
  { label: "Biweekly", value: "biweekly" },
  { label: "Monthly", value: "monthly" },
  { label: "Quarterly", value: "quarterly" },
  { label: "Yearly", value: "yearly" },
];

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

function getAmountFontSize(len: number): string {
  if (len <= 5) return "text-5xl";
  if (len <= 7) return "text-4xl";
  if (len <= 9) return "text-3xl";
  return "text-2xl";
}

export function RecurringPage({ recurring, categories }: RecurringPageProps) {
  const [status, setStatus] = useState<"active" | "paused">("active");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] =
    useState<RecurringTransactionWithCategory | null>(null);
  const [formState, setFormState] = useState<RecurringFormState>({
    amount: "",
    type: "expense",
    description: "",
    frequency: "monthly",
    startDate: format(new Date(), "yyyy-MM-dd"),
    endDate: "",
    categoryId: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [endDatePickerOpen, setEndDatePickerOpen] = useState(false);
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<{
    id: string;
    message: string;
  } | null>(null);
  const [filterBucket, setFilterBucket] = useState<AllocationBucket>("needs");

  const confirmButtonRefs = useRef<Record<string, HTMLButtonElement | null>>(
    {},
  );
  const deleteButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const prevConfirmingIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (confirmingDeleteId !== null) {
      confirmButtonRefs.current[confirmingDeleteId]?.focus();
    } else if (prevConfirmingIdRef.current !== null) {
      deleteButtonRefs.current[prevConfirmingIdRef.current]?.focus();
    }
    prevConfirmingIdRef.current = confirmingDeleteId;
  }, [confirmingDeleteId]);

  // Summary calculations
  const summary = useMemo(() => {
    const activeItems = recurring.filter((item) => item.isActive);
    let totalIncome = 0;
    let totalExpenses = 0;

    for (const item of activeItems) {
      if (item.type === "income") {
        totalIncome += Number(item.amount);
      } else {
        totalExpenses += Number(item.amount);
      }
    }

    return {
      totalIncome,
      totalExpenses,
      netRecurring: totalIncome - totalExpenses,
      activeCount: activeItems.length,
      pausedCount: recurring.filter((item) => !item.isActive).length,
      expenseRatio:
        totalIncome > 0 ? calculatePercentage(totalExpenses, totalIncome) : 0,
    };
  }, [recurring]);

  const filtered = useMemo(() => {
    return recurring.filter((item) =>
      status === "active" ? item.isActive : !item.isActive,
    );
  }, [recurring, status]);

  const categoriesByType = useMemo(() => {
    const filtered = categories.filter(
      (category) => category.type === formState.type,
    );
    if (formState.type === "expense") {
      return filtered.filter(
        (category) => category.allocationBucket === filterBucket,
      );
    }
    return filtered;
  }, [categories, formState.type, filterBucket]);

  function openCreate() {
    setConfirmingDeleteId(null);
    setEditing(null);
    setFilterBucket("needs");
    setFormState({
      amount: "",
      type: "expense",
      description: "",
      frequency: "monthly",
      startDate: format(new Date(), "yyyy-MM-dd"),
      endDate: "",
      categoryId: "",
    });
    setError("");
    setDatePickerOpen(false);
    setEndDatePickerOpen(false);
    setSheetOpen(true);
  }

  function openEdit(item: RecurringTransactionWithCategory) {
    setConfirmingDeleteId(null);
    setEditing(item);
    setFilterBucket(
      item.type === "expense" && item.category?.allocationBucket
        ? item.category.allocationBucket
        : "needs",
    );
    setFormState({
      amount: Number(item.amount).toString(),
      type: item.type,
      description: item.description ?? "",
      frequency: item.frequency,
      startDate: item.startDate,
      endDate: item.endDate ?? "",
      categoryId: item.categoryId ?? "",
    });
    setError("");
    setDatePickerOpen(false);
    setEndDatePickerOpen(false);
    setSheetOpen(true);
  }

  function switchFilterBucket(bucket: AllocationBucket) {
    setFilterBucket(bucket);
    const currentCat = categories.find((c) => c.id === formState.categoryId);
    if (currentCat?.allocationBucket !== bucket) {
      setFormState((prev) => ({ ...prev, categoryId: "" }));
    }
  }

  async function handleSave() {
    setLoading(true);
    setError("");

    const payload = {
      amount: parseFloat(formState.amount),
      type: formState.type,
      description: formState.description.trim() || undefined,
      frequency: formState.frequency,
      startDate: formState.startDate,
      endDate: formState.endDate || undefined,
      categoryId: formState.categoryId || undefined,
    };

    try {
      const result = editing
        ? await updateRecurring(editing.id, payload)
        : await createRecurring(payload);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSheetOpen(false);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function handleToggle(item: RecurringTransactionWithCategory) {
    try {
      const result = await updateRecurring(item.id, {
        isActive: !item.isActive,
      });
      if (!result.success) {
        toast.error(result.error);
      }
    } catch {
      toast.error("Failed to update recurring item");
    }
  }

  function triggerDelete(item: RecurringTransactionWithCategory) {
    setConfirmingDeleteId(item.id);
    setDeleteError(null);
  }

  async function confirmDelete(item: RecurringTransactionWithCategory) {
    setConfirmingDeleteId(null);
    setDeletingId(item.id);
    setDeleteError(null);
    try {
      const result = await deleteRecurring(item.id);
      if (!result.success) {
        setDeleteError({ id: item.id, message: result.error });
      }
    } catch {
      setDeleteError({
        id: item.id,
        message: "Failed to delete recurring item",
      });
    } finally {
      setDeletingId(null);
    }
  }

  const canSave =
    parseFloat(formState.amount) > 0 &&
    formState.startDate.length > 0 &&
    formState.frequency.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Recurring"
        description="Automate income and expenses on a schedule."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={openCreate}
            className="min-h-[44px]"
          >
            Add recurring
          </Button>
        }
      />

      {/* Summary Card */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-center flex-1">
            <p className="text-xs text-muted-foreground">Total Income</p>
            <p className="text-lg font-semibold text-[#6aaa6a]">
              {formatCurrencyCompact(summary.totalIncome)}
            </p>
          </div>
          <div className="text-center flex-1 border-x border-border">
            <p className="text-xs text-muted-foreground">Total Expenses</p>
            <p className="text-lg font-semibold text-[#e05252]">
              {formatCurrencyCompact(summary.totalExpenses)}
            </p>
          </div>
          <div className="text-center flex-1">
            <p className="text-xs text-muted-foreground">Net Recurring</p>
            <p
              className={cn(
                "text-lg font-semibold",
                summary.netRecurring >= 0 ? "text-[#6aaa6a]" : "text-[#e05252]",
              )}
            >
              {summary.netRecurring >= 0 ? "+" : ""}
              {formatCurrencyCompact(summary.netRecurring)}
            </p>
          </div>
        </div>

        {summary.totalIncome > 0 && (
          <Progress
            value={summary.expenseRatio}
            className="h-2"
            indicatorClassName={
              summary.expenseRatio >= 100 ? "bg-[#e05252]" : "bg-primary"
            }
          />
        )}

        <div className="flex justify-center gap-4 text-xs text-muted-foreground">
          <span>{summary.activeCount} active</span>
          <span>{summary.pausedCount} paused</span>
        </div>
      </div>

      <Tabs
        value={status}
        onValueChange={(value) => setStatus(value as "active" | "paused")}
      >
        <TabsList className="w-full">
          <TabsTrigger value="active" className="flex-1">
            Active ({recurring.filter((item) => item.isActive).length})
          </TabsTrigger>
          <TabsTrigger value="paused" className="flex-1">
            Paused ({recurring.filter((item) => !item.isActive).length})
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center space-y-4">
            <div className="text-4xl">{status === "active" ? "🔄" : "⏸️"}</div>
            <p className="font-semibold text-foreground">
              {status === "active"
                ? "No active recurring items"
                : "No paused recurring items"}
            </p>
            <p className="text-sm text-muted-foreground">
              {status === "active"
                ? "Set up recurring transactions to automate your finances."
                : "Paused items will appear here."}
            </p>
            {status === "active" && (
              <Button
                onClick={openCreate}
                variant="outline"
                className="min-h-[44px]"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add recurring
              </Button>
            )}
          </div>
        ) : (
          filtered.map((item) => {
            const isConfirming = confirmingDeleteId === item.id;
            const isDeleting = deletingId === item.id;
            const typeColor = getTransactionColor(item.type);

            return (
              <div key={item.id}>
                <Card
                  className="overflow-hidden"
                  style={{
                    borderLeftWidth: "3px",
                    borderLeftColor: typeColor,
                  }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-10 w-10 rounded-full flex items-center justify-center text-lg shrink-0"
                          style={{ backgroundColor: typeColor + "26" }}
                        >
                          {item.category?.icon ?? "•"}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">
                            {item.description ||
                              item.category?.name ||
                              "Recurring"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {item.frequency} • Next{" "}
                            {format(new Date(item.nextDueDate), "MMM d")}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <p
                          className="text-lg font-semibold"
                          style={{ color: typeColor }}
                        >
                          {item.type === "expense" ? "-" : "+"}
                          {formatCurrencyCompact(item.amount)}
                        </p>

                        {isConfirming ? (
                          <div className="flex items-center gap-1">
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="min-h-[44px]"
                              aria-label="Confirm delete"
                              ref={(el) => {
                                confirmButtonRefs.current[item.id] = el;
                              }}
                              onClick={() => confirmDelete(item)}
                            >
                              <Check className="h-4 w-4" />
                            </Button>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="min-h-[44px]"
                              aria-label="Cancel delete"
                              onClick={() => setConfirmingDeleteId(null)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="min-h-[44px] min-w-[44px] -mr-2 shrink-0"
                                aria-label={`Options for ${item.description || "recurring item"}`}
                                disabled={isDeleting}
                                ref={(el) => {
                                  deleteButtonRefs.current[item.id] = el;
                                }}
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openEdit(item)}>
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleToggle(item)}
                              >
                                {item.isActive ? "Pause" : "Resume"}
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive"
                                onClick={() => triggerDelete(item)}
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {deleteError?.id === item.id && (
                  <p className="text-xs text-destructive mt-2" role="alert">
                    {deleteError.message}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Create/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[90vh] rounded-t-3xl border border-border bg-card p-0 [&>button]:hidden"
        >
          <div className="flex max-h-[90vh] flex-col">
            <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-2xl font-bold">
                  {editing ? "Edit Recurring" : "New Recurring"}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  {editing
                    ? "Update the schedule and details."
                    : "Automate a repeating income or expense."}
                </SheetDescription>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  aria-label="Close"
                  className="flex min-h-[44px] min-w-[44px] items-center justify-center rounded-full bg-border text-muted-foreground transition-colors hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              {/* Amount */}
              <div
                className="relative rounded-2xl px-4 py-5 text-center"
                style={{
                  background:
                    "radial-gradient(ellipse at 50% 100%, #c97a5a18 0%, transparent 70%)",
                }}
              >
                <div className="flex items-center justify-center">
                  <span
                    className={cn(
                      "mr-2 font-mono font-extrabold text-primary transition-all duration-200",
                      getAmountFontSize(formState.amount.length),
                    )}
                  >
                    $
                  </span>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    aria-label="Amount"
                    className={cn(
                      "w-full border-none bg-transparent p-0 text-center font-mono font-extrabold shadow-none transition-all duration-200",
                      "placeholder:text-muted-foreground/20 focus-visible:ring-0",
                      getAmountFontSize(formState.amount.length),
                    )}
                    value={formState.amount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, "");
                      if ((val.match(/\./g) ?? []).length <= 1) {
                        setFormState((prev) => ({ ...prev, amount: val }));
                      }
                    }}
                  />
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <Label
                  htmlFor="description"
                  className="text-xs font-bold text-muted-foreground uppercase tracking-widest"
                >
                  Description
                </Label>
                <Input
                  id="description"
                  value={formState.description}
                  onChange={(e) =>
                    setFormState((prev) => ({
                      ...prev,
                      description: e.target.value,
                    }))
                  }
                  placeholder="e.g., Netflix, Rent, Salary..."
                  className="h-14 rounded-2xl bg-background border-border"
                />
              </div>

              {/* Type toggle */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Type
                </Label>
                <div className="relative flex rounded-2xl bg-border p-1">
                  <div
                    className="absolute inset-y-1 w-[calc(50%-4px)] rounded-xl bg-primary transition-all duration-200"
                    style={{
                      left: formState.type === "expense" ? 4 : "calc(50%)",
                    }}
                  />
                  {(["expense", "income"] as const).map((option) => (
                    <button
                      key={option}
                      type="button"
                      aria-pressed={formState.type === option}
                      onClick={() => {
                        setFormState((prev) => ({
                          ...prev,
                          type: option,
                          categoryId: "",
                        }));
                        if (option === "income") {
                          setFilterBucket("needs");
                        }
                      }}
                      className={cn(
                        "relative z-10 flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200",
                        formState.type === option
                          ? "text-white"
                          : "text-foreground/25",
                      )}
                    >
                      {option === "expense" ? "Expense" : "Income"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Bucket selector - only for expense type */}
              {formState.type === "expense" && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Bucket
                  </Label>
                  <div className="grid grid-cols-3 gap-2">
                    {BUCKET_ORDER.map((bucket) => {
                      const { label, Icon, borderClass, textClass, color } =
                        BUCKET_META[bucket];
                      const isActive = filterBucket === bucket;
                      return (
                        <button
                          key={bucket}
                          type="button"
                          aria-pressed={isActive}
                          aria-label={label}
                          onClick={() => switchFilterBucket(bucket)}
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
                </div>
              )}

              {/* Frequency selector */}
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Frequency
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {FREQUENCIES.map((freq) => {
                    const isActive = formState.frequency === freq.value;
                    return (
                      <button
                        key={freq.value}
                        type="button"
                        aria-pressed={isActive}
                        onClick={() =>
                          setFormState((prev) => ({
                            ...prev,
                            frequency: freq.value,
                          }))
                        }
                        className={cn(
                          "min-h-[44px] rounded-xl border px-3 py-2 text-sm font-medium transition-all duration-200 active:scale-95",
                          isActive
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50",
                        )}
                      >
                        {freq.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category chips */}
              {categoriesByType.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Category
                  </Label>
                  <div className="relative -mx-6">
                    <div className="flex gap-2 overflow-x-auto px-6 pb-1 [&::-webkit-scrollbar]:hidden">
                      {categoriesByType.map((category) => {
                        const isActive = formState.categoryId === category.id;
                        // Use bucket color for expense categories, type color for income
                        const chipColor =
                          formState.type === "expense" &&
                          category.allocationBucket
                            ? getBucketColor(category.allocationBucket)
                            : getTransactionColor(formState.type);
                        return (
                          <button
                            key={category.id}
                            type="button"
                            aria-pressed={isActive}
                            aria-label={`Select ${category.name}`}
                            onClick={() =>
                              setFormState((prev) => ({
                                ...prev,
                                categoryId: isActive ? "" : category.id,
                              }))
                            }
                            className="min-h-[44px] shrink-0 whitespace-nowrap rounded-xl border px-3 py-1.5 text-sm font-medium transition-all duration-200 active:scale-95"
                            style={{
                              borderColor: isActive
                                ? chipColor
                                : "var(--border)",
                              color: isActive
                                ? chipColor
                                : "var(--muted-foreground)",
                              backgroundColor: isActive
                                ? chipColor + "18"
                                : undefined,
                            }}
                          >
                            <span className="flex items-center gap-1.5">
                              {category.icon && (
                                <span className="text-sm">{category.icon}</span>
                              )}
                              {category.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                    <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-card to-transparent" />
                  </div>
                </div>
              )}

              {/* Start Date picker */}
              <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-12 w-full justify-start rounded-2xl border border-border bg-background font-normal hover:bg-background/80"
                  >
                    <CalendarIcon className="mr-3 h-4 w-4 text-primary" />
                    {formState.startDate ? (
                      <span className="text-foreground">
                        {format(parseISO(formState.startDate), "MMMM d, yyyy")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">Start date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-0"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={
                      formState.startDate
                        ? parseISO(formState.startDate)
                        : undefined
                    }
                    onSelect={(day) => {
                      if (day) {
                        setFormState((prev) => ({
                          ...prev,
                          startDate: format(day, "yyyy-MM-dd"),
                        }));
                        setDatePickerOpen(false);
                      }
                    }}
                    className="w-full [--cell-size:2.25rem]"
                    classNames={{ root: "w-full" }}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>

              {/* End Date picker */}
              <Popover
                open={endDatePickerOpen}
                onOpenChange={setEndDatePickerOpen}
              >
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-12 w-full justify-start rounded-2xl border border-border bg-background font-normal hover:bg-background/80"
                  >
                    <CalendarIcon className="mr-3 h-4 w-4 text-muted-foreground" />
                    {formState.endDate ? (
                      <span className="text-foreground">
                        {format(parseISO(formState.endDate), "MMMM d, yyyy")}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">
                        End date (optional)
                      </span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent
                  className="w-[var(--radix-popover-trigger-width)] p-0"
                  align="start"
                >
                  <Calendar
                    mode="single"
                    selected={
                      formState.endDate
                        ? parseISO(formState.endDate)
                        : undefined
                    }
                    fromDate={
                      formState.startDate
                        ? parseISO(formState.startDate)
                        : undefined
                    }
                    onSelect={(day) => {
                      if (day) {
                        setFormState((prev) => ({
                          ...prev,
                          endDate: format(day, "yyyy-MM-dd"),
                        }));
                        setEndDatePickerOpen(false);
                      }
                    }}
                    className="w-full [--cell-size:2.25rem]"
                    classNames={{ root: "w-full" }}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>

              {error && (
                <p
                  className="rounded-xl bg-destructive/10 p-3 text-center text-sm text-destructive"
                  role="alert"
                >
                  {error}
                </p>
              )}
            </div>

            <div className="border-t border-border bg-card px-6 pb-8 pt-4">
              <Button
                type="button"
                onClick={handleSave}
                disabled={!canSave || loading}
                className="flex w-full items-center justify-center gap-2 rounded-3xl py-6 text-base font-bold text-white shadow-xl active:scale-[0.98] transition-all duration-200 hover:opacity-90 disabled:opacity-40"
                style={{
                  background: "linear-gradient(to right, #c97a5a, #a36248)",
                }}
              >
                {loading ? "Saving…" : editing ? "Update" : "Save"}
                <CheckCircle className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
