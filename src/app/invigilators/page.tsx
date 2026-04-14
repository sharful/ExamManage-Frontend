"use client";

import { useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import {
  useInvigilators,
  useInvigilatorDepartments,
  useWorkloadSummary,
} from "@/hooks/use-invigilators";
import type { InvigilatorStatus } from "@/types";
import { AppShell } from "@/components/layout/app-shell";
import { InvigilatorTable } from "@/components/invigilators/invigilator-table";
import { InvigilatorCard } from "@/components/invigilators/invigilator-card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

// ── Status filter chips ────────────────────────────────────────────────────

const STATUS_OPTIONS: { label: string; value: InvigilatorStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Available", value: "available" },
  { label: "Unavailable", value: "unavailable" },
];

// ── Duty count color badge ─────────────────────────────────────────────────

function DutyBadge({ count }: { count: number }) {
  const cls =
    count > 10
      ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
      : count >= 5
        ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
        : "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${cls}`}
    >
      {count}
    </span>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────

export default function InvigilatorsPage() {
  const router = useRouter();

  // ── Tab state
  const [activeTab, setActiveTab] = useState<"directory" | "workload">(
    "directory"
  );

  // ── Directory tab state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvigilatorStatus | "">("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [page, setPage] = useState(1);

  // ── Workload tab state (month/year selector)
  const now = new Date();
  const [workloadMonth, setWorkloadMonth] = useState(now.getMonth() + 1);
  const [workloadYear, setWorkloadYear] = useState(now.getFullYear());

  // Debounce search
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
    const timer = setTimeout(() => setDebouncedSearch(value), 350);
    return () => clearTimeout(timer);
  }, []);

  // ── Queries
  const { data, isLoading, isError } = useInvigilators({
    page,
    page_size: PAGE_SIZE,
    search: debouncedSearch,
    status: statusFilter,
    department: departmentFilter,
  });

  const { data: departments } = useInvigilatorDepartments();

  // Current-month workload summary (always fetched so the table column is populated)
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const { data: currentMonthSummary } = useWorkloadSummary(
    currentMonth,
    currentYear
  );

  // Workload tab — may be different month
  const { data: workloadSummary, isLoading: workloadLoading } =
    useWorkloadSummary(workloadMonth, workloadYear);

  // Build duty count map for the table column (current month)
  const dutyCountMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const item of currentMonthSummary?.data ?? []) {
      m.set(item.invigilator_id, item.assignment_count);
    }
    return m;
  }, [currentMonthSummary]);

  const dutyColumnLabel = `${MONTH_NAMES[currentMonth - 1]} duties`;
  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

  // Month options for the workload selector (past 12 months + current + next)
  const monthOptions = useMemo(() => {
    const options: { label: string; month: number; year: number }[] = [];
    for (let i = -11; i <= 1; i++) {
      const d = new Date(currentYear, currentMonth - 1 + i, 1);
      options.push({
        label: `${MONTH_NAMES[d.getMonth()]} ${d.getFullYear()}`,
        month: d.getMonth() + 1,
        year: d.getFullYear(),
      });
    }
    return options.reverse();
  }, [currentMonth, currentYear]);

  return (
    <AppShell>
      {/* Page header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold sm:text-2xl">Invigilators</h1>
        <Button
          className="hidden sm:inline-flex"
          onClick={() => router.push("/invigilators/new")}
        >
          <Plus />
          Add invigilator
        </Button>
      </div>

      {/* Tab switcher */}
      <div className="mb-4 flex gap-1 border-b border-border">
        {(["directory", "workload"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={cn(
              "px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors",
              activeTab === tab
                ? "border-primary text-primary"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* ── Directory tab ─────────────────────────────────────────────────── */}
      {activeTab === "directory" && (
        <>
          {/* Search + filters */}
          <div className="mb-4 flex flex-col gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
              <Input
                type="search"
                placeholder="Search by name, department…"
                className="pl-9"
                value={search}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div role="group" aria-label="Filter by status" className="flex gap-1">
                {STATUS_OPTIONS.map(({ label, value }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => { setStatusFilter(value); setPage(1); }}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-medium border transition-colors",
                      statusFilter === value
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background border-border text-muted-foreground hover:bg-muted"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {departments && departments.length > 0 && (
                <Select
                  value={departmentFilter}
                  onChange={(e) => { setDepartmentFilter(e.target.value); setPage(1); }}
                  className="h-7 w-auto text-xs py-0 pr-8"
                  aria-label="Filter by department"
                >
                  <option value="">All departments</option>
                  {departments.map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </Select>
              )}
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
              Loading…
            </div>
          ) : isError ? (
            <div className="flex items-center justify-center py-20 text-destructive text-sm">
              Failed to load invigilators. Please try again.
            </div>
          ) : (
            <>
              <div className="hidden lg:block">
                <InvigilatorTable
                  data={data?.items ?? []}
                  dutyCountMap={dutyCountMap.size > 0 ? dutyCountMap : undefined}
                  dutyColumnLabel={dutyColumnLabel}
                />
              </div>
              <div className="flex flex-col gap-2 lg:hidden">
                {(data?.items ?? []).length === 0 ? (
                  <p className="py-12 text-center text-muted-foreground text-sm">
                    No invigilators found.
                  </p>
                ) : (
                  (data?.items ?? []).map((inv) => (
                    <InvigilatorCard key={inv.id} invigilator={inv} />
                  ))
                )}
              </div>
            </>
          )}

          {/* Pagination */}
          {data && data.total > PAGE_SIZE && (
            <div className="mt-4 flex items-center justify-between gap-2 text-sm">
              <span className="text-muted-foreground">
                {(page - 1) * PAGE_SIZE + 1}–
                {Math.min(page * PAGE_SIZE, data.total)} of {data.total}
              </span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  aria-label="Previous page"
                >
                  <ChevronLeft />
                </Button>
                <span className="px-2 tabular-nums">{page} / {totalPages}</span>
                <Button
                  variant="outline"
                  size="icon-sm"
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  aria-label="Next page"
                >
                  <ChevronRight />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* ── Workload tab ──────────────────────────────────────────────────── */}
      {activeTab === "workload" && (
        <div className="flex flex-col gap-4">
          {/* Month selector */}
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-muted-foreground shrink-0">
              Month:
            </label>
            <Select
              value={`${workloadYear}-${workloadMonth}`}
              onChange={(e) => {
                const [y, m] = e.target.value.split("-").map(Number);
                setWorkloadYear(y);
                setWorkloadMonth(m);
              }}
              className="w-auto"
              aria-label="Select month"
            >
              {monthOptions.map((o) => (
                <option key={`${o.year}-${o.month}`} value={`${o.year}-${o.month}`}>
                  {o.label}
                </option>
              ))}
            </Select>

            <div className="ml-2 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-full bg-green-500 inline-block" />
                &lt; 5 duties
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-full bg-amber-500 inline-block" />
                5–10 duties
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-3 rounded-full bg-red-500 inline-block" />
                &gt; 10 duties
              </span>
            </div>
          </div>

          {/* Workload summary table */}
          {workloadLoading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground text-sm">
              Loading…
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium text-muted-foreground">
                      Invigilator
                    </th>
                    <th className="px-4 py-3 text-right font-medium text-muted-foreground">
                      Duties in{" "}
                      {MONTH_NAMES[workloadMonth - 1]} {workloadYear}
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {(workloadSummary?.data ?? []).length === 0 ? (
                    <tr>
                      <td
                        colSpan={2}
                        className="py-12 text-center text-muted-foreground"
                      >
                        No data for this period.
                      </td>
                    </tr>
                  ) : (
                    (workloadSummary?.data ?? []).map((item) => (
                      <tr
                        key={item.invigilator_id}
                        className="hover:bg-muted/30 cursor-pointer transition-colors"
                        onClick={() =>
                          router.push(`/invigilators/${item.invigilator_id}`)
                        }
                      >
                        <td className="px-4 py-3 font-medium">{item.name}</td>
                        <td className="px-4 py-3 text-right">
                          <DutyBadge count={item.assignment_count} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Mobile FAB (directory tab only) */}
      {activeTab === "directory" && (
        <button
          type="button"
          onClick={() => router.push("/invigilators/new")}
          className={cn(
            "fixed bottom-20 right-4 z-40 sm:hidden",
            "flex size-14 items-center justify-center rounded-full",
            "bg-primary text-primary-foreground shadow-lg",
            "hover:bg-primary/90 active:scale-95 transition-all",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          )}
          aria-label="Add invigilator"
        >
          <Plus className="size-6" />
        </button>
      )}
    </AppShell>
  );
}
