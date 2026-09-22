import React, { useState } from 'react';
import { 
  X, Lock, Eye, EyeOff, ShieldCheck, UserCheck, Sparkles, CheckCircle2, 
  Upload, Camera, CreditCard, Copy, Check, Phone, Mail, Award, FileText, 
  ArrowRight, ArrowLeft, RefreshCw, AlertCircle, Wrench, User, Briefcase,
  MapPin, CheckCircle, Droplet
} from 'lucide-react';
import { Language, UserProfile, ServiceProvider } from '../types';
import { databaseService } from '../services/databaseService';
import { sanitizeDatabasePayload } from '../utils/imageUtils';

interface MemberRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userProfile: UserProfile, providerProfile?: ServiceProvider) => void;
  lang: Language;
  defaultDivision?: string;
  defaultDistrict?: string;
  defaultUpazila?: string;
  defaultMahalla?: string;
}

const PROFESSIONS = [
  'শ্রমিক ও দিনমজুর (Daily Laborer)',
  'গাছ কাটার মিস্ত্রি (Tree Cutter & Timber Specialist)',
  'সার্টিফাইড ইলেকট্রিশিয়ান ও সোলার (Electrician)',
  'প্লাম্বার ও পাইপ ফিটার (Plumber)',
  'রাজমিস্ত্রি ও কনস্ট্রাকশন (Mason)',
  'কাঠমিস্ত্রি ও ফার্নিচার কারিগর (Carpenter)',
  'ডাক্তার ও কনসালট্যান্ট (MBBS Doctor)',
  'নার্সিং ও বয়স্ক কেয়ারটেকার (Nurse & Caregiver)',
  'সিভিল ও স্ট্রাকচারাল ইঞ্জিনিয়ার (Civil Engineer)',
  'হোম টিউটর ও শিক্ষক (Home Tutor)',
  'ফটোগ্রাফার ও ভিডিওগ্রাফার (Photographer)',
  'সাউন্ড সিস্টেম ও লাইটিং অপারেটর (Sound & Lighting Operator)',
  'পরিচ্ছন্নতাকর্মী ও ট্যাংক ক্লিনার (Cleaner & Housekeeper)',
  'ড্রাইভার ও যানবাহন চালক (Driver - CNG/Jeep/Truck)',
  'ফ্রিজ, এসি ও টিভি মেকানিক (Mechanic)',
  'আইনজীবী ও আইনি পরামর্শক (Advocate / Lawyer)',
  'গ্রাফিক ডিজাইনার ও ওয়েব ফ্রিল্যান্সার (Graphic Designer)',
  'পাহাড়ি রেস্টুরেন্ট ও ক্যাটারিং (Restaurant & Catering)',
  'কৃষি ও বাগান পরিচর্যাকারী (Agri Expert)',
  'অন্যান্য দক্ষ কারিগর (General Professional)',
];

const CHT_DISTRICTS = ['Khagrachhari', 'Rangamati', 'Bandarban', 'Chittagong', 'Dhaka'];

const UPAZILA_MAP: Record<string, string[]> = {
  'Khagrachhari': ['Khagrachhari Sadar', 'Dighinala', 'Panchhari', 'Mahalchhari', 'Matiranga', 'Manikchhari', 'Ramgarh', 'Guimara', 'Lakshmichhari'],
  'Rangamati': ['Rangamati Sadar', 'Kaptai', 'Kaukhali', 'Baghaichhari', 'Barkal', 'Jurachhari', 'Rajasthali', 'Belaichhari', 'Naniarchar', 'Langadu'],
  'Bandarban': ['Bandarban Sadar', 'Ruma', 'Thanchi', 'Rowangchhari', 'Lama', 'Alikadam', 'Naikhongchhari'],
  'Chittagong': ['Kotwali', 'Panchlaish', 'Pahartali', 'Agrabad', 'Hathazari', 'Sitakunda'],
  'Dhaka': ['Mirpur', 'Dhanmondi', 'Gulshan', 'Uttara', 'Mohammadpur'],
};

