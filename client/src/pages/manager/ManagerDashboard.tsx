import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { api } from '../../api';
import { ProcurementCentreDTO, QueueTokenDTO } from '@smart-farmer/shared';
import { Badge } from '../../components/common/Badge';
import { StatCard } from '../../components/common/StatCard';
import { EmptyState } from '../../components/common/EmptyState';
import {
  Users,
  Scale,
  Clock,
  Play,
  CheckCircle,
  SkipForward,
  XCircle,
  Pause,
  Phone,
  Radio,
  Sliders,
  Building2,
  RefreshCw,
} from 'lucide-react';

export const ManagerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { socket, joinCentreRoom } = useSocket();
  const { showToast } = useNotifications();

  // Centre assigned to this manager
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

  const loadCentreQueue = async () => {
    try {
      // Fetch user's managed centre ID
      let centreId = user?.managedCentres?.[0];
      if (!centreId) {
        // Fallback: fetch all centres and pick first
        const allCentresRes = await api.centres.getAll();
        if (allCentresRes.data.centres.length > 0) {
          centreId = allCentresRes.data.centres[0].id;
        }
      }

      if (!centreId) {
        setIsLoading(false);
        return;
      }

      joinCentreRoom(centreId);

      const res = await api.queue.getCentreQueue(centreId);
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

  useEffect(() => {
    loadCentreQueue();
  }, [user]);

  // Real-time socket events for Manager Queue Desk
  useEffect(() => {
    if (!socket) return;

    const handleQueueUpdated = () => {
      loadCentreQueue();
    };

    socket.on('queue:updated', handleQueueUpdated);
    socket.on('centre:capacityUpdated', handleQueueUpdated);
    socket.on('centre:statusUpdated', handleQueueUpdated);

    return () => {
      socket.off('queue:updated', handleQueueUpdated);
      socket.off('centre:capacityUpdated', handleQueueUpdated);
      socket.off('centre:statusUpdated', handleQueueUpdated);
    };
  }, [socket]);

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

  const handleCompleteProcurement = async (id: string) => {
    try {
      await api.queue.completeProcurement(id);
      showToast('Procurement Complete', 'Receipt signed off and storage capacity updated.', 'PROCUREMENT_COMPLETED');
      loadCentreQueue();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Action failed');
    }
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

  const isQueuePaused = centre?.status === 'TEMPORARILY_UNAVAILABLE';
  const remainingCapacity = centre ? Math.max(0, centre.totalCapacity - centre.currentUsage) : 0;
  const usagePercentage = centre
    ? Math.min(100, Math.round((centre.currentUsage / centre.totalCapacity) * 100))
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Queue Operations & Weighing Bay Desk
            </h1>
            <span className="live-pulse w-3 h-3 rounded-full bg-emerald-500" />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Managing <span className="font-bold text-slate-800">{centre?.name || 'Assigned APMC Centre'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleTogglePause}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-sm ${
              isQueuePaused
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-amber-500 hover:bg-amber-600 text-white'
            }`}
          >
            {isQueuePaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            {isQueuePaused ? 'Resume Queue' : 'Pause Intake Queue'}
          </button>

          <button
            onClick={loadCentreQueue}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

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
          subtitle="Receipts issued"
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

      {/* Active Processing & Called Bay Focus Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Currently Called / Inspecting Bay */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Radio className="w-4 h-4 text-blue-600 animate-pulse" />
              Weighing Bay Active Inspection
            </h3>
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-50 text-blue-700">
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
                  className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-blue-900">{t.tokenNumber}</span>
                      <Badge status="CALLED" />
                    </div>
                    <p className="text-xs font-bold text-slate-800 mt-1">{t.farmer?.fullName}</p>
                    <p className="text-[11px] text-slate-500">
                      Mobile: {t.farmer?.mobile} • Crop: {t.crop?.name} ({t.quantity} {t.unit})
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleStartProcessing(t.id)}
                      className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all"
                    >
                      <Play className="w-3.5 h-3.5" /> Start Weighing
                    </button>
                    <button
                      onClick={() => handleSkipToken(t.id)}
                      className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-500 transition-colors"
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
                  className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-emerald-900">{t.tokenNumber}</span>
                      <Badge status="PROCESSING" />
                    </div>
                    <p className="text-xs font-bold text-slate-800 mt-1">{t.farmer?.fullName}</p>
                    <p className="text-[11px] text-slate-500">
                      Moisture check & weighing: {t.crop?.name} ({t.quantity} {t.unit})
                    </p>
                  </div>

                  <button
                    onClick={() => handleCompleteProcurement(t.id)}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 transition-all"
                  >
                    <CheckCircle className="w-4 h-4" /> Complete & Issue Receipt
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Real-time Capacity Adjustment */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-purple-600" />
              Live Centre Capacity & Rate Controller
            </h3>
            <span className="text-xs font-bold text-slate-400">Real-time sync</span>
          </div>

          <form onSubmit={handleSaveCapacity} className="space-y-4 mt-4">
            <div>
              <div className="flex items-center justify-between text-xs font-bold text-slate-700 mb-1">
                <span>Current Silo Usage</span>
                <span className="text-emerald-700">{capacityUsage} Quintals</span>
              </div>
              <input
                type="range"
                min="0"
                max={totalCapacity}
                step="50"
                value={capacityUsage}
                onChange={(e) => setCapacityUsage(parseFloat(e.target.value) || 0)}
                className="w-full accent-emerald-600"
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
                  onChange={(e) => setTotalCapacity(parseFloat(e.target.value) || 100)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
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
                  onChange={(e) => setProcessingRate(parseFloat(e.target.value) || 1)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isUpdatingCapacity}
              className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all disabled:opacity-50"
            >
              {isUpdatingCapacity ? 'Broadcasting updates...' : 'Save & Broadcast Live Capacity'}
            </button>
          </form>
        </div>
      </div>

      {/* Waiting Farmers Queue Table */}
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
              onClick={() => handleCallToken(waitingTokens[0].id)}
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
                      <span className="font-bold text-slate-900 block">{t.farmer?.fullName}</span>
                      <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-slate-400" /> {t.farmer?.mobile} • {t.farmer?.village}
                      </span>
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
                          onClick={() => handleCallToken(t.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-all flex items-center gap-1"
                        >
                          <Play className="w-3 h-3" /> Call
                        </button>
                        <button
                          onClick={() => handleSkipToken(t.id)}
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
    </div>
  );
};
