import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import {
  DEFAULT_LOCALE,
  LOCALES,
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  LOCALE_LABELS,
  WEEK_STARTS_ON,
  isLocale,
  negotiateLocale,
  toLocale,
} from "@/lib/i18n/locales";

const read = (path: string) =>
  readFileSync(fileURLToPath(new URL(path, import.meta.url)), "utf8");

describe("supported locales", () => {
  it("offers exactly English and Spanish", () => {
    expect(LOCALES).toEqual(["en", "es"]);
  });

  it("defaults to English so nobody who never touches the switch sees a change", () => {
    expect(DEFAULT_LOCALE).toBe("en");
    expect(toLocale(undefined)).toBe("en");
    expect(toLocale(null)).toBe("en");
    expect(toLocale("de")).toBe("en");
    expect(toLocale("EN")).toBe("en");
  });

  it("recognises only the two known locales", () => {
    expect(LOCALES.every(isLocale)).toBe(true);
    expect(isLocale("en-US")).toBe(false);
    expect(isLocale("fr")).toBe(false);
    expect(isLocale(undefined)).toBe(false);
  });

  it("writes each language in itself", () => {
    expect(LOCALE_LABELS.en).toBe("English");
    expect(LOCALE_LABELS.es).toBe("Español");
  });

  it("starts the week where each locale does", () => {
    expect(WEEK_STARTS_ON.en).toBe(0);
    expect(WEEK_STARTS_ON.es).toBe(1);
  });

  it("persists the choice far longer than a reload", () => {
    expect(LOCALE_COOKIE).toBe("NEXT_LOCALE");
    expect(LOCALE_COOKIE_MAX_AGE).toBe(60 * 60 * 24 * 365);
  });
});

describe("Accept-Language negotiation", () => {
  it("gives a Spanish browser Spanish on a first visit", () => {
    expect(negotiateLocale("es")).toBe("es");
    expect(negotiateLocale("es-ES,es;q=0.9,en;q=0.8")).toBe("es");
    expect(negotiateLocale("es-CO,es;q=0.9")).toBe("es");
    expect(negotiateLocale("es-419")).toBe("es");
  });

  it("gives an English browser English", () => {
    expect(negotiateLocale("en-US,en;q=0.9")).toBe("en");
    expect(negotiateLocale("en-GB")).toBe("en");
  });

  it("falls back to English for a language the app does not speak", () => {
    expect(negotiateLocale("de-DE,de;q=0.9")).toBe("en");
    expect(negotiateLocale("")).toBe("en");
    expect(negotiateLocale(null)).toBe("en");
    expect(negotiateLocale(undefined)).toBe("en");
  });

  it("respects the quality order rather than the written order", () => {
    expect(negotiateLocale("en;q=0.2,es;q=0.9")).toBe("es");
    expect(negotiateLocale("es;q=0.1,en;q=0.8")).toBe("en");
  });

  it("keeps header order when qualities tie", () => {
    expect(negotiateLocale("es,en")).toBe("es");
    expect(negotiateLocale("en,es")).toBe("en");
    expect(negotiateLocale("de,es,en")).toBe("es");
  });

  it("ignores a language explicitly refused with q=0", () => {
    expect(negotiateLocale("es;q=0,en;q=0.5")).toBe("en");
  });

  it("treats * as no preference rather than a match for anything", () => {
    expect(negotiateLocale("*")).toBe("en");
    expect(negotiateLocale("de,*;q=0.5")).toBe("en");
    expect(negotiateLocale("*;q=0.5,es;q=0.4")).toBe("es");
  });

  it("survives a malformed header instead of throwing", () => {
    expect(negotiateLocale(";;;")).toBe("en");
    expect(negotiateLocale("es;q=banana")).toBe("en");
    expect(negotiateLocale(",,es,,")).toBe("es");
  });

  it("takes an explicit fallback when one is given", () => {
    expect(negotiateLocale("de", "es")).toBe("es");
  });
});

// The non-routed setup and the cookie-over-header precedence live in wiring
// rather than in callable code, so they are asserted against their source.
describe("non-routed wiring", () => {
  const request = read("../lib/i18n/request.ts");
  const config = read("../next.config.ts");
  const layout = read("../app/layout.tsx");
  const action = read("../lib/actions/locale.ts");

  it("resolves the locale from a cookie before consulting the header", () => {
    const cookieAt = request.indexOf("LOCALE_COOKIE");
    const headerAt = request.indexOf("accept-language");
    expect(cookieAt).toBeGreaterThan(-1);
    expect(headerAt).toBeGreaterThan(-1);
    expect(cookieAt).toBeLessThan(headerAt);
  });

  it("registers the request config with the next-intl plugin", () => {
    expect(config).toContain("createNextIntlPlugin");
    expect(config).toContain("./lib/i18n/request.ts");
  });

  it("keeps the locale out of the URL", () => {
    // A routed setup would need a [locale] segment and a middleware matcher.
    expect(request).not.toContain("defineRouting");
    expect(config).not.toContain("localePrefix");
    let hasLocaleSegment = false;
    try {
      readFileSync(
        fileURLToPath(new URL("../middleware.ts", import.meta.url)),
        "utf8",
      );
      hasLocaleSegment = true;
    } catch {
      hasLocaleSegment = false;
    }
    expect(hasLocaleSegment).toBe(false);
  });

  it("stamps the resolved locale onto <html lang>", () => {
    expect(layout).toMatch(/<html lang=\{locale\}/);
    expect(layout).toContain("NextIntlClientProvider");
  });

  it("persists an explicit choice in the cookie the config reads", () => {
    expect(action).toContain("LOCALE_COOKIE");
    expect(action).toContain("LOCALE_COOKIE_MAX_AGE");
    expect(action).toContain('path: "/"');
  });
});

describe("language toggle markup", () => {
  const toggle = read("../components/language-toggle.tsx");

  it("is a radiogroup over real radio inputs, like the theme switch", () => {
    expect(toggle).toContain('role="radiogroup"');
    expect(toggle).toContain('type="radio"');
    expect(toggle).toContain("LOCALES.map");
  });

  it("tags each option with the language it is written in", () => {
    expect(toggle).toContain("lang={locale}");
    expect(toggle).toContain("LOCALE_LABELS[locale]");
  });

  it("writes the choice through the server action and re-renders", () => {
    expect(toggle).toContain("setLocale");
    expect(toggle).toContain("router.refresh()");
  });
});
