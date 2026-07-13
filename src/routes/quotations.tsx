import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { UploadCloud, Loader2 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { fmtPKR } from "@/lib/projects-data";
import { api } from "@/lib/api";

export const Route = createFileRoute("/quotations")({
  head: () => ({
    meta: [
      { title: "Smart Quotations — SRE Construction Portal" },
      {
        name: "description",
        content:
          "Naqsha AI quotations — instantly estimate grey-structure costs for any plot.",
      },
    ],
  }),
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
  useEffect(() => {
    document.title = "Smart Quotations | Sialkot Real Estate";
  }, []);
  const router = useRouter();
  const queryClient = useQueryClient();
  
  const [area, setArea] = useState("1850");
  const [cementRate, setCementRate] = useState("1340");
  const [seryaRate, setSeryaRate] = useState("305000"); // Per Ton
  const [bricksRate, setBricksRate] = useState("14000"); // Per 1000 Pcs
  const [sandRate, setSandRate] = useState("40"); // Per Cft
  const [crushRate, setCrushRate] = useState("65"); // Per Cft
  const [laborRate, setLaborRate] = useState("450"); // Per SqFt

  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [projectName, setProjectName] = useState("");
  const [projectSize, setProjectSize] = useState("");
  const [clientName, setClientName] = useState("");
  const [projectPhase, setProjectPhase] = useState("Foundation");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]); // yyyy-mm-dd
  const [advancePayment, setAdvancePayment] = useState("0");

  const numArea = Number(area) || 0;
  const numCementRate = Number(cementRate) || 0;
  const numSteelRateTon = Number(seryaRate) || 0;
  const numBricksRate = Number(bricksRate) || 0;
  const numSandRate = Number(sandRate) || 0;
  const numCrushRate = Number(crushRate) || 0;
  const numLaborRate = Number(laborRate) || 0;

  // Exact CLI Formulas
  const cementBags = Math.round(numArea * 0.42);
  const steelKg = Math.round(numArea * 4.0);
  const bricksCount = Math.round(numArea * 34);
  const sandCft = Math.round(numArea * 2.1);
  const crushCft = Math.round(numArea * 1.4);
  const laborSqft = numArea;

  // Costs
  const costCement = cementBags * numCementRate;
  const costSteel = steelKg * (numSteelRateTon / 1000);
  const costBricks = (bricksCount / 1000) * numBricksRate;
  const costSand = sandCft * numSandRate;
  const costCrush = crushCft * numCrushRate;
  const costLabor = laborSqft * numLaborRate;

  const estimatedTotal = Math.round(costCement + costSteel + costBricks + costSand + costCrush + costLabor);
  const costPerSqFt = numArea > 0 ? Math.round(estimatedTotal / numArea) : 0;

  const { mutate: createProject, isPending } = useMutation({
    mutationFn: async () => {
      const d = new Date(startDate);
      const formattedDate = !isNaN(d.getTime()) ? d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : startDate;

      const project = await api.createProject({
        plot: projectName || `Plot (AI Estimate - ${numArea} sqft)`,
        size: projectSize || `${numArea} SqFt`,
        client: clientName || "TBD",
        phase: projectPhase || "Foundation",
        budget: estimatedTotal,
        startedAt: formattedDate,
      });
      
      const advance = Number(advancePayment) || 0;
      if (advance > 0) {
        await api.addCustomerPayment({
          project: project._id,
          date: new Date().toISOString().split("T")[0],
          amount: advance,
          method: "Cash",
          note: "Advance payment from estimate",
        });
      }
      return project;
    },
    onSuccess: (project: any) => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Workspace created from estimate!");
      router.navigate({ to: `/projects/${project._id}` });
    },
    onError: (e: any) => toast.error(e.message),
  });

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

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
              <Label htmlFor="area" className="text-sm font-semibold text-foreground">
                Covered Area (SqFt)
              </Label>
              <Input id="area" className="h-11 font-medium" value={area} onChange={(e) => setArea(e.target.value)} inputMode="numeric" />
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
            <div className="space-y-1.5">
              <Label htmlFor="bricks" className="text-xs font-medium text-muted-foreground">
                Bricks Rate / 1000
              </Label>
              <Input id="bricks" value={bricksRate} onChange={(e) => setBricksRate(e.target.value)} inputMode="numeric" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="sand" className="text-xs font-medium text-muted-foreground">
                Sand Rate / Cft
              </Label>
              <Input id="sand" value={sandRate} onChange={(e) => setSandRate(e.target.value)} inputMode="numeric" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="crush" className="text-xs font-medium text-muted-foreground">
                Crush Rate / Cft
              </Label>
              <Input id="crush" value={crushRate} onChange={(e) => setCrushRate(e.target.value)} inputMode="numeric" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="labor" className="text-xs font-medium text-muted-foreground">
                Labor Rate / SqFt
              </Label>
              <Input id="labor" value={laborRate} onChange={(e) => setLaborRate(e.target.value)} inputMode="numeric" />
            </div>
          </div>
        </div>

        <aside className="rounded-xl border border-border bg-card p-6">
          <div className="rounded-lg border border-border bg-secondary/40 p-4">
            <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Estimated Grey Structure
            </div>
            <div className="mt-1 text-3xl font-bold tabular-nums text-foreground">
              PKR {fmtPKR(estimatedTotal)}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              ≈ PKR {fmtPKR(costPerSqFt)} / SqFt at current rates · ~110 days completion
            </div>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <SummaryRow label="Cement" value={`${fmtPKR(cementBags)} bags`} />
              <SummaryRow label="Serya" value={`${(steelKg / 1000).toFixed(2)} tons`} />
              <SummaryRow label="Bricks" value={`${fmtPKR(bricksCount)} pcs`} />
              <SummaryRow label="Sand" value={`${fmtPKR(sandCft)} Cft`} />
              <SummaryRow label="Crush" value={`${fmtPKR(crushCft)} Cft`} />
              <SummaryRow label="Labor" value={`${fmtPKR(laborSqft)} SqFt`} />
            </div>
          </div>

          <Button 
            disabled={isPending || numArea === 0}
            onClick={() => {
              setProjectName(`Plot (AI Estimate - ${numArea} sqft)`);
              setProjectSize(`${numArea} SqFt`);
              setClientName("");
              setProjectPhase("Foundation");
              setStartDate(new Date().toISOString().split('T')[0]);
              setAdvancePayment("0");
              setCreateModalOpen(true);
            }}
            className="mt-5 h-11 w-full bg-[color:var(--sre-blue)] text-sm font-semibold text-primary-foreground hover:bg-[color:var(--sre-blue)]/90"
          >
            Save Estimate &amp; Create Project Workspace
          </Button>
        </aside>
      </div>

      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Project Workspace</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 gap-4 py-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Plot / Project Title</Label>
              <Input value={projectName} onChange={(e) => setProjectName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Size</Label>
              <Input value={projectSize} onChange={(e) => setProjectSize(e.target.value)} placeholder="e.g. 5 Marla, 1850 SqFt" />
            </div>
            <div className="space-y-1.5">
              <Label>Client Name</Label>
              <Input value={clientName} onChange={(e) => setClientName(e.target.value)} placeholder="e.g. John Doe" />
            </div>
            <div className="space-y-1.5">
              <Label>Current Phase</Label>
              <select
                value={projectPhase}
                onChange={(e) => setProjectPhase(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="Foundation">Foundation</option>
                <option value="Grey Structure">Grey Structure</option>
                <option value="Finishing">Finishing</option>
                <option value="Handover">Handover</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Start Date</Label>
              <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Advance Received from Client (PKR)</Label>
              <Input value={advancePayment} onChange={(e) => setAdvancePayment(e.target.value)} inputMode="numeric" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setCreateModalOpen(false)} disabled={isPending}>Cancel</Button>
            <Button onClick={() => createProject()} disabled={isPending || !projectName}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Create Project
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppShell>
  );
}