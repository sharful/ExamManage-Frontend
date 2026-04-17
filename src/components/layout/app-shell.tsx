import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";
import { WidgetRail } from "./widget-rail";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-screen bg-background">
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>

      <div className="flex flex-1 flex-col lg:m-3 lg:ml-0 rounded-3xl bg-card text-card-foreground shadow-sm overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto px-4 pb-24 sm:pb-6 lg:px-6">
          {children}
        </main>
      </div>

      <WidgetRail />

      <MobileNav />
    </div>
  );
}
