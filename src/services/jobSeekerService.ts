import { 
  MasterJobSeekerProfile, 
  JobApplication, 
  CvExtractionResult, 
  ApplicationStatus,
  CandidatePrivacySettings
} from '../types/jobseeker';
import { supabase } from '../supabase';
import { smartSupabaseInsert, prepareJobApplicationPayload } from '../utils/supabaseDataService';

const STORAGE_KEY_MASTER_PROFILE = 'jhadimadi_jobseeker_master_profile_v1';
const STORAGE_KEY_APPLICATIONS = 'jhadimadi_jobseeker_applications_v1';
const STORAGE_KEY_SAVED_JOBS = 'jhadimadi_jobseeker_saved_jobs_v1';

export const DEFAULT_PRIVACY_SETTINGS: CandidatePrivacySettings = {
  hidePhone: false,
  hideEmail: false,
  hideAddress: false,
  isPublicProfile: true,
};

export const INITIAL_MASTER_PROFILE: MasterJobSeekerProfile = {
  id: '',
  candidateCode: '',
  fullName: '',
  phone: '',
  email: '',
  gender: 'Male',
  division: 'চট্টগ্রাম',
  district: 'খাগড়াছড়ি',
  upazila: 'খাগড়াছড়ি সদর',
  address: '',
  bio: '',
  desiredJobTitle: '',
  careerObjective: '',
  category: 'আইটি ও সফটওয়্যার',
  preferredJobType: 'Full-time',
  expectedSalaryText: '',
  experienceYears: '১-২ বছর',
  education: [],
  experience: [],
  skills: [],
  languages: [
    { id: 'lang-1', name: 'বাংলা', proficiency: 'Native' },
    { id: 'lang-2', name: 'ইংরেজি', proficiency: 'Conversational' }
  ],
  projects: [],
  certifications: [],
  privacySettings: DEFAULT_PRIVACY_SETTINGS,
  completenessScore: 15,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * Compute completeness percentage of profile
 */
export function calculateJobSeekerCompleteness(profile: Partial<MasterJobSeekerProfile>): number {
  let score = 0;
  if (profile.fullName && profile.fullName.trim().length >= 3) score += 10;
  if (profile.phone && profile.phone.trim().length >= 11) score += 10;
  if (profile.email && profile.email.includes('@')) score += 10;
  if (profile.photoUrl) score += 5;
  if (profile.district && profile.upazila) score += 10;
  if (profile.desiredJobTitle && profile.desiredJobTitle.trim().length > 2) score += 10;
  if (profile.careerObjective && profile.careerObjective.trim().length > 15) score += 10;
  if (profile.education && profile.education.length > 0) score += 15;
  if (profile.experience && profile.experience.length > 0) score += 10;
  if (profile.skills && profile.skills.length >= 2) score += 10;
  if (profile.resumeUrl) score += 10;

  return Math.min(100, score);
}

/**
 * Get cached master profile from local storage, fallback to initial default
 */
export function getLocalMasterProfile(): MasterJobSeekerProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_MASTER_PROFILE);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        parsed.completenessScore = calculateJobSeekerCompleteness(parsed);
        return parsed;
      }
    }
  } catch (e) {
    console.warn('[jobSeekerService] local profile read error:', e);
  }
  return null;
}

export function getMasterProfile(): MasterJobSeekerProfile {
  return getLocalMasterProfile() || { ...INITIAL_MASTER_PROFILE };
}

/**
 * Save master profile locally & attempt cloud persistence
 */
