"use client";

import { useId, useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { useTranslations } from "next-intl";
import { Sun, Monitor, Moon, type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { THEME_CHOICES, toThemeChoice, type ThemeChoice } from "@/lib/theme";

const ICONS: Record<ThemeChoice, LucideIcon> = {
  light: Sun,
  system: Monitor,
  dark: Moon,
};

const LABEL_KEYS = {
  light: "themeLight",
  system: "themeSystem",
  dark: "themeDark",
} as const satisfies Record<ThemeChoice, string>;

const neverChanges = () => () => {};

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const t = useTranslations("profile");
  const name = useId();
  // The stored choice is unknown until the client runs, so the first paint marks
  // nothing as selected — that keeps server and client markup identical.
  const mounted = useSyncExternalStore(
    neverChanges,
    () => true,
    () => false,
  );

  const selected = mounted ? toThemeChoice(theme) : null;
  const selectedIndex = selected ? THEME_CHOICES.indexOf(selected) : -1;

  return (
    <div
      role="radiogroup"
      aria-label={t("theme")}
      className="relative flex rounded-2xl bg-secondary p-1"
    >
      {selectedIndex >= 0 && (
        <span
          aria-hidden="true"
          className="absolute inset-y-1 rounded-xl bg-card shadow-sm transition-all duration-200"
          style={{
            left: `calc(${selectedIndex} * (100% / 3) + 4px)`,
            width: "calc(100% / 3 - 8px)",
          }}
        />
      )}
      {THEME_CHOICES.map((choice) => {
        const Icon = ICONS[choice];
        const isSelected = selected === choice;
        return (
          <label
            key={choice}
            className="relative z-10 flex flex-1 cursor-pointer items-center justify-center"
          >
            <input
              type="radio"
              name={name}
              value={choice}
              checked={isSelected}
              onChange={() => setTheme(choice)}
              className="peer sr-only"
            />
            <span
              className={cn(
                "flex min-h-[44px] w-full items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-colors",
                "peer-focus-visible:ring-2 peer-focus-visible:ring-ring peer-focus-visible:ring-offset-2 peer-focus-visible:ring-offset-card",
                isSelected ? "text-foreground" : "text-muted-foreground",
              )}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              {t(LABEL_KEYS[choice])}
            </span>
          </label>
        );
      })}
    </div>
  );
}
