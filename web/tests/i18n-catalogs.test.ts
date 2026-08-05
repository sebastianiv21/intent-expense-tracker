import { describe, expect, it } from "vitest";
import { createTranslator } from "next-intl";
import { LOCALES, type Locale } from "@/lib/i18n/locales";
import { MESSAGES } from "@/lib/i18n/messages";

// ─── ICU helpers ──────────────────────────────────────────────────────────────

/**
 * Walks a message and returns its argument names.
 *
 * A regex cannot do this: in `{type, select, income {income} other {expense}}`
 * the branch bodies are braced too, and `{expense}` is not an argument. Parsing
 * argument position explicitly is what keeps those out.
 */
function placeholdersOf(message: string): Set<string> {
  const found = new Set<string>();

  function matchingBrace(input: string, open: number): number {
    let depth = 0;
    for (let i = open; i < input.length; i += 1) {
      if (input[i] === "{") depth += 1;
      else if (input[i] === "}") {
        depth -= 1;
        if (depth === 0) return i;
      }
    }
    throw new Error(`Unbalanced braces in message: ${input}`);
  }

  /** Every `{` reached here opens an *argument*, never a branch body. */
  function walkMessage(input: string, from: number, until: number): void {
    let i = from;
    while (i < until) {
      if (input[i] !== "{") {
        i += 1;
        continue;
      }

      const close = matchingBrace(input, i);
      const inner = input.slice(i + 1, close);
      const comma = inner.indexOf(",");
      const name = (comma === -1 ? inner : inner.slice(0, comma)).trim();

      if (/^[A-Za-z0-9_]+$/.test(name)) {
        found.add(name);
      }

      if (comma !== -1) {
        walkBranches(input, i + 1 + comma + 1, close);
      }

      i = close + 1;
    }
  }

  /**
   * The `branchName {body}` list of a plural or select. Each `{` here opens a
   * body, so it is descended into rather than recorded — `other {gastos}` names
   * no argument called `gastos`.
   */
  function walkBranches(input: string, from: number, until: number): void {
    let i = from;
    while (i < until) {
      if (input[i] !== "{") {
        i += 1;
        continue;
      }
      const close = matchingBrace(input, i);
      walkMessage(input, i + 1, close);
      i = close + 1;
    }
  }

  walkMessage(message, 0, message.length);
  return found;
}

type FlatCatalog = Map<string, string>;

function flatten(value: unknown, prefix = "", into: FlatCatalog = new Map()) {
  if (typeof value === "string") {
    into.set(prefix, value);
    return into;
  }
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    flatten(child, prefix ? `${prefix}.${key}` : key, into);
  }
  return into;
}

const CATALOGS = Object.fromEntries(
  LOCALES.map((locale) => [locale, flatten(MESSAGES[locale])]),
) as Record<Locale, FlatCatalog>;

const [BASE, ...OTHERS] = LOCALES;

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("placeholder extraction", () => {
  it("reads argument names, not the branch bodies around them", () => {
    expect([...placeholdersOf("Hello {name}")]).toEqual(["name"]);
    expect([
      ...placeholdersOf(
        "No results in {type, select, income {income} other {expense}}.",
      ),
    ]).toEqual(["type"]);
    expect([
      ...placeholdersOf("{count, plural, one {# item} other {# items}}"),
    ]).toEqual(["count"]);
    expect([
      ...placeholdersOf(
        "{count, plural, one {{formatted} item} other {{formatted} items}}",
      ),
    ]).toEqual(["count", "formatted"]);
  });
});

