import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import {
  ArrowLeft,
  CheckCircle2,
  CircleDot,
  Clock3,
  FileDown,
  Layers,
  Plus,
  Pencil,
  Wallet,
  HardHat,
  Phone,
  Users,
  ArrowUpRight,
} from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
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
import { fmtPKR, projects } from "@/lib/projects-data";
import { AddRecordDialog } from "@/components/dialogs/add-record-dialog";
import { EditRecordDialog, type EditValues } from "@/components/dialogs/edit-record-dialog";
import {
  useFinance,
  financeActions,
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
  { id: "sandcrush", label: "Sand & Crush" },
  { id: "labour", label: "Labour" },
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
  const { project } = Route.useLoaderData();
  const store = useFinance();
  const procurement = store.procurements.filter((p) => p.projectId === project.id);
  const contractors = store.contractors.filter((c) => c.projectId === project.id);
  const contractorIds = new Set(contractors.map((c) => c.id));
  const contractorPayments = store.contractorPayments.filter((p) => contractorIds.has(p.contractorId));
  const customerPayments = store.customerPayments.filter((p) => p.projectId === project.id);

  const [materialTab, setMaterialTab] = useState<string>("all");
  const [contractorTab, setContractorTab] = useState<string>(CONTRACTOR_ROLES[0]);
  const [editProcurementId, setEditProcurementId] = useState<string | null>(null);
  const [editContractorId, setEditContractorId] = useState<string | null>(null);
  const [editContractorPaymentId, setEditContractorPaymentId] = useState<string | null>(null);
  const [editCustomerPaymentId, setEditCustomerPaymentId] = useState<string | null>(null);
  const [markedComplete, setMarkedComplete] = useState(false);

  const contractPrice = project.budget;
  const customerReceived = customerPayments.reduce((s, p) => s + p.amount, 0);
  const customerBalance = Math.max(0, contractPrice - customerReceived);

  const totalSpent = procurement.reduce((s, r) => s + r.quantity * r.rate, 0);
  const filteredMaterial = materialTab === "all" ? procurement : procurement.filter((r) => r.category === materialTab);
  const filteredTotal = filteredMaterial.reduce((s, r) => s + r.quantity * r.rate, 0);
  const qtyByItem = filteredMaterial.reduce<Record<string, { qty: number; unit: string }>>((acc, r) => {
    const key = `${r.item} (${r.unit})`;
    acc[key] = acc[key] ?? { qty: 0, unit: r.unit };
    acc[key].qty += r.quantity;
    return acc;
  }, {});

  const paidByContractor = (id: string) =>
    contractorPayments.filter((p) => p.contractorId === id).reduce((s, p) => s + p.amount, 0);

  const contractorsInTab = contractors.filter((c) => c.role === contractorTab);
  const contractorsTotal = contractors.reduce((s, c) => s + c.agreedAmount, 0);
  const contractorsPaid = contractors.reduce((s, c) => s + paidByContractor(c.id), 0);

  const materialPaidTotal = procurement.reduce((s, r) => s + (r.paid || 0), 0);
  const filteredPaid = filteredMaterial.reduce((s, r) => s + (r.paid || 0), 0);

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
      ...contractors.map((c) => {
        const paid = paidByContractor(c.id);
        return [c.role, c.name, c.contact, c.status, c.agreedAmount, paid, Math.max(0, c.agreedAmount - paid)];
      }),
      [],
      ["Payment Date", "Contractor", "Role", "Amount (PKR)", "Note"],
      ...contractorPayments.map((p) => {
        const c = contractors.find((x) => x.id === p.contractorId);
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
      ok: contractors.every((c) => paidByContractor(c.id) >= c.agreedAmount),
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="gap-1.5">
                    <FileDown className="h-4 w-4" /> Download Report
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>Choose report</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => downloadMaterialsCSV()}>
                    Materials &amp; Labour (CSV)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => downloadContractorsCSV()}>
                    Contractors &amp; Payments (CSV)
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => downloadCustomerCSV()}>
                    Customer Payments (CSV)
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {!markedComplete ? (
                <Button
                  onClick={() => setMarkedComplete(true)}
                  className="gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-4 w-4" /> Mark as Complete
                </Button>
              ) : (
                <Button disabled variant="outline" className="gap-1.5 border-emerald-200 bg-emerald-50 text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" /> Completed
                </Button>
              )}
            </div>
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
                financeActions.addCustomerPayment({
                  projectId: project.id,
                  date: String(v.date),
                  amount: Number(v.amount) || 0,
                  method: v.method as CustomerPayment["method"],
                  note: String(v.note ?? ""),
                })
              }
            />
          </div>
          <div className="grid grid-cols-2 gap-4 border-b border-border bg-secondary/30 px-6 py-4 md:grid-cols-4">
            <StatTile icon={<Layers className="h-4 w-4" />} label="Contract price" value={`PKR ${fmtPKR(contractPrice)}`} />
            <StatTile icon={<ArrowUpRight className="h-4 w-4" />} label="Received to date" value={`PKR ${fmtPKR(customerReceived)}`} />
            <StatTile icon={<Wallet className="h-4 w-4" />} label="Balance due" value={`PKR ${fmtPKR(customerBalance)}`} />
            <StatTile icon={<CheckCircle2 className="h-4 w-4" />} label="% Received" value={`${((customerReceived / contractPrice) * 100).toFixed(1)}%`} />
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
                  <TableRow key={p.id} className="border-border transition-colors hover:bg-accent/40">
                    <TableCell className="whitespace-nowrap text-sm font-medium text-foreground">{p.date}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-foreground">{fmtPKR(p.amount)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.method}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{p.note || "—"}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-[color:var(--sre-blue)]" aria-label="Edit payment" onClick={() => setEditCustomerPaymentId(p.id)}>
                        <Pencil className="h-4 w-4" />
                      </Button>
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
              <h3 className="text-base font-semibold text-foreground">Material &amp; Labour Ledger</h3>
              <p className="text-xs text-muted-foreground">
                Every material &amp; labour procurement — with date, vendor and quantity
              </p>
            </div>
            <AddRecordDialog
              trigger={
                <Button size="sm" className="gap-1.5 bg-[color:var(--sre-blue)] text-primary-foreground hover:bg-[color:var(--sre-blue)]/90">
                  <Plus className="h-4 w-4" /> Add Procurement
                </Button>
              }
              title="Add Procurement Entry"
              description="Log a material or labour purchase against this project."
              submitLabel="Add Entry"
              defaults={{ date: today(), item: "", category: "cement", quantity: 0, unit: "Bags", rate: 0, vendor: "", paid: 0 }}
              fields={[
                { key: "date", label: "Date", type: "date", required: true },
                { key: "category", label: "Category", type: "select", options: MATERIAL_CATEGORY_OPTIONS, required: true },
                { key: "item", label: "Item", type: "text", required: true, placeholder: "e.g. Lucky Cement (OPC)" },
                { key: "vendor", label: "Vendor / Supplier", type: "text", required: true, placeholder: "e.g. Bilal Traders" },
                { key: "quantity", label: "Quantity", type: "number", required: true },
                { key: "unit", label: "Unit", type: "text", required: true, placeholder: "Bags / Pcs / Tons / Trolly / Days" },
                { key: "rate", label: "Rate per Unit (PKR)", type: "number", required: true },
                { key: "paid", label: "Paid to Vendor (PKR)", type: "number", required: true },
              ]}
              onSubmit={(v) =>
                financeActions.addProcurement({
                  projectId: project.id,
                  date: String(v.date),
                  item: String(v.item),
                  category: v.category as MaterialCategory,
                  quantity: Number(v.quantity) || 0,
                  unit: String(v.unit),
                  rate: Number(v.rate) || 0,
                  vendor: String(v.vendor),
                  paid: Number(v.paid) || 0,
                })
              }
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
                {filteredMaterial.map((row) => {
                  return (
                    <TableRow key={row.id} className="border-border transition-colors hover:bg-accent/40">
                      <TableCell className="whitespace-nowrap text-sm font-medium text-foreground">{row.date}</TableCell>
                      <TableCell className="font-medium text-foreground">{row.item}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{row.vendor}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold text-foreground">{fmtPKR(row.quantity)}</TableCell>
                      <TableCell className="text-muted-foreground">{row.unit}</TableCell>
                      <TableCell className="text-right tabular-nums text-foreground">{fmtPKR(row.rate)}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold text-foreground">{fmtPKR(row.quantity * row.rate)}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold text-emerald-700">{fmtPKR(row.paid)}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold text-foreground">{fmtPKR(Math.max(0, row.quantity * row.rate - row.paid))}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-[color:var(--sre-blue)]" aria-label="Edit entry" onClick={() => setEditProcurementId(row.id)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {materialTab === "all" && contractors.map((c) => {
                  const paid = paidByContractor(c.id);
                  return (
                    <TableRow key={`ov-${c.id}`} className="border-border bg-[color:var(--sre-blue)]/5 hover:bg-[color:var(--sre-blue)]/10">
                      <TableCell className="text-sm text-muted-foreground">—</TableCell>
                      <TableCell>
                        <div className="font-medium text-foreground">{c.name}</div>
                        <div className="text-[11px] text-[color:var(--sre-blue)]">Contractor · {c.role}</div>
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">{c.contact}</TableCell>
                      <TableCell className="text-right text-muted-foreground">—</TableCell>
                      <TableCell className="text-muted-foreground">—</TableCell>
                      <TableCell className="text-right text-muted-foreground">—</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold text-foreground">{fmtPKR(c.agreedAmount)}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold text-emerald-700">{fmtPKR(paid)}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold text-foreground">{fmtPKR(Math.max(0, c.agreedAmount - paid))}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-[color:var(--sre-blue)]" aria-label="Edit contractor" onClick={() => setEditContractorId(c.id)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {filteredMaterial.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="py-10 text-center text-sm text-muted-foreground">
                      No procurement entries in this category yet.
                    </TableCell>
                  </TableRow>
                )}
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
                  financeActions.addContractor({
                    projectId: project.id,
                    role: v.role as ContractorRole,
                    name: String(v.name),
                    contact: String(v.contact),
                    agreedAmount: Number(v.agreedAmount) || 0,
                    status: v.status as Contractor["status"],
                  })
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
                  const paid = paidByContractor(c.id);
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
                              financeActions.addContractorPayment({
                                contractorId: c.id,
                                date: String(v.date),
                                amount: Number(v.amount) || 0,
                                note: String(v.note ?? ""),
                              })
                            }
                          />
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-[color:var(--sre-blue)]" aria-label="Edit contractor" onClick={() => setEditContractorId(c.id)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
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
                      .filter((p) => contractorsInTab.some((c) => c.id === p.contractorId))
                      .map((p) => {
                        const c = contractors.find((x) => x.id === p.contractorId);
                        return (
                          <TableRow key={p.id} className="border-border">
                            <TableCell className="whitespace-nowrap text-sm font-medium text-foreground">{p.date}</TableCell>
                            <TableCell className="text-sm text-foreground">{c?.name ?? "—"}</TableCell>
                            <TableCell className="text-right tabular-nums font-semibold text-foreground">{fmtPKR(p.amount)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{p.note || "—"}</TableCell>
                            <TableCell className="text-right">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-[color:var(--sre-blue)]" aria-label="Edit payment" onClick={() => setEditContractorPaymentId(p.id)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    {contractorPayments.filter((p) => contractorsInTab.some((c) => c.id === p.contractorId)).length === 0 && (
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
              Paid PKR {fmtPKR(contractorsPaid)} / {fmtPKR(contractorsTotal)}
              <span className="ml-2 font-normal text-muted-foreground">
                (Balance PKR {fmtPKR(contractorsTotal - contractorsPaid)})
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
        fields={[
          { key: "date", label: "Date", type: "date", required: true },
          { key: "category", label: "Category", type: "select", options: MATERIAL_CATEGORY_OPTIONS, required: true },
          { key: "item", label: "Item", type: "text", required: true },
          { key: "vendor", label: "Vendor", type: "text", required: true },
          { key: "quantity", label: "Quantity", type: "number", required: true },
          { key: "unit", label: "Unit", type: "text", required: true },
          { key: "rate", label: "Rate (PKR)", type: "number", required: true },
          { key: "paid", label: "Paid to Vendor (PKR)", type: "number", required: true },
        ]}
        values={
          editProcurementId
            ? (procurement.find((r) => r.id === editProcurementId) as unknown as EditValues) ?? null
            : null
        }
        onSave={(next) => {
          if (!editProcurementId) return;
          financeActions.updateProcurement(editProcurementId, next as unknown as Partial<Procurement>);
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
            ? (contractors.find((c) => c.id === editContractorId) as unknown as EditValues) ?? null
            : null
        }
        onSave={(next) => {
          if (!editContractorId) return;
          financeActions.updateContractor(editContractorId, next as unknown as Partial<Contractor>);
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
            ? (contractorPayments.find((p) => p.id === editContractorPaymentId) as unknown as EditValues) ?? null
            : null
        }
        onSave={(next) => {
          if (!editContractorPaymentId) return;
          financeActions.updateContractorPayment(editContractorPaymentId, next as unknown as Partial<ContractorPayment>);
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
            ? (customerPayments.find((p) => p.id === editCustomerPaymentId) as unknown as EditValues) ?? null
            : null
        }
        onSave={(next) => {
          if (!editCustomerPaymentId) return;
          financeActions.updateCustomerPayment(editCustomerPaymentId, next as unknown as Partial<CustomerPayment>);
        }}
      />
    </AppShell>
  );
}