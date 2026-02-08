"use client";

import Link from "next/link";
import { Calendar, Loader2, Repeat } from "lucide-react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { api } from "@/lib/api-client";
import {
  RecurringItem,
  type RecurringTransaction,
} from "@/components/recurring/recurring-item";

interface PlannedOutflowProps {
  limit?: number;
  showManageButton?: boolean;
}

export function PlannedOutflowCard({
  limit = 3,
  showManageButton = true,
}: PlannedOutflowProps) {
  const [recurrences, setRecurrences] = useState<RecurringTransaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRecurrences = async () => {
    try {
      const data = await api.get<RecurringTransaction[]>(
        "/recurring-transactions",
      );
      // Filter only active and upcoming, then sort by nextDueDate
      const active = data
        .filter((r) => r.isActive && new Date(r.nextDueDate) >= new Date())
        .sort(
          (a, b) =>
            new Date(a.nextDueDate).getTime() -
            new Date(b.nextDueDate).getTime(),
        )
        .slice(0, limit);
      setRecurrences(active);
    } catch (err: unknown) {
      // Silently fail - don't break dashboard if recurring transactions aren't available
      console.error("Failed to load planned outflows:", err);
      setRecurrences([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecurrences();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isLoading) {
    return (
      <div className="bg-[#1f1815] p-6 rounded-4xl border border-[#2d2420]">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-bold text-[#f5f2ed]">Planned Outflow</h3>
          <Calendar className="h-5 w-5 text-[#a89580]" />
        </div>
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-[#c97a5a]" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#1f1815] p-6 rounded-4xl border border-[#2d2420]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="font-bold text-[#f5f2ed]">Planned Outflow</h3>
        <Calendar className="h-5 w-5 text-[#a89580]" />
      </div>

      {recurrences.length === 0 ? (
        <div className="text-center py-6">
          <div className="w-12 h-12 rounded-full bg-[#16110a] flex items-center justify-center mx-auto mb-3 border border-[#2d2420]">
            <Repeat className="h-5 w-5 text-[#a89580]" />
          </div>
          <p className="text-sm text-[#a89580] mb-1">No planned outflows</p>
          <p className="text-xs text-[#4a3f35]">
            Set up recurring transactions to see them here
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {recurrences.map((item) => (
            <RecurringItem
              key={item.id}
              recurring={item}
              onEdit={() => {}}
              onDelete={() => {}}
              onToggleActive={() => {}}
              compact
            />
          ))}
        </div>
      )}

      {showManageButton && (
        <Link href="/recurring">
          <Button
            variant="outline"
            className="w-full mt-6 py-3 rounded-xl border-[#2d2420] text-sm font-medium text-[#a89580] hover:text-[#f5f2ed] hover:bg-[#16110a] transition-all bg-transparent"
          >
            Manage Recurring
          </Button>
        </Link>
      )}
    </div>
  );
}
