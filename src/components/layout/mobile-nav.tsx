"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  DoorOpen,
  BookOpen,
  FileText,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/invigilators", label: "Invigilators", icon: Users },
  { href: "/rooms", label: "Rooms", icon: DoorOpen },
  { href: "/exams", label: "Exams", icon: BookOpen },
  { href: "/reports", label: "Reports", icon: FileText },
];

export function MobileNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-3 left-3 right-3 z-50 flex items-center justify-around h-14 rounded-full bg-card border border-border shadow-lg px-2 sm:hidden">
      {navItems.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname.startsWith(href + "/");
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
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            <Icon className="size-[18px]" strokeWidth={1.75} />
          </Link>
        );
      })}
    </nav>
  );
}
