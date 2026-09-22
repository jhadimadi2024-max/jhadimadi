import React, { useState, useMemo } from 'react';
import { 
  User, 
  Lock, 
  Heart, 
  MapPin, 
  Briefcase, 
  Upload, 
  FileText, 
  Award, 
  CheckCircle, 
  ArrowRight, 
  Camera, 
  ShieldCheck, 
  Globe, 
  Plus, 
  Trash2, 
  LayoutDashboard, 
  Wallet, 
  Clock, 
  AlertCircle,
  Store,
  ArrowLeft,
  Phone,
  CheckCircle2,
  Sparkles,
  Search,
  Layers,
  Check,
  Settings,
  Package,
  Hash,
  RefreshCw,
  ChevronDown
} from 'lucide-react';
import { 
  LOCATION_MASTER, 
  getAllDivisions, 
  getDistrictsByDivision, 
  getUpazilasByDistrict, 
  generateMemberUID, 
  getLocationCodes 
} from '../data/locationMaster';
import { databaseService } from '../services/databaseService';
import { compressImage, sanitizeDatabasePayload } from '../utils/imageUtils';
import { MerchantStorefront } from './MerchantStorefront';
import { CleanMerchantPage } from './CleanMerchantPage';
import { ServiceProviderPublicProfile } from './ServiceProviderPublicProfile';

// Structured Category & Profession Mapping
export const PROFESSIONS_DATA = [
  {
    id: 1,
    category_bn: "১. পরিবহন, চালক ও পণ্য পরিবহন সেবা",
    category_en: "1. Transport, Driver & Delivery Services",
    items: [
      { id: "101", bn: "রিকশা চালক", en: "Rickshaw Puller" },
      { id: "102", bn: "অটো-রিকশা / ইজিবাইক / সিএনজি চালক", en: "Auto-Rickshaw / Easybike / CNG Driver" },
      { id: "103", bn: "লেগুনা / হিউম্যান হোল্ডার চালক", en: "Leguna / Human Hauler Driver" },
      { id: "104", bn: "বাইক / রাইড শেয়ারিং রাইডার", en: "Bike / Ride Sharing Rider" },
      { id: "105", bn: "প্রাইভেট কার ও ট্যাক্সি চালক", en: "Private Car & Taxi Driver" },
      { id: "106", bn: "মাইক্রোবাস ও হাইয়েস চালক", en: "Microbus & HiAce Driver" },
      { id: "107", bn: "পিকআপ ও ছোট কাভার্ড ভ্যান চালক", en: "Pickup & Covered Van Driver" },
      { id: "108", bn: "হেভি ট্রাক ও কন্টেইনার চালক", en: "Heavy Truck & Container Driver" },
      { id: "109", bn: "বাস চালক (সিটি ও আন্তঃজেলা)", en: "Bus Driver (City & Inter-district)" },
      { id: "110", bn: "অ্যাম্বুলেন্স ও ফ্রিজিং ভ্যান চালক", en: "Ambulance & Freezing Van Driver" },
      { id: "111", bn: "ট্রাক্টর, ট্রলি ও এক্সকাভেটর (ভেকু) চালক", en: "Tractor, Trolley & Excavator Driver" },
      { id: "112", bn: "নৌকা, ট্রলার ও স্পিডবোট মাঝি", en: "Boat, Trawler & Speedboat Driver" },
      { id: "113", bn: "বাইসাইকেল ডেলিভারিম্যান", en: "Bicycle Deliveryman" },
      { id: "114", bn: "ঠেলাগাড়ি ও হাতভ্যান চালক", en: "Cart & Hand-van Puller" }
    ]
  },
  {
    id: 2,
    category_bn: "২. বাসা বদল, লজিস্টিকস ও কায়িক শ্রম",
    category_en: "2. Home Shift, Logistics & Manual Labor",
    items: [
      { id: "201", bn: "বাসা বদল প্যাকার্স ও মোভার্স কর্মী", en: "Packers & Movers Staff" },
      { id: "202", bn: "কুলি / লোড-আনলোড লেবার", en: "Coolie / Load-Unload Labor" },
      { id: "203", bn: "কুরিয়ার ও ফুড ডেলিভারি বয়", en: "Courier & Food Delivery Boy" },
      { id: "204", bn: "অন-কল বাজারকারী", en: "On-Call Grocery Shopper" },
      { id: "205", bn: "দিনমজুর (Day Laborer)", en: "Day Laborer" }
    ]
  },
  {
    id: 3,
    category_bn: "৩. গৃহস্থালি, পরিচ্ছন্নতা ও বর্জ্য ব্যবস্থাপনা",
    category_en: "3. Household, Cleaning & Waste Management",
    items: [
      { id: "301", bn: "কাজের বুয়া / গৃহপরিচারিকা", en: "Maid / Housekeeping Staff" },
      { id: "302", bn: "কাজের লোক (পুরুষ গৃহকর্মী)", en: "Male House Helper" },
      { id: "303", bn: "ডিপ ক্লিনিং টেকনিশিয়ান", en: "Deep Cleaning Technician" },
      { id: "304", bn: "ময়লা সংগ্রহকারী (Garbage Collector)", en: "Garbage Collector" },
      { id: "305", bn: "ড্রেন ও সেপটিক ট্যাংক পরিষ্কারকারী", en: "Drain & Septic Tank Cleaner" },
      { id: "306", bn: "ঝাড়ুদার / পরিষ্কার পরিচ্ছন্নতাকর্মী", en: "Sweeper / Cleaner" },
      { id: "307", bn: "কার ওয়াশার", en: "Car Washer" },
      { id: "308", bn: "পানির জার/ড্রাম সরবরাহকারী", en: "Water Jar / Drum Supplier" },
      { id: "309", bn: "পেস কন্ট্রোল সার্ভিস প্রোভাইডার", en: "Pest Control Provider" },
      { id: "310", bn: "পানির ট্যাঙ্ক ও ছাদ পরিষ্কারকারী", en: "Water Tank & Roof Cleaner" }
    ]
  },
  {
    id: 4,
    category_bn: "৪. মেরামত, টেকনিক্যাল ও মেকানিক সেবা",
    category_en: "4. Repair, Technical & Mechanic Services",
    items: [
      { id: "401", bn: "ইলেক্ট্রিশিয়ান", en: "Electrician" },
      { id: "402", bn: "প্লাম্বার (পাইপ মিস্ত্রি)", en: "Plumber" },
      { id: "403", bn: "এসি ও ফ্রিজ মেকানিক", en: "AC & Fridge Mechanic" },
      { id: "404", bn: "গ্যাস স্টোভ ও লাইন মিস্ত্রি", en: "Gas Stove & Pipeline Technician" },
      { id: "405", bn: "আইপিএস, ইউপিএস ও সোলা টেকনিশিয়ান", en: "IPS, UPS & Solar Technician" },
      { id: "406", bn: "টিভি, ওভেন ও ওয়াশিং সেবা মিস্ত্রি", en: "TV, Oven & Appliance Repairer" },
      { id: "407", bn: "কম্পিউটার, ল্যাপটপ ও আইটি মেকানিক", en: "Computer, Laptop & IT Mechanic" },
      { id: "408", bn: "সিসিটিভি ও সিকিউরিটি ইনস্টলার", en: "CCTV & Security Technician" },
      { id: "409", bn: "সাইকেল ও মোটরসাইকেল মেকানিক", en: "Bicycle & Motorcycle Mechanic" },
      { id: "410", bn: "অটো, সিএনজি ও কার মেকানিক", en: "Auto, CNG & Car Mechanic" },
      { id: "411", bn: "লকস্মিথ (তালা-চাবি মিস্ত্রি)", en: "Locksmith" },
      { id: "412", bn: "পাম্প ও সাবমার্সিবল মিস্ত্রি", en: "Pump & Submersible Technician" },
      { id: "413", bn: "টিউবওয়েল/নলকূপ মিস্ত্রি", en: "Tubewell Technician" }
    ]
  },
  {
    id: 5,
    category_bn: "৫. নির্মাণ, কাঠ, গ্লাস ও হস্তশিল্প",
    category_en: "5. Construction, Wood, Glass & Crafts",
    items: [
      { id: "501", bn: "রাজমিস্ত্রি", en: "Mason (Rajmistri)" },
      { id: "502", bn: "রাজমিস্ত্রির যোগালি", en: "Mason Helper (Jogali)" },
      { id: "503", bn: "টাইলস ও মার্বেল মিস্ত্রি", en: "Tiles & Marble Worker" },
      { id: "504", bn: "কাঠমিস্ত্রি (Carpenter)", en: "Carpenter" },
      { id: "505", bn: "রংমিস্ত্রি (Painter)", en: "Painter" },
      { id: "506", bn: "গ্রিল, থাই গ্লাস ও অ্যালুমিনিয়াম মিস্ত্রি", en: "Grill, Thai Glass & Aluminum Worker" },
      { id: "507", bn: "ওয়েল্ডিং মিস্ত্রি", en: "Welder" },
      { id: "508", bn: "ডিশ ও ইন্টারনেট কেবল টেকনিশিয়ান", en: "Dish & Internet Cable Technician" },
      { id: "509", bn: "ছাদ ঢালাই ও রড বাইন্ডার", en: "Roof Casting & Rod Binder" },
      { id: "510", bn: "কাঁচ কাটা ও রিমুভাল কর্মী", en: "Glass Cutter & Fitter" },
      { id: "511", bn: "পর্দাসজ্জা মিস্ত্রি", en: "Curtain Fitter" }
    ]
  },
  {
    id: 6,
    category_bn: "৬. পার্সোনাল বিউটি, ক্লথিং ও কেয়ার",
    category_en: "6. Personal Beauty, Clothing & Care",
    items: [
      { id: "601", bn: "নরসুন্দর / নাপিত", en: "Barber / Hairdresser" },
      { id: "602", bn: "বিউটিশিয়ান ও মেকআপ আর্টিস্ট", en: "Beautician & Makeup Artist" },
      { id: "603", bn: "মেহেদি আর্টিস্ট", en: "Mehendi Artist" },
      { id: "604", bn: "লন্ড্রি ও ইস্ত্রিওয়ালা", en: "Laundry & Ironing Worker" },
      { id: "605", bn: "দর্জি / মাস্টার টেইলর", en: "Tailor / Master Tailor" },
      { id: "606", bn: "মুচি / জুতা মেরামতকারী", en: "Cobbler / Shoe Repairer" },
      { id: "607", bn: "লেপ-তোশক বানানো কারিগর (ধুনকার)", en: "Quilt & Mattress Maker" },
      { id: "608", bn: "সোফা ও কভার মেকার", en: "Sofa & Cover Maker" },
      { id: "609", bn: "ফার্নিচার বার্নিশকারী (গালা পলিশ)", en: "Furniture Polish Maker" }
    ]
  },
  {
    id: 7,
    category_bn: "৭. চিকিৎসা, থেরাপি ও স্বাস্থ্যসেবা",
    category_en: "7. Medical, Therapy & Healthcare",
    items: [
      { id: "701", bn: "প্রাইভেট ফ্যামিলি ডাক্তার (এমবিবিএস/বিশেষজ্ঞ)", en: "Private Family Doctor (MBBS)" },
      { id: "702", bn: "হোমিওপ্যাথি চিকিৎসক", en: "Homeopathy Doctor" },
      { id: "703", bn: "কবিরাজ ও হেকিম (ইউনানি/আয়ুর্বেদিক)", en: "Unani / Ayurvedic Practitioner" },
      { id: "704", bn: "নার্স ও মেল/ফিমেল কেয়ারগিভার", en: "Nurse & Caregiver" },
      { id: "705", bn: "ফিজিওথেরাপিষ্ট", en: "Physiotherapist" },
      { id: "706", bn: "হিজামা (Cupping) থেরাপিস্ট", en: "Hijama (Cupping) Therapist" },
      { id: "707", bn: "আকুপ্রেসার ও বডি ম্যাসেজার", en: "Accupressure & Body Massager" },
      { id: "708", bn: "প্যাথলজিক্যাল স্যাম্পল সংগ্রাহক", en: "Pathology Sample Collector" },
      { id: "709", bn: "ধাত্রী / মেটারনিটি আয়া", en: "Maternity Maid / Midwife" },
      { id: "710", bn: "পশু চিকিৎসক (Veterinary Doctor)", en: "Veterinary Doctor" }
    ]
  },
  {
    id: 8,
    category_bn: "৮. ইভেন্ট, ডেকোরেশন, মিডিয়া ও বিনোদন",
    category_en: "8. Events, Decoration, Media & Entertainment",
    items: [
      { id: "801", bn: "ইভেন্ট ডেকোরেটর", en: "Event Decorator" },
      { id: "802", bn: "সাউন্ড সিস্টেম ও মাইক অপারেটর", en: "Sound System Operator" },
      { id: "803", bn: "লাইটিং টেকনিশিয়ান", en: "Lighting Technician" },
      { id: "804", bn: "ডিজে (DJ)", en: "DJ" },
      { id: "805", bn: "প্যান্ডেল ও সামিয়ানা মিস্ত্রি", en: "Pandal Technician" },
      { id: "806", bn: "জেনারেটর অপারেটর", en: "Generator Operator" },
      { id: "807", bn: "ভেলুন ও ফুল সাজিয়ে ডেকোরেটর", en: "Balloon & Flower Decorator" },
      { id: "808", bn: "ইভেন্ট হোস্ট / অ্যাঙ্কর", en: "Event Host / Anchor" },
      { id: "809", bn: "ম্যাজিশিয়ান ও এন্টারটেইনার", en: "Magician" },
      { id: "810", bn: "ফটোগ্রাফার", en: "Photographer" },
      { id: "811", bn: "ভিডিওগ্রাফার ও ড্রোন অপারেটর", en: "Videographer & Drone Operator" },
      { id: "812", bn: "ভিডিও এডিটর ও ফটো রিটার্চার", en: "Video Editor & Photo Retoucher" },
      { id: "813", bn: "গ্রাফিক ডিজাইনার", en: "Graphic Designer" },
      { id: "814", bn: "ভয়েস ওভার আর্টিস্ট", en: "Voiceover Artist" }
    ]
  },
  {
    id: 9,
    category_bn: "৯. খাদ্য, রান্নাবান্না ও কৃষি/উৎপাদন",
    category_en: "9. Food, Cooking & Agriculture",
    items: [
      { id: "901", bn: "বাসা/মেসের বাবুর্চি", en: "Mess / Home Cook" },
      { id: "902", bn: "অনুষ্ঠানের শাহি বাবুর্চি", en: "Event Chef (Shahi Baburchi)" },
      { id: "903", bn: "হোম বেকার", en: "Home Baker" },
      { id: "904", bn: "কসাই / মাংস কাটার লোক", en: "Butcher / Meat Cutter" },
      { id: "905", bn: "মাছ কাটার লোক", en: "Fish Cutter" },
      { id: "906", bn: "মালি (Gardener)", en: "Gardener" },
      { id: "907", bn: "গাছ কাটা ও ডাল ছাঁটাইকারী", en: "Tree Cutter & Trimmer" },
      { id: "908", bn: "ডাব ও নারকেল পাড়ানি", en: "Coconut Plucker" },
      { id: "909", bn: "পুকুর সেচ ও জেলে", en: "Pond Draining & Fisherman" }
    ]
  },
  {
    id: 10,
    category_bn: "১০. ধর্মীয়, সামাজিক, আইনি ও অন্যান্য পেশা",
    category_en: "10. Religious, Social, Legal & Others",
    items: [
      { id: "1001", bn: "কাজী (মুসলিম ম্যারেজ রেজিস্টার)", en: "Kazi (Marriage Registrar)" },
      { id: "1002", bn: "পুরোহিত (Hindu Priest)", en: "Hindu Priest (Purohit)" },
      { id: "1003", bn: "ইমাম, মুয়াজ্জিন ও হাফেজ", en: "Imam, Muezzin & Hafiz" },
      { id: "1004", bn: "আইনজীবী (Advocate)", en: "Advocate / Lawyer" },
      { id: "1005", bn: "মুহুরি / স্ট্যাম্প রাইটার", en: "Stamp Writer / Muhuri" },
      { id: "1006", bn: "আমিন / সার্ভেয়ার (ল্যান্ড সার্ভে)", en: "Land Surveyor (Amin)" },
      { id: "1007", bn: "কবর খননকারী", en: "Grave Digger" },
      { id: "1008", bn: "লাশ গোসল করানো কর্মী", en: "Funeral Bathing Worker" },
      { id: "1009", bn: "প্রাইভেট ডিটেকটিভ", en: "Private Detective" },
      { id: "1010", bn: "পার্সোনাল বডিগার্ড / সিকিউরিটি গার্ড", en: "Personal Bodyguard" },
      { id: "1011", bn: "সার্ভিস ডগ ট্রেইনার", en: "Service Dog Trainer" },
      { id: "1012", bn: "গৃহশিক্ষক / প্রাইভেট টিউটর", en: "Home Tutor" },
      { id: "1013", bn: "প্রোফ রিডার ও টাইপিস্ট", en: "Proofreader & Typist" },
      { id: "1014", bn: "ঢোলক, সানাই ও ব্যান্ড বাদক", en: "Band / Dholak Player" },
      { id: "1015", bn: "ঘোড়ার গাড়ি (টমটম) চালক", en: "Horse Cart Driver" },
      { id: "1016", bn: "পোষা প্রাণীর ট্রেইনার ও গ্রুমার", en: "Pet Trainer & Groomer" }
    ]
  }
];

