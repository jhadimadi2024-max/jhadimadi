import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';
import { 
  ShoppingBag, 
  Bell, 
  User, 
  Search, 
  Sparkles, 
  Home, 
  Briefcase, 
  Grid, 
  MapPin, 
  Mic,
  MicOff,
  ShoppingCart,
  Camera,
  Home as RealEstateIcon,
  Utensils,
  Shirt,
  Car,
  Gem,
  Apple,
  Tv,
  HeartPulse,
  BookOpen,
  Briefcase as JobIcon,
  Building,
  Building2,
  Wrench as ToolIcon,
  Wrench,
  Coffee,
  Package,
  Phone,
  UserPlus,
  LogIn,
  LogOut,
  CheckCircle,
  Globe,
  Languages,
  Star,
  Award,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Flame,
  Fish,
  Headphones,
  SlidersHorizontal,
  ArrowUpDown,
  Tag,
  Zap,
  Sparkle,
  WifiOff,
  Wifi,
  CloudOff,
  Key,
  GraduationCap,
  Sprout,
  Palette,
  Compass,
  PawPrint,
  FileText,
  Smartphone,
  Droplet,
  Heart,
  Gift,
  MessageCircle,
  MessageSquare,
  Cpu,
  X,
  Siren,
  ShieldAlert,
  Trash2,
  PhoneCall,
  Lock,
  Activity,
  LifeBuoy,
  Radio,
  Truck,
  Volume2,
  ExternalLink,
  Hotel,
  Stethoscope,
  UserCheck,
  AlertCircle,
  RefreshCw
} from 'lucide-react';
import { 
  NATIONAL_HELPLINES, 
  POLICE_STATIONS_DIRECTORY, 
  AMBULANCE_SERVICES_DIRECTORY, 
  NationalHelpline, 
  PoliceStationContact, 
  AmbulanceServiceContact 
} from '../data/emergencyContactsData';
import { ProfessionalRegistrationWizard, RegisteredProfessional } from './ProfessionalRegistrationWizard';
import { WorkerProfileModal } from './WorkerProfileModal';
import { StoreProduct, sortProductsAscending } from '../data/productsData';
import { 
  ALL_PROFESSIONS_FLAT_LIST, 
  CORE_6_SERVICE_CATEGORIES, 
  ALL_1000_PROFESSIONS_FLAT_LIST,
  MASTER_1000_PROFESSIONS
} from '../data/professionsMasterData';
import { ProductDetailModal } from './ProductDetailModal';
import { VendorStorefrontModal } from './VendorStorefrontModal';
import { INITIAL_VENDOR_STORES, VendorStore, VendorStoreProduct } from '../data/vendorsData';
import { CartDrawerModal, CartItemType } from './CartDrawerModal';
import { QuickAuthModal } from './QuickAuthModal';
import { RoleSelectionModal } from './RoleSelectionModal';
import { ServiceProviderRegistrationForm } from './ServiceProviderRegistrationForm';
import { ServiceProviderProfile } from './ServiceProviderProfile';
import { ProductSellerProfile } from './ProductSellerProfile';
import { PermanentMemberProfile } from './PermanentMemberProfile';
import { BloodDonorProfileView } from './BloodDonorProfileView';
import { UserProfileDashboard } from './UserProfileDashboard';
import { EmbeddedSignUpPage } from './EmbeddedSignUpPage';
import { SignUpForm } from './SignUpForm';
import { SignInScreen } from './SignInScreen';
import RegistrationPage from './RegistrationPage';
import { EmbeddedTrackSelectionPage } from './EmbeddedTrackSelectionPage';
import { RegistrationFlow } from './RegistrationFlow';
import { EmbeddedVendorStorefrontPage } from './EmbeddedVendorStorefrontPage';
import { MerchantStorefront } from './MerchantStorefront';
import { CleanMerchantPage } from './CleanMerchantPage';
import { HomepageHeroBanner } from './HomepageHeroBanner';
import { EmbeddedServiceProfileBuilder } from './EmbeddedServiceProfileBuilder';
import { EmbeddedFreelancerDashboard } from './EmbeddedFreelancerDashboard';
import { EmbeddedSearchMatrixPage } from './EmbeddedSearchMatrixPage';
import { ProductDetailsScreen, ProductDetailItem } from './ProductDetailsScreen';
import { ManualSearchPortal } from './ManualSearchPortal';
import { DynamicAutoRoutingSystem } from './DynamicAutoRoutingSystem';
import { PujaGiftApplicationForm } from './PujaGiftApplicationForm';
import { GeminiAssistantModal } from './GeminiAssistantModal';
import { JhadimadiChatModal } from './JhadimadiChatModal';
import { UnifiedRegistrationModal } from './UnifiedRegistrationModal';
import { ProductServiceReviewModal } from './ProductServiceReviewModal';
import { BrandLogo } from './BrandLogo';
import { PrivacyPolicyModal } from './PrivacyPolicyModal';
import { AccountDeletionModal } from './AccountDeletionModal';
import { NavigationDrawer } from './NavigationDrawer';
import { PolicyCenterModal, PolicySection } from './PolicyCenterModal';
import { ContactUsModal } from './ContactUsModal';
import { CompanyInfoModal } from './CompanyInfoModal';
import { BottomNav } from './BottomNav';
import { Navbar } from './Navbar';
import { JobPortal } from './JobPortal';
import { UserProfile, ServiceProvider } from '../types';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { OfflineBanner, OfflineFallbackCard } from './OfflineBanner';
import { offlineStorage, OFFLINE_KEYS } from '../utils/offlineStorage';
import { supabase, isSupabaseConfigured } from '../supabase';
import { databaseService, GlobalSearchResponse } from '../services/databaseService';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useNavigation } from '../context/NavigationContext';
import { Language, getTranslation } from '../utils/translations';
import { parseBanglaSearchQuery, startBanglaVoiceRecognition, ParsedSearchResult } from '../utils/aiSearchParser';
import { sanitizeSearchQuery } from '../utils/securitySanitizer';
import { matchesSmartProduct, matchesSmartService, matchesSmartBlood } from '../utils/fuzzySearch';
import { BloodAuthGatekeeperModal } from './BloodAuthGatekeeperModal';
import { getProductPublicUrl } from '../utils/directSupabaseStorage';
import { NO_IMAGE_AVAILABLE_ICON } from '../constants/imageConstants';

export type CustomerAppTab =
  | 'home'
  | 'jobs'
  | 'services'
  | 'search'
  | 'profile'
  | 'signup'
  | 'signin'
  | 'registration'
  | 'registration_flow'
  | 'role_select'
  | 'sp_form'
  | 'sp_profile'
  | 'edit_seller'
  | 'edit_service'
  | 'edit_permanent'
  | 'track_selection'
  | 'track_a_vendor'
  | 'track_b_freelancer'
  | 'freelancer_dashboard'
  | 'product_details'
  | 'auto_directory'
  | 'puja_gift'
  | 'ai_chat'
  | 'message';

export interface CustomerAppProps {
  onReplaySplash?: () => void;
  onNavigateToAdmin?: () => void;
  onOpenRoleSelect?: () => void;
  onOpenAuth?: (mode?: 'signin' | 'signup') => void;
  onNavigateToMerchant?: () => void;
  onNavigateToServiceProvider?: () => void;
  initialTab?: CustomerAppTab;
  isAdminPreview?: boolean;
  children?: React.ReactNode;
}

// ১৫টি অপরিহার্য টপ ক্যাটাগরি ইন্টারফেস
export interface EssentialCategoryItem {
  id: string;
  nameBn: string;
  nameEn: string;
  icon: React.ReactNode;
  badgeBg: string;
  badgeBorder: string;
  iconColor: string;
  activeBg: string;
  activeRing: string;
  categoryFilterKey: string;
  keywords: string[];
}

// ১৬টি অপরিহার্য টপ ক্যাটাগরির তালিকা (Exact 16 Refined Final Categories)
export const ESSENTIAL_15_CATEGORIES: EssentialCategoryItem[] = [
  {
    id: 'cat_real_estate',
    nameBn: 'রিয়েল এস্টেট',
    nameEn: 'Real Estate',
    icon: <Building2 className="w-5 h-5" />,
    badgeBg: 'bg-emerald-50 hover:bg-emerald-100',
    badgeBorder: 'border-emerald-200',
    iconColor: 'text-emerald-600',
    activeBg: 'bg-emerald-600 text-white shadow-emerald-200',
    activeRing: 'ring-2 ring-emerald-500',
    categoryFilterKey: 'RealEstate',
    keywords: ['জমি', 'টিলা', 'বাগান', 'প্লট', 'রিয়েল এস্টেট', 'রিয়েল এস্টেট', 'land', 'real estate', 'ফ্ল্যাট', 'বাড়ি', 'প্রপার্টি']
  },
  {
    id: 'cat_apparel_fashion',
    nameBn: 'পোশাক-আশাক / ড্রেস',
    nameEn: 'Apparel & Dress',
    icon: <Shirt className="w-5 h-5" />,
    badgeBg: 'bg-pink-50 hover:bg-pink-100',
    badgeBorder: 'border-pink-200',
    iconColor: 'text-pink-600',
    activeBg: 'bg-pink-600 text-white shadow-pink-200',
    activeRing: 'ring-2 ring-pink-500',
    categoryFilterKey: 'Clothing',
    keywords: ['পোশাক', 'ড্রেস', 'পাঞ্জাবি', 'পিনন', 'হাদি', 'শাল', 'কুর্তি', 'শার্ট', 'টি-শার্ট', 'dress', 'clothing', 'তাঁত', 'থামি']
  },
  {
    id: 'cat_food_grocery',
    nameBn: 'ফুড ও খাবার',
    nameEn: 'Food & Cuisine',
    icon: <Utensils className="w-5 h-5" />,
    badgeBg: 'bg-orange-50 hover:bg-orange-100',
    badgeBorder: 'border-orange-200',
    iconColor: 'text-orange-600',
    activeBg: 'bg-orange-600 text-white shadow-orange-200',
    activeRing: 'ring-2 ring-orange-500',
    categoryFilterKey: 'Food',
    keywords: ['খাবার', 'ফুড', 'চাল', 'হলুদ', 'মরিচ', 'শুঁটকি', 'শুটকি', 'সিদল', 'আদা', 'food', 'grocery', 'মশলা', 'ভোজ্য']
  },
  {
    id: 'cat_car_vehicles',
    nameBn: 'গাড়ি ও যানবাহন',
    nameEn: 'Car & Vehicles',
    icon: <Car className="w-5 h-5" />,
    badgeBg: 'bg-red-50 hover:bg-red-100',
    badgeBorder: 'border-red-200',
    iconColor: 'text-red-600',
    activeBg: 'bg-red-600 text-white shadow-red-200',
    activeRing: 'ring-2 ring-red-500',
    categoryFilterKey: 'Vehicles',
    keywords: ['গাড়ি', 'যানবাহন', 'চান্দের গাড়ি', 'চাঁদের গাড়ি', 'জীপ', 'বাইক', 'রাইড', 'ড্রাইভার', 'car', 'vehicle', 'ট্রাক']
  },
  {
    id: 'cat_services_hiring',
    nameBn: 'পেশাদার সেবা',
    nameEn: 'Professional Services',
    icon: <Briefcase className="w-5 h-5" />,
    badgeBg: 'bg-indigo-50 hover:bg-indigo-100',
    badgeBorder: 'border-indigo-200',
    iconColor: 'text-indigo-600',
    activeBg: 'bg-indigo-600 text-white shadow-indigo-200',
    activeRing: 'ring-2 ring-indigo-500',
    categoryFilterKey: 'Services',
    keywords: ['সেবা', 'পেশাদার সেবা', 'মিস্ত্রি', 'পেশাজীবী', 'ইলেকট্রিশিয়ান', 'প্লাম্বার', 'কারিগর', 'মেকানিক', 'service', 'professional']
  },
  {
    id: 'cat_electronics_gadgets',
    nameBn: 'ইলেকট্রনিক্স',
    nameEn: 'Electronics & Gadgets',
    icon: <Smartphone className="w-5 h-5" />,
    badgeBg: 'bg-blue-50 hover:bg-blue-100',
    badgeBorder: 'border-blue-200',
    iconColor: 'text-blue-600',
    activeBg: 'bg-blue-600 text-white shadow-blue-200',
    activeRing: 'ring-2 ring-blue-500',
    categoryFilterKey: 'Electronics',
    keywords: ['ইলেকট্রনিক্স', 'স্মার্টওয়াচ', 'মোবাইল', 'ইয়ারবাডস', 'পাওয়ার ব্যাংক', 'ফ্যান', 'হেডল্যাম্প', 'electronics', 'gadget']
  },
  {
    id: 'cat_ornaments_jewelry',
    nameBn: 'গহনা ও অলংকার',
    nameEn: 'Jewelry & Ornaments',
    icon: <Gem className="w-5 h-5" />,
    badgeBg: 'bg-purple-50 hover:bg-purple-100',
    badgeBorder: 'border-purple-200',
    iconColor: 'text-purple-600',
    activeBg: 'bg-purple-600 text-white shadow-purple-200',
    activeRing: 'ring-2 ring-purple-500',
    categoryFilterKey: 'Jewelry',
    keywords: ['গহনা', 'অলংকার', 'রূপা', 'হাঁসুলি', 'চন্দ্রহার', 'জুয়েলারি', 'necklace', 'jewelry', 'ornament', 'স্বর্ণ']
  },
  {
    id: 'cat_house_rent',
    nameBn: 'বাসা ভাড়া',
    nameEn: 'House Rent',
    icon: <Key className="w-5 h-5" />,
    badgeBg: 'bg-amber-50 hover:bg-amber-100',
    badgeBorder: 'border-amber-200',
    iconColor: 'text-amber-600',
    activeBg: 'bg-amber-600 text-white shadow-amber-200',
    activeRing: 'ring-2 ring-amber-500',
    categoryFilterKey: 'HouseRent',
    keywords: ['বাসা ভাড়া', 'ভাড়া', 'ফ্ল্যাট', 'রুম', 'মেস', 'সাবলেট', 'house rent', 'flat', 'apartment']
  },
  {
    id: 'cat_tuition_education',
    nameBn: 'টিউশনি ও শিক্ষা',
    nameEn: 'Tuition & Education',
    icon: <GraduationCap className="w-5 h-5" />,
    badgeBg: 'bg-cyan-50 hover:bg-cyan-100',
    badgeBorder: 'border-cyan-200',
    iconColor: 'text-cyan-600',
    activeBg: 'bg-cyan-600 text-white shadow-cyan-200',
    activeRing: 'ring-2 ring-cyan-500',
    categoryFilterKey: 'Education',
    keywords: ['টিউশনি', 'শিক্ষা', 'টিউটর', 'শিক্ষক', 'বই', 'কোর্স', 'education', 'tuition', 'study']
  },
  {
    id: 'cat_agri_hill_products',
    nameBn: 'কৃষি ও পাহাড়ি শিল্প',
    nameEn: 'Agri & Hill Products',
    icon: <Sprout className="w-5 h-5" />,
    badgeBg: 'bg-lime-50 hover:bg-lime-100',
    badgeBorder: 'border-lime-200',
    iconColor: 'text-lime-700',
    activeBg: 'bg-lime-600 text-white shadow-lime-200',
    activeRing: 'ring-2 ring-lime-500',
    categoryFilterKey: 'Agri',
    keywords: ['কৃষি', 'পাহাড়ি শিল্প', 'ফসল', 'আম্রপালি', 'আম', 'আনারস', 'কাজুবাদাম', 'ফলমূল', 'বাঁশ কোড়ল', 'agriculture', 'জুম', 'জুমের পণ্য']
  },
  {
    id: 'cat_handicrafts_native',
    nameBn: 'হস্তশিল্প',
    nameEn: 'Handicrafts & Native',
    icon: <Palette className="w-5 h-5" />,
    badgeBg: 'bg-rose-50 hover:bg-rose-100',
    badgeBorder: 'border-rose-200',
    iconColor: 'text-rose-600',
    activeBg: 'bg-rose-600 text-white shadow-rose-200',
    activeRing: 'ring-2 ring-rose-500',
    categoryFilterKey: 'Crafts',
    keywords: ['হস্তশিল্প', 'হস্ত শিল্প', 'বাঁশ', 'বেত', 'কুটির শিল্প', 'মধু', 'হ্যান্ডিক্রাফট', 'ঝুড়ি', 'handicrafts', 'craft']
  },
  {
    id: 'cat_tour_travel',
    nameBn: 'ট্যুর ও ট্রাভেলিং',
    nameEn: 'Tour & Travel',
    icon: <Compass className="w-5 h-5" />,
    badgeBg: 'bg-sky-50 hover:bg-sky-100',
    badgeBorder: 'border-sky-200',
    iconColor: 'text-sky-600',
    activeBg: 'bg-sky-600 text-white shadow-sky-200',
    activeRing: 'ring-2 ring-sky-500',
    categoryFilterKey: 'Tour',
    keywords: ['ট্যুর', 'ট্রাভেল', 'ট্রাভেলিং', 'সাজেক', 'রিসোর্ট', 'কটেজ', 'গাইড', 'ভ্রমণ', 'কাপ্তাই', 'tour', 'travel']
  },
  {
    id: 'cat_hotel_restaurant',
    nameBn: 'হোটেল ও রেস্টুরেন্ট',
    nameEn: 'Hotel & Restaurant',
    icon: <Hotel className="w-5 h-5" />,
    badgeBg: 'bg-amber-50 hover:bg-amber-100',
    badgeBorder: 'border-amber-200',
    iconColor: 'text-amber-700',
    activeBg: 'bg-amber-700 text-white shadow-amber-200',
    activeRing: 'ring-2 ring-amber-600',
    categoryFilterKey: 'HotelRestaurant',
    keywords: ['হোটেল', 'রেস্টুরেন্ট', 'রিসোর্ট', 'খাবারের হোটেল', 'ক্যাফে', 'hotel', 'restaurant', 'dining', 'resort']
  },
  {
    id: 'cat_vet_animal_care',
    nameBn: 'পশুপাখি চিকিৎসা',
    nameEn: 'Veterinary & Animal Care',
    icon: <Stethoscope className="w-5 h-5" />,
    badgeBg: 'bg-emerald-50 hover:bg-emerald-100',
    badgeBorder: 'border-emerald-200',
    iconColor: 'text-emerald-700',
    activeBg: 'bg-emerald-700 text-white shadow-emerald-200',
    activeRing: 'ring-2 ring-emerald-600',
    categoryFilterKey: 'VetAnimalCare',
    keywords: ['পশুপাখি', 'পশু', 'পাখি', 'চিকিৎসা', 'ভেটেরিনারি', 'পশু ডাক্তার', 'খামার', 'গরু', 'ছাগল', 'মুরগি', 'veterinary', 'livestock']
  },
  {
    id: 'cat_health_beauty',
    nameBn: 'স্বাস্থ্য ও রূপচর্চা',
    nameEn: 'Health & Beauty',
    icon: <HeartPulse className="w-5 h-5" />,
    badgeBg: 'bg-teal-50 hover:bg-teal-100',
    badgeBorder: 'border-teal-200',
    iconColor: 'text-teal-600',
    activeBg: 'bg-teal-600 text-white shadow-teal-200',
    activeRing: 'ring-2 ring-teal-500',
    categoryFilterKey: 'HealthBeauty',
    keywords: ['স্বাস্থ্য', 'রূপচর্চা', 'ভেষজ', 'তেল', 'আয়ুর্বেদিক', 'ঔষধ', 'হেয়ার অয়েল', 'health', 'beauty', 'স্কিনকেয়ার', 'প্রসাধনী']
  },
  {
    id: 'cat_jobs_employment',
    nameBn: 'চাকরি',
    nameEn: 'Jobs & Employment',
    icon: <UserCheck className="w-5 h-5" />,
    badgeBg: 'bg-blue-50 hover:bg-blue-100',
    badgeBorder: 'border-blue-200',
    iconColor: 'text-blue-700',
    activeBg: 'bg-blue-700 text-white shadow-blue-200',
    activeRing: 'ring-2 ring-blue-600',
    categoryFilterKey: 'Jobs',
    keywords: ['চাকরি', 'জব', 'ক্যারিয়ার', 'নিয়োগ', 'সার্কুলার', 'কাজের সুযোগ', 'vacancies', 'jobs', 'recruitment', 'employment']
  }
];

// ১৬টি সুনির্দিষ্ট অনুভূমিক ক্যাটাগরি ফিল্টার মেনু (Exact 16 Refined Horizontal Category Filter Tabs)
export interface ProductFilterTabItem {
  key: string;
  nameBn: string;
  nameEn: string;
  categoryFilterKey: string;
  keywords: string[];
}

export const PRODUCT_FILTER_TABS: ProductFilterTabItem[] = [
  {
    key: 'all',
    nameBn: 'সকল পণ্য',
    nameEn: 'All Products',
    categoryFilterKey: 'all',
    keywords: []
  },
  {
    key: 'real_estate',
    nameBn: 'রিয়েল এস্টেট',
    nameEn: 'Real Estate',
    categoryFilterKey: 'RealEstate',
    keywords: ['জমি', 'টিলা', 'বাগান', 'প্লট', 'রিয়েল এস্টেট', 'রিয়েল এস্টেট', 'land', 'real estate', 'ফ্ল্যাট', 'বাড়ি', 'প্রপার্টি']
  },
  {
    key: 'clothing',
    nameBn: 'পোশাক-আশাক / ড্রেস',
    nameEn: 'Apparel & Dress',
    categoryFilterKey: 'Clothing',
    keywords: ['পোশাক', 'ড্রেস', 'পাঞ্জাবি', 'পিনন', 'হাদি', 'শাল', 'কুর্তি', 'শার্ট', 'টি-শার্ট', 'dress', 'clothing', 'তাঁত', 'থামি']
  },
  {
    key: 'food',
    nameBn: 'ফুড ও খাবার',
    nameEn: 'Food & Cuisine',
    categoryFilterKey: 'Food',
    keywords: ['খাবার', 'ফুড', 'চাল', 'হলুদ', 'মরিচ', 'শুঁটকি', 'শুটকি', 'সিদল', 'আদা', 'food', 'grocery', 'মশলা', 'ভোজ্য']
  },
  {
    key: 'vehicles',
    nameBn: 'গাড়ি ও যানবাহন',
    nameEn: 'Car & Vehicles',
    categoryFilterKey: 'Vehicles',
    keywords: ['গাড়ি', 'যানবাহন', 'চান্দের গাড়ি', 'চাঁদের গাড়ি', 'জীপ', 'বাইক', 'রাইড', 'ড্রাইভার', 'car', 'vehicle', 'ট্রাক']
  },
  {
    key: 'services',
    nameBn: 'পেশাদার সেবা',
    nameEn: 'Professional Services',
    categoryFilterKey: 'Services',
    keywords: ['সেবা', 'পেশাদার সেবা', 'মিস্ত্রি', 'পেশাজীবী', 'ইলেকট্রিশিয়ান', 'প্লাম্বার', 'কারিগর', 'মেকানিক', 'service', 'professional']
  },
  {
    key: 'electronics',
    nameBn: 'ইলেকট্রনিক্স',
    nameEn: 'Electronics',
    categoryFilterKey: 'Electronics',
    keywords: ['ইলেকট্রনিক্স', 'স্মার্টওয়াচ', 'মোবাইল', 'ইয়ারবাডস', 'পাওয়ার ব্যাংক', 'ফ্যান', 'হেডল্যাম্প', 'electronics', 'gadget']
  },
  {
    key: 'jewelry',
    nameBn: 'গহনা ও অলংকার',
    nameEn: 'Jewelry & Ornaments',
    categoryFilterKey: 'Jewelry',
    keywords: ['গহনা', 'অলংকার', 'রূপা', 'হাঁসুলি', 'চন্দ্রহার', 'জুয়েলারি', 'necklace', 'jewelry', 'ornament', 'স্বর্ণ']
  },
  {
    key: 'house_rent',
    nameBn: 'বাসা ভাড়া',
    nameEn: 'House Rent',
    categoryFilterKey: 'HouseRent',
    keywords: ['বাসা ভাড়া', 'ভাড়া', 'ফ্ল্যাট', 'রুম', 'মেস', 'সাবলেট', 'house rent', 'flat', 'apartment']
  },
  {
    key: 'education',
    nameBn: 'টিউশনি ও শিক্ষা',
    nameEn: 'Tuition & Education',
    categoryFilterKey: 'Education',
    keywords: ['টিউশনি', 'শিক্ষা', 'টিউটর', 'শিক্ষক', 'বই', 'কোর্স', 'education', 'tuition', 'study']
  },
  {
    key: 'agri',
    nameBn: 'কৃষি ও পাহাড়ি শিল্প',
    nameEn: 'Agri & Hill Products',
    categoryFilterKey: 'Agri',
    keywords: ['কৃষি', 'পাহাড়ি শিল্প', 'ফসল', 'আম্রপালি', 'আম', 'আনারস', 'কাজুবাদাম', 'ফলমূল', 'বাঁশ কোড়ল', 'agriculture', 'জুম', 'জুমের পণ্য']
  },
  {
    key: 'crafts',
    nameBn: 'হস্তশিল্প',
    nameEn: 'Handicrafts',
    categoryFilterKey: 'Crafts',
    keywords: ['হস্তশিল্প', 'হস্ত শিল্প', 'বাঁশ', 'বেত', 'কুটির শিল্প', 'হ্যান্ডিক্রাফট', 'ঝুড়ি', 'handicrafts', 'craft']
  },
  {
    key: 'tour',
    nameBn: 'ট্যুর ও ট্রাভেলিং',
    nameEn: 'Tour & Travel',
    categoryFilterKey: 'Tour',
    keywords: ['ট্যুর', 'ট্রাভেল', 'ট্রাভেলিং', 'সাজেক', 'রিসোর্ট', 'কটেজ', 'গাইড', 'ভ্রমণ', 'কাপ্তাই', 'tour', 'travel']
  },
  {
    key: 'hotel_restaurant',
    nameBn: 'হোটেল ও রেস্টুরেন্ট',
    nameEn: 'Hotel & Restaurant',
    categoryFilterKey: 'HotelRestaurant',
    keywords: ['হোটেল', 'রেস্টুরেন্ট', 'রিসোর্ট', 'খাবারের হোটেল', 'ক্যাফে', 'hotel', 'restaurant', 'dining', 'resort']
  },
  {
    key: 'vet_animal_care',
    nameBn: 'পশুপাখি চিকিৎসা',
    nameEn: 'Veterinary & Animal Care',
    categoryFilterKey: 'VetAnimalCare',
    keywords: ['পশুপাখি', 'পশু', 'পাখি', 'চিকিৎসা', 'ভেটেরিনারি', 'পশু ডাক্তার', 'খামার', 'গরু', 'ছাগল', 'মুরগি', 'veterinary', 'livestock']
  },
  {
    key: 'health_beauty',
    nameBn: 'স্বাস্থ্য ও রূপচর্চা',
    nameEn: 'Health & Beauty',
    categoryFilterKey: 'HealthBeauty',
    keywords: ['স্বাস্থ্য', 'রূপচর্চা', 'ভেষজ', 'তেল', 'আয়ুর্বেদিক', 'ঔষধ', 'হেয়ার অয়েল', 'health', 'beauty', 'স্কিনকেয়ার', 'প্রসাধনী']
  },
  {
    key: 'jobs',
    nameBn: 'চাকরি',
    nameEn: 'Jobs & Employment',
    categoryFilterKey: 'Jobs',
    keywords: ['চাকরি', 'জব', 'ক্যারিয়ার', 'নিয়োগ', 'সার্কুলার', 'কাজের সুযোগ', 'vacancies', 'jobs', 'recruitment', 'employment']
  }
];

// ১৬টি ক্যাটালগ (বিস্তারিত ড্রিলডাউন পেজের জন্য)
const CATEGORIES_CATALOG = [
  { id: 1, name: "রিয়েল এস্টেট", icon: <RealEstateIcon className="w-4 h-4 text-emerald-600" /> },
  { id: 2, name: "পোশাক-আশাক / ড্রেস", icon: <Shirt className="w-4 h-4 text-pink-600" /> },
  { id: 3, name: "ফুড ও খাবার", icon: <Utensils className="w-4 h-4 text-orange-500" /> },
  { id: 4, name: "গাড়ি ও যানবাহন", icon: <Car className="w-4 h-4 text-red-500" /> },
  { id: 5, name: "পেশাদার সেবা", icon: <Briefcase className="w-4 h-4 text-indigo-600" /> },
  { id: 6, name: "ইলেকট্রনিক্স", icon: <Tv className="w-4 h-4 text-blue-500" /> },
  { id: 7, name: "গহনা ও অলংকার", icon: <Gem className="w-4 h-4 text-purple-500" /> },
  { id: 8, name: "বাসা ভাড়া", icon: <Key className="w-4 h-4 text-amber-600" /> },
  { id: 9, name: "টিউশনি ও শিক্ষা", icon: <GraduationCap className="w-4 h-4 text-cyan-600" /> },
  { id: 10, name: "কৃষি ও পাহাড়ি শিল্প", icon: <Sprout className="w-4 h-4 text-lime-700" /> },
  { id: 11, name: "হস্তশিল্প", icon: <Palette className="w-4 h-4 text-rose-600" /> },
  { id: 12, name: "ট্যুর ও ট্রাভেলিং", icon: <Compass className="w-4 h-4 text-sky-600" /> },
  { id: 13, name: "হোটেল ও রেস্টুরেন্ট", icon: <Hotel className="w-4 h-4 text-amber-700" /> },
  { id: 14, name: "পশুপাখি চিকিৎসা", icon: <Stethoscope className="w-4 h-4 text-emerald-700" /> },
  { id: 15, name: "স্বাস্থ্য ও রূপচর্চা", icon: <HeartPulse className="w-4 h-4 text-teal-600" /> },
  { id: 16, name: "চাকরি", icon: <UserCheck className="w-4 h-4 text-blue-700" /> }
];

// ১১টি গ্রুপের ১০০০+ সকল পেশাজীবীর তালিকা
const ALL_PROFESSION_CATEGORIES = [
  {
    category: "১. কারিগরি, নির্মাণ ও ভারী শিল্প",
    jobs: [
      "রাজমিস্ত্রি (প্রধান হেড মিস্ত্রি)", "রাজমিস্ত্রি (সহকারী / হেলপার)", "কাঠমিস্ত্রি (আসবাবপত্র ও ডেকোরেশন)", 
      "কাঠমিস্ত্রি (দরজা-জানালা ও ফ্রেম)", "ইলেকট্রিশিয়ান (বাসাবাড়ি ওয়্যারিং)", "ইলেকট্রিশিয়ান (শিল্পকারখানা ও থ্রি-ফেজ)", 
      "প্লাম্বার (স্যানিটারি ও ওয়াটার লাইন)", "পাইপ ফিটার (গ্যাস লাইন)", "থাই ও গ্লাস ফিটিং মিস্ত্রি", 
      "অ্যালুমিনিয়াম ফ্যাব্রিকেটর", "টাইলস ও মার্বেল মিস্ত্রি", "মোজাইক পলিশ মিস্ত্রি", "রডবাইন্ডার / রড মিস্ত্রি", 
      "ওয়েল্ডিং মিস্ত্রি (লোহা ও স্টিল)", "গ্রিল ও এসএস মিস্ত্রি", "রং মিস্ত্রি (ইন্টেরিয়র পেইন্টার)", 
      "রং মিস্ত্রি (এক্সটেরিয়র ও বিল্ডিং পেইন্টার)", "উড পলিশ মিস্ত্রি (আসবাবপত্র বার্নিশ)", "সাটারিং মিস্ত্রি (ঢালাই কাজ)", 
      "স্ক্যাফোল্ডিং / বাঁশ-মাচা মিস্ত্রি", "জেনারেটর মেকানিক ও টেকনিশিয়ান", "লিফট টেকনিশিয়ান ও মেইনটেন্যান্স মিস্ত্রি", 
      "সোলার প্যানেল ইনস্টলার ও টেকনিশিয়ান", "সিসিটিভি ও সিকিউরিটি ক্যামেরা ইনস্টলার", "ওয়াটারপ্রুফিং ও ড্যাম্প মিস্ত্রি", 
      "ফলস সিলিং ও জিপসাম মিস্ত্রি", "বোরিং মিস্ত্রি (টিউবওয়েল ও গভীর নলকূপ)", "ড্রেন ও পয়ঃনিষ্কাশন মিস্ত্রি", 
      "মাটি পরীক্ষা কারিগর (সয়েল টেস্ট টেকনিশিয়ান)", "আর্কিটেকচারাল ড্রাফটসম্যান"
    ]
  },
  {
    category: "২. ইলেকট্রনিক্স, মেকানিক ও হোম অ্যাপ্লায়েন্স",
    jobs: [
      "এসি সার্ভিসিং ও রিপেয়ার টেকনিশিয়ান", "ফ্রিজ / রেফ্রিজারেটর মেকানিক", "ওয়াশিং মেশিন রিপেয়ার টেকনিশিয়ান", 
      "মাইক্রোওয়েভ ওভেন মেকানিক", "টিভি ও এলইডি মনিটর মেকানিক", "আইপিএস ও ইউপিএস মেকানিক", 
      "পানির পাম্প ও মোটর মিস্ত্রি", "গ্যাস স্টোভ ও চুলা মেরামতকারী", "রাইস কুকার ও ইন্ডাকশন চুলা মেকানিক", 
      "ওয়াটার ফিল্টার ও আর-ও (RO) সার্ভিসিং মেকানিক", "গিজার ও ওয়াটার হিটার ফিটিং মিস্ত্রি", 
      "কম্পিউটার ও ল্যাপটপ হার্ডওয়্যার মেকানিক", "প্রিন্টার ও স্ক্যানার মেরামতের টেকনিশিয়ান", "স্মার্টফোন ও মোবাইল ফোন মেকানিক", 
      "সাউন্ড সিস্টেম ও অডিও মেকানিক", "ডিজিটাল ক্যামেরা repair মিস্ত্রি", "সেলাই মেশিন ও টেক্সটাইল মেকানিক"
    ]
  },
  {
    category: "৩. পরিবহন, ড্রাইভ ও যানবাহন মেকানিক",
    jobs: [
      "ব্যক্তিগত প্রাইভেট কার ড্রাইভার", "হেভি ভেহিকল (বাস ও ট্রাক) ড্রাইভার", "মাইক্রোবাস ও হাইয়েস ড্রাইভার", 
      "সিএনজি ও অটো-রিকশা চালক", "রাইড শেয়ারিং বাইকার (পাঠাও/উবার)", "পিকআপ ও কাভার্ড ভ্যান চালক", 
      "ট্রাক্টর ও পাওয়ার ট্রিলার চালক", "স্কেভেটর / ক্রেন অপারেটর", "অ্যাম্বুলেন্স ড্রাইভার", 
      "রাইডার / পার্সেল ডেলিভারিম্যান", "মোটরবাইক মেকানিক", "কার ইঞ্জিন ও ডেন্টিং-পেইন্টিং মিস্ত্রি", 
      "অটো-ইলেকট্রিশিয়ান (গাড়ির ওয়্যারিং)", "গাড়ির এসি মেকানিক", "টায়ার ও ভলকানাইজিং মিস্ত্রি", 
      "সাইকেল ও রিকশা মেরামতকারী", "বোট ও ট্রলার মেকানিক"
    ]
  },
  {
    category: "৪. গৃহস্থালি, পরিচ্ছন্নতা ও দৈনন্দিন সেবা",
    jobs: [
      "পার্ট-টাইম গৃহকর্মী (রান্না ও ধোয়ামোছা)", "ফুল-টাইম গৃহকর্মী (বাসায় থেকে কাজ)", "হোম ক্লিনার (ডিপ ক্লিনিং টিম)", 
      "সোফা ও কার্পেট ক্লিনিং কারিগর", "ওয়াটার ট্যাংক ও সেপটিক ট্যাংক পরিষ্কারক", "ডিশওয়াশার / বাসন মাজার কাজ", 
      "লন্ড্রি বয় (কাপড় ধোয়া ও ইস্ত্রি)", "লন্ড্রি ড্রায়ার ও কেমিক্যাল ড্রাই ক্লিনার", "পেস্ট কন্ট্রোল ও ছারপোকা দমন কারিগর", 
      "কেয়ারগিভার (প্রবীণ ও অসুস্থ মানুষের সেবা)", "বেবি সিটার / আয়া (শিশু লালন-পালন)", "মালী / বাগান পরিচর্যাকারী", 
      "ড্রেন ও ময়লা পরিষ্কারক", "সিকিউরিটি গার্ড / পাহারাদার", "দারোয়ান / গেট কিপার", "বাসাবাড়ির কেয়ারটেকার"
    ]
  },
  {
    category: "৫. কৃষি, খামার, পশুপালন ও পাহাড় কেন্দ্রিক",
    jobs: [
      "কৃষি শ্রমিক (জমি চাষ ও ফসল রোপণ)", "ধান কাটা ও মাড়াই শ্রমিক", "জুম চাষী ও পাহাড়ি কৃষি শ্রমিক", 
      "ফল চাষী ও বাগান রক্ষক (আম, লিচু, ড্রাগন)", "চা বাগান শ্রমিক", "রাবার বাগান কষ সংগ্রহকারী", 
      "বাঁশ ও বেত সামগ্রী কারিগর", "মাশরুম চাষী", "গবাদিপশু (গরু-ছাগল) খামারি", 
      "ডেইরি ফার্ম ফার্মাকোলজি ও দুধ সংগ্রহকারী", "হাঁস-মুরগির (পোল্ট্রি) খামার শ্রমিক", "মৎস্য চাষী ও পুকুর পরিচর্যাকারী", 
      "জেলে / মাছ ধরার ট্রলার শ্রমিক", "মৌমাছি চাষী ও মধু সংগ্রহকারী (বাওয়ালি)", "কসাই (গরু, ছাগল ও খাসি কাটার মিস্ত্রি)", 
      "কোরবানি পশুর মাংস কাটার কারিগর", "পশুর চামড়া ছাড়ানোর কারিগর", "পশুপালন টেকনিশিয়ান / ভ্যাক্সিনেটর", 
      "গাছ কাটার কারিগর / কাঠুরে", "ডালপালা ও বাগান ছাঁটাই মিস্ত্রি"
    ]
  },
  {
    category: "৬. স্বাস্থ্য, চিকিৎসা ও ব্যক্তিগত পরিচর্যা",
    jobs: [
      "জেনারেল ফিজিশিয়ান (MBBS)", "শিশু রোগ বিশেষজ্ঞ", "গাইনোকোলজিস্ট ও প্রসূতি বিশেষজ্ঞ", 
      "দন্ত চিকিৎসক (ডেন্টিস্ট)", "ফিজিও থেরাপিস্ট (হোম সার্ভিস)", "হোম নার্স (পুরুষ/নারী)", 
      "প্যাথলজি ব্লাড কালেকশন বয় (হোম স্যাম্পলিং)", "ফার্মাসিস্ট ও ওষুধ বিক্রেতা", "অলটারনেটিভ মেডিসিন / হোমিও চিকিৎসক", 
      "থেরাপিস্ট ও মাসাজ সার্ভিস (হোম/স্পা)", "বিউটিশিয়ান (হোম পার্লার সার্ভিস)", "মেকআপ আর্টিস্ট (ব্রাইডাল ও পার্টি)", 
      "মেহেদি আর্টিস্ট", "নরসুন্দর / সেলুন কারিগর", "ফিটনেস ট্রেইনার / জিম ইনস্ট্রাক্টর", "যোগব্যায়াম (Yoga) শিক্ষক"
    ]
  },
  {
    category: "৭. শিক্ষা, পরামর্শ ও ফ্রিল্যান্সার",
    jobs: [
      "হাউস টিউটর (গণিত ও বিজ্ঞান)", "হাউস টিউটর (ইংরেজি ও মানবিক)", "প্রাইমারি ও অল-সাবজেক্ট টিউটর", 
      "কুরআন ও ধর্মীয় শিক্ষার শিক্ষক (ক্বারী/হাফেজ)", "ড্রয়িং ও আর্ট শিক্ষক", "সংগীত ও বাদ্যযন্ত্র শিক্ষক", 
      "ডান্স ও নৃত্য শিক্ষক", "লিগ্যাল এডভাইজার / আইনজীবী", "আয়কর ও ট্যাক্স কনসালটেন্ট", 
      "গ্রাফিক ডিজাইনার", "ওয়েব ডেভেলপার ও প্রোগ্রামার", "এসইও (SEO) বিশেষজ্ঞ", 
      "ডিজিটাল মার্কেটিং বিশেষজ্ঞ", "কন্টেন্ট রাইটার ও অনুবাদক", "ভিডিও এডিটর ও এনিমেশন কারিগর"
    ]
  },
  {
    category: "৮. ইভেন্ট, বিনোদন ও ডেকোরেশন",
    jobs: [
      "ইভেন্ট প্ল্যানার ও অর্গানাইজার", "সাউন্ড সিস্টেম অপারেটর ও টেকনিশিয়ান", "ডেকোরেটর ও প্যান্ডেল কারিগর", 
      "সামিয়ানা ও স্টেজ মিস্ত্রি", "লাইটিং ও ডেকোরেটিভ আলো কারিগর", "ফ্লাওয়ার ডেকোরেটর (ফুল দিয়ে সাজানো)", 
      "পেশাদার ফটোগ্রাফার (ইভেন্ট/ওয়েডিং)", "ভিডিওগ্রাফার ও ড্রোন অপারেটর", "ডিজে (DJ) ও মিউজিক মিক্সার", 
      "ক্যাটারিং বাবুর্চি (বিয়ে ও অনুষ্ঠানের রান্না)", "ওয়েটার ও সার্ভিং বয় (ইভেন্ট)"
    ]
  },
  {
    category: "৯. স্থানীয় কেনাকাটা, বাজার ও লজিস্টিকস",
    jobs: [
      "পার্সোনাল বাইয়ার / কাঁচাবাজারের বাজারকারী", "গ্রোসারী ও মুদি পণ্য হোম ডেলিভারিম্যান", "রান্নার গ্যাস সিলিন্ডার ডেলিভারিম্যান", 
      "খাবার পানির জেনো জিপ/ড্রাম সরবরাহকারী", "ফুড ডেলিভারি বয় (হোমমেড/রেস্টুরেন্ট)", "নিউজপেপার হকার", 
      "ডাব বিক্রেতা ও ফল ছাঁটাইকারী", "ভাঙারি ও পুরান জিনিসপত্র সংগ্রহকারী", "কুলি / ভারী মালামাল বহনকারী শ্রমিক", 
      "বাসাবাড়ি শিফটিং (লোডিং-আনলোডিং) লেবার", "ফার্নিচার ফিটিং ও ডিসম্যান্টল মিস্ত্রি"
    ]
  },
  {
    category: "১০. হস্তশিল্প, কুটির শিল্প ও কারুশিল্প",
    jobs: [
      "তাঁতি (জামদানি, তাঁত ও শাড়ি)", "কুমার / মৃৎশিল্পী (মাটির পাতিল ও টব)", "কামার (লোহার দা, বটি ও তৈরি কারিগর)", 
      "দর্জি / টেইলার্স (পুরুষ)", "দর্জি / টেইলার্স (নারী)", "এম্ব্রয়ডারি ও কারচুপি কারিগর", 
      "ব্লক ও বুটিক্স কারিগর", "জুতা ও চামড়াজাত পণ্য মেরামতকারী (মুচি)", "স্বর্ণকার / জুয়েলারি কারিগর"
    ]
  },
  {
    category: "১১. ধর্মীয়, সামাজিক ও অন্যান্য সেবা",
    jobs: [
      "ইমাম ও খতিব", "মুয়াজ্জিন", "কাজি (বিবাহ ও নিকাহ রেজিস্টার)", "পুরোহিত ও পূজা পরিচালনাকারী", 
      "ভেনতে (বৌদ্ধ ধর্মীয় ভিক্ষু/ধর্মগুরু)", "পাস্তর (খ্রিস্টান ধর্মীয় যাজক)", "কবর খোদক / গোসল প্রদানকারী"
    ]
  }
];

