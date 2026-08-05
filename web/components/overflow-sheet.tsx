"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { BarChart2, Tag, RefreshCw, User } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

const OVERFLOW_ITEMS = [
  { href: "/insights", key: "stats", icon: BarChart2 },
  { href: "/categories", key: "categories", icon: Tag },
  { href: "/recurring", key: "recurring", icon: RefreshCw },
  { href: "/profile", key: "profile", icon: User },
] as const;

type OverflowSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function OverflowSheet({ open, onOpenChange }: OverflowSheetProps) {
  const pathname = usePathname();
  const t = useTranslations("nav");

  function handleNavigate() {
    onOpenChange(false);
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-2xl border-border bg-card px-4 pb-6 pt-4"
      >
        <SheetHeader className="text-left mb-4">
          <SheetTitle className="text-lg font-semibold">
            {t("sheetTitle")}
          </SheetTitle>
          <SheetDescription className="sr-only">
            {t("sheetDescription")}
          </SheetDescription>
        </SheetHeader>
        <nav className="space-y-1">
          {OVERFLOW_ITEMS.map((item) => {
            const isActive = pathname.startsWith(item.href);
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={handleNavigate}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors min-h-[44px]",
                  isActive
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-4 w-4 flex-shrink-0" />
                <span>{t(item.key)}</span>
              </Link>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
