import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import { GovernmentCropPriceDTO, MarketPriceDTO } from '@smart-farmer/shared';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  BadgePercent,
  Calculator,
  Search,
  TrendingUp,
  Info,
  Calendar,
  Building,
} from 'lucide-react';

export const PricesPage: React.FC = () => {
  const { t } = useLanguage();
  const [mspPrices, setMspPrices] = useState<GovernmentCropPriceDTO[]>([]);
  const [marketPrices, setMarketPrices] = useState<MarketPriceDTO[]>([]);
  const [marketSource, setMarketSource] = useState('data.gov.in');
  const [marketMessage, setMarketMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'msp' | 'market'>('msp');
  const [searchQuery, setSearchQuery] = useState('');
  const [seasonFilter, setSeasonFilter] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Calculator State
  const [calcCropName, setCalcCropName] = useState('Wheat');
  const [calcQuantity, setCalcQuantity] = useState(50); // Quintals

  const loadPrices = async () => {
    try {
      const [mspRes, marketRes] = await Promise.all([
        api.prices.getGovernmentPrices({
          cropName: searchQuery || undefined,
          season: seasonFilter || undefined,
        }),
        api.prices.getMarketPrices(),
      ]);

      if (mspRes.data.success) {
        setMspPrices(mspRes.data.prices);
        if (mspRes.data.prices.length > 0 && !calcCropName) {
          setCalcCropName(mspRes.data.prices[0].cropName);
        }
      }

      if (marketRes.data.success) {
        setMarketPrices(marketRes.data.records);
        setMarketSource(marketRes.data.source);
        if (marketRes.data.message) {
          setMarketMessage(marketRes.data.message);
        }
      }
    } catch (err) {
      console.error('Failed to load prices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPrices();
  }, [seasonFilter]);

  // Selected crop's MSP for calculator
  const selectedMsp = mspPrices.find((p) => p.cropName === calcCropName) || mspPrices[0];
  const calculatedValue = selectedMsp ? calcQuantity * selectedMsp.price : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {t('prices.pageTitle')}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {t('prices.pageSubtitle')}
        </p>
      </div>

      {/* Interactive Crop Value Calculator Card */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 rounded-none p-6 sm:p-8 text-white shadow-xl shadow-emerald-900/10">
        <div className="flex items-center gap-2 mb-2">
          <Calculator className="w-5 h-5 text-emerald-300" />
          <h3 className="text-lg font-bold">{t('prices.calculatorTitle')}</h3>
        </div>
        <p className="text-xs text-emerald-100 mb-6 max-w-xl">
          {t('prices.calculatorDesc')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-200 mb-1.5">
              {t('prices.selectCrop')}
            </label>
            <select
              value={calcCropName}
              onChange={(e) => setCalcCropName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-none bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white"
            >
              {mspPrices.map((p) => (
                <option key={p.id} value={p.cropName} className="text-slate-900">
                  {p.cropName} (₹{p.price}/{p.unit})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-200 mb-1.5">
              {t('prices.consignmentQuantity')}
            </label>
            <input
              type="number"
              min="1"
              value={calcQuantity}
              onChange={(e) => setCalcQuantity(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 rounded-none bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white"
            />
          </div>

          <div className="p-4 rounded-none bg-white/10 border border-white/15 text-center">
            <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider block">
              {t('prices.estimatedTotalReturn')}
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white mt-0.5 block">
              ₹{calculatedValue.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-emerald-300 block mt-1">
              {t('prices.calcFormula')}
            </span>
          </div>
        </div>

        <p className="mt-4 text-[11px] text-emerald-200 italic flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 flex-shrink-0" />
          "{t('prices.calcDisclaimer')}"
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('msp')}
          className={`px-4 py-2 rounded-none text-xs font-bold transition-all ${
            activeTab === 'msp'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {t('prices.tabGovMsp')} ({mspPrices.length})
        </button>

        <button
          onClick={() => setActiveTab('market')}
          className={`px-4 py-2 rounded-none text-xs font-bold transition-all ${
            activeTab === 'market'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          {t('prices.tabMandiArrivals')} ({marketPrices.length})
        </button>
      </div>

      {/* Tab 1: MSP Prices */}
      {activeTab === 'msp' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="flex-1 relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder={t('prices.searchCropName')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadPrices()}
                className="w-full pl-10 pr-4 py-2.5 rounded-none border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={seasonFilter}
              onChange={(e) => setSeasonFilter(e.target.value)}
              className="px-3 py-2.5 rounded-none border border-slate-200 text-xs text-slate-700 bg-white"
            >
              <option value="">{t('prices.allSeasons')}</option>
              <option value="Kharif">{t('prices.seasonKharif')}</option>
              <option value="Rabi">{t('prices.seasonRabi')}</option>
              <option value="Zaid">Zaid</option>
            </select>
          </div>

          <div className="bg-white rounded-none border border-slate-100 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5">{t('prices.colCropName')}</th>
                    <th className="px-6 py-3.5">{t('prices.colSeason')}</th>
                    <th className="px-6 py-3.5">{t('prices.colMarketingYear')}</th>
                    <th className="px-6 py-3.5">{t('prices.colMspPrice')}</th>
                    <th className="px-6 py-3.5">{t('prices.colEffectiveDate')}</th>
                    <th className="px-6 py-3.5">{t('prices.colApprovedSource')}</th>
                    <th className="px-6 py-3.5">{t('prices.colStatus')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {mspPrices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                        {t('prices.noMspFound')}
                      </td>
                    </tr>
                  ) : (
                    mspPrices.map((price) => (
                      <tr key={price.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{price.cropName}</td>
                        <td className="px-6 py-4 text-slate-600">{price.season}</td>
                        <td className="px-6 py-4 text-slate-600">{price.marketingYear}</td>
                        <td className="px-6 py-4 font-extrabold text-emerald-700 text-sm">
                          ₹{price.price.toLocaleString('en-IN')}{' '}
                          <span className="text-[10px] font-normal text-slate-400">
                            / {price.unit}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-slate-500">
                          {new Date(price.effectiveFrom).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-slate-500 max-w-xs truncate" title={price.source}>
                          {price.source}
                        </td>
                        <td className="px-6 py-4">
                          <Badge status={price.status} />
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Mandi Market Prices */}
      {activeTab === 'market' && (
        <div className="space-y-4">
          <div className="bg-white rounded-none border border-slate-100 shadow-card overflow-hidden">
            {marketPrices.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm font-semibold text-slate-600">
                  {marketMessage || t('prices.noMarketData')}
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  {t('prices.marketFeedNote')}
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3.5">{t('prices.colCommodity')}</th>
                      <th className="px-6 py-3.5">{t('prices.colMarketMandi')}</th>
                      <th className="px-6 py-3.5">{t('prices.colDistrictState')}</th>
                      <th className="px-6 py-3.5">{t('prices.modalPrice')}</th>
                      <th className="px-6 py-3.5">{t('prices.colArrivalDate')}</th>
                      <th className="px-6 py-3.5">{t('prices.colApprovedSource')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {marketPrices.map((mp, i) => (
                      <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-6 py-4 font-bold text-slate-900">{mp.cropName}</td>
                        <td className="px-6 py-4 text-slate-700">{mp.market}</td>
                        <td className="px-6 py-4 text-slate-500">
                          {mp.district}, {mp.state}
                        </td>
                        <td className="px-6 py-4 font-extrabold text-slate-900">
                          ₹{mp.price.toLocaleString('en-IN')} / {mp.unit}
                        </td>
                        <td className="px-6 py-4 text-slate-500">{mp.arrivalDate}</td>
                        <td className="px-6 py-4 text-slate-400 text-[11px]">{mp.source}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
