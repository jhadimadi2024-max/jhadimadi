import React, { useState } from 'react';
import { 
  ChevronDown, 
  Sparkles, 
  X, 
  ShieldCheck, 
  Lock, 
  ArrowRight, 
  ArrowLeft, 
  FileText,
  CheckCircle2
} from 'lucide-react';
import { Language } from '../types';

export interface RoleSelectionModalProps {
  // Modal mode props (used in CustomerApp.tsx)
  isOpen?: boolean;
  onClose?: () => void;
  userName?: string;
  onSelectRole?: (role: 'seller' | 'professional' | 'permanent') => void;
  lang?: Language | 'bn' | 'en' | string;

  // Onboarding flow props (used in App.tsx and RegistrationFlow.tsx)
  onSelect?: (type: 'merchant' | 'service' | 'permanent') => void;
  onNavigateToMerchantDashboard?: () => void;
  onNavigateToServiceProviderForm?: () => void;
  onNavigateToPermanentMemberForm?: () => void;
}

export const RoleSelectionModal: React.FC<RoleSelectionModalProps> = ({
  isOpen,
  onClose,
  userName,
  onSelectRole,
  onSelect,
  onNavigateToMerchantDashboard,
  onNavigateToServiceProviderForm,
  onNavigateToPermanentMemberForm,
  lang = 'bn',
}) => {
  // Step state: 'select' (choose role) or 'privacy_policy' (mandatory Google Play Privacy Policy & Consent)
  const [viewStep, setViewStep] = useState<'select' | 'privacy_policy'>('select');
  // Default selected option: 'merchant' (পণ্য বিক্রেতা)
  const [selectedType, setSelectedType] = useState<'merchant' | 'service' | 'permanent'>('merchant');
  // Pending role chosen for registration
  const [pendingRole, setPendingRole] = useState<'merchant' | 'service' | 'permanent'>('merchant');
  // Bilingual policy switcher: 'bn' or 'en'
  const [policyLang, setPolicyLang] = useState<'bn' | 'en'>(lang === 'en' ? 'en' : 'bn');
  // Consent agreement checkbox state
  const [isAgreed, setIsAgreed] = useState<boolean>(false);

  // If used as a modal and isOpen is explicitly false, do not render
  if (isOpen !== undefined && !isOpen) {
    return null;
  }

  const handleProceed = (type: 'merchant' | 'service' | 'permanent') => {
    setSelectedType(type);

    // Call primary onSelect callback
    if (onSelect) {
      onSelect(type);
    }

    // Trigger navigation callbacks based on selected type
    if (type === 'merchant') {
      if (onNavigateToMerchantDashboard) {
        onNavigateToMerchantDashboard();
      }
      if (onSelectRole) {
        onSelectRole('seller');
      }
    } else if (type === 'service') {
      if (onNavigateToServiceProviderForm) {
        onNavigateToServiceProviderForm();
      }
      if (onSelectRole) {
        onSelectRole('professional');
      }
    } else if (type === 'permanent') {
      if (onNavigateToPermanentMemberForm) {
        onNavigateToPermanentMemberForm();
      }
      if (onSelectRole) {
        onSelectRole('permanent');
      }
    }

    if (onClose) {
      onClose();
    }
  };

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setPendingRole(selectedType);
    setViewStep('privacy_policy');
    setIsAgreed(false);
  };

  const modalContent = (
    <div 
      id="role-selection-card"
      onClick={(e) => e.stopPropagation()}
      className="w-full max-w-md mx-auto bg-white p-6 sm:p-7 rounded-2xl sm:rounded-3xl shadow-xl border border-gray-100 text-left relative z-10 pointer-events-auto transition-all"
    >
      {/* Top Close Button (if modal mode) */}
      {onClose && (
        <div className="flex justify-end -mt-2 -mr-2 mb-1">
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 p-1.5 rounded-full hover:bg-gray-100 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* VIEW STEP 1: ROLE SELECTION (মার্চেন্ট নাকি সেবা প্রদানকারী নির্বাচন) */}
      {/* ========================================================================= */}
      {viewStep === 'select' && (
        <>
          {/* Header Text */}
          <div className="mb-5">
            {userName && (
              <div className="inline-flex items-center gap-1.5 bg-emerald-50 text-[#0A6A32] text-[11px] font-bold px-2.5 py-1 rounded-full border border-emerald-100 mb-2.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>স্বাগতম, {userName}!</span>
              </div>
            )}
            <h2 className="text-sm sm:text-base font-black text-gray-900 leading-snug tracking-tight">
              {lang === 'bn'
                ? 'আপনি কি ঝাদিমাদি ডট কমে পণ্য বিক্রি করতে চান নাকি সেবা বিক্রি করতে চান? নিচের ড্রপডাউন বার থেকে সিলেক্ট করে সাবমিট করুন।'
                : 'Do you want to sell products or services on Jhadimadi.com? Select from the dropdown bar below and submit.'}
            </h2>
          </div>

          {/* Selection Bar Section & Submit */}
          <form onSubmit={handleInitialSubmit} className="space-y-5">
            {/* Dropdown Select input */}
            <div>
              <label
                htmlFor="registration-type-select"
                className="block text-xs font-semibold text-gray-600 mb-2"
              >
                {lang === 'bn' ? 'রেজিস্ট্রেশনের ধরন নির্বাচন করুন' : 'Select Registration Type'}
              </label>
              <div className="relative">
                <select
                  id="registration-type-select"
                  value={selectedType}
                  onChange={(e) => setSelectedType(e.target.value as 'merchant' | 'service' | 'permanent')}
                  className="w-full appearance-none bg-white border border-gray-300 rounded-xl px-4 py-3 text-xs sm:text-sm text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#0A6A32] focus:border-[#0A6A32] transition cursor-pointer pr-10 shadow-2xs"
                >
                  <option value="merchant">মার্চেন্ট অ্যাকাউন্ট (পণ্য বিক্রেতা)</option>
                  <option value="service">সেবা বিক্রি করুন (পেশাজীবী / সেবাদাতা)</option>
                  <option value="permanent">স্থায়ী সদস্য (অফিসিয়াল প্রতিনিধি ও সুপারভাইজার)</option>
                </select>
                <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                  <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                </div>
              </div>
            </div>

            {/* Action Button: Full-width solid green rounded submit button */}
            <button
              id="btn-submit-account-type"
              type="submit"
              className="w-full bg-[#0A6A32] hover:bg-[#085427] active:bg-[#06421e] text-white font-bold py-3.5 px-4 rounded-xl sm:rounded-2xl transition-all flex items-center justify-center gap-2 text-xs sm:text-sm cursor-pointer shadow-md hover:shadow-lg active:scale-[0.99]"
            >
              <span>{lang === 'bn' ? 'সাবমিট করুন' : 'Submit'}</span>
              <span className="text-base font-bold leading-none">➔</span>
            </button>
          </form>
        </>
      )}

      {/* ========================================================================= */}
      {/* VIEW STEP 2: STRICT PRIVACY POLICY & CONSENT SCREEN (Google Play Store Policy) */}
      {/* Appears immediately after clicking registration option, before actual form */}
      {/* ========================================================================= */}
      {viewStep === 'privacy_policy' && (
        <div className="space-y-4">
          {/* Header & Role Tag with Language Switcher */}
          <div className="flex items-start justify-between gap-2 border-b border-stone-100 pb-3">
            <div>
              <div className="flex items-center gap-1.5 text-xs text-[#0A6A32] font-bold">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>
                  {pendingRole === 'merchant'
                    ? (policyLang === 'bn' ? 'মার্চেন্ট অ্যাকাউন্ট রেজিস্ট্রেশন' : 'Merchant Registration')
                    : pendingRole === 'permanent'
                    ? (policyLang === 'bn' ? 'স্থায়ী সদস্য রেজিস্ট্রেশন' : 'Permanent Member Registration')
                    : (policyLang === 'bn' ? 'সেবা প্রদানকারী রেজিস্ট্রেশন' : 'Service Provider Registration')}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-stone-900 mt-0.5">
                {policyLang === 'bn' 
                  ? 'গোপনীয়তা নীতি ও শর্তাবলী' 
                  : 'Privacy Policy & Terms'}
              </h3>
            </div>

            {/* Specification 1: Language Switcher (বাংলা / English Toggle) at the top corner */}
            <div 
              id="privacy-policy-lang-toggle"
              className="flex items-center bg-stone-100 p-0.5 rounded-lg border border-stone-200 shrink-0 select-none"
            >
              <button
                type="button"
                onClick={() => setPolicyLang('bn')}
                className={`px-2.5 py-1 text-xs font-black rounded-md transition-all cursor-pointer ${
                  policyLang === 'bn'
                    ? 'bg-[#0A6A32] text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => setPolicyLang('en')}
                className={`px-2.5 py-1 text-xs font-black rounded-md transition-all cursor-pointer ${
                  policyLang === 'en'
                    ? 'bg-[#0A6A32] text-white shadow-2xs'
                    : 'text-stone-600 hover:text-stone-900'
                }`}
              >
                English
              </button>
            </div>
          </div>

          {/* Specification 2: Full Policy Text inside a scrollable box */}
          <div 
            id="privacy-policy-scroll-box"
            tabIndex={0}
            className="max-h-56 sm:max-h-64 overflow-y-auto p-3.5 bg-stone-50 border border-stone-200 rounded-xl space-y-3 text-xs sm:text-sm text-stone-800 leading-relaxed focus:outline-none focus:ring-1 focus:ring-emerald-500 shadow-inner"
          >
            {policyLang === 'bn' ? (
              /* Bengali Version (Exact required text) */
              <div className="space-y-2.5">
                <p className="font-bold text-stone-900">
                  গোপনীয়তা নীতি ও শর্তাবলী (Privacy Policy & Terms):
                </p>
                <p className="text-stone-700">
                  'ঝাদিমাদি ডটকম'-এ সেবা প্রদানকারী বা মার্চেন্ট হিসেবে নিবন্ধনের ক্ষেত্রে আপনার কিছু তথ্য সংগ্রহ করা হয়।
                </p>
                <div className="space-y-2 pt-1">
                  <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-stone-200/80 shadow-2xs">
                    <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-stone-900">সুরক্ষিত ডেটা:</span>{' '}
                      <span className="text-stone-700">
                        আপনার NID, সঠিক মোবাইল নম্বর এবং বিস্তারিত ঠিকানা সম্পূর্ণ গোপন ও সুরক্ষিত রাখা হয়। এগুলো পাবলিকলি বা সাধারণ ব্যবহারকারীদের কাছে প্রকাশ করা হয় না।
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-stone-200/80 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-stone-900">ব্যবহৃত তথ্য:</span>{' '}
                      <span className="text-stone-700">
                        শুধুমাত্র আপনার নাম, পেশা/ব্যবসার ধরন এবং এলাকা (জেলা/উপজেলা) সাধারণ গ্রাহকদের জন্য দৃশ্যমান থাকে।
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-stone-200/80 shadow-2xs">
                    <ShieldCheck className="w-4 h-4 text-[#0A6A32] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-stone-900">সম্মতি:</span>{' '}
                      <span className="text-stone-700">
                        ফর্ম সাবমিট করার মাধ্যমে আপনি আমাদের গুগল প্লে স্টোর পলিসি অনুযায়ী ডেটা সুরক্ষা নীতিতে সম্মতি প্রদান করছেন।
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* English Version (Exact required text) */
              <div className="space-y-2.5">
                <p className="font-bold text-stone-900">
                  Privacy Policy & Terms:
                </p>
                <p className="text-stone-700">
                  By registering as a Service Provider or Merchant on Jhadimadi.com, certain information is collected.
                </p>
                <div className="space-y-2 pt-1">
                  <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-stone-200/80 shadow-2xs">
                    <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-stone-900">Protected Data:</span>{' '}
                      <span className="text-stone-700">
                        Your NID, exact mobile number, and detailed address are kept strictly private, hidden by default, and secure according to Google Play Store policies. They are never publicly displayed.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-stone-200/80 shadow-2xs">
                    <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-stone-900">Visible Information:</span>{' '}
                      <span className="text-stone-700">
                        Only your name, profession/business type, and location (district/upazila) are visible to regular customers.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-start gap-2 bg-white p-2.5 rounded-lg border border-stone-200/80 shadow-2xs">
                    <ShieldCheck className="w-4 h-4 text-[#0A6A32] shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold text-stone-900">Consent:</span>{' '}
                      <span className="text-stone-700">
                        By proceeding, you agree to our data safety and privacy terms.
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Mandatory Agreement Checkbox */}
          <label className="flex items-start gap-2.5 p-3 rounded-xl border bg-emerald-50/70 border-emerald-200 cursor-pointer select-none transition hover:bg-emerald-50">
            <input
              type="checkbox"
              id="registration-consent-checkbox"
              checked={isAgreed}
              onChange={(e) => setIsAgreed(e.target.checked)}
              className="mt-0.5 w-4 h-4 rounded text-[#0A6A32] focus:ring-[#0A6A32] cursor-pointer shrink-0"
            />
            <span className="text-xs font-semibold text-stone-800 leading-snug">
              {policyLang === 'bn'
                ? 'আমি ঝাদিমাদি ডটকম-এর গোপনীয়তা নীতি ও শর্তাবলী পড়েছি এবং এতে সম্পূর্ণ সম্মত।'
                : 'I have read and agree to the Jhadimadi.com Privacy Policy and Terms.'}
            </span>
          </label>

          {/* Action Buttons: Proceed to Form / Back to Selection */}
          <div className="space-y-2 pt-1">
            <button
              id="btn-agree-and-proceed-to-form"
              type="button"
              disabled={!isAgreed}
              onClick={() => handleProceed(pendingRole)}
              className={`w-full py-3.5 px-4 rounded-xl sm:rounded-2xl font-bold text-xs sm:text-sm transition-all flex items-center justify-center gap-2 ${
                isAgreed
                  ? 'bg-[#0A6A32] hover:bg-[#085427] active:bg-[#06421e] text-white shadow-md cursor-pointer active:scale-[0.99]'
                  : 'bg-stone-200 text-stone-400 cursor-not-allowed shadow-none'
              }`}
            >
              <span>
                {policyLang === 'bn' ? 'সম্মত আছি ও এগিয়ে যান' : 'I Agree & Proceed'}
              </span>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setViewStep('select')}
              className="w-full text-center text-xs text-stone-500 hover:text-stone-800 font-medium py-1 transition cursor-pointer flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>
                {policyLang === 'bn' ? 'অন্য অ্যাকাউন্ট টাইপ নির্বাচন করুন' : 'Change account type'}
              </span>
            </button>
          </div>
        </div>
      )}
    </div>
  );

  // If used as modal (isOpen !== undefined), wrap in backdrop overlay
  if (isOpen !== undefined) {
    return (
      <div 
        id="role-selection-modal-backdrop"
        className="fixed inset-0 z-[75] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto pointer-events-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget && onClose) {
            onClose();
          }
        }}
      >
        {modalContent}
      </div>
    );
  }

  return modalContent;
};

export default RoleSelectionModal;

