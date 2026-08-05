const cache = new Map<string, Intl.DisplayNames>();

/**
 * Localised currency names straight from the platform: "US Dollar" in English,
 * "dólar estadounidense" in Spanish, for all 30 codes and any added later. That
 * keeps them out of the catalogs entirely, so a new currency needs no
 * translation work.
 *
 * An unrecognised code comes back as the code itself, which is the honest thing
 * to show — better than a name guessed from a neighbouring entry.
 */
export function getCurrencyNamer(locale: string): (code: string) => string {
  let displayNames = cache.get(locale);
  if (!displayNames) {
    displayNames = new Intl.DisplayNames([locale], { type: "currency" });
    cache.set(locale, displayNames);
  }

  return (code) => displayNames.of(code) ?? code;
}
