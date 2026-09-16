import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import { PaymentDTO, PaymentSummaryDTO } from '@smart-farmer/shared';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  IndianRupee,
  Landmark,
  CheckCircle2,
  Clock,
  FileText,
  Printer,
  Search,
  ShieldCheck,
  Building2,
  Wheat,
  X,
  RefreshCw,
  Info,
  Calendar,
  CreditCard,
} from 'lucide-react';

export const FarmerPaymentsPage: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const [payments, setPayments] = useState<PaymentDTO[]>([]);
  const [summary, setSummary] = useState<PaymentSummaryDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentDTO | null>(null);

  const fetchPayments = async () => {
    try {
      setIsLoading(true);
      const res = await api.payments.getMyPayments();
      if (res.data.success) {
        setPayments(res.data.payments);
        setSummary(res.data.summary);
      }
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, []);

  const filteredPayments = payments.filter((p) => {
    const matchesStatus = statusFilter === 'ALL' || p.status === statusFilter;
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      !query ||
      p.paymentNumber.toLowerCase().includes(query) ||
      (p.cropName && p.cropName.toLowerCase().includes(query)) ||
      (p.centreName && p.centreName.toLowerCase().includes(query)) ||
      (p.utrNumber && p.utrNumber.toLowerCase().includes(query));
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner / Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-800 to-teal-900 p-6 rounded-2xl text-white shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-700/60 text-emerald-200 text-xs font-semibold mb-2">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{t('payments.aadhaarLinkedDbt')}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{t('payments.title')}</h1>
          <p className="text-emerald-100/90 text-sm mt-1 max-w-2xl">
            {t('payments.subtitle')}
          </p>
        </div>
        <button
          onClick={fetchPayments}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-xl text-xs font-semibold transition backdrop-blur-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{t('common.refresh')}</span>
        </button>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Disbursed */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('payments.clearedEarnings')}</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
              <IndianRupee className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              ₹{(summary?.totalDisbursed || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-emerald-600 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {t('payments.pfmsReady')}
            </p>
          </div>
        </div>

        {/* Card 2: Pending Disbursement */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('payments.inProcessing')}</span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              ₹{(summary?.pendingDisbursement || 0).toLocaleString('en-IN')}
            </div>
            <p className="text-xs text-amber-600 font-medium mt-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" /> {t('status.pending')}
            </p>
          </div>
        </div>

        {/* Card 3: Total Quantity Procured */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('payments.volumeSold')}</span>
            <div className="w-9 h-9 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Wheat className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {summary?.totalQuantitySold || 0} <span className="text-sm font-semibold text-slate-500">{t('common.quintal')}</span>
            </div>
            <p className="text-xs text-slate-500 font-medium mt-1">
              {t('centres.verifiedLocations')}
            </p>
          </div>
        </div>

        {/* Card 4: Mandi Transactions */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('payments.completedSales')}</span>
            <div className="w-9 h-9 rounded-xl bg-purple-50 flex items-center justify-center text-purple-600">
              <FileText className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {summary?.completedTransactionsCount || 0}{' '}
              <span className="text-sm font-semibold text-slate-500">{t('payments.formJTitle')}</span>
            </div>
            <p className="text-xs text-purple-600 font-medium mt-1">
              {t('status.completed')}
            </p>
          </div>
        </div>
      </div>

      {/* Linked DBT Bank Account Card */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-2xl p-6 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-lg">
                  {summary?.verifiedBankAccount?.bankName || 'State Bank of India'}
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" /> {t('payments.aadhaarLinkedDbt')}
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-1">
                {t('payments.accountHolder')}: <span className="text-slate-200 font-semibold">{user?.fullName || 'Registered Farmer'}</span> • {t('payments.ifscCode')}: <span className="text-slate-200 font-mono font-semibold">{summary?.verifiedBankAccount?.ifscCode || 'SBIN0001234'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto bg-slate-800/80 px-4 py-3 rounded-xl border border-slate-700/60">
            <CreditCard className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-semibold">{t('payments.accountNumber')}</p>
              <p className="text-sm font-mono font-bold tracking-widest text-slate-100">
                {summary?.verifiedBankAccount?.accountNumberMasked || `XXXXXX${user?.mobile ? user.mobile.slice(-4) : '4021'}`}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-800 flex items-center gap-2 text-xs text-slate-400">
          <Info className="w-4 h-4 text-emerald-400 flex-shrink-0" />
          <span>
            {t('payments.directCreditNotice')}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Status Pill Filters */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { label: t('common.all'), value: 'ALL' },
            { label: t('payments.paidBankSettled'), value: 'PAID' },
            { label: t('payments.processingBankQueue'), value: 'PROCESSING' },
            { label: t('payments.pendingVerification'), value: 'PENDING' },
          ].map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
                statusFilter === tab.value
                  ? 'bg-emerald-600 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder={t('payments.searchPlaceholder')}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Payments History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-bold text-slate-900 text-sm">{t('payments.title')}</h2>
          <span className="text-xs text-slate-500 font-medium">
            {filteredPayments.length} {t('common.details')}
          </span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mx-auto text-emerald-600 mb-3" />
            <p className="text-xs font-medium">{t('common.loading')}</p>
          </div>
        ) : filteredPayments.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <FileText className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold text-slate-700">{t('payments.noPaymentsFound')}</p>
            <p className="text-xs text-slate-400 mt-1">
              {t('payments.noPaymentsDesc')}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100">
                  <th className="py-3.5 px-5">{t('payments.tablePaymentId')}</th>
                  <th className="py-3.5 px-4">{t('payments.tableCropGrade')}</th>
                  <th className="py-3.5 px-4">{t('payments.tableCentre')}</th>
                  <th className="py-3.5 px-4">{t('payments.tableQuantity')}</th>
                  <th className="py-3.5 px-4">{t('prices.mspPerQuintal')}</th>
                  <th className="py-3.5 px-4">{t('payments.tableNetPayout')}</th>
                  <th className="py-3.5 px-4">{t('payments.tableStatus')}</th>
                  <th className="py-3.5 px-5 text-right">{t('payments.tableActions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-slate-50/60 transition-colors">
                    {/* Voucher & Date */}
                    <td className="py-4 px-5">
                      <div className="font-mono font-bold text-slate-900">{payment.paymentNumber}</div>
                      <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Calendar className="w-3 h-3" />
                        {new Date(payment.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </div>
                    </td>

                    {/* Crop */}
                    <td className="py-4 px-4">
                      <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                        <Wheat className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                        <span>{payment.cropName || 'Crop'}</span>
                      </div>
                      <span className="text-[10px] text-slate-400">{payment.qualityGrade || 'Grade A (FAQ)'}</span>
                    </td>

                    {/* Mandi Hub */}
                    <td className="py-4 px-4">
                      <div className="font-medium text-slate-700 flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <span className="truncate max-w-[160px]">{payment.centreName || 'APMC Centre'}</span>
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {[payment.centreDistrict, payment.centreState].filter(Boolean).join(', ')}
                      </div>
                    </td>

                    {/* Weight */}
                    <td className="py-4 px-4 font-semibold text-slate-800">
                      {payment.quantity} <span className="text-[10px] font-normal text-slate-500">{payment.unit}</span>
                    </td>

                    {/* Rate */}
                    <td className="py-4 px-4 font-mono text-slate-700">
                      ₹{payment.ratePerUnit.toLocaleString('en-IN')}/{payment.unit}
                    </td>

                    {/* Net Amount */}
                    <td className="py-4 px-4">
                      <div className="font-black text-slate-900 text-sm">
                        ₹{payment.netAmount.toLocaleString('en-IN')}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {payment.deductions > 0 ? `-₹${payment.deductions}` : 'Zero Deductions'}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-4">
                      <Badge status={payment.status} />
                      {payment.utrNumber && (
                        <div className="text-[10px] font-mono text-slate-400 mt-1">
                          UTR: {payment.utrNumber}
                        </div>
                      )}
                    </td>

                    {/* Action: View Form-J */}
                    <td className="py-4 px-5 text-right">
                      <button
                        onClick={() => setSelectedReceipt(payment)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-semibold transition border border-emerald-200/60 active:scale-95"
                      >
                        <FileText className="w-3.5 h-3.5" />
                        <span>{t('payments.formJTitle')}</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Official APMC Form-J Procurement Receipt Modal */}
      {selectedReceipt && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Actions Header */}
            <div className="bg-slate-900 text-white px-6 py-3.5 flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider uppercase text-emerald-400">
                {t('payments.formJTitle')}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-medium transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>{t('payments.printReceipt')}</span>
                </button>
                <button
                  onClick={() => setSelectedReceipt(null)}
                  className="p-1 hover:bg-white/20 rounded-lg text-slate-300 hover:text-white transition"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Voucher Content */}
            <div className="p-6 sm:p-8 space-y-6 text-slate-800" id="apmc-jform-receipt">
              {/* Receipt Header */}
              <div className="text-center border-b border-slate-200 pb-5">
                <div className="inline-block p-2 rounded-full bg-emerald-50 border border-emerald-200 mb-2">
                  <Landmark className="w-8 h-8 text-emerald-700" />
                </div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">
                  {t('payments.govHeader')}
                </h2>
                <p className="text-xs font-semibold text-emerald-800 uppercase tracking-widest mt-0.5">
                  {t('payments.govSubHeader')}
                </p>
                <div className="mt-3 inline-flex items-center gap-4 text-xs font-mono text-slate-600 bg-slate-50 px-4 py-1.5 rounded-lg border border-slate-200">
                  <span><strong>{t('payments.receiptNumber')}:</strong> {selectedReceipt.paymentNumber}</span>
                  <span>•</span>
                  <span><strong>{t('payments.dateIssued')}:</strong> {new Date(selectedReceipt.createdAt).toLocaleDateString('en-IN')}</span>
                </div>
              </div>

              {/* Mandi & Farmer Information Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                {/* Mandi Details */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('payments.buyerApmc')}</span>
                  <p className="font-bold text-slate-900 text-sm mt-1">{selectedReceipt.centreName}</p>
                  <p className="text-slate-600 mt-0.5">
                    {selectedReceipt.centreDistrict || 'N/A'}, {selectedReceipt.centreState || 'India'}
                  </p>
                </div>

                {/* Farmer Details */}
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('payments.sellerFarmer')}</span>
                  <p className="font-bold text-slate-900 text-sm mt-1">{selectedReceipt.farmerName || user?.fullName}</p>
                  <p className="text-slate-600 mt-0.5">Mobile: {selectedReceipt.farmerMobile || user?.mobile}</p>
                  <p className="text-slate-500 text-[11px]">
                    {[user?.village, user?.district, user?.state].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>

              {/* Itemized Produce Valuation */}
              <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
                <table className="w-full">
                  <thead className="bg-slate-100/80 font-bold text-slate-600 text-[11px] uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-4 text-left">{t('payments.itemDescription')}</th>
                      <th className="py-2.5 px-4 text-center">Quality Grade</th>
                      <th className="py-2.5 px-4 text-right">{t('payments.grossWeight')}</th>
                      <th className="py-2.5 px-4 text-right">{t('payments.mspRateApplied')}</th>
                      <th className="py-2.5 px-4 text-right">{t('payments.grossPayable')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr>
                      <td className="py-3 px-4 font-semibold text-slate-900">{selectedReceipt.cropName}</td>
                      <td className="py-3 px-4 text-center text-slate-600">{selectedReceipt.qualityGrade || 'Grade A (FAQ)'}</td>
                      <td className="py-3 px-4 text-right font-semibold text-slate-900">
                        {selectedReceipt.quantity} {selectedReceipt.unit}
                      </td>
                      <td className="py-3 px-4 text-right font-mono text-slate-700">
                        ₹{selectedReceipt.ratePerUnit.toLocaleString('en-IN')}
                      </td>
                      <td className="py-3 px-4 text-right font-black text-slate-900">
                        ₹{selectedReceipt.grossAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tbody>
                  <tfoot className="bg-slate-50 font-semibold text-slate-700 border-t border-slate-200">
                    <tr>
                      <td colSpan={4} className="py-2 px-4 text-right text-slate-500">{t('payments.deductions')}:</td>
                      <td className="py-2 px-4 text-right font-mono text-slate-900">-₹{selectedReceipt.deductions.toFixed(2)}</td>
                    </tr>
                    <tr className="bg-emerald-50/80 text-emerald-900 text-sm">
                      <td colSpan={4} className="py-3 px-4 text-right font-black">{t('payments.netDbtPayout')}:</td>
                      <td className="py-3 px-4 text-right font-black text-base text-emerald-800">
                        ₹{selectedReceipt.netAmount.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Direct Benefit Transfer Bank Details */}
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 uppercase tracking-wider text-[10px]">
                    {t('payments.bankDisbursementDetails')}
                  </span>
                  <Badge status={selectedReceipt.status} />
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-[11px]">
                  <div>
                    <span className="text-slate-400 block text-[10px] font-sans">Method</span>
                    <strong>{selectedReceipt.paymentMethod}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-sans">{t('payments.bankName')}</span>
                    <strong>{selectedReceipt.bankName || 'State Bank of India'}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-sans">{t('payments.accountNumber')}</span>
                    <strong>{selectedReceipt.accountNumberMasked || `XXXXXX${user?.mobile ? user.mobile.slice(-4) : '4021'}`}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] font-sans">{t('payments.utrNumber')}</span>
                    <strong className="text-emerald-700">{selectedReceipt.utrNumber || 'PENDING'}</strong>
                  </div>
                </div>
              </div>

              {/* Official Seal & Signature */}
              <div className="pt-4 flex items-center justify-between border-t border-slate-200 text-[11px] text-slate-500">
                <div>
                  <p className="font-bold text-slate-700">Kisan Kendra Portal</p>
                  <p className="text-[10px]">Direct APMC Procurement & Mandi Management System</p>
                </div>
                <div className="text-right">
                  <div className="w-28 h-8 border-b border-dashed border-slate-300 mx-auto mb-1"></div>
                  <p className="font-semibold text-slate-800">Authorized Officer Seal</p>
                  <p className="text-[10px] text-slate-400">Digitally Verified & Validated</p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-6 py-4 border-t border-slate-200 flex justify-end">
              <button
                onClick={() => setSelectedReceipt(null)}
                className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-semibold transition"
              >
                Close Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
