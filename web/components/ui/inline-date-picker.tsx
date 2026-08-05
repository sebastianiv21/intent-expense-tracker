"use client";

import { useState } from "react";
import { format, parseISO } from "date-fns";
import { useFormatter, useTranslations } from "next-intl";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { toDisplayDate } from "@/lib/i18n/dates";
import { cn } from "@/lib/utils";
import type { DayPicker } from "react-day-picker";

type InlineDatePickerProps = {
  value: string | null;
  onChange: (isoDate: string) => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  disabled?: React.ComponentProps<typeof DayPicker>["disabled"];
  placeholder?: string;
  iconClassName?: string;
};

export function InlineDatePicker({
  value,
  onChange,
  open,
  onOpenChange,
  disabled,
  placeholder,
  iconClassName = "text-primary",
}: InlineDatePickerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setOpen = onOpenChange ?? setInternalOpen;
  const t = useTranslations("common");
  const intl = useFormatter();

  return (
    <div>
      <Button
        variant="outline"
        className="h-12 w-full justify-start rounded-2xl border border-border bg-background font-normal hover:bg-background/80"
        onClick={() => setOpen(!isOpen)}
      >
        <CalendarIcon className={cn("mr-3 h-4 w-4", iconClassName)} />
        {value ? (
          <span className="text-foreground">
            {intl.dateTime(toDisplayDate(value), "longDate")}
          </span>
        ) : (
          <span className="text-muted-foreground">
            {placeholder ?? t("pickDate")}
          </span>
        )}
      </Button>
      {isOpen && (
        <Calendar
          mode="single"
          // The grid is a calendar of local days, not a timeline; only the value
          // crossing `onChange` is normalised back to a bare YYYY-MM-DD.
          selected={value ? parseISO(value) : undefined}
          onSelect={(day) => {
            if (day) {
              onChange(format(day, "yyyy-MM-dd"));
              setOpen(false);
            }
          }}
          disabled={disabled}
          className="mt-2 w-full rounded-2xl border border-border bg-background p-2 [--cell-size:1.75rem]"
          classNames={{
            root: "w-full",
            month: "flex w-full flex-col gap-2",
            month_grid: "w-full",
            weeks: "flex flex-col",
            week: "mt-1 flex w-full",
          }}
          components={{
            MonthGrid: ({ className, ...props }) => (
              <div role="grid" className={className} {...props} />
            ),
            Weeks: ({ className, ...props }) => (
              <div role="rowgroup" className={className} {...props} />
            ),
            Week: ({ week, className, ...props }) => (
              <div role="row" className={className} {...props} />
            ),
            Weekdays: ({ className, ...props }) => (
              <div aria-hidden="true" className={className} {...props} />
            ),
            Weekday: ({ scope, className, ...props }) => (
              <div role="columnheader" className={className} {...props} />
            ),
            Day: ({ day, modifiers, className, ...props }) => (
              <div className={className} {...props} />
            ),
          }}
          showOutsideDays={false}
          autoFocus
        />
      )}
    </div>
  );
}
