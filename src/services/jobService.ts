import { supabase } from '../supabase';
import { JobPosting, JobCandidate, JobType } from '../types';
import { uploadFileToSupabaseStorage } from '../utils/directSupabaseStorage';
import { smartSupabaseInsert, smartSupabaseUpload } from '../utils/supabaseDataService';

export const JOB_CATEGORIES = [
  { id: 'it_software', nameBn: 'আইটি ও সফটওয়্যার', nameEn: 'IT & Software' },
  { id: 'accounting_finance', nameBn: 'হিসাব ও ফাইন্যান্স', nameEn: 'Accounts & Finance' },
  { id: 'sales_marketing', nameBn: 'মার্কেটিং ও সেলস', nameEn: 'Sales & Marketing' },
  { id: 'education_teaching', nameBn: 'শিক্ষকতা ও শিক্ষা', nameEn: 'Education & Teaching' },
  { id: 'engineering_technical', nameBn: 'ইঞ্জিনিয়ারিং ও টেকনিক্যাল', nameEn: 'Engineering & Technical' },
  { id: 'healthcare_medical', nameBn: 'স্বাস্থ্য ও চিকিৎসা', nameEn: 'Healthcare & Medical' },
  { id: 'driver_transport', nameBn: 'ড্রাইভার ও পরিবহন', nameEn: 'Driver & Transport' },
  { id: 'hotel_restaurant', nameBn: 'হোটেল ও রেস্তোরাঁ', nameEn: 'Hotel & Restaurant' },
  { id: 'office_admin', nameBn: 'অফিস অ্যাডমিন ও সহকারী', nameEn: 'Office Admin & Assistant' },
  { id: 'ngo_development', nameBn: 'এনজিও ও সামাজিক উন্নয়ন', nameEn: 'NGO & Development' },
  { id: 'electrician_technician', nameBn: 'ইলেকট্রিশিয়ান ও মেকানিক', nameEn: 'Electrician & Mechanic' },
  { id: 'delivery_logistics', nameBn: 'ডেলিভারি ও লজিস্টিকস', nameEn: 'Delivery & Logistics' },
  { id: 'customer_support', nameBn: 'কাস্টমার সাপোর্ট ও কল সেন্টার', nameEn: 'Customer Support' },
  { id: 'general_trades', nameBn: 'অন্যান্য সাধারণ কাজ', nameEn: 'General & Others' },
];

export const JOB_TYPES: { id: JobType; nameBn: string; nameEn: string }[] = [
  { id: 'Full-time', nameBn: 'ফুল-টাইম (সার্বক্ষণিক)', nameEn: 'Full-time' },
  { id: 'Part-time', nameBn: 'পার্ট-টাইম (খণ্ডকালীন)', nameEn: 'Part-time' },
  { id: 'Contract', nameBn: 'চুক্তিভিত্তিক (প্রজেক্ট)', nameEn: 'Contractual' },
  { id: 'Remote', nameBn: 'রিমোট (হোম অফিস)', nameEn: 'Remote / Online' },
  { id: 'Internship', nameBn: 'ইন্টার্নশিপ (শিক্ষানবিস)', nameEn: 'Internship' },
];

// No fake dummy jobs or static placeholders: Only real, user/employer created jobs
const INITIAL_JOB_POSTINGS: JobPosting[] = [];
const INITIAL_CANDIDATES: JobCandidate[] = [];

const DUMMY_JOB_IDS = new Set(['job-001', 'job-002', 'job-003', 'job-004', 'job-005', 'job-006']);
const DUMMY_CAND_IDS = new Set(['cand-001', 'cand-002']);

export function isDummyJob(job: any): boolean {
  if (!job) return true;
  if (DUMMY_JOB_IDS.has(job.id)) return true;
  const t = (job.title || '').toLowerCase();
  if (
    t.includes('অ্যাকাউন্টস এক্সিকিউটিভ') ||
    t.includes('ফ্রন্টএন্ড রিঅ্যাক্ট') ||
    t.includes('মার্চেন্ডাইজার') ||
    t.includes('ভেহিক্যাল ড্রাইভার') ||
    t.includes('হসপিটালিটি ও ফ্রন্ট') ||
    t.includes('সোলার টেকনিশিয়ান') ||
    t.includes('placeholder') ||
    t.includes('demo job')
  ) {
    return true;
  }
  return false;
}

