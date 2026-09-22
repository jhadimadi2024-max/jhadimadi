import React from 'react';
import { 
  CheckCircle2, 
  Edit3, 
  User, 
  MapPin, 
  GraduationCap, 
  Briefcase, 
  Award, 
  FileCheck, 
  Globe, 
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { RegistrationFormData } from '../../../types/registration';
import { calculateCompletionPercentage } from '../../../hooks/useRegistrationDraft';

interface StepPreviewProps {
  formData: RegistrationFormData;
  onEditStep: (stepId: number) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  submissionError?: string | null;
}

export const StepPreview: React.FC<StepPreviewProps> = ({
  formData,
  onEditStep,
  onSubmit,
  isSubmitting,
  submissionError,
}) => {
  const completionPercentage = calculateCompletionPercentage(formData);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-stone-200 pb-3">
        <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>চূড়ান্ত পর্যালোচনা ও সাবমিশন (Preview & Submit)</span>
        </h3>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          সাবমিট করার পূর্বে সব তথ্য একবার যাচাই করে নিন। প্রয়োজনে যে কোনো ব্লকে "পরিবর্তন" এ ক্লিক করে আপডেট করতে পারেন।
        </p>
      </div>

      {/* Profile Completion Gauge */}
      <div className="bg-emerald-900 text-white rounded-2xl p-5 shadow-sm relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">
                প্রোফাইল পূর্ণতা স্কোর (Completeness Score)
              </span>
            </div>
            <h4 className="text-2xl font-black mt-1">
              {completionPercentage}% সম্পন্ন
            </h4>
            <p className="text-xs text-emerald-100/90 mt-0.5">
              {completionPercentage >= 85
                ? 'চমৎকার! আপনার প্রোফাইল ক্লায়েন্টদের সর্বোচ্চ আস্থা অর্জনের উপযোগী।'
                : 'প্রোফাইল যত বেশি বিস্তারিত হবে, কাজ পাওয়ার সম্ভাবনা তত বৃদ্ধি পাবে।'}
            </p>
          </div>

          <div className="w-full sm:w-48 bg-emerald-950/60 rounded-full h-3 p-0.5 border border-emerald-700">
            <div
              className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all duration-500"
              style={{ width: `${completionPercentage}%` }}
            />
          </div>
        </div>
      </div>

      {/* Error Banner if any */}
      {submissionError && (
        <div className="p-4 rounded-2xl bg-red-50 border border-red-300 text-red-700 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
          <div className="text-xs sm:text-sm">
            <p className="font-bold">সাবমিশনে ত্রুটি হয়েছে:</p>
            <p className="mt-0.5">{submissionError}</p>
          </div>
        </div>
      )}

      {/* SUMMARY SECTIONS */}
      <div className="space-y-4">
        {/* Block 1: Basic Info */}
        <div className="p-4 rounded-2xl border border-stone-200 bg-white hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <h5 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              <span>প্রাথমিক অ্যাকাউন্ট তথ্য</span>
            </h5>
            <button
              type="button"
              onClick={() => onEditStep(1)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>সম্পাদনা</span>
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-stone-700">
            <div>
              <span className="text-stone-400 block">ধরণ:</span>
              <span className="font-semibold">{formData.accountType}</span>
            </div>
            <div>
              <span className="text-stone-400 block">নাম:</span>
              <span className="font-semibold">{formData.fullName || '—'}</span>
            </div>
            <div>
              <span className="text-stone-400 block">মোবাইল:</span>
              <span className="font-mono font-semibold">{formData.phone || '—'}</span>
            </div>
            <div>
              <span className="text-stone-400 block">ইমেইল:</span>
              <span className="font-semibold truncate block">{formData.email || '—'}</span>
            </div>
          </div>
        </div>

        {/* Block 2: Personal Details */}
        <div className="p-4 rounded-2xl border border-stone-200 bg-white hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <h5 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <User className="w-4 h-4 text-emerald-600" />
              <span>ব্যক্তিগত বিবরণ</span>
            </h5>
            <button
              type="button"
              onClick={() => onEditStep(2)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>সম্পাদনা</span>
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs text-stone-700">
            <div>
              <span className="text-stone-400 block">জন্ম তারিখ:</span>
              <span className="font-semibold">{formData.dateOfBirth || '—'}</span>
            </div>
            <div>
              <span className="text-stone-400 block">লিঙ্গ:</span>
              <span className="font-semibold capitalize">{formData.gender || '—'}</span>
            </div>
            <div>
              <span className="text-stone-400 block">জাতীয়তা:</span>
              <span className="font-semibold">{formData.nationality}</span>
            </div>
            <div>
              <span className="text-stone-400 block">রক্তের গ্রুপ:</span>
              <span className="font-semibold">{formData.bloodGroup || '—'}</span>
            </div>
          </div>
          {formData.bioBn && (
            <p className="text-xs text-stone-600 mt-2 bg-stone-50 p-2 rounded-xl">
              <strong>বায়ো:</strong> {formData.bioBn}
            </p>
          )}
        </div>

        {/* Block 3: Address */}
        <div className="p-4 rounded-2xl border border-stone-200 bg-white hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between mb-2">
            <h5 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <MapPin className="w-4 h-4 text-emerald-600" />
              <span>ঠিকানা ও অবস্থান</span>
            </h5>
            <button
              type="button"
              onClick={() => onEditStep(3)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>সম্পাদনা</span>
            </button>
          </div>
          <div className="text-xs text-stone-700 space-y-1">
            <p>
              <strong className="text-stone-900">স্থায়ী ঠিকানা:</strong> {formData.permanentAddress.villageOrMahalla},{' '}
              {formData.permanentAddress.upazila}, {formData.permanentAddress.district},{' '}
              {formData.permanentAddress.division}
            </p>
            {!formData.presentAddressSameAsPermanent && (
              <p>
                <strong className="text-stone-900">বর্তমান ঠিকানা:</strong> {formData.presentAddress.villageOrMahalla},{' '}
                {formData.presentAddress.upazila}, {formData.presentAddress.district},{' '}
                {formData.presentAddress.division}
              </p>
            )}
          </div>
        </div>

        {/* Block 4: Education & Experience */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Education */}
          <div className="p-4 rounded-2xl border border-stone-200 bg-white">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-bold text-stone-900 text-xs sm:text-sm flex items-center gap-1.5">
                <GraduationCap className="w-4 h-4 text-emerald-600" />
                <span>শিক্ষাগত যোগ্যতা ({formData.educationList.length})</span>
              </h5>
              <button
                type="button"
                onClick={() => onEditStep(4)}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                সম্পাদনা
              </button>
            </div>
            {formData.educationList.length > 0 ? (
              <ul className="text-xs text-stone-700 space-y-1">
                {formData.educationList.map((edu, i) => (
                  <li key={i} className="truncate">
                    &bull; <strong>{edu.degree}</strong> - {edu.institution} ({edu.passingYear})
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-stone-400">যুক্ত করা হয়নি</p>
            )}
          </div>

          {/* Experience */}
          <div className="p-4 rounded-2xl border border-stone-200 bg-white">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-bold text-stone-900 text-xs sm:text-sm flex items-center gap-1.5">
                <Briefcase className="w-4 h-4 text-emerald-600" />
                <span>কাজের অভিজ্ঞতা ({formData.experienceList.length})</span>
              </h5>
              <button
                type="button"
                onClick={() => onEditStep(5)}
                className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
              >
                সম্পাদনা
              </button>
            </div>
            {formData.experienceList.length > 0 ? (
              <ul className="text-xs text-stone-700 space-y-1">
                {formData.experienceList.map((exp, i) => (
                  <li key={i} className="truncate">
                    &bull; <strong>{exp.designation}</strong> @ {exp.company}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs text-stone-400">ফ্রেশার / কোনো পূর্ব অভিজ্ঞতা দেওয়া হয়নি</p>
            )}
          </div>
        </div>

        {/* Block 5: Skills */}
        <div className="p-4 rounded-2xl border border-stone-200 bg-white">
          <div className="flex items-center justify-between mb-2">
            <h5 className="font-bold text-stone-900 text-sm flex items-center gap-2">
              <Award className="w-4 h-4 text-emerald-600" />
              <span>দক্ষতা ও সনদসমূহ</span>
            </h5>
            <button
              type="button"
              onClick={() => onEditStep(6)}
              className="text-xs font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>সম্পাদনা</span>
            </button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {formData.skillsList.map((s) => (
              <span
                key={s.id}
                className="text-xs font-medium px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200"
              >
                {s.name} ({s.level})
              </span>
            ))}
          </div>
        </div>

        {/* Block 6: Verification status */}
        <div className="p-4 rounded-2xl border border-stone-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs text-stone-700">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              ফোন ভেরিফিকেশন:{' '}
              {formData.isPhoneVerified ? (
                <strong className="text-emerald-700">সম্পন্ন [✓]</strong>
              ) : (
                <strong className="text-red-600">অসম্পন্ন</strong>
              )}
            </span>
          </div>
          <button
            type="button"
            onClick={() => onEditStep(9)}
            className="text-xs font-semibold text-emerald-700 hover:text-emerald-800"
          >
            পরিবর্তন
          </button>
        </div>
      </div>

      {/* FINAL SUBMIT BUTTON */}
      <div className="pt-4 border-t border-stone-200">
        <button
          type="button"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="w-full py-3.5 px-6 rounded-2xl bg-emerald-700 text-white font-bold text-base hover:bg-emerald-800 transition-all shadow-md hover:shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>প্রোফাইল জমা হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...</span>
            </>
          ) : (
            <>
              <span>চূড়ান্ত সাবমিশন করুন (Submit Application)</span>
              <ArrowRight className="w-5 h-5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
