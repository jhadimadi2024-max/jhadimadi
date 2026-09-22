import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Search, Droplet, ShoppingBag, Wrench, Briefcase, UserCheck, 
  MapPin, Phone, ArrowRight, ArrowLeft, Eye, RefreshCw, 
  CheckCircle2, AlertCircle, X, Calendar, 
  Building2, GraduationCap, ShieldCheck, UserPlus, Lock,
  PlusCircle, UploadCloud, FileText, File, Check, ExternalLink,
  ChevronDown, Sparkles
} from 'lucide-react';
import { BANGLADESH_GEO_DIRECTORY, ALL_1000_PROFESSIONS_FLAT_LIST } from '../data/professionsMasterData';
import { supabase, isSupabaseConfigured } from '../supabase';
import { useData } from '../context/DataContext';
import { StoreProduct } from '../data/productsData';
import { RegisteredProfessional } from './ProfessionalRegistrationWizard';
import { fetchJobListings, fetchJobCandidates, createJobPosting, registerJobCandidate, uploadJobDocument, JOB_CATEGORIES, JOB_TYPES } from '../services/jobService';
import { JobPosting, JobCandidate, JobType } from '../types';
import { useAuth } from '../context/AuthContext';
import { BrandLogo } from './BrandLogo';
import { BloodAuthGatekeeperModal } from './BloodAuthGatekeeperModal';
import { StaticBloodDonorProfileDocument } from './StaticBloodDonorProfileDocument';
import { analyticsService } from '../services/analyticsService';
import { databaseService } from '../services/databaseService';
import { getProductPublicUrl } from '../utils/directSupabaseStorage';
import { NO_IMAGE_AVAILABLE_ICON } from '../constants/imageConstants';

export type ManualSearchCategory = 'blood' | 'products' | 'services' | 'circulars' | 'seekers';

interface ManualSearchPortalProps {
  lang?: 'bn' | 'en';
  onViewProduct?: (product: StoreProduct) => void;
  onViewWorkerProfile?: (provider: any) => void;
  onViewDonorProfile?: (donor: any) => void;
  onBackToHome?: () => void;
  onShowToast?: (msg: string) => void;
  onNavigateToBloodDonorRegistration?: (phone?: string) => void;
  onNavigateToRegistration?: (targetTab?: any, phone?: string) => void;
}

