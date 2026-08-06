import en from "@/lib/i18n/messages/en.json";
import es from "@/lib/i18n/messages/es.json";
import type { Locale } from "@/lib/i18n/locales";

export type Messages = typeof en;

/**
 * English is the shape of record: annotating the map with `Messages` makes a key
 * missing from Spanish a typecheck failure, before the parity test even runs.
 */
export const MESSAGES: Record<Locale, Messages> = { en, es };

export function getMessagesFor(locale: Locale): Messages {
  return MESSAGES[locale];
}
