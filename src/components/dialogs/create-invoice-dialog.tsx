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
import { toJpeg } from "html-to-image";
import jsPDF from "jspdf";

export function CreateInvoiceDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const queryClient = useQueryClient();
  const printRef = useRef<HTMLDivElement>(null);
  
  const [loading, setLoading] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [propertyDetails, setPropertyDetails] = useState("");
  const [officeService, setOfficeService] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [totalPropertyAmount, setTotalPropertyAmount] = useState<number>(0);
  
  const [items, setItems] = useState<InvoiceItem[]>([
    { description: "", date: new Date().toISOString().split("T")[0], amount: 0 }
  ]);
  
  const [generatedInvoiceNo, setGeneratedInvoiceNo] = useState<string>("");

  const totalPaid = items.reduce((sum, item) => sum + item.amount, 0);
  const remainingBalance = totalPropertyAmount - totalPaid;

  const handleAddItem = () => {
    setItems([...items, { description: "", date: new Date().toISOString().split("T")[0], amount: 0 }]);
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
    if (items.length === 0 || !customerName || !customerPhone || totalPropertyAmount <= 0) {
      alert("Please fill in all required fields, total property amount, and add at least one payment.");
      return;
    }

    try {
      setLoading(true);
      
      // 1. Create invoice in DB to get Invoice Number
      const invoiceData = {
        date,
        customerName,
        customerPhone,
        customerEmail,
        propertyDetails,
        officeService,
        totalPropertyAmount,
        items,
        status: "Unpaid"
      };
      
      const createdInvoice = await api.createInvoice(invoiceData);
      setGeneratedInvoiceNo(createdInvoice.invoiceNumber);

      // We need a short delay for React to render the hidden InvoiceTemplate with the new invoice number
      setTimeout(async () => {
        try {
          if (!printRef.current) throw new Error("Template not found");
          
          // 2. Generate PDF using toJpeg to drastically reduce file size below Cloudinary's 10MB limit
          const dataUrl = await toJpeg(printRef.current, { pixelRatio: 2, quality: 0.95, skipFonts: true, backgroundColor: '#ffffff' });
          const pdf = new jsPDF("p", "mm", "a4");
          const pdfWidth = pdf.internal.pageSize.getWidth();
          
          // Image original dimensions for a4 aspect ratio 
          // (assuming the ref matches the A4 ratio set by 210mm x 297mm)
          const imgProps = pdf.getImageProperties(dataUrl);
          const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
          
          pdf.addImage(dataUrl, "JPEG", 0, 0, pdfWidth, pdfHeight);
          
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
          setCustomerEmail("");
          setPropertyDetails("");
          setOfficeService("");
          setTotalPropertyAmount(0);
          setItems([{ description: "", date: new Date().toISOString().split("T")[0], amount: 0 }]);
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
    customerName,
    customerPhone,
    customerEmail,
    propertyDetails,
    officeService,
    totalPropertyAmount,
    items,
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
              <div className="space-y-2">
                <Label>Email (Optional)</Label>
                <Input value={customerEmail} onChange={e => setCustomerEmail(e.target.value)} placeholder="john@example.com" />
              </div>
              <div className="space-y-2">
                <Label>Invoice Date</Label>
                <Input type="date" required value={date} onChange={e => setDate(e.target.value)} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Property / Plot Details</Label>
                <Input value={propertyDetails} onChange={e => setPropertyDetails(e.target.value)} placeholder="e.g. 5 Marla Plot, Block A" />
              </div>
              <div className="space-y-2">
                <Label>Office Service</Label>
                <Input value={officeService} onChange={e => setOfficeService(e.target.value)} placeholder="e.g. Consultancy / File Transfer" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Total Property / Plot Amount (PKR)</Label>
              <Input type="number" required value={totalPropertyAmount || ""} onChange={e => setTotalPropertyAmount(Number(e.target.value))} placeholder="e.g. 5000000" className="text-lg font-semibold" />
            </div>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Payments / Installments Received</Label>
                <Button type="button" variant="outline" size="sm" onClick={handleAddItem} className="gap-2">
                  <Plus className="h-4 w-4" /> Add Payment
                </Button>
              </div>
              
              <div className="border rounded-md divide-y divide-border">
                {items.map((item, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-muted/10">
                    <div className="flex-1 space-y-1">
                      <Input placeholder="Description (e.g. Down Payment)" value={item.description} onChange={e => updateItem(i, "description", e.target.value)} required />
                    </div>
                    <div className="w-40 space-y-1">
                      <Input type="date" value={item.date} onChange={e => updateItem(i, "date", e.target.value)} required />
                    </div>
                    <div className="w-40 space-y-1">
                      <Input type="number" placeholder="Amount (PKR)" value={item.amount || ""} onChange={e => updateItem(i, "amount", Number(e.target.value))} required />
                    </div>
                    <Button type="button" variant="ghost" size="icon" onClick={() => handleRemoveItem(i)} className="text-red-500 shrink-0 h-9 w-9">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex flex-col items-end text-right font-semibold text-sm pt-4 space-y-1">
                <div>Total Property Amount: PKR {totalPropertyAmount.toLocaleString()}</div>
                <div className="text-emerald-600">Total Received: PKR {totalPaid.toLocaleString()}</div>
                <div className="text-xl font-bold text-[color:var(--sre-red)] pt-2 border-t mt-2 w-64">
                  Balance: PKR {remainingBalance.toLocaleString()}
                </div>
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
