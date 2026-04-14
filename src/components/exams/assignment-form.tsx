"use client";

import { useEffect, useMemo } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { ExamAssignment, Room, TimeSlot } from "@/types";
import {
  useCreateAssignment,
  useUpdateAssignment,
  useAvailableInvigilators,
  type ConflictError,
} from "@/hooks/use-exams";
import { useRooms } from "@/hooks/use-rooms";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { ConflictBanner } from "@/components/exams/conflict-badge";
import { cn } from "@/lib/utils";
import { isAxiosError } from "axios";

// ── Schema ─────────────────────────────────────────────────────────────────

const assignmentSchema = z.object({
  room_id: z.string().min(1, "Room is required"),
  seats: z
    .number({ error: "Seats must be a number" })
    .int("Seats must be a whole number")
    .min(1, "At least 1 seat required"),
  head_invigilator_id: z.string().min(1, "Head invigilator is required"),
  invigilator1_id: z.string().min(1, "Invigilator 1 is required"),
  invigilator2_id: z.string().optional(),
});

export type AssignmentFormValues = z.infer<typeof assignmentSchema>;

// ── Props ──────────────────────────────────────────────────────────────────

interface AssignmentFormProps {
  examId: string;
  examDate: string;
  timeSlot: TimeSlot;
  assignment?: ExamAssignment;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// ── Component ──────────────────────────────────────────────────────────────

export function AssignmentForm({
  examId,
  examDate,
  timeSlot,
  assignment,
  onSuccess,
  onCancel,
}: AssignmentFormProps) {
  const isEdit = !!assignment;

  const createMutation = useCreateAssignment();
  const updateMutation = useUpdateAssignment();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const { data: roomsData } = useRooms({ limit: 200 });
  const rooms: Room[] = roomsData?.data ?? [];

  const { data: availableInvigilators = [] } = useAvailableInvigilators(
    examDate,
    timeSlot
  );

  const {
    register,
    handleSubmit,
    control,
    watch,
    setError,
    clearErrors,
    reset,
    formState: { errors },
  } = useForm<AssignmentFormValues>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      room_id: "",
      seats: 1,
      head_invigilator_id: "",
      invigilator1_id: "",
      invigilator2_id: "",
    },
  });

  useEffect(() => {
    if (assignment) {
      reset({
        room_id: assignment.room_id,
        seats: assignment.seats,
        head_invigilator_id: assignment.head_invigilator_id,
        invigilator1_id: assignment.invigilator1_id,
        invigilator2_id: assignment.invigilator2_id ?? "",
      });
    }
  }, [assignment, reset]);

  // ── Watch values for real-time client validation ───────────────────────

  const watchedRoomId = watch("room_id");
  const watchedSeats = watch("seats");
  const watchedHead = watch("head_invigilator_id");
  const watchedInv1 = watch("invigilator1_id");
  const watchedInv2 = watch("invigilator2_id");

  const selectedRoom = useMemo(
    () => rooms.find((r) => r.id === watchedRoomId) ?? null,
    [rooms, watchedRoomId]
  );

  const clientConflicts = useMemo<ConflictError[]>(() => {
    const warnings: ConflictError[] = [];

    if (selectedRoom && watchedSeats > selectedRoom.max_seats) {
      warnings.push({
        type: "OVER_CAPACITY",
        message: `Seats (${watchedSeats}) exceed room capacity (max ${selectedRoom.max_seats}).`,
      });
    }

    const roles = [watchedHead, watchedInv1, watchedInv2].filter(Boolean);
    const unique = new Set(roles);
    if (unique.size < roles.length) {
      warnings.push({
        type: "DUPLICATE_IN_ROOM",
        message: "The same invigilator cannot be assigned to multiple roles.",
      });
    }

    return warnings;
  }, [selectedRoom, watchedSeats, watchedHead, watchedInv1, watchedInv2]);

  // ── Submit ─────────────────────────────────────────────────────────────

  async function onSubmit(values: AssignmentFormValues) {
    clearErrors("root");

    try {
      if (isEdit) {
        const result = await updateMutation.mutateAsync({
          id: assignment.id,
          payload: {
            room_id: values.room_id,
            seats: values.seats,
            head_invigilator_id: values.head_invigilator_id,
            invigilator1_id: values.invigilator1_id,
            invigilator2_id: values.invigilator2_id || null,
          },
        });

        if (result.conflicts?.length) {
          setError("root", {
            message: result.conflicts.map((c) => c.message).join(" "),
          });
          return;
        }

        toast("Assignment updated", "success");
      } else {
        const result = await createMutation.mutateAsync({
          exam_id: examId,
          room_id: values.room_id,
          seats: values.seats,
          head_invigilator_id: values.head_invigilator_id,
          invigilator1_id: values.invigilator1_id,
          invigilator2_id: values.invigilator2_id || null,
        });

        if (result.conflicts?.length) {
          setError("root", {
            message: result.conflicts.map((c) => c.message).join(" "),
          });
          return;
        }

        toast("Assignment created", "success");
      }

      onSuccess?.();
    } catch (err) {
      if (isAxiosError(err) && err.response?.data) {
        const data = err.response.data as {
          conflicts?: ConflictError[];
          detail?: string;
        };
        if (data.conflicts?.length) {
          setError("root", {
            message: data.conflicts.map((c: ConflictError) => c.message).join(" "),
          });
          return;
        }
        if (typeof data.detail === "string") {
          setError("root", { message: data.detail });
          return;
        }
      }
      setError("root", {
        message: isEdit
          ? "Failed to update assignment. Please try again."
          : "Failed to create assignment. Please try again.",
      });
    }
  }

  // ── Build invigilator options (always show all available, mark selected) ──

  function invOptions(excludeIds: (string | undefined)[]) {
    return availableInvigilators.filter(
      (inv) => !excludeIds.filter(Boolean).includes(inv.id)
    );
  }

  const headOptions = invOptions([watchedInv1, watchedInv2]);
  const inv1Options = invOptions([watchedHead, watchedInv2]);
  const inv2Options = invOptions([watchedHead, watchedInv1]);

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-5"
    >
      {/* Server / root error shown as conflict banner */}
      {errors.root && (
        <div
          role="alert"
          className="rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2.5 text-sm text-destructive"
        >
          {errors.root.message}
        </div>
      )}

      {/* Real-time client-side conflict warnings */}
      {clientConflicts.length > 0 && (
        <ConflictBanner conflicts={clientConflicts} />
      )}

      {/* Desktop: 2-col, mobile: 1-col */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

        {/* Room */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="room_id" className="text-sm font-medium">
            Room <span className="text-destructive">*</span>
          </label>
          <Select
            id="room_id"
            aria-invalid={!!errors.room_id}
            {...register("room_id")}
          >
            <option value="">Select room…</option>
            {rooms.map((r) => (
              <option key={r.id} value={r.id}>
                {r.room_number} (cap {r.max_seats})
              </option>
            ))}
          </Select>
          {errors.room_id && (
            <p className="text-xs text-destructive">{errors.room_id.message}</p>
          )}
          {selectedRoom && (
            <p className="text-xs text-muted-foreground">
              Capacity: {selectedRoom.max_seats} seats
            </p>
          )}
        </div>

        {/* Seats */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="seats" className="text-sm font-medium">
            Seats <span className="text-destructive">*</span>
          </label>
          <Input
            id="seats"
            type="number"
            inputMode="numeric"
            min={1}
            max={selectedRoom?.max_seats}
            aria-invalid={!!errors.seats}
            {...register("seats", { valueAsNumber: true })}
          />
          {errors.seats && (
            <p className="text-xs text-destructive">{errors.seats.message}</p>
          )}
        </div>

        {/* Head Invigilator */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="head_invigilator_id" className="text-sm font-medium">
            Head Invigilator <span className="text-destructive">*</span>
          </label>
          <Controller
            name="head_invigilator_id"
            control={control}
            render={({ field }) => (
              <Select
                id="head_invigilator_id"
                aria-invalid={!!errors.head_invigilator_id}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              >
                <option value="">Select…</option>
                {/* Always include the currently selected value even if not in filtered list */}
                {isEdit &&
                  assignment.head_invigilator_id &&
                  !headOptions.find(
                    (i) => i.id === assignment.head_invigilator_id
                  ) && (
                    <option value={assignment.head_invigilator_id}>
                      (current – may be unavailable)
                    </option>
                  )}
                {headOptions.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.name}
                    {inv.department ? ` — ${inv.department}` : ""}
                  </option>
                ))}
              </Select>
            )}
          />
          {errors.head_invigilator_id && (
            <p className="text-xs text-destructive">
              {errors.head_invigilator_id.message}
            </p>
          )}
        </div>

        {/* Invigilator 1 */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="invigilator1_id" className="text-sm font-medium">
            Invigilator 1 <span className="text-destructive">*</span>
          </label>
          <Controller
            name="invigilator1_id"
            control={control}
            render={({ field }) => (
              <Select
                id="invigilator1_id"
                aria-invalid={!!errors.invigilator1_id}
                value={field.value}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              >
                <option value="">Select…</option>
                {isEdit &&
                  assignment.invigilator1_id &&
                  !inv1Options.find(
                    (i) => i.id === assignment.invigilator1_id
                  ) && (
                    <option value={assignment.invigilator1_id}>
                      (current – may be unavailable)
                    </option>
                  )}
                {inv1Options.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.name}
                    {inv.department ? ` — ${inv.department}` : ""}
                  </option>
                ))}
              </Select>
            )}
          />
          {errors.invigilator1_id && (
            <p className="text-xs text-destructive">
              {errors.invigilator1_id.message}
            </p>
          )}
        </div>

        {/* Invigilator 2 (optional) */}
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="invigilator2_id" className="text-sm font-medium">
            Invigilator 2{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </label>
          <Controller
            name="invigilator2_id"
            control={control}
            render={({ field }) => (
              <Select
                id="invigilator2_id"
                aria-invalid={!!errors.invigilator2_id}
                value={field.value ?? ""}
                onChange={field.onChange}
                onBlur={field.onBlur}
                ref={field.ref}
              >
                <option value="">None</option>
                {isEdit &&
                  assignment.invigilator2_id &&
                  !inv2Options.find(
                    (i) => i.id === assignment.invigilator2_id
                  ) && (
                    <option value={assignment.invigilator2_id}>
                      (current – may be unavailable)
                    </option>
                  )}
                {inv2Options.map((inv) => (
                  <option key={inv.id} value={inv.id}>
                    {inv.name}
                    {inv.department ? ` — ${inv.department}` : ""}
                  </option>
                ))}
              </Select>
            )}
          />
        </div>
      </div>

      {/* Actions */}
      <div className={cn("flex gap-3", "justify-end")}>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={isPending}>
          {isPending
            ? isEdit
              ? "Saving…"
              : "Adding…"
            : isEdit
              ? "Save changes"
              : "Add assignment"}
        </Button>
      </div>
    </form>
  );
}