export async function saveMasterProfile(
  profileData: Partial<MasterJobSeekerProfile>
): Promise<{ success: boolean; data: MasterJobSeekerProfile; error?: string }> {
  const existing = getLocalMasterProfile() || INITIAL_MASTER_PROFILE;

  const id = existing.id || 'cand_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const randCode = existing.candidateCode || `JM-CAND-${Math.floor(10000 + Math.random() * 90000)}`;

  const updated: MasterJobSeekerProfile = {
    ...existing,
    ...profileData,
    id,
    candidateCode: randCode,
    updatedAt: new Date().toISOString(),
    completenessScore: 0,
  };
  updated.completenessScore = calculateJobSeekerCompleteness(updated);

  // 1. LocalStorage
  try {
    localStorage.setItem(STORAGE_KEY_MASTER_PROFILE, JSON.stringify(updated));
  } catch (e) {
    console.warn('[jobSeekerService] LocalStorage save error:', e);
  }

  // 2. Server API
  try {
    await fetch('/api/jobseeker/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updated),
    });
  } catch (e) {
    // offline fallback
  }

  // 3. Supabase direct
  try {
    await supabase.from('job_candidates').upsert({
      id: updated.id,
      candidate_code: updated.candidateCode,
      name: updated.fullName,
      phone: updated.phone,
      email: updated.email,
      gender: updated.gender,
      desired_job_title: updated.desiredJobTitle,
      category: updated.category,
      expected_salary: updated.expectedSalaryText,
      experience_years: updated.experienceYears,
      highest_education: updated.education[0]?.degree || '',
      skills: updated.skills.map(s => s.name),
      division: updated.division || '',
      district: updated.district,
      upazila: updated.upazila,
      address: updated.address || '',
      bio: updated.bio || updated.careerObjective,
      resume_url: updated.resumeUrl || '',
      status: 'available',
      updated_at: updated.updatedAt,
    });
  } catch (err) {
    // silent catch
  }

  return { success: true, data: updated };
}

/**
 * Fetch candidate applications
 */
export function getLocalApplications(): JobApplication[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_APPLICATIONS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

export function saveLocalApplications(apps: JobApplication[]): void {
  try {
    localStorage.setItem(STORAGE_KEY_APPLICATIONS, JSON.stringify(apps));
  } catch (e) {}
}

/**
 * Fetch candidate applications from local cache & sync with API
 */
export async function fetchCandidateApplications(candidateId?: string, phone?: string): Promise<JobApplication[]> {
  const localApps = getLocalApplications();
  try {
    const query = new URLSearchParams();
    if (candidateId) query.set('candidateId', candidateId);
    if (phone) query.set('phone', phone);
    
    const res = await fetch(`/api/jobseeker/applications?${query.toString()}`);
    const json = await res.json();
    if (json.success && Array.isArray(json.applications)) {
      // Merge unique by ID
      const map = new Map<string, JobApplication>();
      localApps.forEach(a => map.set(a.id, a));
      json.applications.forEach((a: JobApplication) => map.set(a.id, a));
      const merged = Array.from(map.values());
      saveLocalApplications(merged);
      return merged;
    }
  } catch (e) {
    // offline fallback to local
  }
  return localApps;
}

/**
 * Withdraw an active application
 */
export async function withdrawJobApplication(appId: string): Promise<boolean> {
  const apps = getLocalApplications();
  const filtered = apps.filter(a => a.id !== appId);
  saveLocalApplications(filtered);

  try {
    await fetch(`/api/jobseeker/applications/${appId}`, { method: 'DELETE' });
  } catch (e) {
    // silent
  }
  return true;
}

/**
 * Submit a 1-click job application
 */
export async function submitJobApplication(params: {
  jobId: string;
  jobTitle: string;
  companyName: string;
  jobCategory?: string;
  jobDistrict?: string;
  candidateProfile: MasterJobSeekerProfile;
  coverLetter?: string;
  attachResume?: boolean;
}): Promise<{ success: boolean; application: JobApplication; error?: string }> {
  const {
    jobId,
    jobTitle,
    companyName,
    jobCategory,
    jobDistrict,
    candidateProfile,
    coverLetter,
    attachResume = true,
  } = params;

  const currentApps = getLocalApplications();

  // Check if already applied
  const existingIndex = currentApps.findIndex(a => a.jobId === jobId);
  if (existingIndex >= 0) {
    return {
      success: false,
      application: currentApps[existingIndex],
      error: 'আপনি ইতিপূর্বে এই চাকুরিতে আবেদন করেছেন। আপনার আবেদনের অবস্থা ড্যাশবোর্ডে ট্র্যাক করতে পারেন।'
    };
  }

  const newApp: JobApplication = {
    id: 'app_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6),
    jobId,
    jobTitle,
    companyName,
    jobCategory,
    jobDistrict,
    candidateId: candidateProfile.id,
    candidateName: candidateProfile.fullName,
    candidatePhone: candidateProfile.privacySettings.hidePhone ? 'গোপন রাখা হয়েছে' : candidateProfile.phone,
    candidateEmail: candidateProfile.privacySettings.hideEmail ? 'গোপন রাখা হয়েছে' : candidateProfile.email,
    coverLetter: coverLetter || '',
    resumeUrl: attachResume ? candidateProfile.resumeUrl : undefined,
    status: 'Applied',
    appliedAt: new Date().toISOString(),
  };

  const updated = [newApp, ...currentApps];
  saveLocalApplications(updated);

  // Sync to Supabase Database with schema tolerance
  try {
    const appPayload = prepareJobApplicationPayload({
      job_id: jobId,
      applicant_name: candidateProfile.fullName,
      candidate_id: candidateProfile.id,
      job_title: jobTitle,
      company_name: companyName,
      phone: candidateProfile.phone,
      email: candidateProfile.email || '',
      resume_url: attachResume ? (candidateProfile.resumeUrl || '') : '',
      cover_letter: coverLetter || '',
      experience_summary: coverLetter || candidateProfile.careerObjective || '',
      status: 'applied'
    });
    await smartSupabaseInsert('job_applications', appPayload);
  } catch (err) {
    console.warn('Supabase job_applications insert sync warning:', err);
  }

  // Sync to server API
  try {
    await fetch('/api/jobseeker/applications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newApp),
    });
  } catch (e) {}

  return { success: true, application: newApp };
}

