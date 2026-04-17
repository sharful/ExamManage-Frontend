"use client";

import { useState } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Pencil,
  Trash2,
  Check,
  X,
} from "lucide-react";
import { isAxiosError } from "axios";
import type { Room } from "@/types";
import { useUpdateRoom, useDeleteRoom } from "@/hooks/use-rooms";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

const col = createColumnHelper<Room>();

// ── Sort icon ──────────────────────────────────────────────────────────────

function SortIcon({ sorted }: { sorted: false | "asc" | "desc" }) {
  if (sorted === "asc") return <ArrowUp className="size-3 ml-1 inline" />;
  if (sorted === "desc") return <ArrowDown className="size-3 ml-1 inline" />;
  return <ArrowUpDown className="size-3 ml-1 inline opacity-40" />;
}

// ── Inline edit state ──────────────────────────────────────────────────────

interface InlineEdit {
  id: string;
  room_number: string;
  max_seats: string;
}

// ── Component ──────────────────────────────────────────────────────────────

interface RoomTableProps {
  data: Room[];
}

export function RoomTable({ data }: RoomTableProps) {
  const updateMutation = useUpdateRoom();
  const deleteMutation = useDeleteRoom();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [editing, setEditing] = useState<InlineEdit | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Room | null>(null);
  // Tracks a server-side error shown in the delete dialog (e.g. active assignments)
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // ── Inline edit helpers ──────────────────────────────────────────────────

  function startEdit(room: Room) {
    setEditing({
      id: room.id,
      room_number: room.room_number,
      max_seats: String(room.max_seats),
    });
  }

  function cancelEdit() {
    setEditing(null);
  }

  async function saveEdit() {
    if (!editing) return;

    const trimmed = editing.room_number.trim();
    if (!trimmed) {
      toast("Room number is required", "error");
      return;
    }

    const seats = parseInt(editing.max_seats, 10);
    if (isNaN(seats) || seats < 1) {
      toast("Max seats must be at least 1", "error");
      return;
    }

    try {
      await updateMutation.mutateAsync({
        id: editing.id,
        payload: { room_number: trimmed, max_seats: seats },
      });
      toast("Room updated", "success");
      setEditing(null);
    } catch (err) {
      const detail =
        isAxiosError(err) && typeof err.response?.data?.detail === "string"
          ? err.response.data.detail
          : undefined;
      toast(detail ?? "Failed to update room", "error");
    }
  }

  // ── Delete handler ───────────────────────────────────────────────────────

  async function handleDelete() {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      toast(`Room ${deleteTarget.room_number} deleted`, "success");
      setDeleteTarget(null);
      setDeleteError(null);
    } catch (err) {
      const detail =
        isAxiosError(err) && typeof err.response?.data?.detail === "string"
          ? err.response.data.detail
          : undefined;
      setDeleteError(detail ?? "Failed to delete room. Please try again.");
    }
  }

  // ── Columns ──────────────────────────────────────────────────────────────

  const columns = [
    col.accessor("room_number", {
      header: "Room Number",
      cell: ({ row }) =>
        editing?.id === row.original.id ? (
          <Input
            className="h-7 w-32"
            value={editing.room_number}
            onChange={(e) =>
              setEditing((prev) =>
                prev ? { ...prev, room_number: e.target.value } : prev
              )
            }
            aria-label="Room number"
            autoFocus
          />
        ) : (
          <span className="font-medium">{row.original.room_number}</span>
        ),
    }),

    col.accessor("max_seats", {
      header: "Max Seats",
      cell: ({ row }) =>
        editing?.id === row.original.id ? (
          <Input
            className="h-7 w-24"
            type="number"
            inputMode="numeric"
            min={1}
            value={editing.max_seats}
            onChange={(e) =>
              setEditing((prev) =>
                prev ? { ...prev, max_seats: e.target.value } : prev
              )
            }
            aria-label="Max seats"
          />
        ) : (
          <span>{row.original.max_seats}</span>
        ),
    }),

    col.display({
      id: "actions",
      header: () => <span className="sr-only">Actions</span>,
      enableSorting: false,
      cell: ({ row }) => {
        const isRowEditing = editing?.id === row.original.id;

        if (isRowEditing) {
          return (
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={saveEdit}
                disabled={updateMutation.isPending}
                aria-label="Save changes"
              >
                <Check className="size-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={cancelEdit}
                disabled={updateMutation.isPending}
                aria-label="Cancel edit"
              >
                <X className="size-4" />
              </Button>
            </div>
          );
        }

        return (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => startEdit(row.original)}
              aria-label={`Edit room ${row.original.room_number}`}
            >
              <Pencil />
            </Button>
            <Button
              variant="ghost"
              size="icon-sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={() => {
                setDeleteTarget(row.original);
                setDeleteError(null);
              }}
              aria-label={`Delete room ${row.original.room_number}`}
            >
              <Trash2 />
            </Button>
          </div>
        );
      },
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

  // ── Determine if the delete error is about active assignments ────────────
  const hasAssignmentBlock = deleteError?.toLowerCase().includes("assignment");

  return (
    <>
      {/* Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id} className="hover:bg-transparent">
                {hg.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className={
                      header.column.getCanSort()
                        ? "cursor-pointer select-none"
                        : ""
                    }
                    onClick={header.column.getToggleSortingHandler()}
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext()
                    )}
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
                  className="py-12 text-center text-muted-foreground"
                >
                  No rooms found.
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Delete room?</DialogTitle>
          <DialogDescription>
            Room <strong>{deleteTarget?.room_number}</strong> will be
            permanently removed. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {/* Warning when room has active assignments */}
        {deleteError && (
          <div className="px-6 pb-2">
            <div
              role="alert"
              className={
                hasAssignmentBlock
                  ? "rounded-2xl bg-pastel-peach text-pastel-fg px-4 py-3 text-sm"
                  : "rounded-2xl bg-pastel-pink text-pastel-fg px-4 py-3 text-sm"
              }
            >
              {deleteError}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setDeleteTarget(null);
              setDeleteError(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending || hasAssignmentBlock}
          >
            {deleteMutation.isPending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </Dialog>
    </>
  );
}
