import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { api } from '../../api';
import { compressProfileImage } from '../../utils/imageCompressor';
import { User, Camera, Trash2, Lock, Save, BellRing, CheckCircle, AlertCircle, ExternalLink, Send, RefreshCw } from 'lucide-react';

export const FarmerProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useNotifications();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    fullName: user?.fullName || '',
    state: user?.state || '',
    district: user?.district || '',
    village: user?.village || '',
    address: user?.address || '',
    preferredLanguage: user?.preferredLanguage || 'hi',
    bio: user?.farmerProfile?.bio || '',
    landAreaTotal: user?.farmerProfile?.landAreaTotal || 0,
  });

  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [notifPrefs, setNotifPrefs] = useState({
    inApp: user?.notificationPreference?.inApp ?? true,
    push: user?.notificationPreference?.push ?? true,
  });

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoLoadError, setPhotoLoadError] = useState(false);
  const [isSendingTelegram, setIsSendingTelegram] = useState(false);

  useEffect(() => {
    setPhotoLoadError(false);
  }, [user?.farmerProfile?.profilePictureUrl]);
  const [telegramInfo, setTelegramInfo] = useState<{
    isLinked: boolean;
    botUsername: string;
    deepLink: string;
    chatId: string | null;
    username: string | null;
    firstName: string | null;
    mobile: string;
  } | null>(null);
  const [isCheckingTelegram, setIsCheckingTelegram] = useState(false);
  const [manualChatId, setManualChatId] = useState('');
  const [showManualInput, setShowManualInput] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchTelegramStatus = async () => {
    setIsCheckingTelegram(true);
    try {
      const res = await api.notifications.getTelegramStatus();
      if (res.data.success) {
        setTelegramInfo(res.data);
      }
    } catch (e) {
      // ignore
    } finally {
      setIsCheckingTelegram(false);
    }
  };

  useEffect(() => {
    fetchTelegramStatus();
  }, []);

  const handleManualLink = async () => {
    if (!manualChatId.trim()) return;
    try {
      const res = await api.notifications.linkTelegram(manualChatId.trim());
      if (res.data.success) {
        showToast('Telegram Linked', 'Your Telegram chat ID has been linked successfully!', 'success');
        fetchTelegramStatus();
        setShowManualInput(false);
        setManualChatId('');
      }
    } catch (err: any) {
      showToast('Linking Error', err.response?.data?.message || 'Could not link Telegram', 'error');
    }
  };

  const handleSendTestTelegram = async () => {
    setIsSendingTelegram(true);
    try {
      const res = await api.notifications.sendTestTelegram();
      if (res.data.success) {
        showToast('Telegram Sent', res.data.message || 'Test alert delivered successfully to your Telegram app!', 'success');
        fetchTelegramStatus();
      }
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Please connect your account to @Kisan_kendra_bot';
      showToast('Telegram Notice', msg, 'warning');
      if (err.response?.data?.notLinked && err.response?.data?.deepLink) {
        window.open(err.response.data.deepLink, '_blank');
      }
    } finally {
      setIsSendingTelegram(false);
    }
  };


  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    setStatusMessage(null);

    try {
      await api.farmer.updateProfile(formData);
      await api.farmer.updateNotificationPreferences(notifPrefs);
      await refreshUser();
      setStatusMessage({ type: 'success', text: 'Profile and preferences updated successfully.' });
      showToast('Profile Updated', 'Your farm details were saved successfully.', 'success');
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to update profile.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setStatusMessage({ type: 'error', text: 'New passwords do not match.' });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setStatusMessage({ type: 'error', text: 'Password must be at least 6 characters.' });
      return;
    }

    setIsChangingPassword(true);
    setStatusMessage(null);

    try {
      await api.auth.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setStatusMessage({ type: 'success', text: 'Password changed successfully.' });
      showToast('Security Updated', 'Your password was changed.', 'success');
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to change password.',
      });
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setStatusMessage({ type: 'error', text: 'Only image files (JPG, PNG, WebP) are allowed.' });
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setStatusMessage({ type: 'error', text: 'Image file size must be under 10MB.' });
      return;
    }

    setIsUploadingPhoto(true);
    setStatusMessage(null);

    try {
      // Compress avatar to 400x400 JPEG (~40-60KB) for lightweight database persistence
      const compressedFile = await compressProfileImage(file, 400, 400, 0.85);

      const uploadFormData = new FormData();
      uploadFormData.append('picture', compressedFile);
      uploadFormData.append('photo', compressedFile);

      await api.farmer.uploadProfilePicture(uploadFormData);
      setPhotoLoadError(false);
      await refreshUser();
      setStatusMessage({ type: 'success', text: 'Profile picture uploaded successfully.' });
      showToast('Photo Uploaded', 'Your profile picture has been updated.', 'success');
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.response?.data?.message || 'Failed to upload image.',
      });
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleDeletePhoto = async () => {
    try {
      await api.farmer.deleteProfilePicture();
      await refreshUser();
      showToast('Photo Removed', 'Profile picture has been cleared.', 'info');
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {t('profile.pageTitle')}
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          {t('profile.pageSubtitle')}
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-none border text-xs flex items-center gap-2.5 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-rose-50 border-rose-200 text-rose-800'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Profile Photo Section */}
      <div className="bg-white rounded-none p-6 sm:p-8 border border-slate-100 shadow-card flex flex-col sm:flex-row items-center gap-6">
        <div className="relative group">
          {user?.farmerProfile?.profilePictureUrl && !photoLoadError ? (
            <img
              src={user.farmerProfile.profilePictureUrl}
              alt={user.fullName}
              onError={() => setPhotoLoadError(true)}
              className="w-24 h-24 rounded-none object-cover border-2 border-emerald-500 shadow-md"
            />
          ) : (
            <div className="w-24 h-24 rounded-none bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-3xl shadow-inner">
              {user?.fullName.charAt(0).toUpperCase()}
            </div>
          )}
          <label className="absolute bottom-0 right-0 p-2 rounded-none bg-emerald-600 text-white hover:bg-emerald-700 shadow-md cursor-pointer transition-all">
            <Camera className="w-4 h-4" />
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhotoUpload}
              className="hidden"
              disabled={isUploadingPhoto}
            />
          </label>
        </div>

        <div className="text-center sm:text-left flex-1">
          <h3 className="text-lg font-bold text-slate-900">{user?.fullName}</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            {user?.village}, {user?.district}, {user?.state}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">
            Mobile: +91 {user?.mobile} • Email: {user?.email}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2 justify-center sm:justify-start">
            <label className="px-3 py-1.5 rounded-none border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer inline-flex items-center gap-1.5 transition-colors">
              <Camera className="w-3.5 h-3.5 text-slate-500" />
              {isUploadingPhoto ? t('profile.uploading') : t('profile.changePhoto')}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={isUploadingPhoto}
              />
            </label>
            {user?.farmerProfile?.profilePictureUrl && (
              <button
                type="button"
                onClick={handleDeletePhoto}
                className="px-3 py-1.5 rounded-none border border-rose-200 hover:bg-rose-50 text-xs font-semibold text-rose-600 inline-flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> {t('profile.removePhoto')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Details Form */}
      <div className="bg-white rounded-none p-6 sm:p-8 border border-slate-100 shadow-card">
        <h3 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
          {t('profile.personalLandInfo')}
        </h3>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('profile.fullName')}
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-none border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('profile.totalLandAcres')}
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.landAreaTotal}
                onChange={(e) =>
                  setFormData({ ...formData, landAreaTotal: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2.5 rounded-none border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('profile.state')}
              </label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-none border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('profile.district')}
              </label>
              <input
                type="text"
                required
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-none border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('profile.villageLocality')}
              </label>
              <input
                type="text"
                required
                value={formData.village}
                onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-none border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('profile.farmAddress')}
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-none border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('profile.bio')}
            </label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder={t('profile.farmingBioPlaceholder')}
              className="w-full px-3.5 py-2.5 rounded-none border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Notification Preferences */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <BellRing className="w-4 h-4 text-emerald-600" /> {t('profile.notificationChannels')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2.5 p-3 rounded-none border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={notifPrefs.inApp}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, inApp: e.target.checked })}
                  className="rounded-none text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <p className="font-bold text-slate-800">{t('profile.inApp')} (Dashboard)</p>
                  <p className="text-[11px] text-slate-500 font-normal">Real-time alerts, token queue updates, and popups on your web screen.</p>
                </div>
              </label>

              <label className="flex items-center gap-2.5 p-3 rounded-none border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={notifPrefs.push}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, push: e.target.checked })}
                  className="rounded-none text-emerald-600 focus:ring-emerald-500"
                />
                <div>
                  <p className="font-bold text-slate-800">{t('profile.webPush')} (Browser Alerts)</p>
                  <p className="text-[11px] text-slate-500 font-normal">Browser background notifications when you are away from the portal.</p>
                </div>
              </label>
            </div>

            {/* Telegram Notifications Integration */}
            <div className="mt-3 p-4 rounded-none bg-gradient-to-r from-sky-50 via-indigo-50 to-sky-100/50 border border-sky-200/80 shadow-sm text-xs space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start sm:items-center gap-3">
                  <div className="w-10 h-10 rounded-none bg-[#229ED9] text-white flex items-center justify-center flex-shrink-0 shadow-sm">
                    <Send className="w-5 h-5 -rotate-45 -translate-y-0.5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-sky-950 text-sm">Telegram Mandi Alerts</p>
                      {telegramInfo?.isLinked ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-[10px] bg-emerald-100 text-emerald-800 font-bold border border-emerald-300">
                          <span className="w-1.5 h-1.5 rounded-none bg-emerald-500 animate-pulse"></span>
                          Connected
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-none text-[10px] bg-amber-100 text-amber-800 font-bold border border-amber-300">
                          Not Connected
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={fetchTelegramStatus}
                        disabled={isCheckingTelegram}
                        title="Refresh status"
                        className="text-slate-400 hover:text-slate-600 p-0.5"
                      >
                        <RefreshCw className={`w-3 h-3 ${isCheckingTelegram ? 'animate-spin' : ''}`} />
                      </button>
                    </div>
                    <p className="text-sky-900 text-[11px] mt-0.5">
                      Receive instant Queue Token calls, Gate Passes, Weighment Slips, and MSP alerts directly on your phone via Telegram.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  {telegramInfo?.isLinked ? (
                    <button
                      type="button"
                      onClick={handleSendTestTelegram}
                      disabled={isSendingTelegram}
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-none bg-[#229ED9] hover:bg-[#1d87ba] active:scale-95 text-white font-bold text-xs transition shadow-sm disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5 -rotate-45" />
                      <span>{isSendingTelegram ? 'Sending Alert...' : 'Send Test Alert'}</span>
                    </button>
                  ) : (
                    <a
                      href={telegramInfo?.deepLink || `https://t.me/Kisan_kendra_bot?start=${user?.mobile || ''}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-none bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs transition shadow-sm"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Connect Telegram</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Status and Details Bar */}
              {telegramInfo?.isLinked ? (
                <div className="p-2.5 rounded-none bg-emerald-50 border border-emerald-200/80 flex items-center justify-between gap-2 text-emerald-900 text-[11px]">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                    <span>
                      Linked to Chat ID <strong>#{telegramInfo.chatId}</strong> for Mobile <strong>+91 {telegramInfo.mobile || user?.mobile}</strong>
                    </span>
                  </div>
                  <a
                    href="https://t.me/Kisan_kendra_bot"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1 flex-shrink-0"
                  >
                    Open Bot <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ) : (
                <div className="p-2.5 rounded-none bg-amber-50/90 border border-amber-200/80 space-y-2 text-[11px] text-amber-900">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold">How to receive Mandi alerts on Telegram:</p>
                      <p className="text-amber-800 text-[10.5px]">
                        1. Tap <strong>Connect Telegram</strong> above to open <strong>@Kisan_kendra_bot</strong>.
                        <br />
                        2. Tap <strong>START</strong> in Telegram to auto-link your mobile number (+91 {user?.mobile}).
                        <br />
                        3. All tokens, turn announcements, and DBT payments will automatically arrive on your phone!
                      </p>
                    </div>
                  </div>

                  {!showManualInput ? (
                    <button
                      type="button"
                      onClick={() => setShowManualInput(true)}
                      className="text-[10px] text-sky-700 hover:underline font-semibold"
                    >
                      Know your Telegram Chat ID? Click here to link manually
                    </button>
                  ) : (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Enter your personal Telegram User ID (e.g. 5839210492)"
                          value={manualChatId}
                          onChange={(e) => setManualChatId(e.target.value)}
                          className="px-2.5 py-1.5 rounded-none border border-sky-300 bg-white text-xs flex-1 outline-none focus:ring-1 focus:ring-sky-500"
                        />
                        <button
                          type="button"
                          onClick={handleManualLink}
                          className="px-3 py-1.5 rounded-none bg-sky-600 text-white font-bold text-xs hover:bg-sky-700"
                        >
                          Link
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowManualInput(false)}
                          className="px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700"
                        >
                          Cancel
                        </button>
                      </div>
                      <p className="text-[10px] text-amber-800">
                        <strong>Note:</strong> Do not enter the bot token/ID (<code className="bg-amber-100 px-1 rounded-none">8927569233</code>). Enter your personal user ID (check with <a href="https://t.me/userinfobot" target="_blank" rel="noopener noreferrer" className="underline font-bold">@userinfobot</a>) or simply tap the green <strong>"Connect Telegram"</strong> button above to pair with 1 tap.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-6 py-3 rounded-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSavingProfile ? t('profile.saving') : t('profile.saveProfileBtn')}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-none p-6 sm:p-8 border border-slate-100 shadow-card">
        <h3 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-500" /> {t('profile.securityPassword')}
        </h3>

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              {t('profile.currentPassword')}
            </label>
            <input
              type="password"
              required
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, currentPassword: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-none border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('profile.newPassword')}
              </label>
              <input
                type="password"
                required
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-none border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                {t('profile.confirmPassword')}
              </label>
              <input
                type="password"
                required
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-none border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isChangingPassword}
            className="px-6 py-2.5 rounded-none bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs active:scale-95 transition-all disabled:opacity-50"
          >
            {isChangingPassword ? t('profile.saving') : t('profile.updatePasswordBtn')}
          </button>
        </form>
      </div>
    </div>
  );
};
