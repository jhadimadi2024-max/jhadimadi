import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

interface AdminConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const AdminConfirmDialog: React.FC<AdminConfirmDialogProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'নিশ্চিত করুন',
  cancelText = 'বাতিল',
  isDanger = true,
  onConfirm,
  onCancel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl text-slate-100 space-y-5 animate-in fade-in zoom-in-95 duration-150">
        
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
              isDanger 
                ? 'bg-rose-950/60 border border-rose-800/80 text-rose-400' 
                : 'bg-amber-950/60 border border-amber-800/80 text-amber-400'
            }`}>
              <AlertTriangle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-black text-white">{title}</h3>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                সংবেদনশীল প্রশাসনিক অ্যাকশন
              </span>
            </div>
          </div>

          <button
            id="btn-close-confirm-dialog"
            type="button"
            onClick={onCancel}
            className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed font-medium">
          {message}
        </p>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-800">
          <button
            id="btn-cancel-confirm-dialog"
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl border border-slate-700/80 text-slate-300 hover:bg-slate-800 text-xs font-bold transition cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            id="btn-action-confirm-dialog"
            type="button"
            onClick={() => {
              onConfirm();
              onCancel();
            }}
            className={`px-5 py-2.5 rounded-xl text-xs font-black text-white shadow-lg transition cursor-pointer ${
              isDanger
                ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950/50'
                : 'bg-amber-600 hover:bg-amber-500 shadow-amber-950/50'
            }`}
          >
            {confirmText}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AdminConfirmDialog;
