import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { financialProfile } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { AppShell } from "@/components/app-shell";
import { CurrencyProvider } from "@/components/currency-provider";
import { processRecurringTransactions } from "@/lib/actions/recurring";
import { getCategories } from "@/lib/queries/categories";
import { DEFAULT_CURRENCY } from "@/lib/currencies";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  if (!session?.user) {
    redirect("/login");
  }

  const profile = await db
    .select()
    .from(financialProfile)
    .where(eq(financialProfile.userId, session.user.id))
    .limit(1);

  if (!profile[0]) {
    redirect("/onboarding");
  }

  // Process recurring transactions - don't let failures block the page
  try {
    await processRecurringTransactions();
  } catch (err) {
    console.error("Failed to process recurring transactions:", err);
  }

  const categories = await getCategories();
  const currency = profile[0]?.currency ?? DEFAULT_CURRENCY;

  return (
    <CurrencyProvider currency={currency}>
      <AppShell categories={categories}>{children}</AppShell>
    </CurrencyProvider>
  );
}
