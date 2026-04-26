import { AlertCircle, AlertTriangle } from "lucide-react";
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

  const Icon = meta.severity === "error" ? AlertCircle : AlertTriangle;
  const a11yPrefix = meta.severity === "error" ? "Error: " : "Warning: ";

  return (
    <span
      title={conflict.message}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium",
        meta.severity === "error"
          ? "bg-pastel-pink text-pastel-fg"
          : "bg-pastel-peach text-pastel-fg",
        className,
      )}
    >
      <Icon
        aria-hidden="true"
        className="size-3 shrink-0"
        strokeWidth={2.25}
      />
      <span className="sr-only">{a11yPrefix}</span>
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

  const Icon = hasErrors ? AlertCircle : AlertTriangle;

  return (
    <div
      role="alert"
      aria-live="polite"
      className={cn(
        "rounded-2xl border px-4 py-3 text-sm space-y-1",
        hasErrors
          ? "border-transparent bg-pastel-pink text-pastel-fg"
          : "border-transparent bg-pastel-peach text-pastel-fg",
        className,
      )}
    >
      <p className="font-medium flex items-center gap-1.5">
        <Icon aria-hidden="true" className="size-4 shrink-0" strokeWidth={2} />
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
