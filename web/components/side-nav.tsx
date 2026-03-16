"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, List, BarChart2, User, RefreshCw, Tag, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/transactions", label: "Transactions", icon: List },
  { href: "/budgets", label: "Budgets", icon: PieChart },
  { href: "/categories", label: "Categories", icon: Tag },
  { href: "/recurring", label: "Recurring", icon: RefreshCw },
  { href: "/insights", label: "Insights", icon: BarChart2 },
  { href: "/profile", label: "Profile", icon: User },
];

export function SideNav() {
  const pathname = usePathname();

  return (
    <aside className="hidden lg:flex flex-col w-60 h-screen fixed left-0 top-0 border-r border-border bg-card z-40">
      <div className="p-6 border-b border-border">
        <span className="text-lg font-bold text-foreground">Intent</span>
        <p className="text-xs text-muted-foreground mt-0.5">Expense Tracker</p>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px]",
                isActive
                  ? "bg-accent/10 text-accent"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-4 w-4 flex-shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
