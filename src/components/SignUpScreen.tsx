import React, { useState } from 'react';
import { 
  User, 
  Smartphone, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { Language, UserProfile } from '../types';
import { databaseService } from '../services/databaseService';
import { performSocialAuth, signUpWithEmailPassword, checkAccountUniqueness, isDomainError } from '../services/authService';

interface SignUpScreenProps {
  onBack: () => void;
  onSignUpComplete: (user: UserProfile) => void;
  onNavigateToSignIn?: () => void;
  lang: Language;
  defaultDivision?: string;
  defaultDistrict?: string;
  defaultUpazila?: string;
  defaultMahalla?: string;
}

export const SignUpScreen: React.FC<SignUpScreenProps> = ({
  onBack,
  onSignUpComplete,
  onNavigateToSignIn,
  lang,
  defaultDivision = 'চট্টগ্রাম',
  defaultDistrict = 'খাগড়াছড়ি',
  defaultUpazila = 'খাগড়াছড়ি সদর',
  defaultMahalla = 'সদর এলাকা',
}) => {
  const [name, setName] = useState('');
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSocialSignUp = async (provider: 'Google' | 'Facebook') => {
    setIsSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    const watchdog = setTimeout(() => {
      setIsSubmitting(false);
    }, 15000);

    try {
      const result = await performSocialAuth(provider, {
        division: defaultDivision,
        district: defaultDistrict,
        upazila: defaultUpazila,
        mahalla: defaultMahalla
      });

      if (result.success && result.user) {
        setSuccessMsg(lang === 'bn' ? `🎉 ${provider} দিয়ে সফলভাবে সাইন আপ হয়েছে!` : `🎉 Successfully signed up with ${provider}!`);
        setTimeout(() => {
          setIsSubmitting(false);
          onSignUpComplete(result.user!);
        }, 300);
      } else {
        const errorText = result.error || (lang === 'bn' ? `${provider} সাইন-আপ সম্পন্ন করা যায়নি` : `${provider} sign-up failed`);
        setErrorMsg(errorText);
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.warn('Firestore user save notice:', err);
      const errorText = err?.message || (lang === 'bn' ? 'সোশ্যাল সাইন-আপে সমস্যা হয়েছে' : 'Social sign-up error');
      setErrorMsg(errorText);
      setIsSubmitting(false);
    } finally {
      clearTimeout(watchdog);
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!name.trim()) {
      setErrorMsg(lang === 'bn' ? 'অনুগ্রহ করে আপনার পুরো নাম লিখুন।' : 'Please enter your full name.');
      return;
    }
    const cleanId = identifier.trim();
    if (!cleanId) {
      setErrorMsg(lang === 'bn' ? 'মোবাইল নম্বর বা ইমেইল লিখুন।' : 'Please enter phone or email.');
      return;
    }
    if (authMethod === 'phone' && cleanId.replace(/[^0-9]/g, '').length < 11) {
      setErrorMsg(lang === 'bn' ? 'সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।' : 'Enter a valid 11-digit mobile number.');
      return;
    }
    if (!password.trim() || password.length < 4) {
      setErrorMsg(lang === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।' : 'Password must be at least 4 characters.');
      return;
    }
    if (confirmPassword && password !== confirmPassword) {
      setErrorMsg(lang === 'bn' ? 'পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মেলেনি।' : 'Passwords do not match.');
      return;
    }

    setIsSubmitting(true);
    const watchdog = setTimeout(() => {
      setIsSubmitting(false);
    }, 15000);

    const isPhone = authMethod === 'phone';
    const cleanPhone = isPhone ? cleanId : '';
    const cleanEmail = !isPhone ? cleanId : `${cleanPhone}@jhadimadi.com`;

    try {
      // 1. Uniqueness check before signup
      const uniqueness = await checkAccountUniqueness({
        phone: cleanPhone || undefined,
        email: isPhone ? undefined : cleanEmail,
      });

      if (!uniqueness.isAvailable) {
        setErrorMsg('এই ফোন নম্বর অথবা ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট তৈরি করা হয়েছে।');
        setIsSubmitting(false);
        clearTimeout(watchdog);
        return;
      }

      const authResult = await signUpWithEmailPassword({
        email: cleanEmail,
        password: password.trim(),
        fullName: name.trim(),
        phone: cleanPhone,
        role: 'customer',
        location: {
          division: defaultDivision,
          district: defaultDistrict,
          upazila: defaultUpazila,
          mahalla: defaultMahalla
        },
        additionalProfile: {
          password: password.trim(),
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        },
        lang
      });

      if (authResult.success && authResult.user) {
        setSuccessMsg(lang === 'bn' ? '🎉 ডাটাবেজে একাউন্ট সফলভাবে তৈরি হয়েছে!' : '🎉 Account successfully registered!');
        setTimeout(() => {
          setIsSubmitting(false);
          onSignUpComplete(authResult.user!);
        }, 400);
      } else {
        setErrorMsg(authResult.error || (lang === 'bn' ? 'রেজিস্ট্রেশন ব্যর্থ হয়েছে' : 'Registration failed'));
        setIsSubmitting(false);
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setErrorMsg(err?.message || (lang === 'bn' ? 'রেজিস্ট্রেশন ব্যর্থ হয়েছে' : 'Registration failed'));
      setIsSubmitting(false);
    } finally {
      clearTimeout(watchdog);
    }
  };

  return (
    <div className="bg-[#fdfbfb] min-h-full flex-1 rounded-2xl border border-stone-200/80 flex flex-col justify-between shadow-xs relative text-gray-900 pb-12 pointer-events-auto" id="signup-screen-root">
      
      {/* Main Centered Form Container */}
      <div className="flex-1 flex flex-col justify-center px-4 sm:px-8 py-6 max-w-md mx-auto w-full">
        
        {/* Title & Subtitle */}
        <div className="text-center mb-5 space-y-1">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-gray-950">
            {lang === 'bn' ? 'প্রোফাইল রেজিস্ট্রেশন' : 'Profile Registration'}
          </h1>
          <p className="text-xs text-gray-500">
            {lang === 'bn' 
              ? 'Jhadimadi.com-এ একটি প্রফেশনাল প্রোফাইল তৈরির জন্য রেজিস্ট্রেশন করুন' 
              : 'Register on Jhadimadi.com to create a professional profile'}
          </p>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-medium animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMsg && !isDomainError(errorMsg) && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl flex flex-col gap-2 text-red-700 text-xs font-medium animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
            {(errorMsg.includes('ইতিমধ্যে') || errorMsg.includes('already') || errorMsg.includes('অ্যাকাউন্ট')) && (
              <div className="pt-1 border-t border-red-100 flex items-center justify-between">
                <span className="text-[11px] text-red-600">
                  {lang === 'bn' ? 'সরাসরি লগইন করতে চান?' : 'Already have an account?'}
                </span>
                <button
                  type="button"
                  onClick={onNavigateToSignIn}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[11px] font-bold transition shadow-xs cursor-pointer"
                >
                  {lang === 'bn' ? 'লগইন করুন' : 'Sign In Now'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* Social Authentication Section */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => handleSocialSignUp('Google')}
            disabled={isSubmitting}
            className="w-full py-2.5 px-3.5 bg-white hover:bg-gray-50 active:bg-gray-100 border border-gray-300 hover:border-gray-400 text-gray-800 rounded-xl text-xs font-semibold shadow-2xs flex items-center justify-center gap-2.5 transition cursor-pointer disabled:opacity-60"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
            <span>{lang === 'bn' ? 'Google দিয়ে ১-ক্লিকে সাইন আপ' : 'Sign up with Google'}</span>
          </button>

          <button
            type="button"
            onClick={() => handleSocialSignUp('Facebook')}
            disabled={isSubmitting}
            className="w-full py-2.5 px-3.5 bg-white hover:bg-gray-50 active:bg-gray-100 border border-gray-300 hover:border-gray-400 text-gray-800 rounded-xl text-xs font-semibold shadow-2xs flex items-center justify-center gap-2.5 transition cursor-pointer disabled:opacity-60"
          >
            <svg className="w-4 h-4 fill-[#1877F2] shrink-0" viewBox="0 0 24 24">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            <span>{lang === 'bn' ? 'Facebook দিয়ে ১-ক্লিকে সাইন আপ' : 'Sign up with Facebook'}</span>
          </button>
        </div>

        {/* Clean Divider between Social Buttons and Form */}
        <div className="border-t border-gray-200 my-4"></div>

        {/* Simplified Form Fields */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* 1. Full Name */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {lang === 'bn' ? 'আপনার পূর্ণ নাম' : 'Full Name'} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder={lang === 'bn' ? 'যেমন: মোঃ রফিকুল ইসলাম' : 'e.g. Rafiqul Islam'}
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-gray-300 focus:border-gray-900 rounded-xl text-xs font-medium text-gray-900 focus:outline-none"
              />
              <User className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
            </div>
          </div>

          {/* 2. Phone / Email */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-gray-700">
                {authMethod === 'phone' ? (lang === 'bn' ? 'মোবাইল নম্বর' : 'Phone Number') : (lang === 'bn' ? 'ইমেইল ঠিকানা' : 'Email Address')} <span className="text-red-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => {
                  setAuthMethod(m => m === 'phone' ? 'email' : 'phone');
                  setIdentifier('');
                }}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900 hover:underline cursor-pointer"
              >
                {authMethod === 'phone' ? (lang === 'bn' ? 'ইমেইল ব্যবহার করুন' : 'Use Email') : (lang === 'bn' ? 'মোবাইল ব্যবহার করুন' : 'Use Phone')}
              </button>
            </div>
            <div className="relative">
              <input
                type={authMethod === 'phone' ? 'tel' : 'email'}
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder={authMethod === 'phone' ? '018XXXXXXXX' : 'user@example.com'}
                className="w-full pl-9 pr-3.5 py-2.5 bg-white border border-gray-300 focus:border-gray-900 rounded-xl text-xs font-medium text-gray-900 focus:outline-none"
              />
              {authMethod === 'phone' ? (
                <Smartphone className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              ) : (
                <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
              )}
            </div>
          </div>

          {/* 3 & 4. Password & Confirm Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-8 pr-8 py-2.5 bg-white border border-gray-300 focus:border-gray-900 rounded-xl text-xs font-medium text-gray-900 focus:outline-none"
                />
                <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-700 cursor-pointer p-0.5"
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                {lang === 'bn' ? 'কনফার্ম পাসওয়ার্ড' : 'Confirm Password'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-8 pr-8 py-2.5 bg-white border border-gray-300 focus:border-gray-900 rounded-xl text-xs font-medium text-gray-900 focus:outline-none"
                />
                <Lock className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-3" />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-700 cursor-pointer p-0.5"
                >
                  {showConfirmPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>

          <p className="text-[10px] text-gray-500 pt-0.5">
            {lang === 'bn' 
              ? '💡 রেজিস্ট্রেশনের পর আপনার "প্রোফাইল" থেকে ঠিকানা, জন্মতারিখ ও অন্যান্য তথ্য যেকোনো সময় যোগ করতে পারবেন।' 
              : '💡 You can update location, birth date, and bio in your Profile anytime after registration.'}
          </p>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-gray-900 hover:bg-black active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition cursor-pointer mt-2 disabled:opacity-50"
          >
            {isSubmitting ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <span>{lang === 'bn' ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Account'}</span>
            )}
          </button>
        </form>

        {/* Toggle between Sign In & Sign Up */}
        <div className="mt-6 text-center pt-4 border-t border-gray-100">
          <p className="text-xs text-gray-600">
            {lang === 'bn' ? 'ইতিমধ্যেই একাউন্ট আছে? ' : 'Already have an account? '}
            <button
              type="button"
              onClick={onNavigateToSignIn || onBack}
              className="font-bold text-gray-950 hover:underline cursor-pointer ml-1"
            >
              {lang === 'bn' ? 'লগইন করুন' : 'Sign In'}
            </button>
          </p>
        </div>

      </div>
    </div>
  );
};
