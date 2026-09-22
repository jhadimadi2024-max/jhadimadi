export type AppMode = 'customer' | 'partner';

export type Language = 'bn' | 'en';

export type Division = 
  | 'Chittagong Division (চট্টগ্রাম)' 
  | 'Dhaka Division (ঢাকা)' 
  | 'Sylhet Division (সিলেট)' 
  | 'Rajshahi Division (রাজশাহী)' 
  | 'Khulna Division (খুলনা)' 
  | 'Barishal Division (বরিশাল)' 
  | 'Rangpur Division (রংপুর)' 
  | 'Mymensingh Division (ময়মনসিংহ)';

export type District = 'Rangamati' | 'Khagrachhari' | 'Bandarban' | 'Chittagong' | 'Dhaka' | 'Sylhet' | 'All Bangladesh';

export interface HyperlocalLocation {
  division: string;
  district: string;
  upazila: string;
  mahalla: string;
}

export interface LocationItem {
  district: District;
  upazila: string;
  address: string;
  lat: number;
  lng: number;
}

export type ServiceModuleId = 
  | 'organic_ecommerce' 
  | 'home_healthcare' 
  | 'freelance_technician' 
  | 'home_chores' 
  | 'hyperlocal_logistics' 
  | 'rental_realestate'
  | 'creative_event';

export interface ServiceModule {
  id: ServiceModuleId;
  titleBn: string;
  titleEn: string;
  descBn: string;
  descEn: string;
  iconName: string;
  badgeBn?: string;
  badgeEn?: string;
  color: string;
}

export interface OrganicProduct {
  id: string;
  nameBn: string;
  nameEn: string;
  category: 'Shutki' | 'Spices' | 'Fruits' | 'PreHarvest' | 'Specialty' | 'Sidol' | 'Food' | 'Clothing' | 'Electronics' | 'Car' | 'Toys' | 'General';
  price: number;
  unit: string;
  origin: string;
  image: string;
  rating: number;
  reviewsCount: number;
  stock: number;
  inStock?: boolean;
  isPreHarvest?: boolean;
  isOrganic?: boolean;
  sellerName?: string;
  originLocation?: string;
  harvestDate?: string;
  descriptionBn: string;
  descriptionEn: string;
}

export interface Product {
  id: string;
  nameBn: string;
  nameEn?: string;
  title?: string;
  category: string;
  price: number;
  originalPrice?: number;
  regularPrice?: number;
  discountPrice?: number;
  unit: string;
  stock?: number;
  inStock?: boolean;
  image: string;
  images?: string[];
  descriptionBn?: string;
  description?: string;
  location?: string;
  upazila?: string;
  district?: string;
  rating?: number;
  reviewsCount?: number;
  sellerId?: string;
  sellerName?: string;
  sellerPhone?: string;
}

export interface EducationEntry {
  id?: string;
  degree: string;
  institution?: string;
  institute?: string;
  passingYear?: string;
  passYear?: string;
  fieldOfStudy?: string;
  grade?: string;
}

export interface EmploymentEntry {
  id?: string;
  company: string;
  designation: string;
  duration: string;
  description?: string;
  location?: string;
  isCurrentJob?: boolean;
}

export interface CertificationEntry {
  id?: string;
  title?: string;
  certificateName?: string;
  issuer?: string;
  issuingOrg?: string;
  year: string;
  certificateUrl?: string;
  credentialId?: string;
  verified?: boolean;
}

export interface PortfolioItem {
  id?: string;
  title: string;
  description: string;
  imageUrl: string;
  projectUrl?: string;
  completionDate?: string;
  tags?: string[];
  clientFeedback?: string;
}

export interface OtherExperienceEntry {
  id?: string;
  title: string;
  category?: string;
  description?: string;
  details?: string;
}

