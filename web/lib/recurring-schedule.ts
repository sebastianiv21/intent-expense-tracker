// Pure schedule arithmetic for recurring transactions. Kept out of lib/actions/recurring.ts
// so it can be exercised without a database — that file is "use server" and may only
// export async functions.

import {
  addDays,
  addMonths,
  addWeeks,
  format,
  getDaysInMonth,
  parseISO,
  setDate,
  startOfMonth,
} from "date-fns";

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
  /** Day-of-month anchor for month-based frequencies. Falls back to `nextDueDate`. */
  startDate?: string;
};

export type Occurrence = {
  /** The date the generated transaction is posted under. */
  dueDate: string;
  /** Where the schedule lands after this occurrence. */
  nextDue: string;
  /** True when `nextDue` is past `endDate` and the item should stop recurring. */
  deactivate: boolean;
};

// Steps a month-based frequency while keeping `anchorDay`, clamping only for the target
// month. Clamping off the *previous* due date would make February's clamp permanent.
function addMonthsOnAnchor(date: Date, months: number, anchorDay: number): Date {
  const shifted = addMonths(startOfMonth(date), months);
  return setDate(shifted, Math.min(anchorDay, getDaysInMonth(shifted)));
}

export function computeNextDueDate(
  date: Date,
  frequency: string,
  anchorDay: number = date.getDate(),
): Date {
  switch (frequency) {
    case "daily":
      return addDays(date, 1);
    case "weekly":
      return addWeeks(date, 1);
    case "biweekly":
      return addWeeks(date, 2);
    case "quarterly":
      return addMonthsOnAnchor(date, 3, anchorDay);
    case "yearly":
      return addMonthsOnAnchor(date, 12, anchorDay);
    default:
      return addMonthsOnAnchor(date, 1, anchorDay);
  }
}

// parseISO (local midnight) round-trips stably with format; `new Date(iso)` parses
// as UTC and compounds a ~1-day drift each iteration.
export function advanceDueDate(
  date: string,
  frequency: string,
  anchor?: string,
): string {
  const anchorDay = anchor ? parseISO(anchor).getDate() : undefined;
  return format(
    computeNextDueDate(parseISO(date), frequency, anchorDay),
    "yyyy-MM-dd",
  );
}

// First occurrence on or after `today` — advances a past start date forward so we never
// backfill missed occurrences from before the item existed (product decision: forward-only).
export function firstDueOnOrAfter(
  from: string,
  frequency: string,
  today: string,
  anchor: string = from,
): string {
  let due = from;
  while (due < today) {
    due = advanceDueDate(due, frequency, anchor);
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
  const anchor = item.startDate ?? item.nextDueDate;

  while (dueDate <= today) {
    const nextDue = advanceDueDate(dueDate, item.frequency, anchor);
    const deactivate = Boolean(item.endDate && item.endDate < nextDue);
    occurrences.push({ dueDate, nextDue, deactivate });
    if (deactivate) break;
    dueDate = nextDue;
  }

  return occurrences;
}
