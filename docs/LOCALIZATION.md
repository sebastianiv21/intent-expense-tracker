# Intent - Localization

The app ships in **English** and **Spanish**. English is the default; nobody who never
touches the switch sees a change.

## How the locale is chosen

`next-intl`, in its **non-routed** configuration — the locale lives in a cookie, never in
the URL. This is an auth-gated personal finance app: a shareable `/es/...` link buys
nothing, while a locale segment would restructure every route.

Resolution order, in `web/lib/i18n/request.ts`:

1. The `NEXT_LOCALE` cookie — an explicit choice, and it always wins.
2. The request's `Accept-Language` header, matched on the primary subtag, so `es-CO` and
   `es-419` both resolve to `es`. This decides the **first visit only**.
3. `en`.

The switch is in **Profile → Appearance**, beside the theme switch. Choosing a language
writes the cookie through `lib/actions/locale.ts` and refreshes; the choice survives
reloads for a year. Each option is written in its own language (`English` / `Español`) and
carries a `lang=` attribute, because the person who needs that control is the one who
cannot read the current language.

**Do not add a `[locale]` route segment or a locale middleware.** If routed locales ever
become genuinely necessary, that is a decision to raise, not to implement in passing.

## Who formats what

| Concern | Owner |
|---|---|
| Every user-visible **date** | `next-intl` (`format.dateTime`), via the named formats in `lib/i18n/formats.ts` |
| Every user-visible **number, currency and percentage** | `next-intl` (`format.number`), via the helpers in `lib/i18n/money.ts` |
| **Currency names** ("US Dollar" / "dólar estadounidense") | `Intl.DisplayNames`, in `lib/i18n/currency-names.ts` — never a catalog |
| Date **arithmetic** and `YYYY-MM-DD` serialisation | `date-fns` — locale-independent, and it stays that way |
| The calendar grid's own captions and weekday names | `next-intl`'s `Intl` formatters, injected into `react-day-picker` via `formatters` in `components/ui/calendar.tsx` |

`date-fns` also ships locales. **Do not use them.** Two systems formatting dates in the
same app will disagree, and the disagreement surfaces on exactly one screen nobody
checked. `date-fns` is for computing dates; `next-intl` is for showing them.

### Currency is not locale

The user's **currency** comes from their financial profile. The **format** comes from the
language they read. They are independent inputs and must stay that way:
`$1,234.56` and `1234,56 US$` are the same money.

`lib/finance-utils.ts` owns the currency *policy* — how many decimals a code has, when an
amount is large enough to go compact — and returns options. `next-intl` applies those
options against the reader's locale. Nothing hard-codes a locale, and nothing hard-codes a
currency symbol.

### Dates are calendar dates, not instants

Every stored date is a bare `YYYY-MM-DD` with no zone. The app is pinned to `UTC` for
display (`TIME_ZONE` in `lib/i18n/formats.ts`) and builds those values at UTC midnight via
`toDisplayDate()` in `lib/i18n/dates.ts`. `parseISO` builds *local* midnight, which is a
different instant in every timezone and renders as the previous day anywhere west of UTC —
it stays the right tool for "is this today?", which is a question about the reader's own
calendar, and the wrong one for display.

## Message catalogs

`web/lib/i18n/messages/en.json` and `es.json`, namespaced by screen:

```
app  common  buckets  transactionType  frequency  period  nav
dashboard  transactions  budgets  categories  recurring  insights
profile  onboarding  login  register  currencySelector  seedCategories  errors
```

- Keys are `namespace.camelCaseLeaf`. `common.*` is for text genuinely shared across
  screens; anything screen-specific belongs to that screen even when the English happens
  to match.
- **Never assemble a sentence from fragments in JSX.** Word order is not universal. Use
  one message with placeholders, or ICU `select` where the branches differ — see
  `transactions.noResultsType`, where English says "in income" and Spanish "en ingresos".
- Use ICU `plural` wherever a count is shown. Spanish frequently needs agreement English
  does not: `recurring.activeCount` is `1 active` / `5 active` but `1 activo` / `5 activos`.
- Percentages are passed in **already formatted** (`formatPercent`), never as a bare number
  with a literal `%` — Spanish puts a non-breaking space before the sign.
- English is the shape of record: `lib/i18n/messages.ts` types the map as
  `Record<Locale, Messages>`, so a key missing from Spanish fails `pnpm typecheck`, and
  `types/next-intl.d.ts` makes every `t("…")` a checked key.

`tests/i18n-catalogs.test.ts` proves the two catalogs have identical key sets and identical
placeholder sets per key, and that every message parses. Adding a language means making
that test pass, not eyeballing a diff.

Server actions translate their own errors (`lib/i18n/action-error.ts`) rather than
returning a key, so `ActionResult.error` stays a plain string.

## Spanish: register and vocabulary

- **`tú`, never `usted`.** Imperatives are `registra`, `elige`, `guarda` — not `registre`,
  `elija`. Enforced by `tests/i18n-catalogs.test.ts`.
- **One neutral pan-Hispanic vocabulary.** Prefer the word understood everywhere over the
  one that is perfect in a single country: `alquiler`, not `arriendo`/`renta`;
  `supermercado`, not `mercado`/`mandado`.
- **Translate the intent, not the words.** A literal rendering lands stiff.
- Button labels are infinitives (`Guardar`, `Cancelar`); prose that addresses the reader
  uses the `tú` imperative.
- Avoid gendered forms addressed at the user. "Welcome back" is `Hola de nuevo`, not
  `Bienvenido`.

### Domain nouns — use these exactly, everywhere

| English | Español | Note |
|---|---|---|
| transaction | **movimiento** | not `transacción`; the ledger word a Spanish speaker expects |
| income | **ingreso** / **ingresos** | singular as a type, plural as a total |
| expense | **gasto** / **gastos** | never `egreso` |
| budget | **presupuesto** | |
| allocation | **distribución** | |
| allocation bucket | **grupo** | "Grupo de distribución" as a form label |
| Needs / Wants / Future | **Necesidades / Deseos / Futuro** | |
| recurring | **recurrente(s)** | |
| category | **categoría** | |
| balance | **saldo** | |
| target | **meta** | |
| over budget | **excedido** | |
| compliance | **cumplimiento** | |

The consistency of these is enforced by `tests/i18n-catalogs.test.ts`, which fails if a
rejected synonym appears.

## Adding a string

1. Add the key to `en.json` **and** `es.json`.
2. Read it with `useTranslations` (client) or `getTranslations` (server).
3. Format any number, money, percentage or date through `next-intl`, never by hand.
4. `pnpm test` — the parity test is the check that it was done properly.
