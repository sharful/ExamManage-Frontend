"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Room } from "@/types";

interface RoomListResponse {
  data: Room[];
  meta: { total: number };
}

function roomTone(index: number) {
  const tones = [
    "bg-pastel-lavender text-pastel-fg",
    "bg-pastel-peach text-pastel-fg",
    "bg-pastel-mint text-pastel-fg",
    "bg-pastel-amber text-pastel-fg",
    "bg-pastel-pink text-pastel-fg",
  ];
  return tones[index % tones.length];
}

interface RoomUtilizationProps {
  compact?: boolean;
}

export function RoomUtilization({ compact = false }: RoomUtilizationProps) {
  const { data, isLoading } = useQuery<RoomListResponse>({
    queryKey: ["rooms", "list"],
    queryFn: async () => {
      const res = await api.get<RoomListResponse>("/api/rooms", {
        params: { limit: 50 },
      });
      return res.data;
    },
    staleTime: 60_000,
  });

  const rooms = compact
    ? (data?.data ?? []).slice(0, 6)
    : (data?.data ?? []);

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-base font-semibold tracking-tight">Rooms</h2>
        {!isLoading && (
          <span className="ml-auto text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
            {data?.meta?.total ?? rooms.length} total
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="rounded-xl bg-muted animate-pulse h-16" />
          ))}
        </div>
      ) : rooms.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">No rooms found</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
          {rooms.map((room, idx) => (
            <div
              key={room.id}
              className={`rounded-xl p-2.5 ${roomTone(idx)}`}
            >
              <div className="flex items-center justify-between gap-1 mb-1">
                <span className="text-[12px] font-bold whitespace-nowrap">
                  {room.room_number}
                </span>
              </div>
              <div className="text-[10px] opacity-80">
                {room.max_seats} seats
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
