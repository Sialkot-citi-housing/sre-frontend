import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  ArrowDownRight,
  ArrowUpRight,
  Clock3,
  FileUp,
  Layers,
  Minus,
  Plus,
  Pencil,
  Eye,
  Paperclip,
  CalendarDays,
  Wallet,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fmtPKR, projects } from "@/lib/projects-data";

export const Route = createFileRoute("/projects/$projectId")({
  loader: ({ params }) => {
    const project = projects.find((p) => p.id === params.projectId);
    if (!project) throw notFound();
    return { project };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `${loaderData.project.plot} — Ledger | SRE`
          : "Project Ledger — SRE",
      },
    ],
  }),
  component: ProjectLedger,
  notFoundComponent: () => (
    <AppShell title="Project not found">
      <p className="text-sm text-muted-foreground">
        That project doesn't exist.{" "}
        <Link to="/" className="font-medium text-[color:var(--sre-blue)] underline">
          Back to portfolio
        </Link>
      </p>
    </AppShell>
  ),
});

type LedgerRow = {
  item: string;
  required: number;
  procured: number;
  unit: string;
  rate: number;
  category: "bricks" | "cement" | "steel" | "sandcrush" | "labour";
};

const ledger: LedgerRow[] = [
  { item: "Awwal Bricks", required: 42000, procured: 38500, unit: "Pcs", rate: 22, category: "bricks" },
  { item: "Doyam Bricks", required: 6000, procured: 6000, unit: "Pcs", rate: 16, category: "bricks" },
  { item: "Lucky Cement (OPC)", required: 380, procured: 360, unit: "Bags", rate: 1340, category: "cement" },
  { item: "Maple Leaf SRC", required: 80, procured: 75, unit: "Bags", rate: 1410, category: "cement" },
  { item: "Elephant White Cement", required: 20, procured: 20, unit: "Bags", rate: 2650, category: "cement" },
  { item: "Grade-60 Serya 12mm", required: 1.8, procured: 1.9, unit: "Tons", rate: 305000, category: "steel" },
  { item: "Grade-60 Serya 16mm", required: 1.4, procured: 1.5, unit: "Tons", rate: 308000, category: "steel" },
  { item: "Chenab Sand", required: 28, procured: 26, unit: "Trolly", rate: 12500, category: "sandcrush" },
  { item: "Sargodha Bajri", required: 18, procured: 18, unit: "Trolly", rate: 18500, category: "sandcrush" },
  { item: "Margalla Crush", required: 14, procured: 12, unit: "Trolly", rate: 21000, category: "sandcrush" },
  { item: "Labour — Mason", required: 320, procured: 286, unit: "Days", rate: 2200, category: "labour" },
  { item: "Labour — Helper", required: 410, procured: 372, unit: "Days", rate: 1400, category: "labour" },
];

const CATEGORY_TABS = [
  { id: "all", label: "All (Overview)" },
  { id: "bricks", label: "Bricks" },
  { id: "cement", label: "Cement" },
  { id: "steel", label: "Steel (Serya)" },
  { id: "sandcrush", label: "Sand & Crush" },
  { id: "labour", label: "Labour" },
] as const;

type DailyEntry = {
  date: string;
  category: "Material Received" | "Labour Logged" | "Site Note" | "Payment";
  details: string;
  addedBy: string;
  vendor: string;
  receipt: boolean;
};

const dailyEntries: DailyEntry[] = [
  { date: "21 Jun 2026", category: "Material Received", details: "50 bags Lucky Cement (OPC)", addedBy: "A. Khan", vendor: "Bilal Traders", receipt: true },
  { date: "21 Jun 2026", category: "Labour Logged", details: "8 Masons + 12 Helpers (1st floor slab)", addedBy: "Site Foreman", vendor: "Thekedar Yousaf", receipt: false },
  { date: "20 Jun 2026", category: "Material Received", details: "1.2 Ton Grade-60 Serya 12mm", addedBy: "A. Khan", vendor: "Ittefaq Steel", receipt: true },
  { date: "20 Jun 2026", category: "Payment", details: "Advance PKR 250,000 to Thekedar Yousaf", addedBy: "Accounts", vendor: "Thekedar Yousaf", receipt: true },
  { date: "19 Jun 2026", category: "Material Received", details: "4 Trolly Chenab Sand", addedBy: "Site Foreman", vendor: "Chenab Suppliers", receipt: true },
  { date: "19 Jun 2026", category: "Site Note", details: "Curing started — column line C", addedBy: "Engr. Tahir", vendor: "—", receipt: false },
  { date: "18 Jun 2026", category: "Material Received", details: "12,000 Awwal Bricks", addedBy: "A. Khan", vendor: "Sialkot Brick Kiln", receipt: true },
  { date: "18 Jun 2026", category: "Labour Logged", details: "6 Masons (boundary wall)", addedBy: "Site Foreman", vendor: "Thekedar Imran", receipt: false },
];

