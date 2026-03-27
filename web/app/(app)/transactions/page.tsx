import {
  getTransactions,
  getTransactionTotals,
} from "@/lib/queries/transactions";
import { PageHeader } from "@/components/page-header";
import { TransactionList } from "@/components/transaction-list";
import { TransactionSearch } from "@/components/transaction-search";
import { ExportButton } from "@/components/export-button";
import { Button } from "@/components/ui/button";
import type { FilterState, TransactionType } from "@/types";

type TransactionsPageProps = {
  searchParams?: {
    type?: TransactionType;
    query?: string;
  };
};

type EmptyStateProps = {
  typeParam?: TransactionType;
  searchQuery: string;
};

function EmptyState({ typeParam, searchQuery }: EmptyStateProps) {
  const message =
    !typeParam && !searchQuery
      ? "No transactions yet. Tap the + button to add your first entry."
      : `No results for${searchQuery ? ` "${searchQuery}"` : ""}${typeParam ? ` in ${typeParam}` : ""}. Try a different search or filter.`;

  return (
    <div className="rounded-2xl border border-dashed border-border p-10 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}

const FILTERS: Array<{ label: string; value: "all" | TransactionType }> = [
  { label: "All", value: "all" },
  { label: "Income", value: "income" },
  { label: "Expense", value: "expense" },
];

function buildFilterHref(
  filterValue: "all" | TransactionType,
  searchQuery: string,
): string {
  if (filterValue === "all") {
    return searchQuery
      ? `/transactions?query=${encodeURIComponent(searchQuery)}`
      : "/transactions";
  }
  return `/transactions?type=${filterValue}${searchQuery ? `&query=${encodeURIComponent(searchQuery)}` : ""}`;
}

export default async function TransactionsPage({
  searchParams,
}: TransactionsPageProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const typeParam = resolvedParams?.type;
  const searchQuery = resolvedParams?.query ?? "";

  const [transactions, totals] = await Promise.all([
    getTransactions({
      type: typeParam,
      search: searchQuery,
      orderBy: "date_desc",
      limit: 51,
    }),
    getTransactionTotals({
      type: typeParam,
      search: searchQuery,
    }),
  ]);

  const hasMore = transactions.length > 50;
  const filter: FilterState = {
    type: typeParam,
    search: searchQuery,
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Transactions"
        description="Track income and expenses"
        action={
          <ExportButton filter={{ type: typeParam, search: searchQuery }} />
        }
      />

      <div className="space-y-3">
        <div className="sticky top-4 z-20 rounded-xl border border-border bg-card p-2.5">
          <TransactionSearch />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((filter) => {
            const isAll = filter.value === "all";
            const isActive =
              (isAll && !typeParam) || typeParam === filter.value;
            return (
              <Button
                key={filter.value}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className="min-h-[44px]"
                asChild
              >
                <a href={buildFilterHref(filter.value, searchQuery)}>
                  {filter.label}
                </a>
              </Button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        {transactions.length === 0 ? (
          <EmptyState typeParam={typeParam} searchQuery={searchQuery} />
        ) : (
          <TransactionList
            key={`${typeParam ?? "all"}-${searchQuery}`}
            initialTransactions={transactions.slice(0, 50)}
            initialHasMore={hasMore}
            filter={filter}
            totals={totals}
          />
        )}
      </div>
    </div>
  );
}
