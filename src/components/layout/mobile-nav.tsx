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
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  // shortLabel keeps the active-item pill compact on 320px screens
  { href: "/dashboard", label: "Dashboard", shortLabel: "Home", icon: LayoutDashboard },
  { href: "/invigilators", label: "Invigilators", shortLabel: "Invs", icon: Users },
  { href: "/rooms", label: "Rooms", shortLabel: "Rooms", icon: DoorOpen },
  { href: "/exams", label: "Exams", shortLabel: "Exams", icon: BookOpen },
  { href: "/planner", label: "Planner", shortLabel: "Plan", icon: LayoutGrid },
  { href: "/reports", label: "Reports", shortLabel: "Reports", icon: FileText },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="Primary"
      className="fixed bottom-3 left-3 right-3 z-50 flex items-center justify-around h-14 rounded-full bg-card border border-border shadow-lg px-2 sm:hidden"
    >
      {navItems.map(({ href, label, shortLabel, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/");
        return (
          <Link
            key={href}
            href={href}
            aria-label={label}
            aria-current={isActive ? "page" : undefined}
            title={label}
            className={cn(
              "flex h-10 items-center justify-center rounded-full transition-all",
              isActive
                ? "bg-primary text-primary-foreground gap-1.5 px-3"
                : "size-10 text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-[18px] shrink-0" strokeWidth={1.75} />
            {isActive && (
              <span className="text-[11px] font-semibold tracking-tight">
                {shortLabel}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
