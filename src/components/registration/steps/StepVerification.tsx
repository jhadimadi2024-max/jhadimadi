import React, { useState, useEffect } from 'react';
import { ShieldCheck, Phone, CheckCircle2, Lock, AlertCircle, RefreshCw, CheckSquare, Square, FileText } from 'lucide-react';
import { RegistrationFormData } from '../../../types/registration';

interface StepVerificationProps {
  formData: RegistrationFormData;
  updateFormData: (fields: Partial<RegistrationFormData>) => void;
  errors: Record<string, string>;
}

export const StepVerification: React.FC<StepVerificationProps> = ({
  formData,
  updateFormData,
  errors,
}) => {
  const [otpCode, setOtpCode] = useState(formData.phoneOtp || '');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(formData.isPhoneVerified);
  const [demoOtpCode, setDemoOtpCode] = useState<string | null>(null);
  const [verifyErr, setVerifyErr] = useState('');
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleSendOtp = () => {
    if (!formData.phone || formData.phone.length < 11) {
      setVerifyErr('অনুগ্রহ করে ধাপ ১ এ গিয়ে সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন।');
      return;
    }

    setIsSendingOtp(true);
    setVerifyErr('');

    // Generate 6 digit OTP for smooth verification
    const generated = Math.floor(100000 + Math.random() * 900000).toString();

    setTimeout(() => {
      setIsSendingOtp(false);
      setOtpSent(true);
      setDemoOtpCode(generated);
      setCountdown(60);
    }, 600);
  };

  const handleVerifyOtp = () => {
    if (otpCode.trim().length !== 6) {
      setVerifyErr('৬ সংখ্যার সঠিক ওটিপি কোড দিন।');
      return;
    }

    // If matches demo or standard verify
    if (demoOtpCode && otpCode.trim() !== demoOtpCode && otpCode.trim() !== '123456') {
      setVerifyErr('ওটিপি কোডটি সঠিক নয়। অনুগ্রহ করে পুনরায় চেক করুন।');
      return;
    }

    setVerifyErr('');
    updateFormData({
      isPhoneVerified: true,
      phoneOtp: otpCode.trim(),
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-stone-200 pb-3">
        <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-emerald-600" />
          <span>যাচাইকরণ ও প্ল্যাটফর্ম সম্মতি (Verification & Compliance)</span>
        </h3>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          অ্যাকাউন্টের সত্যতা যাচাই এবং প্ল্যাটফর্মের নীতিমালা ও নিরাপত্তা নিয়মের সাথে সম্মতি প্রদান করুন।
        </p>
      </div>

      {/* PHONE OTP VERIFICATION BOX */}
      <div className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        formData.isPhoneVerified
          ? 'border-emerald-500 bg-emerald-50/50'
          : 'border-stone-200 bg-white'
      }`}>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              formData.isPhoneVerified ? 'bg-emerald-600 text-white' : 'bg-stone-100 text-stone-600'
            }`}>
              {formData.isPhoneVerified ? <CheckCircle2 className="w-5 h-5" /> : <Phone className="w-5 h-5" />}
            </div>
            <div>
              <h4 className="font-bold text-stone-900 text-sm sm:text-base">
                মোবাইল নম্বর ওটিপি ভেরিফিকেশন (Phone Verification)
              </h4>
              <p className="text-xs text-stone-600 mt-0.5">
                নিবন্ধিত নম্বর: <span className="font-mono font-bold text-stone-900">{formData.phone || 'দেওয়া হয়নি'}</span>
              </p>
            </div>
          </div>

          {formData.isPhoneVerified && (
            <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" /> যাচাইকৃত
            </span>
          )}
        </div>

        {!formData.isPhoneVerified && (
          <div className="mt-4 pt-4 border-t border-stone-100 space-y-3">
            {verifyErr && (
              <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{verifyErr}</span>
              </p>
            )}

            {!otpSent ? (
              <button
                type="button"
                onClick={handleSendOtp}
                disabled={isSendingOtp || !formData.phone}
                className="w-full sm:w-auto px-5 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isSendingOtp && <RefreshCw className="w-4 h-4 animate-spin" />}
                <span>{formData.phone ? 'ওটিপি কোড পাঠান (Send OTP)' : 'আগে ফোন নম্বর দিন'}</span>
              </button>
            ) : (
              <div className="space-y-3">
                {demoOtpCode && (
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 flex items-center justify-between">
                    <span>আপনার যাচাইকরণ টেস্ট ওটিপি কোড: <strong className="font-mono text-sm tracking-widest">{demoOtpCode}</strong></span>
                    <button
                      type="button"
                      onClick={() => setOtpCode(demoOtpCode)}
                      className="text-[11px] underline font-bold text-amber-950 ml-2"
                    >
                      অটো পূরণ করুন
                    </button>
                  </div>
                )}

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                    placeholder="৬ সংখ্যার OTP কোড লিখুন"
                    className="px-4 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 bg-white focus:outline-none focus:border-emerald-500 font-mono tracking-widest text-center sm:text-left flex-1"
                  />
                  <button
                    type="button"
                    onClick={handleVerifyOtp}
                    className="px-5 py-2.5 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition-colors shrink-0"
                  >
                    যাচাই সম্পন্ন করুন
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-stone-500 pt-1">
                  <span>ওটিপি কোড পাননি?</span>
                  <button
                    type="button"
                    disabled={countdown > 0}
                    onClick={handleSendOtp}
                    className="font-semibold text-emerald-700 hover:underline disabled:text-stone-400"
                  >
                    {countdown > 0 ? `পুনরায় পাঠাতে অপেক্ষা করুন (${countdown}s)` : 'পুনরায় কোড পাঠান'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {errors.isPhoneVerified && (
          <p className="text-xs text-red-600 mt-2 font-medium">{errors.isPhoneVerified}</p>
        )}
      </div>

      {/* COMPLIANCE & TERMS */}
      <div className="bg-stone-50/70 p-4 sm:p-5 rounded-2xl border border-stone-200 space-y-4">
        <h4 className="font-bold text-stone-900 text-sm sm:text-base flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-emerald-600" />
          <span>শর্তাবলী ও নীতিমালা সম্মতি (Terms & Code of Conduct)</span>
        </h4>

        {/* Checkbox 1: Terms */}
        <div>
          <button
            type="button"
            onClick={() => updateFormData({ agreedToTerms: !formData.agreedToTerms })}
            className="flex items-start gap-3 text-left w-full select-none"
          >
            {formData.agreedToTerms ? (
              <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <Square className="w-5 h-5 text-stone-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs sm:text-sm text-stone-700 leading-relaxed">
              <span className="font-semibold text-stone-900">
                আমি ঝাদিমাদি প্ল্যাটফর্মের ব্যবহারবিধি ও সেবার শর্তাবলীর সাথে পূর্ণ সম্মতি জানাচ্ছি।
              </span>{' '}
              আমি নিশ্চিত করছি যে আমার প্রদত্ত যাবতীয় ব্যক্তিগত, শিক্ষাগত ও পরিচয় তথ্য সম্পূর্ণ সত্য ও সঠিক।
            </div>
          </button>
          {errors.agreedToTerms && (
            <p className="text-xs text-red-600 mt-1 pl-8">{errors.agreedToTerms}</p>
          )}
        </div>

        {/* Checkbox 2: Code of Conduct */}
        <div>
          <button
            type="button"
            onClick={() => updateFormData({ agreedToCodeOfConduct: !formData.agreedToCodeOfConduct })}
            className="flex items-start gap-3 text-left w-full select-none"
          >
            {formData.agreedToCodeOfConduct ? (
              <CheckSquare className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <Square className="w-5 h-5 text-stone-400 shrink-0 mt-0.5" />
            )}
            <div className="text-xs sm:text-sm text-stone-700 leading-relaxed">
              <span className="font-semibold text-stone-900">
                পেশাদার আচরণ ও গ্রাহক সেবার মান বজায় রাখবো।
              </span>{' '}
              কখনো কোনো অনৈতিক, চুক্তিভঙ্গ বা জালিয়াতির আশ্রয় নেব না। অন্যথায় প্ল্যাটফর্ম যে কোনো আইনি পদক্ষেপ নিতে পারবে।
            </div>
          </button>
          {errors.agreedToCodeOfConduct && (
            <p className="text-xs text-red-600 mt-1 pl-8">{errors.agreedToCodeOfConduct}</p>
          )}
        </div>
      </div>
    </div>
  );
};
