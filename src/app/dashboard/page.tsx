import { AppShell } from "@/components/layout/app-shell";

export default function DashboardPage() {
  return (
    <AppShell>
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <p className="mt-2 text-muted-foreground">
        Welcome to ExamManage. Use the navigation to manage invigilators,
        rooms, and exams.
      </p>
    </AppShell>
  );
}
