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
  { icon: typeof AlertCircle; className: string; badge: string }
> = {
  high: {
    icon: AlertCircle,
    className: "border-l-4 border-l-red-500 bg-red-50 dark:bg-red-950/20",
    badge: "text-red-700 dark:text-red-400",
  },
  medium: {
    icon: AlertTriangle,
    className: "border-l-4 border-l-amber-500 bg-amber-50 dark:bg-amber-950/20",
    badge: "text-amber-700 dark:text-amber-400",
  },
  low: {
    icon: Info,
    className: "border-l-4 border-l-blue-500 bg-blue-50 dark:bg-blue-950/20",
    badge: "text-blue-700 dark:text-blue-400",
  },
};

function ConflictAlert({ conflict }: { conflict: DashboardConflict }) {
  const severity = SEVERITY_MAP[conflict.type] ?? "low";
  const { icon: Icon, className, badge } = severityConfig[severity];

  const content = (
    <div className={cn("rounded-md px-3 py-2.5 text-sm", className)}>
      <div className="flex items-start gap-2">
        <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", badge)} aria-hidden />
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className={cn("font-medium truncate", badge)}>
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
        className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
          <AlertCircle className="h-4 w-4 text-red-500" aria-hidden />
          Active Conflicts
          {conflicts.length > 0 && (
            <span className="ml-auto rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-900/30 dark:text-red-400">
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
