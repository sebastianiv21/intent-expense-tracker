"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, Calendar } from "lucide-react";
import { toast } from "sonner";
import { type CreateBudget } from "@repo/shared";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api, ApiError } from "@/lib/api-client";
import { BudgetForm } from "@/components/budgets/budget-form";
import { BudgetCard } from "@/components/budgets/budget-card";
import { type Category } from "@/app/(app)/categories/page";

interface BudgetStatus {
  budgetId: string;
  categoryId: string;
  categoryName: string;
  categoryIcon: string | null;
  budgetAmount: number;
  spentAmount: number;
  remainingAmount: number;
  percentage: number;
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<BudgetStatus[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState<BudgetStatus | null>(null);

  const currentMonth = format(new Date(), "yyyy-MM");

  const fetchBudgets = async () => {
    try {
      const [status, cats] = await Promise.all([
        api.get<BudgetStatus[]>(`/insights/budget-status?month=${currentMonth}`),
        api.get<Category[]>("/categories"),
      ]);
      setBudgets(status);
      setCategories(cats);
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : "Failed to fetch budgets";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleCreateBudget = async (values: CreateBudget) => {
    try {
      await api.post("/budgets", values);
      toast.success("Budget set successfully");
      setIsDialogOpen(false);
      fetchBudgets();
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : "Failed to create budget";
      toast.error(message);
    }
  };

  const handleUpdateBudget = async (values: CreateBudget) => {
    if (!editingBudget) return;
    try {
      await api.patch(`/budgets/${editingBudget.budgetId}`, values);
      toast.success("Budget updated");
      setIsDialogOpen(false);
      setEditingBudget(null);
      fetchBudgets();
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : "Failed to update budget";
      toast.error(message);
    }
  };

  const handleDeleteBudget = async (id: string) => {
    if (!confirm("Are you sure you want to delete this budget?")) return;
    try {
      await api.delete(`/budgets/${id}`);
      toast.success("Budget removed");
      fetchBudgets();
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : "Failed to delete budget";
      toast.error(message);
    }
  };

  const openEditDialog = (budget: BudgetStatus) => {
    setEditingBudget(budget);
    setIsDialogOpen(true);
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
          <h1 className="text-3xl font-bold tracking-tight">Budgets</h1>
          <p className="text-muted-foreground">
            Set limits for your spending categories.
          </p>
        </div>
        <Button onClick={() => {
          setEditingBudget(null);
          setIsDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Set Budget
        </Button>
      </div>

      <Card className="bg-muted/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2 text-primary font-semibold">
            <Calendar className="h-4 w-4" />
            {format(new Date(), "MMMM yyyy")}
          </div>
        </CardHeader>
        <CardContent>
          {budgets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-muted-foreground mb-4">No budgets set for this month.</p>
              <Button variant="outline" onClick={() => setIsDialogOpen(true)}>
                Get Started
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {budgets.map((budget) => (
                <BudgetCard
                  key={budget.budgetId}
                  categoryName={budget.categoryName}
                  budgetAmount={budget.budgetAmount}
                  spentAmount={budget.spentAmount}
                  percentage={budget.percentage}
                  onEdit={() => openEditDialog(budget)}
                  onDelete={() => handleDeleteBudget(budget.budgetId)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={(open) => {
        setIsDialogOpen(open);
        if (!open) setEditingBudget(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingBudget ? "Edit Budget" : "Set Budget"}
            </DialogTitle>
            <DialogDescription>
              {editingBudget 
                ? "Update your budget amount for this category." 
                : "Choose a category and set a spending limit."}
            </DialogDescription>
          </DialogHeader>
          <BudgetForm
            categories={categories}
            initialValues={editingBudget ? {
              categoryId: editingBudget.categoryId,
              amount: editingBudget.budgetAmount,
            } : undefined}
            onSubmit={editingBudget ? handleUpdateBudget : handleCreateBudget}
            onCancel={() => setIsDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
