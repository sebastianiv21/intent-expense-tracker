import { Context } from "hono";

// Extend the ContextVariableMap for type-safe context variables
declare module "hono" {
  interface ContextVariableMap {
    session: {
      user: {
        id: string;
        name: string;
        email: string;
        emailVerified: boolean;
        image: string | null;
        createdAt: Date;
        updatedAt: Date;
      };
      session: {
        id: string;
        expiresAt: Date;
      };
    };
  }
}
