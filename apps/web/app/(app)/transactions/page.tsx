"use client";

import { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Plus, Loader2, Download } from "lucide-react";
import { toast } from "sonner";
import { type CreateTransaction } from "@repo/shared";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { api, ApiError } from "@/lib/api-client";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionItem } from "@/components/transactions/transaction-item";
import { TransactionSearch } from "@/components/transactions/transaction-search";
import {
  TransactionFilters,
  type FilterState,
} from "@/components/transactions/transaction-filters";
import { Pagination } from "@/components/ui/pagination";
import { type Category } from "@/app/(app)/categories/page";
import {
  ResponsiveModal,
  ResponsiveModalClose,
} from "@/components/ui/responsive-modal";

export interface Transaction {
  id: string;
  amount: string;
  type: "expense" | "income";
  description?: string;
  date: string;
  categoryId?: string;
  category?: Category;
  createdAt: string;
  updatedAt: string;
}

interface PaginatedResponse {
  data: Transaction[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

const DEFAULT_LIMIT = 20;

function TransactionsPageContent() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Parse URL params
  const getFiltersFromURL = useCallback((): FilterState & {
    search: string;
    offset: number;
    limit: number;
  } => {
    return {
      search: searchParams.get("search") || "",
      type: (searchParams.get("type") as "expense" | "income") || undefined,
      categoryId: searchParams.get("categoryId") || undefined,
      startDate: searchParams.get("startDate") || undefined,
      endDate: searchParams.get("endDate") || undefined,
      minAmount: searchParams.get("minAmount")
        ? Number(searchParams.get("minAmount"))
        : undefined,
      maxAmount: searchParams.get("maxAmount")
        ? Number(searchParams.get("maxAmount"))
        : undefined,
      offset: Number(searchParams.get("offset")) || 0,
      limit: Number(searchParams.get("limit")) || DEFAULT_LIMIT,
    };
  }, [searchParams]);

  const [filters, setFilters] = useState(getFiltersFromURL);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: DEFAULT_LIMIT,
    offset: 0,
    hasMore: false,
  });

  // Update URL when filters change
  const updateURL = useCallback(
    (newFilters: typeof filters) => {
      const params = new URLSearchParams();

      if (newFilters.search) params.set("search", newFilters.search);
      if (newFilters.type) params.set("type", newFilters.type);
      if (newFilters.categoryId)
        params.set("categoryId", newFilters.categoryId);
      if (newFilters.startDate) params.set("startDate", newFilters.startDate);
      if (newFilters.endDate) params.set("endDate", newFilters.endDate);
      if (newFilters.minAmount !== undefined)
        params.set("minAmount", newFilters.minAmount.toString());
      if (newFilters.maxAmount !== undefined)
        params.set("maxAmount", newFilters.maxAmount.toString());
      if (newFilters.offset > 0)
        params.set("offset", newFilters.offset.toString());

      const query = params.toString();
      router.replace(`${pathname}${query ? `?${query}` : ""}`);
    },
    [router, pathname],
  );

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Build query params
      const params = new URLSearchParams();
      params.set("limit", filters.limit.toString());
      params.set("offset", filters.offset.toString());

      if (filters.search) params.set("search", filters.search);
      if (filters.type) params.set("type", filters.type);
      if (filters.categoryId) params.set("categoryId", filters.categoryId);
      if (filters.startDate) params.set("startDate", filters.startDate);
      if (filters.endDate) params.set("endDate", filters.endDate);
      if (filters.minAmount !== undefined)
        params.set("minAmount", filters.minAmount.toString());
      if (filters.maxAmount !== undefined)
        params.set("maxAmount", filters.maxAmount.toString());

      const [response, cats] = await Promise.all([
        api.get<PaginatedResponse>(`/transactions?${params.toString()}`),
        api.get<Category[]>("/categories"),
      ]);

      setTransactions(response.data);
      setPagination(response.pagination);
      setCategories(cats);
    } catch (err: unknown) {
      const message =
        err instanceof ApiError ? err.message : "Failed to fetch data";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  // Fetch on mount and when filters change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Sync filters with URL on mount and when URL changes
  useEffect(() => {
    setFilters(getFiltersFromURL());
  }, [getFiltersFromURL]);

  const handleSearch = (search: string) => {
    const newFilters = { ...filters, search, offset: 0 };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const handleFilterChange = (filterState: FilterState) => {
    const newFilters = { ...filters, ...filterState, offset: 0 };
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const handleClearFilters = () => {
    const newFilters = {
      search: "",
      offset: 0,
      limit: DEFAULT_LIMIT,
    } as typeof filters;
    setFilters(newFilters);
    updateURL(newFilters);
  };

  const handlePageChange = (offset: number) => {
    const newFilters = { ...filters, offset };
    setFilters(newFilters);
    updateURL(newFilters);
    // Scroll to top of list
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleCreateTransaction = async (values: CreateTransaction) => {
    setIsSubmitting(true);
    try {
      await api.post("/transactions", values);
      toast.success("Transaction recorded");
      setIsSheetOpen(false);
      fetchData();
    } catch (err: unknown) {
      const message =
        err instanceof ApiError ? err.message : "Failed to create transaction";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTransaction = async (values: CreateTransaction) => {
    if (!editingTransaction) return;
    setIsSubmitting(true);
    try {
      await api.patch(`/transactions/${editingTransaction.id}`, values);
      toast.success("Transaction updated");
      setIsSheetOpen(false);
      setEditingTransaction(null);
      fetchData();
    } catch (err: unknown) {
      const message =
        err instanceof ApiError ? err.message : "Failed to update transaction";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await api.delete(`/transactions/${id}`);
      toast.success("Transaction deleted");
      fetchData();
    } catch (err: unknown) {
      const message =
        err instanceof ApiError ? err.message : "Failed to delete transaction";
      toast.error(message);
    }
  };

  const openEditSheet = (txn: Transaction) => {
    setEditingTransaction(txn);
    setIsSheetOpen(true);
  };

  // Loading skeleton
  if (isLoading && transactions.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Skeleton className="h-9 w-48" />
            <Skeleton className="h-5 w-64 mt-2" />
          </div>
          <div className="flex items-center gap-2">
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-24" />
            <Skeleton className="h-9 w-36" />
          </div>
        </div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-20 w-full" />
          ))}
        </div>
      </div>
    );
  }

  const hasActiveFilters =
    filters.search ||
    filters.type ||
    filters.categoryId ||
    filters.startDate ||
    filters.endDate ||
    filters.minAmount !== undefined ||
    filters.maxAmount !== undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-[#f5f2ed]">
              Transactions
            </h1>
            <p className="text-[#a89580]">
              A history of all your income and expenses.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="border-[#2d2420] bg-transparent text-[#a89580] hover:bg-[#1f1815] hover:text-[#f5f2ed]"
            >
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button
              onClick={() => {
                setEditingTransaction(null);
                setIsSheetOpen(true);
              }}
              className="warm-gradient text-white"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Transaction
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-3">
          <TransactionSearch
            value={filters.search}
            onSearch={handleSearch}
            className="flex-1"
          />
          <TransactionFilters
            filters={{
              type: filters.type,
              categoryId: filters.categoryId,
              startDate: filters.startDate,
              endDate: filters.endDate,
              minAmount: filters.minAmount,
              maxAmount: filters.maxAmount,
            }}
            categories={categories}
            onChange={handleFilterChange}
            onClear={handleClearFilters}
          />
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-4">
        {transactions.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center bg-[#1f1815] border-[#2d2420]">
            <div className="p-4 rounded-full bg-[#2d2420] mb-4">
              <Plus className="h-8 w-8 text-[#a89580]" />
            </div>
            <h3 className="text-xl font-semibold text-[#f5f2ed]">
              {hasActiveFilters
                ? "No matching transactions"
                : "No transactions yet"}
            </h3>
            <p className="text-[#a89580] max-w-xs mx-auto mt-2">
              {hasActiveFilters
                ? "Try adjusting your filters or search to find what you're looking for."
                : "Start tracking your spending by adding your first transaction."}
            </p>
            {hasActiveFilters ? (
              <Button
                className="mt-6 border-[#2d2420] bg-transparent text-[#a89580] hover:bg-[#2d2420] hover:text-[#f5f2ed]"
                variant="outline"
                onClick={handleClearFilters}
              >
                Clear Filters
              </Button>
            ) : (
              <Button
                className="mt-6 warm-gradient text-white"
                onClick={() => setIsSheetOpen(true)}
              >
                Add Transaction
              </Button>
            )}
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {transactions.map((txn) => (
                <TransactionItem
                  key={txn.id}
                  transaction={txn}
                  onDelete={() => handleDeleteTransaction(txn.id)}
                  onEdit={() => openEditSheet(txn)}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.total > pagination.limit && (
              <Pagination
                total={pagination.total}
                limit={pagination.limit}
                offset={pagination.offset}
                onPageChange={handlePageChange}
                className="pt-4"
              />
            )}
          </>
        )}
      </div>

      {/* Add/Edit Modal */}
      <ResponsiveModal
        open={isSheetOpen}
        onOpenChange={(open) => {
          setIsSheetOpen(open);
          if (!open) setEditingTransaction(null);
        }}
        title={editingTransaction ? "Edit Transaction" : "Add Transaction"}
        description={
          editingTransaction
            ? "Update the details of your transaction."
            : "Enter the details of your new income or expense."
        }
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
              form="transaction-form"
              className="w-full sm:w-auto warm-gradient text-white"
              disabled={isSubmitting}
            >
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {editingTransaction ? "Save Changes" : "Record Transaction"}
            </Button>
          </>
        }
      >
        <div className="py-2">
          <TransactionForm
            id="transaction-form"
            showFooter={false}
            categories={categories}
            initialValues={
              editingTransaction
                ? {
                    ...editingTransaction,
                    amount: Number(editingTransaction.amount),
                    categoryId: editingTransaction.categoryId || null,
                  }
                : undefined
            }
            onSubmit={
              editingTransaction
                ? handleUpdateTransaction
                : handleCreateTransaction
            }
            onCancel={() => setIsSheetOpen(false)}
          />
        </div>
      </ResponsiveModal>
    </div>
  );
}

// Wrap in Suspense for useSearchParams
export default function TransactionsPage() {
  return (
    <Suspense
      fallback={
        <div className="space-y-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <Skeleton className="h-9 w-48" />
              <Skeleton className="h-5 w-64 mt-2" />
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-36" />
            </div>
          </div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </div>
      }
    >
      <TransactionsPageContent />
    </Suspense>
  );
}
