import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import {
  LayoutDashboard,
  Building2,
  Clock,
  BadgePercent,
  Sparkles,
  User,
  Users,
  AlertTriangle,
  History,
  Scale,
  IndianRupee,
  FileText,
  Landmark,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();
  const { t } = useLanguage();

  const farmerNavItems = [
    { label: t('nav.dashboard'), path: '/farmer/dashboard', icon: LayoutDashboard },
    { label: t('nav.centres'), path: '/farmer/centres', icon: Building2 },
    { label: t('nav.queue'), path: '/farmer/queue', icon: Clock },
    { label: t('nav.prices'), path: '/farmer/prices', icon: BadgePercent },
    { label: t('nav.payments') || 'Payments (DBT)', path: '/farmer/payments', icon: IndianRupee },
    { label: t('nav.schemes', 'Govt Policies & Schemes'), path: '/farmer/schemes', icon: Landmark },
    { label: t('nav.ai'), path: '/farmer/ai', icon: Sparkles },
    { label: t('nav.profile'), path: '/farmer/profile', icon: User },
  ];

  const managerNavItems = [
    { label: t('nav.managerDesk'), path: '/manager/dashboard', icon: LayoutDashboard },
    { label: t('nav.capacityRate'), path: '/manager/capacity', icon: Scale },
  ];

  const adminNavItems = [
    { label: t('nav.adminOverview'), path: '/admin/dashboard', icon: LayoutDashboard },
    { label: t('nav.procurementRecords', 'Procurement Records'), path: '/admin/procurement-records', icon: FileText },
    { label: t('nav.schemes', 'Govt Policies & Schemes'), path: '/admin/schemes', icon: Landmark },
    { label: t('nav.farmersDirectory'), path: '/admin/farmers', icon: Users },
    { label: t('nav.centres'), path: '/admin/centres', icon: Building2 },
    { label: t('nav.mspMaster'), path: '/admin/msp', icon: BadgePercent },
    { label: t('nav.alerts'), path: '/admin/alerts', icon: AlertTriangle },
    { label: t('nav.auditLogs'), path: '/admin/audit-logs', icon: History },
  ];

  let items = farmerNavItems;
  if (user?.role === 'PROCUREMENT_CENTRE_MANAGER') items = managerNavItems;
  if (user?.role === 'ADMIN') items = adminNavItems;

  const getRoleHeader = () => {
    if (user?.role === 'ADMIN') return t('roles.admin');
    if (user?.role === 'PROCUREMENT_CENTRE_MANAGER') return t('roles.manager');
    return t('roles.farmer');
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/30 backdrop-blur-sm z-30 lg:hidden"
        />
      )}

      <aside
        className={`fixed top-16 bottom-0 left-0 z-30 w-64 bg-white border-r border-slate-100 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex-1 py-6 px-4 space-y-1.5 overflow-y-auto">
          <div className="px-3 pb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {getRoleHeader()}
          </div>

          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-none text-xs font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-50 text-emerald-700 shadow-sm shadow-emerald-500/10'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  }`
                }
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </div>

        {/* Footer Support Info */}
        <div className="p-4 border-t border-slate-100">
          <div className="rounded-none bg-slate-50 p-3 border border-slate-200/50">
            <p className="text-[11px] font-semibold text-slate-800">{t('nav.kisanCallCentre')}</p>
            <p className="text-[10px] text-slate-500 mt-0.5">{t('nav.tollFree')}</p>
          </div>
        </div>
      </aside>
    </>
  );
};