export interface ServiceProvider {
  id: string;
  uniqueId?: string; // S-[District Code]-[Serial] (e.g. S-RNG-001)
  name: string;
  fatherName?: string;
  motherName?: string;
  dateOfBirth?: string;
  gender?: 'পুরুষ' | 'নারী' | 'অন্যান্য';
  professionalHeadline?: string;
  profession?: string;
  bloodGroup?: string;
  avatar: string;
  categoryBn: string;
  categoryEn: string;
  subCategory: string;
  rating: number;
  jobsCompleted: number;
  hourlyRate: number;
  phoneHidden?: string;
  maskedPhone?: string;
  realPhone: string;
  email?: string;
  district: District;
  upazila: string;
  mahalla?: string;
  nidVerified: boolean;
  selfieVerified?: boolean;
  blueTickActive: boolean;
  isAvailableNow?: boolean;
  isAvailable?: boolean;
  distanceKm: number;
  bioBn: string;
  bioEn?: string;
  bio?: string;
  reviewsCount?: number;
  rateAmount?: string;
  selectedSkillsList?: string[];
  verificationFeePaid?: boolean;

  // Hourly / Daily / Fixed Rate breakdown
  rateType?: 'Hourly' | 'Daily' | 'Fixed' | 'দৈনিক' | 'ঘণ্টাভিত্তিক' | 'চুক্তিভিত্তিক' | 'ভিজিট ফি' | string;
  dailyRate?: number;
  fixedRate?: number;

  // Google Maps Coordinates & Service Area Pinning
  serviceArea?: string;
  coveredAreas?: string[]; // Specific Mahallas, Upazilas, Districts physically covered
  coverageRadiusKm?: number;
  latitude?: number;
  longitude?: number;
  mapPinAddress?: string;
  googleMapsEmbedUrl?: string;

  // Public Freelancer / Upwork / Fiverr Profile Fields
  professionKey?: string;
  serviceCategory?: string;
  portfolioImages?: string[];
  skills?: string[];
  skillsDetails?: string; // Comprehensive text area listing all skills, services offered, and past work background
  experienceYears?: number;
  workGallery?: string[];
  portfolioItems?: PortfolioItem[];
  verifiedCertificates?: string[];
  certificatesList?: CertificationEntry[];
  educations?: EducationEntry[];
  employments?: EmploymentEntry[];
  otherExperiences?: OtherExperienceEntry[];
  customerReviews?: {
    id: string;
    customerName: string;
    rating: number;
    comment: string;
    date: string;
  }[];

  // Private Admin & Worker Dashboard Fields (Hidden on Public View)
  nidNumber?: string;
  nidFrontUrl?: string;
  nidBackUrl?: string;
  selfieUrl?: string;
  detailedAddress?: string;
  isPaidProPartner?: boolean; // BDT 100 Verified Pro Partner [✓]
  activationFeePaid?: boolean;
  paymentMethod?: 'bKash' | 'Nagad' | 'Upay';
  trxId?: string;
  
  // Private Wallet & Lifetime Earnings (STRICTLY HIDDEN on Public View)
  privateWallet?: {
    walletBalance: number;
    totalEarnings: number;
    completedJobs: number;
    pendingPayouts: number;
    pendingEscrow: number;
  };
}

export interface WorkerPortfolioRegistration {
  fullName: string;
  phone: string;
  profilePhotoUrl: string;
  profession: string;
  subCategory?: string;
  rateType: 'Hourly' | 'Daily' | 'Fixed';
  rateAmount: number;
  bio: string;
  skills: string[];
  skillsDetails?: string; // Comprehensive text area listing all skills, services offered, and past work background
  experienceYears?: number;
  coveredAreas?: string[]; // Para/Mahallas, Thanas & Districts physically covered
  coverageRadiusKm?: number;
  portfolioImages: string[];
  certificates: string[];
  nidNumber: string;
  nidFrontUrl: string;
  nidBackUrl: string;
  selfieUrl?: string;
  division: string;
  district: District;
  upazila: string;
  mahalla: string;
  mapPinAddress?: string;
  googleMapsEmbedUrl?: string;
  latitude?: number;
  longitude?: number;
}

export interface PrivateWorkerWallet {
  workerId: string;
  walletBalance: number;
  totalEarnings: number;
  completedJobsCount: number;
  pendingPayoutsCount: number;
  pendingEscrowAmount: number;
  payoutHistory: {
    id: string;
    amount: number;
    method: 'bKash' | 'Nagad' | 'Bank';
    accountNumber: string;
    date: string;
    status: 'Pending' | 'Completed' | 'Rejected';
    trxId?: string;
  }[];
}

