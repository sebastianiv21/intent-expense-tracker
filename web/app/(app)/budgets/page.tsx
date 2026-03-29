import { format } from "date-fns";
import { getBudgetsWithSpending } from "@/lib/queries/budgets";
import { getCategories } from "@/lib/queries/categories";
import { BudgetsPage } from "@/components/budgets-page";

type BudgetsRouteProps = {
  searchParams?: {
    month?: string;
  };
};

export default async function BudgetsRoute({
  searchParams,
}: BudgetsRouteProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const initialMonth = resolvedParams?.month || format(new Date(), "yyyy-MM");
  const [budgets, categories] = await Promise.all([
    getBudgetsWithSpending({ month: initialMonth }),
    getCategories(),
  ]);

  return (
    <BudgetsPage
      budgets={budgets}
      categories={categories}
      initialMonth={initialMonth}
    />
  );
}
