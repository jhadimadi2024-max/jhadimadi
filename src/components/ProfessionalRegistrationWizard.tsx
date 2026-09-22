import React, { useState, useMemo } from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  MapPin, 
  Briefcase, 
  Award, 
  DollarSign, 
  FileText, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  Camera, 
  ShieldCheck, 
  X,
  PlusCircle,
  Calendar,
  Layers,
  Upload,
  CreditCard,
  Lock,
  Compass,
  Check,
  GraduationCap,
  Building,
  Image as ImageIcon,
  Trash2,
  Search,
  Globe,
  Tag,
  Star,
  Eye,
  FileCheck
} from 'lucide-react';
import { 
  EducationEntry, 
  EmploymentEntry, 
  CertificationEntry, 
  PortfolioItem, 
  OtherExperienceEntry, 
  ServiceProvider, 
  District 
} from '../types';
import { generateUniqueId, getDistrictCode } from '../utils/uniqueIdGenerator';
import { 
  LOCATION_MASTER, 
  getAllDivisions, 
  getDistrictsByDivision, 
  getUpazilasByDistrict, 
  generateMemberUID, 
  getLocationCodes 
} from '../data/locationMaster';
import { 
  MASTER_PROFESSION_CATEGORIES, 
  ALL_PROFESSIONS_FLAT_LIST, 
  BANGLADESH_GEO_DIRECTORY 
} from '../data/professionsMasterData';
import { databaseService } from '../services/databaseService';
import { sanitizeDatabasePayload } from '../utils/imageUtils';

export interface RegisteredProfessional {
  id: number | string;
  memberId?: string;
  uniqueId?: string; // S-[District Code]-[Serial] (e.g., S-RNG-001)
  name: string;
  fatherName?: string;
  motherName?: string;
  dateOfBirth?: string;
  gender?: 'পুরুষ' | 'নারী' | 'অন্যান্য';
  professionalHeadline?: string;
  phone: string;
  email?: string;
  job: string;
  categoryGroup?: string;
  district: string;
  upazila: string;
  area: string;
  fullAddress?: string;
  serviceRadiusKm?: number;
  coveredAreas?: string[];
  experience?: string;
  rateType?: 'দৈনিক' | 'ঘণ্টাভিত্তিক' | 'চুক্তিভিত্তিক' | 'ভিজিট ফি';
  rateAmount?: string;
  dailyRate?: string;
  available?: boolean;
  bio?: string;
  skills?: string | string[];
  selectedSkillsList?: string[];
  resumeFileName?: string;
  portfolioUrl?: string;
  portfolioImages?: string[];
  portfolioItems?: PortfolioItem[];
  certificatesList?: CertificationEntry[];
  educations?: EducationEntry[];
  employments?: EmploymentEntry[];
  otherExperiences?: OtherExperienceEntry[];
  img?: string;
  nid?: string;
  nidFrontUrl?: string;
  nidBackUrl?: string;
  bloodGroup?: string; // e.g. 'A+', 'O+', 'B+', 'AB+', etc.
  lastDonationDate?: string;
  isBloodDonor?: boolean;
  verificationFeePaid?: boolean;
  paymentMethod?: 'bKash' | 'Nagad' | 'Upay';
  trxId?: string;
  rating?: number;
  completedJobs?: number;
  verified?: boolean;
}

interface ProfessionalRegistrationWizardProps {
  onSuccess: (newProfessional: RegisteredProfessional) => void;
  onCancel?: () => void;
  allDistricts?: Record<string, string[]>;
  professionCategories?: { category: string; jobs: string[] }[];
  isModal?: boolean;
  onViewInSearch?: (district: string, upazila: string, job: string) => void;
}