export interface PropertyListing {
  id: string;
  titleBn: string;
  titleEn: string;
  type: 'Rent' | 'Sale';
  propertyCategory: 'House' | 'Apartment' | 'Land' | 'Commercial';
  price: number;
  priceUnitBn: string;
  priceUnitEn: string;
  district: District;
  upazila: string;
  area: string;
  bedrooms?: number;
  bathrooms?: number;
  sizeSqft?: number;
  landDecimal?: number;
  images: string[];
  ownerName: string;
  ownerPhoneHidden: string;
  isVerifiedProperty: boolean;
  descriptionBn: string;
}

export interface FeedPost {
  id: string;
  authorName: string;
  authorRole: 'User' | 'Provider' | 'Admin';
  authorAvatar?: string;
  postType: 'Service' | 'Property' | 'ECommerce' | 'NeedWork' | 'General';
  title: string;
  titleEn?: string;
  content: string;
  division: string;
  district: string;
  upazila: string;
  mahalla: string;
  category: string;
  price?: number;
  contactPhoneHidden: string;
  realPhone?: string;
  isContactUnlocked?: boolean;
  status: 'Pending' | 'Approved' | 'Rejected';
  createdAt: string;
  likes: number;
  commentsCount: number;
  image?: string;
  isVerifiedUser?: boolean;
}

export interface Booking {
  id: string;
  customerName: string;
  customerPhone: string;
  serviceTitleBn: string;
  serviceTitleEn: string;
  moduleId: ServiceModuleId;
  provider?: ServiceProvider;
  status: 'Pending' | 'Accepted' | 'EnRoute' | 'InProgress' | 'Completed' | 'Cancelled';
  totalAmount: number;
  contactUnlockFee: number;
  // Escrow & 10% Platform Commission
  escrowStatus?: 'HeldInEscrow' | 'ReleasedToWorker' | 'Refunded';
  clientPaidAmount?: number;
  platformCommission?: number; // 10%
  workerNetEarning?: number; // 90%
  createdAt: string;
  location: string;
  notes?: string;
  isContactUnlocked?: boolean;
}

export interface CartItem {
  product: OrganicProduct;
  quantity: number;
}

export interface WalletState {
  balance: number;
  membershipActive: boolean;
  membershipExpiry: string;
  totalEarnings: number;
  totalCommissionsPaid: number;
  contactUnlockFeesPaid: number;
  transactions: {
    id: string;
    type: 'ContactUnlock' | 'Commission' | 'MembershipFee' | 'Cashout' | 'Earning';
    amount: number;
    descriptionBn: string;
    descriptionEn: string;
    date: string;
    status: 'Success' | 'Pending';
  }[];
}

export interface PartnerVerification {
  nidNumber: string;
  nidFrontImage?: string;
  nidBackImage?: string;
  selfieImage?: string;
  status: 'Unverified' | 'Pending' | 'Verified' | 'Rejected';
  blueTick: boolean;
}

export interface ChatMessage {
  id: string;
  senderName: string;
  senderRole: 'User' | 'Provider';
  message: string;
  timestamp: string;
  isMe: boolean;
}

export interface UserProfile {
  id: string;
  uniqueId?: string;
  memberUID?: string; // [DivCode]-[DistCode]-[UpazilaCode]-[4-Digit Sequence] (e.g., CG-KHG-DGH-0001)
  memberId?: string;
  name: string;
  fullName?: string; // Full Name (পুরো নাম)
  phone?: string; // Phone Number (মোবাইল নম্বর)
  email?: string;
  password?: string;
  role?: 'customer' | 'partner' | 'professional' | 'vendor' | 'admin' | string;
  fatherName?: string;
  motherName?: string;
  dateOfBirth?: string;
  gender?: string;
  division: string;
  district: string; // District (জেলা)
  upazila: string; // Upazila / Thana (উপজেলা/থানা)
  thana?: string;
  mahalla: string; // Para / Mahalla (পাড়া/মহল্লা)
  para?: string;
  paraMahalla?: string;
  divisionCode?: string;
  districtCode?: string;
  upazilaCode?: string;
  avatar: string;
  
