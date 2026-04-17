"use client";

import { useRouter } from "next/navigation";
import { ChevronRight, Phone, Building2 } from "lucide-react";
import type { Invigilator } from "@/types";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface InvigilatorCardProps {
  invigilator: Invigilator;
}

export function InvigilatorCard({ invigilator }: InvigilatorCardProps) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={() => router.push(`/invigilators/${invigilator.id}`)}
      className={cn(
        "w-full text-left rounded-2xl border border-border bg-card px-4 py-3.5 shadow-sm",
        "flex items-center gap-3 transition-colors",
        "hover:bg-muted/50 active:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      )}
    >
      {/* Avatar initial */}
      <div
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-full text-sm font-semibold text-pastel-fg",
          invigilator.status === "available"
            ? "bg-pastel-mint"
            : "bg-pastel-pink"
        )}
      >
        {invigilator.name.charAt(0).toUpperCase()}
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{invigilator.name}</span>
          <Badge
            variant={invigilator.status === "available" ? "mint" : "pink"}
            className="shrink-0"
          >
            {invigilator.status === "available" ? "Available" : "Unavailable"}
          </Badge>
        </div>

        <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5">
          {invigilator.department && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Building2 className="size-3" />
              {invigilator.department}
            </span>
          )}
          {invigilator.mobile && (
            <span className="flex items-center gap-1 text-xs text-muted-foreground">
              <Phone className="size-3" />
              {invigilator.mobile}
            </span>
          )}
        </div>
      </div>

      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
    </button>
  );
}
