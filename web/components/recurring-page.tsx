"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import { PauseCircle, PlayCircle, Plus, Trash2 } from "lucide-react";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { formatCurrencyCompact, getTransactionColor } from "@/lib/finance-utils";
import {
  createRecurring,
  deleteRecurring,
  updateRecurring,
} from "@/lib/actions/recurring";
import type {
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

export function RecurringPage({ recurring, categories }: RecurringPageProps) {
  const [status, setStatus] = useState<"active" | "paused">("active");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editing, setEditing] = useState<RecurringTransactionWithCategory | null>(null);
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

  const filtered = useMemo(() => {
    return recurring.filter((item) => (status === "active" ? item.isActive : !item.isActive));
  }, [recurring, status]);

  const categoriesByType = useMemo(() => {
    return categories.filter((category) => category.type === formState.type);
  }, [categories, formState.type]);

  function openCreate() {
    setEditing(null);
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
    setSheetOpen(true);
  }

  function openEdit(item: RecurringTransactionWithCategory) {
    setEditing(item);
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
    setSheetOpen(true);
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

    const result = editing
      ? await updateRecurring(editing.id, payload)
      : await createRecurring(payload);

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    setSheetOpen(false);
  }

  async function handleToggle(item: RecurringTransactionWithCategory) {
    const result = await updateRecurring(item.id, { isActive: !item.isActive });
    if (!result.success) {
      setError(result.error);
    }
  }

  async function handleDelete(item: RecurringTransactionWithCategory) {
    if (!window.confirm(`Delete ${item.description || "recurring item"}?`)) return;
    const result = await deleteRecurring(item.id);
    if (!result.success) {
      setError(result.error);
    }
  }

  const canSave =
    parseFloat(formState.amount) > 0 &&
    formState.startDate.length > 0 &&
    formState.frequency.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Recurring</h1>
          <p className="text-sm text-muted-foreground">
            Automate income and expenses on a schedule.
          </p>
        </div>
        <Button onClick={openCreate} className="min-h-[44px]">
          <Plus className="h-4 w-4" />
          Add recurring
        </Button>
      </div>

      <Tabs value={status} onValueChange={(value) => setStatus(value as "active" | "paused")}
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
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No recurring items here yet.
          </div>
        ) : (
          filtered.map((item) => (
            <Card key={item.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg">
                      {item.category?.icon ?? "•"}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {item.description || item.category?.name || "Recurring"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {item.frequency} • Next {format(new Date(item.nextDueDate), "MMM d")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p
                      className="text-sm font-semibold"
                      style={{ color: getTransactionColor(item.type) }}
                    >
                      {item.type === "expense" ? "-" : "+"}
                      {formatCurrencyCompact(item.amount)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.type === "expense" ? "Expense" : "Income"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="min-h-[44px]"
                    onClick={() => openEdit(item)}
                    aria-label={`Edit ${item.description || "recurring item"}`}
                  >
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn(
                      "min-h-[44px]",
                      item.isActive ? "text-muted-foreground" : "text-accent"
                    )}
                    onClick={() => handleToggle(item)}
                    aria-label={item.isActive ? "Pause recurring" : "Resume recurring"}
                  >
                    {item.isActive ? (
                      <>
                        <PauseCircle className="h-4 w-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-4 w-4" />
                        Resume
                      </>
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="min-h-[44px] text-destructive hover:text-destructive"
                    onClick={() => handleDelete(item)}
                    aria-label={`Delete ${item.description || "recurring item"}`}
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-6">
          <SheetHeader className="text-left">
            <SheetTitle>{editing ? "Edit recurring" : "New recurring"}</SheetTitle>
            <SheetDescription>
              {editing
                ? "Update the schedule and details."
                : "Automate a repeating income or expense."}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                value={formState.description}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder="Netflix"
              />
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
                placeholder="15"
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Tabs
                value={formState.type}
                onValueChange={(value) =>
                  setFormState((prev) => ({
                    ...prev,
                    type: value as TransactionType,
                    categoryId: "",
                  }))
                }
              >
                <TabsList className="w-full">
                  <TabsTrigger value="expense" className="flex-1">
                    Expense
                  </TabsTrigger>
                  <TabsTrigger value="income" className="flex-1">
                    Income
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

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
                  {categoriesByType.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.icon ? `${category.icon} ` : ""}
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Frequency</Label>
              <Select
                value={formState.frequency}
                onValueChange={(value) =>
                  setFormState((prev) => ({
                    ...prev,
                    frequency: value as RecurrenceFrequency,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {FREQUENCIES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            <div className="space-y-2">
              <Label htmlFor="endDate">End date (optional)</Label>
              <Input
                id="endDate"
                type="date"
                value={formState.endDate}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, endDate: event.target.value }))
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
