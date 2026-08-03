import { describe, expect, it } from "vitest";
import {
  calculateBucketTarget,
  calculatePercentage,
  formatAmountDisplay,
  formatCurrency,
  formatCurrencyCompact,
  getAmountInputLength,
  getBucketColor,
  getCurrencyDecimals,
  getTransactionColor,
  initialDecimalSeparator,
  parseAmountInput,
  parseStoredAmount,
  withAlpha,
  BUCKET_DEFINITIONS,
  BUCKET_ORDER,
} from "@/lib/finance-utils";

describe("getCurrencyDecimals", () => {
  it("gives two decimals to ordinary currencies", () => {
    expect(getCurrencyDecimals("USD")).toBe(2);
    expect(getCurrencyDecimals("EUR")).toBe(2);
  });

  it("gives zero decimals to zero-decimal currencies", () => {
    for (const code of ["COP", "JPY", "KRW", "CLP", "HUF", "TWD"]) {
      expect(getCurrencyDecimals(code)).toBe(0);
    }
  });

  it("assumes two decimals for an unknown code", () => {
    expect(getCurrencyDecimals("XYZ")).toBe(2);
  });
});

describe("formatCurrency", () => {
  it("formats numbers and numeric strings identically", () => {
    expect(formatCurrency(1234.5, "USD")).toBe("$1,234.50");
    expect(formatCurrency("1234.5", "USD")).toBe("$1,234.50");
  });

  it("defaults to USD", () => {
    expect(formatCurrency(1)).toBe("$1.00");
  });

  it("drops the fractional part for zero-decimal currencies", () => {
    expect(formatCurrency(1234.56, "JPY")).toBe("¥1,235");
    expect(formatCurrency(1234567, "COP")).toBe("COP\u00a01,234,567");
  });

  it("formats negative amounts", () => {
    expect(formatCurrency(-99.999, "EUR")).toBe("-€100.00");
  });

  it("falls back to a formatted zero for unparseable input", () => {
    expect(formatCurrency("not a number", "USD")).toBe("$0.00");
    expect(formatCurrency(Number.NaN, "JPY")).toBe("¥0");
  });
});

describe("formatCurrencyCompact", () => {
  it("uses the full format below one thousand", () => {
    expect(formatCurrencyCompact(999.5, "USD")).toBe("$999.50");
  });

  it("compacts from one thousand up", () => {
    expect(formatCurrencyCompact(1500, "USD")).toBe("$1.5K");
    expect(formatCurrencyCompact(1234567, "USD")).toBe("$1.23M");
  });

  it("compacts negative amounts by magnitude", () => {
    expect(formatCurrencyCompact(-1500, "USD")).toBe("-$1.5K");
  });

  it("keeps compact decimals for zero-decimal currencies", () => {
    expect(formatCurrencyCompact(1500000, "COP")).toBe("COP\u00a01.5M");
    expect(formatCurrencyCompact(2500000, "COP")).toBe("COP\u00a02.5M");
    expect(formatCurrencyCompact(1750000, "COP")).toBe("COP\u00a01.75M");
    expect(formatCurrencyCompact(1500, "COP")).toBe("COP\u00a01.5K");
  });

  it("falls back to a formatted zero for unparseable input", () => {
    expect(formatCurrencyCompact("", "USD")).toBe("$0.00");
  });
});

