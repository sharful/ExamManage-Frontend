"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  DoorOpen,
  BookOpen,
  FileText,
  LayoutGrid,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { Logo } from "@/components/brand/logo";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invigilators", label: "Invigilators", icon: Users },
  { href: "/rooms", label: "Rooms", icon: DoorOpen },
  { href: "/exams", label: "Exams", icon: BookOpen },
  { href: "/planner", label: "Planner", icon: LayoutGrid },
  { href: "/reports", label: "Reports", icon: FileText },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useAuth();
  const initials = (user?.username ?? "A").slice(0, 2).toUpperCase();

  return (
    <aside className="flex h-full w-60 flex-col bg-sidebar text-sidebar-foreground border-r border-sidebar-border">
      <Link
        href="/dashboard"
        aria-label="ExamManage home"
        className="flex items-center px-5 h-16 border-b border-sidebar-border"
      >
        <Logo size={28} />
      </Link>

      <nav className="flex-1 overflow-y-auto py-3">
        <p className="px-5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          Main Menu
        </p>
        <ul className="flex flex-col gap-0.5 px-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive =
              pathname === href || pathname.startsWith(href + "/");
            return (
              <li key={href}>
                <Link
                  href={href}
                  className={cn(
                    "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
                    isActive
                      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                      : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Icon className="size-[18px] shrink-0" strokeWidth={1.75} />
                  <span className="flex-1 truncate">{label}</span>
                  {isActive && (
                    <span className="size-1.5 rounded-full bg-primary" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <p className="mt-3 px-5 pt-2 pb-1 text-[10px] font-bold uppercase tracking-[0.12em] text-muted-foreground">
          Settings
        </p>
        <ul className="flex flex-col gap-0.5 px-2">
          <li>
            <button
              type="button"
              className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
            >
              <Settings className="size-[18px] shrink-0" strokeWidth={1.75} />
              <span className="flex-1 text-left">Preferences</span>
            </button>
          </li>
        </ul>
      </nav>

      <div className="flex items-center gap-2.5 px-4 py-3 border-t border-sidebar-border">
        <span
          className="flex size-9 items-center justify-center rounded-full text-[12px] font-bold text-white shrink-0"
          style={{ background: "linear-gradient(135deg,#16A34A,#22C55E)" }}
        >
          {initials}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-foreground">
            {user?.username ?? "Admin"}
          </p>
          <p className="text-[11px] text-muted-foreground">Signed in</p>
        </div>
      </div>
    </aside>
  );
}
