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
          ? "bg-pastel-pink text-pastel-fg"
          : "bg-pastel-peach text-pastel-fg",
        className
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 rounded-full shrink-0",
          "bg-pastel-fg opacity-70"
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
        "rounded-2xl border px-4 py-3 text-sm space-y-1",
        hasErrors
          ? "border-transparent bg-pastel-pink text-pastel-fg"
          : "border-transparent bg-pastel-peach text-pastel-fg",
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
