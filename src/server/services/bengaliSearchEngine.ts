/**
 * Generalized Bengali Phonetic + Fuzzy Search Engine
 * 
 * Reusable, dialect-tolerant, and zero-hardcoding search engine for Jhadimadi.com
 * Handles:
 * 1. Unicode NFC & Zero-Width normalization
 * 2. Bengali diacritic & orthographic equivalence (short/long vowels, sibilants, nasals, liquids)
 * 3. Regional phonetic transformation (Hill Tracts / Chittagonian S <-> H dialect shift)
 * 4. Banglish transliteration canonicalization
 * 5. Damerau-Levenshtein edit distance & N-gram Dice coefficient
 * 6. Hybrid multi-tier ranking (Exact -> Normalized -> Phonetic -> Fuzzy -> Token)
 */

// ----------------------------------------------------
// 1. UNICODE & ZERO-WIDTH NORMALIZATION
// ----------------------------------------------------

/**
 * Normalizes Unicode, removes invisible formatting chars (ZWJ, ZWNJ, BOM),
 * and decomposes / recomposes Nukta combinations into canonical forms.
 */
export function normalizeBengaliUnicode(text: string): string {
  if (!text) return '';

  // 1. Standard Unicode NFC normalization
  let normalized = text.normalize('NFC');

  // 2. Remove Zero-Width characters (ZWJ, ZWNJ, BOM, Soft Hyphen)
  normalized = normalized.replace(/[\u200B-\u200D\uFEFF\u00AD\u2060]/g, '');

  // 3. Compose decomposed Nukta combinations (e.g., ড + ় -> ড়, ঢ + ় -> ঢ়, য + ় -> য়)
  normalized = normalized
    .replace(/\u09A1\u09BC/g, '\u09DD') // ড + ় = ড়
    .replace(/\u09A2\u09BC/g, '\u09DE') // ঢ + ় = ঢ়
    .replace(/\u09AF\u09BC/g, '\u09DF'); // য + ় = য়

  // 4. Standardize Bengali punctuation and hyphens
  normalized = normalized.replace(/[।॥]/g, ' ').replace(/[-_–—/]/g, ' ');

  // 5. Collapse excessive whitespace
  return normalized.replace(/\s+/g, ' ').trim().toLowerCase();
}

// ----------------------------------------------------
// 2. BENGALI ORTHOGRAPHIC & DIACRITIC EQUIVALENCE
// ----------------------------------------------------

/**
 * Normalizes common Bengali spelling variations and interchangeable characters:
 * - Vowels: ী -> ি, ূ -> ু, ৃ -> রি
 * - Sibilants: শ, ষ, স -> স
 * - Nasals: ণ, ন -> ন; ঁ, ং, ঙ, ঞ -> ং
 * - Flaps / Liquids: ড়, ঢ় -> র
 * - Semi-vowels / Affricates: য়, য -> জ
 * - Stops: ৎ -> ত
 */
export function normalizeBengaliDiacritics(text: string): string {
  if (!text) return '';
  const base = normalizeBengaliUnicode(text);

  return base
    // Vowels
    .replace(/ী/g, 'ি')
    .replace(/ঈ/g, 'ই')
    .replace(/ূ/g, 'ু')
    .replace(/ঊ/g, 'উ')
    .replace(/ৃ/g, 'রি')
    .replace(/ৈ/g, 'ই')
    .replace(/ৌ/g, 'উ')
    // Sibilants (শ, ষ, স -> স)
    .replace(/[শষস]/g, 'স')
    // Nasals (ণ, ন -> ন)
    .replace(/ণ/g, 'ন')
    // Candrabindu is an optional nasal diacritic; strip it so সিঁদল matches সিদল, শুঁটকি matches শুটকি
    .replace(/[ঁ]/g, '')
    // Anusvara (ং, ঙ, ঞ -> ং)
    .replace(/[ংঙঞ]/g, 'ং')
    // Liquids / Flaps (ড়, ঢ় -> র)
    .replace(/[ড়ঢ়]/g, 'র')
    // Semivowels (য়, য -> জ)
    .replace(/[য়য]/g, 'জ')
    // Khanda Ta (ৎ -> ত)
    .replace(/ৎ/g, 'ত')
    // Conjunct simplification (ক্ষ -> খ, জ্ঞ -> গ)
    .replace(/ক্ষ/g, 'খ')
    .replace(/জ্ঞ/g, 'গ');
}

