import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "./db";
import * as schema from "./schema";
import { DEFAULT_CATEGORIES } from "./seed-data";

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.user,
      session: schema.session,
      account: schema.account,
      verification: schema.verification,
    },
  }),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
  },
  account: {
    accountLinking: {
      enabled: true,
      trustedProviders: ["google"],
    },
  },
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            await db.insert(schema.categories).values(
              DEFAULT_CATEGORIES.map((cat) => ({
                userId: user.id,
                name: cat.name,
                type: cat.type,
                allocationBucket: cat.allocationBucket ?? null,
                icon: cat.icon,
              })),
            );
          } catch (err) {
            console.error(
              "Failed to seed default categories for user",
              user.id,
              err,
            );
          }
        },
      },
    },
  },
});