// বাংলাদেশের ৬৪টি জেলা এবং তার অধীনে থাকা সকল উপজেলা/থানার পূর্ণাঙ্গ লিস্ট
const ALL_BANGLADESH_DISTRICTS: Record<string, string[]> = {
  // চট্টগ্রাম বিভাগ
  "খাগড়াছড়ি": ["খাগড়াছড়ি সদর", "পানছড়ি", "দীঘিনালা", "মাটিরাঙ্গা", "মানিকছড়ি", "মহালছড়ি", "রামগড়", "লক্ষ্মীছড়ি", "গুয়াইমারা"],
  "রাঙ্গামাটি": ["রাঙ্গামাটি সদর", "কাপ্তাই", "কাউখালী", "বাঘাইছড়ি", "বরকল", "লংগদু", "রাজস্থলী", "জুরাছড়ি", "বেলাছড়ি", "নানিয়ারচর"],
  "বান্দরবান": ["বান্দরবান সদর", "রুমা", "থানচি", "রোয়াংছড়ি", "লামা", "আলীকদম", "নাইক্ষ্যংছড়ি"],
  "চট্টগ্রাম": ["কোতোয়ালী", "পাঁচলাইশ", "হালিশহর", "পতেঙ্গা", "ডাবলমুরিং", "আনোয়ারা", "বাঁশখালী", "বোয়ালখালী", "চন্দনাইশ", "ফটিকছড়ি", "হাটহাজারী", "মিরসরাই", "পটিয়া", "রাঙ্গুনিয়া", "রাওজান", "সন্দ্বীপ", "সীতাকুণ্ড"],
  "কক্সবাজার": ["কক্সবাজার সদর", "চকোরিয়া", "মহেশখালী", "টেকনাফ", "উখিয়া", "কুতুবদিয়া", "পেকুয়া", "রামু", "ঈদগাঁও"],
  "কুমিল্লা": ["কুমিল্লা আদর্শ সদর", "কুমিল্লা সদর দক্ষিণ", "চৌদ্দগ্রাম", "লাকসাম", "দাউদকান্দি", "দেবিদ্বার", "বরুড়া", "বুড়িচং", "ব্রাহ্মণপাড়া", "চান্দিনা", "হোমনা", "মেঘনা", "মুরাদনগর", "নাঙ্গলকোট", "তিতাস", "মনোহরগঞ্জ", "লালমাই"],
  "ফেনী": ["ফেনী সদর", "দাগনভূঁঞা", "ছাগলনাইয়া", "পরশুরাম", "ফুলগাজী", "সোনাগাজী"],
  "নোয়াখালী": ["নোয়াখালী সদর", "বেগমগঞ্জ", "চাটখিল", "কোম্পানীগঞ্জ", "হাতিয়া", "সেনবাগ", "সুবর্ণচর", "কবিরহাট", "সোনাইমুড়ী"],
  "লক্ষ্মীপুর": ["লক্ষ্মীপুর সদর", "রায়পুর", "রামগঞ্জ", "রামগতি", "কমলনগর"],
  "চাঁদপুর": ["চাঁদপুর সদর", "ফরিদগঞ্জ", "হাইমচর", "হাজীগঞ্জ", "কচুয়া", "মতলব উত্তর", "মতলব দক্ষিণ", "শাহরাস্তি"],
  "ব্রাহ্মণবাড়িয়া": ["ব্রাহ্মণবাড়িয়া সদর", "আশুগঞ্জ", "বাঞ্ছারামপুর", "কসবা", "নবীনগর", "নাসিরনগর", "সরাইল", "আখাউড়া", "বিজয়নগর"],

  // ঢাকা বিভাগ
  "ঢাকা": ["ধানমন্ডি", "মিরপুর", "উত্তরা", "গুলশান", "বনানী", "মোহাম্মদপুর", "তেজগাঁও", "রামপুরা", "মতিঝিল", "শাহবাগ", "সাভার", "ধামরাই", "কেরানীগঞ্জ", "নবাবগঞ্জ", "দোহার"],
  "গাজীপুর": ["গাজীপুর সদর", "কালিয়াকৈর", "কালীগঞ্জ", "কাপাসিয়া", "শ্রীপুর"],
  "নারায়ণগঞ্জ": ["নারায়ণগঞ্জ সদর", "আড়াইহাজার", "বন্দর", "রূপগঞ্জ", "সোনারগাঁ"],
  "টাঙ্গাইল": ["টাঙ্গাইল সদর", "বাসাইল", "ভূঞাপুর", "দে Physicians", "ঘাটাইল", "গোপালপুর", "কালিহাতী", "মধুপুর", "মির্জাপুর", "নাগরপুর", "সখিপুর", "ধনবাড়ী"],
  "নরসিংদী": ["নরসিংদী সদর", "বেলবো", "মনোহরদী", "পলাশ", "রায়পুরা", "শিবপুর"],
  "মানিকগঞ্জ": ["মানিকগঞ্জ সদর", "সিংগাইর", "শিবালয়", "সাটুরিয়া", "হরিরামপুর", "ঘিওর", "দৌলতপুর"],
  "মুন্সিগঞ্জ": ["মুন্সিগঞ্জ সদর", "গজারিয়া", "টঙ্গীবাড়ী", "সিরাজদিখান", "লৌহজং", "শ্রীনগর"],
  "ফরিদপুর": ["ফরিদপুর সদর", "বোয়ালমারী", "আলফাডাঙ্গা", "মধুখালী", "নগরকান্দা", "সালথা", "সদরপুর", "ভাঙ্গা", "চরভদ্রাসন"],
  "মাদারীপুর": ["মাদারীপুর সদর", "শিবচর", "কালকিনি", "রাজৈর", "ডাসার"],
  "গোপালগঞ্জ": ["গোপালগঞ্জ সদর", "কাশিয়ানী", "কোটালীপাড়া", "মুকসুদপুর", "টুঙ্গিপাড়া"],
  "রাজবাড়ী": ["রাজবাড়ী সদর", "পাংশা", "কালুখালী", "বালিয়াকান্দি", "গোয়ালন্দ"],
  "শরীয়তপুর": ["শরীয়তপুর সদর", "ডামুড্যা", "নড়িয়া", "ভেদরগঞ্জ", "জাজিরা", "গোসাইরহাট"],
  "কিশোরগঞ্জ": ["কিশোরগঞ্জ সদর", "অষ্টগ্রাম", "বাজিতপুর", "ভৈরব", "হোসেনপুর", "ইটনা", "করিমগঞ্জ", "কটিয়াদী", "কুলিয়ারচর", "মিঠামইন", "নিকলী", "পাকুন্দিয়া", "তাড়াইল"],

  // রাজশাহী বিভাগ
  "রাজশাহী": ["বোয়ালিয়া", "রাজপাড়া", "মতিহার", "শাহ মখদুম", "পবা", "গোদাগাড়ী", "তানোর", "মোহনপুর", "বাগমারা", "দুর্গাপুর", "পুঠিয়া", "চারঘাট", "বাঘা"],
  "বগুড়া": ["বগুড়া সদর", "শেরপুর", "শিবগঞ্জ", "ধুনট", "গাবতলী", "কাহালু", "নন্দীগ্রাম", "সারিয়াকান্দি", "শাজাহানপুর", "সোনারায়", "আদমদীঘি", "দুপচাঁচিয়া"],
  "পাবনা": ["পাবনা সদর", "আটঘরিয়া", "বেড়া", "ভঙ্গুড়া", "চাটমোহর", "ফরিদপুর", "ঈশ্বরদী", "সান্থিয়া", "সুজানগর"],
  "সিরাজগঞ্জ": ["সিরাজগঞ্জ সদর", "বেলকুচি", "চৌহালী", "কামারখন্দ", "কাজীপুর", "রায়গঞ্জ", "শাহজাদপুর", "তারাস", "উল্লাপাড়া"],
  "নওগাঁ": ["নওগাঁ সদর", "আত্রাই", "বদলগাছী", "ধামইরহাট", "মান্দা", "মহাদেবপুর", "নিয়ামতপুর", "পত্নীতলা", "পোরশা", "রানীনগর", "সাপাহার"],
  "নাটোর": ["নাটোর সদর", "বড়াইগ্রাম", "গুরুদাসপুর", "লালপুর", "নলডাঙ্গা", "সিংড়া", "বাগাতিপাড়া"],
  "জয়পুরহাট": ["জয়পুরহাট সদর", "আক্কেলপুর", "কালাই", "ক্ষেতলাল", "পাঁচবিবি"],
  "চাঁপাইনবাবগঞ্জ": ["চাঁপাইনবাবগঞ্জ সদর", "গোমস্তাপুর", "হাতিবান্ধা", "নাচোল", "ভোলাহাট", "শিবগঞ্জ"],

  // খুলনা বিভাগ
  "খুলনা": ["খুলনা সদর", "রূপসা", "ফুলতলা", "ডুমুরিয়া", "বটিয়াঘাটা", "দাকোপ", "পাইকগাছা", "কয়রা", "তেরখাদা", "দিঘলিয়া"],
  "যশোর": ["যশোর সদর", "অভয়নগর", "বাঘারপাড়া", "চৌগাছা", "ঝিকরগাছা", "কেশবপুর", "মণিরামপুর", "শার্শা"],
  "সাতক্ষীরা": ["সাতক্ষীরা সদর", "আশাশুনি", "দেবহাটা", "ক্যালারোয়া", "কালীগঞ্জ", "শ্যামনগর", "তালা"],
  "বাগেরহাট": ["বাগেরহাট সদর", "চিতলমারী", "ফকিরহাট", "কচুয়া", "মোল্লাহাট", "মংলা", "মোরেলগঞ্জ", "রামপাল", "শরণখোলা"],
  "ঝিনাইদহ": ["ঝিনাইদহ সদর", "হরিণাকুণ্ডু", "কালীগঞ্জ", "কোটচাঁদপুর", "মহেশপুর", "শৈলকুপা"],
  "কুষ্টিয়া": ["কুষ্টিয়া সদর", "কুমারখালী", "খোকসা", "মিরপুর", "দৌলতপুর", "ভেড়ামারা"],
  "মাগুরা": ["মাগুরা সদর", "মহম্মদপুর", "শালিখা", "শ্রীপুর"],
  "মেহেরপুর": ["মেহেরপুর সদর", "গাংনী", "মুজিবনগর"],
  "নড়াইল": ["নড়াইল সদর", "লোহাগড়া", "কালিয়া"],
  "চুয়াডাঙ্গা": ["চুয়াডাঙ্গা সদর", "আলমডাঙ্গা", "দামুড়হুদা", "জীবননগর"],

  // বরিশাল বিভাগ
  "বরিশাল": ["বরিশাল সদর", "বাকেরগঞ্জ", "উজিরপুর", "মেহেন্দিগঞ্জ", "বানারীপাড়া", "বাবুগঞ্জ", "গৌরনদী", "হিজলা", "আগৈলঝাড়া", "মুলাদী"],
  "পটুয়াখালী": ["পটুয়াখালী সদর", "বাউফল", "দশমিনা", "গলাচিপা", "কলাপাড়া", "মির্জাগঞ্জ", "দুুমকী", "রাঙ্গাবালী"],
  "ভোলা": ["ভোলা সদর", "বোরহানউদ্দিন", "চরফ্যাশন", "দৌলতখান", "লালমোহন", "মনপুরা", "তজুমদ্দিন"],
  "বরগুনা": ["বরগুনা সদর", "আমতলী", "বামনা", "বেতাগী", "পাথরঘাটা", "তালতলী"],
  "পিরোজপুর": ["পিরোজপুর সদর", "ভান্ডারিয়া", "কাউখালী", "মঠবাড়িয়া", "নাজিরপুর", "নেছারাবাদ (স্বরূপকাঠী)", "জিয়ানগর"],
  "ঝালকাঠি": ["ঝালকাঠি সদর", "কাঠালিয়া", "নলছিটি", "রাজাপুর"],

  // সিলেট বিভাগ
  "সিলেট": ["সিলেট সদর", "গোলাপগঞ্জ", "বীণাবাজার", "জৈন্তাপুর", "কানাইঘাট", "শ্রীমঙ্গল", "বিশ্বনাথ", "দক্ষিণ সুরমা", "ফেঞ্চুগঞ্জ", "কোম্পানীগঞ্জ", "বালাগঞ্জ", "জকিগঞ্জ", "ওসমানীনগর"],
  "মৌলভীবাজার": ["মৌলভীবাজার সদর", "বড়লেখা", "জুড়ী", "কমলগঞ্জ", "কুলউড়া", "রাজনগর", "শ্রীমঙ্গল"],
  "সুনামগঞ্জ": ["সুনামগঞ্জ সদর", "বিশ্বম্ভরপুর", "ছাতক", "দেরাই", "ধর্মপাশা", "দোয়ারাবাজার", "জগন্নাথপুর", "জামালগঞ্জ", "শাল্লা", "তাহিরপুর", "দক্ষিণ সুনামগঞ্জ"],
  "হবিগঞ্জ": ["হবিগঞ্জ সদর", "আজমিরীগঞ্জ", "বাহুবল", "ব্যানিয়াচং", "চুনারুঘাট", "নবীগঞ্জ", "মাধবপুর", "লাখাই", "শায়স্তাগঞ্জ"],

  // রংপুর বিভাগ
  "রংপুর": ["রংপুর সদর", "বদরগঞ্জ", "গঙ্গাচড়া", "কাউনিয়া", "মিঠাপুকুর", "পীরগাছা", "পীরগঞ্জ", "তারাগঞ্জ"],
  "দিনাজপুর": ["দিনাজপুর সদর", "বিরামপুর", "বীরগঞ্জ", "বোচাগঞ্জ", "ফুলবাড়ী", "ঘোড়াঘাট", "হাকিমপুর", "কাহারোল", "খানসামা", "খানসামা", "নবাবগঞ্জ", "পার্বতীপুর", "চিরিরবন্দর"],
  "নীলফামারী": ["নীলফামারী সদর", "সৈয়দপুর", "ডিমলা", "ডুমুরিয়া", "জলঢাকা", "কিশোরগঞ্জ"],
  "গাইবান্ধা": ["গাইবান্ধা সদর", "ফুলছড়ি", "গোবিন্দগঞ্জ", "পলাশবাড়ী", "সাদুল্লাপুর", "সাঘাটা", "সুন্দরগঞ্জ"],
  "কুড়িগ্রাম": ["কুড়িগ্রাম সদর", "ভুরুঙ্গামারী", "চর রাজিবপুর", "চিলমারী", "ফুলবাড়ী", "নাগেশ্বরী", "রাজারহাট", "রৌমারী", "উলিপুর"],
  "লালমনিরহাট": ["লালমনিরহাট সদর", "আদিতমারী", "হাতিবান্ধা", "কালীগঞ্জ", "পাটগ্রাম"],
  "পঞ্চগড়": ["পঞ্চগড় সদর", "আটোয়ারী", "বোদা", "দেবীগঞ্জ", "তেঁতুলিয়া"],
  "ঠাকুরগাঁও": ["ঠাকুরগাঁও সদর", "বালিয়াডাঙ্গী", "হরিপুর", "পীরগঞ্জ", "রাণীশংকৈল"],

  // ময়মনসিংহ বিভাগ
  "ময়মনসিংহ": ["ময়মনসিংহ সদর", "মুক্তাগাছা", "ফুলবাড়িয়া", "ত্রিশাল", "গফরগাঁও", "ভালুকা", "ধোবাউড়া", "ফুলপুর", "হালুয়াঘাট", "ঈশ্বরগঞ্জ", "নন্দাইল", "তারাকান্দা"],
  "জামালপুর": ["জামালপুর সদর", "বকশীগঞ্জ", "দেওয়ানগঞ্জ", "ইসলামপুর", "মাদারগঞ্জ", "মেলান্দহ", "সরিষাবাড়ী"],
  "শেরপুর": ["শেরপুর সদর", "ঝিনাইগাতী", "নকলা", "নালিতাবাড়ী", "শ্রীবরদী"],
  "নেত্রকোণা": ["নেত্রকোণা সদর", "আটপাড়া", "বারহাট্টা", "দুর্গাপুর", "খালিয়াজুরী", "কলমাকান্দা", "কেন্দুয়া", "মদন", "মহনগঞ্জ", "পূর্বধলা"]
};

// স্মার্ট বহুভাষিক ও সমার্থক পণ্য সার্চ ম্যাচিং হেল্পার (Bilingual, Phonetic & Fuzzy Product Matcher)
export const matchesProductSearch = (p: StoreProduct, query: string): boolean => {
  return matchesSmartProduct(p, query);
};

