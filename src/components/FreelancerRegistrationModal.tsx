import React, { useState } from 'react';
import { 
  X, Wrench, ShieldCheck, MapPin, Upload, Camera, Award, 
  Image as ImageIcon, CheckCircle2, DollarSign, Plus, Trash2, 
  Sparkles, AlertCircle, Navigation, Info, UserCheck, Briefcase
} from 'lucide-react';
import { District, Language, UserProfile, WorkerPortfolioRegistration, ServiceProvider } from '../types';
import { databaseService } from '../services/databaseService';
import { sanitizeDatabasePayload } from '../utils/imageUtils';

interface FreelancerRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newProvider: ServiceProvider) => void;
  currentUser?: UserProfile | null;
  lang: Language;
  defaultDistrict?: District;
  defaultUpazila?: string;
  defaultMahalla?: string;
  onOpenMembershipModal?: () => void;
}

const PROFESSIONS_LIST = [
  { id: 'electrician', nameBn: 'সার্টিফাইড ইলেকট্রিশিয়ান (Electrician)', icon: '⚡', categoryEn: 'Electrician' },
  { id: 'delivery', nameBn: 'ডেলিভারি পার্সোনেল ও রাইডার (Delivery Person)', icon: '📦', categoryEn: 'Delivery Personnel' },
  { id: 'tutor', nameBn: 'হোম টিউটর ও শিক্ষক (Home Tutor)', icon: '📚', categoryEn: 'Home Tutor' },
  { id: 'nurse', nameBn: 'ডিপ্লোমা নার্স ও ইনজেকশন/কেয়ার (Nurse)', icon: '💉', categoryEn: 'Nurse & Healthcare' },
  { id: 'daily_labor', nameBn: 'দৈনিক লেবার ও হেল্পার (Daily Labourer)', icon: '🛠️', categoryEn: 'Daily Labourer' },
  { id: 'plumber', nameBn: 'প্লাম্বার ও পাইপ ফিটার (Plumber & Pipe Fitter)', icon: '🚰', categoryEn: 'Plumber' },
  { id: 'mason', nameBn: 'রাজমিস্ত্রি ও রডমিস্ত্রি (Mason & Construction)', icon: '🧱', categoryEn: 'Mason' },
  { id: 'doctor', nameBn: 'এমবিবিএস ডাক্তার ও কনসালট্যান্ট (Doctor)', icon: '🩺', categoryEn: 'Doctor' },
  { id: 'home_cleaner', nameBn: 'হোম ক্লিনার ও ডিপ ক্লিনিং (Home Cleaner)', icon: '🧹', categoryEn: 'Home Cleaner' },
  { id: 'carpenter', nameBn: 'কাঠমিস্ত্রি ও ফার্নিচার মেকার (Carpenter)', icon: '🪚', categoryEn: 'Carpenter' },
  { id: 'cook', nameBn: 'বাবুর্চি ও হোম কুক (Cook & Catering)', icon: '👨‍🍳', categoryEn: 'Cook & Chef' },
  { id: 'caretaker', nameBn: 'কেয়ারটেকার ও বয়স্কদের সেবা (Caretaker)', icon: '🏡', categoryEn: 'Caretaker' },
  { id: 'driver_cng', nameBn: 'সিএনজি ও মাহিন্দ্রা চালক (CNG Driver)', icon: '🛺', categoryEn: 'CNG Driver' },
  { id: 'driver_bike', nameBn: 'বাইক রাইডার ও অন-স্পট মেকানিক (Bike Rider)', icon: '🏍️', categoryEn: 'Bike Rider/Mechanic' },
  { id: 'ac_technician', nameBn: 'এসি ও ফ্রিজ মেকানিক (AC/Fridge Technician)', icon: '❄️', categoryEn: 'AC & Fridge Technician' },
  { id: 'painter', nameBn: 'কালার পেইন্টার ও ডেকোরেটর (Painter)', icon: '🎨', categoryEn: 'Painter & Decorator' },
];

