import React from 'react';
import { QueueTokenDTO } from '@smart-farmer/shared';
import { Badge } from '../common/Badge';
import { EmptyState } from '../common/EmptyState';
import { Link } from 'react-router-dom';
import { ArrowRight, Truck } from 'lucide-react';

interface ActiveTokenCardProps {
  activeToken: QueueTokenDTO | null;
  t: (path: string, fallback?: string) => string;
}

/**
 * Displays active APMC Mandi Queue Gate Pass telemetry, vehicle info, and real-time wait estimation.
 */
export const ActiveTokenCard: React.FC<ActiveTokenCardProps> = ({ activeToken, t }) => {
  return (
    <div className="bg-white rounded-none p-6 sm:p-8 border border-slate-100 shadow-card">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-lg font-bold text-slate-900">
              {t('dashboard.activeTokenTitle', 'Active Gate Pass & Queue Token')}
            </h3>
            {activeToken && (
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-none h-2 w-2 bg-emerald-500"></span>
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            {t('dashboard.liveQueueSync')}
          </p>
        </div>
        {activeToken && (
          <Link
            to="/farmer/queue"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-none bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-all"
          >
            {t('queue.viewDetails')} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>

      {activeToken ? (
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
          {/* Token sequence badge */}
          <div className="md:col-span-1 p-5 rounded-none bg-emerald-50/70 border border-emerald-100 text-center">
            <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
              {t('queue.yourToken')}
            </span>
            <p className="text-2xl font-black text-emerald-900 mt-1">{activeToken.tokenNumber}</p>
            <div className="mt-3">
              <Badge status={activeToken.status} />
            </div>
            {activeToken.vehicleNumber && (
              <div className="mt-2 text-[11px] font-semibold text-slate-600 bg-white/80 py-1 px-2 rounded-none border border-emerald-100 flex items-center justify-center gap-1">
                <Truck className="w-3 h-3 text-slate-500 flex-shrink-0" />
                <span>{activeToken.vehicleNumber}</span>
              </div>
            )}
          </div>

          {/* Metric telemetry columns */}
          <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
            <div>
              <span className="text-[11px] font-medium text-slate-400 block">{t('nav.centres')}</span>
              <p className="text-xs font-bold text-slate-800 mt-1 truncate">
                {activeToken.centre?.name || 'Centre'}
              </p>
              <p className="text-[10px] text-slate-400 truncate">{activeToken.centre?.address}</p>
            </div>

            <div>
              <span className="text-[11px] font-medium text-slate-400 block">{t('crops.cropName')}</span>
              <p className="text-xs font-bold text-slate-800 mt-1">
                {activeToken.crop?.name}
              </p>
              <p className="text-[10px] text-slate-500 font-semibold">
                {activeToken.quantity} {activeToken.unit}
              </p>
            </div>

            <div>
              <span className="text-[11px] font-medium text-slate-400 block">{t('queue.tokensAhead')}</span>
              <p className="text-lg font-extrabold text-slate-900 mt-0.5">
                {activeToken.farmersAhead ?? 0}
              </p>
              <p className="text-[10px] text-slate-400">{t('dashboard.waitingBeforeYou')}</p>
            </div>

            <div>
              <span className="text-[11px] font-medium text-slate-400 block">{t('queue.estWait')}</span>
              <p className="text-lg font-extrabold text-amber-600 mt-0.5">
                ~{activeToken.estimatedWaitMinutes} {t('queue.mins')}
              </p>
              <p className="text-[10px] text-slate-400">{t('dashboard.calculatedRealTime')}</p>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          title={t('queue.noActiveToken')}
          description={t('dashboard.noActiveTokensDesc')}
          actionLabel={t('queue.bookSlotNow')}
          onAction={() => (window.location.href = '/farmer/centres')}
        />
      )}
    </div>
  );
};
