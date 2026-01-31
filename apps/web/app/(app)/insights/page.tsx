"use client";

import { useEffect, useState } from "react";
import { Loader2, TrendingUp, TrendingDown, Info } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api, ApiError } from "@/lib/api-client";
import { Progress } from "@/components/ui/progress";

export interface AllocationSummary {
  income: number;
  targets: { needs: number; wants: number; future: number };
  actual: { needs: number; wants: number; future: number };
  percentages: { needs: number; wants: number; future: number };
  profile: {
    monthlyIncomeTarget: number;
    needsPercentage: number;
    wantsPercentage: number;
    futurePercentage: number;
  };
}

export interface SpendingResult {
  categoryId: string | null;
  categoryName: string;
  categoryType: "expense" | "income";
  allocationBucket: "needs" | "wants" | "future" | null;
  icon: string | null;
  total: string | null;
}

const COLORS = ["#3b82f6", "#f97316", "#22c55e", "#a855f7", "#ec4899", "#eab308"];

export default function InsightsPage() {
  const [allocation, setAllocation] = useState<AllocationSummary | null>(null);
  const [spending, setSpending] = useState<SpendingResult[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentMonth = format(new Date(), "yyyy-MM");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [allocData, spendingData] = await Promise.all([
          api.get<AllocationSummary>(`/insights/allocation-summary?month=${currentMonth}`),
          api.get<SpendingResult[]>(`/insights/spending?type=expense`),
        ]);
        setAllocation(allocData);
        setSpending(spendingData);
      } catch (err: unknown) {
        const message = err instanceof ApiError ? err.message : "Failed to fetch insights";
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [currentMonth]);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!allocation) return null;

  const chartData = spending.map((s) => ({
    name: s.categoryName,
    value: parseFloat(s.total || "0"),
  })).filter(d => d.value > 0);

  const allocationData = [
    { name: "Needs", value: allocation.actual.needs, color: "#3b82f6" },
    { name: "Wants", value: allocation.actual.wants, color: "#f97316" },
    { name: "Future", value: allocation.actual.future, color: "#22c55e" },
  ];

  return (
    <div className="space-y-6 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Insights</h1>
        <p className="text-muted-foreground">
          Analyze your spending patterns and 50/30/20 compliance.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Target Income</CardDescription>
            <CardTitle className="text-2xl">${allocation.profile.monthlyIncomeTarget.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" />
              Actual income this month: ${allocation.income.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        
        <Card className="md:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">50/30/20 Breakdown</CardTitle>
            <CardDescription>How you're splitting your target income</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-3">
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Needs ({allocation.profile.needsPercentage}%)</span>
                <span className="font-semibold">${allocation.actual.needs.toFixed(0)}</span>
              </div>
              <Progress value={(allocation.actual.needs / allocation.targets.needs) * 100} className="h-2 bg-blue-100" />
              <p className="text-[10px] text-muted-foreground mt-1">Target: ${allocation.targets.needs.toFixed(0)}</p>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Wants ({allocation.profile.wantsPercentage}%)</span>
                <span className="font-semibold">${allocation.actual.wants.toFixed(0)}</span>
              </div>
              <Progress value={(allocation.actual.wants / allocation.targets.wants) * 100} className="h-2 bg-orange-100" />
              <p className="text-[10px] text-muted-foreground mt-1">Target: ${allocation.targets.wants.toFixed(0)}</p>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-1">
                <span>Future ({allocation.profile.futurePercentage}%)</span>
                <span className="font-semibold">${allocation.actual.future.toFixed(0)}</span>
              </div>
              <Progress value={(allocation.actual.future / allocation.targets.future) * 100} className="h-2 bg-green-100" />
              <p className="text-[10px] text-muted-foreground mt-1">Target: ${allocation.targets.future.toFixed(0)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Spending by Category</CardTitle>
            <CardDescription>Total expenses grouped by category</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px]">
            {chartData.length === 0 ? (
              <div className="flex h-full items-center justify-center text-muted-foreground italic">
                No spending data for this period.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={chartData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: any) => `$${Number(value).toFixed(2)}`}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card className="flex flex-col">
          <CardHeader>
            <CardTitle>Allocation Performance</CardTitle>
            <CardDescription>Actual spending vs target allocation</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 min-h-[300px]">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={allocationData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value: any) => `$${Number(value).toFixed(2)}`} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {allocationData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
