import React from 'react';
import { useNotifications } from '../../contexts/NotificationContext';
import { X, MessageSquare } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useNotifications();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none px-2 sm:px-0">
      {toasts.map((toast) => {
        let senderTag = 'VK-GOVMSP';
        let displayMessage = toast.message;
        if (displayMessage.startsWith('[') && displayMessage.includes(']')) {
          const match = displayMessage.match(/^\[(.*?)\]\s*/);
          if (match) {
            senderTag = match[1];
            displayMessage = displayMessage.slice(match[0].length);
          }
        }

        return (
          <div
            key={toast.id}
            className="pointer-events-auto bg-white border-2 border-slate-900 rounded-none shadow-2xl p-3 flex flex-col gap-2 transition-all duration-300 animate-slide-up"
          >
            {/* SMS Header */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-1.5">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-[10px] font-black tracking-wider bg-slate-900 text-white px-1.5 py-0.5 rounded-none uppercase">
                  {senderTag}
                </span>
                <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <MessageSquare className="w-2.5 h-2.5 text-emerald-600" />
                  SMS Alert • now
                </span>
              </div>
              <button
                onClick={() => dismissToast(toast.id)}
                className="text-slate-400 hover:text-slate-700 p-0.5 rounded-none transition-colors"
                title="Dismiss SMS"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* SMS Message Body */}
            <div className="bg-slate-50 border border-slate-200/80 p-2.5 rounded-none">
              <p className="font-sans text-xs text-slate-800 leading-relaxed font-normal select-text whitespace-pre-line">
                {displayMessage}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
