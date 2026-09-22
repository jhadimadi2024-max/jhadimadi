import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  Star, 
  Calendar, 
  FileText, 
  Download, 
  Eye, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Phone, 
  Mail, 
  ShieldCheck, 
  ShieldAlert, 
  Building2, 
  Briefcase, 
  GraduationCap, 
  MapPin, 
  ChevronRight, 
  ArrowRight, 
  MoreVertical,
  Edit3,
  MessageSquare,
  AlertCircle,
  X,
  Loader2,
  Check,
  UserCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  EmployerApplicant, 
  ApplicantStage, 
  EmployerJobVacancy 
} from '../../types/employer';
import { EmployerService } from '../../services/employerService';

interface ApplicantTrackerProps {
  initialJobId?: string;
  onShowToast: (msg: string) => void;
}

const STAGES: { id: ApplicantStage; labelBn: string; color: string; bg: string; border: string }[] = [
  { id: 'New', labelBn: 'নতুন আবেদন (New)', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  { id: 'Reviewed', labelBn: 'পর্যালোচিত (Reviewed)', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
  { id: 'Shortlisted', labelBn: 'শর্টলিস্টেড (Shortlisted)', color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200' },
  { id: 'Interview', labelBn: 'সাক্ষাৎকার (Interview)', color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200' },
  { id: 'Selected', labelBn: 'নির্বাচিত (Selected)', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  { id: 'Rejected', labelBn: 'বাতিল (Rejected)', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
];

export const ApplicantTracker: React.FC<ApplicantTrackerProps> = ({ initialJobId, onShowToast }) => {
  const [jobs, setJobs] = useState<EmployerJobVacancy[]>([]);
  const [selectedJobId, setSelectedJobId] = useState<string>(initialJobId || 'all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [applicants, setApplicants] = useState<EmployerApplicant[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Selected Applicant Detail Modal
  const [activeApplicant, setActiveApplicant] = useState<EmployerApplicant | null>(null);
  const [isUpdatingStage, setIsUpdatingStage] = useState<boolean>(false);

  // Form states in detail modal
  const [modalStage, setModalStage] = useState<ApplicantStage>('New');
  const [modalRating, setModalRating] = useState<number>(3);
  const [modalInternalNotes, setModalInternalNotes] = useState<string>('');
  const [modalInterviewDate, setModalInterviewDate] = useState<string>('');
  const [modalInterviewNotes, setModalInterviewNotes] = useState<string>('');
  const [showUnmaskWarning, setShowUnmaskWarning] = useState<boolean>(false);

  // Load jobs & applicants
  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedJobs, fetchedApplicants] = await Promise.all([
        EmployerService.getEmployerJobs(),
        EmployerService.getApplicants(selectedJobId !== 'all' ? selectedJobId : undefined, undefined, searchQuery)
      ]);
      setJobs(fetchedJobs);
      setApplicants(fetchedApplicants);
    } catch (e) {
      onShowToast('আবেদনকারীদের তথ্য লোড করতে ত্রুটি হয়েছে।');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedJobId, searchQuery]);

  // Sync modal state when opening an applicant
  const handleOpenApplicant = (applicant: EmployerApplicant) => {
    setActiveApplicant(applicant);
    setModalStage(applicant.stage);
    setModalRating(applicant.rating || 3);
    setModalInternalNotes(applicant.internalNotes || '');
    setModalInterviewDate(applicant.interviewScheduledDate || '');
    setModalInterviewNotes(applicant.interviewNotes || '');
    setShowUnmaskWarning(false);
  };

  // Mutate stage directly from Kanban
  const handleMoveStage = async (applicantId: string, targetStage: ApplicantStage) => {
    try {
      const res = await EmployerService.updateApplicantStage(applicantId, targetStage);
      if (res.success) {
        setApplicants(prev => prev.map(a => a.id === applicantId ? { ...a, stage: targetStage } : a));
        onShowToast(`প্রার্থীর স্ট্যাটাস '${targetStage}' এ পরিবর্তন করা হয়েছে।`);
      }
    } catch (e) {
      onShowToast('স্ট্যাটাস আপডেট ব্যর্থ হয়েছে।');
    }
  };

  // Save detailed feedback & schedule interview from Modal
  const handleSaveApplicantDetails = async () => {
    if (!activeApplicant) return;
    setIsUpdatingStage(true);

    try {
      const res = await EmployerService.updateApplicantStage(activeApplicant.id, modalStage, {
        rating: modalRating,
        internalNotes: modalInternalNotes,
        interviewDate: modalInterviewDate,
        interviewNotes: modalInterviewNotes
      });

      if (res.success && res.applicant) {
        setApplicants(prev => prev.map(a => a.id === activeApplicant.id ? res.applicant! : a));
        setActiveApplicant(res.applicant);
        onShowToast('প্রার্থীর তথ্য ও ইন্টারভিউ আপডেট সংরক্ষিত হয়েছে!');
      }
    } catch (e) {
      onShowToast('সংরক্ষণে সমস্যা হয়েছে।');
    } finally {
      setIsUpdatingStage(false);
    }
  };

  return (
    <div className="space-y-6" id="applicant-tracker-section">
      {/* Top Filter and Search Bar */}
      <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
          {/* Job Vacancy Selector */}
          <div className="sm:w-72">
            <label className="text-[11px] font-black text-slate-500 block mb-1">চাকরির সার্কুলার ফিল্টার</label>
            <select
              value={selectedJobId}
              onChange={e => setSelectedJobId(e.target.value)}
              className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-slate-50"
            >
              <option value="all">সব সার্কুলার ({jobs.length}টি পদ)</option>
              {jobs.map(j => (
                <option key={j.id} value={j.id}>
                  {j.title} ({j.applicantCount} আবেদন)
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="flex-1">
            <label className="text-[11px] font-black text-slate-500 block mb-1">প্রার্থী খুঁজুন (নাম, দক্ষতা, ডিগ্রি)</label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="প্রার্থীর নাম বা স্কিল লিখে খুঁজুন (যেমন: React, তঞ্চঙ্গ্যা, অনার্স)..."
                className="w-full pl-9 pr-4 py-2 text-xs font-medium border border-slate-300 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-slate-50"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Total count badge */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          <span className="text-xs font-bold text-slate-600">মোট আবেদনকারী:</span>
          <span className="px-3 py-1 rounded-xl bg-emerald-100 text-emerald-900 font-black text-xs">
            {applicants.length} জন
          </span>
        </div>
      </div>

      {/* Kanban Board Container */}
      {isLoading ? (
        <div className="p-12 text-center bg-white rounded-3xl border border-slate-200 shadow-xs">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-600 mx-auto mb-2" />
          <p className="text-xs font-bold text-slate-600">আবেদনকারীদের পাইপলাইন লোড হচ্ছে...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5 overflow-x-auto pb-4">
          {STAGES.map(stage => {
            const stageApplicants = applicants.filter(a => a.stage === stage.id);

            return (
              <div
                key={stage.id}
                className={`rounded-3xl border ${stage.border} ${stage.bg} p-3 flex flex-col min-h-[460px] shadow-2xs`}
              >
                {/* Stage Header */}
                <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-slate-200/60 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-black ${stage.color}`}>{stage.labelBn}</span>
                  </div>
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black bg-white shadow-2xs ${stage.color}`}>
                    {stageApplicants.length}
                  </span>
                </div>

                {/* Candidate Cards List */}
                <div className="space-y-2.5 flex-1 overflow-y-auto max-h-[580px] pr-0.5">
                  {stageApplicants.length === 0 ? (
                    <div className="h-28 flex flex-col items-center justify-center text-center p-2 rounded-2xl border border-dashed border-slate-300/80 bg-white/40">
                      <p className="text-[11px] font-bold text-slate-400">কোনো প্রার্থী নেই</p>
                    </div>
                  ) : (
                    stageApplicants.map(app => (
                      <motion.div
                        key={app.id}
                        layout
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white rounded-2xl p-3 border border-slate-200/90 shadow-xs hover:shadow-md transition-all space-y-2 cursor-pointer relative group"
                        onClick={() => handleOpenApplicant(app)}
                      >
                        {/* Header: Name and Rating */}
                        <div className="flex items-start justify-between gap-1">
                          <div>
                            <h4 className="text-xs font-black text-slate-900 group-hover:text-emerald-700 transition">
                              {app.candidateName}
                            </h4>
                            <p className="text-[10px] text-slate-500 font-bold truncate max-w-[130px]">
                              {app.desiredJobTitle || 'আবেদনকারী'}
                            </p>
                          </div>

                          {/* Star Rating Badge */}
                          <div className="flex items-center text-amber-500 text-[10px] font-black bg-amber-50 px-1.5 py-0.5 rounded-md">
                            <Star className="w-3 h-3 fill-amber-400 text-amber-400 mr-0.5" />
                            <span>{app.rating || 3}</span>
                          </div>
                        </div>

                        {/* Location & Experience */}
                        <div className="text-[10px] text-slate-600 font-medium space-y-0.5">
                          <div className="flex items-center gap-1 truncate">
                            <MapPin className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span className="truncate">{app.candidateLocation}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-2.5 h-2.5 text-slate-400 shrink-0" />
                            <span>অভিজ্ঞতা: {app.experienceYears || 'ফ্রেশার'}</span>
                          </div>
                        </div>

                        {/* Skills preview tags */}
                        {app.skills && app.skills.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-0.5">
                            {app.skills.slice(0, 2).map((s, i) => (
                              <span key={i} className="text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-700">
                                {s}
                              </span>
                            ))}
                            {app.skills.length > 2 && (
                              <span className="text-[9px] font-bold text-slate-400 px-1">
                                +{app.skills.length - 2}
                              </span>
                            )}
                          </div>
                        )}

                        {/* Interview Scheduled Badge */}
                        {app.interviewScheduledDate && (
                          <div className="p-1 rounded-lg bg-amber-50 border border-amber-200 text-[10px] text-amber-800 font-bold flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5 text-amber-600 shrink-0" />
                            <span className="truncate">ইন্টারভিউ নির্ধারিত</span>
                          </div>
                        )}

                        {/* Quick Action Bottom Bar */}
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[10px]" onClick={e => e.stopPropagation()}>
                          <span className="text-slate-400 font-medium">
                            {new Date(app.appliedAt).toLocaleDateString('bn-BD')}
                          </span>

                          <select
                            value={app.stage}
                            onChange={e => handleMoveStage(app.id, e.target.value as ApplicantStage)}
                            className="text-[10px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-0.5 rounded-lg border border-emerald-200 focus:outline-hidden cursor-pointer"
                          >
                            <option value="New">নতুন</option>
                            <option value="Reviewed">পর্যালোচিত</option>
                            <option value="Shortlisted">শর্টলিস্ট</option>
                            <option value="Interview">ইন্টারভিউ</option>
                            <option value="Selected">নির্বাচিত</option>
                            <option value="Rejected">বাতিল</option>
                          </select>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ================= CANDIDATE REVIEW & INTERVIEW MODAL ================= */}
      <AnimatePresence>
        {activeApplicant && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]"
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-slate-900 to-slate-800 px-5 sm:px-6 py-4 text-white flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-600/30 border border-emerald-500/40 flex items-center justify-center text-emerald-300 font-black text-base">
                    {activeApplicant.candidateName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white flex items-center gap-2">
                      <span>{activeApplicant.candidateName}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {activeApplicant.stage}
                      </span>
                    </h3>
                    <p className="text-xs text-slate-300">
                      পদবী: {activeApplicant.jobTitle}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setActiveApplicant(null)}
                  className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Body */}
              <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
                {/* Privacy Safeguards Badge & Contact Card */}
                <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-black text-emerald-900">
                      <ShieldCheck className="w-4 h-4 text-emerald-700" />
                      <span>প্রার্থী তথ্য সুরক্ষা ও গোপনীয়তা এনফোর্সমেন্ট</span>
                    </div>
                    <p className="text-xs text-emerald-800">
                      ঝাদিমাদি সিকিউরিটি পলিসি অনুযায়ী প্রার্থীর ফোন ও ইমেইল সুরক্ষিত রাখা হয়েছে।
                    </p>
                  </div>

                  <div className="flex items-center gap-3 bg-white px-3 py-1.5 rounded-xl border border-emerald-200 shadow-2xs text-xs font-bold text-slate-700">
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{activeApplicant.candidatePhoneMasked}</span>
                    </span>
                    <span className="text-slate-300">|</span>
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5 text-emerald-600" />
                      <span>{activeApplicant.candidateEmailMasked}</span>
                    </span>
                  </div>
                </div>

                {/* Candidate Qualifications Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block">কাজের অভিজ্ঞতা</span>
                    <span className="text-xs font-black text-slate-800 mt-0.5 block">{activeApplicant.experienceYears || 'উল্লেখ নেই'}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block">সর্বোচ্চ শিক্ষাগত যোগ্যতা</span>
                    <span className="text-xs font-black text-slate-800 mt-0.5 block truncate">{activeApplicant.highestEducation || 'স্নাতক'}</span>
                  </div>
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] font-bold text-slate-500 block">বর্তমান অবস্থান</span>
                    <span className="text-xs font-black text-slate-800 mt-0.5 block truncate">{activeApplicant.candidateLocation}</span>
                  </div>
                </div>

                {/* Skills */}
                <div>
                  <h4 className="text-xs font-black text-slate-700 mb-1.5">প্রার্থীর দক্ষতাসমূহ (Skills)</h4>
                  <div className="flex flex-wrap gap-1.5">
                    {activeApplicant.skills.map((s, idx) => (
                      <span key={idx} className="px-3 py-1 rounded-xl bg-slate-100 border border-slate-300 text-slate-800 text-xs font-bold">
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Cover Letter */}
                {activeApplicant.coverLetter && (
                  <div>
                    <h4 className="text-xs font-black text-slate-700 mb-1">কভার লেটার / আবেদন বার্তা</h4>
                    <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-700 leading-relaxed">
                      {activeApplicant.coverLetter}
                    </div>
                  </div>
                )}

                {/* Resume Download / View */}
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="text-xs font-black text-slate-800">
                        {activeApplicant.resumeFileName || `${activeApplicant.candidateName}_Resume.pdf`}
                      </h5>
                      <span className="text-[10px] text-slate-500 font-bold">সংযুক্ত সারসংক্ষেপ ও পোর্টফোলিও</span>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onShowToast('সিভি নিরাপদে ডাউনলোড হচ্ছে...')}
                    className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>সিভি ডাউনলোড</span>
                  </button>
                </div>

                {/* ================= RECRUITER ACTIONS: Rating, Notes, Interview Scheduler ================= */}
                <div className="bg-amber-50/50 border border-amber-200 rounded-2xl p-4 sm:p-5 space-y-4">
                  <h4 className="text-xs font-black text-amber-950 flex items-center gap-2">
                    <Edit3 className="w-4 h-4 text-amber-700" />
                    <span>রিক্রুটার মূল্যায়ন ও ইন্টারভিউ শিডিউলার</span>
                  </h4>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Stage Select */}
                    <div>
                      <label className="text-[11px] font-black text-slate-700 block mb-1">পাইপলাইন স্টেজ পরিবর্তন</label>
                      <select
                        value={modalStage}
                        onChange={e => setModalStage(e.target.value as ApplicantStage)}
                        className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      >
                        <option value="New">নতুন আবেদন (New)</option>
                        <option value="Reviewed">পর্যালোচিত (Reviewed)</option>
                        <option value="Shortlisted">শর্টলিস্টেড (Shortlisted)</option>
                        <option value="Interview">সাক্ষাৎকার (Interview)</option>
                        <option value="Selected">নির্বাচিত (Selected)</option>
                        <option value="Rejected">বাতিল (Rejected)</option>
                      </select>
                    </div>

                    {/* Rating Stars */}
                    <div>
                      <label className="text-[11px] font-black text-slate-700 block mb-1">প্রার্থীর রেটিং (১-৫ স্টার)</label>
                      <div className="flex items-center gap-1.5 pt-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setModalRating(star)}
                            className="p-1 hover:scale-110 transition cursor-pointer"
                          >
                            <Star
                              className={`w-6 h-6 ${
                                star <= modalRating
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-slate-300'
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Interview Date Scheduler */}
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-black text-slate-700 block mb-1">সাক্ষাৎকারের সময়সূচী (Interview Date & Time)</label>
                      <input
                        type="text"
                        value={modalInterviewDate}
                        onChange={e => setModalInterviewDate(e.target.value)}
                        placeholder="যেমন: ১৫ সেপ্টেম্বর সকাল ১১:০০টা (অনলাইন জুম / বনরুপা অফিস)"
                        className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>

                    {/* Internal Notes */}
                    <div className="sm:col-span-2">
                      <label className="text-[11px] font-black text-slate-700 block mb-1">অভ্যন্তরীণ মূল্যায়ন নোট (Internal Recruiter Notes)</label>
                      <textarea
                        rows={2}
                        value={modalInternalNotes}
                        onChange={e => setModalInternalNotes(e.target.value)}
                        placeholder="টেকনিক্যাল ফিডব্যাক, ইন্টারভিউয়ার মন্তব্য..."
                        className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-amber-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-slate-100 border-t border-slate-200 px-5 sm:px-6 py-3.5 flex items-center justify-between shrink-0">
                <button
                  type="button"
                  onClick={() => setActiveApplicant(null)}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition cursor-pointer"
                >
                  বন্ধ করুন
                </button>

                <button
                  type="button"
                  onClick={handleSaveApplicantDetails}
                  disabled={isUpdatingStage}
                  className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
                >
                  {isUpdatingStage ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                  <span>আপডেট সংরক্ষণ করুন</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