export function isDummyCandidate(cand: any): boolean {
  if (!cand) return true;
  if (DUMMY_CAND_IDS.has(cand.id)) return true;
  return false;
}

const STORAGE_KEY_JOBS = 'jhadimadi_job_postings_v2';
const STORAGE_KEY_CANDIDATES = 'jhadimadi_job_candidates_v2';

// Local storage cache helpers
export function getLocalJobPostings(): JobPosting[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_JOBS);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(j => !isDummyJob(j));
      }
    }
  } catch (e) {
    console.warn('[JobService] Error reading local jobs:', e);
  }
  return [];
}

export function setLocalJobPostings(jobs: JobPosting[]): void {
  try {
    const clean = jobs.filter(j => !isDummyJob(j));
    localStorage.setItem(STORAGE_KEY_JOBS, JSON.stringify(clean));
  } catch (e) {
    console.warn('[JobService] Error saving local jobs:', e);
  }
}

export function getLocalJobCandidates(): JobCandidate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_CANDIDATES);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) {
        return parsed.filter(c => !isDummyCandidate(c));
      }
    }
  } catch (e) {
    console.warn('[JobService] Error reading local candidates:', e);
  }
  return [];
}

export function setLocalJobCandidates(candidates: JobCandidate[]): void {
  try {
    const clean = candidates.filter(c => !isDummyCandidate(c));
    localStorage.setItem(STORAGE_KEY_CANDIDATES, JSON.stringify(clean));
  } catch (e) {
    console.warn('[JobService] Error saving local candidates:', e);
  }
}

/**
 * Upload a document (PDF, Word, or image) for Circulars or CVs
 */
export async function uploadJobDocument(
  file: File,
  category: 'circular' | 'resume' = 'circular'
): Promise<{ success: boolean; url: string; fileName: string; fileType: string; sizeBytes: number; error?: string }> {
  const fileType = file.type || (file.name.toLowerCase().endsWith('.pdf') 
    ? 'application/pdf' 
    : file.name.toLowerCase().endsWith('.docx') 
      ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      : 'application/msword');

  try {
    const bucket = 'products';
    const folder = category === 'resume' ? 'resumes' : 'circulars';
    const cleanFileName = `${category}_${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`;

    // 1. Direct Supabase Cloud Storage upload
    try {
      const publicUrl = await uploadFileToSupabaseStorage(bucket, file, cleanFileName, folder);
      if (publicUrl) {
        return {
          success: true,
          url: publicUrl,
          fileName: file.name,
          fileType,
          sizeBytes: file.size
        };
      }
    } catch (storageErr) {
      console.warn('[jobService] Direct Supabase storage upload failed, trying server API fallback:', storageErr);
    }

    // 2. Server route fallback
    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

    try {
      const resp = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          data: dataUrl,
          name: cleanFileName,
          contentType: fileType,
          bucket: bucket
        })
      });
      if (resp.ok) {
        const json = await resp.json();
        if (json.success && json.url) {
          return {
            success: true,
            url: json.url,
            fileName: file.name,
            fileType,
            sizeBytes: file.size
          };
        }
      }
    } catch (e) {
      // server route offline
    }

    return {
      success: true,
      url: dataUrl,
      fileName: file.name,
      fileType,
      sizeBytes: file.size
    };
  } catch (err: any) {
    return {
      success: false,
      url: '',
      fileName: file.name,
      fileType: file.type,
      sizeBytes: file.size,
      error: err.message || 'ফাইল প্রসেসিং ব্যর্থ হয়েছে'
    };
  }
}

/**
 * Fetch active job postings with optional filters
 */
