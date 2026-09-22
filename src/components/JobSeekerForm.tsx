import React, { useState, useRef } from 'react';
import { supabase } from '../supabase';
import { User, Phone, GraduationCap, Briefcase, Award, MapPin, CheckCircle, AlertCircle, Loader2, Plus, X, Camera, Lock, Eye, EyeOff, Upload, FileText } from 'lucide-react';
import { LOCATION_MASTER } from '../data/locationMaster';
import { generateDistrictUniqueId } from '../utils/uniqueIdGenerator';
import { registerUnifiedEntity, submitFormData } from '../services/unifiedRegistrationService';
import { uploadFileToSupabaseStorage, isLocalTransientUrl } from '../utils/directSupabaseStorage';

export interface JobSeekerFormProps {
  initialData?: any;
  onSuccess?: (candidate: any) => void;
  onCancel?: () => void;
}

export const JobSeekerForm: React.FC<JobSeekerFormProps> = ({ initialData, onSuccess, onCancel }) => {
  const allDistricts = LOCATION_MASTER.flatMap(d => d.districts);
  const [seekerName, setSeekerName] = useState(initialData?.name || initialData?.full_name || '');
  const [seekerPhone, setSeekerPhone] = useState(initialData?.phone || '');
  const [seekerPassword, setSeekerPassword] = useState(initialData?.password || '');
  const [showPassword, setShowPassword] = useState(false);
  const [highestEdu, setHighestEdu] = useState(initialData?.education || 'স্নাতক (Bachelor)');
  const [expYears, setExpYears] = useState(initialData?.experience || '২ বছর');
  const [skillInput, setSkillInput] = useState('');
  const [skillList, setSkillList] = useState<string[]>(
    initialData?.skills || ['কম্পিউটার পরিচালনা', 'কমিউনিকেশন', 'অ্যাকাউন্টিং']
  );
  const [dist, setDist] = useState(initialData?.district || 'খাগড়াছড়ি');
  const [upazilaName, setUpazilaName] = useState(initialData?.upazila || 'খাগড়াছড়ি সদর');
  const [areaName, setAreaName] = useState(initialData?.area || '');
  const [photoUrl, setPhotoUrl] = useState(initialData?.photo_url || initialData?.photo || '');
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string>('');
  const photoInputRef = useRef<HTMLInputElement>(null);

  const [cvFile, setCvFile] = useState<File | null>(null);
  const [cvFileName, setCvFileName] = useState<string>('');
  const cvInputRef = useRef<HTMLInputElement>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const currentDistrictObj = allDistricts.find(d => d.nameBn === dist) || allDistricts[0];
  const upazilas = currentDistrictObj ? currentDistrictObj.upazilas.map(u => u.nameBn) : ['খাগড়াছড়ি সদর'];

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhotoFile(file);
      try {
        const preview = URL.createObjectURL(file);
        setPhotoPreview(preview);
      } catch {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            setPhotoPreview(reader.result);
          }
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const handleCvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCvFile(file);
      setCvFileName(file.name);
    }
  };

  const handleAddSkill = () => {
    if (skillInput.trim() && !skillList.includes(skillInput.trim())) {
      setSkillList([...skillList, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const handleRemoveSkill = (idx: number) => {
    setSkillList(skillList.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!seekerName.trim() || !seekerPhone.trim()) {
      setMessage({ type: 'error', text: 'অনুগ্রহ করে চাকরি প্রার্থীর পূর্ণ নাম এবং ফোন নম্বর প্রদান করুন।' });
      return;
    }

    setIsSubmitting(true);
    try {
      const skillsStr = skillList.join(', ');

      // 1. Direct upload photo to Supabase avatars bucket
      let permanentPhotoUrl = photoUrl.trim();
      if (photoFile) {
        permanentPhotoUrl = await uploadFileToSupabaseStorage(
          'avatars',
          photoFile,
          photoFile.name,
          'job_candidates'
        );
      } else if (photoPreview && isLocalTransientUrl(photoPreview)) {
        permanentPhotoUrl = await uploadFileToSupabaseStorage(
          'avatars',
          photoPreview,
          'candidate_photo.jpg',
          'job_candidates'
        );
      }

      if (!permanentPhotoUrl) {
        permanentPhotoUrl = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
      }

      // 2. Direct upload CV to Supabase documents bucket
      let permanentCvUrl = '';
      if (cvFile) {
        permanentCvUrl = await uploadFileToSupabaseStorage(
          'documents',
          cvFile,
          cvFile.name,
          'candidate_resumes'
        );
      }

      // 3. Unified 2-Step Registration Flow (Supabase Auth -> job_seekers table insertion)
      const unifiedResult = await registerUnifiedEntity({
        role: 'job_seeker',
        fullName: seekerName.trim(),
        phone: seekerPhone.trim(),
        password: seekerPassword.trim() || '123456',
        district: dist,
        upazila: upazilaName,
        area: areaName.trim() || upazilaName,
        avatarUrl: permanentPhotoUrl,
        rolePayload: {
          skills: skillList,
          qualifications: highestEdu,
          highestEducation: highestEdu,
          education: highestEdu,
          experience: expYears,
          desiredJobTitle: skillsStr || 'সাধারণ চাকরিপ্রার্থী',
          cvUrl: permanentCvUrl,
          resumeUrl: permanentCvUrl,
        },
      });

      if (!unifiedResult.success) {
        if (unifiedResult.tableErrors?.includes('duplicate_constraint_23505') || (unifiedResult as any).isDuplicate || (unifiedResult.error && unifiedResult.error.includes('পূর্বেই রেজিস্ট্রেশন করা হয়েছে'))) {
          const dupMsg = 'এই তথ্যটি (ফোন নম্বর/NID/ইমেইল) দিয়ে পূর্বেই রেজিস্ট্রেশন করা হয়েছে। অনুগ্রহ করে অন্য তথ্য দিন।';
          setMessage({ type: 'error', text: dupMsg });
          alert(dupMsg);
          return;
        }
      }

      const finalUid = unifiedResult.uniqueId || generateDistrictUniqueId(dist);

      // Direct insert / sync into Supabase job_seekers table with permanent public URLs
      const seekerDbRes = await submitFormData('job_seekers', {
        unique_id: finalUid,
        candidate_code: finalUid,
        name: seekerName.trim(),
        full_name: seekerName.trim(),
        phone: seekerPhone.trim(),
        skills_or_job_type: skillsStr,
        desired_job_title: skillsStr,
        highest_education: highestEdu,
        education: highestEdu,
        experience: expYears,
        division: 'চট্টগ্রাম',
        district: dist,
        upazila: upazilaName,
        area: areaName.trim() || upazilaName,
        photo_url: permanentPhotoUrl,
        cv_url: permanentCvUrl,
        resume_url: permanentCvUrl,
        status: 'available',
      });

      if (!seekerDbRes.success && (seekerDbRes.isDuplicate || seekerDbRes.errorCode === '23505' || seekerDbRes.error?.includes('পূর্বেই রেজিস্ট্রেশন করা হয়েছে'))) {
        const dupMsg = 'এই তথ্যটি (ফোন নম্বর/NID/ইমেইল) দিয়ে পূর্বেই রেজিস্ট্রেশন করা হয়েছে। অনুগ্রহ করে অন্য তথ্য দিন।';
        setMessage({ type: 'error', text: dupMsg });
        alert(dupMsg);
        return;
      }

      setMessage({ type: 'success', text: `চাকরি প্রার্থীর বায়োডাটা ক্লাউড স্টোরেজ ও ডাটাবেজে সফলভাবে সংরক্ষিত হয়েছে! আইডি: ${finalUid}` });
      // Clear input fields on success
      setSeekerName('');
      setSeekerPhone('');
      setSeekerPassword('');
      setAreaName('');
      setSkillList([]);
      setSkillInput('');
      setPhotoFile(null);
      setPhotoPreview('');
      setCvFile(null);
      setCvFileName('');
      if (onSuccess) {
        onSuccess({
          unique_id: finalUid,
          name: seekerName.trim(),
          phone: seekerPhone.trim(),
          skills_or_job_type: skillsStr,
          district: dist,
          upazila: upazilaName,
          area: areaName.trim() || upazilaName,
          photo_url: permanentPhotoUrl,
          cv_url: permanentCvUrl,
        });
      }
    } catch (err: any) {
      console.error('Job seeker submission error:', err);
      setMessage({ type: 'error', text: 'সার্ভারে সংযোগে সমস্যা দেখা দিয়েছে।' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-5 max-w-2xl mx-auto">
      <div className="border-b border-slate-100 pb-4">
        <h2 className="text-xl font-bold text-slate-800">চাকরি প্রার্থী / বায়োডাটা ফর্ম</h2>
        <p className="text-sm text-slate-500">ঝাদিমাদি জব ব্যাংকে আপনার ক্যারিয়ার প্রোফাইল ও বায়োডাটা জমা দিন</p>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 text-sm ${
          message.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
        }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" /> : <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />}
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">প্রার্থীর পূর্ণ নাম (Full Name) *</label>
          <div className="relative">
            <User className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={seekerName}
              onChange={(e) => setSeekerName(e.target.value)}
              placeholder="যেমন: তানভীর আহমেদ"
              required
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">ফোন নম্বর (Phone) *</label>
          <div className="relative">
            <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type="tel"
              value={seekerPhone}
              onChange={(e) => setSeekerPhone(e.target.value)}
              placeholder="01XXXXXXXXX"
              required
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">পাসওয়ার্ড (Password) *</label>
          <div className="relative">
            <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input
              type={showPassword ? 'text' : 'password'}
              value={seekerPassword}
              onChange={(e) => setSeekerPassword(e.target.value)}
              placeholder="কমপক্ষে ৪-৬ অক্ষরের পাসওয়ার্ড"
              required
              className="w-full pl-9 pr-10 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 focus:outline-none"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">সর্বোচ্চ শিক্ষাগত যোগ্যতা (Education)</label>
          <div className="relative">
            <GraduationCap className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <select
              value={highestEdu}
              onChange={(e) => setHighestEdu(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
            >
              <option value="এসএসসি (SSC)">এসএসসি (SSC)</option>
              <option value="এইচএসসি (HSC)">এইচএসসি (HSC)</option>
              <option value="ডিপ্লোমা (Diploma)">ডিপ্লোমা (Diploma)</option>
              <option value="স্নাতক (Bachelor / Degree)">স্নাতক (Bachelor / Degree)</option>
              <option value="স্নাতকোত্তর (Masters)">স্নাতকোত্তর (Masters)</option>
              <option value="অন্যান্য / কারিগরি">অন্যান্য / কারিগরি</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">অভিজ্ঞতা (Experience)</label>
          <div className="relative">
            <Briefcase className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <select
              value={expYears}
              onChange={(e) => setExpYears(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
            >
              <option value="ফ্রেশার (০ বছর)">ফ্রেশার (০ বছর)</option>
              <option value="১ বছর">১ বছর</option>
              <option value="২ বছর">২ বছর</option>
              <option value="৩-৫ বছর">৩-৫ বছর</option>
              <option value="৫+ বছর">৫+ বছর</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">জেলা (District) *</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <select
              value={dist}
              onChange={(e) => setDist(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
            >
              {allDistricts.map((d, idx) => (
                <option key={idx} value={d.nameBn}>{d.nameBn}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">উপজেলা (Upazila) *</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <select
              value={upazilaName}
              onChange={(e) => setUpazilaName(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none bg-white"
            >
              {upazilas.map((u, idx) => (
                <option key={idx} value={u}>{u}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">দক্ষতাসমূহ (Skills)</label>
        <div className="flex gap-2 mb-2">
          <input
            type="text"
            value={skillInput}
            onChange={(e) => setSkillInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddSkill(); }}}
            placeholder="দক্ষতা লিখুন (যেমন: MS Word, ড্রাইভিং, গ্রাফিক্স)..."
            className="flex-1 px-3 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-none"
          />
          <button
            type="button"
            onClick={handleAddSkill}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition flex items-center gap-1"
          >
            <Plus className="w-4 h-4" /> যোগ করুন
          </button>
        </div>

        <div className="flex flex-wrap gap-1.5 pt-1">
          {skillList.map((skill, idx) => (
            <span key={idx} className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg text-xs font-medium">
              {skill}
              <button
                type="button"
                onClick={() => handleRemoveSkill(idx)}
                className="text-emerald-600 hover:text-emerald-900"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Direct Photo & CV Upload Inputs from Mobile/Computer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
        {/* Candidate Photo */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Camera className="w-3.5 h-3.5 text-emerald-600" />
              প্রার্থীর ছবি (Photo)
            </span>
            <span className="text-[10px] text-emerald-600 font-bold">Supabase avatars</span>
          </label>
          <input
            type="file"
            ref={photoInputRef}
            accept="image/*"
            onChange={handlePhotoChange}
            className="hidden"
            id="seeker-photo-input"
          />
          <button
            type="button"
            onClick={() => photoInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 transition cursor-pointer"
            id="btn-seeker-photo-browse"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            {photoFile ? 'ছবি পরিবর্তন করুন' : 'মোবাইল/পিসি থেকে ছবি বাছুন'}
          </button>
          {(photoPreview || photoUrl) && (
            <div className="mt-2 flex items-center gap-2">
              <img
                src={photoPreview || photoUrl}
                alt="Candidate Preview"
                className="w-10 h-10 rounded-lg object-cover border border-slate-200"
              />
              <span className="text-[11px] text-slate-600 truncate flex-1">
                {photoFile ? photoFile.name : 'ছবি নির্বাচিত'}
              </span>
              <button
                type="button"
                onClick={() => {
                  setPhotoFile(null);
                  setPhotoPreview('');
                  setPhotoUrl('');
                }}
                className="text-rose-500 hover:text-rose-700 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Candidate CV/Resume */}
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
          <label className="block text-xs font-semibold text-slate-700 mb-1.5 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              জীবনবৃত্তান্ত / সিভী (CV)
            </span>
            <span className="text-[10px] text-emerald-600 font-bold">Supabase documents</span>
          </label>
          <input
            type="file"
            ref={cvInputRef}
            accept=".pdf,.doc,.docx,image/*"
            onChange={handleCvChange}
            className="hidden"
            id="seeker-cv-input"
          />
          <button
            type="button"
            onClick={() => cvInputRef.current?.click()}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 transition cursor-pointer"
            id="btn-seeker-cv-browse"
          >
            <Upload className="w-3.5 h-3.5 text-slate-500" />
            {cvFile ? 'সিভী ফাইল পরিবর্তন' : 'সিভী ফাইল আপলোড করুন (PDF/DOC)'}
          </button>
          {cvFile && (
            <div className="mt-2 flex items-center gap-2 bg-white p-1.5 rounded-lg border border-slate-200">
              <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
              <span className="text-[11px] text-slate-700 truncate flex-1 font-medium">
                {cvFileName} ({(cvFile.size / 1024).toFixed(1)} KB)
              </span>
              <button
                type="button"
                onClick={() => {
                  setCvFile(null);
                  setCvFileName('');
                }}
                className="text-rose-500 hover:text-rose-700 p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            বাতিল
          </button>
        )}
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              সংরক্ষণ হচ্ছে...
            </>
          ) : (
            'বায়োডাটা জমা দিন'
          )}
        </button>
      </div>
    </form>
  );
};

export default JobSeekerForm;
