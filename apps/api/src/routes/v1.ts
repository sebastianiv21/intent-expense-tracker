import { Hono } from "hono";
import { authRoutes } from "../modules/auth/routes";
import { transactionsRoutes } from "../modules/transactions/routes";
import { categoriesRoutes } from "../modules/categories/routes";
import { budgetsRoutes } from "../modules/budgets/routes";
import { insightsRoutes } from "../modules/insights/routes";
import { financialProfileRoutes } from "../modules/financial-profile/routes";
import { recurringRoutes } from "../modules/recurring/routes";
import { authRateLimiter } from "../lib/middleware/rate-limiter";

const v1Routes = new Hono();

v1Routes.use("/auth/*", authRateLimiter);
v1Routes.route("/auth", authRoutes);

v1Routes.route("/transactions", transactionsRoutes);
v1Routes.route("/categories", categoriesRoutes);
v1Routes.route("/budgets", budgetsRoutes);
v1Routes.route("/insights", insightsRoutes);
v1Routes.route("/financial-profile", financialProfileRoutes);
v1Routes.route("/recurring-transactions", recurringRoutes);

export { v1Routes };
