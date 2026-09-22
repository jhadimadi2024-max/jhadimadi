// Types for Centralized Job Seeker Profile and CV Management Hub
import { JobType } from '../types';

export type ApplicationStatus = 
  | 'Applied' 
  | 'Under Review' 
  | 'Shortlisted' 
  | 'Interview' 
  | 'Selected' 
  | 'Rejected';

export interface EducationEntry {
  id: string;
  degree: string;
  institution: string;
  fieldOfStudy?: string;
  passingYear: string;
  resultGrade?: string;
  scale?: string;
}

export interface ExperienceEntry {
  id: string;
  company: string;
  designation: string;
  employmentType?: string;
  location?: string;
  startDate: string;
  endDate?: string;
  isCurrent?: boolean;
  responsibilities?: string;
}

export interface SkillItem {
  id: string;
  name: string;
  category?: 'technical' | 'soft' | 'tools' | 'languages' | 'other';
  level: 'Beginner' | 'Intermediate' | 'Expert';
}

export interface LanguageItem {
  id: string;
  name: string;
  proficiency: 'Basic' | 'Conversational' | 'Fluent' | 'Native';
}

export interface PortfolioProject {
  id: string;
  title: string;
  description: string;
  link?: string;
  imageUrl?: string;
  technologies?: string[];
}

export interface CertificationItem {
  id: string;
  title: string;
  issuer: string;
  issueDate: string;
  credentialUrl?: string;
  certificateId?: string;
}

export interface CandidatePrivacySettings {
  hidePhone: boolean;
  hideEmail: boolean;
  hideAddress: boolean;
  isPublicProfile: boolean;
}

export interface MasterJobSeekerProfile {
  id: string;
  candidateCode: string;
  userId?: string;

  // Personal Information
  fullName: string;
  phone: string;
  email: string;
  photoUrl?: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth?: string;
  bloodGroup?: string;
  nationality?: string;
  division?: string;
  district: string;
  upazila: string;
  address?: string;
  bio?: string;

  // Career Information
  desiredJobTitle: string;
  careerObjective: string;
  category: string;
  preferredJobType: JobType | 'Hybrid';
  expectedSalaryText: string;
  expectedSalaryMin?: number;
  expectedSalaryMax?: number;
  currentSalary?: string;
  experienceYears: string;
  noticePeriod?: string;

  // Education & Experience
  education: EducationEntry[];
  experience: ExperienceEntry[];

  // Skills & Languages
  skills: SkillItem[];
  languages: LanguageItem[];

  // Portfolio & Certifications
  projects: PortfolioProject[];
  certifications: CertificationItem[];

  // Privacy Safeguards
  privacySettings: CandidatePrivacySettings;

  // Attached/Uploaded Master Resume Document
  resumeUrl?: string;
  resumeFileName?: string;
  resumeFileType?: string;
  resumeUploadedAt?: string;

  // Metadata
  completenessScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface JobApplication {
  id: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  jobCategory?: string;
  jobDistrict?: string;
  candidateId: string;
  candidateName: string;
  candidatePhone: string;
  candidateEmail: string;
  coverLetter?: string;
  resumeUrl?: string;
  status: ApplicationStatus;
  appliedAt: string;
  updatedAt?: string;
  interviewDate?: string;
  interviewNote?: string;
  employerNotes?: string;
  employerFeedback?: string;
}

export interface CvExtractionResult {
  fullName?: string;
  email?: string;
  phone?: string;
  desiredJobTitle?: string;
  careerObjective?: string;
  category?: string;
  experienceYears?: string;
  education?: Partial<EducationEntry>[];
  experience?: Partial<ExperienceEntry>[];
  skills?: string[];
  district?: string;
  upazila?: string;
  address?: string;
  languages?: string[];
  rawTextPreview?: string;
  confidenceScore?: number;
}
