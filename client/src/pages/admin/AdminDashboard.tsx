import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import { SystemStatsDTO } from '@smart-farmer/shared';
import { StatCard } from '../../components/common/StatCard';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  Clock,
  TrendingUp,
  CheckCircle2,
  Scale,
  Shield,
  AlertTriangle,
  ArrowRight,
  History,
} from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<SystemStatsDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    api.admin
      .getStats()
      .then((res) => {
        if (res.data.success) setStats(res.data.stats);
      })
      .catch((err) => console.error(err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            State Agriculture Administration Hub <Shield className="w-6 h-6 text-purple-600" />
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time procurement oversight, silo capacity tracking, and compliance audit trail
          </p>
        </div>
      </div>

      {/* Real Statistics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Total Registered Farmers"
          value={stats?.totalFarmers ?? 0}
          subtitle={`${stats?.activeFarmers ?? 0} active accounts`}
          icon={Users}
          iconColor="text-emerald-600"
          bgColor="bg-emerald-50"
        />

        <StatCard
          title="Procurement Hubs"
          value={stats?.totalCentres ?? 0}
          subtitle={`${stats?.activeCentres ?? 0} actively receiving`}
          icon={Building2}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
        />

        <StatCard
          title="Active Queue Tokens"
          value={stats?.activeQueueTokens ?? 0}
          subtitle="Vehicles in line statewide"
          icon={Clock}
          iconColor="text-amber-600"
          bgColor="bg-amber-50"
        />

        <StatCard
          title="Capacity Utilization"
          value={`${stats?.averageCapacityUtilization ?? 0}%`}
          subtitle="Statewide silo fill rate"
          icon={Scale}
          iconColor="text-purple-600"
          bgColor="bg-purple-50"
        />
      </div>

      {/* Administrative Operations Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider">
              Management
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-1 mb-2">Farmers Directory</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Search registered farmers, inspect cultivated acreages, and toggle account activation status.
            </p>
          </div>
          <Link
            to="/admin/farmers"
            className="w-full py-2.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5"
          >
            Manage Farmers <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">
              Logistics
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-1 mb-2">Procurement Centres</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Create new mandi depots, define latitude/longitude coordinates, and assign centre managers.
            </p>
          </div>
          <Link
            to="/admin/centres"
            className="w-full py-2.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5"
          >
            Manage Centres <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider">
              Compliance & Security
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-1 mb-2">Audit Compliance Trail</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Inspect immutable audit records of all price updates, queue overrides, and centre capacity changes.
            </p>
          </div>
          <Link
            to="/admin/audit-logs"
            className="w-full py-2.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5"
          >
            View Audit Logs <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
