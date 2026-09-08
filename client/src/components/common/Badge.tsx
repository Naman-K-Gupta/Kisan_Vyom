import React from 'react';

interface BadgeProps {
  status: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  const getColors = () => {
    switch (status) {
      case 'OPEN':
      case 'COMPLETED':
      case 'ACTIVE':
      case 'IRRIGATE_NOW':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'WAITING':
      case 'BUSY':
      case 'MEDIUM':
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      case 'CALLED':
      case 'PROCESSING':
      case 'HIGH':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'FULL':
      case 'CLOSED':
      case 'CRITICAL':
      case 'CANCELLED':
      case 'SKIPPED':
      case 'INACTIVE':
      case 'REJECTED':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'TEMPORARILY_UNAVAILABLE':
        return 'bg-slate-100 text-slate-700 border-slate-200';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  const formatText = (text: string) => {
    return text.replace(/_/g, ' ');
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getColors()} ${className}`}
    >
      {formatText(status)}
    </span>
  );
};
