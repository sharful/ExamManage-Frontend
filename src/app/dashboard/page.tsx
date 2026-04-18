"use client";

import { useState } from "react";
import { AppShell } from "@/components/layout/app-shell";
import { useDashboard } from "@/hooks/use-dashboard";
import { DashboardCommand } from "@/components/dashboard/dashboard-command";
import { DashboardOps } from "@/components/dashboard/dashboard-ops";
import { DashboardLedger } from "@/components/dashboard/dashboard-ledger";

export default function DashboardPage() {
  const { data } = useDashboard();
  const [variant, setVariant] = useState(0);

  return (
    <AppShell>
      <div className="pb-8">
        {variant === 0 && (
          <DashboardCommand stats={data} variant={variant} onVariant={setVariant} />
        )}
        {variant === 1 && (
          <DashboardOps stats={data} variant={variant} onVariant={setVariant} />
        )}
        {variant === 2 && (
          <DashboardLedger stats={data} variant={variant} onVariant={setVariant} />
        )}
      </div>
    </AppShell>
  );
}
