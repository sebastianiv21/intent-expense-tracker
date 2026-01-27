import { relations } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  pgEnum,
} from "drizzle-orm/pg-core";
import { user } from "./auth";

export const categoryTypeEnum = pgEnum("category_type", ["expense", "income"]);
export const allocationBucketEnum = pgEnum("allocation_bucket", [
  "needs",
  "wants",
  "future",
]);

export const category = pgTable("category", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 50 }).notNull(),
  type: categoryTypeEnum("type").notNull(),
  allocationBucket: allocationBucketEnum("allocation_bucket"),
  icon: varchar("icon", { length: 10 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at")
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
});

export const categoryRelations = relations(category, ({ one, many }) => ({
  user: one(user, {
    fields: [category.userId],
    references: [user.id],
  }),
}));

export type Category = typeof category.$inferSelect;
export type NewCategory = typeof category.$inferInsert;
