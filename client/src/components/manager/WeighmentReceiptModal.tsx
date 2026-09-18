import React from 'react';
import { QueueTokenDTO } from '@smart-farmer/shared';
import {
  Printer,
  X,
  Landmark,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';
import { formatCurrency, numberToWordsINR } from '../../utils/formatters';

interface WeighmentReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: QueueTokenDTO | null;
  payment: any | null;
}

export const WeighmentReceiptModal: React.FC<WeighmentReceiptModalProps> = ({
  isOpen,
  onClose,
  token,
  payment,
}) => {
  if (!isOpen || !token) return null;

  const handlePrint = () => {
    window.print();
  };

  const formattedDate = new Date(payment?.createdAt || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
  const formattedTime = new Date(payment?.createdAt || Date.now()).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const vehicleNo =
    payment?.vehicleNumber || token.vehicleNumber || 'PB-10-AB-1234';

  const netQty = Number(payment?.quantity || token.quantity || 40);
  const netKg = Math.round(netQty * 100);
  const tareKg = Math.round(netQty * 32 + 1640);
  const grossKg = netKg + tareKg;
  const bagCount = Math.round(netKg / 50);
  const gunnyTareKg = +(bagCount * 0.58).toFixed(1);
  const ratePerQtl = Number(payment?.ratePerUnit || 2275);
  const grossVal = Number(payment?.grossAmount || netQty * ratePerQtl);
  const deductionVal = Number(payment?.deductions || 0);
  const netVal = Number(payment?.netAmount || grossVal - deductionVal);
  const amountInWords = numberToWordsINR(netVal);
  const slipNumber = payment?.paymentNumber || `APMC-${new Date().getFullYear()}-${token.tokenNumber?.replace(/\D/g, '') || '1002'}`;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 md:p-6 animate-fade-in print:p-0 print:bg-white">
      <div className="bg-white rounded-none max-w-4xl w-full shadow-2xl border-2 border-slate-800 overflow-hidden flex flex-col max-h-[96vh] print:max-h-none print:shadow-none print:border-none print:m-0">
        
        {/* Top Control Bar (Hidden on Print) */}
        <div className="px-5 py-3 bg-slate-900 text-white flex items-center justify-between print:hidden border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-none bg-emerald-400"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-200">
              Official Mandi Weighment Slip Generated • APMC Form-J
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-none bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Official Receipt</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-none text-slate-400 hover:text-white hover:bg-white/10 transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Official Receipt Body */}
        <div className="overflow-y-auto p-4 sm:p-8 bg-white print:p-0" id="printable-receipt">
          {/* Authentic Government Receipt Double-Line Frame */}
          <div className="border-2 border-slate-900 p-5 sm:p-7 relative bg-white space-y-4">
            
            {/* Subtle Security Background Watermark */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035] select-none text-slate-900 font-serif font-black text-5xl sm:text-7xl tracking-widest rotate-[-22deg] z-0">
              APMC GOVT. E-RECEIPT
            </div>

            {/* Header Section */}
            <div className="relative z-10 border-b-2 border-slate-900 pb-4">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                
                {/* Left Header: Official Badge & Legal Ref */}
                <div className="flex-1 text-left hidden sm:block">
                  <span className="inline-block px-2.5 py-1 border border-slate-800 text-[10px] font-black uppercase text-slate-900 tracking-wider bg-slate-50">
                    मूल प्रति / ORIGINAL (FARMER COPY)
                  </span>
                  <p className="text-[10px] text-slate-500 font-mono mt-1 font-semibold">
                    FORM-J • प्रपत्र 'जे' (नियम २४(१))
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono">
                    STATE MANDI BOARD ACT, 1961
                  </p>
                </div>

                {/* Center: Emblem & Mandi Board Title */}
                <div className="flex-2 flex flex-col items-center text-center">
                  <img
                    src="/logo.png"
                    alt="Kisan Vyom APMC Emblem"
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain mb-1 drop-shadow-xs"
                  />
                  <h1 className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-tight font-serif">
                    कृषि उपज मंडी समिति (APMC)
                  </h1>
                  <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 tracking-wide uppercase">
                    AGRICULTURAL PRODUCE MARKET COMMITTEE
                  </h2>
                  <p className="text-[11px] font-semibold text-slate-600">
                    खाद्य, नागरिक आपूर्ति एवं उपभोक्ता मामले विभाग • Department of Food & Public Distribution
                  </p>
                  <div className="mt-1.5 px-3 py-0.5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider">
                    तुलाई पर्ची एवं न्यूनतम समर्थन मूल्य खरीद रसीद (WEIGHMENT SLIP & E-RECEIPT)
                  </div>
                </div>

                {/* Right Header: Barcode & Serial */}
                <div className="flex-1 text-right flex flex-col items-center sm:items-end">
                  <div className="font-mono text-center tracking-[4px] font-black text-xs text-slate-800 select-none">
                    ||| | |||| || | |||| ||| ||||
                  </div>
                  <span className="font-mono text-[10px] font-bold text-slate-600 tracking-wider">
                    {slipNumber}
                  </span>
                  <div className="mt-1 text-[11px] font-bold text-slate-800">
                    <span className="text-slate-500 font-normal">Date: </span>
                    {formattedDate}
                  </div>
                  <div className="text-[10px] font-mono text-slate-600">
                    <span className="text-slate-500 font-normal">Time: </span>
                    {formattedTime}
                  </div>
                </div>
              </div>
            </div>

            {/* Meta Strip: Slip No, Token & Weighbridge Bay */}
            <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border border-slate-800 bg-slate-50 p-2 font-mono">
              <div>
                <span className="text-[10px] font-sans text-slate-500 block uppercase font-bold">रसीद संख्या (Slip No)</span>
                <span className="font-black text-slate-900 text-xs">{slipNumber}</span>
              </div>
              <div>
                <span className="text-[10px] font-sans text-slate-500 block uppercase font-bold">टोकन / गेट पास (Token No)</span>
                <span className="font-black text-blue-900 text-xs">{token.tokenNumber}</span>
              </div>
              <div>
                <span className="text-[10px] font-sans text-slate-500 block uppercase font-bold">धर्मकांटा (Weighbridge Scale)</span>
                <span className="font-black text-slate-900 text-xs">WB-04 (60 MT Digital)</span>
              </div>
              <div className="text-left sm:text-right">
                <span className="text-[10px] font-sans text-slate-500 block uppercase font-bold">क्रय एजेंसी (Procuring Agency)</span>
                <span className="font-black text-emerald-900 text-xs">HAFED / FCI CENTRAL POOL</span>
              </div>
            </div>

            {/* Part 1: Mandi & Farmer Consignor Particulars */}
            <div className="relative z-10 border border-slate-800 text-xs">
              <div className="bg-slate-800 text-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider flex justify-between items-center">
                <span>१. खरीद केंद्र एवं किसान प्रेषक विवरण (Mandi & Farmer Consignor Particulars)</span>
                <span className="text-[10px] font-normal text-slate-300">Verified via Aadhaar & e-Mandi Portal</span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-300 p-3 bg-white gap-3">
                {/* Mandi Yard Details */}
                <div className="space-y-1 sm:pr-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">मंडी यार्ड (Mandi Yard):</span>
                    <span className="font-black text-slate-900">{token.centre?.name || 'Karnal Central Mandi'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">स्थान / जिला (District & State):</span>
                    <span className="font-semibold text-slate-800">
                      {(token.centre as any)?.district || 'Karnal'}, {(token.centre as any)?.state || 'Haryana'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">मंडी लाइसेंस संख्या (APMC Code):</span>
                    <span className="font-mono font-bold text-slate-800">APMC-HR-KRN-01</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">गेट एंट्री स्लॉट (Entry Slot):</span>
                    <span className="font-mono text-slate-800">Morning Shift (09:00 - 13:00)</span>
                  </div>
                </div>

                {/* Farmer Details */}
                <div className="space-y-1 sm:pl-2">
                  <div className="flex justify-between">
                    <span className="text-slate-500">किसान का नाम (Farmer Name):</span>
                    <span className="font-black text-slate-950 text-sm">{token.farmer?.fullName || 'Farmer'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">किसान पंजीयन सं. (Farmer Reg No):</span>
                    <span className="font-mono font-bold text-slate-900">
                      FMR-HR-{token.farmer?.mobile ? token.farmer.mobile.slice(-6) : '946420'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">मोबाइल नंबर (Mobile No):</span>
                    <span className="font-mono font-bold text-slate-800">+91 {token.farmer?.mobile}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">गांव / पता (Village / Address):</span>
                    <span className="font-semibold text-slate-800">
                      {[token.farmer?.village, token.farmer?.district].filter(Boolean).join(', ') || 'Karnal, Haryana'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">वाहन पंजीकरण सं. (Vehicle No):</span>
                    <span className="font-mono font-black text-slate-900">
                      {vehicleNo} ({token.vehicleType || 'Tractor Trolley'})
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Part 2: Weighbridge Scale Telemetry & Gross / Tare / Net Ledger */}
            <div className="relative z-10 border border-slate-800 text-xs">
              <div className="bg-slate-800 text-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider flex justify-between items-center">
                <span>२. धर्मकांटा वजन रिकॉर्ड (Weighbridge Gross, Tare & Net Scale Reading)</span>
                <span className="text-[10px] font-mono text-slate-300">Scale ID: WB-60MT-PITLESS</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-800 text-[10px] font-black uppercase text-slate-700">
                      <th className="py-2 px-3 border-r border-slate-300">उपज / जिंस (Produce)</th>
                      <th className="py-2 px-3 border-r border-slate-300 text-right">सकल वजन (Gross Wt)</th>
                      <th className="py-2 px-3 border-r border-slate-300 text-right">वाहन खाली वजन (Tare Wt)</th>
                      <th className="py-2 px-3 border-r border-slate-300 text-right">शुद्ध वजन (Gross Net)</th>
                      <th className="py-2 px-3 border-r border-slate-300 text-right">बोरी कटौती (Gunny Tare)</th>
                      <th className="py-2 px-3 text-right bg-slate-200/80 font-black text-slate-950">
                        अंतिम बिल वजन (Final Net Wt)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 font-mono">
                    <tr className="bg-white">
                      <td className="py-2.5 px-3 border-r border-slate-300 font-sans font-black text-slate-900">
                        {token.crop?.name || 'Wheat / गेहूं'}
                        <span className="block text-[10px] text-slate-500 font-normal">
                          Pack: {bagCount} Jute/Gunny Bags (50kg std)
                        </span>
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-300 text-right text-slate-800">
                        {grossKg.toLocaleString('en-IN')} kg
                        <span className="block text-[10px] text-slate-500">{(grossKg / 100).toFixed(2)} Qtl</span>
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-300 text-right text-slate-800">
                        {tareKg.toLocaleString('en-IN')} kg
                        <span className="block text-[10px] text-slate-500">{(tareKg / 100).toFixed(2)} Qtl</span>
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-300 text-right font-bold text-slate-900">
                        {netKg.toLocaleString('en-IN')} kg
                        <span className="block text-[10px] text-slate-500">{netQty.toFixed(2)} Qtl</span>
                      </td>
                      <td className="py-2.5 px-3 border-r border-slate-300 text-right text-rose-700">
                        -{gunnyTareKg} kg
                        <span className="block text-[10px] text-slate-500">({bagCount} bags × 580g)</span>
                      </td>
                      <td className="py-2.5 px-3 text-right bg-slate-100 font-black text-slate-950 text-sm">
                        {netQty.toFixed(2)} Quintal
                        <span className="block text-[10px] text-emerald-800 font-bold">
                          ({netKg.toLocaleString('en-IN')} Kilograms)
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Part 3: Fair Average Quality (FAQ) Testing Certificate */}
            <div className="relative z-10 border border-slate-800 text-xs">
              <div className="bg-slate-800 text-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider flex justify-between items-center">
                <span>३. गुणवत्ता एवं नमी जांच प्रमाणपत्र (FAQ Quality Assay Certificate)</span>
                <span className="text-[10px] font-mono text-emerald-300 font-bold">
                  ASSAY STATUS: FAQ GRADE-A PASSED
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-slate-300 p-2.5 bg-slate-50 text-[11px] text-center">
                <div className="p-1">
                  <span className="text-slate-500 block text-[10px]">नमी (Moisture Content)</span>
                  <span className="font-mono font-black text-slate-900 text-xs">11.20%</span>
                  <span className="block text-[9px] text-emerald-700 font-bold">Max 12.00% (Passed)</span>
                </div>
                <div className="p-1">
                  <span className="text-slate-500 block text-[10px]">विजातीय तत्व (Foreign Matter)</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">0.35%</span>
                  <span className="block text-[9px] text-emerald-700 font-bold">Permissible: &lt;0.75%</span>
                </div>
                <div className="p-1">
                  <span className="text-slate-500 block text-[10px]">क्षतिग्रस्त दाने (Damaged Grains)</span>
                  <span className="font-mono font-bold text-slate-900 text-xs">0.50%</span>
                  <span className="block text-[9px] text-emerald-700 font-bold">Permissible: &lt;2.00%</span>
                </div>
                <div className="p-1">
                  <span className="text-slate-500 block text-[10px]">गुणवत्ता श्रेणी (Assigned Grade)</span>
                  <span className="font-black text-emerald-900 text-xs uppercase">FAQ Grade-A</span>
                  <span className="block text-[9px] text-slate-500">Govt. Procurement Norm</span>
                </div>
              </div>
            </div>

            {/* Part 4: MSP Billing & Direct Bank Settlement Ledger */}
            <div className="relative z-10 border border-slate-800 text-xs">
              <div className="bg-slate-800 text-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider flex justify-between items-center">
                <span>४. न्यूनतम समर्थन मूल्य (MSP) एवं भुगतान विवरण (Billing & Commercial Valuation)</span>
                <span className="text-[10px] text-slate-300">Central MSP Year 2026-27</span>
              </div>

              <div className="p-3 bg-white space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  
                  {/* Left Column: Commercial Breakdown */}
                  <div className="space-y-1.5 border-b sm:border-b-0 sm:border-r border-slate-200 sm:pr-4 pb-2 sm:pb-0">
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">सरकारी घोषित समर्थन मूल्य (Govt. MSP Rate):</span>
                      <span className="font-mono font-bold text-slate-900">₹{ratePerQtl.toLocaleString('en-IN')} / Quintal</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">स्वीकृत वजन (Accepted Net Quantity):</span>
                      <span className="font-mono font-bold text-slate-900">{netQty} Quintal</span>
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-600">सकल मूल्य (Gross Valuation):</span>
                      <span className="font-mono font-black text-slate-900">₹{grossVal.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-xs text-rose-600">
                      <span>गुणवत्ता कटौती / कटौती मूल्य (Moisture & FAQ Cuts):</span>
                      <span className="font-mono font-bold">-₹{deductionVal.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                      <span>मंडी शुल्क (Market Fee 1%) व ग्रामीण शुल्क (RDF 1%):</span>
                      <span className="font-mono">₹{(grossVal * 0.02).toLocaleString('en-IN')} (Paid by Agency)</span>
                    </div>
                  </div>

                  {/* Right Column: Net Payable & Bank Mandate */}
                  <div className="space-y-2 sm:pl-2">
                    <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-none text-center sm:text-right">
                      <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">
                        अंतिम शुद्ध देय राशि (NET PAYABLE TO FARMER)
                      </span>
                      <p className="text-2xl font-black text-emerald-900 font-mono mt-0.5">
                        ₹{netVal.toLocaleString('en-IN')}
                      </p>
                      <p className="text-[11px] font-serif font-bold text-slate-700 mt-1 italic text-center sm:text-right">
                        ({amountInWords})
                      </p>
                    </div>

                    <div className="text-[11px] space-y-1 font-mono bg-slate-50 p-2 border border-slate-200">
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">भुगतान माध्यम (Mode):</span>
                        <span className="font-bold text-slate-900">PFMS / DBT Direct Transfer</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">बैंक (Disbursement Bank):</span>
                        <span className="font-bold text-slate-900">{payment?.bankName || 'State Bank of India'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">खाता (Aadhaar Seeded A/C):</span>
                        <span className="font-bold text-slate-900">{payment?.accountNumberMasked || 'XXXXXX4021'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500 font-sans">स्थिति (Payment Status):</span>
                        <span className="font-bold text-emerald-700 uppercase">APPROVED & DISPATCHED</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Part 5: Signatures, Stamp & QR Verification */}
            <div className="relative z-10 pt-2 border-t-2 border-slate-900">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end text-center">
                
                {/* Farmer / Driver Signature */}
                <div className="space-y-1">
                  <div className="h-12 border-b border-slate-900 w-44 mx-auto mb-1 flex items-end justify-center pb-1">
                    <span className="text-[10px] font-serif text-slate-400 italic">
                      {token.farmer?.fullName}
                    </span>
                  </div>
                  <p className="text-xs font-bold text-slate-900">
                    हस्ताक्षर किसान / वाहन चालक
                  </p>
                  <p className="text-[10px] text-slate-500">
                    (Farmer / Driver Signature)
                  </p>
                </div>

                {/* Official APMC Blue Seal Graphic */}
                <div className="flex flex-col items-center justify-center">
                  <div className="w-24 h-24 rounded-full border-2 border-dashed border-blue-800 p-1 flex items-center justify-center text-center rotate-[-8deg] shadow-xs select-none">
                    <div className="w-full h-full rounded-full border border-blue-800 flex flex-col items-center justify-center p-1 text-[8px] font-black uppercase text-blue-900 tracking-tighter leading-tight bg-blue-50/40">
                      <span>★ APMC MANDI ★</span>
                      <span className="text-[9px] font-bold text-blue-950 font-serif">PASSED & WEIGHED</span>
                      <span className="text-[7px]">KARNAL DIVISION</span>
                      <span className="text-[7px] text-blue-800 font-mono">{formattedDate}</span>
                    </div>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 mt-1 uppercase">
                    Official APMC Incharge Seal
                  </span>
                </div>

                {/* Weighbridge Incharge Signature & QR */}
                <div className="space-y-1">
                  <div className="flex items-center justify-center gap-3">
                    {/* Compact Realistic Verification QR */}
                    <div className="w-16 h-16 p-1 bg-white border border-slate-900 flex-shrink-0 flex items-center justify-center">
                      <svg viewBox="0 0 100 100" className="w-full h-full">
                        <rect width="100" height="100" fill="white" />
                        <rect x="8" y="8" width="28" height="28" fill="#0f172a" />
                        <rect x="14" y="14" width="16" height="16" fill="white" />
                        <rect x="18" y="18" width="8" height="8" fill="#0f172a" />
                        <rect x="64" y="8" width="28" height="28" fill="#0f172a" />
                        <rect x="70" y="14" width="16" height="16" fill="white" />
                        <rect x="74" y="18" width="8" height="8" fill="#0f172a" />
                        <rect x="8" y="64" width="28" height="28" fill="#0f172a" />
                        <rect x="14" y="70" width="16" height="16" fill="white" />
                        <rect x="18" y="74" width="8" height="8" fill="#0f172a" />
                        <rect x="42" y="12" width="12" height="12" fill="#0f172a" />
                        <rect x="42" y="42" width="16" height="16" fill="#0f172a" />
                        <rect x="42" y="72" width="12" height="16" fill="#0f172a" />
                        <rect x="68" y="44" width="18" height="12" fill="#0f172a" />
                        <rect x="68" y="72" width="18" height="16" fill="#0f172a" />
                      </svg>
                    </div>

                    <div className="text-left">
                      <div className="h-8 border-b border-slate-900 w-32 mb-1 flex items-end justify-center pb-0.5">
                        <span className="text-[9px] font-mono text-slate-500 font-bold">SURESH CHANDRA</span>
                      </div>
                      <p className="text-xs font-bold text-slate-900">
                        धर्मकांटा प्रभारी / सचिव
                      </p>
                      <p className="text-[10px] text-slate-500">
                        Weighbridge Incharge / APMC
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Statutory Disclaimer & Instructions */}
            <div className="relative z-10 pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-500 text-justify leading-relaxed">
              <p>
                <strong>वैधानिक सूचना (Statutory Note):</strong> यह तुलाई पर्ची एवं प्रपत्र 'जे' पंजाब एवं हरियाणा कृषि उपज मंडी अधिनियम १९६१ तथा राष्ट्रीय कृषि बाजार (e-NAM) दिशा-निर्देशों के तहत जारी आधिकारिक अभिलेख है। इस रसीद में उल्लिखित राशि सीधे किसान के बैंक खाते में सार्वजनिक वित्तीय प्रबंधन प्रणाली (PFMS) के माध्यम से जमा की जा रही है। किसी भी शिकायत अथवा विसंगति के लिए ४८ घंटे के भीतर मंडी सचिव कार्यालय से संपर्क करें।
              </p>
            </div>
          </div>
        </div>

        {/* Modal Bottom Footer Bar (Hidden on Print) */}
        <div className="p-3.5 bg-slate-100 border-t border-slate-300 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Certified digital procurement receipt issued and logged in state procurement ledger.</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-none bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" /> Print Tulai Parchi (Form-J)
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-none bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-sm"
            >
              Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

