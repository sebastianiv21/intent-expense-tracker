"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, ArrowUpCircle, ArrowDownCircle } from "lucide-react";
import { toast } from "sonner";
import { type CreateCategory, type AllocationBucket } from "@repo/shared";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api, ApiError } from "@/lib/api-client";
import { CategoryForm } from "@/components/categories/category-form";
import { CategoryItem } from "@/components/categories/category-item";
import { ResponsiveModal, ResponsiveModalClose } from "@/components/ui/responsive-modal";

export interface Category {
  id: string;
  name: string;
  type: "expense" | "income";
  allocationBucket: AllocationBucket | null;
  icon?: string;
  createdAt: string;
  updatedAt: string;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const fetchCategories = async () => {
    try {
      const data = await api.get<Category[]>("/categories");
      setCategories(data);
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : "Failed to fetch categories";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

  const expenseCategories = categories.filter((c) => c.type === "expense");
  const incomeCategories = categories.filter((c) => c.type === "income");

  const groupedExpenses = {
    needs: expenseCategories.filter((c) => c.allocationBucket === "needs"),
    wants: expenseCategories.filter((c) => c.allocationBucket === "wants"),
    future: expenseCategories.filter((c) => c.allocationBucket === "future"),
    none: expenseCategories.filter((c) => c.allocationBucket === null),
  };

  const handleCreateCategory = async (values: CreateCategory) => {
    setIsSubmitting(true);
    try {
      await api.post("/categories", values);
      toast.success("Category created successfully");
      setIsDialogOpen(false);
      fetchCategories();
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : "Failed to create category";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateCategory = async (id: string, values: CreateCategory) => {
    try {
      await api.patch(`/categories/${id}`, values);
      toast.success("Category updated successfully");
      fetchCategories();
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : "Failed to update category";
      toast.error(message);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    try {
      await api.delete(`/categories/${id}`);
      toast.success("Category deleted");
      fetchCategories();
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : "Failed to delete category";
      toast.error(message);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Categories</h1>
          <p className="text-muted-foreground">
            Manage your spending and income categories.
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Category
        </Button>
        <ResponsiveModal
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          title="Create Category"
          description="Add a new category to track your finances."
          footer={
            <>
              <ResponsiveModalClose>
                <Button variant="outline" className="w-full sm:w-auto">
                  Cancel
                </Button>
              </ResponsiveModalClose>
              <Button
                type="submit"
                form="create-category-form"
                className="w-full sm:w-auto"
                disabled={isSubmitting}
              >
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Category
              </Button>
            </>
          }
        >
          <CategoryForm
            id="create-category-form"
            showFooter={false}
            onSubmit={handleCreateCategory}
            onCancel={() => setIsDialogOpen(false)}
          />
        </ResponsiveModal>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ArrowUpCircle className="h-5 w-5 text-green-500" />
              Income
            </CardTitle>
            <CardDescription>Money coming in</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {incomeCategories.length === 0 ? (
              <p className="text-sm text-muted-foreground italic">No income categories yet.</p>
            ) : (
              incomeCategories.map((category) => (
                <CategoryItem
                  key={category.id}
                  category={category}
                  onDelete={() => handleDeleteCategory(category.id)}
                  onUpdate={(values) => handleUpdateCategory(category.id, values)}
                />
              ))
            )}
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ArrowDownCircle className="h-5 w-5 text-blue-500" />
                Expenses
              </CardTitle>
              <CardDescription>Money going out</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {(Object.keys(groupedExpenses) as Array<keyof typeof groupedExpenses>).map((bucket) => {
                const groupCategories = groupedExpenses[bucket];
                if (groupCategories.length === 0 && bucket === "none") return null;

                return (
                  <div key={bucket} className="space-y-3">
                    <h3 className="text-sm font-semibold capitalize text-muted-foreground border-b pb-1">
                      {bucket === "none" ? "Uncategorized" : bucket}
                    </h3>
                    <div className="space-y-2">
                      {groupCategories.length === 0 ? (
                        <p className="text-xs text-muted-foreground italic">No categories.</p>
                      ) : (
                        groupCategories.map((category) => (
                          <CategoryItem
                            key={category.id}
                            category={category}
                            onDelete={() => handleDeleteCategory(category.id)}
                            onUpdate={(values) => handleUpdateCategory(category.id, values)}
                          />
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
