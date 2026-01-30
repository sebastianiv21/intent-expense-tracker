import { Hono } from "hono";
import { authRoutes } from "../modules/auth/routes";
import { transactionsRoutes } from "../modules/transactions/routes";
import { categoriesRoutes } from "../modules/categories/routes";
import { budgetsRoutes } from "../modules/budgets/routes";
import { insightsRoutes } from "../modules/insights/routes";
import { financialProfileRoutes } from "../modules/financial-profile/routes";

const v1Routes = new Hono();

v1Routes.route("/auth", authRoutes);
v1Routes.route("/transactions", transactionsRoutes);
v1Routes.route("/categories", categoriesRoutes);
v1Routes.route("/budgets", budgetsRoutes);
v1Routes.route("/insights", insightsRoutes);
v1Routes.route("/financial-profile", financialProfileRoutes);

export { v1Routes };
