import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Loader2 } from "lucide-react";
import { InvoiceTemplate, InvoiceData, InvoiceItem } from "../invoices/invoice-template";
import { toPng } from "html-to-image";
import jsPDF from "jspdf";

export function CreateInvoiceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [projectId, setProjectId] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [dueDate, setDueDate] = useState("");
  
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", quantity: 1, rate: 0, amount: 0 }
  ]);
  
  const [generatedInvoiceNo, setGeneratedInvoiceNo] = useState<string>("");

  const { data: projects = [] } = useQuery({
    queryKey: ["projects"],
    queryFn: api.getProjects,
  });

  const selectedProject = projects.find((p: any) => p._id === projectId || p.id === projectId);

  // Auto-calculate amounts
  useEffect(() => {
    setItems(currentItems => 
      currentItems.map(item => ({
        ...item,
        amount: item.quantity * item.rate
      }))
    );
  }, [JSON.stringify(items.map(i => ({ q: i.quantity, r: i.rate })))]);

  const totalAmount = items.reduce((sum, item) => sum + item.amount, 0);

  const handleAddItem = () => {
    setItems([...items, { description: "", quantity: 1, rate: 0, amount: 0 }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof InvoiceItem, value: any) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };



  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectId || items.length === 0 || !customerName || !customerPhone) {
      alert("Please fill in all required fields and add at least one item.");
      return;
    }

    try {
      setLoading(true);
      
      // 1. Create invoice in DB to get Invoice Number
      const invoiceData = {
        date,
        dueDate,
        customerName,
        customerPhone,
        project: projectId,
        items,
        status: "Unpaid"
      };
      
      const createdInvoice = await api.createInvoice(invoiceData);
      setGeneratedInvoiceNo(createdInvoice.invoiceNumber);

      // We need a short delay for React to render the hidden InvoiceTemplate with the new invoice number
      setTimeout(async () => {
        try {
          if (!printRef.current) throw new Error("Template not found");
          
          // 2. Generate PDF using html-to-image to bypass Tailwind v4 oklch issues
          const dataUrl = await toPng(printRef.current, { pixelRatio: 2, skipFonts: true });
          const pdf = new jsPDF("p", "mm", "a4");
          const pdfWidth = pdf.internal.pageSize.getWidth();
          
          // Image original dimensions for a4 aspect ratio 
          // (assuming the ref matches the A4 ratio set by 210mm x 297mm)
          const imgProps = pdf.getImageProperties(dataUrl);
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          
          pdf.addImage(dataUrl, "PNG", 0, 0, pdfWidth, pdfHeight);
          
          // Get Base64 Data URI
          const pdfBase64 = pdf.output("datauristring");

          // 3. Send Base64 to backend to upload securely
          await api.updateInvoice(createdInvoice._id, { pdfBase64 });

          queryClient.invalidateQueries({ queryKey: ["invoices"] });
          setLoading(false);
          onOpenChange(false);
          // Reset form
          setCustomerName("");
          setCustomerPhone("");
          setProjectId("");
          setItems([{ description: "", quantity: 1, rate: 0, amount: 0 }]);
          setGeneratedInvoiceNo("");
        } catch (err) {
          console.error("PDF/Upload Error:", err);
          alert("Invoice was created, but PDF upload failed.");
          setLoading(false);
          onOpenChange(false);
        }
      }, 500);

    } catch (error) {
      console.error(error);
      alert("Failed to create invoice.");
      setLoading(false);
    }
  };

  const invoiceData: InvoiceData = {
    invoiceNumber: generatedInvoiceNo,
    date,
    dueDate,
    customerName,
    customerPhone,
    projectInfo: selectedProject?.plot,
    items,
    totalAmount
  };

  return (
    <>
      <Dialog open={open} onOpenChange={!loading ? onOpenChange : undefined}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Professional Invoice</DialogTitle>
            <DialogDescription>Fill in the details below. A beautiful PDF will be generated and saved to history automatically.</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6 mt-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Customer Name</Label>
                <Input required value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="John Doe" />
              </div>
              <div className="space-y-2">
                <Label>WhatsApp Number</Label>
                <Input required value={customerPhone} onChange={e => setCustomerPhone(e.target.value)} placeholder="03001234567" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Project / Plot</Label>
                <Select value={projectId} onValueChange={setProjectId}>
                  <SelectTrigger><SelectValue placeholder="Select Project" /></SelectTrigger>
                  <SelectContent>
                    {projects.map((p: any) => (
                      <SelectItem key={p._id || p.id} value={p._id || p.id}>{p.plot}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Invoice Date</Label>
                <Input type="date" required value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Due Date</Label>
                <Input type="date" required value={dueDate} onChange={e => setDueDate(e.target.value)} />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Invoice Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="gap-2">
                  <Plus className="h-4 w-4" /> Add Item
                </Button>
              </div>
              
              <div className="border rounded-md divide-y divide-border">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-muted/10">
                    <div className="flex-1 space-y-1">
                      <Input placeholder="Description (e.g. Grey Structure Payment)" value={item.description} onChange={e => updateItem(i, "description", e.target.value)} required />
                    </div>
                    <div className="w-24 space-y-1">
                      <Input type="number" min={1} placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, "quantity", Number(e.target.value))} required />
                    </div>
                    <div className="w-32 space-y-1">
                      <Input type="number" placeholder="Rate" value={item.rate} onChange={e => updateItem(i, "rate", Number(e.target.value))} required />
                    </div>
                    <div className="w-32 text-right font-medium text-sm">
                      PKR {item.amount.toLocaleString()}
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(i)} className="text-red-500 shrink-0 h-9 w-9">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="text-right font-semibold text-lg pt-2">
                Total: PKR {totalAmount.toLocaleString()}
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
              <Button type="submit" className="bg-[color:var(--sre-blue)] text-white" disabled={loading}>
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating PDF...</> : "Create & Generate PDF"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Hidden PDF Template Container */}
      <div className="fixed top-0 left-0 -z-50 opacity-0 pointer-events-none w-[210mm]">
        <InvoiceTemplate ref={printRef} data={invoiceData} />
      </div>
    </>
  );
}
