"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import {
  CalendarDays,
  Users,
  DoorOpen,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { StatCard } from "@/components/dashboard/stat-card";
import { ConflictAlerts } from "@/components/dashboard/conflict-alerts";
import { Badge } from "@/components/ui/badge";
import { useDashboard } from "@/hooks/use-dashboard";
import api from "@/lib/api";
import type { ExamListResponse } from "@/types";

function TodaySchedule() {
  const today = format(new Date(), "yyyy-MM-dd");
  const { data, isLoading } = useQuery<ExamListResponse>({
    queryKey: ["exams", "today", today],
    queryFn: async () => {
      const res = await api.get<ExamListResponse>("/api/exams", {
        params: { exam_date: today, limit: 200 },
      });
      return res.data;
    },
    refetchInterval: 30_000,
  });

  const exams = data?.data ?? [];

  return (
    <section aria-labelledby="schedule-heading">
      <h2
        id="schedule-heading"
        className="mb-3 text-base font-semibold tracking-tight"
      >
        Today&apos;s Schedule
        <span className="ml-2 text-sm font-normal text-muted-foreground">
          {format(new Date(), "EEEE, MMMM d")}
        </span>
      </h2>

      {isLoading ? (
        <ScheduleSkeleton />
      ) : exams.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
          No exams scheduled for today
        </div>
      ) : (
        <>
          {/* Desktop: table */}
          <div className="hidden sm:block overflow-x-auto rounded-2xl border border-border bg-card">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/60">
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Exam
                  </th>
                  <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                    Time Slot
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {exams.map((exam) => (
                  <tr
                    key={exam.id}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-4 py-3 font-medium">{exam.exam_name}</td>
                    <td className="px-4 py-3">
                      <TimeSlotBadge slot={exam.time_slot} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile: scrollable list */}
          <ul
            className="sm:hidden flex flex-col gap-2 max-h-72 overflow-y-auto"
            role="list"
          >
            {exams.map((exam) => (
              <li
                key={exam.id}
                className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Clock className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
                  <span className="text-sm font-medium truncate">
                    {exam.exam_name}
                  </span>
                </div>
                <TimeSlotBadge slot={exam.time_slot} />
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}

function TimeSlotBadge({ slot }: { slot: "morning" | "evening" }) {
  return (
    <Badge variant={slot === "morning" ? "peach" : "lavender"}>
      {slot === "morning" ? "Morning" : "Evening"}
    </Badge>
  );
}

function ScheduleSkeleton() {
  return (
    <div className="rounded-2xl border border-border bg-card divide-y divide-border">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-center justify-between px-4 py-3">
          <div className="h-4 w-48 rounded bg-muted animate-pulse" />
          <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function StatsSkeleton() {
  return (
    <>
      {[1, 2, 3, 4].map((i) => (
        <div
          key={i}
          className="rounded-2xl border border-border bg-card p-5 animate-pulse"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="h-3 w-28 rounded bg-muted" />
              <div className="h-8 w-16 rounded bg-muted" />
            </div>
            <div className="h-10 w-10 rounded-lg bg-muted" />
          </div>
        </div>
      ))}
    </>
  );
}

export default function DashboardPage() {
  const { data, isLoading } = useDashboard();

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-display text-4xl md:text-5xl">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s what&apos;s happening across your exam schedule today.
          </p>
        </div>

        {/* Top section: stats + conflicts */}
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
          {/* Stat cards — desktop: flex row inside the left column, mobile: 2×2 grid */}
          <div className="flex-1 min-w-0">
            <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
              {isLoading ? (
                <StatsSkeleton />
              ) : (
                <>
                  <StatCard
                    icon={CalendarDays}
                    label="Exams Today"
                    value={data?.exams_today ?? 0}
                    variant="blue"
                  />
                  <StatCard
                    icon={Users}
                    label="Available Invigilators"
                    value={data?.available_invigilators ?? 0}
                    variant="green"
                  />
                  <StatCard
                    icon={DoorOpen}
                    label="Rooms In Use"
                    value={data?.rooms_in_use_today ?? 0}
                    variant="amber"
                  />
                  <StatCard
                    icon={AlertTriangle}
                    label="Active Conflicts"
                    value={data?.conflicts.length ?? 0}
                    variant={(data?.conflicts.length ?? 0) > 0 ? "red" : "green"}
                  />
                </>
              )}
            </div>
          </div>

          {/* Conflict alerts panel */}
          <div className="w-full lg:w-80 xl:w-96 shrink-0">
            <ConflictAlerts conflicts={data?.conflicts ?? []} />
          </div>
        </div>

        {/* Today's schedule */}
        <TodaySchedule />
      </div>
    </AppShell>
  );
}
