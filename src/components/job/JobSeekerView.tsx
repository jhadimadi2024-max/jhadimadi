import React from 'react';
import { 
  Briefcase, 
  Building2, 
  MapPin, 
  Clock, 
  Calendar, 
  Eye, 
  Send, 
  Download, 
  FileText 
} from 'lucide-react';
import { JobPosting } from '../../types';

interface JobSeekerViewProps {
  lang: 'bn' | 'en';
  jobs: JobPosting[];
  isLoading: boolean;
  onSelectJobForDetails: (job: JobPosting) => void;
  onApplyForJob: (job: JobPosting) => void;
  // Optional legacy props kept for signature compatibility
  searchQuery?: string;
  setSearchQuery?: (q: string) => void;
  companySearch?: string;
  setCompanySearch?: (c: string) => void;
  selectedDistrict?: string;
  setSelectedDistrict?: (d: string) => void;
  selectedUpazila?: string;
  setSelectedUpazila?: (u: string) => void;
  selectedCategory?: string;
  setSelectedCategory?: (c: string) => void;
  selectedJobType?: string;
  setSelectedJobType?: (t: string) => void;
  allDistricts?: any;
  filterUpazilas?: any;
  onSearch?: () => void;
  onResetFilters?: () => void;
  onRefresh?: () => void;
  onOpenCandidateCVModal?: () => void;
  onSwitchToEmployer?: () => void;
}

export const JobSeekerView: React.FC<JobSeekerViewProps> = ({
  lang,
  jobs,
  isLoading,
  onSelectJobForDetails,
  onApplyForJob,
}) => {
  return (
    <div className="space-y-3 pt-2" id="job-seeker-view">
      {isLoading ? (
        <div className="py-16 text-center space-y-2">
          <div className="w-8 h-8 border-3 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-xs font-bold text-slate-500">
            {lang === 'bn' ? 'চাকরির তালিকা লোড হচ্ছে...' : 'Loading job circulars...'}
          </p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="bg-white p-8 sm:p-12 rounded-2xl border border-slate-100 text-center space-y-2 shadow-2xs my-2">
          <p className="text-sm sm:text-base font-bold text-slate-700">
            আপাতত কোনো চাকরির লিস্ট নাই।
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-3.5">
          {jobs.map((job) => (
            <div
              key={job.id}
              className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-500 shadow-2xs hover:shadow-sm transition-all p-3.5 sm:p-4 flex flex-col justify-between gap-3 group"
            >
              <div className="space-y-2">
                {/* Top Badges */}
                <div className="flex items-start justify-between gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md">
                    {job.category}
                  </span>

                  <div className="flex items-center gap-1.5">
                    {job.submissionType === 'quick_upload' && (
                      <span className="text-[10px] font-bold bg-sky-50 text-sky-700 border border-sky-200 px-1.5 py-0.5 rounded flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        সার্কুলার ফাইল
                      </span>
                    )}
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 flex items-center gap-1 shrink-0">
                      <Clock className="w-2.5 h-2.5 text-slate-500" />
                      {job.jobType}
                    </span>
                  </div>
                </div>

                {/* Title & Company */}
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 group-hover:text-emerald-700 transition leading-snug">
                    {job.title}
                  </h3>
                  {job.designation && job.designation !== job.title && (
                    <p className="text-[11px] font-semibold text-emerald-700">
                      পদবী: {job.designation}
                    </p>
                  )}
                  <p className="text-xs font-bold text-slate-600 flex items-center gap-1 mt-0.5">
                    <Building2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{job.companyName}</span>
                  </p>
                </div>

                {/* Location & Salary Info */}
                <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-700">
                    <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="truncate font-semibold">{job.upazila ? `${job.upazila}, ` : ''}{job.district}</span>
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-900 font-bold justify-end">
                    <span className="text-emerald-700 font-black">{job.salary}</span>
                  </div>
                </div>

                {/* Short Description */}
                {job.description && (
                  <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                    {job.description}
                  </p>
                )}

                {/* Circular File Link if uploaded */}
                {job.circularUrl && (
                  <div className="pt-1">
                    <a
                      href={job.circularUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-bold text-sky-700 hover:text-sky-800 bg-sky-50 border border-sky-200 px-2 py-1 rounded-lg transition"
                      download={job.circularFileName || 'job-circular'}
                    >
                      <Download className="w-3 h-3" />
                      <span>বিজ্ঞপ্তি ফাইল দেখুন / ডাউনলোড</span>
                    </a>
                  </div>
                )}
              </div>

              {/* Footer Actions */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <div className="text-[10px] text-slate-500 font-medium flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-slate-400" />
                  <span>শেষ সময়: {job.deadline || 'চলমান'}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => onSelectJobForDetails(job)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 active:scale-95 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-1 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>বিস্তারিত</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onApplyForJob(job)}
                    className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white font-bold text-xs rounded-xl transition shadow-2xs flex items-center gap-1 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>আবেদন করুন</span>
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
};
