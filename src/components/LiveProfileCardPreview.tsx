import React, { useState, useMemo } from 'react';
import { 
  User, 
  MapPin, 
  Award, 
  GraduationCap, 
  Clock, 
  Calendar, 
  FileCheck, 
  Star, 
  ShieldCheck, 
  PhoneCall, 
  MoreVertical, 
  Lock, 
  Copy, 
  Eye, 
  X, 
  Check, 
  CheckCircle2,
  Info,
  ExternalLink,
  Briefcase
} from 'lucide-react';
import { Language } from '../types';

export interface LiveProfileCardPreviewProps {
  photo: string;
  fullName: string;
  fatherName?: string;
  motherName?: string;
  bloodGroup: string;
  mobileNumber: string;
  nidNumber?: string;
  nidFrontImage?: string;
  nidBackImage?: string;
  biodataDocName?: string;
  biodataDocUrl?: string;
  workPhotos?: string[];
  serviceRadius?: string;
  enableDirectContact?: boolean;
  enableInAppBooking?: boolean;
  enableDigitalPayment?: boolean;
  profession: string;
  workNatureHourly: boolean;
  workNatureDaily: boolean;
  workNatureContract: boolean;
  educationLevel: string;
  certificateImage?: string;
  certificateTitle?: string;
  division: string;
  district: string;
  upazila: string;
  localityArea: string;
  bio: string;
  uniqueId: string;
  lang?: Language;
  onOpenCertificateModal?: () => void;
}

