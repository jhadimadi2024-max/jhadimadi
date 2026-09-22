import React, { useState } from 'react';
import {
  AlertTriangle,
  Trash2,
  X,
  Lock,
  CheckCircle2,
  Loader2,
  ShieldAlert,
} from 'lucide-react';
import { deleteUserAccount } from '../services/authService';

interface AccountDeletionModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: {
    id?: string;
    phone?: string;
    name?: string;
    email?: string;
  } | null;
  onDeleted?: () => void;
}

export const AccountDeletionModal: React.FC<AccountDeletionModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onDeleted,
}) => {
  const [confirmText, setConfirmText] = useState('');
  const [agreedToPermanentWipe, setAgreedToPermanentWipe] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDone, setIsDone] = useState(false);

  if (!isOpen) return null;

  const userPhone = currentUser?.phone || '';
  const isInputValid = agreedToPermanentWipe && (confirmText.trim().toUpperCase() === 'DELETE' || (userPhone && confirmText.trim() === userPhone));

  const handleDelete = async () => {
    if (!isInputValid || isDeleting) return;

    setIsDeleting(true);
    setErrorMsg(null);

    try {
      const result = await deleteUserAccount(currentUser?.id, currentUser?.phone);
      if (result.success) {
        setIsDone(true);
        setTimeout(() => {
          if (onDeleted) onDeleted();
          onClose();
        }, 2000);
      } else {
        setErrorMsg(result.error || 'অ্যাকাউন্ট ডিলিট করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
        setIsDeleting(false);
      }
    } catch (err: any) {
      setErrorMsg(err?.message || 'একটি অপ্রত্যাশিত ত্রুটি ঘটেছে।');
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-xs animate-fadeIn">
      <div
        id="account-deletion-modal-card"
        className="relative w-full max-w-lg bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden border border-rose-200 flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-rose-700 to-red-600 text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center border border-white/20">
              <ShieldAlert className="w-6 h-6 text-amber-200" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight">
                অ্যাকাউন্ট ডিলিট করুন (Delete Account)
              </h2>
              <p className="text-xs text-rose-100 font-medium">
                গুগল প্লে স্টোর কমপ্লায়েন্স ও ডেটা প্রটেকশন পলিসি
              </p>
            </div>
          </div>

          {!isDeleting && !isDone && (
            <button
              id="btn-close-account-deletion"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center text-white transition-colors cursor-pointer"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 text-xs sm:text-sm text-stone-700 overflow-y-auto max-h-[75vh]">
          {isDone ? (
            <div className="text-center py-6 space-y-3">
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h3 className="text-base font-extrabold text-stone-900">
                অ্যাকাউন্ট স্থায়ীভাবে মুছে ফেলা হয়েছে
              </h3>
              <p className="text-xs text-stone-600 max-w-sm mx-auto">
                আপনার প্রোফাইল, ফোন নম্বর ও সকল ব্যক্তিগত ডেটা সার্ভার এবং ডাটাবেজ থেকে মুছে দেওয়া হয়েছে।
              </p>
            </div>
          ) : (
            <>
              {/* Warning Callout */}
              <div className="bg-rose-50 border border-rose-300 p-3.5 rounded-xl space-y-2 text-rose-950">
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-rose-800">
                  <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>সতর্কবার্তা: এই প্রক্রিয়াটি অপরিবর্তনীয় (Permanent)</span>
                </div>
                <p className="text-[11px] sm:text-xs leading-relaxed text-stone-700">
                  অ্যাকাউন্ট ডিলিট করার পর আপনার সব ডাটা স্থায়ীভাবে মুছে যাবে এবং তা আর পুনরুদ্ধার করা সম্ভব হবে না:
                </p>
                <ul className="list-disc list-inside text-[11px] text-stone-600 space-y-1 pl-1">
                  <li>আপনার ব্যবহারকারী প্রোফাইল এবং মোবাইল নম্বর।</li>
                  <li>আপনার ঠিকানা ও পূর্ববর্তী অর্ডারের হিস্টোরি।</li>
                  <li>স্ক্রিনিং করা ডকুমেন্টস এবং প্রোফাইল ব্যাজ।</li>
                  <li>যদি ফ্রিল্যান্সার বা বিক্রেতা হন, আপনার সার্ভিস ও পণ্য তালিকা।</li>
                </ul>
              </div>

              {/* User Identity Info */}
              {currentUser && (
                <div className="bg-stone-50 border border-stone-200 p-3 rounded-xl flex items-center justify-between text-xs">
                  <div>
                    <span className="text-stone-500 font-medium block">বর্তমান অ্যাকাউন্ট:</span>
                    <span className="font-bold text-stone-900">{currentUser.name || 'সম্মানিত ব্যবহারকারী'}</span>
                  </div>
                  {currentUser.phone && (
                    <div className="text-right">
                      <span className="text-stone-500 font-medium block">ফোন নম্বর:</span>
                      <span className="font-bold text-stone-900">{currentUser.phone}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Checkbox Agreement */}
              <label className="flex items-start gap-2.5 p-3 rounded-xl bg-stone-50 border border-stone-200 cursor-pointer select-none">
                <input
                  type="checkbox"
                  id="chk-agree-wipe"
                  checked={agreedToPermanentWipe}
                  onChange={(e) => setAgreedToPermanentWipe(e.target.checked)}
                  className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                />
                <span className="text-[11px] sm:text-xs text-stone-700 font-medium leading-tight">
                  আমি নিশ্চিত করছি যে আমার অ্যাকাউন্ট ও সকল ব্যক্তিগত ডেটা স্থায়ীভাবে ডাটাবেজ থেকে মুছে ফেলা হবে এবং এতে আমার পূর্ণ সম্মতি রয়েছে।
                </span>
              </label>

              {/* Confirmation Input */}
              <div className="space-y-1.5">
                <label className="block text-[11px] sm:text-xs font-bold text-stone-700">
                  নিশ্চিত করতে নিচে <span className="font-mono text-rose-600 font-extrabold bg-rose-50 px-1.5 py-0.5 rounded border border-rose-200">DELETE</span> অথবা আপনার ফোন নম্বরটি লিখুন:
                </label>
                <input
                  type="text"
                  id="input-delete-confirm"
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  placeholder="DELETE লিখুন"
                  disabled={isDeleting}
                  className="w-full px-3 py-2 text-xs sm:text-sm rounded-xl border border-stone-300 focus:border-rose-500 focus:ring-1 focus:ring-rose-500 outline-hidden font-mono"
                />
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-rose-100 border border-rose-300 rounded-xl text-xs text-rose-800 font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Actions */}
              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  id="btn-cancel-deletion"
                  onClick={onClose}
                  disabled={isDeleting}
                  className="px-4 py-2 rounded-xl text-xs sm:text-sm font-bold text-stone-600 hover:bg-stone-100 transition-colors cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  id="btn-confirm-delete-account"
                  onClick={handleDelete}
                  disabled={!isInputValid || isDeleting}
                  className={`px-5 py-2 rounded-xl text-xs sm:text-sm font-bold text-white flex items-center gap-2 transition-all shadow-xs cursor-pointer ${
                    isInputValid && !isDeleting
                      ? 'bg-rose-600 hover:bg-rose-700 active:scale-95'
                      : 'bg-stone-300 cursor-not-allowed opacity-70'
                  }`}
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>ডাটা ডিলিট হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      <span>স্থায়ীভাবে অ্যাকাউন্ট ডিলিট করুন</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
