"use client";

import type { ExamAssignment, Invigilator, Room } from "@/types";
import type { RoleKey } from "@/lib/planner-utils";
import { RoomCard } from "./room-card";
import { NoRooms } from "./empty-states";

interface RoomGridProps {
  rooms: Room[];
  assignmentsByRoomId: Record<string, ExamAssignment>;
  /** Draft head-only assignment (roomId + head invigilator id) if any. */
  draft: { roomId: string; head_invigilator_id: string } | null;
  invigilatorsById: Record<string, Invigilator>;
  pendingSlotIds: Set<string>;
  conflictSlotIds: Set<string>;
  onRemove: (roomId: string, role: RoleKey) => void | Promise<void>;
  onSeatsCommit: (roomId: string, seats: number) => void | Promise<void>;
}

export function RoomGrid({
  rooms,
  assignmentsByRoomId,
  draft,
  invigilatorsById,
  pendingSlotIds,
  conflictSlotIds,
  onRemove,
  onSeatsCommit,
}: RoomGridProps) {
  if (rooms.length === 0) return <NoRooms />;

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      {rooms.map((room) => (
        <RoomCard
          key={room.id}
          room={room}
          assignment={assignmentsByRoomId[room.id]}
          draftHeadId={
            draft && draft.roomId === room.id
              ? draft.head_invigilator_id
              : undefined
          }
          invigilatorsById={invigilatorsById}
          pendingSlotIds={pendingSlotIds}
          conflictSlotIds={conflictSlotIds}
          onRemove={onRemove}
          onSeatsCommit={onSeatsCommit}
        />
      ))}
    </div>
  );
}