export async function fetchJobListings(filter?: {
  search?: string;
  district?: string;
  upazila?: string;
  category?: string;
  jobType?: string;
  company?: string;
}): Promise<JobPosting[]> {
  let allJobs: JobPosting[] = [];

  // 1. Try server API route first (which is backed by Supabase storage catalog & store)
  try {
    const resp = await fetch('/api/jobs');
    if (resp.ok) {
      const json = await resp.json();
      if (json.success && Array.isArray(json.data)) {
        allJobs = json.data;
      }
    }
  } catch (e) {
    // server API fallback
  }

  // 2. Try Supabase cloud table if server returned no jobs
  if (allJobs.length === 0) {
    try {
      // 2a. Query enhanced 'jobs' table
      const { data: jobsData, error: jobsErr } = await supabase
        .from('jobs')
        .select('*')
        .order('created_at', { ascending: false });

      if (!jobsErr && jobsData && jobsData.length > 0) {
        const fromJobs: JobPosting[] = jobsData.map((row: any) => ({
          id: row.id,
          title: row.title,
          designation: row.title || '',
          companyName: row.company_name || '',
          category: 'general_trades',
          jobType: (row.job_type || 'Full-time') as JobType,
          salary: row.salary_range || '',
          division: '',
          district: 'খাগড়াছড়ি',
          upazila: 'সদর',
          address: row.location || '',
          vacanciesCount: Number(row.vacancy) || 1,
          education: '',
          experience: '',
          description: row.description || '',
          requirements: Array.isArray(row.requirements) ? row.requirements : (row.requirements ? String(row.requirements).split('\n').filter(Boolean) : []),
          skills: [],
          deadline: row.deadline || '',
          contactPhone: '',
          contactEmail: '',
          applyInstructions: 'অনলাইনে বা সরাসরি আবেদন করুন',
          employerId: '',
          employerName: row.company_name || '',
          status: (row.status || 'active') as any,
          submissionType: 'form',
          circularUrl: '',
          circularFileName: '',
          circularFileType: '',
          createdAt: row.created_at || new Date().toISOString(),
        }));
        allJobs.push(...fromJobs);
      }

      // 2b. Query existing 'job_postings' table
      const { data, error } = await supabase
        .from('job_postings')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        const existingIds = new Set(allJobs.map(j => j.id));
        const mapped = data
          .filter((row: any) => !existingIds.has(row.id))
          .map((row: any) => ({
            id: row.id,
            title: row.title,
            designation: row.designation || row.title || '',
            companyName: row.company_name || row.companyName || '',
            category: row.category,
            jobType: row.job_type || row.jobType || 'Full-time',
            salary: row.salary || '',
            division: row.division || '',
            district: row.district || '',
            upazila: row.upazila || '',
            address: row.address || '',
            vacanciesCount: row.vacancies_count || row.vacanciesCount || 1,
            education: row.education || '',
            experience: row.experience || '',
            description: row.description || '',
            requirements: Array.isArray(row.requirements) ? row.requirements : [],
            skills: Array.isArray(row.skills) ? row.skills : [],
            deadline: row.deadline || '',
            contactPhone: row.contact_phone || row.contactPhone || '',
            contactEmail: row.contact_email || row.contactEmail || '',
            applyInstructions: row.apply_instructions || row.applyInstructions || '',
            employerId: row.employer_id || row.employerId || '',
            employerName: row.employer_name || row.employerName || '',
            status: row.status || 'active',
            submissionType: row.submission_type || row.submissionType || 'detailed',
            circularUrl: row.circular_url || row.circularUrl || '',
            circularFileName: row.circular_file_name || row.circularFileName || '',
            circularFileType: row.circular_file_type || row.circularFileType || '',
            createdAt: row.created_at || row.createdAt || new Date().toISOString(),
          }));
        allJobs.push(...mapped);
      }
    } catch (err) {
      console.warn('[JobService] Supabase jobs fetch note:', err);
    }
  }

  // 3. Merge with local storage cache
  const local = getLocalJobPostings();
  const existingIds = new Set(allJobs.map(j => j.id));
  for (const lj of local) {
    if (!existingIds.has(lj.id) && !isDummyJob(lj)) {
      allJobs.push(lj);
    }
  }

  // Filter out any dummy jobs completely
  allJobs = allJobs.filter(j => !isDummyJob(j));

  // Keep local storage synchronized
  setLocalJobPostings(allJobs);

  // Apply filters
  let filtered = [...allJobs];

  if (filter?.search && filter.search.trim()) {
    const q = filter.search.toLowerCase().trim();
    filtered = filtered.filter(j => 
      (j.title && j.title.toLowerCase().includes(q)) ||
      (j.designation && j.designation.toLowerCase().includes(q)) ||
      (j.companyName && j.companyName.toLowerCase().includes(q)) ||
      (j.description && j.description.toLowerCase().includes(q)) ||
      (j.category && j.category.toLowerCase().includes(q)) ||
      (j.district && j.district.toLowerCase().includes(q)) ||
      (j.upazila && j.upazila.toLowerCase().includes(q)) ||
      (j.skills && j.skills.some(s => s.toLowerCase().includes(q)))
    );
  }

  if (filter?.company && filter.company.trim()) {
    const c = filter.company.toLowerCase().trim();
    filtered = filtered.filter(j => j.companyName && j.companyName.toLowerCase().includes(c));
  }

  if (filter?.district && filter.district !== 'all' && filter.district !== 'সকল জেলা') {
    filtered = filtered.filter(j => j.district === filter.district);
  }

  if (filter?.upazila && filter.upazila !== 'all' && filter.upazila !== 'সকল উপজেলা') {
    filtered = filtered.filter(j => j.upazila === filter.upazila);
  }

  if (filter?.category && filter.category !== 'all' && filter.category !== 'সকল ক্যাটাগরি') {
    filtered = filtered.filter(j => j.category === filter.category);
  }

  if (filter?.jobType && filter.jobType !== 'all') {
    filtered = filtered.filter(j => j.jobType === filter.jobType);
  }

  return filtered;
}

