"use client";

import { useQuery } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import api from "@/lib/api";
import type { AuditLog } from "@/types";

interface AuditResponse {
  data: AuditLog[];
  meta: { total: number };
}

function friendlyAction(log: AuditLog): string {
  const action = log.action?.toLowerCase() ?? "updated";
  const entity = log.entity_type ?? "record";
  return `${action} a ${entity}`;
}

const STATIC_FEED = [
  { t: "2m", who: "You", did: "Assigned head invigilator for today's exams." },
  { t: "14m", who: "System", did: "Detected 2 new conflicts on today's schedule." },
  { t: "38m", who: "You", did: "Created 4 new exams for Semester finals." },
  { t: "1h", who: "System", did: "Cloned last-term assignments to current schedule." },
  { t: "3h", who: "You", did: "Imported invigilator roster from CSV." },
  { t: "5h", who: "System", did: "Auto-resolved duplicate room assignments." },
];

export function ActivityFeed() {
  const { data } = useQuery<AuditResponse>({
    queryKey: ["audit", "recent"],
    queryFn: async () => {
      const res = await api.get<AuditResponse>("/api/audit", {
        params: { limit: 6, order: "desc" },
      });
      return res.data;
    },
    staleTime: 60_000,
    retry: false,
  });

  const liveItems = (data?.data ?? []).slice(0, 6).map((log) => ({
    t: formatDistanceToNow(new Date(log.timestamp), { addSuffix: false }),
    who: log.user_id ? "You" : "System",
    did: friendlyAction(log),
  }));

  const items = liveItems.length > 0 ? liveItems : STATIC_FEED;

  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <h2 className="text-base font-semibold tracking-tight">Activity</h2>
        <button className="ml-auto text-[12px] text-muted-foreground hover:text-foreground transition-colors">
          See all
        </button>
      </div>
      <ul className="space-y-0" role="list">
        {items.map((item, i) => (
          <li
            key={i}
            className="grid gap-2.5 py-2.5 items-start"
            style={{ gridTemplateColumns: "32px 1fr" }}
          >
            <span className="font-mono text-[10px] text-muted-foreground pt-0.5">{item.t}</span>
            <span className="text-[12px]">
              <strong>{item.who}</strong> {item.did}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
