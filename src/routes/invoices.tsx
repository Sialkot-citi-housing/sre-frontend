import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Loader2, Plus, FileText, Send, Trash2, Printer } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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
    const message = `Hello ${invoice.customerName},\n\nHere is your payment ledger ${invoice.invoiceNumber}.\n\nTotal Property Value: PKR ${fmtPKR(invoice.totalPropertyAmount)}\nTotal Received: PKR ${fmtPKR(invoice.items?.reduce((s:any,i:any)=>s+i.amount,0) || 0)}\n\nPlease find the PDF document attached.\n\nThank you for choosing Sialkot Real Estate!`;
    const encoded = encodeURIComponent(message);
    let phone = invoice.customerPhone.replace(/\D/g, "");
    if (!phone.startsWith("92") && phone.startsWith("0")) {
      phone = "92" + phone.slice(1);
    }
    window.open(`https://wa.me/${phone}?text=${encoded}`, "_blank");
  };

  // Native anchor tags are used in the JSX below to handle View and Download without JS fetch/window.open.

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
                <th className="px-4 py-3 font-medium text-right">Property Value</th>
                <th className="px-4 py-3 font-medium text-right">Received</th>
                <th className="px-4 py-3 font-medium text-right">Balance</th>
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
                    <td className="px-4 py-3 text-right font-medium">
                      PKR {fmtPKR(inv.totalPropertyAmount)}
                    </td>
                    <td className="px-4 py-3 text-right text-emerald-600 font-medium">
                      PKR {fmtPKR(inv.items?.reduce((s:any,i:any)=>s+i.amount,0) || 0)}
                    </td>
                    <td className="px-4 py-3 text-right text-red-600 font-medium">
                      PKR {fmtPKR(inv.totalPropertyAmount - (inv.items?.reduce((s:any,i:any)=>s+i.amount,0) || 0))}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                          {inv.pdfUrl && (
                            <>
                              <DropdownMenuItem asChild>
                                <a href={inv.pdfUrl} target="_blank" rel="noopener noreferrer" className="cursor-pointer w-full flex items-center">
                                  <FileText className="mr-2 h-4 w-4" /> View
                                </a>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <a href={inv.pdfUrl.replace('/upload/', '/upload/fl_attachment/')} download={`Invoice_${inv.invoiceNumber}.pdf`} className="cursor-pointer w-full flex items-center">
                                  <Printer className="mr-2 h-4 w-4" /> Download
                                </a>
                              </DropdownMenuItem>
                            </>
                          )}
                          <DropdownMenuItem onClick={() => shareOnWhatsApp(inv)} className="cursor-pointer text-emerald-600 focus:text-emerald-700">
                            <Send className="mr-2 h-4 w-4" /> Share
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this invoice?")) {
                                deleteMutation.mutate(inv._id);
                              }
                            }} 
                            className="cursor-pointer text-red-600 focus:text-red-700"
                          >
                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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
