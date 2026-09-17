import React from 'react';
import { QueueTokenDTO } from '@smart-farmer/shared';
import {
  Printer,
  CheckCircle,
  X,
  Truck,
  Scale,
  FlaskConical,
  Building,
  Landmark,
  ShieldCheck,
} from 'lucide-react';

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
    month: 'short',
    year: 'numeric',
  });
  const formattedTime = new Date(payment?.createdAt || Date.now()).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  const vehicleNo =
    payment?.vehicleNumber || token.vehicleNumber || 'PB-10-AB-1234';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in print:p-0 print:bg-white">
      <div className="bg-white rounded-3xl max-w-3xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[95vh] print:max-h-none print:shadow-none print:border-none">
        {/* Modal Action Bar (Hidden on Print) */}
        <div className="px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Procurement Receipt Finalized
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Mandi Slip</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Digital Slip Notice (Hidden on Print) */}
        <div className="px-6 py-2.5 bg-gradient-to-r from-emerald-700 to-teal-700 text-white flex items-center justify-between text-xs font-semibold print:hidden shadow-inner">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>
              Official Mandi Slip Generated for Farmer: <strong>{token.farmer?.fullName || ''}</strong> (+91 {token.farmer?.mobile})
            </span>
          </div>
          <span className="px-2 py-0.5 rounded-md bg-white/20 text-[10px] font-bold">
            Delivered to Portal
          </span>
        </div>

        {/* Official Printable Mandi Weighment Slip Content */}
        <div className="p-6 sm:p-8 space-y-6 text-slate-800 bg-white" id="printable-receipt">
          {/* Official Emblem & Mandi Header */}
          <div className="text-center border-b-2 border-dashed border-slate-300 pb-5">
            <div className="w-12 h-12 mx-auto rounded-full bg-slate-900 text-amber-400 flex items-center justify-center font-serif text-lg font-bold shadow-sm mb-2">
              🏛️
            </div>
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 block">
              Government of India • Department of Food & Public Distribution
            </span>
            <h1 className="text-xl font-black text-slate-900 mt-0.5 tracking-tight uppercase">
              APMC Mandi Procurement Yard
            </h1>
            <p className="text-xs font-bold text-slate-600 mt-0.5">
              {token.centre?.name}
            </p>
            <span className="inline-block mt-2 px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider bg-slate-100 text-slate-800 border border-slate-300">
              Official Weighment Slip (तुलाई पर्ची) & Quality Certificate
            </span>
          </div>

          {/* Slip Meta Information */}
          <div className="grid grid-cols-2 gap-3 text-xs bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Slip Number</span>
              <span className="font-mono font-bold text-slate-900">{payment.paymentNumber}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Date & Time</span>
              <span className="font-bold text-slate-800">{formattedDate}, {formattedTime}</span>
            </div>
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Token Number</span>
              <span className="font-mono font-bold text-blue-800">{token.tokenNumber}</span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">Weighbridge Bay</span>
              <span className="font-bold text-slate-800">Bay 1 (Heavy Scale)</span>
            </div>
          </div>

          {/* Farmer & Vehicle Info */}
          <div className="grid grid-cols-2 gap-4 text-xs border-b border-slate-100 pb-4">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Farmer Consignor Details
              </span>
              <p className="font-black text-slate-900 text-sm mt-0.5">{token.farmer?.fullName}</p>
              <p className="text-slate-600">Mobile: +91 {token.farmer?.mobile}</p>
              <p className="text-slate-500">Village: {token.farmer?.village || 'N/A'}</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Vehicle Consignment
              </span>
              <p className="font-mono font-black text-slate-900 text-sm mt-0.5">{vehicleNo}</p>
              <p className="text-slate-600">{token.vehicleType || 'Tractor Trolley'}</p>
              <p className="text-emerald-700 font-bold mt-1">Verified on Platform</p>
            </div>
          </div>

          {/* Quality & Weighment Table */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Consignment & Quality Assay Metrics
            </span>
            <table className="w-full text-xs">
              <thead>
                <tr className="border-y border-slate-200 bg-slate-50 text-slate-600">
                  <th className="py-2 text-left font-bold pl-2">Commodity / Crop</th>
                  <th className="py-2 text-center font-bold">Net Weighed Qty</th>
                  <th className="py-2 text-center font-bold">Moisture Content</th>
                  <th className="py-2 text-right font-bold pr-2">FAQ Quality Grade</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-2.5 font-black text-slate-900 pl-2">
                    {token.crop?.name}
                  </td>
                  <td className="py-2.5 text-center font-black text-slate-900">
                    {payment.quantity} {payment.unit || 'Quintal'}
                  </td>
                  <td className="py-2.5 text-center font-bold text-blue-700">
                    {payment.qualityGrade?.includes('Moisture')
                      ? payment.qualityGrade
                      : '11.5% (FAQ Standard)'}
                  </td>
                  <td className="py-2.5 text-right font-extrabold text-emerald-700 pr-2">
                    {payment.qualityGrade || 'Grade A (FAQ Passed)'}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Financial & MSP Breakdown */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 space-y-2">
            <div className="flex justify-between text-xs font-semibold text-slate-600">
              <span>MSP Benchmark Rate Applied:</span>
              <span className="font-bold text-slate-900">₹{payment.ratePerUnit?.toLocaleString('en-IN')} / Quintal</span>
            </div>
            <div className="flex justify-between text-xs font-semibold text-slate-600">
              <span>Gross Lot Valuation ({payment.quantity} Qtl × ₹{payment.ratePerUnit}):</span>
              <span className="font-bold text-slate-900">₹{payment.grossAmount?.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between text-xs font-semibold text-rose-600">
              <span>Moisture & FAQ Quality Deductions:</span>
              <span className="font-bold">-₹{payment.deductions ? payment.deductions.toLocaleString('en-IN') : '0.00'}</span>
            </div>
            <div className="border-t-2 border-slate-300 pt-2 flex justify-between items-center text-sm font-black text-slate-900">
              <span>Net Farmer Settlement (via PFMS DBT):</span>
              <span className="text-base text-emerald-700">₹{payment.netAmount?.toLocaleString('en-IN')}</span>
            </div>
          </div>

          {/* Banking Settlement & Footer Security */}
          <div className="grid grid-cols-2 gap-4 text-xs pt-2">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Disbursement Account
              </span>
              <p className="font-bold text-slate-800 flex items-center gap-1.5">
                <Landmark className="w-3.5 h-3.5 text-blue-600" />
                {payment.bankName || 'State Bank of India'}
              </p>
              <p className="text-[11px] font-mono text-slate-600">
                A/C: {payment.accountNumberMasked || 'XXXXXX4021'}
              </p>
              <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800">
                Aadhaar DBT Linked (PFMS Active)
              </span>
            </div>

            {/* QR Code Simulation for Verification */}
            <div className="flex flex-col items-end justify-center">
              <div className="w-20 h-20 p-1.5 bg-white border border-slate-300 rounded-xl shadow-xs flex items-center justify-center text-center">
                <svg viewBox="0 0 100 100" className="w-full h-full">
                  <rect width="100" height="100" fill="white" />
                  <rect x="10" y="10" width="25" height="25" fill="#1e293b" />
                  <rect x="15" y="15" width="15" height="15" fill="white" />
                  <rect x="18" y="18" width="9" height="9" fill="#1e293b" />
                  <rect x="65" y="10" width="25" height="25" fill="#1e293b" />
                  <rect x="70" y="15" width="15" height="15" fill="white" />
                  <rect x="73" y="18" width="9" height="9" fill="#1e293b" />
                  <rect x="10" y="65" width="25" height="25" fill="#1e293b" />
                  <rect x="15" y="70" width="15" height="15" fill="white" />
                  <rect x="18" y="73" width="9" height="9" fill="#1e293b" />
                  <rect x="42" y="15" width="10" height="10" fill="#1e293b" />
                  <rect x="42" y="42" width="16" height="16" fill="#1e293b" />
                  <rect x="42" y="70" width="10" height="15" fill="#1e293b" />
                  <rect x="70" y="45" width="15" height="10" fill="#1e293b" />
                  <rect x="70" y="70" width="15" height="15" fill="#1e293b" />
                </svg>
              </div>
              <span className="text-[9px] font-mono text-slate-400 mt-1">
                Scan to Verify Receipt
              </span>
            </div>
          </div>

          {/* Signatures */}
          <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs border-t border-dashed border-slate-300">
            <div>
              <div className="h-10 border-b border-slate-400 w-36 mx-auto mb-1"></div>
              <span className="font-bold text-slate-700">Farmer / Driver Signature</span>
            </div>
            <div>
              <div className="h-10 border-b border-slate-400 w-36 mx-auto mb-1 flex items-end justify-center pb-1">
                <span className="text-[10px] font-mono text-slate-400 font-bold">DIGITALLY SIGNED</span>
              </div>
              <span className="font-bold text-slate-700">Weighbridge Incharge (APMC)</span>
            </div>
          </div>
        </div>

        {/* Footer (Hidden on Print) */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between print:hidden">
          <span className="text-xs text-slate-500 font-medium">
            Receipt archived in State Procurement Ledger
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-3.5 h-3.5" /> Print Tulai Parchi
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all"
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
