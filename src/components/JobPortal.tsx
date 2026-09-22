import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  ClipboardList, 
  Users, 
  Building2, 
  FileText, 
  ArrowLeft,
  PlusCircle,
  MapPin,
  Clock,
  Trash2,
  Eye,
  Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { JobPosting, JobCandidate, UserProfile } from '../types';
import { fetchJobListings, fetchJobCandidates, deleteJobPosting } from '../services/jobService';
import { LOCATION_MASTER, DistrictItem, UpazilaItem } from '../data/locationMaster';
import { JobSeekerView } from './job/JobSeekerView';
import { JobCandidateDirectory } from './job/JobCandidateDirectory';
import { DropCvView } from './job/DropCvView';
import { PostJobModal } from './job/PostJobModal';
import { JobDetailsModal } from './job/JobDetailsModal';
import { ApplicationModal } from './jobseeker/ApplicationModal';
import { getMasterProfile } from '../services/jobSeekerService';
import { MasterJobSeekerProfile } from '../types/jobseeker';

export type JobPortalTab = 'all_jobs' | 'seeker_list' | 'employer' | 'drop_cv';
export type JobPortalView = JobPortalTab | 'landing';

export interface JobPortalProps {
  lang: 'bn' | 'en';
  currentUser?: UserProfile | null;
  onBackToHome?: () => void;
  onShowToast: (msg: string) => void;
  embedded?: boolean;
  initialView?: JobPortalView;
  initialRoleTab?: 'find_job' | 'jobseeker_hub' | 'post_job';
}

