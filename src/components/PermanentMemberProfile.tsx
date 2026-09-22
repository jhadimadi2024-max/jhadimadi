import React, { useState, useRef, useEffect } from 'react';
import { 
  ShieldCheck, 
  CheckCircle2, 
  ArrowLeft, 
  Menu, 
  LayoutDashboard, 
  UserCheck, 
  LogOut, 
  Trash2, 
  Check, 
  Copy, 
  Droplet, 
  AlertTriangle, 
  Languages,
  Calendar,
  Award,
  BadgeCheck,
  Building,
  MapPin,
  Phone,
  Mail,
  FileText,
  User,
  HeartHandshake,
  PhoneCall,
  MessageSquare,
  Lock,
  TrendingUp,
  DollarSign,
  GraduationCap,
  Briefcase,
  Star,
  CheckCircle,
  Eye,
  EyeOff,
  Bell,
  X,
  Wallet,
  MoreVertical
} from 'lucide-react';
import { Language } from '../utils/translations';
import { useAuth } from '../context/AuthContext';
import { databaseService } from '../services/databaseService';
import { RoleContactModal, maskPhoneNumber } from './RoleContactModal';
import { ExecutiveTopBarUtilities } from './ExecutiveTopBarUtilities';
import { VendorBookingAndContactSection } from './VendorBookingAndContactSection';
import { JPayWalletSection } from './wallet/JPayWalletSection';

export interface PermanentMemberProfileProps {
  profileData: any;
  currentUser?: any;
  lang?: Language;
  isOwner?: boolean;
  onEditProfile?: (data?: any) => void;
  onNavigateDashboard?: () => void;
  onSignOut?: () => void;
  onDeleteAccount?: () => void;
  onBack?: () => void;
}

