/**
 * Phase 2 verification script — run with: npx tsx verify-phase2.ts
 * Confirms all four success criteria for the exchange rate service.
 */
import { getOrFetchExchangeRate } from "./lib/exchange-rates";

async function main() {
  // SC-4: Same-currency shortcut (no I/O, proves the function loads)
  const sc4 = await getOrFetchExchangeRate("USD", "USD", "2026-04-15");
  console.log("SC-4 USD/USD:", sc4);
  console.log("SC-4:", sc4 === 1.0 ? "PASS" : `FAIL — expected 1.0, got ${sc4}`);

  // SC-1: COP→USD direction (should be ~0.000278, not ~4100)
  const sc1 = await getOrFetchExchangeRate("COP", "USD", "2026-04-15");
  console.log("\nSC-1 COP/USD rate:", sc1);
  console.log("SC-1:", sc1 < 0.001 ? "PASS" : `FAIL — expected < 0.001, got ${sc1}`);

  // SC-2: Cache hit — same call again, should return same value from DB
  const sc2 = await getOrFetchExchangeRate("COP", "USD", "2026-04-15");
  console.log("\nSC-2 cache hit:", sc2);
  console.log("SC-2:", sc2 === sc1 ? "PASS" : `FAIL — expected ${sc1}, got ${sc2}`);

  // SC-3: New date — should fetch from API and insert a new row
  const sc3 = await getOrFetchExchangeRate("COP", "USD", "2026-04-10");
  console.log("\nSC-3 COP/USD 2026-04-10:", sc3);
  console.log("SC-3:", sc3 > 0 ? "PASS" : `FAIL — expected > 0, got ${sc3}`);

  console.log("\n---");
  const allPass = sc4 === 1.0 && sc1 < 0.001 && sc2 === sc1 && sc3 > 0;
  console.log(allPass ? "✓ All four criteria PASS" : "✗ One or more criteria FAILED");
}

main().catch(console.error);
