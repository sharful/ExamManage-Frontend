"use client";

import Link from "next/link";
import { format, isAfter, parseISO, startOfDay } from "date-fns";
import { Calendar, AlertTriangle, User, ArrowUpRight } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useDashboard } from "@/hooks/use-dashboard";
import { useExams } from "@/hooks/use-exams";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Exam } from "@/types";

export function WidgetRail() {
  const { user } = useAuth();
  const { data: dashboard } = useDashboard();

  const today = format(new Date(), "yyyy-MM-dd");
  const nextMonth = format(
    new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    "yyyy-MM-dd"
  );
  const { data: examsData } = useExams({
    date_from: today,
    date_to: nextMonth,
    limit: 50,
  });

  const upcoming: Exam[] = (examsData?.data ?? [])
    .filter((e) => {
      const d = startOfDay(parseISO(e.exam_date));
      return !isAfter(startOfDay(new Date()), d);
    })
    .slice(0, 3);

  return (
    <aside className="hidden xl:flex w-80 shrink-0 flex-col gap-3 p-3 pl-0">
      <Card tone="lavender" className="p-5">
        <div className="flex items-center gap-3">
          <div className="flex size-12 items-center justify-center rounded-full bg-card/60">
            <User className="size-5" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <p className="text-xs opacity-70">Signed in as</p>
            <p className="text-base font-semibold truncate">
              {user?.username ?? "Admin"}
            </p>
          </div>
        </div>
      </Card>

      <Card tone="peach" className="p-5">
        <p className="text-xs font-medium opacity-70 mb-3">Today at a glance</p>
        <div className="flex items-end justify-between gap-3">
          <div>
            <p className="text-display text-4xl">
              {dashboard?.exams_today ?? 0}
            </p>
            <p className="text-xs opacity-80 flex items-center gap-1 mt-1">
              <Calendar className="size-3" strokeWidth={2} />
              Exams today
            </p>
          </div>
          <div className="text-right">
            <p className="text-display text-4xl">
              {dashboard?.conflicts.length ?? 0}
            </p>
            <p className="text-xs opacity-80 flex items-center gap-1 justify-end mt-1">
              <AlertTriangle className="size-3" strokeWidth={2} />
              Conflicts
            </p>
          </div>
        </div>
      </Card>

      <Card tone="mint" className="p-5 flex-1 min-h-0">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-medium opacity-70">Upcoming</p>
          <Link
            href="/exams"
            className="text-xs font-medium inline-flex items-center gap-0.5 hover:opacity-70"
          >
            View all
            <ArrowUpRight className="size-3" strokeWidth={2} />
          </Link>
        </div>

        {upcoming.length === 0 ? (
          <p className="text-sm opacity-70">No upcoming exams.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {upcoming.map((exam) => (
              <li key={exam.id}>
                <Link
                  href={`/exams/${exam.id}`}
                  className="flex flex-col gap-1 rounded-xl bg-card/50 px-3 py-2.5 hover:bg-card/80 transition-colors"
                >
                  <span className="text-sm font-semibold truncate">
                    {exam.exam_name}
                  </span>
                  <span className="flex items-center gap-2 text-xs opacity-80">
                    <span>
                      {format(parseISO(exam.exam_date), "EEE, d MMM")}
                    </span>
                    <Badge
                      variant={
                        exam.time_slot === "morning" ? "peach" : "lavender"
                      }
                      className="text-[10px]"
                    >
                      {exam.time_slot}
                    </Badge>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </aside>
  );
}