describe("parseAmountInput", () => {
  it("returns an empty value when there is nothing numeric to parse", () => {
    expect(parseAmountInput("")).toEqual({
      normalizedValue: "",
      decimalSeparator: null,
    });
    expect(parseAmountInput("abc")).toEqual({
      normalizedValue: "",
      decimalSeparator: null,
    });
  });

  it("strips currency symbols and whitespace", () => {
    expect(parseAmountInput("$ 1,234.56").normalizedValue).toBe("1234.56");
  });

  it("reads a dot as the decimal separator when it is followed by 1-2 digits", () => {
    expect(parseAmountInput("12.3")).toEqual({
      normalizedValue: "12.3",
      decimalSeparator: ".",
    });
    expect(parseAmountInput("12.34")).toEqual({
      normalizedValue: "12.34",
      decimalSeparator: ".",
    });
  });

  it("reads a comma as the decimal separator and normalizes it to a dot", () => {
    expect(parseAmountInput("1.234,56")).toEqual({
      normalizedValue: "1234.56",
      decimalSeparator: ",",
    });
  });

  it("treats a lone separator followed by exactly three digits as a thousands group", () => {
    expect(parseAmountInput("1.234")).toEqual({
      normalizedValue: "1234",
      decimalSeparator: null,
    });
    expect(parseAmountInput("1,234")).toEqual({
      normalizedValue: "1234",
      decimalSeparator: null,
    });
  });

  it("keeps a trailing separator so the user can carry on typing decimals", () => {
    expect(parseAmountInput("1234.")).toEqual({
      normalizedValue: "1234.",
      decimalSeparator: ".",
    });
  });

  it("supplies a leading zero when the amount starts with a separator", () => {
    expect(parseAmountInput(".5")).toEqual({
      normalizedValue: "0.5",
      decimalSeparator: ".",
    });
  });

  it("preserves leading zeros in the integer part", () => {
    expect(parseAmountInput("007").normalizedValue).toBe("007");
  });

  it("falls back to the caller's separator when the input is ambiguous", () => {
    expect(parseAmountInput("1,234", ",")).toEqual({
      normalizedValue: "1.234",
      decimalSeparator: ",",
    });
  });

  it("ignores a fallback separator that is absent from the input", () => {
    expect(parseAmountInput("1234", ",")).toEqual({
      normalizedValue: "1234",
      decimalSeparator: null,
    });
  });

  it("does not reinterpret a decimal as thousands when a third decimal digit is typed", () => {
    expect(parseAmountInput("12.345", ".").normalizedValue).toBe("12.345");
    expect(parseAmountInput("12,345", ",").normalizedValue).toBe("12.345");
  });

  it("reads a separator as a decimal when the integer part is not validly grouped", () => {
    expect(parseAmountInput("1234.567")).toEqual({
      normalizedValue: "1234.567",
      decimalSeparator: ".",
    });
    expect(parseAmountInput("0.345")).toEqual({
      normalizedValue: "0.345",
      decimalSeparator: ".",
    });
    expect(parseAmountInput(".345")).toEqual({
      normalizedValue: "0.345",
      decimalSeparator: ".",
    });
  });

  it("keeps the decimal of a mixed-separator amount with three decimal digits", () => {
    expect(parseAmountInput("1,234.567").normalizedValue).toBe("1234.567");
    expect(parseAmountInput("1.234,567").normalizedValue).toBe("1234.567");
  });

  it("still strips a digit appended to a thousands group", () => {
    expect(parseAmountInput("1,2345").normalizedValue).toBe("12345");
    expect(parseAmountInput("12,3456").normalizedValue).toBe("123456");
    expect(parseAmountInput("1,234,5678").normalizedValue).toBe("12345678");
  });

  it("reads a shape-ambiguous amount as thousands when the caller tracks no separator", () => {
    // "12.345" is shaped like both 12345 grouped and 12.345 decimal; only the
    // caller's tracked separator can break the tie, and there is none here.
    expect(parseAmountInput("12.345").normalizedValue).toBe("12345");
  });
});

describe("initialDecimalSeparator", () => {
  it("tracks a dot for stored values that carry a fraction", () => {
    expect(initialDecimalSeparator("12.34")).toBe(".");
    expect(initialDecimalSeparator("1234")).toBe(null);
    expect(initialDecimalSeparator("")).toBe(null);
  });
});

describe("formatAmountDisplay", () => {
  it("returns an empty string for empty input", () => {
    expect(formatAmountDisplay("")).toBe("");
  });

  it("groups thousands", () => {
    expect(formatAmountDisplay("10000000")).toBe("10,000,000");
  });

  it("normalizes leading zeros away", () => {
    expect(formatAmountDisplay("007")).toBe("7");
  });

  it("renders the decimal part with the requested separator", () => {
    expect(formatAmountDisplay("1234.5", ",")).toBe("1,234,5");
    expect(formatAmountDisplay("1234.50", ".")).toBe("1,234.50");
  });

  it("defaults to a dot when no separator is supplied", () => {
    expect(formatAmountDisplay("1234.5")).toBe("1,234.5");
  });

  it("keeps a trailing separator", () => {
    expect(formatAmountDisplay("1234.", ",")).toBe("1,234,");
    expect(formatAmountDisplay(".5", ".")).toBe(".5");
  });

  it("preserves trailing zeros after the decimal", () => {
    expect(formatAmountDisplay("1.10", ".")).toBe("1.10");
  });
});

describe("parse/format round trip", () => {
  const cases = ["1234.56", "0.5", "1000000", "1234.", "99"];

  it.each(cases)("re-parses its own display output unchanged (%s)", (raw) => {
    const display = formatAmountDisplay(raw, ".");
    expect(parseAmountInput(display, ".").normalizedValue).toBe(raw);
  });

  it("round-trips comma-separated display back to a dot-normalized value", () => {
    const display = formatAmountDisplay("1234.56", ",");
    expect(parseAmountInput(display, ",").normalizedValue).toBe("1234.56");
  });
});

