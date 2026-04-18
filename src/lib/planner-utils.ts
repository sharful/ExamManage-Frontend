/**
 * Pure helpers for the drag-and-drop Planner page.
 *
 * DnD id conventions:
 *   Draggable (invigilator chip): `inv:{invigilatorId}`
 *   Droppable (role slot):        `slot:{roomId}:{head|inv1|inv2}`
 */
import type { ExamAssignment } from "@/types";

export type RoleKey = "head" | "inv1" | "inv2";

export const ROLE_KEYS: readonly RoleKey[] = ["head", "inv1", "inv2"] as const;

export const ROLE_LABEL: Record<RoleKey, string> = {
  head: "Head Invigilator",
  inv1: "Invigilator 1",
  inv2: "Invigilator 2",
};

/** Maps a visual role slot to its ExamAssignment field name. */
export function roleToField(
  role: RoleKey
): "head_invigilator_id" | "invigilator1_id" | "invigilator2_id" {
  switch (role) {
    case "head":
      return "head_invigilator_id";
    case "inv1":
      return "invigilator1_id";
    case "inv2":
      return "invigilator2_id";
  }
}

/** Reverse lookup — given an assignment, return which role an invigilator id occupies (if any). */
export function findRoleForInvigilator(
  assignment: ExamAssignment,
  invigilatorId: string
): RoleKey | null {
  if (assignment.head_invigilator_id === invigilatorId) return "head";
  if (assignment.invigilator1_id === invigilatorId) return "inv1";
  if (assignment.invigilator2_id === invigilatorId) return "inv2";
  return null;
}

/** Build the canonical draggable id for an invigilator card. */
export function makeDraggableId(invigilatorId: string): string {
  return `inv:${invigilatorId}`;
}

/** Build the canonical droppable id for a role slot within a room. */
export function makeDroppableId(roomId: string, role: RoleKey): string {
  return `slot:${roomId}:${role}`;
}

export function parseDraggableId(id: string | number): string | null {
  if (typeof id !== "string") return null;
  if (!id.startsWith("inv:")) return null;
  return id.slice(4) || null;
}

export function parseDroppableId(
  id: string | number
): { roomId: string; role: RoleKey } | null {
  if (typeof id !== "string") return null;
  const parts = id.split(":");
  if (parts.length !== 3 || parts[0] !== "slot") return null;
  const [, roomId, role] = parts;
  if (!roomId) return null;
  if (role !== "head" && role !== "inv1" && role !== "inv2") return null;
  return { roomId, role };
}

/**
 * Single-role patch that both the backend AssignmentUpdate schema and the
 * frontend UpdateAssignmentPayload accept.
 */
export type RolePatch =
  | { head_invigilator_id: string }
  | { invigilator1_id: string }
  | { invigilator2_id: string | null };

/** Build a RolePatch for a single role change. */
export function buildRolePatch(
  role: RoleKey,
  invigilatorId: string | null
): RolePatch {
  switch (role) {
    case "head":
      // Head can never be cleared (backend requires it); caller must guard.
      return { head_invigilator_id: invigilatorId ?? "" };
    case "inv1":
      return { invigilator1_id: invigilatorId ?? "" };
    case "inv2":
      return { invigilator2_id: invigilatorId };
  }
}

/**
 * Given a room's existing assignment (if any) and an incoming drop, produce
 * either "create" (no assignment row yet, the Head slot just got filled) or
 * "update" (patch a single role field on the existing row).
 */
export type DropIntent =
  | { kind: "update"; assignmentId: string; patch: RolePatch }
  | { kind: "create-head"; head_invigilator_id: string }
  | { kind: "needs-head" };

export function computeDropIntent(
  assignment: ExamAssignment | undefined,
  role: RoleKey,
  invigilatorId: string
): DropIntent {
  if (assignment) {
    return {
      kind: "update",
      assignmentId: assignment.id,
      patch: buildRolePatch(role, invigilatorId),
    };
  }
  if (role !== "head") {
    return { kind: "needs-head" };
  }
  return { kind: "create-head", head_invigilator_id: invigilatorId };
}

/** Every invigilator id referenced by any assignment of the given exam. */
export function collectAssignedInvigilatorIds(
  assignments: ExamAssignment[] | undefined
): Set<string> {
  const s = new Set<string>();
  if (!assignments) return s;
  for (const a of assignments) {
    s.add(a.head_invigilator_id);
    s.add(a.invigilator1_id);
    if (a.invigilator2_id) s.add(a.invigilator2_id);
  }
  return s;
}

/** Map roomId -> assignment for the selected exam. */
export function indexAssignmentsByRoom(
  assignments: ExamAssignment[] | undefined
): Record<string, ExamAssignment> {
  const m: Record<string, ExamAssignment> = {};
  if (!assignments) return m;
  for (const a of assignments) m[a.room_id] = a;
  return m;
}
