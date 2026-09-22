import React, { useState } from 'react';
import { 
  ArrowLeft, CheckCircle2, LogOut, MapPin, Phone, 
  ShieldCheck, Wallet, Plus, FileText, Clock, 
  ArrowUpRight, AlertCircle, Briefcase, Award, 
  UserCheck, Star, Camera, Upload, Trash2, Edit3, Eye, 
  Check, DollarSign, Image as ImageIcon, Sparkles
} from 'lucide-react';
import { Language, UserProfile, FeedPost, ServiceProvider } from '../types';

interface ProfileScreenProps {
  currentUser: UserProfile;
  onBack: () => void;
  onLogout: () => void;
  lang: Language;
  userPosts: FeedPost[];
  onOpenCreatePost: () => void;
  onOpenMembershipModal?: () => void;
  onOpenFreelancerSetup?: () => void;
  onViewMyWorkerProfile?: () => void;
  workerProfile?: ServiceProvider | null;
  onUpdateWorkerProfile?: (updated: ServiceProvider) => void;
}

const PROFESSIONS_OPTIONS = [
  { id: 'electrician', nameBn: 'ইলেকট্রিশিয়ান ও টেকনিশিয়ান', categoryEn: 'Electrician & Technician' },
  { id: 'delivery', nameBn: 'ডেলিভারি রাইডার ও পার্সেল সার্ভিস', categoryEn: 'Delivery Personnel' },
  { id: 'tutor', nameBn: 'হোম টিউটর ও শিক্ষক', categoryEn: 'Home Tutor' },
  { id: 'nurse', nameBn: 'ডিপ্লোমা নার্স ও হোম কেয়ার', categoryEn: 'Nurse & Healthcare' },
  { id: 'plumber', nameBn: 'প্লাম্বার ও স্যানিটারি মিস্ত্রি', categoryEn: 'Plumber' },
  { id: 'mason', nameBn: 'রাজমিস্ত্রি ও টাইলস মিস্ত্রি', categoryEn: 'Mason' },
  { id: 'carpenter', nameBn: 'কাঠমিস্ত্রি ও ফার্নিচার মেকার', categoryEn: 'Carpenter' },
  { id: 'ac_technician', nameBn: 'এসি ও ফ্রিজ টেকনিশিয়ান', categoryEn: 'AC/Fridge Technician' },
  { id: 'painter', nameBn: 'কালার পেইন্টার ও ডেকোরেটর', categoryEn: 'Painter' },
  { id: 'driver_cng', nameBn: 'সিএনজি ও মাহিন্দ্রা ড্রাইভার', categoryEn: 'CNG Driver' },
  { id: 'driver_bike', nameBn: 'বাইক রাইডার ও মেকানিক', categoryEn: 'Bike Rider' },
  { id: 'home_cleaner', nameBn: 'হোম ক্লিনার ও ডিপ ক্লিনিং', categoryEn: 'Home Cleaner' },
  { id: 'cook', nameBn: 'বাবুর্চি ও হোম কুক', categoryEn: 'Cook & Chef' },
];

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  currentUser,
  onBack,
  onLogout,
  lang,
  userPosts,
  onOpenCreatePost,
  onViewMyWorkerProfile,
  workerProfile: initialWorkerProfile,
  onUpdateWorkerProfile,
}) => {
  // Main Tab Navigation: Freelancer Profile / Portfolio / Earnings / Listings
  const [activeTab, setActiveTab] = useState<'profile' | 'portfolio' | 'earnings' | 'listings'>('profile');

  // Freelancer Profile & Portfolio State
  const [profileAvatar, setProfileAvatar] = useState(
    currentUser.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'
  );
  const [coverPhoto, setCoverPhoto] = useState(
    'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1000&q=80'
  );

  // Skill, Bio, Rates & Experience
  const [selectedSkill, setSelectedSkill] = useState(
    initialWorkerProfile?.professionKey || 'electrician'
  );
  const [bio, setBio] = useState(
    initialWorkerProfile?.bio ||
    'দক্ষ ও অভিজ্ঞ টেকনিশিয়ান। বিশ্বস্ততা ও নিষ্ঠার সাথে ইলেকট্রিক, নার্সিং, মেরামত ও জরুরি অন-ডিমান্ড সেবা দিয়ে থাকি।'
  );
  const [experienceYears, setExperienceYears] = useState<number>(
    initialWorkerProfile?.experienceYears || 5
  );
  const [rateType, setRateType] = useState<'Hourly' | 'Daily' | 'Fixed'>(() => {
    const raw = initialWorkerProfile?.rateType;
    if (raw === 'Daily' || raw === 'দৈনিক') return 'Daily';
    if (raw === 'Fixed' || raw === 'চুক্তিভিত্তিক') return 'Fixed';
    return 'Hourly';
  });
  const [hourlyRate, setHourlyRate] = useState<number>(
    initialWorkerProfile?.hourlyRate || 350
  );
  const [dailyRate, setDailyRate] = useState<number>(
    initialWorkerProfile?.dailyRate || 1200
  );
  const [fixedRate, setFixedRate] = useState<number>(
    initialWorkerProfile?.fixedRate || 500
  );
  const [serviceArea, setServiceArea] = useState(
    initialWorkerProfile?.serviceArea || `${currentUser.mahalla}, ${currentUser.upazila}`
  );

  // Skills Tags
  const [skillsList, setSkillsList] = useState<string[]>(
    initialWorkerProfile?.skills || []
  );
  const [newSkillInput, setNewSkillInput] = useState('');

  // Portfolio Showcase Images (Past work samples)
  const [portfolioImages, setPortfolioImages] = useState<string[]>(
    initialWorkerProfile?.portfolioImages || initialWorkerProfile?.workGallery || []
  );
  const [newPortfolioUrl, setNewPortfolioUrl] = useState('');
  const [isSavedSuccess, setIsSavedSuccess] = useState(false);

  // Wallet & Earnings
  const [walletBalance, setWalletBalance] = useState<number>(initialWorkerProfile?.privateWallet?.walletBalance ?? 0);
  const [pendingEscrow] = useState<number>(initialWorkerProfile?.privateWallet?.pendingEscrow ?? 0);
  const [totalLifetimeEarnings] = useState<number>(initialWorkerProfile?.privateWallet?.totalEarnings ?? 0);
  const [showCashoutModal, setShowCashoutModal] = useState(false);

  // Add Skill Tag
  const handleAddSkill = () => {
    if (newSkillInput.trim() && !skillsList.includes(newSkillInput.trim())) {
      setSkillsList([...skillsList, newSkillInput.trim()]);
      setNewSkillInput('');
    }
  };

  const handleRemoveSkill = (index: number) => {
    setSkillsList(skillsList.filter((_, i) => i !== index));
  };

  // Add Portfolio Image
  const handleAddPortfolioImage = () => {
    if (newPortfolioUrl.trim()) {
      setPortfolioImages([newPortfolioUrl.trim(), ...portfolioImages]);
      setNewPortfolioUrl('');
    }
  };

  const handleRemovePortfolioImage = (index: number) => {
    setPortfolioImages(portfolioImages.filter((_, i) => i !== index));
  };

  // Save / Update Portfolio Profile Handler
  const handleSaveProfile = () => {
    const matchedProf = PROFESSIONS_OPTIONS.find((p) => p.id === selectedSkill);
    const updatedProvider: ServiceProvider = {
      id: currentUser.id,
      name: currentUser.name,
      avatar: profileAvatar,
      categoryBn: matchedProf ? matchedProf.nameBn : 'সার্ভিস প্রোভাইডার',
      categoryEn: matchedProf ? matchedProf.categoryEn : 'Service Provider',
      serviceCategory: matchedProf ? matchedProf.nameBn : 'সার্ভিস প্রোভাইডার',
      subCategory: `${experienceYears} বছরের অভিজ্ঞতা সম্পন্ন`,
      rating: initialWorkerProfile?.rating ?? 0.0,
      jobsCompleted: initialWorkerProfile?.jobsCompleted || 0,
      hourlyRate: rateType === 'Hourly' ? hourlyRate : (rateType === 'Daily' ? Math.round(dailyRate / 8) : fixedRate),
      rateType: rateType,
      dailyRate: dailyRate,
      fixedRate: fixedRate,
      experienceYears: experienceYears,
      skills: skillsList,
      portfolioImages: portfolioImages,
      workGallery: portfolioImages,
      serviceArea: serviceArea,
      phoneHidden: currentUser.phone,
      realPhone: currentUser.phone,
      district: currentUser.district as any,
      upazila: currentUser.upazila,
      mahalla: currentUser.mahalla,
      nidVerified: true,
      selfieVerified: true,
      blueTickActive: true,
      isAvailableNow: true,
      distanceKm: 0.8,
      bioBn: bio,
      bioEn: bio,
      privateWallet: {
        walletBalance,
        pendingEscrow,
        totalEarnings: totalLifetimeEarnings,
        completedJobs: initialWorkerProfile?.jobsCompleted || 0,
        pendingPayouts: 0,
      }
    };

    if (onUpdateWorkerProfile) {
      onUpdateWorkerProfile(updatedProvider);
    }

    setIsSavedSuccess(true);
    setTimeout(() => setIsSavedSuccess(false), 3500);
  };

  return (
    <div className="w-full max-w-md mx-auto bg-white rounded-2xl border border-slate-200/90 p-3 space-y-4 shadow-sm pb-16" id="freelancer-profile-dashboard">
      
      {/* 1. Header with Navigation */}
      <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
        <button
          onClick={onBack}
          className="p-1.5 text-slate-700 hover:text-black flex items-center gap-1.5 font-bold text-xs cursor-pointer rounded-lg hover:bg-slate-100 transition"
        >
          <ArrowLeft className="w-4 h-4 text-[#B80000]" />
          <span>{lang === 'bn' ? 'হোমে ফিরুন' : 'Back'}</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-[10px] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            <span>সার্ভিস মেম্বার [✓]</span>
          </span>
          <button
            onClick={onLogout}
            className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer transition"
            title="লগআউট করুন"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 2. FREELANCER HERO HEADER: COVER PICTURE & AVATAR UPLOAD */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 shadow-xs">
        {/* Cover Photo */}
        <div className="h-28 sm:h-36 w-full relative bg-slate-800">
          <img
            src={coverPhoto}
            alt="Profile Cover"
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
          
          {/* Change Cover Photo Button */}
          <button
            onClick={() => {
              const url = prompt('নতুন কভার ছবির ইমেজ লিংক (URL) দিন:', coverPhoto);
              if (url && url.trim()) setCoverPhoto(url.trim());
            }}
            className="absolute top-2.5 right-2.5 px-2.5 py-1 bg-black/60 hover:bg-black/80 backdrop-blur-xs text-white rounded-xl text-[10px] font-extrabold flex items-center gap-1 border border-white/20 cursor-pointer transition"
          >
            <Camera className="w-3 h-3" />
            <span>কভার পরিবর্তন</span>
          </button>
        </div>

        {/* Profile Avatar & Key Stats Info */}
        <div className="p-3 pt-0 bg-white relative">
          <div className="flex items-end justify-between -mt-10 sm:-mt-12 mb-2">
            {/* Avatar with Upload Badge */}
            <div className="relative">
              <img
                src={profileAvatar}
                alt={currentUser.name}
                className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl object-cover border-4 border-white shadow-md bg-white"
              />
              <button
                onClick={() => {
                  const url = prompt('নতুন প্রোফাইল ছবির ইমেজ লিংক (URL) দিন:', profileAvatar);
                  if (url && url.trim()) setProfileAvatar(url.trim());
                }}
                className="absolute bottom-1 right-1 p-1.5 bg-[#B80000] hover:bg-[#960000] text-white rounded-xl shadow-md border-2 border-white cursor-pointer transition"
                title="প্রোফাইল ছবি পরিবর্তন করুন"
              >
                <Camera className="w-3 h-3" />
              </button>
            </div>

            {/* Quick Action Preview */}
            <div className="flex gap-2">
              {onViewMyWorkerProfile && (
                <button
                  onClick={onViewMyWorkerProfile}
                  className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-[11px] font-black flex items-center gap-1 shadow-xs cursor-pointer transition active:scale-95"
                >
                  <Eye className="w-3.5 h-3.5 text-emerald-400" />
                  <span>পাবলিক ভিউ</span>
                </button>
              )}
              <button
                onClick={handleSaveProfile}
                className="px-3.5 py-1.5 bg-[#0A7B44] hover:bg-[#086337] text-white rounded-xl text-[11px] font-black flex items-center gap-1 shadow-xs cursor-pointer transition active:scale-95"
              >
                <Check className="w-3.5 h-3.5" />
                <span>সংরক্ষণ করুন</span>
              </button>
            </div>
          </div>

          {/* Member Name & Badges */}
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-base sm:text-lg font-black text-slate-900 leading-none">
                {currentUser.name}
              </h2>
              <span className="p-0.5 bg-emerald-500 text-white rounded-full" title="Verified Member">
                <CheckCircle2 className="w-3.5 h-3.5 fill-emerald-500 text-white" />
              </span>
            </div>
            
            <p className="text-xs font-bold text-slate-600 flex items-center gap-2 flex-wrap">
              <span className="text-[#B80000] font-black">
                {PROFESSIONS_OPTIONS.find((p) => p.id === selectedSkill)?.nameBn || 'সার্ভিস প্রোভাইডার'}
              </span>
              <span>•</span>
              <span className="flex items-center gap-0.5 text-slate-500">
                <MapPin className="w-3 h-3 text-slate-400" />
                {currentUser.mahalla}, {currentUser.upazila}
              </span>
              <span>•</span>
              <span className="text-emerald-700 font-extrabold flex items-center gap-1">
                <Phone className="w-3 h-3" />
                {currentUser.phone}
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Save Success Banner */}
      {isSavedSuccess && (
        <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center gap-2 text-xs font-black text-emerald-950 animate-in fade-in zoom-in">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>✓ আপনার ফ্রিল্যান্সার পোর্টফোলিও এবং স্কিল সফলভাবে আপডেট ও প্রকাশিত হয়েছে!</span>
        </div>
      )}

      {/* 3. FREELANCER DASHBOARD SUB-TABS */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 min-w-[100px] py-2 px-2.5 rounded-xl text-center cursor-pointer transition flex items-center justify-center gap-1 ${
            activeTab === 'profile'
              ? 'bg-white text-slate-900 shadow-xs font-black border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5 text-[#B80000]" />
          <span>প্রোফাইল ও স্কিল</span>
        </button>

        <button
          onClick={() => setActiveTab('portfolio')}
          className={`flex-1 min-w-[100px] py-2 px-2.5 rounded-xl text-center cursor-pointer transition flex items-center justify-center gap-1 ${
            activeTab === 'portfolio'
              ? 'bg-white text-slate-900 shadow-xs font-black border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5 text-blue-600" />
          <span>কাজের স্যাম্পল ({portfolioImages.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('earnings')}
          className={`flex-1 min-w-[90px] py-2 px-2.5 rounded-xl text-center cursor-pointer transition flex items-center justify-center gap-1 ${
            activeTab === 'earnings'
              ? 'bg-white text-slate-900 shadow-xs font-black border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Wallet className="w-3.5 h-3.5 text-emerald-600" />
          <span>ওয়ালেট ও আয়</span>
        </button>

        <button
          onClick={() => setActiveTab('listings')}
          className={`flex-1 min-w-[80px] py-2 px-2.5 rounded-xl text-center cursor-pointer transition flex items-center justify-center gap-1 ${
            activeTab === 'listings'
              ? 'bg-white text-slate-900 shadow-xs font-black border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-amber-600" />
          <span>পোস্ট ({userPosts.length})</span>
        </button>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: FREELANCER PROFILE & SKILLS SETUP */}
      {/* ======================================================== */}
      {activeTab === 'profile' && (
        <div className="space-y-4">
          
          {/* 1. Profession / Service Category Selection */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
            <label className="block text-xs font-black text-slate-800">
              ১. আপনার প্রধান সেবা বা প্রফেশন (Select Profession): <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#B80000] cursor-pointer"
            >
              {PROFESSIONS_OPTIONS.map((prof) => (
                <option key={prof.id} value={prof.id}>
                  {prof.nameBn} ({prof.categoryEn})
                </option>
              ))}
            </select>
            <p className="text-[10px] text-slate-500">
              গ্রাহকরা যখন এই ক্যাটাগরিতে সার্চ করবেন, আপনার প্রোফাইল অগ্রাধিকার পাবে।
            </p>
          </div>

          {/* 2. Bio / Experience Description */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-black text-slate-800">
                ২. নিজের সম্পর্কে বিবরণ (Bio / Description):
              </label>
              <span className="text-[10px] text-slate-400 font-bold">Freelancer Bio</span>
            </div>
            <textarea
              rows={3}
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="আপনার দক্ষতা, অভিজ্ঞতা এবং কি কি সেবা দেন তা বিস্তারিত লিখুন..."
              className="w-full p-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#B80000]"
            />
          </div>

          {/* 3. Rates & Experience Years */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
            <label className="block text-xs font-black text-slate-800">
              ৩. সার্ভিসের রেট ও কাজের অভিজ্ঞতা:
            </label>
            
            {/* Rate Type Selector */}
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRateType('Hourly')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border cursor-pointer transition ${
                  rateType === 'Hourly'
                    ? 'bg-[#B80000] text-white border-[#B80000]'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                ঘণ্টাভিত্তিক (Hourly)
              </button>
              <button
                type="button"
                onClick={() => setRateType('Daily')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border cursor-pointer transition ${
                  rateType === 'Daily'
                    ? 'bg-[#B80000] text-white border-[#B80000]'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                দৈনিক হাজিরা (Daily)
              </button>
              <button
                type="button"
                onClick={() => setRateType('Fixed')}
                className={`py-2 px-2 rounded-xl text-xs font-bold border cursor-pointer transition ${
                  rateType === 'Fixed'
                    ? 'bg-[#B80000] text-white border-[#B80000]'
                    : 'bg-white text-slate-700 border-slate-200'
                }`}
              >
                ফিক্সড সার্ভিস (Fixed)
              </button>
            </div>

            {/* Inputs: Amount & Years */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <span className="block text-[10px] font-bold text-slate-600 mb-1">
                  {rateType === 'Hourly' ? 'প্রতি ঘণ্টার রেট (৳):' : rateType === 'Daily' ? 'দৈনিক রেট (৳):' : 'সার্ভিস চার্জ (৳):'}
                </span>
                <input
                  type="number"
                  value={rateType === 'Hourly' ? hourlyRate : rateType === 'Daily' ? dailyRate : fixedRate}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    if (rateType === 'Hourly') setHourlyRate(val);
                    else if (rateType === 'Daily') setDailyRate(val);
                    else setFixedRate(val);
                  }}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-800 focus:outline-none focus:border-[#B80000]"
                />
              </div>

              <div>
                <span className="block text-[10px] font-bold text-slate-600 mb-1">
                  কাজের অভিজ্ঞতা (বছর):
                </span>
                <input
                  type="number"
                  min="1"
                  max="40"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-black text-slate-800 focus:outline-none focus:border-[#B80000]"
                />
              </div>
            </div>

            {/* Service Coverage Area */}
            <div>
              <span className="block text-[10px] font-bold text-slate-600 mb-1">
                সেবা প্রদানের এলাকা (Coverage Area):
              </span>
              <input
                type="text"
                value={serviceArea}
                onChange={(e) => setServiceArea(e.target.value)}
                placeholder="যেমন: বনরুপা, তবলছড়ি, রাঙ্গামাটি সদর"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#B80000]"
              />
            </div>
          </div>

          {/* 4. Skills Tags & Expertise */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-2.5">
            <label className="block text-xs font-black text-slate-800">
              ৪. নির্দিষ্ট দক্ষতা ও কি-ওয়ার্ড (Skills Tags):
            </label>

            {/* Existing Tags */}
            <div className="flex flex-wrap gap-1.5">
              {skillsList.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 bg-white border border-slate-200 rounded-xl text-[10.5px] font-bold text-slate-800 flex items-center gap-1.5 shadow-2xs"
                >
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveSkill(idx)}
                    className="text-slate-400 hover:text-rose-600 cursor-pointer font-bold text-xs"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>

            {/* Add New Tag */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newSkillInput}
                onChange={(e) => setNewSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSkill();
                  }
                }}
                placeholder="নতুন স্কিল যোগ করুন (যেমন: সোলার প্যানেল ফিটিং)"
                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-[#B80000]"
              />
              <button
                type="button"
                onClick={handleAddSkill}
                className="px-3 py-2 bg-slate-800 hover:bg-black text-white rounded-xl text-xs font-black cursor-pointer transition"
              >
                + যোগ করুন
              </button>
            </div>
          </div>

          {/* Submit / Update Button */}
          <button
            type="button"
            onClick={handleSaveProfile}
            className="w-full py-3 bg-[#0A7B44] hover:bg-[#086337] text-white text-xs font-black rounded-xl shadow-md cursor-pointer transition active:scale-98 flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>প্রোফাইল ও স্কিল আপডেট সম্পন্ন করুন</span>
          </button>

        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: FREELANCER PORTFOLIO SHOWCASE (Work Samples) */}
      {/* ======================================================== */}
      {activeTab === 'portfolio' && (
        <div className="space-y-3.5">
          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl p-3.5 space-y-1">
            <div className="flex items-center gap-1.5 text-blue-900 font-extrabold text-xs">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>পোর্টফোলিও শ্যোকেস (Work Showcase)</span>
            </div>
            <p className="text-[10px] text-blue-800 leading-relaxed font-medium">
              আপনার আগের কাজের ছবি বা সফল প্রজেক্টের স্যাম্পল যুক্ত করুন। আকর্ষণীয় পোর্টফোলিও থাকলে গ্রাহকরা বেশি অর্ডার ও বুকিং প্রদান করে।
            </p>
          </div>

          {/* Add New Work Sample Image */}
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
            <label className="block text-xs font-black text-slate-800">
              নতুন কাজের ছবি যুক্ত করুন (Image URL):
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={newPortfolioUrl}
                onChange={(e) => setNewPortfolioUrl(e.target.value)}
                placeholder="ইমেজ লিংক দিন (যেমন: https://images.unsplash.com/...)"
                className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#B80000]"
              />
              <button
                type="button"
                onClick={handleAddPortfolioImage}
                className="px-3.5 py-2 bg-[#B80000] hover:bg-[#960000] text-white rounded-xl text-xs font-black cursor-pointer transition flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>যোগ করুন</span>
              </button>
            </div>
          </div>

          {/* Grid of Portfolio Work Samples */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700">
              <span>সংরক্ষিত কাজের নমুনা ({portfolioImages.length}টি)</span>
              <span className="text-[10px] text-slate-400 font-medium">Freelancer Gallery</span>
            </div>

            {portfolioImages.length === 0 ? (
              <div className="p-6 bg-slate-50 border border-dashed border-slate-300 rounded-2xl text-center space-y-1">
                <ImageIcon className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs text-slate-500 font-bold">কোনো কাজের ছবি যুক্ত করা হয়নি</p>
                <p className="text-[10px] text-slate-400">ওপরের বক্সে ইমেজ লিংক দিয়ে যোগ করুন</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {portfolioImages.map((imgUrl, index) => (
                  <div 
                    key={index}
                    className="group relative rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-video shadow-2xs"
                  >
                    <img
                      src={imgUrl}
                      alt={`Portfolio sample ${index + 1}`}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRemovePortfolioImage(index)}
                        className="p-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg shadow-sm cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <span className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-black/70 text-white rounded text-[8.5px] font-bold">
                      কাজ #{index + 1}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <button
            type="button"
            onClick={handleSaveProfile}
            className="w-full py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-black rounded-xl shadow-xs cursor-pointer transition flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4 text-emerald-400" />
            <span>পোর্টফোলিও পরিবর্তন সংরক্ষণ করুন</span>
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: WALLET & EARNINGS */}
      {/* ======================================================== */}
      {activeTab === 'earnings' && (
        <div className="space-y-3.5">
          <div className="rounded-2xl bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white p-3.5 space-y-3 shadow-md border border-slate-700">
            <div className="flex items-center justify-between border-b border-slate-700/60 pb-2">
              <div className="flex items-center gap-1.5">
                <div className="p-1.5 bg-[#B80000]/20 text-[#B80000] rounded-lg border border-[#B80000]/40">
                  <Wallet className="w-4 h-4" />
                </div>
                <div>
                  <span className="text-[10px] text-slate-300 font-semibold block">উত্তোলনযোগ্য ওয়ালেট ব্যালেন্স</span>
                  <span className="text-base font-black text-white">৳ {walletBalance.toLocaleString()}</span>
                </div>
              </div>

              <button
                onClick={() => alert(`আপনার বর্তমান ওয়ালেট ব্যালেন্স ৳${walletBalance}। টাকা উত্তোলনের জন্য সর্বনিম্ন ব্যালেন্স ৳৬০০ প্রয়োজন।`)}
                className="px-3 py-1.5 bg-[#B80000] hover:bg-[#960000] text-white font-black text-xs rounded-xl shadow-md cursor-pointer transition active:scale-95 flex items-center gap-1"
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>টাকা উত্তোলন</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs pt-0.5">
              <div className="bg-white/5 border border-white/10 p-2 rounded-xl">
                <span className="text-[9px] text-amber-300 font-bold block">পেন্ডিং এসক্রো</span>
                <strong className="text-xs text-white">৳ {pendingEscrow}</strong>
              </div>
              <div className="bg-white/5 border border-white/10 p-2 rounded-xl">
                <span className="text-[9px] text-emerald-300 font-bold block">সর্বমোট আয়</span>
                <strong className="text-xs text-white">৳ {totalLifetimeEarnings.toLocaleString()}</strong>
              </div>
              <div className="bg-white/5 border border-white/10 p-2 rounded-xl">
                <span className="text-[9px] text-blue-300 font-bold block">সম্পন্ন কাজ</span>
                <strong className="text-xs text-white">{initialWorkerProfile?.jobsCompleted || 12}টি</strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 4: MY POSTS / LISTINGS */}
      {/* ======================================================== */}
      {activeTab === 'listings' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-extrabold text-xs text-slate-800 flex items-center gap-1">
              <FileText className="w-4 h-4 text-[#B80000]" />
              <span>{lang === 'bn' ? 'আমার পোস্টসমূহ (My Listings)' : 'My Posts'}</span>
            </h4>
            <button
              onClick={onOpenCreatePost}
              className="px-2.5 py-1 bg-[#B80000] hover:bg-[#960000] text-white rounded-xl text-[10px] font-black flex items-center gap-1 shadow-xs cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>নতুন পোস্ট</span>
            </button>
          </div>

          {userPosts.length === 0 ? (
            <div className="p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-2">
              <p className="text-xs text-slate-500 font-medium">আপনার কোনো সক্রিয় পোস্ট নেই।</p>
              <button
                onClick={onOpenCreatePost}
                className="px-3 py-1.5 bg-[#B80000] text-white rounded-xl text-xs font-bold"
              >
                বিজ্ঞাপন বা পোস্ট তৈরি করুন
              </button>
            </div>
          ) : (
            <div className="space-y-2">
              {userPosts.map((post) => (
                <div key={post.id} className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-900">{post.title}</span>
                    <span className="text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded font-bold">{post.category}</span>
                  </div>
                  <p className="text-[10px] text-slate-600">{post.content}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
