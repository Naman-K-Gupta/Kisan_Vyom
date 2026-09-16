import React from 'react';
import { Sliders, Scale, RefreshCw } from 'lucide-react';

export interface CapacityRateControllerProps {
  capacityUsage: number;
  totalCapacity: number;
  processingRate: number;
  isUpdatingCapacity: boolean;
  lastCapacityUpdate: {
    quantity: number;
    farmerName?: string;
    tokenNumber?: string;
    timestamp: number;
  } | null;
  onCapacityUsageChange: (val: number) => void;
  onTotalCapacityChange: (val: number) => void;
  onProcessingRateChange: (val: number) => void;
  onSaveCapacity: (e: React.FormEvent) => void;
}

export const CapacityRateController: React.FC<CapacityRateControllerProps> = ({
  capacityUsage,
  totalCapacity,
  processingRate,
  isUpdatingCapacity,
  lastCapacityUpdate,
  onCapacityUsageChange,
  onTotalCapacityChange,
  onProcessingRateChange,
  onSaveCapacity,
}) => {
  const safeTotal = totalCapacity || 1;
  const ratio = capacityUsage / safeTotal;
  const percentage = Math.min(100, Math.round(ratio * 100));
  const headroom = Math.max(0, totalCapacity - capacityUsage);

  return (
    <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-purple-600" />
          Live Centre Capacity & Rate Controller
        </h3>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
            Live Synced
          </span>
        </div>
      </div>

      {/* Real-Time Lot Inflow Notification */}
      {lastCapacityUpdate && (
        <div className="mt-4 p-3 rounded-2xl bg-emerald-50/90 border border-emerald-200 text-xs text-emerald-900 flex items-center justify-between animate-fade-in shadow-sm">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-black text-xs shrink-0">
              +{lastCapacityUpdate.quantity}
            </div>
            <div>
              <span className="font-bold text-emerald-950 block text-[11px]">
                Silo Storage Updated ({lastCapacityUpdate.quantity} Qtl Stored)
              </span>
              <span className="text-[10px] text-emerald-700">
                {lastCapacityUpdate.tokenNumber ? `${lastCapacityUpdate.tokenNumber} • ` : ''}
                {lastCapacityUpdate.farmerName || 'Farmer'}
              </span>
            </div>
          </div>
          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
            Real-Time
          </span>
        </div>
      )}

      {/* Live Silo Utilization Gauge */}
      <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2 mt-4">
        <div className="flex items-center justify-between text-xs font-bold">
          <span className="text-slate-700 flex items-center gap-1.5">
            <Scale className="w-3.5 h-3.5 text-slate-500" />
            Live Silo Utilization
          </span>
          <span
            className={
              ratio > 0.9
                ? 'text-rose-600 font-extrabold'
                : ratio > 0.75
                ? 'text-amber-600 font-extrabold'
                : 'text-emerald-700 font-extrabold'
            }
          >
            {percentage}% Capacity
          </span>
        </div>
        <div className="w-full h-3 bg-slate-200/80 rounded-full overflow-hidden p-0.5">
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${
              ratio > 0.9
                ? 'bg-gradient-to-r from-amber-500 to-rose-600'
                : ratio > 0.75
                ? 'bg-gradient-to-r from-emerald-500 to-amber-500'
                : 'bg-gradient-to-r from-emerald-600 to-teal-500'
            }`}
            style={{
              width: `${Math.min(100, Math.max(2, percentage))}%`,
            }}
          />
        </div>
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-0.5">
          <span>
            Occupied: <strong className="text-slate-800 font-bold">{capacityUsage.toLocaleString('en-IN')} Qtl</strong>
          </span>
          <span>
            Headroom: <strong className="text-emerald-700 font-bold">{headroom.toLocaleString('en-IN')} Qtl</strong>
          </span>
        </div>
      </div>

      <form onSubmit={onSaveCapacity} className="space-y-4 mt-4">
        <div>
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
            <span>Manual Silo Adjustment Slider</span>
            <span className="text-emerald-700 font-mono">{capacityUsage} Qtl</span>
          </div>
          <input
            type="range"
            min="0"
            max={totalCapacity}
            step="5"
            value={capacityUsage}
            onChange={(e) => onCapacityUsageChange(parseFloat(e.target.value) || 0)}
            className="w-full accent-emerald-600 cursor-pointer"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Total Capacity (Qtl)
            </label>
            <input
              type="number"
              min="100"
              value={totalCapacity}
              onChange={(e) => onTotalCapacityChange(parseFloat(e.target.value) || 100)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
              Processing Rate (Qtl/hr)
            </label>
            <input
              type="number"
              min="1"
              value={processingRate}
              onChange={(e) => onProcessingRateChange(parseFloat(e.target.value) || 1)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={isUpdatingCapacity}
          className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50 flex items-center justify-center gap-2 active:scale-98"
        >
          {isUpdatingCapacity ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Broadcasting...
            </>
          ) : (
            <>
              <Sliders className="w-3.5 h-3.5" /> Save & Broadcast Custom Overrides
            </>
          )}
        </button>
      </form>
    </div>
  );
};
