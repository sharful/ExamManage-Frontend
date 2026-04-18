"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SeatsInputProps {
  /** Current persisted / default value. */
  value: number;
  maxSeats: number;
  /** When false, seats are not yet persisted (no assignment row) — input is informational only. */
  editable: boolean;
  onCommit: (seats: number) => void;
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

  function scheduleCommit(next: number) {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onCommit(next);
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
      return;
    }
    const clamped = Math.min(n, maxSeats);
    setLocal(String(clamped));
    if (editable && timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
      onCommit(clamped);
    }
  }

  return (
    <div className="flex flex-col items-end gap-0.5">
      <label className="flex items-center gap-1.5 text-xs text-muted-foreground">
        Seats
        <Input
          type="number"
          inputMode="numeric"
          min={1}
          max={maxSeats}
          value={local}
          onChange={handleChange}
          onBlur={handleBlur}
          disabled={!editable}
          aria-invalid={overCapacity}
          className={cn("h-7 w-16 text-sm", overCapacity && "border-destructive")}
        />
        <span className="text-[11px] text-muted-foreground">/ {maxSeats}</span>
      </label>
      {overCapacity && (
        <span className="text-[10px] text-destructive">
          Exceeds room capacity
        </span>
      )}
    </div>
  );
}
