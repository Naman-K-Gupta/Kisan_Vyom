import React from 'react';
import { QueueTokenDTO } from '@smart-farmer/shared';
import { Play, SkipForward, User as UserIcon, Phone } from 'lucide-react';

export interface VehicleQueueTableProps {
  waitingTokens: QueueTokenDTO[];
  onCallToken: (id: string) => void;
  onSkipToken: (id: string) => void;
  onSelectFarmer: (token: QueueTokenDTO) => void;
}

export const VehicleQueueTable: React.FC<VehicleQueueTableProps> = ({
  waitingTokens,
  onCallToken,
  onSkipToken,
  onSelectFarmer,
}) => {
  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-slate-900">Waiting Vehicles Queue</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {waitingTokens.length} farmers waiting in chronological order of arrival
          </p>
        </div>

        {waitingTokens.length > 0 && (
          <button
            onClick={() => onCallToken(waitingTokens[0].id)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-1.5 self-start sm:self-auto"
          >
            <Play className="w-3.5 h-3.5" /> Call Next Farmer ({waitingTokens[0].tokenNumber})
          </button>
        )}
      </div>

      {waitingTokens.length === 0 ? (
        <div className="p-12 text-center text-slate-400 text-xs">
          No farmers are currently waiting in the queue.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Position</th>
                <th className="px-6 py-3.5">Token Number</th>
                <th className="px-6 py-3.5">Farmer Details</th>
                <th className="px-6 py-3.5">Crop & Consignment</th>
                <th className="px-6 py-3.5">Est. Wait</th>
                <th className="px-6 py-3.5">Arrival Time</th>
                <th className="px-6 py-3.5 text-right">Gate Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {waitingTokens.map((t, index) => (
                <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-700">#{index + 1}</td>
                  <td className="px-6 py-4 font-black text-slate-900">{t.tokenNumber}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => onSelectFarmer(t)}
                        className="relative shrink-0 group focus:outline-none"
                        title="Click to view full photo & verify farmer"
                      >
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-300 overflow-hidden flex items-center justify-center font-bold text-slate-700 text-sm group-hover:border-emerald-500 transition-all shadow-sm">
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
                        <span className="absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-600 text-white flex items-center justify-center text-[8px] group-hover:scale-110 transition-transform">
                          <UserIcon className="w-2.5 h-2.5" />
                        </span>
                      </button>

                      <div>
                        <button
                          type="button"
                          onClick={() => onSelectFarmer(t)}
                          className="font-bold text-slate-900 hover:text-emerald-700 block text-left group-hover:underline"
                        >
                          {t.farmer?.fullName}
                        </button>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" /> {t.farmer?.mobile} • {t.farmer?.village}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="font-bold text-emerald-800">{t.crop?.name}</span>
                    <span className="text-slate-500 block text-[11px]">
                      {t.quantity} {t.unit}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-amber-700 font-semibold">
                    ~{t.estimatedWaitMinutes} mins
                  </td>
                  <td className="px-6 py-4 text-slate-400">
                    {new Date(t.createdAt).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => onCallToken(t.id)}
                        className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1"
                      >
                        <Play className="w-3 h-3" /> Call
                      </button>
                      <button
                        onClick={() => onSkipToken(t.id)}
                        className="p-1.5 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 transition-colors"
                        title="Skip Absent Farmer"
                      >
                        <SkipForward className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