/**
 * Submit a new Job Posting by an Employer
 */
export async function createJobPosting(
  jobData: Omit<JobPosting, 'id' | 'createdAt'>
): Promise<{ success: boolean; data?: JobPosting; error?: string }> {
  const newJob: JobPosting = {
    ...jobData,
    id: 'job_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    createdAt: new Date().toISOString(),
    status: 'active'
  };

  // 1. Immediately save to LocalStorage cache
  try {
    const currentLocal = getLocalJobPostings();
    setLocalJobPostings([newJob, ...currentLocal]);
  } catch (e) {
    console.error('LocalStorage save error', e);
  }

  // 2. Post to Node Server API for multi-client persistence & Supabase storage catalog sync
  try {
    await fetch('/api/jobs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newJob)
    });
  } catch (e) {
    console.warn('[JobService] API post fallback:', e);
  }

  // 3. Also try Supabase table
  try {
    const payload = {
      id: newJob.id,
      title: newJob.title,
      company_name: newJob.companyName,
      category: newJob.category,
      job_type: newJob.jobType,
      salary: newJob.salary,
      division: newJob.division || '',
      district: newJob.district,
      upazila: newJob.upazila,
      address: newJob.address || '',
      vacancies_count: newJob.vacanciesCount || 1,
      education: newJob.education || '',
      experience: newJob.experience || '',
      description: newJob.description,
      requirements: newJob.requirements || [],
      skills: newJob.skills || [],
      deadline: newJob.deadline,
      contact_phone: newJob.contactPhone,
      contact_email: newJob.contactEmail || '',
      apply_instructions: newJob.applyInstructions || '',
      employer_id: newJob.employerId || '',
      employer_name: newJob.employerName || '',
      status: 'active',
      created_at: newJob.createdAt
    };
    await supabase.from('job_postings').insert([payload]);

    // Also persist to job_circulars table
    try {
      const jobTitle = newJob.title;
      const companyName = newJob.companyName;
      const dist = newJob.district;
      const upazilaName = newJob.upazila;
      const phoneNum = newJob.contactPhone;

      await supabase.from('job_circulars').insert([
        {
          job_title: jobTitle,
          company_or_poster: companyName,
          district: dist,
          upazila: upazilaName,
          phone: phoneNum
        }
      ]);
    } catch (e) {
      // silent
    }
    // Also persist to enhanced 'jobs' table
    try {
      await smartSupabaseInsert('jobs', {
        title: newJob.title,
        company_name: newJob.companyName,
        job_type: newJob.jobType,
        vacancy: Number(newJob.vacanciesCount || 1),
        location: newJob.address || `${newJob.upazila}, ${newJob.district}`,
        salary_range: newJob.salary || 'আলোচনা সাপেক্ষে',
        deadline: newJob.deadline ? String(newJob.deadline).split('T')[0] : null,
        description: newJob.description || '',
        requirements: Array.isArray(newJob.requirements) ? newJob.requirements.join('\n') : (newJob.requirements || ''),
        status: 'active'
      });
    } catch (e) {
      // silent
    }
  } catch (err) {
    // silent catch
  }

  return {
    success: true,
    data: newJob,
    error: undefined
  };
}