/**
 * Relaxed orthographic normalization for regional hill tract dialects:
 * - Vowel flexibility: 'ে' and 'ৈ' map to 'ি' (so সেদল matches সিদল)
 * - 'ো' and 'ৌ' are relaxed (so সিদোল matches সিদল)
 * - Sibilants and nasals unified
 */
export function normalizeBengaliRelaxed(text: string): string {
  if (!text) return '';
  return normalizeBengaliDiacritics(text)
    .replace(/[েৈ]/g, 'ি')
    .replace(/[োৌ]/g, '');
}

/**
 * Aggressive regional dialect normalizer:
 * - Unifies Ch/Chh (চ, ছ) with Sibilants (স, শ, ষ) and Aspirates (হ)
 *   so regional pronunciations like "চুটকি" / "সুটকি" / "শুটকি" map together.
 */
export function normalizeBengaliDialect(text: string): string {
  if (!text) return '';
  return normalizeBengaliRelaxed(text)
    .replace(/[চছ]/g, 'স')
    .replace(/[শষস]/g, 'হ');
}

// ----------------------------------------------------
// 3. BANGLISH / LATIN TRANSLITERATION TO PHONETIC CODE
// ----------------------------------------------------

/**
 * Reduces English/Banglish latin text into a canonical phonetic representation.
 * Handles variations like:
 * - "shidol", "sidol", "hidol", "sitol"
 * - "shutki", "sutki", "shutak"
 * - "morich", "moris", "chili"
 * - "holud", "halud", "holut"
 */
export function transliterateBanglishToPhonetic(text: string): string {
  if (!text) return '';
  let str = text.toLowerCase().trim();

  // Multi-char clusters first
  str = str
    .replace(/sh|ch|kh|gh|jh|th|dh|ph|bh|rh|ng/g, (match) => {
      switch (match) {
        case 'sh': return 'S';
        case 'ch': return 'C';
        case 'kh': return 'K';
        case 'gh': return 'G';
        case 'jh': return 'J';
        case 'th': return 'T';
        case 'dh': return 'D';
        case 'ph': return 'P';
        case 'bh': return 'B';
        case 'rh': return 'R';
        case 'ng': return 'N';
        default: return match;
      }
    })
    // Individual consonants & common equivalents
    .replace(/[sz]/g, 'S')
    .replace(/[ckq]/g, 'K')
    .replace(/[td]/g, (m) => m === 't' ? 'T' : 'D')
    .replace(/[pb]/g, (m) => m === 'p' ? 'P' : 'B')
    .replace(/[fv]/g, 'P')
    .replace(/[jgy]/g, (m) => m === 'j' ? 'J' : m === 'g' ? 'G' : 'I')
    .replace(/[w]/g, 'B')
    .replace(/[r]/g, 'R')
    .replace(/[l]/g, 'L')
    .replace(/[m]/g, 'M')
    .replace(/[n]/g, 'N')
    .replace(/[h]/g, 'H')
    // Vowels
    .replace(/ee|ea|i/g, 'I')
    .replace(/oo|ou|u/g, 'U')
    .replace(/ai|ay|ae/g, 'E')
    .replace(/[e]/g, 'E')
    .replace(/[ao]/g, 'A');

  return str.toUpperCase();
}

// ----------------------------------------------------
// 4. BENGALI PHONETIC FINGERPRINT (SOUNDEX/METAPHONE)
// ----------------------------------------------------

export interface BengaliPhoneticResult {
  primary: string;
  dialectal: string[];
  consonantSkeleton: string;
  dialectalSkeletons: string[];
}

/**
 * Converts a Bengali or Banglish token into a canonical phonetic code.
 * Also generates dialectal variants (notably S <-> H and C <-> S/H regional shifts
 * in Chittagong and Hill Tracts dialects where 'স'/'শ' is spoken as 'হ' or 'চ').
 */
