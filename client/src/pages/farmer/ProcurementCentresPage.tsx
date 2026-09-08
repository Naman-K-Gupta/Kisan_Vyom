import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { ProcurementCentreDTO, CropDTO } from '@smart-farmer/shared';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { useNotifications } from '../../contexts/NotificationContext';
import {
  Building2,
  MapPin,
  Clock,
  Navigation,
  Search,
  CheckCircle,
  Phone,
  Scale,
  Ticket,
  SlidersHorizontal,
} from 'lucide-react';

export const ProcurementCentresPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotifications();

  const [centres, setCentres] = useState<ProcurementCentreDTO[]>([]);
  const [masterCrops, setMasterCrops] = useState<CropDTO[]>([]);
  const [selectedCropId, setSelectedCropId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Token Request Modal
  const [selectedCentre, setSelectedCentre] = useState<ProcurementCentreDTO | null>(null);
  const [tokenCropId, setTokenCropId] = useState('');
  const [tokenQuantity, setTokenQuantity] = useState(25);
  const [tokenUnit, setTokenUnit] = useState('Quintal');
  const [isSubmittingToken, setIsSubmittingToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const loadCentres = async () => {
    try {
      const res = await api.centres.getAll({
        cropId: selectedCropId || undefined,
        status: selectedStatus || undefined,
        search: searchQuery || undefined,
      });
      if (res.data.success) {
        setCentres(res.data.centres);
      }
    } catch (err) {
      console.error('Failed to load centres:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    api.crops.getAll().then((res) => {
      if (res.data.success) setMasterCrops(res.data.crops);
    });
  }, []);

  useEffect(() => {
    loadCentres();
  }, [selectedCropId, selectedStatus]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadCentres();
  };

  const openTokenModal = (centre: ProcurementCentreDTO) => {
    setSelectedCentre(centre);
    setTokenError(null);
    if (centre.supportedCrops && centre.supportedCrops.length > 0) {
      setTokenCropId(centre.supportedCrops[0].cropId);
    } else {
      setTokenCropId(masterCrops[0]?.id || '');
    }
  };

  const handleTokenSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCentre) return;

    setIsSubmittingToken(true);
    setTokenError(null);

    try {
      const res = await api.queue.join({
        centreId: selectedCentre.id,
        cropId: tokenCropId,
        quantity: tokenQuantity,
        unit: tokenUnit,
      });

      setSelectedCentre(null);
      showToast(
        'Token Generated!',
        `Queue Token ${res.data.token.tokenNumber} is active. Redirecting to Live Tracker...`,
        'TOKEN_CALLED'
      );
      navigate('/farmer/queue');
    } catch (err: any) {
      setTokenError(
        err.response?.data?.message || 'Failed to request token. You may already have an active token.'
      );
    } finally {
      setIsSubmittingToken(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Procurement Centres & APMC Mandis
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Locate authorized government purchase depots, check live intake capacity, and book queue tokens
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by centre name, mandi, or district..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </form>

        <div className="flex items-center gap-2 w-full md:w-auto">
          <select
            value={selectedCropId}
            onChange={(e) => setSelectedCropId(e.target.value)}
            className="flex-1 md:w-44 px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Crops</option>
            {masterCrops.map((mc) => (
              <option key={mc.id} value={mc.id}>
                {mc.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="flex-1 md:w-36 px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="BUSY">Busy</option>
            <option value="FULL">Full</option>
            <option value="CLOSED">Closed</option>
          </select>
        </div>
      </div>

      {/* Interactive Map Visual Locator / Google Maps Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">Procurement Centres Geo-Locator</h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            {centres.length} Verified APMC Locations
          </span>
        </div>

        {/* Visual Map Container */}
        <div className="mt-4 relative rounded-2xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 p-6 text-white overflow-hidden min-h-[260px] flex flex-col justify-between">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#4ade80_1px,transparent_1px)] [background-size:16px_16px]" />

          <div className="relative z-10 flex items-start justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Live Coordinate Tracking Active
              </span>
              <p className="text-xs text-slate-300 mt-2 max-w-md">
                Click "Get Directions" on any centre card below to open turn-by-turn navigation in Google Maps directly to the procurement weighing bay.
              </p>
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap gap-2 pt-6">
            {centres.map((c) => (
              <a
                key={c.id}
                href={`https://www.google.com/maps/dir/?api=1&destination=${c.latitude},${c.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5 transition-all"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>{c.name}</span>
                <span className="text-[10px] text-emerald-300">({c.district})</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Centres List */}
      {centres.length === 0 ? (
        <EmptyState
          title="No Procurement Centres Available"
          description="No procurement centres match your current filter criteria. Try clearing filters or selecting another crop."
          icon={Building2}
          actionLabel="Clear Filters"
          onAction={() => {
            setSelectedCropId('');
            setSelectedStatus('');
            setSearchQuery('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {centres.map((centre) => {
            const usagePercent = Math.min(
              100,
              Math.round((centre.currentUsage / centre.totalCapacity) * 100)
            );
            const canIssueToken = centre.status === 'OPEN' || centre.status === 'BUSY';

            return (
              <div
                key={centre.id}
                className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card hover:shadow-soft transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {centre.name}
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3 h-3 text-slate-400 flex-shrink-0" />
                        {centre.village}, {centre.district}, {centre.state}
                      </p>
                    </div>
                    <Badge status={centre.status} />
                  </div>

                  {/* Capacity Bar */}
                  <div className="my-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-600">Storage Capacity</span>
                      <span
                        className={
                          usagePercent > 85
                            ? 'text-rose-600 font-bold'
                            : usagePercent > 60
                            ? 'text-amber-600 font-bold'
                            : 'text-emerald-700 font-bold'
                        }
                      >
                        {usagePercent}% utilized
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-500 ${
                          usagePercent > 85
                            ? 'bg-rose-500'
                            : usagePercent > 60
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                        }`}
                        style={{ width: `${usagePercent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
                      <span>Available: {centre.remainingCapacity} Qtl</span>
                      <span>Total: {centre.totalCapacity} Qtl</span>
                    </div>
                  </div>

                  {/* Telemetry Metrics */}
                  <div className="grid grid-cols-2 gap-3 py-2 border-t border-slate-50 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400 block">Queue Length</span>
                      <span className="font-bold text-slate-800">
                        {centre.waitingTokensCount ?? 0} waiting
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">Intake Rate</span>
                      <span className="font-bold text-slate-800">
                        ~{centre.processingRate} Qtl/hour
                      </span>
                    </div>
                  </div>

                  {/* Supported Crops */}
                  {centre.supportedCrops && centre.supportedCrops.length > 0 && (
                    <div className="mt-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                        Accepting Crops:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {centre.supportedCrops.map((sc) => (
                          <span
                            key={sc.id}
                            className="px-2 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 text-[11px] font-medium border border-emerald-100"
                          >
                            {sc.crop?.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center gap-2">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${centre.latitude},${centre.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors flex items-center justify-center"
                    title="Get Directions on Google Maps"
                  >
                    <Navigation className="w-4 h-4 text-emerald-600" />
                  </a>

                  <button
                    onClick={() => openTokenModal(centre)}
                    disabled={!canIssueToken}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 transition-all shadow-sm shadow-emerald-600/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Ticket className="w-4 h-4" />
                    {canIssueToken ? 'Get Queue Token' : 'Queue Unavailable'}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Get Queue Token Modal */}
      <Modal
        isOpen={Boolean(selectedCentre)}
        onClose={() => setSelectedCentre(null)}
        title={`Request Queue Token — ${selectedCentre?.name || ''}`}
      >
        <form onSubmit={handleTokenSubmit} className="space-y-4">
          {tokenError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
              {tokenError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Select Crop to Deliver *
            </label>
            <select
              value={tokenCropId}
              onChange={(e) => setTokenCropId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              {selectedCentre?.supportedCrops?.map((sc) => (
                <option key={sc.cropId} value={sc.cropId}>
                  {sc.crop?.name} (Max Daily: {sc.maxDailyCapacity} Qtl)
                </option>
              )) ||
                masterCrops.map((mc) => (
                  <option key={mc.id} value={mc.id}>
                    {mc.name}
                  </option>
                ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Estimated Quantity *
              </label>
              <input
                type="number"
                min="1"
                required
                value={tokenQuantity}
                onChange={(e) => setTokenQuantity(parseFloat(e.target.value) || 1)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Unit
              </label>
              <select
                value={tokenUnit}
                onChange={(e) => setTokenUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="Quintal">Quintal</option>
                <option value="Kg">Kg</option>
                <option value="Ton">Ton</option>
              </select>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
            <span className="font-bold block mb-0.5">Procurement Guidelines:</span>
            Ensure your grain moisture is within prescribed FCI tolerances (below 12% for wheat) before dispatch. A digital token guarantees queue sequence at the gate.
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedCentre(null)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmittingToken}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmittingToken ? 'Generating Token...' : 'Confirm & Issue Token'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
