import React from 'react';
import { GovernmentSchemeDTO } from '@smart-farmer/shared';
import {
  X,
  IndianRupee,
  BookOpen,
  ShieldCheck,
  FileText,
  CheckCircle2,
  ExternalLink,
  Landmark,
  Check,
} from 'lucide-react';

interface SchemeDetailsModalProps {
  scheme: GovernmentSchemeDTO | null;
  onClose: () => void;
  categoryLabel: string;
  statusLabel: string;
  translatedTitle: string;
  translatedMinistry: string;
  translatedBenefit: string;
  translatedSummary: string;
  translatedEligibility: string;
  translatedDetails: string;
  t: (path: string, fallback?: string) => string;
  language: string;
}

/**
 * Modal displaying full government circular details, landholding caps, and documentation checklist.
 */
export const SchemeDetailsModal: React.FC<SchemeDetailsModalProps> = ({
  scheme,
  onClose,
  categoryLabel,
  statusLabel,
  translatedTitle,
  translatedMinistry,
  translatedBenefit,
  translatedSummary,
  translatedEligibility,
  translatedDetails,
  t,
  language,
}) => {
  if (!scheme) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-none shadow-2xl border border-slate-100 overflow-hidden animate-scale-up my-8">
        {/* Modal Header Banner */}
        <div className="p-6 bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 text-white relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-none bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-none text-[10px] font-black uppercase tracking-wider bg-emerald-500/30 text-emerald-200 border border-emerald-400/30">
              {categoryLabel}
            </span>
            <span className="px-2.5 py-0.5 rounded-none text-[10px] font-black uppercase tracking-wider bg-white/20 text-white">
              {statusLabel}
            </span>
          </div>

          <h3 className="text-xl sm:text-2xl font-black text-white leading-tight">
            {translatedTitle}
          </h3>
          <p className="text-xs text-emerald-200 mt-1 flex items-center gap-1.5">
            <Landmark className="w-3.5 h-3.5 inline text-emerald-200" /> {translatedMinistry}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
          {/* Financial Benefit Banner */}
          <div className="p-4 rounded-none bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100/60 border border-emerald-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">
                {t('schemes.benefitLabel', 'Approved Government Benefit / Direct Support')}
              </span>
              <p className="text-lg font-black text-emerald-950 mt-0.5 flex items-center gap-1">
                <IndianRupee className="w-5 h-5 text-emerald-700" />
                {translatedBenefit}
              </p>
            </div>
            {scheme.deadlineDate ? (
              <div className="sm:text-right bg-white/80 px-3 py-1.5 rounded-none border border-emerald-100">
                <span className="text-[10px] font-bold text-slate-500 uppercase block">
                  {t('schemes.lastDate', 'Application Deadline')}
                </span>
                <span className="text-xs font-extrabold text-slate-800">
                  {new Date(scheme.deadlineDate).toLocaleDateString(
                    language === 'pa' ? 'pa-IN' : language === 'hi' ? 'hi-IN' : 'en-IN',
                    {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    }
                  )}
                </span>
              </div>
            ) : (
              <div className="sm:text-right bg-white/80 px-3 py-1.5 rounded-none border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-600 uppercase block">
                  {t('schemes.noDeadline', 'Open Ongoing Scheme')}
                </span>
              </div>
            )}
          </div>

          {/* Key Eligibility Highlights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-none bg-slate-50 border border-slate-100">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                {t('schemes.exceedsLand', 'Land Limit')}
              </span>
              <p className="text-xs font-bold text-slate-800 mt-1">
                {scheme.maxLandAcreage
                  ? `≤ ${scheme.maxLandAcreage} ${t('common.acres', 'Acres')}`
                  : t('schemes.universalEligibility', 'Universal')}
              </p>
            </div>

            <div className="p-3.5 rounded-none bg-slate-50 border border-slate-100 sm:col-span-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                {t('schemes.applicableGeography', 'Applicable Geographic States')}
              </span>
              <p className="text-xs font-bold text-slate-800 mt-1 truncate">
                {Array.isArray(scheme.applicableStates)
                  ? scheme.applicableStates.join(', ')
                  : scheme.applicableStates === 'ALL'
                  ? t('schemes.allIndia', 'Pan-India (All States & UTs)')
                  : scheme.applicableStates}
              </p>
            </div>
          </div>

          {/* Detailed Guidelines & Operational Info */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-emerald-600" />{' '}
              {t('schemes.guidelinesTitle', 'Policy Summary & Objectives')}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3.5 rounded-none border border-slate-100">
              {translatedSummary}
            </p>
          </div>

          <div className="space-y-2">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />{' '}
              {t('schemes.eligibilityReqs', 'Eligibility Criteria & Framework')}
            </h4>
            <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3.5 rounded-none border border-slate-100">
              {translatedEligibility}
            </p>
          </div>

          {translatedDetails && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />{' '}
                {t('common.details', 'Operational Guidelines')}
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/70 p-3.5 rounded-none border border-slate-100">
                {translatedDetails}
              </p>
            </div>
          )}

          {/* Verified Document Checklist */}
          <div className="space-y-2.5">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />{' '}
              {t('schemes.eligibilityReqs', 'Mandatory Document Checklist for Application')}
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-700">
              <div className="flex items-center gap-2 p-2.5 rounded-none bg-slate-50 border border-slate-100">
                <span className="w-4 h-4 rounded-none bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5" />
                </span>
                <span>Aadhaar Card (Mobile & Bank linked)</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-none bg-slate-50 border border-slate-100">
                <span className="w-4 h-4 rounded-none bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5" />
                </span>
                <span>Land Record (7/12 Extract or Khasra/Khatauni)</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-none bg-slate-50 border border-slate-100">
                <span className="w-4 h-4 rounded-none bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5" />
                </span>
                <span>Active PFMS-linked Bank Passbook / DBT</span>
              </div>
              <div className="flex items-center gap-2 p-2.5 rounded-none bg-slate-50 border border-slate-100">
                <span className="w-4 h-4 rounded-none bg-emerald-100 text-emerald-700 flex items-center justify-center">
                  <Check className="w-2.5 h-2.5" />
                </span>
                <span>Passport Photograph & Self Declaration</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-6 bg-slate-50 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          {scheme.officialCircularUrl ? (
            <a
              href={scheme.officialCircularUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-none bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 text-xs font-bold transition shadow-xs w-full sm:w-auto justify-center"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              <span>{t('schemes.downloadCircular', 'View Official Circular / Guidelines')}</span>
              <ExternalLink className="w-3 h-3 text-slate-400" />
            </a>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 rounded-none border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-100 transition"
            >
              {t('schemes.close', 'Close')}
            </button>
            <a
              href={scheme.applicationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-none bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-md active:scale-95"
            >
              <span>{t('schemes.apply', 'Apply on Govt Portal')}</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
