import { CalendarDays, DoorOpen, Users } from "lucide-react";

function EmptyShell({
  icon: Icon,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  title: string;
  body: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/40 p-8 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Icon className="size-5" strokeWidth={1.75} />
      </span>
      <p className="mt-3 text-sm font-medium">{title}</p>
      <p className="mt-1 text-xs text-muted-foreground max-w-sm">{body}</p>
    </div>
  );
}

export function NoExamSelected() {
  return (
    <EmptyShell
      icon={CalendarDays}
      title="Select an exam to begin"
      body="Pick a date, a time slot, and an exam. The invigilator pool and room grid will load here."
    />
  );
}

export function NoRooms() {
  return (
    <EmptyShell
      icon={DoorOpen}
      title="No rooms defined"
      body="Add rooms from the Rooms page before you can assign invigilators."
    />
  );
}

export function NoAvailableInvigilators() {
  return (
    <EmptyShell
      icon={Users}
      title="No available invigilators"
      body="No invigilators are free for this date and time slot. Check the Invigilators page."
    />
  );
}
