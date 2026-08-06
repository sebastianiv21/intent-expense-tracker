"use server";

import { cookies } from "next/headers";
import {
  LOCALE_COOKIE,
  LOCALE_COOKIE_MAX_AGE,
  isLocale,
} from "@/lib/i18n/locales";
import type { ActionResult } from "@/types";

/**
 * Writing the cookie is what makes the choice explicit: from here on it outranks
 * `Accept-Language` on every request, which is why no revalidation is needed —
 * the caller refreshes and the whole tree re-renders through the request config.
 */
export async function setLocale(value: unknown): Promise<ActionResult> {
  if (!isLocale(typeof value === "string" ? value : undefined)) {
    return { success: false, error: "Unsupported locale" };
  }

  (await cookies()).set(LOCALE_COOKIE, value as string, {
    maxAge: LOCALE_COOKIE_MAX_AGE,
    path: "/",
    sameSite: "lax",
  });

  return { success: true };
}
