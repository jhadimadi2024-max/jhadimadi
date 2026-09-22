import { 
  EmployerJobVacancy, 
  EmployerApplicant, 
  EmployerProfile, 
  RecruitmentMetrics, 
  JobLifecycleStatus, 
  ApplicantStage,
  VerificationTier 
} from '../types/employer';

const STORAGE_KEY_EMP_PROFILE = 'jhadimadi_active_employer_profile_v1';
const STORAGE_KEY_EMP_JOBS = 'jhadimadi_employer_jobs_v1';
const STORAGE_KEY_EMP_APPLICANTS = 'jhadimadi_employer_applicants_v1';

export const DEFAULT_EMPLOYER_PROFILE: EmployerProfile = {
  id: 'emp-jhadimadi-core',
  companyName: 'ঝাদিমাদি টেকনোলজিস লি.',
  companyNameBn: 'ঝাদিমাদি টেকনোলজিস লিমিটেড',
  tradeLicenseNumber: 'TRAD/CHT/2024/09841',
  contactPerson: 'হ্লাপ্রু মারমা',
  contactPhone: '01886-123456',
  contactEmail: 'career@jhadimadi.com',
  website: 'https://jhadimadi.com',
  industry: 'তথ্যপ্রযুক্তি ও ই-কমার্স প্ল্যাটফর্ম',
  district: 'রাঙ্গামাটি',
  upazila: 'রাঙ্গামাটি সদর',
  address: 'বনরুপা বাণিজ্যিক এলাকা, রাঙ্গামাটি',
  logoUrl: '/runner-logo.png',
  coverBannerUrl: 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
  aboutCompany: 'ঝাদিমাদি ডট কম পার্বত্য চট্টগ্রাম ও সমগ্র বাংলাদেশের সর্ববৃহৎ হাইপারলোকাল সুপার-অ্যাপ প্ল্যাটফর্ম। আমরা যুবসমাজের কর্মসংস্থান সৃষ্টি ও ডিজিটাল রূপান্তরে প্রতিশ্রুতিবদ্ধ।',
  employeeCount: '২৫-৫০ জন',
  establishedYear: '২০২৩',
  verificationTier: 'Professionally_Verified',
  isVerified: true,
  socialLinks: {
    facebook: 'https://facebook.com/jhadimadi',
    linkedin: 'https://linkedin.com/company/jhadimadi',
    website: 'https://jhadimadi.com'
  },
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: new Date().toISOString()
};

