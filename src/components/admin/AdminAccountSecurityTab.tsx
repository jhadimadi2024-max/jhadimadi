import React, { useState, useEffect } from 'react';
import { 
  Lock, 
  Check, 
  AlertCircle, 
  CheckCircle2, 
  RefreshCw, 
  KeyRound, 
  Eye, 
  EyeOff, 
  User, 
  Mail, 
  ShieldCheck, 
  Sparkles,
  Smartphone,
  Laptop
} from 'lucide-react';
import { adminSecurityService, AccountSecurityData } from '../../services/adminSecurityService';

interface AdminAccountSecurityTabProps {
  onRequireRelogin?: () => void;
}

type SubTab = 'my_account' | 'security_settings';

export const AdminAccountSecurityTab: React.FC<AdminAccountSecurityTabProps> = ({ onRequireRelogin }) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('my_account');
  const [accountData, setAccountData] = useState<AccountSecurityData | null>(null);
  const [isLoadingAccount, setIsLoadingAccount] = useState(true);

  // Form: Change Username
  const [newUsername, setNewUsername] = useState('');
  const [usernameCurrentPassword, setUsernameCurrentPassword] = useState('');
  const [showUsernameCurrentPassword, setShowUsernameCurrentPassword] = useState(false);
  const [isUpdatingUsername, setIsUpdatingUsername] = useState(false);

  // Form: Change Email
  const [newEmail, setNewEmail] = useState('');
  const [emailCurrentPassword, setEmailCurrentPassword] = useState('');
  const [showEmailCurrentPassword, setShowEmailCurrentPassword] = useState(false);
  const [isUpdatingEmail, setIsUpdatingEmail] = useState(false);

  // Form: Change Password
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Feedback states
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const clearMessages = () => {
    setSuccessMessage('');
    setErrorMessage('');
  };

  const fetchAccountInfo = async () => {
    setIsLoadingAccount(true);
    try {
      const res = await adminSecurityService.getAccountSecurityInfo();
      if (res.success && res.data) {
        setAccountData(res.data);
      }
    } catch {
      // Fallback to local session if network error
    } finally {
      setIsLoadingAccount(false);
    }
  };

  useEffect(() => {
    fetchAccountInfo();
  }, []);

  // 1. Handle Username Update
  const handleUpdateUsername = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    const cleanUser = newUsername.trim();
    if (!cleanUser) {
      setErrorMessage('অনুগ্রহ করে নতুন ইউজারনেম লিখুন।');
      return;
    }

    if (!/^[a-zA-Z0-9_.\-]{3,30}$/.test(cleanUser)) {
      setErrorMessage('ইউজারনেম ৩ থেকে ৩০ অক্ষরের হতে হবে (শুধুমাত্র ইংরেজি বর্ণ, সংখ্যা, আন্ডারস্কোর, ডট বা হাইফেন)।');
      return;
    }

    if (!usernameCurrentPassword) {
      setErrorMessage('নিরাপত্তা যাচাইয়ের জন্য বর্তমান পাসওয়ার্ড দেওয়া আবশ্যক।');
      return;
    }

    setIsUpdatingUsername(true);
    try {
      const res = await adminSecurityService.updateUsername(usernameCurrentPassword, cleanUser);
      if (res.success) {
        setSuccessMessage(res.message || 'ইউজারনেম সফলভাবে পরিবর্তন করা হয়েছে!');
        setNewUsername('');
        setUsernameCurrentPassword('');
        fetchAccountInfo();
      } else {
        setErrorMessage(res.message || 'ইউজারনেম পরিবর্তন ব্যর্থ হয়েছে। বর্তমান পাসওয়ার্ডটি যাচাই করুন।');
      }
    } catch {
      setErrorMessage('ইউজারনেম পরিবর্তনের সময় সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsUpdatingUsername(false);
    }
  };

  // 2. Handle Email Update
  const handleUpdateEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    const cleanMail = newEmail.trim();
    if (!cleanMail) {
      setErrorMessage('অনুগ্রহ করে নতুন ইমেইল লিখুন।');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanMail)) {
      setErrorMessage('অনুগ্রহ করে সঠিক ইমেইল এড্রেস লিখুন (যেমন: owner@jhadimadi.com)।');
      return;
    }

    if (!emailCurrentPassword) {
      setErrorMessage('নিরাপত্তা যাচাইয়ের জন্য বর্তমান পাসওয়ার্ড দেওয়া আবশ্যক।');
      return;
    }

    setIsUpdatingEmail(true);
    try {
      const res = await adminSecurityService.updateEmail(emailCurrentPassword, cleanMail);
      if (res.success) {
        setSuccessMessage(res.message || 'লগইন ইমেইল সফলভাবে পরিবর্তন করা হয়েছে!');
        setNewEmail('');
        setEmailCurrentPassword('');
        fetchAccountInfo();
      } else {
        setErrorMessage(res.message || 'ইমেইল পরিবর্তন ব্যর্থ হয়েছে। বর্তমান পাসওয়ার্ডটি যাচাই করুন।');
      }
    } catch {
      setErrorMessage('ইমেইল পরিবর্তনের সময় সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsUpdatingEmail(false);
    }
  };

  // 3. Handle Password Update
  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    clearMessages();

    if (!currentPassword) {
      setErrorMessage('বর্তমান পাসওয়ার্ড দেওয়া আবশ্যক।');
      return;
    }

    if (!newPassword) {
      setErrorMessage('নতুন পাসওয়ার্ড দেওয়া আবশ্যক।');
      return;
    }

    if (newPassword.length < 6) {
      setErrorMessage('নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrorMessage('নতুন পাসওয়ার্ড এবং নিশ্চিতকরণ পাসওয়ার্ড মিলছে না।');
      return;
    }

    if (newPassword === currentPassword) {
      setErrorMessage('নতুন পাসওয়ার্ডটি বর্তমান পাসওয়ার্ডের চেয়ে ভিন্ন হতে হবে।');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      const res = await adminSecurityService.updatePasswordSecure(
        currentPassword,
        newPassword,
        confirmPassword
      );

      if (res.success) {
        setSuccessMessage(res.message || 'পাসওয়ার্ড সফলভাবে আপডেট করা হয়েছে এবং ডাটাবেজে সংরক্ষণ করা হয়েছে!');
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        fetchAccountInfo();
      } else {
        setErrorMessage(res.message || 'পাসওয়ার্ড আপডেট ব্যর্থ হয়েছে। বর্তমান পাসওয়ার্ড সঠিক কিনা পরীক্ষা করুন।');
      }
    } catch {
      setErrorMessage('পাসওয়ার্ড আপডেটের সময় সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const isPasswordLong = newPassword.length >= 6;
  const doPasswordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  return (
    <div className="w-full max-w-2xl mx-auto py-6 px-4 animate-in fade-in duration-300 space-y-6">
      
      {/* Header with Navigation Pills */}
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center text-white shadow-lg shadow-emerald-950/50 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                অ্যাডমিন অ্যাকাউন্ট ও নিরাপত্তা
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-emerald-950 text-emerald-400 border border-emerald-500/30">
                  Super Admin
                </span>
              </h1>
              <p className="text-xs text-slate-400 mt-0.5">
                ইউজারনেম, লগইন ইমেইল ও পাসওয়ার্ড নিরাপদে পরিচালনা করুন
              </p>
            </div>
          </div>

          {/* Sub-tab Navigation (My Account vs Security Settings) */}
          <div className="flex items-center p-1 bg-slate-950 border border-slate-800 rounded-2xl self-start sm:self-auto">
            <button
              id="subtab-my-account"
              type="button"
              onClick={() => {
                setActiveSubTab('my_account');
                clearMessages();
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSubTab === 'my_account'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>My Account</span>
            </button>

            <button
              id="subtab-security-settings"
              type="button"
              onClick={() => {
                setActiveSubTab('security_settings');
                clearMessages();
              }}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeSubTab === 'security_settings'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Security Settings</span>
            </button>
          </div>
        </div>

        {/* Success Alert */}
        {successMessage && (
          <div className="mt-4 p-3.5 rounded-2xl bg-emerald-950/80 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2.5 animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span className="font-medium leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* Error Alert */}
        {errorMessage && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-200 text-xs flex items-center gap-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span className="font-medium leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {/* TAB 1: MY ACCOUNT */}
        {activeSubTab === 'my_account' && (
          <div className="mt-6 space-y-6 animate-in fade-in">
            {/* Account Profile Card */}
            <div className="p-4 rounded-2xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-emerald-400 font-black text-base">
                  {accountData?.username ? accountData.username.charAt(0).toUpperCase() : 'A'}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">
                      {accountData?.username || 'অ্যাডমিন'}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-900/60 text-emerald-300 border border-emerald-700/50">
                      Verified Owner
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 block font-mono mt-0.5">
                    {accountData?.email || 'admin@jhadimadi.com'}
                  </span>
                </div>
              </div>

              <div className="text-left sm:text-right border-t sm:border-t-0 border-slate-800/80 pt-2 sm:pt-0 w-full sm:w-auto">
                <span className="text-[10px] text-slate-500 block uppercase tracking-wider font-semibold">
                  সর্বশেষ সফল লগইন
                </span>
                <span className="text-xs font-mono text-slate-300">
                  {accountData?.lastLoginTime 
                    ? new Date(accountData.lastLoginTime).toLocaleString('bn-BD')
                    : 'বর্তমান সেশন সক্রিয়'}
                </span>
              </div>
            </div>

            {/* Change Username Form */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/90 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <User className="w-4 h-4 text-emerald-400" />
                <span>ইউজারনেম পরিবর্তন (Change Username)</span>
              </div>
              <p className="text-xs text-slate-400">
                ইউনিক ইউজারনেম নির্ধারণ করুন। পরবর্তী সকল লগইনে এটি প্রযোজ্য হবে।
              </p>

              <form onSubmit={handleUpdateUsername} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    নতুন ইউজারনেম <span className="text-emerald-400">*</span>
                  </label>
                  <input
                    id="input-change-username"
                    type="text"
                    required
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    placeholder="যেমন: jhadimadi_owner"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    বর্তমান পাসওয়ার্ড (যাচাইয়ের জন্য আবশ্যক) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="input-username-current-password"
                      type={showUsernameCurrentPassword ? 'text' : 'password'}
                      required
                      value={usernameCurrentPassword}
                      onChange={(e) => setUsernameCurrentPassword(e.target.value)}
                      placeholder="বর্তমান পাসওয়ার্ড লিখুন"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowUsernameCurrentPassword(!showUsernameCurrentPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                    >
                      {showUsernameCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  id="btn-submit-change-username"
                  type="submit"
                  disabled={isUpdatingUsername || !newUsername.trim() || !usernameCurrentPassword}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isUpdatingUsername ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>আপডেট করা হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>ইউজারনেম আপডেট করুন</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Change Login Email Form */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/90 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Mail className="w-4 h-4 text-teal-400" />
                <span>লগইন ইমেইল পরিবর্তন (Change Login Email)</span>
              </div>
              <p className="text-xs text-slate-400">
                নিরাপদ যোগাযোগ এবং বিকল্প লগইন সনাক্তকরণের জন্য আপনার অনুমোদিত ইমেইল আপডেট করুন।
              </p>

              <form onSubmit={handleUpdateEmail} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    নতুন ইমেইল <span className="text-teal-400">*</span>
                  </label>
                  <input
                    id="input-change-email"
                    type="email"
                    required
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    placeholder="যেমন: owner@jhadimadi.com"
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    বর্তমান পাসওয়ার্ড (যাচাইয়ের জন্য আবশ্যক) <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="input-email-current-password"
                      type={showEmailCurrentPassword ? 'text' : 'password'}
                      required
                      value={emailCurrentPassword}
                      onChange={(e) => setEmailCurrentPassword(e.target.value)}
                      placeholder="বর্তমান পাসওয়ার্ড লিখুন"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowEmailCurrentPassword(!showEmailCurrentPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                    >
                      {showEmailCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <button
                  id="btn-submit-change-email"
                  type="submit"
                  disabled={isUpdatingEmail || !newEmail.trim() || !emailCurrentPassword}
                  className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isUpdatingEmail ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>আপডেট করা হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>ইমেইল আপডেট করুন</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TAB 2: SECURITY SETTINGS */}
        {activeSubTab === 'security_settings' && (
          <div className="mt-6 space-y-6 animate-in fade-in">
            {/* Change Password Form */}
            <div className="p-5 rounded-2xl bg-slate-950/60 border border-slate-800/90 space-y-4">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <KeyRound className="w-4 h-4 text-emerald-400" />
                <span>পাসওয়ার্ড পরিবর্তন (Change Password)</span>
              </div>
              <p className="text-xs text-slate-400">
                পাসওয়ার্ড পরিবর্তনের জন্য বর্তমান পাসওয়ার্ডের মাধ্যমে পরিচয় নিশ্চিত করা আবশ্যক। পাসওয়ার্ড পরিবর্তনের সাথে সাথেই অন্যান্য সকল সক্রিয় সেশন স্বয়ংক্রিয়ভাবে সমাপ্ত হবে।
              </p>

              <form onSubmit={handleUpdatePassword} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    বর্তমান পাসওয়ার্ড <span className="text-rose-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="input-pwd-current"
                      type={showCurrentPassword ? 'text' : 'password'}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="বর্তমান পাসওয়ার্ড লিখুন"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    নতুন পাসওয়ার্ড <span className="text-emerald-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="input-pwd-new"
                      type={showNewPassword ? 'text' : 'password'}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="নতুন পাসওয়ার্ড লিখুন (কমপক্ষে ৬ অক্ষর)"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-1">
                    পাসওয়ার্ড নিশ্চিতকরণ (Confirm Password) <span className="text-emerald-400">*</span>
                  </label>
                  <div className="relative">
                    <input
                      id="input-pwd-confirm"
                      type={showConfirmPassword ? 'text' : 'password'}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="নতুন পাসওয়ার্ড পুনরায় লিখুন"
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-xs placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 transition"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Validation Pills */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className={`p-2 rounded-xl border text-[11px] font-medium flex items-center gap-1.5 ${
                    isPasswordLong 
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>কমপক্ষে ৬ অক্ষর</span>
                  </div>
                  <div className={`p-2 rounded-xl border text-[11px] font-medium flex items-center gap-1.5 ${
                    doPasswordsMatch 
                      ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300' 
                      : 'bg-slate-900 border-slate-800 text-slate-500'
                  }`}>
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>পাসওয়ার্ড মিল রয়েছে</span>
                  </div>
                </div>

                {/* Submit Action */}
                <button
                  id="btn-submit-change-password"
                  type="submit"
                  disabled={isUpdatingPassword || !currentPassword || !isPasswordLong || !doPasswordsMatch}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-xs rounded-xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer mt-2"
                >
                  {isUpdatingPassword ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>আপডেট করা হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <KeyRound className="w-4 h-4" />
                      <span>পাসওয়ার্ড আপডেট করুন</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Security Audit Status Card */}
            <div className="p-4 rounded-2xl bg-slate-950/40 border border-slate-800/80 space-y-2.5 text-xs text-slate-400">
              <div className="flex items-center justify-between">
                <span>সর্বশেষ পাসওয়ার্ড পরিবর্তন:</span>
                <span className="font-mono text-slate-300">
                  {accountData?.lastPasswordChangeTime 
                    ? new Date(accountData.lastPasswordChangeTime).toLocaleString('bn-BD')
                    : 'প্রাথমিক সেটআপ সম্পন্ন'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span>নিরাপত্তা অ্যালগরিদম:</span>
                <span className="font-mono text-emerald-400">HMAC-SHA256 & Salted Scrypt</span>
              </div>
              <div className="flex items-center justify-between">
                <span>সক্রিয় সেশন সংখ্যা:</span>
                <span className="font-mono text-slate-300">{accountData?.sessions?.length || 1}টি ডিভাইস</span>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default AdminAccountSecurityTab;
