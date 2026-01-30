import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { eq } from "drizzle-orm";
import { getDb } from "../../db";
import { financialProfile } from "../../db/schema/financial-profile";
import {
  createFinancialProfileSchema,
  updateFinancialProfileSchema,
} from "@repo/shared";
import { requireAuth } from "../../lib/session";

export const financialProfileRoutes = new Hono();

// Get financial profile for current user
financialProfileRoutes.get("/", requireAuth, async (c) => {
  const session = c.var.session;
  const db = getDb();

  const profile = await db.query.financialProfile.findFirst({
    where: eq(financialProfile.userId, session.user.id),
  });

  if (!profile) {
    throw new HTTPException(404, { message: "Financial profile not found" });
  }

  return c.json(profile);
});

// Create financial profile
financialProfileRoutes.post("/", requireAuth, async (c) => {
  const session = c.var.session;
  const body = await c.req.json();
  const parsed = createFinancialProfileSchema.safeParse(body);
  const db = getDb();

  if (!parsed.success) {
    throw new HTTPException(400, {
      message:
        parsed.error.issues.map((i) => i.message).join(", ") || "Invalid data",
    });
  }

  // Check if profile already exists
  const existing = await db.query.financialProfile.findFirst({
    where: eq(financialProfile.userId, session.user.id),
  });

  if (existing) {
    throw new HTTPException(409, {
      message: "Financial profile already exists",
    });
  }

  const newProfile = await db
    .insert(financialProfile)
    .values({
      userId: session.user.id,
      monthlyIncomeTarget: parsed.data.monthlyIncomeTarget.toString(),
      needsPercentage: parsed.data.needsPercentage.toString(),
      wantsPercentage: parsed.data.wantsPercentage.toString(),
      futurePercentage: parsed.data.futurePercentage.toString(),
    })
    .returning();

  return c.json(newProfile[0], 201);
});

// Update financial profile
financialProfileRoutes.patch("/", requireAuth, async (c) => {
  const session = c.var.session;
  const body = await c.req.json();
  const parsed = updateFinancialProfileSchema.safeParse(body);
  const db = getDb();

  if (!parsed.success) {
    throw new HTTPException(400, {
      message:
        parsed.error.issues.map((i) => i.message).join(", ") || "Invalid data",
    });
  }

  // Verify profile exists
  const existing = await db.query.financialProfile.findFirst({
    where: eq(financialProfile.userId, session.user.id),
  });

  if (!existing) {
    throw new HTTPException(404, { message: "Financial profile not found" });
  }

  // Prepare update data
  const updateData: any = {
    updatedAt: new Date(),
  };

  if (parsed.data.monthlyIncomeTarget !== undefined) {
    updateData.monthlyIncomeTarget = parsed.data.monthlyIncomeTarget.toString();
  }
  if (parsed.data.needsPercentage !== undefined) {
    updateData.needsPercentage = parsed.data.needsPercentage.toString();
  }
  if (parsed.data.wantsPercentage !== undefined) {
    updateData.wantsPercentage = parsed.data.wantsPercentage.toString();
  }
  if (parsed.data.futurePercentage !== undefined) {
    updateData.futurePercentage = parsed.data.futurePercentage.toString();
  }

  const updated = await db
    .update(financialProfile)
    .set(updateData)
    .where(eq(financialProfile.userId, session.user.id))
    .returning();

  return c.json(updated[0]);
});
