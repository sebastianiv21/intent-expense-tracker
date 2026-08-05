"use client";

import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  type LucideIcon,
} from "lucide-react";
import { useFormatter, useTranslations } from "next-intl";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useCurrency } from "@/components/currency-provider";
import { formatPercent } from "@/lib/i18n/money";
import { cn } from "@/lib/utils";
import type { AllocationBucket } from "@/types";

type BucketCardProps = {
  bucket: AllocationBucket;
  color: string;
  spent: number;
  target: number;
  progress: number;
};

type StateConfig = {
  Icon: LucideIcon;
  textClass: string;
  indicatorClass: string;
};

const STATE_CONFIGS = {
  "over-budget": {
    Icon: AlertCircle,
    textClass: "text-destructive",
    indicatorClass: "bg-destructive",
  },
  nearing: {
    Icon: AlertTriangle,
    textClass: "text-warning",
    indicatorClass: "bg-warning",
  },
  "on-track": { Icon: CheckCircle2, textClass: "", indicatorClass: "" },
} satisfies Record<string, StateConfig>;

function getState(spent: number, target: number): keyof typeof STATE_CONFIGS {
  if (target <= 0 || spent < target * 0.8) return "on-track";
  if (spent < target) return "nearing";
  return "over-budget";
}

export function BucketCard({
  bucket,
  color,
  spent,
  target,
  progress,
}: BucketCardProps) {
  const { formatCurrencyCompact } = useCurrency();
  const t = useTranslations("dashboard");
  const tBuckets = useTranslations("buckets");
  const format = useFormatter();

  const label = tBuckets(bucket);
  const state = getState(spent, target);
  const { Icon, textClass, indicatorClass } = STATE_CONFIGS[state];
  const displayRatio = target > 0 ? Math.round((spent / target) * 100) : 0;
  const onTrack = state === "on-track";
  const bucketColorStyle = onTrack ? { color } : undefined;
  const indicatorStyle = onTrack ? { backgroundColor: color } : undefined;

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">
              {t("bucketTarget", { amount: formatCurrencyCompact(target) })}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <Icon
              className={cn("h-3.5 w-3.5", textClass)}
              style={bucketColorStyle}
              aria-hidden="true"
            />
            <span
              className={cn("text-xs font-semibold", textClass)}
              style={bucketColorStyle}
            >
              {formatPercent(format, displayRatio)}
            </span>
          </div>
        </div>
        <Progress
          value={progress}
          className="h-2"
          style={{ backgroundColor: `${color}22` }}
          indicatorClassName={indicatorClass}
          indicatorStyle={indicatorStyle}
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {t("bucketSpent", { amount: formatCurrencyCompact(spent) })}
          </span>
          <span className={textClass} style={bucketColorStyle}>
            {label}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