  // Role-Specific Distinct Image States (Prevents cross-form image pollution)
  productSellerImageUrl?: string;
  sellerProductImageUrl?: string;
  serviceProviderPhotoUrl?: string;
  serviceProviderPhoto?: string;
  permanentMemberPhotoUrl?: string;
  permanentMemberPhoto?: string;
  permanentMemberCertUrl?: string;
  permanentMemberAffidavitUrl?: string;
  
  // ব্লাড গ্রুপ ও ডোনেশন স্ট্যাটাস
  bloodGroup?: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | string; // Blood Group (ব্লাড গ্রুপ)
  isBloodDonor?: boolean;
  isBloodDonorAvailable?: boolean;
  lastDonationDate?: string;

  // পেশা ও সেবা তথ্য
  profession?: string; // Profession / Service (পেশা / সার্ভিস)
  professionBn?: string;
  serviceCategory?: string;
  experienceYears?: number;
  dailyRate?: string | number;
  hourlyRate?: string | number;
  rateType?: 'দৈনিক' | 'ঘণ্টাভিত্তিক' | 'চুক্তিভিত্তিক' | 'ভিজিট ফি' | 'Daily' | 'Hourly' | 'Fixed' | string;
  isAvailable?: boolean;

  // Merchant / Seller Specific Fields
  shopName?: string;
  ownerName?: string;
  businessCategory?: string;
  tradeLicenseOrNid?: string;

  // Additional dynamic properties
  [key: string]: any;

  // Public Worker/Freelancer Profile Fields
  categorySkill?: string;
  rating?: number;
  completedJobs?: number;
  workGallery?: string[];
  verifiedCertificates?: string[];
  customerReviews?: {
    id: string;
    customerName: string;
    rating: number;
    comment: string;
    date: string;
  }[];

  // Private Admin & Compliance Fields
  nidNumber?: string;
  nidFrontUrl?: string;
  nidBackUrl?: string;
  selfieUrl?: string;
  detailedAddress?: string;
  isNidVerified?: boolean;

  // Permanent Member Exclusive Details
  presentAddress?: string;
  permanentAddress?: string;
  educationalQualification?: string;
  education?: string;
  qualification?: string;
  cvUrl?: string;
  cvFileName?: string;

  // BDT 100 Annual Membership State
  isPaidMember?: boolean; // BDT 100 Verified Pro Partner [✓]
  membershipExpiryDate?: string;
  membershipTrxId?: string;
  membershipPaymentMethod?: 'bKash' | 'Nagad' | 'Rocket' | 'Upay' | 'AdminApproval';
  verificationStatus?: 'Unverified' | 'pending_admin_approval' | 'verified' | 'rejected' | 'revision_requested';
  adminNotes?: string;

  createdAt?: string;
}

export interface AdminVerificationItem {
  id: string;
  userId?: string;
  name: string;
  phone: string;
  email?: string;
  profession: string;
  subCategory?: string;
  rateType?: 'Hourly' | 'Daily' | 'Fixed';
  rateAmount?: number;
  division: string;
  district: string;
  upazila: string;
  mahalla: string;
  nidNumber: string;
  nidFrontUrl?: string;
  nidBackUrl?: string;
  selfieUrl?: string;
  certificates?: string[];
  portfolioImages?: string[];
  skills?: string[];
  bio?: string;
  feeAmount: number;
  paymentMethod: 'bKash' | 'Nagad' | 'Rocket' | 'Upay' | 'AdminApproval';
  trxId: string;
  status: 'pending' | 'approved' | 'rejected' | 'revision_requested';
  adminNotes?: string;
  submittedAt: string;
  reviewedAt?: string;
}

export interface PaymentLedgerItem {
  id: string;
  trxId: string;
  senderName: string;
  senderPhone: string;
  paymentMethod: 'bKash' | 'Nagad' | 'Rocket' | 'Upay' | 'Card';
  amount: number;
  purpose: '100_REGISTRATION_FEE' | 'COMMISSION' | 'CONTACT_UNLOCK';
  status: 'Success' | 'Pending' | 'Refunded';
  date: string;
  reviewedBy?: string;
}

export interface BloodDonor {
  id: string;
  name: string;
  bloodGroup: 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-';
  phone: string;
  password?: string;
  profession?: string;
  division?: string;
  district: string;
  upazila: string;
  area?: string;
  lastDonationDate?: string;
  totalDonations?: number;
  isAvailable?: boolean;
  available?: boolean;
  verified?: boolean;
  emergencyContact?: string;
  age?: number;
  districtUniqueId?: string;
}

