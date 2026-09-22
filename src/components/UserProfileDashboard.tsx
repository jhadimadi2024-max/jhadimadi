import React, { useState, useMemo } from 'react';
import { 
  User, 
  MapPin, 
  Trash2, 
  CheckCircle2, 
  Star, 
  LogOut, 
  AlertCircle,
  Wallet,
  Edit3,
  X,
  ShieldCheck,
  Award,
  Clock,
  Eye,
  Phone,
  Briefcase,
  GraduationCap,
  FileText,
  Lock,
  MoreVertical,
  LayoutDashboard,
  Check,
  AlertTriangle,
  ChevronRight,
  TrendingUp,
  Gift
} from 'lucide-react';
import { UserProfile, Language } from '../types';
import { StoreProduct } from '../data/productsData';
import { RegisteredProfessional } from './ProfessionalRegistrationWizard';
import { generateMemberUID } from '../data/locationMaster';
import { databaseService } from '../services/databaseService';
import { deleteUserAccount } from '../services/authService';
import { ServiceProviderRegistrationForm } from './ServiceProviderRegistrationForm';
import { GeneratedProfessionalProfile } from './GeneratedProfessionalProfile';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';

interface UserProfileDashboardProps {
  currentUser: UserProfile;
  onLogout: () => void;
  onDeleteAccount?: () => void;
  onOpenPrivacyPolicy?: () => void;
  onUpdateCurrentUser: (user: UserProfile) => void;
  onAddNewProduct?: (product: StoreProduct) => void;
  onSaveProfessionalProfile?: (pro: RegisteredProfessional) => void;
  allDistricts?: Record<string, string[]>;
  professionCategories?: { category: string; jobs: string[] }[];
  userProducts?: StoreProduct[];
  userProfessionalProfile?: RegisteredProfessional | null;
  onViewProductDetail?: (product: StoreProduct) => void;
  onNavigateHome?: () => void;
  onNavigateAdmin?: () => void;
  onNavigateToServiceProviderForm?: (profileData?: any) => void;
  initialTab?: 'overview' | 'seller' | 'professional' | 'wallet';
  lang?: Language;
  onNavigateToPujaGift?: () => void;
}

