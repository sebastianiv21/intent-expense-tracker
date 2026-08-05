import { describe, expect, it } from "vitest";
import { createFormatter } from "next-intl";
import { FORMATS, TIME_ZONE } from "@/lib/i18n/formats";
import { toDisplayDate } from "@/lib/i18n/dates";
import { formatMoney, formatMoneyCompact, formatPercent } from "@/lib/i18n/money";
import { getCurrencyNamer } from "@/lib/i18n/currency-names";
import { LOCALES, type Locale } from "@/lib/i18n/locales";
import { BUCKET_DEFINITIONS, calculateBucketTarget } from "@/lib/finance-utils";

function formatterFor(locale: Locale) {
  return createFormatter({ locale, formats: FORMATS, timeZone: TIME_ZONE });
}

const en = formatterFor("en");
const es = formatterFor("es");

/** Intl separates currency and value with U+00A0; assertions read better with it named. */
const NBSP = " ";

describe("currency formatting", () => {
  it("keeps the currency and the locale independent", () => {
    // Same money, two readers: the code never changes, the arrangement does.
    expect(formatMoney(en, 1234.5, "USD")).toBe("$1,234.50");
    expect(formatMoney(es, 1234.5, "USD")).toBe(`1234,50${NBSP}US$`);

    expect(formatMoney(en, 1234.5, "EUR")).toBe("€1,234.50");
    expect(formatMoney(es, 1234.5, "EUR")).toBe(`1234,50${NBSP}€`);
  });

  it("gives a Spanish reader a decimal comma and dot grouping", () => {
    const spanish = formatMoney(es, 1234567.89, "USD");
    expect(spanish).toContain("1.234.567,89");
    expect(formatMoney(en, 1234567.89, "USD")).toBe("$1,234,567.89");
  });

  it("honours zero-decimal currencies in both locales", () => {
    expect(formatMoney(en, 1234567, "COP")).toBe(`COP${NBSP}1,234,567`);
    expect(formatMoney(es, 1234567, "COP")).toBe(`1.234.567${NBSP}COP`);
    expect(formatMoney(en, 1234.56, "JPY")).toBe("¥1,235");
    expect(formatMoney(es, 1234.56, "JPY")).toBe(`1235${NBSP}JPY`);
  });

  it("formats negatives and unparseable amounts consistently", () => {
    expect(formatMoney(en, -99.999, "EUR")).toBe("-€100.00");
    expect(formatMoney(es, -99.999, "EUR")).toBe(`-100,00${NBSP}€`);
    expect(formatMoney(en, "not a number", "USD")).toBe("$0.00");
    expect(formatMoney(es, "not a number", "USD")).toBe(`0,00${NBSP}US$`);
    expect(formatMoney(en, "", "USD")).toBe("$0.00");
  });

  it("accepts the string amounts Drizzle returns", () => {
    expect(formatMoney(en, "1234.5", "USD")).toBe("$1,234.50");
    expect(formatMoney(es, "1234.5", "USD")).toBe(`1234,50${NBSP}US$`);
  });
});

describe("compact currency formatting", () => {
  it("stays long below the threshold and goes compact above it", () => {
    expect(formatMoneyCompact(en, 999.5, "USD")).toBe("$999.50");
    expect(formatMoneyCompact(en, 1500, "USD")).toBe("$1.5K");
    expect(formatMoneyCompact(en, 1234567, "USD")).toBe("$1.23M");
    expect(formatMoneyCompact(en, -1500, "USD")).toBe("-$1.5K");
  });

  it("uses the Spanish compact notation, not the English one", () => {
    // Spanish abbreviates thousands as "mil" and millions as "M".
    expect(formatMoneyCompact(es, 1500, "USD")).toBe(
      `1,5${NBSP}mil${NBSP}US$`,
    );
    expect(formatMoneyCompact(es, 1234567, "USD")).toBe(
      `1,23${NBSP}M${NBSP}US$`,
    );
    expect(formatMoneyCompact(es, 999.5, "USD")).toBe(`999,50${NBSP}US$`);
  });

  it("keeps compact precision independent of the currency's decimals", () => {
    // COP has no cents, but 1,500,000 still has to read as 1.5M, not 2M.
    expect(formatMoneyCompact(en, 1500000, "COP")).toBe(`COP${NBSP}1.5M`);
    expect(formatMoneyCompact(en, 1750000, "COP")).toBe(`COP${NBSP}1.75M`);
    expect(formatMoneyCompact(es, 1500000, "COP")).toBe(
      `1,5${NBSP}M${NBSP}COP`,
    );
  });
});

