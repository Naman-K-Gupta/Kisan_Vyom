import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import { SystemStatsDTO } from '@smart-farmer/shared';
import { StatCard } from '../../components/common/StatCard';
import { Link } from 'react-router-dom';
import {
  Users,
  Building2,
  Clock,
  Scale,
  Shield,
  ArrowRight,
  Landmark,
  FileSpreadsheet,
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
      .catch((err) => console.error('Failed to fetch admin stats:', err))
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      {/* Top Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            State Agriculture Administration Hub <Shield className="w-6 h-6 text-purple-600" />
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Real-time procurement oversight, silo capacity tracking, and government policy administration
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

      {/* Featured: Daily Centre Procurement Records Banner */}
      <div className="bg-gradient-to-r from-purple-900 via-indigo-900 to-slate-900 text-white rounded-none p-6 sm:p-7 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 border border-purple-800/50">
        <div className="space-y-2 max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-none bg-purple-800/80 text-purple-200 text-[11px] font-bold uppercase tracking-wider border border-purple-700/50">
            <span className="w-2 h-2 rounded-none bg-emerald-400 animate-pulse"></span>
            Real-Time State Procurement Oversight
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
            Daily Mandi Procurement Records by Centre
          </h2>
          <p className="text-xs sm:text-sm text-purple-200 leading-relaxed">
            Inspect daily weighbridge arrivals, grain quantities, Fair Average Quality (FAQ) grades, and DBT banking transaction UTRs for any procurement centre across the state.
          </p>
        </div>

        <Link
          to="/admin/procurement-records"
          className="px-6 py-3.5 rounded-none bg-white hover:bg-purple-50 active:scale-95 text-purple-950 font-extrabold text-xs shadow-lg transition flex items-center gap-2 self-start md:self-auto flex-shrink-0"
        >
          <span>Open Daily Procurement Ledger</span>
          <ArrowRight className="w-4 h-4 text-purple-600" />
        </Link>
      </div>

      {/* Administrative Operations Shortcuts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-none p-6 border border-slate-100 shadow-card flex flex-col justify-between">
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
            className="w-full py-2.5 rounded-none bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5"
          >
            Manage Farmers <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white rounded-none p-6 border border-slate-100 shadow-card flex flex-col justify-between">
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
            className="w-full py-2.5 rounded-none bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5"
          >
            Manage Centres <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white rounded-none p-6 border border-slate-100 shadow-card flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">
              Policy & Welfare
            </span>
            <h3 className="text-lg font-bold text-slate-900 mt-1 mb-2">Govt Policies & Schemes</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-6">
              Publish central/state subsidies, revise DBT benefit amounts, extend deadlines, and broadcast live alerts.
            </p>
          </div>
          <Link
            to="/admin/schemes"
            className="w-full py-2.5 rounded-none bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5"
          >
            <Landmark className="w-3.5 h-3.5 text-amber-700" />
            <span>Policy Console</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="bg-white rounded-none p-6 border border-slate-100 shadow-card flex flex-col justify-between">
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
            className="w-full py-2.5 rounded-none bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold text-center transition-all flex items-center justify-center gap-1.5"
          >
            View Audit Logs <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