/**
 * Delete a Job Posting
 */
export async function deleteJobPosting(id: string): Promise<boolean> {
  try {
    const current = getLocalJobPostings().filter(j => j.id !== id);
    setLocalJobPostings(current);

    await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
    await supabase.from('job_postings').delete().eq('id', id);
    await supabase.from('jobs').delete().eq('id', id);
    return true;
  } catch (e) {
    console.warn('[JobService] Delete job warning:', e);
    return true;
  }
}

/**
 * Submit an application for a specific job to the job_applications table
 */
export async function submitJobApplication(params: {
  jobId?: string;
  applicantName: string;
  phone: string;
  email?: string;
  resumeUrl?: string;
  experienceSummary?: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const res = await smartSupabaseInsert('job_applications', {
      job_id: params.jobId || null,
      applicant_name: params.applicantName,
      phone: params.phone,
      email: params.email || '',
      resume_url: params.resumeUrl || '',
      experience_summary: params.experienceSummary || '',
      status: 'applied'
    });
    return res;
  } catch (err: any) {
    return { success: false, error: err?.message || 'চাকরির আবেদন জমা দিতে সমস্যা হয়েছে' };
  }
}

/**
 * Register a Job Candidate / Job Seeker Profile or Submit CV
 */
export async function registerJobCandidate(
  candidateData: Omit<JobCandidate, 'id' | 'candidateCode' | 'createdAt'>
): Promise<{ success: boolean; data?: JobCandidate; error?: string }> {
  const randNum = Math.floor(10000 + Math.random() * 90000);
  const newCandidate: JobCandidate = {
    ...candidateData,
    id: 'cand_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    candidateCode: `JM-CAND-${randNum}`,
    status: 'available',
    createdAt: new Date().toISOString()
  };

  // 1. Immediately save to LocalStorage cache
  try {
    const currentLocal = getLocalJobCandidates();
    setLocalJobCandidates([newCandidate, ...currentLocal]);
  } catch (e) {
    console.error('LocalStorage candidate save error', e);
  }

  // 2. Post to Node Server API
  try {
    await fetch('/api/jobs/candidates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newCandidate)
    });
  } catch (e) {
    console.warn('[JobService] API candidate post fallback:', e);
  }

  // 3. Persist to Supabase table
  try {
    const payload = {
      id: newCandidate.id,
      candidate_code: newCandidate.candidateCode,
      name: newCandidate.name,
      phone: newCandidate.phone,
      email: newCandidate.email || '',
      gender: newCandidate.gender || 'Male',
      desired_job_title: newCandidate.desiredJobTitle,
      category: newCandidate.category,
      expected_salary: newCandidate.expectedSalary,
      experience_years: newCandidate.experienceYears,
      highest_education: newCandidate.highestEducation,
      skills: newCandidate.skills || [],
      division: newCandidate.division || '',
      district: newCandidate.district,
      upazila: newCandidate.upazila,
      address: newCandidate.address || '',
      bio: newCandidate.bio || '',
      resume_url: newCandidate.resumeUrl || '',
      portfolio_url: newCandidate.portfolioUrl || '',
      status: 'available',
      created_at: newCandidate.createdAt
    };
    await supabase.from('job_candidates').insert([payload]);

    // Also persist to job_seekers table
    try {
      const seekerName = newCandidate.name;
      const seekerPhone = newCandidate.phone;
      const highestEdu = newCandidate.highestEducation;
      const expYears = newCandidate.experienceYears;
      const skillList = newCandidate.skills || [];
      const dist = newCandidate.district;
      const upazilaName = newCandidate.upazila;

      await supabase.from('job_seekers').insert([
        {
          full_name: seekerName,
          phone: seekerPhone,
          education: highestEdu,
          experience: expYears,
          skills: skillList,
          district: dist,
          upazila: upazilaName,
          resume_url: newCandidate.resumeUrl || '',
          desired_job_title: newCandidate.desiredJobTitle || '',
          address: newCandidate.address || ''
        }
      ]);
    } catch (e) {
      // silent
    }
  } catch (err) {
    // silent
  }

  return {
    success: true,
    data: newCandidate
  };
}