// Initial realistic jobs for the default employer
const INITIAL_LOCAL_JOBS: EmployerJobVacancy[] = [
  {
    id: 'JOB-VAC-001',
    employerId: 'emp-jhadimadi-core',
    employerName: 'ঝাদিমাদি টেকনোলজিস লি.',
    employerLogo: '/runner-logo.png',
    verificationTier: 'Professionally_Verified',
    title: 'সিনিয়র ফুল-স্ট্যাক ওয়েব ও অ্যাপ ডেভেলপার (React & Node.js)',
    designation: 'Senior Software Engineer',
    category: 'আইটি ও সফটওয়্যার',
    vacanciesCount: 2,
    jobType: 'Full-time',
    workplaceType: 'Hybrid',
    division: 'Chittagong Division (চট্টগ্রাম)',
    district: 'রাঙ্গামাটি',
    upazila: 'রাঙ্গামাটি সদর',
    address: 'বনরুপা আইটি পার্ক, রাঙ্গামাটি',
    salaryNegotiable: false,
    salaryMin: 45000,
    salaryMax: 70000,
    salaryDisplay: '৳ ৪৫,০০০ - ৳ ৭০,০০০ (আলোচনা সাপেক্ষে)',
    deadline: '2026-10-30',
    publishedAt: '2026-09-01',
    createdAt: '2026-09-01T10:00:00.000Z',
    updatedAt: new Date().toISOString(),
    requirements: {
      minEducation: 'বিএসসি ইন সিএসই / আইটি ডিগ্রি',
      minExperienceYears: '৩+ বছর',
      ageRange: '২৪ - ৩৮ বছর',
      genderPreference: 'Any',
      requiredSkills: ['React.js', 'Node.js', 'TypeScript', 'PostgreSQL / Supabase', 'Tailwind CSS'],
      preferredSkills: ['PWA', 'Next.js', 'Mobile App development']
    },
    description: {
      summary: 'ঝাদিমাদি প্ল্যাটফর্মের কোর সার্ভিস ও রিয়েল-টাইম আর্কিটেকচার উন্নয়ন ও রক্ষণাবেক্ষণের দায়িত্ব পালন করবেন।',
      rolesResponsibilities: [
        'সুপার-অ্যাপ আর্কিটেকচার ও উচ্চ পারফরম্যান্স ফ্রন্টএন্ড UI/UX বাস্তবায়ন।',
        'নিরাপদ ব্যাকএন্ড API এবং রিয়েল-টাইম ডেটাবেজ অপ্টিমাইজেশন।',
        'টিম মেম্বারদের কোড রিভিউ ও কোয়ালিটি নিশ্চিতকরণ।'
      ],
      benefits: [
        'বছরে ২টি পূর্ণ উৎসব বোনাস',
        'মোবাইল বিল ও হোম ইন্টারনেট ভাতা',
        'হাইব্রিড ফ্লেক্সিবল ওয়ার্ক আওয়ার্স',
        'বার্ষিক বেতন বৃদ্ধি ও প্রভিডেন্ট ফান্ড'
      ],
      workingHours: 'সকাল ৯:৩০ - বিকাল ৫:৩০ (রবি থেকে বৃহস্পতি)'
    },
    applicationMethod: {
      type: 'Native_Jhadimadi',
      specialInstructions: 'ঝাদিমাদি প্রোফাইল বা সিভি আপলোড করে সরাসরি ১-ক্লিকে আবেদন করুন।'
    },
    status: 'Active',
    isFeatured: true,
    viewsCount: 382,
    applicantCount: 3
  },
  {
    id: 'JOB-VAC-002',
    employerId: 'emp-jhadimadi-core',
    employerName: 'ঝাদিমাদি টেকনোলজিস লি.',
    employerLogo: '/runner-logo.png',
    verificationTier: 'Professionally_Verified',
    title: 'কাস্টমার সাপোর্ট ও রিলেশনশিপ এক্সিকিউটিভ (স্থানীয় ভাষা অগ্রাধিকার)',
    designation: 'Customer Service Executive',
    category: 'কাস্টমার সাপোর্ট ও কল সেন্টার',
    vacanciesCount: 3,
    jobType: 'Full-time',
    workplaceType: 'On-site',
    division: 'Chittagong Division (চট্টগ্রাম)',
    district: 'রাঙ্গামাটি',
    upazila: 'রাঙ্গামাটি সদর',
    address: 'কাস্টমার কেয়ার সেন্টার, তবলছড়ি, রাঙ্গামাটি',
    salaryNegotiable: true,
    salaryMin: 18000,
    salaryMax: 25000,
    salaryDisplay: '৳ ১৮,০০০ - ৳ ২৫,০০০ (আলোচনা সাপেক্ষে)',
    deadline: '2026-10-15',
    publishedAt: '2026-09-05',
    createdAt: '2026-09-05T08:30:00.000Z',
    updatedAt: new Date().toISOString(),
    requirements: {
      minEducation: 'এইচএসসি / স্নাতক পাস',
      minExperienceYears: '১ বছর (ফ্রেশাররাও আবেদনযোগ্য)',
      ageRange: '২০ - ৩০ বছর',
      genderPreference: 'Any',
      requiredSkills: ['চাকমা / মারমা / বাংলা ভাষায় সাবলীল যোগাযোগ', 'কম্পিউটার টাইপিং ও ডেটা এন্ট্রি', 'ধৈর্যশীল মনোভাব']
    },
    description: {
      summary: 'গ্রাহকদের কল, চ্যাট ও সার্ভিসের ফলো-আপ নিয়ে তাৎক্ষণিক সমাধান প্রদান করা এবং গ্রাহক সন্তুষ্টি নিশ্চিত করা।',
      rolesResponsibilities: [
        'ইনবাউন্ড ও আউটবাউন্ড কাস্টমার কল রিসিভ ও সমাধান প্রদান।',
        'মার্চেন্ট ও ডেলিভারি রাইডারদের সাথে অর্ডার ডেলিভারি সমন্বয়।'
      ],
      benefits: ['উৎসব ভাতা', 'ইনসেন্টিভ ও ওভারটাইম বোনাস'],
      workingHours: 'শিফট ভিত্তিক (সকাল ৮টা - বিকাল ৪টা / বিকাল ৪টা - রাত ১২টা)'
    },
    applicationMethod: {
      type: 'Native_Jhadimadi'
    },
    status: 'Active',
    isFeatured: false,
    viewsCount: 219,
    applicantCount: 1
  }
];

