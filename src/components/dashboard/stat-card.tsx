import { type LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Card, type CardTone } from "@/components/ui/card";
import { Sparkline } from "./sparkline";

type StatVariant = "blue" | "green" | "red" | "amber";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  /** Short unit/context, rendered under the value (e.g. "rooms", "exams today"). */
  unit?: string;
  variant?: StatVariant;
  /** When false, skip the sparkline even if `spark` is provided. */
  showSparkline?: boolean;
  spark?: number[];
  sparkColor?: string;
  trend?: { dir: "up" | "down" | "neutral"; value: string; suffix?: string };
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
  unit,
  variant = "blue",
  showSparkline = true,
  spark,
  sparkColor,
  trend,
}: StatCardProps) {
  const sparkLabel =
    spark && trend
      ? `${label}: ${trend.dir === "up" ? "trending up" : trend.dir === "down" ? "trending down" : "flat"} ${trend.value}${trend.suffix ? ` ${trend.suffix}` : ""}.`
      : undefined;

  return (
    <Card tone={variantTone[variant]} className="p-[18px] relative overflow-hidden min-h-[120px] flex flex-col gap-1">
      <span
        className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full bg-white/40"
        aria-hidden
      >
        <Icon className="size-4" strokeWidth={1.75} />
      </span>
      <span className="text-[12px] font-medium opacity-[0.72] tracking-[0.01em]">{label}</span>
      <span className="flex items-baseline gap-1.5 mt-1">
        <span className="text-display text-[40px] leading-none">{value}</span>
        {unit && (
          <span className="text-[11px] font-medium opacity-[0.72]">{unit}</span>
        )}
      </span>
      {showSparkline && spark && (
        <div
          className="w-full mt-1"
          role={sparkLabel ? "img" : undefined}
          aria-label={sparkLabel}
          title={sparkLabel}
        >
          <Sparkline data={spark} color={sparkColor ?? "currentColor"} fill height={24} />
        </div>
      )}
      {trend && (
        <span className="flex items-center gap-1 text-[11px] font-medium opacity-[0.85] mt-auto pt-2">
          {trend.dir === "up" ? (
            <TrendingUp className="size-3" strokeWidth={2} aria-hidden />
          ) : trend.dir === "down" ? (
            <TrendingDown className="size-3" strokeWidth={2} aria-hidden />
          ) : (
            <Minus className="size-3" strokeWidth={2} aria-hidden />
          )}
          {trend.value}
          {trend.suffix && <span className="opacity-70"> {trend.suffix}</span>}
        </span>
      )}
    </Card>
  );
}
