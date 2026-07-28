import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  CircleDot,
  Clock3,
  FileDown,
  Settings,
  Layers,
  Plus,
  Pencil,
  Wallet,
  HardHat,
  Phone,
  Users,
  ArrowUpRight,
  Loader2,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { fmtPKR } from "@/lib/projects-data";
import { api } from "@/lib/api";
import { AddRecordDialog } from "@/components/dialogs/add-record-dialog";
import { EditRecordDialog, type EditValues } from "@/components/dialogs/edit-record-dialog";
import {
  MATERIAL_CATEGORY_OPTIONS,
  CONTRACTOR_ROLES,
  type MaterialCategory,
  type Contractor,
  type ContractorRole,
  type Procurement,
  type ContractorPayment,
  type CustomerPayment,
  today,
} from "@/lib/finance-store";

export const Route = createFileRoute("/projects/$projectId")({
  loader: async ({ params }) => {
    return { projectId: params.projectId };
  },
  head: ({ loaderData }) => ({
    meta: [
      {
        title: loaderData
          ? `Project ${loaderData.projectId} Ledger | SRE`
          : "Project Ledger — SRE",
      },
    ],
  }),
  component: ProjectLedger,
  notFoundComponent: () => (
    <AppShell title="Project not found">
      <p className="text-sm text-muted-foreground">
        That project doesn't exist.{" "}
        <Link to="/ledgers" className="font-medium text-[color:var(--sre-blue)] underline">
          Back to portfolio
        </Link>
      </p>
    </AppShell>
  ),
});

const MATERIAL_TABS = [
  { id: "all", label: "All (Overview)" },
  { id: "bricks", label: "Bricks" },
  { id: "cement", label: "Cement" },
  { id: "steel", label: "Steel (Serya)" },
  { id: "sand", label: "Sand" },
  { id: "crush", label: "Crush" },
  { id: "other", label: "Other" },
] as const;

