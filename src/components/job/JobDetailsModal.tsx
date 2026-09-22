import React from 'react';
import { 
  X, 
  MapPin, 
  Building2, 
  Calendar, 
  Phone, 
  Mail, 
  FileText, 
  Download, 
  ExternalLink,
  Send,
  Briefcase
} from 'lucide-react';
import { JobPosting } from '../../types';

interface JobDetailsModalProps {
  job: JobPosting;
  lang: 'bn' | 'en';
  onClose: () => void;
  onApply: (job: JobPosting) => void;
}

export const JobDetailsModal: React.FC<JobDetailsModalProps> = ({
  job,
  lang,
  onClose,
  onApply
}) => {
  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in"
      id="job-details-modal"
    >
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-emerald-800 to-teal-800 p-4 sm:p-5 text-white flex items-start justify-between gap-3">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider bg-white/20 border border-white/30 text-white px-2 py-0.5 rounded-md">
                {job.category}
              </span>
              <span className="text-[10px] font-bold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-md">
                {job.jobType}
              </span>
            </div>
            <h3 className="text-base sm:text-lg font-black leading-snug pt-1">
              {job.title}
            </h3>
            {job.designation && job.designation !== job.title && (
              <p className="text-xs text-emerald-200 font-semibold">
                পদবী: {job.designation}
              </p>
            )}
            <p className="text-xs text-amber-200 font-bold flex items-center gap-1">
              <Building2 className="w-3.5 h-3.5" />
              <span>{job.companyName}</span>
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer shrink-0"
            id="btn-close-job-details"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs sm:text-sm">
          
          {/* Circular Attachment (if available) */}
          {job.circularUrl && (
            <div className="p-3 bg-sky-50 border border-sky-200 rounded-2xl flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-sky-600 text-white flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-sky-950">
                    মূল সার্কুলার ফাইল {job.circularFileName ? `(${job.circularFileName})` : ''}
                  </p>
                  <p className="text-[10px] text-sky-700">
                    নিয়োগ বিজ্ঞপ্তি ডাউনলোড বা দেখতে নিচে ক্লিক করুন
                  </p>
                </div>
              </div>

              <a
                href={job.circularUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={job.circularFileName || 'job-circular'}
                className="px-3 py-1.5 bg-sky-700 hover:bg-sky-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>ডাউনলোড / দেখুন</span>
              </a>
            </div>
          )}

          {/* Quick Info Grid */}
          <div className="grid grid-cols-2 gap-2.5 p-3 bg-slate-50 rounded-2xl border border-slate-200/80">
            <div>
              <span className="text-[10px] text-slate-500 font-bold block">মাসিক বেতন:</span>
              <span className="font-black text-emerald-700 text-sm sm:text-base">{job.salary || 'আলোচনাসাপেক্ষে'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold block">কর্মস্থল / অবস্থান:</span>
              <span className="font-bold text-slate-800 flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{job.upazila ? `${job.upazila}, ` : ''}{job.district}</span>
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold block">শিক্ষাগত যোগ্যতা:</span>
              <span className="font-bold text-slate-800">{job.education || 'বিজ্ঞপ্তি অনুযায়ী'}</span>
            </div>
            <div>
              <span className="text-[10px] text-slate-500 font-bold block">প্রয়োজনীয় অভিজ্ঞতা:</span>
              <span className="font-bold text-slate-800">{job.experience || 'নতুনদেরও সুযোগ রয়েছে'}</span>
            </div>
          </div>

          {/* Detailed Address */}
          {job.address && (
            <div className="text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100 flex items-start gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
              <span><strong>অফিস / কর্মস্থলের ঠিকানা:</strong> {job.address}</span>
            </div>
          )}

          {/* Description */}
          {job.description && (
            <div className="space-y-1">
              <h4 className="font-black text-slate-900 text-xs sm:text-sm">কাজের বিবরণ ও দায়িত্ব:</h4>
              <p className="text-slate-600 text-xs leading-relaxed whitespace-pre-line bg-white p-3 rounded-xl border border-slate-100">
                {job.description}
              </p>
            </div>
          )}

          {/* Requirements */}
          {job.requirements && job.requirements.length > 0 && (
            <div className="space-y-1">
              <h4 className="font-black text-slate-900 text-xs sm:text-sm">শর্তাবলী ও যোগ্যতা:</h4>
              <ul className="space-y-1 pl-4 list-disc text-slate-600 text-xs">
                {job.requirements.map((req, i) => (
                  <li key={i}>{req}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Skills */}
          {job.skills && job.skills.length > 0 && (
            <div className="space-y-1.5">
              <h4 className="font-black text-slate-900 text-xs">প্রয়োজনীয় স্কিলসমূহ:</h4>
              <div className="flex flex-wrap gap-1.5">
                {job.skills.map((sk, i) => (
                  <span key={i} className="px-2 py-0.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-bold">
                    {sk}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Deadline & Instructions */}
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
            <div className="flex items-center gap-1.5 text-amber-900 font-black text-xs">
              <Calendar className="w-3.5 h-3.5 text-amber-700" />
              <span>আবেদনের শেষ সময়: {job.deadline || 'চলমান'}</span>
            </div>
            {job.applyInstructions && (
              <p className="text-xs text-amber-800 leading-relaxed">
                {job.applyInstructions}
              </p>
            )}
          </div>

        </div>

        {/* Modal Footer Actions */}
        <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <a
              href={`tel:${job.contactPhone}`}
              className="flex-1 py-2.5 px-3 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs sm:text-sm rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer active:scale-95 text-center"
              id="btn-call-employer"
            >
              <Phone className="w-4 h-4 fill-white shrink-0" />
              <span>কল করুন: {job.contactPhone}</span>
            </a>

            {job.contactEmail && (
              <a
                href={`mailto:${job.contactEmail}?subject=Application for ${encodeURIComponent(job.title)}`}
                className="p-2.5 bg-white border border-slate-300 hover:bg-slate-100 text-slate-700 rounded-xl transition cursor-pointer"
                title="ইমেইল করুন"
              >
                <Mail className="w-4 h-4" />
              </a>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              onClose();
              onApply(job);
            }}
            className="py-2.5 px-4 bg-amber-500 hover:bg-amber-400 active:scale-95 text-slate-950 font-black text-xs sm:text-sm rounded-xl transition shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
            id="btn-apply-job"
          >
            <Send className="w-4 h-4" />
            <span>সিভি / আবেদন পাঠান</span>
          </button>
        </div>

      </div>
    </div>
  );
};
