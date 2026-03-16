"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { getBucketColor } from "@/lib/finance-utils";
import {
  createCategory,
  deleteCategory,
  updateCategory,
} from "@/lib/actions/categories";
import type { AllocationBucket, Category, TransactionType } from "@/types";

const TYPE_OPTIONS: Array<{ label: string; value: TransactionType }> = [
  { label: "Expense", value: "expense" },
  { label: "Income", value: "income" },
];

const BUCKET_OPTIONS: Array<{ label: string; value: AllocationBucket }> = [
  { label: "Needs", value: "needs" },
  { label: "Wants", value: "wants" },
  { label: "Future", value: "future" },
];

type CategoryFormState = {
  name: string;
  icon: string;
  type: TransactionType;
  allocationBucket: AllocationBucket | "";
};

type CategoriesPageProps = {
  categories: Category[];
};

export function CategoriesPage({ categories }: CategoriesPageProps) {
  const router = useRouter();
  const [type, setType] = useState<TransactionType>("expense");
  const [bucket, setBucket] = useState<AllocationBucket>("needs");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formState, setFormState] = useState<CategoryFormState>({
    name: "",
    icon: "",
    type: "expense",
    allocationBucket: "needs",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredCategories = useMemo(() => {
    return categories.filter((category) => {
      if (category.type !== type) return false;
      if (type === "income") return true;
      return category.allocationBucket === bucket;
    });
  }, [categories, type, bucket]);

  const counts = useMemo(() => {
    return BUCKET_OPTIONS.reduce<Record<AllocationBucket, number>>(
      (acc, option) => {
        acc[option.value] = categories.filter(
          (category) =>
            category.type === "expense" && category.allocationBucket === option.value
        ).length;
        return acc;
      },
      { needs: 0, wants: 0, future: 0 }
    );
  }, [categories]);

  function openCreate() {
    setEditingCategory(null);
    setFormState({
      name: "",
      icon: "",
      type: "expense",
      allocationBucket: "needs",
    });
    setError("");
    setSheetOpen(true);
  }

  function openEdit(category: Category) {
    setEditingCategory(category);
    setFormState({
      name: category.name,
      icon: category.icon ?? "",
      type: category.type,
      allocationBucket: category.allocationBucket ?? "",
    });
    setError("");
    setSheetOpen(true);
  }

  async function handleSave() {
    setLoading(true);
    setError("");

    const payload = {
      name: formState.name.trim(),
      icon: formState.icon.trim() || undefined,
      type: formState.type,
      allocationBucket:
        formState.type === "expense" && formState.allocationBucket
          ? formState.allocationBucket
          : undefined,
    };

    const result = editingCategory
      ? await updateCategory(editingCategory.id, payload)
      : await createCategory(payload);

    if (!result.success) {
      setError(result.error);
      setLoading(false);
      return;
    }

    setLoading(false);
    setSheetOpen(false);
    router.refresh();
  }

  async function handleDelete(category: Category) {
    if (!window.confirm(`Delete ${category.name}?`)) return;
    const result = await deleteCategory(category.id);
    if (!result.success) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  const canSave =
    formState.name.trim().length > 0 &&
    (formState.type === "income" || formState.allocationBucket !== "");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-semibold text-foreground">Categories</h1>
          <p className="text-sm text-muted-foreground">
            Organize income sources and spending buckets.
          </p>
        </div>
        <Button onClick={openCreate} className="min-h-[44px]">
          <Plus className="h-4 w-4" />
          Add category
        </Button>
      </div>

      <div className="space-y-4">
        <Tabs value={type} onValueChange={(value) => setType(value as TransactionType)}>
          <TabsList className="w-full">
            {TYPE_OPTIONS.map((option) => (
              <TabsTrigger key={option.value} value={option.value} className="flex-1">
                {option.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {type === "expense" && (
          <div className="flex gap-2 overflow-x-auto pb-1">
            {BUCKET_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setBucket(option.value)}
                className={cn(
                  "min-h-[44px] px-3 rounded-full border text-sm flex items-center gap-2 transition",
                  bucket === option.value
                    ? "border-accent text-accent bg-accent/10"
                    : "border-border text-muted-foreground"
                )}
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ backgroundColor: getBucketColor(option.value) }}
                />
                {option.label}
                <span className="text-xs">({counts[option.value]})</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {filteredCategories.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            No categories yet. Add your first one to organize your spending.
          </div>
        ) : (
          filteredCategories.map((category) => (
            <div
              key={category.id}
              className="flex items-center justify-between rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg">
                  {category.icon ?? "•"}
                </div>
                <div>
                  <p className="font-medium text-foreground">{category.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {category.type === "income"
                      ? "Income"
                      : category.allocationBucket ?? "Expense"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="min-h-[44px]"
                  onClick={() => openEdit(category)}
                  aria-label={`Edit ${category.name}`}
                >
                  <Pencil className="h-4 w-4" />
                  Edit
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="min-h-[44px] text-destructive hover:text-destructive"
                  onClick={() => handleDelete(category)}
                  aria-label={`Delete ${category.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </div>
            </div>
          ))
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-6">
          <SheetHeader className="text-left">
            <SheetTitle>
              {editingCategory ? "Edit category" : "New category"}
            </SheetTitle>
            <SheetDescription>
              {editingCategory
                ? "Update the details below."
                : "Add a new way to track income or expenses."}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formState.name}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Groceries"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Emoji</Label>
              <Input
                id="icon"
                value={formState.icon}
                onChange={(event) =>
                  setFormState((prev) => ({ ...prev, icon: event.target.value }))
                }
                placeholder="🥑"
                maxLength={10}
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
                    allocationBucket:
                      value === "income" ? "" : prev.allocationBucket || "needs",
                  }))
                }
              >
                <TabsList className="w-full">
                  {TYPE_OPTIONS.map((option) => (
                    <TabsTrigger key={option.value} value={option.value} className="flex-1">
                      {option.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            </div>

            {formState.type === "expense" && (
              <div className="space-y-2">
                <Label>Allocation bucket</Label>
                <div className="grid grid-cols-3 gap-2">
                  {BUCKET_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() =>
                        setFormState((prev) => ({
                          ...prev,
                          allocationBucket: option.value,
                        }))
                      }
                      className={cn(
                        "min-h-[44px] rounded-lg border text-sm font-medium transition",
                        formState.allocationBucket === option.value
                          ? "border-accent text-accent bg-accent/10"
                          : "border-border text-muted-foreground"
                      )}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}

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
