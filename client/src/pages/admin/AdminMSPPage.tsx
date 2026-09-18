import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import { GovernmentCropPriceDTO, CropDTO } from '@smart-farmer/shared';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useNotifications } from '../../contexts/NotificationContext';
import { BadgePercent, Plus, Edit2, Ban, Search } from 'lucide-react';

export const AdminMSPPage: React.FC = () => {
  const { showToast } = useNotifications();

  const [prices, setPrices] = useState<GovernmentCropPriceDTO[]>([]);
  const [masterCrops, setMasterCrops] = useState<CropDTO[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    cropId: '',
    cropName: '',
    season: 'Kharif',
    marketingYear: '2026-27',
    price: 2400,
    unit: 'Quintal',
    effectiveFrom: new Date().toISOString().slice(0, 10),
    source: 'Commission for Agricultural Costs and Prices (CACP), Ministry of Agriculture',
    status: 'ACTIVE',
  });

  const loadPrices = async () => {
    try {
      const [pricesRes, cropsRes] = await Promise.all([
        api.prices.getGovernmentPrices({ cropName: search || undefined }),
        api.crops.getAll(),
      ]);

      if (pricesRes.data.success) setPrices(pricesRes.data.prices);
      if (cropsRes.data.success) {
        setMasterCrops(cropsRes.data.crops);
        if (cropsRes.data.crops.length > 0 && !formData.cropName) {
          setFormData((prev) => ({
            ...prev,
            cropId: cropsRes.data.crops[0].id,
            cropName: cropsRes.data.crops[0].name,
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load MSP prices:', err);
    }
  };

  useEffect(() => {
    loadPrices();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    try {
      await api.prices.createGovernmentPrice(formData);
      setIsAddModalOpen(false);
      loadPrices();
      showToast('MSP Published', `Rate for ${formData.cropName} (${formData.marketingYear}) is live.`, 'success');
    } catch (err: any) {
      setErrorMsg(err.response?.data?.message || 'Failed to publish MSP price');
    }
  };

  const handleDeactivate = async (id: string) => {
    if (!window.confirm('Deactivate this MSP price record?')) return;
    try {
      await api.prices.deleteGovernmentPrice(id);
      loadPrices();
      showToast('MSP Deactivated', 'Price record marked inactive.', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Government MSP Price Master
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Configure approved Minimum Support Prices per Marketing Season with automated audit trail
          </p>
        </div>

        <button
          onClick={() => {
            setErrorMsg(null);
            setIsAddModalOpen(true);
          }}
          className="px-5 py-2.5 rounded-none bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Publish New MSP
        </button>
      </div>

      {/* Search Bar */}
      <div className="bg-white rounded-none p-4 border border-slate-100 shadow-card flex items-center gap-3">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
          <input
            type="text"
            placeholder="Search crop name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && loadPrices()}
            className="w-full pl-10 pr-4 py-2.5 rounded-none border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
        <button
          onClick={loadPrices}
          className="px-4 py-2.5 rounded-none bg-slate-900 text-white text-xs font-bold"
        >
          Filter
        </button>
      </div>

      {/* Prices Table */}
      <div className="bg-white rounded-none border border-slate-100 shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Commodity</th>
                <th className="px-6 py-3.5">Season</th>
                <th className="px-6 py-3.5">Marketing Year</th>
                <th className="px-6 py-3.5">Approved MSP Rate</th>
                <th className="px-6 py-3.5">Effective Date</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {prices.map((p) => (
                <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{p.cropName}</td>
                  <td className="px-6 py-4 text-slate-700">{p.season}</td>
                  <td className="px-6 py-4 text-slate-700">{p.marketingYear}</td>
                  <td className="px-6 py-4 font-extrabold text-emerald-700 text-sm">
                    ₹{p.price.toLocaleString('en-IN')} / {p.unit}
                  </td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(p.effectiveFrom).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <Badge status={p.status} />
                  </td>
                  <td className="px-6 py-4 text-right">
                    {p.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleDeactivate(p.id)}
                        className="px-3 py-1.5 rounded-none border border-rose-200 text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors"
                      >
                        Deactivate
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add MSP Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Publish Official Government MSP Price"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-none bg-rose-50 border border-rose-200 text-xs text-rose-800">
              {errorMsg}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Select Crop *
            </label>
            <select
              value={formData.cropName}
              onChange={(e) => {
                const selected = masterCrops.find((c) => c.name === e.target.value);
                setFormData({
                  ...formData,
                  cropName: e.target.value,
                  cropId: selected?.id || '',
                });
              }}
              required
              className="w-full px-3.5 py-2.5 rounded-none border border-slate-200 text-sm bg-white"
            >
              {masterCrops.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Season *
              </label>
              <select
                value={formData.season}
                onChange={(e) => setFormData({ ...formData, season: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-none border border-slate-200 text-sm bg-white"
              >
                <option value="Kharif">Kharif</option>
                <option value="Rabi">Rabi</option>
                <option value="Zaid">Zaid</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Marketing Year *
              </label>
              <input
                type="text"
                required
                placeholder="2026-27"
                value={formData.marketingYear}
                onChange={(e) => setFormData({ ...formData, marketingYear: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-none border border-slate-200 text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                MSP Price (INR) *
              </label>
              <input
                type="number"
                min="100"
                required
                value={formData.price}
                onChange={(e) =>
                  setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2.5 rounded-none border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Unit
              </label>
              <input
                type="text"
                disabled
                value="Quintal"
                className="w-full px-3.5 py-2.5 rounded-none border border-slate-200 text-sm bg-slate-50 text-slate-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Effective Date *
            </label>
            <input
              type="date"
              required
              value={formData.effectiveFrom}
              onChange={(e) => setFormData({ ...formData, effectiveFrom: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-none border border-slate-200 text-sm"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2.5 rounded-none border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-none bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
            >
              Publish MSP
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
