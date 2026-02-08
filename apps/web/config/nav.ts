import {
  LayoutDashboard,
  ArrowLeftRight,
  PieChart,
  BarChart3,
  User,
  Repeat,
} from "lucide-react";

export const navItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Transactions",
    href: "/transactions",
    icon: ArrowLeftRight,
  },
  {
    label: "Budgets",
    href: "/budgets",
    icon: PieChart,
  },
  {
    label: "Recurring",
    href: "/recurring",
    icon: Repeat,
  },
  {
    label: "Insights",
    href: "/insights",
    icon: BarChart3,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: User,
  },
] as const;

export const bottomNavItems = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Transactions",
    href: "/transactions",
    icon: ArrowLeftRight,
  },
  {
    label: "Recurring",
    href: "/recurring",
    icon: Repeat,
  },
  {
    label: "Profile",
    href: "/profile",
    icon: User,
  },
] as const;
