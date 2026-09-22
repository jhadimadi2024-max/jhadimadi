import React, { useState } from 'react';
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Heart
} from 'lucide-react';

import { Language, UserProfile } from '../types';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../supabase';
import { BrandLogo } from './BrandLogo';
import { generateDistrictUniqueId } from '../utils/uniqueIdGenerator';
import { BANGLADESH_GEO_DIRECTORY } from '../data/professionsMasterData';

export interface RegistrationFormProps {
  initialTab?: string;
  lockedRole?: string;
  isEditMode?: boolean;
  lang?: Language;
  onSuccess?: (user: UserProfile, extraData?: any) => void;
  onNavigateToSignIn?: () => void;
  onBack?: () => void;
  currentUser?: UserProfile | null;
  initialPhone?: string;
  onShowToast?: (msg: string) => void;
}

const BLOOD_GROUPS = [
  'A+',
  'A-',
  'B+',
  'B-',
  'O+',
  'O-',
  'AB+',
  'AB-'
] as const;

const ALL_BANGLADESH_DISTRICTS = Object.keys(BANGLADESH_GEO_DIRECTORY);

/* =========================================================
   DISTRICT → UPAZILA / THANA
========================================================= */

const getUpazilasForDistrict = (districtName: string): string[] => {
  if (!districtName) {
    return ['সদর'];
  }

  if (BANGLADESH_GEO_DIRECTORY[districtName]?.thanas) {
    return BANGLADESH_GEO_DIRECTORY[districtName].thanas;
  }

  return ['সদর', 'পৌর এলাকা'];
};

/* =========================================================
   PHONE NORMALIZATION
========================================================= */

const normalizeBangladeshPhone = (value: string): string => {
  let phone = value.trim();
  phone = phone.replace(/[\s\-()]/g, '');

  // +8801712345678 → 01712345678
  if (phone.startsWith('+880')) {
    phone = '0' + phone.substring(4);
  }
  // 8801712345678 → 01712345678
  else if (phone.startsWith('880')) {
    phone = '0' + phone.substring(3);
  }

  return phone;
};

/* =========================================================
   BANGLADESH MOBILE VALIDATION
========================================================= */

const isValidBangladeshPhone = (phone: string): boolean => {
  return /^01[3-9]\d{8}$/.test(phone);
};

/* =========================================================
   EMAIL NORMALIZATION
========================================================= */

const normalizeEmail = (email: string): string => {
  return email.trim().toLowerCase();
};

/* =========================================================
   NID NORMALIZATION
========================================================= */

const normalizeNID = (nid: string): string => {
  return nid.trim().replace(/\s+/g, '');
};

/* =========================================================
   BANGLADESH NID VALIDATION
========================================================= */

const validateBangladeshNID = (
  nid: string
): { valid: boolean; message?: string } => {
  const value = nid.trim();

  /* Only digits */
  if (!/^\d+$/.test(value)) {
    return {
      valid: false,
      message: 'NID নম্বরে শুধুমাত্র সংখ্যা ব্যবহার করুন।'
    };
  }

  /* Valid Bangladesh NID lengths */
  if (value.length !== 10 && value.length !== 13 && value.length !== 17) {
    return {
      valid: false,
      message: 'সঠিক NID নম্বর দিন। NID অবশ্যই ১০, ১৩ অথবা ১৭ ডিজিটের হতে হবে।'
    };
  }

  /* Reject 0000000000 / 1111111111 etc. */
  if (/^(\d)\1+$/.test(value)) {
    return {
      valid: false,
      message: 'এটি একটি বৈধ NID নম্বরের মতো দেখাচ্ছে না। প্রকৃত NID নম্বর দিন।'
    };
  }

  /* Reject obvious dummy/test numbers */
  const invalidDummyNIDs = [
    '1234567890',
    '1234567890123',
    '12345678901234567',
    '0123456789',
    '0123456789012',
    '01234567890123456',
    '9876543210',
    '9876543210987',
    '98765432109876543'
  ];

  if (invalidDummyNIDs.includes(value)) {
    return {
      valid: false,
      message: 'অনুগ্রহ করে প্রকৃত NID নম্বর প্রদান করুন।'
    };
  }

  return { valid: true };
};

/* =========================================================
   COMMON DUPLICATE MESSAGE
========================================================= */

const DUPLICATE_MESSAGE =
  'আপনার এই NID নম্বর, মোবাইল নম্বর অথবা ই-মেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট নিবন্ধিত হয়েছে। অনুগ্রহ করে অন্য তথ্য ব্যবহার করুন।';

