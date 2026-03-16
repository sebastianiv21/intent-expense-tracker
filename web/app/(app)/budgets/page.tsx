import { format } from "date-fns";
import { getBudgetsWithSpending } from "@/lib/queries/budgets";
import { getCategories } from "@/lib/queries/categories";
import { BudgetsPage } from "@/components/budgets-page";

export default async function BudgetsRoute() {
  const initialMonth = format(new Date(), "yyyy-MM");
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