export function getBengaliPhoneticFingerprint(word: string): BengaliPhoneticResult {
  if (!word) {
    return { primary: '', dialectal: [], consonantSkeleton: '', dialectalSkeletons: [] };
  }

  const getConsonantSkeleton = (s: string) => s.replace(/[AEIOU]/g, '');

  const isLatin = /^[a-z0-9]+$/i.test(word.replace(/[^a-z0-9]/gi, ''));
  if (isLatin) {
    const latinPhonetic = transliterateBanglishToPhonetic(word);
    const dialectal: string[] = [];
    if (latinPhonetic.startsWith('S')) {
      dialectal.push('H' + latinPhonetic.slice(1));
      dialectal.push('C' + latinPhonetic.slice(1));
    } else if (latinPhonetic.startsWith('H')) {
      dialectal.push('S' + latinPhonetic.slice(1));
      dialectal.push('C' + latinPhonetic.slice(1));
    } else if (latinPhonetic.startsWith('C')) {
      dialectal.push('S' + latinPhonetic.slice(1));
      dialectal.push('H' + latinPhonetic.slice(1));
    }

    const consonantSkeleton = getConsonantSkeleton(latinPhonetic);
    const dialectalSkeletons: string[] = [];
    if (consonantSkeleton.startsWith('S')) {
      dialectalSkeletons.push('H' + consonantSkeleton.slice(1), 'C' + consonantSkeleton.slice(1));
    } else if (consonantSkeleton.startsWith('H')) {
      dialectalSkeletons.push('S' + consonantSkeleton.slice(1), 'C' + consonantSkeleton.slice(1));
    } else if (consonantSkeleton.startsWith('C')) {
      dialectalSkeletons.push('S' + consonantSkeleton.slice(1), 'H' + consonantSkeleton.slice(1));
    }

    return { primary: latinPhonetic, dialectal, consonantSkeleton, dialectalSkeletons };
  }

  // Bengali script processing
  const normalized = normalizeBengaliDiacritics(word);
  let code = '';

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    switch (char) {
      // Sibilants
      case 'স':
      case 'শ':
      case 'ষ':
        code += 'S';
        break;
      case 'হ':
        code += 'H';
        break;
      // Velars
      case 'ক':
      case 'খ':
        code += 'K';
        break;
      case 'গ':
      case 'ঘ':
        code += 'G';
        break;
      // Palatals / Affricates
      case 'চ':
      case 'ছ':
        code += 'C';
        break;
      case 'জ':
      case 'ঝ':
        code += 'J';
        break;
      // Retroflex & Dental Stops
      case 'ট':
      case 'ঠ':
      case 'ত':
      case 'থ':
        code += 'T';
        break;
      case 'ড':
      case 'ঢ':
      case 'দ':
      case 'ধ':
        code += 'D';
        break;
      // Labials
      case 'প':
      case 'ফ':
        code += 'P';
        break;
      case 'ব':
      case 'ভ':
        code += 'B';
        break;
      // Nasals
      case 'ন':
      case 'ণ':
        code += 'N';
        break;
      case 'ম':
        code += 'M';
        break;
      case 'ং':
        code += 'N';
        break;
      // Liquids
      case 'র':
      case 'ড়':
      case 'ঢ়':
        code += 'R';
        break;
      case 'ল':
        code += 'L';
        break;
      // Vowel signs & independent vowels
      case 'ি':
      case 'ী':
      case 'ই':
      case 'ঈ':
        code += 'I';
        break;
      case 'ু':
      case 'ূ':
      case 'উ':
      case 'ঊ':
        code += 'U';
        break;
      case 'ে':
      case 'এ':
        code += 'E';
        break;
      case 'ো':
      case 'ও':
        code += 'O';
        break;
      case 'া':
      case 'আ':
      case 'অ':
        code += 'A';
        break;
      default:
        // skip non-phonetic signs
        break;
    }
  }

  // Deduplicate consecutive identical phonetic codes (e.g., KK -> K)
  let deduplicated = '';
  for (let i = 0; i < code.length; i++) {
    if (i === 0 || code[i] !== code[i - 1]) {
      deduplicated += code[i];
    }
  }

  // Consonant skeleton (strip vowels [AEIOU])
  const consonantSkeleton = getConsonantSkeleton(deduplicated);

  // Dialectal regional shifts (Chittagong / Hill Tracts S <-> H and C <-> S/H shifts)
  const dialectal: string[] = [];
  const dialectalSkeletons: string[] = [];

  const addVariants = (prefix: string, rest: string, list: string[]) => {
    list.push(prefix + rest);
  };

  if (deduplicated.startsWith('S')) {
    addVariants('H', deduplicated.slice(1), dialectal);
    addVariants('C', deduplicated.slice(1), dialectal);
  } else if (deduplicated.startsWith('H')) {
    addVariants('S', deduplicated.slice(1), dialectal);
    addVariants('C', deduplicated.slice(1), dialectal);
  } else if (deduplicated.startsWith('C')) {
    addVariants('S', deduplicated.slice(1), dialectal);
    addVariants('H', deduplicated.slice(1), dialectal);
  }

  if (consonantSkeleton.startsWith('S')) {
    addVariants('H', consonantSkeleton.slice(1), dialectalSkeletons);
    addVariants('C', consonantSkeleton.slice(1), dialectalSkeletons);
  } else if (consonantSkeleton.startsWith('H')) {
    addVariants('S', consonantSkeleton.slice(1), dialectalSkeletons);
    addVariants('C', consonantSkeleton.slice(1), dialectalSkeletons);
  } else if (consonantSkeleton.startsWith('C')) {
    addVariants('S', consonantSkeleton.slice(1), dialectalSkeletons);
    addVariants('H', consonantSkeleton.slice(1), dialectalSkeletons);
  }

  for (const d of dialectal) {
    const sk = getConsonantSkeleton(d);
    if (sk && !dialectalSkeletons.includes(sk)) dialectalSkeletons.push(sk);
  }

  return { primary: deduplicated, dialectal, consonantSkeleton, dialectalSkeletons };
}

