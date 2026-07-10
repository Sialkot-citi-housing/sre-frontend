import { useSyncExternalStore } from "react";
import { projects } from "./projects-data";

export type MaterialCategory = "bricks" | "cement" | "steel" | "sandcrush" | "labour" | "other";
export const MATERIAL_CATEGORY_OPTIONS: MaterialCategory[] = [
  "bricks",
  "cement",
  "steel",
  "sandcrush",
  "labour",
  "other",
];

export type ContractorRole =
  | "Thekadar"
  | "Plumber"
  | "Electrician"
  | "Designer (Painter)"
  | "Ceiling / Palling";

export const CONTRACTOR_ROLES: ContractorRole[] = [
  "Thekadar",
  "Plumber",
  "Electrician",
  "Designer (Painter)",
  "Ceiling / Palling",
];

export type Procurement = {
  id: string;
  projectId: string;
  date: string;
  item: string;
  category: MaterialCategory;
  quantity: number;
  unit: string;
  rate: number;
  vendor: string;
  paid: number;
};

export type Contractor = {
  id: string;
  projectId: string;
  role: ContractorRole;
  name: string;
  contact: string;
  agreedAmount: number;
  status: "Active" | "Completed" | "On hold";
};

export type ContractorPayment = {
  id: string;
  contractorId: string;
  date: string;
  amount: number;
  note: string;
};

export type CustomerPayment = {
  id: string;
  projectId: string;
  date: string;
  amount: number;
  method: "Cash" | "Bank Transfer" | "Cheque";
  note: string;
};

export type Fund = {
  id: string;
  date: string;
  amount: number;
  method: "Cash" | "Bank Transfer" | "Cheque";
  from: string;
  note: string;
};

export const OFFICE_EXPENSE_CATEGORIES = [
  "Utilities",
  "Stationery",
  "Fuel",
  "Meals & Tea",
  "Repairs",
  "Travel",
  "Rent",
  "Miscellaneous",
] as const;

export type OfficeExpenseCategory = (typeof OFFICE_EXPENSE_CATEGORIES)[number];
export const PAYMENT_METHODS = ["Cash", "Bank Transfer", "Card", "Cheque"] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

export type OfficeExpense = {
  id: string;
  date: string;
  category: OfficeExpenseCategory;
  description: string;
  paidTo: string;
  method: PaymentMethod;
  amount: number;
};

type State = {
  procurements: Procurement[];
  contractors: Contractor[];
  contractorPayments: ContractorPayment[];
  customerPayments: CustomerPayment[];
  funds: Fund[];
  officeExpenses: OfficeExpense[];
};

const P1 = projects[0]?.id ?? "plot-142";

