import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Camera,
  ArrowLeft,
  Search,
  Plus,
  X,
  Check,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Lock,
  Phone,
  User,
  MapPin,
  Briefcase,
  Droplet,
  Clock,
  DollarSign,
  FileText,
  ShieldCheck,
  CheckSquare,
  Square,
  Sparkles,
  Layers,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Language } from '../types';
import { 
  ALL_PROFESSIONS_FLAT_LIST, 
  FEATURED_12_CORE_PROFESSIONS,
  CORE_6_SERVICE_CATEGORIES,
  BANGLADESH_GEO_DIRECTORY 
} from '../data/professionsMasterData';
import { databaseService } from '../services/databaseService';
import { generateJhadimadiCleanUID } from '../utils/uniqueIdGenerator';
import { supabase } from '../supabase';
import { registerUnifiedEntity } from '../services/unifiedRegistrationService';
import { 
  uploadFileToSupabaseStorage, 
  isLocalTransientUrl 
} from '../utils/directSupabaseStorage';
import { smartSupabaseInsert, prepareServiceProviderPayload } from '../utils/supabaseDataService';

export interface ServiceProviderRegistrationFormProps {
  currentUser?: any;
  initialData?: any;
  isEditMode?: boolean;
  lang?: Language | 'bn' | 'en' | string;
  embedded?: boolean;
  onBack?: () => void;
  onSuccess?: (data: any) => void;
  onSubmitSuccess?: (data: any) => void;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

const POPULAR_PROFESSIONS = [
  'প্লাম্বার ও পাইপ ফিটার',
  'ইলেকট্রিশিয়ান ও হাউজ ওয়্যারিং',
  'ক্লিনার ও পরিচ্ছন্নতাকর্মী',
  'দিনমজুর ও সাধারণ শ্রমিক',
  'রাজমিস্ত্রি ও নির্মাণ শ্রমিক',
  'কাঠমিস্ত্রি ও ফার্নিচার কারিগর',
  'রঙমিস্ত্রি ও পেইন্টার',
  'ড্রাইভার ও মোটর মেকানিক',
  'এসি ও ফ্রিজ টেকনিশিয়ান',
  'হোম টিউটর ও গৃহশিক্ষক',
  'নার্স ও হোম কেয়ারগিভার',
  'দর্জি ও টেইলারিং কারিগর',
];

const EXPERIENCE_OPTIONS = [
  { value: '০', labelBn: 'নতুন (১ বছরের কম)', labelEn: 'Beginner (Less than 1 yr)' },
  { value: '১', labelBn: '১ বছর', labelEn: '1 Year' },
  { value: '২', labelBn: '২ বছর', labelEn: '2 Years' },
  { value: '৩', labelBn: '৩ বছর', labelEn: '3 Years' },
  { value: '৪', labelBn: '৪ বছর', labelEn: '4 Years' },
  { value: '৫', labelBn: '৫ বছর', labelEn: '5 Years' },
  { value: '৭', labelBn: '৬ - ৮ বছর', labelEn: '6 - 8 Years' },
  { value: '১০', labelBn: '১০+ বছর (বিশেষজ্ঞ)', labelEn: '10+ Years (Expert)' },
];

/* =========================================================
   PHONE NORMALIZATION HELPERS
========================================================= */
const normalizeBangladeshPhone = (value: string): string => {
  let phone = value.trim().replace(/[\s\-()]/g, '');
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

export const ServiceProviderRegistrationForm: React.FC<ServiceProviderRegistrationFormProps> = ({
  currentUser,
  initialData,
  isEditMode = false,
  lang = 'bn',
  embedded = false,
  onBack,
  onSuccess,
  onSubmitSuccess,
}) => {
  const effectiveUser = initialData || currentUser;
  const [currentLang, setCurrentLang] = useState<'bn' | 'en'>(lang === 'en' ? 'en' : 'bn');
  const isBn = currentLang === 'bn';

  const initialProfessions = useMemo(() => {
    if (Array.isArray(effectiveUser?.selectedProfessions) && effectiveUser.selectedProfessions.length > 0) {
      return effectiveUser.selectedProfessions;
    }
    if (Array.isArray(effectiveUser?.skills) && effectiveUser.skills.length > 0) {
      return effectiveUser.skills;
    }
    if (effectiveUser?.profession) {
      return [effectiveUser.profession];
    }
    return [];
  }, [effectiveUser]);

  const [fullName, setFullName] = useState(effectiveUser?.name || effectiveUser?.fullName || '');
  const [mobileNumber, setMobileNumber] = useState(effectiveUser?.phone || effectiveUser?.mobileNumber || '');
  const [password, setPassword] = useState(effectiveUser?.password || '');
  const [showPassword, setShowPassword] = useState(false);
  
  const [selectedProfessions, setSelectedProfessions] = useState<string[]>(initialProfessions);
  const [professionSearch, setProfessionSearch] = useState('');
  const [isProfessionDropdownOpen, setIsProfessionDropdownOpen] = useState(false);
  const [is1000ExplorerOpen, setIs1000ExplorerOpen] = useState(false);
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all');
  const [customProfessionInput, setCustomProfessionInput] = useState<string>('');
  const professionDropdownRef = useRef<HTMLDivElement>(null);

  const [experienceYears, setExperienceYears] = useState(
    effectiveUser?.experienceYears !== undefined
      ? String(effectiveUser.experienceYears)
      : effectiveUser?.experience !== undefined
      ? String(effectiveUser.experience)
      : '৩'
  );
  const [dailyWage, setDailyWage] = useState(
    effectiveUser?.dailyRate || effectiveUser?.dailyWage || effectiveUser?.rate || ''
  );
  const [bio, setBio] = useState(effectiveUser?.bio || effectiveUser?.bioText || effectiveUser?.serviceDescription || '');

  const allDistricts = useMemo(() => {
    const keys = Object.keys(BANGLADESH_GEO_DIRECTORY);
    const khag = 'খাগড়াছড়ি';
    const others = keys.filter((d) => d !== khag);
    return [khag, ...others];
  }, []);

  const [district, setDistrict] = useState(effectiveUser?.district || 'খাগড়াছড়ি');
  
  const upazilasForDistrict = useMemo(() => {
    const entry = BANGLADESH_GEO_DIRECTORY[district];
    return entry?.thanas || ['খাগড়াছড়ি সদর'];
  }, [district]);

  const [upazila, setUpazila] = useState(
    effectiveUser?.upazila || effectiveUser?.thana || upazilasForDistrict[0] || 'খাগড়াছড়ি সদর'
  );
  const [paraMahalla, setParaMahalla] = useState(
    effectiveUser?.paraMahalla || effectiveUser?.area || effectiveUser?.mahalla || effectiveUser?.para || ''
  );

  const [bloodGroup, setBloodGroup] = useState(effectiveUser?.bloodGroup || 'O+');

  const [serviceProviderPhoto, setServiceProviderPhoto] = useState<string>(() => {
    return (
      effectiveUser?.serviceProviderPhotoUrl ||
      effectiveUser?.serviceProviderPhoto ||
      effectiveUser?.spPhoto ||
      (effectiveUser?.role === 'service_provider' || effectiveUser?.role === 'professional' || effectiveUser?.role === 'service'
        ? effectiveUser?.avatar || effectiveUser?.profilePic || effectiveUser?.photoUrl
        : '') ||
      ''
    );
  });
  const [serviceProviderPhotoFile, setServiceProviderPhotoFile] = useState<File | null>(null);
  const serviceProviderPhotoInputRef = useRef<HTMLInputElement>(null);

  const [termsAccepted, setTermsAccepted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        professionDropdownRef.current &&
        !professionDropdownRef.current.contains(event.target as Node)
      ) {
        setIsProfessionDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (upazilasForDistrict && upazilasForDistrict.length > 0) {
      if (!upazilasForDistrict.includes(upazila)) {
        setUpazila(upazilasForDistrict[0]);
      }
    }
  }, [district, upazilasForDistrict, upazila]);

  const handleServiceProviderPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert(isBn ? 'অনুগ্রহ করে শুধুমাত্র ছবি ফাইল আপলোড করুন।' : 'Please upload an image file only.');
      return;
    }