interface ServiceProviderFullSystemProps {
  onSuccess?: (newProfessional: any) => void;
  onBack?: () => void;
  onSelectMerchant?: () => void;
  currentUser?: any;
  allDistricts?: Record<string, string[]>;
  initialLang?: 'bn' | 'en';
}

const DEFAULT_DISTRICTS = [
  'খাগড়াছড়ি', 'ঢাকা', 'চট্টগ্রাম', 'রাঙ্গামাটি', 'বান্দরবান', 'কক্সবাজার',
  'কুমিল্লা', 'সিলেট', 'রাজশাহী', 'খুলনা', 'বরিশাল', 'রংপুর', 'ময়মনসিংহ',
  'গাজীপুর', 'নারায়ণগঞ্জ', 'বগুড়া', 'নোয়াখালী', 'ফেনী', 'পাবনা'
];

export const ServiceProviderFullSystem: React.FC<ServiceProviderFullSystemProps> = ({
  onSuccess,
  onBack,
  onSelectMerchant,
  currentUser,
  allDistricts,
  initialLang = 'bn'
}) => {
  // Language State: 'bn' for Bangla, 'en' for English
  const [lang, setLang] = useState<'bn' | 'en'>(initialLang);
  
  // App View Navigation State: 'role_select' | 'service_form' | 'product_store' | 'provider_dashboard'
  const [viewState, setViewState] = useState<'role_select' | 'service_form' | 'product_store' | 'provider_dashboard'>('role_select');
  const [selectedRole, setSelectedRole] = useState<string>('service');

  // Step 1 Category selection (1 to 10, or 0 for 'all')
  const [selectedCategoryId, setSelectedCategoryId] = useState<number>(4); // Default to Category 4 (Repairs & Mechanics)
  const [searchSkillQuery, setSearchSkillQuery] = useState('');
  const [customSkillInput, setCustomSkillInput] = useState('');

  // Service Provider Registration Form State
  const [formData, setFormData] = useState({
    profileImage: (currentUser?.avatar || '') as string,
    fullName: (currentUser?.name || '') as string,
    fatherName: '',
    motherName: '',
    nidNumber: '',
    phone: (currentUser?.phone || '') as string,
    bloodGroup: '',
    division: (currentUser?.division || 'চট্টগ্রাম') as string,
    district: (currentUser?.district || 'খাগড়াছড়ি') as string,
    thana: (currentUser?.upazila || 'দীঘিনালা') as string,
    paraMaholla: '',
    selectedSkills: ['ইলেক্ট্রিশিয়ান'] as string[],
    bioText: '',
    nidFrontFile: null as File | null,
    nidBackFile: null as File | null,
    cvFile: null as File | null,
    certificateFiles: null as FileList | null
  });

  // Registration feedback state
  const [regStatus, setRegStatus] = useState<{ type: 'loading' | 'success' | 'error'; message: string } | null>(null);

  // Divisions list
  const divisions = useMemo(() => getAllDivisions(), []);

  // Filtered districts for selected division in main form
  const formDistricts = useMemo(() => {
    const list = getDistrictsByDivision(formData.division);
    return list.length > 0 ? list : [{ nameBn: 'খাগড়াছড়ি', nameEn: 'Khagrachhari', code: 'KHG' }];
  }, [formData.division]);

  // Filtered upazilas for selected district in main form
  const formUpazilas = useMemo(() => {
    const list = getUpazilasByDistrict(formData.district);
    return list.length > 0 ? list : [{ nameBn: 'দীঘিনালা', nameEn: 'Dighinala', code: 'DGH' }];
  }, [formData.district]);

  // Handle Division Change for main form
  const handleMainDivisionChange = (newDiv: string) => {
    const newDistricts = getDistrictsByDivision(newDiv);
    const firstDist = newDistricts.length > 0 ? newDistricts[0].nameBn : 'খাগড়াছড়ি';
    const newUpz = getUpazilasByDistrict(firstDist);
    const firstUpz = newUpz.length > 0 ? newUpz[0].nameBn : 'সদর';
    setFormData(prev => ({
      ...prev,
      division: newDiv,
      district: firstDist,
      thana: firstUpz
    }));
  };

  // Handle District Change for main form
  const handleMainDistrictChange = (newDist: string) => {
    const newUpz = getUpazilasByDistrict(newDist);
    const firstUpz = newUpz.length > 0 ? newUpz[0].nameBn : 'সদর';
    setFormData(prev => ({
      ...prev,
      district: newDist,
      thana: firstUpz
    }));
  };

  // Location codes & preview Member UID for main form
  const formLocCodes = useMemo(() => {
    return getLocationCodes(formData.division, formData.district, formData.thana);
  }, [formData.division, formData.district, formData.thana]);

  const formPreviewUID = `${formLocCodes.divCode}-${formLocCodes.distCode}-${formLocCodes.upazilaCode}-XXXX`;

  // Language Dictionary
  const t = {
    bn: {
      selectTitle: 'আপনি কি ঝাদিমাদি ডট কমে পণ্য বিক্রি করতে চান নাকি সেবা বিক্রি করতে চান? নিচের ড্রপডাউন বার থেকে সিলেক্ট করে সাবমিট করুন।',
      selectLabel: 'রেজিস্ট্রেশনের ধরন নির্বাচন করুন',
      serviceOpt: 'সেবা বিক্রি করুন (পেশাজীবী / সেবাদাতা)',
      productOpt: 'মার্চেন্ট অ্যাকাউন্ট (পণ্য বিক্রেতা)',
      submitBtn: 'সাবমিট করুন',
      formTitle: 'পেশাজীবী সেবাদাতা রেজিস্ট্রেশন ফর্ম',
      formSubtitle: 'স্বচ্ছতায় সঠিক এনআইডি ও পেশাগত তথ্য দিয়ে প্রোফাইল তৈরি করুন',
      changeRole: 'রোল পরিবর্তন করুন',
      profilePicLabel: 'প্রোফাইল ছবি আপলোড করুন',
      personalSec: 'ব্যক্তিগত ও এনআইডি তথ্য',
      fullName: 'ভোটার আইডি অনুসারে নাম *',
      fatherName: 'পিতার নাম *',
      motherName: 'মাতার নাম *',
      nidNum: 'জাতীয় পরিচয়পত্র (NID) নম্বর *',
      phone: 'মোবাইল নম্বর *',
      phoneNote: 'গ্রাহকদের কাছে সরাসরি উন্মুক্ত নয়, গোপন থাকবে',
      bloodSec: 'ব্লাড গ্রুপ (জরুরি রক্তদানের জন্য বাধ্যতামূলক) *',
      locationSec: 'কর্ম এলাকা নির্বাচন',
      district: 'জেলা *',
      thana: 'উপজেলা / থানা *',
      para: 'পাড়া / মহল্লা / গ্রাম *',
      skillsSec: 'পেশা ও সেবা নির্বাচন',
      step1Label: 'ধাপ ১: মূল কাজের ক্যাটাগরি বেছে নিন',
      step2Label: 'ধাপ ২: সুনির্দিষ্ট পেশা / সেবা সিলেক্ট করুন (একাধিক নির্বাচন করতে পারবেন)',
      allCategoryOpt: '🔍 সকল ক্যাটাগরি একসাথে দেখুন',
      searchSkillPlaceholder: 'পেশা বা সেবা খুঁজুন (যেমন: ড্রাইভার, প্লাম্বার, নার্স)...',
      selectedSkillsCount: 'নির্বাচিত পেশা/দক্ষতা',
      addCustomSkillLabel: 'তালিকায় পেশা না থাকলে লিখে যুক্ত করুন:',
      customSkillPlaceholder: 'যেমন: সোলার বিদ্যুৎ টেকনিশিয়ান, স্যানিটারি মিস্ত্রি...',
      addBtn: 'যুক্ত করুন',
      bioSec: 'আপনার নিজের ও কাজের অভিজ্ঞতা সম্পর্কে লিখুন',
      bioPlaceholder: 'যেমন: আমি গত ৫ বছর ধরে সততা ও দক্ষতার সাথে সাভার ও উত্তরা এলাকায় কাজ করছি...',
      uploadSec: 'প্রয়োজনীয় এনআইডি ও প্রফেশনাল ফাইল আপলোড',
      nidFront: 'NID / ভোটার আইডি (সামনের অংশ)',
      nidBack: 'NID / ভোটার আইডি (পিছনের অংশ)',
      cvUpload: 'বায়োডাটা / সিভি আপলোড (PDF/Word)',
      certUpload: 'শিক্ষাগত বা কাজের সার্টিফিকেট (Image/PDF)',
      completeRegBtn: 'প্রোফাইল রেজিস্ট্রেশন সম্পূর্ণ করুন',
      dashboardTitle: 'সেবাদাতা ড্যাশবোর্ড',
      verifiedStatus: 'আইডি ভেরিফিকেশন স্ট্যাটাস: পেন্ডিং (যাচাই চলছে)',
      totalEarning: 'মোট আয় (ইনকাম)',
      activeJobs: 'চলতি কাজ (Bookings)',
      completedJobs: 'সম্পন্ন কাজ',
      myProfilePreview: 'গ্রাহকদের কাছে আপনার প্রোফাইলটি যেভাবে দেখাবে:',
      verifiedBadge: 'এনআইডি যাচাইকৃত',
      pendingBadge: 'যাচাই প্রক্রিয়াধীন',
      editProfile: 'প্রোফাইল সম্পাদনা',
      backToHome: 'হোমে ফিরে যান',
      viewInSearch: 'সার্চ রেজাল্ট ভিউ',
      noSkillFound: 'কোনো পেশা খুঁজে পাওয়া যায়নি। নিচে লিখে যুক্ত করুন।'
    },
    en: {
      selectTitle: 'Do you want to sell products or offer professional services on Jhadimadi.com? Select from the bar below and submit.',
      selectLabel: 'Select Registration Type:',
      serviceOpt: 'Sell Services (Professional / Service Provider)',
      productOpt: 'Sell Products (E-Commerce Merchant)',
      submitBtn: 'Submit',
      formTitle: 'Professional Service Provider Registration Form',
      formSubtitle: 'Create your profile by providing accurate NID and professional details',
      changeRole: 'Change Role',
      profilePicLabel: 'Upload Profile Photo',
      personalSec: 'Personal & NID Information',
      fullName: 'Full Name (As per NID) *',
      fatherName: "Father's Name *",
      motherName: "Mother's Name *",
      nidNum: 'National ID (NID) Number *',
      phone: 'Mobile Phone *',
      phoneNote: 'Hidden from public for privacy',
      bloodSec: 'Blood Group (Mandatory for Emergency Donors) *',
      locationSec: 'Work Location / Coverage Area',
      district: 'District *',
      thana: 'Upazila / Thana *',
      para: 'Para / Maholla / Village *',
      skillsSec: 'Profession & Skills Selection',
      step1Label: 'Step 1: Select Main Category',
      step2Label: 'Step 2: Select Specific Profession(s) (Multiple selectable)',
      allCategoryOpt: '🔍 View All Categories Together',
      searchSkillPlaceholder: 'Search profession (e.g. Driver, Plumber, Nurse)...',
      selectedSkillsCount: 'Selected Professions',
      addCustomSkillLabel: 'If your profession is not listed, type and add it:',
      customSkillPlaceholder: 'e.g. Solar Technician, Sanitary Specialist...',
      addBtn: 'Add Skill',
      bioSec: 'Write about yourself and your work experience',
      bioPlaceholder: 'e.g. I have 5 years of professional experience with verified track record...',
      uploadSec: 'Upload Required NID & Certificates',
      nidFront: 'NID / ID Card (Front Side)',
      nidBack: 'NID / ID Card (Back Side)',
      cvUpload: 'Upload CV / Bio-data (PDF/Word)',
      certUpload: 'Upload Educational / Work Certificates (Image/PDF)',
      completeRegBtn: 'Complete Profile Registration',
      dashboardTitle: 'Service Provider Dashboard',
      verifiedStatus: 'ID Verification Status: Pending Approval',
      totalEarning: 'Total Earnings',
      activeJobs: 'Active Bookings',
      completedJobs: 'Completed Orders',
      myProfilePreview: 'How your profile appears in local customer search:',
      verifiedBadge: 'NID Verified',
      pendingBadge: 'Pending Verification',
      editProfile: 'Edit Profile',
      backToHome: 'Back to Home',
      viewInSearch: 'Search Result View',
      noSkillFound: 'No profession found. Type and add below.'
    }
  };

  const currentT = t[lang];

  const districtList = allDistricts ? Object.keys(allDistricts) : DEFAULT_DISTRICTS;
  const upazilaList = allDistricts && formData.district && allDistricts[formData.district] 
    ? allDistricts[formData.district] 
    : [];

  // Filter items based on category selection & search query
  const filteredProfessionsList = useMemo(() => {
    const query = searchSkillQuery.toLowerCase().trim();
    
    // If there is an active search query, search across ALL categories
    if (query) {
      const matched: { id: string; name: string; categoryName: string }[] = [];
      PROFESSIONS_DATA.forEach(cat => {
        cat.items.forEach(item => {
          const name = lang === 'bn' ? item.bn : item.en;
          const altName = lang === 'bn' ? item.en : item.bn;
          if (name.toLowerCase().includes(query) || altName.toLowerCase().includes(query)) {
            matched.push({
              id: item.id,
              name: name,
              categoryName: lang === 'bn' ? cat.category_bn : cat.category_en
            });
          }
        });
      });
      return matched;
    }

    // If "0" is selected (All categories), show all
    if (selectedCategoryId === 0) {
      const all: { id: string; name: string; categoryName: string }[] = [];
      PROFESSIONS_DATA.forEach(cat => {
        cat.items.forEach(item => {
          all.push({
            id: item.id,
            name: lang === 'bn' ? item.bn : item.en,
            categoryName: lang === 'bn' ? cat.category_bn : cat.category_en
          });
        });
      });
      return all;
    }

    // Filter by specific selected category
    const cat = PROFESSIONS_DATA.find(c => c.id === selectedCategoryId);
    if (!cat) return [];
    return cat.items.map(item => ({
      id: item.id,
      name: lang === 'bn' ? item.bn : item.en,
      categoryName: lang === 'bn' ? cat.category_bn : cat.category_en
    }));
  }, [selectedCategoryId, searchSkillQuery, lang]);

  // Additional Dashboard States for Complete Profile Edit & Product Addition
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [editFormData, setEditFormData] = useState({ ...formData });

  // Filtered districts for edit form
  const editDistricts = useMemo(() => {
    const list = getDistrictsByDivision(editFormData.division || formData.division);
    return list.length > 0 ? list : [{ nameBn: 'খাগড়াছড়ি', nameEn: 'Khagrachhari', code: 'KHG' }];
  }, [editFormData.division, formData.division]);

  // Filtered upazilas for edit form
  const editUpazilas = useMemo(() => {
    const list = getUpazilasByDistrict(editFormData.district || formData.district);
    return list.length > 0 ? list : [{ nameBn: 'দীঘিনালা', nameEn: 'Dighinala', code: 'DGH' }];
  }, [editFormData.district, formData.district]);

  const handleEditDivisionChange = (newDiv: string) => {
    const newDistricts不易 = getDistrictsByDivision(newDiv);
    const firstDist = newDistricts不易.length > 0 ? newDistricts不易[0].nameBn : 'খাগড়াছড়ি';
    const newUpz = getUpazilasByDistrict(firstDist);
    const firstUpz作成 = newUpz.length > 0 ? newUpz[0].nameBn : 'সদর';
    setEditFormData(prev => ({
      ...prev,
      division: newDiv,
      district: firstDist,
      thana: firstUpz作成
    }));
  };

  const handleEditDistrictChange作成 = (newDist: string) => {
    const newUpz = getUpazilasByDistrict(newDist);
    const firstUpz = newUpz.length > 0 ? newUpz[0].nameBn : 'সদর';
    setEditFormData(prev => ({
      ...prev,
      district: newDist,
      thana: firstUpz
    }));
  };

  // Sync edit form data when modal opens
  const openEditProfileModal = () => {
    setEditFormData({ ...formData });
    setShowEditProfileModal(true);
  };

  // Provider added products / services
  const [providerProducts, setProviderProducts] = useState<any[]>([
    {
      id: 'prod_custom_1',
      title: 'বাসাবাড়ির কমপ্লিট স্যানিটারি ও ওয়্যারিং প্যাকেজ',
      category: 'সার্ভিস ও মেইনটেন্যান্স',
      price: 1500,
      unit: 'প্যাকেজ',
      stockQuantity: 10,
      originLocation: 'খাগড়াছড়ি সদর',
      qualityGrade: '১০০% ভেরিফাইড কারিগর',
      youtubeUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      description: 'সম্পূর্ণ বাসাবাড়ির ওয়্যারিং, সুইচবোর্ড ও পানির লাইন মেরামত ও মেইনটেন্যান্স প্যাকেজ।'
    }
  ]);

  // New Product / Service Form State
  const [newProductForm, setNewProductForm] = useState({
    title: '',
    category: 'কৃষি ও খাদ্যপণ্য',
    price: '',
    originalPrice: '',
    unit: '১ কেজি',
    stockQuantity: '৫০',
    originLocation: 'খাগড়াছড়ি',
    qualityGrade: '১০০% অর্গানিক পাহাড়ি পণ্য',
    youtubeUrl: '',
    description: '',
    benefits: 'রাসায়নিকমুক্ত ও শতভাগ খাঁটি',
    imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80'
  });

  // Complete Profile Edit Handler (Updates ALL fields)
  const handleProfileEdit = (updatedData: typeof formData) => {
    setFormData(updatedData);
    setShowEditProfileModal(false);

    const generatedUID = generateMemberUID(updatedData.division, updatedData.district, updatedData.thana);
    const codes = getLocationCodes(updatedData.division, updatedData.district, updatedData.thana);

    const updatedProfessional = {
      id: `pro_${Date.now()}`,
      memberId: generatedUID,
      memberUID: generatedUID,
      uniqueId: generatedUID,
      name: updatedData.fullName,
      fatherName: updatedData.fatherName,
      motherName: updatedData.motherName,
      nidNumber: updatedData.nidNumber,
      phone: updatedData.phone,
      bloodGroup: updatedData.bloodGroup,
      division: updatedData.division,
      district: updatedData.district,
      upazila: updatedData.thana,
      area: updatedData.paraMaholla,
      divisionCode: codes.divCode,
      districtCode: codes.distCode,
      upazilaCode: codes.upazilaCode,
      job: updatedData.selectedSkills.join(', '),
      skills: updatedData.selectedSkills,
      rating: 5.0,
      reviewsCount: 1,
      ordersCount: 0,
      price: 'আলোচনা সাপেক্ষে',
      img: updatedData.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
      verified: false,
      isBloodDonor: true,
      bio: updatedData.bioText || `${updatedData.fullName} - দক্ষ ও অভিজ্ঞ পেশাজীবী।`
    };

    if (onSuccess) {
      onSuccess(updatedProfessional);
    }
  };

  // Add New Product / Service to Dashboard
  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProductForm.title.trim()) {
      alert(lang === 'bn' ? 'অনুগ্রহ করে পণ্যের নাম দিন।' : 'Please provide product name.');
      return;
    }

    const priceNum = parseInt(newProductForm.price.replace(/[^0-9]/g, '')) || 100;
    const stockNum = parseInt(newProductForm.stockQuantity.replace(/[^0-9]/g, '')) || 10;

    const newProd = {
      id: `prod_provider_${Date.now()}`,
      title: newProductForm.title.trim(),
      category: newProductForm.category,
      price: priceNum,
      originalPrice: priceNum + 50,
      unit: newProductForm.unit || 'কেজি',
      stockQuantity: stockNum,
      originLocation: newProductForm.originLocation || formData.district || 'খাগড়াছড়ি',
      qualityGrade: newProductForm.qualityGrade || '১০০% খাঁটি ও গুণগত মানসম্পন্ন',
      youtubeUrl: newProductForm.youtubeUrl || 'https://www.youtube.com/embed/dQw4w9WgXcQ',
      description: newProductForm.description.trim() || `${newProductForm.title} - ভেরিফাইড স্থানীয় উদ্যোক্তা দ্বারা সরবরাহকৃত।`,
      benefits: [newProductForm.benefits || '১০০% খাঁটি ও ফ্রেশ'],
      imageUrl: newProductForm.imageUrl
    };

    setProviderProducts(prev => [newProd, ...prev]);
    setShowAddProductModal(false);
    setNewProductForm({
      title: '',
      category: 'কৃষি ও খাদ্যপণ্য',
      price: '',
      originalPrice: '',
      unit: '১ কেজি',
      stockQuantity: '৫০',
      originLocation: formData.district || 'খাগড়াছড়ি',
      qualityGrade: '১০০% অর্গানিক পাহাড়ি পণ্য',
      youtubeUrl: '',
      description: '',
      benefits: 'রাসায়নিকমুক্ত ও শতভাগ খাঁটি',
      imageUrl: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80'
    });
  };

  // Delete product from dashboard
  const handleDeleteProduct = (prodId: string) => {
    if (confirm(lang === 'bn' ? 'আপনি কি এই পণ্যটি মুছে ফেলতে চান?' : 'Do you want to delete this product?')) {
      setProviderProducts(prev => prev.filter(p => p.id !== prodId));
    }
  };

  // Image Upload handler with instant compression to prevent Firestore 1MB document limit
  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const compressed = await compressImage(e.target.files[0], 350, 350, 0.72);
      setFormData(prev => ({ ...prev, profileImage: compressed }));
    }
  };

  // Toggle skill selection
  const toggleSkill = (skillName: string) => {
    setFormData((prev) => {
      const exists = prev.selectedSkills.includes(skillName);
      return {
        ...prev,
        selectedSkills: exists 
          ? prev.selectedSkills.filter((s) => s !== skillName) 
          : [...prev.selectedSkills, skillName]
      };
    });
  };

  // Add custom typed skill
  const handleAddCustomSkill = () => {
    const trimmed = customSkillInput.trim();
    if (trimmed && !formData.selectedSkills.includes(trimmed)) {
      setFormData((prev) => ({
        ...prev,
        selectedSkills: [...prev.selectedSkills, trimmed]
      }));
      setCustomSkillInput('');
    }
  };

  const removeSkill = (skillName: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedSkills: prev.selectedSkills.filter((s) => s !== skillName)
    }));
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.bloodGroup) {
      alert(lang === 'bn' ? 'অনুগ্রহ করে ব্লাড গ্রুপ নির্বাচন করুন।' : 'Please select your blood group.');
      return;
    }
    if (formData.selectedSkills.length === 0) {
      alert(lang === 'bn' ? 'অনুগ্রহ করে অন্তত একটি পেশা বা সেবা নির্বাচন করুন।' : 'Please select at least one skill/profession.');
      return;
    }

    setRegStatus({ type: 'loading', message: lang === 'bn' ? 'তথ্য যাচাই ও ফায়ারবেস ক্লাউড ফায়ারস্টোরে সংরক্ষণ হচ্ছে...' : 'Validating and saving profile to Cloud Firestore...' });

    // Strict Unique Constraints Validation (1 Account per Phone / Email / NID)
    const constraintCheck = await databaseService.checkUniqueConstraints({
      phone: formData.phone,
      nidNumber: formData.nidNumber,
    });

    if (constraintCheck.isDuplicate) {
      setRegStatus({
        type: 'error',
        message: 'এই এনআইডি / ফোন নম্বর / ইমেইল দিয়ে ইতিমধ্যে একটি অ্যাকাউন্ট রেজিস্টার করা হয়েছে।'
      });
      return;
    }

    const generatedUID = generateMemberUID(formData.division, formData.district, formData.thana);
    const codes = getLocationCodes(formData.division, formData.district, formData.thana);
    const docId = `pro_${Date.now()}`;

    const newProfessional = {
      id: docId,
      memberId: generatedUID,
      memberUID: generatedUID,
      uniqueId: generatedUID,
      name: formData.fullName,
      fullName: formData.fullName,
      fatherName: formData.fatherName,
      motherName: formData.motherName,
      nidNumber: formData.nidNumber,
      phone: formData.phone,
      bloodGroup: formData.bloodGroup,
      division: formData.division,
      district: formData.district,
      upazila: formData.thana,
      thana: formData.thana,
      area: formData.paraMaholla,
      mahalla: formData.paraMaholla,
      para: formData.paraMaholla,
      paraMahalla: `${formData.paraMaholla || ''}, ${formData.thana}`,
      divisionCode: codes.divCode,
      districtCode: codes.distCode,
      upazilaCode: codes.upazilaCode,
      job: formData.selectedSkills.join(', '),
      profession: formData.selectedSkills[0] || 'পেশাজীবী',
      professionBn: formData.selectedSkills.join(', '),
      serviceCategory: formData.selectedSkills.join(', '),
      categorySkill: formData.selectedSkills.join(', '),
      skills: formData.selectedSkills,
      role: 'professional',
      rating: 5.0,
      reviewsCount: 1,
      ordersCount: 0,
      price: 'আলোচনা সাপেক্ষে',
      avatar: formData.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
      img: formData.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=300&q=80',
      verified: false,
      isNidVerified: true,
      isPaidMember: true,
      isBloodDonor: true,
      isBloodDonorAvailable: true,
      bio: formData.bioText || `${formData.fullName} - দক্ষ ও অভিজ্ঞ পেশাজীবী।`,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setRegStatus({ type: 'loading', message: lang === 'bn' ? 'ফায়ারবেস ক্লাউড ফায়ারস্টোরে প্রোফাইল সংরক্ষণ হচ্ছে...' : 'Saving profile directly to Cloud Firestore...' });

    try {
      const result = await databaseService.registerProvider(newProfessional as any);
      if (result.success) {
        setRegStatus({ type: 'success', message: lang === 'bn' ? 'সফলভাবে ক্লাউড ফায়ারস্টোরে প্রফেশনাল প্রোফাইল তৈরি হয়েছে!' : 'Professional profile registered in Cloud Firestore!' });
        if (onSuccess) {
          onSuccess(newProfessional);
        }
        setTimeout(() => {
          setRegStatus(null);
          setViewState('provider_dashboard');
        }, 700);
      } else {
        setRegStatus({ type: 'error', message: result.error || 'ফায়ারস্টোর ডাটাবেজ রেজিস্ট্রেশন ব্যর্থ হয়েছে' });
      }
    } catch (err: any) {
      console.error('[Firestore] Provider profile Firestore save error:', err);
      setRegStatus({ type: 'error', message: err?.message || 'ফায়ারস্টোরে রেজিস্ট্রেশন ব্যর্থ হয়েছে' });
    }
  };

  return (
    <div className="w-full bg-gray-50 p-2 sm:p-5 font-sans text-gray-800 min-h-screen pb-24">
      <div className="max-w-3xl mx-auto space-y-4">

        {/* Global Language Switch Bar */}
        <div className="flex justify-between items-center bg-white p-2.5 rounded-xl border border-gray-200 shadow-2xs">
          <div className="flex items-center gap-1.5 text-xs font-bold text-gray-700">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                className="flex items-center gap-1 text-gray-600 hover:text-emerald-700 p-1 rounded-lg hover:bg-gray-100 transition mr-1"
                title="Back"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <Sparkles className="text-emerald-600 w-4 h-4" />
            <span className="hidden sm:inline">ঝাডিমাটি ডট কম প্রফেশনাল পোর্টাল</span>
          </div>

          <div className="flex items-center gap-1.5">
            <Globe className="text-emerald-700 w-3.5 h-3.5" />
            <span className="text-[11px] font-bold text-gray-600">ভাষা / Lang:</span>
            <button
              type="button"
              onClick={() => setLang('bn')}
              className={`px-2.5 py-1 text-xs rounded-lg font-bold transition cursor-pointer ${
                lang === 'bn' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              বাংলা
            </button>
            <button
              type="button"
              onClick={() => setLang('en')}
              className={`px-2.5 py-1 text-xs rounded-lg font-bold transition cursor-pointer ${
                lang === 'en' ? 'bg-emerald-600 text-white shadow-2xs' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              English
            </button>
          </div>
        </div>

        {/* STEP 1: Inline Role Selection */}
        {viewState === 'role_select' && (
          <div className="w-full max-w-md mx-auto bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl border border-gray-100 shadow-xl space-y-6 text-left">
            <h1 className="text-sm sm:text-base font-black text-gray-900 leading-snug tracking-tight">
              {currentT.selectTitle}
            </h1>

            <form 
              onSubmit={(e) => {
                e.preventDefault();
                if (selectedRole === 'service') {
                  setViewState('service_form');
                } else {
                  if (onSelectMerchant) {
                    onSelectMerchant();
                  } else {
                    setViewState('product_store');
                  }
                }
              }} 
              className="space-y-5"
            >
              <div>
                <label className="block text-xs font-semibold text-gray-600 mb-2">{currentT.selectLabel}</label>
                <div className="relative">
                  <select 
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full appearance-none bg-white border border-gray-300 rounded-xl px-4 py-3 text-xs sm:text-sm text-gray-900 font-bold focus:outline-none focus:ring-2 focus:ring-[#0A6A32] focus:border-[#0A6A32] transition cursor-pointer pr-10 shadow-2xs"
                  >
                    <option value="product">{currentT.productOpt}</option>
                    <option value="service">{currentT.serviceOpt}</option>
                  </select>
                  <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                    <ChevronDown className="w-4 h-4 stroke-[2.5]" />
                  </div>
                </div>
              </div>

              <button 
                type="submit"
                className="w-full bg-[#0A6A32] hover:bg-[#085427] active:bg-[#06421e] text-white font-bold py-3.5 px-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm transition shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
              >
                <span>{currentT.submitBtn}</span>
                <span className="text-base font-bold leading-none">➔</span>
              </button>
            </form>
          </div>
        )}

        {/* STEP 1B: Clean Minimal White-Theme Merchant Page */}
        {viewState === 'product_store' && (
          <div className="space-y-4">
            <CleanMerchantPage
              lang={lang}
              isOwner={true}
              currentUserRole="merchant"
              onBack={() => setViewState('role_select')}
            />
          </div>
        )}

        {/* STEP 2: Service Provider Registration Form */}
        {viewState === 'service_form' && (
          <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-sm space-y-6">
            
            <div className="border-b pb-3 flex justify-between items-center">
              <div>
                <h2 className="text-base font-bold text-gray-900">{currentT.formTitle}</h2>
                <p className="text-xs text-gray-500">{currentT.formSubtitle}</p>
              </div>
              <button 
                type="button"
                onClick={() => setViewState('role_select')} 
                className="text-xs text-emerald-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <ArrowLeft size={12} />
                <span>{currentT.changeRole}</span>
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-6 text-xs">
              
              {/* Profile Photo Uploader with Live Circular Preview */}
              <div className="flex flex-col items-center justify-center space-y-2 bg-slate-50 p-4 rounded-2xl border border-dashed border-gray-300">
                <div className="relative w-24 h-24 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center border-2 border-emerald-600 shadow-sm">
                  {formData.profileImage ? (
                    <img src={formData.profileImage} alt="Profile Preview" className="w-full h-full object-cover" />
                  ) : (
                    <User className="text-gray-400" size={40} />
                  )}
                  <label className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 hover:opacity-100 cursor-pointer transition text-white text-[10px]">
                    <Camera size={20} />
                    <span className="font-bold mt-1">Change</span>
                    <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                  </label>
                </div>
                <label className="font-bold text-gray-700 cursor-pointer flex items-center gap-1 hover:text-emerald-700">
                  <Camera size={14} className="text-emerald-600" />
                  <span>{currentT.profilePicLabel}</span>
                  <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                </label>
                <p className="text-[10px] text-gray-500">JPG, PNG (Max 5MB)</p>
              </div>

              {/* Personal & NID Details */}
              <div className="space-y-3">
                <h3 className="font-bold text-emerald-800 text-sm flex items-center gap-1.5 border-b pb-1">
                  <User size={16} /> {currentT.personalSec}
                </h3>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">{currentT.fullName}</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    placeholder={lang === 'bn' ? 'ভোটার আইডি কার্ড অনুযায়ী পুরো নাম' : 'Full name matching NID card'}
                    className="w-full p-2.5 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:border-emerald-600 outline-none" 
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">{currentT.fatherName}</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.fatherName}
                      onChange={(e) => setFormData({ ...formData, fatherName: e.target.value })}
                      placeholder={lang === 'bn' ? 'পিতার নাম লিখুন' : "Father's name"}
                      className="w-full p-2.5 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:border-emerald-600 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">{currentT.motherName}</label>
                    <input 
                      type="text" 
                      required 
                      value={formData.motherName}
                      onChange={(e) => setFormData({ ...formData, motherName: e.target.value })}
                      placeholder={lang === 'bn' ? 'মাতার নাম লিখুন' : "Mother's name"}
                      className="w-full p-2.5 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:border-emerald-600 outline-none" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">{currentT.nidNum}</label>
                  <input 
                    type="text" 
                    required 
                    value={formData.nidNumber}
                    onChange={(e) => setFormData({ ...formData, nidNumber: e.target.value })}
                    placeholder={lang === 'bn' ? '১০, ১৩ অথবা ১৭ ডিজিটের এনআইডি নম্বর' : '10, 13, or 17 digits NID number'}
                    className="w-full p-2.5 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:border-emerald-600 outline-none" 
                  />
                </div>

                {/* Mobile Phone Number */}
                <div>
                  <label className="block font-medium text-gray-700 mb-1 flex items-center justify-between">
                    <span>{currentT.phone}</span>
                    <span className="text-[10px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 flex items-center gap-1 font-medium">
                      <Lock size={10} /> {currentT.phoneNote}
                    </span>
                  </label>
                  <input 
                    type="tel" 
                    required 
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+8801XXXXXXXXX"
                    className="w-full p-2.5 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:border-emerald-600 outline-none" 
                  />
                </div>
              </div>

              {/* Section 2: Blood Donation Group (Mandatory) */}
              <div className="space-y-2 pt-2 border-t">
                <h3 className="font-bold text-red-700 text-sm flex items-center gap-1.5">
                  <Heart size={16} className="fill-red-100" /> {currentT.bloodSec}
                </h3>
                <select 
                  required
                  value={formData.bloodGroup}
                  onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                  className="w-full p-2.5 border border-gray-300 rounded-xl bg-gray-50 font-semibold text-gray-800 focus:bg-white focus:border-emerald-600 outline-none cursor-pointer"
                >
                  <option value="">-- {lang === 'bn' ? 'রক্তের গ্রুপ নির্বাচন করুন' : 'Select Blood Group'} --</option>
                  <option value="A+">A+ (A Positive)</option>
                  <option value="A-">A- (A Negative)</option>
                  <option value="B+">B+ (B Positive)</option>
                  <option value="B-">B- (B Negative)</option>
                  <option value="O+">O+ (O Positive)</option>
                  <option value="O-">O- (O Negative)</option>
                  <option value="AB+">AB+ (AB Positive)</option>
                  <option value="AB-">AB- (AB Negative)</option>
                </select>
              </div>

              {/* Section 3: Work Location (Bound to LOCATION_MASTER) */}
              <div className="space-y-3 pt-2 border-t">
                <div className="flex items-center justify-between border-b pb-1">
                  <h3 className="font-bold text-emerald-800 text-sm flex items-center gap-1.5">
                    <MapPin size={16} /> {currentT.locationSec}
                  </h3>
                  <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 text-[10px] font-mono font-bold text-emerald-800">
                    <Hash size={12} className="text-[#2EAA26]" />
                    <span>আইডি প্রিভিউ: {formPreviewUID}</span>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Division */}
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">
                      {lang === 'bn' ? 'বিভাগ *' : 'Division *'}
                    </label>
                    <select
                      required
                      value={formData.division}
                      onChange={(e) => handleMainDivisionChange(e.target.value)}
                      className="w-full p-2.5 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:border-emerald-600 outline-none cursor-pointer"
                    >
                      {divisions.map((d) => (
                        <option key={d.code} value={d.nameBn}>
                          {d.nameBn} ({d.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* District */}
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">{currentT.district}</label>
                    <select 
                      required
                      value={formData.district}
                      onChange={(e) => handleMainDistrictChange(e.target.value)}
                      className="w-full p-2.5 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:border-emerald-600 outline-none cursor-pointer"
                    >
                      {formDistricts.map((dist) => (
                        <option key={dist.code} value={dist.nameBn}>
                          {dist.nameBn} ({dist.code})
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Upazila */}
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">{currentT.thana}</label>
                    <select
                      required
                      value={formData.thana}
                      onChange={(e) => setFormData({ ...formData, thana: e.target.value })}
                      className="w-full p-2.5 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:border-emerald-600 outline-none cursor-pointer"
                    >
                      {formUpazilas.map((upz) => (
                        <option key={upz.code} value={upz.nameBn}>
                          {upz.nameBn} ({upz.code})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block font-medium text-gray-700 mb-1">{currentT.para}</label>
                  <input 
                    type="text" 
                    required
                    placeholder={lang === 'bn' ? 'বিস্তারিত এলাকা / পাড়া / মহল্লা / গ্রাম (যেমন: বোয়ালখালী বাজার রোড)' : 'Specific neighborhood / village / road'}
                    value={formData.paraMaholla}
                    onChange={(e) => setFormData({ ...formData, paraMaholla: e.target.value })}
                    className="w-full p-2.5 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:border-emerald-600 outline-none" 
                  />
                </div>
              </div>

              {/* Section 4: Cascading 2-Step Categorized Profession Selector */}
              <div className="space-y-3 pt-2 border-t">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b pb-1">
                  <h3 className="font-bold text-emerald-800 text-sm flex items-center gap-1.5">
                    <Briefcase size={16} /> {currentT.skillsSec}
                  </h3>
                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                    {currentT.selectedSkillsCount}: {formData.selectedSkills.length}
                  </span>
                </div>
                
                {/* Step 1: Category Selector & Unified Search Bar */}
                <div className="space-y-2">
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1 flex items-center gap-1">
                      <Layers size={13} className="text-emerald-600" />
                      <span>{currentT.step1Label}</span>
                    </label>
                    <select
                      value={selectedCategoryId}
                      onChange={(e) => {
                        setSelectedCategoryId(Number(e.target.value));
                        setSearchSkillQuery('');
                      }}
                      className="w-full p-2.5 border border-gray-300 rounded-xl bg-white text-xs font-semibold text-gray-800 focus:border-emerald-600 outline-none cursor-pointer"
                    >
                      <option value={0}>{currentT.allCategoryOpt}</option>
                      {PROFESSIONS_DATA.map((cat) => (
                        <option key={cat.id} value={cat.id}>
                          {lang === 'bn' ? cat.category_bn : cat.category_en}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Unified Search Input */}
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-gray-400">
                      <Search size={14} />
                    </div>
                    <input
                      type="text"
                      value={searchSkillQuery}
                      onChange={(e) => setSearchSkillQuery(e.target.value)}
                      placeholder={currentT.searchSkillPlaceholder}
                      className="w-full pl-8 pr-7 py-2 border border-gray-300 rounded-xl bg-white text-xs text-gray-800 focus:border-emerald-600 outline-none"
                    />
                    {searchSkillQuery && (
                      <button
                        type="button"
                        onClick={() => setSearchSkillQuery('')}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-xs text-gray-400 hover:text-gray-600"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>

                {/* Step 2: Specific Profession(s) Checklist */}
                <div className="space-y-1.5">
                  <label className="block text-[11px] font-bold text-gray-700 flex items-center justify-between">
                    <span>{currentT.step2Label}</span>
                    <span className="text-[10px] text-gray-500 font-normal">
                      ({filteredProfessionsList.length} {lang === 'bn' ? 'টি পেশা উপলভ্য' : 'available'})
                    </span>
                  </label>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-60 overflow-y-auto p-2 bg-slate-50 rounded-xl border border-gray-200">
                    {filteredProfessionsList.length > 0 ? (
                      filteredProfessionsList.map((item) => {
                        const isSelected = formData.selectedSkills.includes(item.name);
                        return (
                          <button
                            type="button"
                            key={item.id + '_' + item.name}
                            onClick={() => toggleSkill(item.name)}
                            className={`p-2 rounded-xl text-left font-medium border transition flex items-center justify-between cursor-pointer text-[11px] leading-tight ${
                              isSelected 
                                ? 'bg-emerald-600 text-white border-emerald-700 font-bold shadow-2xs' 
                                : 'bg-white border-gray-200 text-gray-700 hover:border-emerald-300 hover:bg-emerald-50/40'
                            }`}
                          >
                            <span className="truncate pr-1">{item.name}</span>
                            {isSelected ? (
                              <Check size={14} className="shrink-0 text-white stroke-[2.5]" />
                            ) : (
                              <div className="w-3.5 h-3.5 rounded border border-gray-300 shrink-0 bg-white" />
                            )}
                          </button>
                        );
                      })
                    ) : (
                      <div className="col-span-full py-4 text-center text-xs text-gray-500 font-medium">
                        {currentT.noSkillFound}
                      </div>
                    )}
                  </div>
                </div>

                {/* Selected Skills Chips List */}
                {formData.selectedSkills.length > 0 && (
                  <div className="bg-emerald-50/60 p-2 rounded-xl border border-emerald-200/70 space-y-1">
                    <div className="text-[10px] font-bold text-emerald-800">
                      {lang === 'bn' ? 'আপনার নির্বাচিত পেশাসমূহ:' : 'Your Selected Professions:'}
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {formData.selectedSkills.map((skill) => (
                        <span 
                          key={skill}
                          className="inline-flex items-center gap-1 bg-white text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-lg text-[10px] font-bold shadow-2xs"
                        >
                          {skill}
                          <button
                            type="button"
                            onClick={() => removeSkill(skill)}
                            className="text-emerald-600 hover:text-red-600 ml-0.5"
                          >
                            <Trash2 size={11} />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Step 3: Custom Skill Addition */}
                <div className="space-y-1.5 pt-1">
                  <label className="block text-[11px] font-bold text-gray-700">{currentT.addCustomSkillLabel}</label>
                  <div className="flex gap-2">
                    <input 
                      type="text"
                      value={customSkillInput}
                      onChange={(e) => setCustomSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleAddCustomSkill();
                        }
                      }}
                      placeholder={currentT.customSkillPlaceholder}
                      className="flex-1 p-2 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:border-emerald-600 outline-none text-xs"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomSkill}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl font-bold flex items-center gap-1 cursor-pointer shrink-0"
                    >
                      <Plus size={14} />
                      <span>{currentT.addBtn}</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Section 5: Personal Bio & Work Experience */}
              <div className="space-y-2 pt-2 border-t">
                <h3 className="font-bold text-emerald-800 text-sm flex items-center gap-1.5 border-b pb-1">
                  <FileText size={16} /> {currentT.bioSec}
                </h3>
                <textarea 
                  rows={3}
                  value={formData.bioText}
                  onChange={(e) => setFormData({ ...formData, bioText: e.target.value })}
                  placeholder={currentT.bioPlaceholder}
                  className="w-full p-2.5 border border-gray-300 rounded-xl bg-gray-50 focus:bg-white focus:border-emerald-600 outline-none leading-relaxed"
                />
              </div>

              {/* Section 6: Document Uploads (NID Front/Back, CV, Certificates) */}
              <div className="space-y-3 pt-2 border-t">
                <h3 className="font-bold text-emerald-800 text-sm flex items-center gap-1.5 border-b pb-1">
                  <Upload size={16} /> {currentT.uploadSec}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* NID Front */}
                  <div className="border border-dashed border-gray-300 rounded-xl p-3 bg-gray-50 text-center hover:bg-gray-100 transition">
                    <ShieldCheck className="mx-auto text-emerald-600 mb-1" size={20} />
                    <label className="block font-bold text-gray-700 cursor-pointer">
                      {currentT.nidFront}
                      <input 
                        type="file" 
                        accept="image/*,.pdf" 
                        className="hidden" 
                        onChange={(e) => setFormData({ ...formData, nidFrontFile: e.target.files ? e.target.files[0] : null })}
                      />
                    </label>
                    <span className="text-[10px] text-gray-500 block mt-0.5 truncate">
                      {formData.nidFrontFile ? formData.nidFrontFile.name : 'Image / PDF (Front)'}
                    </span>
                  </div>

                  {/* NID Back */}
                  <div className="border border-dashed border-gray-300 rounded-xl p-3 bg-gray-50 text-center hover:bg-gray-100 transition">
                    <ShieldCheck className="mx-auto text-emerald-600 mb-1" size={20} />
                    <label className="block font-bold text-gray-700 cursor-pointer">
                      {currentT.nidBack}
                      <input 
                        type="file" 
                        accept="image/*,.pdf" 
                        className="hidden" 
                        onChange={(e) => setFormData({ ...formData, nidBackFile: e.target.files ? e.target.files[0] : null })}
                      />
                    </label>
                    <span className="text-[10px] text-gray-500 block mt-0.5 truncate">
                      {formData.nidBackFile ? formData.nidBackFile.name : 'Image / PDF (Back)'}
                    </span>
                  </div>

                  {/* CV Upload */}
                  <div className="border border-dashed border-gray-300 rounded-xl p-3 bg-gray-50 text-center hover:bg-gray-100 transition">
                    <FileText className="mx-auto text-gray-400 mb-1" size={20} />
                    <label className="block font-bold text-gray-700 cursor-pointer">
                      {currentT.cvUpload}
                      <input 
                        type="file" 
                        accept=".pdf,.doc,.docx" 
                        className="hidden" 
                        onChange={(e) => setFormData({ ...formData, cvFile: e.target.files ? e.target.files[0] : null })}
                      />
                    </label>
                    <span className="text-[10px] text-gray-500 block mt-0.5 truncate">
                      {formData.cvFile ? formData.cvFile.name : 'PDF, DOC, DOCX'}
                    </span>
                  </div>

                  {/* Certificates */}
                  <div className="border border-dashed border-gray-300 rounded-xl p-3 bg-gray-50 text-center hover:bg-gray-100 transition">
                    <Award className="mx-auto text-amber-500 mb-1" size={20} />
                    <label className="block font-bold text-gray-700 cursor-pointer">
                      {currentT.certUpload}
                      <input 
                        type="file" 
                        multiple 
                        accept="image/*,.pdf" 
                        className="hidden" 
                        onChange={(e) => setFormData({ ...formData, certificateFiles: e.target.files })}
                      />
                    </label>
                    <span className="text-[10px] text-gray-500 block mt-0.5 truncate">
                      {formData.certificateFiles && formData.certificateFiles.length > 0 
                        ? `${formData.certificateFiles.length} file(s) selected` 
                        : 'Image / PDF Certificates'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Registration Status Feedback Banner */}
              {regStatus && (
                <div className={`p-3 rounded-xl text-xs font-bold flex items-center gap-2 ${
                  regStatus.type === 'loading' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                  regStatus.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                  'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {regStatus.type === 'loading' ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-600" />
                  ) : regStatus.type === 'success' ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600" />
                  )}
                  <span>{regStatus.message}</span>
                </div>
              )}

              {/* Submit Button */}
              <button 
                type="submit" 
                disabled={regStatus?.type === 'loading'}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-sm transition text-sm flex items-center justify-center gap-2 mt-4 cursor-pointer active:scale-98 disabled:opacity-50"
              >
                <span>{currentT.completeRegBtn}</span>
                <ArrowRight size={16} />
              </button>

            </form>
          </div>
        )}

        {/* STEP 3: Provider Dashboard & Profile Preview */}
        {viewState === 'provider_dashboard' && (
          <div className="space-y-4">
            
            {/* Top Dashboard Overview Bar */}
            <div className="bg-white p-5 sm:p-6 rounded-2xl border border-gray-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-4">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <img 
                      src={formData.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'} 
                      alt="Provider Avatar" 
                      className="w-14 h-14 rounded-full object-cover border-2 border-emerald-600 shadow-sm"
                    />
                    <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white p-1 rounded-full shadow-xs" title={currentT.pendingBadge}>
                      <Clock size={12} />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-base font-black text-gray-900 flex items-center gap-1.5">
                      {formData.fullName || 'মো: আব্দুল্লাহ'}
                      <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                        {currentT.pendingBadge}
                      </span>
                    </h2>
                    <p className="text-xs text-gray-500 font-medium">
                      {formData.selectedSkills.slice(0, 2).join(', ')} • {formData.district} ({formData.thana || 'সদর'})
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={openEditProfileModal}
                    className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1 shadow-2xs"
                  >
                    <Settings size={14} />
                    <span>{currentT.editProfile}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddProductModal(true)}
                    className="text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 rounded-xl shadow-xs transition cursor-pointer flex items-center gap-1"
                  >
                    <Plus size={14} />
                    <span>{lang === 'bn' ? 'পণ্য / সেবা যোগ করুন' : 'Add Product / Service'}</span>
                  </button>
                  {onBack && (
                    <button
                      type="button"
                      onClick={onBack}
                      className="text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl transition cursor-pointer"
                    >
                      {currentT.backToHome}
                    </button>
                  )}
                </div>
              </div>

              {/* Status Alert */}
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex items-start gap-2 text-xs text-amber-900">
                <AlertCircle className="text-amber-600 shrink-0 mt-0.5" size={16} />
                <div>
                  <p className="font-bold">{currentT.verifiedStatus}</p>
                  <p className="text-[11px] text-amber-800 mt-0.5 leading-relaxed">
                    {lang === 'bn' 
                      ? 'আপনার ভোটার আইডি কার্ড ও তথ্য সফলভাবে জমা নেওয়া হয়েছে। অ্যাডমিন প্যানেল কর্তৃক পর্যালোচনার পর ভেরিফাইড টিক চিহ্ন প্রদান করা হবে।'
                      : 'Your NID documents have been submitted. An admin will review and grant the verified badge shortly.'}
                  </p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 text-center">
                <div className="bg-slate-50 p-3 rounded-xl border border-gray-200">
                  <Wallet className="w-5 h-5 text-emerald-600 mx-auto mb-1" />
                  <span className="text-[10px] text-gray-500 font-bold block">{currentT.totalEarning}</span>
                  <span className="text-sm font-black text-emerald-700">৳ ০.০০</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-gray-200">
                  <Clock className="w-5 h-5 text-blue-600 mx-auto mb-1" />
                  <span className="text-[10px] text-gray-500 font-bold block">{currentT.activeJobs}</span>
                  <span className="text-sm font-black text-gray-800">০ টি</span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-gray-200">
                  <CheckCircle2 className="w-5 h-5 text-purple-600 mx-auto mb-1" />
                  <span className="text-[10px] text-gray-500 font-bold block">{currentT.completedJobs}</span>
                  <span className="text-sm font-black text-gray-800">{providerProducts.length} টি আইটেম</span>
                </div>
              </div>
            </div>

            {/* Provider's Active Products & Services Section */}
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between border-b pb-2">
                <h3 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Package size={15} className="text-emerald-600" />
                  <span>{lang === 'bn' ? 'আমার সক্রিয় পণ্য ও সেবা তালিকা' : 'My Active Products & Services'} ({providerProducts.length})</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(true)}
                  className="text-[11px] font-black text-emerald-700 hover:text-emerald-800 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200 flex items-center gap-1 cursor-pointer"
                >
                  <Plus size={12} />
                  <span>{lang === 'bn' ? 'নতুন যোগ করুন' : 'Add New'}</span>
                </button>
              </div>

              {providerProducts.length === 0 ? (
                <div className="text-center py-6 text-slate-500 space-y-2">
                  <Package className="w-8 h-8 text-slate-400 mx-auto" />
                  <p className="text-xs">{lang === 'bn' ? 'এখনো কোনো পণ্য বা সেবা যোগ করেননি।' : 'No products or services added yet.'}</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {providerProducts.map((prod) => (
                    <div key={prod.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col justify-between gap-2 shadow-2xs">
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <span className="text-[9px] font-bold px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                            {prod.category}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(prod.id)}
                            className="text-red-500 hover:text-red-700 text-[10px] font-bold p-1"
                            title="মুছে ফেলুন"
                          >
                            ✕
                          </button>
                        </div>
                        <h4 className="font-black text-xs text-slate-900 mt-1.5">{prod.title}</h4>
                        <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2">{prod.description}</p>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-200 pt-2 text-xs">
                        <span className="font-black text-emerald-700">৳ {prod.price} / {prod.unit}</span>
                        <span className="text-[9px] font-bold text-slate-500">স্টক: {prod.stockQuantity}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Modern Upwork & Fiverr Style Public Profile View */}
            <div className="space-y-3">
              <div className="flex items-center justify-between px-1">
                <h3 className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-emerald-600" />
                  <span>{lang === 'bn' ? 'লাইভ পাবলিক প্রোফাইল ভিউ (Upwork / Fiverr স্টাইল)' : 'Live Public Profile View'}</span>
                </h3>
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full font-bold">
                  {currentT.viewInSearch}
                </span>
              </div>

              <ServiceProviderPublicProfile
                provider={{
                  id: `pro_${formData.phone?.replace(/[^0-9]/g, '') || Date.now()}`,
                  name: formData.fullName || 'পেশাজীবী সেবাদাতা',
                  fullName: formData.fullName || 'পেশাজীবী সেবাদাতা',
                  profession: formData.selectedSkills.join(', ') || 'ইলেকট্রিশিয়ান ও টেকনিশিয়ান',
                  professionBn: formData.selectedSkills.join(', '),
                  skills: formData.selectedSkills,
                  selectedSkillsList: formData.selectedSkills,
                  phone: formData.phone,
                  email: `${formData.phone?.replace(/[^0-9]/g, '') || Date.now()}@jhadimadi.com`,
                  nidNumber: formData.nidNumber,
                  bloodGroup: formData.bloodGroup,
                  division: formData.division,
                  district: (formData.district as any) || 'Khagrachhari',
                  upazila: formData.thana,
                  thana: formData.thana,
                  mahalla: formData.paraMaholla,
                  para: formData.paraMaholla,
                  avatar: formData.profileImage || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
                  bio: formData.bioText || 'অভিজ্ঞ ও সার্টিফাইড টেকনিশিয়ান হিসেবে আবাসিক ও বাণিজ্যিক ভবনের সব ধরনের অন-ডিমান্ড ও জরুরি সেবা প্রদান করি।',
                  dailyRate: 800,
                  experienceYears: 4,
                  rating: 5.0,
                  completedJobs: 14,
                  isNidVerified: true,
                }}
                isOwner={true}
                lang={lang}
                onEditProfile={openEditProfileModal}
              />
            </div>

            {/* COMPLETE PROFILE EDIT MODAL */}
            {showEditProfileModal && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                      <Settings className="w-4 h-4 text-emerald-600" />
                      <span>{lang === 'bn' ? 'সম্পূর্ণ প্রোফাইল সম্পাদনা করুন (Edit All Fields)' : 'Edit Complete Profile'}</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowEditProfileModal(false)}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <form 
                    onSubmit={(e) => {
                      e.preventDefault();
                      handleProfileEdit(editFormData);
                    }}
                    className="space-y-3.5 text-xs"
                  >
                    {/* Full Name */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">{currentT.fullName}</label>
                      <input
                        type="text"
                        required
                        value={editFormData.fullName}
                        onChange={(e) => setEditFormData({ ...editFormData, fullName: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                      />
                    </div>

                    {/* Parents Name */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">{currentT.fatherName}</label>
                        <input
                          type="text"
                          value={editFormData.fatherName}
                          onChange={(e) => setEditFormData({ ...editFormData, fatherName: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">{currentT.motherName}</label>
                        <input
                          type="text"
                          value={editFormData.motherName}
                          onChange={(e) => setEditFormData({ ...editFormData, motherName: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                        />
                      </div>
                    </div>

                    {/* NID & Phone */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">{currentT.nidNum}</label>
                        <input
                          type="text"
                          required
                          value={editFormData.nidNumber}
                          onChange={(e) => setEditFormData({ ...editFormData, nidNumber: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">{currentT.phone}</label>
                        <input
                          type="tel"
                          required
                          value={editFormData.phone}
                          onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 font-medium"
                        />
                      </div>
                    </div>

                    {/* Blood Group */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">{currentT.bloodSec}</label>
                      <select
                        value={editFormData.bloodGroup}
                        onChange={(e) => setEditFormData({ ...editFormData, bloodGroup: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white focus:ring-2 focus:ring-emerald-500 font-medium"
                      >
                        <option value="">-- ব্লাড গ্রুপ বাছুন --</option>
                        {['A+', 'A-', 'B+', 'B-', 'O+', 'O-', 'AB+', 'AB-'].map(bg => (
                          <option key={bg} value={bg}>{bg}</option>
                        ))}
                      </select>
                    </div>

                    {/* Location */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">বিভাগ</label>
                        <select
                          value={editFormData.division || 'চট্টগ্রাম'}
                          onChange={(e) => handleEditDivisionChange(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium"
                        >
                          {divisions.map(d => (
                            <option key={d.code} value={d.nameBn}>{d.nameBn} ({d.code})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">{currentT.district}</label>
                        <select
                          value={editFormData.district}
                          onChange={(e) => handleEditDistrictChange作成(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium"
                        >
                          {editDistricts.map(d => (
                            <option key={d.code} value={d.nameBn}>{d.nameBn} ({d.code})</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">{currentT.thana}</label>
                        <select
                          value={editFormData.thana}
                          onChange={(e) => setEditFormData({ ...editFormData, thana: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white font-medium"
                        >
                          {editUpazilas.map(upz => (
                            <option key={upz.code} value={upz.nameBn}>{upz.nameBn} ({upz.code})</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">{currentT.para}</label>
                      <input
                        type="text"
                        value={editFormData.paraMaholla}
                        placeholder="পাড়া / মহল্লা"
                        onChange={(e) => setEditFormData({ ...editFormData, paraMaholla: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                      />
                    </div>

                    {/* Bio */}
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">{currentT.bioSec}</label>
                      <textarea
                        rows={3}
                        value={editFormData.bioText}
                        onChange={(e) => setEditFormData({ ...editFormData, bioText: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl font-medium"
                      />
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center justify-end gap-2 pt-2 border-t">
                      <button
                        type="button"
                        onClick={() => setShowEditProfileModal(false)}
                        className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                      >
                        {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-sm"
                      >
                        {lang === 'bn' ? '✓ পরিবর্তন সেভ করুন' : 'Save Changes'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

            {/* ADD PRODUCT / SERVICE MODAL */}
            {showAddProductModal && (
              <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
                <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto">
                  <div className="flex items-center justify-between border-b pb-3">
                    <h3 className="font-black text-sm text-slate-900 flex items-center gap-2">
                      <Plus className="w-4 h-4 text-emerald-600" />
                      <span>{lang === 'bn' ? 'নতুন পণ্য বা সেবা যোগ করুন' : 'Add New Product / Service'}</span>
                    </h3>
                    <button
                      type="button"
                      onClick={() => setShowAddProductModal(false)}
                      className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 font-bold"
                    >
                      ✕
                    </button>
                  </div>

                  <form onSubmit={handleAddProductSubmit} className="space-y-3 text-xs">
                    <div>
                      <label className="block font-bold text-slate-700 mb-1">পণ্য বা সেবার নাম *</label>
                      <input
                        type="text"
                        required
                        placeholder="যেমন: খাঁটি পাহাড়ি হলুদ গুঁড়া / হোম স্যানিটারি মেরামত"
                        value={newProductForm.title}
                        onChange={(e) => setNewProductForm({ ...newProductForm, title: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">ক্যাটাগরি</label>
                        <select
                          value={newProductForm.category}
                          onChange={(e) => setNewProductForm({ ...newProductForm, category: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl bg-white"
                        >
                          <option value="কৃষি ও খাদ্যপণ্য">কৃষি ও খাদ্যপণ্য</option>
                          <option value="মসলা ও চাল">মসলা ও চাল</option>
                          <option value="সার্ভিস ও মেইনটেন্যান্স">সার্ভিস ও মেইনটেন্যান্স</option>
                          <option value="হস্তশিল্প ও ঐতিহ্যবাহী">হস্তশিল্প ও ঐতিহ্যবাহী</option>
                          <option value="ইলেকট্রনিক্স ও গ্যাজেট">ইলেকট্রনিক্স ও গ্যাজেট</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">একক (Unit)</label>
                        <input
                          type="text"
                          placeholder="যেমন: ১ কেজি / ১ পিস / ঘন্টা"
                          value={newProductForm.unit}
                          onChange={(e) => setNewProductForm({ ...newProductForm, unit: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">মূল্য (টাকা) *</label>
                        <input
                          type="text"
                          required
                          placeholder="যেমন: ৩৫০"
                          value={newProductForm.price}
                          onChange={(e) => setNewProductForm({ ...newProductForm, price: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">স্টক পরিমাণ</label>
                        <input
                          type="text"
                          placeholder="যেমন: ৫০"
                          value={newProductForm.stockQuantity}
                          onChange={(e) => setNewProductForm({ ...newProductForm, stockQuantity: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block font-bold text-slate-700 mb-1">উৎপাদনস্থল (Origin)</label>
                        <input
                          type="text"
                          placeholder="যেমন: খাগড়াছড়ি / দিনাজপুর"
                          value={newProductForm.originLocation}
                          onChange={(e) => setNewProductForm({ ...newProductForm, originLocation: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                        />
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 mb-1">গুণাগুণ ও গ্রেড</label>
                        <input
                          type="text"
                          placeholder="যেমন: ১০০% খাঁটি ও অর্গানিক"
                          value={newProductForm.qualityGrade}
                          onChange={(e) => setNewProductForm({ ...newProductForm, qualityGrade: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">ইউটিউব ভিডিও লিঙ্ক (ঐচ্ছিক)</label>
                      <input
                        type="url"
                        placeholder="https://www.youtube.com/watch?v=..."
                        value={newProductForm.youtubeUrl}
                        onChange={(e) => setNewProductForm({ ...newProductForm, youtubeUrl: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 mb-1">বিস্তারিত বিবরণ</label>
                      <textarea
                        rows={2}
                        placeholder="পণ্য বা সেবার বিস্তারিত তথ্য..."
                        value={newProductForm.description}
                        onChange={(e) => setNewProductForm({ ...newProductForm, description: e.target.value })}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl"
                      />
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t">
                      <button
                        type="button"
                        onClick={() => setShowAddProductModal(false)}
                        className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold hover:bg-slate-200"
                      >
                        {lang === 'bn' ? 'বাতিল' : 'Cancel'}
                      </button>
                      <button
                        type="submit"
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black shadow-sm"
                      >
                        {lang === 'bn' ? '✓ যুক্ত করুন' : 'Add Item'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}

      </div>
    </div>
  );
};

export default ServiceProviderFullSystem;
