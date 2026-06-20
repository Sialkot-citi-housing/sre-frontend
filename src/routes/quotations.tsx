import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { UploadCloud } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { fmtPKR } from "@/lib/projects-data";

export const Route = createFileRoute("/quotations")({
  component: Quotations,
});

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-card px-3 py-2">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="mt-0.5 text-sm font-semibold text-foreground">{value}</div>
    </div>
  );
}

function Quotations() {
  const [area, setArea] = useState("1850");
  const [cementRate, setCementRate] = useState("1340");
  const [seryaRate, setSeryaRate] = useState("305000");

  return (
    <AppShell title="Smart Quotations" subtitle="Naqsha AI — generate grey-structure estimates in seconds">
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_440px]">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base font-semibold text-foreground">Naqsha AI Estimator</h3>
              <p className="mt-1 text-xs text-muted-foreground">
                Upload a floor plan and generate cost breakdowns instantly
              </p>
            </div>
            <Badge variant="outline" className="border-[color:var(--sre-blue)]/30 text-[color:var(--sre-blue)]">
              AI
            </Badge>
          </div>

          <label
            htmlFor="naqsha"
            className="mt-5 flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-[color:var(--sre-blue)]/40 bg-[color:var(--sre-blue)]/[0.04] px-4 py-12 text-center transition-colors hover:bg-[color:var(--sre-blue)]/[0.08]"
          >
            <UploadCloud className="h-9 w-9 text-[color:var(--sre-blue)]" />
            <div className="mt-3 text-sm font-semibold text-foreground">Upload Naqsha (Floor Plan)</div>
            <div className="mt-1 text-xs text-muted-foreground">Drag &amp; drop or click — PDF, JPG, PNG</div>
            <input id="naqsha" type="file" className="sr-only" />
          </label>

          <Separator className="my-6" />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="area" className="text-xs font-medium text-muted-foreground">
                Covered Area (SqFt)
              </Label>
              <Input id="area" value={area} onChange={(e) => setArea(e.target.value)} inputMode="numeric" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="cement" className="text-xs font-medium text-muted-foreground">
                Cement Rate / Bag
              </Label>
              <Input id="cement" value={cementRate} onChange={(e) => setCementRate(e.target.value)} inputMode="numeric" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="serya" className="text-xs font-medium text-muted-foreground">
                Serya Rate / Ton
              </Label>
              <Input id="serya" value={seryaRate} onChange={(e) => setSeryaRate(e.target.value)} inputMode="numeric" />
            </div>
          </div>
        </div>

        <aside className="rounded-xl border border-border bg-card p-6">
          <div className="rounded-lg border border-border bg-secondary/40 p-4">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Estimated Grey Structure
            </div>
            <div className="mt-1 text-3xl font-bold tabular-nums text-foreground">
              PKR {fmtPKR(Number(area) * 2450)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              ≈ PKR 2,450 / SqFt at current rates · ~110 days completion
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <SummaryRow label="Cement" value={`${Math.round(Number(area) * 0.4)} bags`} />
              <SummaryRow label="Serya" value={`${(Number(area) * 0.004).toFixed(1)} tons`} />
              <SummaryRow label="Bricks" value={`${fmtPKR(Math.round(Number(area) * 14))} pcs`} />
              <SummaryRow label="Sand" value={`${Math.round(Number(area) * 0.015)} trolly`} />
            </div>
          </div>

          <Button className="mt-5 h-11 w-full bg-[color:var(--sre-blue)] text-sm font-semibold text-primary-foreground hover:bg-[color:var(--sre-blue)]/90">
            Save Estimate &amp; Create Project Workspace
          </Button>
        </aside>
      </div>
    </AppShell>
  );
}