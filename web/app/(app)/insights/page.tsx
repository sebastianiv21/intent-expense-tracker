import { format } from "date-fns";
import { getInsights, getAllocationSummary } from "@/lib/queries/insights";
import { InsightsPage } from "@/components/insights-page";

export default async function InsightsRoute() {
  const month = format(new Date(), "yyyy-MM");
  const [insights, allocation] = await Promise.all([
    getInsights({ period: "month" }),
    getAllocationSummary({ month }),
  ]);

  return <InsightsPage insights={insights} allocation={allocation} />;
}
