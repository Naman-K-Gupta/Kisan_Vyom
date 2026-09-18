import React from 'react';
import { QueueTokenDTO } from '@smart-farmer/shared';
import { Badge } from '../common/Badge';
import { Radio, User as UserIcon, Play, SkipForward, FlaskConical } from 'lucide-react';

export interface ActiveInspectionBayProps {
  calledTokens: QueueTokenDTO[];
  processingTokens: QueueTokenDTO[];
  onStartProcessing: (id: string) => void;
  onSkipToken: (id: string) => void;
  onCompleteProcurement: (token: QueueTokenDTO) => void;
  onSelectFarmer: (token: QueueTokenDTO) => void;
}

export const ActiveInspectionBay: React.FC<ActiveInspectionBayProps> = ({
  calledTokens,
  processingTokens,
  onStartProcessing,
  onSkipToken,
  onCompleteProcurement,
  onSelectFarmer,
}) => {
  return (
    <div className="bg-white rounded-none p-6 border border-slate-100 shadow-card">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100">
        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
          <Radio className="w-4 h-4 text-blue-600 animate-pulse" />
          Weighing Bay Active Inspection
        </h3>
        <span className="text-xs font-bold px-2 py-0.5 rounded-none bg-blue-50 text-blue-700">
          Bay 1
        </span>
      </div>

      {calledTokens.length === 0 && processingTokens.length === 0 ? (
        <div className="py-10 text-center text-slate-400 text-xs">
          Bay is currently idle. Click "Call Next Farmer" from the waiting queue below.
        </div>
      ) : (
        <div className="space-y-4 mt-4">
          {calledTokens.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-none bg-blue-50/60 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                {/* Farmer Avatar */}
                <button
                  type="button"
                  onClick={() => onSelectFarmer(t)}
                  className="relative shrink-0 group focus:outline-none"
                  title="View Farmer Identity & Photo"
                >
                  <div className="w-12 h-12 rounded-none bg-blue-200 border-2 border-blue-400 overflow-hidden flex items-center justify-center font-bold text-blue-800 text-base shadow-sm group-hover:ring-2 group-hover:ring-blue-500 transition-all">
                    {t.farmer?.profilePictureUrl ? (
                      <img
                        src={t.farmer.profilePictureUrl}
                        alt={t.farmer?.fullName || 'Farmer'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{t.farmer?.fullName ? t.farmer.fullName.charAt(0).toUpperCase() : 'F'}</span>
                    )}
                  </div>
                  <span className="absolute -bottom-1 -right-1 p-0.5 bg-blue-600 text-white rounded-none text-[9px]">
                    <UserIcon className="w-2.5 h-2.5" />
                  </span>
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-blue-900">{t.tokenNumber}</span>
                    <Badge status="CALLED" />
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectFarmer(t)}
                    className="text-xs font-bold text-slate-800 hover:text-blue-700 underline-offset-2 hover:underline text-left block"
                  >
                    {t.farmer?.fullName}
                  </button>
                  <p className="text-[11px] text-slate-500">
                    Mobile: {t.farmer?.mobile} • Crop: {t.crop?.name} ({t.quantity} {t.unit})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => onStartProcessing(t.id)}
                  className="px-3.5 py-2 rounded-none bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
                >
                  <Play className="w-3.5 h-3.5" /> Start Weighing
                </button>
                <button
                  onClick={() => onSkipToken(t.id)}
                  className="p-2 rounded-none border border-slate-200 hover:bg-slate-100 text-slate-500 transition-colors"
                  title="Skip Absent"
                >
                  <SkipForward className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {processingTokens.map((t) => (
            <div
              key={t.id}
              className="p-4 rounded-none bg-emerald-50/60 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3">
                {/* Farmer Avatar */}
                <button
                  type="button"
                  onClick={() => onSelectFarmer(t)}
                  className="relative shrink-0 group focus:outline-none"
                  title="View Farmer Identity & Photo"
                >
                  <div className="w-12 h-12 rounded-none bg-emerald-200 border-2 border-emerald-500 overflow-hidden flex items-center justify-center font-bold text-emerald-800 text-base shadow-sm group-hover:ring-2 group-hover:ring-emerald-500 transition-all">
                    {t.farmer?.profilePictureUrl ? (
                      <img
                        src={t.farmer.profilePictureUrl}
                        alt={t.farmer?.fullName || 'Farmer'}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span>{t.farmer?.fullName ? t.farmer.fullName.charAt(0).toUpperCase() : 'F'}</span>
                    )}
                  </div>
                  <span className="absolute -bottom-1 -right-1 p-0.5 bg-emerald-600 text-white rounded-none text-[9px]">
                    <UserIcon className="w-2.5 h-2.5" />
                  </span>
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-black text-emerald-900">{t.tokenNumber}</span>
                    <Badge status="PROCESSING" />
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectFarmer(t)}
                    className="text-xs font-bold text-slate-800 hover:text-emerald-700 underline-offset-2 hover:underline text-left block"
                  >
                    {t.farmer?.fullName}
                  </button>
                  <p className="text-[11px] text-slate-500">
                    {t.vehicleNumber ? `${t.vehicleNumber} (${t.vehicleType || 'Tractor'}) • ` : ''}
                    Moisture check & weighing: {t.crop?.name} ({t.quantity} {t.unit})
                  </p>
                </div>
              </div>

              <button
                onClick={() => onCompleteProcurement(t)}
                className="px-4 py-2 rounded-none bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
              >
                <FlaskConical className="w-4 h-4" /> Inspect, Weigh & Issue Receipt
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
