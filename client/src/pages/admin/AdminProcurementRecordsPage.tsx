import React, { useEffect, useState, useMemo } from 'react';
import { api } from '../../api';
import { ProcurementCentreDTO, CropDTO } from '@smart-farmer/shared';
import { StatCard } from '../../components/common/StatCard';
import { Badge } from '../../components/common/Badge';
import { EmptyState } from '../../components/common/EmptyState';
import { useNotifications } from '../../contexts/NotificationContext';
import {
  Building2,
  Calendar,
  Download,
  Printer,
  RefreshCw,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  IndianRupee,
  Scale,
  Wheat,
  FileText,
  ChevronDown,
  Check,
  Landmark,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export const AdminProcurementRecordsPage: React.FC = () => {
  const { showToast } = useNotifications();

  // Filter States
  const [centres, setCentres] = useState<ProcurementCentreDTO[]>([]);
  const [crops, setCrops] = useState<CropDTO[]>([]);
  const [selectedCentreId, setSelectedCentreId] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [selectedCropId, setSelectedCropId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Data States
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [centreDetails, setCentreDetails] = useState<any>(null);
  const [summary, setSummary] = useState<{
    totalQuantity: number;
    totalGrossAmount: number;
    totalDeductions: number;
    totalNetAmount: number;
    totalVehicles: number;
    cropBreakdown: Array<{ cropId: string; cropName: string; quantity: number; amount: number; count: number }>;
    statusBreakdown: { paid: number; processing: number; pending: number; failed: number };
  }>({
    totalQuantity: 0,
    totalGrossAmount: 0,
    totalDeductions: 0,
    totalNetAmount: 0,
    totalVehicles: 0,
    cropBreakdown: [],
    statusBreakdown: { paid: 0, processing: 0, pending: 0, failed: 0 },
  });
  const [records, setRecords] = useState<any[]>([]);

  // 1. Fetch initial dropdown data (Centres & Crops)
  useEffect(() => {
    Promise.all([api.centres.getAll(), api.crops.getAll()])
      .then(([centresRes, cropsRes]) => {
        if (centresRes.data.success) {
          setCentres(centresRes.data.centres);
        }
        if (cropsRes.data.success) {
          setCrops(cropsRes.data.crops);
        }
      })
      .catch((err) => console.error('Failed to load filter options:', err));
  }, []);

  // 2. Fetch Daily Procurement Records
  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const res = await api.admin.getDailyProcurementRecords({
        centreId: selectedCentreId === 'ALL' ? undefined : selectedCentreId,
        date: selectedDate,
        cropId: selectedCropId === 'ALL' ? undefined : selectedCropId,
        status: selectedStatus === 'ALL' ? undefined : selectedStatus,
      });

      if (res.data.success) {
        setCentreDetails(res.data.centre);
        setSummary(res.data.summary);
        setRecords(res.data.records);
      }
    } catch (err: any) {
      console.error('Failed to fetch procurement records:', err);
      showToast('Error', 'Failed to load procurement records for the selected filters', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [selectedCentreId, selectedDate, selectedCropId, selectedStatus]);

  // Client-side search filtering on farmer name, mobile, token, or UTR
  const filteredRecords = useMemo(() => {
    if (!searchQuery.trim()) return records;
    const q = searchQuery.toLowerCase();
    return records.filter(
      (r) =>
        r.farmer?.fullName?.toLowerCase().includes(q) ||
        r.farmer?.mobile?.includes(q) ||
        r.queueToken?.tokenNumber?.toLowerCase().includes(q) ||
        r.utrNumber?.toLowerCase().includes(q) ||
        r.crop?.name?.toLowerCase().includes(q) ||
        r.paymentNumber?.toLowerCase().includes(q)
    );
  }, [records, searchQuery]);

  // Quick Date Shortcut Handlers
  const setQuickDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  // CSV Export
  const handleExportCSV = () => {
    if (filteredRecords.length === 0) {
      showToast('No Records', 'No procurement records to export for this selection.', 'warning');
      return;
    }

    const headers = [
      'Date',
      'Mandi Centre',
      'District',
      'Token No',
      'Farmer Name',
      'Farmer Mobile',
      'Village',
      'Crop',
      'Quantity (Qtl)',
      'Rate (Rs/Qtl)',
      'Gross Amount (Rs)',
      'Deductions (Rs)',
      'Net Amount (Rs)',
      'Quality Grade',
      'Payment Status',
      'Bank UTR Number',
      'Account Masked',
      'Timestamp',
    ];

    const rows = filteredRecords.map((r) => [
      selectedDate,
      `"${r.centre?.name || ''}"`,
      `"${r.centre?.district || ''}"`,
      `"${r.queueToken?.tokenNumber || ''}"`,
      `"${r.farmer?.fullName || ''}"`,
      `"${r.farmer?.mobile || ''}"`,
      `"${r.farmer?.village || ''}"`,
      `"${r.crop?.name || ''}"`,
      r.quantity,
      r.ratePerUnit,
      r.grossAmount,
      r.deductions,
      r.netAmount,
      `"${r.qualityGrade || 'Grade A'}"`,
      `"${r.status}"`,
      `"${r.utrNumber || 'N/A'}"`,
      `"${r.accountNumberMasked || 'N/A'}"`,
      `"${new Date(r.createdAt).toLocaleTimeString('en-IN')}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Procurement_Report_${selectedCentreId === 'ALL' ? 'Statewide' : 'Centre'}_${selectedDate}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported', 'Procurement ledger CSV downloaded successfully!', 'success');
  };

  return (
    <div className="space-y-6 animate-fade-in print:p-0 print:space-y-3">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-none bg-purple-100 text-purple-700">
              <FileText className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Daily Mandi Procurement Records
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                दैनिक खरीद बहीखाता • Real-time weighbridge arrivals, FAQ grades, and DBT payment ledger
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={fetchRecords}
            disabled={isLoading}
            className="px-3 py-2 rounded-none border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="px-3 py-2 rounded-none border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Sheet</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 rounded-none bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-emerald-600/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV / Excel</span>
          </button>
        </div>
      </div>

      {/* Control / Filter Bar */}
      <div className="bg-white rounded-none p-4 sm:p-5 border border-slate-200/80 shadow-card space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* 1. Centre Selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Select Procurement Centre
            </label>
            <div className="relative">
              <select
                value={selectedCentreId}
                onChange={(e) => setSelectedCentreId(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 rounded-none border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition appearance-none cursor-pointer"
              >
                <option value="ALL">All Centres (Statewide Total)</option>
                {centres.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.district}, {c.state})
                  </option>
                ))}
              </select>
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* 2. Date Picker */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                Procurement Date
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setQuickDate(0)}
                  className={`text-[10px] px-1.5 py-0.5 rounded-none font-bold transition ${
                    selectedDate === new Date().toISOString().split('T')[0]
                      ? 'bg-purple-600 text-white'
                      : 'text-purple-600 hover:bg-purple-50'
                  }`}
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setQuickDate(-1)}
                  className="text-[10px] px-1.5 py-0.5 rounded-none font-bold text-slate-500 hover:bg-slate-100 transition"
                >
                  Yesterday
                </button>
              </div>
            </div>
            <div className="relative">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2.5 rounded-none border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition cursor-pointer"
              />
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* 3. Crop Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Crop Filter
            </label>
            <div className="relative">
              <select
                value={selectedCropId}
                onChange={(e) => setSelectedCropId(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 rounded-none border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition appearance-none cursor-pointer"
              >
                <option value="ALL">All Commodities</option>
                {crops.map((cr) => (
                  <option key={cr.id} value={cr.id}>
                    {cr.name} ({cr.category})
                  </option>
                ))}
              </select>
              <Wheat className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>

          {/* 4. Payment Status Filter */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase tracking-wider mb-1.5">
              Payment Settlement
            </label>
            <div className="relative">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full pl-9 pr-8 py-2.5 rounded-none border border-slate-200 bg-slate-50/50 text-xs font-semibold text-slate-800 outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition appearance-none cursor-pointer"
              >
                <option value="ALL">All Settlements</option>
                <option value="PAID">Settled (DBT Paid)</option>
                <option value="PROCESSING">⏳ Processing in Bank</option>
                <option value="PENDING">Pending Approval</option>
              </select>
              <Landmark className="w-4 h-4 text-slate-400 absolute left-3 top-3 pointer-events-none" />
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-3 top-3 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Search Input Bar */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by farmer name, mobile, token number, or UTR..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-none border border-slate-200 bg-slate-50 text-xs outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
            />
          </div>

          <div className="text-xs text-slate-500 font-medium">
            Showing <strong className="text-slate-800">{filteredRecords.length}</strong> records for{' '}
            <strong className="text-purple-700">
              {selectedCentreId === 'ALL'
                ? 'Statewide Network'
                : centreDetails?.name || 'Selected Centre'}
            </strong>
          </div>
        </div>
      </div>

      {/* Daily KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <StatCard
          title="Daily Grain Procured"
          value={`${summary.totalQuantity.toLocaleString('en-IN')} Qtl`}
          subtitle={`${(summary.totalQuantity / 10).toFixed(1)} Tonnes weighed`}
          icon={Wheat}
          iconColor="text-emerald-600"
          bgColor="bg-emerald-50"
        />

        <StatCard
          title="Total Net DBT Payout"
          value={`₹${summary.totalNetAmount.toLocaleString('en-IN')}`}
          subtitle={`Gross: ₹${summary.totalGrossAmount.toLocaleString('en-IN')}`}
          icon={IndianRupee}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
        />

        <StatCard
          title="Trolleys / Deliveries"
          value={summary.totalVehicles}
          subtitle={`${summary.statusBreakdown.paid} settled via DBT`}
          icon={Scale}
          iconColor="text-amber-600"
          bgColor="bg-amber-50"
        />

        <StatCard
          title={selectedCentreId === 'ALL' ? 'Statewide Fill' : 'Centre Storage'}
          value={
            centreDetails
              ? `${Math.round((centreDetails.currentUsage / (centreDetails.totalCapacity || 1)) * 100)}%`
              : `${summary.statusBreakdown.paid} Paid`
          }
          subtitle={
            centreDetails
              ? `${centreDetails.currentUsage} / ${centreDetails.totalCapacity} Qtl cap`
              : 'Direct Benefit Transfers'
          }
          icon={Building2}
          iconColor="text-purple-600"
          bgColor="bg-purple-50"
        />
      </div>

      {/* Crop Breakdown Bar */}
      {summary.cropBreakdown.length > 0 && (
        <div className="bg-white rounded-none p-4 border border-slate-200/80 shadow-sm flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Crop-Wise Distribution:</span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {summary.cropBreakdown.map((cb) => (
              <span
                key={cb.cropId}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-none bg-slate-100 text-slate-800 text-xs font-bold"
              >
                <Wheat className="w-3.5 h-3.5 text-emerald-600" />
                <span>{cb.cropName}:</span>
                <strong className="text-purple-700">{cb.quantity.toLocaleString('en-IN')} Qtl</strong>
                <span className="text-slate-500 font-normal">(₹{cb.amount.toLocaleString('en-IN')})</span>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Daily Procurement Register Table */}
      <div className="bg-white rounded-none border border-slate-200/80 shadow-card overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-emerald-600" />
              Procurement Register Ledger (बहीखाता)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Permanent digital record of farmer delivery, weighbridge certification, and PFMS banking UTR
            </p>
          </div>

          <span className="text-xs font-bold px-3 py-1 rounded-none bg-slate-100 text-slate-700">
            Date: {selectedDate}
          </span>
        </div>

        {isLoading ? (
          <div className="py-16 text-center text-slate-500 flex flex-col items-center justify-center gap-2">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
            <p className="text-sm font-semibold">Loading daily procurement records...</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="py-16 text-center">
            <EmptyState
              title="No Procurement Records Found"
              description={`There are no grain procurement transactions recorded for ${
                selectedCentreId === 'ALL' ? 'any centre' : centreDetails?.name || 'this centre'
              } on ${selectedDate}. Try selecting another date or centre.`}
              icon={Scale}
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold uppercase tracking-wider border-b border-slate-200/70">
                <tr>
                  <th className="py-3 px-4">Token / ID</th>
                  <th className="py-3 px-4">Farmer Details</th>
                  {selectedCentreId === 'ALL' && <th className="py-3 px-4">Centre</th>}
                  <th className="py-3 px-4">Commodity</th>
                  <th className="py-3 px-4 text-right">Net Qty</th>
                  <th className="py-3 px-4 text-right">MSP Rate</th>
                  <th className="py-3 px-4 text-right">Net Payout</th>
                  <th className="py-3 px-4">Quality & Grade</th>
                  <th className="py-3 px-4">DBT Status & UTR</th>
                  <th className="py-3 px-4">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {filteredRecords.map((record) => (
                  <tr key={record.id} className="hover:bg-slate-50/80 transition">
                    {/* Token Number */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-bold text-slate-900">
                        {record.queueToken?.tokenNumber || record.paymentNumber}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {record.queueToken?.bayNumber ? `Bay: ${record.queueToken.bayNumber}` : record.paymentNumber}
                      </div>
                    </td>

                    {/* Farmer Details */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{record.farmer?.fullName || 'Farmer'}</div>
                      <div className="text-[11px] text-slate-500">
                        +91 {record.farmer?.mobile}
                        {record.farmer?.village ? ` • ${record.farmer.village}` : ''}
                      </div>
                    </td>

                    {/* Centre (if All selected) */}
                    {selectedCentreId === 'ALL' && (
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-800">{record.centre?.name}</div>
                        <div className="text-[10px] text-slate-400">{record.centre?.district}</div>
                      </td>
                    )}

                    {/* Crop */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1.5 font-bold text-slate-800">
                        <Wheat className="w-3.5 h-3.5 text-emerald-600" />
                        {record.crop?.name}
                      </span>
                    </td>

                    {/* Net Qty */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-bold text-slate-900">
                      {record.quantity} <span className="text-slate-500 font-normal">{record.unit || 'Qtl'}</span>
                    </td>

                    {/* Rate */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap font-semibold text-slate-700">
                      ₹{record.ratePerUnit?.toLocaleString('en-IN')}
                    </td>

                    {/* Net Amount */}
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      <div className="font-extrabold text-emerald-700 text-sm">
                        ₹{record.netAmount?.toLocaleString('en-IN')}
                      </div>
                      {record.deductions > 0 && (
                        <div className="text-[10px] text-red-500 font-normal">
                          -₹{record.deductions} cuts
                        </div>
                      )}
                    </td>

                    {/* Quality & Grade */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[10px] bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                        <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        {record.qualityGrade || 'Grade A (FAQ)'}
                      </span>
                    </td>

                    {/* DBT Status & UTR */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {record.status === 'PAID' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[10px] bg-emerald-100 text-emerald-800 font-bold">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Settled
                          </span>
                        ) : record.status === 'PROCESSING' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[10px] bg-amber-100 text-amber-800 font-bold">
                            <Clock className="w-3 h-3 text-amber-600" /> Bank Transit
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[10px] bg-slate-100 text-slate-700 font-bold">
                            Pending
                          </span>
                        )}
                      </div>
                      {record.utrNumber && (
                        <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                          UTR: {record.utrNumber}
                        </div>
                      )}
                    </td>

                    {/* Time */}
                    <td className="py-3.5 px-4 whitespace-nowrap text-slate-500 font-mono text-[11px]">
                      {new Date(record.createdAt).toLocaleTimeString('en-IN', {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: true,
                      })}
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
