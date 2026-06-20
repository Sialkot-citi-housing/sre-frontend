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
  Wallet,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
};

const ledger: LedgerRow[] = [
  { item: "Awwal Bricks", required: 42000, procured: 38500, unit: "Pcs", rate: 22 },
  { item: "Grade-60 Serya", required: 3.2, procured: 3.4, unit: "Tons", rate: 305000 },
  { item: "Lucky Cement", required: 480, procured: 455, unit: "Bags", rate: 1340 },
  { item: "Chenab Sand", required: 28, procured: 26, unit: "Trolly", rate: 12500 },
  { item: "Sargodha Bajri", required: 18, procured: 18, unit: "Trolly", rate: 18500 },
  { item: "Margalla Crush", required: 14, procured: 12, unit: "Trolly", rate: 21000 },
  { item: "Labour — Mason", required: 320, procured: 286, unit: "Days", rate: 2200 },
];

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