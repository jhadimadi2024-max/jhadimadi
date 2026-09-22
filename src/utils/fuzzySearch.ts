/**
 * Intelligent Fuzzy & Phonetic Matching Engine for Bengali & English
 * Jhadimadi.com
 *
 * Supports:
 * 1. Regional dialect & phonetic variations (e.g. স/শ/ষ <-> হ: সিদল <-> হিদল, শুঁটকি <-> হুটকি)
 * 2. Chandrabindu (ঁ), nukta (ড়/ঢ়), and vowel flexibility
 * 3. Typo tolerance using Levenshtein distance
 * 4. Cross-language Bengali <-> English synonyms & romanized terms (e.g., honey <-> মধু, chili <-> মরিচ)
 * 5. Smart multi-attribute scoring & matcher for Products, Services, and Blood Donors
 */

import { StoreProduct } from '../data/productsData';

// ---------------------------------------------------------------------------
// 1. Synonym & Semantic Cluster Dictionary
// ---------------------------------------------------------------------------

const SYNONYM_CLUSTERS: string[][] = [
  // সিদল / সেদল / হিদল / শুঁটকি / Fish delicacies (handles all regional hill tracts & Chittagong dialects)
  ['সিদল', 'সেদল', 'সিঁদল', 'সিদোল', 'সেদোল', 'হিদল', 'হিদোল', 'শুঁটকি', 'শুটকি', 'সুটকি', 'চুটকি', 'চুটাক', 'শুটাক', 'শুড়ি শুটকি', 'হুটকি', 'হুতকি', 'চেপা', 'sidal', 'sidol', 'sedol', 'shidol', 'shutki', 'chutki', 'shutak', 'sutki', 'hutki', 'chepa', 'dry fish', 'dried fish'],

  // গুড় / আখের গুড় / Jaggery
  ['গুড়', 'গুড়া', 'গুঁড়ো', 'আখের গুড়', 'আকের গুড়', 'আখের গুড়া', 'পাটালি গুড়', 'ঝুলা গুড়', 'পাহাড়ি গুড়', 'gur', 'gud', 'jaggery', 'cane sugar'],

  // চিংড়ি / Shrimp / Prawn
  ['চিংড়ি', 'চিংড়ি শুটাক', 'চিংড়ি শুটকি', 'চিংড়ী', 'chingri', 'shrimp', 'prawn'],

  // মরিচ / ঝাল / Chili
  ['মরিচ', 'মরিচ গুঁড়া', 'মরিচের গুঁড়ো', 'পাহাড়ি মরিচ', 'শুকনা মরিচ', 'ঝাল', 'morich', 'chili', 'chilli', 'chile', 'pepper', 'red pepper', 'capsicum'],

  // হলুদ / Turmeric
  ['হলুদ', 'হুলুদ', 'হলইদ', 'হলদি', 'হলুদ গুঁড়া', 'পাহাড়ি হলুদ', 'জুম হলুদ', 'হলুদের গুঁড়ো', 'turmeric', 'holud', 'haldi', 'yellow powder'],

  // মধু / Honey
  ['মধু', 'কাঁচা মধু', 'পাহাড়ি মধু', 'খাঁটি মধু', 'খাটি মধু', 'জংলি মধু', 'honey', 'modhu', 'raw honey', 'wild honey'],

  // আদা / Ginger
  ['আদা', 'আদার গুঁড়া', 'ada', 'ginger', 'ada gura'],

  // রসুন / Garlic
  ['রসুন', 'রশুন', 'রোসুন', 'garlic', 'roshun'],

  // চাল / ধান / Rice / Grains
  ['চাল', 'ধান', 'বিনি চাল', 'জুমের চাল', 'জুমি চাল', 'আতপ চাল', 'বিরুই চাল', 'কাউন', 'কাউনের চাল', 'rice', 'chal', 'bini', 'paddy', 'grain', 'grains', 'zoom rice'],

  // সরিষার তেল / Oil
  ['সরিষা', 'সরিষার তেল', 'সরিষা তেল', 'সরিষা তৈল', 'শোরিষা', 'শোরিষার তেল', 'তেল', 'ঘানি ভাঙা তেল', 'mustard', 'mustard oil', 'oil', 'shorisha', 'sorisha', 'tel'],

  // বাঁশকোড়ল / Bamboo shoot / মেবা / মেচ্ছ্যা
  ['বাঁশকোড়ল', 'বাঁশ কোড়ল', 'বাশকোড়ল', 'বাশ কোড়ল', 'মেচ্ছ্যা', 'মেবা', 'bamboo shoot', 'bashkorol', 'meba', 'mechhya'],

  // পিনন হাদি / আদিবাসী পোশাক / Indigenous Attire
  ['পিনন', 'হাদি', 'পিনন হাদি', 'থামি', 'চাকমা পোশাক', 'আদিবাসী পোশাক', 'কোমড় তাঁত', 'pinon', 'hadi', 'thami', 'indigenous dress', 'tribal cloth'],

  // কাজুবাদাম / Cashew
  ['কাজু বাদাম', 'কাজুবাদাম', 'বাদাম', 'cashew', 'cashew nut', 'kaju', 'badam'],

  // চা / Tea
  ['চা', 'গ্রিন টি', 'রং চা', 'চা পাতা', 'tea', 'green tea'],

  // ঘি / Ghee
  ['ঘি', 'গাওয়া ঘি', 'খাঁটি ঘি', 'খাটি ঘি', 'ghee', 'clarified butter'],

  // তেজপাতা / Bay leaf
  ['তেজপাতা', 'তেজ পাতা', 'bay leaf', 'tej pata'],

  // চন্দন / Sandalwood
  ['চন্দন', 'চন্দন গুঁড়া', 'sandalwood', 'chondon'],

  // Services:
  // ইলেকট্রিশিয়ান / Electrician
  ['ইলেকট্রিশিয়ান', 'ইলেকট্রিশিয়ান', 'ইলেকট্রিক', 'বিদ্যুৎ', 'ওয়্যারিং', 'কারেন্ট', 'electrician', 'electrical', 'electric', 'wiring'],

  // প্লাম্বার / Plumber
  ['প্লাম্বার', 'প্লামবার', 'প্লাম্বিং', 'স্যানিটারি', 'পাইপ', 'পানির লাইন', 'কল মিস্ত্রি', 'plumber', 'plumbing', 'sanitary'],

  // ফ্রিজ ও এসি / Refrigerator & AC
  ['ফ্রিজ', 'রেফ্রিজারেটর', 'এসি', 'শীতাতপ', 'এয়ার কন্ডিশনার', 'মেকানিক', 'ac repair', 'fridge repair', 'technician'],

  // গৃহকর্মী / Maid / Cleaner
  ['গৃহকর্মী', 'ক্লিনার', 'ক্লিনিং', 'ধোয়ামোছা', 'ঝাড়ু', 'রান্নার মানুষ', 'কাজের বুয়া', 'maid', 'cleaner', 'cleaning'],

  // ডাক্তার / Doctor
  ['ডাক্তার', 'চিকিৎসক', 'এমবিবিএস', 'মেডিকেল', 'ফিজিওথেরাপিস্ট', 'doctor', 'physician', 'medical'],

  // নার্স / Nurse
  ['নার্স', 'ব্রাদার', 'রোগীর সেবা', 'nurse', 'nursing'],

  // ড্রাইভার / Driver
  ['ড্রাইভার', 'ড্রাইবার', 'চালক', 'গাড়ি চালক', 'রেন্ট এ কার', 'driver', 'chauffeur'],

  // শিক্ষক / Tutor
  ['শিক্ষক', 'টিউটর', 'মাস্টার', 'পড়ানোর মানুষ', 'টিউশনি', 'teacher', 'tutor'],

  // রাজমিস্ত্রি / Mason / Painter
  ['রাজমিস্ত্রি', 'পেইন্টার', 'রংমিস্ত্রি', 'টাইলস মিস্ত্রি', 'ঢালাই মিস্ত্রি', 'mason', 'painter'],

  // কাঠমিস্ত্রি / Carpenter
  ['কাঠমিস্ত্রি', 'কার্পেন্টার', 'ফার্নিচার', 'carpenter', 'woodworker'],

  // রক্ত / Blood
  ['রক্ত', 'ব্লাড', 'রক্তদাতা', 'ডোনার', 'blood', 'donor', 'blood donor']
];