export interface ProductOrder {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  items: {
    productId: string;
    nameBn: string;
    price: number;
    quantity: number;
    image?: string;
  }[];
  totalAmount: number;
  paymentMethod: 'COD' | 'Direct_Contact' | 'bKash' | 'Nagad' | 'Upay';
  status: 'Pending' | 'Processing' | 'Delivered' | 'Cancelled';
  date: string;
  notes?: string;

  /**
   * =========================================================================
   * [PROMOTIONAL / BETA PHASE ARCHITECTURE]
   * Payment Gateways (bKash/Nagad/Rocket) and 5%-10% Commissions are currently
   * EXCLUDED. Orders operate strictly on Cash on Delivery (COD) or Direct Seller
   * Contact (WhatsApp/Phone). The fields below are pre-defined so the database
   * schema and application types are 100% future-proof when monetized.
   * =========================================================================
   */
  commissionRate?: number; // Pre-defined for future (0 in current beta)
  commissionAmount?: number; // Pre-defined for future (0 in current beta)
  commissionStatus?: 'exempt' | 'pending' | 'collected' | 'waived';
  paymentStatus?: 'pending' | 'paid' | 'cod_unpaid' | 'failed' | 'refunded';
  gatewayName?: string | null;
  gatewayTransactionId?: string | null;
  gatewayPayload?: any;
  isBetaPhase?: boolean; // Defaults to true in current phase
  orderChannel?: 'COD' | 'Direct_Contact' | 'WhatsApp' | 'Phone';
  customerOtpVerified?: boolean; // Spam & fake order protection
  customerVerificationCode?: string;
  vendorPhone?: string;
  directContactTimestamp?: string;
}

export interface NidVerificationData {
  nidNumber: string;
  fullName: string;
  fatherName?: string;
  motherName?: string;
  dateOfBirth?: string;
  gender?: string;
  address?: string;
  frontImageUri?: string;
  backImageUri?: string;
  selfieImageUri?: string;
  isVerified: boolean;
  verifiedAt?: string;
}

export interface PujaGiftApplication {
  id: string; // e.g., 'PUJA-2026-89234'
  applicantUid?: string;
  userId?: string;
  passportPhoto: string; // Base64 data URL
  fullName: string;
  fatherOrHusbandName: string;
  motherName: string;
  dateOfBirth: string; // DD/MM/YYYY
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: string; // 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-'
  nidOrBirthCertificate: string;
  contactNumber: string;
  presentAddress: {
    villageArea: string;
    thanaUpazila: string;
    district: string;
  };
  permanentAddress: {
    villageArea: string;
    thanaUpazila: string;
    district: string;
  };
  declarationNotes?: string;
  status: 'Pending' | 'Approved' | 'Delivered' | 'Rejected';
  appliedAt: string;
  createdAt?: string;
}

export interface UserSearchFilterParams {
  district?: string;
  thana?: string;
  bloodGroup?: string;
  profession?: string;
  keyword?: string;
  para?: string;
}

// ================= 📢 ব্যানার ও বিজ্ঞাপন মডেল =================
export interface AdminBanner {
  id: string;
  title: string;
  altText?: string;
  subtitle?: string;
  tag?: string;
  imageUrl: string;
  image_url?: string;
  image?: string;
  link_url?: string;
  linkUrl?: string;
  targetLink?: string;
  actionUrl?: string;
  placement?: 'homepage_hero' | 'directory_top' | 'vendor_spotlight' | 'popup_ad';
  isActive: boolean;
  is_active?: boolean;
  order: number;
  displayOrder?: number;
  createdAt: string;
}

// ================= 💼 জব পোর্টাল মডেল (Job Portal) =================
export type JobType = 'Full-time' | 'Part-time' | 'Contract' | 'Remote' | 'Internship';

