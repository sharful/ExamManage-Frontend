import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";

type StatVariant = "blue" | "green" | "red" | "amber";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  variant?: StatVariant;
  trend?: number;
}

const variantStyles: Record<StatVariant, { icon: string; badge: string }> = {
  blue: {
    icon: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    badge: "text-blue-600 dark:text-blue-400",
  },
  green: {
    icon: "bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400",
    badge: "text-green-600 dark:text-green-400",
  },
  red: {
    icon: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
    badge: "text-red-600 dark:text-red-400",
  },
  amber: {
    icon: "bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400",
    badge: "text-amber-600 dark:text-amber-400",
  },
};

export function StatCard({
  icon: Icon,
  label,
  value,
  variant = "blue",
  trend,
}: StatCardProps) {
  const styles = variantStyles[variant];

  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex flex-col gap-1">
            <span className="text-sm font-medium text-muted-foreground">
              {label}
            </span>
            <span className="text-3xl font-bold tracking-tight">{value}</span>
            {trend !== undefined && (
              <span
                className={cn(
                  "text-xs font-medium",
                  trend > 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                )}
              >
                {trend > 0 ? "+" : ""}
                {trend} from yesterday
              </span>
            )}
          </div>
          <div className={cn("rounded-lg p-2.5 shrink-0", styles.icon)}>
            <Icon className="h-5 w-5" aria-hidden />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