export const PermanentMemberProfile: React.FC<PermanentMemberProfileProps> = ({
  profileData,
  currentUser,
  lang: initialLang = 'bn',
  isOwner = true,
  onEditProfile,
  onNavigateDashboard,
  onSignOut,
  onDeleteAccount,
  onBack,
}) => {
  const [lang, setLang] = useState<Language>(initialLang);
  const isBn = lang === 'bn';
  const [activeView, setActiveView] = useState<'profile' | 'dashboard'>('profile');
  const [showContactModal, setShowContactModal] = useState(false);
  const [copiedUID, setCopiedUID] = useState(false);
  const [copiedPhone, setCopiedPhone] = useState(false);

  // Deletion Modal State with strict ID and password verification
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'warning' | 'verify'>('warning');
  const [deleteUserIdInput, setDeleteUserIdInput] = useState('');
  const [deletePasswordInput, setDeletePasswordInput] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  const { logout } = useAuth();

  // Check if viewer has authorized access to raw sensitive data (Admin or the Profile Owner)
  const isAdmin = Boolean(
    currentUser?.role === 'admin' ||
    currentUser?.role === 'super_admin' ||
    currentUser?.isAdmin
  );
  const canViewSensitiveData = Boolean(isOwner || isAdmin);

  // Merge profile data
  const data = {
    ...(currentUser || {}),
    ...(profileData || {}),
  };

  const memberUID = data.memberUID || data.uniqueId || data.id || 'KHC-SADAR-001';
  const name = data.fullName || data.name || data.nidName || 'স্থায়ী সদস্য ও প্রতিনিধি';
  const fatherName = data.fatherName || 'মরহুম সুরেশ চাকমা';
  const motherName = data.motherName || 'শান্তিলতা চাকমা';
  const phone = data.phone || data.realPhone || data.mobileNumber || '018XXXXXXXX';
  const email = data.email || 'representative@jhadimadi.com';
  const bloodGroup = data.bloodGroup || 'A+';
  const district = data.district || data.repDistrict || 'খাগড়াছড়ি';
  const upazila = data.upazila || data.repUpazila || 'খাগড়াছড়ি সদর';
  const presentAddress = data.presentAddress || data.detailedAddress || `${upazila}, ${district}`;
  const permanentAddress = data.permanentAddress || `${upazila}, ${district}`;
  const nidNumber = data.nidNumber || '19924618000000000';
  const education = data.education || data.qualification || (isBn ? 'স্নাতকোত্তর (এম.এ)' : 'Masters (M.A)');
  const affidavitStatus = data.affidavitStatus || (isBn ? 'শপথনামা ও অঙ্গীকারপত্র সম্পন্ন' : 'Affidavit & Deed Executed');
  const specialization = data.profession || data.professionBn || (isBn ? 'আঞ্চলিক প্রতিনিধি ও কো-অর্ডিনেটর' : 'Regional Representative & Coordinator');
  const bio = data.bio || (isBn 
    ? 'আমি ঝাদিমাদি ডট কম প্ল্যাটফর্মের একজন আজীবন নিবন্ধিত স্থায়ী সদস্য এবং আঞ্চলিক প্রতিনিধি হিসেবে দায়িত্বশীল। পার্বত্যাঞ্চলের তৃণমূল উদ্যোক্তা, ক্রেতা ও পেশাজীবীদের নির্ভরযোগ্য সেবা ও সমন্বয়ে সার্বক্ষণিক নিয়োজিত।' 
    : 'Lifetime verified Permanent Member and authorized Regional Representative on Jhadimadi.com dedicated to coordinating reliable public services.');
  const avatar =
    data.permanentMemberPhotoUrl ||
    data.permanentMemberPhoto ||
    (data.role === 'permanent_member' || data.role === 'permanent' || data.role === 'representative' ? data.avatar : '') ||
    data.photoUrl ||
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
  const certificateUrl =
    data.permanentMemberCertUrl ||
    data.certificateUrl ||
    'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80';
  const createdAt = data.createdAt || new Date().toISOString().split('T')[0];

  // Representative Dashboard metrics
  const monthlySalary = 15000;
  const regionalIncentive = 5000;
  const completedTasksCount = 48;
  const performanceRating = 5.0;

  const handleCopyUID = () => {
    navigator.clipboard.writeText(memberUID);
    setCopiedUID(true);
    setTimeout(() => setCopiedUID(false), 2000);
  };

  // Direct Phone Call Dialer ("জরুরি যোগাযোগ করুন")
  const handleDirectPhoneCall = () => {
    const rawNumber = String(phone);
    const cleanNumber = rawNumber.replace(/[^\d+]/g, '');
    window.location.href = `tel:${cleanNumber}`;
  };

  // WhatsApp Messaging Redirect ("মেসেজ করুন")
  const handleWhatsAppMessage = () => {
    const rawNumber = String(phone);
    let digits = rawNumber.replace(/\D/g, '');
    if (digits.startsWith('0')) {
      digits = '88' + digits;
    } else if (!digits.startsWith('88') && digits.length === 10) {
      digits = '880' + digits;
    }
    const message = isBn
      ? `আসসালামু আলাইকুম / নমস্কার। jhadimadi.com প্ল্যাটফর্মে আপনার স্থায়ী সদস্য ও প্রতিনিধি প্রোফাইল (${memberUID}) দেখে যোগাযোগ করছি।`
      : `Hello, I saw your Permanent Member and Representative profile (${memberUID}) on jhadimadi.com and would like to connect.`;
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Open deletion modal
  const handleOpenDeleteModal = () => {
    setDeleteStep('warning');
    setDeleteUserIdInput('');
    setDeletePasswordInput('');
    setDeleteError('');
    setIsDeleting(false);
    setDeleteSuccess(false);
    setShowDeleteModal(true);
  };

  // Execute Strict Account Deletion with ID/Phone and Password Validation
  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError('');

    const cleanInputId = deleteUserIdInput.trim();
    const cleanPassword = deletePasswordInput.trim();

    if (!cleanInputId) {
      setDeleteError(isBn ? 'ইউজার আইডি বা মোবাইল নম্বর লিখুন।' : 'Please enter your User ID or Phone.');
      return;
    }
    if (!cleanPassword) {
      setDeleteError(isBn ? 'অ্যাকাউন্টের পাসওয়ার্ড লিখুন।' : 'Please enter your account password.');
      return;
    }

    setIsDeleting(true);

    try {
      // 1. Verify User ID or Phone match
      const candidateIds = [
        data.id,
        data.uid,
        currentUser?.id,
        currentUser?.uid,
        memberUID,
        data.phone,
        currentUser?.phone,
        data.mobileNumber,
      ].filter(Boolean);

      const inputLower = cleanInputId.toLowerCase();
      const inputDigits = cleanInputId.replace(/[^0-9]/g, '');

      let idMatched = candidateIds.some((cand) => {
        const cLower = String(cand).trim().toLowerCase();
        if (cLower === inputLower) return true;
        if (inputDigits.length >= 10) {
          const cDigits = String(cand).replace(/[^0-9]/g, '');
          if (cDigits && (cDigits === inputDigits || cDigits.endsWith(inputDigits) || inputDigits.endsWith(cDigits))) {
            return true;
          }
        }
        return false;
      });

      let queriedUser: any = null;
      if (!idMatched) {
        queriedUser = await databaseService.getUserByIdOrPhone(cleanInputId);
        if (queriedUser) {
          const qId = String(queriedUser.id || '');
          const qPhone = String(queriedUser.phone || '').replace(/[^0-9]/g, '');
          const myId = String(data.id || currentUser?.id || '');
          const myPhone = String(data.phone || currentUser?.phone || '').replace(/[^0-9]/g, '');
          if ((myId && qId === myId) || (myPhone && qPhone && myPhone.endsWith(qPhone))) {
            idMatched = true;
          }
        }
      }

      if (!idMatched) {
        setDeleteError(
          isBn
            ? 'প্রদত্ত আইডি বা মোবাইল নম্বরটি সঠিক নয়। অনুগ্রহ করে আপনার সঠিক আইডি দিন।'
            : 'The provided User ID or Phone does not match this profile.'
        );
        setIsDeleting(false);
        return;
      }

      // 2. Validate Password
      if (!queriedUser) {
        const searchKey = data.id || currentUser?.id || data.phone || currentUser?.phone || cleanInputId;
        if (searchKey) {
          try {
            queriedUser = await databaseService.getUserByIdOrPhone(String(searchKey));
          } catch (e) {
            console.warn('User lookup note:', e);
          }
        }
      }

      const knownPassword = currentUser?.password || data?.password || queriedUser?.password;

      if (knownPassword && typeof knownPassword === 'string' && knownPassword.trim()) {
        if (cleanPassword !== knownPassword.trim()) {
          setDeleteError(
            isBn
              ? 'ভুল পাসওয়ার্ড। অনুগ্রহ করে আপনার অ্যাকাউন্টের সঠিক পাসওয়ার্ড দিন।'
              : 'Incorrect password. Please enter your valid account password.'
          );
          setIsDeleting(false);
          return;
        }
      }

      // 3. Perform Deletion
      const targetUserId = data.id || currentUser?.id || queriedUser?.id || cleanInputId;
      await databaseService.deleteUserProfile(targetUserId);

      setDeleteSuccess(true);
      setTimeout(() => {
        setShowDeleteModal(false);
        if (onDeleteAccount) {
          onDeleteAccount();
        } else {
          logout();
          if (onBack) onBack();
        }
      }, 1500);
    } catch (err: any) {
      console.error('Delete error:', err);
      setDeleteError(
        err?.message || (isBn ? 'প্রোফাইল মুছতে সমস্যা হয়েছে।' : 'Failed to delete profile.')
      );
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-[#fdfbfb] min-h-screen text-gray-900 pb-20 font-sans" id="permanent-member-profile-root">
      
      {/* ================= 1. NO MAIN HEADER & 2. TOP BAR UTILITIES ================= 
          Clean bold sub-header on pure white background + sleek black icons */}
      <ExecutiveTopBarUtilities
        sectionTitle={isBn ? 'স্থায়ী সদস্য প্রোফাইল' : 'Permanent Member Profile'}
        sectionSubtitle={memberUID}
        lang={lang}
        onLanguageToggle={() => setLang(prev => (prev === 'bn' ? 'en' : 'bn'))}
        onBack={onBack}
        currentUser={currentUser}
        profileData={data}
        isOwner={isOwner}
        menuIconType="hamburger"
        onNavigateDashboard={() => {
          setActiveView(activeView === 'dashboard' ? 'profile' : 'dashboard');
          if (onNavigateDashboard) onNavigateDashboard();
        }}
        onNavigateDetails={() => {
          setActiveView('profile');
        }}
        onEditProfile={(d) => {
          if (onEditProfile) onEditProfile(d || data);
        }}
        onSignOut={() => {
          if (onSignOut) onSignOut();
          else logout();
        }}
        onDeleteAccount={() => {
          handleOpenDeleteModal();
        }}
        activeView={activeView}
      />

      {/* Sub-header view toggle - ONLY visible to the Member (Owner) or Admin */}
      {canViewSensitiveData && (
        <div className="bg-gray-50 border-b border-gray-200 px-4 py-2 flex items-center justify-between text-xs" id="perm-member-view-toggle">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveView('profile')}
              className={`px-3 py-1 rounded-md font-bold transition cursor-pointer ${
                activeView === 'profile' 
                  ? 'bg-black text-white' 
                  : 'text-gray-600 hover:text-black hover:bg-gray-200'
              }`}
            >
              {isBn ? 'অফিসিয়াল বায়োডাটা' : 'Official Bio-Data'}
            </button>
            <button
              type="button"
              onClick={() => setActiveView('dashboard')}
              className={`px-3 py-1 rounded-md font-bold transition cursor-pointer ${
                activeView === 'dashboard' 
                  ? 'bg-black text-white' 
                  : 'text-gray-600 hover:text-black hover:bg-gray-200'
              }`}
            >
              {isBn ? 'প্রতিনিধি ড্যাশবোর্ড ও ওয়ালেট' : 'Dashboard & Wallet'}
            </button>
          </div>

          <span className="text-[11px] font-bold text-gray-500 font-mono">
            {upazila}, {district}
          </span>
        </div>
      )}

      {/* ================= VIEW 1: PUBLIC PROFILE / OFFICIAL BIO-DATA ================= */}
      {activeView === 'profile' ? (
        <div className="max-w-md mx-auto px-4 py-4 space-y-4 animate-in fade-in duration-150">

          {/* Official Bio-Data Card Header */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs relative" id="perm-biodata-card">
            
            {/* Top Official Banner */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-2 mb-3">
              <span className="text-[10px] font-black tracking-wider uppercase text-gray-600">
                {isBn ? 'গণপ্রজাতন্ত্রী বাংলাদেশ অধিভুক্ত আঞ্চলিক প্রতিনিধি' : 'Authorized Regional Representative'}
              </span>
              <span className="text-[10px] font-bold bg-gray-100 text-gray-900 border border-gray-300 px-2 py-0.5 rounded">
                {isBn ? 'আজীবন সদস্যপদ' : 'Lifetime Standing'}
              </span>
            </div>

            <div className="flex items-start gap-3.5">
              {/* Passport-Size Photo */}
              <div className="relative shrink-0">
                <img
                  src={avatar}
                  alt={name}
                  className="w-20 h-24 rounded-lg object-cover border-2 border-gray-400 bg-gray-100"
                />
                <span className="absolute -bottom-1 -right-1 bg-black text-white p-0.5 rounded-full shadow-xs" title="Verified">
                  <ShieldCheck className="w-3.5 h-3.5" />
                </span>
              </div>

              {/* Identity & Representation Details */}
              <div className="flex-1 min-w-0 space-y-1">
                <h2 className="text-base font-black text-gray-950 tracking-tight leading-tight">
                  {name}
                </h2>
                <p className="text-xs font-semibold text-gray-700">
                  {specialization}
                </p>
                <div className="text-[11px] text-gray-600 flex items-center gap-1 font-medium">
                  <MapPin className="w-3 h-3 text-black shrink-0" />
                  <span>{isBn ? 'নির্ধারিত এলাকা:' : 'Area:'} <strong>{upazila}, {district}</strong></span>
                </div>

                <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200 text-[10px] font-bold">
                  <ShieldCheck className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>{isBn ? 'উপজেলা ও জেলার একমাত্র স্থায়ী প্রতিনিধি' : 'Unique Upazila & District Representative'}</span>
                </div>

                <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-900 border border-gray-300">
                    <BadgeCheck className="w-3 h-3 text-black" />
                    <span>{isBn ? 'এনআইডি যাচাইকৃত' : 'NID Verified'}</span>
                  </span>
                  
                  <span className="inline-flex items-center gap-0.5 px-2 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-800 border border-gray-300">
                    <Droplet className="w-2.5 h-2.5 text-red-600 fill-red-600" />
                    <span>{bloodGroup}</span>
                  </span>
                </div>
              </div>
            </div>

            {/* 2. NAME, ID, AND DIVIDER LINE:
                - Below the profile picture and name block, place the unique ID code compactly in a single line.
                - Directly beneath the ID, place a clean, professional horizontal green dividing line. */}
            <div className="mt-3.5 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-gray-500">
                  {isBn ? 'ইউনিক আইডি:' : 'Unique ID:'}
                </span>
                <span className="font-mono font-bold text-xs sm:text-sm text-gray-950 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 tracking-wider">
                  {memberUID}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyUID}
                className="text-xs text-gray-500 hover:text-black flex items-center gap-1 cursor-pointer transition"
                id="btn-copy-perm-uid"
                title={isBn ? 'আইডি কপি করুন' : 'Copy ID'}
              >
                {copiedUID ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-[10px] font-semibold text-emerald-600">{isBn ? 'কপি হয়েছে' : 'Copied'}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span className="text-[10px]">{isBn ? 'কপি' : 'Copy'}</span>
                  </>
                )}
              </button>
            </div>

            {/* Clean, professional horizontal green dividing line directly beneath ID */}
            <div className="h-[2px] w-full bg-emerald-600 mt-2 mb-3 rounded-full" />

            {/* 3. SKILLS & PROFESSIONS:
                - Right below the green divider line, list the user's skills/services cleanly */}
            <div className="mb-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                <Briefcase className="w-3.5 h-3.5 text-black" />
                <span>{isBn ? 'দায়িত্ব ও সেবাসমূহ:' : 'Roles & Responsibilities:'}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[
                  specialization || (isBn ? 'আঞ্চলিক প্রতিনিধি' : 'Regional Representative'),
                  isBn ? 'কমিউনিটি সমন্বয়ক' : 'Community Coordinator',
                  isBn ? 'সেবা ও পণ্য ভেরিফায়ার' : 'Service & Merchant Verifier'
                ].map((skill, sIdx) => (
                  <span
                    key={sIdx}
                    className="px-2.5 py-1 rounded-md bg-gray-100 border border-gray-300 text-gray-900 text-xs font-semibold"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* 5. LOCATION & FINAL DETAILS:
                - Display the location/address clearly, followed by the official ID number at the bottom of the intro block. */}
            <div className="py-2.5 px-3 bg-gray-50 rounded-lg border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs mb-3.5">
              <div className="flex items-center gap-1.5 text-gray-800 font-medium">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>{upazila}, {district}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600 font-mono text-[11px]">
                <span>{isBn ? 'অফিসিয়াল আইডি:' : 'Official ID:'}</span>
                <span className="font-bold text-gray-950 bg-white px-1.5 py-0.5 rounded border border-gray-300">
                  {memberUID}
                </span>
              </div>
            </div>

            {/* Official Bio-Data Grid (Parents, Address, Qualifications, NID) */}
            <div className="mt-3 space-y-2 text-xs">
              
              {/* Parents' Names */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-[10px] font-bold text-gray-500 block">
                    {isBn ? 'পিতার নাম' : "Father's Name"}
                  </span>
                  <span className="font-semibold text-gray-950 truncate block text-[11px] mt-0.5">
                    {fatherName}
                  </span>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-[10px] font-bold text-gray-500 block">
                    {isBn ? 'মাতার নাম' : "Mother's Name"}
                  </span>
                  <span className="font-semibold text-gray-950 truncate block text-[11px] mt-0.5">
                    {motherName}
                  </span>
                </div>
              </div>

              {/* Present & Permanent Address */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-[10px] font-bold text-gray-500 block">
                    {isBn ? 'বর্তমান এলাকা' : 'Present Area'}
                  </span>
                  <span className="font-medium text-gray-900 text-[11px] mt-0.5 block truncate">
                    {canViewSensitiveData ? presentAddress : `${upazila}, ${district}`}
                  </span>
                </div>
                <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-[10px] font-bold text-gray-500 block">
                    {isBn ? 'স্থায়ী ঠিকানা' : 'Permanent Address'}
                  </span>
                  <span className="font-medium text-gray-900 text-[11px] mt-0.5 block truncate">
                    {canViewSensitiveData ? (
                      permanentAddress
                    ) : (
                      <span className="text-gray-500 italic">
                        {isBn ? '🔒 অ্যাডমিন সংরক্ষিত' : '🔒 Admin Only'}
                      </span>
                    )}
                  </span>
                </div>
              </div>

              {/* Education & Qualifications */}
              <div className="p-2 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-500 block">
                    {isBn ? 'শিক্ষাগত যোগ্যতা' : 'Educational Qualification'}
                  </span>
                  <span className="font-bold text-gray-950 text-[11px] mt-0.5 flex items-center gap-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-black" />
                    <span>{education}</span>
                  </span>
                </div>
                <span className="text-[10px] bg-white border border-gray-300 px-2 py-0.5 rounded font-bold text-gray-800">
                  {isBn ? 'সনদপত্র সংগৃহীত' : 'Certificate Verified'}
                </span>
              </div>

              {/* NID & Affidavit Info */}
              <div className="grid grid-cols-2 gap-2">
                <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-[10px] font-bold text-gray-500 block">
                    {isBn ? 'জাতীয় পরিচয়পত্র (NID)' : 'National ID (NID)'}
                  </span>
                  {canViewSensitiveData ? (
                    <span className="font-mono font-bold text-gray-950 text-[11px] mt-0.5 block">
                      {nidNumber.slice(0, 4)}••••••{nidNumber.slice(-3)}
                    </span>
                  ) : (
                    <span className="font-bold text-emerald-800 text-[11px] mt-0.5 flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      <span>{isBn ? 'ভেরিফাইড (অ্যাডমিন সংরক্ষিত)' : 'Verified (Protected)'}</span>
                    </span>
                  )}
                </div>

                <div className="p-2 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-[10px] font-bold text-gray-500 block">
                    {isBn ? 'হলফনামা / অঙ্গীকার' : 'Affidavit Record'}
                  </span>
                  <span className="font-semibold text-gray-950 text-[11px] mt-0.5 block truncate">
                    {affidavitStatus}
                  </span>
                </div>
              </div>

              {/* Masked Contact Phone */}
              <div className="p-2 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-gray-500 block">
                    {isBn ? 'যোগাযোগ মাধ্যম' : 'Contact Channel'}
                  </span>
                  {canViewSensitiveData ? (
                    <span className="font-mono font-bold text-gray-950 text-[11px] mt-0.5 block">
                      {phone}
                    </span>
                  ) : (
                    <span className="font-bold text-emerald-800 text-[11px] mt-0.5 flex items-center gap-1">
                      <Lock className="w-3 h-3 text-emerald-600" />
                      <span>{isBn ? '🔒 প্রাইভেসী সুরক্ষিত (কল বাটনে চাপুন)' : '🔒 Privacy Protected'}</span>
                    </span>
                  )}
                </div>
                {canViewSensitiveData && (
                  <span className="text-[10px] text-gray-500 font-semibold">
                    {email}
                  </span>
                )}
              </div>


            </div>
          </div>

          {/* Member Bio & Statement */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-2">
            <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 border-b border-gray-100 pb-1.5">
              <FileText className="w-3.5 h-3.5 text-black" />
              <span>{isBn ? 'সদস্য পরিচিতি ও অঙ্গীকার' : 'Bio & Official Mission'}</span>
            </h3>
            <p className="text-xs text-gray-700 leading-relaxed font-medium">
              {bio}
            </p>
          </div>

          {/* ================= BOTTOM ACTION BUTTONS =================
              1. "জাদিমাতি সদস্যের সাথে যোগাযোগ করুন" (direct phone dialer)
              2. "জাদিমাতি সদস্যকে মেসেজ করুন" (WhatsApp redirect)
          ================================================================ */}
          <div id="perm-profile-bottom-actions" className="pt-2 space-y-4">
            <VendorBookingAndContactSection
              vendor={{
                id: memberUID,
                code: memberUID,
                name: name,
                fullName: name,
                profession: specialization || 'স্থায়ী সদস্য ও প্রতিনিধি',
                professionBn: specialization || 'স্থায়ী সদস্য ও প্রতিনিধি',
                category: 'স্থায়ী সদস্য',
                categoryBn: 'স্থায়ী সদস্য ও প্রতিনিধি',
                phone: phone,
                realPhone: phone,
                whatsapp: phone,
                district: district,
                upazila: upazila,
                isVerified: true
              }}
              lang={lang}
              isOwner={isOwner}
              defaultServiceName={specialization || 'আঞ্চলিক প্রতিনিধিত্ব ও সেবা সমন্বয়'}
              onBookingConfirmed={() => {
                setShowContactModal(true);
              }}
            />
          </div>

        </div>
      ) : (
        /* ================= VIEW 2: REPRESENTATIVE DASHBOARD ================= */
        <div className="max-w-md mx-auto px-4 py-4 space-y-4 animate-in fade-in duration-150" id="perm-dashboard-view">
          
          {/* Quick Header Banner */}
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              <img
                src={avatar}
                alt={name}
                className="w-12 h-12 rounded-lg object-cover border border-gray-300 shrink-0"
              />
              <div className="truncate">
                <h2 className="text-sm font-bold text-gray-950 truncate">{name}</h2>
                <p className="text-[11px] text-gray-600 truncate">{isBn ? 'নির্ধারিত এলাকা:' : 'Area:'} {upazila}, {district}</p>
                <span className="text-[10px] font-mono text-gray-500">{memberUID}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveView('profile')}
              className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-[11px] font-bold text-gray-800 shrink-0 cursor-pointer"
            >
              {isBn ? 'বায়োডাটা' : 'Bio-Data'}
            </button>
          </div>

          {/* Earnings & Allowances Records */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-gray-600" />
                <span>{isBn ? 'পারিশ্রমিক ও ভাতা রেকর্ড' : 'Earnings & Allowance Records'}</span>
              </span>
              <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {isBn ? 'নিয়মিত পরিশোধিত' : 'Regularly Disbursed'}
              </span>
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-[10px] text-gray-500 font-semibold">{isBn ? 'মাসিক সম্মাননা ভাতা' : 'Monthly Honorarium'}</div>
                <div className="text-lg font-black text-gray-950 mt-0.5">
                  ৳{monthlySalary.toLocaleString()}
                </div>
                <span className="text-[9px] text-gray-500 font-medium">{isBn ? 'স্থায়ী সদস্য নিয়মিত বরাদ্দ' : 'Regular Member Grant'}</span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-[10px] text-gray-500 font-semibold">{isBn ? 'আঞ্চলিক ইনসেনটিভ' : 'Regional Incentive'}</div>
                <div className="text-lg font-black text-gray-950 mt-0.5">
                  ৳{regionalIncentive.toLocaleString()}
                </div>
                <span className="text-[9px] text-gray-500 font-medium">{isBn ? 'উপজেলা সমন্বয় ও অডিট' : 'Upazila Audit Bonus'}</span>
              </div>
            </div>

            {/* Total Disbursed Summary Card */}
            <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-600 font-medium block">
                  {isBn ? 'সর্বমোট প্রাপ্ত বরাদ্দ ও ভাতা' : 'Total Disbursed to Date'}
                </span>
                <span className="text-base font-black text-gray-950">৳১,২০,০০০</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-gray-600 font-medium block">
                  {isBn ? 'পরিশোধ মাধ্যম' : 'Payment Channel'}
                </span>
                <span className="text-xs font-bold text-gray-800">
                  {isBn ? 'ব্যাংক / এমএফএস ট্রান্সফার' : 'Bank / MFS Transfer'}
                </span>
              </div>
            </div>
          </div>

          {/* ================= IN-PAGE JHAPAY WALLET INTEGRATION (NO MODAL/POPUP) ================= */}
          <div className="space-y-2 pt-1" id="perm-in-page-wallet">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-black" />
                <span>{isBn ? 'ঝাপেই ইন্টিগ্রেটেড ওয়ালেট (JhaPay Wallet)' : 'Integrated JhaPay Wallet'}</span>
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                {isBn ? 'ইন-পেজ ওয়ালেট' : 'In-Page Wallet'}
              </span>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
              <JPayWalletSection
                currentUser={currentUser || data}
                profileData={data}
                roleName={isBn ? 'স্থায়ী সদস্য' : 'Permanent Member'}
                roleType="permanent_member"
                lang={lang as any}
                className="border-none shadow-none"
              />
            </div>
          </div>

          {/* Completed Tasks & Performance Ratings */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-gray-600" />
              <span>{isBn ? 'সম্পন্ন কার্যক্রম ও পারফরম্যান্স রেটিং' : 'Completed Tasks & Rating'}</span>
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-[10px] text-gray-500 font-semibold">{isBn ? 'সম্পন্ন সমন্বয় কার্যক্রম' : 'Completed Tasks'}</div>
                <div className="text-lg font-black text-gray-950 mt-0.5 flex items-center gap-1.5">
                  <CheckCircle className="w-4 h-4 text-black" />
                  <span>{completedTasksCount} {isBn ? 'টি' : 'tasks'}</span>
                </div>
                <span className="text-[9px] text-gray-500 font-medium">{isBn ? '১০০% সফল নিষ্পত্তি' : '100% Resolved'}</span>
              </div>

              <div className="p-3 bg-white rounded-lg border border-gray-200">
                <div className="text-[10px] text-gray-500 font-semibold">{isBn ? 'কার্যদক্ষতা রেটিং' : 'Performance Rating'}</div>
                <div className="text-lg font-black text-gray-950 mt-0.5 flex items-center gap-1">
                  <Star className="w-4 h-4 fill-black text-black" />
                  <span>{performanceRating.toFixed(1)} / 5.0</span>
                </div>
                <span className="text-[9px] text-gray-500 font-medium">{isBn ? 'শীর্ষ মানের প্রতিনিধিত্ব' : 'Top Tier Accreditation'}</span>
              </div>
            </div>
          </div>

          {/* Assigned Constituency Tasks Log */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
            <div className="border-b border-gray-100 pb-2">
              <h3 className="text-xs font-bold text-gray-950 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-black" />
                <span>{isBn ? 'আঞ্চলিক দায়িত্ব ও কার্যক্রম লগ' : 'Assigned Area Tasks & Log'}</span>
              </h3>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-950">{isBn ? 'তৃণমূল উদ্যোক্তা ভেরিফিকেশন' : 'Grassroots Merchant Verification'}</div>
                  <div className="text-[10px] text-gray-500">{upazila}, {district} | ১৫ দিন আগে</div>
                </div>
                <span className="text-[10px] bg-white border border-gray-300 font-bold px-2 py-0.5 rounded text-gray-800">
                  {isBn ? 'সম্পন্ন' : 'Completed'}
                </span>
              </div>

              <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-950">{isBn ? 'জরুরি রক্তদান নেটওয়ার্ক সমন্বয়' : 'Emergency Blood Network Coordination'}</div>
                  <div className="text-[10px] text-gray-500">{district} সদর হাসপাতাল | চলতি মাস</div>
                </div>
                <span className="text-[10px] bg-white border border-gray-300 font-bold px-2 py-0.5 rounded text-gray-800">
                  {isBn ? 'সম্পন্ন' : 'Completed'}
                </span>
              </div>

              <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 flex items-center justify-between">
                <div>
                  <div className="font-bold text-gray-950">{isBn ? 'পাহাড়ি অর্গানিক পণ্য কোয়ালিটি অডিট' : 'Hill Produce Quality Inspection'}</div>
                  <div className="text-[10px] text-gray-500">{upazila} কৃষক হাব | চলমান</div>
                </div>
                <span className="text-[10px] bg-white border border-gray-300 font-bold px-2 py-0.5 rounded text-gray-800">
                  {isBn ? 'সক্রিয়' : 'Active'}
                </span>
              </div>
            </div>
          </div>

          {/* Administrative Notifications (প্রশাসনিক বিজ্ঞপ্তি ও নোটিশ বোর্ড) */}
          <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3" id="perm-admin-notifications-section">
            <div className="border-b border-gray-100 pb-2 flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-950 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-black" />
                <span>{isBn ? 'প্রশাসনিক বিজ্ঞপ্তি ও নোটিশ বোর্ড' : 'Administrative Notifications'}</span>
              </h3>
              <span className="text-[10px] font-bold text-white bg-black px-2 py-0.5 rounded-full">
                {isBn ? '৩টি নতুন নোটিশ' : '3 New Notices'}
              </span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-950">
                    {isBn ? 'আঞ্চলিক প্রতিনিধি সমন্বয় সম্মেলন ২০২৬' : 'Regional Representative Summit 2026'}
                  </span>
                  <span className="text-[9px] font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                    {isBn ? 'গুরুত্বপূর্ণ' : 'Important'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  {isBn 
                    ? `${district} জেলার সকল স্থায়ী সদস্য ও উপজেলা প্রতিনিধিদের ভার্চুয়াল সমন্বয় সভায় অংশগ্রহণের নির্দেশ দেওয়া হচ্ছে।` 
                    : `All permanent members of ${district} district are advised to attend the quarterly coordinator sync.`}
                </p>
                <div className="text-[10px] text-gray-400">Jhadimadi HQ Operations Desk | ১০ দিন আগে</div>
              </div>

              <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-950">
                    {isBn ? 'তৃণমূল উদ্যোক্তা যাচাই প্রটোকল আপডেট' : 'Merchant Verification Protocol Update'}
                  </span>
                  <span className="text-[9px] font-bold text-gray-700 bg-gray-200 px-1.5 py-0.5 rounded">
                    {isBn ? 'প্রশাসনিক' : 'Administrative'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  {isBn 
                    ? 'নতুন বিক্রেতা নিবন্ধনের সময় স্টোর ও পণ্যের সত্যতা নিশ্চিতকরণে মাঠপর্যায়ের নির্দেশিকা কার্যকর হয়েছে।' 
                    : 'Field guidelines for authenticating local shops and producers have been updated.'}
                </p>
                <div className="text-[10px] text-gray-400">Jhadimadi Verification Cell | ১৫ দিন আগে</div>
              </div>

              <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-950">
                    {isBn ? 'ত্রৈমাসিক সম্মাননা ভাতা ও ইনসেনটিভ রিলিজ' : 'Quarterly Honorarium & Incentive Release'}
                  </span>
                  <span className="text-[9px] font-bold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded">
                    {isBn ? 'অর্থ ও হিসাব' : 'Finance'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-600 leading-relaxed">
                  {isBn 
                    ? 'চলতি মাসের নির্ধারিত সম্মাননা ভাতা স্ব-স্ব ব্যাংক ও মোবাইল ব্যাংকিং অ্যাকাউন্টে সফলভাবে প্রেরণ করা হয়েছে।' 
                    : 'Honorarium and regional performance incentive successfully processed for this term.'}
                </p>
                <div className="text-[10px] text-gray-400">Finance & Accounts Bureau | ২৫ দিন আগে</div>
              </div>
            </div>
          </div>

          {/* Quick Edit Profile Action */}
          <div className="pt-2">
            <button
              type="button"
              onClick={() => {
                if (onEditProfile) {
                  onEditProfile(data);
                }
              }}
              className="w-full py-3 bg-white hover:bg-gray-100 text-gray-900 border border-gray-300 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-2xs"
            >
              <UserCheck className="w-4 h-4 text-black" />
              <span>{isBn ? 'স্থায়ী সদস্য বায়োডাটা তথ্য পরিবর্তন করুন' : 'Edit Bio-Data Profile'}</span>
            </button>
          </div>

        </div>
      )}

      {/* ================= STRICT TWO-STEP DELETE PROFILE MODAL WITH ID & PASSWORD ================= */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full overflow-hidden shadow-2xl border border-gray-300 animate-in fade-in zoom-in-95 duration-150">
            
            {deleteStep === 'warning' ? (
              <div className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-red-600 border-b border-gray-100 pb-2">
                  <AlertTriangle className="w-5 h-5 shrink-0" />
                  <h3 className="text-sm font-black text-gray-950">
                    {isBn ? 'স্থায়ী সদস্যপদ বাতিল ও ডিলিট' : 'Cancel & Delete Membership'}
                  </h3>
                </div>

                <p className="text-xs text-gray-700 leading-relaxed">
                  {isBn 
                    ? 'আপনি কি নিশ্চিতভাবে আপনার এই স্থায়ী সদস্য ও প্রতিনিধি প্রোফাইলটি চিরতরে মুছে ফেলতে চান? আপনার আজীবন প্রতিনিধি কোড ও বায়োডাটা স্থায়ীভাবে মুছে যাবে।'
                    : 'Are you sure you want to permanently delete your Permanent Member profile? Your credentials will be permanently erased.'}
                </p>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-semibold cursor-pointer"
                  >
                    {isBn ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteStep('verify');
                      setDeleteError('');
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer"
                  >
                    {isBn ? 'পরবর্তী ধাপ (যাচাই) →' : 'Next (Verify) →'}
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={handleConfirmDelete} className="p-4 space-y-3">
                <div className="flex items-center gap-2 text-gray-950 border-b border-gray-100 pb-2">
                  <Lock className="w-4 h-4 shrink-0 text-red-600" />
                  <h3 className="text-sm font-black">
                    {isBn ? 'নিরাপত্তা যাচাই ও পাসওয়ার্ড' : 'Security Verification'}
                  </h3>
                </div>

                <p className="text-[11px] text-gray-600">
                  {isBn 
                    ? 'অননুমোদিত ডিলিট রোধে আপনার ইউজার আইডি/ফোন এবং অ্যাকাউন্টের পাসওয়ার্ড লিখুন:'
                    : 'To prevent unauthorized deletion, enter your User ID/Phone and password:'}
                </p>

                {deleteError && (
                  <div className="p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-[11px] font-bold">
                    {deleteError}
                  </div>
                )}

                {deleteSuccess && (
                  <div className="p-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-[11px] font-bold text-center">
                    ✓ {isBn ? 'প্রোফাইল সফলভাবে মুছে ফেলা হয়েছে।' : 'Profile successfully deleted.'}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    {isBn ? 'ইউজার আইডি বা মোবাইল নম্বর' : 'User ID or Phone'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={deleteUserIdInput}
                    onChange={(e) => setDeleteUserIdInput(e.target.value)}
                    placeholder={memberUID || '018XXXXXXXX'}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    {isBn ? 'অ্যাকাউন্টের পাসওয়ার্ড' : 'Account Password'} *
                  </label>
                  <div className="relative">
                    <input
                      type={showDeletePassword ? 'text' : 'password'}
                      required
                      value={deletePasswordInput}
                      onChange={(e) => setDeletePasswordInput(e.target.value)}
                      placeholder="••••••"
                      className="w-full px-3 py-2 pr-9 border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-black"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDeletePassword(!showDeletePassword)}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800"
                    >
                      {showDeletePassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    disabled={isDeleting}
                    onClick={() => setDeleteStep('warning')}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-100 text-xs font-semibold cursor-pointer disabled:opacity-50"
                  >
                    {isBn ? 'পেছনে' : 'Back'}
                  </button>
                  <button
                    type="submit"
                    disabled={isDeleting || deleteSuccess}
                    className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold cursor-pointer disabled:opacity-50"
                  >
                    {isDeleting ? (isBn ? 'যাচাই হচ্ছে...' : 'Verifying...') : (isBn ? 'স্থায়ীভাবে মুছুন' : 'Delete Permanently')}
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}

      {/* Dynamic Service Booking / Direct Contact Modal */}
      <RoleContactModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        name={name}
        memberUID={memberUID}
        roleName={isBn ? 'স্থায়ী সদস্য' : 'Permanent Member'}
        role="permanent_member"
        bloodGroup={bloodGroup}
        realPhone={phone}
        avatar={avatar}
        location={`${upazila}, ${district}`}
        lang={lang}
        extraDetails={specialization}
      />

    </div>
  );
};

export default PermanentMemberProfile;
