"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isAxiosError } from "axios";
import { AlertTriangle, ExternalLink } from "lucide-react";
import type { Room } from "@/types";
import { useCreateRoom, useUpdateRoom, RoomCapacityError } from "@/hooks/use-rooms";
import type { RoomCapacityWarning } from "@/hooks/use-rooms";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";

// ── Validation schema ──────────────────────────────────────────────────────

const roomSchema = z.object({
  room_number: z.string().min(1, "Room number is required"),
  max_seats: z
    .number()
    .int("Must be a whole number")
    .min(1, "Must be at least 1"),
});

export type RoomFormValues = z.infer<typeof roomSchema>;

// ── Component ──────────────────────────────────────────────────────────────

interface RoomFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pass a room to switch the form into edit mode */
  room?: Room;
}

export function RoomForm({ open, onOpenChange, room }: RoomFormProps) {
  const isEdit = !!room;
  const createMutation = useCreateRoom();
  const updateMutation = useUpdateRoom();
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Capacity warning state
  const [capacityWarning, setCapacityWarning] = useState<RoomCapacityWarning | null>(null);
  // Keep last payload so we can re-submit with force=true
  const pendingPayloadRef = useRef<RoomFormValues | null>(null);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<RoomFormValues>({
    resolver: zodResolver(roomSchema),
    defaultValues: { room_number: "", max_seats: 30 },
  });

  // Reset form whenever the dialog opens or the room changes
  useEffect(() => {
    if (open) {
      reset(
        room
          ? { room_number: room.room_number, max_seats: room.max_seats }
          : { room_number: "", max_seats: 30 }
      );
      setCapacityWarning(null);
      pendingPayloadRef.current = null;
    }
  }, [open, room, reset]);

  async function doUpdate(values: RoomFormValues, force = false) {
    const payload = { room_number: values.room_number.trim(), max_seats: values.max_seats };
    await updateMutation.mutateAsync({ id: room!.id, payload, force });
    toast("Room updated", "success");
    onOpenChange(false);
  }

  async function onSubmit(values: RoomFormValues) {
    if (!isEdit) {
      const payload = { room_number: values.room_number.trim(), max_seats: values.max_seats };
      try {
        await createMutation.mutateAsync(payload);
        toast("Room created", "success");
        onOpenChange(false);
      } catch (err) {
        const detail =
          isAxiosError(err) && typeof err.response?.data?.detail === "string"
            ? err.response.data.detail
            : undefined;
        if (detail?.includes("already exists")) {
          setError("room_number", { message: "Room number already exists" });
        } else {
          setError("root", { message: "Failed to create room. Please try again." });
        }
      }
      return;
    }

    try {
      await doUpdate(values);
    } catch (err) {
      if (err instanceof RoomCapacityError) {
        pendingPayloadRef.current = values;
        setCapacityWarning(err.warning);
        return;
      }
      const detail =
        isAxiosError(err) && typeof err.response?.data?.detail === "string"
          ? err.response.data.detail
          : undefined;
      if (detail?.includes("already exists")) {
        setError("room_number", { message: "Room number already exists" });
      } else {
        setError("root", { message: "Failed to update room. Please try again." });
      }
    }
  }

  async function handleForceSave() {
    if (!pendingPayloadRef.current) return;
    try {
      await doUpdate(pendingPayloadRef.current, true);
      setCapacityWarning(null);
    } catch (err) {
      setCapacityWarning(null);
      const detail =
        isAxiosError(err) && typeof err.response?.data?.detail === "string"
          ? err.response.data.detail
          : undefined;
      setError("root", { message: detail ?? "Failed to update room. Please try again." });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle className="text-display text-2xl">
          {isEdit ? "Edit room" : "Add room"}
        </DialogTitle>
      </DialogHeader>

      <DialogContent>
        <form
          id="room-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col gap-4 py-2"
        >
          {errors.root && (
            <div
              role="alert"
              className="rounded-2xl bg-pastel-pink text-pastel-fg px-4 py-3 text-sm"
            >
              {errors.root.message}
            </div>
          )}

          {/* Room Number */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="room_number" className="text-sm font-medium">
              Room Number <span className="text-destructive">*</span>
            </label>
            <Input
              id="room_number"
              placeholder="e.g. A-101"
              autoComplete="off"
              aria-invalid={!!errors.room_number}
              {...register("room_number")}
            />
            {errors.room_number && (
              <p className="text-xs text-destructive">{errors.room_number.message}</p>
            )}
          </div>

          {/* Max Seats */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="max_seats" className="text-sm font-medium">
              Max Seats <span className="text-destructive">*</span>
            </label>
            <Input
              id="max_seats"
              type="number"
              inputMode="numeric"
              min={1}
              placeholder="e.g. 30"
              aria-invalid={!!errors.max_seats}
              {...register("max_seats", { valueAsNumber: true })}
            />
            {errors.max_seats ? (
              <p className="text-xs text-destructive">{errors.max_seats.message}</p>
            ) : (
              <p className="text-xs text-muted-foreground">Must be greater than 0</p>
            )}
          </div>
        </form>
      </DialogContent>

      <DialogFooter>
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" form="room-form" disabled={isPending}>
          {isPending
            ? isEdit
              ? "Saving…"
              : "Creating…"
            : isEdit
              ? "Save changes"
              : "Add room"}
        </Button>
      </DialogFooter>

      {/* ── Capacity violation warning dialog ──────────────────────────── */}
      {capacityWarning && (
        <Dialog
          open={!!capacityWarning}
          onOpenChange={(open) => {
            if (!open) setCapacityWarning(null);
          }}
        >
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-full bg-pastel-peach text-pastel-fg">
                <AlertTriangle className="size-4" strokeWidth={1.75} />
              </span>
              Capacity violation
            </DialogTitle>
          </DialogHeader>
          <DialogContent className="pb-2">
            <p className="text-sm text-muted-foreground mb-3">
              {capacityWarning.detail}. The following assignment
              {capacityWarning.violations.length !== 1 ? "s" : ""} currently
              exceed the new capacity:
            </p>
            <div className="flex flex-col gap-1.5 max-h-60 overflow-y-auto">
              {capacityWarning.violations.map((v) => (
                <div
                  key={v.assignment_id}
                  className="rounded-2xl bg-pastel-peach text-pastel-fg px-4 py-3 flex items-center justify-between gap-3"
                >
                  <div className="text-sm min-w-0">
                    <p className="font-medium truncate">{v.exam_name}</p>
                    <p className="text-xs opacity-80 mt-0.5">
                      {v.seats} seats assigned
                    </p>
                  </div>
                  <Link
                    href={`/exams/${v.exam_id}`}
                    className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                    onClick={() => setCapacityWarning(null)}
                  >
                    View exam
                    <ExternalLink className="size-3" />
                  </Link>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              You can reduce the capacity anyway and adjust affected assignments
              manually, or cancel to keep the current capacity.
            </p>
          </DialogContent>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCapacityWarning(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleForceSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? "Saving…" : "Reduce capacity anyway"}
            </Button>
          </DialogFooter>
        </Dialog>
      )}
    </Dialog>
  );
}
