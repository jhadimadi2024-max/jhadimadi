import React, { useRef } from 'react';
import { 
  Droplet, Phone, MessageSquare, Printer, ShieldCheck, 
  MapPin, Calendar, User, Heart, AlertCircle, Share2, X, 
  FileText, CheckCircle2, Award, Lock
} from 'lucide-react';
import { Language } from '../types';

export interface BloodDonorProfileData {
  id?: string | number;
  name: string;
  bloodGroup: string;
  phone?: string;
  maskedPhone?: string;
  district?: string;
  upazila?: string;
  area?: string;
  mahalla?: string;
  gender?: string;
  age?: string | number;
  totalDonations?: number | string;
  lastDonationDate?: string;
  isAvailable?: boolean;
  avatar?: string;
  fatherName?: string;
  motherName?: string;
  bioBn?: string;
  createdAt?: string;
  uniqueId?: string;
}

interface StaticBloodDonorProfileDocumentProps {
  donor: BloodDonorProfileData;
  lang?: Language;
  onClose?: () => void;
  onShowToast?: (msg: string) => void;
}

export const StaticBloodDonorProfileDocument: React.FC<StaticBloodDonorProfileDocumentProps> = ({
  donor,
  lang = 'bn',
  onClose,
  onShowToast,
}) => {
  const isBn = lang === 'bn';
  const documentRef = useRef<HTMLDivElement>(null);

  const cleanPhone = donor.phone ? donor.phone.replace(/[^0-9+]/g, '') : '';
  const displayId = donor.uniqueId || `JM-BLD-${donor.id || (cleanPhone ? cleanPhone.slice(-6) : '001')}`;
  const totalDonationsCount = Number(donor.totalDonations) || 0;
  const isReady = donor.isAvailable !== false;

  // Print document
  const handlePrint = () => {
    window.print();
  };

  // Direct Phone Call
  const handleDirectCall = () => {
    if (cleanPhone) {
      window.location.href = `tel:${cleanPhone}`;
    } else if (onShowToast) {
      onShowToast(isBn ? 'ফোন নম্বর পাওয়া যায়নি।' : 'Phone number not available.');
    }
  };

  // Direct WhatsApp Message
  const handleWhatsApp = () => {
    if (cleanPhone) {
      const waNumber = cleanPhone.startsWith('0') ? '88' + cleanPhone : cleanPhone.replace(/^\+/, '');
      const msg = encodeURIComponent(
        isBn 
          ? `আসসালামু আলাইকুম ${donor.name}, ঝাদিমাদি ডটকম-এ আপনার রক্তের গ্রুপ (${donor.bloodGroup}) প্রোফাইল দেখে জরুরি প্রয়োজনে যোগাযোগ করছি।`
          : `Hello ${donor.name}, reaching out regarding blood donation (${donor.bloodGroup}) from Jhadimadi.`
      );
      window.open(`https://wa.me/${waNumber}?text=${msg}`, '_blank');
    } else if (onShowToast) {
      onShowToast(isBn ? 'হোয়াটসঅ্যাপ নম্বর পাওয়া যায়নি।' : 'WhatsApp number not available.');
    }
  };

  // Share profile
  const handleShare = async () => {
    const shareText = `${donor.name} • রক্তদাতা (${donor.bloodGroup}) • ${donor.upazila || ''}, ${donor.district || ''} - ঝাদিমাদি ডটকম`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: donor.name,
          text: shareText,
          url: window.location.href,
        });
      } catch {}
    } else {
      navigator.clipboard?.writeText(window.location.href);
      if (onShowToast) onShowToast(isBn ? 'প্রোফাইল লিংক কপি করা হয়েছে!' : 'Profile link copied!');
    }
  };

  return (
    <div 
      id="static-blood-donor-document-overlay"
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto"
    >
      <div 
        ref={documentRef}
        className="w-full max-w-xl bg-[#fafafa] rounded-2xl border border-gray-300 shadow-2xl overflow-hidden flex flex-col text-gray-900 my-auto animate-in fade-in zoom-in-95 duration-150 relative print:p-0 print:border-none print:shadow-none print:m-0"
        id="static-donor-pdf-card"
      >
        {/* Top Control Bar (Hidden when printed) */}
        <div className="bg-stone-900 text-white px-4 py-2.5 flex items-center justify-between border-b border-stone-800 print:hidden">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-rose-400" />
            <span className="text-xs font-bold tracking-wide">
              {isBn ? 'অফিশিয়াল রক্তদাতা নথি (PDF ভিউ)' : 'Official Donor Record (PDF View)'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
              title={isBn ? 'প্রিন্ট / সেভ করুন' : 'Print / Save'}
            >
              <Printer className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isBn ? 'প্রিন্ট' : 'Print'}</span>
            </button>
            <button
              type="button"
              onClick={handleShare}
              className="p-1.5 rounded bg-stone-800 hover:bg-stone-700 text-stone-200 transition cursor-pointer"
              title={isBn ? 'শেয়ার করুন' : 'Share'}
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1 rounded bg-stone-800 hover:bg-rose-900 text-stone-300 hover:text-white transition cursor-pointer"
                title={isBn ? 'বন্ধ করুন' : 'Close'}
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>

        {/* Printable PDF-Style Sheet Body */}
        <div className="p-5 sm:p-7 bg-white space-y-5 text-left border-b border-gray-200">
          
          {/* Header Section: Official Institutional Letterhead */}
          <div className="border-b-2 border-stone-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black tracking-tight text-gray-950 font-serif">
                  ঝাদিমাদি ডটকম
                </span>
                <span className="text-[10px] font-mono text-gray-400">|</span>
                <span className="text-xs font-bold text-rose-600 uppercase tracking-wider flex items-center gap-1">
                  <Droplet className="w-3 h-3 fill-rose-600" />
                  {isBn ? 'জরুরি রক্তদান নেটওয়ার্ক' : 'Emergency Blood Network'}
                </span>
              </div>
              <p className="text-[11px] text-gray-600 font-medium">
                {isBn 
                  ? 'স্বেচ্ছাসেবী রক্তদাতা জীবনবৃত্তান্ত ও অফিশিয়াল বিবরণীপত্র' 
                  : 'Official Voluntary Blood Donor Profile & Record'}
              </p>
            </div>

            {/* Document ID & Status Badge */}
            <div className="flex flex-col sm:items-end gap-1">
              <span className="text-[11px] font-mono font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded border border-gray-200">
                ID: {displayId}
              </span>
              <div className="flex items-center gap-1 text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                <ShieldCheck className="w-3 h-3" />
                <span>{isBn ? 'তথ্য যাচাইকৃত' : 'Verified Profile'}</span>
              </div>
            </div>
          </div>

          {/* Donor Identity Card Row */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 bg-[#fdfbf9] rounded-xl border border-stone-200">
            {/* Prominent Blood Group Seal Badge */}
            <div className="w-24 h-24 rounded-xl bg-gradient-to-b from-rose-600 to-rose-700 text-white flex flex-col items-center justify-center p-2 shadow-sm shrink-0 border-2 border-rose-800 relative">
              <Droplet className="w-6 h-6 fill-white opacity-80" />
              <span className="text-2xl font-black tracking-tight mt-0.5">{donor.bloodGroup}</span>
              <span className="text-[9px] uppercase font-black tracking-widest text-rose-100">
                {isBn ? 'রক্তের গ্রুপ' : 'Blood Group'}
              </span>
            </div>

            {/* Donor Personal Information */}
            <div className="flex-1 space-y-1 text-center sm:text-left min-w-0">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <h2 className="text-lg font-black text-gray-900 truncate">
                  {donor.name}
                </h2>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  isReady 
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' 
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${isReady ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                  {isReady ? (isBn ? 'রক্তদানে প্রস্তুত' : 'Available to Donate') : (isBn ? 'সাময়িক অনুপলব্ধ' : 'Unavailable')}
                </span>
              </div>

              <p className="text-xs text-gray-600 font-medium">
                {donor.gender ? `${donor.gender} • ` : ''}
                {donor.age ? `${donor.age} বছর • ` : ''}
                {isBn ? 'স্বেচ্ছাসেবী রক্তদাতা' : 'Voluntary Blood Donor'}
              </p>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 pt-1 text-xs text-gray-700">
                <span className="flex items-center gap-1 text-gray-600">
                  <MapPin className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span className="font-semibold">{donor.upazila ? `${donor.upazila}, ` : ''}{donor.district || (isBn ? 'বাংলাদেশ' : 'Bangladesh')}</span>
                </span>
                {donor.area && (
                  <span className="text-gray-500 text-[11px]">({donor.area})</span>
                )}
              </div>
            </div>
          </div>

          {/* Structured Official PDF Data Table */}
          <div className="rounded-xl border border-gray-200 overflow-hidden text-xs">
            <div className="bg-stone-100 px-3 py-2 font-bold text-gray-800 uppercase tracking-wider text-[11px] border-b border-gray-200 flex items-center justify-between">
              <span>{isBn ? 'রক্তদান ও স্বাস্থ্য তথ্যাবলি' : 'Donation & Health Records'}</span>
              <Award className="w-3.5 h-3.5 text-stone-500" />
            </div>

            <div className="divide-y divide-gray-100 bg-white">
              <div className="grid grid-cols-2 sm:grid-cols-3 p-3 gap-2">
                <div className="space-y-0.5">
                  <span className="text-gray-400 text-[10px] block">{isBn ? 'মোট রক্তদান' : 'Total Donations'}</span>
                  <span className="font-black text-rose-700 text-sm">
                    {totalDonationsCount} {isBn ? 'বার' : 'times'}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-gray-400 text-[10px] block">{isBn ? 'সর্বশেষ রক্তদান' : 'Last Donation'}</span>
                  <span className="font-bold text-gray-900">
                    {donor.lastDonationDate || (isBn ? 'তথ্য পাওয়া যায়নি' : 'N/A')}
                  </span>
                </div>
                <div className="space-y-0.5 col-span-2 sm:col-span-1">
                  <span className="text-gray-400 text-[10px] block">{isBn ? 'জরুরি প্রস্তুতি' : 'Readiness'}</span>
                  <span className={`font-bold ${isReady ? 'text-emerald-700' : 'text-amber-700'}`}>
                    {isReady ? (isBn ? 'প্রস্তুত আছেন' : 'Ready') : (isBn ? 'বিশ্রামে আছেন' : 'Resting')}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 p-3 gap-2 bg-stone-50/50">
                <div className="space-y-0.5">
                  <span className="text-gray-400 text-[10px] block">{isBn ? 'স্থায়ী ঠিকানা' : 'Address'}</span>
                  <span className="font-medium text-gray-800">
                    {[donor.area, donor.upazila, donor.district].filter(Boolean).join(', ') || (isBn ? 'যাচাইকৃত স্থানীয় এলাকা' : 'Verified Area')}
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="text-gray-400 text-[10px] block">{isBn ? 'জরুরি যোগাযোগ' : 'Emergency Contact'}</span>
                  <div className="flex items-center gap-1.5 pt-0.5">
                    <span className="text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-600 shrink-0" />
                      <span>{isBn ? 'ব্যক্তিগত নম্বর সুরক্ষিত' : 'Number Protected'}</span>
                    </span>
                    <button
                      type="button"
                      onClick={handleDirectCall}
                      className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-[10px] font-bold inline-flex items-center gap-1 transition cursor-pointer active:scale-95 shadow-2xs"
                    >
                      <Phone className="w-2.5 h-2.5" />
                      <span>{isBn ? 'যোগাযোগ করুন' : 'Contact / Call'}</span>
                    </button>
                  </div>
                </div>
              </div>

              {donor.bioBn && (
                <div className="p-3 bg-white space-y-1">
                  <span className="text-gray-400 text-[10px] block">{isBn ? 'সদস্যের বক্তব্য / নোট' : 'Donor Note'}</span>
                  <p className="text-gray-700 text-[11px] leading-relaxed italic">
                    "{donor.bioBn}"
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Emergency Safety Protocol & Verification Notice */}
          <div className="p-3 bg-amber-50/80 border border-amber-200 rounded-xl space-y-1.5 text-[11px] text-amber-900">
            <div className="flex items-center gap-1.5 font-bold text-amber-950">
              <AlertCircle className="w-3.5 h-3.5 text-amber-700 shrink-0" />
              <span>{isBn ? 'জরুরি রক্তদান ও হাসপাতালের নিয়মাবলি:' : 'Emergency Hospital Protocols:'}</span>
            </div>
            <p className="text-amber-800 leading-relaxed text-[10.5px]">
              {isBn 
                ? 'রক্ত সম্পূর্ণ স্বেচ্ছাসেবী ও বিনামূল্যে। রক্ত গ্রহণের পূর্বে সংশ্লিষ্ট হাসপাতাল বা ব্লাড ব্যাংকে বাধ্যতামূলক ক্রস-ম্যাচিং ও স্ক্রিনিং টেস্ট সম্পন্ন করুন। কোনো আর্থিক লেনদেন করবেন না।'
                : 'Blood donation is 100% voluntary and free. Ensure official cross-matching and laboratory screening before transfusion.'}
            </p>
          </div>

          {/* Official Stamp & Signoff Footer */}
          <div className="pt-2 flex items-center justify-between border-t border-dashed border-gray-300 text-[10px] text-gray-500 font-mono">
            <div className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>JHADIMADI COMMUNITY BLOOD VERIFICATION</span>
            </div>
            <span>{new Date().toLocaleDateString('bn-BD')}</span>
          </div>

        </div>

        {/* Bottom Customer Action Section (Clean 3-Action Buttons, hidden in print) */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 space-y-2 print:hidden" id="donor-profile-actions">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {/* 1. সরাসরি যোগাযোগ করুন (Direct Call) */}
            <button
              type="button"
              id="donor-btn-direct-call"
              onClick={handleDirectCall}
              className="w-full py-3 px-4 rounded-xl bg-black hover:bg-gray-900 active:scale-[0.99] text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <Phone className="w-4 h-4 text-white shrink-0" />
              <span>{isBn ? 'সরাসরি যোগাযোগ করুন' : 'Direct Call'}</span>
            </button>

            {/* 2. মেসেজ করুন (Send Message) */}
            <button
              type="button"
              id="donor-btn-whatsapp-message"
              onClick={handleWhatsApp}
              className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] active:scale-[0.99] text-white text-xs font-black transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
            >
              <MessageSquare className="w-4 h-4 text-white shrink-0" />
              <span>{isBn ? 'মেসেজ করুন' : 'Send WhatsApp Message'}</span>
            </button>
          </div>

          {/* 3. প্রিন্ট / অফিশিয়াল রেকর্ড ডাউনলোড */}
          <button
            type="button"
            onClick={handlePrint}
            className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5 text-gray-600" />
            <span>{isBn ? 'অফিশিয়াল রেকর্ড প্রিন্ট / পিডিএফ ডাউনলোড' : 'Print / Download Official PDF'}</span>
          </button>
        </div>

      </div>
    </div>
  );
};
