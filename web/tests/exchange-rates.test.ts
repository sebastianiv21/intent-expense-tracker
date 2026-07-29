import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { getOrFetchExchangeRate } from "@/lib/exchange-rates";

// The module under test only ever runs `select(...).limit(1)` and
// `insert(...).values(...).onConflictDoNothing()`, so the fake exposes exactly that much
// of the drizzle builder and serves `selectResults` in call order.
const state = vi.hoisted(() => ({
  selectResults: [] as Record<string, unknown>[][],
  inserted: [] as Record<string, unknown>[],
  selectCalls: 0,
}));

vi.mock("@/lib/db", () => ({
  db: {
    select() {
      state.selectCalls += 1;
      const builder = {
        from: () => builder,
        where: () => builder,
        orderBy: () => builder,
        limit: async () => state.selectResults.shift() ?? [],
      };
      return builder;
    },
    insert: () => ({
      values: (row: Record<string, unknown>) => ({
        onConflictDoNothing: async () => {
          state.inserted.push(row);
        },
      }),
    }),
  },
}));

function jsonResponse(body: unknown, ok = true, status = 200) {
  return { ok, status, json: async () => body } as unknown as Response;
}

const fetchMock = vi.fn();

beforeEach(() => {
  state.selectResults = [];
  state.inserted = [];
  state.selectCalls = 0;
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("getOrFetchExchangeRate — same currency", () => {
  it("returns 1 without touching the database or the network", async () => {
    await expect(getOrFetchExchangeRate("USD", "USD", "2026-03-15")).resolves.toBe(1);
    expect(state.selectCalls).toBe(0);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("normalizes case before comparing", async () => {
    await expect(getOrFetchExchangeRate("usd", "USD", "2026-03-15")).resolves.toBe(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe("getOrFetchExchangeRate — cache hit", () => {
  it("returns the cached rate as a number and does not fetch", async () => {
    state.selectResults.push([{ rate: "4012.345678" }]);

    await expect(
      getOrFetchExchangeRate("USD", "COP", "2026-03-15"),
    ).resolves.toBe(4012.345678);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(state.inserted).toEqual([]);
  });
});

describe("getOrFetchExchangeRate — fetch path", () => {
  it("fetches the dated endpoint for the source currency", async () => {
    state.selectResults.push([]);
    fetchMock.mockResolvedValue(jsonResponse({ usd: { cop: 4000 } }));

    await expect(
      getOrFetchExchangeRate("usd", "cop", "2026-03-15"),
    ).resolves.toBe(4000);
    expect(fetchMock).toHaveBeenCalledWith(
      "https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@2026-03-15/v1/currencies/usd.json",
    );
  });

  it("caches the fetched rate under the normalized pair at full precision", async () => {
    state.selectResults.push([]);
    fetchMock.mockResolvedValue(jsonResponse({ usd: { cop: 4012.345678 } }));

    await getOrFetchExchangeRate("usd", "cop", "2026-03-15");

    expect(state.inserted).toEqual([
      {
        fromCurrency: "USD",
        toCurrency: "COP",
        rateDate: "2026-03-15",
        rate: "4012.345678",
      },
    ]);
  });

  it("accepts a rate of zero from the upstream payload", async () => {
    state.selectResults.push([]);
    fetchMock.mockResolvedValue(jsonResponse({ usd: { cop: 0 } }));

    await expect(
      getOrFetchExchangeRate("USD", "COP", "2026-03-15"),
    ).resolves.toBe(0);
  });
});

describe("getOrFetchExchangeRate — upstream failure", () => {
  it("falls back to the most recent cached rate for the pair", async () => {
    state.selectResults.push([], [{ rate: "3950.5" }]);
    fetchMock.mockResolvedValue(jsonResponse({}, false, 404));

    await expect(
      getOrFetchExchangeRate("USD", "COP", "2026-03-15"),
    ).resolves.toBe(3950.5);
  });

  it("does not write the stale fallback rate under the requested date", async () => {
    state.selectResults.push([], [{ rate: "3950.5" }]);
    fetchMock.mockResolvedValue(jsonResponse({}, false, 500));

    await getOrFetchExchangeRate("USD", "COP", "2026-03-15");
    expect(state.inserted).toEqual([]);
  });

  it("falls back when the network call itself rejects", async () => {
    state.selectResults.push([], [{ rate: "3900" }]);
    fetchMock.mockRejectedValue(new Error("ECONNRESET"));

    await expect(
      getOrFetchExchangeRate("USD", "COP", "2026-03-15"),
    ).resolves.toBe(3900);
  });

  it("falls back when the payload has no rate for the target currency", async () => {
    state.selectResults.push([], [{ rate: "3900" }]);
    fetchMock.mockResolvedValue(jsonResponse({ usd: { eur: 0.9 } }));

    await expect(
      getOrFetchExchangeRate("USD", "COP", "2026-03-15"),
    ).resolves.toBe(3900);
  });

  it("throws when there is no cached rate to fall back to", async () => {
    state.selectResults.push([], []);
    fetchMock.mockResolvedValue(jsonResponse({}, false, 404));

    await expect(
      getOrFetchExchangeRate("USD", "COP", "2026-03-15"),
    ).rejects.toThrow("HTTP 404");
  });

  it("reports a missing pair rather than an HTTP failure when the payload is incomplete", async () => {
    state.selectResults.push([], []);
    fetchMock.mockResolvedValue(jsonResponse({ usd: { eur: 0.9 } }));

    await expect(
      getOrFetchExchangeRate("USD", "COP", "2026-03-15"),
    ).rejects.toThrow("Rate not found in API response for USD/COP on 2026-03-15");
  });
});
