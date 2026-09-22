import React, { useState, useRef, useEffect } from 'react';
import { 
  X, 
  Upload, 
  Sparkles, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  FileText, 
  Building2, 
  Briefcase, 
  DollarSign, 
  Calendar, 
  MapPin, 
  GraduationCap, 
  Clock, 
  Award, 
  Tag, 
  Link as LinkIcon, 
  Mail, 
  AlertCircle, 
  Loader2, 
  Check, 
  Layers, 
  FileCheck, 
  HelpCircle,
  Eye,
  Plus,
  Trash2,
  Bold,
  Italic,
  List,
  ListOrdered,
  Heading,
  Globe,
  Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  EmployerJobVacancy, 
  JobRequirements, 
  JobDescriptionSection, 
  JobApplicationMethod,
  WorkplaceType,
  JobLifecycleStatus 
} from '../../types/employer';
import { JobType } from '../../types';
import { JOB_CATEGORIES, JOB_TYPES, uploadJobDocument } from '../../services/jobService';
import { LOCATION_MASTER, DistrictItem, UpazilaItem } from '../../data/locationMaster';
import { EmployerService } from '../../services/employerService';

interface JobPostingWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onJobPublished: (job: EmployerJobVacancy) => void;
  initialJobToEdit?: EmployerJobVacancy | null;
  onShowToast: (msg: string) => void;
}

