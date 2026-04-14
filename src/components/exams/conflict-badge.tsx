import { cn } from "@/lib/utils";
import type { ConflictError } from "@/hooks/use-exams";

// ── Conflict metadata ──────────────────────────────────────────────────────

const CONFLICT_META: Record<
  string,
  { label: string; severity: "error" | "warning" }
> = {
  DOUBLE_BOOKED:      { label: "Double booked",       severity: "error" },
  UNAVAILABLE:        { label: "Unavailable",          severity: "error" },
  DUPLICATE_IN_ROOM:  { label: "Duplicate role",       severity: "error" },
  INVIGILATOR_NOT_FOUND: { label: "Not found",         severity: "error" },
  ROOM_NOT_FOUND:     { label: "Room not found",       severity: "error" },
  INVALID_EXAM:       { label: "Invalid exam",         severity: "error" },
  OVER_CAPACITY:      { label: "Over capacity",        severity: "warning" },
  MISSING_REQUIRED:   { label: "Missing required",     severity: "warning" },
};

// ── ConflictBadge ──────────────────────────────────────────────────────────

interface ConflictBadgeProps {
  conflict: ConflictError;
  className?: string;
}

export function ConflictBadge({ conflict, className }: ConflictBadgeProps) {
  const meta = CONFLICT_META[conflict.type] ?? {
    label: conflict.type,
    severity: "error" as const,
  };

  return (
    <span
      title={conflict.message}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
        meta.severity === "error"
          ? "bg-destructive/10 text-destructive"
          : "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full shrink-0",
          meta.severity === "error" ? "bg-destructive" : "bg-amber-500"
        )}
      />
      {meta.label}
    </span>
  );
}

// ── ConflictBanner — inline red/amber alert ────────────────────────────────

interface ConflictBannerProps {
  conflicts: ConflictError[];
  className?: string;
}

export function ConflictBanner({ conflicts, className }: ConflictBannerProps) {
  if (!conflicts.length) return null;

  const hasErrors = conflicts.some(
    (c) => (CONFLICT_META[c.type]?.severity ?? "error") === "error"
  );

  return (
    <div
      role="alert"
      className={cn(
        "rounded-lg border px-3 py-2.5 text-sm space-y-1",
        hasErrors
          ? "border-destructive/30 bg-destructive/10 text-destructive"
          : "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300",
        className
      )}
    >
      <p className="font-medium">
        {hasErrors ? "Conflict detected" : "Warning"}
      </p>
      <ul className="list-disc list-inside space-y-0.5">
        {conflicts.map((c, i) => (
          <li key={i} className="text-xs">
            {c.message}
          </li>
        ))}
      </ul>
    </div>
  );
}
