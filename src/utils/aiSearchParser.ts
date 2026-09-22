import { sanitizeSearchQuery } from './securitySanitizer';
import { requestMicrophoneOnDemand } from './permissionManager';

// Smart AI Search Query Parser for Bangla Natural Language & Voice Search
// Analyzes conversational spoken text and extracts:
// 1. Search Type (Service / Product / Blood / Rent)
// 2. District & Upazila / Thana
// 3. Category & Blood Group
// 4. Cleaned Search Keyword

export interface ParsedSearchResult {
  rawQuery: string;
  cleanedKeyword: string;
  searchType: 'service' | 'product' | 'blood' | 'rent' | 'source' | 'emergency' | 'ambulance';
  district: string | null;
  upazila: string | null;
  area: string | null;
  bloodGroup: string | null;
  category: string | null;
  summaryBn: string;
}

// 1. District Names Dictionary & Variations (including inflections)
const DISTRICT_MAP: { standard: string; patterns: RegExp[] }[] = [
  { standard: 'খাগড়াছড়ি', patterns: [/খাগ[ড়়]াছ[ড়়]ি/i, /khagrach[ha]ri/i] },
  { standard: 'রাঙ্গামাটি', patterns: [/রাঙ্গা?মাটি/i, /রাঙামাটি/i, /rangamati/i] },
  { standard: 'বান্দরবান', patterns: [/বান্দরবান/i, /bandarban/i] },
  { standard: 'ঢাকা', patterns: [/ঢাকা[য়েয়]?/i, /dhaka/i] },
  { standard: 'চট্টগ্রাম', patterns: [/চট্টগ্রাম/i, /চিটাগাং/i, /chittagong/i, /chattogram/i] },
  { standard: 'কক্সবাজার', patterns: [/কক্সবাজার/i, /cox'?s?\s*bazar/i] },
  { standard: 'গাজীপুর', patterns: [/গাজীপুর/i, /gazipur/i] },
  { standard: 'নারায়ণগঞ্জ', patterns: [/নারায়?ণগঞ্জ/i, /narayanganj/i] },
  { standard: 'কুমিল্লা', patterns: [/কুমিল্লা/i, /comilla/i, /cumilla/i] },
  { standard: 'সিলেট', patterns: [/সিলেট/i, /sylhet/i] },
  { standard: 'রাজশাহী', patterns: [/রাজশাহী/i, /rajshahi/i] },
  { standard: 'বগুড়া', patterns: [/বগু[ড়়]া/i, /bogra/i, /bogura/i] },
  { standard: 'খুলনা', patterns: [/খুলনা/i, /khulna/i] },
  { standard: 'বরিশাল', patterns: [/বরিশাল/i, /barisal/i, /barishal/i] },
  { standard: 'ময়মনসিংহ', patterns: [/ময়মনসিংহ/i, /mymensingh/i] },
  { standard: 'রংপুর', patterns: [/রংপুর/i, /rangpur/i] },
  { standard: 'দিনাজপুর', patterns: [/দিনাজপুর/i, /dinajpur/i] },
  { standard: 'ফেনী', patterns: [/ফেনী/i, /feni/i] },
  { standard: 'নোয়াখালী', patterns: [/নোয়াখালী/i, /noakhali/i] },
  { standard: 'ব্রাহ্মণবাড়িয়া', patterns: [/ব্রাহ্মণবা[ড়়]িয়া/i, /brahmanbaria/i] },
  { standard: 'চাঁদপুর', patterns: [/চাঁদপুর/i, /chandpur/i] },
  { standard: 'লক্ষ্মীপুর', patterns: [/লক্ষ্মীপুর/i, /lakshmipur/i] },
  { standard: 'যশোর', patterns: [/যশোর/i, /jessore/i, /jashore/i] },
  { standard: 'পাবনা', patterns: [/পাবনা/i, /pabna/i] },
  { standard: 'কুষ্টিয়া', patterns: [/কুষ্টিয়া/i, /kushtia/i] },
  { standard: 'টাঙ্গাইল', patterns: [/টাঙ্গাইল/i, /tangail/i] },
  { standard: 'কিশোরগঞ্জ', patterns: [/কিশোরগঞ্জ/i, /kishoreganj/i] },
  { standard: 'জামালপুর', patterns: [/জামালপুর/i, /jamalpur/i] },
  { standard: 'নেত্রকোণা', patterns: [/নেত্রকোণা/i, /netrokona/i] },
  { standard: 'হবিগঞ্জ', patterns: [/হবিগঞ্জ/i, /habiganj/i] },
  { standard: 'মৌলভীবাজার', patterns: [/মৌলভীবাজার/i, /moulvibazar/i] },
  { standard: 'সুনামগঞ্জ', patterns: [/সুনামগঞ্জ/i, /sunamganj/i] }
];

// 2. Upazilas / Thanas Dictionary with Parent District Inference
const UPAZILA_MAP: { upazila: string; district: string; patterns: RegExp[] }[] = [
  // Khagrachhari
  { upazila: 'খাগড়াছড়ি সদর', district: 'খাগড়াছড়ি', patterns: [/খাগ[ড়়]াছ[ড়়]ি\s*সদর/i, /সদর\s*খাগ[ড়়]াছ[ড়়]ি/i] },
  { upazila: 'দীঘিনালা', district: 'খাগড়াছড়ি', patterns: [/দী?ঘী?নালা[য়েয়]?/i, /dighinala/i] },
  { upazila: 'পানছড়ি', district: 'খাগড়াছড়ি', patterns: [/পানছ[ড়়]ি[তে]?/i, /panchhari/i] },
  { upazila: 'মাটিরাঙ্গা', district: 'খাগড়াছড়ি', patterns: [/মাটিরাঙ্গা[য়েয়]?/i, /matiranga/i] },
  { upazila: 'মানিকছড়ি', district: 'খাগড়াছড়ি', patterns: [/মানিকছ[ড়়]ি[তে]?/i, /manikchhari/i] },
  { upazila: 'মহালছড়ি', district: 'খাগড়াছড়ি', patterns: [/মহালছ[ড়়]ি[তে]?/i, /mahalchhari/i] },
  { upazila: 'রামগড়', district: 'খাগড়াছড়ি', patterns: [/রামগ[ড়ড][হে]?/i, /ramgarh/i] },
  { upazila: 'লক্ষ্মীছড়ি', district: 'খাগড়াছড়ি', patterns: [/লক্ষ্মীছ[ড়়]ি/i, /lakshmichhari/i] },
  { upazila: 'গুয়াইমারা', district: 'খাগড়াছড়ি', patterns: [/গুয়াইমারা/i, /guimara/i] },

  // Rangamati
  { upazila: 'রাঙ্গামাটি সদর', district: 'রাঙ্গামাটি', patterns: [/রাঙ্গা?মাটি\s*সদর/i] },
  { upazila: 'কাপ্তাই', district: 'রাঙ্গামাটি', patterns: [/কাপ্তাই[য়েয়]?/i, /kaptai/i] },
  { upazila: 'বাঘাইছড়ি', district: 'রাঙ্গামাটি', patterns: [/বাঘাইছ[ড়়]ি/i, /baghaichhari/i] },
  { upazila: 'নানিয়ারচর', district: 'রাঙ্গামাটি', patterns: [/নানিয়ারচর/i, /naniarchar/i] },
  { upazila: 'লংগদু', district: 'রাঙ্গামাটি', patterns: [/লংগদু/i, /langadu/i] },
  { upazila: 'জুরাইছড়ি', district: 'রাঙ্গামাটি', patterns: [/জুরাইছ[ড়়]ি/i, /juraichhari/i] },
  { upazila: 'বরকল', district: 'রাঙ্গামাটি', patterns: [/বরকল/i, /barkal/i] },
  { upazila: 'কাউখালী', district: 'রাঙ্গামাটি', patterns: [/কাউখালী/i, /kawkhali/i] },
  { upazila: 'বিলাইছড়ি', district: 'রাঙ্গামাটি', patterns: [/বিলাইছ[ড়়]ি/i, /bilaichhari/i] },
  { upazila: 'রাজস্থলী', district: 'রাঙ্গামাটি', patterns: [/রাজস্থলী/i, /rajasthali/i] },

  // Bandarban
  { upazila: 'বান্দরবান সদর', district: 'বান্দরবান', patterns: [/বান্দরবান\s*সদর/i] },
  { upazila: 'রুমা', district: 'বান্দরবান', patterns: [/রুমা[য়েয়]?/i, /ruma/i] },
  { upazila: 'থানচি', district: 'বান্দরবান', patterns: [/থানচি[তে]?/i, /thanchi/i] },
  { upazila: 'রোয়াংছড়ি', district: 'বান্দরবান', patterns: [/রোয়াংছ[ড়়]ি/i, /rowangchhari/i] },
  { upazila: 'লামা', district: 'বান্দরবান', patterns: [/লামা[য়েয়]?/i, /lama/i] },
  { upazila: 'আলীকদম', district: 'বান্দরবান', patterns: [/আলীকদম/i, /alikadam/i] },
  { upazila: 'নাইক্ষ্যংছড়ি', district: 'বান্দরবান', patterns: [/নাইক্ষ্যংছ[ড়়]ি/i, /naikhongchhari/i] },

  // Dhaka & Suburbs
  { upazila: 'সাভার', district: 'ঢাকা', patterns: [/সাভার[রে]?/i, /savar/i] },
  { upazila: 'উত্তরা', district: 'ঢাকা', patterns: [/উত্তরা[য়েয়]?/i, /uttara/i] },
  { upazila: 'মিরপুর', district: 'ঢাকা', patterns: [/মিরপুর[রে]?/i, /mirpur/i] },
  { upazila: 'ধানমন্ডি', district: 'ঢাকা', patterns: [/ধানমন্ডি[তে]?/i, /dhanmondi/i] },
  { upazila: 'গুলশান', district: 'ঢাকা', patterns: [/গুলশান[নে]?/i, /gulshan/i] },
  { upazila: 'বনানী', district: 'ঢাকা', patterns: [/বনানী[তে]?/i, /banani/i] },
  { upazila: 'মোহাম্মদপুর', district: 'ঢাকা', patterns: [/মোহাম্মদপুর[রে]?/i, /mohammadpur/i] },
  { upazila: 'কেরানীগঞ্জ', district: 'ঢাকা', patterns: [/কেরানীগঞ্জ/i, /keraniganj/i] },
  { upazila: 'ধামরাই', district: 'ঢাকা', patterns: [/ধামরাই/i, /dhamrai/i] },
  { upazila: 'টঙ্গী', district: 'গাজীপুর', patterns: [/টঙ্গী[তে]?/i, /tongi/i] },
  { upazila: 'গাজীপুর সদর', district: 'গাজীপুর', patterns: [/গাজীপুর\s*সদর/i] }
];

// 3. Blood Groups Mapping
const BLOOD_GROUPS = [
  { group: 'O+', patterns: [/o\s*\+|ও\s*পজিটিভ|ও\s*\+|ও\s*পজেটিভ|ও\s*পজিটিপ|o\s*positive/i] },
  { group: 'O-', patterns: [/o\s*\-|ও\s*নেগেটিভ|ও\s*\-|ও\s*নেগেটিপ|o\s*negative/i] },
  { group: 'A+', patterns: [/a\s*\+|এ\s*পজিটিভ|এ\s*\+|এ\s*পজেটিভ|এ\s*পজিটিপ|a\s*positive/i] },
  { group: 'A-', patterns: [/a\s*\-|এ\s*নেগেটিভ|এ\s*\-|এ\s*নেগেটিপ|a\s*negative/i] },
  { group: 'B+', patterns: [/b\s*\+|বি\s*পজিটিভ|বি\s*\+|বি\s*পজেটিভ|বি\s*পজিটিপ|b\s*positive/i] },
  { group: 'B-', patterns: [/b\s*\-|বি\s*নেগেটিভ|বি\s*\-|বি\s*নেগেটিপ|b\s*negative/i] },
  { group: 'AB+', patterns: [/ab\s*\+|এবি\s*পজিটিভ|এবি\s*\+|এবি\s*পজেটিভ|এবি\s*পজিটিপ|ab\s*positive/i] },
  { group: 'AB-', patterns: [/ab\s*\-|এবি\s*নেগেটিভ|এবি\s*\-|এবি\s*নেগেটিপ|ab\s*negative/i] }
];

// 4. Service Keywords & Category Mapping
const SERVICE_CATEGORIES = [
  { 
    category: 'ইলেকট্রিশিয়ান (Electrician)', 
    patterns: [/ইলেকট্রিশিয়ান/i, /ইলেকট্রিক/i, /বিদ্যুৎ/i, /ওয়্যারিং/i, /কারেন্ট/i, /ফ্যান/i, /লাইট/i, /electrician/i] 
  },
  { 
    category: 'প্লাম্বার (Plumber)', 
    patterns: [/প্লাম্বার/i, /প্লাম্বিং/i, /স্যানিটারি/i, /পাইপ/i, /পানির\s*লাইন/i, /কল/i, /plumber/i] 
  },
  { 
    category: 'ফ্রিজ ও এসি টেকনিশিয়ান', 
    patterns: [/ফ্রিজ/i, /রেফ্রিজারেটর/i, /এসি/i, /এয়ার\s*কন্ডিশনার/i, /ac\s*repair/i] 
  },
  { 
    category: 'গৃহকর্মী ও ক্লিনার', 
    patterns: [/গৃহকর্মী/i, /ক্লিনার/i, /ক্লিনিং/i, /ধোয়ামোছা/i, /ঝাড়ু/i, /রান্নার\s*মানুষ/i] 
  },
  { 
    category: 'হোম টিউটর ও শিক্ষক', 
    patterns: [/টিউটর/i, /শিক্ষক/i, /মাস্টার/i, /পড়ানোর/i, /টিউশনি/i, /tutor/i, /teacher/i] 
  },
  { 
    category: 'ডাক্তার ও নার্স', 
    patterns: [/ডাক্তার/i, /নার্স/i, /চিকিৎসা/i, /ফিজিওথেরাপিস্ট/i, /প্রেসার/i, /ডায়াবেটিস/i, /doctor/i, /nurse/i] 
  },
  { 
    category: 'কাঠমিস্ত্রি ও ফার্নিচার', 
    patterns: [/কাঠমিস্ত্রি/i, /ফার্নিচার/i, /খাট/i, /সোফা/i, /দরজা/i, /carpenter/i] 
  },
  { 
    category: 'রাজমিস্ত্রি ও পেইন্টার', 
    patterns: [/রাজমিস্ত্রি/i, /পেইন্টার/i, /রংমিস্ত্রি/i, /টাইলস/i, /ঢালাই/i] 
  }
];

// 5. Product Categories & Items Mapping
const PRODUCT_CATEGORIES = [
  { 
    category: 'অর্গানিক খাবার ও মসলা', 
    patterns: [/সরিষার\s*তেল/i, /মধু/i, /হলুদ/i, /মরিচ/i, /চাল/i, /চালের\s*গুঁড়া/i, /মসলা/i, /ঘি/i, /organic/i, /oil/i, /honey/i, /chili/i, /chilli/i, /powder/i, /spices/i, /pepper/i] 
  },
  { 
    category: 'পাহাড়ি শুঁটকি ও সিদল', 
    patterns: [/শুঁ?টকি/i, /সিদল/i, /হিদল/i, /shutki/i, /sidol/i] 
  },
  { 
    category: 'পোশাক ও পাহাড়ি তাঁত', 
    patterns: [/পিনন/i, /হাদি/i, /শাল/i, /তাঁত/i, /পোশাক/i, /পাঞ্জাবি/i, /শাড়ি/i, /কুর্তি/i, /টি-শার্ট/i, /dress/i] 
  },
  { 
    category: 'স্মার্ট ইলেকট্রনিক্স ও গ্যাজেট', 
    patterns: [/স্মার্টওয়াচ/i, /ইয়ারবাডস/i, /হেডফোন/i, /পাওয়ার\s*ব্যাংক/i, /হেডল্যাম্প/i, /gadget/i] 
  }
];

// 6. Rent / Vehicles Mapping
const RENT_CATEGORIES = [
  { 
    category: 'গাড়ি ও রেন্ট-এ-কার', 
    patterns: [/গাড়ি/i, /গাড়ি\s*ভাড়া/i, /কার/i, /চান্দের\s*গাড়ি/i, /জীপ/i, /সিএনজি/i, /অটো/i, /হাইয়েস/i, /মাইক্রোবাস/i, /বাইক/i, /rent/i, /car/i, /bike/i] 
  }
];

// 7. Ambulance Mapping
const AMBULANCE_PATTERNS = [
  /অ্যাম্বুলেন্স/i, /এম্বুলেন্স/i, /ambulance/i, /আইসিইউ\s*অ্যাম্বুলেন্স/i, /রোগী\s*পরিবহন/i, /লাইফ\s*সাপোর্ট/i, /অক্সিজেন\s*গাড়ি/i, /icu\s*ambulance/i
];

// 8. Emergency / Police / Source Mapping
const EMERGENCY_PATTERNS = [
  /৯৯৯/i, /999/i, /পুলিশ/i, /থানা/i, /ওসি/i, /sp\s*office/i, /এসপি/i, /কন্ট্রোল\s*রুম/i, /ফায়ার\s*সার্ভিস/i, /জরুরি\s*সেবা/i, /emergency/i, /helpline/i, /হটলাইন/i, /১০৯/i, /১০৯৮/i, /১৬২৬৩/i, /৩৩৩/i, /১০৬/i, /দুদক/i, /police/i, /সোর্স/i
];

/**
 * Parses conversational Bangla text into structured search criteria
 */
export function parseBanglaSearchQuery(inputText: string): ParsedSearchResult {
  const query = inputText.trim();
  let searchType: 'service' | 'product' | 'blood' | 'rent' | 'source' | 'emergency' | 'ambulance' = 'service';
  let district: string | null = null;
  let upazila: string | null = null;
  let bloodGroup: string | null = null;
  let category: string | null = null;
  let detectedKeyword: string = '';

  // 1. Detect Ambulance
  if (AMBULANCE_PATTERNS.some(p => p.test(query))) {
    searchType = 'ambulance';
    category = 'জরুরি অ্যাম্বুলেন্স সেবা';
  }

  // 2. Detect Emergency / Source / Police
  else if (EMERGENCY_PATTERNS.some(p => p.test(query))) {
    searchType = 'source';
    category = 'জরুরি পুলিশ ও জাতীয় হটলাইন';
  }

  // 3. Detect Blood Group / Blood Search
  else {
    for (const bg of BLOOD_GROUPS) {
      if (bg.patterns.some(p => p.test(query))) {
        bloodGroup = bg.group;
        searchType = 'blood';
        category = `${bg.group} রক্তদাতা`;
        break;
      }
    }

    if (searchType !== 'blood' && /রক্ত|ব্লাড|blood|রক্তদাতা|ডোনার|donor/i.test(query)) {
      searchType = 'blood';
      if (!category && bloodGroup) {
        category = `${bloodGroup} রক্তদাতা`;
      } else if (!category) {
        category = 'জরুরি রক্তদাতা';
      }
    }
  }

  // 4. Detect Rent / Car / Vehicle
  if (searchType !== 'blood' && searchType !== 'ambulance' && searchType !== 'source') {
    for (const rent of RENT_CATEGORIES) {
      if (rent.patterns.some(p => p.test(query))) {
        searchType = 'rent';
        category = rent.category;
        break;
      }
    }
  }

  // 5. Detect Products
  if (searchType !== 'blood' && searchType !== 'ambulance' && searchType !== 'source' && searchType !== 'rent') {
    for (const prod of PRODUCT_CATEGORIES) {
      if (prod.patterns.some(p => p.test(query))) {
        searchType = 'product';
        category = prod.category;
        break;
      }
    }
  }

  // 6. Detect Services
  if (searchType !== 'blood' && searchType !== 'ambulance' && searchType !== 'source' && searchType !== 'rent' && searchType !== 'product') {
    for (const srv of SERVICE_CATEGORIES) {
      if (srv.patterns.some(p => p.test(query))) {
        searchType = 'service';
        category = srv.category;
        break;
      }
    }
  }

  // Check generic indicators if not yet determined
  if (searchType === 'service') {
    if (/কেনা|কিনব|কিনতে|দাম|অর্ডার|বিক্রি|পণ্য|product|shop|দাম\s*কত/i.test(query)) {
      searchType = 'product';
    } else if (/অ্যাম্বুলেন্স|রোগী\s*নেওয়া/i.test(query)) {
      searchType = 'ambulance';
    } else if (/পুলিশ|থানা|সাহায্য|৯৯৯|ফায়ার/i.test(query)) {
      searchType = 'source';
    }
  }

  // 5. Detect Upazila / Thana first (which can also infer district)
  for (const item of UPAZILA_MAP) {
    if (item.patterns.some(p => p.test(query))) {
      upazila = item.upazila;
      if (!district) {
        district = item.district;
      }
      break;
    }
  }

  // 6. Detect District
  for (const item of DISTRICT_MAP) {
    if (item.patterns.some(p => p.test(query))) {
      district = item.standard;
      break;
    }
  }

  // If district detected with "সদর" in query, auto-map upazila
  if (district && !upazila && /সদর|সদরে/i.test(query)) {
    upazila = `${district} সদর`;
  }

  // 7. Clean Query to extract Core Search Keyword
  let cleaned = query;
  
  // Remove district and upazila words from keyword
  if (district) {
    cleaned = cleaned.replace(new RegExp(`${district}[য়েয়দেররতে]?`, 'gi'), '');
  }
  if (upazila) {
    cleaned = cleaned.replace(new RegExp(`${upazila}[য়েয়দেররতে]?`, 'gi'), '');
    cleaned = cleaned.replace(/সদর[রে]?/gi, '');
  }

  // Remove common filler words
  const fillerWords = [
    /চাই/gi, /দরকার/gi, /প্রয়োজন/gi, /খুঁজছি/gi, /লাগবে/gi, /কোথায়\s*পাবো/gi,
    /দিতে\s*পারবেন/gi, /আছে\s*কি/gi, /একজন/gi, /জরুরি/gi, /খুব\s*জরুরি/gi,
    /আর্জেন্ট/gi, /urgent/gi, /please/gi, /দয়া\s*করে/gi
  ];
  for (const fw of fillerWords) {
    cleaned = cleaned.replace(fw, '');
  }

  cleaned = cleaned.trim().replace(/\s+/g, ' ');

  // If cleaned is empty, pick category or query
  if (!cleaned) {
    if (bloodGroup) {
      cleaned = `${bloodGroup} রক্তদাতা`;
    } else if (category) {
      cleaned = category.split('(')[0].trim();
    } else {
      cleaned = query;
    }
  }

  // Build natural summary text
  const typeText = 
    searchType === 'blood' ? 'রক্তদাতা' :
    searchType === 'ambulance' ? 'জরুরি অ্যাম্বুলেন্স' :
    searchType === 'source' ? 'সোর্স ও পুলিশ' :
    searchType === 'service' ? 'পেশাদার সেবা' :
    searchType === 'rent' ? 'গাড়ি ভাড়া' : 'পণ্য';

  const locText = upazila ? `${upazila}, ${district || ''}` : district ? district : 'সকল এলাকা';
  const summaryBn = `AI ফিল্টার: [${typeText}] | অবস্থান: ${locText} | কীওয়ার্ড: "${cleaned}"`;

  return {
    rawQuery: query,
    cleanedKeyword: cleaned,
    searchType,
    district,
    upazila,
    area: null,
    bloodGroup,
    category,
    summaryBn
  };
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve(typeof reader.result === 'string' ? reader.result : '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

export interface VoiceRecognitionOptions {
  onStart?: () => void;
  onResult: (transcript: string, parsed: ParsedSearchResult) => void;
  onError?: (error: string) => void;
  onEnd?: () => void;
}

export interface VoiceRecognitionHandle {
  stop: () => void;
  abort: () => void;
}

/**
 * Mobile-compatible MediaRecorder voice fallback with Gemini server-side transcription
 */
async function startMediaRecorderVoiceFallback(
  options: VoiceRecognitionOptions,
  controller: { isCancelled: boolean; cleanup: () => void }
) {
  if (typeof window === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof MediaRecorder === 'undefined') {
    if (options.onError) {
      options.onError('ভয়েস রিকগনিশন এই ডিভাইসে সমর্থিত নয়। অনুগ্রহ করে লিখে সার্চ করুন।');
    }
    if (options.onEnd) {
      options.onEnd();
    }
    return;
  }

  let stream: MediaStream | null = null;
  let recorder: MediaRecorder | null = null;
  const chunks: Blob[] = [];

  try {
    stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    if (controller.isCancelled) {
      stream.getTracks().forEach((t) => t.stop());
      return;
    }

    // Select supported mime type for audio recording
    let mimeType = 'audio/webm';
    if (typeof MediaRecorder.isTypeSupported === 'function') {
      if (MediaRecorder.isTypeSupported('audio/webm;codecs=opus')) {
        mimeType = 'audio/webm;codecs=opus';
      } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
        mimeType = 'audio/mp4';
      } else if (MediaRecorder.isTypeSupported('audio/aac')) {
        mimeType = 'audio/aac';
      } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
        mimeType = 'audio/ogg';
      }
    }

    recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
    recorder.ondataavailable = (e) => {
      if (e.data && e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    recorder.onstart = () => {
      if (options.onStart) options.onStart();
    };

    recorder.onerror = () => {
      if (stream) stream.getTracks().forEach((t) => t.stop());
      if (options.onError) options.onError('ভয়েস রেকর্ড করতে সমস্যা হয়েছে।');
      if (options.onEnd) options.onEnd();
    };

    recorder.onstop = async () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
      if (controller.isCancelled) {
        if (options.onEnd) options.onEnd();
        return;
      }

      const audioBlob = new Blob(chunks, { type: recorder?.mimeType || mimeType || 'audio/webm' });
      if (audioBlob.size < 120) {
        if (options.onError) options.onError('কথা শনাক্ত হয়নি। আবার চেষ্টা করুন।');
        if (options.onEnd) options.onEnd();
        return;
      }

      try {
        const base64 = await blobToBase64(audioBlob);
        const res = await fetch('/api/voice-transcribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            audioBase64: base64,
            mimeType: audioBlob.type || mimeType,
            lang: 'bn',
          }),
        });

        if (!res.ok) {
          throw new Error('Server transcription error');
        }

        const data = await res.json();
        if (data.success && data.transcript) {
          const clean = sanitizeSearchQuery(data.transcript);
          const parsed = parseBanglaSearchQuery(clean);
          options.onResult(clean, parsed);
        } else {
          if (options.onError) {
            options.onError(data.message || 'কথা শনাক্ত হয়নি। আবার চেষ্টা করুন।');
          }
        }
      } catch (err: any) {
        if (options.onError) {
          options.onError('ভয়েস গ্রহণ করা যায়নি। অনুগ্রহ করে কিবোর্ডে লিখে অনুসন্ধান করুন।');
        }
      } finally {
        if (options.onEnd) options.onEnd();
      }
    };

    controller.cleanup = () => {
      try {
        if (recorder && recorder.state !== 'inactive') {
          recorder.stop();
        }
        if (stream) {
          stream.getTracks().forEach((t) => t.stop());
        }
      } catch {}
    };

    recorder.start(250);

    // Auto-stop after 4.5 seconds of listening on mobile if user doesn't press stop
    setTimeout(() => {
      if (recorder && recorder.state === 'recording') {
        try {
          recorder.stop();
        } catch {}
      }
    }, 4500);
  } catch (err: any) {
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
    }
    const isDenied = err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError';
    if (options.onError) {
      options.onError(isDenied ? 'মাইক্রোফোনের অনুমতি দেওয়া হয়নি।' : 'ভয়েস রিকগনিশন চালু করা যায়নি।');
    }
    if (options.onEnd) {
      options.onEnd();
    }
  }
}

