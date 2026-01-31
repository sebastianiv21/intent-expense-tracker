"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { 
  ArrowDownCircle, 
  ArrowUpCircle, 
  Plus, 
  ArrowRight,
  Loader2,
  Wallet,
  TrendingUp,
  History
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { api, ApiError } from "@/lib/api-client";
import type { Transaction } from "@/app/(app)/transactions/page";
import type { AllocationSummary } from "@/app/(app)/insights/page";
import { TransactionItem } from "@/components/transactions/transaction-item";

export default function DashboardPage() {
  const [allocation, setAllocation] = useState<AllocationSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const currentMonth = format(new Date(), "yyyy-MM");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [allocData, txnData] = await Promise.all([
          api.get<AllocationSummary>(`/insights/allocation-summary?month=${currentMonth}`),
          api.get<Transaction[]>("/transactions?limit=5"),
        ]);
        setAllocation(allocData);
        setRecentTransactions(txnData.slice(0, 5));
      } catch (err: unknown) {
        const message = err instanceof ApiError ? err.message : "Failed to load dashboard";
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, [currentMonth]);

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalSpent = (allocation?.actual.needs || 0) + (allocation?.actual.wants || 0) + (allocation?.actual.future || 0);
  const income = allocation?.income || 0;
  const balance = income - totalSpent;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground text-sm">
            Welcome back! Here&apos;s your financial summary for {format(new Date(), "MMMM")}.
          </p>
        </div>
        <Link href="/transactions">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </Link>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-primary text-primary-foreground">
          <CardHeader className="pb-2">
            <CardDescription className="text-primary-foreground/70">Current Balance</CardDescription>
            <CardTitle className="text-2xl font-bold">${balance.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs flex items-center gap-1 opacity-80">
              <Wallet className="h-3 w-3" />
              Keep it up!
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Income</CardDescription>
            <CardTitle className="text-2xl font-bold text-green-600">${income.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowUpCircle className="h-3 w-3" />
              Received this month
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Expenses</CardDescription>
            <CardTitle className="text-2xl font-bold text-red-600">${totalSpent.toFixed(2)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-xs text-muted-foreground flex items-center gap-1">
              <ArrowDownCircle className="h-3 w-3" />
              Spent this month
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
        <Card className="lg:col-span-4">
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="space-y-1">
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>Your last activities</CardDescription>
            </div>
            <Link href="/transactions">
              <Button variant="ghost" size="sm" className="gap-1">
                View all <ArrowRight className="h-3 w-3" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            {recentTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <History className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground italic">No transactions found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentTransactions.map((txn) => (
                  <TransactionItem 
                    key={txn.id} 
                    transaction={txn} 
                    onDelete={() => {}} // Disabled on dashboard
                    onEdit={() => {}} // Disabled on dashboard
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="lg:col-span-3">
          <CardHeader>
            <CardTitle>Allocation Status</CardTitle>
            <CardDescription>50/30/20 target check</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-blue-500" />
                  Needs
                </span>
                <span className="font-medium">{allocation?.actual.needs.toFixed(0)} / {allocation?.targets.needs.toFixed(0)}</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500" 
                  style={{ width: `${Math.min(100, (allocation?.actual.needs || 0) / (allocation?.targets.needs || 1) * 100)}%` }} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-orange-500" />
                  Wants
                </span>
                <span className="font-medium">{allocation?.actual.wants.toFixed(0)} / {allocation?.targets.wants.toFixed(0)}</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-500" 
                  style={{ width: `${Math.min(100, (allocation?.actual.wants || 0) / (allocation?.targets.wants || 1) * 100)}%` }} 
                />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-green-500" />
                  Future
                </span>
                <span className="font-medium">{allocation?.actual.future.toFixed(0)} / {allocation?.targets.future.toFixed(0)}</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-green-500" 
                  style={{ width: `${Math.min(100, (allocation?.actual.future || 0) / (allocation?.targets.future || 1) * 100)}%` }} 
                />
              </div>
            </div>

            <Link href="/insights" className="block pt-4">
              <Button variant="outline" className="w-full gap-2">
                <TrendingUp className="h-4 w-4" />
                Detailed Insights
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
