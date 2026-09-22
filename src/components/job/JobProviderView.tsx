import React, { useState } from 'react';
import { 
  Building2, 
  FileText, 
  Upload, 
  Trash2, 
  PlusCircle, 
  CheckCircle2, 
  MapPin, 
  Calendar, 
  Phone, 
  Mail, 
  ListChecks, 
  Eye, 
  AlertCircle 
} from 'lucide-react';
import { JobPosting, JobType, UserProfile } from '../../types';
import { 
  createJobPosting, 
  uploadJobDocument, 
  deleteJobPosting, 
  JOB_CATEGORIES, 
  JOB_TYPES 
} from '../../services/jobService';
import { DistrictItem, UpazilaItem } from '../../data/locationMaster';
import { supabase } from '../../supabase';

interface JobProviderViewProps {
  lang: 'bn' | 'en';
  currentUser?: UserProfile | null;
  allDistricts: { nameBn: string; nameEn: string; code: string; upazilas: UpazilaItem[]; divisionBn: string }[];
  myJobs: JobPosting[];
  onJobCreated: (job: JobPosting) => void;
  onJobDeleted: (id: string) => void;
  onSelectJobForDetails: (job: JobPosting) => void;
  onShowToast: (msg: string) => void;
}

export const JobProviderView: React.FC<JobProviderViewProps> = ({
  lang,
  currentUser,
  allDistricts,
  myJobs,
  onJobCreated,
  onJobDeleted,
  onSelectJobForDetails,
  onShowToast,
}) => {
  // Provider Sub-tabs: 'quick_upload' (Option A), 'detailed_form' (Option B), 'my_listings'
  const [providerTab, setProviderTab] = useState<'quick_upload' | 'detailed_form' | 'my_listings'>('quick_upload');

  // ================= Option A: Quick Upload State =================
  const [quickFile, setQuickFile] = useState<File | null>(null);
  const [quickCompanyName, setQuickCompanyName] = useState('');
  const [quickTitle, setQuickTitle] = useState('');
  const [quickCategory, setQuickCategory] = useState(JOB_CATEGORIES[0].nameBn);
  const [quickJobType, setQuickJobType] = useState<JobType>('Full-time');
  const [quickDistrict, setQuickDistrict] = useState('খাগড়াছড়ি');
  const [quickUpazila, setQuickUpazila] = useState('খাগড়াছড়ি সদর');
  const [quickPhone, setQuickPhone] = useState(currentUser?.phone || '');
  const [quickDeadline, setQuickDeadline] = useState('');
  const [isSubmittingQuick, setIsSubmittingQuick] = useState(false);

  // ================= Option B: Detailed Form State =================
  const [detailedForm, setDetailedForm] = useState({
    title: '',
    designation: '',
    companyName: '',
    category: JOB_CATEGORIES[0].nameBn,
    jobType: 'Full-time' as JobType,
    salary: '',
    vacanciesCount: 1,
    district: 'খাগড়াছড়ি',
    upazila: 'খাগড়াছড়ি সদর',
    address: '',
    education: '',
    experience: '',
    requirements: '',
    description: '',
    applyInstructions: '',
    contactPhone: currentUser?.phone || '',
    contactEmail: currentUser?.email || '',
    deadline: '',
  });
  const [isSubmittingDetailed, setIsSubmittingDetailed] = useState(false);

  // Success Feedback
  const [recentCreatedJob, setRecentCreatedJob] = useState<JobPosting | null>(null);

  // Upazilas for Quick form
  const quickDistrictObj = allDistricts.find(d => d.nameBn === quickDistrict);
  const quickUpazilas = quickDistrictObj ? quickDistrictObj.upazilas : [];

  // Upazilas for Detailed form
  const detailedDistrictObj = allDistricts.find(d => d.nameBn === detailedForm.district);
  const detailedUpazilas = detailedDistrictObj ? detailedDistrictObj.upazilas : [];

  // Handle Quick File Select
  const handleQuickFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ];
    const isDocOrPdf = validTypes.includes(file.type) || /\.(pdf|doc|docx|png|jpe?g)$/i.test(file.name);

    if (!isDocOrPdf) {
      onShowToast(lang === 'bn' ? 'অনুগ্রহ করে সার্কুলার ফাইল PDF বা Word ফরম্যাটে আপলোড করুন' : 'Please select a PDF or Word document');
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      onShowToast(lang === 'bn' ? 'ফাইলের আকার ২০MB এর কম হতে হবে' : 'File size must be under 20MB');
      return;
    }

    setQuickFile(file);
    if (!quickTitle) {
      // Auto prefill title from file name without extension
      const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setQuickTitle(cleanName);
    }
  };

  // Submit Option A: Quick Upload
  const handleQuickUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!quickFile) {
      onShowToast(lang === 'bn' ? 'অনুগ্রহ করে নিয়োগ বিজ্ঞপ্তির PDF বা Word ফাইল সিলেক্ট করুন' : 'Please select a circular file');
      return;
    }
    if (!quickCompanyName.trim() || !quickTitle.trim() || !quickPhone.trim()) {
      onShowToast(lang === 'bn' ? 'অনুগ্রহ করে প্রতিষ্ঠানের নাম, পদবী ও ফোন নম্বর দিন' : 'Please fill company, title and phone');
      return;
    }

    setIsSubmittingQuick(true);
    try {
      // 1. Upload circular file
      const uploadResult = await uploadJobDocument(quickFile, 'circular');
      const uploadedFileUrl = uploadResult?.url || '';

      // Supabase job_circulars insert
      const jobTitle = quickTitle.trim();
      const companyName = quickCompanyName.trim();
      const dist = quickDistrict;
      const upazilaName = quickUpazila;
      const phoneNum = quickPhone.trim();

      const { data, error } = await supabase
        .from('job_circulars')
        .insert([
          {
            job_title: jobTitle,
            company_or_poster: companyName,
            district: dist,
            upazila: upazilaName,
            phone: phoneNum
          }
        ]);

      if (error) {
        console.warn('Supabase job_circulars quick insert error:', error);
      }

      // 2. Create Job Posting
      const res = await createJobPosting({
        title: quickTitle.trim(),
        designation: quickTitle.trim(),
        companyName: quickCompanyName.trim(),
        category: quickCategory,
        jobType: quickJobType,
        salary: 'বিজ্ঞপ্তি অনুযায়ী',
        district: quickDistrict,
        upazila: quickUpazila,
        description: `${quickCompanyName} কর্তৃক প্রকাশিত নিয়োগ বিজ্ঞপ্তি। বিস্তারিত জানতে সংযুক্ত সার্কুলার ফাইল দেখুন।`,
        vacanciesCount: 1,
        requirements: ['সংযুক্ত সার্কুলার বিজ্ঞপ্তিতে উল্লেখিত শর্তাবলী প্রযোজ্য'],
        deadline: quickDeadline || 'চলমান',
        contactPhone: quickPhone.trim(),
        contactEmail: currentUser?.email || '',
        applyInstructions: 'সংযুক্ত সার্কুলারে উল্লেখিত নিয়মে আবেদন করুন অথবা সরাসরি ফোনে যোগাযোগ করুন।',
        employerId: currentUser?.id,
        employerName: currentUser?.name || quickCompanyName,
        submissionType: 'quick_upload',
        circularUrl: uploadedFileUrl,
        circularFileName: quickFile.name,
        circularFileType: quickFile.type,
        status: 'active',
      });

      if (res.success && res.data) {
        setRecentCreatedJob(res.data);
        onJobCreated(res.data);
        onShowToast(lang === 'bn' ? '🎉 সার্কুলার সফলভাবে আপলোড ও প্রকাশিত হয়েছে!' : 'Circular uploaded and published!');
        // Reset form
        setQuickFile(null);
        setQuickTitle('');
        setQuickCompanyName('');
        setQuickDeadline('');
      }
    } catch (err) {
      console.error(err);
      onShowToast(lang === 'bn' ? 'সার্কুলার আপলোডে সমস্যা হয়েছে' : 'Failed to upload circular');
    } finally {
      setIsSubmittingQuick(false);
    }
  };

  // Submit Option B: Detailed Form
  const handleDetailedFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!detailedForm.title.trim() || !detailedForm.companyName.trim() || !detailedForm.contactPhone.trim()) {
      onShowToast(lang === 'bn' ? 'অনুগ্রহ করে আবশ্যক তথ্যসমূহ (পদবী, প্রতিষ্ঠান, ফোন) পূরণ করুন' : 'Please fill all required fields');
      return;
    }

    setIsSubmittingDetailed(true);
    try {
      const jobTitle = detailedForm.title.trim();
      const companyName = detailedForm.companyName.trim();
      const dist = detailedForm.district;
      const upazilaName = detailedForm.upazila;
      const phoneNum = detailedForm.contactPhone.trim();

      const { data, error } = await supabase
        .from('job_circulars')
        .insert([
          {
            job_title: jobTitle,
            company_or_poster: companyName,
            district: dist,
            upazila: upazilaName,
            phone: phoneNum
          }
        ]);

      if (error) {
        console.warn('Supabase job_circulars detailed insert error:', error);
      }

      const reqList = detailedForm.requirements
        .split('\n')
        .map(r => r.trim())
        .filter(Boolean);

      const res = await createJobPosting({
        title: detailedForm.title.trim(),
        designation: detailedForm.designation.trim() || detailedForm.title.trim(),
        companyName: detailedForm.companyName.trim(),
        category: detailedForm.category,
        jobType: detailedForm.jobType,
        salary: detailedForm.salary.trim() || 'আলোচনাসাপেক্ষে',
        vacanciesCount: Number(detailedForm.vacanciesCount) || 1,
        district: detailedForm.district,
        upazila: detailedForm.upazila,
        address: detailedForm.address.trim(),
        education: detailedForm.education.trim(),
        experience: detailedForm.experience.trim(),
        requirements: reqList.length > 0 ? reqList : undefined,
        description: detailedForm.description.trim() || `${detailedForm.companyName} এ ${detailedForm.title} পদে দক্ষ জনবল নিয়োগ চলছে।`,
        applyInstructions: detailedForm.applyInstructions.trim(),
        contactPhone: detailedForm.contactPhone.trim(),
        contactEmail: detailedForm.contactEmail.trim(),
        deadline: detailedForm.deadline || 'চলমান',
        employerId: currentUser?.id,
        employerName: currentUser?.name || detailedForm.companyName,
        submissionType: 'form',
        status: 'active',
      });

      if (res.success && res.data) {
        setRecentCreatedJob(res.data);
        onJobCreated(res.data);
        onShowToast(lang === 'bn' ? '🎉 বিস্তারিত নিয়োগ বিজ্ঞপ্তি সফলভাবে প্রকাশিত হয়েছে!' : 'Job vacancy published successfully!');
        // Reset form
        setDetailedForm({
          title: '',
          designation: '',
          companyName: '',
          category: JOB_CATEGORIES[0].nameBn,
          jobType: 'Full-time',
          salary: '',
          vacanciesCount: 1,
          district: 'খাগড়াছড়ি',
          upazila: 'খাগড়াছড়ি সদর',
          address: '',
          education: '',
          experience: '',
          requirements: '',
          description: '',
          applyInstructions: '',
          contactPhone: currentUser?.phone || '',
          contactEmail: currentUser?.email || '',
          deadline: '',
        });
      }
    } catch (err) {
      console.error(err);
      onShowToast(lang === 'bn' ? 'বিজ্ঞপ্তি প্রকাশে সমস্যা হয়েছে' : 'Failed to publish vacancy');
    } finally {
      setIsSubmittingDetailed(false);
    }
  };

  const handleDeleteJob = async (id: string) => {
    if (!confirm(lang === 'bn' ? 'আপনি কি এই নিয়োগ বিজ্ঞপ্তিটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this job posting?')) {
      return;
    }
    await deleteJobPosting(id);
    onJobDeleted(id);
    onShowToast(lang === 'bn' ? 'বিজ্ঞপ্তিটি মুছে ফেলা হয়েছে' : 'Job posting deleted');
  };

  return (
    <div className="space-y-4" id="job-provider-view">
      
      {/* Top Banner / Role Identity */}
      <div className="bg-gradient-to-r from-sky-800 to-emerald-900 text-white p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-1.5 text-amber-300 text-xs font-bold">
            <Building2 className="w-4 h-4" />
            <span>{lang === 'bn' ? 'নিয়োগকর্তা কর্নার (Job Provider)' : 'Job Provider Corner'}</span>
          </div>
          <h2 className="text-base sm:text-lg font-black">
            {lang === 'bn' ? 'চাকরি দিচ্ছি — নিয়োগ বিজ্ঞপ্তি প্রকাশ করুন' : 'Post a Vacancy & Find Top Candidates'}
          </h2>
          <p className="text-xs text-sky-100 max-w-xl leading-relaxed">
            {lang === 'bn' 
              ? 'সরাসরি সার্কুলার ফাইল (PDF/Word) আপলোড করুন অথবা বিস্তারিত তথ্য পূরণ করে কয়েক সেকেন্ডে সার্কুলার লাইভ করুন।' 
              : 'Upload a circular file directly (PDF/Word) or fill out our detailed form to find candidates immediately.'}
          </p>
        </div>

        {/* Option Tabs Switcher */}
        <div className="bg-white/15 p-1 rounded-xl flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={() => setProviderTab('quick_upload')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              providerTab === 'quick_upload'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-white hover:bg-white/10'
            }`}
            id="tab-quick-upload"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>কুইক আপলোড</span>
          </button>

          <button
            type="button"
            onClick={() => setProviderTab('detailed_form')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              providerTab === 'detailed_form'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-white hover:bg-white/10'
            }`}
            id="tab-detailed-form"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>বিস্তারিত ফরম</span>
          </button>

          <button
            type="button"
            onClick={() => setProviderTab('my_listings')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center gap-1 ${
              providerTab === 'my_listings'
                ? 'bg-amber-400 text-slate-950 shadow-xs'
                : 'text-white hover:bg-white/10'
            }`}
            id="tab-my-listings"
          >
            <ListChecks className="w-3.5 h-3.5" />
            <span>আমার সার্কুলার ({myJobs.length})</span>
          </button>
        </div>
      </div>

      {/* Success Notification Alert if recently posted */}
      {recentCreatedJob && (
        <div className="bg-emerald-50 border-2 border-emerald-500/80 p-4 rounded-2xl shadow-sm space-y-2 animate-in fade-in">
          <div className="flex items-center gap-2 text-emerald-800 font-black text-sm sm:text-base">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>নিয়োগ বিজ্ঞপ্তি সফলভাবে প্রকাশিত হয়েছে!</span>
          </div>
          <p className="text-xs text-emerald-950 leading-relaxed">
            আপনার <strong>'{recentCreatedJob.title}'</strong> সার্কুলারটি লাইভ ডাটাবেজে যুক্ত হয়েছে এবং 'চাকরি খুঁজছি' তালিকায় অবিলম্বে দৃশ্যমান হচ্ছে।
          </p>
          <div className="pt-1 flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onSelectJobForDetails(recentCreatedJob);
                setRecentCreatedJob(null);
              }}
              className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
            >
              বিজ্ঞপ্তিটি দেখুন
            </button>
            <button
              type="button"
              onClick={() => setRecentCreatedJob(null)}
              className="px-3.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      )}

      {/* ================= OPTION A: QUICK UPLOAD FORM ================= */}
      {providerTab === 'quick_upload' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <Upload className="w-5 h-5 text-sky-600" />
              <span>অপশন এ: কুইক সার্কুলার আপলোড (PDF বা Word)</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              আপনার কাছে ইতোমধ্যে তৈরি করা সার্কুলার বা নোটিশ থাকলে সরাসরি ফাইল আপলোড করুন।
            </p>
          </div>

          <form onSubmit={handleQuickUploadSubmit} className="space-y-3.5 text-xs">
            
            {/* File Dropzone */}
            <div className="p-4 bg-sky-50/60 border-2 border-dashed border-sky-300 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-sky-700" />
                  <span>সার্কুলার ফাইল নির্বাচন করুন (PDF, Word বা ইমেজ) *</span>
                </label>
                <span className="text-[10px] text-sky-700 font-semibold">সর্বোচ্চ ২০MB</span>
              </div>

              {quickFile ? (
                <div className="p-3 bg-white border border-sky-200 rounded-xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-6 h-6 text-sky-600 shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-900 truncate">{quickFile.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {(quickFile.size / 1024).toFixed(1)} KB • {quickFile.type || 'Document'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setQuickFile(null)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    title="ফাইল বাদ দিন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-6 bg-white hover:bg-sky-50/50 rounded-xl border border-sky-200 transition cursor-pointer text-center">
                  <Upload className="w-8 h-8 text-sky-600 mb-2" />
                  <span className="text-xs sm:text-sm font-bold text-sky-950">
                    কম্পিউটার বা ফোন থেকে নিয়োগ বিজ্ঞপ্তির ফাইল সিলেক্ট করুন
                  </span>
                  <span className="text-[10px] text-slate-500 mt-1">
                    সাপোর্টেড ফরম্যাট: PDF (.pdf), Word (.doc, .docx), বা পরিষ্কার ইমেজ
                  </span>
                  <input
                    type="file"
                    required
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/*"
                    onChange={handleQuickFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Essential Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  প্রতিষ্ঠান বা কোম্পানির নাম *
                </label>
                <input
                  type="text"
                  required
                  value={quickCompanyName}
                  onChange={(e) => setQuickCompanyName(e.target.value)}
                  placeholder="যেমন: গ্রিন ডেল্টা এন্টারপ্রাইজ"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  পদবী / সার্কুলারের শিরোনাম *
                </label>
                <input
                  type="text"
                  required
                  value={quickTitle}
                  onChange={(e) => setQuickTitle(e.target.value)}
                  placeholder="যেমন: সেলস এক্সিকিউটিভ ও ড্রাইভার নিয়োগ"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-600 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ক্যাটাগরি
                </label>
                <select
                  value={quickCategory}
                  onChange={(e) => setQuickCategory(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-600 focus:outline-none cursor-pointer"
                >
                  {JOB_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.nameBn}>
                      {cat.nameBn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  কাজের ধরন
                </label>
                <select
                  value={quickJobType}
                  onChange={(e) => setQuickJobType(e.target.value as JobType)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-600 focus:outline-none cursor-pointer"
                >
                  {JOB_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nameBn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Cascading District -> Upazila */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>কর্মস্থলের জেলা *</span>
                </label>
                <select
                  value={quickDistrict}
                  onChange={(e) => {
                    const dist = e.target.value;
                    const match = allDistricts.find(d => d.nameBn === dist);
                    const firstUp = match && match.upazilas.length > 0 ? match.upazilas[0].nameBn : '';
                    setQuickDistrict(dist);
                    setQuickUpazila(firstUp);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-sky-600 focus:outline-none cursor-pointer"
                >
                  <optgroup label="পার্বত্য চট্টগ্রাম">
                    <option value="খাগড়াছড়ি">খাগড়াছড়ি</option>
                    <option value="রাঙ্গামাটি">রাঙ্গামাটি</option>
                    <option value="বান্দরবান">বান্দরবান</option>
                  </optgroup>
                  <optgroup label="অন্যান্য জেলা">
                    {allDistricts
                      .filter(d => !['খাগড়াছড়ি', 'রাঙ্গামাটি', 'বান্দরবান'].includes(d.nameBn))
                      .map((d) => (
                        <option key={d.code} value={d.nameBn}>
                          {d.nameBn} ({d.nameEn})
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>কর্মস্থলের উপজেলা *</span>
                </label>
                <select
                  value={quickUpazila}
                  onChange={(e) => setQuickUpazila(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-sky-600 focus:outline-none cursor-pointer"
                >
                  {quickUpazilas.map((u) => (
                    <option key={u.code + u.nameBn} value={u.nameBn}>
                      {u.nameBn} ({u.nameEn})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Contact Phone & Deadline */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  যোগাযোগের ফোন নম্বর *
                </label>
                <input
                  type="tel"
                  required
                  value={quickPhone}
                  onChange={(e) => setQuickPhone(e.target.value)}
                  placeholder="যেমন: 017XXXXXXXX"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  আবেদনের শেষ সময় (ঐচ্ছিক)
                </label>
                <input
                  type="text"
                  value={quickDeadline}
                  onChange={(e) => setQuickDeadline(e.target.value)}
                  placeholder="যেমন: ২৫ মে ২০২৬ / চলমান"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-sky-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmittingQuick}
                className="w-full py-3 bg-sky-700 hover:bg-sky-800 active:scale-[0.99] text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                id="btn-submit-quick-circular"
              >
                {isSubmittingQuick ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>সার্কুলার আপলোড ও প্রকাশ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>সার্কুলার প্রকাশ করুন</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* ================= OPTION B: DETAILED FORM ================= */}
      {providerTab === 'detailed_form' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
          <div className="border-b border-slate-100 pb-2">
            <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-700" />
              <span>অপশন বি: বিস্তারিত নিয়োগ ফরম</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              চাকরির বিস্তারিত শর্তাবলী, শিক্ষাগত যোগ্যতা ও কাজের দায়িত্ব উল্লেখ করে ফর্ম পূরণ করুন।
            </p>
          </div>

          <form onSubmit={handleDetailedFormSubmit} className="space-y-3.5 text-xs" id="detailed-job-form">
            
            {/* Title & Designation */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  চাকরির শিরোনাম *
                </label>
                <input
                  type="text"
                  required
                  value={detailedForm.title}
                  onChange={(e) => setDetailedForm({ ...detailedForm, title: e.target.value })}
                  placeholder="যেমন: একাউন্ট্যান্ট নিয়োগ বিজ্ঞপ্তি"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  নির্দিষ্ট পদবী (Designation)
                </label>
                <input
                  type="text"
                  value={detailedForm.designation}
                  onChange={(e) => setDetailedForm({ ...detailedForm, designation: e.target.value })}
                  placeholder="যেমন: সিনিয়র হিসাবরক্ষক"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Company & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  প্রতিষ্ঠান বা কোম্পানির নাম *
                </label>
                <input
                  type="text"
                  required
                  value={detailedForm.companyName}
                  onChange={(e) => setDetailedForm({ ...detailedForm, companyName: e.target.value })}
                  placeholder="যেমন: খাগড়াছড়ি অটো ট্রেডার্স"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ক্যাটাগরি *
                </label>
                <select
                  value={detailedForm.category}
                  onChange={(e) => setDetailedForm({ ...detailedForm, category: e.target.value })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer"
                >
                  {JOB_CATEGORIES.map((cat) => (
                    <option key={cat.id} value={cat.nameBn}>
                      {cat.nameBn}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Job Type, Salary & Vacancy */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  কাজের ধরন *
                </label>
                <select
                  value={detailedForm.jobType}
                  onChange={(e) => setDetailedForm({ ...detailedForm, jobType: e.target.value as JobType })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer"
                >
                  {JOB_TYPES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.nameBn}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  বেতন (মাসিক / দৈনিক) *
                </label>
                <input
                  type="text"
                  required
                  value={detailedForm.salary}
                  onChange={(e) => setDetailedForm({ ...detailedForm, salary: e.target.value })}
                  placeholder="যেমন: ৳১৮,০০০ - ৳২২,০০০"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  পদ সংখ্যা (খালি আসন)
                </label>
                <input
                  type="number"
                  min={1}
                  value={detailedForm.vacanciesCount}
                  onChange={(e) => setDetailedForm({ ...detailedForm, vacanciesCount: parseInt(e.target.value) || 1 })}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            {/* District & Upazila */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                  <span>কর্মস্থলের জেলা *</span>
                </label>
                <select
                  value={detailedForm.district}
                  onChange={(e) => {
                    const dist = e.target.value;
                    const match = allDistricts.find(d => d.nameBn === dist);
                    const firstUp = match && match.upazilas.length > 0 ? match.upazilas[0].nameBn : '';
                    setDetailedForm({
                      ...detailedForm,
                      district: dist,
                      upazila: firstUp
                    });
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer"
                >
                  <optgroup label="পার্বত্য চট্টগ্রাম">
                    <option value="খাগড়াছড়ি">খাগড়াছড়ি</option>
                    <option value="রাঙ্গামাটি">রাঙ্গামাটি</option>
                    <option value="বান্দরবান">বান্দরবান</option>
                  </optgroup>
                  <optgroup label="অন্যান্য জেলা">
                    {allDistricts
                      .filter(d => !['খাগড়াছড়ি', 'রাঙ্গামাটি', 'বান্দরবান'].includes(d.nameBn))
                      .map((d) => (
                        <option key={d.code} value={d.nameBn}>
                          {d.nameBn} ({d.nameEn})
                        </option>
                      ))}
                  </optgroup>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-800 block mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>কর্মস্থলের উপজেলা *</span>
                </label>
                <select
                  value={detailedForm.upazila}
                  onChange={(e) => setDetailedForm({ ...detailedForm, upazila: e.target.value })}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer"
                >
                  {detailedUpazilas.map((u) => (
                    <option key={u.code + u.nameBn} value={u.nameBn}>
                      {u.nameBn} ({u.nameEn})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                বিস্তারিত কর্মস্থল বা অফিসের ঠিকানা
              </label>
              <input
                type="text"
                value={detailedForm.address}
                onChange={(e) => setDetailedForm({ ...detailedForm, address: e.target.value })}
                placeholder="যেমন: আদালত রোড, খাগড়াছড়ি বাজার"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* Education & Experience */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  শিক্ষাগত যোগ্যতা
                </label>
                <input
                  type="text"
                  value={detailedForm.education}
                  onChange={(e) => setDetailedForm({ ...detailedForm, education: e.target.value })}
                  placeholder="যেমন: এইচএসসি / ডিগ্রি পাস"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  প্রয়োজনীয় অভিজ্ঞতা
                </label>
                <input
                  type="text"
                  value={detailedForm.experience}
                  onChange={(e) => setDetailedForm({ ...detailedForm, experience: e.target.value })}
                  placeholder="যেমন: সংশ্লিষ্ট কাজে ১-২ বছরের অভিজ্ঞতা"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Description & Requirements */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                কাজের সংক্ষিপ্ত বিবরণ ও দায়িত্ব
              </label>
              <textarea
                rows={2}
                value={detailedForm.description}
                onChange={(e) => setDetailedForm({ ...detailedForm, description: e.target.value })}
                placeholder="চাকরিতে কী ধরনের দায়িত্ব পালন করতে হবে..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                শর্তাবলী বা অতিরিক্ত যোগ্যতা (প্রতি লাইনে একটি)
              </label>
              <textarea
                rows={2}
                value={detailedForm.requirements}
                onChange={(e) => setDetailedForm({ ...detailedForm, requirements: e.target.value })}
                placeholder="যেমন:&#10;মোটরসাইকেল চালানোর দক্ষতা থাকতে হবে&#10;সৎ ও কর্মঠ হতে হবে"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* Contact & Deadline */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  যোগাযোগের ফোন নম্বর *
                </label>
                <input
                  type="tel"
                  required
                  value={detailedForm.contactPhone}
                  onChange={(e) => setDetailedForm({ ...detailedForm, contactPhone: e.target.value })}
                  placeholder="01XXXXXXXXX"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  ইমেইল (ঐচ্ছিক)
                </label>
                <input
                  type="email"
                  value={detailedForm.contactEmail}
                  onChange={(e) => setDetailedForm({ ...detailedForm, contactEmail: e.target.value })}
                  placeholder="hr@company.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  আবেদনের শেষ তারিখ
                </label>
                <input
                  type="text"
                  value={detailedForm.deadline}
                  onChange={(e) => setDetailedForm({ ...detailedForm, deadline: e.target.value })}
                  placeholder="যেমন: ৩০ মে ২০২৬"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmittingDetailed}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white font-black text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                id="btn-submit-detailed-job"
              >
                {isSubmittingDetailed ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>বিজ্ঞাপন তৈরি হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <PlusCircle className="w-4 h-4" />
                    <span>বিজ্ঞাপন সাবমিট করুন</span>
                  </>
                )}
              </button>
            </div>

          </form>
        </div>
      )}

      {/* ================= MY LISTINGS VIEW ================= */}
      {providerTab === 'my_listings' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-3">
          <div className="border-b border-slate-100 pb-2 flex items-center justify-between">
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                <ListChecks className="w-5 h-5 text-emerald-700" />
                <span>আমার প্রকাশিত সার্কুলারসমূহ</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                আপনার পোস্টকৃত চাকরির বর্তমান অবস্থা দেখুন বা প্রয়োজন অনুযায়ী মুছে ফেলুন।
              </p>
            </div>
            <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1 rounded-full">
              {myJobs.length} টি প্রকাশিত
            </span>
          </div>

          {myJobs.length === 0 ? (
            <div className="py-8 text-center space-y-2">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-400">
                <Building2 className="w-6 h-6" />
              </div>
              <p className="text-xs font-bold text-slate-700">আপনি এখনও কোনো চাকরি পোস্ট করেননি</p>
              <button
                type="button"
                onClick={() => setProviderTab('quick_upload')}
                className="px-3.5 py-1.5 bg-emerald-700 text-white rounded-xl text-xs font-bold hover:bg-emerald-800 transition cursor-pointer"
              >
                এখনই সার্কুলার আপলোড করুন
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {myJobs.map((job) => (
                <div 
                  key={job.id}
                  className="p-3 bg-slate-50 hover:bg-slate-100/80 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 transition"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.2 rounded">
                        {job.category}
                      </span>
                      {job.submissionType === 'quick_upload' && (
                        <span className="text-[10px] font-bold bg-sky-100 text-sky-800 px-1.5 py-0.2 rounded flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          ফাইল সার্কুলার
                        </span>
                      )}
                    </div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-900">{job.title}</h4>
                    <p className="text-[11px] text-slate-600">
                      {job.companyName} • {job.upazila ? `${job.upazila}, ` : ''}{job.district} • বেতন: {job.salary}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    <button
                      type="button"
                      onClick={() => onSelectJobForDetails(job)}
                      className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>দেখুন</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteJob(job.id)}
                      className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>মুছুন</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
