"use client";

import { useMemo, useState } from "react";
import { format, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatCurrencyCompact, getBucketColor } from "@/lib/finance-utils";
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

const BUCKETS: AllocationBucket[] = ["needs", "wants", "future"];

export function BudgetsPage({ budgets, categories, initialMonth }: BudgetsPageProps) {
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

  const monthDate = new Date(`${month}-01T00:00:00`);

  const summary = useMemo(() => {
    const totalBudgeted = budgets.reduce((sum, budget) => sum + Number(budget.amount), 0);
    const totalSpent = budgets.reduce((sum, budget) => sum + budget.spent, 0);
    return {
      totalBudgeted,
      totalSpent,
      remaining: totalBudgeted - totalSpent,
    };
  }, [budgets]);

  const grouped = useMemo(() => {
    return BUCKETS.map((bucket) => ({
      bucket,
      label: bucket[0].toUpperCase() + bucket.slice(1),
      budgets: budgets.filter(
        (budget) => budget.category.allocationBucket === bucket
      ),
    }));
  }, [budgets]);

  const expenseCategories = categories.filter(
    (category) => category.type === "expense"
  );

  function openCreate() {
    setEditing(null);
    setFormState({
      categoryId: "",
      amount: "",
      period: "monthly",
      startDate: `${month}-01`,
    });
    setError("");
    setSheetOpen(true);
  }

  function openEdit(budget: BudgetWithSpending) {
    setEditing(budget);
    setFormState({
      categoryId: budget.categoryId,
      amount: Number(budget.amount).toString(),
      period: budget.period,
      startDate: budget.startDate,
    });
    setError("");
    setSheetOpen(true);
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

    const result = editing
      ? await updateBudget(editing.id, payload)
      : await createBudget(payload);

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    setSheetOpen(false);
  }

  async function handleDelete(budget: BudgetWithSpending) {
    if (!window.confirm(`Delete ${budget.category.name} budget?`)) return;
    const result = await deleteBudget(budget.id);
    if (!result.success) {
      setError(result.error);
    }
  }

  const canSave =
    formState.categoryId.length > 0 &&
    parseFloat(formState.amount) > 0 &&
    formState.startDate.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Budgets</h1>
          <p className="text-sm text-muted-foreground">
            Plan spending by category for the month ahead.
          </p>
        </div>
        <Button onClick={openCreate} className="min-h-[44px]">
          <Plus className="h-4 w-4" />
          New budget
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                const newDate = subMonths(monthDate, 1);
                setMonth(format(newDate, "yyyy-MM"));
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
                const newDate = addMonths(monthDate, 1);
                setMonth(format(newDate, "yyyy-MM"));
              }}
              aria-label="Next month"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

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
                  summary.remaining < 0 ? "text-destructive" : "text-foreground"
                )}
              >
                {formatCurrencyCompact(summary.remaining)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {grouped.map((group) => (
          <div key={group.bucket} className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-semibold text-foreground">{group.label}</h2>
              <span className="text-xs text-muted-foreground">
                {group.budgets.length} budgets
              </span>
            </div>
            {group.budgets.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">
                No budgets in this bucket yet.
              </div>
            ) : (
              group.budgets.map((budget) => {
                const spent = budget.spent;
                const total = Number(budget.amount);
                const progress = total > 0 ? Math.min(100, Math.round((spent / total) * 100)) : 0;
                const overspent = spent > total;

                return (
                  <Card key={budget.id}>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">{budget.category.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {formatCurrencyCompact(spent)} of {formatCurrencyCompact(total)}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="min-h-[44px]"
                            onClick={() => openEdit(budget)}
                          >
                            Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="min-h-[44px] text-destructive hover:text-destructive"
                            onClick={() => handleDelete(budget)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      <Progress
                        value={progress}
                        className="h-2"
                        style={{ backgroundColor: `${getBucketColor(group.bucket)}22` }}
                      />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span style={{ color: getBucketColor(group.bucket) }}>{group.label}</span>
                        {overspent && <span className="text-destructive">Over budget</span>}
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        ))}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-6">
          <SheetHeader className="text-left">
            <SheetTitle>{editing ? "Edit budget" : "New budget"}</SheetTitle>
            <SheetDescription>
              {editing
                ? "Update the budget limits below."
                : "Set monthly targets per category."}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formState.categoryId}
                onValueChange={(value) =>
                  setFormState((prev) => ({ ...prev, categoryId: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.icon ? `${category.icon} ` : ""}
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                min="0.01"
                step="0.01"
                value={formState.amount}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, amount: event.target.value }))
                }
                placeholder="500"
              />
            </div>

            <div className="space-y-2">
              <Label>Period</Label>
              <div className="grid grid-cols-2 gap-2">
                {["monthly", "weekly"].map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() =>
                      setFormState((prev) => ({
                        ...prev,
                        period: option as "monthly" | "weekly",
                      }))
                    }
                    className={cn(
                      "min-h-[44px] rounded-lg border text-sm font-medium transition",
                      formState.period === option
                        ? "border-accent text-accent bg-accent/10"
                        : "border-border text-muted-foreground"
                    )}
                  >
                    {option === "monthly" ? "Monthly" : "Weekly"}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="startDate">Start date</Label>
              <Input
                id="startDate"
                type="date"
                value={formState.startDate}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, startDate: event.target.value }))
                }
              />
            </div>

            {error && (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            )}

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => setSheetOpen(false)}
              >
                Cancel
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={handleSave}
                disabled={!canSave || loading}
              >
                {loading ? "Saving…" : "Save"}
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
