import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Invigilator, InvigilatorStatus } from "@/types";

// ── Types ──────────────────────────────────────────────────────────────────

export interface InvigilatorsParams {
  page?: number;
  page_size?: number;
  search?: string;
  status?: InvigilatorStatus | "";
  department?: string;
}

export interface PaginatedInvigilators {
  items: Invigilator[];
  total: number;
  page: number;
  page_size: number;
}

export interface InvigilatorPayload {
  name: string;
  department?: string | null;
  institute?: string | null;
  mobile?: string | null;
  email?: string | null;
  status: InvigilatorStatus;
  remarks?: string | null;
}

// ── Query keys ─────────────────────────────────────────────────────────────

const INVIGILATORS_KEY = "invigilators" as const;

// ── Hooks ──────────────────────────────────────────────────────────────────

export function useInvigilators(params: InvigilatorsParams = {}) {
  const { page = 1, page_size = 20, search, status, department } = params;

  return useQuery({
    queryKey: [INVIGILATORS_KEY, { page, page_size, search, status, department }],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = {
        page,
        page_size,
      };
      if (search) queryParams.search = search;
      if (status) queryParams.status = status;
      if (department) queryParams.department = department;

      const { data } = await api.get<PaginatedInvigilators>(
        "/api/invigilators",
        { params: queryParams }
      );
      return data;
    },
  });
}

export function useInvigilator(id: string | null) {
  return useQuery({
    queryKey: [INVIGILATORS_KEY, id],
    queryFn: async () => {
      const { data } = await api.get<Invigilator>(`/api/invigilators/${id}`);
      return data;
    },
    enabled: !!id && id !== "new",
  });
}

export function useCreateInvigilator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: InvigilatorPayload) => {
      const { data } = await api.post<Invigilator>("/api/invigilators", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVIGILATORS_KEY] });
    },
  });
}

export function useUpdateInvigilator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: InvigilatorPayload }) => {
      const { data } = await api.put<Invigilator>(`/api/invigilators/${id}`, payload);
      return data;
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: [INVIGILATORS_KEY] });
      queryClient.invalidateQueries({ queryKey: [INVIGILATORS_KEY, id] });
    },
  });
}

export function useDeleteInvigilator() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/invigilators/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INVIGILATORS_KEY] });
    },
  });
}

// ── Convenience hook: unique departments from current list ─────────────────

export function useInvigilatorDepartments() {
  return useQuery({
    queryKey: [INVIGILATORS_KEY, "departments"],
    queryFn: async () => {
      const { data } = await api.get<PaginatedInvigilators>("/api/invigilators", {
        params: { page: 1, page_size: 500 },
      });
      const deps = data.items
        .map((i) => i.department)
        .filter((d): d is string => !!d);
      return [...new Set(deps)].sort();
    },
    staleTime: 5 * 60 * 1000,
  });
}