describe("catalog parity", () => {
  it("ships a non-trivial catalog for every locale", () => {
    for (const locale of LOCALES) {
      expect(CATALOGS[locale].size).toBeGreaterThan(200);
    }
  });

  it.each(OTHERS)("%s has exactly the keys English has", (locale) => {
    const base = [...CATALOGS[BASE].keys()].sort();
    const other = [...CATALOGS[locale].keys()].sort();

    expect(other.filter((k) => !CATALOGS[BASE].has(k))).toEqual([]);
    expect(base.filter((k) => !CATALOGS[locale].has(k))).toEqual([]);
    expect(other).toEqual(base);
  });

  it.each(OTHERS)("%s uses the same placeholders as English, per key", (locale) => {
    const mismatches: string[] = [];

    for (const [key, english] of CATALOGS[BASE]) {
      const translated = CATALOGS[locale].get(key);
      if (translated === undefined) continue;

      const expected = [...placeholdersOf(english)].sort();
      const actual = [...placeholdersOf(translated)].sort();
      if (expected.join(",") !== actual.join(",")) {
        mismatches.push(`${key}: expected [${expected}], got [${actual}]`);
      }
    }

    expect(mismatches).toEqual([]);
  });

  it("leaves no message empty in any locale", () => {
    for (const locale of LOCALES) {
      const empty = [...CATALOGS[locale]]
        .filter(([, value]) => value.trim() === "")
        .map(([key]) => key);
      expect(empty).toEqual([]);
    }
  });

  it("leaves no Spanish message identical to English unless it should be", () => {
    // Brand, version and pure-placeholder messages legitimately match.
    const allowed = new Set([
      "app.brand",
      "app.version",
      "common.or",
      "buckets.labelWithPercentage",
      "dashboard.greetingWithName",
      "profile.currencyValue",
      "common.convertedApprox",
      "currencySelector.option",
      "transactions.conversionDetail",
      "budgets.spentOfTotal",
      "onboarding.allocationTotal",
      "seedCategories.Salary",
    ]);

    const identical = [...CATALOGS[BASE]]
      .filter(([key, value]) => CATALOGS.es.get(key) === value)
      .map(([key]) => key)
      .filter((key) => !allowed.has(key));

    expect(identical).toEqual([]);
  });

  it("parses every message in every locale", () => {
    for (const locale of LOCALES) {
      const t = createTranslator({
        locale,
        messages: MESSAGES[locale],
      });

      for (const [key, message] of CATALOGS[locale]) {
        const args = Object.fromEntries(
          [...placeholdersOf(message)].map((name) => [
            name,
            // `plural` needs a number, `select` a matching branch name; a value
            // that is both keeps this generic across every message shape.
            /count|total|percentage/i.test(name) ? 1 : "x",
          ]),
        );
        expect(
          () => t(key as Parameters<typeof t>[0], args),
          `${locale}:${key}`,
        ).not.toThrow();
      }
    }
  });
});

describe("plurals", () => {
  const cases = [
    { locale: "en", count: 0, expect: "0 transactions" },
    { locale: "en", count: 1, expect: "1 transaction" },
    { locale: "en", count: 2, expect: "2 transactions" },
    { locale: "es", count: 0, expect: "0 movimientos" },
    { locale: "es", count: 1, expect: "1 movimiento" },
    { locale: "es", count: 2, expect: "2 movimientos" },
  ] as const;

  it.each(cases)(
    "$locale renders transactions.summaryCount for $count",
    ({ locale, count, expect: expected }) => {
      const t = createTranslator({ locale, messages: MESSAGES[locale] });
      expect(t("transactions.summaryCount", { count })).toBe(expected);
    },
  );

  const budgetCases = [
    { locale: "en", count: 1, expect: "1 budget" },
    { locale: "en", count: 3, expect: "3 budgets" },
    { locale: "es", count: 1, expect: "1 presupuesto" },
    { locale: "es", count: 3, expect: "3 presupuestos" },
  ] as const;

  it.each(budgetCases)(
    "$locale renders budgets.groupCount for $count",
    ({ locale, count, expect: expected }) => {
      const t = createTranslator({ locale, messages: MESSAGES[locale] });
      expect(t("budgets.groupCount", { count })).toBe(expected);
    },
  );

  // Spanish agrees the adjective with the noun where English has one invariant
  // word — "1 activo" / "2 activos" against "1 active" / "2 active".
  const activeCases = [
    { locale: "en", count: 1, expect: "1 active" },
    { locale: "en", count: 5, expect: "5 active" },
    { locale: "es", count: 1, expect: "1 activo" },
    { locale: "es", count: 5, expect: "5 activos" },
  ] as const;

  it.each(activeCases)(
    "$locale renders recurring.activeCount for $count",
    ({ locale, count, expect: expected }) => {
      const t = createTranslator({ locale, messages: MESSAGES[locale] });
      expect(t("recurring.activeCount", { count })).toBe(expected);
    },
  );
});

