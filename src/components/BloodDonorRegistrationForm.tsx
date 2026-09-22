import React, { useState, useMemo } from 'react';
import {
  Heart,
  Droplet,
  User,
  Phone,
  MapPin,
  Calendar,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Copy,
  Check,
  ArrowRight,
  Info,
  Loader2,
  Lock,
  Eye,
  EyeOff,
  Briefcase,
  MessageSquare,
  Mail
} from 'lucide-react';
import { LOCATION_MASTER, DivisionItem, DistrictItem, UpazilaItem } from '../data/locationMaster';
import { databaseService } from '../services/databaseService';
import { useData } from '../context/DataContext';
import { supabase, isSupabaseConfigured } from '../supabase';
import { generateDistrictUniqueId } from '../utils/uniqueIdGenerator';
import { generateSearchTags } from '../utils/aiTagGenerator';
import { registerUnifiedEntity } from '../services/unifiedRegistrationService';

export interface BloodDonorRegistrationFormProps {
  lang?: 'bn' | 'en';
  onSuccess?: (donor: any) => void;
  onCancel?: () => void;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'] as const;

/* =========================================================
   BANGLADESH MOBILE NUMBER NORMALIZATION & OPERATOR VALIDATION
   Operators:
   - Grameenphone: 017, 013
   - Banglalink: 019, 014
   - Robi: 018
   - Airtel: 016
   - Teletalk: 015
========================================================= */
const normalizeBangladeshPhone = (value: string): string => {
  let phone = value.trim().replace(/[\s\-()]/g, '');
  if (phone.startsWith('+880')) {
    phone = '0' + phone.substring(4);
  } else if (phone.startsWith('880')) {
    phone = '0' + phone.substring(3);
  }
  return phone;
};

const isValidBangladeshPhone = (phone: string): boolean => {
  // Must match 11 digits starting with 013, 014, 015, 016, 017, 018, 019
  return /^01[3-9]\d{8}$/.test(phone);
};

export const BloodDonorRegistrationForm: React.FC<BloodDonorRegistrationFormProps> = ({
  lang = 'bn',
  onSuccess,
  onCancel,
}) => {
  const { addBloodDonor } = useData();

  // Form Field States
  const [fullName, setFullName] = useState('');
  const [bloodGroup, setBloodGroup] = useState<string>('O+');
  const [phone, setPhone] = useState('');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [email, setEmail] = useState('');
  const [latitude, setLatitude] = useState<number>(0);
  const [longitude, setLongitude] = useState<number>(0);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [profession, setProfession] = useState('রক্তদাতা');
  const [division, setDivision] = useState('চট্টগ্রাম');
  const [district, setDistrict] = useState('খাগড়াছড়ি');
  const [upazila, setUpazila] = useState('খাগড়াছড়ি সদর');
  const [area, setArea] = useState('');
  const [lastDonationDate, setLastDonationDate] = useState('');
  const [isAvailable, setIsAvailable] = useState(true);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // UI States
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [submittedDonor, setSubmittedDonor] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState(false);

  // Cascading Location Logic
  const divisions = useMemo(() => LOCATION_MASTER, []);

  const currentDivisionObj = useMemo(() => {
    return divisions.find(
      (d) => d.nameBn === division || d.nameEn.toLowerCase() === division.toLowerCase()
    ) || divisions[0];
  }, [divisions, division]);

  const districts = useMemo(() => {
    return currentDivisionObj.districts;
  }, [currentDivisionObj]);

  const currentDistrictObj = useMemo(() => {
    return districts.find(
      (d) => d.nameBn === district || d.nameEn.toLowerCase() === district.toLowerCase()
    ) || districts[0] || { nameBn: district, nameEn: district, upazilas: [] };
  }, [districts, district]);

  const upazilas = useMemo(() => {
    return currentDistrictObj.upazilas || [];
  }, [currentDistrictObj]);

  const handleDivisionChange = (newDiv: string) => {
    setDivision(newDiv);
    const divObj = divisions.find((d) => d.nameBn === newDiv || d.nameEn === newDiv) || divisions[0];
    const firstDist = divObj.districts[0];
    if (firstDist) {
      setDistrict(firstDist.nameBn);
      const firstUpz = firstDist.upazilas[0];
      setUpazila(firstUpz ? firstUpz.nameBn : 'সদর');
    }
  };

  const handleDistrictChange = (newDist: string) => {
    setDistrict(newDist);
    const distObj = districts.find((d) => d.nameBn === newDist || d.nameEn === newDist);
    if (distObj && distObj.upazilas.length > 0) {
      setUpazila(distObj.upazilas[0].nameBn);
    } else {
      setUpazila('সদর');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    // 1. Validation for Name
    const trimmedName = fullName.trim();
    if (!trimmedName || trimmedName.length < 2) {
      setErrorMsg(lang === 'bn' ? 'দয়া করে রক্তদাতার সঠিক পূর্ণ নাম লিখুন।' : 'Please enter donor full name.');
      return;
    }

    // 2. Validation for Phone Number (Operator Prefix Check)
    const cleanPhone = normalizeBangladeshPhone(phone);
    if (!isValidBangladeshPhone(cleanPhone)) {
      setErrorMsg(
        lang === 'bn'
          ? '⚠️ সঠিক ১১ ডিজিটের বাংলাদেশি মোবাইল নম্বর দিন (যেমন: গ্রামীণফোন 017/013, রবি 018, বাংলালিংক 019/014, এয়ারটেল 016, টেলিটক 015)।'
          : 'Please enter a valid 11-digit Bangladeshi mobile number with correct operator prefix.'
      );
      return;
    }

    if (!bloodGroup) {
      setErrorMsg(lang === 'bn' ? 'রক্তের গ্রুপ নির্বাচন করুন।' : 'Please select blood group.');
      return;
    }

    if (!district || !upazila) {
      setErrorMsg(lang === 'bn' ? 'জেলা ও উপজেলা নির্বাচন করুন।' : 'Please select district and upazila.');
      return;
    }

    if (!agreeTerms) {
      setErrorMsg(lang === 'bn' ? 'মানবিক অঙ্গীকার ও শর্তাবলীতে সম্মতি প্রদান করুন।' : 'Please accept terms.');
      return;
    }

    if (!password || password.trim().length < 4) {
      setErrorMsg(lang === 'bn' ? 'অ্যাকাউন্ট সুরক্ষার জন্য কমপক্ষে ৪ অক্ষরের পাসওয়ার্ড দিন।' : 'Password must be at least 4 characters.');
      return;
    }

    setIsSubmitting(true);

    try {
      /* ===================================================
         DUPLICATE CHECK IN SUPABASE (PREVENTS DOUBLE REGISTRATION)
      =================================================== */
      const { data: existingDonors, error: duplicateErr } = await supabase
        .from('blood_donors')
        .select('phone')
        .eq('phone', cleanPhone);

      if (!duplicateErr && existingDonors && existingDonors.length > 0) {
        setIsSubmitting(false);
        const dupMsg = 'এই ফোন নম্বরটি দিয়ে পূর্বেই রেজিস্ট্রেশন করা হয়েছে।';
        
        setErrorMsg(dupMsg);
        alert(dupMsg); // Popup alert as requested
        return;
      }

      // Prepare exact formData object
      const formData = {
        fullName: trimmedName,
        phoneNumber: cleanPhone,
        whatsappNumber: whatsappNumber.trim() ? normalizeBangladeshPhone(whatsappNumber) : cleanPhone,
        email: email.trim() || null,
        bloodGroup: bloodGroup,
        district: district,
        upazila: upazila,
        latitude: latitude || 0,
        longitude: longitude || 0,
        consent_given: true
      };

      console.log("Supabase Blood Donor Payload:", formData);

      // Direct Supabase insert with strict debugging as requested
      const { data, error } = await supabase
        .from('blood_donors')
        .insert([{
          full_name: formData.fullName,
          phone_number: formData.phoneNumber,
          whatsapp_number: formData.whatsappNumber,
          email: formData.email || null,
          blood_group: formData.bloodGroup,
          district: formData.district,
          upazila: formData.upazila,
          latitude: formData.latitude || 0,
          longitude: formData.longitude || 0,
          consent_given: true
        }]);

      if (error) {
        console.error("SUPABASE INSERTION ERROR:", error);
        alert("ডাটাবেসে তথ্য সেভ হতে ব্যর্থ হয়েছে: " + error.message);
        setErrorMsg("ডাটাবেসে তথ্য সেভ হতে ব্যর্থ হয়েছে: " + error.message);
        setIsSubmitting(false);
        return;
      } else {
        alert("রক্তদাতা সফলভাবে নিবন্ধিত হয়েছেন!");
      }

      // Generate standard District Unique ID
      const generatedUid = generateDistrictUniqueId(district);
      const donorId = `bld_${Date.now()}`;

      const donorPayload: any = {
        id: donorId,
        districtUniqueId: generatedUid,
        name: trimmedName,
        bloodGroup: bloodGroup,
        phone: cleanPhone,
        phoneNumber: cleanPhone,
        whatsappNumber: formData.whatsappNumber,
        email: formData.email,
        password: password.trim(),
        profession: profession.trim() || 'রক্তদাতা',
        division: division,
        district: district,
        upazila: upazila,
        area: area.trim() || 'সদর এলাকা',
        lastDonationDate: lastDonationDate || '',
        totalDonations: 1,
        isAvailable: isAvailable,
        available: isAvailable,
        verified: true,
        createdAt: new Date().toISOString(),
      };

      // 1. Unified 2-Step Registration Flow (Supabase Auth -> blood_donors table insertion)
      try {
        const unifiedResult = await registerUnifiedEntity({
          role: 'blood_donor',
          fullName: trimmedName,
          phone: cleanPhone,
          password: password.trim(),
          division,
          district,
          upazila,
          area: area.trim() || 'সদর এলাকা',
          bloodGroup,
          rolePayload: {
            bloodGroup,
            profession: profession.trim() || 'রক্তদাতা',
            lastDonationDate: lastDonationDate || '',
            totalDonations: 1,
            isAvailable,
          },
        });

        if (unifiedResult.uniqueId) {
          donorPayload.districtUniqueId = unifiedResult.uniqueId;
        }
        if (unifiedResult.user) {
          donorPayload.id = unifiedResult.user.id;
        }
      } catch (uniErr) {
        console.warn('[BloodDonor] Unified service note:', uniErr);
      }

      // 2. Save to database service with full payload
      try {
        await databaseService.saveBloodDonorToDatabase(donorPayload);
      } catch (dbErr) {
        console.warn('[BloodDonor] Database service save note:', dbErr);
      }

      // 3. Save to DataContext (offline-first & sync)
      try {
        addBloodDonor(donorPayload);
      } catch (ctxErr: any) {
        console.error('[BloodDonor] Context add error:', ctxErr?.message || ctxErr);
      }

      // 4. Post to server backend for AI knowledge sync & file sync
      try {
        await fetch('/api/blood-donors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(donorPayload),
        });
      } catch (srvErr: any) {
        console.error('[BloodDonor] Server sync error:', srvErr?.message || srvErr);
      }

      setSubmittedDonor(donorPayload);
      if (onSuccess) {
        onSuccess(donorPayload);
      }
    } catch (err: any) {
      console.error('[BloodDonorRegistration] Error submitting:', err);
      setErrorMsg(err?.message || (lang === 'bn' ? 'রেজিস্ট্রেশনে ত্রুটি হয়েছে, পুনরায় চেষ্টা করুন।' : 'Registration failed.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyId = () => {
    if (submittedDonor?.districtUniqueId) {
      navigator.clipboard.writeText(submittedDonor.districtUniqueId);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  // ==========================================
  // SUCCESS STATE SCREEN
  // ==========================================
  if (submittedDonor) {
    return (
      <div className="bg-white rounded-2xl border-2 border-rose-200 p-5 sm:p-7 shadow-sm text-center space-y-5 animate-in fade-in zoom-in-95 duration-200" id="blood-donor-success-view">
        <div className="w-16 h-16 bg-rose-50 border-2 border-rose-200 text-rose-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
          <Heart className="w-8 h-8 fill-rose-500 text-rose-600 animate-pulse" />
        </div>

        <div className="space-y-1">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-black">
            <Sparkles className="w-3.5 h-3.5 text-rose-600" />
            {lang === 'bn' ? 'রক্তদাতা হিসেবে নিবন্ধন সম্পন্ন' : 'Blood Donor Registered'}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight pt-1">
            {lang === 'bn' ? 'মানবতার সেবায় এগিয়ে আসার জন্য ধন্যবাদ!' : 'Thank you for stepping up to save lives!'}
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 max-w-md mx-auto">
            {lang === 'bn'
              ? 'আপনার রক্তদাতা প্রোফাইলটি ঝাদিমাদি জরুরি নেটওয়ার্ক ও এআই সার্চ ডিরেক্টরিতে সক্রিয় করা হয়েছে।'
              : 'Your donor profile is now active in the Jhadimadi Emergency Network and AI Search Directory.'}
          </p>
        </div>

        {/* Unique Donor ID Card */}
        <div className="bg-gradient-to-br from-rose-50/80 to-stone-50 border border-rose-200/90 rounded-2xl p-4 sm:p-5 max-w-sm mx-auto text-left space-y-3 shadow-2xs">
          <div className="flex items-center justify-between border-b border-rose-200/60 pb-2.5">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-rose-600 text-white font-black flex items-center justify-center text-sm shadow-xs">
                {submittedDonor.bloodGroup}
              </div>
              <div>
                <p className="text-xs font-black text-gray-900 leading-none">{submittedDonor.name}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">রক্তদাতা সদস্য</p>
              </div>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
              {lang === 'bn' ? 'রক্তদানে প্রস্তুত' : 'Available'}
            </span>
          </div>

          <div className="space-y-1.5 text-xs text-gray-700">
            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">{lang === 'bn' ? 'ডোনার ইউনিক আইডি:' : 'Donor UID:'}</span>
              <div className="flex items-center gap-1.5">
                <span className="font-mono font-black text-rose-900 bg-white px-2 py-0.5 rounded border border-rose-200">
                  {submittedDonor.districtUniqueId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyId}
                  className="p-1 text-gray-500 hover:text-gray-800 transition"
                  title="Copy ID"
                >
                  {copiedId ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-gray-500 font-medium">{lang === 'bn' ? 'অবস্থান:' : 'Location:'}</span>
              <span className="font-bold text-gray-900">
                {submittedDonor.upazila}, {submittedDonor.district}
              </span>
            </div>

            {submittedDonor.lastDonationDate && (
              <div className="flex justify-between items-center">
                <span className="text-gray-500 font-medium">{lang === 'bn' ? 'শেষ রক্তদান:' : 'Last Donation:'}</span>
                <span className="font-bold text-gray-800">{submittedDonor.lastDonationDate}</span>
              </div>
            )}
          </div>

          <div className="pt-2 border-t border-rose-200/60 flex items-center gap-1.5 text-[10.5px] text-rose-800 font-medium">
            <ShieldCheck className="w-3.5 h-3.5 text-rose-600 shrink-0" />
            <span>{lang === 'bn' ? 'ফোন নম্বর সুরক্ষায় ডায়াল লিংকের মাধ্যমে গোপন রাখা হয়েছে।' : 'Phone number is protected by dialer link.'}</span>
          </div>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5 max-w-sm mx-auto">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2.5 px-4 bg-gray-900 hover:bg-black text-white font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer shadow-xs"
              id="btn-donor-success-done"
            >
              {lang === 'bn' ? 'হোমে ফিরে যান' : 'Back to Home'}
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setSubmittedDonor(null);
              setFullName('');
              setPhone('');
              setArea('');
              setLastDonationDate('');
            }}
            className="w-full py-2.5 px-4 bg-rose-50 hover:bg-rose-100 text-rose-900 font-bold text-xs sm:text-sm rounded-xl border border-rose-200 transition cursor-pointer"
            id="btn-donor-register-another"
          >
            {lang === 'bn' ? 'নতুন রক্তদাতা যুক্ত করুন' : 'Register Another Donor'}
          </button>
        </div>
      </div>
    );
  }

  // ==========================================
  // REGISTRATION FORM VIEW
  // ==========================================
  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border-2 border-rose-200/80 p-4 sm:p-6 shadow-sm space-y-4 animate-in fade-in duration-150"
      id="form-blood-donor-registration"
    >
      {/* Header Banner */}
      <div className="flex items-center gap-3 p-3 bg-rose-50/80 border border-rose-200/70 rounded-xl">
        <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shadow-xs shrink-0">
          <Droplet className="w-5 h-5 fill-white stroke-none" />
        </div>
        <div>
          <h2 className="text-sm sm:text-base font-black text-rose-950">
            {lang === 'bn' ? 'রক্তদাতা সদস্য রেজিস্ট্রেশন ফরম' : 'Blood Donor Registration Form'}
          </h2>
          <p className="text-[11px] sm:text-xs text-rose-700 font-medium">
            {lang === 'bn'
              ? 'জরুরি প্রয়োজনে মুমূর্ষু রোগীর জীবন বাঁচাতে রক্তের গ্রুপসহ নিবন্ধন সম্পন্ন করুন।'
              : 'Register your blood group to help patients during emergencies.'}
          </p>
        </div>
      </div>

      {/* Validation Error Alert */}
      {errorMsg && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs font-bold animate-shake">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* FIELD 1: Donor Full Name (Required) */}
      <div>
        <label className="block text-xs font-bold text-gray-800 mb-1">
          {lang === 'bn' ? 'রক্তদাতার পূর্ণ নাম *' : 'Donor Full Name *'}
        </label>
        <div className="relative">
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            placeholder={lang === 'bn' ? 'যেমন: সুমন চাকমা / মোহাম্মদ রফিকুল ইসলাম' : 'e.g. Suman Chakma'}
            className="w-full pl-9 pr-3.5 py-2.5 bg-[#faf9f6] border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20 transition"
            id="input-donor-full-name"
          />
          <User className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* FIELD 2: Blood Group Selector (Required: A+, A-, B+, B-, AB+, AB-, O+, O-) */}
      <div>
        <label className="block text-xs font-bold text-gray-800 mb-1">
          {lang === 'bn' ? 'রক্তের গ্রুপ (Blood Group) *' : 'Blood Group *'}
        </label>
        <div className="grid grid-cols-4 gap-2">
          {BLOOD_GROUPS.map((bg) => {
            const isSelected = bloodGroup === bg;
            return (
              <button
                type="button"
                key={bg}
                onClick={() => setBloodGroup(bg)}
                className={`py-2 px-2 text-center rounded-xl border text-xs sm:text-sm font-black transition cursor-pointer flex items-center justify-center gap-1 ${
                  isSelected
                    ? 'bg-rose-600 text-white border-rose-600 shadow-xs scale-[1.02]'
                    : 'bg-stone-50 hover:bg-rose-50 text-gray-800 border-gray-200'
                }`}
                id={`btn-select-bg-${bg.replace('+', 'pos').replace('-', 'neg')}`}
              >
                <Droplet className={`w-3 h-3 ${isSelected ? 'fill-white text-white' : 'text-rose-500'}`} />
                <span>{bg}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* FIELD 3: Phone Number (Required with Operator Prefix & Double Reg Prevention Notice) */}
      <div>
        <label className="block text-xs font-bold text-gray-800 mb-1">
          {lang === 'bn' ? 'সচল মোবাইল নম্বর (যেমন: 017..., 018...) *' : 'Active Mobile Number *'}
        </label>
        <div className="relative">
          <input
            type="tel"
            required
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="01XXXXXXXXX"
            className="w-full pl-9 pr-3.5 py-2.5 bg-[#faf9f6] border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20 transition font-mono"
            id="input-donor-phone"
          />
          <Phone className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        <p className="text-[10px] text-rose-700 mt-1 flex items-center gap-1 font-bold">
          <ShieldCheck className="w-3 h-3 text-rose-600 shrink-0" />
          <span>{lang === 'bn' ? '⚠️ এই নম্বর দিয়ে পূর্বে কোনো রেজিস্ট্রেশন করা থাকলে পুনরায় ডাবল রেজিস্ট্রেশন নেওয়া হবে না।' : 'Duplicate registration with the same phone number is not allowed.'}</span>
        </p>
      </div>

      {/* WhatsApp Number (Optional, defaults to Phone) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-bold text-gray-800 mb-1">
            {lang === 'bn' ? 'হোয়াটসঅ্যাপ নম্বর (ঐচ্ছিক)' : 'WhatsApp Number (Optional)'}
          </label>
          <div className="relative">
            <input
              type="tel"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
              placeholder={phone || '01XXXXXXXXX'}
              className="w-full pl-9 pr-3.5 py-2.5 bg-[#faf9f6] border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20 transition font-mono"
              id="input-donor-whatsapp"
            />
            <MessageSquare className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-800 mb-1">
            {lang === 'bn' ? 'ইমেইল এড্রেস (ঐচ্ছিক)' : 'Email Address (Optional)'}
          </label>
          <div className="relative">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="donor@example.com"
              className="w-full pl-9 pr-3.5 py-2.5 bg-[#faf9f6] border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20 transition"
              id="input-donor-email"
            />
            <Mail className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* FIELD: Profession (Required for Database/Search) */}
      <div>
        <label className="block text-xs font-bold text-gray-800 mb-1">
          {lang === 'bn' ? 'পেশা / পদবি (Profession) *' : 'Profession / Occupation *'}
        </label>
        <div className="relative">
          <input
            type="text"
            required
            value={profession}
            onChange={(e) => setProfession(e.target.value)}
            placeholder={lang === 'bn' ? 'যেমন: রক্তদাতা / শিক্ষক / ছাত্র / ব্যবসায়ী' : 'e.g. Blood Donor / Student / Teacher'}
            className="w-full pl-9 pr-3.5 py-2.5 bg-[#faf9f6] border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20 transition"
            id="input-donor-profession"
          />
          <Briefcase className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* FIELD: Password (Required for Authentication Lookup) */}
      <div>
        <label className="block text-xs font-bold text-gray-800 mb-1">
          {lang === 'bn' ? 'অ্যাকাউন্ট পাসওয়ার্ড (কমপক্ষে ৪ অক্ষর) *' : 'Account Password (min 4 characters) *'}
        </label>
        <div className="relative">
          <input
            type={showPassword ? 'text' : 'password'}
            required
            minLength={4}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={lang === 'bn' ? 'লগইন ও প্রোফাইল ব্যবস্থাপনার পাসওয়ার্ড দিন' : 'Enter password for login'}
            className="w-full pl-9 pr-10 py-2.5 bg-[#faf9f6] border border-gray-300 rounded-xl text-xs sm:text-sm font-semibold text-gray-900 focus:bg-white focus:outline-none focus:border-rose-600 focus:ring-2 focus:ring-rose-500/20 transition font-mono"
            id="input-donor-password"
          />
          <Lock className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
            title={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        <p className="text-[10px] text-gray-500 mt-1">
          {lang === 'bn'
            ? 'এই পাসওয়ার্ড এবং আপনার ফোন নম্বর দিয়ে পরবর্তীতে সরাসরি লগইন করতে পারবেন।'
            : 'You can use this password and your phone number to sign in later.'}
        </p>
      </div>

      {/* FIELD 4: Cascading Location Selector (Division / District / Upazila) */}
      <div className="space-y-2.5 pt-1">
        <label className="block text-xs font-bold text-gray-800">
          {lang === 'bn' ? 'অবস্থান নির্বাচন (বিভাগ / জেলা / উপজেলা) *' : 'Location (Division / District / Upazila) *'}
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {/* Division Selector */}
          <div>
            <span className="block text-[10px] font-semibold text-gray-600 mb-0.5">
              {lang === 'bn' ? 'বিভাগ' : 'Division'}
            </span>
            <select
              value={division}
              onChange={(e) => handleDivisionChange(e.target.value)}
              className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 focus:border-rose-600 focus:outline-none cursor-pointer"
              id="select-donor-division"
            >
              {divisions.map((d) => (
                <option key={d.code} value={d.nameBn}>
                  {d.nameBn} ({d.nameEn})
                </option>
              ))}
            </select>
          </div>

          {/* District Selector */}
          <div>
            <span className="block text-[10px] font-semibold text-gray-600 mb-0.5">
              {lang === 'bn' ? 'জেলা' : 'District'}
            </span>
            <select
              value={district}
              onChange={(e) => handleDistrictChange(e.target.value)}
              className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 focus:border-rose-600 focus:outline-none cursor-pointer"
              id="select-donor-district"
            >
              {districts.map((d) => (
                <option key={d.code || d.nameBn} value={d.nameBn}>
                  {d.nameBn}
                </option>
              ))}
            </select>
          </div>

          {/* Upazila Selector */}
          <div>
            <span className="block text-[10px] font-semibold text-gray-600 mb-0.5">
              {lang === 'bn' ? 'উপজেলা / থানা' : 'Upazila / Thana'}
            </span>
            <select
              value={upazila}
              onChange={(e) => setUpazila(e.target.value)}
              className="w-full px-2.5 py-2 bg-white border border-gray-300 rounded-xl text-xs font-semibold text-gray-900 focus:border-rose-600 focus:outline-none cursor-pointer"
              id="select-donor-upazila"
            >
              {upazilas.map((u) => (
                <option key={u.code || u.nameBn} value={u.nameBn}>
                  {u.nameBn}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Optional Area / Village */}
        <div>
          <span className="block text-[10px] font-semibold text-gray-600 mb-0.5">
            {lang === 'bn' ? 'নির্দিষ্ট এলাকা / গ্রাম / পাড়া (ঐচ্ছিক)' : 'Area / Village (Optional)'}
          </span>
          <div className="relative">
            <input
              type="text"
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder={lang === 'bn' ? 'যেমন: পানখাইয়াপাড়া / বাজার এলাকা' : 'e.g. Bazar Area'}
              className="w-full pl-8 pr-3 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-900 focus:border-rose-600 focus:outline-none"
              id="input-donor-area"
            />
            <MapPin className="w-3.5 h-3.5 text-gray-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>
      </div>

      {/* FIELD 5: Last Donation Date (Optional) */}
      <div className="pt-1">
        <label className="block text-xs font-bold text-gray-800 mb-1">
          {lang === 'bn' ? 'শেষ রক্তদানের তারিখ (ঐচ্ছিক)' : 'Last Donation Date (Optional)'}
        </label>
        <div className="relative">
          <input
            type="date"
            value={lastDonationDate}
            onChange={(e) => setLastDonationDate(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 bg-white border border-gray-300 rounded-xl text-xs font-medium text-gray-900 focus:border-rose-600 focus:outline-none"
            id="input-donor-last-date"
          />
          <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
        <p className="text-[10px] text-gray-500 mt-0.5">
          {lang === 'bn' ? 'পূর্বে রক্ত দিয়ে থাকলে তারিখ দিন, নতুন হলে খালি রাখুন।' : 'Leave empty if you have not donated before.'}
        </p>
      </div>

      {/* Availability Status Checkbox */}
      <div className="p-3 bg-rose-50/50 border border-rose-200/60 rounded-xl space-y-2">
        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={isAvailable}
            onChange={(e) => setIsAvailable(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-gray-300 cursor-pointer"
            id="check-donor-available"
          />
          <span className="text-xs text-gray-800 font-bold leading-snug">
            {lang === 'bn'
              ? 'জরুরি প্রয়োজনে রক্তদানে প্রস্তুত (Available for donation)'
              : 'I am currently available to donate blood during emergencies'}
          </span>
        </label>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            required
            checked={agreeTerms}
            onChange={(e) => setAgreeTerms(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded text-rose-600 focus:ring-rose-500 border-gray-300 cursor-pointer"
            id="check-donor-agree-terms"
          />
          <span className="text-[11px] text-gray-700 leading-snug">
            {lang === 'bn'
              ? 'আমি স্বেচ্ছায় ও বিনামূল্যে মানবিক কারণে জরুরি প্রয়োজনে রক্তদানের জন্য ঝাদিমাদি নেটওয়ার্কে যুক্ত হচ্ছি।'
              : 'I volunteer to donate blood for humanitarian emergency causes free of charge.'}
          </span>
        </label>
      </div>

      {/* Privacy Notice Box */}
      <div className="p-2.5 bg-stone-50 border border-stone-200 rounded-xl flex items-start gap-2 text-[10.5px] text-stone-600">
        <ShieldCheck className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
        <p>
          {lang === 'bn'
            ? 'ঝাদিমাদি এআই বা সার্চ ফলাফলে আপনার রক্তদাতার নাম, রক্তের গ্রুপ এবং অবস্থান প্রদর্শিত হবে। ব্যক্তিগত মোবাইল নম্বর কখনোই উন্মুক্ত করা হবে না; শুধুমাত্র সুরক্ষিত কল বাটনে ডায়ালারে প্রেরিত হবে।'
            : 'Your phone number will never be exposed on screen. It will only be routed to the dialer via secure Call buttons.'}
        </p>
      </div>

      {/* Action Buttons */}
      <div className="pt-2 flex items-center gap-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="w-1/3 py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs sm:text-sm rounded-xl transition cursor-pointer"
            id="btn-donor-cancel"
          >
            {lang === 'bn' ? 'বাতিল' : 'Cancel'}
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 active:scale-98 text-white font-bold text-xs sm:text-sm py-2.5 px-4 rounded-xl shadow-md transition cursor-pointer disabled:opacity-50"
          id="btn-donor-submit"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{lang === 'bn' ? 'রেজিস্ট্রেশন হচ্ছে...' : 'Registering...'}</span>
            </>
          ) : (
            <>
              <Heart className="w-4 h-4 fill-white" />
              <span>{lang === 'bn' ? 'রক্তদাতা হিসেবে রেজিস্ট্রেশন করুন' : 'Register as Blood Donor'}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
};