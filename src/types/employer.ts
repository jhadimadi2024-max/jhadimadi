import { JobType } from '../types';
import { MasterJobSeekerProfile } from './jobseeker';

export type VerificationTier = 
  | 'Unverified' 
  | 'Phone_Verified' 
  | 'Business_Verified' 
  | 'Professionally_Verified';

export type WorkplaceType = 'On-site' | 'Remote' | 'Hybrid';

export type JobLifecycleStatus = 
  | 'Draft' 
  | 'Active' 
  | 'Paused' 
  | 'Closed' 
  | 'Moderation_Pending' 
  | 'Reported';

export type ApplicantStage = 
  | 'New' 
  | 'Reviewed' 
  | 'Shortlisted' 
  | 'Interview' 
  | 'Selected' 
  | 'Rejected';

export interface EmployerProfile {
  id: string;
  companyName: string;
  companyNameBn?: string;
  tradeLicenseNumber?: string;
  contactPerson: string;
  contactPhone: string;
  contactEmail: string;
  website?: string;
  industry: string;
  district: string;
  upazila: string;
  address: string;
  logoUrl?: string;
  coverBannerUrl?: string;
  aboutCompany: string;
  employeeCount?: string;
  establishedYear?: string;
  verificationTier: VerificationTier;
  isVerified: boolean;
  socialLinks?: {
    facebook?: string;
    linkedin?: string;
    website?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface JobRequirements {
  minEducation: string;
  minExperienceYears: string;
  ageRange?: string;
  genderPreference?: 'Any' | 'Male' | 'Female';
  requiredSkills: string[];
  preferredSkills?: string[];
}

export interface JobDescriptionSection {
  summary: string;
  rolesResponsibilities: string[];
  benefits: string[];
  workingHours?: string;
  rawHtmlDescription?: string;
}

export interface JobApplicationMethod {
  type: 'Native_Jhadimadi' | 'External_URL' | 'Direct_Email' | 'Walk_In';
  externalUrl?: string;
  applicationEmail?: string;
  walkInAddress?: string;
  specialInstructions?: string;
}

export interface EmployerJobVacancy {
  id: string;
  employerId: string;
  employerName: string;
  employerLogo?: string;
  verificationTier: VerificationTier;
  
  title: string;
  designation?: string;
  category: string;
  vacanciesCount: number;
  jobType: JobType;
  workplaceType: WorkplaceType;
  
  // Location
  division?: string;
  district: string;
  upazila: string;
  address?: string;

  // Compensation
  salaryNegotiable: boolean;
  salaryMin?: number;
  salaryMax?: number;
  salaryDisplay: string;

  // Timeline
  deadline: string;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;

  // Structured details
  requirements: JobRequirements;
  description: JobDescriptionSection;
  applicationMethod: JobApplicationMethod;
  circularFileUrl?: string;
  circularFileName?: string;

  // Lifecycle
  status: JobLifecycleStatus;
  isFeatured?: boolean;
  moderationNotes?: string;

  // Analytics
  viewsCount: number;
  applicantCount: number;
}

export interface EmployerApplicant {
  id: string;
  jobId: string;
  jobTitle: string;
  candidateId: string;
  candidateName: string;
  candidatePhoneMasked: string;
  candidateEmailMasked: string;
  candidateLocation: string;
  desiredJobTitle?: string;
  experienceYears?: string;
  highestEducation?: string;
  skills: string[];
  coverLetter?: string;
  resumeUrl?: string;
  resumeFileName?: string;
  privacyProtected: boolean;
  stage: ApplicantStage;
  appliedAt: string;
  updatedAt: string;
  internalNotes?: string;
  rating?: number; // 1 to 5
  interviewScheduledDate?: string;
  interviewNotes?: string;
}

export interface RecruitmentMetrics {
  totalJobs: number;
  activeJobs: number;
  pausedJobs: number;
  draftJobs: number;
  totalApplicants: number;
  newApplicants: number;
  interviewScheduledCount: number;
  hiredCount: number;
}
