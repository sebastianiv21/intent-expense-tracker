import { getTranslations } from "next-intl/server";
import {
  getTransactions,
  getTransactionTotals,
} from "@/lib/queries/transactions";
import { PageHeader } from "@/components/page-header";
import { TransactionList } from "@/components/transaction-list";
import { TransactionSearch } from "@/components/transaction-search";
import { TransactionsHeaderActions } from "@/components/transactions-header-actions";
import { Button } from "@/components/ui/button";
import type { FilterState, TransactionType } from "@/types";

type TransactionsPageProps = {
  searchParams?: {
    type?: TransactionType;
    query?: string;
  };
};

const FILTERS = [
  { key: "filterAll", value: "all" },
  { key: "filterIncome", value: "income" },
  { key: "filterExpense", value: "expense" },
] as const;

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

  const [transactions, totals, t] = await Promise.all([
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
    getTranslations("transactions"),
  ]);

  const hasMore = transactions.length > 50;
  const filter: FilterState = {
    type: typeParam,
    search: searchQuery,
  };

  // Four separate messages rather than one assembled from fragments: Spanish
  // needs "en ingresos" where English needs "in income", and a sentence stitched
  // together in JSX cannot be reordered by a translator.
  function emptyMessage(): string {
    if (!typeParam && !searchQuery) return t("empty");
    if (searchQuery && typeParam)
      return t("noResultsQueryType", { query: searchQuery, type: typeParam });
    if (searchQuery) return t("noResultsQuery", { query: searchQuery });
    if (typeParam) return t("noResultsType", { type: typeParam });
    return t("noResults");
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title={t("title")}
        description={t("description")}
        action={<TransactionsHeaderActions filter={filter} />}
      />

      <div className="space-y-3">
        <div className="sticky top-4 z-20 rounded-xl border border-border bg-card p-2.5">
          <TransactionSearch />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1">
          {FILTERS.map((option) => {
            const isAll = option.value === "all";
            const isActive =
              (isAll && !typeParam) || typeParam === option.value;
            return (
              <Button
                key={option.value}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className="min-h-[44px]"
                asChild
              >
                <a href={buildFilterHref(option.value, searchQuery)}>
                  {t(option.key)}
                </a>
              </Button>
            );
          })}
        </div>
      </div>

      <div className="space-y-4">
        {transactions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-10 text-center">
            <p className="text-sm text-muted-foreground">{emptyMessage()}</p>
          </div>
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
