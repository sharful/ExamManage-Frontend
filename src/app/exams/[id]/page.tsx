"use client";

import { use, useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import {
  ChevronLeft,
  Copy,
  Plus,
  Pencil,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Clock,
  Wand2,
  XCircle,
} from "lucide-react";
import {
  useExam,
  useDeleteExam,
  useDeleteAssignment,
  useUpdateExam,
  useBulkAutoAssign,
  useCloneExam,
} from "@/hooks/use-exams";
import type { BulkAutoAssignResponse } from "@/hooks/use-exams";
import { useRooms } from "@/hooks/use-rooms";
import { useInvigilators } from "@/hooks/use-invigilators";
import { toast } from "@/hooks/use-toast";
import { AppShell } from "@/components/layout/app-shell";
import { AssignmentForm } from "@/components/exams/assignment-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { ExamAssignment, ExamCloneResponse, Room, Invigilator, TimeSlot } from "@/types";

// ── Props ──────────────────────────────────────────────────────────────────

interface Props {
  params: Promise<{ id: string }>;
}

// ── Assignment card ────────────────────────────────────────────────────────

interface AssignmentCardProps {
  assignment: ExamAssignment;
  roomMap: Map<string, Room>;
  invMap: Map<string, Invigilator>;
  onEdit: () => void;
  onDelete: () => void;
}

function AssignmentCard({
  assignment,
  roomMap,
  invMap,
  onEdit,
  onDelete,
}: AssignmentCardProps) {
  const room = roomMap.get(assignment.room_id);
  const head = invMap.get(assignment.head_invigilator_id);
  const inv1 = invMap.get(assignment.invigilator1_id);
  const inv2 = assignment.invigilator2_id
    ? invMap.get(assignment.invigilator2_id)
    : null;

  const isFullyAssigned = !!head && !!inv1;
  const isOverCapacity =
    room !== undefined && assignment.seats > room.max_seats;

  const statusIcon = isOverCapacity ? (
    <AlertCircle className="size-4 text-destructive shrink-0" />
  ) : !isFullyAssigned ? (
    <Clock className="size-4 text-foreground/70 shrink-0" strokeWidth={1.75} />
  ) : (
    <CheckCircle2 className="size-4 text-foreground shrink-0" strokeWidth={1.75} />
  );

  const borderColor = isOverCapacity
    ? "border-l-[color:var(--pastel-pink)]"
    : !isFullyAssigned
      ? "border-l-[color:var(--pastel-peach)]"
      : "border-l-[color:var(--pastel-mint)]";

  return (
    <div
      className={cn(
        "rounded-2xl border bg-card border-l-[6px] px-4 py-3 flex flex-col gap-2",
        borderColor
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {statusIcon}
          <span className="font-medium text-sm truncate">
            Room {room?.room_number ?? assignment.room_id.slice(0, 8)}
          </span>
          <Badge variant="outline" className="shrink-0">
            {assignment.seats} / {room?.max_seats ?? "?"} seats
          </Badge>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onEdit}
            aria-label="Edit assignment"
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onDelete}
            aria-label="Delete assignment"
            className="text-destructive hover:text-destructive"
          >
            <Trash2 />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-1 sm:grid-cols-3 text-xs text-muted-foreground">
        <div>
          <span className="font-medium text-foreground">Head: </span>
          {head?.name ?? (
            <span className="font-medium text-destructive/80">Not assigned</span>
          )}
        </div>
        <div>
          <span className="font-medium text-foreground">Inv 1: </span>
          {inv1?.name ?? (
            <span className="font-medium text-destructive/80">Not assigned</span>
          )}
        </div>
        <div>
          <span className="font-medium text-foreground">Inv 2: </span>
          {inv2?.name ?? (
            <span className="text-muted-foreground italic">—</span>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Edit exam dialog ───────────────────────────────────────────────────────

interface EditExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: string;
  currentName: string;
  currentDate: string;
  currentSlot: TimeSlot;
}

function EditExamDialog({
  open,
  onOpenChange,
  examId,
  currentName,
  currentDate,
  currentSlot,
}: EditExamDialogProps) {
  const updateExam = useUpdateExam();
  const [name, setName] = useState(currentName);
  const [date, setDate] = useState(currentDate);
  const [slot, setSlot] = useState<TimeSlot>(currentSlot);
  const [error, setError] = useState("");

  async function handleSave() {
    if (!name.trim()) {
      setError("Exam name is required.");
      return;
    }
    if (!date) {
      setError("Date is required.");
      return;
    }
    setError("");
    try {
      await updateExam.mutateAsync({
        id: examId,
        payload: { exam_name: name.trim(), exam_date: date, time_slot: slot },
      });
      toast("Exam updated", "success");
      onOpenChange(false);
    } catch {
      setError("Failed to update exam. Please try again.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>Edit exam</DialogTitle>
      </DialogHeader>
      <DialogContent className="pb-2">
        <div className="flex flex-col gap-4">
          {error && (
            <p className="text-sm text-destructive">{error}</p>
          )}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium">
              Exam name <span className="text-destructive">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Mathematics Final"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Date</label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Time slot</label>
              <Select
                value={slot}
                onChange={(e) => setSlot(e.target.value as TimeSlot)}
              >
                <option value="morning">Morning</option>
                <option value="evening">Evening</option>
              </Select>
            </div>
          </div>
        </div>
      </DialogContent>
      <DialogFooter>
        <Button variant="outline" onClick={() => onOpenChange(false)}>
          Cancel
        </Button>
        <Button onClick={handleSave} disabled={updateExam.isPending}>
          {updateExam.isPending ? "Saving…" : "Save changes"}
        </Button>
      </DialogFooter>
    </Dialog>
  );
}

// ── Auto-assign dialog ─────────────────────────────────────────────────────

interface AutoAssignDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: string;
  assignedRoomIds: Set<string>;
  roomMap: Map<string, Room>;
}

function AutoAssignDialog({
  open,
  onOpenChange,
  examId,
  assignedRoomIds,
  roomMap,
}: AutoAssignDialogProps) {
  const bulkAutoAssign = useBulkAutoAssign();
  const unassignedRooms = [...roomMap.values()].filter(
    (r) => !assignedRoomIds.has(r.id)
  );

  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(unassignedRooms.map((r) => r.id))
  );
  const [result, setResult] = useState<BulkAutoAssignResponse | null>(null);

  // Reset state whenever the dialog opens
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setSelected(new Set(unassignedRooms.map((r) => r.id)));
      setResult(null);
    }
    onOpenChange(nextOpen);
  };

  function toggleRoom(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleAll() {
    if (selected.size === unassignedRooms.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(unassignedRooms.map((r) => r.id)));
    }
  }

  async function handleAutoAssign(roomIds?: string[]) {
    const target = roomIds ?? [...selected];
    if (target.length === 0) return;
    try {
      const response = await bulkAutoAssign.mutateAsync({
        exam_id: examId,
        room_ids: target,
      });
      setResult(response);
    } catch {
      toast(
        "Auto-assign failed — please try again or assign rooms manually.",
        "error",
      );
    }
  }

  function handleRetryFailed() {
    if (!result) return;
    const failedIds = result.results.filter((r) => !r.success).map((r) => r.room_id);
    if (failedIds.length === 0) return;
    void handleAutoAssign(failedIds);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogHeader>
        <DialogTitle>Auto-assign rooms</DialogTitle>
      </DialogHeader>
      <DialogContent className="pb-2">
        {result ? (
          // ── Results view ─────────────────────────────────────────────────
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-pastel-mint text-pastel-fg px-3 py-1 font-semibold">
                <CheckCircle2 className="size-4" strokeWidth={1.75} />
                {result.assigned_count} assigned
              </span>
              {result.failed_count > 0 && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-pastel-pink text-pastel-fg px-3 py-1 font-semibold">
                  <XCircle className="size-4" strokeWidth={1.75} />
                  {result.failed_count} failed
                </span>
              )}
            </div>
            <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto">
              {result.results.map((r) => {
                const room = roomMap.get(r.room_id);
                return (
                  <div
                    key={r.room_id}
                    className={cn(
                      "rounded-2xl px-4 py-3 text-sm flex items-start gap-2",
                      r.success
                        ? "border-transparent bg-pastel-mint text-pastel-fg"
                        : "border-transparent bg-pastel-pink text-pastel-fg"
                    )}
                  >
                    {r.success ? (
                      <CheckCircle2 className="size-4 mt-0.5 shrink-0" strokeWidth={1.75} />
                    ) : (
                      <XCircle className="size-4 mt-0.5 shrink-0" strokeWidth={1.75} />
                    )}
                    <div className="min-w-0">
                      <p className="font-medium">
                        Room {room?.room_number ?? r.room_id.slice(0, 8)}
                      </p>
                      {!r.success && r.reason && (
                        <p className="text-xs opacity-80 mt-0.5">
                          {r.reason}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          // ── Selection view ────────────────────────────────────────────────
          <div className="flex flex-col gap-3">
            {unassignedRooms.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                All rooms are already assigned for this exam.
              </p>
            ) : (
              <>
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Select rooms to auto-assign invigilators:
                  </p>
                  <button
                    type="button"
                    className="text-xs text-primary hover:underline"
                    onClick={toggleAll}
                  >
                    {selected.size === unassignedRooms.length
                      ? "Deselect all"
                      : "Select all"}
                  </button>
                </div>
                <div className="flex flex-col gap-1.5 max-h-64 overflow-y-auto">
                  {unassignedRooms.map((room) => (
                    <label
                      key={room.id}
                      className="flex items-center gap-3 rounded-2xl border border-border px-3 py-2 cursor-pointer hover:bg-muted/50 transition-colors"
                    >
                      <input
                        type="checkbox"
                        className="size-4 shrink-0 accent-primary"
                        checked={selected.has(room.id)}
                        onChange={() => toggleRoom(room.id)}
                      />
                      <span className="text-sm flex-1">
                        Room {room.room_number}
                      </span>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {room.max_seats} seats
                      </Badge>
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </DialogContent>
      <DialogFooter>
        {result ? (
          <>
            {result.failed_count > 0 && (
              <Button
                variant="outline"
                onClick={handleRetryFailed}
                disabled={bulkAutoAssign.isPending}
              >
                <Wand2 />
                {bulkAutoAssign.isPending
                  ? "Retrying…"
                  : `Retry ${result.failed_count} failed`}
              </Button>
            )}
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          </>
        ) : (
          <>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => handleAutoAssign()}
              disabled={
                bulkAutoAssign.isPending ||
                selected.size === 0 ||
                unassignedRooms.length === 0
              }
            >
              <Wand2 />
              {bulkAutoAssign.isPending
                ? "Assigning…"
                : `Auto-assign ${selected.size > 0 ? selected.size : ""} room${selected.size !== 1 ? "s" : ""}`}
            </Button>
          </>
        )}
      </DialogFooter>
    </Dialog>
  );
}

// ── Clone exam dialog ──────────────────────────────────────────────────────

interface CloneExamDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  examId: string;
  sourceExamName: string;
}

function CloneExamDialog({
  open,
  onOpenChange,
  examId,
  sourceExamName,
}: CloneExamDialogProps) {
  const router = useRouter();
  const cloneExam = useCloneExam();
  const [name, setName] = useState(`${sourceExamName} (copy)`);
  const [date, setDate] = useState("");
  const [error, setError] = useState("");
  const [result, setResult] = useState<ExamCloneResponse | null>(null);

  // Reset form whenever dialog opens
  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      setName(`${sourceExamName} (copy)`);
      setDate("");
      setError("");
      setResult(null);
    }
    onOpenChange(nextOpen);
  };

  async function handleClone() {
    if (!name.trim()) {
      setError("Exam name is required.");
      return;
    }
    if (!date) {
      setError("Date is required.");
      return;
    }
    setError("");
    try {
      const res = await cloneExam.mutateAsync({
        id: examId,
        payload: { new_exam_name: name.trim(), new_date: date },
      });
      setResult(res);
    } catch {
      setError("Failed to clone exam. Please try again.");
    }
  }

  function handleGoToExam() {
    if (!result) return;
    onOpenChange(false);
    router.push(`/exams/${result.exam.id}`);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogHeader>
        <DialogTitle>Clone exam</DialogTitle>
      </DialogHeader>
      <DialogContent className="pb-2">
        {result ? (
          // ── Result view: conflicts first (actionable), then success summary
          <div
            className="flex flex-col gap-3"
            aria-live="polite"
          >
            {result.conflict_count > 0 && (
              <div className="flex flex-col gap-2">
                <p className="text-sm font-semibold flex items-center gap-1.5">
                  <span className="flex size-7 items-center justify-center rounded-full bg-pastel-peach text-pastel-fg">
                    <AlertCircle className="size-4 shrink-0" strokeWidth={1.75} />
                  </span>
                  Resolve {result.conflict_count} conflict
                  {result.conflict_count !== 1 ? "s" : ""} after cloning:
                </p>
                <div className="flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                  {result.assignments
                    .filter((a) => a.has_conflicts)
                    .map((a) => (
                      <div
                        key={a.assignment.id}
                        className="rounded-2xl bg-pastel-peach text-pastel-fg px-4 py-3 text-xs"
                      >
                        {a.conflicts.map((c, i) => (
                          <p key={i}>
                            {c.message}
                          </p>
                        ))}
                      </div>
                    ))}
                </div>
              </div>
            )}
            <div className="inline-flex items-center gap-2 text-sm rounded-full bg-pastel-mint text-pastel-fg px-4 py-2 w-fit">
              <CheckCircle2 className="size-4 shrink-0" strokeWidth={1.75} />
              <span>
                <strong>{result.exam.exam_name}</strong> created with{" "}
                {result.total_assignments} assignment
                {result.total_assignments !== 1 ? "s" : ""}.
              </span>
            </div>
          </div>
        ) : (
          // ── Form view ──────────────────────────────────────────────────────
          <div className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Creates a new exam with the same room and invigilator assignments.
              Conflicts on the new date will be flagged.
            </p>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                New exam name <span className="text-destructive">*</span>
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Mathematics Final (Resit)"
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">
                New date <span className="text-destructive">*</span>
              </label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
        )}
      </DialogContent>
      <DialogFooter>
        {result ? (
          <Button onClick={handleGoToExam}>
            Go to cloned exam
          </Button>
        ) : (
          <>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleClone} disabled={cloneExam.isPending}>
              <Copy />
              {cloneExam.isPending ? "Cloning…" : "Clone exam"}
            </Button>
          </>
        )}
      </DialogFooter>
    </Dialog>
  );
}


// ── Page ───────────────────────────────────────────────────────────────────

export default function ExamDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();

  const { data: exam, isLoading, isError } = useExam(id);
  const deleteExam = useDeleteExam();
  const deleteAssignment = useDeleteAssignment();

  const { data: roomsData } = useRooms({ limit: 200 });
  const { data: invData } = useInvigilators({ page: 1, limit: 500 });

  const roomMap = useMemo(() => {
    const m = new Map<string, Room>();
    for (const r of roomsData?.data ?? []) m.set(r.id, r);
    return m;
  }, [roomsData]);

  const invMap = useMemo(() => {
    const m = new Map<string, Invigilator>();
    for (const inv of invData?.data ?? []) m.set(inv.id, inv);
    return m;
  }, [invData]);

  const assignedRoomIds = useMemo(
    () => new Set((exam?.assignments ?? []).map((a) => a.room_id)),
    [exam?.assignments]
  );

  // Dialog state
  const [showEditExam, setShowEditExam] = useState(false);
  const [showDeleteExam, setShowDeleteExam] = useState(false);
  const [showCloneExam, setShowCloneExam] = useState(false);
  const [showAddAssignment, setShowAddAssignment] = useState(false);
  const [showAutoAssign, setShowAutoAssign] = useState(false);
  const [editingAssignment, setEditingAssignment] =
    useState<ExamAssignment | null>(null);
  const [deletingAssignmentId, setDeletingAssignmentId] = useState<
    string | null
  >(null);

  // ── Handlers ──────────────────────────────────────────────────────────

  async function handleDeleteExam() {
    if (!exam) return;
    try {
      await deleteExam.mutateAsync(exam.id);
      toast("Exam deleted", "success");
      router.push("/exams");
    } catch {
      toast("Failed to delete exam", "error");
    }
  }

  async function handleDeleteAssignment(assignmentId: string) {
    try {
      await deleteAssignment.mutateAsync(assignmentId);
      toast("Assignment removed", "success");
      setDeletingAssignmentId(null);
    } catch {
      toast("Failed to delete assignment", "error");
    }
  }

  // ── Render ─────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
          Loading…
        </div>
      </AppShell>
    );
  }

  if (isError || !exam) {
    return (
      <AppShell>
        <div className="flex items-center justify-center py-20 text-destructive text-sm">
          Failed to load exam. Please go back and try again.
        </div>
      </AppShell>
    );
  }

  const assignments: ExamAssignment[] = exam.assignments ?? [];

  const formattedDate = (() => {
    try {
      return format(new Date(exam.exam_date + "T00:00:00"), "EEEE, d MMMM yyyy");
    } catch {
      return exam.exam_date;
    }
  })();

  return (
    <AppShell>
      {/* Back */}
      <Link
        href="/exams"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="size-4" />
        Back to exams
      </Link>

      {/* Exam header card */}
      <Card className="mb-4">
        <CardHeader>
          <div className="flex items-start justify-between gap-3">
            <div>
              <CardTitle className="text-display text-2xl md:text-3xl">{exam.exam_name}</CardTitle>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-sm text-muted-foreground">
                  {formattedDate}
                </span>
                <Badge
                  variant={
                    exam.time_slot === "morning" ? "peach" : "lavender"
                  }
                  className="capitalize"
                >
                  {exam.time_slot}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowEditExam(true)}
              >
                <Pencil />
                Edit
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCloneExam(true)}
              >
                <Copy />
                Clone
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setShowDeleteExam(true)}
              >
                <Trash2 />
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Assignments section */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">
            Room assignments
            <span className="ml-2 text-sm font-normal text-muted-foreground">
              ({assignments.length})
            </span>
          </h2>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAutoAssign(true)}
            >
              <Wand2 />
              Auto-assign
            </Button>
            <Button size="sm" onClick={() => setShowAddAssignment(true)}>
              <Plus />
              Add room
            </Button>
          </div>
        </div>

        {assignments.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border py-12 text-center">
            <p className="text-sm text-muted-foreground mb-3">
              No rooms assigned yet.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAddAssignment(true)}
            >
              <Plus />
              Assign first room
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-2">
            {assignments.map((a) => (
              <AssignmentCard
                key={a.id}
                assignment={a}
                roomMap={roomMap}
                invMap={invMap}
                onEdit={() => setEditingAssignment(a)}
                onDelete={() => setDeletingAssignmentId(a.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Dialogs ─────────────────────────────────────────────────────── */}

      {/* Edit exam */}
      {showEditExam && (
        <EditExamDialog
          open={showEditExam}
          onOpenChange={setShowEditExam}
          examId={exam.id}
          currentName={exam.exam_name}
          currentDate={exam.exam_date}
          currentSlot={exam.time_slot}
        />
      )}

      {/* Clone exam */}
      {showCloneExam && (
        <CloneExamDialog
          open={showCloneExam}
          onOpenChange={setShowCloneExam}
          examId={exam.id}
          sourceExamName={exam.exam_name}
        />
      )}

      {/* Auto-assign */}
      {showAutoAssign && (
        <AutoAssignDialog
          open={showAutoAssign}
          onOpenChange={setShowAutoAssign}
          examId={exam.id}
          assignedRoomIds={assignedRoomIds}
          roomMap={roomMap}
        />
      )}

      {/* Delete exam confirm */}
      <Dialog open={showDeleteExam} onOpenChange={setShowDeleteExam}>
        <DialogHeader>
          <DialogTitle>Delete exam?</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <p className="text-sm text-muted-foreground">
            This will permanently delete{" "}
            <span className="font-medium text-foreground">
              {exam.exam_name}
            </span>{" "}
            and all its room assignments. This cannot be undone.
          </p>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setShowDeleteExam(false)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteExam}
            disabled={deleteExam.isPending}
          >
            {deleteExam.isPending ? "Deleting…" : "Delete exam"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Add assignment */}
      <Dialog
        open={showAddAssignment}
        onOpenChange={setShowAddAssignment}
      >
        <DialogHeader>
          <DialogTitle>Assign room</DialogTitle>
        </DialogHeader>
        <DialogContent className="pb-0">
          <AssignmentForm
            examId={exam.id}
            examDate={exam.exam_date}
            timeSlot={exam.time_slot}
            onSuccess={() => setShowAddAssignment(false)}
            onCancel={() => setShowAddAssignment(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit assignment */}
      <Dialog
        open={!!editingAssignment}
        onOpenChange={(open) => {
          if (!open) setEditingAssignment(null);
        }}
      >
        <DialogHeader>
          <DialogTitle>Edit assignment</DialogTitle>
        </DialogHeader>
        <DialogContent className="pb-0">
          {editingAssignment && (
            <AssignmentForm
              examId={exam.id}
              examDate={exam.exam_date}
              timeSlot={exam.time_slot}
              assignment={editingAssignment}
              onSuccess={() => setEditingAssignment(null)}
              onCancel={() => setEditingAssignment(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete assignment confirm */}
      <Dialog
        open={!!deletingAssignmentId}
        onOpenChange={(open) => {
          if (!open) setDeletingAssignmentId(null);
        }}
      >
        <DialogHeader>
          <DialogTitle>Remove assignment?</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <p className="text-sm text-muted-foreground">
            This room assignment will be permanently removed.
          </p>
        </DialogContent>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setDeletingAssignmentId(null)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            disabled={deleteAssignment.isPending}
            onClick={() => {
              if (deletingAssignmentId) {
                handleDeleteAssignment(deletingAssignmentId);
              }
            }}
          >
            {deleteAssignment.isPending ? "Removing…" : "Remove"}
          </Button>
        </DialogFooter>
      </Dialog>
    </AppShell>
  );
}
