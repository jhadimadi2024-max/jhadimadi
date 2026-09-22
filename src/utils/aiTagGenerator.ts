/**
 * AI-Optimized Search Indexing & Hashtag Generator for Jhadimadi Platform
 * Automatically aggregates structured attributes into search_tags & hashtags for ultra-fast GIN/Full-text retrieval
 */

// District & Upazila Bengali <-> English mapping dictionary
const GEO_MAPPINGS: Record<string, { en: string; bn: string }> = {
  // Districts
  'rangamati': { en: 'Rangamati', bn: 'রাঙ্গামাটি' },
  'রাঙ্গামাটি': { en: 'Rangamati', bn: 'রাঙ্গামাটি' },
  'রাঙামাটি': { en: 'Rangamati', bn: 'রাঙ্গামাটি' },
  'khagrachhari': { en: 'Khagrachari', bn: 'খাগড়াছড়ি' },
  'khagrachari': { en: 'Khagrachari', bn: 'খাগড়াছড়ি' },
  'খাগড়াছড়ি': { en: 'Khagrachari', bn: 'খাগড়াছড়ি' },
  'খাগড়াছড়ি': { en: 'Khagrachari', bn: 'খাগড়াছড়ি' },
  'bandarban': { en: 'Bandarban', bn: 'বান্দরবান' },
  'বান্দরবান': { en: 'Bandarban', bn: 'বান্দরবান' },
  'chittagong': { en: 'Chittagong', bn: 'চট্টগ্রাম' },
  'chattogram': { en: 'Chittagong', bn: 'চট্টগ্রাম' },
  'চট্টগ্রাম': { en: 'Chittagong', bn: 'চট্টগ্রাম' },
  'dhaka': { en: 'Dhaka', bn: 'ঢাকা' },
  'ঢাকা': { en: 'Dhaka', bn: 'ঢাকা' },

  // Upazilas
  'rangamati sadar': { en: 'RangamatiSadar', bn: 'রাঙ্গামাটিসদর' },
  'রাঙ্গামাটি সদর': { en: 'RangamatiSadar', bn: 'রাঙ্গামাটিসদর' },
  'khagrachhari sadar': { en: 'KhagrachariSadar', bn: 'খাগড়াছড়িসদর' },
  'khagrachari sadar': { en: 'KhagrachariSadar', bn: 'খাগড়াছড়িসদর' },
  'খাগড়াছড়ি সদর': { en: 'KhagrachariSadar', bn: 'খাগড়াছড়িসদর' },
  'bandarban sadar': { en: 'BandarbanSadar', bn: 'বান্দরবানসদর' },
  'বান্দরবান সদর': { en: 'BandarbanSadar', bn: 'বান্দরবানসদর' },
  'dighinala': { en: 'Dighinala', bn: 'দীঘিনালা' },
  'দীঘিনালা': { en: 'Dighinala', bn: 'দীঘিনালা' },
  'panchhari': { en: 'Panchhari', bn: 'পানছড়ি' },
  'পানছড়ি': { en: 'Panchhari', bn: 'পানছড়ি' },
  'mahalchhari': { en: 'Mahalchhari', bn: 'মহালছড়ি' },
  'মহালছড়ি': { en: 'Mahalchhari', bn: 'মহালছড়ি' },
  'matiranga': { en: 'Matiranga', bn: 'মাটিরাঙ্গা' },
  'মাটিরাঙ্গা': { en: 'Matiranga', bn: 'মাটিরাঙ্গা' },
  'manikchhari': { en: 'Manikchhari', bn: 'মানিকছড়ি' },
  'মানিকছড়ি': { en: 'Manikchhari', bn: 'মানিকছড়ি' },
  'ramgarh': { en: 'Ramgarh', bn: 'রামগড়' },
  'রামগড়': { en: 'Ramgarh', bn: 'রামগড়' },
  'kaptai': { en: 'Kaptai', bn: 'কাপ্তাই' },
  'কাপ্তাই': { en: 'Kaptai', bn: 'কাপ্তাই' },
  'ruma': { en: 'Ruma', bn: 'রুমা' },
  'রুমা': { en: 'Ruma', bn: 'রুমা' },
  'thanchi': { en: 'Thanchi', bn: 'থানচি' },
  'থানচি': { en: 'Thanchi', bn: 'থানচি' },
  'baghaichhari': { en: 'Baghaichhari', bn: 'বাঘাইছড়ি' },
  'বাঘাইছড়ি': { en: 'Baghaichhari', bn: 'বাঘাইছড়ি' },
  'sajek': { en: 'Sajek', bn: 'সাজেক' },
  'সাজেক': { en: 'Sajek', bn: 'সাজেক' },
};

