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
  
  const [selectedDate, setSelectedDate] = useState<string>(today());

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

  const { openingBalance, todayFundsList, todayExpensesList, todayFundsTotal, todayExpensesTotal, closingBalance } = useMemo(() => {
    let openingFunds = 0;
    let openingExpenses = 0;

    const todayFundsList: any[] = [];
    const todayExpensesList: any[] = [];
    let todayFundsTotal = 0;
    let todayExpensesTotal = 0;

    funds.forEach((f: any) => {
      if (f.date < selectedDate) openingFunds += f.amount;
      else if (f.date === selectedDate) {
        todayFundsList.push(f);
        todayFundsTotal += f.amount;
      }
    });

    officeExpenses.forEach((e: any) => {
      if (e.date < selectedDate) openingExpenses += e.amount;
      else if (e.date === selectedDate) {
        todayExpensesList.push(e);
        todayExpensesTotal += e.amount;
      }
    });

    const openingBalance = openingFunds - openingExpenses;
    const closingBalance = openingBalance + todayFundsTotal - todayExpensesTotal;

    return { openingBalance, todayFundsList, todayExpensesList, todayFundsTotal, todayExpensesTotal, closingBalance };
  }, [funds, officeExpenses, selectedDate]);

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

  const adjustDate = (days: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + days);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  return (
    <AppShell
      title="Daily Cash Book"
      subtitle="Accountant daily ledger — opening balances, funds, and expenses"
    >
      <div className="space-y-6 print:m-0 print:p-0">
        
        {/* Top Controls (Hidden in Print) */}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4 print:hidden">
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={() => adjustDate(-1)}><ChevronLeft className="h-4 w-4" /></Button>
            <Input type="date" className="w-auto font-medium" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
            <Button variant="outline" size="icon" onClick={() => adjustDate(1)}><ChevronRight className="h-4 w-4" /></Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedDate(today())}>Today</Button>
          </div>
          <div className="flex flex-wrap gap-2">
            <AddFundDialog />
            <AddExpenseDialog />
            <Button variant="outline" size="sm" className="gap-2" onClick={handlePrint}>
              <Printer className="h-4 w-4" /> Print Daily Report
            </Button>
          </div>
        </div>

        {/* Print Header (Visible only in Print) */}
        <div className="hidden print:block mb-6 border-b-2 border-black pb-4 text-center">
          <h1 className="text-2xl font-bold uppercase tracking-widest text-black">Daily Cash Book</h1>
          <p className="mt-1 text-sm font-medium text-gray-600">Date: {new Date(selectedDate).toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>

        {/* Daily Summary */}
        <div className="rounded-xl border border-border bg-card p-6 print:border-black print:rounded-none">
          <h2 className="text-lg font-semibold text-foreground print:text-black">Balance Overview — {selectedDate}</h2>
          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-4">
            <StatTile icon={<Wallet className="h-4 w-4" />} label="Opening Balance" value={`PKR ${fmtPKR(openingBalance)}`} />
            <StatTile icon={<ArrowDownCircle className="h-4 w-4" />} label="Received Today" value={`PKR ${fmtPKR(todayFundsTotal)}`} tone="positive" />
            <StatTile icon={<ArrowUpCircle className="h-4 w-4" />} label="Paid Today" value={`PKR ${fmtPKR(todayExpensesTotal)}`} tone="negative" />
            <StatTile icon={<Landmark className="h-4 w-4" />} label="Closing Balance" value={`PKR ${fmtPKR(closingBalance)}`} tone="balance" />
          </div>
        </div>

        {/* Funds table */}
        <div className="overflow-hidden rounded-xl border border-border bg-card print:border-black print:rounded-none">
          <div className="border-b border-border px-6 py-4 print:border-black print:px-2 print:py-2">
            <h3 className="text-base font-semibold text-emerald-700 print:text-black">Cash Received Today</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/60 hover:bg-secondary/60 print:bg-gray-100">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground print:text-black">From</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground print:text-black">Method</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground print:text-black">Note</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-foreground print:text-black">Amount (PKR)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayFundsList.map((f: any) => (
                  <TableRow key={f._id} className="border-border print:border-gray-300">
                    <TableCell className="text-sm font-medium text-foreground print:text-black">{f.from}</TableCell>
                    <TableCell className="text-sm text-muted-foreground print:text-black">{f.method}</TableCell>
                    <TableCell className="text-sm text-muted-foreground print:text-black">{f.note || "—"}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-emerald-700 print:text-black">{fmtPKR(f.amount)}</TableCell>
                  </TableRow>
                ))}
                {todayFundsList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="py-6 text-center text-sm text-muted-foreground print:text-black">
                      No funds received today.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {todayFundsList.length > 0 && (
            <div className="flex justify-end border-t border-border bg-secondary/40 px-6 py-3 text-sm print:border-black print:bg-white print:px-2 print:py-2">
              <span className="font-semibold text-foreground print:text-black">
                Total Received: <span className="text-emerald-700 print:text-black">PKR {fmtPKR(todayFundsTotal)}</span>
              </span>
            </div>
          )}
        </div>

        {/* Expenses table */}
        <div className="overflow-hidden rounded-xl border border-border bg-card print:border-black print:rounded-none">
          <div className="border-b border-border px-6 py-4 print:border-black print:px-2 print:py-2">
            <h3 className="text-base font-semibold text-[color:var(--sre-red)] print:text-black">Cash Paid Today</h3>
          </div>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary/60 hover:bg-secondary/60 print:bg-gray-100">
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground print:text-black">Category</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground print:text-black">Paid To</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground print:text-black">Description</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground print:text-black">Method</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-foreground print:text-black">Amount (PKR)</TableHead>
                  <TableHead className="w-[50px] print:hidden"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todayExpensesList.map((e) => (
                  <TableRow key={e._id} className="border-border transition-colors hover:bg-accent/40 print:border-gray-300">
                    <TableCell className="text-sm font-medium text-foreground print:text-black">{e.category}</TableCell>
                    <TableCell className="text-sm text-foreground print:text-black">{e.paidTo}</TableCell>
                    <TableCell className="text-sm text-muted-foreground print:text-black">{e.description}</TableCell>
                    <TableCell className="text-xs text-muted-foreground print:text-black">{e.method}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-foreground print:text-black">{fmtPKR(e.amount)}</TableCell>
                    <TableCell className="text-right print:hidden">
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
                {todayExpensesList.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="py-6 text-center text-sm text-muted-foreground print:text-black">
                      No expenses recorded today.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {todayExpensesList.length > 0 && (
            <div className="flex justify-end border-t border-border bg-secondary/40 px-6 py-3 text-sm print:border-black print:bg-white print:px-2 print:py-2">
              <span className="font-semibold text-foreground print:text-black">
                Total Paid: <span className="text-[color:var(--sre-red)] print:text-black">PKR {fmtPKR(todayExpensesTotal)}</span>
              </span>
            </div>
          )}
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
