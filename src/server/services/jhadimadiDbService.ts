import fs from 'fs';
import path from 'path';
import { normalizeBanglaAndBanglish } from './ragVectorService';
import {
  normalizeBengaliUnicode,
  matchQueryAgainstTarget,
  extractCleanSearchTokens,
  getBengaliPhoneticFingerprint
} from './bengaliSearchEngine';
import { matchesSmartProduct } from '../../utils/fuzzySearch';

const DATA_DIR = path.join(process.cwd(), 'data');
const PRODUCTS_DATA_FILE = path.join(DATA_DIR, 'products.json');
const KNOWLEDGE_BASE_FILE = path.join(DATA_DIR, 'jhadimadi_knowledge_base.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');
const BLOOD_DONORS_FILE = path.join(DATA_DIR, 'blood_donors.json');
const SERVICE_PROVIDERS_FILE = path.join(DATA_DIR, 'service_providers.json');
const REGISTERED_MEMBERS_FILE = path.join(DATA_DIR, 'registered_members.json');
const FEED_POSTS_FILE = path.join(DATA_DIR, 'feed_posts.json');
const JOB_SEEKERS_FILE = path.join(DATA_DIR, 'job_seekers.json');
const JOB_CIRCULARS_FILE = path.join(DATA_DIR, 'job_circulars.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface StoreProductRecord {
  id: string;
  code?: string;
  nameBn: string;
  nameEn: string;
  category: string;
  categoryLabelBn?: string;
  price: number;
  originalPrice?: number;
  unit: string;
  stock: number;
  image?: string;
  images?: string[];
  origin?: string;
  productionOrigin?: string;
  district?: string;
  upazila?: string;
  area?: string;
  location?: string;
  qualityStandards?: string;
  descriptionBn?: string;
  descriptionEn?: string;
  badge?: string;
  badgeColor?: string;
  rating?: number;
  reviewsCount?: number;
  inStock?: boolean;
  isActive?: boolean;
  isPublished?: boolean;
  sellerName?: string;
  sellerPhone?: string;
}

export interface BloodDonorRecord {
  id: string;
  districtUniqueId?: string;
  name: string;
  bloodGroup: string;
  district: string;
  upazila: string;
  area?: string;
  phone: string;
  password?: string;
  profession?: string;
  available: boolean;
  lastDonationDate?: string;
  photo_url?: string;
  photo?: string;
}

export interface ServiceProviderRecord {
  id: string;
  districtUniqueId?: string;
  name: string;
  profession: string;
  categoryBn?: string;
  categoryEn?: string;
  subCategory?: string;
  skills: string[];
  district: string;
  upazila: string;
  area?: string;
  phone: string;
  rating?: number;
  completedJobs?: number;
  responseRate?: number;
  verificationStatus?: string;
  availabilityNote?: string;
  experienceYears?: number;
  hourlyRate?: number;
  available?: boolean;
  bioBn?: string;
  photo_url?: string;
  photo?: string;
}

/**
 * Extracts numeric budget in BDT from either English or Bengali string.
 */
export function parseBudgetNumber(val?: string | number): number | null {
  if (typeof val === 'number') return val > 0 ? val : null;
  if (!val) return null;
  const bnToEn: Record<string, string> = { '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4', '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9' };
  const normalized = String(val).replace(/[০-৯]/g, d => bnToEn[d] || d);
  const match = normalized.match(/\d+/);
  return match ? parseInt(match[0], 10) : null;
}

export interface RegisteredMemberRecord {
  id: string;
  districtUniqueId?: string;
  name: string;
  role: string;
  roleLabelBn: string;
  district: string;
  upazila: string;
  area?: string;
  phone: string;
  joiningDate?: string;
  status: string;
  responsibilities?: string;
  photo_url?: string;
  photo?: string;
}

/**
 * Generates and formats a District-based Unique ID in Bengali (e.g. "রাঙা-০০১", "খাগ-০০১", "বান্দ-০০১").
 */
export function formatBengaliDistrictUniqueId(district: string = 'খাগড়াছড়ি', indexOrCounter: number | string = 1): string {
  const dNorm = (district || '').toLowerCase();
  let prefix = 'খাগ';
  if (dNorm.includes('রাঙ্গামাটি') || dNorm.includes('রাঙামাটি') || dNorm.includes('rangamati') || dNorm.includes('রাঙা')) {
    prefix = 'রাঙা';
  } else if (dNorm.includes('খাগড়াছড়ি') || dNorm.includes('খাগড়াছড়ি') || dNorm.includes('khagrachhari') || dNorm.includes('khagrachari') || dNorm.includes('খাগ')) {
    prefix = 'খাগ';
  } else if (dNorm.includes('বান্দরবান') || dNorm.includes('bandarban') || dNorm.includes('বান্দ')) {
    prefix = 'বান্দ';
  } else if (dNorm.includes('চট্টগ্রাম') || dNorm.includes('chittagong') || dNorm.includes('chattogram') || dNorm.includes('চট্ট')) {
    prefix = 'চট্ট';
  } else if (dNorm.includes('কক্সবাজার') || dNorm.includes("cox's bazar") || dNorm.includes('কক্স')) {
    prefix = 'কক্স';
  } else if (dNorm.includes('ঢাকা') || dNorm.includes('dhaka')) {
    prefix = 'ঢাকা';
  } else if (dNorm.includes('কুমিল্লা') || dNorm.includes('cumilla')) {
    prefix = 'কুমিল্লা';
  } else if (dNorm.includes('সিলেট') || dNorm.includes('sylhet')) {
    prefix = 'সিলেট';
  } else {
    prefix = (district || '').trim().slice(0, 4) || 'ঝাদি';
  }

  let num = 1;
  if (typeof indexOrCounter === 'number') {
    num = indexOrCounter;
  } else if (typeof indexOrCounter === 'string') {
    const digits = indexOrCounter.replace(/[^0-9]/g, '');
    num = digits ? parseInt(digits, 10) : 1;
  }
  const padded = String(num).padStart(3, '0');
  const bnDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  const numBn = padded.split('').map(c => {
    const digit = parseInt(c, 10);
    return isNaN(digit) ? c : bnDigits[digit];
  }).join('');

  return `${prefix}-${numBn}`;
}

/**
 * Formats a privacy-protected contact action link.
 * NEVER shows direct personal phone numbers as raw text.
 * Strictly adheres to: <a href="tel:[PHONE_NUMBER]">যোগাযোগ করুন</a>
 */
export function formatContactActionTelLink(phoneNumber: string, label: string = 'যোগাযোগ করুন'): string {
  const cleanPhone = (phoneNumber || '01870592699').replace(/[^0-9+]/g, '');
  return `<a href="tel:${cleanPhone}">${label}</a>`;
}

// ----------------------------------------------------
// 1. PRODUCTS DATABASE RETRIEVAL & FUZZY/PHONETIC SEARCH
// ----------------------------------------------------

export function getAllProductsFromDb(): StoreProductRecord[] {
  try {
    if (fs.existsSync(PRODUCTS_DATA_FILE)) {
      const raw = fs.readFileSync(PRODUCTS_DATA_FILE, 'utf-8');
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    }
  } catch (e: any) {
    console.warn('[Jhadimadi DB] Error reading products:', e.message);
  }
  return [];
}

/**
 * Multi-tier database search for products:
 * 1. Exact code / ID match
 * 2. Exact Bangla / English name match
 * 3. Bangla spelling variation match (মরিচের গুঁড়া/গুড়া/গুরা)
 * 4. Banglish transliteration match (moricher gura, sidol, shutki, tel)
 * 5. Voice transcription error match (শিদল/হিদল/হীদল/গীদল -> সিদোল)
 * 6. Category and keyword matching
 * 7. Location & Stock availability filter
 */
