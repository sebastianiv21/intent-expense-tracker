import { format } from "date-fns";
import { getInsights, getAllocationSummary } from "@/lib/queries/insights";
import { InsightsPage } from "@/components/insights-page";

type InsightsRouteProps = {
  searchParams?: {
    month?: string;
  };
};

export default async function InsightsRoute({
  searchParams,
}: InsightsRouteProps) {
  const resolvedParams = searchParams ? await searchParams : undefined;
  const month = resolvedParams?.month || format(new Date(), "yyyy-MM");
  const [insights, allocation] = await Promise.all([
    getInsights({ month }),
    getAllocationSummary({ month }),
  ]);

  return (
    <InsightsPage
      insights={insights}
      allocation={allocation}
      initialMonth={month}
    />
  );
}
