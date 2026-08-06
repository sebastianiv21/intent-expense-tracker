export const THEME_CHOICES = ["light", "system", "dark"] as const;

export type ThemeChoice = (typeof THEME_CHOICES)[number];

export type ResolvedTheme = "light" | "dark";

/** Anyone who has never touched the switch stays on the theme the app shipped with. */
export const DEFAULT_THEME_CHOICE: ThemeChoice = "dark";

export function isThemeChoice(value: string | undefined): value is ThemeChoice {
  return (
    value !== undefined && (THEME_CHOICES as readonly string[]).includes(value)
  );
}

export function toThemeChoice(value: string | undefined): ThemeChoice {
  return isThemeChoice(value) ? value : DEFAULT_THEME_CHOICE;
}

/** What the user actually sees: "system" defers to the OS, everything else is literal. */
export function resolveTheme(
  choice: string | undefined,
  systemTheme: string | undefined,
): ResolvedTheme {
  const selected = toThemeChoice(choice);
  if (selected !== "system") return selected;
  return systemTheme === "light" ? "light" : "dark";
}
