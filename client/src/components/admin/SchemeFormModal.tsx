import React from 'react';
import { CreateGovernmentSchemeDTO, GovernmentSchemeDTO } from '@smart-farmer/shared';
import { X } from 'lucide-react';

export interface SchemeFormModalProps {
  isOpen: boolean;
  editingScheme: GovernmentSchemeDTO | null;
  form: CreateGovernmentSchemeDTO;
  isSubmitting: boolean;
  onClose: () => void;
  onChange: (form: CreateGovernmentSchemeDTO) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const SchemeFormModal: React.FC<SchemeFormModalProps> = ({
  isOpen,
  editingScheme,
  form,
  isSubmitting,
  onClose,
  onChange,
  onSubmit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-scale-up my-8">
        {/* Modal Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex items-center justify-between">
          <div>
            <h3 className="text-lg font-extrabold flex items-center gap-2">
              🏛️ {editingScheme ? 'Edit Government Policy' : 'Publish New Government Policy'}
            </h3>
            <p className="text-xs text-slate-300 mt-0.5">
              Changes broadcast immediately over Socket.IO to all farmer and admin dashboards
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={onSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Scheme Title <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={form.title}
              onChange={(e) => onChange({ ...form, title: e.target.value })}
              placeholder="e.g. PM-KUSUM Solar Agriculture Pump Subsidy"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Scheme Category <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.category}
                onChange={(e) => onChange({ ...form, category: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              >
                <option value="SUBSIDY">Subsidy & Grants</option>
                <option value="FINANCE">Finance & DBT Support</option>
                <option value="SOLAR_PUMP">Solar Agriculture Pump</option>
                <option value="INSURANCE">Crop Insurance</option>
                <option value="MACHINERY">Farm Mechanization</option>
                <option value="IRRIGATION">Irrigation & Water Efficiency</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Issuing Ministry / Department <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.ministry}
                onChange={(e) => onChange({ ...form, ministry: e.target.value })}
                placeholder="e.g. Ministry of Agriculture & Farmers Welfare"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Financial Benefit / Subsidy Amount <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={form.benefitAmount}
                onChange={(e) => onChange({ ...form, benefitAmount: e.target.value })}
                placeholder="e.g. Up to 90% Subsidy or ₹6,000 / Year DBT"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-emerald-800 focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Application Status <span className="text-rose-500">*</span>
              </label>
              <select
                value={form.status}
                onChange={(e) => onChange({ ...form, status: e.target.value as any })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              >
                <option value="ACTIVE">APPLICATION OPEN</option>
                <option value="CLOSING_SOON">CLOSING SOON</option>
                <option value="NEW_AMENDMENT">NEW AMENDMENT</option>
                <option value="CLOSED">CLOSED</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Summary Description <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={form.summary}
              onChange={(e) => onChange({ ...form, summary: e.target.value })}
              placeholder="Concise overview of what this policy offers farmers..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Eligibility Criteria & Rules <span className="text-rose-500">*</span>
            </label>
            <textarea
              required
              rows={2}
              value={form.eligibilityCriteria}
              onChange={(e) => onChange({ ...form, eligibilityCriteria: e.target.value })}
              placeholder="Who is eligible? Land requirements, tenant rules, etc."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Detailed Operational Guidelines (Optional)
            </label>
            <textarea
              rows={2}
              value={form.details || ''}
              onChange={(e) => onChange({ ...form, details: e.target.value })}
              placeholder="In-depth implementation rules, payment disbursement stages, etc."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Max Landholding Cap (Acres)
              </label>
              <input
                type="number"
                step="0.5"
                value={form.maxLandAcreage ?? ''}
                onChange={(e) =>
                  onChange({
                    ...form,
                    maxLandAcreage: e.target.value ? parseFloat(e.target.value) : null,
                  })
                }
                placeholder="Leave empty for No Limit"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Applicable States
              </label>
              <input
                type="text"
                value={form.applicableStates || 'ALL'}
                onChange={(e) => onChange({ ...form, applicableStates: e.target.value })}
                placeholder="ALL or comma separated (e.g. Punjab, Haryana)"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Government Application URL <span className="text-rose-500">*</span>
              </label>
              <input
                type="url"
                required
                value={form.applicationUrl}
                onChange={(e) => onChange({ ...form, applicationUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Official Circular / PDF URL
              </label>
              <input
                type="url"
                value={form.officialCircularUrl || ''}
                onChange={(e) => onChange({ ...form, officialCircularUrl: e.target.value })}
                placeholder="https://..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Application Deadline Date
              </label>
              <input
                type="date"
                value={form.deadlineDate || ''}
                onChange={(e) => onChange({ ...form, deadlineDate: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              />
            </div>

            <div className="pt-5">
              <label className="inline-flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                <input
                  type="checkbox"
                  checked={form.isFeatured ?? true}
                  onChange={(e) => onChange({ ...form, isFeatured: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <span>Highlight as Featured Scheme on Farmer Portal</span>
              </label>
            </div>
          </div>

          {/* Modal Submit Actions */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white text-xs font-extrabold shadow-md active:scale-95 transition disabled:opacity-50"
            >
              {isSubmitting
                ? 'Broadcasting...'
                : editingScheme
                ? 'Save & Broadcast Changes'
                : 'Publish & Broadcast Statewide'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