export const JobPostingWizard: React.FC<JobPostingWizardProps> = ({
  isOpen,
  onClose,
  onJobPublished,
  initialJobToEdit,
  onShowToast
}) => {
  // Mode selection: 'quick_upload' vs 'builder'
  const [activePathway, setActivePathway] = useState<'quick_upload' | 'builder'>(
    initialJobToEdit ? 'builder' : 'builder'
  );

  // Builder step tracking (1 to 4)
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showLivePreview, setShowLivePreview] = useState<boolean>(false);

  // ================= Step 01: Core Job Info =================
  const [title, setTitle] = useState(initialJobToEdit?.title || '');
  const [designation, setDesignation] = useState(initialJobToEdit?.designation || '');
  const [category, setCategory] = useState(initialJobToEdit?.category || JOB_CATEGORIES[0].nameBn);
  const [vacanciesCount, setVacanciesCount] = useState<number>(initialJobToEdit?.vacanciesCount || 1);
  const [jobType, setJobType] = useState<JobType>(initialJobToEdit?.jobType || 'Full-time');
  const [workplaceType, setWorkplaceType] = useState<WorkplaceType>(initialJobToEdit?.workplaceType || 'On-site');
  const [division, setDivision] = useState(initialJobToEdit?.division || 'Chittagong Division (চট্টগ্রাম)');
  const [district, setDistrict] = useState(initialJobToEdit?.district || 'রাঙ্গামাটি');
  const [upazila, setUpazila] = useState(initialJobToEdit?.upazila || 'রাঙ্গামাটি সদর');
  const [address, setAddress] = useState(initialJobToEdit?.address || '');
  const [salaryNegotiable, setSalaryNegotiable] = useState<boolean>(initialJobToEdit?.salaryNegotiable ?? false);
  const [salaryMin, setSalaryMin] = useState<string>(initialJobToEdit?.salaryMin ? String(initialJobToEdit.salaryMin) : '20000');
  const [salaryMax, setSalaryMax] = useState<string>(initialJobToEdit?.salaryMax ? String(initialJobToEdit.salaryMax) : '35000');
  const [salaryDisplay, setSalaryDisplay] = useState(initialJobToEdit?.salaryDisplay || '৳ ২০,০০০ - ৳ ৩৫,০০০');
  const [deadline, setDeadline] = useState(
    initialJobToEdit?.deadline || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0]
  );

  // ================= Step 02: Requirements =================
  const [minEducation, setMinEducation] = useState(initialJobToEdit?.requirements.minEducation || 'স্নাতক / এইচএসসি');
  const [minExperienceYears, setMinExperienceYears] = useState(initialJobToEdit?.requirements.minExperienceYears || '১-২ বছর');
  const [ageRange, setAgeRange] = useState(initialJobToEdit?.requirements.ageRange || '১৮ - ৩৫ বছর');
  const [genderPreference, setGenderPreference] = useState<'Any' | 'Male' | 'Female'>(
    initialJobToEdit?.requirements.genderPreference || 'Any'
  );
  const [requiredSkills, setRequiredSkills] = useState<string[]>(
    initialJobToEdit?.requirements.requiredSkills || ['যোগাযোগ দক্ষতা', 'কম্পিউটার টাইপিং', 'টিমওয়ার্ক']
  );
  const [skillInput, setSkillInput] = useState('');

  // ================= Step 03: Rich Description =================
  const [summary, setSummary] = useState(initialJobToEdit?.description.summary || '');
  const [rolesResponsibilities, setRolesResponsibilities] = useState<string[]>(
    initialJobToEdit?.description.rolesResponsibilities || [
      'কোম্পানির নির্ধারিত প্রজেক্ট ও দৈনন্দিন দায়িত্ব নিষ্ঠার সাথে সম্পন্ন করা।',
      'গ্রাহক ও সহকর্মীদের সাথে সুসম্পর্ক রক্ষা করা।'
    ]
  );
  const [roleInput, setRoleInput] = useState('');
  const [benefits, setBenefits] = useState<string[]>(
    initialJobToEdit?.description.benefits || ['বছরে ২টি উৎসব বোনাস', 'মোবাইল বিল ও ইন্টারনেট ভাতা', 'সুবিধাজনক কাজের পরিবেশ']
  );
  const [benefitInput, setBenefitInput] = useState('');
  const [workingHours, setWorkingHours] = useState(initialJobToEdit?.description.workingHours || 'সকাল ৯:০০ - বিকাল ৫:০০ (রবি থেকে বৃহস্পতি)');

  // ================= Step 04: Application Method =================
  const [applicationType, setApplicationType] = useState<'Native_Jhadimadi' | 'External_URL' | 'Direct_Email' | 'Walk_In'>(
    initialJobToEdit?.applicationMethod.type || 'Native_Jhadimadi'
  );
  const [externalUrl, setExternalUrl] = useState(initialJobToEdit?.applicationMethod.externalUrl || '');
  const [applicationEmail, setApplicationEmail] = useState(initialJobToEdit?.applicationMethod.applicationEmail || '');
  const [walkInAddress, setWalkInAddress] = useState(initialJobToEdit?.applicationMethod.walkInAddress || '');
  const [specialInstructions, setSpecialInstructions] = useState(initialJobToEdit?.applicationMethod.specialInstructions || '');

  // ================= Quick Upload Pathway States =================
  const [uploadedCircularFile, setUploadedCircularFile] = useState<File | null>(null);
  const [isParsingCircular, setIsParsingCircular] = useState(false);
  const [circularReviewReady, setCircularReviewReady] = useState(false);
  const [circularDataUrl, setCircularDataUrl] = useState<string>('');
  const [circularFileName, setCircularFileName] = useState<string>('');
  const circularInputRef = useRef<HTMLInputElement>(null);

  // Upazila cascading lookup
  const currentDistrictObj = LOCATION_MASTER.flatMap(d => d.districts).find(d => d.nameBn === district);
  const upazilaList = currentDistrictObj ? currentDistrictObj.upazilas : [];

  // Reset or initialize on open
  useEffect(() => {
    if (initialJobToEdit) {
      setTitle(initialJobToEdit.title);
      setDesignation(initialJobToEdit.designation || initialJobToEdit.title);
      setCategory(initialJobToEdit.category);
      setVacanciesCount(initialJobToEdit.vacanciesCount);
      setJobType(initialJobToEdit.jobType);
      setWorkplaceType(initialJobToEdit.workplaceType);
      setDistrict(initialJobToEdit.district);
      setUpazila(initialJobToEdit.upazila);
      setAddress(initialJobToEdit.address || '');
      setSalaryNegotiable(initialJobToEdit.salaryNegotiable);
      setSalaryMin(initialJobToEdit.salaryMin ? String(initialJobToEdit.salaryMin) : '20000');
      setSalaryMax(initialJobToEdit.salaryMax ? String(initialJobToEdit.salaryMax) : '35000');
      setSalaryDisplay(initialJobToEdit.salaryDisplay);
      setDeadline(initialJobToEdit.deadline);
      setMinEducation(initialJobToEdit.requirements.minEducation);
      setMinExperienceYears(initialJobToEdit.requirements.minExperienceYears);
      setAgeRange(initialJobToEdit.requirements.ageRange || '১৮ - ৩৫ বছর');
      setGenderPreference(initialJobToEdit.requirements.genderPreference || 'Any');
      setRequiredSkills(initialJobToEdit.requirements.requiredSkills || []);
      setSummary(initialJobToEdit.description.summary);
      setRolesResponsibilities(initialJobToEdit.description.rolesResponsibilities || []);
      setBenefits(initialJobToEdit.description.benefits || []);
      setWorkingHours(initialJobToEdit.description.workingHours || '');
      setApplicationType(initialJobToEdit.applicationMethod.type);
      setExternalUrl(initialJobToEdit.applicationMethod.externalUrl || '');
      setApplicationEmail(initialJobToEdit.applicationMethod.applicationEmail || '');
      setSpecialInstructions(initialJobToEdit.applicationMethod.specialInstructions || '');
    }
  }, [initialJobToEdit]);

  // Handle Quick File Select & AI Circular Parsing
  const handleSelectCircularFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedCircularFile(file);
    setCircularFileName(file.name);
    setIsParsingCircular(true);

    try {
      // 1. Upload to storage service
      const uploadRes = await uploadJobDocument(file, 'circular');
      const fileUrl = uploadRes.url || '';
      setCircularDataUrl(fileUrl);

      // 2. AI Parsing of Circular
      const parsed = await EmployerService.parseCircularDocument({
        rawText: `${file.name} - চাকরির নিয়োগ বিজ্ঞপ্তি`,
        fileUrl: fileUrl,
        fileName: file.name
      });

      if (parsed) {
        setTitle(parsed.title || file.name.replace(/\.[^/.]+$/, ''));
        if (parsed.category) setCategory(parsed.category);
        if (parsed.vacanciesCount) setVacanciesCount(parsed.vacanciesCount);
        if (parsed.salaryDisplay) setSalaryDisplay(parsed.salaryDisplay);
        if (parsed.deadline) setDeadline(parsed.deadline);
        if (parsed.requirements?.minEducation) setMinEducation(parsed.requirements.minEducation);
        if (parsed.requirements?.minExperienceYears) setMinExperienceYears(parsed.requirements.minExperienceYears);
        if (parsed.requirements?.requiredSkills) setRequiredSkills(parsed.requirements.requiredSkills);
        if (parsed.description?.summary) setSummary(parsed.description.summary);
        if (parsed.description?.rolesResponsibilities) setRolesResponsibilities(parsed.description.rolesResponsibilities);
        if (parsed.description?.benefits) setBenefits(parsed.description.benefits);

        setCircularReviewReady(true);
        onShowToast('AI সার্কুলার সফলভাবে বিশ্লেষণ করেছে! এবার তথ্য পর্যালোচনা করুন।');
      }
    } catch (err) {
      onShowToast('সার্কুলার ফাইল প্রসেস করা হয়েছে। তথ্য পর্যালোচনা করে পোস্ট করুন।');
      setCircularReviewReady(true);
    } finally {
      setIsParsingCircular(false);
    }
  };

  // Add Skill Tag
  const handleAddSkill = () => {
    if (!skillInput.trim()) return;
    if (!requiredSkills.includes(skillInput.trim())) {
      setRequiredSkills([...requiredSkills, skillInput.trim()]);
    }
    setSkillInput('');
  };

  // Add Role
  const handleAddRole = () => {
    if (!roleInput.trim()) return;
    setRolesResponsibilities([...rolesResponsibilities, roleInput.trim()]);
    setRoleInput('');
  };

  // Add Benefit
  const handleAddBenefit = () => {
    if (!benefitInput.trim()) return;
    setBenefits([...benefits, benefitInput.trim()]);
    setBenefitInput('');
  };

  // Quick salary updater
  useEffect(() => {
    if (salaryNegotiable) {
      setSalaryDisplay('আলোচনা সাপেক্ষে (Negotiable)');
    } else if (salaryMin && salaryMax) {
      setSalaryDisplay(`৳ ${Number(salaryMin).toLocaleString('bn-BD')} - ৳ ${Number(salaryMax).toLocaleString('bn-BD')}`);
    }
  }, [salaryNegotiable, salaryMin, salaryMax]);

  // Validation
  const validateStep = (step: number): boolean => {
    if (step === 1) {
      if (!title.trim()) {
        onShowToast('অনুগ্রহ করে চাকরির পদবী বা শিরোনাম লিখুন।');
        return false;
      }
      if (vacanciesCount < 1) {
        onShowToast('কমপক্ষে ১টি পদ সংখ্যা উল্লেখ করুন।');
        return false;
      }
      if (!deadline) {
        onShowToast('আবেদনের শেষ তারিখ নির্ধারণ করুন।');
        return false;
      }
      return true;
    }
    if (step === 2) {
      if (!minEducation.trim()) {
        onShowToast('ন্যূনতম শিক্ষাগত যোগ্যতা লিখুন।');
        return false;
      }
      if (requiredSkills.length === 0) {
        onShowToast('কমপক্ষে ১টি প্রয়োজনীয় দক্ষতা যোগ করুন।');
        return false;
      }
      return true;
    }
    if (step === 3) {
      if (!summary.trim() && rolesResponsibilities.length === 0) {
        onShowToast('চাকরির সংক্ষিপ্ত বিবরণ বা দায়িত্বসমূহ যোগ করুন।');
        return false;
      }
      return true;
    }
    if (step === 4) {
      if (applicationType === 'External_URL') {
        if (!externalUrl.trim() || (!externalUrl.startsWith('http://') && !externalUrl.startsWith('https://'))) {
          onShowToast('সঠিক লিঙ্ক লিখুন (যেমন: https://yourcompany.com/apply)');
          return false;
        }
      }
      if (applicationType === 'Direct_Email') {
        if (!applicationEmail.trim() || !applicationEmail.includes('@')) {
          onShowToast('সঠিক ইমেইল ঠিকানা লিখুন।');
          return false;
        }
      }
      return true;
    }
    return true;
  };

  // Submit Handler
  const handleSubmitJob = async (status: JobLifecycleStatus = 'Active') => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3) || !validateStep(4)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<EmployerJobVacancy> = {
        id: initialJobToEdit?.id,
        title: title.trim(),
        designation: designation.trim() || title.trim(),
        category,
        vacanciesCount: Number(vacanciesCount),
        jobType,
        workplaceType,
        division,
        district,
        upazila,
        address: address.trim(),
        salaryNegotiable,
        salaryMin: salaryMin ? Number(salaryMin) : undefined,
        salaryMax: salaryMax ? Number(salaryMax) : undefined,
        salaryDisplay,
        deadline,
        requirements: {
          minEducation,
          minExperienceYears,
          ageRange,
          genderPreference,
          requiredSkills
        },
        description: {
          summary: summary.trim(),
          rolesResponsibilities,
          benefits,
          workingHours
        },
        applicationMethod: {
          type: applicationType,
          externalUrl: applicationType === 'External_URL' ? externalUrl.trim() : undefined,
          applicationEmail: applicationType === 'Direct_Email' ? applicationEmail.trim() : undefined,
          walkInAddress: applicationType === 'Walk_In' ? walkInAddress.trim() : undefined,
          specialInstructions: specialInstructions.trim()
        },
        circularFileUrl: circularDataUrl,
        circularFileName: circularFileName,
        status
      };

      const saved = await EmployerService.saveJobVacancy(payload);
      onShowToast(status === 'Draft' ? 'চাকরি ড্রাফট হিসেবে সংরক্ষিত হয়েছে!' : 'চাকরি সফলভাবে পাবলিশ করা হয়েছে!');
      onJobPublished(saved);
      onClose();
    } catch (err: any) {
      onShowToast('সংরক্ষণে সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <motion.div 
        initial={{ opacity: 0, scale: 0.96, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: 15 }}
        transition={{ duration: 0.2 }}
        className="bg-white rounded-3xl w-full max-w-3xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[92vh]"
        id="job-posting-wizard-modal"
      >
        {/* Header Bar */}
        <div className="bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-800 px-4 sm:px-6 py-4 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-white/15 backdrop-blur-md flex items-center justify-center border border-white/20 shadow-xs">
              <Briefcase className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight flex items-center gap-2">
                {initialJobToEdit ? 'চাকরির সার্কুলার সম্পাদনা' : 'নতুন চাকরির সার্কুলার তৈরি করুন'}
              </h2>
              <p className="text-xs text-emerald-100 font-medium">
                ঝাদিমাদি এন্টারপ্রাইজ রিক্রুটমেন্ট হাব ও অ্যাপ্লিক্যান্ট ট্র্যাকিং সিস্টেম
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowLivePreview(!showLivePreview)}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">{showLivePreview ? 'ফর্ম এডিটর' : 'প্রিভিউ'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition active:scale-95 cursor-pointer"
              title="বন্ধ করুন"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Pathway Tabs: Quick Upload vs Professional Builder */}
        {!initialJobToEdit && (
          <div className="bg-slate-100 border-b border-slate-200 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 shrink-0">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActivePathway('builder')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  activePathway === 'builder'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>প্রফেশনাল বিল্ডার (৪ ধাপ)</span>
              </button>

              <button
                type="button"
                onClick={() => setActivePathway('quick_upload')}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer ${
                  activePathway === 'quick_upload'
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>কুইক সার্কুলার আপলোড (AI এক্সট্র্যাক্ট)</span>
              </button>
            </div>

            {activePathway === 'builder' && (
              <span className="text-[11px] font-bold text-slate-500 hidden sm:inline">
                ধাপ {currentStep} / ৪
              </span>
            )}
          </div>
        )}

        {/* Builder Step Progress Bar */}
        {activePathway === 'builder' && (
          <div className="bg-white border-b border-slate-100 px-4 sm:px-6 py-3 shrink-0">
            <div className="grid grid-cols-4 gap-2">
              {[
                { step: 1, label: 'বেসিক তথ্য', icon: Building2 },
                { step: 2, label: 'যোগ্যতা ও দক্ষতা', icon: Award },
                { step: 3, label: 'দায়িত্ব ও সুযোগ', icon: FileText },
                { step: 4, label: 'আবেদন পদ্ধতি', icon: LinkIcon }
              ].map(({ step, label, icon: Icon }) => (
                <button
                  key={step}
                  type="button"
                  onClick={() => {
                    if (step < currentStep || validateStep(currentStep)) {
                      setCurrentStep(step);
                    }
                  }}
                  className={`flex items-center gap-2 p-1.5 rounded-xl text-left transition cursor-pointer ${
                    currentStep === step 
                      ? 'bg-emerald-50 border border-emerald-300 text-emerald-800'
                      : currentStep > step
                        ? 'text-slate-700 hover:bg-slate-50'
                        : 'text-slate-400 opacity-60'
                  }`}
                >
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 ${
                    currentStep === step
                      ? 'bg-emerald-700 text-white'
                      : currentStep > step
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-200 text-slate-600'
                  }`}>
                    {currentStep > step ? <Check className="w-3.5 h-3.5" /> : step}
                  </div>
                  <span className="text-[11px] font-bold truncate hidden md:inline">{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">

          {/* ================= PATHWAY A: QUICK UPLOAD MODE ================= */}
          {activePathway === 'quick_upload' && (
            <div className="space-y-5">
              <div className="bg-amber-50 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
                <Sparkles className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-xs font-black text-amber-900">স্বয়ংক্রিয় এআই সার্কুলার পার্সার</h4>
                  <p className="text-xs text-amber-700 mt-0.5 leading-relaxed">
                    আপনার তৈরি করা চাকরির বিজ্ঞপ্তি বা পোস্টারের ছবি (JPG, PNG) অথবা ফাইল (PDF, DOCX) আপলোড করুন। এআই স্বয়ংক্রিয়ভাবে পদবী, বেতন, যোগ্যতা ও আবেদনের শেষ তারিখ এক্সট্র্যাক্ট করে প্রস্তুত করবে।
                  </p>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div 
                onClick={() => circularInputRef.current?.click()}
                className="border-2 border-dashed border-emerald-300 hover:border-emerald-600 rounded-3xl p-6 sm:p-8 text-center bg-emerald-50/40 hover:bg-emerald-50/80 transition cursor-pointer flex flex-col items-center justify-center gap-3"
              >
                <input 
                  type="file" 
                  ref={circularInputRef}
                  onChange={handleSelectCircularFile}
                  accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" 
                  className="hidden" 
                />
                <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-xs">
                  {isParsingCircular ? (
                    <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
                  ) : (
                    <Upload className="w-7 h-7 text-emerald-700" />
                  )}
                </div>

                <div>
                  <h3 className="text-sm font-black text-slate-800">
                    {isParsingCircular 
                      ? 'এআই সার্কুলার ফাইল বিশ্লেষণ করছে...' 
                      : uploadedCircularFile 
                        ? uploadedCircularFile.name 
                        : 'বিজ্ঞপ্তি ফাইল বা ছবি ড্রপ করুন অথবা সিলেক্ট করুন'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">
                    সমর্থিত ফরম্যাট: PDF, DOCX, JPG, PNG (সর্বোচ্চ ১৫ মেগাবাইট)
                  </p>
                </div>

                {!isParsingCircular && !uploadedCircularFile && (
                  <span className="px-4 py-2 rounded-xl bg-emerald-700 text-white font-bold text-xs shadow-xs hover:bg-emerald-800 transition">
                    ফাইল ব্রাউজ করুন
                  </span>
                )}
              </div>

              {/* Parsed Editable Review Card */}
              {circularReviewReady && (
                <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                    <div className="flex items-center gap-2">
                      <FileCheck className="w-4 h-4 text-emerald-600" />
                      <span className="text-xs font-black text-slate-800">এক্সট্র্যাক্ট করা তথ্য পর্যালোচনা করুন</span>
                    </div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md">
                      সম্পাদনাযোগ্য
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">চাকরির পদবী *</label>
                      <input 
                        type="text" 
                        value={title} 
                        onChange={e => setTitle(e.target.value)} 
                        className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">ক্যাটাগরি</label>
                      <select 
                        value={category} 
                        onChange={e => setCategory(e.target.value)} 
                        className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      >
                        {JOB_CATEGORIES.map(c => (
                          <option key={c.id} value={c.nameBn}>{c.nameBn}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">বেতন কাঠামো</label>
                      <input 
                        type="text" 
                        value={salaryDisplay} 
                        onChange={e => setSalaryDisplay(e.target.value)} 
                        className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-bold text-slate-600 block mb-1">আবেদনের শেষ তারিখ</label>
                      <input 
                        type="date" 
                        value={deadline} 
                        onChange={e => setDeadline(e.target.value)} 
                        className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">সংক্ষিপ্ত বিবরণ</label>
                    <textarea 
                      rows={2} 
                      value={summary} 
                      onChange={e => setSummary(e.target.value)} 
                      className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <button
                      type="button"
                      onClick={() => setActivePathway('builder')}
                      className="text-xs font-bold text-emerald-700 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <span>বিস্তারিত প্রফেশনাল বিল্ডারে এডিট করুন</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSubmitJob('Active')}
                      disabled={isSubmitting}
                      className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs shadow-md transition flex items-center gap-2 cursor-pointer"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                      <span>সরাসরি প্রকাশ করুন (Publish Now)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= PATHWAY B: PROFESSIONAL BUILDER MODE ================= */}
          {activePathway === 'builder' && (
            <div>
              {/* STEP 01: CORE JOB INFO */}
              {currentStep === 1 && (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-2">
                    <h3 className="text-sm font-black text-slate-800">ধাপ ০১: মূল চাকরির তথ্য ও ক্ষতিপূরণ (Core Job Info)</h3>
                    <p className="text-xs text-slate-500 mt-0.5">পদবী, শূন্যপদ, কাজের ধরন এবং বেতন সংক্রান্ত তথ্য দিন।</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="text-xs font-black text-slate-700 block mb-1">
                        চাকরির পদবী / শিরোনাম (Job Title) *
                      </label>
                      <input 
                        type="text" 
                        value={title} 
                        onChange={e => setTitle(e.target.value)}
                        placeholder="যেমন: সিনিয়র ফুল-স্ট্যাক ওয়েব ডেভেলপার / ব্রাঞ্চ ম্যানেজার"
                        className="w-full px-3.5 py-2.5 text-xs sm:text-sm font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        চাকরির ক্যাটাগরি (Category) *
                      </label>
                      <select 
                        value={category} 
                        onChange={e => setCategory(e.target.value)}
                        className="w-full px-3 py-2.5 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      >
                        {JOB_CATEGORIES.map(c => (
                          <option key={c.id} value={c.nameBn}>{c.nameBn} ({c.nameEn})</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        শূন্যপদের সংখ্যা (Vacancies) *
                      </label>
                      <input 
                        type="number" 
                        min={1} 
                        value={vacanciesCount} 
                        onChange={e => setVacanciesCount(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-full px-3 py-2.5 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        কাজের ধরন (Employment Type) *
                      </label>
                      <select 
                        value={jobType} 
                        onChange={e => setJobType(e.target.value as JobType)}
                        className="w-full px-3 py-2.5 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      >
                        {JOB_TYPES.map(t => (
                          <option key={t.id} value={t.id}>{t.nameBn}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        কর্মক্ষেত্রের ধরন (Workplace Type) *
                      </label>
                      <select 
                        value={workplaceType} 
                        onChange={e => setWorkplaceType(e.target.value as WorkplaceType)}
                        className="w-full px-3 py-2.5 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      >
                        <option value="On-site">অন-সাইট (অফিসে উপস্থিত)</option>
                        <option value="Remote">রিমোট (বাসা থেকে কাজ)</option>
                        <option value="Hybrid">হাইব্রিড (অফিস ও বাসা উভয়ই)</option>
                      </select>
                    </div>

                    {/* Location Selection */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">জেলা (District)</label>
                      <select 
                        value={district} 
                        onChange={e => {
                          setDistrict(e.target.value);
                          const d = LOCATION_MASTER.flatMap(l => l.districts).find(item => item.nameBn === e.target.value);
                          if (d && d.upazilas.length > 0) {
                            setUpazila(d.upazilas[0].nameBn);
                          }
                        }}
                        className="w-full px-3 py-2.5 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      >
                        {LOCATION_MASTER.flatMap(div => div.districts).map(d => (
                          <option key={d.code} value={d.nameBn}>{d.nameBn}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">উপজেলা / এলাকা (Upazila)</label>
                      <select 
                        value={upazila} 
                        onChange={e => setUpazila(e.target.value)}
                        className="w-full px-3 py-2.5 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      >
                        {upazilaList.map(u => (
                          <option key={u.code} value={u.nameBn}>{u.nameBn}</option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-bold text-slate-700 block mb-1">অফিস বা কাজের পূর্ণ ঠিকানা (Address)</label>
                      <input 
                        type="text" 
                        value={address} 
                        onChange={e => setAddress(e.target.value)}
                        placeholder="যেমন: বনরুপা বাণিজ্যিক এলাকা, রাঙ্গামাটি সদর"
                        className="w-full px-3.5 py-2 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    {/* Salary Configuration */}
                    <div className="sm:col-span-2 bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-slate-800">মাসিক বেতন কাঠামো (Salary Range)</span>
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={salaryNegotiable} 
                            onChange={e => setSalaryNegotiable(e.target.checked)}
                            className="rounded-sm text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                          />
                          <span className="text-xs font-bold text-slate-700">আলোচনা সাপেক্ষে</span>
                        </label>
                      </div>

                      {!salaryNegotiable ? (
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-[11px] font-bold text-slate-600 block mb-1">সর্বনিম্ন বেতন (৳)</label>
                            <input 
                              type="number" 
                              value={salaryMin} 
                              onChange={e => setSalaryMin(e.target.value)}
                              placeholder="যেমন: ২০০০০"
                              className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                            />
                          </div>
                          <div>
                            <label className="text-[11px] font-bold text-slate-600 block mb-1">সর্বোচ্চ বেতন (৳)</label>
                            <input 
                              type="number" 
                              value={salaryMax} 
                              onChange={e => setSalaryMax(e.target.value)}
                              placeholder="যেমন: ৩৫০০০"
                              className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                            />
                          </div>
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">
                          বেতন প্রার্থীর অভিজ্ঞতা ও সাক্ষাৎকারের ভিত্তিতে নির্ধারণ করা হবে।
                        </p>
                      )}
                    </div>

                    <div className="sm:col-span-2">
                      <label className="text-xs font-black text-slate-700 block mb-1">
                        আবেদনের শেষ সময়সীমা (Deadline) *
                      </label>
                      <input 
                        type="date" 
                        value={deadline} 
                        onChange={e => setDeadline(e.target.value)}
                        className="w-full px-3.5 py-2.5 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 02: REQUIREMENTS */}
              {currentStep === 2 && (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-2">
                    <h3 className="text-sm font-black text-slate-800">ধাপ ০২: প্রার্থীর যোগ্যতা ও দক্ষতা (Requirements)</h3>
                    <p className="text-xs text-slate-500 mt-0.5">শিক্ষাগত যোগ্যতা, অভিজ্ঞতা এবং আবশ্যকীয় দক্ষতা যোগ করুন।</p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        ন্যূনতম শিক্ষাগত যোগ্যতা *
                      </label>
                      <input 
                        type="text" 
                        value={minEducation} 
                        onChange={e => setMinEducation(e.target.value)}
                        placeholder="যেমন: স্নাতক / বিএসসি ইন সিএসই / এইচএসসি"
                        className="w-full px-3 py-2.5 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        কাজের অভিজ্ঞতা (Experience) *
                      </label>
                      <input 
                        type="text" 
                        value={minExperienceYears} 
                        onChange={e => setMinExperienceYears(e.target.value)}
                        placeholder="যেমন: ১-২ বছর / ফ্রেশাররাও আবেদন করতে পারবে"
                        className="w-full px-3 py-2.5 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">বয়সসীমা (Age Range)</label>
                      <input 
                        type="text" 
                        value={ageRange} 
                        onChange={e => setAgeRange(e.target.value)}
                        placeholder="যেমন: ২০ - ৩৫ বছর"
                        className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>

                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">লিঙ্গ অগ্রাধিকার (Gender)</label>
                      <select 
                        value={genderPreference} 
                        onChange={e => setGenderPreference(e.target.value as any)}
                        className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      >
                        <option value="Any">উভয়ই (নারী ও পুরুষ উভয়ে আবেদন করতে পারবে)</option>
                        <option value="Male">পুরুষ অগ্রাধিকার</option>
                        <option value="Female">নারী অগ্রাধিকার</option>
                      </select>
                    </div>

                    {/* Skill Chips Input */}
                    <div className="sm:col-span-2 space-y-2">
                      <label className="text-xs font-black text-slate-700 block">
                        প্রয়োজনীয় দক্ষতা (Required Skills) *
                      </label>

                      <div className="flex gap-2">
                        <input 
                          type="text" 
                          value={skillInput} 
                          onChange={e => setSkillInput(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              handleAddSkill();
                            }
                          }}
                          placeholder="দক্ষতার নাম লিখুন এবং 'যোগ করুন' চাপুন (যেমন: React, Excel, Tally)"
                          className="flex-1 px-3.5 py-2 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                        />
                        <button
                          type="button"
                          onClick={handleAddSkill}
                          className="px-4 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition flex items-center gap-1 cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>যোগ করুন</span>
                        </button>
                      </div>

                      {/* Display Skills Chips */}
                      <div className="flex flex-wrap gap-2 pt-1">
                        {requiredSkills.map((skill, idx) => (
                          <span 
                            key={idx} 
                            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/70 border border-emerald-300 text-emerald-900 text-xs font-bold shadow-2xs"
                          >
                            <span>{skill}</span>
                            <button
                              type="button"
                              onClick={() => setRequiredSkills(requiredSkills.filter((_, i) => i !== idx))}
                              className="w-3.5 h-3.5 rounded-full hover:bg-emerald-200 flex items-center justify-center text-emerald-800 cursor-pointer"
                            >
                              <X className="w-2.5 h-2.5" />
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 03: RICH DESCRIPTION */}
              {currentStep === 3 && (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-2">
                    <h3 className="text-sm font-black text-slate-800">ধাপ ০৩: দায়িত্ব ও সুযোগ-সুবিধা (Rich Description)</h3>
                    <p className="text-xs text-slate-500 mt-0.5">কাজের দায়িত্ব, অন্যান্য সুযোগ-সুবিধা এবং অফিস আওয়ার বর্ণনা করুন।</p>
                  </div>

                  {/* Summary */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      কাজের সংক্ষিপ্ত বিবরণ (Job Summary) *
                    </label>
                    <textarea 
                      rows={3} 
                      value={summary} 
                      onChange={e => setSummary(e.target.value)}
                      placeholder="এই পদের প্রধান উদ্দেশ্য ও সংক্ষিপ্ত পরিচিতি লিখুন..."
                      className="w-full px-3.5 py-2 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  {/* Roles and Responsibilities */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 block">
                      দায়িত্ব ও কর্মপরিধি (Roles & Responsibilities)
                    </label>

                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={roleInput} 
                        onChange={e => setRoleInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddRole();
                          }
                        }}
                        placeholder="একটি দায়িত্ব যোগ করুন..."
                        className="flex-1 px-3 py-2 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={handleAddRole}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs transition flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>যোগ</span>
                      </button>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      {rolesResponsibilities.map((role, idx) => (
                        <div key={idx} className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800">
                          <div className="flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0"></span>
                            <span>{role}</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => setRolesResponsibilities(rolesResponsibilities.filter((_, i) => i !== idx))}
                            className="text-slate-400 hover:text-red-600 p-1 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Benefits */}
                  <div className="space-y-2">
                    <label className="text-xs font-black text-slate-700 block">
                      অন্যান্য সুযোগ-সুবিধা (Compensation & Benefits)
                    </label>

                    <div className="flex gap-2">
                      <input 
                        type="text" 
                        value={benefitInput} 
                        onChange={e => setBenefitInput(e.target.value)}
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddBenefit();
                          }
                        }}
                        placeholder="যেমন: মোবাইল বিল, উৎসব বোনাস, চিকিৎসা ভাতা..."
                        className="flex-1 px-3 py-2 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                      <button
                        type="button"
                        onClick={handleAddBenefit}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white font-bold text-xs shadow-xs transition flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>যোগ</span>
                      </button>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      {benefits.map((b, idx) => (
                        <span 
                          key={idx} 
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs font-bold"
                        >
                          <span>{b}</span>
                          <button
                            type="button"
                            onClick={() => setBenefits(benefits.filter((_, i) => i !== idx))}
                            className="hover:text-red-700 cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Working Hours */}
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">অফিস ও কাজের সময় (Working Hours)</label>
                    <input 
                      type="text" 
                      value={workingHours} 
                      onChange={e => setWorkingHours(e.target.value)}
                      placeholder="যেমন: সকাল ৯:০০ - বিকাল ৫:০০ (রবি থেকে বৃহস্পতি)"
                      className="w-full px-3.5 py-2 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>
                </div>
              )}

              {/* STEP 04: APPLICATION METHOD */}
              {currentStep === 4 && (
                <div className="space-y-4">
                  <div className="border-b border-slate-100 pb-2">
                    <h3 className="text-sm font-black text-slate-800">ধাপ ০৪: আবেদন পদ্ধতি ও নিয়মাবলী (Application Method)</h3>
                    <p className="text-xs text-slate-500 mt-0.5">প্রার্থীরা কীভাবে আবেদন করবেন তা নির্দিষ্ট করুন।</p>
                  </div>

                  <div className="space-y-3">
                    <label className="text-xs font-black text-slate-700 block">আবেদনের মাধ্যম নির্বাচন করুন *</label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {[
                        { 
                          type: 'Native_Jhadimadi', 
                          title: 'ঝাদিমাদি ১-ক্লিক আবেদন (সুপারিশকৃত)', 
                          desc: 'প্রার্থীরা সরাসরি ঝাদিমাদি প্রোফাইল ও সিভি দিয়ে আবেদন করবেন, যা সাথে সাথে আপনার অ্যাপ্লিক্যান্ট ট্র্যাকার ড্যাশবোর্ডে আসবে।' 
                        },
                        { 
                          type: 'External_URL', 
                          title: 'কোম্পানি ওয়েবসাইট / বাহ্যিক লিঙ্ক', 
                          desc: 'প্রার্থীদের আপনার নিজস্ব ক্যারিয়ার পোর্টাল বা গুগল ফর্মে রিডাইরেক্ট করবে।' 
                        },
                        { 
                          type: 'Direct_Email', 
                          title: 'ইমেইলে সিভি গ্রহণ', 
                          desc: 'প্রার্থীরা সরাসরি আপনার কর্পোরেট এইচআর ইমেইলে সিভি পাঠাবেন।' 
                        },
                        { 
                          type: 'Walk_In', 
                          title: 'সরাসরি সাক্ষাৎকার (Walk-in Interview)', 
                          desc: 'নির্দিষ্ট ঠিকানায় সরাসরি উপস্থিত হয়ে পরীক্ষা বা সাক্ষাৎকার।' 
                        }
                      ].map((item) => (
                        <div
                          key={item.type}
                          onClick={() => setApplicationType(item.type as any)}
                          className={`p-3.5 rounded-2xl border-2 transition cursor-pointer flex items-start gap-3 ${
                            applicationType === item.type
                              ? 'border-emerald-600 bg-emerald-50/50 shadow-xs'
                              : 'border-slate-200 hover:border-slate-300 bg-white'
                          }`}
                        >
                          <input 
                            type="radio" 
                            name="appType" 
                            checked={applicationType === item.type} 
                            onChange={() => setApplicationType(item.type as any)}
                            className="mt-1 text-emerald-600 focus:ring-emerald-500" 
                          />
                          <div>
                            <h4 className="text-xs font-black text-slate-900">{item.title}</h4>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Conditional Input based on Method */}
                    {applicationType === 'External_URL' && (
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                        <label className="text-xs font-black text-slate-800 block">বাহ্যিক আবেদন লিঙ্ক (External URL) *</label>
                        <div className="flex items-center gap-2">
                          <LinkIcon className="w-4 h-4 text-slate-400 shrink-0" />
                          <input 
                            type="url" 
                            value={externalUrl} 
                            onChange={e => setExternalUrl(e.target.value)}
                            placeholder="https://company.com/careers/apply-now"
                            className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                          />
                        </div>
                      </div>
                    )}

                    {applicationType === 'Direct_Email' && (
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                        <label className="text-xs font-black text-slate-800 block">সিভি পাঠানোর ইমেইল (HR Email) *</label>
                        <div className="flex items-center gap-2">
                          <Mail className="w-4 h-4 text-slate-400 shrink-0" />
                          <input 
                            type="email" 
                            value={applicationEmail} 
                            onChange={e => setApplicationEmail(e.target.value)}
                            placeholder="career@yourcompany.com"
                            className="w-full px-3 py-2 text-xs font-bold border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                          />
                        </div>
                      </div>
                    )}

                    {applicationType === 'Walk_In' && (
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                        <label className="text-xs font-black text-slate-800 block">সরাসরি উপস্থিতির পূর্ণ ঠিকানা ও সময়সূচী *</label>
                        <textarea 
                          rows={2}
                          value={walkInAddress} 
                          onChange={e => setWalkInAddress(e.target.value)}
                          placeholder="ঠিকানা ও সাক্ষাৎকারের সময়সূচী স্পষ্টভাবে লিখুন..."
                          className="w-full px-3 py-2 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden bg-white"
                        />
                      </div>
                    )}

                    {/* Special Instructions */}
                    <div>
                      <label className="text-xs font-bold text-slate-700 block mb-1">
                        বিশেষ নির্দেশনা বা শর্তাবলী (যদি থাকে)
                      </label>
                      <textarea 
                        rows={2} 
                        value={specialInstructions} 
                        onChange={e => setSpecialInstructions(e.target.value)}
                        placeholder="যেমন: খামের উপর বা ইমেইল সাবজেক্টে পদের নাম অবশ্যই উল্লেখ করতে হবে..."
                        className="w-full px-3.5 py-2 text-xs font-medium border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= LIVE PREVIEW MODAL DRAWER ================= */}
          {showLivePreview && (
            <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 sm:p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <span className="text-xs font-black text-slate-700 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-emerald-600" />
                  <span>চাকরির কার্ড প্রিভিউ (Job Seekers View)</span>
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  লাইভ প্রিভিউ
                </span>
              </div>

              <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-sm space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-md">
                      {category}
                    </span>
                    <h3 className="text-sm sm:text-base font-black text-slate-900 mt-1">
                      {title || 'চাকরির শিরোনাম এখানে প্রদর্শিত হবে'}
                    </h3>
                    <p className="text-xs text-slate-600 font-bold mt-0.5 flex items-center gap-1">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{initialJobToEdit?.employerName || 'আপনার কোম্পানি নাম'}</span>
                    </p>
                  </div>

                  <span className="text-xs font-black text-emerald-800 bg-emerald-100/60 px-3 py-1 rounded-xl shrink-0">
                    {salaryDisplay}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600 font-medium">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-slate-400" />
                    <span>{district}, {upazila}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Briefcase className="w-3 h-3 text-slate-400" />
                    <span>{jobType} • {workplaceType}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3 text-slate-400" />
                    <span>পদসংখ্যা: {vacanciesCount} জন</span>
                  </div>
                  <div className="flex items-center gap-1 text-red-600 font-bold">
                    <Calendar className="w-3 h-3" />
                    <span>শেষ তারিখ: {deadline}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer Controls */}
        <div className="bg-slate-100 border-t border-slate-200 px-4 sm:px-6 py-3.5 flex items-center justify-between gap-3 shrink-0">
          <div>
            {activePathway === 'builder' && currentStep > 1 ? (
              <button
                type="button"
                onClick={() => setCurrentStep(currentStep - 1)}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition flex items-center gap-1.5 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>পূর্ববর্তী ধাপ</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition cursor-pointer"
              >
                বাতিল করুন
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activePathway === 'builder' && (
              <button
                type="button"
                onClick={() => handleSubmitJob('Draft')}
                disabled={isSubmitting}
                className="px-3.5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-black text-xs transition cursor-pointer"
              >
                ড্রাফট সেভ
              </button>
            )}

            {activePathway === 'builder' && currentStep < 4 ? (
              <button
                type="button"
                onClick={() => {
                  if (validateStep(currentStep)) {
                    setCurrentStep(currentStep + 1);
                  }
                }}
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs shadow-md transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>পরবর্তী ধাপ</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmitJob('Active')}
                disabled={isSubmitting}
                className="px-5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs shadow-md transition flex items-center gap-2 cursor-pointer active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>সংরক্ষণ হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-amber-300" />
                    <span>সার্কুলার প্রকাশ করুন</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

      </motion.div>
    </div>
  );
};
