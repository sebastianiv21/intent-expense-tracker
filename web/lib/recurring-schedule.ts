// Pure schedule arithmetic for recurring transactions. Kept out of lib/actions/recurring.ts
// so it can be exercised without a database — that file is "use server" and may only
// export async functions.

import { addDays, addMonths, addWeeks, addYears, format, parseISO } from "date-fns";

export type RecurrenceFrequency =
  | "daily"
  | "weekly"
  | "biweekly"
  | "monthly"
  | "quarterly"
  | "yearly";

export type ScheduleInput = {
  nextDueDate: string;
  frequency: string;
  endDate?: string | null;
};

export type Occurrence = {
  /** The date the generated transaction is posted under. */
  dueDate: string;
  /** Where the schedule lands after this occurrence. */
  nextDue: string;
  /** True when `nextDue` is past `endDate` and the item should stop recurring. */
  deactivate: boolean;
};

export function computeNextDueDate(date: Date, frequency: string): Date {
  switch (frequency) {
    case "daily":
      return addDays(date, 1);
    case "weekly":
      return addWeeks(date, 1);
    case "biweekly":
      return addWeeks(date, 2);
    case "quarterly":
      return addMonths(date, 3);
    case "yearly":
      return addYears(date, 1);
    default:
      return addMonths(date, 1);
  }
}

// parseISO (local midnight) round-trips stably with format; `new Date(iso)` parses
// as UTC and compounds a ~1-day drift each iteration.
export function advanceDueDate(date: string, frequency: string): string {
  return format(computeNextDueDate(parseISO(date), frequency), "yyyy-MM-dd");
}

// First occurrence on or after `today` — advances a past start date forward so we never
// backfill missed occurrences from before the item existed (product decision: forward-only).
export function firstDueOnOrAfter(
  startDate: string,
  frequency: string,
  today: string,
): string {
  let due = startDate;
  while (due < today) {
    due = advanceDueDate(due, frequency);
  }
  return due;
}

/**
 * Every occurrence owed on or before `today`, oldest first. Stops at the occurrence whose
 * successor would fall past `endDate`, which is also the point the item is deactivated.
 */
export function planOccurrences(
  item: ScheduleInput,
  today: string,
): Occurrence[] {
  const occurrences: Occurrence[] = [];
  let dueDate = item.nextDueDate;

  while (dueDate <= today) {
    const nextDue = advanceDueDate(dueDate, item.frequency);
    const deactivate = Boolean(item.endDate && item.endDate < nextDue);
    occurrences.push({ dueDate, nextDue, deactivate });
    if (deactivate) break;
    dueDate = nextDue;
  }

  return occurrences;
}
