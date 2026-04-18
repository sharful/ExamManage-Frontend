"use client";

import { Users } from "lucide-react";
import type { Invigilator } from "@/types";
import { InvigilatorChip } from "./invigilator-chip";
import { NoAvailableInvigilators } from "./empty-states";

interface InvigilatorPoolProps {
  /** Invigilators already fetched via useAvailableInvigilators. */
  invigilators: Invigilator[];
  /** Ids already booked somewhere in the current exam — hidden from the pool. */
  assignedInvigilatorIds: Set<string>;
  isLoading?: boolean;
}

export function InvigilatorPool({
  invigilators,
  assignedInvigilatorIds,
  isLoading,
}: InvigilatorPoolProps) {
  const pool = invigilators.filter((i) => !assignedInvigilatorIds.has(i.id));

  return (
    <aside
      aria-label="Available invigilators"
      className="flex flex-col gap-3 rounded-3xl border border-border bg-card/60 p-4"
    >
      <header className="flex items-center gap-2">
        <span className="flex size-8 items-center justify-center rounded-full bg-pastel-lavender text-pastel-fg">
          <Users className="size-4" strokeWidth={1.75} />
        </span>
        <div className="flex flex-col">
          <h2 className="text-sm font-semibold leading-tight">
            Invigilator Pool
          </h2>
          <p className="text-xs text-muted-foreground leading-tight">
            {pool.length} available
          </p>
        </div>
      </header>

      {isLoading ? (
        <div className="flex flex-col gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="h-12 w-full animate-pulse rounded-2xl bg-muted/60"
            />
          ))}
        </div>
      ) : pool.length === 0 ? (
        <NoAvailableInvigilators />
      ) : (
        <div
          role="list"
          className="flex max-h-[65vh] flex-row gap-2 overflow-x-auto pb-1 md:flex-col md:overflow-x-visible md:overflow-y-auto md:pr-1"
        >
          {pool.map((inv) => (
            <div
              key={inv.id}
              role="listitem"
              className="min-w-[220px] md:min-w-0"
            >
              <InvigilatorChip invigilator={inv} />
            </div>
          ))}
        </div>
      )}
    </aside>
  );
}
