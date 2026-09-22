import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  AlertCircle, 
  Mail, 
  User,
  Phone,
  RefreshCw, 
  CheckCircle2,
  Sparkles,
  ArrowRight,
  UserPlus
} from 'lucide-react';
import { adminSecurityService } from '../services/adminSecurityService';

interface AdminLoginScreenProps {
  onSuccess: () => void;
  onNavigateToCustomerApp: () => void;
}

export const AdminLoginScreen: React.FC<AdminLoginScreenProps> = ({
  onSuccess,
  onNavigateToCustomerApp,
}) => {
  // Whether an admin account exists in the database
  const [hasAdminAccount, setHasAdminAccount] = useState<boolean | null>(null);

  // Active view mode: 'login' (Sign In) vs 'signup' (First-Time Registration)
  const [authMode, setAuthMode] = useState<'login' | 'signup'>('login');

  // Login Form States (Standard Sign-In Box)
  const [loginIdentifier, setLoginIdentifier] = useState<string>('');
  const [loginPassword, setLoginPassword] = useState<string>('');
  const [showLoginPassword, setShowLoginPassword] = useState<boolean>(false);

  // Sign-Up / Setup Form States (First-Time Sign-Up Box: Email, Username, Password, Confirm Password, Phone Number)
  const [signupEmail, setSignupEmail] = useState<string>('');
  const [signupUsername, setSignupUsername] = useState<string>('');
  const [signupPassword, setSignupPassword] = useState<string>('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState<string>('');
  const [signupPhone, setSignupPhone] = useState<string>('');
  const [showSignupPassword, setShowSignupPassword] = useState<boolean>(false);
  const [showSignupConfirmPassword, setShowSignupConfirmPassword] = useState<boolean>(false);

  // Status & Feedback
  const [error, setError] = useState<string>('');
  const [successNotice, setSuccessNotice] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [checkingSetup, setCheckingSetup] = useState<boolean>(true);

  // Initialize: Check active session and database setup status on mount
  useEffect(() => {
    let isMounted = true;

    const initializeAuthStatus = async () => {
      try {
        // 1. Verify if an active valid admin session already exists
        const activeSession = await adminSecurityService.getCurrentAdminSession();
        if (activeSession && isMounted) {
          onSuccess();
          return;
        }

        // 2. Check if an admin account exists in the database (Authoritative check)
        const setupStatus = await adminSecurityService.getSetupStatus();
        if (isMounted) {
          const adminExists = Boolean(setupStatus.hasAdmin);
          setHasAdminAccount(adminExists);
          // If admin account exists, strictly show clean Login form; if none exists, show First-Time Setup
          setAuthMode(adminExists ? 'login' : 'signup');
        }
      } catch (err) {
        console.warn('[AdminLoginScreen] Setup status check warning:', err);
        if (isMounted) {
          // Default to login mode if network check encounters an issue
          setHasAdminAccount(true);
          setAuthMode('login');
        }
      } finally {
        if (isMounted) {
          setCheckingSetup(false);
        }
      }
    };

    initializeAuthStatus();
    return () => {
      isMounted = false;
    };
  }, [onSuccess]);

  // Handle Secure Sign-In Submission
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessNotice('');

    const cleanIdentifier = loginIdentifier.trim();
    const cleanPass = loginPassword.trim();

    if (!cleanIdentifier) {
      setError('অনুগ্রহ করে অ্যাডমিন ইউজারনেম বা ইমেইল ঠিকানা লিখুন।');
      return;
    }

    if (!cleanPass) {
      setError('অনুগ্রহ করে আপনার অ্যাডমিন পাসওয়ার্ড লিখুন।');
      return;
    }

    setIsLoading(true);

    try {
      const result = await adminSecurityService.signInAdmin(cleanIdentifier, cleanPass);
      setIsLoading(false);

      if (result.success) {
        setSuccessNotice('অ্যাডমিন পরিচয় সফলভাবে যাচাই করা হয়েছে! ড্যাশবোর্ডে প্রবেশ করা হচ্ছে...');
        setTimeout(() => {
          onSuccess();
        }, 500);
      } else {
        // Never redirect or switch to sign-up mode; strictly display the error on the clean Sign-In form
        setError(result.message || 'ইউজারনেম/ইমেইল অথবা পাসওয়ার্ড সঠিক নয়। অনুগ্রহ করে পুনরায় পরীক্ষা করুন।');
      }
    } catch {
      setIsLoading(false);
      setError('সার্ভার সংযোগে ত্রুটি হয়েছে। অনুগ্রহ করে ইন্টারনেট সংযোগ পরীক্ষা করে পুনরায় চেষ্টা করুন।');
    }
  };

  // Handle Secure Admin Sign-Up / First-Time Setup Submission
  const handleSignupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessNotice('');

    const cleanMail = signupEmail.trim();
    const cleanUser = signupUsername.trim();
    const cleanPass = signupPassword;
    const cleanConfirm = signupConfirmPassword;
    const cleanPhone = signupPhone.trim();

    // 1. Email (ইমেইল)
    if (!cleanMail) {
      setError('অনুগ্রহ করে অ্যাডমিন ইমেইল (Email) প্রদান করুন।');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanMail)) {
      setError('সঠিক ইমেইল ফরম্যাট প্রদান করুন (যেমন: admin@jhadimadi.com)।');
      return;
    }

    // 2. Username (ইউজারনেম)
    if (!cleanUser) {
      setError('অনুগ্রহ করে একটি ইউজারনেম (Username) লিখুন।');
      return;
    }

    if (!/^[a-zA-Z0-9_.\-]{3,30}$/.test(cleanUser)) {
      setError('ইউজারনেম ৩ থেকে ৩০ অক্ষরের হতে হবে (শুধুমাত্র ইংরেজি বর্ণ, সংখ্যা, আন্ডারস্কোর বা হাইফেন)।');
      return;
    }

    // 3. Password (পাসওয়ার্ড)
    if (!cleanPass) {
      setError('অনুগ্রহ করে একটি নিরাপদ পাসওয়ার্ড (Password) লিখুন।');
      return;
    }

    if (cleanPass.length < 6) {
      setError('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    // 4. Confirm Password (পাসওয়ার্ড দুইবার নিশ্চিতকরণ)
    if (!cleanConfirm) {
      setError('অনুগ্রহ করে পাসওয়ার্ডটি পুনরায় নিশ্চিত করুন।');
      return;
    }

    if (cleanPass !== cleanConfirm) {
      setError('পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড মিলছে না। অনুগ্রহ করে উভয় ঘরে একই পাসওয়ার্ড দিন।');
      return;
    }

    // 5. Phone Number (ফোন নম্বর)
    if (!cleanPhone) {
      setError('অনুগ্রহ করে অ্যাডমিন ফোন নম্বর (Phone Number) প্রদান করুন।');
      return;
    }

    const phoneDigits = cleanPhone.replace(/[\s\-\+]/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 15) {
      setError('সঠিক ফোন নম্বর প্রদান করুন (যেমন: 018XXXXXXXX বা 017XXXXXXXX)।');
      return;
    }

    setIsLoading(true);

    try {
      const result = await adminSecurityService.setupSuperAdmin({
        email: cleanMail,
        username: cleanUser,
        password: cleanPass,
        confirmPassword: cleanConfirm,
        phone: cleanPhone,
      });

      setIsLoading(false);

      if (result.success) {
        // Once successfully registered, securely store the credentials and switch permanently to the Sign-In view.
        setHasAdminAccount(true);
        setAuthMode('login');
        setLoginIdentifier(cleanUser || cleanMail);
        setLoginPassword('');
        setSignupPassword('');
        setSignupConfirmPassword('');
        setSuccessNotice('অ্যাডমিন অ্যাকাউন্ট সফলভাবে নিবন্ধিত ও সংরক্ষিত হয়েছে! অনুগ্রহ করে আপনার ইউজারনেম/ইমেইল এবং পাসওয়ার্ড দিয়ে সাইন-ইন করুন।');
      } else {
        setError(result.message || 'অ্যাডমিন অ্যাকাউন্ট তৈরি সম্পন্ন করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।');
      }
    } catch {
      setIsLoading(false);
      setError('সার্ভার সংযোগে ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    }
  };

  // Validations for Sign-Up fields
  const isSignupEmailValid = signupEmail.trim().length > 3 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail.trim());
  const isSignupUserValid = signupUsername.trim().length >= 3 && /^[a-zA-Z0-9_.\-]{3,30}$/.test(signupUsername.trim());
  const isSignupPassValid = signupPassword.length >= 6;
  const doSignupPassMatch = signupPassword.length > 0 && signupPassword === signupConfirmPassword;
  const isSignupPhoneValid = signupPhone.replace(/[\s\-\+]/g, '').length >= 10 && signupPhone.replace(/[\s\-\+]/g, '').length <= 15;

  // Initial Loading Check
  if (checkingSetup) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 select-none">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 border-2 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
          <p className="text-xs font-medium text-slate-400">সিকিউরিটি ও অ্যাকাউন্ট স্ট্যাটাস যাচাই করা হচ্ছে...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-slate-950 text-slate-100 flex flex-col justify-start sm:justify-between items-center p-4 sm:p-6 font-sans relative overflow-y-auto selection:bg-emerald-500 selection:text-white">
      
      {/* Background Subtle Gradient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-slate-950 pointer-events-none" />
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-emerald-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-teal-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Navigation */}
      <div className="w-full max-w-md flex items-center justify-between z-10 pt-2 shrink-0">
        <button
          id="btn-back-to-customer-app"
          type="button"
          onClick={() => {
            if (onNavigateToCustomerApp) {
              onNavigateToCustomerApp();
            } else if (window.opener && !window.opener.closed) {
              window.close();
            } else {
              window.location.href = '/';
            }
          }}
          className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 transition cursor-pointer active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>কাস্টমার অ্যাপে ফিরুন</span>
        </button>

        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 bg-slate-900/80 border border-slate-800 px-3 py-1.5 rounded-xl">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>Jhadimadi.com Admin Control</span>
        </div>
      </div>

      {/* Main Authentication Card */}
      <div className="w-full max-w-md my-auto z-10 py-6">
        <div className="bg-slate-900/95 border border-slate-800/90 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl space-y-6">
          
          {/* Brand & Security Header */}
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center mx-auto shadow-lg shadow-emerald-950 text-white border border-emerald-400/30">
              {hasAdminAccount ? <Lock className="w-7 h-7" /> : <UserPlus className="w-7 h-7" />}
            </div>
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-950/80 border border-emerald-500/30 text-emerald-400 text-[11px] font-bold tracking-wider uppercase mb-1">
                {hasAdminAccount ? 'অ্যাডমিন পোর্টাল' : 'প্রথমবার অ্যাকাউন্ট সেটআপ'}
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
                {hasAdminAccount ? 'অ্যাডমিন ড্যাশবোর্ড সাইন-ইন' : 'সুপার অ্যাডমিন রেজিস্ট্রেশন'}
              </h1>
              <p className="text-xs text-slate-400 font-medium">
                {hasAdminAccount 
                  ? 'Jhadimadi.com এর সেন্ট্রাল কন্ট্রোল প্যানেলে প্রবেশ করুন' 
                  : 'ডাটাবেজে কোনো অ্যাডমিন অ্যাকাউন্ট নেই। প্রথম অ্যাডমিন হিসেবে আপনার লগইন তথ্য তৈরি করুন।'}
              </p>
            </div>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="bg-rose-950/60 border border-rose-800/80 rounded-2xl p-3 flex items-start gap-2.5 text-rose-200 text-xs animate-shake">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <span className="text-[11px] font-medium leading-relaxed">{error}</span>
            </div>
          )}

          {successNotice && (
            <div className="bg-emerald-950/70 border border-emerald-700/80 rounded-2xl p-3 flex items-start gap-2.5 text-emerald-200 text-xs animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span className="text-[11px] font-medium leading-relaxed">{successNotice}</span>
            </div>
          )}

          {/* VIEW 1: CLEAN SIGN-IN FORM (Rendered when admin account exists in database) */}
          {hasAdminAccount ? (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              
              {/* Username or Email */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  ইউজারনেম / ইমেইল (Username / Email) <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="input-login-identifier"
                    type="text"
                    required
                    autoFocus
                    autoComplete="username"
                    value={loginIdentifier}
                    onChange={(e) => {
                      setLoginIdentifier(e.target.value);
                      setError('');
                    }}
                    placeholder="ইউজারনেম বা ইমেইল লিখুন"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-xs font-medium placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-300 block">
                  পাসওয়ার্ড (Password) <span className="text-emerald-400">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    id="input-login-password"
                    type={showLoginPassword ? 'text' : 'password'}
                    required
                    autoComplete="current-password"
                    value={loginPassword}
                    onChange={(e) => {
                      setLoginPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="অ্যাডমিন পাসওয়ার্ড লিখুন"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-xs font-medium placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowLoginPassword(!showLoginPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition p-1 cursor-pointer"
                    title={showLoginPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
                  >
                    {showLoginPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Action */}
              <button
                id="btn-admin-login-submit"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-[0.99] disabled:opacity-60 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-950 transition cursor-pointer flex items-center justify-center gap-2 mt-2 border border-emerald-400/30"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    যাচাই করা হচ্ছে...
                  </span>
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>লগইন করুন (Login)</span>
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <p className="text-[11px] text-slate-500">
                  নিরাপদ এনক্রিপ্টেড ডাটাবেজ সংযোগ • Jhadimadi.com
                </p>
              </div>
            </form>
          ) : (
            /* VIEW 2: SIGN-UP (FIRST-TIME SETUP) FORM (Shown strictly when NO admin account exists) */
            <form onSubmit={handleSignupSubmit} className="space-y-4">
              
              {/* Policy note */}
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-emerald-500/30 text-emerald-300 text-[11px] flex items-start gap-2 leading-relaxed">
                <Sparkles className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span>
                  <strong>প্রথমবার রেজিস্ট্রেশন:</strong> আপনার তৈরি করা এই ইউজারনেম ও পাসওয়ার্ড স্থায়ীভাবে ডাটাবেজে সংরক্ষিত হবে এবং পরবর্তীতে লগইনের জন্য ব্যবহৃত হবে।
                </span>
              </div>

              {/* 1. Email (ইমেইল) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>ইমেইল (Email) <span className="text-emerald-400">*</span></span>
                  {signupEmail.length > 0 && (
                    <span className={`text-[10px] ${isSignupEmailValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {isSignupEmailValid ? 'সঠিক ইমেইল ✓' : 'সঠিক ফরম্যাট দিন'}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="input-signup-email"
                    type="email"
                    required
                    autoFocus
                    value={signupEmail}
                    onChange={(e) => {
                      setSignupEmail(e.target.value);
                      setError('');
                    }}
                    placeholder="যেমন: admin@jhadimadi.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-xs font-medium placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>
              </div>

              {/* 2. Username (ইউজারনেম) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>ইউজারনেম (Username) <span className="text-emerald-400">*</span></span>
                  {signupUsername.length > 0 && (
                    <span className={`text-[10px] ${isSignupUserValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {isSignupUserValid ? 'সঠিক ইউজারনেম ✓' : '৩-৩০ অক্ষর (বর্ণ ও সংখ্যা)'}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    id="input-signup-username"
                    type="text"
                    required
                    value={signupUsername}
                    onChange={(e) => {
                      setSignupUsername(e.target.value);
                      setError('');
                    }}
                    placeholder="যেমন: admin বা owner_admin"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-xs font-medium placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>
              </div>

              {/* New Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>পাসওয়ার্ড (Password) <span className="text-emerald-400">*</span></span>
                  {signupPassword.length > 0 && (
                    <span className={`text-[10px] ${isSignupPassValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {isSignupPassValid ? 'দৈর্ঘ্য ঠিক আছে ✓' : 'কমপক্ষে ৬ অক্ষর'}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="input-signup-password"
                    type={showSignupPassword ? 'text' : 'password'}
                    required
                    value={signupPassword}
                    onChange={(e) => {
                      setSignupPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="পাসওয়ার্ড লিখুন (কমপক্ষে ৬ অক্ষর)"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-xs font-medium placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupPassword(!showSignupPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition p-1 cursor-pointer"
                  >
                    {showSignupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Confirm Password */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>পাসওয়ার্ড দুইবার নিশ্চিতকরণ (Confirm Password) <span className="text-emerald-400">*</span></span>
                  {signupConfirmPassword.length > 0 && (
                    <span className={`text-[10px] ${doSignupPassMatch ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {doSignupPassMatch ? 'পাসওয়ার্ড মিলেছে ✓' : 'পাসওয়ার্ড মিলছে না ✕'}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    id="input-signup-confirm-password"
                    type={showSignupConfirmPassword ? 'text' : 'password'}
                    required
                    value={signupConfirmPassword}
                    onChange={(e) => {
                      setSignupConfirmPassword(e.target.value);
                      setError('');
                    }}
                    placeholder="পাসওয়ার্ডটি আবার লিখুন"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-xs font-medium placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignupConfirmPassword(!showSignupConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition p-1 cursor-pointer"
                  >
                    {showSignupConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Phone Number (ফোন নম্বর) */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 flex items-center justify-between">
                  <span>ফোন নম্বর (Phone Number) <span className="text-emerald-400">*</span></span>
                  {signupPhone.length > 0 && (
                    <span className={`text-[10px] ${isSignupPhoneValid ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {isSignupPhoneValid ? 'সঠিক নম্বর ✓' : '১০-১৫ ডিজিটের নম্বর দিন'}
                    </span>
                  )}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Phone className="w-4 h-4" />
                  </div>
                  <input
                    id="input-signup-phone"
                    type="tel"
                    required
                    value={signupPhone}
                    onChange={(e) => {
                      setSignupPhone(e.target.value);
                      setError('');
                    }}
                    placeholder="যেমন: 018XXXXXXXX বা 017XXXXXXXX"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-white text-xs font-medium placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Submit / Register button */}
              <button
                id="btn-admin-signup-submit"
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 active:scale-[0.99] disabled:opacity-60 text-white font-bold text-xs rounded-2xl shadow-lg shadow-emerald-950 transition cursor-pointer flex items-center justify-center gap-2 mt-2 border border-emerald-400/30"
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    রেজিস্ট্রেশন হচ্ছে...
                  </span>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>রেজিস্ট্রেশন সম্পন্ন করুন (Submit / Register)</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="pt-2 text-center">
                <p className="text-[11px] text-slate-500">
                  রেজিস্ট্রেশন সম্পন্ন হলে ক্রেডেনশিয়াল সংরক্ষিত হবে এবং স্থায়ীভাবে সাইন-ইন ভিউ প্রদর্শিত হবে।
                </p>
              </div>
            </form>
          )}

        </div>
      </div>

      {/* Footer Info */}
      <div className="z-10 text-center pb-3 text-[11px] text-slate-500 font-mono">
        Jhadimadi.com Central Administration Portal • Cryptographic Salted Hashing
      </div>

    </div>
  );
};

export default AdminLoginScreen;