export const UserProfileDashboard: React.FC<UserProfileDashboardProps> = ({
  currentUser,
  onLogout,
  onDeleteAccount,
  onOpenPrivacyPolicy,
  onUpdateCurrentUser,
  onSaveProfessionalProfile,
  onNavigateHome,
  userProfessionalProfile,
  onNavigateToServiceProviderForm,
  lang = 'bn',
  onNavigateToPujaGift
}) => {
  // Determine if user has service provider / professional capabilities
  const isServiceProvider = useMemo(() => {
    return (
      currentUser.role === 'provider' || 
      currentUser.role === 'professional' || 
      currentUser.role === 'partner' ||
      currentUser.role === 'seller' ||
      currentUser.role === 'permanent' ||
      (typeof currentUser.memberUID === 'string' && (
        currentUser.memberUID.startsWith('JH-S-') || 
        currentUser.memberUID.startsWith('JH-M-') || 
        currentUser.memberUID.startsWith('JH-P-')
      )) ||
      !!userProfessionalProfile ||
      !!currentUser.profession ||
      !!currentUser.categorySkill
    );
  }, [currentUser.role, currentUser.memberUID, userProfessionalProfile, currentUser.profession, currentUser.categorySkill]);

  // UID calculation
  const proUniqueId = useMemo(() => {
    return (
      currentUser.memberUID || 
      userProfessionalProfile?.uniqueId || 
      currentUser.uniqueId || 
      generateMemberUID(
        currentUser.division || 'চট্টগ্রাম', 
        currentUser.district || 'খাগড়াছড়ি', 
        currentUser.upazila || currentUser.thana || 'খাগড়াছড়ি সদর'
      )
    );
  }, [currentUser.memberUID, currentUser.uniqueId, userProfessionalProfile?.uniqueId, currentUser.division, currentUser.district, currentUser.upazila, currentUser.thana]);

  // Main UI Mode: 'public_view' | 'private_dashboard' | 'edit_form'
  const [activeView, setActiveView] = useState<'public_view' | 'private_dashboard' | 'edit_form'>('public_view');

  // Three-Dot Menu Open/Close
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Delete Confirmation Modal (Strict Double-Confirmation)
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState<1 | 2>(1);
  const [deleteConfirmChecked, setDeleteConfirmChecked] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState('');

  // Privacy Policy Modal (Play Store Compliance)
  const [showPrivacyPolicy, setShowPrivacyPolicy] = useState(false);

  // Certificate Modal
  const [showCertModal, setShowCertModal] = useState(false);

  // Toast Notification
  const [toastMessage, setToastMessage] = useState('');

  // Real Data (No Mock)
  const completedJobsCount = currentUser.completedJobs || 0;
  const ratingValue = currentUser.rating ? currentUser.rating.toFixed(1) : '0.0';
  const reviewsCount = currentUser.reviewsCount || (currentUser.customerReviews ? currentUser.customerReviews.length : 0);
  const walletEarnings = currentUser.totalEarnings || currentUser.walletBalance || 0;
  const pendingEscrow = currentUser.pendingEscrow || 0;

  // Work Nature list
  const workNatureTags = useMemo(() => {
    const raw = (currentUser.workNature || currentUser.rateType || '').toString();
    const tags: string[] = [];
    if (raw.includes('ঘণ্টা') || raw.toLowerCase().includes('hourly') || currentUser.isHourlyAvailable) {
      tags.push(lang === 'bn' ? 'ঘণ্টাভিত্তিক' : 'Hourly');
    }
    if (raw.includes('দৈনিক') || raw.toLowerCase().includes('daily') || currentUser.isDailyAvailable) {
      tags.push(lang === 'bn' ? 'দৈনিক' : 'Daily');
    }
    if (raw.includes('চুক্তি') || raw.toLowerCase().includes('contract') || currentUser.isContractAvailable) {
      tags.push(lang === 'bn' ? 'চুক্তিভিত্তিক' : 'Contractual');
    }
    if (tags.length === 0 && isServiceProvider) {
      tags.push(lang === 'bn' ? 'চুক্তিভিত্তিক' : 'Contractual');
    }
    return tags;
  }, [currentUser.workNature, currentUser.rateType, currentUser.isHourlyAvailable, currentUser.isDailyAvailable, currentUser.isContractAvailable, isServiceProvider, lang]);

  // Education Title
  const educationDisplay = useMemo(() => {
    const raw = currentUser.educationLevel || currentUser.education || '';
    if (raw === 'class_8') return lang === 'bn' ? '৮ম শ্রেণি / জেএসসি' : 'Class 8 / JSC';
    if (raw === 'ssc') return lang === 'bn' ? 'এসএসসি / সমমান' : 'SSC / Equivalent';
    if (raw === 'hsc') return lang === 'bn' ? 'এইচএসসি / সমমান' : 'HSC / Equivalent';
    if (raw === 'diploma') return lang === 'bn' ? 'ডিপ্লোমা ইন ইঞ্জিনিয়ারিং' : 'Diploma';
    if (raw === 'bachelor') return lang === 'bn' ? 'স্নাতক / ডিগ্রি / অনার্স' : 'Bachelor Degree';
    if (raw === 'masters') return lang === 'bn' ? 'স্নাতকোত্তর / মাস্টার্স' : 'Masters Degree';
    if (raw === 'other') return lang === 'bn' ? 'অভিজ্ঞতাভিত্তিক কারিগরি' : 'Practical Experience';
    return raw || (lang === 'bn' ? 'এসএসসি / সমমান' : 'SSC / Equivalent');
  }, [currentUser.educationLevel, currentUser.education, lang]);

  // Certificate URL
  const certUrl = currentUser.technicalCertificateUrl || currentUser.certificateUrl || (currentUser.verifiedCertificates && currentUser.verifiedCertificates[0]) || '';

  // Handle Delete Account Execution
  const handleDeleteAccountConfirm = async () => {
    if (!deleteConfirmChecked) return;
    setIsDeletingAccount(true);
    setDeleteError('');

    try {
      if (onDeleteAccount) {
        await onDeleteAccount();
      } else {
        await deleteUserAccount(currentUser.id);
        onLogout();
      }
    } catch (err: any) {
      console.error('Failed to delete account:', err);
      setDeleteError(err?.message || (lang === 'bn' ? 'অ্যাকাউন্ট ডিলিট করতে সমস্যা হয়েছে, অনুগ্রহ করে আবার চেষ্টা করুন।' : 'Failed to delete profile, please try again.'));
      setIsDeletingAccount(false);
    }
  };

  // Combined profile data for Service Provider / Professional
  const combinedProfile = {
    ...currentUser,
    ...(userProfessionalProfile || {}),
    fullName: currentUser.fullName || currentUser.name || userProfessionalProfile?.name || 'ব্যবহারকারী',
    bloodGroup: currentUser.bloodGroup || userProfessionalProfile?.bloodGroup || '-',
    uniqueId: proUniqueId,
    districtUID: proUniqueId,
    avatar: currentUser.avatar || currentUser.profileImage || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80"
  };

  // If in Edit Form Mode, render the ServiceProviderRegistrationForm with pre-loaded user data
  if (activeView === 'edit_form') {
    return (
      <div className="w-full max-w-md mx-auto py-1">
        <ServiceProviderRegistrationForm 
          currentUser={currentUser}
          initialData={combinedProfile}
          isEditMode={true}
          lang={lang}
          onBack={() => setActiveView('public_view')}
          onSubmitSuccess={(updated) => {
            onUpdateCurrentUser(updated);
            if (onSaveProfessionalProfile) {
              onSaveProfessionalProfile(updated);
            }
            setActiveView('public_view');
            setToastMessage(lang === 'bn' ? '✓ প্রোফাইল তথ্য সফলভাবে আপডেট হয়েছে!' : '✓ Profile updated successfully!');
            setTimeout(() => setToastMessage(''), 4000);
          }}
          onSuccess={(updated) => {
            onUpdateCurrentUser(updated);
            if (onSaveProfessionalProfile) {
              onSaveProfessionalProfile(updated);
            }
            setActiveView('public_view');
            setToastMessage(lang === 'bn' ? '✓ প্রোফাইল তথ্য সফলভাবে আপডেট হয়েছে!' : '✓ Profile updated successfully!');
            setTimeout(() => setToastMessage(''), 4000);
          }}
        />
      </div>
    );
  }

  // For Service Providers / Professionals: Render the formal Resume/Biodata Profile Page
  if (isServiceProvider) {
    return (
      <GeneratedProfessionalProfile
        profile={combinedProfile}
        currentUser={currentUser}
        lang={lang}
        onEdit={(editData) => {
          if (onNavigateToServiceProviderForm) {
            onNavigateToServiceProviderForm(editData || combinedProfile);
          } else {
            setActiveView('edit_form');
          }
        }}
        onSignOut={onLogout}
        onDeleteSuccess={onDeleteAccount || onLogout}
        onUpdateProfile={(updated) => {
          onUpdateCurrentUser(updated);
          if (onSaveProfessionalProfile) {
            onSaveProfessionalProfile(updated);
          }
        }}
        onBackToHome={onNavigateHome}
      />
    );
  }

  return (
    <div className="w-full max-w-md mx-auto space-y-3 pb-8 text-gray-900 bg-slate-50 p-1 sm:p-2 font-sans relative">
      
      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-[#0A6A32] text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md flex items-center justify-between animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>{toastMessage}</span>
          </div>
          <button 
            type="button" 
            onClick={() => setToastMessage('')}
            className="text-white/80 hover:text-white text-xs ml-2 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* ================= 1. PROFILE HEADER CARD ================= */}
      <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs relative">
        <div className="flex items-start justify-between gap-3">
          
          {/* Avatar Photo & Core Public Identity */}
          <div className="flex items-start gap-3.5 min-w-0">
            <div className="relative shrink-0">
              <img 
                src={currentUser.avatar || currentUser.profileImage || "https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=400&q=80"} 
                alt={currentUser.name || "User Avatar"} 
                className="w-14 h-16 sm:w-16 sm:h-18 object-cover rounded-xl border border-gray-300 shadow-xs bg-slate-100"
              />
              <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-[#0A6A32] text-white rounded-full flex items-center justify-center text-[9px] shadow-xs" title="সক্রিয় প্রোফাইল">
                <Check className="w-2.5 h-2.5 stroke-[3]" />
              </span>
            </div>

            <div className="min-w-0 space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-base font-black text-gray-950 tracking-tight truncate">
                  {currentUser.fullName || currentUser.name || (lang === 'bn' ? 'সম্মানিত সেবাদাতা' : 'Service Provider')}
                </h2>
                <span className="text-[9px] font-bold text-[#0A6A32] bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-[#0A6A32]" />
                  <span>{lang === 'bn' ? 'যাচাইকৃত' : 'Verified'}</span>
                </span>
              </div>
              
              <p className="text-xs font-bold text-gray-700 truncate">
                {currentUser.profession || currentUser.professionBn || (lang === 'bn' ? 'অন-ডিমান্ড কারিগরি সেবা' : 'On-Demand Technical Service')}
              </p>

              <p className="text-[11px] font-medium text-gray-500 flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                <span>
                  {currentUser.upazila || currentUser.thana || 'খাগড়াছড়ি সদর'}, {currentUser.district || 'খাগড়াছড়ি'}
                </span>
              </p>

              {/* UID badge */}
              <div className="pt-0.5">
                <span className="font-mono text-[9.5px] font-bold text-gray-600 bg-slate-100 border border-gray-200 px-2 py-0.5 rounded">
                  UID: {proUniqueId}
                </span>
              </div>
            </div>
          </div>

          {/* ================= ROLE-BASED ACTION CONTROLS ================= */}
          <div className="shrink-0 flex items-center gap-1.5">
            {/* 3-DOT (⋮) MENU FOR SERVICE PROVIDERS ONLY */}
            {isServiceProvider ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(prev => !prev)}
                  className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-emerald-50 text-gray-800 hover:text-[#0A6A32] border border-gray-300 flex items-center justify-center transition-all cursor-pointer shadow-2xs active:scale-95"
                  title="প্রোফাইল মেনু ও অপশন"
                  id="btn-three-dot-menu"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>

                {/* 3-Dot Dropdown Menu (4 Exact Options) */}
                {isMenuOpen && (
                  <>
                    <div 
                      className="fixed inset-0 z-40" 
                      onClick={() => setIsMenuOpen(false)}
                    />
                    <div className="absolute right-0 top-10 w-56 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 py-1.5 divide-y divide-gray-100 animate-in fade-in zoom-in-95 duration-150 text-left">
                      
                      {/* Option 1: Profile Dashboard */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          setActiveView(prev => (prev === 'private_dashboard' ? 'public_view' : 'private_dashboard'));
                        }}
                        className="w-full px-3.5 py-2.5 text-xs font-bold text-gray-800 hover:bg-emerald-50 hover:text-[#0A6A32] flex items-center gap-2.5 transition cursor-pointer"
                        id="menu-opt-dashboard"
                      >
                        <LayoutDashboard className="w-4 h-4 text-[#0A6A32]" />
                        <span>
                          {activeView === 'private_dashboard' 
                            ? (lang === 'bn' ? 'সাধারণ ভিউতে ফিরে যান' : 'Public Profile View') 
                            : (lang === 'bn' ? 'প্রোফাইল ড্যাশবোর্ড' : 'Profile Dashboard')}
                        </span>
                      </button>

                      {/* Option 2: Edit Profile */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          if (onNavigateToServiceProviderForm) {
                            onNavigateToServiceProviderForm(currentUser);
                          } else {
                            setActiveView('edit_form');
                          }
                        }}
                        className="w-full px-3.5 py-2.5 text-xs font-bold text-gray-800 hover:bg-emerald-50 hover:text-[#0A6A32] flex items-center gap-2.5 transition cursor-pointer"
                        id="menu-opt-edit"
                      >
                        <Edit3 className="w-4 h-4 text-[#0A6A32]" />
                        <span>{lang === 'bn' ? 'প্রোফাইল এডিট' : 'Edit Profile'}</span>
                      </button>

                      {/* Option: Puja Gift Application (Special Festival Welfare) */}
                      {onNavigateToPujaGift && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            onNavigateToPujaGift();
                          }}
                          className="w-full px-3.5 py-2.5 text-xs font-black text-amber-700 hover:bg-amber-50 flex items-center gap-2.5 transition cursor-pointer"
                          id="menu-opt-puja-gift"
                        >
                          <Gift className="w-4 h-4 text-amber-600" />
                          <span>{lang === 'bn' ? 'পূজা উপহার আবেদন ফর্ম' : 'Puja Gift Application'}</span>
                        </button>
                      )}

                      {/* Option 3: Privacy Policy (Play Store Compliance) */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          if (onOpenPrivacyPolicy) onOpenPrivacyPolicy();
                          else setShowPrivacyPolicy(true);
                        }}
                        className="w-full px-3.5 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100 flex items-center gap-2.5 transition cursor-pointer"
                        id="menu-opt-privacy-policy"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>{lang === 'bn' ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}</span>
                      </button>

                      {/* Option 4: Sign Out */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full px-3.5 py-2.5 text-xs font-bold text-gray-700 hover:bg-gray-100 flex items-center gap-2.5 transition cursor-pointer"
                        id="menu-opt-signout"
                      >
                        <LogOut className="w-4 h-4 text-gray-500" />
                        <span>{lang === 'bn' ? 'সাইন আউট' : 'Sign Out'}</span>
                      </button>

                      {/* Option 5: Delete Profile */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          setShowDeleteModal(true);
                          setDeleteStep(1);
                          setDeleteConfirmChecked(false);
                          setDeleteError('');
                        }}
                        className="w-full px-3.5 py-2.5 text-xs font-bold text-red-600 hover:bg-red-50 flex items-center gap-2.5 transition cursor-pointer"
                        id="menu-opt-delete"
                      >
                        <Trash2 className="w-4 h-4 text-red-600" />
                        <span>{lang === 'bn' ? 'প্রোফাইল ডিলিট' : 'Delete Profile'}</span>
                      </button>

                    </div>
                  </>
                )}
              </div>
            ) : (
              /* Customer View (No 3-Dot Menu) - Simple clean privacy, delete & signout */
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    if (onOpenPrivacyPolicy) onOpenPrivacyPolicy();
                    else setShowPrivacyPolicy(true);
                  }}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 transition cursor-pointer"
                  title={lang === 'bn' ? 'গোপনীয়তা নীতি' : 'Privacy Policy'}
                  id="btn-customer-privacy"
                >
                  <ShieldCheck className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(true);
                    setDeleteStep(1);
                    setDeleteConfirmChecked(false);
                    setDeleteError('');
                  }}
                  className="p-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-600 transition cursor-pointer"
                  title={lang === 'bn' ? 'অ্যাকাউন্ট ডিলিট' : 'Delete Account'}
                  id="btn-customer-delete"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-gray-200 text-gray-700 transition cursor-pointer"
                  title={lang === 'bn' ? 'লগআউট' : 'Logout'}
                  id="btn-customer-logout"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

        </div>

        {/* Work Nature Tags (Hourly, Daily, Contractual) */}
        {workNatureTags.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3 pt-3 border-t border-gray-100 flex-wrap">
            <span className="text-[10px] font-bold text-gray-500">
              {lang === 'bn' ? 'কাজের ধরন:' : 'Work Nature:'}
            </span>
            {workNatureTags.map((tag) => (
              <span 
                key={tag} 
                className="text-[10px] font-bold text-[#0A6A32] bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* ================= 2. VIEW 1: PRIVATE PROFILE DASHBOARD (FOR SERVICE PROVIDERS) ================= */}
      {activeView === 'private_dashboard' ? (
        <div className="space-y-3 animate-in fade-in duration-200">
          
          {/* Dashboard Header Bar */}
          <div className="bg-[#0A6A32] text-white p-3.5 rounded-2xl shadow-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="w-4 h-4 text-emerald-200" />
              <h3 className="text-xs sm:text-sm font-black text-white">
                {lang === 'bn' ? 'সেবাদাতা প্রোফাইল ড্যাশবোর্ড (গোপনীয় তথ্য)' : 'Provider Profile Dashboard (Confidential)'}
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setActiveView('public_view')}
              className="text-[10px] font-bold bg-white/20 hover:bg-white/30 text-white px-2.5 py-1 rounded-lg transition cursor-pointer"
            >
              {lang === 'bn' ? 'পাবলিক ভিউ ✕' : 'Close ✕'}
            </button>
          </div>

          {/* Puja Gift & Welfare Banner */}
          {onNavigateToPujaGift && (
            <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-amber-500/10 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
                  <Gift className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      {lang === 'bn' ? 'বিশেষ কল্যাণ সুবিধা' : 'Welfare Package'}
                    </span>
                    <h4 className="text-xs sm:text-sm font-black text-gray-900">
                      {lang === 'bn' ? 'পূজা উৎসব উপহার আবেদন পোর্টাল' : 'Puja Gift Application Portal'}
                    </h4>
                  </div>
                  <p className="text-[11px] text-gray-600 mt-0.5">
                    {lang === 'bn'
                      ? 'নিবন্ধিত সেবাদাতাদের জন্য বিশেষ উৎসব উপহার ও কল্যাণ প্যাকেজ পেতে আবেদন করুন।'
                      : 'Registered service providers can apply for special festival gift packages.'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={onNavigateToPujaGift}
                className="w-full sm:w-auto px-4 py-2 bg-[#0A6A32] hover:bg-emerald-800 text-white text-xs font-black rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 shrink-0 cursor-pointer"
              >
                <span>{lang === 'bn' ? 'এখনই আবেদন করুন' : 'Apply Now'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Hidden/Original Details Card (Address, Phone, NID, Parents) */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h4 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#0A6A32]" />
                <span>{lang === 'bn' ? 'সংরক্ষিত এনআইডি ও যোগাযোগের গোপন তথ্য' : 'Confidential NID & Contact Data'}</span>
              </h4>
              <span className="text-[9.5px] font-bold text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                {lang === 'bn' ? 'পাবলিকে অদৃশ্য' : 'Hidden from public'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-gray-200">
                <span className="text-[10px] font-bold text-gray-500 block">{lang === 'bn' ? 'ভোটার আইডি (NID) নম্বর:' : 'NID Number:'}</span>
                <span className="font-mono font-bold text-gray-900">{currentUser.nidNumber || '-'}</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-gray-200">
                <span className="text-[10px] font-bold text-gray-500 block">{lang === 'bn' ? 'সরাসরি মোবাইল নম্বর:' : 'Direct Phone Number:'}</span>
                <span className="font-mono font-bold text-gray-900">{currentUser.phone || currentUser.realPhone || '-'}</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-gray-200">
                <span className="text-[10px] font-bold text-gray-500 block">{lang === 'bn' ? 'পিতার নাম:' : "Father's Name:"}</span>
                <span className="font-bold text-gray-900">{currentUser.fatherName || '-'}</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-gray-200">
                <span className="text-[10px] font-bold text-gray-500 block">{lang === 'bn' ? 'মাতার নাম:' : "Mother's Name:"}</span>
                <span className="font-bold text-gray-900">{currentUser.motherName || '-'}</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-gray-200">
                <span className="text-[10px] font-bold text-gray-500 block">{lang === 'bn' ? 'রক্তের গ্রুপ:' : 'Blood Group:'}</span>
                <span className="font-bold text-red-600">{currentUser.bloodGroup || '-'}</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-gray-200">
                <span className="text-[10px] font-bold text-gray-500 block">{lang === 'bn' ? 'শিক্ষাগত যোগ্যতা:' : 'Education:'}</span>
                <span className="font-bold text-gray-900">{educationDisplay || '-'}</span>
              </div>
            </div>

            {/* Detailed Address */}
            <div className="p-2.5 bg-slate-50 rounded-xl border border-gray-200 text-xs">
              <span className="text-[10px] font-bold text-gray-500 block">{lang === 'bn' ? 'সম্পূর্ণ ব্যক্তিগত ঠিকানা:' : 'Full Detailed Address:'}</span>
              <span className="font-medium text-gray-900">
                {currentUser.detailedAddress || (currentUser.mahalla ? `${currentUser.mahalla}, ${currentUser.upazila || ''}, ${currentUser.district || ''}` : '-')}
              </span>
            </div>
          </div>

          {/* Earnings Breakdown & Job Statistics (Real Data States) */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-3">
            <h4 className="text-xs font-black text-gray-900 flex items-center gap-1.5 border-b border-gray-100 pb-2">
              <Wallet className="w-3.5 h-3.5 text-[#0A6A32]" />
              <span>{lang === 'bn' ? 'আয় ও কাজের পরিসংখ্যান (Earnings Breakdown)' : 'Earnings & Job Statistics'}</span>
            </h4>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-center">
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl">
                <span className="text-[10px] font-bold text-gray-600 block">{lang === 'bn' ? 'মোট উপার্জন' : 'Total Earnings'}</span>
                <span className="text-base font-black text-[#0A6A32]">৳{walletEarnings}</span>
              </div>

              <div className="p-3 bg-slate-50 border border-gray-200 rounded-xl">
                <span className="text-[10px] font-bold text-gray-600 block">{lang === 'bn' ? 'সম্পন্ন কাজ' : 'Completed Jobs'}</span>
                <span className="text-base font-black text-gray-900">{completedJobsCount}টি</span>
              </div>

              <div className="p-3 bg-slate-50 border border-gray-200 rounded-xl col-span-2 sm:col-span-1">
                <span className="text-[10px] font-bold text-gray-600 block">{lang === 'bn' ? 'এসক্রো পেন্ডিং' : 'Pending Escrow'}</span>
                <span className="text-base font-black text-amber-600">৳{pendingEscrow}</span>
              </div>
            </div>

            {completedJobsCount === 0 && (
              <p className="text-[11px] text-gray-500 text-center py-1">
                {lang === 'bn' ? 'এখনও কোনো নতুন বুকিং সম্পন্ন হয়নি।' : 'No completed jobs recorded yet.'}
              </p>
            )}
          </div>

          {/* Certificate View in Dashboard */}
          {certUrl && (
            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-2.5">
              <h4 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                <Award className="w-3.5 h-3.5 text-[#0A6A32]" />
                <span>{lang === 'bn' ? 'কারিগরি প্রশিক্ষণ সনদপত্র' : 'Technical Certificate'}</span>
              </h4>

              <div className="flex items-center justify-between p-3 bg-slate-50 border border-gray-200 rounded-xl">
                <div className="flex items-center gap-3">
                  <img 
                    src={certUrl} 
                    alt="Certificate" 
                    className="w-12 h-12 object-cover rounded-lg border border-gray-300 bg-white"
                  />
                  <div>
                    <p className="text-xs font-bold text-gray-900">
                      {currentUser.certificateTitle || (lang === 'bn' ? 'অনুমোদিত কারিগরি সনদ' : 'Approved Technical Certificate')}
                    </p>
                    <span className="text-[10px] text-[#0A6A32] font-bold flex items-center gap-1 mt-0.5">
                      <ShieldCheck className="w-3 h-3" />
                      <span>{lang === 'bn' ? 'যাচাইকৃত নথি' : 'Verified Document'}</span>
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowCertModal(true)}
                  className="px-3 py-1.5 bg-[#0A6A32] hover:bg-[#085427] text-white rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'দেখুন' : 'View'}</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Edit Trigger from Dashboard */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setActiveView('edit_form')}
              className="w-full py-3 bg-white hover:bg-emerald-50 text-[#0A6A32] border border-[#0A6A32] rounded-xl text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer shadow-2xs"
            >
              <Edit3 className="w-4 h-4" />
              <span>{lang === 'bn' ? 'প্রোফাইল তথ্য ও সনদপত্র এডিট করুন' : 'Edit Profile Data & Certificates'}</span>
            </button>
          </div>

        </div>
      ) : (
        /* ================= 3. VIEW 2: CLEAN PUBLIC VIEW (FOR CUSTOMER / PROSPECTIVE BUYERS) ================= */
        <div className="space-y-3">
          
          {/* Bio & Work Scope Card */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-2">
            <h3 className="text-xs font-black text-gray-900 flex items-center gap-1.5 border-b border-gray-100 pb-2">
              <Briefcase className="w-3.5 h-3.5 text-[#0A6A32]" />
              <span>{lang === 'bn' ? 'কাজের অভিজ্ঞতা ও বিবরণী' : 'Work Scope & Bio'}</span>
            </h3>
            <p className="text-xs text-gray-700 leading-relaxed">
              {currentUser.bio || currentUser.bioBn || (lang === 'bn' ? 'দক্ষ ও নির্ভরযোগ্যভাবে নির্ধারিত এলাকায় অন-ডিমান্ড সেবা প্রদান করে থাকি।' : 'Providing reliable on-demand technical services with verified craftsmanship.')}
            </p>
          </div>

          {/* Qualifications & Verification Badge */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-2.5">
            <h3 className="text-xs font-black text-gray-900 flex items-center gap-1.5 border-b border-gray-100 pb-2">
              <GraduationCap className="w-3.5 h-3.5 text-[#0A6A32]" />
              <span>{lang === 'bn' ? 'যোগ্যতা ও কারিগরি দক্ষতা' : 'Qualifications & Skills'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-slate-50 rounded-xl border border-gray-200">
                <span className="text-[10px] font-bold text-gray-500 block">{lang === 'bn' ? 'শিক্ষাগত মান:' : 'Education:'}</span>
                <span className="font-bold text-gray-900">{educationDisplay}</span>
              </div>

              <div className="p-2.5 bg-slate-50 rounded-xl border border-gray-200">
                <span className="text-[10px] font-bold text-gray-500 block">{lang === 'bn' ? 'রক্তের গ্রুপ (জরুরি সহায়তা):' : 'Blood Group (Emergency):'}</span>
                <span className="font-bold text-red-600">{currentUser.bloodGroup || 'B+'}</span>
              </div>
            </div>

            {/* Certificate Link if available */}
            {certUrl && (
              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setShowCertModal(true)}
                  className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-[#0A6A32] border border-emerald-200 rounded-xl text-xs font-bold flex items-center justify-between transition cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-[#0A6A32]" />
                    <span>{lang === 'bn' ? 'যাচাইকৃত কারিগরি সনদপত্র দেখুন' : 'View Verified Skill Certificate'}</span>
                  </span>
                  <Eye className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Customer Reviews & Ratings (Zero State Handled Accurately) */}
          <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-3">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h3 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{lang === 'bn' ? 'গ্রাহক মতামত ও রিভিউ' : 'Customer Reviews & Ratings'}</span>
              </h3>
              <span className="text-xs font-bold text-gray-700 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                <span>{ratingValue} ({reviewsCount})</span>
              </span>
            </div>

            {reviewsCount > 0 && currentUser.customerReviews ? (
              <div className="space-y-2 divide-y divide-gray-100">
                {currentUser.customerReviews.map((rev, idx) => (
                  <div key={idx} className="pt-2 text-xs space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-gray-900">{rev.customerName || (rev as any).userName || 'গ্রাহক'}</span>
                      <div className="flex text-amber-500">
                        {Array.from({ length: rev.rating || 5 }).map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-amber-500" />
                        ))}
                      </div>
                    </div>
                    <p className="text-gray-600 text-[11px]">{rev.comment}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4 bg-slate-50 rounded-xl border border-dashed border-gray-200 space-y-1">
                <Star className="w-6 h-6 text-gray-300 mx-auto" />
                <p className="text-xs font-bold text-gray-700">
                  {lang === 'bn' ? 'এখনও কোনো কাস্টমার রিভিউ জমা পড়েনি' : 'No customer reviews submitted yet'}
                </p>
                <p className="text-[10px] text-gray-400">
                  {lang === 'bn' ? 'অর্ডার সম্পন্ন হলে গ্রাহকগণ রেটিং প্রদান করতে পারবেন।' : 'Ratings will appear here once orders are fulfilled.'}
                </p>
              </div>
            )}
          </div>

          {/* If user is not yet a provider, prompt to register */}
          {!isServiceProvider && (
            <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl text-center space-y-2">
              <h4 className="text-xs sm:text-sm font-black text-[#0A6A32]">
                {lang === 'bn' ? 'আপনি কি সেবাদাতা হিসেবে কাজ করতে চান?' : 'Want to offer professional services?'}
              </h4>
              <p className="text-[11px] text-gray-600">
                {lang === 'bn' ? 'ঝাদিমাদি ডটকম-এ আপনার পেশাদার প্রোফাইল তৈরি করে অন-ডিমান্ড কাজ গ্রহণ করুন।' : 'Create your verified professional portfolio and receive local service bookings.'}
              </p>
              <button
                type="button"
                onClick={() => setActiveView('edit_form')}
                className="py-2.5 px-4 bg-[#0A6A32] hover:bg-[#085427] text-white rounded-xl text-xs font-bold transition cursor-pointer shadow-xs"
              >
                {lang === 'bn' ? 'সেবাদাতা প্রোফাইল রেজিস্ট্রেশন করুন ➔' : 'Register Service Provider Profile ➔'}
              </button>
            </div>
          )}

          {/* Account Security & Privacy Policy (Google Play Store Compliance) */}
          <div className="bg-white border border-gray-200 p-4 rounded-2xl space-y-3 mt-3">
            <h4 className="text-xs font-black text-gray-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-[#0A6A32]" />
              <span>{lang === 'bn' ? 'নিরাপত্তা ও নীতিমালা' : 'Security & Privacy'}</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  if (onOpenPrivacyPolicy) onOpenPrivacyPolicy();
                  else setShowPrivacyPolicy(true);
                }}
                className="w-full py-2.5 px-3 bg-slate-50 hover:bg-emerald-50 text-gray-800 hover:text-[#0A6A32] border border-gray-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                id="btn-profile-privacy-policy"
              >
                <FileText className="w-3.5 h-3.5 text-[#0A6A32]" />
                <span>{lang === 'bn' ? 'গোপনীয়তা নীতি (Privacy Policy)' : 'Privacy Policy'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteModal(true);
                  setDeleteStep(1);
                  setDeleteConfirmChecked(false);
                  setDeleteError('');
                }}
                className="w-full py-2.5 px-3 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                id="btn-profile-delete-account"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>{lang === 'bn' ? 'অ্যাকাউন্ট ডিলিট করুন' : 'Delete Account'}</span>
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ================= MODAL: STRICT DOUBLE-CONFIRMATION DELETE PROFILE ================= */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-sm w-full overflow-hidden shadow-2xl border border-gray-200 p-5 space-y-4 text-left">
            
            {deleteStep === 1 ? (
              /* ================= STEP 1: আপনি কি সত্যি ডিলিট করতে চান? হ্যাঁ / না ================= */
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-gray-900 leading-snug">
                      {lang === 'bn' ? 'আপনি কি সত্যি ডিলিট করতে চান?' : 'Do you really want to delete your profile?'}
                    </h3>
                    <p className="text-[10px] text-amber-700 font-bold mt-0.5">
                      {lang === 'bn' ? 'প্রথম ধাপ যাচাইকরণ' : 'Step 1 of 2 Verification'}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-gray-600 leading-relaxed bg-amber-50/70 p-3 rounded-2xl border border-amber-200/70">
                  {lang === 'bn' 
                    ? 'আপনার সেবাদাতা প্রোফাইল, কাজের ইতিহাস, অর্জিত রেটিং ও বায়োডাটা ঝাদিমাদি প্লাটফর্ম থেকে মুছে ফেলা শুরু হবে। আপনি কি নিশ্চিত?' 
                    : 'Your service provider profile, job history, and biodata will begin deletion from Jhadimadi. Are you sure?'}
                </p>

                {/* Step 1 Actions: না (Cancel) vs হ্যাঁ (Proceed to Step 2) */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-gray-800 rounded-xl text-xs font-black transition cursor-pointer text-center"
                    id="btn-delete-step1-no"
                  >
                    {lang === 'bn' ? 'না (No)' : 'No (Cancel)'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setDeleteStep(2)}
                    className="py-2.5 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-black transition cursor-pointer text-center shadow-xs"
                    id="btn-delete-step1-yes"
                  >
                    {lang === 'bn' ? 'হ্যাঁ (Yes)' : 'Yes (Continue)'}
                  </button>
                </div>
              </div>
            ) : (
              /* ================= STEP 2: আরও একবার ভাবুন - কনফার্ম করুন ================= */
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-black text-red-600 leading-snug">
                      {lang === 'bn' ? 'আরও একবার ভাবুন - কনফার্ম করুন' : 'Think Once Again - Please Confirm'}
                    </h3>
                    <p className="text-[10px] text-red-700 font-bold mt-0.5">
                      {lang === 'bn' ? 'চূড়ান্ত ও অপরিবর্তনযোগ্য পদক্ষেপ' : 'Final Irreversible Step'}
                    </p>
                  </div>
                </div>

                <p className="text-xs text-red-700 leading-relaxed bg-red-50 p-3 rounded-2xl border border-red-200 font-medium">
                  {lang === 'bn' 
                    ? 'এটি চিরতরে আপনার এনআইডি, মেম্বার আইডি ও ফোন নম্বর যুক্ত প্রোফাইল মুছে ফেলবে। ডিলিটের পর কোনো তথ্য পুনরায় ফিরে পাওয়া যাবে না।' 
                    : 'This will permanently destroy your NID record, member profile, and history. Data recovery is not possible.'}
                </p>

                {/* Error if deletion failed */}
                {deleteError && (
                  <div className="p-2.5 bg-red-100 border border-red-300 rounded-xl text-red-700 text-xs font-semibold">
                    {deleteError}
                  </div>
                )}

                {/* Checkbox Confirmation */}
                <label className="flex items-start gap-2.5 cursor-pointer select-none text-xs text-gray-800">
                  <input 
                    type="checkbox"
                    checked={deleteConfirmChecked}
                    onChange={(e) => setDeleteConfirmChecked(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-red-600 rounded cursor-pointer"
                    id="chk-delete-confirm-final"
                  />
                  <span className="font-bold text-gray-800 text-[11px]">
                    {lang === 'bn' ? 'আমি শতভাগ নিশ্চিত হয়ে চিরতরে মুছে ফেলতে সম্মত।' : 'I am 100% sure and confirm permanent deletion.'}
                  </span>
                </label>

                {/* Step 2 Actions */}
                <div className="grid grid-cols-2 gap-2.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    disabled={isDeletingAccount}
                    className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-gray-800 rounded-xl text-xs font-bold transition cursor-pointer"
                    id="btn-delete-step2-cancel"
                  >
                    {lang === 'bn' ? 'বাতিল করুন' : 'Cancel'}
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteAccountConfirm}
                    disabled={!deleteConfirmChecked || isDeletingAccount}
                    className="py-2.5 px-3 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                    id="btn-confirm-delete-account"
                  >
                    {isDeletingAccount ? (
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                    <span>{lang === 'bn' ? 'নিশ্চিত ডিলিট করুন' : 'Confirm Delete'}</span>
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ================= MODAL: VIEW CERTIFICATE ================= */}
      {showCertModal && certUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl border border-gray-200 flex flex-col">
            <div className="bg-[#0A6A32] text-white px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="w-4 h-4 text-emerald-200" />
                <h3 className="text-xs sm:text-sm font-bold truncate">
                  {currentUser.certificateTitle || (lang === 'bn' ? 'কারিগরি প্রশিক্ষণ সনদপত্র' : 'Technical Certificate')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowCertModal(false)}
                className="text-white/80 hover:text-white p-1 rounded-lg transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-3 bg-gray-100 flex items-center justify-center max-h-[70vh] overflow-auto">
              <img 
                src={certUrl} 
                alt="Certificate" 
                className="max-w-full max-h-full object-contain rounded-lg shadow-sm"
              />
            </div>
            <div className="p-3 bg-white border-t border-gray-200 text-center">
              <button
                type="button"
                onClick={() => setShowCertModal(false)}
                className="w-full py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                {lang === 'bn' ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= MODAL: PRIVACY POLICY (GOOGLE PLAY COMPLIANCE) ================= */}
      <PrivacyPolicyModal
        isOpen={showPrivacyPolicy}
        onClose={() => setShowPrivacyPolicy(false)}
        onOpenAccountDeletion={() => {
          setShowPrivacyPolicy(false);
          setShowDeleteModal(true);
          setDeleteStep(1);
          setDeleteConfirmChecked(false);
          setDeleteError('');
        }}
      />

    </div>
  );
};
