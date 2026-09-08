import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { api } from '../../api';
import { User, Camera, Trash2, Lock, Save, BellRing, CheckCircle, AlertCircle } from 'lucide-react';

export const FarmerProfilePage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { showToast } = useNotifications();

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
    sms: user?.notificationPreference?.sms ?? true,
    whatsapp: user?.notificationPreference?.whatsapp ?? false,
    push: user?.notificationPreference?.push ?? true,
  });

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setStatusMessage({ type: 'error', text: 'Only JPG, PNG, and WebP images are allowed.' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setStatusMessage({ type: 'error', text: 'Image file size must be under 5MB.' });
      return;
    }

    const uploadFormData = new FormData();
    uploadFormData.append('picture', file);

    setIsUploadingPhoto(true);
    setStatusMessage(null);

    try {
      await api.farmer.uploadProfilePicture(uploadFormData);
      await refreshUser();
      setStatusMessage({ type: 'success', text: 'Profile picture uploaded.' });
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
          Farmer Profile & Settings
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Manage your personal details, land records, notification channels, and credentials
        </p>
      </div>

      {statusMessage && (
        <div
          className={`p-4 rounded-2xl border text-xs flex items-center gap-2.5 ${
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
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card flex flex-col sm:flex-row items-center gap-6">
        <div className="relative group">
          {user?.farmerProfile?.profilePictureUrl ? (
            <img
              src={user.farmerProfile.profilePictureUrl}
              alt={user.fullName}
              className="w-24 h-24 rounded-full object-cover border-2 border-emerald-500 shadow-md"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-black text-3xl shadow-inner">
              {user?.fullName.charAt(0).toUpperCase()}
            </div>
          )}
          <label className="absolute bottom-0 right-0 p-2 rounded-full bg-emerald-600 text-white hover:bg-emerald-700 shadow-md cursor-pointer transition-all">
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
            <label className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 cursor-pointer inline-flex items-center gap-1.5 transition-colors">
              <Camera className="w-3.5 h-3.5 text-slate-500" />
              {isUploadingPhoto ? 'Uploading...' : 'Change Photo'}
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
                className="px-3 py-1.5 rounded-xl border border-rose-200 hover:bg-rose-50 text-xs font-semibold text-rose-600 inline-flex items-center gap-1.5 transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" /> Remove
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Main Details Form */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card">
        <h3 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100">
          Personal & Land Information
        </h3>

        <form onSubmit={handleProfileSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Full Name
              </label>
              <input
                type="text"
                required
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Total Land Area (Acres)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.landAreaTotal}
                onChange={(e) =>
                  setFormData({ ...formData, landAreaTotal: parseFloat(e.target.value) || 0 })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                State
              </label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                District
              </label>
              <input
                type="text"
                required
                value={formData.district}
                onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Village / Locality
              </label>
              <input
                type="text"
                required
                value={formData.village}
                onChange={(e) => setFormData({ ...formData, village: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Farm Address
            </label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Farming Bio & Notes
            </label>
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              placeholder="e.g. Practicing drip irrigation and zero tillage on alluvial soils."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Notification Preferences */}
          <div className="pt-4 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-3 flex items-center gap-1.5">
              <BellRing className="w-4 h-4 text-emerald-600" /> Notification Channels
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={notifPrefs.inApp}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, inApp: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                In-App
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={notifPrefs.sms}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, sms: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                SMS Alerts
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={notifPrefs.whatsapp}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, whatsapp: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                WhatsApp
              </label>

              <label className="flex items-center gap-2 p-3 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 cursor-pointer hover:bg-slate-50">
                <input
                  type="checkbox"
                  checked={notifPrefs.push}
                  onChange={(e) => setNotifPrefs({ ...notifPrefs, push: e.target.checked })}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                Web Push
              </label>
            </div>
          </div>

          <div className="pt-3">
            <button
              type="submit"
              disabled={isSavingProfile}
              className="px-6 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/20 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSavingProfile ? 'Saving Changes...' : 'Save Profile & Preferences'}
            </button>
          </div>
        </form>
      </div>

      {/* Change Password */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-100 shadow-card">
        <h3 className="text-base font-bold text-slate-900 mb-4 pb-3 border-b border-slate-100 flex items-center gap-2">
          <Lock className="w-4 h-4 text-slate-500" /> Security & Password
        </h3>

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Current Password
            </label>
            <input
              type="password"
              required
              value={passwordData.currentPassword}
              onChange={(e) =>
                setPasswordData({ ...passwordData, currentPassword: e.target.value })
              }
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                New Password
              </label>
              <input
                type="password"
                required
                value={passwordData.newPassword}
                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Confirm Password
              </label>
              <input
                type="password"
                required
                value={passwordData.confirmPassword}
                onChange={(e) =>
                  setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                }
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isChangingPassword}
            className="px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs active:scale-95 transition-all disabled:opacity-50"
          >
            {isChangingPassword ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};
