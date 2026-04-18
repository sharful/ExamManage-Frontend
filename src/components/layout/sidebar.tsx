"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  DoorOpen,
  BookOpen,
  FileText,
  GraduationCap,
  LayoutGrid,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

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

  return (
    <aside className="flex h-full w-16 flex-col items-center gap-2 py-4">
      <Link
        href="/dashboard"
        aria-label="ExamManage home"
        className="flex size-10 items-center justify-center rounded-full bg-primary text-primary-foreground"
      >
        <GraduationCap className="size-5" strokeWidth={2} />
      </Link>

      <nav className="mt-4 flex flex-col items-center gap-2 flex-1">
        {navItems.map(({ href, label, icon: Icon }) => {
          const isActive =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              title={label}
              className={cn(
                "flex size-10 items-center justify-center rounded-full transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="size-[18px]" strokeWidth={1.75} />
            </Link>
          );
        })}
      </nav>

      <button
        aria-label="Settings"
        title="Settings"
        className="flex size-10 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
      >
        <Settings className="size-[18px]" strokeWidth={1.75} />
      </button>
    </aside>
  );
}
