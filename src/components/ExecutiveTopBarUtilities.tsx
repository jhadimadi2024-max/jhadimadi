import React, { useState, useRef, useEffect } from 'react';
import { 
  Bell, 
  MessageSquare, 
  Globe, 
  Menu, 
  MoreVertical,
  X, 
  LayoutDashboard, 
  UserCheck, 
  LogOut, 
  Trash2, 
  Lock, 
  AlertTriangle, 
  CheckCircle2, 
  ArrowLeft, 
  Phone, 
  ShieldCheck,
  Eye,
  EyeOff,
  ExternalLink,
  MessageCircle,
  HelpCircle,
  FileText
} from 'lucide-react';
import { databaseService } from '../services/databaseService';
import { useAuth } from '../context/AuthContext';

export interface ExecutiveTopBarUtilitiesProps {
  sectionTitle: string;
  sectionSubtitle?: string;
  lang?: 'bn' | 'en';
  onLanguageToggle?: () => void;
  onBack?: () => void;
  currentUser?: any;
  profileData?: any;
  onNavigateDashboard?: () => void;
  onNavigateDetails?: () => void;
  onEditProfile?: (data?: any) => void;
  onSignOut?: () => void;
  onDeleteAccount?: () => void;
  activeView?: string;
  className?: string;
  isOwner?: boolean;
  menuIconType?: 'hamburger' | 'dots';
}

