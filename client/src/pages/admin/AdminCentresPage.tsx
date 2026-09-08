import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import { ProcurementCentreDTO, CropDTO, UserDTO } from '@smart-farmer/shared';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useNotifications } from '../../contexts/NotificationContext';
import { Building2, Plus, MapPin, Scale, Users, Check } from 'lucide-react';

export const AdminCentresPage: React.FC = () => {
  const { showToast } = useNotifications();

  const [centres, setCentres] = useState<ProcurementCentreDTO[]>([]);
  const [masterCrops, setMasterCrops] = useState<CropDTO[]>([]);
  const [managers, setManagers] = useState<UserDTO[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    address: '',
    state: 'Haryana',
    district: 'Karnal',
    village: '',
    latitude: 29.6857,
    longitude: 76.9905,
    contactNumber: '0184-2256789',
    openingHours: '08:00 AM - 05:00 PM',
    totalCapacity: 5000,
    processingRate: 50,
    status: 'OPEN',
    supportedCropIds: [] as string[],
    managerUserId: '',
  });

  const loadData = async () => {
    try {
      const [centresRes, cropsRes, managersRes] = await Promise.all([
        api.centres.getAll(),
        api.crops.getAll(),
        api.admin.getManagers(),
      ]);

      if (centresRes.data.success) setCentres(centresRes.data.centres);
      if (cropsRes.data.success) {
        setMasterCrops(cropsRes.data.crops);
        setFormData((prev) => ({
          ...prev,
          supportedCropIds: cropsRes.data.crops.slice(0, 3).map((c) => c.id),
        }));
      }
      if (managersRes.data.success) setManagers(managersRes.data.managers);
    } catch (err) {
      console.error('Failed to load centres data:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.centres.create(formData);
      setIsAddModalOpen(false);
      loadData();
      showToast('Centre Created', 'New procurement centre registered in network.', 'success');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to create centre');
    }
  };

  const toggleCropSelection = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      supportedCropIds: prev.supportedCropIds.includes(id)
        ? prev.supportedCropIds.filter((cId) => cId !== id)
        : [...prev.supportedCropIds, id],
    }));
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Procurement Centres & Silo Infrastructure
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Register APMC purchase depots, configure storage capacity, and assign centre managers
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Add Procurement Centre
        </button>
      </div>

      {/* Centres Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {centres.map((c) => (
          <div
            key={c.id}
            className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card hover:shadow-soft transition-all flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="text-base font-bold text-slate-900">{c.name}</h3>
                <Badge status={c.status} />
              </div>

              <p className="text-xs text-slate-500 flex items-center gap-1.5 mb-4">
                <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                {c.village}, {c.district}, {c.state}
              </p>

              <div className="space-y-2 py-3 border-t border-slate-50 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Total Capacity</span>
                  <span className="font-bold text-slate-800">{c.totalCapacity} Quintals</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Current Intake</span>
                  <span className="font-bold text-emerald-700">{c.currentUsage} Quintals</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Intake Speed</span>
                  <span className="font-bold text-slate-800">~{c.processingRate} Qtl/hr</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">GPS Coordinates</span>
                  <span className="text-slate-600 font-mono text-[11px]">
                    {c.latitude.toFixed(3)}, {c.longitude.toFixed(3)}
                  </span>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
              <span>Tel: {c.contactNumber}</span>
              <span>Hours: {c.openingHours}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Add Centre Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Register New Procurement Centre"
        maxWidth="max-w-2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Centre / APMC Mandi Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Panipat Central Grain Depot"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                State *
              </label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                District *
              </label>
              <input
                type="text"
                required
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Village / Sub-Division *
              </label>
              <input
                type="text"
                required
                value={formData.village}
                onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Full Physical Address *
            </label>
            <input
              type="text"
              required
              placeholder="Mandi Complex, National Highway..."
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Latitude *
              </label>
              <input
                type="number"
                step="0.0001"
                required
                value={formData.latitude}
                onChange={(e) =>
                  setFormData({ ...formData, latitude: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Longitude *
              </label>
              <input
                type="number"
                step="0.0001"
                required
                value={formData.longitude}
                onChange={(e) =>
                  setFormData({ ...formData, longitude: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Total Capacity (Qtl) *
              </label>
              <input
                type="number"
                min="100"
                required
                value={formData.totalCapacity}
                onChange={(e) =>
                  setFormData({ ...formData, totalCapacity: parseFloat(e.target.value) || 100 })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Intake Rate (Qtl/h) *
              </label>
              <input
                type="number"
                min="1"
                required
                value={formData.processingRate}
                onChange={(e) =>
                  setFormData({ ...formData, processingRate: parseFloat(e.target.value) || 1 })
                }
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-2">
              Supported Crops
            </label>
            <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 border border-slate-200 rounded-xl">
              {masterCrops.map((c) => {
                const isSelected = formData.supportedCropIds.includes(c.id);
                return (
                  <button
                    type="button"
                    key={c.id}
                    onClick={() => toggleCropSelection(c.id)}
                    className={`px-3 py-1 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1.5 ${
                      isSelected
                        ? 'bg-emerald-50 border-emerald-300 text-emerald-800'
                        : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3 text-emerald-600" />}
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
            >
              Save Procurement Centre
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
