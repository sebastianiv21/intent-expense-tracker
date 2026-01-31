"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface BudgetCardProps {
  categoryName: string;
  budgetAmount: number;
  spentAmount: number;
  percentage: number;
  onEdit: () => void;
  onDelete: () => void;
}

export function BudgetCard({
  categoryName,
  budgetAmount,
  spentAmount,
  percentage,
  onEdit,
  onDelete,
}: BudgetCardProps) {
  const isOverBudget = spentAmount > budgetAmount;
  const remaining = budgetAmount - spentAmount;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{categoryName}</CardTitle>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={onEdit}
          >
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-destructive"
            onClick={onDelete}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex items-baseline justify-between mb-2">
          <div className="text-2xl font-bold">${spentAmount.toFixed(2)}</div>
          <div className="text-xs text-muted-foreground">
            of ${budgetAmount.toFixed(2)}
          </div>
        </div>

        <Progress
          value={percentage}
          className={cn("h-2", percentage >= 100 ? "bg-red-100" : "bg-muted")}
          // Fix: Progress in shadcn doesn't directly support color props easily without custom CSS or tailwind
          // but we can use indicators if we customize the component or just use classes
        />

        <div className="mt-3 flex items-center justify-between text-xs">
          <span
            className={cn(
              "font-medium",
              isOverBudget ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {isOverBudget
              ? `${Math.abs(remaining).toFixed(2)} over budget`
              : `${remaining.toFixed(2)} remaining`}
          </span>
          <span className="text-muted-foreground">{percentage}%</span>
        </div>
      </CardContent>
    </Card>
  );
}
