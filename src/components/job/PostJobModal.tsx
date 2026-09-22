import React, { useState } from 'react';
import { 
  X, 
  Upload, 
  Building2, 
  FileText, 
  CheckCircle2, 
  Briefcase, 
  Clock, 
  DollarSign, 
  MapPin, 
  Phone, 
  Calendar 
} from 'lucide-react';
import { JobPosting, JobType, UserProfile } from '../../types';
import { createJobPosting, uploadJobDocument, JOB_CATEGORIES, JOB_TYPES } from '../../services/jobService';
import { DistrictItem, UpazilaItem } from '../../data/locationMaster';
import { supabase } from '../../supabase';
import { smartSupabaseInsert, prepareJobCircularPayload, prepareJobPayload } from '../../utils/supabaseDataService';

interface PostJobModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: UserProfile | null;
  allDistricts: { nameBn: string; nameEn: string; code: string; upazilas: UpazilaItem[]; divisionBn: string }[];
  onJobCreated: (job: JobPosting) => void;
  onShowToast: (msg: string) => void;
}

export const PostJobModal: React.FC<PostJobModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  allDistricts,
  onJobCreated,
  onShowToast,
}) => {
  const [postMethod, setPostMethod] = useState<'quick_file' | 'detailed_form'>('detailed_form');
  
  // Detailed form fields
  const [title, setTitle] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [category, setCategory] = useState(JOB_CATEGORIES[0].nameBn);
  const [jobType, setJobType] = useState<JobType>('Full-time');
  const [salary, setSalary] = useState('আলোচনা সাপেক্ষে');
  const [district, setDistrict] = useState('খাগড়াছড়ি');
  const [upazila, setUpazila] = useState('খাগড়াছড়ি সদর');
  const [contactPhone, setContactPhone] = useState(currentUser?.phone || '');
  const [deadline, setDeadline] = useState('');
  const [description, setDescription] = useState('');

  // File upload state
  const [circularFile, setCircularFile] = useState<File | null>(null);
  const [circularUrl, setCircularUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cascading upazilas
  const currentDistrictObj = allDistricts.find(d => d.nameBn === district);
  const availableUpazilas = currentDistrictObj ? currentDistrictObj.upazilas : [];

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      onShowToast('ফাইলের আকার সর্বোচ্চ ১৫MB হতে পারবে');
      return;
    }

    setCircularFile(file);
    setIsUploading(true);
    try {
      const res = await uploadJobDocument(file, 'circular');
      if (res && res.url) {
        setCircularUrl(res.url);
        onShowToast('সার্কুলার ফাইল সফলভাবে আপলোড হয়েছে');
      }
    } catch (err) {
      console.warn('File upload warning:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      onShowToast('অনুগ্রহ করে চাকরির পদবী / পদের নাম লিখুন');
      return;
    }
    if (!companyName.trim()) {
      onShowToast('প্রতিষ্ঠানের নাম প্রদান করুন');
      return;
    }
    if (!contactPhone.trim()) {
      onShowToast('যোগাযোগের মোবাইল নাম্বার প্রদান করুন');
      return;
    }

    setIsSubmitting(true);
    try {
      const jobTitle = title.trim();
      const companyOrPosterName = companyName.trim();
      const dist = district;
      const upazilaName = upazila;
      const phoneNum = contactPhone.trim();

      // 1. Direct safe insert to Supabase job_circulars table with full schema coverage
      const circularPayload = prepareJobCircularPayload({
        title: jobTitle,
        job_title: jobTitle,
        company: companyOrPosterName,
        company_name: companyOrPosterName,
        company_or_poster: companyOrPosterName,
        category: category,
        job_type: jobType,
        salary: salary.trim() || 'আলোচনা সাপেক্ষে',
        salary_range: salary.trim() || 'আলোচনা সাপেক্ষে',
        district: dist,
        upazila: upazilaName,
        phone: phoneNum,
        phone_number: phoneNum,
        deadline: deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: description.trim() || `${companyOrPosterName}-এ ${jobTitle} পদে জরুরি নিয়োগ চলছে।`,
        circular_file: circularUrl || null,
        photos: circularUrl || null,
        status: 'active'
      });
      await smartSupabaseInsert('job_circulars', circularPayload);

      // 2. Direct safe insert to Supabase jobs table
      const jobTablePayload = prepareJobPayload({
        title: jobTitle,
        company_name: companyOrPosterName,
        job_type: jobType,
        location: `${upazilaName}, ${dist}`,
        salary_range: salary.trim() || 'আলোচনা সাপেক্ষে',
        deadline: deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: description.trim() || `${companyOrPosterName}-এ ${jobTitle} পদে জরুরি নিয়োগ চলছে।`,
        status: 'active'
      });
      await smartSupabaseInsert('jobs', jobTablePayload);

      const res = await createJobPosting({
        title: title.trim(),
        companyName: companyName.trim(),
        category,
        jobType,
        salary: salary.trim() || 'আলোচনা সাপেক্ষে',
        district,
        upazila,
        contactPhone: contactPhone.trim(),
        deadline: deadline || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        description: description.trim() || `${companyName}-এ ${title} পদে জরুরি নিয়োগ চলছে।`,
        submissionType: circularUrl ? 'quick_upload' : 'form',
        circularUrl: circularUrl || undefined,
        circularFileName: circularFile?.name || undefined,
        employerId: currentUser?.id || '',
        employerName: currentUser?.name || companyName.trim(),
        status: 'active',
      });

      if (res.success && res.data) {
        onJobCreated(res.data);
        onShowToast('নতুন নিয়োগ বিজ্ঞপ্তি সফলভাবে প্রকাশিত হয়েছে!');
        onClose();
      } else {
        onShowToast(res.error || 'নিয়োগ পোস্ট করতে সমস্যা হয়েছে');
      }
    } catch (err) {
      console.error('Submit error:', err);
      onShowToast('বিজ্ঞপ্তি প্রকাশে ত্রুটি দেখা দিয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      id="post-job-modal-backdrop"
      onClick={onClose}
    >
      <div 
        className="bg-white w-full max-w-lg rounded-2xl shadow-xl border border-slate-200 overflow-hidden my-auto max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        id="post-job-modal-container"
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 border-b border-slate-100 bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-900 flex items-center justify-center font-bold">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                নতুন নিয়োগ পোস্ট করুন
              </h2>
              <p className="text-[11px] text-slate-500 font-medium">
                চাকরির বিজ্ঞপ্তি প্রকাশ করে দ্রুত যোগ্য প্রার্থী নিয়োগ করুন
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4">
          
          {/* Post Method Switcher */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
            <button
              type="button"
              onClick={() => setPostMethod('detailed_form')}
              className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                postMethod === 'detailed_form'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              সরাসরি তথ্য পূরণ
            </button>
            <button
              type="button"
              onClick={() => setPostMethod('quick_file')}
              className={`py-1.5 text-xs font-bold rounded-lg transition cursor-pointer ${
                postMethod === 'quick_file'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              সার্কুলার ফাইল / ছবি আপলোড
            </button>
          </div>

          {/* Quick File Upload option */}
          {postMethod === 'quick_file' && (
            <div className="border-2 border-dashed border-slate-300 hover:border-amber-400 rounded-xl p-4 text-center bg-slate-50">
              <input
                type="file"
                id="circular-file-input"
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,image/*,application/pdf"
                className="hidden"
              />
              <label 
                htmlFor="circular-file-input"
                className="cursor-pointer flex flex-col items-center justify-center space-y-1"
              >
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mb-1">
                  <Upload className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-800">
                  {circularFile ? circularFile.name : 'বিজ্ঞপ্তির PDF বা ছবি নির্বাচন করুন'}
                </span>
                <span className="text-[10px] text-slate-500">
                  {circularFile ? 'পরিবর্তন করতে ক্লিক করুন' : 'PDF, Word, JPG, PNG (সর্বোচ্চ ১৫MB)'}
                </span>
              </label>
              {isUploading && (
                <p className="text-[11px] text-amber-700 font-semibold mt-1">ফাইল আপলোড হচ্ছে...</p>
              )}
            </div>
          )}

          {/* Title & Company */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                চাকরির পদবী / পদের নাম *
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="যেমন: সেলস এক্সিকিউটিভ, হিসাবরক্ষক"
                className="w-full bg-[#faf9f6] border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                প্রতিষ্ঠানের নাম *
              </label>
              <input
                type="text"
                required
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="কোম্পানি বা ব্যবসার নাম"
                className="w-full bg-[#faf9f6] border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Category & Job Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                ক্যাটাগরি
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#faf9f6] border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:border-amber-500 focus:outline-none cursor-pointer"
              >
                {JOB_CATEGORIES.map((c) => (
                  <option key={c.id} value={c.nameBn}>
                    {c.nameBn}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                কাজের ধরন
              </label>
              <select
                value={jobType}
                onChange={(e) => setJobType(e.target.value as JobType)}
                className="w-full bg-[#faf9f6] border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:border-amber-500 focus:outline-none cursor-pointer"
              >
                {JOB_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nameBn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Location: District & Upazila */}
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
                className="w-full bg-[#faf9f6] border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:border-amber-500 focus:outline-none cursor-pointer"
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
                className="w-full bg-[#faf9f6] border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:border-amber-500 focus:outline-none cursor-pointer"
              >
                {availableUpazilas.map((u) => (
                  <option key={u.code} value={u.nameBn}>
                    {u.nameBn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Salary & Contact Phone */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                মাসিক বেতন
              </label>
              <input
                type="text"
                value={salary}
                onChange={(e) => setSalary(e.target.value)}
                placeholder="যেমন: ১৫,০০০ - ২০,০০০ টাকা / আলোচনা সাপেক্ষে"
                className="w-full bg-[#faf9f6] border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:border-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                যোগাযোগের মোবাইল নাম্বার *
              </label>
              <input
                type="tel"
                required
                value={contactPhone}
                onChange={(e) => setContactPhone(e.target.value)}
                placeholder="০১৮XXXXXXXX"
                className="w-full bg-[#faf9f6] border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Deadline */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              আবেদনের শেষ তারিখ (ঐচ্ছিক)
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-[#faf9f6] border border-slate-300 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:border-amber-500 focus:outline-none"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              কাজের বিবরণ ও যোগ্যতা (ঐচ্ছিক)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="শিক্ষাগত যোগ্যতা, অভিজ্ঞতা বা আবেদন করার নিয়ম..."
              className="w-full bg-[#faf9f6] border border-slate-300 rounded-xl p-2.5 text-xs sm:text-sm font-medium text-slate-800 focus:border-amber-500 focus:outline-none resize-none"
            />
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 font-black text-sm rounded-xl shadow-md transition cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
            >
              <CheckCircle2 className="w-4 h-4 text-slate-950" />
              <span>{isSubmitting ? 'বিজ্ঞপ্তি পোস্ট হচ্ছে...' : 'নিয়োগ বিজ্ঞপ্তি পোস্ট করুন'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