// Precompute reverse lookup map for clusters
const SYNONYM_LOOKUP: Map<string, string[]> = new Map();
SYNONYM_CLUSTERS.forEach(cluster => {
  cluster.forEach(word => {
    const key = word.toLowerCase().trim();
    if (!SYNONYM_LOOKUP.has(key)) {
      SYNONYM_LOOKUP.set(key, cluster);
    }
  });
});

/**
 * Returns all related synonym words and variations for a given word
 */
export function getSynonymsForWord(word: string): string[] {
  const clean = word.toLowerCase().trim();
  if (SYNONYM_LOOKUP.has(clean)) {
    return SYNONYM_LOOKUP.get(clean)!;
  }
  // Try partial match within cluster words
  for (const cluster of SYNONYM_CLUSTERS) {
    if (cluster.some(item => item.includes(clean) || clean.includes(item))) {
      return cluster;
    }
  }
  return [clean];
}

// ---------------------------------------------------------------------------
// 2. Bengali Phonetic Normalizer
// ---------------------------------------------------------------------------

/**
 * Normalizes Bengali characters to handle common phonetic/dialect variations:
 * - Chandrabindu (ঁ) optional
 * - Hasanta / Virama, Dari (।) stripped
 * - Nukta equivalents (ড়, ঢ় -> ড, ঢ; য় -> য)
 * - Sibilant / Aspirate equivalence for Chittagong/Hill Tracts dialects (স, শ, ষ, হ)
 */
