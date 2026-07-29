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

  it("keeps the original day-of-month anchor after a short month", () => {
    const anchor = "2026-01-31";
    const february = advanceDueDate(anchor, "monthly", anchor);
    expect(february).toBe("2026-02-28");
    expect(advanceDueDate(february, "monthly", anchor)).toBe("2026-03-31");
  });

  it("holds the 31st anchor across a full year", () => {
    const anchor = "2026-01-31";
    const dates: string[] = [];
    let due = anchor;
    for (let i = 0; i < 12; i += 1) {
      due = advanceDueDate(due, "monthly", anchor);
      dates.push(due);
    }
    expect(dates).toEqual([
      "2026-02-28",
      "2026-03-31",
      "2026-04-30",
      "2026-05-31",
      "2026-06-30",
      "2026-07-31",
      "2026-08-31",
      "2026-09-30",
      "2026-10-31",
      "2026-11-30",
      "2026-12-31",
      "2027-01-31",
    ]);
  });

  it("recovers the anchor from a leap February too", () => {
    const anchor = "2028-01-31";
    const february = advanceDueDate(anchor, "monthly", anchor);
    expect(february).toBe("2028-02-29");
    expect(advanceDueDate(february, "monthly", anchor)).toBe("2028-03-31");
  });

  it("keeps a 29th or 30th anchor through February", () => {
    const thirtieth = "2026-01-30";
    expect(advanceDueDate(thirtieth, "monthly", thirtieth)).toBe("2026-02-28");
    expect(advanceDueDate("2026-02-28", "monthly", thirtieth)).toBe("2026-03-30");

    const twentyNinth = "2026-01-29";
    expect(advanceDueDate(twentyNinth, "monthly", twentyNinth)).toBe("2026-02-28");
    expect(advanceDueDate("2026-02-28", "monthly", twentyNinth)).toBe("2026-03-29");

    // A leap February takes the 29th unclamped, so there is nothing to recover.
    expect(advanceDueDate("2028-01-29", "monthly", "2028-01-29")).toBe("2028-02-29");
  });

  it("keeps the anchor for quarterly and yearly steps", () => {
    expect(advanceDueDate("2025-11-30", "quarterly", "2025-11-30")).toBe(
      "2026-02-28",
    );
    expect(advanceDueDate("2026-02-28", "quarterly", "2025-11-30")).toBe(
      "2026-05-30",
    );

    expect(advanceDueDate("2028-02-29", "yearly", "2028-02-29")).toBe(
      "2029-02-28",
    );
    expect(advanceDueDate("2029-02-28", "yearly", "2028-02-29")).toBe(
      "2030-02-28",
    );
    expect(advanceDueDate("2031-02-28", "yearly", "2028-02-29")).toBe(
      "2032-02-29",
    );
  });

  // Without an anchor the previous due date supplies the day, so a clamped date stays clamped.
  it("falls back to the given date's day when no anchor is supplied", () => {
    expect(advanceDueDate("2026-02-28", "monthly")).toBe("2026-03-28");
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

  it("holds a month-end start date while rolling forward", () => {
    expect(firstDueOnOrAfter("2026-01-31", "monthly", "2026-06-15")).toBe(
      "2026-06-30",
    );
  });

  it("uses an explicit anchor when resuming from a drifted due date", () => {
    expect(
      firstDueOnOrAfter("2026-02-28", "monthly", "2026-06-15", "2026-01-31"),
    ).toBe("2026-06-30");
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
    expect(plan.at(-1)!.nextDue).toBe("2026-03-31");
  });

  it("anchors catch-up on the start date, not the drifted due date", () => {
    const plan = planOccurrences(
      {
        nextDueDate: "2026-02-28",
        frequency: "monthly",
        startDate: "2025-12-31",
      },
      today,
    );
    expect(plan.map((o) => o.dueDate)).toEqual(["2026-02-28"]);
    expect(plan.at(-1)!.nextDue).toBe("2026-03-31");
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
