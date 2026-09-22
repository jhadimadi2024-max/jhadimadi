import React, { useState } from 'react';
import { 
  X, 
  Send, 
  CheckCircle2, 
  FileText, 
  Sparkles, 
  ShieldCheck, 
  Building2, 
  MapPin, 
  Briefcase, 
  User, 
  Phone, 
  Mail, 
  ExternalLink,
  Edit3
} from 'lucide-react';
import { JobPosting } from '../../types';
import { MasterJobSeekerProfile, JobApplication } from '../../types/jobseeker';
import { submitJobApplication } from '../../services/jobSeekerService';

interface ApplicationModalProps {
  lang: 'bn' | 'en';
  job: JobPosting;
  profile: MasterJobSeekerProfile;
  onClose: () => void;
  onSuccess: (application: JobApplication) => void;
  onOpenProfileEditor: () => void;
  onShowToast: (msg: string) => void;
}

export const ApplicationModal: React.FC<ApplicationModalProps> = ({
  lang,
  job,
  profile,
  onClose,
  onSuccess,
  onOpenProfileEditor,
  onShowToast,
}) => {
  const [coverLetter, setCoverLetter] = useState(
    `সম্মানিত নিয়োগকারী কর্তৃপক্ষ,\nআমি ঝাদিমাদি পোর্টালের মাধ্যমে আপনার "${job.title}" বিজ্ঞপ্তির প্রতি গভীর আগ্রহ প্রকাশ করছি। আমার পূর্ব অভিজ্ঞতা এবং আগ্রহের সাথে আপনার চাহিদার সামঞ্জস্য রয়েছে। আমার প্রোফাইল ও বিস্তারিত তথ্য সংযুক্ত করা হলো।\n\nবিনীত,\n${profile.fullName || 'প্রার্থী'}`
  );
  const [attachResume, setAttachResume] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedApplication, setSubmittedApplication] = useState<JobApplication | null>(null);

  const applyCoverLetterTemplate = (type: 'standard' | 'experienced' | 'fresher') => {
    if (type === 'standard') {
      setCoverLetter(
        `সম্মানিত নিয়োগকারী কর্তৃপক্ষ,\nআমি ঝাদিমাদি পোর্টালের মাধ্যমে আপনার "${job.title}" বিজ্ঞপ্তির প্রতি গভীর আগ্রহ প্রকাশ করছি। আমার পেশাগত দক্ষতা ও নিষ্ঠা আপনার প্রতিষ্ঠানের লক্ষ্য অর্জনে সহায়ক হবে। অনুগ্রহ করে আমার মাস্টার প্রোফাইলটি বিবেচনা করুন।\n\nবিনীত,\n${profile.fullName || 'প্রার্থী'}`
      );
    } else if (type === 'experienced') {
      setCoverLetter(
        `শ্রদ্ধেয় টিম,\nআমি "${job.title}" পদের জন্য আবেদন করছি। এই ক্ষেত্রে আমার ${profile.experienceYears || 'কয়েক বছরের'} বাস্তব কাজের অভিজ্ঞতা রয়েছে এবং আমি স্বাধীনভাবে ও দলের সাথে দায়িত্ব পালনে দক্ষ। একটি সাক্ষাৎকারের মাধ্যমে বিস্তারিত আলোচনার সুযোগ কামনা করছি।\n\nধন্যবাদান্তে,\n${profile.fullName || 'প্রার্থী'}`
      );
    } else {
      setCoverLetter(
        `সম্মানিত নিয়োগকারী,\nআমি একজন উদ্যমী ও শিখতে আগ্রহী প্রার্থী হিসেবে আপনার "${job.title}" পদের জন্য আবেদন করছি। প্রাতিষ্ঠানিক শিক্ষা ও নতুন প্রযুক্তি শেখার প্রবল ইচ্ছা নিয়ে আমি আপনাদের দলে নিবেদিতভাবে অবদান রাখতে চাই।\n\nবিনীত,\n${profile.fullName || 'প্রার্থী'}`
      );
    }
  };

  const handle1ClickApply = async () => {
    if (!profile.fullName || profile.fullName.trim().length < 3) {
      onShowToast(lang === 'bn' ? 'আবেদনের পূর্বে আপনার মাস্টার প্রোফাইলে নাম লিখুন।' : 'Please enter your name in master profile.');
      onOpenProfileEditor();
      return;
    }

    if (!profile.phone || profile.phone.trim().length < 11) {
      onShowToast(lang === 'bn' ? 'আবেদনের পূর্বে সঠিক মোবাইল নম্বর যুক্ত করুন।' : 'Please add your phone number in master profile.');
      onOpenProfileEditor();
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await submitJobApplication({
        jobId: job.id,
        jobTitle: job.title,
        companyName: job.companyName,
        jobCategory: job.category,
        jobDistrict: job.district,
        candidateProfile: profile,
        coverLetter,
        attachResume,
      });

      if (res.success) {
        setSubmittedApplication(res.application);
        onSuccess(res.application);
        onShowToast(lang === 'bn' ? 'চাকরিতে সফলভাবে আবেদন জমা দেওয়া হয়েছে!' : 'Application submitted successfully!');
      } else {
        onShowToast(res.error || 'আবেদন জমা দিতে সমস্যা হয়েছে');
      }
    } catch (e: any) {
      onShowToast(e.message || 'আবেদন প্রক্রিয়া ব্যর্থ হয়েছে');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4" id="application-modal-view">
      
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden border border-slate-200">
        
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 px-2 py-0.5 rounded-full">
                ১-ক্লিক সহজ আবেদন
              </span>
              <span className="text-[10px] text-slate-400">Master Profile Sync</span>
            </div>
            <h2 className="text-base sm:text-lg font-black tracking-tight line-clamp-1">
              {job.title}
            </h2>
            <p className="text-xs text-slate-300 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-slate-400" />
              <span>{job.companyName}</span>
              <span className="text-slate-500">•</span>
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              <span>{job.upazila ? `${job.upazila}, ` : ''}{job.district}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Success confirmation view */}
        {submittedApplication ? (
          <div className="p-6 sm:p-8 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-inner">
              <CheckCircle2 className="w-9 h-9" />
            </div>

            <div className="space-y-1">
              <h3 className="text-lg font-black text-slate-900">
                {lang === 'bn' ? 'আবেদন সফলভাবে গ্রহণ করা হয়েছে!' : 'Application Submitted!'}
              </h3>
              <p className="text-xs text-slate-600 max-w-sm mx-auto">
                {lang === 'bn' 
                  ? 'আপনার মাস্টার প্রফেশনাল প্রোফাইল ও কভার লেটার নিয়োগকারীর কাছে পৌঁছেছে। আবেদনের অবস্থা ড্যাশবোর্ডে ট্র্যাক করতে পারবেন।' 
                  : 'Your profile has been forwarded to the employer. You can track status on your dashboard.'}
              </p>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-left text-xs space-y-1 max-w-sm mx-auto">
              <div className="flex justify-between">
                <span className="text-slate-500">ট্র্যাকিং কোড:</span>
                <span className="font-mono font-bold text-slate-900">{submittedApplication.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">বর্তমান স্ট্যাটাস:</span>
                <span className="font-bold text-emerald-700">আবেদন গৃহীত (Applied)</span>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs rounded-xl shadow-xs transition"
            >
              {lang === 'bn' ? 'সম্পন্ন' : 'Done'}
            </button>
          </div>
        ) : (
          <div className="p-4 sm:p-6 space-y-5">
            
            {/* Master Profile Summary Card */}
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 text-xs font-black text-emerald-950">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <span>{lang === 'bn' ? 'ব্যবহার হচ্ছে: ঝাদিমাদি মাস্টার প্রফেশনাল প্রোফাইল' : 'Using: Jhadimadi Master Profile'}</span>
                </div>
                <button
                  type="button"
                  onClick={onOpenProfileEditor}
                  className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <Edit3 className="w-3 h-3" />
                  <span>{lang === 'bn' ? 'প্রোফাইল সম্পাদন' : 'Edit Profile'}</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs pt-1">
                <div className="text-slate-700">
                  <span className="text-slate-500 block text-[10px]">প্রার্থীর নাম:</span>
                  <span className="font-bold text-slate-900">{profile.fullName || 'নাম যোগ করুন'}</span>
                </div>

                <div className="text-slate-700">
                  <span className="text-slate-500 block text-[10px]">কাঙ্ক্ষিত পদবী:</span>
                  <span className="font-bold text-slate-900">{profile.desiredJobTitle || 'সাধারণ প্রার্থী'}</span>
                </div>

                <div className="text-slate-700">
                  <span className="text-slate-500 block text-[10px]">মোবাইল:</span>
                  <span className="font-semibold">{profile.privacySettings.hidePhone ? 'গোপন রাখা হবে (প্রাইভেসি অন)' : (profile.phone || 'যুক্ত করুন')}</span>
                </div>

                <div className="text-slate-700">
                  <span className="text-slate-500 block text-[10px]">অভিজ্ঞতা:</span>
                  <span className="font-semibold">{profile.experienceYears || 'ফ্রেশার'}</span>
                </div>
              </div>

              {profile.skills && profile.skills.length > 0 && (
                <div className="pt-1 flex flex-wrap gap-1">
                  {profile.skills.slice(0, 5).map((s, i) => (
                    <span key={i} className="text-[10px] bg-white border border-emerald-300 text-emerald-800 px-2 py-0.5 rounded-md font-semibold">
                      {s.name}
                    </span>
                  ))}
                  {profile.skills.length > 5 && (
                    <span className="text-[10px] text-slate-500 font-bold self-center">+{profile.skills.length - 5} আরও</span>
                  )}
                </div>
              )}
            </div>

            {/* Custom Cover Letter Section */}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-1.5">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-emerald-700" />
                  <span>{lang === 'bn' ? 'কভার লেটার (ঐচ্ছিক/কাস্টমাইজড)' : 'Cover Letter'}</span>
                </label>

                {/* Quick Fill Templates */}
                <div className="flex items-center gap-1 text-[10px] font-bold">
                  <span className="text-slate-400">টেমপ্লেট:</span>
                  <button
                    type="button"
                    onClick={() => applyCoverLetterTemplate('standard')}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition"
                  >
                    পেশাদার
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCoverLetterTemplate('experienced')}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition"
                  >
                    অভিজ্ঞ
                  </button>
                  <button
                    type="button"
                    onClick={() => applyCoverLetterTemplate('fresher')}
                    className="px-2 py-0.5 bg-slate-100 hover:bg-slate-200 rounded text-slate-700 transition"
                  >
                    ফ্রেশার
                  </button>
                </div>
              </div>

              <textarea
                rows={4}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                className="w-full text-xs font-medium p-3 bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:bg-white transition leading-relaxed"
                placeholder="আপনার কভার লেটার লিখুন..."
              />
            </div>

            {/* Resume Attachment Toggle */}
            {profile.resumeUrl ? (
              <label className="flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100/70 transition">
                <input
                  type="checkbox"
                  checked={attachResume}
                  onChange={(e) => setAttachResume(e.target.checked)}
                  className="rounded text-emerald-600"
                />
                <div className="text-xs">
                  <span className="font-bold text-slate-800">মাস্টার সিভি ডকুমেন্ট সংযুক্ত করুন</span>
                  <span className="text-slate-500 block text-[10px]">({profile.resumeFileName || 'resume.pdf'})</span>
                </div>
              </label>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
                <span>সিভি ডকুমেন্ট আপলোড নেই (মাস্টার ডিজিটাল প্রোফাইল পাঠানো হবে)।</span>
              </div>
            )}

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition"
              >
                {lang === 'bn' ? 'বাতিল' : 'Cancel'}
              </button>

              <button
                type="button"
                disabled={isSubmitting}
                onClick={handle1ClickApply}
                className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-black text-xs rounded-xl shadow-xs transition flex items-center gap-2 cursor-pointer disabled:opacity-50"
                id="btn-confirm-1click-apply"
              >
                <Send className="w-4 h-4" />
                <span>{isSubmitting ? (lang === 'bn' ? 'আবেদন পাঠানো হচ্ছে...' : 'Submitting...') : (lang === 'bn' ? '১-ক্লিকে আবেদন নিশ্চিত করুন' : 'Confirm 1-Click Apply')}</span>
              </button>
            </div>

          </div>
        )}

      </div>

    </div>
  );
};
