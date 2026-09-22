import React, { useState, useEffect } from 'react';
import { 
  User, 
  Briefcase, 
  FileText, 
  Sparkles, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Bookmark, 
  Send, 
  Printer, 
  UploadCloud, 
  Eye, 
  ShieldCheck, 
  Building2, 
  MapPin, 
  ChevronRight, 
  RefreshCw,
  Search,
  ExternalLink,
  Layers
} from 'lucide-react';
import { MasterJobSeekerProfile, JobApplication } from '../../types/jobseeker';
import { JobPosting } from '../../types';
import { 
  getMasterProfile, 
  fetchCandidateApplications, 
  calculateJobSeekerCompleteness,
  withdrawJobApplication
} from '../../services/jobSeekerService';
import { ProfileEditor } from './ProfileEditor';
import { CvBuilderModal } from './CvBuilderModal';
import { CvUploadParser } from './CvUploadParser';
import { ApplicationModal } from './ApplicationModal';

interface JobSeekerDashboardProps {
  lang: 'bn' | 'en';
  onNavigateToJobs?: () => void;
  onShowToast: (msg: string) => void;
  savedJobs?: JobPosting[];
  onApplyJob?: (job: JobPosting) => void;
}

type DashboardSubView = 'overview' | 'editor' | 'applications' | 'saved' | 'cv_parser';

