"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, List, BarChart2, User } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/transactions", label: "Activity", icon: List },
  { href: "/insights", label: "Stats", icon: BarChart2 },
  { href: "/profile", label: "Profile", icon: User },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border lg:hidden">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {NAV_ITEMS.map((item, i) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] rounded-lg transition-colors",
                isActive ? "text-accent" : "text-muted-foreground"
              )}
              aria-label={item.label}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className="h-5 w-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
