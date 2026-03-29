"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { format, addMonths, parseISO, subMonths } from "date-fns";
import {
  CalendarIcon,
  Check,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Coffee,
  Home,
  MoreHorizontal,
  PiggyBank,
  Plus,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { cn } from "@/lib/utils";
import {
  BUCKET_ORDER,
  calculatePercentage,
  getBucketColor,
  formatAmountDisplay,
  parseAmountInput,
} from "@/lib/finance-utils";
import { useCurrency } from "@/components/currency-provider";
import { PageHeader } from "@/components/page-header";
import {
  createBudget,
  deleteBudget,
  updateBudget,
} from "@/lib/actions/budgets";
import type { AllocationBucket, BudgetWithSpending, Category } from "@/types";

type BudgetsPageProps = {
  budgets: BudgetWithSpending[];
  categories: Category[];
  initialMonth: string;
};

type BudgetFormState = {
  categoryId: string;
  amount: string;
  period: "monthly" | "weekly";
  startDate: string;
};

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

export function BudgetsPage({
  budgets,
  categories,
  initialMonth,
}: BudgetsPageProps) {
  const router = useRouter();
  const { formatCurrencyCompact } = useCurrency();
  const [month, setMonth] = useState(initialMonth);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<BudgetWithSpending | null>(null);
  const [formState, setFormState] = useState<BudgetFormState>({
    categoryId: "",
    amount: "",
    period: "monthly",
    startDate: `${initialMonth}-01`,
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [datePickerOpen, setDatePickerOpen] = useState(false);
  const [filterBucket, setFilterBucket] = useState<AllocationBucket>("needs");
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(
    null,
  );
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<{
    id: string;
    message: string;
  } | null>(null);

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

  const monthDate = new Date(`${month}-01T00:00:00`);

  const summary = useMemo(() => {
    const totalBudgeted = budgets.reduce(
      (sum, budget) => sum + Number(budget.amount),
      0,
    );
    const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
    const overallProgress = calculatePercentage(totalSpent, totalBudgeted);
    return {
      totalBudgeted,
      totalSpent,
      remaining: totalBudgeted - totalSpent,
      overallProgress,
    };
  }, [budgets]);

  const grouped = useMemo(() => {
    return BUCKET_ORDER.map((bucket) => ({
      bucket,
      label: bucket[0].toUpperCase() + bucket.slice(1),
      budgets: budgets.filter(
        (budget) => budget.category.allocationBucket === bucket,
      ),
    }));
  }, [budgets]);

  const expenseCategories = categories.filter(
    (category) => category.type === "expense",
  );

  function openCreate() {
    setConfirmingDeleteId(null);
    setEditing(null);
    setFilterBucket("needs");
    setFormState({
      categoryId: "",
      amount: "",
      period: "monthly",
      startDate: `${month}-01`,
    });
    setError("");
    setDatePickerOpen(false);
    setSheetOpen(true);
  }

  function openEdit(budget: BudgetWithSpending) {
    setConfirmingDeleteId(null);
    setEditing(budget);
    setFilterBucket(budget.category.allocationBucket ?? "needs");
    setFormState({
      categoryId: budget.categoryId,
      amount: Number(budget.amount).toString(),
      period: budget.period,
      startDate: budget.startDate,
    });
    setError("");
    setDatePickerOpen(false);
    setSheetOpen(true);
  }

  function switchFilterBucket(bucket: AllocationBucket) {
    setFilterBucket(bucket);
    const currentCat = expenseCategories.find(
      (c) => c.id === formState.categoryId,
    );
    if (currentCat?.allocationBucket !== bucket) {
      setFormState((prev) => ({ ...prev, categoryId: "" }));
    }
  }

  async function handleSave() {
    setLoading(true);
    setError("");

    const payload = {
      categoryId: formState.categoryId,
      amount: parseFloat(formState.amount),
      period: formState.period,
      startDate: formState.startDate,
    };

    try {
      const result = editing
        ? await updateBudget(editing.id, payload)
        : await createBudget(payload);

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

  function triggerDelete(budget: BudgetWithSpending) {
    setConfirmingDeleteId(budget.id);
    setDeleteError(null);
  }

  async function confirmDelete(budget: BudgetWithSpending) {
    setConfirmingDeleteId(null);
    setDeletingId(budget.id);
    setDeleteError(null);
    try {
      const result = await deleteBudget(budget.id);
      if (!result.success) {
        setDeleteError({ id: budget.id, message: result.error });
      }
    } catch {
      setDeleteError({ id: budget.id, message: "Failed to delete budget" });
    } finally {
      setDeletingId(null);
    }
  }

  const canSave =
    formState.categoryId.length > 0 &&
    parseFloat(formState.amount) > 0 &&
    formState.startDate.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Budgets"
        description="Plan spending by category for the month ahead."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={openCreate}
            className="min-h-[44px]"
          >
            New budget
          </Button>
        }
      />

      {/* Month navigation + summary */}
      <div className="rounded-xl border border-border bg-card p-4 space-y-4">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const newMonth = format(subMonths(monthDate, 1), "yyyy-MM");
              setMonth(newMonth);
              router.push(`/budgets?month=${newMonth}`);
            }}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-center">
            <p className="text-sm font-medium text-foreground">
              {format(monthDate, "MMMM yyyy")}
            </p>
            <p className="text-xs text-muted-foreground">Budget overview</p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              const newMonth = format(addMonths(monthDate, 1), "yyyy-MM");
              setMonth(newMonth);
              router.push(`/budgets?month=${newMonth}`);
            }}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <Progress
          value={summary.overallProgress}
          className="h-2"
          indicatorClassName={
            summary.overallProgress >= 100 ? "bg-destructive" : "bg-primary"
          }
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <p className="text-xs text-muted-foreground">Budgeted</p>
            <p className="text-lg font-semibold text-foreground">
              {formatCurrencyCompact(summary.totalBudgeted)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Spent</p>
            <p className="text-lg font-semibold text-foreground">
              {formatCurrencyCompact(summary.totalSpent)}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Remaining</p>
            <p
              className={cn(
                "text-lg font-semibold",
                summary.remaining < 0 ? "text-destructive" : "text-foreground",
              )}
            >
              {formatCurrencyCompact(summary.remaining)}
            </p>
          </div>
        </div>
      </div>

      {/* Budget groups */}
      <div className="space-y-4">
        {grouped.map((group) => (
          <div key={group.bucket} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">
                {group.label}
              </h2>
              <span className="text-xs text-muted-foreground">
                {group.budgets.length} budgets
              </span>
            </div>

            {group.budgets.length === 0 ? (
              <div className="rounded-2xl border border-border bg-card p-10 text-center space-y-4">
                <div className="text-4xl">💸</div>
                <p className="font-semibold text-foreground">
                  No {group.label} budgets yet
                </p>
                <p className="text-sm text-muted-foreground">
                  Add a budget to track your {group.label.toLowerCase()}{" "}
                  spending.
                </p>
                <Button
                  onClick={openCreate}
                  variant="outline"
                  className="min-h-[44px]"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add budget
                </Button>
              </div>
            ) : (
              group.budgets.map((budget) => {
                const spent = budget.spent;
                const total = Number(budget.amount);
                const progress = calculatePercentage(spent, total);
                const overspent = spent > total;
                const isConfirming = confirmingDeleteId === budget.id;
                const isDeleting = deletingId === budget.id;

                return (
                  <div key={budget.id}>
                    <div
                      className="rounded-xl border border-border bg-card p-4 space-y-3"
                      style={{
                        borderLeftWidth: "3px",
                        borderLeftColor: getBucketColor(group.bucket),
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div
                            className="h-10 w-10 rounded-full flex items-center justify-center text-lg shrink-0"
                            style={{
                              backgroundColor:
                                getBucketColor(group.bucket) + "26",
                            }}
                          >
                            {budget.category.icon ?? "•"}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">
                              {budget.category.name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {formatCurrencyCompact(spent)} of{" "}
                              {formatCurrencyCompact(total)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {isConfirming ? (
                            <>
                              <span className="text-sm text-muted-foreground">
                                Delete?
                              </span>
                              <Button
                                type="button"
                                variant="destructive"
                                size="sm"
                                className="min-h-[44px]"
                                aria-label="Confirm delete"
                                ref={(el) => {
                                  confirmButtonRefs.current[budget.id] = el;
                                }}
                                onClick={() => confirmDelete(budget)}
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
                            </>
                          ) : (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="min-h-[44px] min-w-[44px] -mr-2 shrink-0"
                                  aria-label={`Options for ${budget.category.name}`}
                                  disabled={isDeleting}
                                  ref={(el) => {
                                    deleteButtonRefs.current[budget.id] = el;
                                  }}
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => openEdit(budget)}
                                >
                                  Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  className="text-destructive focus:text-destructive"
                                  onClick={() => triggerDelete(budget)}
                                >
                                  Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}
                        </div>
                      </div>

                      <Progress
                        value={progress}
                        className="h-2"
                        style={{
                          backgroundColor: getBucketColor(group.bucket) + "22",
                        }}
                        indicatorStyle={{
                          backgroundColor: getBucketColor(group.bucket),
                        }}
                      />

                      <div className="flex items-center justify-between text-xs">
                        <span style={{ color: getBucketColor(group.bucket) }}>
                          {group.label}
                        </span>
                        {overspent && (
                          <span className="text-destructive">Over budget</span>
                        )}
                      </div>
                    </div>

                    {deleteError?.id === budget.id && (
                      <p className="text-xs text-destructive mt-2" role="alert">
                        {deleteError.message}
                      </p>
                    )}
                  </div>
                );
              })
            )}
          </div>
        ))}
      </div>

      {/* Create / Edit sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[90vh] rounded-t-3xl border border-border bg-card p-0 [&>button]:hidden"
        >
          <div className="flex max-h-[90vh] flex-col">
            <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-2xl font-bold">
                  {editing ? "Edit Budget" : "New Budget"}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  {editing
                    ? "Update the budget limits below."
                    : "Set monthly targets per category."}
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
                      getAmountFontSize(
                        formState.amount.replace(/,/g, "").length,
                      ),
                    )}
                  >
                    $
                  </span>
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    aria-label="Budget amount"
                    className={cn(
                      "w-full border-none bg-transparent p-0 text-center font-mono font-extrabold shadow-none transition-all duration-200",
                      "placeholder:text-muted-foreground/20 focus-visible:ring-0",
                      getAmountFontSize(
                        formState.amount.replace(/,/g, "").length,
                      ),
                    )}
                    value={formatAmountDisplay(formState.amount)}
                    onChange={(e) => {
                      const val = parseAmountInput(e.target.value);
                      setFormState((prev) => ({ ...prev, amount: val }));
                    }}
                  />
                </div>
              </div>

              {/* Period toggle */}
              <div className="relative flex rounded-2xl bg-border p-1">
                <div
                  className="absolute inset-y-1 w-[calc(50%-4px)] rounded-xl bg-primary transition-all duration-200"
                  style={{
                    left: formState.period === "monthly" ? 4 : "calc(50%)",
                  }}
                />
                {(["monthly", "weekly"] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    aria-pressed={formState.period === option}
                    onClick={() =>
                      setFormState((prev) => ({ ...prev, period: option }))
                    }
                    className={cn(
                      "relative z-10 flex-1 rounded-xl py-2.5 text-sm font-semibold transition-all duration-200",
                      formState.period === option
                        ? "text-white"
                        : "text-foreground/25",
                    )}
                  >
                    {option === "monthly" ? "Monthly" : "Weekly"}
                  </button>
                ))}
              </div>

              {/* Bucket selector */}
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

              {/* Category chips */}
              {expenseCategories.filter(
                (c) => c.allocationBucket === filterBucket,
              ).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No categories in this bucket yet.
                </p>
              ) : (
                <div className="relative -mx-6">
                  <div className="flex gap-2 overflow-x-auto px-6 pb-1 [&::-webkit-scrollbar]:hidden">
                    {expenseCategories
                      .filter((c) => c.allocationBucket === filterBucket)
                      .map((category) => {
                        const isActive = formState.categoryId === category.id;
                        const color = getBucketColor(category.allocationBucket);
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
                              borderColor: isActive ? color : "var(--border)",
                              color: isActive
                                ? color
                                : "var(--muted-foreground)",
                              backgroundColor: isActive
                                ? `${color}18`
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
              )}

              {/* Date picker */}
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