export const JobPortal: React.FC<JobPortalProps> = ({
  lang,
  currentUser,
  onBackToHome,
  onShowToast,
  embedded = false,
  initialView = 'all_jobs',
  initialRoleTab,
}) => {
  // Horizontal Navigation State (Default active state on load: 'all_jobs' [সকল চাকরি])
  const [activeTab, setActiveTab] = useState<JobPortalTab>(() => {
    if (initialRoleTab === 'post_job' || initialView === 'employer') return 'employer';
    if (initialRoleTab === 'jobseeker_hub' || initialView === 'drop_cv') return 'drop_cv';
    if (initialView === 'seeker_list') return 'seeker_list';
    return 'all_jobs';
  });

  const [masterProfile] = useState<MasterJobSeekerProfile>(getMasterProfile());
  const [jobFor1ClickApply, setJobFor1ClickApply] = useState<JobPosting | null>(null);

  // Jobs data
  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [isLoadingJobs, setIsLoadingJobs] = useState<boolean>(true);

  // Modals state
  const [selectedJobForDetails, setSelectedJobForDetails] = useState<JobPosting | null>(null);
  const [showPostJobModal, setShowPostJobModal] = useState<boolean>(false);

  // Flat list of all districts
  const allDistricts = useMemo(() => {
    const list: { nameBn: string; nameEn: string; code: string; upazilas: UpazilaItem[]; divisionBn: string }[] = [];
    LOCATION_MASTER.forEach(div => {
      div.districts.forEach(dist => {
        list.push({
          nameBn: dist.nameBn,
          nameEn: dist.nameEn,
          code: dist.code,
          upazilas: dist.upazilas,
          divisionBn: div.nameBn
        });
      });
    });
    return list;
  }, []);

  // Load Job Postings
  const loadJobsData = useCallback(async () => {
    setIsLoadingJobs(true);
    try {
      const data = await fetchJobListings();
      setJobs(data || []);
    } catch (err) {
      console.error('Error loading jobs:', err);
      onShowToast(lang === 'bn' ? 'চাকরির তালিকা লোড করতে সমস্যা হয়েছে' : 'Failed to load jobs');
    } finally {
      setIsLoadingJobs(false);
    }
  }, [lang, onShowToast]);

  useEffect(() => {
    loadJobsData();
  }, [loadJobsData]);

  // When a job is posted by employer
  const handleJobCreated = (newJob: JobPosting) => {
    setJobs(prev => [newJob, ...prev]);
  };

  // When a job is deleted
  const handleJobDeleted = async (id: string) => {
    await deleteJobPosting(id);
    setJobs(prev => prev.filter(j => j.id !== id));
    onShowToast(lang === 'bn' ? 'নিয়োগ বিজ্ঞপ্তিটি মুছে ফেলা হয়েছে' : 'Job circular deleted');
  };

  // Filter jobs posted by current user or in this session
  const myPublishedJobs = useMemo(() => {
    return jobs.filter(j => {
      if (currentUser?.id && j.employerId === currentUser.id) return true;
      if (currentUser?.phone && j.contactPhone === currentUser.phone) return true;
      return false;
    });
  }, [jobs, currentUser]);

  // 4 Minimal Navigation Tabs Definition (Icon + Label, from left to right)
  const navTabs = [
    {
      id: 'all_jobs' as JobPortalTab,
      label: lang === 'bn' ? 'সকল চাকরি' : 'All Jobs',
      icon: ClipboardList,
    },
    {
      id: 'seeker_list' as JobPortalTab,
      label: lang === 'bn' ? 'প্রার্থী লিস্ট' : 'Candidate List',
      icon: Users,
    },
    {
      id: 'employer' as JobPortalTab,
      label: lang === 'bn' ? 'চাকরিদাতা' : 'Employer',
      icon: Building2,
    },
    {
      id: 'drop_cv' as JobPortalTab,
      label: lang === 'bn' ? 'সিভি ড্রপ' : 'Drop CV',
      icon: FileText,
    },
  ];

  return (
    <div 
      className={`w-full ${embedded ? 'bg-transparent pb-6' : 'bg-white min-h-screen pb-20'} text-slate-800`} 
      id="job-portal-main-view"
    >
      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 sm:py-4 space-y-3">
        
        {/* =========================================================================
            1. HEADER SECTION
            - Background must be clean solid white.
            - Display official Jhadimadi.com logo.
            - Bengali text "জাদিমাটি ডট কম" and English text "Jhadimadi.com" neatly placed together.
            - Below the logo, instruction text in bold: "আপনার পছন্দের বিষয়টি সিলেক্ট করুন।"
            - Remove any unnecessary background green card wrappers or extra borders around the header.
            ========================================================================= */}
        <header 
          className="w-full bg-white pt-2 pb-2 px-2 flex flex-col items-center justify-center text-center space-y-2 select-none" 
          id="job-portal-header"
        >
          {/* Optional Back to Home Navigation */}
          {onBackToHome && (
            <div className="w-full flex items-center justify-between pb-1">
              <button
                type="button"
                onClick={onBackToHome}
                className="text-slate-500 hover:text-emerald-700 font-semibold text-xs flex items-center gap-1 transition cursor-pointer py-1 px-2 rounded-lg hover:bg-slate-50"
                id="btn-back-home"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'হোমে ফিরুন' : 'Back to Home'}</span>
              </button>
              <span className="text-[11px] text-slate-400 font-medium">Jhadimadi.com</span>
            </div>
          )}

          {/* Instruction text in bold - shifted directly upward */}
          <p 
            className="text-xs sm:text-sm font-bold text-slate-900 tracking-normal pt-1"
            id="job-portal-instruction-text"
          >
            {lang === 'bn' ? 'আপনার পছন্দের বিষয়টি সিলেক্ট করুন।' : 'Please select your preferred option.'}
          </p>
        </header>

        {/* =========================================================================
            2. HORIZONTAL NAVIGATION BAR (App Bottom/Top Style)
            - 4 distinct, minimal icon-based tabs horizontally from left to right
            - No heavy colored background boxes
            - Options:
              1. [ 📋 সকল চাকরি ] (Default active state on load)
              2. [ 👥 প্রার্থী লিস্ট ]
              3. [ 🏢 চাকরিদাতা ]
              4. [ 📄 সিভি ড্রপ ]
            ========================================================================= */}
        <nav 
          className="bg-white border-y border-slate-200 sticky top-0 z-20 shadow-2xs" 
          id="job-portal-horizontal-nav"
          aria-label="Job Portal Navigation"
        >
          <div className="grid grid-cols-4 divide-x divide-slate-100">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`min-h-[48px] py-2.5 px-1 sm:px-3 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition cursor-pointer select-none border-b-2 relative ${
                    isActive
                      ? 'border-emerald-600 text-emerald-800 font-bold bg-emerald-50/40'
                      : 'border-transparent text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-medium'
                  }`}
                  id={`tab-btn-${tab.id}`}
                >
                  <Icon className={`w-4 h-4 sm:w-4.5 sm:h-4.5 shrink-0 ${isActive ? 'text-emerald-700' : 'text-slate-400'}`} />
                  <span className="text-[11px] sm:text-xs md:text-sm whitespace-nowrap">
                    {tab.label}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* =========================================================================
            3. DYNAMIC CONTENT BODY
            ========================================================================= */}
        <main className="pt-1" id="job-portal-content-body">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -3 }}
              transition={{ duration: 0.12 }}
            >
              {/* TAB 1: [ 📋 সকল চাকরি ] */}
              {activeTab === 'all_jobs' && (
                <JobSeekerView
                  lang={lang}
                  jobs={jobs}
                  isLoading={isLoadingJobs}
                  onSelectJobForDetails={(job) => setSelectedJobForDetails(job)}
                  onApplyForJob={(job) => setJobFor1ClickApply(job)}
                />
              )}

              {/* TAB 2: [ 👥 প্রার্থী লিস্ট ] */}
              {activeTab === 'seeker_list' && (
                <JobCandidateDirectory
                  lang={lang}
                  currentUser={currentUser}
                  allDistricts={allDistricts}
                  onNavigateToDropCv={() => setActiveTab('drop_cv')}
                  onShowToast={onShowToast}
                />
              )}

              {/* TAB 3: [ 🏢 চাকরিদাতা ] */}
              {activeTab === 'employer' && (
                <div className="py-8 flex flex-col items-center justify-center space-y-6" id="employer-tab-container">
                  {/* Prominent Yellow/Amber button */}
                  <div className="w-full flex justify-center">
                    <button
                      type="button"
                      onClick={() => setShowPostJobModal(true)}
                      className="px-8 py-3.5 bg-amber-400 hover:bg-amber-300 active:scale-98 text-slate-950 font-black text-sm sm:text-base rounded-2xl shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 hover:shadow-lg"
                      id="btn-post-new-job"
                    >
                      <PlusCircle className="w-5 h-5 text-slate-950" />
                      <span>নতুন নিয়োগ পোস্ট করুন</span>
                    </button>
                  </div>

                  {/* Body area below remains clean and empty unless listings exist */}
                  {myPublishedJobs.length > 0 ? (
                    <div className="w-full space-y-3 pt-4 border-t border-slate-100">
                      <h3 className="text-xs sm:text-sm font-bold text-slate-700 px-1">
                        আপনার প্রকাশিত নিয়োগ বিজ্ঞপ্তি ({myPublishedJobs.length}টি)
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {myPublishedJobs.map((job) => (
                          <div 
                            key={job.id}
                            className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-2"
                          >
                            <div className="flex items-start justify-between gap-2">
                              <span className="text-[10px] font-black bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-md border border-emerald-200">
                                {job.category}
                              </span>
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                {job.jobType}
                              </span>
                            </div>

                            <h4 className="text-sm font-black text-slate-900 leading-snug">
                              {job.title}
                            </h4>
                            <p className="text-xs font-semibold text-slate-600">
                              {job.companyName}
                            </p>

                            <div className="flex items-center justify-between text-[11px] text-slate-600 pt-1">
                              <span className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-emerald-600" />
                                {job.district}
                              </span>
                              <span className="font-bold text-emerald-700">
                                {job.salary}
                              </span>
                            </div>

                            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                              <button
                                type="button"
                                onClick={() => setSelectedJobForDetails(job)}
                                className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                <span>বিস্তারিত</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => handleJobDeleted(job.id)}
                                className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                                <span>মুছে ফেলুন</span>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* TAB 4: [ 📄 সিভি ড্রপ ] */}
              {activeTab === 'drop_cv' && (
                <DropCvView
                  lang={lang}
                  currentUser={currentUser}
                  allDistricts={allDistricts}
                  onNavigateToCandidateList={() => {
                    setActiveTab('seeker_list');
                  }}
                  onNavigateToAllJobs={() => setActiveTab('all_jobs')}
                  onShowToast={onShowToast}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

      </div>

      {/* Post Job Modal for Employer */}
      {showPostJobModal && (
        <PostJobModal
          isOpen={showPostJobModal}
          onClose={() => setShowPostJobModal(false)}
          currentUser={currentUser}
          allDistricts={allDistricts}
          onJobCreated={handleJobCreated}
          onShowToast={onShowToast}
        />
      )}

      {/* 1-Click Application Modal */}
      {jobFor1ClickApply && (
        <ApplicationModal
          lang={lang}
          job={jobFor1ClickApply}
          profile={masterProfile}
          onClose={() => setJobFor1ClickApply(null)}
          onSuccess={(_newApp) => {
            onShowToast(lang === 'bn' ? 'সফলভাবে আবেদন সম্পন্ন হয়েছে!' : 'Application submitted successfully!');
            setJobFor1ClickApply(null);
          }}
          onOpenProfileEditor={() => {
            setJobFor1ClickApply(null);
            setActiveTab('drop_cv');
          }}
          onShowToast={onShowToast}
        />
      )}

      {/* Job Details Modal */}
      {selectedJobForDetails && (
        <JobDetailsModal
          job={selectedJobForDetails}
          lang={lang}
          onClose={() => setSelectedJobForDetails(null)}
          onApply={(job) => {
            setSelectedJobForDetails(null);
            setJobFor1ClickApply(job);
          }}
        />
      )}
    </div>
  );
};
