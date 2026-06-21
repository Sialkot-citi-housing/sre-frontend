import { createFileRoute } from "@tanstack/react-router";
import { Activity, AlertTriangle, Building2, FileText, TrendingUp, Users, Wallet } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { fmtPKR, projects } from "@/lib/projects-data";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export const Route = createFileRoute("/dashboard")({
  component: Dashboard,
});

const monthlySpend = [
  { month: "Jan", spend: 3_120_000 },
  { month: "Feb", spend: 4_480_000 },
  { month: "Mar", spend: 5_210_000 },
  { month: "Apr", spend: 4_920_000 },
  { month: "May", spend: 6_350_000 },
  { month: "Jun", spend: 7_180_000 },
];

const phaseColors: Record<string, string> = {
  Foundation: "#93B4E8",
  "Grey Structure": "#1958B9",
  Finishing: "#0D2B52",
  Handover: "#C11C1C",
};

type Activity = {
  type: "alert" | "receipt" | "labour" | "vendor" | "milestone";
  message: string;
  time: string;
};

const activities: Activity[] = [
  { type: "alert", message: "Cement rates increased by 2% today across Sialkot suppliers", time: "12 min ago" },
  { type: "receipt", message: "New receipt uploaded for Plot 142 — 50 bags Lucky Cement", time: "1 hr ago" },
  { type: "labour", message: "Labour attendance logged for Plot 88 — 14 workers on site", time: "3 hr ago" },
  { type: "vendor", message: "Ittefaq Steel delivered 1.2 Ton Grade-60 Serya to Plot 142", time: "5 hr ago" },
  { type: "milestone", message: "Plot 27 reached 60% of allotted timeline", time: "Yesterday" },
  { type: "alert", message: "Plot 204 budget utilisation crossed 83% threshold", time: "Yesterday" },
];

const activityIcon: Record<Activity["type"], { icon: typeof FileText; cls: string }> = {
  alert: { icon: AlertTriangle, cls: "bg-[color:var(--sre-red)]/10 text-[color:var(--sre-red)]" },
  receipt: { icon: FileText, cls: "bg-[color:var(--sre-blue)]/10 text-[color:var(--sre-blue)]" },
  labour: { icon: Users, cls: "bg-emerald-50 text-emerald-700" },
  vendor: { icon: Building2, cls: "bg-amber-50 text-amber-700" },
  milestone: { icon: TrendingUp, cls: "bg-secondary text-foreground" },
};

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

  const phaseData = Object.entries(
    projects.reduce<Record<string, number>>((acc, p) => {
      acc[p.phase] = (acc[p.phase] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

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

      <div className="mt-6 rounded-xl border border-border bg-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div>
            <h3 className="text-base font-semibold text-foreground">Monthly Procurement Spend</h3>
            <p className="text-xs text-muted-foreground">Last 6 months · PKR</p>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-[color:var(--sre-blue)]" />
            Procurement spend
          </div>
        </div>
        <div className="mt-5 h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlySpend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="barBlue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#1958B9" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#1958B9" stopOpacity={0.45} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                stroke="hsl(var(--muted-foreground))"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(v) => `${(v / 1_000_000).toFixed(1)}M`}
              />
              <Tooltip
                cursor={{ fill: "rgba(25,88,185,0.06)" }}
                contentStyle={{
                  borderRadius: 8,
                  border: "1px solid hsl(var(--border))",
                  background: "white",
                  fontSize: 12,
                }}
                formatter={(v: number) => [`PKR ${fmtPKR(v)}`, "Spend"]}
              />
              <Bar dataKey="spend" fill="url(#barBlue)" radius={[6, 6, 0, 0]} maxBarSize={56} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-5">
        <div className="rounded-xl border border-border bg-card p-6 lg:col-span-2">
          <h3 className="text-base font-semibold text-foreground">Projects by Phase</h3>
          <p className="text-xs text-muted-foreground">Live distribution across portfolio</p>
          <div className="mt-4 flex items-center gap-4">
            <div className="h-44 w-44 shrink-0">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={phaseData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={48}
                    outerRadius={78}
                    paddingAngle={3}
                    stroke="white"
                    strokeWidth={2}
                  >
                    {phaseData.map((entry) => (
                      <Cell key={entry.name} fill={phaseColors[entry.name] ?? "#1958B9"} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      borderRadius: 8,
                      border: "1px solid hsl(var(--border))",
                      background: "white",
                      fontSize: 12,
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <ul className="flex-1 space-y-2 text-sm">
              {phaseData.map((p) => (
                <li key={p.name} className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 text-foreground">
                    <span
                      className="inline-block h-2.5 w-2.5 rounded-sm"
                      style={{ background: phaseColors[p.name] ?? "#1958B9" }}
                    />
                    {p.name}
                  </span>
                  <span className="font-semibold tabular-nums text-foreground">{p.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-6 lg:col-span-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Recent Activity &amp; Alerts</h3>
              <p className="text-xs text-muted-foreground">System log across all projects</p>
            </div>
            <button className="text-xs font-medium text-[color:var(--sre-blue)] hover:underline">
              View all
            </button>
          </div>
          <ul className="mt-4 divide-y divide-border">
            {activities.map((a, i) => {
              const { icon: Icon, cls } = activityIcon[a.type];
              return (
                <li
                  key={i}
                  className="flex items-start gap-3 py-3 transition-colors hover:bg-accent/40 rounded-md px-2 -mx-2"
                >
                  <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${cls}`}>
                    <Icon className="h-4 w-4" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className={`text-sm leading-snug ${a.type === "alert" ? "text-foreground font-medium" : "text-foreground"}`}>
                      {a.message}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">{a.time}</p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </AppShell>
  );
}