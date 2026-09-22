import React from 'react';
import { Calendar, UserCheck, HelpCircle, Heart, Globe2, FileText, Info } from 'lucide-react';
import { RegistrationFormData } from '../../../types/registration';

interface StepPersonalDetailsProps {
  formData: RegistrationFormData;
  updateFormData: (fields: Partial<RegistrationFormData>) => void;
  errors: Record<string, string>;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const StepPersonalDetails: React.FC<StepPersonalDetailsProps> = ({
  formData,
  updateFormData,
  errors,
}) => {
  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="border-b border-stone-200 pb-3">
        <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
          <UserCheck className="w-5 h-5 text-emerald-600" />
          <span>ব্যক্তিগত বিবরণ (Personal Details)</span>
        </h3>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          আপনার পরিচয় নিশ্চিতকরণ ও নিরাপত্তা যাচাইয়ের জন্য ব্যক্তিগত তথ্য প্রদান করুন।
        </p>
      </div>

      {/* DOB & Gender */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Date of Birth */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-stone-800 mb-1.5">
            জন্ম তারিখ (Date of Birth) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Calendar className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            <input
              type="date"
              value={formData.dateOfBirth}
              onChange={(e) => updateFormData({ dateOfBirth: e.target.value })}
              className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm text-stone-900 focus:outline-none focus:ring-2 transition-all ${
                errors.dateOfBirth
                  ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                  : 'border-stone-200 focus:border-emerald-500 focus:ring-emerald-100 bg-white'
              }`}
            />
          </div>
          {errors.dateOfBirth && (
            <p className="text-xs text-red-600 mt-1">{errors.dateOfBirth}</p>
          )}
        </div>

        {/* Gender Selector */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-stone-800 mb-1.5">
            লিঙ্গ (Gender) <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[
              { id: 'male', label: 'পুরুষ (Male)' },
              { id: 'female', label: 'নারী (Female)' },
              { id: 'other', label: 'অন্যান্য' },
            ].map((g) => (
              <button
                key={g.id}
                type="button"
                onClick={() => updateFormData({ gender: g.id as any })}
                className={`py-2.5 px-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                  formData.gender === g.id
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500'
                    : 'border-stone-200 bg-white text-stone-700 hover:border-stone-300'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
          {errors.gender && (
            <p className="text-xs text-red-600 mt-1">{errors.gender}</p>
          )}
        </div>
      </div>

      {/* Nationality & Blood Group */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Nationality */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-stone-800 mb-1.5">
            জাতীয়তা (Nationality)
          </label>
          <div className="relative">
            <Globe2 className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={formData.nationality}
              onChange={(e) => updateFormData({ nationality: e.target.value })}
              placeholder="Bangladeshi"
              className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
            />
          </div>
        </div>

        {/* Blood Group */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs sm:text-sm font-semibold text-stone-800 flex items-center gap-1">
              <Heart className="w-3.5 h-3.5 text-rose-500" />
              <span>রক্তের গ্রুপ (Blood Group)</span>
            </label>
            <span className="text-[10px] text-stone-400 font-normal">ঐচ্ছিক (রক্তদানে কাজে লাগে)</span>
          </div>
          <select
            value={formData.bloodGroup || ''}
            onChange={(e) => updateFormData({ bloodGroup: e.target.value })}
            className="w-full px-3.5 py-2.5 rounded-xl border border-stone-200 text-sm text-stone-900 bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
          >
            <option value="">নির্বাচন করুন (ঐচ্ছিক)</option>
            {BLOOD_GROUPS.map((bg) => (
              <option key={bg} value={bg}>
                {bg}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Father's and Mother's Name (Tooltipped Sensitive/Optional fields) */}
      <div className="bg-stone-50/80 p-4 rounded-2xl border border-stone-200/80 space-y-4">
        <div className="flex items-start gap-2 text-stone-600">
          <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed text-stone-600">
            <strong>পিতা ও মাতার বিবরণ (ঐচ্ছিক):</strong> জাতীয় পরিচয়পত্র ভেরিফিকেশন ও প্রশাসনিক নথিপত্রের জন্য এটি ব্যবহৃত হয়। ক্ষেত্রগুলো বাধ্যতামূলক নয়।
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              পিতার নাম (Father's Name)
            </label>
            <input
              type="text"
              value={formData.fatherName || ''}
              onChange={(e) => updateFormData({ fatherName: e.target.value })}
              placeholder="পিতার নাম লিখুন"
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-900 bg-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-700 mb-1">
              মাতার নাম (Mother's Name)
            </label>
            <input
              type="text"
              value={formData.motherName || ''}
              onChange={(e) => updateFormData({ motherName: e.target.value })}
              placeholder="মাতার নাম লিখুন"
              className="w-full px-3 py-2 rounded-xl border border-stone-200 text-sm text-stone-900 bg-white focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Short Bio */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-stone-800 mb-1.5 flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-emerald-600" />
          <span>সংক্ষিপ্ত আত্মপরিচয় / বায়ো (About / Bio)</span>
        </label>
        <textarea
          rows={3}
          value={formData.bioBn || ''}
          onChange={(e) => updateFormData({ bioBn: e.target.value })}
          placeholder="আপনার কাজের অভিজ্ঞতা, বিশেষত্ব বা ক্যারিয়ার লক্ষ্য সম্পর্কে ৩-৪ লাইনে লিখুন..."
          className="w-full p-3 rounded-xl border border-stone-200 text-sm text-stone-900 bg-white focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
        />
        <p className="text-[11px] text-stone-400 text-right mt-1">সর্বোচ্চ ৬০০ অক্ষর</p>
      </div>
    </div>
  );
};
