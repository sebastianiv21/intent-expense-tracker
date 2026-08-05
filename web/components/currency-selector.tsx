"use client";

import { useMemo, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { SUPPORTED_CURRENCIES, getCurrencyInfo } from "@/lib/currencies";
import { getCurrencyNamer } from "@/lib/i18n/currency-names";

type CurrencySelectorProps = {
  value: string;
  onChange: (code: string) => void;
};

export function CurrencySelector({ value, onChange }: CurrencySelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const locale = useLocale();
  const t = useTranslations("currencySelector");

  // Currency names come from Intl, not from a catalog: the platform already
  // knows all 30 in both languages, and keeping them out of the catalogs means
  // a new currency needs no translation work at all.
  const options = useMemo(() => {
    const nameOf = getCurrencyNamer(locale);
    return SUPPORTED_CURRENCIES.map((currency) => ({
      code: currency.code,
      symbol: currency.symbol,
      name: nameOf(currency.code),
    }));
  }, [locale]);

  const selected = getCurrencyInfo(value);
  const selectedName = useMemo(
    () => getCurrencyNamer(locale)(selected.code),
    [locale, selected.code],
  );

  const needle = search.trim().toLowerCase();
  const filtered = needle
    ? options.filter(
        (c) =>
          c.code.toLowerCase().includes(needle) ||
          c.name.toLowerCase().includes(needle),
      )
    : options;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between min-h-[44px]"
        >
          <span className="flex items-center gap-2">
            <span className="font-semibold">{selected.code}</span>
            <span className="text-muted-foreground text-sm">
              {t("option", { symbol: selected.symbol, name: selectedName })}
            </span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="p-2 border-b border-border">
          <input
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder={t("search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="max-h-60 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground p-2 text-center">
              {t("empty")}
            </p>
          ) : (
            filtered.map((currency) => (
              <button
                key={currency.code}
                type="button"
                className={cn(
                  "flex w-full items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-muted transition-colors min-h-[44px]",
                  value === currency.code && "bg-muted",
                )}
                onClick={() => {
                  onChange(currency.code);
                  setOpen(false);
                  setSearch("");
                }}
              >
                <Check
                  className={cn(
                    "h-4 w-4 shrink-0",
                    value === currency.code ? "opacity-100" : "opacity-0",
                  )}
                />
                <span className="font-semibold">{currency.code}</span>
                <span className="text-muted-foreground">
                  {t("option", {
                    symbol: currency.symbol,
                    name: currency.name,
                  })}
                </span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
