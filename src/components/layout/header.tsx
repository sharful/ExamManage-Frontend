"use client";

import { useAuth } from "@/contexts/auth-context";
import { useRouter, usePathname } from "next/navigation";
import { LogOut, User, Bell, Search, ChevronRight } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";

const titleMap: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/exams": "Exams",
  "/invigilators": "Invigilators",
  "/rooms": "Rooms",
  "/reports": "Reports",
  "/login": "Sign in",
};

function pageTitle(pathname: string): string {
  if (pathname.startsWith("/exams/new")) return "New exam";
  if (pathname.startsWith("/exams/")) return "Exam details";
  if (pathname.startsWith("/invigilators/new")) return "New invigilator";
  if (pathname.startsWith("/invigilators/")) return "Invigilator";
  for (const key of Object.keys(titleMap)) {
    if (pathname === key || pathname.startsWith(key + "/")) return titleMap[key];
  }
  return "ExamManage";
}

export function Header() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
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

  const title = pageTitle(pathname);

  return (
    <header className="flex h-16 items-center justify-between gap-3 px-4 lg:px-6 pt-4 pb-2">
      <div className="flex items-center gap-2 min-w-0">
        <span className="hidden sm:inline text-xs font-medium text-muted-foreground">
          ExamManage
        </span>
        <ChevronRight
          className="hidden sm:inline size-3.5 text-muted-foreground/60"
          strokeWidth={2}
        />
        <h2 className="text-display text-xl sm:text-2xl truncate">{title}</h2>
      </div>

      <div className="flex items-center gap-2">
        <div
          role="search"
          className="hidden md:flex items-center gap-2 h-9 rounded-lg border border-border bg-background px-3 text-sm text-muted-foreground"
          aria-hidden="true"
        >
          <Search className="size-4" strokeWidth={1.75} />
          <span>Search</span>
        </div>

        <button
          type="button"
          aria-label="Notifications"
          className="relative flex size-9 items-center justify-center rounded-lg bg-muted text-muted-foreground hover:text-foreground transition-colors"
        >
          <Bell className="size-[18px]" strokeWidth={1.75} />
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full bg-destructive ring-2 ring-card" />
        </button>

        <div className="relative" ref={ref}>
          <button
            onClick={() => setOpen((v) => !v)}
            className="flex items-center gap-2 h-9 pl-1 pr-3 rounded-full bg-muted text-sm font-medium transition-colors hover:bg-muted/70"
            aria-haspopup="true"
            aria-expanded={open}
          >
            <span
              className="flex size-7 items-center justify-center rounded-full text-white"
              style={{ background: "linear-gradient(135deg,#16A34A,#22C55E)" }}
            >
              <User className="size-3.5" strokeWidth={2} />
            </span>
            <span className="hidden sm:block">
              {user?.username ?? "Admin"}
            </span>
          </button>
          {open && (
            <div
              className={cn(
                "absolute right-0 top-full z-50 mt-2 w-40 rounded-2xl border border-border bg-popover shadow-lg overflow-hidden"
              )}
            >
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-popover-foreground transition-colors hover:bg-muted"
              >
                <LogOut className="size-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
