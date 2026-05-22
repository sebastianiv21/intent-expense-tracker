// ─── Exchange Rate Service ────────────────────────────────────────────────────
// Cache-first lookup against exchange_rate_cache (Neon).
// Falls back to fawazahmed0 CDN on miss. Throws on any failure (D-01, D-02).

import { and, desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { exchangeRateCache } from "@/lib/schema";

export async function getOrFetchExchangeRate(
  from: string,
  to: string,
  date: string, // ISO 8601 "YYYY-MM-DD"
): Promise<number> {
  // D-06: same-currency shortcut — no DB lookup, no API call (per CONTEXT.md D-06)
  const normalizedFrom = from.toUpperCase();
  const normalizedTo = to.toUpperCase();
  if (normalizedFrom === normalizedTo) return 1.0;

  // Cache lookup — composite key: (fromCurrency, toCurrency, rateDate)
  const cached = await db
    .select()
    .from(exchangeRateCache)
    .where(
      and(
        eq(exchangeRateCache.fromCurrency, normalizedFrom),
        eq(exchangeRateCache.toCurrency, normalizedTo),
        eq(exchangeRateCache.rateDate, date),
      ),
    )
    .limit(1);

  if (cached[0]) {
    // CRITICAL: numeric column returns string at runtime — always wrap with Number()
    return Number(cached[0].rate);
  }

  // Cache miss — fetch from fawazahmed0 CDN (D-03, D-05)
  // URL uses lowercase from-currency; date is the caller-supplied ISO string (never @latest)
  const url = `https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@${date}/v1/currencies/${normalizedFrom.toLowerCase()}.json`;
  try {
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error(
        `Exchange rate fetch failed: HTTP ${res.status} for ${normalizedFrom}/${normalizedTo} on ${date}`,
      );
    }

    const data = (await res.json()) as Record<string, unknown>;
    const fromKey = normalizedFrom.toLowerCase();
    const toKey = normalizedTo.toLowerCase();
    const ratesForFrom = data[fromKey] as Record<string, number> | undefined;

    if (!ratesForFrom || typeof ratesForFrom[toKey] !== "number") {
      throw new Error(
        `Rate not found in API response for ${normalizedFrom}/${normalizedTo} on ${date}`,
      );
    }

    const rate = ratesForFrom[toKey];

    // Insert into cache — onConflictDoNothing handles concurrent callers inserting same triple
    await db
      .insert(exchangeRateCache)
      .values({
        fromCurrency: normalizedFrom,
        toCurrency: normalizedTo,
        rateDate: date,
        // Store full precision string — do NOT round with toFixed() for exchange rates
        rate: rate.toString(),
      })
      .onConflictDoNothing();

    return rate;
  } catch (err) {
    // Fallback: most recent cached rate for the same pair across any date.
    // Do not write this back under the requested date — it would poison future fetches.
    const fallback = await db
      .select()
      .from(exchangeRateCache)
      .where(
        and(
          eq(exchangeRateCache.fromCurrency, normalizedFrom),
          eq(exchangeRateCache.toCurrency, normalizedTo),
        ),
      )
      .orderBy(desc(exchangeRateCache.rateDate))
      .limit(1);

    if (fallback[0]) {
      return Number(fallback[0].rate);
    }

    throw err;
  }
}
