import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function DonutChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("relative flex items-center justify-center", className)}>
      <Skeleton className="absolute w-36 h-36 rounded-full" />
      <div className="absolute w-20 h-20 rounded-full bg-card" />
      <div className="relative text-center">
        <Skeleton className="h-8 w-16 mx-auto" />
      </div>
    </div>
  );
}

function BarChartSkeleton({ className }: { className?: string }) {
  const barHeights = [65, 45, 80, 55, 70, 40, 60];
  return (
    <div className={cn("flex items-end gap-3 px-4 h-full", className)}>
      {barHeights.map((height, i) => (
        <Skeleton key={i} className="flex-1 rounded-t" style={{ height: `${height}%` }} />
      ))}
    </div>
  );
}

function BucketCardSkeleton() {
  return (
    <div className="p-4 space-y-3 rounded-lg border border-border bg-card">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <Skeleton className="h-4 w-4 rounded" />
          <Skeleton className="h-4 w-16" />
        </div>
        <Skeleton className="h-4 w-16" />
      </div>
      <div className="space-y-1">
        <div className="flex justify-between">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-16" />
        </div>
        <div className="flex justify-between">
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-14" />
        </div>
      </div>
      <div className="space-y-1">
        <Skeleton className="h-2 w-full rounded-full" />
        <div className="flex justify-between">
          <Skeleton className="h-2 w-4" />
          <Skeleton className="h-2 w-6" />
        </div>
      </div>
    </div>
  );
}

export function InsightsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-6 w-24" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-4 w-20" />
      </div>

      {/* Period selector */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {[0, 1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-11 min-w-[88px] rounded-md" />
        ))}
      </div>

      {/* Main content grid - asymmetric 1.5fr 1fr */}
      <div className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
        {/* Compliance card */}
        <div className="p-4 space-y-4 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-3 w-24" />
            </div>
            <Skeleton className="h-9 w-16" />
          </div>
          <DonutChartSkeleton className="h-48 sm:h-56 md:h-64 lg:h-72" />
          <div className="grid gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Skeleton className="h-3 w-3 rounded" />
                  <Skeleton className="h-3 w-14" />
                </div>
                <Skeleton className="h-3 w-24" />
              </div>
            ))}
          </div>
        </div>

        {/* Summary card */}
        <div className="p-5 space-y-4 rounded-lg border border-border bg-card">
          <Skeleton className="h-4 w-20" />
          <div className="grid gap-3">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Spending by category card */}
      <div className="p-6 space-y-4 rounded-lg border border-border bg-card overflow-hidden">
        <div className="space-y-1">
          <Skeleton className="h-4 w-36" />
          <Skeleton className="h-3 w-28" />
        </div>
        <div className="h-56 sm:h-64 lg:h-72">
          <BarChartSkeleton className="h-full" />
        </div>
      </div>

      {/* Bucket cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <BucketCardSkeleton />
        <BucketCardSkeleton />
        <BucketCardSkeleton />
      </div>
    </div>
  );
}