/**
 * Update application status (For recruiter/admin demo or state tracking)
 */
export function updateApplicationStatus(appId: string, status: ApplicationStatus, notes?: string): void {
  const apps = getLocalApplications();
  const updated = apps.map(a => {
    if (a.id === appId) {
      return {
        ...a,
        status,
        updatedAt: new Date().toISOString(),
        interviewNote: notes || a.interviewNote,
      };
    }
    return a;
  });
  saveLocalApplications(updated);
}

/**
 * Saved Jobs / Bookmarks
 */
export function getSavedJobIds(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_JOBS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch (e) {}
  return [];
}

export function toggleSaveJob(jobId: string): boolean {
  const saved = getSavedJobIds();
  let updated: string[];
  let isSavedNow = false;

  if (saved.includes(jobId)) {
    updated = saved.filter(id => id !== jobId);
    isSavedNow = false;
  } else {
    updated = [jobId, ...saved];
    isSavedNow = true;
  }

  try {
    localStorage.setItem(STORAGE_KEY_SAVED_JOBS, JSON.stringify(updated));
  } catch (e) {}

  return isSavedNow;
}

/**
 * Call Server CV AI parser
 */
export async function parseCvWithAi(file: File): Promise<{
  success: boolean;
  data?: CvExtractionResult;
  fileUrl?: string;
  error?: string;
}> {
  try {
    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    const resp = await fetch('/api/jobseeker/parse-cv', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileDataUrl: dataUrl,
        fileName: file.name,
        mimeType: file.type || 'application/pdf',
      }),
    });

    const json = await resp.json();
    if (json.success && json.extracted) {
      return {
        success: true,
        data: json.extracted,
        fileUrl: json.fileUrl || dataUrl,
      };
    } else {
      throw new Error(json.message || 'সিভি পার্সিং সম্পন্ন করা যায়নি');
    }
  } catch (err: any) {
    console.warn('[jobSeekerService] Server parse error, trying client heuristic:', err);
    return {
      success: false,
      error: err.message || 'সিভি ফাইলটি বিশ্লেষণ করা যায়নি।',
    };
  }
}