export const FreelancerRegistrationModal: React.FC<FreelancerRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentUser,
  lang,
  defaultDistrict = 'Rangamati',
  defaultUpazila = 'Rangamati Sadar',
  defaultMahalla = 'বনরুপা (Bonorupa)',
  onOpenMembershipModal,
}) => {
  // Form State
  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(
    currentUser?.avatar || ''
  );
  const [selectedProfession, setSelectedProfession] = useState('electrician');
  const [customProfessionTitle, setCustomProfessionTitle] = useState('');
  const [rateType, setRateType] = useState<'Hourly' | 'Daily' | 'Fixed'>('Hourly');
  const [rateAmount, setRateAmount] = useState<number>(350);
  const [bio, setBio] = useState('');
  
  const [skillsDetails, setSkillsDetails] = useState('');
  const [experienceYears, setExperienceYears] = useState<number>(1);

  const [coveredAreas, setCoveredAreas] = useState<string[]>([]);

  const [skillsList, setSkillsList] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');

  const [portfolioImages, setPortfolioImages] = useState<string[]>([]);
  const [newImageUrl, setNewImageUrl] = useState('');

  const [certificates, setCertificates] = useState<string[]>([]);
  const [newCertInput, setNewCertInput] = useState('');

  const [nidNumber, setNidNumber] = useState(currentUser?.nidNumber || '');
  const [nidFrontUrl, setNidFrontUrl] = useState('');
  const [nidBackUrl, setNidBackUrl] = useState('');

  // Mandatory Consent State (Rule 6 enforced)
  const [consentAccepted, setConsentAccepted] = useState<boolean>(false);

  const [district, setDistrict] = useState<District>(defaultDistrict);
  const [upazila, setUpazila] = useState(defaultUpazila);
  const [mahalla, setMahalla] = useState(defaultMahalla);
  const [mapAddressPin, setMapAddressPin] = useState(`বনরুপা বাজার মেইন রোড, ${defaultUpazila}, ${defaultDistrict}`);
  const [latitude, setLatitude] = useState<number>(22.6515);
  const [longitude, setLongitude] = useState<number>(92.1792);

  // Submission State
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [errorNotice, setErrorNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleAddSkill = () => {
    if (newSkillInput.trim() && !skillsList.includes(newSkillInput.trim())) {
      setSkillsList([...skillsList, newSkillInput.trim()]);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (idx: number) => {
    setSkillsList(skillsList.filter((_, i) => i !== idx));
  };

  const handleAddPortfolioImage = () => {
    if (newImageUrl.trim()) {
      setPortfolioImages([...portfolioImages, newImageUrl.trim()]);
      setNewImageUrl('');
    }
  };

  const handleRemovePortfolioImage = (idx: number) => {
    setPortfolioImages(portfolioImages.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorNotice(null);
    setSuccessNotice(null);

    if (!fullName.trim() || !phone.trim() || !nidNumber.trim()) {
      setErrorNotice('অনুগ্রহ করে পূর্ণ নাম, সচল মোবাইল নম্বর এবং এনআইডি নম্বর প্রদান করুন।');
      return;
    }

    if (!consentAccepted) {
      setErrorNotice('ফর্ম সাবমিট করতে শর্তাবলী ও গোপনীয়তা নীতিতে সম্মতি প্রদান বাধ্যতামূলক।');
      return;
    }

    const selectedProfObj = PROFESSIONS_LIST.find((p) => p.id === selectedProfession);
    const professionBn = customProfessionTitle.trim() || selectedProfObj?.nameBn.split('(')[0].trim() || 'দক্ষ টেকনিশিয়ান';
    const professionEn = selectedProfObj?.categoryEn || 'Service Provider';

    const newServiceProvider: ServiceProvider = {
      id: 'prov_' + Date.now(),
      name: fullName.trim(),
      avatar: profilePhotoUrl.trim(),
      categoryBn: professionBn,
      categoryEn: professionEn,
      subCategory: skillsList.slice(0, 3).join(', ') || 'In-Person Hyperlocal Service',
      rating: 5.0,
      jobsCompleted: 0,
      hourlyRate: rateType === 'Hourly' ? rateAmount : Math.round(rateAmount / 8),
      dailyRate: rateType === 'Daily' ? rateAmount : rateAmount * 8,
      fixedRate: rateType === 'Fixed' ? rateAmount : undefined,
      rateType,
      phoneHidden: phone.slice(0, 4) + 'XXXX' + phone.slice(-3),
      realPhone: phone,
      district,
      upazila,
      mahalla,
      nidVerified: true,
      selfieVerified: true,
      blueTickActive: true,
      isAvailableNow: true,
      distanceKm: 0.5,
      bioBn: bio.trim(),
      bioEn: bio.trim(),
      skills: skillsList,
      skillsDetails: skillsDetails.trim(),
      experienceYears,
      coveredAreas: coveredAreas.length > 0 ? coveredAreas : [mahalla, upazila, district],
      coverageRadiusKm: 15,
      workGallery: portfolioImages,
      verifiedCertificates: certificates,
      nidNumber,
      nidFrontUrl,
      nidBackUrl,
      detailedAddress: mapAddressPin,
      latitude,
      longitude,
      googleMapsEmbedUrl: `https://maps.google.com/?q=${latitude},${longitude}`,
      serviceArea: `${mahalla}, ${upazila}, ${district}`,
      isPaidProPartner: true,
      customerReviews: [
        {
          id: 'rev_initial',
          customerName: 'ঝাদিমাদি ভেরিফিকেশন টিম',
          rating: 5.0,
          comment: 'এনআইডি ও স্কিল পোর্টফোলিও শতভাগ যাচাইকৃত এবং অনুমোদিত।',
          date: 'আজ',
        },
      ],
      privateWallet: {
        walletBalance: 0,
        totalEarnings: 0,
        completedJobs: 0,
        pendingPayouts: 0,
        pendingEscrow: 0,
      },
    };

    setIsSubmitting(true);

    try {
      const providerDocId = newServiceProvider.id;
      const userDoc: UserProfile = {
        id: providerDocId,
        memberUID: providerDocId,
        memberId: providerDocId,
        name: fullName.trim(),
        fullName: fullName.trim(),
        phone: phone.trim(),
        email: `${phone.trim().replace(/[^0-9]/g, '')}@jhadimadi.com`,
        avatar: profilePhotoUrl.trim() || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=300',
        role: 'professional',
        division: 'চট্টগ্রাম',
        district: district as any,
        upazila: upazila,
        thana: upazila,
        mahalla: mahalla,
        para: mahalla,
        paraMahalla: `${mahalla}, ${upazila}`,
        profession: professionEn,
        professionBn: professionBn,
        serviceCategory: professionEn,
        categorySkill: skillsList.join(', '),
        nidNumber: nidNumber.trim() || undefined,
        isNidVerified: true,
        isPaidMember: true,
        isBloodDonor: true,
        isBloodDonorAvailable: true,
        createdAt: new Date().toISOString().split('T')[0],
      };

      const result = await databaseService.registerProvider({
        ...userDoc,
        ...newServiceProvider,
        id: providerDocId,
      });

      if (!result.success) {
        throw new Error(result.error || 'ফায়ারস্টোরে সংরক্ষণ ব্যর্থ হয়েছে');
      }

      setSuccessNotice('✓ আপনার ফ্রিল্যান্সার প্রোফাইল সফলভাবে সংরক্ষিত হয়েছে!');
    } catch (err: any) {
      console.error('Firestore save error:', err);
      setSuccessNotice(`ত্রুটি: ${err?.message || 'সংরক্ষণ সম্ভব হয়নি'}`);
    } finally {
      setIsSubmitting(false);
      setTimeout(() => {
        onSuccess(newServiceProvider);
        onClose();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white border-2 border-[#00A86B]/40 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-800 my-auto flex flex-col max-h-[92vh] animate-in zoom-in-95">
        
        {/* Header */}
        <div className="bg-slate-900 text-white px-4 py-3 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-[#00A86B]/20 text-[#00A86B] rounded-xl border border-[#00A86B]/40 font-bold text-xs">
              👷 ফ্রিল্যান্সার পোর্টফোলিও সেটআপ
            </span>
            <span className="text-[10px] text-emerald-400 font-extrabold bg-emerald-950/80 px-2 py-0.5 rounded-full border border-emerald-700/50">
              Verified Pro [✓]
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <div className="p-4 space-y-4 overflow-y-auto flex-1 bg-[#F8FAFC]">
          
          <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3 text-xs text-emerald-900 flex items-start gap-2.5 shadow-2xs">
            <ShieldCheck className="w-5 h-5 text-[#00A86B] shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <h4 className="font-extrabold text-xs">ইন-পার্সন সার্ভিস প্রোভাইডার ডিরেক্টরি</h4>
              <p className="text-[11px] text-slate-600 leading-snug">
                ডেলিভারিম্যান, ইলেকট্রিশিয়ান, প্লাম্বার, ডাক্তার, নার্স বা টিউটর হিসেবে আপনার কাজের পোর্টফোলিও ও রেট সাজান।
              </p>
            </div>
          </div>

          {errorNotice && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-bold flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorNotice}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 rounded-xl text-emerald-900 text-xs font-black flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-[#00A86B] shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            
            {/* Section 1: Basic Identity & Photo */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h4 className="font-black text-xs text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <UserCheck className="w-4 h-4 text-[#00A86B]" />
                <span>১. ব্যক্তিগত পরিচয় ও প্রোফাইল ছবি</span>
              </h4>

              <div className="flex items-center gap-3">
                <div className="relative shrink-0">
                  <img
                    src={profilePhotoUrl}
                    alt="Preview"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-[#00A86B] shadow-sm bg-slate-100"
                  />
                  <span className="absolute -bottom-1 -right-1 bg-[#00A86B] text-white p-1 rounded-full border border-white">
                    <CheckCircle2 className="w-3 h-3" />
                  </span>
                </div>

                <div className="flex-1 space-y-1.5">
                  <label className="block text-[10px] font-bold text-slate-600">
                    প্রোফাইল ছবির ইমেজ লিংক (Photo URL):
                  </label>
                  <input
                    type="url"
                    value={profilePhotoUrl}
                    onChange={(e) => setProfilePhotoUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-[#00A86B]"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    আপনার পূর্ণ নাম (Full Name):
                  </label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="পূর্ণ নাম লিখুন"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#00A86B]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    মোবাইল নম্বর (Contact Phone):
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="018XXXXXXXX"
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold focus:outline-none focus:border-[#00A86B]"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Profession & Details */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h4 className="font-black text-xs text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <Briefcase className="w-4 h-4 text-[#FF6B35]" />
                <span>২. পেশা ও কাজের বিবরণ (Bio & Professional Description)</span>
              </h4>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-1">
                  পেশা / ক্যাটাগরি নির্বাচন করুন:
                </label>
                <select
                  value={selectedProfession}
                  onChange={(e) => setSelectedProfession(e.target.value)}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#00A86B]"
                >
                  {PROFESSIONS_LIST.map((prof) => (
                    <option key={prof.id} value={prof.id}>
                      {prof.icon} {prof.nameBn}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-slate-700">
                  বায়ো / কাজের অভিজ্ঞতা ও বিবরণ (Bio & Professional Description):
                </label>
                <textarea
                  rows={3}
                  value={skillsDetails}
                  onChange={(e) => setSkillsDetails(e.target.value)}
                  placeholder="আপনার কাজের দীর্ঘ অভিজ্ঞতা, বিশেষজ্ঞতা, টুলস ব্যবহারের পারদর্শিতা এবং গ্রাহকদের কী ধরণের সেরা সেবা প্রদান করেন তা বিস্তারিত লিখুন..."
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs leading-relaxed focus:outline-none focus:border-[#00A86B]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    মজুরি ধরণ:
                  </label>
                  <select
                    value={rateType}
                    onChange={(e) => setRateType(e.target.value as any)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
                  >
                    <option value="Hourly">প্রতি ঘণ্টা (Hourly)</option>
                    <option value="Daily">দৈনিক (Daily)</option>
                    <option value="Fixed">ফিক্সড (Fixed)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 mb-1">
                    রেট পরিমাণ (BDT ৳):
                  </label>
                  <input
                    type="number"
                    value={rateAmount}
                    onChange={(e) => setRateAmount(Number(e.target.value))}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Section 3: Portfolio & Gallery (Matching your screenshot view) */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <h4 className="font-black text-xs text-slate-900 flex items-center gap-1.5 border-b border-slate-100 pb-2">
                <ImageIcon className="w-4 h-4 text-purple-600" />
                <span>৩. কাজের স্যাম্পল ও পোর্টফোলিও ছবি (Portfolio Gallery)</span>
              </h4>

              <div className="space-y-1.5">
                <div className="p-3 border-2 border-dashed border-slate-200 rounded-xl text-center bg-slate-50 hover:bg-slate-100 transition-colors">
                  <p className="text-[11px] font-bold text-slate-600 mb-1.5">🖼️ কাজের ছবি যুক্ত করুন (একাধিক ফটো)</p>
                  <div className="flex gap-1.5">
                    <input
                      type="url"
                      value={newImageUrl}
                      onChange={(e) => setNewImageUrl(e.target.value)}
                      placeholder="ছবির ইমেজ লিংক (Image URL) দিন..."
                      className="flex-1 p-2 bg-white border border-slate-200 rounded-xl text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddPortfolioImage}
                      className="px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-xs cursor-pointer"
                    >
                      + যোগ
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 pt-1">
                  {portfolioImages.map((url, idx) => (
                    <div key={idx} className="relative group h-16 rounded-xl overflow-hidden border border-slate-200">
                      <img src={url} alt="Work sample" className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() => handleRemovePortfolioImage(idx)}
                        className="absolute top-1 right-1 bg-rose-600 text-white p-1 rounded-full text-[9px] cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Mandatory Consent & Submit Section (Rule 6 placed exactly at the bottom before submit) */}
            <div className="bg-emerald-50/80 p-3.5 rounded-2xl border border-emerald-300 space-y-3 shadow-2xs">
              <div className="flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="mandatoryConsentCheck"
                  checked={consentAccepted}
                  onChange={(e) => setConsentAccepted(e.target.checked)}
                  className="mt-0.5 w-4 h-4 text-[#00A86B] rounded border-emerald-400 focus:ring-[#00A86B] cursor-pointer"
                  required
                />
                <label htmlFor="mandatoryConsentCheck" className="text-xs font-bold text-slate-900 leading-snug cursor-pointer">
                  [ √ ] আমি শর্তাবলী ও গোপনীয়তা নীতিতে সম্মত আছি এবং আমার তথ্য সুরক্ষার বিষয়টি মেনে নিচ্ছি। <span className="text-[10px] text-rose-600 block font-normal">(এটি ছাড়া ফর্ম সাবমিট হবে না)</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !consentAccepted}
                className="w-full py-3 bg-[#00A86B] hover:bg-emerald-700 disabled:bg-slate-300 disabled:text-slate-500 text-white font-black rounded-xl text-xs shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    <span>তথ্য আপডেট হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>তথ্য আপডেট করুন</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
};