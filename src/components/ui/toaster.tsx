"use client";

import {
  dismissToast,
  pauseToast,
  resumeToast,
  useToastStore,
} from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { CheckCircle, XCircle, Info, X } from "lucide-react";

export function Toaster() {
  const toasts = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div
      role="region"
      aria-label="Notifications"
      className={cn(
        "fixed right-4 z-[100] flex flex-col gap-2 pointer-events-none",
        // bottom-28 keeps clear of mobile bottom-nav (h-14 + bottom-3); raise to bottom-4 on sm+
        "bottom-28 sm:bottom-4",
        "pb-[env(safe-area-inset-bottom)]",
      )}
    >
      {toasts.map((t) => {
        const onPause = () => pauseToast(t.id);
        const onResume = () => resumeToast(t.id);
        return (
          <div
            key={t.id}
            role="alert"
            onMouseEnter={onPause}
            onMouseLeave={onResume}
            onFocus={onPause}
            onBlur={onResume}
            className={cn(
              "flex items-center gap-2.5 rounded-full pl-4 pr-2 py-2 text-sm font-medium shadow-lg max-w-sm pointer-events-auto",
              "animate-in slide-in-from-right-4 fade-in-0",
              t.type === "success" && "bg-pastel-mint text-pastel-fg",
              t.type === "error" && "bg-destructive text-white",
              t.type === "info" && "bg-primary text-primary-foreground",
            )}
          >
            {t.type === "success" && <CheckCircle className="size-4 shrink-0" />}
            {t.type === "error" && <XCircle className="size-4 shrink-0" />}
            {t.type === "info" && <Info className="size-4 shrink-0" />}
            <span className="flex-1 py-1">{t.message}</span>
            {t.action && (
              <button
                type="button"
                onClick={() => {
                  t.action!.onClick();
                  dismissToast(t.id);
                }}
                className={cn(
                  "shrink-0 rounded-full px-3 py-1 text-xs font-semibold",
                  "transition-colors",
                  t.type === "error"
                    ? "bg-white/15 hover:bg-white/25 text-white"
                    : "bg-foreground/10 hover:bg-foreground/20",
                )}
              >
                {t.action.label}
              </button>
            )}
            {t.dismissible && (
              <button
                type="button"
                onClick={() => dismissToast(t.id)}
                aria-label="Dismiss notification"
                className={cn(
                  "shrink-0 flex size-7 items-center justify-center rounded-full",
                  "transition-colors",
                  t.type === "error"
                    ? "hover:bg-white/15 text-white/80 hover:text-white"
                    : "hover:bg-foreground/10 text-foreground/60 hover:text-foreground",
                )}
              >
                <X className="size-3.5" strokeWidth={2.25} />
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
