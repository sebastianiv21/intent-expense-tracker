"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { signOut } from "@/lib/auth-client";
import { FinancialProfileSheet } from "@/components/financial-profile-sheet";
import { PageHeader } from "@/components/page-header";
import { ThemeToggle } from "@/components/theme-toggle";
import { LanguageToggle } from "@/components/language-toggle";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { getBucketColor, BUCKET_ORDER } from "@/lib/finance-utils";
import { useCurrency } from "@/components/currency-provider";
import { getCurrencyInfo } from "@/lib/currencies";
import { formatPercent } from "@/lib/i18n/money";
import { cn } from "@/lib/utils";
import type { FinancialProfile } from "@/types";

const STAGGER = [
  "motion-safe:delay-0",
  "motion-safe:delay-100",
  "motion-safe:delay-200",
  "motion-safe:delay-300",
] as const;

function AnimatedSection({
  index,
  children,
}: {
  index: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "motion-safe:animate-in motion-safe:fade-in motion-safe:duration-500 fill-mode-both",
        STAGGER[index],
      )}
    >
      {children}
    </div>
  );
}

const PCT_KEYS = {
  needs: "needsPercentage",
  wants: "wantsPercentage",
  future: "futurePercentage",
} as const satisfies Record<
  (typeof BUCKET_ORDER)[number],
  keyof FinancialProfile
>;

type ProfilePageProps = {
  user: {
    name: string;
    email: string;
    image?: string | null;
    createdAt?: string;
  };
  profile: FinancialProfile;
};

export function ProfilePage({ user, profile }: ProfilePageProps) {
  const router = useRouter();
  const { formatCurrency } = useCurrency();
  const t = useTranslations("profile");
  const tCommon = useTranslations("common");
  const tBuckets = useTranslations("buckets");
  const tApp = useTranslations("app");
  const format = useFormatter();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [logoutOpen, setLogoutOpen] = useState(false);
  const currencyInfo = getCurrencyInfo(profile.currency);

  const initials = user.name
    .split(" ")
    .map((part) => part[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  async function handleLogout() {
    try {
      await signOut();
    } catch {
      // If signOut fails, still redirect to login
    } finally {
      router.push("/login");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("title")} description={t("description")} />

      <AnimatedSection index={0}>
        <Card>
          <CardContent className="p-4 flex items-center gap-4">
            <Avatar className="h-16 w-16 shrink-0 ring-2 ring-primary/30">
              {user.image ? (
                <AvatarImage src={user.image} alt={user.name} />
              ) : null}
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-xl font-bold text-foreground truncate">
                {user.name}
              </p>
              <p className="text-sm text-muted-foreground truncate">
                {user.email}
              </p>
              {user.createdAt && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("memberSince", {
                    date: format.dateTime(
                      new Date(user.createdAt),
                      "shortMonthYear",
                    ),
                  })}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      <AnimatedSection index={1}>
        <Card>
          <CardContent className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  {t("financialProfile")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {t("incomeAndSplit", {
                    split: BUCKET_ORDER.map((bucket) =>
                      Math.round(Number(profile[PCT_KEYS[bucket]])),
                    ).join("/"),
                  })}
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSheetOpen(true)}
              >
                {tCommon("edit")}
              </Button>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">
                {t("monthlyIncome")}
              </span>
              <span className="font-semibold text-foreground tabular-nums">
                {formatCurrency(profile.monthlyIncomeTarget)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{t("currency")}</span>
              <span className="font-semibold text-foreground">
                {t("currencyValue", {
                  code: currencyInfo.code,
                  symbol: currencyInfo.symbol,
                })}
              </span>
            </div>
            <div className="space-y-2">
              <div className="flex rounded-full overflow-hidden h-2 gap-px">
                {BUCKET_ORDER.map((bucket) => {
                  const percentage = Number(profile[PCT_KEYS[bucket]]);
                  const color = getBucketColor(bucket);
                  return (
                    <div
                      key={bucket}
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: color,
                      }}
                      title={tBuckets("labelWithPercentage", {
                        bucket: tBuckets(bucket),
                        percentage: formatPercent(format, percentage),
                      })}
                    />
                  );
                })}
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                {BUCKET_ORDER.map((bucket) => {
                  const percentage = Number(profile[PCT_KEYS[bucket]]);
                  const color = getBucketColor(bucket);
                  return (
                    <span key={bucket} className="flex items-center gap-1">
                      <span
                        className="inline-block h-2 w-2 rounded-full shrink-0"
                        style={{ backgroundColor: color }}
                        aria-hidden="true"
                      />
                      <span style={{ color }}>{tBuckets(bucket)}</span>
                      <span className="text-foreground tabular-nums font-medium">
                        {formatPercent(format, percentage)}
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </AnimatedSection>

      <AnimatedSection index={2}>
        <Card>
          <CardContent className="p-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-foreground">
                {t("appearance")}
              </p>
              <p className="text-xs text-muted-foreground">
                {t("appearanceHint")}
              </p>
            </div>
            <ThemeToggle />
            <p className="pt-1 text-sm font-medium text-foreground">
              {t("language")}
            </p>
            <LanguageToggle />
          </CardContent>
        </Card>
      </AnimatedSection>

      <AnimatedSection index={3}>
        <div className="pt-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10 min-h-[44px]"
            onClick={() => setLogoutOpen(true)}
          >
            <LogOut className="h-4 w-4" aria-hidden="true" />
            {t("logOut")}
          </Button>
        </div>
      </AnimatedSection>

      <p className="text-center text-xs text-muted-foreground">
        {tApp("version")}
      </p>

      <FinancialProfileSheet
        profile={profile}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      <Sheet open={logoutOpen} onOpenChange={setLogoutOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-2xl px-4 pb-6 lg:left-1/2 lg:w-[min(100%-2rem,58rem)] lg:-translate-x-1/2 lg:rounded-3xl"
        >
          <SheetHeader className="text-left">
            <SheetTitle>{t("logOutPrompt")}</SheetTitle>
            <SheetDescription>{t("logOutBody")}</SheetDescription>
          </SheetHeader>
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setLogoutOpen(false)}
            >
              {tCommon("cancel")}
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleLogout}
            >
              {t("logOut")}
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