/* =========================================================
   REGISTRATION FORM
========================================================= */

export const RegistrationForm: React.FC<RegistrationFormProps> = ({
  initialTab = 'seller',
  lockedRole,
  isEditMode = false,
  lang = 'bn',
  onSuccess,
  onNavigateToSignIn,
  onBack,
  currentUser,
  initialPhone,
  onShowToast
}) => {
  const { login } = useAuth();

  /* =======================================================
     FORM STATES
  ======================================================= */

  const [fullName, setFullName] = useState(
    currentUser?.fullName || currentUser?.name || ''
  );

  const [phone, setPhone] = useState(
    initialPhone || currentUser?.phone || ''
  );

  const [email, setEmail] = useState((currentUser as any)?.email || '');

  const [nid, setNid] = useState(
    (currentUser as any)?.nid || (currentUser as any)?.nidNumber || ''
  );

  const [district, setDistrict] = useState(
    currentUser?.district || 'খাগড়াছড়ি'
  );

  const [upazila, setUpazila] = useState(
    currentUser?.upazila || 'খাগড়াছড়ি সদর'
  );

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [bloodGroup, setBloodGroup] = useState<string>(
    currentUser?.bloodGroup || 'O+'
  );

  /* =======================================================
     UI STATES
  ======================================================= */

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [nidError, setNidError] = useState('');

  const [successToast, setSuccessToast] = useState<{
    message: string;
    subText?: string;
  } | null>(null);

  /* =======================================================
     CLEAR ALL ERRORS
  ======================================================= */

  const clearErrors = () => {
    setErrorMsg('');
    setPhoneError('');
    setEmailError('');
    setNidError('');
    setSuccessToast(null);
  };

  /* =======================================================
     MAIN SUBMIT FUNCTION
  ======================================================= */

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isSubmitting) return;

    clearErrors();

    const cleanName = fullName.trim();
    const cleanPhone = normalizeBangladeshPhone(phone);
    const cleanEmail = normalizeEmail(email);
    const cleanNid = normalizeNID(nid);

    /* Validations */
    if (!cleanName) {
      setErrorMsg('অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন।');
      return;
    }

    if (!isValidBangladeshPhone(cleanPhone)) {
      setPhoneError('সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন।');
      setErrorMsg('অনুগ্রহ করে সঠিক মোবাইল নম্বর প্রদান করুন।');
      return;
    }

    if (!cleanEmail) {
      setEmailError('ই-মেইল ঠিকানা প্রদান করুন।');
      setErrorMsg('অনুগ্রহ করে আপনার ই-মেইল ঠিকানা দিন।');
      return;
    }

    const emailIsValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail);
    if (!emailIsValid) {
      setEmailError('সঠিক ই-মেইল ঠিকানা প্রদান করুন।');
      setErrorMsg('ই-মেইল ঠিকানাটি সঠিক নয়।');
      return;
    }

    const nidValidation = validateBangladeshNID(cleanNid);
    if (!nidValidation.valid) {
      setNidError(nidValidation.message || 'সঠিক NID নম্বর প্রদান করুন।');
      setErrorMsg(nidValidation.message || 'সঠিক NID নম্বর প্রদান করুন।');
      return;
    }

    if (!isEditMode) {
      if (!password.trim() || password.trim().length < 6) {
        setErrorMsg('পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে।');
        return;
      }

      if (password !== confirmPassword) {
        setErrorMsg('পাসওয়ার্ড এবং কনফার্ম পাসওয়ার্ড মিলছে না।');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      /* Duplicate Check for New Registration */
      if (!isEditMode) {
        const { data: existingDonors, error: duplicateCheckError } =
          await supabase
            .from('blood_donors')
            .select('phone, email, nid')
            .or(`phone.eq.${cleanPhone},email.eq.${cleanEmail},nid.eq.${cleanNid}`);

        if (duplicateCheckError) {
          console.error('Duplicate check error:', duplicateCheckError);
          throw new Error('DUPLICATE_CHECK_FAILED');
        }

        if (existingDonors && existingDonors.length > 0) {
          const matched = existingDonors[0];

          if (matched.phone === cleanPhone) {
            const phoneMsg = 'এই মোবাইল নম্বরটি ইতিমধ্যে রেজিস্ট্রেশন করা হয়েছে।';
            setPhoneError(phoneMsg);
            setErrorMsg(`⚠️ ${phoneMsg}`);
            return;
          }

          if (matched.email?.toLowerCase() === cleanEmail) {
            const emailMsg = 'এই ই-মেইলটি ইতিমধ্যে রেজিস্ট্রেশন করা হয়েছে।';
            setEmailError(emailMsg);
            setErrorMsg(`⚠️ ${emailMsg}`);
            return;
          }

          if (matched.nid === cleanNid) {
            const nidMsg = 'এই NID নম্বরটি ইতিমধ্যে রেজিস্ট্রেশন করা হয়েছে।';
            setNidError(nidMsg);
            setErrorMsg(`⚠️ ${nidMsg}`);
            return;
          }

          setPhoneError(DUPLICATE_MESSAGE);
          setErrorMsg(`⚠️ ${DUPLICATE_MESSAGE}`);
          return;
        }
      }

      const generatedUID = generateDistrictUniqueId(district);

      const insertData: any = {
        name: cleanName,
        phone: cleanPhone,
        email: cleanEmail,
        nid: cleanNid,
        blood_group: bloodGroup,
        district: district,
        upazila: upazila,
        pass_word:
          password.trim() || (currentUser as any)?.password || null,
        member_uid: generatedUID,
        created_at: new Date().toISOString()
      };

      const { data: insertedData, error: insertError } = await supabase
        .from('blood_donors')
        .insert([insertData])
        .select()
        .single();

      if (insertError) {
        console.error('Registration insert error:', insertError);
        const errorCode = (insertError as any)?.code;
        const errorMessage = (insertError.message || '').toLowerCase();

        if (
          errorCode === '23505' ||
          errorMessage.includes('duplicate') ||
          errorMessage.includes('unique')
        ) {
          setPhoneError(DUPLICATE_MESSAGE);
          setEmailError(DUPLICATE_MESSAGE);
          setNidError(DUPLICATE_MESSAGE);
          setErrorMsg(`⚠️ ${DUPLICATE_MESSAGE}`);
          return;
        }

        setErrorMsg(
          'রেজিস্ট্রেশন সংরক্ষণ করা যায়নি। অনুগ্রহ করে কিছুক্ষণ পরে আবার চেষ্টা করুন।'
        );
        return;
      }

      const userId =
        currentUser?.id || insertedData?.id || `user_${Date.now()}`;

      const newProfile: UserProfile = {
        id: userId,
        uid: userId,
        name: cleanName,
        fullName: cleanName,
        phone: cleanPhone,
        password:
          password.trim() || (currentUser as any)?.password || '',
        district: district,
        upazila: upazila,
        division: 'চট্টগ্রাম',
        mahalla: `${upazila} এলাকা`,
        detailedAddress: `${upazila}, ${district}`,
        role: 'blood_donor',
        memberType: 'blood_donor',
        profession: 'রক্তদাতা',
        memberUID: generatedUID,
        isBloodDonor: true,
        bloodGroup: bloodGroup,
        createdAt:
          currentUser?.createdAt || new Date().toISOString().split('T')[0],
        ...({
          email: cleanEmail,
          nid: cleanNid
        } as any)
      };

      setSuccessToast({
        message: '🎉 সফলভাবে রক্তদাতা হিসেবে নিবন্ধন সম্পন্ন হয়েছে!',
        subText: `আপনার আইডি: ${generatedUID}`
      });

      login(newProfile, true);

      if (onShowToast) {
        onShowToast('রেজিস্ট্রেশন সফল হয়েছে।');
      }

      if (onSuccess) {
        onSuccess(newProfile, {
          email: cleanEmail,
          nid: cleanNid,
          memberUID: generatedUID
        });
      }
    } catch (err: any) {
      console.error('[Registration Error]:', err);
      if (err?.message === 'DUPLICATE_CHECK_FAILED') {
        setErrorMsg('ডুপ্লিকেট চেক করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন।');
      } else {
        setErrorMsg('রেজিস্ট্রেশন সম্পন্ন করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="min-h-screen bg-slate-50 py-6 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl mx-auto space-y-6">
        {/* HEADER */}
        <div className="flex items-center justify-between">
          {onBack && (
            <button
              onClick={onBack}
              type="button"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-950 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="font-medium text-sm">পিছনে যান</span>
            </button>
          )}
          <BrandLogo />
        </div>

        {/* ERROR */}
        {errorMsg && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-2xl flex items-start gap-3 text-red-700 text-sm shadow-sm">
            <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
            <span className="font-bold">{errorMsg}</span>
          </div>
        )}

        {/* SUCCESS */}
        {successToast && (
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-start gap-3 text-emerald-800 text-sm">
            <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
            <div>
              <p className="font-bold">{successToast.message}</p>
              {successToast.subText && (
                <p className="text-xs text-emerald-600 mt-1">
                  {successToast.subText}
                </p>
              )}
            </div>
          </div>
        )}

        {/* FORM CARD */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              রক্তদাতা রেজিস্ট্রেশন
            </h3>

            {/* FULL NAME */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                পূর্ণ নাম *
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  setErrorMsg('');
                }}
                placeholder="আপনার পূর্ণ নাম"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
              />
            </div>

            {/* BLOOD GROUP */}
            <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-2.5">
              <label className="text-xs sm:text-sm font-bold text-gray-900 flex items-center gap-2">
                <Heart className="w-4 h-4 fill-rose-500/30 text-rose-600" />
                <span>রক্তের গ্রুপ নির্বাচন করুন *</span>
              </label>
              <div className="grid grid-cols-4 gap-1.5 pt-1">
                {BLOOD_GROUPS.map((bg) => (
                  <button
                    key={bg}
                    type="button"
                    onClick={() => setBloodGroup(bg)}
                    className={`py-2 rounded-xl text-xs font-black border ${
                      bloodGroup === bg
                        ? 'bg-rose-600 text-white border-rose-600 shadow-md'
                        : 'bg-white text-gray-800 border-rose-200 hover:bg-rose-50'
                    }`}
                  >
                    {bg}
                  </button>
                ))}
              </div>
            </div>

            {/* PHONE */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                মোবাইল নম্বর *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  setPhoneError('');
                  setErrorMsg('');
                }}
                placeholder="01XXXXXXXXX"
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                  phoneError
                    ? 'border-red-500 bg-red-50/50 focus:ring-red-500 text-red-900'
                    : 'border-gray-200 focus:ring-emerald-500'
                }`}
              />
              {phoneError && (
                <p className="mt-1.5 text-xs font-bold text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {phoneError}
                </p>
              )}
            </div>

            {/* EMAIL */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                ই-মেইল *
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  setEmailError('');
                  setErrorMsg('');
                }}
                placeholder="example@gmail.com"
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                  emailError
                    ? 'border-red-500 bg-red-50/50 focus:ring-red-500 text-red-900'
                    : 'border-gray-200 focus:ring-emerald-500'
                }`}
              />
              {emailError && (
                <p className="mt-1.5 text-xs font-bold text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {emailError}
                </p>
              )}
            </div>

            {/* NID */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                জাতীয় পরিচয়পত্র (NID) নম্বর *
              </label>
              <input
                type="text"
                inputMode="numeric"
                required
                maxLength={17}
                value={nid}
                onChange={(e) => {
                  const value = e.target.value.replace(/\D/g, '');
                  setNid(value);
                  setNidError('');
                  setErrorMsg('');
                }}
                placeholder="NID নম্বর"
                className={`w-full px-4 py-3 rounded-xl border text-sm focus:outline-none focus:ring-2 ${
                  nidError
                    ? 'border-red-500 bg-red-50/50 focus:ring-red-500 text-red-900'
                    : 'border-gray-200 focus:ring-emerald-500'
                }`}
              />
              <p className="mt-1 text-[11px] text-gray-500">
                ১০, ১৩ অথবা ১৭ ডিজিটের NID নম্বর প্রদান করুন।
              </p>
              {nidError && (
                <p className="mt-1.5 text-xs font-bold text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {nidError}
                </p>
              )}
            </div>

            {/* DISTRICT + UPAZILA */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  জেলা *
                </label>
                <select
                  value={district}
                  onChange={(e) => {
                    const newDistrict = e.target.value;
                    setDistrict(newDistrict);
                    const upazilas = getUpazilasForDistrict(newDistrict);
                    if (upazilas.length > 0) {
                      setUpazila(upazilas[0]);
                    }
                  }}
                  className="w-full px-3 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                >
                  {ALL_BANGLADESH_DISTRICTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  উপজেলা / থানা *
                </label>
                <select
                  value={upazila}
                  onChange={(e) => setUpazila(e.target.value)}
                  className="w-full px-3 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                >
                  {getUpazilasForDistrict(district).map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* PASSWORD */}
            {!isEditMode && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    পাসওয়ার্ড *
                  </label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="******"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    কনফার্ম পাসওয়ার্ড *
                  </label>
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="******"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm"
                  />
                </div>
              </div>
            )}

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3.5 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 ${
                isSubmitting
                  ? 'bg-rose-400 cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-700'
              }`}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>যাচাই করা হচ্ছে...</span>
                </>
              ) : (
                'রক্তদাতা হিসেবে যুক্ত হন'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};