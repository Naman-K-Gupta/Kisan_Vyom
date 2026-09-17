import React, { useState, useEffect, useMemo } from 'react';
import { QueueTokenDTO } from '@smart-farmer/shared';
import { api } from '../../api';
import {
  Scale,
  FlaskConical,
  CheckCircle,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Truck,
  Sliders,
  DollarSign,
  ShieldCheck,
  X,
  Radio,
} from 'lucide-react';

interface QualityAssayModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: QueueTokenDTO | null;
  onComplete: (token: QueueTokenDTO, payment: any, centre?: any) => void;
}

// Government MSP FAQ Benchmarks
const CROP_FAQ_STANDARDS: Record<
  string,
  { idealMoisture: number; maxMoisture: number; maxImpurities: number; defaultMsp: number }
> = {
  wheat: { idealMoisture: 12.0, maxMoisture: 14.0, maxImpurities: 0.75, defaultMsp: 2425 },
  paddy: { idealMoisture: 17.0, maxMoisture: 18.5, maxImpurities: 1.0, defaultMsp: 2320 },
  rice: { idealMoisture: 17.0, maxMoisture: 18.5, maxImpurities: 1.0, defaultMsp: 2320 },
  mustard: { idealMoisture: 8.0, maxMoisture: 9.5, maxImpurities: 1.5, defaultMsp: 5650 },
  rapeseed: { idealMoisture: 8.0, maxMoisture: 9.5, maxImpurities: 1.5, defaultMsp: 5650 },
  soybean: { idealMoisture: 12.0, maxMoisture: 14.0, maxImpurities: 1.5, defaultMsp: 4892 },
  maize: { idealMoisture: 14.0, maxMoisture: 16.0, maxImpurities: 1.5, defaultMsp: 2225 },
  cotton: { idealMoisture: 8.0, maxMoisture: 12.0, maxImpurities: 2.0, defaultMsp: 7521 },
  gram: { idealMoisture: 10.0, maxMoisture: 12.0, maxImpurities: 1.0, defaultMsp: 5440 },
};

function getFaqStandard(cropName?: string) {
  if (!cropName) return CROP_FAQ_STANDARDS.wheat;
  const lower = cropName.toLowerCase();
  for (const key of Object.keys(CROP_FAQ_STANDARDS)) {
    if (lower.includes(key)) return CROP_FAQ_STANDARDS[key];
  }
  return CROP_FAQ_STANDARDS.wheat;
}