// Fruit & Agricultural dictionary for AI semantic tagging
const FRUIT_PRODUCE_DICTIONARY: Record<string, { en: string; bn: string; related: string[] }> = {
  'jackfruit': { en: 'Jackfruit', bn: 'কাঁঠাল', related: ['আম_কাঁঠাল', 'WholesaleFruit', 'পাহাড়ি_পণ্য', 'ফলমূল', 'কাঁঠাল'] },
  'কাঁঠাল': { en: 'Jackfruit', bn: 'কাঁঠাল', related: ['আম_কাঁঠাল', 'WholesaleFruit', 'পাহাড়ি_পণ্য', 'ফলমূল', 'Jackfruit'] },
  'mango': { en: 'Mango', bn: 'আম', related: ['আম_কাঁঠাল', 'WholesaleFruit', 'পাহাড়ি_আম', 'ফলমূল', 'রুপালি_আম'] },
  'আম': { en: 'Mango', bn: 'আম', related: ['আম_কাঁঠাল', 'WholesaleFruit', 'পাহাড়ি_আম', 'ফলমূল', 'Mango'] },
  'pineapple': { en: 'Pineapple', bn: 'আনারস', related: ['হানিকুইন', 'পাহাড়ি_আনারস', 'WholesaleFruit', 'ফলমূল'] },
  'আনারস': { en: 'Pineapple', bn: 'আনারস', related: ['হানিকুইন', 'পাহাড়ি_আনারস', 'WholesaleFruit', 'ফলমূল'] },
  'banana': { en: 'Banana', bn: 'কলা', related: ['পাহাড়ি_কলা', 'বাংলা_কলা', 'WholesaleFruit'] },
  'কলা': { en: 'Banana', bn: 'কলা', related: ['পাহাড়ি_কলা', 'বাংলা_কলা', 'WholesaleFruit'] },
  'orange': { en: 'Orange', bn: 'কমলা', related: ['পাহাড়ি_কমলা', 'দার্জিলিং_কমলা', 'WholesaleFruit'] },
  'কমলা': { en: 'Orange', bn: 'কমলা', related: ['পাহাড়ি_কমলা', 'দার্জিলিং_কমলা', 'WholesaleFruit'] },
  'papaya': { en: 'Papaya', bn: 'পেঁপে', related: ['অর্গানিক_পেঁপে', 'পাহাড়ি_পেঁপে'] },
  'পেঁপে': { en: 'Papaya', bn: 'পেঁপে', related: ['অর্গানিক_পেঁপে', 'পাহাড়ি_পেঁপে'] },
  'turmeric': { en: 'Turmeric', bn: 'হলুদ', related: ['পাহাড়ি_হলুদ', 'মসল্লা', 'অর্গানিক'] },
  'হলুদ': { en: 'Turmeric', bn: 'হলুদ', related: ['পাহাড়ি_হলুদ', 'মসল্লা', 'অর্গানিক'] },
  'ginger': { en: 'Ginger', bn: 'আদা', related: ['পাহাড়ি_আদা', 'মসল্লা', 'অর্গানিক'] },
  'আদা': { en: 'Ginger', bn: 'আদা', related: ['পাহাড়ি_আদা', 'মসল্লা', 'অর্গানিক'] },
};

