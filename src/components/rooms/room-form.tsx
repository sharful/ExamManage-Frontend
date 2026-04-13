"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { isAxiosError } from "axios";
import type { Room } from "@/types";
import { useCreateRoom, useUpdateRoom } from "@/hooks/use-rooms";
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
    }
  }, [open, room, reset]);

  async function onSubmit(values: RoomFormValues) {
    const payload = {
      room_number: values.room_number.trim(),
      max_seats: values.max_seats,
    };

    try {
      if (isEdit) {
        await updateMutation.mutateAsync({ id: room.id, payload });
        toast("Room updated", "success");
      } else {
        await createMutation.mutateAsync(payload);
        toast("Room created", "success");
      }
      onOpenChange(false);
    } catch (err) {
      const detail =
        isAxiosError(err) && typeof err.response?.data?.detail === "string"
          ? err.response.data.detail
          : undefined;

      if (detail?.includes("already exists")) {
        setError("room_number", { message: "Room number already exists" });
      } else {
        setError("root", {
          message: isEdit
            ? "Failed to update room. Please try again."
            : "Failed to create room. Please try again.",
        });
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogHeader>
        <DialogTitle>{isEdit ? "Edit room" : "Add room"}</DialogTitle>
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
              className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
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
    </Dialog>
  );
}
