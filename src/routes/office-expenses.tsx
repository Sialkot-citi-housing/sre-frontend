import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Wallet,
  Plus,
  FileUp,
  Paperclip,
  Pencil,
  Eye,
  TrendingDown,
  CalendarDays,
  Receipt,
} from "lucide-react";

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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { fmtPKR } from "@/lib/projects-data";
import { EditRecordDialog, type EditField, type EditValues } from "@/components/dialogs/edit-record-dialog";

export const Route = createFileRoute("/office-expenses")({
  head: () => ({
    meta: [
      { title: "Daily Office Expenses — SRE Construction Portal" },
      {
        name: "description",
        content:
          "Track daily office expenses — utilities, stationery, fuel, meals and miscellaneous overheads for Sialkot Real Estate.",
      },
    ],
  }),
  component: OfficeExpenses,
});

const EXPENSE_CATEGORIES = [
  "Utilities",
  "Stationery",
  "Fuel",
  "Meals & Tea",
  "Repairs",
  "Travel",
  "Rent",
  "Miscellaneous",
] as const;

const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Card", "Cheque"] as const;

type Expense = {
  id: string;
  date: string;
  category: (typeof EXPENSE_CATEGORIES)[number];
  description: string;
  paidTo: string;
  method: (typeof PAYMENT_METHODS)[number];
  amount: number;
  addedBy: string;
  receipt: boolean;
};

const INITIAL_EXPENSES: Expense[] = [
  { id: "e1", date: "21 Jun 2026", category: "Utilities", description: "K-Electric bill — June", paidTo: "K-Electric", method: "Bank Transfer", amount: 42800, addedBy: "Accounts", receipt: true },
  { id: "e2", date: "21 Jun 2026", category: "Meals & Tea", description: "Office lunch (team of 6)", paidTo: "Al-Madina Foods", method: "Cash", amount: 3400, addedBy: "A. Khan", receipt: true },
  { id: "e3", date: "20 Jun 2026", category: "Fuel", description: "Petrol — site visits", paidTo: "PSO Cantt Pump", method: "Cash", amount: 6000, addedBy: "Driver", receipt: true },
  { id: "e4", date: "20 Jun 2026", category: "Stationery", description: "Files, printer toner, register", paidTo: "Al-Fazal Book Depot", method: "Cash", amount: 4750, addedBy: "Admin", receipt: false },
  { id: "e5", date: "19 Jun 2026", category: "Repairs", description: "AC servicing (office)", paidTo: "Cool Tech Sialkot", method: "Cash", amount: 5500, addedBy: "Admin", receipt: true },
  { id: "e6", date: "18 Jun 2026", category: "Travel", description: "Lahore trip — client meeting", paidTo: "Daewoo Express", method: "Card", amount: 9200, addedBy: "A. Khan", receipt: true },
  { id: "e7", date: "17 Jun 2026", category: "Miscellaneous", description: "Eid gifts for team", paidTo: "Ehsan Chappal Store", method: "Cash", amount: 12500, addedBy: "Director", receipt: false },
  { id: "e8", date: "15 Jun 2026", category: "Rent", description: "Office rent — June", paidTo: "M. Iqbal (Landlord)", method: "Bank Transfer", amount: 85000, addedBy: "Accounts", receipt: true },
];

function CategoryPill({ category }: { category: Expense["category"] }) {
  return (
    <span className="inline-flex items-center rounded-full bg-[color:var(--sre-blue)]/10 px-2.5 py-1 text-xs font-medium text-[color:var(--sre-blue)]">
      {category}
    </span>
  );
}

function AddExpenseDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-1.5 bg-[color:var(--sre-blue)] text-primary-foreground hover:bg-[color:var(--sre-blue)]/90">
          <Plus className="h-4 w-4" /> Add Expense
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Add Daily Office Expense</DialogTitle>
          <DialogDescription>
            Log a single office-side expense — attach the receipt for audit.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-5 py-2"
          onSubmit={(e) => {
            e.preventDefault();
            setOpen(false);
          }}
        >
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="e-date">Date</Label>
              <Input id="e-date" type="date" required />
            </div>
            <div className="grid gap-2">
              <Label>Category</Label>
              <Select defaultValue="Utilities">
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {EXPENSE_CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="e-desc">Description</Label>
            <Textarea id="e-desc" rows={2} placeholder="e.g. K-Electric bill — June" required />
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="e-paidto">Paid To</Label>
              <Input id="e-paidto" placeholder="Vendor / person" required />
            </div>
            <div className="grid gap-2">
              <Label>Payment Method</Label>
              <Select defaultValue="Cash">
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="e-amount">Amount (PKR)</Label>
            <Input id="e-amount" type="number" min={0} step="any" placeholder="0" required />
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[color:var(--sre-blue)] text-primary-foreground hover:bg-[color:var(--sre-blue)]/90"
            >
              Save Expense
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function StatTile({ icon, label, value, sub }: { icon: React.ReactNode; label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/40 p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        {icon}
        {label}
      </div>
      <div className="mt-1 text-lg font-bold tabular-nums text-foreground">{value}</div>
      {sub ? <div className="mt-0.5 text-xs text-muted-foreground">{sub}</div> : null}
    </div>
  );
}

function OfficeExpenses() {
  const [activeCat, setActiveCat] = useState<string>("all");
  const [expenses, setExpenses] = useState<Expense[]>(INITIAL_EXPENSES);
  const [editIdx, setEditIdx] = useState<number | null>(null);

  const total = expenses.reduce((s, e) => s + e.amount, 0);
  const todayTotal = expenses.filter((e) => e.date === "21 Jun 2026").reduce((s, e) => s + e.amount, 0);
  const largest = expenses.reduce((max, e) => (e.amount > max ? e.amount : max), 0);

  const filtered = activeCat === "all" ? expenses : expenses.filter((e) => e.category === activeCat);
  const filteredTotal = filtered.reduce((s, e) => s + e.amount, 0);

  return (
    <AppShell title="Daily Office Expenses" subtitle="Track office overheads separately from project ledgers">
      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Office Ledger
              </div>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-foreground">
                June 2026 — Overheads
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Utilities, stationery, fuel and other non-project expenses.
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" className="gap-1.5">
                <FileUp className="h-4 w-4" /> Export
              </Button>
              <AddExpenseDialog />
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatTile icon={<Wallet className="h-4 w-4" />} label="Month to date" value={`PKR ${fmtPKR(total)}`} sub={`${expenses.length} entries`} />
            <StatTile icon={<CalendarDays className="h-4 w-4" />} label="Today" value={`PKR ${fmtPKR(todayTotal)}`} sub="21 Jun 2026" />
            <StatTile icon={<TrendingDown className="h-4 w-4" />} label="Largest expense" value={`PKR ${fmtPKR(largest)}`} sub="Office rent" />
            <StatTile icon={<Receipt className="h-4 w-4" />} label="With receipts" value={`${expenses.filter((e) => e.receipt).length} / ${expenses.length}`} />
          </div>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-6 py-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">Expense Register</h3>
              <p className="text-xs text-muted-foreground">Filter by category — subtotal updates automatically</p>
            </div>
          </div>
          <div className="border-b border-border px-6 py-3">
            <Tabs value={activeCat} onValueChange={setActiveCat}>
              <TabsList className="flex h-auto flex-wrap gap-1 bg-secondary/60 p-1">
                <TabsTrigger
                  value="all"
                  className="data-[state=active]:bg-card data-[state=active]:text-[color:var(--sre-blue)] data-[state=active]:shadow-sm text-xs font-medium"
                >
                  All
                </TabsTrigger>
                {EXPENSE_CATEGORIES.map((c) => (
                  <TabsTrigger
                    key={c}
                    value={c}
                    className="data-[state=active]:bg-card data-[state=active]:text-[color:var(--sre-blue)] data-[state=active]:shadow-sm text-xs font-medium"
                  >
                    {c}
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
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">Category</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">Description</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">Paid To</TableHead>
                  <TableHead className="text-xs font-semibold uppercase tracking-wider text-foreground">Method</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-foreground">Amount (PKR)</TableHead>
                  <TableHead className="text-center text-xs font-semibold uppercase tracking-wider text-foreground">Receipt</TableHead>
                  <TableHead className="text-right text-xs font-semibold uppercase tracking-wider text-foreground">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => {
                  const idx = expenses.indexOf(e);
                  return (
                  <TableRow key={e.id} className="border-border transition-colors hover:bg-accent/40">
                    <TableCell className="whitespace-nowrap text-sm font-medium text-foreground">{e.date}</TableCell>
                    <TableCell><CategoryPill category={e.category} /></TableCell>
                    <TableCell className="text-sm text-foreground">{e.description}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{e.paidTo}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{e.method}</TableCell>
                    <TableCell className="text-right tabular-nums font-semibold text-foreground">{fmtPKR(e.amount)}</TableCell>
                    <TableCell className="text-center">
                      {e.receipt ? (
                        <button className="inline-flex items-center justify-center rounded-md p-1.5 text-[color:var(--sre-blue)] transition-colors hover:bg-accent" aria-label="View receipt">
                          <Paperclip className="h-4 w-4" />
                        </button>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-[color:var(--sre-blue)]" aria-label="Edit expense" onClick={() => setEditIdx(idx)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-[color:var(--sre-blue)]" aria-label="View details">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                  );
                })}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                      No expenses in this category yet.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-secondary/40 px-6 py-3 text-sm">
            <span className="text-muted-foreground">
              {filtered.length} entries{activeCat !== "all" && ` · filtered`}
            </span>
            <span className="font-semibold text-foreground">
              {activeCat === "all" ? "Total" : "Subtotal"}: PKR {fmtPKR(filteredTotal)}
            </span>
          </div>
        </div>
      </div>

      <EditRecordDialog
        open={editIdx !== null}
        onOpenChange={(v) => !v && setEditIdx(null)}
        title="Edit Expense"
        description="Update the office expense details."
        fields={[
          { key: "date", label: "Date", type: "text", required: true },
          { key: "category", label: "Category", type: "select", options: EXPENSE_CATEGORIES, required: true },
          { key: "description", label: "Description", type: "textarea", required: true },
          { key: "paidTo", label: "Paid To", type: "text", required: true },
          { key: "method", label: "Method", type: "select", options: PAYMENT_METHODS, required: true },
          { key: "amount", label: "Amount (PKR)", type: "number", required: true },
        ]}
        values={editIdx !== null ? (expenses[editIdx] as unknown as EditValues) : null}
        onSave={(next) => {
          if (editIdx === null) return;
          setExpenses((prev) => prev.map((e, i) => (i === editIdx ? { ...e, ...(next as unknown as Expense) } : e)));
        }}
      />
    </AppShell>
  );
}