const AVATAR_PRESETS = [
  { id: '1', label: 'কারিগর / টেকনিশিয়ান', url: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=200' },
  { id: '2', label: 'কৃষি ও উদ্যোক্তা', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200' },
  { id: '3', label: 'ডাক্তার / স্বাস্থ্যকর্মী', url: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=200' },
  { id: '4', label: 'প্রকৌশলী / ড্রাফটসম্যান', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200' },
  { id: '5', label: 'শিক্ষক / টিউটর', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=200' },
  { id: '6', label: 'ফ্রিল্যান্সার / আইটি', url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200' },
];

const POPULAR_SKILL_TAGS = [
  'ইলেকট্রিশিয়ান (বাসাবাড়ি ওয়্যারিং)', 'ফ্রিজ ও রেফ্রিজারেটর টেকনিশিয়ান', 'প্লাম্বার ও স্যানিটারি মিস্ত্রি', 
  'মোটরবাইক সার্ভিসিং মেকানিক', 'পেইন্টার ও ওয়াল পুটি মিস্ত্রি', 'রাজমিস্ত্রি (বিল্ডিং কনস্ট্রাকশন)', 
  'কাঠমিস্ত্রি (দরজা-জানালা ও ফ্রেম)', 'প্রাইভেট কার ও মাইক্রোবাস ড্রাইভার', 'হোম টিউটর (ক্লাস ১-৫ সকল বিষয়)', 
  'রেজিস্টার্ড নার্স (হোম ইনজেকশন/ক্যানুলা)', 'ওয়েডিং ও ইভেন্ট ফটোগ্রাফার', 'মাস্টার টেইলার (লেডিস ড্রেস)', 
  'বার্বার / সেলুন হেয়ার কাটার', 'ফুলস্ট্যাক ওয়েব ডেভেলপার', 'জাদুকর (ম্যাজিশিয়ান)', 'গৃহকর্মী / কাজের খালা'
];

export const ProfessionalRegistrationWizard: React.FC<ProfessionalRegistrationWizardProps> = ({
  onSuccess,
  onCancel,
  allDistricts,
  professionCategories,
  isModal = false,
  onViewInSearch
}) => {
  // Wizard steps: 
  // 1: Basic Overview & Personal Info (Photo, Headline, Full Name, Father, Mother, DOB, Gender, Bio)
  // 2: Multi-Skill Matrix (1,000+ Master Professions Selector & Multi-Select)
  // 3: Professional Credentials & Portfolio (Education, Employment, Certifications, Portfolio Projects, Other Exp)
  // 4: Hyper-Local Service Area Mapping (District, Thana, Area, Radius, Covered Paras, Rate)
  // 5: Identity Verification & 100 BDT Activation Fee (Dual-side NID, bKash/Nagad TrxID)
  // 6: Confirmation Card & Unique ID ([S]-[Dist]-[Serial])
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  // ================= Step 1: Basic Overview & Personal Info =================
  const [name, setName] = useState('');
  const [professionalHeadline, setProfessionalHeadline] = useState('সিনিয়র ইলেকট্রিক্যাল ওয়্যারিং স্পেশালিস্ট ও এসি টেকনিশিয়ান');
  const [fatherName, setFatherName] = useState('');
  const [motherName, setMotherName] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('1995-06-15');
  const [gender, setGender] = useState<'পুরুষ' | 'নারী' | 'অন্যান্য'>('পুরুষ');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [bio, setBio] = useState('গত ৮ বছর ধরে সততা, দক্ষতা ও দায়িত্বশীলতার সাথে যেকোনো ইলেকট্রিক্যাল ফল্ট, হোম ওয়্যারিং ও হোম অ্যাপ্লায়েন্স সার্ভিসিং অন-ডিমান্ড প্রদান করে আসছি। ১০০% গ্রাহক সন্তুষ্টি আমার মূল অঙ্গীকার।');
  const [selectedAvatar, setSelectedAvatar] = useState(AVATAR_PRESETS[0].url);
  const [customAvatarUrl, setCustomAvatarUrl] = useState('');

  // ================= Step 2: Multi-Skill Matrix (1,000+ Master Professions) =================
  const [skillSearchQuery, setSkillSearchQuery] = useState('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all');
  const [selectedPrimaryJob, setSelectedPrimaryJob] = useState('ইলেকট্রিশিয়ান (বাসাবাড়ি ওয়্যারিং)');
  const [selectedSkills, setSelectedSkills] = useState<string[]>([
    'ইলেকট্রিশিয়ান (বাসাবাড়ি ওয়্যারিং)', 
    'সোলার প্যানেল ও আইপিএস টেকনিশিয়ান', 
    'ফ্রিজ ও রেফ্রিজারেটর টেকনিশিয়ান',
    'প্লাম্বার ও স্যানিটারি মিস্ত্রি'
  ]);
  const [customSkillInput, setCustomSkillInput] = useState('');

  // ================= Step 3: Professional Credentials & Portfolio (Upwork/Fiverr Style) =================
  const [activeCredTab, setActiveCredTab] = useState<'education' | 'experience' | 'certifications' | 'portfolio' | 'other'>('portfolio');
  
  // Education List
  const [educations, setEducations] = useState<EducationEntry[]>([
    {
      id: 'edu_1',
      degree: 'ডিপ্লোমা ইন ইলেকট্রিক্যাল ইঞ্জিনিয়ারিং',
      institution: 'চট্টগ্রাম পলিটেকনিক ইনস্টিটিউট',
      passingYear: '২০১৮',
      fieldOfStudy: 'ইলেকট্রিক্যাল টেকনোলজি',
      grade: '৩.৮৫'
    }
  ]);
  const [newDegree, setNewDegree] = useState('');
  const [newInstitution, setNewInstitution] = useState('');
  const [newPassingYear, setNewPassingYear] = useState('২০২০');
  const [newFieldOfStudy, setNewFieldOfStudy] = useState('');

  // Employment Experience List
  const [employments, setEmployments] = useState<EmploymentEntry[]>([
    {
      id: 'emp_1',
      company: 'আনোয়ার বিল্ডার্স লিমিটেড',
      designation: 'সিনিয়র সাইট ইলেকট্রিশিয়ান',
      duration: '২০১৯ - ২০২২ (৩ বছর)',
      description: 'বাণিজ্যিক ও আবাসিক ভবনের থ্রি-ফেজ ওয়্যারিং এবং সাবস্টেশন রক্ষণাবেক্ষণ পরিচালনা করেছি।',
      location: 'চট্টগ্রাম',
      isCurrentJob: false
    }
  ]);
  const [newCompany, setNewCompany] = useState('');
  const [newDesignation, setNewDesignation] = useState('');
  const [newDuration, setNewDuration] = useState('২০২২ - বর্তমান');
  const [newJobDesc, setNewJobDesc] = useState('');

  // Certifications List
  const [certifications, setCertifications] = useState<CertificationEntry[]>([
    {
      id: 'cert_1',
      title: 'ন্যাশনাল স্কিলস স্ট্যান্ডার্ড সার্টিফিকেট (NTVQF Level-2)',
      issuer: 'বাংলাদেশ কারিগরি শিক্ষা বোর্ড (BTEB)',
      year: '২০২১',
      credentialId: 'BTEB-ELEC-8902',
      verified: true
    }
  ]);
  const [newCertTitle, setNewCertTitle] = useState('');
  const [newCertIssuer, setNewCertIssuer] = useState('');
  const [newCertYear, setNewCertYear] = useState('২০২২');
  const [newCredentialId, setNewCredentialId] = useState('');

  // Portfolio Showcase Items
  const [portfolioItems, setPortfolioItems] = useState<PortfolioItem[]>([
    {
      id: 'port_1',
      title: '১০ তলা ভবনের সম্পূর্ণ স্মার্ট হোম অটোমেশন ওয়্যারিং',
      description: 'আধুনিক সার্কিট ব্রেকার, আর্থিং ও স্মার্ট সুইচ ইনস্টলেশন সফলভাবে সম্পন্ন করেছি।',
      imageUrl: 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
      completionDate: 'জানুয়ারি ২০২৬',
      tags: ['স্মার্ট হোম', 'ওয়্যারিং', 'সার্কিট ব্রেকার'],
      clientFeedback: 'অত্যন্ত নিখুঁত ও দ্রুত সময়ে কাজ শেষ করেছেন।'
    },
    {
      id: 'port_2',
      title: 'পাহাড়ি রিসোর্টে ৫ কিলোওয়াট অফ-গ্রিড সোলার সিস্টেম সেটআপ',
      description: 'কাপ্তাই লেকের একটি ইকো-রিসোর্টে নিরবচ্ছিন্ন বিদ্যুৎ সাপ্লাইয়ের জন্য ব্যাটারি ব্যাকআপ সহ সোলার সেটআপ।',
      imageUrl: 'https://images.unsplash.com/photo-1509391365360-2e959784a276?auto=format&fit=crop&w=600&q=80',
      completionDate: 'ডিসেম্বর ২০২৫',
      tags: ['সোলার', 'গ্রিন এনার্জি', 'রিসোর্ট'],
      clientFeedback: 'লেকের দুর্গম এলাকায় এসে কাজ করে দিয়েছেন।'
    }
  ]);
  const [newPortTitle, setNewPortTitle] = useState('');
  const [newPortDesc, setNewPortDesc] = useState('');
  const [newPortImageUrl, setNewPortImageUrl] = useState('https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=600&q=80');

  // Other Experiences List
  const [otherExperiences, setOtherExperiences] = useState<OtherExperienceEntry[]>([
    {
      id: 'oth_1',
      title: 'পাহাড়ি পাহাড়ি ভাষায় পারদর্শিতা ও যোগাযোগ',
      category: 'ভাষা ও আঞ্চলিক জ্ঞান',
      description: 'বাংলা, মারমা ও চাকমা ভাষায় অনর্গল কথা বলে যেকোনো গ্রাহকের সাথে কাজ বোঝাতে সক্ষম।'
    },
    {
      id: 'oth_2',
      title: 'জরুরি ফায়ার সেফটি ও ফার্স্ট এইড ট্রেনিং',
      category: 'নিরাপত্তা ও প্রশিক্ষণ',
      description: 'ফায়ার সার্ভিস ও সিভিল ডিফেন্স থেকে বৈদ্যুতিক অগ্নিনির্বাপণ ও প্রাথমিক চিকিৎসা সার্টিফাইড।'
    }
  ]);
  const [newOtherTitle, setNewOtherTitle] = useState('');
  const [newOtherCategory, setNewOtherCategory] = useState('');
  const [newOtherDesc, setNewOtherDesc] = useState('');

  // ================= Step 4: Hyper-Local Service Area Mapping =================
  const [division, setDivision] = useState('চট্টগ্রাম');
  const [district, setDistrict] = useState('খাগড়াছড়ি');
  const [upazila, setUpazila] = useState('দীঘিনালা');
  const [area, setArea] = useState('বোয়ালখালী বাজার');
  const [fullAddress, setFullAddress] = useState('বোয়ালখালী বাজার রোড, দীঘিনালা, খাগড়াছড়ি');
  const [serviceRadiusKm, setServiceRadiusKm] = useState<number>(15);
  const [coveredParas, setCoveredParas] = useState<string>('বোয়ালখালী বাজার, কবাখালী, মেরুং, ছোট মেরুং');
  const [experience, setExperience] = useState('৫+ বছর (অভিজ্ঞ)');
  const [rateType, setRateType] = useState<'দৈনিক' | 'ঘণ্টাভিত্তিক' | 'চুক্তিভিত্তিক' | 'ভিজিট ফি'>('দৈনিক');
  const [rateAmount, setRateAmount] = useState('৮০০');

  // ================= Step 5: Identity Verification & 100 BDT Activation Fee =================
  const [nidNumber, setNidNumber] = useState('19951234567890123');
  const [nidFrontUrl, setNidFrontUrl] = useState('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80');
  const [nidBackUrl, setNidBackUrl] = useState('https://images.unsplash.com/photo-1589829545856-d10d557cf95f?auto=format&fit=crop&w=400&q=80');
  const [paymentMethod, setPaymentMethod] = useState<'bKash' | 'Nagad' | 'Upay'>('bKash');
  const [trxId, setTrxId] = useState('');
  const [isVerifyingPayment, setIsVerifyingPayment] = useState(false);
  const [isPaymentConfirmed, setIsPaymentConfirmed] = useState(false);

  // General State
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registeredResult, setRegisteredResult] = useState<RegisteredProfessional | null>(null);

  // Divisions list
  const divisions = useMemo(() => getAllDivisions(), []);

  // Filtered districts for selected division
  const districts = useMemo(() => {
    const list = getDistrictsByDivision(division);
    return list.length > 0 ? list : [{ nameBn: 'খাগড়াছড়ি', nameEn: 'Khagrachhari', code: 'KHG' }];
  }, [division]);

  // Filtered upazilas for selected district
  const upazilas = useMemo(() => {
    const list = getUpazilasByDistrict(district);
    return list.length > 0 ? list : [{ nameBn: 'দীঘিনালা', nameEn: 'Dighinala', code: 'DGH' }];
  }, [district]);

  const handleDivisionChange = (newDiv: string) => {
    const newDistList = getDistrictsByDivision(newDiv);
    const firstDist = newDistList.length > 0 ? newDistList[0].nameBn : 'খাগড়াছড়ি';
    const newUpzList = getUpazilasByDistrict(firstDist);
    const firstUpz = newUpzList.length > 0 ? newUpzList[0].nameBn : 'সদর';
    setDivision(newDiv);
    setDistrict(firstDist);
    setUpazila(firstUpz);
  };

  const handleDistrictChange = (newDist: string) => {
    const newUpzList = getUpazilasByDistrict(newDist);
    const firstUpz = newUpzList.length > 0 ? newUpzList[0].nameBn : 'সদর';
    setDistrict(newDist);
    setUpazila(firstUpz);
  };

  // Location codes & preview UID
  const locCodes = useMemo(() => {
    return getLocationCodes(division, district, upazila);
  }, [division, district, upazila]);

  const previewUID = `${locCodes.divCode}-${locCodes.distCode}-${locCodes.upazilaCode}-XXXX`;

  const avatarToUse = customAvatarUrl.trim() || selectedAvatar;

  // Filtered master professions for Search & Multi-Select Matrix
  const filteredMasterProfessions = useMemo(() => {
    let list = ALL_PROFESSIONS_FLAT_LIST;
    if (selectedCategoryTab !== 'all') {
      list = list.filter(p => p.category === selectedCategoryTab);
    }
    if (skillSearchQuery.trim()) {
      const q = skillSearchQuery.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.category.toLowerCase().includes(q) ||
        p.categoryEn.toLowerCase().includes(q)
      );
    }
    return list;
  }, [selectedCategoryTab, skillSearchQuery]);

  // Toggle skill in Multi-Skill Matrix
  const toggleSkill = (skillName: string) => {
    if (selectedSkills.includes(skillName)) {
      setSelectedSkills(selectedSkills.filter(s => s !== skillName));
    } else {
      setSelectedSkills([...selectedSkills, skillName]);
      setErrorMsg('');
    }
  };

  const handleAddCustomSkill = () => {
    if (!customSkillInput.trim()) return;
    if (selectedSkills.includes(customSkillInput.trim())) {
      setCustomSkillInput('');
      return;
    }
    setSelectedSkills([...selectedSkills, customSkillInput.trim()]);
    setCustomSkillInput('');
    setErrorMsg('');
  };

  // Education Helpers
  const handleAddEducation = () => {
    if (!newDegree.trim() || !newInstitution.trim()) {
      setErrorMsg('ডিগ্রি ও প্রতিষ্ঠানের নাম লিখুন।');
      return;
    }
    setEducations([
      ...educations,
      {
        id: 'edu_' + Date.now(),
        degree: newDegree.trim(),
        institution: newInstitution.trim(),
        passingYear: newPassingYear.trim() || '২০২১',
        fieldOfStudy: newFieldOfStudy.trim() || undefined
      }
    ]);
    setNewDegree('');
    setNewInstitution('');
    setNewFieldOfStudy('');
    setErrorMsg('');
  };

  const handleRemoveEducation = (id: string) => {
    setEducations(educations.filter(e => e.id !== id));
  };

  // Employment Helpers
  const handleAddEmployment = () => {
    if (!newCompany.trim() || !newDesignation.trim()) {
      setErrorMsg('কোম্পানি ও পদবীর নাম লিখুন।');
      return;
    }
    setEmployments([
      ...employments,
      {
        id: 'emp_' + Date.now(),
        company: newCompany.trim(),
        designation: newDesignation.trim(),
        duration: newDuration.trim() || '১ বছর',
        description: newJobDesc.trim() || undefined
      }
    ]);
    setNewCompany('');
    setNewDesignation('');
    setNewJobDesc('');
    setErrorMsg('');
  };

  const handleRemoveEmployment = (id: string) => {
    setEmployments(employments.filter(e => e.id !== id));
  };

  // Certification Helpers
  const handleAddCertification = () => {
    if (!newCertTitle.trim()) {
      setErrorMsg('সার্টিফিকেটের নাম লিখুন।');
      return;
    }
    setCertifications([
      ...certifications,
      {
        id: 'cert_' + Date.now(),
        title: newCertTitle.trim(),
        issuer: newCertIssuer.trim() || 'অনুমোদিত প্রতিষ্ঠান',
        year: newCertYear.trim() || '২০২৩',
        credentialId: newCredentialId.trim() || undefined,
        verified: true
      }
    ]);
    setNewCertTitle('');
    setNewCertIssuer('');
    setNewCredentialId('');
    setErrorMsg('');
  };

  const handleRemoveCertification = (id: string) => {
    setCertifications(certifications.filter(c => c.id !== id));
  };

  // Portfolio Helpers
  const handleAddPortfolio = () => {
    if (!newPortTitle.trim()) {
      setErrorMsg('প্রজেক্টের শিরোনাম লিখুন।');
      return;
    }
    setPortfolioItems([
      ...portfolioItems,
      {
        id: 'port_' + Date.now(),
        title: newPortTitle.trim(),
        description: newPortDesc.trim() || 'সাফল্যের সাথে সম্পন্ন করা প্রজেক্ট।',
        imageUrl: newPortImageUrl.trim() || 'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=600&q=80',
        completionDate: '২০২৬',
        tags: [selectedPrimaryJob]
      }
    ]);
    setNewPortTitle('');
    setNewPortDesc('');
    setErrorMsg('');
  };

  const handleRemovePortfolio = (id: string) => {
    setPortfolioItems(portfolioItems.filter(p => p.id !== id));
  };

  // Other Experience Helpers
  const handleAddOtherExp = () => {
    if (!newOtherTitle.trim()) {
      setErrorMsg('অভিজ্ঞতার শিরোনাম লিখুন।');
      return;
    }
    setOtherExperiences([
      ...otherExperiences,
      {
        id: 'oth_' + Date.now(),
        title: newOtherTitle.trim(),
        category: newOtherCategory.trim() || 'বিশেষ দক্ষতা',
        description: newOtherDesc.trim() || ''
      }
    ]);
    setNewOtherTitle('');
    setNewOtherCategory('');
    setNewOtherDesc('');
    setErrorMsg('');
  };

  const handleRemoveOtherExp = (id: string) => {
    setOtherExperiences(otherExperiences.filter(o => o.id !== id));
  };

  // Step Navigations
  const handleNextStep = () => {
    setErrorMsg('');
    if (step === 1) {
      if (!name.trim()) {
        setErrorMsg('অনুগ্রহ করে আপনার পুরো নাম লিখুন।');
        return;
      }
      if (!professionalHeadline.trim()) {
        setErrorMsg('অনুগ্রহ করে পেশাদার হেডলাইন / টাইটেল লিখুন।');
        return;
      }
      if (!phone.trim() || phone.trim().length < 10) {
        setErrorMsg('সঠিক মোবাইল নম্বর লিখুন (যেমন: 01800-000000)।');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (selectedSkills.length === 0) {
        setErrorMsg('অন্তত ১টি স্কিল বা পেশা নির্বাচন করুন।');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      setStep(4);
      if (!upazila && upazilas.length > 0) {
        setUpazila(upazilas[0].nameBn);
      }
    } else if (step === 4) {
      if (!district) {
        setErrorMsg('অনুগ্রহ করে জেলা নির্বাচন করুন।');
        return;
      }
      if (!upazila) {
        setErrorMsg('অনুগ্রহ করে উপজেলা/থানা নির্বাচন করুন।');
        return;
      }
      if (!area.trim()) {
        setErrorMsg('অনুগ্রহ করে পাড়া / মহল্লা / গ্রাম লিখুন।');
        return;
      }
      if (!rateAmount.trim()) {
        setErrorMsg('পারিশ্রমিকের টাকার পরিমাণ উল্লেখ করুন।');
        return;
      }
      setStep(5);
    }
  };

  // Instant simulated 100 BDT Payment Confirmation
  const handleConfirmPaymentSim = () => {
    if (!trxId.trim()) {
      setErrorMsg('অনুগ্রহ করে ১০০ টাকা ফি পাঠানোর TrxID লিখুন (যেমন: 9K8X2M7P)।');
      return;
    }
    setIsVerifyingPayment(true);
    setErrorMsg('');
    setTimeout(() => {
      setIsVerifyingPayment(false);
      setIsPaymentConfirmed(true);
    }, 600);
  };

  // Final Registration Submission & Unique ID Generation [DivCode]-[DistCode]-[UpazilaCode]-[Sequence]
  const handleSubmit = async () => {
    if (!isPaymentConfirmed && !trxId.trim()) {
      setErrorMsg('অনুগ্রহ করে ১০০ টাকা অ্যাক্টিভেশন ফি প্রদান সম্পন্ন করুন।');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    // Generate Official Sequential Unique ID using strict Master Taxonomy
    const generatedUID = generateMemberUID(division, district, upazila);
    const codes = getLocationCodes(division, district, upazila);
    const docId = `pro_wiz_${Date.now()}`;

    const newProfessional: RegisteredProfessional = {
      id: docId,
      memberId: generatedUID,
      uniqueId: generatedUID,
      name: name.trim(),
      fatherName: fatherName.trim() || undefined,
      motherName: motherName.trim() || undefined,
      dateOfBirth,
      gender,
      professionalHeadline: professionalHeadline.trim(),
      phone: phone.trim(),
      email: email.trim() || undefined,
      job: selectedPrimaryJob || selectedSkills[0] || 'সার্ভিস প্রোভাইডার',
      categoryGroup: 'পেশাজীবী সেবা',
      district,
      upazila: upazila || 'সদর',
      area: area.trim(),
      fullAddress: fullAddress.trim() || `${area.trim()}, ${upazila}, ${district}`,
      serviceRadiusKm,
      coveredAreas: coveredParas.split(',').map(p => p.trim()).filter(Boolean),
      experience: experience || '৫+ বছর (অভিজ্ঞ)',
      rateType,
      rateAmount: rateAmount.trim(),
      bio: bio.trim() || `${professionalHeadline} হিসেবে সততা ও দায়িত্বশীলতার সাথে অন-ডিমান্ড হোম সার্ভিস প্রদানে প্রতিশ্রুতিবদ্ধ।`,
      skills: selectedSkills.join(', '),
      selectedSkillsList: selectedSkills,
      educations,
      employments,
      certificatesList: certifications,
      portfolioItems,
      otherExperiences,
      img: avatarToUse,
      nid: nidNumber.trim() || '19951234567890',
      nidFrontUrl,
      nidBackUrl,
      verificationFeePaid: true,
      paymentMethod,
      trxId: trxId.trim() || 'TRX' + Math.floor(1000000 + Math.random() * 9000000),
      rating: 5.0,
      completedJobs: 0,
      verified: true
    };

    try {
      const docPayload = {
        id: docId,
        memberUID: generatedUID,
        memberId: generatedUID,
        name: name.trim(),
        fullName: name.trim(),
        phone: phone.trim(),
        email: email.trim() || `${phone.trim()}@jhadimadi.com`,
        role: 'professional',
        division,
        district,
        upazila: upazila || 'সদর',
        thana: upazila || 'সদর',
        mahalla: area.trim(),
        para: area.trim(),
        paraMahalla: `${area.trim()}, ${upazila || 'সদর'}`,
        profession: selectedPrimaryJob || selectedSkills[0] || 'সার্ভিস প্রোভাইডার',
        professionBn: selectedPrimaryJob || selectedSkills[0] || 'সার্ভিস প্রোভাইডার',
        serviceCategory: selectedSkills.join(', '),
        categorySkill: selectedSkills.join(', '),
        avatar: avatarToUse,
        isNidVerified: true,
        isPaidMember: true,
        isBloodDonor: true,
        isBloodDonorAvailable: true,
        nidNumber: nidNumber.trim() || '19951234567890',
        createdAt: new Date().toISOString().split('T')[0],
        updatedAt: new Date().toISOString(),
      };

      const result = await databaseService.registerProvider({
        id: docId,
        memberUID: generatedUID,
        memberId: generatedUID,
        name: name.trim(),
        fullName: name.trim(),
        phone: phone.trim(),
        email: email.trim() || `${phone.trim()}@jhadimadi.com`,
        role: 'professional',
        division,
        district,
        upazila: upazila || 'সদর',
        thana: upazila || 'সদর',
        mahalla: area.trim(),
        para: area.trim(),
        paraMahalla: `${area.trim()}, ${upazila || 'সদর'}`,
        profession: selectedPrimaryJob || selectedSkills[0] || 'সার্ভিস প্রোভাইডার',
        professionBn: selectedPrimaryJob || selectedSkills[0] || 'সার্ভিস প্রোভাইডার',
        serviceCategory: selectedSkills.join(', '),
        categorySkill: selectedSkills.join(', '),
        avatar: avatarToUse,
        isNidVerified: true,
        isPaidMember: true,
        isBloodDonor: true,
        isBloodDonorAvailable: true,
        nidNumber: nidNumber.trim() || '19951234567890',
        createdAt: new Date().toISOString().split('T')[0],
      });

      if (!result.success) {
        throw new Error(result.error || 'ফায়ারস্টোরে রেজিস্ট্রেশন ব্যর্থ হয়েছে');
      }
    } catch (err: any) {
      console.error('Professional Registration Firestore error:', err);
    } finally {
      setIsSubmitting(false);
      setRegisteredResult(newProfessional);
      setStep(6);
      onSuccess(newProfessional);
    }
  };

  return (
    <div className={`bg-white rounded-3xl border border-gray-200 shadow-2xl overflow-hidden flex flex-col ${isModal ? 'max-h-[92vh]' : 'my-2 mx-auto max-w-3xl'}`}>
      
      {/* Header Banner - Track B Service Provider Welcome */}
      <div className="bg-gradient-to-r from-[#1E4D2B] via-[#2A653B] to-[#1E4D2B] text-white p-4 flex items-center justify-between shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-xs">
            <Briefcase className="w-6 h-6 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="bg-amber-400 text-[#1E4D2B] text-[8.5px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-xs">
                Track B • গ্লোবাল সার্ভিস প্রোভাইডার প্রোফাইল
              </span>
            </div>
            <h2 className="text-sm sm:text-base font-black leading-tight mt-0.5">
              Welcome to Jhadimadi.com as a Service Provider!
            </h2>
            <p className="text-[9.5px] text-emerald-100 font-medium">
              Fiverr ও Upwork-এর মতো পেশাদার পোর্টফোলিও এবং বাংলাদেশের ৬৪ জেলার লোকাল সার্চ ডিরেক্টরি
            </p>
          </div>
        </div>
        
        {onCancel && (
          <button 
            onClick={onCancel}
            className="p-1.5 text-white/80 hover:text-white bg-black/20 hover:bg-black/30 rounded-full transition-colors cursor-pointer"
            title="বন্ধ করুন"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Step Indicator (Steps 1 to 5) */}
      {step <= 5 && (
        <div className="bg-emerald-50/70 px-4 py-2.5 border-b border-emerald-200/60">
          <div className="flex items-center justify-between text-[8px] sm:text-[9.5px] font-black text-gray-600 mb-1.5 overflow-x-auto no-scrollbar gap-2">
            <span className={step >= 1 ? 'text-[#1E4D2B] font-extrabold flex items-center gap-0.5 shrink-0' : 'shrink-0'}>
              ১. ব্যক্তিগত পরিচিতি {step > 1 && '✓'}
            </span>
            <span className="text-gray-300">➔</span>
            <span className={step >= 2 ? 'text-[#1E4D2B] font-extrabold flex items-center gap-0.5 shrink-0' : 'shrink-0'}>
              ২. ১,০০০+ স্কিল মেট্রিক্স {step > 2 && '✓'}
            </span>
            <span className="text-gray-300">➔</span>
            <span className={step >= 3 ? 'text-[#1E4D2B] font-extrabold flex items-center gap-0.5 shrink-0' : 'shrink-0'}>
              ৩. পোর্টফোলিও ও সিভি {step > 3 && '✓'}
            </span>
            <span className="text-gray-300">➔</span>
            <span className={step >= 4 ? 'text-[#1E4D2B] font-extrabold flex items-center gap-0.5 shrink-0' : 'shrink-0'}>
              ৪. লোকাল এলাকা ম্যাপিং {step > 4 && '✓'}
            </span>
            <span className="text-gray-300">➔</span>
            <span className={step >= 5 ? 'text-[#1E4D2B] font-extrabold flex items-center gap-0.5 shrink-0' : 'shrink-0'}>
              ৫. এনআইডি ও ১০০৳ ফি
            </span>
          </div>
          {/* Progress Bar */}
          <div className="w-full bg-emerald-200/60 h-2 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-emerald-500 to-[#1E4D2B] h-full transition-all duration-300 rounded-full"
              style={{ width: `${(step / 5) * 100}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Error Message Toast */}
      {errorMsg && (
        <div className="mx-4 mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-[9.5px] font-bold flex items-center gap-2 animate-shake">
          <span className="w-2 h-2 bg-rose-600 rounded-full shrink-0"></span>
          {errorMsg}
        </div>
      )}

      {/* Form Content Body */}
      <div className="p-4 sm:p-5 flex-1 overflow-y-auto space-y-4 text-left text-gray-800 text-[10px] no-scrollbar">

        {/* ================= STEP 1: Basic Overview & Personal Info ================= */}
        {step === 1 && (
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-2 flex items-center justify-between">
              <span className="font-extrabold text-xs sm:text-sm text-gray-900 flex items-center gap-2">
                <User className="w-4 h-4 text-[#1E4D2B]" /> মৌলিক পরিচিতি ও প্রফেশনাল হেডলাইন
              </span>
              <span className="text-[8.5px] bg-emerald-100 text-[#1E4D2B] px-2.5 py-0.5 rounded-full font-black">ধাপ ১/৫</span>
            </div>

            {/* Profile Photo Avatar Preset / Custom */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-gray-200">
              <label className="block text-[9.5px] font-extrabold text-gray-800 mb-1.5 flex items-center gap-1.5">
                <Camera className="w-3.5 h-3.5 text-[#1E4D2B]" /> প্রোফাইল ছবি আপলোড / নির্বাচন করুন <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-2">
                {AVATAR_PRESETS.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => { setSelectedAvatar(av.url); setCustomAvatarUrl(''); }}
                    className={`flex flex-col items-center p-1.5 rounded-xl border-2 transition-all cursor-pointer ${
                      avatarToUse === av.url ? 'border-[#1E4D2B] bg-emerald-50 shadow-sm' : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <img src={av.url} alt={av.label} className="w-10 h-10 rounded-full object-cover mb-1 border border-white shadow-xs" />
                    <span className="text-[7.5px] font-bold text-gray-700 text-center leading-tight line-clamp-1">{av.label}</span>
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  value={customAvatarUrl}
                  onChange={(e) => setCustomAvatarUrl(e.target.value)}
                  placeholder="অথবা কাস্টম ছবির ইমেজ লিংক (URL) পেস্ট করুন..."
                  className="flex-1 bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-[9px] outline-none focus:border-[#1E4D2B]"
                />
              </div>
            </div>

            {/* Professional Headline (Fiverr/Upwork Style) */}
            <div>
              <label className="block text-[9.5px] font-extrabold text-gray-800 mb-1">
                পেশাদার হেডলাইন / টাইটেল (Professional Title) <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center bg-slate-50 border border-gray-300 rounded-xl px-3 py-2 focus-within:border-[#1E4D2B] focus-within:bg-white transition-all">
                <Sparkles className="w-4 h-4 text-amber-600 mr-2 shrink-0" />
                <input
                  type="text"
                  value={professionalHeadline}
                  onChange={(e) => setProfessionalHeadline(e.target.value)}
                  placeholder="যেমন: Senior Certified Electrical Engineer & Smart Home Specialist"
                  className="w-full bg-transparent outline-none font-bold text-slate-800 text-[11px]"
                />
              </div>
              <span className="text-[8px] text-gray-500 mt-0.5 block">
                * এটি ক্লায়েন্টদের সার্চ রেজাল্ট এবং পাবলিক পোর্টফোলিও কার্ডের শীর্ষে বড় করে প্রদর্শিত হবে।
              </span>
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-[9.5px] font-extrabold text-gray-800 mb-1">
                আপনার পুরো নাম (Full Name) <span className="text-rose-500">*</span>
              </label>
              <div className="flex items-center bg-slate-50 border border-gray-300 rounded-xl px-3 py-2 focus-within:border-[#1E4D2B] focus-within:bg-white transition-all">
                <User className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="যেমন: মোঃ কামরুল ইসলাম / রূপক চাকমা"
                  className="w-full bg-transparent outline-none font-bold text-slate-800 text-[11px]"
                />
              </div>
            </div>

            {/* Father & Mother Name */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-extrabold text-gray-700 mb-1">
                  পিতার নাম (Father's Name)
                </label>
                <input
                  type="text"
                  value={fatherName}
                  onChange={(e) => setFatherName(e.target.value)}
                  placeholder="পিতার পুরো নাম"
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl px-3 py-2 focus:border-[#1E4D2B] focus:bg-white outline-none font-bold text-slate-800 text-[10px]"
                />
              </div>
              <div>
                <label className="block text-[9px] font-extrabold text-gray-700 mb-1">
                  মাতার নাম (Mother's Name)
                </label>
                <input
                  type="text"
                  value={motherName}
                  onChange={(e) => setMotherName(e.target.value)}
                  placeholder="মাতার পুরো নাম"
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl px-3 py-2 focus:border-[#1E4D2B] focus:bg-white outline-none font-bold text-slate-800 text-[10px]"
                />
              </div>
            </div>

            {/* DOB & Gender */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-extrabold text-gray-700 mb-1">
                  জন্মতারিখ (Date of Birth) <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center bg-slate-50 border border-gray-300 rounded-xl px-3 py-1.5">
                  <Calendar className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                  <input
                    type="date"
                    value={dateOfBirth}
                    onChange={(e) => setDateOfBirth(e.target.value)}
                    className="w-full bg-transparent outline-none font-bold text-slate-800 text-[10px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-extrabold text-gray-700 mb-1">
                  লিঙ্গ (Gender) <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-2">
                  {(['পুরুষ', 'নারী', 'অন্যান্য'] as const).map((g) => (
                    <button
                      key={g}
                      type="button"
                      onClick={() => setGender(g)}
                      className={`flex-1 py-2 rounded-xl font-bold text-[9.5px] border transition-all cursor-pointer ${
                        gender === g ? 'bg-[#1E4D2B] text-white border-[#1E4D2B] shadow-xs' : 'bg-slate-50 text-gray-700 border-gray-300 hover:bg-gray-100'
                      }`}
                    >
                      {g}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Phone & Email */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[9px] font-extrabold text-gray-700 mb-1">
                  মোবাইল নম্বর <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center bg-slate-50 border border-gray-300 rounded-xl px-3 py-2 focus-within:border-[#1E4D2B] focus-within:bg-white transition-all">
                  <Phone className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="01800-000000"
                    className="w-full bg-transparent outline-none font-bold text-slate-800 text-[11px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-extrabold text-gray-700 mb-1">
                  ইমেইল এড্রেস (ঐচ্ছিক)
                </label>
                <div className="flex items-center bg-slate-50 border border-gray-300 rounded-xl px-3 py-2 focus-within:border-[#1E4D2B] focus-within:bg-white transition-all">
                  <Mail className="w-4 h-4 text-gray-400 mr-2 shrink-0" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@gmail.com"
                    className="w-full bg-transparent outline-none font-bold text-slate-800 text-[10px]"
                  />
                </div>
              </div>
            </div>

            {/* Overview / Bio */}
            <div>
              <label className="block text-[9px] font-extrabold text-gray-700 mb-1">
                নিজের অভিজ্ঞতা ও সেবার বিস্তারিত বিবরণ ("Overview" / "About Me" Bio)
              </label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={3}
                placeholder="আপনার কাজের অভিজ্ঞতা, বিশেষ দক্ষতা ও গ্রাহক সেবার প্রতিশ্রুতি বিস্তারিত লিখুন..."
                className="w-full bg-slate-50 border border-gray-300 rounded-xl p-2.5 focus:border-[#1E4D2B] focus:bg-white outline-none font-medium text-slate-800 text-[10px] leading-relaxed"
              />
            </div>
          </div>
        )}

        {/* ================= STEP 2: Multi-Skill Matrix (1,000+ Master Professions) ================= */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-2 flex items-center justify-between">
              <span className="font-extrabold text-xs sm:text-sm text-gray-900 flex items-center gap-2">
                <Layers className="w-4 h-4 text-[#1E4D2B]" /> মাল্টি-স্কিল মেট্রিক্স (১,০০০+ পেশা ও দক্ষতা সিলেক্টর)
              </span>
              <span className="text-[8.5px] bg-emerald-100 text-[#1E4D2B] px-2.5 py-0.5 rounded-full font-black">ধাপ ২/৫</span>
            </div>

            <div className="bg-emerald-50/70 p-3 rounded-2xl border border-emerald-200 text-[9.5px] text-emerald-950 flex items-center justify-between">
              <div>
                <span className="font-extrabold block text-[#1E4D2B]">আপনি একাধিক পেশা ও দক্ষতা একসাথে নির্বাচন করতে পারেন</span>
                <span>ডাক্তার, ইঞ্জিনিয়ার, ইলেকট্রিশিয়ান থেকে শুরু করে ড্রাইভার, মেকানিক, দর্জি, গৃহকর্মী ও কায়িক শ্রম — সব পেশা অন্তর্ভুক্ত।</span>
              </div>
              <span className="bg-[#1E4D2B] text-white px-2.5 py-1 rounded-xl font-black text-xs shrink-0 ml-2">
                {selectedSkills.length}টি নির্বাচিত
              </span>
            </div>

            {/* Selected Skills Chips */}
            {selectedSkills.length > 0 && (
              <div className="bg-slate-50 p-3 rounded-2xl border border-gray-200 space-y-1.5">
                <span className="text-[9px] font-black text-gray-700 block">আপনার নির্বাচিত দক্ষতাসমূহ:</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSkills.map((sk) => (
                    <span 
                      key={sk} 
                      className="bg-[#1E4D2B] text-white text-[9px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-xs"
                    >
                      <Check className="w-3 h-3 text-amber-300" />
                      <span>{sk}</span>
                      <button
                        type="button"
                        onClick={() => toggleSkill(sk)}
                        className="ml-1 hover:text-rose-300 cursor-pointer"
                        title="বাতিল করুন"
                      >
                        ✕
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Primary Profession Selector */}
            <div>
              <label className="block text-[9.5px] font-extrabold text-gray-800 mb-1">
                প্রধান পেশা (Primary Job Title) <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedPrimaryJob}
                onChange={(e) => setSelectedPrimaryJob(e.target.value)}
                className="w-full bg-slate-50 border border-gray-300 rounded-xl px-3 py-2 outline-none font-bold text-slate-800 text-[10.5px] focus:border-[#1E4D2B] cursor-pointer"
              >
                {selectedSkills.map((sk) => (
                  <option key={sk} value={sk}>{sk} (নির্বাচিতদের মধ্যে)</option>
                ))}
                {ALL_PROFESSIONS_FLAT_LIST.slice(0, 50).map((p) => (
                  <option key={p.name} value={p.name}>{p.name} ({p.category})</option>
                ))}
              </select>
            </div>

            {/* Search Input for 1000+ Professions */}
            <div className="space-y-2">
              <label className="block text-[9.5px] font-extrabold text-gray-800">
                ১,০০০+ পেশা ও দক্ষতার তালিকা থেকে খুঁজুন ও নির্বাচন করুন:
              </label>
              
              <div className="flex items-center bg-white border-2 border-emerald-300 rounded-2xl px-3 py-2 shadow-xs focus-within:border-[#1E4D2B]">
                <Search className="w-4 h-4 text-[#1E4D2B] mr-2 shrink-0" />
                <input
                  type="text"
                  value={skillSearchQuery}
                  onChange={(e) => setSkillSearchQuery(e.target.value)}
                  placeholder="পেশা বা স্কিলের নাম লিখুন (যেমন: ডাক্তার, মেকানিক, জাদুকর, ড্রাইভার, রাজমিস্ত্রি, টেইলার)..."
                  className="w-full bg-transparent outline-none font-bold text-slate-800 text-[10px]"
                />
                {skillSearchQuery && (
                  <button onClick={() => setSkillSearchQuery('')} className="text-gray-400 hover:text-gray-600">✕</button>
                )}
              </div>

              {/* Industry Category Filter Tabs */}
              <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
                <button
                  type="button"
                  onClick={() => setSelectedCategoryTab('all')}
                  className={`px-3 py-1.5 rounded-xl font-extrabold text-[8.5px] shrink-0 transition-all cursor-pointer ${
                    selectedCategoryTab === 'all' 
                      ? 'bg-[#1E4D2B] text-white shadow-xs' 
                      : 'bg-slate-100 text-gray-700 hover:bg-slate-200'
                  }`}
                >
                  সব ক্যাটাগরি ({ALL_PROFESSIONS_FLAT_LIST.length})
                </button>
                {MASTER_PROFESSION_CATEGORIES.map((cat) => (
                  <button
                    key={cat.categoryBn}
                    type="button"
                    onClick={() => setSelectedCategoryTab(cat.categoryBn)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-[8.5px] shrink-0 transition-all cursor-pointer ${
                      selectedCategoryTab === cat.categoryBn 
                        ? 'bg-[#1E4D2B] text-white shadow-xs' 
                        : 'bg-slate-100 text-gray-700 hover:bg-slate-200'
                    }`}
                  >
                    {cat.categoryBn}
                  </button>
                ))}
              </div>

              {/* Grid of searchable professions */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-56 overflow-y-auto p-2 bg-slate-50 border border-gray-200 rounded-2xl">
                {filteredMasterProfessions.map((prof) => {
                  const isSelected = selectedSkills.includes(prof.name);
                  return (
                    <button
                      key={prof.name}
                      type="button"
                      onClick={() => toggleSkill(prof.name)}
                      className={`p-2 rounded-xl text-left text-[9px] font-bold transition-all cursor-pointer flex items-center justify-between border ${
                        isSelected 
                          ? 'bg-emerald-100 border-[#1E4D2B] text-[#1E4D2B] shadow-xs' 
                          : 'bg-white border-gray-200 hover:border-emerald-300 text-gray-800'
                      }`}
                    >
                      <span className="line-clamp-1">{prof.name}</span>
                      <span className={`w-4 h-4 rounded-md flex items-center justify-center text-[10px] shrink-0 ml-1 ${
                        isSelected ? 'bg-[#1E4D2B] text-white font-black' : 'border border-gray-300'
                      }`}>
                        {isSelected ? '✓' : '+'}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Skill Manually */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={customSkillInput}
                  onChange={(e) => setCustomSkillInput(e.target.value)}
                  placeholder="তালিকায় না থাকলে নিজের বিশেষ দক্ষতা নিজে লিখে যোগ করুন..."
                  className="flex-1 bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-[9px] outline-none focus:border-[#1E4D2B]"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSkill}
                  className="bg-[#1E4D2B] hover:bg-[#2A653B] text-white font-bold text-[9px] px-3.5 py-1.5 rounded-xl cursor-pointer shadow-xs"
                >
                  + যুক্ত করুন
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 3: Professional Credentials & Portfolio (Upwork/Fiverr Style) ================= */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-2 flex items-center justify-between">
              <span className="font-extrabold text-xs sm:text-sm text-gray-900 flex items-center gap-2">
                <Award className="w-4 h-4 text-amber-600" /> প্রফেশনাল ক্রেডেনশিয়াল ও পোর্টফোলিও শোকেস
              </span>
              <span className="text-[8.5px] bg-emerald-100 text-[#1E4D2B] px-2.5 py-0.5 rounded-full font-black">ধাপ ৩/৫</span>
            </div>

            {/* Sub-Tabs: Education, Experience, Certifications, Portfolio Projects, Other */}
            <div className="flex gap-1 bg-slate-100 p-1 rounded-2xl overflow-x-auto no-scrollbar">
              {[
                { id: 'portfolio', label: `পোর্টফোলিও কাজ (${portfolioItems.length})`, icon: ImageIcon },
                { id: 'education', label: `শিক্ষাগত যোগ্যতা (${educations.length})`, icon: GraduationCap },
                { id: 'experience', label: `কাজের অভিজ্ঞতা (${employments.length})`, icon: Building },
                { id: 'certifications', label: `সনদপত্র (${certifications.length})`, icon: FileCheck },
                { id: 'other', label: `অন্যান্য অভিজ্ঞতা (${otherExperiences.length})`, icon: Globe }
              ].map((tab) => {
                const IconComp = tab.icon;
                const isActive = activeCredTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveCredTab(tab.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-[9px] font-extrabold flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-white text-slate-900 shadow-sm font-black' 
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <IconComp className={`w-3.5 h-3.5 ${isActive ? 'text-[#1E4D2B]' : 'text-gray-400'}`} />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* --- SUB-TAB 1: PORTFOLIO WORK SAMPLES --- */}
            {activeCredTab === 'portfolio' && (
              <div className="space-y-3">
                <span className="text-[9.5px] font-black text-gray-800 block">
                  পূর্বে সম্পন্ন করা প্রজেক্ট বা কাজের ছবি ও বিবরণ (Fiverr Showcase Gallery)
                </span>

                {/* Portfolio items list */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {portfolioItems.map((item) => (
                    <div key={item.id} className="bg-slate-50 border border-gray-200 rounded-2xl overflow-hidden p-2.5 space-y-2 relative group">
                      <img src={item.imageUrl} alt={item.title} className="w-full h-24 object-cover rounded-xl" />
                      <div>
                        <h4 className="font-extrabold text-[10px] text-slate-900 leading-tight">{item.title}</h4>
                        <p className="text-[8.5px] text-gray-600 line-clamp-2 mt-0.5">{item.description}</p>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                        <span className="text-[7.5px] text-[#1E4D2B] font-bold">✓ {item.completionDate || '২০২৬'}</span>
                        <button
                          type="button"
                          onClick={() => handleRemovePortfolio(item.id)}
                          className="text-rose-500 hover:text-rose-700 text-[8px] font-bold"
                        >
                          মুছে ফেলুন
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add new portfolio item form */}
                <div className="bg-emerald-50/60 p-3 rounded-2xl border border-emerald-200 space-y-2">
                  <span className="text-[9px] font-extrabold text-[#1E4D2B] block">+ নতুন প্রজেক্ট স্যাম্পল যুক্ত করুন:</span>
                  <input
                    type="text"
                    value={newPortTitle}
                    onChange={(e) => setNewPortTitle(e.target.value)}
                    placeholder="প্রজেক্ট বা কাজের নাম (যেমন: ৫ তলা ভবনের সোলার সেটআপ)"
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-[9.5px] outline-none font-bold"
                  />
                  <textarea
                    value={newPortDesc}
                    onChange={(e) => setNewPortDesc(e.target.value)}
                    rows={2}
                    placeholder="কাজের সংক্ষিপ্ত বিবরণ ও ফলাফল..."
                    className="w-full bg-white border border-gray-300 rounded-xl p-2 text-[9px] outline-none"
                  />
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newPortImageUrl}
                      onChange={(e) => setNewPortImageUrl(e.target.value)}
                      placeholder="কাজের ছবির ইমেজ URL লিংক..."
                      className="flex-1 bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-[9px] outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleAddPortfolio}
                      className="bg-[#1E4D2B] hover:bg-[#2A653B] text-white text-[9px] font-black px-4 py-1.5 rounded-xl cursor-pointer"
                    >
                      + পোর্টফোলিওতে যোগ করুন
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* --- SUB-TAB 2: EDUCATION --- */}
            {activeCredTab === 'education' && (
              <div className="space-y-3">
                <span className="text-[9.5px] font-black text-gray-800 block">
                  শিক্ষাগত ডিগ্রি ও প্রতিষ্ঠান (Degrees, Institutions & Passing Years)
                </span>

                <div className="space-y-2">
                  {educations.map((edu) => (
                    <div key={edu.id} className="p-3 bg-slate-50 border border-gray-200 rounded-2xl flex items-center justify-between">
                      <div>
                        <h4 className="font-extrabold text-[10.5px] text-slate-900">{edu.degree}</h4>
                        <p className="text-[9px] text-gray-600">{edu.institution} • পাশের সাল: {edu.passingYear} {edu.fieldOfStudy ? `(${edu.fieldOfStudy})` : ''}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveEducation(edu.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-gray-200 space-y-2">
                  <span className="text-[9px] font-extrabold text-gray-800 block">+ শিক্ষাগত তথ্য যোগ করুন:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newDegree}
                      onChange={(e) => setNewDegree(e.target.value)}
                      placeholder="ডিগ্রির নাম (যেমন: ডিপ্লোমা ইন ইলেকট্রিক্যাল / SSC / HSC / MBBS)"
                      className="bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-[9px] font-bold outline-none"
                    />
                    <input
                      type="text"
                      value={newInstitution}
                      onChange={(e) => setNewInstitution(e.target.value)}
                      placeholder="শিক্ষা প্রতিষ্ঠান / বোর্ডের নাম"
                      className="bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-[9px] font-bold outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newPassingYear}
                      onChange={(e) => setNewPassingYear(e.target.value)}
                      placeholder="পাশের বছর (যেমন: ২০২১)"
                      className="bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-[9px] outline-none"
                    />
                    <input
                      type="text"
                      value={newFieldOfStudy}
                      onChange={(e) => setNewFieldOfStudy(e.target.value)}
                      placeholder="মেজর / বিভাগ (ঐচ্ছিক)"
                      className="bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-[9px] outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddEducation}
                    className="bg-[#1E4D2B] hover:bg-[#2A653B] text-white text-[9px] font-bold px-4 py-1.5 rounded-xl cursor-pointer"
                  >
                    + ডিগ্রি যুক্ত করুন
                  </button>
                </div>
              </div>
            )}

            {/* --- SUB-TAB 3: EMPLOYMENT EXPERIENCE --- */}
            {activeCredTab === 'experience' && (
              <div className="space-y-3">
                <span className="text-[9.5px] font-black text-gray-800 block">
                  চাকরির ইতিহাস ও পূর্ব অভিজ্ঞতা (Past Employment & Work Experience)
                </span>

                <div className="space-y-2">
                  {employments.map((emp) => (
                    <div key={emp.id} className="p-3 bg-slate-50 border border-gray-200 rounded-2xl flex items-start justify-between">
                      <div>
                        <h4 className="font-extrabold text-[10.5px] text-slate-900">{emp.designation}</h4>
                        <p className="text-[9px] text-[#1E4D2B] font-bold">{emp.company} • {emp.duration}</p>
                        {emp.description && <p className="text-[8.5px] text-gray-600 mt-1">{emp.description}</p>}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveEmployment(emp.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-gray-200 space-y-2">
                  <span className="text-[9px] font-extrabold text-gray-800 block">+ চাকরির অভিজ্ঞতা যোগ করুন:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newCompany}
                      onChange={(e) => setNewCompany(e.target.value)}
                      placeholder="প্রতিষ্ঠান / কোম্পানি / ওয়ার্কশপ"
                      className="bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-[9px] font-bold outline-none"
                    />
                    <input
                      type="text"
                      value={newDesignation}
                      onChange={(e) => setNewDesignation(e.target.value)}
                      placeholder="পদবী (যেমন: সিনিয়র টেকনিশিয়ান / ফোরম্যান)"
                      className="bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-[9px] font-bold outline-none"
                    />
                  </div>
                  <input
                    type="text"
                    value={newDuration}
                    onChange={(e) => setNewDuration(e.target.value)}
                    placeholder="কাজের মেয়াদ (যেমন: ২০১৯ - ২০২২)"
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-[9px] outline-none"
                  />
                  <textarea
                    value={newJobDesc}
                    onChange={(e) => setNewJobDesc(e.target.value)}
                    rows={2}
                    placeholder="দায়িত্ব ও কাজের বিবরণ..."
                    className="w-full bg-white border border-gray-300 rounded-xl p-2 text-[9px] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddEmployment}
                    className="bg-[#1E4D2B] hover:bg-[#2A653B] text-white text-[9px] font-bold px-4 py-1.5 rounded-xl cursor-pointer"
                  >
                    + অভিজ্ঞতা যোগ করুন
                  </button>
                </div>
              </div>
            )}

            {/* --- SUB-TAB 4: CERTIFICATIONS --- */}
            {activeCredTab === 'certifications' && (
              <div className="space-y-3">
                <span className="text-[9.5px] font-black text-gray-800 block">
                  পেশাদার সনদপত্র ও লাইসেন্স (Professional Licenses & Certifications)
                </span>

                <div className="space-y-2">
                  {certifications.map((cert) => (
                    <div key={cert.id} className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <ShieldCheck className="w-5 h-5 text-[#1E4D2B] shrink-0" />
                        <div>
                          <h4 className="font-extrabold text-[10px] text-slate-900">{cert.title}</h4>
                          <p className="text-[8.5px] text-gray-600">{cert.issuer} • সাল: {cert.year} {cert.credentialId ? `(আইডি: ${cert.credentialId})` : ''}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveCertification(cert.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-gray-200 space-y-2">
                  <span className="text-[9px] font-extrabold text-gray-800 block">+ নতুন সার্টিফিকেট যোগ করুন:</span>
                  <input
                    type="text"
                    value={newCertTitle}
                    onChange={(e) => setNewCertTitle(e.target.value)}
                    placeholder="সার্টিফিকেটের নাম (যেমন: ড্রাইভিং লাইসেন্স / TTC ভোকেশনাল সার্টিফিকেট)"
                    className="w-full bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-[9px] font-bold outline-none"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newCertIssuer}
                      onChange={(e) => setNewCertIssuer(e.target.value)}
                      placeholder="ইস্যুকারী প্রতিষ্ঠান / বোর্ড"
                      className="bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-[9px] outline-none"
                    />
                    <input
                      type="text"
                      value={newCredentialId}
                      onChange={(e) => setNewCredentialId(e.target.value)}
                      placeholder="লাইসেন্স / সার্টিফিকেট আইডি নং"
                      className="bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-[9px] outline-none"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleAddCertification}
                    className="bg-[#1E4D2B] hover:bg-[#2A653B] text-white text-[9px] font-bold px-4 py-1.5 rounded-xl cursor-pointer"
                  >
                    + সার্টিফিকেট যোগ করুন
                  </button>
                </div>
              </div>
            )}

            {/* --- SUB-TAB 5: OTHER EXPERIENCES & LANGUAGES --- */}
            {activeCredTab === 'other' && (
              <div className="space-y-3">
                <span className="text-[9.5px] font-black text-gray-800 block">
                  অন্যান্য বিশেষ দক্ষতা, ভাষা ও প্রশিক্ষণ (Other Skills, Languages & Special Training)
                </span>

                <div className="space-y-2">
                  {otherExperiences.map((oth) => (
                    <div key={oth.id} className="p-3 bg-slate-50 border border-gray-200 rounded-2xl flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h4 className="font-extrabold text-[10px] text-slate-900">{oth.title}</h4>
                          <span className="text-[8px] bg-amber-100 text-amber-800 px-2 py-0.2 rounded-md font-bold">{oth.category}</span>
                        </div>
                        <p className="text-[8.5px] text-gray-600 mt-0.5">{oth.description}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveOtherExp(oth.id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg cursor-pointer shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="bg-slate-50 p-3 rounded-2xl border border-gray-200 space-y-2">
                  <span className="text-[9px] font-extrabold text-gray-800 block">+ অতিরিক্ত অভিজ্ঞতা যোগ করুন:</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={newOtherTitle}
                      onChange={(e) => setNewOtherTitle(e.target.value)}
                      placeholder="অভিজ্ঞতার শিরোনাম (যেমন: পাহাড়ি ভাষায় পারদর্শিতা)"
                      className="bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-[9px] font-bold outline-none"
                    />
                    <input
                      type="text"
                      value={newOtherCategory}
                      onChange={(e) => setNewOtherCategory(e.target.value)}
                      placeholder="ক্যাটাগরি (যেমন: ভাষা / টুলস / নিরাপত্তা)"
                      className="bg-white border border-gray-300 rounded-xl px-3 py-1.5 text-[9px] outline-none"
                    />
                  </div>
                  <textarea
                    value={newOtherDesc}
                    onChange={(e) => setNewOtherDesc(e.target.value)}
                    rows={2}
                    placeholder="বিস্তারিত বিবরণ..."
                    className="w-full bg-white border border-gray-300 rounded-xl p-2 text-[9px] outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleAddOtherExp}
                    className="bg-[#1E4D2B] hover:bg-[#2A653B] text-white text-[9px] font-bold px-4 py-1.5 rounded-xl cursor-pointer"
                  >
                    + অভিজ্ঞতা যোগ করুন
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= STEP 4: Hyper-Local Service Area Mapping ================= */}
        {step === 4 && (
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-2 flex items-center justify-between">
              <span className="font-extrabold text-xs sm:text-sm text-gray-900 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#1E4D2B]" /> হাইপার-লোকাল সার্ভিস এলাকা ও কর্মক্ষেত্র ম্যাপিং
              </span>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[9px] font-mono font-bold text-emerald-800">
                  <span>UID: {previewUID}</span>
                </div>
                <span className="text-[8.5px] bg-emerald-100 text-[#1E4D2B] px-2.5 py-0.5 rounded-full font-black">ধাপ ৪/৫</span>
              </div>
            </div>

            {/* Division, District & Upazila Cascading Dropdowns */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Division */}
              <div>
                <label className="block text-[9.5px] font-extrabold text-gray-800 mb-1">
                  বিভাগ <span className="text-rose-500">*</span>
                </label>
                <select
                  value={division}
                  onChange={(e) => handleDivisionChange(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl px-3 py-2 outline-none font-bold text-slate-800 text-[10.5px] focus:border-[#1E4D2B] cursor-pointer"
                >
                  {divisions.map((d) => (
                    <option key={d.code} value={d.nameBn}>{d.nameBn} ({d.code})</option>
                  ))}
                </select>
              </div>

              {/* District */}
              <div>
                <label className="block text-[9.5px] font-extrabold text-gray-800 mb-1">
                  জেলা <span className="text-rose-500">*</span>
                </label>
                <select
                  value={district}
                  onChange={(e) => handleDistrictChange(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl px-3 py-2 outline-none font-bold text-slate-800 text-[10.5px] focus:border-[#1E4D2B] cursor-pointer"
                >
                  {districts.map((d) => (
                    <option key={d.code} value={d.nameBn}>{d.nameBn} ({d.code})</option>
                  ))}
                </select>
              </div>

              {/* Upazila */}
              <div>
                <label className="block text-[9.5px] font-extrabold text-gray-800 mb-1">
                  উপজেলা / থানা <span className="text-rose-500">*</span>
                </label>
                <select
                  value={upazila}
                  onChange={(e) => setUpazila(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl px-3 py-2 outline-none font-bold text-slate-800 text-[10.5px] focus:border-[#1E4D2B] cursor-pointer"
                >
                  {upazilas.map((u) => (
                    <option key={u.code} value={u.nameBn}>{u.nameBn} ({u.code})</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Area / Mahalla */}
            <div>
              <label className="block text-[9.5px] font-extrabold text-gray-800 mb-1">
                প্রধান পাড়া / মহল্লা / গ্রাম (Main Work Base) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="যেমন: শান্তিনগর / মধূপুর বাজার / কলেজ রোড / বনরুপা"
                className="w-full bg-slate-50 border border-gray-300 rounded-xl px-3 py-2 focus:border-[#1E4D2B] focus:bg-white outline-none font-bold text-slate-800 text-[10.5px]"
              />
              <span className="text-[8px] text-gray-500 mt-0.5 block">
                * ক্লায়েন্টরা যখন তাদের নিজস্ব পাড়া বা মহল্লা সিলেক্ট করে সার্চ করবে, তখন আপনার প্রোফাইল অগ্রাধিকার পাবে।
              </span>
            </div>

            {/* Service Area Radius */}
            <div className="bg-slate-50 p-3 rounded-2xl border border-gray-200 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[9.5px] font-extrabold text-gray-800 flex items-center gap-1.5">
                  <Compass className="w-4 h-4 text-[#1E4D2B]" /> কাজের পরিধি / সার্ভিস ব্যাসার্ধ (Service Radius)
                </label>
                <span className="text-[9.5px] font-black text-[#1E4D2B] bg-emerald-100 px-2.5 py-0.5 rounded-full">
                  {serviceRadiusKm} কি.মি. এলাকা কভার
                </span>
              </div>
              <input
                type="range"
                min="2"
                max="50"
                step="2"
                value={serviceRadiusKm}
                onChange={(e) => setServiceRadiusKm(Number(e.target.value))}
                className="w-full accent-[#1E4D2B] cursor-pointer"
              />
              <div className="flex justify-between text-[7.5px] text-gray-500 font-bold">
                <span>২ কিমি (লোকাল পাড়া)</span>
                <span>১৫ কিমি (সদর ও পার্শ্ববর্তী ইউনিয়ন)</span>
                <span>৫০ কিমি (সমগ্র জেলা)</span>
              </div>
            </div>

            {/* Covered Neighboring Paras / Bazars */}
            <div>
              <label className="block text-[9.5px] font-extrabold text-gray-800 mb-1">
                যেসব পাড়া, বাজার ও গ্রামে গিয়ে অন-ডিমান্ড সেবা দিতে প্রস্তুত (কমা দিয়ে লিখুন)
              </label>
              <input
                type="text"
                value={coveredParas}
                onChange={(e) => setCoveredParas(e.target.value)}
                placeholder="যেমন: শান্তিনগর, কলেজ রোড, মিলনপুর, বাজার এলাকা, চেঙ্গী ব্রিজ"
                className="w-full bg-slate-50 border border-gray-300 rounded-xl px-3 py-2 focus:border-[#1E4D2B] focus:bg-white outline-none font-medium text-slate-800 text-[10px]"
              />
            </div>

            {/* Rate & Experience */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <label className="block text-[9px] font-extrabold text-gray-700 mb-1">
                  কাজের মোট অভিজ্ঞতা
                </label>
                <select
                  value={experience}
                  onChange={(e) => setExperience(e.target.value)}
                  className="w-full bg-slate-50 border border-gray-300 rounded-xl px-3 py-2 outline-none font-bold text-slate-800 text-[10px] focus:border-[#1E4D2B] cursor-pointer"
                >
                  <option value="১-২ বছর">১-২ বছর</option>
                  <option value="৩-৪ বছর">৩-৪ বছর</option>
                  <option value="৫+ বছর (অভিজ্ঞ)">৫+ বছর (অভিজ্ঞ)</option>
                  <option value="১০+ বছর (মাস্টার কারিগর)">১০+ বছর (মাস্টার কারিগর)</option>
                </select>
              </div>

              <div>
                <label className="block text-[9px] font-extrabold text-gray-700 mb-1">
                  পারিশ্রমিকের ধরন ও পরিমাণ <span className="text-rose-500">*</span>
                </label>
                <div className="flex gap-1.5">
                  <select
                    value={rateType}
                    onChange={(e) => setRateType(e.target.value as any)}
                    className="bg-slate-50 border border-gray-300 rounded-xl px-2 py-2 text-[9px] font-bold text-slate-800 outline-none"
                  >
                    <option value="দৈনিক">দৈনিক</option>
                    <option value="ঘণ্টাভিত্তিক">ঘণ্টাভিত্তিক</option>
                    <option value="চুক্তিভিত্তিক">চুক্তিভিত্তিক</option>
                    <option value="ভিজিট ফি">ভিজিট ফি</option>
                  </select>
                  <div className="flex-1 flex items-center bg-slate-50 border border-gray-300 rounded-xl px-2.5 py-1.5 focus-within:border-[#1E4D2B]">
                    <span className="text-gray-500 font-bold text-[10px] mr-1">৳</span>
                    <input
                      type="text"
                      value={rateAmount}
                      onChange={(e) => setRateAmount(e.target.value)}
                      placeholder="৮০০"
                      className="w-full bg-transparent outline-none font-bold text-slate-800 text-[10px]"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= STEP 5: Identity Verification & 100 BDT Activation Fee ================= */}
        {step === 5 && (
          <div className="space-y-4">
            <div className="border-b border-gray-100 pb-2 flex items-center justify-between">
              <span className="font-extrabold text-xs sm:text-sm text-gray-900 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" /> এনআইডি (NID) ভেরিফিকেশন ও ১০০ টাকা অ্যাক্টিভেশন ফি
              </span>
              <span className="text-[8.5px] bg-emerald-100 text-[#1E4D2B] px-2.5 py-0.5 rounded-full font-black">ধাপ ৫/৫</span>
            </div>

            {/* Mandatory NID Card Dual-Side Upload */}
            <div className="bg-slate-50 p-3.5 rounded-2xl border border-gray-200 space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-[9.5px] font-extrabold text-gray-800">
                  জাতীয় পরিচয়পত্র (NID) নম্বর <span className="text-rose-500">*</span>
                </label>
                <span className="text-[8px] text-gray-500 font-bold">১০ বা ১৭ ডিজিট</span>
              </div>
              <input
                type="text"
                value={nidNumber}
                onChange={(e) => setNidNumber(e.target.value)}
                placeholder="যেমন: 19951234567890123"
                className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 font-mono font-bold text-slate-800 text-[11px] outline-none focus:border-emerald-600"
              />

              <div className="grid grid-cols-2 gap-3 pt-1">
                {/* NID Front */}
                <div className="bg-white p-2.5 rounded-xl border border-dashed border-gray-300 text-center space-y-1.5">
                  <span className="text-[8.5px] font-extrabold text-gray-700 block">NID সামনের পাতা (Front)</span>
                  <img src={nidFrontUrl} alt="NID Front" className="w-full h-16 object-cover rounded-lg" />
                  <span className="text-[8px] text-emerald-700 font-bold block">✓ সামনের ছবি আপলোড সম্পন্ন</span>
                </div>
                {/* NID Back */}
                <div className="bg-white p-2.5 rounded-xl border border-dashed border-gray-300 text-center space-y-1.5">
                  <span className="text-[8.5px] font-extrabold text-gray-700 block">NID পেছনের পাতা (Back)</span>
                  <img src={nidBackUrl} alt="NID Back" className="w-full h-16 object-cover rounded-lg" />
                  <span className="text-[8px] text-emerald-700 font-bold block">✓ পেছনের ছবি আপলোড সম্পন্ন</span>
                </div>
              </div>
            </div>

            {/* 100 BDT Activation Fee Payment Gateway Simulation */}
            <div className="bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-100/60 p-4 rounded-3xl border-2 border-emerald-300 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-2xl bg-[#1E4D2B] text-amber-300 flex items-center justify-center font-black text-sm shadow-xs">
                    ৳
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-emerald-950">১০০ টাকা প্রোভাইডার অ্যাক্টিভেশন ফি</h4>
                    <p className="text-[8.5px] text-emerald-800">অফিসিয়াল ইউনিক আইডি [S-DIST-XXX] ও ভেরিফাইড প্রো ব্যাজ [✓] প্রাপ্তির জন্য</p>
                  </div>
                </div>
                <span className="bg-[#1E4D2B] text-white font-black text-xs px-3 py-1.5 rounded-xl shadow-xs">
                  ৳ ১০০
                </span>
              </div>

              {/* Payment Method Selector */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bKash')}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-[9.5px] border transition-all cursor-pointer ${
                    paymentMethod === 'bKash' ? 'bg-[#E2136E] text-white border-[#E2136E] shadow-sm' : 'bg-white text-gray-700 border-gray-300'
                  }`}
                >
                  বিকাশ (bKash)
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('Nagad')}
                  className={`flex-1 py-2.5 rounded-xl font-bold text-[9.5px] border transition-all cursor-pointer ${
                    paymentMethod === 'Nagad' ? 'bg-[#F7931E] text-white border-[#F7931E] shadow-sm' : 'bg-white text-gray-700 border-gray-300'
                  }`}
                >
                  নগদ (Nagad)
                </button>
              </div>

              {/* Payment Instruction Guide */}
              <div className="bg-white/95 p-3 rounded-2xl text-[9px] text-slate-800 space-y-1 font-medium border border-emerald-200">
                <p>১. আপনার বিকাশ বা নগদ অ্যাপ থেকে <strong>Send Money</strong> অথবা <strong>Payment</strong> করুন।</p>
                <p>২. অফিশিয়াল মার্চেন্ট একাউন্ট: <strong className="text-[#1E4D2B] font-mono text-[10.5px]">01870592699</strong> (ঝাদিমাদি হেল্পলাইন)</p>
                <p>৩. টাকার পরিমাণ: <strong>১০০ টাকা</strong></p>
                <p>৪. পেমেন্ট শেষে প্রাপ্ত <strong>TrxID</strong> নিচে লিখে যাচাই সম্পন্ন করুন।</p>
              </div>

              {/* TrxID Input & Instant Verify Button */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={trxId}
                  onChange={(e) => setTrxId(e.target.value)}
                  placeholder="যেমন: 9K8X2M7P"
                  className="flex-1 bg-white border border-emerald-400 rounded-xl px-3 py-2 font-mono font-bold text-slate-800 text-[11px] outline-none"
                />
                <button
                  type="button"
                  onClick={handleConfirmPaymentSim}
                  disabled={isVerifyingPayment}
                  className="bg-[#1E4D2B] hover:bg-[#2A653B] text-white font-black text-[9.5px] px-4 py-2 rounded-xl cursor-pointer shadow-xs shrink-0 flex items-center gap-1 disabled:opacity-50"
                >
                  {isVerifyingPayment ? 'যাচাই হচ্ছে...' : isPaymentConfirmed ? 'যাচাই সম্পন্ন [✓]' : 'ফি ভেরিফাই'}
                </button>
              </div>

              {isPaymentConfirmed && (
                <div className="p-2.5 bg-emerald-100 text-emerald-900 rounded-xl text-[9px] font-bold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>১০০ টাকা ফি পেমেন্ট সফল হয়েছে! ইউনিক প্রোভাইডার আইডি জেনারেট হচ্ছে।</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= STEP 6: Confirmation & Official ID Card (Phase 4 Format) ================= */}
        {step === 6 && registeredResult && (
          <div className="text-center py-4 space-y-4">
            <div className="w-16 h-16 bg-emerald-100 text-[#1E4D2B] rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="bg-amber-100 text-amber-900 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-wider">
                সার্ভিস প্রোভাইডার আইডি অ্যাক্টিভেশন সম্পন্ন
              </span>
              <h3 className="text-lg font-black text-slate-900 mt-2">
                অভিনন্দন, {registeredResult.name}!
              </h3>
              <p className="text-[10px] text-gray-600 max-w-md mx-auto mt-0.5">
                আপনার এনআইডি ভেরিফিকেশন ও ১০০ টাকা ফি যাচাই সম্পন্ন হয়েছে। আপনার গ্লোবাল পোর্টফোলিও এখন ঝাদিমাদি সার্চ ইঞ্জিনে লাইভ!
              </p>
            </div>

            {/* Unique ID ID Card (Format: S-[District Code]-[Serial]) */}
            <div className="bg-gradient-to-br from-slate-950 via-[#1E4D2B] to-slate-900 text-white p-5 rounded-3xl shadow-2xl max-w-md mx-auto text-left relative overflow-hidden border-2 border-emerald-400/50">
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none"></div>

              <div className="flex items-center justify-between border-b border-white/15 pb-3 mb-3.5">
                <div className="flex items-center gap-3">
                  <img src={registeredResult.img} alt={registeredResult.name} className="w-11 h-11 rounded-full object-cover border-2 border-amber-300" />
                  <div>
                    <h4 className="font-black text-sm text-white leading-tight flex items-center gap-1.5">
                      {registeredResult.name}
                      <ShieldCheck className="w-4 h-4 text-amber-300 fill-amber-300" />
                    </h4>
                    <span className="text-[9px] text-emerald-200 font-bold block">{registeredResult.professionalHeadline || registeredResult.job}</span>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[7.5px] text-emerald-300 block uppercase font-bold">অফিসিয়াল ট্র্যাকিং আইডি</span>
                  <span className="text-base font-mono font-black text-amber-300 tracking-wider">
                    {registeredResult.uniqueId}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-[8.5px] text-emerald-100">
                <div>
                  <span className="text-gray-300 block">কভারেজ এলাকা:</span>
                  <span className="font-bold text-white">{registeredResult.area}, {registeredResult.upazila}</span>
                </div>
                <div>
                  <span className="text-gray-300 block">জেলা ও উপজেলা:</span>
                  <span className="font-bold text-white">{registeredResult.district}, {registeredResult.upazila}</span>
                </div>
                <div>
                  <span className="text-gray-300 block">কাজের ব্যাসার্ধ:</span>
                  <span className="font-bold text-white">{registeredResult.serviceRadiusKm} কি.মি.</span>
                </div>
                <div>
                  <span className="text-gray-300 block">সার্চ ডিসকভারি:</span>
                  <span className="font-bold text-emerald-300">✓ পাবলিক সার্চে সক্রিয়</span>
                </div>
              </div>

              {registeredResult.selectedSkillsList && registeredResult.selectedSkillsList.length > 0 && (
                <div className="mt-3 pt-2.5 border-t border-white/10">
                  <span className="text-[8px] text-gray-300 block mb-1">দক্ষতাসমূহ ({registeredResult.selectedSkillsList.length}টি):</span>
                  <div className="flex flex-wrap gap-1">
                    {registeredResult.selectedSkillsList.slice(0, 4).map((sk) => (
                      <span key={sk} className="bg-white/15 px-2 py-0.5 rounded text-[8px] font-semibold text-white">
                        ✓ {sk}
                      </span>
                    ))}
                    {registeredResult.selectedSkillsList.length > 4 && (
                      <span className="bg-white/15 px-1.5 py-0.5 rounded text-[8px] text-emerald-200">
                        +{registeredResult.selectedSkillsList.length - 4}টি আরো
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Escrow Safety Model Notice */}
            <div className="bg-emerald-50 p-3.5 rounded-2xl border border-emerald-200 text-left text-[9px] text-emerald-950 space-y-1.5 max-w-md mx-auto">
              <span className="font-black text-[#1E4D2B] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-[#1E4D2B]" /> নিরাপদ এসক্রো ও ওয়ালেট আর্নিং মডেল:
              </span>
              <p>• প্রতিটি কাজের বিল ইন-অ্যাপ এসক্রো পেমেন্টে সংরক্ষিত থাকবে। গ্রাহকের কাজের সন্তুষ্টি কনফার্মেশনের পর ৯৫% অর্থ সরাসরি আপনার ইন-অ্যাপ ওয়ালেটে জমা হবে।</p>
              <p>• প্রোফাইল ওয়ালেট থেকে যেকোনো সময় বিকাশ বা নগদে সরাসরি ক্যাশআউট করতে পারবেন।</p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto pt-2">
              {onViewInSearch && (
                <button
                  type="button"
                  onClick={() => onViewInSearch(registeredResult.district, registeredResult.upazila, registeredResult.job)}
                  className="flex-1 bg-[#1E4D2B] hover:bg-[#2A653B] text-white font-black text-xs py-3 rounded-2xl shadow-lg cursor-pointer transition-all"
                >
                  সার্চে নিজের প্রোফাইল দেখুন
                </button>
              )}
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-3 rounded-2xl cursor-pointer"
                >
                  সম্পন্ন করুন
                </button>
              )}
            </div>
          </div>
        )}

      </div>

      {/* Footer Navigation Buttons (Steps 1 to 5) */}
      {step <= 5 && (
        <div className="bg-slate-50 p-3.5 border-t border-gray-200 flex items-center justify-between shrink-0">
          {step > 1 ? (
            <button
              type="button"
              onClick={() => setStep((prev) => (prev - 1) as any)}
              className="px-4 py-2.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-300 rounded-xl font-bold text-[9.5px] flex items-center gap-1.5 cursor-pointer transition-all"
            >
              <ArrowLeft className="w-3.5 h-3.5" /> পিছনে
            </button>
          ) : (
            <div></div>
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="px-6 py-2.5 bg-[#1E4D2B] hover:bg-[#2A653B] text-white rounded-xl font-black text-[10.5px] flex items-center gap-2 shadow-md cursor-pointer transition-all ml-auto"
            >
              পরবর্তী ধাপ <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="px-7 py-3 bg-gradient-to-r from-[#1E4D2B] via-emerald-700 to-[#1E4D2B] hover:from-[#2A653B] hover:to-[#2A653B] text-white rounded-xl font-black text-[11px] flex items-center gap-2 shadow-xl cursor-pointer transition-all ml-auto disabled:opacity-50"
            >
              {isSubmitting ? 'প্রসেসিং হচ্ছে...' : 'রেজিস্ট্রেশন ও আইডি বরাদ্দ সম্পন্ন করুন'}
              <Sparkles className="w-4 h-4 text-amber-300" />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
