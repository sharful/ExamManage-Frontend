"use client";

import { useState } from "react";
import { Plus, Hash, Pencil, Trash2 } from "lucide-react";
import { SkeletonTableRow, SkeletonCard } from "@/components/ui/skeleton";
import { isAxiosError } from "axios";
import { useRooms, useDeleteRoom } from "@/hooks/use-rooms";
import type { Room } from "@/types";
import { AppShell } from "@/components/layout/app-shell";
import { RoomTable } from "@/components/rooms/room-table";
import { RoomForm } from "@/components/rooms/room-form";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// ── Pastel tone rotation for mobile cards ─────────────────────────────────
const ROOM_TONES = ["lavender", "peach", "pink", "mint"] as const;
type RoomTone = (typeof ROOM_TONES)[number];

// ── Page ───────────────────────────────────────────────────────────────────

export default function RoomsPage() {
  const { data, isLoading, isError } = useRooms();
  const deleteMutation = useDeleteRoom();

  // Dialog state for add/edit form
  const [formOpen, setFormOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState<Room | undefined>(undefined);

  // Delete dialog state (mobile cards use this; desktop table manages its own)
  const [mobileDeleteTarget, setMobileDeleteTarget] = useState<Room | null>(null);
  const [mobileDeleteError, setMobileDeleteError] = useState<string | null>(null);

  const rooms = data?.data ?? [];

  function openAdd() {
    setEditingRoom(undefined);
    setFormOpen(true);
  }

  function openEdit(room: Room) {
    setEditingRoom(room);
    setFormOpen(true);
  }

  async function handleMobileDelete() {
    if (!mobileDeleteTarget) return;
    try {
      await deleteMutation.mutateAsync(mobileDeleteTarget.id);
      toast(`Room ${mobileDeleteTarget.room_number} deleted`, "success");
      setMobileDeleteTarget(null);
      setMobileDeleteError(null);
    } catch (err) {
      const detail =
        isAxiosError(err) && typeof err.response?.data?.detail === "string"
          ? err.response.data.detail
          : undefined;
      setMobileDeleteError(detail ?? "Failed to delete room. Please try again.");
    }
  }

  const mobileHasAssignmentBlock = mobileDeleteError
    ?.toLowerCase()
    .includes("assignment");

  return (
    <AppShell>
      {/* Page header */}
      <div className="mb-5 flex items-end justify-between gap-4">
        <div>
          <h1 className="text-display text-3xl sm:text-4xl">Rooms</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Seating capacity for every venue.
          </p>
        </div>

        {/* Desktop "Add Room" button */}
        <Button className="hidden sm:inline-flex" onClick={openAdd}>
          <Plus />
          Add room
        </Button>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────── */}
      {isLoading ? (
        <>
          {/* Desktop skeleton */}
          <div className="hidden lg:block rounded-2xl border border-border bg-card overflow-hidden">
            <table className="w-full text-sm">
              <tbody className="divide-y divide-border">
                {Array.from({ length: 8 }).map((_, i) => (
                  <SkeletonTableRow key={i} cells={3} />
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile skeleton */}
          <div className="flex flex-col gap-2 lg:hidden">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        </>
      ) : isError ? (
        <div className="flex items-center justify-center py-20 text-destructive text-sm">
          Failed to load rooms. Please try again.
        </div>
      ) : (
        <>
          {/* Desktop table: hidden below lg */}
          <div className="hidden lg:block">
            <RoomTable data={rooms} />
          </div>

          {/* Mobile card list: hidden at lg+ */}
          <div className="flex flex-col gap-2 lg:hidden">
            {rooms.length === 0 ? (
              <p className="py-12 text-center text-muted-foreground text-sm">
                No rooms found.
              </p>
            ) : (
              rooms.map((room, idx) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  tone={ROOM_TONES[idx % ROOM_TONES.length]}
                  onEdit={() => openEdit(room)}
                  onDelete={() => {
                    setMobileDeleteTarget(room);
                    setMobileDeleteError(null);
                  }}
                />
              ))
            )}
          </div>
        </>
      )}

      {/* ── Add / Edit form dialog ────────────────────────────────────── */}
      <RoomForm
        open={formOpen}
        onOpenChange={setFormOpen}
        room={editingRoom}
      />

      {/* ── Mobile delete confirmation dialog ──────────────────────────── */}
      <Dialog
        open={!!mobileDeleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setMobileDeleteTarget(null);
            setMobileDeleteError(null);
          }
        }}
      >
        <DialogHeader>
          <DialogTitle>Delete room?</DialogTitle>
          <DialogDescription>
            Room <strong>{mobileDeleteTarget?.room_number}</strong> will be
            permanently removed. This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        {mobileDeleteError && (
          <div className="px-6 pb-2">
            <div
              role="alert"
              className={
                mobileHasAssignmentBlock
                  ? "rounded-2xl bg-pastel-peach text-pastel-fg px-4 py-3 text-sm"
                  : "rounded-2xl bg-pastel-pink text-pastel-fg px-4 py-3 text-sm"
              }
            >
              {mobileDeleteError}
            </div>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setMobileDeleteTarget(null);
              setMobileDeleteError(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleMobileDelete}
            disabled={deleteMutation.isPending || !!mobileHasAssignmentBlock}
          >
            {deleteMutation.isPending ? "Deleting…" : "Delete"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Mobile FAB */}
      <button
        type="button"
        onClick={openAdd}
        className={cn(
          "fixed bottom-20 right-4 z-40 sm:hidden",
          "flex size-14 items-center justify-center rounded-full",
          "bg-primary text-primary-foreground shadow-lg",
          "hover:bg-primary/90 active:scale-95 transition-all",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        )}
        aria-label="Add room"
      >
        <Plus className="size-6" />
      </button>
    </AppShell>
  );
}

// ── Mobile room card ───────────────────────────────────────────────────────

interface RoomCardProps {
  room: Room;
  tone: RoomTone;
  onEdit: () => void;
  onDelete: () => void;
}

const TONE_BG: Record<RoomTone, string> = {
  lavender: "bg-pastel-lavender",
  peach: "bg-pastel-peach",
  pink: "bg-pastel-pink",
  mint: "bg-pastel-mint",
};

function RoomCard({ room, tone, onEdit, onDelete }: RoomCardProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-2xl px-4 py-3.5 shadow-sm text-pastel-fg",
        TONE_BG[tone]
      )}
    >
      {/* Icon */}
      <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-card/60">
        <Hash className="size-5" strokeWidth={1.75} />
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{room.room_number}</p>
        <p className="text-display text-3xl tabular-nums leading-tight">
          {room.max_seats}
          <span className="ml-1 text-xs font-normal opacity-75">
            seats
          </span>
        </p>
      </div>

      {/* Actions */}
      <div className="flex shrink-0 items-center gap-1">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onEdit}
          className="hover:bg-card/60"
          aria-label={`Edit room ${room.room_number}`}
        >
          <Pencil />
        </Button>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onDelete}
          className="hover:bg-card/60"
          aria-label={`Delete room ${room.room_number}`}
        >
          <Trash2 />
        </Button>
      </div>
    </div>
  );
}