// ----------------------------------------------------
// 5. FUZZY STRING DISTANCE & SIMILARITY
// ----------------------------------------------------

/**
 * Computes Damerau-Levenshtein distance (insert, delete, substitute, transpose).
 */
export function damerauLevenshteinDistance(source: string, target: string): number {
  if (!source) return target ? target.length : 0;
  if (!target) return source.length;
  if (source === target) return 0;

  const sLen = source.length;
  const tLen = target.length;
  const d: number[][] = [];

  for (let i = 0; i <= sLen; i++) {
    d[i] = [];
    d[i][0] = i;
  }
  for (let j = 0; j <= tLen; j++) {
    d[0][j] = j;
  }

  for (let i = 1; i <= sLen; i++) {
    for (let j = 1; j <= tLen; j++) {
      const cost = source[i - 1] === target[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1, // deletion
        d[i][j - 1] + 1, // insertion
        d[i - 1][j - 1] + cost // substitution
      );

      // Transposition
      if (i > 1 && j > 1 && source[i - 1] === target[j - 2] && source[i - 2] === target[j - 1]) {
        d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + cost);
      }
    }
  }

  return d[sLen][tLen];
}

/**
 * Computes N-gram Dice coefficient similarity (0.0 to 1.0).
 */
export function ngramDiceSimilarity(str1: string, str2: string, n = 2): number {
  if (!str1 || !str2) return 0;
  if (str1 === str2) return 1;

  if (str1.length < n || str2.length < n) {
    return str1.includes(str2) || str2.includes(str1) ? 0.75 : 0;
  }

  const getNGrams = (s: string) => {
    const grams = new Map<string, number>();
    for (let i = 0; i <= s.length - n; i++) {
      const g = s.substring(i, i + n);
      grams.set(g, (grams.get(g) || 0) + 1);
    }
    return grams;
  };

  const grams1 = getNGrams(str1);
  const grams2 = getNGrams(str2);

  let intersection = 0;
  grams1.forEach((count, gram) => {
    if (grams2.has(gram)) {
      intersection += Math.min(count, grams2.get(gram)!);
    }
  });

  const total = (str1.length - n + 1) + (str2.length - n + 1);
  return total > 0 ? (2 * intersection) / total : 0;
}

// ----------------------------------------------------
// 6. STOP WORDS CLEANER
// ----------------------------------------------------

const BANGLA_STOP_WORDS = new Set([
  'আমার', 'আপনার', 'তার', 'আমাদের', 'চাই', 'লাগবে', 'দরকার', 'প্রয়োজন', 'আছে',
  'কি', 'কী', 'না', 'বলো', 'বলুন', 'কত', 'দাম', 'টাকা', 'পণ্য', 'আইটেম', 'একটু',
  'দেখা', 'দেখাও', 'দেখান', 'খুঁজছি', 'খুঁজে', 'দাও', 'দিন', 'কোনো', 'কোথায়',
  'ভালো', 'সেরা', 'উত্তম', 'জরুরি', 'আজ', 'আগামীকাল', 'এখন', 'দয়া', 'করে',
  'help', 'need', 'want', 'please', 'details', 'show', 'find', 'get', 'give'
]);

/**
 * Filters conversational filler tokens to extract pure search candidates.
 */
export function extractCleanSearchTokens(query: string): string[] {
  const normalized = normalizeBengaliUnicode(query);
  const tokens = normalized.split(/[\s,./?!+=_-]+/).filter(t => t.length >= 2);
  const meaningful = tokens.filter(t => !BANGLA_STOP_WORDS.has(t));
  return meaningful.length > 0 ? meaningful : tokens;
}

