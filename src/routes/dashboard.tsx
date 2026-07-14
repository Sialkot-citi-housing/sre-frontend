import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import { Activity, AlertTriangle, Building2, FileText, TrendingUp, Users, Wallet, Loader2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { fmtPKR } from "@/lib/projects-data";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
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
  head: () => ({
    meta: [
      { title: "Dashboard — SRE Construction Portal" },
      {
        name: "description",
        content: "Portfolio overview, monthly procurement spend and live activity for SRE.",
      },
    ],
  }),
  component: Dashboard,
});

const phaseColors: Record<string, string> = {
  Foundation: "#93B4E8",
  "Grey Structure": "#1958B9",
  Finishing: "#0D2B52",
  Handover: "#C11C1C",
};

type ActivityItem = {
  type: "alert" | "receipt" | "vendor" | "milestone";
  message: string;
  time: string;
  timestamp: number;
};

const activityIcon: Record<ActivityItem["type"], { icon: typeof FileText; cls: string }> = {
  alert: { icon: AlertTriangle, cls: "bg-[color:var(--sre-red)]/10 text-[color:var(--sre-red)]" },
  receipt: { icon: FileText, cls: "bg-[color:var(--sre-blue)]/10 text-[color:var(--sre-blue)]" },
  vendor: { icon: Building2, cls: "bg-amber-50 text-amber-700" },
  milestone: { icon: TrendingUp, cls: "bg-secondary text-foreground" },
};

function getMonthName(dateString: string) {
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return "Unknown";
  return d.toLocaleString('default', { month: 'short' });
}

function timeAgo(date: Date) {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
  let interval = seconds / 31536000;
  if (interval > 1) return Math.floor(interval) + " years ago";
  interval = seconds / 2592000;
  if (interval > 1) return Math.floor(interval) + " months ago";
  interval = seconds / 86400;
  if (interval > 1) return Math.floor(interval) + " days ago";
  interval = seconds / 3600;
  if (interval > 1) return Math.floor(interval) + " hours ago";
  interval = seconds / 60;
  if (interval > 1) return Math.floor(interval) + " minutes ago";
  return "Just now";
}

function Dashboard() {
  const { data: projects = [], isLoading: pLoad } = useQuery({ queryKey: ["projects"], queryFn: api.getProjects });
  const { data: procurements = [], isLoading: rLoad } = useQuery({ queryKey: ["procurements"], queryFn: api.getAllProcurements });
  const { data: payments = [], isLoading: payLoad } = useQuery({ queryKey: ["contractorPayments"], queryFn: api.getAllContractorPayments });

  useEffect(() => {
    document.title = "Dashboard | Sialkot Real Estate";
  }, []);

  if (pLoad || rLoad || payLoad) {
    return (
      <AppShell title="Dashboard" subtitle="Portfolio overview at a glance">
        <div className="flex h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[color:var(--sre-blue)]" />
        </div>
      </AppShell>
    );
  }

  // KPIs
  const activeProjects = projects.filter((p: any) => p.status === "active" || p.status !== "completed");
  const totalBudget = projects.reduce((sum: number, p: any) => sum + (p.budget || 0), 0);
  
  const procurementSpend = procurements.reduce((sum: number, p: any) => sum + (p.quantity * p.rate || 0), 0);
  const paymentSpend = payments.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);
  const totalSpent = procurementSpend + paymentSpend;

  const tiles = [
    { icon: Building2, label: "Active projects", value: String(activeProjects.length) },
    { icon: Wallet, label: "Spent across portfolio", value: `PKR ${fmtPKR(totalSpent)}` },
    { icon: TrendingUp, label: "Portfolio budget", value: `PKR ${fmtPKR(totalBudget)}` },
    { icon: Activity, label: "Avg. budget used", value: totalBudget > 0 ? `${((totalSpent / totalBudget) * 100).toFixed(1)}%` : "0%" },
  ];

  // Projects by Phase
  const phaseData = Object.entries(
    activeProjects.reduce((acc: Record<string, number>, p: any) => {
      acc[p.phase] = (acc[p.phase] ?? 0) + 1;
      return acc;
    }, {}),
  ).map(([name, value]) => ({ name, value }));

  // Monthly Spend Chart
  const monthsData: Record<string, number> = {};
  procurements.forEach((p: any) => {
    if (!p.date) return;
    const m = getMonthName(p.date);
    monthsData[m] = (monthsData[m] || 0) + (p.quantity * p.rate || 0);
  });
  
  // Sort months properly (last 6 months)
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const currentMonthIndex = new Date().getMonth();
  const sortedMonthlySpend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date();
    d.setMonth(currentMonthIndex - i);
    const m = monthNames[d.getMonth()];
    sortedMonthlySpend.push({ month: m, spend: monthsData[m] || 0 });
  }

  // Generate Activities dynamically
  let activities: ActivityItem[] = [];

  projects.forEach((p: any) => {
    const d = new Date(p.createdAt || p.startedAt || new Date());
    activities.push({
      type: "milestone",
      message: `New workspace created for ${p.plot}`,
      time: timeAgo(d),
      timestamp: d.getTime()
    });
  });

  procurements.forEach((p: any) => {
    const d = new Date(p.date || new Date());
    const proj = projects.find((proj: any) => proj._id === p.project || proj.id === p.project);
    const projName = proj ? proj.plot : "a project";
    activities.push({
      type: "receipt",
      message: `Procurement: ${p.quantity} ${p.unit} of ${p.item} added to ${projName}`,
      time: timeAgo(d),
      timestamp: d.getTime()
    });
  });

  payments.forEach((p: any) => {
    const d = new Date(p.date || new Date());
    activities.push({
      type: "vendor",
      message: `Contractor Payment: PKR ${fmtPKR(p.amount)} recorded via ${p.method}`,
      time: timeAgo(d),
      timestamp: d.getTime()
    });
  });

  // Sort and take top 6
  activities.sort((a, b) => b.timestamp - a.timestamp);
  const topActivities = activities.slice(0, 6);

  if (topActivities.length === 0) {
    topActivities.push({
      type: "alert",
      message: "No recent activity found. Start adding records to see them here.",
      time: "Just now",
      timestamp: new Date().getTime()
    });
  }

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
            <BarChart data={sortedMonthlySpend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
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
              {phaseData.length === 0 && <li className="text-muted-foreground">No active projects</li>}
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
            {topActivities.map((a, i) => {
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