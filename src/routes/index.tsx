import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import sreLogo from "@/assets/sre-logo.png.asset.json";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowDownRight,
  ArrowUpRight,
  Bell,
  ChevronDown,
  Clock3,
  FileUp,
  Layers,
  Minus,
  Plus,
  Search,
  Settings,
  UploadCloud,
  Wallet,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SRE Construction Portal — Sialkot Real Estate" },
      {
        name: "description",
        content:
          "Internal construction management workspace for Sialkot Real Estate: project ledgers, material tracking, and smart estimation.",
      },
      { property: "og:title", content: "SRE Construction Portal" },
      {
        property: "og:description",
        content: "Internal construction management workspace for Sialkot Real Estate.",
      },
    ],
  }),
  component: Index,
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

const fmtPKR = (n: number) =>
  new Intl.NumberFormat("en-PK", { maximumFractionDigits: 0 }).format(n);

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
        over
          ? "bg-destructive/10 text-destructive"
          : "bg-accent text-[color:var(--sre-blue)]"
      }`}
    >
      {over ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
      {over ? "+" : ""}
      {pct.toFixed(1)}%
    </span>
  );
}

function Index() {
  const [area, setArea] = useState("1850");
  const [cementRate, setCementRate] = useState("1340");
  const [seryaRate, setSeryaRate] = useState("305000");

  const totalSpent = ledger.reduce((s, r) => s + r.procured * r.rate, 0);
  const totalEstimate = ledger.reduce((s, r) => s + r.required * r.rate, 0);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Top header */}
      <header className="sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex h-20 max-w-[1480px] items-center gap-6 px-6">
          <div className="flex items-center gap-4">
            <img
              src={sreLogo.url}
              alt="Sialkot Real Estate"
              className="h-12 w-auto object-contain"
            />
            <div className="hidden h-10 w-px bg-border md:block" />
            <h1 className="hidden text-xl font-extrabold uppercase tracking-tight text-destructive md:block">
              SRE Construction Portal
            </h1>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative hidden md:block">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search projects, plots, materials…"
                className="h-10 w-[300px] pl-9"
              />
            </div>
            <Button variant="ghost" size="icon" aria-label="Notifications">
              <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" aria-label="Settings">
              <Settings className="h-5 w-5" />
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-3 rounded-lg border border-border bg-card px-3 py-1.5 text-left transition-colors hover:bg-secondary">
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[color:var(--sre-blue)] text-sm font-semibold text-primary-foreground">
                    AK
                  </div>
                  <div className="hidden leading-tight sm:block">
                    <div className="text-sm font-semibold text-foreground">A. Khan</div>
                    <div className="text-xs text-muted-foreground">Project Manager</div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>My account</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Profile</DropdownMenuItem>
                <DropdownMenuItem>Team</DropdownMenuItem>
                <DropdownMenuItem>Audit log</DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>Sign out</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Workspace */}
      <main className="mx-auto grid max-w-[1480px] grid-cols-1 gap-6 px-6 py-8 xl:grid-cols-[minmax(0,1fr)_400px]">
        {/* Left: Project Ledger */}
        <section className="space-y-6">
          {/* Project header card */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  Project Workspace
                </div>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                  Plot 142 — 10 Marla Grey Structure
                </h2>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <Badge className="bg-[color:var(--sre-blue)] text-primary-foreground hover:bg-[color:var(--sre-blue)]">
                    Phase: Grey Structure
                  </Badge>
                  <span>•</span>
                  <span>
                    Client: <span className="font-medium text-foreground">Mr. Imran Sheikh</span>
                  </span>
                  <span>•</span>
                  <span>Started 14 Mar 2026</span>
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

            {/* Stat strip */}
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              <StatTile
                icon={<Wallet className="h-4 w-4" />}
                label="Spent to date"
                value={`PKR ${fmtPKR(totalSpent)}`}
              />
              <StatTile
                icon={<Layers className="h-4 w-4" />}
                label="Estimated total"
                value={`PKR ${fmtPKR(totalEstimate)}`}
              />
              <StatTile
                icon={<ArrowUpRight className="h-4 w-4" />}
                label="Budget used"
                value={`${((totalSpent / totalEstimate) * 100).toFixed(1)}%`}
              />
              <StatTile
                icon={<Clock3 className="h-4 w-4" />}
                label="On schedule"
                value="Day 64 / 110"
              />
            </div>
          </div>

          {/* Ledger table */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="flex items-center justify-between border-b border-border px-6 py-4">
              <div>
                <h3 className="text-base font-semibold text-foreground">Material & Labour Ledger</h3>
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
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">
                      Item
                    </TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-foreground">
                      Required
                    </TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-foreground">
                      Procured
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">
                      Unit
                    </TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-foreground">
                      Avg Rate (PKR)
                    </TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-foreground">
                      Total (PKR)
                    </TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">
                      Variance
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ledger.map((row) => (
                    <TableRow
                      key={row.item}
                      className="border-border transition-colors hover:bg-accent/40"
                    >
                      <TableCell className="font-medium text-foreground">{row.item}</TableCell>
                      <TableCell className="text-right tabular-nums text-muted-foreground">
                        {fmtPKR(row.required)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold text-foreground">
                        {fmtPKR(row.procured)}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{row.unit}</TableCell>
                      <TableCell className="text-right tabular-nums text-foreground">
                        {fmtPKR(row.rate)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums font-semibold text-foreground">
                        {fmtPKR(row.procured * row.rate)}
                      </TableCell>
                      <TableCell>
                        <VarianceCell required={row.required} procured={row.procured} />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="flex items-center justify-between border-t border-border bg-secondary/40 px-6 py-3 text-sm">
              <span className="text-muted-foreground">7 line items</span>
              <span className="font-semibold text-foreground">
                Running total: PKR {fmtPKR(totalSpent)}
              </span>
            </div>
          </div>
        </section>

        {/* Right: Smart Estimation */}
        <aside className="space-y-6">
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-base font-semibold text-foreground">Smart Estimation</h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  Generate cost breakdowns instantly
                </p>
              </div>
              <Badge variant="outline" className="border-[color:var(--sre-blue)]/30 text-[color:var(--sre-blue)]">
                AI
              </Badge>
            </div>

            {/* Dropzone */}
            <label
              htmlFor="naqsha"
              className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[color:var(--sre-blue)]/40 bg-[color:var(--sre-blue)]/[0.04] px-4 py-8 text-center transition-colors hover:bg-[color:var(--sre-blue)]/[0.08]"
            >
              <UploadCloud className="h-8 w-8 text-[color:var(--sre-blue)]" />
              <div className="mt-3 text-sm font-semibold text-foreground">
                Upload Naqsha (Floor Plan)
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                Drag & drop or click — PDF, JPG, PNG
              </div>
              <input id="naqsha" type="file" className="sr-only" />
            </label>

            <Separator className="my-6" />

            {/* Configs */}
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="area" className="text-xs font-medium text-muted-foreground">
                  Total Covered Area (SqFt)
                </Label>
                <Input
                  id="area"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  inputMode="numeric"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="cement" className="text-xs font-medium text-muted-foreground">
                    Cement Rate / Bag
                  </Label>
                  <Input
                    id="cement"
                    value={cementRate}
                    onChange={(e) => setCementRate(e.target.value)}
                    inputMode="numeric"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="serya" className="text-xs font-medium text-muted-foreground">
                    Serya Rate / Ton
                  </Label>
                  <Input
                    id="serya"
                    value={seryaRate}
                    onChange={(e) => setSeryaRate(e.target.value)}
                    inputMode="numeric"
                  />
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Output */}
            <div className="rounded-lg border border-border bg-secondary/40 p-4">
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Estimated Grey Structure
              </div>
              <div className="mt-1 text-2xl font-bold tabular-nums text-foreground">
                PKR {fmtPKR(Number(area) * 2450)}
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                ≈ PKR 2,450 / SqFt at current rates
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <SummaryRow label="Cement" value={`${Math.round(Number(area) * 0.4)} bags`} />
                <SummaryRow label="Serya" value={`${(Number(area) * 0.004).toFixed(1)} tons`} />
                <SummaryRow label="Bricks" value={`${fmtPKR(Math.round(Number(area) * 14))} pcs`} />
                <SummaryRow label="Completion" value="~ 110 days" />
              </div>
            </div>

            <Button className="mt-5 h-11 w-full bg-[color:var(--sre-blue)] text-sm font-semibold text-primary-foreground hover:bg-[color:var(--sre-blue)]/90">
              Save Estimate & Create Project Workspace
            </Button>
          </div>

          <div className="rounded-xl border border-border bg-card p-6">
            <h3 className="text-sm font-semibold text-foreground">Recent estimates</h3>
            <ul className="mt-3 divide-y divide-border text-sm">
              {[
                { name: "Plot 27 — 5 Marla", value: "PKR 41.2L" },
                { name: "Plot 88 — 1 Kanal", value: "PKR 1.62Cr" },
                { name: "Plot 142 — 10 Marla", value: "PKR 78.4L" },
              ].map((r) => (
                <li key={r.name} className="flex items-center justify-between py-2.5">
                  <span className="text-foreground">{r.name}</span>
                  <span className="font-semibold tabular-nums text-[color:var(--sre-blue)]">
                    {r.value}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </main>
    </div>
  );
}

function StatTile({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <span className="text-[color:var(--sre-blue)]">{icon}</span>
        {label}
      </div>
      <div className="mt-2 text-lg font-bold tabular-nums text-foreground">{value}</div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-card px-3 py-2">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="text-sm font-semibold tabular-nums text-foreground">{value}</div>
    </div>
  );
}
