import React from "react";
import { fmtPKR } from "@/lib/projects-data";
import { Phone, Mail, Globe, MapPin, CheckCircle2 } from "lucide-react";

export type InvoiceItem = {
  description: string;
  date: string;
  amount: number;
};

export type InvoiceData = {
  invoiceNumber?: string;
  date: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: InvoiceItem[];
  totalPropertyAmount: number;
};

function numberToWords(num: number): string {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
  
  const getWord = (n: number): string => {
    if (n < 20) return a[n];
    return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
  };
  
  const convert = (n: number): string => {
    if (n === 0) return 'Zero';
    if (n < 1000000000) {
      let result = '';
      const millions = Math.floor(n / 1000000);
      if (millions > 0) result += convert(millions) + ' Million ';
      const thousands = Math.floor((n % 1000000) / 1000);
      if (thousands > 0) result += convert(thousands) + ' Thousand ';
      const hundreds = Math.floor((n % 1000) / 100);
      if (hundreds > 0) result += getWord(hundreds) + ' Hundred ';
      const tens = n % 100;
      if (tens > 0) result += (hundreds > 0 ? 'and ' : '') + getWord(tens);
      return result.trim();
    }
    return n.toString();
  };
  return convert(Math.floor(num)) + " Rupees Only";
}

export const InvoiceTemplate = React.forwardRef<HTMLDivElement, { data: InvoiceData }>(({ data }, ref) => {
  const primaryColor = "#082041";
  const accentColor = "#D51017";

  return (
    <div
      ref={ref}
      className="mx-auto bg-white relative overflow-hidden"
      style={{
        width: "210mm",
        minHeight: "297mm",
        boxSizing: "border-box",
        fontFamily: "'Inter', sans-serif",
        color: "#333",
        fontSize: "10pt"
      }}
    >
      {/* HEADER SECTION */}
      <div className="flex relative h-[140px]">
        {/* Left Company Info */}
        <div className="flex items-center pt-8 pl-12 pr-4 w-[60%]">
          {/* Logo Approximation */}
          <div className="mr-6 flex flex-col items-center justify-center">
            <svg width="120" height="80" viewBox="0 0 120 80">
              <path d="M 10 50 Q 60 10 110 50" fill="none" stroke={primaryColor} strokeWidth="6" />
              <path d="M 40 40 L 60 15 L 80 40 Z" fill={accentColor} />
              <rect x="52" y="25" width="16" height="15" fill="white" />
              <rect x="56" y="29" width="3" height="3" fill={accentColor} />
              <rect x="61" y="29" width="3" height="3" fill={accentColor} />
              <rect x="56" y="34" width="3" height="3" fill={accentColor} />
              <rect x="61" y="34" width="3" height="3" fill={accentColor} />
              <text x="60" y="65" fontFamily="serif" fontSize="18" fontWeight="bold" fill={accentColor} textAnchor="middle">SIALKOT</text>
              <text x="60" y="75" fontFamily="serif" fontSize="10" fill={primaryColor} textAnchor="middle">REAL ESTATE</text>
            </svg>
          </div>
          
          <div className="border-l-2 border-gray-300 pl-6 space-y-1">
            <h1 className="text-xl font-bold tracking-widest text-[#082041]">SIALKOT REAL ESTATE</h1>
            <p className="text-[10px] text-[#082041] mb-2 font-medium">Building Trust, Delivering Excellence</p>
            <div className="text-[9px] text-gray-700 flex items-center gap-2 mt-2"><MapPin size={10} color={primaryColor}/> Citi Housing, Sialkot, Punjab, Pakistan</div>
            <div className="text-[9px] text-gray-700 flex items-center gap-2 mt-0.5"><Phone size={10} color={primaryColor}/> +92 300 1234567</div>
            <div className="text-[9px] text-gray-700 flex items-center gap-2 mt-0.5"><Mail size={10} color={primaryColor}/> info@sialkotrealestate.com</div>
            <div className="text-[9px] text-gray-700 flex items-center gap-2 mt-0.5"><Globe size={10} color={primaryColor}/> www.sialkotrealestate.com</div>
          </div>
        </div>

        {/* Right Geometric Shape */}
        <div 
          className="absolute right-0 top-0 h-full w-[45%]"
          style={{
            backgroundColor: primaryColor,
            clipPath: "polygon(20% 0, 100% 0, 100% 100%, 0 100%)",
            borderBottom: `6px solid ${accentColor}`
          }}
        >
          <div className="text-white pt-10 pl-24 space-y-2">
            <h1 className="text-4xl font-extrabold tracking-widest mb-4">INVOICE</h1>
            <p className="text-base font-medium">{data.invoiceNumber || "INV-DRAFT"}</p>
            <div className="pt-2 text-xs text-gray-200 space-y-1">
              <p>Issue Date: {new Date(data.date).toLocaleDateString("en-GB", {day:'numeric', month:'long', year:'numeric'})}</p>
            </div>
          </div>
        </div>
      </div>

      {/* TWO COLUMNS SECTION */}
      <div className="px-12 mt-10 flex gap-4">
        {/* Bill To */}
        <div className="flex-1">
          <div className="bg-[#082041] text-white text-[9px] font-bold px-3 py-1 mb-3 rounded-sm border-b-2 border-[#D51017]">CUSTOMER DETAILS</div>
          <h3 className="font-bold text-[#082041] text-[11px] mb-2">{data.customerName || "Customer Name"}</h3>
          <div className="text-[9px] text-gray-700 space-y-1 leading-relaxed pr-4">
            <p className="pt-1 flex items-center gap-1.5"><Phone size={10} className="text-[#082041]"/> {data.customerPhone}</p>
            {data.customerEmail && <p className="flex items-center gap-1.5"><Mail size={10} className="text-[#082041]"/> {data.customerEmail}</p>}
          </div>
        </div>

        {/* Payment Info */}
        <div className="flex-1">
          <div className="bg-[#082041] text-white text-[9px] font-bold px-3 py-1 mb-3 rounded-sm border-b-2 border-[#D51017]">PAYMENT INFORMATION</div>
          <div className="text-[9px] text-gray-700 grid grid-cols-[75px_1fr] gap-y-1.5 mb-2">
            <span className="text-gray-500 flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#082041]/10 flex items-center justify-center text-[#082041] text-[6px]">🏦</span> Bank</span>
            <span className="font-bold text-[#082041]">: Meezan Bank</span>
            
            <span className="text-gray-500 flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#082041]/10 flex items-center justify-center text-[#082041] text-[6px]">👤</span> Title</span>
            <span className="font-bold text-[#082041]">: Sialkot Real Estate</span>
            
            <span className="text-gray-500 flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#082041]/10 flex items-center justify-center text-[#082041] text-[6px]">🔢</span> A/C No.</span>
            <span className="font-bold text-[#082041]">: 1234 5678 9012 3456</span>
            
            <span className="text-gray-500 flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-[#082041]/10 flex items-center justify-center text-[#082041] text-[6px]">🌐</span> IBAN</span>
            <span className="font-bold text-[#082041]">: PK36MEZN001234</span>
          </div>
          <p className="text-[8px] text-gray-500 italic mt-2">Please make all payments to the above account.</p>
        </div>
      </div>

      {/* PAYMENTS TABLE SECTION */}
      <div className="px-12 mt-10">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#082041] text-white text-[9px]">
              <th className="py-2.5 px-4 font-semibold uppercase tracking-wider rounded-tl-md">#</th>
              <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Payment Description</th>
              <th className="py-2.5 px-4 font-semibold uppercase tracking-wider">Date</th>
              <th className="py-2.5 px-4 font-semibold uppercase tracking-wider text-right rounded-tr-md">Amount Paid (PKR)</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, idx) => (
              <tr key={idx} className="border-b border-gray-200 text-[10px]">
                <td className="py-3 px-4 font-medium text-gray-600">{idx + 1}</td>
                <td className="py-3 px-4 text-[#082041] font-medium">{item.description}</td>
                <td className="py-3 px-4 text-gray-700">{item.date}</td>
                <td className="py-3 px-4 text-right font-semibold text-[#082041] tabular-nums">{fmtPKR(item.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* TOTALS & TERMS */}
      <div className="px-12 mt-6 flex justify-between relative">
        {/* Watermark Logo Center */}
        <div className="absolute top-1/2 left-[45%] opacity-[0.03] pointer-events-none transform -translate-x-1/2 -translate-y-1/2 scale-150">
            <svg width="240" height="160" viewBox="0 0 120 80">
              <path d="M 10 50 Q 60 10 110 50" fill="none" stroke="black" strokeWidth="6" />
              <path d="M 40 40 L 60 15 L 80 40 Z" fill="black" />
              <text x="60" y="65" fontFamily="serif" fontSize="18" fontWeight="bold" fill="black" textAnchor="middle">SIALKOT</text>
              <text x="60" y="75" fontFamily="serif" fontSize="10" fill="black" textAnchor="middle">REAL ESTATE</text>
            </svg>
        </div>

        {/* Terms */}
        <div className="w-[45%] pt-4 relative z-10">
          <h4 className="font-bold text-[#082041] text-[10px] uppercase mb-3 border-b border-gray-200 pb-1 w-max">Terms & Conditions</h4>
          <ul className="text-[9px] text-[#082041] font-medium space-y-2">
            <li className="flex items-start gap-2"><CheckCircle2 size={12} className="text-[#082041]/60 mt-0.5 shrink-0"/> Please ensure payment within the due date.</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={12} className="text-[#082041]/60 mt-0.5 shrink-0"/> All payments are final and non-refundable.</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={12} className="text-[#082041]/60 mt-0.5 shrink-0"/> Installment schedules must be strictly followed.</li>
            <li className="flex items-start gap-2"><CheckCircle2 size={12} className="text-[#082041]/60 mt-0.5 shrink-0"/> This is a computer generated invoice; no signature required.</li>
          </ul>
        </div>

        {/* Totals Box */}
        <div className="w-[45%] text-[10px] relative z-10">
          <div className="flex justify-between py-2 border-b border-gray-200 px-4">
            <span className="font-bold text-[#082041] tracking-wide">TOTAL PROPERTY VALUE</span>
            <span className="tabular-nums text-gray-700">{fmtPKR(data.totalPropertyAmount || 0)}</span>
          </div>
          <div className="flex justify-between py-2 border-b border-gray-200 px-4">
            <span className="font-bold text-emerald-700 tracking-wide">TOTAL RECEIVED</span>
            <span className="tabular-nums font-medium text-emerald-700">{fmtPKR(data.items.reduce((s,i)=>s+i.amount,0))}</span>
          </div>
          <div className="bg-[#082041] text-white p-4 pt-3 pb-3 mt-4 rounded-sm shadow-md flex justify-between items-center">
            <div className="text-[9px] uppercase font-bold text-gray-300 tracking-wider">REMAINING BALANCE</div>
            <div className="text-xl font-bold tabular-nums tracking-wide">PKR {fmtPKR((data.totalPropertyAmount || 0) - data.items.reduce((s,i)=>s+i.amount,0))}</div>
          </div>
        </div>
      </div>

      {/* FOOTER */}
      <div className="absolute bottom-[90px] left-0 w-full px-12 flex justify-between items-end">
        {/* Amount in words */}
        <div className="bg-[#082041] rounded-r-full py-3 px-6 pr-12 text-white flex items-center gap-4 relative -ml-12 w-[65%] shadow-md">
          <div className="border-2 border-white/40 rounded-full w-10 h-10 flex justify-center items-center shrink-0">
            <span className="font-serif italic font-bold text-sm">Rs</span>
          </div>
          <div>
            <div className="text-[8px] uppercase tracking-wider text-gray-300 mb-0.5">Amount in Words</div>
            <div className="text-[11px] font-medium leading-tight max-w-[320px]">
              {numberToWords((data.totalPropertyAmount || 0) - data.items.reduce((s,i)=>s+i.amount,0))} (Remaining)
            </div>
          </div>
        </div>

        {/* Signature */}
        <div className="text-center w-48 -mr-4">
          <div className="border-b border-[#082041] pb-2 mb-2 flex justify-center">
             {/* Simple handwritten signature simulation */}
             <span className="font-signature text-4xl text-gray-800 italic pr-4" style={{fontFamily: "'Brush Script MT', 'Dancing Script', cursive"}}>ARehman</span>
          </div>
          <div className="text-[9px] font-bold text-[#082041]">Authorized Signature</div>
          <div className="text-[8px] text-gray-500">For Sialkot Real Estate</div>
        </div>
      </div>

      {/* ABSOLUTE BOTTOM */}
      <div className="absolute bottom-0 left-0 w-full">
        {/* Decorative thin lines */}
        <div className="h-0.5 bg-gray-200 w-full mb-1"></div>
        <div className="h-[3px] bg-[#D51017] w-full mb-2"></div>
        
        <div className="flex justify-between items-center px-12 pb-[22px] pt-2 relative z-10">
          <div className="text-center w-full">
            <p className="text-[11px] font-bold text-[#082041] mb-1 tracking-wide">Thank you for choosing Sialkot Real Estate.</p>
            <p className="text-[10px] text-gray-500 italic font-serif">We build more than structures, we build relationships.</p>
          </div>
        </div>
        
        {/* Right Corner Banner */}
        <div 
          className="absolute right-0 bottom-0 bg-[#082041] text-white text-[9px] py-4 pl-[48px] pr-8 flex items-center gap-4 z-20"
          style={{ clipPath: "polygon(20% 0, 100% 0, 100% 100%, 0 100%)" }}
        >
          <div className="border border-white/40 rounded-full p-2"><CheckCircle2 size={16}/></div>
          <div className="leading-tight font-bold tracking-[0.2em] space-y-1">
            <div>QUALITY</div>
            <div>TRUST</div>
            <div>COMMITMENT</div>
          </div>
        </div>
      </div>

    </div>
  );
});

InvoiceTemplate.displayName = "InvoiceTemplate";