const initialState: State = {
  procurements: [
    { id: "p1", projectId: P1, date: "2026-06-21", item: "Lucky Cement (OPC)", category: "cement", quantity: 50, unit: "Bags", rate: 1340, vendor: "Bilal Traders", paid: 67000 },
    { id: "p2", projectId: P1, date: "2026-06-20", item: "Grade-60 Serya 12mm", category: "steel", quantity: 1.2, unit: "Tons", rate: 305000, vendor: "Ittefaq Steel", paid: 200000 },
    { id: "p3", projectId: P1, date: "2026-06-19", item: "Chenab Sand", category: "sandcrush", quantity: 4, unit: "Trolly", rate: 12500, vendor: "Chenab Suppliers", paid: 50000 },
    { id: "p4", projectId: P1, date: "2026-06-18", item: "Awwal Bricks", category: "bricks", quantity: 12000, unit: "Pcs", rate: 22, vendor: "Sialkot Brick Kiln", paid: 150000 },
    { id: "p5", projectId: P1, date: "2026-06-18", item: "Labour — Mason", category: "labour", quantity: 20, unit: "Days", rate: 2200, vendor: "Thekedar Yousaf", paid: 44000 },
    { id: "p6", projectId: P1, date: "2026-06-15", item: "Margalla Crush", category: "sandcrush", quantity: 6, unit: "Trolly", rate: 21000, vendor: "Margalla Traders", paid: 90000 },
  ],
  contractors: [
    { id: "c1", projectId: P1, role: "Thekadar", name: "Yousaf Bhatti", contact: "0300-1234567", agreedAmount: 1250000, status: "Active" },
    { id: "c2", projectId: P1, role: "Plumber", name: "Rashid & Sons", contact: "0321-7654321", agreedAmount: 185000, status: "Active" },
    { id: "c3", projectId: P1, role: "Electrician", name: "Sialkot Electric Works", contact: "0302-2233445", agreedAmount: 240000, status: "Active" },
    { id: "c4", projectId: P1, role: "Designer (Painter)", name: "Master Aslam", contact: "0345-9988776", agreedAmount: 320000, status: "On hold" },
    { id: "c5", projectId: P1, role: "Ceiling / Palling", name: "Kamran Ceiling House", contact: "0333-1122334", agreedAmount: 210000, status: "On hold" },
  ],
  contractorPayments: [
    { id: "cp1", contractorId: "c1", date: "2026-03-16", amount: 300000, note: "Advance on start" },
    { id: "cp2", contractorId: "c1", date: "2026-04-28", amount: 280000, note: "Grey slab milestone" },
    { id: "cp3", contractorId: "c1", date: "2026-06-10", amount: 200000, note: "1st floor slab" },
    { id: "cp4", contractorId: "c2", date: "2026-05-08", amount: 90000, note: "Rough plumbing" },
    { id: "cp5", contractorId: "c3", date: "2026-05-20", amount: 60000, note: "Conduit rough-in" },
  ],
  customerPayments: [
    { id: "op1", projectId: P1, date: "2026-03-14", amount: 3000000, method: "Bank Transfer", note: "Booking / start advance" },
    { id: "op2", projectId: P1, date: "2026-04-30", amount: 1000000, method: "Cheque", note: "Grey structure milestone" },
    { id: "op3", projectId: P1, date: "2026-06-05", amount: 500000, method: "Cash", note: "1st floor slab" },
  ],
  funds: [
    { id: "f1", date: "2026-06-01", amount: 1500000, method: "Bank Transfer", from: "Director (Owner)", note: "June operating float" },
    { id: "f2", date: "2026-06-18", amount: 800000, method: "Cash", from: "Director (Owner)", note: "Top-up for slab material" },
  ],
  officeExpenses: [
    { id: "e1", date: "2026-06-21", category: "Utilities", description: "K-Electric bill — June", paidTo: "K-Electric", method: "Bank Transfer", amount: 42800 },
    { id: "e2", date: "2026-06-21", category: "Meals & Tea", description: "Office lunch (team of 6)", paidTo: "Al-Madina Foods", method: "Cash", amount: 3400 },
    { id: "e3", date: "2026-06-20", category: "Fuel", description: "Petrol — site visits", paidTo: "PSO Cantt Pump", method: "Cash", amount: 6000 },
    { id: "e4", date: "2026-06-15", category: "Rent", description: "Office rent — June", paidTo: "M. Iqbal (Landlord)", method: "Bank Transfer", amount: 85000 },
  ],
};

let state: State = initialState;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};
const getSnapshot = () => state;

export function useFinance() {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}

const uid = () => Math.random().toString(36).slice(2, 10);

export const financeActions = {
  addProcurement(p: Omit<Procurement, "id">) {
    state = { ...state, procurements: [{ ...p, id: uid() }, ...state.procurements] };
    emit();
  },
  updateProcurement(id: string, patch: Partial<Procurement>) {
    state = { ...state, procurements: state.procurements.map((r) => (r.id === id ? { ...r, ...patch } : r)) };
    emit();
  },
  addContractor(c: Omit<Contractor, "id">) {
    state = { ...state, contractors: [...state.contractors, { ...c, id: uid() }] };
    emit();
  },
  updateContractor(id: string, patch: Partial<Contractor>) {
    state = { ...state, contractors: state.contractors.map((c) => (c.id === id ? { ...c, ...patch } : c)) };
    emit();
  },
  addContractorPayment(p: Omit<ContractorPayment, "id">) {
    state = { ...state, contractorPayments: [{ ...p, id: uid() }, ...state.contractorPayments] };
    emit();
  },
  updateContractorPayment(id: string, patch: Partial<ContractorPayment>) {
    state = { ...state, contractorPayments: state.contractorPayments.map((p) => (p.id === id ? { ...p, ...patch } : p)) };
    emit();
  },
  addCustomerPayment(p: Omit<CustomerPayment, "id">) {
    state = { ...state, customerPayments: [{ ...p, id: uid() }, ...state.customerPayments] };
    emit();
  },
  updateCustomerPayment(id: string, patch: Partial<CustomerPayment>) {
    state = { ...state, customerPayments: state.customerPayments.map((p) => (p.id === id ? { ...p, ...patch } : p)) };
    emit();
  },
  addFund(f: Omit<Fund, "id">) {
    state = { ...state, funds: [{ ...f, id: uid() }, ...state.funds] };
    emit();
  },
  updateFund(id: string, patch: Partial<Fund>) {
    state = { ...state, funds: state.funds.map((f) => (f.id === id ? { ...f, ...patch } : f)) };
    emit();
  },
  addOfficeExpense(e: Omit<OfficeExpense, "id">) {
    state = { ...state, officeExpenses: [{ ...e, id: uid() }, ...state.officeExpenses] };
    emit();
  },
  updateOfficeExpense(id: string, patch: Partial<OfficeExpense>) {
    state = { ...state, officeExpenses: state.officeExpenses.map((e) => (e.id === id ? { ...e, ...patch } : e)) };
    emit();
  },
};

export const today = () => new Date().toISOString().slice(0, 10);