"use client";

import { useId, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { setLocale } from "@/lib/actions/locale";
import { LOCALES, LOCALE_LABELS, toLocale, type Locale } from "@/lib/i18n/locales";

export function LanguageToggle() {
  const t = useTranslations("profile");
  const router = useRouter();
  const name = useId();
  const [isPending, startTransition] = useTransition();

  // Unlike the theme, the locale is server-known: it comes from the cookie the
  // request config already read, so the first paint can mark it selected.
  const selected = toLocale(useLocale());
  const selectedIndex = LOCALES.indexOf(selected);

  function choose(locale: Locale) {
    if (locale === selected) return;
    startTransition(async () => {
      await setLocale(locale);
      router.refresh();
    });
  }

  return (
    <div
      role="radiogroup"
      aria-label={t("language")}
      className="relative flex rounded-2xl bg-secondary p-1"
    >
      <span
        aria-hidden="true"
        className="absolute inset-y-1 rounded-xl bg-card shadow-sm transition-all duration-200"
        style={{
          left: `calc(${selectedIndex} * (100% / ${LOCALES.length}) + 4px)`,
          width: `calc(100% / ${LOCALES.length} - 8px)`,
        }}
      />
      {LOCALES.map((locale) => {
        const isSelected = selected === locale;
        return (
          <label
            key={locale}
            className="relative z-10 flex flex-1 cursor-pointer items-center justify-center"
          >
            <input
              type="radio"
              name={name}
              value={locale}
              checked={isSelected}
              disabled={isPending}
              onChange={() => choose(locale)}
              className="peer sr-only"
            />
            <span
              // Written in its own language, and tagged as such: the reader who
              // needs this control is the one who cannot read the other option.
              lang={locale}
              className={cn(
                "flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-card",
                isSelected ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {LOCALE_LABELS[locale]}
            </span>
          </label>
        );
      })}
    </div>
  );
}
