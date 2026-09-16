import React from 'react';
import { X, Landmark } from 'lucide-react';

export interface BankFormData {
  accountHolderName: string;
  bankName: string;
  customBankName: string;
  accountNumber: string;
  confirmAccountNumber: string;
  ifscCode: string;
  branchName: string;
  aadhaarLinked: boolean;
  upiId: string;
}

interface FarmerBankDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  bankForm: BankFormData;
  setBankForm: React.Dispatch<React.SetStateAction<BankFormData>>;
  onSubmit: (e: React.FormEvent) => void;
  isSaving: boolean;
  error: string | null;
  success: string | null;
  bankOptions: string[];
  t: (path: string, fallback?: string) => string;
}

/**
 * Humanized PFMS Aadhaar-linked Bank Records Modal.
 * Allows verified farmers to register or update their Direct Benefit Transfer (DBT) bank accounts.
 */
export const FarmerBankDetailsModal: React.FC<FarmerBankDetailsModalProps> = ({
  isOpen,
  onClose,
  bankForm,
  setBankForm,
  onSubmit,
  isSaving,
  error,
  success,
  bankOptions,
  t,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-in fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative my-8">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-100">
          <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Landmark className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-extrabold text-slate-900">
              {t('dashboard.editBankModalTitle', 'Bank Records (DBT Account)')}
            </h3>
            <p className="text-xs text-slate-400">
              {t('dashboard.editBankModalSub', 'Mandatory for direct MSP settlement via PFMS')}
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700">
            {error}
          </div>
        )}

        {success && (
          <div className="mb-4 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-700">
            {success}
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('dashboard.accHolderLabel', 'Account Holder Name')} <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={bankForm.accountHolderName}
              onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
              placeholder="As printed on bank passbook / Aadhaar"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('dashboard.selectBankLabel', 'Select Bank')} <span className="text-rose-500">*</span>
              </label>
              <select
                value={bankForm.bankName}
                onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              >
                {bankOptions.map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('dashboard.ifscCode', 'IFSC Code')} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                maxLength={11}
                value={bankForm.ifscCode}
                onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value.toUpperCase() })}
                placeholder="e.g. SBIN0001234"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono uppercase focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              />
            </div>
          </div>

          {bankForm.bankName === 'Other' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('dashboard.specifyBankLabel', 'Bank Name')} <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={bankForm.customBankName}
                onChange={(e) => setBankForm({ ...bankForm, customBankName: e.target.value })}
                placeholder="Enter full bank name"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              />
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('dashboard.accNumberLabel', 'Account Number')} <span className="text-rose-500">*</span>
              </label>
              <input
                type="password"
                required
                value={bankForm.accountNumber}
                onChange={(e) =>
                  setBankForm({ ...bankForm, accountNumber: e.target.value.replace(/\D/g, '') })
                }
                placeholder="Enter account number"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                {t('dashboard.confirmAccNumberLabel', 'Confirm Account Number')}{' '}
                <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={bankForm.confirmAccountNumber}
                onChange={(e) =>
                  setBankForm({
                    ...bankForm,
                    confirmAccountNumber: e.target.value.replace(/\D/g, ''),
                  })
                }
                placeholder="Re-enter account number"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs font-mono focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('dashboard.branchLabel', 'Branch Name')}
            </label>
            <input
              type="text"
              value={bankForm.branchName}
              onChange={(e) => setBankForm({ ...bankForm, branchName: e.target.value })}
              placeholder="e.g. Main Market Branch, Ludhiana"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {t('dashboard.upiLabel', 'UPI ID (Optional)')}
            </label>
            <input
              type="text"
              value={bankForm.upiId}
              onChange={(e) => setBankForm({ ...bankForm, upiId: e.target.value })}
              placeholder="e.g. farmer@upi"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-xs focus:ring-2 focus:ring-emerald-500 bg-slate-50/50"
            />
          </div>

          <div className="p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-100 flex items-start gap-2.5">
            <input
              id="aadhaarLinkedCheckbox"
              type="checkbox"
              checked={bankForm.aadhaarLinked}
              onChange={(e) => setBankForm({ ...bankForm, aadhaarLinked: e.target.checked })}
              className="mt-0.5 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <label
              htmlFor="aadhaarLinkedCheckbox"
              className="text-xs text-emerald-950 font-medium cursor-pointer leading-relaxed"
            >
              {t(
                'dashboard.aadhaarLinkedLabel',
                'My Aadhaar card is actively linked to this bank account for PFMS DBT direct payments'
              )}
            </label>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 transition-all"
            >
              {t('common.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-md active:scale-95 disabled:opacity-50"
            >
              {isSaving
                ? t('dashboard.savingBankDetails', 'Saving...')
                : t('dashboard.saveBankDetails', 'Save Bank Records')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
