"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import api from "@/lib/api";
import type { WorkloadSummaryResponse } from "@/types";

const AVATAR_COLORS = [
  "bg-pastel-mint",
  "bg-pastel-lavender",
  "bg-pastel-peach",
  "bg-pastel-pink",
  "bg-pastel-amber",
];

function initials(name: string) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("");
}

export function WorkloadPanel() {
  const now = new Date();
  const { data, isLoading } = useQuery<WorkloadSummaryResponse>({
    queryKey: ["workload", "summary", now.getMonth(), now.getFullYear()],
    queryFn: async () => {
      const res = await api.get<WorkloadSummaryResponse>("/api/workload/summary", {
        params: {
          month: now.getMonth() + 1,
          year: now.getFullYear(),
        },
      });
      return res.data;
    },
    staleTime: 60_000,
  });

  const items = [...(data?.data ?? [])]
    .sort((a, b) => b.assignment_count - a.assignment_count)
    .slice(0, 8);
  const maxCount = items[0]?.assignment_count ?? 1;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-base font-semibold tracking-tight">Invigilator workload</h2>
        <span className="ml-auto text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {format(now, "MMMM yyyy")}
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="size-7 rounded-full bg-muted animate-pulse shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-3 w-32 rounded bg-muted animate-pulse" />
                <div className="h-1.5 w-full rounded-full bg-muted animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">
          No workload data for this month
        </p>
      ) : (
        <div className="space-y-0">
          {items.map((inv, idx) => {
            const pct = (inv.assignment_count / maxCount) * 100;
            const colorClass = AVATAR_COLORS[idx % AVATAR_COLORS.length];
            return (
              <div
                key={inv.invigilator_id}
                className="grid items-center gap-2.5 py-2"
                style={{ gridTemplateColumns: "28px 1fr 36px" }}
              >
                <span
                  className={`inline-flex size-7 items-center justify-center rounded-full ${colorClass} text-pastel-fg text-[10px] font-bold shrink-0`}
                >
                  {initials(inv.name)}
                </span>
                <div className="min-w-0 flex flex-col gap-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[12px] font-semibold truncate">{inv.name}</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-black/[0.08] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-foreground/60 transition-all duration-300"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
                <span className="text-display text-base text-right">{inv.assignment_count}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
