"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { ElementType } from "react";
import {
  Check,
  CheckCircle,
  Coffee,
  Grid3X3,
  Home,
  MoreHorizontal,
  PiggyBank,
  Plus,
  X,
} from "lucide-react";
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
import { PageHeader } from "@/components/page-header";
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

const BUCKET_PILLS: Array<{
  key: AllocationBucket;
  label: string;
  Icon: ElementType;
}> = [
  { key: "needs", label: "Needs", Icon: Home },
  { key: "wants", label: "Wants", Icon: Coffee },
  { key: "future", label: "Future", Icon: PiggyBank },
];

const CATEGORY_EMOJIS = [
  // Default seed icons (always present)
  "🏠",
  "🛒",
  "💡",
  "🛡️",
  "🚗",
  "🏥",
  "🍽️",
  "🎬",
  "🛍️",
  "📺",
  "🎨",
  "💰",
  "📈",
  "🏦",
  "💳",
  "💼",
  "💻",
  "💵",
  // Additional options
  "🏃",
  "☕",
  "🐾",
  "🍕",
  "⛽",
  "🚌",
  "🚲",
  "✈️",
  "💊",
  "👕",
  "🎮",
  "🎁",
  "🎵",
  "📚",
  "🔧",
  "🧾",
  "🎓",
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
      : getBucketColor(
          (formState.allocationBucket || "needs") as AllocationBucket,
        );
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

  const filteredCategories = useMemo(
    () =>
      categories.filter((c) => {
        if (c.type !== type) return false;
        if (type === "income") return true;
        return c.allocationBucket === bucket;
      }),
    [categories, type, bucket],
  );

  const counts = useMemo(
    () =>
      BUCKET_OPTIONS.reduce<Record<AllocationBucket, number>>(
        (acc, { value }) => {
          acc[value] = categories.filter(
            (c) => c.type === "expense" && c.allocationBucket === value,
          ).length;
          return acc;
        },
        { needs: 0, wants: 0, future: 0 },
      ),
    [categories],
  );

  function openCreate() {
    setConfirmingDeleteId(null);
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

    try {
      const result = editingCategory
        ? await updateCategory(editingCategory.id, payload)
        : await createCategory(payload);

      if (!result.success) {
        setError(result.error);
        return;
      }

      setSheetOpen(false);
      router.refresh();
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function triggerDelete(category: Category) {
    setConfirmingDeleteId(category.id);
    setDeleteError(null);
  }

  async function confirmDelete(category: Category) {
    setConfirmingDeleteId(null);
    setDeletingId(category.id);
    setDeleteError(null);
    try {
      const result = await deleteCategory(category.id);
      if (!result.success) {
        setDeleteError({ id: category.id, message: result.error });
        return;
      }
      router.refresh();
    } catch {
      setDeleteError({ id: category.id, message: "Failed to delete category" });
    } finally {
      setDeletingId(null);
    }
  }

  const canSave =
    formState.name.trim().length > 0 &&
    (formState.type === "income" || formState.allocationBucket !== "");

  return (
    <div className="space-y-6">
      <PageHeader
        title="Categories"
        description="Organize income sources and spending buckets."
        action={
          <Button
            variant="outline"
            size="sm"
            onClick={openCreate}
            className="min-h-[44px]"
          >
            Add category
          </Button>
        }
      />

      <div className="space-y-4">
        <Tabs value={type} onValueChange={(v) => setType(v as TransactionType)}>
          <TabsList className="w-full">
            {TYPE_OPTIONS.map((option) => (
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
                    !isActive &&
                      "border-border text-muted-foreground opacity-50",
                  )}
                  style={
                    isActive
                      ? {
                          borderColor: color,
                          color,
                          backgroundColor: color + "33",
                        }
                      : undefined
                  }
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
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
            <Button
              onClick={openCreate}
              variant="outline"
              className="min-h-[44px]"
            >
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
                      <p className="font-medium text-foreground">
                        {category.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {category.type === "income"
                          ? "Income"
                          : (category.allocationBucket ?? "Expense")}
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
                            confirmButtonRefs.current[category.id] = el;
                          }}
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
                            ref={(el) => {
                              deleteButtonRefs.current[category.id] = el;
                            }}
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
        <SheetContent
          side="bottom"
          className="max-h-[90vh] rounded-t-3xl border border-border bg-card p-0 [&>button]:hidden lg:left-1/2 lg:w-[min(100%-2rem,58rem)] lg:-translate-x-1/2 lg:rounded-3xl"
        >
          <div className="flex max-h-[90vh] flex-col">
            <SheetHeader className="px-6 pt-6 pb-4 border-b border-border">
              <div className="flex items-center justify-between">
                <SheetTitle className="text-2xl font-bold">
                  {editingCategory ? "Edit Category" : "New Category"}
                </SheetTitle>
                <SheetDescription className="sr-only">
                  {editingCategory
                    ? "Update the details below."
                    : "Add a new way to track income or expenses."}
                </SheetDescription>
                <button
                  onClick={() => setSheetOpen(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-full bg-border text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Preview
                </Label>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-background border border-border">
                  <div
                    className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl text-3xl"
                    style={{ backgroundColor: getEmojiPreviewColor(formState) }}
                  >
                    {formState.icon || "💡"}
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">
                      {formState.name.trim() || "Category Name"}
                    </div>
                    {formState.type === "expense" &&
                    formState.allocationBucket ? (
                      <div
                        className="text-xs font-medium capitalize"
                        style={{
                          color: getBucketColor(
                            formState.allocationBucket as AllocationBucket,
                          ),
                        }}
                      >
                        {formState.allocationBucket}
                      </div>
                    ) : (
                      <div
                        className="text-xs font-medium"
                        style={{ color: getTransactionColor("income") }}
                      >
                        Income
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Name
                </Label>
                <Input
                  value={formState.name}
                  onChange={(e) =>
                    setFormState((prev) => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="e.g., Groceries, Salary, Rent..."
                  className="h-14 rounded-2xl bg-background border-border"
                />
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Grid3X3 className="h-4 w-4 text-muted-foreground" />
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Choose an Icon
                  </Label>
                </div>
                <div className="max-h-[180px] overflow-y-auto rounded-xl border border-border bg-background p-2">
                  <div className="grid grid-cols-5 place-items-center gap-1">
                    {CATEGORY_EMOJIS.map((emoji) => {
                      const isSelected = formState.icon === emoji;
                      return (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() =>
                            setFormState((prev) => ({
                              ...prev,
                              icon: isSelected ? "" : emoji,
                            }))
                          }
                          className={cn(
                            "flex h-10 w-10 items-center justify-center rounded-lg text-xl transition-all hover:scale-105 active:scale-95",
                            isSelected
                              ? "ring-2 ring-primary bg-primary/10"
                              : "hover:bg-border",
                          )}
                          title={emoji}
                        >
                          {emoji}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                  Type
                </Label>
                <Tabs
                  value={formState.type}
                  onValueChange={(v) =>
                    setFormState((prev) => ({
                      ...prev,
                      type: v as TransactionType,
                      allocationBucket:
                        v === "income" ? "" : prev.allocationBucket || "needs",
                    }))
                  }
                >
                  <TabsList className="w-full">
                    {TYPE_OPTIONS.map((option) => (
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

              {formState.type === "expense" && (
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
                    Allocation Bucket
                  </Label>
                  <div className="grid grid-cols-3 gap-3">
                    {BUCKET_PILLS.map(({ key, label, Icon }) => {
                      const isSelected = formState.allocationBucket === key;
                      const color = getBucketColor(key);
                      return (
                        <button
                          key={key}
                          type="button"
                          onClick={() =>
                            setFormState((prev) => ({
                              ...prev,
                              allocationBucket: key,
                            }))
                          }
                          aria-label={`Select ${label} bucket`}
                          aria-pressed={isSelected}
                          className={cn(
                            "flex flex-col items-center gap-2 rounded-3xl border-2 bg-background p-4 transition-all hover:scale-[1.02]",
                            !isSelected &&
                              "border-transparent text-muted-foreground",
                          )}
                          style={
                            isSelected
                              ? {
                                  borderColor: color,
                                  color,
                                  backgroundColor: color + "1a",
                                }
                              : undefined
                          }
                        >
                          <Icon className="h-6 w-6" />
                          <span className="text-[10px] font-bold uppercase tracking-tighter">
                            {label}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

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
                className="w-full rounded-3xl py-6 text-lg font-bold text-white shadow-xl flex items-center justify-center gap-2 hover:opacity-95 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(to right, #c97a5a, #a36248)",
                }}
              >
                {loading ? "Saving…" : editingCategory ? "Update" : "Create"}
                <CheckCircle className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
