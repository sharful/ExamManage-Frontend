"use client";

import { Plus } from "lucide-react";
import { WeekTimeline } from "./week-timeline";
import { WorkloadPanel } from "./workload-panel";
import { RoomUtilization } from "./room-utilization";
import { QuickActions } from "./quick-actions";
import { ActivityFeed } from "./activity-feed";
import { ConflictAlerts } from "./conflict-alerts";
import { Ring } from "./ring";
import { VariantSwitcher } from "./dashboard-command";
import type { DashboardStats } from "@/types";

interface DashboardOpsProps {
  stats: DashboardStats | undefined;
  variant: number;
  onVariant: (v: number) => void;
}

export function DashboardOps({ stats, variant, onVariant }: DashboardOpsProps) {
  const totalRooms = (stats?.rooms_in_use_today ?? 0) + (stats?.rooms_free_today ?? 0);
  const roomsUsed = stats?.rooms_in_use_today ?? 0;
  const roomPct = totalRooms > 0 ? Math.round((roomsUsed / totalRooms) * 100) : 0;

  const totalInvig = (stats?.available_invigilators ?? 0) + (stats?.unavailable_invigilators ?? 0);
  const availableInvig = stats?.available_invigilators ?? 0;
  const invigPct = totalInvig > 0 ? Math.round((availableInvig / totalInvig) * 100) : 0;

  return (
    <div className="flex flex-col gap-5">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-display text-[40px]">Operations overview</h2>
          <span className="text-sm text-muted-foreground">
            Timeline-first view — track exams across the week and the rooms that serve them.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <VariantSwitcher variant={variant} onVariant={onVariant} />
          <div className="inline-flex rounded-full bg-muted p-0.5 gap-0.5">
            {["Week", "Month", "Quarter"].map((v) => (
              <button
                key={v}
                className={[
                  "h-7 px-3 rounded-full text-[12px] font-medium transition-colors",
                  v === "Week"
                    ? "bg-card text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {v}
              </button>
            ))}
          </div>
          <button className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition-opacity">
            <Plus className="size-3.5" strokeWidth={2} />
            New exam
          </button>
        </div>
      </div>

      {/* Week Gantt */}
      <WeekTimeline />

      {/* Main grid */}
      <div
        className="grid gap-3 items-start"
        style={{ gridTemplateColumns: "minmax(0, 2.1fr) minmax(0, 1fr)" }}
      >
        <div className="flex flex-col gap-3">
          {/* Ring cards */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border bg-pastel-mint text-pastel-fg p-5">
              <div className="text-[10px] font-semibold uppercase tracking-widest opacity-70 mb-2">
                Room utilization today
              </div>
              <div className="flex items-center gap-4 mt-2">
                <Ring value={roomPct} color="oklch(0.35 0.12 165)" />
                <div className="flex flex-col gap-1">
                  <span className="text-display text-2xl">{roomsUsed}</span>
                  <span className="text-[11px] opacity-70">of {totalRooms} rooms in use</span>
                </div>
              </div>
            </div>
            <div className="rounded-2xl border border-border bg-pastel-peach text-pastel-fg p-5">
              <div className="text-[10px] font-semibold uppercase tracking-widest opacity-70 mb-2">
                Invigilator coverage
              </div>
              <div className="flex items-center gap-4 mt-2">
                <Ring value={invigPct} color="oklch(0.45 0.14 60)" />
                <div className="flex flex-col gap-1">
                  <span className="text-display text-2xl">{availableInvig}/{totalInvig}</span>
                  <span className="text-[11px] opacity-70">
                    available · {stats?.unavailable_invigilators ?? 0} unavailable
                  </span>
                </div>
              </div>
            </div>
          </div>
          <RoomUtilization />
          <WorkloadPanel />
        </div>
        <div className="flex flex-col gap-3">
          <ConflictAlerts conflicts={stats?.conflicts ?? []} />
          <QuickActions />
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