function CategoryBadge({ category }: { category: DailyEntry["category"] }) {
  const map: Record<DailyEntry["category"], string> = {
    "Material Received": "bg-[color:var(--sre-blue)]/10 text-[color:var(--sre-blue)]",
    "Labour Logged": "bg-emerald-50 text-emerald-700",
    "Site Note": "bg-amber-50 text-amber-700",
    Payment: "bg-destructive/10 text-destructive",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${map[category]}`}>
      {category}
    </span>
  );
}

function VarianceCell({ required, procured }: { required: number; procured: number }) {
  const diff = procured - required;
  const pct = required === 0 ? 0 : (diff / required) * 100;
  const onTrack = Math.abs(pct) < 2;
  const over = pct > 0;
  if (onTrack) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full bg-accent px-2.5 py-1 text-xs font-medium text-[color:var(--sre-blue)]">
        <Minus className="h-3 w-3" /> On track
      </span>
    );
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
        over ? "bg-destructive/10 text-destructive" : "bg-accent text-[color:var(--sre-blue)]"
      }`}
    >
      {over ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {over ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
}

function StatTile({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-lg font-bold tabular-nums text-foreground">{value}</div>
    </div>
  );
}

function ProjectLedger() {
  const { project } = Route.useLoaderData();
  const totalSpent = ledger.reduce((s, r) => s + r.procured * r.rate, 0);
  const totalEstimate = ledger.reduce((s, r) => s + r.required * r.rate, 0);

  return (
    <AppShell
      title={`${project.plot} — ${project.size}`}
      subtitle={`${project.client} • Started ${project.startedAt}`}
    >
      <div className="mb-5">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <Link to="/">
            <ArrowLeft className="h-4 w-4" /> Back to portfolio
          </Link>
        </Button>
      </div>

      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Project Workspace
              </div>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                {project.plot} — {project.size} {project.phase}
              </h2>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                <Badge className="bg-[color:var(--sre-blue)] text-primary-foreground hover:bg-[color:var(--sre-blue)]">
                  Phase: {project.phase}
                </Badge>
                <span>•</span>
                <span>
                  Client: <span className="font-medium text-foreground">{project.client}</span>
                </span>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-1.5">
                <FileUp className="h-4 w-4" /> Export Ledger
              </Button>
              <Button className="gap-1.5 bg-[color:var(--sre-blue)] text-primary-foreground hover:bg-[color:var(--sre-blue)]/90">
                <Plus className="h-4 w-4" /> Add Entry
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatTile icon={<Wallet className="h-4 w-4" />} label="Spent to date" value={`PKR ${fmtPKR(totalSpent)}`} />
            <StatTile icon={<Layers className="h-4 w-4" />} label="Estimated total" value={`PKR ${fmtPKR(totalEstimate)}`} />
            <StatTile icon={<ArrowUpRight className="h-4 w-4" />} label="Budget used" value={`${((totalSpent / totalEstimate) * 100).toFixed(1)}%`} />
            <StatTile icon={<Clock3 className="h-4 w-4" />} label="On schedule" value={`Day ${project.dayCurrent} / ${project.dayTotal}`} />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-6 py-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">Material &amp; Labour Ledger</h3>
              <p className="text-xs text-muted-foreground">
                Live procurement vs. estimate — Excel replacement
              </p>
            </div>
            <Button variant="ghost" size="sm" className="text-[color:var(--sre-blue)]">
              View full history
            </Button>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/60 hover:bg-secondary/60">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">Item</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-foreground">Required</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-foreground">Procured</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">Unit</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-foreground">Avg Rate (PKR)</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-foreground">Total (PKR)</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">Variance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ledger.map((row) => (
                  <TableRow key={row.item} className="border-border transition-colors hover:bg-accent/40">
                    <TableCell className="font-medium text-foreground">{row.item}</TableCell>
                    <TableCell className="text-right tabular-nums text-muted-foreground">{fmtPKR(row.required)}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-foreground">{fmtPKR(row.procured)}</TableCell>
                    <TableCell className="text-muted-foreground">{row.unit}</TableCell>
                    <TableCell className="text-right tabular-nums text-foreground">{fmtPKR(row.rate)}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-foreground">{fmtPKR(row.procured * row.rate)}</TableCell>
                    <TableCell><VarianceCell required={row.required} procured={row.procured} /></TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="flex items-center justify-between border-t border-border bg-secondary/40 px-6 py-3 text-sm">
            <span className="text-muted-foreground">7 line items</span>
            <span className="font-semibold text-foreground">Running total: PKR {fmtPKR(totalSpent)}</span>
          </div>
        </div>
      </div>
    </AppShell>
  );
}