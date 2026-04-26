"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import { ArrowUpDown, ArrowUp, ArrowDown, Pencil, Trash2 } from "lucide-react";
import type { Invigilator } from "@/types";
import { useDeleteInvigilator } from "@/hooks/use-invigilators";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
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
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

// ── Column helper ──────────────────────────────────────────────────────────

const col = createColumnHelper<Invigilator>();

// ── Sort icon ──────────────────────────────────────────────────────────────

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") return <ArrowUp className="size-3 ml-1 inline" />;
  if (sorted === "desc") return <ArrowDown className="size-3 ml-1 inline" />;
  return <ArrowUpDown className="size-3 ml-1 inline opacity-40" />;
}

// ── Duty count badge ───────────────────────────────────────────────────────

function DutyBadge({ count }: { count: number }) {
  const variant: "pink" | "peach" | "mint" =
    count > 10 ? "pink" : count >= 5 ? "peach" : "mint";
  return (
    <Badge variant={variant} className="font-semibold">
      {count}
    </Badge>
  );
}

// ── Component ──────────────────────────────────────────────────────────────

interface InvigilatorTableProps {
  data: Invigilator[];
  /** Optional map of invigilator id → duty count for the current month */
  dutyCountMap?: Map<string, number>;
  /** Label shown in the duty column header, e.g. "Apr duties" */
  dutyColumnLabel?: string;
  /** Custom empty-state message shown when there are no rows. */
  emptyMessage?: string;
  /** Optional CTA label for the empty state. */
  addLabel?: string;
  /** When provided, render a CTA in the empty state. */
  onAdd?: () => void;
}

export function InvigilatorTable({
  data,
  dutyCountMap,
  dutyColumnLabel = "Duties",
  emptyMessage = "No invigilators yet.",
  addLabel = "Add your first invigilator",
  onAdd,
}: InvigilatorTableProps) {
  const router = useRouter();
  const deleteMutation = useDeleteInvigilator();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [deleteTarget, setDeleteTarget] = useState<Invigilator | null>(null);

  const columns = [
    col.accessor("name", {
      header: "Name",
      cell: (info) => (
        <span className="font-medium">{info.getValue()}</span>
      ),
    }),
    col.accessor("department", {
      header: "Department",
      cell: (info) => info.getValue() ?? <span className="text-muted-foreground">—</span>,
    }),
    col.accessor("institute", {
      header: "Institute",
      cell: (info) => info.getValue() ?? <span className="text-muted-foreground">—</span>,
    }),
    col.accessor("designation", {
      header: "Designation",
      cell: (info) => info.getValue() ?? <span className="text-muted-foreground">—</span>,
    }),
    col.accessor("mobile", {
      header: "Mobile",
      enableSorting: false,
      cell: (info) => info.getValue() ?? <span className="text-muted-foreground">—</span>,
    }),
    col.accessor("status", {
      header: "Status",
      cell: (info) => (
        <Badge variant={info.getValue() === "available" ? "mint" : "pink"}>
          {info.getValue() === "available" ? "Available" : "Unavailable"}
        </Badge>
      ),
    }),
    ...(dutyCountMap
      ? [
          col.display({
            id: "duty_count",
            header: () => <span>{dutyColumnLabel}</span>,
            enableSorting: false,
            cell: ({ row }) => {
              const count = dutyCountMap.get(row.original.id) ?? 0;
              return <DutyBadge count={count} />;
            },
          }),
        ]
      : []),
    col.display({
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => router.push(`/invigilators/${row.original.id}`)}
            aria-label={`Edit ${row.original.name}`}
          >
            <Pencil />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={() => setDeleteTarget(row.original)}
            aria-label={`Delete ${row.original.name}`}
          >
            <Trash2 />
          </Button>
        </div>
      ),
    }),
  ];

  const table = useReactTable({
    data,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    manualPagination: true,
  });

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast(`${deleteTarget.name} deleted`, "success");
    } catch {
      toast("Failed to delete invigilator", "error");
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <>
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent">
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={header.column.getCanSort() ? "cursor-pointer select-none" : ""}
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
                    {header.column.getCanSort() && (
                      <SortIcon sorted={header.column.getIsSorted()} />
                    )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="py-12 text-center"
                >
                  <div className="flex flex-col items-center gap-3">
                    <p className="text-sm text-muted-foreground">
                      {emptyMessage}
                    </p>
                    {onAdd && (
                      <Button size="sm" onClick={onAdd}>
                        {addLabel}
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <DialogHeader>
          <DialogTitle>Delete invigilator?</DialogTitle>
          <DialogDescription>
            <strong>{deleteTarget?.name}</strong> will be permanently removed. This
            action cannot be undone.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            {deleteMutation.isPending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
