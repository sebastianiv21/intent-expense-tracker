import { Hono } from "hono";
import { HTTPException } from "hono/http-exception";
import { eq, and } from "drizzle-orm";
import { db } from "../../db";
import { category } from "../../db/schema/category";
import { createCategorySchema, updateCategorySchema } from "@repo/shared";
import { requireAuth } from "../../lib/session";

export const categoriesRoutes = new Hono();

// Get all categories for current user
categoriesRoutes.get("/", requireAuth, async (c) => {
  const session = c.var.session;
  
  const categories = await db.query.category.findMany({
    where: eq(category.userId, session.user.id),
    orderBy: (cat) => [cat.type, cat.name],
  });
  
  return c.json(categories);
});

// Create new category
categoriesRoutes.post("/", requireAuth, async (c) => {
  const session = c.var.session;
  const body = await c.req.json();
  const parsed = createCategorySchema.safeParse(body);
  
  if (!parsed.success) {
    throw new HTTPException(400, { 
      message: "Invalid data",
    });
  }
  
  const newCategory = await db
    .insert(category)
    .values({
      userId: session.user.id,
      name: parsed.data.name,
      type: parsed.data.type,
      allocationBucket: parsed.data.allocationBucket,
      icon: parsed.data.icon,
    })
    .returning();
  
  return c.json(newCategory[0], 201);
});

// Get category by ID
categoriesRoutes.get("/:id", requireAuth, async (c) => {
  const session = c.var.session;
  const id = c.req.param("id");
  
  const cat = await db.query.category.findFirst({
    where: and(eq(category.id, id), eq(category.userId, session.user.id)),
  });
  
  if (!cat) {
    throw new HTTPException(404, { message: "Category not found" });
  }
  
  return c.json(cat);
});

// Update category
categoriesRoutes.patch("/:id", requireAuth, async (c) => {
  const session = c.var.session;
  const id = c.req.param("id");
  const body = await c.req.json();
  const parsed = updateCategorySchema.safeParse(body);
  
  if (!parsed.success) {
    throw new HTTPException(400, { 
      message: "Invalid data",
    });
  }
  
  // Verify category exists and belongs to user
  const existing = await db.query.category.findFirst({
    where: and(eq(category.id, id), eq(category.userId, session.user.id)),
  });
  
  if (!existing) {
    throw new HTTPException(404, { message: "Category not found" });
  }
  
  const updated = await db
    .update(category)
    .set({
      ...parsed.data,
      updatedAt: new Date(),
    })
    .where(and(eq(category.id, id), eq(category.userId, session.user.id)))
    .returning();
  
  return c.json(updated[0]);
});

// Delete category
categoriesRoutes.delete("/:id", requireAuth, async (c) => {
  const session = c.var.session;
  const id = c.req.param("id");
  
  // Verify category exists and belongs to user
  const existing = await db.query.category.findFirst({
    where: and(eq(category.id, id), eq(category.userId, session.user.id)),
  });
  
  if (!existing) {
    throw new HTTPException(404, { message: "Category not found" });
  }
  
  await db.delete(category).where(and(eq(category.id, id), eq(category.userId, session.user.id)));
  
  return c.json({ message: "Category deleted successfully" });
});
