"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import api from "@/lib/api";
import type { Exam, ExamListResponse } from "@/types";

const HOURS = [7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20];
const RANGE = HOURS.length - 1;

function toPct(h: number, m = 0) {
  return (((h - 7) + m / 60) / RANGE) * 100;
}

function nowPct() {
  const now = new Date();
  return toPct(now.getHours(), now.getMinutes());
}

function formatHour(h: number) {
  const suffix = h < 12 ? "a" : "p";
  const display = h % 12 === 0 ? 12 : h % 12;
  return `${display}${suffix}`;
}

interface Lane {
  label: string;
  start: number;
  end: number;
  tone: string;
}

function buildLanes(exams: Exam[]): Lane[][] {
  const lanes: Lane[][] = [[], [], []];
  const morningExams = exams.filter((e) => e.time_slot === "morning");
  const eveningExams = exams.filter((e) => e.time_slot === "evening");

  morningExams.slice(0, 2).forEach((e, i) => {
    lanes[i].push({ label: e.exam_name, start: 9, end: 12, tone: "peach" });
  });
  eveningExams.slice(0, 2).forEach((e, i) => {
    lanes[i].push({ label: e.exam_name, start: 14, end: 17, tone: "lavender" });
  });
  morningExams.slice(2, 3).forEach((e) => {
    lanes[2].push({ label: e.exam_name, start: 9, end: 12, tone: "amber" });
  });

  return lanes;
}

const TONE_CLASSES: Record<string, string> = {
  peach: "bg-pastel-peach text-pastel-fg",
  lavender: "bg-pastel-lavender text-pastel-fg",
  amber: "bg-pastel-amber text-pastel-fg",
};

export function TodayTimeline() {
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
    staleTime: 30_000,
  });

  const exams = data?.data ?? [];
  const lanes = buildLanes(exams);
  const totalLaneCapacity = 5; // 2 morning + 2 evening + 1 morning overflow
  const overflowCount = Math.max(0, exams.length - totalLaneCapacity);
  const pctNow = nowPct();
  const showNow = pctNow >= 0 && pctNow <= 100;

  // Local timezone abbreviation, e.g. "PKT" or "GMT+5". Falls back to offset.
  const tzLabel = (() => {
    try {
      const parts = new Intl.DateTimeFormat(undefined, {
        timeZoneName: "short",
      }).formatToParts(new Date());
      return parts.find((p) => p.type === "timeZoneName")?.value ?? "Local";
    } catch {
      return "Local";
    }
  })();

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-base font-semibold tracking-tight">Today · at the clock</h2>
        <span className="flex items-center gap-1.5 rounded-full border border-border px-2.5 py-0.5 text-[11px] font-semibold">
          <span className="size-1.5 rounded-full bg-destructive inline-block" />
          Live
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          ({tzLabel})
        </span>
        <span className="ml-auto text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
          {format(new Date(), "EEEE, d MMM")}
        </span>
      </div>

      <div className="relative">
        {/* Hour scale */}
        <div className="relative h-4 border-b border-border mb-2">
          {HOURS.map((h, i) => (
            <span
              key={h}
              className="absolute text-[10px] font-semibold text-muted-foreground -translate-x-1/2"
              style={{ left: `${(i / RANGE) * 100}%` }}
            >
              {formatHour(h)}
            </span>
          ))}
        </div>

        {/* Lanes */}
        {isLoading
          ? [0, 1, 2].map((i) => (
              <div
                key={i}
                className="relative h-10 rounded-xl bg-muted animate-pulse mb-1.5"
              />
            ))
          : lanes.map((lane, laneIdx) => (
              <div
                key={laneIdx}
                className="relative h-10 rounded-xl bg-muted mb-1.5 overflow-hidden"
              >
                {lane.map((block, bIdx) => (
                  <div
                    key={bIdx}
                    title={block.label}
                    className={`absolute top-1 bottom-1 rounded-full flex items-center gap-2 px-3 text-[12px] font-semibold overflow-hidden shadow-[inset_0_0_0_1px_rgba(0,0,0,0.04)] ${TONE_CLASSES[block.tone] ?? "bg-muted"}`}
                    style={{
                      left: `${toPct(block.start)}%`,
                      width: `${toPct(block.end) - toPct(block.start)}%`,
                    }}
                  >
                    <span className="truncate">{block.label}</span>
                  </div>
                ))}
              </div>
            ))}

        {/* Overflow notice — keeps the user honest about what's NOT shown */}
        {!isLoading && overflowCount > 0 && (
          <p className="mt-1 text-[11px] font-medium text-muted-foreground">
            +{overflowCount} more exam{overflowCount === 1 ? "" : "s"} not shown.
            See the schedule table below.
          </p>
        )}

        {/* Now indicator */}
        {showNow && (
          <div
            className="absolute top-4 bottom-0 w-0.5 bg-destructive pointer-events-none"
            style={{ left: `${pctNow}%` }}
          >
            <span className="absolute -top-6 -translate-x-1/2 whitespace-nowrap bg-destructive text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
              {format(new Date(), "HH:mm")}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