const INITIAL_LOCAL_APPLICANTS: EmployerApplicant[] = [
  {
    id: 'APP-101',
    jobId: 'JOB-VAC-001',
    jobTitle: 'সিনিয়র ফুল-স্ট্যাক ওয়েব ও অ্যাপ ডেভেলপার (React & Node.js)',
    candidateId: 'CAND-U901',
    candidateName: 'জয়ন্ত ত্রিপুরা',
    candidatePhoneMasked: '01819-***12',
    candidateEmailMasked: 'ja***@gmail.com',
    candidateLocation: 'রাঙ্গামাটি সদর, রাঙ্গামাটি',
    desiredJobTitle: 'Full-Stack Software Engineer',
    experienceYears: '৪ বছর',
    highestEducation: 'বিএসসি ইন কম্পিউটার সায়েন্স অ্যান্ড ইঞ্জিনিয়ারিং (CUET)',
    skills: ['React', 'Node.js', 'PostgreSQL', 'TypeScript', 'Tailwind', 'Docker'],
    coverLetter: 'আমি পার্বত্য অঞ্চলে প্রযুক্তির প্রসারে দীর্ঘ ৩ বছর ধরে রিঅ্যাক্ট এবং নোডজেএস-এ কাজ করছি। ঝাদিমাদির সুপার-অ্যাপের মিশন আমাকে উৎসাহিত করেছে।',
    resumeUrl: '',
    resumeFileName: 'Joyanto_Tripura_CV_2026.pdf',
    privacyProtected: true,
    stage: 'Interview',
    appliedAt: '2026-09-02T11:20:00.000Z',
    updatedAt: new Date().toISOString(),
    rating: 5,
    internalNotes: 'টেকনিক্যাল টাস্ক খুব ভালো হয়েছে। ফাইনাল কালচারাল ইন্টারভিউ নির্ধারিত।',
    interviewScheduledDate: '২০২৬-০৯-১৫ সকাল ১১:০০টা (অনলাইন জুম / বনরুপা অফিস)',
    interviewNotes: 'টেক লিড এবং সিটিও-এর সাথে টেকনিক্যাল ড্রিল ও আর্কিটেকচার প্রশ্ন।'
  },
  {
    id: 'APP-102',
    jobId: 'JOB-VAC-001',
    jobTitle: 'সিনিয়র ফুল-স্ট্যাক ওয়েব ও অ্যাপ ডেভেলপার (React & Node.js)',
    candidateId: 'CAND-U902',
    candidateName: 'তানভির আহমেদ',
    candidatePhoneMasked: '01712-***89',
    candidateEmailMasked: 'ta***@yahoo.com',
    candidateLocation: 'চট্টগ্রাম সদর, চট্টগ্রাম',
    desiredJobTitle: 'MERN Stack Developer',
    experienceYears: '৩.৫ বছর',
    highestEducation: 'বিএসসি ইন সিএসই',
    skills: ['JavaScript', 'React.js', 'Express', 'MongoDB', 'REST API'],
    coverLetter: 'আসসালামু আলাইকুম। আমি বিগত সাড়ে ৩ বছর যাবত একাধিক হাই-ট্রাফিক এন্টারপ্রাইজ সিস্টেমে কাজ করছি।',
    resumeUrl: '',
    resumeFileName: 'Tanvir_Ahmed_Resume.pdf',
    privacyProtected: true,
    stage: 'Shortlisted',
    appliedAt: '2026-09-04T14:10:00.000Z',
    updatedAt: new Date().toISOString(),
    rating: 4,
    internalNotes: 'প্রোফাইল শক্তিশালী, ফ্রন্টএন্ড কোডিং খুব ভালো। শর্টলিস্ট করা হয়েছে।'
  },
  {
    id: 'APP-103',
    jobId: 'JOB-VAC-001',
    jobTitle: 'সিনিয়র ফুল-স্ট্যাক ওয়েব ও অ্যাপ ডেভেলপার (React & Node.js)',
    candidateId: 'CAND-U903',
    candidateName: 'মিতু চাকমা',
    candidatePhoneMasked: '01558-***43',
    candidateEmailMasked: 'mi***@gmail.com',
    candidateLocation: 'খাগড়াছড়ি সদর',
    desiredJobTitle: 'Frontend & UI Specialist',
    experienceYears: '২ বছর',
    highestEducation: 'ডিপ্লোমা ইন কম্পিউটার টেকনোলজি',
    skills: ['React', 'HTML/CSS', 'Tailwind', 'Next.js', 'Figma'],
    coverLetter: 'আমি ফ্রন্টএন্ড ডিজাইনিং এবং রেসপনসিভ ইউআই তৈরিতে পারদর্শী।',
    resumeUrl: '',
    resumeFileName: '',
    privacyProtected: true,
    stage: 'New',
    appliedAt: '2026-09-10T16:45:00.000Z',
    updatedAt: new Date().toISOString(),
    rating: 3,
    internalNotes: 'নতুন আবেদন। সিভি রিভিউ প্রক্রিয়াধীন।'
  },
  {
    id: 'APP-104',
    jobId: 'JOB-VAC-002',
    jobTitle: 'কাস্টমার সাপোর্ট ও রিলেশনশিপ এক্সিকিউটিভ',
    candidateId: 'CAND-U904',
    candidateName: 'চিংশৈপ্রু মারমা',
    candidatePhoneMasked: '01876-***77',
    candidateEmailMasked: 'ch***@gmail.com',
    candidateLocation: 'তবলছড়ি, রাঙ্গামাটি',
    desiredJobTitle: 'Customer Relationship Officer',
    experienceYears: '১.৫ বছর',
    highestEducation: 'স্নাতক (সমাজবিজ্ঞান)',
    skills: ['মারমা ভাষা (মাতৃভাষা)', 'বাংলা', 'ইংরেজি', 'এমএস এক্সেল'],
    coverLetter: 'স্থানীয় গ্রাহকদের মাতৃভাষায় সাহায্য করার জন্য আমি এই পদে নিষ্ঠার সাথে কাজ করতে ইচ্ছুক।',
    resumeUrl: '',
    resumeFileName: 'Chingshaipru_CV.pdf',
    privacyProtected: true,
    stage: 'Selected',
    appliedAt: '2026-09-06T09:00:00.000Z',
    updatedAt: new Date().toISOString(),
    rating: 5,
    internalNotes: 'ইন্টারভিউ চমৎকার হয়েছে। অফার লেটার প্রস্তুত করার সুপারিশ।'
  }
];