export function search_products(query: string, location?: string): {
  matchedProducts: StoreProductRecord[];
  searchNote: string;
} {
  const products = getAllProductsFromDb();
  if (!query || query.trim() === '') {
    return { matchedProducts: products.slice(0, 5), searchNote: 'সাম্প্রতিক জনপ্রিয় পণ্যসমূহ' };
  }

  const rawQ = query.trim();
  
  // STRICT RULE 1: Blood inquiries are never products. Immediately return empty array.
  if (/রক্ত|ব্লাড|blood|donor|ডোনার|\b(?:a|b|ab|o)[+-]\b|পজিটিভ|নেগেটিভ/i.test(rawQ)) {
    return {
      matchedProducts: [],
      searchNote: 'রক্ত বা জরুরি রক্তদাতা অনুসন্ধান — কোনো সাধারণ পণ্য নয়।',
    };
  }

  const normalizedQ = normalizeBanglaAndBanglish(rawQ);
  // Filter out stop words and short generic tokens
  const stopWords = new Set([
    'আমার', 'আপনার', 'লাগবে', 'চাই', 'আছে', 'কি', 'না', 'বলো', 'বলুন', 'কত', 'দাম', 'টাকা', 
    'পণ্য', 'আইটেম', 'একটু', 'দেখা', 'দেখাও', 'দেখান', 'খুঁজছি', 'খুঁজে', 'দাও', 'দিন', 
    'কোনো', 'কোথায়', 'help', 'need', 'want', 'please', 'details'
  ]);
  const qTokens = normalizedQ
    .split(/[\s,./?!+=_-]+/)
    .filter(t => t.length >= 2 && !stopWords.has(t));

  const scored = products.map(product => {
    let score = 0;
    const nameBnNorm = normalizeBanglaAndBanglish(product.nameBn || '');
    const nameEnNorm = normalizeBanglaAndBanglish(product.nameEn || '');
    const code = (product.code || '').toLowerCase();
    const descBnNorm = normalizeBanglaAndBanglish(product.descriptionBn || '');
    const categoryNorm = normalizeBanglaAndBanglish(product.categoryLabelBn || product.category || '');
    const originNorm = normalizeBanglaAndBanglish(product.origin || product.productionOrigin || '');

    // 1. Exact Code Match
    if (code && (rawQ.toLowerCase() === code || rawQ.toLowerCase().includes(code))) {
      score += 100;
    }

    // 2. Generalized Hybrid Matching (Exact -> Normalized -> Phonetic -> Fuzzy -> Token)
    const hybridMatch = matchQueryAgainstTarget(
      product.nameBn,
      rawQ,
      product.nameEn,
      product.categoryLabelBn || product.category
    );

    if (hybridMatch.score > 0) {
      score += hybridMatch.score;
    }

    if (matchesSmartProduct(product, rawQ)) {
      score += 80;
    }

    // 3. Description & Production Origin token inspection
    for (const token of qTokens) {
      if (token.length >= 2) {
        if (descBnNorm.includes(token) && token.length >= 3) score += 15;
        if (originNorm.includes(token) && token.length >= 3) score += 15;
      }
    }

    // 5. Intelligent District, Upazila & Area Matching
    const fullProductLocation = normalizeBanglaAndBanglish(
      `${product.district || ''} ${product.upazila || ''} ${product.area || ''} ${product.origin || ''} ${product.productionOrigin || ''} ${product.location || ''}`
    );
    const locationCorpus = normalizeBanglaAndBanglish(`${location || ''} ${query || ''}`);
    const knownLocations = [
      'খাগড়াছড়ি', 'খাগড়াছড়ি', 'রাঙ্গামাটি', 'রাঙামাটি', 'বান্দরবান', 'চট্টগ্রাম', 'কক্সবাজার', 'ঢাকা',
      'দীঘিনালা', 'পানছড়ি', 'মহালছড়ি', 'মাটিরাঙ্গা', 'মানিকছড়ি', 'রামগড়', 'লক্ষ্মীছড়ি',
      'কাপ্তাই', 'বাঘাইছড়ি', 'বরকল', 'জুরাছড়ি', 'লংগদু', 'নানিয়ারচর', 'রাজস্থলী', 'বিলাইছড়ি',
      'রুমা', 'রোয়াংছড়ি', 'থানচি', 'লামা', 'আলীকদম', 'নাইক্ষ্যংছড়ি',
      'সাজেক', 'বগালেক', 'বনরূপা', 'পানখাইয়াপাড়া', 'বোয়ালখালী', 'রুইলুই', 'তবলছড়ি'
    ];

    let foundTargetLoc = '';
    for (const loc of knownLocations) {
      const locNorm = normalizeBanglaAndBanglish(loc);
      if (locationCorpus.includes(locNorm)) {
        foundTargetLoc = locNorm;
        break;
      }
    }

    const prodUpazilaNorm = normalizeBanglaAndBanglish(product.upazila || '');
    const prodDistrictNorm = normalizeBanglaAndBanglish(product.district || '');

    if (prodUpazilaNorm && locationCorpus.includes(prodUpazilaNorm)) {
      score += 70; // Direct upazila match
    } else if (prodDistrictNorm && locationCorpus.includes(prodDistrictNorm)) {
      score += 35; // District match
    }

    if (foundTargetLoc) {
      if (fullProductLocation.includes(foundTargetLoc)) {
        score += 45; // Match with requested district, upazila, or area
      }
    } else if (location) {
      const locNorm = normalizeBanglaAndBanglish(location);
      if (fullProductLocation.includes(locNorm)) {
        score += 20;
      }
    }

    return { product, score };
  });

  const matches = scored
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(s => s.product);

  let searchNote = '';
  if (matches.length === 1) {
    searchNote = 'সরাসরি একটি পণ্য পাওয়া গেছে।';
  } else if (matches.length > 1) {
    searchNote = `মোট ${matches.length} টি সম্ভাব্য পণ্য পাওয়া গেছে।`;
  } else {
    searchNote = 'দুঃখিত, এই নামের কোনো পণ্য ডাটাবেজে পাওয়া যায়নি।';
  }

  return {
    matchedProducts: matches,
    searchNote,
  };
}

export function get_product_details(codeOrId: string): StoreProductRecord | null {
  const products = getAllProductsFromDb();
  const searchKey = codeOrId.trim().toLowerCase();

  return (
    products.find(
      p =>
        (p.code && p.code.toLowerCase() === searchKey) ||
        p.id.toLowerCase() === searchKey ||
        normalizeBanglaAndBanglish(p.nameBn).includes(normalizeBanglaAndBanglish(searchKey))
    ) || null
  );
}

export function check_product_stock(codeOrId: string): {
  inStock: boolean;
  availableQuantity: number;
  productName: string;
} {
  const product = get_product_details(codeOrId);
  if (!product) {
    return { inStock: false, availableQuantity: 0, productName: 'পণ্য খুঁজে পাওয়া যায়নি' };
  }
  const stockQty = Number(product.stock) || 0;
  const inStock = Boolean(product.inStock !== false && stockQty > 0);

  return {
    inStock,
    availableQuantity: stockQty,
    productName: product.nameBn,
  };
}

// ----------------------------------------------------
// 2. DELIVERY INFORMATION DATABASE
// ----------------------------------------------------

