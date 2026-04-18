"use client";

import { useCallback, useMemo, useState } from "react";
import type { DragEndEvent } from "@dnd-kit/core";
import type { ExamAssignment, Room } from "@/types";
import {
  useCreateAssignment,
  useUpdateAssignment,
  useDeleteAssignment,
  type ConflictError,
} from "@/hooks/use-exams";
import { toast } from "@/hooks/use-toast";
import {
  buildRolePatch,
  collectAssignedInvigilatorIds,
  computeDropIntent,
  findRoleForInvigilator,
  indexAssignmentsByRoom,
  makeDroppableId,
  parseDraggableId,
  parseDroppableId,
  type RoleKey,
} from "@/lib/planner-utils";

// ── Types ──────────────────────────────────────────────────────────────────

interface UsePlannerArgs {
  examId: string | null;
  assignments: ExamAssignment[] | undefined;
  rooms: Room[] | undefined;
}

/**
 * Lightweight "draft" the planner holds in memory between the moment the Head
 * slot of an empty room is filled and the moment Inv 1 is also filled — the
 * backend requires BOTH to create an assignment row. We do not persist this
 * draft: it lives only in React state and is discarded on refresh.
 */
interface DraftAssignment {
  roomId: string;
  head_invigilator_id: string;
}

export interface UsePlannerResult {
  /** roomId → ExamAssignment for the selected exam. */
  assignmentsByRoomId: Record<string, ExamAssignment>;
  /** Invigilator ids already booked somewhere in this exam (so we hide them from the pool). */
  assignedInvigilatorIds: Set<string>;
  /** The transient head-only draft waiting for an Inv 1 drop, if any. */
  draft: DraftAssignment | null;
  /** Set of slot ids ("slot:{roomId}:{role}") currently flashing red for a conflict. */
  conflictSlotIds: Set<string>;
  /** Set of slot ids currently being persisted (show spinner / disable). */
  pendingSlotIds: Set<string>;
  /** Currently dragging invigilator id (for the <DragOverlay>). Null if idle. */
  activeInvigilatorId: string | null;
  setActiveInvigilatorId: (id: string | null) => void;
  /** Main DnD handler. Attach to <DndContext onDragEnd={handleDragEnd}> . */
  handleDragEnd: (event: DragEndEvent) => Promise<void>;
  /** Remove button on a filled slot. */
  handleRemove: (roomId: string, role: RoleKey) => Promise<void>;
  /** Inline seats edit. */
  handleSeatsChange: (roomId: string, seats: number) => Promise<void>;
}

// ── Hook ───────────────────────────────────────────────────────────────────

