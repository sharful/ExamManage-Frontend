"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { AlertTriangle, ExternalLink } from "lucide-react";
import type { AffectedAssignment, Invigilator } from "@/types";
import { useCreateInvigilator, useUpdateInvigilator } from "@/hooks/use-invigilators";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

// ── Validation schema ──────────────────────────────────────────────────────

const invigilatorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  department: z.string(),
  institute: z.string(),
  mobile: z
    .string()
    .refine(
      (val) => !val || /^\+?\d{7,15}$/.test(val),
      "Mobile must be 7–15 digits, optionally prefixed with +"
    ),
  email: z
    .string()
    .refine(
      (val) => !val || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
      "Invalid email address"
    ),
  status: z.enum(["available", "unavailable"]),
  remarks: z.string(),
});

export type InvigilatorFormValues = z.infer<typeof invigilatorSchema>;

// ── Component ──────────────────────────────────────────────────────────────

interface InvigilatorFormProps {
  invigilator?: Invigilator;
}

export function InvigilatorForm({ invigilator }: InvigilatorFormProps) {
  const router = useRouter();
  const isEdit = !!invigilator;

  const createMutation = useCreateInvigilator();
  const updateMutation = useUpdateInvigilator();
  const isPending = createMutation.isPending || updateMutation.isPending;

  // Warning dialog when marking an invigilator unavailable
  const [affectedAssignments, setAffectedAssignments] = useState<AffectedAssignment[]>([]);

  const {
    register,
    handleSubmit,
    setError,
    reset,
    formState: { errors },
  } = useForm<InvigilatorFormValues>({
    resolver: zodResolver(invigilatorSchema),
    defaultValues: {
      name: "",
      department: "",
      institute: "",
      mobile: "",
      email: "",
      status: "available",
      remarks: "",
    },
  });

  // Populate form when editing
  useEffect(() => {
    if (invigilator) {
      reset({
        name: invigilator.name,
        department: invigilator.department ?? "",
        institute: invigilator.institute ?? "",
        mobile: invigilator.mobile ?? "",
        email: invigilator.email ?? "",
        status: invigilator.status,
        remarks: invigilator.remarks ?? "",
      });
    }
  }, [invigilator, reset]);

  async function onSubmit(values: InvigilatorFormValues) {
    const payload = {
      name: values.name,
      department: values.department || null,
      institute: values.institute || null,
      mobile: values.mobile || null,
      email: values.email || null,
      status: values.status,
      remarks: values.remarks || null,
    };

    try {
      if (isEdit) {
        const result = await updateMutation.mutateAsync({ id: invigilator.id, payload });
        toast("Invigilator updated successfully", "success");
        if (result.affected_assignments.length > 0) {
          setAffectedAssignments(result.affected_assignments);
          return; // Stay on page to show warning dialog
        }
      } else {
        await createMutation.mutateAsync(payload);
        toast("Invigilator created successfully", "success");
      }
      router.push("/invigilators");
    } catch {
      setError("root", {
        message: isEdit
          ? "Failed to update invigilator. Please try again."
          : "Failed to create invigilator. Please try again.",
      });
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-6"
    >
      {errors.root && (
        <div
          role="alert"
          className="rounded-2xl border-transparent bg-pastel-pink px-4 py-3 text-sm text-pastel-fg"
        >
          {errors.root.message}
        </div>
      )}

      {/* 2-col on desktop, single-col on mobile */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* Name */}
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="name" className="text-sm font-medium">
            Full Name <span className="text-destructive">*</span>
          </label>
          <Input
            id="name"
            placeholder="e.g. Dr. Ahmed Khan"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>

        {/* Department */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="department" className="text-sm font-medium">
            Department
          </label>
          <Input
            id="department"
            placeholder="e.g. Mathematics"
            aria-invalid={!!errors.department}
            {...register("department")}
          />
          {errors.department && (
            <p className="text-xs text-destructive">{errors.department.message}</p>
          )}
        </div>

        {/* Institute */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="institute" className="text-sm font-medium">
            Institute
          </label>
          <Input
            id="institute"
            placeholder="e.g. City College"
            aria-invalid={!!errors.institute}
            {...register("institute")}
          />
          {errors.institute && (
            <p className="text-xs text-destructive">{errors.institute.message}</p>
          )}
        </div>

        {/* Mobile */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="mobile" className="text-sm font-medium">
            Mobile Number
          </label>
          <Input
            id="mobile"
            type="tel"
            inputMode="numeric"
            placeholder="e.g. 03001234567"
            aria-invalid={!!errors.mobile}
            {...register("mobile")}
          />
          {errors.mobile ? (
            <p className="text-xs text-destructive">{errors.mobile.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground">10–11 digits, no spaces</p>
          )}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="email" className="text-sm font-medium">
            Email
          </label>
          <Input
            id="email"
            type="email"
            placeholder="e.g. ahmed@example.com"
            aria-invalid={!!errors.email}
            {...register("email")}
          />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>

        {/* Status */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="status" className="text-sm font-medium">
            Status <span className="text-destructive">*</span>
          </label>
          <Select
            id="status"
            aria-invalid={!!errors.status}
            {...register("status")}
          >
            <option value="available">Available</option>
            <option value="unavailable">Unavailable</option>
          </Select>
          {errors.status && (
            <p className="text-xs text-destructive">{errors.status.message}</p>
          )}
        </div>

        {/* Remarks */}
        <div className="flex flex-col gap-1.5 sm:col-span-2">
          <label htmlFor="remarks" className="text-sm font-medium">
            Remarks
          </label>
          <Textarea
            id="remarks"
            placeholder="Any additional notes…"
            aria-invalid={!!errors.remarks}
            {...register("remarks")}
          />
          {errors.remarks && (
            <p className="text-xs text-destructive">{errors.remarks.message}</p>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className={cn("flex gap-3", isEdit ? "justify-between" : "justify-end")}>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/invigilators")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending
            ? isEdit
              ? "Saving…"
              : "Creating…"
            : isEdit
              ? "Save changes"
              : "Create invigilator"}
        </Button>
      </div>

      {/* ── Unavailability warning dialog ──────────────────────────────── */}
      <Dialog
        open={affectedAssignments.length > 0}
        onOpenChange={(open) => {
          if (!open) {
            setAffectedAssignments([]);
            router.push("/invigilators");
          }
        }}
      >
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-pastel-peach text-pastel-fg">
              <AlertTriangle className="size-4" strokeWidth={1.75} />
            </span>
            Invigilator marked unavailable
          </DialogTitle>
        </DialogHeader>
        <DialogContent className="pb-2">
          <p className="text-sm text-muted-foreground mb-3">
            This invigilator has{" "}
            <span className="font-medium text-foreground">
              {affectedAssignments.length} upcoming assignment
              {affectedAssignments.length !== 1 ? "s" : ""}
            </span>{" "}
            that may need to be reassigned:
          </p>
          <div className="flex flex-col gap-2 max-h-72 overflow-y-auto">
            {affectedAssignments.map((a) => {
              const roleLabel =
                a.role === "head"
                  ? "Head Invigilator"
                  : a.role === "invigilator1"
                  ? "Invigilator 1"
                  : "Invigilator 2";
              const formattedDate = (() => {
                try {
                  return format(new Date(a.exam_date + "T00:00:00"), "d MMM yyyy");
                } catch {
                  return a.exam_date;
                }
              })();
              return (
                <div
                  key={a.assignment_id}
                  className="rounded-2xl bg-pastel-peach text-pastel-fg px-4 py-3 flex items-start justify-between gap-3"
                >
                  <div className="text-sm min-w-0">
                    <p className="font-medium truncate">{a.exam_name}</p>
                    <p className="text-xs opacity-80 mt-0.5">
                      {formattedDate} · Room {a.room_number} · {roleLabel}
                    </p>
                  </div>
                  <Link
                    href={`/exams/${a.exam_id}`}
                    className="shrink-0 inline-flex items-center gap-1 text-xs font-semibold hover:underline"
                    onClick={() => setAffectedAssignments([])}
                  >
                    Reassign
                    <ExternalLink className="size-3" />
                  </Link>
                </div>
              );
            })}
          </div>
        </DialogContent>
        <DialogFooter>
          <Button
            onClick={() => {
              setAffectedAssignments([]);
              router.push("/invigilators");
            }}
          >
            Dismiss
          </Button>
        </DialogFooter>
      </Dialog>
    </form>
  );
}
