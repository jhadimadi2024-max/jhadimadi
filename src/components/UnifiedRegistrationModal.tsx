import React, { useState, useMemo } from 'react';
import {
  X,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Droplet,
  User,
  Phone,
  MapPin,
  Briefcase,
  ShoppingBag,
  Building2,
  Sparkles
} from 'lucide-react';
import { LOCATION_MASTER, DistrictItem } from '../data/locationMaster';
import { Language } from '../types';
import { supabase } from '../lib/supabaseClient'; // আপনার প্রজেক্টের সুপাবেস ক্লায়েন্ট পাথ অনুযায়ী ঠিক করে নেবেন

export interface UnifiedRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (profileData: any) => void;
  lang?: Language;
}

export type RegistrationRole = 'service_provider' | 'product_seller' | 'employer' | 'job_seeker' | 'blood_donor';

export const UnifiedRegistrationModal: React.FC<UnifiedRegistrationModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  lang = 'bn'
}) => {
  // Step state (1: Basic Info, 2: Role & Blood Donor)
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Step 1: Basic Info
  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('খাগড়াছড়ি');
  const [selectedUpazila, setSelectedUpazila] = useState('খাগড়াছড়ি সদর');

  // Step 2: Role Selection
  const [selectedRole, setSelectedRole] = useState<RegistrationRole>('service_provider');

  // Step 2: Integrated Blood Donor Feature
  const [willingToDonateBlood, setWillingToDonateBlood] = useState<boolean>(false);
  const [bloodGroup, setBloodGroup] = useState<string>('A+');

  // Submitting / Status
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmittedSuccess, setIsSubmittedSuccess] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Extract districts list from location master
  const allDistricts = useMemo(() => {
    const list: DistrictItem[] = [];
    LOCATION_MASTER.forEach((div) => {
      div.districts.forEach((dist) => list.push(dist));
    });
    return list;
  }, []);

  // Available upazilas based on selected district
  const availableUpazilas = useMemo(() => {
    const matched = allDistricts.find(
      (d) => d.nameBn === selectedDistrict || d.nameEn.toLowerCase() === selectedDistrict.toLowerCase()
    );
    return matched ? matched.upazilas : [];
  }, [allDistricts, selectedDistrict]);

  if (!isOpen) return null;

  const handleNextStep = () => {
    setFormError(null);
    if (!fullName.trim()) {
      setFormError('অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন');
      return;
    }
    const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');
    if (cleanPhone.length < 11) {
      setFormError('অনুগ্রহ করে সঠিক ১১ ডিজিটের মোবাইল নম্বর লিখুন (যেমন: 018XXXXXXXX)');
      return;
    }
    setCurrentStep(2);
  };

  // SQL টেবিলের স্ট্রাকচার অনুযায়ী সঠিক টেবিলে ডাটা সেভ করার ফাংশন
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    try {
      let targetTable = '';
      let payload: any = {};

      const isDonor = willingToDonateBlood || selectedRole === 'blood_donor';

      // রোল অনুযায়ী সঠিক টেবিল এবং এসকিউএল কলামের সাথে মিল রেখে পে-লোড তৈরি
      if (selectedRole === 'blood_donor') {
        targetTable = 'blood_donors';
        payload = {
          full_name: fullName.trim(),
          name: fullName.trim(),
          phone_number: phoneNumber.trim(),
          phone: phoneNumber.trim(),
          whatsapp_number: phoneNumber.trim(),
          district: selectedDistrict,
          upazila: selectedUpazila,
          area: selectedUpazila,
          blood_group: bloodGroup,
          consent_given: true,
          latitude: 0,
          longitude: 0
        };
      } else if (selectedRole === 'product_seller') {
        targetTable = 'product_sellers';
        payload = {
          shop_name: fullName.trim(),
          name: fullName.trim(),
          phone: phoneNumber.trim(),
          phone_number: phoneNumber.trim(),
          district: selectedDistrict,
          upazila: selectedUpazila,
          area: selectedUpazila,
          is_emergency_donor: isDonor,
          blood_group: isDonor ? bloodGroup : null
        };
      } else if (selectedRole === 'service_provider') {
        targetTable = 'service_providers';
        payload = {
          name: fullName.trim(),
          full_name: fullName.trim(),
          phone: phoneNumber.trim(),
          phone_number: phoneNumber.trim(),
          service_type: 'general',
          district: selectedDistrict,
          upazila: selectedUpazila,
          area: selectedUpazila,
          is_emergency_donor: isDonor,
          blood_group: isDonor ? bloodGroup : null
        };
      } else if (selectedRole === 'job_seeker') {
        targetTable = 'job_seekers';
        payload = {
          name: fullName.trim(),
          full_name: fullName.trim(),
          phone: phoneNumber.trim(),
          phone_number: phoneNumber.trim(),
          district: selectedDistrict,
          upazila: selectedUpazila,
          area: selectedUpazila,
          job_role: 'General'
        };
      } else if (selectedRole === 'employer') {
        targetTable = 'permanent_members';
        payload = {
          name: fullName.trim(),
          full_name: fullName.trim(),
          phone: phoneNumber.trim(),
          phone_number: phoneNumber.trim(),
          district: selectedDistrict,
          upazila: selectedUpazila,
          area: selectedUpazila,
          is_emergency_donor: isDonor,
          blood_group: isDonor ? bloodGroup : null
        };
      }

      // Supabase-এ ডাটা ইনসার্ট করার কোড with strict logging & error alerts
      if (targetTable) {
        console.log(`[Unified Registration] Submitting to Supabase ${targetTable}:`, payload);
        const { data, error: dbError } = await supabase.from(targetTable).insert([payload]);
        if (dbError) {
          console.error(`SUPABASE INSERTION ERROR on ${targetTable}:`, dbError);
          alert(`ডাটাবেসে তথ্য সেভ হতে ব্যর্থ হয়েছে (${targetTable}): ` + dbError.message);
          throw dbError;
        } else {
          console.log(`SUPABASE INSERTION SUCCESS on ${targetTable}:`, data);
        }
      }

      setIsSubmittedSuccess(true);
      if (onSuccess) {
        onSuccess(payload);
      }
    } catch (err: any) {
      console.error('Supabase Error:', err);
      setFormError(err?.message || 'রেজিস্ট্রেশনে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      id="unified-registration-modal-overlay"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/65 backdrop-blur-xs animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-[#fbf9f4] border-2 border-[#2d6a4f]/30 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ================= MODAL HEADER ================= */}
        <div className="bg-[#f4f0e6] border-b-2 border-[#2d6a4f]/20 px-5 sm:px-7 py-4 sm:py-5 flex items-start justify-between relative">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#1b4332]"></span>
              <span className="text-xs font-bold uppercase tracking-wider text-[#2d6a4f]">
                {currentStep === 1 ? 'ধাপ ১/২: মৌলিক তথ্য' : 'ধাপ ২/২: কাজের ক্ষেত্র ও রক্তদান'}
              </span>
            </div>
            <h2 className="text-lg sm:text-2xl font-black text-[#1b4332] tracking-tight leading-tight">
              আপনার প্রফেশনাল অ্যাকাউন্ট তৈরি করুন
            </h2>
            <p className="text-xs sm:text-sm md:text-base font-semibold text-[#2d6a4f]/90 mt-1 leading-snug">
              মাত্র ১ মিনিটে আপনার তথ্য দিয়ে আমাদের সাথে যুক্ত হোন।
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-full hover:bg-[#2d6a4f]/15 text-[#1b4332] transition cursor-pointer border border-[#2d6a4f]/20 shrink-0 ml-2"
            title="বন্ধ করুন"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================= STEP PROGRESS BAR ================= */}
        <div className="w-full bg-[#ebe5d8] h-1.5 flex">
          <div
            className="bg-[#1b4332] h-full transition-all duration-300 ease-out"
            style={{ width: currentStep === 1 ? '50%' : '100%' }}
          ></div>
        </div>

        {/* ================= FORM BODY ================= */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-7 space-y-6">
          {formError && (
            <div className="p-3.5 bg-red-50 border-2 border-red-200 rounded-xl text-red-800 text-sm font-semibold flex items-center gap-2">
              <span>⚠️</span>
              <span>{formError}</span>
            </div>
          )}

          {isSubmittedSuccess ? (
            <div className="py-8 text-center space-y-4">
              <div className="w-16 h-16 bg-[#e7efe9] text-[#1b4332] rounded-full flex items-center justify-center mx-auto border-2 border-[#1b4332]">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#1b4332]">
                অভিনন্দন! আপনার অ্যাকাউন্ট তৈরি হয়েছে
              </h3>
              <p className="text-sm sm:text-base text-[#2d6a4f] max-w-md mx-auto leading-relaxed">
                প่าড় আপনার সেবা ও পরিচয় সফলভাবে নিবন্ধিত হয়েছে। এখন আপনি সরাসরি কাজ ও ক্লায়েন্টদের সাথে যুক্ত হতে পারেন।
              </p>
              <div className="pt-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-3 bg-[#1b4332] hover:bg-[#2d6a4f] text-white font-bold text-base rounded-xl transition shadow-md cursor-pointer"
                >
                  প্রোফাইল দেখুন
                </button>
              </div>
            </div>
          ) : currentStep === 1 ? (
            /* ================= STEP 1: BASIC INFO ================= */
            <div className="space-y-5">
              {/* Full Name */}
              <div className="space-y-1.5">
                <label className="block text-sm sm:text-base font-bold text-[#1b4332]">
                  পূর্ণ নাম <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <User className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2d6a4f]/70" />
                  <input
                    type="text"
                    required
                    placeholder="আপনার পুরো নাম লিখুন"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border-2 border-[#2d6a4f]/30 rounded-xl text-base text-[#1b4332] font-semibold placeholder:text-stone-400 focus:outline-none focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332] transition"
                  />
                </div>
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5">
                <label className="block text-sm sm:text-base font-bold text-[#1b4332]">
                  মোবাইল নম্বর <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Phone className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2d6a4f]/70" />
                  <input
                    type="tel"
                    required
                    placeholder="০১XXXXXXXXX"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="w-full pl-11 pr-4 py-3 bg-white border-2 border-[#2d6a4f]/30 rounded-xl text-base text-[#1b4332] font-semibold placeholder:text-stone-400 focus:outline-none focus:border-[#1b4332] focus:ring-1 focus:ring-[#1b4332] transition"
                  />
                </div>
                <p className="text-xs text-[#2d6a4f]/80 font-medium">
                  এই নম্বরে ক্লায়েন্ট ও কাস্টমাররা আপনার সাথে যোগাযোগ করবেন।
                </p>
              </div>

              {/* Location: District & Upazila */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-sm sm:text-base font-bold text-[#1b4332]">
                    জেলা নির্বাচন <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#2d6a4f]/70" />
                    <select
                      value={selectedDistrict}
                      onChange={(e) => {
                        const dist = e.target.value;
                        setSelectedDistrict(dist);
                        const matched = allDistricts.find((d) => d.nameBn === dist);
                        if (matched && matched.upazilas.length > 0) {
                          setSelectedUpazila(matched.upazilas[0].nameBn);
                        }
                      }}
                      className="w-full pl-10 pr-8 py-3 bg-white border-2 border-[#2d6a4f]/30 rounded-xl text-sm sm:text-base text-[#1b4332] font-bold focus:outline-none focus:border-[#1b4332] transition appearance-none cursor-pointer"
                    >
                      {allDistricts.map((d) => (
                        <option key={d.code} value={d.nameBn}>
                          {d.nameBn} ({d.nameEn})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-sm sm:text-base font-bold text-[#1b4332]">
                    উপজেলা নির্বাচন <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={selectedUpazila}
                    onChange={(e) => setSelectedUpazila(e.target.value)}
                    className="w-full px-4 py-3 bg-white border-2 border-[#2d6a4f]/30 rounded-xl text-sm sm:text-base text-[#1b4332] font-bold focus:outline-none focus:border-[#1b4332] transition appearance-none cursor-pointer"
                  >
                    {availableUpazilas.map((u) => (
                      <option key={u.code} value={u.nameBn}>
                        {u.nameBn}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>
          ) : (
            /* ================= STEP 2: ROLE SELECTION & INTEGRATED BLOOD DONOR ================= */
            <div className="space-y-6">
              {/* Role Selection Chips */}
              <div className="space-y-2.5">
                <label className="block text-sm sm:text-base font-bold text-[#1b4332]">
                  আপনার প্রাথমিক ভূমিকা নির্বাচন করুন <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {[
                    { id: 'service_provider', label: 'সেবা প্রদানকারী', icon: Briefcase, desc: 'মিস্ত্রি, টেকনিশিয়ান ও দক্ষ কারিগর' },
                    { id: 'product_seller', label: 'পণ্য বিক্রেতা', icon: ShoppingBag, desc: 'পাহাড়ি ও দেশীয় খাঁটি পণ্যের খামারী/মার্চেন্ট' },
                    { id: 'employer', label: 'নিয়োগকারী', icon: Building2, desc: 'কাজের লোক বা কর্মী খুঁজতে চান' },
                    { id: 'job_seeker', label: 'চাকরিপ্রার্থী', icon: User, desc: 'নতুন কাজ বা চাকরি প্রত্যাশী' },
                    { id: 'blood_donor', label: 'জরুরি রক্তদাতা', icon: Droplet, desc: 'পাহাড়ে জরুরি মানবিক রক্ত সহায়তা' }
                  ].map((roleItem) => {
                    const Icon = roleItem.icon;
                    const isSelected = selectedRole === roleItem.id;
                    return (
                      <button
                        key={roleItem.id}
                        type="button"
                        onClick={() => setSelectedRole(roleItem.id as RegistrationRole)}
                        className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? 'bg-[#1b4332] text-white border-[#1b4332] shadow-md'
                            : 'bg-white text-[#1b4332] border-[#2d6a4f]/25 hover:border-[#2d6a4f]/60 hover:bg-[#f4f7f4]'
                        }`}
                      >
                        <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-white/20 text-white' : 'bg-[#e7efe9] text-[#1b4332]'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="text-base font-bold leading-snug">{roleItem.label}</div>
                          <div className={`text-xs mt-0.5 leading-tight ${isSelected ? 'text-white/80' : 'text-[#2d6a4f]/80'}`}>
                            {roleItem.desc}
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Integrated Blood Donor Feature */}
              <div className="bg-[#f4f0e6] border-2 border-[#2d6a4f]/30 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 border border-red-200">
                      <Droplet className="w-5 h-5 fill-red-500 text-red-500" />
                    </div>
                    <div>
                      <h4 className="text-sm sm:text-base font-black text-[#1b4332]">
                        আমি কি জরুরি প্রয়োজনে রক্ত দিতে ইচ্ছুক?
                      </h4>
                      <p className="text-xs text-[#2d6a4f]/90 font-medium mt-0.5">
                        পাহাড়ে রক্তের প্রয়োজনে রোগীর জীবন বাঁচাতে আপনার নাম যুক্ত থাকবে।
                      </p>
                    </div>
                  </div>

                  {/* Yes / No Toggle Chips */}
                  <div className="flex items-center gap-1.5 shrink-0 bg-white p-1 rounded-xl border border-[#2d6a4f]/30 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setWillingToDonateBlood(true)}
                      className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer ${
                        willingToDonateBlood || selectedRole === 'blood_donor'
                          ? 'bg-red-600 text-white shadow-xs'
                          : 'text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      হ্যাঁ
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (selectedRole === 'blood_donor') {
                          setSelectedRole('service_provider');
                        }
                        setWillingToDonateBlood(false);
                      }}
                      className={`px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold transition cursor-pointer ${
                        !willingToDonateBlood && selectedRole !== 'blood_donor'
                          ? 'bg-[#1b4332] text-white shadow-xs'
                          : 'text-stone-600 hover:bg-stone-100'
                      }`}
                    >
                      না
                    </button>
                  </div>
                </div>

                {/* Seamless Blood Group Dropdown if Yes */}
                {(willingToDonateBlood || selectedRole === 'blood_donor') && (
                  <div className="pt-3 border-t border-[#2d6a4f]/20 animate-in fade-in duration-200">
                    <label className="block text-xs sm:text-sm font-bold text-[#1b4332] mb-1.5">
                      রক্তের গ্রুপ নির্বাচন করুন <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-4 sm:grid-cols-8 gap-2">
                      {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map((grp) => (
                        <button
                          key={grp}
                          type="button"
                          onClick={() => setBloodGroup(grp)}
                          className={`py-2 text-center rounded-xl font-black text-sm transition cursor-pointer border-2 ${
                            bloodGroup === grp
                              ? 'bg-red-600 text-white border-red-600 shadow-sm'
                              : 'bg-white text-red-700 border-red-200 hover:border-red-400'
                          }`}
                        >
                          {grp}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ================= MODAL FOOTER ================= */}
        {!isSubmittedSuccess && (
          <div className="bg-[#f4f0e6] border-t-2 border-[#2d6a4f]/20 px-5 sm:px-7 py-4 flex items-center justify-between">
            {currentStep === 2 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2.5 rounded-xl border-2 border-[#2d6a4f]/30 text-[#1b4332] font-bold text-sm sm:text-base hover:bg-[#e7efe9] transition cursor-pointer flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                পূর্ববর্তী
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border-2 border-stone-300 text-stone-600 font-bold text-sm sm:text-base hover:bg-stone-100 transition cursor-pointer"
              >
                বাতিল
              </button>
            )}

            {currentStep === 1 ? (
              <button
                type="button"
                onClick={handleNextStep}
                className="px-6 py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#2d6a4f] text-white font-bold text-sm sm:text-base shadow-md transition cursor-pointer flex items-center gap-2"
              >
                পরবর্তী ধাপ
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="px-7 py-2.5 rounded-xl bg-[#1b4332] hover:bg-[#2d6a4f] text-white font-black text-sm sm:text-base shadow-md transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
              >
                {isSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'অ্যাকাউন্ট নিশ্চিত করুন'}
                <Sparkles className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};