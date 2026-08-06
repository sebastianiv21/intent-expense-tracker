/**
 * Turns a stored `YYYY-MM-DD` into the instant that renders as that same
 * calendar date under the app's fixed UTC display zone (`lib/i18n/formats.ts`).
 *
 * `parseISO` builds *local* midnight, which is a different instant in every
 * timezone and formats as the previous day anywhere west of UTC. It stays the
 * right tool for date arithmetic and for "is this today?", which are questions
 * about the user's own calendar; it is the wrong one for display.
 */
export function toDisplayDate(isoDate: string): Date {
  return new Date(`${isoDate.slice(0, 10)}T00:00:00Z`);
}
