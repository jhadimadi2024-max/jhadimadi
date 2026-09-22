import { z } from 'zod';

export type AccountType = 'freelancer' | 'service_provider' | 'member' | 'professional';

export type SkillProficiency = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert';

export interface EducationItem {
  id: string;
  degree: string;
  institution: string;
  subject: string;
  resultGpa: string;
  passingYear: string;
}

export interface ExperienceItem {
  id: string;
  company: string;
  designation: string;
  startDate: string;
  endDate: string;
  isCurrent: boolean;
  responsibilities: string;
}

export interface SkillItem {
  id: string;
  name: string;
  level: SkillProficiency;
}

export interface CertificationItem {
  id: string;
  title: string;
  issuer: string;
  year: string;
  certificateUrl?: string;
  credentialId?: string;
}

export interface PortfolioProjectItem {
  id: string;
  title: string;
  description: string;
  link?: string;
  imageUrl?: string;
}

export interface AddressData {
  division: string;
  district: string;
  upazila: string;
  unionOrWard?: string;
  villageOrMahalla: string;
  postalCode?: string;
  detailedAddress?: string;
}

export interface RegistrationFormData {
  // Step 1: Basic Info
  accountType: AccountType;
  fullName: string;
  email: string;
  password?: string;
  confirmPassword?: string;
  phone: string;
  categoryBn?: string;
  categoryEn?: string;

  // Step 2: Personal Details
  dateOfBirth: string;
  gender: 'male' | 'female' | 'other' | '';
  nationality: string;
  fatherName?: string;
  motherName?: string;
  maritalStatus?: 'single' | 'married' | 'other' | '';
  bloodGroup?: string;
  bioBn?: string;
  bioEn?: string;

  // Step 3: Address
  permanentAddress: AddressData;
  presentAddressSameAsPermanent: boolean;
  presentAddress: AddressData;

  // Step 4: Education
  educationList: EducationItem[];

  // Step 5: Work Experience
  experienceList: ExperienceItem[];

  // Step 6: Skills & Certifications
  skillsList: SkillItem[];
  certificationsList: CertificationItem[];

  // Step 7: Documents
  nidNumber?: string;
  nidFrontUrl?: string;
  nidBackUrl?: string;
  selfieUrl?: string;
  profilePhotoUrl?: string;
  tradeLicenseUrl?: string;
  cvResumeUrl?: string;

  // Step 8: Portfolio
  portfolioWebsite?: string;
  githubUrl?: string;
  linkedinUrl?: string;
  projectsList: PortfolioProjectItem[];

  // Step 9: Verification
  isPhoneVerified: boolean;
  phoneOtp?: string;
  isNidVerified: boolean;
  agreedToTerms: boolean;
  agreedToCodeOfConduct: boolean;
}

// ==========================================
// ZOD VALIDATION SCHEMAS PER STEP
// ==========================================

