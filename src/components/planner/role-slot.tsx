"use client";

import { useDroppable } from "@dnd-kit/core";
import { X, Loader2, Plus } from "lucide-react";
import type { Invigilator } from "@/types";
import { cn } from "@/lib/utils";
import {
  makeDroppableId,
  ROLE_LABEL,
  type RoleKey,
} from "@/lib/planner-utils";

interface RoleSlotProps {
  roomId: string;
  role: RoleKey;
  /** The invigilator currently assigned to this role, if any. */
  invigilator?: Invigilator | null;
  /** True while this slot's persistence is in flight. */
  isPending?: boolean;
  /** True when the last drop here returned a backend conflict (flash red). */
  hasConflict?: boolean;
  /** True when this is a draft (head-only, not yet persisted). */
  isDraft?: boolean;
  onRemove: () => void;
}

export function RoleSlot({
  roomId,
  role,
  invigilator,
  isPending = false,
  hasConflict = false,
  isDraft = false,
  onRemove,
}: RoleSlotProps) {
  const id = makeDroppableId(roomId, role);
  const { setNodeRef, isOver } = useDroppable({ id });

  const isOptional = role === "inv2";

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
        {ROLE_LABEL[role]}
        {isOptional && (
          <span className="ml-1 font-normal normal-case text-[10px]">
            (optional)
          </span>
        )}
      </span>
      <div
        ref={setNodeRef}
        role="group"
        aria-label={`Room role ${ROLE_LABEL[role]} drop zone`}
        className={cn(
          "relative flex min-h-[44px] items-center justify-between gap-2 rounded-xl border-2 px-3 py-1.5 text-sm transition-colors",
          invigilator
            ? "border-transparent bg-pastel-mint text-pastel-fg"
            : "border-dashed border-border bg-background/60",
          isOver &&
            !invigilator &&
            "border-primary bg-primary/10 text-primary",
          isOver &&
            invigilator &&
            "ring-2 ring-primary/60 ring-offset-1 ring-offset-background",
          hasConflict &&
            "ring-2 ring-destructive ring-offset-1 ring-offset-background",
          isDraft && "ring-1 ring-pastel-amber ring-offset-1 ring-offset-background"
        )}
      >
        {invigilator ? (
          <>
            <div className="flex min-w-0 flex-1 flex-col">
              <span className="truncate font-medium leading-tight">
                {invigilator.name}
              </span>
              {invigilator.department && (
                <span className="truncate text-[11px] leading-tight opacity-80">
                  {invigilator.department}
                </span>
              )}
              {isDraft && (
                <span className="truncate text-[10px] uppercase tracking-wide leading-tight opacity-70">
                  Unsaved — drop Invigilator 1 to save
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${invigilator.name} from ${ROLE_LABEL[role]}`}
              disabled={isPending}
              className={cn(
                "flex size-6 shrink-0 items-center justify-center rounded-full bg-background/70 text-muted-foreground",
                "transition-colors hover:bg-background hover:text-foreground",
                "disabled:opacity-50"
              )}
            >
              {isPending ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <X className="size-3.5" strokeWidth={2} />
              )}
            </button>
          </>
        ) : (
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Plus className="size-3.5" strokeWidth={1.75} />
            {isOver ? "Drop to assign" : `Drop invigilator here`}
          </span>
        )}
      </div>
    </div>
  );
}
