import { AlertCircle, AlertTriangle, CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { formatCurrencyCompact } from "@/lib/finance-utils";
import { cn } from "@/lib/utils";
import type { AllocationBucket } from "@/types";

type BucketCardProps = {
  bucket: AllocationBucket;
  label: string;
  color: string;
  spent: number;
  target: number;
  progress: number;
};

type BucketState = "on-track" | "nearing" | "over-budget";

function getBucketState(spent: number, target: number): BucketState {
  if (target <= 0) return "on-track";
  if (spent >= target) return "over-budget";
  if (spent / target >= 0.8) return "nearing";
  return "on-track";
}

export function BucketCard({ label, color, spent, target, progress }: BucketCardProps) {
  const state = getBucketState(spent, target);

  const stateIcon =
    state === "over-budget" ? (
      <AlertCircle className="h-3.5 w-3.5 text-destructive" aria-hidden="true" />
    ) : state === "nearing" ? (
      <AlertTriangle className="h-3.5 w-3.5 text-warning" aria-hidden="true" />
    ) : (
      <CheckCircle2 className="h-3.5 w-3.5" style={{ color }} aria-hidden="true" />
    );

  const stateTextClass =
    state === "over-budget"
      ? "text-destructive"
      : state === "nearing"
        ? "text-warning"
        : undefined;

  const displayRatio =
    target > 0 ? Math.round((spent / target) * 100) : 0;

  return (
    <Card>
      <CardContent className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">{label}</p>
            <p className="text-xs text-muted-foreground">Target {formatCurrencyCompact(target)}</p>
          </div>
          <div className="flex items-center gap-1">
            {stateIcon}
            <span className={cn("text-xs font-semibold", stateTextClass)} style={!stateTextClass ? { color } : undefined}>
              {displayRatio}%
            </span>
          </div>
        </div>
        <Progress
          value={progress}
          className="h-2"
          style={{ backgroundColor: `${color}22` }}
        />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Spent {formatCurrencyCompact(spent)}</span>
          <span className={stateTextClass} style={!stateTextClass ? { color } : undefined}>{label}</span>
        </div>
      </CardContent>
    </Card>
  );
}
