"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { Home, List, BarChart2, User, RefreshCw, Tag, PieChart } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", key: "dashboard", icon: Home },
  { href: "/transactions", key: "transactions", icon: List },
  { href: "/budgets", key: "budgets", icon: PieChart },
  { href: "/categories", key: "categories", icon: Tag },
  { href: "/recurring", key: "recurring", icon: RefreshCw },
  { href: "/insights", key: "insights", icon: BarChart2 },
  { href: "/profile", key: "profile", icon: User },
] as const;

export function SideNav() {
  const pathname = usePathname();
  const t = useTranslations("nav");
  const tApp = useTranslations("app");

  return (
    <aside className="hidden lg:flex flex-col w-60 h-screen fixed left-0 top-0 border-r border-border bg-card z-40">
      <div className="p-6 border-b border-border">
        <span className="text-lg font-bold text-foreground">
          {tApp("brand")}
        </span>
        <p className="text-xs text-muted-foreground mt-0.5">
          {tApp("tagline")}
        </p>
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
              {t(item.key)}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
