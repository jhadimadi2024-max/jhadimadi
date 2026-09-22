import React from 'react';
import { User, Mail, Phone, Lock, Eye, EyeOff, ShieldAlert, CheckCircle2, Sparkles, Briefcase } from 'lucide-react';
import { RegistrationFormData, AccountType } from '../../../types/registration';

interface StepBasicInfoProps {
  formData: RegistrationFormData;
  updateFormData: (fields: Partial<RegistrationFormData>) => void;
  errors: Record<string, string>;
}

const ACCOUNT_TYPES: { id: AccountType; labelBn: string; labelEn: string; descBn: string; icon: string }[] = [
  {
    id: 'freelancer',
    labelBn: 'আইটি ও ফ্রিল্যান্সার',
    labelEn: 'IT & Freelancer',
    descBn: 'ওয়েব, ডিজাইন, সফটওয়্যার, কনটেন্ট রাইটিং বা রিমোট কাজ',
    icon: '💻',
  },
  {
    id: 'service_provider',
    labelBn: 'সার্ভিস টেকনিশিয়ান ও মিস্ত্রি',
    labelEn: 'Service Technician',
    descBn: 'ইলেকট্রিশিয়ান, প্লাম্বার, এসি টেকনিশিয়ান, রাজমিস্ত্রি বা হোম সার্ভিস',
    icon: '🔧',
  },
  {
    id: 'professional',
    labelBn: 'পেশাজীবী ও পরামর্শক',
    labelEn: 'Professional Consultant',
    descBn: 'আইনজীবী, শিক্ষক, হিসাববিদ, স্বাস্থ্য সহকারী বা উদ্যোক্তা',
    icon: '👔',
  },
  {
    id: 'member',
    labelBn: 'স্থায়ী মেম্বার / প্রতিনিধি',
    labelEn: 'Permanent Member',
    descBn: 'কমিউনিটি প্রতিনিধি, রক্তদাতা নেটওয়ার্ক ও স্থানীয় প্রতিনিধি',
    icon: '🤝',
  },
];

