"use client";

import { Filter, Plus } from "lucide-react";
import {
  CalendarDays,
  Users,
  DoorOpen,
  AlertTriangle,
} from "lucide-react";
import { StatCard } from "./stat-card";
import { TodayTimeline } from "./today-timeline";
import { TodayTable } from "./today-table";
import { WorkloadPanel } from "./workload-panel";
import { RoomUtilization } from "./room-utilization";
import { QuickActions } from "./quick-actions";
import { ActivityFeed } from "./activity-feed";
import { MiniCalendar } from "./mini-calendar";
import { ConflictAlerts } from "./conflict-alerts";
import type { DashboardStats } from "@/types";

function fmtDelta(n: number, suffix: string): { dir: "up" | "down" | "neutral"; value: string; suffix: string } {
  if (n === 0) return { dir: "neutral", value: "±0", suffix };
  return { dir: n > 0 ? "up" : "down", value: `${n > 0 ? "+" : ""}${n}`, suffix };
}

interface VariantSwitcherProps {
  variant: number;
  onVariant: (v: number) => void;
}

export function VariantSwitcher({ variant, onVariant }: VariantSwitcherProps) {
  return (
    <div
      className="inline-flex rounded-full bg-muted p-0.5 gap-0.5"
      role="tablist"
      aria-label="Dashboard variant"
    >
      {["Command", "Ops", "Ledger"].map((v, idx) => (
        <button
          key={v}
          role="tab"
          aria-selected={variant === idx}
          onClick={() => onVariant(idx)}
          className={[
            "h-7 px-3 rounded-full text-[12px] font-medium transition-colors",
            variant === idx
              ? "bg-card text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          ].join(" ")}
        >
          {v}
        </button>
      ))}
    </div>
  );
}

interface DashboardCommandProps {
  stats: DashboardStats | undefined;
  variant: number;
  onVariant: (v: number) => void;
}

export function DashboardCommand({ stats, variant, onVariant }: DashboardCommandProps) {
  return (
    <div className="flex flex-col gap-5">
      {/* Greeting */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-display text-[40px]">Welcome back, Admin</h2>
          <span className="text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening across your exam schedule today.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <VariantSwitcher variant={variant} onVariant={onVariant} />
          <button className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-muted text-[13px] font-medium hover:bg-muted/70 transition-colors">
            <Filter className="size-3.5" strokeWidth={1.75} />
            Filters
          </button>
          <button className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition-opacity">
            <Plus className="size-3.5" strokeWidth={2} />
            New exam
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <StatCard
          icon={CalendarDays}
          label="Exams today"
          value={stats?.exams_today ?? 0}
          unit="scheduled"
          variant="blue"
          spark={stats?.history?.map((d) => d.exams) ?? []}
          sparkColor="oklch(0.35 0.10 295)"
          trend={fmtDelta(stats?.trends?.exams_delta ?? 0, "vs yesterday")}
        />
        <StatCard
          icon={Users}
          label="Available invigilators"
          value={stats?.available_invigilators ?? 0}
          unit="people"
          variant="green"
          spark={stats?.history?.map((d) => d.invigilators_assigned) ?? []}
          sparkColor="oklch(0.35 0.10 165)"
          trend={{
            dir: "up",
            value: String(stats?.trends?.invigilators_working_today ?? 0),
            suffix: "assigned today",
          }}
        />
        <StatCard
          icon={DoorOpen}
          label="Rooms in use"
          value={stats?.rooms_in_use_today ?? 0}
          unit="rooms"
          variant="amber"
          spark={stats?.history?.map((d) => d.rooms_in_use) ?? []}
          sparkColor="oklch(0.40 0.14 60)"
          trend={fmtDelta(stats?.trends?.rooms_delta ?? 0, "vs yesterday")}
        />
        <StatCard
          icon={AlertTriangle}
          label="Active conflicts"
          value={stats?.conflicts.length ?? 0}
          unit="to resolve"
          variant={(stats?.conflicts.length ?? 0) > 0 ? "red" : "green"}
          spark={stats?.history?.map((d) => d.conflicts) ?? []}
          sparkColor="oklch(0.40 0.17 20)"
          trend={fmtDelta(-(stats?.trends?.conflicts_delta ?? 0), "vs yesterday")}
        />
      </div>

      {/* Main grid */}
      <div
        className="grid gap-3 items-start"
        style={{ gridTemplateColumns: "minmax(0, 2.1fr) minmax(0, 1fr)" }}
      >
        <div className="flex flex-col gap-3">
          <TodayTimeline />
          <TodayTable />
        </div>
        <div className="flex flex-col gap-3">
          <ConflictAlerts conflicts={stats?.conflicts ?? []} />
          <QuickActions />
          <MiniCalendar />
        </div>
      </div>

      {/* Workload + Activity */}
      <div
        className="grid gap-3 items-start"
        style={{ gridTemplateColumns: "minmax(0, 2.1fr) minmax(0, 1fr)" }}
      >
        <WorkloadPanel />
        <ActivityFeed />
      </div>

      {/* Rooms full width */}
      <RoomUtilization />
    </div>
  );
}