/**
 * Fetch Registered Candidates
 */
export async function fetchJobCandidates(filter?: {
  search?: string;
  district?: string;
  upazila?: string;
  category?: string;
}): Promise<JobCandidate[]> {
  let list: JobCandidate[] = [];

  // 1. Try server API route
  try {
    const resp = await fetch('/api/jobs/candidates');
    if (resp.ok) {
      const json = await resp.json();
      if (json.success && Array.isArray(json.data) && json.data.length > 0) {
        list = json.data;
      }
    }
  } catch (e) {
    // API route fallback
  }

  // 2. Try Supabase cloud table if server returned no candidates
  if (list.length === 0) {
    try {
      const { data, error } = await supabase
        .from('job_candidates')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        list = data.map((row: any) => ({
          id: row.id,
          candidateCode: row.candidate_code || row.candidateCode || '',
          name: row.name,
          phone: row.phone,
          email: row.email || '',
          gender: row.gender || 'Male',
          desiredJobTitle: row.desired_job_title || row.desiredJobTitle || '',
          category: row.category || '',
          expectedSalary: row.expected_salary || row.expectedSalary || '',
          experienceYears: row.experience_years || row.experienceYears || '',
          highestEducation: row.highest_education || row.highestEducation || '',
          skills: Array.isArray(row.skills) ? row.skills : [],
          division: row.division || '',
          district: row.district || '',
          upazila: row.upazila || '',
          address: row.address || '',
          bio: row.bio || '',
          resumeUrl: row.resume_url || row.resumeUrl || '',
          portfolioUrl: row.portfolio_url || row.portfolioUrl || '',
          status: row.status || 'available',
          createdAt: row.created_at || row.createdAt || new Date().toISOString()
        }));
      }
    } catch (e) {
      console.warn('[JobService] Supabase candidates read note:', e);
    }
  }

  // 3. Merge with local storage candidates
  const localCandidates = getLocalJobCandidates();
  const map = new Map<string, JobCandidate>();
  list.forEach(c => map.set(c.id, c));
  localCandidates.forEach(c => map.set(c.id, c));
  const merged = Array.from(map.values()).sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  // Apply filters
  let filtered = [...merged];
  if (filter?.search && filter.search.trim()) {
    const q = filter.search.toLowerCase().trim();
    filtered = filtered.filter(c => 
      c.name.toLowerCase().includes(q) ||
      (c.candidateCode && c.candidateCode.toLowerCase().includes(q)) ||
      c.desiredJobTitle.toLowerCase().includes(q) ||
      c.category.toLowerCase().includes(q) ||
      c.district.toLowerCase().includes(q) ||
      c.upazila.toLowerCase().includes(q) ||
      c.skills.some(s => s.toLowerCase().includes(q))
    );
  }

  if (filter?.district && filter.district !== 'all' && filter.district !== 'সকল জেলা') {
    filtered = filtered.filter(c => c.district === filter.district);
  }

  if (filter?.upazila && filter.upazila !== 'all' && filter.upazila !== 'সকল উপজেলা') {
    filtered = filtered.filter(c => c.upazila === filter.upazila);
  }

  if (filter?.category && filter.category !== 'all' && filter.category !== 'সকল ক্যাটাগরি') {
    filtered = filtered.filter(c => c.category === filter.category);
  }

  return filtered;
}
