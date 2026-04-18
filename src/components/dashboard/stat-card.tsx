import { type LucideIcon, TrendingUp, TrendingDown } from "lucide-react";
import { Card, type CardTone } from "@/components/ui/card";
import { Sparkline } from "./sparkline";

type StatVariant = "blue" | "green" | "red" | "amber";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: number | string;
  variant?: StatVariant;
  spark?: number[];
  sparkColor?: string;
  trend?: { dir: "up" | "down"; value: string; suffix?: string };
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
  spark,
  sparkColor,
  trend,
}: StatCardProps) {
  return (
    <Card tone={variantTone[variant]} className="p-[18px] relative overflow-hidden min-h-[120px] flex flex-col gap-1">
      <span
        className="absolute top-4 right-4 flex size-9 items-center justify-center rounded-full bg-white/40"
        aria-hidden
      >
        <Icon className="size-4" strokeWidth={1.75} />
      </span>
      <span className="text-[12px] font-medium opacity-[0.72] tracking-[0.01em]">{label}</span>
      <span className="text-display text-[40px] leading-none mt-1">{value}</span>
      {spark && (
        <div className="w-full mt-1">
          <Sparkline data={spark} color={sparkColor ?? "currentColor"} fill height={24} />
        </div>
      )}
      {trend && (
        <span className="flex items-center gap-1 text-[11px] font-medium opacity-[0.85] mt-auto pt-2">
          {trend.dir === "up" ? (
            <TrendingUp className="size-3" strokeWidth={2} aria-hidden />
          ) : (
            <TrendingDown className="size-3" strokeWidth={2} aria-hidden />
          )}
          {trend.value}
          {trend.suffix && <span className="opacity-70"> {trend.suffix}</span>}
        </span>
      )}
    </Card>
  );
}
