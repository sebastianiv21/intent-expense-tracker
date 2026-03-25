import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { financialProfile } from "@/lib/schema";
import { eq } from "drizzle-orm";
import { AppShell } from "@/components/app-shell";
import { processRecurringTransactions } from "@/lib/actions/recurring";
import { getCategories } from "@/lib/queries/categories";

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

  await processRecurringTransactions();

  const categories = await getCategories();

  return <AppShell categories={categories}>{children}</AppShell>;
}
