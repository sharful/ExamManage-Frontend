import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { Exam, ExamAssignment, Invigilator, TimeSlot } from "@/types";

// ── Types ──────────────────────────────────────────────────────────────────

export interface ExamsParams {
  page?: number;
  limit?: number;
  name?: string;
  exam_date?: string;
  room?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ExamsListResponse {
  data: Exam[];
  meta: PaginationMeta;
}

export interface ExamPayload {
  exam_name: string;
  exam_date: string;
  time_slot: TimeSlot;
}

export interface AssignmentPayload {
  exam_id: string;
  room_id: string;
  seats: number;
  head_invigilator_id: string;
  invigilator1_id: string;
  invigilator2_id?: string | null;
}

export interface ConflictError {
  type: string;
  message: string;
  invigilator_id?: string;
  details?: Record<string, unknown>;
}

export interface AssignmentResponse {
  assignment: ExamAssignment;
  conflicts: ConflictError[];
}

// ── Query keys ─────────────────────────────────────────────────────────────

const EXAMS_KEY = "exams" as const;
const ASSIGNMENTS_KEY = "assignments" as const;

// ── Hooks ──────────────────────────────────────────────────────────────────

export function useExams(params: ExamsParams = {}) {
  const { page = 1, limit = 50, name, exam_date, room } = params;

  return useQuery({
    queryKey: [EXAMS_KEY, { page, limit, name, exam_date, room }],
    queryFn: async () => {
      const queryParams: Record<string, string | number> = { page, limit };
      if (name) queryParams.name = name;
      if (exam_date) queryParams.exam_date = exam_date;
      if (room) queryParams.room = room;

      const { data } = await api.get<ExamsListResponse>("/api/exams", {
        params: queryParams,
      });
      return data;
    },
  });
}

export function useExam(id: string | null) {
  return useQuery({
    queryKey: [EXAMS_KEY, id],
    queryFn: async () => {
      const { data } = await api.get<Exam>(`/api/exams/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

export function useCreateExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ExamPayload) => {
      const { data } = await api.post<Exam>("/api/exams", payload);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EXAMS_KEY] });
    },
  });
}

export function useUpdateExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<ExamPayload>;
    }) => {
      const { data } = await api.put<Exam>(`/api/exams/${id}`, payload);
      return data;
    },
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: [EXAMS_KEY] });
      queryClient.invalidateQueries({ queryKey: [EXAMS_KEY, id] });
    },
  });
}

export function useDeleteExam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/exams/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EXAMS_KEY] });
    },
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (
      payload: AssignmentPayload
    ): Promise<AssignmentResponse> => {
      const { data } = await api.post<AssignmentResponse>(
        "/api/assignments",
        payload
      );
      return data;
    },
    onSuccess: (_data, payload) => {
      queryClient.invalidateQueries({ queryKey: [EXAMS_KEY] });
      queryClient.invalidateQueries({ queryKey: [EXAMS_KEY, payload.exam_id] });
      queryClient.invalidateQueries({ queryKey: [ASSIGNMENTS_KEY] });
    },
  });
}

export function useUpdateAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: Partial<Omit<AssignmentPayload, "exam_id">>;
    }): Promise<AssignmentResponse> => {
      const { data } = await api.put<AssignmentResponse>(
        `/api/assignments/${id}`,
        payload
      );
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EXAMS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ASSIGNMENTS_KEY] });
    },
  });
}

export function useDeleteAssignment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/api/assignments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [EXAMS_KEY] });
      queryClient.invalidateQueries({ queryKey: [ASSIGNMENTS_KEY] });
    },
  });
}

export function useAvailableInvigilators(
  date: string | null,
  timeSlot: TimeSlot | null
) {
  return useQuery({
    queryKey: [ASSIGNMENTS_KEY, "available-invigilators", date, timeSlot],
    queryFn: async () => {
      const { data } = await api.get<Invigilator[]>(
        "/api/assignments/available-invigilators",
        { params: { exam_date: date, time_slot: timeSlot } }
      );
      return data;
    },
    enabled: !!date && !!timeSlot,
    staleTime: 30 * 1000,
  });
}
