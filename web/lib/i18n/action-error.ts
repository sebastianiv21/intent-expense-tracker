import { getTranslations } from "next-intl/server";
import type { Messages } from "@/lib/i18n/messages";

type ErrorKey = keyof Messages["errors"];

/**
 * Server actions keep returning a plain `error: string` (`ActionResult` in
 * `types/index.ts`) rather than a key the client has to resolve: the request
 * already knows the locale, so the message can be translated where it is built.
 */
export async function actionError(key: ErrorKey): Promise<string> {
  const t = await getTranslations("errors");
  return t(key);
}
