import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2, Plus, FileText, Send, Trash2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CreateInvoiceDialog } from "@/components/dialogs/create-invoice-dialog";
import { fmtPKR } from "@/lib/projects-data";

export const Route = createFileRoute("/invoices")({
  component: InvoicesPage,
});

function InvoicesPage() {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: invoices = [], isLoading: invLoad } = useQuery({
    queryKey: ["invoices"],
    queryFn: api.getInvoices,
  });

  const deleteMutation = useMutation({
    mutationFn: api.deleteInvoice,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["invoices"] });
    },
  });

  const shareOnWhatsApp = (invoice: any) => {
    if (!invoice.pdfUrl) {
      alert("This invoice does not have a PDF generated yet.");
      return;
    }
    const message = `Hello ${invoice.customerName},\n\nHere is your invoice ${invoice.invoiceNumber} for ${invoice.project?.plot || "your project"}.\n\nTotal Amount: PKR ${fmtPKR(invoice.totalAmount)}\nDue Date: ${new Date(invoice.dueDate).toLocaleDateString()}\n\nPlease find the PDF document attached.\n\nThank you for choosing Sialkot Real Estate!`;
    const encoded = encodeURIComponent(message);
    let phone = invoice.customerPhone.replace(/\D/g, "");
    if (!phone.startsWith("92") && phone.startsWith("0")) {
      phone = "92" + phone.slice(1);
    }
    window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank");
  };

  const downloadInvoice = async (url: string, invoiceNumber: string) => {
    try {
      const res = await fetch(url);
      const blob = await res.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `Invoice_${invoiceNumber}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (e) {
      window.open(url, "_blank");
    }
  };

  if (invLoad) {
    return (
      <AppShell title="Invoices" subtitle="Manage and share client invoices">
        <div className="flex h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-[color:var(--sre-blue)]" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Invoices" subtitle="Manage and share client invoices">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-foreground">Client Invoices</h2>
          <p className="text-sm text-muted-foreground">Create invoices and share via WhatsApp</p>
        </div>
        <Button onClick={() => setIsCreateOpen(true)} className="gap-2 bg-[color:var(--sre-blue)] hover:bg-[color:var(--sre-blue)]/90 text-white">
          <Plus className="h-4 w-4" /> New Invoice
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-foreground">
            <thead className="bg-muted/50 text-muted-foreground">
              <tr>
                <th className="px-4 py-3 font-medium">Invoice #</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Project (Plot)</th>
                <th className="px-4 py-3 font-medium text-right">Total Amount</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No invoices created yet.
                  </td>
                </tr>
              ) : (
                invoices.map((inv: any) => (
                  <tr key={inv._id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-3 font-medium text-[color:var(--sre-blue)]">
                      {inv.invoiceNumber}
                    </td>
                    <td className="px-4 py-3">{new Date(inv.date).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div>{inv.customerName}</div>
                      <div className="text-xs text-muted-foreground">{inv.customerPhone}</div>
                    </td>
                    <td className="px-4 py-3">{inv.project?.plot || "N/A"}</td>
                    <td className="px-4 py-3 text-right font-medium">
                      PKR {fmtPKR(inv.totalAmount)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={inv.status === "Paid" ? "default" : "destructive"} className={inv.status === "Paid" ? "bg-emerald-500 hover:bg-emerald-600" : ""}>
                        {inv.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {inv.pdfUrl && (
                          <Button
                            variant="outline"
                            size="icon"
                            title="Download PDF"
                            onClick={() => downloadInvoice(inv.pdfUrl, inv.invoiceNumber)}
                            className="h-8 w-8 text-muted-foreground hover:text-foreground"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="icon"
                          title="Share on WhatsApp"
                          onClick={() => shareOnWhatsApp(inv)}
                          className="h-8 w-8 text-emerald-600 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700"
                        >
                          <Send className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          title="Delete Invoice"
                          onClick={() => {
                            if (confirm("Are you sure you want to delete this invoice?")) {
                              deleteMutation.mutate(inv._id);
                            }
                          }}
                          className="h-8 w-8 text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <CreateInvoiceDialog open={isCreateOpen} onOpenChange={setIsCreateOpen} />
    </AppShell>
  );
}
