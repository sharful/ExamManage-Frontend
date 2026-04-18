import Link from "next/link";
import { Plus, LayoutGrid, ClipboardCopy, Send } from "lucide-react";

const ACTIONS = [
  {
    label: "New exam",
    caption: "Create a session",
    icon: Plus,
    tone: "bg-pastel-mint",
    href: "/exams/new",
  },
  {
    label: "Assign rooms",
    caption: "Open planner",
    icon: LayoutGrid,
    tone: "bg-pastel-lavender",
    href: "/rooms",
  },
  {
    label: "Import roster",
    caption: "CSV or from last term",
    icon: ClipboardCopy,
    tone: "bg-pastel-peach",
    href: "/invigilators",
  },
  {
    label: "Send schedule",
    caption: "Email to invigilators",
    icon: Send,
    tone: "bg-pastel-amber",
    href: "#",
  },
] as const;

export function QuickActions() {
  return (
    <div className="rounded-2xl border border-border bg-card p-5">
      <h2 className="text-base font-semibold tracking-tight mb-4">Quick actions</h2>
      <div className="grid grid-cols-2 gap-2">
        {ACTIONS.map((a) => {
          const Icon = a.icon;
          return (
            <Link
              key={a.label}
              href={a.href}
              className="group flex flex-col gap-1.5 items-start rounded-xl bg-muted p-3.5 transition-colors hover:bg-muted/70 min-h-[88px] justify-between"
            >
              <span
                className={`inline-flex size-8 items-center justify-center rounded-full ${a.tone} text-pastel-fg`}
              >
                <Icon className="size-[15px]" strokeWidth={1.75} aria-hidden />
              </span>
              <div className="flex flex-col gap-0.5">
                <span className="text-[13px] font-semibold">{a.label}</span>
                <span className="text-[10px] text-muted-foreground">{a.caption}</span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