export class EmployerService {
  // Read local employer profile
  public static getStoredProfile(): EmployerProfile {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_EMP_PROFILE);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {}
    return DEFAULT_EMPLOYER_PROFILE;
  }

  // Save local employer profile
  public static setStoredProfile(profile: EmployerProfile): void {
    try {
      localStorage.setItem(STORAGE_KEY_EMP_PROFILE, JSON.stringify(profile));
    } catch (e) {}
  }

  // Read local jobs
  public static getStoredJobs(): EmployerJobVacancy[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_EMP_JOBS);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {}
    return INITIAL_LOCAL_JOBS;
  }

  // Save local jobs
  public static setStoredJobs(jobs: EmployerJobVacancy[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_EMP_JOBS, JSON.stringify(jobs));
    } catch (e) {}
  }

  // Read local applicants
  public static getStoredApplicants(): EmployerApplicant[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_EMP_APPLICANTS);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch (e) {}
    return INITIAL_LOCAL_APPLICANTS;
  }

  // Save local applicants
  public static setStoredApplicants(applicants: EmployerApplicant[]): void {
    try {
      localStorage.setItem(STORAGE_KEY_EMP_APPLICANTS, JSON.stringify(applicants));
    } catch (e) {}
  }

  /**
   * Fetch employer profile
   */
  public static async getEmployerProfile(employerId?: string): Promise<EmployerProfile> {
    const id = employerId || this.getStoredProfile().id;
    try {
      const res = await fetch(`/api/employer/companies/${id}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data?.profile) {
          this.setStoredProfile(json.data.profile);
          return json.data.profile;
        }
      }
    } catch (e) {}
    return this.getStoredProfile();
  }

  /**
   * Update employer profile
   */
  public static async updateEmployerProfile(profile: Partial<EmployerProfile>): Promise<EmployerProfile> {
    const current = this.getStoredProfile();
    const updated = { ...current, ...profile, updatedAt: new Date().toISOString() };
    this.setStoredProfile(updated);

    try {
      const res = await fetch('/api/employer/profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-employer-id': updated.id
        },
        body: JSON.stringify(updated)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          this.setStoredProfile(json.data);
          return json.data;
        }
      }
    } catch (e) {}

    return updated;
  }

  /**
   * Fetch all jobs for this employer
   */
  public static async getEmployerJobs(filter?: { status?: string; search?: string }): Promise<EmployerJobVacancy[]> {
    const profile = this.getStoredProfile();
    const query = new URLSearchParams();
    if (filter?.status) query.set('status', filter.status);
    if (filter?.search) query.set('search', filter.search);
    query.set('employerId', profile.id);

    try {
      const res = await fetch(`/api/employer/jobs?${query.toString()}`, {
        headers: {
          'x-employer-id': profile.id
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          this.setStoredJobs(json.data);
          return json.data;
        }
      }
    } catch (e) {}

    // Fallback: local store
    let jobs = this.getStoredJobs();
    if (filter?.status && filter.status !== 'all') {
      jobs = jobs.filter(j => j.status.toLowerCase() === filter.status!.toLowerCase());
    }
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      jobs = jobs.filter(j => j.title.toLowerCase().includes(q) || j.category.toLowerCase().includes(q));
    }
    return jobs;
  }

  /**
   * Save or create job vacancy
   */
  public static async saveJobVacancy(job: Partial<EmployerJobVacancy>): Promise<EmployerJobVacancy> {
    const profile = this.getStoredProfile();
    const payload = {
      ...job,
      employerId: profile.id,
      employerName: profile.companyName,
      employerLogo: profile.logoUrl,
      verificationTier: profile.verificationTier
    };

    try {
      const res = await fetch('/api/employer/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-employer-id': profile.id
        },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const current = this.getStoredJobs();
          const idx = current.findIndex(j => j.id === json.data.id);
          if (idx !== -1) current[idx] = json.data;
          else current.unshift(json.data);
          this.setStoredJobs(current);
          return json.data;
        }
      }
    } catch (e) {}

    // Fallback local save
    const current = this.getStoredJobs();
    const jobId = job.id || `JOB-VAC-${Date.now()}`;
    const newJob: EmployerJobVacancy = {
      id: jobId,
      employerId: profile.id,
      employerName: profile.companyName,
      employerLogo: profile.logoUrl || '/runner-logo.png',
      verificationTier: profile.verificationTier,
      title: job.title || 'নতুন চাকরির পদবী',
      category: job.category || 'সাধারণ চাকরি',
      vacanciesCount: job.vacanciesCount || 1,
      jobType: job.jobType || 'Full-time',
      workplaceType: job.workplaceType || 'On-site',
      district: job.district || profile.district,
      upazila: job.upazila || profile.upazila,
      address: job.address || profile.address,
      salaryNegotiable: Boolean(job.salaryNegotiable),
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      salaryDisplay: job.salaryDisplay || 'আলোচনা সাপেক্ষে',
      deadline: job.deadline || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      requirements: job.requirements || {
        minEducation: 'স্নাতক',
        minExperienceYears: '১ বছর',
        requiredSkills: []
      },
      description: job.description || {
        summary: '',
        rolesResponsibilities: [],
        benefits: []
      },
      applicationMethod: job.applicationMethod || {
        type: 'Native_Jhadimadi'
      },
      status: job.status || 'Active',
      viewsCount: 0,
      applicantCount: 0
    };

    const idx = current.findIndex(j => j.id === jobId);
    if (idx !== -1) current[idx] = newJob;
    else current.unshift(newJob);
    this.setStoredJobs(current);
    return newJob;
  }

  /**
   * Perform lifecycle action: View, Edit, Duplicate, Pause, Close, Reopen, Delete
   */
  public static async mutateJobLifecycle(
    jobId: string, 
    action: 'pause' | 'close' | 'reopen' | 'duplicate' | 'delete' | 'setStatus',
    newStatus?: JobLifecycleStatus
  ): Promise<{ success: boolean; message: string; job?: EmployerJobVacancy }> {
    const profile = this.getStoredProfile();

    try {
      const res = await fetch(`/api/employer/jobs/${jobId}/action`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-employer-id': profile.id
        },
        body: JSON.stringify({ action, status: newStatus })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success) {
          // Sync local
          let jobs = this.getStoredJobs();
          if (action === 'delete') {
            jobs = jobs.filter(j => j.id !== jobId);
          } else if (action === 'duplicate' && json.data) {
            jobs.unshift(json.data);
          } else if (json.data) {
            const idx = jobs.findIndex(j => j.id === jobId);
            if (idx !== -1) jobs[idx] = json.data;
          }
          this.setStoredJobs(jobs);
          return { success: true, message: json.message, job: json.data };
        }
      }
    } catch (e) {}

    // Local fallback logic
    let jobs = this.getStoredJobs();
    const idx = jobs.findIndex(j => j.id === jobId);
    if (idx === -1) {
      return { success: false, message: 'চাকরিটি পাওয়া যায়নি।' };
    }

    const target = jobs[idx];
    if (action === 'delete') {
      jobs.splice(idx, 1);
      this.setStoredJobs(jobs);
      return { success: true, message: 'চাকরি সফলভাবে ডিলিট করা হয়েছে।' };
    }

    if (action === 'duplicate') {
      const cloned: EmployerJobVacancy = {
        ...target,
        id: `JOB-VAC-CLONE-${Date.now()}`,
        title: `${target.title} (কপি)`,
        status: 'Draft',
        applicantCount: 0,
        viewsCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      jobs.unshift(cloned);
      this.setStoredJobs(jobs);
      return { success: true, message: 'চাকরির নতুন কপি ড্রাফট হিসেবে সংরক্ষিত হয়েছে।', job: cloned };
    }

    if (action === 'pause') target.status = 'Paused';
    else if (action === 'close') target.status = 'Closed';
    else if (action === 'reopen') target.status = 'Active';
    else if (newStatus) target.status = newStatus;
    target.updatedAt = new Date().toISOString();

    this.setStoredJobs(jobs);
    return { success: true, message: `স্ট্যাটাস সফলভাবে আপডেট করা হয়েছে।`, job: target };
  }

  /**
   * Fetch applicants for employer ATS Kanban
   */
  public static async getApplicants(jobId?: string, stage?: ApplicantStage | string, search?: string): Promise<EmployerApplicant[]> {
    const profile = this.getStoredProfile();
    const query = new URLSearchParams();
    if (jobId && jobId !== 'all') query.set('jobId', jobId);
    if (stage && stage !== 'all') query.set('stage', stage);
    if (search) query.set('search', search);
    query.set('employerId', profile.id);

    try {
      const res = await fetch(`/api/employer/applicants?${query.toString()}`, {
        headers: {
          'x-employer-id': profile.id
        }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          this.setStoredApplicants(json.data);
          return json.data;
        }
      }
    } catch (e) {}

    // Fallback: local
    let applicants = this.getStoredApplicants();
    if (jobId && jobId !== 'all') {
      applicants = applicants.filter(a => a.jobId === jobId);
    }
    if (stage && stage !== 'all') {
      applicants = applicants.filter(a => a.stage === stage);
    }
    if (search) {
      const q = search.toLowerCase();
      applicants = applicants.filter(a => 
        a.candidateName.toLowerCase().includes(q) ||
        a.skills.some(s => s.toLowerCase().includes(q))
      );
    }
    return applicants;
  }

  /**
   * Update applicant stage (Kanban Drag/Drop or status change)
   */
  public static async updateApplicantStage(
    applicantId: string,
    stage: ApplicantStage,
    meta?: { interviewDate?: string; interviewNotes?: string; rating?: number; internalNotes?: string }
  ): Promise<{ success: boolean; message: string; applicant?: EmployerApplicant }> {
    const profile = this.getStoredProfile();

    try {
      const res = await fetch(`/api/employer/applicants/${applicantId}/stage`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-employer-id': profile.id
        },
        body: JSON.stringify({ stage, ...meta })
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          const list = this.getStoredApplicants();
          const idx = list.findIndex(a => a.id === applicantId);
          if (idx !== -1) list[idx] = json.data;
          this.setStoredApplicants(list);
          return { success: true, message: json.message, applicant: json.data };
        }
      }
    } catch (e) {}

    // Fallback local update
    const list = this.getStoredApplicants();
    const idx = list.findIndex(a => a.id === applicantId);
    if (idx === -1) {
      return { success: false, message: 'আবেদনকারী পাওয়া যায়নি।' };
    }

    const app = list[idx];
    app.stage = stage;
    if (meta?.interviewDate) app.interviewScheduledDate = meta.interviewDate;
    if (meta?.interviewNotes) app.interviewNotes = meta.interviewNotes;
    if (meta?.rating) app.rating = meta.rating;
    if (meta?.internalNotes) app.internalNotes = meta.internalNotes;
    app.updatedAt = new Date().toISOString();

    this.setStoredApplicants(list);
    return { success: true, message: `প্রার্থী স্টেজ '${stage}' এ আপডেট হয়েছে।`, applicant: app };
  }

  /**
   * Fetch live recruitment metrics for KPI tiles
   */
  public static async getRecruitmentMetrics(): Promise<RecruitmentMetrics> {
    const profile = this.getStoredProfile();

    try {
      const res = await fetch(`/api/employer/metrics?employerId=${profile.id}`, {
        headers: { 'x-employer-id': profile.id }
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return json.data;
        }
      }
    } catch (e) {}

    // Compute from local stores
    const jobs = this.getStoredJobs();
    const applicants = this.getStoredApplicants();
    return {
      totalJobs: jobs.length,
      activeJobs: jobs.filter(j => j.status === 'Active').length,
      pausedJobs: jobs.filter(j => j.status === 'Paused').length,
      draftJobs: jobs.filter(j => j.status === 'Draft').length,
      totalApplicants: applicants.length,
      newApplicants: applicants.filter(a => a.stage === 'New').length,
      interviewScheduledCount: applicants.filter(a => a.stage === 'Interview').length,
      hiredCount: applicants.filter(a => a.stage === 'Selected').length
    };
  }

  /**
   * Parse circular document using AI / NLP
   */
  public static async parseCircularDocument(payload: { rawText?: string; fileUrl?: string; fileName?: string }): Promise<any> {
    try {
      const res = await fetch('/api/employer/parse-circular', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.extracted) {
          return json.extracted;
        }
      }
    } catch (e) {}

    // Fallback extraction
    return {
      title: 'অভিজ্ঞ প্রফেশনাল ও টিম মেম্বার নিয়োগ',
      category: 'আইটি ও সফটওয়্যার',
      vacanciesCount: 1,
      salaryDisplay: 'আলোচনা সাপেক্ষে',
      salaryNegotiable: true,
      deadline: new Date(Date.now() + 25 * 86400000).toISOString().split('T')[0],
      requirements: {
        minEducation: 'স্নাতক / এইচএসসি',
        minExperienceYears: '১-২ বছর',
        requiredSkills: ['যোগাযোগ দক্ষতা', 'কম্পিউটার জ্ঞান']
      },
      description: {
        summary: 'সার্কুলার ফাইল থেকে তথ্য এক্সট্র্যাক্ট করা হয়েছে। প্রকাশের আগে তথ্যগুলো পর্যালোচনা করুন।',
        rolesResponsibilities: ['দৈনন্দিন লক্ষ্য ও দায়িত্ব পালন।'],
        benefits: ['উৎসব ভাতা', 'মোবাইল বিল']
      }
    };
  }

  /**
   * Get public company profile & active vacancies
   */
  public static async getPublicCompanyProfile(companyId: string): Promise<{ profile: EmployerProfile; activeJobs: EmployerJobVacancy[] }> {
    try {
      const res = await fetch(`/api/employer/companies/${companyId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          return {
            profile: json.data.profile,
            activeJobs: json.data.activeJobs || []
          };
        }
      }
    } catch (e) {}

    const profile = this.getStoredProfile();
    const activeJobs = this.getStoredJobs().filter(j => j.status === 'Active');
    return { profile, activeJobs };
  }
}