    setServiceProviderPhotoFile(file);
    try {
      const previewUrl = URL.createObjectURL(file);
      setServiceProviderPhoto(previewUrl);
    } catch {
      const reader = new FileReader();
      reader.onload = (uploadEvent) => {
        const dataUrl = uploadEvent.target?.result as string;
        setServiceProviderPhoto(dataUrl);
      };
      reader.readAsDataURL(file);
    }
  };

  const filteredProfessions = useMemo(() => {
    const query = professionSearch.trim().toLowerCase();
    return ALL_PROFESSIONS_FLAT_LIST.filter((p) => {
      const matchCat =
        selectedCategoryTab === 'all' ||
        p.category === selectedCategoryTab ||
        (p.categoryEn && p.categoryEn.toLowerCase() === selectedCategoryTab.toLowerCase());
      if (!matchCat) return false;
      if (!query) return true;
      return (
        p.name.toLowerCase().includes(query) ||
        p.category.toLowerCase().includes(query) ||
        (p.categoryEn && p.categoryEn.toLowerCase().includes(query)) ||
        (p.subCategory && p.subCategory.toLowerCase().includes(query)) ||
        ((p as any).keywords && (p as any).keywords.toLowerCase().includes(query))
      );
    }).slice(0, 50);
  }, [professionSearch, selectedCategoryTab]);

  const toggleProfession = (profName: string) => {
    const trimmed = profName.trim();
    if (!trimmed) return;
    if (selectedProfessions.includes(trimmed)) {
      setSelectedProfessions((prev) => prev.filter((p) => p !== trimmed));
    } else {
      setSelectedProfessions((prev) => [...prev, trimmed]);
      setProfessionSearch('');
    }
  };

  const handleAddCustomProfession = (customText?: string) => {
    const raw = customText !== undefined ? customText : (customProfessionInput || professionSearch);
    const trimmed = raw.trim();
    if (!trimmed) return;
    if (!selectedProfessions.includes(trimmed)) {
      setSelectedProfessions((prev) => [...prev, trimmed]);
    }
    setCustomProfessionInput('');
    setProfessionSearch('');
    setIsProfessionDropdownOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!fullName.trim()) {
      setErrorMessage(isBn ? 'অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন।' : 'Please enter your full name.');
      return;
    }

    const cleanPhone = normalizeBangladeshPhone(mobileNumber);
    if (!isValidBangladeshPhone(cleanPhone)) {
      setErrorMessage(
        isBn
          ? 'অনুগ্রহ করে সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন (যেমন: 01870592699)।'
          : 'Please enter a valid 11-digit mobile number.'
      );
      return;
    }

    if (!password.trim() || password.length < 4) {
      setErrorMessage(
        isBn
          ? 'অনুগ্রহ করে অ্যাকাউন্টের জন্য শক্তিশালী পাসওয়ার্ড লিখুন।'
          : 'Please enter a password for your account.'
      );
      return;
    }

    if (selectedProfessions.length === 0) {
      setErrorMessage(
        isBn
          ? 'অনুগ্রহ করে অন্তত একটি পেশা বা সেবার ক্যাটাগরি নির্বাচন করুন।'
          : 'Please select at least one profession.'
      );
      return;
    }

    if (!termsAccepted) {
      setErrorMessage(
        isBn
          ? 'সম্মতি দিতে "আমি সজ্ঞানে ও স্বেচ্ছায় তথ্যসমূহ প্রদান করলাম" চেকবক্সে টিক দিন।'
          : 'Please check the terms confirmation checkbox to proceed.'
      );
      return;
    }

    setIsSubmitting(true);

    try {
      /* ===================================================
         DUPLICATE CHECK (PHONE)
      =================================================== */
      if (!isEditMode) {
        const { data: existingPros, error: duplicateErr } = await supabase
          .from('service_providers')
          .select('phone')
          .eq('phone', cleanPhone);

        if (!duplicateErr && existingPros && existingPros.length > 0) {
          setIsSubmitting(false);
          setErrorMessage('এই ফোন নম্বরটি দিয়ে পূর্বেই রেজিস্ট্রেশন করা হয়েছে।');
          return;
        }
      }

      const proId =
        effectiveUser?.id ||
        effectiveUser?.memberUID ||
        generateJhadimadiCleanUID(district, 'service_provider');

      const primaryProfession = selectedProfessions[0] || 'সার্ভিস প্রোভাইডার';

      let permanentPhotoUrl = serviceProviderPhoto;
      if (serviceProviderPhotoFile) {
        permanentPhotoUrl = await uploadFileToSupabaseStorage(
          'avatars',
          serviceProviderPhotoFile,
          serviceProviderPhotoFile.name,
          'service_providers'
        );
      } else if (serviceProviderPhoto && isLocalTransientUrl(serviceProviderPhoto)) {
        permanentPhotoUrl = await uploadFileToSupabaseStorage(
          'avatars',
          serviceProviderPhoto,
          'avatar.jpg',
          'service_providers'
        );
      }
      setServiceProviderPhoto(permanentPhotoUrl);

      const preparedData = {
        ...(effectiveUser || {}),
        id: proId,
        memberUID: proId,
        uniqueId: proId,
        memberId: proId,
        fullName: fullName.trim(),
        name: fullName.trim(),
        phone: cleanPhone,
        mobileNumber: cleanPhone,
        password: password.trim(),
        selectedProfessions,
        skills: selectedProfessions,
        skillsList: selectedProfessions,
        profession: primaryProfession,
        professionBn: primaryProfession,
        serviceCategory: primaryProfession,
        experienceYears: Number(experienceYears) || 1,
        experience: Number(experienceYears) || 1,
        dailyRate: dailyWage.trim() || '৬০০',
        dailyWage: dailyWage.trim() || '৬০০',
        rate: dailyWage.trim() || '৬০০',
        bio: bio.trim(),
        bioText: bio.trim(),
        serviceDescription: bio.trim(),
        district,
        upazila,
        thana: upazila,
        paraMahalla: paraMahalla.trim(),
        area: paraMahalla.trim(),
        mahalla: paraMahalla.trim(),
        bloodGroup,
        avatar: permanentPhotoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
        profilePic: permanentPhotoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
        serviceProviderPhotoUrl: permanentPhotoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
        serviceProviderPhoto: permanentPhotoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
        role: 'service_provider',
        memberType: 'service_provider',
        isNidVerified: true,
        isVerified: true,
        isPaidMember: true,
        rating: effectiveUser?.rating || 5.0,
        completedJobs: effectiveUser?.completedJobs || 1,
        termsAccepted: true,
        privacyPolicyConsentAccepted: true,
        joinedDate: effectiveUser?.joinedDate || new Date().toISOString().split('T')[0],
        createdAt: effectiveUser?.createdAt || new Date().toISOString(),
      };

      const searchTags = Array.from(
        new Set([
          ...selectedProfessions,
          primaryProfession,
          district,
          upazila,
          paraMahalla.trim(),
          ...selectedProfessions.flatMap((p) => {
            const matched = ALL_PROFESSIONS_FLAT_LIST.find((item) => item.name === p);
            return matched
              ? [matched.category, matched.categoryEn, matched.subCategory, (matched as any).keywords]
              : [];
          }),
        ].filter(Boolean))
      ).map((t) => String(t).toLowerCase());

      preparedData.skills = selectedProfessions;
      preparedData.skillsList = selectedProfessions;
      preparedData.selectedProfessions = selectedProfessions;
      preparedData.tags = searchTags;
      preparedData.searchTags = searchTags;

      const unifiedResult = await registerUnifiedEntity({
        role: 'service_provider',
        fullName: fullName.trim(),
        phone: cleanPhone,
        password: password.trim() || '123456',
        district,
        upazila,
        area: paraMahalla.trim(),
        avatarUrl: permanentPhotoUrl || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200',
        bloodGroup,
        rolePayload: {
          profession: primaryProfession,
          professionBn: primaryProfession,
          selectedProfessions,
          skills: selectedProfessions,
          tags: searchTags,
          dailyWage: dailyWage.trim(),
          experienceYears,
          bio: bio.trim(),
        },
      });

      if (unifiedResult.user) {
        preparedData.id = unifiedResult.user.id;
        preparedData.uid = unifiedResult.user.uid;
      }

      try {
        const proPayload = prepareServiceProviderPayload(preparedData);
        await smartSupabaseInsert('service_providers', proPayload);
      } catch (err) {
        console.warn('Direct service_providers Supabase insert warning:', err);
      }

      await databaseService.saveUserProfile(preparedData as any, { skipUniqueCheck: true });
      await databaseService.registerProvider(preparedData as any);

      setSuccessMessage(
        isBn
          ? 'অভিনন্দন! আপনার সার্ভিস প্রোভাইডার রেজিস্ট্রেশন সফলভাবে সম্পন্ন হয়েছে।'
          : 'Congratulations! Your service provider registration was successful.'
      );

      setIsSubmitting(false);

      if (onSubmitSuccess) {
        onSubmitSuccess(preparedData);
      }
      if (onSuccess) {
        onSuccess(preparedData);
      }
    } catch (err: any) {
      console.error('Registration save error:', err);
      setIsSubmitting(false);
      setErrorMessage(
        isBn
          ? 'রেজিস্ট্রেশন সংরক্ষণে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।'
          : 'Failed to save registration. Please try again.'
      );
    }
  };

  const spFormTitle = isEditMode
    ? (isBn ? 'সেবা দানকারী তথ্য এডিট' : 'Edit Service Provider')
    : (isBn ? 'সেবা দানকারী রেজিস্ট্রেশন ফর্ম' : 'Service Provider Registration Form');

  return (
    <div className={embedded ? "w-full space-y-4" : "w-full max-w-xl mx-auto bg-white pb-6 my-0 text-gray-900"}>
      
      {!embedded && (
        <div 
          className="w-full bg-white pt-6 sm:pt-8 pb-3.5 px-4 text-center select-none mb-2"
          style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 1.5rem)' }}
        >
          <div className="max-w-md mx-auto">
            <h1 className="text-xl sm:text-2xl font-black text-black tracking-tight leading-tight">
              {spFormTitle}
            </h1>
            <p className="text-xs sm:text-sm text-gray-600 font-medium leading-relaxed mt-1.5 max-w-sm mx-auto">
              {isEditMode
                ? (isBn ? 'আপনার সেবা প্রদানকারী তথ্য আপডেট করতে নিচের ফর্মটি পূরণ করুন।' : 'Please fill out the form below to update your details.')
                : (isBn ? 'jhadimadi.com-এ সেবা প্রদানকারী হিসেবে যুক্ত হতে নিচের রেজিস্ট্রেশন ফর্ম পূরণ করুন' : 'Fill out the form below to join as a service provider.')}
            </p>
          </div>
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3.5 bg-red-50 border border-red-200 text-red-800 text-xs font-medium rounded-xl flex items-start gap-2 animate-shake">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="mb-4 p-3.5 bg-gray-100 border border-gray-300 text-gray-900 text-xs font-bold rounded-xl flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-black shrink-0 mt-0.5" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Profile Image (Passport-size from device/Google Drive) */}
        <div className="flex flex-col items-center justify-center p-4 bg-gray-50 border border-gray-200 rounded-2xl">
          <label className="block text-xs font-bold text-gray-800 mb-2 text-center">
            {isBn ? 'পাসপোর্ট সাইজ ছবি আপলোড (ডিভাইস বা ড্রাইভ স্টোরেজ)' : 'Passport-Size Photo (Device / Drive)'}
          </label>
          <div
            id="sp-profile-image-box"
            onClick={() => serviceProviderPhotoInputRef.current?.click()}
            className="w-28 h-36 rounded-xl border-2 border-dashed border-emerald-600/40 hover:border-black bg-white cursor-pointer flex flex-col items-center justify-center relative overflow-hidden transition group shadow-xs"
            title={isBn ? 'পাসপোর্ট ছবি নির্বাচন করতে ক্লিক করুন' : 'Click to select passport photo'}
          >
            {serviceProviderPhoto ? (
              <>
                <img
                  src={serviceProviderPhoto}
                  alt="Service Provider Profile"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex flex-col items-center justify-center text-white text-[11px] font-bold gap-1 p-1 text-center">
                  <Camera className="w-4 h-4" />
                  <span>{isBn ? 'ছবি পরিবর্তন' : 'Change'}</span>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center text-center p-2 text-gray-500">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mb-1.5 group-hover:scale-105 transition">
                  <Camera className="w-5 h-5" />
                </div>
                <span className="text-[11px] font-bold text-gray-800 leading-tight">
                  {isBn ? 'পাসপোর্ট ছবি' : 'Passport Photo'}
                </span>
                <span className="text-[9px] text-gray-500 mt-0.5">
                  {isBn ? '৩:৪ অনুপাত' : '3:4 Portrait'}
                </span>
              </div>
            )}
          </div>

          <input
            ref={serviceProviderPhotoInputRef}
            id="sp-photo-file-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleServiceProviderPhotoUpload}
          />

          <div className="mt-2.5 text-center">
            <button
              type="button"
              onClick={() => serviceProviderPhotoInputRef.current?.click()}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 underline cursor-pointer"
            >
              {serviceProviderPhoto
                ? (isBn ? 'ডিভাইস বা ড্রাইভ থেকে ছবি পরিবর্তন করুন' : 'Change photo from device/drive')
                : (isBn ? 'ডিভাইস বা গুগল ড্রাইভ থেকে ছবি নির্বাচন করুন' : 'Select photo from device / drive')}
            </button>
            <p className="text-[10px] text-gray-500 mt-0.5">
              {isBn ? 'নোট: এই ছবি পাসপোর্ট সাইজে আপনার প্রোফাইল পেজে প্রদর্শিত হবে।' : 'Note: Displayed as passport-size photo on your profile.'}
            </p>
          </div>
        </div>

        {/* Full Name */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            {isBn ? 'পূর্ণ নাম' : 'Full Name'} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <User className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={isBn ? 'যেমন: নয়ন চাকমা' : 'e.g. Nayan Chakma'}
              className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-xs bg-white text-gray-900 focus:border-black focus:outline-none transition shadow-2xs font-medium"
              required
            />
          </div>
        </div>

        {/* Mobile Number */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            {isBn ? 'মোবাইল / হোয়াটসঅ্যাপ নম্বর' : 'Mobile / WhatsApp Number'} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Phone className="w-4 h-4" />
            </div>
            <input
              type="tel"
              value={mobileNumber}
              onChange={(e) => setMobileNumber(e.target.value)}
              placeholder="01XXXXXXXXX"
              className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-xl text-xs bg-white text-gray-900 focus:border-black focus:outline-none transition shadow-2xs font-medium"
              required
            />
          </div>
        </div>

        {/* Password */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            {isBn ? 'অ্যাকাউন্ট পাসওয়ার্ড' : 'Account Password'} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Lock className="w-4 h-4" />
            </div>
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="পাসওয়ার্ড লিখুন"
              className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-xl text-xs bg-white text-gray-900 focus:border-black focus:outline-none transition shadow-2xs font-medium"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-700 cursor-pointer"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* 1,000+ Profession Selection & Custom Input */}
        <div className="space-y-2 p-3 bg-gray-50 border border-gray-200 rounded-2xl" ref={professionDropdownRef}>
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold text-gray-900">
              {isBn ? 'পেশা ও সেবার ক্যাটাগরি নির্বাচন' : 'Profession & Service Categories'} <span className="text-red-500">*</span>
            </label>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              {isBn ? '১,০০০+ প্রফেশনাল ক্যাটাগরি' : '1,000+ Professions'}
            </span>
          </div>

          {/* Currently Selected Professions Chips */}
          {selectedProfessions.length > 0 && (
            <div className="flex flex-wrap gap-1.5 p-2 bg-white border border-gray-200 rounded-xl">
              {selectedProfessions.map((prof) => (
                <span
                  key={prof}
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black text-white text-xs font-medium shadow-2xs"
                >
                  <span>{prof}</span>
                  <button
                    type="button"
                    onClick={() => toggleProfession(prof)}
                    className="hover:bg-gray-800 rounded-full p-0.5 transition cursor-pointer"
                    title={isBn ? 'বাদ দিন' : 'Remove'}
                  >
                    <X className="w-3 h-3 text-gray-300 hover:text-white" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* 12 Core Featured Professions Quick Selector */}
          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-[11px] font-bold text-gray-700">
              <span className="flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                <span>{isBn ? 'জনপ্রিয় ১২টি পেশা (দ্রুত যোগ করুন):' : 'Popular 12 Core Roles:'}</span>
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {FEATURED_12_CORE_PROFESSIONS.map((fp) => {
                const isSelected = selectedProfessions.includes(fp.name);
                return (
                  <button
                    key={fp.id}
                    type="button"
                    onClick={() => toggleProfession(fp.name)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 border ${
                      isSelected
                        ? 'bg-black text-white border-black shadow-xs'
                        : 'bg-white hover:bg-emerald-50 text-gray-800 border-gray-200'
                    }`}
                  >
                    <span>{fp.name}</span>
                    {isSelected && <Check className="w-3 h-3 text-white" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Search Box across 1,000+ Professions */}
          <div className="relative pt-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={professionSearch}
              onFocus={() => setIsProfessionDropdownOpen(true)}
              onChange={(e) => {
                setProfessionSearch(e.target.value);
                setIsProfessionDropdownOpen(true);
              }}
              placeholder={isBn ? '১,০০০+ পেশা সার্চ করুন (যেমন: ইলেকট্রিশিয়ান, নার্স, ড্রাইভার, ডাক্তার, ইমাম...)' : 'Search 1,000+ professions...'}
              className="w-full pl-9 pr-10 py-2.5 border border-gray-300 rounded-xl text-xs bg-white text-gray-900 focus:border-black focus:outline-none transition shadow-2xs font-medium"
            />
            {professionSearch && (
              <button
                type="button"
                onClick={() => setProfessionSearch('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-black cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Type & Add Custom Profession Box */}
          <div className="pt-1.5 border-t border-gray-200">
            <label className="block text-[11px] font-bold text-gray-700 mb-1">
              {isBn ? 'তালিকায় না থাকলে কাস্টম পেশা নিজে লিখে যোগ করুন:' : 'Add custom profession if not listed:'}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={customProfessionInput}
                onChange={(e) => setCustomProfessionInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddCustomProfession();
                  }
                }}
                placeholder={isBn ? 'যেমন: বিশেষ ড্রোন অপারেটর, চা বাগান পরামর্শক' : 'e.g. Drone Operator, Agronomist'}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-xl text-xs bg-white text-gray-900 focus:border-black focus:outline-none font-medium"
              />
              <button
                type="button"
                onClick={() => handleAddCustomProfession()}
                disabled={!customProfessionInput.trim()}
                className="px-3.5 py-2 rounded-xl bg-black hover:bg-gray-800 disabled:bg-gray-300 text-white text-xs font-bold transition flex items-center gap-1 shrink-0 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isBn ? '+ পেশা যোগ' : '+ Add'}</span>
              </button>
            </div>
          </div>

          {/* Expandable 1,000+ Professions Category Explorer Toggle */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setIs1000ExplorerOpen(!is1000ExplorerOpen)}
              className="w-full py-2 px-3 rounded-xl bg-white hover:bg-gray-100 border border-gray-300 text-xs font-bold text-gray-800 flex items-center justify-between transition cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-emerald-700" />
                <span>{isBn ? '১,০০০+ প্রফেশনাল ক্যাটাগরি ব্রাউজ ও এক্সপ্লোর করুন' : 'Browse All 1,000+ Categories'}</span>
              </span>
              {is1000ExplorerOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>

          {/* 1,000+ Professions Category Explorer Panel */}
          {is1000ExplorerOpen && (
            <div className="p-3 bg-white rounded-xl border border-gray-200 space-y-3 mt-2 animate-fadeIn">
              {/* Category Filter Tabs */}
              <div className="flex flex-wrap gap-1">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryTab('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                    selectedCategoryTab === 'all'
                      ? 'bg-black text-white border-black'
                      : 'bg-gray-100 hover:bg-gray-200 text-gray-700 border-gray-200'
                  }`}
                >
                  {isBn ? 'সব ক্যাটাগরি (১,০০০+)' : 'All (1000+)'}
                </button>
                {CORE_6_SERVICE_CATEGORIES.map((cat) => (
                  <button
                    key={cat.categoryEn}
                    type="button"
                    onClick={() => setSelectedCategoryTab(cat.categoryBn)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer border ${
                      selectedCategoryTab === cat.categoryBn
                        ? 'bg-emerald-800 text-white border-emerald-800'
                        : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border-gray-200'
                    }`}
                  >
                    <span>{isBn ? cat.categoryBn : cat.categoryEn}</span>
                  </button>
                ))}
              </div>

              {/* Scrollable grid of matched professions */}
              <div className="max-h-56 overflow-y-auto divide-y divide-gray-100 border border-gray-200 rounded-lg p-1 bg-gray-50/50">
                {filteredProfessions.map((p) => {
                  const isSelected = selectedProfessions.includes(p.name);
                  return (
                    <div
                      key={p.id}
                      onClick={() => toggleProfession(p.name)}
                      className={`p-2 text-xs flex items-center justify-between cursor-pointer rounded-lg transition ${
                        isSelected ? 'bg-black text-white font-bold' : 'hover:bg-white text-gray-800'
                      }`}
                    >
                      <div>
                        <span className="font-semibold">{p.name}</span>
                        <span className={`block text-[10px] ${isSelected ? 'text-gray-300' : 'text-gray-500'}`}>
                          {p.category} • {p.subCategory}
                        </span>
                      </div>
                      {isSelected ? <Check className="w-4 h-4 text-white" /> : <Plus className="w-3.5 h-3.5 text-gray-400" />}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Dropdown popup when searching */}
          {isProfessionDropdownOpen && professionSearch.trim() && (
            <div className="relative mt-1 max-h-52 overflow-y-auto bg-white border border-gray-300 rounded-xl shadow-xl z-50 divide-y divide-gray-100">
              {!selectedProfessions.includes(professionSearch.trim()) && (
                <div
                  onClick={() => handleAddCustomProfession(professionSearch.trim())}
                  className="p-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-950 text-xs font-bold flex items-center justify-between cursor-pointer transition border-b border-emerald-200"
                >
                  <span className="flex items-center gap-1.5">
                    <Plus className="w-4 h-4 text-emerald-800" />
                    <span>{isBn ? `কাস্টম পেশা হিসেবে যোগ করুন: "${professionSearch.trim()}"` : `Add as custom: "${professionSearch.trim()}"`}</span>
                  </span>
                </div>
              )}

              {filteredProfessions.map((p) => {
                const isSelected = selectedProfessions.includes(p.name);
                return (
                  <div
                    key={p.id}
                    onClick={() => toggleProfession(p.name)}
                    className={`p-2.5 text-xs flex items-center justify-between cursor-pointer transition ${
                      isSelected ? 'bg-black text-white font-bold' : 'hover:bg-gray-50 text-gray-800'
                    }`}
                  >
                    <div>
                      <span>{p.name}</span>
                      <span className={`block text-[10px] ${isSelected ? 'text-gray-300' : 'text-gray-400'}`}>
                        {p.category}
                      </span>
                    </div>
                    {isSelected && <Check className="w-4 h-4" />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Experience & Wage */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {isBn ? 'অভিজ্ঞতা (বছর)' : 'Experience (Years)'}
            </label>
            <select
              value={experienceYears}
              onChange={(e) => setExperienceYears(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-xs bg-white text-gray-900 focus:border-black focus:outline-none font-medium"
            >
              {EXPERIENCE_OPTIONS.map((exp) => (
                <option key={exp.value} value={exp.value}>
                  {isBn ? exp.labelBn : exp.labelEn}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {isBn ? 'দৈনিক পারিশ্রমিক (টাকা)' : 'Daily Wage (BDT)'}
            </label>
            <input
              type="text"
              value={dailyWage}
              onChange={(e) => setDailyWage(e.target.value)}
              placeholder="যেমন: ৮০০"
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-xs bg-white text-gray-900 focus:border-black focus:outline-none font-medium"
            />
          </div>
        </div>

        {/* District & Upazila */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {isBn ? 'জেলা' : 'District'}
            </label>
            <select
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-xs bg-white text-gray-900 focus:border-black focus:outline-none font-medium"
            >
              {allDistricts.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {isBn ? 'উপজেলা / থানা' : 'Upazila'}
            </label>
            <select
              value={upazila}
              onChange={(e) => setUpazila(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-xs bg-white text-gray-900 focus:border-black focus:outline-none font-medium"
            >
              {upazilasForDistrict.map((u) => (
                <option key={u} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Blood Group */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            {isBn ? 'রক্তের গ্রুপ (ঐচ্ছিক)' : 'Blood Group (Optional)'}
          </label>
          <select
            value={bloodGroup}
            onChange={(e) => setBloodGroup(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-300 rounded-xl text-xs bg-white text-gray-900 focus:border-black focus:outline-none font-medium"
          >
            {BLOOD_GROUPS.map((bg) => (
              <option key={bg} value={bg}>{bg}</option>
            ))}
          </select>
        </div>

        {/* Bio */}
        <div>
          <label className="block text-xs font-semibold text-gray-700 mb-1">
            {isBn ? 'নিজের সম্পর্কে সংক্ষিপ্ত বিবরণ (Bio)' : 'Bio / Description'}
          </label>
          <textarea
            rows={3}
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder={isBn ? 'আপনার কাজ সম্পর্কে বিস্তারিত লিখুন...' : 'Write details about your work...'}
            className="w-full p-3 border border-gray-300 rounded-xl text-xs bg-white text-gray-900 focus:border-black focus:outline-none font-medium resize-none"
          />
        </div>

        {/* Terms Checkbox */}
        <div className="flex items-start gap-2 pt-1">
          <input
            type="checkbox"
            id="terms-checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-gray-300 text-black focus:ring-black cursor-pointer"
          />
          <label htmlFor="terms-checkbox" className="text-xs text-gray-700 font-medium cursor-pointer">
            {isBn ? 'আমি সজ্ঞানে ও স্বেচ্ছায় সঠিক তথ্যসমূহ প্রদান করলাম।' : 'I knowingly and voluntarily provide accurate information.'}
          </label>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-black hover:bg-gray-800 text-white font-bold text-xs rounded-xl shadow-md cursor-pointer transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>{isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...'}</span>
              </>
            ) : (
              <span>{isEditMode ? (isBn ? 'তথ্য আপডেট করুন' : 'Update Info') : (isBn ? 'রেজিস্ট্রেশন সম্পন্ন করুন ➔' : 'Complete Registration ➔')}</span>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};

export default ServiceProviderRegistrationForm;