/**
 * Strips zero-width invisible characters and trims string
 */
export function cleanSearchString(str: string): string {
  if (!str) return '';
  return String(str)
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .trim()
    .toLowerCase();
}

/**
 * Normalizes Bengali characters for robust comparison:
 * - Strips Zero-Width Joiner (ZWJ), Non-Joiner (ZWNJ), and BOM
 * - Chandrabindu (ঁ) optional
 * - Hasanta / Virama, Dari (।) stripped
 * - Nukta equivalents (ড়, ঢ় -> ড, ঢ; য় -> য)
 * - Sibilant / Aspirate equivalence for Chittagong/Hill Tracts dialects (স, শ, ষ, হ)
 * - Vowel normalization (ো, ী/ি, ূ/ু, ৌ/উ, ৈ/ই)
 */
export function normalizeBengali(str: string, aggressiveDialect = false): string {
  if (!str) return '';
  let res = String(str)
    .toLowerCase()
    .replace(/[\u200B-\u200D\uFEFF]/g, '') // Strip Zero-Width Joiner (ZWJ), ZWNJ, and BOM
    .replace(/[।.,?!;:'"()\[\]{}\\/_\-+@#$%^&*~`|<>]/g, ' ')
    .replace(/ঁ/g, '') // remove chandrabindu
    .replace(/়/g, '') // remove nukta
    .replace(/ড়/g, 'ড')
    .replace(/ঢ়/g, 'ঢ')
    .replace(/য়/g, 'য')
    .replace(/ণ/g, 'ন')
    .replace(/ী/g, 'ি')
    .replace(/ূ/g, 'ু')
    .replace(/ৈ/g, 'ই')
    .replace(/ৌ/g, 'উ')
    .replace(/\s+/g, ' ')
    .trim();

  if (aggressiveDialect) {
    // In dialectal phonetic matching:
    // 1. Unify sibilants (স, শ, ষ) and affricates (চ, ছ) with aspirate (হ)
    // 2. Relax e-kar (ে) to i-kar (ি) so সেদল matches সিদল
    // 3. Relax o-kar (ো) and ou-kar (ৌ) so সিদোল matches সিদল
    res = res
      .replace(/[শষস]/g, 'হ')
      .replace(/[চছ]/g, 'হ')
      .replace(/[েৈ]/g, 'ি')
      .replace(/[োৌ]/g, '');
  }

  return res;
}

// ---------------------------------------------------------------------------
// 3. Levenshtein Distance & Fuzzy Matcher
// ---------------------------------------------------------------------------

export function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  if (m === 0) return n;
  if (n === 0) return m;

  // Single row memory optimization
  let prevRow = Array.from({ length: n + 1 }, (_, i) => i);
  let currRow = new Array(n + 1);

  for (let i = 1; i <= m; i++) {
    currRow[0] = i;
    const char1 = s1[i - 1];
    for (let j = 1; j <= n; j++) {
      const char2 = s2[j - 1];
      const cost = char1 === char2 ? 0 : 1;
      currRow[j] = Math.min(
        currRow[j - 1] + 1, // insertion
        prevRow[j] + 1,     // deletion
        prevRow[j - 1] + cost // substitution
      );
    }
    [prevRow, currRow] = [currRow, prevRow];
  }
  return prevRow[n];
}

/**
 * Checks if query fuzzily matches any token or full string of target
 */
export function fuzzyStringMatch(target: string, query: string, maxDistance = 2): boolean {
  if (!target || !query) return false;
  const tNorm = normalizeBengali(target);
  const qNorm = normalizeBengali(query);

  if (tNorm.includes(qNorm)) return true;

  // Dialect-aware check (e.g. সিদল <-> হিদল, সিদোল <-> সিদল)
  const tDialect = normalizeBengali(target, true);
  const qDialect = normalizeBengali(query, true);
  if (tDialect.includes(qDialect)) return true;

  // Word token-by-token fuzzy comparison
  const tWords = tNorm.split(' ').filter(Boolean);
  const qWords = qNorm.split(' ').filter(Boolean);
  const tWordsDialect = tDialect.split(' ').filter(Boolean);

  for (const qw of qWords) {
    const qwSynonyms = getSynonymsForWord(qw);

    // Check synonym clusters across full target string or target words
    const hasSynonymMatch = qwSynonyms.some(syn => {
      const synNorm = normalizeBengali(syn);
      const synDialect = normalizeBengali(syn, true);
      return (
        tNorm.includes(synNorm) ||
        tDialect.includes(synDialect) ||
        tWords.some(tw => tw.includes(synNorm)) ||
        tWordsDialect.some(tw => tw.includes(synDialect))
      );
    });
    if (hasSynonymMatch) continue;

    if (qw.length <= 2) {
      // For short words (e.g. চা, ঘি, গুড়), match substring, dialect or synonym
      if (!tNorm.includes(qw) && !tDialect.includes(qw)) return false;
      continue;
    }

    const matchedAny = tWords.some(tw => {
      if (tw.includes(qw) || (tw.length >= 3 && qw.includes(tw))) return true;
      // Do not allow arbitrary character substitution on 3-char words (prevents false matches like ফুড <-> গুড)
      if (qw.length <= 3 || tw.length <= 3) return false;
      const allowedDist = qw.length <= 4 ? 1 : maxDistance;
      return levenshteinDistance(tw, qw) <= allowedDist;
    });

    if (!matchedAny) {
      // Also try dialect word comparison
      const qwDialect = normalizeBengali(qw, true);
      const matchedDialect = tWordsDialect.some(tw => {
        if (tw.includes(qwDialect) || (tw.length >= 3 && qwDialect.includes(tw))) return true;
        if (qwDialect.length <= 3 || tw.length <= 3) return false;
        const allowedDist = qwDialect.length <= 4 ? 1 : maxDistance;
        return levenshteinDistance(tw, qwDialect) <= allowedDist;
      });

      if (!matchedDialect) return false;
    }
  }

  return true;
}

// ---------------------------------------------------------------------------
// 4. Smart Product Matcher
// ---------------------------------------------------------------------------

/**
 * High-performance smart matcher for StoreProduct
 * Inspects all product fields + synonym clusters + phonetic variations
 */
export function matchesSmartProduct(p: any, query: string): boolean {
  if (!p) return false;
  if (!query || !query.trim()) return true;
  const cleanQ = cleanSearchString(query);
  if (!cleanQ) return true;

  // Extract all searchable fields handling both camelCase and snake_case
  const nameBn = cleanSearchString(p.nameBn || p.name_bn || p.title_bn || p.title || p.name || '');
  const nameEn = cleanSearchString(p.nameEn || p.name_en || p.title_en || '');
  const descBn = cleanSearchString(p.descriptionBn || p.description_bn || p.description || '');
  const descEn = cleanSearchString(p.descriptionEn || p.description_en || '');
  const catLabel = cleanSearchString(p.categoryLabelBn || p.category_label_bn || '');
  const cat = cleanSearchString(p.category || '');
  const origin = cleanSearchString(p.origin || p.productionOrigin || p.production_origin || p.district || '');
  const badge = cleanSearchString(p.badge || '');
  const code = cleanSearchString(p.code || p.sku || '');
  const featuresStr = cleanSearchString(
    Array.isArray(p.features) ? p.features.join(' ') : (Array.isArray(p.key_highlights) ? p.key_highlights.join(' ') : '')
  );

  // 1. Direct Substring Match across all product fields
  if (
    nameBn.includes(cleanQ) ||
    nameEn.includes(cleanQ) ||
    descBn.includes(cleanQ) ||
    descEn.includes(cleanQ) ||
    catLabel.includes(cleanQ) ||
    cat.includes(cleanQ) ||
    origin.includes(cleanQ) ||
    badge.includes(cleanQ) ||
    code.includes(cleanQ) ||
    featuresStr.includes(cleanQ)
  ) {
    return true;
  }

  // 2. Expand Query via Synonym Clusters (e.g. "সিদল" expands to "হিদল", "সিদোল", "শুঁটকি", "sidol", etc.)
  const queryTokens = cleanQ.split(/\s+/).filter(Boolean);
  let expandedSynonyms: string[] = [];
  queryTokens.forEach(token => {
    expandedSynonyms = expandedSynonyms.concat(getSynonymsForWord(token));
  });

  for (const syn of expandedSynonyms) {
    const synLower = cleanSearchString(syn);
    if (!synLower) continue;
    if (
      nameBn.includes(synLower) ||
      nameEn.includes(synLower) ||
      catLabel.includes(synLower) ||
      descBn.includes(synLower) ||
      descEn.includes(synLower) ||
      origin.includes(synLower) ||
      badge.includes(synLower) ||
      featuresStr.includes(synLower)
    ) {
      return true;
    }
  }

  // 3. Normalized Bengali comparison (handling nukta, chandrabindu, sibilants, and vowel flexibility)
  const normQ = normalizeBengali(cleanQ);
  const normQRelaxed = normalizeBengali(cleanQ, true);
  const fullProductText = `${nameBn} ${nameEn} ${catLabel} ${cat} ${origin} ${badge} ${descBn} ${featuresStr}`;
  const fullNormText = normalizeBengali(fullProductText);
  const fullNormRelaxed = normalizeBengali(fullProductText, true);

  if (fullNormText.includes(normQ) || fullNormRelaxed.includes(normQRelaxed)) {
    return true;
  }

  // 4. Token-level matching for compound Bengali names (e.g. "মধু" inside "পাহাড়ীমধু", "সিদ" in "সিদোল")
  for (const token of queryTokens) {
    const normToken = normalizeBengali(token);
    const normTokenRelaxed = normalizeBengali(token, true);
    if (token.length >= 2) {
      if (
        fullProductText.includes(token) ||
        fullNormText.includes(normToken) ||
        fullNormRelaxed.includes(normTokenRelaxed)
      ) {
        return true;
      }
    }
  }

  // 5. Dialect & Levenshtein Fuzzy Matching
  if (fuzzyStringMatch(fullProductText, cleanQ, 2)) {
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// 5. Smart Service & Professional Matcher
// ---------------------------------------------------------------------------

export function matchesSmartService(pro: any, query: string): boolean {
  if (!query || !query.trim()) return true;
  const q = query.trim().toLowerCase();

  const job = (pro.job || '').toLowerCase();
  const name = (pro.name || '').toLowerCase();
  const phone = (pro.phone || '');
  const headline = (pro.professionalHeadline || '').toLowerCase();
  const catGroup = (pro.categoryGroup || '').toLowerCase();
  const bio = (pro.bio || '').toLowerCase();
  const district = (pro.district || '').toLowerCase();
  const upazila = (pro.upazila || '').toLowerCase();
  const area = (pro.area || '').toLowerCase();
  const uniqueId = (pro.uniqueId || pro.memberId || '').toLowerCase();

  let skillsStr = '';
  if (Array.isArray(pro.skills)) skillsStr += pro.skills.join(' ').toLowerCase();
  else if (typeof pro.skills === 'string') skillsStr += pro.skills.toLowerCase();

  if (Array.isArray(pro.selectedSkillsList)) {
    skillsStr += ' ' + pro.selectedSkillsList.join(' ').toLowerCase();
  }

  // 1. Direct Substring Match
  if (
    job.includes(q) ||
    name.includes(q) ||
    phone.includes(q) ||
    headline.includes(q) ||
    catGroup.includes(q) ||
    bio.includes(q) ||
    district.includes(q) ||
    upazila.includes(q) ||
    area.includes(q) ||
    uniqueId.includes(q) ||
    skillsStr.includes(q)
  ) {
    return true;
  }

  // 2. Expand via Synonym Clusters (e.g. electrician -> ইলেকট্রিশিয়ান, plumber -> প্লাম্বার)
  const queryTokens = q.split(/\s+/).filter(Boolean);
  let synonyms: string[] = [];
  queryTokens.forEach(token => {
    synonyms = synonyms.concat(getSynonymsForWord(token));
  });

  for (const syn of synonyms) {
    const s = syn.toLowerCase();
    if (job.includes(s) || skillsStr.includes(s) || headline.includes(s) || catGroup.includes(s)) {
      return true;
    }
  }

  // 3. Fuzzy & Phonetic Match
  const fullProText = `${job} ${name} ${headline} ${catGroup} ${skillsStr} ${district} ${upazila}`;
  if (fuzzyStringMatch(fullProText, q, 1)) {
    return true;
  }

  return false;
}

// ---------------------------------------------------------------------------
// 6. Smart Blood Donor Matcher
// ---------------------------------------------------------------------------

export function matchesSmartBlood(
  donor: any,
  query: string,
  selectedBloodGroup?: string,
  district?: string,
  upazila?: string
): boolean {
  // Blood group filter
  if (selectedBloodGroup) {
    const dGroup = (donor.bloodGroup || '').toUpperCase().replace(/\s+/g, '');
    const sGroup = selectedBloodGroup.toUpperCase().replace(/\s+/g, '');
    if (dGroup !== sGroup) return false;
  }

  // District & Upazila filters
  if (district && donor.district && donor.district !== district) {
    return false;
  }
  if (upazila && donor.upazila && donor.upazila !== upazila) {
    return false;
  }

  if (!query || !query.trim()) return true;
  const q = query.trim().toLowerCase();

  const name = (donor.name || '').toLowerCase();
  const phone = (donor.phone || '');
  const bGroup = (donor.bloodGroup || '').toLowerCase();
  const dDistrict = (donor.district || '').toLowerCase();
  const dUpazila = (donor.upazila || '').toLowerCase();
  const dArea = (donor.area || '').toLowerCase();
  const job = (donor.job || '').toLowerCase();

  // If query is a blood group (e.g. 'O+', 'o positive', 'এবি পজিটিভ')
  const qUpper = q.toUpperCase().replace(/\s+/g, '');
  if (['O+', 'O-', 'A+', 'A-', 'B+', 'B-', 'AB+', 'AB-'].includes(qUpper)) {
    return (donor.bloodGroup || '').toUpperCase().replace(/\s+/g, '') === qUpper;
  }

  // Direct substring check
  if (
    name.includes(q) ||
    phone.includes(q) ||
    bGroup.includes(q) ||
    dDistrict.includes(q) ||
    dUpazila.includes(q) ||
    dArea.includes(q) ||
    job.includes(q)
  ) {
    return true;
  }

  // Fuzzy match on donor name or location
  const fullDonorText = `${name} ${dDistrict} ${dUpazila} ${dArea} ${bGroup}`;
  return fuzzyStringMatch(fullDonorText, q, 1);
}
