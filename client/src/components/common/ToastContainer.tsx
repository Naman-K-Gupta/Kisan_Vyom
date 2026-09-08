import React from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { X, CheckCircle, AlertCircle, Info, Bell } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useNotifications();

  if (toasts.length === 0) return null;

  const getIcon = (type?: string) => {
    switch (type) {
      case 'TOKEN_CALLED':
      case 'TURN_APPROACHING':
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'warning':
      case 'AGRICULTURAL_ALERT':
        return <AlertCircle className="w-5 h-5 text-amber-500" />;
      case 'TOKEN_CANCELLED':
      case 'TOKEN_SKIPPED':
      case 'error':
        return <AlertCircle className="w-5 h-5 text-rose-500" />;
      default:
        return <Bell className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-white border border-slate-200/80 rounded-2xl shadow-xl p-4 flex items-start gap-3 transition-all duration-300 animate-slide-up"
        >
          <div className="mt-0.5">{getIcon(toast.type)}</div>
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-semibold text-slate-900 leading-snug">{toast.title}</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">{toast.message}</p>
          </div>
          <button
            onClick={() => dismissToast(toast.id)}
            className="text-slate-400 hover:text-slate-600 p-1"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};
