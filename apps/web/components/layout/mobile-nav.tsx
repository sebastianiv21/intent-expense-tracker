"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, List, BarChart3, User, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { type CreateTransaction } from "@repo/shared";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  ResponsiveModal,
  ResponsiveModalClose,
} from "@/components/ui/responsive-modal";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { api, ApiError } from "@/lib/api-client";
import { type Category } from "@/app/(app)/categories/page";

const mobileNavItems = [
  { label: "Home", href: "/", icon: Home },
  { label: "Activity", href: "/transactions", icon: List },
  { label: "Stats", href: "/insights", icon: BarChart3 },
  { label: "Profile", href: "/profile", icon: User },
] as const;

export function MobileNav() {
  const pathname = usePathname();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingCats, setIsLoadingCats] = useState(false);

  const fetchCategories = async () => {
    setIsLoadingCats(true);
    try {
      const cats = await api.get<Category[]>("/categories");
      setCategories(cats);
    } catch (err: unknown) {
      console.error("Failed to fetch categories", err);
    } finally {
      setIsLoadingCats(false);
    }
  };

  useEffect(() => {
    if (isModalOpen && categories.length === 0) {
      fetchCategories();
    }
  }, [isModalOpen, categories.length]);

  const handleCreateTransaction = async (values: CreateTransaction) => {
    setIsSubmitting(true);
    try {
      await api.post("/transactions", values);
      toast.success("Transaction recorded");
      setIsModalOpen(false);
      if (pathname === "/" || pathname === "/transactions") {
        window.location.reload();
      }
    } catch (err: unknown) {
      const message =
        err instanceof ApiError ? err.message : "Failed to create transaction";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-[#16110a]/90 backdrop-blur-lg border-t border-[#1f1815] flex items-center justify-around px-4 z-50">
        {mobileNavItems.slice(0, 2).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 transition-colors",
                isActive ? "text-[#c97a5a]" : "text-[#a89580]",
              )}
            >
              <Icon className="h-6 w-6" />
              <span className="text-[10px] font-medium uppercase">{item.label}</span>
            </Link>
          );
        })}

        {/* Floating Action Button */}
        <div className="relative -top-6">
          <button
            onClick={() => setIsModalOpen(true)}
            className="w-14 h-14 rounded-full warm-gradient shadow-xl shadow-[#c97a5a44] flex items-center justify-center text-white float-animation"
          >
            <Plus className="h-7 w-7" />
          </button>
        </div>

        {mobileNavItems.slice(2).map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 transition-colors",
                isActive ? "text-[#c97a5a]" : "text-[#a89580]",
              )}
            >
              <Icon className="h-6 w-6" />
              <span className="text-[10px] font-medium uppercase">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Add Transaction Modal */}
      <ResponsiveModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title="New Awareness"
        description="Log your intentional spend."
        footer={
          <>
            <ResponsiveModalClose>
              <Button
                variant="outline"
                className="w-full sm:w-auto border-[#2d2420] bg-transparent text-[#a89580] hover:bg-[#1f1815] hover:text-[#f5f2ed]"
              >
                Cancel
              </Button>
            </ResponsiveModalClose>
            <Button
              type="submit"
              form="mobile-nav-transaction-form"
              className="w-full sm:w-auto warm-gradient text-white"
              disabled={isSubmitting || isLoadingCats}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Log Intentional Spend
            </Button>
          </>
        }
      >
        <div className="py-2">
          {isLoadingCats ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-[#c97a5a]" />
            </div>
          ) : (
            <TransactionForm
              id="mobile-nav-transaction-form"
              showFooter={false}
              categories={categories}
              onSubmit={handleCreateTransaction}
              onCancel={() => setIsModalOpen(false)}
            />
          )}
        </div>
      </ResponsiveModal>
    </>
  );
}
