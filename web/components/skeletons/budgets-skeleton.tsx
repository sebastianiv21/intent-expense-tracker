import { Skeleton } from "@/components/ui/skeleton";

export function BudgetsSkeleton() {
  return (
    <div className="space-y-6">
      {/* PageHeader */}
      <div className="flex items-center justify-between pb-4">
        <div className="space-y-1.5">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-4 w-56" />
        </div>
        <Skeleton className="h-11 w-28 rounded-md" />
      </div>

      {/* Month + summary card */}
      <Skeleton className="h-36 w-full rounded-xl" />

      {/* Bucket sections */}
      {[0, 1, 2].map((i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-28 w-full rounded-xl" />
          <Skeleton className="h-28 w-full rounded-xl" />
        </div>
      ))}
    </div>
  );
}
