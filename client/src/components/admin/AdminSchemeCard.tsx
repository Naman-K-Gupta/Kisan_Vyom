import React from 'react';
import { GovernmentSchemeDTO } from '@smart-farmer/shared';
import { Sparkles, IndianRupee, Clock, ExternalLink, Edit, Trash2, Landmark } from 'lucide-react';

export interface AdminSchemeCardProps {
  scheme: GovernmentSchemeDTO;
  onEdit: (scheme: GovernmentSchemeDTO) => void;
  onDelete: (id: string, title: string) => void;
  formatCategoryName: (cat: string) => string;
  formatStatus: (status: string) => { label: string; style: string };
}

export const AdminSchemeCard: React.FC<AdminSchemeCardProps> = ({
  scheme,
  onEdit,
  onDelete,
  formatCategoryName,
  formatStatus,
}) => {
  const statusBadge = formatStatus(scheme.status);

  return (
    <div className="p-5 rounded-none border border-slate-100 hover:border-slate-200 bg-white shadow-xs hover:shadow-sm transition-all flex flex-col md:flex-row md:items-center justify-between gap-4">
      {/* Left Info */}
      <div className="space-y-1.5 flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-2 py-0.5 rounded-none text-[10px] font-black uppercase tracking-wider bg-slate-100 text-slate-700 border border-slate-200">
            {formatCategoryName(scheme.category)}
          </span>
          <span
            className={`px-2 py-0.5 rounded-none text-[10px] font-black uppercase border ${statusBadge.style}`}
          >
            {statusBadge.label}
          </span>
          {scheme.isFeatured && (
            <span className="px-2 py-0.5 rounded-none text-[10px] font-black uppercase bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
              <Sparkles className="w-2.5 h-2.5" /> Featured
            </span>
          )}
        </div>

        <h4 className="text-sm sm:text-base font-extrabold text-slate-900 leading-snug">
          {scheme.title}
        </h4>

        <p className="text-xs text-slate-500 flex items-center gap-1.5 truncate">
          <Landmark className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span className="truncate">{scheme.ministry}</span>
        </p>

        <div className="flex items-center gap-4 flex-wrap text-xs text-slate-600 pt-1">
          <span className="font-extrabold text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2.5 py-0.5 rounded-none border border-emerald-100">
            <IndianRupee className="w-3.5 h-3.5" />
            {scheme.benefitAmount}
          </span>

          <span className="text-[11px] text-slate-500">
            Acreage Limit:{' '}
            <strong>{scheme.maxLandAcreage ? `${scheme.maxLandAcreage} Acres` : 'No Cap'}</strong>
          </span>

          {scheme.deadlineDate && (
            <span className="text-[11px] text-slate-500 flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-400" />
              Deadline:{' '}
              <strong>
                {new Date(scheme.deadlineDate).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </strong>
            </span>
          )}
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex items-center gap-2 self-start md:self-center flex-shrink-0">
        <a
          href={scheme.applicationUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-none border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition"
          title="Open Application Portal"
        >
          <ExternalLink className="w-4 h-4" />
        </a>

        <button
          type="button"
          onClick={() => onEdit(scheme)}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-none bg-slate-100 hover:bg-slate-200/80 text-slate-800 text-xs font-bold transition active:scale-95"
        >
          <Edit className="w-3.5 h-3.5 text-slate-600" />
          <span>Edit & Amend</span>
        </button>

        <button
          type="button"
          onClick={() => onDelete(scheme.id, scheme.title)}
          className="p-2 rounded-none bg-rose-50 hover:bg-rose-100 text-rose-700 transition active:scale-95 border border-rose-100"
          title="Delete / Archive Scheme"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
