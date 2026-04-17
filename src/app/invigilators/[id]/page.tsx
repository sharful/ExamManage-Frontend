"use client";

import { use } from "react";
import Link from "next/link";
import { ChevronLeft, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { useInvigilator, useInvigilatorWorkload } from "@/hooks/use-invigilators";
import { AppShell } from "@/components/layout/app-shell";
import { InvigilatorForm } from "@/components/invigilators/invigilator-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface Props {
  params: Promise<{ id: string }>;
}

export default function InvigilatorDetailPage({ params }: Props) {
  const { id } = use(params);
  const isNew = id === "new";

  const { data: invigilator, isLoading, isError } = useInvigilator(isNew ? null : id);
  const { data: workload } = useInvigilatorWorkload(isNew ? null : id);

  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  // Filter assigned dates to current month
  const thisMonthDates = (workload?.assigned_dates ?? []).filter((d) => {
    const [y, m] = d.split("-").map(Number);
    return y === currentYear && m === currentMonth;
  });

  const formattedDates = thisMonthDates.map((d) => {
    try {
      return format(new Date(d + "T00:00:00"), "EEEE, d MMM");
    } catch {
      return d;
    }
  });

  return (
    <AppShell>
      {/* Back link */}
      <Link
        href="/invigilators"
        className="mb-4 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ChevronLeft className="size-4" />
        Back to invigilators
      </Link>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="text-display text-2xl">
            {isNew ? "Add invigilator" : "Edit invigilator"}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {isNew ? (
            <InvigilatorForm />
          ) : isLoading ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Loading…
            </div>
          ) : isError || !invigilator ? (
            <div className="py-10 text-center text-sm text-destructive">
              Failed to load invigilator. Please go back and try again.
            </div>
          ) : (
            <InvigilatorForm invigilator={invigilator} />
          )}
        </CardContent>
      </Card>

      {/* Assigned dates for current month (only shown for existing invigilators) */}
      {!isNew && workload && (
        <Card tone="mint" className="max-w-2xl mt-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <span className="flex size-8 items-center justify-center rounded-full bg-card/60">
                <CalendarDays className="size-4" strokeWidth={1.75} />
              </span>
              Duties in {MONTH_NAMES[currentMonth - 1]} {currentYear}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {formattedDates.length === 0 ? (
              <p className="text-sm opacity-80">
                No duties assigned this month.
              </p>
            ) : (
              <ul className="flex flex-col gap-1.5">
                {formattedDates.map((label, i) => (
                  <li
                    key={thisMonthDates[i]}
                    className="flex items-center gap-2 text-sm"
                  >
                    <span className="size-2 rounded-full bg-pastel-fg shrink-0" />
                    {label}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs opacity-75">
              Total all-time: {workload.total_assignments} assignment
              {workload.total_assignments !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>
      )}
    </AppShell>
  );
}
