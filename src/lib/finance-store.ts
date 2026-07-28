import { useSyncExternalStore } from "react";
import { projects } from "./projects-data";

export type MaterialCategory = "bricks" | "cement" | "steel" | "sand" | "crush" | "other";
export const MATERIAL_CATEGORY_OPTIONS: MaterialCategory[] = [
  "bricks",
  "cement",
  "steel",
  "sand",
  "crush",
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
  "Home expense",
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
  procurements: [],
  contractors: [],
  contractorPayments: [],
  customerPayments: [],
  funds: [],
  officeExpenses: [],
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