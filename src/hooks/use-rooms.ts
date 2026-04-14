import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { isAxiosError } from "axios";
import api from "@/lib/api";
import type { Room, RoomCapacityWarning } from "@/types";

export type { RoomCapacityWarning };

// ── Types ──────────────────────────────────────────────────────────────────

export interface RoomsParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface RoomsListResponse {
  data: Room[];
  meta: PaginationMeta;
}

export interface RoomPayload {
  room_number: string;
  max_seats: number;
}

// ── Query keys ─────────────────────────────────────────────────────────────

const ROOMS_KEY = "rooms" as const;

// ── Hooks ──────────────────────────────────────────────────────────────────

export function useRooms(params: RoomsParams = {}) {
  const { page = 1, limit = 200 } = params;

  return useQuery({
    queryKey: [ROOMS_KEY, { page, limit }],
    queryFn: async () => {
      const { data } = await api.get<RoomsListResponse>("/api/rooms", {
        params: { page, limit },
      });
      return data;
    },
  });
}

export function useCreateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: RoomPayload) => {
      const { data } = await api.post<Room>("/api/rooms", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ROOMS_KEY] });
    },
  });
}

/** Thrown by useUpdateRoom when the backend signals a capacity conflict. */
export class RoomCapacityError extends Error {
  constructor(public readonly warning: RoomCapacityWarning) {
    super(warning.detail);
    this.name = "RoomCapacityError";
  }
}

export function useUpdateRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
      force = false,
    }: {
      id: string;
      payload: Partial<RoomPayload>;
      force?: boolean;
    }) => {
      try {
        const { data } = await api.put<Room>(
          `/api/rooms/${id}`,
          payload,
          { params: force ? { force: "true" } : undefined }
        );
        return data;
      } catch (err) {
        if (
          isAxiosError(err) &&
          err.response?.status === 409 &&
          err.response.data?.violations
        ) {
          throw new RoomCapacityError(err.response.data as RoomCapacityWarning);
        }
        throw err;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ROOMS_KEY] });
    },
  });
}

export function useDeleteRoom() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/rooms/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [ROOMS_KEY] });
    },
  });
}
