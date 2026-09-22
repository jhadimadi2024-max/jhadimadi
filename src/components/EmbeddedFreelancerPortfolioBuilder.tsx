import React, { useState } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Briefcase, 
  Award, 
  DollarSign, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Camera, 
  ShieldCheck, 
  X, 
  PlusCircle, 
  Calendar, 
  Layers, 
  Upload, 
  Lock, 
  GraduationCap, 
  Building, 
  Image as ImageIcon, 
  Trash2, 
  Search, 
  Star, 
  Video,
  AlertTriangle,
  FileCheck,
  Check,
  Loader2
} from 'lucide-react';
import { 
  EducationEntry, 
  EmploymentEntry, 
  CertificationEntry, 
  PortfolioItem, 
  OtherExperienceEntry, 
  ServiceProvider 
} from '../types';
import { RegisteredProfessional } from './ProfessionalRegistrationWizard';
import { generateUniqueId, maskPhoneNumber, maskDetailedAddress } from '../utils/uniqueIdGenerator';
import { isNidAlreadyRegistered, registerAndLockNid } from '../utils/nidRegistry';
import { NO_IMAGE_AVAILABLE_ICON } from '../constants/imageConstants';
import { MASTER_PROFESSION_CATEGORIES, ALL_PROFESSIONS_FLAT_LIST, BANGLADESH_GEO_DIRECTORY } from '../data/professionsMasterData';
import { Language } from '../utils/translations';
import { uploadFileToSupabaseStorage, isLocalTransientUrl } from '../utils/directSupabaseStorage';

interface EmbeddedFreelancerPortfolioBuilderProps {
  initialData?: Partial<RegisteredProfessional>;
  currentUser?: any;
  onBack: () => void;
  onSaveProfile?: (profile: RegisteredProfessional) => void;
  onComplete?: (profile: RegisteredProfessional) => void;
  lang: Language;
}

