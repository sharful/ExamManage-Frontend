import Link from "next/link";
import { AlertTriangle, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import type { DashboardConflict } from "@/types";

interface ConflictAlertsProps {
  conflicts: DashboardConflict[];
}

type Severity = "high" | "medium" | "low";

const SEVERITY_MAP: Record<string, Severity> = {
  DOUBLE_BOOKED: "high",
  UNAVAILABLE: "high",
  OVER_CAPACITY: "medium",
  DUPLICATE_IN_ROOM: "medium",
  MISSING_REQUIRED: "high",
  INVIGILATOR_NOT_FOUND: "medium",
  INVALID_EXAM: "medium",
};

const severityConfig: Record<
  Severity,
  { icon: typeof AlertCircle; chipClass: string; rowClass: string; srLabel: string }
> = {
  high: {
    icon: AlertCircle,
    chipClass: "bg-destructive text-white",
    rowClass:
      "bg-destructive/10 border border-destructive/30 hover:bg-destructive/15",
    srLabel: "High severity",
  },
  medium: {
    icon: AlertTriangle,
    chipClass: "bg-pastel-peach text-pastel-fg",
    rowClass: "bg-pastel-peach/40 border border-transparent hover:bg-pastel-peach/60",
    srLabel: "Medium severity",
  },
  low: {
    icon: Info,
    chipClass: "bg-pastel-lavender text-pastel-fg",
    rowClass: "bg-muted/50 border border-transparent hover:bg-muted",
    srLabel: "Low severity",
  },
};

function ConflictAlert({ conflict }: { conflict: DashboardConflict }) {
  const severity = SEVERITY_MAP[conflict.type] ?? "low";
  const { icon: Icon, chipClass, rowClass, srLabel } = severityConfig[severity];

  const content = (
    <div className={cn("rounded-2xl px-3 py-2.5 text-sm transition-colors", rowClass)}>
      <div className="flex items-start gap-2.5">
        <span
          className={cn(
            "mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full",
            chipClass,
          )}
        >
          <Icon className="size-3.5" strokeWidth={2} aria-hidden />
          <span className="sr-only">{srLabel}: </span>
        </span>
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="font-medium truncate">
            {conflict.exam_name ?? "Unknown Exam"}
          </span>
          <span className="text-muted-foreground text-xs leading-snug">
            {conflict.message}
          </span>
        </div>
      </div>
    </div>
  );

  if (conflict.exam_id) {
    return (
      <Link
        href={`/exams/${conflict.exam_id}`}
        className="block rounded-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label={`View exam: ${conflict.exam_name}`}
      >
        {content}
      </Link>
    );
  }

  return content;
}

export function ConflictAlerts({ conflicts }: ConflictAlertsProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <span className="flex size-6 items-center justify-center rounded-full bg-pastel-pink text-pastel-fg">
            <AlertCircle className="size-3.5" strokeWidth={2} aria-hidden />
          </span>
          Active Conflicts
          {conflicts.length > 0 && (
            <span className="ml-auto rounded-full bg-pastel-pink px-2.5 py-0.5 text-xs font-semibold text-pastel-fg">
              {conflicts.length}
            </span>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {conflicts.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-6">
            No active conflicts today
          </p>
        ) : (
          <ul className="flex flex-col gap-2" role="list">
            {conflicts.map((conflict, idx) => (
              <li key={`${conflict.type}-${conflict.exam_id ?? ""}-${conflict.invigilator_id ?? ""}-${idx}`}>
                <ConflictAlert conflict={conflict} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