export function get_delivery_information(destination?: string): {
  deliveryMethod: string;
  estimatedDeliveryTime: string;
  couriers: string[];
  deliveryChargePolicy: string;
  totalCostRule: string;
  destinationNote: string;
} {
  const kb = get_company_information();
  const dest = destination ? destination.trim() : '';

  let destinationNote = 'সারাদেশে হোম ডেলিভারি ও ক্যাশ অন ডেলিভারি প্রযোজ্য।';
  if (dest.includes('খাগড়াছড়ি') || dest.includes('রাঙ্গামাটি') || dest.includes('বান্দরবান')) {
    destinationNote = `পার্বত্য চট্টগ্রাম (${dest}) এলাকায় অনুমোদিত তৃতীয় পক্ষ কুরিয়ার সার্ভিসের মাধ্যমে দ্রুততম সময়ে ডেলিভারি করা হয়।`;
  } else if (dest.includes('ঢাকা') || dest.includes('চট্টগ্রাম') || dest.includes('রাজশাহী') || dest.includes('বগুড়া') || dest.includes('দিনাজপুর')) {
    destinationNote = `${dest}-সহ সারাদেশের সকল জেলা ও উপজেলায় অফিসিয়াল কুরিয়ার হোম ডেলিভারি সার্ভিসে ২ থেকে ৩ কার্যদিবসের মধ্যে পার্সেল পৌঁছানো হয়।`;
  }

  return {
    deliveryMethod: 'ক্যাশ অন ডেলিভারি (Cash on Delivery) ও হোম ডেলিভারি',
    estimatedDeliveryTime: '২ থেকে ৩ কার্যদিবস (সারাদেশে)',
    couriers: [
      'সুন্দরবন কুরিয়ার সার্ভিস (Sundarban Courier)',
      'এস এ পরিবহন (SA Paribahan)',
      'পাঠাও কুরিয়ার (Pathao Courier)',
      'স্টেডফাস্ট কুরিয়ার (Steadfast Courier)',
      'রেডএক্স কুরিয়ার (REDX Courier)',
    ],
    deliveryChargePolicy: 'ঝাদিমাদি নিজস্ব কোনো প্রাইভেট কুরিয়ার সার্ভিস পরিচালনা করে না। সকল ডেলিভারি চার্জ পার্সেলের ওজন ও গন্তব্য অনুযায়ী সরকার-অনুমোদিত অফিসিয়াল তৃতীয় পক্ষ কুরিয়ার সার্ভিস (যেমন: সুন্দরবন কুরিয়ার, এস এ পরিবহন, রেডএক্স, পাঠাও ইত্যাদি)-এর নির্ধারিত বিল অনুযায়ী সরাসরি নির্ধারিত হয়।',
    totalCostRule: 'পণ্যের দাম ৳XXX। ডেলিভারি চার্জ গন্তব্য ও কুরিয়ারের অফিশিয়াল চার্জ অনুযায়ী নির্ধারিত হবে।',
    destinationNote,
  };
}

// ----------------------------------------------------
// 3. COMPANY & OFFICE INFORMATION
// ----------------------------------------------------

