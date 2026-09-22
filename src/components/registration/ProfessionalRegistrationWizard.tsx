import React, { useState } from 'react';
import { 
  X, 
  ArrowLeft, 
  ArrowRight, 
  Save, 
  CheckCircle2, 
  Sparkles, 
  ShieldCheck, 
  RotateCcw, 
  AlertCircle,
  Menu,
  ChevronRight,
  User,
  MapPin,
  GraduationCap,
  Briefcase,
  Award,
  FileCheck,
  Globe,
  Check
} from 'lucide-react';
import { 
  REGISTRATION_STEPS, 
  RegistrationFormData, 
  AccountType,
  step1BasicInfoSchema,
  step2PersonalDetailsSchema,
  step3AddressSchema,
  step4EducationSchema,
  step5ExperienceSchema,
  step6SkillsCertSchema,
  step7DocumentsSchema,
  step8PortfolioSchema,
  step9VerificationSchema
} from '../../types/registration';
import { useRegistrationDraft } from '../../hooks/useRegistrationDraft';

// Step components
import { StepBasicInfo } from './steps/StepBasicInfo';
import { StepPersonalDetails } from './steps/StepPersonalDetails';
import { StepAddress } from './steps/StepAddress';
import { StepEducation } from './steps/StepEducation';
import { StepExperience } from './steps/StepExperience';
import { StepSkillsCert } from './steps/StepSkillsCert';
import { StepDocuments } from './steps/StepDocuments';
import { StepPortfolio } from './steps/StepPortfolio';
import { StepVerification } from './steps/StepVerification';
import { StepPreview } from './steps/StepPreview';
import { uploadFileToSupabaseStorage, isLocalTransientUrl } from '../../utils/directSupabaseStorage';

export interface ProfessionalRegistrationWizardProps {
  isOpen?: boolean;
  onClose?: () => void;
  initialAccountType?: AccountType;
  onSuccess?: (profileData: any) => void;
}

