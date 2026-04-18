"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Plus, Download, Filter, MoreHorizontal, AlertCircle, CheckCircle } from "lucide-react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import { Sparkline } from "./sparkline";
import { WorkloadPanel } from "./workload-panel";
import { ActivityFeed } from "./activity-feed";
import { ConflictAlerts } from "./conflict-alerts";
import { VariantSwitcher } from "./dashboard-command";
import type { DashboardStats, Exam, ExamListResponse } from "@/types";

function coveragePct(exam: Exam): number | null {
  if (!exam.assignments) return null;
  if (exam.assignments.length === 0) return 0;
  const fullyStaffed = exam.assignments.filter(
    (a) => a.head_invigilator_id && a.invigilator1_id
  ).length;
  return Math.round((fullyStaffed / exam.assignments.length) * 100);
}

interface KpiItem {
  label: string;
  value: string;
  sub: string;
  spark: number[];
  tone: string;
}

interface DashboardLedgerProps {
  stats: DashboardStats | undefined;
  variant: number;
  onVariant: (v: number) => void;
}

export function DashboardLedger({ stats, variant, onVariant }: DashboardLedgerProps) {
  const [tab, setTab] = useState<"today" | "week" | "all">("today");
  const today = format(new Date(), "yyyy-MM-dd");

  const { data, isLoading } = useQuery<ExamListResponse>({
    queryKey: ["exams", "ledger", tab, today],
    queryFn: async () => {
      const params: Record<string, string | number> = { limit: 50 };
      if (tab === "today") params.exam_date = today;
      const res = await api.get<ExamListResponse>("/api/exams", { params });
      return res.data;
    },
    staleTime: 30_000,
  });

  const exams = data?.data ?? [];

  const sparkExams     = stats?.history?.map((d) => d.exams) ?? [];
  const sparkInvig     = stats?.history?.map((d) => d.invigilators_assigned) ?? [];
  const sparkRooms     = stats?.history?.map((d) => d.rooms_in_use) ?? [];
  const sparkConflicts = stats?.history?.map((d) => d.conflicts) ?? [];

  const kpis: KpiItem[] = [
    {
      label: "Exams today",
      value: String(stats?.exams_today ?? 0),
      sub: "this date",
      spark: sparkExams,
      tone: "oklch(0.35 0.10 295)",
    },
    {
      label: "Next 7 days",
      value: stats?.exams_next_7_days != null ? String(stats.exams_next_7_days) : "—",
      sub: "upcoming",
      spark: sparkExams,
      tone: "oklch(0.35 0.10 295)",
    },
    {
      label: "Invigilators",
      value: String(stats?.available_invigilators ?? 0),
      sub: "available now",
      spark: sparkInvig,
      tone: "oklch(0.35 0.10 165)",
    },
    {
      label: "Rooms",
      value: `${stats?.rooms_in_use_today ?? 0}`,
      sub: "in use today",
      spark: sparkRooms,
      tone: "oklch(0.40 0.14 60)",
    },
    {
      label: "Conflicts",
      value: String(stats?.conflicts.length ?? 0),
      sub: "active",
      spark: sparkConflicts,
      tone: "oklch(0.40 0.17 20)",
    },
    {
      label: "Free rooms",
      value: String(stats?.rooms_free_today ?? 0),
      sub: "available today",
      spark: sparkRooms,
      tone: "oklch(0.40 0.14 60)",
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <h2 className="text-display text-[36px]">Exam ledger</h2>
          <span className="text-sm text-muted-foreground">
            Data-dense overview for heavy scheduling days.
          </span>
        </div>
        <div className="flex items-center gap-2">
          <VariantSwitcher variant={variant} onVariant={onVariant} />
          <button className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-muted text-[13px] font-medium hover:bg-muted/70 transition-colors">
            <Download className="size-3.5" strokeWidth={1.75} />
            Export
          </button>
          <button className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full bg-primary text-primary-foreground text-[13px] font-medium hover:opacity-90 transition-opacity">
            <Plus className="size-3.5" strokeWidth={2} />
            New exam
          </button>
        </div>
      </div>

      {/* 6-KPI strip */}
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <div className="grid" style={{ gridTemplateColumns: "repeat(6, 1fr)" }}>
          {kpis.map((k, i) => (
            <div
              key={k.label}
              className="p-4"
              style={{
                borderRight: i < 5 ? "1px solid var(--border)" : "none",
              }}
            >
              <div className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                {k.label}
              </div>
              <div className="flex items-baseline gap-1.5 mt-1.5">
                <span className="text-display text-2xl">{k.value}</span>
              </div>
              <div className="text-[10px] text-muted-foreground mb-1">{k.sub}</div>
              <Sparkline data={k.spark} color={k.tone} height={20} />
            </div>
          ))}
        </div>
      </div>

      {/* Main split */}
      <div
        className="grid gap-3 items-start"
        style={{ gridTemplateColumns: "minmax(0, 2.1fr) minmax(0, 1fr)" }}
      >
        <div className="flex flex-col gap-3">
          {/* Filter bar */}
          <div className="rounded-2xl border border-border bg-card p-3">
            <div className="flex flex-wrap items-center gap-2">
              <div className="inline-flex rounded-full bg-muted p-0.5 gap-0.5">
                {(["today", "week", "all"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTab(t)}
                    className={[
                      "h-7 px-3 rounded-full text-[12px] font-medium transition-colors capitalize",
                      tab === t
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground",
                    ].join(" ")}
                  >
                    {t === "all" ? "Upcoming" : t === "today" ? "Today" : "This week"}
                  </button>
                ))}
              </div>
              <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                Slot: all
              </span>
              <span className="rounded-full border border-border px-2.5 py-0.5 text-[11px] font-semibold text-muted-foreground">
                Status: all
              </span>
              <button className="ml-auto inline-flex items-center gap-1.5 h-7 px-2.5 rounded-full text-[12px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <Filter className="size-3" strokeWidth={1.75} />
                Add filter
              </button>
            </div>
          </div>

          {/* Dense table */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {isLoading ? (
              <div className="divide-y divide-border/60">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-5 py-2.5">
                    <div className="h-3.5 w-48 rounded bg-muted animate-pulse" />
                    <div className="h-5 w-16 rounded-full bg-muted animate-pulse ml-auto" />
                  </div>
                ))}
              </div>
            ) : exams.length === 0 ? (
              <p className="px-5 py-10 text-center text-sm text-muted-foreground">No exams found</p>
            ) : (
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-muted/60 border-b border-border">
                    {["Exam", "Date", "Slot", "Time", "Rooms", "Seats", "Coverage", "Status", ""].map(
                      (h, i) => (
                        <th
                          key={i}
                          className={[
                            "px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground",
                            i >= 3 && i <= 5 ? "hidden md:table-cell" : "",
                            i === 6 ? "hidden lg:table-cell min-w-[140px]" : "",
                            i === 8 ? "w-10" : "",
                          ]
                            .filter(Boolean)
                            .join(" ")}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {exams.map((exam) => {
                    const cov = coveragePct(exam);
                    const hasConflict = stats?.conflicts.some(
                      (c) => c.exam_id === exam.id
                    );
                    const barColor =
                      cov != null && cov >= 95
                        ? "bg-pastel-pink"
                        : cov != null && cov >= 85
                        ? "bg-pastel-peach"
                        : "bg-pastel-mint";
                    return (
                      <tr key={exam.id} className="transition-colors hover:bg-muted/40">
                        <td className="px-4 py-2.5 font-semibold">{exam.exam_name}</td>
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground">
                          {format(new Date(exam.exam_date), "d MMM")}
                        </td>
                        <td className="px-4 py-2.5">
                          <Badge variant={exam.time_slot === "morning" ? "peach" : "lavender"}>
                            {exam.time_slot}
                          </Badge>
                        </td>
                        <td className="px-4 py-2.5 font-mono text-xs text-muted-foreground hidden md:table-cell">
                          {exam.time_slot === "morning" ? "09:00–12:00" : "14:00–17:00"}
                        </td>
                        <td className="px-4 py-2.5 hidden md:table-cell">
                          {exam.assignments?.length ?? 0}
                        </td>
                        <td className="px-4 py-2.5 font-mono hidden md:table-cell">
                          {exam.assignments?.reduce((s, a) => s + (a.seats ?? 0), 0) ?? 0}
                        </td>
                        <td className="px-4 py-2.5 hidden lg:table-cell">
                          {cov == null ? (
                            <span className="font-mono text-xs text-muted-foreground">—</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded-full bg-black/[0.08] overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${barColor}`}
                                  style={{ width: `${cov}%` }}
                                />
                              </div>
                              <span className="font-mono text-xs w-8 text-right">{cov}%</span>
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          {hasConflict ? (
                            <span className="inline-flex items-center gap-1 rounded-full bg-pastel-pink text-pastel-fg px-2 py-0.5 text-[11px] font-semibold">
                              <AlertCircle className="size-2.5" strokeWidth={2} />
                              Conflict
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 rounded-full bg-pastel-mint text-pastel-fg px-2 py-0.5 text-[11px] font-semibold">
                              <CheckCircle className="size-2.5" strokeWidth={2} />
                              Ready
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-2.5">
                          <button
                            className="flex size-7 items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground"
                            aria-label="More options"
                          >
                            <MoreHorizontal className="size-3.5" strokeWidth={1.75} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <ConflictAlerts conflicts={stats?.conflicts ?? []} />
          <WorkloadPanel />
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
