"use client";

import { useMemo, useState } from "react";
import { format } from "date-fns";
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { LayoutGrid } from "lucide-react";
import type { Invigilator, TimeSlot } from "@/types";
import {
  useAvailableInvigilators,
  useExam,
  useExams,
} from "@/hooks/use-exams";
import { useInvigilators } from "@/hooks/use-invigilators";
import { useRooms } from "@/hooks/use-rooms";
import { usePlanner } from "@/hooks/use-planner";
import { parseDraggableId } from "@/lib/planner-utils";
import { ExamSelector } from "./exam-selector";
import { InvigilatorPool } from "./invigilator-pool";
import { InvigilatorChip } from "./invigilator-chip";
import { RoomGrid } from "./room-grid";
import { NoExamSelected } from "./empty-states";

function todayIso() {
  return format(new Date(), "yyyy-MM-dd");
}

export function PlannerScreen() {
  // ── Selection state ───────────────────────────────────────────────────────
  const [date, setDate] = useState<string>(todayIso);
  const [slot, setSlot] = useState<TimeSlot>("morning");
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);

  // ── Data fetching ─────────────────────────────────────────────────────────
  const examsQuery = useExams({ exam_date: date, limit: 200 });
  const examQuery = useExam(selectedExamId);
  const roomsQuery = useRooms({ limit: 200 });
  const availableQuery = useAvailableInvigilators(date, slot);
  // Full invigilator list used only to fill in names for slots whose occupant
  // is not in the (pool-filtered) availableInvigilators list — e.g. already
  // assigned to this exam on the same date/slot.
  const allInvigilatorsQuery = useInvigilators({ limit: 500 });

  const exams = examsQuery.data?.data ?? [];
  const rooms = roomsQuery.data?.data ?? [];
  const availableInvigilators: Invigilator[] = availableQuery.data ?? [];
  const allInvigilators: Invigilator[] = allInvigilatorsQuery.data?.data ?? [];

  // Map id → invigilator. Available first so any fresher data wins; all others
  // (already-assigned / unavailable) folded in so slot labels always resolve.
  const invigilatorsById = useMemo(() => {
    const m: Record<string, Invigilator> = {};
    for (const i of allInvigilators) m[i.id] = i;
    for (const i of availableInvigilators) m[i.id] = i;
    return m;
  }, [availableInvigilators, allInvigilators]);

  // ── DnD orchestration ─────────────────────────────────────────────────────
  const planner = usePlanner({
    examId: selectedExamId,
    assignments: examQuery.data?.assignments,
    rooms,
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 180, tolerance: 6 },
    }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  function handleDragStart(event: DragStartEvent) {
    const invId = parseDraggableId(event.active.id);
    planner.setActiveInvigilatorId(invId);
  }

  function handleSelectExam(id: string | null) {
    setSelectedExamId(id);
  }

  // Reset selected exam if date/slot change makes it invalid.
  function handleDateChange(d: string) {
    setDate(d);
    setSelectedExamId(null);
  }
  function handleSlotChange(s: TimeSlot) {
    setSlot(s);
    setSelectedExamId(null);
  }

  const activeInvigilator = planner.activeInvigilatorId
    ? invigilatorsById[planner.activeInvigilatorId] ?? null
    : null;

  const hasExam = !!selectedExamId;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-4 py-4 lg:py-6">
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <LayoutGrid className="size-5" strokeWidth={1.75} />
          </span>
          <div className="flex flex-col">
            <h1 className="text-lg font-semibold leading-tight">Planner</h1>
            <p className="text-xs text-muted-foreground leading-tight">
              Drag invigilators onto rooms to assign Head, Invigilator 1 and
              Invigilator 2.
            </p>
          </div>
        </div>
      </header>

      {/* Selector */}
      <section
        aria-label="Exam selection"
        className="rounded-3xl border border-border bg-card/40 p-4"
      >
        <ExamSelector
          date={date}
          slot={slot}
          examId={selectedExamId}
          exams={exams}
          isLoading={examsQuery.isLoading}
          onDateChange={handleDateChange}
          onSlotChange={handleSlotChange}
          onExamChange={handleSelectExam}
        />
      </section>

      {/* Board */}
      {!hasExam ? (
        <NoExamSelected />
      ) : (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragCancel={() => planner.setActiveInvigilatorId(null)}
          onDragEnd={planner.handleDragEnd}
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[280px_1fr]">
            <InvigilatorPool
              invigilators={availableInvigilators}
              assignedInvigilatorIds={planner.assignedInvigilatorIds}
              isLoading={availableQuery.isLoading}
            />
            <RoomGrid
              rooms={rooms}
              assignmentsByRoomId={planner.assignmentsByRoomId}
              draft={planner.draft}
              invigilatorsById={invigilatorsById}
              pendingSlotIds={planner.pendingSlotIds}
              conflictSlotIds={planner.conflictSlotIds}
              onRemove={planner.handleRemove}
              onSeatsCommit={planner.handleSeatsChange}
            />
          </div>

          <DragOverlay dropAnimation={null}>
            {activeInvigilator ? (
              <div className="rotate-[-1deg]">
                <InvigilatorChip
                  invigilator={activeInvigilator}
                  ghostWhileDragging={false}
                />
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
}
