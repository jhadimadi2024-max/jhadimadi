import React, { useState } from 'react';
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
  ExternalLink,
} from 'lucide-react';

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAccountDeletion?: () => void;
}

export const PrivacyPolicyModal: React.FC<PrivacyPolicyModalProps> = ({
  isOpen,
  onClose,
  onOpenAccountDeletion,
}) => {
  const [activeSection, setActiveSection] = useState<'all' | 'collection' | 'security' | 'deletion'>('all');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fadeIn">
      <div
        id="privacy-policy-modal-card"
        className="relative w-full max-w-2xl max-h-[90vh] bg-white rounded-2xl sm:rounded-3xl shadow-2xl flex flex-col overflow-hidden border border-stone-200"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#004D40] to-[#16A34A] text-white p-4 sm:p-5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Shield className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight flex items-center gap-2">
                <span>গোপনীয়তা নীতি (Privacy Policy)</span>
                <span className="text-[10px] uppercase font-bold bg-amber-400 text-stone-900 px-2 py-0.5 rounded-full">
                  Play Store Compliant
                </span>
              </h2>
              <p className="text-xs text-emerald-100/90 font-medium mt-0.5">
                Jhadimadi.com — তথ্য সুরক্ষা ও ডেটা নিরাপত্তা নীতিমালা
              </p>
            </div>
          </div>

          <button
            id="btn-close-privacy-policy"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Category Pills Filter */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-stone-50 border-b border-stone-200 overflow-x-auto shrink-0 text-xs font-bold text-stone-600">
          <button
            onClick={() => setActiveSection('all')}
            className={`px-3 py-1 rounded-full transition-colors whitespace-nowrap cursor-pointer ${
              activeSection === 'all'
                ? 'bg-[#16A34A] text-white'
                : 'bg-white border border-stone-200 hover:bg-stone-100'
            }`}
          >
            সকল বিষয়
          </button>
          <button
            onClick={() => setActiveSection('collection')}
            className={`px-3 py-1 rounded-full transition-colors whitespace-nowrap cursor-pointer ${
              activeSection === 'collection'
                ? 'bg-[#16A34A] text-white'
                : 'bg-white border border-stone-200 hover:bg-stone-100'
            }`}
          >
            তথ্য সংগ্রহ ও ব্যবহার
          </button>
          <button
            onClick={() => setActiveSection('security')}
            className={`px-3 py-1 rounded-full transition-colors whitespace-nowrap cursor-pointer ${
              activeSection === 'security'
                ? 'bg-[#16A34A] text-white'
                : 'bg-white border border-stone-200 hover:bg-stone-100'
            }`}
          >
            নিরাপত্তা ও স্ক্রিনিং
          </button>
          <button
            onClick={() => setActiveSection('deletion')}
            className={`px-3 py-1 rounded-full transition-colors whitespace-nowrap cursor-pointer ${
              activeSection === 'deletion'
                ? 'bg-rose-600 text-white'
                : 'bg-white border border-stone-200 hover:bg-rose-50 text-rose-700'
            }`}
          >
            অ্যাকাউন্ট ও ডেটা ডিলিট
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 text-stone-700 text-xs sm:text-sm leading-relaxed">
          {/* Metadata banner */}
          <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl flex items-start gap-2.5 text-xs text-emerald-950">
            <CheckCircle2 className="w-4 h-4 text-[#16A34A] shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">সর্বশেষ আপডেট:</span> সেপ্টেম্বর ২০২৬। ঝাদিমাদি (Jhadimadi.com) ব্যবহারকারীদের ডেটা প্রাইভেসি এবং গুগল প্লে স্টোরের ডেভেলপার পলিসি অনুসারে আমাদের সেবা পরিচালনা করে।
            </div>
          </div>

          {/* Section 1 */}
          {(activeSection === 'all' || activeSection === 'collection') && (
            <div className="space-y-3">
              <h3 className="font-extrabold text-stone-900 text-sm sm:text-base flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#16A34A]" />
                <span>১. আমরা কী কী তথ্য সংগ্রহ করি</span>
              </h3>
              <p className="text-stone-600">
                ঝাদিমাদি প্ল্যাটফর্মে পণ্য ক্রয়-বিক্রয়, হোম সার্ভিস বুকিং, চাকরির তথ্য ও রক্তদাতা খোঁজার সময় আমরা প্রয়োজনীয় কিছু তথ্য সংগ্রহ করি:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-stone-600">
                <li><strong className="text-stone-800">ব্যক্তিগত প্রোফাইল:</strong> ব্যবহারকারীর নাম, সচল মোবাইল নম্বর, জেলা, উপজেলা এবং প্রোফাইল ছবি।</li>
                <li><strong className="text-stone-800">অর্ডার ও ডেলিভারি তথ্য:</strong> পণ্য পৌঁছানোর পূর্ণ ঠিকানা, নির্বাচিত কুরিয়ার এবং পছন্দনীয় পেমেন্ট মেথড (যেমন ক্যাশ অন ডেলিভারি)।</li>
                <li><strong className="text-stone-800">সেবা ও পেশাগত তথ্য:</strong> ফ্রিল্যান্সার বা টেকনিশিয়ানদের কাজের ধরন, দক্ষতা এবং রেটিং।</li>
                <li><strong className="text-stone-800">ডিভাইস ও প্রযুক্তিগত লগ:</strong> অ্যাপের নিরাপত্তা বজায় রাখা, ক্র্যাশ প্রতিরোধ ও পারফরম্যান্স পর্যালোচনার জন্য মৌলিক অ্যানালিটিক্স।</li>
              </ul>
            </div>
          )}

          {/* Section 2 */}
          {(activeSection === 'all' || activeSection === 'security') && (
            <div className="space-y-3">
              <h3 className="font-extrabold text-stone-900 text-sm sm:text-base flex items-center gap-2">
                <Lock className="w-4 h-4 text-[#16A34A]" />
                <span>২. ডেটা নিরাপত্তা ও প্রাইভেট স্টোরেজ</span>
              </h3>
              <p className="text-stone-600">
                আপনার তথ্যের সুরক্ষা নিশ্চিত করতে ঝাদিমাদি আধুনিক ক্লাউড আর্কিটেকচার অনুসরণ করে:
              </p>
              <ul className="list-disc list-inside space-y-1.5 pl-2 text-stone-600">
                <li><strong className="text-stone-800">এনক্রিপশন ও RLS:</strong> সমস্ত প্রোফাইল ও অর্ডার ডাটা ক্লাউড ডাটাবেজে (Supabase PostgreSQL) রো-লেভেল সিকিউরিটি (RLS) ও SSL/HTTPS এর মাধ্যমে এনক্রিপ্ট থাকে।</li>
                <li><strong className="text-stone-800">প্রাইভেট স্টোরেজ বাকেট:</strong> পরিচয় যাচাই বা সংবেদনশীল নথিপত্র সম্পূর্ণ আলাদা প্রাইভেট স্টোরেজে সংরক্ষিত থাকে, যা সাধারণ ব্যবহারকারী বা পাবলিক সার্চ ইঞ্জিনে দৃশ্যমান নয়।</li>
                <li><strong className="text-stone-800">পেমেন্ট নিরাপত্তা:</strong> ক্যাশ অন ডেলিভারি (COD) প্ল্যাটফর্মের মূল মাধ্যম। কোনো গেটওয়ে ট্রানজেকশন আইডি প্রদান করা হলে তা স্বয়ংক্রিয় যাচাই না হওয়া পর্যন্ত পেন্ডিং হিসেবে থাকে।</li>
              </ul>

              {/* NID Disclaimer Box */}
              <div className="bg-amber-50 border border-amber-300 p-3.5 rounded-xl space-y-1.5 text-stone-800">
                <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
                  <span>এআই-সহায়তাপ্রাপ্ত ডকুমেন্ট স্ক্রিনিং (AI-Assisted Document Screening) সম্পর্কিত স্পষ্টীকরণ</span>
                </div>
                <p className="text-[11px] text-stone-700 leading-relaxed">
                  ঝাদিমাদি প্ল্যাটফর্মে পরিচয়পত্র যাচাই প্রক্রিয়াটি কৃত্রিম বুদ্ধিমত্তা চালিত একটি প্রাথমিক ফরেনসিক স্ক্রিনিং ব্যবস্থা (AI-Assisted Document Screening)। এটি অভ্যন্তরীণ নিরাপত্তা ও জালিয়াতি রোধে ব্যবহৃত হয়। এটি কোনো অফিশিয়াল সরকারি ডাটাবেজ ভেরিফিকেশন বা সরকারি সনদ নয়।
                </p>
              </div>
            </div>
          )}

          {/* Section 3: Deletion Policy */}
          {(activeSection === 'all' || activeSection === 'deletion') && (
            <div className="space-y-3 bg-rose-50/70 border border-rose-200 p-4 rounded-2xl">
              <h3 className="font-extrabold text-rose-900 text-sm sm:text-base flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>৩. অ্যাকাউন্ট ও সমস্ত ব্যক্তিগত ডেটা মুছে ফেলার অধিকার (Account Deletion)</span>
              </h3>
              <p className="text-stone-700">
                গুগল প্লে স্টোরের ইউজার ডেটা নীতিমালা অনুসারে, যেকোনো ব্যবহারকারী চাইলেই তার অ্যাকাউন্ট এবং সমস্ত সংশ্লিষ্ট ডাটা স্থায়ীভাবে মুছে ফেলার পূর্ণ অধিকার রাখেন।
              </p>
              <div className="space-y-1.5 text-xs text-stone-700">
                <p className="font-bold text-stone-900">অ্যাকাউন্ট ডিলিট করার নিয়মাবলী:</p>
                <ol className="list-decimal list-inside space-y-1 pl-1">
                  <li>প্রোফাইল সেকশন থেকে <strong>"অ্যাকাউন্ট ডিলিট করুন"</strong> অপশনটিতে ক্লিক করুন।</li>
                  <li>নিশ্চিতকরণ ডায়ালগে অনুমোদন দিলে আপনার প্রোফাইল, ফোন নম্বর ও সংরক্ষিত ডকুমেন্টস ডাটাবেজ থেকে অবিলম্বে স্থায়ীভাবে মুছে ফেলা হবে।</li>
                  <li>অথবা সরাসরি আমাদের হেল্পলাইনে কল বা ইমেইল করে মুছে ফেলার অনুরোধ পাঠাতে পারেন।</li>
                </ol>
              </div>

              {onOpenAccountDeletion && (
                <div className="pt-2">
                  <button
                    id="btn-trigger-account-deletion-from-policy"
                    onClick={() => {
                      onClose();
                      onOpenAccountDeletion();
                    }}
                    className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-xs transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>অ্যাকাউন্ট ডিলিট অপশনে যান</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Contact Section */}
          <div className="bg-stone-50 border border-stone-200 p-4 rounded-xl space-y-2">
            <h4 className="font-bold text-stone-900 text-xs uppercase tracking-wide">
              যোগাযোগ ও হেল্পডেস্ক (Contact Us)
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-stone-600">
              <div className="flex items-center gap-2">
                <Mail className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                <span>jhadimadi2024@gmail.com</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                <span>01870592699 / WhatsApp Support</span>
              </div>
              <div className="flex items-center gap-2 sm:col-span-2">
                <MapPin className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                <span>খাগড়াছড়ি সদর, পার্বত্য চট্টগ্রাম, বাংলাদেশ।</span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between shrink-0">
          <span className="text-[11px] text-stone-500 font-medium">
            Jhadimadi.com &copy; 2026. All Rights Reserved.
          </span>
          <button
            id="btn-close-privacy-footer"
            onClick={onClose}
            className="px-4 py-2 bg-stone-800 hover:bg-stone-900 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
          >
            বন্ধ করুন
          </button>
        </div>
      </div>
    </div>
  );
};
