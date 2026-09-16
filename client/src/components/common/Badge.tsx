import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

interface BadgeProps {
  status: string;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({ status, className = '' }) => {
  const { t } = useLanguage();

  const getColors = () => {
    switch (status) {
      case 'OPEN':
      case 'COMPLETED':
      case 'ACTIVE':
      case 'PAID':
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

  const getTranslatedText = (rawStatus: string) => {
    switch (rawStatus.toUpperCase()) {
      case 'OPEN':
        return t('status.open', 'Open');
      case 'BUSY':
        return t('status.busy', 'Busy');
      case 'FULL':
        return t('status.full', 'Full');
      case 'CLOSED':
        return t('status.closed', 'Closed');
      case 'WAITING':
        return t('status.waiting', 'Waiting');
      case 'CALLED':
        return t('status.called', 'Called');
      case 'PROCESSING':
        return t('status.processing', 'Processing');
      case 'COMPLETED':
        return t('status.completed', 'Completed');
      case 'CANCELLED':
        return t('status.cancelled', 'Cancelled');
      case 'SKIPPED':
        return t('status.skipped', 'Skipped');
      case 'PAID':
        return t('status.paid', 'Paid');
      case 'PENDING':
        return t('status.pending', 'Pending');
      case 'ACTIVE':
        return t('status.active', 'Active');
      case 'INACTIVE':
        return t('status.inactive', 'Inactive');
      case 'SOWN':
        return t('status.sown', 'Sown');
      case 'GROWING':
        return t('status.growing', 'Growing');
      case 'READY':
      case 'HARVEST_READY':
        return t('status.harvestReady', 'Harvest Ready');
      case 'HARVESTED':
        return t('status.harvested', 'Harvested');
      case 'CRITICAL':
        return t('status.critical', 'Critical');
      case 'HIGH':
        return t('status.high', 'High');
      case 'MEDIUM':
        return t('status.medium', 'Medium');
      case 'LOW':
        return t('status.low', 'Low');
      case 'IRRIGATE_NOW':
        return t('status.irrigateNow', 'Irrigate Now');
      default:
        return rawStatus.replace(/_/g, ' ');
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${getColors()} ${className}`}
    >
      {getTranslatedText(status)}
    </span>
  );
};