export const LiveProfileCardPreview: React.FC<LiveProfileCardPreviewProps> = ({
  photo,
  fullName,
  fatherName,
  motherName,
  bloodGroup,
  mobileNumber,
  nidNumber,
  nidFrontImage,
  nidBackImage,
  biodataDocName,
  biodataDocUrl,
  workPhotos = [],
  serviceRadius,
  enableDirectContact = true,
  enableInAppBooking = true,
  enableDigitalPayment = true,
  profession,
  workNatureHourly,
  workNatureDaily,
  workNatureContract,
  educationLevel,
  certificateImage,
  certificateTitle,
  division,
  district,
  upazila,
  localityArea,
  bio,
  uniqueId,
  lang = 'bn',
  onOpenCertificateModal
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showPrivateModal, setShowPrivateModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showContactNotice, setShowContactNotice] = useState(false);
  const [showCertificateViewModal, setShowCertificateViewModal] = useState(false);
  const [viewingWorkPhoto, setViewingWorkPhoto] = useState<string | null>(null);

  // Education level label map
  const educationLabel = useMemo(() => {
    switch (educationLevel) {
      case 'class_8':
        return lang === 'bn' ? '৮ম শ্রেণি / জেএসসি' : 'Class 8 / JSC';
      case 'ssc':
        return lang === 'bn' ? 'এসএসসি / সমমান / দাখিল' : 'SSC / Dakhil';
      case 'hsc':
        return lang === 'bn' ? 'এইচএসসি / সমমান / আলিম' : 'HSC / Alim';
      case 'diploma':
        return lang === 'bn' ? 'ডিপ্লোমা ইন ইঞ্জিনিয়ারিং / নার্সিং' : 'Diploma in Engineering';
      case 'bachelor':
        return lang === 'bn' ? 'স্নাতক / ডিগ্রি / অনার্স (BA/BSc/BBA)' : 'Bachelor Degree';
      case 'masters':
        return lang === 'bn' ? 'স্নাতকোত্তর / মাস্টার্স (MA/MSc/MBA)' : 'Masters / Post-Graduate';
      default:
        return lang === 'bn' ? 'অন্যান্য / ব্যবহারিক অভিজ্ঞতা' : 'Practical Experience';
    }
  }, [educationLevel, lang]);

  // Handle Copy Profile Link
  const handleCopyLink = () => {
    try {
      const url = `${window.location.origin}/provider/${uniqueId.toLowerCase()}`;
      navigator.clipboard.writeText(url);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 3000);
      setIsMenuOpen(false);
    } catch {
      // fallback
    }
  };

  return (
    <div className="w-full bg-white rounded-2xl border-2 border-emerald-600/20 shadow-lg overflow-hidden flex flex-col font-sans relative">
      
      {/* ================= CARD TOP BRAND BANNER ================= */}
      <div className="bg-gradient-to-r from-[#0A6A32] via-[#0e7c3b] to-[#0A6A32] text-white px-4 py-2 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span>
          <span className="text-[11px] font-black uppercase tracking-wider text-emerald-100">
            {lang === 'bn' ? 'লাইভ সেবাদাতা বায়োডাটা ও প্রোফাইল' : 'Live Provider Profile & Biodata'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] bg-emerald-950/40 text-emerald-200 px-2 py-0.5 rounded-full border border-emerald-400/30 font-mono">
            ID: {uniqueId || 'KSA-001'}
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-5 space-y-4">

        {/* ================= 1. TOP HEADER SECTION ================= */}
        {/* Left: Passport photo | Center: Full Name + Blood Group below it | Right: District Unique ID + 3-Dot Menu */}
        <div className="flex items-start justify-between gap-3 border-b border-gray-100 pb-4">
          <div className="flex items-start gap-3.5 min-w-0 flex-1">
            
            {/* Passport-size Profile Photo */}
            <div className="relative shrink-0">
              <div className="w-20 h-24 sm:w-22 sm:h-26 rounded-xl border-2 border-[#0A6A32]/30 bg-slate-100 overflow-hidden shadow-xs flex items-center justify-center">
                {photo ? (
                  <img 
                    src={photo} 
                    alt={fullName || 'Provider'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center text-gray-400 p-2 text-center">
                    <User className="w-9 h-9 text-gray-300" />
                    <span className="text-[8.5px] text-gray-400 mt-1 font-medium leading-tight">
                      {lang === 'bn' ? 'পাসপোর্ট ছবি' : 'Photo'}
                    </span>
                  </div>
                )}
              </div>

              {/* Blue Tick Badge */}
              <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-xs border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-[#0A6A32] fill-emerald-100" />
              </div>
            </div>

            {/* Center/Right of photo: Provider's Full Name & Blood Group immediately below */}
            <div className="min-w-0 flex-1 pt-0.5">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight leading-tight truncate">
                  {fullName.trim() || (lang === 'bn' ? 'আপনার পূর্ণ নাম' : 'Your Full Name')}
                </h2>
                <span className="inline-flex items-center gap-0.5 bg-emerald-50 text-[#0A6A32] border border-emerald-200 text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                  <ShieldCheck className="w-3 h-3 text-[#0A6A32]" />
                  <span>{lang === 'bn' ? 'যাচাইকৃত' : 'Verified'}</span>
                </span>
              </div>

              {/* Blood Group Badge displayed right below Name */}
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <span className="inline-flex items-center gap-1 bg-rose-50 text-rose-700 border border-rose-200 text-[10px] sm:text-xs font-black px-2 py-0.5 rounded-lg shadow-2xs">
                  <span className="text-rose-600">🩸</span>
                  <span>{lang === 'bn' ? `রক্তের গ্রুপ: ${bloodGroup || 'B+'}` : `Blood Group: ${bloodGroup || 'B+'}`}</span>
                </span>

                {/* Rating Badge */}
                <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 text-[10px] font-bold px-1.5 py-0.5 rounded-lg">
                  <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>5.0 (100% সন্তুষ্টি)</span>
                </span>
              </div>

              {/* Main Profession Highlight */}
              <div className="mt-2">
                <span className="inline-block bg-emerald-50 text-[#0A6A32] border border-[#0A6A32]/30 px-2.5 py-1 rounded-lg text-xs font-black">
                  {profession.trim() || (lang === 'bn' ? 'পেশা নির্বাচন করুন' : 'Select Profession')}
                </span>
              </div>
            </div>

          </div>

          {/* Top-Right: District-based Unique ID & Facebook-style 3-Dot (⋮) Menu */}
          <div className="flex flex-col items-end gap-1.5 shrink-0 relative">
            <div className="bg-slate-900 text-amber-300 font-mono text-[10px] sm:text-xs font-black px-2.5 py-1 rounded-lg shadow-xs border border-slate-700 text-center tracking-wider">
              {uniqueId || 'KSA-001'}
            </div>

            {/* 3-Dot Menu Button */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsMenuOpen(prev => !prev)}
                className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition cursor-pointer shadow-2xs"
                title={lang === 'bn' ? 'অপশন ও গোপনীয় তথ্য' : 'Options & Confidential Info'}
                id="btn-profile-card-options"
              >
                <MoreVertical className="w-4 h-4" />
              </button>

              {/* Facebook-style Dropdown Menu */}
              {isMenuOpen && (
                <div 
                  className="absolute right-0 top-8 z-40 w-56 bg-white rounded-2xl shadow-2xl border border-gray-200 py-1.5 text-xs divide-y divide-gray-100 animate-in fade-in duration-150"
                  id="dropdown-live-card-menu"
                >
                  <div className="px-3 py-2 bg-slate-50">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                      {lang === 'bn' ? 'প্রোফাইল নিয়ন্ত্রণ' : 'Profile Control'}
                    </p>
                    <p className="text-xs font-black text-gray-800 truncate">
                      {uniqueId || 'KSA-001'}
                    </p>
                  </div>

                  {/* Option 1: View Confidential Details */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMenuOpen(false);
                      setShowPrivateModal(true);
                    }}
                    className="w-full px-3 py-2 text-left text-gray-800 hover:bg-emerald-50 hover:text-[#0A6A32] flex items-center gap-2 transition cursor-pointer font-bold"
                  >
                    <Lock className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{lang === 'bn' ? '🔒 ব্যক্তিগত তথ্য দেখুন (NID/ফোন)' : '🔒 View Confidential Details'}</span>
                  </button>

                  {/* Option 2: Copy Profile Link */}
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    className="w-full px-3 py-2 text-left text-gray-700 hover:bg-gray-50 flex items-center gap-2 transition cursor-pointer"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-gray-400" />}
                    <span>{copiedLink ? (lang === 'bn' ? '✓ লিঙ্ক কপি হয়েছে!' : '✓ Link Copied!') : (lang === 'bn' ? 'প্রোফাইল লিঙ্ক কপি করুন' : 'Copy Profile Link')}</span>
                  </button>

                  {/* Option 3: Privacy Assurance */}
                  <div className="px-3 py-2 text-[10px] text-gray-500 leading-tight">
                    <p className="flex items-center gap-1 font-bold text-gray-700 mb-0.5">
                      <ShieldCheck className="w-3 h-3 text-[#0A6A32]" />
                      <span>{lang === 'bn' ? 'শতভাগ গোপনীয়তা রক্ষিত' : '100% Privacy Protected'}</span>
                    </p>
                    <span>{lang === 'bn' ? 'এনআইডি ও মোবাইল নম্বর সাধারণের দৃশ্য থেকে গোপন।' : 'NID & Phone are kept strictly hidden.'}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ================= 2. BODY SECTION ================= */}

        {/* Work Nature Badges */}
        <div className="space-y-1.5">
          <span className="text-[10.5px] font-bold text-gray-500 flex items-center gap-1">
            <Briefcase className="w-3 h-3 text-[#0A6A32]" />
            <span>{lang === 'bn' ? 'কাজের ধরন (Work Nature):' : 'Work Nature:'}</span>
          </span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {workNatureHourly && (
              <span className="inline-flex items-center gap-1 bg-emerald-100/70 text-[#0A6A32] border border-emerald-300 text-[10px] font-black px-2 py-1 rounded-lg">
                <Clock className="w-3 h-3" />
                <span>{lang === 'bn' ? 'ঘণ্টাভিত্তিক (Hourly)' : 'Hourly'}</span>
              </span>
            )}
            {workNatureDaily && (
              <span className="inline-flex items-center gap-1 bg-teal-100/70 text-teal-900 border border-teal-300 text-[10px] font-black px-2 py-1 rounded-lg">
                <Calendar className="w-3 h-3" />
                <span>{lang === 'bn' ? 'দৈনিক (Daily)' : 'Daily'}</span>
              </span>
            )}
            {workNatureContract && (
              <span className="inline-flex items-center gap-1 bg-indigo-100/70 text-indigo-900 border border-indigo-300 text-[10px] font-black px-2 py-1 rounded-lg">
                <FileCheck className="w-3 h-3" />
                <span>{lang === 'bn' ? 'চুক্তিভিত্তিক (Contractual)' : 'Contractual'}</span>
              </span>
            )}
            {!workNatureHourly && !workNatureDaily && !workNatureContract && (
              <span className="text-[10px] text-gray-400 italic">
                {lang === 'bn' ? 'কাজের ধরন নির্বাচন করুন' : 'No work nature selected'}
              </span>
            )}
          </div>
        </div>

        {/* Service Area Grid */}
        <div className="p-3 bg-slate-50 rounded-xl border border-gray-200 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10.5px] font-bold text-gray-500 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#0A6A32]" />
              <span>{lang === 'bn' ? 'সেবা প্রদান এলাকা (Service Area):' : 'Service Area:'}</span>
            </span>
            {serviceRadius && (
              <span className="text-[9.5px] font-black bg-emerald-100 text-[#0A6A32] px-2 py-0.5 rounded-md border border-emerald-300">
                {lang === 'bn' ? `কভারেজ: ${serviceRadius}` : `Radius: ${serviceRadius}`}
              </span>
            )}
          </div>
          <p className="text-xs font-bold text-gray-900">
            {localityArea ? `${localityArea}, ` : ''}{upazila || 'উপজেলা'}, {district || 'জেলা'}
          </p>
          <p className="text-[10px] text-gray-500">
            {division || 'বিভাগ'} বিভাগ, বাংলাদেশ
          </p>
        </div>

        {/* Education & Technical Certificate */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          
          {/* Education Level */}
          <div className="p-3 bg-slate-50 rounded-xl border border-gray-200 space-y-1">
            <span className="text-[10.5px] font-bold text-gray-500 flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5 text-[#0A6A32]" />
              <span>{lang === 'bn' ? 'শিক্ষাগত যোগ্যতা:' : 'Education:'}</span>
            </span>
            <p className="text-xs font-bold text-gray-900">
              {educationLabel}
            </p>
          </div>

          {/* Technical Skill Certificate */}
          <div className="p-3 bg-slate-50 rounded-xl border border-gray-200 space-y-1">
            <span className="text-[10.5px] font-bold text-gray-500 flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-[#0A6A32]" />
              <span>{lang === 'bn' ? 'কারিগরি প্রশিক্ষণ সনদ:' : 'Technical Certificate:'}</span>
            </span>
            {certificateImage ? (
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-bold text-emerald-800 flex items-center gap-1 truncate">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#0A6A32] shrink-0" />
                  <span className="truncate">{certificateTitle || (lang === 'bn' ? 'সনদপত্র যুক্ত আছে' : 'Verified Certificate')}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenCertificateModal) {
                      onOpenCertificateModal();
                    } else {
                      setShowCertificateViewModal(true);
                    }
                  }}
                  className="px-2 py-0.5 bg-white border border-[#0A6A32]/40 hover:bg-emerald-50 text-[#0A6A32] text-[10px] font-black rounded-md flex items-center gap-1 shadow-2xs shrink-0 cursor-pointer"
                >
                  <Eye className="w-3 h-3" />
                  <span>{lang === 'bn' ? 'দেখুন' : 'View'}</span>
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-gray-400 italic">
                {lang === 'bn' ? 'সনদপত্র আপলোড হয়নি (ঐচ্ছিক)' : 'No certificate uploaded'}
              </p>
            )}
          </div>
        </div>

        {/* Biodata / Resume Document Badge */}
        {biodataDocName && (
          <div className="p-2.5 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-[#0A6A32] text-white flex items-center justify-center shrink-0 shadow-2xs">
                <FileCheck className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <span className="text-[10px] font-black text-emerald-950 block">
                  {lang === 'bn' ? 'সিভি / বায়োডাটা ফাইল সংযুক্ত' : 'Biodata / Resume Attached'}
                </span>
                <p className="text-[10px] text-gray-600 truncate font-mono">{biodataDocName}</p>
              </div>
            </div>
            {biodataDocUrl && (
              <a
                href={biodataDocUrl}
                target="_blank"
                rel="noreferrer"
                className="px-2 py-1 bg-white hover:bg-emerald-100 text-[#0A6A32] border border-emerald-300 rounded-lg text-[10px] font-black shrink-0 transition"
              >
                {lang === 'bn' ? 'ডাউনলোড' : 'Download'}
              </a>
            )}
          </div>
        )}

        {/* Work Portfolio Gallery */}
        {workPhotos && workPhotos.length > 0 && (
          <div className="p-3 bg-slate-50 rounded-xl border border-gray-200 space-y-2">
            <span className="text-[10.5px] font-black text-gray-700 flex items-center gap-1.5">
              <Briefcase className="w-3.5 h-3.5 text-[#0A6A32]" />
              <span>{lang === 'bn' ? 'কাজের বাস্তব চিত্র / পোর্টফোলিও (Work Photos):' : 'Work Portfolio Gallery:'}</span>
              <span className="text-[10px] text-gray-400 font-normal">({workPhotos.length})</span>
            </span>
            <div className="grid grid-cols-4 gap-2">
              {workPhotos.slice(0, 4).map((photoUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setViewingWorkPhoto(photoUrl)}
                  className="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-white hover:scale-105 transition cursor-pointer shadow-2xs relative group"
                >
                  <img src={photoUrl} alt={`Portfolio ${idx + 1}`} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition">
                    <Eye className="w-3.5 h-3.5 text-white" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Transaction & Interaction Badges */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {enableDirectContact && (
            <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-[9.5px] font-bold px-2 py-0.5 rounded-md">
              <PhoneCall className="w-2.5 h-2.5 text-[#0A6A32]" />
              <span>{lang === 'bn' ? 'সরাসরি যোগাযোগ সক্রিয়' : 'Direct Call'}</span>
            </span>
          )}
          {enableInAppBooking && (
            <span className="inline-flex items-center gap-1 bg-sky-50 text-sky-800 border border-sky-200 text-[9.5px] font-bold px-2 py-0.5 rounded-md">
              <Calendar className="w-2.5 h-2.5 text-sky-600" />
              <span>{lang === 'bn' ? 'ইন-অ্যাপ বুকিং' : 'In-App Booking'}</span>
            </span>
          )}
          {enableDigitalPayment && (
            <span className="inline-flex items-center gap-1 bg-purple-50 text-purple-800 border border-purple-200 text-[9.5px] font-bold px-2 py-0.5 rounded-md">
              <ShieldCheck className="w-2.5 h-2.5 text-purple-600" />
              <span>{lang === 'bn' ? 'বিকাশ/নগদ ডিজিটাল পেমেন্ট' : 'Digital Payment'}</span>
            </span>
          )}
        </div>

        {/* Bio / Work Description */}
        <div className="p-3.5 bg-emerald-50/40 rounded-xl border border-emerald-100 space-y-1.5">
          <span className="text-[10.5px] font-black text-emerald-950 flex items-center gap-1">
            <Info className="w-3 h-3 text-[#0A6A32]" />
            <span>{lang === 'bn' ? 'পরিচিতি ও অভিজ্ঞতা (About / Experience):' : 'About / Experience:'}</span>
          </span>
          <p className="text-xs text-gray-700 leading-relaxed font-normal italic">
            "{bio.trim() || (lang === 'bn' ? 'দক্ষতা, পূর্ব অভিজ্ঞতা ও সততার সাথে সেবা দিতে প্রস্তুত।' : 'Dedicated professional ready to provide high quality service.')}"
          </p>
        </div>

        {/* ================= 3. BOTTOM SECTION: SECURE CONTACT & PRIVACY ================= */}
        <div className="space-y-2 pt-1">
          
          {/* Secure Contact Button */}
          <button
            type="button"
            onClick={() => setShowContactNotice(prev => !prev)}
            className="w-full py-3 px-4 bg-[#0A6A32] hover:bg-[#085427] active:scale-[0.99] text-white rounded-xl text-xs sm:text-sm font-black shadow-md flex items-center justify-center gap-2 transition cursor-pointer"
            id="btn-profile-contact-secure"
          >
            <PhoneCall className="w-4 h-4" />
            <span>{lang === 'bn' ? 'সেবাদাতার সাথে যোগাযোগ করুন' : 'Contact Service Provider'}</span>
          </button>

          {/* Secure Escrow & Privacy Notice */}
          <div className="p-2.5 bg-slate-50 border border-gray-200 rounded-xl text-center space-y-1">
            <p className="text-[10px] text-gray-600 flex items-center justify-center gap-1 font-medium">
              <Lock className="w-3 h-3 text-emerald-700" />
              <span>
                {lang === 'bn' 
                  ? 'গোপনীয়তা রক্ষা: এনআইডি নম্বর, মোবাইল ও ব্যক্তিগত ঠিকানা পাবলিকলি গোপন রাখা হয়।' 
                  : 'Privacy Assured: Sensitive NID, Mobile & Home address remain strictly confidential.'}
              </span>
            </p>
            {showContactNotice && (
              <div className="p-2 bg-emerald-50 rounded-lg text-[10px] text-emerald-900 border border-emerald-200 text-left animate-in fade-in duration-200">
                <p className="font-bold">✓ ঝাডিমাটি সুরক্ষা প্রটোকল (Jhadimadi Escrow Protection):</p>
                <p className="mt-0.5 text-gray-700">
                  {lang === 'bn'
                    ? 'অর্ডার বুকিং সম্পন্ন হলে উভয় পক্ষের যাচাইকৃত নিরাপত্তা নিশ্চিতের পর সংযোগ স্থাপন করা হয়। প্রতারণা রোধে কোনো অযাচিত কল গ্রাহক বা সেবাদাতার ফোনে যাবে না।'
                    : 'Contact is safely bridged through Jhadimadi customer service or in-app orders after confirmation.'}
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* ================= MODAL: VIEW CONFIDENTIAL / PRIVATE INFO ================= */}
      {showPrivateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full overflow-hidden shadow-2xl border border-gray-200">
            
            <div className="bg-[#0A6A32] text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lock className="w-4 h-4 text-emerald-200" />
                <h3 className="text-xs sm:text-sm font-bold">
                  {lang === 'bn' ? 'সুরক্ষিত ব্যক্তিগত ও গোপনীয় তথ্য' : 'Confidential & Private Details'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPrivateModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-3.5 text-xs text-gray-800">
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-900 text-[11px] leading-relaxed">
                <span className="font-black">🛡️ নিরাপত্তার নিশ্চয়তা:</span>
                <span className="ml-1">
                  {lang === 'bn'
                    ? 'এই তথ্যগুলো শুধুমাত্র আপনি (সেবাদাতা) ও সিস্টেম অ্যাডমিন দেখতে পাবেন। কোনো সাধারণ ব্যবহারকারী তা দেখতে পারে না।'
                    : 'These details are strictly private and visible only to the verified provider and administrative audit.'}
                </span>
              </div>

              {/* NID Number & Dual Images */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-gray-200 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-bold">{lang === 'bn' ? 'জাতীয় পরিচয়পত্র (NID):' : 'NID Number:'}</span>
                  <span className="font-mono font-black text-gray-900">
                    {nidNumber ? nidNumber : (lang === 'bn' ? 'ভেরিফিকেশন সম্পন্ন' : 'Verified on File')}
                  </span>
                </div>
                {(nidFrontImage || nidBackImage) && (
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-200">
                    <div>
                      <span className="text-[9.5px] font-bold text-gray-500 block mb-1">
                        {lang === 'bn' ? 'এনআইডি সামনের পিঠ' : 'NID Front'}
                      </span>
                      {nidFrontImage ? (
                        <img src={nidFrontImage} alt="NID Front" className="h-14 w-full object-cover rounded border border-gray-300" />
                      ) : (
                        <span className="text-[9px] text-gray-400 italic">{lang === 'bn' ? 'সংযুক্ত নেই' : 'Not attached'}</span>
                      )}
                    </div>
                    <div>
                      <span className="text-[9.5px] font-bold text-gray-500 block mb-1">
                        {lang === 'bn' ? 'এনআইডি পেছনের পিঠ' : 'NID Back'}
                      </span>
                      {nidBackImage ? (
                        <img src={nidBackImage} alt="NID Back" className="h-14 w-full object-cover rounded border border-gray-300" />
                      ) : (
                        <span className="text-[9px] text-gray-400 italic">{lang === 'bn' ? 'সংযুক্ত নেই' : 'Not attached'}</span>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Mobile Number */}
              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-gray-200">
                <span className="text-gray-500 font-bold">{lang === 'bn' ? 'ব্যক্তিগত মোবাইল:' : 'Private Phone:'}</span>
                <span className="font-mono font-black text-[#0A6A32]">
                  {mobileNumber || '018XXXXXXXX'}
                </span>
              </div>

              {/* Father & Mother Name */}
              <div className="space-y-1.5 p-2.5 bg-slate-50 rounded-xl border border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-gray-500 font-bold">{lang === 'bn' ? 'পিতার নাম:' : "Father's Name:"}</span>
                  <span className="font-bold text-gray-900">{fatherName || (lang === 'bn' ? 'রেকর্ডভুক্ত' : 'On record')}</span>
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                  <span className="text-gray-500 font-bold">{lang === 'bn' ? 'মাতার নাম:' : "Mother's Name:"}</span>
                  <span className="font-bold text-gray-900">{motherName || (lang === 'bn' ? 'রেকর্ডভুক্ত' : 'On record')}</span>
                </div>
              </div>

              {/* Permanent / Exact Address */}
              <div className="p-2.5 bg-slate-50 rounded-xl border border-gray-200 space-y-0.5">
                <span className="text-gray-500 font-bold block">{lang === 'bn' ? 'নিবন্ধিত স্থায়ী ঠিকানা:' : 'Registered Address:'}</span>
                <span className="font-medium text-gray-900 block">
                  {localityArea || 'পাড়া/মহল্লা'}, {upazila || 'উপজেলা'}, {district || 'জেলা'}, {division || 'বিভাগ'}
                </span>
              </div>
            </div>

            <div className="p-3 bg-gray-50 border-t border-gray-200 text-center">
              <button
                type="button"
                onClick={() => setShowPrivateModal(false)}
                className="w-full py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ================= MODAL: VIEW CERTIFICATE ================= */}
      {showCertificateViewModal && certificateImage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-200 flex flex-col">
            <div className="bg-[#0A6A32] text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-200" />
                <h3 className="text-xs sm:text-sm font-bold truncate">
                  {certificateTitle || (lang === 'bn' ? 'কারিগরি প্রশিক্ষণ সনদ' : 'Technical Certificate')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCertificateViewModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 bg-gray-100 flex items-center justify-center max-h-[70vh] overflow-auto">
              <img 
                src={certificateImage} 
                alt="Certificate Full View" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
              />
            </div>
            <div className="p-3 bg-white border-t border-gray-200 text-center">
              <button
                type="button"
                onClick={() => setShowCertificateViewModal(false)}
                className="w-full py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: VIEW WORK PORTFOLIO PHOTO ================= */}
      {viewingWorkPhoto && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-200 flex flex-col">
            <div className="bg-[#0A6A32] text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-emerald-200" />
                <h3 className="text-xs sm:text-sm font-bold">
                  {lang === 'bn' ? 'কাজের বাস্তব চিত্র (Portfolio Photo)' : 'Work Portfolio Photo'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setViewingWorkPhoto(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 bg-gray-900 flex items-center justify-center max-h-[70vh] overflow-auto">
              <img 
                src={viewingWorkPhoto} 
                alt="Portfolio Item" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
              />
            </div>
            <div className="p-3 bg-white border-t border-gray-200 text-center">
              <button
                type="button"
                onClick={() => setViewingWorkPhoto(null)}
                className="w-full py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