// ----------------------------------------------------
// 6b. BENGALI & REGIONAL DIALECT SYNONYMS CLUSTERS
// ----------------------------------------------------

export const BENGALI_SYNONYMS: Record<string, string[]> = {
  // সিদল / শুঁটকি / dry fish
  'সিদল': ['সিঁদল', 'সিদোল', 'সেদল', 'সেদোল', 'হিদল', 'হিদোল', 'শুঁটকি', 'শুটকি', 'সুটকি', 'চুটকি', 'চুটাক', 'শুটাক', 'শুড়ি শুটকি', 'হুটকি', 'হুতকি', 'চেপা', 'sidol', 'shidol', 'sedol', 'shutki', 'dry fish'],
  'সেদল': ['সিঁদল', 'সিদোল', 'সিদল', 'সেদোল', 'হিদল', 'হিদোল', 'শুঁটকি', 'শুটকি', 'সুটকি', 'চুটকি', 'চুটাক', 'শুটাক', 'শুড়ি শুটকি', 'হুটকি', 'হুতকি', 'চেপা', 'sidol', 'shidol', 'sedol', 'shutki', 'dry fish'],
  'সিঁদল': ['সিদল', 'সিদোল', 'সেদল', 'সেদোল', 'হিদল', 'হিদোল', 'শুঁটকি', 'শুটকি', 'সুটকি', 'চুটকি', 'চুটাক', 'শুটাক', 'শুড়ি শুটকি', 'হুটকি', 'হুতকি', 'চেপা', 'sidol', 'shidol', 'sedol', 'shutki', 'dry fish'],
  'সিদোল': ['সিদল', 'সেদল', 'সিঁদল', 'সেদোল', 'হিদল', 'হিদোল', 'শুঁটকি', 'শুটকি', 'সুটকি', 'চুটকি', 'চুটাক', 'শুটাক', 'শুড়ি শুটকি', 'হুটকি', 'হুতকি', 'চেপা', 'sidol', 'shidol', 'sedol', 'shutki', 'dry fish'],
  'হিদল': ['সিদোল', 'সিদল', 'সেদল', 'সিঁদল', 'সেদোল', 'হিদোল', 'শুঁটকি', 'শুটকি', 'সুটকি', 'চুটকি', 'চুটাক', 'শুটাক', 'শুড়ি শুটকি', 'হুটকি', 'sidol', 'shidol', 'shutki'],
  'হিদোল': ['সিদোল', 'সিদল', 'সেদল', 'সিঁদল', 'সেদোল', 'হিদল', 'শুঁটকি', 'শুটকি', 'সুটকি', 'চুটকি', 'চুটাক', 'শুটাক', 'শুড়ি শুটকি', 'হুটকি', 'sidol', 'shidol', 'shutki'],
  'চুটকি': ['শুটকি', 'শুঁটকি', 'শুটাক', 'সুটকি', 'চুটাক', 'শুড়ি শুটকি', 'হুটকি', 'সিদোল', 'সিদল', 'সেদল', 'shutki', 'chutki', 'dry fish'],
  'শুটকি': ['শুঁটকি', 'শুটাক', 'সুটকি', 'চুটকি', 'চুটাক', 'শুড়ি শুটকি', 'হুটকি', 'সিদোল', 'সিদল', 'সেদল', 'shutki', 'dry fish'],
  'শুঁটকি': ['শুটকি', 'শুটাক', 'সুটকি', 'চুটকি', 'চুটাক', 'শুড়ি শুটকি', 'হুটকি', 'সিদোল', 'সিদল', 'সেদল', 'shutki', 'dry fish'],
  'সুটকি': ['শুঁটকি', 'শুটকি', 'শুটাক', 'চুটকি', 'চুটাক', 'শুড়ি শুটকি', 'হুটকি', 'সিদোল', 'সিদল', 'সেদল', 'shutki', 'dry fish'],
  'শুটাক': ['শুঁটকি', 'শুটকি', 'চিংড়ি শুটাক', 'সুটাক', 'চুটাক', 'চুটকি', 'সুটকি', 'shutak', 'shutki'],
  'চুটাক': ['শুঁটকি', 'শুটকি', 'চিংড়ি শুটাক', 'সুটাক', 'শুটাক', 'চুটকি', 'সুটকি', 'shutak', 'shutki'],
  // সরিষা তেল / mustard oil
  'সরিষা': ['সরিষার তেল', 'সরিষা তেল', 'সরিষা তৈল', 'শোরিষার তেল', 'শোরিষা তেল', 'mustard oil', 'oil'],
  'সরিষা তেল': ['সরিষা', 'সরিষার তেল', 'সরিষা তৈল', 'mustard oil'],
  'তেল': ['সরিষার তেল', 'সরিষা তেল', 'সরিষা তৈল', 'ঘানি ভাঙা তেল', 'mustard oil', 'oil'],
  // গুড় / Jaggery
  'গুড়': ['আখের গুড়', 'আকের গুড়', 'পাহাড়ি গুড়', 'গুঁড়ো', 'jaggery', 'gur'],
  'আখের গুড়': ['গুড়', 'আকের গুড়', 'পাহাড়ি গুড়', 'jaggery', 'gur'],
  // হলুদ / Turmeric
  'হলুদ': ['পাহাড়ি হলুদ', 'জুম হলুদ', 'হলুদের গুঁড়া', 'turmeric', 'haldi'],
  // মরিচ / Chili
  'মরিচ': ['পাহাড়ি মরিচ', 'শুকনা মরিচ', 'মরিচের গুঁড়া', 'ঝাল', 'chili', 'pepper'],
  // মধু / Honey
  'মধু': ['পাহাড়ি মধু', 'খাঁটি মধু', 'জংলি মধু', 'honey', 'raw honey'],
  // চাল / Rice
  'চাল': ['বিনি চাল', 'জুমের চাল', 'জুমি চাল', 'বিরই চাল', 'আতপ চাল', 'rice'],
};

