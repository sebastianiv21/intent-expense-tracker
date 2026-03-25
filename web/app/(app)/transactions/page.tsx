import { getTransactions } from "@/lib/queries/transactions";
import { PageHeader } from "@/components/page-header";
import { TransactionItem } from "@/components/transaction-item";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TransactionType } from "@/types";

type TransactionsPageProps = {
  searchParams?: {
    type?: TransactionType;
    query?: string;
  };
};

const FILTERS: Array<{ label: string; value: "all" | TransactionType }> = [
  { label: "All", value: "all" },
  { label: "Income", value: "income" },
  { label: "Expense", value: "expense" },
];

export default async function TransactionsPage({ searchParams }: TransactionsPageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const typeParam = resolvedParams?.type;
  const searchQuery = resolvedParams?.query ?? "";

  const transactions = await getTransactions({
    type: typeParam,
    search: searchQuery,
    orderBy: "date_desc",
    limit: 50,
  });

  return (
    <div className="space-y-6">
        <PageHeader
          title="Transactions"
          description="Track income and expenses"
          action={
            <Button variant="outline" size="sm" className="hidden sm:inline-flex">
              Export
            </Button>
          }
        />

        <div className="space-y-4">
          <div className="sticky top-4 z-20 rounded-xl border border-border bg-card p-3">
            <Input
              placeholder="Search transactions"
              name="query"
              defaultValue={searchQuery}
              className="bg-background"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2">
            {FILTERS.map((filter) => (
              <Button
                key={filter.value}
                variant={
                  (filter.value === "all" && !typeParam) || typeParam === filter.value
                    ? "default"
                    : "outline"
                }
                size="sm"
                className="min-h-[44px]"
                asChild
              >
                <a
                  href={
                    filter.value === "all"
                      ? "/transactions"
                      : `/transactions?type=${filter.value}`
                  }
                >
                  {filter.label}
                </a>
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {transactions.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border p-10 text-center">
              <p className="text-sm text-muted-foreground">
                No transactions yet. Tap the + button to add your first entry.
              </p>
            </div>
          ) : (
            transactions.map((transaction) => (
              <TransactionItem key={transaction.id} transaction={transaction} />
            ))
          )}
        </div>
    </div>
  );
}

