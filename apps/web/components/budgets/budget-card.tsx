"use client";

import { Pencil, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div className="bg-[#1f1815] border border-[#2d2420] p-6 rounded-[24px] transition-all hover:border-[#c97a5a]/20 group">
      <div className="flex justify-between items-start mb-4">
        <h3 className="font-semibold text-[#f5f2ed] text-lg">{categoryName}</h3>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#a89580] hover:text-[#c97a5a]"
            onClick={onEdit}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-[#a89580] hover:text-[#c45c4a]"
            onClick={onDelete}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-baseline">
          <span className="text-[#a89580] text-sm">Budget</span>
          <span className="text-xl font-bold text-[#f5f2ed]">
            ${budgetAmount.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between items-baseline">
          <span className="text-[#a89580] text-sm">Spent</span>
          <span className={cn("font-semibold", isOverBudget ? "text-[#c45c4a]" : "text-[#f5f2ed]")}>
            ${spentAmount.toLocaleString()}
          </span>
        </div>

        <div className="w-full h-2 bg-[#16110a] rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-500",
              isOverBudget ? "bg-[#c45c4a]" : "bg-[#c97a5a]"
            )}
            style={{ width: `${Math.min(100, percentage)}%` }}
          />
        </div>

        <div className="flex justify-between text-xs">
          <span className="text-[#a89580]">{percentage.toFixed(0)}% used</span>
          <span className={cn(isOverBudget ? "text-[#c45c4a]" : "text-[#8b9a7e]")}>
            {isOverBudget
              ? `$${Math.abs(remaining).toFixed(0)} over`
              : `$${remaining.toFixed(0)} left`}
          </span>
        </div>
      </div>
    </div>
  );
}
