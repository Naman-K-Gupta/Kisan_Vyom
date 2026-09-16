import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { useDynamicTranslation } from '../../hooks/useDynamicTranslation';
import { api } from '../../api';
import { GovernmentSchemeDTO } from '@smart-farmer/shared';
import { SchemeCard } from '../../components/farmer/SchemeCard';
import { SchemeDetailsModal } from '../../components/farmer/SchemeDetailsModal';
import { Landmark, Layers, Search, X, Globe } from 'lucide-react';

/**
 * FarmerSchemesPage - Central & State Government Agricultural Policies Portal.
 * Orchestrates real-time policy updates over WebSockets, eligibility verification,
 * and automatic multilingual localization.
 */
export const FarmerSchemesPage: React.FC = () => {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { showToast } = useNotifications();
  const { t, language } = useLanguage();

  const [schemes, setSchemes] = useState<GovernmentSchemeDTO[]>([]);
  const [selectedScheme, setSelectedScheme] = useState<GovernmentSchemeDTO | null>(null);
  const [schemeCategoryFilter, setSchemeCategoryFilter] = useState<string>('ALL');
  const [schemeSearch, setSchemeSearch] = useState<string>('');
  const [lastSchemeUpdate, setLastSchemeUpdate] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Fetch verified schemes on mount
  const fetchSchemes = async () => {
    try {
      const res = await api.schemes.getAll();
      if (res.data.success && res.data.schemes) {
        setSchemes(res.data.schemes);
      }
    } catch (err) {
      console.error('Failed to load government schemes:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemes();
  }, []);

  // Real-time synchronization over Socket.IO (0ms latency, zero page refresh)
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
          showToast(t('schemes.liveSync', 'Policy Published'), payload.scheme.title, 'info');
          return [payload.scheme, ...prev.filter((s) => s.id !== payload.scheme!.id)];
        }
        if (payload.action === 'UPDATED' && payload.scheme) {
          showToast(t('schemes.liveSync', 'Policy Updated'), payload.scheme.title, 'info');
          return prev.map((s) => (s.id === payload.scheme!.id ? payload.scheme! : s));
        }
        if (payload.action === 'DELETED' && payload.schemeId) {
          showToast(t('schemes.liveSync', 'Policy Archived'), 'Archived', 'warning');
          return prev.filter((s) => s.id !== payload.schemeId);
        }
        return prev;
      });
    };

    socket.on('scheme:policyUpdated', handlePolicyUpdated);

    return () => {
      socket.off('scheme:policyUpdated', handlePolicyUpdated);
    };
  }, [socket, showToast, t]);

  // Aggregate dynamic text fields across visible schemes and selected modal for translation
  const translatableTexts = useMemo(() => {
    const list: string[] = [];
    schemes.forEach((s) => {
      if (s.title) list.push(s.title);
      if (s.ministry) list.push(s.ministry);
      if (s.benefitAmount) list.push(s.benefitAmount);
      if (s.summary) list.push(s.summary);
    });
    if (selectedScheme) {
      if (selectedScheme.details) list.push(selectedScheme.details);
      if (selectedScheme.eligibilityCriteria) list.push(selectedScheme.eligibilityCriteria);
    }
    return list;
  }, [schemes, selectedScheme]);

  // Reusable custom hook handles batching, in-memory caching, and language updates
  const { tr, isTranslating } = useDynamicTranslation(translatableTexts);

  const farmerTotalLand = user?.farmerProfile?.landAreaTotal || 0;

  /**
   * Automated Eligibility Evaluation based on Farmer's Registered Khasra Land Records and State
   */
  const checkEligibility = (scheme: GovernmentSchemeDTO) => {
    const farmerState = user?.state?.trim().toLowerCase() || '';

    // Check state eligibility
    let stateMatches = true;
    if (scheme.applicableStates) {
      const statesList: string[] = Array.isArray(scheme.applicableStates)
        ? scheme.applicableStates
        : (scheme.applicableStates as string).split(',').map((s) => s.trim());
      const isAllIndia = statesList.some(
        (s) => s.toLowerCase() === 'all' || s.toLowerCase() === 'all india'
      );
      if (!isAllIndia && farmerState) {
        stateMatches = statesList.some(
          (s) => s.toLowerCase() === farmerState || farmerState.includes(s.toLowerCase())
        );
      }
    }

    // Check landholding acreage limit
    let landMatches = true;
    if (scheme.maxLandAcreage && scheme.maxLandAcreage > 0 && farmerTotalLand > 0) {
      landMatches = farmerTotalLand <= scheme.maxLandAcreage;
    }

    if (!stateMatches) {
      const stateDisplay = Array.isArray(scheme.applicableStates)
        ? scheme.applicableStates.join(', ')
        : scheme.applicableStates === 'ALL'
        ? t('schemes.allIndia', 'Pan-India (All States & UTs)')
        : scheme.applicableStates;
      return {
        eligible: false,
        badgeText: t('schemes.stateSpecific', 'State Specific'),
        color: 'text-slate-600 bg-slate-100 border-slate-200',
        reason: `${t('schemes.applicableIn', 'Applicable in:')} ${stateDisplay}`,
      };
    }

    if (scheme.maxLandAcreage && scheme.maxLandAcreage > 0 && !landMatches) {
      return {
        eligible: false,
        badgeText: `${t('schemes.exceedsLand', 'Exceeds Land Limit')} (${scheme.maxLandAcreage} Ac)`,
        color: 'text-amber-700 bg-amber-50 border-amber-200',
        reason: `${scheme.maxLandAcreage} acres max (${farmerTotalLand.toFixed(1)} acres registered)`,
      };
    }

    if (scheme.maxLandAcreage && scheme.maxLandAcreage > 0 && landMatches) {
      return {
        eligible: true,
        badgeText: `${t('schemes.eligibleFarmSize', 'Eligible • Farm Size ≤')} ${scheme.maxLandAcreage} Ac`,
        color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
        reason: `${farmerTotalLand.toFixed(1)} acres in ${user?.state || 'your region'}`,
      };
    }

    return {
      eligible: true,
      badgeText: t('schemes.universalEligibility', 'Universal Eligibility'),
      color: 'text-blue-700 bg-blue-50 border-blue-200',
      reason: t('schemes.openToAll', 'Open to all registered agricultural landholders and cultivators'),
    };
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
        return { label: t('schemes.statusOpen', 'APPLICATION OPEN'), isClosing: false, isNew: false };
      case 'CLOSING_SOON':
        return { label: t('schemes.statusClosing', 'CLOSING SOON'), isClosing: true, isNew: false };
      case 'NEW_AMENDMENT':
        return { label: t('schemes.statusNew', 'NEW AMENDMENT'), isClosing: false, isNew: true };
      case 'CLOSED':
        return { label: t('schemes.statusClosed', 'CLOSED'), isClosing: false, isNew: false };
      default:
        return { label: status, isClosing: false, isNew: false };
    }
  };

  const schemeCategories = [
    { id: 'ALL', label: t('schemes.all', '🌾 All Schemes') },
    { id: 'FINANCE', label: t('schemes.finance', '💰 Direct Income & Credit') },
    { id: 'SOLAR_PUMP', label: t('schemes.solarPump', '☀️ Solar Pumps') },
    { id: 'INSURANCE', label: t('schemes.insurance', '🛡️ Crop Insurance') },
    { id: 'MACHINERY', label: t('schemes.machinery', '🚜 Mechanization') },
    { id: 'IRRIGATION', label: t('schemes.irrigation', '💧 Irrigation') },
    { id: 'SUBSIDY', label: t('schemes.subsidy', '🎁 Grants & Subsidies') },
  ];

  const filteredSchemes = schemes.filter((s) => {
    const matchesCat = schemeCategoryFilter === 'ALL' || s.category === schemeCategoryFilter;
    const query = schemeSearch.trim().toLowerCase();
    if (!query) return matchesCat;

    const translatedTitle = tr(s.title).toLowerCase();
    const translatedSummary = tr(s.summary).toLowerCase();
    const matchesSearch =
      s.title.toLowerCase().includes(query) ||
      translatedTitle.includes(query) ||
      s.ministry.toLowerCase().includes(query) ||
      s.benefitAmount.toLowerCase().includes(query) ||
      s.summary.toLowerCase().includes(query) ||
      translatedSummary.includes(query);

    return matchesCat && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Top Page Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white p-6 sm:p-8 shadow-xl shadow-emerald-955/10 relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 w-48 h-48 rounded-full bg-white/5 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 backdrop-blur text-emerald-200">
                <Landmark className="w-3.5 h-3.5" /> {t('schemes.centralStateBadge', 'Central & State Agricultural Welfare')}
              </span>
              {/* Live Pulsing Sync Indicator */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/30 text-emerald-100 border border-emerald-400/40 text-xs font-bold shadow-xs">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-300 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
                </span>
                <span>
                  🟢 {t('schemes.liveSync', 'Live Ministry Sync')} • {lastSchemeUpdate ? `${lastSchemeUpdate}` : t('schemes.verifiedToday', 'Verified Today')}
                </span>
              </div>
              {isTranslating && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/20 text-emerald-200 animate-pulse border border-emerald-400/30">
                  <Globe className="w-3 h-3" /> {t('schemes.translating', 'Translating...')}
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              {t('schemes.title', 'Government Policies & Opportunities')}
            </h1>
            <p className="text-xs sm:text-sm text-emerald-100 leading-relaxed">
              {t('schemes.subtitle', 'Explore verified central and state subsidies, direct benefit cash transfers (DBT), solar pump grants, and crop insurance schemes with automated land eligibility matching.')}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md px-5 py-4 rounded-2xl border border-white/15 text-white flex flex-col items-start sm:items-end justify-center self-start md:self-auto flex-shrink-0">
            <span className="text-[10px] uppercase font-bold text-emerald-200">{t('schemes.verifiedActive', 'Verified Schemes Active')}</span>
            <span className="text-2xl font-black text-white mt-0.5">{schemes.length}</span>
            <span className="text-[11px] text-emerald-100/80">{t('schemes.realtimeSocket', 'Real-time socket connection')}</span>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card space-y-6">
        {/* Search & Category Filter Toolbar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          {/* Search Box */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={schemeSearch}
              onChange={(e) => setSchemeSearch(e.target.value)}
              placeholder={t('schemes.searchPlaceholder', 'Search scheme name, ministry, or benefit...')}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
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

          <div className="text-xs font-bold text-slate-500">
            {t('schemes.showingCount', 'Showing')} <strong className="text-slate-900">{filteredSchemes.length}</strong> {t('schemes.ofSchemes', 'of')} {schemes.length} {t('schemes.schemesLabel', 'Schemes')}
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {schemeCategories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setSchemeCategoryFilter(cat.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                schemeCategoryFilter === cat.id
                  ? 'bg-emerald-700 text-white shadow-md shadow-emerald-700/20'
                  : 'bg-slate-100/80 text-slate-600 hover:bg-slate-200/70'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Policies Grid */}
        {isLoading ? (
          <div className="py-16 text-center text-xs text-slate-400">{t('schemes.loading', 'Loading government schemes...')}</div>
        ) : filteredSchemes.length === 0 ? (
          <div className="py-16 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Layers className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-slate-700">{t('schemes.noSchemes', 'No schemes found')}</p>
            <p className="text-xs text-slate-400 mt-1">{t('schemes.noSchemesDesc', 'Try another search keyword or select All Schemes.')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredSchemes.map((scheme) => (
              <SchemeCard
                key={scheme.id}
                scheme={scheme}
                eligibility={checkEligibility(scheme)}
                statusInfo={formatStatus(scheme.status)}
                categoryLabel={formatCategoryName(scheme.category)}
                translatedTitle={tr(scheme.title)}
                translatedMinistry={tr(scheme.ministry)}
                translatedBenefit={tr(scheme.benefitAmount)}
                translatedSummary={tr(scheme.summary)}
                onSelect={(s) => setSelectedScheme(s)}
                t={t}
              />
            ))}
          </div>
        )}
      </div>

      {/* Official Guidelines & Circular Modal */}
      {selectedScheme && (
        <SchemeDetailsModal
          scheme={selectedScheme}
          onClose={() => setSelectedScheme(null)}
          categoryLabel={formatCategoryName(selectedScheme.category)}
          statusLabel={formatStatus(selectedScheme.status).label}
          translatedTitle={tr(selectedScheme.title)}
          translatedMinistry={tr(selectedScheme.ministry)}
          translatedBenefit={tr(selectedScheme.benefitAmount)}
          translatedSummary={tr(selectedScheme.summary)}
          translatedEligibility={tr(selectedScheme.eligibilityCriteria)}
          translatedDetails={tr(selectedScheme.details)}
          t={t}
          language={language}
        />
      )}
    </div>
  );
};