describe("typing keystroke by keystroke", () => {
  /** Mirrors the amount inputs: display the value, append a key, re-parse. */
  function type(keystrokes: string, from = ""): string {
    let value = from;
    let separator = initialDecimalSeparator(from);
    for (const key of keystrokes) {
      const parsed = parseAmountInput(
        formatAmountDisplay(value, separator) + key,
        separator,
      );
      value = parsed.normalizedValue;
      separator = parsed.decimalSeparator;
    }
    return value;
  }

  it("keeps three decimal digits in a dot locale", () => {
    expect(type("12.3")).toBe("12.3");
    expect(type("12.34")).toBe("12.34");
    expect(type("12.345")).toBe("12.345");
    expect(type("1234.567")).toBe("1234.567");
  });

  it("keeps three decimal digits in a comma locale", () => {
    expect(type("12,34")).toBe("12.34");
    expect(type("12,345")).toBe("12.345");
    expect(type("1234,567")).toBe("1234.567");
  });

  it("keeps whole amounts whole past the grouping boundary", () => {
    expect(type("1234")).toBe("1234");
    expect(type("12345")).toBe("12345");
    expect(type("123456")).toBe("123456");
    expect(type("12345678")).toBe("12345678");
  });

  it("appends to a stored fractional amount instead of multiplying it by 1000", () => {
    expect(type("5", "12.34")).toBe("12.345");
    expect(type("9", "1234.5")).toBe("1234.59");
  });

  it("reads a genuine thousands-grouped paste in a comma locale as thousands", () => {
    expect(parseAmountInput("1.234", ",").normalizedValue).toBe("1234");
    expect(parseAmountInput("1.234.567", ",").normalizedValue).toBe("1234567");
  });
});

describe("parseStoredAmount", () => {
  it("parses decimal strings as stored by the numeric columns", () => {
    expect(parseStoredAmount("1234.56")).toBe(1234.56);
    expect(parseStoredAmount("0.00")).toBe(0);
    expect(parseStoredAmount("-42.5")).toBe(-42.5);
  });

  it("returns NaN for values that are not numeric", () => {
    expect(parseStoredAmount("")).toBeNaN();
    expect(parseStoredAmount("abc")).toBeNaN();
  });

  it("returns NaN rather than Infinity", () => {
    expect(parseStoredAmount("Infinity")).toBeNaN();
  });
});

describe("getAmountInputLength", () => {
  it("counts digits only", () => {
    expect(getAmountInputLength("1,234.56")).toBe(6);
    expect(getAmountInputLength("")).toBe(0);
  });
});

describe("calculatePercentage", () => {
  it("computes a rounded whole percentage", () => {
    expect(calculatePercentage(50, 200)).toBe(25);
    expect(calculatePercentage(1, 3)).toBe(33);
    expect(calculatePercentage(2, 3)).toBe(67);
  });

  it("returns 0 instead of dividing by zero", () => {
    expect(calculatePercentage(100, 0)).toBe(0);
    expect(calculatePercentage(0, 0)).toBe(0);
  });

  it("allows over- and under-spend past the bounds", () => {
    expect(calculatePercentage(300, 200)).toBe(150);
    expect(calculatePercentage(-50, 200)).toBe(-25);
  });
});

describe("calculateBucketTarget", () => {
  it("applies the 50/30/20 split to a monthly income", () => {
    expect(calculateBucketTarget(5000, 50)).toBe(2500);
    expect(calculateBucketTarget(5000, 30)).toBe(1500);
    expect(calculateBucketTarget(5000, 20)).toBe(1000);
  });

  it("returns zero targets for zero income", () => {
    expect(calculateBucketTarget(0, 50)).toBe(0);
    expect(calculateBucketTarget(0, 0)).toBe(0);
  });

  it("returns zero for a zero-percentage bucket", () => {
    expect(calculateBucketTarget(5000, 0)).toBe(0);
  });

  it("keeps the three default buckets summing to the whole income", () => {
    const income = 4321.87;
    const total = (["needs", "wants", "future"] as const).reduce(
      (sum, bucket) =>
        sum +
        calculateBucketTarget(income, BUCKET_DEFINITIONS[bucket].defaultPercentage),
      0,
    );
    expect(total).toBeCloseTo(income, 10);
  });

  it("displays the default split of a large zero-decimal income without rounding it up", () => {
    const income = 3_000_000;
    const displayed = (["needs", "wants", "future"] as const).map((bucket) =>
      formatCurrencyCompact(
        calculateBucketTarget(income, BUCKET_DEFINITIONS[bucket].defaultPercentage),
        "COP",
      ),
    );
    expect(displayed).toEqual([
      "COP\u00a01.5M",
      "COP\u00a0900K",
      "COP\u00a0600K",
    ]);
  });
});

describe("getBucketColor", () => {
  it("returns the bucket's colour", () => {
    expect(getBucketColor("needs")).toBe(BUCKET_DEFINITIONS.needs.color);
  });

  it("returns a neutral token for an unbucketed row", () => {
    expect(getBucketColor(null)).toBe("var(--muted-foreground)");
  });

  it("returns theme tokens, never literals, so colours follow the theme", () => {
    for (const bucket of BUCKET_ORDER) {
      expect(getBucketColor(bucket)).toMatch(/^var\(--bucket-[a-z]+\)$/);
    }
    expect(getTransactionColor("income")).toBe("var(--income)");
    expect(getTransactionColor("expense")).toBe("var(--expense)");
  });
});

describe("withAlpha", () => {
  it("keeps the token reference intact instead of splicing a hex suffix", () => {
    expect(withAlpha("var(--income)", 15)).toBe(
      "color-mix(in srgb, var(--income) 15%, transparent)",
    );
  });
});
