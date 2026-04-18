"use client";

import { useQuery } from "@tanstack/react-query";
import { format, startOfWeek, addDays, endOfWeek } from "date-fns";
import api from "@/lib/api";
import type { Exam, ExamListResponse } from "@/types";

function getWeekDays(from: Date) {
  return Array.from({ length: 7 }, (_, i) => addDays(from, i));
}

const TONE_CLASSES: Record<string, string> = {
  morning: "bg-pastel-peach text-pastel-fg",
  evening: "bg-pastel-lavender text-pastel-fg",
};

interface WeekTimelineProps {
  compact?: boolean;
}

export function WeekTimeline({ compact = false }: WeekTimelineProps) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const weekEnd = endOfWeek(today, { weekStartsOn: 1 });
  const weekDays = getWeekDays(weekStart);

  const { data, isLoading } = useQuery<ExamListResponse>({
    queryKey: ["exams", "week", format(weekStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const res = await api.get<ExamListResponse>("/api/exams", {
        params: {
          start_date: format(weekStart, "yyyy-MM-dd"),
          end_date: format(weekEnd, "yyyy-MM-dd"),
          limit: 200,
        },
      });
      return res.data;
    },
    staleTime: 60_000,
  });

  const exams = data?.data ?? [];

  function examsForDay(day: Date, slot: "morning" | "evening"): Exam[] {
    const dateStr = format(day, "yyyy-MM-dd");
    return exams.filter(
      (e) => e.exam_date === dateStr && e.time_slot === slot
    );
  }

  const morningCount = exams.filter((e) => e.time_slot === "morning").length;
  const eveningCount = exams.filter((e) => e.time_slot === "evening").length;

  const cellHeight = compact ? "h-9" : "h-12";

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-base font-semibold tracking-tight">This week</h2>
        <div className="ml-auto flex items-center gap-1 rounded-full bg-muted p-0.5">
          <button className="h-7 px-3 rounded-full bg-card text-[12px] font-semibold text-foreground shadow-sm">
            Week
          </button>
          <button className="h-7 px-3 rounded-full text-[12px] font-medium text-muted-foreground">
            Month
          </button>
        </div>
      </div>

      <div
        className="grid gap-2.5 items-start"
        style={{ gridTemplateColumns: "88px 1fr 48px" }}
      >
        {/* Header row */}
        <div />
        <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
          {weekDays.map((day, i) => {
            const isToday = format(day, "yyyy-MM-dd") === format(today, "yyyy-MM-dd");
            return (
              <div
                key={i}
                className="text-center text-[10px] font-semibold uppercase tracking-[0.08em] py-1 border-b border-border rounded-sm"
                style={{
                  background: isToday ? "var(--muted)" : "transparent",
                  color: isToday ? "var(--foreground)" : "var(--muted-foreground)",
                  fontWeight: isToday ? 700 : 600,
                }}
              >
                {format(day, "EEE d")}
              </div>
            );
          })}
        </div>
        <div />

        {/* Morning row */}
        <div className="text-right pr-3">
          <div className="text-[11px] font-semibold text-muted-foreground">Morning</div>
          <div className="text-[10px] text-muted-foreground opacity-70">09:00–12:00</div>
        </div>
        <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
          {weekDays.map((day, i) => {
            const items = examsForDay(day, "morning");
            return (
              <div
                key={i}
                className={`relative ${cellHeight} rounded-xl bg-muted p-0.5 flex flex-col gap-0.5 overflow-hidden`}
              >
                {isLoading ? (
                  <div className="h-full rounded-lg bg-muted/50 animate-pulse" />
                ) : (
                  items.map((e, j) => (
                    <div
                      key={j}
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold overflow-hidden flex items-center flex-1 ${TONE_CLASSES.morning}`}
                      style={{ whiteSpace: "nowrap", textOverflow: "ellipsis" }}
                    >
                      <span className="truncate">{e.exam_name}</span>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
        <div className="text-center">
          <span className="text-display text-xl">{morningCount}</span>
          <div className="text-[10px] text-muted-foreground">exams</div>
        </div>

        {/* Evening row */}
        <div className="text-right pr-3">
          <div className="text-[11px] font-semibold text-muted-foreground">Evening</div>
          <div className="text-[10px] text-muted-foreground opacity-70">14:00–17:00</div>
        </div>
        <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
          {weekDays.map((day, i) => {
            const items = examsForDay(day, "evening");
            return (
              <div
                key={i}
                className={`relative ${cellHeight} rounded-xl bg-muted p-0.5 flex flex-col gap-0.5 overflow-hidden`}
              >
                {isLoading ? (
                  <div className="h-full rounded-lg bg-muted/50 animate-pulse" />
                ) : (
                  items.map((e, j) => (
                    <div
                      key={j}
                      className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold overflow-hidden flex items-center flex-1 ${TONE_CLASSES.evening}`}
                      style={{ whiteSpace: "nowrap", textOverflow: "ellipsis" }}
                    >
                      <span className="truncate">{e.exam_name}</span>
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
        <div className="text-center">
          <span className="text-display text-xl">{eveningCount}</span>
          <div className="text-[10px] text-muted-foreground">exams</div>
        </div>
      </div>
    </div>
  );
}
