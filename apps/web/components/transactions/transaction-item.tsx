"use client";

import { format } from "date-fns";
import { ShoppingBag, Zap, Briefcase, Coffee, Home, Car, Heart, Gift, GraduationCap, Wallet, Pencil, Trash2 } from "lucide-react";
import type { Transaction } from "@/app/(app)/transactions/page";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface TransactionItemProps {
  transaction: Transaction;
  onDelete?: () => void;
  onEdit?: () => void;
  showActions?: boolean;
}

// Map categories to icons and colors
const categoryConfig: Record<string, { icon: React.ElementType; color: string; bg: string }> = {
  "needs": { icon: Home, color: "text-[#8b9a7e]", bg: "bg-[#8b9a7e]/10" },
  "wants": { icon: Coffee, color: "text-[#c97a5a]", bg: "bg-[#c97a5a]/10" },
  "savings": { icon: Wallet, color: "text-[#a89562]", bg: "bg-[#a89562]/10" },
  "food": { icon: ShoppingBag, color: "text-[#c97a5a]", bg: "bg-[#c97a5a]/10" },
  "utilities": { icon: Zap, color: "text-[#8b9a7e]", bg: "bg-[#8b9a7e]/10" },
  "income": { icon: Briefcase, color: "text-[#9fb89f]", bg: "bg-[#9fb89f]/10" },
  "transport": { icon: Car, color: "text-[#8b9a7e]", bg: "bg-[#8b9a7e]/10" },
  "health": { icon: Heart, color: "text-[#c97a5a]", bg: "bg-[#c97a5a]/10" },
  "entertainment": { icon: Gift, color: "text-[#c97a5a]", bg: "bg-[#c97a5a]/10" },
  "education": { icon: GraduationCap, color: "text-[#a89562]", bg: "bg-[#a89562]/10" },
};

const defaultExpenseConfig = { icon: ShoppingBag, color: "text-[#c97a5a]", bg: "bg-[#c97a5a]/10" };
const defaultIncomeConfig = { icon: Briefcase, color: "text-[#9fb89f]", bg: "bg-[#9fb89f]/10" };

function getCategoryConfig(categoryName?: string, type?: string): { icon: React.ElementType; color: string; bg: string } {
  if (type === "income") return categoryConfig["income"] ?? defaultIncomeConfig;
  const normalized = categoryName?.toLowerCase() || "";
  for (const [key, config] of Object.entries(categoryConfig)) {
    if (normalized.includes(key) && config) return config;
  }
  return type === "expense" 
    ? defaultExpenseConfig
    : defaultIncomeConfig;
}

export function TransactionItem({
  transaction,
  onDelete,
  onEdit,
  showActions = true,
}: TransactionItemProps) {
  const isExpense = transaction.type === "expense";
  const amount = Number(transaction.amount);
  const categoryName = transaction.category?.name || transaction.categoryId || "";
  
  const config = getCategoryConfig(categoryName, transaction.type);
  const Icon = config.icon;

  const displayName = transaction.description || transaction.category?.name || "Uncategorized";
  const timeDisplay = format(new Date(transaction.date), "h:mm a");
  const dateDisplay = format(new Date(transaction.date), "MMM d");

  return (
    <div className="flex items-center justify-between p-4 rounded-2xl bg-[#1f1815] border border-transparent hover:border-[#2d2420] transition-all group">
      <div className="flex items-center gap-4">
        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", config.bg, config.color)}>
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-medium text-[#f5f2ed]">{displayName}</p>
          <p className="text-xs text-[#a89580]">
            {dateDisplay}, {timeDisplay} • <span className={config.color}>{transaction.category?.name || (isExpense ? "Expense" : "Income")}</span>
          </p>
        </div>
      </div>
      
      <div className="text-right flex items-center gap-3">
        <div>
          <p className={cn("font-bold", isExpense ? "text-[#f5f2ed]" : "text-[#9fb89f]")}>
            {isExpense ? "-" : "+"}
            {new Intl.NumberFormat("en-US", {
              style: "currency",
              currency: "USD",
            }).format(amount)}
          </p>
          <p className="text-[10px] text-[#a89580] uppercase tracking-tighter">
            {isExpense ? "Verified" : "Settled"}
          </p>
        </div>

        {showActions && onEdit && onDelete && (
          <div className="hidden sm:flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
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
              onClick={(e) => {
                e.stopPropagation();
                if (confirm("Are you sure you want to delete this transaction?")) {
                  onDelete();
                }
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
