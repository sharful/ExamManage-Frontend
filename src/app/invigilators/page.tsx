"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, Plus, ChevronLeft, ChevronRight } from "lucide-react";
import { useInvigilators, useInvigilatorDepartments } from "@/hooks/use-invigilators";
import type { InvigilatorStatus } from "@/types";
import { AppShell } from "@/components/layout/app-shell";
import { InvigilatorTable } from "@/components/invigilators/invigilator-table";
import { InvigilatorCard } from "@/components/invigilators/invigilator-card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 20;

// ── Status filter chips ────────────────────────────────────────────────────

const STATUS_OPTIONS: { label: string; value: InvigilatorStatus | "" }[] = [
  { label: "All", value: "" },
  { label: "Available", value: "available" },
  { label: "Unavailable", value: "unavailable" },
];

// ── Page ───────────────────────────────────────────────────────────────────

export default function InvigilatorsPage() {
  const router = useRouter();

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvigilatorStatus | "">("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [page, setPage] = useState(1);

  // Debounce search input
  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
    const timer = setTimeout(() => setDebouncedSearch(value), 350);
    return () => clearTimeout(timer);
  }, []);

  const { data, isLoading, isError } = useInvigilators({
    page,
    page_size: PAGE_SIZE,
    search: debouncedSearch,
    status: statusFilter,
    department: departmentFilter,
  });

  const { data: departments } = useInvigilatorDepartments();

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

  return (
    <AppShell>
      {/* Page header */}
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-xl font-semibold sm:text-2xl">Invigilators</h1>
        {/* Desktop "Add" button */}
        <Button
          className="hidden sm:inline-flex"
          onClick={() => router.push("/invigilators/new")}
        >
          <Plus />
          Add invigilator
        </Button>
      </div>

      {/* Search + filters */}
      <div className="mb-4 flex flex-col gap-3">
        {/* Search bar */}
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

        {/* Filter row */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Status chips */}
          <div
            role="group"
            aria-label="Filter by status"
            className="flex gap-1"
          >
            {STATUS_OPTIONS.map(({ label, value }) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setStatusFilter(value);
                  setPage(1);
                }}
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

          {/* Department filter */}
          {departments && departments.length > 0 && (
            <Select
              value={departmentFilter}
              onChange={(e) => {
                setDepartmentFilter(e.target.value);
                setPage(1);
              }}
              className="h-7 w-auto text-xs py-0 pr-8"
              aria-label="Filter by department"
            >
              <option value="">All departments</option>
              {departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </Select>
          )}
        </div>
      </div>

      {/* Content: table (desktop) / cards (mobile) */}
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
          {/* Desktop table: hidden below lg */}
          <div className="hidden lg:block">
            <InvigilatorTable data={data?.items ?? []} />
          </div>

          {/* Mobile cards: hidden at lg+ */}
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
            <span className="px-2 tabular-nums">
              {page} / {totalPages}
            </span>
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

      {/* Mobile FAB */}
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
    </AppShell>
  );
}
