import React, { useState, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  Store,
  Briefcase,
  Users,
  HeartHandshake,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Phone,
  User,
  MapPin,
  Lock,
  Building2,
  Droplet,
  Sparkles,
  LogIn,
  Package,
  Upload,
  Image as ImageIcon,
  Trash2,
  Camera,
  Check,
  FileText,
  GraduationCap,
  ShieldCheck,
  MessageCircle,
  Plus,
  PhoneCall,
  ExternalLink,
  Navigation,
  X,
  Share2,
  ChevronRight,
  Mail
} from 'lucide-react';
import { Language, UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { generateDistrictUniqueId } from '../utils/uniqueIdGenerator';
import { BANGLADESH_GEO_DIRECTORY } from '../data/professionsMasterData';
import { 
  registerUnifiedEntity, 
  UnifiedRegistrationRole,
  checkPermanentMemberSlot,
  submitFormData
} from '../services/unifiedRegistrationService';
import { 
  validateRegistrationDuplicates, 
  checkPhoneUniqueness, 
  checkNidUniqueness, 
  checkEmailUniqueness, 
  DUPLICATE_MESSAGES 
} from '../services/duplicateValidationService';
import { GoogleMapLocationPicker } from './common/GoogleMapLocationPicker';
import { GoogleMapLocationViewer } from './common/GoogleMapLocationViewer';

export interface RegistrationPageProps {
  lang?: Language | 'bn' | 'en';
  onLanguageToggle?: () => void;
  currentUser?: UserProfile | null | any;
  initialTab?: string;
  initialPhone?: string;
  lockedRole?: string;
  isEditMode?: boolean;
  onBack?: () => void;
  onSuccess?: (user: UserProfile, extraData?: any) => void;
  onShowToast?: (msg: string) => void;
  onNavigateToSignIn?: () => void;
}

type RegistrationRole = 'seller' | 'provider' | 'member' | 'blood';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'] as const;

const POPULAR_PROFESSIONS = [
  'ইলেকট্রিশিয়ান ও হাউজ ওয়্যারিং',
  'প্লাম্বার ও পাইপ ফিটার',
  'রঙমিস্ত্রি ও পেইন্টার',
  'রাজমিস্ত্রি ও কনস্ট্রাকশন',
  'কাঠমিস্ত্রি ও ফার্নিচার কারিগর',
  'ড্রাইভার ও মোটর মেকানিক',
  'ক্লিনার ও পরিচ্ছন্নতাকর্মী',
  'ডাক্তার ও স্বাস্থ্যসেবা',
  'হোম টিউটর ও শিক্ষক',
  'কৃষি ও পাহাড়ি বাগান বিশেষজ্ঞ',
  'অন্যান্য দক্ষ পেশাদার'
];

const SELLER_CATEGORIES = [
  'পাহাড়ি অর্গানিক কৃষিপণ্য ও মসলা',
  'শুটকি ও সিদল',
  'ফলমূল ও শাকসবজি',
  'পোশাক ও পাহাড়ি তাঁতশিল্প',
  'হস্তশিল্প ও ঐতিহ্যবাহী পণ্য',
  'মুদি ও খাদ্যসামগ্রী',
  'ইলেকট্রনিক্স ও গ্যাজেট',
  'অন্যান্য পণ্য'
];

/* =========================================================
   PHONE & WHATSAPP HELPERS
========================================================= */
const normalizeBangladeshPhone = (value: string): string => {
  let phone = (value || '').trim().replace(/[\s\-()]/g, '');
  if (phone.startsWith('+880')) {
    phone = '0' + phone.substring(4);
  } else if (phone.startsWith('880')) {
    phone = '0' + phone.substring(3);
  }
  return phone;
};

const isValidBangladeshPhone = (phone: string): boolean => {
  return /^01[3-9]\d{8}$/.test(phone);
};

const formatWhatsAppUrl = (number: string): string => {
  const digits = (number || '').replace(/[^0-9]/g, '');
  if (!digits) return '';
  if (digits.startsWith('880')) return `https://wa.me/${digits}`;
  if (digits.startsWith('0')) return `https://wa.me/88${digits}`;
  if (digits.startsWith('88')) return `https://wa.me/${digits}`;
  return `https://wa.me/880${digits}`;
};

export const RegistrationPage: React.FC<RegistrationPageProps> = ({
  lang = 'bn',
  currentUser,
  initialTab,
  initialPhone,
  lockedRole,
  isEditMode = false,
  onBack,
  onSuccess,
  onShowToast,
  onNavigateToSignIn
}) => {
  const { login } = useAuth();

  // Determine initial role
  const getNormalizedRole = (role?: string): RegistrationRole | null => {
    if (!role) return null;
    const r = role.toLowerCase();
    if (r.includes('seller') || r.includes('merchant') || r.includes('vendor')) return 'seller';
    if (r.includes('provider') || r.includes('service') || r.includes('sp')) return 'provider';
    if (r.includes('member') || r.includes('permanent')) return 'member';
    if (r.includes('blood') || r.includes('donor')) return 'blood';
    return null;
  };

  const activeInitial = lockedRole ? getNormalizedRole(lockedRole) : getNormalizedRole(initialTab);
  const [selectedRole, setSelectedRole] = useState<RegistrationRole | null>(activeInitial);

  // Core Form Input States
  const [fullName, setFullName] = useState(currentUser?.fullName || currentUser?.name || '');
  const [phone, setPhone] = useState(initialPhone || currentUser?.phone || '');
  const [whatsappNumber, setWhatsappNumber] = useState(currentUser?.whatsapp || currentUser?.whatsappNumber || initialPhone || '');
  const [sameAsPhone, setSameAsPhone] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Mandatory Blood Group across all 4 forms
  const [bloodGroup, setBloodGroup] = useState<string>(currentUser?.bloodGroup || 'O+');

  // Geographic Selection
  const [district, setDistrict] = useState<string>(currentUser?.district || 'খাগড়াছড়ি');
  const [upazila, setUpazila] = useState<string>(currentUser?.upazila || 'খাগড়াছড়ি সদর');
  const [address, setAddress] = useState(currentUser?.detailedAddress || '');

  // Google Maps Coordinates State across all forms
  const [latitude, setLatitude] = useState<number>(currentUser?.latitude ? parseFloat(currentUser.latitude) : 23.1193);
  const [longitude, setLongitude] = useState<number>(currentUser?.longitude ? parseFloat(currentUser.longitude) : 91.9847);

  // Role-specific fields
  const [businessName, setBusinessName] = useState((currentUser as any)?.shopName || (currentUser as any)?.businessName || '');
  const [productCategory, setProductCategory] = useState(SELLER_CATEGORIES[0]);
  const [profession, setProfession] = useState(POPULAR_PROFESSIONS[0]);
  const [passportPhotoUrl, setPassportPhotoUrl] = useState((currentUser as any)?.avatar || (currentUser as any)?.photoUrl || '');
  const [passportPhotoName, setPassportPhotoName] = useState('');

  // Permanent Member Job Seeker Application States
  const [fatherName, setFatherName] = useState((currentUser as any)?.fatherName || '');
  const [motherName, setMotherName] = useState((currentUser as any)?.motherName || '');
  const [education, setEducation] = useState((currentUser as any)?.education || (currentUser as any)?.educationalQualification || 'স্নাতক (ডিগ্রি/অনার্স)');
  const [presentAddress, setPresentAddress] = useState((currentUser as any)?.presentAddress || currentUser?.detailedAddress || '');
  const [permanentAddress, setPermanentAddress] = useState((currentUser as any)?.permanentAddress || '');
  const [nidNumber, setNidNumber] = useState((currentUser as any)?.nidNumber || '');
  const [nidPhotoUrl, setNidPhotoUrl] = useState((currentUser as any)?.nidPhotoUrl || '');
  const [nidPhotoName, setNidPhotoName] = useState('');
  const [cvResumeUrl, setCvResumeUrl] = useState((currentUser as any)?.cvUrl || '');
  const [cvResumeName, setCvResumeName] = useState((currentUser as any)?.cvFileName || '');
  const [territoryAvailability, setTerritoryAvailability] = useState<{
    checking: boolean;
    available: boolean;
    message: string;
  }>({
    checking: false,
    available: true,
    message: ''
  });

  // UI Status States
  const [email, setEmail] = useState((currentUser as any)?.email || '');
  const [phoneDuplicateError, setPhoneDuplicateError] = useState('');
  const [nidDuplicateError, setNidDuplicateError] = useState('');
  const [emailDuplicateError, setEmailDuplicateError] = useState('');
  const [isCheckingPhone, setIsCheckingPhone] = useState(false);
  const [isCheckingNid, setIsCheckingNid] = useState(false);
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasConsented, setHasConsented] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [registeredUser, setRegisteredUser] = useState<UserProfile | null>(null);

  // Live Blur Duplicate Check Handlers
  const handlePhoneBlurCheck = async () => {
    const clean = phone.trim().replace(/[\s\-()]/g, '');
    if (clean && clean.length >= 10 && !isEditMode) {
      setIsCheckingPhone(true);
      try {
        const res = await checkPhoneUniqueness(clean, currentUser?.id);
        if (res.isDuplicate) {
          setPhoneDuplicateError(DUPLICATE_MESSAGES.phone);
          setErrorMessage(DUPLICATE_MESSAGES.phone);
        } else {
          setPhoneDuplicateError('');
          if (errorMessage === DUPLICATE_MESSAGES.phone) setErrorMessage('');
        }
      } catch (err) {
        console.warn('Phone check error:', err);
      } finally {
        setIsCheckingPhone(false);
      }
    }
  };

  const handleNidBlurCheck = async () => {
    const clean = nidNumber.trim();
    if (clean && clean.length >= 5 && !isEditMode) {
      setIsCheckingNid(true);
      try {
        const res = await checkNidUniqueness(clean, currentUser?.id);
        if (res.isDuplicate) {
          setNidDuplicateError(DUPLICATE_MESSAGES.nid);
          setErrorMessage(DUPLICATE_MESSAGES.nid);
        } else {
          setNidDuplicateError('');
          if (errorMessage === DUPLICATE_MESSAGES.nid) setErrorMessage('');
        }
      } catch (err) {
        console.warn('NID check error:', err);
      } finally {
        setIsCheckingNid(false);
      }
    }
  };

  const handleEmailBlurCheck = async () => {
    const clean = email.trim();
    if (clean && clean.includes('@') && clean.includes('.') && !isEditMode) {
      setIsCheckingEmail(true);
      try {
        const res = await checkEmailUniqueness(clean, currentUser?.id);
        if (res.isDuplicate) {
          setEmailDuplicateError(DUPLICATE_MESSAGES.email);
          setErrorMessage(DUPLICATE_MESSAGES.email);
        } else {
          setEmailDuplicateError('');
          if (errorMessage === DUPLICATE_MESSAGES.email) setErrorMessage('');
        }
      } catch (err) {
        console.warn('Email check error:', err);
      } finally {
        setIsCheckingEmail(false);
      }
    }
  };

  // Seller Dashboard Product Addition Modal & State (For profile view)
  const [sellerProducts, setSellerProducts] = useState<any[]>([]);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [newProductName, setNewProductName] = useState('');
  const [newProductCategory, setNewProductCategory] = useState(SELLER_CATEGORIES[0]);
  const [newProductPrice, setNewProductPrice] = useState('');
  const [newProductUnit, setNewProductUnit] = useState('১ কেজি');
  const [newProductDescription, setNewProductDescription] = useState('');
  const [newProductImages, setNewProductImages] = useState<{ url: string; name: string }[]>([]);
  const [newProductImageUrl, setNewProductImageUrl] = useState('');
  const [addProductSuccessMsg, setAddProductSuccessMsg] = useState('');

  // Available districts from geographic directory
  const districtList = useMemo(() => {
    return Object.keys(BANGLADESH_GEO_DIRECTORY);
  }, []);

  // Upazila list based on selected district
  const upazilaList = useMemo(() => {
    if (!district || !BANGLADESH_GEO_DIRECTORY[district]) {
      return ['সদর'];
    }
    return BANGLADESH_GEO_DIRECTORY[district].thanas || ['সদর'];
  }, [district]);

  // Direct device upload handler for candidate passport-size photo
  const handlePassportPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage('অনুগ্রহ করে একটি সঠিক ছবির ফাইল (JPG/PNG) নির্বাচন করুন।');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const res = ev.target?.result as string;
      if (res) {
        setPassportPhotoUrl(res);
        setPassportPhotoName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  // Direct device upload handler for NID photo
  const handleNidPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrorMessage('অনুগ্রহ করে এনআইডি কার্ডের ছবি ফাইল (JPG/PNG) নির্বাচন করুন।');
      return;
    }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const res = ev.target?.result as string;
      if (res) {
        setNidPhotoUrl(res);
        setNidPhotoName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  // Direct device upload handler for candidate CV/Resume
  const handleCvUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const res = ev.target?.result as string;
      if (res) {
        setCvResumeUrl(res);
        setCvResumeName(file.name);
      }
    };
    reader.readAsDataURL(file);
  };

  // Geographic Uniqueness Check for Permanent Member (1 per district, 1 per upazila)
  useEffect(() => {
    let isMounted = true;
    if (selectedRole === 'member' && district && upazila) {
      setTerritoryAvailability({
        checking: true,
        available: true,
        message: `${upazila}, ${district} এর আঞ্চলিক কোটা যাচাই করা হচ্ছে...`
      });

      checkPermanentMemberSlot(district, upazila, phone).then((res) => {
        if (!isMounted) return;
        if (res.available) {
          setTerritoryAvailability({
            checking: false,
            available: true,
            message: `✅ ${upazila}, ${district} এর স্থায়ী সদস্য পদটি বর্তমানে উন্মুক্ত রয়েছে।`
          });
        } else {
          setTerritoryAvailability({
            checking: false,
            available: false,
            message: `⚠️ ${upazila} উপজেলায় ইতিমধ্যে একজন স্থায়ী সদস্য নিযুক্ত রয়েছেন (${res.existingMember?.name || res.existingMember?.fullName || 'নিযুক্ত প্রতিনিধি'})। নীতি অনুযায়ী প্রতি উপজেলায় ১ জন স্থায়ী সদস্য নির্ধারিত।`
          });
        }
      }).catch((err) => {
        if (!isMounted) return;
        console.warn('Territory check warning:', err);
        setTerritoryAvailability({
          checking: false,
          available: true,
          message: `✅ ${upazila}, ${district} এর স্থায়ী সদস্য পদ উন্মুক্ত।`
        });
      });
    }

    return () => {
      isMounted = false;
    };
  }, [selectedRole, district, upazila, phone]);

  // When district changes, update upazila default
  useEffect(() => {
    if (upazilaList.length > 0 && !upazilaList.includes(upazila)) {
      setUpazila(upazilaList[0]);
    }
  }, [district, upazilaList, upazila]);

  // Sync lockedRole or initialTab
  useEffect(() => {
    if (lockedRole) {
      const parsed = getNormalizedRole(lockedRole);
      if (parsed) setSelectedRole(parsed);
    } else if (initialTab && !selectedRole) {
      const parsed = getNormalizedRole(initialTab);
      if (parsed) setSelectedRole(parsed);
    }
  }, [lockedRole, initialTab]);

  // Role titles and descriptions
  const getRoleTitle = (role: RegistrationRole) => {
    switch (role) {
      case 'seller':
        return 'পণ্য বিক্রেতা রেজিস্ট্রেশন';
      case 'provider':
        return 'সেবাদাতা রেজিস্ট্রেশন';
      case 'member':
        return 'স্থায়ী সদস্য রেজিস্ট্রেশন';
      case 'blood':
        return 'রক্তদাতা রেজিস্ট্রেশন';
      default:
        return 'রেজিস্ট্রেশন ফরম';
    }
  };

  const getRoleDescription = (role: RegistrationRole) => {
    switch (role) {
      case 'seller':
        return 'দোকানদার ও পণ্য বিক্রেতাদের জন্য সহজ রেজিস্ট্রেশন';
      case 'provider':
        return 'দক্ষ মিস্ত্রি, টেকনিশিয়ান ও যেকোনো পেশাদার সেবাদাতাদের জন্য';
      case 'member':
        return 'ঝাদিমাদি ডট কমের স্থায়ী সদস্যপদ ও আজীবন বিশেষ সুবিধা';
      case 'blood':
        return 'জরুরি প্রয়োজনে বিনামূল্যে রক্তদান করে মানুষের জীবন বাঁচান';
    }
  };

  // Handle Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    setErrorMessage('');

    const cleanName = fullName.trim();
    const cleanPhone = normalizeBangladeshPhone(phone);
    const cleanWhatsApp = whatsappNumber.trim() 
      ? normalizeBangladeshPhone(whatsappNumber) 
      : cleanPhone;
    const cleanAddress = address.trim();

    // 1. Validations
    if (!cleanName) {
      setErrorMessage('অনুগ্রহ করে আপনার পূর্ণ নাম বা ব্যবসার নাম লিখুন।');
      return;
    }

    if (!isValidBangladeshPhone(cleanPhone)) {
      setErrorMessage('অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01712345678)।');
      return;
    }

    if (whatsappNumber.trim() && !isValidBangladeshPhone(cleanWhatsApp)) {
      setErrorMessage('অনুগ্রহ করে সঠিক ১১ ডিজিটের হোয়াটসঅ্যাপ নম্বর দিন।');
      return;
    }

    // Blood Group: Mandatory across all four registration forms
    if (!bloodGroup) {
      setErrorMessage('অনুগ্রহ করে আপনার রক্তের গ্রুপ নির্বাচন করুন।');
      return;
    }

    // Passport Photo: Direct device upload mandatory for seller, provider, and member (Removed from blood donor)
    if (selectedRole !== 'blood' && !passportPhotoUrl) {
      setErrorMessage('অনুগ্রহ করে ডিভাইস থেকে আপনার পাসপোর্ট সাইজ ছবি আপলোড করুন।');
      return;
    }

    // Consent Checkbox: Declaration statement checkbox must be checked
    if (!hasConsented) {
      setErrorMessage('অনুগ্রহ করে সম্মতিপত্রে টিক চিহ্ন দিন: "আমি সজ্ঞানে, জেনে-বুঝে উপরের ডেটাগুলোতে সম্মতি জ্ঞাপন করছি।"');
      return;
    }

    if (!isEditMode) {
      if (!password.trim() || password.trim().length < 6) {
        setErrorMessage('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMessage('পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড মিলছে না।');
        return;
      }
    }

    // Additional validation for Permanent Member (Job Seeker / Candidate style)
    if (selectedRole === 'member') {
      if (!nidNumber.trim()) {
        setErrorMessage('অনুগ্রহ করে প্রার্থীর জাতীয় পরিচয়পত্র (NID) নম্বর লিখুন।');
        return;
      }
      if (!presentAddress.trim() && !cleanAddress) {
        setErrorMessage('অনুগ্রহ করে প্রার্থীর বর্তমান ঠিকানা লিখুন।');
        return;
      }
      if (!permanentAddress.trim() && !cleanAddress) {
        setErrorMessage('অনুগ্রহ করে প্রার্থীর স্থায়ী ঠিকানা লিখুন।');
        return;
      }

      // Enforce geographical uniqueness: 1 per district, 1 per upazila
      if (!isEditMode) {
        try {
          const slotCheck = await checkPermanentMemberSlot(district, upazila, cleanPhone);
          if (!slotCheck.available) {
            setErrorMessage(`⚠️ এই উপজেলায় (${upazila}, ${district}) ইতিমধ্যে একজন স্থায়ী সদস্য নিযুক্ত রয়েছেন (${slotCheck.existingMember?.name || slotCheck.existingMember?.fullName || 'নিযুক্ত সদস্য'})। ঝাদিমাদি নীতি অনুযায়ী প্রতি জেলা ও উপজেলায় কেবল ১ জন স্থায়ী সদস্য অনুমোদিত।`);
            return;
          }
        } catch (slotErr) {
          console.warn('Slot check verification warning:', slotErr);
        }
      }
    }

    setIsSubmitting(true);

    try {
      // 2. Comprehensive Duplicate Data Validation Check (Phone, NID, Email)
      if (!isEditMode) {
        const dupCheck = await validateRegistrationDuplicates({
          phone: cleanPhone,
          nid: selectedRole === 'member' ? nidNumber.trim() : (nidNumber.trim() || undefined),
          email: email.trim() || undefined,
          role: selectedRole,
          excludeId: currentUser?.id,
        });

        if (dupCheck.isDuplicate) {
          const alertMsg = dupCheck.message || DUPLICATE_MESSAGES.phone;
          setErrorMessage(alertMsg);

          if (dupCheck.field === 'phone') {
            setPhoneDuplicateError(alertMsg);
            const el = document.getElementById('reg-phone');
            if (el) el.focus();
          } else if (dupCheck.field === 'nid') {
            setNidDuplicateError(alertMsg);
            const el = document.getElementById('reg-nid');
            if (el) el.focus();
          } else if (dupCheck.field === 'email') {
            setEmailDuplicateError(alertMsg);
            const el = document.getElementById('reg-email');
            if (el) el.focus();
          }

          setIsSubmitting(false);

          setTimeout(() => {
            const errBox = document.getElementById('registration-error-box');
            if (errBox) {
              errBox.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }, 80);
          return; // Prevents form submission completely
        }
      }

      // Generate Unique District Member ID
      const generatedUID = generateDistrictUniqueId(district);

      // Candidate address definitions
      const candidatePresentAddress = selectedRole === 'blood' 
        ? `${upazila}, ${district}` 
        : (presentAddress.trim() || cleanAddress || `${upazila} সদর`);
      const candidatePermanentAddress = permanentAddress.trim() || candidatePresentAddress;

      const finalAvatarPhoto = passportPhotoUrl || (
        selectedRole === 'blood' 
          ? 'https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=150' 
          : 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'
      );

      // Map role to UnifiedRegistrationRole
      const mappedRole: UnifiedRegistrationRole =
        selectedRole === 'seller' ? 'seller' :
        selectedRole === 'provider' ? 'service_provider' :
        selectedRole === 'blood' ? 'blood_donor' : 'permanent_member';

      // 3. Register via unifiedRegistrationService
      const regResult = await registerUnifiedEntity({
        role: mappedRole,
        fullName: cleanName,
        phone: cleanPhone,
        whatsapp: cleanWhatsApp,
        email: email.trim() || undefined,
        password: password.trim() || '123456',
        district: district,
        upazila: upazila,
        area: candidatePresentAddress,
        division: BANGLADESH_GEO_DIRECTORY[district]?.division || 'Chittagong Division (চট্টগ্রাম)',
        bloodGroup: bloodGroup,
        isWillingBlood: selectedRole === 'blood',
        avatarUrl: finalAvatarPhoto,
        latitude: latitude,
        longitude: longitude,
        rolePayload: {
          shopName: businessName.trim() || cleanName,
          businessCategory: productCategory,
          profession: profession,
          service_type: profession,
          nidNumber: nidNumber.trim() || undefined,
          nid_number: nidNumber.trim() || undefined,
          detailedAddress: candidatePresentAddress,
          present_address: candidatePresentAddress,
          presentAddress: candidatePresentAddress,
          permanent_address: candidatePermanentAddress,
          permanentAddress: candidatePermanentAddress,
          fatherName: fatherName.trim(),
          motherName: motherName.trim(),
          education: education.trim(),
          educationalQualification: education.trim(),
          photos_cv: cvResumeUrl || nidPhotoUrl || passportPhotoUrl || '',
          passportPhotoUrl: passportPhotoUrl,
          nidPhotoUrl: nidPhotoUrl,
          cvUrl: cvResumeUrl,
          cvFileName: cvResumeName,
          whatsapp: cleanWhatsApp,
          whatsappNumber: cleanWhatsApp,
          latitude: latitude,
          longitude: longitude
        }
      });

      if (!regResult.success) {
        if (regResult.tableErrors?.includes('duplicate_constraint_23505') || (regResult as any).isDuplicate || (regResult.error && regResult.error.includes('পূর্বেই রেজিস্ট্রেশন করা হয়েছে'))) {
          const dupMsg = 'এই তথ্যটি (ফোন নম্বর/NID/ইমেইল) দিয়ে পূর্বেই রেজিস্ট্রেশন করা হয়েছে। অনুগ্রহ করে অন্য তথ্য দিন।';
          setErrorMessage(dupMsg);
          setPhoneDuplicateError(dupMsg);
          setIsSubmitting(false);
          return;
        }
        const errorText = regResult.error || 'রেজিস্ট্রেশন সম্পন্ন করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।';
        setErrorMessage(errorText);
        if (errorText.includes('ফোন নম্বর') || errorText.includes('phone')) {
          setPhoneDuplicateError(errorText);
        } else if (errorText.includes('এনআইডি') || errorText.includes('NID')) {
          setNidDuplicateError(errorText);
        } else if (errorText.includes('ইমেইল') || errorText.includes('email')) {
          setEmailDuplicateError(errorText);
        }
        setIsSubmitting(false);
        return;
      }

      // Construct Unified User Profile object with all details
      const createdUser: UserProfile = regResult.user || {
        id: currentUser?.id || regResult.authUserId || `user_${Date.now()}`,
        uniqueId: regResult.uniqueId || generatedUID,
        memberUID: regResult.uniqueId || generatedUID,
        memberId: regResult.uniqueId || generatedUID,
        name: cleanName,
        fullName: cleanName,
        phone: cleanPhone,
        whatsapp: cleanWhatsApp,
        whatsappNumber: cleanWhatsApp,
        role: selectedRole === 'seller' ? 'vendor' : selectedRole === 'provider' ? 'professional' : 'customer',
        district: district,
        upazila: upazila,
        mahalla: candidatePresentAddress,
        division: BANGLADESH_GEO_DIRECTORY[district]?.division || 'Chittagong Division (চট্টগ্রাম)',
        bloodGroup: bloodGroup,
        detailedAddress: candidatePresentAddress,
        presentAddress: candidatePresentAddress,
        permanentAddress: candidatePermanentAddress,
        fatherName: fatherName.trim(),
        motherName: motherName.trim(),
        education: education.trim(),
        educationalQualification: education.trim(),
        avatar: finalAvatarPhoto,
        password: password.trim() || undefined,
        nidNumber: nidNumber.trim() || undefined,
        nidPhotoUrl: nidPhotoUrl,
        passportPhotoUrl: passportPhotoUrl,
        cvUrl: cvResumeUrl,
        cvFileName: cvResumeName,
        shopName: businessName.trim() || cleanName,
        latitude: latitude,
        longitude: longitude
      };

      // Load existing products if seller
      if (selectedRole === 'seller') {
        try {
          const userKey = createdUser.id || createdUser.uniqueId || cleanPhone;
          const stored = localStorage.getItem(`seller_products_${userKey}`);
          if (stored) {
            setSellerProducts(JSON.parse(stored));
          }
        } catch (_) {}
      }

      // Clear input fields upon successful registration
      setFullName('');
      setPhone('');
      setWhatsappNumber('');
      setAddress('');
      setPassword('');
      setConfirmPassword('');
      setNidNumber('');
      setFatherName('');
      setMotherName('');
      setEducation('');
      setPresentAddress('');
      setPermanentAddress('');
      setPassportPhotoUrl('');
      setNidPhotoUrl('');
      setCvResumeUrl('');
      setCvResumeName('');
      setBusinessName('');
      setHasConsented(false);

      // Login user in local context
      login(createdUser, true);
      setRegisteredUser(createdUser);

      if (onShowToast) {
        onShowToast(`অভিনন্দন! আপনার ${getRoleTitle(selectedRole || 'member')} সফলভাবে সম্পন্ন হয়েছে।`);
      }

      if (onSuccess) {
        onSuccess(createdUser, { 
          role: selectedRole, 
          uniqueId: createdUser.uniqueId || generatedUID,
          whatsapp: cleanWhatsApp,
          latitude,
          longitude
        });
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setErrorMessage(err?.message || 'রেজিস্ট্রেশন সম্পন্ন করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add Product from Seller Profile Area
  const handleAddNewProductToStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductName.trim()) {
      alert('অনুগ্রহ করে পণ্যের নাম লিখুন।');
      return;
    }
    const priceNum = parseFloat(newProductPrice);
    if (isNaN(priceNum) || priceNum <= 0) {
      alert('অনুগ্রহ করে সঠিক বিক্রয় মূল্য লিখুন।');
      return;
    }

    const uploadedUrls = newProductImages.map((img) => img.url);
    if (newProductImageUrl.trim() && !uploadedUrls.includes(newProductImageUrl.trim())) {
      uploadedUrls.unshift(newProductImageUrl.trim());
    }
    const finalPhoto = uploadedUrls[0] || 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=700&auto=format&fit=crop&q=80';
    const cleanSellerPhone = (registeredUser?.phone || phone || '').trim().replace(/[\s\-()]/g, '');

    const newProd = {
      id: `prod_${Date.now()}`,
      nameBn: newProductName.trim(),
      title: newProductName.trim(),
      category: newProductCategory,
      price: priceNum,
      regularPrice: priceNum,
      unit: newProductUnit.trim() || '১ কেজি',
      descriptionBn: newProductDescription.trim() || `${newProductName.trim()} - ১০০% খাঁটি ও গুণগত মানসম্পন্ন।`,
      description: newProductDescription.trim() || `${newProductName.trim()} - খাঁটি পাহাড়ি পণ্য।`,
      image: finalPhoto,
      images: uploadedUrls.length > 0 ? uploadedUrls : [finalPhoto],
      stock: 50,
      inStock: true,
      sellerId: registeredUser?.uniqueId || registeredUser?.id || 'seller_1',
      sellerName: registeredUser?.shopName || registeredUser?.fullName || registeredUser?.name || 'দোকানদার',
      sellerPhone: cleanSellerPhone,
      district: registeredUser?.district || district,
      upazila: registeredUser?.upazila || upazila,
      location: `${registeredUser?.upazila || upazila}, ${registeredUser?.district || district}`,
      createdAt: new Date().toISOString()
    };

    const updated = [newProd, ...sellerProducts];
    setSellerProducts(updated);

    // Save to Supabase seller_products table
    try {
      await submitFormData('seller_products', {
        seller_phone: cleanSellerPhone,
        phone_number: cleanSellerPhone,
        name: newProductName.trim(),
        title: newProductName.trim(),
        price: priceNum,
        regular_price: priceNum,
        category: newProductCategory,
        unit: newProductUnit.trim() || '১ কেজি',
        description: newProductDescription.trim() || `${newProductName.trim()} - খাঁটি পাহাড়ি পণ্য।`,
        description_bn: newProductDescription.trim() || `${newProductName.trim()} - ১০০% খাঁটি ও গুণগত মানসম্পন্ন।`,
        image_url: finalPhoto,
        image: finalPhoto,
        images: uploadedUrls.length > 0 ? uploadedUrls : [finalPhoto],
        stock: 50,
        in_stock: true,
        seller_name: registeredUser?.shopName || registeredUser?.fullName || registeredUser?.name || 'দোকানদার',
        seller_id: registeredUser?.uniqueId || registeredUser?.id || '',
        district: registeredUser?.district || district,
        upazila: registeredUser?.upazila || upazila,
      });
    } catch (saveErr) {
      console.warn('Error saving product to seller_products table:', saveErr);
    }

    // Save to localStorage
    try {
      const userKey = registeredUser?.id || registeredUser?.uniqueId || registeredUser?.phone || phone;
      localStorage.setItem(`seller_products_${userKey}`, JSON.stringify(updated));
      if (cleanSellerPhone) {
        localStorage.setItem(`seller_products_${cleanSellerPhone}`, JSON.stringify(updated));
      }
      if (registeredUser?.uniqueId) {
        localStorage.setItem(`seller_products_${registeredUser.uniqueId}`, JSON.stringify(updated));
      }
    } catch (_) {}

    // Reset modal inputs
    setNewProductName('');
    setNewProductPrice('');
    setNewProductUnit('১ কেজি');
    setNewProductDescription('');
    setNewProductImages([]);
    setNewProductImageUrl('');
    setIsAddProductModalOpen(false);
    setAddProductSuccessMsg(`'${newProd.title}' সফলভাবে আপনার অনলাইন দোকানে যুক্ত হয়েছে!`);
    setTimeout(() => setAddProductSuccessMsg(''), 4000);
  };

  // Delete product from seller store
  const handleDeleteProduct = (prodId: string) => {
    if (!confirm('আপনি কি এই পণ্যটি দোকান থেকে মুছে ফেলতে চান?')) return;
    const updated = sellerProducts.filter((p) => p.id !== prodId);
    setSellerProducts(updated);
    try {
      const userKey = registeredUser?.id || registeredUser?.uniqueId || registeredUser?.phone || phone;
      localStorage.setItem(`seller_products_${userKey}`, JSON.stringify(updated));
    } catch (_) {}
  };

  // =========================================================================
  // USER PROFILE VIEW (Requirement 7: Display profile on submission, hide form)
  // =========================================================================
  if (registeredUser) {
    const waNumber = (registeredUser as any).whatsapp || (registeredUser as any).whatsappNumber || registeredUser.phone || '';
    const waDirectLink = formatWhatsAppUrl(waNumber);
    const userLat = typeof (registeredUser as any).latitude === 'number'
      ? (registeredUser as any).latitude
      : parseFloat((registeredUser as any).latitude) || latitude || 23.1193;
    const userLng = typeof (registeredUser as any).longitude === 'number'
      ? (registeredUser as any).longitude
      : parseFloat((registeredUser as any).longitude) || longitude || 91.9847;

    return (
      <div id="user-registered-profile-view" className="min-h-screen bg-gray-50/80 py-6 px-3 sm:px-6 w-full max-w-4xl mx-auto space-y-6">
        
        {/* Profile Success Header Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-emerald-700 to-teal-800 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
          <div className="absolute -right-12 -bottom-12 w-48 h-48 bg-white/10 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 relative z-10 text-center sm:text-left">
            {/* Avatar / Photo */}
            <div className="relative w-28 h-28 sm:w-32 sm:h-32 rounded-2xl overflow-hidden border-4 border-white/90 shadow-2xl bg-white shrink-0">
              <img
                src={registeredUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200'}
                alt={registeredUser.name || 'User Avatar'}
                className="w-full h-full object-cover"
              />
              <span className="absolute bottom-1 right-1 bg-emerald-500 text-white p-1 rounded-full shadow-md">
                <CheckCircle2 size={16} />
              </span>
            </div>

            {/* Profile Info */}
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-center sm:justify-start flex-wrap gap-2">
                <span className="bg-emerald-500/30 text-white text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border border-white/20 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-300" />
                  ঝাদিমাদি ভেরিফাইড প্রোফাইল
                </span>
                <span className="bg-white/20 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                  {getRoleTitle(selectedRole || 'member')}
                </span>
              </div>

              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                {registeredUser.fullName || registeredUser.name}
              </h1>

              {registeredUser.shopName && selectedRole === 'seller' && (
                <p className="text-lg font-bold text-emerald-100 flex items-center justify-center sm:justify-start gap-1.5">
                  <Store size={20} />
                  <span>{registeredUser.shopName}</span>
                </p>
              )}

              {/* District & Upazila Badge */}
              <p className="text-sm font-semibold text-emerald-100/90 flex items-center justify-center sm:justify-start gap-1.5">
                <MapPin size={16} />
                <span>{registeredUser.upazila}, {registeredUser.district}</span>
              </p>

              {/* Digital Member ID Card */}
              {registeredUser.uniqueId && (
                <div className="pt-1">
                  <div className="inline-flex items-center gap-2 bg-black/25 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-white/25">
                    <ShieldCheck size={18} className="text-emerald-300" />
                    <span className="text-xs font-medium text-emerald-100">ডিজিটাল আইডি:</span>
                    <span className="text-sm sm:text-base font-black font-mono tracking-wider text-white">
                      {registeredUser.uniqueId}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Quick Contact & Action Bar (Direct WhatsApp & Calling) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Direct WhatsApp Messaging Button (Requirement 3 & 7) */}
          {waDirectLink ? (
            <a
              id="profile-whatsapp-btn"
              href={waDirectLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 p-4 bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white font-black text-lg rounded-2xl shadow-md hover:shadow-lg transition cursor-pointer"
            >
              <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                <MessageCircle size={22} className="fill-white stroke-emerald-600" />
              </div>
              <div className="text-left">
                <span className="block text-xs uppercase tracking-wider text-emerald-100 font-bold">সরাসরি যোগাযোগ</span>
                <span className="block text-base sm:text-lg leading-tight">হোয়াটসঅ্যাপে মেসেজ পাঠান (WhatsApp)</span>
              </div>
            </a>
          ) : (
            <div className="p-4 bg-gray-100 rounded-2xl flex items-center gap-3 text-gray-500 font-bold">
              <MessageCircle size={22} />
              <span>হোয়াটসঅ্যাপ নম্বর দেওয়া নেই</span>
            </div>
          )}

          {/* Calling Phone Button */}
          <a
            id="profile-calling-btn"
            href={`tel:${registeredUser.phone}`}
            className="flex items-center justify-center gap-3 p-4 bg-gray-900 hover:bg-black active:scale-98 text-white font-black text-lg rounded-2xl shadow-md hover:shadow-lg transition cursor-pointer"
          >
            <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center shrink-0">
              <PhoneCall size={22} />
            </div>
            <div className="text-left">
              <span className="block text-xs uppercase tracking-wider text-gray-400 font-bold">সরাসরি কল করুন</span>
              <span className="block text-base sm:text-lg leading-tight font-mono">{registeredUser.phone}</span>
            </div>
          </a>
        </div>

        {/* Primary Details Grid (Blood Group, Phone, Address, Role Specs) */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          
          {/* 1. Blood Group Card (Requirement 6 & 7) */}
          <div className="bg-red-50/90 border-2 border-red-300 rounded-3xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-14 h-14 bg-red-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md">
              <Droplet size={32} className="fill-white" />
            </div>
            <div>
              <span className="text-xs font-bold text-red-700 uppercase tracking-wider block">রক্তের গ্রুপ (Blood Group)</span>
              <span className="text-3xl font-black text-red-900 font-mono tracking-tight block mt-0.5">
                {registeredUser.bloodGroup || bloodGroup}
              </span>
              <span className="text-[11px] font-semibold text-red-600 block leading-tight">জরুরি প্রয়োজনে প্রস্তুত</span>
            </div>
          </div>

          {/* 2. WhatsApp Number Card */}
          <div className="bg-emerald-50/80 border-2 border-emerald-300 rounded-3xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-14 h-14 bg-emerald-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md">
              <MessageCircle size={30} />
            </div>
            <div>
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block">হোয়াটসঅ্যাপ নম্বর</span>
              <span className="text-xl font-black text-emerald-950 font-mono block mt-0.5">
                {waNumber || registeredUser.phone}
              </span>
              <span className="text-[11px] font-semibold text-emerald-700 block">সরাসরি চ্যাট ও মেসেজ লিঙ্ক সক্রিয়</span>
            </div>
          </div>

          {/* 3. Location / District Card */}
          <div className="bg-blue-50/80 border-2 border-blue-300 rounded-3xl p-5 shadow-xs flex items-center gap-4">
            <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shrink-0 shadow-md">
              <MapPin size={30} />
            </div>
            <div>
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wider block">এলাকা ও কর্মস্থল</span>
              <span className="text-lg font-black text-blue-950 block mt-0.5 truncate">
                {registeredUser.upazila}, {registeredUser.district}
              </span>
              <span className="text-[11px] font-semibold text-blue-700 block truncate">
                {(registeredUser as any).mahalla || (registeredUser as any).detailedAddress || `${registeredUser.upazila} সদর`}
              </span>
            </div>
          </div>

        </div>

        {/* Permanent Member Specific Details Card (Job Seeker Profile Details) */}
        {selectedRole === 'member' && (
          <div className="bg-white border-2 border-emerald-300 rounded-3xl p-5 sm:p-6 space-y-4 shadow-sm">
            <div className="flex items-center gap-3 border-b border-emerald-200 pb-3">
              <div className="p-2.5 bg-emerald-100 text-emerald-800 rounded-xl">
                <GraduationCap size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">পেশাদার পদপ্রার্থী প্রোফাইল তথ্য</h3>
                <p className="text-xs text-gray-500">স্থায়ী প্রতিনিধি ও আঞ্চলিক অভিভাবক হিসেবে সংরক্ষিত বিবরণ</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-gray-500 block">শিক্ষাগত যোগ্যতা:</span>
                <span className="text-base font-bold text-gray-900">{(registeredUser as any).education || education}</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-gray-500 block">জাতীয় পরিচয়পত্র (NID) নম্বর:</span>
                <span className="text-base font-bold font-mono text-gray-900">{(registeredUser as any).nidNumber || nidNumber || 'সংরক্ষিত'}</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-gray-500 block">পিতার নাম:</span>
                <span className="text-base font-bold text-gray-900">{(registeredUser as any).fatherName || fatherName || 'উল্লেখিত'}</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-gray-500 block">মাতার নাম:</span>
                <span className="text-base font-bold text-gray-900">{(registeredUser as any).motherName || motherName || 'উল্লেখিত'}</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-gray-500 block">বর্তমান ঠিকানা:</span>
                <span className="text-sm font-semibold text-gray-900">{(registeredUser as any).presentAddress || presentAddress || address}</span>
              </div>
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <span className="text-xs font-bold text-gray-500 block">স্থায়ী ঠিকানা:</span>
                <span className="text-sm font-semibold text-gray-900">{(registeredUser as any).permanentAddress || permanentAddress || address}</span>
              </div>
            </div>

            {/* NID & CV Attachments Status */}
            <div className="flex items-center gap-3 pt-2 flex-wrap">
              {(registeredUser as any).nidPhotoUrl && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold">
                  <CheckCircle2 size={16} className="text-emerald-600" />
                  <span>NID কার্ডের ছবি সংযুক্ত আছে</span>
                </div>
              )}
              {(registeredUser as any).cvUrl && (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-300 rounded-xl text-xs font-bold">
                  <FileText size={16} className="text-emerald-600" />
                  <span>সিভি/জীবনবৃত্তান্ত ফাইল সংরক্ষিত</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Service Provider Specific Details Card */}
        {selectedRole === 'provider' && (
          <div className="bg-white border-2 border-blue-300 rounded-3xl p-5 sm:p-6 space-y-3 shadow-sm">
            <div className="flex items-center gap-3 border-b border-blue-200 pb-3">
              <div className="p-2.5 bg-blue-100 text-blue-800 rounded-xl">
                <Briefcase size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">সেবাদাতা ও পেশাগত পরিচিতি</h3>
                <p className="text-xs text-gray-500">গ্রাহকরা আপনাকে এই সেবার জন্য সরাসরি বুকিং করতে পারবেন</p>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-200">
                <span className="text-xs font-bold text-blue-800 block">পেশা বা সেবার ধরন:</span>
                <span className="text-lg font-black text-gray-900">{profession}</span>
              </div>
              <div className="bg-blue-50/60 p-3.5 rounded-2xl border border-blue-200">
                <span className="text-xs font-bold text-blue-800 block">কাজের এলাকা:</span>
                <span className="text-lg font-black text-gray-900">{registeredUser.upazila}, {registeredUser.district}</span>
              </div>
            </div>
          </div>
        )}

        {/* =====================================================================
            PRODUCT SELLER: STORE PRODUCTS & (+) ADD BUTTON (Requirement 1 & 7)
            ===================================================================== */}
        {selectedRole === 'seller' && (
          <div className="bg-white border-2 border-emerald-400 rounded-3xl p-5 sm:p-6 space-y-5 shadow-sm">
            <div className="flex items-center justify-between flex-wrap gap-3 border-b border-emerald-200 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-emerald-700 text-white flex items-center justify-center shrink-0 shadow-md">
                  <Package size={26} />
                </div>
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-gray-900">
                    দোকানের পণ্যসমূহ (Store Products)
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-500 font-medium">
                    {registeredUser.shopName} এর পণ্য ক্যাটালগ ও ইনভেন্টরি
                  </p>
                </div>
              </div>

              {/* Prominent Plus (+) Button to Add Products in Profile Area (Requirement 1) */}
              <button
                id="seller-profile-add-product-btn"
                type="button"
                onClick={() => setIsAddProductModalOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-base rounded-2xl shadow-md hover:shadow-lg transition active:scale-98 cursor-pointer"
              >
                <Plus size={22} className="stroke-[3]" />
                <span>নতুন পণ্য যোগ করুন (+)</span>
              </button>
            </div>

            {/* Notification alert on product add */}
            {addProductSuccessMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-400 rounded-2xl text-emerald-900 font-bold text-sm flex items-center gap-2">
                <CheckCircle2 size={20} className="text-emerald-700 shrink-0" />
                <span>{addProductSuccessMsg}</span>
              </div>
            )}

            {/* Product List or Empty State */}
            {sellerProducts.length === 0 ? (
              <div className="p-8 text-center bg-emerald-50/50 rounded-2xl border-2 border-dashed border-emerald-300 space-y-3">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto">
                  <Package size={32} />
                </div>
                <h4 className="text-lg font-bold text-gray-900">এখনো কোনো পণ্য যোগ করা হয়নি</h4>
                <p className="text-sm text-gray-600 max-w-md mx-auto">
                  আপনার অনলাইন দোকানে গ্রাহকদের দেখানোর জন্য উপরের <strong>"নতুন পণ্য যোগ করুন (+)"</strong> বাটনে চাপ দিয়ে পণ্যের নাম, দাম ও ছবি যুক্ত করুন।
                </p>
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(true)}
                  className="mt-2 inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-xs hover:bg-emerald-800 transition cursor-pointer"
                >
                  <Plus size={18} />
                  <span>প্রথম পণ্য যোগ করুন</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {sellerProducts.map((prod) => (
                  <div key={prod.id} className="bg-white border-2 border-emerald-200 rounded-2xl overflow-hidden shadow-xs hover:shadow-md transition flex flex-col justify-between">
                    <div className="relative aspect-video bg-gray-100 overflow-hidden">
                      <img
                        src={prod.image || 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=500'}
                        alt={prod.title || prod.nameBn}
                        className="w-full h-full object-cover"
                      />
                      <span className="absolute top-2 right-2 bg-emerald-800/90 text-white font-bold text-xs px-2.5 py-1 rounded-full backdrop-blur-xs">
                        {prod.category}
                      </span>
                    </div>

                    <div className="p-4 space-y-2 flex-1">
                      <h4 className="font-bold text-gray-900 text-base line-clamp-1">{prod.title || prod.nameBn}</h4>
                      <p className="text-xs text-gray-500 line-clamp-2">{prod.descriptionBn || prod.description}</p>
                      
                      <div className="flex items-center justify-between pt-1">
                        <div>
                          <span className="text-lg font-black text-emerald-800 font-mono">৳{prod.price}</span>
                          <span className="text-xs text-gray-500 font-medium ml-1">/ {prod.unit || '১ কেজি'}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDeleteProduct(prod.id)}
                          className="text-red-500 hover:text-red-700 p-1.5 rounded-lg hover:bg-red-50 transition cursor-pointer"
                          title="পণ্যটি মুছুন"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Modal for Adding New Product in Seller Profile */}
        {isAddProductModalOpen && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white rounded-3xl w-full max-w-xl p-5 sm:p-7 shadow-2xl border border-emerald-200 space-y-4 my-8">
              <div className="flex items-center justify-between border-b pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
                    <Plus size={22} className="stroke-[3]" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">দোকানে নতুন পণ্য যোগ করুন</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100 cursor-pointer"
                >
                  <X size={22} />
                </button>
              </div>

              <form onSubmit={handleAddNewProductToStore} className="space-y-4">
                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">পণ্যের নাম বা শিরোনাম *</label>
                  <input
                    type="text"
                    required
                    value={newProductName}
                    onChange={(e) => setNewProductName(e.target.value)}
                    placeholder="যেমন: খাগড়াছড়ির খাঁটি পাহাড়ি মধু"
                    className="w-full p-3 text-base border-2 border-gray-300 rounded-xl focus:border-emerald-600 bg-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">ক্যাটাগরি *</label>
                    <select
                      value={newProductCategory}
                      onChange={(e) => setNewProductCategory(e.target.value)}
                      className="w-full p-3 text-sm border-2 border-gray-300 rounded-xl focus:border-emerald-600 bg-white"
                    >
                      {SELLER_CATEGORIES.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-800 mb-1">বিক্রয় মূল্য (টাকা) *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={newProductPrice}
                      onChange={(e) => setNewProductPrice(e.target.value)}
                      placeholder="যেমন: ৬৫০"
                      className="w-full p-3 text-sm font-mono font-bold border-2 border-gray-300 rounded-xl focus:border-emerald-600 bg-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">প্যাকেজিং / ইউনিট</label>
                  <input
                    type="text"
                    value={newProductUnit}
                    onChange={(e) => setNewProductUnit(e.target.value)}
                    placeholder="যেমন: ১ কেজি / ৫০০ গ্রাম / ১ পিস"
                    className="w-full p-3 text-sm border-2 border-gray-300 rounded-xl focus:border-emerald-600 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-800 mb-1">পণ্যের বিস্তারিত বিবরণ *</label>
                  <textarea
                    rows={3}
                    required
                    value={newProductDescription}
                    onChange={(e) => setNewProductDescription(e.target.value)}
                    placeholder="পণ্যের গুণগত মান, সংগ্রহের উৎস ইত্যাদি..."
                    className="w-full p-3 text-sm border-2 border-gray-300 rounded-xl focus:border-emerald-600 bg-white"
                  />
                </div>

                {/* Product Image Upload */}
                <div className="space-y-2">
                  <label className="block text-sm font-bold text-gray-800">পণ্যের ছবি আপলোড করুন</label>
                  <label className="border-2 border-dashed border-emerald-400 p-3.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer hover:bg-emerald-50/60 transition">
                    <Upload size={18} className="text-emerald-700" />
                    <span className="text-xs sm:text-sm font-bold text-emerald-900">গ্যালারি বা ক্যামেরা থেকে ছবি নিন</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            const res = ev.target?.result as string;
                            if (res) {
                              setNewProductImages([{ url: res, name: file.name }]);
                            }
                          };
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  <input
                    type="url"
                    value={newProductImageUrl}
                    onChange={(e) => setNewProductImageUrl(e.target.value)}
                    placeholder="অথবা ছবির ওয়েব লিঙ্ক (URL) পেস্ট করুন..."
                    className="w-full p-2.5 text-xs border border-gray-300 rounded-xl focus:border-emerald-600 bg-white"
                  />
                  {newProductImages.length > 0 && (
                    <div className="relative w-20 h-20 rounded-xl overflow-hidden border border-emerald-300">
                      <img src={newProductImages[0].url} alt="Preview" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => setNewProductImages([])}
                        className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  )}
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setIsAddProductModalOpen(false)}
                    className="px-4 py-2.5 text-gray-600 font-bold text-sm rounded-xl hover:bg-gray-100 cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-sm rounded-xl shadow-md transition cursor-pointer"
                  >
                    পণ্য সংরক্ষণ করুন
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* =====================================================================
            INTERACTIVE GOOGLE MAP: SAVED PINNED LOCATION (Requirement 2 & 7)
            ===================================================================== */}
        <GoogleMapLocationViewer
          latitude={userLat}
          longitude={userLng}
          title={`${registeredUser.fullName || registeredUser.name} এর নিবন্ধিত অবস্থান`}
          subtitle={`${registeredUser.upazila}, ${registeredUser.district} (গুগল ম্যাপে পিনকৃত)`}
        />

        {/* Action Controls Footer */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-gray-200">
          <button
            type="button"
            onClick={() => {
              if (onBack) onBack();
              else if (onSuccess) onSuccess(registeredUser);
            }}
            className="w-full sm:w-auto px-6 py-3.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-base rounded-2xl shadow-sm transition flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>হোম পেজে প্রবেশ করুন</span>
            <ChevronRight size={18} />
          </button>

          <button
            type="button"
            onClick={() => {
              setRegisteredUser(null);
              setSelectedRole(null);
              setErrorMessage('');
              setHasConsented(false);
            }}
            className="w-full sm:w-auto px-5 py-3 bg-white hover:bg-gray-100 text-gray-800 font-bold text-sm rounded-2xl border-2 border-gray-300 transition cursor-pointer text-center"
          >
            অন্য একটি রেজিস্ট্রেশন করুন
          </button>
        </div>

      </div>
    );
  }

  // =========================================================================
  // REGISTRATION FORM SELECTION & INPUT VIEW
  // =========================================================================
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col w-full max-w-2xl mx-auto shadow-xl border-x border-gray-200">
      
      {/* ১. হেডার সেকশন */}
      <header id="registration-header" className="bg-emerald-700 text-white p-4 sm:p-5 flex items-center justify-center text-center shadow-md sticky top-0 z-50">
        <div>
          <h1 id="registration-title" className="text-xl sm:text-2xl font-bold tracking-tight">
            {selectedRole ? getRoleTitle(selectedRole) : 'ঝাদিমাদি ডট কম (Jhadimadi.com)'}
          </h1>
          <p id="registration-subtitle" className="text-xs sm:text-sm text-emerald-100 font-medium">
            {selectedRole ? getRoleDescription(selectedRole) : 'আপনার সঠিক রেজিস্ট্রেশনের ধরন বেছে নিন'}
          </p>
        </div>
      </header>

      {/* মূল কন্টেন্ট এরিয়া */}
      <main id="registration-main-container" className="flex-1 p-3.5 sm:p-6 pb-28">

        {/* যদি কোনো রোল সিলেক্ট করা না থাকে, তবে ৪টি স্পষ্ট অপশন দেখাবে */}
        {!selectedRole ? (
          <div id="role-selection-view" className="space-y-4 pt-0">
            <div className="text-center pt-0 pb-1">
              <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-1.5">
                রেজিস্ট্রেশনের ধরন নির্বাচন করুন
              </h2>
              <p className="text-base sm:text-lg text-gray-900 font-black">
                আপনি কীভাবে আমাদের সাথে যুক্ত হতে চান? নিচের ৪টি অপশন থেকে বেছে নিন:
              </p>
            </div>

            <div className="space-y-3.5">
              {/* অপশন ১: পণ্য বিক্রেতা */}
              <button
                id="role-select-seller-btn"
                type="button"
                onClick={() => {
                  setSelectedRole('seller');
                  setErrorMessage('');
                }}
                className="w-full bg-white border-2 border-emerald-600 p-4 sm:p-5 rounded-2xl shadow-sm hover:bg-emerald-50/70 hover:shadow-md transition flex items-center justify-between text-left group cursor-pointer"
              >
                <div className="flex items-center space-x-3.5 sm:space-x-4">
                  <div className="p-3.5 bg-emerald-100 text-emerald-700 rounded-2xl group-hover:bg-emerald-600 group-hover:text-white transition shadow-sm">
                    <Store size={32} className="stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-emerald-800 transition">
                      ১. পণ্য বিক্রেতা
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 font-medium">
                      পণ্য বা দোকান বিক্রি ও অনলাইন ব্যবসার জন্য
                    </p>
                    <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 mt-0.5 inline-block">
                      Product Seller
                    </span>
                  </div>
                </div>
                <span className="text-emerald-600 text-2xl font-bold pr-1">→</span>
              </button>

              {/* অপশন ২: সেবাদাতা */}
              <button
                id="role-select-provider-btn"
                type="button"
                onClick={() => {
                  setSelectedRole('provider');
                  setErrorMessage('');
                }}
                className="w-full bg-white border-2 border-blue-600 p-4 sm:p-5 rounded-2xl shadow-sm hover:bg-blue-50/70 hover:shadow-md transition flex items-center justify-between text-left group cursor-pointer"
              >
                <div className="flex items-center space-x-3.5 sm:space-x-4">
                  <div className="p-3.5 bg-blue-100 text-blue-700 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition shadow-sm">
                    <Briefcase size={32} className="stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-blue-800 transition">
                      ২. সেবাদাতা
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 font-medium">
                      মিস্ত্রি, ইলেকট্রিশিয়ান, ড্রাইভার ও পেশাদার সেবা
                    </p>
                    <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200 mt-0.5 inline-block">
                      Service Provider / Technician
                    </span>
                  </div>
                </div>
                <span className="text-blue-600 text-2xl font-bold pr-1">→</span>
              </button>

              {/* অপশন ৩: স্থায়ী সদস্য */}
              <button
                id="role-select-member-btn"
                type="button"
                onClick={() => {
                  setSelectedRole('member');
                  setErrorMessage('');
                }}
                className="w-full bg-white border-2 border-purple-600 p-4 sm:p-5 rounded-2xl shadow-sm hover:bg-purple-50/70 hover:shadow-md transition flex items-center justify-between text-left group cursor-pointer"
              >
                <div className="flex items-center space-x-3.5 sm:space-x-4">
                  <div className="p-3.5 bg-purple-100 text-purple-700 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition shadow-sm">
                    <Users size={32} className="stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-purple-800 transition">
                      ৩. স্থায়ী সদস্য
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 font-medium">
                      স্থায়ী সদস্যপদ ও ডিজিটাল সদস্য আইডি কার্ড
                    </p>
                    <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-md border border-purple-200 mt-0.5 inline-block">
                      Permanent Member
                    </span>
                  </div>
                </div>
                <span className="text-purple-600 text-2xl font-bold pr-1">→</span>
              </button>

              {/* অপশন ৪: রক্তদাতা */}
              <button
                id="role-select-blood-btn"
                type="button"
                onClick={() => {
                  setSelectedRole('blood');
                  setErrorMessage('');
                }}
                className="w-full bg-white border-2 border-red-500 p-4 sm:p-5 rounded-2xl shadow-sm hover:bg-red-50/70 hover:shadow-md transition flex items-center justify-between text-left group cursor-pointer"
              >
                <div className="flex items-center space-x-3.5 sm:space-x-4">
                  <div className="p-3.5 bg-red-100 text-red-600 rounded-2xl group-hover:bg-red-600 group-hover:text-white transition shadow-sm">
                    <HeartHandshake size={32} className="stroke-[2.2]" />
                  </div>
                  <div>
                    <h3 className="text-xl sm:text-2xl font-bold text-gray-900 group-hover:text-red-700 transition">
                      ৪. রক্তদাতা
                    </h3>
                    <p className="text-sm sm:text-base text-gray-600 font-medium">
                      জরুরি প্রয়োজনে রক্তদান করে জীবন বাঁচাতে
                    </p>
                    <span className="text-xs font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-md border border-red-200 mt-0.5 inline-block">
                      Blood Donor
                    </span>
                  </div>
                </div>
                <span className="text-red-600 text-2xl font-bold pr-1">→</span>
              </button>
            </div>

            {/* দুই পাশে দুটি বাটন */}
            <div className="pt-4 border-t border-gray-200 grid grid-cols-2 gap-3">
              <button
                id="role-selection-return-btn"
                type="button"
                onClick={() => {
                  if (onBack) onBack();
                }}
                className="w-full py-3 px-2 sm:px-4 rounded-xl sm:rounded-2xl border-2 border-gray-300 bg-white hover:bg-gray-100 text-gray-800 font-bold text-xs sm:text-base flex items-center justify-center gap-1.5 transition shadow-xs cursor-pointer text-center"
              >
                <ArrowLeft size={16} className="shrink-0" />
                <span className="truncate">রেজিস্ট্রেশনের পৃষ্ঠায় ফিরুন</span>
              </button>

              <button
                id="role-selection-login-btn"
                type="button"
                onClick={() => {
                  if (onNavigateToSignIn) onNavigateToSignIn();
                }}
                className="w-full py-3 px-2 sm:px-4 rounded-xl sm:rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs sm:text-base flex items-center justify-center gap-1.5 transition shadow-sm cursor-pointer text-center"
              >
                <LogIn size={16} className="shrink-0" />
                <span>লগইন করুন</span>
              </button>
            </div>
          </div>
        ) : (
          /* ===================================================================
             SELECTED REGISTRATION FORM (Product Seller, Provider, Member, Blood)
             =================================================================== */
          <form id="registration-form" onSubmit={handleSubmit} className="bg-white p-5 sm:p-7 rounded-3xl shadow-sm border border-gray-200 space-y-6">
            
            {/* Form Title & Change Role Button */}
            <div className="border-b pb-4 flex items-center justify-between">
              <div>
                <h2 id="form-role-title" className="text-2xl sm:text-3xl font-bold text-emerald-800">
                  {getRoleTitle(selectedRole)}
                </h2>
                <p className="text-base sm:text-lg text-gray-600 mt-1">
                  সহজে ফর্মটি পূরণ করে রেজিস্ট্রেশন সম্পন্ন করুন
                </p>
              </div>
              {!lockedRole && (
                <button
                  id="switch-role-btn"
                  type="button"
                  onClick={() => setSelectedRole(null)}
                  className="text-sm font-semibold text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200 cursor-pointer"
                >
                  ধরন পরিবর্তন
                </button>
              )}
            </div>

            {/* এরর মেসেজ বক্স */}
            {errorMessage && (
              <div id="registration-error-box" className="p-4 bg-red-50 border-2 border-red-300 rounded-2xl flex items-start gap-3 text-red-800">
                <AlertCircle size={26} className="text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-lg">দৃষ্টি আকর্ষণ:</p>
                  <p className="text-base font-semibold">{errorMessage}</p>
                </div>
              </div>
            )}

            <div className="space-y-5">
              
              {/* ১. পূর্ণ নাম */}
              <div>
                <label htmlFor="reg-fullname" className="block text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <User size={22} className="text-emerald-700" />
                  <span>
                    {selectedRole === 'seller' ? 'আপনার পূর্ণ নাম (মালিকের নাম) *' :
                     selectedRole === 'blood' ? 'রক্তদাতার পূর্ণ নাম *' :
                     selectedRole === 'member' ? 'প্রার্থীর পূর্ণ নাম *' : 'আপনার পূর্ণ নাম *'}
                  </span>
                </label>
                <input
                  id="reg-fullname"
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="যেমন: মোঃ রফিকুল ইসলাম"
                  className="w-full p-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 bg-white text-gray-900 min-h-[56px] transition"
                />
              </div>

              {/* ২. পাসপোর্ট সাইজ ছবি আপলোড (Requirement 5: REMOVED for blood donor, KEPT for others) */}
              {selectedRole !== 'blood' && (
                <div className="bg-slate-50 border-2 border-emerald-300 rounded-2xl p-4 sm:p-5 space-y-3">
                  <label className="block text-lg sm:text-xl font-bold text-gray-800 flex items-center gap-2">
                    <Camera size={22} className="text-emerald-700" />
                    <span>ডিভাইস থেকে পাসপোর্ট সাইজ ছবি আপলোড করুন *</span>
                  </label>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <div className="relative w-28 h-32 rounded-xl border-2 border-dashed border-gray-300 bg-white flex flex-col items-center justify-center overflow-hidden shrink-0 shadow-xs">
                      {passportPhotoUrl ? (
                        <>
                          <img src={passportPhotoUrl} alt="Passport Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => { setPassportPhotoUrl(''); setPassportPhotoName(''); }}
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full shadow-xs hover:bg-red-700 cursor-pointer"
                            title="ছবি মুছুন"
                          >
                            <Trash2 size={14} />
                          </button>
                        </>
                      ) : (
                        <div className="text-center p-2">
                          <Camera size={28} className="mx-auto text-gray-400 mb-1" />
                          <span className="text-[11px] font-bold text-gray-500 block leading-tight">পাসপোর্ট সাইজ</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 space-y-2 text-left w-full">
                      <label className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-sm sm:text-base cursor-pointer transition shadow-xs w-full sm:w-auto">
                        <Upload size={18} />
                        <span>ডিভাইস গ্যালারি বা ক্যামেরা থেকে ছবি বেছে নিন</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="user"
                          onChange={handlePassportPhotoUpload}
                          className="hidden"
                        />
                      </label>
                      <p className="text-xs sm:text-sm text-gray-500 font-medium">
                        * পরিষ্কার মুখের ছবি, সরাসরি ডিভাইস গ্যালারি বা ক্যামেরা থেকে আপলোড করুন (JPG/PNG)।
                      </p>
                      {passportPhotoName && (
                        <p className="text-xs sm:text-sm font-semibold text-emerald-800 flex items-center gap-1">
                          <CheckCircle2 size={16} className="text-emerald-600" />
                          <span>আপলোড সম্পন্ন: {passportPhotoName}</span>
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* ৩. বিক্রেতার ক্ষেত্রে: দোকান বা ব্যবসার নাম ও ক্যাটাগরি (Initial product info removed as per Req 1) */}
              {selectedRole === 'seller' && (
                <>
                  <div>
                    <label htmlFor="reg-business-name" className="block text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <Store size={22} className="text-emerald-700" />
                      <span>ব্যবসা / দোকানের নাম *</span>
                    </label>
                    <input
                      id="reg-business-name"
                      type="text"
                      required
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      placeholder="যেমন: পাহাড়ি অর্গানিক স্টোর"
                      className="w-full p-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 bg-white text-gray-900 min-h-[56px] transition"
                    />
                  </div>

                  <div>
                    <label htmlFor="reg-product-cat" className="block text-xl font-bold text-gray-800 mb-2">
                      দোকানের প্রধান ক্যাটাগরি *
                    </label>
                    <select
                      id="reg-product-cat"
                      value={productCategory}
                      onChange={(e) => setProductCategory(e.target.value)}
                      className="w-full p-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-emerald-600 bg-white text-gray-900 min-h-[56px]"
                    >
                      {SELLER_CATEGORIES.map((cat, i) => (
                        <option key={i} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* ৪. সেবাদাতার পেশা নির্বাচন */}
              {selectedRole === 'provider' && (
                <div>
                  <label htmlFor="reg-profession-cat" className="block text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <Briefcase size={22} className="text-blue-700" />
                    <span>আপনার পেশা বা সেবার ধরন *</span>
                  </label>
                  <select
                    id="reg-profession-cat"
                    value={profession}
                    onChange={(e) => setProfession(e.target.value)}
                    className="w-full p-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-blue-600 bg-white text-gray-900 min-h-[56px]"
                  >
                    {POPULAR_PROFESSIONS.map((prof, i) => (
                      <option key={i} value={prof}>{prof}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* ৫. মোবাইল নম্বর (Calling Phone) - Phone Number Uniqueness Check */}
              <div>
                <label htmlFor="reg-phone" className="block text-xl font-bold text-gray-800 mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Phone size={22} className="text-emerald-700" />
                    <span>কলিং মোবাইল নম্বর *</span>
                  </div>
                  {isCheckingPhone && (
                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                      <Loader2 size={14} className="animate-spin" />
                      <span>নম্বর যাচাই করা হচ্ছে...</span>
                    </span>
                  )}
                </label>
                <input
                  id="reg-phone"
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => {
                    setPhone(e.target.value);
                    setPhoneDuplicateError('');
                    if (errorMessage === DUPLICATE_MESSAGES.phone) setErrorMessage('');
                    if (sameAsPhone) {
                      setWhatsappNumber(e.target.value);
                    }
                  }}
                  onBlur={handlePhoneBlurCheck}
                  placeholder="017xxxxxxxx (১১ ডিজিট)"
                  className={`w-full p-4 text-xl border-2 ${
                    phoneDuplicateError ? 'border-red-500 bg-red-50/20' : 'border-gray-300 bg-white'
                  } rounded-2xl focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 text-gray-900 min-h-[56px] tracking-wide transition`}
                />
                {phoneDuplicateError && (
                  <div className="mt-2.5 p-3 bg-red-50 border-2 border-red-300 rounded-xl text-red-800 text-sm font-bold flex items-start gap-2 shadow-xs animate-shake">
                    <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
                    <span>{phoneDuplicateError}</span>
                  </div>
                )}
                <p className="text-sm font-semibold text-gray-500 mt-1">
                  সরাসরি কল গ্রহণের জন্য ১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর লিখুন (সিস্টেমে পূর্বে ব্যবহৃত হলে গ্রহণযোগ্য নয়)
                </p>
              </div>

              {/* ৬. হোয়াটসঅ্যাপ নম্বর (Requirement 3: Supported across all forms, generates direct wa.me link) */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label htmlFor="reg-whatsapp" className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <MessageCircle size={22} className="text-emerald-700" />
                    <span>হোয়াটসঅ্যাপ নম্বর (WhatsApp Number) *</span>
                  </label>
                  <label className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-emerald-800 cursor-pointer select-none bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 hover:bg-emerald-100">
                    <input
                      type="checkbox"
                      checked={sameAsPhone}
                      onChange={(e) => {
                        setSameAsPhone(e.target.checked);
                        if (e.target.checked) {
                          setWhatsappNumber(phone);
                        }
                      }}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                    />
                    <span>কলিং নম্বরের মতো একই</span>
                  </label>
                </div>
                <input
                  id="reg-whatsapp"
                  type="tel"
                  required
                  value={whatsappNumber}
                  onChange={(e) => {
                    setWhatsappNumber(e.target.value);
                    if (sameAsPhone && e.target.value !== phone) {
                      setSameAsPhone(false);
                    }
                  }}
                  placeholder="017xxxxxxxx (১১ ডিজিট)"
                  className="w-full p-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 bg-white text-gray-900 min-h-[56px] tracking-wide transition"
                />
                <p className="text-sm font-semibold text-gray-500 mt-1">
                  প্রোফাইল থেকে গ্রাহক বা জরুরি প্রয়োজনে সরাসরি হোয়াটসঅ্যাপে মেসেজ পাঠাতে ব্যবহৃত হবে (https://wa.me/)
                </p>
              </div>

              {/* ইমেইল ঠিকানা (Email Address Uniqueness Check) */}
              <div>
                <label htmlFor="reg-email" className="block text-xl font-bold text-gray-800 mb-2 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Mail size={22} className="text-emerald-700" />
                    <span>ইমেইল ঠিকানা (ঐচ্ছিক) / Email Address</span>
                  </div>
                  {isCheckingEmail && (
                    <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                      <Loader2 size={14} className="animate-spin" />
                      <span>ইমেইল যাচাই করা হচ্ছে...</span>
                    </span>
                  )}
                </label>
                <input
                  id="reg-email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setEmailDuplicateError('');
                    if (errorMessage === DUPLICATE_MESSAGES.email) setErrorMessage('');
                  }}
                  onBlur={handleEmailBlurCheck}
                  placeholder="example@gmail.com (যদি থাকে)"
                  className={`w-full p-4 text-xl border-2 ${
                    emailDuplicateError ? 'border-red-500 bg-red-50/20' : 'border-gray-300 bg-white'
                  } rounded-2xl focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 text-gray-900 min-h-[56px] transition`}
                />
                {emailDuplicateError && (
                  <div className="mt-2.5 p-3 bg-red-50 border-2 border-red-300 rounded-xl text-red-800 text-sm font-bold flex items-start gap-2 shadow-xs animate-shake">
                    <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
                    <span>{emailDuplicateError}</span>
                  </div>
                )}
                <p className="text-sm font-semibold text-gray-500 mt-1">
                  ডিজিটাল ইনভয়েস, নিরাপত্তা বিজ্ঞপ্তি ও অ্যাকাউন্ট পুনরুদ্ধারের জন্য ব্যবহৃত হবে
                </p>
              </div>

              {/* ৭. জেলা ও উপজেলা নির্বাচন */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="reg-district" className="block text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <MapPin size={22} className="text-emerald-700" />
                    <span>জেলা *</span>
                  </label>
                  <select
                    id="reg-district"
                    value={district}
                    onChange={(e) => setDistrict(e.target.value)}
                    className="w-full p-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-emerald-600 bg-white text-gray-900 min-h-[56px]"
                  >
                    {districtList.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="reg-upazila" className="block text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                    <Building2 size={22} className="text-emerald-700" />
                    <span>উপজেলা / থানা *</span>
                  </label>
                  <select
                    id="reg-upazila"
                    value={upazila}
                    onChange={(e) => setUpazila(e.target.value)}
                    className="w-full p-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-emerald-600 bg-white text-gray-900 min-h-[56px]"
                  >
                    {upazilaList.map((u) => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* ৮. রক্তের গ্রুপ - সকল ৪টি ফরমের জন্য বাধ্যতামূলক (Requirement 6) */}
              <div>
                <label htmlFor="reg-bloodgroup-common" className="block text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                  <Droplet size={22} className="text-red-600 fill-red-600" />
                  <span>রক্তের গ্রুপ নির্বাচন করুন *</span>
                </label>
                <select
                  id="reg-bloodgroup-common"
                  required
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full p-4 text-xl sm:text-2xl font-bold border-2 border-red-300 rounded-2xl focus:border-red-600 bg-red-50/40 text-gray-900 min-h-[56px]"
                >
                  {BLOOD_GROUPS.map((bg) => (
                    <option key={bg} value={bg}>{bg} ({bg} পজিটিভ/নেগেটিভ)</option>
                  ))}
                </select>
                <p className="text-xs sm:text-sm font-semibold text-gray-500 mt-1">
                  * জরুরি প্রয়োজনে ও প্ল্যাটফর্ম যাচাইয়ের জন্য রক্তের গ্রুপ প্রদান বাধ্যতামূলক
                </p>
              </div>

              {/* =========================================================================
                  ৯. স্থায়ী সদস্য প্রার্থিতা ফরম (Requirement 4: Job Seeker Professional Style)
                  ========================================================================= */}
              {selectedRole === 'member' && (
                <div className="bg-slate-50/80 border-2 border-emerald-500/80 rounded-3xl p-5 sm:p-6 space-y-6 shadow-sm">
                  <div className="border-b border-emerald-200 pb-3.5 flex items-start gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-800 text-white flex items-center justify-center shrink-0 shadow-sm mt-0.5">
                      <ShieldCheck size={26} />
                    </div>
                    <div>
                      <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-xs font-black uppercase tracking-wider mb-1">
                        <span>স্থায়ী সদস্য পদপ্রার্থী প্রোফাইল</span>
                      </div>
                      <h3 className="text-xl sm:text-2xl font-black text-gray-900 leading-tight">
                        পেশাদার প্রার্থী ও আঞ্চলিক প্রতিনিধি আবেদন ফরম
                      </h3>
                      <p className="text-sm text-gray-600 font-medium mt-0.5">
                        ১ জেলা • ১ উপজেলা • ১ স্থায়ী প্রতিনিধি | নির্বাচিত সদস্য আজীবন প্ল্যাটফর্মের আঞ্চলিক অভিভাবক হিসেবে দায়িত্ব পালন করবেন
                      </p>
                    </div>
                  </div>

                  {/* শিক্ষাগত যোগ্যতা */}
                  <div>
                    <label className="block text-base font-bold text-gray-800 mb-1.5 flex items-center gap-2">
                      <GraduationCap size={18} className="text-emerald-700" />
                      <span>শিক্ষাগত যোগ্যতা (Educational Qualifications) *</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={education}
                      onChange={(e) => setEducation(e.target.value)}
                      placeholder="যেমন: স্নাতক (ডিগ্রি/অনার্স), মাস্টার্স, এইচএসসি বা সর্বোচ্চ ডিগ্রি"
                      className="w-full p-3.5 text-base border-2 border-gray-300 rounded-xl focus:border-emerald-600 bg-white"
                    />
                  </div>

                  {/* পিতা ও মাতার নাম */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-base font-bold text-gray-800 mb-1.5">
                        পিতার নাম *
                      </label>
                      <input
                        type="text"
                        required
                        value={fatherName}
                        onChange={(e) => setFatherName(e.target.value)}
                        placeholder="পিতার পূর্ণ নাম"
                        className="w-full p-3.5 text-base border-2 border-gray-300 rounded-xl focus:border-emerald-600 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-base font-bold text-gray-800 mb-1.5">
                        মাতার নাম *
                      </label>
                      <input
                        type="text"
                        required
                        value={motherName}
                        onChange={(e) => setMotherName(e.target.value)}
                        placeholder="মাতার পূর্ণ নাম"
                        className="w-full p-3.5 text-base border-2 border-gray-300 rounded-xl focus:border-emerald-600 bg-white"
                      />
                    </div>
                  </div>

                  {/* ভৌগোলিক অনন্যতা ও এলাকা সতর্কতা */}
                  <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <span className="text-xs font-black text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
                        <ShieldCheck size={16} className="text-emerald-700" />
                        ভৌগোলিক একক প্রতিনিধি কোটা (Geographical Exclusivity)
                      </span>
                      <span className="text-[11px] font-bold bg-emerald-200/80 text-emerald-900 px-2 py-0.5 rounded-full">
                        ১ জেলা • ১ উপজেলা • ১ সদস্য
                      </span>
                    </div>
                    <p className="text-xs text-gray-700 leading-relaxed font-medium">
                      নির্বাচিত জেলা <strong>{district}</strong> এবং উপজেলা <strong>{upazila}</strong>। ঝাদিমাদি প্ল্যাটফর্মে প্রতি জেলা ও উপজেলায় কেবল একজন স্থায়ী প্রতিনিধি থাকেন যিনি আজীবন এই এলাকার দায়িত্ব পরিচালনা করেন।
                    </p>
                    {territoryAvailability.message && (
                      <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 ${
                        territoryAvailability.available ? 'bg-emerald-100 text-emerald-900 border border-emerald-300' : 'bg-amber-100 text-amber-900 border border-amber-300'
                      }`}>
                        {territoryAvailability.checking ? (
                          <Loader2 size={16} className="animate-spin text-emerald-700" />
                        ) : territoryAvailability.available ? (
                          <CheckCircle2 size={16} className="text-emerald-700" />
                        ) : (
                          <AlertCircle size={16} className="text-amber-700" />
                        )}
                        <span>{territoryAvailability.message}</span>
                      </div>
                    )}
                  </div>

                  {/* বর্তমান ও স্থায়ী ঠিকানা */}
                  <div className="space-y-4">
                    <div>
                      <label className="block text-base font-bold text-gray-800 mb-1.5 flex items-center gap-2">
                        <MapPin size={18} className="text-emerald-700" />
                        <span>বর্তমান ঠিকানা (Present Address) *</span>
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={presentAddress}
                        onChange={(e) => {
                          setPresentAddress(e.target.value);
                          setAddress(e.target.value);
                        }}
                        placeholder="গ্রাম / পাড়া / মহল্লা, রোড নং, ডাকঘর, উপজেলা, জেলা"
                        className="w-full p-3.5 text-base border-2 border-gray-300 rounded-xl focus:border-emerald-600 bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-base font-bold text-gray-800 mb-1.5 flex items-center gap-2">
                        <Building2 size={18} className="text-emerald-700" />
                        <span>স্থায়ী ঠিকানা (Permanent Address) *</span>
                      </label>
                      <textarea
                        rows={2}
                        required
                        value={permanentAddress}
                        onChange={(e) => setPermanentAddress(e.target.value)}
                        placeholder="পৈতৃক ভিটা / ভোটার এলাকার স্থায়ী ঠিকানা"
                        className="w-full p-3.5 text-base border-2 border-gray-300 rounded-xl focus:border-emerald-600 bg-white"
                      />
                    </div>
                  </div>

                  {/* জাতীয় পরিচয়পত্র (NID) নম্বর ও ছবি আপলোড */}
                  <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label htmlFor="reg-nid" className="block text-base font-bold text-gray-800">
                          জাতীয় পরিচয়পত্র (NID) নম্বর *
                        </label>
                        {isCheckingNid && (
                          <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                            <Loader2 size={14} className="animate-spin" />
                            <span>এনআইডি যাচাই করা হচ্ছে...</span>
                          </span>
                        )}
                      </div>
                      <input
                        id="reg-nid"
                        type="text"
                        required
                        value={nidNumber}
                        onChange={(e) => {
                          setNidNumber(e.target.value);
                          setNidDuplicateError('');
                          if (errorMessage === DUPLICATE_MESSAGES.nid) setErrorMessage('');
                        }}
                        onBlur={handleNidBlurCheck}
                        placeholder="১০, ১৩ বা ১৭ ডিজিটের জাতীয় পরিচয়পত্র নম্বর"
                        className={`w-full p-3.5 text-base font-mono border-2 ${
                          nidDuplicateError ? 'border-red-500 bg-red-50/20' : 'border-gray-300 bg-white'
                        } rounded-xl focus:border-emerald-600`}
                      />
                      {nidDuplicateError && (
                        <div className="mt-2.5 p-3 bg-red-50 border-2 border-red-300 rounded-xl text-red-800 text-sm font-bold flex items-start gap-2 shadow-xs animate-shake">
                          <AlertCircle size={20} className="text-red-600 shrink-0 mt-0.5" />
                          <span>{nidDuplicateError}</span>
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                        <Upload size={18} className="text-emerald-700" />
                        <span>এনআইডি (NID) কার্ডের ছবি সরাসরি আপলোড করুন *</span>
                      </label>
                      <div className="flex flex-col sm:flex-row items-center gap-3">
                        <label className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-gray-900 hover:bg-black text-white rounded-xl font-bold text-sm cursor-pointer transition shadow-xs w-full sm:w-auto">
                          <Camera size={18} />
                          <span>NID ছবি বাছাই বা ক্যামেরা</span>
                          <input
                            type="file"
                            accept="image/*"
                            capture="environment"
                            onChange={handleNidPhotoUpload}
                            className="hidden"
                          />
                        </label>
                        {nidPhotoName ? (
                          <span className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
                            <CheckCircle2 size={14} className="text-emerald-600" />
                            <span>{nidPhotoName}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-gray-500">এনআইডি কার্ডের সামনের ও পেছনের স্পষ্ট ছবি যুক্ত করুন</span>
                        )}
                      </div>
                      {nidPhotoUrl && (
                        <div className="mt-2.5 relative w-44 h-28 rounded-xl border border-gray-300 overflow-hidden bg-gray-50">
                          <img src={nidPhotoUrl} alt="NID Preview" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => { setNidPhotoUrl(''); setNidPhotoName(''); }}
                            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded-full shadow-xs hover:bg-red-700 cursor-pointer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* জীবনবৃত্তান্ত / সিভি (CV/Resume) আপলোড অপশন */}
                  <div className="bg-white p-4 rounded-2xl border border-gray-200 space-y-2">
                    <label className="block text-base font-bold text-gray-800 flex items-center gap-2">
                      <FileText size={20} className="text-emerald-700" />
                      <span>জীবনবৃত্তান্ত / সিভি (CV / Resume PDF) আপলোড অপশন *</span>
                    </label>
                    <p className="text-xs text-gray-500">
                      আপনার পেশাদার পরিচয় ও অভিজ্ঞতার বিস্তারিত সিভি ফাইল (PDF, DOCX বা ছবি) সংযুক্ত করুন:
                    </p>
                    <div className="flex flex-col sm:flex-row items-center gap-3 pt-1">
                      <label className="inline-flex items-center justify-center gap-2 px-4 py-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border-2 border-emerald-600 border-dashed rounded-xl font-bold text-sm cursor-pointer transition w-full sm:w-auto">
                        <Upload size={18} className="text-emerald-700" />
                        <span>ডিভাইস থেকে সিভি ফাইল আপলোড করুন</span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,image/*"
                          onChange={handleCvUpload}
                          className="hidden"
                        />
                      </label>
                      {cvResumeName && (
                        <div className="flex items-center gap-2 bg-emerald-100/80 px-3 py-1.5 rounded-lg border border-emerald-300">
                          <FileText size={16} className="text-emerald-800" />
                          <span className="text-xs font-bold text-emerald-950 truncate max-w-xs">{cvResumeName}</span>
                          <button
                            type="button"
                            onClick={() => { setCvResumeUrl(''); setCvResumeName(''); }}
                            className="text-red-600 hover:text-red-800 p-0.5 cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                </div>
              )}

              {/* ১০. সাধারণ বর্তমান ঠিকানা (Requirement 5: REMOVED from blood donor) */}
              {selectedRole !== 'member' && selectedRole !== 'blood' && (
                <div>
                  <label htmlFor="reg-address" className="block text-xl font-bold text-gray-800 mb-2">
                    বর্তমান ঠিকানা / দোকান / গ্রাম / পাড়া (ঐচ্ছিক)
                  </label>
                  <input
                    id="reg-address"
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="যেমন: কলেজ পাড়া, সদর রোড"
                    className="w-full p-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 bg-white text-gray-900 min-h-[56px] transition"
                  />
                </div>
              )}

              {/* =========================================================================
                  ১১. GOOGLE MAPS INTERACTIVE MAP PICKER (Requirement 2: Across ALL forms)
                  ========================================================================= */}
              <GoogleMapLocationPicker
                latitude={latitude}
                longitude={longitude}
                onChange={(lat, lng) => {
                  setLatitude(lat);
                  setLongitude(lng);
                }}
                idPrefix={`reg-picker-${selectedRole}`}
                district={district}
                upazila={upazila}
                label={
                  selectedRole === 'blood' 
                    ? 'রক্তদাতার লোকেশন পিন করুন (Google Maps Location) *' 
                    : selectedRole === 'seller'
                    ? 'দোকান বা ব্যবসা প্রতিষ্ঠানের সুনির্দিষ্ট লোকেশন পিন করুন *'
                    : selectedRole === 'provider'
                    ? 'আপনার সেবাক্ষেত্র বা অবস্থানের ম্যাপ পিন নির্ধারণ করুন *'
                    : 'প্রার্থীর ভৌগোলিক অবস্থান ম্যাপে পিন করুন *'
                }
              />

              {/* ১২. পাসওয়ার্ড সেকশন (যদি নতুন রেজিস্ট্রেশন হয়) */}
              {!isEditMode && (
                <>
                  <div>
                    <label htmlFor="reg-password" className="block text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <Lock size={22} className="text-emerald-700" />
                      <span>পাসওয়ার্ড তৈরি করুন (কমপক্ষে ৬ অক্ষর) *</span>
                    </label>
                    <div className="relative">
                      <input
                        id="reg-password"
                        type={showPassword ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="******"
                        className="w-full p-4 pr-14 text-xl border-2 border-gray-300 rounded-2xl focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 bg-white text-gray-900 min-h-[56px] transition"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-800 p-2 cursor-pointer"
                        aria-label="পাসওয়ার্ড দেখুন"
                      >
                        {showPassword ? <EyeOff size={24} /> : <Eye size={24} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="reg-confirm-password" className="block text-xl font-bold text-gray-800 mb-2 flex items-center gap-2">
                      <Lock size={22} className="text-emerald-700" />
                      <span>পাসওয়ার্ড নিশ্চিত করুন *</span>
                    </label>
                    <input
                      id="reg-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="******"
                      className="w-full p-4 text-xl border-2 border-gray-300 rounded-2xl focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 bg-white text-gray-900 min-h-[56px] transition"
                    />
                  </div>
                </>
              )}

              {/* =========================================================================
                  ১৩. সম্মতি জ্ঞাপন চেকবক্স (Requirement 6: Mandatory consent before submit)
                  ========================================================================= */}
              <div className="pt-2">
                <label className={`flex items-start gap-3 p-4 sm:p-4.5 rounded-2xl border-2 transition cursor-pointer select-none ${
                  hasConsented 
                    ? 'bg-emerald-50/90 border-emerald-500 text-emerald-950 shadow-xs' 
                    : 'bg-gray-50 border-gray-300 text-gray-800 hover:bg-gray-100/70'
                }`}>
                  <input
                    type="checkbox"
                    id="reg-consent-checkbox"
                    required
                    checked={hasConsented}
                    onChange={(e) => setHasConsented(e.target.checked)}
                    className="w-6 h-6 mt-0.5 rounded-lg text-emerald-700 focus:ring-emerald-500 border-gray-400 shrink-0 cursor-pointer"
                  />
                  <div className="space-y-0.5">
                    <span className="text-base sm:text-lg font-extrabold leading-snug block">
                      আমি সজ্ঞানে, জেনে-বুঝে উপরের ডেটাগুলোতে সম্মতি জ্ঞাপন করছি।
                    </span>
                    <span className="text-xs sm:text-sm text-gray-500 font-medium block">
                      (শর্তাবলী ও তথ্যের সত্যতা নিশ্চিত করতে চেকবক্সটিতে টিক চিহ্ন দিন। টিক চিহ্ন না দিলে সাবমিট বাটন নিষ্ক্রিয় থাকবে)
                    </span>
                  </div>
                </label>
              </div>

              {/* =========================================================================
                  ১৪. সাবমিট বাটন (Requirement 6: Disabled until consent checkbox is checked)
                  ========================================================================= */}
              <div className="pt-2">
                <button
                  id="reg-submit-btn"
                  type="submit"
                  disabled={isSubmitting || !hasConsented}
                  className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-gray-300 disabled:text-gray-500 disabled:cursor-not-allowed text-white font-bold text-2xl p-5 rounded-2xl shadow-lg hover:shadow-xl transition flex items-center justify-center space-x-3 min-h-[64px] cursor-pointer active:scale-98"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={28} className="animate-spin" />
                      <span>তথ্য সংরক্ষণ করা হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={28} />
                      <span>রেজিস্ট্রেশন সম্পন্ন করুন</span>
                    </>
                  )}
                </button>
              </div>

              {/* রেজিস্ট্রেশনের পৃষ্ঠায় ফিরুন বাটন */}
              <div className="pt-1 flex items-center justify-center">
                <button
                  id="form-return-to-roles-btn"
                  type="button"
                  onClick={() => {
                    setSelectedRole(null);
                    setErrorMessage('');
                  }}
                  className="inline-flex items-center gap-2 text-emerald-800 hover:text-emerald-950 font-bold text-sm sm:text-base py-2.5 px-4 rounded-xl hover:bg-emerald-50 transition cursor-pointer"
                >
                  <ArrowLeft size={18} />
                  <span>রেজিস্ট্রেশনের পৃষ্ঠায় ফিরুন (ধরন নির্বাচন)</span>
                </button>
              </div>

            </div>
          </form>
        )}

      </main>
    </div>
  );
};

export default RegistrationPage;
