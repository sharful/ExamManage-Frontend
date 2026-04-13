"use client";

import { useToastStore } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, Info } from "lucide-react";

export function Toaster() {
  const toasts = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      className="fixed bottom-24 sm:bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none"
    >
      {toasts.map((t) => (
        <div
          key={t.id}
          role="alert"
          className={cn(
            "flex items-center gap-2.5 rounded-lg px-4 py-3 text-sm font-medium shadow-lg max-w-sm pointer-events-auto",
            "animate-in slide-in-from-right-4 fade-in-0",
            t.type === "success" && "bg-green-600 text-white",
            t.type === "error" && "bg-destructive text-white",
            t.type === "info" && "bg-primary text-primary-foreground"
          )}
        >
          {t.type === "success" && <CheckCircle className="size-4 shrink-0" />}
          {t.type === "error" && <XCircle className="size-4 shrink-0" />}
          {t.type === "info" && <Info className="size-4 shrink-0" />}
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
