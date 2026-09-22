import React, { useState, useEffect } from 'react';
import {
  Lock,
  KeyRound,
  User,
  Eye,
  EyeOff,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Database,
} from 'lucide-react';
import { adminSecurityService, AdminSession } from '../../services/adminSecurityService';

interface AdminCredentialsUpdateCardProps {
  onSuccess?: (newUsername?: string) => void;
  className?: string;
}

export const AdminCredentialsUpdateCard: React.FC<AdminCredentialsUpdateCardProps> = ({
  onSuccess,
  className = '',
}) => {
  // Form input states
  const [currentPassword, setCurrentPassword] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // Password visibility toggles
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  // Status & loading states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  // Current session info
  const [adminSession, setAdminSession] = useState<AdminSession | null>(null);

  // Fetch current session and pre-fill username
  useEffect(() => {
    const loadSession = async () => {
      try {
        const session = await adminSecurityService.getCurrentAdminSession();
        if (session) {
          setAdminSession(session);
          if (session.username) {
            setNewUsername(session.username);
          }
        }
      } catch (err) {
        console.warn('Failed to load admin session for credentials card:', err);
      }
    };
    loadSession();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMessage(null);

    // Validation
    const cleanCurrent = currentPassword.trim();
    const cleanNewPass = newPassword.trim();
    const cleanUsername = newUsername.trim();

    if (!cleanCurrent) {
      setStatusMessage({
        type: 'error',
        text: 'পুরাতন পাসওয়ার্ড প্রদান করা আবশ্যক।',
      });
      return;
    }

    if (!cleanNewPass) {
      setStatusMessage({
        type: 'error',
        text: 'নতুন পাসওয়ার্ড প্রদান করা আবশ্যক।',
      });
      return;
    }

    if (cleanNewPass.length < 6) {
      setStatusMessage({
        type: 'error',
        text: 'নতুন পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।',
      });
      return;
    }

    if (cleanNewPass === cleanCurrent) {
      setStatusMessage({
        type: 'error',
        text: 'নতুন পাসওয়ার্ডটি পুরাতন পাসওয়ার্ডের চেয়ে ভিন্ন হতে হবে।',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await adminSecurityService.updateCredentials({
        currentPassword: cleanCurrent,
        newUsername: cleanUsername || undefined,
        newEmailOrUsername: cleanUsername || undefined,
        newPassword: cleanNewPass,
      });

      if (response && response.success) {
        setStatusMessage({
          type: 'success',
          text: response.message || 'পাসওয়ার্ড এবং ইউজারনেম সফলভাবে পরিবর্তন ও ডাটাবেজে সংরক্ষণ করা হয়েছে!',
        });

        // Reset passwords but keep updated username
        setCurrentPassword('');
        setNewPassword('');

        if (response.username) {
          setNewUsername(response.username);
          if (adminSession) {
            setAdminSession({ ...adminSession, username: response.username });
          }
        }

        if (onSuccess) {
          onSuccess(response.username || cleanUsername);
        }
      } else {
        setStatusMessage({
          type: 'error',
          text: response.message || 'পাসওয়ার্ড পরিবর্তন ব্যর্থ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।',
        });
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err?.message || 'সার্ভার বা ডাটাবেজে সংযোগে ত্রুটি হয়েছে। অনুগ্রহ করে ইন্টারনেট সংযোগ চেক করুন।',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="admin-credentials-update-card"
      className={`bg-slate-900 text-white p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-2xl space-y-6 ${className}`}
    >
      {/* Card Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800/80 pb-5">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-cyan-600 flex items-center justify-center text-white shadow-lg shadow-emerald-950/60 shrink-0">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-black text-white tracking-tight">
                অ্যাডমিন ক্রেডেনশিয়াল আপডেট
              </h2>
              <span className="hidden sm:inline-flex items-center gap-1 bg-emerald-500/15 text-emerald-300 text-[10px] font-bold px-2.5 py-0.5 rounded-full border border-emerald-500/30">
                <Database className="w-3 h-3 text-emerald-400" />
                Supabase & DB Sync
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              পুরাতন পাসওয়ার্ড যাচাই করে নতুন ইউজারনেম ও পাসওয়ার্ড ডাটাবেজে নিরাপদে পরিবর্তন করুন
            </p>
          </div>
        </div>

        {adminSession && (
          <div className="flex items-center gap-2 text-[11px] text-slate-300 bg-slate-950/80 px-3.5 py-2 rounded-xl border border-slate-800 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <div className="flex flex-col">
              <span className="text-[10px] text-slate-500 uppercase tracking-wider">বর্তমান অ্যাডমিন</span>
              <span className="font-bold text-white">
                {adminSession.username || 'admin'} ({adminSession.email})
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Feedback Messages (Success / Error) */}
      {statusMessage && (
        <div
          id="credentials-status-alert"
          className={`p-4 rounded-2xl border flex items-start gap-3 text-xs font-semibold animate-in fade-in duration-200 ${
            statusMessage.type === 'success'
              ? 'bg-emerald-950/70 border-emerald-500/50 text-emerald-200'
              : 'bg-rose-950/70 border-rose-500/50 text-rose-200'
          }`}
        >
          {statusMessage.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="leading-relaxed">{statusMessage.text}</p>
          </div>
        </div>
      )}

      {/* Clean Rebuilt Form */}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Field 1: Current Password (পুরাতন পাসওয়ার্ড) */}
          <div className="space-y-2">
            <label
              htmlFor="input-current-password"
              className="text-xs font-bold text-slate-300 flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
                পুরাতন পাসওয়ার্ড <span className="text-rose-400">*</span>
              </span>
              <span className="text-[10px] text-slate-500 font-normal">নিরাপত্তা যাচাই</span>
            </label>
            <div className="relative">
              <input
                id="input-current-password"
                type={showCurrentPassword ? 'text' : 'password'}
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                placeholder="আপনার বর্তমান পুরাতন পাসওয়ার্ড দিন"
                autoComplete="current-password"
                className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-semibold placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
              <button
                type="button"
                id="btn-toggle-show-current-pass"
                onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer transition"
                title={showCurrentPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
              >
                {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-[11px] text-slate-500">
              ডাটাবেজে সংরক্ষিত পুরাতন পাসওয়ার্ড যাচাইয়ের জন্য প্রদান করুন
            </p>
          </div>

          {/* Field 2: New Username (নতুন ইউজারনেম - optional/editable) */}
          <div className="space-y-2">
            <label
              htmlFor="input-new-username"
              className="text-xs font-bold text-slate-300 flex items-center justify-between"
            >
              <span className="flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-cyan-400" />
                নতুন ইউজারনেম
              </span>
              <span className="text-[10px] text-emerald-400 font-normal">ঐচ্ছিক / পরিবর্তনযোগ্য</span>
            </label>
            <div className="relative">
              <input
                id="input-new-username"
                type="text"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="নতুন ইউজারনেম (যেমন: admin, owner_admin)"
                autoComplete="username"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-semibold placeholder:text-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition"
              />
            </div>
            <p className="text-[11px] text-slate-500">
              বর্তমান ইউজারনেম রাখতে পারেন অথবা নতুন ইউজারনেম লিখে পরিবর্তন করতে পারেন
            </p>
          </div>
        </div>

        {/* Field 3: New Password (নতুন পাসওয়ার্ড) */}
        <div className="space-y-2">
          <label
            htmlFor="input-new-password"
            className="text-xs font-bold text-slate-300 flex items-center justify-between"
          >
            <span className="flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-teal-400" />
              নতুন পাসওয়ার্ড <span className="text-rose-400">*</span>
            </span>
            <span className="text-[10px] text-slate-500 font-normal">কমপক্ষে ৬ অক্ষর</span>
          </label>
          <div className="relative">
            <input
              id="input-new-password"
              type={showNewPassword ? 'text' : 'password'}
              required
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="কমপক্ষে ৬ অক্ষরের শক্তিশালী নতুন পাসওয়ার্ড লিখুন"
              autoComplete="new-password"
              className="w-full pl-3.5 pr-10 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-white text-xs font-semibold placeholder:text-slate-600 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 transition"
            />
            <button
              type="button"
              id="btn-toggle-show-new-pass"
              onClick={() => setShowNewPassword(!showNewPassword)}
              className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 cursor-pointer transition"
              title={showNewPassword ? 'পাসওয়ার্ড লুকান' : 'পাসওয়ার্ড দেখুন'}
            >
              {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[11px] text-slate-500">
            নতুন পাসওয়ার্ডটি শক্তিশালী scrypt/bcrypt অ্যালগরিদমে এনক্রিপ্ট হয়ে সুরক্ষিতভাবে ডাটাবেজে আপডেট হবে
          </p>
        </div>

        {/* Submit Button (পাসওয়ার্ড পরিবর্তন করুন) */}
        <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>সফল পরিবর্তনের পর নতুন পাসওয়ার্ড দিয়ে ভবিষ্যতে লগইন করতে হবে।</span>
          </div>

          <button
            id="btn-submit-change-credentials"
            type="submit"
            disabled={isSubmitting || !currentPassword.trim() || !newPassword.trim()}
            className="w-full sm:w-auto px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 active:scale-95 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-emerald-950/60 transition flex items-center justify-center gap-2 cursor-pointer"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
                <span>যাচাই ও সংরক্ষণ হচ্ছে...</span>
              </>
            ) : (
              <>
                <KeyRound className="w-4 h-4 text-white" />
                <span>পাসওয়ার্ড পরিবর্তন করুন</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
