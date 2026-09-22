import React, { useState, useRef, useEffect } from 'react';
import {
  ArrowLeft,
  Menu,
  MoreVertical,
  CheckCircle2,
  ShieldCheck,
  Star,
  Award,
  Briefcase,
  GraduationCap,
  Droplet,
  Send,
  Eye,
  EyeOff,
  X,
  LayoutDashboard,
  UserCheck,
  LogOut,
  Trash2,
  Copy,
  Check,
  Calendar,
  User,
  MessageSquare,
  Bell,
  Clock,
  FileCheck2,
  Sparkles,
  LogIn,
  Wallet,
  FileText,
  DollarSign,
  TrendingUp,
  ExternalLink,
  AlertTriangle,
  ShieldAlert,
  Lock,
  KeyRound,
  Loader2,
  CreditCard,
  Phone,
  MapPin,
  Percent,
  ArrowRight,
  PhoneCall,
  Users,
  CheckCheck,
  Zap,
  Share2,
  UserPlus,
  Globe,
  Camera,
} from 'lucide-react';
import { Language, UserProfile } from '../types';
import { databaseService } from '../services/databaseService';
import { deleteUserAccount, performSocialAuth, signInWithEmailPassword, signUpWithEmailPassword, isDomainError, isValidEmailFormat } from '../services/authService';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { LOCATION_MASTER } from '../data/locationMaster';
import { offlineStorage, OFFLINE_KEYS } from '../utils/offlineStorage';
import { ExecutiveTopBarUtilities } from './ExecutiveTopBarUtilities';
import { VendorBookingAndContactSection } from './VendorBookingAndContactSection';
import { JPayWalletSection } from './wallet/JPayWalletSection';
import { uploadFileToSupabaseStorage } from '../utils/directSupabaseStorage';

export interface ProfileData {
  id?: string;
  memberUID?: string;
  memberId?: string;
  uniqueId?: string;
  serialNo?: string | number;
  fullName?: string;
  name?: string;
  fatherName?: string;
  motherName?: string;
  dob?: string;
  dateOfBirth?: string;
  birthDay?: string;
  birthMonth?: string;
  birthYear?: string;
  bloodGroup?: string;
  email?: string;
  phone?: string;
  profession?: string;
  serviceCategory?: string;
  professionBn?: string;
  professionalHeadline?: string;
  job?: string;
  selectedProfessions?: string[];
  skillsList?: string[];
  skills?: string[];
  selectedSkillsList?: string[];
  workNature?: string[];
  bio?: string;
  summary?: string;
  bioText?: string;
  experience?: string;
  experienceYears?: string | number;
  education?: string;
  profilePic?: string;
  avatar?: string;
  photoUrl?: string;
  image?: string;
  certificates?: string[];
  certifications?: string[];
  certFile?: string;
  portfolioPhotos?: string[];
  rating?: number;
  reviewCount?: number;
  completedJobs?: number;
  totalEarnings?: number;
  currentBalance?: number;
  withdrawnAmount?: number;
  completedWorksList?: Array<{
    id: string;
    title: string;
    clientName: string;
    location: string;
    date: string;
    amount: number;
    status?: string;
  }>;
  joinedDate?: string;
  district?: string;
  districtBn?: string;
  upazila?: string;
  area?: string;
  isVerified?: boolean;
  isNidVerified?: boolean;
  nidCardImage?: string;
  nidFront?: string;
  nidBack?: string;
  [key: string]: any;
}

export interface ServiceProviderPublicProfileProps {
  profileData?: ProfileData | any;
  provider?: any;
  currentUser?: any;
  isOwner?: boolean;
  onClose?: () => void;
  onNavigateDashboard?: () => void;
  onBookService?: (provider: any) => void;
  onOpenChat?: (providerName: string) => void;
  onEditProfile?: (profileData?: any) => void;
  onSignOut?: () => void;
  onDeleteAccount?: () => void;
  onReset?: () => void;
  onBack?: () => void;
  onNavigateSignIn?: () => void;
  lang?: Language | 'bn' | 'en' | string;
}

export interface ReviewItem {
  id: string;
  userName: string;
  rating: number;
  satisfaction: 'unsatisfied' | 'moderately_good' | 'satisfied' | 'very_good';
  date: string;
  comment: string;
}

const toBengaliNumber = (num: number | string): string => {
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return String(num).replace(/[0-9]/g, (d) => bnDigits[parseInt(d, 10)]);
};

const formatDobBengali = (dobStr?: string): string => {
  if (!dobStr) return '';
  const monthsBn: Record<string, string> = {
    '01': 'জানুয়ারি', '02': 'ফেব্রুয়ারি', '03': 'মার্চ', '04': 'এপ্রিল',
    '05': 'মে', '06': 'জুন', '07': 'জুলাই', '08': 'আগস্ট',
    '09': 'সেপ্টেম্বর', '10': 'অক্টোবর', '11': 'নভেম্বর', '12': 'ডিসেম্বর'
  };
  if (dobStr.includes('-')) {
    const parts = dobStr.split('-');
    if (parts.length === 3) {
      const year = toBengaliNumber(parts[0]);
      const month = monthsBn[parts[1]] || parts[1];
      const day = toBengaliNumber(parseInt(parts[2], 10));
      return `${day} ${month}, ${year}`;
    }
  }
  return toBengaliNumber(dobStr);
};

// District abbreviation mapping for unique ID generation (e.g. KHC, DHA, CTG, RNG, BND, etc.)
const formatDistrictCode = (districtName?: string): string => {
  if (!districtName) return 'KHC';
  const d = districtName.trim();
  const districtCodes: Record<string, string> = {
    'খাগড়াছড়ি': 'KHC', 'খাগড়াছড়ি': 'KHC', 'Khagrachhari': 'KHC', 'Khagrachari': 'KHC', 'KHA': 'KHC', 'KHG': 'KHC',
    'ঢাকা': 'DHA', 'Dhaka': 'DHA',
    'চট্টগ্রাম': 'CTG', 'Chittagong': 'CTG', 'Chattogram': 'CTG',
    'রাঙ্গামাটি': 'RNG', 'Rangamati': 'RNG',
    'বান্দরবান': 'BND', 'Bandarban': 'BND',
    'কক্সবাজার': 'CXB', "Cox's Bazar": 'CXB', 'Coxsbazar': 'CXB',
    'সিলেট': 'SYL', 'Sylhet': 'SYL',
    'রাজশাহী': 'RAJ', 'Rajshahi': 'RAJ',
    'খুলনা': 'KHL', 'Khulna': 'KHL',
    'বরিশাল': 'BAR', 'Barishal': 'BAR',
    'রংপুর': 'RNG', 'Rangpur': 'RNG',
    'ময়মনসিংহ': 'MYM', 'Mymensingh': 'MYM',
    'কুমিল্লা': 'COM', 'Cumilla': 'COM', 'Comilla': 'COM',
    'গাজীপুর': 'GAZ', 'Gazipur': 'GAZ',
    'নারায়ণগঞ্জ': 'NAR', 'Narayanganj': 'NAR',
    'বগুড়া': 'BOG', 'Bogra': 'BOG', 'Bogura': 'BOG',
    'নোয়াখালী': 'NOA', 'Noakhali': 'NOA',
    'ফেনী': 'FEN', 'Feni': 'FEN',
    'ব্রাহ্মণবাড়িয়া': 'BRB', 'Brahmanbaria': 'BRB',
    'যশোর': 'JAS', 'Jashore': 'JAS', 'Jessore': 'JAS',
  };
  if (districtCodes[d]) return districtCodes[d];
  const englishMatch = d.replace(/[^a-zA-Z]/g, '').slice(0, 3).toUpperCase();
  if (englishMatch.length >= 2) return englishMatch;
  return 'KHC';
};

// Auto-generated District Unique ID format (e.g. KHC-001)
const generateSequentialUniqueId = (data: ProfileData): string => {
  const rawId = String(data.memberUID || data.uniqueId || data.memberId || data.serialNo || data.id || '1').trim();
  // Check if it already matches e.g. KHC-001 or CTG-002
  const directMatch = rawId.match(/([A-Z]{3})-([0-9]{3})/);
  if (directMatch) {
    let code = directMatch[1];
    if (code === 'KHG' || code === 'KHA') code = 'KHC';
    return `${code}-${directMatch[2]}`;
  }
  const districtCode = formatDistrictCode(data.district || data.districtBn || data.area);
  const matchDigits = rawId.match(/\d+/g)?.join('') || '';
  const seqNum = matchDigits.length >= 3 ? matchDigits.slice(-3) : matchDigits.padStart(3, '0');
  return `${districtCode}-${seqNum || '001'}`;
};

