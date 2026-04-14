import { useQuery, useMutation } from "@tanstack/react-query";
import api from "@/lib/api";

// ── Types ──────────────────────────────────────────────────────────────────

export type ReportType = "duty-list" | "room-schedule" | "daily-schedule";
export type ReportFormat = "pdf" | "excel";

export interface PreviewSection {
  title: string;
  headers: string[];
  rows: string[][];
}

export interface ReportPreview {
  sections: PreviewSection[];
}

// ── Query keys ─────────────────────────────────────────────────────────────

const REPORTS_KEY = "reports" as const;

// ── Hooks ──────────────────────────────────────────────────────────────────

/** Fetch structured preview data (JSON) for the given report type and date. */
export function useReportPreview(
  type: ReportType | null,
  date: string | null
) {
  return useQuery({
    queryKey: [REPORTS_KEY, "preview", type, date],
    queryFn: async () => {
      const { data } = await api.get<ReportPreview>("/api/reports/preview", {
        params: { type, date },
      });
      return data;
    },
    enabled: !!type && !!date,
    staleTime: 30 * 1000,
  });
}

/** Trigger a file download for the given report type, date, and format. */
export function useDownloadReport() {
  return useMutation({
    mutationFn: async ({
      type,
      date,
      format,
    }: {
      type: ReportType;
      date: string;
      format: ReportFormat;
    }) => {
      const response = await api.get("/api/reports/export", {
        params: { type, date, format },
        responseType: "blob",
      });

      // Use filename from Content-Disposition header when available
      const disposition = response.headers["content-disposition"] as
        | string
        | undefined;
      const ext = format === "pdf" ? "pdf" : "xlsx";
      let filename = `${type}_${date}.${ext}`;
      if (disposition) {
        const match = /filename="([^"]+)"/.exec(disposition);
        if (match) filename = match[1];
      }

      const url = URL.createObjectURL(response.data as Blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    },
  });
}
