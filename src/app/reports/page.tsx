"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Download, Loader2 } from "lucide-react";
import { isAxiosError } from "axios";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  useReportPreview,
  useDownloadReport,
  type ReportType,
  type ReportFormat,
  type PreviewSection,
} from "@/hooks/use-reports";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ── Constants ──────────────────────────────────────────────────────────────

const REPORT_TYPES: {
  value: ReportType;
  label: string;
  description: string;
}[] = [
  {
    value: "duty-list",
    label: "Duty List",
    description: "Invigilator assignments by role",
  },
  {
    value: "room-schedule",
    label: "Room Schedule",
    description: "Schedule grouped by room",
  },
  {
    value: "daily-schedule",
    label: "Daily Schedule",
    description: "Combined daily overview",
  },
];

// ── Page ───────────────────────────────────────────────────────────────────

export default function ReportsPage() {
  const today = format(new Date(), "yyyy-MM-dd");

  const [reportType, setReportType] = useState<ReportType>("duty-list");
  const [reportDate, setReportDate] = useState<string>(today);
  const [reportFormat, setReportFormat] = useState<ReportFormat>("pdf");

  const preview = useReportPreview(reportType, reportDate);
  const downloadMutation = useDownloadReport();

  function handleGenerate() {
    if (!reportDate) {
      toast("Please select a date", "error");
      return;
    }
    downloadMutation.mutate(
      { type: reportType, date: reportDate, format: reportFormat },
      {
        onError: (err) => {
          const detail =
            isAxiosError(err) &&
            typeof err.response?.data?.detail === "string"
              ? err.response.data.detail
              : "Failed to generate report. Please try again.";
          toast(detail, "error");
        },
        onSuccess: () => toast("Report downloaded", "success"),
      }
    );
  }

  return (
    <AppShell>
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-display text-3xl sm:text-4xl">Reports</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate duty lists, room schedules, and daily overviews.
          </p>
        </div>

        {/* ── Controls card ──────────────────────────────────────────────── */}
        <div className="rounded-2xl border border-border bg-card p-4 sm:p-6 flex flex-col gap-5 shadow-sm">
          {/* Report type selector */}
          <fieldset className="flex flex-col gap-2 border-0 p-0 m-0">
            <legend className="text-sm font-medium mb-2">Report Type</legend>
            <div className="flex flex-col sm:flex-row gap-2">
              {REPORT_TYPES.map(({ value, label, description }) => {
                const isSelected = reportType === value;
                return (
                  <button
                    key={value}
                    type="button"
                    role="radio"
                    aria-checked={isSelected}
                    onClick={() => setReportType(value)}
                    className={cn(
                      "flex-1 text-left rounded-2xl px-4 py-3 text-sm transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                      isSelected
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "bg-muted text-foreground hover:bg-muted/70"
                    )}
                  >
                    <p className="font-semibold">{label}</p>
                    <p
                      className={cn(
                        "text-xs mt-0.5",
                        isSelected ? "opacity-80" : "text-muted-foreground"
                      )}
                    >
                      {description}
                    </p>
                  </button>
                );
              })}
            </div>
          </fieldset>

          {/* Date + Format row */}
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Date picker */}
            <div className="flex flex-col gap-1.5 flex-1">
              <label htmlFor="report-date" className="text-sm font-medium">
                Date
              </label>
              <input
                id="report-date"
                type="date"
                value={reportDate}
                onChange={(e) => setReportDate(e.target.value)}
                className={cn(
                  "flex h-9 w-full rounded-lg border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors",
                  "focus-visible:outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                )}
              />
            </div>

            {/* Format toggle */}
            <div className="flex flex-col gap-1.5">
              <span className="text-sm font-medium" id="format-label">
                Format
              </span>
              <div
                role="group"
                aria-labelledby="format-label"
                className="inline-flex h-9 items-center gap-1 rounded-full bg-muted p-1"
              >
                {(["pdf", "excel"] as ReportFormat[]).map((fmt) => (
                  <button
                    key={fmt}
                    type="button"
                    onClick={() => setReportFormat(fmt)}
                    aria-pressed={reportFormat === fmt}
                    className={cn(
                      "rounded-full px-4 h-7 text-xs font-semibold transition-colors",
                      "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      reportFormat === fmt
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {fmt === "pdf" ? "PDF" : "Excel"}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Generate button */}
          <div className="flex justify-end">
            <Button
              onClick={handleGenerate}
              disabled={!reportDate || downloadMutation.isPending}
            >
              {downloadMutation.isPending ? (
                <Loader2 className="animate-spin" />
              ) : (
                <Download />
              )}
              {downloadMutation.isPending ? "Generating…" : "Generate & Download"}
            </Button>
          </div>
        </div>

        {/* ── Mobile placeholder (preview only renders at lg+) ───────────── */}
        <div className="lg:hidden rounded-2xl border border-dashed border-border bg-card/40 p-6 text-center text-sm text-muted-foreground">
          Generate &amp; download to view this report on your device. The
          on-screen preview is available on tablets and desktops.
        </div>

        {/* ── Desktop preview — hidden below lg ──────────────────────────── */}
        <div className="hidden lg:flex flex-col gap-6">
          {!reportDate ? null : preview.isLoading ? (
            <PreviewSkeleton />
          ) : preview.isError ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-destructive">
              Failed to load preview.
            </div>
          ) : !preview.data ||
            preview.data.sections.every((s) => s.rows.length === 0) ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-sm text-muted-foreground">
              No data found for {reportDate}. Assign invigilators to exams on
              this date first.
            </div>
          ) : (
            preview.data.sections.map((section) => (
              <PreviewTable key={section.title} section={section} />
            ))
          )}
        </div>
      </div>
    </AppShell>
  );
}

// ── Preview table ──────────────────────────────────────────────────────────

function PreviewTable({ section }: { section: PreviewSection }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-display text-xl">{section.title}</h2>
      <div className="rounded-2xl border border-border bg-card overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/40 hover:bg-muted/40">
              {section.headers.map((h) => (
                <TableHead key={h}>{h}</TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {section.rows.map((row, rowIdx) => (
              // eslint-disable-next-line react/no-array-index-key
              <TableRow key={rowIdx}>
                {row.map((cell, cellIdx) => (
                  // eslint-disable-next-line react/no-array-index-key
                  <TableCell key={cellIdx}>{cell}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <p className="text-xs text-muted-foreground">
        {section.rows.length}{" "}
        {section.rows.length === 1 ? "row" : "rows"}
      </p>
    </div>
  );
}

// ── Loading skeleton ───────────────────────────────────────────────────────

function PreviewSkeleton() {
  return (
    <div className="flex flex-col gap-2">
      <div className="h-5 w-40 rounded bg-muted animate-pulse" />
      <div className="rounded-2xl border border-border bg-card divide-y divide-border overflow-hidden">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex gap-4 px-3 py-3">
            {[1, 2, 3, 4, 5].map((j) => (
              <div
                key={j}
                className="h-4 flex-1 rounded bg-muted animate-pulse"
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
