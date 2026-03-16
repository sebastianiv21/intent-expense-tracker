import { getRecurringTransactions } from "@/lib/queries/recurring";
import { getCategories } from "@/lib/queries/categories";
import { RecurringPage } from "@/components/recurring-page";

export default async function RecurringRoute() {
  const [recurring, categories] = await Promise.all([
    getRecurringTransactions(),
    getCategories(),
  ]);

  return <RecurringPage recurring={recurring} categories={categories} />;
}
