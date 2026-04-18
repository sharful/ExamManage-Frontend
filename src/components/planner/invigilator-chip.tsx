"use client";

import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import type { Invigilator } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { makeDraggableId } from "@/lib/planner-utils";

interface InvigilatorChipProps {
  invigilator: Invigilator;
  /** When true, the chip is rendered but not draggable (e.g. unavailable). */
  disabled?: boolean;
  /** True when this chip is the overlay clone for the active drag. */
  ghostWhileDragging?: boolean;
}

export function InvigilatorChip({
  invigilator,
  disabled = false,
  ghostWhileDragging = true,
}: InvigilatorChipProps) {
  const isUnavailable = invigilator.status !== "available";
  const isDisabled = disabled || isUnavailable;

  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: makeDraggableId(invigilator.id),
      disabled: isDisabled,
    });

  const style: React.CSSProperties = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      aria-label={`${invigilator.name}, drag to assign`}
      aria-disabled={isDisabled || undefined}
      className={cn(
        "group flex items-center gap-2 rounded-2xl border border-border bg-card px-3 py-2 text-sm shadow-sm",
        "transition-[box-shadow,transform] touch-none select-none",
        !isDisabled &&
          "cursor-grab hover:shadow-md hover:-translate-y-px active:cursor-grabbing",
        isDisabled && "cursor-not-allowed opacity-60",
        isDragging && ghostWhileDragging && "opacity-40"
      )}
    >
      <GripVertical
        className="size-4 shrink-0 text-muted-foreground"
        strokeWidth={1.75}
        aria-hidden
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <span className="truncate font-medium leading-tight">
          {invigilator.name}
        </span>
        {invigilator.department && (
          <span className="truncate text-xs text-muted-foreground leading-tight">
            {invigilator.department}
          </span>
        )}
      </div>
      {isUnavailable && (
        <Badge variant="destructive" className="shrink-0">
          Unavailable
        </Badge>
      )}
    </div>
  );
}