export function usePlanner({
  examId,
  assignments,
  rooms,
}: UsePlannerArgs): UsePlannerResult {
  const createMutation = useCreateAssignment();
  const updateMutation = useUpdateAssignment();
  const deleteMutation = useDeleteAssignment();

  const [draft, setDraft] = useState<DraftAssignment | null>(null);
  const [activeInvigilatorId, setActiveInvigilatorId] = useState<string | null>(
    null
  );
  const [conflictSlotIds, setConflictSlotIds] = useState<Set<string>>(
    () => new Set()
  );
  const [pendingSlotIds, setPendingSlotIds] = useState<Set<string>>(
    () => new Set()
  );

  const assignmentsByRoomId = useMemo(
    () => indexAssignmentsByRoom(assignments),
    [assignments]
  );

  const assignedInvigilatorIds = useMemo(() => {
    const s = collectAssignedInvigilatorIds(assignments);
    // Also hide the draft head from the pool.
    if (draft) s.add(draft.head_invigilator_id);
    return s;
  }, [assignments, draft]);

  const roomsById = useMemo(() => {
    const m: Record<string, Room> = {};
    if (rooms) for (const r of rooms) m[r.id] = r;
    return m;
  }, [rooms]);

  // ── helpers ──────────────────────────────────────────────────────────────

  const flashConflict = useCallback((slotId: string) => {
    setConflictSlotIds((prev) => new Set(prev).add(slotId));
    setTimeout(() => {
      setConflictSlotIds((prev) => {
        const next = new Set(prev);
        next.delete(slotId);
        return next;
      });
    }, 6000);
  }, []);

  const markPending = useCallback((slotId: string, pending: boolean) => {
    setPendingSlotIds((prev) => {
      const next = new Set(prev);
      if (pending) next.add(slotId);
      else next.delete(slotId);
      return next;
    });
  }, []);

  const showConflictToasts = useCallback((conflicts: ConflictError[]) => {
    for (const c of conflicts) toast(c.message, "error");
  }, []);

  // ── drag end ─────────────────────────────────────────────────────────────

  const handleDragEnd = useCallback(
    async (event: DragEndEvent) => {
      setActiveInvigilatorId(null);
      const { active, over } = event;
      if (!over || !examId) return;

      const invigilatorId = parseDraggableId(active.id);
      const target = parseDroppableId(over.id);
      if (!invigilatorId || !target) return;

      const { roomId, role } = target;
      const slotId = makeDroppableId(roomId, role);
      const room = roomsById[roomId];
      if (!room) return;

      const existing = assignmentsByRoomId[roomId];

      // Prevent duplicate-role within the same room (backend also rejects).
      if (existing) {
        const currentRole = findRoleForInvigilator(existing, invigilatorId);
        if (currentRole && currentRole !== role) {
          toast(
            "This invigilator is already assigned to a different role in this room.",
            "error"
          );
          flashConflict(slotId);
          return;
        }
      }

      // ── Draft path: a Head-only row is waiting for Inv 1 ────────────────
      if (draft && draft.roomId === roomId && !existing) {
        if (role === "head") {
          // Replace the head in the draft.
          setDraft({ roomId, head_invigilator_id: invigilatorId });
          return;
        }
        if (role === "inv1") {
          // Fire the real POST with draft.head + this inv1.
          markPending(slotId, true);
          try {
            const res = await createMutation.mutateAsync({
              exam_id: examId,
              room_id: roomId,
              seats: room.max_seats,
              head_invigilator_id: draft.head_invigilator_id,
              invigilator1_id: invigilatorId,
              invigilator2_id: null,
            });
            if (res.conflicts?.length) {
              showConflictToasts(res.conflicts);
              flashConflict(slotId);
            } else {
              toast("Room assignment created", "success");
            }
            setDraft(null);
          } catch {
            toast("Failed to create assignment", "error");
            flashConflict(slotId);
          } finally {
            markPending(slotId, false);
          }
          return;
        }
        // role === "inv2" but no assignment yet → needs head+inv1 first.
        toast("Assign Invigilator 1 first, then Invigilator 2.", "error");
        return;
      }

      // ── Normal path ──────────────────────────────────────────────────────
      const intent = computeDropIntent(existing, role, invigilatorId);

      if (intent.kind === "needs-head") {
        // Empty room and dropping onto Inv 1 / Inv 2. Not allowed; prompt.
        toast("Drop onto the Head slot first, then fill Invigilator 1.", "info");
        flashConflict(slotId);
        return;
      }

      if (intent.kind === "create-head") {
        // Park as draft; no server call until Inv 1 is also dropped.
        setDraft({ roomId, head_invigilator_id: intent.head_invigilator_id });
        toast(
          "Head ready — now drop Invigilator 1 onto the same room to save.",
          "info"
        );
        return;
      }

      // intent.kind === "update"
      markPending(slotId, true);
      try {
        const res = await updateMutation.mutateAsync({
          id: intent.assignmentId,
          payload: intent.patch,
        });
        if (res.conflicts?.length) {
          showConflictToasts(res.conflicts);
          flashConflict(slotId);
        } else {
          toast("Assignment updated", "success");
        }
      } catch {
        toast("Failed to update assignment", "error");
        flashConflict(slotId);
      } finally {
        markPending(slotId, false);
      }
    },
    [
      examId,
      roomsById,
      assignmentsByRoomId,
      draft,
      createMutation,
      updateMutation,
      flashConflict,
      markPending,
      showConflictToasts,
    ]
  );

  // ── remove button on a filled slot ───────────────────────────────────────

  const handleRemove = useCallback(
    async (roomId: string, role: RoleKey) => {
      const slotId = makeDroppableId(roomId, role);
      const existing = assignmentsByRoomId[roomId];

      // Draft head? Just clear the draft.
      if (!existing && draft?.roomId === roomId && role === "head") {
        setDraft(null);
        return;
      }

      if (!existing) return;

      // Inv 2 is optional — clear it via PUT.
      if (role === "inv2") {
        markPending(slotId, true);
        try {
          await updateMutation.mutateAsync({
            id: existing.id,
            payload: buildRolePatch("inv2", null),
          });
          toast("Invigilator 2 removed", "success");
        } catch {
          toast("Failed to remove Invigilator 2", "error");
        } finally {
          markPending(slotId, false);
        }
        return;
      }

      // Head or Inv 1 — the backend requires both, so removing means deleting
      // the entire assignment row. The caller is expected to confirm first.
      markPending(slotId, true);
      try {
        await deleteMutation.mutateAsync(existing.id);
        toast("Room assignment removed", "success");
      } catch {
        toast("Failed to remove room assignment", "error");
      } finally {
        markPending(slotId, false);
      }
    },
    [assignmentsByRoomId, draft, updateMutation, deleteMutation, markPending]
  );

  // ── inline seats edit ────────────────────────────────────────────────────

  const handleSeatsChange = useCallback(
    async (roomId: string, seats: number) => {
      const existing = assignmentsByRoomId[roomId];
      if (!existing) return; // Seats only persist once an assignment exists.
      if (existing.seats === seats) return;
      try {
        const res = await updateMutation.mutateAsync({
          id: existing.id,
          payload: { seats },
        });
        if (res.conflicts?.length) {
          showConflictToasts(res.conflicts);
        }
      } catch {
        toast("Failed to update seat count", "error");
      }
    },
    [assignmentsByRoomId, updateMutation, showConflictToasts]
  );

  return {
    assignmentsByRoomId,
    assignedInvigilatorIds,
    draft,
    conflictSlotIds,
    pendingSlotIds,
    activeInvigilatorId,
    setActiveInvigilatorId,
    handleDragEnd,
    handleRemove,
    handleSeatsChange,
  };
}
