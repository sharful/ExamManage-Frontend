export type UserRole = "admin" | "viewer";
export type InvigilatorStatus = "available" | "unavailable";
export type TimeSlot = "morning" | "evening";

export interface User {
  id: string;
  username: string;
  email: string | null;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface Invigilator {
  id: string;
  name: string;
  department: string | null;
  institute: string | null;
  mobile: string | null;
  email: string | null;
  status: InvigilatorStatus;
  remarks: string | null;
  created_at: string;
  updated_at: string;
}

export interface Room {
  id: string;
  room_number: string;
  max_seats: number;
  created_at: string;
}

export interface Exam {
  id: string;
  exam_name: string;
  exam_date: string;
  time_slot: TimeSlot;
  created_at: string;
  updated_at: string;
  assignments?: ExamAssignment[];
}

export interface ExamAssignment {
  id: string;
  exam_id: string;
  room_id: string;
  seats: number;
  head_invigilator_id: string;
  invigilator1_id: string;
  invigilator2_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

export interface ExamListResponse {
  data: Exam[];
  meta: PaginationMeta;
}

export interface DashboardConflict {
  type: string;
  message: string;
  exam_id: string | null;
  exam_name: string | null;
  invigilator_id: string | null;
  details: Record<string, unknown> | null;
}

export interface DashboardStats {
  exams_today: number;
  available_invigilators: number;
  unavailable_invigilators: number;
  rooms_in_use_today: number;
  rooms_free_today: number;
  conflicts: DashboardConflict[];
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  timestamp: string;
}