/**
 * Robust Bangla Voice Recognition Engine
 * Fully compatible with Mobile Phones, PWAs, Android WebViews, iOS Safari & Desktop.
 * - Proactively requests & verifies mobile runtime microphone permissions.
 * - Safely initializes SpeechRecognition without crashing or freezing.
 * - Automatically falls back to MediaRecorder + Gemini voice transcription if Web Speech is missing or fails.
 * - Enforces safety watchdog timers to prevent the UI from getting stuck in "listening" state.
 */
export function startBanglaVoiceRecognition(options: VoiceRecognitionOptions): VoiceRecognitionHandle {
  const controller = {
    isCancelled: false,
    cleanup: () => {},
  };

  let hasEnded = false;
  let watchdogTimer: any = null;

  const triggerEnd = () => {
    if (!hasEnded) {
      hasEnded = true;
      if (watchdogTimer) clearTimeout(watchdogTimer);
      controller.cleanup();
      if (options.onEnd) options.onEnd();
    }
  };

  const handle: VoiceRecognitionHandle = {
    stop: () => {
      controller.isCancelled = true;
      controller.cleanup();
      triggerEnd();
    },
    abort: () => {
      controller.isCancelled = true;
      controller.cleanup();
      triggerEnd();
    },
  };

  // 10-second safety watchdog: guarantees listening state will NEVER stay frozen forever on mobile
  watchdogTimer = setTimeout(() => {
    if (!hasEnded) {
      handle.stop();
    }
  }, 10000);

  // Asynchronously request mobile runtime permission and initiate recognition
  (async () => {
    try {
      // 1. Verify and request mobile microphone permission via navigator.mediaDevices.getUserMedia
      const permResult = await requestMicrophoneOnDemand();
      if (controller.isCancelled) return;

      if (!permResult.granted) {
        if (options.onError) {
          options.onError(permResult.errorMessageBn || 'মাইক্রোফোনের অনুমতি পাওয়া যায়নি।');
        }
        triggerEnd();
        return;
      }

      // 2. Check for native Web Speech API support
      const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

      if (SpeechRec) {
        try {
          const recognition = new SpeechRec();
          recognition.lang = 'bn-BD';
          recognition.interimResults = false;
          recognition.maxAlternatives = 1;
          recognition.continuous = false;

          controller.cleanup = () => {
            try {
              recognition.abort();
            } catch {}
          };

          recognition.onstart = () => {
            if (!controller.isCancelled && options.onStart) {
              options.onStart();
            }
          };

          recognition.onresult = (event: any) => {
            if (controller.isCancelled) return;
            const rawTranscript = event.results?.[0]?.[0]?.transcript || '';
            const transcript = sanitizeSearchQuery(rawTranscript);
            const parsed = parseBanglaSearchQuery(transcript);
            options.onResult(transcript, parsed);
          };

          recognition.onerror = (event: any) => {
            if (controller.isCancelled || event.error === 'aborted') {
              return;
            }

            // If mobile WebView or device lacks Google Speech Services or throws network/service error,
            // attempt fallback to MediaRecorder + Gemini
            if (event.error === 'service-not-allowed' || event.error === 'network' || event.error === 'audio-capture') {
              console.info('[SpeechRecognition] Native error encountered, switching to MediaRecorder fallback:', event.error);
              startMediaRecorderVoiceFallback(options, controller);
              return;
            }

            if (options.onError) {
              if (event.error === 'not-allowed') {
                options.onError('মাইক্রোফোন অনুমতি প্রয়োজন।');
              } else if (event.error === 'no-speech') {
                options.onError('কথা শনাক্ত হয়নি। অনুগ্রহ করে আবার চেষ্টা করুন।');
              } else {
                options.onError(event.error || 'ভয়েস ত্রুটি।');
              }
            }
          };

          recognition.onend = () => {
            triggerEnd();
          };

          recognition.start();
          return;
        } catch (nativeErr) {
          console.warn('[SpeechRecognition] Failed to start native speech, switching to fallback:', nativeErr);
        }
      }

      // 3. Fallback to MediaRecorder + Server-side Gemini audio transcription
      startMediaRecorderVoiceFallback(options, controller);
    } catch (outerErr: any) {
      if (options.onError) {
        options.onError(outerErr?.message || 'ভয়েস সার্চ শুরু করা যায়নি।');
      }
      triggerEnd();
    }
  })();

  return handle;
}