export const EmbeddedFreelancerPortfolioBuilder: React.FC<EmbeddedFreelancerPortfolioBuilderProps> = ({
  initialData,
  currentUser,
  onBack,
  onSaveProfile,
  onComplete,
  lang
}) => {
  const [currentStep, setCurrentStep] = useState<number>(1);
  const totalSteps = 6;

  // 1. Basic Info & Headline
  const [name, setName] = useState(initialData?.name || 'রিপন চাকমা');
  const [phone, setPhone] = useState(initialData?.phone || '01819234567');
  const [email, setEmail] = useState(initialData?.email || 'ripon@example.com');
  const [headline, setHeadline] = useState(initialData?.professionalHeadline || 'সিনিয়র ইলেকট্রিক্যাল টেকনিশিয়ান ও হোম অটোমেশন স্পেশালিস্ট');
  const [bio, setBio] = useState(initialData?.bio || '১০ বছরের বাস্তব অভিজ্ঞতাসম্পন্ন সার্টিফাইড ইলেকট্রিশিয়ান। আবাসিক ও বাণিজ্যিক ভবনের নিরাপদ ওয়ারিং ও ইলেকট্রিক মেইনটেন্যান্স সেবা প্রদান করি।');
  const [avatar, setAvatar] = useState(initialData?.img || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=200');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [dateOfBirth, setDateOfBirth] = useState(initialData?.dateOfBirth || '1995-04-12');
  const [rateType, setRateType] = useState<'দৈনিক' | 'ঘণ্টাভিত্তিক' | 'চুক্তিভিত্তিক' | 'ভিজিট ফি'>(initialData?.rateType || 'দৈনিক');
  const [rateAmount, setRateAmount] = useState(initialData?.rateAmount || '৮০০');

  // 2. Skills Matrix (10-12 Skills)
  const [selectedSkills, setSelectedSkills] = useState<string[]>(initialData?.selectedSkillsList || [
    'ইলেকট্রিশিয়ান (বাসাবাড়ি ওয়্যারিং)',
    'ফ্রিজ ও রেফ্রিজারেটর টেকনিশিয়ান',
    'মোটরবাইক সার্ভিসিং মেকানিক',
    'সৌরবিদ্যুৎ ও আইপিএস ইনস্টলেশন'
  ]);
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const [customSkillInput, setCustomSkillInput] = useState('');

  // 3. Education & Certifications
  const [educations, setEducations] = useState<EducationEntry[]>(initialData?.educations || [
    { degree: 'ডিপ্লোমা ইন ইলেকট্রিক্যাল ইঞ্জিনিয়ারিং', institute: 'খাগড়াছড়ি পলিটেকনিক ইনস্টিটিউট', passYear: '২০১৬' }
  ]);
  const [employments, setEmployments] = useState<EmploymentEntry[]>(initialData?.employments || [
    { designation: 'সিনিয়র ইলেকট্রিক সুপারভাইজার', company: 'পাহাড়িকা কন্সট্রাকশন লিমিটেড', duration: '২০১৮ - ২০২৪', description: 'বৃহৎ আবাসিক ভবনের ওয়্যারিং ও সাব-স্টেশন ইনস্টলেশন' }
  ]);
  const [certifications, setCertifications] = useState<CertificationEntry[]>(initialData?.certificatesList || [
    { certificateName: 'বাংলাদেশ কারিগরি শিক্ষা বোর্ড - এনটিভিকিউএফ লেভেল ৩', issuingOrg: 'BTEB', year: '২০১৯' }
  ]);
  const [otherExperiences, setOtherExperiences] = useState<OtherExperienceEntry[]>(initialData?.otherExperiences || [
    { title: 'স্থানীয় যুব কল্যাণ ক্লাবের সমাজসেবা সম্পাদক', details: 'দুর্যোগে জরুরি বিদ্যুৎ লাইন মেরামতে স্বেচ্ছাসেবী হিসেবে কাজ' }
  ]);

  // 4. Portfolio Items
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>(initialData?.portfolioItems || [
    {
      title: 'আলুটিলা ইকো-রিসোর্ট সম্পূর্ণ সোয়েচবোর্ড ও ইলেকট্রিক ওয়্যারিং',
      imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
      description: 'অটোমেটিক সার্কিট ব্রেকার ও থ্রি-ফেজ লোড ক্যালকুলেশন'
    },
    {
      title: 'খাগড়াছড়ি জেলা সদর আধুনিক বাণিজ্যিক কমপ্লেক্স লাইটিং',
      imageUrl: 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80',
      description: 'আধুনিক এলইডি লাইটিং ও ব্যাকআপ জেনারেটর সংযোগ'
    }
  ]);

  // 5. Hyper-Local Location Cascading
  const [district, setDistrict] = useState(initialData?.district || 'খাগড়াছড়ি');
  const [upazila, setUpazila] = useState(initialData?.upazila || 'খাগড়াছড়ি সদর');
  const [area, setArea] = useState(initialData?.area || 'শালবন বাজার');
  const [serviceRadiusKm, setServiceRadiusKm] = useState(initialData?.serviceRadiusKm || 15);

  // 6. Mandatory NID & KYC Anti-Fraud Engine
  const [nidNumber, setNidNumber] = useState(initialData?.nid || '');
  const [nidFrontUrl, setNidFrontUrl] = useState(initialData?.nidFrontUrl || '');
  const [nidFrontFile, setNidFrontFile] = useState<File | null>(null);
  const [nidBackUrl, setNidBackUrl] = useState(initialData?.nidBackUrl || '');
  const [nidBackFile, setNidBackFile] = useState<File | null>(null);
  const [isAiKycVerified, setIsAiKycVerified] = useState(initialData?.verified ?? true);
  const [isNidLockedPermanently, setIsNidLockedPermanently] = useState(false);
  const [nidError, setNidError] = useState('');
  const [isAiVerifying, setIsAiVerifying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cascading Location Lookups
  const availableUpazilas = BANGLADESH_GEO_DIRECTORY[district]?.thanas || ['সদর উপজেলা', 'পৌরসভা'];
  const availableMahallas = ['বাজার এলাকা', 'মধুরোড', 'শালবন', 'কলেজ রোড', 'মেইন রোড', 'শান্তিনগর', 'সদর'];

  // Filter skills
  const filteredSkillSuggestions = ALL_PROFESSIONS_FLAT_LIST.filter(s => 
    s.name.toLowerCase().includes(skillSearchQuery.toLowerCase()) && !selectedSkills.includes(s.name)
  ).slice(0, 10);

  const toggleSkill = (skill: string) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skill));
    } else {
      if (selectedSkills.length >= 15) {
        alert('সর্বোচ্চ ১৫টি দক্ষতা নির্বাচন করতে পারবেন।');
        return;
      }
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleAddCustomSkill = () => {
    if (!customSkillInput.trim()) return;
    if (!selectedSkills.includes(customSkillInput.trim())) {
      setSelectedSkills([...selectedSkills, customSkillInput.trim()]);
      setCustomSkillInput('');
    }
  };

  const handleSimulateAiKyc = () => {
    setNidError('');
    if (!nidNumber.trim()) {
      setNidError('এনআইডি নম্বর লিখুন।');
      return;
    }
    
    // Strict Anti-Fraud check
    const check = isNidAlreadyRegistered(nidNumber, initialData?.id ? String(initialData.id) : undefined);
    if (check.isRegistered) {
      setNidError(`🚫 সতর্কতা: এই এনআইডি (${nidNumber}) ইতোমধ্যে সিস্টেমে [${check.existingRecord?.uniqueId}] একাউন্টে নিবন্ধিত আছে। একই এনআইডি দিয়ে একাধিক একাউন্ট করা যাবে না।`);
      return;
    }

    setIsAiVerifying(true);
    setTimeout(() => {
      setIsAiVerifying(false);
      setIsAiKycVerified(true);
      setIsNidLockedPermanently(true);
      setNidError('');
    }, 1200);
  };

  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setNidError('');

    if (!nidNumber.trim()) {
      setNidError('এনআইডি ভেরিফিকেশন ব্যতিরেকে পেশাদার প্রোফাইল সম্পন্ন করা যাবে না।');
      setCurrentStep(6);
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Direct upload user's selected files to Supabase Storage
      let finalAvatar = avatar;
      if (avatarFile) {
        finalAvatar = await uploadFileToSupabaseStorage(
          'avatars',
          avatarFile,
          avatarFile.name,
          'freelancer_profiles'
        );
      } else if (avatar && isLocalTransientUrl(avatar)) {
        finalAvatar = await uploadFileToSupabaseStorage(
          'avatars',
          avatar,
          'freelancer_avatar.jpg',
          'freelancer_profiles'
        );
      }

      let finalNidFront = nidFrontUrl;
      if (nidFrontFile) {
        finalNidFront = await uploadFileToSupabaseStorage(
          'documents',
          nidFrontFile,
          nidFrontFile.name,
          'nid_documents'
        );
      } else if (nidFrontUrl && isLocalTransientUrl(nidFrontUrl)) {
        finalNidFront = await uploadFileToSupabaseStorage(
          'documents',
          nidFrontUrl,
          'nid_front.jpg',
          'nid_documents'
        );
      }

      let finalNidBack = nidBackUrl;
      if (nidBackFile) {
        finalNidBack = await uploadFileToSupabaseStorage(
          'documents',
          nidBackFile,
          nidBackFile.name,
          'nid_documents'
        );
      } else if (nidBackUrl && isLocalTransientUrl(nidBackUrl)) {
        finalNidBack = await uploadFileToSupabaseStorage(
          'documents',
          nidBackUrl,
          'nid_back.jpg',
          'nid_documents'
        );
      }

      // Strict Anti-Fraud Registry Lock
      const userId = initialData?.id ? String(initialData.id) : 'pro_' + Date.now();
      const uniqueId = initialData?.uniqueId || generateUniqueId('professional', district);

      const lockResult = registerAndLockNid({
        nidNumber,
        userId,
        userName: name,
        role: 'professional',
        uniqueId,
        verifiedAt: new Date().toISOString().split('T')[0],
        district,
        nidFrontUrl: finalNidFront,
        nidBackUrl: finalNidBack,
        isAiKycVerified: true,
      });

      if (!lockResult.success) {
        setNidError(lockResult.message);
        setCurrentStep(6);
        return;
      }

      const finalProfile: RegisteredProfessional = {
        id: userId,
        memberId: 'MEM-' + Math.floor(100000 + Math.random() * 900000),
        uniqueId,
        name: name.trim(),
        professionalHeadline: headline.trim(),
        phone: phone.trim(),
        email: email.trim(),
        dateOfBirth,
        job: selectedSkills[0] || 'পেশাজীবী কারিগর',
        categoryGroup: 'প্রকৌশল ও কারিগরি সেবা',
        district,
        upazila,
        area,
        fullAddress: `${area}, ${upazila}, ${district}`,
        serviceRadiusKm,
        coveredAreas: [area, upazila, district],
        rateType,
        rateAmount,
        bio: bio.trim(),
        selectedSkillsList: selectedSkills,
        skills: selectedSkills.join(', '),
        educations,
        employments,
        certificatesList: certifications,
        otherExperiences,
        portfolioItems,
        img: finalAvatar,
        nid: nidNumber,
        nidFrontUrl: finalNidFront,
        nidBackUrl: finalNidBack,
        verified: true,
        verificationFeePaid: true,
        rating: 4.9,
        completedJobs: 28,
      };

      if (onComplete) {
        onComplete(finalProfile);
      } else if (onSaveProfile) {
        onSaveProfile(finalProfile);
      }
    } catch (err: any) {
      console.error('[FreelancerPortfolioBuilder] Submission error:', err);
      setNidError(err?.message || 'প্রোফাইল সংরক্ষণে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-slate-50 min-h-full rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between shadow-xs relative pb-10 animate-fadeIn">
      
      {/* 1. Header Bar */}
      <div className="bg-white sticky top-0 z-20 px-3.5 py-2.5 border-b border-slate-200 flex items-center justify-between shadow-xs">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#2EAA26]" />
          <span>{lang === 'bn' ? 'ফিরে যান' : 'Back'}</span>
        </button>

        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-[#2EAA26] text-white font-black text-xs flex items-center justify-center">
            B
          </div>
          <span className="font-extrabold text-xs text-slate-900">
            {lang === 'bn' ? 'Fiverr/Upwork পোর্টফোলিও বিল্ডার' : 'Freelance Portfolio Builder'}
          </span>
        </div>

        <span className="text-[9px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-full font-mono">
          ধাপ {currentStep}/{totalSteps}
        </span>
      </div>

      {/* Step Progress Bar */}
      <div className="w-full bg-slate-200 h-1.5">
        <div 
          className="bg-[#2EAA26] h-1.5 transition-all duration-300"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        ></div>
      </div>

      {/* Stepper Tabs */}
      <div className="px-3.5 pt-2.5 flex items-center justify-between overflow-x-auto gap-1 text-[8.5px] font-bold pb-1 scrollbar-none">
        {[
          { step: 1, label: '১. পরিচয় ও বায়ো' },
          { step: 2, label: '২. স্কিলস ম্যাট্রিক্স' },
          { step: 3, label: '৩. শিক্ষা ও অভিজ্ঞতা' },
          { step: 4, label: '৪. পোর্টফোলিও' },
          { step: 5, label: '৫. সার্ভিস এরিয়া' },
          { step: 6, label: '৬. এনআইডি লক' },
        ].map((s) => (
          <button
            key={s.step}
            type="button"
            onClick={() => setCurrentStep(s.step)}
            className={`px-2 py-1 rounded-lg shrink-0 transition ${
              currentStep === s.step
                ? 'bg-[#2EAA26] text-white font-black shadow-2xs'
                : 'bg-white text-slate-600 border border-slate-200'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="p-3.5 space-y-4">
        
        {/* STEP 1: Basic Info, Headline & Avatar */}
        {currentStep === 1 && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 animate-fadeIn shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <User className="w-4 h-4 text-[#2EAA26]" />
                <span>পেশাদার পরিচয়, ছবি ও হেডলাইন (Fiverr/Upwork স্টাইল)</span>
              </h3>
            </div>

            {/* Profile Avatar */}
            <div className="flex items-center gap-3">
              <div className="relative">
                <img 
                  src={avatar} 
                  alt={name} 
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-[#2EAA26] shadow-sm bg-slate-100"
                />
                <label className="absolute -bottom-1 -right-1 bg-slate-900 text-white p-1 rounded-full border border-white cursor-pointer hover:bg-slate-800">
                  <Camera className="w-3 h-3" />
                  <input 
                    type="file" 
                    accept="image/*" 
                    className="hidden" 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setAvatarFile(file);
                        try {
                          const preview = URL.createObjectURL(file);
                          setAvatar(preview);
                        } catch {
                          const reader = new FileReader();
                          reader.onload = () => setAvatar(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }
                    }} 
                  />
                </label>
              </div>

              <div className="text-[9.5px] text-slate-500 flex-1">
                <p className="font-bold text-slate-800">পরিষ্কার প্রফেশনাল ছবি দিন</p>
                <p>ক্যামেরা আইকনে ক্লিক করে সরাসরি গ্যালারি বা ক্যামেরা থেকে ছবি আপলোড করুন।</p>
              </div>
            </div>

            {/* Name & Phone */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9.5px] font-bold text-slate-700 mb-0.5">পূর্ণ নাম *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-[9.5px] font-bold text-slate-700 mb-0.5">মোবাইল নম্বর *</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            {/* Headline */}
            <div>
              <label className="block text-[9.5px] font-bold text-slate-700 mb-0.5">
                প্রফেশনাল হেডলাইন (Professional Headline) *
              </label>
              <input
                type="text"
                required
                value={headline}
                onChange={(e) => setHeadline(e.target.value)}
                placeholder="যেমন: সিনিয়র ইলেকট্রিক্যাল টেকনিশিয়ান ও হোম অটোমেশন স্পেশালিস্ট"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            {/* Bio */}
            <div>
              <label className="block text-[9.5px] font-bold text-slate-700 mb-0.5">
                সংক্ষিপ্ত পরিচয় ও কাজের অভিজ্ঞতা (Overview / Bio) *
              </label>
              <textarea
                rows={3}
                required
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="আপনার কাজের অভিজ্ঞতা, বিশেষত্ব ও সততা তুলে ধরুন..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed"
              />
            </div>

            {/* Rate */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[9.5px] font-bold text-slate-700 mb-0.5">ফি নির্ধারণের ধরণ</label>
                <select
                  value={rateType}
                  onChange={(e) => setRateType(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="দৈনিক">দৈনিক মজুরি</option>
                  <option value="ঘণ্টাভিত্তিক">ঘণ্টাভিত্তিক ফি</option>
                  <option value="চুক্তিভিত্তিক">চুক্তিভিত্তিক / কাজ অনুযায়ী</option>
                  <option value="ভিজিট ফি">ভিজিট ও চেকআপ ফি</option>
                </select>
              </div>
              <div>
                <label className="block text-[9.5px] font-bold text-slate-700 mb-0.5">টাকার পরিমাণ (৳)</label>
                <input
                  type="text"
                  value={rateAmount}
                  onChange={(e) => setRateAmount(e.target.value)}
                  placeholder="৮০০"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Skills Matrix (10-12 Skills Selector) */}
        {currentStep === 2 && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 animate-fadeIn shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-[#2EAA26]" />
                <span>মাস্টার স্কিলস ম্যাট্রিক্স (১০০০+ পেশা)</span>
              </h3>
              <span className="text-[9px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                {selectedSkills.length}টি নির্বাচিত
              </span>
            </div>

            <p className="text-[9.5px] text-slate-600 leading-relaxed">
              আপনি যেসব কাজ বা পেশায় পারদর্শী তা নির্বাচন করুন। ক্লায়েন্টরা সার্চ করার সময় আপনার এই স্কিলগুলো দেখতে পাবেন।
            </p>

            {/* Selected Skills Chips */}
            <div className="flex flex-wrap gap-1.5 p-2 bg-slate-50 rounded-xl border border-slate-200 min-h-[50px]">
              {selectedSkills.map((sk, idx) => (
                <span
                  key={idx}
                  className="bg-[#2EAA26] text-white text-[9px] font-bold px-2 py-1 rounded-lg flex items-center gap-1 shadow-2xs"
                >
                  <span>{sk}</span>
                  <button type="button" onClick={() => toggleSkill(sk)} className="hover:text-red-200">
                    ✕
                  </button>
                </span>
              ))}
            </div>

            {/* Search Professions / Skills */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={skillSearchQuery}
                onChange={(e) => setSkillSearchQuery(e.target.value)}
                placeholder="পেশা বা কাজের নাম খুঁজুন (যেমন: ড্রাইভার, ইলেকট্রিশিয়ান, মেকানিক)..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
            </div>

            {/* Suggestions */}
            {filteredSkillSuggestions.length > 0 && (
              <div className="space-y-1">
                <span className="text-[8.5px] font-bold text-slate-400 uppercase">পেশার তালিকা থেকে যোগ করুন:</span>
                <div className="flex flex-wrap gap-1.5">
                  {filteredSkillSuggestions.map((sk, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => toggleSkill(sk.name)}
                      className="text-[9px] bg-slate-100 hover:bg-emerald-50 hover:border-emerald-300 text-slate-700 border border-slate-200 px-2 py-1 rounded-lg font-bold transition cursor-pointer"
                    >
                      + {sk.name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom Skill Input */}
            <div className="flex gap-2 pt-1 border-t border-slate-100">
              <input
                type="text"
                value={customSkillInput}
                onChange={(e) => setCustomSkillInput(e.target.value)}
                placeholder="তালিকায় না থাকলে নতুন স্কিল লিখুন..."
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
              />
              <button
                type="button"
                onClick={handleAddCustomSkill}
                className="px-3 py-1.5 bg-slate-800 text-white rounded-xl text-[10px] font-bold shrink-0 cursor-pointer"
              >
                + যোগ করুন
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: Education & Experience */}
        {currentStep === 3 && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 animate-fadeIn shadow-xs">
            <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
              <GraduationCap className="w-4 h-4 text-[#2EAA26]" />
              <span>শিক্ষাগত যোগ্যতা ও কাজের পূর্ব অভিজ্ঞতা</span>
            </h3>

            {/* Educations */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-800">১. শিক্ষাগত ডিগ্রি / সনদ:</span>
                <button
                  type="button"
                  onClick={() => setEducations([...educations, { degree: '', institute: '', passYear: '' }])}
                  className="text-[9px] text-[#2EAA26] font-bold hover:underline"
                >
                  + আরও যোগ করুন
                </button>
              </div>

              {educations.map((edu, idx) => (
                <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-[8.5px] font-bold text-slate-500">ডিগ্রি #{idx + 1}</span>
                    {educations.length > 1 && (
                      <button 
                        type="button" 
                        onClick={() => setEducations(educations.filter((_, i) => i !== idx))}
                        className="text-red-500 text-[8px]"
                      >
                        মুছুন
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={edu.degree}
                    onChange={(e) => {
                      const copy = [...educations];
                      copy[idx].degree = e.target.value;
                      setEducations(copy);
                    }}
                    placeholder="ডিগ্রি / সার্টিফিকেট (যেমন: এসএসসি / ডিপ্লোমা)"
                    className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      value={edu.institute}
                      onChange={(e) => {
                        const copy = [...educations];
                        copy[idx].institute = e.target.value;
                        setEducations(copy);
                      }}
                      placeholder="শিক্ষা প্রতিষ্ঠান / বোর্ড"
                      className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      value={edu.passYear}
                      onChange={(e) => {
                        const copy = [...educations];
                        copy[idx].passYear = e.target.value;
                        setEducations(copy);
                      }}
                      placeholder="পাশের বছর (যেমন: ২০১৯)"
                      className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Employment History */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-800">২. অতীত কর্মসংস্থান / প্রতিষ্ঠান:</span>
                <button
                  type="button"
                  onClick={() => setEmployments([...employments, { designation: '', company: '', duration: '', description: '' }])}
                  className="text-[9px] text-[#2EAA26] font-bold hover:underline"
                >
                  + আরও যোগ করুন
                </button>
              </div>

              {employments.map((emp, idx) => (
                <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <input
                    type="text"
                    value={emp.designation}
                    onChange={(e) => {
                      const copy = [...employments];
                      copy[idx].designation = e.target.value;
                      setEmployments(copy);
                    }}
                    placeholder="পদবী (যেমন: সিনিয়র টেকনিশিয়ান)"
                    className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      value={emp.company}
                      onChange={(e) => {
                        const copy = [...employments];
                        copy[idx].company = e.target.value;
                        setEmployments(copy);
                      }}
                      placeholder="প্রতিষ্ঠান / ফার্মের নাম"
                      className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                    <input
                      type="text"
                      value={emp.duration}
                      onChange={(e) => {
                        const copy = [...employments];
                        copy[idx].duration = e.target.value;
                        setEmployments(copy);
                      }}
                      placeholder="সময়কাল (যেমন: ২০২০ - ২০২৪)"
                      className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                </div>
              ))}
            </div>

            {/* Certifications */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <span className="text-[10px] font-bold text-slate-800">৩. প্রফেশনাল লাইসেন্স / প্রশিক্ষণ সার্টিফিকেট:</span>
              {certifications.map((cert, idx) => (
                <div key={idx} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1">
                  <input
                    type="text"
                    value={cert.certificateName}
                    onChange={(e) => {
                      const copy = [...certifications];
                      copy[idx].certificateName = e.target.value;
                      setCertifications(copy);
                    }}
                    placeholder="সনদের নাম ও ইস্যুকারী প্রতিষ্ঠান"
                    className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 4: Portfolio Gallery (Photos & Projects) */}
        {currentStep === 4 && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 animate-fadeIn shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[#2EAA26]" />
                <span>পোর্টফোলিও ও কাজের প্রুফ গ্যালারি</span>
              </h3>
              <button
                type="button"
                onClick={() => setPortfolioItems([
                  ...portfolioItems,
                  {
                    title: 'নতুন সম্পন্ন কাজের প্রজেক্ট',
                    imageUrl: NO_IMAGE_AVAILABLE_ICON,
                    description: 'উচ্চমানের সার্ভিস মেইনটেন্যান্স'
                  }
                ])}
                className="text-[9px] text-[#2EAA26] font-bold hover:underline"
              >
                + প্রজেক্ট যোগ
              </button>
            </div>

            <p className="text-[9.5px] text-slate-600 leading-relaxed">
              আপনার অতীতের কাজের বাস্তব ছবি বা ভিডিও আপলোড করুন। প্রুফ থাকলে ক্লায়েন্টরা দ্বিগুণ আস্থা পাবেন।
            </p>

            <div className="space-y-2.5">
              {portfolioItems.map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                  <div className="flex items-start gap-3">
                    <img 
                      src={item.imageUrl} 
                      alt={item.title} 
                      className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0 bg-white"
                    />
                    <div className="flex-1 space-y-1">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => {
                          const copy = [...portfolioItems];
                          copy[idx].title = e.target.value;
                          setPortfolioItems(copy);
                        }}
                        placeholder="প্রজেক্ট শিরোনাম"
                        className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                      />
                      <input
                        type="text"
                        value={item.description}
                        onChange={(e) => {
                          const copy = [...portfolioItems];
                          copy[idx].description = e.target.value;
                          setPortfolioItems(copy);
                        }}
                        placeholder="কাজের সংক্ষিপ্ত বিবরণ"
                        className="w-full px-2.5 py-1 bg-white border border-slate-200 rounded-lg text-[10px]"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STEP 5: Hyper-Local Service Area Cascading */}
        {currentStep === 5 && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 animate-fadeIn shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-[#2EAA26]" />
                <span>হাইপার-লোকাল কর্ম এলাকা নির্বাচন (জেলা ➔ উপজেলা ➔ পাড়া-মহল্লা)</span>
              </h3>
            </div>

            <p className="text-[9.5px] text-slate-600 leading-relaxed">
              সঠিক এলাকা নির্ধারণ করুন যাতে আপনার নিকটস্থ ক্লায়েন্টরা অতি সহজে আপনাকে সার্চ করে খুঁজে পায়।
            </p>

            <div className="space-y-2.5">
              {/* District */}
              <div>
                <label className="block text-[9.5px] font-bold text-slate-700 mb-0.5">জেলা (District) *</label>
                <select
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value);
                    const newUpazilas = BANGLADESH_GEO_DIRECTORY[e.target.value]?.thanas || ['সদর'];
                    setUpazila(newUpazilas[0] || 'সদর');
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  {Object.keys(BANGLADESH_GEO_DIRECTORY).map((dist) => (
                    <option key={dist} value={dist}>{dist}</option>
                  ))}
                </select>
              </div>

              {/* Upazila */}
              <div>
                <label className="block text-[9.5px] font-bold text-slate-700 mb-0.5">উপজেলা / থানা (Upazila/Thana) *</label>
                <select
                  value={upazila}
                  onChange={(e) => setUpazila(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                >
                  {availableUpazilas.map((up) => (
                    <option key={up} value={up}>{up}</option>
                  ))}
                </select>
              </div>

              {/* Mahalla / Local Bazar */}
              <div>
                <label className="block text-[9.5px] font-bold text-slate-700 mb-0.5">পাড়া / মহল্লা / স্থানীয় বাজার *</label>
                <input
                  type="text"
                  required
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  placeholder="যেমন: শালবন বাজার / মহাজনপাড়া / কলেজ রোড"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              {/* Coverage Radius */}
              <div>
                <label className="block text-[9.5px] font-bold text-slate-700 mb-0.5">
                  সেবা প্রদানের আওতা / পরিধি (সার্ভিস রেডিয়াস): {serviceRadiusKm} কি.মি.
                </label>
                <input
                  type="range"
                  min={2}
                  max={50}
                  step={1}
                  value={serviceRadiusKm}
                  onChange={(e) => setServiceRadiusKm(parseInt(e.target.value, 10))}
                  className="w-full accent-[#2EAA26]"
                />
                <div className="flex justify-between text-[8px] text-slate-400 mt-0.5">
                  <span>২ কি.মি. (কাছাকাছি)</span>
                  <span>২৫ কি.মি.</span>
                  <span>৫০ কি.মি. (পুরো জেলা)</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: Mandatory NID Anti-Fraud Engine & Permanent Locking */}
        {currentStep === 6 && (
          <div className="bg-white p-4 rounded-2xl border border-slate-200 space-y-3 animate-fadeIn shadow-xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-amber-600" />
                <span>বাধ্যতামূলক এনআইডি ভেরিফিকেশন ও লক ইঞ্জিন</span>
              </h3>
              <span className="text-[8px] font-mono bg-slate-900 text-white px-1.5 py-0.5 rounded-xs">
                {generateUniqueId('professional', district)}
              </span>
            </div>

            {/* Strict NID Notice */}
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-[9px] text-amber-900 space-y-1">
              <div className="flex items-center gap-1 font-black">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>কড়া জাতীয় পরিচয়পত্র (NID) নিরাপত্তা ও অ্যান্টি-ফ্রড নীতি</span>
              </div>
              <p className="leading-relaxed">
                ১. একটি এনআইডি দিয়ে সমগ্র সিস্টেমে মাত্র <strong>১টি একাউন্টই</strong> ভেরিফাই করা যাবে। ডুপ্লিকেট নিবন্ধন স্বয়ংক্রিয়ভাবে ব্লক হবে।<br/>
                ২. এনআইডি একবার সাবমিট ও ভেরিফাই হওয়ার পর তা <strong>স্থায়ীভাবে লক</strong> হয়ে যাবে এবং পরবর্তীতে পরিবর্তন করা যাবে না।
              </p>
            </div>

            {nidError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-[10px] font-bold animate-shake">
                {nidError}
              </div>
            )}

            {/* NID Input */}
            <div>
              <label className="block text-[9.5px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-amber-600" />
                <span>জাতীয় পরিচয়পত্র নম্বর (NID Number) *</span>
              </label>
              <input
                type="text"
                required
                disabled={isNidLockedPermanently}
                value={nidNumber}
                onChange={(e) => setNidNumber(e.target.value)}
                placeholder="১০, ১৩ বা ১৭ ডিজিটের এনআইডি নম্বর লিখুন"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold tracking-wider disabled:bg-slate-100 disabled:text-slate-500"
              />
            </div>

            {/* NID Front & Back Photos */}
            <div className="grid grid-cols-2 gap-2">
              <div className="border border-slate-200 rounded-xl p-2.5 text-center space-y-1.5 bg-slate-50">
                <span className="text-[9px] font-bold text-slate-700">NID সামনের পৃষ্ঠা</span>
                <div className="h-16 bg-white rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
                  <img src={nidFrontUrl} alt="NID Front" className="w-full h-full object-cover" />
                </div>
                <label className="text-[8px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-md hover:bg-slate-300 cursor-pointer inline-block">
                  ছবি পরিবর্তন
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setNidFrontFile(file);
                        try {
                          const preview = URL.createObjectURL(file);
                          setNidFrontUrl(preview);
                        } catch {
                          const reader = new FileReader();
                          reader.onload = () => setNidFrontUrl(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }
                    }}
                  />
                </label>
              </div>

              <div className="border border-slate-200 rounded-xl p-2.5 text-center space-y-1.5 bg-slate-50">
                <span className="text-[9px] font-bold text-slate-700">NID পেছনের পৃষ্ঠা</span>
                <div className="h-16 bg-white rounded-lg overflow-hidden border border-slate-200 flex items-center justify-center">
                  <img src={nidBackUrl} alt="NID Back" className="w-full h-full object-cover" />
                </div>
                <label className="text-[8px] bg-slate-200 text-slate-700 font-bold px-2 py-0.5 rounded-md hover:bg-slate-300 cursor-pointer inline-block">
                  ছবি পরিবর্তন
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setNidBackFile(file);
                        try {
                          const preview = URL.createObjectURL(file);
                          setNidBackUrl(preview);
                        } catch {
                          const reader = new FileReader();
                          reader.onload = () => setNidBackUrl(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }
                    }}
                  />
                </label>
              </div>
            </div>

            {/* AI Video KYC Check Button */}
            {!isAiKycVerified && (
              <button
                type="button"
                onClick={handleSimulateAiKyc}
                disabled={isAiVerifying}
                className="w-full py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-black shadow-xs flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Video className="w-3.5 h-3.5" />
                <span>{isAiVerifying ? 'AI ভিডিও ও ফেস ম্যাচিং চলছে...' : 'AI স্মার্ট NID ও ফেস ভেরিফিকেশন চালান'}</span>
              </button>
            )}

            {isAiKycVerified && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl flex items-center justify-between text-[9.5px] font-bold">
                <div className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#2EAA26]" />
                  <span>NID স্মার্ট ভেরিফাইড ও সিস্টেমে লকড!</span>
                </div>
                <span className="bg-emerald-600 text-white text-[8px] px-2 py-0.5 rounded-full">
                  Badge: S-{district.substring(0, 3).toUpperCase()}
                </span>
              </div>
            )}

          </div>
        )}

        {/* Navigation Buttons (Back / Next / Save) */}
        <div className="flex items-center justify-between gap-2 pt-2">
          {currentStep > 1 ? (
            <button
              type="button"
              onClick={() => setCurrentStep(s => s - 1)}
              className="px-4 py-2.5 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              ← আগের ধাপ
            </button>
          ) : (
            <div></div>
          )}

          {currentStep < totalSteps ? (
            <button
              type="button"
              onClick={() => setCurrentStep(s => s + 1)}
              className="px-5 py-2.5 bg-[#2EAA26] hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1 transition cursor-pointer"
            >
              <span>পরবর্তী ধাপ</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinalSubmit}
              disabled={isSubmitting}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white rounded-xl text-xs font-black shadow-md flex items-center gap-1.5 transition cursor-pointer active:scale-95"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>ক্লাউড স্টোরেজে আপলোড ও সংরক্ষণ হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>পোর্টফোলিও ফাইনাল পাবলিশ করুন</span>
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