function ContractorStatusBadge({ status }: { status: Contractor["status"] }) {
  const map: Record<Contractor["status"], string> = {
    Active: "bg-emerald-50 text-emerald-700",
    Completed: "bg-[color:var(--sre-blue)]/10 text-[color:var(--sre-blue)]",
    "On hold": "bg-amber-50 text-amber-700",
  };
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${map[status]}`}>
      {status}
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
  const { projectId } = Route.useLoaderData();
  const queryClient = useQueryClient();

  const { data: project, isLoading: loadingProject } = useQuery({
    queryKey: ["project", projectId],
    queryFn: () => api.getProjectById(projectId),
  });

  const { data: procurement = [], isLoading: loadingProc } = useQuery({
    queryKey: ["procurements", projectId],
    queryFn: () => api.getProcurementsByProject(projectId),
  });

  useEffect(() => {
    if (project?.plot) {
      document.title = `${project.plot} | Sialkot Real Estate`;
    } else {
      document.title = "Project Ledger | Sialkot Real Estate";
    }
  }, [project?.plot]);

  const { data: contractors = [], isLoading: loadingCont } = useQuery({
    queryKey: ["contractors", projectId],
    queryFn: () => api.getContractorsByProject(projectId),
  });

  const { data: payments, isLoading: loadingPay } = useQuery({
    queryKey: ["payments", projectId],
    queryFn: () => api.getPaymentsByProject(projectId),
  });

  const contractorPayments = payments?.contractorPayments || [];
  const customerPayments = payments?.customerPayments || [];

  const [materialTab, setMaterialTab] = useState<string>("all");
  const [contractorTab, setContractorTab] = useState<string>(CONTRACTOR_ROLES[0]);
  const [editProcurementId, setEditProcurementId] = useState<string | null>(null);
  const [editContractorId, setEditContractorId] = useState<string | null>(null);
  const [editContractorPaymentId, setEditContractorPaymentId] = useState<string | null>(null);
  const [editCustomerPaymentId, setEditCustomerPaymentId] = useState<string | null>(null);
  const [markedComplete, setMarkedComplete] = useState(false);
  
  const [editProjectOpen, setEditProjectOpen] = useState(false);
  const [deleteProjectOpen, setDeleteProjectOpen] = useState(false);
  const [editProjectName, setEditProjectName] = useState("");
  const router = useRouter();

  const { mutate: updateProject, isPending: isUpdatingProject } = useMutation({
    mutationFn: (data: any) => api.updateProject(project._id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["project", projectId] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      setEditProjectOpen(false);
      toast.success("Project updated successfully");
    },
    onError: (e: any) => toast.error(e.message),
  });

  const { mutate: deleteProject, isPending: isDeletingProject } = useMutation({
    mutationFn: () => api.deleteProject(project._id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
      toast.success("Project deleted successfully");
      router.navigate({ to: "/ledgers" });
    },
    onError: (e: any) => toast.error(e.message),
  });

  const handleDeleteProcurement = async (id: string) => {
    if (!confirm("Are you sure you want to delete this procurement record?")) return;
    try {
      await api.deleteProcurement(id);
      queryClient.invalidateQueries({ queryKey: ["procurements", projectId] });
      toast.success("Procurement deleted");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDeleteContractor = async (id: string) => {
    if (!confirm("Are you sure you want to delete this contractor?")) return;
    try {
      await api.deleteContractor(id);
      queryClient.invalidateQueries({ queryKey: ["contractors", projectId] });
      toast.success("Contractor deleted");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDeleteContractorPayment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payment?")) return;
    try {
      await api.deleteContractorPayment(id);
      queryClient.invalidateQueries({ queryKey: ["payments", projectId] });
      toast.success("Payment deleted");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const handleDeleteCustomerPayment = async (id: string) => {
    if (!confirm("Are you sure you want to delete this payment?")) return;
    try {
      await api.deleteCustomerPayment(id);
      queryClient.invalidateQueries({ queryKey: ["payments", projectId] });
      toast.success("Payment deleted");
    } catch (e: any) {
      toast.error(e.message);
    }
  };

  const isLoading = loadingProject || loadingProc || loadingCont || loadingPay;
  if (isLoading) return <div className="p-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-[color:var(--sre-blue)]" /></div>;
  if (!project) return <div>Project not found.</div>;

  const contractPrice = project.budget || 0;
  const customerReceived = customerPayments.reduce((s: any, p: any) => s + p.amount, 0);

  const getProcurementTotal = (r: any) => r.category === 'other' && (!r.quantity || r.quantity === 0) && (!r.rate || r.rate === 0) ? r.paid : r.quantity * r.rate;

  const totalSpent = procurement.reduce((s: any, r: any) => s + getProcurementTotal(r), 0);
  
  const paidByContractor = (id: string) =>
    contractorPayments.filter((p: any) => (p.contractorId || p.contractor) === id).reduce((s: any, p: any) => s + p.amount, 0);

  const contractorsPaid = contractors.reduce((s: any, c: any) => s + paidByContractor(c._id || c.id), 0);
  const contractorsTotal = contractors.reduce((s: any, c: any) => s + c.agreedAmount, 0);

  const materialPaidTotal = procurement.reduce((s: any, r: any) => s + (r.paid || 0), 0);
  const overallProjectSpent = materialPaidTotal + contractorsPaid;
  const customerBalance = customerReceived - overallProjectSpent;
  const spentPercentage = customerReceived > 0 ? ((overallProjectSpent / customerReceived) * 100).toFixed(1) : 0;
  
  const filteredMaterial = materialTab === "all" ? procurement : procurement.filter((r: any) => r.category === materialTab);
  const filteredTotal = filteredMaterial.reduce((s: any, r: any) => s + getProcurementTotal(r), 0);
  const filteredPaid = filteredMaterial.reduce((s: any, r: any) => s + (r.paid || 0), 0);
  const qtyByItem = filteredMaterial.reduce<Record<string, { qty: number; unit: string }>>((acc: any, r: any) => {
    const key = `${r.category} (${r.unit})`;
    acc[key] = acc[key] ?? { qty: 0, unit: r.unit };
    acc[key].qty += r.quantity;
    return acc;
  }, {});

  const contractorsInTab = contractors.filter((c: any) => c.role === contractorTab);

  // CSV downloads (client-side)
  const downloadCSV = (filename: string, rows: (string | number)[][]) => {
    const csv = rows
      .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };
  const slug = project.plot.toLowerCase().replace(/\s+/g, "-");
  const downloadMaterialsCSV = () =>
    downloadCSV(`${slug}-materials.csv`, [
      ["Date", "Category", "Item", "Vendor", "Quantity", "Unit", "Rate (PKR)", "Total (PKR)", "Paid (PKR)", "Balance (PKR)"],
      ...procurement.map((r) => [
        r.date, r.category, r.item, r.vendor, r.quantity, r.unit, r.rate,
        r.quantity * r.rate, r.paid, Math.max(0, r.quantity * r.rate - r.paid),
      ]),
    ]);
  const downloadContractorsCSV = () => {
    const rows: (string | number)[][] = [
      ["Role", "Name", "Contact", "Status", "Agreed (PKR)", "Paid (PKR)", "Balance (PKR)"],
      ...contractors.map((c: any) => {
        const paid = paidByContractor(c._id || c.id);
        return [c.role, c.name, c.contact, c.status, c.agreedAmount, paid, Math.max(0, c.agreedAmount - paid)];
      }),
      [],
      ["Payment Date", "Contractor", "Role", "Amount (PKR)", "Note"],
      ...contractorPayments.map((p) => {
        const c = contractors.find((x) => (x._id || x.id) === p.contractorId);
        return [p.date, c?.name ?? "—", c?.role ?? "—", p.amount, p.note];
      }),
    ];
    downloadCSV(`${slug}-contractors.csv`, rows);
  };
  const downloadCustomerCSV = () =>
    downloadCSV(`${slug}-customer-payments.csv`, [
      ["Date", "Amount (PKR)", "Method", "Note"],
      ...customerPayments.map((p) => [p.date, p.amount, p.method, p.note]),
    ]);

  // Completion checks (rule-based)
  const checks = {
    schedule: {
      ok: project.dayCurrent >= project.dayTotal,
      label: `Timeline reached (Day ${project.dayCurrent} / ${project.dayTotal})`,
    },
    payments: {
      ok: contractors.every((c) => paidByContractor(c._id || c.id) >= c.agreedAmount),
      label: `All contractor balances cleared`,
    },
    holds: {
      ok: contractors.every((c) => c.status !== "On hold"),
      label: `No contractor on hold`,
    },
    customer: {
      ok: customerReceived >= contractPrice,
      label: `Customer fully paid (PKR ${fmtPKR(customerReceived)} / ${fmtPKR(contractPrice)})`,
    },
  };
  const readyToClose = Object.values(checks).every((c) => c.ok);

  return (
    <AppShell
      title={`${project.plot} — ${project.size}`}
      subtitle={`${project.client} • Started ${project.startedAt}`}
    >
      <div className="mb-5">
        <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
          <Link to="/ledgers">
            <ArrowLeft className="h-4 w-4" /> Back to portfolio
          </Link>
        </Button>
      </div>

      <div className="space-y-6">
        {(readyToClose || markedComplete) && (
          <div
            className={`flex flex-wrap items-start justify-between gap-4 rounded-xl border p-5 ${
              markedComplete
                ? "border-[color:var(--sre-blue)]/30 bg-[color:var(--sre-blue)]/5"
                : "border-emerald-200 bg-emerald-50"
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`rounded-lg p-2 ${markedComplete ? "bg-[color:var(--sre-blue)]/10 text-[color:var(--sre-blue)]" : "bg-emerald-100 text-emerald-700"}`}>
                <CheckCircle2 className="h-5 w-5" />
              </div>
              <div>
                <h3 className={`text-sm font-semibold ${markedComplete ? "text-[color:var(--sre-blue)]" : "text-emerald-800"}`}>
                  {markedComplete ? "Project marked as complete" : "Ready to close this project"}
                </h3>
                <p className={`mt-0.5 text-xs ${markedComplete ? "text-[color:var(--sre-blue)]/80" : "text-emerald-700"}`}>
                  {markedComplete
                    ? "This workspace is closed. Move to Completed History from the portfolio."
                    : "All completion checks passed. Review and confirm to close the workspace."}
                </p>
                <ul className={`mt-3 grid gap-1.5 text-xs sm:grid-cols-2 ${markedComplete ? "text-[color:var(--sre-blue)]/80" : "text-emerald-800"}`}>
                  {Object.entries(checks).map(([k, c]) => (
                    <li key={k} className="flex items-center gap-1.5">
                      <CheckCircle2 className="h-3.5 w-3.5" /> {c.label}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
            {!markedComplete && (
              <Button
                onClick={() => setMarkedComplete(true)}
                className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
              >
                <CheckCircle2 className="h-4 w-4" /> Mark project complete
              </Button>
            )}
          </div>
        )}
        {!readyToClose && !markedComplete && (
          <div className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs">
              <span className="font-semibold uppercase tracking-wider text-muted-foreground">
                Completion checklist
              </span>
              {Object.entries(checks).map(([k, c]) => (
                <span key={k} className={`inline-flex items-center gap-1.5 ${c.ok ? "text-emerald-700" : "text-muted-foreground"}`}>
                  {c.ok ? <CheckCircle2 className="h-3.5 w-3.5" /> : <CircleDot className="h-3.5 w-3.5" />}
                  {c.label}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* HEADER */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Project Workspace
              </div>
              <h2 className="mt-1 flex items-center gap-2 text-2xl font-bold tracking-tight text-foreground">
                {project.plot} — {project.size} {project.phase}
                <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => {
                  setEditProjectName(project.plot);
                  setEditProjectOpen(true);
                }}>
                  <Pencil className="h-3 w-3" />
                </Button>
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-1.5">
                    <Settings className="h-4 w-4" /> Project Actions
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>Download Reports</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => downloadMaterialsCSV()}>
                    Materials (CSV)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => downloadContractorsCSV()}>
                    Contractors &amp; Payments (CSV)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => downloadCustomerCSV()}>
                    Customer Payments (CSV)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  {!markedComplete ? (
                    <DropdownMenuItem onClick={() => setMarkedComplete(true)} className="text-emerald-600">
                      Mark Project as Complete
                    </DropdownMenuItem>
                  ) : (
                    <DropdownMenuItem disabled className="text-emerald-600">
                      Project is Completed
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuItem onClick={() => setDeleteProjectOpen(true)} className="text-red-600">
                    Delete Project Workspace
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            
            <Dialog open={editProjectOpen} onOpenChange={setEditProjectOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Edit Project Name</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <Label>Project / Plot Name</Label>
                  <Input value={editProjectName} onChange={(e) => setEditProjectName(e.target.value)} />
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setEditProjectOpen(false)}>Cancel</Button>
                  <Button onClick={() => updateProject({ plot: editProjectName })} disabled={isUpdatingProject || !editProjectName}>
                    {isUpdatingProject && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Changes
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>

            <Dialog open={deleteProjectOpen} onOpenChange={setDeleteProjectOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Project</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                  <p className="text-sm text-muted-foreground">
                    Are sure you want to delete this project? You can append this project in history.
                  </p>
                </div>
                <DialogFooter>
                  <Button variant="ghost" onClick={() => setDeleteProjectOpen(false)}>Cancel</Button>
                  <Button variant="destructive" onClick={() => deleteProject()} disabled={isDeletingProject}>
                    {isDeletingProject && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Delete Project
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatTile icon={<Wallet className="h-4 w-4" />} label="Spent on materials" value={`PKR ${fmtPKR(totalSpent)}`} />
            <StatTile icon={<HardHat className="h-4 w-4" />} label="Paid to contractors" value={`PKR ${fmtPKR(contractorsPaid)}`} />
            <StatTile icon={<Users className="h-4 w-4" />} label="Received from customer" value={`PKR ${fmtPKR(customerReceived)}`} />
            <StatTile icon={<Clock3 className="h-4 w-4" />} label="On schedule" value={`Day ${project.dayCurrent} / ${project.dayTotal}`} />
          </div>
        </div>

        {/* CUSTOMER PAYMENTS */}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-[color:var(--sre-blue)]/10 p-2 text-[color:var(--sre-blue)]">
                <Users className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Customer Payments</h3>
                <p className="text-xs text-muted-foreground">
                  Payments received from the project owner — logged in instalments over the project timeline
                </p>
              </div>
            </div>
            <AddRecordDialog
              trigger={
                <Button size="sm" className="gap-1.5 bg-[color:var(--sre-blue)] text-primary-foreground hover:bg-[color:var(--sre-blue)]/90">
                  <Plus className="h-4 w-4" /> Record Payment
                </Button>
              }
              title="Record Customer Payment"
              description="Log an instalment received from the project owner."
              submitLabel="Record Payment"
              defaults={{ date: today(), amount: 0, method: "Bank Transfer", note: "" }}
              fields={[
                { key: "date", label: "Date", type: "date", required: true },
                { key: "amount", label: "Amount (PKR)", type: "number", required: true },
                { key: "method", label: "Method", type: "select", options: ["Cash", "Bank Transfer", "Cheque"] as const, required: true },
                { key: "note", label: "Note", type: "text", placeholder: "e.g. Grey structure milestone" },
              ]}
              onSubmit={(v) =>
                api.addCustomerPayment({
                  project: project._id,
                  date: String(v.date),
                  amount: Number(v.amount) || 0,
                  method: v.method,
                  note: String(v.note ?? ""),
                }).then(() => {
                  queryClient.invalidateQueries({ queryKey: ["payments"] });
                  toast.success("Payment recorded");
                }).catch(e => toast.error(e.message))
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4 border-b border-border bg-secondary/30 px-6 py-4 md:grid-cols-4">
            <StatTile icon={<ArrowUpRight className="h-4 w-4" />} label="Received to Date" value={`PKR ${fmtPKR(customerReceived)}`} />
            <StatTile icon={<Wallet className="h-4 w-4" />} label="Total spent to Date" value={`PKR ${fmtPKR(overallProjectSpent)}`} />
            <StatTile icon={<Layers className="h-4 w-4" />} label="Balance due" value={`PKR ${fmtPKR(customerBalance)}`} />
            <StatTile icon={<CheckCircle2 className="h-4 w-4" />} label="Spent %" value={`${spentPercentage}%`} />
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/60 hover:bg-secondary/60">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">Date</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-foreground">Amount (PKR)</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">Method</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">Note</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customerPayments.map((p) => (
                  <TableRow key={p._id || p.id} className="border-border transition-colors hover:bg-accent/40">
                    <TableCell className="whitespace-nowrap text-sm font-medium text-foreground">{p.date}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-foreground">{fmtPKR(p.amount)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.method}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.note || "—"}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" aria-label="Open menu">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-[160px]">
                          <DropdownMenuItem onClick={() => setEditCustomerPaymentId(p._id || p.id)} className="cursor-pointer font-medium text-[color:var(--sre-blue)] focus:text-[color:var(--sre-blue)]">
                            <Pencil className="mr-2 h-4 w-4" /> Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteCustomerPayment(p._id || p.id)} className="cursor-pointer font-medium text-destructive focus:bg-destructive/10 focus:text-destructive">
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {customerPayments.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                      No customer payments recorded yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* MATERIAL LEDGER */}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">Material Ledger</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                Every material procurement — with date, vendor and quantity
              </p>
            </div>
            <AddRecordDialog
              trigger={
                <Button size="sm" className="gap-1.5 bg-[color:var(--sre-blue)] text-primary-foreground hover:bg-[color:var(--sre-blue)]/90">
                  <Plus className="h-4 w-4" /> Add Procurement
                </Button>
              }
              title="Add Procurement Entry"
              description="Log a material purchase against this project."
              submitLabel="Add Entry"
              defaults={{ date: today(), item: "", category: "cement", quantity: 0, unit: "Bags", rate: 0, vendor: "", paid: 0 }}
              fields={(draft) => [
                { key: "date", label: "Date", type: "date", required: true },
                { key: "category", label: "Category", type: "select", options: MATERIAL_CATEGORY_OPTIONS, required: true, onChange: (val, setField) => {
                  const unitMap: Record<string, string> = { bricks: "Pcs", cement: "Bags", steel: "Kg", sand: "Trolly", crush: "ft" };
                  if (unitMap[val]) setField("unit", unitMap[val]);
                } },
                { key: "item", label: "Item", type: "text", required: true, placeholder: "e.g. Lucky Cement (OPC)" },
                { key: "vendor", label: "Vendor / Supplier", type: "text", required: true, placeholder: "e.g. Bilal Traders" },
                ...(draft.category === 'other' ? [] : [
                  { key: "quantity", label: "Quantity", type: "number", required: true },
                  { key: "unit", label: "Unit", type: "text", required: true, placeholder: "Bags / Pcs / Tons / Trolly / Days" },
                  { key: "rate", label: "Rate per Unit (PKR)", type: "number", required: true }
                ] as const),
                { key: "paid", label: draft.category === 'other' ? "Total Amount Paid (PKR)" : "Paid to Vendor (PKR)", type: "number", required: true },
              ]}
              onSubmit={(v) => {
                const isOther = v.category === 'other';
                api.addProcurement({ 
                  project: project._id, 
                  date: String(v.date), 
                  item: String(v.item), 
                  category: v.category as any, 
                  quantity: isOther ? 0 : (Number(v.quantity) || 0), 
                  unit: isOther ? "Lump Sum" : String(v.unit), 
                  rate: isOther ? 0 : (Number(v.rate) || 0), 
                  vendor: String(v.vendor), 
                  paid: Number(v.paid) || 0 
                }).then(() => { queryClient.invalidateQueries({ queryKey: ["procurements"] }); toast.success("Procurement added"); }).catch(e => toast.error(e.message))
              }}
            />
          </div>
          <div className="border-b border-border px-6 py-3">
            <Tabs value={materialTab} onValueChange={setMaterialTab}>
              <TabsList className="flex h-auto flex-wrap gap-1 bg-secondary/60 p-1">
                {MATERIAL_TABS.map((t) => (
                  <TabsTrigger
                    key={t.id}
                    value={t.id}
                    className="data-[state=active]:bg-card data-[state=active]:text-[color:var(--sre-blue)] data-[state=active]:shadow-sm text-xs font-medium"
                  >
                    {t.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/60 hover:bg-secondary/60">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">Date</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">Item</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">Vendor</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-foreground">Quantity</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">Unit</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-foreground">Rate (PKR)</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-foreground">Total (PKR)</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-foreground">Paid to Vendor</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-foreground">Balance</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(() => {
                  let entries: Array<{ type: 'procurement'; data: any } | { type: 'contractor_payment'; data: any }> = [];
                  filteredMaterial.forEach((row: any) => entries.push({ type: 'procurement', data: row }));
                  if (materialTab === "all") {
                    contractorPayments.forEach((p: any) => entries.push({ type: 'contractor_payment', data: p }));
                  }
                  
                  // Sort chronologically (ascending)
                  entries.sort((a, b) => new Date(a.data.date).getTime() - new Date(b.data.date).getTime());

                  if (entries.length === 0) {
                    return (
                      <TableRow>
                        <TableCell colSpan={10} className="py-10 text-center text-sm text-muted-foreground">
                          No entries found in this category yet.
                        </TableCell>
                      </TableRow>
                    );
                  }

                  return entries.map((entry) => {
                    if (entry.type === 'procurement') {
                      const row = entry.data;
                      return (
                        <TableRow key={`proc-${row.id || row._id}`} className="border-border transition-colors hover:bg-accent/40">
                          <TableCell className="whitespace-nowrap text-sm font-medium text-foreground">{row.date}</TableCell>
                          <TableCell className="font-medium text-foreground">{row.item}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{row.vendor}</TableCell>
                          <TableCell className="text-right tabular-nums font-semibold text-foreground">{fmtPKR(row.quantity)}</TableCell>
                          <TableCell className="text-muted-foreground">{row.unit}</TableCell>
                          <TableCell className="text-right tabular-nums text-foreground">{fmtPKR(row.rate)}</TableCell>
                          <TableCell className="text-right tabular-nums font-semibold text-foreground">{fmtPKR(getProcurementTotal(row))}</TableCell>
                          <TableCell className="text-right tabular-nums font-semibold text-emerald-700">{fmtPKR(row.paid)}</TableCell>
                          <TableCell className="text-right tabular-nums font-semibold text-foreground">{fmtPKR(Math.max(0, getProcurementTotal(row) - row.paid))}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" aria-label="Open menu">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-[160px]">
                                <DropdownMenuItem onClick={() => setEditProcurementId(row.id || row._id)} className="cursor-pointer font-medium text-[color:var(--sre-blue)] focus:text-[color:var(--sre-blue)]">
                                  <Pencil className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteProcurement(row.id || row._id)} className="cursor-pointer font-medium text-destructive focus:bg-destructive/10 focus:text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    } else {
                      const p = entry.data;
                      const pContractor = p.contractorId || p.contractor;
                      const c = contractors.find((x: any) => x._id === pContractor || x.id === pContractor);
                      if (!c) return null;
                      
                      const paymentsForThisContractor = contractorPayments.filter(
                        (x: any) => (x.contractorId || x.contractor) === pContractor
                      );
                      const pIndex = paymentsForThisContractor.findIndex((x: any) => (x._id || x.id) === (p._id || p.id));
                      const paidUpToThis = paymentsForThisContractor
                        .slice(0, pIndex + 1)
                        .reduce((sum: any, x: any) => sum + x.amount, 0);

                      return (
                        <TableRow key={`cp-${p._id || p.id}`} className="border-border bg-[color:var(--sre-blue)]/5 hover:bg-[color:var(--sre-blue)]/10">
                          <TableCell className="whitespace-nowrap text-sm font-medium text-foreground">{p.date}</TableCell>
                          <TableCell>
                            <div className="font-medium text-foreground">Payment to {c.name}</div>
                            <div className="text-[11px] text-[color:var(--sre-blue)]">Contractor · {c.role}</div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{p.method}</TableCell>
                          <TableCell className="text-right text-muted-foreground">—</TableCell>
                          <TableCell className="text-muted-foreground">—</TableCell>
                          <TableCell className="text-right text-muted-foreground">—</TableCell>
                          <TableCell className="text-right tabular-nums font-semibold text-foreground">{fmtPKR(c.agreedAmount)}</TableCell>
                          <TableCell className="text-right tabular-nums font-semibold text-emerald-700">{fmtPKR(p.amount)}</TableCell>
                          <TableCell className="text-right tabular-nums font-semibold text-foreground">{fmtPKR(Math.max(0, c.agreedAmount - paidUpToThis))}</TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" aria-label="Open menu">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-[160px]">
                                <DropdownMenuItem onClick={() => setEditContractorPaymentId(p._id || p.id)} className="cursor-pointer font-medium text-[color:var(--sre-blue)] focus:text-[color:var(--sre-blue)]">
                                  <Pencil className="mr-2 h-4 w-4" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteContractorPayment(p._id || p.id)} className="cursor-pointer font-medium text-destructive focus:bg-destructive/10 focus:text-destructive">
                                  <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    }
                  });
                })()}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-secondary/40 px-6 py-3 text-sm">
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="text-muted-foreground">
                {filteredMaterial.length} entries{materialTab !== "all" && ` · filtered`}
                {materialTab === "all" && ` · ${contractors.length} contractors`}
              </span>
              {Object.keys(qtyByItem).length > 0 && (
                <>
                  <span className="text-muted-foreground">·</span>
                  <span className="text-foreground">
                    <span className="text-muted-foreground">Total Qty:</span>{" "}
                    {Object.entries(qtyByItem)
                      .map(([k, v]) => `${fmtPKR(v.qty)} ${v.unit} ${k.replace(` (${v.unit})`, "")}`)
                      .join(" · ")}
                  </span>
                </>
              )}
            </div>
            <span className="font-semibold text-foreground">
              {materialTab === "all" ? "Grand total (Materials + Contractors)" : "Subtotal"}: PKR {fmtPKR(materialTab === "all" ? totalSpent + contractorsTotal : filteredTotal)}
              <span className="ml-3 font-normal text-muted-foreground">
                (Paid <span className="font-semibold text-emerald-700">PKR {fmtPKR(materialTab === "all" ? materialPaidTotal + contractorsPaid : filteredPaid)}</span>)
              </span>
              <span className="ml-3 font-normal text-muted-foreground">
                | <span className="font-semibold text-rose-600">Balance: PKR {fmtPKR(materialTab === "all" ? (totalSpent + contractorsTotal) - (materialPaidTotal + contractorsPaid) : filteredTotal - filteredPaid)}</span>
              </span>
            </span>
          </div>
        </div>

        {/* CONTRACTORS */}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-[color:var(--sre-blue)]/10 p-2 text-[color:var(--sre-blue)]">
                <HardHat className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Contractors &amp; Trades</h3>
                <p className="text-xs text-muted-foreground">
                  Manage each trade separately. Log payments with dates against the agreed amount.
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <AddRecordDialog
                trigger={
                  <Button size="sm" variant="outline" className="gap-1.5">
                    <Plus className="h-4 w-4" /> Add Contractor
                  </Button>
                }
                title="Add Contractor"
                description="Assign a trade contractor with an agreed amount."
                submitLabel="Add Contractor"
                defaults={{ role: contractorTab, name: "", contact: "", agreedAmount: 0, status: "Active" }}
                fields={[
                  { key: "role", label: "Role / Trade", type: "select", options: CONTRACTOR_ROLES, required: true },
                  { key: "status", label: "Status", type: "select", options: ["Active", "On hold", "Completed"] as const, required: true },
                  { key: "name", label: "Contractor Name", type: "text", required: true },
                  { key: "contact", label: "Contact Number", type: "tel", required: true },
                  { key: "agreedAmount", label: "Agreed Amount (PKR)", type: "number", required: true },
                ]}
                onSubmit={(v) =>
                  api.addContractor({ project: project._id, role: v.role, name: String(v.name), contact: String(v.contact), agreedAmount: Number(v.agreedAmount) || 0, status: v.status }).then(() => { queryClient.invalidateQueries({ queryKey: ["contractors"] }); toast.success("Contractor added"); }).catch(e => toast.error(e.message))
                }
              />
            </div>
          </div>

          <div className="border-b border-border px-6 py-3">
            <Tabs value={contractorTab} onValueChange={setContractorTab}>
              <TabsList className="flex h-auto flex-wrap gap-1 bg-secondary/60 p-1">
                {CONTRACTOR_ROLES.map((r) => {
                  const count = contractors.filter((c) => c.role === r).length;
                  return (
                    <TabsTrigger
                      key={r}
                      value={r}
                      className="data-[state=active]:bg-card data-[state=active]:text-[color:var(--sre-blue)] data-[state=active]:shadow-sm text-xs font-medium"
                    >
                      {r}
                      <span className="ml-1.5 rounded-full bg-foreground/10 px-1.5 py-0.5 text-[10px] font-semibold">
                        {count}
                      </span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
            </Tabs>
          </div>

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/60 hover:bg-secondary/60">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">Name</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">Contact</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-foreground">Agreed (PKR)</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-foreground">Paid (PKR)</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-foreground">Remaining (PKR)</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">Status</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contractorsInTab.map((c) => {
                  const paid = paidByContractor(c._id || c.id);
                  return (
                    <TableRow key={c.id} className="border-border transition-colors hover:bg-accent/40">
                      <TableCell className="font-medium text-foreground">{c.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        <span className="inline-flex items-center gap-1.5">
                          <Phone className="h-3.5 w-3.5" /> {c.contact}
                        </span>
                      </TableCell>
                      <TableCell className="text-right tabular-nums text-foreground">{fmtPKR(c.agreedAmount)}</TableCell>
                      <TableCell className="text-right tabular-nums text-foreground">{fmtPKR(paid)}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold text-foreground">{fmtPKR(Math.max(0, c.agreedAmount - paid))}</TableCell>
                      <TableCell><ContractorStatusBadge status={c.status} /></TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <AddRecordDialog
                            trigger={
                              <Button variant="ghost" size="sm" className="h-8 gap-1 text-[color:var(--sre-blue)] hover:bg-[color:var(--sre-blue)]/10">
                                <Plus className="h-3.5 w-3.5" /> Payment
                              </Button>
                            }
                            title={`Record Payment — ${c.name}`}
                            description={`Agreed PKR ${fmtPKR(c.agreedAmount)} · Already paid PKR ${fmtPKR(paid)}`}
                            submitLabel="Record Payment"
                            defaults={{ date: today(), amount: 0, note: "" }}
                            fields={[
                              { key: "date", label: "Payment Date", type: "date", required: true },
                              { key: "amount", label: "Amount (PKR)", type: "number", required: true },
                              { key: "note", label: "Note (optional)", type: "text", placeholder: "e.g. Slab milestone" },
                            ]}
                            onSubmit={(v) =>
                              api.addContractorPayment({ contractor: c._id || c.id, project: project._id, date: String(v.date), amount: Number(v.amount) || 0, note: String(v.note ?? "") }).then(() => { queryClient.invalidateQueries({ queryKey: ["payments"] }); toast.success("Payment recorded"); }).catch(e => toast.error(e.message))
                            }
                          />
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" aria-label="Open menu">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-[160px]">
                              <DropdownMenuItem onClick={() => setEditContractorId(c.id || c._id)} className="cursor-pointer font-medium text-[color:var(--sre-blue)] focus:text-[color:var(--sre-blue)]">
                                <Pencil className="mr-2 h-4 w-4" /> Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleDeleteContractor(c.id || c._id)} className="cursor-pointer font-medium text-destructive focus:bg-destructive/10 focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {contractorsInTab.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="py-10 text-center text-sm text-muted-foreground">
                      No {contractorTab.toLowerCase()} added yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>

          {/* Payment history for this trade */}
          {contractorsInTab.length > 0 && (
            <div className="border-t border-border">
              <div className="border-b border-border bg-secondary/30 px-6 py-2.5">
                <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Payment History — {contractorTab}
                </h4>
              </div>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-secondary/40 hover:bg-secondary/40">
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">Date</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">Contractor</TableHead>
                      <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-foreground">Amount (PKR)</TableHead>
                      <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">Note</TableHead>
                      <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-foreground">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contractorPayments
                      .filter((p) => contractorsInTab.some((c) => (c._id || c.id) === (p.contractorId || p.contractor)))
                      .map((p) => {
                        const pContractor = p.contractorId || p.contractor;
                        const c = contractors.find((x) => (x._id || x.id) === pContractor);
                        return (
                          <TableRow key={p.id} className="border-border">
                            <TableCell className="whitespace-nowrap text-sm font-medium text-foreground">{p.date}</TableCell>
                            <TableCell className="text-sm text-foreground">{c?.name ?? "—"}</TableCell>
                            <TableCell className="text-right tabular-nums font-semibold text-foreground">{fmtPKR(p.amount)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{p.note || "—"}</TableCell>
                            <TableCell className="text-right">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-foreground" aria-label="Open menu">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-[160px]">
                                  <DropdownMenuItem onClick={() => setEditContractorPaymentId(p._id || p.id)} className="cursor-pointer font-medium text-[color:var(--sre-blue)] focus:text-[color:var(--sre-blue)]">
                                    <Pencil className="mr-2 h-4 w-4" /> Edit
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteContractorPayment(p._id || p.id)} className="cursor-pointer font-medium text-destructive focus:bg-destructive/10 focus:text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    {contractorPayments.filter((p) => contractorsInTab.some((c) => (c._id || c.id) === (p.contractorId || p.contractor))).length === 0 && (
                      <TableRow>
                        <TableCell colSpan={5} className="py-8 text-center text-sm text-muted-foreground">
                          No payments recorded for this trade yet.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-secondary/40 px-6 py-3 text-sm">
            <span className="text-muted-foreground">{contractors.length} contractors total</span>
            <span className="font-semibold text-foreground">
              Total PKR {fmtPKR(contractorsTotal)}
              <span className="ml-3 font-normal text-muted-foreground">
                (Paid <span className="font-semibold text-emerald-700">PKR {fmtPKR(contractorsPaid)}</span>)
              </span>
              <span className="ml-3 font-normal text-muted-foreground">
                | <span className="font-semibold text-rose-600">Balance: PKR {fmtPKR(contractorsTotal - contractorsPaid)}</span>
              </span>
            </span>
          </div>
        </div>
      </div>

      {/* EDIT DIALOGS */}
      <EditRecordDialog
        open={editProcurementId !== null}
        onOpenChange={(v) => !v && setEditProcurementId(null)}
        title="Edit Procurement Entry"
        fields={(draft) => [
          { key: "date", label: "Date", type: "date", required: true },
          { key: "category", label: "Category", type: "select", options: MATERIAL_CATEGORY_OPTIONS, required: true, onChange: (val, setField) => {
            const unitMap: Record<string, string> = { bricks: "Pcs", cement: "Bags", steel: "Kg", sand: "Trolly", crush: "ft" };
            if (unitMap[val]) setField("unit", unitMap[val]);
          } },
          { key: "item", label: "Item", type: "text", required: true },
          { key: "vendor", label: "Vendor", type: "text", required: true },
          ...(draft.category === 'other' ? [] : [
            { key: "quantity", label: "Quantity", type: "number", required: true },
            { key: "unit", label: "Unit", type: "text", required: true },
            { key: "rate", label: "Rate", type: "number", required: true }
          ] as const),
          { key: "paid", label: draft.category === 'other' ? "Total Amount Paid (PKR)" : "Paid", type: "number", required: true },
        ]}
        values={
          editProcurementId
            ? (() => {
                const record = procurement.find((r: any) => (r.id || r._id) === editProcurementId);
                if (!record) return null;
                return { ...record };
              })()
            : null
        }
        onSave={(v) => {
          const isOther = v.category === 'other';
          api.updateProcurement(editProcurementId!, { 
            date: String(v.date), 
            item: String(v.item), 
            category: v.category as any, 
            quantity: isOther ? 0 : Number(v.quantity), 
            unit: isOther ? "Lump Sum" : String(v.unit), 
            rate: isOther ? 0 : Number(v.rate), 
            vendor: String(v.vendor), 
            paid: Number(v.paid) 
          }).then(() => {
            queryClient.invalidateQueries({ queryKey: ["procurements"] });
            toast.success("Procurement updated");
            setEditProcurementId(null);
          }).catch(e => toast.error(e.message));
        }}
      />

      <EditRecordDialog
        open={editContractorId !== null}
        onOpenChange={(v) => !v && setEditContractorId(null)}
        title="Edit Contractor"
        fields={[
          { key: "role", label: "Role", type: "select", options: CONTRACTOR_ROLES, required: true },
          { key: "name", label: "Name", type: "text", required: true },
          { key: "contact", label: "Contact", type: "tel", required: true },
          { key: "status", label: "Status", type: "select", options: ["Active", "Completed", "On hold"] as const, required: true },
          { key: "agreedAmount", label: "Agreed (PKR)", type: "number", required: true },
        ]}
        values={
          editContractorId
            ? (contractors.find((c) => c.id === editContractorId || c._id === editContractorId) as unknown as EditValues) ?? null
            : null
        }
        onSave={(next) => {
          if (!editContractorId) return;
          api.updateContractor(editContractorId, next).then(() => { queryClient.invalidateQueries({ queryKey: ["contractors"] }); setEditContractorId(null); toast.success("Updated"); }).catch(e => toast.error(e.message));
        }}
      />

      <EditRecordDialog
        open={editContractorPaymentId !== null}
        onOpenChange={(v) => !v && setEditContractorPaymentId(null)}
        title="Edit Contractor Payment"
        fields={[
          { key: "date", label: "Date", type: "date", required: true },
          { key: "amount", label: "Amount (PKR)", type: "number", required: true },
          { key: "note", label: "Note", type: "text" },
        ]}
        values={
          editContractorPaymentId
            ? (contractorPayments.find((p) => p.id === editContractorPaymentId || p._id === editContractorPaymentId) as unknown as EditValues) ?? null
            : null
        }
        onSave={(next) => {
          if (!editContractorPaymentId) return;
          api.updateContractorPayment(editContractorPaymentId, next).then(() => { queryClient.invalidateQueries({ queryKey: ["payments"] }); setEditContractorPaymentId(null); toast.success("Updated"); }).catch(e => toast.error(e.message));
        }}
      />

      <EditRecordDialog
        open={editCustomerPaymentId !== null}
        onOpenChange={(v) => !v && setEditCustomerPaymentId(null)}
        title="Edit Customer Payment"
        fields={[
          { key: "date", label: "Date", type: "date", required: true },
          { key: "amount", label: "Amount (PKR)", type: "number", required: true },
          { key: "method", label: "Method", type: "select", options: ["Cash", "Bank Transfer", "Cheque"] as const, required: true },
          { key: "note", label: "Note", type: "text" },
        ]}
        values={
          editCustomerPaymentId
            ? (customerPayments.find((p) => p.id === editCustomerPaymentId || p._id === editCustomerPaymentId) as unknown as EditValues) ?? null
            : null
        }
        onSave={(next) => {
          if (!editCustomerPaymentId) return;
          api.updateCustomerPayment(editCustomerPaymentId, next).then(() => { queryClient.invalidateQueries({ queryKey: ["payments"] }); setEditCustomerPaymentId(null); toast.success("Updated"); }).catch(e => toast.error(e.message));
        }}
      />
    </AppShell>
  );
}