import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import { FarmerCropDTO, CropDTO } from '@smart-farmer/shared';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { EmptyState } from '../../components/common/EmptyState';
import { useNotifications } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { Plus, Edit2, Trash2, Wheat, Calendar, Scale, Layers } from 'lucide-react';

export const CropsManagementPage: React.FC = () => {
  const { showToast } = useNotifications();
  const { t } = useLanguage();

  const [farmerCrops, setFarmerCrops] = useState<FarmerCropDTO[]>([]);
  const [masterCrops, setMasterCrops] = useState<CropDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCrop, setEditingCrop] = useState<FarmerCropDTO | null>(null);

  const [formData, setFormData] = useState({
    cropId: '',
    variety: '',
    landArea: 2.5,
    sowingDate: new Date().toISOString().slice(0, 10),
    expectedHarvestDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000)
      .toISOString()
      .slice(0, 10),
    expectedProduction: 50,
    unit: 'Quintal',
    status: 'GROWING',
  });

  const loadData = async () => {
    try {
      const [cropsRes, masterRes] = await Promise.all([
        api.crops.getFarmerCrops(),
        api.crops.getAll(),
      ]);

      if (cropsRes.data.success) setFarmerCrops(cropsRes.data.crops);
      if (masterRes.data.success) {
        setMasterCrops(masterRes.data.crops);
        if (masterRes.data.crops.length > 0 && !formData.cropId) {
          setFormData((prev) => ({ ...prev, cropId: masterRes.data.crops[0].id }));
        }
      }
    } catch (err) {
      console.error('Failed to load crops data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.crops.addFarmerCrop(formData);
      setIsAddModalOpen(false);
      loadData();
      showToast(t('crops.cropAddedSuccess'), '', 'success');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to add crop');
    }
  };

  const handleUpdateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCrop) return;

    try {
      await api.crops.updateFarmerCrop(editingCrop.id, {
        variety: formData.variety,
        landArea: formData.landArea,
        sowingDate: formData.sowingDate,
        expectedHarvestDate: formData.expectedHarvestDate,
        expectedProduction: formData.expectedProduction,
        unit: formData.unit,
        status: formData.status as any,
      });
      setEditingCrop(null);
      loadData();
      showToast(t('crops.cropUpdatedSuccess'), '', 'success');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to update crop');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm(t('crops.confirmDelete'))) return;
    try {
      await api.crops.deleteFarmerCrop(id);
      loadData();
      showToast(t('crops.cropDeletedInfo'), '', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  const openEditModal = (c: FarmerCropDTO) => {
    setEditingCrop(c);
    setFormData({
      cropId: c.cropId,
      variety: c.variety,
      landArea: c.landArea,
      sowingDate: new Date(c.sowingDate).toISOString().slice(0, 10),
      expectedHarvestDate: new Date(c.expectedHarvestDate).toISOString().slice(0, 10),
      expectedProduction: c.expectedProduction,
      unit: c.unit,
      status: c.status,
    });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {t('crops.managementTitle')}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            {t('crops.managementSubtitle')}
          </p>
        </div>
        <button
          onClick={() => {
            setFormData({
              cropId: masterCrops[0]?.id || '',
              variety: '',
              landArea: 2.5,
              sowingDate: new Date().toISOString().slice(0, 10),
              expectedHarvestDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000)
                .toISOString()
                .slice(0, 10),
              expectedProduction: 50,
              unit: 'Quintal',
              status: 'GROWING',
            });
            setIsAddModalOpen(true);
          }}
          className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> {t('crops.addNewCrop')}
        </button>
      </div>

      {/* Crops Table / Cards */}
      {farmerCrops.length === 0 ? (
        <EmptyState
          title={t('crops.noCropsTitle')}
          description={t('crops.noCropsDescFull')}
          icon={Wheat}
          actionLabel={t('crops.addFirstCropBtn')}
          onAction={() => setIsAddModalOpen(true)}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {farmerCrops.map((c) => (
            <div
              key={c.id}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-card hover:shadow-soft transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-lg">
                      🌾
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-slate-900">{c.crop?.name}</h3>
                      <p className="text-xs text-slate-500 font-medium">{c.variety}</p>
                    </div>
                  </div>
                  <Badge status={c.status} />
                </div>

                <div className="space-y-2.5 my-4 pt-2 border-t border-slate-50 text-xs text-slate-600">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Layers className="w-3.5 h-3.5" /> {t('crops.landCultivated')}
                    </span>
                    <span className="font-bold text-slate-800">{c.landArea} {t('crops.acres')}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Scale className="w-3.5 h-3.5" /> {t('crops.expectedYield')}
                    </span>
                    <span className="font-bold text-slate-800">
                      {c.expectedProduction} {c.unit}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Calendar className="w-3.5 h-3.5" /> {t('crops.sowingDate')}
                    </span>
                    <span className="text-slate-700">
                      {new Date(c.sowingDate).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Calendar className="w-3.5 h-3.5 text-amber-500" /> {t('crops.expectedHarvest')}
                    </span>
                    <span className="text-slate-700 font-medium">
                      {new Date(c.expectedHarvestDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => openEditModal(c)}
                  className="p-2 rounded-xl text-slate-600 hover:bg-slate-100 transition-colors"
                  title={t('crops.editCrop')}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(c.id)}
                  className="p-2 rounded-xl text-rose-600 hover:bg-rose-50 transition-colors"
                  title={t('crops.deleteCrop')}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Crop Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title={t('crops.addCropModalTitle')}
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('crops.selectCropType')}
            </label>
            <select
              value={formData.cropId}
              onChange={(e) => setFormData({ ...formData, cropId: e.target.value })}
              required
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              {masterCrops.map((mc) => (
                <option key={mc.id} value={mc.id}>
                  {mc.name} ({mc.category})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('crops.varietySeed')}
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Sharbati HD-2967"
                value={formData.variety}
                onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('crops.landAreaAcres')}
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={formData.landArea}
                onChange={(e) =>
                  setFormData({ ...formData, landArea: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('crops.sowingDate')} *
              </label>
              <input
                type="date"
                required
                value={formData.sowingDate}
                onChange={(e) => setFormData({ ...formData, sowingDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('crops.expectedHarvest')} *
              </label>
              <input
                type="date"
                required
                value={formData.expectedHarvestDate}
                onChange={(e) =>
                  setFormData({ ...formData, expectedHarvestDate: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('crops.expectedYield')} *
              </label>
              <input
                type="number"
                step="1"
                min="1"
                required
                value={formData.expectedProduction}
                onChange={(e) =>
                  setFormData({ ...formData, expectedProduction: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('crops.unit')}
              </label>
              <select
                value={formData.unit}
                onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="Quintal">Quintal</option>
                <option value="Kg">Kg</option>
                <option value="Ton">Ton</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(false)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {t('crops.cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
            >
              {t('crops.saveCropRecord')}
            </button>
          </div>
        </form>
      </Modal>

      {/* Edit Crop Modal */}
      <Modal
        isOpen={Boolean(editingCrop)}
        onClose={() => setEditingCrop(null)}
        title={`${t('crops.editCropModalTitle')}: ${editingCrop?.crop?.name || ''}`}
      >
        <form onSubmit={handleUpdateSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('crops.varietySeed')}
              </label>
              <input
                type="text"
                required
                value={formData.variety}
                onChange={(e) => setFormData({ ...formData, variety: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('crops.landAreaAcres')}
              </label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                required
                value={formData.landArea}
                onChange={(e) =>
                  setFormData({ ...formData, landArea: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('crops.expectedYield')} *
              </label>
              <input
                type="number"
                step="1"
                min="1"
                required
                value={formData.expectedProduction}
                onChange={(e) =>
                  setFormData({ ...formData, expectedProduction: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('crops.growthStatus')}
              </label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
              >
                <option value="PLANNED">PLANNED</option>
                <option value="SOWN">SOWN</option>
                <option value="GROWING">GROWING</option>
                <option value="HARVEST_READY">HARVEST READY</option>
                <option value="HARVESTED">HARVESTED</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setEditingCrop(null)}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50"
            >
              {t('crops.cancel')}
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 active:scale-95 transition-all"
            >
              {t('crops.updateCropBtn')}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
