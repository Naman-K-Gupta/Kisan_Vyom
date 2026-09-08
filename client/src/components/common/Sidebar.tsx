import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard,
  Wheat,
  Building2,
  Clock,
  BadgePercent,
  Sparkles,
  User,
  Users,
  ShieldCheck,
  AlertTriangle,
  History,
  Scale,
} from 'lucide-react';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuth();

  const farmerNavItems = [
    { label: 'Dashboard', path: '/farmer/dashboard', icon: LayoutDashboard },
    { label: 'My Crops', path: '/farmer/crops', icon: Wheat },
    { label: 'Procurement Centres', path: '/farmer/centres', icon: Building2 },
    { label: 'Live Queue Tracker', path: '/farmer/queue', icon: Clock },
    { label: 'MSP & Mandi Prices', path: '/farmer/prices', icon: BadgePercent },
    { label: 'AI Farm Advisor', path: '/farmer/ai', icon: Sparkles },
    { label: 'Farmer Profile', path: '/farmer/profile', icon: User },
  ];

  const managerNavItems = [
    { label: 'Queue Operations Desk', path: '/manager/dashboard', icon: LayoutDashboard },
    { label: 'Capacity & Processing Rate', path: '/manager/capacity', icon: Scale },
  ];

  const adminNavItems = [
    { label: 'Overview & Analytics', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'Farmers Directory', path: '/admin/farmers', icon: Users },
    { label: 'Procurement Centres', path: '/admin/centres', icon: Building2 },
    { label: 'MSP Price Master', path: '/admin/msp', icon: BadgePercent },
    { label: 'System Alerts', path: '/admin/alerts', icon: AlertTriangle },
    { label: 'Audit Compliance Logs', path: '/admin/audit-logs', icon: History },
  ];

  let items = farmerNavItems;
  if (user?.role === 'PROCUREMENT_CENTRE_MANAGER') items = managerNavItems;
  if (user?.role === 'ADMIN') items = adminNavItems;

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
            {user?.role ? user.role.replace(/_/g, ' ') : 'Navigation'}
          </div>

          {items.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-all ${
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
          <div className="rounded-xl bg-slate-50 p-3 border border-slate-200/50">
            <p className="text-[11px] font-semibold text-slate-800">Kisan Call Centre</p>
            <p className="text-[10px] text-slate-500 mt-0.5">Toll-free advisory: 1800-180-1551</p>
          </div>
        </div>
      </aside>
    </>
  );
};
