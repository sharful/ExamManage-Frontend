"use client";

import { useMemo } from "react";
import { format } from "date-fns";
import type { Exam, TimeSlot } from "@/types";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";

interface ExamSelectorProps {
  date: string;
  slot: TimeSlot;
  examId: string | null;
  exams: Exam[];
  isLoading?: boolean;
  onDateChange: (d: string) => void;
  onSlotChange: (s: TimeSlot) => void;
  onExamChange: (id: string | null) => void;
}

export function ExamSelector({
  date,
  slot,
  examId,
  exams,
  isLoading,
  onDateChange,
  onSlotChange,
  onExamChange,
}: ExamSelectorProps) {
  const filteredExams = useMemo(
    () => exams.filter((e) => e.time_slot === slot),
    [exams, slot]
  );

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[180px_160px_1fr]">
      <div className="flex flex-col gap-1">
        <label htmlFor="planner-date" className="text-xs font-medium text-muted-foreground">
          Date
        </label>
        <Input
          id="planner-date"
          type="date"
          value={date}
          onChange={(e) => onDateChange(e.target.value)}
        />
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="planner-slot" className="text-xs font-medium text-muted-foreground">
          Time slot
        </label>
        <Select
          id="planner-slot"
          value={slot}
          onChange={(e) => onSlotChange(e.target.value as TimeSlot)}
        >
          <option value="morning">Morning</option>
          <option value="evening">Evening</option>
        </Select>
      </div>

      <div className="flex flex-col gap-1">
        <label htmlFor="planner-exam" className="text-xs font-medium text-muted-foreground">
          Exam
          {filteredExams.length > 0 && (
            <span className="ml-1 text-muted-foreground/70 font-normal">
              ({filteredExams.length} on {format(new Date(date), "MMM d")})
            </span>
          )}
        </label>
        <Select
          id="planner-exam"
          value={examId ?? ""}
          disabled={isLoading || filteredExams.length === 0}
          onChange={(e) => onExamChange(e.target.value || null)}
        >
          <option value="">
            {isLoading
              ? "Loading…"
              : filteredExams.length === 0
                ? "No exams on this date/slot"
                : "Select exam…"}
          </option>
          {filteredExams.map((exam) => (
            <option key={exam.id} value={exam.id}>
              {exam.exam_name}
            </option>
          ))}
        </Select>
      </div>
    </div>
  );
}
