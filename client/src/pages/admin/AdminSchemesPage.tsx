import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import {
  GovernmentSchemeDTO,
  CreateGovernmentSchemeDTO,
} from '@smart-farmer/shared';
import { useSocket } from '../../contexts/SocketContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  Landmark,
  Plus,
  Layers,
  Search,
  Filter,
  X,
} from 'lucide-react';
import { AdminSchemeCard } from '../../components/admin/AdminSchemeCard';
import { SchemeFormModal } from '../../components/admin/SchemeFormModal';

export const AdminSchemesPage: React.FC = () => {
  const { socket } = useSocket();
  const { showToast } = useNotifications();
  const { t } = useLanguage();

  const [schemes, setSchemes] = useState<GovernmentSchemeDTO[]>([]);
  const [isSchemesLoading, setIsSchemesLoading] = useState(true);
  const [lastSchemeUpdate, setLastSchemeUpdate] = useState<string | null>(null);

  // Scheme Modal & Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<GovernmentSchemeDTO | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [schemeSearch, setSchemeSearch] = useState('');
  const [schemeCategoryFilter, setSchemeCategoryFilter] = useState('ALL');

  const defaultForm: CreateGovernmentSchemeDTO = {
    title: '',
    category: 'SUBSIDY',
    ministry: 'Ministry of Agriculture & Farmers Welfare',
    benefitAmount: '',
    summary: '',
    details: '',
    eligibilityCriteria: '',
    maxLandAcreage: null,
    applicableStates: 'ALL',
    applicationUrl: '',
    officialCircularUrl: '',
    deadlineDate: null,
    status: 'ACTIVE',
    isFeatured: true,
  };

  const [form, setForm] = useState<CreateGovernmentSchemeDTO>(defaultForm);

  const fetchSchemes = async () => {
    try {
      const res = await api.schemes.getAll();
      if (res.data.success && res.data.schemes) {
        setSchemes(res.data.schemes);
      }
    } catch (err) {
      console.error('Failed to fetch schemes in AdminSchemesPage:', err);
    } finally {
      setIsSchemesLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, []);

  // Live Socket.IO synchronization for real-time scheme updates
  useEffect(() => {
    if (!socket) return;

    const handlePolicyUpdated = (payload: {
      action: 'CREATED' | 'UPDATED' | 'DELETED';
      scheme?: GovernmentSchemeDTO;
      schemeId?: string;
      timestamp?: string;
    }) => {
      const updateTime = new Date().toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
      setLastSchemeUpdate(updateTime);

      setSchemes((prev) => {
        if (payload.action === 'CREATED' && payload.scheme) {
          showToast('Live Policy Published', `Broadcasting: ${payload.scheme.title}`, 'info');
          return [payload.scheme, ...prev.filter((s) => s.id !== payload.scheme!.id)];
        }
        if (payload.action === 'UPDATED' && payload.scheme) {
          showToast('Live Policy Updated', `Updated statewide: ${payload.scheme.title}`, 'info');
          return prev.map((s) => (s.id === payload.scheme!.id ? payload.scheme! : s));
        }
        if (payload.action === 'DELETED' && payload.schemeId) {
          showToast('Policy Archived', 'Scheme removed and archived from active portals.', 'warning');
          return prev.filter((s) => s.id !== payload.schemeId);
        }
        return prev;
      });
    };

    socket.on('scheme:policyUpdated', handlePolicyUpdated);

    return () => {
      socket.off('scheme:policyUpdated', handlePolicyUpdated);
    };
  }, [socket, showToast]);

  const openCreateModal = () => {
    setEditingScheme(null);
    setForm(defaultForm);
    setIsModalOpen(true);
  };

  const openEditModal = (scheme: GovernmentSchemeDTO) => {
    setEditingScheme(scheme);
    setForm({
      title: scheme.title,
      category: scheme.category,
      ministry: scheme.ministry,
      benefitAmount: scheme.benefitAmount,
      summary: scheme.summary,
      details: scheme.details || '',
      eligibilityCriteria: scheme.eligibilityCriteria,
      maxLandAcreage: scheme.maxLandAcreage ?? null,
      applicableStates: Array.isArray(scheme.applicableStates)
        ? scheme.applicableStates.join(', ')
        : scheme.applicableStates,
      applicationUrl: scheme.applicationUrl,
      officialCircularUrl: scheme.officialCircularUrl || '',
      deadlineDate: scheme.deadlineDate ? scheme.deadlineDate.slice(0, 10) : '',
      status: scheme.status,
      isFeatured: scheme.isFeatured,
    });
    setIsModalOpen(true);
  };

  const handleDeleteScheme = async (id: string, title: string) => {
    if (
      !window.confirm(
        `Are you sure you want to remove policy "${title}"? This will broadcast the change immediately statewide without a page refresh.`
      )
    ) {
      return;
    }
    try {
      await api.schemes.delete(id);
      showToast('Policy Removed', `Successfully deleted policy "${title}".`, 'success');
    } catch (err: any) {
      showToast('Delete Failed', err.response?.data?.message || 'Failed to delete policy', 'error');
    }
  };

  const handleSaveScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.title.trim() ||
      !form.benefitAmount.trim() ||
      !form.summary.trim() ||
      !form.applicationUrl.trim()
    ) {
      showToast('Missing Fields', 'Please fill in all mandatory fields.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: CreateGovernmentSchemeDTO = {
        ...form,
        maxLandAcreage: form.maxLandAcreage ? Number(form.maxLandAcreage) : null,
        deadlineDate: form.deadlineDate ? new Date(form.deadlineDate).toISOString() : null,
      };

      if (editingScheme) {
        await api.schemes.update(editingScheme.id, payload);
        showToast('Policy Updated', `Broadcasting live changes for "${form.title}"`, 'success');
      } else {
        await api.schemes.create(payload);
        showToast('Policy Published', `New policy "${form.title}" published statewide.`, 'success');
      }
      setIsModalOpen(false);
    } catch (err: any) {
      showToast('Save Error', err.response?.data?.message || 'Failed to save policy.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatCategoryName = (cat: string) => {
    switch (cat) {
      case 'SOLAR_PUMP':
        return t('schemes.catSolarPump', 'Solar Pump');
      case 'FINANCE':
        return t('schemes.catFinance', 'Finance & DBT');
      case 'INSURANCE':
        return t('schemes.catInsurance', 'Crop Insurance');
      case 'MACHINERY':
        return t('schemes.catMachinery', 'Mechanization');
      case 'IRRIGATION':
        return t('schemes.catIrrigation', 'Irrigation & Water');
      case 'SUBSIDY':
        return t('schemes.catSubsidy', 'Subsidy & Grants');
      default:
        return cat;
    }
  };

  const formatStatus = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return { label: t('schemes.statusOpen', 'APPLICATION OPEN'), style: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'CLOSING_SOON':
        return { label: t('schemes.statusClosing', 'CLOSING SOON'), style: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' };
      case 'NEW_AMENDMENT':
        return { label: t('schemes.statusNew', 'NEW AMENDMENT'), style: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'CLOSED':
        return { label: t('schemes.statusClosed', 'CLOSED'), style: 'bg-slate-100 text-slate-600 border-slate-200' };
      default:
        return { label: status, style: 'bg-slate-100 text-slate-600 border-slate-200' };
    }
  };

  const activeCount = schemes.filter((s) => s.status === 'ACTIVE').length;
  const closingSoonCount = schemes.filter((s) => s.status === 'CLOSING_SOON').length;
  const amendmentCount = schemes.filter((s) => s.status === 'NEW_AMENDMENT').length;

  const schemeCategories = [
    { id: 'ALL', label: t('schemes.all', 'All Categories') },
    { id: 'FINANCE', label: t('schemes.finance', 'Finance & DBT') },
    { id: 'SOLAR_PUMP', label: t('schemes.solarPump', 'Solar Pumps') },
    { id: 'INSURANCE', label: t('schemes.insurance', 'Crop Insurance') },
    { id: 'MACHINERY', label: t('schemes.machinery', 'Mechanization') },
    { id: 'IRRIGATION', label: t('schemes.irrigation', 'Irrigation & Water') },
    { id: 'SUBSIDY', label: t('schemes.subsidy', 'Subsidy & Grants') },
  ];

  const filteredSchemes = schemes.filter((s) => {
    const matchesCategory = schemeCategoryFilter === 'ALL' || s.category === schemeCategoryFilter;
    const matchesSearch =
      !schemeSearch.trim() ||
      s.title.toLowerCase().includes(schemeSearch.toLowerCase()) ||
      s.ministry.toLowerCase().includes(schemeSearch.toLowerCase()) ||
      s.benefitAmount.toLowerCase().includes(schemeSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              {t('schemes.adminTitle', 'Government Policies & Schemes Management')} <Landmark className="w-6 h-6 text-purple-600" />
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {t('schemes.adminSubtitle', 'Publish agricultural welfare policies, update subsidy rates, adjust application deadlines, and broadcast statewide updates in real time.')}
          </p>
        </div>

        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-none bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-extrabold shadow-md active:scale-95 transition-all self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>{t('schemes.addNewPolicy', 'Publish New Policy')}</span>
        </button>
      </div>

      {/* Main Console Box */}
      <div className="bg-white rounded-none p-6 sm:p-8 border border-slate-100 shadow-card space-y-6">
        {/* Live Pulsing Sync Indicator Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-slate-100">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-700">Central & State Policy Feed</span>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-none bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-xs">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-none bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-none h-2 w-2 bg-emerald-600"></span>
              </span>
              <span>
                Live Ministry Sync • {lastSchemeUpdate ? `Updated ${lastSchemeUpdate}` : 'Verified Today'}
              </span>
            </div>
          </div>

          <div className="text-xs font-semibold text-slate-400">
            Real-time push enabled for all logged-in farmers
          </div>
        </div>

        {/* Quick Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-4 rounded-none bg-slate-50 border border-slate-100">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Policies
            </span>
            <p className="text-xl font-black text-slate-900 mt-1">{schemes.length}</p>
            <span className="text-[10px] text-slate-500 mt-0.5 block">Configured statewide</span>
          </div>

          <div className="p-4 rounded-none bg-emerald-50/70 border border-emerald-100">
            <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
              Application Open
            </span>
            <p className="text-xl font-black text-emerald-950 mt-1">{activeCount}</p>
            <span className="text-[10px] text-emerald-700 mt-0.5 block">Accepting farmer applications</span>
          </div>

          <div className="p-4 rounded-none bg-rose-50/70 border border-rose-100">
            <span className="text-[10px] font-bold text-rose-800 uppercase tracking-wider block">
              Closing Soon
            </span>
            <p className="text-xl font-black text-rose-900 mt-1">{closingSoonCount}</p>
            <span className="text-[10px] text-rose-700 mt-0.5 block">Urgent action needed</span>
          </div>

          <div className="p-4 rounded-none bg-purple-50/70 border border-purple-100">
            <span className="text-[10px] font-bold text-purple-800 uppercase tracking-wider block">
              New Amendments
            </span>
            <p className="text-xl font-black text-purple-900 mt-1">{amendmentCount}</p>
            <span className="text-[10px] text-purple-700 mt-0.5 block">Recent subsidy revisions</span>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={schemeSearch}
              onChange={(e) => setSchemeSearch(e.target.value)}
              placeholder="Search by scheme title, ministry, or benefit..."
              className="w-full pl-10 pr-4 py-2.5 rounded-none border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
            {schemeSearch && (
              <button
                type="button"
                onClick={() => setSchemeSearch('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Category Dropdown */}
          <div className="flex items-center gap-2 overflow-x-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <select
              value={schemeCategoryFilter}
              onChange={(e) => setSchemeCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-none border border-slate-200 text-xs font-bold text-slate-700 bg-white focus:ring-2 focus:ring-emerald-500"
            >
              {schemeCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Policies Listing */}
        {isSchemesLoading ? (
          <div className="py-12 text-center text-xs text-slate-400">Loading government schemes...</div>
        ) : filteredSchemes.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 rounded-none border border-dashed border-slate-200">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">No matching policies found</p>
            <p className="text-xs text-slate-400 mt-1">Adjust search or clear filter to view active schemes.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredSchemes.map((scheme) => (
              <AdminSchemeCard
                key={scheme.id}
                scheme={scheme}
                onEdit={openEditModal}
                onDelete={handleDeleteScheme}
                formatCategoryName={formatCategoryName}
                formatStatus={formatStatus}
              />
            ))}
          </div>
        )}
      </div>

      {/* Publish / Edit Scheme Modal */}
      <SchemeFormModal
        isOpen={isModalOpen}
        editingScheme={editingScheme}
        form={form}
        isSubmitting={isSubmitting}
        onClose={() => setIsModalOpen(false)}
        onChange={setForm}
        onSubmit={handleSaveScheme}
      />
    </div>
  );
};
