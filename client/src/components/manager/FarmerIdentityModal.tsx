import React from 'react';
import { QueueTokenDTO } from '@smart-farmer/shared';
import { Badge } from '../common/Badge';
import { ShieldCheck, X, Check, User as UserIcon, Phone, MessageSquare, Play, FlaskConical } from 'lucide-react';

export interface FarmerIdentityModalProps {
  selectedFarmerModal: QueueTokenDTO | null;
  onClose: () => void;
  onCallToken: (id: string) => void;
  onStartProcessing: (id: string) => void;
  onCompleteProcurement: (token: QueueTokenDTO) => void;
}

export const FarmerIdentityModal: React.FC<FarmerIdentityModalProps> = ({
  selectedFarmerModal,
  onClose,
  onCallToken,
  onStartProcessing,
  onCompleteProcurement,
}) => {
  if (!selectedFarmerModal) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-none max-w-lg w-full overflow-hidden shadow-2xl border border-slate-100 animate-scale-up">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-base">Farmer Identity & Verification</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-none text-slate-300 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Photo and Primary Info */}
          <div className="flex flex-col sm:flex-row items-center gap-5 pb-5 border-b border-slate-100">
            <div className="relative shrink-0">
              <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-none bg-slate-100 border-2 border-emerald-500 overflow-hidden shadow-lg flex items-center justify-center text-slate-400">
                {selectedFarmerModal.farmer?.profilePictureUrl ? (
                  <img
                    src={selectedFarmerModal.farmer.profilePictureUrl}
                    alt={selectedFarmerModal.farmer.fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center gap-1 text-slate-400">
                    <UserIcon className="w-12 h-12" />
                    <span className="text-[10px] font-semibold">No Photo</span>
                  </div>
                )}
              </div>
              {selectedFarmerModal.farmer?.profilePictureUrl && (
                <span className="absolute -bottom-2 right-2 px-2 py-0.5 rounded-none bg-emerald-600 text-white text-[10px] font-bold shadow flex items-center gap-1">
                  <Check className="w-3 h-3" /> Photo Verified
                </span>
              )}
            </div>

            <div className="text-center sm:text-left space-y-1.5 flex-1">
              <div className="inline-block px-2.5 py-0.5 rounded-none bg-emerald-100 text-emerald-800 font-black text-xs">
                Token #{selectedFarmerModal.tokenNumber}
              </div>
              <h4 className="text-xl font-black text-slate-900">
                {selectedFarmerModal.farmer?.fullName}
              </h4>
              <p className="text-xs text-slate-500">
                {selectedFarmerModal.farmer?.village}, {selectedFarmerModal.farmer?.district}, {selectedFarmerModal.farmer?.state}
              </p>

              <div className="pt-2 flex flex-wrap gap-2 justify-center sm:justify-start">
                <a
                  href={`tel:${selectedFarmerModal.farmer?.mobile}`}
                  className="px-3 py-1.5 rounded-none bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 text-emerald-600" /> Call {selectedFarmerModal.farmer?.mobile}
                </a>
                {selectedFarmerModal.farmer?.mobile && (
                  <a
                    href={`https://wa.me/91${selectedFarmerModal.farmer.mobile.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-none bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold flex items-center gap-1.5 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5 text-emerald-600" /> WhatsApp
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Consignment & Token Grid */}
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="p-3 rounded-none bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block font-medium">Crop Produce</span>
              <span className="text-slate-800 font-bold text-sm block mt-0.5">
                {selectedFarmerModal.crop?.name || 'Produce'}
              </span>
            </div>
            <div className="p-3 rounded-none bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block font-medium">Declared Weight</span>
              <span className="text-slate-800 font-bold text-sm block mt-0.5">
                {selectedFarmerModal.quantity} {selectedFarmerModal.unit}
              </span>
            </div>
            <div className="p-3 rounded-none bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block font-medium">Current Status</span>
              <div className="mt-1">
                <Badge status={selectedFarmerModal.status} />
              </div>
            </div>
            <div className="p-3 rounded-none bg-slate-50 border border-slate-100">
              <span className="text-slate-400 block font-medium">Est. Wait Time</span>
              <span className="text-amber-700 font-bold text-sm block mt-0.5">
                ~{selectedFarmerModal.estimatedWaitMinutes} mins
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            {selectedFarmerModal.status === 'WAITING' && (
              <button
                onClick={() => {
                  onCallToken(selectedFarmerModal.id);
                  onClose();
                }}
                className="px-4 py-2 rounded-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" /> Call to Bay
              </button>
            )}
            {selectedFarmerModal.status === 'CALLED' && (
              <button
                onClick={() => {
                  onStartProcessing(selectedFarmerModal.id);
                  onClose();
                }}
                className="px-4 py-2 rounded-none bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <Play className="w-3.5 h-3.5" /> Start Weighing
              </button>
            )}
            {selectedFarmerModal.status === 'PROCESSING' && (
              <button
                onClick={() => {
                  onCompleteProcurement(selectedFarmerModal);
                  onClose();
                }}
                className="px-4 py-2 rounded-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
              >
                <FlaskConical className="w-3.5 h-3.5" /> Inspect, Weigh & Issue Receipt
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-none border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
