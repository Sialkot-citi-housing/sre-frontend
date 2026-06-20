import { createFileRoute } from "@tanstack/react-router";
import { Activity, Building2, TrendingUp, Wallet } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { fmtPKR, projects } from "@/lib/projects-data";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const active = projects.filter((p) => p.status === "active");
  const totalSpent = projects.reduce((s, p) => s + p.spent, 0);
  const totalBudget = projects.reduce((s, p) => s + p.budget, 0);

  const tiles = [
    { icon: Building2, label: "Active projects", value: String(active.length) },
    { icon: Wallet, label: "Spent across portfolio", value: `PKR ${fmtPKR(totalSpent)}` },
    { icon: TrendingUp, label: "Portfolio budget", value: `PKR ${fmtPKR(totalBudget)}` },
    { icon: Activity, label: "Avg. budget used", value: `${((totalSpent / totalBudget) * 100).toFixed(1)}%` },
  ];

  return (
    <AppShell title="Dashboard" subtitle="Portfolio overview at a glance">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {tiles.map(({ icon: Icon, label, value }) => (
          <div key={label} className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Icon className="h-4 w-4" /> {label}
            </div>
            <div className="mt-2 text-2xl font-bold tabular-nums text-foreground">{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-8 rounded-xl border border-border bg-card p-10 text-center">
        <p className="text-sm text-muted-foreground">
          More dashboard widgets (cashflow, procurement velocity, vendor performance) will live here.
        </p>
      </div>
    </AppShell>
  );
}