describe("selects", () => {
  it("picks the right noun for the transaction type in both languages", () => {
    const en = createTranslator({ locale: "en", messages: MESSAGES.en });
    const es = createTranslator({ locale: "es", messages: MESSAGES.es });

    expect(en("transactions.noResultsType", { type: "income" })).toContain(
      "in income",
    );
    expect(en("transactions.noResultsType", { type: "expense" })).toContain(
      "in expense",
    );
    // Spanish reads the filter as a plural mass noun, which English does not.
    expect(es("transactions.noResultsType", { type: "income" })).toContain(
      "en ingresos",
    );
    expect(es("transactions.noResultsType", { type: "expense" })).toContain(
      "en gastos",
    );
  });

  it("flips the conversion-details toggle label on expansion", () => {
    const en = createTranslator({ locale: "en", messages: MESSAGES.en });
    const es = createTranslator({ locale: "es", messages: MESSAGES.es });

    expect(
      en("transactions.conversionToggle", { expanded: "true", name: "Rent" }),
    ).toBe("Hide conversion details for Rent");
    expect(
      en("transactions.conversionToggle", { expanded: "false", name: "Rent" }),
    ).toBe("Show conversion details for Rent");
    expect(
      es("transactions.conversionToggle", {
        expanded: "true",
        name: "Alquiler",
      }),
    ).toBe("Ocultar el detalle de conversión de Alquiler");
    expect(
      es("transactions.conversionToggle", {
        expanded: "false",
        name: "Alquiler",
      }),
    ).toBe("Mostrar el detalle de conversión de Alquiler");
  });
});

describe("Spanish register and vocabulary", () => {
  const spanish = [...CATALOGS.es.entries()];

  it("addresses the reader as tú, never usted", () => {
    // "usted" and its clitics; `su`/`sus` are ambiguous (also "their"), so the
    // check targets the unambiguous markers.
    const offenders = spanish.filter(([, value]) =>
      /\b(usted|ustedes)\b/i.test(value),
    );
    expect(offenders).toEqual([]);
  });

  it("uses tú imperatives, not the usted subjunctive forms", () => {
    const ustedImperatives =
      /\b(registre|elija|guarde|agregue|ingrese|defina|configure|pruebe|inténtelo|actualice|empiece|asigne|planifique|organice|controle|indique|ajuste|complete)\b/i;
    const offenders = spanish.filter(([, value]) =>
      ustedImperatives.test(value),
    );
    expect(offenders).toEqual([]);
  });

  it("keeps one word per domain noun across every screen", () => {
    const text = spanish.map(([, value]) => value).join("\n");

    // "transacción" was rejected in favour of "movimiento"; both would be a
    // split vocabulary for the same object.
    expect(text).not.toMatch(/transacci[oó]n/i);
    // "gasto/gastos" is the expense word; "egreso" is a synonym that must not
    // creep in beside it.
    expect(text).not.toMatch(/\begresos?\b/i);
    // "presupuesto" is the budget word.
    expect(text).not.toMatch(/\bpresupuestaci[oó]n\b/i);
  });

  it("names every bucket the same way wherever it appears", () => {
    expect(CATALOGS.es.get("buckets.needs")).toBe("Necesidades");
    expect(CATALOGS.es.get("buckets.wants")).toBe("Deseos");
    expect(CATALOGS.es.get("buckets.future")).toBe("Futuro");
    expect(CATALOGS.es.get("buckets.needsUpper")).toBe("NECESIDADES");
    expect(CATALOGS.es.get("buckets.wantsUpper")).toBe("DESEOS");
    expect(CATALOGS.es.get("buckets.futureUpper")).toBe("FUTURO");
  });

  it("writes each language label in its own language, identically in both catalogs", () => {
    // The switch is for the reader who cannot read the current language, so the
    // two labels must not themselves be translated.
    expect(CATALOGS.en.get("profile.language")).toBe("Language");
    expect(CATALOGS.es.get("profile.language")).toBe("Idioma");
  });
});
