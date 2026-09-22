import React, { useState } from 'react';
import { 
  X, 
  UserPlus, 
  MapPin, 
  FileText, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Trash2, 
  Briefcase 
} from 'lucide-react';
import { JobCandidate, JobPosting, UserProfile } from '../../types';
import { 
  registerJobCandidate, 
  uploadJobDocument, 
  JOB_CATEGORIES 
} from '../../services/jobService';
import { DistrictItem, UpazilaItem } from '../../data/locationMaster';

interface CandidateCVModalProps {
  lang: 'bn' | 'en';
  currentUser?: UserProfile | null;
  appliedJob?: JobPosting | null;
  allDistricts: { nameBn: string; nameEn: string; code: string; upazilas: UpazilaItem[]; divisionBn: string }[];
  onClose: () => void;
  onSuccess: (candidate: JobCandidate) => void;
  onShowToast: (msg: string) => void;
}

export const CandidateCVModal: React.FC<CandidateCVModalProps> = ({
  lang,
  currentUser,
  appliedJob,
  allDistricts,
  onClose,
  onSuccess,
  onShowToast,
}) => {
  const [name, setName] = useState(currentUser?.name || '');
  const [phone, setPhone] = useState(currentUser?.phone || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [desiredJobTitle, setDesiredJobTitle] = useState(appliedJob?.title || '');
  const [category, setCategory] = useState(appliedJob?.category || JOB_CATEGORIES[0].nameBn);
  const [expectedSalary, setExpectedSalary] = useState('');
  const [experienceYears, setExperienceYears] = useState('১-২ বছর');
  const [highestEducation, setHighestEducation] = useState('স্নাতক (ডিগ্রি/অনার্স)');
  const [skills, setSkills] = useState('');
  const [district, setDistrict] = useState(appliedJob?.district || 'খাগড়াছড়ি');
  const [upazila, setUpazila] = useState(appliedJob?.upazila || 'খাগড়াছড়ি সদর');
  const [address, setAddress] = useState('');
  const [bio, setBio] = useState('');

  // CV File State
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [uploadedResumeUrl, setUploadedResumeUrl] = useState('');
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successResult, setSuccessResult] = useState<JobCandidate | null>(null);

  // Upazila list for selected district
  const currentDistrictObj = allDistricts.find(d => d.nameBn === district);
  const availableUpazilas = currentDistrictObj ? currentDistrictObj.upazilas : [];

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate type: PDF, DOC, DOCX
    const validTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png'
    ];
    const isDocOrPdf = validTypes.includes(file.type) || /\.(pdf|doc|docx|png|jpe?g)$/i.test(file.name);

    if (!isDocOrPdf) {
      onShowToast(lang === 'bn' ? 'অনুগ্রহ করে PDF বা Word (.doc, .docx) ফাইল নির্বাচন করুন' : 'Please upload a PDF or Word document');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      onShowToast(lang === 'bn' ? 'ফাইলের আকার ১৫MB এর বেশি হতে পারবে না' : 'File size must be under 15MB');
      return;
    }

    setCvFile(file);
    setIsUploadingFile(true);

    try {
      const res = await uploadJobDocument(file, 'resume');
      if (res && res.url) {
        setUploadedResumeUrl(res.url);
      }
      onShowToast(lang === 'bn' ? '✅ সিভি ডকুমেন্ট সফলভাবে যুক্ত হয়েছে' : 'Resume file attached');
    } catch (err) {
      console.error('CV upload note:', err);
      onShowToast(lang === 'bn' ? 'ডকুমেন্ট আপলোডে সমস্যা, তবে আপনি আবেদন সাবমিট করতে পারেন' : 'File upload note');
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !phone.trim() || !desiredJobTitle.trim()) {
      onShowToast(lang === 'bn' ? 'অনুগ্রহ করে আপনার নাম, মোবাইল ও কাঙ্ক্ষিত পদবী প্রদান করুন' : 'Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      let finalResumeUrl = uploadedResumeUrl;
      if (cvFile && !finalResumeUrl) {
        const uploadRes = await uploadJobDocument(cvFile, 'resume');
        if (uploadRes && uploadRes.url) {
          finalResumeUrl = uploadRes.url;
        }
      }

      const skillsList = skills
        .split(',')
        .map(s => s.trim())
        .filter(Boolean);

      const res = await registerJobCandidate({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim(),
        gender,
        desiredJobTitle: desiredJobTitle.trim(),
        category,
        expectedSalary: expectedSalary.trim() || 'আলোচনাসাপেক্ষে',
        experienceYears,
        highestEducation,
        skills: skillsList,
        district,
        upazila,
        address: address.trim(),
        bio: bio.trim(),
        resumeUrl: finalResumeUrl,
        resumeFileName: cvFile ? cvFile.name : undefined,
        resumeFileType: cvFile ? cvFile.type : undefined,
        appliedJobId: appliedJob?.id,
        appliedJobTitle: appliedJob?.title,
        status: 'available',
      });

      if (res.success && res.data) {
        setSuccessResult(res.data);
        onSuccess(res.data);
        onShowToast(lang === 'bn' ? '🎉 আপনার সিভি ও আবেদন সফলভাবে গৃহীত হয়েছে!' : 'Application & Resume submitted successfully!');
      }
    } catch (err) {
      console.error(err);
      onShowToast(lang === 'bn' ? 'দুঃখিত, আবেদন জমাদানে সমস্যা হয়েছে' : 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in"
      id="candidate-cv-modal"
    >
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 px-4 sm:px-5 py-3.5 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center font-bold shadow-xs">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-black leading-tight">
                {appliedJob 
                  ? (lang === 'bn' ? `আবেদন করুন: ${appliedJob.title}` : `Apply for: ${appliedJob.title}`)
                  : (lang === 'bn' ? 'চাকরিপ্রার্থী সিভি ও প্রোফাইল জমা' : 'Drop Your CV & Candidate Profile')}
              </h3>
              <p className="text-[10px] text-emerald-100">
                {appliedJob?.companyName ? `প্রতিষ্ঠান: ${appliedJob.companyName}` : 'নিয়োগকর্তাদের কাছে পৌঁছাতে আপনার বিস্তারিত তথ্য দিন'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
            id="btn-close-candidate-modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success Confirmation View */}
        {successResult ? (
          <div className="p-6 text-center space-y-4 my-auto">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-base sm:text-lg font-black text-slate-900">
                {lang === 'bn' ? 'আবেদন ও সিভি সফলভাবে জমা হয়েছে!' : 'Application Submitted!'}
              </h4>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                {lang === 'bn' 
                  ? 'আপনার জীবনবৃত্তান্ত আমাদের ডাটাবেজে সংরক্ষিত হয়েছে। সংশ্লিষ্ট নিয়োগকর্তারা আপনার সাথে ফোনে যোগাযোগ করবেন।' 
                  : 'Your profile has been saved. The employer can now review your resume and contact you.'}
              </p>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl max-w-xs mx-auto text-left text-xs space-y-1">
              <p className="text-slate-500 font-medium">প্রার্থী ট্র্যাকিং কোড:</p>
              <p className="text-base font-black text-emerald-700 tracking-wider font-mono">
                {successResult.candidateCode}
              </p>
              <p className="text-slate-700 font-semibold">{successResult.name} ({successResult.desiredJobTitle})</p>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
            >
              {lang === 'bn' ? 'সম্পন্ন করুন' : 'Done'}
            </button>
          </div>
        ) : (
          /* Form View */
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 overflow-y-auto space-y-3.5 text-xs">
            
            {/* Attached Job Banner */}
            {appliedJob && (
              <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-amber-700 shrink-0" />
                <div className="text-[11px] text-amber-900 leading-tight">
                  <span className="font-bold">আবেদনকৃত পদ: </span>
                  <span>{appliedJob.title} ({appliedJob.companyName})</span>
                </div>
              </div>
            )}

            {/* 1. Name & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {lang === 'bn' ? 'আপনার পুরো নাম *' : 'Full Name *'}
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: মোঃ কামরুল ইসলাম"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {lang === 'bn' ? 'মোবাইল নম্বর *' : 'Mobile Number *'}
                </label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="যেমন: 018XXXXXXXX"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            {/* 2. Email & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {lang === 'bn' ? 'ইমেইল (ঐচ্ছিক)' : 'Email (Optional)'}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@mail.com"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {lang === 'bn' ? 'লিঙ্গ' : 'Gender'}
                </label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer"
                >
                  <option value="Male">পুরুষ (Male)</option>
                  <option value="Female">নারী (Female)</option>
                  <option value="Other">অন্যান্য (Other)</option>
                </select>
              </div>
            </div>

            {/* 3. Desired Title & Category */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {lang === 'bn' ? 'কাঙ্ক্ষিত পদবী / কাজের ধরণ *' : 'Desired Job Title *'}
                </label>
                <input
                  type="text"
                  required
                  value={desiredJobTitle}
                  onChange={(e) => setDesiredJobTitle(e.target.value)}
                  placeholder="যেমন: সেলস এক্সিকিউটিভ, হিসাবরক্ষক..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {lang === 'bn' ? 'ক্যাটাগরি' : 'Category'}
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
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

            {/* 4. Cascading Location: District -> Upazila */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80">
              <div>
                <label className="text-xs font-bold text-emerald-950 block mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{lang === 'bn' ? 'আপনার জেলা *' : 'District *'}</span>
                </label>
                <select
                  required
                  value={district}
                  onChange={(e) => {
                    const dist = e.target.value;
                    const match = allDistricts.find(d => d.nameBn === dist);
                    const firstUpazila = match && match.upazilas.length > 0 ? match.upazilas[0].nameBn : '';
                    setDistrict(dist);
                    setUpazila(firstUpazila);
                  }}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer"
                >
                  <optgroup label="পার্বত্য চট্টগ্রাম (CHT)">
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
                <label className="text-xs font-bold text-emerald-950 block mb-1 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>{lang === 'bn' ? 'আপনার উপজেলা *' : 'Upazila *'}</span>
                </label>
                <select
                  required
                  value={upazila}
                  onChange={(e) => setUpazila(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer"
                >
                  {availableUpazilas.map((u) => (
                    <option key={u.code + u.nameBn} value={u.nameBn}>
                      {u.nameBn} ({u.nameEn})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 5. Education & Experience */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {lang === 'bn' ? 'সর্বোচ্চ শিক্ষাগত যোগ্যতা' : 'Highest Education'}
                </label>
                <select
                  value={highestEducation}
                  onChange={(e) => setHighestEducation(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer"
                >
                  <option value="এসএসসি (SSC)">এসএসসি (SSC)</option>
                  <option value="এইচএসসি (HSC)">এইচএসসি (HSC)</option>
                  <option value="স্নাতক (ডিগ্রি/অনার্স)">স্নাতক (ডিগ্রি/অনার্স)</option>
                  <option value="মাস্টার্স (Masters)">মাস্টার্স (Masters)</option>
                  <option value="ডিপ্লোমা (Diploma)">কারিগরি ডিপ্লোমা (Diploma)</option>
                  <option value="অন্যান্য / সাধারণ">অন্যান্য / সাধারণ</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {lang === 'bn' ? 'অভিজ্ঞতা' : 'Experience'}
                </label>
                <select
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none cursor-pointer"
                >
                  <option value="নতুন / ফ্রেশার">নতুন / ফ্রেশার</option>
                  <option value="১-২ বছর">১-২ বছর</option>
                  <option value="৩-৫ বছর">৩-৫ বছর</option>
                  <option value="৫+ বছর">৫+ বছর</option>
                </select>
              </div>
            </div>

            {/* 6. Skills & Expected Salary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {lang === 'bn' ? 'আপনার দক্ষতা (কমা দিয়ে লিখুন)' : 'Key Skills'}
                </label>
                <input
                  type="text"
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="কম্পিউটার, এমএস ওয়ার্ড, সেলস..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  {lang === 'bn' ? 'প্রত্যাশিত মাসিক বেতন' : 'Expected Salary'}
                </label>
                <input
                  type="text"
                  value={expectedSalary}
                  onChange={(e) => setExpectedSalary(e.target.value)}
                  placeholder="যেমন: ৳১৫,০০০ / আলোচনাসাপেক্ষে"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
                />
              </div>
            </div>

            {/* 7. CV / Resume Document Upload Section (PDF / Word) */}
            <div className="p-3 bg-sky-50/70 border-2 border-dashed border-sky-300 rounded-2xl space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-sky-950 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-sky-700" />
                  <span>সিভি বা জীবনবৃত্তান্ত ফাইল আপলোড (PDF বা Word)</span>
                </label>
                <span className="text-[10px] text-sky-700 font-semibold">সর্বোচ্চ ১৫MB</span>
              </div>

              {cvFile ? (
                <div className="p-2.5 bg-white border border-sky-200 rounded-xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 truncate">
                    <FileText className="w-5 h-5 text-sky-600 shrink-0" />
                    <div className="truncate">
                      <p className="text-xs font-bold text-slate-800 truncate">{cvFile.name}</p>
                      <p className="text-[10px] text-slate-500">
                        {(cvFile.size / 1024).toFixed(1)} KB {isUploadingFile && '• আপলোড হচ্ছে...'}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCvFile(null);
                      setUploadedResumeUrl('');
                    }}
                    className="p-1 text-red-500 hover:bg-red-50 rounded-lg transition cursor-pointer"
                    title="মুছে ফেলুন"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center p-4 bg-white/70 hover:bg-white rounded-xl border border-sky-200 transition cursor-pointer text-center">
                  <Upload className="w-6 h-6 text-sky-600 mb-1" />
                  <span className="text-xs font-bold text-sky-900">
                    কম্পিউটার বা মোবাইল থেকে সিভি সিলেক্ট করুন
                  </span>
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    সাপোর্টেড ফরম্যাট: .PDF, .DOC, .DOCX
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* 8. Bio / Summary */}
            <div>
              <label className="text-xs font-bold text-slate-700 block mb-1">
                {lang === 'bn' ? 'সংক্ষিপ্ত পরিচয় বা বার্তা (ঐচ্ছিক)' : 'Short Message / Bio'}
              </label>
              <textarea
                rows={2}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="নিজের অভিজ্ঞতা বা কাজের আগ্রহ সম্পর্কে সংক্ষেপে লিখুন..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs font-semibold text-slate-800 focus:bg-white focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                type="submit"
                disabled={isSubmitting || isUploadingFile}
                className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 active:scale-[0.99] text-white font-black text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                id="btn-submit-candidate-cv"
              >
                {isSubmitting ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>সিভি ও আবেদন জমা হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4" />
                    <span>সিভি ও আবেদন জমা দিন</span>
                  </>
                )}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