export const JobSeekerDashboard: React.FC<JobSeekerDashboardProps> = ({
  lang,
  onNavigateToJobs,
  onShowToast,
  savedJobs = [],
  onApplyJob,
}) => {
  const [profile, setProfile] = useState<MasterJobSeekerProfile>(getMasterProfile());
  const [applications, setApplications] = useState<JobApplication[]>([]);
  const [loadingApps, setLoadingApps] = useState(false);
  const [currentView, setCurrentView] = useState<DashboardSubView>('overview');
  
  // Modals
  const [showCvBuilder, setShowCvBuilder] = useState(false);
  const [showCvUploadModal, setShowCvUploadModal] = useState(false);
  const [selectedJobForApply, setSelectedJobForApply] = useState<JobPosting | null>(null);

  // Application filter
  const [appFilter, setAppFilter] = useState<'All' | 'Applied' | 'Under Review' | 'Shortlisted' | 'Interview' | 'Selected' | 'Rejected'>('All');

  // Load applications
  const loadApplications = async (prof: MasterJobSeekerProfile) => {
    setLoadingApps(true);
    try {
      const apps = await fetchCandidateApplications(prof.id, prof.phone);
      setApplications(apps);
    } catch (e) {
      console.warn('Error loading applications:', e);
    } finally {
      setLoadingApps(false);
    }
  };

  useEffect(() => {
    const prof = getMasterProfile();
    setProfile(prof);
    loadApplications(prof);
  }, []);

  const completeness = calculateJobSeekerCompleteness(profile);

  const filteredApplications = applications.filter(app => {
    if (appFilter === 'All') return true;
    return app.status === appFilter;
  });

  const handleWithdraw = async (appId: string) => {
    if (confirm(lang === 'bn' ? 'আপনি কি এই আবেদনটি প্রত্যাহার করতে চান?' : 'Are you sure you want to withdraw this application?')) {
      const ok = await withdrawJobApplication(appId);
      if (ok) {
        setApplications(prev => prev.filter(a => a.id !== appId));
        onShowToast(lang === 'bn' ? 'আবেদন প্রত্যাহার করা হয়েছে।' : 'Application withdrawn.');
      } else {
        onShowToast(lang === 'bn' ? 'প্রত্যাহার ব্যর্থ হয়েছে।' : 'Withdrawal failed.');
      }
    }
  };

  const getStatusBadge = (status: JobApplication['status']) => {
    switch (status) {
      case 'Applied':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">আবেদন জমা (Applied)</span>;
      case 'Under Review':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">পর্যালোচনায় (Reviewing)</span>;
      case 'Shortlisted':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">শর্টলিস্টেড (Shortlisted)</span>;
      case 'Interview':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-100 text-purple-800">সাক্ষাৎকার (Interview)</span>;
      case 'Selected':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-teal-100 text-teal-800">নির্বাচিত (Selected)</span>;
      case 'Rejected':
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">অননুমোদিত (Rejected)</span>;
      default:
        return <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">{status}</span>;
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto" id="jobseeker-hub-dashboard">
      
      {/* Top Banner & Quick Metrics */}
      <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-3xl text-white p-5 sm:p-7 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          
          <div className="flex items-center gap-3.5">
            {profile.photoUrl ? (
              <img 
                src={profile.photoUrl} 
                alt={profile.fullName} 
                className="w-16 h-16 rounded-2xl object-cover border-2 border-emerald-400 shadow-sm"
              />
            ) : (
              <div className="w-16 h-16 rounded-2xl bg-emerald-800 text-white font-black text-2xl flex items-center justify-center border-2 border-emerald-500/50 shadow-sm">
                {profile.fullName ? profile.fullName.charAt(0).toUpperCase() : <User className="w-8 h-8 text-emerald-200" />}
              </div>
            )}

            <div className="space-y-0.5">
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-2xl font-black tracking-tight">
                  {profile.fullName || (lang === 'bn' ? 'প্রার্থী প্রফেশনাল ড্যাশবোর্ড' : 'Candidate Dashboard')}
                </h1>
                <span className="text-[11px] font-bold bg-emerald-500/30 text-emerald-300 px-2.5 py-0.5 rounded-full border border-emerald-400/30">
                  {profile.candidateCode || 'JM-MEMBER'}
                </span>
              </div>
              <p className="text-xs text-emerald-200 font-medium">
                {profile.desiredJobTitle || (lang === 'bn' ? 'চাকরি প্রত্যাশী' : 'Job Seeker')} • {profile.district}
              </p>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setShowCvUploadModal(true)}
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 active:scale-95 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 backdrop-blur-xs cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>{lang === 'bn' ? 'সিভি আপলোড ও এআই' : 'AI CV Import'}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowCvBuilder(true)}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'সিভি প্রিন্ট / রপ্তানি' : 'Export CV'}</span>
            </button>

            <button
              type="button"
              onClick={() => setCurrentView(currentView === 'editor' ? 'overview' : 'editor')}
              className="px-4 py-2 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-xs rounded-xl transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <User className="w-3.5 h-3.5" />
              <span>{currentView === 'editor' ? (lang === 'bn' ? 'ড্যাশবোর্ডে ফিরুন' : 'Back to Dashboard') : (lang === 'bn' ? 'প্রোফাইল সম্পাদন' : 'Edit Profile')}</span>
            </button>
          </div>
        </div>

        {/* Completeness Bar */}
        <div className="mt-5 pt-4 border-t border-white/15 grid grid-cols-1 sm:grid-cols-3 gap-4 items-center">
          <div className="space-y-1 sm:col-span-2">
            <div className="flex justify-between text-xs font-bold text-emerald-200">
              <span>{lang === 'bn' ? 'মাস্টার প্রোফাইল সম্পূর্ণতা' : 'Profile Completeness'}</span>
              <span className="text-amber-300">{completeness}%</span>
            </div>
            <div className="w-full h-2 bg-black/40 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 rounded-full transition-all duration-500"
                style={{ width: `${completeness}%` }}
              />
            </div>
          </div>

          <div className="flex justify-end gap-3 text-right">
            <div className="text-xs">
              <span className="text-slate-400 block text-[10px]">{lang === 'bn' ? 'মোট আবেদন' : 'Applications'}</span>
              <span className="font-black text-lg text-white">{applications.length}</span>
            </div>
            <div className="text-xs">
              <span className="text-slate-400 block text-[10px]">{lang === 'bn' ? 'সংরক্ষিত চাকরি' : 'Saved Jobs'}</span>
              <span className="font-black text-lg text-white">{savedJobs.length}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl w-fit overflow-x-auto text-xs font-bold">
        <button
          type="button"
          onClick={() => setCurrentView('overview')}
          className={`px-4 py-2 rounded-xl transition ${
            currentView === 'overview' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {lang === 'bn' ? 'সারসংক্ষেপ ও হাব' : 'Overview & Hub'}
        </button>

        <button
          type="button"
          onClick={() => setCurrentView('applications')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            currentView === 'applications' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>{lang === 'bn' ? 'আবেদনের স্ট্যাটাস' : 'Application Tracker'}</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 text-[10px]">
            {applications.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentView('saved')}
          className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
            currentView === 'saved' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <span>{lang === 'bn' ? 'সংরক্ষিত বিজ্ঞপ্তি' : 'Saved Jobs'}</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 text-[10px]">
            {savedJobs.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => setCurrentView('editor')}
          className={`px-4 py-2 rounded-xl transition ${
            currentView === 'editor' ? 'bg-white text-emerald-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          {lang === 'bn' ? 'মাস্টার প্রোফাইল এডিটর' : 'Profile Editor'}
        </button>
      </div>

      {/* Sub-view: Profile Editor */}
      {currentView === 'editor' && (
        <ProfileEditor
          lang={lang}
          profile={profile}
          onSave={(updated) => {
            setProfile(updated);
            loadApplications(updated);
          }}
          onOpenCvUpload={() => setShowCvUploadModal(true)}
          onOpenCvBuilder={() => setShowCvBuilder(true)}
          onShowToast={onShowToast}
        />
      )}

      {/* Sub-view: Overview */}
      {currentView === 'overview' && (
        <div className="space-y-6">
          
          {/* 4 Quick Action Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            
            {/* Card 1 */}
            <div 
              onClick={() => setCurrentView('editor')}
              className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md cursor-pointer transition space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center group-hover:scale-105 transition">
                <User className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-black text-slate-900">{lang === 'bn' ? 'মাস্টার প্রোফাইল' : 'Master Profile'}</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {lang === 'bn' ? 'শিক্ষা, অভিজ্ঞতা ও দক্ষতা হালনাগাদ রাখুন' : 'Update credentials and skill set'}
              </p>
            </div>

            {/* Card 2 */}
            <div 
              onClick={() => setShowCvBuilder(true)}
              className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md cursor-pointer transition space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center group-hover:scale-105 transition">
                <Printer className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-black text-slate-900">{lang === 'bn' ? 'ইন্সট্যান্ট সিভি বিল্ডার' : 'Instant CV Builder'}</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {lang === 'bn' ? 'প্রফেশনাল লেআউটে প্রিন্ট বা পিডিএফ সেভ করুন' : 'Export standard PDF resume in 1 click'}
              </p>
            </div>

            {/* Card 3 */}
            <div 
              onClick={() => setShowCvUploadModal(true)}
              className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md cursor-pointer transition space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center group-hover:scale-105 transition">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-black text-slate-900">{lang === 'bn' ? 'এআই সিভি আপলোড' : 'AI CV Parser'}</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {lang === 'bn' ? 'পিডিএফ সিভি থেকে স্বয়ংক্রিয় তথ্য সংগ্রহ' : 'Extract info automatically with Gemini AI'}
              </p>
            </div>

            {/* Card 4 */}
            <div 
              onClick={() => {
                if (onNavigateToJobs) onNavigateToJobs();
              }}
              className="bg-white p-4 rounded-2xl border border-slate-200 hover:border-emerald-500 hover:shadow-md cursor-pointer transition space-y-2 group"
            >
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center group-hover:scale-105 transition">
                <Briefcase className="w-5 h-5" />
              </div>
              <h3 className="text-xs font-black text-slate-900">{lang === 'bn' ? 'নতুন চাকরির বিজ্ঞপ্তি' : 'Browse Open Jobs'}</h3>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {lang === 'bn' ? 'সকল সক্রিয় পদে ১-ক্লিকে আবেদন করুন' : 'Explore circulars and apply in 1 click'}
              </p>
            </div>

          </div>

          {/* Master Resume Document Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-700" />
                <span>{lang === 'bn' ? 'সংযুক্ত মাস্টার সিভি ডকুমেন্ট' : 'Attached Master Resume Document'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCvUploadModal(true)}
                className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{lang === 'bn' ? 'নতুন সিভি আপলোড করুন' : 'Upload New'}</span>
              </button>
            </div>

            {profile.resumeUrl ? (
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">{profile.resumeFileName || 'Candidate_Resume.pdf'}</h4>
                    <p className="text-[10px] text-slate-500">
                      {profile.resumeUploadedAt ? `আপলোড: ${new Date(profile.resumeUploadedAt).toLocaleDateString()}` : 'সফলভাবে যুক্ত'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={profile.resumeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 bg-white border border-slate-300 hover:border-emerald-600 text-slate-700 font-bold text-xs rounded-lg transition flex items-center gap-1 shadow-2xs"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-700" />
                    <span>{lang === 'bn' ? 'প্রিভিউ দেখুন' : 'View File'}</span>
                  </a>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-dashed border-slate-300 text-center space-y-2">
                <p className="text-xs text-slate-600">
                  {lang === 'bn' ? 'কোনো বাহ্যিক সিভি ফাইল আপলোড করা হয়নি।' : 'No external resume file uploaded yet.'}
                </p>
                <button
                  type="button"
                  onClick={() => setShowCvUploadModal(true)}
                  className="px-4 py-1.5 bg-emerald-700 text-white font-bold text-xs rounded-xl hover:bg-emerald-800 transition"
                >
                  {lang === 'bn' ? 'সিভি ফাইল আপলোড করুন' : 'Upload Resume File'}
                </button>
              </div>
            )}
          </div>

          {/* Recent Applications Preview */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700" />
                <span>{lang === 'bn' ? 'সাম্প্রতিক আবেদনসমূহ' : 'Recent Applications'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setCurrentView('applications')}
                className="text-[11px] font-bold text-emerald-700 hover:underline flex items-center gap-1"
              >
                <span>{lang === 'bn' ? 'সবগুলো দেখুন' : 'View All'}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {applications.length === 0 ? (
              <div className="p-5 text-center text-xs text-slate-500 bg-slate-50 rounded-xl">
                {lang === 'bn' ? 'আপনি এখনও কোনো পদে আবেদন করেননি।' : 'You have not submitted any applications yet.'}
              </div>
            ) : (
              <div className="space-y-2.5">
                {applications.slice(0, 3).map(app => (
                  <div key={app.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-wrap items-center justify-between gap-2">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900">{app.jobTitle}</span>
                        {getStatusBadge(app.status)}
                      </div>
                      <p className="text-[11px] text-slate-600">
                        {app.companyName} • {new Date(app.appliedAt).toLocaleDateString()}
                      </p>
                    </div>

                    <span className="text-[10px] font-mono text-slate-400">
                      ID: {app.id.substring(0, 8)}...
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      )}

      {/* Sub-view: Applications Tracker */}
      {currentView === 'applications' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-200">
            <div>
              <h2 className="text-base font-black text-slate-900">
                {lang === 'bn' ? 'আবেদনের বর্তমান অবস্থা ও ট্র্যাকিং' : 'Application Status & History'}
              </h2>
              <p className="text-xs text-slate-500">
                {lang === 'bn' ? 'আপনার জমা দেওয়া সকল আবেদনের রিয়েল-টাইম অগ্রগতি' : 'Track your applied job circulars'}
              </p>
            </div>

            {/* Filter tags */}
            <div className="flex flex-wrap gap-1 text-xs">
              {(['All', 'Applied', 'Under Review', 'Shortlisted', 'Interview', 'Selected', 'Rejected'] as const).map(status => (
                <button
                  key={status}
                  type="button"
                  onClick={() => setAppFilter(status)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                    appFilter === status 
                      ? 'bg-emerald-700 text-white shadow-2xs' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {filteredApplications.length === 0 ? (
            <div className="p-8 text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <Clock className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-600 font-bold">
                {lang === 'bn' ? 'এই ফিল্টারে কোনো আবেদন নেই।' : 'No applications in this category.'}
              </p>
              {onNavigateToJobs && (
                <button
                  type="button"
                  onClick={onNavigateToJobs}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  {lang === 'bn' ? 'চাকরির বিজ্ঞপ্তি দেখুন' : 'Explore Job Listings'}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredApplications.map(app => (
                <div key={app.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="text-xs sm:text-sm font-bold text-slate-900">{app.jobTitle}</h3>
                      <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-0.5">
                        <Building2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>{app.companyName}</span>
                        <span>•</span>
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        <span>{app.jobDistrict}</span>
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {getStatusBadge(app.status)}
                      {app.status === 'Applied' && (
                        <button
                          type="button"
                          onClick={() => handleWithdraw(app.id)}
                          className="text-[11px] text-rose-600 hover:underline font-bold"
                        >
                          {lang === 'bn' ? 'প্রত্যাহার' : 'Withdraw'}
                        </button>
                      )}
                    </div>
                  </div>

                  {app.employerNotes && (
                    <div className="p-2.5 bg-purple-50 border border-purple-200 rounded-xl text-xs text-purple-900">
                      <span className="font-bold block text-[10px] text-purple-700">নিয়োগকারীর বার্তা:</span>
                      {app.employerNotes}
                    </div>
                  )}

                  <div className="flex justify-between items-center text-[10px] text-slate-400 pt-1 border-t border-slate-200">
                    <span>তারিখ: {new Date(app.appliedAt).toLocaleDateString()}</span>
                    <span>ট্র্যাকিং আইডি: {app.id}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Sub-view: Saved Jobs */}
      {currentView === 'saved' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 space-y-4">
          <div className="pb-3 border-b border-slate-200">
            <h2 className="text-base font-black text-slate-900">
              {lang === 'bn' ? 'সংরক্ষিত চাকরির বিজ্ঞপ্তি' : 'Saved Job Listings'}
            </h2>
            <p className="text-xs text-slate-500">
              {lang === 'bn' ? 'পরে দেখার জন্য বুকমার্ক করা পদসমূহ' : 'Jobs you bookmarked for later'}
            </p>
          </div>

          {savedJobs.length === 0 ? (
            <div className="p-8 text-center space-y-3 bg-slate-50 rounded-2xl border border-dashed border-slate-300">
              <Bookmark className="w-10 h-10 text-slate-400 mx-auto" />
              <p className="text-xs text-slate-600 font-bold">
                {lang === 'bn' ? 'কোনো সংরক্ষিত বিজ্ঞপ্তি নেই।' : 'No saved job postings yet.'}
              </p>
              {onNavigateToJobs && (
                <button
                  type="button"
                  onClick={onNavigateToJobs}
                  className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition"
                >
                  {lang === 'bn' ? 'বিজ্ঞপ্তি ব্রাউজ করুন' : 'Browse Circulars'}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {savedJobs.map(job => (
                <div key={job.id} className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900">{job.title}</h3>
                    <p className="text-xs text-slate-600 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{job.companyName}</span>
                      <span>•</span>
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      <span>{job.upazila ? `${job.upazila}, ` : ''}{job.district}</span>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSelectedJobForApply(job)}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{lang === 'bn' ? '১-ক্লিকে আবেদন' : '1-Click Apply'}</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* CV Upload Parser Modal */}
      {showCvUploadModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
          <div className="w-full max-w-3xl">
            <CvUploadParser
              lang={lang}
              currentProfile={profile}
              onImportComplete={(updated) => {
                setProfile(updated);
                setShowCvUploadModal(false);
                loadApplications(updated);
              }}
              onClose={() => setShowCvUploadModal(false)}
              onShowToast={onShowToast}
            />
          </div>
        </div>
      )}

      {/* CV Builder & Print Modal */}
      {showCvBuilder && (
        <CvBuilderModal
          lang={lang}
          profile={profile}
          onClose={() => setShowCvBuilder(false)}
          onShowToast={onShowToast}
        />
      )}

      {/* 1-Click Application Modal */}
      {selectedJobForApply && (
        <ApplicationModal
          lang={lang}
          job={selectedJobForApply}
          profile={profile}
          onClose={() => setSelectedJobForApply(null)}
          onSuccess={(newApp) => {
            setApplications(prev => [newApp, ...prev]);
            setSelectedJobForApply(null);
          }}
          onOpenProfileEditor={() => {
            setSelectedJobForApply(null);
            setCurrentView('editor');
          }}
          onShowToast={onShowToast}
        />
      )}

    </div>
  );
};
