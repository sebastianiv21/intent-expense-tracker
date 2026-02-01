"use client";

import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface AllocationCardProps {
  title: string;
  subtitle: string;
  spent: number;
  budget: number;
  category: "needs" | "wants" | "savings";
  icon: LucideIcon;
  percentage: number;
}

const categoryStyles = {
  needs: {
    color: "#8b9a7e",
    bg: "bg-[#8b9a7e]/20",
    text: "text-[#8b9a7e]",
    border: "hover:border-[#8b9a7e]/20",
    label: "Needs (50%)",
  },
  wants: {
    color: "#c97a5a",
    bg: "bg-[#c97a5a]/20",
    text: "text-[#c97a5a]",
    border: "hover:border-[#c97a5a]/20",
    label: "Wants (30%)",
  },
  savings: {
    color: "#a89562",
    bg: "bg-[#a89562]/20",
    text: "text-[#a89562]",
    border: "hover:border-[#a89562]/20",
    label: "Save (20%)",
  },
};

export function AllocationCard({
  subtitle,
  spent,
  budget,
  category,
  icon: Icon,
  percentage,
}: AllocationCardProps) {
  const styles = categoryStyles[category];
  const isOverBudget = spent > budget;
  const displayPercentage = Math.min(100, Math.max(0, percentage));

  return (
    <div
      className={cn(
        "bg-[#1f1815] border border-[#2d2420] p-6 rounded-[24px] transition-all group",
        styles.border,
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div
          className={cn(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            styles.bg,
            styles.text,
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
        <span
          className={cn(
            "text-xs font-bold px-2 py-1 rounded-full uppercase",
            styles.bg,
            styles.text,
          )}
        >
          {styles.label}
        </span>
      </div>

      <h3 className="text-[#a89580] text-sm">{subtitle}</h3>
      <div className="flex items-baseline gap-2 my-2">
        <span className="text-xl font-bold text-[#f5f2ed]">
          ${spent.toLocaleString()}
        </span>
        <span className="text-xs text-[#a89580]">
          / ${budget.toLocaleString()}
        </span>
      </div>

      <div className="w-full h-1.5 bg-[#16110a] rounded-full mt-3 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all duration-500", {
            "bg-[#8b9a7e]": category === "needs",
            "bg-[#c97a5a]": category === "wants",
            "bg-[#a89562]": category === "savings",
          })}
          style={{ width: `${displayPercentage}%` }}
        />
      </div>

      {isOverBudget && (
        <p className="text-xs text-[#c45c4a] mt-2">
          Over budget by ${(spent - budget).toFixed(2)}
        </p>
      )}
    </div>
  );
}
