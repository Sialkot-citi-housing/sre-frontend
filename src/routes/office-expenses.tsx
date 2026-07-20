import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import {
  Wallet,
  Plus,
  ArrowDownCircle,
  ArrowUpCircle,
  CalendarDays,
  Building2,
  Landmark,
  Loader2,
  MoreHorizontal,
  Pencil,
  Trash2,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api } from "@/lib/api";

import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fmtPKR } from "@/lib/projects-data";
import {
  today,
  MATERIAL_CATEGORY_OPTIONS,
  OFFICE_EXPENSE_CATEGORIES,
  PAYMENT_METHODS,
  type MaterialCategory,
  type OfficeExpenseCategory,
  type PaymentMethod,
} from "@/lib/finance-store";
import { AddRecordDialog } from "@/components/dialogs/add-record-dialog";
import { EditRecordDialog } from "@/components/dialogs/edit-record-dialog";

export const Route = createFileRoute("/office-expenses")({
  head: () => ({
    meta: [
      { title: "Office Cash & Expenses — SRE Construction Portal" },
      {
        name: "description",
        content:
          "Accountant cash book — funds received from owner and daily expenses (project-linked or office overhead).",
      },
    ],
  }),
  component: OfficeExpenses,
});

// ---- Unified expense row (from officeExpenses + procurement paid + contractor payments) ----
type Row = {
  id: string;
  date: string;
  project: string; // "Office" or project.plot
  type: "Material" | "Contractor" | "Office";
  description: string;
  detail: string;
  amount: number;
  editHref?: string;
};

function StatTile({
  icon,
  label,
  value,
  tone = "default",
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "default" | "positive" | "negative" | "balance";
}) {
  const toneCls =
    tone === "positive"
      ? "text-emerald-700"
      : tone === "negative"
      ? "text-[color:var(--sre-red)]"
      : tone === "balance"
      ? "text-[color:var(--sre-blue)]"
      : "text-foreground";
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className={`mt-1 text-lg font-bold tabular-nums ${toneCls}`}>{value}</div>
    </div>
  );
}

function AddFundDialog() {
  const queryClient = useQueryClient();

  const { mutate: addFund, isPending } = useMutation({
    mutationFn: api.addFund,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["funds"] });
      toast.success("Fund recorded successfully.");
    },
    onError: (e: any) => toast.error(e.message),
  });

  return (
    <AddRecordDialog
      trigger={
        <Button size="sm" variant="outline" className="gap-1.5" disabled={isPending}>
          {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />} Record Fund
        </Button>
      }
      title="Fund Received from Owner"
      description="Money handed to accountant to run day-to-day site & office spending."
      submitLabel="Record Fund"
      defaults={{ date: today(), amount: 0, method: "Bank Transfer", from: "Director (Owner)", note: "" }}
      fields={[
        { key: "date", label: "Date", type: "date", required: true },
        { key: "amount", label: "Amount (PKR)", type: "number", required: true },
        { key: "method", label: "Method", type: "select", options: ["Cash", "Bank Transfer", "Cheque"] as const, required: true },
        { key: "from", label: "Received From", type: "text", required: true },
        { key: "note", label: "Note", type: "text", placeholder: "e.g. Weekly float" },
      ]}
      onSubmit={(v) =>
        addFund({
          date: String(v.date),
          amount: Number(v.amount) || 0,
          method: v.method as "Cash" | "Bank Transfer" | "Cheque",
          from: String(v.from),
          note: String(v.note ?? ""),
        })
      }
    />
  );
}

