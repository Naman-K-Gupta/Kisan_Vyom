import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import { AlertDTO, CropDTO } from '@smart-farmer/shared';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { useNotifications } from '../../contexts/NotificationContext';
import { AlertTriangle, Plus, Trash2, Calendar, MapPin } from 'lucide-react';

export const AdminAlertsPage: React.FC = () => {
  const { showToast } = useNotifications();

  const [alerts, setAlerts] = useState<AlertDTO[]>([]);
  const [masterCrops, setMasterCrops] = useState<CropDTO[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    message: '',
    priority: 'HIGH',
    cropId: '',
    location: '',
    expiryTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
  });

  const loadData = async () => {
    try {
      const [alertsRes, cropsRes] = await Promise.all([api.alerts.getAll(), api.crops.getAll()]);
      if (alertsRes.data.success) setAlerts(alertsRes.data.alerts);
      if (cropsRes.data.success) setMasterCrops(cropsRes.data.crops);
    } catch (err) {
      console.error('Failed to load alerts:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.alerts.create({
        ...formData,
        cropId: formData.cropId || null,
        location: formData.location || null,
      });
      setIsAddModalOpen(false);
      loadData();
      showToast('Alert Broadcasted', 'Urgent alert published to farmer dashboards.', 'AGRICULTURAL_ALERT');
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to publish alert');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this broadcast alert?')) return;
    try {
      await api.alerts.delete(id);
      loadData();
      showToast('Alert Removed', 'Broadcast ended.', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Agricultural & Weather Alert Broadcaster
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Publish high-priority pest warnings, weather advisories, and procurement notifications
          </p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-5 py-2.5 rounded-none bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all flex items-center gap-2"
        >
          <Plus className="w-4 h-4" /> Broadcast Urgent Alert
        </button>
      </div>

      {/* Alerts Grid */}
      <div className="space-y-4">
        {alerts.length === 0 ? (
          <div className="bg-white rounded-none p-12 border border-slate-100 text-center text-slate-400 text-xs">
            No active broadcast alerts.
          </div>
        ) : (
          alerts.map((alert) => (
            <div
              key={alert.id}
              className="bg-white rounded-none p-6 border border-slate-100 shadow-card flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <Badge status={alert.priority} />
                  <h3 className="text-sm font-bold text-slate-900">{alert.title}</h3>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{alert.message}</p>

                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-400 pt-1">
                  {alert.location && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-slate-400" /> Location: {alert.location}
                    </span>
                  )}
                  {alert.crop && (
                    <span className="font-semibold text-emerald-700">
                      Crop: {alert.crop.name}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3 text-slate-400" /> Expires:{' '}
                    {new Date(alert.expiryTime).toLocaleDateString()}
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleDelete(alert.id)}
                className="p-2 rounded-none text-rose-600 hover:bg-rose-50 transition-colors self-end sm:self-center"
                title="Remove Broadcast"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))
        )}
      </div>

      {/* Add Alert Modal */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Broadcast Agricultural / Weather Alert"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Alert Headline *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Yellow Rust Warning in North Haryana"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-none border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
              Detailed Advisory Message *
            </label>
            <textarea
              rows={3}
              required
              placeholder="Provide symptoms, precautions, or procurement advice..."
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-none border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Priority Level
              </label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-none border border-slate-200 text-sm bg-white"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High (Urgent)</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Relevant Crop (Optional)
              </label>
              <select
                value={formData.cropId}
                onChange={(e) => setFormData({ ...formData, cropId: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-none border border-slate-200 text-sm bg-white"
              >
                <option value="">All Crops</option>
                {masterCrops.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Location Filter (Optional)
              </label>
              <input
                type="text"
                placeholder="State or District"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-none border border-slate-200 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                Expiry Date *
              </label>
              <input
                type="date"
                required
                value={formData.expiryTime}
                onChange={(e) => setFormData({ ...formData, expiryTime: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-none border border-slate-200 text-sm"
              />
            </div>
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
              className="px-5 py-2.5 rounded-none bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-md shadow-amber-500/20 active:scale-95 transition-all"
            >
              Broadcast Alert
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
