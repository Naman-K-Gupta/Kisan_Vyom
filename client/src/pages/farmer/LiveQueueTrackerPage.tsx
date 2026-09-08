import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import { useSocket } from '../../contexts/SocketContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { QueueTokenDTO } from '@smart-farmer/shared';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { Link } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  Building2,
  Wheat,
  Scale,
  Navigation,
  Ban,
  ArrowRight,
  Radio,
} from 'lucide-react';

export const LiveQueueTrackerPage: React.FC = () => {
  const { socket, joinCentreRoom, leaveCentreRoom } = useSocket();
  const { showToast } = useNotifications();

  const [token, setToken] = useState<QueueTokenDTO | null>(null);
  const [currentServingToken, setCurrentServingToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  const fetchToken = async () => {
    try {
      const res = await api.queue.getMyToken();
      if (res.data.success && res.data.token) {
        setToken(res.data.token);
        joinCentreRoom(res.data.token.centreId);

        // Fetch centre queue to see who is currently called/processing
        const centreRes = await api.queue.getCentreQueue(res.data.token.centreId);
        if (centreRes.data.success) {
          const active =
            centreRes.data.queue.processing[0] || centreRes.data.queue.called[0];
          setCurrentServingToken(active ? active.tokenNumber : 'None currently');
        }
      } else {
        setToken(null);
      }
    } catch (err) {
      console.error('Failed to load queue token:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchToken();

    return () => {
      if (token) leaveCentreRoom(token.centreId);
    };
  }, []);

  // Listen for real-time socket events
  useEffect(() => {
    if (!socket) return;

    const handleQueueCalled = (updated: QueueTokenDTO) => {
      if (token && updated.id === token.id) {
        setToken(updated);
        showToast(
          'YOUR TOKEN IS CALLED!',
          `Token ${updated.tokenNumber}: Please report immediately to the weighing bay.`,
          'TOKEN_CALLED'
        );
      }
      setCurrentServingToken(updated.tokenNumber);
    };

    const handleQueueProcessing = (updated: QueueTokenDTO) => {
      if (token && updated.id === token.id) {
        setToken(updated);
        showToast(
          'Processing Started',
          `Consignment weighing and inspection has commenced.`,
          'PROCESSING_STARTED'
        );
      }
      setCurrentServingToken(updated.tokenNumber);
    };

    const handleQueueCompleted = (updated: QueueTokenDTO) => {
      if (token && updated.id === token.id) {
        setToken(null);
        showToast(
          'Procurement Completed!',
          `Consignment of ${updated.quantity} ${updated.unit} successfully procured.`,
          'PROCUREMENT_COMPLETED'
        );
      }
    };

    const handleQueueUpdated = () => {
      fetchToken();
    };

    socket.on('queue:called', handleQueueCalled);
    socket.on('queue:processing', handleQueueProcessing);
    socket.on('queue:completed', handleQueueCompleted);
    socket.on('queue:updated', handleQueueUpdated);

    return () => {
      socket.off('queue:called', handleQueueCalled);
      socket.off('queue:processing', handleQueueProcessing);
      socket.off('queue:completed', handleQueueCompleted);
      socket.off('queue:updated', handleQueueUpdated);
    };
  }, [socket, token]);

  const handleCancelToken = async () => {
    if (!token) return;
    const reason = prompt('Please enter cancellation reason (optional):') || 'Farmer cancelled';

    setIsCancelling(true);
    try {
      await api.queue.cancelToken(token.id, reason);
      setToken(null);
      showToast('Token Cancelled', 'Your queue slot has been released.', 'info');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to cancel token');
    } finally {
      setIsCancelling(false);
    }
  };

  if (!token) {
    return (
      <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Live Digital Queue Tracker
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time queue monitoring synchronized with APMC procurement desks
          </p>
        </div>

        <EmptyState
          title="No Active Queue Token"
          description="You are not currently in any queue. Find an open procurement centre to book your digital bay slot and receive a token."
          icon={Clock}
          actionLabel="Browse Centres & Get Token"
          onAction={() => (window.location.href = '/farmer/centres')}
        />
      </div>
    );
  }

  const isCalled = token.status === 'CALLED';
  const isProcessing = token.status === 'PROCESSING';

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Live Digital Queue Tracker
            </h1>
            <span className="live-pulse w-3 h-3 rounded-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 uppercase tracking-wider">
              Live Synchronized
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Your position updates automatically without needing to refresh this page
          </p>
        </div>

        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${token.centre?.address}`}
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 text-xs font-bold inline-flex items-center gap-1.5 shadow-sm transition-all"
        >
          <Navigation className="w-3.5 h-3.5 text-emerald-600" /> Navigate to Centre
        </a>
      </div>

      {/* Urgency Alert when Called */}
      {isCalled && (
        <div className="p-6 rounded-3xl bg-blue-600 text-white shadow-xl shadow-blue-600/25 animate-bounce-slow">
          <div className="flex items-center gap-3">
            <Radio className="w-6 h-6 text-white animate-pulse" />
            <div>
              <h2 className="text-lg font-black tracking-wide">
                YOUR TURN HAS ARRIVED! TOKEN {token.tokenNumber}
              </h2>
              <p className="text-xs text-blue-100 mt-0.5">
                The centre manager has called your token. Please drive your vehicle to Bay 1 for moisture verification and weighing.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Main Token Display Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-xl shadow-slate-200/40">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Token Reference
            </span>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {token.tokenNumber}
              </span>
              <Badge status={token.status} />
            </div>
          </div>

          <div className="text-left md:text-right">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Procurement Centre
            </span>
            <h3 className="text-base font-bold text-slate-800 mt-1">{token.centre?.name}</h3>
            <p className="text-xs text-slate-400">{token.centre?.address}</p>
          </div>
        </div>

        {/* Live Metrics Quad */}
        <div className="my-8 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div className="p-4 rounded-2xl bg-emerald-50/60 border border-emerald-100">
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
              Your Position
            </span>
            <span className="text-3xl font-black text-emerald-900 mt-1 block">
              #{token.position}
            </span>
            <span className="text-[10px] text-emerald-600">in current queue</span>
          </div>

          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Farmers Ahead
            </span>
            <span className="text-3xl font-black text-slate-800 mt-1 block">
              {token.farmersAhead ?? 0}
            </span>
            <span className="text-[10px] text-slate-400">waiting before you</span>
          </div>

          <div className="p-4 rounded-2xl bg-amber-50/60 border border-amber-100">
            <span className="text-[11px] font-bold text-amber-700 uppercase tracking-wider block">
              Est. Wait Time
            </span>
            <span className="text-3xl font-black text-amber-900 mt-1 block">
              ~{token.estimatedWaitMinutes}m
            </span>
            <span className="text-[10px] text-amber-700">real-time calculation</span>
          </div>

          <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100">
            <span className="text-[11px] font-bold text-blue-700 uppercase tracking-wider block">
              Currently Serving
            </span>
            <span className="text-base font-extrabold text-blue-900 mt-2 block truncate">
              {currentServingToken || 'Bay Idle'}
            </span>
            <span className="text-[10px] text-blue-600">at inspection bay</span>
          </div>
        </div>

        {/* Queue Progression Steps */}
        <div className="pt-6 border-t border-slate-100">
          <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 text-center sm:text-left">
            Procurement Journey Progress
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
            {/* Step 1 */}
            <div
              className={`p-4 rounded-2xl border ${
                token.status === 'WAITING'
                  ? 'border-amber-400 bg-amber-50/50'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <CheckCircle2
                  className={`w-4 h-4 ${
                    token.status !== 'CANCELLED' ? 'text-emerald-500' : 'text-slate-300'
                  }`}
                />
                <span className="text-xs font-bold text-slate-800">1. Token Issued</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Sequence assigned in database. You can wait at home or nearby.
              </p>
            </div>

            {/* Step 2 */}
            <div
              className={`p-4 rounded-2xl border ${
                token.status === 'CALLED'
                  ? 'border-blue-500 bg-blue-50/70 shadow-md'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Radio
                  className={`w-4 h-4 ${
                    token.status === 'CALLED'
                      ? 'text-blue-600 animate-pulse'
                      : isProcessing
                      ? 'text-emerald-500'
                      : 'text-slate-300'
                  }`}
                />
                <span className="text-xs font-bold text-slate-800">2. Bay Called</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Report vehicle to the procurement weighing bay with consignment.
              </p>
            </div>

            {/* Step 3 */}
            <div
              className={`p-4 rounded-2xl border ${
                token.status === 'PROCESSING'
                  ? 'border-blue-500 bg-blue-50/70 shadow-md'
                  : 'border-slate-200 bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <Scale
                  className={`w-4 h-4 ${
                    token.status === 'PROCESSING' ? 'text-blue-600 animate-pulse' : 'text-slate-300'
                  }`}
                />
                <span className="text-xs font-bold text-slate-800">3. Weighing & Check</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Moisture inspection and gross tare weight recording in progress.
              </p>
            </div>

            {/* Step 4 */}
            <div className="p-4 rounded-2xl border border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2 mb-2">
                <Wheat className="w-4 h-4 text-slate-300" />
                <span className="text-xs font-bold text-slate-800">4. Receipt & DBT</span>
              </div>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Procurement signed off. Purchase acknowledgment receipt generated.
              </p>
            </div>
          </div>
        </div>

        {/* Consignment Details & Cancellation Option */}
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-xs text-slate-600">
            Registered Crop:{' '}
            <span className="font-bold text-slate-900">
              {token.crop?.name} — {token.quantity} {token.unit}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCancelToken}
            disabled={isCancelling || token.status === 'PROCESSING'}
            className="px-4 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors inline-flex items-center gap-1.5 disabled:opacity-40"
          >
            <Ban className="w-3.5 h-3.5" /> Cancel Token
          </button>
        </div>
      </div>
    </div>
  );
};
