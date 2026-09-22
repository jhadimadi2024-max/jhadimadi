import React, { useRef } from 'react';
import { FileCheck, Upload, ShieldCheck, Camera, CreditCard, FileText, CheckCircle2, AlertCircle } from 'lucide-react';
import { RegistrationFormData } from '../../../types/registration';

interface StepDocumentsProps {
  formData: RegistrationFormData;
  updateFormData: (fields: Partial<RegistrationFormData>) => void;
  errors: Record<string, string>;
}

export const StepDocuments: React.FC<StepDocumentsProps> = ({
  formData,
  updateFormData,
  errors,
}) => {
  const nidFrontInputRef = useRef<HTMLInputElement>(null);
  const nidBackInputRef = useRef<HTMLInputElement>(null);
  const selfieInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (field: 'nidFrontUrl' | 'nidBackUrl' | 'selfieUrl' | 'cvResumeUrl', file: File) => {
    // Local data URL preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      updateFormData({ [field]: url });
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-stone-200 pb-3">
        <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
          <FileCheck className="w-5 h-5 text-emerald-600" />
          <span>কাগজপত্র ও পরিচয় প্রমাণ (Documents & Identity)</span>
        </h3>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          ব্লু-টিক ভেরিফিকেশন ও গ্রাহকের সর্বোচ্চ আস্থা নিশ্চিত করতে আপনার জাতীয় পরিচয়পত্র ও ছবি যুক্ত করুন।
        </p>
      </div>

      {/* Trust Badge Banner */}
      <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="text-xs sm:text-sm text-emerald-950">
          <p className="font-bold">ভেরিফাইড ব্যাজ সুবিধা (Verified Blue-Tick Badge)</p>
          <p className="text-emerald-800 text-xs mt-0.5">
            NID ও ছবি আপলোডকৃত প্রোফাইলগুলো ক্লায়েন্টদের অনুসন্ধানে সবার উপরে থাকে এবং ৩ গুণ বেশি কাজ পায়।
          </p>
        </div>
      </div>

      {/* NID Number Input */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-stone-800 mb-1.5 flex items-center gap-1.5">
          <CreditCard className="w-4 h-4 text-emerald-600" />
          <span>জাতীয় পরিচয়পত্র নম্বর (NID Number)</span>
        </label>
        <input
          type="text"
          value={formData.nidNumber || ''}
          onChange={(e) => updateFormData({ nidNumber: e.target.value.replace(/[^\d]/g, '') })}
          placeholder="১০, ১৩ অথবা ১৭ সংখ্যার এনআইডি নম্বর লিখুন"
          className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 bg-white focus:outline-none focus:border-emerald-500 font-mono"
        />
        <p className="text-[11px] text-stone-400 mt-1">
          আপনার এনআইডি তথ্য সম্পূর্ণ সুরক্ষিত ও ইনক্রিপ্টেড থাকবে।
        </p>
      </div>

      {/* NID Cards Upload Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* NID Front */}
        <div className="border border-stone-200 rounded-2xl p-4 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-800">এনআইডি সামনের পৃষ্ঠা (Front Side)</span>
            {formData.nidFrontUrl && (
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> আপলোড হয়েছে
              </span>
            )}
          </div>

          <div
            onClick={() => nidFrontInputRef.current?.click()}
            className="border-2 border-dashed border-stone-200 hover:border-emerald-400 rounded-xl p-4 text-center cursor-pointer transition-colors bg-stone-50/50"
          >
            {formData.nidFrontUrl ? (
              <div className="relative group">
                <img
                  src={formData.nidFrontUrl}
                  alt="NID Front"
                  referrerPolicy="no-referrer"
                  className="max-h-32 mx-auto rounded-lg object-contain shadow-xs"
                />
                <p className="text-[11px] text-stone-500 mt-2 underline group-hover:text-emerald-700">ছবি পরিবর্তন করুন</p>
              </div>
            ) : (
              <div className="py-2">
                <Upload className="w-6 h-6 text-stone-400 mx-auto mb-1" />
                <p className="text-xs text-stone-600 font-medium">ক্লিক করে ছবি আপলোড করুন</p>
                <p className="text-[10px] text-stone-400">JPG, PNG (সর্বোচ্চ 5MB)</p>
              </div>
            )}
            <input
              ref={nidFrontInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileUpload('nidFrontUrl', e.target.files[0]);
                }
              }}
            />
          </div>
        </div>

        {/* NID Back */}
        <div className="border border-stone-200 rounded-2xl p-4 bg-white space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-stone-800">এনআইডি পেছনের পৃষ্ঠা (Back Side)</span>
            {formData.nidBackUrl && (
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> আপলোড হয়েছে
              </span>
            )}
          </div>

          <div
            onClick={() => nidBackInputRef.current?.click()}
            className="border-2 border-dashed border-stone-200 hover:border-emerald-400 rounded-xl p-4 text-center cursor-pointer transition-colors bg-stone-50/50"
          >
            {formData.nidBackUrl ? (
              <div className="relative group">
                <img
                  src={formData.nidBackUrl}
                  alt="NID Back"
                  referrerPolicy="no-referrer"
                  className="max-h-32 mx-auto rounded-lg object-contain shadow-xs"
                />
                <p className="text-[11px] text-stone-500 mt-2 underline group-hover:text-emerald-700">ছবি পরিবর্তন করুন</p>
              </div>
            ) : (
              <div className="py-2">
                <Upload className="w-6 h-6 text-stone-400 mx-auto mb-1" />
                <p className="text-xs text-stone-600 font-medium">ক্লিক করে ছবি আপলোড করুন</p>
                <p className="text-[10px] text-stone-400">JPG, PNG (সর্বোচ্চ 5MB)</p>
              </div>
            )}
            <input
              ref={nidBackInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  handleFileUpload('nidBackUrl', e.target.files[0]);
                }
              }}
            />
          </div>
        </div>
      </div>

      {/* Selfie / Profile Photo Upload */}
      <div className="border border-stone-200 rounded-2xl p-4 bg-white space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-stone-800 flex items-center gap-1.5">
              <Camera className="w-4 h-4 text-emerald-600" />
              <span>পরিচ্ছন্ন প্রোফাইল ছবি / সেলফি (Profile Photo / Selfie)</span>
            </span>
            <p className="text-[11px] text-stone-400">মুখমণ্ডল স্পষ্টভাবে দৃশ্যমান এমন সাম্প্রতিক ছবি</p>
          </div>
          {formData.selfieUrl && (
            <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" /> নির্বাচিত
            </span>
          )}
        </div>

        <div
          onClick={() => selfieInputRef.current?.click()}
          className="border-2 border-dashed border-stone-200 hover:border-emerald-400 rounded-xl p-4 text-center cursor-pointer transition-colors bg-stone-50/50 flex flex-col sm:flex-row items-center justify-center gap-4"
        >
          {formData.selfieUrl ? (
            <img
              src={formData.selfieUrl}
              alt="Selfie"
              referrerPolicy="no-referrer"
              className="w-16 h-16 rounded-full object-cover border-2 border-emerald-500 shadow-sm"
            />
          ) : (
            <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center text-stone-400">
              <Camera className="w-6 h-6" />
            </div>
          )}
          <div className="text-left">
            <p className="text-xs font-bold text-stone-800">
              {formData.selfieUrl ? 'ছবি পরিবর্তন করতে ক্লিক করুন' : 'প্রোফাইল ছবি সিলেক্ট করুন'}
            </p>
            <p className="text-[11px] text-stone-400">স্মার্টফোন ক্যামেরা দিয়ে তোলা ছবি সাপোর্ট করে</p>
          </div>
          <input
            ref={selfieInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                handleFileUpload('selfieUrl', e.target.files[0]);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};