export const StepBasicInfo: React.FC<StepBasicInfoProps> = ({
  formData,
  updateFormData,
  errors,
}) => {
  const [showPass, setShowPass] = React.useState(false);
  const [showConfirmPass, setShowConfirmPass] = React.useState(false);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Info */}
      <div className="border-b border-stone-200 pb-3">
        <h3 className="text-lg font-bold text-stone-900 flex items-center gap-2">
          <User className="w-5 h-5 text-emerald-600" />
          <span>প্রাথমিক অ্যাকাউন্ট তথ্য (Basic Information)</span>
        </h3>
        <p className="text-xs sm:text-sm text-stone-500 mt-1">
          ঝাদিমাদি প্ল্যাটফর্মে আপনার প্রোফাইল তৈরি ও নিরাপদ লগইনের মূল তথ্যগুলো দিন।
        </p>
      </div>

      {/* Account Type Selector */}
      <div className="space-y-2">
        <label className="block text-xs sm:text-sm font-semibold text-stone-800">
          অ্যাকাউন্টের ধরণ নির্বাচন করুন <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {ACCOUNT_TYPES.map((type) => {
            const isSelected = formData.accountType === type.id;
            return (
              <button
                key={type.id}
                type="button"
                onClick={() => updateFormData({ 
                  accountType: type.id,
                  categoryBn: type.labelBn,
                  categoryEn: type.labelEn,
                })}
                className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 relative ${
                  isSelected
                    ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-500'
                    : 'border-stone-200 bg-white hover:border-emerald-300 hover:bg-stone-50/50'
                }`}
              >
                <span className="text-2xl shrink-0 select-none">{type.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-stone-900 text-sm">{type.labelBn}</span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">{type.descBn}</p>
                </div>
              </button>
            );
          })}
        </div>
        {errors.accountType && (
          <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5" />
            {errors.accountType}
          </p>
        )}
      </div>

      {/* Full Name & Phone in 2-col grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Full Name */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-stone-800 mb-1.5">
            আপনার পূর্ণ নাম (Full Name) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <User className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => updateFormData({ fullName: e.target.value })}
              placeholder="উদা: নয়ন চাকমা"
              className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 transition-all ${
                errors.fullName
                  ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                  : 'border-stone-200 focus:border-emerald-500 focus:ring-emerald-100 bg-white'
              }`}
            />
          </div>
          {errors.fullName && (
            <p className="text-xs text-red-600 mt-1">{errors.fullName}</p>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-stone-800 mb-1.5">
            মোবাইল নম্বর (Phone Number) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Phone className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => updateFormData({ phone: e.target.value.replace(/[^\d+]/g, '') })}
              placeholder="018XXXXXXXX"
              maxLength={11}
              className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 transition-all font-mono ${
                errors.phone
                  ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                  : 'border-stone-200 focus:border-emerald-500 focus:ring-emerald-100 bg-white'
              }`}
            />
          </div>
          <p className="text-[11px] text-stone-500 mt-1">১১ সংখ্যার সচল ব্যক্তিগত নম্বর দিন। এই নম্বরে ওটিপি পাঠানো হবে।</p>
          {errors.phone && (
            <p className="text-xs text-red-600 mt-0.5">{errors.phone}</p>
          )}
        </div>
      </div>

      {/* Email Address */}
      <div>
        <label className="block text-xs sm:text-sm font-semibold text-stone-800 mb-1.5">
          ইমেইল এড্রেস (Email Address) <span className="text-red-500">*</span>
        </label>
        <div className="relative">
          <Mail className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
          <input
            type="email"
            value={formData.email}
            onChange={(e) => updateFormData({ email: e.target.value })}
            placeholder="example@jhadimadi.com"
            className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 transition-all ${
              errors.email
                ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                : 'border-stone-200 focus:border-emerald-500 focus:ring-emerald-100 bg-white'
            }`}
          />
        </div>
        {errors.email && (
          <p className="text-xs text-red-600 mt-1">{errors.email}</p>
        )}
      </div>

      {/* Password & Confirm Password in 2-col grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Password */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-stone-800 mb-1.5">
            গোপন পাসওয়ার্ড (Password) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            <input
              type={showPass ? 'text' : 'password'}
              value={formData.password || ''}
              onChange={(e) => updateFormData({ password: e.target.value })}
              placeholder="কমপক্ষে ৬ অক্ষর"
              className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 transition-all ${
                errors.password
                  ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                  : 'border-stone-200 focus:border-emerald-500 focus:ring-emerald-100 bg-white'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-600"
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-600 mt-1">{errors.password}</p>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-xs sm:text-sm font-semibold text-stone-800 mb-1.5">
            পাসওয়ার্ড নিশ্চিতকরণ (Confirm Password) <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Lock className="w-4 h-4 text-stone-400 absolute left-3.5 top-3.5" />
            <input
              type={showConfirmPass ? 'text' : 'password'}
              value={formData.confirmPassword || ''}
              onChange={(e) => updateFormData({ confirmPassword: e.target.value })}
              placeholder="একই পাসওয়ার্ড পুনরায় লিখুন"
              className={`w-full pl-10 pr-10 py-2.5 rounded-xl border text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 transition-all ${
                errors.confirmPassword
                  ? 'border-red-400 focus:ring-red-200 bg-red-50/20'
                  : 'border-stone-200 focus:border-emerald-500 focus:ring-emerald-100 bg-white'
              }`}
            />
            <button
              type="button"
              onClick={() => setShowConfirmPass(!showConfirmPass)}
              className="absolute right-3.5 top-3 text-stone-400 hover:text-stone-600"
            >
              {showConfirmPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.confirmPassword && (
            <p className="text-xs text-red-600 mt-1">{errors.confirmPassword}</p>
          )}
        </div>
      </div>
    </div>
  );
};
