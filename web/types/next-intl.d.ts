import type { FORMATS } from "@/lib/i18n/formats";
import type { Locale } from "@/lib/i18n/locales";
import type { Messages } from "@/lib/i18n/messages";

// Registering the catalog shape turns every `t("…")` into a checked key: a typo
// or a key dropped from English fails `pnpm typecheck`, not a screen at runtime.
declare module "next-intl" {
  interface AppConfig {
    Messages: Messages;
    Formats: typeof FORMATS;
    Locale: Locale;
  }
}
