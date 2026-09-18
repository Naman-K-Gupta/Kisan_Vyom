import React from 'react';
import { ProcurementCentreDTO } from '@smart-farmer/shared';
import { Building2, MapPin, Building, ChevronDown, Search, Filter, Check } from 'lucide-react';

export interface CentreSwitcherCardProps {
  centre: ProcurementCentreDTO | null;
  allCentres: ProcurementCentreDTO[];
  selectedCentreId: string;
  isQueuePaused: boolean;
  processingRate: number;
  isSelectorOpen: boolean;
  searchQuery: string;
  selectedState: string;
  availableStates: string[];
  filteredCentres: ProcurementCentreDTO[];
  t: (key: string) => string;
  onToggleSelector: () => void;
  onSearchQueryChange: (q: string) => void;
  onSelectedStateChange: (st: string) => void;
  onSelectCentre: (c: ProcurementCentreDTO) => void;
}

export const CentreSwitcherCard: React.FC<CentreSwitcherCardProps> = ({
  centre,
  allCentres,
  selectedCentreId,
  isQueuePaused,
  processingRate,
  isSelectorOpen,
  searchQuery,
  selectedState,
  availableStates,
  filteredCentres,
  t,
  onToggleSelector,
  onSearchQueryChange,
  onSelectedStateChange,
  onSelectCentre,
}) => {
  return (
    <div className="bg-gradient-to-br from-emerald-900 via-slate-900 to-slate-950 rounded-none p-6 text-white shadow-xl relative overflow-hidden border border-emerald-800/40">
      <div className="absolute top-0 right-0 w-80 h-80 bg-emerald-500/10 rounded-none blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-2.5 py-1 rounded-none bg-emerald-500/20 border border-emerald-400/30 text-[11px] font-bold tracking-wider uppercase text-emerald-300 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-emerald-400" />
              {t('manager.activeCentreBadge')}
            </span>

            {centre && (
              <span className="px-2.5 py-1 rounded-none bg-white/10 text-[11px] font-semibold text-slate-200 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-300" />
                {centre.district}, {centre.state}
              </span>
            )}

            <span
              className={`px-2.5 py-1 rounded-none text-[11px] font-bold uppercase ${
                isQueuePaused
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {isQueuePaused ? 'Queue Paused' : 'Intake Active'}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              {centre ? centre.name : t('manager.assignedCentre')}
            </h2>
          </div>

          <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-300">
            <span>
              {t('centres.storageCapacity')}:{' '}
              <strong className="text-white font-bold">
                {centre?.currentUsage || 0} / {centre?.totalCapacity || 5000} Qtl
              </strong>
            </span>
            <span className="text-slate-600">•</span>
            <span>
              {t('centres.intakeRate')}:{' '}
              <strong className="text-emerald-400 font-bold">
                {centre?.processingRate || processingRate} {t('centres.qtlHour')}
              </strong>
            </span>
            <span className="text-slate-600">•</span>
            <span>
              {allCentres.length} {t('landing.panIndiaMandis')}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            onClick={onToggleSelector}
            className="px-5 py-3 rounded-none bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-xs shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-2 active:scale-95"
          >
            <Building className="w-4 h-4" />
            <span>{t('manager.switchCentre')}</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform duration-200 ${
                isSelectorOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>
      </div>

      {/* Dropdown / Interactive Selector Drawer */}
      {isSelectorOpen && (
        <div className="mt-6 pt-6 border-t border-white/10 space-y-4 animate-fade-in">
          <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* Search Bar */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
                placeholder={t('manager.searchCentres')}
                className="w-full pl-10 pr-4 py-2.5 rounded-none bg-white/10 border border-white/15 text-white placeholder-slate-400 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            {/* State Filter Dropdown */}
            <div className="flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={selectedState}
                onChange={(e) => onSelectedStateChange(e.target.value)}
                className="px-3.5 py-2.5 rounded-none bg-slate-800 border border-white/15 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                {availableStates.map((st) => (
                  <option key={st} value={st} className="bg-slate-900 text-white">
                    {st === 'ALL' ? t('manager.allStates') : st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Mandi Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-72 overflow-y-auto pr-1">
            {filteredCentres.map((c) => {
              const isSelected = c.id === selectedCentreId;
              return (
                <button
                  key={c.id}
                  onClick={() => onSelectCentre(c)}
                  className={`p-3.5 rounded-none text-left transition-all border flex items-center justify-between gap-3 ${
                    isSelected
                      ? 'bg-emerald-500/25 border-emerald-400 text-white shadow-md'
                      : 'bg-white/5 hover:bg-white/10 border-white/10 text-slate-200'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs truncate">{c.name}</span>
                      {isSelected && (
                        <span className="p-0.5 rounded-none bg-emerald-400 text-slate-950 flex-shrink-0">
                          <Check className="w-3 h-3" />
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate">
                      <MapPin className="w-3 h-3 inline mr-1 text-slate-400" />{c.district}, {c.state}
                    </p>
                    <div className="flex items-center gap-2 mt-1.5 text-[10px] text-slate-300">
                      <span className="px-1.5 py-0.5 rounded-none bg-white/10">
                        {c.currentUsage} / {c.totalCapacity} Qtl
                      </span>
                      <span className="px-1.5 py-0.5 rounded-none bg-emerald-500/20 text-emerald-300 font-semibold">
                        {c.processingRate} Qtl/hr
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}

            {filteredCentres.length === 0 && (
              <div className="col-span-full py-8 text-center text-xs text-slate-400">
                {t('manager.noCentresMatch')}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
