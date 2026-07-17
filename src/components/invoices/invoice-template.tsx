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

// We use hardcoded inline hex colors to prevent html2canvas crashing on Tailwind v4 oklch colors.
export const InvoiceTemplate = React.forwardRef<HTMLDivElement, { data: InvoiceData }>(({ data }, ref) => {
  return (
    <div
      ref={ref}
      className="p-12 mx-auto"
      style={{
        width: "210mm",
        minHeight: "297mm",
        boxSizing: "border-box",
        fontFamily: "'Inter', sans-serif",
        backgroundColor: "#ffffff",
        color: "#000000"
      }}
    >
      {/* Header */}
      <div className="flex justify-between items-start border-b-2 pb-8 mb-8" style={{ borderColor: "#f3f4f6" }}>
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight mb-2" style={{ color: "#0ea5e9" }}>INVOICE</h1>
          <p className="text-sm font-medium uppercase tracking-widest" style={{ color: "#6b7280" }}>{data.invoiceNumber || "DRAFT"}</p>
        </div>
        <div className="text-right flex flex-col items-end">
          <div className="flex items-center gap-3">
            <div className="text-right">
              <h2 className="text-xl font-bold leading-none mb-1" style={{ color: "#111827" }}>SIALKOT</h2>
              <p className="text-sm font-medium uppercase tracking-wider" style={{ color: "#6b7280" }}>Real Estate</p>
            </div>
          </div>
          <div className="mt-4 text-xs space-y-1" style={{ color: "#6b7280" }}>
            <p>123 Sialkot Citi Housing, Pakistan</p>
            <p>+92 300 1234567</p>
            <p>billing@sre.pk</p>
          </div>
        </div>
      </div>

      {/* Bill To & Details */}
      <div className="flex justify-between mb-12">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: "#9ca3af" }}>Bill To</p>
          <h3 className="text-lg font-bold" style={{ color: "#111827" }}>{data.customerName || "Customer Name"}</h3>
          <p className="text-sm mt-1" style={{ color: "#4b5563" }}>{data.customerPhone || "Phone Number"}</p>
          {data.projectInfo && <p className="text-sm mt-1" style={{ color: "#4b5563" }}>Project: {data.projectInfo}</p>}
        </div>
        <div className="text-right flex gap-12">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#9ca3af" }}>Invoice Date</p>
            <p className="text-sm font-semibold" style={{ color: "#111827" }}>{new Date(data.date).toLocaleDateString()}</p>
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: "#9ca3af" }}>Due Date</p>
            <p className="text-sm font-semibold" style={{ color: "#111827" }}>{new Date(data.dueDate).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mb-12 border rounded-lg overflow-hidden" style={{ borderColor: "#e5e7eb" }}>
        <table className="w-full text-left text-sm">
          <thead style={{ backgroundColor: "#f9fafb" }}>
            <tr>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs" style={{ color: "#6b7280" }}>Description</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right" style={{ color: "#6b7280" }}>Qty</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right" style={{ color: "#6b7280" }}>Rate</th>
              <th className="px-6 py-4 font-bold uppercase tracking-wider text-xs text-right" style={{ color: "#6b7280" }}>Amount (PKR)</th>
            </tr>
          </thead>
          <tbody className="divide-y" style={{ borderColor: "#f3f4f6" }}>
            {data.items.map((item, i) => (
              <tr key={i} style={{ backgroundColor: "#ffffff" }}>
                <td className="px-6 py-5 font-medium" style={{ color: "#111827" }}>{item.description}</td>
                <td className="px-6 py-5 text-right tabular-nums" style={{ color: "#4b5563" }}>{item.quantity}</td>
                <td className="px-6 py-5 text-right tabular-nums" style={{ color: "#4b5563" }}>{fmtPKR(item.rate)}</td>
                <td className="px-6 py-5 font-medium text-right tabular-nums" style={{ color: "#111827" }}>{fmtPKR(item.amount)}</td>
              </tr>
            ))}
            {data.items.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center italic" style={{ color: "#9ca3af" }}>No items added yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Totals */}
      <div className="flex justify-end border-b pb-8 mb-8" style={{ borderColor: "#f3f4f6" }}>
        <div className="w-80">
          <div className="flex justify-between py-3">
            <span className="text-sm font-medium" style={{ color: "#6b7280" }}>Subtotal</span>
            <span className="text-sm font-medium tabular-nums" style={{ color: "#111827" }}>{fmtPKR(data.totalAmount)}</span>
          </div>
          <div className="flex justify-between py-4 border-t-2 mt-2" style={{ borderColor: "#111827" }}>
            <span className="text-base font-bold" style={{ color: "#111827" }}>Total</span>
            <span className="text-xl font-extrabold tabular-nums" style={{ color: "#0ea5e9" }}>PKR {fmtPKR(data.totalAmount)}</span>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center pt-8">
        <p className="text-sm font-medium mb-1" style={{ color: "#111827" }}>Thank you for your business!</p>
        <p className="text-xs" style={{ color: "#9ca3af" }}>If you have any questions concerning this invoice, contact billing@sre.pk</p>
      </div>
    </div>
  );
});

InvoiceTemplate.displayName = "InvoiceTemplate";
