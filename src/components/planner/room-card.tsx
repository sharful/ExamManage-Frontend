"use client";

import { useState } from "react";
import { DoorOpen } from "lucide-react";
import type { ExamAssignment, Invigilator, Room } from "@/types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { ROLE_KEYS, type RoleKey, makeDroppableId } from "@/lib/planner-utils";
import { RoleSlot } from "./role-slot";
import { SeatsInput } from "./seats-input";

interface RoomCardProps {
  room: Room;
  assignment?: ExamAssignment;
  /** Draft head (no assignment row yet) — id of invigilator in Head slot. */
  draftHeadId?: string;
  /** id → Invigilator lookup for filling slot labels. */
  invigilatorsById: Record<string, Invigilator>;
  pendingSlotIds: Set<string>;
  conflictSlotIds: Set<string>;
  onRemove: (roomId: string, role: RoleKey) => void | Promise<void>;
  onSeatsCommit: (roomId: string, seats: number) => void | Promise<void>;
}

/** Fallback invigilator stub so we can show a name even if the lookup missed (rare). */
function stub(id: string): Invigilator {
  return {
    id,
    name: "(unknown)",
    department: null,
    institute: null,
    mobile: null,
    email: null,
    status: "available",
    remarks: null,
    created_at: "",
    updated_at: "",
  };
}

export function RoomCard({
  room,
  assignment,
  draftHeadId,
  invigilatorsById,
  pendingSlotIds,
  conflictSlotIds,
  onRemove,
  onSeatsCommit,
}: RoomCardProps) {
  // Which role is occupied by whom?
  const occupants: Record<RoleKey, Invigilator | null> = {
    head: assignment
      ? invigilatorsById[assignment.head_invigilator_id] ??
        stub(assignment.head_invigilator_id)
      : draftHeadId
        ? invigilatorsById[draftHeadId] ?? stub(draftHeadId)
        : null,
    inv1: assignment
      ? invigilatorsById[assignment.invigilator1_id] ??
        stub(assignment.invigilator1_id)
      : null,
    inv2:
      assignment && assignment.invigilator2_id
        ? invigilatorsById[assignment.invigilator2_id] ??
          stub(assignment.invigilator2_id)
        : null,
  };

  const isDraftHead = !assignment && !!draftHeadId;

  const filledCount =
    (occupants.head ? 1 : 0) +
    (occupants.inv1 ? 1 : 0) +
    (occupants.inv2 ? 1 : 0);

  // Remove-confirm dialog for head / inv1 (which require a full delete).
  const [confirmRole, setConfirmRole] = useState<RoleKey | null>(null);

  function requestRemove(role: RoleKey) {
    // Draft head: no persisted row — clear immediately with no confirm.
    if (isDraftHead && role === "head") {
      onRemove(room.id, role);
      return;
    }
    if (!assignment) return;
    if (role === "inv2") {
      // Optional — clear without confirm.
      onRemove(room.id, role);
      return;
    }
    // Head or Inv 1 — removing deletes the whole row. Confirm.
    setConfirmRole(role);
  }

  async function confirmDelete() {
    if (!confirmRole) return;
    await onRemove(room.id, confirmRole);
    setConfirmRole(null);
  }

  return (
    <Card className="flex flex-col" data-testid={`room-card-${room.id}`}>
      <CardHeader className="flex-row items-center justify-between gap-2 pb-3">
        <div className="flex items-center gap-2">
          <span className="flex size-8 items-center justify-center rounded-full bg-pastel-peach text-pastel-fg">
            <DoorOpen className="size-4" strokeWidth={1.75} />
          </span>
          <div className="flex flex-col">
            <span className="text-sm font-semibold leading-tight">
              Room {room.room_number}
            </span>
            <span className="text-xs text-muted-foreground leading-tight">
              Capacity {room.max_seats}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              filledCount === 0
                ? "outline"
                : filledCount < 2
                  ? "warning"
                  : "success"
            }
          >
            {filledCount}/3
          </Badge>
          <SeatsInput
            value={assignment?.seats ?? room.max_seats}
            maxSeats={room.max_seats}
            editable={!!assignment}
            onCommit={(s) => onSeatsCommit(room.id, s)}
          />
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 pb-5">
        {ROLE_KEYS.map((role) => {
          const slotId = makeDroppableId(room.id, role);
          return (
            <RoleSlot
              key={role}
              roomId={room.id}
              role={role}
              invigilator={occupants[role]}
              isPending={pendingSlotIds.has(slotId)}
              hasConflict={conflictSlotIds.has(slotId)}
              isDraft={role === "head" && isDraftHead}
              onRemove={() => requestRemove(role)}
            />
          );
        })}
      </CardContent>

      {/* Confirm delete dialog for Head / Inv 1 */}
      <Dialog
        open={confirmRole !== null}
        onOpenChange={(open) => {
          if (!open) setConfirmRole(null);
        }}
      >
        <DialogHeader>
          <DialogTitle>Remove room assignment?</DialogTitle>
        </DialogHeader>
        <DialogContent>
          <DialogDescription>
            Removing the {confirmRole === "head" ? "Head Invigilator" : "Invigilator 1"}{" "}
            deletes the entire room assignment (both Head and Invigilator 1 are
            required). You can re-create it by dragging invigilators back onto
            Room {room.room_number}.
          </DialogDescription>
        </DialogContent>
        <DialogFooter>
          <Button variant="outline" onClick={() => setConfirmRole(null)}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={confirmDelete}>
            Remove assignment
          </Button>
        </DialogFooter>
      </Dialog>
    </Card>
  );
}
