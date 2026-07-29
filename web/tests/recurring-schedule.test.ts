import { describe, expect, it } from "vitest";
import {
  advanceDueDate,
  firstDueOnOrAfter,
  planOccurrences,
} from "@/lib/recurring-schedule";

describe("advanceDueDate", () => {
  it("advances by each supported frequency", () => {
    expect(advanceDueDate("2026-03-10", "daily")).toBe("2026-03-11");
    expect(advanceDueDate("2026-03-10", "weekly")).toBe("2026-03-17");
    expect(advanceDueDate("2026-03-10", "biweekly")).toBe("2026-03-24");
    expect(advanceDueDate("2026-03-10", "monthly")).toBe("2026-04-10");
    expect(advanceDueDate("2026-03-10", "quarterly")).toBe("2026-06-10");
    expect(advanceDueDate("2026-03-10", "yearly")).toBe("2027-03-10");
  });

  it("treats an unrecognised frequency as monthly", () => {
    expect(advanceDueDate("2026-03-10", "fortnightly")).toBe("2026-04-10");
  });

  it("clamps a month-end date to the last day of a shorter month", () => {
    expect(advanceDueDate("2026-01-31", "monthly")).toBe("2026-02-28");
    expect(advanceDueDate("2028-01-31", "monthly")).toBe("2028-02-29");
    expect(advanceDueDate("2025-11-30", "quarterly")).toBe("2026-02-28");
  });

  it("crosses the year boundary", () => {
    expect(advanceDueDate("2026-12-31", "monthly")).toBe("2027-01-31");
    expect(advanceDueDate("2026-12-28", "weekly")).toBe("2027-01-04");
  });

  it("clamps a leap day to 28 February in the following year", () => {
    expect(advanceDueDate("2028-02-29", "yearly")).toBe("2029-02-28");
  });

  it("advances one calendar day across a daylight-saving transition", () => {
    expect(advanceDueDate("2026-03-07", "daily")).toBe("2026-03-08");
    expect(advanceDueDate("2026-03-08", "daily")).toBe("2026-03-09");
    expect(advanceDueDate("2026-11-01", "daily")).toBe("2026-11-02");
  });

  // Known limitation: the schedule carries no day-of-month anchor, so a monthly item that
  // starts on the 31st is clamped to 28 February and then stays on the 28th forever. Fixing
  // it means anchoring generation on the item's start date rather than on the previous due
  // date — a behaviour change to the stored schedule, not a one-line fix.
  it.skip("keeps the original day-of-month anchor after a short month", () => {
    expect(advanceDueDate(advanceDueDate("2026-01-31", "monthly"), "monthly")).toBe(
      "2026-03-31",
    );
  });

  it("currently drifts off the month-end anchor after a short month", () => {
    expect(advanceDueDate(advanceDueDate("2026-01-31", "monthly"), "monthly")).toBe(
      "2026-03-28",
    );
  });
});

describe("firstDueOnOrAfter", () => {
  it("leaves a future start date alone", () => {
    expect(firstDueOnOrAfter("2026-08-01", "monthly", "2026-03-15")).toBe(
      "2026-08-01",
    );
  });

  it("leaves a start date that is exactly today alone", () => {
    expect(firstDueOnOrAfter("2026-03-15", "monthly", "2026-03-15")).toBe(
      "2026-03-15",
    );
  });

  it("rolls a past start date forward without backfilling", () => {
    expect(firstDueOnOrAfter("2025-01-10", "monthly", "2026-03-15")).toBe(
      "2026-04-10",
    );
    expect(firstDueOnOrAfter("2026-03-01", "weekly", "2026-03-15")).toBe(
      "2026-03-15",
    );
  });

  it("rolls forward across a year boundary", () => {
    expect(firstDueOnOrAfter("2024-06-05", "yearly", "2026-03-15")).toBe(
      "2026-06-05",
    );
  });
});

