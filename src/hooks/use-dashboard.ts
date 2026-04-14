"use client";

import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { DashboardStats } from "@/types";

export function useDashboard() {
  return useQuery<DashboardStats>({
    queryKey: ["dashboard"],
    queryFn: async () => {
      const response = await api.get<DashboardStats>("/api/dashboard");
      return response.data;
    },
    refetchInterval: 30_000,
  });
}
