import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  Briefcase, 
  Users, 
  Plus, 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  Edit3, 
  Copy, 
  PauseCircle, 
  PlayCircle, 
  XCircle, 
  Trash2, 
  Calendar, 
  MapPin, 
  DollarSign, 
  Award, 
  ShieldCheck, 
  Clock, 
  FileCheck, 
  Share2, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  AlertCircle,
  TrendingUp,
  UserCheck,
  Phone,
  Mail,
  Layers,
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  EmployerJobVacancy, 
  EmployerProfile, 
  RecruitmentMetrics, 
  JobLifecycleStatus, 
  VerificationTier 
} from '../../types/employer';
import { EmployerService } from '../../services/employerService';
import { JobPostingWizard } from './JobPostingWizard';
import { ApplicantTracker } from './ApplicantTracker';
import { PublicCompanyProfile } from './PublicCompanyProfile';

interface EmployerDashboardProps {
  onShowToast: (msg: string) => void;
  onNavigateJobSeeker?: () => void;
}

export const EmployerDashboard: React.FC<EmployerDashboardProps> = ({
  onShowToast,
  onNavigateJobSeeker
}) => {
  // Navigation tabs
  const [activeTab, setActiveTab] = useState<'vacancies' | 'ats' | 'profile' | 'compliance'>('vacancies');

  // State
  const [profile, setProfile] = useState<EmployerProfile>(EmployerService.getStoredProfile());
  const [jobs, setJobs] = useState<EmployerJobVacancy[]>([]);
  const [metrics, setMetrics] = useState<RecruitmentMetrics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Vacancy filters
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Modals & Drawers
  const [isWizardOpen, setIsWizardOpen] = useState<boolean>(false);
  const [jobToEdit, setJobToEdit] = useState<EmployerJobVacancy | null>(null);
  const [selectedJobForAts, setSelectedJobForAts] = useState<string | undefined>(undefined);
  const [previewJob, setPreviewJob] = useState<EmployerJobVacancy | null>(null);

  // Company Profile Edit State
  const [isEditingProfile, setIsEditingProfile] = useState<boolean>(false);
  const [companyNameBn, setCompanyNameBn] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [tradeLicense, setTradeLicense] = useState('');
  const [aboutCompany, setAboutCompany] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [industry, setIndustry] = useState('');
  const [address, setAddress] = useState('');

  // Initial Data Fetch
  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [fetchedProfile, fetchedJobs, fetchedMetrics] = await Promise.all([
        EmployerService.getEmployerProfile(),
        EmployerService.getEmployerJobs(),
        EmployerService.getRecruitmentMetrics()
      ]);
      setProfile(fetchedProfile);
      setJobs(fetchedJobs);
      setMetrics(fetchedMetrics);

      // Seed edit form
      setCompanyNameBn(fetchedProfile.companyNameBn || fetchedProfile.companyName);
      setCompanyName(fetchedProfile.companyName);
      setTradeLicense(fetchedProfile.tradeLicenseNumber || '');
      setAboutCompany(fetchedProfile.aboutCompany || '');
      setContactPhone(fetchedProfile.contactPhone || '');
      setContactEmail(fetchedProfile.contactEmail || '');
      setIndustry(fetchedProfile.industry || '');
      setAddress(fetchedProfile.address || '');
    } catch (e) {
      onShowToast('ড্যাশবোর্ড তথ্য লোড করতে সমস্যা হয়েছে।');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Filtered jobs
  const filteredJobs = jobs.filter(job => {
    if (statusFilter !== 'all' && job.status.toLowerCase() !== statusFilter.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      return (
        job.title.toLowerCase().includes(q) ||
        job.category.toLowerCase().includes(q) ||
        job.district.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Action handlers
  const handleLifecycleAction = async (
    jobId: string, 
    action: 'pause' | 'close' | 'reopen' | 'duplicate' | 'delete'
  ) => {
    try {
      const res = await EmployerService.mutateJobLifecycle(jobId, action);
      if (res.success) {
        onShowToast(res.message);
        loadDashboardData();
      }
    } catch (e) {
      onShowToast('অ্যাকশন সম্পন্ন করা যায়নি।');
    }
  };

  // Launch Wizard for new job
  const handleOpenNewJob = () => {
    setJobToEdit(null);
    setIsWizardOpen(true);
  };

  // Launch Wizard to edit
  const handleEditJob = (job: EmployerJobVacancy) => {
    setJobToEdit(job);
    setIsWizardOpen(true);
  };

  // Save profile changes
  const handleSaveProfile = async () => {
    try {
      const updated = await EmployerService.updateEmployerProfile({
        companyName,
        companyNameBn,
        tradeLicenseNumber: tradeLicense,
        aboutCompany,
        contactPhone,
        contactEmail,
        industry,
        address
      });
      setProfile(updated);
      setIsEditingProfile(false);
      onShowToast('কোম্পানি প্রোফাইল সফলভাবে আপডেট হয়েছে!');
    } catch (e) {
      onShowToast('প্রোফাইল আপডেট ব্যর্থ হয়েছে।');
    }
  };

  // Verification Badge Helper
  const renderVerificationBadge = (tier: VerificationTier) => {
    switch (tier) {
      case 'Professionally_Verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-400 text-amber-900 text-xs font-black shadow-2xs">
            <Award className="w-3.5 h-3.5 text-amber-600 fill-amber-500" />
            <span>প্রফেশনাল ভেরিফাইড এন্টারপ্রাইজ</span>
          </span>
        );
      case 'Business_Verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-black shadow-2xs">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>বিজনেস ভেরিফাইড (ট্রেড লাইসেন্স)</span>
          </span>
        );
      case 'Phone_Verified':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" />
            <span>ফোন ভেরিফাইড</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-bold">
            <span>প্রাথমিক অ্যাকাউন্ট</span>
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-2 sm:px-4 py-4" id="employer-portal-dashboard">
      
      {/* ================= 1. TOP EMPLOYER BRANDING BANNER ================= */}
      <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-emerald-900 rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden">
        {/* Background ambient accents */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none"></div>
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-amber-400/10 rounded-full blur-2xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          {/* Company Branding Info */}
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl bg-white p-2 border-2 border-white/20 shadow-md shrink-0 flex items-center justify-center overflow-hidden">
              <img 
                src={profile.logoUrl || '/runner-logo.png'} 
                alt={profile.companyName} 
                className="w-full h-full object-contain" 
              />
            </div>

            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-black tracking-tight text-white">
                  {profile.companyNameBn || profile.companyName}
                </h1>
                {renderVerificationBadge(profile.verificationTier)}
              </div>

              <p className="text-xs text-emerald-100 flex items-center gap-3 flex-wrap">
                <span className="flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{profile.industry || 'বাণিজ্যিক প্রতিষ্ঠান'}</span>
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{profile.district}, {profile.upazila}</span>
                </span>
                {profile.tradeLicenseNumber && (
                  <>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-amber-200">
                      <FileCheck className="w-3.5 h-3.5" />
                      <span>লাইসেন্স: {profile.tradeLicenseNumber}</span>
                    </span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Quick Action Button */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto">
            <button
              type="button"
              onClick={handleOpenNewJob}
              className="flex-1 sm:flex-initial px-5 py-3 rounded-2xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-xs sm:text-sm shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>নতুন নিয়োগ পোস্ট করুন</span>
            </button>
          </div>
        </div>
      </div>

      {/* ================= 2. RECRUITMENT METRICS TILES ================= */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5">
        {[
          { label: 'মোট সার্কুলার', value: metrics?.totalJobs ?? jobs.length, icon: Briefcase, color: 'text-slate-800', bg: 'bg-white' },
          { label: 'সক্রিয় নিয়োগ', value: metrics?.activeJobs ?? jobs.filter(j => j.status === 'Active').length, icon: PlayCircle, color: 'text-emerald-700', bg: 'bg-emerald-50/70' },
          { label: 'পজ / স্থগিত', value: metrics?.pausedJobs ?? jobs.filter(j => j.status === 'Paused').length, icon: PauseCircle, color: 'text-amber-700', bg: 'bg-amber-50/70' },
          { label: 'ড্রাফট পোস্ট', value: metrics?.draftJobs ?? jobs.filter(j => j.status === 'Draft').length, icon: FileText, color: 'text-slate-600', bg: 'bg-slate-50' },
          { label: 'মোট আবেদনকারী', value: metrics?.totalApplicants ?? 0, icon: Users, color: 'text-blue-700', bg: 'bg-blue-50/70' },
          { label: 'নতুন আবেদন', value: metrics?.newApplicants ?? 0, icon: Sparkles, color: 'text-indigo-700', bg: 'bg-indigo-50/70' },
          { label: 'ইন্টারভিউ শিডিউল', value: metrics?.interviewScheduledCount ?? 0, icon: Calendar, color: 'text-purple-700', bg: 'bg-purple-50/70' },
          { label: 'চূড়ান্ত নির্বাচিত', value: metrics?.hiredCount ?? 0, icon: UserCheck, color: 'text-teal-700', bg: 'bg-teal-50/70' },
        ].map((tile, i) => {
          const Icon = tile.icon;
          return (
            <div 
              key={i} 
              className={`${tile.bg} p-3 rounded-2xl border border-slate-200/80 shadow-2xs flex flex-col justify-between`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-slate-500">{tile.label}</span>
                <Icon className={`w-3.5 h-3.5 ${tile.color}`} />
              </div>
              <div className={`text-lg sm:text-xl font-black mt-2 ${tile.color}`}>
                {tile.value}
              </div>
            </div>
          );
        })}
      </div>

      {/* ================= 3. NAVIGATION TAB BAR ================= */}
      <div className="bg-white rounded-2xl p-1.5 border border-slate-200 shadow-xs flex items-center gap-1.5 overflow-x-auto">
        {[
          { id: 'vacancies', label: 'চাকরির সার্কুলার ও বিজ্ঞাপন', icon: Briefcase },
          { id: 'ats', label: 'অ্যাপ্লিক্যান্ট ট্র্যাকার (ATS)', icon: Users },
          { id: 'profile', label: 'কোম্পানি ব্র্যান্ডিং ও প্রোফাইল', icon: Building2 },
          { id: 'compliance', label: 'ভেরিফিকেশন ও কমপ্লায়েন্স', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 rounded-xl font-black text-xs transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-emerald-700 text-white shadow-xs'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================= 4. TAB CONTENTS ================= */}

      {/* TAB 1: VACANCIES LIST & LIFECYCLE MANAGEMENT */}
      {activeTab === 'vacancies' && (
        <div className="space-y-4">
          {/* Sub-filters & Search Bar */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Status Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {[
                { id: 'all', label: 'সবগুলো' },
                { id: 'active', label: 'সক্রিয়' },
                { id: 'draft', label: 'ড্রাফট' },
                { id: 'paused', label: 'স্থগিত' },
                { id: 'closed', label: 'সমাপ্ত' },
              ].map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setStatusFilter(st.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                    statusFilter === st.id
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>

            {/* Search Box */}
            <div className="relative sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="পদবী বা ক্যাটাগরি অনুসন্ধান করুন..."
                className="w-full pl-9 pr-4 py-2 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-slate-50"
              />
            </div>
          </div>

          {/* Jobs List Grid / Cards */}
          {filteredJobs.length === 0 ? (
            <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
              <Briefcase className="w-10 h-10 text-slate-300 mx-auto" />
              <h3 className="text-sm font-black text-slate-800">কোনো সার্কুলার পাওয়া যায়নি</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                আপনি এই ক্যাটাগরিতে এখনো কোনো নিয়োগ বিজ্ঞপ্তি প্রকাশ করেননি বা ফিল্টারের সাথে মিলছে না।
              </p>
              <button
                type="button"
                onClick={handleOpenNewJob}
                className="px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-black hover:bg-emerald-800 transition cursor-pointer"
              >
                নতুন নিয়োগ পোস্ট করুন
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredJobs.map(job => (
                <div
                  key={job.id}
                  className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200 shadow-xs hover:shadow-md transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                >
                  {/* Left Info */}
                  <div className="space-y-1.5 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-lg">
                        {job.category}
                      </span>

                      {/* Status Tag */}
                      <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-lg ${
                        job.status === 'Active'
                          ? 'bg-emerald-100 text-emerald-800'
                          : job.status === 'Paused'
                            ? 'bg-amber-100 text-amber-800'
                            : job.status === 'Draft'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-red-100 text-red-800'
                      }`}>
                        {job.status === 'Active' ? 'সক্রিয় (Active)' : job.status === 'Paused' ? 'স্থগিত (Paused)' : job.status === 'Draft' ? 'ড্রাফট (Draft)' : 'বন্ধ (Closed)'}
                      </span>

                      {job.isFeatured && (
                        <span className="text-[10px] font-bold bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-600" />
                          <span>ফিচার্ড</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-sm sm:text-base font-black text-slate-900">
                      {job.title}
                    </h3>

                    {/* Metadata chips */}
                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-600 font-medium pt-1">
                      <span className="flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-bold text-slate-800">{job.salaryDisplay}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{job.district}, {job.upazila}</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-slate-400" />
                        <span>পদসংখ্যা: {job.vacanciesCount} জন</span>
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-red-600 font-bold">
                        <Clock className="w-3.5 h-3.5" />
                        <span>শেষ সময়: {job.deadline}</span>
                      </span>
                    </div>
                  </div>

                  {/* Right Actions & Applicants count */}
                  <div className="flex flex-wrap items-center gap-2 self-stretch md:self-auto border-t md:border-t-0 pt-3 md:pt-0 border-slate-100 justify-between md:justify-end">
                    {/* View Applicants Badge Trigger */}
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedJobForAts(job.id);
                        setActiveTab('ats');
                      }}
                      className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-black transition flex items-center gap-1.5 cursor-pointer border border-blue-200"
                      title="আবেদনকারী পাইপলাইন দেখুন"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>{job.applicantCount || 0} আবেদন</span>
                    </button>

                    {/* Edit */}
                    <button
                      type="button"
                      onClick={() => handleEditJob(job)}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                      title="চাকরির তথ্য সম্পাদনা করুন"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Duplicate */}
                    <button
                      type="button"
                      onClick={() => handleLifecycleAction(job.id, 'duplicate')}
                      className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                      title="অনুরূপ কপি তৈরি করুন (Duplicate)"
                    >
                      <Copy className="w-4 h-4" />
                    </button>

                    {/* Pause / Resume */}
                    {job.status === 'Active' ? (
                      <button
                        type="button"
                        onClick={() => handleLifecycleAction(job.id, 'pause')}
                        className="p-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 transition cursor-pointer"
                        title="বিজ্ঞপ্তি সাময়িক স্থগিত করুন"
                      >
                        <PauseCircle className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleLifecycleAction(job.id, 'reopen')}
                        className="p-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition cursor-pointer"
                        title="বিজ্ঞপ্তি পুনরায় সক্রিয় করুন"
                      >
                        <PlayCircle className="w-4 h-4" />
                      </button>
                    )}

                    {/* Close */}
                    {job.status !== 'Closed' && (
                      <button
                        type="button"
                        onClick={() => handleLifecycleAction(job.id, 'close')}
                        className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 transition cursor-pointer"
                        title="নিয়োগ সম্পন্ন ঘোষণা করুন"
                      >
                        <XCircle className="w-4 h-4" />
                      </button>
                    )}

                    {/* Delete */}
                    <button
                      type="button"
                      onClick={() => {
                        if (window.confirm('আপনি কি নিশ্চিতভাবে এই চাকরির বিজ্ঞপ্তি মুছে ফেলতে চান?')) {
                          handleLifecycleAction(job.id, 'delete');
                        }
                      }}
                      className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 transition cursor-pointer"
                      title="মুছে ফেলুন"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ATS APPLICANT TRACKER */}
      {activeTab === 'ats' && (
        <ApplicantTracker 
          initialJobId={selectedJobForAts} 
          onShowToast={onShowToast} 
        />
      )}

      {/* TAB 3: COMPANY BRANDING & PUBLIC PROFILE */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Toggle View vs Edit */}
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200">
            <div>
              <h3 className="text-sm font-black text-slate-800">প্রতিষ্ঠানের ব্র্যান্ডিং পেজ</h3>
              <p className="text-xs text-slate-500">প্রার্থীরা এই পেজে আপনার কোম্পানির বিস্তারিত তথ্য ও সক্রিয় সার্কুলার দেখতে পাবেন।</p>
            </div>

            <button
              type="button"
              onClick={() => setIsEditingProfile(!isEditingProfile)}
              className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>{isEditingProfile ? 'পাবলিক ভিউ দেখুন' : 'তথ্য সম্পাদনা করুন'}</span>
            </button>
          </div>

          {isEditingProfile ? (
            /* Editable Profile Form */
            <div className="bg-white rounded-3xl p-5 sm:p-7 border border-slate-200 shadow-xs space-y-4">
              <h4 className="text-sm font-black text-slate-900 border-b border-slate-100 pb-2">
                কোম্পানির বিবরণ ও পরিচিতি আপডেট
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">কোম্পানির নাম (বাংলা) *</label>
                  <input
                    type="text"
                    value={companyNameBn}
                    onChange={e => setCompanyNameBn(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Company Name (English) *</label>
                  <input
                    type="text"
                    value={companyName}
                    onChange={e => setCompanyName(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">ট্রেড লাইসেন্স নম্বর</label>
                  <input
                    type="text"
                    value={tradeLicense}
                    onChange={e => setTradeLicense(e.target.value)}
                    placeholder="TRAD/CHT/2024/XXXX"
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">ব্যবসার ধরন / খাত (Industry)</label>
                  <input
                    type="text"
                    value={industry}
                    onChange={e => setIndustry(e.target.value)}
                    placeholder="যেমন: তথ্যপ্রযুক্তি, পর্যটন, কৃষি"
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">হটলাইন / মোবাইল নম্বর</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={e => setContactPhone(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">এইচআর / রিক্রুটমেন্ট ইমেইল</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={e => setContactEmail(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">পূর্ণ ঠিকানা</label>
                  <input
                    type="text"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">কোম্পানির পরিচিতি ও মিশন</label>
                  <textarea
                    rows={3}
                    value={aboutCompany}
                    onChange={e => setAboutCompany(e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditingProfile(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold hover:bg-slate-200 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="button"
                  onClick={handleSaveProfile}
                  className="px-5 py-2 rounded-xl bg-emerald-700 text-white text-xs font-black hover:bg-emerald-800 shadow-md cursor-pointer"
                >
                  পরিবর্তন সংরক্ষণ করুন
                </button>
              </div>
            </div>
          ) : (
            /* Live Public View */
            <PublicCompanyProfile
              companyId={profile.id}
              isOwner={true}
              onEditProfile={() => setIsEditingProfile(true)}
              onShowToast={onShowToast}
            />
          )}
        </div>
      )}

      {/* TAB 4: VERIFICATION & COMPLIANCE */}
      {activeTab === 'compliance' && (
        <div className="space-y-6">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-xs space-y-6">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span>ঝাদিমাদি রিক্রুটার ভেরিফিকেশন ও ট্রাস্ট টায়ারস</span>
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                চাকরিপ্রার্থীদের সুরক্ষা এবং ভুয়া নিয়োগ বিজ্ঞপ্তি রোধে ঝাদিমাদি ৪-স্তরের ভেরিফিকেশন নীতিমালা অনুসরণ করে।
              </p>
            </div>

            {/* 4 Tiers Comparison */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  tier: 'Unverified',
                  title: '১. আনভেরিফাইড (Unverified)',
                  desc: 'বেসিক অ্যাকাউন্ট। সর্বোচ্চ ১টি চাকরি পোস্ট করার অনুমতি। বিজ্ঞপ্তিতে কোনো ট্রাস্ট ব্যাজ থাকবে না।',
                  active: profile.verificationTier === 'Unverified',
                  color: 'border-slate-300 bg-slate-50'
                },
                {
                  tier: 'Phone_Verified',
                  title: '২. ফোন ভেরিফাইড (Phone Verified)',
                  desc: 'ওটিপি যাচাই সম্পন্ন। মাসে সর্বোচ্চ ৩টি চাকরি পোস্ট এবং আবেদনকারীদের তালিকা দেখা সম্ভব।',
                  active: profile.verificationTier === 'Phone_Verified',
                  color: 'border-blue-300 bg-blue-50/50'
                },
                {
                  tier: 'Business_Verified',
                  title: '৩. বিজনেস ভেরিফাইড (Business Verified)',
                  desc: 'বৈধ ট্রেড লাইসেন্স ও সরকারি রেজিস্ট্রেশন অনুমোদিত। আনলিমিটেড চাকরি পোস্টিং ও গ্রিন ব্যাজ।',
                  active: profile.verificationTier === 'Business_Verified',
                  color: 'border-emerald-400 bg-emerald-50/70'
                },
                {
                  tier: 'Professionally_Verified',
                  title: '৪. প্রফেশনাল এন্টারপ্রাইজ (Top Tier)',
                  desc: 'ঝাদিমাদির সাথে কর্পোরেট চুক্তি সম্পন্ন। সরাসরি ক্যান্ডিডেট ম্যাচিং এবং প্রিমিয়াম ফিচার্ড অবস্থান।',
                  active: profile.verificationTier === 'Professionally_Verified',
                  color: 'border-amber-400 bg-amber-50/70'
                },
              ].map((item, i) => (
                <div 
                  key={i} 
                  className={`p-4 rounded-2xl border-2 ${item.color} flex flex-col justify-between space-y-3 relative`}
                >
                  {item.active && (
                    <span className="absolute -top-3 right-3 px-2 py-0.5 rounded-full bg-slate-900 text-white text-[10px] font-black shadow-xs">
                      বর্তমান স্ট্যাটাস
                    </span>
                  )}
                  <div>
                    <h4 className="text-xs font-black text-slate-900">{item.title}</h4>
                    <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Current Status Banner */}
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <Award className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-emerald-950">
                    আপনার প্রতিষ্ঠান বর্তমানে '{profile.verificationTier}' স্তরে রয়েছে
                  </h4>
                  <p className="text-[11px] text-emerald-800">
                    ট্রেড লাইসেন্স: {profile.tradeLicenseNumber || 'অনুমোদিত'} • নিরাপদ নিয়োগকর্তা হিসেবে স্বীকৃত
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onShowToast('আপনার ভেরিফিকেশন ইতিমধ্যে সক্রিয় ও সম্পূর্ণ!')}
                className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-black transition cursor-pointer"
              >
                ডকুমেন্ট হালনাগাদ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= 5. JOB POSTING WIZARD MODAL ================= */}
      <JobPostingWizard
        isOpen={isWizardOpen}
        onClose={() => setIsWizardOpen(false)}
        initialJobToEdit={jobToEdit}
        onJobPublished={savedJob => {
          setIsWizardOpen(false);
          loadDashboardData();
        }}
        onShowToast={onShowToast}
      />
    </div>
  );
};