function AddExpenseDialog({ projects, contractors }: { projects: any[]; contractors: any[] }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<"project" | "office">("project");
  const [projectId, setProjectId] = useState<string>(projects[0]?._id ?? "");
  const [spendType, setSpendType] = useState<"material" | "contractor">("material");

  const [date, setDate] = useState(today());
  // office fields
  const [officeCategory, setOfficeCategory] = useState<OfficeExpenseCategory>("Utilities");
  const [description, setDescription] = useState("");
  const [paidTo, setPaidTo] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [amount, setAmount] = useState<number>(0);
  // material fields
  const [matCategory, setMatCategory] = useState<MaterialCategory>("cement");
  const [item, setItem] = useState("");
  const [vendor, setVendor] = useState("");
  const [quantity, setQuantity] = useState<number>(0);
  const [unit, setUnit] = useState("Bags");
  const [rate, setRate] = useState<number>(0);
  const [paid, setPaid] = useState<number>(0);
  // contractor fields
  const [contractorId, setContractorId] = useState<string>("");
  const [note, setNote] = useState("");

  const projectContractors = contractors.filter((c) => c.project === projectId);
  const [isPending, setIsPending] = useState(false);

  const reset = () => {
    setDate(today());
    setDescription("");
    setPaidTo("");
    setAmount(0);
    setItem("");
    setVendor("");
    setQuantity(0);
    setUnit("Bags");
    setRate(0);
    setPaid(0);
    setContractorId("");
    setNote("");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      if (scope === "office") {
        await api.addOfficeExpense({
          date,
          category: officeCategory,
          description,
          paidTo,
          method,
          amount: Number(amount) || 0,
        });
        queryClient.invalidateQueries({ queryKey: ["officeExpenses"] });
      } else if (spendType === "material") {
        await api.addProcurement({
          project: projectId,
          date,
          item,
          category: matCategory,
          quantity: Number(quantity) || 0,
          unit,
          rate: Number(rate) || 0,
          vendor,
          paid: Number(paid) || 0,
        });
        queryClient.invalidateQueries({ queryKey: ["procurements"] });
      } else {
        if (!contractorId) return;
        await api.addContractorPayment({
          contractor: contractorId,
          project: projectId,
          date,
          amount: Number(amount) || 0,
          note,
        });
        queryClient.invalidateQueries({ queryKey: ["contractorPayments"] });
      }
      toast.success("Expense recorded successfully.");
      reset();
      setOpen(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to record expense");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 bg-[color:var(--sre-blue)] text-primary-foreground hover:bg-[color:var(--sre-blue)]/90">
          <Plus className="h-4 w-4" /> Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>Add Expense</DialogTitle>
          <DialogDescription>
            Project-linked expenses auto-append to that project's ledger. Others go to Office overhead.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5 py-2">
          <Tabs value={scope} onValueChange={(v) => setScope(v as "project" | "office")}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="project">Project-linked</TabsTrigger>
              <TabsTrigger value="office">Office / Overhead</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid gap-2">
            <Label>Date</Label>
            <Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </div>

          {scope === "project" ? (
            <>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Project</Label>
                  <Select value={projectId} onValueChange={setProjectId}>
                    <SelectTrigger><SelectValue placeholder="Select project" /></SelectTrigger>
                    <SelectContent>
                      {projects.map((p) => (
                        <SelectItem key={p._id} value={p._id}>{p.plot} — {p.client}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Spend Type</Label>
                  <Select value={spendType} onValueChange={(v) => setSpendType(v as "material" | "contractor")}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="material">Material</SelectItem>
                      <SelectItem value="contractor">Contractor Payment</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {spendType === "material" ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2">
                    <Label>Category</Label>
                    <Select value={matCategory} onValueChange={(v) => setMatCategory(v as MaterialCategory)}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {MATERIAL_CATEGORY_OPTIONS.map((c) => (
                          <SelectItem key={c} value={c}>{c}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Item</Label>
                    <Input required value={item} onChange={(e) => setItem(e.target.value)} placeholder="e.g. Lucky Cement" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Vendor</Label>
                    <Input required value={vendor} onChange={(e) => setVendor(e.target.value)} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Unit</Label>
                    <Input required value={unit} onChange={(e) => setUnit(e.target.value)} placeholder="Bags / Pcs / Tons" />
                  </div>
                  <div className="grid gap-2">
                    <Label>Quantity</Label>
                    <Input required type="number" step="any" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Rate / unit (PKR)</Label>
                    <Input required type="number" step="any" value={rate} onChange={(e) => setRate(Number(e.target.value))} />
                  </div>
                  <div className="grid gap-2 sm:col-span-2">
                    <Label>Paid to Vendor (PKR)</Label>
                    <Input required type="number" step="any" value={paid} onChange={(e) => setPaid(Number(e.target.value))} />
                  </div>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="grid gap-2 sm:col-span-2">
                    <Label>Contractor</Label>
                    <Select value={contractorId} onValueChange={setContractorId}>
                      <SelectTrigger><SelectValue placeholder="Select contractor" /></SelectTrigger>
                      <SelectContent>
                        {projectContractors.length === 0 && (
                          <SelectItem value="_none" disabled>No contractors on this project</SelectItem>
                        )}
                        {projectContractors.map((c) => (
                          <SelectItem key={c._id} value={c._id}>{c.role} — {c.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Amount (PKR)</Label>
                    <Input required type="number" step="any" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Note</Label>
                    <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Slab milestone" />
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <Label>Category</Label>
                <Select value={officeCategory} onValueChange={(v) => setOfficeCategory(v as OfficeExpenseCategory)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {OFFICE_EXPENSE_CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c}>{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Method</Label>
                <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {PAYMENT_METHODS.map((m) => (
                      <SelectItem key={m} value={m}>{m}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2 sm:col-span-2">
                <Label>Description</Label>
                <Textarea rows={2} required value={description} onChange={(e) => setDescription(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Paid To</Label>
                <Input required value={paidTo} onChange={(e) => setPaidTo(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Amount (PKR)</Label>
                <Input required type="number" step="any" value={amount} onChange={(e) => setAmount(Number(e.target.value))} />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)} disabled={isPending}>Cancel</Button>
            <Button type="submit" disabled={isPending} className="bg-[color:var(--sre-blue)] text-primary-foreground hover:bg-[color:var(--sre-blue)]/90">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Save Expense
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function OfficeExpenses() {
  useEffect(() => {
    document.title = "Office Expenses | Sialkot Real Estate";
  }, []);
  const [tab, setTab] = useState<"all" | "project" | "office">("all");
  const queryClient = useQueryClient();
  const [editOfficeExpenseId, setEditOfficeExpenseId] = useState<string | null>(null);
  const [editProcurementId, setEditProcurementId] = useState<string | null>(null);
  const [editPaymentId, setEditPaymentId] = useState<string | null>(null);

  const handleEdit = (id: string) => {
    if (id.startsWith('off-')) setEditOfficeExpenseId(id.slice(4));
    else if (id.startsWith('mat-')) setEditProcurementId(id.slice(4));
    else if (id.startsWith('con-')) setEditPaymentId(id.slice(4));
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    if (id.startsWith('off-')) {
      api.deleteOfficeExpense(id.slice(4)).then(() => { toast.success("Deleted"); queryClient.invalidateQueries({ queryKey: ["officeExpenses"] }); }).catch(e => toast.error(e.message));
    } else if (id.startsWith('mat-')) {
      api.deleteProcurement(id.slice(4)).then(() => { toast.success("Deleted"); queryClient.invalidateQueries({ queryKey: ["procurements"] }); }).catch(e => toast.error(e.message));
    } else if (id.startsWith('con-')) {
      api.deleteContractorPayment(id.slice(4)).then(() => { toast.success("Deleted"); queryClient.invalidateQueries({ queryKey: ["contractorPayments"] }); }).catch(e => toast.error(e.message));
    }
  };

  const { data: projects = [], isLoading: isLoadingProjects } = useQuery({ queryKey: ["projects"], queryFn: api.getProjects });
  const { data: contractors = [], isLoading: isLoadingContractors } = useQuery({ queryKey: ["contractors"], queryFn: api.getAllContractors });
  const { data: procurements = [], isLoading: isLoadingProcurements } = useQuery({ queryKey: ["procurements"], queryFn: api.getAllProcurements });
  const { data: contractorPayments = [], isLoading: isLoadingPayments } = useQuery({ queryKey: ["contractorPayments"], queryFn: api.getAllContractorPayments });
  const { data: funds = [], isLoading: isLoadingFunds } = useQuery({ queryKey: ["funds"], queryFn: api.getFunds });
  const { data: officeExpenses = [], isLoading: isLoadingOffice } = useQuery({ queryKey: ["officeExpenses"], queryFn: api.getOfficeExpenses });

  const isLoading = isLoadingProjects || isLoadingContractors || isLoadingProcurements || isLoadingPayments || isLoadingFunds || isLoadingOffice;

  const projectById = useMemo(
    () => Object.fromEntries(projects.map((p: any) => [p._id, p])),
    [projects],
  );
  const contractorById = useMemo(
    () => Object.fromEntries(contractors.map((c: any) => [c._id, c])),
    [contractors],
  );

  // Unified expense rows
  const rows: Row[] = useMemo(() => {
    const list: Row[] = [];
    procurements.forEach((p: any) => {
      if (!p.paid) return;
      list.push({
        id: `mat-${p._id}`,
        date: p.date,
        project: projectById[p.project]?.plot ?? "—",
        type: "Material",
        description: p.item,
        detail: `${p.quantity} ${p.unit} @ ${fmtPKR(p.rate)} · Vendor: ${p.vendor}`,
        amount: p.paid,
      });
    });
    contractorPayments.forEach((cp: any) => {
      const c = contractorById[cp.contractor];
      list.push({
        id: `con-${cp._id}`,
        date: cp.date,
        project: c ? projectById[c.project]?.plot ?? "—" : "—",
        type: "Contractor",
        description: c ? `${c.role} — ${c.name}` : "Contractor payment",
        detail: cp.note || "—",
        amount: cp.amount,
      });
    });
    officeExpenses.forEach((e: any) => {
      list.push({
        id: `off-${e._id}`,
        date: e.date,
        project: "Office",
        type: "Office",
        description: e.description,
        detail: `${e.category} · ${e.paidTo} · ${e.method}`,
        amount: e.amount,
      });
    });
    return list.sort((a, b) => (a.date < b.date ? 1 : -1));
  }, [procurements, contractorPayments, officeExpenses, projectById, contractorById]);

  const filtered = rows.filter((r) =>
    tab === "all" ? true : tab === "office" ? r.type === "Office" : r.type !== "Office",
  );

  const totalFunds = funds.reduce((s: number, f: any) => s + f.amount, 0);
  const totalSpent = rows.reduce((s, r) => s + r.amount, 0);
  const balance = totalFunds - totalSpent;
  const todayStr = today();
  const spentToday = rows.filter((r) => r.date === todayStr).reduce((s, r) => s + r.amount, 0);
  const filteredTotal = filtered.reduce((s, r) => s + r.amount, 0);

  if (isLoading) {
    return (
      <AppShell title="Office Cash & Expenses" subtitle="Accountant cash book — funds from owner and every rupee spent">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[color:var(--sre-blue)]" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Office Cash & Expenses"
      subtitle="Accountant cash book — funds from owner and every rupee spent"
    >
      <div className="space-y-6">
        {/* Cash-in-hand summary */}
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Accountant Cash Book
              </div>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                Cash in hand: <span className="text-[color:var(--sre-blue)]">PKR {fmtPKR(balance)}</span>
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Received PKR {fmtPKR(totalFunds)} from owner · Spent PKR {fmtPKR(totalSpent)} to date.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <AddFundDialog />
              <AddExpenseDialog projects={projects} contractors={contractors} />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatTile icon={<ArrowDownCircle className="h-4 w-4" />} label="Funds received" value={`PKR ${fmtPKR(totalFunds)}`} tone="positive" />
            <StatTile icon={<ArrowUpCircle className="h-4 w-4" />} label="Total spent" value={`PKR ${fmtPKR(totalSpent)}`} tone="negative" />
            <StatTile icon={<Wallet className="h-4 w-4" />} label="Balance in hand" value={`PKR ${fmtPKR(balance)}`} tone="balance" />
            <StatTile icon={<CalendarDays className="h-4 w-4" />} label="Spent today" value={`PKR ${fmtPKR(spentToday)}`} />
          </div>
        </div>

        {/* Funds table */}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex items-center justify-between gap-3 border-b border-border px-6 py-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-emerald-50 p-2 text-emerald-700">
                <Landmark className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Funds Received from Owner</h3>
                <p className="text-xs text-muted-foreground">Every top-up from the director to the accountant.</p>
              </div>
            </div>
            <AddFundDialog />
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/60 hover:bg-secondary/60">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">Date</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">From</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">Method</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">Note</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-foreground">Amount (PKR)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {funds.map((f: any) => (
                  <TableRow key={f._id} className="border-border">
                    <TableCell className="whitespace-nowrap text-sm font-medium text-foreground">{f.date}</TableCell>
                    <TableCell className="text-sm text-foreground">{f.from}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{f.method}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{f.note || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-emerald-700">{fmtPKR(f.amount)}</TableCell>
                  </TableRow>
                ))}
                {funds.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                      No funds recorded yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex justify-between border-t border-border bg-secondary/40 px-6 py-3 text-sm">
            <span className="text-muted-foreground">{funds.length} entries</span>
            <span className="font-semibold text-foreground">
              Total received: <span className="text-emerald-700">PKR {fmtPKR(totalFunds)}</span>
            </span>
          </div>
        </div>

        {/* Expenses table */}
        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
            <div className="flex items-start gap-3">
              <div className="rounded-lg bg-[color:var(--sre-red)]/10 p-2 text-[color:var(--sre-red)]">
                <Building2 className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-foreground">Expenses Log</h3>
                <p className="text-xs text-muted-foreground">
                  Project-linked expenses also appear on that project's ledger automatically.
                </p>
              </div>
            </div>
            <AddExpenseDialog projects={projects} contractors={contractors} />
          </div>
          <div className="border-b border-border px-6 py-3">
            <Tabs value={tab} onValueChange={(v) => setTab(v as typeof tab)}>
              <TabsList className="flex h-auto flex-wrap gap-1 bg-secondary/60 p-1">
                <TabsTrigger value="all" className="data-[state=active]:bg-card data-[state=active]:text-[color:var(--sre-blue)] data-[state=active]:shadow-sm text-xs font-medium">
                  All Expenses
                </TabsTrigger>
                <TabsTrigger value="project" className="data-[state=active]:bg-card data-[state=active]:text-[color:var(--sre-blue)] data-[state=active]:shadow-sm text-xs font-medium">
                  Project-linked
                </TabsTrigger>
                <TabsTrigger value="office" className="data-[state=active]:bg-card data-[state=active]:text-[color:var(--sre-blue)] data-[state=active]:shadow-sm text-xs font-medium">
                  Office Only
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/60 hover:bg-secondary/60">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">Date</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">Project</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">Type</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">Description</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">Detail</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-foreground">Amount (PKR)</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((r) => (
                  <TableRow key={r.id} className="border-border transition-colors hover:bg-accent/40">
                    <TableCell className="whitespace-nowrap text-sm font-medium text-foreground">{r.date}</TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${r.project === "Office" ? "bg-[color:var(--sre-red)]/10 text-[color:var(--sre-red)]" : "bg-[color:var(--sre-blue)]/10 text-[color:var(--sre-blue)]"}`}>
                        {r.project}
                      </span>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">{r.type}</TableCell>
                    <TableCell className="text-sm text-foreground">{r.description}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{r.detail}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-foreground">{fmtPKR(r.amount)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-secondary/80">
                            <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40 bg-card">
                          <DropdownMenuItem onClick={() => handleEdit(r.id)} className="cursor-pointer text-sm font-medium">
                            <Pencil className="mr-2 h-4 w-4 text-muted-foreground" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(r.id)} className="cursor-pointer text-sm font-medium text-[color:var(--sre-red)] focus:bg-[color:var(--sre-red)]/10 focus:text-[color:var(--sre-red)]">
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-10 text-center text-sm text-muted-foreground">
                      No expenses in this view.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-secondary/40 px-6 py-3 text-sm">
            <span className="text-muted-foreground">{filtered.length} entries</span>
            <span className="font-semibold text-foreground">
              {tab === "all" ? "Total" : "Subtotal"}: PKR {fmtPKR(filteredTotal)}
            </span>
          </div>
        </div>
      </div>
      
      {/* EDIT DIALOGS */}
      <EditRecordDialog
        open={editOfficeExpenseId !== null}
        onOpenChange={(v) => !v && setEditOfficeExpenseId(null)}
        title="Edit Office Expense"
        fields={[
          { key: "date", label: "Date", type: "date", required: true },
          { key: "category", label: "Category", type: "select", options: OFFICE_EXPENSE_CATEGORIES, required: true },
          { key: "description", label: "Description", type: "text", required: true },
          { key: "paidTo", label: "Paid To", type: "text", required: true },
          { key: "method", label: "Method", type: "select", options: PAYMENT_METHODS, required: true },
          { key: "amount", label: "Amount (PKR)", type: "number", required: true },
        ]}
        values={
          editOfficeExpenseId
            ? (() => {
                const record = officeExpenses.find((r: any) => (r.id || r._id) === editOfficeExpenseId);
                if (!record) return null;
                return { ...record };
              })()
            : null
        }
        onSave={(v) => {
          api.updateOfficeExpense(editOfficeExpenseId!, { 
            date: String(v.date), 
            category: v.category as any, 
            description: String(v.description), 
            paidTo: String(v.paidTo), 
            method: v.method as any, 
            amount: Number(v.amount) 
          }).then(() => {
            queryClient.invalidateQueries({ queryKey: ["officeExpenses"] });
            toast.success("Expense updated");
            setEditOfficeExpenseId(null);
          }).catch(e => toast.error(e.message));
        }}
      />

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
                const record = procurements.find((r: any) => (r.id || r._id) === editProcurementId);
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
        open={editPaymentId !== null}
        onOpenChange={(v) => !v && setEditPaymentId(null)}
        title="Edit Payment"
        fields={[
          { key: "date", label: "Date", type: "date", required: true },
          { key: "amount", label: "Amount (PKR)", type: "number", required: true },
          { key: "note", label: "Note / Ref", type: "text" },
        ]}
        values={
          editPaymentId
            ? (() => {
                const record = contractorPayments.find((r: any) => (r.id || r._id) === editPaymentId);
                if (!record) return null;
                return { ...record };
              })()
            : null
        }
        onSave={(v) => {
          api.updateContractorPayment(editPaymentId!, { date: String(v.date), amount: Number(v.amount), note: String(v.note) }).then(() => {
            queryClient.invalidateQueries({ queryKey: ["contractorPayments"] });
            toast.success("Payment updated");
            setEditPaymentId(null);
          }).catch(e => toast.error(e.message));
        }}
      />
    </AppShell>
  );
}
