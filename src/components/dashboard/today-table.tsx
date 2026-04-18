"use client";

import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { MoreHorizontal } from "lucide-react";
import api from "@/lib/api";
import { Badge } from "@/components/ui/badge";
import type { ExamListResponse } from "@/types";

export function TodayTable() {
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
  const totalRooms = exams.reduce(
    (s, e) => s + (e.assignments?.length ?? 0),
    0
  );
  const totalStudents = exams.reduce(
    (s, e) =>
      s + (e.assignments?.reduce((r, a) => r + (a.seats ?? 0), 0) ?? 0),
    0
  );

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      <div className="flex items-center gap-3 px-5 pt-[18px] pb-2">
        <h2 className="text-base font-semibold tracking-tight">Today&apos;s schedule</h2>
        {!isLoading && (
          <span className="ml-auto text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {exams.length} exams
            {totalRooms > 0 && ` · ${totalRooms} rooms`}
            {totalStudents > 0 && ` · ${totalStudents} students`}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="divide-y divide-border/60">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center justify-between px-5 py-2.5">
              <div className="h-3.5 w-48 rounded bg-muted animate-pulse" />
              <div className="h-5 w-16 rounded-full bg-muted animate-pulse" />
            </div>
          ))}
        </div>
      ) : exams.length === 0 ? (
        <p className="px-5 py-8 text-center text-sm text-muted-foreground">
          No exams scheduled for today
        </p>
      ) : (
        <table className="w-full text-[13px]">
          <thead>
            <tr className="bg-muted/60 border-b border-border">
              <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                Exam
              </th>
              <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
                Slot
              </th>
              <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground hidden sm:table-cell">
                Time
              </th>
              <th className="px-5 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-muted-foreground hidden md:table-cell">
                Rooms
              </th>
              <th className="w-10" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border/60">
            {exams.map((exam) => (
              <tr
                key={exam.id}
                className="transition-colors hover:bg-muted/40"
              >
                <td className="px-5 py-2.5 font-semibold">{exam.exam_name}</td>
                <td className="px-5 py-2.5">
                  <Badge variant={exam.time_slot === "morning" ? "peach" : "lavender"}>
                    {exam.time_slot}
                  </Badge>
                </td>
                <td className="px-5 py-2.5 font-mono text-xs text-muted-foreground hidden sm:table-cell">
                  {exam.time_slot === "morning" ? "09:00–12:00" : "14:00–17:00"}
                </td>
                <td className="px-5 py-2.5 hidden md:table-cell">
                  {exam.assignments?.length ?? 0}
                </td>
                <td className="px-5 py-2.5">
                  <button
                    className="flex size-7 items-center justify-center rounded-full hover:bg-muted transition-colors text-muted-foreground"
                    aria-label="More options"
                  >
                    <MoreHorizontal className="size-3.5" strokeWidth={1.75} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