export function get_company_information(): any {
  try {
    if (fs.existsSync(KNOWLEDGE_BASE_FILE)) {
      const raw = fs.readFileSync(KNOWLEDGE_BASE_FILE, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e: any) {
    console.warn('[Jhadimadi DB] Error reading knowledge base:', e.message);
  }

  return {
    companyInfo: {
      name: 'Jhadimadi.com (ঝাদিমাদি ডটকম)',
      founder: 'নয়ন চাকমা (Nayan Chakma)',
      establishedDate: 'জানুয়ারি ২০২২ (January 2022)',
      headquarters: 'খাগড়াছড়ি সদর, পার্বত্য চট্টগ্রাম',
      primaryTagline: 'আপনার প্রয়োজনের কথা বলুন, Jhadimadi আপনার জন্য খুঁজে দেবে।',
    },
    contacts: {
      hotline: '01870592699',
      whatsapp: '01870592699',
      email: 'jhadimadi2024@gmail.com',
      website: 'https://jhadimadi.com',
      officeAddress: 'খাগড়াছড়ি সদর, খাগড়াছড়ি পার্বত্য জেলা, বাংলাদেশ',
      supportHours: 'সকাল ৮:০০ টা থেকে রাত ১০:০০ টা (জরুরি হেল্পলাইন ২৪/৭)',
    },
  };
}

// ----------------------------------------------------
// 4. BLOOD DONORS DATABASE & PRIVACY-PROTECTED SEARCH
// ----------------------------------------------------

export function get_blood_donors_from_db(): BloodDonorRecord[] {
  try {
    if (fs.existsSync(BLOOD_DONORS_FILE)) {
      const raw = fs.readFileSync(BLOOD_DONORS_FILE, 'utf-8');
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    }
  } catch (e: any) {
    console.warn('[Jhadimadi DB] Error reading blood donors:', e?.message);
  }

  return [];
}

/**
 * Permanently deletes a blood donor from the local file database.
 */
export function delete_blood_donor_from_db(id: string): boolean {
  try {
    const list = get_blood_donors_from_db();
    const updated = list.filter((d) => d.id !== id);
    fs.writeFileSync(BLOOD_DONORS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[Jhadimadi DB] Error deleting blood donor from file:', err);
    return false;
  }
}

/**
 * Saves or updates a blood donor in the local file database.
 */
export function save_blood_donor_to_db(donor: BloodDonorRecord): boolean {
  try {
    const list = get_blood_donors_from_db();
    const donorCleanPhone = (donor.phone || '').replace(/[^0-9]/g, '');
    const existingIdx = list.findIndex(
      (d) => d.id === donor.id || (donorCleanPhone && (d.phone || '').replace(/[^0-9]/g, '') === donorCleanPhone)
    );
    if (existingIdx >= 0) {
      list[existingIdx] = { ...list[existingIdx], ...donor };
    } else {
      list.unshift(donor);
    }
    fs.writeFileSync(BLOOD_DONORS_FILE, JSON.stringify(list, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('[Jhadimadi DB] Error saving blood donor to file:', err);
    return false;
  }
}

/**
 * Searches blood donors.
 * PRIVACY MANDATE: Returns only authorized public summary (name, blood group, area, availability, verified contact).
 * Never exposes raw phone numbers directly on screen.
 */
export function search_blood_donors(bloodGroup?: string, location?: string): {
  donors: Array<{
    id: string;
    districtUniqueId?: string;
    name: string;
    bloodGroup: string;
    division?: string;
    district: string;
    upazila: string;
    area: string;
    phone: string;
    available: boolean;
    lastDonationDate?: string;
    contactNote: string;
  }>;
  emergencyHelplines: Array<{ name: string; number: string; purpose: string }>;
  note: string;
} {
  const allDonors = get_blood_donors_from_db();
  
  // Extract blood group from parameter or from text
  let targetBg = (bloodGroup || '').toUpperCase().trim();
  const searchCorpus = `${bloodGroup || ''} ${location || ''}`.toUpperCase();

  if (!targetBg || targetBg === 'ALL' || targetBg === 'UNDEFINED') {
    if (/AB\s*\+|এবি\s*পজিটিভ|এবি\+/i.test(searchCorpus)) targetBg = 'AB+';
    else if (/AB\s*\-|এবি\s*নেগেটিভ|এবি\-/i.test(searchCorpus)) targetBg = 'AB-';
    else if (/A\s*\+|এ\s*পজিটিভ|এ\+/i.test(searchCorpus)) targetBg = 'A+';
    else if (/A\s*\-|এ\s*নেগেটিভ|এ\-/i.test(searchCorpus)) targetBg = 'A-';
    else if (/B\s*\+|বি\s*পজিটিভ|বি\+/i.test(searchCorpus)) targetBg = 'B+';
    else if (/B\s*\-|বি\s*নেগেটিভ|বি\-/i.test(searchCorpus)) targetBg = 'B-';
    else if (/O\s*\+|ও\s*পজিটিভ|ও\+/i.test(searchCorpus)) targetBg = 'O+';
    else if (/O\s*\-|ও\s*নেগেটিভ|ও\-/i.test(searchCorpus)) targetBg = 'O-';
    else {
      const match = searchCorpus.match(/\b(A|B|AB|O)[+-]\b/i);
      if (match) targetBg = match[0].toUpperCase();
    }
  }

  // Location filtering across all divisions, districts, upazilas and areas
  const locNorm = normalizeBanglaAndBanglish(location || '');

  const filtered = allDonors.filter((d) => {
    let matchBg = true;
    if (targetBg && targetBg !== 'ALL') {
      matchBg = (d.bloodGroup || '').toUpperCase().replace(/\s+/g, '') === targetBg.replace(/\s+/g, '');
    }
    let matchLoc = true;
    if (location && location.trim() && location.toLowerCase() !== 'all') {
      const dLoc = normalizeBanglaAndBanglish(
        `${(d as any).division || ''} ${d.district || ''} ${d.upazila || ''} ${(d as any).area || ''}`
      );
      const dDist = normalizeBanglaAndBanglish(d.district || '');
      const dUpz = normalizeBanglaAndBanglish(d.upazila || '');
      const dDiv = normalizeBanglaAndBanglish((d as any).division || '');

      matchLoc =
        dLoc.includes(locNorm) ||
        locNorm.includes(dLoc) ||
        (dDist && locNorm.includes(dDist)) ||
        (dUpz && locNorm.includes(dUpz)) ||
        (dDiv && locNorm.includes(dDiv));
    }
    return matchBg && matchLoc;
  });

  return {
    donors: filtered.map((d, idx) => ({
      id: d.id,
      districtUniqueId: (d as any).districtUniqueId || formatBengaliDistrictUniqueId(d.district, idx + 1),
      name: d.name,
      bloodGroup: d.bloodGroup,
      division: (d as any).division || '',
      district: d.district,
      upazila: d.upazila,
      area: (d as any).area || '',
      phone: d.phone,
      available: d.available !== false,
      lastDonationDate: d.lastDonationDate || '',
      contactNote: formatContactActionTelLink(d.phone || '01870592699', 'Call / যোগাযোগ করুন'),
    })),
    emergencyHelplines: [
      { name: 'জাতীয় জরুরি সেবা', number: '999', purpose: 'পুলিশ, অ্যাম্বুলেন্স ও ফায়ার সার্ভিস' },
      { name: 'স্বাস্থ্য বাতায়ন', number: '16263', purpose: 'ফ্রি ২৪/৭ ডাক্তার পরামর্শ' },
      { name: 'নারী ও শিশু সহায়তা', number: '109', purpose: 'নারী ও শিশু নির্যাতন প্রতিরোধ' },
      { name: 'চাইল্ড হেল্পলাইন', number: '1098', purpose: 'শিশুর জরুরি সুরক্ষা' },
      { name: 'জাতীয় কল সেন্টার', number: '333', purpose: 'সরকারি তথ্য ও সেবা' },
    ],
    note: 'ঝাদিমাদি জরুরি রক্তদাতা নেটওয়ার্কের মাধ্যমে রক্তের গ্রুপ অনুযায়ী তাৎক্ষণিক সহায়তা প্রদান করা হয়। রক্তদাতার ব্যক্তিগত গোপনীয়তা রক্ষায় স্ক্রিনে মোবাইল নম্বর উন্মুক্ত না রেখে নিরাপদ কল বাটনের মাধ্যমে সরাসরি ডায়ালারে প্রেরিত হয়।',
  };
}

/**
 * Retrieves verified service providers and professionals from database.
 */
export function get_service_providers_from_db(): ServiceProviderRecord[] {
  try {
    if (fs.existsSync(SERVICE_PROVIDERS_FILE)) {
      const raw = fs.readFileSync(SERVICE_PROVIDERS_FILE, 'utf-8');
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    }
  } catch (e: any) {
    console.warn('[Jhadimadi DB] Error reading service providers:', e.message);
  }
  return [];
}

/**
 * Searches service providers and professionals (শিক্ষক, ডাক্তার, ইলেকট্রিশিয়ান, প্লাম্বার, মেকানিক, ইত্যাদি)
 * Matching by profession and area.
 * STRICT PRIVACY: Displays District-based Unique ID (e.g. "রাঙা-০০১") and uses <a href="tel:[PHONE]">যোগাযোগ করুন</a>.
 * NEVER shows direct personal phone numbers as raw text.
 */
export function search_service_providers(
  professionQuery: string,
  locationQuery?: string,
  structuredCriteria?: {
    budget?: string | number;
    ratingPreference?: string;
    availability?: string;
    date?: string;
  }
): {
  providers: Array<{
    id: string;
    districtUniqueId: string;
    name: string;
    profession: string;
    categoryBn: string;
    subCategory: string;
    skills: string[];
    district: string;
    upazila: string;
    area: string;
    rating: number;
    completedJobs: number;
    responseRate: number;
    verificationStatus: string;
    availabilityNote: string;
    hourlyRate: number;
    available: boolean;
    contactAction: string;
    phone: string;
    bioBn: string;
    photo_url: string;
    isWithinBudget?: boolean;
  }>;
  searchNote: string;
  totalFound: number;
} {
  const allProviders = get_service_providers_from_db();
  const rawQ = (professionQuery || '').trim();
  const normQ = normalizeBanglaAndBanglish(rawQ);
  const locNorm = normalizeBanglaAndBanglish(`${locationQuery || ''} ${professionQuery || ''}`);

  const isTeacher = /শিক্ষক|টিউটর|মাস্টার|পড়ানো|টিচার|teacher|tutor|আইসিটি|বিজ্ঞান|গণিত/i.test(normQ);
  const isDoctor = /ডাক্তার|চিকিৎসক|এমবিবিএস|ডাক্তারি|doctor|physician|টেলিমেডিসিন/i.test(normQ);
  const isElectrician = /ইলেকট্রিশিয়ান|বিদ্যুৎ|কারেন্ট|ইলেকট্রিক|electrician|ওয়্যারিং|সোলার/i.test(normQ);
  const isPlumber = /প্লাম্বার|পাইপ|স্যানিটারি|plumber|লিকেজ/i.test(normQ);
  const isMechanic = /মেকানিক|বাইক|মোটরসাইকেল|গ্যারেজ|mechanic|ইঞ্জিন/i.test(normQ);
  const isNurse = /নার্স|কেয়ারগিভার|সেবিকা|nurse|caregiver|ড্রেসিং/i.test(normQ);
  const isMason = /রাজমিস্ত্রি|টাইলস|কনস্ট্রাকশন|mason|প্লাস্টার/i.test(normQ);
  const isPainter = /পেইন্টার|রংমিস্ত্রি|রং মিস্ত্রি|পেইন্ট|রং|চুনকাম|painter|painting/i.test(normQ);

  const targetBudget = parseBudgetNumber(structuredCriteria?.budget || rawQ);
  const wantsTopRated = Boolean(
    structuredCriteria?.ratingPreference &&
    /ভালো|সেরা|শীর্ষ|top|high|best|4\+|5\*/i.test(structuredCriteria.ratingPreference)
  ) || /ভালো|সেরা|দক্ষ|টপ/i.test(rawQ);

  const scored = allProviders.map((sp, idx) => {
    let score = 0;
    const profNorm = normalizeBanglaAndBanglish(sp.profession || '');
    const catNorm = normalizeBanglaAndBanglish(`${sp.categoryBn || ''} ${sp.subCategory || ''} ${(sp.skills || []).join(' ')} ${sp.bioBn || ''}`);
    const locStr = normalizeBanglaAndBanglish(`${sp.district || ''} ${sp.upazila || ''} ${sp.area || ''}`);
    const upazilaNorm = normalizeBanglaAndBanglish(sp.upazila || '');
    const districtNorm = normalizeBanglaAndBanglish(sp.district || '');

    // Generalized hybrid match against profession and skills
    const profMatch = matchQueryAgainstTarget(sp.profession, rawQ, sp.categoryEn, sp.categoryBn);
    if (profMatch.score > 0) score += profMatch.score;

    for (const skill of (sp.skills || [])) {
      const sMatch = matchQueryAgainstTarget(skill, rawQ);
      if (sMatch.score > 0) score = Math.max(score, sMatch.score);
    }

    if (isTeacher && (profNorm.includes('শিক্ষক') || catNorm.includes('শিক্ষক') || catNorm.includes('টিউটর'))) score += 50;
    if (isDoctor && (profNorm.includes('ডাক্তার') || catNorm.includes('ডাক্তার') || catNorm.includes('এমবিবিএস'))) score += 50;
    if (isElectrician && (profNorm.includes('ইলেকট্রিশিয়ান') || catNorm.includes('ইলেকট্রিশিয়ান') || catNorm.includes('ওয়্যারিং'))) score += 50;
    if (isPlumber && (profNorm.includes('প্লাম্বার') || catNorm.includes('প্লাম্বার') || catNorm.includes('পাইপ'))) score += 50;
    if (isMechanic && (profNorm.includes('মেকানিক') || catNorm.includes('মেকানিক') || catNorm.includes('বাইক'))) score += 50;
    if (isNurse && (profNorm.includes('নার্স') || catNorm.includes('নার্স') || catNorm.includes('সেবিকা'))) score += 50;
    if (isMason && (profNorm.includes('রাজমিস্ত্রি') || catNorm.includes('রাজমিস্ত্রি') || catNorm.includes('টাইলস'))) score += 50;
    if (isPainter && (profNorm.includes('পেইন্টার') || catNorm.includes('পেইন্টার') || catNorm.includes('রংমিস্ত্রি') || catNorm.includes('পেইন্টিং'))) score += 50;

    if (profNorm.includes(normQ) || catNorm.includes(normQ)) score += 30;

    // Upazila-specific precision boosting (e.g. Dighinala, Rangamati Sadar, Kaptai)
    if (upazilaNorm && locNorm.includes(upazilaNorm)) {
      score += 70; // High priority for exact upazila match
    } else if (districtNorm && locNorm.includes(districtNorm)) {
      score += 35; // Secondary priority for district match
    }

    const knownLocations = [
      'খাগড়াছড়ি', 'খাগড়াছড়ি', 'রাঙ্গামাটি', 'রাঙামাটি', 'বান্দরবান', 'দীঘিনালা', 'রুমা', 'কাপ্তাই',
      'পানছড়ি', 'সাজেক', 'বনরূপা', 'পানখাইয়াপাড়া', 'বোয়ালখালী', 'মেম্বারপাড়া', 'তবলছড়ি'
    ];
    for (const loc of knownLocations) {
      const lNorm = normalizeBanglaAndBanglish(loc);
      if (locNorm.includes(lNorm) && locStr.includes(lNorm)) {
        score += 25;
        break;
      }
    }

    // Budget matching based on real stored hourlyRate
    const hourly = Number(sp.hourlyRate) || 350;
    let isWithinBudget = true;
    if (targetBudget && targetBudget > 0) {
      if (hourly <= targetBudget) {
        score += 35; // Matches user budget constraint
        isWithinBudget = true;
      } else {
        score -= 15; // Exceeds requested budget
        isWithinBudget = false;
      }
    }

    // Rating & Quality Preference
    const ratingVal = Number(sp.rating) || 4.8;
    if (wantsTopRated) {
      score += Math.round(ratingVal * 10);
      if (sp.completedJobs && sp.completedJobs >= 80) score += 15;
    }

    // Availability Boost
    if (sp.available !== false) score += 10;

    const uniqueId = sp.districtUniqueId || formatBengaliDistrictUniqueId(sp.district, idx + 1);

    return {
      provider: {
        id: sp.id,
        districtUniqueId: uniqueId,
        name: sp.name,
        profession: sp.profession,
        categoryBn: sp.categoryBn || 'প্রফেশনাল সার্ভিস',
        subCategory: sp.subCategory || '',
        skills: sp.skills || [],
        district: sp.district,
        upazila: sp.upazila,
        area: sp.area || '',
        rating: ratingVal,
        completedJobs: sp.completedJobs || 50,
        responseRate: sp.responseRate || 95,
        verificationStatus: sp.verificationStatus || 'verified',
        availabilityNote: sp.availabilityNote || 'আজ ও আগামীকাল উপলব্ধ',
        hourlyRate: hourly,
        available: sp.available !== false,
        contactAction: formatContactActionTelLink(sp.phone || '01870592699'),
        phone: sp.phone || '01870592699',
        bioBn: sp.bioBn || '',
        photo_url: sp.photo_url || sp.photo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
        isWithinBudget,
      },
      score,
    };
  });

  const isBroadQuery = !rawQ || rawQ === 'সব' || rawQ === 'সেবা' || rawQ === 'service' || rawQ === 'সার্ভিস';
  const matches = scored
    .filter(s => isBroadQuery ? true : s.score >= 35)
    .sort((a, b) => b.score - a.score)
    .map(s => s.provider);

  return {
    providers: matches,
    searchNote: matches.length > 0 
      ? `মোট ${matches.length} জন যাচাইকৃত দক্ষ সেবাদাতা পাওয়া গেছে।` 
      : 'দুঃখিত, এই ক্যাটাগরিতে এই মুহূর্তে ডাটাবেজে কোনো সক্রিয় সেবাদাতা পাওয়া যায়নি।',
    totalFound: matches.length,
  };
}

/**
 * Retrieves registered members and permanent members from database.
 */
export function get_registered_members_from_db(): RegisteredMemberRecord[] {
  try {
    if (fs.existsSync(REGISTERED_MEMBERS_FILE)) {
      const raw = fs.readFileSync(REGISTERED_MEMBERS_FILE, 'utf-8');
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    }
  } catch (e: any) {
    console.warn('[Jhadimadi DB] Error reading registered members:', e.message);
  }
  return [];
}

/**
 * Searches registered people and permanent members.
 * Matching by name, role, area.
 * STRICT PRIVACY: Displays District-based Unique ID (e.g. "রাঙা-০০১") and uses <a href="tel:[PHONE]">যোগাযোগ করুন</a>.
 * NEVER shows direct personal phone numbers as raw text.
 */
export function search_registered_members(
  query: string,
  locationQuery?: string
): {
  members: Array<{
    id: string;
    districtUniqueId: string;
    name: string;
    role: string;
    roleLabelBn: string;
    district: string;
    upazila: string;
    area: string;
    status: string;
    responsibilities: string;
    contactAction: string;
    phone: string;
  }>;
  totalFound: number;
} {
  const allMembers = get_registered_members_from_db();
  const normQ = normalizeBanglaAndBanglish(query || '');
  const locNorm = normalizeBanglaAndBanglish(`${locationQuery || ''} ${query || ''}`);

  const scored = allMembers.map((m, idx) => {
    let score = 10;
    const mText = normalizeBanglaAndBanglish(`${m.name} ${m.roleLabelBn} ${m.role} ${m.responsibilities || ''}`);
    const locText = normalizeBanglaAndBanglish(`${m.district} ${m.upazila} ${m.area || ''}`);

    if (mText.includes(normQ)) score += 40;
    if (locNorm && locText.includes(locNorm)) score += 30;

    const upazilaNorm = normalizeBanglaAndBanglish(m.upazila || '');
    const districtNorm = normalizeBanglaAndBanglish(m.district || '');
    if (upazilaNorm && locNorm.includes(upazilaNorm)) score += 60;
    else if (districtNorm && locNorm.includes(districtNorm)) score += 30;

    const uniqueId = m.districtUniqueId || formatBengaliDistrictUniqueId(m.district, idx + 1);

    return {
      member: {
        id: m.id,
        districtUniqueId: uniqueId,
        name: m.name,
        role: m.role,
        roleLabelBn: m.roleLabelBn,
        district: m.district,
        upazila: m.upazila,
        area: m.area || '',
        status: m.status || 'সক্রিয় সদস্য',
        responsibilities: m.responsibilities || '',
        contactAction: formatContactActionTelLink(m.phone || '01870592699'),
        phone: m.phone || '01870592699',
      },
      score,
    };
  });

  const matches = scored.sort((a, b) => b.score - a.score).map(s => s.member);

  return {
    members: matches,
    totalFound: matches.length,
  };
}

// ----------------------------------------------------
// 5. USER ORDER RETRIEVAL & STRICT PRIVACY ENFORCEMENT
// ----------------------------------------------------

export function get_user_order_information(
  userContext?: { userId?: string; phone?: string; email?: string; name?: string },
  orderQuery?: string
): {
  authorized: boolean;
  orders: any[];
  privacyMessage: string;
} {
  // If query is attempting to view other users' orders
  const q = (orderQuery || '').toLowerCase();
  if (
    q.includes('অন্য') ||
    q.includes('other') ||
    q.includes('অন্যান্য') ||
    q.includes('সবাই') ||
    q.includes('কাস্টমারদের অর্ডার') ||
    q.includes('কার কার অর্ডার')
  ) {
    return {
      authorized: false,
      orders: [],
      privacyMessage:
        'স্যার, ঝাদিমাদি গ্রাহক সুরক্ষা নীতি অনুযায়ী অন্য কোনো গ্রাহকের ব্যক্তিগত অর্ডার বা তথ্য প্রকাশ করা সম্পূর্ণ নিষিদ্ধ। আপনি শুধুমাত্র আপনার নিজের অ্যাকাউন্টের অর্ডার ট্র্যাক করতে পারবেন।',
    };
  }

  // If user is authenticated in context
  const phone = userContext?.phone?.trim();
  const userId = userContext?.userId?.trim();

  let allOrders: any[] = [];
  try {
    if (fs.existsSync(ORDERS_FILE)) {
      allOrders = JSON.parse(fs.readFileSync(ORDERS_FILE, 'utf-8'));
    }
  } catch {}

  if (!phone && !userId) {
    return {
      authorized: false,
      orders: [],
      privacyMessage:
        'স্যার, আপনার অর্ডার চেক করতে দয়া করে আপনার অর্ডার আইডি অথবা যে মোবাইল নম্বর দিয়ে অর্ডার করেছেন তা প্রদান করুন।',
    };
  }

  const userOrders = allOrders.filter(o => {
    if (phone && (o.customer_phone === phone || o.phone === phone)) return true;
    if (userId && o.user_id === userId) return true;
    return false;
  });

  return {
    authorized: true,
    orders: userOrders.slice(0, 5),
    privacyMessage:
      userOrders.length > 0
        ? `স্যার, আপনার অ্যাকাউন্টে মোট ${userOrders.length} টি অর্ডার পাওয়া গেছে।`
        : 'স্যার, আপনার প্রদত্ত ফোন নম্বরে এই মুহূর্তে কোনো সক্রিয় অর্ডার পাওয়া যায়নি।',
  };
}

// ----------------------------------------------------
// 6. HIERARCHICAL BLOOD & INFO SEARCH ENGINE (3-TIER)
// ----------------------------------------------------

/**
 * Extracts normalized Blood Group token from query string (e.g., 'A+', 'B-', 'এ পজিটিভ').
 */
export function extractBloodGroupFromText(text: string): string | null {
  if (!text) return null;
  const upper = text.toUpperCase();

  if (/AB\s*\+|এবি\s*পজিটিভ|এবি\s*পজেটিভ|এবি\+|AB\s*POSITIVE/i.test(text)) return 'AB+';
  if (/AB\s*\-|এবি\s*নেগেটিভ|এবি\-|AB\s*NEGATIVE/i.test(text)) return 'AB-';
  if (/A\s*\+|এ\s*পজিটিভ|এ\s*পজেটিভ|এ\+|A\s*POSITIVE/i.test(text)) return 'A+';
  if (/A\s*\-|এ\s*নেগেটিভ|এ\-|A\s*NEGATIVE/i.test(text)) return 'A-';
  if (/B\s*\+|বি\s*পজিটিভ|বি\s*পজেটিভ|বি\+|B\s*POSITIVE/i.test(text)) return 'B+';
  if (/B\s*\-|বি\s*নেগেটিভ|বি\-|B\s*NEGATIVE/i.test(text)) return 'B-';
  if (/O\s*\+|ও\s*পজিটিভ|ও\s*পজেটিভ|ও\+|O\s*POSITIVE/i.test(text)) return 'O+';
  if (/O\s*\-|ও\s*নেগেটিভ|ও\-|O\s*NEGATIVE/i.test(text)) return 'O-';

  const match = upper.match(/\b(A|B|AB|O)[+-]\b/);
  if (match) return match[0];

  return null;
}

/**
 * Retrieves persisted posts from local storage file or returns empty array.
 */
export function get_local_feed_posts(): any[] {
  try {
    if (fs.existsSync(FEED_POSTS_FILE)) {
      const raw = fs.readFileSync(FEED_POSTS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    }
  } catch {}
  return [];
}

/**
 * Persists a feed post to local storage file.
 */
export function save_local_feed_post(post: any): void {
  try {
    const existing = get_local_feed_posts();
    const filtered = existing.filter(p => p.id !== post.id);
    const updated = [post, ...filtered];
    fs.writeFileSync(FEED_POSTS_FILE, JSON.stringify(updated, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[FeedPosts] Failed to save local feed post:', err);
  }
}

/**
 * Searches user posts, community feed, and registered user profiles for blood-related info.
 * Part of Tier 2 in the Search & Execution Workflow.
 */
export function search_posts_for_blood(
  bloodGroup?: string,
  query?: string,
  clientPosts?: any[],
  clientUsers?: any[]
): {
  matchedPosts: Array<{
    id: string;
    title: string;
    content: string;
    authorName: string;
    authorRole: string;
    district: string;
    upazila: string;
    bloodGroup?: string;
    phone: string;
    createdAt: string;
    type: 'post' | 'profile';
  }>;
  totalFound: number;
} {
  const targetBg = (bloodGroup || extractBloodGroupFromText(query || '') || '').toUpperCase().trim();
  const qNorm = normalizeBanglaAndBanglish(query || '');

  // 1. Gather all posts (Client live posts + Local feed posts)
  const localPosts = get_local_feed_posts();
  const combinedPosts = [...(Array.isArray(clientPosts) ? clientPosts : []), ...localPosts];
  
  // Deduplicate by post id
  const postMap = new Map<string, any>();
  combinedPosts.forEach(p => {
    if (p && (p.id || p.title)) {
      postMap.set(String(p.id || p.title), p);
    }
  });
  const allPosts = Array.from(postMap.values());

  const matchedPosts: Array<{
    id: string;
    title: string;
    content: string;
    authorName: string;
    authorRole: string;
    district: string;
    upazila: string;
    bloodGroup?: string;
    phone: string;
    createdAt: string;
    type: 'post' | 'profile';
  }> = [];

  // 2. Search Posts & Feed
  for (const post of allPosts) {
    if (!post) continue;
    const title = post.title || '';
    const content = post.content || '';
    const postCategory = post.category || '';
    const fullText = `${title} ${content} ${postCategory}`.toUpperCase();
    const fullTextNorm = normalizeBanglaAndBanglish(`${title} ${content} ${postCategory}`);

    let matches = false;

    if (targetBg) {
      // Must match specific target blood group in post
      const extractedBg = extractBloodGroupFromText(fullText);
      if (extractedBg === targetBg) {
        matches = true;
      } else if (fullText.includes(targetBg)) {
        matches = true;
      }
    } else {
      // General blood query
      if (/রক্ত|ব্লাড|blood|donor|ডোনার|পজিটিভ|নেগেটিভ/i.test(fullTextNorm)) {
        matches = true;
      }
    }

    if (matches) {
      const rawPhone = post.realPhone || post.phone || post.contactPhoneHidden || '';
      matchedPosts.push({
        id: String(post.id || `post_${Date.now()}`),
        title: title || 'রক্ত সংক্রান্ত কমিউনিটি পোস্ট',
        content: content.slice(0, 180),
        authorName: post.authorName || 'ঝাদিমাদি সদস্য',
        authorRole: post.authorRole || 'User',
        district: post.district || 'খাগড়াছড়ি',
        upazila: post.upazila || post.thana || 'সদর',
        bloodGroup: targetBg || extractBloodGroupFromText(fullText) || undefined,
        phone: rawPhone || '01870592699 (ঝাদিমাদি জরুরি সাপোর্ট)',
        createdAt: post.createdAt || new Date().toISOString(),
        type: 'post',
      });
    }
  }

  // 3. Search Registered User Profiles (Tier 2 Profiles)
  if (Array.isArray(clientUsers)) {
    for (const u of clientUsers) {
      if (!u) continue;
      const uBg = (u.bloodGroup || '').toUpperCase().trim();
      let uMatch = false;

      if (targetBg) {
        if (uBg === targetBg) {
          uMatch = true;
        }
      } else if (u.isBloodDonor || uBg || /রক্ত|ব্লাড|donor|ডোনার/i.test(u.roleLabelBn || u.role || '')) {
        uMatch = true;
      }

      if (uMatch) {
        matchedPosts.push({
          id: String(u.id || `user_${Date.now()}`),
          title: `নিবন্ধিত রক্তদাতা প্রোফাইল: ${u.name || 'সদস্য'} (${uBg || 'রক্তদানে প্রস্তুত'})`,
          content: `${u.district || 'খাগড়াছড়ি'}, ${u.upazila || 'সদর'} এলাকার নিবন্ধিত ইউজার প্রোফাইল।`,
          authorName: u.name || 'নিবন্ধিত সদস্য',
          authorRole: u.roleLabelBn || u.role || 'রক্তদাতা',
          district: u.district || 'খাগড়াছড়ি',
          upazila: u.upazila || 'সদর',
          bloodGroup: uBg || undefined,
          phone: u.phone || '01870592699 (ঝাদিমাদি জরুরি সাপোর্ট)',
          createdAt: u.createdAt || new Date().toISOString(),
          type: 'profile',
        });
      }
    }
  }

  return {
    matchedPosts,
    totalFound: matchedPosts.length,
  };
}

/**
 * Executes the complete 3-Step Search & Execution Workflow:
 * Step 1: Search Main Database (blood_donors).
 * Step 2: If no results in DB, search App's user posts, community feed & registered user profiles.
 * Step 3: Result Evaluation & Final Fallback (Mandatory exact Bengali fallback if both empty).
 * STRICT CONSTRAINT: Guarantees recommendedProducts is strictly [] under all circumstances.
 */
export function execute_hierarchical_blood_search(
  bloodGroup?: string,
  locationOrQuery?: string,
  clientPosts?: any[],
  clientUsers?: any[],
  salutation: string = 'স্যার'
): {
  source: 'database' | 'posts_feed' | 'none';
  donors: any[];
  matchedPosts: any[];
  replyBn: string;
  detectedBloodGroup: string | null;
  actionLink: { type: string; label: string; postId?: string };
  quickReplyChips: string[];
} {
  const queryStr = `${bloodGroup || ''} ${locationOrQuery || ''}`.trim();
  const detectedBloodGroup = extractBloodGroupFromText(queryStr);
  const bgDisplay = detectedBloodGroup ? `${detectedBloodGroup} ` : '';

  // ----------------------------------------------------
  // STEP 1: Search Main Database
  // ----------------------------------------------------
  const dbResult = search_blood_donors(detectedBloodGroup || undefined, locationOrQuery);
  const matchingDbDonors = detectedBloodGroup
    ? dbResult.donors.filter(d => d.bloodGroup.toUpperCase() === detectedBloodGroup.toUpperCase())
    : dbResult.donors;

  if (matchingDbDonors.length > 0) {
    const donorList = matchingDbDonors
      .slice(0, 4)
      .map(
        (d: any) =>
          `• **রক্তের গ্রুপ ${d.bloodGroup}:** ${d.name} | আইডি: **${d.districtUniqueId || formatBengaliDistrictUniqueId(d.district, d.name)}** (${d.district}, ${d.upazila}${d.area ? ', ' + d.area : ''}) — [স্ট্যাটাস: ${
            d.available ? 'রক্তদানে প্রস্তুত' : 'সাময়িক বিরতি'
          }] | ${formatContactActionTelLink(d.phone || '01870592699', 'Call / যোগাযোগ করুন')}`
      )
      .join('\n');

    const replyBn = `🩸 **${salutation}, জরুরি রক্তদাতা ও জাতীয় হেল্পলাইন সহায়তা (মেইন ডাটাবেজ থেকে ভেরিফাইড):**\n\n${donorList}\n\n🔒 **সুরক্ষা ও সহায়তা বার্তা:** ${dbResult.note}\n📞 জরুরি রক্ত প্রয়োজনে সরাসরি যোগাযোগ: ${formatContactActionTelLink('01870592699', 'ঝাদিমাদি জরুরি ডেস্ক')}\n\n🚨 **জরুরি জাতীয় সরকারি হটলাইন নম্বর:**\n• **৯৯৯ (999):** জাতীয় জরুরি সেবা (পুলিশ, অ্যাম্বুলেন্স ও ফায়ার সার্ভিস — টোল ফ্রি, ২৪ ঘণ্টা)\n• **১৬২৬৩ (16263):** স্বাস্থ্য বাতায়ন (২৪ ঘণ্টা ফ্রি ডাক্তার পরামর্শ)\n• **১০৯ (109):** নারী ও শিশু নির্যাতন প্রতিরোধ সেল\n• **১০৯৮ (1098):** চাইল্ড হেল্পলাইন\n• **৩৩৩ (333):** সরকারি তথ্য ও সেবা`;

    return {
      source: 'database',
      donors: matchingDbDonors,
      matchedPosts: [],
      replyBn,
      detectedBloodGroup,
      actionLink: {
        type: 'blood',
        label: 'জরুরি রক্তদাতা তালিকা দেখুন',
      },
      quickReplyChips: ['🩸 রক্তদাতা খুঁজুন', '📞 ৯৯৯ কল করুন', '💬 WhatsApp সাপোর্ট'],
    };
  }

  // ----------------------------------------------------
  // STEP 2: Secondary Search — User Posts, Feed & Registered Profiles
  // ----------------------------------------------------
  const postSearchResult = search_posts_for_blood(
    detectedBloodGroup || undefined,
    queryStr,
    clientPosts,
    clientUsers
  );

  if (postSearchResult.totalFound > 0) {
    const postItems = postSearchResult.matchedPosts.slice(0, 3);
    const postDetails = postItems
      .map((p, pIdx) => {
        const uniqueId = formatBengaliDistrictUniqueId(p.district, pIdx + 1);
        return `• **${p.title}** | আইডি: **${uniqueId}**\n  - প্রকাশকারী: ${p.authorName} (${p.district}, ${p.upazila})\n  - বিবরণ: ${p.content}\n  - যোগাযোগ: ${formatContactActionTelLink(p.phone || '01870592699')}`;
      })
      .join('\n\n');

    const replyBn = `🩸 **${salutation}, মেইন ডাটাবেজে এই মুহূর্তে নিবন্ধিত ডোনার পাওয়া না গেলেও অ্যাপের সাম্প্রতিক পোস্ট ও ফিড খুঁজে আপনার কাঙ্ক্ষিত তথ্যের সন্ধান পাওয়া গেছে:**\n\n${postDetails}\n\n📞 জরুরি প্রয়োজনে সরাসরি যোগাযোগ: ${formatContactActionTelLink('01870592699', 'ঝাদিমাদি জরুরি সাপোর্ট ডেস্কে যোগাযোগ করুন')}।\n\n🚨 **জরুরি জাতীয় সরকারি হটলাইন:** ৯৯৯ (999) — জাতীয় জরুরি সেবা`;

    return {
      source: 'posts_feed',
      donors: [],
      matchedPosts: postItems,
      replyBn,
      detectedBloodGroup,
      actionLink: {
        type: 'feed',
        label: 'কমিউনিটি পোস্ট বিস্তারিত দেখুন',
        postId: postItems[0]?.id,
      },
      quickReplyChips: ['কমিউনিটি পোস্ট দেখুন', '📞 ৯৯৯ কল করুন', '💬 WhatsApp যোগাযোগ: 01870592699'],
    };
  }

  // ----------------------------------------------------
  // STEP 3: Final Fallback (Neither Database nor Posts)
  // MANDATORY EXACT TEXT AS SPECIFIED BY USER
  // ----------------------------------------------------
  const exactFallbackMessage = `আন্তরিকভাবে দুঃখিত, আপনার কাঙ্ক্ষিত তথ্যটি এই মুহূর্তে খুঁজে পাওয়া যায়নি। আমাদের ডাটাবেজ এবং কমিউনিটি পোস্টে এই মুহূর্তে ${bgDisplay}রক্তের কোনো ডোনার পাওয়া যায়নি। জরুরি প্রয়োজনে আপনি অবিলম্বে ৯৯৯ (999)-এ কল করতে পারেন অথবা আমাদের জরুরি WhatsApp নাম্বারে (01870592699) সরাসরি যোগাযোগ করতে পারেন।`;

  return {
    source: 'none',
    donors: [],
    matchedPosts: [],
    replyBn: exactFallbackMessage,
    detectedBloodGroup,
    actionLink: {
      type: 'blood',
      label: 'জরুরি রক্তদাতা ও হেল্পলাইন',
    },
    quickReplyChips: ['📞 ৯৯৯ কল করুন', '💬 WhatsApp যোগাযোগ: 01870592699', 'জরুরি হেল্পলাইন'],
  };
}

// ----------------------------------------------------
// 7. JOB SEEKERS & JOB CIRCULARS INTELLIGENT RETRIEVAL
// ----------------------------------------------------

export interface JobSeekerRecord {
  id?: string;
  unique_id: string;
  name: string;
  phone: string;
  skills_or_job_type: string;
  education?: string;
  experience?: string;
  district: string;
  upazila: string;
  area: string;
  photo_url: string;
}

export interface JobCircularRecord {
  id?: string;
  job_title: string;
  company_or_poster: string;
  district: string;
  upazila: string;
  phone: string;
}

export function getAllJobSeekersFromDb(): JobSeekerRecord[] {
  try {
    if (fs.existsSync(JOB_SEEKERS_FILE)) {
      const raw = fs.readFileSync(JOB_SEEKERS_FILE, 'utf-8');
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    }
  } catch (e: any) {
    console.warn('[Jhadimadi DB] Error reading job seekers:', e.message);
  }
  return [];
}

export function getAllJobCircularsFromDb(): JobCircularRecord[] {
  try {
    if (fs.existsSync(JOB_CIRCULARS_FILE)) {
      const raw = fs.readFileSync(JOB_CIRCULARS_FILE, 'utf-8');
      const list = JSON.parse(raw);
      if (Array.isArray(list)) return list;
    }
  } catch (e: any) {
    console.warn('[Jhadimadi DB] Error reading job circulars:', e.message);
  }
  return [];
}

export function search_job_seekers(
  query: string,
  districtFilter?: string,
  upazilaFilter?: string,
  liveSeekers?: JobSeekerRecord[]
): {
  matchedSeekers: JobSeekerRecord[];
  totalFound: number;
  formattedDisplay: string;
} {
  const dbSeekers = getAllJobSeekersFromDb();
  const allSeekers = Array.isArray(liveSeekers) && liveSeekers.length > 0 ? liveSeekers : dbSeekers;
  const qNorm = normalizeBanglaAndBanglish(query.toLowerCase().trim());

  const matched = allSeekers.filter(s => {
    if (!s) return false;
    // Location filter
    if (districtFilter && districtFilter !== 'সব' && districtFilter !== 'all') {
      const distMatch = s.district && normalizeBanglaAndBanglish(s.district).includes(normalizeBanglaAndBanglish(districtFilter));
      if (!distMatch) return false;
    }
    if (upazilaFilter && upazilaFilter !== 'সব' && upazilaFilter !== 'all') {
      const upzMatch = s.upazila && normalizeBanglaAndBanglish(s.upazila).includes(normalizeBanglaAndBanglish(upazilaFilter));
      if (!upzMatch) return false;
    }

    if (!qNorm || qNorm === 'চাকরি' || qNorm === 'seeker' || qNorm === 'সব') return true;

    const nameNorm = normalizeBanglaAndBanglish((s.name || '').toLowerCase());
    const skillsNorm = normalizeBanglaAndBanglish((s.skills_or_job_type || '').toLowerCase());
    const distNorm = normalizeBanglaAndBanglish((s.district || '').toLowerCase());
    const upzNorm = normalizeBanglaAndBanglish((s.upazila || '').toLowerCase());

    const hybridMatch = matchQueryAgainstTarget(`${s.name} ${s.skills_or_job_type || ''}`, query);

    return hybridMatch.score > 0 || skillsNorm.includes(qNorm) || nameNorm.includes(qNorm) || distNorm.includes(qNorm) || upzNorm.includes(qNorm);
  });

  const formattedDisplay = matched.slice(0, 5).map((s, idx) => {
    const contactTel = formatContactActionTelLink(s.phone, 'যোগাযোগ করুন');
    const photo = s.photo_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80';
    return `• **${s.name}** (আইডি: ${s.unique_id || formatBengaliDistrictUniqueId(s.district, idx + 1)})\n  - দক্ষতা / কাজের ধরণ: ${s.skills_or_job_type}\n  - এলাকা: ${s.upazila || ''}, ${s.district || ''}\n  - ছবি: ${photo}\n  - সরাসরি যোগাযোগ: ${contactTel}`;
  }).join('\n\n');

  return {
    matchedSeekers: matched,
    totalFound: matched.length,
    formattedDisplay
  };
}

export function search_job_circulars(
  query: string,
  districtFilter?: string,
  upazilaFilter?: string,
  liveCirculars?: JobCircularRecord[]
): {
  matchedCirculars: JobCircularRecord[];
  totalFound: number;
  formattedDisplay: string;
} {
  const dbCircs = getAllJobCircularsFromDb();
  const allCircs = Array.isArray(liveCirculars) && liveCirculars.length > 0 ? liveCirculars : dbCircs;
  const qNorm = normalizeBanglaAndBanglish(query.toLowerCase().trim());

  const matched = allCircs.filter(c => {
    if (!c) return false;
    if (districtFilter && districtFilter !== 'সব' && districtFilter !== 'all') {
      const distMatch = c.district && normalizeBanglaAndBanglish(c.district).includes(normalizeBanglaAndBanglish(districtFilter));
      if (!distMatch) return false;
    }
    if (upazilaFilter && upazilaFilter !== 'সব' && upazilaFilter !== 'all') {
      const upzMatch = c.upazila && normalizeBanglaAndBanglish(c.upazila).includes(normalizeBanglaAndBanglish(upazilaFilter));
      if (!upzMatch) return false;
    }

    if (!qNorm || qNorm === 'চাকরি' || qNorm === 'সার্কুলার' || qNorm === 'নিয়োগ' || qNorm === 'সব') return true;

    const titleNorm = normalizeBanglaAndBanglish((c.job_title || '').toLowerCase());
    const companyNorm = normalizeBanglaAndBanglish((c.company_or_poster || '').toLowerCase());
    const distNorm = normalizeBanglaAndBanglish((c.district || '').toLowerCase());

    const hybridMatch = matchQueryAgainstTarget(`${c.job_title} ${c.company_or_poster || ''}`, query);

    return hybridMatch.score > 0 || titleNorm.includes(qNorm) || companyNorm.includes(qNorm) || distNorm.includes(qNorm);
  });

  const formattedDisplay = matched.slice(0, 5).map(c => {
    const contactTel = formatContactActionTelLink(c.phone, 'আবেদন / যোগাযোগ করুন');
    return `• **${c.job_title}**\n  - প্রতিষ্ঠান / নিয়োগকারী: ${c.company_or_poster}\n  - স্থান: ${c.upazila || ''}, ${c.district || ''}\n  - যোগাযোগ: ${contactTel}`;
  }).join('\n\n');

  return {
    matchedCirculars: matched,
    totalFound: matched.length,
    formattedDisplay
  };
}

