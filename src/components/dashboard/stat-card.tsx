import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, type CardTone } from "@/components/ui/card";

type StatVariant = "blue" | "green" | "red" | "amber";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number;
  variant?: StatVariant;
  trend?: number;
}

const variantTone: Record<StatVariant, CardTone> = {
  blue: "lavender",
  green: "mint",
  red: "pink",
  amber: "peach",
};

export function StatCard({
  icon: Icon,
  label,
  value,
  variant = "blue",
  trend,
}: StatCardProps) {
  return (
    <Card tone={variantTone[variant]} className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium opacity-70">{label}</span>
          <span className="text-display text-4xl">{value}</span>
          {trend !== undefined && (
            <span
              className={cn(
                "text-xs font-medium mt-1",
                trend > 0 ? "opacity-90" : "opacity-90"
              )}
            >
              {trend > 0 ? "+" : ""}
              {trend} from yesterday
            </span>
          )}
        </div>
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card/60">
          <Icon className="size-5" strokeWidth={1.75} aria-hidden />
        </div>
      </div>
    </Card>
  );
}