// Guards the regression fixed in #15/#17: compact notation must not round a
// significant digit away from a large zero-decimal amount.
describe("bucket targets on a large zero-decimal income", () => {
  const income = 3_000_000;
  const targets = (["needs", "wants", "future"] as const).map((bucket) =>
    calculateBucketTarget(income, BUCKET_DEFINITIONS[bucket].defaultPercentage),
  );

  it("keeps 1.5M from reading as 2M in English", () => {
    expect(targets.map((t) => formatMoneyCompact(en, t, "COP"))).toEqual([
      `COP${NBSP}1.5M`,
      `COP${NBSP}900K`,
      `COP${NBSP}600K`,
    ]);
  });

  it("keeps the same precision in Spanish", () => {
    expect(targets.map((t) => formatMoneyCompact(es, t, "COP"))).toEqual([
      `1,5${NBSP}M${NBSP}COP`,
      `900${NBSP}mil${NBSP}COP`,
      `600${NBSP}mil${NBSP}COP`,
    ]);
  });
});

describe("percentages", () => {
  it("spaces the sign the way each locale does", () => {
    expect(formatPercent(en, 50)).toBe("50%");
    expect(formatPercent(es, 50)).toBe(`50${NBSP}%`);
    expect(formatPercent(en, 0)).toBe("0%");
    expect(formatPercent(es, 100)).toBe(`100${NBSP}%`);
  });

  it("takes the whole-number percentages the app computes, not ratios", () => {
    expect(formatPercent(en, 30)).toBe("30%");
    expect(formatPercent(en, 133)).toBe("133%");
  });

  it("rounds to whole percent", () => {
    expect(formatPercent(en, 66.6)).toBe("67%");
  });
});

describe("dates", () => {
  const date = toDisplayDate("2026-08-02");

  it("translates month and weekday names", () => {
    expect(en.dateTime(date, "dayMonth")).toBe("Aug 2");
    expect(es.dateTime(date, "dayMonth")).toBe("2 ago");

    expect(en.dateTime(date, "dayMonthYear")).toBe("Aug 2, 2026");
    expect(es.dateTime(date, "dayMonthYear")).toBe("2 ago 2026");

    expect(en.dateTime(date, "longDate")).toBe("August 2, 2026");
    expect(es.dateTime(date, "longDate")).toBe("2 de agosto de 2026");

    expect(en.dateTime(date, "monthYear")).toBe("August 2026");
    expect(es.dateTime(date, "monthYear")).toBe("agosto de 2026");

    expect(en.dateTime(date, "shortMonthYear")).toBe("Aug 2026");
    expect(es.dateTime(date, "shortMonthYear")).toBe("ago 2026");
  });

  it("names the weekday in the reader's language", () => {
    expect(en.dateTime(date, "weekdayDayMonth")).toBe("Sunday, Aug 2");
    expect(es.dateTime(date, "weekdayDayMonth")).toBe("domingo, 2 ago");
  });

  it("shows a stored YYYY-MM-DD as that calendar day, not the one before", () => {
    // The regression a local-midnight parse causes anywhere west of UTC.
    const first = toDisplayDate("2026-01-01");
    expect(en.dateTime(first, "dayMonthYear")).toBe("Jan 1, 2026");
    expect(es.dateTime(first, "dayMonthYear")).toBe("1 ene 2026");
  });

  it("ignores anything after the date part of a stored value", () => {
    expect(toDisplayDate("2026-08-02").toISOString()).toBe(
      "2026-08-02T00:00:00.000Z",
    );
    expect(toDisplayDate("2026-08-02T15:30:00Z").toISOString()).toBe(
      "2026-08-02T00:00:00.000Z",
    );
  });
});

describe("named formats", () => {
  it("pins every date format to the app's fixed zone", () => {
    // Without this a server render and a client render sit in two calendars.
    for (const options of Object.values(FORMATS.dateTime)) {
      expect(options.timeZone).toBe(TIME_ZONE);
    }
  });

  it("is usable from every locale", () => {
    for (const locale of LOCALES) {
      const format = formatterFor(locale);
      for (const name of Object.keys(FORMATS.dateTime)) {
        expect(
          format.dateTime(
            new Date("2026-08-02T00:00:00Z"),
            name as keyof typeof FORMATS.dateTime,
          ),
        ).toBeTruthy();
      }
    }
  });
});

describe("currency names", () => {
  it("comes from the platform in the reader's language", () => {
    expect(getCurrencyNamer("en")("USD")).toBe("US Dollar");
    expect(getCurrencyNamer("es")("USD")).toBe("dólar estadounidense");
    expect(getCurrencyNamer("es")("COP")).toBe("peso colombiano");
    expect(getCurrencyNamer("es")("JPY")).toBe("yen japonés");
  });

  it("shows the bare code for an unknown currency rather than inventing a name", () => {
    expect(getCurrencyNamer("en")("ZZZ")).toBe("ZZZ");
    expect(getCurrencyNamer("es")("ZZZ")).toBe("ZZZ");
  });
});
