"use client";

import { useEffect, useState } from "react";
import { Plus, Loader2, Filter, Download } from "lucide-react";
import { toast } from "sonner";
import { type CreateTransaction } from "@repo/shared";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { api, ApiError } from "@/lib/api-client";
import { TransactionForm } from "@/components/transactions/transaction-form";
import { TransactionItem } from "@/components/transactions/transaction-item";
import { type Category } from "@/app/(app)/categories/page";

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

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const fetchData = async () => {
    try {
      const [txns, cats] = await Promise.all([
        api.get<Transaction[]>("/transactions"),
        api.get<Category[]>("/categories"),
      ]);
      setTransactions(txns);
      setCategories(cats);
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : "Failed to fetch data";
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateTransaction = async (values: CreateTransaction) => {
    try {
      await api.post("/transactions", values);
      toast.success("Transaction recorded");
      setIsSheetOpen(false);
      fetchData();
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : "Failed to create transaction";
      toast.error(message);
    }
  };

  const handleUpdateTransaction = async (values: CreateTransaction) => {
    if (!editingTransaction) return;
    try {
      await api.patch(`/transactions/${editingTransaction.id}`, values);
      toast.success("Transaction updated");
      setIsSheetOpen(false);
      setEditingTransaction(null);
      fetchData();
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : "Failed to update transaction";
      toast.error(message);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    try {
      await api.delete(`/transactions/${id}`);
      toast.success("Transaction deleted");
      fetchData();
    } catch (err: unknown) {
      const message = err instanceof ApiError ? err.message : "Failed to delete transaction";
      toast.error(message);
    }
  };

  const openEditSheet = (txn: Transaction) => {
    setEditingTransaction(txn);
    setIsSheetOpen(true);
  };

  if (isLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Transactions</h1>
          <p className="text-muted-foreground">
            A history of all your income and expenses.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => {
            setEditingTransaction(null);
            setIsSheetOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add Transaction
          </Button>
        </div>
      </div>

      <div className="grid gap-4">
        {transactions.length === 0 ? (
          <Card className="flex flex-col items-center justify-center p-12 text-center">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold text-foreground">No transactions yet</h3>
            <p className="text-muted-foreground max-w-xs mx-auto mt-2">
              Start tracking your spending by adding your first transaction.
            </p>
            <Button className="mt-6" onClick={() => setIsSheetOpen(true)}>
              Add Transaction
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {transactions.map((txn) => (
              <TransactionItem
                key={txn.id}
                transaction={txn}
                onDelete={() => handleDeleteTransaction(txn.id)}
                onEdit={() => openEditSheet(txn)}
              />
            ))}
          </div>
        )}
      </div>

      <Sheet open={isSheetOpen} onOpenChange={(open) => {
        setIsSheetOpen(open);
        if (!open) setEditingTransaction(null);
      }}>
        <SheetContent className="sm:max-w-md">
          <SheetHeader>
            <SheetTitle>
              {editingTransaction ? "Edit Transaction" : "Add Transaction"}
            </SheetTitle>
            <SheetDescription>
              {editingTransaction 
                ? "Update the details of your transaction." 
                : "Enter the details of your new income or expense."}
            </SheetDescription>
          </SheetHeader>
          <div className="py-6">
            <TransactionForm
              categories={categories}
              initialValues={editingTransaction ? {
                ...editingTransaction,
                amount: Number(editingTransaction.amount),
                categoryId: editingTransaction.categoryId || null
              } : undefined}
              onSubmit={editingTransaction ? handleUpdateTransaction : handleCreateTransaction}
              onCancel={() => setIsSheetOpen(false)}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
