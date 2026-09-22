import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowLeft,
  Info,
  ShieldCheck,
  Heart,
  Briefcase,
  Users,
  MapPin,
  Phone,
  Mail,
  ExternalLink,
  Award,
  Sparkles,
  ShoppingBag,
  Wrench,
  Droplet,
  Languages
} from 'lucide-react';
import { Language } from '../types';

interface CompanyInfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language | 'bn' | 'en';
  onOpenPolicyCenter?: () => void;
}

export const CompanyInfoModal: React.FC<CompanyInfoModalProps> = ({
  isOpen,
  onClose,
  lang = 'bn',
  onOpenPolicyCenter,
}) => {
  const [modalLang, setModalLang] = useState<'bn' | 'en'>((lang as 'bn' | 'en') || 'bn');
  const isEn = modalLang === 'en';

  useEffect(() => {
    if (lang) {
      setModalLang((lang as 'bn' | 'en') || 'bn');
    }
  }, [lang]);

  // Handle ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleLanguage = () => {
    setModalLang((prev) => (prev === 'bn' ? 'en' : 'bn'));
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="Jhadimadi.com Company Background & Mission"
      id="company-info-modal-backdrop"
    >
      <div 
        id="company-info-modal-card"
        className="relative w-full max-w-3xl h-[92vh] max-h-[820px] bg-white rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-stone-200 text-stone-800"
      >
        {/* Header with BN/EN toggle and Back button */}
        <div className="bg-gradient-to-r from-[#065f46] via-[#0A6A32] to-[#10b981] text-white p-3.5 sm:p-4.5 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Back Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white transition cursor-pointer flex items-center gap-1 text-xs font-bold shrink-0 border border-white/20"
              title={isEn ? 'Back' : 'পেছনে যান'}
              aria-label={isEn ? 'Back' : 'পেছনে যান'}
              id="btn-company-modal-back"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
              <span className="hidden min-[380px]:inline">{isEn ? 'Back' : 'ফিরে যান'}</span>
            </button>

            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white p-1 shadow-sm flex items-center justify-center shrink-0 border border-emerald-300">
              <img 
                src="https://i.ibb.co.com/sppWZhc9/logo33.png"
                alt="Jhadimadi Runner"
                className="w-full h-full object-contain"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = "/runner-logo.png";
                }}
              />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm sm:text-base font-black tracking-tight text-white font-sans drop-shadow-xs truncate">
                  JHADIMADI.COM
                </h2>
                <span className="text-[9px] bg-amber-400 text-stone-900 font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider shrink-0">
                  {isEn ? 'Official' : 'পরিচিতি'}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-emerald-100 font-medium truncate mt-0.5">
                {isEn ? 'Company Background, Mission & Platform' : 'কোম্পানি পরিচিতি, লক্ষ্য, মিশন ও সেবা'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* BN/EN Language Toggle */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="px-2.5 py-1 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white border border-white/25 text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-xs"
              title={isEn ? 'বাংলায় পড়ুন' : 'Read in English'}
              id="btn-company-modal-lang-toggle"
            >
              <Languages className="w-3.5 h-3.5 text-amber-300" />
              <span>{isEn ? 'বাংলা' : 'EN'}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
              aria-label="Close"
              id="btn-company-modal-close"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5 bg-[#faf9f6] text-stone-800 text-xs sm:text-sm">
          
          {/* Hero Company Card */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-[#065f46] shrink-0">
                <Info className="w-6 h-6 text-[#065f46]" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-stone-900 leading-tight">
                  {isEn ? 'About Jhadimadi.com' : 'ঝাদিমাদি ডটকম (JHADIMADI.COM)'}
                </h3>
                <p className="text-xs text-emerald-800 font-bold mt-0.5">
                  {isEn ? 'First & Premier Hill Tracts Super-App Platform' : 'পার্বত্য চট্টগ্রামের প্রথম ও শীর্ষস্থানীয় সর্বজনীন অনলাইন প্ল্যাটফর্ম'}
                </p>
              </div>
            </div>

            <p className="text-stone-700 leading-relaxed text-xs sm:text-[13px]">
              {isEn ? (
                <>
                  <strong>Jhadimadi.com</strong> is a pioneering multi-service community ecosystem founded in Khagrachhari Hill District, Bangladesh. Built to empower local producers, technicians, and everyday citizens, Jhadimadi bridges the gap between remote hill communities and modern digital commerce with trust, fair pricing, and seamless connectivity.
                </>
              ) : (
                <>
                  <strong>ঝাদিমাদি ডটকম</strong> খাগড়াছড়ি পার্বত্য জেলায় প্রতিষ্ঠিত পার্বত্য চট্টগ্রামের প্রথম ও সর্ববৃহৎ বহুমুখী অনলাইন সুপার-অ্যাপ প্ল্যাটফর্ম। স্থানীয় চাষি, ক্ষুদ্র উদ্যোক্তা, কারিগরি পেশাজীবী ও সাধারণ মানুষের সুবিধার্থে ঝাদিমাদি পাহাড়ি অঞ্চলকে প্রযুক্তির আধুনিক নেটওয়ার্কে যুক্ত করেছে।
                </>
              )}
            </p>

            {/* Slogan Banner */}
            <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 border border-emerald-200 rounded-xl p-3 text-center shadow-2xs">
              <span className="text-xs sm:text-sm font-black text-[#065f46] block tracking-wide">
                &ldquo;কোনো কাজই ছোট নয়, সব পেশায় সম্মান&rdquo;
              </span>
              <span className="text-[10px] sm:text-[11px] text-stone-500 font-semibold block mt-0.5 uppercase tracking-wider">
                {isEn ? '— Jhadimadi Social Empowerment & Dignity Mission' : '— ঝাদিমাদি সামাজিক মর্যাদা ও কর্মসংস্থান মিশন'}
              </span>
            </div>
          </div>

          {/* Mission, Vision & Core Values */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {/* Mission */}
            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-[#065f46]">
                <Award className="w-4 h-4 text-emerald-600" />
                <h4 className="font-black text-xs sm:text-sm text-stone-900">
                  {isEn ? 'Our Mission (আমাদের লক্ষ্য)' : 'আমাদের লক্ষ্য ও মিশন'}
                </h4>
              </div>
              <p className="text-stone-600 text-xs leading-relaxed">
                {isEn 
                  ? 'To eradicate intermediaries and give hill tract farmers fair prices for pure honey, turmeric, fruits, and indigenous handicrafts, while providing dignified, transparent digital job opportunities to youth.'
                  : 'মধ্যস্বত্বভোগী ছাড়াই পাহাড়ি ফলমূল, খাঁটি মধু, হলুদ ও ঐতিহ্যবাহী হস্তশিল্প সারা দেশের মানুষের কাছে পৌঁছে দেওয়া এবং দক্ষ যুবসমাজের জন্য স্বচ্ছ ও নির্ভরযোগ্য ডিজিটাল কর্মসংস্থান সৃষ্টি করা।'}
              </p>
            </div>

            {/* Vision */}
            <div className="bg-white border border-stone-200 rounded-2xl p-4 shadow-xs space-y-2">
              <div className="flex items-center gap-2 text-[#065f46]">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h4 className="font-black text-xs sm:text-sm text-stone-900">
                  {isEn ? 'Our Vision (আমাদের ভিশন)' : 'আমাদের দীর্ঘমেয়াদী রূপকল্প'}
                </h4>
              </div>
              <p className="text-stone-600 text-xs leading-relaxed">
                {isEn
                  ? 'To become the most reliable, secure, and technologically advanced digital backbone for commerce, technical services, and humanitarian emergency blood response across all 3 Hill Districts and Bangladesh.'
                  : 'তিন পার্বত্য জেলাসহ সমগ্র বাংলাদেশে বাণিজ্য, দক্ষ গৃহসেবা, জরুরি রক্তদাতা সংযোগ ও নির্ভরযোগ্য তথ্যের সবচেয়ে বিশ্বস্ত ও প্রযুক্তিগতভাবে অগ্রগামী প্ল্যাটফর্ম গড়ে তোলা।'}
              </p>
            </div>
          </div>

          {/* Platform Pillars */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <h4 className="font-black text-xs sm:text-sm text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-2">
              <Briefcase className="w-4 h-4 text-[#065f46]" />
              <span>{isEn ? 'Core Platform Pillars' : 'ঝাদিমাদির প্রধান ৪টি প্ল্যাটফর্ম স্তম্ভ'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 space-y-1">
                <div className="flex items-center gap-2 text-[#065f46] font-bold">
                  <ShoppingBag className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{isEn ? 'Authentic Marketplace' : '১. খাঁটি পাহাড়ি পণ্যের হাট'}</span>
                </div>
                <p className="text-stone-600 text-[11.5px] leading-relaxed">
                  {isEn 
                    ? 'Direct-from-source raw honey, turmeric, ginger, hill fruits, and indigenous textiles with Cash on Delivery.'
                    : 'খাঁটি পাহাড়ি মধু, জুমের ফল, হলুদ, ঐতিহ্যবাহী থামি ও পোশাক সরাসরি খাগড়াছড়ি ও পাহাড়ি বাগান থেকে হোম ডেলিভারি।'}
                </p>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 space-y-1">
                <div className="flex items-center gap-2 text-[#065f46] font-bold">
                  <Wrench className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{isEn ? 'Skilled Technician Services' : '২. দক্ষ কারিগরি পেশাজীবী সেবা'}</span>
                </div>
                <p className="text-stone-600 text-[11.5px] leading-relaxed">
                  {isEn
                    ? 'Verified electricians, mechanics, plumbers, computer technicians, and painters with secure escrow protection.'
                    : 'যাচাইকৃত ইলেকট্রিশিয়ান, প্লাম্বার, মেকানিক ও টেকনিশিয়ান কলিং এবং নিরাপদ কাজের নিশ্চয়তা।'}
                </p>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 space-y-1">
                <div className="flex items-center gap-2 text-rose-700 font-bold">
                  <Droplet className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{isEn ? 'Emergency Blood Network' : '৩. জরুরি লাইভ রক্তদাতা নেটওয়ার্ক'}</span>
                </div>
                <p className="text-stone-600 text-[11.5px] leading-relaxed">
                  {isEn
                    ? '100% voluntary, free emergency blood donor connection system searchable by blood group, district, and upazila.'
                    : 'রক্তের গ্রুপ, জেলা ও উপজেলা অনুযায়ী সম্পূর্ণ বিনামূল্যে তাৎক্ষণিক রক্তদাতা খুঁজে পাওয়ার মানবিক ব্যবস্থা।'}
                </p>
              </div>

              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/80 space-y-1">
                <div className="flex items-center gap-2 text-amber-700 font-bold">
                  <Users className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{isEn ? 'Career & Job Opportunities' : '৪. চাকরি ও ক্যারিয়ার সার্কুলার'}</span>
                </div>
                <p className="text-stone-600 text-[11.5px] leading-relaxed">
                  {isEn
                    ? 'Local business job postings, professional technician registration, and direct employment linkage.'
                    : 'স্থানীয় ব্যবসা ও সংস্থায় চাকরির বিজ্ঞপ্তি, প্রফেশনাল টেকনিশিয়ান রেজিস্ট্রেশন ও ক্যারিয়ার সহায়তা।'}
                </p>
              </div>
            </div>
          </div>

          {/* Company Leadership & Official Contacts */}
          <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3">
            <h4 className="font-black text-xs sm:text-sm text-stone-900 flex items-center gap-2 border-b border-stone-100 pb-2">
              <MapPin className="w-4 h-4 text-[#065f46]" />
              <span>{isEn ? 'Headquarters & Official Contacts' : 'অফিশিয়াল হেড অফিস ও যোগাযোগ'}</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-stone-700">
              <div className="flex items-start gap-2.5 p-2.5 bg-stone-50 rounded-xl">
                <Users className="w-4 h-4 text-[#065f46] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-stone-500 font-bold block uppercase">
                    {isEn ? 'Founder & CEO' : 'প্রতিষ্ঠাতা ও প্রধান নির্বাহী'}
                  </span>
                  <span className="font-bold text-stone-900 text-xs">
                    {isEn ? 'Nayan Chakma (নয়ন চাকমা)' : 'নয়ন চাকমা'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 bg-stone-50 rounded-xl">
                <MapPin className="w-4 h-4 text-[#065f46] shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] text-stone-500 font-bold block uppercase">
                    {isEn ? 'Head Office Location' : 'প্রধান কার্যালয়ের ঠিকানা'}
                  </span>
                  <span className="font-bold text-stone-900 text-xs">
                    {isEn ? 'Khagrachhari Sadar, Khagrachhari Hill District, Bangladesh' : 'খাগড়াছড়ি সদর, খাগড়াছড়ি পার্বত্য জেলা, বাংলাদেশ'}
                  </span>
                </div>
              </div>

              <a 
                href="https://wa.me/8801870592699" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="flex items-start gap-2.5 p-2.5 bg-emerald-50/70 hover:bg-emerald-100/70 rounded-xl border border-emerald-200 transition-colors group cursor-pointer"
              >
                <Phone className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[10px] text-emerald-800 font-bold block uppercase">
                    {isEn ? 'Helpline & WhatsApp' : 'অফিশিয়াল হেল্পলাইন ও হোয়াটসঅ্যাপ'}
                  </span>
                  <span className="font-bold text-emerald-900 text-xs group-hover:underline">
                    01870592699
                  </span>
                </div>
              </a>

              <a 
                href="mailto:Jhadimadi2024@gmail.com" 
                className="flex items-start gap-2.5 p-2.5 bg-emerald-50/70 hover:bg-emerald-100/70 rounded-xl border border-emerald-200 transition-colors group cursor-pointer"
              >
                <Mail className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
                <div className="min-w-0">
                  <span className="text-[10px] text-emerald-800 font-bold block uppercase">
                    {isEn ? 'Official Email' : 'অফিশিয়াল ইমেইল'}
                  </span>
                  <span className="font-bold text-emerald-900 text-xs truncate block group-hover:underline">
                    Jhadimadi2024@gmail.com
                  </span>
                </div>
              </a>
            </div>
          </div>

          {/* Action Card: Open Policy Center */}
          {onOpenPolicyCenter && (
            <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-stone-50 to-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5">
                <ShieldCheck className="w-5 h-5 text-[#065f46] shrink-0" />
                <div>
                  <span className="text-xs font-black text-stone-900 block">
                    {isEn ? 'Official Trust, Legal & Privacy Policies' : 'অফিশিয়াল নীতিমালা, আইনি ও নিরাপত্তা তথ্য'}
                  </span>
                  <span className="text-[11px] text-stone-600">
                    {isEn 
                      ? 'Read customer protection, courier, return, and privacy rules' 
                      : 'প্রাইভেসি, কুরিয়ার, রিটার্ন ও লেনদেন সুরক্ষার পূর্ণাঙ্গ নিয়মাবলী পড়ুন'}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPolicyCenter();
                }}
                className="w-full sm:w-auto px-4 py-2 bg-[#065f46] hover:bg-[#0A6A32] text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer shrink-0"
              >
                {isEn ? 'View Policy Center' : 'নীতিমালা ও নিরাপত্তা দেখুন'}
              </button>
            </div>
          )}

          {/* Footer Copyright */}
          <div className="text-center py-2 text-stone-400 text-[11px]">
            &copy; {new Date().getFullYear()} Jhadimadi.com (ঝাদিমাদি ডটকম). All rights reserved.
          </div>

        </div>
      </div>
    </div>
  );
};

export default CompanyInfoModal;
