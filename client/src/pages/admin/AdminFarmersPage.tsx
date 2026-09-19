import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import { UserDTO } from '@smart-farmer/shared';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { useNotifications } from '../../contexts/NotificationContext';
import { Search, Phone, Mail, MapPin, Wheat, Check, Ban, Users } from 'lucide-react';

export const AdminFarmersPage: React.FC = () => {
  const { showToast } = useNotifications();

  const [farmers, setFarmers] = useState<UserDTO[]>([]);
  const [search, setSearch] = useState('');
  const [stateFilter, setStateFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const loadFarmers = async () => {
    try {
      const res = await api.admin.getFarmers({
        search: search || undefined,
        state: stateFilter || undefined,
      });
      if (res.data.success) {
        setFarmers(res.data.farmers);
      }
    } catch (err) {
      console.error('Failed to load farmers:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadFarmers();
  }, [stateFilter]);

  const handleToggleStatus = async (userId: string, currentStatus: boolean) => {
    try {
      await api.admin.toggleUserStatus(userId, !currentStatus);
      showToast('Status Updated', `User account ${!currentStatus ? 'activated' : 'deactivated'}.`, 'info');
      loadFarmers();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update user status');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Farmers Directory & Account Control
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Review verified farmer accounts, registered crops, and manage platform permissions
        </p>
      </div>

      {/* Search & Filter */}
      <div className="bg-white rounded-none p-4 border border-slate-100 shadow-card flex flex-col sm:flex-row items-center gap-3">
        <div className="flex-1 w-full relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search farmer by name, mobile, email, or village..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadFarmers()}
            className="w-full pl-10 pr-4 py-2.5 rounded-none border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        <button
          onClick={loadFarmers}
          className="px-4 py-2.5 rounded-none bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors"
        >
          Search
        </button>
      </div>

      {/* Farmers Table */}
      <div className="bg-white rounded-none border border-slate-100 shadow-card overflow-hidden">
        {farmers.length === 0 ? (
          <EmptyState
            title="No Farmers Found"
            description="No farmers match your search criteria. Try a different name, mobile number, or village."
            icon={Users}
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                <tr>
                  <th className="px-6 py-3.5">Farmer Name</th>
                  <th className="px-6 py-3.5">Contact</th>
                  <th className="px-6 py-3.5">Location</th>
                  <th className="px-6 py-3.5">Land Area</th>
                  <th className="px-6 py-3.5">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {farmers.map((farmer) => (
                  <tr key={farmer.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {farmer.farmerProfile?.profilePictureUrl ? (
                          <img
                            src={farmer.farmerProfile.profilePictureUrl}
                            alt=""
                            onError={(e) => {
                              (e.currentTarget as HTMLElement).style.display = 'none';
                            }}
                            className="w-8 h-8 rounded-none object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-none bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs">
                            {farmer.fullName.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <div>
                          <span className="font-bold text-slate-900 block">{farmer.fullName}</span>
                          <span className="text-[10px] text-slate-400">
                            Registered {new Date(farmer.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-slate-800 block">{farmer.mobile}</span>
                      <span className="text-slate-400 text-[11px]">{farmer.email}</span>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-slate-800 block">{farmer.village}</span>
                      <span className="text-slate-400 text-[11px]">
                        {farmer.district}, {farmer.state}
                      </span>
                    </td>

                    <td className="px-6 py-4 font-bold text-slate-700">
                      {farmer.farmerProfile?.landAreaTotal ?? 0} Acres
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-none text-xs font-bold ${
                          farmer.isActive
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {farmer.isActive ? 'Active' : 'Deactivated'}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => handleToggleStatus(farmer.id, farmer.isActive)}
                        className={`px-3 py-1.5 rounded-none text-xs font-bold transition-all ${
                          farmer.isActive
                            ? 'border border-rose-200 text-rose-600 hover:bg-rose-50'
                            : 'border border-emerald-200 text-emerald-600 hover:bg-emerald-50'
                        }`}
                      >
                        {farmer.isActive ? 'Deactivate' : 'Activate'}
                      </button>
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
