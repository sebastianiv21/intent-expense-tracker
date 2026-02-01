"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Settings2,
  TrendingUp,
  Loader2,
  Home,
  Coffee,
  PiggyBank,
  Calendar,
  Plus,
  History,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { type CreateTransaction } from "@repo/shared";

import { Button } from "@/components/ui/button";
import { api, ApiError } from "@/lib/api-client";
import type { Transaction } from "@/app/(app)/transactions/page";
import type { AllocationSummary } from "@/app/(app)/insights/page";
import { TransactionItem } from "@/components/transactions/transaction-item";
import {
  ResponsiveModal,
  ResponsiveModalClose,
} from "@/components/ui/responsive-modal";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { type Category } from "@/app/(app)/categories/page";
import { AllocationCard } from "@/components/dashboard/allocation-card";
import { MindfulSavingsWidget } from "@/components/dashboard/mindful-savings-widget";
import { authClient } from "@/lib/auth-client";

// Mock data for planned outflows - in a real app, this would come from the API
const plannedOutflows = [
  { date: "MAR 12", name: "Cloud Subscription", amount: 14.99, category: "Needs" },
  { date: "MAR 15", name: "Rent Payment", amount: 1200, category: "Needs" },
];

export default function DashboardPage() {
  const [allocation, setAllocation] = useState<AllocationSummary | null>(null);
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const { data: session } = authClient.useSession();
  const userName = session?.user?.name || session?.user?.email?.split("@")[0] || "Friend";

  const currentMonth = format(new Date(), "yyyy-MM");
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const fetchData = async () => {
    try {
      const [allocData, txnData, catData] = await Promise.all([
        api.get<AllocationSummary>(`/insights/allocation-summary?month=${currentMonth}`),
        api.get<Transaction[]>("/transactions?limit=5"),
        api.get<Category[]>("/categories"),
      ]);
      setAllocation(allocData);
      setRecentTransactions(txnData.slice(0, 5));
      setCategories(catData);
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : "Failed to load dashboard";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentMonth]);

  const handleCreateTransaction = async (values: CreateTransaction) => {
    setIsSubmitting(true);
    try {
      await api.post("/transactions", values);
      toast.success("Transaction recorded");
      setIsModalOpen(false);
      fetchData();
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : "Failed to create transaction";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#c97a5a]" />
      </div>
    );
  }

  const totalSpent = (allocation?.actual.needs || 0) + (allocation?.actual.wants || 0) + (allocation?.actual.future || 0);
  const income = allocation?.income || 0;
  const balance = income - totalSpent;
  
  // Calculate monthly goal (assuming 50/30/20 rule)
  const monthlyGoal = income * 0.2; // 20% savings goal
  const savingsProgress = allocation?.actual.future || 0;
  const savingsPercentage = monthlyGoal > 0 ? Math.min(100, (savingsProgress / monthlyGoal) * 100) : 0;

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="flex justify-between items-center mb-10">
        <div className="flex flex-col">
          <h1 className="text-2xl md:text-3xl font-bold text-[#f5f2ed]">
            {greeting}, {userName}.
          </h1>
          <p className="text-[#a89580] text-sm md:text-base">
            You&apos;ve saved {savingsPercentage.toFixed(0)}% more than last month. Keep breathing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setIsModalOpen(true)}
            className="hidden sm:flex warm-gradient text-white border-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
          <button className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[#1f1815] border border-[#2d2420] hover:bg-[#2d2420] transition-colors">
            <Settings2 className="h-5 w-5 text-[#a89580]" />
          </button>
        </div>
      </header>

      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Primary Stats */}
        <div className="lg:col-span-2 space-y-8">
          {/* Summary Card */}
          <section className="relative p-8 rounded-[32px] overflow-hidden warm-gradient shadow-2xl custom-shadow">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-20 -mt-20 blur-3xl" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <span className="text-white/80 text-sm font-medium uppercase tracking-wider">
                  Mindful Balance
                </span>
                <div className="text-5xl font-extrabold text-white mt-1">
                  ${balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <p className="text-white/70 text-sm mt-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-white" />
                  +${(income * 0.08).toFixed(2)} since yesterday
                </p>
              </div>
              <div className="bg-black/20 backdrop-blur-md rounded-2xl p-4 md:w-48">
                <p className="text-white/60 text-xs mb-2 uppercase tracking-wider">Monthly Goal</p>
                <div className="w-full h-2 bg-white/20 rounded-full overflow-hidden">
                  <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${savingsPercentage}%` }} />
                </div>
                <p className="text-white text-xs mt-2">{savingsPercentage.toFixed(0)}% achieved (+${savingsProgress.toFixed(0)})</p>
              </div>
            </div>
          </section>

          {/* Budget Breakdown (50/30/20) */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#f5f2ed]">Spending Harmony</h2>
              <Link href="/budgets" className="text-sm text-[#a89562] font-semibold hover:underline cursor-pointer">
                Refine Rule
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <AllocationCard
                title="Needs"
                subtitle="Essential Living"
                spent={allocation?.actual.needs ?? 0}
                budget={allocation?.targets.needs ?? income * 0.5}
                category="needs"
                icon={Home}
                percentage={allocation?.targets.needs ? ((allocation.actual.needs / allocation.targets.needs) * 100) : 0}
              />
              <AllocationCard
                title="Wants"
                subtitle="Life&apos;s Joy"
                spent={allocation?.actual.wants ?? 0}
                budget={allocation?.targets.wants ?? income * 0.3}
                category="wants"
                icon={Coffee}
                percentage={allocation?.targets.wants ? ((allocation.actual.wants / allocation.targets.wants) * 100) : 0}
              />
              <AllocationCard
                title="Savings"
                subtitle="Future Freedom"
                spent={allocation?.actual.future ?? 0}
                budget={allocation?.targets.future ?? income * 0.2}
                category="savings"
                icon={PiggyBank}
                percentage={allocation?.targets.future ? ((allocation.actual.future / allocation.targets.future) * 100) : 0}
              />
            </div>
          </section>

          {/* Transactions Section */}
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-[#f5f2ed]">Recent Awareness</h2>
              <Link href="/transactions">
                <Button variant="ghost" className="text-sm text-[#a89580] hover:text-[#f5f2ed]">
                  View History
                </Button>
              </Link>
            </div>
            <div className="space-y-3">
              {recentTransactions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-center bg-[#1f1815] rounded-2xl border border-[#2d2420]">
                  <History className="h-8 w-8 text-[#a89580] mb-2" />
                  <p className="text-sm text-[#a89580] italic">No transactions found. Start your mindful journey.</p>
                </div>
              ) : (
                recentTransactions.map((txn) => (
                  <TransactionItem
                    key={txn.id}
                    transaction={txn}
                    showActions={false}
                  />
                ))
              )}
            </div>
          </section>
        </div>

        {/* Right Column: Context & Widgets */}
        <aside className="space-y-8">
          {/* Calendar/Schedule Mini */}
          <div className="bg-[#1f1815] p-6 rounded-[32px] border border-[#2d2420]">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-[#f5f2ed]">Planned Outflow</h3>
              <Calendar className="h-5 w-5 text-[#a89580]" />
            </div>
            <div className="space-y-4">
              {plannedOutflows.map((item, idx) => (
                <div key={idx} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#16110a] flex flex-col items-center justify-center text-xs border border-[#2d2420]">
                    <span className="text-[#a89580] text-[10px]">{item.date.split(" ")[0]}</span>
                    <span className="font-bold text-[#f5f2ed]">{item.date.split(" ")[1]}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-[#f5f2ed] truncate">{item.name}</p>
                    <p className="text-xs text-[#a89580]">${item.amount} • {item.category}</p>
                  </div>
                </div>
              ))}
            </div>
            <Link href="/budgets">
              <Button
                variant="outline"
                className="w-full mt-6 py-3 rounded-xl border-[#2d2420] text-sm font-medium text-[#a89580] hover:text-[#f5f2ed] hover:bg-[#16110a] transition-all bg-transparent"
              >
                Manage Recurring
              </Button>
            </Link>
          </div>

          {/* Mindful Savings Widget */}
          <MindfulSavingsWidget />

          {/* Quick Stats Cards */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-[#1f1815] p-4 rounded-2xl border border-[#2d2420]">
              <p className="text-[#a89580] text-[10px] uppercase font-bold tracking-widest">Daily Avg</p>
              <p className="text-xl font-bold mt-1 text-[#f5f2ed]">${(totalSpent / 30).toFixed(0)}</p>
            </div>
            <div className="bg-[#1f1815] p-4 rounded-2xl border border-[#2d2420]">
              <p className="text-[#a89580] text-[10px] uppercase font-bold tracking-widest">Safe Spend</p>
              <p className="text-xl font-bold mt-1 text-[#9fb89f]">${(income * 0.3 / 30).toFixed(0)}</p>
            </div>
          </div>
        </aside>
      </div>

      {/* Add Transaction Modal */}
      <ResponsiveModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title="New Awareness"
        description="Log your intentional spend."
        footer={
          <>
            <ResponsiveModalClose>
              <Button variant="outline" className="w-full sm:w-auto border-[#2d2420] bg-transparent text-[#a89580] hover:bg-[#1f1815] hover:text-[#f5f2ed]">
                Cancel
              </Button>
            </ResponsiveModalClose>
            <Button
              type="submit"
              form="dashboard-transaction-form"
              className="w-full sm:w-auto warm-gradient text-white"
              disabled={isSubmitting}
            >
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Log Intentional Spend
            </Button>
          </>
        }
      >
        <div className="py-2">
          <TransactionForm
            id="dashboard-transaction-form"
            showFooter={false}
            categories={categories}
            onSubmit={handleCreateTransaction}
            onCancel={() => setIsModalOpen(false)}
          />
        </div>
      </ResponsiveModal>
    </div>
  );
}
