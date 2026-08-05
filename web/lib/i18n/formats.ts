import type { Formats } from "next-intl";

/**
 * Every date this app stores is a bare `YYYY-MM-DD` with no zone attached — a
 * calendar date the user picked, not an instant. Pinning the whole app to UTC
 * and building those dates at UTC midnight (see `lib/i18n/dates.ts`) is what
 * makes a server render and a client render agree; without a fixed zone the two
 * sit in different calendars and React hydrates over a mismatch.
 */
export const TIME_ZONE = "UTC";

/**
 * Named formats, declared once so a server component and a client component
 * asking for the same shape of date cannot drift apart.
 */
export const FORMATS = {
  dateTime: {
    /** "Aug 2" / "2 ago" — inside a row, where the year is obvious. */
    dayMonth: { day: "numeric", month: "short", timeZone: TIME_ZONE },
    /** "Aug 2, 2026" / "2 ago 2026" — a transaction's own date. */
    dayMonthYear: {
      day: "numeric",
      month: "short",
      year: "numeric",
      timeZone: TIME_ZONE,
    },
    /** "August 2, 2026" / "2 de agosto de 2026" — the date picker's own button. */
    longDate: {
      day: "numeric",
      month: "long",
      year: "numeric",
      timeZone: TIME_ZONE,
    },
    /** "Saturday, Aug 2" / "sábado, 2 ago" — the dashboard greeting. */
    weekdayDayMonth: {
      weekday: "long",
      day: "numeric",
      month: "short",
      timeZone: TIME_ZONE,
    },
    /** "August 2026" / "agosto de 2026" — a month header. */
    monthYear: { month: "long", year: "numeric", timeZone: TIME_ZONE },
    /** "Aug 2026" / "ago 2026" — "member since". */
    shortMonthYear: { month: "short", year: "numeric", timeZone: TIME_ZONE },
  },
  number: {
    /** Bucket shares and budget progress: "50%" / "50 %". */
    percent: { style: "percent", maximumFractionDigits: 0 },
    /** Counts and exchange rates — grouped, never fractional. */
    integer: { maximumFractionDigits: 0 },
  },
} satisfies Formats;
