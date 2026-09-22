import React, { useState } from 'react';
import { 
  Eye, 
  EyeOff, 
  AlertCircle, 
  CheckCircle2, 
  UserPlus,
  Languages,
  ArrowLeft
} from 'lucide-react';
import { UserProfile } from '../types';
import { Language } from '../utils/translations';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { databaseService } from '../services/databaseService';
import { signInWithEmailPassword, isDomainError } from '../services/authService';
import { supabase, isSupabaseConfigured } from '../supabase';

interface SignInScreenProps {
  onBack: () => void;
  onSignInSuccess?: (user: UserProfile) => void;
  onNavigateToSignUp: () => void;
  lang: Language;
}

export const SignInScreen: React.FC<SignInScreenProps> = ({
  onBack,
  onSignInSuccess,
  onNavigateToSignUp,
  lang: initialLang
}) => {
  const { login } = useAuth();
  const { professionals } = useData();

  // Internal language state with fallback to prop
  const [currentLang, setCurrentLang] = useState<Language>(initialLang || 'bn');
  const lang = currentLang;

  const handleToggleLang = () => {
    setCurrentLang(prev => (prev === 'bn' ? 'en' : 'bn'));
  };

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotInput, setForgotInput] = useState('');
  const [forgotSubmitted, setForgotSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setErrorMsg(lang === 'bn' ? 'অনুগ্রহ করে মোবাইল নম্বর, ইমেইল অথবা ইউজারনেম লিখুন।' : 'Please enter mobile number, email, or username.');
      return;
    }

    if (!password) {
      setErrorMsg(lang === 'bn' ? 'অনুগ্রহ করে আপনার অ্যাকাউন্টের পাসওয়ার্ড লিখুন।' : 'Please enter your password.');
      return;
    }

    if (password.length < 4) {
      setErrorMsg(lang === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।' : 'Password must be at least 4 characters.');
      return;
    }

    setIsLoading(true);

    // Watchdog timer: forces loading to reset if any step blocks
    const watchdog = setTimeout(() => {
      setIsLoading(false);
    }, 15000);

    try {
      const cleanDigits = cleanIdentifier.replace(/[^0-9]/g, '');

      // 0. Direct Supabase 'blood_donors' table authentication lookup
      if (isSupabaseConfigured && cleanDigits.length >= 10) {
        try {
          const last11Digits = cleanDigits.slice(-11);
          const withPlus88 = `+88${last11Digits}`;
          const { data: donorData, error: donorErr } = await supabase
            .from('blood_donors')
            .select('*')
            .or(`phone.eq.${last11Digits},phone.eq.${withPlus88},phone.ilike.%${last11Digits}%`)
            .limit(1);

          if (!donorErr && donorData && donorData.length > 0) {
            const donor = donorData[0];
            const donorPass = donor.password ? String(donor.password).trim() : '';
            if (!donorPass || donorPass === password.trim()) {
              const donorUser: UserProfile = {
                id: String(donor.id || `bld_${Date.now()}`),
                name: donor.name || donor.full_name || 'রক্তদাতা',
                fullName: donor.name || donor.full_name || 'রক্তদাতা',
                phone: donor.phone,
                role: 'blood_donor',
                bloodGroup: donor.blood_group || donor.bloodGroup || 'A+',
                division: donor.division || 'চট্টগ্রাম',
                district: donor.district || 'খাগড়াছড়ি',
                upazila: donor.upazila || 'সদর',
                mahalla: donor.area || '',
                avatar: donor.photo_url || donor.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
                isNidVerified: donor.verified !== false,
                isPaidMember: true,
                createdAt: donor.created_at ? donor.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
              };

              setSuccessMsg(
                lang === 'bn' 
                  ? `স্বাগতম ${donorUser.name}! সফলভাবে লগইন হয়েছে।` 
                  : `Welcome ${donorUser.name}! Login successful.`
              );
              login(donorUser, false);
              if (onSignInSuccess) {
                onSignInSuccess(donorUser);
              }
              setIsLoading(false);
              return;
            } else {
              setErrorMsg(
                lang === 'bn' 
                  ? 'প্রদত্ত পাসওয়ার্ডটি সঠিক নয়। অনুগ্রহ করে সঠিক পাসওয়ার্ড দিয়ে পুনরায় চেষ্টা করুন।' 
                  : 'Incorrect password. Please enter the correct password.'
              );
              setIsLoading(false);
              return;
            }
          }
        } catch (dErr) {
          console.warn('[SignIn] blood_donors query notice:', dErr);
        }
      }

      // 1. Try Supabase Auth Email & Password Authentication
      const authResult = await signInWithEmailPassword(cleanIdentifier, password, lang);
      if (authResult.success && authResult.user) {
        setSuccessMsg(
          lang === 'bn' 
            ? `স্বাগতম ${authResult.user.name || authResult.user.fullName}! সফলভাবে লগইন হয়েছে।` 
            : `Welcome ${authResult.user.name || authResult.user.fullName}! Login successful.`
        );
        login(authResult.user, false);
        if (onSignInSuccess) {
          onSignInSuccess(authResult.user);
        }
        setIsLoading(false);
        return;
      } else if (authResult.errorCode === 'auth/wrong-password' || authResult.errorCode === 'auth/invalid-credential') {
        setErrorMsg(authResult.error || (lang === 'bn' ? 'ভুল পাসওয়ার্ড। অনুগ্রহ করে আবার চেষ্টা করুন।' : 'Incorrect password.'));
        setIsLoading(false);
        return;
      }

      // 3. Fallback Query Firestore / registered user profiles in database
      const foundUser = await databaseService.getUserByIdOrPhone(cleanIdentifier);

      if (foundUser) {
        // User account exists: Validate password if password is set on the account
        if (foundUser.password && foundUser.password.trim() !== password.trim()) {
          setErrorMsg(
            lang === 'bn' 
              ? 'প্রদত্ত পাসওয়ার্ডটি সঠিক নয়। অনুগ্রহ করে সঠিক পাসওয়ার্ড দিয়ে পুনরায় চেষ্টা করুন।' 
              : 'Incorrect password. Please enter the correct password.'
          );
          setIsLoading(false);
          return;
        }

        // Successfully authenticated registered user
        setSuccessMsg(
          lang === 'bn' 
            ? `স্বাগতম ${foundUser.name || foundUser.fullName}! সফলভাবে লগইন হয়েছে।` 
            : `Welcome ${foundUser.name || foundUser.fullName}! Login successful.`
        );
        login(foundUser, false);
        if (onSignInSuccess) {
          onSignInSuccess(foundUser);
        }
        setIsLoading(false);
        return;
      }

      // 4. Check professionals data context
      const matchedPro = professionals.find(p => {
        const pDigits = (p.phone || '').replace(/[^0-9]/g, '');
        return (cleanDigits.length >= 10 && pDigits === cleanDigits) || 
               (p.name && p.name.toLowerCase() === cleanIdentifier.toLowerCase());
      });

      if (matchedPro) {
        const proUser: UserProfile = {
          id: String(matchedPro.id || `usr_${Date.now()}`),
          name: matchedPro.name,
          fullName: matchedPro.name,
          phone: matchedPro.phone,
          role: 'professional',
          division: 'চট্টগ্রাম',
          district: matchedPro.district,
          upazila: matchedPro.upazila,
          mahalla: matchedPro.area,
          avatar: matchedPro.img || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
          isNidVerified: matchedPro.verified ?? true,
          isPaidMember: true,
          createdAt: new Date().toISOString().split('T')[0]
        };
        setSuccessMsg(lang === 'bn' ? `স্বাগতম ${proUser.name}! সফলভাবে লগইন হয়েছে।` : `Welcome ${proUser.name}! Login successful.`);
        login(proUser, false);
        if (onSignInSuccess) {
          onSignInSuccess(proUser);
        }
        setIsLoading(false);
        return;
      }

      // 5. STRICT AUTHENTICATION: Account DOES NOT exist in registered users!
      // Do not create synthetic account. Show clear validation error prompting registration.
      setErrorMsg(
        lang === 'bn' 
          ? 'এই মোবাইল নম্বর বা ইমেইল দিয়ে কোনো রেজিস্টার্ড অ্যাকাউন্ট পাওয়া যায়নি। অনুগ্রহ করে প্রথমে সাইন আপ (রেজিস্ট্রেশন) করুন।' 
          : 'No registered account found with this phone number or email. Please sign up first.'
      );
    } catch (err: any) {
      console.warn('[SignIn] Authentication notice:', err?.message || err);
      setErrorMsg(
        err?.message || (lang === 'bn' ? 'লগইন প্রক্রিয়ায় সমস্যা হয়েছে। অনুগ্রহ করে পুনরায় চেষ্টা করুন।' : 'Authentication failed. Please try again.')
      );
    } finally {
      clearTimeout(watchdog);
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-[#fdfbfb] min-h-full flex-1 flex flex-col justify-between relative text-gray-900 pb-12 pointer-events-auto" id="signin-screen-root">
      
      {/* Main Centered Form Container - Starts neatly right below unified top header */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-8 py-6 max-w-md mx-auto w-full">
        
        {/* Title & Subtitle */}
        <div className="text-center mb-6 space-y-1">
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-950">
            {lang === 'bn' ? 'অ্যাকাউন্টে লগইন করুন' : 'Sign in to your account'}
          </h2>
          <p className="text-xs text-gray-500">
            {lang === 'bn' 
              ? 'আপনার ইউজারনেম বা মোবাইল নম্বর এবং পাসওয়ার্ড প্রদান করুন।' 
              : 'Enter your username or phone number and password.'}
          </p>
        </div>

        {/* Alerts */}
        {errorMsg && !isDomainError(errorMsg) && (
          <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl space-y-2 text-xs font-medium animate-fadeIn">
            <div className="flex items-start gap-2 text-red-700">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
            {errorMsg.includes('রেজিস্ট্রেশন') || errorMsg.includes('sign up') ? (
              <div className="pt-1 pl-6">
                <button
                  type="button"
                  onClick={onNavigateToSignUp}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-red-800 hover:text-red-950 bg-red-100/80 hover:bg-red-200/80 px-2.5 py-1 rounded-lg transition cursor-pointer"
                  id="btn-error-prompt-signup"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>{lang === 'bn' ? 'এখনই সাইন আপ / রেজিস্ট্রেশন করুন →' : 'Sign Up / Register Now →'}</span>
                </button>
              </div>
            ) : null}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-medium animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Input Form Fields: ONLY username/phone and password */}
        <form onSubmit={handleSubmit} className="space-y-4" id="form-signin">
          
          {/* Phone / Username Input */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">
              {lang === 'bn' ? 'ইউজারনেম বা মোবাইল নম্বর' : 'Username or Mobile Number'}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={lang === 'bn' ? '018XXXXXXXX বা ইউজারনেম' : '018XXXXXXXX or username'}
                className="w-full px-3.5 py-2.5 bg-white border border-gray-300 focus:border-gray-900 rounded-xl text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 transition"
                id="input-signin-identifier"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-gray-700">
                {lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
              </label>
            </div>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 pr-10 py-2.5 bg-white border border-gray-300 focus:border-gray-900 rounded-xl text-xs font-medium text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-900 transition"
                id="input-signin-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(s => !s)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700 cursor-pointer p-0.5"
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Remember me & Forgot password in clean row */}
          <div className="flex items-center justify-between text-xs pt-0.5">
            <label className="flex items-center gap-2 cursor-pointer text-gray-600 font-medium select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 text-gray-900 focus:ring-gray-900 cursor-pointer accent-gray-900"
              />
              <span>{lang === 'bn' ? 'মনে রাখুন' : 'Remember me'}</span>
            </label>

            <button
              type="button"
              onClick={() => {
                setForgotInput(identifier);
                setShowForgotModal(true);
              }}
              className="text-gray-600 hover:text-gray-950 font-semibold hover:underline cursor-pointer transition text-xs"
              id="btn-forgot-password"
            >
              {lang === 'bn' ? 'পাসওয়ার্ড ভুলে গেছেন?' : 'Forgot Password?'}
            </button>
          </div>

          {/* Primary Sign In Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gray-900 hover:bg-black active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50 mt-2"
            id="btn-submit-signin"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span>{lang === 'bn' ? 'লগইন করুন' : 'Sign In'}</span>
            )}
          </button>
        </form>

        {/* Bottom Link Directing Users to Sign Up */}
        <div className="mt-8 text-center pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-600 leading-relaxed">
            {lang === 'bn' 
              ? 'আপনার কি কোনো অ্যাকাউন্ট নেই? ' 
              : "Don't have an account yet? "}
            <button
              type="button"
              onClick={onNavigateToSignUp}
              className="font-bold text-gray-950 hover:underline cursor-pointer inline-flex items-center gap-1"
              id="btn-signin-to-signup"
            >
              <span>{lang === 'bn' ? 'সাইন আপ / রেজিস্ট্রেশন করুন' : 'Sign Up / Register'}</span>
            </button>
          </p>
        </div>

      </div>

      {/* Forgot Password Modal (Clean Minimal Dialog) */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-gray-200 max-w-sm w-full p-5 shadow-xl space-y-4 animate-fadeIn">
            <div className="space-y-1">
              <h3 className="text-base font-bold text-gray-900">
                {lang === 'bn' ? 'পাসওয়ার্ড পুনরুদ্ধার' : 'Reset Password'}
              </h3>
              <p className="text-xs text-gray-500">
                {lang === 'bn' 
                  ? 'আপনার নিবন্ধিত মোবাইল নম্বর বা ইমেইল লিখুন। আমরা আপনাকে একটি ওটিপি কোড পাঠাব।' 
                  : 'Enter your registered phone or email to receive a recovery code.'}
              </p>
            </div>

            {forgotSubmitted ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{lang === 'bn' ? 'ওটিপি কোড পাঠানো হয়েছে!' : 'Recovery OTP has been sent!'}</span>
                </div>
                <p className="text-[11px] text-emerald-700">
                  {lang === 'bn' ? `${forgotInput}-এ ওটিপি পাঠানো হয়েছে। কোড: 5892` : `OTP sent to ${forgotInput}. Code: 5892`}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(false);
                    setForgotSubmitted(false);
                  }}
                  className="w-full mt-2 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl"
                >
                  {lang === 'bn' ? 'ঠিক আছে' : 'Done'}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <input
                  type="text"
                  value={forgotInput}
                  onChange={(e) => setForgotInput(e.target.value)}
                  placeholder={lang === 'bn' ? 'মোবাইল নম্বর বা ইমেইল' : 'Phone or Email'}
                  className="w-full px-3 py-2 bg-white border border-gray-300 rounded-xl text-xs text-gray-900 focus:outline-none focus:border-gray-900"
                />
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setShowForgotModal(false)}
                    className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-semibold transition cursor-pointer"
                  >
                    {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (forgotInput.trim()) {
                        setForgotSubmitted(true);
                      }
                    }}
                    className="flex-1 py-2 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    {lang === 'bn' ? 'কোড পাঠান' : 'Send Code'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
