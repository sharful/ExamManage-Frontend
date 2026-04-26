"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SeatsInputProps {
  /** Current persisted / default value. */
  value: number;
  maxSeats: number;
  /** When false, seats are not yet persisted (no assignment row) — input is informational only. */
  editable: boolean;
  onCommit: (seats: number) => void | Promise<void>;
}

/**
 * Debounced inline editor for seat count.
 *
 * - Debounces commits by 600 ms after the user stops typing.
 * - Clamps to [1, maxSeats] on blur.
 * - Shows amber warning if the entered value exceeds maxSeats.
 */
export function SeatsInput({
  value,
  maxSeats,
  editable,
  onCommit,
}: SeatsInputProps) {
  const [local, setLocal] = useState(String(value));
  const [pending, setPending] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync when upstream value changes (e.g. after a refetch).
  useEffect(() => {
    setLocal(String(value));
  }, [value]);

  // Clear any pending timer on unmount.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const parsed = parseInt(local, 10);
  const isValid = Number.isFinite(parsed) && parsed >= 1;
  const overCapacity = isValid && parsed > maxSeats;

  async function runCommit(next: number) {
    setPending(true);
    try {
      await onCommit(next);
    } finally {
      setPending(false);
    }
  }

  function scheduleCommit(next: number) {
    if (timerRef.current) clearTimeout(timerRef.current);
    setPending(true);
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      void runCommit(next);
    }, 600);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const next = e.target.value;
    setLocal(next);
    if (!editable) return;
    const n = parseInt(next, 10);
    if (!Number.isFinite(n) || n < 1) return;
    const clamped = Math.min(n, maxSeats);
    scheduleCommit(clamped);
  }

  function handleBlur() {
    const n = parseInt(local, 10);
    if (!Number.isFinite(n) || n < 1) {
      setLocal(String(value));
      setPending(false);
      return;
    }
    const clamped = Math.min(n, maxSeats);
    setLocal(String(clamped));
    if (editable && timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      void runCommit(clamped);
    }
  }

  const disabledHint = !editable
    ? "Add an Invigilator 1 to enable seat editing"
    : undefined;

  return (
    <div className="flex flex-col items-end gap-0.5">
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        Seats
        <span className="relative inline-flex items-center">
          <Input
            type="number"
            inputMode="numeric"
            min={1}
            max={maxSeats}
            value={local}
            onChange={handleChange}
            onBlur={handleBlur}
            disabled={!editable}
            title={disabledHint}
            aria-invalid={overCapacity}
            aria-describedby={overCapacity ? `seats-hint` : undefined}
            className={cn(
              "h-7 w-16 pr-6 text-sm",
              overCapacity && "border-destructive",
            )}
          />
          {pending && editable && (
            <Loader2
              aria-hidden="true"
              className="pointer-events-none absolute right-1.5 size-3 animate-spin text-muted-foreground"
            />
          )}
        </span>
        <span className="text-[11px] text-muted-foreground">/ {maxSeats}</span>
      </label>
      {overCapacity && (
        <span
          id="seats-hint"
          className="text-[10px] text-destructive"
        >
          Exceeds room capacity — will be clamped to {maxSeats}
        </span>
      )}
    </div>
  );
}
