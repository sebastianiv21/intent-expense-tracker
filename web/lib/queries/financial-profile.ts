import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { financialProfile } from "@/lib/schema";
import { getAuthenticatedUser } from "./auth";
import type { FinancialProfile } from "@/types";

export async function getFinancialProfile(): Promise<FinancialProfile | null> {
  const { userId } = await getAuthenticatedUser();

  const result = await db
    .select()
    .from(financialProfile)
    .where(eq(financialProfile.userId, userId))
    .limit(1);

  return (result[0] as FinancialProfile) ?? null;
}
