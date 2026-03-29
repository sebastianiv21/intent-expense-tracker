"use client";

import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { SUPPORTED_CURRENCIES, getCurrencyInfo } from "@/lib/currencies";

type CurrencySelectorProps = {
  value: string;
  onChange: (code: string) => void;
};

export function CurrencySelector({ value, onChange }: CurrencySelectorProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = getCurrencyInfo(value);

  const filtered = search
    ? SUPPORTED_CURRENCIES.filter(
        (c) =>
          c.code.toLowerCase().includes(search.toLowerCase()) ||
          c.name.toLowerCase().includes(search.toLowerCase()),
      )
    : SUPPORTED_CURRENCIES;

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
              {selected.symbol} — {selected.name}
            </span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
        <div className="p-2 border-b border-border">
          <input
            className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            placeholder="Search currencies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            autoFocus
          />
        </div>
        <div className="max-h-60 overflow-y-auto p-1">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground p-2 text-center">
              No currencies found.
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
                  {currency.symbol} — {currency.name}
                </span>
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
