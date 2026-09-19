import React, { useEffect, useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useSocket } from '../../contexts/SocketContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../api';
import {
  WeatherDataDTO,
  QueueTokenDTO,
  GovernmentCropPriceDTO,
  AlertDTO,
  PaymentSummaryDTO,
} from '@smart-farmer/shared';
import { EnvironmentAwarenessBanner } from '../../components/farmer/EnvironmentAwarenessBanner';
import { Badge } from '../../components/common/Badge';
import { Link } from 'react-router-dom';
import { FarmerWeatherCard } from '../../components/farmer/FarmerWeatherCard';
import { ActiveTokenCard } from '../../components/farmer/ActiveTokenCard';
import { FarmerBankDetailsModal, BankFormData } from '../../components/farmer/FarmerBankDetailsModal';
import { formatCurrency } from '../../utils/formatters';
import { compressProfileImage } from '../../utils/imageCompressor';
import {
  Clock,
  TrendingUp,
  AlertTriangle,
  ArrowRight,
  Compass,
  CheckCircle,
  Building2,
  Calendar,
  IndianRupee,
  Landmark,
  ShieldCheck,
  CheckCircle2,
  Edit3,
  Eye,
  EyeOff,
  Camera,
  RefreshCw,
  X,
  User as UserIcon,
  Sprout,
  MapPin,
} from 'lucide-react';

const POPULAR_INDIAN_BANKS = [
  'State Bank of India',
  'Punjab National Bank',
  'HDFC Bank',
  'ICICI Bank',
  'Bank of Baroda',
  'Canara Bank',
  'Union Bank of India',
  'Axis Bank',
  'Indian Bank',
  'Central Bank of India',
  'Other',
];

/**
 * FarmerDashboard - Primary Farmer Operations & Agronomy Hub.
 * Composes live meteorological telemetry, digital gate passes, PFMS bank ledgers, and crop portfolios.
 */
