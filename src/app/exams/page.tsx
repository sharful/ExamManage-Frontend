"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { format, isSameDay, startOfMonth, endOfMonth } from "date-fns";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, BookOpen } from "lucide-react";
import { useExams } from "@/hooks/use-exams";
import { AppShell } from "@/components/layout/app-shell";
import { ExamCalendar, ExamDayList } from "@/components/exams/exam-calendar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { Exam } from "@/types";

// ── Page ───────────────────────────────────────────────────────────────────

export default function ExamsPage() {
  const router = useRouter();
  const [viewDate, setViewDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // Fetch exams for the displayed month using date range filter (server-side)
  const monthStart = format(startOfMonth(viewDate), "yyyy-MM-dd");
  const monthEnd = format(endOfMonth(viewDate), "yyyy-MM-dd");
  const { data, isLoading, isError } = useExams({
    date_from: monthStart,
    date_to: monthEnd,
    limit: 200,
  });

  const allExams: Exam[] = useMemo(() => data?.data ?? [], [data]);

  const selectedDayExams = useMemo(() => {
    if (!selectedDate) return [];
    return allExams.filter((e) =>
      isSameDay(new Date(e.exam_date + "T00:00:00"), selectedDate)
    );
  }, [allExams, selectedDate]);

  function handleDaySelect(date: Date) {
    setSelectedDate((prev) =>
      prev && isSameDay(prev, date) ? null : date
    );
  }

  return (
    <AppShell>
      {/* Page header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-display text-3xl sm:text-4xl">Exams</h1>
        <Button
          className="hidden sm:inline-flex"
          onClick={() => router.push("/exams/new")}
        >
          <Plus />
          New exam
        </Button>
      </div>

      {isLoading ? (
        <div className="flex flex-col gap-4 lg:flex-row lg:gap-6 lg:items-start">
          <div className="lg:flex-1 space-y-3">
            <Skeleton className="h-8 w-full rounded-2xl" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
          <div className="lg:w-72 xl:w-80 space-y-2">
            <Skeleton className="h-10 w-full rounded-2xl" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full rounded-2xl" />
            ))}
          </div>
        </div>
      ) : isError ? (
        <div className="flex items-center justify-center py-20 text-destructive text-sm">
          Failed to load exams. Please try again.
        </div>
      ) : (
        <div className="flex flex-col gap-4 lg:flex-row lg:gap-6 lg:items-start">
          {/* Calendar column */}
          <div className="lg:flex-1">
            {/* Desktop calendar */}
            <div className="hidden sm:block">
              <ExamCalendar
                exams={allExams}
                viewDate={viewDate}
                selectedDate={selectedDate}
                onMonthChange={setViewDate}
                onDaySelect={handleDaySelect}
              />
            </div>

            {/* Mobile day list */}
            <div className="sm:hidden">
              <ExamDayList
                exams={allExams}
                viewDate={viewDate}
                selectedDate={selectedDate}
                onMonthChange={setViewDate}
                onDaySelect={handleDaySelect}
              />
            </div>
          </div>

          {/* Selected-day exam list (desktop side panel / below on mobile) */}
          <div className="lg:w-72 xl:w-80">
            <div className="rounded-2xl border border-border bg-card overflow-hidden">
              <div className="px-4 py-3 border-b border-border">
                <p className="text-sm font-semibold">
                  {selectedDate
                    ? format(selectedDate, "EEEE, d MMMM yyyy")
                    : "Select a date"}
                </p>
              </div>

              {!selectedDate ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">
                  Click a day on the calendar to see exams.
                </p>
              ) : selectedDayExams.length === 0 ? (
                <p className="px-4 py-6 text-sm text-muted-foreground">
                  No exams on this day.
                </p>
              ) : (
                <ul className="divide-y divide-border">
                  {selectedDayExams.map((exam) => (
                    <li key={exam.id}>
                      <button
                        type="button"
                        onClick={() => router.push(`/exams/${exam.id}`)}
                        className="w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors"
                      >
                        <BookOpen className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">
                            {exam.exam_name}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <Badge
                              variant={
                                exam.time_slot === "morning"
                                  ? "peach"
                                  : "lavender"
                              }
                              className="text-xs"
                            >
                              {exam.time_slot}
                            </Badge>
                            {exam.assignments && (
                              <span className="text-xs text-muted-foreground">
                                {exam.assignments.length} room
                                {exam.assignments.length !== 1 ? "s" : ""}
                              </span>
                            )}
                          </div>
                        </div>
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {selectedDate && (
                <div className="px-4 py-3 border-t border-border">
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={() => {
                      const dateParam = format(selectedDate, "yyyy-MM-dd");
                      router.push(`/exams/new?date=${dateParam}`);
                    }}
                  >
                    <Plus />
                    New exam on this day
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Mobile FAB */}
      <button
        type="button"
        onClick={() => router.push("/exams/new")}
        className={cn(
          "fixed bottom-20 right-4 z-40 sm:hidden",
          "flex size-14 items-center justify-center rounded-full",
          "bg-primary text-primary-foreground shadow-lg",
          "hover:bg-primary/90 active:scale-95 transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
        aria-label="New exam"
      >
        <Plus className="size-6" />
      </button>
    </AppShell>
  );
}
