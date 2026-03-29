// ─── Supported Currencies ─────────────────────────────────────────────────────

export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number]["code"];

export type CurrencyInfo = {
  code: string;
  name: string;
  symbol: string;
};

export const SUPPORTED_CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "CAD", name: "Canadian Dollar", symbol: "CA$" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "MXN", name: "Mexican Peso", symbol: "MX$" },
  { code: "BRL", name: "Brazilian Real", symbol: "R$" },
  { code: "COP", name: "Colombian Peso", symbol: "COL$" },
  { code: "ARS", name: "Argentine Peso", symbol: "ARS$" },
  { code: "CLP", name: "Chilean Peso", symbol: "CL$" },
  { code: "PEN", name: "Peruvian Sol", symbol: "S/" },
  { code: "KRW", name: "South Korean Won", symbol: "₩" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr" },
  { code: "NOK", name: "Norwegian Krone", symbol: "kr" },
  { code: "DKK", name: "Danish Krone", symbol: "kr" },
  { code: "PLN", name: "Polish Zloty", symbol: "zł" },
  { code: "CZK", name: "Czech Koruna", symbol: "Kč" },
  { code: "HUF", name: "Hungarian Forint", symbol: "Ft" },
  { code: "TRY", name: "Turkish Lira", symbol: "₺" },
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "NZD", name: "New Zealand Dollar", symbol: "NZ$" },
  { code: "SGD", name: "Singapore Dollar", symbol: "S$" },
  { code: "HKD", name: "Hong Kong Dollar", symbol: "HK$" },
  { code: "TWD", name: "New Taiwan Dollar", symbol: "NT$" },
  { code: "THB", name: "Thai Baht", symbol: "฿" },
  { code: "PHP", name: "Philippine Peso", symbol: "₱" },
] as const;

export const DEFAULT_CURRENCY: CurrencyCode = "USD";

export const CURRENCY_MAP = new Map<string, CurrencyInfo>(
  SUPPORTED_CURRENCIES.map((c) => [c.code, c]),
);

export function getCurrencyInfo(code: string): CurrencyInfo {
  return CURRENCY_MAP.get(code) ?? SUPPORTED_CURRENCIES[0];
}

export function getCurrencySymbol(code: string): string {
  return getCurrencyInfo(code).symbol;
}
