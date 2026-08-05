export const LOCALES = ["en", "es"] as const;

export type Locale = (typeof LOCALES)[number];

/** Anyone who never touches the switch stays on the language the app shipped with. */
export const DEFAULT_LOCALE: Locale = "en";

/** Each language is written in itself — the reader who needs this control cannot read the other one. */
export const LOCALE_LABELS: Record<Locale, string> = {
  en: "English",
  es: "Español",
};

/**
 * Which day a calendar week starts on. `Intl` exposes this as `getWeekInfo()`,
 * but support is still uneven, and with two locales the fact is short enough to
 * state outright: Sunday in the US, Monday across the Spanish-speaking world.
 */
export const WEEK_STARTS_ON: Record<Locale, 0 | 1> = {
  en: 0,
  es: 1,
};

export const LOCALE_COOKIE = "NEXT_LOCALE";

/** One year: the choice has to survive far more than a reload. */
export const LOCALE_COOKIE_MAX_AGE = 60 * 60 * 24 * 365;

export function isLocale(value: string | undefined | null): value is Locale {
  return value != null && (LOCALES as readonly string[]).includes(value);
}

export function toLocale(value: string | undefined | null): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

type LanguageRange = {
  tag: string;
  quality: number;
};

function parseAcceptLanguage(header: string): LanguageRange[] {
  return header
    .split(",")
    .map((part, index) => {
      const [tag, ...params] = part.trim().split(";");
      const q = params
        .map((param) => param.trim())
        .find((param) => param.startsWith("q="));
      const quality = q ? Number.parseFloat(q.slice(2)) : 1;
      return {
        tag: tag.trim().toLowerCase(),
        // Ties keep header order, which is the client's own preference order.
        quality: Number.isFinite(quality) ? quality - index * 1e-6 : 0,
      };
    })
    .filter((range) => range.tag.length > 0 && range.quality > 0)
    .sort((a, b) => b.quality - a.quality);
}

/**
 * Picks a supported locale from an `Accept-Language` header, used only when no
 * explicit choice has been stored — an explicit choice always wins over this.
 *
 * Matching is on the primary subtag, so `es-CO` and `es-419` both resolve to
 * `es`. `*` is ignored rather than treated as a match for anything: it means
 * "no preference", which is what the default already expresses.
 */
export function negotiateLocale(
  header: string | null | undefined,
  fallback: Locale = DEFAULT_LOCALE,
): Locale {
  if (!header) return fallback;

  for (const { tag } of parseAcceptLanguage(header)) {
    if (tag === "*") continue;
    const primary = tag.split("-")[0];
    if (isLocale(primary)) return primary;
  }

  return fallback;
}