export const step1BasicInfoSchema = z.object({
  accountType: z.enum(['freelancer', 'service_provider', 'member', 'professional'], {
    message: 'অ্যাকাউন্টের ধরণ নির্বাচন করুন',
  }),
  fullName: z.string().trim().min(3, 'পুরো নাম কমপক্ষে ৩ অক্ষরের হতে হবে'),
  email: z.string().trim().email('সঠিক ইমেইল এড্রেস লিখুন (যেমন: name@domain.com)'),
  password: z.string().min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'),
  confirmPassword: z.string().min(6, 'পাসওয়ার্ড নিশ্চিত করুন'),
  phone: z.string().trim().regex(/^01[3-9]\d{8}$/, 'সঠিক ১১ সংখ্যার বাংলাদেশি মোবাইল নম্বর লিখুন (যেমন: 018XXXXXXXX)'),
  categoryBn: z.string().optional(),
  categoryEn: z.string().optional(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'পাসওয়ার্ড ও নিশ্চিতকরণ পাসওয়ার্ড মিলছে না',
  path: ['confirmPassword'],
});

export const step2PersonalDetailsSchema = z.object({
  dateOfBirth: z.string().min(4, 'জন্ম তারিখ প্রদান করুন'),
  gender: z.enum(['male', 'female', 'other'], {
    message: 'লিঙ্গ নির্বাচন করুন',
  }),
  nationality: z.string().min(2, 'জাতীয়তা উল্লেখ করুন').default('Bangladeshi'),
  fatherName: z.string().optional(),
  motherName: z.string().optional(),
  maritalStatus: z.enum(['single', 'married', 'other', '']).optional(),
  bloodGroup: z.string().optional(),
  bioBn: z.string().max(600, 'সংক্ষিপ্ত পরিচয় সর্বোচ্চ ৬০০ অক্ষরের হতে পারে').optional(),
  bioEn: z.string().max(600, 'Bio maximum 600 characters').optional(),
});

export const step3AddressSchema = z.object({
  permanentAddress: z.object({
    division: z.string().min(1, 'বিভাগ নির্বাচন করুন'),
    district: z.string().min(1, 'জেলা নির্বাচন করুন'),
    upazila: z.string().min(1, 'উপজেলা বা থানা নির্বাচন করুন'),
    unionOrWard: z.string().optional(),
    villageOrMahalla: z.string().min(2, 'গ্রাম/মহল্লা বা রাস্তার নাম লিখুন'),
    postalCode: z.string().optional(),
    detailedAddress: z.string().optional(),
  }),
  presentAddressSameAsPermanent: z.boolean(),
  presentAddress: z.object({
    division: z.string().optional(),
    district: z.string().optional(),
    upazila: z.string().optional(),
    unionOrWard: z.string().optional(),
    villageOrMahalla: z.string().optional(),
    postalCode: z.string().optional(),
    detailedAddress: z.string().optional(),
  }),
}).refine(data => {
  if (data.presentAddressSameAsPermanent) return true;
  return Boolean(
    data.presentAddress.division &&
    data.presentAddress.district &&
    data.presentAddress.upazila &&
    data.presentAddress.villageOrMahalla
  );
}, {
  message: 'বর্তমান ঠিকানা সম্পূর্ণভাবে পূরণ করুন অথবা স্থায়ী ঠিকানার অনুরূপ টিক দিন',
  path: ['presentAddress', 'villageOrMahalla'],
});

export const step4EducationSchema = z.object({
  educationList: z.array(z.object({
    id: z.string(),
    degree: z.string().min(1, 'ডিগ্রি/পরীক্ষার নাম আবশ্যক'),
    institution: z.string().min(2, 'শিক্ষা প্রতিষ্ঠানের নাম আবশ্যক'),
    subject: z.string().min(1, 'বিভাগ বা বিষয় আবশ্যক'),
    resultGpa: z.string().optional(),
    passingYear: z.string().min(4, 'পাসের সন উল্লেখ করুন'),
  })).min(1, 'কমপক্ষে একটি শিক্ষাগত যোগ্যতা যোগ করুন'),
});

export const step5ExperienceSchema = z.object({
  experienceList: z.array(z.object({
    id: z.string(),
    company: z.string().min(1, 'প্রতিষ্ঠানের নাম আবশ্যক'),
    designation: z.string().min(1, 'পদবী আবশ্যক'),
    startDate: z.string().min(1, 'শুরুর তারিখ দিন'),
    endDate: z.string().optional(),
    isCurrent: z.boolean(),
    responsibilities: z.string().optional(),
  })), // Can be empty for freshers
});

export const step6SkillsCertSchema = z.object({
  skillsList: z.array(z.object({
    id: z.string(),
    name: z.string().min(1, 'দক্ষতার নাম লিখুন'),
    level: z.enum(['Beginner', 'Intermediate', 'Advanced', 'Expert']),
  })).min(1, 'কমপক্ষে একটি প্রধান দক্ষতা যোগ করুন'),
  certificationsList: z.array(z.object({
    id: z.string(),
    title: z.string().min(1, 'সার্টিফিকেটের নাম লিখুন'),
    issuer: z.string().min(1, 'প্রদানকারী প্রতিষ্ঠানের নাম লিখুন'),
    year: z.string().min(4, 'সন লিখুন'),
    certificateUrl: z.string().optional(),
    credentialId: z.string().optional(),
  })).optional().default([]),
});

export const step7DocumentsSchema = z.object({
  nidNumber: z.string().optional(),
  nidFrontUrl: z.string().optional(),
  nidBackUrl: z.string().optional(),
  selfieUrl: z.string().optional(),
  tradeLicenseUrl: z.string().optional(),
  cvResumeUrl: z.string().optional(),
});

export const step8PortfolioSchema = z.object({
  portfolioWebsite: z.string().url('সঠিক ওয়েব লিঙ্ক দিন').optional().or(z.literal('')),
  githubUrl: z.string().url('সঠিক গিটহাব লিঙ্ক দিন').optional().or(z.literal('')),
  linkedinUrl: z.string().url('সঠিক লিঙ্কডইন লিঙ্ক দিন').optional().or(z.literal('')),
  projectsList: z.array(z.object({
    id: z.string(),
    title: z.string().min(1, 'প্রজেক্টের নাম দিন'),
    description: z.string().min(5, 'প্রজেক্টের সংক্ষিপ্ত বিবরণ দিন'),
    link: z.string().optional(),
    imageUrl: z.string().optional(),
  })).optional().default([]),
});

export const step9VerificationSchema = z.object({
  isPhoneVerified: z.boolean().refine(val => val === true, {
    message: 'ফোন নম্বর ওটিপি ভেরিফিকেশন সম্পন্ন করুন',
  }),
  agreedToTerms: z.boolean().refine(val => val === true, {
    message: 'ঝাদিমাদি প্ল্যাটফর্মের নিয়মাবলী ও শর্তাবলীর সাথে সম্মতি আবশ্যক',
  }),
  agreedToCodeOfConduct: z.boolean().refine(val => val === true, {
    message: 'পেশাদারিত্ব ও নৈতিক আচরণ বিধির সাথে সম্মতি আবশ্যক',
  }),
});

export const registrationFullSchema = z.object({
  ...step1BasicInfoSchema.shape,
  ...step2PersonalDetailsSchema.shape,
  ...step3AddressSchema.shape,
  ...step4EducationSchema.shape,
  ...step5ExperienceSchema.shape,
  ...step6SkillsCertSchema.shape,
  ...step7DocumentsSchema.shape,
  ...step8PortfolioSchema.shape,
  ...step9VerificationSchema.shape,
});

export interface StepDefinition {
  id: number;
  slug: string;
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  descriptionEn: string;
  iconName: string;
  isMandatory: boolean;
}

export const REGISTRATION_STEPS: StepDefinition[] = [
  {
    id: 1,
    slug: 'basic_info',
    titleBn: 'প্রাথমিক তথ্য',
    titleEn: 'Basic Information',
    descriptionBn: 'অ্যাকাউন্টের ধরণ, নাম, ইমেইল, পাসওয়ার্ড ও মোবাইল নম্বর',
    descriptionEn: 'Account type, full name, email, secure password and phone',
    iconName: 'User',
    isMandatory: true,
  },
  {
    id: 2,
    slug: 'personal_details',
    titleBn: 'ব্যক্তিগত বিবরণ',
    titleEn: 'Personal Details',
    descriptionBn: 'জন্মতারিখ, লিঙ্গ, জাতীয়তা ও পিতা-মাতার নাম',
    descriptionEn: 'Date of birth, gender, nationality and parents details',
    iconName: 'UserCheck',
    isMandatory: true,
  },
  {
    id: 3,
    slug: 'address',
    titleBn: 'ঠিকানা ও অবস্থান',
    titleEn: 'Address & Location',
    descriptionBn: 'স্থায়ী ও বর্তমান ঠিকানা, বিভাগ, জেলা এবং উপজেলা',
    descriptionEn: 'Permanent and present address with division, district, upazila',
    iconName: 'MapPin',
    isMandatory: true,
  },
  {
    id: 4,
    slug: 'education',
    titleBn: 'শিক্ষাগত যোগ্যতা',
    titleEn: 'Education',
    descriptionBn: 'ডিগ্রি, শিক্ষা প্রতিষ্ঠান, বিষয় ও পাসের সন',
    descriptionEn: 'Degree, institution, subject and passing year',
    iconName: 'GraduationCap',
    isMandatory: true,
  },
  {
    id: 5,
    slug: 'experience',
    titleBn: 'কাজের অভিজ্ঞতা',
    titleEn: 'Work Experience',
    descriptionBn: 'প্রতিষ্ঠানের নাম, পদবী ও কাজের সময়কাল',
    descriptionEn: 'Company name, designation and employment timeline',
    iconName: 'Briefcase',
    isMandatory: false,
  },
  {
    id: 6,
    slug: 'skills_cert',
    titleBn: 'দক্ষতা ও সনদপত্র',
    titleEn: 'Skills & Certification',
    descriptionBn: 'দক্ষতাসমূহ, অভিজ্ঞতা মাত্রা ও অর্জিত সার্টিফিকেট',
    descriptionEn: 'Core skills with proficiency and certificates',
    iconName: 'Award',
    isMandatory: true,
  },
  {
    id: 7,
    slug: 'documents',
    titleBn: 'কাগজপত্র ও পরিচয়',
    titleEn: 'Documents & Identity',
    descriptionBn: 'জাতীয় পরিচয়পত্র (NID) / পাসপোর্ট ও ছবি আপলোড',
    descriptionEn: 'NID card, passport or trade license document proofs',
    iconName: 'FileCheck',
    isMandatory: false,
  },
  {
    id: 8,
    slug: 'portfolio',
    titleBn: 'পোর্টফোলিও ও প্রজেক্ট',
    titleEn: 'Portfolio & Projects',
    descriptionBn: 'পূর্ব কাজের লিংক, স্যাম্পল ও সোশ্যাল প্রোফাইল',
    descriptionEn: 'Past projects, live links and professional showcases',
    iconName: 'Globe',
    isMandatory: false,
  },
  {
    id: 9,
    slug: 'verification',
    titleBn: 'যাচাই ও সম্মতি',
    titleEn: 'Verification & Terms',
    descriptionBn: 'ওটিপি যাচাইকরণ ও প্ল্যাটফর্ম নীতিমালায় সম্মতি',
    descriptionEn: 'Phone OTP verification and terms acceptance',
    iconName: 'ShieldCheck',
    isMandatory: true,
  },
  {
    id: 10,
    slug: 'preview',
    titleBn: 'চূড়ান্ত পর্যালোচনা',
    titleEn: 'Preview & Submit',
    descriptionBn: 'সকল তথ্যের পূর্বরূপ, প্রোফাইল স্কোর ও চূড়ান্ত সাবমিশন',
    descriptionEn: 'Complete profile preview, completeness score and submission',
    iconName: 'CheckCircle2',
    isMandatory: true,
  },
];

export const INITIAL_REGISTRATION_DATA: RegistrationFormData = {
  accountType: 'freelancer',
  fullName: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  categoryBn: 'আইটি ও ফ্রিল্যান্সার (IT & Freelancer)',
  categoryEn: 'IT & Freelancer',

  dateOfBirth: '',
  gender: '',
  nationality: 'Bangladeshi',
  fatherName: '',
  motherName: '',
  maritalStatus: '',
  bloodGroup: '',
  bioBn: '',
  bioEn: '',

  permanentAddress: {
    division: 'চট্টগ্রাম',
    district: 'খাগড়াছড়ি',
    upazila: 'খাগড়াছড়ি সদর',
    unionOrWard: '',
    villageOrMahalla: '',
    postalCode: '',
    detailedAddress: '',
  },
  presentAddressSameAsPermanent: true,
  presentAddress: {
    division: 'চট্টগ্রাম',
    district: 'খাগড়াছড়ি',
    upazila: 'খাগড়াছড়ি সদর',
    unionOrWard: '',
    villageOrMahalla: '',
    postalCode: '',
    detailedAddress: '',
  },

  educationList: [],
  experienceList: [],
  skillsList: [],
  certificationsList: [],

  nidNumber: '',
  nidFrontUrl: '',
  nidBackUrl: '',
  selfieUrl: '',
  tradeLicenseUrl: '',
  cvResumeUrl: '',

  portfolioWebsite: '',
  githubUrl: '',
  linkedinUrl: '',
  projectsList: [],

  isPhoneVerified: false,
  phoneOtp: '',
  isNidVerified: false,
  agreedToTerms: false,
  agreedToCodeOfConduct: false,
};