export const ProfessionalRegistrationWizard: React.FC<ProfessionalRegistrationWizardProps> = ({
  isOpen = true,
  onClose,
  initialAccountType,
  onSuccess,
}) => {
  const {
    formData,
    updateFormData,
    currentStep,
    setCurrentStep,
    hasSavedDraft,
    lastSavedTime,
    restoreDraft,
    clearDraft,
    saveDraftNow,
    isDraftSaving,
    completionPercentage,
  } = useRegistrationDraft();

  const [stepErrors, setStepErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [createdProfile, setCreatedProfile] = useState<any>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Set initial account type if passed and not yet filled
  React.useEffect(() => {
    if (initialAccountType && formData.accountType !== initialAccountType) {
      updateFormData({ accountType: initialAccountType });
    }
  }, [initialAccountType]);

  if (!isOpen) return null;

  // Validate current step before navigating to next
  const validateCurrentStep = (stepNumber: number): boolean => {
    setStepErrors({});
    setSubmissionError(null);

    try {
      switch (stepNumber) {
        case 1:
          step1BasicInfoSchema.parse(formData);
          break;
        case 2:
          step2PersonalDetailsSchema.parse(formData);
          break;
        case 3:
          step3AddressSchema.parse(formData);
          break;
        case 4:
          step4EducationSchema.parse(formData);
          break;
        case 5:
          step5ExperienceSchema.parse(formData);
          break;
        case 6:
          step6SkillsCertSchema.parse(formData);
          break;
        case 7:
          step7DocumentsSchema.parse(formData);
          break;
        case 8:
          step8PortfolioSchema.parse(formData);
          break;
        case 9:
          step9VerificationSchema.parse(formData);
          break;
        default:
          break;
      }
      return true;
    } catch (err: any) {
      if (err?.errors) {
        const errorsMap: Record<string, string> = {};
        err.errors.forEach((e: any) => {
          const path = e.path.join('.');
          errorsMap[path] = e.message;
        });
        setStepErrors(errorsMap);
      }
      return false;
    }
  };

  const handleNext = () => {
    if (validateCurrentStep(currentStep)) {
      if (currentStep < 10) {
        const next = currentStep + 1;
        setCurrentStep(next);
        saveDraftNow(formData, next);
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  };

  const handlePrev = () => {
    if (currentStep > 1) {
      const prev = currentStep - 1;
      setCurrentStep(prev);
      setStepErrors({});
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleJumpToStep = (targetStep: number) => {
    // Only allow jumping backward, or forward if steps before are valid
    if (targetStep <= currentStep) {
      setCurrentStep(targetStep);
      setStepErrors({});
      setMobileMenuOpen(false);
    } else {
      if (validateCurrentStep(currentStep)) {
        setCurrentStep(targetStep);
        setStepErrors({});
        setMobileMenuOpen(false);
      }
    }
  };

  const handleSubmit = async () => {
    setSubmissionError(null);
    setIsSubmitting(true);

    try {
      // Direct Supabase storage upload for all transient documents and images
      const updatedFormData = { ...formData };
      if (formData.nidFrontUrl && isLocalTransientUrl(formData.nidFrontUrl)) {
        updatedFormData.nidFrontUrl = await uploadFileToSupabaseStorage('documents', formData.nidFrontUrl, 'nid_front.jpg', 'nid_documents');
      }
      if (formData.nidBackUrl && isLocalTransientUrl(formData.nidBackUrl)) {
        updatedFormData.nidBackUrl = await uploadFileToSupabaseStorage('documents', formData.nidBackUrl, 'nid_back.jpg', 'nid_documents');
      }
      if (formData.selfieUrl && isLocalTransientUrl(formData.selfieUrl)) {
        updatedFormData.selfieUrl = await uploadFileToSupabaseStorage('avatars', formData.selfieUrl, 'selfie.jpg', 'selfies');
      }
      if (formData.cvResumeUrl && isLocalTransientUrl(formData.cvResumeUrl)) {
        updatedFormData.cvResumeUrl = await uploadFileToSupabaseStorage('documents', formData.cvResumeUrl, 'cv_resume.pdf', 'cv_documents');
      }
      if (formData.profilePhotoUrl && isLocalTransientUrl(formData.profilePhotoUrl)) {
        updatedFormData.profilePhotoUrl = await uploadFileToSupabaseStorage('avatars', formData.profilePhotoUrl, 'avatar.jpg', 'avatars');
      }

      const res = await fetch('/api/registration/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedFormData),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'নিবন্ধন প্রক্রিয়া সম্পন্ন করা সম্ভব হয়নি।');
      }

      // Success
      setIsCompleted(true);
      setCreatedProfile(data.profile || data);
      clearDraft();

      if (onSuccess) {
        onSuccess(data.profile || data);
      }
    } catch (err: any) {
      console.error('Registration failed:', err);
      setSubmissionError(err.message || 'সাবমিশনে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  // SUCCESS SCREEN
  if (isCompleted) {
    return (
      <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="w-full max-w-lg bg-white rounded-3xl p-6 sm:p-8 text-center shadow-2xl border border-stone-200 animate-fadeIn">
          <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h3 className="text-xl sm:text-2xl font-black text-stone-900">
            অভিনন্দন! নিবন্ধন সফল হয়েছে
          </h3>
          <p className="text-sm text-stone-600 mt-2">
            আপনার পেশাদার প্রোফাইল সফলভাবে তৈরি হয়েছে। আপনার তথ্য পর্যালোচনার জন্য গৃহীত হয়েছে।
          </p>

          <div className="my-6 p-4 rounded-2xl bg-stone-50 border border-stone-200 text-left space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-stone-500">নাম:</span>
              <span className="font-bold text-stone-900">{formData.fullName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">মোবাইল নম্বর:</span>
              <span className="font-mono font-bold text-stone-900">{formData.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">পেশার ধরণ:</span>
              <span className="font-bold text-emerald-800">{formData.categoryBn}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-stone-500">অবস্থান:</span>
              <span className="font-bold text-stone-900">
                {formData.permanentAddress.upazila}, {formData.permanentAddress.district}
              </span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="w-full py-3 bg-emerald-700 text-white rounded-xl text-sm font-bold hover:bg-emerald-800 transition-colors shadow-sm"
              >
                প্রবেশ করুন (Continue)
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentStepDef = REGISTRATION_STEPS.find((s) => s.id === currentStep) || REGISTRATION_STEPS[0];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-stone-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 md:p-6">
      <div className="w-full max-w-6xl bg-stone-50 rounded-3xl shadow-2xl border border-stone-200 flex flex-col max-h-[92vh] overflow-hidden">
        
        {/* TOP BAR / HEADER */}
        <div className="bg-white border-b border-stone-200 px-4 sm:px-6 py-3.5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-sm">
              JM
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-stone-900 flex items-center gap-2">
                <span>পেশাদার নিবন্ধন উইজার্ড</span>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                  Professional Registration
                </span>
              </h2>
              <p className="text-[11px] text-stone-500">
                ধাপ {currentStep} / ১০: {currentStepDef.titleBn}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            {/* Auto-save status */}
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-stone-500">
              <Save className="w-3.5 h-3.5 text-stone-400" />
              <span>{isDraftSaving ? 'সেভ হচ্ছে...' : 'ড্রাফট সেভ করা আছে'}</span>
            </div>

            {/* Mobile menu toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl text-stone-600 hover:bg-stone-100"
              title="ধাপ তালিকা"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Close Button */}
            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition-colors"
                title="বন্ধ করুন"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>

        {/* PROGRESS BAR (Top Mobile & Desktop) */}
        <div className="w-full bg-stone-200 h-1.5 shrink-0">
          <div
            className="bg-emerald-600 h-1.5 transition-all duration-300"
            style={{ width: `${(currentStep / 10) * 100}%` }}
          />
        </div>

        {/* DRAFT RECOVERY ALERT BANNER (If previous draft exists and user is on Step 1) */}
        {hasSavedDraft && currentStep === 1 && (
          <div className="bg-amber-50 border-b border-amber-200 px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3 shrink-0 animate-fadeIn">
            <div className="flex items-center gap-2 text-xs text-amber-900">
              <RotateCcw className="w-4 h-4 text-amber-700 shrink-0" />
              <span>
                <strong>অসম্পূর্ণ নিবন্ধন ড্রাফট পাওয়া গেছে:</strong> আপনি পূর্বের সেভ করা তথ্য দিয়ে পুনরায় শুরু করতে পারেন।
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => restoreDraft()}
                className="px-3 py-1 bg-amber-700 text-white rounded-lg text-xs font-bold hover:bg-amber-800 transition-colors"
              >
                ড্রাফট পুনরুদ্ধার
              </button>
              <button
                type="button"
                onClick={() => clearDraft()}
                className="text-xs text-stone-500 hover:text-stone-800"
              >
                মুছে নতুন শুরু করুন
              </button>
            </div>
          </div>
        )}

        {/* MAIN BODY: 2-COLUMN RESPONSIVE LAYOUT */}
        <div className="flex-1 overflow-hidden flex flex-col lg:flex-row">
          
          {/* LEFT SIDEBAR: STEPPER NAVIGATION (Desktop Sticky / Mobile Drawer) */}
          <div
            className={`${
              mobileMenuOpen ? 'block' : 'hidden'
            } lg:block w-full lg:w-80 bg-white border-r border-stone-200 p-4 sm:p-5 overflow-y-auto shrink-0`}
          >
            {/* Completion Gauge Widget */}
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-emerald-900 to-emerald-950 text-white shadow-xs">
              <div className="flex items-center justify-between text-xs text-emerald-200 font-semibold mb-1">
                <span>প্রোফাইল পূর্ণতা</span>
                <span>{completionPercentage}%</span>
              </div>
              <div className="w-full bg-emerald-950 rounded-full h-2 overflow-hidden border border-emerald-700/50">
                <div
                  className="bg-emerald-400 h-full rounded-full transition-all duration-300"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <p className="text-[11px] text-emerald-200/80 mt-2">
                ১০টি ধাপের মধ্যে ধাপ {currentStep} সক্রিয়
              </p>
            </div>

            {/* Stepper Navigation List */}
            <nav className="space-y-1.5" aria-label="Registration Steps">
              {REGISTRATION_STEPS.map((s) => {
                const isCurrent = s.id === currentStep;
                const isPassed = s.id < currentStep;

                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => handleJumpToStep(s.id)}
                    className={`w-full p-2.5 rounded-xl text-left transition-all flex items-center justify-between group ${
                      isCurrent
                        ? 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-300'
                        : isPassed
                        ? 'text-stone-700 hover:bg-stone-50 font-medium'
                        : 'text-stone-400 hover:bg-stone-50/50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                          isCurrent
                            ? 'bg-emerald-700 text-white'
                            : isPassed
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-stone-100 text-stone-400'
                        }`}
                      >
                        {isPassed ? <Check className="w-3.5 h-3.5" /> : s.id}
                      </div>
                      <div className="truncate">
                        <span className="text-xs block truncate">{s.titleBn}</span>
                        <span className="text-[10px] text-stone-400 block truncate font-normal">
                          {s.titleEn}
                        </span>
                      </div>
                    </div>

                    {isPassed && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* RIGHT COLUMN: ACTIVE FORM WORKSPACE */}
          <div className="flex-1 flex flex-col min-w-0 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-stone-50">
            <div className="max-w-3xl w-full mx-auto flex-1">
              
              {/* RENDER ACTIVE STEP */}
              {currentStep === 1 && (
                <StepBasicInfo
                  formData={formData}
                  updateFormData={updateFormData}
                  errors={stepErrors}
                />
              )}

              {currentStep === 2 && (
                <StepPersonalDetails
                  formData={formData}
                  updateFormData={updateFormData}
                  errors={stepErrors}
                />
              )}

              {currentStep === 3 && (
                <StepAddress
                  formData={formData}
                  updateFormData={updateFormData}
                  errors={stepErrors}
                />
              )}

              {currentStep === 4 && (
                <StepEducation
                  formData={formData}
                  updateFormData={updateFormData}
                  errors={stepErrors}
                />
              )}

              {currentStep === 5 && (
                <StepExperience
                  formData={formData}
                  updateFormData={updateFormData}
                  errors={stepErrors}
                />
              )}

              {currentStep === 6 && (
                <StepSkillsCert
                  formData={formData}
                  updateFormData={updateFormData}
                  errors={stepErrors}
                />
              )}

              {currentStep === 7 && (
                <StepDocuments
                  formData={formData}
                  updateFormData={updateFormData}
                  errors={stepErrors}
                />
              )}

              {currentStep === 8 && (
                <StepPortfolio
                  formData={formData}
                  updateFormData={updateFormData}
                  errors={stepErrors}
                />
              )}

              {currentStep === 9 && (
                <StepVerification
                  formData={formData}
                  updateFormData={updateFormData}
                  errors={stepErrors}
                />
              )}

              {currentStep === 10 && (
                <StepPreview
                  formData={formData}
                  onEditStep={(stepId) => setCurrentStep(stepId)}
                  onSubmit={handleSubmit}
                  isSubmitting={isSubmitting}
                  submissionError={submissionError}
                />
              )}
            </div>

            {/* ACTION FOOTER */}
            <div className="max-w-3xl w-full mx-auto pt-8 mt-auto border-t border-stone-200/80 flex items-center justify-between gap-3">
              <div>
                {currentStep > 1 && (
                  <button
                    type="button"
                    onClick={handlePrev}
                    className="px-4 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-700 text-xs sm:text-sm font-bold hover:bg-stone-100 transition-all flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>পূর্ববর্তী (Back)</span>
                  </button>
                )}
              </div>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => saveDraftNow()}
                  className="hidden sm:inline-flex px-4 py-2.5 rounded-xl border border-stone-300 bg-white text-stone-700 text-xs font-semibold hover:bg-stone-100 transition-all items-center gap-1.5"
                >
                  <Save className="w-3.5 h-3.5 text-stone-500" />
                  <span>ড্রাফট সেভ রাখুন</span>
                </button>

                {currentStep < 10 ? (
                  <button
                    type="button"
                    onClick={handleNext}
                    className="px-6 py-2.5 rounded-xl bg-emerald-700 text-white text-xs sm:text-sm font-bold hover:bg-emerald-800 transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <span>পরবর্তী ধাপ (Next)</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="px-6 py-2.5 rounded-xl bg-emerald-700 text-white text-xs sm:text-sm font-bold hover:bg-emerald-800 transition-all shadow-sm flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <span>সাবমিট হচ্ছে...</span>
                    ) : (
                      <>
                        <span>চূড়ান্ত সাবমিট</span>
                        <CheckCircle2 className="w-4 h-4" />
                      </>
                    )}
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfessionalRegistrationWizard;