// Category 1: Blood Groups
const BLOOD_GROUPS = ['all', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Category 2: Popular Crops & Local Products
const POPULAR_PRODUCTS_CROPS = [
  { id: 'all', nameBn: 'সকল পণ্য ও ফসল', nameEn: 'All Products & Crops' },
  { id: 'আম', nameBn: 'আম (Mango)', nameEn: 'Mango' },
  { id: 'কাঁঠাল', nameBn: 'কাঁঠাল (Jackfruit)', nameEn: 'Jackfruit' },
  { id: 'আনারস', nameBn: 'আনারস (Pineapple)', nameEn: 'Pineapple' },
  { id: 'কলা', nameBn: 'কলা (Banana)', nameEn: 'Banana' },
  { id: 'কমলা', nameBn: 'কমলা / মাল্টা (Orange)', nameEn: 'Orange' },
  { id: 'পেঁপে', nameBn: 'পেঁপে (Papaya)', nameEn: 'Papaya' },
  { id: 'হলুদ', nameBn: 'পাহাড়ি হলুদ (Turmeric)', nameEn: 'Turmeric' },
  { id: 'আদা', nameBn: 'পাহাড়ি আদা (Ginger)', nameEn: 'Ginger' },
  { id: 'কাজুবাদাম', nameBn: 'কাজুবাদাম (Cashew Nut)', nameEn: 'Cashew Nut' },
  { id: 'ড্রাগন ফল', nameBn: 'ড্রাগন ফল (Dragon Fruit)', nameEn: 'Dragon Fruit' },
  { id: 'চাল', nameBn: 'পাহাড়ি জুম চাল / ধান (Jhum Rice)', nameEn: 'Jhum Rice' },
  { id: 'মধু', nameBn: 'খাঁটি পাহাড়ি মধু (Wild Honey)', nameEn: 'Wild Honey' },
  { id: 'মরিচ', nameBn: 'কাঁচা মরিচ / পাহাড়ি মরিচ (Chili)', nameEn: 'Chili' },
  { id: 'তেঁতুল', nameBn: 'পাহাড়ি তেঁতুল (Tamarind)', nameEn: 'Tamarind' },
  { id: 'শুঁটকি', nameBn: 'ড্রাই ফিশ / পাহাড়ি শুঁটকি (Dried Fish)', nameEn: 'Dried Fish' },
  { id: 'শাকসবজি', nameBn: 'টাটকা শাকসবজি (Vegetables)', nameEn: 'Vegetables' },
  { id: 'তাঁতপণ্য', nameBn: 'হাতের তৈরি পোশাক ও তাঁতপণ্য (Handloom)', nameEn: 'Handloom' },
];

// Category 3: Services & Skilled Professions
const POPULAR_SERVICES_PROFESSIONS = [
  { id: 'all', nameBn: 'সকল সেবা ও পেশা', nameEn: 'All Services' },
  { id: 'প্লাম্বার', nameBn: 'প্লাম্বার ও পাইপফিটার (Plumber)', nameEn: 'Plumber' },
  { id: 'ইলেকট্রিশিয়ান', nameBn: 'ইলেকট্রিশিয়ান ও ওয়্যারিং (Electrician)', nameEn: 'Electrician' },
  { id: 'রংমিস্ত্রি', nameBn: 'রংমিস্ত্রি ও পেইন্টার (Painter)', nameEn: 'Painter' },
  { id: 'রাজমিস্ত্রি', nameBn: 'রাজমিস্ত্রি ও কনস্ট্রাকশন (Mason)', nameEn: 'Mason' },
  { id: 'কাঠমিস্ত্রি', nameBn: 'কাঠমিস্ত্রি ও ফার্নিচার কারিগর (Carpenter)', nameEn: 'Carpenter' },
  { id: 'মেকানিক', nameBn: 'মোটরসাইকেল / গাড়ি মেকানিক (Mechanic)', nameEn: 'Mechanic' },
  { id: 'হোম টিউটর', nameBn: 'হোম টিউটর ও গৃহশিক্ষক (Home Tutor)', nameEn: 'Home Tutor' },
  { id: 'টাইলস মিস্ত্রি', nameBn: 'টাইলস ও স্যানিটারি মিস্ত্রি (Tiles Mason)', nameEn: 'Tiles Mason' },
  { id: 'ড্রাইভার', nameBn: 'ড্রাইভার ও চালক (Driver)', nameEn: 'Driver' },
  { id: 'ওয়েল্ডার', nameBn: 'ওয়েল্ডার ও গ্রিল কারিগর (Welder)', nameEn: 'Welder' },
  { id: 'ফটোগ্রাফার', nameBn: 'ফটোগ্রাফার ও ভিডিওগ্রাফার (Photographer)', nameEn: 'Photographer' },
  { id: 'গ্রাফিক ডিজাইনার', nameBn: 'গ্রাফিক ডিজাইনার ও ফ্রিল্যান্সার (Graphic Designer)', nameEn: 'Graphic Designer' },
  { id: 'কম্পিউটার টেকনিশিয়ান', nameBn: 'কম্পিউটার ও মোবাইল টেকনিশিয়ান (IT Tech)', nameEn: 'IT Tech' },
  { id: 'দর্জি', nameBn: 'দর্জি ও টেইলার (Tailor)', nameEn: 'Tailor' },
  { id: 'বাবুর্চি', nameBn: 'বাবুর্চি ও রান্নার শেফ (Cook / Chef)', nameEn: 'Cook' },
  { id: 'ক্লিনিং', nameBn: 'লন্ড্রি ও ক্লিনিং কর্মী (Cleaning & Laundry)', nameEn: 'Cleaning' },
];

// Category 4: Job Types
const JOB_CIRCULAR_TYPES = [
  { id: 'all', nameBn: 'সকল চাকরির ধরন', nameEn: 'All Types' },
  { id: 'Full-time', nameBn: 'Full-Time (সার্বক্ষণিক)', nameEn: 'Full-time' },
  { id: 'Part-time', nameBn: 'Part-Time (খণ্ডকালীন)', nameEn: 'Part-time' },
  { id: 'NGO', nameBn: 'NGO (এনজিও ও উন্নয়ন সংস্থা)', nameEn: 'NGO' },
  { id: 'Govt', nameBn: 'Govt (সরকারি ও আধা-সরকারি)', nameEn: 'Govt' },
  { id: 'Contract', nameBn: 'Contract (চুক্তিভিত্তিক)', nameEn: 'Contract' },
  { id: 'Remote', nameBn: 'Remote (অনলাইন / হোম অফিস)', nameEn: 'Remote' },
];

// Category 5: Job Seeker Roles
const JOB_SEEKER_ROLES = [
  { id: 'all', nameBn: 'সকল রোল / পদ', nameEn: 'All Roles' },
  { id: 'হোটেল ওয়েটার', nameBn: 'হোটেল ওয়েটার / সার্ভিস স্টাফ (Hotel Waiter)', nameEn: 'Hotel Waiter' },
  { id: 'ড্রাইভার', nameBn: 'ড্রাইভার / চালক (Driver)', nameEn: 'Driver' },
  { id: 'হিসাবরক্ষক', nameBn: 'হিসাবরক্ষক / অ্যাকাউন্ট্যান্ট (Accountant)', nameEn: 'Accountant' },
  { id: 'কম্পিউটার অপারেটর', nameBn: 'কম্পিউটার অপারেটর / ডাটা এন্ট্রি (Data Entry)', nameEn: 'Data Entry' },
  { id: 'সেলস এক্সিকিউটিভ', nameBn: 'সেলস এক্সিকিউটিভ / বিক্রয়কর্মী (Sales Executive)', nameEn: 'Sales Executive' },
  { id: 'অফিস সহকারী', nameBn: 'অফিস সহকারী / পিয়ন (Office Assistant)', nameEn: 'Office Assistant' },
  { id: 'ডেলিভারি রাইডার', nameBn: 'ডেলিভারি রাইডার (Delivery Rider)', nameEn: 'Delivery Rider' },
  { id: 'শিক্ষক', nameBn: 'শিক্ষক / গৃহশিক্ষক (Teacher / Tutor)', nameEn: 'Teacher' },
  { id: 'নিরাপত্তা কর্মী', nameBn: 'নিরাপত্তা কর্মী / সিকিউরিটি গার্ড (Security Guard)', nameEn: 'Security Guard' },
  { id: 'ইলেকট্রিশিয়ান', nameBn: 'ইলেকট্রিশিয়ান / টেকনিশিয়ান (Electrician)', nameEn: 'Electrician' },
  { id: 'বাবুর্চি', nameBn: 'বাবুর্চি / শেফ (Chef / Cook)', nameEn: 'Chef' },
  { id: 'ম্যানেজার', nameBn: 'ম্যানেজার / সুপারভাইজার (Manager)', nameEn: 'Manager' },
  { id: 'নার্স', nameBn: 'নার্স / হেলথকেয়ার অ্যাসিস্ট্যান্ট (Nurse)', nameEn: 'Nurse' },
];

export const ManualSearchPortal: React.FC<ManualSearchPortalProps> = ({
  lang = 'bn',
  onViewProduct,
  onViewWorkerProfile,
  onViewDonorProfile,
  onBackToHome,
  onShowToast,
  onNavigateToBloodDonorRegistration,
  onNavigateToRegistration
}) => {
  const isBn = lang === 'bn';
  const { currentUser, login } = useAuth();
  const { products: contextProducts, professionals: contextPros, bloodDonors: contextDonors } = useData();

  // Active Category State (Reordered: Services default)
  const [activeCategory, setActiveCategory] = useState<ManualSearchCategory>('services');
  const [jobsSubCategory, setJobsSubCategory] = useState<'circulars' | 'seekers'>('circulars');
  const [isBloodAuthModalOpen, setIsBloodAuthModalOpen] = useState(false);
  const [bloodAuthInitialMode, setBloodAuthInitialMode] = useState<'signin' | 'quick_register'>('signin');

  // Category: Blood Donor Filters
  const [bloodGroup, setBloodGroup] = useState<string>('all');
  const [bloodDistrict, setBloodDistrict] = useState<string>('all');
  const [bloodUpazila, setBloodUpazila] = useState<string>('all');
  const [bloodSearchPhone, setBloodSearchPhone] = useState<string>(currentUser?.phone || '');
  const [bloodPhoneError, setBloodPhoneError] = useState<string>('');
  const [isBloodPhoneVerified, setIsBloodPhoneVerified] = useState<boolean>(false);
  const [isBloodPhoneUnregistered, setIsBloodPhoneUnregistered] = useState<boolean>(false);
  const [showBloodRegistrationAlert, setShowBloodRegistrationAlert] = useState<boolean>(false);
  const [hasSearchedBlood, setHasSearchedBlood] = useState<boolean>(false);
  const [hasSearched, setHasSearched] = useState<boolean>(false);

  useEffect(() => {
    if (currentUser?.phone && !bloodSearchPhone) {
      setBloodSearchPhone(currentUser.phone);
    }
  }, [currentUser?.phone]);

  // Category 2: Products & Crops Filters
  const [productItem, setProductItem] = useState<string>('all');
  const [productKeyword, setProductKeyword] = useState<string>('');
  const [productDistrict, setProductDistrict] = useState<string>('all');
  const [productUpazila, setProductUpazila] = useState<string>('all');

  // Category 3: Services & Professionals Filters
  const [serviceItem, setServiceItem] = useState<string>('all');
  const [serviceKeyword, setServiceKeyword] = useState<string>('');
  const [serviceDistrict, setServiceDistrict] = useState<string>('all');
  const [serviceUpazila, setServiceUpazila] = useState<string>('all');
  const [professionSearchInput, setProfessionSearchInput] = useState<string>('');
  const [isProfessionDropdownOpen, setIsProfessionDropdownOpen] = useState<boolean>(false);
  const professionDropdownRef = useRef<HTMLDivElement>(null);

  // Filter professions from ALL_1000_PROFESSIONS_FLAT_LIST (1,000+ Bangladeshi professions)
  const filteredProfessions = useMemo(() => {
    const q = professionSearchInput.trim().toLowerCase();
    if (!q) {
      return ALL_1000_PROFESSIONS_FLAT_LIST.slice(0, 30);
    }
    return ALL_1000_PROFESSIONS_FLAT_LIST.filter(p => 
      p.name.toLowerCase().includes(q) ||
      (p.category && p.category.toLowerCase().includes(q)) ||
      (p.categoryEn && p.categoryEn.toLowerCase().includes(q)) ||
      (p.subCategory && p.subCategory.toLowerCase().includes(q))
    ).slice(0, 40);
  }, [professionSearchInput]);

  // Click outside to dismiss profession dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (professionDropdownRef.current && !professionDropdownRef.current.contains(e.target as Node)) {
        setIsProfessionDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Category 4: Job Circulars Filters
  const [jobType, setJobType] = useState<string>('all');
  const [jobLocation, setJobLocation] = useState<string>('all');

  // Job Circular Posting Modal State (Option A: Detailed Form vs Option B: Direct File Upload)
  const [circularPostMode, setCircularPostMode] = useState<'detailed' | 'upload'>('detailed');
  const [isJobPostingModalOpen, setIsJobPostingModalOpen] = useState<boolean>(false);
  const [isSubmittingJob, setIsSubmittingJob] = useState<boolean>(false);
  const [jobPostError, setJobPostError] = useState<string>('');
  const [jobPostForm, setJobPostForm] = useState({
    title: '',
    companyName: '',
    jobType: 'Full-time' as JobType,
    category: 'সাধারণ',
    district: 'all',
    upazila: 'all',
    salary: '',
    deadline: '',
    contactPhone: currentUser?.phone || '',
    contactEmail: currentUser?.email || '',
    education: '',
    experience: '',
    description: '',
    circularFile: null as File | null,
    circularFilePreview: '' as string,
    circularFileName: '' as string,
    circularFileType: '' as string,
    circularFileSize: 0 as number,
  });
  const circularFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser?.phone && !jobPostForm.contactPhone) {
      setJobPostForm(prev => ({ ...prev, contactPhone: currentUser.phone }));
    }
  }, [currentUser?.phone]);

  // Job Seeker Submission Modal State (Option A: Detailed Form vs Option B: Direct File Upload)
  const [isJobSeekerModalOpen, setIsJobSeekerModalOpen] = useState<boolean>(false);
  const [seekerSubmitMode, setSeekerSubmitMode] = useState<'detailed' | 'upload'>('detailed');
  const [isSubmittingSeeker, setIsSubmittingSeeker] = useState<boolean>(false);
  const [jobSeekerError, setJobSeekerError] = useState<string>('');
  const [jobSeekerForm, setJobSeekerForm] = useState({
    name: currentUser?.name || currentUser?.fullName || '',
    phone: currentUser?.phone || '',
    email: currentUser?.email || '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    desiredJobTitle: '',
    category: 'সাধারণ',
    presentAddress: '',
    permanentAddress: '',
    district: currentUser?.district || 'all',
    upazila: currentUser?.upazila || 'all',
    highestEducation: '',
    experienceYears: '',
    skills: '',
    expectedSalary: '',
    bio: '',
    resumeFile: null as File | null,
    resumeFilePreview: '' as string,
    resumeFileName: '' as string,
    resumeFileType: '' as string,
    resumeFileSize: 0 as number,
  });
  const seekerFileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (currentUser?.phone && !jobSeekerForm.phone) {
      setJobSeekerForm(prev => ({ 
        ...prev, 
        phone: currentUser.phone,
        name: prev.name || currentUser.name || currentUser.fullName || '',
        district: prev.district === 'all' ? (currentUser.district || 'all') : prev.district,
        upazila: prev.upazila === 'all' ? (currentUser.upazila || 'all') : prev.upazila,
      }));
    }
  }, [currentUser?.phone]);

  // Category 5: Job Seekers Filters
  const [seekerRole, setSeekerRole] = useState<string>('all');
  const [seekerTargetDistrict, setSeekerTargetDistrict] = useState<string>('all');

  // Search execution & status states
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [resultsSource, setResultsSource] = useState<'supabase' | 'fallback'>('supabase');

  // Result collections
  const [bloodResults, setBloodResults] = useState<any[]>([]);
  const [productResults, setProductResults] = useState<StoreProduct[]>([]);
  const [serviceResults, setServiceResults] = useState<any[]>([]);
  const [circularResults, setCircularResults] = useState<JobPosting[]>([]);
  const [seekerResults, setSeekerResults] = useState<JobCandidate[]>([]);

  // Modals for details viewing
  const [selectedBloodDonorModal, setSelectedBloodDonorModal] = useState<any | null>(null);
  const [selectedCircularModal, setSelectedCircularModal] = useState<JobPosting | null>(null);
  const [selectedSeekerModal, setSelectedSeekerModal] = useState<JobCandidate | null>(null);

  // All 64 Districts sorted alphabetically with priority CHT districts first
  const allDistricts = useMemo(() => {
    const priority = ['রাঙ্গামাটি', 'খাগড়াছড়ি', 'বান্দরবান', 'চট্টগ্রাম', 'ঢাকা', 'দিনাজপুর', 'রংপুর'];
    const keys = Object.keys(BANGLADESH_GEO_DIRECTORY);
    const nonPriority = keys.filter(k => !priority.includes(k)).sort((a, b) => a.localeCompare(b, 'bn'));
    return [...priority.filter(p => keys.includes(p)), ...nonPriority];
  }, []);

  // Cascading Upazilas helper
  const getUpazilasForDistrict = (district: string): string[] => {
    if (!district || district === 'all') return [];
    return BANGLADESH_GEO_DIRECTORY[district]?.thanas || [];
  };

  // Reset Upazila when District changes
  useEffect(() => {
    setBloodUpazila('all');
  }, [bloodDistrict]);

  useEffect(() => {
    setProductUpazila('all');
  }, [productDistrict]);

  useEffect(() => {
    setServiceUpazila('all');
  }, [serviceDistrict]);

  // Handle circular file upload (PDF, JPG, PNG)
  const handleCircularFileSelect = (file: File) => {
    if (!file) return;
    const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
    const lowerName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => lowerName.endsWith(ext)) || file.type.startsWith('image/') || file.type === 'application/pdf';

    if (!isValid) {
      setJobPostError(isBn ? 'শুধুমাত্র PDF, JPG বা PNG ফরম্যাটের ফাইল আপলোড করা যাবে।' : 'Only PDF, JPG, or PNG files are supported.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setJobPostError(isBn ? 'ফাইলের আকার ১৫ মেগাবাইটের কম হতে হবে।' : 'File size must be under 15MB.');
      return;
    }

    setJobPostError('');

    const reader = new FileReader();
    reader.onload = () => {
      setJobPostForm(prev => ({
        ...prev,
        circularFile: file,
        circularFilePreview: reader.result as string,
        circularFileName: file.name,
        circularFileType: file.type || (lowerName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
        circularFileSize: file.size,
      }));
    };
    reader.readAsDataURL(file);
  };

  // Submit Job Circular (Option A: Detailed Form vs Option B: Direct File Upload)
  const handleJobPostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (circularPostMode === 'detailed') {
      if (!jobPostForm.title.trim()) {
        setJobPostError(isBn ? 'চাকরির পদবীর নাম লিখুন।' : 'Please enter the job title.');
        return;
      }
      if (!jobPostForm.companyName.trim()) {
        setJobPostError(isBn ? 'কোম্পানি বা প্রতিষ্ঠানের নাম লিখুন।' : 'Please enter company/organization name.');
        return;
      }
      if (!jobPostForm.contactPhone.trim()) {
        setJobPostError(isBn ? 'যোগাযোগের ফোন নম্বর দিন।' : 'Please enter contact phone number.');
        return;
      }
    } else {
      // Option B: Direct File Upload
      if (!jobPostForm.companyName.trim()) {
        setJobPostError(isBn ? 'কোম্পানি বা প্রতিষ্ঠানের নাম লিখুন।' : 'Please enter company/organization name.');
        return;
      }
      if (!jobPostForm.contactPhone.trim()) {
        setJobPostError(isBn ? 'যোগাযোগের ফোন নম্বর দিন।' : 'Please enter contact phone number.');
        return;
      }
      if (!jobPostForm.circularFile && !jobPostForm.circularFilePreview) {
        setJobPostError(isBn ? 'অনুগ্রহ করে সার্কুলার ফাইল (PDF, JPG বা PNG) আপলোড করুন।' : 'Please upload circular file (PDF, JPG or PNG).');
        return;
      }
    }

    setIsSubmittingJob(true);
    setJobPostError('');

    try {
      let finalFileUrl = '';
      if (jobPostForm.circularFile) {
        const uploadRes = await uploadJobDocument(jobPostForm.circularFile, 'circular');
        if (uploadRes.success && uploadRes.url) {
          finalFileUrl = uploadRes.url;
        }
      }
      if (!finalFileUrl && jobPostForm.circularFilePreview) {
        finalFileUrl = jobPostForm.circularFilePreview;
      }

      const jobTitle = jobPostForm.title.trim() || `${jobPostForm.companyName.trim()} - নিয়োগ বিজ্ঞপ্তি`;

      const jobPayload = {
        title: jobTitle,
        designation: jobTitle,
        companyName: jobPostForm.companyName.trim(),
        jobType: jobPostForm.jobType,
        category: jobPostForm.category || 'সাধারণ',
        salary: jobPostForm.salary.trim() || (isBn ? 'আলোচনা সাপেক্ষে' : 'Negotiable'),
        district: jobPostForm.district !== 'all' ? jobPostForm.district : (isBn ? 'বাংলাদেশ' : 'Bangladesh'),
        upazila: jobPostForm.upazila !== 'all' ? jobPostForm.upazila : '',
        vacanciesCount: 1,
        education: jobPostForm.education.trim() || (isBn ? 'প্রযোজ্য নয়' : 'N/A'),
        experience: jobPostForm.experience.trim() || '',
        description: jobPostForm.description.trim() || (isBn ? 'বিস্তারিত সার্কুলার ফাইল বা বিজ্ঞপ্তিতে দেখুন।' : 'See attached circular for details.'),
        deadline: jobPostForm.deadline.trim() || (isBn ? 'জরুরি ভিত্তিতে নিয়োগ' : 'Urgent hiring'),
        contactPhone: jobPostForm.contactPhone.trim(),
        contactEmail: jobPostForm.contactEmail.trim(),
        circularUrl: finalFileUrl,
        circularFileName: jobPostForm.circularFileName,
        circularFileType: jobPostForm.circularFileType,
        submissionType: (circularPostMode === 'upload' || finalFileUrl ? 'upload' : 'detailed') as any,
        status: 'active' as const,
      };

      const result = await createJobPosting(jobPayload);

      // Prepend to circularResults immediately
      if (result.data) {
        setCircularResults(prev => [result.data!, ...prev]);
        setHasSearched(true);
      }

      if (onShowToast) {
        onShowToast(isBn ? 'চাকরির সার্কুলার সফলভাবে পোস্ট করা হয়েছে!' : 'Job circular posted successfully!');
      }

      // Reset form & close modal
      setIsJobPostingModalOpen(false);
      setJobPostForm({
        title: '',
        companyName: '',
        jobType: 'Full-time',
        category: 'সাধারণ',
        district: 'all',
        upazila: 'all',
        salary: '',
        deadline: '',
        contactPhone: currentUser?.phone || '',
        contactEmail: currentUser?.email || '',
        education: '',
        experience: '',
        description: '',
        circularFile: null,
        circularFilePreview: '',
        circularFileName: '',
        circularFileType: '',
        circularFileSize: 0,
      });
    } catch (err: any) {
      console.error('[ManualSearch] submit job circular error:', err);
      setJobPostError(isBn ? 'সার্কুলার পোস্ট করার সময় সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।' : 'Failed to post circular. Please try again.');
    } finally {
      setIsSubmittingJob(false);
    }
  };

  // Handle candidate resume / CV file upload (PDF, JPG, PNG)
  const handleSeekerFileSelect = (file: File) => {
    if (!file) return;
    const validExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
    const lowerName = file.name.toLowerCase();
    const isValid = validExtensions.some(ext => lowerName.endsWith(ext)) || file.type.startsWith('image/') || file.type === 'application/pdf';

    if (!isValid) {
      setJobSeekerError(isBn ? 'শুধুমাত্র PDF, JPG বা PNG ফরম্যাটের সিভি ফাইল আপলোড করা যাবে।' : 'Only PDF, JPG, or PNG files are supported.');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      setJobSeekerError(isBn ? 'ফাইলের আকার ১৫ মেগাবাইটের কম হতে হবে।' : 'File size must be under 15MB.');
      return;
    }

    setJobSeekerError('');

    const reader = new FileReader();
    reader.onload = () => {
      setJobSeekerForm(prev => ({
        ...prev,
        resumeFile: file,
        resumeFilePreview: reader.result as string,
        resumeFileName: file.name,
        resumeFileType: file.type || (lowerName.endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'),
        resumeFileSize: file.size,
      }));
    };
    reader.readAsDataURL(file);
  };

  // Submit Job Seeker / Bio-data (Option A: Detailed Form vs Option B: Direct File Upload)
  const handleJobSeekerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!jobSeekerForm.name.trim()) {
      setJobSeekerError(isBn ? 'প্রার্থীর পূর্ণ নাম লিখুন।' : 'Please enter candidate full name.');
      return;
    }
    if (!jobSeekerForm.phone.trim()) {
      setJobSeekerError(isBn ? 'যোগাযোগের মোবাইল নম্বর দিন।' : 'Please enter contact mobile number.');
      return;
    }

    if (seekerSubmitMode === 'upload') {
      if (!jobSeekerForm.resumeFile && !jobSeekerForm.resumeFilePreview) {
        setJobSeekerError(isBn ? 'অনুগ্রহ করে সিভি বা বায়োডাটা ফাইল (PDF, JPG বা PNG) আপলোড করুন।' : 'Please upload CV or Bio-data file.');
        return;
      }
    }

    setIsSubmittingSeeker(true);
    setJobSeekerError('');

    try {
      let finalResumeUrl = '';
      if (jobSeekerForm.resumeFile) {
        const uploadRes = await uploadJobDocument(jobSeekerForm.resumeFile, 'resume');
        if (uploadRes.success && uploadRes.url) {
          finalResumeUrl = uploadRes.url;
        }
      }
      if (!finalResumeUrl && jobSeekerForm.resumeFilePreview) {
        finalResumeUrl = jobSeekerForm.resumeFilePreview;
      }

      const skillsArray = jobSeekerForm.skills
        ? jobSeekerForm.skills.split(',').map(s => s.trim()).filter(Boolean)
        : [];

      const candidatePayload = {
        name: jobSeekerForm.name.trim(),
        phone: jobSeekerForm.phone.trim(),
        email: jobSeekerForm.email.trim(),
        gender: jobSeekerForm.gender,
        desiredJobTitle: jobSeekerForm.desiredJobTitle.trim() || (isBn ? 'উপযুক্ত যে কোনো পদ' : 'Any Suitable Role'),
        category: jobSeekerForm.category || 'সাধারণ',
        expectedSalary: jobSeekerForm.expectedSalary.trim() || (isBn ? 'আলোচনা সাপেক্ষে' : 'Negotiable'),
        experienceYears: jobSeekerForm.experienceYears.trim() || (isBn ? '১ বছর' : '1 Year'),
        highestEducation: jobSeekerForm.highestEducation.trim() || (isBn ? 'সাধারণ শিক্ষা' : 'General Education'),
        skills: skillsArray.length > 0 ? skillsArray : ['পরিশ্রমী ও দায়িত্বশীল'],
        district: jobSeekerForm.district !== 'all' ? jobSeekerForm.district : (isBn ? 'বাংলাদেশ' : 'Bangladesh'),
        upazila: jobSeekerForm.upazila !== 'all' ? jobSeekerForm.upazila : '',
        division: 'Chittagong Division',
        address: jobSeekerForm.presentAddress.trim() || (jobSeekerForm.upazila !== 'all' ? `${jobSeekerForm.upazila}, ${jobSeekerForm.district}` : jobSeekerForm.district),
        bio: jobSeekerForm.bio.trim() || (isBn ? 'ঝাদিমাদি প্ল্যাটফর্মের মাধ্যমে চাকরির জন্য আবেদনকৃত প্রার্থী।' : 'Job candidate registered on Jhadimadi.'),
        resumeUrl: finalResumeUrl,
        resumeFileName: jobSeekerForm.resumeFileName,
        resumeFileType: jobSeekerForm.resumeFileType,
        submissionType: (seekerSubmitMode === 'upload' || finalResumeUrl ? 'upload' : 'detailed') as any,
        status: 'available' as const,
      };

      const result = await registerJobCandidate(candidatePayload);

      if (result.data) {
        setSeekerResults(prev => [result.data!, ...prev]);
        setHasSearched(true);
      }

      if (onShowToast) {
        onShowToast(isBn ? 'আপনার বায়োডাটা/সিভি সফলভাবে জমা হয়েছে!' : 'Bio-data / CV submitted successfully!');
      }

      // Reset form and close modal
      setIsJobSeekerModalOpen(false);
      setJobSeekerForm({
        name: currentUser?.name || currentUser?.fullName || '',
        phone: currentUser?.phone || '',
        email: currentUser?.email || '',
        gender: 'Male',
        desiredJobTitle: '',
        category: 'সাধারণ',
        presentAddress: '',
        permanentAddress: '',
        district: currentUser?.district || 'all',
        upazila: currentUser?.upazila || 'all',
        highestEducation: '',
        experienceYears: '',
        skills: '',
        expectedSalary: '',
        bio: '',
        resumeFile: null,
        resumeFilePreview: '',
        resumeFileName: '',
        resumeFileType: '',
        resumeFileSize: 0,
      });
    } catch (err: any) {
      console.error('[ManualSearch] submit job candidate error:', err);
      setJobSeekerError(isBn ? 'সিভি জমা দেওয়ার সময় সমস্যা হয়েছে। পুনরায় চেষ্টা করুন।' : 'Failed to submit CV. Please try again.');
    } finally {
      setIsSubmittingSeeker(false);
    }
  };

  // Direct Supabase Search Engine without AI
  const handleSearch = async () => {
    setHasSearched(true);
    setIsLoading(true);

    try {
      if (activeCategory === 'blood') {
        // Step 1: Validate if the phone number field is filled. If empty, show a validation error: "অনুগ্রহ করে আপনার মোবাইল নম্বর দিন।"
        const trimmedPhone = (bloodSearchPhone || '').trim();
        if (!trimmedPhone) {
          setIsLoading(false);
          setHasSearched(false);
          setHasSearchedBlood(false);
          setBloodPhoneError('অনুগ্রহ করে আপনার মোবাইল নম্বর দিন।');
          if (onShowToast) onShowToast('অনুগ্রহ করে আপনার মোবাইল নম্বর দিন।');
          return;
        }

        const bnToEnMap: Record<string, string> = {
          '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
          '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
        };
        const normalizedInput = trimmedPhone.replace(/[০-৯]/g, (d) => bnToEnMap[d] || d);
        const cleanDigits = normalizedInput.replace(/[^0-9]/g, '');

        if (cleanDigits.length < 6) {
          setIsLoading(false);
          setHasSearched(false);
          setHasSearchedBlood(false);
          setBloodPhoneError('অনুগ্রহ করে আপনার সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।');
          if (onShowToast) onShowToast('অনুগ্রহ করে আপনার সঠিক ১১ ডিজিটের মোবাইল নম্বর দিন।');
          return;
        }

        setBloodPhoneError('');

        // Step 2: Query the blood_donors table in Supabase to check if this phone number exists.
        let isPhoneRegisteredAsDonor = false;
        const last11Digits = cleanDigits.slice(-11);
        const withPlus88 = `+88${last11Digits}`;
        const with88 = `88${last11Digits}`;

        if (isSupabaseConfigured) {
          try {
            const { data: donorCheck, error: donorCheckErr } = await supabase
              .from('blood_donors')
              .select('id, phone')
              .or(`phone.eq.${last11Digits},phone.eq.${withPlus88},phone.eq.${with88},phone.ilike.%${last11Digits}%`)
              .limit(1);

            if (!donorCheckErr && donorCheck && donorCheck.length > 0) {
              isPhoneRegisteredAsDonor = true;
            }
          } catch (err) {
            console.warn('[ManualSearch] blood_donors phone query notice:', err);
          }

          // Fallback check on profiles table if role is blood_donor or is_blood_donor is true
          if (!isPhoneRegisteredAsDonor) {
            try {
              const { data: pCheck, error: pErr } = await supabase
                .from('profiles')
                .select('id, phone')
                .or('role.eq.blood_donor,is_blood_donor.eq.true')
                .or(`phone.eq.${last11Digits},phone.eq.${withPlus88},phone.eq.${with88},phone.ilike.%${last11Digits}%`)
                .limit(1);

              if (!pErr && pCheck && pCheck.length > 0) {
                isPhoneRegisteredAsDonor = true;
              }
            } catch (_) {}
          }
        }

        // Also check context donors
        if (!isPhoneRegisteredAsDonor && contextDonors && contextDonors.length > 0) {
          isPhoneRegisteredAsDonor = contextDonors.some((d: any) => {
            const dNorm = (d.phone || d.emergencyContact || '').toString().replace(/[০-৯]/g, (digit: string) => bnToEnMap[digit] || digit).replace(/[^0-9]/g, '');
            return dNorm.includes(last11Digits) || (last11Digits.length >= 10 && dNorm.endsWith(last11Digits));
          });
        }

        // Also check if current logged-in user matches this phone and is a registered blood donor
        if (!isPhoneRegisteredAsDonor && currentUser) {
          const uNorm = (currentUser.phone || '').toString().replace(/[০-৯]/g, (digit: string) => bnToEnMap[digit] || digit).replace(/[^0-9]/g, '');
          if (uNorm.includes(last11Digits) && (currentUser.role === 'blood_donor' || currentUser.isBloodDonor)) {
            isPhoneRegisteredAsDonor = true;
          }
        }

        // If Phone Number DOES NOT Exist:
        // Do NOT show search results.
        // Display an alert modal/popup saying: "রক্ত খুঁজতে হলে আপনাকেও রক্তদাতা হিসেবে নিবন্ধিত থাকতে হবে। অনুগ্রহ করে আগে রেজিস্ট্রেশন করুন।"
        // Include a direct button "রেজিস্ট্রেশন করুন" inside the popup.
        if (!isPhoneRegisteredAsDonor) {
          setIsLoading(false);
          setHasSearched(false);
          setHasSearchedBlood(false);
          setBloodResults([]);
          setIsBloodPhoneVerified(false);
          setIsBloodPhoneUnregistered(true);
          setShowBloodRegistrationAlert(true);
          return;
        }

        // If Phone Number EXISTS: Proceed with the blood group/district search and display the list of registered donors.
        setIsBloodPhoneVerified(true);
        setIsBloodPhoneUnregistered(false);
        setHasSearchedBlood(true);

        let donorsList: any[] = [];
        let fetchedFromSupabase = false;

        if (isSupabaseConfigured) {
          try {
            let query = supabase.from('blood_donors').select('*');
            if (bloodGroup !== 'all') {
              query = query.eq('blood_group', bloodGroup);
            }
            if (bloodDistrict !== 'all') {
              query = query.ilike('district', `%${bloodDistrict}%`);
            }
            if (bloodUpazila !== 'all') {
              query = query.ilike('upazila', `%${bloodUpazila}%`);
            }
            const { data, error } = await query;
            if (!error && data && data.length > 0) {
              donorsList = data.map((d: any) => ({
                id: d.id,
                name: d.name || d.full_name || 'স্বেচ্ছাসেবী রক্তদাতা',
                bloodGroup: d.blood_group || d.bloodGroup || 'A+',
                phone: d.phone || d.contact_number || '',
                district: d.district || '',
                upazila: d.upazila || '',
                area: d.area || '',
                lastDonationDate: d.last_donation_date || d.lastDonationDate || '',
                totalDonations: Number(d.total_donations || d.totalDonations || 0),
                isAvailable: d.is_available !== false,
                verified: d.verified === true,
                emergencyContact: d.emergency_contact || d.emergencyContact || '',
                notes: d.notes || ''
              }));
              fetchedFromSupabase = true;
            }
          } catch (e) {
            console.warn('[ManualSearch] blood_donors query notice:', e);
          }

          // If blood_donors table is empty or unpopulated, check profiles table
          if (!fetchedFromSupabase) {
            try {
              let pQuery = supabase.from('profiles').select('*').or('role.eq.blood_donor,is_blood_donor.eq.true');
              if (bloodGroup !== 'all') {
                pQuery = pQuery.eq('blood_group', bloodGroup);
              }
              if (bloodDistrict !== 'all') {
                pQuery = pQuery.ilike('district', `%${bloodDistrict}%`);
              }
              if (bloodUpazila !== 'all') {
                pQuery = pQuery.ilike('upazila', `%${bloodUpazila}%`);
              }
              const { data: pData, error: pError } = await pQuery;
              if (!pError && pData && pData.length > 0) {
                donorsList = pData.map((d: any) => ({
                  id: d.id,
                  name: d.name || d.full_name || 'স্বেচ্ছাসেবী রক্তদাতা',
                  bloodGroup: d.blood_group || d.bloodGroup || 'A+',
                  phone: d.phone || d.contact_number || '',
                  district: d.district || '',
                  upazila: d.upazila || '',
                  area: d.area || '',
                  lastDonationDate: d.last_donation_date || d.lastDonationDate || '',
                  totalDonations: Number(d.total_donations || d.totalDonations || 0),
                  isAvailable: d.is_available !== false,
                  verified: d.verified === true,
                  emergencyContact: d.emergency_contact || d.emergencyContact || '',
                  notes: d.notes || ''
                }));
                fetchedFromSupabase = true;
              }
            } catch (e2) {
              console.warn('[ManualSearch] profiles blood_donor fallback query notice:', e2);
            }
          }

          // Check 'users' table directly for blood donor profiles
          if (!fetchedFromSupabase) {
            try {
              let uQuery = supabase.from('users').select('*');
              if (bloodGroup !== 'all') {
                uQuery = uQuery.eq('blood_group', bloodGroup);
              }
              if (bloodDistrict !== 'all') {
                uQuery = uQuery.ilike('district', `%${bloodDistrict}%`);
              }
              if (bloodUpazila !== 'all') {
                uQuery = uQuery.ilike('upazila', `%${bloodUpazila}%`);
              }
              const { data: uData, error: uError } = await uQuery;
              if (!uError && uData && uData.length > 0) {
                donorsList = uData.map((d: any) => ({
                  id: d.id,
                  name: d.name || d.full_name || 'স্বেচ্ছাসেবী রক্তদাতা',
                  bloodGroup: d.blood_group || d.bloodGroup || 'A+',
                  phone: d.phone || d.contact_number || '',
                  profession: d.profession || 'রক্তদাতা',
                  district: d.district || '',
                  upazila: d.upazila || '',
                  area: d.area || '',
                  lastDonationDate: d.last_donation_date || d.lastDonationDate || '',
                  totalDonations: Number(d.total_donations || d.totalDonations || 0),
                  isAvailable: d.is_available !== false,
                  verified: d.verified === true,
                  emergencyContact: d.emergency_contact || d.emergencyContact || '',
                  notes: d.notes || ''
                }));
                fetchedFromSupabase = true;
              }
            } catch (e3) {}
          }
        }

        // Fallback to local DataContext / offline storage donors
        if (donorsList.length === 0) {
          donorsList = (contextDonors || []).filter(donor => {
            if (bloodGroup !== 'all' && donor.bloodGroup !== bloodGroup) return false;
            if (bloodDistrict !== 'all' && !donor.district.includes(bloodDistrict)) return false;
            if (bloodUpazila !== 'all' && !donor.upazila.includes(bloodUpazila)) return false;
            return true;
          });
          setResultsSource(fetchedFromSupabase ? 'supabase' : 'fallback');
        } else {
          setResultsSource('supabase');
        }

        setBloodResults(donorsList);
      } 
      else if (activeCategory === 'products') {
        let prodsList: StoreProduct[] = [];
        let fetchedFromSupabase = false;

        const effectiveSearchTerm = productKeyword.trim() || (productItem !== 'all' ? productItem : '');

        if (isSupabaseConfigured) {
          try {
            let query = supabase.from('products').select('*');
            if (productDistrict !== 'all') {
              query = query.or(`district.ilike.%${productDistrict}%,origin.ilike.%${productDistrict}%`);
            }
            if (productUpazila !== 'all') {
              query = query.or(`upazila.ilike.%${productUpazila}%,production_origin.ilike.%${productUpazila}%`);
            }
            if (effectiveSearchTerm) {
              query = query.or(`name_bn.ilike.%${effectiveSearchTerm}%,category.ilike.%${effectiveSearchTerm}%,description_bn.ilike.%${effectiveSearchTerm}%`);
            }
            const { data, error } = await query;
            if (!error && data && data.length > 0) {
              prodsList = data.map((p: any) => ({
                id: p.id,
                nameBn: p.name_bn || p.nameBn || p.name || 'পণ্য',
                nameEn: p.name_en || p.nameEn || '',
                category: p.category || 'Agri',
                categoryLabelBn: p.category_label_bn || p.categoryLabelBn || 'কৃষি ও ফলমূল',
                price: Number(p.price || 0),
                originalPrice: Number(p.original_price || p.originalPrice || p.price || 0),
                unit: p.unit || 'কেজি',
                origin: p.origin || p.district || 'রাঙ্গামাটি',
                productionOrigin: p.production_origin || p.upazila || '',
                image: getProductPublicUrl(p.products_photos || p.image_url || p.image || NO_IMAGE_AVAILABLE_ICON),
                rating: Number(p.rating || 5),
                reviewsCount: Number(p.reviews_count || p.reviewsCount || 10),
                stock: Number(p.stock || 50),
                descriptionBn: p.description_bn || p.descriptionBn || '',
                descriptionEn: p.description_en || p.descriptionEn || '',
                features: Array.isArray(p.features) ? p.features : ['তাজা ও ভেজালমুক্ত'],
                sellerName: p.seller_name || p.sellerName || 'কৃষক / উৎপাদক',
                sellerPhone: p.seller_phone || p.sellerPhone || ''
              }));
              fetchedFromSupabase = true;
            }
          } catch (e) {
            console.warn('[ManualSearch] products query notice:', e);
          }
        }

        // Fallback to local DataContext products
        if (prodsList.length === 0) {
          prodsList = (contextProducts || []).filter(prod => {
            const locString = `${prod.origin || ''} ${(prod as any).district || ''} ${(prod as any).upazila || ''}`;
            if (productDistrict !== 'all' && !locString.includes(productDistrict)) return false;
            if (productUpazila !== 'all' && !locString.includes(productUpazila)) return false;
            if (effectiveSearchTerm) {
              const term = effectiveSearchTerm.toLowerCase();
              const matchName = (prod.nameBn || '').toLowerCase().includes(term);
              const matchCat = (prod.category || '').toLowerCase().includes(term);
              const matchDesc = (prod.descriptionBn || '').toLowerCase().includes(term);
              if (!matchName && !matchCat && !matchDesc) return false;
            }
            return true;
          });
          setResultsSource(fetchedFromSupabase ? 'supabase' : 'fallback');
        } else {
          setResultsSource('supabase');
        }

        setProductResults(prodsList);
      }
      else if (activeCategory === 'services') {
        let prosList: any[] = [];
        let fetchedFromSupabase = false;

        const effectiveServiceTerm = professionSearchInput.trim() || serviceKeyword.trim() || (serviceItem !== 'all' ? serviceItem : '');

        if (isSupabaseConfigured) {
          // 1. Query 'services' table directly in Supabase
          try {
            let sQuery = supabase.from('services').select('*');
            if (serviceDistrict !== 'all') {
              sQuery = sQuery.ilike('district', `%${serviceDistrict}%`);
            }
            if (serviceUpazila !== 'all') {
              sQuery = sQuery.ilike('upazila', `%${serviceUpazila}%`);
            }
            if (effectiveServiceTerm) {
              sQuery = sQuery.or(`profession.ilike.%${effectiveServiceTerm}%,name.ilike.%${effectiveServiceTerm}%,title.ilike.%${effectiveServiceTerm}%,description.ilike.%${effectiveServiceTerm}%`);
            }
            const { data: sData, error: sErr } = await sQuery;
            if (!sErr && sData && sData.length > 0) {
              prosList = sData.map((sp: any) => ({
                id: sp.id,
                name: sp.name || sp.provider_name || 'পেশাজীবী ও কারিগর',
                phone: sp.phone || '',
                job: sp.profession || sp.title || sp.category || 'দক্ষ কারিগর',
                categoryGroup: sp.category || 'সেবা',
                district: sp.district || '',
                upazila: sp.upazila || '',
                area: sp.area || '',
                experience: sp.experience || '৩+ বছর',
                dailyRate: sp.daily_rate || sp.rate || 'আলোচনা সাপেক্ষে',
                bio: sp.description || sp.bio || '',
                rating: Number(sp.rating || 4.9),
                avatar: sp.avatar || '',
                available: true
              }));
              fetchedFromSupabase = true;
            }
          } catch (e) {
            console.warn('[ManualSearch] services query notice:', e);
          }

          // 2. Query 'service_providers' table in Supabase
          if (!fetchedFromSupabase) {
            try {
              let query = supabase.from('service_providers').select('*');
              if (serviceDistrict !== 'all') {
                query = query.ilike('district', `%${serviceDistrict}%`);
              }
              if (serviceUpazila !== 'all') {
                query = query.ilike('upazila', `%${serviceUpazila}%`);
              }
              if (effectiveServiceTerm) {
                query = query.or(`category_bn.ilike.%${effectiveServiceTerm}%,profession_key.ilike.%${effectiveServiceTerm}%,skills_details.ilike.%${effectiveServiceTerm}%,name.ilike.%${effectiveServiceTerm}%`);
              }
              const { data, error } = await query;
              if (!error && data && data.length > 0) {
                prosList = data.map((sp: any) => ({
                  id: sp.id,
                  name: sp.name || 'পেশাজীবী ও কারিগর',
                  phone: sp.phone || '',
                  job: sp.category_bn || sp.profession_key || 'দক্ষ কারিগর',
                  categoryGroup: sp.category_bn || 'সেবা',
                  district: sp.district || '',
                  upazila: sp.upazila || '',
                  area: sp.area || '',
                  experience: sp.experience_years || '৩+ বছর',
                  dailyRate: sp.daily_rate || sp.rate || 'আলোচনা সাপেক্ষে',
                  bio: sp.bio || sp.skills_details || '',
                  rating: Number(sp.rating || 4.9),
                  avatar: sp.avatar_url || sp.avatar || '',
                  available: true
                }));
                fetchedFromSupabase = true;
              }
            } catch (e) {
              console.warn('[ManualSearch] service_providers query notice:', e);
            }
          }

          // If service_providers table is empty or unpopulated, check profiles table
          if (!fetchedFromSupabase) {
            try {
              let pQuery = supabase.from('profiles').select('*').in('role', ['service_provider', 'provider', 'professional']);
              if (serviceDistrict !== 'all') {
                pQuery = pQuery.ilike('district', `%${serviceDistrict}%`);
              }
              if (serviceUpazila !== 'all') {
                pQuery = pQuery.ilike('upazila', `%${serviceUpazila}%`);
              }
              if (effectiveServiceTerm) {
                pQuery = pQuery.or(`skills.ilike.%${effectiveServiceTerm}%,job_title.ilike.%${effectiveServiceTerm}%,bio.ilike.%${effectiveServiceTerm}%,full_name.ilike.%${effectiveServiceTerm}%`);
              }
              const { data: pData, error: pError } = await pQuery;
              if (!pError && pData && pData.length > 0) {
                prosList = pData.map((sp: any) => ({
                  id: sp.id,
                  name: sp.full_name || sp.name || 'পেশাজীবী ও কারিগর',
                  phone: sp.phone || '',
                  job: sp.job_title || sp.profession || sp.category || 'দক্ষ কারিগর',
                  categoryGroup: sp.category || 'সেবা',
                  district: sp.district || '',
                  upazila: sp.upazila || '',
                  area: sp.area || '',
                  experience: sp.experience_years || sp.experience || '৩+ বছর',
                  dailyRate: sp.daily_rate || sp.rate || 'আলোচনা সাপেক্ষে',
                  bio: sp.bio || sp.skills || '',
                  rating: Number(sp.rating || 5.0),
                  avatar: sp.avatar_url || sp.avatar || '',
                  available: true
                }));
                fetchedFromSupabase = true;
              }
            } catch (e2) {
              console.warn('[ManualSearch] profiles service_provider fallback query notice:', e2);
            }
          }

          // 4. Check 'users' table for professionals
          if (!fetchedFromSupabase) {
            try {
              let uQuery = supabase.from('users').select('*');
              if (serviceDistrict !== 'all') {
                uQuery = uQuery.ilike('district', `%${serviceDistrict}%`);
              }
              if (serviceUpazila !== 'all') {
                uQuery = uQuery.ilike('upazila', `%${serviceUpazila}%`);
              }
              if (effectiveServiceTerm) {
                uQuery = uQuery.or(`profession.ilike.%${effectiveServiceTerm}%,role.ilike.%${effectiveServiceTerm}%,name.ilike.%${effectiveServiceTerm}%`);
              }
              const { data: uData, error: uErr } = await uQuery;
              if (!uErr && uData && uData.length > 0) {
                prosList = uData.map((sp: any) => ({
                  id: sp.id,
                  name: sp.name || sp.full_name || 'পেশাজীবী ও কারিগর',
                  phone: sp.phone || '',
                  job: sp.profession || sp.role || 'দক্ষ কারিগর',
                  categoryGroup: sp.category || 'সেবা',
                  district: sp.district || '',
                  upazila: sp.upazila || '',
                  area: sp.area || '',
                  experience: sp.experience || '৩+ বছর',
                  dailyRate: sp.daily_rate || sp.rate || 'আলোচনা সাপেক্ষে',
                  bio: sp.bio || '',
                  rating: Number(sp.rating || 4.9),
                  avatar: sp.avatar || '',
                  available: true
                }));
                fetchedFromSupabase = true;
              }
            } catch (e4) {}
          }
        }

        // Fallback to local DataContext professionals
        if (prosList.length === 0) {
          prosList = (contextPros || []).filter(pro => {
            if (serviceDistrict !== 'all' && pro.district && !pro.district.includes(serviceDistrict)) return false;
            if (serviceUpazila !== 'all' && pro.upazila && !pro.upazila.includes(serviceUpazila)) return false;
            if (effectiveServiceTerm) {
              const term = effectiveServiceTerm.toLowerCase();
              const matchName = (pro.name || '').toLowerCase().includes(term);
              const matchJob = (pro.job || (pro as any).profession || '').toLowerCase().includes(term);
              const matchBio = (pro.bio || '').toLowerCase().includes(term);
              if (!matchName && !matchJob && !matchBio) return false;
            }
            return true;
          });
          setResultsSource(fetchedFromSupabase ? 'supabase' : 'fallback');
        } else {
          setResultsSource('supabase');
        }

        setServiceResults(prosList);
      }
      else if (activeCategory === 'circulars') {
        let circsList: JobPosting[] = [];
        let fetchedFromSupabase = false;

        if (isSupabaseConfigured) {
          try {
            let query = supabase.from('job_circulars').select('*');
            if (jobType !== 'all') {
              query = query.ilike('job_type', `%${jobType}%`);
            }
            if (jobLocation !== 'all') {
              query = query.or(`district.ilike.%${jobLocation}%,upazila.ilike.%${jobLocation}%,area.ilike.%${jobLocation}%`);
            }
            const { data, error } = await query;
            if (!error && data && data.length > 0) {
              circsList = data.map((c: any) => ({
                id: c.id,
                title: c.title || c.job_title || 'চাকরির নিয়োগ বিজ্ঞপ্তি',
                companyName: c.company_name || c.organization || 'নিয়োগকারী প্রতিষ্ঠান',
                jobType: (c.job_type || 'Full-time') as JobType,
                category: c.category || 'সাধারণ',
                salary: c.salary || c.salary_range || 'আলোচনা সাপেক্ষে',
                district: c.district || 'বাংলাদেশ',
                upazila: c.upazila || '',
                vacanciesCount: Number(c.vacancy || c.vacancies_count || 1),
                deadline: c.deadline || 'জরুরি ভিত্তিতে নিয়োগ',
                description: c.description || c.requirements || '',
                contactPhone: c.contact_phone || c.phone || '',
                contactEmail: c.contact_email || '',
                status: 'active' as const,
                createdAt: c.created_at || new Date().toISOString()
              }));
              fetchedFromSupabase = true;
            }
          } catch (e) {
            console.warn('[ManualSearch] job_circulars query notice:', e);
          }
        }

        // Fallback to jobService
        if (circsList.length === 0) {
          const serviceListings = await fetchJobListings({
            jobType: jobType !== 'all' ? (jobType as any) : undefined,
            district: jobLocation !== 'all' ? jobLocation : undefined
          });
          circsList = serviceListings;
          setResultsSource(fetchedFromSupabase ? 'supabase' : 'fallback');
        } else {
          setResultsSource('supabase');
        }

        setCircularResults(circsList);
      }
      else if (activeCategory === 'seekers') {
        let seekersList: JobCandidate[] = [];
        let fetchedFromSupabase = false;

        if (isSupabaseConfigured) {
          try {
            let query = supabase.from('job_seekers').select('*');
            if (seekerTargetDistrict !== 'all') {
              query = query.ilike('district', `%${seekerTargetDistrict}%`);
            }
            if (seekerRole !== 'all') {
              query = query.or(`skills_or_job_type.ilike.%${seekerRole}%,desired_job_title.ilike.%${seekerRole}%,name.ilike.%${seekerRole}%`);
            }
            const { data, error } = await query;
            if (!error && data && data.length > 0) {
              seekersList = data.map((s: any) => ({
                id: s.id,
                candidateCode: s.candidate_code || s.candidateCode || s.id?.slice(0, 8),
                name: s.name || s.full_name || 'চাকরিপ্রার্থী',
                phone: s.phone || '',
                email: s.email || '',
                gender: s.gender || 'Male',
                desiredJobTitle: s.desired_job_title || s.skills_or_job_type || s.role || 'প্রার্থী',
                category: s.category || 'সাধারণ',
                expectedSalary: s.expected_salary || s.salary || 'আলোচনা সাপেক্ষে',
                experienceYears: s.experience_years || s.experience || '১ বছর',
                highestEducation: s.highest_education || s.education || 'মাধ্যমিক / উচ্চ মাধ্যমিক',
                skills: Array.isArray(s.skills) ? s.skills : [s.skills_or_job_type || 'দক্ষ'],
                division: s.division || '',
                district: s.district || '',
                upazila: s.upazila || '',
                address: s.address || '',
                bio: s.bio || '',
                resumeUrl: s.resume_url || '',
                status: s.status || 'available',
                createdAt: s.created_at || new Date().toISOString()
              }));
              fetchedFromSupabase = true;
            }
          } catch (e) {
            console.warn('[ManualSearch] job_seekers query notice:', e);
          }
        }

        // Fallback to jobService
        if (seekersList.length === 0) {
          const serviceCandidates = await fetchJobCandidates({
            district: seekerTargetDistrict !== 'all' ? seekerTargetDistrict : undefined,
            search: seekerRole !== 'all' ? seekerRole : undefined
          });
          seekersList = serviceCandidates;
          setResultsSource(fetchedFromSupabase ? 'supabase' : 'fallback');
        } else {
          setResultsSource('supabase');
        }

        setSeekerResults(seekersList);
      }

      // Log search analytics asynchronously with zero PII
      try {
        let queryText = '';
        let category: any = 'general';
        let district = '';
        let upazila = '';
        let count = 0;

        if (activeCategory === 'blood') {
          category = 'blood';
          queryText = bloodGroup !== 'all' ? `${bloodGroup} রক্তদাতা` : 'রক্তদাতা অনুসন্ধান';
          district = bloodDistrict !== 'all' ? bloodDistrict : '';
          upazila = bloodUpazila !== 'all' ? bloodUpazila : '';
          count = bloodResults.length;
        } else if (activeCategory === 'products') {
          category = 'products';
          queryText = productKeyword.trim() || (productItem !== 'all' ? productItem : 'পাহাড়ি পণ্য ও ফসল');
          district = productDistrict !== 'all' ? productDistrict : '';
          upazila = productUpazila !== 'all' ? productUpazila : '';
          count = productResults.length;
        } else if (activeCategory === 'services') {
          category = 'services';
          queryText = serviceKeyword.trim() || (serviceItem !== 'all' ? serviceItem : 'মিস্ত্রি ও কারিগরি সেবা');
          district = serviceDistrict !== 'all' ? serviceDistrict : '';
          upazila = serviceUpazila !== 'all' ? serviceUpazila : '';
          count = serviceResults.length;
        } else if (activeCategory === 'circulars') {
          category = 'circulars';
          queryText = jobType !== 'all' ? `${jobType} চাকরির বিজ্ঞপ্তি` : 'চাকরির বিজ্ঞপ্তি';
          district = jobLocation !== 'all' ? jobLocation : '';
          count = circularResults.length;
        } else if (activeCategory === 'seekers') {
          category = 'seekers';
          queryText = seekerRole !== 'all' ? `${seekerRole} কর্মী` : 'দক্ষ কর্মী সন্ধান';
          district = seekerTargetDistrict !== 'all' ? seekerTargetDistrict : '';
          count = seekerResults.length;
        }

        analyticsService.logSearchLog({
          queryText,
          category,
          source: 'manual',
          locationParams: { district, upazila },
          isZeroResult: count === 0,
          resultsCount: count,
        });
      } catch (err) {
        console.warn('[ManualSearch] search logging error:', err);
      }
    } catch (error) {
      console.error('[ManualSearch] error during query:', error);
      if (onShowToast) {
        onShowToast(isBn ? 'ডাটাবেস অনুসন্ধানে সাময়িক সমস্যা দেখা দিয়েছে।' : 'Error searching database.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Clear search results on category change so no default products/cards render initially
  useEffect(() => {
    setHasSearched(false);
    setBloodResults([]);
    setProductResults([]);
    setServiceResults([]);
    setCircularResults([]);
    setSeekerResults([]);
    setIsBloodPhoneUnregistered(false);
    setBloodPhoneError('');
  }, [activeCategory]);

  return (
    <div className="w-full flex flex-col bg-[#f8f9fa] min-h-screen">
      
      {/* Sub-header below the main header */}
      <div className="w-full bg-emerald-800 text-emerald-50 px-3.5 py-2.5 text-center shadow-xs border-b border-emerald-900/30">
        <p className="text-xs sm:text-sm font-bold tracking-wide">
          আপনার প্রয়োজনীয় সকল পণ্য, সেবা, চাকরি, রক্ত আপনার যাবতীয় সবকিছু এখানে খোঁজ করুন.
        </p>
      </div>

      {/* Unified Category Bar */}
      <div className="w-full px-2.5 sm:px-4 pt-2.5 pb-1 max-w-3xl mx-auto">
        <div 
          className="bg-white p-1 sm:p-1.5 rounded-2xl border border-stone-200/90 shadow-2xs flex items-center gap-1 sm:gap-1.5 overflow-x-auto no-scrollbar"
          role="tablist"
          aria-label="Categories"
        >
          {/* 1. সেবাদাতা (Service Provider) */}
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === 'services'}
            id="tab-manual-search-services"
            onClick={() => setActiveCategory('services')}
            className={`flex-1 min-w-[76px] sm:min-w-0 flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-2 sm:px-3 rounded-xl text-xs sm:text-[13px] font-bold cursor-pointer transition-all select-none whitespace-nowrap ${
              activeCategory === 'services'
                ? 'bg-[#15803d] text-white shadow-xs'
                : 'text-slate-700 hover:bg-stone-100 hover:text-slate-900'
            }`}
          >
            <Wrench className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${activeCategory === 'services' ? 'text-white' : 'text-[#15803d]'}`} />
            <span>{isBn ? 'সেবাদাতা' : 'Service Provider'}</span>
          </button>

          {/* 2. পণ্য বিক্রেতা (Product Seller) */}
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === 'products'}
            id="tab-manual-search-products"
            onClick={() => setActiveCategory('products')}
            className={`flex-1 min-w-[76px] sm:min-w-0 flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-2 sm:px-3 rounded-xl text-xs sm:text-[13px] font-bold cursor-pointer transition-all select-none whitespace-nowrap ${
              activeCategory === 'products'
                ? 'bg-[#15803d] text-white shadow-xs'
                : 'text-slate-700 hover:bg-stone-100 hover:text-slate-900'
            }`}
          >
            <ShoppingBag className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${activeCategory === 'products' ? 'text-white' : 'text-[#15803d]'}`} />
            <span>{isBn ? 'পণ্য বিক্রেতা' : 'Product Seller'}</span>
          </button>

          {/* 3. চাকরি (Jobs) */}
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === 'circulars' || activeCategory === 'seekers'}
            id="tab-manual-search-jobs"
            onClick={() => {
              if (activeCategory !== 'circulars' && activeCategory !== 'seekers') {
                setActiveCategory(jobsSubCategory);
              }
            }}
            className={`flex-1 min-w-[76px] sm:min-w-0 flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-2 sm:px-3 rounded-xl text-xs sm:text-[13px] font-bold cursor-pointer transition-all select-none whitespace-nowrap ${
              (activeCategory === 'circulars' || activeCategory === 'seekers')
                ? 'bg-[#15803d] text-white shadow-xs'
                : 'text-slate-700 hover:bg-stone-100 hover:text-slate-900'
            }`}
          >
            <Briefcase className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${(activeCategory === 'circulars' || activeCategory === 'seekers') ? 'text-white' : 'text-[#15803d]'}`} />
            <span>{isBn ? 'চাকরি' : 'Jobs'}</span>
          </button>

          {/* 4. রক্তদাতা (Blood Donor) */}
          <button
            type="button"
            role="tab"
            aria-selected={activeCategory === 'blood'}
            id="tab-manual-search-blood"
            onClick={() => setActiveCategory('blood')}
            className={`flex-1 min-w-[76px] sm:min-w-0 flex items-center justify-center gap-1 sm:gap-1.5 py-2 px-2 sm:px-3 rounded-xl text-xs sm:text-[13px] font-bold cursor-pointer transition-all select-none whitespace-nowrap ${
              activeCategory === 'blood'
                ? 'bg-[#15803d] text-white shadow-xs'
                : 'text-slate-700 hover:bg-stone-100 hover:text-slate-900'
            }`}
          >
            <Droplet className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${activeCategory === 'blood' ? 'text-white' : 'text-red-600'}`} />
            <span>{isBn ? 'রক্তদাতা' : 'Blood Donor'}</span>
          </button>
        </div>
      </div>

      {/* 4. Shifted Upwards Form Inputs Container & Results */}
      <div className="max-w-3xl mx-auto w-full px-2.5 sm:px-4 py-1 space-y-2.5">

        {/* Clean, Minimal Form Card */}
        <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-stone-200/70 shadow-2xs space-y-2.5">
          
          {/* ================= FORM: 1. সেবাদাতা (Services) ================= */}
          {activeCategory === 'services' && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
                {/* 1. Searchable / Auto-suggest Profession Input Box (1,000+ Professions) */}
                <div className="relative" ref={professionDropdownRef}>
                  <label className="block text-[10.5px] sm:text-xs font-bold text-slate-700 mb-0.5">
                    {isBn ? 'প্রয়োজনীয় সেবা / পেশা *' : 'Select Service / Profession *'}
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="input-searchable-profession"
                      value={professionSearchInput}
                      onChange={(e) => {
                        const val = e.target.value;
                        setProfessionSearchInput(val);
                        setServiceKeyword(val);
                        setIsProfessionDropdownOpen(true);
                      }}
                      onFocus={() => setIsProfessionDropdownOpen(true)}
                      placeholder={isBn ? 'পেশার নাম লিখুন (যেমন: রাজমিস্ত্রি, মেকানিক)...' : 'Search profession (e.g. Electrician, Mason)...'}
                      className="w-full text-xs font-medium pl-8 pr-14 py-2 bg-stone-50/70 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-[#15803d] focus:bg-white text-slate-800"
                    />
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                    
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {professionSearchInput && (
                        <button
                          type="button"
                          onClick={() => {
                            setProfessionSearchInput('');
                            setServiceItem('all');
                            setServiceKeyword('');
                            setIsProfessionDropdownOpen(false);
                          }}
                          className="p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                          aria-label="Clear"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsProfessionDropdownOpen(prev => !prev)}
                        className="p-0.5 text-slate-400 hover:text-slate-600 cursor-pointer"
                        aria-label="Toggle professions dropdown"
                      >
                        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-150 ${isProfessionDropdownOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>

                  {/* Auto-suggest dropdown from ALL_1000_PROFESSIONS_FLAT_LIST */}
                  {isProfessionDropdownOpen && (
                    <div className="absolute top-full left-0 right-0 sm:min-w-[280px] z-50 mt-1 max-h-56 overflow-y-auto bg-white border border-stone-200 rounded-xl shadow-xl py-1 text-left">
                      <div className="px-3 py-1.5 bg-stone-50 border-b border-stone-100 flex items-center justify-between text-[10px] text-stone-500 font-semibold">
                        <span>{isBn ? '১০০০+ পেশা তালিকা' : '1000+ Professions'}</span>
                        <span className="text-[#15803d] font-bold">{filteredProfessions.length} টি</span>
                      </div>
                      {filteredProfessions.length > 0 ? (
                        filteredProfessions.map((prof, idx) => (
                          <button
                            key={`${prof.id}-${idx}`}
                            type="button"
                            onClick={() => {
                              setProfessionSearchInput(prof.name);
                              setServiceItem(prof.name);
                              setServiceKeyword(prof.name);
                              setIsProfessionDropdownOpen(false);
                            }}
                            className="w-full px-3 py-2 text-left hover:bg-emerald-50/80 flex items-center justify-between gap-2 text-xs transition-colors cursor-pointer border-b border-stone-100/60 last:border-b-0"
                          >
                            <span className="font-semibold text-slate-800">{prof.name}</span>
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-stone-100 text-stone-600 shrink-0">
                              {prof.category || prof.subCategory}
                            </span>
                          </button>
                        ))
                      ) : (
                        <div className="px-3 py-3 text-center text-xs text-stone-500">
                          <p className="mb-1.5">{isBn ? 'এই নামে নির্দিষ্ট পেশা তালিকায় নেই।' : 'No matching profession found.'}</p>
                          <button
                            type="button"
                            onClick={() => {
                              setServiceItem(professionSearchInput.trim());
                              setServiceKeyword(professionSearchInput.trim());
                              setIsProfessionDropdownOpen(false);
                            }}
                            className="text-[11px] font-bold text-[#15803d] hover:underline cursor-pointer"
                          >
                            {isBn ? `"${professionSearchInput}" দিয়ে খুঁজুন` : `Search with "${professionSearchInput}"`}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* 2. District Dropdown */}
                <div>
                  <label className="block text-[10.5px] sm:text-xs font-bold text-slate-700 mb-0.5">
                    {isBn ? 'জেলা নির্বাচন করুন *' : 'Select District *'}
                  </label>
                  <select
                    value={serviceDistrict}
                    onChange={(e) => setServiceDistrict(e.target.value)}
                    className="w-full text-xs font-medium px-2.5 py-2 bg-stone-50/70 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-[#15803d] focus:bg-white text-slate-800 cursor-pointer"
                  >
                    <option value="all">{isBn ? 'সকল জেলা (বাংলাদেশ)' : 'All Districts'}</option>
                    {allDistricts.map(dist => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Cascading Upazila Dropdown */}
                <div>
                  <label className="block text-[10.5px] sm:text-xs font-bold text-slate-700 mb-0.5">
                    {isBn ? 'উপজেলা / থানা' : 'Select Upazila / Thana'}
                  </label>
                  <select
                    value={serviceUpazila}
                    onChange={(e) => setServiceUpazila(e.target.value)}
                    disabled={serviceDistrict === 'all'}
                    className={`w-full text-xs font-medium px-2.5 py-2 bg-stone-50/70 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-[#15803d] focus:bg-white text-slate-800 ${
                      serviceDistrict === 'all' ? 'opacity-60 cursor-not-allowed bg-stone-100' : 'cursor-pointer'
                    }`}
                  >
                    <option value="all">
                      {serviceDistrict === 'all' 
                        ? (isBn ? 'আগে জেলা নির্বাচন করুন' : 'Select district first') 
                        : (isBn ? 'সকল উপজেলা / থানা' : 'All Upazilas')}
                    </option>
                    {getUpazilasForDistrict(serviceDistrict).map(up => (
                      <option key={up} value={up}>{up}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Popular Profession Quick Chips */}
              <div className="pt-0.5 flex flex-wrap items-center gap-1">
                <span className="text-[10px] font-bold text-slate-500 mr-1">
                  {isBn ? 'জনপ্রিয়:' : 'Popular:'}
                </span>
                {[
                  'রাজমিস্ত্রি', 'ইলেকট্রিশিয়ান', 'প্লাম্বার', 'মেকানিক', 
                  'কাঠমিস্ত্রি', 'রংমিস্ত্রি', 'ড্রাইভার', 'হোম টিউটর', 'শিক্ষক'
                ].map((popItem) => (
                  <button
                    key={popItem}
                    type="button"
                    onClick={() => {
                      setProfessionSearchInput(popItem);
                      setServiceItem(popItem);
                      setServiceKeyword(popItem);
                      setIsProfessionDropdownOpen(false);
                    }}
                    className={`text-[10.5px] px-2 py-0.5 rounded-full border transition-all cursor-pointer ${
                      professionSearchInput === popItem
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300 font-bold'
                        : 'bg-stone-50 hover:bg-stone-100 text-stone-600 border-stone-200'
                    }`}
                  >
                    {popItem}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ================= FORM: 2. পণ্য বিক্রেতা (Products/Sellers) ================= */}
          {activeCategory === 'products' && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
                {/* 1. Select Product Dropdown */}
                <div>
                  <label className="block text-[10.5px] sm:text-xs font-bold text-slate-700 mb-0.5">
                    {isBn ? 'পণ্য বা ফসলের নাম *' : 'Select Product / Crop *'}
                  </label>
                  <select
                    value={productItem}
                    onChange={(e) => setProductItem(e.target.value)}
                    className="w-full text-xs font-medium px-2.5 py-2 bg-stone-50/70 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-[#15803d] focus:bg-white text-slate-800 cursor-pointer"
                  >
                    {POPULAR_PRODUCTS_CROPS.map(p => (
                      <option key={p.id} value={p.id}>{isBn ? p.nameBn : p.nameEn}</option>
                    ))}
                  </select>
                </div>

                {/* 2. District Dropdown */}
                <div>
                  <label className="block text-[10.5px] sm:text-xs font-bold text-slate-700 mb-0.5">
                    {isBn ? 'জেলা নির্বাচন করুন *' : 'Select District *'}
                  </label>
                  <select
                    value={productDistrict}
                    onChange={(e) => setProductDistrict(e.target.value)}
                    className="w-full text-xs font-medium px-2.5 py-2 bg-stone-50/70 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-[#15803d] focus:bg-white text-slate-800 cursor-pointer"
                  >
                    <option value="all">{isBn ? 'সকল জেলা (বাংলাদেশ)' : 'All Districts'}</option>
                    {allDistricts.map(dist => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>

                {/* 3. Cascading Upazila Dropdown */}
                <div>
                  <label className="block text-[10.5px] sm:text-xs font-bold text-slate-700 mb-0.5">
                    {isBn ? 'উপজেলা / থানা' : 'Select Upazila / Thana'}
                  </label>
                  <select
                    value={productUpazila}
                    onChange={(e) => setProductUpazila(e.target.value)}
                    disabled={productDistrict === 'all'}
                    className={`w-full text-xs font-medium px-2.5 py-2 bg-stone-50/70 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-[#15803d] focus:bg-white text-slate-800 ${
                      productDistrict === 'all' ? 'opacity-60 cursor-not-allowed bg-stone-100' : 'cursor-pointer'
                    }`}
                  >
                    <option value="all">
                      {productDistrict === 'all' 
                        ? (isBn ? 'আগে জেলা নির্বাচন করুন' : 'Select district first') 
                        : (isBn ? 'সকল উপজেলা / থানা' : 'All Upazilas')}
                    </option>
                    {getUpazilasForDistrict(productDistrict).map(up => (
                      <option key={up} value={up}>{up}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Optional Refinement Input */}
              <div>
                <input
                  type="text"
                  placeholder={isBn ? 'অথবা নির্দিষ্ট জাত/নাম লিখুন (যেমন: হিমসাগর, আম্রপালি)...' : 'Or enter custom product keyword...'}
                  value={productKeyword}
                  onChange={(e) => setProductKeyword(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 sm:py-2 bg-stone-50/70 border border-stone-200 rounded-lg text-slate-700 focus:outline-none focus:ring-1.5 focus:ring-[#15803d] focus:bg-white"
                />
              </div>
            </div>
          )}

          {/* ================= FORM: 3. চাকরি (Jobs: Circulars & Seekers) ================= */}
          {(activeCategory === 'circulars' || activeCategory === 'seekers') && (
            <div className="space-y-2.5">
              {/* Jobs Sub-Category Toggle */}
              <div className="flex items-center justify-center p-1 bg-stone-100 rounded-xl max-w-sm mx-auto border border-stone-200/80">
                <button
                  type="button"
                  id="tab-sub-job-circulars"
                  onClick={() => {
                    setJobsSubCategory('circulars');
                    setActiveCategory('circulars');
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeCategory === 'circulars'
                      ? 'bg-white text-[#15803d] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <Briefcase className="w-3.5 h-3.5" />
                  <span>{isBn ? 'চাকরির সার্কুলার' : 'Job Circulars'}</span>
                </button>
                <button
                  type="button"
                  id="tab-sub-job-seekers"
                  onClick={() => {
                    setJobsSubCategory('seekers');
                    setActiveCategory('seekers');
                  }}
                  className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                    activeCategory === 'seekers'
                      ? 'bg-white text-[#15803d] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{isBn ? 'চাকরিপ্রার্থী' : 'Job Seekers'}</span>
                </button>
              </div>

              {activeCategory === 'circulars' ? (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                    {/* 1. Job Type Dropdown */}
                    <div>
                      <label className="block text-[10.5px] sm:text-xs font-bold text-slate-700 mb-0.5">
                        {isBn ? 'কাজের ধরন নির্বাচন করুন *' : 'Select Job Type *'}
                      </label>
                      <select
                        value={jobType}
                        onChange={(e) => setJobType(e.target.value)}
                        className="w-full text-xs font-medium px-2.5 py-2 bg-stone-50/70 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-[#15803d] focus:bg-white text-slate-800 cursor-pointer"
                      >
                        {JOB_CIRCULAR_TYPES.map(j => (
                          <option key={j.id} value={j.id}>{isBn ? j.nameBn : j.nameEn}</option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Job Location / District Dropdown */}
                    <div>
                      <label className="block text-[10.5px] sm:text-xs font-bold text-slate-700 mb-0.5">
                        {isBn ? 'কাজের লোকেশন / জেলা *' : 'Select Location / District *'}
                      </label>
                      <select
                        value={jobLocation}
                        onChange={(e) => setJobLocation(e.target.value)}
                        className="w-full text-xs font-medium px-2.5 py-2 bg-stone-50/70 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-[#15803d] focus:bg-white text-slate-800 cursor-pointer"
                      >
                        <option value="all">{isBn ? 'সকল লোকেশন / সারা বাংলাদেশ' : 'All Locations'}</option>
                        {allDistricts.map(dist => (
                          <option key={dist} value={dist}>{dist}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Employer Action Banner: Post Job Circular */}
                  <div className="pt-2 border-t border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-amber-50/50 p-2.5 rounded-xl border border-amber-200/60">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                        <Briefcase className="w-4 h-4 text-amber-700" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-800">
                          {isBn ? 'কর্মী নিয়োগ দিতে চান?' : 'Looking to hire employees?'}
                        </span>
                        <span className="block text-[10.5px] text-slate-500">
                          {isBn ? 'আপনার প্রতিষ্ঠানের নিয়োগ বিজ্ঞপ্তি সহজে পোস্ট করুন (PDF/Image)' : 'Post job circular easily with PDF or image upload'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      id="btn-post-job-circular"
                      onClick={() => {
                        setJobPostError('');
                        setIsJobPostingModalOpen(true);
                      }}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer shrink-0 active:scale-98"
                    >
                      <PlusCircle className="w-4 h-4 text-white" />
                      <span>{isBn ? 'চাকরির সার্কুলার পোস্ট করুন' : 'Post Job Circular'}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5">
                    {/* 1. Role Selection */}
                    <div>
                      <label className="block text-[10.5px] sm:text-xs font-bold text-slate-700 mb-0.5">
                        {isBn ? 'প্রত্যাশিত পদ / রোল *' : 'Select Role / Title *'}
                      </label>
                      <select
                        value={seekerRole}
                        onChange={(e) => setSeekerRole(e.target.value)}
                        className="w-full text-xs font-medium px-2.5 py-2 bg-stone-50/70 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-[#15803d] focus:bg-white text-slate-800 cursor-pointer"
                      >
                        {JOB_SEEKER_ROLES.map(r => (
                          <option key={r.id} value={r.id}>{isBn ? r.nameBn : r.nameEn}</option>
                        ))}
                      </select>
                    </div>

                    {/* 2. Target District Selection */}
                    <div>
                      <label className="block text-[10.5px] sm:text-xs font-bold text-slate-700 mb-0.5">
                        {isBn ? 'কাঙ্ক্ষিত জেলা *' : 'Select Target District *'}
                      </label>
                      <select
                        value={seekerTargetDistrict}
                        onChange={(e) => setSeekerTargetDistrict(e.target.value)}
                        className="w-full text-xs font-medium px-2.5 py-2 bg-stone-50/70 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-[#15803d] focus:bg-white text-slate-800 cursor-pointer"
                      >
                        <option value="all">{isBn ? 'সকল জেলা (সারা বাংলাদেশ)' : 'All Districts'}</option>
                        {allDistricts.map(dist => (
                          <option key={dist} value={dist}>{dist}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Candidate Action Banner: Submit Bio-data / CV */}
                  <div className="pt-2 border-t border-stone-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-purple-50/50 p-2.5 rounded-xl border border-purple-200/60">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-lg bg-purple-100 flex items-center justify-center shrink-0">
                        <UserCheck className="w-4 h-4 text-purple-700" />
                      </div>
                      <div>
                        <span className="block text-xs font-bold text-slate-800">
                          {isBn ? 'চাকরি খুঁজছেন? বায়োডাটা বা সিভি জমা দিন' : 'Looking for a job? Submit your CV'}
                        </span>
                        <span className="block text-[10.5px] text-slate-500">
                          {isBn ? 'বিস্তারিত ফর্ম পূরণ করুন অথবা সরাসরি ফাইল (PDF/Image) আপলোড করুন' : 'Fill bio-data form or upload CV file directly'}
                        </span>
                      </div>
                    </div>

                    <button
                      type="button"
                      id="btn-submit-job-seeker"
                      onClick={() => {
                        setJobSeekerError('');
                        setIsJobSeekerModalOpen(true);
                      }}
                      className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs transition-all cursor-pointer shrink-0 active:scale-98"
                    >
                      <PlusCircle className="w-4 h-4 text-white" />
                      <span>{isBn ? 'বায়োডাটা / সিভি জমা দিন' : 'Submit Bio-data / CV'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= FORM: 5. রক্তদাতা (Blood Donors) ================= */}
          {activeCategory === 'blood' && (
            <div className="space-y-2.5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-2.5">
                {/* Field 1: [রক্তের গ্রুপ নির্বাচন করুন] */}
                <div>
                  <label htmlFor="field-blood-group-select" className="block text-[10.5px] sm:text-xs font-bold text-slate-700 mb-0.5">
                    {isBn ? 'রক্তের গ্রুপ *' : 'Blood Group *'}
                  </label>
                  <select
                    id="field-blood-group-select"
                    value={bloodGroup}
                    onChange={(e) => setBloodGroup(e.target.value)}
                    className="w-full text-xs font-medium px-2.5 py-2 bg-stone-50/70 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-[#15803d] focus:bg-white text-slate-800 cursor-pointer"
                  >
                    <option value="all">{isBn ? 'সকল রক্তের গ্রুপ' : 'All Blood Groups'}</option>
                    {BLOOD_GROUPS.filter(b => b !== 'all').map(bg => (
                      <option key={bg} value={bg}>{bg}</option>
                    ))}
                  </select>
                </div>

                {/* Field 2: [জেলা নির্বাচন করুন] */}
                <div>
                  <label htmlFor="field-blood-district-select" className="block text-[10.5px] sm:text-xs font-bold text-slate-700 mb-0.5">
                    {isBn ? 'জেলা *' : 'District *'}
                  </label>
                  <select
                    id="field-blood-district-select"
                    value={bloodDistrict}
                    onChange={(e) => setBloodDistrict(e.target.value)}
                    className="w-full text-xs font-medium px-2.5 py-2 bg-stone-50/70 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-[#15803d] focus:bg-white text-slate-800 cursor-pointer"
                  >
                    <option value="all">{isBn ? 'সকল জেলা (বাংলাদেশ)' : 'All Districts'}</option>
                    {allDistricts.map(dist => (
                      <option key={dist} value={dist}>{dist}</option>
                    ))}
                  </select>
                </div>

                {/* Field 3: [উপজেলা/থানা নির্বাচন করুন] */}
                <div>
                  <label htmlFor="field-blood-upazila-select" className="block text-[10.5px] sm:text-xs font-bold text-slate-700 mb-0.5">
                    {isBn ? 'উপজেলা / থানা' : 'Upazila / Thana'}
                  </label>
                  <select
                    id="field-blood-upazila-select"
                    value={bloodUpazila}
                    onChange={(e) => setBloodUpazila(e.target.value)}
                    disabled={bloodDistrict === 'all'}
                    className={`w-full text-xs font-medium px-2.5 py-2 bg-stone-50/70 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-[#15803d] focus:bg-white text-slate-800 ${
                      bloodDistrict === 'all' ? 'opacity-60 cursor-not-allowed bg-stone-100' : 'cursor-pointer'
                    }`}
                  >
                    <option value="all">
                      {bloodDistrict === 'all' 
                        ? (isBn ? 'আগে জেলা নির্বাচন করুন' : 'Select district first') 
                        : (isBn ? 'সকল উপজেলা / থানা' : 'All Upazilas')}
                    </option>
                    {getUpazilasForDistrict(bloodDistrict).map(up => (
                      <option key={up} value={up}>{up}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Mandatory Phone Number Input Field */}
              <div className="pt-0.5">
                <label htmlFor="field-blood-search-phone" className="block text-[10.5px] sm:text-xs font-bold text-slate-700 mb-0.5 flex items-center justify-between">
                  <span>
                    {isBn ? 'আপনার মোবাইল নম্বর ' : 'Your Mobile Number '}
                    <span className="text-rose-600 font-black">*</span>
                  </span>
                  {bloodPhoneError && (
                    <span className="text-[10.5px] text-rose-600 font-semibold flex items-center gap-0.5">
                      <AlertCircle className="w-3 h-3 shrink-0" />
                      <span>{bloodPhoneError}</span>
                    </span>
                  )}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <Phone className="w-3.5 h-3.5" />
                  </div>
                  <input
                    type="tel"
                    id="field-blood-search-phone"
                    value={bloodSearchPhone}
                    onChange={(e) => {
                      setBloodSearchPhone(e.target.value);
                      if (bloodPhoneError) setBloodPhoneError('');
                    }}
                    placeholder={isBn ? "১১ ডিজিটের মোবাইল নম্বর দিন" : "Enter 11-digit mobile number"}
                    className={`w-full text-xs font-semibold pl-8 pr-3 py-2 bg-stone-50/70 border rounded-lg focus:outline-none focus:ring-1.5 focus:bg-white text-slate-800 transition ${
                      bloodPhoneError 
                        ? 'border-rose-400 focus:ring-rose-200 bg-rose-50/20 text-rose-900' 
                        : 'border-stone-200 focus:ring-[#15803d]'
                    }`}
                  />
                </div>
                {bloodPhoneError && (
                  <p className="mt-1 text-[11px] text-rose-600 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                    <span>{bloodPhoneError}</span>
                  </p>
                )}
              </div>

              {/* Safety notice banner */}
              <div className="bg-emerald-50/60 border border-emerald-200/60 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 text-emerald-900 text-[10.5px] font-medium">
                <Lock className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>
                  {isBn 
                    ? 'রক্তদাতাদের তথ্যের গোপনীয়তা ও সুরক্ষা রক্ষায় ঝাদিমাদি অঙ্গীকারাবদ্ধ।' 
                    : 'Sign in is required prior to searching to ensure blood donor data safety.'}
                </span>
              </div>
            </div>
          )}

          {/* Prominent Search Action Button ("খুঁজুন") */}
          <div className="pt-2 border-t border-stone-100">
            <button
              type="button"
              id="btn-manual-search-submit"
              onClick={handleSearch}
              disabled={isLoading}
              className="w-full py-2.5 sm:py-2.5 px-4 rounded-xl font-bold text-xs sm:text-sm text-white flex items-center justify-center gap-2 cursor-pointer transition-all duration-150 bg-[#15803d] hover:bg-[#166534] active:scale-[0.99] shadow-xs"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>{isBn ? 'অনুসন্ধান করা হচ্ছে...' : 'Searching...'}</span>
                </>
              ) : (
                <>
                  <Search className="w-3.5 h-3.5" />
                  <span>{isBn ? 'খুঁজুন' : 'Search'}</span>
                </>
              )}
            </button>
          </div>

        </div>

        {/* 3. Results Section (Only rendered AFTER user clicks "খুঁজুন") */}
        {hasSearched && (
          <>
            {/* Results Header */}
            <div className="flex items-center justify-between px-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black text-gray-800">
                  {isBn ? 'অনুসন্ধানের ফলাফল' : 'Search Results'}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                  {activeCategory === 'blood' && `${bloodResults.length} জন`}
                  {activeCategory === 'products' && `${productResults.length} টি`}
                  {activeCategory === 'services' && `${serviceResults.length} জন`}
                  {activeCategory === 'circulars' && `${circularResults.length} টি`}
                  {activeCategory === 'seekers' && `${seekerResults.length} জন`}
                </span>
              </div>

              <span className="text-[10px] text-gray-400 font-medium">
                {resultsSource === 'supabase' 
                  ? (isBn ? '✓ সরাসরি Supabase ডাটাবেস' : '✓ Direct Supabase Table') 
                  : (isBn ? '✓ লোকাল ভেরিফাইড ক্যাশ' : '✓ Verified Local Storage')}
              </span>
            </div>

        {/* 4. Results Cards List / Grid */}
        {isLoading ? (
          <div className="bg-white rounded-2xl p-10 flex flex-col items-center justify-center gap-2 text-center border border-gray-200 shadow-2xs">
            <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
            <p className="text-xs font-bold text-gray-700">
              {isBn ? 'সরাসরি ডাটাবেস থেকে তথ্য লোড হচ্ছে...' : 'Fetching live records from database...'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">

            {/* ================= RESULTS: BLOOD DONORS ================= */}
            {activeCategory === 'blood' && (
              bloodResults.length === 0 ? (
                <EmptyResultsView isBn={isBn} onReset={() => {
                  setBloodGroup('all');
                  setBloodDistrict('all');
                  setBloodUpazila('all');
                  setHasSearchedBlood(false);
                }} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {bloodResults.map((donor, idx) => {
                    const rawPhone = donor.phone ? String(donor.phone).trim() : '';
                    const cleanDigits = rawPhone.replace(/[^0-9+]/g, '');
                    const maskedPhone = cleanDigits.length >= 10 
                      ? `${cleanDigits.slice(0, 3)}******${cleanDigits.slice(-2)}` 
                      : '০১৮******XX';

                    const handleOpenDonor = () => {
                      if (onViewDonorProfile) {
                        onViewDonorProfile(donor);
                      } else if (onViewWorkerProfile) {
                        onViewWorkerProfile(donor);
                      } else {
                        setSelectedBloodDonorModal(donor);
                      }
                    };

                    return (
                      <div 
                        key={donor.id || idx}
                        onClick={handleOpenDonor}
                        className="bg-white rounded-2xl p-3.5 border border-rose-100 shadow-xs hover:shadow-md transition flex flex-col justify-between text-left cursor-pointer group hover:border-rose-300"
                      >
                        <div className="flex items-start justify-between gap-2.5 mb-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-200 flex flex-col items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                              <Droplet className="w-4 h-4 text-rose-600 fill-rose-600" />
                              <span className="text-[10px] font-black text-rose-700 leading-none mt-0.5">{donor.bloodGroup}</span>
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h3 className="text-xs sm:text-sm font-black text-gray-900 leading-tight group-hover:text-rose-600 transition-colors">
                                  {donor.name}
                                </h3>
                                {donor.verified && (
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                )}
                              </div>
                              <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
                                <MapPin className="w-3 h-3 text-gray-400" />
                                <span>{donor.upazila ? `${donor.upazila}, ` : ''}{donor.district || 'বাংলাদেশ'}</span>
                              </div>
                            </div>
                          </div>

                          <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-full ${
                            donor.isAvailable 
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                              : 'bg-gray-100 text-gray-600 border border-gray-200'
                          }`}>
                            {donor.isAvailable ? (isBn ? 'রক্তদানে প্রস্তুত' : 'Available') : (isBn ? 'অনুপলব্ধ' : 'Unavailable')}
                          </span>
                        </div>

                        {/* Details row */}
                        <div className="bg-slate-50 rounded-xl p-2 mb-3 text-[10px] text-gray-600 space-y-1">
                          <div className="flex justify-between">
                            <span>{isBn ? 'সর্বশেষ রক্তদান:' : 'Last Donation:'}</span>
                            <span className="font-semibold text-gray-800">{donor.lastDonationDate || (isBn ? 'নতুন রক্তদাতা' : 'New donor')}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>{isBn ? 'মোট রক্তদান:' : 'Total Donations:'}</span>
                            <span className="font-bold text-rose-700">{donor.totalDonations || 0} বার</span>
                          </div>
                          <div className="flex justify-between items-center text-[9px] text-slate-500 pt-0.5 border-t border-slate-200/60">
                            <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                              <ShieldCheck className="w-3 h-3 text-emerald-600" />
                              <span>{isBn ? 'ব্যক্তিগত তথ্য সুরক্ষিত' : 'Data Protected'}</span>
                            </span>
                            <span className="text-[8px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                              {isBn ? 'অ্যাডমিন অ্যাক্সেস' : 'Admin Access'}
                            </span>
                          </div>
                        </div>

                        {/* Action buttons: Direct Call & Profile View */}
                        <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100" onClick={(e) => e.stopPropagation()}>
                          {donor.phone ? (
                            <a
                              href={`tel:${donor.phone.replace(/[^\d+]/g, '')}`}
                              className="w-full py-1.5 px-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-2xs"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{isBn ? 'যোগাযোগ করুন' : 'Contact / Call'}</span>
                            </a>
                          ) : (
                            <button
                              disabled
                              className="w-full py-1.5 px-2 rounded-xl bg-gray-100 text-gray-400 text-xs font-semibold"
                            >
                              {isBn ? 'নম্বর গোপন' : 'Private'}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={handleOpenDonor}
                            className="w-full py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-gray-800 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <Eye className="w-3 h-3 text-gray-500" />
                            <span>{isBn ? 'বিস্তারিত প্রোফাইল' : 'Profile'}</span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}

            {/* ================= RESULTS: 2. PRODUCTS & CROPS ================= */}
            {activeCategory === 'products' && (
              productResults.length === 0 ? (
                <EmptyResultsView isBn={isBn} onReset={() => {
                  setProductItem('all');
                  setProductKeyword('');
                  setProductDistrict('all');
                  setProductUpazila('all');
                  handleSearch();
                }} />
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3.5 md:gap-4">
                  {productResults.map((product, idx) => (
                    <div 
                      key={product.id || idx}
                      className="bg-white rounded-2xl overflow-hidden border border-gray-200 shadow-xs hover:shadow-md transition flex flex-col justify-between text-left group"
                    >
                      <div className="relative w-full h-32 bg-slate-100 rounded-md overflow-hidden shrink-0">
                        <img 
                          src={getProductPublicUrl(product.image)} 
                          alt={product.nameBn} 
                          className="w-full h-32 object-cover rounded-md group-hover:scale-105 transition duration-300"
                          onError={(e) => {
                            const target = e.currentTarget as HTMLImageElement;
                            target.onerror = null;
                            target.src = NO_IMAGE_AVAILABLE_ICON;
                          }}
                        />
                        <span className="absolute bottom-2 right-2 text-[9.5px] font-black bg-black/75 text-white px-2 py-0.5 rounded-full backdrop-blur-xs">
                          ৳{product.price} /{product.unit || 'কেজি'}
                        </span>
                      </div>

                      <div className="p-3 flex flex-col justify-between flex-1">
                        <div>
                          <span className="text-[9px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                            {product.categoryLabelBn || 'কৃষি ও ফল'}
                          </span>
                          <h3 className="text-xs font-black text-gray-900 mt-1 line-clamp-1 leading-snug">
                            {product.nameBn}
                          </h3>
                          <div className="flex items-center gap-1 text-[10px] text-gray-500 mt-1">
                            <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                            <span className="truncate">{product.origin || 'রাঙ্গামাটি'}</span>
                          </div>
                        </div>

                        <div className="pt-2.5 mt-2 border-t border-gray-100 flex items-center justify-between gap-1.5">
                          <button
                            type="button"
                            onClick={() => onViewProduct && onViewProduct(product)}
                            className="w-full py-1.5 px-2 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-[11px] flex items-center justify-center gap-1 transition shadow-2xs cursor-pointer"
                          >
                            <span>{isBn ? 'বিস্তারিত দেখুন' : 'View Details'}</span>
                            <ArrowRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ================= RESULTS: 3. SERVICES & PROFESSIONALS ================= */}
            {activeCategory === 'services' && (
              serviceResults.length === 0 ? (
                <EmptyResultsView isBn={isBn} onReset={() => {
                  setServiceItem('all');
                  setServiceKeyword('');
                  setServiceDistrict('all');
                  setServiceUpazila('all');
                  handleSearch();
                }} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {serviceResults.map((pro, idx) => (
                    <div 
                      key={pro.id || idx}
                      className="bg-white rounded-2xl p-3.5 border border-sky-100 shadow-xs hover:shadow-md transition flex flex-col justify-between text-left"
                    >
                      <div className="flex items-start justify-between gap-2.5 mb-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-11 h-11 rounded-xl bg-sky-50 border border-sky-200 flex items-center justify-center shrink-0 overflow-hidden">
                            {pro.avatar ? (
                              <img src={pro.avatar} alt={pro.name} className="w-full h-full object-cover" />
                            ) : (
                              <Wrench className="w-5 h-5 text-sky-600" />
                            )}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-xs sm:text-sm font-black text-gray-900 leading-tight">
                                {pro.name}
                              </h3>
                              <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                            </div>
                            <span className="text-[10px] font-bold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
                              {pro.job || pro.categoryGroup}
                            </span>
                            <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
                              <MapPin className="w-3 h-3 text-gray-400" />
                              <span>{pro.upazila ? `${pro.upazila}, ` : ''}{pro.district || 'বাংলাদেশ'}</span>
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <span className="text-[11px] font-black text-emerald-700 block">
                            ৳ {pro.dailyRate || 'আলোচনা সাপেক্ষে'}
                          </span>
                          <span className="text-[9px] text-gray-400 font-medium">
                            {pro.experience || '৩+ বছর অভিজ্ঞতা'}
                          </span>
                        </div>
                      </div>

                      {pro.bio && (
                        <p className="text-[11px] text-gray-600 line-clamp-2 mb-3 bg-slate-50 p-2 rounded-xl">
                          {pro.bio}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
                        {pro.phone ? (
                          <a
                            href={`tel:${pro.phone.replace(/[^\d+]/g, '')}`}
                            className="w-full py-1.5 px-2 rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-2xs"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{isBn ? 'যোগাযোগ করুন' : 'Contact / Call'}</span>
                          </a>
                        ) : (
                          <button
                            disabled
                            className="w-full py-1.5 px-2 rounded-xl bg-gray-100 text-gray-400 text-xs font-semibold"
                          >
                            {isBn ? 'নম্বর গোপন' : 'Private'}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => {
                            if (onViewWorkerProfile) {
                              onViewWorkerProfile(pro as RegisteredProfessional);
                            }
                          }}
                          className="w-full py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-gray-800 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-gray-500" />
                          <span>{isBn ? 'প্রোফাইল দেখুন' : 'View Profile'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ================= RESULTS: 4. JOB CIRCULARS ================= */}
            {activeCategory === 'circulars' && (
              circularResults.length === 0 ? (
                <EmptyResultsView isBn={isBn} onReset={() => {
                  setJobType('all');
                  setJobLocation('all');
                  handleSearch();
                }} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {circularResults.map((job, idx) => (
                    <div 
                      key={job.id || idx}
                      className="bg-white rounded-2xl p-3.5 border border-amber-100 shadow-xs hover:shadow-md transition flex flex-col justify-between text-left"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <span className="text-[9.5px] font-black uppercase tracking-wide bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md">
                              {job.jobType || 'Full-time'}
                            </span>
                            <h3 className="text-xs sm:text-sm font-black text-gray-900 mt-1 leading-snug">
                              {job.title}
                            </h3>
                            <div className="flex items-center gap-1 text-[11px] font-bold text-gray-600 mt-0.5">
                              <Building2 className="w-3 h-3 text-gray-400" />
                              <span>{job.companyName || 'নিয়োগকারী প্রতিষ্ঠান'}</span>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-black text-emerald-700 block">
                              {job.salary || 'আলোচনা সাপেক্ষে'}
                            </span>
                            <span className="text-[9px] text-gray-400 font-medium">
                              পদ: {job.vacanciesCount || 1} টি
                            </span>
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 text-[10px] text-gray-500 bg-slate-50 p-2 rounded-xl my-2">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-gray-400" />
                            <span>{job.upazila ? `${job.upazila}, ` : ''}{job.district}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-gray-400" />
                            <span>{isBn ? 'শেষ সময়:' : 'Deadline:'} {job.deadline}</span>
                          </div>
                        </div>

                        {job.description && (
                          <p className="text-[11px] text-gray-600 line-clamp-2 mb-3">
                            {job.description}
                          </p>
                        )}
                      </div>

                      <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                        {job.contactPhone ? (
                          <a
                            href={`tel:${job.contactPhone}`}
                            className="w-full py-1.5 px-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-2xs"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{isBn ? 'সরাসরি কল' : 'Call Employer'}</span>
                          </a>
                        ) : null}

                        <button
                          type="button"
                          onClick={() => setSelectedCircularModal(job)}
                          className="w-full py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-gray-800 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-gray-500" />
                          <span>{isBn ? 'সার্কুলার দেখুন' : 'Full Details'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

            {/* ================= RESULTS: 5. JOB SEEKERS ================= */}
            {activeCategory === 'seekers' && (
              seekerResults.length === 0 ? (
                <EmptyResultsView isBn={isBn} onReset={() => {
                  setSeekerRole('all');
                  setSeekerTargetDistrict('all');
                  handleSearch();
                }} />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {seekerResults.map((seeker, idx) => (
                    <div 
                      key={seeker.id || idx}
                      className="bg-white rounded-2xl p-3.5 border border-purple-100 shadow-xs hover:shadow-md transition flex flex-col justify-between text-left"
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2.5 mb-2.5">
                          <div className="flex items-center gap-2.5">
                            <div className="w-11 h-11 rounded-xl bg-purple-50 border border-purple-200 flex items-center justify-center shrink-0">
                              <UserCheck className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h3 className="text-xs sm:text-sm font-black text-gray-900 leading-tight">
                                  {seeker.name}
                                </h3>
                              </div>
                              <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded inline-block mt-0.5">
                                {seeker.desiredJobTitle}
                              </span>
                              <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
                                <MapPin className="w-3 h-3 text-gray-400" />
                                <span>{seeker.upazila ? `${seeker.upazila}, ` : ''}{seeker.district || 'বাংলাদেশ'}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-[11px] font-black text-emerald-700 block">
                              ৳ {seeker.expectedSalary || 'আলোচনা সাপেক্ষে'}
                            </span>
                            <span className="text-[9px] text-gray-400 font-medium">
                              অভিজ্ঞতা: {seeker.experienceYears || '১ বছর'}
                            </span>
                          </div>
                        </div>

                        {/* Education and Skills info */}
                        <div className="bg-slate-50 rounded-xl p-2 mb-3 text-[10.5px] text-gray-600 space-y-1">
                          <div className="flex items-center gap-1 text-gray-700">
                            <GraduationCap className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                            <span className="font-semibold">{seeker.highestEducation || 'সাধারণ শিক্ষা'}</span>
                          </div>
                          {seeker.skills && seeker.skills.length > 0 && (
                            <div className="flex flex-wrap gap-1 pt-1">
                              {seeker.skills.slice(0, 4).map((skill, sIdx) => (
                                <span key={sIdx} className="text-[9px] bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-700">
                                  {skill}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-gray-100">
                        {seeker.phone ? (
                          <a
                            href={`tel:${seeker.phone.replace(/[^\d+]/g, '')}`}
                            className="w-full py-1.5 px-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition shadow-2xs"
                          >
                            <Phone className="w-3 h-3" />
                            <span>{isBn ? 'যোগাযোগ করুন' : 'Contact / Call'}</span>
                          </a>
                        ) : (
                          <button
                            disabled
                            className="w-full py-1.5 px-2 rounded-xl bg-gray-100 text-gray-400 text-xs font-semibold"
                          >
                            {isBn ? 'নম্বর গোপন' : 'Private'}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setSelectedSeekerModal(seeker)}
                          className="w-full py-1.5 px-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-gray-800 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-gray-500" />
                          <span>{isBn ? 'বায়োডাটা দেখুন' : 'View Bio-data'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}

          </div>
        )}
          </>
        )}

      </div>

      {/* ================= MODAL 1: STATIC PDF-STYLE BLOOD DONOR RECORD ================= */}
      {selectedBloodDonorModal && (
        <StaticBloodDonorProfileDocument
          donor={selectedBloodDonorModal}
          lang={lang}
          onClose={() => setSelectedBloodDonorModal(null)}
          onShowToast={onShowToast}
        />
      )}

      {/* ================= MODAL 2: JOB CIRCULAR DETAILS ================= */}
      {selectedCircularModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-gray-100 text-left relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedCircularModal(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-gray-600 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <span className="text-[10px] font-black uppercase tracking-wide bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-0.5 rounded-md inline-block mb-1.5">
              {selectedCircularModal.jobType}
            </span>
            <h2 className="text-sm sm:text-base font-black text-gray-900 leading-snug">
              {selectedCircularModal.title}
            </h2>
            <p className="text-xs font-bold text-gray-600 mt-0.5">
              {selectedCircularModal.companyName}
            </p>

            <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-2xl text-xs text-gray-700 my-3">
              <div>
                <span className="text-gray-400 block text-[10px]">{isBn ? 'বেতন পরিসর:' : 'Salary:'}</span>
                <span className="font-black text-emerald-700">{selectedCircularModal.salary}</span>
              </div>
              <div>
                <span className="text-gray-400 block text-[10px]">{isBn ? 'আবেদনের শেষ তারিখ:' : 'Deadline:'}</span>
                <span className="font-bold text-rose-600">{selectedCircularModal.deadline}</span>
              </div>
              <div className="col-span-2 pt-1 border-t border-gray-200/60 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <span className="font-medium text-[11px]">{selectedCircularModal.upazila ? `${selectedCircularModal.upazila}, ` : ''}{selectedCircularModal.district}</span>
              </div>
            </div>

            {selectedCircularModal.description && (
              <div className="text-xs text-gray-700 space-y-1 mb-3">
                <span className="font-bold text-gray-900 block">{isBn ? 'চাকরির বিবরণ ও শর্তাবলী:' : 'Job Description:'}</span>
                <p className="whitespace-pre-wrap leading-relaxed bg-gray-50 p-3 rounded-xl border border-gray-100 text-[11px]">
                  {selectedCircularModal.description}
                </p>
              </div>
            )}

            {/* Uploaded Circular Document Preview (PDF or Image) */}
            {(selectedCircularModal.circularUrl || (selectedCircularModal as any).circular_url) && (
              <div className="mb-4 p-3 bg-stone-50 border border-stone-200 rounded-2xl">
                <span className="text-[11px] font-bold text-slate-800 block mb-2">
                  {isBn ? 'সংযুক্ত সার্কুলার নথি / বিজ্ঞাপন:' : 'Attached Circular File:'}
                </span>
                {(selectedCircularModal.circularUrl || (selectedCircularModal as any).circular_url).includes('application/pdf') ||
                 (selectedCircularModal.circularUrl || (selectedCircularModal as any).circular_url).toLowerCase().endsWith('.pdf') ? (
                  <a
                    href={selectedCircularModal.circularUrl || (selectedCircularModal as any).circular_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-red-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-red-600 shrink-0" />
                      <div>
                        <span className="block">{isBn ? 'পিডিএফ সার্কুলার ফাইল' : 'PDF Circular Document'}</span>
                        <span className="block text-[10px] text-red-500 font-normal">{isBn ? 'নতুন ট্যাবে দেখতে ক্লিক করুন' : 'Click to view full PDF'}</span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-red-600" />
                  </a>
                ) : (
                  <div className="rounded-xl overflow-hidden border border-stone-200 bg-white shadow-2xs">
                    <img 
                      src={selectedCircularModal.circularUrl || (selectedCircularModal as any).circular_url} 
                      alt="Job Circular" 
                      className="max-h-60 w-full object-contain cursor-pointer hover:opacity-95 transition-opacity"
                      onClick={() => {
                        window.open(selectedCircularModal.circularUrl || (selectedCircularModal as any).circular_url, '_blank');
                      }}
                      title={isBn ? 'বড় করে দেখতে ক্লিক করুন' : 'Click to view full image'}
                    />
                  </div>
                )}
              </div>
            )}

            {selectedCircularModal.contactPhone && (
              <a
                href={`tel:${selectedCircularModal.contactPhone}`}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition"
              >
                <Phone className="w-4 h-4" />
                <span>{isBn ? `নিয়োগকারীর সাথে যোগাযোগ (${selectedCircularModal.contactPhone})` : `Call Employer (${selectedCircularModal.contactPhone})`}</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* ================= MODAL: JOB CIRCULAR POSTING (DUAL-OPTION) ================= */}
      {isJobPostingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-stone-200 text-left relative animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 shrink-0">
                  <Briefcase className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                    {isBn ? 'চাকরির সার্কুলার প্রকাশ করুন' : 'Post Job Circular'}
                  </h2>
                  <p className="text-[10.5px] text-slate-500">
                    {isBn ? 'ফর্ম পূরণ করে অথবা সরাসরি সার্কুলার ফাইল আপলোড করে প্রকাশ করুন' : 'Post by structured form or direct file upload'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsJobPostingModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dual Option Mode Switcher (Option A vs Option B) */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-xl mb-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setCircularPostMode('detailed');
                  setJobPostError('');
                }}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  circularPostMode === 'detailed'
                    ? 'bg-white text-amber-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                <span>{isBn ? 'অপশন এ: বিস্তারিত ফর্ম' : 'Option A: Detailed Form'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setCircularPostMode('upload');
                  setJobPostError('');
                }}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  circularPostMode === 'upload'
                    ? 'bg-white text-amber-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5 text-amber-600" />
                <span>{isBn ? 'অপশন বি: সরাসরি ফাইল আপলোড' : 'Option B: Direct File Upload'}</span>
              </button>
            </div>

            {/* Error Message */}
            {jobPostError && (
              <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 shrink-0">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{jobPostError}</span>
              </div>
            )}

            {/* Hidden File Input for Circular */}
            <input
              type="file"
              ref={circularFileInputRef}
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleCircularFileSelect(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            {/* Form Fields */}
            <form onSubmit={handleJobPostSubmit} className="space-y-3 overflow-y-auto pr-1 flex-1">
              {circularPostMode === 'detailed' ? (
                /* OPTION A: DETAILED FORM */
                <>
                  {/* Title & Company */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isBn ? 'পদের নাম / পদবী *' : 'Job Title / Designation *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={jobPostForm.title}
                        onChange={(e) => setJobPostForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder={isBn ? 'যেমন: সেলস এক্সিকিউটিভ, হিসাবরক্ষক' : 'e.g. Sales Executive, Accountant'}
                        className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-[#15803d] focus:bg-white text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isBn ? 'প্রতিষ্ঠান / কোম্পানির নাম *' : 'Company / Business Name *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={jobPostForm.companyName}
                        onChange={(e) => setJobPostForm(prev => ({ ...prev, companyName: e.target.value }))}
                        placeholder={isBn ? 'যেমন: মেঘনা ট্রেডার্স' : 'e.g. Meghna Traders'}
                        className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-[#15803d] focus:bg-white text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Job Type & Category */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isBn ? 'চাকরির ধরন' : 'Job Type'}
                      </label>
                      <select
                        value={jobPostForm.jobType}
                        onChange={(e) => setJobPostForm(prev => ({ ...prev, jobType: e.target.value as JobType }))}
                        className="w-full text-xs font-medium px-2.5 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-[#15803d] focus:bg-white text-slate-800 cursor-pointer"
                      >
                        {JOB_TYPES.map(t => (
                          <option key={t.id} value={t.id}>{t.nameBn}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isBn ? 'ক্যাটাগরি' : 'Category'}
                      </label>
                      <select
                        value={jobPostForm.category}
                        onChange={(e) => setJobPostForm(prev => ({ ...prev, category: e.target.value }))}
                        className="w-full text-xs font-medium px-2.5 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-[#15803d] focus:bg-white text-slate-800 cursor-pointer"
                      >
                        {JOB_CATEGORIES.map(c => (
                          <option key={c.id} value={c.id}>{c.nameBn}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* District & Upazila */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isBn ? 'জেলা (কাজের স্থান)' : 'District (Location)'}
                      </label>
                      <select
                        value={jobPostForm.district}
                        onChange={(e) => setJobPostForm(prev => ({ ...prev, district: e.target.value, upazila: 'all' }))}
                        className="w-full text-xs font-medium px-2.5 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-[#15803d] focus:bg-white text-slate-800 cursor-pointer"
                      >
                        <option value="all">{isBn ? 'সকল জেলা (সারা বাংলাদেশ)' : 'All Districts'}</option>
                        {allDistricts.map(dist => (
                          <option key={dist} value={dist}>{dist}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isBn ? 'উপজেলা / থানা' : 'Upazila'}
                      </label>
                      <select
                        value={jobPostForm.upazila}
                        onChange={(e) => setJobPostForm(prev => ({ ...prev, upazila: e.target.value }))}
                        disabled={jobPostForm.district === 'all'}
                        className={`w-full text-xs font-medium px-2.5 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-[#15803d] focus:bg-white text-slate-800 ${
                          jobPostForm.district === 'all' ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      >
                        <option value="all">{isBn ? 'সকল উপজেলা' : 'All Upazilas'}</option>
                        {getUpazilasForDistrict(jobPostForm.district).map(up => (
                          <option key={up} value={up}>{up}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Salary & Deadline */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isBn ? 'মাসিক বেতন' : 'Salary'}
                      </label>
                      <input
                        type="text"
                        value={jobPostForm.salary}
                        onChange={(e) => setJobPostForm(prev => ({ ...prev, salary: e.target.value }))}
                        placeholder={isBn ? 'যেমন: ১৫,০০০ - ২০,০০০ টাকা / আলোচনা সাপেক্ষে' : 'e.g. 20,000 - 30,000 BDT'}
                        className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-[#15803d] focus:bg-white text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isBn ? 'আবেদনের শেষ তারিখ' : 'Application Deadline'}
                      </label>
                      <input
                        type="text"
                        value={jobPostForm.deadline}
                        onChange={(e) => setJobPostForm(prev => ({ ...prev, deadline: e.target.value }))}
                        placeholder={isBn ? 'যেমন: ৩০ অক্টোবর ২০২৫ / জরুরি নিয়োগ' : 'e.g. 30 Oct 2025'}
                        className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-[#15803d] focus:bg-white text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Contact Phone & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isBn ? 'যোগাযোগের মোবাইল নম্বর *' : 'Contact Mobile *'}
                      </label>
                      <input
                        type="tel"
                        required
                        value={jobPostForm.contactPhone}
                        onChange={(e) => setJobPostForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                        placeholder="01XXXXXXXXX"
                        className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-[#15803d] focus:bg-white text-slate-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isBn ? 'ইমেইল বা ওয়েবসাইট (ঐচ্ছিক)' : 'Email or Website (Optional)'}
                      </label>
                      <input
                        type="text"
                        value={jobPostForm.contactEmail}
                        onChange={(e) => setJobPostForm(prev => ({ ...prev, contactEmail: e.target.value }))}
                        placeholder="hr@company.com"
                        className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-[#15803d] focus:bg-white text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Optional File Attachment in Option A */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isBn ? 'সার্কুলার ফাইল বা ছবি থাকলে যুক্ত করুন (ঐচ্ছিক)' : 'Attach Circular Document / Image (Optional)'}
                    </label>
                    {!jobPostForm.circularFilePreview ? (
                      <div
                        onClick={() => circularFileInputRef.current?.click()}
                        className="border border-dashed border-stone-300 hover:border-amber-500 rounded-xl p-3 text-center cursor-pointer transition-colors bg-stone-50/70 hover:bg-amber-50/30 flex items-center justify-center gap-2"
                      >
                        <UploadCloud className="w-5 h-5 text-amber-600" />
                        <span className="text-xs font-semibold text-slate-700">
                          {isBn ? 'ফাইল সিলেক্ট করুন (PDF, JPG, PNG)' : 'Select file (PDF, JPG, PNG)'}
                        </span>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-amber-50/60 border border-amber-200 rounded-xl flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="w-5 h-5 text-amber-700 shrink-0" />
                          <span className="text-xs font-bold text-slate-800 truncate">{jobPostForm.circularFileName}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setJobPostForm(prev => ({ ...prev, circularFile: null, circularFilePreview: '', circularFileName: '', circularFileType: '', circularFileSize: 0 }));
                            if (circularFileInputRef.current) circularFileInputRef.current.value = '';
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Description & Requirements */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isBn ? 'কাজের বিবরণ ও যোগ্যতা (ঐচ্ছিক)' : 'Job Description & Requirements (Optional)'}
                    </label>
                    <textarea
                      rows={2}
                      value={jobPostForm.description}
                      onChange={(e) => setJobPostForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder={isBn ? 'প্রয়োজনীয় অভিজ্ঞতা, শিক্ষাগত যোগ্যতা ও অন্যান্য শর্তাবলী লিখুন...' : 'Enter job requirements, qualifications, or notes...'}
                      className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-[#15803d] focus:bg-white text-slate-800"
                    />
                  </div>
                </>
              ) : (
                /* OPTION B: DIRECT FILE UPLOAD */
                <>
                  {/* Company Name */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isBn ? 'কোম্পানি / প্রতিষ্ঠানের নাম *' : 'Company / Business Name *'}
                    </label>
                    <input
                      type="text"
                      required
                      value={jobPostForm.companyName}
                      onChange={(e) => setJobPostForm(prev => ({ ...prev, companyName: e.target.value }))}
                      placeholder={isBn ? 'যেমন: প্রাইম এন্টারপ্রাইজ' : 'e.g. Prime Enterprise'}
                      className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-[#15803d] focus:bg-white text-slate-800"
                    />
                  </div>

                  {/* District & Upazila Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isBn ? 'জেলা নির্বাচন করুন *' : 'Select District *'}
                      </label>
                      <select
                        value={jobPostForm.district}
                        onChange={(e) => setJobPostForm(prev => ({ ...prev, district: e.target.value, upazila: 'all' }))}
                        className="w-full text-xs font-medium px-2.5 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-[#15803d] focus:bg-white text-slate-800 cursor-pointer"
                      >
                        <option value="all">{isBn ? 'সকল জেলা (সারা বাংলাদেশ)' : 'All Districts'}</option>
                        {allDistricts.map(dist => (
                          <option key={dist} value={dist}>{dist}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isBn ? 'উপজেলা / থানা' : 'Upazila'}
                      </label>
                      <select
                        value={jobPostForm.upazila}
                        onChange={(e) => setJobPostForm(prev => ({ ...prev, upazila: e.target.value }))}
                        disabled={jobPostForm.district === 'all'}
                        className={`w-full text-xs font-medium px-2.5 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-[#15803d] focus:bg-white text-slate-800 ${
                          jobPostForm.district === 'all' ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      >
                        <option value="all">{isBn ? 'সকল উপজেলা' : 'All Upazilas'}</option>
                        {getUpazilasForDistrict(jobPostForm.district).map(up => (
                          <option key={up} value={up}>{up}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Contact Phone & Job Title */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isBn ? 'যোগাযোগের মোবাইল নম্বর *' : 'Contact Mobile *'}
                      </label>
                      <input
                        type="tel"
                        required
                        value={jobPostForm.contactPhone}
                        onChange={(e) => setJobPostForm(prev => ({ ...prev, contactPhone: e.target.value }))}
                        placeholder="01XXXXXXXXX"
                        className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-[#15803d] focus:bg-white text-slate-800 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isBn ? 'বিজ্ঞপ্তির শিরোনাম / পদবী' : 'Job Title / Notice Title'}
                      </label>
                      <input
                        type="text"
                        value={jobPostForm.title}
                        onChange={(e) => setJobPostForm(prev => ({ ...prev, title: e.target.value }))}
                        placeholder={isBn ? 'যেমন: জরুরি নিয়োগ বিজ্ঞপ্তি' : 'e.g. Urgent Hiring Notice'}
                        className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-[#15803d] focus:bg-white text-slate-800"
                      />
                    </div>
                  </div>

                  {/* DIRECT CIRCULAR FILE UPLOAD (JPG, PNG, PDF) */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isBn ? 'সার্কুলার ফাইল আপলোড করুন (JPG, PNG, PDF) *' : 'Upload Circular File (JPG, PNG, PDF) *'}
                    </label>

                    {!jobPostForm.circularFilePreview ? (
                      <div
                        onClick={() => circularFileInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            handleCircularFileSelect(e.dataTransfer.files[0]);
                          }
                        }}
                        className="border-2 border-dashed border-amber-300 hover:border-amber-600 rounded-2xl p-5 text-center cursor-pointer transition-colors bg-amber-50/40 hover:bg-amber-50/80"
                      >
                        <UploadCloud className="w-8 h-8 text-amber-600 mx-auto mb-1.5" />
                        <p className="text-xs font-bold text-slate-800">
                          {isBn ? 'সার্কুলার ফাইল আপলোড করতে ক্লিক করুন বা ড্র্যাগ করুন' : 'Click or drag file to upload circular'}
                        </p>
                        <p className="text-[10.5px] text-slate-500 mt-1">
                          {isBn ? 'ফরম্যাট: JPG, PNG, PDF (সরাসরি সুপাবেজ ক্লাউড স্টোরেজে সংরক্ষিত হবে)' : 'Formats: JPG, PNG, PDF (Persisted to Supabase Storage)'}
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          {jobPostForm.circularFileType === 'application/pdf' || jobPostForm.circularFileName.toLowerCase().endsWith('.pdf') ? (
                            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                          ) : (
                            <img
                              src={jobPostForm.circularFilePreview}
                              alt="Preview"
                              className="w-10 h-10 rounded-lg object-cover border border-stone-200 shrink-0"
                            />
                          )}
                          <div className="truncate">
                            <span className="text-xs font-bold text-slate-800 block truncate">
                              {jobPostForm.circularFileName}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {(jobPostForm.circularFileSize / (1024 * 1024)).toFixed(2)} MB • {jobPostForm.circularFileType.split('/')[1]?.toUpperCase() || 'DOCUMENT'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => circularFileInputRef.current?.click()}
                            className="text-[11px] font-bold text-amber-700 hover:underline px-2 py-1 cursor-pointer"
                          >
                            {isBn ? 'পরিবর্তন' : 'Change'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setJobPostForm(prev => ({
                                ...prev,
                                circularFile: null,
                                circularFilePreview: '',
                                circularFileName: '',
                                circularFileType: '',
                                circularFileSize: 0,
                              }));
                              if (circularFileInputRef.current) {
                                circularFileInputRef.current.value = '';
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                            title={isBn ? 'ফাইল মুছুন' : 'Remove file'}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Optional Short Instructions */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isBn ? 'সংক্ষিপ্ত নোট বা বিশেষ নির্দেশনা (ঐচ্ছিক)' : 'Short Note or Instructions (Optional)'}
                    </label>
                    <textarea
                      rows={2}
                      value={jobPostForm.description}
                      onChange={(e) => setJobPostForm(prev => ({ ...prev, description: e.target.value }))}
                      placeholder={isBn ? 'যেমন: বিজ্ঞপ্তিতে উল্লেখিত নম্বরে যোগাযোগ করার অনুরোধ রইল...' : 'Any special notes for job candidates...'}
                      className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-[#15803d] focus:bg-white text-slate-800"
                    />
                  </div>
                </>
              )}

              {/* Form Action Buttons */}
              <div className="pt-2 border-t border-stone-200 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsJobPostingModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingJob}
                  className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingJob ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{isBn ? 'আপলোড ও প্রকাশ হচ্ছে...' : 'Uploading & Posting...'}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{circularPostMode === 'upload' ? (isBn ? 'সার্কুলার ফাইল প্রকাশ করুন' : 'Publish Circular File') : (isBn ? 'সার্কুলার প্রকাশ করুন' : 'Publish Circular')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ================= MODAL: JOB SEEKER BIO-DATA SUBMISSION (DUAL-OPTION) ================= */}
      {isJobSeekerModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-stone-200 text-left relative animate-in fade-in zoom-in-95 duration-150 my-auto max-h-[92vh] flex flex-col">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-stone-200 pb-3 mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 flex items-center justify-center text-purple-700 shrink-0">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                    {isBn ? 'চাকরিপ্রার্থীর বায়োডাটা / সিভি জমা দিন' : 'Submit Bio-data / CV'}
                  </h2>
                  <p className="text-[10.5px] text-slate-500">
                    {isBn ? 'ফর্ম পূরণ করে অথবা সরাসরি সিভি ফাইল (PDF/Image) আপলোড করুন' : 'Submit by bio-data form or direct CV file upload'}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsJobSeekerModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Dual Option Mode Switcher (Option A vs Option B) */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-stone-100 rounded-xl mb-3 shrink-0">
              <button
                type="button"
                onClick={() => {
                  setSeekerSubmitMode('detailed');
                  setJobSeekerError('');
                }}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  seekerSubmitMode === 'detailed'
                    ? 'bg-white text-purple-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5 text-purple-600" />
                <span>{isBn ? 'অপশন এ: বিস্তারিত বায়োডাটা' : 'Option A: Detailed Bio-data'}</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSeekerSubmitMode('upload');
                  setJobSeekerError('');
                }}
                className={`py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  seekerSubmitMode === 'upload'
                    ? 'bg-white text-purple-800 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UploadCloud className="w-3.5 h-3.5 text-purple-600" />
                <span>{isBn ? 'অপশন বি: সরাসরি সিভি আপলোড' : 'Option B: Direct File Upload'}</span>
              </button>
            </div>

            {/* Error Message */}
            {jobSeekerError && (
              <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2 shrink-0">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{jobSeekerError}</span>
              </div>
            )}

            {/* Hidden File Input for Resume */}
            <input
              type="file"
              ref={seekerFileInputRef}
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleSeekerFileSelect(e.target.files[0]);
                }
              }}
              className="hidden"
            />

            {/* Form Fields */}
            <form onSubmit={handleJobSeekerSubmit} className="space-y-3 overflow-y-auto pr-1 flex-1">
              {seekerSubmitMode === 'detailed' ? (
                /* OPTION A: DETAILED BIO-DATA FORM */
                <>
                  {/* Name & Mobile */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isBn ? 'প্রার্থীর পূর্ণ নাম *' : 'Candidate Full Name *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={jobSeekerForm.name}
                        onChange={(e) => setJobSeekerForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder={isBn ? 'যেমন: মোহাম্মদ আরিফ হোসেন' : 'e.g. Md. Arif Hossain'}
                        className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-purple-600 focus:bg-white text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isBn ? 'যোগাযোগের মোবাইল নম্বর *' : 'Contact Mobile *'}
                      </label>
                      <input
                        type="tel"
                        required
                        value={jobSeekerForm.phone}
                        onChange={(e) => setJobSeekerForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="01XXXXXXXXX"
                        className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-purple-600 focus:bg-white text-slate-800 font-mono"
                      />
                    </div>
                  </div>

                  {/* Desired Job Title & Gender */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isBn ? 'প্রত্যাশিত পদ / কাজের ধরন *' : 'Desired Role / Job Title *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={jobSeekerForm.desiredJobTitle}
                        onChange={(e) => setJobSeekerForm(prev => ({ ...prev, desiredJobTitle: e.target.value }))}
                        placeholder={isBn ? 'যেমন: বিক্রয় প্রতিনিধি, ড্রাইভার, কম্পিউটার অপারেটর' : 'e.g. Sales, Driver, Computer Operator'}
                        className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-purple-600 focus:bg-white text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isBn ? 'লিঙ্গ' : 'Gender'}
                      </label>
                      <select
                        value={jobSeekerForm.gender}
                        onChange={(e) => setJobSeekerForm(prev => ({ ...prev, gender: e.target.value as any }))}
                        className="w-full text-xs font-medium px-2.5 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-purple-600 focus:bg-white text-slate-800 cursor-pointer"
                      >
                        <option value="Male">{isBn ? 'পুরুষ (Male)' : 'Male'}</option>
                        <option value="Female">{isBn ? 'মহিলা (Female)' : 'Female'}</option>
                        <option value="Other">{isBn ? 'অন্যান্য (Other)' : 'Other'}</option>
                      </select>
                    </div>
                  </div>

                  {/* Present & Permanent Address */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isBn ? 'বর্তমান ঠিকানা *' : 'Present Address *'}
                      </label>
                      <input
                        type="text"
                        value={jobSeekerForm.presentAddress}
                        onChange={(e) => setJobSeekerForm(prev => ({ ...prev, presentAddress: e.target.value }))}
                        placeholder={isBn ? 'গ্রাম/রোড, এলাকা' : 'Street/Village, Area'}
                        className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-purple-600 focus:bg-white text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isBn ? 'স্থায়ী ঠিকানা (ঐচ্ছিক)' : 'Permanent Address (Optional)'}
                      </label>
                      <input
                        type="text"
                        value={jobSeekerForm.permanentAddress}
                        onChange={(e) => setJobSeekerForm(prev => ({ ...prev, permanentAddress: e.target.value }))}
                        placeholder={isBn ? 'নিজ এলাকা' : 'Home district/village'}
                        className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-purple-600 focus:bg-white text-slate-800"
                      />
                    </div>
                  </div>

                  {/* District & Upazila */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isBn ? 'জেলা *' : 'District *'}
                      </label>
                      <select
                        value={jobSeekerForm.district}
                        onChange={(e) => setJobSeekerForm(prev => ({ ...prev, district: e.target.value, upazila: 'all' }))}
                        className="w-full text-xs font-medium px-2.5 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-purple-600 focus:bg-white text-slate-800 cursor-pointer"
                      >
                        <option value="all">{isBn ? 'সকল জেলা' : 'All Districts'}</option>
                        {allDistricts.map(dist => (
                          <option key={dist} value={dist}>{dist}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isBn ? 'উপজেলা / থানা' : 'Upazila'}
                      </label>
                      <select
                        value={jobSeekerForm.upazila}
                        onChange={(e) => setJobSeekerForm(prev => ({ ...prev, upazila: e.target.value }))}
                        disabled={jobSeekerForm.district === 'all'}
                        className={`w-full text-xs font-medium px-2.5 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-purple-600 focus:bg-white text-slate-800 ${
                          jobSeekerForm.district === 'all' ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      >
                        <option value="all">{isBn ? 'সকল উপজেলা' : 'All Upazilas'}</option>
                        {getUpazilasForDistrict(jobSeekerForm.district).map(up => (
                          <option key={up} value={up}>{up}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Highest Education & Experience */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isBn ? 'সর্বোচ্চ শিক্ষাগত যোগ্যতা *' : 'Highest Education *'}
                      </label>
                      <input
                        type="text"
                        value={jobSeekerForm.highestEducation}
                        onChange={(e) => setJobSeekerForm(prev => ({ ...prev, highestEducation: e.target.value }))}
                        placeholder={isBn ? 'যেমন: এইচএসসি, স্নাতক (ডিগ্রি), এসএসসি' : 'e.g. HSC, Graduate, SSC'}
                        className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-purple-600 focus:bg-white text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isBn ? 'কাজের অভিজ্ঞতা *' : 'Experience Years *'}
                      </label>
                      <input
                        type="text"
                        value={jobSeekerForm.experienceYears}
                        onChange={(e) => setJobSeekerForm(prev => ({ ...prev, experienceYears: e.target.value }))}
                        placeholder={isBn ? 'যেমন: ২ বছর / ফ্রেশার' : 'e.g. 2 Years / Fresher'}
                        className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-purple-600 focus:bg-white text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Skills & Expected Salary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isBn ? 'বিশেষ দক্ষতাসমূহ (কমা দিয়ে লিখুন)' : 'Key Skills (comma separated)'}
                      </label>
                      <input
                        type="text"
                        value={jobSeekerForm.skills}
                        onChange={(e) => setJobSeekerForm(prev => ({ ...prev, skills: e.target.value }))}
                        placeholder={isBn ? 'যেমন: ড্রাইভিং, এমএস এক্সেল, কাস্টমার কেয়ার' : 'e.g. MS Excel, Sales, Driving'}
                        className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-purple-600 focus:bg-white text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isBn ? 'প্রত্যাশিত মাসিক বেতন' : 'Expected Salary'}
                      </label>
                      <input
                        type="text"
                        value={jobSeekerForm.expectedSalary}
                        onChange={(e) => setJobSeekerForm(prev => ({ ...prev, expectedSalary: e.target.value }))}
                        placeholder={isBn ? 'যেমন: ১৫,০০০ টাকা / আলোচনা সাপেক্ষে' : 'e.g. 15,000 BDT'}
                        className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-purple-600 focus:bg-white text-slate-800"
                      />
                    </div>
                  </div>

                  {/* Optional Resume Attachment in Option A */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isBn ? 'সিভি বা জীবনবৃত্তান্ত ফাইল থাকলে যুক্ত করুন (ঐচ্ছিক)' : 'Attach Resume/CV File (Optional)'}
                    </label>
                    {!jobSeekerForm.resumeFilePreview ? (
                      <div
                        onClick={() => seekerFileInputRef.current?.click()}
                        className="border border-dashed border-purple-300 hover:border-purple-600 rounded-xl p-3 text-center cursor-pointer transition-colors bg-purple-50/40 hover:bg-purple-50/80 flex items-center justify-center gap-2"
                      >
                        <UploadCloud className="w-5 h-5 text-purple-600" />
                        <span className="text-xs font-semibold text-slate-700">
                          {isBn ? 'সিভি ফাইল সিলেক্ট করুন (PDF, JPG, PNG)' : 'Select CV file (PDF, JPG, PNG)'}
                        </span>
                      </div>
                    ) : (
                      <div className="p-2.5 bg-purple-50/70 border border-purple-200 rounded-xl flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="w-5 h-5 text-purple-700 shrink-0" />
                          <span className="text-xs font-bold text-slate-800 truncate">{jobSeekerForm.resumeFileName}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setJobSeekerForm(prev => ({ ...prev, resumeFile: null, resumeFilePreview: '', resumeFileName: '', resumeFileType: '', resumeFileSize: 0 }));
                            if (seekerFileInputRef.current) seekerFileInputRef.current.value = '';
                          }}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Bio / Summary */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isBn ? 'সংক্ষিপ্ত পরিচিতি বা নোট (ঐচ্ছিক)' : 'Bio / Short Summary (Optional)'}
                    </label>
                    <textarea
                      rows={2}
                      value={jobSeekerForm.bio}
                      onChange={(e) => setJobSeekerForm(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder={isBn ? 'আপনার আগ্রহ ও কাজের বৈশিষ্ট্য সম্পর্কে সংক্ষেপে লিখুন...' : 'Brief description of your skills and career interests...'}
                      className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-purple-600 focus:bg-white text-slate-800"
                    />
                  </div>
                </>
              ) : (
                /* OPTION B: DIRECT FILE UPLOAD (RESUME / CV) */
                <>
                  {/* Candidate Name & Contact */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isBn ? 'প্রার্থীর পূর্ণ নাম *' : 'Candidate Full Name *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={jobSeekerForm.name}
                        onChange={(e) => setJobSeekerForm(prev => ({ ...prev, name: e.target.value }))}
                        placeholder={isBn ? 'যেমন: শফিক আহমেদ' : 'e.g. Shafiq Ahmed'}
                        className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-purple-600 focus:bg-white text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isBn ? 'যোগাযোগের মোবাইল নম্বর *' : 'Contact Mobile *'}
                      </label>
                      <input
                        type="tel"
                        required
                        value={jobSeekerForm.phone}
                        onChange={(e) => setJobSeekerForm(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="01XXXXXXXXX"
                        className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-purple-600 focus:bg-white text-slate-800 font-mono"
                      />
                    </div>
                  </div>

                  {/* District & Upazila */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isBn ? 'জেলা নির্বাচন করুন *' : 'Select District *'}
                      </label>
                      <select
                        value={jobSeekerForm.district}
                        onChange={(e) => setJobSeekerForm(prev => ({ ...prev, district: e.target.value, upazila: 'all' }))}
                        className="w-full text-xs font-medium px-2.5 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-purple-600 focus:bg-white text-slate-800 cursor-pointer"
                      >
                        <option value="all">{isBn ? 'সকল জেলা (সারা বাংলাদেশ)' : 'All Districts'}</option>
                        {allDistricts.map(dist => (
                          <option key={dist} value={dist}>{dist}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isBn ? 'উপজেলা / থানা' : 'Upazila'}
                      </label>
                      <select
                        value={jobSeekerForm.upazila}
                        onChange={(e) => setJobSeekerForm(prev => ({ ...prev, upazila: e.target.value }))}
                        disabled={jobSeekerForm.district === 'all'}
                        className={`w-full text-xs font-medium px-2.5 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-purple-600 focus:bg-white text-slate-800 ${
                          jobSeekerForm.district === 'all' ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'
                        }`}
                      >
                        <option value="all">{isBn ? 'সকল উপজেলা' : 'All Upazilas'}</option>
                        {getUpazilasForDistrict(jobSeekerForm.district).map(up => (
                          <option key={up} value={up}>{up}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Desired Role & Expected Salary */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isBn ? 'কাঙ্ক্ষিত পদ / কাজের ধরন *' : 'Desired Role / Field *'}
                      </label>
                      <input
                        type="text"
                        required
                        value={jobSeekerForm.desiredJobTitle}
                        onChange={(e) => setJobSeekerForm(prev => ({ ...prev, desiredJobTitle: e.target.value }))}
                        placeholder={isBn ? 'যেমন: সেলস, অফিস সহকারী, ড্রাইভিং' : 'e.g. Sales, Driver, Office Assistant'}
                        className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-purple-600 focus:bg-white text-slate-800"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">
                        {isBn ? 'প্রত্যাশিত মাসিক বেতন (ঐচ্ছিক)' : 'Expected Salary (Optional)'}
                      </label>
                      <input
                        type="text"
                        value={jobSeekerForm.expectedSalary}
                        onChange={(e) => setJobSeekerForm(prev => ({ ...prev, expectedSalary: e.target.value }))}
                        placeholder={isBn ? 'যেমন: ১৫,০০০ টাকা' : 'e.g. 15,000 BDT'}
                        className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-purple-600 focus:bg-white text-slate-800"
                      />
                    </div>
                  </div>

                  {/* DIRECT RESUME / CV FILE UPLOAD (JPG, PNG, PDF) */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isBn ? 'সিভি / জীবনবৃত্তান্ত ফাইল আপলোড করুন (JPG, PNG, PDF) *' : 'Upload CV / Resume File (JPG, PNG, PDF) *'}
                    </label>

                    {!jobSeekerForm.resumeFilePreview ? (
                      <div
                        onClick={() => seekerFileInputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                          e.preventDefault();
                          if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                            handleSeekerFileSelect(e.dataTransfer.files[0]);
                          }
                        }}
                        className="border-2 border-dashed border-purple-300 hover:border-purple-600 rounded-2xl p-5 text-center cursor-pointer transition-colors bg-purple-50/40 hover:bg-purple-50/80"
                      >
                        <UploadCloud className="w-8 h-8 text-purple-600 mx-auto mb-1.5" />
                        <p className="text-xs font-bold text-slate-800">
                          {isBn ? 'সিভি ফাইল আপলোড করতে ক্লিক করুন বা ড্র্যাগ করুন' : 'Click or drag file to upload CV'}
                        </p>
                        <p className="text-[10.5px] text-slate-500 mt-1">
                          {isBn ? 'ফরম্যাট: JPG, PNG, PDF (সরাসরি সুপাবেজ ক্লাউড স্টোরেজে সংরক্ষিত হবে)' : 'Formats: JPG, PNG, PDF (Persisted to Supabase Storage)'}
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-stone-50 border border-stone-200 rounded-xl flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          {jobSeekerForm.resumeFileType === 'application/pdf' || jobSeekerForm.resumeFileName.toLowerCase().endsWith('.pdf') ? (
                            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center text-red-600 shrink-0">
                              <FileText className="w-5 h-5" />
                            </div>
                          ) : (
                            <img
                              src={jobSeekerForm.resumeFilePreview}
                              alt="Resume Preview"
                              className="w-10 h-10 rounded-lg object-cover border border-stone-200 shrink-0"
                            />
                          )}
                          <div className="truncate">
                            <span className="text-xs font-bold text-slate-800 block truncate">
                              {jobSeekerForm.resumeFileName}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              {(jobSeekerForm.resumeFileSize / (1024 * 1024)).toFixed(2)} MB • {jobSeekerForm.resumeFileType.split('/')[1]?.toUpperCase() || 'DOCUMENT'}
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => seekerFileInputRef.current?.click()}
                            className="text-[11px] font-bold text-purple-700 hover:underline px-2 py-1 cursor-pointer"
                          >
                            {isBn ? 'পরিবর্তন' : 'Change'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setJobSeekerForm(prev => ({
                                ...prev,
                                resumeFile: null,
                                resumeFilePreview: '',
                                resumeFileName: '',
                                resumeFileType: '',
                                resumeFileSize: 0,
                              }));
                              if (seekerFileInputRef.current) {
                                seekerFileInputRef.current.value = '';
                              }
                            }}
                            className="p-1 text-slate-400 hover:text-rose-600 rounded-md cursor-pointer"
                            title={isBn ? 'ফাইল মুছুন' : 'Remove file'}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Optional Short Note */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      {isBn ? 'সংক্ষিপ্ত নোট বা বিশেষ অনুরোধ (ঐচ্ছিক)' : 'Short Note or Request (Optional)'}
                    </label>
                    <textarea
                      rows={2}
                      value={jobSeekerForm.bio}
                      onChange={(e) => setJobSeekerForm(prev => ({ ...prev, bio: e.target.value }))}
                      placeholder={isBn ? 'যেমন: জরুরি ভিত্তিতে ফুল-টাইম কাজের সুযোগ খুঁজছি...' : 'Brief note for employers...'}
                      className="w-full text-xs px-3 py-2 bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-1.5 focus:ring-purple-600 focus:bg-white text-slate-800"
                    />
                  </div>
                </>
              )}

              {/* Form Action Buttons */}
              <div className="pt-2 border-t border-stone-200 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsJobSeekerModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition cursor-pointer"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingSeeker}
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-sm transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {isSubmittingSeeker ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>{isBn ? 'আপলোড ও সংরক্ষণ হচ্ছে...' : 'Uploading & Saving...'}</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>{seekerSubmitMode === 'upload' ? (isBn ? 'সিভি ফাইল জমা দিন' : 'Submit CV File') : (isBn ? 'বায়োডাটা জমা দিন' : 'Submit Bio-data')}</span>
                    </>
                  )}
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ================= MODAL 3: JOB SEEKER BIO-DATA DETAILS ================= */}
      {selectedSeekerModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white rounded-3xl max-w-md w-full p-5 shadow-2xl border border-gray-100 text-left relative animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setSelectedSeekerModal(null)}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-gray-600 flex items-center justify-center transition cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-center shrink-0">
                <UserCheck className="w-6 h-6 text-purple-600" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-black text-gray-900">
                  {selectedSeekerModal.name}
                </h2>
                <span className="text-[10px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                  {selectedSeekerModal.desiredJobTitle}
                </span>
              </div>
            </div>

            <div className="space-y-2 bg-slate-50 p-3 rounded-2xl text-xs text-gray-700 mb-3">
              <div className="flex justify-between border-b border-gray-200/60 pb-1.5">
                <span className="text-gray-500">{isBn ? 'শিক্ষাগত যোগ্যতা:' : 'Education:'}</span>
                <span className="font-bold">{selectedSeekerModal.highestEducation || 'সাধারণ শিক্ষা'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200/60 pb-1.5">
                <span className="text-gray-500">{isBn ? 'কাজের অভিজ্ঞতা:' : 'Experience:'}</span>
                <span className="font-semibold">{selectedSeekerModal.experienceYears || '১ বছর'}</span>
              </div>
              <div className="flex justify-between border-b border-gray-200/60 pb-1.5">
                <span className="text-gray-500">{isBn ? 'প্রত্যাশিত বেতন:' : 'Expected Salary:'}</span>
                <span className="font-black text-emerald-700">৳ {selectedSeekerModal.expectedSalary}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">{isBn ? 'অবস্থান:' : 'Location:'}</span>
                <span className="font-bold">{selectedSeekerModal.upazila}, {selectedSeekerModal.district}</span>
              </div>
            </div>

            {selectedSeekerModal.skills && selectedSeekerModal.skills.length > 0 && (
              <div className="mb-3">
                <span className="text-[11px] font-bold text-gray-900 block mb-1">{isBn ? 'দক্ষতাসমূহ:' : 'Skills:'}</span>
                <div className="flex flex-wrap gap-1.5">
                  {selectedSeekerModal.skills.map((skill, sIdx) => (
                    <span key={sIdx} className="text-[10px] bg-purple-50 text-purple-700 border border-purple-200 px-2 py-0.5 rounded-lg font-medium">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {selectedSeekerModal.bio && (
              <div className="mb-4">
                <span className="text-[11px] font-bold text-gray-900 block mb-1">{isBn ? 'প্রার্থীর বায়ো / পরিচিতি:' : 'Bio:'}</span>
                <p className="text-[11px] text-gray-600 bg-slate-50 p-2.5 rounded-xl border border-gray-100 leading-relaxed">
                  {selectedSeekerModal.bio}
                </p>
              </div>
            )}

            {/* Attached CV / Bio-data Document Preview (PDF or Image) */}
            {(selectedSeekerModal.resumeUrl || (selectedSeekerModal as any).resume_url) && (
              <div className="mb-4 p-3 bg-purple-50/70 border border-purple-200 rounded-2xl">
                <span className="text-[11px] font-bold text-purple-900 block mb-2">
                  {isBn ? 'সংযুক্ত সিভি / বায়োডাটা ফাইল:' : 'Attached CV / Resume:'}
                </span>
                {(selectedSeekerModal.resumeUrl || (selectedSeekerModal as any).resume_url).includes('application/pdf') ||
                 (selectedSeekerModal.resumeUrl || (selectedSeekerModal as any).resume_url).toLowerCase().endsWith('.pdf') ? (
                  <a
                    href={selectedSeekerModal.resumeUrl || (selectedSeekerModal as any).resume_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-between p-2.5 bg-white hover:bg-purple-100/60 border border-purple-200 rounded-xl text-purple-900 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-purple-600 shrink-0" />
                      <div>
                        <span className="block truncate max-w-[200px]">{selectedSeekerModal.resumeFileName || (isBn ? 'পিডিএফ সিভি ফাইল' : 'PDF Resume Document')}</span>
                        <span className="block text-[10px] text-purple-600 font-normal">{isBn ? 'নতুন ট্যাবে সম্পূর্ণ সিভি দেখতে ক্লিক করুন' : 'Click to view full PDF'}</span>
                      </div>
                    </div>
                    <ExternalLink className="w-4 h-4 text-purple-600 shrink-0" />
                  </a>
                ) : (
                  <div className="rounded-xl overflow-hidden border border-purple-200 bg-white shadow-2xs group relative">
                    <img 
                      src={selectedSeekerModal.resumeUrl || (selectedSeekerModal as any).resume_url} 
                      alt="Candidate Resume" 
                      className="max-h-56 w-full object-contain cursor-pointer hover:opacity-95 transition-opacity"
                      onClick={() => {
                        window.open(selectedSeekerModal.resumeUrl || (selectedSeekerModal as any).resume_url, '_blank');
                      }}
                      title={isBn ? 'বড় করে দেখতে ক্লিক করুন' : 'Click to view full size'}
                    />
                    <div 
                      onClick={() => {
                        window.open(selectedSeekerModal.resumeUrl || (selectedSeekerModal as any).resume_url, '_blank');
                      }}
                      className="p-1.5 bg-stone-900/70 text-white text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer hover:bg-stone-900 transition"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>{isBn ? 'নতুন উইন্ডোতে বড় আকারে দেখুন' : 'Open in new tab'}</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {selectedSeekerModal.phone && (
              <a
                href={`tel:${selectedSeekerModal.phone.replace(/[^\d+]/g, '')}`}
                className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs flex items-center justify-center gap-2 shadow-sm transition cursor-pointer"
              >
                <Phone className="w-4 h-4" />
                <span>{isBn ? 'যোগাযোগ করুন' : 'Contact / Call Candidate'}</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* ব্লাড সার্চ অথেন্টিকেশন গার্ড মডাল (Sign In & Quick Register) */}
      <BloodAuthGatekeeperModal
        isOpen={isBloodAuthModalOpen}
        onClose={() => setIsBloodAuthModalOpen(false)}
        onSuccess={(user) => {
          login(user);
          setIsBloodAuthModalOpen(false);
          if (onShowToast) {
            onShowToast(isBn ? 'লগইন সফল হয়েছে! রক্তদাতাদের তালিকা প্রদর্শিত হচ্ছে।' : 'Login successful! Showing donors.');
          }
        }}
        onNavigateToRegistration={() => {
          setIsBloodAuthModalOpen(false);
          if (onNavigateToRegistration) {
            onNavigateToRegistration();
          } else if (onNavigateToBloodDonorRegistration) {
            onNavigateToBloodDonorRegistration();
          }
        }}
        initialMode={bloodAuthInitialMode}
        lang={lang}
      />

      {/* ================= MODAL: BLOOD DONOR REGISTRATION MANDATORY POPUP ================= */}
      {showBloodRegistrationAlert && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
          role="dialog"
          aria-modal="true"
          aria-labelledby="blood-reg-alert-title"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 sm:p-6 shadow-2xl border border-rose-200 text-center space-y-4 relative animate-in fade-in zoom-in-95 duration-150">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => setShowBloodRegistrationAlert(false)}
              className="absolute top-3.5 right-3.5 p-1.5 rounded-full text-gray-400 hover:text-gray-700 hover:bg-stone-100 transition cursor-pointer"
              title={isBn ? 'বন্ধ করুন' : 'Close'}
            >
              <X className="w-5 h-5" />
            </button>

            {/* Graphic Icon */}
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-50 border-2 border-rose-200 flex items-center justify-center text-rose-600 shadow-xs">
              <Droplet className="w-7 h-7 fill-rose-500/20 stroke-[2.2]" />
            </div>

            {/* Title & Message */}
            <div className="space-y-2">
              <h3 id="blood-reg-alert-title" className="text-base sm:text-lg font-black text-gray-900">
                {isBn ? 'রক্তদাতা নিবন্ধন আবশ্যক' : 'Blood Donor Registration Required'}
              </h3>
              <p className="text-xs sm:text-sm font-semibold text-gray-700 leading-relaxed">
                রক্ত খুঁজতে হলে আপনাকেও রক্তদাতা হিসেবে নিবন্ধিত থাকতে হবে। অনুগ্রহ করে আগে রেজিস্ট্রেশন করুন।
              </p>
            </div>

            {/* Display typed phone */}
            {bloodSearchPhone && (
              <div className="bg-rose-50/70 border border-rose-200 rounded-xl py-2 px-3 text-xs text-rose-950 font-medium flex items-center justify-center gap-1.5">
                <Phone className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                <span>মোবাইল নম্বর: <strong className="font-bold">{bloodSearchPhone}</strong></span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                id="btn-alert-go-to-blood-registration"
                onClick={() => {
                  setShowBloodRegistrationAlert(false);
                  const phoneVal = (bloodSearchPhone || '').trim();
                  if (onNavigateToBloodDonorRegistration) {
                    onNavigateToBloodDonorRegistration(phoneVal);
                  } else if (onNavigateToRegistration) {
                    onNavigateToRegistration('blood_donor', phoneVal);
                  }
                }}
                className="w-full py-2.5 px-4 bg-rose-600 hover:bg-rose-700 active:scale-[0.98] text-white font-bold text-xs sm:text-sm rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <UserPlus className="w-4 h-4" />
                <span>রেজিস্ট্রেশন করুন</span>
              </button>

              <button
                type="button"
                onClick={() => setShowBloodRegistrationAlert(false)}
                className="w-full py-2 px-4 bg-stone-100 hover:bg-stone-200 text-slate-700 font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

// Subcomponent: Clean Friendly Empty State
const EmptyResultsView: React.FC<{ isBn: boolean; onReset: () => void }> = ({ isBn, onReset }) => (
  <div className="bg-white rounded-2xl p-8 border border-gray-200 shadow-2xs flex flex-col items-center justify-center text-center">
    <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-center mb-3">
      <AlertCircle className="w-6 h-6 text-amber-600" />
    </div>
    <h4 className="text-xs sm:text-sm font-black text-gray-800 mb-1">
      {isBn 
        ? 'আন্তরিকভাবে দুঃখিত, আপনার কাঙ্ক্ষিত তথ্যটি এই মুহূর্তে খুঁজে পাওয়া যায়নি।' 
        : 'We are sincerely sorry, your requested information was not found at this moment.'}
    </h4>
    <p className="text-[11px] text-gray-500 max-w-sm mb-4 leading-relaxed">
      {isBn 
        ? 'আপনার ফিল্টারে জেলা বা উপজেলা শিথিল করে আবার অনুসন্ধান করুন অথবা ফিল্টার রিসেট করুন।' 
        : 'Try selecting a broader district or reset filters to view all records.'}
    </p>
    <button
      type="button"
      onClick={onReset}
      className="text-xs font-bold px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-gray-800 transition cursor-pointer flex items-center gap-1.5"
    >
      <RefreshCw className="w-3.5 h-3.5 text-gray-600" />
      <span>{isBn ? 'ফিল্টার রিসেট করুন' : 'Reset Filters'}</span>
    </button>
  </div>
);

export default ManualSearchPortal;
