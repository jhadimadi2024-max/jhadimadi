import React, { useState } from 'react';
import { 
  X, Lock, Phone, Mail, User, ShieldCheck, CheckCircle2, 
  LogIn, UserPlus, Eye, EyeOff, AlertCircle
} from 'lucide-react';
import { Language, UserProfile } from '../types';
import { databaseService } from '../services/databaseService';
import { performSocialAuth, signInWithEmailPassword, signUpWithEmailPassword, isDomainError } from '../services/authService';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: UserProfile) => void;
  lang: Language;
  defaultDivision?: string;
  defaultDistrict?: string;
  defaultUpazila?: string;
  defaultMahalla?: string;
  initialTab?: 'signin' | 'signup';
  noticeMessage?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  lang,
  defaultDivision = 'চট্টগ্রাম',
  defaultDistrict = 'খাগড়াছড়ি',
  defaultUpazila = 'খাগড়াছড়ি সদর',
  defaultMahalla = 'পৌর এলাকা',
  initialTab = 'signin',
  noticeMessage,
}) => {
  const [activeTab, setActiveTab] = useState<'signin' | 'signup'>(initialTab);
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  const [showPassword, setShowPassword] = useState(false);

  // Form State
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [name, setName] = useState('');
  const [division, setDivision] = useState(defaultDivision);
  const [district, setDistrict] = useState(defaultDistrict);
  const [upazila, setUpazila] = useState(defaultUpazila);
  const [mahalla, setMahalla] = useState(defaultMahalla);
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSocialAuth = async (provider: 'Google' | 'Facebook') => {
    setIsLoading(true);
    setErrorMsg('');

    const watchdog = setTimeout(() => {
      setIsLoading(false);
    }, 15000);

    try {
      const result = await performSocialAuth(provider, {
        division,
        district,
        upazila,
        mahalla
      });

      if (result.success && result.user) {
        onAuthSuccess(result.user);
        onClose();
      } else {
        const errorText = result.error || (lang === 'bn' ? `${provider} অথেন্টিকেশন সম্পন্ন করা যায়নি।` : `${provider} authentication failed.`);
        setErrorMsg(errorText);
      }
    } catch (err: any) {
      console.warn('AuthModal social auth error:', err);
      const errorText = err?.message || (lang === 'bn' ? 'সোশ্যাল লগইন প্রক্রিয়ায় সমস্যা হয়েছে' : 'Social sign-in error');
      setErrorMsg(errorText);
    } finally {
      clearTimeout(watchdog);
      setIsLoading(false);
    }
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const identifier = authMethod === 'phone' ? phone.trim() : email.trim();
    if (!identifier) {
      setErrorMsg(lang === 'bn' ? 'অনুগ্রহ করে মোবাইল নম্বর বা ইমেইল লিখুন।' : 'Please enter phone or email.');
      return;
    }
    if (!password.trim()) {
      setErrorMsg(lang === 'bn' ? 'অনুগ্রহ করে পাসওয়ার্ড লিখুন।' : 'Please enter password.');
      return;
    }

    setIsLoading(true);
    const watchdog = setTimeout(() => {
      setIsLoading(false);
    }, 15000);

    try {
      // 1. Try Supabase Auth first
      const authResult = await signInWithEmailPassword(identifier, password, lang);
      if (authResult.success && authResult.user) {
        onAuthSuccess(authResult.user);
        onClose();
        return;
      } else if (authResult.errorCode === 'auth/wrong-password' || authResult.errorCode === 'auth/invalid-credential') {
        setErrorMsg(authResult.error || (lang === 'bn' ? 'ভুল পাসওয়ার্ড। অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।' : 'Incorrect password. Please try again.'));
        return;
      }

      // 2. Fallback to database
      const existingUser = await databaseService.getUserByIdOrPhone(identifier);
      if (!existingUser) {
        setErrorMsg(
          lang === 'bn' 
            ? 'এই মোবাইল বা ইমেইল দিয়ে কোনো রেজিস্টার্ড একাউন্ট নেই। অনুগ্রহ করে প্রথমে সাইন আপ করুন।' 
            : 'No registered account found. Please sign up first.'
        );
        return;
      }

      if (existingUser.password && existingUser.password.trim() !== password.trim()) {
        setErrorMsg(
          lang === 'bn' 
            ? 'ভুল পাসওয়ার্ড। অনুগ্রহ করে সঠিক পাসওয়ার্ড দিন।' 
            : 'Incorrect password. Please try again.'
        );
        return;
      }

      onAuthSuccess(existingUser);
      onClose();
    } catch (e: any) {
      console.warn('AuthModal user lookup notice:', e);
      setErrorMsg(e?.message || (lang === 'bn' ? 'লগইন ব্যর্থ হয়েছে।' : 'Sign-in failed.'));
    } finally {
      clearTimeout(watchdog);
      setIsLoading(false);
    }
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!name.trim()) {
      setErrorMsg(lang === 'bn' ? 'অনুগ্রহ করে আপনার নাম লিখুন।' : 'Please enter your name.');
      return;
    }
    const identifier = authMethod === 'phone' ? phone.trim() : email.trim();
    if (!identifier) {
      setErrorMsg(lang === 'bn' ? 'অনুগ্রহ করে মোবাইল নম্বর বা ইমেইল লিখুন।' : 'Please enter phone or email.');
      return;
    }
    if (!password.trim() || password.length < 4) {
      setErrorMsg(lang === 'bn' ? 'পাসওয়ার্ড কমপক্ষে ৪ অক্ষরের হতে হবে।' : 'Password must be at least 4 characters.');
      return;
    }
    if (password !== confirmPassword) {
      setErrorMsg(lang === 'bn' ? 'পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না।' : 'Passwords do not match.');
      return;
    }

    setIsLoading(true);
    const watchdog = setTimeout(() => {
      setIsLoading(false);
    }, 15000);

    const isPhone = authMethod === 'phone';
    const cleanPhone = isPhone ? phone.trim() : (email.includes('@') ? email.trim() : '');
    const cleanEmail = !isPhone ? email.trim() : `${phone.replace(/[^0-9]/g, '')}@jhadimadi.com`;

    try {
      const authResult = await signUpWithEmailPassword({
        email: cleanEmail,
        password: password.trim(),
        fullName: name.trim(),
        phone: cleanPhone,
        role: 'customer',
        location: {
          division,
          district,
          upazila,
          mahalla
        },
        additionalProfile: {
          password: password.trim(),
          avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        },
        lang
      });

      if (!authResult.success || !authResult.user) {
        throw new Error(authResult.error || (lang === 'bn' ? 'ফায়ারস্টোরে রেজিস্ট্রেশন ব্যর্থ হয়েছে' : 'Registration failed'));
      }

      onAuthSuccess(authResult.user);
      onClose();
    } catch (err: any) {
      console.error('AuthModal sign-up error:', err);
      setErrorMsg(err?.message || (lang === 'bn' ? 'রেজিস্ট্রেশন ব্যর্থ হয়েছে' : 'Registration failed'));
    } finally {
      clearTimeout(watchdog);
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white w-full max-w-md max-h-[92vh] rounded-2xl shadow-xl overflow-hidden flex flex-col border border-gray-200">
        
        {/* Header Bar */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gray-900 flex items-center justify-center text-white font-bold text-xs">
              ঝ
            </div>
            <div>
              <h3 className="font-bold text-sm text-gray-950">
                {activeTab === 'signin' 
                  ? (lang === 'bn' ? 'লগইন করুন' : 'Sign In') 
                  : (lang === 'bn' ? 'নতুন একাউন্ট তৈরি করুন' : 'Create an Account')}
              </h3>
              <p className="text-[11px] text-gray-500">jhadimadi.com</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-900 rounded-lg hover:bg-gray-100 cursor-pointer transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Notice Message if any */}
        {noticeMessage && (
          <div className="mx-5 mt-4 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{noticeMessage}</span>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          
          {errorMsg && !isDomainError(errorMsg) && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs font-medium">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* TAB 1: SIGN IN */}
          {activeTab === 'signin' ? (
            <form onSubmit={handleSignInSubmit} className="space-y-3.5 text-xs">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-gray-700">
                    {authMethod === 'phone' ? (lang === 'bn' ? 'মোবাইল নম্বর' : 'Phone Number') : (lang === 'bn' ? 'ইমেইল এড্রেস' : 'Email Address')}
                  </label>
                  <button
                    type="button"
                    onClick={() => setAuthMethod(m => m === 'phone' ? 'email' : 'phone')}
                    className="text-[11px] font-semibold text-gray-500 hover:text-gray-900 hover:underline cursor-pointer"
                  >
                    {authMethod === 'phone' ? 'ইমেইল ব্যবহার করুন' : 'মোবাইল ব্যবহার করুন'}
                  </button>
                </div>
                <input
                  type={authMethod === 'phone' ? 'tel' : 'email'}
                  required
                  value={authMethod === 'phone' ? phone : email}
                  onChange={(e) => authMethod === 'phone' ? setPhone(e.target.value) : setEmail(e.target.value)}
                  placeholder={authMethod === 'phone' ? '01812345678' : 'name@example.com'}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 focus:border-gray-900 rounded-xl text-xs font-medium text-gray-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1.5">
                  {lang === 'bn' ? 'পাসওয়ার্ড' : 'Password'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full px-3.5 pr-10 py-2.5 bg-white border border-gray-300 focus:border-gray-900 rounded-xl text-xs font-medium text-gray-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700 cursor-pointer p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gray-900 hover:bg-black active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all flex items-center justify-center gap-2 mt-2"
              >
                <LogIn className="w-4 h-4" />
                <span>{lang === 'bn' ? 'লগইন করুন' : 'Sign In'}</span>
              </button>
            </form>
          ) : (
            /* TAB 2: SIGN UP */
            <div className="space-y-4">
              {/* Social Authentication Section (Sign Up only) */}
              <div className="space-y-2.5">
                <button
                  type="button"
                  onClick={() => handleSocialAuth('Google')}
                  disabled={isLoading}
                  className="w-full py-2.5 px-3.5 bg-white hover:bg-gray-50 active:bg-gray-100 border border-gray-300 hover:border-gray-400 text-gray-800 rounded-xl text-xs font-semibold shadow-2xs flex items-center justify-center gap-2.5 transition cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>{lang === 'bn' ? 'Google দিয়ে সাইন আপ করুন' : 'Sign up with Google'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialAuth('Facebook')}
                  disabled={isLoading}
                  className="w-full py-2.5 px-3.5 bg-white hover:bg-gray-50 active:bg-gray-100 border border-gray-300 hover:border-gray-400 text-gray-800 rounded-xl text-xs font-semibold shadow-2xs flex items-center justify-center gap-2.5 transition cursor-pointer"
                >
                  <svg className="w-4 h-4 fill-[#1877F2] shrink-0" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  <span>{lang === 'bn' ? 'Facebook দিয়ে সাইন আপ করুন' : 'Sign up with Facebook'}</span>
                </button>
              </div>

              {/* Divider: অথবা / Or */}
              <div className="relative flex items-center justify-center my-3">
                <div className="border-t border-gray-200 w-full"></div>
                <span className="bg-white px-3 text-[11px] font-medium text-gray-400 tracking-wide uppercase">
                  {lang === 'bn' ? 'অথবা তথ্য দিয়ে' : 'or with details'}
                </span>
                <div className="border-t border-gray-200 w-full"></div>
              </div>

              <form onSubmit={handleSignUpSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1.5">
                  {lang === 'bn' ? 'আপনার পূর্ণ নাম' : 'Full Name'}
                </label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: মোঃ রফিকুল ইসলাম"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 focus:border-gray-900 rounded-xl text-xs font-medium text-gray-900 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="font-semibold text-gray-700">
                    {authMethod === 'phone' ? (lang === 'bn' ? 'মোবাইল নম্বর' : 'Phone Number') : (lang === 'bn' ? 'ইমেইল এড্রেস' : 'Email Address')}
                  </label>
                  <button
                    type="button"
                    onClick={() => setAuthMethod(m => m === 'phone' ? 'email' : 'phone')}
                    className="text-[11px] font-semibold text-gray-500 hover:text-gray-900 hover:underline cursor-pointer"
                  >
                    {authMethod === 'phone' ? 'ইমেইল ব্যবহার করুন' : 'মোবাইল ব্যবহার করুন'}
                  </button>
                </div>
                <input
                  type={authMethod === 'phone' ? 'tel' : 'email'}
                  required
                  value={authMethod === 'phone' ? phone : email}
                  onChange={(e) => authMethod === 'phone' ? setPhone(e.target.value) : setEmail(e.target.value)}
                  placeholder={authMethod === 'phone' ? '01812345678' : 'name@example.com'}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 focus:border-gray-900 rounded-xl text-xs font-medium text-gray-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1.5">
                  {lang === 'bn' ? 'পাসওয়ার্ড নির্ধারণ করুন' : 'Password'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড"
                    className="w-full px-3.5 pr-10 py-2.5 bg-white border border-gray-300 focus:border-gray-900 rounded-xl text-xs font-medium text-gray-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700 cursor-pointer p-0.5"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1.5">
                  {lang === 'bn' ? 'পাসওয়ার্ড নিশ্চিত করুন' : 'Confirm Password'}
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="পাসওয়ার্ডটি পুনরায় লিখুন"
                    className="w-full px-3.5 pr-10 py-2.5 bg-white border border-gray-300 focus:border-gray-900 rounded-xl text-xs font-medium text-gray-900 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-700 cursor-pointer p-0.5"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gray-900 hover:bg-black active:scale-[0.99] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-all flex items-center justify-center gap-2 mt-2"
              >
                <UserPlus className="w-4 h-4" />
                <span>{lang === 'bn' ? 'রেজিস্ট্রেশন সম্পন্ন করুন' : 'Create Account'}</span>
              </button>
            </form>
          </div>
          )}

          {/* Toggle between Sign In & Sign Up at bottom */}
          <div className="pt-4 border-t border-gray-100 text-center">
            {activeTab === 'signin' ? (
              <p className="text-xs text-gray-600">
                {lang === 'bn' ? 'একাউন্ট নেই? ' : "Don't have an account? "}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signup');
                    setErrorMsg('');
                  }}
                  className="font-bold text-gray-950 hover:underline cursor-pointer ml-1"
                >
                  {lang === 'bn' ? 'রেজিস্ট্রেশন করুন' : 'Sign Up'}
                </button>
              </p>
            ) : (
              <p className="text-xs text-gray-600">
                {lang === 'bn' ? 'ইতিমধ্যেই একাউন্ট আছে? ' : 'Already have an account? '}
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('signin');
                    setErrorMsg('');
                  }}
                  className="font-bold text-gray-950 hover:underline cursor-pointer ml-1"
                >
                  {lang === 'bn' ? 'লগইন করুন' : 'Sign In'}
                </button>
              </p>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
