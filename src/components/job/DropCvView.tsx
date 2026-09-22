import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  CheckCircle2, 
  Briefcase, 
  UserCheck, 
  Trash2, 
  Send 
} from 'lucide-react';
import { registerJobCandidate, uploadJobDocument, JOB_CATEGORIES } from '../../services/jobService';
import { UserProfile, JobCandidate } from '../../types';
import { DistrictItem, UpazilaItem } from '../../data/locationMaster';
import { supabase } from '../../supabase';
import { smartSupabaseInsert, prepareJobSeekerPayload } from '../../utils/supabaseDataService';

interface DropCvViewProps {
  lang: 'bn' | 'en';
  currentUser?: UserProfile | null;
  allDistricts: { nameBn: string; nameEn: string; code: string; upazilas: UpazilaItem[]; divisionBn: string }[];
  onNavigateToCandidateList: () => void;
  onNavigateToAllJobs: () => void;
  onShowToast: (msg: string) => void;
}

export const DropCvView: React.FC<DropCvViewProps> = ({
  lang,
  currentUser,
  allDistricts,
  onNavigateToCandidateList,
  onNavigateToAllJobs,
  onShowToast,
}) => {
  // Form fields
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [desiredJobTitle, setDesiredJobTitle] = useState('');
  const [category, setCategory] = useState(JOB_CATEGORIES[0].nameBn);
  const [district, setDistrict] = useState('খাগড়াছড়ি');
  const [upazila, setUpazila] = useState('খাগড়াছড়ি সদর');
  const [highestEducation, setHighestEducation] = useState('স্নাতক / ডিগ্রি');
  const [experienceYears, setExperienceYears] = useState('১');
  const [expectedSalary, setExpectedSalary] = useState('');

  // CV File Upload state
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [uploadedResumeUrl, setUploadedResumeUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<JobCandidate | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Cascading upazilas
  const currentDistrictObj = allDistricts.find(d => d.nameBn === district);
  const availableUpazilas = currentDistrictObj ? currentDistrictObj.upazilas : [];

  const handleProcessFile = async (file: File) => {
    if (file.size > 15 * 1024 * 1024) {
      onShowToast('ফাইলের আকার সর্বোচ্চ ১৫MB হতে পারবে');
      return;
    }

    const validExtensions = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'];
    const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!validExtensions.includes(fileExt)) {
      onShowToast('শুধুমাত্র PDF, DOC, DOCX, PNG এবং JPG ফরম্যাট গ্রহণযোগ্য');
      return;
    }

    setCvFile(file);
    setIsUploading(true);
    try {
      const res = await uploadJobDocument(file, 'resume');
      if (res && res.url) {
        setUploadedResumeUrl(res.url);
        onShowToast('সিভি ফাইল আপলোড সম্পন্ন হয়েছে');
      }
    } catch (err) {
      console.warn('Resume upload warning:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      onShowToast('আপনার পূর্ণ নাম লিখুন');
      return;
    }
    if (!phone.trim()) {
      onShowToast('মোবাইল নাম্বার প্রদান করুন');
      return;
    }
    if (!desiredJobTitle.trim()) {
      onShowToast('আকাঙ্ক্ষিত পেশা বা পদের নাম লিখুন');
      return;
    }

    setIsSubmitting(true);
    try {
      const seekerName = name.trim();
      const seekerPhone = phone.trim();
      const highestEdu = highestEducation;
      const expYears = experienceYears;
      const skillList = [desiredJobTitle.trim()];
      const dist = district;
      const upazilaName = upazila;

      // 1. Direct safe insert to Supabase job_seekers table
      const seekerPayload = prepareJobSeekerPayload({
        name: seekerName,
        full_name: seekerName,
        phone: seekerPhone,
        phone_number: seekerPhone,
        education: highestEdu,
        highest_education: highestEdu,
        experience: expYears,
        skills_or_job_type: desiredJobTitle.trim(),
        desired_job_title: desiredJobTitle.trim(),
        skills: skillList,
        district: dist,
        upazila: upazilaName,
        email: email.trim() || null,
        expected_salary: expectedSalary.trim() || 'আলোচনা সাপেক্ষে',
        selary: expectedSalary.trim() || 'আলোচনা সাপেক্ষে',
        cv_url: uploadedResumeUrl || null,
        resume_url: uploadedResumeUrl || null,
        status: 'available'
      });
      await smartSupabaseInsert('job_seekers', seekerPayload);

      const res = await registerJobCandidate({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        desiredJobTitle: desiredJobTitle.trim(),
        category,
        district,
        upazila,
        highestEducation,
        experienceYears,
        expectedSalary: expectedSalary.trim(),
        resumeUrl: uploadedResumeUrl,
        skills: [desiredJobTitle.trim()],
        status: 'available',
      });

      if (res.success && res.data) {
        setSuccessResult(res.data);
        onShowToast('আপনার জীবনবৃত্তান্ত সফলভাবে জমা হয়েছে!');
      } else {
        onShowToast(res.error || 'সিভি জমা ব্যর্থ হয়েছে');
      }
    } catch (err) {
      console.error('Error submitting CV:', err);
      onShowToast('ত্রুটি দেখা দিয়েছে, পুনরায় চেষ্টা করুন');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetForm = () => {
    setSuccessResult(null);
    setCvFile(null);
    setUploadedResumeUrl('');
    setDesiredJobTitle('');
    setExpectedSalary('');
  };

  return (
    <div className="space-y-4 pt-2" id="drop-cv-view">
      
      {/* Heading on clean solid white background in bold */}
      <div className="bg-white rounded-2xl border border-slate-100 p-4 sm:p-5 shadow-2xs">
        <h2 className="text-base sm:text-lg font-black text-slate-900">
          আপনার জীবনবৃত্তান্ত (CV / Resume) জমা দিন
        </h2>
        <p className="text-xs text-slate-500 font-medium mt-1">
          সহজেই আপনার সিভি আপলোড করুন এবং আকর্ষণীয় চাকরির সুযোগের সাথে যুক্ত হোন।
        </p>
      </div>

      {successResult ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 sm:p-8 text-center space-y-4 shadow-2xs">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black text-slate-900">
              সিভি সফলভাবে জমা হয়েছে!
            </h3>
            <p className="text-xs text-slate-600 max-w-md mx-auto">
              ধন্যবাদ {successResult.name}, আপনার সিভি সংরক্ষিত হয়েছে। ট্র্যাকিং কোড: <span className="font-mono font-bold text-emerald-700">{successResult.candidateCode}</span>
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            <button
              type="button"
              onClick={onNavigateToCandidateList}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <UserCheck className="w-4 h-4 text-amber-300" />
              <span>প্রার্থী তালিকায় দেখুন</span>
            </button>
            <button
              type="button"
              onClick={onNavigateToAllJobs}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition cursor-pointer flex items-center gap-1.5"
            >
              <Briefcase className="w-4 h-4 text-slate-600" />
              <span>সকল চাকরি দেখুন</span>
            </button>
            <button
              type="button"
              onClick={handleResetForm}
              className="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              আরেকটি সিভি জমা দিন
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-6 shadow-2xs space-y-4">
          
          {/* Minimal File Upload Drop Zone */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-slate-800 flex items-center justify-between">
              <span>সিভি ফাইল ড্রপ অথবা সিলেক্ট করুন (PDF, DOC, DOCX, PNG)</span>
              <span className="text-[10px] text-slate-500 font-normal">সর্বোচ্চ ১৫MB</span>
            </label>

            <div 
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-6 text-center transition cursor-pointer ${
                cvFile 
                  ? 'border-emerald-500 bg-emerald-50/30' 
                  : isDragging 
                    ? 'border-emerald-600 bg-emerald-50/50' 
                    : 'border-slate-300 hover:border-emerald-500 bg-slate-50/70'
              }`}
            >
              <input
                type="file"
                id="cv-file-input"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg"
                className="hidden"
              />

              {cvFile ? (
                <div className="flex items-center justify-between gap-3 text-left">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center shrink-0">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-black text-slate-900 truncate">
                        {cvFile.name}
                      </p>
                      <p className="text-[10px] text-emerald-700 font-bold mt-0.5">
                        {isUploading ? 'ফাইল আপলোড হচ্ছে...' : 'আপলোড সম্পন্ন'}
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setCvFile(null);
                      setUploadedResumeUrl('');
                    }}
                    className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label htmlFor="cv-file-input" className="cursor-pointer flex flex-col items-center justify-center space-y-1.5">
                  <div className="w-11 h-11 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-emerald-700" />
                  </div>
                  <p className="text-xs font-bold text-slate-800">
                    এখানে ফাইল টেনে আনুন বা ক্লিক করে ব্রাউজ করুন
                  </p>
                  <p className="text-[10px] text-slate-500">
                    PDF, DOC, DOCX, বা PNG (সর্বোচ্চ ১৫MB)
                  </p>
                </label>
              )}
            </div>
          </div>

          {/* Candidate Form Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                আপনার নাম *
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="পূর্ণ নাম লিখুন"
                className="w-full bg-[#faf9f6] border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                মোবাইল নাম্বার *
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="০১৮XXXXXXXX"
                className="w-full bg-[#faf9f6] border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                আকাঙ্ক্ষিত পেশা / পদের নাম *
              </label>
              <input
                type="text"
                required
                value={desiredJobTitle}
                onChange={(e) => setDesiredJobTitle(e.target.value)}
                placeholder="যেমন: সেলস এক্সিকিউটিভ, ড্রাইভার, শিক্ষক"
                className="w-full bg-[#faf9f6] border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                কাজের ক্যাটাগরি
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#faf9f6] border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-600 focus:outline-none cursor-pointer"
              >
                {JOB_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.nameBn}>
                    {c.nameBn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                জেলা *
              </label>
              <select
                value={district}
                onChange={(e) => {
                  const dName = e.target.value;
                  setDistrict(dName);
                  const dObj = allDistricts.find(d => d.nameBn === dName);
                  if (dObj && dObj.upazilas.length > 0) {
                    setUpazila(dObj.upazilas[0].nameBn);
                  }
                }}
                className="w-full bg-[#faf9f6] border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-600 focus:outline-none cursor-pointer"
              >
                {allDistricts.map((d) => (
                  <option key={d.code} value={d.nameBn}>
                    {d.nameBn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                উপজেলা / এলাকা
              </label>
              <select
                value={upazila}
                onChange={(e) => setUpazila(e.target.value)}
                className="w-full bg-[#faf9f6] border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-600 focus:outline-none cursor-pointer"
              >
                {availableUpazilas.map((u) => (
                  <option key={u.code} value={u.nameBn}>
                    {u.nameBn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                সর্বোচ্চ শিক্ষাগত যোগ্যতা
              </label>
              <input
                type="text"
                value={highestEducation}
                onChange={(e) => setHighestEducation(e.target.value)}
                placeholder="যেমন: এইচএসসি / ডিগ্রি / বিএসসি"
                className="w-full bg-[#faf9f6] border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                প্রত্যাশিত বেতন (ঐচ্ছিক)
              </label>
              <input
                type="text"
                value={expectedSalary}
                onChange={(e) => setExpectedSalary(e.target.value)}
                placeholder="যেমন: ১৫,০০০ টাকা"
                className="w-full bg-[#faf9f6] border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-600 focus:outline-none"
              />
            </div>
          </div>

          {/* Submit button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white font-black text-sm rounded-xl shadow-xs transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <Send className="w-4 h-4 text-amber-300" />
              <span>{isSubmitting ? 'সিভি জমা হচ্ছে...' : 'সিভি জমা দিন'}</span>
            </button>
          </div>

        </form>
      )}

    </div>
  );
};