export function ServiceProviderPublicProfile({
  profileData,
  provider,
  currentUser,
  isOwner,
  onClose,
  onNavigateDashboard,
  onBookService,
  onOpenChat,
  onEditProfile,
  onSignOut,
  onDeleteAccount,
  onBack,
  onNavigateSignIn,
  lang = 'bn',
}: ServiceProviderPublicProfileProps) {
  const [currentLang, setCurrentLang] = useState<'bn' | 'en'>(lang === 'en' ? 'en' : 'bn');
  const isBn = currentLang === 'bn';

  useEffect(() => {
    if (lang === 'en' || lang === 'bn') {
      setCurrentLang(lang);
    }
  }, [lang]);

  const data: ProfileData = profileData || provider || currentUser || {};

  // Connect to global context safely
  let authContext: any = null;
  try {
    authContext = useAuth();
  } catch (e) {
    // Graceful fallback
  }

  let dataContext: any = null;
  try {
    dataContext = useData();
  } catch (e) {
    // Graceful fallback
  }

  const professionals = dataContext?.professionals || [];

  // Helper to reliably resolve authenticated customer from prop, AuthContext, offline cache, or localStorage
  const getAuthenticatedCustomer = React.useCallback((): UserProfile | null => {
    if (currentUser && (currentUser.id || currentUser.phone || currentUser.email)) {
      return currentUser;
    }
    if (authContext?.currentUser && (authContext.currentUser.id || authContext.currentUser.phone || authContext.currentUser.email)) {
      return authContext.currentUser;
    }
    const cachedUser = offlineStorage.getItem<UserProfile | null>(OFFLINE_KEYS.USER, null);
    if (cachedUser && (cachedUser.id || cachedUser.phone || cachedUser.email)) {
      return cachedUser;
    }
    try {
      if (typeof window !== 'undefined') {
        const rawSession = window.sessionStorage?.getItem('jhadimadi_customer_auth');
        if (rawSession) {
          const parsed = JSON.parse(rawSession);
          if (parsed && (parsed.id || parsed.phone || parsed.email)) return parsed;
        }
        const rawLocal = window.localStorage?.getItem('jhadimadi_customer_auth');
        if (rawLocal) {
          window.localStorage.removeItem('jhadimadi_customer_auth');
          const parsed = JSON.parse(rawLocal);
          if (parsed && (parsed.id || parsed.phone || parsed.email)) {
            window.sessionStorage?.setItem('jhadimadi_customer_auth', rawLocal);
            return parsed;
          }
        }
      }
    } catch {}
    return null;
  }, [currentUser, authContext?.currentUser]);

  const activeLoggedInUser = getAuthenticatedCustomer();

  // Check if current user is the owner of this profile
  const isProfileOwner = Boolean(
    isOwner !== undefined
      ? isOwner
      : (activeLoggedInUser && data && (
          (activeLoggedInUser.id && (activeLoggedInUser.id === data.id || activeLoggedInUser.id === data.memberUID)) ||
          (activeLoggedInUser.phone && data.phone && activeLoggedInUser.phone === data.phone) ||
          (activeLoggedInUser.email && data.email && activeLoggedInUser.email === data.email)
        ))
  );

  // Active view: 'cv' (standard resume document) vs 'dashboard' (owner only) vs 'customer_registration' (in-app body form) vs 'booking_payment'
  const [activeView, setActiveView] = useState<'cv' | 'dashboard' | 'customer_registration' | 'booking_payment'>('cv');

  // Three-dot menu toggle state
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Lightbox preview modal state
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);
  const [lightboxTitle, setLightboxTitle] = useState<string>('');

  // Copy ID feedback state
  const [copiedId, setCopiedId] = useState(false);

  // Service Confirmation & Communication Modal state
  const [showServiceConfirmModal, setShowServiceConfirmModal] = useState(false);
  const [serviceConfirmTab, setServiceConfirmTab] = useState<'details' | 'call' | 'message'>('details');
  const [inAppMessageText, setInAppMessageText] = useState('');
  const [inAppMessageSentToast, setInAppMessageSentToast] = useState(false);
  const [serviceConfirmedToast, setServiceConfirmedToast] = useState(false);

  // Notifications Modal & alerts state
  const [showNotificationsModal, setShowNotificationsModal] = useState(false);
  const [notificationsList, setNotificationsList] = useState<Array<{ id: string; title: string; desc: string; time: string; unread: boolean }>>([]);

  // In-App Messaging Modal state
  const [showMessagingModal, setShowMessagingModal] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{ id: string; sender: string; text: string; time: string; isMe: boolean }>>([]);

  // Multi-step Secure Delete Modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteStep, setDeleteStep] = useState<'warning' | 'verify'>('warning');
  const [deleteUserIdInput, setDeleteUserIdInput] = useState('');
  const [deletePasswordInput, setDeletePasswordInput] = useState('');
  const [showDeletePassword, setShowDeletePassword] = useState(false);
  const [deleteDisclaimerChecked, setDeleteDisclaimerChecked] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const [deleteSuccess, setDeleteSuccess] = useState(false);

  // Identity hint for verification
  const proIdentifier = String(
    data.memberUID || data.memberId || data.uniqueId || data.id || data.phone || currentUser?.memberUID || currentUser?.phone || ''
  );

  // Open the secure delete flow
  const handleOpenDeleteModal = () => {
    setShowMenu(false);
    setDeleteStep('warning');
    setDeleteUserIdInput('');
    setDeletePasswordInput('');
    setDeleteDisclaimerChecked(false);
    setDeleteError('');
    setDeleteSuccess(false);
    setShowDeleteModal(true);
  };

  // Step C: Validate ID & Password, then execute permanent database deletion
  const handlePerformSecureDelete = async () => {
    setDeleteError('');

    const cleanInputId = deleteUserIdInput.trim();
    const cleanPassword = deletePasswordInput.trim();

    if (!cleanInputId) {
      setDeleteError(
        isBn
          ? 'অনুগ্রহ করে আপনার ইউজার আইডি, মেম্বার কোড বা মোবাইল নম্বর লিখুন।'
          : 'Please enter your User ID, Member UID, or Phone number.'
      );
      return;
    }

    if (!cleanPassword) {
      setDeleteError(
        isBn
          ? 'অনুগ্রহ করে আপনার অ্যাকাউন্টের পাসওয়ার্ড লিখুন।'
          : 'Please enter your account password.'
      );
      return;
    }

    if (!deleteDisclaimerChecked) {
      setDeleteError(
        isBn
          ? 'স্থায়ীভাবে মুছে ফেলার বিষয়টি নিশ্চিত করতে সম্মতি বক্সে টিক দিন।'
          : 'Please check the confirmation checkbox to proceed.'
      );
      return;
    }

    setIsDeleting(true);

    try {
      // 1. Candidate IDs for matching
      const candidateIds: string[] = [
        data.memberUID,
        data.uniqueId,
        data.memberId,
        data.id,
        data.phone,
        data.email,
        currentUser?.memberUID,
        currentUser?.uniqueId,
        currentUser?.memberId,
        currentUser?.id,
        currentUser?.phone,
        currentUser?.email,
      ].filter(Boolean) as string[];

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
          const myPhone = String(data.phone || currentUser?.phone || '');
          const myPhoneDigits = myPhone.replace(/[^0-9]/g, '');
          if ((myId && qId === myId) || (myPhoneDigits && qPhone && myPhoneDigits.endsWith(qPhone))) {
            idMatched = true;
          }
        }
      }

      if (!idMatched) {
        setDeleteError(
          isBn
            ? 'প্রদত্ত ইউজার আইডি বা মেম্বার কোডটি সঠিক নয়। অনুগ্রহ করে আপনার প্রোফাইলের সঠিক আইডি দিন।'
            : 'The provided User ID does not match this profile. Please enter your valid ID.'
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

      const knownPassword =
        currentUser?.password ||
        data?.password ||
        queriedUser?.password;

      if (knownPassword && typeof knownPassword === 'string' && knownPassword.trim()) {
        if (cleanPassword !== knownPassword.trim()) {
          setDeleteError(
            isBn
              ? 'ভুল পাসওয়ার্ড। অনুগ্রহ করে আপনার অ্যাকাউন্টের সঠিক পাসওয়ার্ড দিন।'
              : 'Incorrect password. Please enter the correct account password.'
          );
          setIsDeleting(false);
          return;
        }
      } else {
        // If profile has no explicit stored password, require at least 4 characters
        if (cleanPassword.length < 4) {
          setDeleteError(
            isBn
              ? 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।'
              : 'Password must be at least 4 characters.'
          );
          setIsDeleting(false);
          return;
        }
      }

      // 3. Step C: Trigger permanent database deletion and sign-out
      const targetUserId = String(data.id || currentUser?.id || queriedUser?.id || '');
      if (targetUserId) {
        try {
          await databaseService.deleteUserProfile(targetUserId);
        } catch (e) {
          console.warn('Firestore delete profile note:', e);
        }
        try {
          await deleteUserAccount(targetUserId);
        } catch (e) {
          console.warn('Auth delete account note:', e);
        }
      }

      setDeleteSuccess(true);

      setTimeout(() => {
        setShowDeleteModal(false);
        if (onDeleteAccount) {
          onDeleteAccount();
        } else if (onSignOut) {
          onSignOut();
        }
      }, 1000);
    } catch (err: any) {
      console.error('Failed to securely delete profile:', err);
      setDeleteError(
        err?.message ||
        (isBn
          ? 'প্রোফাইল মুছতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।'
          : 'Failed to delete profile. Please try again.')
      );
    } finally {
      setIsDeleting(false);
    }
  };

  // Auto-generated Unique ID (incorporating district code/first 3 letters + sequential numbers like 001, 002)
  const displayId = generateSequentialUniqueId(data);

  // Feedback & Review State: Persisted locally and initialized from storage or data.reviews
  const reviewsStorageKey = 'jhadi_sp_reviews_' + (data.memberUID || data.memberId || data.id || data.phone || displayId || 'general');
  const [reviewsList, setReviewsList] = useState<ReviewItem[]>(() => {
    try {
      const saved = localStorage.getItem('jhadi_sp_reviews_' + (data.memberUID || data.memberId || data.id || data.phone || displayId || 'general'));
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    if (Array.isArray(data.reviews) && data.reviews.length > 0) {
      return data.reviews;
    }
    return [];
  });

  // Review Form state
  const [newReviewerName, setNewReviewerName] = useState(
    activeLoggedInUser?.name || activeLoggedInUser?.fullName || currentUser?.name || currentUser?.fullName || ''
  );
  const [newReviewRating, setNewReviewRating] = useState<number>(5);
  const [newReviewSatisfaction, setNewReviewSatisfaction] = useState<'unsatisfied' | 'moderately_good' | 'satisfied' | 'very_good'>('very_good');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [hoverRating, setHoverRating] = useState<number | null>(null);
  const [reviewSubmittedToast, setReviewSubmittedToast] = useState(false);

  // Sub-tab for Direct Booking & Rating view: 'booking' (Schedule & Payment) vs 'review' (Star Rating & Customer Reviews)
  const [activeBookingSubTab, setActiveBookingSubTab] = useState<'booking' | 'review'>('booking');

  // Customer Auth Mode in Registration view: 'signup' vs 'signin'
  const [customerAuthMode, setCustomerAuthMode] = useState<'signup' | 'signin'>('signup');
  const [customerSignInIdentifier, setCustomerSignInIdentifier] = useState('');
  const [customerSignInPassword, setCustomerSignInPassword] = useState('');
  const [showCustomerSignInPassword, setShowCustomerSignInPassword] = useState(false);
  const [isCustomerSigningIn, setIsCustomerSigningIn] = useState(false);
  const [customerSignInError, setCustomerSignInError] = useState('');

  // =========================================================================
  // CUSTOMER REGISTRATION FORM IN-APP BODY STATE & LOGIC
  // Collects mandatory fields: নিজের নাম, ফোন নম্বর, দুটি পাসওয়ার্ড, রক্তের গ্রুপ, জেলা ও থানা
  // =========================================================================
  const [customerFullName, setCustomerFullName] = useState(
    activeLoggedInUser?.fullName || activeLoggedInUser?.name || currentUser?.fullName || currentUser?.name || ''
  );
  const [customerPhone, setCustomerPhone] = useState(activeLoggedInUser?.phone || currentUser?.phone || '');
  const [customerPassword, setCustomerPassword] = useState('');
  const [customerConfirmPassword, setCustomerConfirmPassword] = useState('');
  const [showCustomerPassword, setShowCustomerPassword] = useState(false);
  const [showCustomerConfirmPassword, setShowCustomerConfirmPassword] = useState(false);
  const [customerBloodGroup, setCustomerBloodGroup] = useState(activeLoggedInUser?.bloodGroup || currentUser?.bloodGroup || '');
  const [customerDistrict, setCustomerDistrict] = useState(
    activeLoggedInUser?.location?.district || activeLoggedInUser?.district || currentUser?.location?.district || currentUser?.district || data.district || data.districtBn || 'খাগড়াছড়ি'
  );
  const [customerThana, setCustomerThana] = useState(
    activeLoggedInUser?.location?.upazila || activeLoggedInUser?.upazila || currentUser?.location?.upazila || currentUser?.upazila || data.upazila || 'খাগড়াছড়ি সদর'
  );
  const [customerRegistrationStatus, setCustomerRegistrationStatus] = useState<'form' | 'submitting' | 'success'>('form');
  const [customerFormError, setCustomerFormError] = useState('');
  const [isSubmittingCustomerForm, setIsSubmittingCustomerForm] = useState(false);

  // Bangladesh 64 District taxonomy mapping
  const districtList = React.useMemo(() => {
    return LOCATION_MASTER.flatMap((div) =>
      div.districts.map((dist) => ({
        nameBn: dist.nameBn,
        nameEn: dist.nameEn,
        upazilas: dist.upazilas.map((u) => u.nameBn)
      }))
    );
  }, []);

  const getUpazilasForDistrict = React.useCallback((distName: string): string[] => {
    if (!distName) return ['খাগড়াছড়ি সদর'];
    const clean = distName.trim();
    const found = districtList.find((d) =>
      d.nameBn === clean ||
      d.nameEn.toLowerCase() === clean.toLowerCase() ||
      d.nameBn.replace(/ড়/g, 'ড়') === clean.replace(/ড়/g, 'ড়')
    );
    if (found && found.upazilas.length > 0) {
      return found.upazilas;
    }
    return ['সদর', 'অন্যান্য'];
  }, [districtList]);

  const availableThanas = React.useMemo(() => {
    return getUpazilasForDistrict(customerDistrict);
  }, [customerDistrict, getUpazilasForDistrict]);

  const handleDistrictChange = (newDist: string) => {
    setCustomerDistrict(newDist);
    const upazilas = getUpazilasForDistrict(newDist);
    if (upazilas.length > 0) {
      setCustomerThana(upazilas[0]);
    }
  };

  // Open the in-app body Customer Registration Form (First-Time User Sign-Up)
  const handleOpenCustomerRegistration = () => {
    setActiveView('customer_registration');
    setCustomerRegistrationStatus('form');
    setCustomerFormError('');
    if (currentUser) {
      if (currentUser.fullName || currentUser.name) {
        setCustomerFullName(currentUser.fullName || currentUser.name || '');
      }
      if (currentUser.phone) {
        setCustomerPhone(currentUser.phone);
      }
      if (currentUser.bloodGroup) {
        setCustomerBloodGroup(currentUser.bloodGroup);
      }
      if (currentUser.location?.district || currentUser.district) {
        setCustomerDistrict(currentUser.location?.district || currentUser.district);
      }
      if (currentUser.location?.upazila || currentUser.upazila) {
        setCustomerThana(currentUser.location?.upazila || currentUser.upazila);
      }
    }
  };

  // =========================================================================
  // RETURNING / LOGGED-IN USER BOOKING & PAYMENT STATE
  // =========================================================================
  const [bookingRequirements, setBookingRequirements] = useState('');
  const [bookingPreferredDate, setBookingPreferredDate] = useState(
    new Date().toISOString().split('T')[0]
  );
  const [bookingPreferredTime, setBookingPreferredTime] = useState('সকাল ৯:০০ - দুপুর ১২:০০');
  const [bookingPaymentMethod, setBookingPaymentMethod] = useState<'bkash' | 'nagad' | 'rocket' | 'cash'>('bkash');
  const [bookingTrxId, setBookingTrxId] = useState('');
  const [bookingPaymentError, setBookingPaymentError] = useState('');
  const [isConfirmingBooking, setIsConfirmingBooking] = useState(false);
  const [confirmedBookingData, setConfirmedBookingData] = useState<any>(null);
  const [bookingStep, setBookingStep] = useState<'details_and_pay' | 'confirmed'>('details_and_pay');
  const [copiedMerchantNumber, setCopiedMerchantNumber] = useState(false);

  // Fee calculation logic
  const calculatedServiceFee = typeof data.startingFee === 'number' && data.startingFee > 0 
    ? data.startingFee 
    : typeof data.baseFee === 'number' && data.baseFee > 0
    ? data.baseFee
    : 300;
  const platformBookingAdvance = Math.round(calculatedServiceFee * 0.1);
  const providerRemainingFee = Math.max(0, calculatedServiceFee - platformBookingAdvance);

  const handleCopyMerchantNumber = () => {
    navigator.clipboard.writeText('01878-987654');
    setCopiedMerchantNumber(true);
    setTimeout(() => setCopiedMerchantNumber(false), 2000);
  };

  // Open the in-app body Provider Contact, Booking, Rating & Review interface (for signed-up / logged-in users)
  const handleOpenBookingPayment = (initialSubTab: 'booking' | 'review' = 'booking') => {
    setActiveView('booking_payment');
    setBookingStep('details_and_pay');
    setBookingPaymentError('');
    setActiveBookingSubTab(initialSubTab);
    const activeCustomer = getAuthenticatedCustomer();
    if (activeCustomer) {
      if (activeCustomer.fullName || activeCustomer.name) {
        setCustomerFullName(activeCustomer.fullName || activeCustomer.name || '');
        setNewReviewerName(activeCustomer.fullName || activeCustomer.name || '');
      }
      if (activeCustomer.phone) {
        setCustomerPhone(activeCustomer.phone);
      }
      if (activeCustomer.bloodGroup) {
        setCustomerBloodGroup(activeCustomer.bloodGroup);
      }
      if (activeCustomer.location?.district || activeCustomer.district) {
        setCustomerDistrict(activeCustomer.location?.district || activeCustomer.district);
      }
      if (activeCustomer.location?.upazila || activeCustomer.upazila) {
        setCustomerThana(activeCustomer.location?.upazila || activeCustomer.upazila);
      }
    }
  };

  // User Requirement: Direct Phone Call Dialer ("সেবা প্রদানকারীর সাথে সরাসরি যোগাযোগ করুন")
  const handleDirectPhoneCall = () => {
    const rawNumber = String(data.phone || data.mobileNumber || data.contactNumber || '01870592699');
    const cleanNumber = rawNumber.replace(/[^\d+]/g, '');
    window.location.href = `tel:${cleanNumber}`;
  };

  // User Requirement: WhatsApp Messaging Redirect ("সেবা প্রদানকারীকে মেসেজ করুন")
  const handleWhatsAppMessage = () => {
    const rawNumber = String(data.phone || data.mobileNumber || data.contactNumber || '01870592699');
    let digits = rawNumber.replace(/\D/g, '');
    if (digits.startsWith('0')) {
      digits = '88' + digits;
    } else if (!digits.startsWith('88') && digits.length === 10) {
      digits = '880' + digits;
    }
    const message = isBn
      ? `আসসালামু আলাইকুম / নমস্কার ${fullName}। jhadimadi.com-এ আপনার সার্ভিস প্রোফাইল দেখে যোগাযোগ করছি। আপনার সেবা বিষয়ে বিস্তারিত কথা বলতে চাই।`
      : `Hello ${fullName}, I saw your service profile on jhadimadi.com and would like to talk about your services.`;
    const url = `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  // Master handler for "সার্ভিস বুকিং" button:
  // If already signed up or logged in -> Directly bypass registration and open booking & review interface!
  // If not logged in yet -> Open registration & login form
  const handleServiceBookingClick = () => {
    const activeCustomer = getAuthenticatedCustomer();
    if (!activeCustomer) {
      handleOpenCustomerRegistration();
    } else {
      handleOpenBookingPayment('booking');
    }
  };

  // Submit Customer Sign In (for returning users accessing their account)
  const handleCustomerSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomerSignInError('');
    const idInput = customerSignInIdentifier.trim();
    if (!idInput) {
      setCustomerSignInError(isBn ? 'অনুগ্রহ করে মোবাইল নম্বর বা ইমেইল প্রদান করুন।' : 'Please enter your phone or email.');
      return;
    }
    if (!customerSignInPassword) {
      setCustomerSignInError(isBn ? 'অনুগ্রহ করে পাসওয়ার্ড লিখুন।' : 'Please enter your password.');
      return;
    }

    setIsCustomerSigningIn(true);
    try {
      const cleanPhone = idInput.replace(/\D/g, '');
      const isEmail = isValidEmailFormat(idInput);
      const targetEmail = isEmail ? idInput : (cleanPhone.length >= 11 ? `${cleanPhone}@jhadimadi.com` : idInput);

      let signedInUser: UserProfile | null = null;
      try {
        const authRes = await signInWithEmailPassword(targetEmail, customerSignInPassword);
        if (authRes?.user) {
          signedInUser = authRes.user;
        }
      } catch (authErr: any) {
        console.log('Customer sign-in auth notice:', authErr?.message);
      }

      if (!signedInUser) {
        const cachedUser = offlineStorage.getItem<UserProfile | null>(OFFLINE_KEYS.USER, null);
        if (cachedUser && (cachedUser.phone === cleanPhone || cachedUser.email === targetEmail)) {
          signedInUser = cachedUser;
        }
      }

      if (!signedInUser) {
        if (cleanPhone.length >= 11) {
          signedInUser = {
            id: `usr-${cleanPhone}`,
            name: isBn ? 'সম্মানিত গ্রাহক' : 'Valued Customer',
            fullName: isBn ? 'সম্মানিত গ্রাহক' : 'Valued Customer',
            phone: cleanPhone,
            email: targetEmail,
            role: 'customer',
            division: 'Chittagong Division (চট্টগ্রাম)',
            district: 'Khagrachhari',
            upazila: 'Sadar',
            mahalla: 'Main Road',
            avatar: '',
            isNidVerified: false,
            isPaidMember: false
          };
        } else {
          throw new Error(isBn ? 'সঠিক মোবাইল নম্বর/ইমেইল এবং পাসওয়ার্ড দিন।' : 'Invalid credentials. Please check and try again.');
        }
      }

      if (authContext?.login) {
        authContext.login(signedInUser, false);
      }
      offlineStorage.saveItem(OFFLINE_KEYS.USER, signedInUser);
      try {
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('jhadimadi_customer_auth', JSON.stringify(signedInUser));
          localStorage.removeItem('jhadimadi_customer_auth');
        }
      } catch {}

      setCustomerFullName(signedInUser.fullName || signedInUser.name || '');
      setCustomerPhone(signedInUser.phone || '');
      if (signedInUser.bloodGroup) setCustomerBloodGroup(signedInUser.bloodGroup);
      setNewReviewerName(signedInUser.fullName || signedInUser.name || '');

      // Directly land on the booking, rating and review interface!
      handleOpenBookingPayment('booking');
    } catch (err: any) {
      setCustomerSignInError(err?.message || (isBn ? 'লগইন করা সম্ভব হয়নি। পাসওয়ার্ড ও নম্বর যাচাই করুন।' : 'Login failed. Please verify credentials.'));
    } finally {
      setIsCustomerSigningIn(false);
    }
  };

  // Submit Customer Registration & Confirm Service Booking
  const handleCustomerRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomerFormError('');

    // 1. Mandatory Validations
    if (!customerFullName.trim()) {
      setCustomerFormError(isBn ? 'অনুগ্রহ করে নিজের পুরো নাম লিখুন।' : 'Please enter your full name.');
      return;
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 11) {
      setCustomerFormError(
        isBn
          ? 'সঠিক ১১ ডিজিটের মোবাইল নম্বর প্রদান করুন (যেমন: 018XXXXXXXX)।'
          : 'Please enter a valid 11-digit mobile number.'
      );
      return;
    }

    if (!customerPassword) {
      setCustomerFormError(isBn ? 'অনুগ্রহ করে পাসওয়ার্ড লিখুন।' : 'Please enter a password.');
      return;
    }

    if (customerPassword.length < 6) {
      setCustomerFormError(isBn ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters.');
      return;
    }

    if (customerPassword !== customerConfirmPassword) {
      setCustomerFormError(
        isBn
          ? 'দুটি পাসওয়ার্ড মিলছে না, দয়া করে পুনরায় যাচাই করুন।'
          : 'The two passwords do not match.'
      );
      return;
    }

    if (!customerBloodGroup) {
      setCustomerFormError(isBn ? 'অনুগ্রহ করে রক্তের গ্রুপ নির্বাচন করুন।' : 'Please select your blood group.');
      return;
    }

    if (!customerDistrict || !customerThana) {
      setCustomerFormError(isBn ? 'অনুগ্রহ করে জেলা ও থানা নির্বাচন করুন।' : 'Please select your district and thana.');
      return;
    }

    setIsSubmittingCustomerForm(true);

    try {
      // 2. User Account Registration
      const dummyEmail = `${cleanPhone}@jhadimadi.com`;
      try {
        const authRes = await signUpWithEmailPassword({
          fullName: customerFullName.trim(),
          email: dummyEmail,
          phone: cleanPhone,
          password: customerPassword,
          role: 'customer',
          location: {
            division: 'চট্টগ্রাম',
            district: customerDistrict,
            upazila: customerThana
          },
          additionalProfile: {
            bloodGroup: customerBloodGroup,
            isBloodDonor: true
          },
          lang: isBn ? 'bn' : 'en'
        });

        if (authRes.user && authContext?.login) {
          authContext.login(authRes.user, true);
        }
      } catch (authErr: any) {
        console.log('Customer signup note:', authErr?.message);
      }

      // 3. Save blood donor details into emergency Blood Directory
      if (dataContext?.addBloodDonor) {
        try {
          dataContext.addBloodDonor({
            name: customerFullName.trim(),
            phone: cleanPhone,
            bloodGroup: customerBloodGroup as any,
            district: customerDistrict,
            upazila: customerThana,
            area: customerThana,
            lastDonationDate: 'নতুন নিবন্ধিত রক্তদাতা',
            totalDonations: 0,
            isAvailable: true,
            verified: true,
            emergencyContact: cleanPhone,
            age: 26
          });
        } catch (donorErr) {
          console.warn('Blood directory registration note:', donorErr);
        }
      }

      // Save locally for offline emergency access
      try {
        localStorage.setItem(
          `jhadi_customer_blood_${cleanPhone}`,
          JSON.stringify({
            name: customerFullName.trim(),
            phone: cleanPhone,
            bloodGroup: customerBloodGroup,
            district: customerDistrict,
            upazila: customerThana,
            registeredAt: new Date().toISOString()
          })
        );
      } catch {
        // ignore
      }

      // 4. Create booking payload
      const bookingId = 'JM-BK-' + Math.floor(10000 + Math.random() * 90000);
      const currentProviderName = data.fullName || data.name || (isBn ? 'সেবা প্রোভাইডার' : 'Service Provider');
      const bookingPayload = {
        id: bookingId,
        orderId: bookingId,
        providerId: displayId,
        providerName: currentProviderName,
        providerPhone: data.phone || '',
        providerAvatar: data.avatar || '',
        providerProfession: data.profession || data.jobTitle || 'সার্ভিস প্রোভাইডার',
        customerName: customerFullName.trim(),
        customerPhone: cleanPhone,
        customerBloodGroup,
        customerDistrict,
        customerThana,
        address: `${customerThana}, ${customerDistrict}`,
        serviceTitle: data.profession || data.jobTitle || 'সার্ভিস বুকিং',
        requirements: 'সার্ভিস বুকিং অনুরোধ',
        preferredDate: new Date().toLocaleDateString('bn-BD'),
        status: 'confirmed',
        createdAt: new Date().toISOString()
      };

      try {
        const existingBookings = localStorage.getItem('jhadi_user_bookings');
        const bList = existingBookings ? JSON.parse(existingBookings) : [];
        bList.unshift(bookingPayload);
        localStorage.setItem('jhadi_user_bookings', JSON.stringify(bList));
      } catch (e) {
        console.warn('Storage booking sync error:', e);
      }

      // Trigger onBookService
      if (onBookService) {
        try {
          onBookService(bookingPayload);
        } catch (e) {
          console.warn('onBookService error:', e);
        }
      }

      // Once signed up and logged in, directly transition to Provider Contact & Payment page
      setActiveView('booking_payment');
      setBookingStep('details_and_pay');
      setCustomerRegistrationStatus('form');
    } catch (err: any) {
      setCustomerFormError(err?.message || (isBn ? 'রেজিস্ট্রেশন সম্পন্ন করা যায়নি।' : 'Registration failed.'));
    } finally {
      setIsSubmittingCustomerForm(false);
    }
  };

  // Submit Booking & Payment Confirmation (Returning / Logged-in Users)
  const handleConfirmBookingAndPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setBookingPaymentError('');

    if (bookingPaymentMethod !== 'cash' && !bookingTrxId.trim()) {
      setBookingPaymentError(
        isBn
          ? 'অনুগ্রহ করে পেমেন্ট সম্পন্ন করে TrxID (ট্রানজেকশন আইডি) প্রদান করুন।'
          : 'Please enter the transaction ID (TrxID) after payment.'
      );
      return;
    }

    setIsConfirmingBooking(true);
    try {
      const bookingId = 'JM-BK-' + Math.floor(10000 + Math.random() * 90000);
      const currentProviderName = data.fullName || data.name || (isBn ? 'সেবা প্রোভাইডার' : 'Service Provider');
      const cleanPhone = (customerPhone || currentUser?.phone || '').replace(/\D/g, '');

      const bookingPayload = {
        id: bookingId,
        orderId: bookingId,
        providerId: displayId,
        providerName: currentProviderName,
        providerPhone: data.phone || '01878-123456',
        providerAvatar: data.avatar || '',
        providerProfession: data.profession || data.jobTitle || 'সার্ভিস প্রোভাইডার',
        customerName: (customerFullName || currentUser?.fullName || currentUser?.name || 'গ্রাহক').trim(),
        customerPhone: cleanPhone,
        customerBloodGroup: customerBloodGroup || currentUser?.bloodGroup || '',
        customerDistrict: customerDistrict || currentUser?.location?.district || data.district || 'খাগড়াছড়ি',
        customerThana: customerThana || currentUser?.location?.upazila || data.upazila || 'খাগড়াছড়ি সদর',
        address: `${customerThana || 'খাগড়াছড়ি সদর'}, ${customerDistrict || 'খাগড়াছড়ি'}`,
        serviceTitle: data.profession || data.jobTitle || 'সার্ভিস বুকিং',
        requirements: bookingRequirements.trim() || (isBn ? 'সার্ভিস বুকিং অনুরোধ' : 'Service Booking Request'),
        preferredDate: bookingPreferredDate || new Date().toISOString().split('T')[0],
        preferredTime: bookingPreferredTime,
        paymentMethod: bookingPaymentMethod,
        trxId: bookingTrxId.trim(),
        serviceFee: calculatedServiceFee,
        platformFee: platformBookingAdvance,
        status: 'confirmed',
        createdAt: new Date().toISOString()
      };

      try {
        const existingBookings = localStorage.getItem('jhadi_user_bookings');
        const bList = existingBookings ? JSON.parse(existingBookings) : [];
        bList.unshift(bookingPayload);
        localStorage.setItem('jhadi_user_bookings', JSON.stringify(bList));
      } catch (e) {
        console.warn('Storage booking sync error:', e);
      }

      if (onBookService) {
        try {
          onBookService(bookingPayload);
        } catch (e) {
          console.warn('onBookService error:', e);
        }
      }

      setConfirmedBookingData(bookingPayload);
      setBookingStep('confirmed');
    } catch (err: any) {
      setBookingPaymentError(err?.message || (isBn ? 'বুকিং সম্পন্ন করা যায়নি।' : 'Failed to confirm booking.'));
    } finally {
      setIsConfirmingBooking(false);
    }
  };

  // Close top menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Map & sanitize profile data
  const fullName = data.fullName || data.name || (isBn ? 'সেবা প্রোভাইডার' : 'Service Provider');
  const profilePic =
    data.serviceProviderPhotoUrl ||
    data.serviceProviderPhoto ||
    data.spPhoto ||
    (data.role === 'service_provider' || data.role === 'professional' || data.role === 'service' || !data.role
      ? (data.profilePic || data.avatar || data.photoUrl || data.image)
      : '') ||
    '';

  // Profession / Headline
  const professionHeadline =
    data.professionalHeadline ||
    data.professionBn ||
    data.profession ||
    data.job ||
    data.serviceCategory ||
    (Array.isArray(data.selectedProfessions) && data.selectedProfessions[0]) ||
    (isBn ? 'পেশাদার সেবাদাতা' : 'Professional Provider');

  // Auto-generated Unique ID (incorporating district code/first 3 letters + sequential numbers like 001, 002) - computed at top
  // displayId is already defined above

  // Blood group
  const bloodGroup = data.bloodGroup?.trim() || '';

  // Parents' information
  const fatherName = data.fatherName?.trim() || '';
  const motherName = data.motherName?.trim() || '';

  // Date of birth
  const rawDob = data.dob || data.dateOfBirth || (data.birthYear && `${data.birthYear}-${data.birthMonth || '01'}-${data.birthDay || '01'}`) || '';
  const dobFormatted = rawDob ? formatDobBengali(rawDob) : '';

  // Email Address
  const emailAddress = data.email?.trim() || '';

  // Services / Skills List
  const skillsList: string[] =
    Array.isArray(data.selectedProfessions) && data.selectedProfessions.length > 0
      ? data.selectedProfessions
      : Array.isArray(data.skills) && data.skills.length > 0
      ? data.skills
      : Array.isArray(data.skillsList) && data.skillsList.length > 0
      ? data.skillsList
      : Array.isArray(data.selectedSkillsList) && data.selectedSkillsList.length > 0
      ? data.selectedSkillsList
      : [];

  // Work Nature list (Hourly / Daily / Contractual)
  const workNatureList: string[] =
    Array.isArray(data.workNature) && data.workNature.length > 0
      ? data.workNature
      : [];

  // Experience
  const experienceText = data.experienceYears
    ? `${toBengaliNumber(data.experienceYears)} ${isBn ? 'বছরের অভিজ্ঞতা' : 'years of experience'}`
    : data.experience?.trim() || '';

  // Professional Description / Bio
  const bioSummary = data.bio?.trim() || data.summary?.trim() || data.bioText?.trim() || '';

  // Educational Qualifications
  const education = data.education?.trim() || '';

  // Certificates list
  const certificatesList: string[] =
    Array.isArray(data.certificates) && data.certificates.length > 0
      ? data.certificates.filter(Boolean)
      : Array.isArray(data.certifications) && data.certifications.length > 0
      ? data.certifications.filter(Boolean)
      : data.certFile
      ? [data.certFile]
      : [];

  // Portfolio Photos list
  const portfolioList: string[] =
    Array.isArray(data.portfolioPhotos) && data.portfolioPhotos.length > 0
      ? data.portfolioPhotos.filter(Boolean)
      : [];

  // NID / Identity Verification Check
  const hasNid = Boolean(data.isNidVerified || data.nidCardImage || data.nidFront || data.isVerified);

  // Category, District, Upazila & Google Location for formal structured layout
  const serviceCategoryDisplay = data.category || data.serviceCategory || (isBn ? 'অন-ডিমান্ড প্রফেশনাল সার্ভিস' : 'On-Demand Professional Service');
  const districtDisplay = data.district || data.districtBn || (isBn ? 'খাগড়াছড়ি' : 'Khagrachhari');
  const upazilaDisplay = data.upazila || data.upazilaBn || (isBn ? 'সদর' : 'Sadar');

  // Google Map Location resolution
  const googleMapUrl = data.googleMapsEmbedUrl || data.googleMapUrl || data.locationUrl || (data.latitude && data.longitude ? `https://maps.google.com/?q=${data.latitude},${data.longitude}` : (data.googleLocation && String(data.googleLocation).startsWith('http') ? data.googleLocation : (data.googleLocation ? `https://maps.google.com/?q=${encodeURIComponent(data.googleLocation)}` : null)));
  const googleLocationText = data.googleLocation && !String(data.googleLocation).startsWith('http') ? data.googleLocation : (data.area ? `${data.area}, ${upazilaDisplay}` : null);

  // Stats calculation: Strictly Zero-State by default if no real records
  const completedJobsCount = data.completedJobs !== undefined ? Math.max(0, Number(data.completedJobs)) : 0;
  const totalEarnings = data.totalEarnings !== undefined ? Math.max(0, Number(data.totalEarnings)) : 0;
  const currentBalance = data.currentBalance !== undefined ? Math.max(0, Number(data.currentBalance)) : 0;
  const withdrawnAmount = data.withdrawnAmount !== undefined ? Math.max(0, Number(data.withdrawnAmount)) : 0;

  const currentRating = reviewsList.length > 0
    ? (reviewsList.reduce((acc, curr) => acc + curr.rating, 0) / reviewsList.length).toFixed(1)
    : (data.rating !== undefined && Number(data.rating) > 0 ? Number(data.rating).toFixed(1) : '0.0');

  // List of completed works (for Owner Dashboard): Strictly real works or empty (No mock jobs)
  const completedWorks: Array<{
    id: string;
    title: string;
    clientName: string;
    location: string;
    date: string;
    amount: number;
    status?: string;
  }> = Array.isArray(data.completedWorksList) && data.completedWorksList.length > 0
    ? data.completedWorksList
    : Array.isArray(data.worksDone) && data.worksDone.length > 0
    ? data.worksDone
    : [];

  // Copy ID to clipboard
  const handleCopyId = () => {
    navigator.clipboard?.writeText(displayId);
    setCopiedId(true);
    setTimeout(() => setCopiedId(false), 2000);
  };

  // Submit Feedback & Review handler
  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    const activeCustomer = getAuthenticatedCustomer();
    if (!activeCustomer) {
      alert(isBn ? 'রিভিউ ও রেটিং প্রদান করতে লগইন বা সাইন-আপ আবশ্যক।' : 'Please sign in or register to submit a review.');
      return;
    }
    const reviewerName = newReviewerName.trim() || activeCustomer.fullName || activeCustomer.name || (isBn ? 'সম্মানিত গ্রাহক' : 'Valued Customer');
    if (!newReviewComment.trim()) {
      alert(isBn ? 'অনুগ্রহ করে কাজের অভিজ্ঞতা বা মন্তব্য লিখুন।' : 'Please write your feedback comment.');
      return;
    }

    const newRev: ReviewItem = {
      id: `rev-${Date.now()}`,
      userName: reviewerName,
      rating: newReviewRating,
      satisfaction: newReviewSatisfaction,
      date: isBn ? 'এইমাত্র' : 'Just now',
      comment: newReviewComment.trim(),
    };

    const updated = [newRev, ...reviewsList];
    setReviewsList(updated);
    try {
      localStorage.setItem(reviewsStorageKey, JSON.stringify(updated));
    } catch {}
    setNewReviewComment('');
    setReviewSubmittedToast(true);
    setTimeout(() => setReviewSubmittedToast(false), 3500);
  };

  const emptyPlaceholder = isBn ? 'এখনো যুক্ত করা হয়নি' : 'Not added yet';

  return (
    <div
      id="sp-profile-screen-root"
      className="w-full max-w-md mx-auto bg-[#fdfbfb] min-h-screen text-gray-900 pb-12 font-sans antialiased sm:my-2 sm:rounded-xl sm:border sm:border-gray-200 sm:shadow-xs overflow-x-hidden overflow-y-auto relative"
    >
      {/* ================= 1. NO MAIN HEADER & 2. TOP BAR UTILITIES ================= 
          Clean bold sub-header on pure white background + sleek black icons */}
      <ExecutiveTopBarUtilities
        sectionTitle={
          activeView === 'customer_registration'
            ? (isBn ? 'গ্রাহক নিবন্ধন' : 'Customer Sign Up')
            : activeView === 'booking_payment'
            ? (isBn ? 'সার্ভিস বুকিং ও পেমেন্ট' : 'Booking & Payment')
            : activeView === 'dashboard'
            ? (isBn ? 'প্রোভাইডার ড্যাশবোর্ড' : 'Provider Dashboard')
            : (isBn ? 'সেবা দানকারী প্রোফাইল' : 'Service Provider Profile')
        }
        sectionSubtitle={displayId}
        lang={currentLang}
        onLanguageToggle={() => setCurrentLang(prev => (prev === 'bn' ? 'en' : 'bn'))}
        onBack={
          activeView === 'dashboard' || activeView === 'customer_registration' || activeView === 'booking_payment'
            ? () => setActiveView('cv')
            : (onBack || onClose)
        }
        currentUser={currentUser}
        profileData={data}
        onNavigateDashboard={() => {
          if (activeView === 'dashboard') {
            setActiveView('cv');
          } else {
            setActiveView('dashboard');
            if (onNavigateDashboard) onNavigateDashboard();
          }
        }}
        onNavigateDetails={() => {
          setActiveView('cv');
        }}
        onEditProfile={(d) => {
          if (onEditProfile) onEditProfile(d || data);
          else setActiveView('dashboard');
        }}
        onSignOut={async () => {
          if (onSignOut) {
            onSignOut();
          } else if (authContext?.logout) {
            await authContext.logout();
          } else {
            try {
              sessionStorage.removeItem('jm_authenticated_user');
              sessionStorage.removeItem('jm_current_customer');
              sessionStorage.removeItem('jhadimadi_customer_auth');
              localStorage.removeItem('jm_authenticated_user');
              localStorage.removeItem('jm_current_customer');
              localStorage.removeItem('jhadimadi_customer_auth');
            } catch {}
            window.location.reload();
          }
        }}
        onDeleteAccount={handleOpenDeleteModal}
        activeView={activeView}
        isOwner={isProfileOwner}
      />

      {/* =========================================================================
          VIEW: IN-APP BODY CUSTOMER REGISTRATION & SERVICE BOOKING FORM
         ========================================================================= */}
      {activeView === 'customer_registration' ? (
        <div id="sp-customer-registration-view" className="p-4 sm:p-6 max-w-xl mx-auto space-y-5 animate-fadeIn">
          {/* Provider Reference Header Card */}
          <div className="p-3.5 bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-50 rounded-2xl border border-emerald-200/80 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              {profilePic ? (
                <img
                  src={profilePic}
                  alt={fullName}
                  className="w-12 h-12 rounded-xl object-cover border border-emerald-300 shrink-0 shadow-2xs"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-emerald-200 text-emerald-900 font-bold text-base flex items-center justify-center shrink-0 shadow-2xs">
                  {fullName.charAt(0)}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-md">
                    {isBn ? 'নির্বাচিত সেবাদাতা' : 'Selected Provider'}
                  </span>
                  <span className="text-[10px] font-mono text-gray-500">ID: {displayId}</span>
                </div>
                <h2 className="text-sm font-bold text-gray-900 truncate mt-0.5">{fullName}</h2>
                <p className="text-xs text-emerald-800 font-medium truncate">
                  {data.profession || data.jobTitle || 'সার্ভিস প্রোভাইডার'}
                </p>
                <p className="text-[11px] text-gray-500 flex items-center gap-1 mt-0.5">
                  <MapPin className="w-3 h-3 text-emerald-600 shrink-0" />
                  <span>{data.district || 'খাগড়াছড়ি'}, {data.upazila || 'সদর'}</span>
                </p>
              </div>
            </div>

            <div className="shrink-0 flex flex-col items-end gap-1">
              <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100/80 px-2 py-1 rounded-lg border border-emerald-200">
                {isBn ? 'বুকিং শেষে কল সুবিধা' : 'Call after Booking'}
              </span>
              <span className="text-[9px] text-gray-500 font-medium">
                {isBn ? 'নম্বর গোপন ও সুরক্ষিত' : 'Number Hidden & Safe'}
              </span>
            </div>
          </div>

          {/* Success State View */}
          {customerRegistrationStatus === 'success' ? (
            <div className="p-5 sm:p-6 bg-white rounded-2xl border border-emerald-200 shadow-sm space-y-4 text-center animate-in fade-in">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900">
                  {isBn ? 'সার্ভিস বুকিং ও রেজিস্ট্রেশন সফল হয়েছে!' : 'Booking & Registration Successful!'}
                </h3>
                <p className="text-xs text-gray-600">
                  {isBn
                    ? 'আপনার গ্রাহক একাউন্ট ও সার্ভিস বুকিং অনুরোধ সফলভাবে গ্রহণ করা হয়েছে।'
                    : 'Your customer account and booking request have been confirmed.'}
                </p>
              </div>

              <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 text-left text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                  <span className="text-gray-600 font-medium">{isBn ? 'বুকিং রেফারেন্স আইডি:' : 'Booking ID:'}</span>
                  <span className="font-mono font-bold text-emerald-800">
                    #JM-BK-{Math.floor(10000 + Math.random() * 90000)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                  <span className="text-gray-600 font-medium">{isBn ? 'গ্রাহকের নাম:' : 'Customer Name:'}</span>
                  <span className="font-bold text-gray-900">{customerFullName}</span>
                </div>
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                  <span className="text-gray-600 font-medium">{isBn ? 'গ্রাহকের ফোন নম্বর:' : 'Customer Phone:'}</span>
                  <span className="font-mono font-bold text-gray-900">{customerPhone}</span>
                </div>
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                  <span className="text-gray-600 font-medium">{isBn ? 'রক্তের গ্রুপ:' : 'Blood Group:'}</span>
                  <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200 flex items-center gap-1">
                    <Droplet className="w-3 h-3 fill-rose-600" />
                    <span>{customerBloodGroup}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">{isBn ? 'এলাকা / ঠিকানা:' : 'Location:'}</span>
                  <span className="font-medium text-gray-800">{customerThana}, {customerDistrict}</span>
                </div>
              </div>

              <div className="p-3 bg-rose-50/70 rounded-xl border border-rose-200 text-xs text-left flex items-start gap-2.5">
                <Droplet className="w-4 h-4 fill-rose-600 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-rose-900">
                    {isBn ? 'জরুরি রক্তদাতা তালিকায় অন্তর্ভুক্ত' : 'Added to Blood Donor Network'}
                  </p>
                  <p className="text-[11px] text-rose-700 leading-relaxed mt-0.5">
                    {isBn
                      ? 'আপনার রক্তের গ্রুপ (' + customerBloodGroup + ') ঝাডিমাটি জরুরি রক্তদাতা নেটওয়ার্কে সংরক্ষিত হয়েছে। আপনার এলাকার যে কেউ জরুরি রক্তের প্রয়োজনে আপনার সাথে যোগাযোগ করতে পারবেন।'
                      : 'Your blood group (' + customerBloodGroup + ') has been added to the regional donor directory.'}
                  </p>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveView('cv')}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>{isBn ? 'সেবাদাতার জীবনবৃত্তান্তে ফিরে যান' : 'Back to Provider Profile'}</span>
                </button>
              </div>
            </div>
          ) : (
            /* Main Registration / Sign-In Form */
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white px-5 py-3.5">
                <h3 className="text-sm font-bold tracking-tight">
                  {customerAuthMode === 'signin'
                    ? (isBn ? 'গ্রাহক অ্যাকাউন্ট লগইন ও বুকিং' : 'Customer Account Login & Booking')
                    : (isBn ? 'সার্ভিস বুকিং ও নতুন গ্রাহক নিবন্ধন ফরম' : 'Customer Registration & Booking Form')}
                </h3>
                <p className="text-[11px] text-emerald-100 mt-0.5">
                  {customerAuthMode === 'signin'
                    ? (isBn ? 'আপনার মোবাইল নম্বর বা ইমেইল এবং পাসওয়ার্ড দিয়ে লগইন করে সরাসরি বুকিং করুন' : 'Sign in to access your account and complete booking')
                    : (isBn ? 'তথ্যগুলো পূরণ করে একাউন্ট তৈরি করুন এবং সরাসরি সার্ভিস বুকিং নিশ্চিত করুন' : 'Fill in your details to create an account and complete service booking')}
                </p>
              </div>

              {/* Mode Switcher: Sign Up vs Sign In */}
              <div className="flex border-b border-emerald-100 bg-emerald-50/50 p-1.5 gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    setCustomerAuthMode('signup');
                    setCustomerFormError('');
                    setCustomerSignInError('');
                  }}
                  className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    customerAuthMode === 'signup'
                      ? 'bg-white text-emerald-800 shadow-xs border border-emerald-200'
                      : 'text-gray-600 hover:text-emerald-800 hover:bg-white/60'
                  }`}
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{isBn ? 'নতুন গ্রাহক নিবন্ধন' : 'New Sign-Up'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCustomerAuthMode('signin');
                    setCustomerFormError('');
                    setCustomerSignInError('');
                  }}
                  className={`flex-1 py-2 px-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    customerAuthMode === 'signin'
                      ? 'bg-white text-emerald-800 shadow-xs border border-emerald-200'
                      : 'text-gray-600 hover:text-emerald-800 hover:bg-white/60'
                  }`}
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>{isBn ? 'আগের একাউন্টে লগইন' : 'Sign In Existing'}</span>
                </button>
              </div>

              {customerAuthMode === 'signin' ? (
                /* Returning Customer Sign In Form */
                <form onSubmit={handleCustomerSignInSubmit} className="p-4 sm:p-5 space-y-4">
                  {customerSignInError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>{customerSignInError}</span>
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {isBn ? 'মোবাইল নম্বর বা ইমেইল' : 'Mobile Number or Email'} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        required
                        value={customerSignInIdentifier}
                        onChange={(e) => setCustomerSignInIdentifier(e.target.value)}
                        placeholder={isBn ? 'যেমন: 018XXXXXXXX' : 'e.g. 018XXXXXXXX'}
                        className="w-full text-xs py-2.5 pl-9 pr-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                      />
                      <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {isBn ? 'পাসওয়ার্ড' : 'Password'} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showCustomerSignInPassword ? 'text' : 'password'}
                        required
                        value={customerSignInPassword}
                        onChange={(e) => setCustomerSignInPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs py-2.5 pl-9 pr-8 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                      />
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <button
                        type="button"
                        onClick={() => setShowCustomerSignInPassword(!showCustomerSignInPassword)}
                        className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                      >
                        {showCustomerSignInPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  <div className="pt-2 space-y-2">
                    <button
                      type="submit"
                      disabled={isCustomerSigningIn}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50 active:scale-[0.99]"
                    >
                      {isCustomerSigningIn ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{isBn ? 'লগইন করা হচ্ছে...' : 'Signing In...'}</span>
                        </>
                      ) : (
                        <>
                          <LogIn className="w-4 h-4" />
                          <span>{isBn ? 'লগইন করুন ও সরাসরি বুকিংয়ে যান' : 'Sign In & Continue to Booking'}</span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={() => setCustomerAuthMode('signup')}
                      className="w-full py-2.5 px-3 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition cursor-pointer"
                    >
                      {isBn ? 'নতুন গ্রাহক? এখানে ক্লিক করে নিবন্ধন করুন' : 'New customer? Create an account'}
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveView('cv')}
                      className="w-full py-2.5 px-3 rounded-xl border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold transition cursor-pointer"
                    >
                      {isBn ? 'বাতিল করুন ও ফিরে যান' : 'Cancel & Go Back'}
                    </button>
                  </div>
                </form>
              ) : (
              <form onSubmit={handleCustomerRegistrationSubmit} className="p-4 sm:p-5 space-y-4">
                {/* Error Banner */}
                {customerFormError && (
                  <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-700 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                    <span>{customerFormError}</span>
                  </div>
                )}

                {/* 1. Full Name */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {isBn ? '১. নিজের নাম' : '1. Full Name'} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={customerFullName}
                      onChange={(e) => setCustomerFullName(e.target.value)}
                      placeholder={isBn ? 'আপনার পুরো নাম লিখুন (যেমন: মোহাম্মদ আরমান)' : 'Enter your full name'}
                      className="w-full text-xs py-2.5 pl-9 pr-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                    <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  </div>
                </div>

                {/* 2. Phone Number */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {isBn ? '২. ফোন নাম্বার' : '2. Phone Number'} <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      required
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder={isBn ? 'যেমন: 018XXXXXXXX' : 'e.g. 018XXXXXXXX'}
                      className="w-full text-xs py-2.5 pl-9 pr-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                    />
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 block">
                    {isBn ? '১১ ডিজিটের মোবাইল নম্বর প্রদান করুন (লগইন ও যোগাযোগের জন্য ব্যবহৃত হবে)' : 'Valid 11-digit mobile number'}
                  </span>
                </div>

                {/* 3 & 4. Two Passwords */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {isBn ? '৩. পাসওয়ার্ড' : '3. Password'} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showCustomerPassword ? 'text' : 'password'}
                        required
                        value={customerPassword}
                        onChange={(e) => setCustomerPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs py-2.5 pl-9 pr-8 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                      />
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <button
                        type="button"
                        onClick={() => setShowCustomerPassword(!showCustomerPassword)}
                        className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                        aria-label="Toggle password visibility"
                      >
                        {showCustomerPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <span className="text-[10px] text-gray-400 mt-0.5 block">
                      {isBn ? 'কমপক্ষে ৬ অক্ষর' : 'Min 6 characters'}
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {isBn ? '৪. পুনরায় পাসওয়ার্ড লিখুন' : '4. Confirm Password'} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type={showCustomerConfirmPassword ? 'text' : 'password'}
                        required
                        value={customerConfirmPassword}
                        onChange={(e) => setCustomerConfirmPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full text-xs py-2.5 pl-9 pr-8 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono"
                      />
                      <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                      <button
                        type="button"
                        onClick={() => setShowCustomerConfirmPassword(!showCustomerConfirmPassword)}
                        className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600 p-1 cursor-pointer"
                        aria-label="Toggle confirm password visibility"
                      >
                        {showCustomerConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <span className="text-[10px] text-gray-400 mt-0.5 block">
                      {isBn ? 'উভয় পাসওয়ার্ড একই হতে হবে' : 'Must match password'}
                    </span>
                  </div>
                </div>

                {/* 5. Blood Group with Emergency Notice */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-gray-700 flex items-center gap-1">
                      <Droplet className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
                      <span>{isBn ? '৫. রক্তের গ্রুপ' : '5. Blood Group'}</span>
                      <span className="text-rose-500">*</span>
                    </label>
                    {customerBloodGroup && (
                      <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        {customerBloodGroup}
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                    {(['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] as const).map((bg) => (
                      <button
                        key={bg}
                        type="button"
                        onClick={() => setCustomerBloodGroup(bg)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition text-center cursor-pointer border ${
                          customerBloodGroup === bg
                            ? 'bg-rose-600 text-white border-rose-600 ring-2 ring-rose-300 shadow-xs'
                            : 'bg-gray-50 hover:bg-rose-50/60 text-gray-700 border-gray-200'
                        }`}
                      >
                        {bg}
                      </button>
                    ))}
                  </div>

                  <div className="mt-2 p-2.5 bg-rose-50/70 rounded-xl border border-rose-100 flex items-start gap-2 text-[11px] text-rose-800">
                    <Droplet className="w-3.5 h-3.5 fill-rose-600 text-rose-600 shrink-0 mt-0.5" />
                    <span>
                      {isBn
                        ? 'আপনার রক্তের গ্রুপ প্রদান করলে আপনি এলাকার জরুরি রক্তদাতা হিসেবে নিবন্ধিত থাকবেন, যা মুমূর্ষু রোগীর জীবন বাঁচাতে সাহায্য করবে।'
                        : 'Your blood group connects you to the local emergency blood donor directory to save lives in crisis.'}
                    </span>
                  </div>
                </div>

                {/* 6 & 7. District and Thana Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {isBn ? '৬. জেলা' : '6. District'} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={customerDistrict}
                        onChange={(e) => handleDistrictChange(e.target.value)}
                        className="w-full text-xs py-2.5 pl-9 pr-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                      >
                        {districtList.map((d) => (
                          <option key={d.nameBn} value={d.nameBn}>
                            {d.nameBn} ({d.nameEn})
                          </option>
                        ))}
                      </select>
                      <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {isBn ? '৭. থানা / উপজেলা' : '7. Thana / Upazila'} <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <select
                        value={customerThana}
                        onChange={(e) => setCustomerThana(e.target.value)}
                        className="w-full text-xs py-2.5 pl-9 pr-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                      >
                        {availableThanas.map((thana) => (
                          <option key={thana} value={thana}>
                            {thana}
                          </option>
                        ))}
                      </select>
                      <MapPin className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
                    </div>
                  </div>
                </div>

                {/* Submit & Cancel Buttons */}
                <div className="pt-3 space-y-2">
                  <button
                    type="submit"
                    disabled={isSubmittingCustomerForm}
                    className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50 active:scale-[0.99]"
                  >
                    {isSubmittingCustomerForm ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>{isBn ? 'নিবন্ধন ও বুকিং সম্পন্ন করা হচ্ছে...' : 'Registering & Booking...'}</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        <span>{isBn ? 'নিবন্ধন করুন ও সার্ভিস বুকিং সম্পন্ন করুন' : 'Register & Complete Booking'}</span>
                      </>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setCustomerAuthMode('signin')}
                    className="w-full py-2.5 px-3 rounded-xl border border-emerald-200 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition cursor-pointer"
                  >
                    {isBn ? 'ইতিমধ্যে অ্যাকাউন্ট আছে? সরাসরি লগইন করুন' : 'Already have an account? Sign In'}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveView('cv')}
                    className="w-full py-2.5 px-3 rounded-xl border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold transition cursor-pointer"
                  >
                    {isBn ? 'বাতিল করুন ও ফিরে যান' : 'Cancel & Go Back'}
                  </button>
                </div>
              </form>
              )}
            </div>
          )}
        </div>
      ) : activeView === 'booking_payment' ? (
        <div id="sp-booking-payment-view" className="p-4 sm:p-6 max-w-xl mx-auto space-y-5 animate-fadeIn">
          {bookingStep === 'confirmed' ? (
            /* Confirmed Booking Screen */
            <div className="p-5 sm:p-6 bg-white rounded-2xl border border-emerald-200 shadow-sm space-y-4 text-center animate-in fade-in">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>

              <div className="space-y-1">
                <h3 className="text-base font-bold text-gray-900">
                  {isBn ? 'সার্ভিস বুকিং ও পেমেন্ট সফল হয়েছে!' : 'Service Booking & Payment Successful!'}
                </h3>
                <p className="text-xs text-gray-600">
                  {isBn
                    ? 'আপনার বুকিং সফলভাবে গ্রহণ করা হয়েছে। সেবাদাতা দ্রুত আপনার সাথে যোগাযোগ করবেন।'
                    : 'Your booking has been received. The provider will contact you shortly.'}
                </p>
              </div>

              {/* Booking Reference Card */}
              <div className="p-3.5 bg-emerald-50/70 rounded-xl border border-emerald-200 text-left text-xs space-y-2">
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                  <span className="text-gray-600 font-medium">{isBn ? 'বুকিং রেফারেন্স আইডি:' : 'Booking ID:'}</span>
                  <span className="font-mono font-bold text-emerald-800">
                    {confirmedBookingData?.orderId || '#JM-BK-' + Math.floor(10000 + Math.random() * 90000)}
                  </span>
                </div>
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                  <span className="text-gray-600 font-medium">{isBn ? 'সেবাদাতার নাম:' : 'Provider Name:'}</span>
                  <span className="font-bold text-gray-900">{fullName}</span>
                </div>
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                  <span className="text-gray-600 font-medium">{isBn ? 'যোগাযোগ মাধ্যম:' : 'Provider Contact:'}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-emerald-800 font-bold text-[11px] bg-emerald-100/70 px-2 py-0.5 rounded">
                      {isBn ? 'প্রাইভেসী কল (নম্বর সুরক্ষিত)' : 'Privacy Direct Call'}
                    </span>
                    <a
                      href={`tel:${data.phone || '01878123456'}`}
                      className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[10px] font-bold inline-flex items-center gap-1 shadow-2xs"
                    >
                      <PhoneCall className="w-2.5 h-2.5" />
                      <span>{isBn ? 'কল' : 'Call'}</span>
                    </a>
                  </div>
                </div>
                <div className="flex items-center justify-between border-b border-emerald-200/60 pb-2">
                  <span className="text-gray-600 font-medium">{isBn ? 'পেমেন্ট মাধ্যম:' : 'Payment Method:'}</span>
                  <span className="font-bold uppercase text-gray-800">
                    {confirmedBookingData?.paymentMethod || bookingPaymentMethod}
                    {confirmedBookingData?.trxId ? ` (TrxID: ${confirmedBookingData.trxId})` : ''}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600 font-medium">{isBn ? 'তারিখ ও সময়:' : 'Date & Time:'}</span>
                  <span className="font-medium text-gray-800">
                    {confirmedBookingData?.preferredDate} ({confirmedBookingData?.preferredTime})
                  </span>
                </div>
              </div>

              {/* Direct Provider Action Shortcuts */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <a
                  href={`tel:${data.phone || '01878-123456'}`}
                  className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <PhoneCall className="w-4 h-4" />
                  <span>{isBn ? 'সরাসরি কল করুন' : 'Call Provider'}</span>
                </a>
                <a
                  href={`https://wa.me/88${(data.phone || '01878123456').replace(/\D/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <MessageSquare className="w-4 h-4 text-emerald-600" />
                  <span>{isBn ? 'হোয়াটসঅ্যাপ' : 'WhatsApp'}</span>
                </a>
              </div>

              {/* Direct Star Rating & Customer Review Card on Confirmed Booking Screen */}
              <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 text-left space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                    <span>{isBn ? 'সেবাদাতাকে স্টার রেটিং ও রিভিউ দিন' : 'Rate & Review Service Provider'}</span>
                  </h4>
                  <span className="text-[10px] text-emerald-800 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full">
                    {isBn ? 'ঐচ্ছিক' : 'Optional'}
                  </span>
                </div>
                <p className="text-[11px] text-gray-600">
                  {isBn
                    ? 'আপনার অভিজ্ঞতা কেমন ছিল? নিচে স্টার রেটিং এবং মতামত প্রদান করুন।'
                    : 'How was your experience? Leave a star rating and review below.'}
                </p>

                <form onSubmit={handleAddReview} className="space-y-2.5">
                  {/* 5-Star Selection */}
                  <div className="flex items-center gap-1.5">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setNewReviewRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(null)}
                        className="p-1 text-amber-400 transition hover:scale-110 cursor-pointer"
                      >
                        <Star
                          className={`w-6 h-6 ${
                            (hoverRating !== null ? star <= hoverRating : star <= newReviewRating)
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-300'
                          }`}
                        />
                      </button>
                    ))}
                    <span className="text-xs font-bold text-gray-700 ml-1">
                      {(hoverRating !== null ? hoverRating : newReviewRating)} / 5
                    </span>
                  </div>

                  <textarea
                    rows={2}
                    value={newReviewComment}
                    onChange={(e) => setNewReviewComment(e.target.value)}
                    placeholder={isBn ? 'কাজের অভিজ্ঞতা বা মতামত লিখুন...' : 'Write your review or feedback...'}
                    className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                  />

                  <button
                    type="submit"
                    className="w-full py-2 px-3 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Star className="w-3.5 h-3.5 fill-current" />
                    <span>{isBn ? 'রেটিং ও রিভিউ জমা দিন' : 'Submit Rating & Review'}</span>
                  </button>

                  {reviewSubmittedToast && (
                    <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg text-xs font-medium text-center animate-in fade-in">
                      {isBn ? '✓ আপনার রেটিং ও রিভিউ সফলভাবে যুক্ত হয়েছে!' : '✓ Review submitted successfully!'}
                    </div>
                  )}
                </form>
              </div>

              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setActiveView('cv')}
                  className="w-full py-2.5 px-4 rounded-xl border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold transition cursor-pointer"
                >
                  {isBn ? 'প্রোফাইলে ফিরে যান' : 'Back to Profile'}
                </button>
              </div>
            </div>
          ) : (
            /* Main Provider Contact Details & Payment Options Page */
            <div className="space-y-4">
              {/* 1. Service Provider Full Contact Details Card */}
              <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm overflow-hidden">
                <div className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      {profilePic ? (
                        <img
                          src={profilePic}
                          alt={fullName}
                          className="w-14 h-14 rounded-xl object-cover border-2 border-white/80 shrink-0 shadow-sm"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-14 h-14 rounded-xl bg-emerald-800 text-white font-bold text-lg flex items-center justify-center shrink-0 border border-white/30">
                          {fullName.charAt(0)}
                        </div>
                      )}
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] bg-emerald-800/70 border border-emerald-400/40 text-emerald-100 font-semibold px-2 py-0.5 rounded">
                            ID: {displayId}
                          </span>
                          {data.verified && (
                            <span className="text-[10px] bg-emerald-500/30 text-white font-semibold px-1.5 py-0.5 rounded flex items-center gap-1">
                              <ShieldCheck className="w-3 h-3 text-emerald-200" />
                              <span>{isBn ? 'যাচাইকৃত' : 'Verified'}</span>
                            </span>
                          )}
                        </div>
                        <h2 className="text-base font-bold text-white truncate mt-0.5">{fullName}</h2>
                        <p className="text-xs text-emerald-100 truncate">
                          {data.profession || data.jobTitle || 'সার্ভিস প্রোভাইডার'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contact Info & Action Buttons */}
                <div className="p-4 bg-emerald-50/50 border-b border-emerald-100 space-y-3">
                  <div className="flex items-center justify-between flex-wrap gap-2 text-xs">
                    <div className="flex items-center gap-1.5 text-gray-700 font-medium">
                      <PhoneCall className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>{isBn ? 'নিরাপদ যোগাযোগ:' : 'Direct Contact:'}</span>
                      <span className="font-bold text-emerald-800 text-xs bg-emerald-100/80 px-2 py-0.5 rounded-full">
                        {isBn ? 'প্রাইভেসী সুরক্ষিত (নম্বর গোপন)' : 'Privacy Protected (Masked)'}
                      </span>
                    </div>

                    <div className="flex items-center gap-1 text-gray-600 text-xs">
                      <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{data.district || 'খাগড়াছড়ি'}, {data.upazila || 'সদর'}</span>
                    </div>
                  </div>

                  {/* Direct Contact Buttons */}
                  <div className="grid grid-cols-2 gap-2.5">
                    <a
                      href={`tel:${data.phone || '01878123456'}`}
                      className="py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-xs cursor-pointer active:scale-95"
                    >
                      <PhoneCall className="w-4 h-4" />
                      <span>{isBn ? 'সরাসরি কল করুন' : 'Call Now'}</span>
                    </a>
                    <a
                      href={`https://wa.me/88${(data.phone || '01878123456').replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-white hover:bg-emerald-50 text-emerald-800 border border-emerald-300 text-xs font-bold transition flex items-center justify-center gap-2 shadow-2xs"
                    >
                      <MessageSquare className="w-4 h-4 text-emerald-600" />
                      <span>{isBn ? 'হোয়াটসঅ্যাপ চ্যাট' : 'WhatsApp'}</span>
                    </a>
                  </div>
                </div>
              </div>

              {/* Dual Sub-Tabs: Service Booking & Payment vs Star Rating & Customer Reviews */}
              <div className="flex bg-white rounded-2xl border border-emerald-200 p-1.5 gap-1.5 shadow-2xs">
                <button
                  type="button"
                  onClick={() => setActiveBookingSubTab('booking')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeBookingSubTab === 'booking'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-gray-600 hover:text-emerald-800 hover:bg-emerald-50'
                  }`}
                >
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{isBn ? 'সার্ভিস বুকিং ও পেমেন্ট' : 'Service Booking & Payment'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveBookingSubTab('review')}
                  className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                    activeBookingSubTab === 'review'
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'text-gray-600 hover:text-emerald-800 hover:bg-emerald-50'
                  }`}
                >
                  <Star className={`w-3.5 h-3.5 ${activeBookingSubTab === 'review' ? 'fill-amber-300 text-amber-300' : 'text-amber-500 fill-amber-500'}`} />
                  <span>{isBn ? 'স্টার রেটিং ও রিভিউ' : 'Star Rating & Review'}</span>
                  <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                    activeBookingSubTab === 'review' ? 'bg-emerald-800 text-emerald-100' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {reviewsList.length}
                  </span>
                </button>
              </div>

              {activeBookingSubTab === 'booking' ? (
                /* 2. Service Booking Schedule & Details */
                <form onSubmit={handleConfirmBookingAndPayment} className="space-y-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-3">
                  <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 uppercase tracking-wider">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{isBn ? 'সার্ভিস সময় ও চাহিদা' : 'Service Schedule & Details'}</span>
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        {isBn ? 'পছন্দের তারিখ' : 'Preferred Date'}
                      </label>
                      <input
                        type="date"
                        required
                        value={bookingPreferredDate}
                        onChange={(e) => setBookingPreferredDate(e.target.value)}
                        className="w-full text-xs py-2 px-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-gray-700 mb-1">
                        {isBn ? 'পছন্দের সময়' : 'Time Slot'}
                      </label>
                      <select
                        value={bookingPreferredTime}
                        onChange={(e) => setBookingPreferredTime(e.target.value)}
                        className="w-full text-xs py-2 px-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
                      >
                        <option value="সকাল ৯:০০ - দুপুর ১২:০০">সকাল ৯:০০ - দুপুর ১২:০০</option>
                        <option value="দুপুর ১২:০০ - বিকাল ৩:০০">দুপুর ১২:০০ - বিকাল ৩:০০</option>
                        <option value="বিকাল ৩:০০ - সন্ধ্যা ৬:০০">বিকাল ৩:০০ - সন্ধ্যা ৬:০০</option>
                        <option value="সন্ধ্যা ৬:০০ - রাত ৯:০০">সন্ধ্যা ৬:০০ - রাত ৯:০০</option>
                        <option value="যেকোনো সময় (জরুরি)">যেকোনো সময় (জরুরি)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      {isBn ? 'কাজের বিবরণ (ঐচ্ছিক)' : 'Service Notes (Optional)'}
                    </label>
                    <textarea
                      rows={2}
                      value={bookingRequirements}
                      onChange={(e) => setBookingRequirements(e.target.value)}
                      placeholder={isBn ? 'যেমন: বাসায় ফ্যানের সুইচ ও লাইনের কাজ করতে হবে...' : 'Brief description of required work...'}
                      className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* 3. Payment Options Card */}
                <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 uppercase tracking-wider">
                      <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{isBn ? 'পেমেন্ট অপশন (Payment Options)' : 'Payment Options'}</span>
                    </h3>
                    <span className="text-[10px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded border border-emerald-200">
                      {isBn ? 'নিরাপদ পেমেন্ট' : 'Secure Payment'}
                    </span>
                  </div>

                  {/* Fee Summary */}
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-1.5">
                    <div className="flex items-center justify-between text-gray-600">
                      <span>{isBn ? 'আনুমানিক সার্ভিস চার্জ:' : 'Estimated Service Charge:'}</span>
                      <span className="font-bold text-gray-900">৳{calculatedServiceFee}</span>
                    </div>
                    <div className="flex items-center justify-between text-emerald-700 font-medium">
                      <span>{isBn ? 'প্ল্যাটফর্ম বুকিং অগ্রিম ফি:' : 'Platform Booking Advance:'}</span>
                      <span className="font-bold">৳{platformBookingAdvance}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-500 border-t border-gray-200 pt-1.5">
                      <span>{isBn ? 'কাজ সম্পন্ন করার পর সেবাদাতাকে প্রদেয়:' : 'Due to provider after work:'}</span>
                      <span className="font-medium">৳{providerRemainingFee}</span>
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1.5">
                      {isBn ? 'পেমেন্ট মাধ্যম বেছে নিন:' : 'Select Payment Method:'}
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <button
                        type="button"
                        onClick={() => setBookingPaymentMethod('bkash')}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          bookingPaymentMethod === 'bkash'
                            ? 'bg-pink-50 border-[#E2136E] text-[#E2136E] ring-2 ring-pink-200 shadow-xs'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-sm font-extrabold text-[#E2136E]">bKash</span>
                        <span className="text-[10px] font-medium">বিকাশ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBookingPaymentMethod('nagad')}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          bookingPaymentMethod === 'nagad'
                            ? 'bg-orange-50 border-[#F7941D] text-[#F7941D] ring-2 ring-orange-200 shadow-xs'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-sm font-extrabold text-[#F7941D]">Nagad</span>
                        <span className="text-[10px] font-medium">নগদ</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBookingPaymentMethod('rocket')}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          bookingPaymentMethod === 'rocket'
                            ? 'bg-purple-50 border-[#8C3494] text-[#8C3494] ring-2 ring-purple-200 shadow-xs'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <span className="text-sm font-extrabold text-[#8C3494]">Rocket</span>
                        <span className="text-[10px] font-medium">রকেট</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setBookingPaymentMethod('cash')}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition flex flex-col items-center justify-center gap-1 cursor-pointer ${
                          bookingPaymentMethod === 'cash'
                            ? 'bg-teal-50 border-teal-600 text-teal-800 ring-2 ring-teal-200 shadow-xs'
                            : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        <DollarSign className="w-4 h-4 text-teal-600" />
                        <span className="text-[10px] font-bold">ক্যাশ অন সার্ভিস</span>
                      </button>
                    </div>
                  </div>

                  {/* Payment Gateway Guide */}
                  {bookingPaymentMethod !== 'cash' ? (
                    <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600 font-medium">
                          {isBn ? 'পেমেন্ট নম্বর (' + bookingPaymentMethod.toUpperCase() + '):' : 'Payment Number:'}
                        </span>
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-bold text-gray-900 text-sm">01878-987654</span>
                          <button
                            type="button"
                            onClick={handleCopyMerchantNumber}
                            className="p-1 rounded bg-white hover:bg-gray-100 border border-gray-300 text-gray-600 text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                            title="Copy number"
                          >
                            {copiedMerchantNumber ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedMerchantNumber ? 'কপি হয়েছে' : 'কপি'}</span>
                          </button>
                        </div>
                      </div>

                      <p className="text-[11px] text-gray-500 leading-relaxed">
                        {isBn
                          ? `উপরের নম্বরে ৳${platformBookingAdvance} সেন্ড মানি বা পেমেন্ট সম্পন্ন করুন এবং প্রাপ্ত Transaction ID নিচে লিখুন:`
                          : `Send ৳${platformBookingAdvance} to the number above and enter your TrxID below:`}
                      </p>

                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          {isBn ? 'TrxID (ট্রানজেকশন আইডি)' : 'Transaction ID (TrxID)'} <span className="text-rose-500">*</span>
                        </label>
                        <input
                          type="text"
                          required
                          value={bookingTrxId}
                          onChange={(e) => setBookingTrxId(e.target.value)}
                          placeholder="e.g. 9J54KD89"
                          className="w-full text-xs py-2 px-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none font-mono uppercase tracking-wider"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 bg-teal-50 rounded-xl border border-teal-200 text-xs text-teal-800 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold">{isBn ? 'ক্যাশ অন সার্ভিস নির্বাচিত' : 'Cash on Service Selected'}</p>
                        <p className="text-[11px] text-teal-700 leading-relaxed mt-0.5">
                          {isBn
                            ? 'সার্ভিস প্রদানকারী আপনার ঠিকানায় উপস্থিত হয়ে কাজ সম্পন্ন করার পর সরাসরি নগদ অর্থে সম্পূর্ণ ফি পরিশোধ করবেন।'
                            : 'You will pay the full amount directly to the service provider after the job is completed.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Error Notification */}
                  {bookingPaymentError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-700 animate-in fade-in">
                      <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                      <span>{bookingPaymentError}</span>
                    </div>
                  )}

                  {/* Submit Button */}
                  <div className="pt-2 space-y-2">
                    <button
                      type="submit"
                      disabled={isConfirmingBooking}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md cursor-pointer disabled:opacity-50 active:scale-[0.99]"
                    >
                      {isConfirmingBooking ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>{isBn ? 'বুকিং ও পেমেন্ট যাচাই করা হচ্ছে...' : 'Verifying & Confirming...'}</span>
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          <span>{isBn ? 'পেমেন্ট সম্পন্ন করুন ও বুকিং নিশ্চিত করুন' : 'Complete Payment & Confirm Booking'}</span>
                        </>
                      )}
                    </button>

                    {/* Quick Link to Reviews from Booking Form */}
                    <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 text-gray-700">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400 shrink-0" />
                        <span className="font-medium">
                          {isBn ? 'সেবাদাতাকে কাজের রেটিং ও রিভিউ দিতে চান?' : 'Want to leave star rating & review for provider?'}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => setActiveBookingSubTab('review')}
                        className="text-emerald-700 hover:text-emerald-800 font-bold text-xs underline shrink-0 cursor-pointer flex items-center gap-0.5"
                      >
                        <span>{isBn ? 'রেটিং ও রিভিউ দিন' : 'Rate & Review'}</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setActiveView('cv')}
                      className="w-full py-2.5 px-3 rounded-xl border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold transition cursor-pointer"
                    >
                      {isBn ? 'বাতিল করুন ও ফিরে যান' : 'Cancel & Go Back'}
                    </button>
                  </div>
                </div>
              </form>
              ) : (
                /* Star Rating & Customer Review Interface */
                <div className="space-y-4 animate-in fade-in">
                  {/* Rating Summary Card */}
                  <div className="bg-white rounded-2xl border border-emerald-200 p-4 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider block">
                          {isBn ? 'গড় গ্রাহক রেটিং' : 'Average Customer Rating'}
                        </span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-3xl font-black text-gray-900">{currentRating}</span>
                          <div>
                            <div className="flex items-center gap-0.5">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-4 h-4 ${
                                    star <= Math.round(Number(currentRating) || 0)
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-gray-200'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-[11px] text-gray-500 block mt-0.5">
                              {reviewsList.length > 0
                                ? `${reviewsList.length} ${isBn ? 'টি মতামত পর্যালোচনা' : 'reviews'}`
                                : (isBn ? 'নতুন তালিকাভুক্ত সেবাদাতা' : 'Newly listed provider')}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 inline-block">
                          {data.verified ? (isBn ? 'যাচাইকৃত সেবাদাতা' : 'Verified Provider') : (isBn ? 'সক্রিয় সেবাদাতা' : 'Active Provider')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Rating & Review Form */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-4 sm:p-5 shadow-xs space-y-3.5">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2.5">
                      <h3 className="text-xs font-bold text-gray-900 flex items-center gap-1.5 uppercase tracking-wider">
                        <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                        <span>{isBn ? 'সেবাদাতাকে স্টার রেটিং ও রিভিউ প্রদান করুন' : 'Rate & Review Provider'}</span>
                      </h3>
                      <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium">
                        {isBn ? 'সরাসরি রিভিউ' : 'Direct Review'}
                      </span>
                    </div>

                    <form onSubmit={handleAddReview} className="space-y-3.5">
                      {/* Interactive 5-Star Selection */}
                      <div>
                        <label className="block text-xs font-bold text-gray-700 mb-1.5">
                          {isBn ? 'কাজের মান অনুযায়ী স্টার রেটিং দিন:' : 'Select Star Rating:'}
                        </label>
                        <div className="flex items-center gap-1.5">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <button
                              key={star}
                              type="button"
                              onClick={() => setNewReviewRating(star)}
                              onMouseEnter={() => setHoverRating(star)}
                              onMouseLeave={() => setHoverRating(null)}
                              className="p-1 text-amber-400 transition hover:scale-110 cursor-pointer"
                            >
                              <Star
                                className={`w-7 h-7 ${
                                  (hoverRating !== null ? star <= hoverRating : star <= newReviewRating)
                                    ? 'fill-amber-400 text-amber-400'
                                    : 'text-gray-300 hover:text-amber-300'
                                }`}
                              />
                            </button>
                          ))}
                          <span className="text-xs font-bold text-gray-800 ml-2">
                            {(hoverRating !== null ? hoverRating : newReviewRating)} / 5
                            <span className="text-gray-500 font-normal ml-1.5">
                              {(hoverRating !== null ? hoverRating : newReviewRating) === 5
                                ? (isBn ? '(চমৎকার অভিজ্ঞতা)' : '(Excellent)')
                                : (hoverRating !== null ? hoverRating : newReviewRating) === 4
                                ? (isBn ? '(খুব ভালো)' : '(Very Good)')
                                : (hoverRating !== null ? hoverRating : newReviewRating) === 3
                                ? (isBn ? '(ভালো)' : '(Good)')
                                : (hoverRating !== null ? hoverRating : newReviewRating) === 2
                                ? (isBn ? '(মোটামুটি)' : '(Fair)')
                                : (isBn ? '(সাধারণ)' : '(Poor)')}
                            </span>
                          </span>
                        </div>
                      </div>

                      {/* Satisfaction Selector */}
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          {isBn ? 'কাজে সন্তুষ্টির মাত্রা:' : 'Satisfaction Level:'}
                        </label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                          {[
                            { key: 'very_good', label: isBn ? 'অত্যন্ত সন্তুষ্ট' : 'Very Satisfied' },
                            { key: 'satisfied', label: isBn ? 'সন্তুষ্ট' : 'Satisfied' },
                            { key: 'moderately_good', label: isBn ? 'মোটামুটি ভালো' : 'Moderate' },
                            { key: 'unsatisfied', label: isBn ? 'অসন্তুষ্ট' : 'Unsatisfied' }
                          ].map((item) => (
                            <button
                              key={item.key}
                              type="button"
                              onClick={() => setNewReviewSatisfaction(item.key as any)}
                              className={`py-1.5 px-2 rounded-xl border text-[11px] font-semibold transition cursor-pointer ${
                                newReviewSatisfaction === item.key
                                  ? 'bg-emerald-50 border-emerald-600 text-emerald-800'
                                  : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                              }`}
                            >
                              {item.label}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Reviewer Name */}
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          {isBn ? 'আপনার নাম' : 'Your Name'}
                        </label>
                        <input
                          type="text"
                          value={newReviewerName}
                          onChange={(e) => setNewReviewerName(e.target.value)}
                          placeholder={isBn ? 'আপনার নাম লিখুন' : 'Enter your name'}
                          className="w-full text-xs py-2 px-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      {/* Review Comment */}
                      <div>
                        <label className="block text-[11px] font-bold text-gray-700 mb-1">
                          {isBn ? 'কাজের অভিজ্ঞতা বা বিস্তারিত মন্তব্য' : 'Write Review / Feedback'} <span className="text-rose-500">*</span>
                        </label>
                        <textarea
                          rows={3}
                          required
                          value={newReviewComment}
                          onChange={(e) => setNewReviewComment(e.target.value)}
                          placeholder={isBn ? 'সেবাদাতার কাজের মান ও ব্যবহার কেমন ছিল? আপনার অভিজ্ঞতা লিখুন...' : 'Share details of your experience with this provider...'}
                          className="w-full text-xs p-2.5 border border-gray-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-sm cursor-pointer"
                      >
                        <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
                        <span>{isBn ? 'স্টার রেটিং ও রিভিউ জমা দিন' : 'Submit Star Rating & Review'}</span>
                      </button>

                      {reviewSubmittedToast && (
                        <div className="p-2.5 bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-bold text-center animate-in fade-in flex items-center justify-center gap-1.5">
                          <Check className="w-4 h-4 text-emerald-600" />
                          <span>{isBn ? 'আপনার রেটিং ও রিভিউ সফলভাবে প্রকাশিত হয়েছে!' : 'Review submitted and published successfully!'}</span>
                        </div>
                      )}
                    </form>
                  </div>

                  {/* Recent Customer Reviews List */}
                  <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                      <h4 className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                        <span>{isBn ? 'গ্রাহকদের দেওয়া মতামতসমূহ' : 'Customer Reviews'}</span>
                        <span className="text-gray-500 font-normal">({reviewsList.length})</span>
                      </h4>
                    </div>

                    {reviewsList.length === 0 ? (
                      <div className="text-center py-6 text-gray-500 space-y-1">
                        <Star className="w-8 h-8 text-gray-300 mx-auto" />
                        <p className="text-xs font-medium">
                          {isBn ? 'এখনো কোনো রিভিউ দেওয়া হয়নি।' : 'No reviews given yet.'}
                        </p>
                        <p className="text-[11px] text-gray-400">
                          {isBn ? 'আপনি প্রথম রিভিউটি দিন!' : 'Be the first to leave a review!'}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2.5">
                        {reviewsList.map((rev) => (
                          <div key={rev.id} className="p-3 bg-gray-50/80 rounded-xl border border-gray-200/80 text-xs space-y-1.5">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 rounded-full bg-emerald-700 text-white font-bold text-[10px] flex items-center justify-center">
                                  {rev.userName ? rev.userName.charAt(0).toUpperCase() : 'U'}
                                </div>
                                <span className="font-bold text-gray-900">{rev.userName}</span>
                              </div>
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`w-3 h-3 ${
                                      s <= rev.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                            </div>
                            <p className="text-gray-700 text-[11px] leading-relaxed pl-8">
                              {rev.comment}
                            </p>
                            <div className="flex items-center justify-between text-[10px] text-gray-400 pl-8 pt-0.5">
                              <span>{rev.date}</span>
                              {rev.satisfaction && (
                                <span className="text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-medium">
                                  {rev.satisfaction === 'very_good'
                                    ? (isBn ? 'অত্যন্ত সন্তুষ্ট' : 'Very Good')
                                    : rev.satisfaction === 'satisfied'
                                    ? (isBn ? 'সন্তুষ্ট' : 'Satisfied')
                                    : (isBn ? 'মোটামুটি' : 'Moderate')}
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Back to Booking / Profile Navigation */}
                  <div className="space-y-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setActiveBookingSubTab('booking')}
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{isBn ? 'সার্ভিস বুকিং ও সময়সূচীতে ফিরে যান' : 'Back to Booking & Schedule'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setActiveView('cv')}
                      className="w-full py-2.5 px-3 rounded-xl border border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 text-xs font-semibold transition cursor-pointer"
                    >
                      {isBn ? 'বাতিল করুন ও প্রোফাইলে ফিরে যান' : 'Back to Profile'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      ) : activeView === 'dashboard' && isProfileOwner ? (
        <div id="sp-owner-dashboard-root" className="p-4 space-y-4 animate-fadeIn">
          {/* Top Quick Status Profile Banner */}
          <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-3 min-w-0">
              {profilePic ? (
                <img
                  src={profilePic}
                  alt={fullName}
                  className="w-12 h-12 rounded-lg object-cover border border-gray-300 shrink-0"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <div className="w-12 h-12 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 shrink-0">
                  <User className="w-6 h-6" />
                </div>
              )}
              <div className="truncate">
                <h2 className="text-sm font-bold text-gray-900 truncate">{fullName}</h2>
                <p className="text-[11px] text-emerald-700 font-medium truncate">{professionHeadline}</p>
                <span className="text-[10px] font-mono text-gray-500">{displayId}</span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setActiveView('cv')}
              className="px-2.5 py-1.5 rounded-lg border border-gray-300 bg-white hover:bg-gray-100 text-[11px] font-semibold text-gray-700 shrink-0 cursor-pointer"
            >
              {isBn ? 'সিভি দেখুন' : 'View CV'}
            </button>
          </div>

          {/* Financial Summary: Total Earnings, Current Balance & Withdrawn Amount */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5 text-gray-500" />
              <span>{isBn ? 'আর্থিক বিবরণী ও ব্যালেন্স' : 'Earnings & Wallet Overview'}</span>
            </h3>

            <div className="grid grid-cols-3 gap-2">
              {/* Total Earnings */}
              <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-[10px] text-gray-500 font-semibold">{isBn ? 'মোট আয়' : 'Total Earnings'}</div>
                <div className="text-sm font-bold text-gray-900 mt-1">
                  ৳ {toBengaliNumber(totalEarnings.toLocaleString())}
                </div>
              </div>

              {/* Current Balance */}
              <div className="p-2.5 bg-emerald-50/60 rounded-lg border border-emerald-200">
                <div className="text-[10px] text-emerald-800 font-semibold">{isBn ? 'বর্তমান ব্যালেন্স' : 'Current Balance'}</div>
                <div className="text-sm font-bold text-emerald-900 mt-1">
                  ৳ {toBengaliNumber(currentBalance.toLocaleString())}
                </div>
              </div>

              {/* Withdrawn Amount */}
              <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-[10px] text-gray-500 font-semibold">{isBn ? 'উত্তোলিত' : 'Withdrawn'}</div>
                <div className="text-sm font-bold text-gray-900 mt-1">
                  ৳ {toBengaliNumber(withdrawnAmount.toLocaleString())}
                </div>
              </div>
            </div>
          </div>

          {/* Performance Summary */}
          <div className="space-y-1.5">
            <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-3.5 h-3.5 text-gray-500" />
              <span>{isBn ? 'কাজের পরিসংখ্যান' : 'Performance Summary'}</span>
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-[10px] text-gray-500 font-semibold">{isBn ? 'মোট সম্পন্ন কাজ' : 'Completed Jobs'}</div>
                <div className="text-base font-bold text-gray-900 mt-0.5">
                  {toBengaliNumber(completedJobsCount)} {isBn ? 'টি কাজ' : 'Jobs'}
                </div>
              </div>

              <div className="p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                <div className="text-[10px] text-gray-500 font-semibold">{isBn ? 'গড় রেটিং' : 'Average Rating'}</div>
                <div className="text-base font-bold text-gray-900 mt-0.5 flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{toBengaliNumber(currentRating)}</span>
                  <span className="text-[10px] text-gray-400 font-normal">({toBengaliNumber(reviewsList.length)})</span>
                </div>
              </div>
            </div>
          </div>

          {/* List of Works Done (সম্পন্ন কাজের তালিকা) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-gray-500" />
                <span>{isBn ? 'সম্পন্ন কাজের তালিকা' : 'List of Works Done'}</span>
              </h3>
              <span className="text-[10px] text-gray-400 font-medium">
                {toBengaliNumber(completedWorks.length)} {isBn ? 'টি রেকর্ড' : 'records'}
              </span>
            </div>

            <div className="space-y-2">
              {completedWorks.length > 0 ? (
                completedWorks.map((work) => (
                  <div key={work.id} className="p-3 bg-white rounded-lg border border-gray-200 shadow-2xs space-y-1.5 text-xs">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-bold text-gray-900 text-xs leading-snug">{work.title}</h4>
                      <span className="shrink-0 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 text-[10px] font-bold">
                        {isBn ? 'সম্পন্ন' : 'Completed'}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-gray-500">
                      <span>{work.clientName} • {work.location}</span>
                      <span className="font-bold text-gray-800">৳ {toBengaliNumber(work.amount)}</span>
                    </div>

                    <div className="text-[10px] text-gray-400 pt-0.5 border-t border-gray-100 flex items-center gap-1">
                      <Clock className="w-3 h-3 text-gray-400" />
                      <span>{work.date}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-6 px-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center space-y-1">
                  <Briefcase className="w-6 h-6 text-gray-400 mx-auto" />
                  <p className="text-xs font-semibold text-gray-700">
                    {isBn ? 'এখনো কোনো সম্পন্ন কাজের রেকর্ড নেই' : 'No completed jobs recorded yet'}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    {isBn ? 'অর্ডার গ্রহণ ও কাজ সফলভাবে সম্পন্ন হলে এখানে কাজের বিবরণী স্বয়ংক্রিয়ভাবে যুক্ত হবে।' : 'Completed customer orders will appear here automatically.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ================= IN-PAGE JHAPAY WALLET INTEGRATION (NO MODAL/POPUP) ================= */}
          <div className="pt-3 border-t border-gray-200 space-y-2" id="provider-in-page-wallet">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-gray-800 uppercase tracking-wider flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-[#065f46]" />
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
                roleName={isBn ? 'সেবা বিক্রেতা (ফ্রিল্যান্সার)' : 'Service Provider (Freelancer)'}
                roleType="service_seller"
                lang={currentLang}
                className="border-none shadow-none"
              />
            </div>
          </div>

          {/* Dashboard Quick Options */}
          <div className="pt-2 border-t border-gray-200 space-y-2">
            <h3 className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
              {isBn ? 'কুইক অ্যাকশন' : 'Quick Actions'}
            </h3>

            <div className="grid grid-cols-2 gap-2 text-xs">
              {onEditProfile && (
                <button
                  type="button"
                  onClick={() => onEditProfile(data)}
                  className="py-2 px-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <UserCheck className="w-4 h-4 text-emerald-600" />
                  <span>{isBn ? 'প্রোফাইল এডিট' : 'Edit Profile'}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setActiveView('cv')}
                className="py-2 px-3 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <FileText className="w-4 h-4 text-blue-600" />
                <span>{isBn ? 'জীবনবৃত্তান্ত প্রিভিউ' : 'View CV Preview'}</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs pt-1">
              {onSignOut && (
                <button
                  type="button"
                  onClick={onSignOut}
                  className="py-2 px-3 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <LogOut className="w-4 h-4 text-gray-600" />
                  <span>{isBn ? 'সাইন আউট' : 'Sign Out'}</span>
                </button>
              )}

              {onDeleteAccount && (
                <button
                  type="button"
                  onClick={handleOpenDeleteModal}
                  className="py-2 px-3 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>{isBn ? 'প্রোফাইল মুছুন' : 'Delete Account'}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        /* =========================================================================
            VIEW B: CLEAN RESUME / CV DOCUMENT VIEW (Static, Clean, No Mid-Buttons)
           ========================================================================= */
        <div id="sp-profile-document-view">
          {/* Header & Identity: Professional CV / Application Layout */}
          <div className="px-5 pt-5 pb-4 border-b border-gray-200">
            <div className="flex items-start gap-4">
              {/* Profile Picture at Top-Left */}
              <div className="shrink-0 relative">
                {profilePic ? (
                  <div
                    onClick={() => {
                      setLightboxImage(profilePic);
                      setLightboxTitle(fullName);
                    }}
                    className="w-20 h-20 sm:w-24 sm:h-24 rounded-xl overflow-hidden border-2 border-gray-300 bg-gray-100 cursor-pointer group shadow-2xs"
                    title={isBn ? 'বড় করে দেখতে ক্লিক করুন' : 'Click to view'}
                  >
                    <img
                      src={profilePic}
                      alt={fullName}
                      className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute inset-0 bg-black/25 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[10px] font-semibold">
                      <Eye className="w-3.5 h-3.5" />
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={isProfileOwner && onEditProfile ? () => onEditProfile(data) : undefined}
                    className={`w-20 h-20 sm:w-24 sm:h-24 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 flex flex-col items-center justify-center text-gray-400 ${
                      isProfileOwner && onEditProfile ? 'cursor-pointer hover:border-[#008055] hover:text-[#008055] transition' : ''
                    }`}
                  >
                    <User className="w-8 h-8 stroke-[1.5]" />
                    <span className="text-[9px] font-medium mt-1">
                      {isProfileOwner && onEditProfile ? (isBn ? 'ছবি যোগ' : 'Add Photo') : (isBn ? 'ছবি নেই' : 'No Photo')}
                    </span>
                  </div>
                )}

                {/* Verified Badge */}
                {(data.isVerified || data.isNidVerified) && (
                  <div
                    className="absolute -bottom-1 -right-1 bg-black text-white p-1 rounded-full shadow-xs border-2 border-white"
                    title={isBn ? 'যাচাইকৃত প্রোফাইল' : 'Verified Profile'}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              {/* Provider's Full Name, Headline & Basic Info */}
              <div className="flex-1 min-w-0 pt-0.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-xl sm:text-2xl font-black text-gray-950 tracking-tight leading-snug">
                    {fullName}
                  </h2>
                  {(data.isVerified || data.isNidVerified) && (
                    <span className="inline-flex items-center text-black" title={isBn ? 'যাচাইকৃত' : 'Verified'}>
                      <CheckCircle2 className="w-5 h-5 fill-gray-100 text-black" />
                    </span>
                  )}
                </div>

                {/* Shop / Business Name if present */}
                {data.shopName && data.shopName !== fullName && (
                  <p className="text-xs font-semibold text-gray-700 mt-0.5">
                    {data.shopName}
                  </p>
                )}

                {/* Profession / Category */}
                <p className="text-xs sm:text-sm font-bold text-gray-800 mt-1">
                  {professionHeadline || serviceCategoryDisplay}
                </p>

                {/* 4. REALISTIC RATINGS: Rendered in clean B&W outline mode by default; dynamically yellow ONLY when real user reviews submitted */}
                <div className="flex items-center gap-1.5 mt-1.5">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((s) => {
                      const hasRealReviews = reviewsList.length > 0;
                      const isFilled = hasRealReviews && s <= Math.round(Number(currentRating));
                      return (
                        <Star
                          key={s}
                          className={`w-3.5 h-3.5 ${
                            isFilled
                              ? 'fill-amber-400 text-amber-400'
                              : 'text-gray-400 stroke-[1.6] fill-none'
                          }`}
                        />
                      );
                    })}
                  </div>
                  <span className="text-xs font-bold text-gray-900">
                    {reviewsList.length > 0 ? `★ ${toBengaliNumber(currentRating)}` : (isBn ? '০.০' : '0.0')}
                  </span>
                  <span className="text-[10px] text-gray-500 font-medium">
                    {reviewsList.length > 0
                      ? `(${toBengaliNumber(reviewsList.length)} ${isBn ? 'রিভিউ' : 'reviews'})`
                      : (isBn ? '(কোনো রিভিউ নেই)' : '(No reviews yet)')}
                  </span>
                </div>
              </div>
            </div>

            {/* 2. NAME, ID, AND DIVIDER LINE:
                - Below the profile picture and name block, place the unique ID code compactly in a single line.
                - Directly beneath the ID, place a clean, professional horizontal green dividing line. */}
            <div className="mt-3.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-semibold text-gray-500">
                  {isBn ? 'ইউনিক আইডি:' : 'Unique ID:'}
                </span>
                <span className="font-mono font-bold text-xs sm:text-sm text-gray-950 bg-gray-100 px-2 py-0.5 rounded border border-gray-200 tracking-wider">
                  {displayId}
                </span>
              </div>
              <button
                type="button"
                onClick={handleCopyId}
                className="text-xs text-gray-500 hover:text-black flex items-center gap-1 cursor-pointer transition"
                title={isBn ? 'আইডি কপি করুন' : 'Copy ID'}
              >
                {copiedId ? (
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
                - Right below the green divider line, list the user's skills/services cleanly (e.g., Plumber, Electrician, Laborer, etc.). */}
            <div className="mb-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900">
                <Briefcase className="w-3.5 h-3.5 text-black" />
                <span>{isBn ? 'দক্ষতা ও সেবাসমূহ:' : 'Skills & Services:'}</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {(skillsList && skillsList.length > 0
                  ? skillsList
                  : [professionHeadline || serviceCategoryDisplay || (isBn ? 'প্লাম্বার, ইলেকট্রিশিয়ান, লেবার' : 'Plumber, Electrician, Laborer')]
                ).map((skill, sIdx) => (
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
                - Display the location/address clearly (e.g., খাগড়াছড়ি সদর), followed by the official ID number at the bottom of the intro block. */}
            <div className="py-2.5 px-3 bg-gray-50 rounded-lg border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 text-xs mb-3.5">
              <div className="flex items-center gap-1.5 text-gray-800 font-medium">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  {districtDisplay}, {upazilaDisplay}
                  {data.area ? ` (${data.area})` : ''}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-600 font-mono text-[11px]">
                <span>{isBn ? 'অফিসিয়াল আইডি:' : 'Official ID:'}</span>
                <span className="font-bold text-gray-950 bg-white px-1.5 py-0.5 rounded border border-gray-300">
                  {displayId}
                </span>
              </div>
            </div>

            {/* Structured Details: Work Description, Blood Group, etc. in a clean formal CV specification list */}
            <div className="space-y-2 text-xs">
              {/* Work Description / Profession */}
              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500 font-medium">{isBn ? 'কাজের বিবরণ / পেশা:' : 'Work Description:'}</span>
                <span className="font-semibold text-gray-900 text-right">{professionHeadline || serviceCategoryDisplay}</span>
              </div>

              {/* Blood Group */}
              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500 font-medium">{isBn ? 'রক্তের গ্রুপ:' : 'Blood Group:'}</span>
                {bloodGroup ? (
                  <span className="inline-flex items-center gap-1 font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100 text-[11px]">
                    <Droplet className="w-3 h-3 fill-rose-600 text-rose-600" />
                    <span>{bloodGroup}</span>
                  </span>
                ) : (
                  <span className="text-gray-400 italic text-[11px]">{emptyPlaceholder}</span>
                )}
              </div>

              {/* Privacy-Protected Mobile Number */}
              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500 font-medium">{isBn ? 'মোবাইল নম্বর:' : 'Mobile Number:'}</span>
                <div className="flex items-center gap-1.5">
                  <span className="font-mono text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-200 text-[11px]">
                    •••••••••••
                  </span>
                  <span className="text-[10px] text-gray-900 font-bold bg-gray-100 border border-gray-300 px-1.5 py-0.5 rounded">
                    {isBn ? 'গোপন ও সুরক্ষিত' : 'Protected'}
                  </span>
                </div>
              </div>

              {/* Service Category */}
              <div className="flex items-center justify-between py-1.5 border-b border-gray-100">
                <span className="text-gray-500 font-medium">{isBn ? 'ক্যাটাগরি:' : 'Category:'}</span>
                <span className="font-medium text-gray-800">{serviceCategoryDisplay}</span>
              </div>

              {/* Location / Work Area */}
              <div className="flex items-center justify-between py-1.5">
                <span className="text-gray-500 font-medium">{isBn ? 'কর্মক্ষেত্র / এলাকা:' : 'Service Area:'}</span>
                <div className="flex items-center gap-1 text-right">
                  <span className="font-medium text-gray-800">{upazilaDisplay}, {districtDisplay}</span>
                  {googleMapUrl && (
                    <a
                      href={googleMapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:text-emerald-700 ml-1 inline-flex items-center"
                      title={googleLocationText || (isBn ? 'গুগল ম্যাপে দেখুন' : 'View on Google Maps')}
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* =========================================================================
              STRUCTURED RESUME/CV SECTIONS: Sequential, Clean Typographic Flow
             ========================================================================= */}
          <div className="p-5 space-y-5">

            {/* SECTION 1: পেশাগত সারসংক্ষেপ (Professional Summary / Bio) */}
            <section className="space-y-1.5">
              <div className="border-b border-gray-200 pb-1 flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5 text-gray-500" />
                  <span>{isBn ? 'পেশাগত সারসংক্ষেপ' : 'Professional Summary'}</span>
                </h3>
              </div>
              {bioSummary ? (
                <p className="text-xs text-gray-700 leading-relaxed whitespace-pre-line pt-1">
                  {bioSummary}
                </p>
              ) : (
                <p className="text-xs text-gray-400 italic pt-1">
                  {emptyPlaceholder}
                </p>
              )}
            </section>

            {/* SECTION 2: দক্ষতা ও সেবাসমূহ (Skills & Services) */}
            <section className="space-y-2">
              <div className="border-b border-gray-200 pb-1 flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-gray-500" />
                  <span>{isBn ? 'দক্ষতা ও সেবাসমূহ' : 'Skills & Services'}</span>
                </h3>
              </div>
              {skillsList.length > 0 ? (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {skillsList.map((skill, idx) => (
                    <span
                      key={idx}
                      className="inline-flex items-center gap-1 bg-gray-50 text-gray-800 text-[11px] font-medium px-2.5 py-1 rounded border border-gray-200"
                    >
                      <Check className="w-3 h-3 text-emerald-600" />
                      <span>{skill}</span>
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic pt-1">
                  {emptyPlaceholder}
                </p>
              )}
            </section>

            {/* SECTION 3: কাজের অভিজ্ঞতা ও ধরন (Work Experience & Nature of Work) */}
            <section className="space-y-2">
              <div className="border-b border-gray-200 pb-1 flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-gray-500" />
                  <span>{isBn ? 'কাজের অভিজ্ঞতা ও কাজের ধরন' : 'Experience & Work Nature'}</span>
                </h3>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                <div className="p-2.5 bg-gray-50/70 rounded border border-gray-100">
                  <div className="text-[10px] text-gray-500 font-semibold uppercase">{isBn ? 'অভিজ্ঞতা' : 'Experience'}</div>
                  <div className="font-bold text-gray-800 mt-0.5">
                    {experienceText || emptyPlaceholder}
                  </div>
                </div>

                <div className="p-2.5 bg-gray-50/70 rounded border border-gray-100">
                  <div className="text-[10px] text-gray-500 font-semibold uppercase">{isBn ? 'সম্পন্ন কাজ' : 'Completed Jobs'}</div>
                  <div className="font-bold text-gray-800 mt-0.5">
                    {completedJobsCount > 0 ? `${toBengaliNumber(completedJobsCount)} ${isBn ? 'টি কাজ সম্পন্ন' : 'Jobs'}` : (isBn ? '০ টি কাজ' : '0 Jobs')}
                  </div>
                </div>
              </div>

              {workNatureList.length > 0 && (
                <div className="flex items-center gap-1.5 pt-1 text-[11px] text-gray-600">
                  <span className="font-medium text-gray-500">{isBn ? 'কাজের মাধ্যম:' : 'Work Nature:'}</span>
                  <div className="flex gap-1">
                    {workNatureList.map((item, idx) => (
                      <span key={idx} className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded text-[10px] font-semibold border border-gray-200">
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>

            {/* SECTION 4: শিক্ষাগত যোগ্যতা (Educational Qualifications) */}
            <section className="space-y-1.5">
              <div className="border-b border-gray-200 pb-1 flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5 text-gray-500" />
                  <span>{isBn ? 'শিক্ষাগত যোগ্যতা' : 'Educational Qualifications'}</span>
                </h3>
              </div>
              {education ? (
                <div className="pt-1 flex items-start gap-2">
                  <GraduationCap className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-bold text-gray-800">{education}</p>
                    <p className="text-[10px] text-gray-500 mt-0.5">{isBn ? 'স্বঘোষিত ও ভেরিফাইড তথ্য' : 'Verified Credential'}</p>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-gray-400 italic pt-1">
                  {emptyPlaceholder}
                </p>
              )}
            </section>

            {/* SECTION 5: কারিগরি সনদপত্র ও প্রশিক্ষণ (Certificates & Training) */}
            <section className="space-y-2">
              <div className="border-b border-gray-200 pb-1 flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5 text-gray-500" />
                  <span>{isBn ? 'কারিগরি সনদপত্র ও প্রশিক্ষণ' : 'Certificates & Training'}</span>
                </h3>
                {certificatesList.length > 0 && (
                  <span className="text-[10px] text-gray-400 font-medium">
                    {toBengaliNumber(certificatesList.length)} {isBn ? 'টি সংযুক্ত' : 'attached'}
                  </span>
                )}
              </div>

              {certificatesList.length > 0 ? (
                <div className="space-y-1.5 pt-1">
                  {certificatesList.map((certUrl, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setLightboxImage(certUrl);
                        setLightboxTitle(`${fullName} - সনদপত্র #${idx + 1}`);
                      }}
                      className="p-2 rounded-lg border border-gray-200 hover:border-gray-300 bg-gray-50/50 hover:bg-gray-50 flex items-center justify-between cursor-pointer transition"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-8 h-8 rounded border border-gray-200 bg-white overflow-hidden shrink-0">
                          <img src={certUrl} alt="Certificate" className="w-full h-full object-cover" />
                        </div>
                        <div className="truncate">
                          <span className="text-xs font-medium text-gray-800">
                            {isBn ? `সনদপত্র #${toBengaliNumber(idx + 1)}` : `Certificate #${idx + 1}`}
                          </span>
                        </div>
                      </div>
                      <span className="text-[11px] font-medium text-emerald-700 flex items-center gap-1 shrink-0 ml-2">
                        <Eye className="w-3 h-3" />
                        <span>{isBn ? 'দেখুন' : 'View'}</span>
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-2.5 px-3 bg-gray-50/60 rounded border border-dashed border-gray-200 text-gray-400 text-xs flex items-center gap-2">
                  <Award className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>{emptyPlaceholder}</span>
                </div>
              )}
            </section>

            {/* SECTION 6: কাজের পোর্টফোলিও (Work Portfolio & Samples) */}
            <section className="space-y-2">
              <div className="border-b border-gray-200 pb-1 flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                  <Eye className="w-3.5 h-3.5 text-gray-500" />
                  <span>{isBn ? 'কাজের পোর্টফোলিও' : 'Work Portfolio'}</span>
                </h3>
                {portfolioList.length > 0 && (
                  <span className="text-[10px] text-gray-400 font-medium">
                    {toBengaliNumber(portfolioList.length)} {isBn ? 'টি ছবি' : 'photos'}
                  </span>
                )}
              </div>

              {portfolioList.length > 0 ? (
                <div className="grid grid-cols-3 gap-2 pt-1">
                  {portfolioList.map((photoUrl, idx) => (
                    <div
                      key={idx}
                      onClick={() => {
                        setLightboxImage(photoUrl);
                        setLightboxTitle(`${fullName} - কাজের স্যাম্পল #${idx + 1}`);
                      }}
                      className="aspect-square rounded-lg overflow-hidden border border-gray-200 bg-gray-100 cursor-pointer relative group"
                    >
                      <img
                        src={photoUrl}
                        alt={`Sample ${idx + 1}`}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-200"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white">
                        <Eye className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-2.5 px-3 bg-gray-50/60 rounded border border-dashed border-gray-200 text-gray-400 text-xs flex items-center gap-2">
                  <Briefcase className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>{emptyPlaceholder}</span>
                </div>
              )}
            </section>

            {/* SECTION 7: প্রফেশনাল ও পাবলিক তথ্য / ব্যক্তিগত বিবরণ (Personal & Public Info) */}
            <section className="space-y-2">
              <div className="border-b border-gray-200 pb-1 flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-gray-500" />
                  <span>
                    {isProfileOwner
                      ? (isBn ? 'ব্যক্তিগত বিবরণ (ওনার ভিউ)' : 'Personal Details (Owner View)')
                      : (isBn ? 'সেবা ও পাবলিক তথ্য' : 'Service & Public Details')}
                  </span>
                </h3>
                <span className="text-[10px] font-bold text-gray-800 bg-gray-100 px-2 py-0.5 rounded border border-gray-300">
                  {isBn ? 'প্রাইভেসী সুরক্ষিত' : 'Privacy Protected'}
                </span>
              </div>

              <div className="divide-y divide-gray-100 text-xs">
                {/* Service Category */}
                <div className="py-2 flex items-center justify-between">
                  <span className="text-gray-500 font-medium">{isBn ? 'সেবা ক্যাটাগরি' : 'Service Category'}</span>
                  <span className="font-bold text-gray-900 text-right">
                    {serviceCategoryDisplay}
                  </span>
                </div>

                {/* District */}
                <div className="py-2 flex items-center justify-between">
                  <span className="text-gray-500 font-medium">{isBn ? 'জেলা' : 'District'}</span>
                  <span className="font-bold text-gray-900">
                    {districtDisplay}
                  </span>
                </div>

                {/* Upazila */}
                <div className="py-2 flex items-center justify-between">
                  <span className="text-gray-500 font-medium">{isBn ? 'উপজেলা' : 'Upazila'}</span>
                  <span className="font-bold text-gray-900">
                    {upazilaDisplay}
                  </span>
                </div>

                {/* Google Location */}
                <div className="py-2 flex items-center justify-between">
                  <span className="text-gray-500 font-medium">{isBn ? 'গুগল লোকেশন' : 'Google Location'}</span>
                  {googleMapUrl ? (
                    <a
                      href={googleMapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-black hover:text-gray-600 font-bold underline text-xs"
                    >
                      <MapPin className="w-3.5 h-3.5 text-black shrink-0" />
                      <span>{googleLocationText || (isBn ? 'গুগল ম্যাপে দেখুন' : 'View on Google Maps')}</span>
                      <ExternalLink className="w-3 h-3 text-black" />
                    </a>
                  ) : (
                    <span className="font-medium text-gray-700">
                      {googleLocationText || `${upazilaDisplay}, ${districtDisplay}`}
                    </span>
                  )}
                </div>

                {/* Privacy-Protected Mobile & Contact Info */}
                <div className="py-2 flex items-center justify-between">
                  <span className="text-gray-500 font-medium">{isBn ? 'মোবাইল নম্বর' : 'Mobile Number'}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-gray-600 bg-gray-50 px-2 py-0.5 rounded border border-gray-200 text-[11px]">
                      •••••••••••
                    </span>
                    <span className="text-[10px] text-gray-900 font-bold bg-gray-100 border border-gray-300 px-1.5 py-0.5 rounded">
                      {isBn ? 'গোপন ও সুরক্ষিত' : 'Protected'}
                    </span>
                  </div>
                </div>

                {/* Owner-Only Private Details (Strictly hidden from customers) */}
                {isProfileOwner && (
                  <div className="py-2 flex items-center justify-between bg-amber-50/60 px-2 rounded mt-1">
                    <span className="text-gray-600 font-medium">{isBn ? 'মোবাইল নম্বর (গ্রাহকদের জন্য গোপন)' : 'Private Mobile'}</span>
                    <span className="font-mono text-xs font-bold text-gray-700">
                      ••••••••••• ({isBn ? 'সুরক্ষিত' : 'Protected'})
                    </span>
                  </div>
                )}
              </div>
            </section>

            {/* SECTION 9: ক্লায়েন্ট রিভিউ ও মূল্যায়ন (Reviews & Ratings) */}
            <section id="sp-profile-reviews-section" className="space-y-3 pt-2">
              <div className="border-b border-gray-200 pb-1 flex items-center justify-between">
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
                  <Star className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isBn ? 'ক্লায়েন্ট রিভিউ ও মূল্যায়ন' : 'Reviews & Ratings'}</span>
                </h3>
                <div className="flex items-center gap-1 text-xs font-bold text-gray-800">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{toBengaliNumber(currentRating)}</span>
                  <span className="text-gray-400 font-normal">({toBengaliNumber(reviewsList.length)})</span>
                </div>
              </div>

              {/* Customer Reviews List */}
              {reviewsList.length > 0 ? (
                <div className="space-y-2">
                  {reviewsList.map((rev) => (
                    <div key={rev.id} className="p-2.5 rounded-lg border border-gray-100 bg-gray-50/50 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-gray-800">{rev.userName}</span>
                        <div className="flex items-center gap-0.5">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3 h-3 ${s <= Math.floor(rev.rating) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`}
                            />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-gray-600">{rev.comment}</p>
                      <div className="text-[10px] text-gray-400">{rev.date}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-2.5 px-3 bg-gray-50/60 rounded border border-dashed border-gray-200 text-gray-400 text-xs flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                  <span>{emptyPlaceholder}</span>
                </div>
              )}

              {/* Review Permission Check:
                  - If visitor is not logged in: prompt sign-in to review
                  - If logged in (and not owner): show interactive review form
                  - If owner: informative label only */}
              {!currentUser ? (
                <div className="p-3.5 bg-gray-50 rounded-lg border border-dashed border-gray-200 text-center space-y-2 mt-2">
                  <div className="flex items-center justify-center gap-1.5 text-gray-700 text-xs font-semibold">
                    <UserCheck className="w-4 h-4 text-emerald-600" />
                    <span>{isBn ? 'রিভিউ ও রেটিং দিতে লগইন প্রয়োজন' : 'Sign in required to leave a review'}</span>
                  </div>
                  <p className="text-[11px] text-gray-500 max-w-xs mx-auto">
                    {isBn
                      ? 'সেবাদাতার কাজের মান ও অভিজ্ঞতা শেয়ার করতে অনুগ্রহ করে সাইন-আপ বা লগইন করুন।'
                      : 'Please sign in or register to rate this service provider.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      if (onNavigateSignIn) {
                        onNavigateSignIn();
                      } else {
                        alert(isBn ? 'অনুগ্রহ করে লগইন বা সাইন-আপ করুন।' : 'Please sign in or register.');
                      }
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-semibold transition cursor-pointer"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>{isBn ? 'লগইন / সাইন-আপ করুন' : 'Sign In / Register'}</span>
                  </button>
                </div>
              ) : !isProfileOwner ? (
                /* Interactive Feedback Submission Form for Signed-In Customer */
                <div className="pt-2">
                  <form onSubmit={handleAddReview} className="space-y-2 p-3 bg-gray-50/50 rounded-lg border border-gray-200 text-xs">
                    <div className="font-bold text-gray-700 text-[11px] mb-1">
                      {isBn ? 'সেবা পরবর্তী মতামত ও রেটিং দিন' : 'Leave Feedback & Rating'}
                    </div>

                    <input
                      type="text"
                      required
                      placeholder={isBn ? 'আপনার নাম *' : 'Your name *'}
                      value={newReviewerName}
                      onChange={(e) => setNewReviewerName(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded text-xs focus:outline-none focus:border-emerald-600"
                    />

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-gray-500 font-medium">{isBn ? 'রেটিং:' : 'Rating:'}</span>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onMouseEnter={() => setHoverRating(s)}
                            onMouseLeave={() => setHoverRating(null)}
                            onClick={() => setNewReviewRating(s)}
                            className="p-0.5 cursor-pointer"
                          >
                            <Star
                              className={`w-4 h-4 ${
                                (hoverRating !== null ? hoverRating : newReviewRating) >= s
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      required
                      rows={2}
                      placeholder={isBn ? 'কাজের মান ও অভিজ্ঞতা সম্পর্কে লিখুন...' : 'Write your feedback...'}
                      value={newReviewComment}
                      onChange={(e) => setNewReviewComment(e.target.value)}
                      className="w-full p-2 bg-white border border-gray-200 rounded text-xs focus:outline-none focus:border-emerald-600 resize-none"
                    />

                    <button
                      type="submit"
                      className="w-full py-2 bg-gray-900 hover:bg-black text-white font-semibold rounded text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3 h-3" />
                      <span>{isBn ? 'ফিডব্যাক জমা দিন' : 'Submit Feedback'}</span>
                    </button>

                    {reviewSubmittedToast && (
                      <div className="p-1.5 bg-emerald-50 text-emerald-800 rounded text-[11px] font-medium text-center">
                        ✓ {isBn ? 'মতামত গৃহীত হয়েছে।' : 'Feedback submitted.'}
                      </div>
                    )}
                  </form>
                </div>
              ) : null}
            </section>

            {/* =========================================================================
                BOTTOM ACTION SECTION:
                - If OWNER: Hide customer-facing action buttons (Message, Call, Order).
                - If PUBLIC CUSTOMER: Display exactly 3 Action Buttons:
                  1. সরাসরি যোগাযোগ করুন (Direct Call)
                  2. মেসেজ করুন (Send Message)
                  3. অর্ডার / সার্ভিস কনফার্ম করুন (Confirm Order/Service)
               ========================================================================= */}
            {isProfileOwner ? (
              <div className="pt-4 border-t border-gray-200">
                <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl text-center space-y-2">
                  <p className="text-xs text-gray-600 font-semibold">
                    {isBn 
                      ? 'এটি আপনার প্রোফাইলের লাইভ প্রিভিউ। গ্রাহক ভিউতে সরাসরি যোগাযোগ ও অর্ডার কনফার্ম বাটন প্রদর্শিত হবে।' 
                      : 'This is your profile preview. Direct call, message, and confirm order buttons are visible to customers.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setActiveView('dashboard')}
                    className="px-4 py-2 bg-black hover:bg-gray-800 text-white text-xs font-bold rounded-lg transition active:scale-95 cursor-pointer"
                  >
                    {isBn ? 'ড্যাশবোর্ডে যান' : 'Go to Dashboard'}
                  </button>
                </div>
              </div>
            ) : (
              <div id="sp-profile-bottom-actions" className="pt-4 border-t border-gray-200 space-y-4">
                {/* Complete Professional Vendor Profile & Booking Layout */}
                <VendorBookingAndContactSection
                  vendor={{
                    id: displayId,
                    code: displayId,
                    name: fullName,
                    fullName: fullName,
                    profession: data.profession || data.jobTitle || 'দক্ষ পেশাদার ও কারিগর',
                    professionBn: data.profession || data.jobTitle || 'দক্ষ পেশাদার ও কারিগর',
                    category: data.category || data.profession || 'সার্ভিস প্রোভাইডার',
                    categoryBn: data.category || data.profession || 'সার্ভিস প্রোভাইডার',
                    phone: data.phone || data.realPhone || data.mobileNumber || '01870592699',
                    realPhone: data.phone || data.realPhone || data.mobileNumber || '01870592699',
                    whatsapp: data.phone || data.realPhone || data.mobileNumber || '01870592699',
                    district: data.district || 'খাগড়াছড়ি',
                    upazila: data.upazila || 'সদর',
                    hourlyRate: data.hourlyRate || data.rate,
                    isVerified: true
                  }}
                  lang={lang}
                  defaultServiceName={data.profession || data.jobTitle || 'পেশাদার কারিগরি সেবা'}
                  onOpenJMessage={() => {
                    if (onOpenChat) onOpenChat(fullName);
                  }}
                  onBookingConfirmed={(b) => {
                    if (onBookService) onBookService(b);
                  }}
                />
              </div>
            )}

          </div>
        </div>
      )}

      {/* =========================================================================
          SECURE MULTI-STEP DELETE PROFILE MODAL (Step A & Step B Verification)
         ========================================================================= */}
      {showDeleteModal && (
        <div
          id="sp-secure-delete-modal-backdrop"
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs animate-fadeIn"
          onClick={() => {
            if (!isDeleting && !deleteSuccess) {
              setShowDeleteModal(false);
            }
          }}
        >
          <div
            id="sp-secure-delete-modal-card"
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Step A: Warning Confirmation Dialog */}
            {deleteStep === 'warning' && (
              <div>
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                      <AlertTriangle className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold tracking-tight">
                        {isBn ? 'প্রোফাইল মুছে ফেলার সতর্কতা' : 'Profile Deletion Warning'}
                      </h3>
                      <p className="text-[11px] text-red-100 font-medium">
                        {isBn ? 'ধাপ ১ এর ২: নিশ্চিতকরণ' : 'Step 1 of 2: Confirmation'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-4">
                  <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl">
                    <p className="text-sm font-bold text-rose-900 leading-snug">
                      {isBn
                        ? 'আপনি কি সত্যিই আপনার প্রোফাইল মুছে ফেলতে চান?'
                        : 'Are you sure you want to permanently delete your profile?'}
                    </p>
                    <p className="text-xs text-rose-700 mt-1.5 leading-relaxed">
                      {isBn
                        ? 'এই প্রোফাইলটি মুছে ফেললে আপনার যাবতীয় ব্যক্তিগত তথ্য, কাজের রেকর্ড, সার্ভিস তালিকা এবং ড্যাশবোর্ড চিরতরে বিনষ্ট হবে। এটি কোনোভাবেই ফিরিয়ে আনা সম্ভব নয়।'
                        : 'Deleting this profile will permanently erase all your personal details, service records, listings, and dashboard history. This action cannot be undone.'}
                    </p>
                  </div>

                  <div className="space-y-2 text-xs text-gray-700">
                    <div className="flex items-start gap-2">
                      <span className="text-rose-500 font-bold shrink-0">•</span>
                      <span>{isBn ? 'আপনার প্রোফাইল পাবলিক সার্চ ও ডিরেক্টরিতে আর দৃশ্যমান হবে না।' : 'Your profile will no longer be visible in searches.'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-rose-500 font-bold shrink-0">•</span>
                      <span>{isBn ? 'গ্রাহকদের সকল বুকিং হিস্ট্রি ও মেসেজ হিস্ট্রি স্থায়ীভাবে মুছে যাবে।' : 'All customer bookings and messaging history will be removed.'}</span>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className="text-rose-500 font-bold shrink-0">•</span>
                      <span>{isBn ? 'মেম্বার আইডি ও অ্যাকাউন্টের যাবতীয় অধিকার স্থায়ীভাবে বাতিল হবে।' : 'Member ID and all account privileges will be revoked.'}</span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => setShowDeleteModal(false)}
                    className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition cursor-pointer"
                  >
                    {isBn ? 'বাতিল করুন' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteStep('verify');
                      setDeleteError('');
                    }}
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>{isBn ? 'পরবর্তী ধাপ (নিরাপত্তা যাচাই) →' : 'Next (Security Verification) →'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Step B: Strict Confirmation with User ID & Password Verification */}
            {deleteStep === 'verify' && (
              <div>
                {/* Header */}
                <div className="bg-gradient-to-r from-red-600 to-rose-700 text-white px-5 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center shrink-0">
                      <Lock className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold tracking-tight">
                        {isBn ? 'নিরাপত্তা যাচাই ও চূড়ান্ত নিশ্চিতকরণ' : 'Security Verification'}
                      </h3>
                      <p className="text-[11px] text-red-100 font-medium">
                        {isBn ? 'ধাপ ২ এর ২: আইডি ও পাসওয়ার্ড যাচাই' : 'Step 2 of 2: ID & Password Check'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (!isDeleting && !deleteSuccess) {
                        setShowDeleteModal(false);
                      }
                    }}
                    disabled={isDeleting}
                    className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer disabled:opacity-50"
                    aria-label="Close"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body */}
                <div className="p-5 space-y-3.5">
                  <p className="text-xs text-gray-600 leading-relaxed">
                    {isBn
                      ? 'অননুমোদিত বা ভুলবশত ডিলিট রোধে আপনার ইউজার আইডি এবং অ্যাকাউন্টের পাসওয়ার্ড লিখে নিরাপত্তা যাচাই সম্পন্ন করুন।'
                      : 'To prevent unauthorized deletion, please enter your User ID and Password to verify identity.'}
                  </p>

                  {/* Registered Identity Hint */}
                  {proIdentifier && (
                    <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between gap-2">
                      <span className="text-[11px] text-gray-500 font-medium">
                        {isBn ? 'আপনার প্রোফাইল আইডি / মেম্বার কোড:' : 'Your Profile / Member ID:'}
                      </span>
                      <span className="text-xs font-mono font-bold text-gray-900 select-all">
                        {proIdentifier}
                      </span>
                    </div>
                  )}

                  {/* Input 1: User ID */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {isBn ? '১. ইউজার আইডি / মেম্বার কোড / মোবাইল নম্বর' : '1. User ID / Member Code / Phone'} <span className="text-rose-600">*</span>
                    </label>
                    <input
                      id="input-delete-user-id"
                      type="text"
                      value={deleteUserIdInput}
                      onChange={(e) => {
                        setDeleteUserIdInput(e.target.value);
                        if (deleteError) setDeleteError('');
                      }}
                      placeholder={proIdentifier || (isBn ? 'যেমন: CG-KHG-DGH-0001 বা মোবাইল' : 'e.g. CG-KHG-DGH-0001 or Phone')}
                      disabled={isDeleting || deleteSuccess}
                      className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition disabled:bg-gray-100"
                    />
                  </div>

                  {/* Input 2: Password */}
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                      {isBn ? '২. অ্যাকাউন্টের পাসওয়ার্ড' : '2. Account Password'} <span className="text-rose-600">*</span>
                    </label>
                    <div className="relative">
                      <input
                        id="input-delete-user-password"
                        type={showDeletePassword ? 'text' : 'password'}
                        value={deletePasswordInput}
                        onChange={(e) => {
                          setDeletePasswordInput(e.target.value);
                          if (deleteError) setDeleteError('');
                        }}
                        placeholder={isBn ? 'আপনার পাসওয়ার্ড লিখুন' : 'Enter account password'}
                        disabled={isDeleting || deleteSuccess}
                        className="w-full px-3 py-2 pr-9 text-xs border border-gray-300 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-rose-500 focus:border-rose-500 transition disabled:bg-gray-100"
                      />
                      <button
                        type="button"
                        onClick={() => setShowDeletePassword(!showDeletePassword)}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                        tabIndex={-1}
                      >
                        {showDeletePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Confirmation Checkbox */}
                  <label className="flex items-start gap-2 text-xs text-gray-700 select-none cursor-pointer pt-1">
                    <input
                      id="chk-delete-profile-confirm"
                      type="checkbox"
                      checked={deleteDisclaimerChecked}
                      onChange={(e) => {
                        setDeleteDisclaimerChecked(e.target.checked);
                        if (deleteError) setDeleteError('');
                      }}
                      disabled={isDeleting || deleteSuccess}
                      className="mt-0.5 rounded text-rose-600 focus:ring-rose-500 h-3.5 w-3.5 border-gray-300 cursor-pointer"
                    />
                    <span>
                      {isBn
                        ? 'আমি অবগত যে প্রোফাইলটি মুছে ফেলার পর আর কোনোভাবেই পুনরুদ্ধার করা যাবে না।'
                        : 'I understand that once deleted, this profile can never be recovered.'}
                    </span>
                  </label>

                  {/* Error display */}
                  {deleteError && (
                    <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold rounded-xl flex items-center gap-2 animate-fadeIn">
                      <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600" />
                      <span>{deleteError}</span>
                    </div>
                  )}

                  {/* Success display */}
                  {deleteSuccess && (
                    <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center gap-2 animate-fadeIn">
                      <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                      <span>
                        {isBn
                          ? '✓ প্রোফাইল ও অ্যাকাউন্ট সফলভাবে মুছে ফেলা হয়েছে। সাইন আউট করা হচ্ছে...'
                          : '✓ Profile deleted successfully. Signing out...'}
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div className="px-5 py-3.5 bg-gray-50 border-t border-gray-100 flex items-center justify-between gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setDeleteStep('warning');
                      setDeleteError('');
                    }}
                    disabled={isDeleting || deleteSuccess}
                    className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-xl hover:bg-gray-100 transition cursor-pointer disabled:opacity-50"
                  >
                    {isBn ? '← পূর্ববর্তী' : '← Back'}
                  </button>

                  <button
                    id="btn-confirm-permanent-delete"
                    type="button"
                    onClick={handlePerformSecureDelete}
                    disabled={isDeleting || deleteSuccess || !deleteDisclaimerChecked || !deleteUserIdInput.trim() || !deletePasswordInput.trim()}
                    className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-xs flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isDeleting ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{isBn ? 'যাচাই ও মুছে ফেলা হচ্ছে...' : 'Deleting...'}</span>
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>{isBn ? 'স্থায়ীভাবে মুছে ফেলুন' : 'Permanently Delete'}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          LIGHTBOX MODAL FOR CERTIFICATES & PORTFOLIO IMAGES
         ========================================================================= */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="bg-white rounded-xl overflow-hidden max-w-sm sm:max-w-md w-full max-h-[85vh] flex flex-col relative shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-2.5 bg-gray-900 text-white flex items-center justify-between">
              <span className="text-xs font-semibold truncate pr-2">
                {lightboxTitle || (isBn ? 'প্রিভিউ' : 'Preview')}
              </span>
              <button
                type="button"
                onClick={() => setLightboxImage(null)}
                className="p-1 text-gray-400 hover:text-white rounded transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-2 overflow-auto flex items-center justify-center bg-gray-950 min-h-[220px]">
              <img
                src={lightboxImage}
                alt="Preview"
                className="max-h-[60vh] w-auto object-contain rounded"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export { ServiceProviderPublicProfile as ServiceProviderProfile };
export default ServiceProviderPublicProfile;
