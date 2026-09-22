import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Camera,
  Upload,
  X,
  Check,
  ShieldCheck,
  Lock,
  MapPin,
  Calendar,
  AlertCircle,
  FileText,
  User,
  Phone,
  CheckCircle2,
  Trash2,
  Printer,
  Sparkles,
  ArrowLeft,
  Heart,
  Droplet,
  Globe,
  Share2,
  Gift
} from 'lucide-react';
import { UserProfile, Language, PujaGiftApplication } from '../types';
import { LOCATION_MASTER, getAllDivisions } from '../data/locationMaster';
import { databaseService } from '../services/databaseService';
import { compressImage } from '../utils/imageUtils';
import { uploadFileToSupabaseStorage, isLocalTransientUrl } from '../utils/directSupabaseStorage';

export interface PujaGiftApplicationFormProps {
  currentUser?: UserProfile | null;
  onSuccess?: (app: PujaGiftApplication) => void;
  onBack?: () => void;
  lang?: Language;
}

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export const PujaGiftApplicationForm: React.FC<PujaGiftApplicationFormProps> = ({
  currentUser,
  onSuccess,
  onBack,
  lang: initialLang = 'bn',
}) => {
  // 1. Language State
  const [lang, setLang] = useState<Language>(initialLang);

  // 2. Form Fields State
  const [passportPhoto, setPassportPhoto] = useState<string>(currentUser?.avatar || '');
  const [photoFileName, setPhotoFileName] = useState<string>('');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [isPhotoLoading, setIsPhotoLoading] = useState<boolean>(false);

  const [fullName, setFullName] = useState<string>(currentUser?.fullName || currentUser?.name || '');
  const [fatherOrHusbandName, setFatherOrHusbandName] = useState<string>('');
  const [motherName, setMotherName] = useState<string>('');
  const [dateOfBirth, setDateOfBirth] = useState<string>('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other' | ''>('');
  const [bloodGroup, setBloodGroup] = useState<string>(currentUser?.bloodGroup || '');
  const [nidOrBirthCertificate, setNidOrBirthCertificate] = useState<string>(currentUser?.nidNumber || '');
  const [contactNumber, setContactNumber] = useState<string>(currentUser?.phone || '');

  // Present Address
  const [presentVillage, setPresentVillage] = useState<string>(currentUser?.para || currentUser?.mahalla || '');
  const [presentThana, setPresentThana] = useState<string>(currentUser?.upazila || currentUser?.thana || '');
  const [presentDistrict, setPresentDistrict] = useState<string>(currentUser?.district || '');

  // Permanent Address
  const [sameAsPresent, setSameAsPresent] = useState<boolean>(false);
  const [permanentVillage, setPermanentVillage] = useState<string>('');
  const [permanentThana, setPermanentThana] = useState<string>('');
  const [permanentDistrict, setPermanentDistrict] = useState<string>('');

  // Declaration & Additional Notes
  const [declarationNotes, setDeclarationNotes] = useState<string>('');
  const [declarationAgreed, setDeclarationAgreed] = useState<boolean>(true);

  // 3. UI and Submission States
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submittedApp, setSubmittedApp] = useState<PujaGiftApplication | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync same as present address
  useEffect(() => {
    if (sameAsPresent) {
      setPermanentVillage(presentVillage);
      setPermanentThana(presentThana);
      setPermanentDistrict(presentDistrict);
    }
  }, [sameAsPresent, presentVillage, presentThana, presentDistrict]);

  // Extract all 64 districts from LOCATION_MASTER
  const allDistricts = useMemo(() => {
    const list: { nameBn: string; nameEn: string; upazilas: { nameBn: string; nameEn: string }[] }[] = [];
    LOCATION_MASTER.forEach(div => {
      div.districts.forEach(dist => {
        list.push({
          nameBn: dist.nameBn,
          nameEn: dist.nameEn,
          upazilas: dist.upazilas.map(u => ({ nameBn: u.nameBn, nameEn: u.nameEn }))
        });
      });
    });
    return list.sort((a, b) => a.nameBn.localeCompare(b.nameBn));
  }, []);

  // Upazila suggestions for present district
  const presentUpazilaOptions = useMemo(() => {
    if (!presentDistrict) return [];
    const found = allDistricts.find(d => d.nameBn === presentDistrict || d.nameEn.toLowerCase() === presentDistrict.toLowerCase());
    return found ? found.upazilas : [];
  }, [presentDistrict, allDistricts]);

  // Upazila suggestions for permanent district
  const permanentUpazilaOptions = useMemo(() => {
    if (!permanentDistrict) return [];
    const found = allDistricts.find(d => d.nameBn === permanentDistrict || d.nameEn.toLowerCase() === permanentDistrict.toLowerCase());
    return found ? found.upazilas : [];
  }, [permanentDistrict, allDistricts]);

  // Handle Photo File Selection
  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrors(prev => ({
        ...prev,
        passportPhoto: lang === 'bn' ? 'দয়া করে একটি সঠিক ছবির ফাইল (JPG, PNG) নির্বাচন করুন।' : 'Please choose a valid image file (JPG, PNG).'
      }));
      return;
    }

    setPhotoFileName(file.name);
    setPhotoFile(file);
    setIsPhotoLoading(true);
    setErrors(prev => {
      const next = { ...prev };
      delete next.passportPhoto;
      return next;
    });

    try {
      const compressed = await compressImage(file, 350, 420, 0.78);
      setPassportPhoto(compressed);
    } catch (err) {
      console.error('Error compressing passport photo:', err);
      const reader = new FileReader();
      reader.onload = () => {
        setPassportPhoto(reader.result as string);
      };
      reader.readAsDataURL(file);
    } finally {
      setIsPhotoLoading(false);
    }
  };

  const handleRemovePhoto = () => {
    setPassportPhoto('');
    setPhotoFileName('');
    setPhotoFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Form Validation
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!passportPhoto) {
      newErrors.passportPhoto = lang === 'bn' ? 'পাসপোর্ট সাইজের ছবি আপলোড করা আবশ্যক।' : 'Passport size photo is required.';
    }

    if (!fullName.trim()) {
      newErrors.fullName = lang === 'bn' ? 'আবেদনকারীর পূর্ণ নাম লিখুন।' : "Applicant's full name is required.";
    }

    if (!fatherOrHusbandName.trim()) {
      newErrors.fatherOrHusbandName = lang === 'bn' ? 'পিতা অথবা স্বামীর নাম লিখুন।' : "Father's or Husband's name is required.";
    }

    if (!motherName.trim()) {
      newErrors.motherName = lang === 'bn' ? 'মাতার নাম লিখুন।' : "Mother's name is required.";
    }

    if (!dateOfBirth.trim()) {
      newErrors.dateOfBirth = lang === 'bn' ? 'জন্ম তারিখ নির্বাচন বা লিখুন।' : 'Date of birth is required.';
    }

    if (!gender) {
      newErrors.gender = lang === 'bn' ? 'লিঙ্গ নির্বাচন করুন।' : 'Please select gender.';
    }

    if (!bloodGroup) {
      newErrors.bloodGroup = lang === 'bn' ? 'রক্তের গ্রুপ নির্বাচন করুন।' : 'Please select blood group.';
    }

    if (!nidOrBirthCertificate.trim()) {
      newErrors.nidOrBirthCertificate = lang === 'bn' ? 'জাতীয় পরিচয়পত্র (NID) বা জন্ম নিবন্ধন নম্বর লিখুন।' : 'National ID or Birth Certificate number is required.';
    } else if (nidOrBirthCertificate.trim().length < 10) {
      newErrors.nidOrBirthCertificate = lang === 'bn' ? 'সঠিক NID বা জন্ম নিবন্ধন নম্বর দিন (কমপক্ষে ১০ ডিজিট)।' : 'Please provide a valid NID or Birth Certificate number (min 10 digits).';
    }

    if (!contactNumber.trim()) {
      newErrors.contactNumber = lang === 'bn' ? 'যোগাযোগের মোবাইল নম্বর লিখুন।' : 'Mobile number is required.';
    } else if (!/^01[3-9]\d{8}$/.test(contactNumber.replace(/[\s-]/g, '')) && contactNumber.length < 11) {
      newErrors.contactNumber = lang === 'bn' ? '১১ ডিজিটের সঠিক মোবাইল নম্বর দিন (যেমন: 017XXXXXXXX)।' : 'Please enter a valid 11-digit mobile number.';
    }

    if (!presentVillage.trim()) {
      newErrors.presentVillage = lang === 'bn' ? 'বর্তমান গ্রাম/এলাকার নাম দিন।' : 'Present village/area is required.';
    }
    if (!presentThana.trim()) {
      newErrors.presentThana = lang === 'bn' ? 'বর্তমান থানা/উপজেলা দিন।' : 'Present thana/upazila is required.';
    }
    if (!presentDistrict.trim()) {
      newErrors.presentDistrict = lang === 'bn' ? 'বর্তমান জেলা নির্বাচন করুন।' : 'Please select present district.';
    }

    if (!sameAsPresent) {
      if (!permanentVillage.trim()) {
        newErrors.permanentVillage = lang === 'bn' ? 'স্থায়ী গ্রাম/এলাকার নাম দিন।' : 'Permanent village/area is required.';
      }
      if (!permanentThana.trim()) {
        newErrors.permanentThana = lang === 'bn' ? 'স্থায়ী থানা/উপজেলা দিন।' : 'Permanent thana/upazila is required.';
      }
      if (!permanentDistrict.trim()) {
        newErrors.permanentDistrict = lang === 'bn' ? 'স্থায়ী জেলা নির্বাচন করুন।' : 'Please select permanent district.';
      }
    }

    if (!declarationAgreed) {
      newErrors.declarationAgreed = lang === 'bn' ? 'অঙ্গীকারনামায় সম্মতি প্রদান করুন।' : 'Please agree to the declaration statement.';
    }

    setErrors(newErrors);

    if (Object.keys(newErrors).length > 0) {
      const firstKey = Object.keys(newErrors)[0];
      const el = document.getElementById(`field-${firstKey}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return false;
    }

    return true;
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const year = new Date().getFullYear();
      const randomSuffix = Math.floor(10000 + Math.random() * 90000);
      const uniqueAppId = `JMD-PUJA-${year}-${randomSuffix}`;

      let finalPhotoUrl = passportPhoto;
      if (photoFile) {
        finalPhotoUrl = await uploadFileToSupabaseStorage(
          'avatars',
          photoFile,
          photoFileName || photoFile.name,
          'puja_gift_photos'
        );
      } else if (passportPhoto && isLocalTransientUrl(passportPhoto)) {
        finalPhotoUrl = await uploadFileToSupabaseStorage(
          'avatars',
          passportPhoto,
          photoFileName || 'passport_photo.jpg',
          'puja_gift_photos'
        );
      }

      const applicationData: PujaGiftApplication = {
        id: uniqueAppId,
        applicantUid: currentUser?.memberUID || currentUser?.uniqueId || `PRO-${randomSuffix}`,
        userId: currentUser?.id,
        passportPhoto: finalPhotoUrl,
        fullName: fullName.trim(),
        fatherOrHusbandName: fatherOrHusbandName.trim(),
        motherName: motherName.trim(),
        dateOfBirth: dateOfBirth.trim(),
        gender: gender as 'Male' | 'Female' | 'Other',
        bloodGroup,
        nidOrBirthCertificate: nidOrBirthCertificate.trim(),
        contactNumber: contactNumber.trim(),
        presentAddress: {
          villageArea: presentVillage.trim(),
          thanaUpazila: presentThana.trim(),
          district: presentDistrict.trim()
        },
        permanentAddress: {
          villageArea: (sameAsPresent ? presentVillage : permanentVillage).trim(),
          thanaUpazila: (sameAsPresent ? presentThana : permanentThana).trim(),
          district: (sameAsPresent ? presentDistrict : permanentDistrict).trim()
        },
        declarationNotes: declarationNotes.trim(),
        status: 'Pending',
        appliedAt: new Date().toISOString()
      };

      const res = await databaseService.submitPujaGiftApplication(applicationData);

      if (res.success) {
        setSubmittedApp(applicationData);
        if (onSuccess) {
          onSuccess(applicationData);
        }
      } else {
        alert(lang === 'bn' ? 'আবেদন জমা দিতে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।' : 'Failed to submit application. Please try again.');
      }
    } catch (err) {
      console.error('Submission error:', err);
      alert(lang === 'bn' ? 'আবেদন প্রক্রিয়াকরণে সমস্যা হয়েছে।' : 'Error processing application.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (submittedApp) {
    return (
      <div className="w-full bg-[#fdfbfb] min-h-screen py-6 px-3 sm:px-6 animate-in fade-in duration-300">
        <div className="max-w-xl mx-auto bg-white rounded-3xl shadow-xl border border-emerald-100 overflow-hidden print:shadow-none print:border-none print:m-0">
          <div className="bg-[#0A6A32] text-white p-5 sm:p-6 relative text-center">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="absolute left-4 top-4 bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition cursor-pointer print:hidden"
                title={lang === 'bn' ? 'ফিরে যান' : 'Go back'}
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            <div className="w-14 h-14 bg-white text-[#0A6A32] rounded-2xl flex items-center justify-center mx-auto shadow-md mb-2.5">
              <Gift className="w-7 h-7 stroke-[2.5]" />
            </div>

            <span className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider mb-1">
              <Sparkles className="w-3 h-3 fill-slate-950" />
              {lang === 'bn' ? 'আবেদন সফলভাবে গৃহীত হয়েছে' : 'Application Received'}
            </span>

            <h2 className="text-lg sm:text-xl font-black text-white">
              {lang === 'bn' ? 'পূজা উপহার আবেদন রশিদ' : 'Puja Gift Application Slip'}
            </h2>
            <p className="text-xs text-emerald-100 font-medium mt-0.5">
              {lang === 'bn' ? 'ঝাদিমাদি ডটকম সেবাদাতা কল্যাণ কর্মসূচি' : 'Jhadimadi.com Service Provider Welfare Program'}
            </p>
          </div>

          <div className="p-5 sm:p-6 space-y-5 text-left">
            <div className="bg-emerald-50 border-2 border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div>
                <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-wide">
                  {lang === 'bn' ? 'আবেদন ট্র্যাকিং নম্বর (Application ID)' : 'Application Tracking ID'}
                </p>
                <p className="text-base sm:text-lg font-mono font-black text-[#0A6A32]">
                  {submittedApp.id}
                </p>
                <p className="text-[11px] text-gray-500 font-medium">
                  {lang === 'bn' ? 'তারিখ: ' : 'Date: '}
                  {new Date(submittedApp.appliedAt).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric'
                  })}
                </p>
              </div>

              <div className="shrink-0">
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#0A6A32] text-white text-xs font-bold rounded-xl shadow-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                  <span>{lang === 'bn' ? 'যাচাইকরণ প্রক্রিয়াধীন' : 'Under Review'}</span>
                </span>
              </div>
            </div>

            <div className="border border-gray-200 rounded-2xl p-4 bg-gray-50/60 flex items-start gap-4">
              <div className="relative shrink-0">
                <img
                  src={submittedApp.passportPhoto}
                  alt={submittedApp.fullName}
                  className="w-20 h-24 sm:w-24 sm:h-28 object-cover rounded-xl border-2 border-[#0A6A32] shadow-sm bg-white"
                />
                <span className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-[#0A6A32] text-white text-[8px] font-black px-1.5 py-0.2 rounded-full whitespace-nowrap">
                  {submittedApp.bloodGroup}
                </span>
              </div>

              <div className="min-w-0 flex-1 space-y-1">
                <h3 className="text-base font-black text-gray-900 leading-tight">
                  {submittedApp.fullName}
                </h3>
                <p className="text-xs text-gray-600 font-medium">
                  <span className="font-bold text-gray-700">{lang === 'bn' ? 'পিতা/স্বামী: ' : 'Father/Husband: '}</span>
                  {submittedApp.fatherOrHusbandName}
                </p>
                <p className="text-xs text-gray-600 font-medium">
                  <span className="font-bold text-gray-700">{lang === 'bn' ? 'মাতা: ' : 'Mother: '}</span>
                  {submittedApp.motherName}
                </p>
                <p className="text-xs text-gray-600 font-medium">
                  <span className="font-bold text-gray-700">{lang === 'bn' ? 'জন্ম তারিখ: ' : 'DOB: '}</span>
                  {submittedApp.dateOfBirth} ({submittedApp.gender === 'Male' ? (lang === 'bn' ? 'পুরুষ' : 'Male') : submittedApp.gender === 'Female' ? (lang === 'bn' ? 'মহিলা' : 'Female') : (lang === 'bn' ? 'অন্যান্য' : 'Other')})
                </p>
                <p className="text-xs text-gray-600 font-medium flex items-center gap-1 truncate">
                  <MapPin className="w-3.5 h-3.5 text-[#0A6A32] shrink-0" />
                  <span>{submittedApp.presentAddress.thanaUpazila}, {submittedApp.presentAddress.district}</span>
                </p>
              </div>
            </div>

            <div className="bg-amber-50/80 border border-amber-200/80 rounded-2xl p-3 flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900 font-medium leading-relaxed">
                {lang === 'bn' 
                  ? 'আপনার জাতীয় পরিচয়পত্র (NID) এবং মোবাইল নম্বর গোপন রাখা হয়েছে। উৎসব উপহার বিতরণের পূর্বে যাচাইকারী দল আপনার সাথে যোগাযোগ করবে।' 
                  : 'Your National ID and mobile number are securely protected. Our verification team will reach out to you before gift dispatch.'}
              </p>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row items-center gap-3 print:hidden">
              <button
                type="button"
                onClick={handlePrint}
                className="w-full sm:flex-1 py-3 bg-white hover:bg-gray-50 border-2 border-[#0A6A32] text-[#0A6A32] font-black text-xs sm:text-sm rounded-2xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>{lang === 'bn' ? 'রশিদ প্রিন্ট বা সংরক্ষণ করুন' : 'Print / Save Receipt'}</span>
              </button>

              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="w-full sm:flex-1 py-3 bg-[#0A6A32] hover:bg-emerald-800 text-white font-black text-xs sm:text-sm rounded-2xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>{lang === 'bn' ? 'ড্যাশবোর্ডে ফিরে যান' : 'Return to Dashboard'}</span>
                </button>
              )}
            </div>

            <div className="text-center pt-2 print:hidden">
              <button
                type="button"
                onClick={() => {
                  setSubmittedApp(null);
                  setPassportPhoto('');
                  setFatherOrHusbandName('');
                  setMotherName('');
                  setDeclarationNotes('');
                }}
                className="text-xs text-gray-500 hover:text-[#0A6A32] underline font-bold cursor-pointer"
              >
                {lang === 'bn' ? 'আরেকটি নতুন আবেদন জমা দিন' : 'Submit another application'}
              </button>
            </div>
          </div>

          <div className="bg-gray-50 p-4 border-t border-gray-100 text-center text-[11px] text-gray-500">
            Jhadimadi.com Hyperlocal Welfare Initiative • Empowering Local Service Heroes
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-[#fdfbfb] min-h-screen py-4 sm:py-6 px-3 sm:px-4 flex justify-center text-left">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-sm sm:shadow-lg border border-gray-200/80 overflow-hidden">
        
        {/* HEADER SECTION */}
        <header className="bg-[#0A6A32] text-white p-4 sm:p-5 relative">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              {onBack && (
                <button
                  type="button"
                  onClick={onBack}
                  className="bg-white/20 hover:bg-white/30 text-white rounded-full p-2 transition cursor-pointer shrink-0"
                  title={lang === 'bn' ? 'ফিরে যান' : 'Go back'}
                  id="btn-header-back"
                >
                  <ArrowLeft className="w-4 h-4" />
                </button>
              )}
              
              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="bg-amber-400 text-slate-950 text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    {lang === 'bn' ? 'উৎসব কল্যাণ প্যাকেজ' : 'Festival Welfare'}
                  </span>
                  <span className="text-[10px] text-emerald-200 font-medium">
                    {lang === 'bn' ? 'সেবা প্রদানকারীদের জন্য' : 'For Service Providers'}
                  </span>
                </div>
                <h1 className="text-base sm:text-xl font-black text-white leading-tight mt-0.5 truncate" id="puja-form-title">
                  {lang === 'bn' ? 'পূজা উপহার আবেদন ফর্ম' : 'Puja Gift Application Form'}
                </h1>
              </div>
            </div>

            <div className="shrink-0 flex items-center bg-black/20 p-0.5 rounded-xl border border-white/20">
              <button
                type="button"
                onClick={() => setLang('bn')}
                className={`px-2.5 py-1 text-xs font-black rounded-lg transition cursor-pointer ${
                  lang === 'bn'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
                id="btn-lang-bn"
              >
                বাংলা
              </button>
              <button
                type="button"
                onClick={() => setLang('en')}
                className={`px-2.5 py-1 text-xs font-black rounded-lg transition cursor-pointer ${
                  lang === 'en'
                    ? 'bg-amber-400 text-slate-950 shadow-xs'
                    : 'text-white/80 hover:text-white'
                }`}
                id="btn-lang-en"
              >
                English
              </button>
            </div>
          </div>

          <p className="text-[11px] sm:text-xs text-emerald-100 font-medium mt-2 leading-relaxed">
            {lang === 'bn'
              ? 'ঝাদিমাদি ডটকম-এর নিবন্ধিত সেবা প্রদানকারী ও দক্ষ কারিগরদের জন্য উৎসব উপহার ও বিশেষ কল্যাণ অনুদান গ্রহণের আবেদন পত্র।'
              : 'Official intake form for registered service providers to receive special festival gifts and welfare packages from Jhadimadi.com.'}
          </p>
        </header>

        {/* FORM BODY */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5" noValidate>
          
          {/* 1. PASSPORT SIZE PHOTO UPLOAD */}
          <div 
            id="field-passportPhoto" 
            className={`p-4 rounded-2xl border-2 transition-all ${
              errors.passportPhoto ? 'border-red-400 bg-red-50/40' : 'border-emerald-100 bg-emerald-50/30'
            }`}
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-2.5">
              <div>
                <label className="block text-xs sm:text-sm font-black text-gray-900 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-[#0A6A32]" />
                  <span>
                    {lang === 'bn' ? 'পাসপোর্ট সাইজের ছবি আপলোড' : 'Passport Size Photo Upload'}
                  </span>
                  <span className="text-red-500 font-bold">*</span>
                </label>
                <p className="text-[11px] text-gray-500 font-medium">
                  {lang === 'bn' 
                    ? 'ছবিটি আপলোড করার সাথে সাথেই এখানে প্রিভিউ দেখা যাবে' 
                    : 'Preview will appear here immediately after uploading file'}
                </p>
              </div>

              <span className="text-[10px] font-bold text-[#0A6A32] bg-white border border-emerald-200 px-2 py-0.5 rounded-full">
                {lang === 'bn' ? 'অনুপাত ১:১ বা পাসপোর্ট সাইজ' : 'Passport Size (1:1 / 4:5)'}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-1">
              <div className="relative group shrink-0">
                <div className="w-28 h-32 sm:w-32 sm:h-36 rounded-2xl border-2 border-dashed border-[#0A6A32] bg-white overflow-hidden flex flex-col items-center justify-center relative shadow-sm">
                  {isPhotoLoading ? (
                    <div className="flex flex-col items-center gap-1 text-[#0A6A32] p-2 text-center">
                      <div className="w-6 h-6 border-2 border-[#0A6A32] border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-[10px] font-bold">
                        {lang === 'bn' ? 'প্রসেসিং হচ্ছে...' : 'Processing...'}
                      </span>
                    </div>
                  ) : passportPhoto ? (
                    <>
                      <img
                        src={passportPhoto}
                        alt="Passport Preview"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="p-1.5 bg-white text-[#0A6A32] rounded-xl shadow-xs hover:bg-emerald-50 cursor-pointer"
                          title={lang === 'bn' ? 'ছবি পরিবর্তন করুন' : 'Change photo'}
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          className="p-1.5 bg-red-600 text-white rounded-xl shadow-xs hover:bg-red-700 cursor-pointer"
                          title={lang === 'bn' ? 'ছবি মুছে ফেলুন' : 'Remove photo'}
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center gap-1 text-gray-400 p-2 text-center">
                      <User className="w-10 h-10 text-gray-300 stroke-[1.5]" />
                      <span className="text-[9.5px] font-bold text-gray-400 leading-tight">
                        {lang === 'bn' ? 'ছবি প্রিভিউ ফ্রেম' : 'Photo Preview'}
                      </span>
                    </div>
                  )}
                </div>

                {passportPhoto && (
                  <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-[#0A6A32] text-white text-[8.5px] font-black px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1 whitespace-nowrap">
                    <Check className="w-2.5 h-2.5 stroke-[3]" />
                    <span>{lang === 'bn' ? 'ছবি প্রস্তুত' : 'Ready'}</span>
                  </span>
                )}
              </div>

              <div className="flex-1 w-full space-y-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/jpg"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="passport-photo-file-input"
                />

                <div 
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-gray-300 hover:border-[#0A6A32] bg-white hover:bg-emerald-50/20 rounded-2xl p-4 text-center cursor-pointer transition-all group"
                >
                  <Upload className="w-6 h-6 text-[#0A6A32] mx-auto group-hover:scale-110 transition-transform mb-1" />
                  <p className="text-xs font-black text-gray-800">
                    {lang === 'bn' ? 'ফাইল নির্বাচন করুন (Choose File)' : 'Choose File or Click to Upload'}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-0.5">
                    {photoFileName 
                      ? photoFileName 
                      : (lang === 'bn' ? 'কোন ফাইল নির্বাচন করা হয়নি (No file chosen)' : 'No file chosen')}
                  </p>
                  <span className="inline-block mt-2 text-[9px] font-bold text-[#0A6A32] bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                    {lang === 'bn' ? 'ক্যামেরা বা গ্যালারি থেকে ছবি নিন' : 'Select from Camera or Gallery'}
                  </span>
                </div>

                {errors.passportPhoto && (
                  <p className="text-xs font-bold text-red-600 flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{errors.passportPhoto}</span>
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* 2. APPLICANT'S FULL NAME */}
          <div id="field-fullName" className="space-y-1">
            <label className="block text-xs sm:text-sm font-bold text-gray-800">
              {lang === 'bn' ? 'আবেদনকারীর পূর্ণ নাম (Full Name)' : "Applicant's Full Name"} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={lang === 'bn' ? 'আপনার পূর্ণ নাম লিখুন' : 'Enter your full name'}
                className={`w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm bg-gray-50/50 border rounded-xl focus:outline-none focus:ring-2 transition-all font-medium text-gray-900 ${
                  errors.fullName ? 'border-red-400 focus:ring-red-200 bg-red-50/20' : 'border-gray-300 focus:ring-emerald-200 focus:border-[#0A6A32]'
                }`}
              />
            </div>
            {errors.fullName && (
              <p className="text-[11px] font-bold text-red-600 flex items-center gap-1 mt-0.5">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.fullName}</span>
              </p>
            )}
          </div>

          {/* 3. FATHER OR HUSBAND NAME */}
          <div id="field-fatherOrHusbandName" className="space-y-1">
            <label className="block text-xs sm:text-sm font-bold text-gray-800">
              {lang === 'bn' ? 'পিতা অথবা স্বামীর নাম (Father/Husband Name)' : "Father's or Husband's Name"} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={fatherOrHusbandName}
                onChange={(e) => setFatherOrHusbandName(e.target.value)}
                placeholder={lang === 'bn' ? 'পিতা বা স্বামীর নাম লিখুন' : "Enter father's or husband's name"}
                className={`w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm bg-gray-50/50 border rounded-xl focus:outline-none focus:ring-2 transition-all font-medium text-gray-900 ${
                  errors.fatherOrHusbandName ? 'border-red-400 focus:ring-red-200 bg-red-50/20' : 'border-gray-300 focus:ring-emerald-200 focus:border-[#0A6A32]'
                }`}
              />
            </div>
            {errors.fatherOrHusbandName && (
              <p className="text-[11px] font-bold text-red-600 flex items-center gap-1 mt-0.5">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.fatherOrHusbandName}</span>
              </p>
            )}
          </div>

          {/* 4. MOTHER'S NAME */}
          <div id="field-motherName" className="space-y-1">
            <label className="block text-xs sm:text-sm font-bold text-gray-800">
              {lang === 'bn' ? 'মাতার নাম (Mother Name)' : "Mother's Name"} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
                placeholder={lang === 'bn' ? 'মাতার নাম লিখুন' : "Enter mother's name"}
                className={`w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm bg-gray-50/50 border rounded-xl focus:outline-none focus:ring-2 transition-all font-medium text-gray-900 ${
                  errors.motherName ? 'border-red-400 focus:ring-red-200 bg-red-50/20' : 'border-gray-300 focus:ring-emerald-200 focus:border-[#0A6A32]'
                }`}
              />
            </div>
            {errors.motherName && (
              <p className="text-[11px] font-bold text-red-600 flex items-center gap-1 mt-0.5">
                <AlertCircle className="w-3 h-3 shrink-0" />
                <span>{errors.motherName}</span>
              </p>
            )}
          </div>

          {/* 5. DOB, GENDER & BLOOD GROUP */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* DOB */}
            <div id="field-dateOfBirth" className="space-y-1">
              <label className="block text-xs font-bold text-gray-800">
                {lang === 'bn' ? 'জন্ম তারিখ (DOB)' : 'Date of Birth'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Calendar className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className={`w-full pl-10 pr-3 py-2.5 text-xs bg-gray-50/50 border rounded-xl focus:outline-none focus:ring-2 transition-all font-medium text-gray-900 ${
                    errors.dateOfBirth ? 'border-red-400 focus:ring-red-200 bg-red-50/20' : 'border-gray-300 focus:ring-emerald-200 focus:border-[#0A6A32]'
                  }`}
                />
              </div>
              {errors.dateOfBirth && (
                <p className="text-[10px] font-bold text-red-600">{errors.dateOfBirth}</p>
              )}
            </div>

            {/* Gender */}
            <div id="field-gender" className="space-y-1">
              <label className="block text-xs font-bold text-gray-800">
                {lang === 'bn' ? 'লিঙ্গ (Gender)' : 'Gender'} <span className="text-red-500">*</span>
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value as any)}
                className={`w-full px-3 py-2.5 text-xs bg-gray-50/50 border rounded-xl focus:outline-none focus:ring-2 transition-all font-medium text-gray-900 ${
                  errors.gender ? 'border-red-400 focus:ring-red-200 bg-red-50/20' : 'border-gray-300 focus:ring-emerald-200 focus:border-[#0A6A32]'
                }`}
              >
                <option value="">{lang === 'bn' ? 'নির্বাচন করুন' : 'Select'}</option>
                <option value="Male">{lang === 'bn' ? 'পুরুষ (Male)' : 'Male'}</option>
                <option value="Female">{lang === 'bn' ? 'মহিলা (Female)' : 'Female'}</option>
                <option value="Other">{lang === 'bn' ? 'অন্যান্য (Other)' : 'Other'}</option>
              </select>
              {errors.gender && (
                <p className="text-[10px] font-bold text-red-600">{errors.gender}</p>
              )}
            </div>

            {/* Blood Group */}
            <div id="field-bloodGroup" className="space-y-1">
              <label className="block text-xs font-bold text-gray-800 flex items-center gap-1">
                <Droplet className="w-3.5 h-3.5 text-red-500" />
                <span>{lang === 'bn' ? 'রক্তের গ্রুপ' : 'Blood Group'}</span> <span className="text-red-500">*</span>
              </label>
              <select
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                className={`w-full px-3 py-2.5 text-xs bg-gray-50/50 border rounded-xl focus:outline-none focus:ring-2 transition-all font-medium text-gray-900 ${
                  errors.bloodGroup ? 'border-red-400 focus:ring-red-200 bg-red-50/20' : 'border-gray-300 focus:ring-emerald-200 focus:border-[#0A6A32]'
                }`}
              >
                <option value="">{lang === 'bn' ? 'গ্রুপ বাছুন' : 'Select Group'}</option>
                {BLOOD_GROUPS.map((bg) => (
                  <option key={bg} value={bg}>{bg}</option>
                ))}
              </select>
              {errors.bloodGroup && (
                <p className="text-[10px] font-bold text-red-600">{errors.bloodGroup}</p>
              )}
            </div>
          </div>

          {/* 6. NID & CONTACT NUMBER */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div id="field-nidOrBirthCertificate" className="space-y-1">
              <label className="block text-xs sm:text-sm font-bold text-gray-800">
                {lang === 'bn' ? 'NID / জন্ম নিবন্ধন নম্বর' : 'NID or Birth Cert. No'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <ShieldCheck className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={nidOrBirthCertificate}
                  onChange={(e) => setNidOrBirthCertificate(e.target.value)}
                  placeholder={lang === 'bn' ? '১০/১৭ ডিজিটের নম্বর' : '10 or 17 digit number'}
                  className={`w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm bg-gray-50/50 border rounded-xl focus:outline-none focus:ring-2 transition-all font-medium text-gray-900 ${
                    errors.nidOrBirthCertificate ? 'border-red-400 focus:ring-red-200 bg-red-50/20' : 'border-gray-300 focus:ring-emerald-200 focus:border-[#0A6A32]'
                  }`}
                />
              </div>
              {errors.nidOrBirthCertificate && (
                <p className="text-[11px] font-bold text-red-600">{errors.nidOrBirthCertificate}</p>
              )}
            </div>

            <div id="field-contactNumber" className="space-y-1">
              <label className="block text-xs sm:text-sm font-bold text-gray-800">
                {lang === 'bn' ? 'মোবাইল নম্বর (Mobile)' : 'Contact Number'} <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={contactNumber}
                  onChange={(e) => setContactNumber(e.target.value)}
                  placeholder="017XXXXXXXX"
                  className={`w-full pl-10 pr-3 py-2.5 text-xs sm:text-sm bg-gray-50/50 border rounded-xl focus:outline-none focus:ring-2 transition-all font-medium text-gray-900 ${
                    errors.contactNumber ? 'border-red-400 focus:ring-red-200 bg-red-50/20' : 'border-gray-300 focus:ring-emerald-200 focus:border-[#0A6A32]'
                  }`}
                />
              </div>
              {errors.contactNumber && (
                <p className="text-[11px] font-bold text-red-600">{errors.contactNumber}</p>
              )}
            </div>
          </div>

          {/* 7. PRESENT ADDRESS */}
          <div className="border border-emerald-100 bg-emerald-50/20 rounded-2xl p-4 space-y-3">
            <h3 className="text-xs sm:text-sm font-black text-[#0A6A32] flex items-center gap-1.5 uppercase tracking-wide">
              <MapPin className="w-4 h-4" />
              <span>{lang === 'bn' ? 'বর্তমান ঠিকানা (Present Address)' : 'Present Address'}</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div id="field-presentVillage" className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-700">
                  {lang === 'bn' ? 'গ্রাম / পাড়া / মহল্লা' : 'Village / Area'} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={presentVillage}
                  onChange={(e) => setPresentVillage(e.target.value)}
                  placeholder={lang === 'bn' ? 'গ্রামের নাম' : 'Village/Area'}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-[#0A6A32]"
                />
              </div>

              <div id="field-presentThana" className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-700">
                  {lang === 'bn' ? 'থানা / উপজেলা' : 'Thana / Upazila'} <span className="text-red-500">*</span>
                </label>
                <select
                  value={presentThana}
                  onChange={(e) => setPresentThana(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-[#0A6A32]"
                >
                  <option value="">{lang === 'bn' ? 'উপজেলা বাছুন' : 'Select Upazila'}</option>
                  {presentUpazilaOptions.map((u, i) => (
                    <option key={i} value={u.nameBn}>{u.nameBn}</option>
                  ))}
                  {presentThana && !presentUpazilaOptions.find(u => u.nameBn === presentThana) && (
                    <option value={presentThana}>{presentThana}</option>
                  )}
                </select>
              </div>

              <div id="field-presentDistrict" className="space-y-1">
                <label className="block text-[11px] font-bold text-gray-700">
                  {lang === 'bn' ? 'জেলা (District)' : 'District'} <span className="text-red-500">*</span>
                </label>
                <select
                  value={presentDistrict}
                  onChange={(e) => setPresentDistrict(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-[#0A6A32]"
                >
                  <option value="">{lang === 'bn' ? 'জেলা বাছুন' : 'Select District'}</option>
                  {allDistricts.map((d, i) => (
                    <option key={i} value={d.nameBn}>{d.nameBn}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* 8. PERMANENT ADDRESS */}
          <div className="border border-gray-200 bg-gray-50/50 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs sm:text-sm font-black text-gray-800 flex items-center gap-1.5 uppercase tracking-wide">
                <MapPin className="w-4 h-4 text-gray-500" />
                <span>{lang === 'bn' ? 'স্থায়ী ঠিকানা (Permanent Address)' : 'Permanent Address'}</span>
              </h3>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sameAsPresent}
                  onChange={(e) => setSameAsPresent(e.target.checked)}
                  className="w-4 h-4 accent-[#0A6A32] rounded cursor-pointer"
                />
                <span className="text-xs font-bold text-gray-700">
                  {lang === 'bn' ? 'বর্তমান ঠিকানার অনুরূপ' : 'Same as present'}
                </span>
              </label>
            </div>

            {!sameAsPresent && (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
                <div id="field-permanentVillage" className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-700">
                    {lang === 'bn' ? 'গ্রাম / পাড়া / মহল্লা' : 'Village / Area'} <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={permanentVillage}
                    onChange={(e) => setPermanentVillage(e.target.value)}
                    placeholder={lang === 'bn' ? 'গ্রামের নাম' : 'Village/Area'}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-[#0A6A32]"
                  />
                </div>

                <div id="field-permanentThana" className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-700">
                    {lang === 'bn' ? 'থানা / উপজেলা' : 'Thana / Upazila'} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={permanentThana}
                    onChange={(e) => setPermanentThana(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-[#0A6A32]"
                  >
                    <option value="">{lang === 'bn' ? 'উপজেলা বাছুন' : 'Select Upazila'}</option>
                    {permanentUpazilaOptions.map((u, i) => (
                      <option key={i} value={u.nameBn}>{u.nameBn}</option>
                    ))}
                  </select>
                </div>

                <div id="field-permanentDistrict" className="space-y-1">
                  <label className="block text-[11px] font-bold text-gray-700">
                    {lang === 'bn' ? 'জেলা (District)' : 'District'} <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={permanentDistrict}
                    onChange={(e) => setPermanentDistrict(e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-[#0A6A32]"
                  >
                    <option value="">{lang === 'bn' ? 'জেলা বাছুন' : 'Select District'}</option>
                    {allDistricts.map((d, i) => (
                      <option key={i} value={d.nameBn}>{d.nameBn}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* 9. DECLARATION & NOTES */}
          <div className="space-y-2">
            <label className="block text-xs sm:text-sm font-bold text-gray-800">
              {lang === 'bn' ? 'বিশেষ মন্তব্য বা নোট (ঐচ্ছিক)' : 'Additional Notes (Optional)'}
            </label>
            <textarea
              rows={2}
              value={declarationNotes}
              onChange={(e) => setDeclarationNotes(e.target.value)}
              placeholder={lang === 'bn' ? 'আপনার কোনো বিশেষ বক্তব্য থাকলে এখানে লিখুন...' : 'Write any specific note here...'}
              className="w-full px-3 py-2.5 text-xs sm:text-sm bg-gray-50/50 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-[#0A6A32]"
            ></textarea>
          </div>

          {/* AGREEMENT CHECKBOX */}
          <div id="field-declarationAgreed" className="flex items-start gap-2.5 pt-1">
            <input
              type="checkbox"
              id="declarationCheck"
              checked={declarationAgreed}
              onChange={(e) => setDeclarationAgreed(e.target.checked)}
              className="w-4 h-4 mt-0.5 accent-[#0A6A32] rounded cursor-pointer shrink-0"
            />
            <label htmlFor="declarationCheck" className="text-xs text-gray-700 font-medium cursor-pointer leading-relaxed">
              {lang === 'bn'
                ? 'আমি ঘোষণা করছি যে উপরে প্রদত্ত সকল তথ্য সত্য এবং নির্ভুল। ঝাদিমাদি ডটকম কতৃপক্ষ চাইলে আমার তথ্য যাচাই করতে পারে।'
                : 'I declare that all information provided above is true and accurate. Jhadimadi.com authority can verify my details.'}
            </label>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-3">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="px-5 py-3 text-xs sm:text-sm font-bold text-gray-600 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-[#0A6A32] hover:bg-emerald-800 text-white text-xs sm:text-sm font-black rounded-xl shadow-md transition-all flex items-center gap-2 disabled:opacity-50 cursor-pointer active:scale-95"
              id="btn-submit-application"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>{lang === 'bn' ? 'আবেদন জমা হচ্ছে...' : 'Submitting...'}</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>{lang === 'bn' ? 'আবেদন জমা দিন' : 'Submit Application'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PujaGiftApplicationForm;