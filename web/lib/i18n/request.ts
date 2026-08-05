import { cookies, headers } from "next/headers";
import { getRequestConfig } from "next-intl/server";
import { FORMATS, TIME_ZONE } from "@/lib/i18n/formats";
import {
  LOCALE_COOKIE,
  isLocale,
  negotiateLocale,
  type Locale,
} from "@/lib/i18n/locales";
import { getMessagesFor } from "@/lib/i18n/messages";

/**
 * The locale lives in a cookie, not in the URL. This is an auth-gated personal
 * finance app: a shareable `/es/...` link buys nothing, and a locale segment
 * would restructure every route.
 *
 * An explicit choice always wins. `Accept-Language` only decides the very first
 * visit, before the reader has had anywhere to say otherwise.
 */
export async function resolveLocale(): Promise<Locale> {
  const stored = (await cookies()).get(LOCALE_COOKIE)?.value;
  if (isLocale(stored)) return stored;
  return negotiateLocale((await headers()).get("accept-language"));
}

export default getRequestConfig(async () => {
  const locale = await resolveLocale();

  return {
    locale,
    messages: getMessagesFor(locale),
    formats: FORMATS,
    timeZone: TIME_ZONE,
  };
});
