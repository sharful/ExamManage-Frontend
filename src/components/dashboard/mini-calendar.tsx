"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { format, startOfMonth, endOfMonth, getDaysInMonth, getDay, addMonths, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import api from "@/lib/api";
import type { ExamListResponse } from "@/types";

function getDayOffset(date: Date): number {
  const day = getDay(startOfMonth(date));
  return day === 0 ? 6 : day - 1;
}

export function MiniCalendar() {
  const [current, setCurrent] = useState(() => new Date());
  const today = new Date();
  const todayStr = format(today, "yyyy-MM-dd");

  const monthStart = startOfMonth(current);
  const monthEnd = endOfMonth(current);

  const { data } = useQuery<ExamListResponse>({
    queryKey: ["exams", "month", format(current, "yyyy-MM")],
    queryFn: async () => {
      const res = await api.get<ExamListResponse>("/api/exams", {
        params: {
          start_date: format(monthStart, "yyyy-MM-dd"),
          end_date: format(monthEnd, "yyyy-MM-dd"),
          limit: 200,
        },
      });
      return res.data;
    },
    staleTime: 60_000,
  });

  const examDates = new Set(
    (data?.data ?? []).map((e) => e.exam_date.slice(0, 10))
  );

  const daysInMonth = getDaysInMonth(current);
  const offset = getDayOffset(current);
  const prevDays = getDaysInMonth(subMonths(current, 1));

  const cells: Array<{ d: number; other: boolean; dateStr: string }> = [];
  for (let i = offset - 1; i >= 0; i--) {
    const d = prevDays - i;
    cells.push({ d, other: true, dateStr: format(subMonths(monthStart, 0), `yyyy-MM-${String(d).padStart(2, "0")}`) });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    cells.push({ d, other: false, dateStr: format(current, `yyyy-MM-${String(d).padStart(2, "0")}`) });
  }
  let next = 1;
  while (cells.length < 35) {
    cells.push({ d: next++, other: true, dateStr: "" });
  }

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <h2 className="text-base font-semibold tracking-tight">{format(current, "MMMM yyyy")}</h2>
        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => setCurrent((c) => subMonths(c, 1))}
            className="flex size-7 items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground"
            aria-label="Previous month"
          >
            <ChevronLeft className="size-3.5" strokeWidth={1.75} />
          </button>
          <button
            onClick={() => setCurrent((c) => addMonths(c, 1))}
            className="flex size-7 items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground"
            aria-label="Next month"
          >
            <ChevronRight className="size-3.5" strokeWidth={1.75} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
          <div
            key={i}
            className="text-center text-[9px] font-semibold uppercase tracking-widest text-muted-foreground py-1"
          >
            {d}
          </div>
        ))}
        {cells.map((cell, i) => {
          const isToday = cell.dateStr === todayStr;
          const hasExam = !cell.other && examDates.has(cell.dateStr);
          return (
            <div
              key={i}
              className={[
                "relative flex flex-col items-center justify-center rounded-md py-1 gap-0.5 cursor-pointer text-[11px] transition-colors",
                cell.other ? "opacity-30 text-muted-foreground" : "",
                isToday
                  ? "bg-primary text-primary-foreground font-bold"
                  : hasExam
                  ? "hover:bg-muted"
                  : "hover:bg-muted",
              ]
                .filter(Boolean)
                .join(" ")}
            >
              {cell.d}
              {hasExam && !isToday && (
                <span className="absolute bottom-0.5 size-1 rounded-full bg-destructive" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
