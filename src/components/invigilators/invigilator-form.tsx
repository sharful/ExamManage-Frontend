"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import type { Invigilator } from "@/types";
import { useCreateInvigilator, useUpdateInvigilator } from "@/hooks/use-invigilators";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

// ── Validation schema ──────────────────────────────────────────────────────

const invigilatorSchema = z.object({
  name: z.string().min(1, "Name is required"),
  department: z.string(),
  institute: z.string(),
  mobile: z
    .string()
    .refine(
      (val) => !val || /^[0-9]{10,11}$/.test(val),
      "Mobile must be 10–11 digits"
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
        await updateMutation.mutateAsync({ id: invigilator.id, payload });
        toast("Invigilator updated successfully", "success");
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
          className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
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
    </form>
  );
}