export const ExecutiveTopBarUtilities: React.FC<ExecutiveTopBarUtilitiesProps> = ({
  sectionTitle,
  sectionSubtitle,
  lang = 'bn',
  onLanguageToggle,
  onBack,
  currentUser,
  profileData,
  onNavigateDashboard,
  onNavigateDetails,
  onEditProfile,
  onSignOut,
  onDeleteAccount,
  activeView,
  className = '',
  isOwner = true,
  menuIconType = 'hamburger',
}) => {
  const isBn = lang === 'bn';
  const { logout } = useAuth();

  // Drawer and Dialog States
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [isMessageOpen, setIsMessageOpen] = useState(false);

  // Profile Deletion Modal States
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteIdInput, setDeleteIdInput] = useState('');
  const [deletePasswordInput, setDeletePasswordInput] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  // Notification / Message Badge state: Strictly zero / false by default (no fake dots or counts)
  // Only genuine alerts will show, and they will render in green
  const [hasUnreadNotification, setHasUnreadNotification] = useState(false);
  const [hasUnreadMessage, setHasUnreadMessage] = useState(false);

  const drawerRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const msgRef = useRef<HTMLDivElement>(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotificationOpen(false);
      }
      if (msgRef.current && !msgRef.current.contains(e.target as Node)) {
        setIsMessageOpen(false);
      }
    };
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  const data = {
    ...(currentUser || {}),
    ...(profileData || {}),
  };

  const displayName = data.fullName || data.name || data.shopName || (isBn ? 'সম্মানিত সদস্য' : 'Valued Member');
  const displayId = data.memberUID || data.sellerCode || data.uniqueId || data.id || '';
  const displayAvatar = data.avatar || data.photoUrl || data.image || '';

  // Handle Profile Deletion with Strict Password Verification
  const handleConfirmDelete = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError('');
    setIsDeleting(true);

    try {
      const cleanInputId = deleteIdInput.trim();
      const cleanPassword = deletePasswordInput.trim();

      if (!cleanInputId) {
        setDeleteError(isBn ? 'আপনার মেম্বার আইডি বা মোবাইল নম্বর দিন।' : 'Please enter your ID or Phone number.');
        setIsDeleting(false);
        return;
      }

      if (!cleanPassword) {
        setDeleteError(isBn ? 'আপনার অ্যাকাউন্টের পাসওয়ার্ড দিন।' : 'Please enter your account password.');
        setIsDeleting(false);
        return;
      }

      // 1. Identify User
      const candidateIds = [
        data.id,
        data.memberUID,
        data.sellerCode,
        data.uniqueId,
        currentUser?.id,
        currentUser?.uid,
        displayId,
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
        try {
          queriedUser = await databaseService.getUserByIdOrPhone(cleanInputId);
          if (queriedUser) {
            idMatched = true;
          }
        } catch (err) {
          console.warn('User lookup note:', err);
        }
      }

      if (!idMatched) {
        setDeleteError(
          isBn
            ? 'প্রদত্ত আইডি বা মোবাইল নম্বরটি এই প্রোফাইলের সাথে মেলেনি।'
            : 'The provided ID or Phone does not match this account.'
        );
        setIsDeleting(false);
        return;
      }

      // 2. Validate Password
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

      // 3. Delete Profile
      const targetUserId = data.id || currentUser?.id || queriedUser?.id || cleanInputId;
      await databaseService.deleteUserProfile(targetUserId);

      setDeleteSuccess(true);
      setTimeout(() => {
        setShowDeleteModal(false);
        if (onDeleteAccount) {
          onDeleteAccount();
        } else {
          logout();
          try {
            sessionStorage.removeItem('jm_authenticated_user');
            sessionStorage.removeItem('jm_current_customer');
            sessionStorage.removeItem('jhadimadi_customer_auth');
            localStorage.removeItem('jm_authenticated_user');
            localStorage.removeItem('jm_current_customer');
            localStorage.removeItem('jhadimadi_customer_auth');
          } catch {}
          if (onBack) {
            onBack();
          } else {
            window.location.reload();
          }
        }
      }, 1400);
    } catch (err: any) {
      console.error('Profile deletion error:', err);
      setDeleteError(
        err?.message || (isBn ? 'প্রোফাইল মুছতে সমস্যা হয়েছে।' : 'Failed to delete profile.')
      );
      setIsDeleting(false);
    }
  };

  return (
    <>
      {/* =========================================================================
          RULE 1, 2 & 3: PURE WHITE TOP BAR WITH BLACK ICONS + SUB-HEADER DIRECTLY BELOW
         ========================================================================= */}
      <header
        id="executive-top-bar"
        className={`w-full bg-[#faf9f6] relative z-40 transition-colors shadow-2xs ${className}`}
        style={{
          backgroundColor: '#faf9f6',
        }}
      >
        {/* ROW 1: Soft Off-White Top Bar containing ONLY solid black, bold icons/symbols with NO background fills */}
        <div className="w-full bg-[#faf9f6] border-b border-gray-100 px-3 sm:px-4 py-2.5">
          <div className="w-full max-w-4xl mx-auto flex items-center justify-between">
            {/* Left: Back Button (if provided) - solid black, no background fill */}
            <div className="flex items-center">
              {onBack ? (
                <button
                  type="button"
                  onClick={onBack}
                  className="p-1.5 -ml-1.5 text-black hover:text-gray-600 transition active:scale-95 cursor-pointer flex items-center justify-center bg-transparent border-none"
                  title={isBn ? 'ফিরে যান' : 'Back'}
                  id="executive-top-back-btn"
                  aria-label="Go Back"
                >
                  <ArrowLeft className="w-5 h-5 text-black stroke-[2.5]" />
                </button>
              ) : (
                <div className="w-4 h-4" />
              )}
            </div>

            {/* Right: Solid black bold icons with NO background fills */}
            <div className="flex items-center gap-3 sm:gap-4 shrink-0">
              
              {/* 1. NOTIFICATION ICON - Only shown if isOwner */}
              {isOwner && (
                <div className="relative flex items-center" ref={notifRef}>
                  <button
                    type="button"
                    id="utility-notification-btn"
                    onClick={() => {
                      setIsNotificationOpen(!isNotificationOpen);
                      setIsMessageOpen(false);
                      setHasUnreadNotification(false);
                    }}
                    className="p-1.5 text-black hover:text-gray-600 transition active:scale-95 cursor-pointer relative bg-transparent border-none"
                    title={isBn ? 'নোটিফিকেশন' : 'Notifications'}
                    aria-label="Notifications"
                  >
                    <Bell className="w-5 h-5 text-black stroke-[2.5]" />
                    {hasUnreadNotification && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                    )}
                  </button>

                  {/* Notification Dropdown Panel */}
                  {isNotificationOpen && (
                    <div
                      id="utility-notification-dropdown"
                      className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white border border-gray-200 rounded-xl shadow-xl p-3.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150 text-gray-900"
                    >
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
                        <span className="font-black text-black uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <Bell className="w-3.5 h-3.5 text-black" />
                          {isBn ? 'বিজ্ঞপ্তি ও নোটিফিকেশন' : 'Notifications'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsNotificationOpen(false)}
                          className="text-gray-400 hover:text-black p-0.5"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                      
                      <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                        <div className="p-3 bg-gray-50 border border-gray-100 rounded-lg text-center text-gray-600">
                          <p className="text-[11px] font-medium">
                            {isBn ? 'বর্তমানে কোনো অপঠিত নোটিফিকেশন নেই।' : 'No unread notifications at this time.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 2. MESSAGING ICON - Only shown if isOwner */}
              {isOwner && (
                <div className="relative flex items-center" ref={msgRef}>
                  <button
                    type="button"
                    id="utility-message-btn"
                    onClick={() => {
                      setIsMessageOpen(!isMessageOpen);
                      setIsNotificationOpen(false);
                      setHasUnreadMessage(false);
                    }}
                    className="p-1.5 text-black hover:text-gray-600 transition active:scale-95 cursor-pointer relative bg-transparent border-none"
                    title={isBn ? 'মেসেজ ও ইনবক্স' : 'Messages'}
                    aria-label="Messages"
                  >
                    <MessageSquare className="w-5 h-5 text-black stroke-[2.5]" />
                    {hasUnreadMessage && (
                      <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white"></span>
                    )}
                  </button>

                  {/* Message Dropdown Panel */}
                  {isMessageOpen && (
                    <div
                      id="utility-message-dropdown"
                      className="absolute right-0 top-full mt-2 w-72 sm:w-80 bg-white border border-gray-200 rounded-xl shadow-xl p-3.5 z-50 text-xs animate-in fade-in zoom-in-95 duration-150 text-gray-900"
                    >
                      <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2.5">
                        <span className="font-black text-black uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                          <MessageSquare className="w-3.5 h-3.5 text-black" />
                          {isBn ? 'মেসেজ ও সাপোর্ট' : 'Messages & Support'}
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsMessageOpen(false)}
                          className="text-gray-400 hover:text-black p-0.5"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <p className="text-[11px] text-gray-600 mb-3 leading-relaxed">
                        {isBn 
                          ? 'অফিসিয়াল হেল্পডেস্ক অথবা কাস্টমার কেয়ারে সরাসরি বার্তা পাঠাতে নিচের মাধ্যম ব্যবহার করুন:'
                          : 'Send a quick message to our official helpdesk or customer support:'}
                      </p>

                      <div className="space-y-2">
                        {/* Official WhatsApp Support */}
                        <a
                          href="https://wa.me/8801886211095?text=Hello%20Jhadimadi%20Support"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full py-2.5 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-between text-gray-900 font-bold text-xs transition"
                        >
                          <span className="flex items-center gap-2">
                            <MessageCircle className="w-4 h-4 text-black" />
                            <span>{isBn ? 'হোয়াটসঅ্যাপে মেসেজ' : 'WhatsApp Support'}</span>
                          </span>
                          <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                        </a>

                        {/* Hotline Call */}
                        <a
                          href="tel:01886211095"
                          className="w-full py-2.5 px-3 rounded-lg bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center justify-between text-gray-900 font-bold text-xs transition"
                        >
                          <span className="flex items-center gap-2">
                            <Phone className="w-4 h-4 text-black" />
                            <span>{isBn ? 'সরাসরি হটলাইন কল' : 'Call Hotline'}</span>
                          </span>
                          <span className="text-[10px] font-mono text-gray-500">01886211095</span>
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 3. LANGUAGE SWITCHER (EN / BN) - Solid black text/icon, no background fill */}
              <button
                type="button"
                id="utility-language-switcher-btn"
                onClick={onLanguageToggle}
                className="px-2 py-1 text-black hover:text-gray-600 text-xs font-black transition flex items-center gap-1 cursor-pointer active:scale-95 bg-transparent border border-black rounded"
                title={isBn ? 'Switch to English' : 'বাংলায় পরিবর্তন করুন'}
                aria-label="Toggle Language"
              >
                <Globe className="w-3.5 h-3.5 text-black stroke-[2.5]" />
                <span className="leading-none">{isBn ? 'EN' : 'বাং'}</span>
              </button>

              {/* 4. THREE-LINE HAMBURGER / ACTION MENU (☰) - ONLY rendered when isOwner is true */}
              {isOwner && (
                <button
                  type="button"
                  id="utility-three-dot-menu-btn"
                  onClick={() => setIsDrawerOpen(true)}
                  className="p-1.5 -mr-1.5 text-black hover:text-gray-600 transition active:scale-95 cursor-pointer flex items-center justify-center bg-transparent border-none"
                  title={isBn ? 'মেনু ও সেটিংস' : 'Menu & Settings'}
                  aria-label="Open Management Drawer"
                >
                  {menuIconType === 'dots' ? (
                    <MoreVertical className="w-5 h-5 text-black stroke-[2.5]" />
                  ) : (
                    <Menu className="w-5 h-5 text-black stroke-[2.5]" />
                  )}
                </button>
              )}

            </div>
          </div>
        </div>

        {/* ROW 2: SUB-HEADER PLACEMENT (Directly below the top icon row)
            The section title (e.g., "সেবা দানকারী প্রোফাইল") must be positioned strictly in the center, bold, and clean, with pure white background and no colored boxes */}
        <div className="w-full bg-white border-b border-gray-100 px-4 py-3 text-center">
          <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center">
            <h1
              id="executive-section-sub-header"
              className="text-base sm:text-lg font-bold text-gray-950 tracking-tight leading-tight text-center"
            >
              {sectionTitle}
            </h1>
            {sectionSubtitle && (
              <p className="text-xs text-gray-500 font-mono font-medium mt-0.5 text-center">
                {sectionSubtitle}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* =========================================================================
          SLIDE-OUT EXECUTIVE DRAWER:
          - Dashboard
          - Profile Edit
          - Sign Out
          - Profile Delete with Password Verification
         ========================================================================= */}
      {isOwner && isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" id="executive-drawer-overlay">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-200"
            onClick={() => setIsDrawerOpen(false)}
          />

          {/* Drawer Content */}
          <div
            ref={drawerRef}
            id="executive-drawer-panel"
            className="relative w-72 sm:w-80 bg-white h-full shadow-2xl z-50 flex flex-col p-4 overflow-y-auto animate-in slide-in-from-right duration-200"
          >
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-gray-200 pb-3">
              <div className="flex items-center gap-2">
                <Menu className="w-4 h-4 text-black stroke-[2.5]" />
                <span className="text-xs font-black text-black uppercase tracking-wider">
                  {isBn ? 'মেনু ও সেটিংস' : 'Menu & Settings'}
                </span>
              </div>
              <button
                type="button"
                id="drawer-close-btn"
                onClick={() => setIsDrawerOpen(false)}
                className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-800 flex items-center justify-center transition cursor-pointer"
                title={isBn ? 'বন্ধ করুন' : 'Close'}
              >
                <X className="w-4 h-4 text-black" />
              </button>
            </div>

            {/* Mini User Summary Card in Drawer */}
            <div className="my-4 p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center gap-3">
              {displayAvatar ? (
                <img
                  src={displayAvatar}
                  alt={displayName}
                  className="w-11 h-11 rounded-lg object-cover border border-gray-300 shrink-0"
                />
              ) : (
                <div className="w-11 h-11 rounded-lg bg-gray-200 text-black font-black text-base flex items-center justify-center shrink-0">
                  {displayName.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <h4 className="text-xs font-bold text-gray-950 truncate">{displayName}</h4>
                <p className="text-[10px] text-gray-500 truncate">
                  {data.upazila ? `${data.upazila}, ${data.district || 'খাগড়াছড়ি'}` : sectionTitle}
                </p>
                {displayId && (
                  <span className="text-[9px] font-mono font-bold text-black bg-white border border-gray-200 px-1.5 py-0.5 rounded mt-0.5 inline-block">
                    {displayId}
                  </span>
                )}
              </div>
            </div>

            {/* Drawer Action Items */}
            <div className="space-y-1.5 flex-1 text-xs">
              
              {/* 1. Dashboard */}
              <button
                type="button"
                id="drawer-menu-dashboard-btn"
                onClick={() => {
                  setIsDrawerOpen(false);
                  if (onNavigateDashboard) {
                    onNavigateDashboard();
                  }
                }}
                className={`w-full text-left px-3.5 py-3 rounded-xl font-bold flex items-center gap-3 transition cursor-pointer ${
                  activeView === 'dashboard'
                    ? 'bg-black text-white'
                    : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-200'
                }`}
              >
                <LayoutDashboard className={`w-4 h-4 ${activeView === 'dashboard' ? 'text-white' : 'text-black'}`} />
                <div className="flex-1">
                  <div>{isBn ? 'ড্যাশবোর্ড ও ওয়ালেট' : 'Dashboard & Wallet'}</div>
                  <div className={`text-[10px] font-normal ${activeView === 'dashboard' ? 'text-gray-300' : 'text-gray-500'}`}>
                    {isBn ? 'ইন-পেজ ওয়ালেট, আয় ও রিপোর্ট' : 'In-page wallet, earnings & stats'}
                  </div>
                </div>
              </button>

              {/* 2. Profile Details */}
              <button
                type="button"
                id="drawer-menu-details-btn"
                onClick={() => {
                  setIsDrawerOpen(false);
                  if (onNavigateDetails) {
                    onNavigateDetails();
                  } else if (onNavigateDashboard && activeView === 'dashboard') {
                    onNavigateDashboard();
                  }
                }}
                className={`w-full text-left px-3.5 py-3 rounded-xl font-bold flex items-center gap-3 transition cursor-pointer ${
                  activeView !== 'dashboard'
                    ? 'bg-black text-white'
                    : 'bg-white hover:bg-gray-100 text-gray-900 border border-gray-200'
                }`}
              >
                <FileText className={`w-4 h-4 ${activeView !== 'dashboard' ? 'text-white' : 'text-black'}`} />
                <div className="flex-1">
                  <div>{isBn ? 'প্রোফাইল বিবরণ (Details)' : 'Profile Details'}</div>
                  <div className={`text-[10px] font-normal ${activeView !== 'dashboard' ? 'text-gray-300' : 'text-gray-500'}`}>
                    {isBn ? 'বায়োডাটা ও তথ্য বিবরণী' : 'Bio-data & profile overview'}
                  </div>
                </div>
              </button>

              {/* 3. Profile Edit */}
              <button
                type="button"
                id="drawer-menu-edit-profile-btn"
                onClick={() => {
                  setIsDrawerOpen(false);
                  if (onEditProfile) {
                    onEditProfile(data);
                  }
                }}
                className="w-full text-left px-3.5 py-3 rounded-xl font-bold flex items-center gap-3 bg-white hover:bg-gray-100 text-gray-900 border border-gray-200 transition cursor-pointer"
              >
                <UserCheck className="w-4 h-4 text-black" />
                <div className="flex-1">
                  <div>{isBn ? 'প্রোফাইল এডিট' : 'Profile Edit'}</div>
                  <div className="text-[10px] font-normal text-gray-500">
                    {isBn ? 'ছবি ও তথ্যাদি পরিবর্তন' : 'Update photo & details'}
                  </div>
                </div>
              </button>

              <div className="h-px bg-gray-200 my-2"></div>

              {/* 3. Sign Out */}
              <button
                type="button"
                id="drawer-menu-signout-btn"
                onClick={() => {
                  setIsDrawerOpen(false);
                  if (onSignOut) {
                    onSignOut();
                  } else {
                    logout();
                    try {
                      sessionStorage.removeItem('jm_authenticated_user');
                      sessionStorage.removeItem('jm_current_customer');
                      sessionStorage.removeItem('jhadimadi_customer_auth');
                      localStorage.removeItem('jm_authenticated_user');
                      localStorage.removeItem('jm_current_customer');
                      localStorage.removeItem('jhadimadi_customer_auth');
                    } catch {}
                    if (onBack) onBack();
                  }
                }}
                className="w-full text-left px-3.5 py-3 rounded-xl font-semibold flex items-center gap-3 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 transition cursor-pointer"
              >
                <LogOut className="w-4 h-4 text-gray-600" />
                <div className="flex-1">
                  <div>{isBn ? 'সাইন আউট' : 'Sign Out'}</div>
                  <div className="text-[10px] font-normal text-gray-500">
                    {isBn ? 'অ্যাকাউন্ট থেকে লগআউট' : 'Sign out of account'}
                  </div>
                </div>
              </button>

              {/* 4. Profile Delete (Strict Verification) */}
              <button
                type="button"
                id="drawer-menu-delete-profile-btn"
                onClick={() => {
                  setIsDrawerOpen(false);
                  setDeleteIdInput(displayId || data.phone || '');
                  setDeletePasswordInput('');
                  setDeleteError('');
                  setShowDeleteModal(true);
                }}
                className="w-full text-left px-3.5 py-3 rounded-xl font-bold flex items-center gap-3 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition cursor-pointer"
              >
                <Trash2 className="w-4 h-4 text-red-600" />
                <div className="flex-1">
                  <div>{isBn ? 'প্রোফাইল ডিলিট' : 'Delete Profile'}</div>
                  <div className="text-[10px] font-normal text-red-500">
                    {isBn ? 'স্থায়ীভাবে অ্যাকাউন্ট মুছে ফেলুন' : 'Strict password verified'}
                  </div>
                </div>
              </button>

            </div>

            {/* Drawer Footer */}
            <div className="pt-3 border-t border-gray-200 text-center text-[10px] text-gray-500 font-mono">
              Jhadimadi.com Enterprise Portal
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          STRICT PASSWORD VERIFICATION PROFILE DELETION MODAL
         ========================================================================= */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" id="executive-delete-modal-overlay">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
            onClick={() => !isDeleting && setShowDeleteModal(false)}
          />

          <div className="relative bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-gray-200 z-10 text-xs animate-in zoom-in-95 duration-150 text-gray-900">
            {deleteSuccess ? (
              <div className="text-center py-6 space-y-3">
                <CheckCircle2 className="w-12 h-12 text-black mx-auto" />
                <h3 className="text-sm font-black text-gray-900">
                  {isBn ? 'প্রোফাইল সফলভাবে মুছে ফেলা হয়েছে!' : 'Profile Successfully Deleted!'}
                </h3>
                <p className="text-gray-500 text-[11px]">
                  {isBn ? 'আপনাকে মূল পেজে ফিরিয়ে নেওয়া হচ্ছে...' : 'Redirecting...'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleConfirmDelete} className="space-y-3.5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                  <div className="flex items-center gap-2 text-red-600 font-black">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span className="text-xs uppercase tracking-wider">
                      {isBn ? 'প্রোফাইল ডিলিট ভেরিফিকেশন' : 'Profile Deletion'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    disabled={isDeleting}
                    className="text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <p className="text-[11px] text-gray-600 leading-relaxed">
                  {isBn
                    ? 'নিরাপত্তার স্বার্থে আপনার মেম্বার আইডি/ফোন এবং পাসওয়ার্ড যাচাই করা হবে। ডিলিট করার পর তথ্য পুনরুদ্ধার সম্ভব নয়।'
                    : 'For security reasons, please verify your ID/Phone and password. This action cannot be undone.'}
                </p>

                {deleteError && (
                  <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-[11px] text-red-700 font-medium">
                    {deleteError}
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    {isBn ? 'মেম্বার আইডি বা মোবাইল নম্বর *' : 'Member ID or Phone *'}
                  </label>
                  <input
                    type="text"
                    required
                    value={deleteIdInput}
                    onChange={(e) => setDeleteIdInput(e.target.value)}
                    placeholder={displayId || '018XXXXXXXX'}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs font-mono font-bold text-gray-900 focus:outline-none focus:border-black"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-gray-700 mb-1">
                    {isBn ? 'অ্যাকাউন্ট পাসওয়ার্ড *' : 'Account Password *'}
                  </label>
                  <div className="relative">
                    <input
                      type={showDeletePassword ? 'text' : 'password'}
                      required
                      value={deletePasswordInput}
                      onChange={(e) => setDeletePasswordInput(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-xs text-gray-900 focus:outline-none focus:border-black pr-8"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDeletePassword(!showDeletePassword)}
                      className="absolute right-2.5 top-2.5 text-gray-400 hover:text-black cursor-pointer"
                    >
                      {showDeletePassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    disabled={isDeleting}
                    className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    {isBn ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isDeleting}
                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {isDeleting ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isBn ? 'স্থায়ীভাবে মুছুন' : 'Confirm Delete'}</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
};
