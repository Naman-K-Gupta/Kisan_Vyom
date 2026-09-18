import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../api';
import { ProcurementCentreDTO, QueueTokenDTO } from '@smart-farmer/shared';
import { StatCard } from '../../components/common/StatCard';
import {
  Users,
  Scale,
  CheckCircle,
  Play,
  Pause,
  RefreshCw,
  Radio,
  Camera,
  ShieldCheck,
} from 'lucide-react';
import { QualityAssayModal } from '../../components/manager/QualityAssayModal';
import { WeighmentReceiptModal } from '../../components/manager/WeighmentReceiptModal';
import { CapacityRateController } from '../../components/manager/CapacityRateController';
import { VehicleQueueTable } from '../../components/manager/VehicleQueueTable';
import { ActiveInspectionBay } from '../../components/manager/ActiveInspectionBay';
import { FarmerIdentityModal } from '../../components/manager/FarmerIdentityModal';
import { CentreSwitcherCard } from '../../components/manager/CentreSwitcherCard';

export const ManagerDashboard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { socket, joinCentreRoom, leaveCentreRoom } = useSocket();
  const { showToast } = useNotifications();
  const { t } = useLanguage();

  const [isUploadingManagerPhoto, setIsUploadingManagerPhoto] = useState(false);
  const [selectedFarmerModal, setSelectedFarmerModal] = useState<QueueTokenDTO | null>(null);
  const [assayToken, setAssayToken] = useState<QueueTokenDTO | null>(null);
  const [receiptData, setReceiptData] = useState<{ token: QueueTokenDTO; payment: any } | null>(null);

  // All available centres for selection
  const [allCentres, setAllCentres] = useState<ProcurementCentreDTO[]>([]);
  const [selectedCentreId, setSelectedCentreId] = useState<string>(() => {
    return localStorage.getItem('manager_active_centre_id') || '';
  });
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedState, setSelectedState] = useState('ALL');

  // Currently active centre and queue data
  const [centre, setCentre] = useState<ProcurementCentreDTO | null>(null);
  const [waitingTokens, setWaitingTokens] = useState<QueueTokenDTO[]>([]);
  const [calledTokens, setCalledTokens] = useState<QueueTokenDTO[]>([]);
  const [processingTokens, setProcessingTokens] = useState<QueueTokenDTO[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Capacity quick editor form
  const [capacityUsage, setCapacityUsage] = useState(0);
  const [totalCapacity, setTotalCapacity] = useState(5000);
  const [processingRate, setProcessingRate] = useState(50);
  const [isUpdatingCapacity, setIsUpdatingCapacity] = useState(false);
  const [lastCapacityUpdate, setLastCapacityUpdate] = useState<{
    quantity: number;
    farmerName?: string;
    tokenNumber?: string;
    timestamp: number;
  } | null>(null);

  const loadCentreQueue = async (targetId?: string) => {
    const idToUse = targetId || selectedCentreId;
    if (!idToUse) {
      setIsLoading(false);
      return;
    }

    try {
      joinCentreRoom(idToUse);

      const res = await api.queue.getCentreQueue(idToUse);
      if (res.data.success) {
        setCentre(res.data.centre);
        setWaitingTokens(res.data.queue.waiting);
        setCalledTokens(res.data.queue.called);
        setProcessingTokens(res.data.queue.processing);
        setCompletedCount(res.data.queue.completedTodayCount);

        setCapacityUsage(res.data.centre.currentUsage);
        setTotalCapacity(res.data.centre.totalCapacity);
        setProcessingRate(res.data.centre.processingRate);
      }
    } catch (err) {
      console.error('Failed to load manager queue:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const loadAllCentresAndInit = async () => {
    try {
      setIsLoading(true);
      const res = await api.centres.getAll();
      const centresList = res.data.centres || [];
      setAllCentres(centresList);

      if (centresList.length > 0) {
        const storedId = localStorage.getItem('manager_active_centre_id');
        const userAssigned = user?.managedCentres?.[0];

        let initialId = '';
        if (storedId && centresList.some((c) => c.id === storedId)) {
          initialId = storedId;
        } else if (userAssigned && centresList.some((c) => c.id === userAssigned)) {
          initialId = userAssigned;
        } else {
          initialId = centresList[0].id;
        }

        setSelectedCentreId(initialId);
        localStorage.setItem('manager_active_centre_id', initialId);
        await loadCentreQueue(initialId);
      } else {
        setIsLoading(false);
      }
    } catch (err) {
      console.error('Failed to load centres:', err);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadAllCentresAndInit();
  }, [user]);

  const handleSelectCentre = async (newCentre: ProcurementCentreDTO) => {
    if (newCentre.id === selectedCentreId) {
      setIsSelectorOpen(false);
      return;
    }

    if (selectedCentreId) {
      leaveCentreRoom(selectedCentreId);
    }

    setSelectedCentreId(newCentre.id);
    localStorage.setItem('manager_active_centre_id', newCentre.id);
    setIsSelectorOpen(false);

    showToast(
      t('manager.switchCentre'),
      `${t('manager.switchedCentreSuccess')} ${newCentre.name} (${newCentre.state})`,
      'info'
    );

    await loadCentreQueue(newCentre.id);
  };

  // Real-time socket events for Manager Queue Desk & Live Capacity
  useEffect(() => {
    if (!socket) return;

    const handleQueueUpdated = () => {
      if (selectedCentreId) {
        loadCentreQueue(selectedCentreId);
      }
    };

    const handleCapacityUpdated = (payload: {
      centreId: string;
      currentUsage: number;
      totalCapacity: number;
      processingRate?: number;
      remainingCapacity?: number;
      addedQuantity?: number;
      farmerName?: string;
      tokenNumber?: string;
    }) => {
      if (!payload) return;

      setAllCentres((prev) =>
        prev.map((c) =>
          c.id === payload.centreId
            ? {
                ...c,
                currentUsage: payload.currentUsage,
                totalCapacity: payload.totalCapacity,
                processingRate: payload.processingRate ?? c.processingRate,
              }
            : c
        )
      );

      if (payload.centreId === selectedCentreId) {
        setCapacityUsage(payload.currentUsage);
        setTotalCapacity(payload.totalCapacity);
        if (payload.processingRate !== undefined) {
          setProcessingRate(payload.processingRate);
        }
        setCentre((prev) =>
          prev
            ? {
                ...prev,
                currentUsage: payload.currentUsage,
                totalCapacity: payload.totalCapacity,
                processingRate: payload.processingRate ?? prev.processingRate,
              }
            : prev
        );

        if (payload.addedQuantity) {
          setLastCapacityUpdate({
            quantity: payload.addedQuantity,
            farmerName: payload.farmerName || 'Farmer',
            tokenNumber: payload.tokenNumber,
            timestamp: Date.now(),
          });
        }
      }
    };

    socket.on('queue:updated', handleQueueUpdated);
    socket.on('queue:completed', handleQueueUpdated);
    socket.on('centre:capacityUpdated', handleCapacityUpdated);
    socket.on('centre:statusUpdated', handleQueueUpdated);

    return () => {
      socket.off('queue:updated', handleQueueUpdated);
      socket.off('queue:completed', handleQueueUpdated);
      socket.off('centre:capacityUpdated', handleCapacityUpdated);
      socket.off('centre:statusUpdated', handleQueueUpdated);
    };
  }, [socket, selectedCentreId]);

  // Actions
  const handleCallToken = async (id: string) => {
    try {
      await api.queue.callToken(id);
      showToast('Farmer Called', 'Notification dispatched to farmer phone & screen.', 'TOKEN_CALLED');
      loadCentreQueue();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const handleStartProcessing = async (id: string) => {
    try {
      await api.queue.startProcessing(id);
      showToast('Processing Started', 'Weighing bay status updated.', 'PROCESSING_STARTED');
      loadCentreQueue();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const handleCompleteProcurement = (tokenObj: QueueTokenDTO) => {
    setAssayToken(tokenObj);
  };

  const handleAssayComplete = (completedToken: QueueTokenDTO, paymentObj: any, updatedCentre?: any) => {
    setAssayToken(null);
    setReceiptData({ token: completedToken, payment: paymentObj });
    showToast(
      'Procurement Completed!',
      `Official Tulai Parchi dispatched to farmer ${completedToken.farmer?.fullName || ''}.`,
      'PROCUREMENT_COMPLETED'
    );

    if (updatedCentre) {
      setCentre(updatedCentre);
      setCapacityUsage(updatedCentre.currentUsage);
      setTotalCapacity(updatedCentre.totalCapacity);
      setProcessingRate(updatedCentre.processingRate);
      setAllCentres((prev) =>
        prev.map((c) => (c.id === updatedCentre.id ? { ...c, ...updatedCentre } : c))
      );
    } else if (completedToken.quantity) {
      setCapacityUsage((prev) => prev + completedToken.quantity);
      setCentre((prev) => (prev ? { ...prev, currentUsage: prev.currentUsage + completedToken.quantity } : prev));
    }

    setLastCapacityUpdate({
      quantity: completedToken.quantity,
      farmerName: completedToken.farmer?.fullName,
      tokenNumber: completedToken.tokenNumber,
      timestamp: Date.now(),
    });

    loadCentreQueue(selectedCentreId);
  };

  const handleSkipToken = async (id: string) => {
    if (!window.confirm('Mark this farmer as absent/skipped?')) return;
    try {
      await api.queue.skipToken(id);
      showToast('Token Skipped', 'Queue advanced to next waiting vehicle.', 'TOKEN_SKIPPED');
      loadCentreQueue();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const handleTogglePause = async () => {
    if (!centre) return;
    const isPaused = centre.status === 'TEMPORARILY_UNAVAILABLE';
    try {
      await api.queue.togglePause(centre.id, !isPaused);
      showToast(isPaused ? 'Queue Resumed' : 'Queue Paused', 'Centre status updated.', 'info');
      loadCentreQueue();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Action failed');
    }
  };

  const handleSaveCapacity = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!centre) return;
    setIsUpdatingCapacity(true);

    try {
      await api.centres.updateCapacity(centre.id, {
        currentUsage: capacityUsage,
        totalCapacity,
        processingRate,
      });
      showToast('Capacity Saved', 'Updated metrics broadcast in real time.', 'success');
      loadCentreQueue();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update capacity');
    } finally {
      setIsUpdatingCapacity(false);
    }
  };

  const handleManagerPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      showToast('Invalid File', 'Only JPG, PNG, and WebP images are allowed.', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('File Too Large', 'Image file size must be under 5MB.', 'error');
      return;
    }

    const uploadFormData = new FormData();
    uploadFormData.append('picture', file);

    setIsUploadingManagerPhoto(true);
    try {
      await api.farmer.uploadProfilePicture(uploadFormData);
      await refreshUser();
      showToast('Photo Updated', 'Manager profile photo updated successfully.', 'success');
    } catch (err: any) {
      showToast('Upload Failed', err.response?.data?.message || 'Failed to upload photo.', 'error');
    } finally {
      setIsUploadingManagerPhoto(false);
    }
  };

  const isQueuePaused = centre?.status === 'TEMPORARILY_UNAVAILABLE';
  const remainingCapacity = centre ? Math.max(0, centre.totalCapacity - centre.currentUsage) : 0;
  const usagePercentage = centre
    ? Math.min(100, Math.round((centre.currentUsage / centre.totalCapacity) * 100))
    : 0;

  const availableStates = [
    'ALL',
    ...Array.from(new Set(allCentres.map((c) => c.state))).filter(Boolean).sort(),
  ];

  const filteredCentres = allCentres.filter((c) => {
    const matchesState = selectedState === 'ALL' || c.state.toLowerCase() === selectedState.toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      c.name.toLowerCase().includes(q) ||
      c.district.toLowerCase().includes(q) ||
      c.state.toLowerCase().includes(q);
    return matchesState && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {/* Manager Photo Avatar */}
          <div className="relative group shrink-0">
            <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-none bg-emerald-800 border-2 border-emerald-500 overflow-hidden shadow-md flex items-center justify-center text-white font-black text-xl">
              {user?.farmerProfile?.profilePictureUrl ? (
                <img
                  src={user.farmerProfile.profilePictureUrl}
                  alt={user.fullName}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span>{user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'M'}</span>
              )}
            </div>

            {/* Camera Upload Button */}
            <label
              htmlFor="manager-photo-upload"
              className="absolute -bottom-1 -right-1 p-1.5 rounded-none bg-emerald-600 hover:bg-emerald-700 text-white shadow-md cursor-pointer transition-transform hover:scale-110 active:scale-95"
              title="Update Manager Photo"
            >
              {isUploadingManagerPhoto ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Camera className="w-3.5 h-3.5" />
              )}
            </label>
            <input
              id="manager-photo-upload"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              onChange={handleManagerPhotoUpload}
              disabled={isUploadingManagerPhoto}
            />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                {t('manager.title')}
              </h1>
              <span className="live-pulse w-3 h-3 rounded-none bg-emerald-500" />
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-none flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-600" />
                {user?.fullName || 'Centre In-Charge'}
              </span>
              <p className="text-xs text-slate-500">
                {t('manager.operatingAt')}:{' '}
                <span className="font-bold text-slate-800">{centre?.name || t('manager.assignedCentre')}</span>
                {centre && ` (${centre.district}, ${centre.state})`}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePause}
            className={`px-4 py-2 rounded-none text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
              isQueuePaused
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-amber-500 hover:bg-amber-600 text-white'
            }`}
          >
            {isQueuePaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            {isQueuePaused ? t('manager.resumeQueue') : t('manager.pauseQueue')}
          </button>

          <button
            onClick={() => loadCentreQueue()}
            className="p-2 rounded-none border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Procurement Centre Switcher / Selector Card */}
      <CentreSwitcherCard
        centre={centre}
        allCentres={allCentres}
        selectedCentreId={selectedCentreId}
        isQueuePaused={isQueuePaused}
        processingRate={processingRate}
        isSelectorOpen={isSelectorOpen}
        searchQuery={searchQuery}
        selectedState={selectedState}
        availableStates={availableStates}
        filteredCentres={filteredCentres}
        t={t}
        onToggleSelector={() => setIsSelectorOpen(!isSelectorOpen)}
        onSearchQueryChange={setSearchQuery}
        onSelectedStateChange={setSelectedState}
        onSelectCentre={handleSelectCentre}
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Waiting Vehicles"
          value={waitingTokens.length}
          subtitle="Awaiting call to gate"
          icon={Users}
          iconColor="text-amber-600"
          bgColor="bg-amber-50"
        />

        <StatCard
          title="Currently at Bay"
          value={processingTokens.length + calledTokens.length}
          subtitle="Called or weighing"
          icon={Radio}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
        />

        <StatCard
          title="Completed Today"
          value={completedCount}
          subtitle="Consignments cleared"
          icon={CheckCircle}
          iconColor="text-emerald-600"
          bgColor="bg-emerald-50"
        />

        <StatCard
          title="Storage Utilization"
          value={`${usagePercentage}%`}
          subtitle={`${remainingCapacity} Qtl available`}
          icon={Scale}
          iconColor="text-purple-600"
          bgColor="bg-purple-50"
        />
      </div>

      {/* Active Processing & Called Bay Focus Card and Real-Time Capacity Adjustment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ActiveInspectionBay
          calledTokens={calledTokens}
          processingTokens={processingTokens}
          onStartProcessing={handleStartProcessing}
          onSkipToken={handleSkipToken}
          onCompleteProcurement={handleCompleteProcurement}
          onSelectFarmer={setSelectedFarmerModal}
        />

        <CapacityRateController
          capacityUsage={capacityUsage}
          totalCapacity={totalCapacity}
          processingRate={processingRate}
          isUpdatingCapacity={isUpdatingCapacity}
          lastCapacityUpdate={lastCapacityUpdate}
          onCapacityUsageChange={setCapacityUsage}
          onTotalCapacityChange={setTotalCapacity}
          onProcessingRateChange={setProcessingRate}
          onSaveCapacity={handleSaveCapacity}
        />
      </div>

      {/* Waiting Farmers Queue Table */}
      <VehicleQueueTable
        waitingTokens={waitingTokens}
        onCallToken={handleCallToken}
        onSkipToken={handleSkipToken}
        onSelectFarmer={setSelectedFarmerModal}
      />

      {/* Farmer Identity & Photo Verification Modal */}
      <FarmerIdentityModal
        selectedFarmerModal={selectedFarmerModal}
        onClose={() => setSelectedFarmerModal(null)}
        onCallToken={handleCallToken}
        onStartProcessing={handleStartProcessing}
        onCompleteProcurement={handleCompleteProcurement}
      />

      {/* Quality Assay & Moisture Refraction Modal */}
      <QualityAssayModal
        isOpen={Boolean(assayToken)}
        onClose={() => setAssayToken(null)}
        token={assayToken}
        onComplete={handleAssayComplete}
      />

      {/* Official Digital Weighment Slip (Tulai Parchi) Modal */}
      <WeighmentReceiptModal
        isOpen={Boolean(receiptData)}
        onClose={() => setReceiptData(null)}
        token={receiptData?.token || null}
        payment={receiptData?.payment || null}
      />
    </div>
  );
};