export const CustomerApp: React.FC<CustomerAppProps> = ({ 
  onReplaySplash, 
  onNavigateToAdmin, 
  onOpenRoleSelect,
  onOpenAuth,
  onNavigateToMerchant,
  onNavigateToServiceProvider,
  initialTab,
  isAdminPreview = false,
  children
}) => {
  // নেটওয়ার্ক অবস্থা ও অফলাইন মনিটরিং
  const { isOnline, wasOffline, isChecking, checkConnection } = useNetworkStatus();

  // গ্লোবাল অথেন্টিকেশন ও রোল স্টেট (Global AuthContext)
  const {
    currentUser,
    userRole,
    userProfessionalProfile,
    isAuthModalOpen,
    authNoticeMessage,
    authModalInitialMode,
    isRoleModalOpen,
    activeProfileTab,
    setActiveProfileTab,
    openAuthModal,
    closeAuthModal,
    openRoleModal,
    closeRoleModal,
    login,
    logout,
    updateUser,
    selectRole,
    saveProfessionalProfile,
  } = useAuth();

  // গ্লোবাল ডাটা কন্টেক্সট থেকে পূর্ণাঙ্গ ডাটা কানেক্ট করা (100% Real-Time Dynamic Sync)
  const { 
    products: allProducts, 
    addProduct: contextAddProduct, 
    isProductsLoading,
    productsError,
    refreshProducts,
    professionals, 
    addProfessional: contextAddProfessional,
    users,
    orders,
    banners,
    bloodDonors,
    complaints,
    locations,
    serviceCategories,
    posts,
    activeDraftPreview
  } = useData();

  const [activeSpProfileData, setActiveSpProfileData] = useState<any>(null);

  const mainScrollContainerRef = useRef<HTMLElement | null>(null);

  // Auto-hide / show behavior for bottom navigation bar and top header on scroll direction
  const [isBottomNavVisible, setIsBottomNavVisible] = useState<boolean>(true);
  const [isTopHeaderVisible, setIsTopHeaderVisible] = useState<boolean>(true);
  const [isScrolled, setIsScrolled] = useState<boolean>(false);
  const [isSearchFocused, setIsSearchFocused] = useState<boolean>(false);
  const [isListeningVoice, setIsListeningVoice] = useState(false);
  const isSearchFocusedRef = useRef<boolean>(false);
  const isListeningVoiceRef = useRef<boolean>(false);
  const lastScrollTopRef = useRef<number>(0);

  // Keep refs in sync for scroll handler without triggering re-attachments
  isSearchFocusedRef.current = isSearchFocused;
  isListeningVoiceRef.current = isListeningVoice;

  // Navigation Drawer & Policy Center Modals
  const [isNavigationDrawerOpen, setIsNavigationDrawerOpen] = useState(false);
  const [isPolicyCenterOpen, setIsPolicyCenterOpen] = useState(false);
  const [policyCenterInitialSection, setPolicyCenterInitialSection] = useState<PolicySection>('overview');
  const [isCompanyInfoOpen, setIsCompanyInfoOpen] = useState(false);
  const [isContactUsModalOpen, setIsContactUsModalOpen] = useState(false);

  // Clean Home Page: Keep Tidio launcher hidden on front/home page while running in background
  useEffect(() => {
    const hideTidio = () => {
      try {
        const tidioApi = (window as any).tidioChatApi;
        if (tidioApi) {
          tidioApi.hide();
          tidioApi.on('close', () => {
            document.body.classList.remove('tidio-chat-visible');
            tidioApi.hide();
          });
        }
      } catch (_) {}
    };

    hideTidio();
    document.addEventListener('tidioChat-ready', hideTidio);
    return () => {
      document.removeEventListener('tidioChat-ready', hideTidio);
    };
  }, []);

  // Google Play Store Compliance Modals (Privacy Policy & Account Deletion)
  const [isPrivacyPolicyOpen, setIsPrivacyPolicyOpen] = useState(false);
  const [isAccountDeletionOpen, setIsAccountDeletionOpen] = useState(false);

  // Section 3 & 5: Unified Registration & Review Modals
  const [isUnifiedRegistrationOpen, setIsUnifiedRegistrationOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewTargetName, setReviewTargetName] = useState('পণ্য বা সেবা');

  useEffect(() => {
    let ticking = false;
    const container = mainScrollContainerRef.current;

    const handleScroll = (e?: Event) => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          let currentScrollTop = 0;
          let scrollHeight = 0;
          let clientHeight = 0;

          const targetEl = (e?.target && e.target !== document && (e.target as HTMLElement).scrollTop !== undefined)
            ? (e.target as HTMLElement)
            : container;

          if (targetEl && targetEl.scrollTop !== undefined) {
            currentScrollTop = targetEl.scrollTop;
            scrollHeight = targetEl.scrollHeight;
            clientHeight = targetEl.clientHeight;
          } else {
            currentScrollTop = window.pageYOffset || document.documentElement.scrollTop || 0;
            scrollHeight = document.documentElement.scrollHeight;
            clientHeight = window.innerHeight;
          }

          // If in admin preview, keep header and bottom nav permanently fixed
          if (isAdminPreview) {
            setIsTopHeaderVisible(true);
            setIsBottomNavVisible(true);
            setIsScrolled(currentScrollTop > 20);
            ticking = false;
            return;
          }

          // If currently searching or voice listening, keep header visible
          if (isSearchFocusedRef.current || isListeningVoiceRef.current) {
            setIsTopHeaderVisible(true);
            setIsBottomNavVisible(true);
            ticking = false;
            return;
          }

          // 1. Near the top of the page: always show both
          if (currentScrollTop <= 25) {
            setIsTopHeaderVisible(true);
            setIsBottomNavVisible(true);
            setIsScrolled(false);
            lastScrollTopRef.current = Math.max(0, currentScrollTop);
            ticking = false;
            return;
          }

          setIsScrolled(true);

          // 2. Near bottom: auto-show bottom nav so user can navigate to other tabs
          if (scrollHeight > clientHeight && currentScrollTop + clientHeight >= scrollHeight - 30) {
            setIsBottomNavVisible(true);
            lastScrollTopRef.current = currentScrollTop;
            ticking = false;
            return;
          }

          const diff = currentScrollTop - lastScrollTopRef.current;

          // 3. Scroll Down: smoothly hide the top header and bottom nav
          if (diff > 6 && currentScrollTop > 40) {
            setIsTopHeaderVisible(false);
            setIsBottomNavVisible(false);
          }
          // 4. Scroll Up (even slightly): immediately show top header and bottom nav
          else if (diff < -3) {
            setIsTopHeaderVisible(true);
            setIsBottomNavVisible(true);
          }

          lastScrollTopRef.current = currentScrollTop;
          ticking = false;
        });
        ticking = true;
      }
    };

    if (container) {
      container.addEventListener('scroll', handleScroll, { passive: true });
    }
    window.addEventListener('scroll', handleScroll, { passive: true, capture: true });

    return () => {
      if (container) {
        container.removeEventListener('scroll', handleScroll);
      }
      window.removeEventListener('scroll', handleScroll, { capture: true });
    };
  }, []);

  // SPA History-backed navigation from NavigationContext
  const {
    location,
    isAtRootHome,
    canGoBack,
    navigateToHome,
    navigateToTab,
    navigateToProduct,
    openModal,
    closeModal,
    goBack,
  } = useNavigation();

  // Active Tab is driven by SPA NavigationContext with proper history stack
  const activeTab: CustomerAppTab = (location.tab as CustomerAppTab) || 'home';

  const setActiveTab = useCallback((tabOrFn: any) => {
    const nextTab = typeof tabOrFn === 'function' ? tabOrFn(location.tab || 'home') : tabOrFn;
    navigateToTab(nextTab);
  }, [location.tab, navigateToTab]);

  // When active tab changes, ensure header and nav bar are visible and reset scroll tracker
  useEffect(() => {
    setIsBottomNavVisible(true);
    setIsTopHeaderVisible(true);
    lastScrollTopRef.current = 0;
  }, [activeTab]);

  // Handle incoming ai_chat or message initialTab
  useEffect(() => {
    if ((initialTab === 'ai_chat' || initialTab === 'message') && location.modal !== 'chat') {
      openModal('chat');
    }
  }, [initialTab, location.modal, openModal]);

  // Clean lingering hashes or parameters on root / to guarantee fresh home view
  useEffect(() => {
    try {
      const path = window.location.pathname.toLowerCase();
      const hash = window.location.hash.toLowerCase();
      if (path === '/' || path === '') {
        if (
          hash === '#admin' ||
          hash === '#admin-portal' ||
          hash === '#signin' ||
          hash === '#signup' ||
          hash === '#login' ||
          hash === '#register'
        ) {
          window.history.replaceState(null, '', '/');
        }
      }
    } catch (_) {}
  }, []);

  // Scroll main container to top when changing tabs so the natural scrollable header is always visible at the start
  useEffect(() => {
    if (mainScrollContainerRef.current) {
      mainScrollContainerRef.current.scrollTo({ top: 0, behavior: 'auto' });
    }
  }, [activeTab]);

  const [previousTab, setPreviousTab] = useState<string>('home');
  const [authRedirectTarget, setAuthRedirectTarget] = useState<'profile' | 'track_selection' | 'registration_flow' | 'home'>('profile');
  const [registrationInitialTab, setRegistrationInitialTab] = useState<'seller' | 'service' | 'permanent' | 'find_job' | 'post_job' | 'blood_donor'>('find_job');
  const [registrationInitialPhone, setRegistrationInitialPhone] = useState<string>('');
  const [registrationIsEditMode, setRegistrationIsEditMode] = useState(false);
  const [editingUserTarget, setEditingUserTarget] = useState<any>(null);
  const [lang, setLang] = useState<Language>(() => {
    try {
      const saved = offlineStorage.getItem<string>('jhadimadi_language', 'bn');
      return (saved === 'en' || saved === 'bn') ? (saved as Language) : 'bn';
    } catch {
      return 'bn';
    }
  });

  useEffect(() => {
    try {
      offlineStorage.saveItem('jhadimadi_language', lang);
    } catch (e) {
      console.error(e);
    }
  }, [lang]);

  const t = getTranslation(lang);
  const [showToast, setShowToast] = useState('');

  // ক্যাটাগরি অনুভূমিক স্ক্রোলিং রেফারেন্স ও স্ট্যাটাস
  const categoryScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkCategoryScroll = () => {
    if (categoryScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoryScrollRef.current;
      setCanScrollLeft(scrollLeft > 6);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 6);
    }
  };

  const scrollCategories = (direction: 'left' | 'right') => {
    if (categoryScrollRef.current) {
      const offset = direction === 'left' ? -200 : 200;
      categoryScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
      setTimeout(checkCategoryScroll, 350);
    }
  };

  // পণ্য অনুভূমিক ক্যাটাগরি ফিল্টার স্ক্রোলিং রেফারেন্স ও স্ট্যাটাস
  const productFilterScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollFilterLeft, setCanScrollFilterLeft] = useState(false);
  const [canScrollFilterRight, setCanScrollFilterRight] = useState(true);

  const checkProductFilterScroll = () => {
    if (productFilterScrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = productFilterScrollRef.current;
      setCanScrollFilterLeft(scrollLeft > 6);
      setCanScrollFilterRight(scrollLeft < scrollWidth - clientWidth - 6);
    }
  };

  const scrollProductFilter = (direction: 'left' | 'right') => {
    if (productFilterScrollRef.current) {
      const offset = direction === 'left' ? -180 : 180;
      productFilterScrollRef.current.scrollBy({ left: offset, behavior: 'smooth' });
      setTimeout(checkProductFilterScroll, 350);
    }
  };

  // শপিং কার্ট ও প্রোডাক্ট স্টেট (Offline cached - starts clean with 0 items, strictly no fake counters)
  const [cartItems, setCartItems] = useState<CartItemType[]>(() => {
    try {
      const saved = offlineStorage.getItem<CartItemType[]>(OFFLINE_KEYS.CART, []);
      // Reset any legacy default preloaded fake seed items (e.g. initial 2 mock items)
      if (Array.isArray(saved)) {
        if (
          saved.length > 0 &&
          saved.some(i => !i?.product?.id || String(i?.product?.id).startsWith('prod_demo_') || i?.product?.id === 'prod_1')
        ) {
          offlineStorage.saveItem(OFFLINE_KEYS.CART, []);
          return [];
        }
        return saved;
      }
      return [];
    } catch {
      return [];
    }
  });
  const isCartModalOpen = location.modal === 'cart';
  const setIsCartModalOpen = useCallback((open: boolean) => {
    if (open) openModal('cart');
    else if (location.modal === 'cart') goBack();
  }, [location.modal, openModal, goBack]);

  const isGeminiModalOpen = location.modal === 'gemini';
  const setIsGeminiModalOpen = useCallback((open: boolean) => {
    if (open) openModal('gemini');
    else if (location.modal === 'gemini') goBack();
  }, [location.modal, openModal, goBack]);

  const isJhadimadiChatOpen = location.modal === 'chat';
  const handleOpenAiChat = useCallback(() => {
    if (location.modal === 'chat') return;
    openModal('chat');
  }, [location.modal, openModal]);

  const handleCloseAiChat = useCallback(() => {
    closeModal('chat');
  }, [closeModal]);

  const setIsJhadimadiChatOpen = useCallback((open: boolean) => {
    if (open) handleOpenAiChat();
    else handleCloseAiChat();
  }, [handleOpenAiChat, handleCloseAiChat]);

  // Listen for global open-jhadimadi-chat or open-jmessage events
  useEffect(() => {
    const handleJMessageEvent = () => {
      handleOpenAiChat();
    };
    window.addEventListener('open-jhadimadi-chat', handleJMessageEvent);
    window.addEventListener('open-jmessage', handleJMessageEvent);
    return () => {
      window.removeEventListener('open-jhadimadi-chat', handleJMessageEvent);
      window.removeEventListener('open-jmessage', handleJMessageEvent);
    };
  }, [handleOpenAiChat]);

  const [geminiModalTab, setGeminiModalTab] = useState<'chat' | 'nid'>('chat');
  const [localSelectedDetailProduct, setLocalSelectedDetailProduct] = useState<StoreProduct | null>(null);
  const selectedDetailProduct = location.product || localSelectedDetailProduct;
  const setSelectedDetailProduct = setLocalSelectedDetailProduct;

  // Real unread notifications state (strictly 0 by default, no fake counts or mock badges)
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState<number>(0);
  const [notificationsList, setNotificationsList] = useState<Array<{ id: string; title: string; body: string; created_at: string; is_read: boolean }>>([]);
  const isNotificationModalOpen = location.modal === 'notifications';
  const setIsNotificationModalOpen = useCallback((open: boolean) => {
    if (open) openModal('notifications');
    else if (location.modal === 'notifications') goBack();
  }, [location.modal, openModal, goBack]);

  // Fetch real unread notifications from Supabase (defaults strictly to 0, no fake counter)
  useEffect(() => {
    let isMounted = true;
    const loadUnreadNotifications = async () => {
      if (!isSupabaseConfigured || !currentUser?.id) {
        if (isMounted) {
          setUnreadNotificationsCount(0);
          setNotificationsList([]);
        }
        return;
      }
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('id, title, body, created_at, is_read')
          .eq('user_id', currentUser.id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (!error && Array.isArray(data) && isMounted) {
          setNotificationsList(data);
          const unread = data.filter((item: any) => !item.is_read).length;
          setUnreadNotificationsCount(unread);
          return;
        }

        // Fallback to backend /api/notifications
        try {
          const apiRes = await fetch(`/api/notifications?userId=${encodeURIComponent(currentUser.id)}`);
          if (apiRes.ok) {
            const resData = await apiRes.json();
            if (resData.success && Array.isArray(resData.notifications) && isMounted) {
              setNotificationsList(resData.notifications);
              setUnreadNotificationsCount(resData.notifications.filter((n: any) => !n.is_read).length);
              return;
            }
          }
        } catch {}

        if (isMounted) {
          setUnreadNotificationsCount(0);
        }
      } catch {
        if (isMounted) setUnreadNotificationsCount(0);
      }
    };

    loadUnreadNotifications();
    return () => { isMounted = false; };
  }, [currentUser?.id]);

  // Official JHADIMADI.COM WhatsApp Integration & Live Message Sync
  const OFFICIAL_WHATSAPP_NUMBER = '8801870592699';
  const [whatsappUnreadCount, setWhatsappUnreadCount] = useState<number>(0);

  useEffect(() => {
    if (!currentUser?.id && !currentUser?.phone) {
      setWhatsappUnreadCount(0);
      return;
    }

    let isMounted = true;
    const syncWhatsAppStatus = async () => {
      if (typeof document !== 'undefined' && document.visibilityState !== 'visible') {
        return;
      }
      try {
        const queryParams = new URLSearchParams();
        if (currentUser?.id) queryParams.append('userId', currentUser.id);
        if (currentUser?.phone) queryParams.append('phone', currentUser.phone);

        const res = await fetch(`/api/whatsapp/sync?${queryParams.toString()}`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted && data?.success) {
            setWhatsappUnreadCount(Number(data.unreadCount || 0));
          }
        }
      } catch {
        // Fallback gracefully
      }
    };

    syncWhatsAppStatus();
    const interval = setInterval(syncWhatsAppStatus, 60000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [currentUser?.id, currentUser?.phone]);

  const handleOpenWhatsAppChat = () => {
    const message = lang === 'bn'
      ? 'আসসালামু আলাইকুম / নমস্কার। ঝাদিমাদি ডটকম (JHADIMADI.COM)-এর সেবা ও অর্ডার বিষয়ে যোগাযোগ করছি।'
      : 'Hello! I am contacting JHADIMADI.COM for support, services, and order inquiries.';
    const url = `https://wa.me/${OFFICIAL_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');

    // Clear unread count on opening chat
    setWhatsappUnreadCount(0);
  };

  // In-App Single Page Product Details Handler with SPA History Stack
  const handleOpenProductDetails = (product: StoreProduct) => {
    setSelectedDetailProduct(product);
    setPreviousTab(activeTab === 'product_details' ? 'home' : activeTab);
    navigateToProduct(product);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Convert StoreProduct to Rich ProductDetailItem for In-App View
  const formattedDetailProduct: ProductDetailItem | null = useMemo(() => {
    if (!selectedDetailProduct) return null;
    const p = selectedDetailProduct;
    return {
      id: p.id,
      code: p.code || p.sku || `JDM-${p.id.slice(0, 6).toUpperCase()}`,
      sku: p.sku || p.code || `JDM-${p.id.slice(0, 6).toUpperCase()}`,
      name: lang === 'bn' ? (p.title_bn || p.nameBn) : (p.title_en || p.nameEn || p.title_bn || p.nameBn),
      nameBn: p.title_bn || p.nameBn,
      nameEn: p.title_en || p.nameEn,
      title_bn: p.title_bn || p.nameBn,
      title_en: p.title_en || p.nameEn,
      category: p.category,
      categoryLabelBn: p.categoryLabelBn,
      pricePerUnit: p.price,
      discount_price: p.discount_price,
      discountPrice: p.discount_price,
      originalPrice: p.originalPrice || (p.discount_price ? p.price : undefined),
      unit: p.unit_pack || p.unit || '১ একক',
      unit_pack: p.unit_pack || p.unit || '১ একক',
      stockQuantity: p.stock_quantity ?? p.stock ?? 45,
      stock_quantity: p.stock_quantity ?? p.stock ?? 45,
      minOrderQuantity: 1,
      originLocation: p.origin || p.production_origin || (p as any).productionOrigin || 'পার্বত্য চট্টগ্রাম',
      origin: p.origin || p.production_origin || (p as any).productionOrigin || 'পার্বত্য চট্টগ্রাম',
      production_origin: p.origin || p.production_origin || (p as any).productionOrigin || 'পার্বত্য চট্টগ্রাম',
      qualityGrade: p.quality_standard || (p as any).qualityStandards || '১০০% খাঁটি ও পরীক্ষিত',
      quality_standard: p.quality_standard || (p as any).qualityStandards || '১০০% খাঁটি ও পরীক্ষিত',
      seller_info: p.seller_info,
      badges: Array.isArray(p.badges) && p.badges.length > 0 ? p.badges : (p.badge ? [p.badge] : []),
      badge: p.badge || (Array.isArray(p.badges) && p.badges.length > 0 ? p.badges[0] : undefined),
      key_highlights: Array.isArray(p.key_highlights) && p.key_highlights.length > 0 ? p.key_highlights : (Array.isArray(p.features) ? p.features : []),
      how_it_is_produced: p.how_it_is_produced || (p as any).productionMethod,
      productionMethod: p.how_it_is_produced || (p as any).productionMethod,
      materials_and_ingredients: p.materials_and_ingredients || (p as any).materials,
      materials: p.materials_and_ingredients || (p as any).materials,
      usage_and_storage: p.usage_and_storage || (p as any).usageInstructions,
      usageInstructions: p.usage_and_storage || (p as any).usageInstructions,
      youtubeUrl: (p as any).youtubeUrl || p.videoUrl || undefined,
      videoUrl: p.videoUrl || (p as any).youtubeUrl || undefined,
      qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=JHADIMADI-VERIFIED-${encodeURIComponent(p.id)}-${encodeURIComponent(p.title_bn || p.nameBn)}`,
      image: p.image,
      images: (() => {
        const list: string[] = [];
        if (p.image && typeof p.image === 'string' && p.image.trim()) {
          list.push(p.image.trim());
        }
        const extraImages = (p as any).galleryImages && Array.isArray((p as any).galleryImages)
          ? (p as any).galleryImages
          : (Array.isArray(p.images) ? p.images : []);
        for (const img of extraImages) {
          if (typeof img === 'string' && img.trim() && !list.includes(img.trim())) {
            list.push(img.trim());
          }
        }
        return list.filter((img: string) => {
          const lower = img.toLowerCase();
          return (
            !lower.includes('demo-image') &&
            !lower.includes('demo_image') &&
            !lower.includes('placeholder') &&
            !lower.includes('dummy') &&
            !lower.includes('fallback') &&
            !img.includes('photo-1586201375761') &&
            !img.includes('photo-1596040033229')
          );
        });
      })(),
      description: lang === 'bn' 
        ? (p.descriptionBn || p.description || `${p.title_bn || p.nameBn} - সম্পূর্ণ নির্ভেজাল ও প্রাকৃতিক উপায়ে উৎপাদিত খাঁটি স্থানীয় পণ্য।`)
        : (p.descriptionEn || p.description || `${p.title_en || p.nameEn || p.nameBn} - 100% natural, chemical-free authentic premium local product.`),
      benefits: Array.isArray(p.key_highlights) && p.key_highlights.length > 0
        ? p.key_highlights
        : ((p as any).features || []),
      seller: (p as any).isRealVerifiedSeller ? {
        name: (p as any).sellerName || p.seller_info,
        avatar: (p as any).sellerAvatar,
        phoneHidden: (p as any).sellerPhoneMasked,
        realPhone: (p as any).sellerPhone,
        isNidVerified: (p as any).verifiedSeller ?? true,
        rating: p.rating || 5.0,
        reviewsCount: p.reviewsCount || 1,
        location: p.origin || '',
        uniqueId: (p as any).sellerUniqueId
      } : undefined
    };
  }, [selectedDetailProduct, lang]);
  const [vendorStores, setVendorStores] = useState<VendorStore[]>(() => {
    const raw = offlineStorage.getItem<VendorStore[]>('jhadimadi_vendor_stores', []);
    if (Array.isArray(raw)) {
      return raw.filter(
        (s) =>
          s &&
          s.id &&
          !s.id.startsWith('vendor_khg_') &&
          !s.id.startsWith('vendor_rng_') &&
          !s.id.startsWith('vendor_bnd_') &&
          !s.id.startsWith('vendor_ctg_') &&
          !s.id.startsWith('vendor_demo_')
      );
    }
    return [];
  });

  // অনুমোদিত মার্চেন্ট ও সেলার স্টোরফ্রন্ট (KYC ও ইউজার মোডারেশন থেকে রিয়েলটাইম সিঙ্ক)
  const activeVendorStores = useMemo(() => {
    const dynamicSellerStores: VendorStore[] = users
      .filter(u => u.role === 'seller' && u.status === 'Approved')
      .map(u => ({
        id: String(u.id),
        uniqueId: u.tradeLicense ? `V-${u.tradeLicense.slice(-4)}` : `V-${String(u.id).slice(-4)}`,
        shopName: u.name,
        shopNameEn: u.name,
        ownerName: u.name,
        avatar: u.avatar || 'https://images.unsplash.com/photo-1587049352847-4a222e784d38?w=150',
        banner: 'https://images.unsplash.com/photo-1610832958506-aa56368176cf?w=600',
        phoneMasked: u.phone ? `${u.phone.slice(0, 4)}****${u.phone.slice(-3)}` : '018****-***11',
        realPhone: u.phone || '01800000000',
        division: 'চট্টগ্রাম',
        district: u.district || 'খাগড়াছড়ি',
        upazila: u.upazila || 'সদর',
        mahalla: u.upazila || 'সদর',
        bazarName: 'সদর বাজার',
        detailedAddress: `${u.upazila || 'সদর'}, ${u.district || 'খাগড়াছড়ি'}`,
        rating: 0,
        reviewsCount: 0,
        positiveRatingPercent: 100,
        shipOnTimePercent: 100,
        responseRatePercent: 100,
        followersCount: 0,
        isVerified: true,
        verifiedBadgeText: 'ঝাডিমাটি ভেরিফাইড মার্চেন্ট',
        categories: ['কৃষি ও অর্গানিক', 'পাহাড়ি স্পেশাল'],
        aboutBn: `${u.name} এর নিজস্ব ভেরিফাইড পাহাড়ি স্টোরফ্রন্ট।`,
        tradeLicenseNumber: u.tradeLicense || 'TRD-2026-9901',
        nidNumberMasked: '1990********45',
        establishedYear: '২০২৩',
        wallet: {
          grossSales: 0,
          totalCommissionPaid: 0,
          availableBalance: 0,
          pendingEscrowBalance: 0,
          cashouts: [],
          escrowSettlements: []
        },
        products: []
      }));

    const dynamicIds = new Set(dynamicSellerStores.map(s => s.id));
    const baseStores = vendorStores.filter(v => !dynamicIds.has(v.id));
    return [...dynamicSellerStores, ...baseStores];
  }, [users, vendorStores]);

  const selectedVendorStore = (location.modal === 'vendor_store' ? location.vendor : null) as VendorStore | null;
  const setSelectedVendorStore = useCallback((vendor: VendorStore | null) => {
    if (vendor) openModal('vendor_store', vendor);
    else if (location.modal === 'vendor_store') goBack();
  }, [location.modal, openModal, goBack]);

  const [activeProductFilter, setActiveProductFilter] = useState<string>('all');
  const [selectedTopCategoryId, setSelectedTopCategoryId] = useState<string | null>(null);
  // ১. হোমপেজ গ্লোবাল সার্চ স্টেট (সারা দেশের পণ্য, সেবা, ব্লাড ডোনার সার্বজনীন সার্চ)
  const [homepageSearchQuery, setHomepageSearchQuery] = useState('');
  const [supabaseGlobalResults, setSupabaseGlobalResults] = useState<GlobalSearchResponse | null>(null);
  const [isSupabaseSearching, setIsSupabaseSearching] = useState<boolean>(false);

  // লাইভ ইউনিভার্সাল সুপাবেস কুয়েরি ইঞ্জিন (Homepage Search Bar connected to products, service_providers, blood_donors, job_circulars, job_seekers)
  useEffect(() => {
    const trimmed = homepageSearchQuery.trim();
    if (!trimmed) {
      setSupabaseGlobalResults(null);
      setIsSupabaseSearching(false);
      return;
    }

    let isCurrent = true;
    setIsSupabaseSearching(true);
    const debounceTimer = setTimeout(async () => {
      try {
        const resp = await databaseService.globalSearch(trimmed, { limit: 16 });
        if (isCurrent) {
          setSupabaseGlobalResults(resp);
          setIsSupabaseSearching(false);
        }
      } catch (e) {
        if (isCurrent) {
          setIsSupabaseSearching(false);
        }
      }
    }, 220);

    return () => {
      isCurrent = false;
      clearTimeout(debounceTimer);
    };
  }, [homepageSearchQuery]);
  const selectedWorkerProfile = (location.modal === 'worker_profile' ? location.worker : null) as ServiceProvider | null;
  const setSelectedWorkerProfile = useCallback((worker: ServiceProvider | null) => {
    if (worker) openModal('worker_profile', worker);
    else if (location.modal === 'worker_profile') goBack();
  }, [location.modal, openModal, goBack]);

  const handleOpenVendorStore = (vendorOrUniqueId: string | VendorStore) => {
    if (typeof vendorOrUniqueId === 'string') {
      const found = activeVendorStores.find(v => v.id === vendorOrUniqueId || v.uniqueId === vendorOrUniqueId) ||
                    vendorStores.find(v => v.id === vendorOrUniqueId || v.uniqueId === vendorOrUniqueId);
      if (found) {
        setSelectedVendorStore(found);
      } else {
        setSelectedVendorStore(activeVendorStores[0] || vendorStores[0]);
      }
    } else {
      setSelectedVendorStore(vendorOrUniqueId);
    }
  };

  // Helper to convert RegisteredProfessional to ServiceProvider for modal
  const openProfessionalPortfolioModal = (pro: RegisteredProfessional) => {
    const providerObj: ServiceProvider = {
      id: String(pro.id || 'pro_' + Date.now()),
      name: pro.name,
      fatherName: pro.fatherName,
      motherName: pro.motherName,
      dateOfBirth: pro.dateOfBirth,
      gender: pro.gender,
      professionalHeadline: pro.professionalHeadline || pro.job,
      categoryBn: pro.job,
      subCategory: pro.job,
      categoryEn: pro.categoryGroup || 'Services',
      rating: pro.rating || 4.9,
      reviewsCount: 18,
      jobsCompleted: pro.completedJobs || 24,
      experienceYears: parseInt(pro.experience || '5', 10) || 5,
      hourlyRate: parseInt(pro.rateAmount || '800', 10) || 800,
      dailyRate: parseInt(pro.rateAmount || '800', 10) || 800,
      rateType: pro.rateType || 'দৈনিক',
      rateAmount: pro.rateAmount || '৮০০',
      district: (pro.district as any) || 'খাগড়াছড়ি',
      upazila: pro.upazila,
      mahalla: pro.area,
      detailedAddress: pro.fullAddress || `${pro.area}, ${pro.upazila}, ${pro.district}`,
      avatar: pro.img || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=200',
      isAvailable: true,
      distanceKm: 1.5,
      blueTickActive: pro.verified ?? true,
      nidVerified: pro.verified ?? true,
      nidNumber: pro.nid || '19951234567890123',
      nidFrontUrl: pro.nidFrontUrl,
      nidBackUrl: pro.nidBackUrl,
      maskedPhone: '018****' + pro.phone.slice(-4),
      realPhone: pro.phone,
      bioBn: pro.bio || 'দক্ষ ও অভিজ্ঞ প্রফেশনাল হিসেবে সততা ও দায়িত্বশীলতার সাথে অন-ডিমান্ড সেবা প্রদান করি।',
      skills: pro.selectedSkillsList || [pro.job, 'সার্ভিস মেইনটেন্যান্স'],
      selectedSkillsList: pro.selectedSkillsList,
      coverageRadiusKm: pro.serviceRadiusKm || 15,
      coveredAreas: pro.coveredAreas || [pro.area, pro.upazila, pro.district],
      uniqueId: pro.uniqueId || `S-${pro.district ? pro.district.substring(0, 3).toUpperCase() : 'KHG'}-001`,
      portfolioItems: pro.portfolioItems,
      certificatesList: pro.certificatesList,
      educations: pro.educations,
      employments: pro.employments,
      otherExperiences: pro.otherExperiences,
      verificationFeePaid: pro.verificationFeePaid ?? true
    };
    setSelectedWorkerProfile(providerObj);
  };

  // Universal Digital Profile Page opener for Jhadimadi AI, Member list & Service Providers
  const handleOpenDigitalProfile = (person: any) => {
    if (!person) return;
    setIsJhadimadiChatOpen(false);

    const providerObj: ServiceProvider = {
      id: String(person.id || 'pro_' + Date.now()),
      name: person.name || 'পেশাজীবী ও সদস্য',
      fatherName: person.fatherName,
      motherName: person.motherName,
      dateOfBirth: person.dateOfBirth,
      gender: person.gender,
      profession: person.bloodGroup 
        ? `জরুরি রক্তদাতা (${person.bloodGroup})` 
        : (person.profession || person.job || person.roleLabelBn || 'ঝাদিমাদি প্রতিনিধি'),
      bloodGroup: person.bloodGroup || undefined,
      professionalHeadline: person.bloodGroup
        ? `জরুরি স্বেচ্ছাসেবী রক্তদাতা • ব্লাড গ্রুপ: ${person.bloodGroup} • ${person.lastDonationDate ? 'শেষ রক্তদান: ' + person.lastDonationDate : 'রক্তদানের জন্য প্রস্তুত'}`
        : (person.professionalHeadline || person.profession || person.roleLabelBn || person.subCategory || 'ঝাদিমাদি ভেরিফাইড সদস্য ও প্রোভাইডার'),
      categoryBn: person.bloodGroup ? 'রক্তদান সেবা' : (person.categoryBn || person.profession || person.roleLabelBn || 'সেবা ও প্রতিনিধি'),
      subCategory: person.bloodGroup ? `গ্রুপ ${person.bloodGroup}` : (person.subCategory || person.profession || person.responsibilities || 'অন-ডিমান্ড সেবা'),
      categoryEn: person.categoryEn || 'Services',
      rating: person.rating || 4.9,
      reviewsCount: person.completedJobs || 18,
      jobsCompleted: person.completedJobs || 24,
      experienceYears: parseInt(person.experienceYears || person.experience || '5', 10) || 5,
      hourlyRate: parseInt(person.hourlyRate || person.rateAmount || '350', 10) || 350,
      dailyRate: parseInt(person.dailyRate || (person.hourlyRate ? person.hourlyRate * 8 : '1200'), 10) || 1200,
      rateType: person.rateType || 'ঘণ্টা / কাজ ভিত্তিক',
      rateAmount: String(person.hourlyRate || person.rateAmount || '৩৫০'),
      district: (person.district as any) || 'খাগড়াছড়ি',
      upazila: person.upazila || 'সদর',
      mahalla: person.area || person.mahalla || '',
      detailedAddress: person.detailedAddress || `${person.area ? person.area + ', ' : ''}${person.upazila || ''}, ${person.district || ''}`,
      avatar: person.avatar || person.img || `https://ui-avatars.com/api/?name=${encodeURIComponent(person.name || 'Member')}&background=009f4d&color=fff`,
      isAvailable: person.availability ?? true,
      distanceKm: 1.5,
      blueTickActive: person.verificationStatus === 'verified' || person.status === 'সক্রিয় সদস্য' || true,
      nidVerified: true,
      nidNumber: person.nidNumber || '19951234567890123',
      maskedPhone: person.phone ? '018****' + person.phone.slice(-4) : '018****2699',
      realPhone: person.phone || '01870592699',
      bioBn: person.bioBn || person.responsibilities || `${person.name} ঝাদিমাদি প্ল্যাটফর্মের ভেরিফাইড সদস্য। সততা ও দক্ষতার সাথে স্থানীয় গ্রাহকদের প্রয়োজনীয় সেবা ও তথ্য প্রদান করে থাকেন।`,
      skills: person.skills || [person.profession || person.roleLabelBn || 'সেবা', 'কমিউনিটি সহায়তা', 'ঝাদিমাদি ভেরিফাইড'],
      selectedSkillsList: person.skills,
      coverageRadiusKm: 15,
      coveredAreas: [person.area, person.upazila, person.district].filter(Boolean),
      uniqueId: person.districtUniqueId || person.uniqueId || `JHD-${person.district ? person.district.substring(0, 3).toUpperCase() : 'KHG'}-001`,
      verificationFeePaid: true
    };
    setSelectedWorkerProfile(providerObj);
  };

  // Save changes to localStorage on updates
  useEffect(() => {
    offlineStorage.saveItem(OFFLINE_KEYS.CART, cartItems);
  }, [cartItems]);

  // ফিল্টার স্টেট (সার্ভিস, পণ্য ও ব্লাড ডোনার)
  const [searchMode, setSearchMode] = useState<'services' | 'products' | 'blood'>('services');
  const [selectedServiceCategoryFilter, setSelectedServiceCategoryFilter] = useState<string>('all');
  const isSourceModalOpen = location.modal === 'source';
  const setIsSourceModalOpen = useCallback((open: boolean) => {
    if (open) openModal('source');
    else if (location.modal === 'source') goBack();
  }, [location.modal, openModal, goBack]);
  const activeVoiceRecognitionRef = useRef<any>(null);
  // ২. নেভিগেশন সার্চ স্টেট (নির্দিষ্ট এলাকা, জেলা, উপজেলা এবং ক্যাটাগরি ভিত্তিক রিজিওনাল সার্চ)
  const [navSearchQuery, setNavSearchQuery] = useState('');
  const [selectedCategoryJob, setSelectedCategoryJob] = useState('');
  const [selectedBloodGroup, setSelectedBloodGroup] = useState('');
  const [selectedDistrict, setSelectedDistrict] = useState('খাগড়াছড়ি');
  const [selectedUpazila, setSelectedUpazila] = useState('');
  const [selectedArea, setSelectedArea] = useState('');
  const [selectedPoliceCategory, setSelectedPoliceCategory] = useState<string>('all');
  const [selectedAmbulanceType, setSelectedAmbulanceType] = useState<string>('all');
  const [ambulanceIcuOnly, setAmbulanceIcuOnly] = useState<boolean>(false);
  const [ambulanceOxygenOnly, setAmbulanceOxygenOnly] = useState<boolean>(false);
  const [selectedHelplineCategory, setSelectedHelplineCategory] = useState<string>('all');
  const [hasSearched, setHasSearched] = useState(false);
  const [showSearchSuggestions, setShowSearchSuggestions] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // ব্লাড সার্চ অথেন্টিকেশন গার্ড স্টেট (Sign In & Quick Register)
  const isBloodAuthModalOpen = location.modal === 'blood_auth';
  const setIsBloodAuthModalOpen = useCallback((open: boolean) => {
    if (open) openModal('blood_auth');
    else if (location.modal === 'blood_auth') goBack();
  }, [location.modal, openModal, goBack]);
  const [bloodAuthInitialMode, setBloodAuthInitialMode] = useState<'signin' | 'quick_register'>('signin');

  const handleOpenBloodSearch = (targetMode: 'signin' | 'quick_register' = 'signin') => {
    setSearchMode('blood');
    setSelectedCategoryJob('');
    setNavSearchQuery('');
    setHasSearched(true);
    if (!currentUser) {
      setBloodAuthInitialMode(targetMode);
      setIsBloodAuthModalOpen(true);
    }
  };

  // সাজেস্ট বক্সের বাইরে ক্লিক করলে ড্রপডাউন বন্ধ করা
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowSearchSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ১,০০০টি পেশার লাইভ তালিকা (৬টি মূল ক্যাটাগরি অনুযায়ী ম্যাপড)
  const masterProfessionsList = useMemo(() => {
    return ALL_1000_PROFESSIONS_FLAT_LIST;
  }, []);

  // পণ্য ও স্টোর ক্যাটালগ আইটেম তালিকা (অটো-সাজেশনের জন্য)
  const masterProductsList = useMemo(() => {
    const list: { name: string; category?: string; subCategory?: string; categoryEn?: string }[] = [];
    const seen = new Set<string>();

    allProducts.forEach(p => {
      if (p.nameBn && !seen.has(p.nameBn.trim().toLowerCase())) {
        seen.add(p.nameBn.trim().toLowerCase());
        list.push({ name: p.nameBn.trim(), category: p.categoryLabelBn || p.origin });
      }
      if (p.nameEn && !seen.has(p.nameEn.trim().toLowerCase())) {
        seen.add(p.nameEn.trim().toLowerCase());
        list.push({ name: p.nameEn.trim(), category: p.categoryLabelBn || p.origin });
      }
    });

    CATEGORIES_CATALOG.forEach(c => {
      if (c.name && !seen.has(c.name.trim().toLowerCase())) {
        seen.add(c.name.trim().toLowerCase());
        list.push({ name: c.name.trim(), category: 'ক্যাটাগরি' });
      }
    });

    return list;
  }, [allProducts]);

  // সার্চ মোড অনুযায়ী ফিল্টার করা সাজেশন (১,০০০ পেশা ও পণ্যের সম্পূর্ণ ডাইনামিক লাইভ তালিকা)
  const activeSearchSuggestions = useMemo((): { name: string; category?: string; subCategory?: string; categoryEn?: string }[] => {
    const q = navSearchQuery.trim().toLowerCase();

    if (searchMode === 'services') {
      const list = masterProfessionsList;
      if (!q) {
        // সম্পূর্ণ ১,০০০ পেশার ডাইনামিক তালিকা সরাসরি ড্রপডাউনে
        return list;
      }
      return list.filter(item => 
        item.name.toLowerCase().includes(q) || 
        (item.category && item.category.toLowerCase().includes(q)) ||
        (item.subCategory && item.subCategory.toLowerCase().includes(q)) ||
        (item.categoryEn && item.categoryEn.toLowerCase().includes(q))
      );
    }

    if (searchMode === 'products') {
      const list = masterProductsList;
      if (!q) {
        return list;
      }
      return list.filter(item => 
        item.name.toLowerCase().includes(q) || 
        (item.category && item.category.toLowerCase().includes(q))
      );
    }

    return [];
  }, [navSearchQuery, searchMode, masterProfessionsList, masterProductsList]);

  // সেলার ইউজারদের নিজস্ব আপলোডকৃত পণ্যসমূহ
  const userSellerProducts = useMemo(() => {
    return allProducts.filter(p => p.id.startsWith('prod_seller_') || p.badge === 'নতুন বিক্রেতা');
  }, [allProducts]);

  // মোট কার্ট আইটেম সংখ্যা
  const totalCartCount = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.quantity, 0);
  }, [cartItems]);

  // ফিল্টার করা ৪৮+ প্রোডাক্ট তালিকা (লাইভ অল প্রোডাক্টস থেকে)
  const filteredProducts = useMemo(() => {
    const baseList = allProducts.filter(p => {
      // Visibility Rule: Vendor-posted exclusive products will never appear on global homepage
      if ((p as any).isVendorExclusive || (p as any).sellerOnly || (p as any).isExclusiveToVendor) {
        return false;
      }

      // ১. টপ ক্যাটাগরি বার ফিল্টার
      let matchesTopCategory = true;
      if (selectedTopCategoryId) {
        const catObj = ESSENTIAL_15_CATEGORIES.find(c => c.id === selectedTopCategoryId);
        if (catObj) {
          matchesTopCategory = 
            p.category === catObj.categoryFilterKey || 
            (Boolean(p.categoryLabelBn) && (
              p.categoryLabelBn!.toLowerCase().includes(catObj.nameBn.toLowerCase()) ||
              catObj.nameBn.toLowerCase().includes(p.categoryLabelBn!.toLowerCase())
            )) ||
            catObj.keywords.some(kw => 
              (p.nameBn && p.nameBn.toLowerCase().includes(kw.toLowerCase())) || 
              (p.nameEn && p.nameEn.toLowerCase().includes(kw.toLowerCase())) || 
              (p.categoryLabelBn && p.categoryLabelBn.toLowerCase().includes(kw.toLowerCase())) ||
              (p.descriptionBn && p.descriptionBn.toLowerCase().includes(kw.toLowerCase()))
            );
        }
      }

      // ২. সাব-ফিল্টার চিপস (হোমপেজ ক্যাটাগরি মেনু বার - ১৬টি সুনির্দিষ্ট ক্যাটাগরি)
      let matchesSubFilter = true;
      if (activeProductFilter && activeProductFilter !== 'all') {
        const tab = PRODUCT_FILTER_TABS.find(t => t.key === activeProductFilter);
        if (tab) {
          const filterKey = tab.categoryFilterKey;
          
          // ক্যাটাগরি কোড সরাসরি ম্যাচ
          const matchesCategoryCode = 
            p.category === filterKey || 
            (p.category && p.category.toLowerCase() === filterKey.toLowerCase()) ||
            (p.category && p.category.toLowerCase() === tab.key.toLowerCase());

          // বাংলা ক্যাটাগরি লেবেল ম্যাচ (যেমন এডমিন ড্রপডাউন থেকে সংরক্ষিত লেবেল)
          const matchesCategoryLabel = Boolean(
            p.categoryLabelBn && (
              p.categoryLabelBn.toLowerCase().includes(tab.nameBn.toLowerCase()) ||
              tab.nameBn.toLowerCase().includes(p.categoryLabelBn.toLowerCase())
            )
          );

          // বিশেষ ক্যাটাগরি ক্রস-কম্প্যাটিবিলিটি (ডাটাবেস ও এডমিন ক্যাটাগরি সিঙ্ক)
          let matchesCrossCompat = false;
          if (filterKey === 'Food') {
            matchesCrossCompat = 
              p.category === 'SpicesGrains' || 
              p.category === 'ShutkiSidol' ||
              Boolean(p.categoryLabelBn && (p.categoryLabelBn.includes('ফুড') || p.categoryLabelBn.includes('খাবার') || p.categoryLabelBn.includes('ভোজ্য') || p.categoryLabelBn.includes('চাল') || p.categoryLabelBn.includes('মসলা') || p.categoryLabelBn.includes('শস্য')));
          } else if (filterKey === 'Agri') {
            matchesCrossCompat = 
              p.category === 'Jhum' ||
              Boolean(p.categoryLabelBn && (p.categoryLabelBn.includes('কৃষি') || p.categoryLabelBn.includes('পাহাড়ি শিল্প') || p.categoryLabelBn.includes('জুম')));
          } else if (filterKey === 'Crafts') {
            matchesCrossCompat = 
              p.category === 'CraftsHoney' ||
              Boolean(p.categoryLabelBn && (p.categoryLabelBn.includes('হস্তশিল্প') || p.categoryLabelBn.includes('হস্ত শিল্প') || p.categoryLabelBn.includes('তাঁত')));
          } else if (filterKey === 'Clothing') {
            matchesCrossCompat = 
              Boolean(p.categoryLabelBn && (p.categoryLabelBn.includes('পোশাক') || p.categoryLabelBn.includes('ড্রেস') || p.categoryLabelBn.includes('ফ্যাশন')));
          } else if (filterKey === 'Jewelry') {
            matchesCrossCompat = 
              Boolean(p.categoryLabelBn && (p.categoryLabelBn.includes('গহনা') || p.categoryLabelBn.includes('অলংকার') || p.categoryLabelBn.includes('অর্নামেন্টস')));
          } else if (filterKey === 'HealthBeauty') {
            matchesCrossCompat = 
              p.category === 'Health' ||
              p.category === 'Cosmetics' ||
              p.category === 'Medicines' ||
              p.category === 'Herbal' ||
              Boolean(p.categoryLabelBn && (p.categoryLabelBn.includes('স্বাস্থ্য') || p.categoryLabelBn.includes('রূপচর্চা') || p.categoryLabelBn.includes('প্রসাধনী') || p.categoryLabelBn.includes('ভেষজ') || p.categoryLabelBn.includes('ঔষধ')));
          } else if (filterKey === 'VetAnimalCare') {
            matchesCrossCompat = 
              p.category === 'Livestock' ||
              Boolean(p.categoryLabelBn && (p.categoryLabelBn.includes('পশুপাখি') || p.categoryLabelBn.includes('পশু') || p.categoryLabelBn.includes('পাখি') || p.categoryLabelBn.includes('চিকিৎসা')));
          } else if (filterKey === 'HotelRestaurant') {
            matchesCrossCompat = 
              Boolean(p.categoryLabelBn && (p.categoryLabelBn.includes('হোটেল') || p.categoryLabelBn.includes('রেস্টুরেন্ট')));
          } else if (filterKey === 'HouseRent') {
            matchesCrossCompat = 
              Boolean(p.categoryLabelBn && (p.categoryLabelBn.includes('বাসা ভাড়া') || p.categoryLabelBn.includes('ভাড়া')));
          } else if (filterKey === 'Services') {
            matchesCrossCompat = 
              Boolean(p.categoryLabelBn && (p.categoryLabelBn.includes('পেশাদার সেবা') || p.categoryLabelBn.includes('সেবা')));
          } else if (filterKey === 'RealEstate') {
            matchesCrossCompat = 
              Boolean(p.categoryLabelBn && (p.categoryLabelBn.includes('রিয়েল এস্টেট') || p.categoryLabelBn.includes('রিয়েল এস্টেট')));
          }

          // কিওয়ার্ড দিয়ে পণ্যের নাম, বর্ণনা ও ব্যাজের সাথে মেলানো
          const matchesKeyword = Boolean(
            tab.keywords && tab.keywords.length > 0 && tab.keywords.some(kw => {
              const kwLower = kw.toLowerCase();
              return (
                (p.nameBn && p.nameBn.toLowerCase().includes(kwLower)) || 
                (p.nameEn && p.nameEn.toLowerCase().includes(kwLower)) || 
                (p.categoryLabelBn && p.categoryLabelBn.toLowerCase().includes(kwLower)) ||
                (p.descriptionBn && p.descriptionBn.toLowerCase().includes(kwLower)) ||
                (p.badge && p.badge.toLowerCase().includes(kwLower))
              );
            })
          );

          matchesSubFilter = matchesCategoryCode || matchesCategoryLabel || matchesCrossCompat || matchesKeyword;
        } else {
          matchesSubFilter = p.category === activeProductFilter;
        }
      }

      // ৩. সার্চ টার্ম ফিল্টার (হোমপেজ গ্লোবাল সার্চ)
      const matchesSearch = !homepageSearchQuery || matchesProductSearch(p, homepageSearchQuery);

      // সার্চ টার্ম থাকলে ক্যাটাগরি লক সরিয়ে সকল পণ্য থেকে সরাসরি ফিল্টার হবে
      const finalMatchesTop = !homepageSearchQuery.trim() ? matchesTopCategory : true;
      const finalMatchesSub = !homepageSearchQuery.trim() ? matchesSubFilter : true;

      return finalMatchesTop && finalMatchesSub && matchesSearch;
    });

    // সুপাবেস ডাটাবেজ থেকে লাইভ সার্চে প্রাপ্ত নতুন পাহাড়ি পণ্য মার্জ
    if (homepageSearchQuery.trim()) {
      const liveProducts = [
        ...(supabaseGlobalResults?.products || []),
        ...((supabaseGlobalResults?.items || []).filter((item: any) => item.type === 'product').map((item: any) => item.raw || item))
      ];

      liveProducts.forEach((sp: any) => {
        if (!sp) return;
        const spId = String(sp.id || '');
        const spNameBn = sp.nameBn || sp.name_bn || sp.title_bn || sp.title || sp.name || 'পাহাড়ি পণ্য';
        const alreadyExists = baseList.some(p => String(p.id) === spId || p.nameBn === spNameBn);
        if (!alreadyExists) {
          baseList.unshift({
            id: spId,
            nameBn: spNameBn,
            nameEn: sp.nameEn || sp.name_en || sp.title_en || '',
            category: sp.category || 'Agri',
            categoryLabelBn: sp.categoryLabelBn || sp.category_label_bn || 'পাহাড়ি খাঁটি পণ্য',
            price: Number(sp.price || 0),
            originalPrice: Number(sp.originalPrice || sp.original_price || sp.price || 0),
            unit: sp.unit || 'কেজি',
            origin: sp.origin || sp.district || 'রাঙ্গামাটি',
            productionOrigin: sp.productionOrigin || sp.production_origin || sp.upazila || '',
            image: sp.image || sp.imageUrl || sp.image_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500',
            rating: Number(sp.rating || 5),
            reviewsCount: Number(sp.reviewsCount || sp.reviews_count || 12),
            stock: Number(sp.stock ?? 50),
            descriptionBn: sp.descriptionBn || sp.description_bn || sp.description || '',
            descriptionEn: sp.descriptionEn || sp.description_en || '',
            features: Array.isArray(sp.features) ? sp.features : ['খাঁটি ও ভেজালমুক্ত'],
            sellerName: sp.sellerName || sp.seller_name || 'কৃষক / উৎপাদক',
            sellerPhone: sp.sellerPhone || sp.seller_phone || ''
          });
        }
      });
    }

    // লাইভ ড্রাফট প্রিভিউ সাপোর্ট (ড্যাশবোর্ডে টাইপ করার সাথে সাথে প্রিভিউতে ইনস্ট্যান্ট ডিসপ্লে)
    if (activeDraftPreview && activeDraftPreview.type === 'product' && activeDraftPreview.data) {
      const draft = {
        ...activeDraftPreview.data,
        id: activeDraftPreview.data.id || 'draft_preview_item',
        isDraftPreview: true,
        badge: activeDraftPreview.data.badge || 'লাইভ ড্রাফট প্রিভিউ',
        badgeColor: 'bg-amber-600'
      };
      const existingIdx = baseList.findIndex(p => p.id === draft.id);
      if (existingIdx >= 0) {
        const updated = [...baseList];
        updated[existingIdx] = draft;
        return sortProductsAscending(updated);
      }
      return [draft, ...sortProductsAscending(baseList)];
    }

    return sortProductsAscending(baseList);
  }, [allProducts, selectedTopCategoryId, activeProductFilter, homepageSearchQuery, activeDraftPreview, supabaseGlobalResults]);

  // খুঁজে পাওয়া সেবা ও কারিগর (হোমপেজ গ্লোবাল সার্চ টার্ম অনুযায়ী সার্বজনীন সার্ভিস ও প্রফেশনাল ফিল্টার)
  const filteredServices = useMemo(() => {
    if (!homepageSearchQuery || !homepageSearchQuery.trim()) {
      return { professionals: [], catalogServices: [], totalCount: 0 };
    }
    const q = homepageSearchQuery.toLowerCase().trim();

    // ১. রেজিস্টার্ড পেশাজীবী তালিকা থেকে ফিল্টার
    const matchingPros = professionals.filter(p => {
      const matchingUser = users.find(u => String(u.id) === String(p.id) || (u.phone && u.phone === p.phone));
      if (matchingUser && matchingUser.status === 'Rejected') {
        return false;
      }
      return matchesSmartService(p, q);
    });

    // ২. সার্ভিস প্রোভাইডার ইউজার তালিকা
    const matchingServiceUsers = users.filter(u => {
      const uAny = u as any;
      if (u.role !== 'professional' && uAny.role !== 'service_provider' && !uAny.professionalProfile) return false;
      if (u.status === 'Rejected') return false;
      return matchesSmartService(u, q);
    }).map(u => {
      const uAny = u as any;
      return {
        id: String(u.id),
        name: u.name,
        job: uAny.profession || uAny.professionBn || uAny.serviceCategory || (uAny.professionalProfile && uAny.professionalProfile.job) || 'পেশাজীবী কারিগর',
        phone: u.phone,
        district: u.district || 'খাগড়াছড়ি',
        upazila: u.upazila || 'খাগড়াছড়ি সদর',
        area: u.area || uAny.mahalla || '',
        img: u.avatar || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=200',
        verified: u.status === 'Approved',
        uniqueId: uAny.uniqueId || `JM-${u.id}`,
        rating: uAny.rating || 5,
        completedJobs: uAny.completedJobs || 1,
        rateAmount: uAny.dailyRate || '৫০০',
        rateType: uAny.rateType || 'দৈনিক',
        isFromUserList: true
      } as any;
    });

    const combinedPros: any[] = [...matchingPros];
    matchingServiceUsers.forEach(su => {
      if (!combinedPros.some(cp => cp.phone === su.phone || String(cp.id) === String(su.id))) {
        combinedPros.push(su);
      }
    });

    // সুপাবেস ডাটাবেজের লাইভ service_providers কুয়েরি রেজাল্ট মার্জ
    if (supabaseGlobalResults?.providers?.length) {
      supabaseGlobalResults.providers.forEach((sp: any) => {
        const already = combinedPros.some(cp => String(cp.id) === String(sp.id) || (cp.phone && cp.phone === sp.phone));
        if (!already) {
          combinedPros.unshift({
            id: String(sp.id),
            name: sp.display_name || sp.name || sp.full_name || 'পেশাজীবী কারিগর',
            job: sp.category_bn || sp.profession_key || sp.profession || 'দক্ষ কারিগর',
            phone: sp.phone || '',
            district: sp.district || 'পার্বত্য চট্টগ্রাম',
            upazila: sp.upazila || '',
            area: sp.area || sp.mahalla || '',
            img: sp.avatar_url || sp.avatar || 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?w=200',
            verified: true,
            rating: Number(sp.rating || 5),
            completedJobs: Number(sp.completed_jobs || 1),
            rateAmount: sp.rate_amount || sp.daily_rate || 'আলোচনা সাপেক্ষে',
            rateType: 'দৈনিক',
            isFromSupabase: true
          } as any);
        }
      });
    }

    // ৩. ১০০০+ প্রফেশন ক্যাটালগ আইটেম (যেমন: ইলেকট্রিশিয়ান ও ওয়্যারিং, হোম ওয়্যারিং ইত্যাদি)
    const matchingProfessionsCatalog = ALL_1000_PROFESSIONS_FLAT_LIST.filter(item => {
      return matchesSmartService(item, q);
    }).slice(0, 6);

    return {
      professionals: combinedPros,
      catalogServices: matchingProfessionsCatalog,
      totalCount: combinedPros.length + matchingProfessionsCatalog.length
    };
  }, [homepageSearchQuery, professionals, users, supabaseGlobalResults]);

  // হোমপেজ গ্লোবাল ব্লাড ডোনার সার্চ (কোনো ভৌগোলিক সীমাবদ্ধতা ছাড়াই সারা দেশের রক্তদাতা ডিরেক্টরি)
  const filteredGlobalBloodDonors = useMemo(() => {
    if (!homepageSearchQuery || !homepageSearchQuery.trim()) {
      return [];
    }
    const q = homepageSearchQuery.toLowerCase().trim();

    // ১. রক্তদাতা CMS তালিকা
    const cmsDonors = bloodDonors
      .filter(d => d.isAvailable)
      .map(d => ({
        id: d.id,
        name: d.name,
        bloodGroup: d.bloodGroup,
        district: d.district,
        upazila: d.upazila,
        area: d.area,
        phone: d.phone,
        img: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        totalDonations: d.totalDonations,
        verified: d.verified,
        lastDonationDate: d.lastDonationDate
      }));

    // ২. প্রফেশনালদের মধ্যে রক্তদাতা
    const proDonors = professionals
      .filter(p => p.isBloodDonor || Boolean(p.bloodGroup) || (p.job && p.job.includes('রক্ত')))
      .map(p => ({
        id: p.id,
        name: p.name,
        bloodGroup: p.bloodGroup || 'A+',
        district: p.district,
        upazila: p.upazila,
        area: p.area,
        phone: p.phone,
        img: p.img || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        totalDonations: 3,
        verified: p.verified,
        lastDonationDate: 'উপলব্ধ'
      }));

    // ৩. নিবন্ধিত গ্রাহক ও ইউজার রক্তদাতারা
    const userDonors = (users || [])
      .filter((u: any) => Boolean(u.bloodGroup))
      .map((u: any) => ({
        id: u.id || `user_${u.phone}`,
        name: u.fullName || u.name || 'নিবন্ধিত রক্তদাতা',
        bloodGroup: u.bloodGroup,
        district: u.district || u.location?.district || 'খাগড়াছড়ি',
        upazila: u.upazila || u.location?.upazila || 'সদর',
        area: u.area || u.location?.upazila || '',
        phone: u.phone,
        img: u.avatar || u.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        totalDonations: 1,
        verified: true,
        lastDonationDate: u.lastDonationDate || 'উপলব্ধ রক্তদাতা'
      }));

    const combined = [...cmsDonors, ...proDonors, ...userDonors];
    const uniqueDonors: any[] = [];
    const seenPhones = new Set<string>();

    // সুপাবেস ডাটাবেজের লাইভ blood_donors কুয়েরি রেজাল্ট মার্জ
    if (supabaseGlobalResults?.bloodDonors?.length) {
      supabaseGlobalResults.bloodDonors.forEach((bd: any) => {
        const key = bd.phone || String(bd.id);
        if (!seenPhones.has(key)) {
          seenPhones.add(key);
          uniqueDonors.unshift({
            id: String(bd.id),
            name: bd.name || bd.full_name || 'স্বেচ্ছাসেবী রক্তদাতা',
            bloodGroup: bd.blood_group || bd.bloodGroup || 'A+',
            district: bd.district || '',
            upazila: bd.upazila || '',
            area: bd.area || bd.mahalla || '',
            phone: bd.phone || '',
            img: bd.photo_url || bd.photo || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
            totalDonations: Number(bd.total_donations || 1),
            verified: true,
            lastDonationDate: bd.last_donation_date || 'উপলব্ধ রক্তদাতা'
          });
        }
      });
    }

    for (const d of combined) {
      const key = d.phone || String(d.id);
      if (!seenPhones.has(key)) {
        seenPhones.add(key);
        if (matchesSmartBlood(d, q)) {
          uniqueDonors.push(d);
        }
      }
    }
    return uniqueDonors;
  }, [homepageSearchQuery, bloodDonors, professionals, users, supabaseGlobalResults]);

  // হোমপেজ গ্লোবাল সার্চে সুপাবেস থেকে পাওয়া চাকরির সার্কুলার ও চাকরিপ্রার্থী
  const searchedJobCirculars = useMemo(() => {
    if (!homepageSearchQuery || !homepageSearchQuery.trim()) return [];
    return supabaseGlobalResults?.jobCirculars || [];
  }, [homepageSearchQuery, supabaseGlobalResults]);

  const searchedJobSeekers = useMemo(() => {
    if (!homepageSearchQuery || !homepageSearchQuery.trim()) return [];
    return supabaseGlobalResults?.jobSeekers || [];
  }, [homepageSearchQuery, supabaseGlobalResults]);

  const totalGlobalSearchResultsCount = useMemo(() => {
    if (!homepageSearchQuery || !homepageSearchQuery.trim()) return 0;
    return (
      filteredProducts.length +
      filteredServices.totalCount +
      filteredGlobalBloodDonors.length +
      searchedJobCirculars.length +
      searchedJobSeekers.length
    );
  }, [
    homepageSearchQuery,
    filteredProducts.length,
    filteredServices.totalCount,
    filteredGlobalBloodDonors.length,
    searchedJobCirculars.length,
    searchedJobSeekers.length
  ]);

  // ক্যাটাগরি সিলেকশন হ্যান্ডলার
  const handleSelectTopCategory = (catId: string) => {
    if (catId === 'cat_jobs_employment' || catId === 'jobs') {
      setActiveTab('jobs');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (selectedTopCategoryId === catId) {
      setSelectedTopCategoryId(null);
      setActiveProductFilter('all');
      setShowToast(lang === 'bn' ? 'সকল পণ্য প্রদর্শিত হচ্ছে' : 'Showing all categories');
    } else {
      setSelectedTopCategoryId(catId);
      const cat = ESSENTIAL_15_CATEGORIES.find(c => c.id === catId);
      if (cat) {
        setShowToast(
          lang === 'bn' 
            ? `'${cat.nameBn}' ক্যাটাগরির পণ্য ও সেবা প্রদর্শিত হচ্ছে` 
            : `Showing '${cat.nameEn}' items`
        );
      }
    }
    setTimeout(() => setShowToast(''), 3000);
  };

  // নতুন পণ্য সেলার ড্যাশবোর্ড থেকে যোগ করা (Add to Live Store Feed)
  const handleAddNewProduct = (newProd: StoreProduct) => {
    contextAddProduct(newProd);
    setShowToast(`'${newProd.nameBn}' সরাসরি হোমপেজে পাবলিশ হয়েছে!`);
    setTimeout(() => setShowToast(''), 4000);
  };

  // পেশাজীবী পোর্টফোলিও আপডেট বা সেভ করা (Save Professional Profile)
  const handleSaveProfessionalProfile = (pro: RegisteredProfessional) => {
    saveProfessionalProfile(pro);
    contextAddProfessional(pro);
    setShowToast(`অভিনন্দন ${pro.name}! আপনার পেশাজীবী পোর্টফোলিও লাইভ হয়েছে।`);
    setTimeout(() => setShowToast(''), 4000);
  };

  // রেজিস্ট্রেশন বা যোগ দিন বাটনে ক্লিক করলে: ৩টি অপশন বিশিষ্ট জয়েন পেজ প্রদর্শন
  const handleRegisterNavigation = (
    targetTab?: 'seller' | 'service' | 'permanent' | 'find_job' | 'post_job' | 'blood_donor' | React.MouseEvent | any,
    initialPhoneVal?: string
  ) => {
    const validTab = (targetTab === 'seller' || targetTab === 'service' || targetTab === 'permanent' || targetTab === 'find_job' || targetTab === 'post_job' || targetTab === 'blood_donor') 
      ? targetTab 
      : undefined;
    setRegistrationInitialTab(validTab as any);
    if (typeof initialPhoneVal === 'string' && initialPhoneVal) {
      setRegistrationInitialPhone(initialPhoneVal);
    }
    setRegistrationIsEditMode(false);
    setPreviousTab(activeTab);
    setActiveTab('registration');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // রোল অনুযায়ী নির্দিষ্ট পৃথক এডিট ফর্মে নিয়ে যাওয়া (Product Seller, Service Provider, Permanent Member)
  const handleEditProfileRoleBased = (userToEdit?: any, forceRole?: 'seller' | 'service' | 'permanent') => {
    const user = userToEdit || currentUser;
    setEditingUserTarget(user);
    setPreviousTab(activeTab);
    setRegistrationIsEditMode(true);

    if (forceRole === 'seller') {
      setRegistrationInitialTab('seller');
      setActiveTab('edit_seller');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (forceRole === 'service') {
      setRegistrationInitialTab('service');
      setActiveTab('edit_service');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (forceRole === 'permanent') {
      setRegistrationInitialTab('permanent');
      setActiveTab('edit_permanent');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    const memberUID = String(user?.memberUID || user?.sellerCode || user?.uniqueId || '').toUpperCase();
    const rawRole = (user?.role || '').toLowerCase();
    const rawMemberType = (user?.memberType || '').toLowerCase();

    const isPermanent =
      rawRole === 'permanent_member' ||
      rawRole === 'permanent' ||
      rawRole === 'representative' ||
      rawMemberType === 'permanent_member' ||
      rawMemberType === 'permanent' ||
      memberUID.startsWith('JH-M-') ||
      !!user?.permanentMemberPhotoUrl ||
      !!user?.permanentMemberCertUrl;

    const isSeller =
      !isPermanent && (
        rawRole === 'product_seller' ||
        rawRole === 'seller' ||
        rawRole === 'vendor' ||
        rawRole === 'merchant' ||
        rawMemberType === 'product_seller' ||
        rawMemberType === 'seller' ||
        memberUID.startsWith('JH-S-') ||
        !!user?.shopName ||
        !!user?.sellerProductImageUrl
      );

    if (isPermanent) {
      setRegistrationInitialTab('permanent');
      setActiveTab('edit_permanent');
    } else if (isSeller) {
      setRegistrationInitialTab('seller');
      setActiveTab('edit_seller');
    } else {
      setRegistrationInitialTab('service');
      setActiveTab('edit_service');
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // প্রোফাইল ট্যাবে প্রবেশের গেটিং লজিক (Auth-gating): Unauthenticated -> Sign In (Intent: Profile), Authenticated -> Completed Profile View
  const handleProfileNavigation = () => {
    if (!currentUser) {
      if (onOpenAuth) {
        onOpenAuth('signin');
        return;
      }
      setAuthRedirectTarget('profile');
      setPreviousTab(activeTab);
      setShowToast(
        lang === 'bn' 
          ? 'আপনার প্রোফাইল দেখতে অনুগ্রহ করে সাইন ইন করুন।' 
          : 'Please sign in to view your profile dashboard.'
      );
      setActiveTab('signin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setPreviousTab(activeTab);
      setActiveTab('profile');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // সাইন আপ সফল হওয়া -> রিডাইরেকশন: পার্টনার রোল থাকলে সরাসরি তার সংশ্লিষ্ট প্রোফাইলে যাবে
  const handleAuthSuccess = (user: UserProfile, isNewSignUp: boolean = false) => {
    login(user, isNewSignUp);
    setShowToast(
      lang === 'bn' 
        ? `স্বাগতম ${user.name || 'সদস্য'}! প্রোফাইল প্রস্তুত হয়েছে।` 
        : `Welcome ${user.name || 'Member'}! Profile is ready.`
    );
    setTimeout(() => setShowToast(''), 3500);

    const memberUID = user?.memberUID || user?.sellerCode || user?.uniqueId || '';
    const hasPartnerRole = 
      user.role === 'product_seller' || 
      user.role === 'seller' || 
      user.role === 'merchant' || 
      user.role === 'vendor' ||
      user.role === 'service_provider' || 
      user.role === 'professional' || 
      user.role === 'service' ||
      user.role === 'permanent_member' || 
      user.role === 'permanent' ||
      user.role === 'blood_donor' ||
      user.role === 'job_seeker' ||
      user.isBloodDonor ||
      (typeof memberUID === 'string' && (memberUID.startsWith('JH-S-') || memberUID.startsWith('JH-P-') || memberUID.startsWith('JH-M-')));

    // Always redirect directly to their personalized user profile page
    setActiveTab('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // সাইন ইন সফল হওয়া -> রিডাইরেকশন: প্রতিষ্ঠিত পার্টনার হলে সরাসরি তার প্রোফাইল পেজ
  const handleSignInSuccess = (user: UserProfile) => {
    login(user, false);
    setShowToast(
      lang === 'bn' 
        ? `স্বাগতম ${user.name}! আপনি সফলভাবে সাইন ইন করেছেন।` 
        : `Welcome ${user.name}! Signed in successfully.`
    );
    setTimeout(() => setShowToast(''), 3500);

    const memberUID = user?.memberUID || user?.sellerCode || user?.uniqueId || '';
    const hasPartnerRole = 
      user.role === 'product_seller' || 
      user.role === 'seller' || 
      user.role === 'merchant' || 
      user.role === 'vendor' ||
      user.role === 'service_provider' || 
      user.role === 'professional' || 
      user.role === 'service' ||
      user.role === 'permanent_member' || 
      user.role === 'permanent' ||
      (typeof memberUID === 'string' && (memberUID.startsWith('JH-S-') || memberUID.startsWith('JH-P-') || memberUID.startsWith('JH-M-')));

    if (hasPartnerRole) {
      setActiveTab('profile');
    } else {
      if (onOpenRoleSelect) {
        onOpenRoleSelect();
      } else {
        openRoleModal();
      }
    }
    setAuthRedirectTarget('profile');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // ধাপ ৩: অনবোর্ডিং রোল সাবমিট সম্পন্ন -> সরাসরি সংশ্লিষ্ট ড্যাশবোর্ডে রিডাইরেক্ট
  const handleSelectTrack = (
    track: 'track_a_vendor' | 'track_b_freelancer' | 'customer',
    extraData?: { title?: string; category?: string }
  ) => {
    if (track === 'track_a_vendor') {
      selectRole('seller');
      setActiveTab('track_a_vendor');
      setShowToast(
        lang === 'bn' 
          ? '🎉 অভিনন্দন! আপনার মার্চেন্ট স্টোরফ্রন্ট ড্যাশবোর্ড প্রস্তুত। নতুন পণ্য যোগ করুন!' 
          : 'Merchant Storefront & Dashboard is ready!'
      );
    } else if (track === 'track_b_freelancer') {
      selectRole('professional');
      setActiveTab('track_b_freelancer');
      setShowToast(
        lang === 'bn' 
          ? '🎉 অভিনন্দন! আপনার প্রফেশনাল পোর্টফোলিও বিল্ডার প্রস্তুত।' 
          : 'Professional Profile Builder is ready!'
      );
    } else {
      selectRole('buyer');
      setActiveTab('profile');
      setShowToast(
        lang === 'bn' 
          ? '🎉 স্বাগতম! আপনার সাধারণ কাস্টমার ড্যাশবোর্ড প্রস্তুত।' 
          : 'Customer Dashboard is ready!'
      );
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setShowToast(''), 4500);
  };

  // রোল নির্বাচন (ধাপ ২ ড্রপডাউন মোডাল থেকে সাবমিট) -> সংশ্লিষ্ট পাথওয়েতে রিডাইরেক্ট
  const handleSelectRole = (role: 'seller' | 'professional') => {
    selectRole(role);
    closeRoleModal();
    if (role === 'seller') {
      // মার্চেন্ট সিলেক্ট করলে সরাসরি মার্চেন্ট প্রোফাইল/ড্যাশবোর্ডে রিডাইরেক্ট
      setActiveTab('track_a_vendor');
      setShowToast(lang === 'bn' ? 'মার্চেন্ট ড্যাশবোর্ড প্রস্তুত — পণ্য পরিচালনা করুন!' : 'Merchant dashboard ready!');
    } else {
      // সার্ভিস সিলেক্ট করলে সরাসরি সার্ভিস প্রোভাইডার রেজিস্ট্রেশন ফর্ম প্রদর্শন
      setActiveTab('registration_flow');
      setShowToast(lang === 'bn' ? 'সেবাদাতা রেজিস্ট্রেশন ফর্ম পূরণ করুন!' : 'Please complete provider registration form!');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setTimeout(() => setShowToast(''), 3500);
  };

  // লগআউট
  const handleLogout = () => {
    logout();
    setActiveTab('home');
    setShowToast('সফলভাবে লগআউট করা হয়েছে।');
    setTimeout(() => setShowToast(''), 3000);
  };

  // কার্ট ফাংশনালিটি
  const handleAddToCart = (product: StoreProduct, qty: number = 1) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + qty }
            : item
        );
      } else {
        return [...prev, { product, quantity: qty }];
      }
    });

    setShowToast(`'${product.nameBn}' কার্টে যুক্ত হয়েছে!`);
    setTimeout(() => setShowToast(''), 3000);
  };

  const handleUpdateCartQty = (productId: string, delta: number) => {
    setCartItems(prev => {
      return prev.map(item => {
        if (item.product.id === productId) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      }).filter(Boolean) as CartItemType[];
    });
  };

  const handleRemoveCartItem = (productId: string) => {
    setCartItems(prev => prev.filter(item => item.product.id !== productId));
    setShowToast('পণ্যটি কার্ট থেকে সরানো হয়েছে।');
    setTimeout(() => setShowToast(''), 2500);
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // ডাইনামিক জেলা ও থানা ম্যাপিং (DataContext + Admin CMS থেকে রিয়েলটাইম সিঙ্ক)
  const dynamicDistricts = useMemo(() => {
    const map: Record<string, string[]> = { ...ALL_BANGLADESH_DISTRICTS };
    locations.forEach(loc => {
      if (loc.isActive && loc.districtBn && loc.upazilasBn && loc.upazilasBn.length > 0) {
        map[loc.districtBn] = loc.upazilasBn;
      }
    });
    return map;
  }, [locations]);

  // জেলা পরিবর্তনের সাথে থানা/উপজেলা লোড (ডাইনামিক)
  const availableUpazilas = useMemo(() => {
    return dynamicDistricts[selectedDistrict] || ALL_BANGLADESH_DISTRICTS[selectedDistrict] || [];
  }, [dynamicDistricts, selectedDistrict]);

  // ফিল্টার লজিক (পেশাজীবী - কেওয়াইসি ও অ্যাডমিন মডারেশন স্ট্যাটাস সিঙ্ক)
  const searchResults = useMemo(() => {
    return professionals.filter(p => {
      // Check if banned or rejected by Admin in KYC/User Moderation
      const matchingUser = users.find(u => String(u.id) === String(p.id) || (u.phone && u.phone === p.phone));
      if (matchingUser && matchingUser.status === 'Rejected') {
        return false;
      }

      const q = navSearchQuery.toLowerCase().trim();
      const matchesQuery = !q || matchesSmartService(p, q);
      const matchesCategory = !selectedCategoryJob || (p.job && p.job.includes(selectedCategoryJob));
      const matchesDistrict = !selectedDistrict || p.district === selectedDistrict;
      const matchesUpazila = !selectedUpazila || p.upazila === selectedUpazila;
      const matchesArea = !selectedArea || (p.area && p.area.toLowerCase().includes(selectedArea.toLowerCase()));
      return matchesQuery && matchesCategory && matchesDistrict && matchesUpazila && matchesArea;
    });
  }, [professionals, users, navSearchQuery, selectedCategoryJob, selectedDistrict, selectedUpazila, selectedArea]);

  // ফিল্টার লজিক (পণ্য সার্চ)
  const productSearchResults = useMemo(() => {
    return allProducts.filter(p => {
      // Visibility Rule: Vendor-exclusive products are only displayed on vendor profile
      if ((p as any).isVendorExclusive || (p as any).sellerOnly || (p as any).isExclusiveToVendor) {
        return false;
      }
      const q = navSearchQuery.toLowerCase().trim();
      const matchesQuery = !q || matchesSmartProduct(p, q);
      const matchesCategory = !selectedCategoryJob || 
        p.category === selectedCategoryJob || 
        p.categoryLabelBn === selectedCategoryJob ||
        (p.nameBn && p.nameBn.includes(selectedCategoryJob));
      const matchesDistrict = !selectedDistrict || (p.origin && p.origin.includes(selectedDistrict));
      const matchesUpazila = !selectedUpazila || (p.origin && p.origin.includes(selectedUpazila));
      const matchesArea = !selectedArea || (p.origin && p.origin.includes(selectedArea));
      return matchesQuery && matchesCategory && matchesDistrict && matchesUpazila && matchesArea;
    });
  }, [allProducts, navSearchQuery, selectedCategoryJob, selectedDistrict, selectedUpazila, selectedArea]);

  // ফিল্টার লজিক (ব্লাড ডোনার সার্চ - রক্তদাতা CMS + নিবন্ধিত ইউজার/প্রফেশনালদের মধ্য থেকে ১০০% লাইভ)
  const bloodSearchResults = useMemo(() => {
    // ১. রক্তদাতা CMS থেকে ভেরিফাইড ও উপলব্ধ রক্তদাতারা
    const cmsDonors = bloodDonors
      .filter(d => d.isAvailable)
      .map(d => ({
        id: d.id,
        name: d.name,
        job: `রক্তদান করেছেন: ${d.totalDonations} বার • বয়স: ${d.age || 25} বছর`,
        district: d.district,
        upazila: d.upazila,
        area: d.area,
        phone: d.phone,
        img: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        experience: `${d.totalDonations} বার রক্তদান`,
        rateType: '১০০% ফ্রি',
        rateAmount: '০',
        rating: 5.0,
        verified: d.verified,
        isBloodDonor: true,
        bloodGroup: d.bloodGroup,
        lastDonationDate: d.lastDonationDate
      }));

    // ২. নিবন্ধিত প্রফেশনাল ও ইউজার যারা রক্তদাতা
    const proDonors = professionals.filter(p => {
      return p.isBloodDonor || Boolean(p.bloodGroup) || (p.job && p.job.includes('রক্তদাতা'));
    });

    // ৩. নিবন্ধিত গ্রাহক ও রক্তদাতা ইউজার (Customer Blood Donors)
    const customerDonors = (users || [])
      .filter((u: any) => Boolean(u.bloodGroup))
      .map((u: any) => ({
        id: u.id || `user_${u.phone}`,
        name: u.fullName || u.name || 'নিবন্ধিত রক্তদাতা',
        job: 'নিবন্ধিত রক্তদাতা (কমিউনিটি নেটওয়ার্ক)',
        district: u.district || u.location?.district || 'খাগড়াছড়ি',
        upazila: u.upazila || u.location?.upazila || 'সদর',
        area: u.area || u.location?.upazila || '',
        phone: u.phone,
        img: u.avatar || u.photoURL || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
        experience: 'স্বেচ্ছাসেবী রক্তদাতা',
        rateType: '১০০% ফ্রি',
        rateAmount: '০',
        rating: 5.0,
        verified: true,
        isBloodDonor: true,
        bloodGroup: u.bloodGroup,
        lastDonationDate: u.lastDonationDate || 'উপলব্ধ রক্তদাতা'
      }));

    const combined = [...cmsDonors, ...proDonors, ...customerDonors];

    return combined.filter(p => {
      const matchesBlood = !selectedBloodGroup || p.bloodGroup === selectedBloodGroup;
      const matchesQuery = !navSearchQuery || matchesSmartBlood(p, navSearchQuery);
      const matchesDistrict = !selectedDistrict || p.district === selectedDistrict;
      const matchesUpazila = !selectedUpazila || p.upazila === selectedUpazila;

      return matchesBlood && matchesQuery && matchesDistrict && matchesUpazila;
    });
  }, [bloodDonors, professionals, users, selectedBloodGroup, navSearchQuery, selectedDistrict, selectedUpazila]);

  // ফিল্টার লজিক (সোর্স ও পুলিশ স্টেশন ডিরেক্টরি)
  const sourceSearchResults = useMemo(() => {
    return POLICE_STATIONS_DIRECTORY.filter(p => {
      const matchesQuery = !navSearchQuery ||
        p.officeNameBn.toLowerCase().includes(navSearchQuery.toLowerCase()) ||
        p.officeNameEn.toLowerCase().includes(navSearchQuery.toLowerCase()) ||
        p.designationBn.toLowerCase().includes(navSearchQuery.toLowerCase()) ||
        p.mobileNumber.includes(navSearchQuery) ||
        (p.phoneLandline && p.phoneLandline.includes(navSearchQuery)) ||
        p.addressBn.toLowerCase().includes(navSearchQuery.toLowerCase()) ||
        p.district.toLowerCase().includes(navSearchQuery.toLowerCase()) ||
        p.upazila.toLowerCase().includes(navSearchQuery.toLowerCase());

      const matchesDistrict = !selectedDistrict || p.district === selectedDistrict;
      const matchesUpazila = !selectedUpazila || p.upazila === selectedUpazila;
      const matchesArea = !selectedArea || p.addressBn.toLowerCase().includes(selectedArea.toLowerCase());
      const matchesCategory = selectedPoliceCategory === 'all' || p.category === selectedPoliceCategory;

      return matchesQuery && matchesDistrict && matchesUpazila && matchesArea && matchesCategory;
    });
  }, [navSearchQuery, selectedDistrict, selectedUpazila, selectedArea, selectedPoliceCategory]);

  // ফিল্টার লজিক (জাতীয় জরুরি হটলাইনসমূহ)
  const helplineSearchResults = useMemo(() => {
    return NATIONAL_HELPLINES.filter(h => {
      const matchesQuery = !navSearchQuery ||
        h.nameBn.toLowerCase().includes(navSearchQuery.toLowerCase()) ||
        h.nameEn.toLowerCase().includes(navSearchQuery.toLowerCase()) ||
        h.number.includes(navSearchQuery) ||
        (h.shortCode && h.shortCode.includes(navSearchQuery)) ||
        h.descriptionBn.toLowerCase().includes(navSearchQuery.toLowerCase());

      const matchesCategory = selectedHelplineCategory === 'all' || h.category === selectedHelplineCategory;
      return matchesQuery && matchesCategory;
    });
  }, [navSearchQuery, selectedHelplineCategory]);

  // ফিল্টার লজিক (অ্যাম্বুলেন্স সার্ভিসেস ডিরেক্টরি)
  const ambulanceSearchResults = useMemo(() => {
    return AMBULANCE_SERVICES_DIRECTORY.filter(a => {
      const matchesQuery = !navSearchQuery ||
        a.serviceNameBn.toLowerCase().includes(navSearchQuery.toLowerCase()) ||
        a.serviceNameEn.toLowerCase().includes(navSearchQuery.toLowerCase()) ||
        (a.driverNameBn && a.driverNameBn.toLowerCase().includes(navSearchQuery.toLowerCase())) ||
        a.contactNumber.includes(navSearchQuery) ||
        (a.alternateNumber && a.alternateNumber.includes(navSearchQuery)) ||
        a.baseLocationBn.toLowerCase().includes(navSearchQuery.toLowerCase()) ||
        a.typeLabelBn.toLowerCase().includes(navSearchQuery.toLowerCase()) ||
        a.district.toLowerCase().includes(navSearchQuery.toLowerCase()) ||
        a.upazila.toLowerCase().includes(navSearchQuery.toLowerCase());

      const matchesDistrict = !selectedDistrict || a.district === selectedDistrict;
      const matchesUpazila = !selectedUpazila || a.upazila === selectedUpazila;
      const matchesArea = !selectedArea || a.baseLocationBn.toLowerCase().includes(selectedArea.toLowerCase());
      const matchesType = selectedAmbulanceType === 'all' || a.ambulanceType === selectedAmbulanceType;
      const matchesIcu = !ambulanceIcuOnly || a.icuSupport;
      const matchesOxygen = !ambulanceOxygenOnly || a.oxygenAvailable;

      return matchesQuery && matchesDistrict && matchesUpazila && matchesArea && matchesType && matchesIcu && matchesOxygen;
    });
  }, [navSearchQuery, selectedDistrict, selectedUpazila, selectedArea, selectedAmbulanceType, ambulanceIcuOnly, ambulanceOxygenOnly]);

  // ব্যানার স্লাইডার হ্যান্ডলার
  const activeBanners = useMemo(() => {
    return banners.filter(b => b.isActive);
  }, [banners]);

  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);

  // অটো-ক্যারোসেল টাইমার
  useEffect(() => {
    if (activeBanners.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % activeBanners.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [activeBanners.length]);

  const handleBannerClick = (targetLink?: string) => {
    if (!targetLink) return;
    if (targetLink === 'registration_flow' || targetLink === 'track_a_vendor' || targetLink === 'track_b_freelancer') {
      if (!currentUser) {
        setShowToast(lang === 'bn' ? 'রেজিস্ট্রেশন বা সেবা প্রদানে যুক্ত হতে প্রথমে সাইন আপ অথবা সাইন ইন করুন।' : 'Please sign up or sign in first.');
        setPreviousTab(activeTab);
        setActiveTab('signup');
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }
    }
    if (targetLink === 'admin' || targetLink === 'super_admin') {
      try {
        const adminUrl = window.location.origin + '/admin';
        const newTab = window.open(adminUrl, '_blank', 'noopener,noreferrer');
        if (!newTab && onNavigateToAdmin) {
          onNavigateToAdmin();
        }
      } catch (_) {
        if (onNavigateToAdmin) {
          onNavigateToAdmin();
        } else {
          window.open('/admin', '_blank');
        }
      }
      return;
    }
    if (targetLink === 'auto_directory' || targetLink === 'track_a_vendor' || targetLink === 'track_b_freelancer' || targetLink === 'services' || targetLink === 'search' || targetLink === 'profile' || targetLink === 'registration_flow' || targetLink === 'jobs') {
      setPreviousTab(activeTab);
      setActiveTab(targetLink as any);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (targetLink === 'blood') {
      setSearchMode('blood');
      setActiveTab('search');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else if (targetLink === 'source' || targetLink === 'ambulance') {
      setIsSourceModalOpen(true);
    }
  };

  // Hidden file input ref for Image Search across search bars
  const searchCameraInputRef = useRef<HTMLInputElement>(null);

  const handleTriggerImageSearch = () => {
    if (searchCameraInputRef.current) {
      searchCameraInputRef.current.click();
    }
  };

  const handleImageUploaded = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim();
    let detectedKeyword = rawName;
    const lower = rawName.toLowerCase();

    if (lower.includes('honey') || lower.includes('মধু')) {
      detectedKeyword = 'মধু';
    } else if (lower.includes('rice') || lower.includes('চাল') || lower.includes('জুম')) {
      detectedKeyword = 'চাল';
    } else if (lower.includes('halud') || lower.includes('turmeric') || lower.includes('হলুদ')) {
      detectedKeyword = 'হলুদ';
    } else if (lower.includes('cloth') || lower.includes('pinon') || lower.includes('কাপড়') || lower.includes('পিনন')) {
      detectedKeyword = 'পিনন হাদি';
    } else if (lower.includes('fish') || lower.includes('shutki') || lower.includes('শুঁটকি')) {
      detectedKeyword = 'শুঁটকি';
    } else if (lower.includes('mango') || lower.includes('আম')) {
      detectedKeyword = 'আম';
    } else if (lower.includes('mechanic') || lower.includes('মেকানিক')) {
      detectedKeyword = 'মেকানিক';
    } else if (lower.includes('electric') || lower.includes('ইলেকট্রিশিয়ান')) {
      detectedKeyword = 'ইলেকট্রিশিয়ান';
    }

    if (activeTab === 'home') {
      setHomepageSearchQuery(detectedKeyword);
    } else {
      setNavSearchQuery(detectedKeyword);
      setHasSearched(true);
    }
    setShowToast(`📷 ছবি আপলোড সম্পন্ন: "${detectedKeyword}" দিয়ে অনুসন্ধান করা হচ্ছে...`);
    setTimeout(() => setShowToast(''), 4000);
  };

  // Real Voice Search & Smart Bangla Parsing Handler
  const handleTriggerVoiceSearch = () => {
    // If currently listening, toggle off smoothly
    if (isListeningVoice) {
      if (activeVoiceRecognitionRef.current && activeVoiceRecognitionRef.current.stop) {
        try {
          activeVoiceRecognitionRef.current.stop();
        } catch {
          // silent
        }
      }
      setIsListeningVoice(false);
      return;
    }

    const recognition = startBanglaVoiceRecognition({
      onStart: () => {
        setIsListeningVoice(true);
      },
      onResult: (transcript, parsed: ParsedSearchResult) => {
        setIsListeningVoice(false);
        // Spoken phrase (e.g. "electrician" or "chili powder")
        const spokenWord = (transcript || parsed.cleanedKeyword || '').trim().replace(/[।.,!?]+$/g, '');

        // মুখে বলা কীওয়ার্ডটি শুধুমাত্র সংশ্লিষ্ট সক্রিয় সার্চ বারে বসানো হবে (কোনো ওভারল্যাপ ছাড়া)
        if (activeTab === 'home') {
          setHomepageSearchQuery(spokenWord);
          setSelectedTopCategoryId(null);
          setActiveProductFilter('all');
        } else {
          setNavSearchQuery(spokenWord);
          setHasSearched(true);
          setSelectedCategoryJob('');

          // রক্তের গ্রুপ শনাক্তকরণ (যেমন: "O+", "A+", "ও পজিটিভ")
          const lowerTranscript = (transcript || '').toLowerCase();
          if (parsed.searchType === 'blood' || /রক্ত|ব্লাড|donor|ডোনার|পজিটিভ|নেগেটিভ/i.test(lowerTranscript)) {
            setSearchMode('blood');
            if (/o\+|o\s*positive|ও\s*পজিটিভ|ও\+/i.test(lowerTranscript)) setSelectedBloodGroup('O+');
            else if (/a\+|a\s*positive|এ\s*পজিটিভ|এ\+/i.test(lowerTranscript)) setSelectedBloodGroup('A+');
            else if (/b\+|b\s*positive|বি\s*পজিটিভ|বি\+/i.test(lowerTranscript)) setSelectedBloodGroup('B+');
            else if (/ab\+|ab\s*positive|এবি\s*পজিটিভ|এবি\+/i.test(lowerTranscript)) setSelectedBloodGroup('AB+');
            else if (/o\-|o\s*negative|ও\s*নেগেটিভ|ও\-/i.test(lowerTranscript)) setSelectedBloodGroup('O-');
            else if (/a\-|a\s*negative|এ\s*নেগেটিভ|এ\-/i.test(lowerTranscript)) setSelectedBloodGroup('A-');
            else if (/b\-|b\s*negative|বি\s*নেগেটিভ|বি\-/i.test(lowerTranscript)) setSelectedBloodGroup('B-');
            else if (/ab\-|ab\s*negative|এবি\s*নেগেটিভ|এবি\-/i.test(lowerTranscript)) setSelectedBloodGroup('AB-');
          } else if (parsed.searchType === 'product') {
            setSearchMode('products');
          } else if (parsed.searchType === 'service') {
            setSearchMode('services');
          }

          // যদি অবস্থান উল্লেখ থাকে (যেমন: "খাগড়াছড়ি সদরে ইলেকট্রিশিয়ান") তা আপডেট রাখা
          if (parsed.district) {
            setSelectedDistrict(parsed.district);
          }
          if (parsed.upazila) {
            setSelectedUpazila(parsed.upazila);
          }
        }
      },
      onError: (err?: string) => {
        setIsListeningVoice(false);
        if (err) {
          setShowToast(err);
          setTimeout(() => setShowToast(''), 4000);
        }
      },
      onEnd: () => {
        setIsListeningVoice(false);
      }
    });

    activeVoiceRecognitionRef.current = recognition;
  };

  const handleRegisterSuccess = (newPro: RegisteredProfessional) => {
    contextAddProfessional(newPro);
    setShowToast(`অভিনন্দন ${newPro.name}! আপনার রেজিস্ট্রেশন সফল হয়েছে।`);
    setTimeout(() => setShowToast(''), 4000);
  };

  const handleViewInSearch = (dist: string, upa: string, jobTitle: string) => {
    setSelectedDistrict(dist);
    setSelectedUpazila(upa);
    setSelectedCategoryJob(jobTitle);
    setHasSearched(true);
    setActiveTab('search');
  };

  return (
    <div className="flex flex-col h-full min-h-full w-full flex-1 overflow-hidden bg-[#faf9f6] relative font-sans text-gray-900 m-0 p-0 border-0 rounded-none shadow-none">
      
      {/* নোটিফিকেশন টোস্ট */}
      {showToast && (
        <div className="absolute top-12 left-4 right-4 z-[55] bg-emerald-700 text-white text-[9.5px] font-bold px-3 py-2 rounded-xl shadow-lg flex items-center justify-between animate-bounce">
          <div className="flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>{showToast}</span>
          </div>
          <button onClick={() => setShowToast('')} className="text-white/80 hover:text-white text-xs">✕</button>
        </div>
      )}

      {/* ২. স্ক্রোলযোগ্য মূল কন্টেন্ট (সহ স্মার্ট স্ক্রোল-সচেতন হেডার ও সার্চ বার) */}
      <main 
        ref={mainScrollContainerRef}
        className={`main-content flex-1 overflow-y-auto overflow-x-hidden scroll-smooth flex flex-col min-h-0 relative pointer-events-auto w-full ${
          activeTab === 'search' ? 'bg-[#f8f9fa]' : 'bg-[#faf9f6]'
        } pb-20 sm:pb-24 overscroll-contain`}
      >
        {/* ১. শীর্ষ হেডার ও সার্চ বার (Universal Top Header Across ALL Pages) */}
        {!isJhadimadiChatOpen && (
          <div 
            id="scroll-aware-top-header"
            className={`sticky top-0 z-40 w-full transition-transform duration-300 ease-in-out ${
              (isAdminPreview || isTopHeaderVisible) ? 'translate-y-0 pointer-events-auto' : '-translate-y-full pointer-events-none'
            }`}
            style={{ willChange: 'transform' }}
          >
            <Navbar
              lang={lang}
              setLang={setLang}
              currentUser={currentUser}
              showBack={activeTab !== 'home'}
              isAdminPreview={isAdminPreview}
              onBack={() => {
                if (previousTab && previousTab !== activeTab) {
                  setActiveTab(previousTab);
                } else {
                  setActiveTab('home');
                }
              }}
              onLogoClick={() => {
                if (activeTab === 'home') {
                  onReplaySplash?.();
                } else {
                  setActiveTab('home');
                  if (mainScrollContainerRef.current) {
                    mainScrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                  }
                }
              }}
              onOpenWhatsAppChat={handleOpenWhatsAppChat}
              whatsappUnreadCount={whatsappUnreadCount}
              unreadNotificationsCount={unreadNotificationsCount}
              onOpenProfile={() => {
                setPreviousTab(activeTab);
                setActiveTab('profile');
                if (mainScrollContainerRef.current) {
                  mainScrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              onOpenAuth={(mode) => {
                if (onOpenAuth) {
                  onOpenAuth(mode || 'signin');
                  return;
                }
                setAuthRedirectTarget('profile');
                setPreviousTab(activeTab);
                setActiveTab(mode === 'signup' ? 'signup' : 'signin');
                if (mainScrollContainerRef.current) {
                  mainScrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              onOpenCart={() => setIsCartModalOpen(true)}
              cartCount={totalCartCount}
              searchCameraInputRef={searchCameraInputRef}
              handleImageUploaded={handleImageUploaded}
              setShowToast={setShowToast}
              activeTab={activeTab}
              onNavigateTab={(tab) => {
                setActiveTab(tab as any);
                if (mainScrollContainerRef.current) {
                  mainScrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
                }
              }}
              onOpenAiChat={handleOpenAiChat}
              onPostClick={handleRegisterNavigation}
              onToggleHamburger={() => setIsNavigationDrawerOpen(true)}
            />

            {/* সার্চ বার (হেডারের সরাসরি নিচে) */}
            {activeTab === 'home' && (
              <div 
                className={`w-full bg-[#faf9f6] px-2 sm:px-4 md:px-6 lg:px-8 py-1.5 sm:py-2.5 transition-shadow duration-200 border-b border-emerald-600/20 ${
                  isScrolled ? 'shadow-md' : 'shadow-2xs'
                }`}
                style={{
                  backgroundColor: '#faf9f6',
                }}
              >
                <div className="max-w-7xl mx-auto w-full">
                  {/* সার্চ বার (সার্চ প্লেসহোল্ডার: "কী খুঁজছেন? যেমন: পাহাড়ি মধু, টেকনিশিয়ান বা চাকরি...") */}
                  <div 
                    role="search"
                    aria-label={lang === 'bn' ? 'সার্বজনীন পণ্য ও সেবা অনুসন্ধান' : 'Universal products and services search'}
                    className={`w-full bg-white/95 p-1 pl-2.5 sm:pl-3.5 rounded-xl sm:rounded-2xl shadow-xs border-2 ${
                      isListeningVoice 
                        ? 'border-red-400 ring-2 ring-red-200 bg-red-50/20' 
                        : 'border-[#16a34a]/60 focus-within:ring-2 focus-within:ring-[#16a34a] focus-within:border-[#16a34a]'
                    } transition-all flex flex-row items-center justify-between gap-2 flex-nowrap min-w-0`}
                  >
                    <Search className={`w-4 h-4 sm:w-5 sm:h-5 shrink-0 transition-colors ${isListeningVoice ? 'text-red-500 animate-pulse' : 'text-[#16a34a]'}`} aria-hidden="true" />
                    <input
                      id="homepage-search-input"
                      role="searchbox"
                      onFocus={() => setIsSearchFocused(true)}
                      onBlur={() => setIsSearchFocused(false)}
                      aria-label="কী খুঁজছেন? যেমন: পাহাড়ি মধু, টেকনিশিয়ান বা চাকরি..."
                      type="text"
                      placeholder={isAdminPreview ? (lang === 'bn' ? 'কী খুঁজছেন? যেমন: মধু, চাল...' : 'Search products, services...') : (lang === 'bn' ? 'কী খুঁজছেন? যেমন: পাহাড়ি মধু, টেকনিশিয়ান বা চাকরি...' : 'Search products, services or jobs...')}
                      value={homepageSearchQuery}
                      onChange={(e) => setHomepageSearchQuery(sanitizeSearchQuery(e.target.value, 150, true))}
                      onKeyDown={(e) => {
                        if (e.key === 'Escape') {
                          setHomepageSearchQuery('');
                          (e.target as HTMLInputElement).blur();
                        } else if (e.key === 'Enter') {
                          const term = sanitizeSearchQuery(homepageSearchQuery.trim());
                          (e.target as HTMLInputElement).blur();
                          if (term) {
                            setShowToast(lang === 'bn' ? `'${term}' এর সার্বজনীন ফলাফল ফিল্টার করা হয়েছে।` : `Filtered for '${term}'`);
                            setTimeout(() => setShowToast(''), 2500);
                          }
                        }
                      }}
                      className="w-full text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none placeholder:text-stone-400 bg-transparent min-w-0"
                    />
                    
                    {homepageSearchQuery && (
                      <button 
                        type="button"
                        onClick={() => {
                          setHomepageSearchQuery('');
                          const inputEl = document.getElementById('homepage-search-input');
                          if (inputEl) inputEl.focus();
                        }}
                        className="text-stone-400 hover:text-stone-700 p-1 rounded-md text-xs cursor-pointer transition-colors shrink-0 active:scale-90"
                        aria-label={lang === 'bn' ? 'সার্চ মুছুন' : 'Clear search'}
                        title={lang === 'bn' ? 'মুছে ফেলুন' : 'Clear'}
                      >
                        ✕
                      </button>
                    )}

                    {/* Microphone Icon: Real Voice Search */}
                    <button 
                      type="button"
                      onClick={handleTriggerVoiceSearch}
                      id="btn-search-voice"
                      aria-label={lang === 'bn' ? (isListeningVoice ? 'ভয়েস সার্চ বন্ধ করুন' : 'ভয়েস সার্চ (মুখে বলুন)') : (isListeningVoice ? 'Stop voice listening' : 'Voice Search')}
                      title={lang === 'bn' ? (isListeningVoice ? 'ভয়েস সার্চ বন্ধ করুন' : 'ভয়েস সার্চ (মুখে বলুন)') : (isListeningVoice ? 'Stop listening' : 'Voice Search')}
                      className={`p-1.5 sm:p-2 rounded-lg transition-all cursor-pointer select-none active:scale-95 shrink-0 flex items-center gap-1 ${
                        isListeningVoice 
                          ? 'bg-red-500 text-white shadow-xs ring-2 ring-red-400' 
                          : 'bg-transparent text-[#16a34a] hover:bg-emerald-50 border border-[#16a34a]'
                      }`}
                    >
                      {isListeningVoice ? (
                        <>
                          <Mic className="w-3.5 h-3.5 animate-pulse" />
                          <span className="flex items-center gap-0.5 px-0.5" aria-hidden="true">
                            <span className="w-0.5 h-2.5 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-0.5 h-3.5 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-0.5 h-2 bg-white rounded-full animate-bounce"></span>
                          </span>
                        </>
                      ) : (
                        <Mic className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      )}
                    </button>

                    {/* Camera Icon: Real Image Search */}
                    <button 
                      type="button"
                      onClick={handleTriggerImageSearch}
                      id="btn-search-camera"
                      aria-label={lang === 'bn' ? 'ছবি দিয়ে খুঁজুন' : 'Search by image'}
                      title={lang === 'bn' ? 'ছবি দিয়ে খুঁজুন' : 'Search by Image'}
                      className="p-1.5 sm:p-2 rounded-lg bg-transparent hover:bg-emerald-50 text-[#16a34a] border border-[#16a34a] transition-all cursor-pointer select-none active:scale-95 shrink-0"
                    >
                      <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    </button>

                    {/* Search Action Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const term = sanitizeSearchQuery(homepageSearchQuery.trim());
                        const inputEl = document.getElementById('homepage-search-input');
                        if (inputEl) inputEl.blur();
                        if (term) {
                          setShowToast(lang === 'bn' ? `'${term}' এর সার্বজনীন ফলাফল ফিল্টার করা হয়েছে।` : `Filtered results for '${term}'`);
                          setTimeout(() => setShowToast(''), 2500);
                        } else {
                          setShowToast(lang === 'bn' ? 'অনুগ্রহ করে অনুসন্ধানের জন্য কিছু লিখুন' : 'Please enter a search query');
                          setTimeout(() => setShowToast(''), 2000);
                        }
                      }}
                      id="btn-search-action-submit"
                      aria-label={lang === 'bn' ? 'অনুসন্ধান করুন' : 'Perform search'}
                      title={lang === 'bn' ? 'সার্চ করুন' : 'Search'}
                      className="h-7 sm:h-8 px-2.5 sm:px-3.5 rounded-lg bg-[#16a34a] hover:bg-[#15803d] active:scale-95 text-white font-bold text-xs sm:text-sm flex items-center gap-1 shadow-xs transition-all cursor-pointer select-none shrink-0"
                    >
                      <span className="font-extrabold">{lang === 'bn' ? 'সার্চ' : 'Search'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* নেটিভ অ্যাপ-স্টাইল অফলাইন ব্যানার (কেবল অফলাইনে প্রদর্শিত হয়) */}
        {(!isOnline || wasOffline) && (
          <OfflineBanner
            isOnline={isOnline}
            wasOffline={wasOffline}
            isChecking={isChecking}
            onRetry={checkConnection}
            cachedCount={allProducts.length}
          />
        )}

        {/* ================= (ক) হোম পেজ ================= */}
        {activeTab === 'home' && (
          <div className="w-full max-w-7xl mx-auto p-3 sm:p-4 md:p-6 lg:p-8 space-y-3 sm:space-y-4 pb-2">

            {/* ডাইনামিক ডাটাবেজ প্রমোশনাল ব্যানার (Supabase Database Table: banners) */}
            <HomepageHeroBanner onBannerClick={handleBannerClick} lang={lang} />

            {/* ২. স্লীক ও অনুভূমিক ১৫টি ক্যাটাগরি বার (Horizontal Scrollable 15 Essential Categories with Touch & Arrow Navigation) */}
            <div className="space-y-2 pt-1" id="essential-top-categories">
              <div className="flex items-center justify-between px-0.5">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs"></span>
                  <h3 className="text-xs sm:text-sm font-extrabold text-gray-900 tracking-tight flex items-center gap-1.5">
                    {lang === 'bn' ? 'টপ ক্যাটাগরিসমূহ' : 'Top Categories'}
                  </h3>
                  {/* Subtle navigation arrows */}
                  <div className="flex items-center gap-1 ml-1">
                    <button
                      onClick={() => scrollCategories('left')}
                      disabled={!canScrollLeft}
                      className={`p-1 rounded-lg border text-[9px] transition-all ${
                        canScrollLeft
                          ? 'bg-white hover:bg-emerald-50 border-gray-300 text-gray-700 shadow-xs cursor-pointer active:scale-90'
                          : 'bg-gray-100 border-gray-200 text-gray-300 opacity-40 cursor-not-allowed'
                      }`}
                      title="বামে স্ক্রোল করুন"
                    >
                      <ChevronLeft className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => scrollCategories('right')}
                      disabled={!canScrollRight}
                      className={`p-1 rounded-lg border text-[9px] transition-all ${
                        canScrollRight
                          ? 'bg-white hover:bg-emerald-50 border-gray-300 text-gray-700 shadow-xs cursor-pointer active:scale-90'
                          : 'bg-gray-100 border-gray-200 text-gray-300 opacity-40 cursor-not-allowed'
                      }`}
                      title="ডানে স্ক্রোল করুন"
                    >
                      <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {selectedTopCategoryId ? (
                  <button 
                    onClick={() => {
                      setSelectedTopCategoryId(null);
                      setActiveProductFilter('all');
                      setShowToast(lang === 'bn' ? 'সকল পণ্য প্রদর্শিত হচ্ছে' : 'Showing all products');
                    }}
                    className="text-[9px] sm:text-[10px] font-bold text-red-600 hover:underline flex items-center gap-1 cursor-pointer bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-lg border border-red-200"
                  >
                    <X className="w-3 h-3" />
                    {lang === 'bn' ? 'ফিল্টার রিসেট' : 'Reset Filter'}
                  </button>
                ) : (
                  <button 
                    onClick={() => setActiveTab('services')}
                    className="text-[9px] sm:text-[10px] font-extrabold text-[#16a34a] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    {lang === 'bn' ? 'সকল সেবা ➔' : 'All Services ➔'}
                  </button>
                )}
              </div>

              {/* অনুভূমিক স্ক্রোলেবল ক্যাটাগরি বার with smooth drag/touch & indicator overlays */}
              <div className="relative group">
                {/* Floating Left Arrow Indicator */}
                {canScrollLeft && (
                  <button
                    onClick={() => scrollCategories('left')}
                    className="absolute -left-1 top-1/2 -translate-y-1/2 z-20 w-7 h-7 bg-white/95 backdrop-blur-xs border border-gray-200 text-gray-700 rounded-full shadow-md flex items-center justify-center hover:bg-emerald-50 hover:text-[#16a34a] active:scale-90 transition-all cursor-pointer"
                    title="বামে দেখুন"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                )}

                {/* Categories container */}
                <div 
                  ref={categoryScrollRef}
                  onScroll={checkCategoryScroll}
                  role="tablist"
                  aria-label={lang === 'bn' ? 'টপ ক্যাটাগরিসমূহ' : 'Top categories list'}
                  className="category-scroll-container flex items-center gap-3 flex-nowrap scroll-smooth py-1.5 px-1 select-none"
                  style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' }}
                >
                  {ESSENTIAL_15_CATEGORIES.map((cat) => {
                    const isSelected = selectedTopCategoryId === cat.id;
                    const label = lang === 'bn' ? cat.nameBn : cat.nameEn;
                    
                    return (
                      <button
                        key={cat.id}
                        id={`top-cat-${cat.id}`}
                        role="tab"
                        aria-selected={isSelected}
                        aria-label={label}
                        onClick={() => handleSelectTopCategory(cat.id)}
                        className={`group flex flex-col items-center shrink-0 transition-all duration-200 cursor-pointer select-none ${
                          isSelected ? 'scale-105' : 'hover:scale-102'
                        }`}
                        title={label}
                      >
                        {/* 3D-Style Icon Badge with Realistic Elevation & Specular Highlight */}
                        <div
                          className={`w-12 h-12 sm:w-13 sm:h-13 rounded-2xl flex items-center justify-center transition-all duration-200 ${
                            isSelected
                              ? 'bg-gradient-to-br from-emerald-500 via-[#16a34a] to-emerald-700 text-white shadow-[inset_0_1.5px_1px_rgba(255,255,255,0.7),0_6px_14px_rgba(22,163,74,0.35)] ring-2 ring-emerald-500 ring-offset-1'
                              : 'bg-white shadow-md hover:shadow-lg border border-gray-200/80 hover:border-emerald-200'
                          }`}
                        >
                          <div className={isSelected ? 'text-white drop-shadow-xs' : cat.iconColor}>
                            {cat.icon}
                          </div>
                        </div>

                        {/* Concise Category Label */}
                        <span
                          className={`text-[9px] sm:text-[9.5px] font-extrabold mt-1.5 max-w-[72px] text-center leading-tight truncate ${
                            isSelected ? 'text-[#16a34a] font-black' : 'text-gray-800'
                          }`}
                        >
                          {label}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Floating Right Arrow Indicator */}
                {canScrollRight && (
                  <button
                    onClick={() => scrollCategories('right')}
                    className="absolute -right-1 top-1/2 -translate-y-1/2 z-20 w-7 h-7 bg-white/95 backdrop-blur-xs border border-gray-200 text-gray-700 rounded-full shadow-md flex items-center justify-center hover:bg-emerald-50 hover:text-[#16a34a] active:scale-90 transition-all cursor-pointer"
                    title="ডানে আরও ক্যাটাগরি দেখুন"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Active Filter Indicator Badge */}
              {selectedTopCategoryId && (
                <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-2.5 py-1 text-[8.5px] text-emerald-900 animate-fadeIn">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="font-medium text-gray-500">
                      {lang === 'bn' ? 'ফিল্টার:' : 'Filter:'}
                    </span>
                    <span className="font-black text-emerald-800">
                      {lang === 'bn' 
                        ? ESSENTIAL_15_CATEGORIES.find(c => c.id === selectedTopCategoryId)?.nameBn 
                        : ESSENTIAL_15_CATEGORIES.find(c => c.id === selectedTopCategoryId)?.nameEn}
                    </span>
                    <span className="text-[7.5px] bg-emerald-200/70 text-emerald-900 px-1.5 py-0.2 rounded-full font-bold">
                      {filteredProducts.length} {lang === 'bn' ? 'টি আইটেম' : 'items'}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedTopCategoryId(null);
                      setActiveProductFilter('all');
                    }}
                    className="text-emerald-700 hover:text-emerald-900 font-bold hover:underline shrink-0 ml-2 cursor-pointer"
                  >
                    ✕ {lang === 'bn' ? 'সকল দেখুন' : 'Show All'}
                  </button>
                </div>
              )}
            </div>

            {/* সার্চ রেজাল্ট সক্রিয় ব্যানার (সরাসরি স্ক্রিনে লাইভ ফিল্টার) */}
            {homepageSearchQuery.trim() && (
              <div className="bg-emerald-50/95 border border-emerald-200/90 p-2.5 rounded-2xl flex items-center justify-between shadow-2xs">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-xl bg-[#2EAA26] text-white flex items-center justify-center shrink-0 shadow-xs">
                    {isSupabaseSearching ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[7.5px] font-black uppercase tracking-wider px-1.5 py-0.5 bg-emerald-200/70 text-emerald-900 rounded">
                        {isSupabaseSearching ? 'ডাটাবেজে খোঁজা হচ্ছে...' : 'লাইভ সার্বজনীন সার্চ'}
                      </span>
                      <span className="text-[8px] text-gray-500 font-bold">
                        (পণ্য: {filteredProducts.length} | সেবা: {filteredServices.totalCount} | রক্তদাতা: {filteredGlobalBloodDonors.length} | সার্কুলার: {searchedJobCirculars.length} | চাকরিপ্রার্থী: {searchedJobSeekers.length})
                      </span>
                    </div>
                    <p className="text-[10px] font-black text-gray-900 truncate mt-0.5">
                      "{homepageSearchQuery.trim()}" — ৫টি ডাটাবেজ টেবিল থেকে মোট {totalGlobalSearchResultsCount}টি তথ্য পাওয়া গেছে
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setHomepageSearchQuery('');
                    setSupabaseGlobalResults(null);
                  }}
                  className="text-[8px] font-bold text-red-600 hover:text-red-700 bg-white hover:bg-red-50 border border-red-200 px-2 py-1 rounded-xl shrink-0 flex items-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
                  title="সার্চ মুছুন"
                >
                  <X className="w-2.5 h-2.5" />
                  <span>মুছুন</span>
                </button>
              </div>
            )}

            {/* সার্বজনীন শূন্য ফলাফল স্টেট (যদি ৫টি টেবিলের কোনোটিতেই তথ্য না মেলে) */}
            {homepageSearchQuery.trim() && totalGlobalSearchResultsCount === 0 && !isSupabaseSearching && (
              <div className="bg-white p-5 rounded-2xl border border-gray-200/90 text-center space-y-3 shadow-xs">
                <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-50 text-amber-700 flex items-center justify-center border border-amber-200">
                  <Search className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-gray-900">
                    "{homepageSearchQuery.trim()}" এর কোনো তথ্য পাওয়া যায়নি
                  </h4>
                  <p className="text-[10px] text-gray-500 mt-1 max-w-sm mx-auto">
                    সুপাবেস ডাটাবেজের পণ্য, সেবা, রক্তদাতা, সার্কুলার বা চাকরিপ্রার্থী তালিকায় কোনো মিল পাওয়া যায়নি। বানান যাচাই করুন অথবা এআই অ্যাসিস্ট্যান্টের সাহায্য নিন।
                  </p>
                </div>
                <div className="flex items-center justify-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => {
                      setIsGeminiModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-[#0A6A32] hover:bg-emerald-800 text-white rounded-xl text-[9px] font-bold flex items-center gap-1.5 shadow-xs cursor-pointer"
                  >
                    <Sparkles className="w-3 h-3 text-amber-300" />
                    <span>এআই দিয়ে অনুসন্ধান করুন</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setHomepageSearchQuery('');
                      setSupabaseGlobalResults(null);
                    }}
                    className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-[9px] font-bold cursor-pointer"
                  >
                    সার্চ রিসেট করুন
                  </button>
                </div>
              </div>
            )}

            {/* খুঁজে পাওয়া সেবা ও কারিগর (সার্চ অনুযায়ী সার্ভিস ও প্রফেশনাল ফলাফল) */}
            {homepageSearchQuery.trim() && filteredServices.totalCount > 0 && (
              <div className="bg-white p-3 rounded-2xl border border-emerald-200/80 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                  <h4 className="text-[10.5px] font-black text-gray-900 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-[#2EAA26]" />
                    <span>খুঁজে পাওয়া সেবা ও কারিগর ({filteredServices.totalCount})</span>
                  </h4>
                  <span className="text-[7.5px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                    ইনস্ট্যান্ট বুকিং ও কল
                  </span>
                </div>

                {/* পেশাজীবী কার্ড তালিকা */}
                {filteredServices.professionals.length > 0 && (
                  <div className="space-y-2">
                    {filteredServices.professionals.slice(0, 4).map((pro) => (
                      <div 
                        key={pro.id}
                        onClick={() => openProfessionalPortfolioModal(pro)}
                        className="p-2 rounded-xl bg-gray-50/70 hover:bg-emerald-50/40 border border-gray-200/80 hover:border-emerald-300 transition-all flex items-center justify-between gap-2 cursor-pointer group"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="relative shrink-0">
                            <img src={pro.img} alt={pro.name} className="w-9 h-9 rounded-xl object-cover border border-emerald-100 shadow-2xs" />
                            {pro.verified && (
                              <div className="absolute -bottom-1 -right-1 bg-[#2EAA26] text-white rounded-full p-0.5 shadow-2xs" title="ভেরিফাইড">
                                <ShieldCheck className="w-2 h-2" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1">
                              <h5 className="text-[9.5px] font-black text-gray-900 truncate group-hover:text-[#2EAA26] transition-colors">
                                {pro.name}
                              </h5>
                              <span className="text-[6.5px] font-bold bg-white text-emerald-700 px-1 py-0.2 rounded border border-gray-200">
                                {pro.job}
                              </span>
                            </div>
                            <p className="text-[7.5px] text-gray-500 truncate mt-0.5">
                              📍 {pro.upazila || pro.district} {pro.area ? `(${pro.area})` : ''} • রেটিং: ⭐ {pro.rating || 5}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openProfessionalPortfolioModal(pro);
                            }}
                            className="text-[7.5px] font-bold text-gray-700 hover:text-emerald-800 bg-white border border-gray-200 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                          >
                            প্রোফাইল
                          </button>
                          <a
                            href={`tel:${pro.phone?.replace(/[^\d+]/g, '')}`}
                            onClick={(e) => e.stopPropagation()}
                            className="bg-[#2EAA26] hover:bg-emerald-700 text-white text-[7.5px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs active:scale-95 transition-all"
                          >
                            <Phone className="w-2 h-2" /> যোগাযোগ করুন
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* ক্যাটালগ সার্ভিস তালিকা */}
                {filteredServices.catalogServices.length > 0 && (
                  <div className="pt-1 border-t border-gray-100">
                    <span className="text-[8px] font-bold text-gray-500 block mb-1">প্রয়োজনীয় সার্ভিস ক্যাটালগ:</span>
                    <div className="grid grid-cols-2 gap-1.5">
                      {filteredServices.catalogServices.slice(0, 4).map((srv, idx) => (
                        <div
                          key={idx}
                          className="bg-gray-50/80 p-1.5 rounded-lg border border-gray-200 flex items-center justify-between gap-1"
                        >
                          <div className="min-w-0">
                            <p className="text-[8px] font-bold text-gray-800 truncate">{srv.name}</p>
                            <span className="text-[6.5px] text-emerald-600 font-semibold truncate block">{srv.category}</span>
                          </div>
                          <a
                            href="tel:01831888402"
                            className="bg-emerald-100 hover:bg-emerald-200 text-emerald-800 text-[7px] font-bold px-1.5 py-0.5 rounded shrink-0 transition-colors"
                          >
                            বুকিং
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* খুঁজে পাওয়া রক্তদাতা (হোমপেজ গ্লোবাল সার্চে সারা দেশের রক্তদাতা ফলাফল) */}
            {homepageSearchQuery.trim() && filteredGlobalBloodDonors.length > 0 && (
              <div className="bg-white p-3 rounded-2xl border border-red-200/90 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                  <h4 className="text-[10.5px] font-black text-gray-900 flex items-center gap-1.5">
                    <span className="text-red-600">🩸</span>
                    <span>খুঁজে পাওয়া রক্তদাতা ({filteredGlobalBloodDonors.length})</span>
                  </h4>
                  <span className="text-[7.5px] font-bold text-red-700 bg-red-50 px-2 py-0.5 rounded-full border border-red-100">
                    জরুরি কল ও যোগাযোগ
                  </span>
                </div>

                <div className="space-y-1.5">
                  {filteredGlobalBloodDonors.slice(0, 4).map((donor: any) => (
                    <div
                      key={donor.id}
                      className="p-2 rounded-xl bg-red-50/30 border border-red-100 flex items-center justify-between gap-2"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-8 h-8 rounded-lg bg-red-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                          {donor.bloodGroup}
                        </div>
                        <div className="min-w-0">
                          <h5 className="text-[9.5px] font-black text-gray-900 truncate">
                            {donor.name}
                          </h5>
                          <p className="text-[7.5px] text-gray-500 truncate flex items-center gap-1">
                            <MapPin className="w-2 h-2 text-red-500" />
                            <span>{[donor.area, donor.upazila, donor.district].filter(Boolean).join(', ')}</span>
                          </p>
                        </div>
                      </div>
                      <a
                        href={`tel:${donor.phone?.replace(/[^\d+]/g, '')}`}
                        className="h-7 px-2.5 bg-red-600 hover:bg-red-700 active:scale-95 text-white rounded-lg text-[9px] font-black flex items-center gap-1 shrink-0 shadow-2xs transition-all"
                      >
                        <Phone className="w-2.5 h-2.5" />
                        <span>যোগাযোগ করুন</span>
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* খুঁজে পাওয়া চাকরির নিয়োগ সার্কুলার (সুপাবেস ডাটাবেজ) */}
            {homepageSearchQuery.trim() && searchedJobCirculars.length > 0 && (
              <div className="bg-white p-3 rounded-2xl border border-blue-200/90 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                  <h4 className="text-[10.5px] font-black text-gray-900 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                    <span>খুঁজে পাওয়া চাকরির সার্কুলার ({searchedJobCirculars.length})</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('jobs');
                      window.scrollTo({ top: 0, behavior: 'smooth' });
                    }}
                    className="text-[7.5px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 px-2 py-0.5 rounded-full border border-blue-200 cursor-pointer"
                  >
                    চাকরি পোর্টাল দেখুন
                  </button>
                </div>

                <div className="space-y-1.5">
                  {searchedJobCirculars.slice(0, 3).map((job: any) => (
                    <div
                      key={job.id}
                      className="p-2 rounded-xl bg-blue-50/30 border border-blue-100 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h5 className="text-[9.5px] font-black text-gray-900 truncate">
                            {job.title}
                          </h5>
                          <span className="text-[6.5px] font-bold bg-white text-blue-700 px-1 py-0.2 rounded border border-blue-200">
                            {job.job_type || job.jobType || 'ফুল-টাইম'}
                          </span>
                        </div>
                        <p className="text-[7.5px] text-gray-500 truncate mt-0.5">
                          🏢 {job.company_name || job.companyName || 'নিয়োগকারী প্রতিষ্ঠান'} • 📍 {[job.upazila, job.district].filter(Boolean).join(', ') || 'পার্বত্য চট্টগ্রাম'}
                        </p>
                        <p className="text-[7px] text-emerald-700 font-bold">
                          বেতন: {job.salary_range || job.salary || 'আলোচনা সাপেক্ষে'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveTab('jobs');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                          }}
                          className="text-[7.5px] font-bold text-blue-700 bg-white border border-blue-200 px-2 py-1 rounded-lg hover:bg-blue-50 cursor-pointer"
                        >
                          বিস্তারিত
                        </button>
                        {(job.contact_phone || job.contactPhone) && (
                          <a
                            href={`tel:${job.contact_phone || job.contactPhone}`}
                            className="bg-blue-600 hover:bg-blue-700 text-white text-[7.5px] font-black px-2 py-1 rounded-lg flex items-center gap-1 shadow-2xs active:scale-95 transition-all"
                          >
                            <Phone className="w-2 h-2" /> কল
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* খুঁজে পাওয়া চাকরিপ্রার্থী ও সিভি (সুপাবেস ডাটাবেজ) */}
            {homepageSearchQuery.trim() && searchedJobSeekers.length > 0 && (
              <div className="bg-white p-3 rounded-2xl border border-purple-200/90 shadow-2xs space-y-2.5">
                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                  <h4 className="text-[10.5px] font-black text-gray-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-purple-600" />
                    <span>খুঁজে পাওয়া চাকরিপ্রার্থী ({searchedJobSeekers.length})</span>
                  </h4>
                  <span className="text-[7.5px] font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                    দক্ষ কর্মীবাহিনী
                  </span>
                </div>

                <div className="space-y-1.5">
                  {searchedJobSeekers.slice(0, 3).map((candidate: any) => (
                    <div
                      key={candidate.id}
                      className="p-2 rounded-xl bg-purple-50/30 border border-purple-100 flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h5 className="text-[9.5px] font-black text-gray-900 truncate">
                            {candidate.full_name || candidate.name || 'চাকরিপ্রার্থী'}
                          </h5>
                          <span className="text-[6.5px] font-bold bg-white text-purple-700 px-1 py-0.2 rounded border border-purple-200">
                            {candidate.desired_role || candidate.profession || 'প্রার্থী'}
                          </span>
                        </div>
                        <p className="text-[7.5px] text-gray-500 truncate mt-0.5">
                          🎓 {candidate.education_level || candidate.education || 'শিক্ষাগত যোগ্যতা'} • 📍 {[candidate.upazila, candidate.district].filter(Boolean).join(', ') || 'পার্বত্য চট্টগ্রাম'}
                        </p>
                        <p className="text-[7px] text-purple-700 font-medium">
                          অভিজ্ঞতা: {candidate.experience_years || candidate.experience || '১ বছর'} • প্রত্যাশিত বেতন: {candidate.expected_salary || 'আলোচনা সাপেক্ষে'}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {candidate.phone && (
                          <a
                            href={`tel:${candidate.phone.replace(/[^\d+]/g, '')}`}
                            className="bg-purple-600 hover:bg-purple-700 text-white text-[7.5px] font-black px-2.5 py-1 rounded-lg flex items-center gap-1 shadow-2xs active:scale-95 transition-all"
                          >
                            <Phone className="w-2 h-2" /> যোগাযোগ করুন
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ৩. ২০+ পণ্যের বিশাল সমাহার (20+ Diverse Products with High Quality Images) */}
            <div className="space-y-2 pt-0.5">
              {/* Product Category Filter Pills */}
              <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-black text-gray-800 uppercase flex items-center gap-1">
                  <ShoppingCart className="w-3 h-3 text-[#2EAA26]" />
                  পাহাড়ি পণ্য সম্ভার ({filteredProducts.length})
                </h3>
                {activeProductFilter !== 'all' && (
                  <button 
                    onClick={() => {
                      setActiveProductFilter('all');
                      setSelectedTopCategoryId(null);
                    }}
                    className="text-[8px] font-bold text-emerald-700 hover:underline cursor-pointer"
                  >
                    সকল পণ্য দেখুন
                  </button>
                )}
              </div>

              {/* Horizontal Scrollable Category Filter Menu */}
              <div className="relative group/filter">
                {/* Left Scroll Arrow */}
                {canScrollFilterLeft && (
                  <button
                    onClick={() => scrollProductFilter('left')}
                    className="absolute -left-1.5 top-1/2 -translate-y-1/2 z-20 w-5 h-5 bg-white/95 backdrop-blur-xs border border-gray-200 text-gray-700 rounded-full shadow-md flex items-center justify-center hover:bg-emerald-50 hover:text-[#0A6A32] active:scale-90 transition-all cursor-pointer"
                    title="বামে স্ক্রোল করুন"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </button>
                )}

                {/* Horizontally Scrollable Tabs (15 exact admin categories + All) */}
                <div 
                  ref={productFilterScrollRef}
                  onScroll={checkProductFilterScroll}
                  role="tablist"
                  aria-label={lang === 'bn' ? 'পণ্য ক্যাটাগরি ফিল্টার' : 'Product category filter tabs'}
                  className="flex items-center gap-1.5 overflow-x-auto no-scrollbar scroll-smooth py-1 px-0.5 select-none"
                  style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' }}
                >
                  {PRODUCT_FILTER_TABS.map(tab => {
                    const isActive = activeProductFilter === tab.key;
                    const label = lang === 'bn' ? tab.nameBn : tab.nameEn;

                    return (
                      <button
                        key={tab.key}
                        id={`product-tab-${tab.key}`}
                        role="tab"
                        aria-selected={isActive}
                        aria-label={label}
                        onClick={() => {
                          if (tab.key === 'jobs') {
                            setActiveTab('jobs');
                            window.scrollTo({ top: 0, behavior: 'smooth' });
                            return;
                          }
                          setActiveProductFilter(tab.key);
                          setSelectedTopCategoryId(null);
                        }}
                        className={`px-3 py-1.5 rounded-xl text-[9px] font-bold whitespace-nowrap transition-all duration-200 cursor-pointer shrink-0 shadow-2xs active:scale-95 ${
                          isActive
                            ? 'bg-[#0A6A32] text-white shadow-xs font-black ring-2 ring-emerald-600/30'
                            : 'bg-white text-gray-700 border border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50 hover:text-[#0A6A32]'
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {/* Right Scroll Arrow */}
                {canScrollFilterRight && (
                  <button
                    onClick={() => scrollProductFilter('right')}
                    className="absolute -right-1.5 top-1/2 -translate-y-1/2 z-20 w-5 h-5 bg-white/95 backdrop-blur-xs border border-gray-200 text-gray-700 rounded-full shadow-md flex items-center justify-center hover:bg-emerald-50 hover:text-[#0A6A32] active:scale-90 transition-all cursor-pointer"
                    title="ডানে স্ক্রোল করুন"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* ২৪+ পণ্য গ্রিড লেআউট */}
              {isProductsLoading && filteredProducts.length === 0 ? (
                <div 
                  data-product-grid="true"
                  className={`grid ${isAdminPreview ? 'grid-cols-2 gap-2' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4'}`}
                >
                  {[1, 2, 3, 4].map(idx => (
                    <div key={idx} className="bg-white p-2.5 rounded-2xl border border-gray-100 shadow-2xs animate-pulse space-y-2">
                      <div className="w-full h-24 bg-gray-200/80 rounded-xl"></div>
                      <div className="h-3 bg-gray-200/80 rounded-md w-3/4"></div>
                      <div className="h-2 bg-gray-100 rounded-md w-1/2"></div>
                      <div className="flex justify-between items-center pt-2">
                        <div className="h-3 bg-emerald-100 rounded-md w-1/3"></div>
                        <div className="w-6 h-6 bg-gray-200/80 rounded-xl"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 text-center space-y-3 shadow-xs">
                  <div className="w-12 h-12 mx-auto rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-700 border border-emerald-100">
                    <Package className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-gray-900">
                      {homepageSearchQuery.trim() 
                        ? (lang === 'bn' ? `"${homepageSearchQuery.trim()}" এর কোনো পণ্য মেলেনি` : `No products matching "${homepageSearchQuery.trim()}"`)
                        : (lang === 'bn' ? 'এই ক্যাটাগরিতে বর্তমানে কোনো পণ্য নেই' : 'No products found in this category')}
                    </h4>
                    <p className="text-[10px] text-gray-500 mt-1 max-w-xs mx-auto">
                      {homepageSearchQuery.trim()
                        ? (lang === 'bn' ? 'বানান যাচাই করে আবার চেষ্টা করুন অথবা নিচের জনপ্রিয় কি-ওয়ার্ডে ট্যাপ করুন।' : 'Check spelling or explore suggested popular keywords below.')
                        : (lang === 'bn' ? 'অনুগ্রহ করে ফিল্টার পরিবর্তন করুন অথবা সকল পণ্য দেখুন।' : 'Please reset filter to browse all available items.')}
                    </p>
                  </div>

                  {/* Suggestion Chips */}
                  <div className="flex flex-wrap items-center justify-center gap-1.5 pt-1">
                    <span className="text-[9px] font-semibold text-gray-500 mr-1">
                      {lang === 'bn' ? 'জনপ্রিয়:' : 'Popular:'}
                    </span>
                    {['খাঁটি মধু', 'পাহাড়ি হলুদ', 'ইলেকট্রিশিয়ান', 'চান্দের গাড়ি', 'A+ রক্ত'].map((sug) => (
                      <button
                        key={sug}
                        type="button"
                        onClick={() => {
                          setHomepageSearchQuery(sug);
                          setSelectedTopCategoryId(null);
                          setActiveProductFilter('all');
                        }}
                        className="text-[9px] font-bold px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200/80 transition-all cursor-pointer active:scale-95"
                      >
                        {sug}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center justify-center gap-2 pt-2 border-t border-gray-100">
                    <button 
                      onClick={() => {
                        setActiveProductFilter('all');
                        setSelectedTopCategoryId(null);
                        setHomepageSearchQuery('');
                      }}
                      className="text-[9.5px] font-bold text-white bg-[#16a34a] hover:bg-emerald-700 px-3.5 py-1.5 rounded-xl shadow-xs transition-all active:scale-95 cursor-pointer"
                    >
                      {lang === 'bn' ? 'সকল ফিল্টার রিসেট করুন' : 'Reset All Filters'}
                    </button>
                    {refreshProducts && (
                      <button 
                        onClick={() => refreshProducts()}
                        className="text-[9.5px] font-bold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-3 py-1.5 rounded-xl border border-emerald-200 transition-colors cursor-pointer"
                      >
                        {lang === 'bn' ? 'পুনরায় লোড' : 'Reload'}
                      </button>
                    )}
                  </div>
                </div>
              ) : (
                <div 
                  data-product-grid="true"
                  className={`grid ${isAdminPreview ? 'grid-cols-2 gap-2' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4'}`}
                >
                  {filteredProducts.map((p) => {
                    const origPrice = Number((p as any).original_price || p.originalPrice || 0);
                    const curPrice = Number((p as any).discount_price || p.price || 0);
                    const hasGenuineDiscount = origPrice > 0 && curPrice > 0 && origPrice > curPrice;
                    const discount = hasGenuineDiscount ? Math.round(((origPrice - curPrice) / origPrice) * 100) : 0;
                    return (
                      <div 
                        key={p.id} 
                        onClick={() => handleOpenProductDetails(p)}
                        className="bg-white p-2 rounded-2xl border border-gray-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between cursor-pointer group relative overflow-hidden"
                      >
                        {/* Image Container with Badges */}
                        <div className="relative w-full h-32 bg-slate-100 rounded-md overflow-hidden mb-1.5 shrink-0">
                          <img 
                            src={getProductPublicUrl((p as any).products_photos || p.image)} 
                            alt={p.nameBn} 
                            className="w-full h-32 object-cover rounded-md group-hover:scale-105 transition-transform duration-300" 
                            onError={(e) => {
                              const target = e.currentTarget as HTMLImageElement;
                              target.onerror = null;
                              target.src = NO_IMAGE_AVAILABLE_ICON;
                            }}
                          />
                          {/* Origin Pin */}
                          {Boolean(p.origin) && (
                            <span className="absolute top-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-white text-[6.5px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-0.5">
                              <MapPin className="w-2 h-2 text-amber-300" />
                              {p.origin.split(' ')[0]}
                            </span>
                          )}
                          
                          {/* Discount / Custom Badge */}
                          {hasGenuineDiscount && discount > 0 ? (
                            <span className="absolute top-1.5 right-1.5 bg-red-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded-md shadow-xs">
                              {discount}% ছাড়
                            </span>
                          ) : p.badge ? (
                            <span className={`absolute top-1.5 right-1.5 ${p.badgeColor || 'bg-emerald-600'} text-white text-[6.5px] font-bold px-1.5 py-0.5 rounded-md shadow-xs`}>
                              {p.badge}
                            </span>
                          ) : null}
                        </div>

                        {/* Title & Category Info */}
                        <div className="space-y-0.5">
                          <span className="text-[7px] font-black text-emerald-700 uppercase bg-emerald-50 px-1.5 py-0.2 rounded-md inline-block">
                            {p.categoryLabelBn}
                          </span>
                          <h4 className="text-[9px] font-black text-gray-900 leading-snug line-clamp-2 mt-0.5">
                            {p.nameBn}
                          </h4>
                          <p className="text-[7.5px] text-gray-400 font-medium truncate">
                            {p.unit}
                          </p>

                          {/* Rating & Review - Only display if there are real reviews */}
                          {Boolean(p.reviewsCount && Number(p.reviewsCount) > 0) && (
                            <div className="flex items-center gap-1 pt-0.5">
                              <Star className="w-2.5 h-2.5 text-amber-500 fill-amber-500" />
                              <span className="text-[8px] font-black text-gray-800">{p.rating}</span>
                              <span className="text-[7px] text-gray-400">({p.reviewsCount})</span>
                            </div>
                          )}
                        </div>

                        {/* Price & Add to Cart button */}
                        <div className="flex items-center justify-between pt-2 mt-1 border-t border-gray-100">
                          <div className="flex flex-col">
                            <span className="text-[10.5px] font-black text-[#2EAA26] leading-none">
                              ৳ {curPrice}
                            </span>
                            {hasGenuineDiscount && (
                              <span className="text-[7.5px] text-gray-400 line-through font-bold">
                                ৳ {origPrice}
                              </span>
                            )}
                          </div>

                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleAddToCart(p, 1);
                            }}
                            className="bg-[#2EAA26] hover:bg-emerald-700 active:scale-90 text-white p-1.5 rounded-xl shadow-xs transition-transform flex items-center justify-center"
                            title="কার্টে যোগ করুন"
                          >
                            <ShoppingCart className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= (খ) খোঁজ: সরাসরি ডাটাবেস ম্যানুয়াল সার্চ পোর্টাল ================= */}
        {activeTab === 'search' && (
          <ManualSearchPortal 
            lang={lang}
            onViewProduct={(product) => handleOpenProductDetails(product)}
            onViewWorkerProfile={(provider) => handleOpenDigitalProfile(provider)}
            onViewDonorProfile={(donor) => handleOpenDigitalProfile(donor)}
            onBackToHome={() => {
              setActiveTab('home');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onShowToast={(msg) => setShowToast(msg)}
            onNavigateToBloodDonorRegistration={(phone?: string) => {
              if (phone) {
                setRegistrationInitialPhone(phone);
              }
              handleRegisterNavigation('blood_donor', phone);
            }}
            onNavigateToRegistration={(targetTab?: any, phone?: string) => {
              if (phone) {
                setRegistrationInitialPhone(phone);
              }
              handleRegisterNavigation(targetTab || 'seller', phone);
            }}
          />
        )}

        {/* ================= (খ-২) লিগ্যাসি সার্চ পেজ ================= */}
        {((activeTab as string) === 'legacy_search_deprecated') && (
          <div className="w-full flex flex-col bg-white">
            <div className="px-3.5 py-3 sm:px-6 flex flex-col items-center space-y-3 pb-12 w-full max-w-md mx-auto">
              
              {/* অফলাইন নোটিশ কার্ড */}
              {!isOnline && (
                <div className="w-full text-left">
                  <OfflineFallbackCard 
                    title="অফলাইন মোডে সার্চ সক্রিয়"
                    description="ইন্টারনেট সংযোগ ছাড়াই ডিভাইসে সংরক্ষিত ৬৪ জেলা, পণ্য, রক্তদাতা, পুলিশ ও অ্যাম্বুলেন্সের তথ্য সার্চ এবং সরাসরি ফোন করতে পারছেন।"
                    onRetry={checkConnection}
                  />
                </div>
              )}

              {/* ১. টপ ব্যানার ইমেজ (নির্বাচিত ৩টি ট্যাবের সাথে মিল রেখে স্লিক ওয়াইড ব্যানার) */}
              <div className="w-full relative h-20 sm:h-24 rounded-2xl overflow-hidden shadow-2xs border border-gray-200">
                <img 
                  src={
                    searchMode === 'services' 
                      ? "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800&auto=format&fit=crop&q=80"
                      : searchMode === 'products'
                      ? "https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=80"
                      : "https://images.unsplash.com/photo-1615461066841-6116e61058f4?w=800&auto=format&fit=crop&q=80"
                  } 
                  alt={searchMode}
                  className="w-full h-full object-cover" 
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/45 to-transparent flex items-center p-3 sm:p-4">
                  <div className="text-white space-y-0.5 text-left">
                    <span className="text-[7.5px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-xs">
                      {searchMode === 'services' && 'পেশাজীবী ও কারিগর ডিরেক্টরি'}
                      {searchMode === 'products' && 'অনলাইন মার্কেটপ্লেস ও পণ্য'}
                      {searchMode === 'blood' && 'স্বেচ্ছাসেবী রক্তদাতা নেটওয়ার্ক'}
                    </span>
                    <h3 className="text-xs sm:text-sm font-black text-white drop-shadow-xs">
                      {searchMode === 'services' && 'প্রয়োজনীয় দক্ষ পেশাজীবী খুঁজুন'}
                      {searchMode === 'products' && 'সরাসরি উৎপাদক ও বিশ্বস্ত পণ্য খুঁজুন'}
                      {searchMode === 'blood' && 'জরুরি প্রয়োজনে রক্তদাতা খুঁজুন'}
                    </h3>
                  </div>
                </div>
              </div>

              {/* ৩. প্রাইমারি ৩টি ক্যাটাগরি নেভিগেশন ট্যাব (সেবা, পণ্য, ব্ল্যাড) */}
              <div className="w-full grid grid-cols-3 gap-1.5 p-1 bg-slate-100 rounded-2xl border border-slate-200 shadow-2xs">
                <button
                  type="button"
                  onClick={() => {
                    setSearchMode('services');
                    setSelectedCategoryJob('');
                    setHasSearched(true);
                  }}
                  className={`py-2 px-1 rounded-xl text-[9px] font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    searchMode === 'services'
                      ? 'bg-[#2EAA26] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span className="text-xs">🛠️</span>
                  <span>সেবা</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setSearchMode('products');
                    setSelectedCategoryJob('');
                    setHasSearched(true);
                  }}
                  className={`py-2 px-1 rounded-xl text-[9px] font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    searchMode === 'products'
                      ? 'bg-[#2EAA26] text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span className="text-xs">🛍️</span>
                  <span>পণ্য</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleOpenBloodSearch('signin');
                  }}
                  className={`py-2 px-1 rounded-xl text-[9px] font-black flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                    searchMode === 'blood'
                      ? 'bg-red-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  }`}
                >
                  <span className="text-xs">🩸</span>
                  <span>রক্ত</span>
                </button>
              </div>

              {/* ৪. সার্চ ও ফিল্টারিং এরিয়া (৩টি ট্যাবের ফিল্টার) */}
              <div className="w-full space-y-2.5 bg-slate-50 p-3 sm:p-3.5 rounded-2xl border border-gray-200 shadow-sm text-left">
                
                {/* ১. সেবা (Service) ট্যাব: ১,০০০ পেশার লাইভ অটো-কমপ্লিট ড্রপডাউন ও ৬টি কোর ক্যাটাগরি */}
                {searchMode === 'services' && (
                  <div className="space-y-2">
                    {/* সার্চ কিওয়ার্ড ও অটো-সাজেশন ইনপুট */}
                    <div ref={searchContainerRef} className="relative">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[7.5px] font-extrabold text-gray-600 flex items-center gap-1">
                          <Wrench className="w-2.5 h-2.5 text-[#2EAA26]" />
                          <span>পেশা বা কাজের ধরন (১,০০০টি পেশার লাইভ অটো-কমপ্লিট):</span>
                        </label>
                        {(navSearchQuery || selectedCategoryJob) && (
                          <button 
                            type="button"
                            onClick={() => {
                              setNavSearchQuery('');
                              setSelectedCategoryJob('');
                            }}
                            className="text-red-600 hover:underline font-bold text-[7.5px] cursor-pointer"
                          >
                            ক্লিয়ার
                          </button>
                        )}
                      </div>

                      <div className={`bg-white border ${isListeningVoice ? 'border-red-400 ring-2 ring-red-200 bg-red-50/20' : 'border-gray-300 focus-within:border-[#2EAA26]'} rounded-xl p-1.5 flex items-center gap-1.5 shadow-2xs transition-all`}>
                        <Search className={`w-3.5 h-3.5 shrink-0 transition-colors ${isListeningVoice ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
                        <input
                          type="text"
                          value={navSearchQuery}
                          onChange={(e) => {
                            setNavSearchQuery(sanitizeSearchQuery(e.target.value));
                            setSelectedCategoryJob('');
                            setShowSearchSuggestions(true);
                          }}
                          onFocus={() => setShowSearchSuggestions(true)}
                          onClick={() => setShowSearchSuggestions(true)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              setShowSearchSuggestions(false);
                              setSelectedCategoryJob('');
                              setHasSearched(true);
                            }
                          }}
                          placeholder={isListeningVoice ? "🎙️ শুনছি... সেবা বা পেশা মুখে বলুন..." : "১,০০০টি পেশার মধ্য থেকে খুঁজুন বা যেকোনো কাস্টম সেবা লিখুন..."}
                          className="w-full text-[9.5px] bg-transparent outline-none font-bold text-gray-800 placeholder:text-gray-400 placeholder:font-normal"
                        />

                        {/* ইনপুট ক্লিয়ার বাটন */}
                        {navSearchQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setNavSearchQuery('');
                              setSelectedCategoryJob('');
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition cursor-pointer shrink-0"
                            title="মুছে ফেলুন"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}

                        {/* Voice Search Button */}
                        <button
                          type="button"
                          onClick={handleTriggerVoiceSearch}
                          className={`p-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer select-none active:scale-95 ${
                            isListeningVoice 
                              ? 'bg-red-500 text-white shadow-xs ring-2 ring-red-400' 
                              : 'bg-emerald-50 text-[#2EAA26] hover:bg-emerald-100'
                          }`}
                          title={isListeningVoice ? 'ভয়েস সার্চ বন্ধ করুন' : 'ভয়েস সার্চ (মুখে বলুন)'}
                        >
                          {isListeningVoice ? (
                            <div className="flex items-center gap-1">
                              <Mic className="w-3.5 h-3.5 animate-pulse" />
                              <span className="flex items-center gap-0.5 px-0.5">
                                <span className="w-0.5 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-0.5 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-0.5 h-1.5 bg-white rounded-full animate-bounce"></span>
                              </span>
                            </div>
                          ) : (
                            <Mic className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Camera Image Search Button */}
                        <button
                          type="button"
                          onClick={handleTriggerImageSearch}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-emerald-700 transition cursor-pointer"
                          title="ছবি দিয়ে সেবা খুঁজুন"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* ডাইনামিক অটো-কমপ্লিট ড্রপডাউন পপআপ (১,০০০ পেশার সম্পূর্ণ তালিকা ও কাস্টম সার্চ সাপোর্ট) */}
                      {showSearchSuggestions && (activeSearchSuggestions.length > 0 || navSearchQuery.trim().length > 0) && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-72 sm:max-h-80 overflow-y-auto">
                          {/* কাস্টম টেক্সট ইনপুট অ্যাকশন বাটন */}
                          {navSearchQuery.trim().length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowSearchSuggestions(false);
                                setSelectedCategoryJob('');
                                setHasSearched(true);
                              }}
                              className="w-full px-3 py-2 bg-emerald-50 hover:bg-emerald-100/80 border-b border-emerald-100 text-left flex items-center justify-between transition cursor-pointer group"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Search className="w-3.5 h-3.5 text-[#2EAA26] shrink-0" />
                                <span className="text-[9px] font-bold text-gray-900 truncate">
                                  "<span className="text-[#2EAA26] font-black">{navSearchQuery.trim()}</span>" লিখে সরাসরি অনুসন্ধান করুন
                                </span>
                              </div>
                              <span className="text-[7px] font-extrabold text-emerald-800 bg-white border border-emerald-200 px-2 py-0.5 rounded-md shrink-0 shadow-2xs">
                                কাস্টম সার্চ ↵
                              </span>
                            </button>
                          )}

                          <div className="p-1.5 bg-slate-50 border-b border-gray-100 flex items-center justify-between text-[7.5px] font-extrabold text-gray-500">
                            <span>
                              {navSearchQuery.trim() 
                                ? `পেশা তালিকা থেকে পাওয়া গেছে (${activeSearchSuggestions.length}টি):` 
                                : `সকল ১,০০০ পেশার সম্পূর্ণ ডিরেক্টরি (${activeSearchSuggestions.length}টি):`}
                            </span>
                            <span className="text-[7px] text-[#2EAA26]">ক্লিক করে নির্বাচন করুন</span>
                          </div>

                          {activeSearchSuggestions.length > 0 ? (
                            <div className="py-0.5">
                              {activeSearchSuggestions.map((item, idx) => (
                                <button
                                  key={`${item.name}-${idx}`}
                                  type="button"
                                  onClick={() => {
                                    setNavSearchQuery(item.name);
                                    setSelectedCategoryJob(item.name);
                                    setShowSearchSuggestions(false);
                                    setHasSearched(true);
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-[9px] hover:bg-emerald-50 flex items-center justify-between transition cursor-pointer group border-b border-gray-50 last:border-0"
                                >
                                  <span className="font-bold text-gray-800 group-hover:text-[#2EAA26] truncate flex items-center gap-1.5">
                                    <span className="text-gray-400 group-hover:text-emerald-500 text-[8px]">🛠️</span>
                                    <span>{item.name}</span>
                                  </span>
                                  <div className="flex items-center gap-1 shrink-0 ml-1.5">
                                    {item.subCategory && (
                                      <span className="text-[6.5px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded-sm">
                                        {item.subCategory}
                                      </span>
                                    )}
                                    {item.category && (
                                      <span className="text-[7px] font-medium text-emerald-700 bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded-full">
                                        {item.category.split(' ')[0]}...
                                      </span>
                                    )}
                                  </div>
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="p-3 text-center bg-gray-50/70 space-y-1">
                              <p className="text-[8.5px] font-bold text-gray-700">
                                পূর্বনির্ধারিত ১,০০০ পেশার তালিকায় মেলেনি
                              </p>
                              <p className="text-[7.5px] text-gray-500">
                                উপরের "কাস্টম সার্চ" বাটনে অথবা কিবোর্ডের Enter চেপে যেকোনো কাস্টম সেবা সার্চ করুন।
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* জেলা ও থানা ড্রপডাউন (৬৪ জেলা ও সকল থানা) */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="text-[7.5px] font-extrabold text-gray-500 mb-0.5 flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5 text-[#2EAA26]" /> জেলা (District):
                        </label>
                        <select
                          value={selectedDistrict}
                          onChange={(e) => {
                            setSelectedDistrict(e.target.value);
                            setSelectedUpazila('');
                          }}
                          className="w-full p-1.5 bg-white border border-gray-300 rounded-xl text-[9px] font-bold text-gray-800 outline-none focus:border-[#2EAA26] shadow-2xs"
                        >
                          <option value="">সকল জেলা (৬৪ জেলা)</option>
                          {Object.keys(ALL_BANGLADESH_DISTRICTS).map(district => (
                            <option key={district} value={district}>{district}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[7.5px] font-extrabold text-gray-500 mb-0.5 flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5 text-[#2EAA26]" /> থানা/উপজেলা:
                        </label>
                        <select
                          value={selectedUpazila}
                          onChange={(e) => setSelectedUpazila(e.target.value)}
                          disabled={!selectedDistrict}
                          className="w-full p-1.5 bg-white border border-gray-300 rounded-xl text-[9px] font-bold text-gray-800 outline-none focus:border-[#2EAA26] shadow-2xs disabled:bg-gray-100 disabled:text-gray-400"
                        >
                          <option value="">সকল থানা/উপজেলা</option>
                          {availableUpazilas.map(upazila => (
                            <option key={upazila} value={upazila}>{upazila}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* পাড়া / মহল্লা / এলাকা ইনপুট */}
                    <div>
                      <label className="text-[7.5px] font-extrabold text-gray-500 mb-0.5 block">
                        পাড়া / মহল্লা / গ্রাম (ঐচ্ছিক):
                      </label>
                      <div className="bg-white border border-gray-300 rounded-xl p-1.5 flex items-center gap-1 shadow-2xs">
                        <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                        <input
                          type="text"
                          value={selectedArea}
                          onChange={(e) => setSelectedArea(e.target.value)}
                          placeholder="যেমন: বোয়ালখালী বাজার, আদালত রোড, কলেজ পাড়া..."
                          className="w-full text-[9px] bg-transparent outline-none font-bold text-gray-800 placeholder:text-gray-400 placeholder:font-normal"
                        />
                      </div>
                    </div>

                    {/* সেবা খুঁজুন বাটন */}
                    <div className="pt-0.5">
                      <button
                        type="button"
                        onClick={() => setHasSearched(true)}
                        className="w-full py-2 px-4 bg-[#2EAA26] hover:bg-emerald-700 active:scale-[0.98] text-white text-[10px] sm:text-xs font-bold rounded-xl shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>সেবা খুঁজুন</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ২. পণ্য (Product) ট্যাব: হুবহু পূর্বের সকল লেআউট ও ফিচার সংরক্ষিত */}
                {searchMode === 'products' && (
                  <div className="space-y-2">
                    {/* সার্চ কিওয়ার্ড ও অটো-সাজেশন ইনপুট */}
                    <div ref={searchContainerRef} className="relative">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[7.5px] font-extrabold text-gray-600 flex items-center gap-1">
                          <Search className="w-2.5 h-2.5 text-[#2EAA26]" />
                          <span>পণ্যের নাম বা ক্যাটাগরি:</span>
                        </label>
                        {(navSearchQuery || selectedCategoryJob) && (
                          <button 
                            type="button"
                            onClick={() => {
                              setNavSearchQuery('');
                              setSelectedCategoryJob('');
                            }}
                            className="text-red-600 hover:underline font-bold text-[7.5px] cursor-pointer"
                          >
                            ক্লিয়ার
                          </button>
                        )}
                      </div>

                      <div className={`bg-white border ${isListeningVoice ? 'border-red-400 ring-2 ring-red-200 bg-red-50/20' : 'border-gray-300 focus-within:border-[#2EAA26]'} rounded-xl p-1.5 flex items-center gap-1.5 shadow-2xs transition-all`}>
                        <Search className={`w-3.5 h-3.5 shrink-0 transition-colors ${isListeningVoice ? 'text-red-500 animate-pulse' : 'text-gray-400'}`} />
                        <input
                          type="text"
                          value={navSearchQuery}
                          onChange={(e) => {
                            setNavSearchQuery(sanitizeSearchQuery(e.target.value));
                            setSelectedCategoryJob('');
                            setShowSearchSuggestions(true);
                          }}
                          onFocus={() => setShowSearchSuggestions(true)}
                          onClick={() => setShowSearchSuggestions(true)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              setShowSearchSuggestions(false);
                              setSelectedCategoryJob('');
                              setHasSearched(true);
                            }
                          }}
                          placeholder={isListeningVoice ? "🎙️ শুনছি... পণ্যের নাম মুখে বলুন..." : "যেমন: পাহাড়ি মধু, হলুদ গুঁড়া, পিনন হাদি, জুমের চাল বা যেকোনো পণ্য..."}
                          className="w-full text-[9.5px] bg-transparent outline-none font-bold text-gray-800 placeholder:text-gray-400 placeholder:font-normal"
                        />

                        {/* ইনপুট ক্লিয়ার বাটন */}
                        {navSearchQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setNavSearchQuery('');
                              setSelectedCategoryJob('');
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition cursor-pointer shrink-0"
                            title="মুছে ফেলুন"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}

                        {/* Voice Search Button */}
                        <button
                          type="button"
                          onClick={handleTriggerVoiceSearch}
                          className={`p-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer select-none active:scale-95 ${
                            isListeningVoice 
                              ? 'bg-red-500 text-white shadow-xs ring-2 ring-red-400' 
                              : 'bg-emerald-50 text-[#2EAA26] hover:bg-emerald-100'
                          }`}
                          title={isListeningVoice ? 'ভয়েস সার্চ বন্ধ করুন' : 'ভয়েস সার্চ (মুখে বলুন)'}
                        >
                          {isListeningVoice ? (
                            <div className="flex items-center gap-1">
                              <Mic className="w-3.5 h-3.5 animate-pulse" />
                              <span className="flex items-center gap-0.5 px-0.5">
                                <span className="w-0.5 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-0.5 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-0.5 h-1.5 bg-white rounded-full animate-bounce"></span>
                              </span>
                            </div>
                          ) : (
                            <Mic className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Camera Image Search Button */}
                        <button
                          type="button"
                          onClick={handleTriggerImageSearch}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-emerald-700 transition cursor-pointer"
                          title="ছবি দিয়ে পণ্য খুঁজুন"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {/* অটো-সাজেশন ড্রপডাউন পপআপ (সম্পূর্ণ তালিকা ও কাস্টম সার্চ সাপোর্ট) */}
                      {showSearchSuggestions && (activeSearchSuggestions.length > 0 || navSearchQuery.trim().length > 0) && (
                        <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl z-50 overflow-hidden max-h-64 sm:max-h-72 overflow-y-auto">
                          {/* কাস্টম টেক্সট ইনপুট অ্যাকশন বাটন */}
                          {navSearchQuery.trim().length > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setShowSearchSuggestions(false);
                                setSelectedCategoryJob('');
                                setHasSearched(true);
                              }}
                              className="w-full px-3 py-2 bg-emerald-50 hover:bg-emerald-100/80 border-b border-emerald-100 text-left flex items-center justify-between transition cursor-pointer group"
                            >
                              <div className="flex items-center gap-1.5 min-w-0">
                                <Search className="w-3.5 h-3.5 text-[#2EAA26] shrink-0" />
                                <span className="text-[9px] font-bold text-gray-900 truncate">
                                  "<span className="text-[#2EAA26] font-black">{navSearchQuery.trim()}</span>" পণ্য লিখে সরাসরি অনুসন্ধান করুন
                                </span>
                              </div>
                              <span className="text-[7px] font-extrabold text-emerald-800 bg-white border border-emerald-200 px-2 py-0.5 rounded-md shrink-0 shadow-2xs">
                                কাস্টম সার্চ ↵
                              </span>
                            </button>
                          )}

                          <div className="p-1.5 bg-slate-50 border-b border-gray-100 flex items-center justify-between text-[7.5px] font-extrabold text-gray-500">
                            <span>
                              {navSearchQuery.trim() 
                                ? `পণ্য তালিকা থেকে পাওয়া গেছে (${activeSearchSuggestions.length}টি):` 
                                : `সকল পণ্য ও ক্যাটাগরি তালিকা (${activeSearchSuggestions.length}টি):`}
                            </span>
                            <span className="text-[7px] text-[#2EAA26]">ক্লিক করে নির্বাচন করুন</span>
                          </div>

                          {activeSearchSuggestions.length > 0 ? (
                            <div className="py-0.5">
                              {activeSearchSuggestions.map((item, idx) => (
                                <button
                                  key={`${item.name}-${idx}`}
                                  type="button"
                                  onClick={() => {
                                    setNavSearchQuery(item.name);
                                    setSelectedCategoryJob(item.name);
                                    setShowSearchSuggestions(false);
                                    setHasSearched(true);
                                  }}
                                  className="w-full px-3 py-1.5 text-left text-[9px] hover:bg-emerald-50 flex items-center justify-between transition cursor-pointer group border-b border-gray-50 last:border-0"
                                >
                                  <span className="font-bold text-gray-800 group-hover:text-[#2EAA26] truncate">
                                    🛍️ {item.name}
                                  </span>
                                  {item.category && (
                                    <span className="text-[7px] text-gray-400 bg-gray-100 group-hover:bg-emerald-100 group-hover:text-[#2EAA26] px-1.5 py-0.5 rounded-full shrink-0 ml-1">
                                      {item.category}
                                    </span>
                                  )}
                                </button>
                              ))}
                            </div>
                          ) : (
                            <div className="p-3 text-center bg-gray-50/70 space-y-1">
                              <p className="text-[8.5px] font-bold text-gray-700">
                                প্রস্তাবিত পণ্য তালিকায় মেলেনি
                              </p>
                              <p className="text-[7.5px] text-gray-500">
                                উপরের "কাস্টম সার্চ" বাটনে অথবা কিবোর্ডের Enter চেপে যেকোনো কাস্টম পণ্য খুঁজুন।
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* জেলা ও থানা ড্রপডাউন (৬৪ জেলা ও সকল থানা) */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="text-[7.5px] font-extrabold text-gray-500 mb-0.5 flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5 text-[#2EAA26]" /> জেলা (District):
                        </label>
                        <select
                          value={selectedDistrict}
                          onChange={(e) => {
                            setSelectedDistrict(e.target.value);
                            setSelectedUpazila('');
                          }}
                          className="w-full p-1.5 bg-white border border-gray-300 rounded-xl text-[9px] font-bold text-gray-800 outline-none focus:border-[#2EAA26] shadow-2xs"
                        >
                          <option value="">সকল জেলা (৬৪ জেলা)</option>
                          {Object.keys(ALL_BANGLADESH_DISTRICTS).map(district => (
                            <option key={district} value={district}>{district}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[7.5px] font-extrabold text-gray-500 mb-0.5 flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5 text-[#2EAA26]" /> থানা/উপজেলা:
                        </label>
                        <select
                          value={selectedUpazila}
                          onChange={(e) => setSelectedUpazila(e.target.value)}
                          disabled={!selectedDistrict}
                          className="w-full p-1.5 bg-white border border-gray-300 rounded-xl text-[9px] font-bold text-gray-800 outline-none focus:border-[#2EAA26] shadow-2xs disabled:bg-gray-100 disabled:text-gray-400"
                        >
                          <option value="">সকল থানা/উপজেলা</option>
                          {availableUpazilas.map(upazila => (
                            <option key={upazila} value={upazila}>{upazila}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* পাড়া / মহল্লা / এলাকা ইনপুট */}
                    <div>
                      <label className="text-[7.5px] font-extrabold text-gray-500 mb-0.5 block">
                        পাড়া / মহল্লা / গ্রাম (ঐচ্ছিক):
                      </label>
                      <div className="bg-white border border-gray-300 rounded-xl p-1.5 flex items-center gap-1 shadow-2xs">
                        <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                        <input
                          type="text"
                          value={selectedArea}
                          onChange={(e) => setSelectedArea(e.target.value)}
                          placeholder="যেমন: বোয়ালখালী বাজার, আদালত রোড, কলেজ পাড়া..."
                          className="w-full text-[9px] bg-transparent outline-none font-bold text-gray-800 placeholder:text-gray-400 placeholder:font-normal"
                        />
                      </div>
                    </div>

                    {/* পণ্য খুঁজুন বাটন */}
                    <div className="pt-0.5">
                      <button
                        type="button"
                        onClick={() => setHasSearched(true)}
                        className="w-full py-2 px-4 bg-[#2EAA26] hover:bg-emerald-700 active:scale-[0.98] text-white text-[10px] sm:text-xs font-bold rounded-xl shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>পণ্য খুঁজুন</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ৩. ব্লাড (রক্ত) ট্যাব: সার্চ বার সম্পূর্ণ অপসারণ করে ভয়েস সার্চ ও এআই সার্চ বাটন */}
                {searchMode === 'blood' && (
                  <div className="space-y-2">
                    {/* টপ সেকশন: রক্তদাতা সার্চ বার এবং ভয়েস সার্চ ফিচার */}
                    <div className="bg-gradient-to-r from-rose-50 via-red-50 to-amber-50 border border-red-200/80 rounded-2xl p-3 shadow-2xs space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-600"></span>
                          </span>
                          <span className="text-[8.5px] font-black text-red-950">জরুরি রক্তদাতা অনুসন্ধান ও লাইভ ফিল্টার</span>
                        </div>
                        <span className="text-[7.5px] font-bold text-red-600 bg-white/90 px-2 py-0.5 rounded-full border border-red-200">
                          ভয়েস ও টাইপিং সার্চ
                        </span>
                      </div>

                      {/* ব্লাড সার্চ বার (টাইপিং এবং ভয়েস অপশন) */}
                      <div className={`bg-white border ${
                        isListeningVoice 
                          ? 'border-red-400 ring-2 ring-red-200 bg-red-50/20' 
                          : 'border-red-200 focus-within:border-red-500'
                      } rounded-xl p-1.5 flex items-center gap-1.5 shadow-2xs transition-all`}>
                        <Search className={`w-3.5 h-3.5 shrink-0 transition-colors ${isListeningVoice ? 'text-red-500 animate-pulse' : 'text-red-400'}`} />
                        <input
                          type="text"
                          value={navSearchQuery}
                          onChange={(e) => {
                            setNavSearchQuery(sanitizeSearchQuery(e.target.value));
                            setHasSearched(true);
                          }}
                          placeholder={isListeningVoice ? "🎙️ শুনছি... রক্তের গ্রুপ বা এলাকার নাম বলুন..." : "যেমন: O+ রক্তদাতা, খাগড়াছড়ি সদর, বা ডোনারের নাম..."}
                          className="w-full text-[9.5px] bg-transparent outline-none font-bold text-gray-800 placeholder:text-gray-400 placeholder:font-normal"
                        />

                        {/* ইনপুট ক্লিয়ার বাটন */}
                        {navSearchQuery && (
                          <button
                            type="button"
                            onClick={() => {
                              setNavSearchQuery('');
                            }}
                            className="p-1 text-gray-400 hover:text-gray-600 rounded-md hover:bg-gray-100 transition cursor-pointer shrink-0"
                            title="মুছে ফেলুন"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}

                        {/* Voice Search Button */}
                        <button
                          type="button"
                          onClick={handleTriggerVoiceSearch}
                          className={`p-1.5 rounded-lg flex items-center justify-center transition-all cursor-pointer select-none active:scale-95 shrink-0 ${
                            isListeningVoice 
                              ? 'bg-red-600 text-white shadow-xs ring-2 ring-red-400' 
                              : 'bg-red-50 text-red-600 hover:bg-red-100'
                          }`}
                          title={isListeningVoice ? 'ভয়েস সার্চ বন্ধ করুন' : 'ভয়েস সার্চ (মুখে বলুন)'}
                        >
                          {isListeningVoice ? (
                            <div className="flex items-center gap-1">
                              <Mic className="w-3.5 h-3.5 animate-pulse" />
                              <span className="flex items-center gap-0.5 px-0.5">
                                <span className="w-0.5 h-2 bg-white rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-0.5 h-3 bg-white rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-0.5 h-1.5 bg-white rounded-full animate-bounce"></span>
                              </span>
                            </div>
                          ) : (
                            <Mic className="w-3.5 h-3.5" />
                          )}
                        </button>

                        {/* Camera Image Search Button */}
                        <button
                          type="button"
                          onClick={handleTriggerImageSearch}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-red-600 transition cursor-pointer shrink-0"
                          title="ছবি বা প্রেসক্রিপশন দিয়ে সার্চ"
                        >
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* ফিল্টার ১: রক্তের গ্রুপ নির্বাচন (ড্রপডাউন ও কুইক সিলেক্টর) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[7.5px] font-extrabold text-gray-600 flex items-center gap-1">
                          <Droplet className="w-2.5 h-2.5 text-red-600 fill-red-600" />
                          <span>রক্তের গ্রুপ (Blood Group ড্রপডাউন):</span>
                        </label>
                        {selectedBloodGroup && (
                          <button
                            type="button"
                            onClick={() => setSelectedBloodGroup('')}
                            className="text-red-600 hover:underline text-[7px] font-bold cursor-pointer"
                          >
                            সকল গ্রুপ রিসেট
                          </button>
                        )}
                      </div>
                      <select
                        value={selectedBloodGroup}
                        onChange={(e) => setSelectedBloodGroup(e.target.value)}
                        className="w-full p-1.5 mb-1.5 bg-white border border-gray-300 rounded-xl text-[9px] font-bold text-gray-800 outline-none focus:border-red-500 shadow-2xs"
                      >
                        <option value="">সকল রক্তের গ্রুপ (All Groups)</option>
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                          <option key={bg} value={bg}>{bg} গ্রুপ</option>
                        ))}
                      </select>
                      <div className="grid grid-cols-4 gap-1">
                        {['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map((bg) => (
                          <button
                            key={bg}
                            type="button"
                            onClick={() => setSelectedBloodGroup(selectedBloodGroup === bg ? '' : bg)}
                            className={`py-1 rounded-lg text-[8.5px] font-black border transition cursor-pointer flex items-center justify-center gap-0.5 ${
                              selectedBloodGroup === bg
                                ? 'bg-red-600 text-white border-red-600 shadow-2xs'
                                : 'bg-white text-gray-700 border-gray-200 hover:border-red-300 hover:bg-red-50/50'
                            }`}
                          >
                            <span>{bg}</span>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* ফিল্টার ২: জেলা ও থানা ড্রপডাউন */}
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="text-[7.5px] font-extrabold text-gray-500 mb-0.5 flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5 text-red-600" /> জেলা (District):
                        </label>
                        <select
                          value={selectedDistrict}
                          onChange={(e) => {
                            setSelectedDistrict(e.target.value);
                            setSelectedUpazila('');
                          }}
                          className="w-full p-1.5 bg-white border border-gray-300 rounded-xl text-[9px] font-bold text-gray-800 outline-none focus:border-red-500 shadow-2xs"
                        >
                          <option value="">সকল জেলা (৬৪ জেলা)</option>
                          {Object.keys(ALL_BANGLADESH_DISTRICTS).map(district => (
                            <option key={district} value={district}>{district}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-[7.5px] font-extrabold text-gray-500 mb-0.5 flex items-center gap-0.5">
                          <MapPin className="w-2.5 h-2.5 text-red-600" /> থানা/উপজেলা:
                        </label>
                        <select
                          value={selectedUpazila}
                          onChange={(e) => setSelectedUpazila(e.target.value)}
                          disabled={!selectedDistrict}
                          className="w-full p-1.5 bg-white border border-gray-300 rounded-xl text-[9px] font-bold text-gray-800 outline-none focus:border-red-500 shadow-2xs disabled:bg-gray-100 disabled:text-gray-400"
                        >
                          <option value="">সকল থানা/উপজেলা</option>
                          {availableUpazilas.map(upazila => (
                            <option key={upazila} value={upazila}>{upazila}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* রক্তদাতা খুঁজুন বাটন */}
                    <div className="pt-0.5">
                      <button
                        type="button"
                        onClick={() => setHasSearched(true)}
                        className="w-full py-2 px-4 bg-red-600 hover:bg-red-700 active:scale-[0.98] text-white text-[10px] sm:text-xs font-bold rounded-xl shadow-2xs hover:shadow-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <Search className="w-3.5 h-3.5" />
                        <span>রক্তদাতা খুঁজুন</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* ডেডিকেটেড সোর্স (জরুরি ৯৯৯ তথ্য ও হটলাইন) সেকশন — 'খুঁজুন' বাটনের ঠিক নিচে */}
                <div className="w-full pt-1">
                  <button
                    type="button"
                    onClick={() => setIsSourceModalOpen(true)}
                    className="w-full p-2.5 sm:p-3 bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-700 hover:to-amber-700 text-white rounded-2xl shadow-xs border border-red-400/40 flex items-center justify-between gap-2 transition-all cursor-pointer group active:scale-[0.99]"
                  >
                    <div className="flex items-center gap-2 min-w-0 text-left">
                      <div className="bg-white text-red-600 p-1.5 rounded-xl shadow-2xs shrink-0 group-hover:scale-105 transition-transform">
                        <Siren className="w-4 h-4 animate-pulse" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-black tracking-wide">জরুরি সোর্স ও জাতীয় সেবা (Source)</span>
                          <span className="bg-white/20 text-[7px] font-bold px-1.5 py-0.2 rounded-full backdrop-blur-xs">২৪/৭ সেবা</span>
                        </div>
                        <p className="text-[7.5px] text-red-100 font-bold truncate">পুলিশ • অ্যাম্বুলেন্স • ফায়ার সার্ভিস (৯৯৯ কল)</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 bg-white text-red-600 font-black text-[8.5px] px-3 py-1.5 rounded-xl shadow-xs group-hover:bg-red-50">
                      <PhoneCall className="w-3 h-3 fill-red-600" />
                      <span>সোর্স দেখুন</span>
                    </div>
                  </button>
                </div>

              </div>

              {/* ৫. ফলাফল সেকশন */}
              {hasSearched && (
                <div className="w-full text-left space-y-2 pt-1 pb-4">
                  {/* ১. পেশাজীবী সার্চ ফলাফল */}
                  {searchMode === 'services' && (
                    <>
                      <div className="flex items-center justify-between border-b border-gray-200 pb-1">
                        <span className="text-[9px] font-black text-gray-700">খুঁজে পাওয়া নিবন্ধিত পেশাজীবী:</span>
                        <span className="bg-green-100 text-[#2EAA26] text-[7.5px] font-bold px-2 py-0.5 rounded-full">{searchResults.length} জন নিবন্ধিত</span>
                      </div>

                      {searchResults.length > 0 ? (
                        <div className="space-y-2">
                          {searchResults.map((pro) => (
                            <div 
                              key={pro.id} 
                              className="bg-white p-2.5 rounded-2xl border border-gray-200 shadow-2xs hover:border-emerald-300 transition-all flex flex-col gap-2 cursor-pointer group"
                              onClick={() => openProfessionalPortfolioModal(pro)}
                            >
                              <div className="flex items-start gap-2.5">
                                <div className="relative shrink-0">
                                  <img src={pro.img} alt={pro.name} className="w-11 h-11 object-cover rounded-xl border border-emerald-100 shadow-xs" />
                                  {pro.verified && (
                                    <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-0.5 shadow-xs" title="NID ভেরিফাইড প্রফেশনাল">
                                      <ShieldCheck className="w-2.5 h-2.5" />
                                    </div>
                                  )}
                                </div>
                                
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-1">
                                    <h4 className="text-[10px] font-black text-gray-900 truncate group-hover:text-[#2EAA26] transition-colors">{pro.name}</h4>
                                    <span className="text-[7px] font-mono font-black bg-emerald-50 text-emerald-700 px-1.5 py-0.5 rounded-md border border-emerald-100 shrink-0">
                                      {pro.uniqueId || pro.memberId || 'VERIFIED'}
                                    </span>
                                  </div>
                                  <p className="text-[8.5px] font-extrabold text-[#2EAA26] truncate">{pro.job}</p>
                                  <div className="flex items-center gap-2 text-[7.5px] text-gray-500 mt-0.5">
                                    <span className="flex items-center gap-0.5">
                                      <MapPin className="w-2.5 h-2.5 text-gray-400" /> {pro.district} ➔ {pro.upazila} {pro.area ? `(${pro.area})` : ''}
                                    </span>
                                    {pro.rateAmount && (
                                      <span className="font-bold text-gray-700">
                                        • ৳{pro.rateAmount}/{pro.rateType || 'দৈনিক'}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openProfessionalPortfolioModal(pro);
                                  }}
                                  className="text-[8px] font-extrabold text-emerald-700 hover:text-emerald-800 bg-emerald-50 hover:bg-emerald-100 px-2 py-1 rounded-lg flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                  <Briefcase className="w-2.5 h-2.5" />
                                  পোর্টফোলিও ও রেটিং দেখুন
                                </button>

                                <a 
                                  href={`tel:${pro.phone?.replace(/[^\d+]/g, '')}`}
                                  onClick={(e) => e.stopPropagation()}
                                  className="bg-[#2EAA26] hover:bg-emerald-700 text-white text-[8px] font-black px-3 py-1 rounded-lg shrink-0 flex items-center gap-1 shadow-2xs active:scale-95 transition-all cursor-pointer"
                                >
                                  <Phone className="w-2.5 h-2.5" /> যোগাযোগ করুন
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-white p-5 rounded-2xl text-center text-gray-600 space-y-1.5 border border-gray-200 shadow-2xs">
                          <AlertCircle className="w-5 h-5 text-amber-500 mx-auto" />
                          <p className="text-xs font-bold text-gray-800">
                            আন্তরিকভাবে দুঃখিত, আপনার কাঙ্ক্ষিত তথ্যটি এই মুহূর্তে খুঁজে পাওয়া যায়নি।
                          </p>
                          <p className="text-[9px] text-gray-500">অন্য কোনো পেশা বা জেলা/উপজেলা নির্বাচন করে পুনরায় খুঁজুন।</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* ২. পণ্য সার্চ ফলাফল */}
                  {searchMode === 'products' && (
                    <>
                      <div className="flex items-center justify-between border-b border-gray-200 pb-1">
                        <span className="text-[9px] font-black text-gray-700">খুঁজে পাওয়া পণ্য:</span>
                        <span className="bg-green-100 text-[#2EAA26] text-[7.5px] font-bold px-2 py-0.5 rounded-full">{productSearchResults.length} টি পণ্য</span>
                      </div>

                      {productSearchResults.length > 0 ? (
                        <div 
                          data-product-grid="true"
                          className={`grid ${isAdminPreview ? 'grid-cols-2 gap-2' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 sm:gap-3 md:gap-4'}`}
                        >
                          {productSearchResults.map((prod) => (
                            <div 
                              key={prod.id} 
                              className="bg-white rounded-2xl border border-gray-200 shadow-2xs overflow-hidden hover:border-emerald-300 transition-all flex flex-col justify-between cursor-pointer group"
                              onClick={() => handleOpenProductDetails(prod)}
                            >
                              <div className="relative w-full h-32 bg-slate-100 rounded-md overflow-hidden shrink-0 mb-1.5">
                                <img 
                                  src={getProductPublicUrl((prod as any).products_photos || prod.image)} 
                                  alt={prod.nameBn} 
                                  className="w-full h-32 object-cover rounded-md group-hover:scale-105 transition-transform"
                                  onError={(e) => {
                                    const target = e.currentTarget as HTMLImageElement;
                                    target.onerror = null;
                                    target.src = NO_IMAGE_AVAILABLE_ICON;
                                  }}
                                />
                                {prod.badge && (
                                  <span className="absolute top-1 left-1 bg-[#2EAA26] text-white text-[7px] font-black px-1.5 py-0.5 rounded-md shadow-xs">
                                    {prod.badge}
                                  </span>
                                )}
                              </div>
                              <div className="p-2 space-y-1">
                                <h4 className="text-[9.5px] font-black text-gray-900 truncate group-hover:text-[#2EAA26]">{prod.nameBn}</h4>
                                <p className="text-[7.5px] text-gray-500 flex items-center gap-0.5">
                                  <MapPin className="w-2 h-2 text-gray-400" /> {prod.origin}
                                </p>
                                <div className="flex items-baseline gap-1">
                                  <span className="text-[10px] font-black text-[#2EAA26]">৳{prod.price}</span>
                                  <span className="text-[7px] text-gray-500 font-bold">/{prod.unit}</span>
                                </div>
                              </div>
                              <div className="p-2 pt-0 flex items-center justify-between gap-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleOpenProductDetails(prod);
                                  }}
                                  className="flex-1 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[8px] font-black rounded-lg transition cursor-pointer"
                                >
                                  বিস্তারিত
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddToCart(prod, 1);
                                  }}
                                  className="p-1 bg-[#2EAA26] hover:bg-emerald-700 text-white rounded-lg transition shadow-2xs cursor-pointer"
                                  title="কার্টে যোগ"
                                >
                                  <ShoppingCart className="w-3 h-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-white p-5 rounded-2xl text-center text-gray-600 space-y-1.5 border border-gray-200 shadow-2xs">
                          <AlertCircle className="w-5 h-5 text-amber-500 mx-auto" />
                          <p className="text-xs font-bold text-gray-800">
                            আন্তরিকভাবে দুঃখিত, আপনার কাঙ্ক্ষিত তথ্যটি এই মুহূর্তে খুঁজে পাওয়া যায়নি।
                          </p>
                          <p className="text-[9px] text-gray-500">অন্যান্য ক্যাটাগরি বা জেলা সিলেক্ট করে পুনরায় অনুসন্ধান করুন।</p>
                        </div>
                      )}
                    </>
                  )}

                  {/* ৩. ব্লাড ডোনার সার্চ ফলাফল (১০০% ফ্রি মানবিক সেবা) */}
                  {searchMode === 'blood' && (
                    <>
                      <div className="flex items-center justify-between border-b border-gray-200 pb-1">
                        <span className="text-[9px] font-black text-gray-700 flex items-center gap-1">
                          <Droplet className="w-3 h-3 text-red-600" />
                          খুঁজে পাওয়া নিবন্ধিত রক্তদাতা:
                        </span>
                        <span className="bg-red-100 text-red-700 text-[7.5px] font-black px-2 py-0.5 rounded-full">
                          {bloodSearchResults.length} জন রক্তদাতা
                        </span>
                      </div>

                      {/* ১০০% ফ্রি সার্ভিস নোটিশ */}
                      <div className="bg-red-50 border border-red-200 p-2 rounded-xl text-left space-y-0.5">
                        <p className="text-[8px] font-black text-red-800 flex items-center gap-1">
                          <Heart className="w-2.5 h-2.5 text-red-600 fill-red-600" />
                          মানবিক রক্তদান সেবা — কোনো প্রকার সার্ভিস চার্জ বা ফি নেই
                        </p>
                        <p className="text-[7px] text-red-700">
                          জরুরি প্রয়োজনে সরাসরি রক্তদাতার সাথে যোগাযোগ করুন। রক্তদান একটি নিঃস্বার্থ ও মহৎ কাজ।
                        </p>
                      </div>

                      {bloodSearchResults.length > 0 ? (
                        <div className="space-y-2.5">
                          {bloodSearchResults.map((donor) => {
                            const rawPhone = donor.phone ? String(donor.phone).trim() : '';
                            const cleanDigits = rawPhone.replace(/[^0-9+]/g, '');
                            const dialUri = cleanDigits
                              ? (cleanDigits.startsWith('+') 
                                  ? `tel:${cleanDigits}` 
                                  : cleanDigits.startsWith('880') 
                                  ? `tel:+${cleanDigits}` 
                                  : cleanDigits.startsWith('0') 
                                  ? `tel:+88${cleanDigits}` 
                                  : `tel:+880${cleanDigits}`)
                              : 'tel:999';

                            // গোপনীয়তা নীতিমালা অনুযায়ী মোবাইল নম্বর মাস্কড
                            const maskedPhone = cleanDigits.length >= 10
                              ? `${cleanDigits.slice(0, 3)}******${cleanDigits.slice(-2)}`
                              : '০১৮******XX';

                            return (
                              <div 
                                key={donor.id} 
                                className="bg-white p-3 rounded-2xl border border-red-100 hover:border-red-300 shadow-2xs transition-all flex flex-col gap-2.5"
                              >
                                <div className="flex items-start gap-2.5">
                                  <div className="relative shrink-0">
                                    <img 
                                      src={donor.img || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"} 
                                      alt={donor.name} 
                                      className="w-12 h-12 object-cover rounded-xl border border-red-100 shadow-xs" 
                                    />
                                    {donor.verified && (
                                      <div className="absolute -bottom-1 -right-1 bg-red-600 text-white rounded-full p-0.5 shadow-xs" title="NID ভেরিফাইড রক্তদাতা">
                                        <ShieldCheck className="w-2.5 h-2.5" />
                                      </div>
                                    )}
                                  </div>
                                  
                                  <div className="flex-1 min-w-0">
                                    {/* রক্তদাতার নাম ও ব্লাড গ্রুপ সরাসরি প্রদর্শন */}
                                    <div className="flex items-center justify-between gap-1">
                                      <h4 className="text-[11px] font-black text-gray-900 truncate">{donor.name}</h4>
                                      <span className="text-[9px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full shadow-2xs shrink-0 flex items-center gap-0.5">
                                        <Droplet className="w-2.5 h-2.5 fill-white" />
                                        ব্লাড গ্রুপ: {donor.bloodGroup || 'O+'}
                                      </span>
                                    </div>
                                    
                                    <p className="text-[8px] font-bold text-gray-600 truncate mt-0.5">
                                      {donor.job || 'স্বেচ্ছাসেবী রক্তদাতা'}
                                    </p>

                                    {/* জেলা ও উপজেলা সরাসরি কার্ডে প্রদর্শন */}
                                    <div className="grid grid-cols-2 gap-1.5 mt-1.5 bg-stone-50 border border-stone-200/70 rounded-lg p-1.5 text-[8px]">
                                      <div className="flex items-center gap-1 text-stone-700 truncate">
                                        <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                                        <span className="font-medium text-stone-500">জেলা:</span>
                                        <span className="font-bold text-stone-900 truncate">{donor.district || 'খাগড়াছড়ি'}</span>
                                      </div>
                                      <div className="flex items-center gap-1 text-stone-700 truncate">
                                        <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                                        <span className="font-medium text-stone-500">উপজেলা:</span>
                                        <span className="font-bold text-stone-900 truncate">{donor.upazila || 'সদর'}</span>
                                      </div>
                                    </div>

                                    {/* গোপনীয়তা নীতিমালা অনুযায়ী মোবাইল নম্বর সম্পূর্ণ গোপন ও সুরক্ষিত রাখা */}
                                    <div className="flex items-center justify-between gap-1 mt-1.5 text-[7.5px] bg-emerald-50/70 border border-emerald-200/80 rounded-md px-2 py-1">
                                      <div className="flex items-center gap-1 text-emerald-800 truncate font-semibold">
                                        <Lock className="w-2.5 h-2.5 text-emerald-600 shrink-0" />
                                        <span>ব্যক্তিগত ফোন ও তথ্য সম্পূর্ণ সুরক্ষিত</span>
                                      </div>
                                      <span className="text-[6.5px] font-bold text-emerald-700 bg-white border border-emerald-200 px-1 py-0.2 rounded shrink-0">
                                        অ্যাডমিন সুরক্ষিত
                                      </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 mt-1.5">
                                      <span className="text-[6.5px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.5 rounded-md">
                                        ✓ ১০০% ফ্রি মানবিক রক্তদান
                                      </span>
                                      {donor.lastDonationDate && (
                                        <span className="text-[6.5px] text-gray-500 font-bold truncate">
                                          সর্বশেষ রক্তদান: {donor.lastDonationDate}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                {/* জরুরি ডায়ালিং 'Emergency Contact' বাটন */}
                                <div className="pt-1.5 border-t border-gray-100">
                                  <a 
                                    href={dialUri}
                                    className="w-full bg-red-600 hover:bg-red-700 active:bg-red-800 text-white text-[9.5px] sm:text-[10px] font-black py-2 px-3 rounded-xl flex items-center justify-center gap-1.5 shadow-2xs hover:shadow-xs active:scale-[0.99] transition-all cursor-pointer select-none text-center"
                                    title={`${donor.name}-এর সাথে যোগাযোগ করতে কল করুন`}
                                  >
                                    <PhoneCall className="w-3.5 h-3.5 animate-pulse" />
                                    <span>যোগাযোগ করুন</span>
                                  </a>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div className="bg-white p-6 rounded-2xl text-center text-gray-600 space-y-2 border border-gray-200 shadow-2xs">
                          <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto text-amber-600">
                            <AlertCircle className="w-5 h-5" />
                          </div>
                          <p className="text-xs sm:text-sm font-bold text-gray-800">
                            আন্তরিকভাবে দুঃখিত, আপনার কাঙ্ক্ষিত তথ্যটি এই মুহূর্তে খুঁজে পাওয়া যায়নি।
                          </p>
                          <p className="text-[10px] text-gray-500 max-w-xs mx-auto">
                            অন্য রক্তের গ্রুপ নির্বাচন করুন অথবা পার্শ্ববর্তী জেলা/উপজেলা সিলেক্ট করে আবার অনুসন্ধান করুন।
                          </p>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedBloodGroup('');
                              setSelectedDistrict('খাগড়াছড়ি');
                              setSelectedUpazila('');
                            }}
                            className="px-3.5 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-[10px] font-bold transition cursor-pointer inline-flex items-center gap-1"
                          >
                            <RefreshCw className="w-3 h-3" />
                            <span>ফিল্টার রিসেট করুন</span>
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

            </div>

          </div>
        )}

        {/* ================= (গ) ক্যাটাগরি পেজ ================= */}
        {activeTab === 'services' && (
          <div className="p-3 space-y-3">
            <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-2xs">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2 mb-2">
                <div>
                  <h2 className="text-xs font-black text-gray-900">১৫টি প্রধান ক্যাটাগরি ও ক্যাটালগ</h2>
                  <p className="text-[8px] text-gray-500">আপনার প্রয়োজনীয় সেবা অথবা পণ্য নির্বাচন করুন</p>
                </div>
                <span className="text-[8px] font-bold bg-green-50 text-[#2EAA26] px-2 py-0.5 rounded-full">
                  ১৫টি ক্যাটালগ
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {CATEGORIES_CATALOG.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => {
                      setSelectedCategoryJob(cat.name);
                      setActiveTab('search');
                      setHasSearched(true);
                    }}
                    className="flex flex-col items-center justify-center p-2.5 bg-slate-50 hover:bg-emerald-50 hover:border-emerald-300 border border-gray-100 rounded-xl transition-all group text-center cursor-pointer"
                  >
                    <div className="p-2 bg-white rounded-xl shadow-2xs group-hover:scale-110 transition-transform">
                      {cat.icon}
                    </div>
                    <span className="text-[8.5px] font-extrabold text-gray-800 group-hover:text-emerald-700 mt-1.5 line-clamp-1 leading-tight">
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* ১১টি গ্রুপে ১০০০+ পেশাজীবী তালিকা ড্রিলডাউন */}
            <div className="bg-white p-3 rounded-2xl border border-gray-200 shadow-2xs space-y-2">
              <h3 className="text-[10px] font-black text-gray-900 flex items-center gap-1.5">
                <Briefcase className="w-3.5 h-3.5 text-[#2EAA26]" />
                পেশাজীবী গ্রুপ ও সেবাসমূহ (১০০০+ পেশা)
              </h3>
              <div className="space-y-1.5">
                {ALL_PROFESSION_CATEGORIES.map((grp, idx) => (
                  <div key={idx} className="border border-gray-100 rounded-xl p-2 bg-slate-50/50">
                    <h4 className="text-[8.5px] font-black text-emerald-800 mb-1">{grp.category}</h4>
                    <div className="flex flex-wrap gap-1">
                      {grp.jobs.slice(0, 4).map((job, jIdx) => (
                        <button
                          key={jIdx}
                          onClick={() => {
                            setSelectedCategoryJob(job);
                            setActiveTab('search');
                            setHasSearched(true);
                          }}
                          className="text-[7.5px] font-medium bg-white hover:bg-[#2EAA26] hover:text-white text-gray-700 border border-gray-200 px-1.5 py-0.5 rounded-md transition-colors cursor-pointer"
                        >
                          {job}
                        </button>
                      ))}
                      <button
                        onClick={() => {
                          setActiveTab('search');
                        }}
                        className="text-[7.5px] font-bold text-[#2EAA26] hover:underline px-1 py-0.5 cursor-pointer"
                      >
                        +আরও {grp.jobs.length - 4}টি...
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= (ঘ) ঝাডিমাটি পার্টনার রেজিস্ট্রেশন ফ্লো (RegistrationFlow - Step 2: Role Selection) ================= */}
        {activeTab === 'registration_flow' && (
          !currentUser ? (
            <SignUpForm
              lang={lang}
              onBack={() => setActiveTab('home')}
              onAuthSuccess={(user, isNew) => {
                handleAuthSuccess(user, isNew);
              }}
              onNavigateToSignIn={() => {
                setActiveTab('signin');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          ) : (
            <div className="p-2 space-y-2">
              <RegistrationFlow
                allDistricts={dynamicDistricts}
                lang={lang}
                currentUser={currentUser}
                onSelectMerchant={() => {
                  selectRole('seller');
                  setActiveTab('track_a_vendor');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onBack={() => setActiveTab('home')}
                onSuccess={(newPro) => {
                  handleSaveProfessionalProfile(newPro as any);
                  selectRole('professional');
                  setShowToast(`অভিনন্দন ${newPro.name}! আপনার রেজিস্ট্রেশন সফল হয়েছে।`);
                  setTimeout(() => setShowToast(''), 4000);
                }}
              />
            </div>
          )
        )}

        {/* ================= (ঙ) এমবেডেড সাইন আপ ও রেজিস্ট্রেশন পেজ (Step 1: নতুন অ্যাকাউন্ট তৈরি করুন) ================= */}
        {activeTab === 'signup' && (
          <div className="w-full max-w-md mx-auto p-1 sm:p-2">
            <SignUpForm
              lang={lang}
              onBack={() => setActiveTab('home')}
              onAuthSuccess={(user, isNew) => {
                handleAuthSuccess(user, isNew);
              }}
              onNavigateToSignIn={() => {
                setActiveTab('signin');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {/* ================= (ঙ-০) চার ট্যাব বিশিষ্ট রেজিস্ট্রেশন পেজ ================= */}
        {activeTab === 'registration' && (
          <div className="w-full max-w-5xl mx-auto p-0 sm:p-2">
            <RegistrationPage
              lang={lang}
              onLanguageToggle={() => {
                const nextLang = lang === 'bn' ? 'en' : 'bn';
                setLang(nextLang);
              }}
              currentUser={currentUser}
              initialTab={registrationInitialTab}
              initialPhone={registrationInitialPhone}
              isEditMode={registrationIsEditMode}
              onBack={() => goBack()}
              onSuccess={(user) => {
                handleAuthSuccess(user, true);
              }}
              onShowToast={setShowToast}
              onNavigateToSignIn={() => {
                setActiveTab('signin');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {/* ================= (ঙ-০-১) পণ্য বিক্রেতা পৃথক এডিট ফর্ম (Product Seller Dedicated Edit Page) ================= */}
        {activeTab === 'edit_seller' && (
          <div className="w-full max-w-md mx-auto p-0 sm:p-2">
            <RegistrationPage
              lang={lang}
              onLanguageToggle={() => {
                const nextLang = lang === 'bn' ? 'en' : 'bn';
                setLang(nextLang);
              }}
              currentUser={editingUserTarget || currentUser}
              initialTab="seller"
              lockedRole="seller"
              isEditMode={true}
              onBack={() => goBack()}
              onShowToast={setShowToast}
              onSuccess={(user) => {
                handleAuthSuccess(user, true);
                setShowToast(lang === 'bn' ? '✅ পণ্য বিক্রেতার তথ্য সফলভাবে আপডেট হয়েছে!' : '✅ Product seller updated successfully!');
                setActiveTab('profile');
              }}
              onNavigateToSignIn={() => {
                setActiveTab('signin');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {/* ================= (ঙ-০-২) সেবা বিক্রেতা পৃথক এডিট ফর্ম (Service Provider Dedicated Edit Page) ================= */}
        {activeTab === 'edit_service' && (
          <div className="w-full max-w-md mx-auto p-1 sm:p-2">
            <div className="bg-white rounded-2xl border border-gray-200 p-3 sm:p-4 shadow-xs">
              <ServiceProviderRegistrationForm
                currentUser={editingUserTarget || currentUser}
                initialData={editingUserTarget || activeSpProfileData || userProfessionalProfile || currentUser}
                isEditMode={true}
                lang={lang}
                embedded={false}
                onBack={() => goBack()}
                onSubmitSuccess={(newRecord) => {
                  setActiveSpProfileData(newRecord);
                  if (typeof saveProfessionalProfile === 'function') {
                    saveProfessionalProfile(newRecord);
                  }
                  login(newRecord, true);
                  handleAuthSuccess(newRecord, true);
                  setShowToast(lang === 'bn' ? '✅ সেবা বিক্রেতার তথ্য সফলভাবে আপডেট হয়েছে!' : '✅ Service provider updated successfully!');
                  setActiveTab('profile');
                }}
              />
            </div>
          </div>
        )}

        {/* ================= (ঙ-০-৩) স্থায়ী সদস্য পৃথক এডিট ফর্ম (Permanent Member Dedicated Edit Page) ================= */}
        {activeTab === 'edit_permanent' && (
          <div className="w-full max-w-md mx-auto p-0 sm:p-2">
            <RegistrationPage
              lang={lang}
              onLanguageToggle={() => {
                const nextLang = lang === 'bn' ? 'en' : 'bn';
                setLang(nextLang);
              }}
              currentUser={editingUserTarget || currentUser}
              initialTab="permanent"
              lockedRole="permanent"
              isEditMode={true}
              onBack={() => goBack()}
              onShowToast={setShowToast}
              onSuccess={(user) => {
                handleAuthSuccess(user, true);
                setShowToast(lang === 'bn' ? '✅ স্থায়ী সদস্যের তথ্য সফলভাবে আপডেট হয়েছে!' : '✅ Permanent member updated successfully!');
                setActiveTab('profile');
              }}
              onNavigateToSignIn={() => {
                setActiveTab('signin');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {/* ================= (ঙ-১) এমবেডেড সাইন ইন পেজ (Clean In-Body Sign In Screen) ================= */}
        {activeTab === 'signin' && (
          <div className="w-full max-w-md mx-auto p-1 sm:p-2">
            <SignInScreen
              lang={lang}
              onBack={() => goBack()}
              onSignInSuccess={(user) => {
                handleSignInSuccess(user);
              }}
              onNavigateToSignUp={() => {
                setActiveTab('registration');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          </div>
        )}

        {/* ================= (ঙ-২) রেজিস্ট্রেশন ফ্লো (Registration Flow) ================= */}
        {activeTab === 'registration_flow' && (
          <div className="w-full max-w-md mx-auto p-1 sm:p-2">
            <RegistrationFlow
              lang={lang}
              currentUser={currentUser}
              onBack={() => goBack()}
              onSuccess={() => setActiveTab('profile')}
              onSelectMerchant={() => setActiveTab('track_a_vendor')}
            />
          </div>
        )}

        {/* ================= (ঙ-৩) রোল সিলেকশন (Role Selection Modal / View) ================= */}
        {activeTab === 'role_select' && (
          <div className="w-full max-w-md mx-auto p-2 sm:p-4 flex flex-col items-center justify-start">
            <div className="w-full mb-3 flex items-center justify-between px-1">
              <span className="text-xs font-semibold text-stone-500 uppercase tracking-wider">
                {lang === 'bn' ? 'অ্যাকাউন্ট নির্বাচন' : 'Account Role Selection'}
              </span>
              <button
                type="button"
                onClick={() => goBack()}
                className="text-xs text-stone-500 hover:text-stone-800 font-medium transition cursor-pointer p-1"
              >
                {lang === 'bn' ? 'হোমে যান' : 'Cancel'}
              </button>
            </div>
            <RoleSelectionModal
              userName={currentUser?.name}
              onSelect={(role) => {
                if (role === 'service') {
                  selectRole('professional');
                  handleRegisterNavigation('service');
                } else if (role === 'merchant') {
                  selectRole('seller');
                  handleRegisterNavigation('seller');
                } else if (role === 'permanent') {
                  handleRegisterNavigation('permanent');
                } else {
                  setActiveTab('profile');
                }
              }}
              onNavigateToServiceProviderForm={() => handleRegisterNavigation('service')}
              onNavigateToMerchantDashboard={() => handleRegisterNavigation('seller')}
              onNavigateToPermanentMemberForm={() => handleRegisterNavigation('permanent')}
            />
          </div>
        )}

        {/* ================= (ঙ-৪) সার্ভিস প্রোভাইডার রেজিস্ট্রেশন ফর্ম (SP Registration Form) ================= */}
        {activeTab === 'sp_form' && (
          <div className="w-full max-w-md mx-auto p-1 sm:p-2">
            <ServiceProviderRegistrationForm
              currentUser={currentUser}
              initialData={activeSpProfileData || userProfessionalProfile || currentUser}
              isEditMode={Boolean(activeSpProfileData || userProfessionalProfile)}
              onSubmitSuccess={(data) => {
                setActiveSpProfileData(data);
                if (typeof saveProfessionalProfile === 'function') {
                  saveProfessionalProfile(data);
                }
                login(data, true);
                setShowToast('✅ সার্ভিস প্রোভাইডার প্রোফাইল প্রস্তুত হয়েছে!');
                setActiveTab('profile');
              }}
              onSuccess={(data) => {
                setActiveSpProfileData(data);
                if (typeof saveProfessionalProfile === 'function') {
                  saveProfessionalProfile(data);
                }
                login(data, true);
                setActiveTab('profile');
              }}
              onBack={() => goBack()}
              lang={lang}
            />
          </div>
        )}

        {/* ================= (ঙ-৫) সার্ভিস প্রোভাইডার প্রোফাইল (SP Public Profile) ================= */}
        {activeTab === 'sp_profile' && (
          <div className="w-full max-w-md mx-auto p-1 sm:p-2">
            <ServiceProviderProfile
              profileData={activeSpProfileData || userProfessionalProfile || currentUser}
              currentUser={currentUser}
              isOwner={
                activeSpProfileData
                  ? Boolean(currentUser && (currentUser.id === activeSpProfileData.id || currentUser.id === activeSpProfileData.memberUID || (currentUser.phone && currentUser.phone === activeSpProfileData.phone)))
                  : Boolean(userProfessionalProfile || currentUser)
              }
              onEditProfile={(editData) => {
                handleEditProfileRoleBased(editData || activeSpProfileData || userProfessionalProfile || currentUser, 'service');
              }}
              onNavigateDashboard={() => setActiveTab('profile')}
              onSignOut={handleLogout}
              onDeleteAccount={() => {
                setActiveSpProfileData(null);
                handleLogout();
              }}
              onBack={() => goBack()}
              onNavigateSignIn={() => setActiveTab('signin')}
              onBookService={(p) => {
                setShowToast(`🎉 ${p.fullName || p.name || 'সেবাদাতা'}-এর সার্ভিস সফলভাবে বুকিং অনুরোধ পাঠানো হয়েছে!`);
              }}
              onOpenChat={(proName) => {
                setShowToast(`💬 ${proName}-এর সাথে ইনবক্স চ্যাট সংযুক্ত হচ্ছে...`);
              }}
              lang={lang}
            />
          </div>
        )}

        {/* ================= (ঙ-২) এমবেডেড অনবোর্ডিং ও রোল সিলেকশন পেজ (Step 2: Role Setup) ================= */}
        {activeTab === 'track_selection' && (
          !currentUser ? (
            <SignInScreen
              lang={lang}
              onBack={() => goBack()}
              onSignInSuccess={(user) => {
                handleSignInSuccess(user);
              }}
              onNavigateToSignUp={() => {
                setActiveTab('signup');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          ) : (
            <EmbeddedTrackSelectionPage
              lang={lang}
              currentUser={currentUser}
              userName={currentUser?.name}
              onSelectTrack={(track, extraData) => handleSelectTrack(track, extraData)}
              onBack={() => goBack()}
            />
          )
        )}

        {/* ================= (চ) ট্র্যাক এ: সেলার স্টোরফ্রন্ট ও ইনভেন্টরি ম্যানেজমেন্ট ================= */}
        {activeTab === 'track_a_vendor' && (
          !currentUser ? (
            <SignInScreen
              lang={lang}
              onBack={() => goBack()}
              onSignInSuccess={(user) => {
                handleSignInSuccess(user);
              }}
              onNavigateToSignUp={() => {
                setActiveTab('signup');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            />
          ) : (
            <CleanMerchantPage
              lang={lang}
              store={selectedVendorStore || activeVendorStores[0] || vendorStores[0]}
              currentUserRole={userRole === 'seller' ? 'merchant' : 'customer'}
              isOwner={true}
              isAdmin={(currentUser?.role as string) === 'admin'}
              onBack={() => goBack()}
              onAddToCart={(prod, qty) => handleAddToCart(prod as any, qty)}
              onViewProductDetail={(prod) => handleOpenProductDetails(prod)}
            />
          )
        )}

        {/* ================= (ছ) ট্র্যাক বি: প্রফেশনাল সার্ভিস প্রোফাইল বিল্ডার ================= */}
        {activeTab === 'track_b_freelancer' && (
          <EmbeddedServiceProfileBuilder
            lang={lang}
            currentUser={currentUser}
            onBack={() => goBack()}
            onComplete={(savedProfile) => {
              handleSaveProfessionalProfile(savedProfile);
              setActiveTab('freelancer_dashboard');
            }}
          />
        )}

        {/* ================= (জ) ট্র্যাক বি: প্রাইভেট ফ্রিল্যান্সার ড্যাশবোর্ড ও এসক্রো ওয়ালেট ================= */}
        {activeTab === 'freelancer_dashboard' && (
          <EmbeddedFreelancerDashboard
            lang={lang}
            professional={userProfessionalProfile || professionals[0]}
            onBack={() => goBack()}
            onEditPortfolio={() => setActiveTab('track_b_freelancer')}
          />
        )}

        {/* ================= (ঝ) প্রোফাইল পেজ (Role-Gated Profile Rendering) ================= */}
        {activeTab === 'profile' && (
          <div className="p-2 space-y-2">
            {currentUser ? (
              (() => {
                const userMemberUID = String(currentUser?.memberUID || currentUser?.sellerCode || currentUser?.uniqueId || '');
                const userRole = (currentUser?.role || '').toLowerCase();

                // Exact role checks with absolute isolation
                const isServiceProviderUser = 
                  userRole === 'service_provider' || 
                  userRole === 'professional' || 
                  userRole === 'service' || 
                  userRole === 'partner' || 
                  userRole === 'provider' || 
                  userMemberUID.startsWith('JH-P-');

                const isProductSellerUser = 
                  !isServiceProviderUser && (
                    userRole === 'product_seller' || 
                    userRole === 'seller' || 
                    userRole === 'vendor' || 
                    userRole === 'merchant' ||
                    userMemberUID.startsWith('JH-S-')
                  );

                const isPermanentMemberUser = 
                  !isServiceProviderUser && 
                  !isProductSellerUser && (
                    userRole === 'permanent_member' || 
                    userRole === 'permanent' || 
                    userMemberUID.startsWith('JH-M-')
                  );

                const isBloodDonorUser = 
                  !isServiceProviderUser && 
                  !isProductSellerUser && 
                  !isPermanentMemberUser && (
                    userRole === 'blood_donor'
                  );

                const isJobSeekerUser = 
                  !isServiceProviderUser && 
                  !isProductSellerUser && 
                  !isPermanentMemberUser && 
                  !isBloodDonorUser && (
                    userRole === 'job_seeker'
                  );

                // 1. Service Provider Profile
                if (isServiceProviderUser) {
                  return (
                    <ServiceProviderProfile
                      profileData={currentUser}
                      currentUser={currentUser}
                      lang={lang}
                      isOwner={true}
                      onBack={() => setActiveTab('home')}
                      onEditProfile={(data) => handleEditProfileRoleBased(data || currentUser, 'service')}
                      onSignOut={handleLogout}
                      onDeleteAccount={() => {
                        setIsAccountDeletionOpen(true);
                      }}
                    />
                  );
                }

                // 2. Product Seller Profile
                if (isProductSellerUser) {
                  return (
                    <ProductSellerProfile
                      profileData={currentUser}
                      currentUser={currentUser}
                      lang={lang}
                      isOwner={true}
                      onBack={() => setActiveTab('home')}
                      onEditProfile={(data) => handleEditProfileRoleBased(data || currentUser, 'seller')}
                      onSignOut={handleLogout}
                      onDeleteAccount={() => {
                        setIsAccountDeletionOpen(true);
                      }}
                      onAddNewProduct={() => {}}
                    />
                  );
                }

                // 3. Permanent Member Profile
                if (isPermanentMemberUser) {
                  return (
                    <PermanentMemberProfile
                      profileData={currentUser}
                      currentUser={currentUser}
                      lang={lang}
                      isOwner={true}
                      onBack={() => setActiveTab('home')}
                      onEditProfile={(data) => handleEditProfileRoleBased(data || currentUser, 'permanent')}
                      onSignOut={handleLogout}
                      onDeleteAccount={() => {
                        setIsAccountDeletionOpen(true);
                      }}
                    />
                  );
                }

                // 4. Blood Donor Profile
                if (isBloodDonorUser) {
                  return (
                    <div className="py-2 max-w-md mx-auto">
                      <BloodDonorProfileView
                        donor={currentUser}
                        isOwner={true}
                        lang={lang}
                        onSignOut={handleLogout}
                      />
                    </div>
                  );
                }

                // 5. Job Seeker Profile
                if (isJobSeekerUser) {
                  return (
                    <div className="bg-white p-5 rounded-2xl border border-emerald-100 shadow-xs space-y-4 my-2 max-w-md mx-auto">
                      <div className="flex items-center gap-3 border-b border-emerald-100 pb-3">
                        <div className="w-13 h-13 bg-emerald-700 text-white rounded-2xl flex items-center justify-center font-black text-base shadow-sm shrink-0">
                          <Briefcase className="w-6 h-6" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-extrabold text-gray-900 truncate">
                            {currentUser.fullName || currentUser.name}
                          </h3>
                          <p className="text-xs text-emerald-700 font-bold">
                            চাকরিপ্রার্থী প্রোফাইল
                          </p>
                          <span className="inline-block mt-0.5 text-[10px] font-mono font-bold bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded-full border border-emerald-200">
                            আইডি: {currentUser.memberUID || currentUser.id}
                          </span>
                        </div>
                      </div>

                      <div className="space-y-2 text-xs text-gray-700">
                        <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
                          <div>
                            <span className="text-[11px] text-gray-500 block font-medium">শিক্ষাগত যোগ্যতা ও দক্ষতা:</span>
                            <p className="font-bold text-gray-900 text-xs mt-0.5 leading-relaxed">
                              {currentUser.education || currentUser.skills || 'উল্লেখ করা হয়নি'}
                            </p>
                          </div>
                          <div className="flex justify-between items-center text-xs pt-1 border-t border-gray-200">
                            <span className="text-gray-500 font-medium">পছন্দসই চাকরির ধরন:</span>
                            <span className="font-bold text-emerald-800">{currentUser.jobTypePreference || 'যেকোনো'}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 font-medium">মোবাইল নম্বর:</span>
                            <span className="font-bold text-gray-900">{currentUser.phone}</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span className="text-gray-500 font-medium">এলাকা:</span>
                            <span className="font-bold text-gray-900">{currentUser.upazila}, {currentUser.district}</span>
                          </div>
                          {currentUser.cvFileName && (
                            <div className="flex justify-between items-center text-xs pt-1 border-t border-gray-200">
                              <span className="text-gray-500 font-medium">সংযুক্ত সিভি:</span>
                              <span className="font-bold text-emerald-700 flex items-center gap-1 truncate max-w-[170px]">
                                <FileText className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">{currentUser.cvFileName}</span>
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-gray-100 space-y-2">
                        <button
                          type="button"
                          onClick={() => setIsPrivacyPolicyOpen(true)}
                          className="w-full py-2.5 bg-slate-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 border border-gray-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                        >
                          <ShieldCheck className="w-4 h-4 text-emerald-600" />
                          <span>গোপনীয়তা নীতি (Privacy Policy)</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleLogout}
                          className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          <span>লগআউট</span>
                        </button>
                      </div>
                    </div>
                  );
                }

                // 4. General Customer Account View (Rule 1: No registration form, no seller/admin menus)
                return (
                  <div className="bg-white p-5 rounded-2xl border border-gray-100 shadow-xs space-y-4 my-2 max-w-md mx-auto">
                    <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
                      <div className="w-12 h-12 bg-emerald-100 text-emerald-800 rounded-full flex items-center justify-center font-bold text-lg shadow-xs">
                        {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : 'C'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-bold text-gray-900 truncate">{currentUser.name || 'সম্মানিত কাস্টমার'}</h3>
                        <p className="text-xs text-gray-500">{currentUser.phone || 'গেস্ট কাস্টমার অ্যাকাউন্ট'}</p>
                      </div>
                    </div>

                    <div className="space-y-2 text-xs text-gray-700">
                      <div className="p-3 bg-stone-50 rounded-xl border border-stone-100 space-y-1">
                        <p className="font-semibold text-stone-900">
                          {lang === 'bn' ? 'অর্ডার ও ডেলিভারি সংক্রান্ত তথ্য' : 'Order & Delivery Information'}
                        </p>
                        <p className="text-[11px] text-stone-600 leading-relaxed">
                          {lang === 'bn' 
                            ? 'সাধারণ ক্রেতা হিসেবে আপনি সরাসরি ক্যাশ অন ডেলিভারি (COD) বা ফোনে যেকোনো পাহাড়ি পণ্য বা সেবা অর্ডার করতে পারেন।'
                            : 'As a customer, you can order directly via Cash on Delivery or phone. No registration form is required.'}
                        </p>
                      </div>

                      <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100 space-y-1">
                        <p className="font-semibold text-emerald-900">
                          {lang === 'bn' ? 'বিক্রেতা বা সেবাদাতা হতে চান?' : 'Want to Sell or Provide Services?'}
                        </p>
                        <p className="text-[11px] text-emerald-700 leading-relaxed">
                          {lang === 'bn'
                            ? 'ঝাদিমাদিতে পণ্য বিক্রি বা সেবা প্রদানের জন্য নিচের বাটনে ক্লিক করে পার্টনার রেজিস্ট্রেশন করুন।'
                            : 'To sell products or provide services on Jhadimadi, click below to register as a partner.'}
                        </p>
                        <button
                          type="button"
                          onClick={() => handleRegisterNavigation('seller')}
                          className="mt-2 w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition shadow-xs cursor-pointer"
                        >
                          {lang === 'bn' ? 'পার্টনার রেজিস্ট্রেশন করুন' : 'Partner Registration'}
                        </button>
                      </div>
                    </div>

                    {/* গুগল প্লে স্টোর কমপ্লায়েন্স: গোপনীয়তা নীতি ও অ্যাকাউন্ট ব্যবস্থাপনা */}
                    <div className="pt-2 border-t border-gray-100 space-y-2">
                      <button
                        type="button"
                        onClick={() => setIsPrivacyPolicyOpen(true)}
                        className="w-full py-2.5 bg-slate-50 hover:bg-emerald-50 text-gray-700 hover:text-emerald-700 border border-gray-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                        id="btn-customer-privacy-policy"
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        <span>{lang === 'bn' ? 'গোপনীয়তা নীতি (Privacy Policy)' : 'Privacy Policy'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setIsAccountDeletionOpen(true)}
                        className="w-full py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition cursor-pointer"
                        id="btn-customer-delete-account"
                      >
                        <Trash2 className="w-4 h-4 text-rose-600" />
                        <span>{lang === 'bn' ? 'অ্যাকাউন্ট ডিলিট করুন' : 'Delete Account'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleLogout}
                        className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>{lang === 'bn' ? 'লগআউট' : 'Sign Out'}</span>
                      </button>
                    </div>
                  </div>
                );
              })()
            ) : (
              <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-xs text-center space-y-4 my-2 max-w-md mx-auto">
                <div className="w-14 h-14 mx-auto bg-gray-100 text-gray-900 rounded-2xl flex items-center justify-center">
                  <User className="w-7 h-7" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-gray-950">{t.login} / {t.register}</h3>
                  <p className="text-xs text-gray-500 max-w-xs mx-auto leading-relaxed">
                    {lang === 'bn' 
                      ? 'পণ্য বিক্রির জন্য পার্টনারশিপ সেলার প্রোফাইল অথবা সেবা প্রদানের পেশাজীবী পোর্টফোলিও তৈরি করতে সাইন ইন করুন।'
                      : 'Sign in to create a partnership seller profile or service professional portfolio.'}
                  </p>
                </div>

                <div className="pt-2 space-y-2.5">
                  <button
                    onClick={() => setActiveTab('signin')}
                    className="w-full py-3 bg-gray-900 hover:bg-black active:scale-[0.99] text-white rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <LogIn className="w-4 h-4" />
                    <span>{lang === 'bn' ? 'লগইন করুন' : 'Sign In'}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('signup')}
                    className="w-full py-2.5 bg-white hover:bg-gray-50 text-gray-800 border border-gray-300 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4 text-gray-700" />
                    <span>{lang === 'bn' ? 'নতুন একাউন্ট তৈরি করুন' : 'Create New Account'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setIsPrivacyPolicyOpen(true)}
                    className="w-full py-2 text-slate-500 hover:text-emerald-700 text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                    id="btn-guest-privacy-policy"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{lang === 'bn' ? 'গোপনীয়তা নীতি (Privacy Policy)' : 'Privacy Policy'}</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('home')}
                    className="w-full py-2 text-gray-500 hover:text-gray-900 text-xs font-medium cursor-pointer"
                  >
                    {t.backToHome}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= (ঞ) ইন-অ্যাপ সিঙ্গেল পেজ প্রোডাক্ট ডিটেইলস ভিউ (In-App Single Page Product Details View) ================= */}
        {activeTab === 'product_details' && formattedDetailProduct && (
          <div className="w-full min-h-screen bg-[#faf9f6]">
            <ProductDetailsScreen
              product={formattedDetailProduct}
              lang={lang}
              currentUser={currentUser}
              onBack={() => {
                goBack();
              }}
              onAddToCart={(item, qty) => {
                const target = selectedDetailProduct || allProducts.find(p => p.id === item.id);
                if (target) {
                  handleAddToCart(target, qty);
                }
              }}
              onBuyNow={(item, qty) => {
                const target = selectedDetailProduct || allProducts.find(p => p.id === item.id);
                if (target) {
                  handleAddToCart(target, qty);
                  setIsCartModalOpen(true);
                }
              }}
              onOpenCart={() => setIsCartModalOpen(true)}
              cartCount={cartItems.reduce((sum, item) => sum + item.quantity, 0)}
            />
          </div>
        )}

        {/* ================= (ট) স্মার্ট অটো-ক্যাটাগরি ডিরেক্টরি মার্কেটপ্লেস (Automated Multi-Vendor Profile Assignment) ================= */}
        {activeTab === 'auto_directory' && (
          <div className="p-2 pb-6">
            <DynamicAutoRoutingSystem 
              onBackToMain={() => goBack()}
              lang={lang}
            />
          </div>
        )}

        {/* ================= (ড) পূজা উৎসব উপহার আবেদন ফর্ম (Puja Gift Welfare Application) ================= */}
        {activeTab === 'puja_gift' && (
          <div className="pb-8">
            <PujaGiftApplicationForm 
              currentUser={currentUser}
              lang={lang}
              onBack={() => {
                goBack();
              }}
              onSuccess={(app) => {
                setShowToast(
                  lang === 'bn' 
                    ? `পূজা উপহার আবেদন সফলভাবে জমা হয়েছে! ট্র্যাকিং নম্বর: ${app.id.slice(0, 8).toUpperCase()}` 
                    : `Puja gift application submitted! Tracking ID: ${app.id.slice(0, 8).toUpperCase()}`
                );
                setTimeout(() => setShowToast(''), 4000);
              }}
            />
          </div>
        )}

        {/* ================= (ঢ) চাকরি পোর্টাল সাব-পেজ (Dedicated Job Portal Sub-Page) ================= */}
        {activeTab === 'jobs' && (
          <div className="pb-8">
            <JobPortal 
              lang={lang}
              currentUser={currentUser}
              onBackToHome={() => {
                goBack();
              }}
              onShowToast={(msg: string) => {
                setShowToast(msg);
                setTimeout(() => setShowToast(''), 4000);
              }}
            />
          </div>
        )}

        {/* Global Home Page Footer injected via Global Layout */}
        {children}

      </main>

      {/* ৩. লাইট গ্রীন ট্রান্সপারেন্ট বটম নেভিগেশন বার (Unified BottomNav Component) */}
      {activeTab !== 'product_details' && (
        <BottomNav 
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          lang={lang}
          isLoggedIn={!!currentUser}
          currentUser={currentUser}
          isBottomNavVisible={isBottomNavVisible}
          isAdminPreview={isAdminPreview}
          isJhadimadiChatOpen={isJhadimadiChatOpen}
          onOpenAiChat={handleOpenAiChat}
          onRegistrationClick={() => handleRegisterNavigation()}
          onSearchClick={() => {
            setActiveTab('search');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          id="customer-bottom-navigation"
        />
      )}

      {/* ধাপ ১: দ্রুত সাইন আপ ও লগইন মডাল (Facebook/Google/Email Quick Auth Modal) */}
      <QuickAuthModal 
        isOpen={isAuthModalOpen}
        onClose={closeAuthModal}
        onAuthSuccess={(user, isNewSignUp) => {
          handleAuthSuccess(user, isNewSignUp);
        }}
        initialNotice={authNoticeMessage}
        initialMode={authModalInitialMode}
        lang={lang}
      />

      {/* মার্চেন্ট স্টোরফ্রন্ট ও এসক্রো ওয়ালেট মডাল (Track A Vendor Storefront Modal) */}
      {selectedVendorStore && (
        <VendorStorefrontModal
          isOpen={!!selectedVendorStore}
          vendor={selectedVendorStore}
          onClose={() => setSelectedVendorStore(null)}
          onAddToCart={(prod, qty) => {
            handleAddToCart(prod as any, qty);
          }}
          onBuyNow={(prod, qty) => {
            handleAddToCart(prod as any, qty);
            setSelectedVendorStore(null);
            setIsCartModalOpen(true);
          }}
          lang={lang}
        />
      )}

      {/* শপিং কার্ট ও চেকআউট ড্রয়ার মডাল (Cart & Checkout Drawer) */}
      <CartDrawerModal 
        isOpen={isCartModalOpen}
        onClose={() => setIsCartModalOpen(false)}
        cartItems={cartItems}
        onUpdateQty={handleUpdateCartQty}
        onRemoveItem={handleRemoveCartItem}
        onClearCart={handleClearCart}
        lang={lang}
      />

      {/* নোটিফিকেশন মডাল (Real Notifications Modal - Clean without fake badges) */}
      {isNotificationModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden flex flex-col max-h-[80vh]">
            <div className="bg-[#0A6A32] px-4 py-3 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-4 h-4 text-amber-300" />
                <h3 className="text-sm font-black tracking-wide">
                  {lang === 'bn' ? 'নোটিফিকেশন' : 'Notifications'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNotificationModalOpen(false)}
                className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
                title="বন্ধ করুন"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 divide-y divide-gray-100">
              {notificationsList.length === 0 ? (
                <div className="py-8 text-center space-y-2">
                  <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto border border-emerald-100">
                    <Bell className="w-6 h-6 stroke-[1.5]" />
                  </div>
                  <h4 className="text-xs font-bold text-gray-800">
                    {lang === 'bn' ? 'কোনো অপঠিত নোটিফিকেশন নেই' : 'No unread notifications'}
                  </h4>
                  <p className="text-[10px] text-gray-500 max-w-[220px] mx-auto leading-relaxed">
                    {lang === 'bn' 
                      ? 'আপনার অর্ডার, সেবা বুকিং ও অ্যাকাউন্টের সাম্প্রতিক আপডেটগুলো এখানে দেখতে পাবেন।'
                      : 'Your orders, service bookings, and account updates will appear here.'}
                  </p>
                </div>
              ) : (
                notificationsList.map((notif) => (
                  <div key={notif.id} className="py-2.5 first:pt-0 last:pb-0">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-xs font-bold text-gray-900">{notif.title}</h4>
                      {!notif.is_read && (
                        <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-[11px] text-gray-600 mt-0.5">{notif.body}</p>
                    <span className="text-[9px] text-gray-400 mt-1 block">
                      {new Date(notif.created_at).toLocaleDateString(lang === 'bn' ? 'bn-BD' : 'en-US')}
                    </span>
                  </div>
                ))
              )}
            </div>

            {notificationsList.length > 0 && unreadNotificationsCount > 0 && (
              <div className="p-3 bg-stone-50 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => {
                    setNotificationsList(prev => prev.map(n => ({ ...n, is_read: true })));
                    setUnreadNotificationsCount(0);
                    setShowToast(lang === 'bn' ? 'সব নোটিফিকেশন পড়া হয়েছে' : 'All marked as read');
                    setTimeout(() => setShowToast(''), 2000);
                  }}
                  className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs cursor-pointer"
                >
                  {lang === 'bn' ? 'সবগুলো পড়া হয়েছে হিসেবে চিহ্নিত করুন' : 'Mark all as read'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* গ্লোবাল পেশাজীবী পোর্টফোলিও ও রিভিউ মডাল (Track B Portfolio & Public Modal) */}
      <WorkerProfileModal 
        isOpen={!!selectedWorkerProfile}
        provider={selectedWorkerProfile}
        currentUser={currentUser}
        onClose={() => setSelectedWorkerProfile(null)}
        onBookService={(p) => {
          setSelectedWorkerProfile(null);
          setShowToast(`🎉 ${p.name || 'সেবাদাতা'}-এর সার্ভিস সফলভাবে বুকিং অনুরোধ পাঠানো হয়েছে!`);
        }}
        onOpenChat={(proName) => {
          setSelectedWorkerProfile(null);
          setShowToast(`💬 ${proName}-এর সাথে ইনবক্স চ্যাট সংযুক্ত হচ্ছে...`);
        }}
        lang={lang}
      />

      {/* Jhadimadi AI Messaging Overlay Modal */}
      <JhadimadiChatModal
        isOpen={isJhadimadiChatOpen}
        onClose={handleCloseAiChat}
        lang={lang}
        setLang={setLang}
        currentUser={currentUser}
        onAddToCart={(prod, qty) => handleAddToCart(prod as any, qty || 1)}
        onDirectOrder={(prod) => {
          handleAddToCart(prod as any, 1);
          setIsCartModalOpen(true);
        }}
        onOpenProductDetails={(prod) => handleOpenProductDetails(prod as any)}
        onOpenNidVerification={() => {
          handleCloseAiChat();
          setGeminiModalTab('nid');
          setIsGeminiModalOpen(true);
        }}
        onOpenBloodSearch={(bg) => {
          handleCloseAiChat();
          setActiveTab('search');
          setSearchMode('blood');
          if (bg) {
            setSelectedBloodGroup(bg);
          }
          setHasSearched(true);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenHelplineModal={() => {
          handleCloseAiChat();
          setIsSourceModalOpen(true);
        }}
        onOpenFeed={() => {
          handleCloseAiChat();
          setActiveTab('home');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onOpenProfile={handleOpenDigitalProfile}
      />

      {/* Gemini AI Assistant & NID Verification Modal */}
      <GeminiAssistantModal
        isOpen={isGeminiModalOpen}
        onClose={() => setIsGeminiModalOpen(false)}
        lang={lang}
        initialTab={geminiModalTab}
        currentUser={currentUser}
        onAddToCart={(prod) => handleAddToCart(prod as any, 1)}
        onOpenProductDetails={(prod) => handleOpenProductDetails(prod)}
        onVerificationSuccess={(nidData) => {
          if (currentUser) {
            updateUser({
              ...currentUser,
              isNidVerified: true,
              nidNumber: nidData.nidNumber,
            });
          }
          setShowToast('🎉 জাতীয় পরিচয়পত্র (NID) সফলভাবে ভেরিফাই হয়েছে!');
        }}
      />

      {/* পোস্ট-সাইন আপ / পোস্ট-লগইন রোল সিলেকশন মডাল */}
      <RoleSelectionModal
        isOpen={isRoleModalOpen}
        onClose={closeRoleModal}
        userName={currentUser?.name}
        lang={lang}
        onSelect={(roleType) => {
          closeRoleModal();
          if (roleType === 'merchant') {
            selectRole('seller');
            handleRegisterNavigation('seller');
          } else if (roleType === 'service') {
            selectRole('professional');
            handleRegisterNavigation('service');
          } else if (roleType === 'permanent') {
            handleRegisterNavigation('permanent');
          } else {
            setActiveTab('profile');
          }
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateToMerchantDashboard={() => {
          closeRoleModal();
          selectRole('seller');
          handleRegisterNavigation('seller');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateToServiceProviderForm={() => {
          closeRoleModal();
          selectRole('professional');
          handleRegisterNavigation('service');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onNavigateToPermanentMemberForm={() => {
          closeRoleModal();
          handleRegisterNavigation('permanent');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* ডেডিকেটেড সোর্স (জরুরি ৯৯৯ ও জাতীয় তথ্য সেবা) মডাল */}
      {isSourceModalOpen && (
        <div className="fixed inset-0 z-[60] bg-black/65 backdrop-blur-xs flex items-center justify-center p-3 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl border border-red-100 flex flex-col text-left">
            {/* মডাল হেডার */}
            <div className="bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 p-4 text-white rounded-t-3xl relative">
              <button
                type="button"
                onClick={() => setIsSourceModalOpen(false)}
                className="absolute top-3.5 right-3.5 bg-black/20 hover:bg-black/40 text-white rounded-full p-1.5 transition-colors cursor-pointer"
                title="বন্ধ করুন"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2.5">
                <div className="bg-white text-red-600 p-2.5 rounded-2xl shadow-sm">
                  <Siren className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <span className="text-[8px] font-black uppercase tracking-wider bg-white/20 px-2 py-0.5 rounded-full backdrop-blur-xs">
                    জরুরি সোর্স ডিরেক্টরি
                  </span>
                  <h3 className="text-base sm:text-lg font-black mt-0.5 text-white">জাতীয় জরুরি সেবা ও হটলাইন</h3>
                </div>
              </div>
            </div>

            {/* মডাল বডি */}
            <div className="p-4 sm:p-5 space-y-4">
              
              {/* প্রধান বার্তা (ব্যবহারকারীর চাহিদামাফিক অবিকল টেক্সট) */}
              <div className="bg-red-50 border-2 border-red-300 p-4 rounded-2xl text-center space-y-2 shadow-xs">
                <div className="w-10 h-10 bg-red-600 text-white rounded-full flex items-center justify-center mx-auto shadow-sm">
                  <PhoneCall className="w-5 h-5 animate-bounce" />
                </div>
                <h4 className="text-sm sm:text-base font-black text-red-700">জরুরি হেল্পলাইন ৯৯৯ (টোল ফ্রি)</h4>
                <p className="text-[11px] sm:text-xs font-bold text-gray-800 leading-relaxed px-1">
                  "জরুরি ভিত্তিতে যেকোনো জায়গায় পুলিশ, অ্যাম্বুলেন্স এবং ফায়ার সার্ভিস দরকার হলে 999 এ কল করুন। যেকোনো জায়গা থেকে 999 এ কল করলেই আপনি পুলিশ, অ্যাম্বুলেন্স এবং ফায়ার সার্ভিস পেয়ে যাবেন।"
                </p>
                
                {/* সরাসরি ৯৯৯ কল বাটন */}
                <div className="pt-2">
                  <a
                    href="tel:999"
                    className="inline-flex items-center justify-center gap-2 w-full py-3 bg-red-600 hover:bg-red-700 text-white text-sm font-black rounded-xl shadow-md active:scale-95 transition-all cursor-pointer"
                  >
                    <Phone className="w-4 h-4 fill-white" />
                    <span>সরাসরি 999 এ কল করুন</span>
                  </a>
                </div>
              </div>

              {/* ৩টি প্রধান সেবা কার্ড */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {/* পুলিশ */}
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-800 font-black text-xs">
                    <ShieldCheck className="w-4 h-4 text-blue-600" />
                    <span>বাংলাদেশ পুলিশ</span>
                  </div>
                  <p className="text-[9px] text-gray-600 leading-tight">
                    আইন-শৃঙ্খলা রক্ষা, নিরাপত্তা বা জরুরি আইনি সহায়তায় তাৎক্ষণিক ৯৯৯ এ কল করুন।
                  </p>
                  <a
                    href="tel:999"
                    className="inline-block mt-1 text-[8.5px] font-black text-blue-700 hover:underline"
                  >
                    কল: 999 ➔
                  </a>
                </div>

                {/* অ্যাম্বুলেন্স */}
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-rose-800 font-black text-xs">
                    <Activity className="w-4 h-4 text-rose-600" />
                    <span>অ্যাম্বুলেন্স সার্ভিস</span>
                  </div>
                  <p className="text-[9px] text-gray-600 leading-tight">
                    জরুরি রোগী পরিবহন, অক্সিজেন ও আইসিইউ লাইফ সাপোর্টের জন্য ৯৯৯ এ যোগাযোগ করুন।
                  </p>
                  <a
                    href="tel:999"
                    className="inline-block mt-1 text-[8.5px] font-black text-rose-700 hover:underline"
                  >
                    কল: 999 ➔
                  </a>
                </div>

                {/* ফায়ার সার্ভিস */}
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl space-y-1">
                  <div className="flex items-center gap-1.5 text-amber-900 font-black text-xs">
                    <Flame className="w-4 h-4 text-amber-600" />
                    <span>ফায়ার সার্ভিস</span>
                  </div>
                  <p className="text-[9px] text-gray-600 leading-tight">
                    অগ্নিকাণ্ড, সড়ক দুর্ঘটনা ও যে কোনো উদ্ধার অভিযানে ৯৯৯ বা ১৬১৬৩ এ কল করুন।
                  </p>
                  <a
                    href="tel:16163"
                    className="inline-block mt-1 text-[8.5px] font-black text-amber-700 hover:underline"
                  >
                    কল: 16163 ➔
                  </a>
                </div>
              </div>

              {/* জাতীয় গুরুত্বপূর্ণ হটলাইন তালিকা */}
              <div className="space-y-1.5 pt-1 border-t border-gray-100">
                <h5 className="text-[10px] font-black text-gray-800">অন্যান্য জরুরি সরকারি সেবা নম্বর:</h5>
                <div className="grid grid-cols-2 gap-2 text-[9px]">
                  <div className="p-2 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                    <div>
                      <p className="font-black text-gray-900">৩৩৩ (333)</p>
                      <p className="text-[7.5px] text-gray-500">জাতীয় তথ্য ও সেবা</p>
                    </div>
                    <a href="tel:333" className="bg-slate-200 hover:bg-slate-300 text-gray-800 px-2 py-1 rounded-lg font-black text-[8px]">কল</a>
                  </div>

                  <div className="p-2 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                    <div>
                      <p className="font-black text-gray-900">১০৯ (109)</p>
                      <p className="text-[7.5px] text-gray-500">নারী ও শিশু নির্যাতন প্রতিরোধ</p>
                    </div>
                    <a href="tel:109" className="bg-slate-200 hover:bg-slate-300 text-gray-800 px-2 py-1 rounded-lg font-black text-[8px]">কল</a>
                  </div>

                  <div className="p-2 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                    <div>
                      <p className="font-black text-gray-900">১০৯৮ (1098)</p>
                      <p className="text-[7.5px] text-gray-500">চাইল্ড হেল্পলাইন (শিশু সহায়তা)</p>
                    </div>
                    <a href="tel:1098" className="bg-slate-200 hover:bg-slate-300 text-gray-800 px-2 py-1 rounded-lg font-black text-[8px]">কল</a>
                  </div>

                  <div className="p-2 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between">
                    <div>
                      <p className="font-black text-gray-900">১০৬ (106)</p>
                      <p className="text-[7.5px] text-gray-500">দুদক (দুর্নীতি দমন কমিশন)</p>
                    </div>
                    <a href="tel:106" className="bg-slate-200 hover:bg-slate-300 text-gray-800 px-2 py-1 rounded-lg font-black text-[8px]">কল</a>
                  </div>
                </div>
              </div>

            </div>

            {/* মডাল ফুটার */}
            <div className="p-3 bg-gray-50 rounded-b-3xl border-t border-gray-100 text-center">
              <button
                type="button"
                onClick={() => setIsSourceModalOpen(false)}
                className="w-full py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 font-black text-xs rounded-xl transition cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ব্লাড সার্চ অথেন্টিকেশন গার্ড মডাল (Sign In & Quick Register) */}
      <BloodAuthGatekeeperModal
        isOpen={isBloodAuthModalOpen}
        onClose={() => setIsBloodAuthModalOpen(false)}
        onSuccess={(user) => {
          login(user);
        }}
        onNavigateToRegistration={() => {
          setIsBloodAuthModalOpen(false);
          setIsUnifiedRegistrationOpen(true);
        }}
        initialMode={bloodAuthInitialMode}
        lang="bn"
      />

      {/* সেকশন ৩: একীভূত প্রফেশনাল রেজিস্ট্রেশন সিস্টেম (Multi-step Form with Integrated Blood Donor) */}
      <UnifiedRegistrationModal
        isOpen={isUnifiedRegistrationOpen}
        onClose={() => setIsUnifiedRegistrationOpen(false)}
        onSuccess={(registeredData) => {
          setIsUnifiedRegistrationOpen(false);
          setShowToast(`অভিনন্দন ${registeredData.fullName}! আপনার প্রফেশনাল অ্যাকাউন্ট তৈরি সম্পন্ন হয়েছে।`);
          setTimeout(() => setShowToast(''), 4000);
        }}
        lang={lang}
      />

      {/* সেকশন ৫: পণ্য ও সেবা রিভিউ সিস্টেম মডাল */}
      <ProductServiceReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        targetName={reviewTargetName}
        onSubmitReview={({ rating, comment, targetName }) => {
          setShowToast(`ধন্যবাদ! "${targetName}" এর জন্য আপনার ${rating}-স্টার রিভিউ প্রকাশিত হয়েছে।`);
          setTimeout(() => setShowToast(''), 4000);
        }}
        lang={lang}
      />

      {/* বাম পাশের স্লিম নেভিগেশন ড্রয়ার (Hamburger Navigation Drawer with Strictly 4 Items) */}
      <NavigationDrawer
        isOpen={isNavigationDrawerOpen}
        onClose={() => setIsNavigationDrawerOpen(false)}
        currentUser={currentUser}
        lang={lang}
        onOpenCompanyInfo={() => {
          setIsNavigationDrawerOpen(false);
          setIsCompanyInfoOpen(true);
        }}
        onOpenAuth={(mode) => {
          setIsNavigationDrawerOpen(false);
          if (onOpenAuth) {
            onOpenAuth(mode);
          } else {
            setAuthRedirectTarget('profile');
            setActiveTab(mode === 'signup' ? 'signup' : 'signin');
          }
        }}
        onOpenProfile={() => {
          setIsNavigationDrawerOpen(false);
          setActiveTab('profile');
          if (mainScrollContainerRef.current) {
            mainScrollContainerRef.current.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }}
        onOpenPolicyCenter={(section) => {
          setIsNavigationDrawerOpen(false);
          setPolicyCenterInitialSection(section || 'overview');
          setIsPolicyCenterOpen(true);
        }}
        onOpenAdmin={() => {
          setIsNavigationDrawerOpen(false);
          try {
            const adminUrl = window.location.origin + '/admin';
            const newTab = window.open(adminUrl, '_blank', 'noopener,noreferrer');
            if (!newTab && onNavigateToAdmin) {
              onNavigateToAdmin();
            }
          } catch (_) {
            if (onNavigateToAdmin) {
              onNavigateToAdmin();
            } else {
              window.open('/admin', '_blank');
            }
          }
        }}
        onLogout={() => {
          setIsNavigationDrawerOpen(false);
          logout();
          setShowToast(lang === 'en' ? 'Signed out successfully' : 'লগআউট সফলভাবে সম্পন্ন হয়েছে');
          setTimeout(() => setShowToast(''), 3500);
        }}
        onOpenAccountDeletion={() => {
          setIsAccountDeletionOpen(true);
        }}
        onOpenContactUs={() => {
          setIsNavigationDrawerOpen(false);
          setIsContactUsModalOpen(true);
        }}
        onOpenAiChat={handleOpenAiChat}
      />

      {/* ঝাদিমাদি কন্টাক্ট আস ও সাপোর্ট মডাল (Contact Us Modal) */}
      <ContactUsModal
        isOpen={isContactUsModalOpen}
        onClose={() => setIsContactUsModalOpen(false)}
        lang={lang}
        onOpenAiFallback={handleOpenAiChat}
      />

      {/* ঝাদিমাদি ডটকম কোম্পানি পরিচিতি ও প্ল্যাটফর্ম মডাল (Company Info Modal) */}
      <CompanyInfoModal
        isOpen={isCompanyInfoOpen}
        onClose={() => setIsCompanyInfoOpen(false)}
        lang={lang}
        onOpenPolicyCenter={() => {
          setIsCompanyInfoOpen(false);
          setPolicyCenterInitialSection('overview');
          setIsPolicyCenterOpen(true);
        }}
      />

      {/* গুগল প্লে স্টোর ও গ্লোবাল পলিসি সেন্টার মডাল (Policy Center Modal) */}
      <PolicyCenterModal
        isOpen={isPolicyCenterOpen}
        onClose={() => setIsPolicyCenterOpen(false)}
        lang={lang}
        initialSection={policyCenterInitialSection}
        onOpenAccountDeletion={() => {
          setIsPolicyCenterOpen(false);
          setIsAccountDeletionOpen(true);
        }}
      />

      {/* গুগল প্লে স্টোর অ্যাকাউন্ট ও ডাটা ডিলিশন মডাল (Account Deletion Modal) */}
      <AccountDeletionModal
        isOpen={isAccountDeletionOpen}
        onClose={() => setIsAccountDeletionOpen(false)}
        currentUser={currentUser}
        onDeleted={() => {
          logout();
          setShowToast(lang === 'en' ? 'Account deletion request submitted successfully' : 'অ্যাকাউন্ট ডিলিট অনুরোধ সফলভাবে গৃহীত হয়েছে');
          setTimeout(() => setShowToast(''), 4000);
        }}
      />

    </div>
  );
};
