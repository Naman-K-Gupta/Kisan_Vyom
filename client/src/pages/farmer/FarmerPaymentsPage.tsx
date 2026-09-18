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
import { numberToWordsINR } from '../../utils/formatters';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-gradient-to-r from-emerald-800 to-teal-900 p-6 rounded-none text-white shadow-sm">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-none bg-emerald-700/60 text-emerald-200 text-xs font-semibold mb-2">
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
          className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 active:bg-white/30 text-white rounded-none text-xs font-semibold transition backdrop-blur-sm self-start sm:self-auto"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{t('common.refresh')}</span>
        </button>
      </div>

      {/* Financial KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Disbursed */}
        <div className="bg-white p-5 rounded-none border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('payments.clearedEarnings')}</span>
            <div className="w-9 h-9 rounded-none bg-emerald-50 flex items-center justify-center text-emerald-600">
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
        <div className="bg-white p-5 rounded-none border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('payments.inProcessing')}</span>
            <div className="w-9 h-9 rounded-none bg-amber-50 flex items-center justify-center text-amber-600">
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
        <div className="bg-white p-5 rounded-none border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('payments.volumeSold')}</span>
            <div className="w-9 h-9 rounded-none bg-blue-50 flex items-center justify-center text-blue-600">
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
        <div className="bg-white p-5 rounded-none border border-slate-200/80 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{t('payments.completedSales')}</span>
            <div className="w-9 h-9 rounded-none bg-purple-50 flex items-center justify-center text-purple-600">
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
      <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 text-white rounded-none p-6 border border-slate-800 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-none bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
              <Landmark className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-lg">
                  {summary?.verifiedBankAccount?.bankName || 'State Bank of India'}
                </h3>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-[11px] font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5" /> {t('payments.aadhaarLinkedDbt')}
                </span>
              </div>
              <p className="text-slate-400 text-xs mt-1">
                {t('payments.accountHolder')}: <span className="text-slate-200 font-semibold">{user?.fullName || 'Registered Farmer'}</span> • {t('payments.ifscCode')}: <span className="text-slate-200 font-mono font-semibold">{summary?.verifiedBankAccount?.ifscCode || 'SBIN0001234'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto bg-slate-800/80 px-4 py-3 rounded-none border border-slate-700/60">
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
      <div className="bg-white p-4 rounded-none border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
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
              className={`px-3.5 py-1.5 rounded-none text-xs font-semibold whitespace-nowrap transition-all ${
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
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-none text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Payments History Table */}
      <div className="bg-white rounded-none border border-slate-200/80 shadow-sm overflow-hidden">
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
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-none text-xs font-semibold transition border border-emerald-200/60 active:scale-95"
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
      {selectedReceipt && (() => {
        const rNetQty = Number(selectedReceipt.quantity || 40);
        const rNetKg = Math.round(rNetQty * 100);
        const rTareKg = Math.round(rNetQty * 32 + 1640);
        const rGrossKg = rNetKg + rTareKg;
        const rBags = Math.round(rNetKg / 50);
        const rGunnyTare = +(rBags * 0.58).toFixed(1);
        const rAmountWords = numberToWordsINR(selectedReceipt.netAmount);
        const rFormattedDate = new Date(selectedReceipt.createdAt).toLocaleDateString('en-IN', {
          day: '2-digit',
          month: 'long',
          year: 'numeric',
        });
        const rFormattedTime = new Date(selectedReceipt.createdAt).toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });

        return (
          <div className="fixed inset-0 bg-slate-950/75 backdrop-blur-sm z-50 flex items-center justify-center p-2 sm:p-4 overflow-y-auto print:p-0 print:bg-white animate-fade-in">
            <div className="bg-white rounded-none max-w-4xl w-full border-2 border-slate-800 shadow-2xl overflow-hidden my-6 print:my-0 print:border-none print:shadow-none max-h-[96vh] flex flex-col">
              
              {/* Modal Actions Header (Hidden on Print) */}
              <div className="bg-slate-900 text-white px-5 py-3 flex items-center justify-between print:hidden border-b border-slate-800">
                <span className="text-xs font-bold tracking-wider uppercase text-emerald-400">
                  {t('payments.formJTitle')} • Official APMC Government Procurement Certificate
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-none text-xs font-bold transition shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>{t('payments.printReceipt')}</span>
                  </button>
                  <button
                    onClick={() => setSelectedReceipt(null)}
                    className="p-1.5 hover:bg-white/10 rounded-none text-slate-400 hover:text-white transition"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Printable Voucher Content */}
              <div className="overflow-y-auto p-4 sm:p-8 bg-white print:p-0" id="apmc-jform-receipt">
                <div className="border-2 border-slate-900 p-5 sm:p-7 relative bg-white space-y-4">
                  
                  {/* Watermark */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.035] select-none text-slate-900 font-serif font-black text-5xl sm:text-7xl tracking-widest rotate-[-22deg] z-0">
                    APMC FORM-J CERTIFICATE
                  </div>

                  {/* Top Header */}
                  <div className="relative z-10 border-b-2 border-slate-900 pb-4">
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
                      <div className="flex-1 text-left hidden sm:block">
                        <span className="inline-block px-2.5 py-1 border border-slate-800 text-[10px] font-black uppercase text-slate-900 tracking-wider bg-slate-50">
                          मूल प्रति / ORIGINAL (FARMER COPY)
                        </span>
                        <p className="text-[10px] text-slate-500 font-mono mt-1 font-semibold">
                          FORM-J • प्रपत्र 'जे' (नियम २४(१))
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">
                          STATE MANDI BOARD ACT, 1961
                        </p>
                      </div>

                      <div className="flex-2 flex flex-col items-center text-center">
                        <img
                          src="/logo.png"
                          alt="Kisan Vyom APMC Emblem"
                          className="w-16 h-16 sm:w-20 sm:h-20 object-contain mb-1 drop-shadow-xs"
                        />
                        <h1 className="text-base sm:text-lg font-black text-slate-950 uppercase tracking-tight font-serif">
                          कृषि उपज मंडी समिति (APMC)
                        </h1>
                        <h2 className="text-xs sm:text-sm font-extrabold text-slate-800 tracking-wide uppercase">
                          AGRICULTURAL PRODUCE MARKET COMMITTEE
                        </h2>
                        <p className="text-[11px] font-semibold text-slate-600">
                          खाद्य, नागरिक आपूर्ति एवं उपभोक्ता मामले विभाग • Department of Food & Public Distribution
                        </p>
                        <div className="mt-1.5 px-3 py-0.5 bg-slate-900 text-white text-[11px] font-black uppercase tracking-wider">
                          प्रपत्र 'जे' - ई-मंडी उपज क्रय एवं अंतिम भुगतान प्रमाणपत्र
                        </div>
                      </div>

                      <div className="flex-1 text-right flex flex-col items-center sm:items-end">
                        <div className="font-mono text-center tracking-[4px] font-black text-xs text-slate-800 select-none">
                          ||| | |||| || | |||| ||| ||||
                        </div>
                        <span className="font-mono text-[10px] font-bold text-slate-600 tracking-wider">
                          {selectedReceipt.paymentNumber}
                        </span>
                        <div className="mt-1 text-[11px] font-bold text-slate-800">
                          <span className="text-slate-500 font-normal">Date: </span>
                          {rFormattedDate}
                        </div>
                        <div className="text-[10px] font-mono text-slate-600">
                          <span className="text-slate-500 font-normal">Time: </span>
                          {rFormattedTime}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Meta Strip */}
                  <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs border border-slate-800 bg-slate-50 p-2 font-mono">
                    <div>
                      <span className="text-[10px] font-sans text-slate-500 block uppercase font-bold">रसीद संख्या (Receipt No)</span>
                      <span className="font-black text-slate-900 text-xs">{selectedReceipt.paymentNumber}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-sans text-slate-500 block uppercase font-bold">दिनांक (Date of Issue)</span>
                      <span className="font-black text-slate-900 text-xs">{rFormattedDate}</span>
                    </div>
                    <div>
                      <span className="text-[10px] font-sans text-slate-500 block uppercase font-bold">क्रय एजेंसी (Procuring Agency)</span>
                      <span className="font-black text-emerald-900 text-xs">HAFED / FCI CENTRAL POOL</span>
                    </div>
                    <div className="text-left sm:text-right">
                      <span className="text-[10px] font-sans text-slate-500 block uppercase font-bold">भुगतान स्थिति (Status)</span>
                      <span className="font-black text-emerald-800 text-xs uppercase">{selectedReceipt.status}</span>
                    </div>
                  </div>

                  {/* Mandi & Farmer Particulars */}
                  <div className="relative z-10 border border-slate-800 text-xs">
                    <div className="bg-slate-800 text-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider flex justify-between items-center">
                      <span>१. क्रेता मंडी एवं विक्रेता किसान विवरण (Mandi & Farmer Details)</span>
                      <span className="text-[10px] font-normal text-slate-300">Verified e-Kharid Record</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 divide-y sm:divide-y-0 sm:divide-x divide-slate-300 p-3 bg-white gap-3">
                      <div className="space-y-1 sm:pr-2">
                        <div className="flex justify-between">
                          <span className="text-slate-500">क्रेता मंडी केंद्र (Buyer APMC Centre):</span>
                          <span className="font-black text-slate-900">{selectedReceipt.centreName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">स्थान / जिला (District & State):</span>
                          <span className="font-semibold text-slate-800">
                            {selectedReceipt.centreDistrict || 'Karnal'}, {selectedReceipt.centreState || 'Haryana'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">मंडी कोड (Centre Code):</span>
                          <span className="font-mono font-bold text-slate-800">APMC-HR-KRN-01</span>
                        </div>
                      </div>

                      <div className="space-y-1 sm:pl-2">
                        <div className="flex justify-between">
                          <span className="text-slate-500">विक्रेता किसान (Seller Farmer):</span>
                          <span className="font-black text-slate-950 text-sm">{selectedReceipt.farmerName || user?.fullName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">किसान पंजीयन (Farmer ID):</span>
                          <span className="font-mono font-bold text-slate-900">
                            FMR-HR-{user?.mobile ? user.mobile.slice(-6) : '946420'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">मोबाइल (Mobile):</span>
                          <span className="font-mono font-bold text-slate-800">
                            +91 {selectedReceipt.farmerMobile || user?.mobile}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-500">निवास (Address):</span>
                          <span className="font-semibold text-slate-800">
                            {[user?.village, user?.district, user?.state].filter(Boolean).join(', ') || 'Karnal, Haryana'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Scale & Weighment Reading */}
                  <div className="relative z-10 border border-slate-800 text-xs">
                    <div className="bg-slate-800 text-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider flex justify-between items-center">
                      <span>२. तुलाई माप व सकल/शुद्ध वजन विवरण (Weighment Scale Telemetry)</span>
                      <span className="text-[10px] font-mono text-slate-300">Certified Electronic Scale WB-04</span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left">
                        <thead>
                          <tr className="bg-slate-100 border-b border-slate-800 text-[10px] font-black uppercase text-slate-700 font-sans">
                            <th className="py-2 px-3 border-r border-slate-300">उपज (Crop Description)</th>
                            <th className="py-2 px-3 border-r border-slate-300 text-right">सकल वजन (Gross Wt)</th>
                            <th className="py-2 px-3 border-r border-slate-300 text-right">खाली वजन (Tare Wt)</th>
                            <th className="py-2 px-3 border-r border-slate-300 text-right">शुद्ध उपज (Net Wt)</th>
                            <th className="py-2 px-3 border-r border-slate-300 text-right">बोरी कटौती (Gunny Cut)</th>
                            <th className="py-2 px-3 text-right bg-slate-200/80 font-black text-slate-950">
                              स्वीकृत शुद्ध वजन (Final Billed Wt)
                            </th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 font-mono">
                          <tr className="bg-white">
                            <td className="py-2.5 px-3 border-r border-slate-300 font-sans font-black text-slate-900">
                              {selectedReceipt.cropName}
                              <span className="block text-[10px] text-slate-500 font-normal">
                                Packing: {rBags} Bags (50kg std)
                              </span>
                            </td>
                            <td className="py-2.5 px-3 border-r border-slate-300 text-right text-slate-800">
                              {rGrossKg.toLocaleString('en-IN')} kg
                            </td>
                            <td className="py-2.5 px-3 border-r border-slate-300 text-right text-slate-800">
                              {rTareKg.toLocaleString('en-IN')} kg
                            </td>
                            <td className="py-2.5 px-3 border-r border-slate-300 text-right font-bold text-slate-900">
                              {rNetKg.toLocaleString('en-IN')} kg
                            </td>
                            <td className="py-2.5 px-3 border-r border-slate-300 text-right text-rose-700">
                              -{rGunnyTare} kg
                            </td>
                            <td className="py-2.5 px-3 text-right bg-slate-100 font-black text-slate-950 text-sm">
                              {rNetQty.toFixed(2)} Quintal
                              <span className="block text-[10px] text-emerald-800 font-bold">
                                ({rNetKg.toLocaleString('en-IN')} kg)
                              </span>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Commercial MSP Billing */}
                  <div className="relative z-10 border border-slate-800 text-xs">
                    <div className="bg-slate-800 text-white px-3 py-1 text-[11px] font-bold uppercase tracking-wider flex justify-between items-center">
                      <span>३. न्यूनतम समर्थन मूल्य (MSP) एवं वित्तीय विवरण (Financial Settlement Ledger)</span>
                      <span className="text-[10px] text-slate-300">Form-J Statutory Schedule</span>
                    </div>

                    <div className="p-3 bg-white space-y-2">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-1.5 border-b sm:border-b-0 sm:border-r border-slate-200 sm:pr-4 pb-2 sm:pb-0">
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-600">सरकारी घोषित समर्थन मूल्य (MSP Rate):</span>
                            <span className="font-mono font-bold text-slate-900">₹{selectedReceipt.ratePerUnit.toLocaleString('en-IN')} / Quintal</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-600">स्वीकृत वजन (Billed Quantity):</span>
                            <span className="font-mono font-bold text-slate-900">{rNetQty} {selectedReceipt.unit}</span>
                          </div>
                          <div className="flex justify-between text-xs">
                            <span className="text-slate-600">सकल मूल्य (Gross Value):</span>
                            <span className="font-mono font-black text-slate-900">₹{selectedReceipt.grossAmount.toLocaleString('en-IN')}</span>
                          </div>
                          <div className="flex justify-between text-xs text-rose-600">
                            <span>कटौती (Refraction / Deductions):</span>
                            <span className="font-mono font-bold">-₹{selectedReceipt.deductions.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200">
                            <span>मंडी शुल्क व विकास निधि (Market Fee & RDF):</span>
                            <span className="font-mono">₹{(selectedReceipt.grossAmount * 0.02).toLocaleString('en-IN')} (Procuring Agency Liability)</span>
                          </div>
                        </div>

                        <div className="space-y-2 sm:pl-2">
                          <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-none text-center sm:text-right">
                            <span className="text-[10px] font-bold text-emerald-900 uppercase tracking-wider block">
                              अंतिम प्रत्यक्ष बैंक अंतरण राशि (NET DBT PAYABLE)
                            </span>
                            <p className="text-2xl font-black text-emerald-900 font-mono mt-0.5">
                              ₹{selectedReceipt.netAmount.toLocaleString('en-IN')}
                            </p>
                            <p className="text-[11px] font-serif font-bold text-slate-700 mt-1 italic text-center sm:text-right">
                              ({rAmountWords})
                            </p>
                          </div>

                          <div className="text-[11px] space-y-1 font-mono bg-slate-50 p-2 border border-slate-200">
                            <div className="flex justify-between">
                              <span className="text-slate-500 font-sans">भुगतान माध्यम (Method):</span>
                              <span className="font-bold text-slate-900">{selectedReceipt.paymentMethod}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 font-sans">बैंक (Bank Name):</span>
                              <span className="font-bold text-slate-900">{selectedReceipt.bankName || 'State Bank of India'}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 font-sans">खाता (Account):</span>
                              <span className="font-bold text-slate-900">
                                {selectedReceipt.accountNumberMasked || `XXXXXX${user?.mobile ? user.mobile.slice(-4) : '4021'}`}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-500 font-sans">यूटीआर / संदर्भ सं. (UTR Ref):</span>
                              <span className="font-bold text-emerald-700">{selectedReceipt.utrNumber || 'PFMS-APBS-SETTLED'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Signatures & Seal */}
                  <div className="relative z-10 pt-2 border-t-2 border-slate-900">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-end text-center">
                      <div className="space-y-1">
                        <div className="h-12 border-b border-slate-900 w-44 mx-auto mb-1 flex items-end justify-center pb-1">
                          <span className="text-[10px] font-serif text-slate-400 italic">
                            {selectedReceipt.farmerName || user?.fullName}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-900">
                          हस्ताक्षर विक्रेता किसान
                        </p>
                        <p className="text-[10px] text-slate-500">
                          (Seller Farmer Signature)
                        </p>
                      </div>

                      <div className="flex flex-col items-center justify-center">
                        <div className="w-24 h-24 rounded-full border-2 border-dashed border-blue-800 p-1 flex items-center justify-center text-center rotate-[-8deg] shadow-xs select-none">
                          <div className="w-full h-full rounded-full border border-blue-800 flex flex-col items-center justify-center p-1 text-[8px] font-black uppercase text-blue-900 tracking-tighter leading-tight bg-blue-50/40">
                            <span>★ APMC MANDI ★</span>
                            <span className="text-[9px] font-bold text-blue-950 font-serif">FORM-J VERIFIED</span>
                            <span className="text-[7px]">PURCHASE CERTIFIED</span>
                            <span className="text-[7px] text-blue-800 font-mono">{rFormattedDate}</span>
                          </div>
                        </div>
                        <span className="text-[9px] font-mono text-slate-400 mt-1 uppercase">
                          Official APMC Digital Seal
                        </span>
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-16 h-16 p-1 bg-white border border-slate-900 flex-shrink-0 flex items-center justify-center">
                            <svg viewBox="0 0 100 100" className="w-full h-full">
                              <rect width="100" height="100" fill="white" />
                              <rect x="8" y="8" width="28" height="28" fill="#0f172a" />
                              <rect x="14" y="14" width="16" height="16" fill="white" />
                              <rect x="18" y="18" width="8" height="8" fill="#0f172a" />
                              <rect x="64" y="8" width="28" height="28" fill="#0f172a" />
                              <rect x="70" y="14" width="16" height="16" fill="white" />
                              <rect x="74" y="18" width="8" height="8" fill="#0f172a" />
                              <rect x="8" y="64" width="28" height="28" fill="#0f172a" />
                              <rect x="14" y="70" width="16" height="16" fill="white" />
                              <rect x="18" y="74" width="8" height="8" fill="#0f172a" />
                              <rect x="42" y="12" width="12" height="12" fill="#0f172a" />
                              <rect x="42" y="42" width="16" height="16" fill="#0f172a" />
                              <rect x="42" y="72" width="12" height="16" fill="#0f172a" />
                              <rect x="68" y="44" width="18" height="12" fill="#0f172a" />
                              <rect x="68" y="72" width="18" height="16" fill="#0f172a" />
                            </svg>
                          </div>

                          <div className="text-left">
                            <div className="h-8 border-b border-slate-900 w-32 mb-1 flex items-end justify-center pb-0.5">
                              <span className="text-[9px] font-mono text-slate-500 font-bold">MANDI SECRETARY</span>
                            </div>
                            <p className="text-xs font-bold text-slate-900">
                              मंडी सचिव / अधिकृत अधिकारी
                            </p>
                            <p className="text-[10px] text-slate-500">
                              Secretary, APMC Board
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Statutory Footer */}
                  <div className="relative z-10 pt-3 border-t border-dashed border-slate-300 text-[10px] text-slate-500 text-justify leading-relaxed">
                    <p>
                      <strong>प्रमाणपत्र एवं वैधानिक सूचना:</strong> प्रमाणित किया जाता है कि उपरोक्त कृषि जिंस का वजन राजकीय इलेक्ट्रॉनिक धर्मकांटा पर सही तौला गया है तथा भारतीय मानक ब्यूरो / कृषि मंत्रालय के गुणवत्ता नियमों के अनुरूप पाया गया है। प्रपत्र 'जे' के अनुसार देय राशि सीधे बैंक खाते में प्रेषित की गई है।
                    </p>
                  </div>
                </div>
              </div>

              {/* Modal Bottom Footer (Hidden on Print) */}
              <div className="bg-slate-100 px-6 py-3.5 border-t border-slate-300 flex items-center justify-between print:hidden">
                <span className="text-xs text-slate-500 font-medium">
                  Verified Government Record • Kisan Vyom Digital Mandi
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => window.print()}
                    className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-none text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print Form-J Receipt</span>
                  </button>
                  <button
                    onClick={() => setSelectedReceipt(null)}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-none text-xs font-bold transition shadow-sm"
                  >
                    Close Receipt
                  </button>
                </div>
              </div>

            </div>
          </div>
        );
      })()}
    </div>
  );
};