export const FarmerDashboard: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { socket } = useSocket();
  const { showToast } = useNotifications();
  const { t } = useLanguage();

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoLoadError, setPhotoLoadError] = useState(false);
  const [previewPhotoUrl, setPreviewPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    setPhotoLoadError(false);
  }, [user?.farmerProfile?.profilePictureUrl]);

  const [weather, setWeather] = useState<WeatherDataDTO | null>(null);
  const [activeToken, setActiveToken] = useState<QueueTokenDTO | null>(null);
  const [topPrices, setTopPrices] = useState<GovernmentCropPriceDTO[]>([]);
  const [alerts, setAlerts] = useState<AlertDTO[]>([]);
  const [paymentSummary, setPaymentSummary] = useState<PaymentSummaryDTO | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Bank records state
  const [bankDetails, setBankDetails] = useState<{
    accountHolderName: string;
    bankName: string;
    accountNumber: string;
    accountNumberMasked: string;
    ifscCode: string;
    branchName: string;
    aadhaarLinked: boolean;
    pfmsStatus: string;
    upiId?: string;
  } | null>(null);

  const [isBankModalOpen, setIsBankModalOpen] = useState(false);
  const [showFullAccount, setShowFullAccount] = useState(false);
  const [isSavingBank, setIsSavingBank] = useState(false);
  const [bankError, setBankError] = useState<string | null>(null);
  const [bankSuccess, setBankSuccess] = useState<string | null>(null);

  const [bankForm, setBankForm] = useState<BankFormData>({
    accountHolderName: '',
    bankName: 'State Bank of India',
    customBankName: '',
    accountNumber: '',
    confirmAccountNumber: '',
    ifscCode: '',
    branchName: '',
    aadhaarLinked: true,
    upiId: '',
  });

  const fetchDashboardData = async () => {
    try {
      // 1. Weather
      const weatherRes = await api.weather.get({ locationName: `${user?.district}, ${user?.state}` });
      if (weatherRes.data.success && weatherRes.data.weather) {
        setWeather(weatherRes.data.weather);
      }

      // 2. Active Token
      const tokenRes = await api.queue.getMyToken();
      if (tokenRes.data.success) {
        setActiveToken(tokenRes.data.token);
      }

      // 3. MSP Prices
      const pricesRes = await api.prices.getGovernmentPrices();
      if (pricesRes.data.success) {
        setTopPrices(pricesRes.data.prices.slice(0, 4));
      }

      // 5. Alerts
      const alertsRes = await api.alerts.getAll({ location: user?.state });
      if (alertsRes.data.success) {
        setAlerts(alertsRes.data.alerts.slice(0, 3));
      }

      // 6. DBT Payments
      const paymentRes = await api.payments.getMyPayments();
      if (paymentRes.data.success) {
        setPaymentSummary(paymentRes.data.summary);
      }

      // 7. Bank Records
      try {
        const bankRes = await api.farmer.getBankDetails();
        if (bankRes.data.success && bankRes.data.bankDetails) {
          setBankDetails(bankRes.data.bankDetails);
        }
      } catch (e) {
        console.warn('Bank records fetch skipped or empty:', e);
      }
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const openBankModal = () => {
    if (bankDetails) {
      const isKnown = POPULAR_INDIAN_BANKS.includes(bankDetails.bankName);
      setBankForm({
        accountHolderName: bankDetails.accountHolderName || user?.fullName || '',
        bankName: isKnown ? bankDetails.bankName : 'Other',
        customBankName: isKnown ? '' : bankDetails.bankName,
        accountNumber: bankDetails.accountNumber || '',
        confirmAccountNumber: bankDetails.accountNumber || '',
        ifscCode: bankDetails.ifscCode || '',
        branchName: bankDetails.branchName || '',
        aadhaarLinked: bankDetails.aadhaarLinked ?? true,
        upiId: bankDetails.upiId || '',
      });
    } else {
      setBankForm({
        accountHolderName: user?.fullName || '',
        bankName: 'State Bank of India',
        customBankName: '',
        accountNumber: '',
        confirmAccountNumber: '',
        ifscCode: '',
        branchName: '',
        aadhaarLinked: true,
        upiId: '',
      });
    }
    setBankError(null);
    setBankSuccess(null);
    setIsBankModalOpen(true);
  };

  const handleSaveBankDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setBankError(null);
    setBankSuccess(null);

    const actualBankName =
      bankForm.bankName === 'Other' ? bankForm.customBankName.trim() : bankForm.bankName;

    if (!bankForm.accountHolderName.trim()) {
      setBankError('Account holder name is required.');
      return;
    }
    if (!actualBankName) {
      setBankError('Please provide a bank name.');
      return;
    }
    if (!bankForm.accountNumber.trim()) {
      setBankError('Account number is required.');
      return;
    }
    if (bankForm.accountNumber !== bankForm.confirmAccountNumber) {
      setBankError(t('dashboard.accNumberMismatch', 'Account numbers do not match.'));
      return;
    }
    const cleanIfsc = bankForm.ifscCode.trim().toUpperCase();
    if (cleanIfsc.length !== 11) {
      setBankError(t('dashboard.invalidIfsc', 'Please enter a valid 11-character IFSC code.'));
      return;
    }

    setIsSavingBank(true);
    try {
      const res = await api.farmer.updateBankDetails({
        accountHolderName: bankForm.accountHolderName.trim(),
        bankName: actualBankName,
        accountNumber: bankForm.accountNumber.trim(),
        ifscCode: cleanIfsc,
        branchName: bankForm.branchName.trim() || undefined,
        aadhaarLinked: bankForm.aadhaarLinked,
        upiId: bankForm.upiId.trim() || undefined,
      });

      if (res.data.success) {
        setBankDetails(res.data.bankDetails);
        setBankSuccess(t('dashboard.bankDetailsUpdatedSuccess', 'Bank records updated successfully.'));
        setTimeout(() => {
          setIsBankModalOpen(false);
          setBankSuccess(null);
        }, 1200);
      }
    } catch (err: any) {
      setBankError(err.response?.data?.message || 'Failed to update bank records.');
    } finally {
      setIsSavingBank(false);
    }
  };

  const handleDashboardPhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      showToast(t('common.error'), 'Photo must be smaller than 5MB', 'error');
      return;
    }

    setIsUploadingPhoto(true);
    try {
      const compressed = await compressProfileImage(file, 400, 400, 0.85);
      const formData = new FormData();
      formData.append('photo', compressed);
      formData.append('picture', compressed);

      const res = await api.farmer.uploadProfilePicture(formData);
      if (res.data.success) {
        setPhotoLoadError(false);
        showToast(t('common.success'), 'Profile photo updated successfully', 'success');
        refreshUser();
      }
    } catch (err: any) {
      showToast(t('common.error'), err.response?.data?.message || 'Failed to upload photo', 'error');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  // Listen for real-time queue socket updates
  useEffect(() => {
    if (!socket) return;

    const handleQueueCalled = (token: QueueTokenDTO) => {
      if (activeToken && token.id === activeToken.id) {
        setActiveToken(token);
      }
    };

    const handleQueueUpdated = () => {
      api.queue.getMyToken().then((res) => {
        if (res.data.success) setActiveToken(res.data.token);
      });
    };

    socket.on('queue:called', handleQueueCalled);
    socket.on('queue:processing', handleQueueCalled);
    socket.on('queue:completed', () => setActiveToken(null));
    socket.on('queue:cancelled', () => setActiveToken(null));
    socket.on('queue:updated', handleQueueUpdated);

    return () => {
      socket.off('queue:called', handleQueueCalled);
      socket.off('queue:processing', handleQueueCalled);
      socket.off('queue:completed');
      socket.off('queue:cancelled');
      socket.off('queue:updated', handleQueueUpdated);
    };
  }, [socket, activeToken]);

  return (
    <div className="space-y-6 animate-fade-in pb-12">
      {/* Farmer Identity Top Masthead Banner */}
      <div className="rounded-none bg-gradient-to-r from-emerald-700 via-emerald-800 to-teal-900 text-white p-6 sm:p-8 shadow-xl shadow-emerald-900/10 relative overflow-hidden">
        <div className="absolute -right-10 -bottom-10 w-48 h-48 rounded-none bg-white/5 pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {/* Farmer Avatar with Camera Upload */}
            <div className="relative group flex-shrink-0">
              {user?.farmerProfile?.profilePictureUrl && !photoLoadError ? (
                <img
                  src={user.farmerProfile.profilePictureUrl}
                  alt={user.fullName}
                  onClick={() => setPreviewPhotoUrl(user.farmerProfile?.profilePictureUrl || null)}
                  onError={() => setPhotoLoadError(true)}
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-none object-cover border-2 border-white/30 shadow-lg cursor-pointer hover:opacity-90 transition"
                />
              ) : (
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-none bg-white/10 border-2 border-white/20 flex items-center justify-center text-white text-2xl font-bold backdrop-blur-sm">
                  {user?.fullName?.charAt(0) || <UserIcon className="w-8 h-8" />}
                </div>
              )}

              <label
                title="Change Photo"
                className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-none bg-white text-emerald-800 shadow-md cursor-pointer hover:bg-emerald-50 active:scale-95 transition-all"
              >
                {isUploadingPhoto ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-700" />
                ) : (
                  <Camera className="w-3.5 h-3.5" />
                )}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={handleDashboardPhotoUpload}
                  className="hidden"
                  disabled={isUploadingPhoto}
                />
              </label>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap mb-1.5">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-none text-xs font-semibold bg-white/15 backdrop-blur text-emerald-100">
                  <Sprout className="w-3.5 h-3.5 text-emerald-300" /> {t('roles.farmer')} Portal
                </span>
                {user?.village && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none text-[11px] font-medium bg-emerald-800/50 text-emerald-200 border border-emerald-500/30">
                    <MapPin className="w-3 h-3 text-emerald-300" /> {user.village}, {user.district}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-none text-[10px] font-bold bg-emerald-400/20 text-emerald-200 border border-emerald-300/30">
                  <CheckCircle className="w-3 h-3 text-emerald-300" /> Verified Farmer
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {user?.fullName || 'Farmer'}
              </h1>
              <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-xl leading-relaxed">
                {t('landing.heroDesc')}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/farmer/centres"
              className="px-5 py-2.5 rounded-none bg-white text-emerald-800 text-xs font-bold hover:bg-emerald-50 active:scale-95 transition-all shadow-md flex items-center gap-2"
            >
              <Building2 className="w-4 h-4" /> {t('nav.centres')}
            </Link>
            <Link
              to="/farmer/ai"
              className="px-5 py-2.5 rounded-none bg-emerald-800/60 border border-white/20 text-white text-xs font-bold hover:bg-emerald-800 active:scale-95 transition-all flex items-center gap-2"
            >
              <Compass className="w-4 h-4" /> {t('nav.ai')}
            </Link>
          </div>
        </div>
      </div>

      {/* Live Alerts Banner */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className="p-4 rounded-none bg-amber-50 border border-amber-200/80 flex items-start gap-3 text-amber-900"
            >
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="text-xs font-bold">{alert.title}</h4>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-none bg-amber-200/60 text-amber-800">
                    {alert.priority}
                  </span>
                </div>
                <p className="text-xs text-amber-800/90 mt-0.5 leading-relaxed">{alert.message}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Top Telemetry & Environmental Protection Awareness Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-stretch">
        <div className="lg:col-span-4 flex flex-col">
          <FarmerWeatherCard weather={weather} t={t} />
        </div>
        <div className="lg:col-span-8 flex flex-col">
          <EnvironmentAwarenessBanner t={t} />
        </div>
      </div>

      {/* Financial Settlement & Bank Details Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Direct Benefit Transfer (DBT) Overview Banner */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 rounded-none p-6 text-white shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-none bg-emerald-500/20 text-emerald-400 flex items-center justify-center flex-shrink-0 border border-emerald-500/30">
                  <IndianRupee className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-white">
                    {t('dashboard.dbtOverviewTitle', 'Direct Benefit Transfer (DBT) Payouts')}
                  </h3>
                  <p className="text-[11px] text-emerald-200/80">
                    {t('dashboard.dbtOverviewSub', 'Central & State PFMS electronic clearing directly to your linked bank account')}
                  </p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-none bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-emerald-400" />
                {t('dashboard.dbtDirectSettlement', 'Direct Bank Settlement')}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 my-5 py-3.5 px-3.5 rounded-none bg-white/5 border border-white/5">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('dashboard.cleared')}</span>
                <span className="font-extrabold text-sm sm:text-base text-emerald-400">
                  {formatCurrency(paymentSummary?.totalDisbursed || 0)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('dashboard.inProcessing')}</span>
                <span className="font-extrabold text-sm sm:text-base text-amber-400">
                  {formatCurrency(paymentSummary?.pendingDisbursement || 0)}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">{t('dashboard.sold')}</span>
                <span className="font-extrabold text-sm sm:text-base text-slate-100">
                  {paymentSummary?.totalQuantitySold || 0} Qtl
                </span>
              </div>
            </div>
          </div>

          <Link
            to="/farmer/payments"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-none text-xs font-bold transition shadow-sm active:scale-95 self-start sm:self-auto"
          >
            <span>{t('dashboard.viewPaymentsJForm')}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Bank Records DBT Card */}
        <div className="bg-white rounded-none p-6 border border-slate-100 shadow-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-none bg-blue-50 text-blue-600 flex items-center justify-center flex-shrink-0 border border-blue-100">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-slate-900">{t('dashboard.bankRecordsTitle')}</h3>
                  <p className="text-[11px] text-slate-400 truncate max-w-xs">{t('dashboard.bankRecordsSub')}</p>
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-none bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-200/60 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-blue-600" />
                {t('dashboard.aadhaarLinkedDbt')}
              </span>
            </div>

            {bankDetails ? (
              <div className="mt-4 space-y-3">
                <div className="flex items-center justify-between p-3.5 rounded-none bg-slate-50 border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      {t('dashboard.bankNameLabel')}
                    </span>
                    <p className="text-sm font-bold text-slate-800 mt-0.5">{bankDetails.bankName}</p>
                    {bankDetails.branchName && (
                      <p className="text-[11px] text-slate-500">{bankDetails.branchName}</p>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                      {t('dashboard.ifscCode')}
                    </span>
                    <p className="text-xs font-mono font-bold text-slate-700 mt-0.5">{bankDetails.ifscCode}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-none bg-slate-50 border border-slate-100">
                    <span className="text-[10px] font-medium text-slate-400 block">{t('dashboard.accountHolder')}</span>
                    <p className="text-xs font-bold text-slate-800 mt-0.5 truncate">{bankDetails.accountHolderName}</p>
                  </div>
                  <div className="p-3 rounded-none bg-slate-50 border border-slate-100">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-medium text-slate-400 block">{t('dashboard.accountNumber')}</span>
                      <button
                        type="button"
                        onClick={() => setShowFullAccount(!showFullAccount)}
                        className="text-slate-400 hover:text-slate-600 p-0.5"
                        title={showFullAccount ? t('dashboard.hideAccount') : t('dashboard.showAccount')}
                      >
                        {showFullAccount ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <p className="text-xs font-mono font-bold text-slate-800 mt-0.5">
                      {showFullAccount ? bankDetails.accountNumber : bankDetails.accountNumberMasked}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-500">
                No bank records configured. Add your primary bank account for seamless DBT MSP payments.
              </div>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
            <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> {t('dashboard.pfmsStatusBadge')}
            </span>
            <button
              type="button"
              onClick={openBankModal}
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-none border border-blue-200/60 active:scale-95 transition"
            >
              <Edit3 className="w-3.5 h-3.5" /> {t('dashboard.editDetails')}
            </button>
          </div>
        </div>
      </div>

      {/* Active Token Card */}
      <ActiveTokenCard activeToken={activeToken} t={t} />

      {/* Official Government Minimum Support Price (MSP) Floor Benchmarks */}
      <div className="bg-white rounded-none p-6 border border-slate-100 shadow-card">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              {t('dashboard.topMspRates', 'Top Minimum Support Price (MSP) Rates')}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {t('dashboard.officialGovtFloorPrice', 'Official Government Floor Price & Procurement Benchmarks')}
            </p>
          </div>
          <Link
            to="/farmer/prices"
            className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 self-start sm:self-auto"
          >
            {t('dashboard.allPrices', 'All Prices')} <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {topPrices.length === 0 ? (
            <p className="col-span-full py-6 text-xs text-slate-400 text-center">
              {t('dashboard.noMspAvailable', 'No government price records available currently.')}
            </p>
          ) : (
            topPrices.map((price) => (
              <div
                key={price.id}
                className="p-4 bg-slate-50 border border-slate-200/70 rounded-none flex flex-col justify-between hover:border-emerald-300 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="px-2 py-0.5 rounded-none bg-emerald-100 text-emerald-800 font-bold text-[10px] tracking-wider">
                    GOVT MSP
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">
                    {price.season}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{price.cropName}</h4>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="text-base font-black text-emerald-800">
                      {formatCurrency(price.price)}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      / {t('common.quintal')}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Farmer Bank Details Modal */}
      <FarmerBankDetailsModal
        isOpen={isBankModalOpen}
        onClose={() => setIsBankModalOpen(false)}
        bankForm={bankForm}
        setBankForm={setBankForm}
        onSubmit={handleSaveBankDetails}
        isSaving={isSavingBank}
        error={bankError}
        success={bankSuccess}
        bankOptions={POPULAR_INDIAN_BANKS}
        t={t}
      />

      {/* Farmer Photo Full-Size Preview Modal */}
      {previewPhotoUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white rounded-none max-w-sm w-full p-6 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setPreviewPhotoUrl(null)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-none hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 mb-3">
              <span className="w-2.5 h-2.5 rounded-none bg-emerald-500" />
              <h4 className="text-base font-bold text-slate-900">{user?.fullName}</h4>
            </div>
            <div className="w-full aspect-square rounded-none overflow-hidden border border-slate-200 shadow-inner mb-4 bg-slate-100">
              <img src={previewPhotoUrl} alt={user?.fullName} className="w-full h-full object-cover" />
            </div>
            <div className="flex items-center justify-between gap-2">
              <label className="flex-1 py-2.5 rounded-none bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold text-center cursor-pointer transition-all shadow-md flex items-center justify-center gap-1.5">
                <Camera className="w-4 h-4" /> Change Photo
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => {
                    handleDashboardPhotoUpload(e);
                    setPreviewPhotoUrl(null);
                  }}
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={() => setPreviewPhotoUrl(null)}
                className="px-4 py-2.5 rounded-none border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
