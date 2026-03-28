"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, List, PieChart, MoreHorizontal, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { useTransactionSheet } from "@/components/transaction-sheet-context";
import { OverflowSheet } from "@/components/overflow-sheet";

const LEFT_ITEMS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/transactions", label: "Activity", icon: List },
];

const RIGHT_ITEMS = [{ href: "/budgets", label: "Budgets", icon: PieChart }];

export function BottomNav() {
  const pathname = usePathname();
  const { openCreate } = useTransactionSheet();
  const [overflowOpen, setOverflowOpen] = useState(false);

  function NavItem({
    href,
    label,
    icon: Icon,
  }: {
    href: string;
    label: string;
    icon: React.ElementType;
  }) {
    const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);

    return (
      <Link
        href={href}
        className={cn(
          "flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] rounded-lg transition-colors",
          isActive ? "text-accent" : "text-muted-foreground"
        )}
        aria-label={label}
        aria-current={isActive ? "page" : undefined}
      >
        <Icon className="h-5 w-5" />
        <span className="text-[10px] font-medium">{label}</span>
      </Link>
    );
  }

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-border lg:hidden">
        <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
          {LEFT_ITEMS.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}

          <button
            type="button"
            onClick={openCreate}
            className="flex items-center justify-center h-14 w-14 rounded-full bg-accent text-accent-foreground shadow-lg -mt-6 transition-opacity hover:opacity-90"
            aria-label="Add transaction"
          >
            <Plus className="h-6 w-6" />
          </button>

          {RIGHT_ITEMS.map((item) => (
            <NavItem key={item.href} {...item} />
          ))}

          <button
            type="button"
            onClick={() => setOverflowOpen(true)}
            className={cn(
              "flex flex-col items-center justify-center gap-1 min-w-[44px] min-h-[44px] rounded-lg transition-colors",
              overflowOpen ? "text-accent" : "text-muted-foreground"
            )}
            aria-label="Open navigation menu"
          >
            <MoreHorizontal className="h-5 w-5" />
            <span className="text-[10px] font-medium">More</span>
          </button>
        </div>
      </nav>

      <OverflowSheet open={overflowOpen} onOpenChange={setOverflowOpen} />
    </>
  );
}
