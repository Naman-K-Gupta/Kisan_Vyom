import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNotifications } from '../../contexts/NotificationContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { LanguageSwitcher } from './LanguageSwitcher';
import {
  Sprout,
  Bell,
  LogOut,
  User,
  CheckCheck,
  Menu,
  X,
  CloudSun,
  Shield,
  Briefcase,
  MessageSquare,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Logo } from './Logo';

interface NavbarProps {
  onToggleSidebar?: () => void;
  isSidebarOpen?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ onToggleSidebar, isSidebarOpen }) => {
  const { user, logout } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications();
  const { t } = useLanguage();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const getRoleBadge = () => {
    switch (user?.role) {
      case 'ADMIN':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
            <Shield className="w-3 h-3" /> {t('roles.admin')}
          </span>
        );
      case 'PROCUREMENT_CENTRE_MANAGER':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
            <Briefcase className="w-3 h-3" /> {t('roles.manager')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-none text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <Sprout className="w-3 h-3" /> {t('roles.farmer')}
          </span>
        );
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-100 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left: Mobile Toggle & Brand */}
        <div className="flex items-center gap-3">
          {onToggleSidebar && (
            <button
              onClick={onToggleSidebar}
              className="lg:hidden p-2 rounded-none text-slate-500 hover:bg-slate-100 active:scale-95 transition-all"
            >
              {isSidebarOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          )}

          <Link to="/" className="flex items-center group">
            <Logo size="md" />
          </Link>
        </div>

        {/* Right: Actions, Weather, Notifications, Profile */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* Location / Weather Pill */}
          {user && (
            <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-none bg-slate-50 border border-slate-200/60 text-xs text-slate-600">
              <CloudSun className="w-4 h-4 text-amber-500" />
              <span className="font-medium">{user.district || 'Karnal'}, {user.state || 'Haryana'}</span>
            </div>
          )}

          {/* Role Badge */}
          {user && <div className="hidden sm:block">{getRoleBadge()}</div>}

          {/* Notifications Bell */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 rounded-none text-slate-600 hover:bg-slate-100 transition-colors"
                title={t('nav.notifications')}
              >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-5 h-5 rounded-none bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Notification Dropdown */}
              {showNotifications && (
                <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-none shadow-2xl border-2 border-slate-900 p-4 z-50 animate-fade-in">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                    <div className="flex items-center gap-2">
                      <h4 className="font-bold text-sm text-slate-900">{t('nav.notifications')}</h4>
                      <span className="font-mono text-[10px] font-bold px-1.5 py-0.5 bg-slate-100 text-slate-700 border border-slate-300 uppercase">
                        SMS Inbox
                      </span>
                      {unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-none text-[10px] font-bold bg-emerald-600 text-white">
                          {unreadCount} NEW
                        </span>
                      )}
                    </div>
                    {unreadCount > 0 && (
                      <button
                        onClick={markAllAsRead}
                        className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                      >
                        <CheckCheck className="w-3.5 h-3.5" /> {t('nav.markAllRead')}
                      </button>
                    )}
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 my-2">
                    {notifications.length === 0 ? (
                      <div className="text-center py-8 text-xs text-slate-500 flex flex-col items-center gap-2">
                        <MessageSquare className="w-8 h-8 text-slate-300" />
                        <span>{t('nav.noNotifications')}</span>
                      </div>
                    ) : (
                      notifications.slice(0, 15).map((n) => {
                        let senderTag = 'VK-GOVMSP';
                        let smsBody = n.message;
                        if (smsBody.startsWith('[') && smsBody.includes(']')) {
                          const match = smsBody.match(/^\[(.*?)\]\s*/);
                          if (match) {
                            senderTag = match[1];
                            smsBody = smsBody.slice(match[0].length);
                          }
                        }

                        return (
                          <div
                            key={n.id}
                            onClick={() => !n.isRead && markAsRead(n.id)}
                            className={`p-3 rounded-none cursor-pointer transition-all ${
                              n.isRead ? 'bg-white hover:bg-slate-50 opacity-80' : 'bg-emerald-50/40 hover:bg-emerald-50/70 border-l-2 border-emerald-600'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2 mb-1.5">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-[9px] font-black tracking-wider bg-slate-900 text-white px-1.5 py-0.5 rounded-none uppercase">
                                  {senderTag}
                                </span>
                                <span className="text-[10px] font-medium text-slate-500">
                                  {new Date(n.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              </div>
                              {!n.isRead && (
                                <span className="w-1.5 h-1.5 rounded-none bg-emerald-600" />
                              )}
                            </div>

                            {/* SMS Message Body Bubble */}
                            <div className="bg-slate-50 border border-slate-200/90 p-2 text-xs text-slate-800 leading-relaxed font-sans select-text whitespace-pre-line">
                              {smsBody}
                            </div>

                            <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                              <span className="text-[9px] font-medium text-slate-400 uppercase tracking-wider">
                                Official APMC SMS
                              </span>
                              {(() => {
                                try {
                                  const meta = n.metadata ? (typeof n.metadata === 'string' ? JSON.parse(n.metadata) : n.metadata) : null;
                                  const waUrl = meta?.whatsappUrl || (user?.mobile ? `https://wa.me/91${user.mobile.replace(/\D/g, '')}?text=${encodeURIComponent(n.message)}` : null);
                                  if (waUrl) {
                                    return (
                                      <a
                                        href={waUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={(e) => e.stopPropagation()}
                                        className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 hover:text-emerald-800 bg-white px-1.5 py-0.5 rounded-none border border-slate-200"
                                      >
                                        <MessageSquare className="w-3 h-3" /> WhatsApp
                                      </a>
                                    );
                                  }
                                } catch (e) {
                                  return null;
                                }
                                return null;
                              })()}
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Profile / Menu */}
          {user ? (
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center gap-2 p-1.5 rounded-none hover:bg-slate-100 transition-colors"
              >
                {user.farmerProfile?.profilePictureUrl ? (
                  <img
                    src={user.farmerProfile.profilePictureUrl}
                    alt={user.fullName}
                    className="w-8 h-8 rounded-none object-cover border border-slate-200"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-none bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    {user.fullName.charAt(0).toUpperCase()}
                  </div>
                )}
                <span className="text-xs font-semibold text-slate-800 hidden md:block max-w-[120px] truncate">
                  {user.fullName}
                </span>
              </button>

              {/* Profile dropdown */}
              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-none shadow-xl border border-slate-100 py-2 z-50 animate-fade-in">
                  <div className="px-4 py-2 border-b border-slate-50">
                    <p className="text-xs font-bold text-slate-900 truncate">{user.fullName}</p>
                    <p className="text-[11px] text-slate-400 truncate">{user.mobile}</p>
                  </div>
                  <Link
                    to={user.role === 'FARMER' ? '/farmer/profile' : '#'}
                    onClick={() => setShowUserMenu(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <User className="w-4 h-4" /> {t('nav.profileSettings')}
                  </Link>
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      logout();
                    }}
                    className="w-full flex items-center gap-2 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> {t('nav.signOut')}
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                to="/login"
                className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-emerald-700 rounded-none transition-colors"
              >
                {t('nav.signIn')}
              </Link>
              <Link
                to="/register"
                className="px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-none transition-all shadow-sm shadow-emerald-600/20 active:scale-95"
              >
                {t('nav.register')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
