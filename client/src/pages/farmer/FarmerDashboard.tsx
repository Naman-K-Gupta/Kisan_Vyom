import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { api } from '../../api';
import {
  WeatherDataDTO,
  QueueTokenDTO,
  FarmerCropDTO,
  GovernmentCropPriceDTO,
  AlertDTO,
} from '@smart-farmer/shared';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { Link } from 'react-router-dom';
import {
  CloudSun,
  Clock,
  Wheat,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Droplets,
  Wind,
  Compass,
  CheckCircle,
  Building2,
  Calendar,
} from 'lucide-react';

export const FarmerDashboard: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();

  const [weather, setWeather] = useState<WeatherDataDTO | null>(null);
  const [activeToken, setActiveToken] = useState<QueueTokenDTO | null>(null);
  const [crops, setCrops] = useState<FarmerCropDTO[]>([]);
  const [topPrices, setTopPrices] = useState<GovernmentCropPriceDTO[]>([]);
  const [alerts, setAlerts] = useState<AlertDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      // 1. Weather
      const weatherRes = await api.weather.get({ locationName: `${user?.district}, ${user?.state}` });
      if (weatherRes.data.success && weatherRes.data.weather) {
        setWeather(weatherRes.data.weather);
      }

      // 2. Active Token
      const tokenRes = await api.queue.getMyToken();
      if (tokenRes.data.success) {
        setActiveToken(tokenRes.data.token);
      }

      // 3. Crops
      const cropsRes = await api.crops.getFarmerCrops();
      if (cropsRes.data.success) {
        setCrops(cropsRes.data.crops);
      }

      // 4. MSP Prices
      const pricesRes = await api.prices.getGovernmentPrices();
      if (pricesRes.data.success) {
        setTopPrices(pricesRes.data.prices.slice(0, 4));
      }

      // 5. Alerts
      const alertsRes = await api.alerts.getAll({ location: user?.state });
      if (alertsRes.data.success) {
        setAlerts(alertsRes.data.alerts.slice(0, 3));
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  // Listen for real-time queue socket updates
  useEffect(() => {
    if (!socket) return;

    const handleQueueCalled = (token: QueueTokenDTO) => {
      if (activeToken && token.id === activeToken.id) {
        setActiveToken(token);
      }
    };

    const handleQueueUpdated = () => {
      api.queue.getMyToken().then((res) => {
        if (res.data.success) setActiveToken(res.data.token);
      });
    };

    socket.on('queue:called', handleQueueCalled);
    socket.on('queue:processing', handleQueueCalled);
    socket.on('queue:completed', () => setActiveToken(null));
    socket.on('queue:cancelled', () => setActiveToken(null));
    socket.on('queue:updated', handleQueueUpdated);

    return () => {
      socket.off('queue:called', handleQueueCalled);
      socket.off('queue:processing', handleQueueCalled);
      socket.off('queue:completed');
      socket.off('queue:cancelled');
      socket.off('queue:updated', handleQueueUpdated);
    };
  }, [socket, activeToken]);

  const totalLandArea = crops.reduce((sum, c) => sum + c.landArea, 0);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Welcome Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-700 via-emerald-600 to-teal-700 text-white p-6 sm:p-8 shadow-xl shadow-emerald-900/10 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-white/15 backdrop-blur text-emerald-100 mb-3">
              🌱 Kisan Portal
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Namaste, {user?.fullName || 'Farmer'}!
            </h1>
            <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
              Welcome to your digital farming hub. Track live APMC mandi queues, verify official MSP
              support prices, and plan operations with live weather telemetry.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/farmer/centres"
              className="px-5 py-2.5 rounded-2xl bg-white text-emerald-800 text-xs font-bold hover:bg-emerald-50 active:scale-95 transition-all shadow-md flex items-center gap-2"
            >
              <Building2 className="w-4 h-4" /> Find Centres
            </Link>
            <Link
              to="/farmer/ai"
              className="px-5 py-2.5 rounded-2xl bg-emerald-800/60 border border-white/20 text-white text-xs font-bold hover:bg-emerald-800 active:scale-95 transition-all flex items-center gap-2"
            >
              <Compass className="w-4 h-4" /> AI Advisor
            </Link>
          </div>
        </div>
      </div>

      {/* Live Alerts Banner (if active alerts exist) */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-4 rounded-2xl bg-amber-50 border border-amber-200/80 flex items-start gap-3 text-amber-900"
            >
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold">{alert.title}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200/60 text-amber-800">
                    {alert.priority}
                  </span>
                </div>
                <p className="text-xs text-amber-800/90 mt-0.5 leading-relaxed">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Top Telemetry Grid: Weather & Farm Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Weather Card */}
        <div className="bg-white rounded-2xl p-6 border border-slate-100 shadow-card">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Live Weather</span>
            <CloudSun className="w-5 h-5 text-amber-500" />
          </div>
          {weather ? (
            <div className="mt-3">
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-extrabold text-slate-900">
                  {weather.current.temperature}°C
                </span>
                <span className="text-xs font-semibold text-slate-500">
                  {weather.current.condition}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">{weather.locationName}</p>
              <div className="mt-3 pt-3 border-t border-slate-50 grid grid-cols-2 gap-2 text-xs text-slate-600">
                <span className="flex items-center gap-1.5">
                  <Droplets className="w-3.5 h-3.5 text-blue-500" /> Rain: {weather.current.rainProbability}%
                </span>
                <span className="flex items-center gap-1.5">
                  <Wind className="w-3.5 h-3.5 text-teal-500" /> Wind: {weather.current.windSpeed} km/h
                </span>
              </div>
            </div>
          ) : (
            <p className="mt-4 text-xs text-slate-400">Live weather data is currently unavailable.</p>
          )}
        </div>

        <StatCard
          title="Active Crops Planted"
          value={crops.length}
          subtitle={`${totalLandArea} Acres under cultivation`}
          icon={Wheat}
          iconColor="text-emerald-600"
          bgColor="bg-emerald-50"
        />

        <StatCard
          title="Government MSP Monitored"
          value={topPrices.length}
          subtitle="Official CACP Rates 2025-26"
          icon={TrendingUp}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
        />

        <StatCard
          title="Queue Status"
          value={activeToken ? `#${activeToken.position}` : 'No Token'}
          subtitle={activeToken ? `Token ${activeToken.tokenNumber}` : 'Ready to request'}
          icon={Clock}
          iconColor={activeToken ? 'text-amber-600' : 'text-slate-400'}
          bgColor={activeToken ? 'bg-amber-50' : 'bg-slate-50'}
        />
      </div>

      {/* Real-Time Active Queue Token Widget */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold text-slate-900">Digital Queue Tracker</h3>
              {activeToken && <span className="live-pulse w-2.5 h-2.5 rounded-full bg-emerald-500" />}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Live queue position synchronization with the APMC Mandi Procurement Bay
            </p>
          </div>
          {activeToken && (
            <Link
              to="/farmer/queue"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold transition-all"
            >
              Full Screen Tracker <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          )}
        </div>

        {activeToken ? (
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-6 items-center">
            <div className="md:col-span-1 p-5 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-center">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">
                Your Token Number
              </span>
              <p className="text-2xl font-black text-emerald-900 mt-1">{activeToken.tokenNumber}</p>
              <div className="mt-3">
                <Badge status={activeToken.status} />
              </div>
            </div>

            <div className="md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-4 text-left">
              <div>
                <span className="text-[11px] font-medium text-slate-400 block">Procurement Centre</span>
                <p className="text-xs font-bold text-slate-800 mt-1 truncate">
                  {activeToken.centre?.name || 'Centre'}
                </p>
                <p className="text-[10px] text-slate-400 truncate">{activeToken.centre?.address}</p>
              </div>

              <div>
                <span className="text-[11px] font-medium text-slate-400 block">Crop & Quantity</span>
                <p className="text-xs font-bold text-slate-800 mt-1">
                  {activeToken.crop?.name}
                </p>
                <p className="text-[10px] text-slate-500 font-semibold">
                  {activeToken.quantity} {activeToken.unit}
                </p>
              </div>

              <div>
                <span className="text-[11px] font-medium text-slate-400 block">Farmers Ahead</span>
                <p className="text-lg font-extrabold text-slate-900 mt-0.5">
                  {activeToken.farmersAhead ?? 0}
                </p>
                <p className="text-[10px] text-slate-400">waiting before you</p>
              </div>

              <div>
                <span className="text-[11px] font-medium text-slate-400 block">Estimated Wait</span>
                <p className="text-lg font-extrabold text-amber-600 mt-0.5">
                  ~{activeToken.estimatedWaitMinutes} mins
                </p>
                <p className="text-[10px] text-slate-400">calculated in real-time</p>
              </div>
            </div>
          </div>
        ) : (
          <EmptyState
            title="No Active Queue Token"
            description="You do not currently have any active queue tokens. Select an open procurement centre to book your digital bay slot."
            actionLabel="Browse Procurement Centres"
            onAction={() => (window.location.href = '/farmer/centres')}
          />
        )}
      </div>

      {/* Two Column Grid: Crops Portfolio & Top MSP Rates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Crops Portfolio */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Your Crops Portfolio</h3>
              <p className="text-xs text-slate-500 mt-0.5">Active crops registered in your farm</p>
            </div>
            <Link
              to="/farmer/crops"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              Manage <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-50">
            {crops.length === 0 ? (
              <p className="py-6 text-xs text-slate-400 text-center">
                No crops registered yet. Click Manage to add your crops.
              </p>
            ) : (
              crops.slice(0, 3).map((crop) => (
                <div key={crop.id} className="py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
                      🌾
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">{crop.crop?.name}</h4>
                      <p className="text-[11px] text-slate-500">
                        {crop.variety} • {crop.landArea} Acres
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-800">
                      ~{crop.expectedProduction} {crop.unit}
                    </span>
                    <span className="block text-[10px] text-slate-400">Expected Yield</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Top MSP Rates */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900">Official Government MSP Rates</h3>
              <p className="text-xs text-slate-500 mt-0.5">Approved CACP procurement benchmarks</p>
            </div>
            <Link
              to="/farmer/prices"
              className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              All Prices <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="mt-4 divide-y divide-slate-50">
            {topPrices.length === 0 ? (
              <p className="py-6 text-xs text-slate-400 text-center">
                No government price records available currently.
              </p>
            ) : (
              topPrices.map((price) => (
                <div key={price.id} className="py-3 flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{price.cropName}</h4>
                    <span className="text-[10px] text-slate-500">
                      Season: {price.season} • {price.marketingYear}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-emerald-700">
                      ₹{price.price.toLocaleString()}
                    </span>
                    <span className="text-[11px] text-slate-400 block">per {price.unit}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