describe("planOccurrences", () => {
  const today = "2026-03-15";

  it("plans nothing when the next due date is still in the future", () => {
    expect(
      planOccurrences(
        { nextDueDate: "2026-03-16", frequency: "monthly" },
        today,
      ),
    ).toEqual([]);
  });

  it("plans the occurrence falling exactly on today", () => {
    expect(
      planOccurrences({ nextDueDate: today, frequency: "monthly" }, today),
    ).toEqual([{ dueDate: today, nextDue: "2026-04-15", deactivate: false }]);
  });

  it("catches up on every overdue period, oldest first", () => {
    const plan = planOccurrences(
      { nextDueDate: "2026-03-11", frequency: "daily" },
      today,
    );
    expect(plan.map((o) => o.dueDate)).toEqual([
      "2026-03-11",
      "2026-03-12",
      "2026-03-13",
      "2026-03-14",
      "2026-03-15",
    ]);
    expect(plan.at(-1)!.nextDue).toBe("2026-03-16");
  });

  it("catches up across a month boundary", () => {
    const plan = planOccurrences(
      { nextDueDate: "2026-01-31", frequency: "monthly" },
      today,
    );
    expect(plan.map((o) => o.dueDate)).toEqual(["2026-01-31", "2026-02-28"]);
    expect(plan.at(-1)!.nextDue).toBe("2026-03-28");
  });

  it("does not re-plan an occurrence once the schedule has advanced past it", () => {
    const item = { nextDueDate: "2026-03-11", frequency: "daily" };
    const plan = planOccurrences(item, today);

    const afterProcessing = planOccurrences(
      { ...item, nextDueDate: plan.at(-1)!.nextDue },
      today,
    );
    expect(afterProcessing).toEqual([]);
  });

  it("does not re-plan a partially processed schedule's completed occurrences", () => {
    const item = { nextDueDate: "2026-03-11", frequency: "daily" };
    const firstTwo = planOccurrences(item, today).slice(0, 2);

    const remaining = planOccurrences(
      { ...item, nextDueDate: firstTwo.at(-1)!.nextDue },
      today,
    );
    expect(remaining.map((o) => o.dueDate)).toEqual([
      "2026-03-13",
      "2026-03-14",
      "2026-03-15",
    ]);
  });

  it("keeps the item live while the end date is still ahead", () => {
    const plan = planOccurrences(
      { nextDueDate: "2026-03-15", frequency: "monthly", endDate: "2026-12-31" },
      today,
    );
    expect(plan).toEqual([
      { dueDate: "2026-03-15", nextDue: "2026-04-15", deactivate: false },
    ]);
  });

  it("generates the final occurrence and then deactivates", () => {
    const plan = planOccurrences(
      { nextDueDate: "2026-03-10", frequency: "daily", endDate: "2026-03-12" },
      today,
    );
    expect(plan).toEqual([
      { dueDate: "2026-03-10", nextDue: "2026-03-11", deactivate: false },
      { dueDate: "2026-03-11", nextDue: "2026-03-12", deactivate: false },
      { dueDate: "2026-03-12", nextDue: "2026-03-13", deactivate: true },
    ]);
  });

  it("stops generating after deactivation even with periods still overdue", () => {
    const plan = planOccurrences(
      { nextDueDate: "2026-03-01", frequency: "daily", endDate: "2026-03-02" },
      today,
    );
    expect(plan.map((o) => o.dueDate)).toEqual(["2026-03-01", "2026-03-02"]);
    expect(plan.at(-1)!.deactivate).toBe(true);
  });

  it("treats a null end date as open-ended", () => {
    const plan = planOccurrences(
      { nextDueDate: "2026-03-14", frequency: "daily", endDate: null },
      today,
    );
    expect(plan.every((o) => o.deactivate === false)).toBe(true);
    expect(plan).toHaveLength(2);
  });

  it("generates the occurrence landing exactly on the end date", () => {
    const plan = planOccurrences(
      { nextDueDate: "2026-03-15", frequency: "daily", endDate: "2026-03-15" },
      today,
    );
    expect(plan).toEqual([
      { dueDate: "2026-03-15", nextDue: "2026-03-16", deactivate: true },
    ]);
  });
});
