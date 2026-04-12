import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { MobileNav } from "./mobile-nav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-screen">
      {/* Desktop sidebar: visible at lg+ */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main content area */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 pb-20 sm:pb-4 lg:p-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav: visible below sm */}
      <MobileNav />
    </div>
  );
}