export const QualityAssayModal: React.FC<QualityAssayModalProps> = ({
  isOpen,
  onClose,
  token,
  onComplete,
}) => {
  const [actualQuantity, setActualQuantity] = useState<number>(25);
  const [useGrossTare, setUseGrossTare] = useState(false);
  const [grossWeight, setGrossWeight] = useState<number>(0);
  const [tareWeight, setTareWeight] = useState<number>(0);

  const [vehicleNumber, setVehicleNumber] = useState('');
  const [vehicleType, setVehicleType] = useState('Tractor Trolley');

  const [moisturePercentage, setMoisturePercentage] = useState<number>(11.5);
  const [foreignMatterPercentage, setForeignMatterPercentage] = useState<number>(0.5);
  const [damagedGrainPercentage, setDamagedGrainPercentage] = useState<number>(0.5);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const faq = useMemo(() => getFaqStandard(token?.crop?.name), [token?.crop?.name]);

  // Sync token state on open
  useEffect(() => {
    if (token) {
      setActualQuantity(token.quantity || 25);
      setVehicleNumber(token.vehicleNumber || '');
      setVehicleType(token.vehicleType || 'Tractor Trolley');
      setMoisturePercentage(faq.idealMoisture - 0.5);
      setForeignMatterPercentage(0.5);
      setDamagedGrainPercentage(0.5);
      setUseGrossTare(false);
      setGrossWeight(0);
      setTareWeight(0);
      setError(null);
    }
  }, [token, faq]);

  // Handle Gross - Tare auto-calc
  useEffect(() => {
    if (useGrossTare && grossWeight > tareWeight && tareWeight >= 0) {
      setActualQuantity(Math.round((grossWeight - tareWeight) * 100) / 100);
    }
  }, [useGrossTare, grossWeight, tareWeight]);

  // Calculations
  const calculations = useMemo(() => {
    const mspRate = faq.defaultMsp;
    const qty = actualQuantity > 0 ? actualQuantity : 0;
    const grossAmount = Math.round(qty * mspRate * 100) / 100;

    let moistureDeduction = 0;
    let impurityDeduction = 0;
    let isRejection = false;
    let rejectionReason = '';

    // Moisture check
    if (moisturePercentage > faq.maxMoisture) {
      isRejection = true;
      rejectionReason = `Moisture content (${moisturePercentage}%) exceeds the maximum permissible limit of ${faq.maxMoisture}%. High risk of silo spoilage.`;
    } else if (moisturePercentage > faq.idealMoisture) {
      const excess = moisturePercentage - faq.idealMoisture;
      // Value cut equal to excess moisture %
      const cutPerQtl = (excess / 100) * mspRate;
      moistureDeduction = Math.round(cutPerQtl * qty * 100) / 100;
    }

    // Foreign matter check
    if (foreignMatterPercentage > faq.maxImpurities * 3) {
      isRejection = true;
      rejectionReason = `Foreign matter (${foreignMatterPercentage}%) exceeds safety standards. High dust and stones detected.`;
    } else if (foreignMatterPercentage > faq.maxImpurities) {
      const excessImp = foreignMatterPercentage - faq.maxImpurities;
      const cutPerQtl = (excessImp / 100) * mspRate;
      impurityDeduction = Math.round(cutPerQtl * qty * 100) / 100;
    }

    const totalDeductions = Math.round((moistureDeduction + impurityDeduction) * 100) / 100;
    const netAmount = Math.max(0, Math.round((grossAmount - totalDeductions) * 100) / 100);

    let grade = 'Grade A (FAQ Passed)';
    if (isRejection) {
      grade = 'REJECTED (Non-FAQ)';
    } else if (totalDeductions > 0) {
      grade = `Grade B (Moisture Cut: ${moisturePercentage}%)`;
    }

    return {
      mspRate,
      grossAmount,
      moistureDeduction,
      impurityDeduction,
      totalDeductions,
      netAmount,
      isRejection,
      rejectionReason,
      grade,
    };
  }, [actualQuantity, moisturePercentage, foreignMatterPercentage, faq]);

  if (!isOpen || !token) return null;

  const handleSubmitApproval = async () => {
    if (actualQuantity <= 0) {
      setError('Please enter a valid weighed quantity.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.queue.completeProcurement(token.id, {
        actualQuantity,
        grossWeight: useGrossTare ? grossWeight : null,
        tareWeight: useGrossTare ? tareWeight : null,
        moisturePercentage,
        foreignMatterPercentage,
        damagedGrainPercentage,
        qualityGrade: calculations.grade,
        deductions: calculations.totalDeductions,
        vehicleNumber: vehicleNumber ? vehicleNumber.trim().toUpperCase() : undefined,
        vehicleType,
      });

      if (res.data.success) {
        onComplete(res.data.token, res.data.payment, res.data.centre);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to finalize procurement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!window.confirm(`Issue official rejection advisory for Token ${token.tokenNumber}?`)) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      await api.queue.rejectConsignment(token.id, {
        reason: calculations.rejectionReason || 'Moisture content exceeds permissible ceiling.',
        moisturePercentage,
        foreignMatterPercentage,
        advisoryNote:
          'Advised to spread crop in mandi drying yard for 24 hours of solar aeration before re-booking.',
      });
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reject consignment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-2xl w-full shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-blue-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300">
              <FlaskConical className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-blue-300">
                  APMC Weighbridge & Quality Assay
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/30 text-blue-200 border border-blue-400/30">
                  Bay 1
                </span>
              </div>
              <h2 className="text-lg font-black text-white">
                {token.tokenNumber} — {token.farmer?.fullName || 'Farmer'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          {/* Farmer & Consignment Summary Badge */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Crop
              </span>
              <span className="text-sm font-extrabold text-slate-800 mt-0.5 block truncate">
                {token.crop?.name}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Declared Qty
              </span>
              <span className="text-sm font-extrabold text-slate-800 mt-0.5 block">
                {token.quantity} {token.unit}
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                MSP Benchmark
              </span>
              <span className="text-sm font-extrabold text-emerald-700 mt-0.5 block">
                ₹{calculations.mspRate}/Qtl
              </span>
            </div>
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                FAQ Moisture Limit
              </span>
              <span className="text-sm font-extrabold text-blue-700 mt-0.5 block">
                ≤ {faq.idealMoisture}%
              </span>
            </div>
          </div>

          {/* Section 1: Vehicle & Weighbridge Scale Entry */}
          <div className="p-4 rounded-2xl bg-blue-50/40 border border-blue-100 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <Truck className="w-4 h-4 text-blue-600" />
                1. Vehicle Registration & Weighbridge Net Weight
              </h3>
              <button
                type="button"
                onClick={() => setUseGrossTare(!useGrossTare)}
                className="text-[11px] font-bold text-blue-600 hover:text-blue-800 underline"
              >
                {useGrossTare ? 'Switch to Direct Net Weight' : 'Use Gross - Tare Calculator'}
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Vehicle Registration Number
                </label>
                <input
                  type="text"
                  placeholder="e.g. PB-10-AB-1234"
                  value={vehicleNumber}
                  onChange={(e) => setVehicleNumber(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold uppercase placeholder:normal-case placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Printed on final Mandi receipt</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Vehicle Category
                </label>
                <select
                  value={vehicleType}
                  onChange={(e) => setVehicleType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                >
                  <option value="Tractor Trolley">🚜 Tractor Trolley</option>
                  <option value="Mini Truck / Canter">🚛 Canter / Mini Truck</option>
                  <option value="Heavy Multi-Axle Truck">🚚 Heavy Multi-Axle Truck</option>
                  <option value="Pickup / Chota Hathi">🛺 Pickup / LCV</option>
                  <option value="Bullock Cart / Other">🐂 Other</option>
                </select>
              </div>
            </div>

            {/* Weighbridge weight inputs */}
            {useGrossTare ? (
              <div className="grid grid-cols-3 gap-2.5 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Gross Wt (Loaded)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Gross"
                    value={grossWeight || ''}
                    onChange={(e) => setGrossWeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                    Tare Wt (Empty)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="Tare"
                    value={tareWeight || ''}
                    onChange={(e) => setTareWeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs font-bold bg-white focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-emerald-700 uppercase mb-1">
                    Net Certified Wt
                  </label>
                  <div className="w-full px-2.5 py-1.5 rounded-xl bg-emerald-100 border border-emerald-300 text-xs font-black text-emerald-900 text-center">
                    {actualQuantity} Qtl
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Certified Net Weighed Quantity (Quintals)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    required
                    value={actualQuantity}
                    onChange={(e) => setActualQuantity(parseFloat(e.target.value) || 0)}
                    className="w-full pl-9 pr-14 py-2 rounded-xl border border-slate-200 text-sm font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  />
                  <Scale className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <span className="text-xs font-bold text-slate-400 absolute right-3 top-2.5">
                    Quintal
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Section 2: Moisture Meter & Quality Assay */}
          <div className="p-4 rounded-2xl bg-amber-50/40 border border-amber-200/70 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider flex items-center gap-2">
                <FlaskConical className="w-4 h-4 text-amber-600" />
                2. Moisture Meter & Refraction Assay
              </h3>
              <span
                className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-md ${
                  calculations.isRejection
                    ? 'bg-rose-100 text-rose-800'
                    : calculations.totalDeductions > 0
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-emerald-100 text-emerald-800'
                }`}
              >
                {calculations.grade}
              </span>
            </div>

            {/* Moisture Meter Slider & Number */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-700">
                  Electronic Moisture Meter Reading (%)
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    step="0.1"
                    min="5"
                    max="30"
                    value={moisturePercentage}
                    onChange={(e) => setMoisturePercentage(parseFloat(e.target.value) || 0)}
                    className="w-16 px-2 py-1 text-xs font-black text-center border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 bg-white"
                  />
                  <span className="text-xs font-bold text-slate-600">%</span>
                </div>
              </div>

              <input
                type="range"
                min="7"
                max="22"
                step="0.1"
                value={moisturePercentage}
                onChange={(e) => setMoisturePercentage(parseFloat(e.target.value))}
                className="w-full accent-amber-600 cursor-pointer h-2 bg-slate-200 rounded-lg"
              />

              {/* Status threshold bar */}
              <div className="flex items-center justify-between text-[10px] font-bold mt-1.5">
                <span className="text-emerald-700">
                  🟢 ≤ {faq.idealMoisture}% (Ideal FAQ)
                </span>
                <span className="text-amber-700">
                  🟡 {faq.idealMoisture + 0.1}% - {faq.maxMoisture}% (Value Cut)
                </span>
                <span className="text-rose-700">
                  🔴 &gt; {faq.maxMoisture}% (Reject Lot)
                </span>
              </div>

              {moisturePercentage > faq.idealMoisture && moisturePercentage <= faq.maxMoisture && (
                <div className="mt-2 text-[11px] text-amber-800 font-semibold bg-amber-100/70 p-2 rounded-xl flex items-center justify-between">
                  <span>
                    Excess Moisture: {(moisturePercentage - faq.idealMoisture).toFixed(1)}%
                  </span>
                  <span className="font-bold text-rose-700">
                    -₹{calculations.moistureDeduction.toLocaleString('en-IN')} Value Cut
                  </span>
                </div>
              )}
            </div>

            {/* Foreign Matter & Damaged Grain */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-amber-200/50">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-600">
                    Foreign Matter (Dust/Chaff) %
                  </label>
                  <span className="text-[11px] font-black text-slate-800">
                    {foreignMatterPercentage}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={foreignMatterPercentage}
                  onChange={(e) => setForeignMatterPercentage(parseFloat(e.target.value))}
                  className="w-full accent-amber-600 h-1.5 bg-slate-200 rounded-lg"
                />
                <span className="text-[9px] text-slate-400">Tolerance: &lt; {faq.maxImpurities}%</span>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bold text-slate-600">
                    Damaged / Weeviled Grain %
                  </label>
                  <span className="text-[11px] font-black text-slate-800">
                    {damagedGrainPercentage}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="0.1"
                  value={damagedGrainPercentage}
                  onChange={(e) => setDamagedGrainPercentage(parseFloat(e.target.value))}
                  className="w-full accent-amber-600 h-1.5 bg-slate-200 rounded-lg"
                />
                <span className="text-[9px] text-slate-400">Tolerance: &lt; 2.0%</span>
              </div>
            </div>
          </div>

          {/* Section 3: Financial & DBT Settlement Summary */}
          <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-slate-800 text-white space-y-3 shadow-lg">
            <div className="flex items-center justify-between border-b border-slate-700 pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Live MSP & PFMS DBT Calculation
              </span>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                Direct Bank Transfer
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div>
                <span className="text-slate-400 text-[10px] block">Gross Amount</span>
                <span className="font-extrabold text-white text-sm">
                  ₹{calculations.grossAmount.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Moisture Cut</span>
                <span className="font-bold text-amber-400 text-sm">
                  -₹{calculations.moistureDeduction.toLocaleString('en-IN')}
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">Impurity Cut</span>
                <span className="font-bold text-amber-400 text-sm">
                  -₹{calculations.impurityDeduction.toLocaleString('en-IN')}
                </span>
              </div>
              <div className="border-l border-slate-700 pl-2">
                <span className="text-emerald-400 text-[10px] font-bold block">Net DBT Payout</span>
                <span className="font-black text-emerald-300 text-base">
                  ₹{calculations.netAmount.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
          </div>

          {/* Rejection Warning Banner if moisture exceeded */}
          {calculations.isRejection && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2">
              <div className="flex items-center gap-2 font-bold text-rose-700">
                <XCircle className="w-5 h-5 text-rose-600" />
                <span>Consignment Exceeds Permissible Quality Limits!</span>
              </div>
              <p className="leading-relaxed text-slate-700">
                {calculations.rejectionReason}
              </p>
              <div className="text-[11px] text-slate-600 bg-white/80 p-2 rounded-xl border border-rose-200">
                📌 <strong>Action:</strong> Click <em>"Issue Rejection Advisory"</em> below. The farmer will be immediately notified in-app with recommendations to sun-dry and aerate the grain.
              </div>
            </div>
          )}

          {/* Digital Weighment Slip Notification */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <div>
                <span className="text-xs font-extrabold text-slate-800 block">
                  Digital Weighment Slip (*Tulai Parchi*)
                </span>
                <span className="text-[10px] text-slate-500">
                  Instant receipt delivery to Farmer's Account & In-App Portal
                </span>
              </div>
            </div>
            <span className="px-2.5 py-1 text-[10px] font-bold bg-emerald-100 text-emerald-800 rounded-full border border-emerald-200">
              Automated
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 sm:px-6 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancel
          </button>

          {calculations.isRejection ? (
            <button
              type="button"
              onClick={handleReject}
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <XCircle className="w-4 h-4" />
              {isSubmitting ? 'Issuing Advisory...' : 'Issue Rejection Advisory'}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmitApproval}
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              {isSubmitting ? 'Processing...' : 'Approve Quality & Complete Procurement'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
