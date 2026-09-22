import React, { useState, useId, FormEvent } from 'react';
import { 
  Droplet, 
  Heart, 
  ShieldCheck, 
  Lock, 
  User, 
  Phone, 
  MapPin, 
  KeyRound, 
  Eye, 
  EyeOff, 
  X, 
  ArrowRight, 
  CheckCircle2, 
  AlertCircle, 
  Loader2,
  LogIn,
  UserPlus
} from 'lucide-react';
import { signInWithEmailPassword, signUpWithEmailPassword, normalizeDigits, isValidPhone } from '../services/authService';
import { LOCATION_MASTER } from '../data/locationMaster';
import { databaseService } from '../services/databaseService';
import { useAuth } from '../context/AuthContext';
import { UserProfile } from '../types';

interface BloodAuthGatekeeperModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (user: UserProfile) => void;
  onNavigateToRegistration?: () => void;
  initialMode?: 'signin' | 'quick_register';
  lang?: 'bn' | 'en';
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

export const BloodAuthGatekeeperModal: React.FC<BloodAuthGatekeeperModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  onNavigateToRegistration,
  initialMode = 'signin',
  lang = 'bn'
}) => {
  const isBn = lang === 'bn';
  const { login } = useAuth();
  const [mode, setMode] = useState<'signin' | 'quick_register'>(initialMode);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Sign In Form States
  const [loginIdentifier, setLoginIdentifier] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Quick Registration Form States
  const [regName, setRegName] = useState('');
  const [regBloodGroup, setRegBloodGroup] = useState<string>('O+');
  const [regPhone, setRegPhone] = useState('');
  const [regDivision, setRegDivision] = useState('চট্টগ্রাম');
  const [regDistrict, setRegDistrict] = useState('খাগড়াছড়ি');
  const [regUpazila, setRegUpazila] = useState('খাগড়াছড়ি সদর');
  const [regPassword, setRegPassword] = useState('');

  // Unique HTML IDs
  const loginIdInputId = useId();
  const loginPassInputId = useId();
  const regNameId = useId();
  const regPhoneId = useId();
  const regPassId = useId();
  const regDivisionId = useId();
  const regDistrictId = useId();
  const regUpazilaId = useId();

  // Reset or initialize mode if prop changes
  React.useEffect(() => {
    if (isOpen) {
      setMode(initialMode);
      setError(null);
      setSuccessMsg(null);
    }
  }, [isOpen, initialMode]);

  // Derived location dropdown options
  const currentDivObj = LOCATION_MASTER.find(d => d.nameBn === regDivision) || LOCATION_MASTER[0];
  const availableDistricts = currentDivObj?.districts || [];
  const currentDistObj = availableDistricts.find(d => d.nameBn === regDistrict) || availableDistricts[0];
  const availableUpazilas = currentDistObj?.upazilas || [];

  if (!isOpen) return null;

  // Handle Sign In Submit
  const handleSignIn = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanIdentifier = normalizeDigits(loginIdentifier.trim());
    const cleanPassword = loginPassword.trim();

    if (!cleanIdentifier) {
      setError(isBn ? 'অনুগ্রহ করে মোবাইল নম্বর বা ইমেইল লিখুন।' : 'Please enter mobile number or email.');
      return;
    }
    if (!cleanPassword) {
      setError(isBn ? 'অনুগ্রহ করে পাসওয়ার্ড লিখুন।' : 'Please enter your password.');
      return;
    }

    setLoading(true);
    try {
      const res = await signInWithEmailPassword(cleanIdentifier, cleanPassword, lang);
      if (res.success && res.user) {
        setSuccessMsg(isBn ? 'সফলভাবে সাইন ইন হয়েছে! রক্তদাতার তালিকা প্রস্তুত করা হচ্ছে...' : 'Successfully signed in!');
        login(res.user);
        setTimeout(() => {
          if (onSuccess) onSuccess(res.user!);
          onClose();
        }, 600);
      } else {
        setError(res.error || (isBn ? 'মোবাইল নম্বর বা পাসওয়ার্ড সঠিক নয়।' : 'Invalid credentials.'));
      }
    } catch (err: any) {
      setError(err?.message || (isBn ? 'লগইনে সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।' : 'Login failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  // Handle Quick Blood Registration Submit
  const handleQuickRegister = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    const cleanName = regName.trim();
    const cleanPhone = normalizeDigits(regPhone.trim());
    const cleanPass = regPassword.trim();

    if (!cleanName || cleanName.length < 2) {
      setError(isBn ? 'অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন।' : 'Please enter your full name.');
      return;
    }
    if (!regBloodGroup) {
      setError(isBn ? 'অনুগ্রহ করে রক্তের গ্রুপ নির্বাচন করুন।' : 'Please select a blood group.');
      return;
    }
    if (!cleanPhone || !isValidPhone(cleanPhone)) {
      setError(isBn ? 'সঠিক ১১ ডিজিটের মোবাইল নম্বর লিখুন (যেমন: 017XXXXXXXX)।' : 'Please provide a valid 11-digit phone number.');
      return;
    }
    if (!cleanPass || cleanPass.length < 6) {
      setError(isBn ? 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।' : 'Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      const email = `${cleanPhone}@jhadimadi.com`;
      const signUpRes = await signUpWithEmailPassword({
        email,
        password: cleanPass,
        fullName: cleanName,
        phone: cleanPhone,
        role: 'customer',
        location: {
          division: regDivision,
          district: regDistrict,
          upazila: regUpazila,
          mahalla: regUpazila
        },
        additionalProfile: {
          bloodGroup: regBloodGroup,
          isBloodDonor: true,
          isBloodDonorAvailable: true,
          totalDonations: 1
        },
        lang
      });

      if (signUpRes.success && signUpRes.user) {
        // Also persist to centralized Supabase blood_donors table and local DB
        const donorRecord = {
          id: signUpRes.user.id || `bld_${Date.now()}`,
          name: cleanName,
          bloodGroup: regBloodGroup,
          phone: cleanPhone,
          division: regDivision,
          district: regDistrict,
          upazila: regUpazila,
          area: regUpazila,
          isAvailable: true,
          verified: true,
          totalDonations: 1,
          lastDonationDate: new Date().toISOString().split('T')[0]
        };

        try {
          await databaseService.saveBloodDonorToDatabase(donorRecord);
        } catch (dbErr) {
          console.warn('[BloodAuthGatekeeper] saveBloodDonorToDatabase notice:', dbErr);
        }

        setSuccessMsg(isBn ? 'রেজিস্ট্রেশন সফল হয়েছে! আপনাকে স্বাগতম।' : 'Registration successful! Welcome.');
        login(signUpRes.user, true);
        setTimeout(() => {
          if (onSuccess) onSuccess(signUpRes.user!);
          onClose();
        }, 700);
      } else {
        setError(signUpRes.error || (isBn ? 'রেজিস্ট্রেশন সম্পন্ন করা সম্ভব হয়নি।' : 'Registration failed.'));
      }
    } catch (err: any) {
      setError(err?.message || (isBn ? 'রেজিস্ট্রেশনে ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।' : 'Registration error. Please retry.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      id="blood-auth-gatekeeper-backdrop"
      className="fixed inset-0 z-50 bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fadeIn"
      onClick={onClose}
    >
      <div 
        id="blood-auth-gatekeeper-dialog"
        className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-rose-100 overflow-hidden relative text-left my-auto animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Ribbon */}
        <div className="bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white p-4 sm:p-5 relative">
          <button
            id="blood-auth-gatekeeper-close-btn"
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-white/15 border border-white/30 flex items-center justify-center shrink-0 shadow-inner">
              <Droplet className="w-6 h-6 text-white fill-white animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-rose-200" />
                <span className="text-[10px] font-black tracking-wider uppercase text-rose-100">
                  {isBn ? 'নিরাপদ রক্তদাতা অনুসন্ধান' : 'Secure Blood Donor Access'}
                </span>
              </div>
              <h3 className="text-base sm:text-lg font-black leading-tight text-white mt-0.5">
                {mode === 'signin' 
                  ? (isBn ? 'রক্তদাতা প্রোফাইল দেখতে সাইন ইন করুন' : 'Sign In to View Donors') 
                  : (isBn ? 'দ্রুত ব্লাড রেজিস্ট্রেশন / সাইন-আপ' : 'Quick Blood Registration')}
              </h3>
            </div>
          </div>

          <div className="mt-2.5 p-3 rounded-xl bg-white/15 border border-white/25 text-white text-xs leading-relaxed font-medium">
            <p className="flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-rose-200 shrink-0 mt-0.5" />
              <span>
                {isBn 
                  ? 'রক্তদাতাদের তথ্যের নিরাপত্তা নিশ্চিত করতে অনুসন্ধান করার পূর্বে সাইন ইন করুন। আপনার অ্যাকাউন্ট না থাকলে নিচে সাইন আপ করুন।' 
                  : 'Please sign in before searching to ensure blood donor data security. If you don\'t have an account, sign up below.'}
              </span>
            </p>
          </div>

          {/* Mode Switch Tabs */}
          <div className="grid grid-cols-2 gap-1.5 mt-3 bg-black/20 p-1 rounded-xl">
            <button
              id="blood-gatekeeper-tab-signin"
              type="button"
              onClick={() => { setMode('signin'); setError(null); }}
              className={`py-1.5 px-2 rounded-lg text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'signin' 
                  ? 'bg-white text-red-700 shadow-xs' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>{isBn ? 'সাইন ইন করুন' : 'Sign In'}</span>
            </button>
            <button
              id="blood-gatekeeper-tab-register"
              type="button"
              onClick={() => {
                // If user clicks the register tab, they can either do quick register or go to registration
                setMode('quick_register'); 
                setError(null);
              }}
              className={`py-1.5 px-2 rounded-lg text-xs font-black transition cursor-pointer flex items-center justify-center gap-1.5 ${
                mode === 'quick_register' 
                  ? 'bg-white text-red-700 shadow-xs' 
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>{isBn ? 'সাইন আপ / রেজিস্ট্রেশন' : 'Sign Up / Register'}</span>
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 max-h-[75vh] overflow-y-auto">
          {/* Notification Banners */}
          {error && (
            <div className="mb-3.5 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <div className="leading-snug">{error}</div>
            </div>
          )}

          {successMsg && (
            <div className="mb-3.5 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="leading-snug">{successMsg}</div>
            </div>
          )}

          {/* ================= MODE 1: SIGN IN ================= */}
          {mode === 'signin' && (
            <div className="space-y-4">
              <form onSubmit={handleSignIn} className="space-y-3.5">
                <div>
                  <label htmlFor={loginIdInputId} className="block text-xs font-bold text-gray-700 mb-1">
                    {isBn ? 'মোবাইল নম্বর অথবা ইমেইল' : 'Mobile Number or Email'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id={loginIdInputId}
                      type="text"
                      required
                      value={loginIdentifier}
                      onChange={(e) => setLoginIdentifier(e.target.value)}
                      placeholder={isBn ? '০১XXXXXXXXX অথবা email@example.com' : '01XXXXXXXXX or email@example.com'}
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 text-xs font-semibold text-gray-900 transition outline-hidden"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor={loginPassInputId} className="block text-xs font-bold text-gray-700 mb-1">
                    {isBn ? 'পাসওয়ার্ড' : 'Password'} <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      id={loginPassInputId}
                      type={showPassword ? 'text' : 'password'}
                      required
                      value={loginPassword}
                      onChange={(e) => setLoginPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 text-xs font-semibold text-gray-900 transition outline-hidden"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  id="blood-signin-submit-btn"
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>{isBn ? 'লগইন হচ্ছে...' : 'Signing in...'}</span>
                    </>
                  ) : (
                    <>
                      <span>{isBn ? 'সাইন ইন করুন ও রক্তদাতা দেখুন' : 'Sign In & View Donors'}</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Explicit 'সাইন আপ করুন' CTA Button directly navigating to 'যোগ দিন' (Option 6) */}
              <div className="pt-3 border-t border-gray-100 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-px bg-gray-200 flex-1" />
                  <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                    {isBn ? 'নতুন ইউজার?' : 'New User?'}
                  </span>
                  <div className="h-px bg-gray-200 flex-1" />
                </div>

                <button
                  id="blood-gatekeeper-signup-cta-btn"
                  type="button"
                  onClick={() => {
                    onClose();
                    if (onNavigateToRegistration) {
                      onNavigateToRegistration();
                    }
                  }}
                  className="w-full py-3 px-4 rounded-xl border-2 border-red-500 bg-red-50/70 hover:bg-red-100/80 active:bg-red-200/80 text-red-700 font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs hover:shadow-xs transition cursor-pointer"
                >
                  <UserPlus className="w-4 h-4 text-red-600 shrink-0" />
                  <span>{isBn ? 'সাইন আপ করুন (যোগ দিন - রেজিস্ট্রেশন ফরম)' : 'Sign Up (Join Us - Registration Form)'}</span>
                  <ArrowRight className="w-4 h-4 text-red-600 shrink-0" />
                </button>

                <p className="text-[10px] text-gray-500 text-center">
                  {isBn 
                    ? 'বাটনে ক্লিক করলে সরাসরি অপশন ৬ (যোগ দিন) পেজে নিয়ে যাওয়া হবে।' 
                    : 'Clicking navigates directly to the Option 6 (Join Us) registration page.'}
                </p>
              </div>
            </div>
          )}

          {/* ================= MODE 2: QUICK BLOOD REGISTRATION ================= */}
          {mode === 'quick_register' && (
            <form onSubmit={handleQuickRegister} className="space-y-3">
              {/* Full Name */}
              <div>
                <label htmlFor={regNameId} className="block text-[11px] font-bold text-gray-700 mb-1">
                  {isBn ? 'আপনার পূর্ণ নাম' : 'Full Name'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id={regNameId}
                    type="text"
                    required
                    value={regName}
                    onChange={(e) => setRegName(e.target.value)}
                    placeholder={isBn ? 'যেমন: মো: রফিকুল ইসলাম' : 'e.g., John Doe'}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 text-xs font-semibold text-gray-900 transition outline-hidden"
                  />
                </div>
              </div>

              {/* Blood Group Selection */}
              <div>
                <label className="block text-[11px] font-bold text-gray-700 mb-1">
                  {isBn ? 'রক্তের গ্রুপ নির্বাচন করুন' : 'Select Blood Group'} <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {BLOOD_GROUPS.map((bg) => (
                    <button
                      key={bg}
                      type="button"
                      onClick={() => setRegBloodGroup(bg)}
                      className={`py-1.5 px-1 rounded-xl text-xs font-black border transition cursor-pointer flex items-center justify-center gap-1 ${
                        regBloodGroup === bg
                          ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                          : 'bg-white text-gray-700 border-gray-200 hover:border-red-300 hover:bg-red-50/50'
                      }`}
                    >
                      <Droplet className={`w-3 h-3 ${regBloodGroup === bg ? 'fill-white' : 'text-red-500'}`} />
                      <span>{bg}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile Phone Number */}
              <div>
                <label htmlFor={regPhoneId} className="block text-[11px] font-bold text-gray-700 mb-1">
                  {isBn ? 'মোবাইল নম্বর (১১ ডিজিট)' : 'Phone Number'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id={regPhoneId}
                    type="tel"
                    required
                    value={regPhone}
                    onChange={(e) => setRegPhone(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    maxLength={11}
                    className="w-full pl-8 pr-3 py-2 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 text-xs font-mono font-bold text-gray-900 transition outline-hidden"
                  />
                </div>
              </div>

              {/* Location: Division, District, Upazila */}
              <div className="space-y-2 bg-stone-50/80 p-2.5 rounded-2xl border border-stone-200/80">
                <div className="flex items-center gap-1 text-[10.5px] font-bold text-gray-700">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  <span>{isBn ? 'অবস্থান / এলাকা নির্বাচন' : 'Location Details'}</span>
                </div>

                <div className="grid grid-cols-3 gap-1.5">
                  {/* Division */}
                  <div>
                    <label htmlFor={regDivisionId} className="block text-[9.5px] font-semibold text-gray-600 mb-0.5">
                      {isBn ? 'বিভাগ' : 'Division'}
                    </label>
                    <select
                      id={regDivisionId}
                      value={regDivision}
                      onChange={(e) => {
                        const newDiv = e.target.value;
                        setRegDivision(newDiv);
                        const matchedDiv = LOCATION_MASTER.find(d => d.nameBn === newDiv);
                        if (matchedDiv && matchedDiv.districts[0]) {
                          setRegDistrict(matchedDiv.districts[0].nameBn);
                          if (matchedDiv.districts[0].upazilas[0]) {
                            setRegUpazila(matchedDiv.districts[0].upazilas[0].nameBn);
                          }
                        }
                      }}
                      className="w-full p-1.5 rounded-lg border border-gray-300 bg-white text-[10.5px] font-medium text-gray-800 focus:border-red-500 outline-hidden"
                    >
                      {LOCATION_MASTER.map((d) => (
                        <option key={d.code} value={d.nameBn}>{d.nameBn}</option>
                      ))}
                    </select>
                  </div>

                  {/* District */}
                  <div>
                    <label htmlFor={regDistrictId} className="block text-[9.5px] font-semibold text-gray-600 mb-0.5">
                      {isBn ? 'জেলা' : 'District'}
                    </label>
                    <select
                      id={regDistrictId}
                      value={regDistrict}
                      onChange={(e) => {
                        const newDist = e.target.value;
                        setRegDistrict(newDist);
                        const matchedDist = availableDistricts.find(d => d.nameBn === newDist);
                        if (matchedDist && matchedDist.upazilas[0]) {
                          setRegUpazila(matchedDist.upazilas[0].nameBn);
                        }
                      }}
                      className="w-full p-1.5 rounded-lg border border-gray-300 bg-white text-[10.5px] font-medium text-gray-800 focus:border-red-500 outline-hidden"
                    >
                      {availableDistricts.map((d) => (
                        <option key={d.code} value={d.nameBn}>{d.nameBn}</option>
                      ))}
                    </select>
                  </div>

                  {/* Upazila */}
                  <div>
                    <label htmlFor={regUpazilaId} className="block text-[9.5px] font-semibold text-gray-600 mb-0.5">
                      {isBn ? 'উপজেলা' : 'Upazila'}
                    </label>
                    <select
                      id={regUpazilaId}
                      value={regUpazila}
                      onChange={(e) => setRegUpazila(e.target.value)}
                      className="w-full p-1.5 rounded-lg border border-gray-300 bg-white text-[10.5px] font-medium text-gray-800 focus:border-red-500 outline-hidden"
                    >
                      {availableUpazilas.map((u) => (
                        <option key={u.code} value={u.nameBn}>{u.nameBn}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor={regPassId} className="block text-[11px] font-bold text-gray-700 mb-1">
                  {isBn ? 'গোপন পাসওয়ার্ড (কমপক্ষে ৬ অক্ষর)' : 'Password (min 6 characters)'} <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <KeyRound className="w-3.5 h-3.5 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id={regPassId}
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-8 pr-9 py-2 rounded-xl border border-gray-300 focus:border-red-500 focus:ring-2 focus:ring-red-100 text-xs font-semibold text-gray-900 transition outline-hidden"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                id="blood-register-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xs hover:shadow-md transition cursor-pointer disabled:opacity-50 mt-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isBn ? 'একাউন্ট তৈরি হচ্ছে...' : 'Creating Account...'}</span>
                  </>
                ) : (
                  <>
                    <span>{isBn ? 'রেজিস্ট্রেশন ও লগইন সম্পন্ন করুন' : 'Complete Registration & Access'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 border-t border-gray-100 text-center">
                <p className="text-xs text-gray-600">
                  {isBn ? 'ইতিমধ্যে অ্যাকাউন্ট আছে?' : 'Already have an account?'}
                  <button
                    type="button"
                    onClick={() => { setMode('signin'); setError(null); }}
                    className="ml-1.5 font-bold text-red-600 hover:text-red-700 underline cursor-pointer"
                  >
                    {isBn ? 'সাইন ইন করুন' : 'Sign In'}
                  </button>
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

/**
 * Access Control Gatekeeper Inline Card
 * Replaces direct donor cards when a user is not signed in
 */
export const BloodAuthGatekeeperCard: React.FC<{
  onOpenSignIn: () => void;
  onOpenRegister: () => void;
  isBn?: boolean;
}> = ({ onOpenSignIn, onOpenRegister, isBn = true }) => {
  return (
    <div 
      id="blood-auth-gatekeeper-card"
      className="bg-gradient-to-br from-white via-rose-50/40 to-red-50/50 rounded-2xl p-5 sm:p-6 border border-red-200/90 shadow-xs text-center space-y-3.5 my-2"
    >
      <div className="w-12 h-12 rounded-2xl bg-red-100/80 border border-red-200 flex items-center justify-center mx-auto text-red-600">
        <Lock className="w-6 h-6" />
      </div>

      <div className="space-y-1 max-w-md mx-auto">
        <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-red-700 bg-red-100/90 px-2.5 py-0.5 rounded-full">
          <ShieldCheck className="w-3 h-3" />
          {isBn ? 'সুরক্ষিত রক্তদাতা নেটওয়ার্ক' : 'Protected Blood Donor Network'}
        </span>
        <h4 className="text-sm sm:text-base font-black text-gray-900">
          {isBn 
            ? 'রক্তদাতার সম্পূর্ণ প্রোফাইল ও যোগাযোগের নম্বর দেখতে সাইন ইন করুন' 
            : 'Sign in to access donor profile cards and direct contact details'}
        </h4>
        <p className="text-[11px] text-gray-600 leading-relaxed">
          {isBn
            ? 'মানবিক কারণে ও রক্তদাতাদের ব্যক্তিগত তথ্যের সুরক্ষা নিশ্চিত করতে পাবলিক ভিউতে ফোন নম্বর ও প্রোফাইল লক রাখা হয়েছে।'
            : 'To protect the privacy of altruistic blood donors, complete profiles and direct call triggers require an active session.'}
        </p>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-2 max-w-sm mx-auto pt-1">
        <button
          id="blood-gatekeeper-card-signin-btn"
          type="button"
          onClick={onOpenSignIn}
          className="w-full sm:w-auto flex-1 py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-700 active:bg-red-800 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs transition cursor-pointer"
        >
          <LogIn className="w-3.5 h-3.5" />
          <span>{isBn ? 'সাইন ইন করুন (Sign In)' : 'Sign In'}</span>
        </button>

        <button
          id="blood-gatekeeper-card-register-btn"
          type="button"
          onClick={onOpenRegister}
          className="w-full sm:w-auto flex-1 py-2.5 px-4 rounded-xl bg-white hover:bg-stone-50 active:bg-stone-100 text-gray-800 border border-gray-300 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition cursor-pointer"
        >
          <UserPlus className="w-3.5 h-3.5 text-red-600" />
          <span>{isBn ? 'নতুন ইউজার? দ্রুত রেজিস্ট্রেশন' : 'Quick Sign-Up'}</span>
        </button>
      </div>

      <div className="pt-2 text-[10px] text-gray-500 flex items-center justify-center gap-1.5">
        <Heart className="w-3 h-3 text-red-500 fill-red-500" />
        <span>{isBn ? '১০০% ফ্রি মানবিক রক্তদান সেবা • ঝাদিমাদি ডটকম' : '100% Free Altruistic Blood Service'}</span>
      </div>
    </div>
  );
};

export default BloodAuthGatekeeperModal;