// Helper: formats a string into a clean PascalCase or Underscore hashtag
export function formatHashtag(input: string, isBengali = false): string {
  if (!input) return '';
  let clean = input.trim();
  // Remove existing leading '#'
  clean = clean.replace(/^#+/, '');
  
  if (isBengali || /[\u0980-\u09FF]/.test(clean)) {
    // Bengali hashtag: replace spaces and hyphens with underscores
    clean = clean.replace(/[\s\-+/.,()]+/g, '_').replace(/^_+|_+$/g, '');
    return clean ? `#${clean}` : '';
  }

  // English hashtag: PascalCase, keeping alphanumeric and '+' for blood groups
  clean = clean
    .split(/[\s\-_/.,()]+/)
    .filter(Boolean)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');

  return clean ? `#${clean}` : '';
}

// Clean and deduplicate an array of hashtags
function cleanTagList(tags: (string | undefined | null)[]): string[] {
  const set = new Set<string>();
  for (const tag of tags) {
    if (!tag) continue;
    const formatted = tag.startsWith('#') ? tag : formatHashtag(tag);
    if (formatted && formatted.length > 1) {
      set.add(formatted);
    }
  }
  return Array.from(set);
}

// Helper to resolve geo tags
function extractGeoTags(district?: string, upazila?: string, area?: string): string[] {
  const tags: string[] = [];
  
  if (district) {
    const dLower = district.trim().toLowerCase();
    const map = GEO_MAPPINGS[dLower];
    if (map) {
      tags.push(`#${map.en}`);
      tags.push(`#${map.bn}`);
    } else {
      tags.push(formatHashtag(district));
    }
  }

  if (upazila) {
    const uLower = upazila.trim().toLowerCase();
    const map = GEO_MAPPINGS[uLower];
    if (map) {
      tags.push(`#${map.en}`);
      tags.push(`#${map.bn}`);
    } else {
      // Create compound tag if district exists
      if (district && !upazila.toLowerCase().includes(district.toLowerCase())) {
        tags.push(formatHashtag(`${district} ${upazila}`));
      }
      tags.push(formatHashtag(upazila));
    }
  }

  // Combined district+upazila (e.g. #RangamatiSadar)
  if (district && upazila) {
    const dMap = GEO_MAPPINGS[district.trim().toLowerCase()];
    const uClean = upazila.replace(/district|উপজেলা|সদর|sadar/gi, '').trim();
    if (dMap && uClean) {
      tags.push(`#${dMap.en}${formatHashtag(uClean).replace('#', '')}`);
    }
  }

  if (area && area.trim().length > 1) {
    tags.push(formatHashtag(area));
  }

  return tags;
}

// ============================================================================
// 1. BLOOD DONOR TAG GENERATOR
// Example: Name: Rahim, Group: A+, Location: Rangamati Sadar
// Expected: ["#Rangamati", "#RangamatiSadar", "#A+Blood", "#BloodDonor", "#রক্তদাতা", "#রাঙ্গামাটি"]
// ============================================================================
export interface BloodDonorTagInput {
  name?: string;
  bloodGroup: string;
  district: string;
  upazila: string;
  area?: string;
  phone?: string;
}

export function generateBloodDonorTags(input: BloodDonorTagInput): string[] {
  const tags: string[] = [];
  
  // 1. Location tags
  const geoTags = extractGeoTags(input.district, input.upazila, input.area);
  tags.push(...geoTags);

  // 2. Specific DistrictSadar compound tag as requested in user prompt
  const dist = (input.district || '').trim();
  const upa = (input.upazila || '').trim();
  if (dist.toLowerCase().includes('rangamati') || dist.includes('রাঙ্গামাটি')) {
    if (upa.toLowerCase().includes('sadar') || upa.includes('সদর')) {
      tags.push('#RangamatiSadar');
      tags.push('#রাঙ্গামাটিসদর');
    }
  } else if (dist.toLowerCase().includes('khagrach') || dist.includes('খাগড়াছড়ি') || dist.includes('খাগড়াছড়ি')) {
    if (upa.toLowerCase().includes('sadar') || upa.includes('সদর')) {
      tags.push('#KhagrachariSadar');
      tags.push('#খাগড়াছড়িসদর');
    }
  } else if (dist.toLowerCase().includes('bandarban') || dist.includes('বান্দরবান')) {
    if (upa.toLowerCase().includes('sadar') || upa.includes('সদর')) {
      tags.push('#BandarbanSadar');
      tags.push('#বান্দরবানসদর');
    }
  }

  // 3. Blood Group tags
  const bg = (input.bloodGroup || '').toUpperCase().trim();
  if (bg) {
    tags.push(`#${bg}Blood`);
    tags.push(`#${bg}`);
    tags.push(`#${bg}_রক্ত`);
  }

  // 4. Role & Categorization tags
  tags.push('#BloodDonor');
  tags.push('#রক্তদাতা');
  tags.push('#জরুরি_রক্ত');
  tags.push('#রক্তদান');

  // 5. User Name tag
  if (input.name && input.name.trim()) {
    tags.push(formatHashtag(input.name.trim()));
  }

  return cleanTagList(tags);
}

// ============================================================================
// 2. PRODUCT / FRUIT / ORGANIC SELLER TAG GENERATOR
// Example: Seller: Chakma Organic Farm, Product: Jackfruit, Location: Khagrachari
// Expected: ["#Khagrachari", "#Jackfruit", "#WholesaleFruit", "#কাঁঠাল", "#পাহাড়ি_পণ্য", "#আম_কাঁঠাল"]
// ============================================================================
export interface ProductTagInput {
  sellerName?: string;
  sellerShopName?: string;
  productName?: string;
  title?: string;
  category?: string;
  productType?: string;
  productCategory?: string;
  district?: string;
  upazila?: string;
  area?: string;
  isOrganic?: boolean;
  taxVatInfo?: string;
}

export function generateProductTags(input: ProductTagInput): string[] {
  const tags: string[] = [];
  
  // 1. Location tags
  const geoTags = extractGeoTags(input.district, input.upazila, input.area);
  tags.push(...geoTags);

  // 2. Product Name & Synonyms
  const pName = (input.productName || input.title || '').trim();
  if (pName) {
    tags.push(formatHashtag(pName));
    
    // Check fruit dictionary
    const lower = pName.toLowerCase();
    for (const [key, val] of Object.entries(FRUIT_PRODUCE_DICTIONARY)) {
      if (lower.includes(key)) {
        tags.push(`#${val.en}`);
        tags.push(`#${val.bn}`);
        for (const rel of val.related) {
          tags.push(formatHashtag(rel));
        }
      }
    }
  }

  // 3. Category & Type tags
  const cat = (input.category || input.productCategory || '').trim();
  if (cat) {
    tags.push(formatHashtag(cat));
  }

  const pType = (input.productType || '').trim();
  if (pType) {
    tags.push(formatHashtag(pType));
  }

  // Common market categories in Chittagong Hill Tracts
  tags.push('#পাহাড়ি_পণ্য');
  if (cat.toLowerCase().includes('fruit') || cat.includes('ফল') || pName.includes('কাঁঠাল') || pName.includes('আম')) {
    tags.push('#WholesaleFruit');
    tags.push('#ফলমূল');
  }

  if (input.isOrganic !== false) {
    tags.push('#অর্গানিক');
    tags.push('#Organic');
  }

  // 4. Seller / Farm Name tag
  const sName = (input.sellerShopName || input.sellerName || '').trim();
  if (sName) {
    tags.push(formatHashtag(sName));
  }

  // 5. Tax / VAT / Business info tag if registered
  if (input.taxVatInfo && input.taxVatInfo.trim()) {
    tags.push('#VerifiedMerchant');
    tags.push('#ভেরিফাইড_বিক্রেতা');
  }

  return cleanTagList(tags);
}

// ============================================================================
// 3. SERVICE PROVIDER TAG GENERATOR
// Example: Name: Anup, Profession: Electrician, Location: Rangamati
// Expected: ["#Rangamati", "#RangamatiSadar", "#Electrician", "#ইলেকট্রিশিয়ান", "#সার্ভিস_প্রোভাইডার"]
// ============================================================================
export interface ServiceProviderTagInput {
  name?: string;
  fullName?: string;
  profession?: string;
  professionKey?: string;
  categoryBn?: string;
  categoryEn?: string;
  skills?: string[] | string;
  serviceDetails?: any;
  bloodGroup?: string;
  district?: string;
  upazila?: string;
  area?: string;
  taxVatInfo?: string;
}

export function generateServiceProviderTags(input: ServiceProviderTagInput): string[] {
  const tags: string[] = [];

  // 1. Location
  const geoTags = extractGeoTags(input.district, input.upazila, input.area);
  tags.push(...geoTags);

  // 2. Profession & Categories
  const prof = (input.profession || input.professionKey || input.categoryBn || '').trim();
  if (prof) {
    tags.push(formatHashtag(prof));
  }
  if (input.categoryEn) {
    tags.push(formatHashtag(input.categoryEn));
  }

  // Common professions mapping
  const profLower = prof.toLowerCase();
  if (profLower.includes('electric') || prof.includes('ইলেকট্রিশিয়ান') || prof.includes('ওয়্যারিং')) {
    tags.push('#Electrician');
    tags.push('#ইলেকট্রিশিয়ান');
    tags.push('#হাউজ_ওয়্যারিং');
    tags.push('#মিস্ত্রি');
  } else if (profLower.includes('plumb') || prof.includes('প্লাম্বার') || prof.includes('পাইপ')) {
    tags.push('#Plumber');
    tags.push('#প্লাম্বার');
    tags.push('#পাইপ_ফিটার');
  } else if (profLower.includes('mason') || prof.includes('রাজমিস্ত্রি')) {
    tags.push('#Mason');
    tags.push('#রাজমিস্ত্রি');
    tags.push('#নির্মাণ_শ্রমিক');
  } else if (profLower.includes('mechanic') || prof.includes('মেকানিক')) {
    tags.push('#Mechanic');
    tags.push('#মেকানিক');
  } else if (profLower.includes('tutor') || prof.includes('শিক্ষক')) {
    tags.push('#HomeTutor');
    tags.push('#হোম_টিউটর');
  }

  // 3. Skills
  if (Array.isArray(input.skills)) {
    for (const skill of input.skills) {
      if (skill) tags.push(formatHashtag(skill));
    }
  } else if (typeof input.skills === 'string' && input.skills.trim()) {
    const parts = input.skills.split(/[,;\n]+/);
    for (const p of parts) {
      if (p.trim()) tags.push(formatHashtag(p.trim()));
    }
  }

  // 4. Role & Standard service tags
  tags.push('#ServiceProvider');
  tags.push('#সার্ভিস_প্রোভাইডার');
  tags.push('#দক্ষ_কারিগর');
  tags.push('#হোম_সার্ভিস');

  // 5. Blood group (if professional is also available as donor)
  if (input.bloodGroup && input.bloodGroup.trim()) {
    tags.push(`#${input.bloodGroup.toUpperCase()}_Blood`);
    tags.push('#BloodDonor');
  }

  // 6. Verification tag
  if (input.taxVatInfo) {
    tags.push('#VerifiedPro');
    tags.push('#ভেরিফাইড_প্রো');
  }

  return cleanTagList(tags);
}

// ============================================================================
// 4. JOB SEEKER TAG GENERATOR
// Example: Name: Shuvo, Job Type: Accountant, Location: Khagrachari
// Expected: ["#Khagrachari", "#JobSeeker", "#চাকরি_প্রার্থী", "#Accountant", "#অ্যাকাউন্টিং", "#স্নাতক"]
// ============================================================================
export interface JobSeekerTagInput {
  name?: string;
  fullName?: string;
  skillsOrJobType?: string;
  skills?: string[] | string;
  education?: string;
  experience?: string;
  district?: string;
  upazila?: string;
  area?: string;
  bloodGroup?: string;
  taxVatInfo?: string;
}

export function generateJobSeekerTags(input: JobSeekerTagInput): string[] {
  const tags: string[] = [];

  // 1. Location
  tags.push(...extractGeoTags(input.district, input.upazila, input.area));

  // 2. Core Job Seeker Tags
  tags.push('#JobSeeker');
  tags.push('#চাকরি_প্রার্থী');
  tags.push('#বায়োডাটা');
  tags.push('#CV');

  // 3. Skills or Preferred Job Type
  const jt = (input.skillsOrJobType || '').trim();
  if (jt) {
    tags.push(formatHashtag(jt));
    const jtLower = jt.toLowerCase();
    if (jtLower.includes('account') || jt.includes('হিসাব')) {
      tags.push('#Accountant');
      tags.push('#অ্যাকাউন্টিং');
    }
    if (jtLower.includes('computer') || jt.includes('কম্পিউটার')) {
      tags.push('#ComputerOperator');
      tags.push('#কম্পিউটার_অপারেটর');
    }
    if (jtLower.includes('sales') || jt.includes('সেলস')) {
      tags.push('#SalesExecutive');
      tags.push('#মার্কেটিং');
    }
  }

  if (Array.isArray(input.skills)) {
    for (const s of input.skills) {
      if (s) tags.push(formatHashtag(s));
    }
  }

  // 4. Education
  const edu = (input.education || '').trim();
  if (edu) {
    tags.push(formatHashtag(edu));
    if (edu.includes('স্নাতক') || edu.toLowerCase().includes('bachelor') || edu.toLowerCase().includes('graduate')) {
      tags.push('#Graduate');
      tags.push('#স্নাতক');
    }
  }

  // 5. Blood Group
  if (input.bloodGroup && input.bloodGroup.trim()) {
    tags.push(`#${input.bloodGroup.toUpperCase()}_Blood`);
  }

  return cleanTagList(tags);
}

// ============================================================================
// 5. JOB CIRCULAR TAG GENERATOR
// Example: Company: Chakma Traders, Title: Sales Executive, Location: Rangamati
// Expected: ["#Rangamati", "#JobCircular", "#চাকরি", "#নিয়োগ_বিজ্ঞপ্তি", "#SalesExecutive"]
// ============================================================================
export interface JobCircularTagInput {
  jobTitle?: string;
  companyOrPoster?: string;
  category?: string;
  jobType?: string;
  district?: string;
  upazila?: string;
  area?: string;
  taxVatInfo?: string;
}

export function generateJobCircularTags(input: JobCircularTagInput): string[] {
  const tags: string[] = [];

  // 1. Location
  tags.push(...extractGeoTags(input.district, input.upazila, input.area));

  // 2. Core Job Circular Tags
  tags.push('#JobCircular');
  tags.push('#চাকরি');
  tags.push('#নিয়োগ_বিজ্ঞপ্তি');
  tags.push('#Job');

  // 3. Job Title
  const title = (input.jobTitle || '').trim();
  if (title) {
    tags.push(formatHashtag(title));
    const tLower = title.toLowerCase();
    if (tLower.includes('sales') || title.includes('সেলস')) {
      tags.push('#SalesExecutive');
      tags.push('#সেলস_এক্সিকিউটিভ');
    }
    if (tLower.includes('manager') || title.includes('ম্যানেজার')) {
      tags.push('#Manager');
      tags.push('#ম্যানেজার');
    }
    if (tLower.includes('teacher') || title.includes('শিক্ষক')) {
      tags.push('#Teacher');
      tags.push('#শিক্ষক');
    }
  }

  // 4. Company Name
  const company = (input.companyOrPoster || '').trim();
  if (company) {
    tags.push(formatHashtag(company));
  }

  // 5. Job Type & Category
  if (input.jobType) {
    tags.push(formatHashtag(input.jobType));
  }
  if (input.category) {
    tags.push(formatHashtag(input.category));
  }

  return cleanTagList(tags);
}

// ============================================================================
// 6. MEMBER REGISTRATION TAG GENERATOR
// Example: Name: Mongpru, Tier: Permanent, Location: Bandarban
// Expected: ["#Bandarban", "#Member", "#স্থায়ী_সদস্য", "#মেম্বারশিপ", "#Citizen"]
// ============================================================================
export interface MemberTagInput {
  name?: string;
  fullName?: string;
  role?: string;
  membershipTier?: string;
  profession?: string;
  skills?: string;
  district?: string;
  upazila?: string;
  area?: string;
  bloodGroup?: string;
  isBloodDonor?: boolean;
  taxVatInfo?: string;
}

export function generateMemberTags(input: MemberTagInput): string[] {
  const tags: string[] = [];

  // 1. Location
  tags.push(...extractGeoTags(input.district, input.upazila, input.area));

  // 2. Member & Citizen Identity
  tags.push('#Member');
  tags.push('#সদস্য');
  tags.push('#মেম্বারশিপ');
  tags.push('#পার্বত্য_চট্টগ্রাম');
  tags.push('#Citizen');

  const tier = (input.membershipTier || '').toLowerCase();
  if (tier.includes('permanent') || tier.includes('স্থায়ী') || tier.includes('pro')) {
    tags.push('#স্থায়ী_সদস্য');
    tags.push('#PermanentMember');
    tags.push('#ProMember');
  }

  // 3. Profession
  const prof = (input.profession || '').trim();
  if (prof) {
    tags.push(formatHashtag(prof));
  }

  // 4. Blood Group
  const bg = (input.bloodGroup || '').toUpperCase().trim();
  if (bg && (input.isBloodDonor !== false || bg)) {
    tags.push(`#${bg}Blood`);
    tags.push('#রক্তদাতা');
    tags.push('#BloodDonor');
  }

  // 5. Verification
  if (input.taxVatInfo) {
    tags.push('#VerifiedCitizen');
    tags.push('#ভেরিফাইড_নাগরিক');
  }

  return cleanTagList(tags);
}

// ============================================================================
// MASTER DISPATCHER: AUTO-GENERATE TAGS BY ENTITY TYPE
// ============================================================================
export function generateSearchTags(
  entityType: 'blood_donor' | 'product' | 'service_provider' | 'job_seeker' | 'job_circular' | 'member',
  data: any
): { search_tags: string[]; hashtags: string[] } {
  let tags: string[] = [];

  switch (entityType) {
    case 'blood_donor':
      tags = generateBloodDonorTags({
        name: data.name || data.fullName || data.full_name,
        bloodGroup: data.bloodGroup || data.blood_group || '',
        district: data.district || '',
        upazila: data.upazila || '',
        area: data.area || data.mahalla || '',
        phone: data.phone
      });
      break;

    case 'product':
      tags = generateProductTags({
        sellerName: data.sellerName || data.seller_name || data.ownerName,
        sellerShopName: data.sellerShopName || data.seller_shop_name || data.shopName,
        productName: data.name_bn || data.nameBn || data.title || data.name,
        title: data.title || data.name_bn || data.name,
        category: data.category || data.product_category,
        productType: data.productType || data.product_type || 'Fruit',
        district: data.district || '',
        upazila: data.upazila || '',
        area: data.area || '',
        isOrganic: data.isOrganic ?? data.is_organic ?? true,
        taxVatInfo: data.taxVatInfo || data.tax_vat_info || data.tradeLicenseOrNid
      });
      break;

    case 'service_provider':
      tags = generateServiceProviderTags({
        name: data.name || data.fullName || data.full_name || data.displayName,
        profession: data.profession || data.professionKey || data.primaryProfession,
        professionKey: data.professionKey || data.profession_key,
        categoryBn: data.categoryBn || data.category_bn,
        categoryEn: data.categoryEn || data.category_en,
        skills: data.skills || data.skills_or_job_type || data.categorySkill,
        serviceDetails: data.service_details || data.serviceDetails,
        bloodGroup: data.bloodGroup || data.blood_group,
        district: data.district || '',
        upazila: data.upazila || '',
        area: data.area || data.paraMahalla || data.mahalla,
        taxVatInfo: data.taxVatInfo || data.tax_vat_info || data.nidNumber
      });
      break;

    case 'job_seeker':
      tags = generateJobSeekerTags({
        name: data.name || data.fullName || data.full_name,
        skillsOrJobType: data.skillsOrJobType || data.skills_or_job_type,
        skills: data.skills,
        education: data.education,
        experience: data.experience,
        district: data.district || '',
        upazila: data.upazila || '',
        area: data.area || '',
        bloodGroup: data.bloodGroup || data.blood_group,
        taxVatInfo: data.taxVatInfo || data.tax_vat_info || data.nidNumber
      });
      break;

    case 'job_circular':
      tags = generateJobCircularTags({
        jobTitle: data.jobTitle || data.job_title || data.title,
        companyOrPoster: data.companyOrPoster || data.company_or_poster || data.companyName,
        category: data.category,
        jobType: data.jobType || data.job_type,
        district: data.district || '',
        upazila: data.upazila || '',
        area: data.area || '',
        taxVatInfo: data.taxVatInfo || data.tax_vat_info
      });
      break;

    case 'member':
      tags = generateMemberTags({
        name: data.name || data.fullName || data.full_name,
        membershipTier: data.membershipTier || data.membership_tier,
        role: data.role,
        profession: data.profession || data.professionBn,
        skills: data.skills || data.categorySkill,
        district: data.district || '',
        upazila: data.upazila || '',
        area: data.area || data.mahalla,
        bloodGroup: data.bloodGroup || data.blood_group,
        isBloodDonor: data.isBloodDonor ?? data.is_blood_donor,
        taxVatInfo: data.taxVatInfo || data.tax_vat_info || data.nidNumber
      });
      break;
  }

  return {
    search_tags: tags,
    hashtags: tags
  };
}