// ----------------------------------------------------
// 7. HYBRID MULTI-TIER MATCHING SCORE
// ----------------------------------------------------

export interface HybridMatchResult {
  score: number; // 0 - 100
  confidence: number; // 0.0 - 1.0
  matchType: 'exact' | 'normalized' | 'phonetic' | 'fuzzy' | 'token' | 'none';
  matchedQueryToken?: string;
  matchedTargetToken?: string;
  explanation?: string;
}

/**
 * Calculates a generalized hybrid match score between target text and query.
 * Works across ANY product name, service, or seeker without hardcoded rules.
 */
export function matchQueryAgainstTarget(
  targetText: string,
  rawQuery: string,
  targetEnglish?: string,
  targetCategory?: string
): HybridMatchResult {
  if (!targetText || !rawQuery) {
    return { score: 0, confidence: 0, matchType: 'none' };
  }

  const queryNorm = normalizeBengaliUnicode(rawQuery);
  const targetNorm = normalizeBengaliUnicode(targetText);
  const targetEnNorm = targetEnglish ? normalizeBengaliUnicode(targetEnglish) : '';
  const targetCatNorm = targetCategory ? normalizeBengaliUnicode(targetCategory) : '';

  // Tier 1: Exact Substring Match
  if (targetNorm.includes(queryNorm) || queryNorm.includes(targetNorm)) {
    return {
      score: 100,
      confidence: 1.0,
      matchType: 'exact',
      explanation: 'সরাসরি নামের সম্পূর্ণ মিল পাওয়া গেছে।'
    };
  }

  if (targetEnNorm && (targetEnNorm.includes(queryNorm) || queryNorm.includes(targetEnNorm))) {
    return {
      score: 95,
      confidence: 0.95,
      matchType: 'exact',
      explanation: 'ইংরেজি নামের সাথে সম্পূর্ণ মিল পাওয়া গেছে।'
    };
  }

  // Tier 2: Normalized Match (diacritics & orthographic variation)
  const targetDiacritics = normalizeBengaliDiacritics(targetText);
  const queryDiacritics = normalizeBengaliDiacritics(rawQuery);

  if (targetDiacritics.includes(queryDiacritics) || queryDiacritics.includes(targetDiacritics)) {
    return {
      score: 88,
      confidence: 0.90,
      matchType: 'normalized',
      explanation: 'বানান ও বর্ণ সমতায় মিল পাওয়া গেছে।'
    };
  }

  // Tier 3: Relaxed Vowel & Hill-Tracts Regional Dialect Normalization (e.g. সেদল <-> সিদোল)
  const targetRelaxed = normalizeBengaliRelaxed(targetText);
  const queryRelaxed = normalizeBengaliRelaxed(rawQuery);

  if (queryRelaxed.length >= 2 && (targetRelaxed.includes(queryRelaxed) || (queryRelaxed.length >= 3 && targetRelaxed.split(' ').some(w => w.includes(queryRelaxed) || queryRelaxed.includes(w))))) {
    return {
      score: 86,
      confidence: 0.88,
      matchType: 'normalized',
      matchedQueryToken: rawQuery,
      matchedTargetToken: targetText,
      explanation: `আঞ্চলিক উপভাষা ও স্বরধ্বনি সমতায় মিল (Dialect Match): "${rawQuery}" ⇄ "${targetText}"`
    };
  }

  // Tier 4: Regional Sibilant/Affricate Dialect Normalization (e.g. চুটকি <-> শুটকি)
  const targetDialect = normalizeBengaliDialect(targetText);
  const queryDialect = normalizeBengaliDialect(rawQuery);

  if (queryDialect.length >= 3 && (targetDialect.includes(queryDialect) || targetDialect.split(' ').some(w => w.includes(queryDialect) || queryDialect.includes(w)))) {
    return {
      score: 84,
      confidence: 0.85,
      matchType: 'phonetic',
      matchedQueryToken: rawQuery,
      matchedTargetToken: targetText,
      explanation: `আঞ্চলিক উচ্চারণগত সাদৃশ্য (Regional Phonetic Match): "${rawQuery}" ⇄ "${targetText}"`
    };
  }

  // Token-level Phonetic, Consonant Skeleton, Synonym & Fuzzy Examination
  const queryTokens = extractCleanSearchTokens(rawQuery);
  const targetTokens = extractCleanSearchTokens(`${targetText} ${targetEnglish || ''}`);

  let highestScore = 0;
  let bestMatchType: HybridMatchResult['matchType'] = 'none';
  let bestQToken = '';
  let bestTToken = '';
  let bestExplanation = '';

  for (const qToken of queryTokens) {
    const qPhonetic = getBengaliPhoneticFingerprint(qToken);
    const qDia = normalizeBengaliDiacritics(qToken);
    const qRel = normalizeBengaliRelaxed(qToken);
    const qDiaDialect = normalizeBengaliDialect(qToken);

    // Check synonym dictionary for query token
    const qSynonyms = BENGALI_SYNONYMS[qToken] || BENGALI_SYNONYMS[qDia] || [];

    for (const tToken of targetTokens) {
      const tDia = normalizeBengaliDiacritics(tToken);
      const tRel = normalizeBengaliRelaxed(tToken);
      const tDiaDialect = normalizeBengaliDialect(tToken);
      const tPhonetic = getBengaliPhoneticFingerprint(tToken);

      // 1. Token exact match
      if (tToken === qToken || tDia === qDia) {
        if (highestScore < 85) {
          highestScore = 85;
          bestMatchType = 'token';
          bestQToken = qToken;
          bestTToken = tToken;
          bestExplanation = `শব্দ মিলেছে: "${tToken}"`;
        }
        continue;
      }

      // 2. Regional Synonym match (e.g. সেদল -> সিদোল, চুটকি -> শুটাক)
      const isSynonym =
        qSynonyms.includes(tToken) ||
        qSynonyms.includes(tDia) ||
        (BENGALI_SYNONYMS[tToken] && BENGALI_SYNONYMS[tToken].includes(qToken)) ||
        (BENGALI_SYNONYMS[tDia] && BENGALI_SYNONYMS[tDia].includes(qToken));

      if (isSynonym) {
        if (highestScore < 85) {
          highestScore = 85;
          bestMatchType = 'phonetic';
          bestQToken = qToken;
          bestTToken = tToken;
          bestExplanation = `আঞ্চলিক সমার্থক ও উপভাষাগত মিল (Synonym Match): "${qToken}" ⇄ "${tToken}"`;
        }
        continue;
      }

      // 3. Relaxed diacritic match (e.g. সেদল <-> সিদোল -> relaxed "সিদল" === "সিদল")
      if (qRel === tRel || (qRel.length >= 3 && tRel.length >= 3 && (tRel.includes(qRel) || qRel.includes(tRel)))) {
        if (highestScore < 82) {
          highestScore = 82;
          bestMatchType = 'normalized';
          bestQToken = qToken;
          bestTToken = tToken;
          bestExplanation = `আঞ্চলিক বানান ও স্বরধ্বনিতে মিল (Dialect Match): "${qToken}" ⇄ "${tToken}"`;
        }
        continue;
      }

      // 4. Dialectal normalized match (e.g. চুটকি <-> শুটকি -> dialect "হুটকি" === "হুটকি")
      if (qDiaDialect.length >= 3 && (qDiaDialect === tDiaDialect || tDiaDialect.includes(qDiaDialect) || qDiaDialect.includes(tDiaDialect))) {
        if (highestScore < 80) {
          highestScore = 80;
          bestMatchType = 'phonetic';
          bestQToken = qToken;
          bestTToken = tToken;
          bestExplanation = `আঞ্চলিক ধ্বনিগত মিল (Phonetic Dialect Match): "${qToken}" ⇄ "${tToken}"`;
        }
        continue;
      }

      // 5. Phonetic key match (including dialectal S <-> H and C <-> S/H)
      const hasPhoneticMatch =
        (qPhonetic.primary && qPhonetic.primary === tPhonetic.primary) ||
        tPhonetic.dialectal.includes(qPhonetic.primary) ||
        qPhonetic.dialectal.includes(tPhonetic.primary);

      if (hasPhoneticMatch && qPhonetic.primary.length >= 2) {
        if (highestScore < 78) {
          highestScore = 78;
          bestMatchType = 'phonetic';
          bestQToken = qToken;
          bestTToken = tToken;
          bestExplanation = `উচ্চারণগত মিল (Phonetic Match): "${qToken}" ⇄ "${tToken}"`;
        }
        continue;
      }

      // 6. Consonant Skeleton Match (stripping vowels, e.g. SEDL -> SDL === SIDOL -> SDL, CUTKI -> CTK === SUTKI -> STK)
      const hasSkeletonMatch =
        (qPhonetic.consonantSkeleton && qPhonetic.consonantSkeleton === tPhonetic.consonantSkeleton) ||
        tPhonetic.dialectalSkeletons.includes(qPhonetic.consonantSkeleton) ||
        qPhonetic.dialectalSkeletons.includes(tPhonetic.consonantSkeleton);

      if (hasSkeletonMatch && qPhonetic.consonantSkeleton.length >= 2) {
        if (highestScore < 76) {
          highestScore = 76;
          bestMatchType = 'phonetic';
          bestQToken = qToken;
          bestTToken = tToken;
          bestExplanation = `ব্যঞ্জনধ্বনি কাঠামো মিল (Consonant Skeleton Match): "${qToken}" ⇄ "${tToken}"`;
        }
        continue;
      }

      // 7. Fuzzy Levenshtein Distance (with leading character guard for short words)
      const minLen = Math.min(qToken.length, tToken.length);
      if (minLen >= 3) {
        // Guard against false positives on short 3-letter words like "ফুড" matching "গুড়"
        if (minLen === 3 && qDia[0] !== tDia[0]) {
          continue;
        }

        const dist = damerauLevenshteinDistance(qDia, tDia);
        const maxAllowedDist = minLen <= 4 ? 1 : minLen <= 7 ? 2 : 3;

        if (dist <= maxAllowedDist) {
          const fuzzyScore = Math.max(50, 72 - dist * 8);
          if (highestScore < fuzzyScore) {
            highestScore = fuzzyScore;
            bestMatchType = 'fuzzy';
            bestQToken = qToken;
            bestTToken = tToken;
            bestExplanation = `বানানের কাছাকাছি মিল (Fuzzy Match, ব্যবধান ${dist}): "${tToken}"`;
          }
          continue;
        }

        // N-Gram Dice Similarity
        const dice = ngramDiceSimilarity(qDia, tDia, 2);
        if (dice >= 0.60) {
          const diceScore = Math.round(50 + dice * 20);
          if (highestScore < diceScore) {
            highestScore = diceScore;
            bestMatchType = 'fuzzy';
            bestQToken = qToken;
            bestTToken = tToken;
            bestExplanation = `অক্ষর সাদৃশ্য (${Math.round(dice * 100)}% মিল): "${tToken}"`;
          }
        }
      }
    }

    // Category bonus check
    if (targetCatNorm && targetCatNorm.includes(qToken)) {
      if (highestScore < 45) {
        highestScore = 45;
        bestMatchType = 'token';
        bestExplanation = `ক্যাটাগরি মিল: "${targetCategory}"`;
      }
    }
  }

  return {
    score: highestScore,
    confidence: highestScore > 0 ? highestScore / 100 : 0,
    matchType: bestMatchType,
    matchedQueryToken: bestQToken,
    matchedTargetToken: bestTToken,
    explanation: bestExplanation,
  };
}
