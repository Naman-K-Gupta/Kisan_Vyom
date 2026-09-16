import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../api';
import { ProcurementCentreDTO, CropDTO } from '@smart-farmer/shared';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { useNotifications } from '../../contexts/NotificationContext';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
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
  Compass,
} from 'lucide-react';

export const ProcurementCentresPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useNotifications();
  const { user } = useAuth();
  const { t } = useLanguage();

  const [centres, setCentres] = useState<ProcurementCentreDTO[]>([]);
  const [masterCrops, setMasterCrops] = useState<CropDTO[]>([]);
  const [selectedCropId, setSelectedCropId] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedState, setSelectedState] = useState<string>(user?.state || '');
  const [hasInitializedState, setHasInitializedState] = useState<boolean>(Boolean(user?.state));
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Token Request Modal
  const [selectedCentre, setSelectedCentre] = useState<ProcurementCentreDTO | null>(null);
  const [tokenCropId, setTokenCropId] = useState('');
  const [tokenQuantity, setTokenQuantity] = useState(25);
  const [tokenUnit, setTokenUnit] = useState('Quintal');
  const [tokenVehicleNumber, setTokenVehicleNumber] = useState('');
  const [tokenVehicleType, setTokenVehicleType] = useState('Tractor Trolley');
  const [isSubmittingToken, setIsSubmittingToken] = useState(false);
  const [tokenError, setTokenError] = useState<string | null>(null);

  const loadCentres = async () => {
    try {
      const res = await api.centres.getAll({
        state: selectedState || undefined,
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
    if (user?.state && !hasInitializedState) {
      setSelectedState(user.state);
      setHasInitializedState(true);
    }
  }, [user?.state, hasInitializedState]);

  useEffect(() => {
    loadCentres();
  }, [selectedCropId, selectedStatus, selectedState]);

  const isMyState = Boolean(user?.state && selectedState.toLowerCase() === user.state.toLowerCase());
  const isAllStates = !selectedState;

  const filteredCentres = centres.filter((c) => {
    if (selectedState && c.state.toLowerCase() !== selectedState.toLowerCase()) {
      return false;
    }
    if (selectedCropId && !c.supportedCrops?.some((sc) => sc.cropId === selectedCropId)) {
      return false;
    }
    if (selectedStatus && c.status !== selectedStatus) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        c.name.toLowerCase().includes(q) ||
        c.district.toLowerCase().includes(q) ||
        c.address.toLowerCase().includes(q) ||
        c.state.toLowerCase().includes(q)
      );
    }
    return true;
  });

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
        vehicleNumber: tokenVehicleNumber ? tokenVehicleNumber.trim().toUpperCase() : undefined,
        vehicleType: tokenVehicleType,
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
            {t('centres.title')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('centres.subtitle')}
          </p>
        </div>
      </div>

      {/* Dynamic Location Banner matching Farmer's Address */}
      {user && (
        <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50/70 border border-emerald-200/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-600/20 flex-shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                  {t('centres.registeredLocation')}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-600 text-white">
                  {t('centres.dynamicMatch')}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-800 mt-0.5">
                {user.village ? `${user.village}, ` : ''}{user.district ? `${user.district}, ` : ''}{user.state || 'India'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              type="button"
              onClick={() => setSelectedState(user.state || '')}
              className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                isMyState
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <MapPin className="w-3.5 h-3.5" />
              <span>{t('centres.centresIn')} {user.state || t('centres.myState')}</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedState('')}
              className={`flex-1 sm:flex-initial px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
                isAllStates
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20'
                  : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              <span>{t('centres.allStates')}</span>
            </button>
          </div>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-100 shadow-card flex flex-col md:flex-row items-center gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t('centres.searchPlaceholder')}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all"
          />
        </form>

        <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 w-full md:w-auto">
          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="flex-1 md:w-44 px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
          >
            <option value="">{t('centres.allStates')}</option>
            <option value="Andhra Pradesh">Andhra Pradesh</option>
            <option value="Assam">Assam</option>
            <option value="Bihar">Bihar</option>
            <option value="Chhattisgarh">Chhattisgarh</option>
            <option value="Gujarat">Gujarat</option>
            <option value="Haryana">Haryana</option>
            <option value="Himachal Pradesh">Himachal Pradesh</option>
            <option value="Jharkhand">Jharkhand</option>
            <option value="Karnataka">Karnataka</option>
            <option value="Kerala">Kerala</option>
            <option value="Madhya Pradesh">Madhya Pradesh</option>
            <option value="Maharashtra">Maharashtra</option>
            <option value="Odisha">Odisha</option>
            <option value="Punjab">Punjab</option>
            <option value="Rajasthan">Rajasthan</option>
            <option value="Tamil Nadu">Tamil Nadu</option>
            <option value="Telangana">Telangana</option>
            <option value="Uttar Pradesh">Uttar Pradesh</option>
            <option value="Uttarakhand">Uttarakhand</option>
            <option value="West Bengal">West Bengal</option>
          </select>

          <select
            value={selectedCropId}
            onChange={(e) => setSelectedCropId(e.target.value)}
            className="flex-1 md:w-40 px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">{t('centres.allCrops')}</option>
            {masterCrops.map((mc) => (
              <option key={mc.id} value={mc.id}>
                {mc.name}
              </option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="flex-1 md:w-32 px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="">{t('centres.allStatuses')}</option>
            <option value="OPEN">{t('status.open')}</option>
            <option value="BUSY">{t('status.busy')}</option>
            <option value="FULL">{t('status.full')}</option>
            <option value="CLOSED">{t('status.closed')}</option>
          </select>
        </div>
      </div>

      {/* Interactive Map Visual Locator / Google Maps Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-emerald-600" />
            <h3 className="text-base font-bold text-slate-900">{t('centres.geoLocatorTitle')}</h3>
          </div>
          <span className="text-[11px] font-semibold text-slate-400">
            {filteredCentres.length} {t('centres.verifiedLocations')}
          </span>
        </div>

        {/* Visual Map Container */}
        <div className="mt-4 relative rounded-2xl bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 p-6 text-white overflow-hidden min-h-[260px] flex flex-col justify-between">
          <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#4ade80_1px,transparent_1px)] [background-size:16px_16px]" />

          <div className="relative z-10 flex items-start justify-between">
            <div>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {t('centres.liveCoordTracking')}
              </span>
              <p className="text-xs text-slate-300 mt-2 max-w-md">
                {t('centres.directionsHint')}
              </p>
            </div>
          </div>

          <div className="relative z-10 flex flex-wrap gap-2 pt-6 max-h-52 overflow-y-auto pr-1">
            {filteredCentres.map((c) => (
              <a
                key={c.id}
                href={`https://www.google.com/maps/dir/?api=1&destination=${c.latitude},${c.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-semibold text-white flex items-center gap-1.5 transition-all"
              >
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                <span>{c.name}</span>
                <span className="text-[10px] text-emerald-300">({c.district}, {c.state})</span>
              </a>
            ))}
          </div>
        </div>
      </div>

      {/* Centres List */}
      {filteredCentres.length === 0 ? (
        <EmptyState
          title={t('centres.noCentresFound')}
          description={t('centres.noCentresFoundDesc')}
          icon={Building2}
          actionLabel={t('centres.clearFilters')}
          onAction={() => {
            setSelectedState('');
            setSelectedCropId('');
            setSelectedStatus('');
            setSearchQuery('');
          }}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCentres.map((centre) => {
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
                      <div className="flex items-center gap-1.5 flex-wrap mb-1">
                        <h3 className="text-base font-bold text-slate-900 leading-snug">
                          {centre.name}
                        </h3>
                        {(centre as any).isDistrictMatch && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {t('centres.inYourDistrict')} ({centre.district})
                          </span>
                        )}
                        {!(centre as any).isDistrictMatch && (centre as any).isStateMatch && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            {t('centres.inYourState')} ({centre.state})
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        {centre.village}, {centre.district}, {centre.state}
                      </p>
                    </div>
                    <Badge status={centre.status} />
                  </div>

                  {/* Capacity Bar */}
                  <div className="my-4 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
                      <span className="text-slate-600">{t('centres.storageCapacity')}</span>
                      <span
                        className={
                          usagePercent > 85
                            ? 'text-rose-600 font-bold'
                            : usagePercent > 60
                            ? 'text-amber-600 font-bold'
                            : 'text-emerald-700 font-bold'
                        }
                      >
                        {usagePercent}% {t('centres.utilized')}
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
                      <span>{t('centres.available')}: {centre.remainingCapacity} {t('common.quintal')}</span>
                      <span>{t('centres.total')}: {centre.totalCapacity} {t('common.quintal')}</span>
                    </div>
                  </div>

                  {/* Telemetry Metrics */}
                  <div className="grid grid-cols-2 gap-3 py-2 border-t border-slate-50 text-xs">
                    <div>
                      <span className="text-[11px] text-slate-400 block">{t('centres.queueLength')}</span>
                      <span className="font-bold text-slate-800">
                        {centre.waitingTokensCount ?? 0} {t('centres.waiting')}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block">{t('centres.intakeRate')}</span>
                      <span className="font-bold text-slate-800">
                        ~{centre.processingRate} {t('centres.qtlHour')}
                      </span>
                    </div>
                  </div>

                  {/* Supported Crops */}
                  {centre.supportedCrops && centre.supportedCrops.length > 0 && (
                    <div className="mt-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                        {t('centres.acceptingCrops')}
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

                  {/* Working Location & Operating Hours */}
                  <div className="mt-4 p-3 rounded-2xl bg-emerald-50/50 border border-emerald-100/80 text-xs space-y-2">
                    <div className="flex items-start gap-1.5 text-slate-800">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <span className="leading-snug">
                        <strong className="text-emerald-900">{t('centres.workingLocation')}</strong> {centre.address}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 pt-2 border-t border-emerald-100/60">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                        <span className="truncate">{centre.openingHours || '08:00 AM - 06:00 PM'}</span>
                      </span>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-emerald-600 flex-shrink-0" />
                        <span className="truncate">{centre.contactNumber || t('centres.contactNumber')}</span>
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
                      <span>{t('centres.gpsCoordinates')}</span>
                      <span className="text-emerald-700 font-semibold">
                        {Number(centre.latitude).toFixed(4)}° N, {Number(centre.longitude).toFixed(4)}° E
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${centre.latitude},${centre.longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2.5 px-3 rounded-xl border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 shadow-sm"
                    title={t('centres.viewMapDirections')}
                  >
                    <Navigation className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{t('centres.viewMapDirections')}</span>
                  </a>

                  <button
                    onClick={() => openTokenModal(centre)}
                    disabled={!canIssueToken}
                    className="flex-1 py-2.5 px-4 rounded-xl text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 active:scale-98 transition-all shadow-sm shadow-emerald-600/20 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Ticket className="w-4 h-4" />
                    {canIssueToken ? t('centres.getQueueToken') : t('centres.queueFull')}
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
        title={`${t('centres.requestTokenTitle')} — ${selectedCentre?.name || ''}`}
      >
        <form onSubmit={handleTokenSubmit} className="space-y-4">
          {tokenError && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800">
              {tokenError}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('centres.selectCropDeliver')}
            </label>
            <select
              value={tokenCropId}
              onChange={(e) => setTokenCropId(e.target.value)}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              {selectedCentre?.supportedCrops?.map((sc) => (
                <option key={sc.cropId} value={sc.cropId}>
                  {sc.crop?.name} ({t('centres.maxDaily')}: {sc.maxDailyCapacity} {t('common.quintal')})
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
                {t('centres.estimatedQuantity')}
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
                {t('centres.unit')}
              </label>
              <select
                value={tokenUnit}
                onChange={(e) => setTokenUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="Quintal">{t('common.quintal')}</option>
                <option value="Kg">{t('common.kg')}</option>
                <option value="Ton">{t('common.ton')}</option>
              </select>
            </div>
          </div>

          {/* Vehicle Information for Weighbridge Gate Entry */}
          <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                🚛 Vehicle & Trolley Information
              </span>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
                Weighbridge Entry
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Vehicle Registration No.
                </label>
                <input
                  type="text"
                  placeholder="e.g. PB-10-AB-1234"
                  value={tokenVehicleNumber}
                  onChange={(e) => setTokenVehicleNumber(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold uppercase placeholder:normal-case placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                />
                <p className="text-[10px] text-slate-400 mt-0.5">Printed on official Mandi Weighment Slip</p>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Vehicle Category
                </label>
                <select
                  value={tokenVehicleType}
                  onChange={(e) => setTokenVehicleType(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                >
                  <option value="Tractor Trolley">🚜 Tractor Trolley (Standard)</option>
                  <option value="Mini Truck / Canter">🚛 Canter / Eicher / Mini Truck</option>
                  <option value="Heavy Multi-Axle Truck">🚚 Heavy Multi-Axle Truck (10+ Wheeler)</option>
                  <option value="Pickup / Chota Hathi">🛺 Pickup / Chota Hathi / LCV</option>
                  <option value="Bullock Cart / Other">🐂 Bullock Cart / Non-Motorized</option>
                </select>
                <p className="text-[10px] text-slate-400 mt-0.5">Used for Weighbridge Bay allocation</p>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 leading-relaxed">
            <span className="font-bold block mb-0.5">{t('centres.guidelinesTitle')}</span>
            {t('centres.guidelinesDesc')}
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setSelectedCentre(null)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmittingToken}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmittingToken ? t('centres.generatingToken') : t('centres.confirmIssueToken')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
