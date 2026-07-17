import React from "react";
import { fmtPKR } from "@/lib/projects-data";

export type InvoiceItem = {
  description: string;
  quantity: number;
  rate: number;
  amount: number;
};

export type InvoiceData = {
  invoiceNumber?: string;
  date: string;
  dueDate: string;
  customerName: string;
  customerPhone: string;
  projectInfo?: string;
  items: InvoiceItem[];
  totalAmount: number;
};

export const InvoiceTemplate = React.forwardRef<HTMLDivElement, { data: InvoiceData }>(({ data }, ref) => {
  return (
    <div
      ref={ref}
      className="bg-white p-12 text-black mx-auto"
      style={{
        width: "210mm",
        minHeight: "297mm",
        boxSizing: "border-box",
        fontFamily: "'Inter', sans-serif",
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 border-gray-100 pb-8 mb-8">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight text-[color:var(--sre-blue)] mb-2">INVOICE</h1>
          <p className="text-sm font-medium text-gray-500 uppercase tracking-widest">{data.invoiceNumber || "DRAFT"}</p>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <h2 className="text-xl font-bold text-gray-900 leading-none mb-1">SIALKOT</h2>
              <p className="text-sm font-medium text-gray-500 uppercase tracking-wider">Real Estate</p>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500 space-y-1">
            <p>123 Sialkot Citi Housing, Pakistan</p>
            <p>+92 300 1234567</p>
            <p>billing@sre.pk</p>
          </div>
        </div>
      </div>

      {/* Bill To & Details */}
      <div className="flex justify-between mb-12">
        <div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Bill To</p>
          <h3 className="text-lg font-bold text-gray-900">{data.customerName || "Customer Name"}</h3>
          <p className="text-sm text-gray-600 mt-1">{data.customerPhone || "Phone Number"}</p>
          {data.projectInfo && <p className="text-sm text-gray-600 mt-1">Project: {data.projectInfo}</p>}
        </div>
        <div className="text-right flex gap-12">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Invoice Date</p>
            <p className="text-sm font-semibold text-gray-900">{new Date(data.date).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Due Date</p>
            <p className="text-sm font-semibold text-gray-900">{new Date(data.dueDate).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mb-12 border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs">Description</th>
              <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Qty</th>
              <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Rate</th>
              <th className="px-6 py-4 font-bold text-gray-500 uppercase tracking-wider text-xs text-right">Amount (PKR)</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {data.items.map((item, i) => (
              <tr key={i} className="bg-white">
                <td className="px-6 py-5 font-medium text-gray-900">{item.description}</td>
                <td className="px-6 py-5 text-gray-600 text-right tabular-nums">{item.quantity}</td>
                <td className="px-6 py-5 text-gray-600 text-right tabular-nums">{fmtPKR(item.rate)}</td>
                <td className="px-6 py-5 font-medium text-gray-900 text-right tabular-nums">{fmtPKR(item.amount)}</td>
              </tr>
            ))}
            {data.items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-gray-400 italic">No items added yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end border-b border-gray-100 pb-8 mb-8">
        <div className="w-80">
          <div className="flex justify-between py-3">
            <span className="text-sm font-medium text-gray-500">Subtotal</span>
            <span className="text-sm font-medium text-gray-900 tabular-nums">{fmtPKR(data.totalAmount)}</span>
          </div>
          <div className="flex justify-between py-4 border-t-2 border-gray-900 mt-2">
            <span className="text-base font-bold text-gray-900">Total</span>
            <span className="text-xl font-extrabold text-[color:var(--sre-blue)] tabular-nums">PKR {fmtPKR(data.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-8">
        <p className="text-sm font-medium text-gray-900 mb-1">Thank you for your business!</p>
        <p className="text-xs text-gray-400">If you have any questions concerning this invoice, contact billing@sre.pk</p>
      </div>
    </div>
  );
});

InvoiceTemplate.displayName = "InvoiceTemplate";