export const MemberRegistrationModal: React.FC<MemberRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  lang,
  defaultDivision = 'Chittagong Division (চট্টগ্রাম)',
  defaultDistrict = 'Khagrachhari',
  defaultUpazila = 'Khagrachhari Sadar',
  defaultMahalla = 'পানখাইয়াপাড়া (Pankhaiyapara)',
}) => {
  // Role switcher: 'customer' vs 'professional'
  const [memberRole, setMemberRole] = useState<'customer' | 'professional'>('customer');
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [bloodGroup, setBloodGroup] = useState<string>('B+');
  const [customerProfession, setCustomerProfession] = useState<string>('সাধারণ নাগরিক');
  const [statusFeedback, setStatusFeedback] = useState<{ type: 'loading' | 'success' | 'error'; message: string } | null>(null);

  // Common credentials
  const [fullName, setFullName] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDistrict, setSelectedDistrict] = useState(defaultDistrict);
  const [selectedUpazila, setSelectedUpazila] = useState(defaultUpazila);
  const [mahalla, setMahalla] = useState(defaultMahalla);

  // OTP Verification Simulation
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [isOtpLoading, setIsOtpLoading] = useState(false);

  // Professional Specific Fields
  const [selectedProfession, setSelectedProfession] = useState(PROFESSIONS[0]);
  const [skills, setSkills] = useState('বাসা ওয়্যারিং, সোলার ব্যাটারি সার্ভিসিং, ফ্যান মেরামত');
  const [experienceYears, setExperienceYears] = useState('3');
  const [rateType, setRateType] = useState<'Hourly' | 'Daily' | 'Fixed'>('Daily');
  const [rateAmount, setRateAmount] = useState('800');
  const [bio, setBio] = useState('');
  const [nidNumber, setNidNumber] = useState('');
  const [nidFrontUrl, setNidFrontUrl] = useState('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=600&q=80');
  const [certificateText, setCertificateText] = useState('ট্রেড লাইসেন্স ও স্থানীয় কারিগরি দক্ষতা সনদ');
  const [selfieUrl, setSelfieUrl] = useState('https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80');

  // Step 3 (Payment simulation for ৳100 verification)
  const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad' | 'Rocket'>('bKash');
  const [trxId, setTrxId] = useState('');
  const [copiedNumber, setCopiedNumber] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleDistrictChange = (dist: string) => {
    setSelectedDistrict(dist);
    const upazilas = UPAZILA_MAP[dist] || ['Sadar'];
    setSelectedUpazila(upazilas[0]);
  };

  const handleSendOtp = () => {
    if (!contactPhone || contactPhone.length < 10) {
      alert('সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন (যেমন: 01870592699)');
      return;
    }
    setIsOtpLoading(true);
    setTimeout(() => {
      setIsOtpLoading(false);
      setOtpSent(true);
      setOtpCode('2026'); // simulated default code
    }, 600);
  };

  const handleVerifyOtp = () => {
    if (otpCode.length >= 4) {
      setOtpVerified(true);
    } else {
      alert('৪ ডিজিটের ওটিপি কোড লিখুন (টেস্টিং কোড: 2026)');
    }
  };

  const handleSubmitCustomer = async () => {
    if (!fullName || !contactPhone) {
      alert('অনুগ্রহ করে নাম এবং মোবাইল নম্বর প্রদান করুন।');
      return;
    }
    setIsSubmitting(true);
    setStatusFeedback({ type: 'loading', message: 'ডাটাবেজে একাউন্ট সংরক্ষণ হচ্ছে...' });

    const userId = `user_${Date.now()}`;
    const newUser: UserProfile = {
      id: userId,
      name: fullName,
      fullName: fullName,
      phone: contactPhone,
      email: email || `${contactPhone}@jhadimadi.com`,
      role: 'customer',
      division: defaultDivision,
      district: selectedDistrict,
      upazila: selectedUpazila,
      thana: selectedUpazila,
      mahalla: mahalla,
      para: mahalla,
      paraMahalla: `${mahalla}, ${selectedUpazila}`,
      bloodGroup: bloodGroup,
      profession: customerProfession,
      professionBn: customerProfession,
      categorySkill: customerProfession,
      avatar: selfieUrl,
      isNidVerified: false,
      isPaidMember: false,
      isBloodDonor: !!bloodGroup,
      isBloodDonorAvailable: true,
      createdAt: new Date().toISOString().split('T')[0],
    };

    try {
      const result = await databaseService.saveUserProfile(newUser);
      if (result.success) {
        setStatusFeedback({ type: 'success', message: 'সফলভাবে একাউন্ট সংরক্ষিত হয়েছে!' });
        setTimeout(() => {
          setIsSubmitting(false);
          onSuccess(newUser);
          onClose();
        }, 600);
      } else {
        setStatusFeedback({ type: 'error', message: result.error || 'ডাটাবেজে সংরক্ষণ ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' });
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error('[Registration] Customer save error:', err);
      setStatusFeedback({ type: 'error', message: `সংরক্ষণ ব্যর্থ: ${err?.message || 'নেটওয়ার্ক এরর'}` });
      setIsSubmitting(false);
    }
  };

  const handleFinalSubmitProfessional = async () => {
    setIsSubmitting(true);
    setStatusFeedback({ type: 'loading', message: 'ডাটাবেজে প্রোফাইল ও তথ্য সংরক্ষিত হচ্ছে...' });

    const userId = `pro_user_${Date.now()}`;
    const newUser: UserProfile = {
      id: userId,
      name: fullName || 'মংপ্রু মারমা',
      fullName: fullName || 'মংপ্রু মারমা',
      phone: contactPhone || '01870592699',
      email: email || `${contactPhone}@jhadimadi.com`,
      role: 'professional',
      division: defaultDivision,
      district: selectedDistrict,
      upazila: selectedUpazila,
      thana: selectedUpazila,
      mahalla: mahalla,
      para: mahalla,
      paraMahalla: `${mahalla}, ${selectedUpazila}`,
      bloodGroup: bloodGroup,
      profession: selectedProfession,
      professionBn: selectedProfession,
      serviceCategory: selectedProfession,
      categorySkill: skills,
      experienceYears: Number(experienceYears) || 3,
      dailyRate: rateAmount,
      nidNumber: nidNumber || '19958472910482',
      avatar: selfieUrl,
      isNidVerified: true,
      isPaidMember: true,
      isBloodDonor: !!bloodGroup,
      isBloodDonorAvailable: true,
      createdAt: new Date().toISOString().split('T')[0],
    };

    const newProvider: ServiceProvider = {
      id: `prov_${Date.now()}`,
      name: fullName || 'মংপ্রু মারমা',
      avatar: selfieUrl,
      categoryBn: selectedProfession,
      categoryEn: selectedProfession.includes('Electrician') ? 'Technicians' : 'General Services',
      subCategory: selectedProfession,
      rating: 5.0,
      jobsCompleted: 0,
      hourlyRate: Number(rateAmount) || 800,
      phoneHidden: contactPhone ? `${contactPhone.slice(0, 3)}*****${contactPhone.slice(-3)}` : '018*****699',
      realPhone: contactPhone || '01870592699',
      district: selectedDistrict as any,
      upazila: selectedUpazila,
      mahalla: mahalla,
      nidVerified: true,
      selfieVerified: true,
      blueTickActive: true,
      isAvailableNow: true,
      distanceKm: 0.8,
      bioBn: `দক্ষ ও বিশ্বস্ত ${selectedProfession}। নিষ্ঠার সাথে সেবা প্রদান করি।`,
      bioEn: `Skilled professional providing ${selectedProfession} services.`,
      skills: skills.split(',').map(s => s.trim()),
      experienceYears: Number(experienceYears) || 3,
      rateType: rateType,
      nidNumber: nidNumber || '19958472910482',
      verifiedCertificates: [certificateText, 'ঝাদিমাদি ভেরিফাইড প্রো মেম্বার [✓]'],
      workGallery: [
        'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
        'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80'
      ],
      customerReviews: [
        {
          id: 'rev_welcome',
          customerName: 'ঝাদিমাদি অ্যাডমিন টিম',
          rating: 5,
          comment: 'নতুন ভেরিফাইড প্রো মেম্বার হিসেবে স্বাগতম! পার্বত্য চট্টগ্রামের গ্রাহকরা এখন আপনার সেবা নিতে পারবেন।',
          date: 'আজকে'
        }
      ]
    };

    try {
      const result = await databaseService.registerProvider({
        ...newProvider,
        ...newUser,
        id: userId,
      });

      if (result.success) {
        setStatusFeedback({ type: 'success', message: 'পেশাজীবী প্রোফাইল সফলভাবে সেভ হয়েছে!' });
        setTimeout(() => {
          setIsSubmitting(false);
          onSuccess(newUser, newProvider);
          onClose();
        }, 600);
      } else {
        setStatusFeedback({ type: 'error', message: result.error || 'ডাটাবেজে রেজিস্ট্রেশন ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' });
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error('[Registration] Pro save error:', err);
      setStatusFeedback({ type: 'error', message: `রেজিস্ট্রেশন ব্যর্থ: ${err?.message || 'নেটওয়ার্ক এরর'}` });
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-900/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white border border-stone-200 rounded-3xl w-full max-w-xl overflow-hidden shadow-2xl text-stone-900 my-auto flex flex-col max-h-[92vh] animate-in zoom-in-95">
        
        {/* Modal Header */}
        <div className="bg-[#1E4D2B] text-white px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <ShieldCheck className="w-5 h-5 text-[#D97706]" />
            </div>
            <div>
              <h3 className="font-black text-base sm:text-lg leading-tight">
                ঝাদিমাদি মেম্বারশিপ ও রেজিস্ট্রেশন
              </h3>
              <p className="text-[11px] text-emerald-100 font-medium">
                পার্বত্য চট্টগ্রামের নিরাপদ ই-কমার্স ও দক্ষ পেশাজীবী প্ল্যাটফর্ম
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ROLE SWITCHER TABS */}
        <div className="p-3 bg-stone-100 border-b border-stone-200 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              setMemberRole('customer');
              setCurrentStep(1);
            }}
            className={`py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              memberRole === 'customer'
                ? 'bg-white text-[#1E4D2B] shadow-xs border border-stone-200 font-black'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <User className="w-4 h-4 text-[#1E4D2B]" />
            <span>১. সাধারণ ক্রেতা (Customer)</span>
          </button>

          <button
            type="button"
            onClick={() => setMemberRole('professional')}
            className={`py-2 px-3 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all cursor-pointer ${
              memberRole === 'professional'
                ? 'bg-[#1E4D2B] text-white shadow-xs font-black'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Briefcase className="w-4 h-4 text-[#D97706]" />
            <span>২. পেশাজীবী / সেবাদাতা (Pro)</span>
          </button>
        </div>

        {/* BODY CONTENT (Scrollable) */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* ================= CUSTOMER REGISTRATION FORM ================= */}
          {memberRole === 'customer' && (
            <div className="space-y-4">
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-[#1E4D2B] shrink-0 mt-0.5" />
                <div className="text-xs text-stone-700 leading-relaxed">
                  <p className="font-bold text-[#1E4D2B]">ক্রেতা একাউন্ট তৈরি করুন</p>
                  পাহাড়ের খাঁটি মধু, শুটকি, তাঁতের পোশাক অর্ডার এবং অন-কল মিস্ত্রি বুকিংয়ের জন্য ফ্রি একাউন্ট তৈরি করুন।
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  আপনার পূর্ণ নাম (Full Name) *
                </label>
                <input
                  type="text"
                  placeholder="উদা: সুইনুপ্রু মারমা / মোঃ করিম"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#1E4D2B] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  মোবাইল নম্বর (Mobile Number) *
                </label>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    placeholder="018XXXXXXXX"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="flex-1 px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#1E4D2B] focus:bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={isOtpLoading || otpVerified}
                    className="px-3.5 py-2.5 bg-stone-800 text-white rounded-xl text-xs font-bold hover:bg-stone-900 disabled:opacity-50 cursor-pointer"
                  >
                    {otpVerified ? 'ভেরিফাইড ✓' : otpSent ? 'কোড পাঠানো হয়েছে' : 'OTP কোড পাঠান'}
                  </button>
                </div>
              </div>

              {otpSent && !otpVerified && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-2">
                  <span className="text-xs text-amber-900 font-bold block">
                    মোবাইলে আসা ৪-ডিজিটের কোড দিন (টেস্ট কোড: 2026):
                  </span>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      maxLength={4}
                      value={otpCode}
                      onChange={(e) => setOtpCode(e.target.value)}
                      className="w-32 px-3 py-1.5 bg-white border border-amber-400 rounded-lg text-center font-bold tracking-widest"
                      placeholder="2026"
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      className="px-4 py-1.5 bg-[#1E4D2B] text-white rounded-lg text-xs font-bold hover:bg-[#15371e]"
                    >
                      যাচাই করুন
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">জেলা (District)</label>
                  <select
                    value={selectedDistrict}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                  >
                    {CHT_DISTRICTS.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1">উপজেলা / থানা (Upazila)</label>
                  <select
                    value={selectedUpazila}
                    onChange={(e) => setSelectedUpazila(e.target.value)}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                  >
                    {(UPAZILA_MAP[selectedDistrict] || ['Sadar']).map(u => (
                      <option key={u} value={u}>{u}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  পাড়া / মহল্লা বা পূর্ণ ঠিকানা (Neighborhood / Para) *
                </label>
                <input
                  type="text"
                  placeholder="উদা: পানখাইয়াপাড়া, শালবন, খাগড়াপুর"
                  value={mahalla}
                  onChange={(e) => setMahalla(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                    <Droplet className="w-3.5 h-3.5 text-red-500" /> রক্তের গ্রুপ (Blood Group)
                  </label>
                  <select
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-800"
                  >
                    {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-stone-700 mb-1 flex items-center gap-1">
                    <Briefcase className="w-3.5 h-3.5 text-emerald-600" /> পেশা (Profession)
                  </label>
                  <select
                    value={customerProfession}
                    onChange={(e) => setCustomerProfession(e.target.value)}
                    className="w-full px-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-800"
                  >
                    <option value="সাধারণ নাগরিক">সাধারণ নাগরিক</option>
                    <option value="ছাত্র / ছাত্রী">ছাত্র / ছাত্রী</option>
                    <option value="কৃষক ও বাগান মালিক">কৃষক ও বাগান মালিক</option>
                    <option value="ব্যবসায়ী ও উদ্যোক্তা">ব্যবসায়ী ও উদ্যোক্তা</option>
                    <option value="চাকরিজীবী">চাকরিজীবী</option>
                    <option value="শিক্ষক ও শিক্ষাবিদ">শিক্ষক ও শিক্ষাবিদ</option>
                    <option value="ফ্রিল্যান্সার">ফ্রিল্যান্সার</option>
                    <option value="গৃহিণী">গৃহিণী</option>
                    {PROFESSIONS.map(p => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-stone-700 mb-1">
                  পাসওয়ার্ড তৈরি করুন (Password) *
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="নূন্যতম ৬ অক্ষরের গোপন পাসওয়ার্ড"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium focus:ring-2 focus:ring-[#1E4D2B]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {statusFeedback && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  statusFeedback.type === 'loading' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                  statusFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                  'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {statusFeedback.type === 'loading' ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                  ) : statusFeedback.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span>{statusFeedback.message}</span>
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmitCustomer}
                disabled={isSubmitting}
                className="w-full py-3 bg-[#1E4D2B] hover:bg-[#15371e] text-white font-black text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer mt-2"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>ফায়ারস্টোরে একাউন্ট তৈরি হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 text-[#D97706]" />
                    <span>ফায়ারস্টোর ডাটাবেজে একাউন্ট সম্পন্ন করুন</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* ================= PROFESSIONAL / FREELANCER REGISTRATION ================= */}
          {memberRole === 'professional' && (
            <div className="space-y-4">
              
              {/* Stepper Header for Pro */}
              <div className="flex items-center justify-between text-xs font-bold border-b border-stone-200 pb-2">
                <span className={currentStep === 1 ? 'text-[#1E4D2B] font-black' : 'text-stone-400'}>
                  ১. ব্যক্তিগত তথ্য
                </span>
                <span>➔</span>
                <span className={currentStep === 2 ? 'text-[#1E4D2B] font-black' : 'text-stone-400'}>
                  ২. পেশা ও ডকুমেন্টস
                </span>
                <span>➔</span>
                <span className={currentStep === 3 ? 'text-[#1E4D2B] font-black' : 'text-stone-400'}>
                  ৩. ১০০৳ মেম্বারশিপ
                </span>
              </div>

              {/* STEP 1: Personal Info */}
              {currentStep === 1 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      পেশাজীবীর পূর্ণ নাম (Full Name) *
                    </label>
                    <input
                      type="text"
                      placeholder="উদা: মংপ্রু মারমা / সুজন চাকমা"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      মোবাইল নম্বর (Customer Calls & OTP) *
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="tel"
                        placeholder="018XXXXXXXX"
                        value={contactPhone}
                        onChange={(e) => setContactPhone(e.target.value)}
                        className="flex-1 px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-sm font-medium"
                      />
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="px-3 py-2 bg-stone-800 text-white rounded-xl text-xs font-bold hover:bg-stone-900"
                      >
                        {otpVerified ? 'ভেরিফাইড ✓' : 'OTP কোড'}
                      </button>
                    </div>
                  </div>

                  {otpSent && !otpVerified && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between">
                      <span className="text-xs text-amber-900 font-bold">কোড লিখুন (টেস্ট: 2026)</span>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          className="w-20 px-2 py-1 bg-white border border-amber-400 rounded text-center text-xs font-bold"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          className="px-3 py-1 bg-[#1E4D2B] text-white rounded text-xs font-bold"
                        >
                          ভেরিফাই
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">জেলা *</label>
                      <select
                        value={selectedDistrict}
                        onChange={(e) => handleDistrictChange(e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                      >
                        {CHT_DISTRICTS.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">উপজেলা / থানা *</label>
                      <select
                        value={selectedUpazila}
                        onChange={(e) => setSelectedUpazila(e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                      >
                        {(UPAZILA_MAP[selectedDistrict] || ['Sadar']).map(u => (
                          <option key={u} value={u}>{u}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">পাড়া / কর্মএলাকা (Mahalla)</label>
                    <input
                      type="text"
                      placeholder="উদা: পানখাইয়াপাড়া, শালবন, শান্তিনগর"
                      value={mahalla}
                      onChange={(e) => setMahalla(e.target.value)}
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      if (!fullName || !contactPhone) {
                        alert('অনুগ্রহ করে নাম এবং মোবাইল নম্বর দিন।');
                        return;
                      }
                      setCurrentStep(2);
                    }}
                    className="w-full py-3 bg-[#1E4D2B] text-white font-black text-sm rounded-xl flex items-center justify-center gap-2 cursor-pointer mt-3"
                  >
                    <span>পরবর্তী ধাপ: পেশা ও ডকুমেন্টস</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STEP 2: Profession & NID/Certificates */}
              {currentStep === 2 && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      আপনার মূল পেশা নির্বাচন করুন (Profession) *
                    </label>
                    <select
                      value={selectedProfession}
                      onChange={(e) => setSelectedProfession(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-bold text-[#1E4D2B]"
                    >
                      {PROFESSIONS.map(p => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">কাজের অভিজ্ঞতা</label>
                      <select
                        value={experienceYears}
                        onChange={(e) => setExperienceYears(e.target.value)}
                        className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                      >
                        <option value="1">১ বছর</option>
                        <option value="3">৩ বছর</option>
                        <option value="5">৫+ বছর (অভিজ্ঞ)</option>
                        <option value="10">১০+ বছর (মাস্টার)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-stone-700 mb-1">রেট / ফি (টাকায় ৳)</label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          value={rateAmount}
                          onChange={(e) => setRateAmount(e.target.value)}
                          className="w-full px-3 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
                          placeholder="800"
                        />
                        <select
                          value={rateType}
                          onChange={(e) => setRateType(e.target.value as any)}
                          className="px-2 py-2 bg-stone-100 border border-stone-300 rounded-xl text-[10px] font-bold"
                        >
                          <option value="Daily">দৈনিক</option>
                          <option value="Hourly">ঘণ্টা</option>
                          <option value="Fixed">চুক্তি</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      বিশেষ দক্ষতা সমূহ (Skills - কমা দিয়ে আলাদা করুন)
                    </label>
                    <input
                      type="text"
                      value={skills}
                      onChange={(e) => setSkills(e.target.value)}
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium"
                      placeholder="উদা: সোলার ওয়্যারিং, ড্রিলিং, মোটর বাইন্ডিং"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      জাতীয় পরিচয়পত্র নম্বর (NID Number) *
                    </label>
                    <input
                      type="text"
                      value={nidNumber}
                      onChange={(e) => setNidNumber(e.target.value)}
                      className="w-full px-3.5 py-2 bg-stone-50 border border-stone-300 rounded-xl text-xs font-medium"
                      placeholder="1995XXXXXXXXXXXX"
                    />
                  </div>

                  <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-[#8B4513]" />
                      <span className="text-xs font-bold text-stone-700">NID ও সনদ আপলোড (AI স্ক্যান হবে)</span>
                    </div>
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                      নমুনা সংযুক্ত [✓]
                    </span>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(1)}
                      className="px-4 py-2.5 bg-stone-200 text-stone-700 font-bold text-xs rounded-xl hover:bg-stone-300"
                    >
                      পূর্ববর্তী
                    </button>
                    <button
                      type="button"
                      onClick={() => setCurrentStep(3)}
                      className="flex-1 py-2.5 bg-[#1E4D2B] text-white font-black text-xs rounded-xl flex items-center justify-center gap-1"
                    >
                      <span>পরবর্তী: ১০০৳ মেম্বারশিপ ফি</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: ৳100 Verification Fee & AI Fast Approval */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="bg-amber-50 border border-amber-300 rounded-2xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
                      <Award className="w-5 h-5 text-[#D97706]" />
                      <span>প্রো মেম্বারশিপ ও NID ভেরিফিকেশন ফি: ৳১০০</span>
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      ঝাদিমাদি ভেরিফাইড সিল [✓], ডিরেক্টরি টপ-র‍্যাঙ্কিং এবং কাস্টমারের সরাসরি ফোন/হোয়াটসঅ্যাপ পাওয়ার জন্য ১০০ টাকা এককালীন ভেরিফিকেশন ফি পরিশোধ করুন।
                    </p>
                  </div>

                  {/* Payment Methods */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-2">
                      পেমেন্ট মেথড বেছে নিন:
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(['bKash', 'Nagad', 'Rocket'] as const).map((m) => (
                        <button
                          key={m}
                          type="button"
                          onClick={() => setPaymentMethod(m)}
                          className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all cursor-pointer ${
                            paymentMethod === m
                              ? 'bg-rose-50 border-rose-500 text-rose-700 font-black shadow-xs'
                              : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
                          }`}
                        >
                          {m === 'bKash' ? 'বিকাশ (bKash)' : m === 'Nagad' ? 'নগদ (Nagad)' : 'রকেট (Rocket)'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Merchant / Personal Number Box */}
                  <div className="p-3 bg-stone-100 border border-stone-300 rounded-xl flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-stone-500 font-bold block">ঝাদিমাদি অফিসিয়াল মার্চেন্ট নম্বর (Send Money):</span>
                      <span className="text-sm font-black text-stone-900">01870-592699</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText('01870592699');
                        setCopiedNumber(true);
                        setTimeout(() => setCopiedNumber(false), 2000);
                      }}
                      className="px-2.5 py-1.5 bg-white border border-stone-300 rounded-lg text-xs font-bold text-stone-700 hover:bg-stone-200 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedNumber ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedNumber ? 'কপি হয়েছে' : 'কপি করুন'}</span>
                    </button>
                  </div>

                  {/* TrxID Input */}
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      পেমেন্ট ট্রানজেকশন আইডি (TrxID) *
                    </label>
                    <input
                      type="text"
                      placeholder="উদা: TRX882749102 (অথবা টেস্টের জন্য যেকোনো নম্বর লিখুন)"
                      value={trxId}
                      onChange={(e) => setTrxId(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs sm:text-sm font-bold text-[#1E4D2B]"
                    />
                  </div>

                  {statusFeedback && (
                    <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                      statusFeedback.type === 'loading' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                      statusFeedback.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                      'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {statusFeedback.type === 'loading' ? (
                        <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                      ) : statusFeedback.type === 'success' ? (
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span>{statusFeedback.message}</span>
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setCurrentStep(2)}
                      className="px-4 py-2.5 bg-stone-200 text-stone-700 font-bold text-xs rounded-xl hover:bg-stone-300"
                    >
                      পূর্ববর্তী
                    </button>
                    <button
                      type="button"
                      onClick={handleFinalSubmitProfessional}
                      disabled={isSubmitting}
                      className="flex-1 py-3 bg-[#1E4D2B] hover:bg-[#15371e] text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          <span>ভেরিফিকেশন সম্পন্ন হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 text-[#D97706]" />
                          <span>১০০৳ ফি নিশ্চিত করুন ও প্রোফাইল লাইভ করুন</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
