"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, MoreHorizontal, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { getBucketColor, getTransactionColor } from "@/lib/finance-utils";
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

function getCategoryAccentColor(category: Category): string {
  return category.type === "income"
    ? getTransactionColor("income")
    : getBucketColor(category.allocationBucket);
}

function getEmojiPreviewColor(formState: CategoryFormState): string {
  const base =
    formState.type === "income"
      ? getTransactionColor("income")
      : getBucketColor((formState.allocationBucket || "needs") as AllocationBucket);
  return base + "26";
}

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
  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<{ id: string; message: string } | null>(null);

  const confirmButtonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
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

  const filteredCategories = useMemo(
    () =>
      categories.filter((c) => {
        if (c.type !== type) return false;
        if (type === "income") return true;
        return c.allocationBucket === bucket;
      }),
    [categories, type, bucket]
  );

  const counts = useMemo(
    () =>
      BUCKET_OPTIONS.reduce<Record<AllocationBucket, number>>(
        (acc, { value }) => {
          acc[value] = categories.filter(
            (c) => c.type === "expense" && c.allocationBucket === value
          ).length;
          return acc;
        },
        { needs: 0, wants: 0, future: 0 }
      ),
    [categories]
  );

  function openCreate() {
    setConfirmingDeleteId(null);
    setEditingCategory(null);
    setFormState({ name: "", icon: "", type: "expense", allocationBucket: "needs" });
    setError("");
    setSheetOpen(true);
  }

  function openEdit(category: Category) {
    setConfirmingDeleteId(null);
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

  function triggerDelete(category: Category) {
    setConfirmingDeleteId(category.id);
    setDeleteError(null);
  }

  async function confirmDelete(category: Category) {
    setConfirmingDeleteId(null);
    setDeletingId(category.id);
    setDeleteError(null);
    const result = await deleteCategory(category.id);
    setDeletingId(null);
    if (!result.success) {
      setDeleteError({ id: category.id, message: result.error });
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
        <Button onClick={openCreate} className="min-h-[44px] w-full sm:w-auto">
          <Plus className="h-4 w-4" />
          Add category
        </Button>
      </div>

      <div className="space-y-4">
        <Tabs value={type} onValueChange={(v) => setType(v as TransactionType)}>
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
            {BUCKET_OPTIONS.map((option) => {
              const isActive = bucket === option.value;
              const color = getBucketColor(option.value);
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setBucket(option.value)}
                  aria-label={`Filter ${option.label} categories`}
                  className={cn(
                    "min-h-[44px] px-3 rounded-full border text-sm flex items-center gap-2 transition",
                    !isActive && "border-border text-muted-foreground opacity-50"
                  )}
                  style={isActive ? { borderColor: color, color, backgroundColor: color + "33" } : undefined}
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
                  {option.label}
                  <span className="text-xs">({counts[option.value]})</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {filteredCategories.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center space-y-4">
            <div className="text-4xl">📂</div>
            <p className="font-semibold text-foreground">No categories here</p>
            <p className="text-sm text-muted-foreground">
              Add your first one to organize your spending.
            </p>
            <Button onClick={openCreate} variant="outline" className="min-h-[44px]">
              <Plus className="h-4 w-4 mr-2" />
              Add category
            </Button>
          </div>
        ) : (
          filteredCategories.map((category) => {
            const accentColor = getCategoryAccentColor(category);
            const isConfirming = confirmingDeleteId === category.id;
            const isDeleting = deletingId === category.id;

            return (
              <div
                key={category.id}
                className="rounded-xl border border-border bg-card p-4"
                style={{ borderLeftWidth: "3px", borderLeftColor: accentColor }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div
                      className="h-10 w-10 rounded-full flex items-center justify-center text-lg shrink-0"
                      style={{ backgroundColor: accentColor + "26" }}
                    >
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
                    {isConfirming ? (
                      <>
                        <span className="text-sm text-muted-foreground">Delete?</span>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="min-h-[44px]"
                          aria-label="Confirm delete"
                          ref={(el) => { confirmButtonRefs.current[category.id] = el; }}
                          onClick={() => confirmDelete(category)}
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
                            aria-label={`Options for ${category.name}`}
                            disabled={isDeleting}
                            ref={(el) => { deleteButtonRefs.current[category.id] = el; }}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEdit(category)}>
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive focus:text-destructive"
                            onClick={() => triggerDelete(category)}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </div>

                {deleteError?.id === category.id && (
                  <p className="text-xs text-destructive mt-2" role="alert">
                    {deleteError.message}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl px-4 pb-6">
          <SheetHeader className="text-left">
            <SheetTitle>{editingCategory ? "Edit category" : "New category"}</SheetTitle>
            <SheetDescription>
              {editingCategory ? "Update the details below." : "Add a new way to track income or expenses."}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={formState.name}
                onChange={(e) => setFormState((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Groceries"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="icon">Emoji</Label>
              <div className="flex justify-center">
                <div
                  className="h-16 w-16 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: getEmojiPreviewColor(formState) }}
                >
                  <span className="text-4xl leading-none">{formState.icon || "•"}</span>
                </div>
              </div>
              <Input
                id="icon"
                value={formState.icon}
                onChange={(e) => setFormState((prev) => ({ ...prev, icon: e.target.value }))}
                placeholder="🥑"
                maxLength={10}
              />
            </div>

            <div className="space-y-2">
              <Label>Type</Label>
              <Tabs
                value={formState.type}
                onValueChange={(v) =>
                  setFormState((prev) => ({
                    ...prev,
                    type: v as TransactionType,
                    allocationBucket: v === "income" ? "" : prev.allocationBucket || "needs",
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
                  {BUCKET_OPTIONS.map((option) => {
                    const isSelected = formState.allocationBucket === option.value;
                    const color = getBucketColor(option.value);
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() =>
                          setFormState((prev) => ({ ...prev, allocationBucket: option.value }))
                        }
                        aria-label={`Select ${option.label} bucket`}
                        className={cn(
                          "min-h-[44px] rounded-lg border text-sm font-medium transition",
                          !isSelected && "border-border text-muted-foreground"
                        )}
                        style={isSelected ? { borderColor: color, color, backgroundColor: color + "33" } : undefined}
                      >
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive" role="alert">{error}</p>
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
