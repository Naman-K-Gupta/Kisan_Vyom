import React from 'react';
import { GovernmentSchemeDTO } from '@smart-farmer/shared';
import {
  Clock,
  Sparkles,
  IndianRupee,
  Check,
  AlertCircle,
  FileText,
  ExternalLink,
} from 'lucide-react';

interface SchemeEligibilityInfo {
  eligible: boolean;
  badgeText: string;
  color: string;
  reason: string;
}

interface SchemeStatusInfo {
  label: string;
  isClosing: boolean;
  isNew: boolean;
}

interface SchemeCardProps {
  scheme: GovernmentSchemeDTO;
  eligibility: SchemeEligibilityInfo;
  statusInfo: SchemeStatusInfo;
  categoryLabel: string;
  translatedTitle: string;
  translatedMinistry: string;
  translatedBenefit: string;
  translatedSummary: string;
  onSelect: (scheme: GovernmentSchemeDTO) => void;
  t: (path: string, fallback?: string) => string;
}

/**
 * Clean, humanized card component representing a single Government Policy/Scheme.
 * Preserves exact existing UI design, badges, and layout.
 */
export const SchemeCard: React.FC<SchemeCardProps> = ({
  scheme,
  eligibility,
  statusInfo,
  categoryLabel,
  translatedTitle,
  translatedMinistry,
  translatedBenefit,
  translatedSummary,
  onSelect,
  t,
}) => {
  return (
    <div className="rounded-2xl border border-slate-200/80 bg-gradient-to-b from-white to-slate-50/50 p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group hover:border-emerald-200">
      <div className="space-y-3">
        {/* Top Badges: Category & Application Status */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-800 bg-emerald-50 px-2.5 py-0.5 rounded-lg border border-emerald-100 truncate">
            {categoryLabel}
          </span>
          <span
            className={`text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
              statusInfo.isClosing
                ? 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse'
                : statusInfo.isNew
                ? 'bg-purple-50 text-purple-700 border-purple-200'
                : scheme.status === 'ACTIVE'
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {statusInfo.isClosing && <Clock className="w-2.5 h-2.5" />}
            {statusInfo.isNew && <Sparkles className="w-2.5 h-2.5" />}
            {statusInfo.label}
          </span>
        </div>

        {/* Scheme Title & Ministry */}
        <div>
          <h4 className="text-base font-extrabold text-slate-900 group-hover:text-emerald-700 transition-colors line-clamp-2 leading-snug">
            {translatedTitle}
          </h4>
          <p className="text-[11px] font-medium text-slate-500 mt-1 flex items-center gap-1 truncate">
            <span>🏛️</span>
            <span className="truncate">{translatedMinistry}</span>
          </p>
        </div>

        {/* Highlighted Direct Financial Benefit Box */}
        <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/50 border border-emerald-200/70">
          <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
            {t('schemes.benefitLabel', 'Direct Financial Benefit / Subsidy')}
          </span>
          <p className="text-sm sm:text-base font-black text-emerald-950 mt-0.5 flex items-center gap-1">
            <IndianRupee className="w-4 h-4 text-emerald-700 flex-shrink-0" />
            <span className="truncate">{translatedBenefit}</span>
          </p>
        </div>

        {/* Summary Description */}
        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {translatedSummary}
        </p>

        {/* Automated Farmer Eligibility Matcher */}
        <div className={`p-2.5 rounded-xl border text-xs ${eligibility.color}`}>
          <div className="flex items-center gap-1.5 font-bold">
            {eligibility.eligible ? (
              <Check className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
            )}
            <span className="truncate">{eligibility.badgeText}</span>
          </div>
          <p className="text-[10px] opacity-80 mt-0.5 truncate">{eligibility.reason}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2">
        <button
          type="button"
          onClick={() => onSelect(scheme)}
          className="flex-1 py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-bold transition flex items-center justify-center gap-1.5"
        >
          <FileText className="w-3.5 h-3.5 text-slate-600" />
          <span>{t('schemes.viewGuidelines', 'View Guidelines')}</span>
        </button>

        <a
          href={scheme.applicationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs flex items-center justify-center gap-1 active:scale-95"
        >
          <span>{t('schemes.apply', 'Apply')}</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      </div>
    </div>
  );
};