export interface JobPosting {
  id: string;
  title: string;
  designation?: string;
  companyName: string;
  category: string;
  jobType: JobType;
  salary: string;
  division?: string;
  district: string;
  upazila: string;
  address?: string;
  vacanciesCount?: number;
  education?: string;
  experience?: string;
  description: string;
  requirements?: string[];
  skills?: string[];
  deadline: string;
  contactPhone: string;
  contactEmail?: string;
  applyInstructions?: string;
  employerId?: string;
  employerName?: string;
  submissionType?: 'form' | 'quick_upload';
  circularUrl?: string;
  circularFileName?: string;
  circularFileType?: string;
  status: 'active' | 'closed' | 'paused';
  createdAt: string;
  updatedAt?: string;
}

export interface JobCandidate {
  id: string;
  candidateCode: string;
  name: string;
  phone: string;
  email?: string;
  gender?: 'Male' | 'Female' | 'Other';
  desiredJobTitle: string;
  category: string;
  expectedSalary: string;
  experienceYears: string;
  highestEducation: string;
  skills: string[];
  division?: string;
  district: string;
  upazila: string;
  address?: string;
  bio?: string;
  resumeUrl?: string;
  resumeFileName?: string;
  resumeFileType?: string;
  appliedJobId?: string;
  appliedJobTitle?: string;
  portfolioUrl?: string;
  status: 'available' | 'employed' | 'inactive';
  createdAt: string;
}

export type SearchCategory = 'products' | 'services' | 'blood' | 'circulars' | 'seekers' | 'general' | 'ai_chat';
export type SearchSource = 'ai' | 'manual';

export interface SearchLogEntry {
  id: string;
  queryText: string;
  category: SearchCategory;
  source: SearchSource;
  locationParams?: {
    district?: string;
    upazila?: string;
    area?: string;
  };
  isZeroResult: boolean;
  resultsCount: number;
  createdAt: string;
  timestamp: number;
}

export interface NavClickEvent {
  id: string;
  navOption: 'home' | 'manual_search' | 'ai_search' | 'registration' | 'profile';
  labelBn: string;
  timestamp: number;
  createdAt: string;
}

export interface KeywordMetric {
  keyword: string;
  count: number;
  category: SearchCategory;
  isZeroResultFrequency?: number;
  lastSearched: string;
}

export interface MissingSearchAlert {
  queryText: string;
  category: SearchCategory;
  count: number;
  lastLocation?: string;
  lastRequestedAt: string;
  urgency: 'high' | 'medium' | 'low';
}

export interface NavOptionStat {
  option: 'home' | 'manual_search' | 'ai_search' | 'registration' | 'profile';
  labelBn: string;
  optionNumber: number;
  clicks: number;
  percentage: number;
}

export interface SearchAnalyticsKPIs {
  totalSearches: number;
  aiSearchesCount: number;
  manualSearchesCount: number;
  zeroResultsCount: number;
  zeroResultsRate: number;
  topKeywords: KeywordMetric[];
  topProductsKeywords: KeywordMetric[];
  topServicesKeywords: KeywordMetric[];
  topBloodKeywords: KeywordMetric[];
  missingSearchesAlerts: MissingSearchAlert[];
  navOptionStats: NavOptionStat[];
  recentLogs: SearchLogEntry[];
}

// ----------------------------------------------------
// AI CHAT LOGS & DIRECT LEAD CAPTURE INTERFACES
// ----------------------------------------------------
export type AiChatDetectedIntent = 'Order' | 'Inquiry' | 'Search';
export type AiChatIntentTag = 'order_request' | 'general_inquiry';
export type AiChatLeadStatus = 'new_lead' | 'contacted' | 'converted' | 'archived';

export interface AiChatLogEntry {
  id: string;
  user_id?: string | null;
  session_id?: string | null;
  customer_message: string;
  ai_response: string;
  detected_intent: AiChatDetectedIntent | string;
  intent_tag: AiChatIntentTag | string;
  intent_category?: string;
  customer_name?: string;
  customer_phone?: string;
  delivery_address?: string;
  product_requested?: string;
  status: AiChatLeadStatus | string;
  admin_notes?: string;
  metadata?: Record<string, any>;
  timestamp: number | string;
  created_at: string;
}

export interface AiChatAnalyticsSummary {
  totalChats: number;
  orderRequestsCount: number;
  generalInquiriesCount: number;
  searchIntentsCount: number;
  newLeadsCount: number;
  contactedCount: number;
  convertedCount: number;
  conversionRate: number;
  phoneNumbersCaptured: number;
  recentLogs: AiChatLogEntry[];
}


