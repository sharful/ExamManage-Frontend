"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter } from "next/navigation";
import { LogOut, User } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    logout();
    router.push("/login");
  }

  return (
    <header className="flex h-14 items-center justify-between border-b border-border bg-background px-4 lg:px-6">
      {/* App title shown on mobile/tablet (sidebar hidden) */}
      <span className="text-base font-semibold lg:hidden">ExamManage</span>
      {/* Spacer on desktop where sidebar shows the title */}
      <span className="hidden lg:block" />

      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted"
          aria-haspopup="true"
          aria-expanded={open}
        >
          <User className="size-4" />
          <span className="hidden sm:block">
            {user?.username ?? "Admin"}
          </span>
        </button>
        {open && (
          <div
            className={cn(
              "absolute right-0 top-full z-50 mt-1 w-40 rounded-lg border border-border bg-popover shadow-md"
            )}
          >
            <button
              onClick={handleLogout}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-popover-foreground transition-colors hover:bg-muted"
            >
              <LogOut className="size-4" />
              Logout
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
