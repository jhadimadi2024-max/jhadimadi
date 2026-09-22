import React, { useState, useEffect } from 'react';
import {
  Shield,
  X,
  Lock,
  Trash2,
  Phone,
  Mail,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  FileText,
  UserCheck,
  Baby,
  HeartHandshake,
  ShoppingBag,
  Layers,
  Flag,
  ChevronRight,
  ExternalLink,
  Info,
  ArrowLeft,
  Languages,
  Truck,
  RotateCcw,
  Droplet,
  Scale,
  Sparkles
} from 'lucide-react';
import { Language } from '../types';

export type PolicySection =
  | 'overview'
  | 'legal'
  | 'privacy'
  | 'safety'
  | 'courier'
  | 'return'
  | 'blood'
  | 'identity'
  | 'security'
  | 'children'
  | 'women'
  | 'ugc'
  | 'marketplace'
  | 'compliance'
  | 'deletion';

interface PolicyCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  lang?: Language | 'bn' | 'en';
  initialSection?: PolicySection;
  onOpenAccountDeletion?: () => void;
}

export const PolicyCenterModal: React.FC<PolicyCenterModalProps> = ({
  isOpen,
  onClose,
  lang = 'bn',
  initialSection = 'overview',
  onOpenAccountDeletion,
}) => {
  const [activeSection, setActiveSection] = useState<PolicySection>(initialSection);
  const [modalLang, setModalLang] = useState<'bn' | 'en'>((lang as 'bn' | 'en') || 'bn');
  const isEn = modalLang === 'en';

  useEffect(() => {
    if (lang) {
      setModalLang((lang as 'bn' | 'en') || 'bn');
    }
  }, [lang]);

  useEffect(() => {
    if (initialSection) {
      setActiveSection(initialSection);
    }
  }, [initialSection]);

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

  const navItems: { id: PolicySection; labelBn: string; labelEn: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'overview', labelBn: 'নীতিমালার সারসংক্ষেপ', labelEn: 'Policy Overview', icon: FileText },
    { id: 'legal', labelBn: 'আইনি ও শর্তাবলী', labelEn: 'Legal & Terms', icon: Scale },
    { id: 'privacy', labelBn: 'প্রাইভেসি ও ডেটা সুরক্ষা', labelEn: 'Privacy & Data', icon: Shield },
    { id: 'safety', labelBn: 'গ্রাহক ও লেনদেন সুরক্ষা', labelEn: 'Safety & Protection', icon: Lock },
    { id: 'courier', labelBn: 'কুরিয়ার ও ডেলিভারি নীতিমালা', labelEn: 'Courier & Delivery', icon: Truck },
    { id: 'return', labelBn: 'রিটার্ন ও রিফান্ড নীতি', labelEn: 'Return & Refund', icon: RotateCcw },
    { id: 'blood', labelBn: 'রক্তদান নীতিমালা ও স্বেচ্ছাসেবা', labelEn: 'Blood Donation Policy', icon: Droplet },
    { id: 'identity', labelBn: 'পরিচয়পত্র ও সংবেদনশীল তথ্য', labelEn: 'Identity & Sensitive Info', icon: UserCheck },
    { id: 'children', labelBn: 'শিশু ও নারী সুরক্ষা', labelEn: "Children & Women Safety", icon: Baby },
    { id: 'ugc', labelBn: 'কনটেন্ট ও কমিউনিটি রুলস', labelEn: 'UGC & Community Rules', icon: Flag },
    { id: 'marketplace', labelBn: 'পণ্য ও সেবা লেনদেন নীতি', labelEn: 'Marketplace Rules', icon: ShoppingBag },
    { id: 'deletion', labelBn: 'অ্যাকাউন্ট ও ডেটা ডিলিট', labelEn: 'Account Deletion', icon: Trash2 },
  ];

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-xs animate-fadeIn"
      role="dialog"
      aria-modal="true"
      aria-label="Jhadimadi Policy Center"
      id="policy-center-modal-backdrop"
    >
      <div 
        id="policy-center-modal-card"
        className="relative w-full max-w-4xl h-[92vh] max-h-[850px] bg-white rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-stone-200 text-stone-800"
      >
        {/* Top Header with Back button and BN/EN Toggle */}
        <div className="bg-gradient-to-r from-[#065f46] via-[#0A6A32] to-[#10b981] text-white p-3.5 sm:p-4 flex items-center justify-between shrink-0 shadow-xs">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Back Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white transition cursor-pointer flex items-center gap-1 text-xs font-bold shrink-0 border border-white/20"
              title={isEn ? 'Back' : 'পেছনে যান'}
              aria-label={isEn ? 'Back' : 'পেছনে যান'}
              id="btn-policy-modal-back"
            >
              <ArrowLeft className="w-4 h-4 text-white" />
              <span className="hidden min-[380px]:inline">{isEn ? 'Back' : 'ফিরে যান'}</span>
            </button>

            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/20 border border-white/25 flex items-center justify-center shrink-0">
              <Shield className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-amber-300" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-sm sm:text-base font-black tracking-tight text-white truncate">
                  {isEn ? 'Jhadimadi Policy Center' : 'ঝাদিমাদি পলিসি ও নিরাপত্তা সেন্টার'}
                </h2>
                <span className="text-[9px] uppercase font-extrabold bg-amber-400 text-stone-900 px-2 py-0.5 rounded-full shrink-0">
                  {isEn ? 'Trust & Legal' : 'অফিশিয়াল নীতি'}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-emerald-100 font-medium truncate mt-0.5">
                {isEn 
                  ? 'Legal, privacy, safety, courier, return & blood donation policies' 
                  : 'আইনি, প্রাইভেসি, সুরক্ষা, কুরিয়ার, রিটার্ন ও রক্তদান নীতিমালা'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            {/* BN/EN Language Switcher Toggle */}
            <button
              type="button"
              onClick={toggleLanguage}
              className="px-2.5 py-1 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 text-white border border-white/25 text-xs font-black transition cursor-pointer flex items-center gap-1 shadow-xs"
              title={isEn ? 'বাংলায় পড়ুন' : 'Read in English'}
              id="btn-policy-modal-lang-toggle"
            >
              <Languages className="w-3.5 h-3.5 text-amber-300" />
              <span>{isEn ? 'বাংলা' : 'EN'}</span>
            </button>

            {/* Close Button */}
            <button
              type="button"
              id="btn-close-policy-center"
              onClick={onClose}
              className="w-8 h-8 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 flex items-center justify-center text-white transition-colors cursor-pointer shrink-0"
              aria-label="Close"
            >
              <X className="w-4.5 h-4.5" />
            </button>
          </div>
        </div>

        {/* Horizontal Navigation Pills for Mobile / Tablet */}
        <div className="flex md:hidden items-center gap-1.5 px-3 py-2 bg-stone-50 border-b border-stone-200 overflow-x-auto shrink-0 text-xs font-bold no-scrollbar">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`px-3 py-1.5 rounded-xl whitespace-nowrap flex items-center gap-1.5 transition-all text-xs cursor-pointer ${
                  isActive 
                    ? 'bg-[#065f46] text-white font-bold shadow-xs' 
                    : 'bg-white border border-stone-200 text-stone-600 hover:bg-stone-100'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{isEn ? item.labelEn : item.labelBn}</span>
              </button>
            );
          })}
        </div>

        {/* Modal Main Body (2-Column Layout on Desktop) */}
        <div className="flex-1 flex overflow-hidden">
          
          {/* Desktop Left Sidebar Navigation */}
          <aside className="hidden md:flex w-64 flex-col bg-stone-50 border-r border-stone-200 shrink-0 p-3 space-y-1 overflow-y-auto">
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-stone-400 px-3 py-1">
              {isEn ? 'Policy Categories' : 'পলিসি সূচিপত্র'}
            </span>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all text-left cursor-pointer ${
                    isActive
                      ? 'bg-[#065f46] text-white font-bold shadow-xs'
                      : 'text-stone-700 hover:bg-stone-200/70'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-amber-300' : 'text-stone-500'}`} />
                    <span className="truncate">{isEn ? item.labelEn : item.labelBn}</span>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 shrink-0" />}
                </button>
              );
            })}
          </aside>

          {/* Right Main Content Panel */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-[#faf9f6] text-stone-800 text-xs sm:text-sm">
            
            {/* 1. OVERVIEW */}
            {activeSection === 'overview' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
                  <FileText className="w-5 h-5 text-[#065f46]" />
                  <h3 className="font-extrabold text-stone-900 text-sm sm:text-base">
                    {isEn ? 'Jhadimadi Trust & Policy Overview' : 'ঝাদিমাদি ট্রাস্ট ও নীতিমালার মূল সারসংক্ষেপ'}
                  </h3>
                </div>

                <p className="text-stone-700 leading-relaxed">
                  {isEn ? (
                    <>Welcome to the official Trust and Policy Center of <strong>JHADIMADI.COM</strong>. Our platform operates with uncompromising transparency, user safety, and adherence to legal frameworks, modern data privacy, and ethical community standards.</>
                  ) : (
                    <><strong>ঝাদিমাদি ডটকম (JHADIMADI.COM)</strong>-এর অফিসিয়াল পলিসি সেন্টারে আপনাকে স্বাগতম। আমাদের উদ্দেশ্য স্থানীয় উদ্যোক্তা, কারিগরি কর্মী এবং সাধারণ মানুষের মধ্যে একটি শতভাগ বিশ্বস্ত, স্বচ্ছ ও নিরাপদ ডিজিটাল সেতু তৈরি করা।</>
                  )}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{isEn ? 'Complete Privacy Protection' : 'ব্যক্তিগত তথ্যের শতভাগ সুরক্ষা'}</span>
                    </div>
                    <p className="text-stone-600 text-[11px] leading-relaxed">
                      {isEn ? 'We never sell your data to third parties. Sensitive information is kept behind strict security.' : 'আমরা কখনই তৃতীয় পক্ষের কাছে ব্যবহারকারীর তথ্য বিক্রি করি না। সংবেদনশীল তথ্য গোপন ও সুরক্ষিত রাখা হয়।'}
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{isEn ? 'Transparent Marketplace & COD' : 'স্বচ্ছ মার্কেটপ্লেস ও ক্যাশ অন ডেলিভারি'}</span>
                    </div>
                    <p className="text-stone-600 text-[11px] leading-relaxed">
                      {isEn ? 'Fair prices for organic hill products with reliable Cash on Delivery verification.' : 'খাঁটি পাহাড়ি পণ্য ন্যায্যমূল্যে ক্রয় এবং নিরাপদ ক্যাশ অন ডেলিভারি নিশ্চয়তা।'}
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{isEn ? '100% Free Blood Network' : 'সম্পূর্ণ বিনামূল্যে রক্তদান নেটওয়ার্ক'}</span>
                    </div>
                    <p className="text-stone-600 text-[11px] leading-relaxed">
                      {isEn ? 'Zero commercialization. Pure humanitarian emergency blood connection service.' : 'রক্তদানে কোনো প্রকার অর্থ দাবি নিষিদ্ধ। এটি একটি নিঃস্বার্থ মানবিক সেবা।'}
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-stone-200 shadow-2xs space-y-1">
                    <div className="flex items-center gap-1.5 text-emerald-800 font-bold text-xs">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>{isEn ? 'User Rights & Easy Deletion' : 'ব্যবহারকারীর অধিকার ও ডেটা ডিলিট'}</span>
                    </div>
                    <p className="text-stone-600 text-[11px] leading-relaxed">
                      {isEn ? 'Full control over your account. Delete your account and personal data anytime with 1-click.' : 'আপনার নিজের ডেটার উপর পূর্ণ নিয়ন্ত্রণ। এক ক্লিকেই অ্যাকাউন্ট ও যাবতীয় তথ্য চিরতরে মুছে ফেলার সুবিধা।'}
                    </p>
                  </div>
                </div>

                <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl text-[11px] text-stone-700 flex items-center gap-2">
                  <Info className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>
                    {isEn 
                      ? 'Latest policy revision: September 2026. Aligned with modern consumer rights and digital privacy.' 
                      : 'সর্বশেষ পলিসি রিভিশন: সেপ্টেম্বর ২০২৬। ডিজিটাল নিরাপত্তা ও ভোক্তা অধিকারের সাথে সামঞ্জস্য রেখে পরিচালিত।'}
                  </span>
                </div>
              </div>
            )}

            {/* 2. LEGAL & TERMS */}
            {activeSection === 'legal' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
                  <Scale className="w-5 h-5 text-[#065f46]" />
                  <h3 className="font-extrabold text-stone-900 text-sm sm:text-base">
                    {isEn ? 'Legal Terms of Service & Compliance' : 'আইনি নীতিমালা ও ব্যবহারের শর্তাবলী (Legal & Terms)'}
                  </h3>
                </div>

                <div className="space-y-3 text-xs text-stone-700">
                  <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                    <h4 className="font-bold text-stone-900 text-xs">
                      {isEn ? '1. Acceptance of Terms' : '১. শর্তাবলীর গ্রহণযোগ্যতা ও চুক্তিবদ্ধতা:'}
                    </h4>
                    <p className="text-stone-600 text-[11.5px] leading-relaxed">
                      {isEn 
                        ? 'By accessing, registering, or using Jhadimadi.com, users agree to abide by these Terms of Service. If you do not agree with any clause, please refrain from using the platform.'
                        : 'ঝাদিমাদি ডটকম ব্যবহার, নিবন্ধন বা অর্ডার প্রদানের মাধ্যমে ব্যবহারকারী এই নীতিমালা ও শর্তাবলী মেনে নিতে সম্মত হন। কোনো শর্তে আপত্তি থাকলে প্ল্যাটফর্ম ব্যবহার থেকে বিরত থাকার অনুরোধ করা হলো।'}
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                    <h4 className="font-bold text-stone-900 text-xs">
                      {isEn ? '2. Lawful Use & Prohibited Activities' : '২. বৈধ ব্যবহার ও নিষিদ্ধ কার্যক্রম:'}
                    </h4>
                    <p className="text-stone-600 text-[11.5px] leading-relaxed">
                      {isEn
                        ? 'Users must not use the platform for fraud, posting illegal items, impersonation, hate speech, or extortion. Violations result in immediate termination and referral to law enforcement.'
                        : 'প্ল্যাটফর্মে যেকোনো ধরনের প্রতারণা, অনুমোদনহীন দ্রব্য বিক্রয়, ধর্মীয় বা জাতিগত বিদ্বেষ ছড়ানো, চাঁদাবাজি বা মিথ্যা পরিচয়ে নিবন্ধন সম্পূর্ণ নিষিদ্ধ। আইন অমান্যকারীর বিরুদ্ধে তাত্ক্ষণিক অ্যাকাউন্ট স্থগিত ও আইনানুগ ব্যবস্থা নেওয়া হবে।'}
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                    <h4 className="font-bold text-stone-900 text-xs">
                      {isEn ? '3. Limitation of Liability' : '৩. দায়বদ্ধতার সীমাবদ্ধতা (Limitation of Liability):'}
                    </h4>
                    <p className="text-stone-600 text-[11.5px] leading-relaxed">
                      {isEn
                        ? 'Jhadimadi facilitates direct connections between independent buyers, sellers, service providers, and blood donors. While we perform screening, transactions are entered into at the parties\' own discernment.'
                        : 'ঝাদিমাদি স্বাধীন ক্রেতা, বিক্রেতা, টেকনিশিয়ান ও রক্তদাতাদের মধ্যে সংযোগ স্থাপনকারী প্ল্যাটফর্ম। আমরা সর্বোচ্চ সতর্কতা ও স্ক্রিনিং বজায় রাখি, তবে সরাসরি লেনদেনে উভয় পক্ষকে পারস্পরিক সতর্কতা অবলম্বনের আহ্বান জানানো হয়।'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 3. PRIVACY & DATA */}
            {activeSection === 'privacy' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
                  <Shield className="w-5 h-5 text-[#065f46]" />
                  <h3 className="font-extrabold text-stone-900 text-sm sm:text-base">
                    {isEn ? 'Privacy & Personal Data Protection' : 'প্রাইভেসি ও ব্যক্তিগত ডেটা সুরক্ষা নীতিমালা (Privacy Policy)'}
                  </h3>
                </div>

                <div className="space-y-3 text-xs text-stone-700">
                  <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                    <h4 className="font-bold text-stone-900 text-xs">
                      {isEn ? '1. Information We Collect' : '১. সংগৃহীত তথ্যের পরিধি (Data Collection):'}
                    </h4>
                    <ul className="list-disc list-inside space-y-1 pl-1 text-stone-600 text-[11.5px]">
                      <li><strong>{isEn ? 'Profile Info:' : 'প্রোফাইল তথ্য:'}</strong> {isEn ? 'Name, mobile phone number, district, upazila, and optional avatar.' : 'নাম, সচল মোবাইল নম্বর, জেলা, উপজেলা এবং প্রোফাইল ছবি।'}</li>
                      <li><strong>{isEn ? 'Order Data:' : 'অর্ডার ও ডেলিভারি তথ্য:'}</strong> {isEn ? 'Shipping address, courier pick-up notes, and Cash on Delivery order history.' : 'ডেলিভারি ঠিকানা, নির্বাচিত কুরিয়ার পয়েন্ট এবং ক্যাশ অন ডেলিভারি রেকর্ড।'}</li>
                      <li><strong>{isEn ? 'No Secret Sale:' : 'কোনো তথ্য বিক্রি নয়:'}</strong> {isEn ? 'We never sell personal numbers or data to telemarketers or advertisers.' : 'আমরা কোনো বিজ্ঞাপন সংস্থা বা টেলি-মার্কেটারের কাছে ব্যবহারকারীর ফোন বা ডেটা বিক্রি করি না।'}</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                    <h4 className="font-bold text-stone-900 text-xs">
                      {isEn ? '2. Artificial Intelligence & Privacy' : '২. এআই ও জেমিনি ইন্টারঅ্যাকশন সুরক্ষা:'}
                    </h4>
                    <p className="text-stone-600 text-[11.5px] leading-relaxed">
                      {isEn
                        ? 'Jhadimadi AI does not store sensitive government IDs, passwords, or banking credentials. Conversational queries are processed securely for helpful customer service assistance only.'
                        : 'আমাদের স্মার্ট এআই অ্যাসিস্ট্যান্ট ব্যবহারকারীর সাধারণ অনুসন্ধানের উত্তর দিতে ব্যবহৃত হয়। এআই-তে কোনো ব্যাংক পাসওয়ার্ড বা গোপন পরিচয়পত্র সংরক্ষণ বা প্রক্রিয়াজাত করা হয় না।'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 4. SAFETY & PROTECTION */}
            {activeSection === 'safety' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
                  <Lock className="w-5 h-5 text-[#065f46]" />
                  <h3 className="font-extrabold text-stone-900 text-sm sm:text-base">
                    {isEn ? 'Customer, Marketplace & Anti-Fraud Safety' : 'গ্রাহক, লেনদেন ও অ্যান্টি-ফ্রড নিরাপত্তা (Safety Policy)'}
                  </h3>
                </div>

                <div className="space-y-3 text-xs text-stone-700">
                  <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                    <h4 className="font-bold text-stone-900 text-xs">
                      {isEn ? '1. Escrow & Cash On Delivery Protection' : '১. নিরাপদ ক্যাশ অন ডেলিভারি (COD) নীতি:'}
                    </h4>
                    <p className="text-stone-600 text-[11.5px] leading-relaxed">
                      {isEn
                        ? 'To ensure 100% buyer protection, all products support Cash on Delivery. Never make unverified mobile banking payments to unverified third parties.'
                        : 'ক্রেতার সুরক্ষার্থে প্রতিটি পণ্যে ক্যাশ অন ডেলিভারি ব্যবস্থা সক্রিয়। কোনো অপরিচিত ব্যক্তির ব্যক্তিগত নম্বরে অগ্রিম সম্পূর্ণ টাকা পাঠানোর পূর্বে যাচাই করার পরামর্শ দেওয়া হয়।'}
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                    <h4 className="font-bold text-stone-900 text-xs">
                      {isEn ? '2. Technician Service Verification' : '২. টেকনিশিয়ান ও কারিগরি সেবার নিরাপত্তা:'}
                    </h4>
                    <p className="text-stone-600 text-[11.5px] leading-relaxed">
                      {isEn
                        ? 'Service providers are verified via phone and document screening. Customers can review ratings, feedback, and report any suspicious behavior.'
                        : 'সেবাদাতাদের মোবাইল নম্বর ও জাতীয় পরিচয়পত্র প্রাথমিক স্ক্রিনিং করা হয়। কাজের পূর্বে বাজেট নির্ধারণ ও কাজের শেষে মূল্য পরিশোধের পরামর্শ দেওয়া হয়।'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 5. COURIER & DELIVERY */}
            {activeSection === 'courier' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
                  <Truck className="w-5 h-5 text-[#065f46]" />
                  <h3 className="font-extrabold text-stone-900 text-sm sm:text-base">
                    {isEn ? 'Courier & Logistics Policy' : 'কুরিয়ার ও ডেলিভারি নীতিমালা (Courier & Logistics Policy)'}
                  </h3>
                </div>

                <div className="space-y-3 text-xs text-stone-700">
                  <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                    <h4 className="font-bold text-stone-900 text-xs">
                      {isEn ? '1. Delivery Coverage & Logistics Partners' : '১. ডেলিভারি কভারেজ ও কুরিয়ার পার্টনার:'}
                    </h4>
                    <p className="text-stone-600 text-[11.5px] leading-relaxed">
                      {isEn
                        ? 'Deliveries within Khagrachhari, Rangamati, and Bandarban are fulfilled via regional hubs and authorized riders. Nationwide shipments are dispatched via Sundarban Courier, SA Paribahan, RedX, and Steadfast.'
                        : 'খাগড়াছড়ি, রাঙ্গামাটি ও বান্দরবান পার্বত্য জেলার অভ্যন্তরীণ ডেলিভারি নিজস্ব রাইডার নেটওয়ার্ক এবং সারা বাংলাদেশের ডেলিভারি সুন্দরবন কুরিয়ার, এসএ পরিবহন, রেডএক্স বা স্টেডফাস্ট কুরিয়ারের মাধ্যমে পাঠানো হয়।'}
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                    <h4 className="font-bold text-stone-900 text-xs">
                      {isEn ? '2. Delivery Timeframes & Tracking' : '২. সম্ভাব্য ডেলিভারি সময়সীমা:'}
                    </h4>
                    <ul className="list-disc list-inside space-y-1 pl-1 text-stone-600 text-[11.5px]">
                      <li><strong>{isEn ? 'Khagrachhari Sadar & Hill Towns:' : 'খাগড়াছড়ি সদর ও নিকটবর্তী এলাকা:'}</strong> ২৪ থেকে ৪৮ ঘণ্টার মধ্যে ডেলিভারি।</li>
                      <li><strong>{isEn ? 'Dhaka & Chittagong Metros:' : 'ঢাকা ও চট্টগ্রাম মেট্রো:'}</strong> ৪৮ থেকে ৭২ ঘণ্টার মধ্যে ডেলিভারি।</li>
                      <li><strong>{isEn ? 'Other Districts & Upazilas:' : 'অন্যান্য জেলা ও প্রত্যন্ত উপজেলা:'}</strong> ৩ থেকে ৫ কার্যদিবসের মধ্যে কুরিয়ার পয়েন্টে পৌঁছায়।</li>
                    </ul>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                    <h4 className="font-bold text-stone-900 text-xs">
                      {isEn ? '3. Parcel Inspection upon Delivery' : '৩. পার্সেল রিসিভ ও আনবক্সিং ভিডিও নিয়ম:'}
                    </h4>
                    <p className="text-stone-600 text-[11.5px] leading-relaxed">
                      {isEn
                        ? 'We strongly recommend taking a clear unboxing video when opening your package. This ensures instant claims if any damage occurs in transit.'
                        : 'কুরিয়ার প্রতিনিধির কাছ থেকে পার্সেল গ্রহণের সময় প্যাকেটের বাহ্যিক অবস্থা যাচাই করুন এবং প্যাকেট খোলার সময় একটি সংক্ষিপ্ত ভিডিও ধারণ করে রাখুন। এটি ট্রানজিটে ক্ষতিপূরণ নিশ্চিত করে।'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 6. RETURN & REFUND */}
            {activeSection === 'return' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
                  <RotateCcw className="w-5 h-5 text-[#065f46]" />
                  <h3 className="font-extrabold text-stone-900 text-sm sm:text-base">
                    {isEn ? 'Return & Refund Policy' : 'রিটার্ন ও রিফান্ড নীতিমালা (Return & Refund Policy)'}
                  </h3>
                </div>

                <div className="space-y-3 text-xs text-stone-700">
                  <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                    <h4 className="font-bold text-stone-900 text-xs">
                      {isEn ? '1. 7-Day Easy Return Condition' : '১. ৭ দিনের সহজ রিটার্ন ও রিপ্লেসমেন্ট শর্তাবলী:'}
                    </h4>
                    <p className="text-stone-600 text-[11.5px] leading-relaxed">
                      {isEn
                        ? 'If you receive an incorrect product, defective handicraft, or damaged item, you may request a replacement or return within 7 calendar days of delivery.'
                        : 'যদি ভুল পণ্য ডেলিভারি হয়, ত্রুটিযুক্ত হস্তশিল্প বা ভাঙা পণ্য পৌঁছায়, তবে পণ্য প্রাপ্তির ৭ দিনের মধ্যে প্রমাণসহ আমাদের হেল্পলাইনে জানালে রিপ্লেসমেন্ট বা রিটার্ন প্রযোজ্য হবে।'}
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                    <h4 className="font-bold text-stone-900 text-xs">
                      {isEn ? '2. Perishable Hill Fruits & Organic Products' : '২. পাহাড়ি কাঁচা ফলমূল ও পচনশীল পণ্যের বিশেষ নিয়ম:'}
                    </h4>
                    <p className="text-stone-600 text-[11.5px] leading-relaxed">
                      {isEn
                        ? 'For fresh hill fruits (mangoes, pineapples, papayas) and raw perishables, any damage or quality complaints must be reported within 24 hours of receiving the shipment.'
                        : 'কাঁচা পাহাড়ি ফলমূল (আম, আনারস, পেঁপে) ও পচনশীল কৃষিপণ্যের ক্ষেত্রে ডেলিভারি পাওয়ার সর্বোচ্চ ২৪ ঘণ্টার মধ্যে ছবি/ভিডিও সহ অভিযোগ জানাতে হবে।'}
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                    <h4 className="font-bold text-stone-900 text-xs">
                      {isEn ? '3. Refund Processing Timeline' : '৩. রিফান্ড প্রক্রিয়াকরণ সময়সীমা:'}
                    </h4>
                    <p className="text-stone-600 text-[11.5px] leading-relaxed">
                      {isEn
                        ? 'Approved refunds are disbursed to the customer\'s bKash, Nagad, Rocket, or Bank account within 3 to 5 business days of returning the item.'
                        : 'অনুমোদিত রিফান্ডের অর্থ পণ্য ফেরত পাওয়ার পর ৩ থেকে ৫ কার্যদিবসের মধ্যে গ্রাহকের বিকাশ, নগদ, রকেট বা ব্যাংক অ্যাকাউন্টে পাঠিয়ে দেওয়া হয়।'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 7. BLOOD DONATION POLICY */}
            {activeSection === 'blood' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
                  <Droplet className="w-5 h-5 text-rose-600" />
                  <h3 className="font-extrabold text-stone-900 text-sm sm:text-base">
                    {isEn ? 'Blood Donation & Ethical Volunteer Policy' : 'জরুরি রক্তদান নীতিমালা ও মানবিক স্বেচ্ছাসেবা (Blood Donation Policy)'}
                  </h3>
                </div>

                <div className="bg-rose-50 border border-rose-200 p-3.5 rounded-xl space-y-1 text-rose-950">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-rose-800">
                    <AlertTriangle className="w-4 h-4" />
                    {isEn ? 'Strict Humanitarian Rule: Zero Commercialization' : 'কঠোর মানবিক অঙ্গীকার: রক্তদান সম্পূর্ণ নিঃস্বার্থ ও অবাণিজ্যিক'}
                  </span>
                  <p className="text-[11.5px] text-stone-700">
                    {isEn
                      ? 'Blood donation on Jhadimadi is 100% voluntary. Demanding or offering money for blood is strictly illegal and will lead to an immediate ban and legal reporting.'
                      : 'ঝাদিমাদি প্ল্যাটফর্মে রক্তদান সম্পূর্ণ মানবিক ও বিনামূল্যে। রক্তের বিনিময়ে কোনো প্রকার অর্থ দাবি বা মধ্যস্বত্বভোগীর দালালি কঠোরভাবে নিষিদ্ধ এবং সরাসরি আইনি অপরাধ।'}
                  </p>
                </div>

                <div className="space-y-3 text-xs text-stone-700">
                  <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                    <h4 className="font-bold text-stone-900 text-xs">
                      {isEn ? '1. Donor Privacy & Direct Contact' : '১. রক্তদাতার নিরাপত্তা ও যোগাযোগের শিষ্টাচার:'}
                    </h4>
                    <p className="text-stone-600 text-[11.5px] leading-relaxed">
                      {isEn
                        ? 'Donors voluntarily register their phone numbers to save lives in emergencies. Callers must only contact donors for genuine medical emergencies and speak with courtesy.'
                        : 'রক্তদাতারা মানবিক তাগিদে স্বেচ্ছায় ফোন নম্বর যুক্ত করেছেন। কোনো রোগী ছাড়া অহেতুক বা মধ্যরাতে অপ্রয়োজনীয় কল করে রক্তদাতাকে হয়রানি করা সম্পূর্ণ বেআইনি।'}
                    </p>
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                    <h4 className="font-bold text-stone-900 text-xs">
                      {isEn ? '2. Eligibility Criteria for Donors' : '২. রক্তদানের স্বাস্থ্যগত আবশ্যকতা:'}
                    </h4>
                    <ul className="list-disc list-inside space-y-1 pl-1 text-stone-600 text-[11.5px]">
                      <li>বয়স কমপক্ষে ১৮ বছর এবং ওজন নূন্যতম ৫০ কেজি (নারী রক্তদাতাদের ক্ষেত্রে ৪৫ কেজি)।</li>
                      <li>সর্বশেষ রক্তদানের পর কমপক্ষে ৩ থেকে ৪ মাস অতিবাহিত হতে হবে।</li>
                      <li>রক্তদানের পূর্বে হাসপাতাল বা নিবন্ধিত ব্লাড ব্যাংকে প্রয়োজনীয় স্ক্রিনিং টেস্ট করিয়ে নেওয়া বাধ্যতামূলক।</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            {/* 8. IDENTITY & SENSITIVE INFO */}
            {activeSection === 'identity' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
                  <UserCheck className="w-5 h-5 text-[#065f46]" />
                  <h3 className="font-extrabold text-stone-900 text-sm sm:text-base">
                    {isEn ? 'Identity & Document Screening Policy' : 'পরিচয়পত্র ও সংবেদনশীল তথ্য নীতিমালা (Identity Policy)'}
                  </h3>
                </div>

                <div className="bg-stone-50 border border-stone-200 p-3.5 rounded-xl space-y-1 text-stone-800">
                  <span className="font-bold text-xs flex items-center gap-1.5 text-stone-900">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    {isEn ? 'Zero Public Visibility of Sensitive Documents' : 'জাতীয় পরিচয়পত্র বা ব্যক্তিগত নথিপত্র কখনো প্রকাশ্যে আসবে না'}
                  </span>
                  <p className="text-[11px] text-stone-600">
                    {isEn
                      ? 'NID cards, trade licenses, or submitted verification files are never published on public profiles or search engines. They reside exclusively in private encrypted storage.'
                      : 'জাতীয় পরিচয়পত্র (NID), পাসপোর্ট, জন্মসনদ বা কোনো ব্যক্তিগত নথির ছবি কোনো পাবলিক প্রোফাইল বা সার্চ ইঞ্জিনে কখনই দৃশ্যমান হবে না।'}
                  </p>
                </div>
              </div>
            )}

            {/* 9. CHILDREN & WOMEN SAFETY */}
            {activeSection === 'children' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
                  <Baby className="w-5 h-5 text-[#065f46]" />
                  <h3 className="font-extrabold text-stone-900 text-sm sm:text-base">
                    {isEn ? 'Children, Women & Vulnerable User Safety' : 'শিশু, নারী ও দুর্বল ব্যবহারকারী সুরক্ষা নীতিমালা'}
                  </h3>
                </div>

                <div className="space-y-3 text-xs text-stone-700">
                  <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                    <h4 className="font-bold text-stone-900 text-xs">
                      {isEn ? 'Zero Tolerance for Exploitation' : 'শিশু ও নারী সুরক্ষায় শূন্য সহনশীলতা:'}
                    </h4>
                    <p className="text-stone-600 text-[11.5px] leading-relaxed">
                      {isEn
                        ? 'Any attempt to exploit, harass, or endanger children or women is met with immediate, permanent expulsion and direct referral to cybersecurity law enforcement authorities.'
                        : 'শিশু নির্যাতন, নারী বা অপ্রাপ্তবয়স্কদের প্রতি কোনো ধরনের অশালীন প্রস্তাব, হয়রানি বা আপত্তিকর কনটেন্ট পোস্টের ক্ষেত্রে কোনো সতর্কতা ছাড়াই স্থায়ী নিষেধাজ্ঞা এবং আইনশৃঙ্খলা বাহিনীর কাছে রিপোর্ট করা হয়।'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 10. UGC & COMMUNITY RULES */}
            {activeSection === 'ugc' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
                  <Flag className="w-5 h-5 text-[#065f46]" />
                  <h3 className="font-extrabold text-stone-900 text-sm sm:text-base">
                    {isEn ? 'User Generated Content & Community Rules' : 'ব্যবহারকারী কনটেন্ট ও কমিউনিটি নীতিমালা (UGC Rules)'}
                  </h3>
                </div>

                <div className="space-y-2 text-xs text-stone-700">
                  <p>{isEn ? 'Guidelines for product descriptions, reviews, and posts:' : 'প্ল্যাটফর্মে পণ্য বিবরণী, রিভিউ, ছবি বা বিজ্ঞাপন পোস্ট করার সাধারণ নিয়মাবলী:'}</p>
                  <ul className="list-disc list-inside space-y-1.5 pl-1 text-stone-600 text-[11.5px]">
                    <li>{isEn ? 'No hate speech against ethnic or religious groups.' : 'পাহাড়ি-বাঙালি সম্প্রীতি নষ্ট করে এমন কোনো সাম্প্রদায়িক বা বিদ্বেষমূলক পোস্ট নিষিদ্ধ।'}</li>
                    <li>{isEn ? 'No counterfeit, expired, or prohibited products.' : 'মেয়াদোত্তীর্ণ, ভেজাল বা অনুমোদনহীন নকল দ্রব্য বিক্রয় সম্পূর্ণ নিষিদ্ধ।'}</li>
                    <li>{isEn ? 'No fake reviews or spam promotions.' : 'নিজের পণ্যে মিথ্যা রিভিউ বা অন্য বিক্রেতাকে হেয় করে অপপ্রচার চালানো নিষিদ্ধ।'}</li>
                  </ul>
                </div>
              </div>
            )}

            {/* 11. MARKETPLACE RULES */}
            {activeSection === 'marketplace' && (
              <div className="space-y-4 animate-fadeIn">
                <div className="flex items-center gap-2 border-b border-stone-200 pb-2">
                  <ShoppingBag className="w-5 h-5 text-[#065f46]" />
                  <h3 className="font-extrabold text-stone-900 text-sm sm:text-base">
                    {isEn ? 'Marketplace & Vendor Guidelines' : 'মার্কেটপ্লেস ও বিক্রেতা নীতিমালা (Marketplace Rules)'}
                  </h3>
                </div>

                <div className="space-y-3 text-xs text-stone-700">
                  <div className="p-3 bg-white rounded-xl border border-stone-200 space-y-1">
                    <h4 className="font-bold text-stone-900 text-xs">
                      {isEn ? 'Vendor Authenticity Pledge' : 'পণ্য ও বিক্রেতার মানদণ্ড:'}
                    </h4>
                    <p className="text-stone-600 text-[11.5px] leading-relaxed">
                      {isEn
                        ? 'Sellers must disclose true product photos, accurate weights, and transparent pricing. Purity of hill honey, turmeric, and local farm goods is the vendor\'s sworn obligation.'
                        : 'পণ্যের সঠিক ছবি, আসল ওজন এবং সঠিক মূল্য প্রদর্শন করতে হবে। পাহাড়ি মধু, জুমের হলুদ ও অর্গানিক পণ্যের শতভাগ বিশুদ্ধতা বজায় রাখা বিক্রেতার অঙ্গীকার।'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* 12. ACCOUNT DELETION */}
            {activeSection === 'deletion' && (
              <div className="space-y-4 bg-rose-50/60 border border-rose-200 p-4 sm:p-5 rounded-2xl animate-fadeIn">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
                    <Trash2 className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-rose-900 text-sm sm:text-base">
                      {isEn ? 'Account & Personal Data Permanent Deletion' : 'অ্যাকাউন্ট ও ব্যক্তিগত তথ্য স্থায়ীভাবে মুছে ফেলার অধিকার'}
                    </h3>
                    <p className="text-xs text-rose-800">
                      {isEn ? 'Full user rights under modern Data Privacy standards' : 'গুগল প্লে ইউজার ডেটা ও আন্তর্জাতিক প্রাইভেসি অধিকার'}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-stone-700 leading-relaxed">
                  {isEn
                    ? 'Any registered user can permanently delete their profile, mobile number, technician records, and store listings at any time. This action is irreversible.'
                    : 'যেকোনো ব্যবহারকারী চাইলেই প্ল্যাটফর্মে সংরক্ষিত তার যাবতীয় তথ্য, প্রোফাইল, ফোন নম্বর ও সেবাদাতার রেকর্ড স্থায়ীভাবে মুছে ফেলতে পারেন। এটি একটি অপরিবর্তনীয় প্রক্রিয়া।'}
                </p>

                <div className="space-y-1.5 text-xs text-stone-700 bg-white p-3.5 rounded-xl border border-rose-200">
                  <span className="font-bold text-stone-900 block">
                    {isEn ? 'Methods to Request Deletion:' : 'অ্যাকাউন্ট ডিলিট করার মাধ্যমসমূহ:'}
                  </span>
                  <ol className="list-decimal list-inside space-y-1 pl-1 text-stone-600 text-[11.5px]">
                    <li>{isEn ? 'Direct Self-Service via in-app button below.' : 'অ্যাপের ভেতর থেকে সরাসরি নিচের বোতামে ক্লিক করে তাৎক্ষণিক অনুমোদন দিন।'}</li>
                    <li>{isEn ? 'Email us at Jhadimadi2024@gmail.com with your registered mobile phone number.' : 'আমাদের ইমেইল Jhadimadi2024@gmail.com বা হোয়াটসঅ্যাপ 01870592699 এ মোবাইল নম্বর পাঠিয়ে অনুরোধ করুন।'}</li>
                  </ol>
                </div>

                {onOpenAccountDeletion && (
                  <div className="pt-2">
                    <button
                      type="button"
                      id="btn-policy-open-account-deletion"
                      onClick={() => {
                        onClose();
                        onOpenAccountDeletion();
                      }}
                      className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 active:scale-95 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-all cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Proceed to Account Deletion' : 'অ্যাকাউন্ট ডিলিট স্ক্রিনে যান'}</span>
                    </button>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>

        {/* Modal Bottom Footer */}
        <div className="p-3 sm:p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-[11px] text-stone-500 font-medium">
            <span>&copy; {new Date().getFullYear()} Jhadimadi.com. {isEn ? 'All Rights Reserved.' : 'সর্বস্বত্ব সংরক্ষিত।'}</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-[#065f46] hover:bg-[#0A6A32] text-white font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
          >
            {isEn ? 'Close' : 'বন্ধ করুন'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PolicyCenterModal;
