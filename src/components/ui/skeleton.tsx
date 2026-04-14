import { cn } from "@/lib/utils";

export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

/** A skeleton row that mimics a table row with N cells. */
export function SkeletonTableRow({ cells = 4 }: { cells?: number }) {
  return (
    <tr>
      {Array.from({ length: cells }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <Skeleton className="h-4 w-full" />
        </td>
      ))}
    </tr>
  );
}

/** Stacked card skeletons for mobile list views. */
export function SkeletonCard() {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5">
      <Skeleton className="size-10 rounded-full shrink-0" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-3 w-1/3" />
      </div>
    </div>
  );
}
