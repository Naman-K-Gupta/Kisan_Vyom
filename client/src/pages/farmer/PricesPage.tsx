import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import { GovernmentCropPriceDTO, MarketPriceDTO } from '@smart-farmer/shared';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
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
          Government MSP & Mandi Market Rates
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Compare verified Commission for Agricultural Costs and Prices (CACP) benchmarks with APMC arrivals
        </p>
      </div>

      {/* Interactive Crop Value Calculator Card */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-800 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-900/10">
        <div className="flex items-center gap-2 mb-2">
          <Calculator className="w-5 h-5 text-emerald-300" />
          <h3 className="text-lg font-bold">Estimated Crop Value Calculator</h3>
        </div>
        <p className="text-xs text-emerald-100 mb-6 max-w-xl">
          Estimate your gross return based on current Government MSP support prices before bringing your harvest to the centre.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-emerald-200 mb-1.5">
              Select Crop
            </label>
            <select
              value={calcCropName}
              onChange={(e) => setCalcCropName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white"
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
              Consignment Quantity (Quintals)
            </label>
            <input
              type="number"
              min="1"
              value={calcQuantity}
              onChange={(e) => setCalcQuantity(parseFloat(e.target.value) || 0)}
              className="w-full px-3.5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-sm focus:outline-none focus:ring-2 focus:ring-white"
            />
          </div>

          <div className="p-4 rounded-2xl bg-white/10 border border-white/15 text-center">
            <span className="text-[11px] font-bold text-emerald-200 uppercase tracking-wider block">
              Estimated Total Return
            </span>
            <span className="text-2xl sm:text-3xl font-black text-white mt-0.5 block">
              ₹{calculatedValue.toLocaleString('en-IN')}
            </span>
            <span className="text-[10px] text-emerald-300 block mt-1">
              Quantity × Government Price
            </span>
          </div>
        </div>

        <p className="mt-4 text-[11px] text-emerald-200 italic flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 flex-shrink-0" />
          "Estimated value — actual procurement value may vary based on moisture analysis, dockage, and quality grade."
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('msp')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'msp'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          Official Government MSP Prices ({mspPrices.length})
        </button>

        <button
          onClick={() => setActiveTab('market')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'market'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          APMC Mandi Market Arrivals ({marketPrices.length})
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
                placeholder="Search crop name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && loadPrices()}
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <select
              value={seasonFilter}
              onChange={(e) => setSeasonFilter(e.target.value)}
              className="px-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-700 bg-white"
            >
              <option value="">All Seasons</option>
              <option value="Kharif">Kharif</option>
              <option value="Rabi">Rabi</option>
              <option value="Zaid">Zaid</option>
            </select>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                  <tr>
                    <th className="px-6 py-3.5">Crop Name</th>
                    <th className="px-6 py-3.5">Season</th>
                    <th className="px-6 py-3.5">Marketing Year</th>
                    <th className="px-6 py-3.5">Official MSP Price</th>
                    <th className="px-6 py-3.5">Effective Date</th>
                    <th className="px-6 py-3.5">Approved Source</th>
                    <th className="px-6 py-3.5">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {mspPrices.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400">
                        No government MSP price records found.
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
          <div className="bg-white rounded-3xl border border-slate-100 shadow-card overflow-hidden">
            {marketPrices.length === 0 ? (
              <div className="p-8 text-center">
                <p className="text-sm font-semibold text-slate-600">
                  {marketMessage || 'Live market price data is currently unavailable.'}
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-md mx-auto">
                  Official APMC daily arrival prices from data.gov.in will populate automatically when
                  mandi feeds are published.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-3.5">Commodity</th>
                      <th className="px-6 py-3.5">Market / Mandi</th>
                      <th className="px-6 py-3.5">District & State</th>
                      <th className="px-6 py-3.5">Modal Price</th>
                      <th className="px-6 py-3.5">Arrival Date</th>
                      <th className="px-6 py-3.5">Source</th>
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
