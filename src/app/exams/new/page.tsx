"use client";

import { Suspense, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useCreateExam } from "@/hooks/use-exams";
import { toast } from "@/hooks/use-toast";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

// ── Schema ─────────────────────────────────────────────────────────────────

const examSchema = z.object({
  exam_name: z.string().min(1, "Exam name is required"),
  exam_date: z.string().min(1, "Date is required"),
  time_slot: z.enum(["morning", "evening"]),
});

type ExamFormValues = z.infer<typeof examSchema>;

// ── Form (needs Suspense because it reads searchParams) ────────────────────

function NewExamForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillDate = searchParams.get("date") ?? "";

  const createExam = useCreateExam();

  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ExamFormValues>({
    resolver: zodResolver(examSchema),
    defaultValues: {
      exam_name: "",
      exam_date: prefillDate,
      time_slot: "morning",
    },
  });

  useEffect(() => {
    if (prefillDate) {
      reset((prev) => ({ ...prev, exam_date: prefillDate }));
    }
  }, [prefillDate, reset]);

  async function onSubmit(values: ExamFormValues) {
    try {
      const exam = await createExam.mutateAsync({
        exam_name: values.exam_name,
        exam_date: values.exam_date,
        time_slot: values.time_slot,
      });
      toast("Exam created", "success");
      router.push(`/exams/${exam.id}`);
    } catch {
      setError("root", {
        message: "Failed to create exam. Please try again.",
      });
    }
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="flex flex-col gap-5"
    >
      {errors.root && (
        <div
          role="alert"
          className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
        >
          {errors.root.message}
        </div>
      )}

      <div className="flex flex-col gap-4">
        {/* Exam name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="exam_name" className="text-sm font-medium">
            Exam name <span className="text-destructive">*</span>
          </label>
          <Input
            id="exam_name"
            placeholder="e.g. Mathematics Final"
            aria-invalid={!!errors.exam_name}
            {...register("exam_name")}
          />
          {errors.exam_name && (
            <p className="text-xs text-destructive">
              {errors.exam_name.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {/* Date */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="exam_date" className="text-sm font-medium">
              Date <span className="text-destructive">*</span>
            </label>
            <Input
              id="exam_date"
              type="date"
              aria-invalid={!!errors.exam_date}
              {...register("exam_date")}
            />
            {errors.exam_date && (
              <p className="text-xs text-destructive">
                {errors.exam_date.message}
              </p>
            )}
          </div>

          {/* Time slot */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="time_slot" className="text-sm font-medium">
              Time slot <span className="text-destructive">*</span>
            </label>
            <Select
              id="time_slot"
              aria-invalid={!!errors.time_slot}
              {...register("time_slot")}
            >
              <option value="morning">Morning</option>
              <option value="evening">Evening</option>
            </Select>
            {errors.time_slot && (
              <p className="text-xs text-destructive">
                {errors.time_slot.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/exams")}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={createExam.isPending}>
          {createExam.isPending ? "Creating…" : "Create exam"}
        </Button>
      </div>
    </form>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function NewExamPage() {
  return (
    <AppShell>
      <Link
        href="/exams"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="size-4" />
        Back to exams
      </Link>

      <Card className="max-w-lg">
        <CardHeader>
          <CardTitle>New exam</CardTitle>
        </CardHeader>
        <CardContent>
          <Suspense
            fallback={
              <div className="py-8 text-center text-sm text-muted-foreground">
                Loading…
              </div>
            }
          >
            <NewExamForm />
          </Suspense>
        </CardContent>
      </Card>
    </AppShell>
  );
}
