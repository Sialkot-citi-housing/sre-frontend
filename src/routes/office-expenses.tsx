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
  Printer,
  ChevronLeft,
  ChevronRight,
  MapPin,
  Phone,
  Mail,
  Globe,
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

function AddExpenseDialog() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const [date, setDate] = useState(today());
  // office fields
  const [officeCategory, setOfficeCategory] = useState<OfficeExpenseCategory>("Utilities");
  const [description, setDescription] = useState("");
  const [paidTo, setPaidTo] = useState("");
  const [method, setMethod] = useState<PaymentMethod>("Cash");
  const [amount, setAmount] = useState<number>(0);
  const [isPending, setIsPending] = useState(false);

  const reset = () => {
    setDate(today());
    setDescription("");
    setPaidTo("");
    setAmount(0);
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsPending(true);
    try {
      await api.addOfficeExpense({
        date,
        category: officeCategory,
        description,
        paidTo,
        method,
        amount: Number(amount) || 0,
      });
      queryClient.invalidateQueries({ queryKey: ["officeExpenses"] });
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
            Record expenses that are strictly for office overhead, salaries, utility bills etc.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-5 py-2">

          <div className="grid gap-2">
            <Label>Date</Label>
            <Input type="date" required value={date} onChange={(e) => setDate(e.target.value)} />
          </div>


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
    document.title = "Daily Cash Book | Sialkot Real Estate";
  }, []);
  const queryClient = useQueryClient();
  const [editOfficeExpenseId, setEditOfficeExpenseId] = useState<string | null>(null);
  
  const [startDate, setStartDate] = useState<string>(today());
  const [endDate, setEndDate] = useState<string>(today());

  const handleEdit = (id: string) => {
    if (id.startsWith('off-')) setEditOfficeExpenseId(id.slice(4));
  };

  const handleDelete = (id: string) => {
    if (!confirm("Are you sure you want to delete this record?")) return;
    if (id.startsWith('off-')) {
      api.deleteOfficeExpense(id.slice(4)).then(() => { toast.success("Deleted"); queryClient.invalidateQueries({ queryKey: ["officeExpenses"] }); }).catch(e => toast.error(e.message));
    }
  };

  const { data: funds = [], isLoading: isLoadingFunds } = useQuery({ queryKey: ["funds"], queryFn: api.getFunds });
  const { data: officeExpenses = [], isLoading: isLoadingOffice } = useQuery({ queryKey: ["officeExpenses"], queryFn: api.getOfficeExpenses });

  const isLoading = isLoadingFunds || isLoadingOffice;

  const { openingBalance, periodFundsList, periodExpensesList, periodFundsTotal, periodExpensesTotal, closingBalance } = useMemo(() => {
    let openingFunds = 0;
    let openingExpenses = 0;

    const periodFundsList: any[] = [];
    const periodExpensesList: any[] = [];
    let periodFundsTotal = 0;
    let periodExpensesTotal = 0;

    funds.forEach((f: any) => {
      if (f.date < startDate) openingFunds += f.amount;
      else if (f.date >= startDate && f.date <= endDate) {
        periodFundsList.push(f);
        periodFundsTotal += f.amount;
      }
    });

    officeExpenses.forEach((e: any) => {
      if (e.date < startDate) openingExpenses += e.amount;
      else if (e.date >= startDate && e.date <= endDate) {
        periodExpensesList.push(e);
        periodExpensesTotal += e.amount;
      }
    });

    const openingBalance = openingFunds - openingExpenses;
    const closingBalance = openingBalance + periodFundsTotal - periodExpensesTotal;

    return { openingBalance, periodFundsList, periodExpensesList, periodFundsTotal, periodExpensesTotal, closingBalance };
  }, [funds, officeExpenses, startDate, endDate]);

  if (isLoading) {
    return (
      <AppShell title="Daily Cash Book" subtitle="Accountant daily ledger — opening balances, funds, and expenses">
        <div className="flex h-64 items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[color:var(--sre-blue)]" />
        </div>
      </AppShell>
    );
  }

  const handlePrint = () => {
    window.print();
  };

  return (
    <AppShell
      title="Daily Cash Book"
      subtitle="Accountant daily ledger — opening balances, funds, and expenses"
    >
      <div className="space-y-6 print:m-0 print:p-0">
        
        {/* ========================================= */}
        {/* SCREEN LAYOUT (Hidden in Print) */}
        {/* ========================================= */}
        <div className="space-y-6 print:hidden">
          
          {/* Top Controls */}
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">From</span>
                <Input type="date" className="w-auto font-medium" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">To</span>
                <Input type="date" className="w-auto font-medium" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
              </div>
              <Button variant="ghost" size="sm" onClick={() => { setStartDate(today()); setEndDate(today()); }}>Today</Button>
            </div>
            <div className="flex flex-wrap gap-2">
              <AddFundDialog />
              <AddExpenseDialog />
              <Button variant="outline" size="sm" className="gap-2" onClick={handlePrint}>
                <Printer className="h-4 w-4" /> Print Daily Report
              </Button>
            </div>
          </div>

          {/* Daily Summary */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground">Balance Overview</h2>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
              <StatTile icon={<Wallet className="h-4 w-4" />} label="Opening Balance" value={`PKR ${fmtPKR(openingBalance)}`} />
              <StatTile icon={<ArrowDownCircle className="h-4 w-4" />} label="Received Period" value={`PKR ${fmtPKR(periodFundsTotal)}`} tone="positive" />
              <StatTile icon={<ArrowUpCircle className="h-4 w-4" />} label="Paid Period" value={`PKR ${fmtPKR(periodExpensesTotal)}`} tone="negative" />
              <StatTile icon={<Landmark className="h-4 w-4" />} label="Cash in Hand" value={`PKR ${fmtPKR(closingBalance)}`} tone="balance" />
            </div>
          </div>

          {/* Funds table */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border px-6 py-4">
              <h3 className="text-base font-semibold text-emerald-700">Cash Received</h3>
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
                  {periodFundsList.map((f: any) => (
                    <TableRow key={f._id} className="border-border">
                      <TableCell className="text-sm font-medium text-foreground">{f.date}</TableCell>
                      <TableCell className="text-sm font-medium text-foreground">{f.from}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{f.method}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{f.note || "—"}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold text-emerald-700">{fmtPKR(f.amount)}</TableCell>
                    </TableRow>
                  ))}
                  {periodFundsList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={5} className="py-6 text-center text-sm text-muted-foreground">
                        No funds received in this period.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {periodFundsList.length > 0 && (
              <div className="flex justify-end border-t border-border bg-secondary/40 px-6 py-3 text-sm">
                <span className="font-semibold text-foreground">
                  Total Received: <span className="text-emerald-700">PKR {fmtPKR(periodFundsTotal)}</span>
                </span>
              </div>
            )}
          </div>

          {/* Expenses table */}
          <div className="overflow-hidden rounded-xl border border-border bg-card">
            <div className="border-b border-border px-6 py-4">
              <h3 className="text-base font-semibold text-[color:var(--sre-red)]">Cash Paid</h3>
            </div>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/60 hover:bg-secondary/60">
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">Date</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">Category</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">Paid To</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">Description</TableHead>
                    <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">Method</TableHead>
                    <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-foreground">Amount (PKR)</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {periodExpensesList.map((e) => (
                    <TableRow key={e._id} className="border-border transition-colors hover:bg-accent/40">
                      <TableCell className="text-sm font-medium text-foreground">{e.date}</TableCell>
                      <TableCell className="text-sm font-medium text-foreground">{e.category}</TableCell>
                      <TableCell className="text-sm text-foreground">{e.paidTo}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{e.description}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{e.method}</TableCell>
                      <TableCell className="text-right tabular-nums font-semibold text-foreground">{fmtPKR(e.amount)}</TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-secondary/80">
                              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-40 bg-card">
                            <DropdownMenuItem onClick={() => handleEdit(`off-${e._id}`)} className="cursor-pointer text-sm font-medium">
                              <Pencil className="mr-2 h-4 w-4 text-muted-foreground" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(`off-${e._id}`)} className="cursor-pointer text-sm font-medium text-[color:var(--sre-red)] focus:bg-[color:var(--sre-red)]/10 focus:text-[color:var(--sre-red)]">
                              <Trash2 className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                  {periodExpensesList.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="py-6 text-center text-sm text-muted-foreground">
                        No expenses recorded in this period.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {periodExpensesList.length > 0 && (
              <div className="flex justify-end border-t border-border bg-secondary/40 px-6 py-3 text-sm">
                <span className="font-semibold text-foreground">
                  Total Paid: <span className="text-[color:var(--sre-red)]">PKR {fmtPKR(periodExpensesTotal)}</span>
                </span>
              </div>
            )}
          </div>
        </div>


        {/* ========================================= */}
        {/* PRINT LAYOUT (Hidden on Screen) */}
        {/* ========================================= */}
        <div 
          className="hidden print:block w-[210mm] min-h-[297mm] mx-auto bg-white text-[#082041] relative" 
          style={{ 
            fontFamily: "'Inter', sans-serif", 
            fontSize: "10pt",
            WebkitPrintColorAdjust: "exact",
            printColorAdjust: "exact"
          }}
        >
          <style type="text/css">
            {`
              @media print {
                @page { size: A4; margin: 0; }
                body { margin: 0; padding: 0; }
              }
            `}
          </style>
          
          {/* HEADER */}
          <div className="flex relative h-[140px] mb-8 border-b-8 border-[#D51017]">
            <div className="flex items-center pt-6 pl-8 pr-4 w-[60%]">
              {/* Logo SVG */}
              <div className="mr-6 flex flex-col items-center justify-center">
                <svg width="120" height="80" viewBox="0 0 120 80">
                  <path d="M 10 50 Q 60 10 110 50" fill="none" stroke="#082041" strokeWidth="6" />
                  <path d="M 40 40 L 60 15 L 80 40 Z" fill="#D51017" />
                  <rect x="52" y="25" width="16" height="15" fill="white" />
                  <rect x="56" y="29" width="3" height="3" fill="#D51017" />
                  <rect x="61" y="29" width="3" height="3" fill="#D51017" />
                  <rect x="56" y="34" width="3" height="3" fill="#D51017" />
                  <rect x="61" y="34" width="3" height="3" fill="#D51017" />
                  <text x="60" y="65" fontFamily="serif" fontSize="18" fontWeight="bold" fill="#D51017" textAnchor="middle">SIALKOT</text>
                  <text x="60" y="75" fontFamily="serif" fontSize="10" fill="#082041" textAnchor="middle">REAL ESTATE</text>
                </svg>
              </div>
              
              <div className="border-l-2 border-gray-300 pl-6 space-y-1">
                <h1 className="text-xl font-bold tracking-widest text-[#082041]" style={{ color: "#082041" }}>SIALKOT REAL ESTATE</h1>
                <p className="text-[10px] text-[#082041] mb-2 font-medium" style={{ color: "#082041" }}>Building Trust, Delivering Excellence</p>
                <div className="text-[9px] text-gray-700 flex items-center gap-2 mt-2"><MapPin size={10} color="#082041"/> Citi Housing, Sialkot, Punjab, Pakistan</div>
                <div className="text-[9px] text-gray-700 flex items-center gap-2 mt-0.5"><Phone size={10} color="#082041"/> +92 300 1234567</div>
                <div className="text-[9px] text-gray-700 flex items-center gap-2 mt-0.5"><Mail size={10} color="#082041"/> info@sialkotrealestate.com</div>
                <div className="text-[9px] text-gray-700 flex items-center gap-2 mt-0.5"><Globe size={10} color="#082041"/> www.sialkotrealestate.com</div>
              </div>
            </div>
            
            <div 
              className="absolute right-0 top-0 h-[140px] w-[45%]"
              style={{
                backgroundColor: "#082041",
                clipPath: "polygon(15% 0, 100% 0, 100% 100%, 0 100%)",
              }}
            >
              <div className="text-white pt-8 pl-20 pr-8 space-y-2">
                <h1 className="text-3xl font-extrabold tracking-widest mb-4" style={{ color: "white" }}>DAILY REPORT</h1>
                <div className="text-xs space-y-2" style={{ color: "white" }}>
                  <div className="grid grid-cols-[80px_1fr]"><span className="opacity-80">Report Date</span><span>: {new Date(endDate).toLocaleDateString("en-GB", {day:'numeric', month:'long', year:'numeric'})}</span></div>
                  <div className="grid grid-cols-[80px_1fr]"><span className="opacity-80">Day</span><span>: {new Date(endDate).toLocaleDateString("en-GB", {weekday: 'long'})}</span></div>
                  <div className="grid grid-cols-[80px_1fr]"><span className="opacity-80">Prepared By</span><span>: Accountant</span></div>
                </div>
              </div>
            </div>
          </div>

          <div className="px-8 pb-8 space-y-6">
            {/* Top 3 Cards */}
            <div className="grid grid-cols-3 gap-4">
              {/* Card 1 */}
              <div className="border border-[#082041] rounded-lg overflow-hidden bg-white">
                <div className="bg-[#082041] text-white text-[10px] font-bold tracking-wider py-2 text-center" style={{ backgroundColor: "#082041", color: "white" }}>PREVIOUS DAY BALANCE (IN HAND)</div>
                <div className="p-4 flex items-center">
                  <div className="w-12 h-12 bg-[#082041] rounded-full flex items-center justify-center text-white mr-4 shrink-0" style={{ backgroundColor: "#082041", color: "white" }}>
                    <Wallet size={24} />
                  </div>
                  <div>
                    <div className="text-[#082041] text-xs font-bold" style={{ color: "#082041" }}>PKR</div>
                    <div className="text-[#082041] text-xl font-black" style={{ color: "#082041" }}>{fmtPKR(openingBalance)}</div>
                  </div>
                </div>
              </div>

              {/* Card 2 */}
              <div className="border border-[#082041] rounded-lg overflow-hidden bg-white">
                <div className="bg-[#082041] text-white text-[10px] font-bold tracking-wider py-2 text-center" style={{ backgroundColor: "#082041", color: "white" }}>RECEIVED FROM OWNER (TODAY)</div>
                <div className="p-4 flex items-center">
                  <div className="w-12 h-12 bg-[#082041] rounded-full flex items-center justify-center text-white mr-4 shrink-0" style={{ backgroundColor: "#082041", color: "white" }}>
                    <Landmark size={24} />
                  </div>
                  <div>
                    <div className="text-[#082041] text-xs font-bold" style={{ color: "#082041" }}>PKR</div>
                    <div className="text-[#082041] text-xl font-black" style={{ color: "#082041" }}>{fmtPKR(periodFundsTotal)}</div>
                  </div>
                </div>
              </div>

              {/* Card 3 */}
              <div className="border border-[#082041] rounded-lg overflow-hidden bg-white">
                <div className="bg-[#082041] text-white text-[10px] font-bold tracking-wider py-2 text-center" style={{ backgroundColor: "#082041", color: "white" }}>TODAY'S TOTAL EXPENSES</div>
                <div className="p-4 flex items-center">
                  <div className="w-12 h-12 bg-[#082041] rounded-full flex items-center justify-center text-white mr-4 shrink-0" style={{ backgroundColor: "#082041", color: "white" }}>
                    <Building2 size={24} />
                  </div>
                  <div>
                    <div className="text-[#082041] text-xs font-bold" style={{ color: "#082041" }}>PKR</div>
                    <div className="text-[#082041] text-xl font-black" style={{ color: "#082041" }}>{fmtPKR(periodExpensesTotal)}</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Payments Received Table */}
            <div className="border border-[#082041] rounded-lg overflow-hidden">
              <div className="bg-[#082041] text-white text-[11px] font-bold tracking-wider py-2 text-center uppercase" style={{ backgroundColor: "#082041", color: "white" }}>Payments Received Today</div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#082041]/20 bg-[#f8fafc]" style={{ backgroundColor: "#f8fafc" }}>
                    <th className="py-2 px-4 text-[9px] font-bold text-[#082041] uppercase w-10 text-center" style={{ color: "#082041" }}>#</th>
                    <th className="py-2 px-4 text-[9px] font-bold text-[#082041] uppercase" style={{ color: "#082041" }}>Description</th>
                    <th className="py-2 px-4 text-[9px] font-bold text-[#082041] uppercase" style={{ color: "#082041" }}>From</th>
                    <th className="py-2 px-4 text-[9px] font-bold text-[#082041] uppercase" style={{ color: "#082041" }}>Payment Method</th>
                    <th className="py-2 px-4 text-[9px] font-bold text-[#082041] uppercase text-right" style={{ color: "#082041" }}>Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody>
                  {periodFundsList.map((f: any, idx: number) => (
                    <tr key={f._id} className="border-b border-[#082041]/10">
                      <td className="py-2 px-4 text-[10px] text-center">{idx + 1}</td>
                      <td className="py-2 px-4 text-[10px]">{f.note || "Funds Received"}</td>
                      <td className="py-2 px-4 text-[10px]">{f.from}</td>
                      <td className="py-2 px-4 text-[10px]">{f.method}</td>
                      <td className="py-2 px-4 text-[10px] text-right font-medium">{fmtPKR(f.amount)}</td>
                    </tr>
                  ))}
                  {periodFundsList.length < 5 && Array.from({length: 5 - periodFundsList.length}).map((_, i) => (
                    <tr key={`empty-f-${i}`} className="border-b border-[#082041]/10 h-8"><td colSpan={5}></td></tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={4} className="py-3 px-4 text-right font-bold text-[11px] text-[#082041]">TOTAL RECEIVED</td>
                    <td className="py-3 px-4 text-right font-bold text-sm text-[#082041]">{fmtPKR(periodFundsTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Today's Expenses Table */}
            <div className="border border-[#082041] rounded-lg overflow-hidden mt-6">
              <div className="bg-[#082041] text-white text-[11px] font-bold tracking-wider py-2 text-center uppercase" style={{ backgroundColor: "#082041", color: "white" }}>Today's Expenses</div>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#082041]/20 bg-[#f8fafc]" style={{ backgroundColor: "#f8fafc" }}>
                    <th className="py-2 px-4 text-[9px] font-bold text-[#082041] uppercase w-10 text-center" style={{ color: "#082041" }}>#</th>
                    <th className="py-2 px-4 text-[9px] font-bold text-[#082041] uppercase" style={{ color: "#082041" }}>Description</th>
                    <th className="py-2 px-4 text-[9px] font-bold text-[#082041] uppercase" style={{ color: "#082041" }}>Category</th>
                    <th className="py-2 px-4 text-[9px] font-bold text-[#082041] uppercase" style={{ color: "#082041" }}>Paid To</th>
                    <th className="py-2 px-4 text-[9px] font-bold text-[#082041] uppercase" style={{ color: "#082041" }}>Payment Method</th>
                    <th className="py-2 px-4 text-[9px] font-bold text-[#082041] uppercase text-right" style={{ color: "#082041" }}>Amount (PKR)</th>
                  </tr>
                </thead>
                <tbody>
                  {periodExpensesList.map((e: any, idx: number) => (
                    <tr key={e._id} className="border-b border-[#082041]/10">
                      <td className="py-2 px-4 text-[10px] text-center">{idx + 1}</td>
                      <td className="py-2 px-4 text-[10px]">{e.description}</td>
                      <td className="py-2 px-4 text-[10px]">{e.category}</td>
                      <td className="py-2 px-4 text-[10px]">{e.paidTo}</td>
                      <td className="py-2 px-4 text-[10px]">{e.method}</td>
                      <td className="py-2 px-4 text-[10px] text-right font-medium">{fmtPKR(e.amount)}</td>
                    </tr>
                  ))}
                  {periodExpensesList.length < 5 && Array.from({length: 5 - periodExpensesList.length}).map((_, i) => (
                    <tr key={`empty-e-${i}`} className="border-b border-[#082041]/10 h-8"><td colSpan={6}></td></tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr>
                    <td colSpan={5} className="py-3 px-4 text-right font-bold text-[11px] text-[#082041]">TOTAL EXPENSES</td>
                    <td className="py-3 px-4 text-right font-bold text-sm text-[#082041]">{fmtPKR(periodExpensesTotal)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Bottom Balance Card */}
            <div className="border border-[#082041] rounded-lg overflow-hidden bg-white p-4 flex items-center justify-between mt-6">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-[#082041] rounded-lg flex items-center justify-center text-white shrink-0" style={{ backgroundColor: "#082041", color: "white" }}>
                  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"></rect><line x1="8" y1="6" x2="16" y2="6"></line><line x1="16" y1="14" x2="16" y2="14.01"></line><line x1="12" y1="14" x2="12" y2="14.01"></line><line x1="8" y1="14" x2="8" y2="14.01"></line><line x1="16" y1="18" x2="16" y2="18.01"></line><line x1="12" y1="18" x2="12" y2="18.01"></line><line x1="8" y1="18" x2="8" y2="18.01"></line></svg>
                </div>
                <div>
                  <div className="text-[#082041] text-sm font-bold tracking-wide" style={{ color: "#082041" }}>BALANCE IN HAND (END OF DAY)</div>
                  <div className="text-gray-500 text-[10px] mt-1">(Previous Balance + Received - Today's Expenses)</div>
                </div>
              </div>
              <div className="flex items-baseline gap-4 pr-4">
                <div className="text-[#082041] text-sm font-bold" style={{ color: "#082041" }}>PKR</div>
                <div className="text-[#082041] text-3xl font-black" style={{ color: "#082041" }}>{fmtPKR(closingBalance)}</div>
              </div>
            </div>

            {/* Signatures */}
            <div className="border border-[#082041] rounded-lg h-24 flex mt-6">
              <div className="flex-1 border-r border-[#082041] p-4 flex flex-col justify-end items-center">
                <div className="text-[10px] font-bold text-[#082041]" style={{ color: "#082041" }}>OWNER SIGNATURE</div>
              </div>
              <div className="flex-1 p-4 flex flex-col justify-end items-center">
                <div className="text-[10px] font-bold text-[#082041]" style={{ color: "#082041" }}>COMPANY STAMP</div>
              </div>
            </div>

            {/* Footer text */}
            <div className="text-center pt-4 space-y-1">
              <div className="text-[#082041] font-bold text-[11px]" style={{ color: "#082041" }}>Thank you for choosing Sialkot Real Estate.</div>
              <div className="text-gray-600 italic font-serif text-[13px]">We build more than structures, we build relationships.</div>
            </div>

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
    </AppShell>
  );
}
