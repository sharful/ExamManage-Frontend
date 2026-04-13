"use client";

import { use } from "react";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { useInvigilator } from "@/hooks/use-invigilators";
import { AppShell } from "@/components/layout/app-shell";
import { InvigilatorForm } from "@/components/invigilators/invigilator-form";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface Props {
  params: Promise<{ id: string }>;
}

export default function InvigilatorDetailPage({ params }: Props) {
  const { id } = use(params);
  const isNew = id === "new";

  const { data: invigilator, isLoading, isError } = useInvigilator(isNew ? null : id);

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
          <CardTitle>
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
    </AppShell>
  );
}
