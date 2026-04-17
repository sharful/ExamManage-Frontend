"use client";

import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  addMonths,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Exam } from "@/types";

// ── Types ──────────────────────────────────────────────────────────────────

interface ExamCalendarProps {
  exams: Exam[];
  viewDate: Date;
  selectedDate: Date | null;
  onMonthChange: (date: Date) => void;
  onDaySelect: (date: Date) => void;
}

// ── Desktop month calendar ─────────────────────────────────────────────────

export function ExamCalendar({
  exams,
  viewDate,
  selectedDate,
  onMonthChange,
  onDaySelect,
}: ExamCalendarProps) {
  const monthStart = startOfMonth(viewDate);
  const monthEnd = endOfMonth(viewDate);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 0 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });

  const examsByDate = new Map<string, Exam[]>();
  for (const exam of exams) {
    const key = exam.exam_date;
    if (!examsByDate.has(key)) examsByDate.set(key, []);
    examsByDate.get(key)!.push(exam);
  }

  const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="rounded-2xl border border-border bg-card overflow-hidden">
      {/* Calendar header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onMonthChange(subMonths(viewDate, 1))}
          aria-label="Previous month"
        >
          <ChevronLeft />
        </Button>
        <span className="text-sm font-semibold">
          {format(viewDate, "MMMM yyyy")}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onMonthChange(addMonths(viewDate, 1))}
          aria-label="Next month"
        >
          <ChevronRight />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 border-b border-border">
        {WEEKDAYS.map((d) => (
          <div
            key={d}
            className="py-2 text-center text-xs font-medium text-muted-foreground"
          >
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = format(day, "yyyy-MM-dd");
          const dayExams = examsByDate.get(key) ?? [];
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const isCurrentMonth = isSameMonth(day, viewDate);
          const isTodayDay = isToday(day);

          return (
            <button
              key={key}
              type="button"
              onClick={() => onDaySelect(day)}
              className={cn(
                "relative min-h-[72px] p-1.5 text-left border-b border-r border-border last:border-r-0",
                "hover:bg-muted/50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
                isSelected && "bg-muted ring-2 ring-inset ring-primary",
                !isCurrentMonth && "opacity-40"
              )}
            >
              <span
                className={cn(
                  "flex size-6 items-center justify-center rounded-full text-xs font-medium mb-1",
                  isTodayDay &&
                    "bg-primary text-primary-foreground",
                  !isTodayDay && "text-foreground"
                )}
              >
                {format(day, "d")}
              </span>

              {/* Exam blocks — show up to 2, then "+N more" */}
              <div className="flex flex-col gap-0.5">
                {dayExams.slice(0, 2).map((exam) => (
                  <span
                    key={exam.id}
                    className={cn(
                      "truncate rounded-md px-1.5 py-0.5 text-[10px] font-medium leading-tight text-pastel-fg",
                      exam.time_slot === "morning"
                        ? "bg-pastel-peach"
                        : "bg-pastel-lavender"
                    )}
                    title={`${exam.exam_name} (${exam.time_slot})`}
                  >
                    {exam.exam_name}
                  </span>
                ))}
                {dayExams.length > 2 && (
                  <span className="text-[10px] text-muted-foreground pl-1">
                    +{dayExams.length - 2} more
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Mobile day-list view ───────────────────────────────────────────────────

interface ExamDayListProps {
  exams: Exam[];
  viewDate: Date;
  selectedDate: Date | null;
  onMonthChange: (date: Date) => void;
  onDaySelect: (date: Date) => void;
}

export function ExamDayList({
  exams,
  viewDate,
  selectedDate,
  onMonthChange,
  onDaySelect,
}: ExamDayListProps) {
  // Group exams by date
  const grouped = new Map<string, Exam[]>();
  for (const exam of exams) {
    if (!grouped.has(exam.exam_date)) grouped.set(exam.exam_date, []);
    grouped.get(exam.exam_date)!.push(exam);
  }

  // Sorted date keys for the current month
  const monthKey = format(viewDate, "yyyy-MM");
  const sortedKeys = [...grouped.keys()]
    .filter((k) => k.startsWith(monthKey))
    .sort();

  return (
    <div className="flex flex-col gap-3">
      {/* Month navigator */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onMonthChange(subMonths(viewDate, 1))}
          aria-label="Previous month"
        >
          <ChevronLeft />
        </Button>
        <span className="text-sm font-semibold">
          {format(viewDate, "MMMM yyyy")}
        </span>
        <Button
          variant="outline"
          size="icon-sm"
          onClick={() => onMonthChange(addMonths(viewDate, 1))}
          aria-label="Next month"
        >
          <ChevronRight />
        </Button>
      </div>

      {sortedKeys.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No exams this month.
        </p>
      ) : (
        sortedKeys.map((dateKey) => {
          const dayExams = grouped.get(dateKey)!;
          const date = new Date(dateKey + "T00:00:00");
          const isSelected = selectedDate
            ? isSameDay(date, selectedDate)
            : false;

          return (
            <div key={dateKey}>
              <button
                type="button"
                onClick={() => onDaySelect(date)}
                className={cn(
                  "w-full flex items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors",
                  isSelected
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border hover:bg-muted"
                )}
              >
                <div className="text-center min-w-[36px]">
                  <p className="text-xs text-muted-foreground uppercase">
                    {format(date, "EEE")}
                  </p>
                  <p
                    className={cn(
                      "text-lg font-bold leading-tight",
                      isToday(date) && "text-primary"
                    )}
                  >
                    {format(date, "d")}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  {dayExams.map((exam) => (
                    <div key={exam.id} className="truncate text-sm">
                      <span className="font-medium">{exam.exam_name}</span>
                      <span className="ml-1.5 text-xs text-muted-foreground capitalize">
                        {exam.time_slot}
                      </span>
                    </div>
                  ))}
                </div>
                <span className={cn(
                  "shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium",
                  isSelected
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "bg-pastel-peach text-pastel-fg"
                )}>
                  {dayExams.length}
                </span>
              </button>
            </div>
          );
        })
      )}
    </div>
  );
}
