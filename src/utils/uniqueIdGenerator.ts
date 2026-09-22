import { getLocationCodes } from '../data/locationMaster';
export * from '../data/locationMaster';

// District to 3-Letter Code mapping for Bangladesh (64 Districts)
export const DISTRICT_CODE_MAP: Record<string, string> = {
  // Chittagong Division
  'খাগড়াছড়ি': 'KHC',
  'খাগড়াছড়ি': 'KHC',
  'Khagrachhari': 'KHC',
  'Khagrachari': 'KHC',
  'KHG': 'KHC',
  'KHC': 'KHC',
  'রাঙ্গামাটি': 'RNG',
  'Rangamati': 'RNG',
  'বান্দরবান': 'BND',
  'Bandarban': 'BND',
  'চট্টগ্রাম': 'CTG',
  'Chittagong': 'CTG',
  'Chattogram': 'CTG',
  'কক্সবাজার': 'CXB',
  'Cox\'s Bazar': 'CXB',
  'কুমিল্লা': 'COM',
  'Comilla': 'COM',
  'Cumilla': 'COM',
  'ফেনী': 'FEN',
  'Feni': 'FEN',
  'নোয়াখালী': 'NOA',
  'নোয়াখালী': 'NOA',
  'Noakhali': 'NOA',
  'লক্ষ্মীপুর': 'LAK',
  'Lakshmipur': 'LAK',
  'চাঁদপুর': 'CHN',
  'Chandpur': 'CHN',
  'ব্রাহ্মণবাড়িয়া': 'BRB',
  'ব্রাহ্মণবাড়িয়া': 'BRB',
  'Brahmanbaria': 'BRB',

  // Dhaka Division
  'ঢাকা': 'DHK',
  'Dhaka': 'DHK',
  'গাজীপুর': 'GAZ',
  'Gazipur': 'GAZ',
  'নারায়ণগঞ্জ': 'NAR',
  'নারায়ণগঞ্জ': 'NAR',
  'Narayanganj': 'NAR',
  'টাঙ্গাইল': 'TAN',
  'Tangail': 'TAN',
  'নরসিংদী': 'NSD',
  'Narsingdi': 'NSD',
  'মানিকগঞ্জ': 'MAN',
  'Manikganj': 'MAN',
  'মুন্সিগঞ্জ': 'MUN',
  'Munshiganj': 'MUN',
  'ফরিদপুর': 'FAR',
  'Faridpur': 'FAR',
  'মাদারীপুর': 'MAD',
  'Madaripur': 'MAD',
  'গোপালগঞ্জ': 'GOP',
  'Gopalganj': 'GOP',
  'রাজবাড়ী': 'RAJ',
  'রাজবাড়ী': 'RAJ',
  'Rajbari': 'RAJ',
  'শরীয়তপুর': 'SHA',
  'শরীয়তপুর': 'SHA',
  'Shariatpur': 'SHA',
  'কিশোরগঞ্জ': 'KIS',
  'Kishoreganj': 'KIS',

  // Sylhet Division
  'সিলেট': 'SYL',
  'Sylhet': 'SYL',
  'মৌলভীবাজার': 'MOU',
  'Moulvibazar': 'MOU',
  'হবিগঞ্জ': 'HAB',
  'Habiganj': 'HAB',
  'সুনামগঞ্জ': 'SUN',
  'Sunamganj': 'SUN',

  // Rajshahi Division
  'রাজশাহী': 'RAJ',
  'Rajshahi': 'RAJ',
  'বগুড়া': 'BOG',
  'বগুড়া': 'BOG',
  'Bogra': 'BOG',
  'Bogura': 'BOG',
  'পাবনা': 'PAB',
  'Pabna': 'PAB',
  'সিরাজগঞ্জ': 'SIR',
  'Sirajganj': 'SIR',
  'নওগাঁ': 'NAO',
  'Naogaon': 'NAO',
  'নাটোর': 'NAT',
  'Natore': 'NAT',
  'চাঁপাইনবাবগঞ্জ': 'CPN',
  'Chapainawabganj': 'CPN',
  'জয়পুরহাট': 'JOY',
  'জয়পুরহাট': 'JOY',
  'Joypurhat': 'JOY',

  // Khulna Division
  'খুলনা': 'KHL',
  'Khulna': 'KHL',
  'যশোর': 'JAS',
  'Jashore': 'JAS',
  'Jessore': 'JAS',
  'সাতক্ষীরা': 'SAT',
  'Satkhira': 'SAT',
  'বাগেরহাট': 'BAG',
  'Bagerhat': 'BAG',
  'কুষ্টিয়া': 'KUS',
  'কুষ্টিয়া': 'KUS',
  'Kushtia': 'KUS',
  'চুয়াডাঙ্গা': 'CHU',
  'চুয়াডাঙ্গা': 'CHU',
  'Chuadanga': 'CHU',
  'মেহেরপুর': 'MEH',
  'Meherpur': 'MEH',
  'ঝিনাইদহ': 'JHE',
  'Jhenaidah': 'JHE',
  'মাগুরা': 'MAG',
  'Magura': 'MAG',
  'নড়াইল': 'NRL',
  'নড়াইল': 'NRL',
  'Narail': 'NRL',

  // Barishal Division
  'বরিশাল': 'BAR',
  'Barishal': 'BAR',
  'পটুয়াখালী': 'PAT',
  'পটুয়াখালী': 'PAT',
  'Patuakhali': 'PAT',
  'ভোলা': 'BHO',
  'Bhola': 'BHO',
  'পিরোজপুর': 'PIR',
  'Pirojpur': 'PIR',
  'বরগুনা': 'BRG',
  'Barguna': 'BRG',
  'ঝালকাঠি': 'JHA',
  'Jhalokathi': 'JHA',

  // Rangpur Division
  'রংপুর': 'RPR',
  'Rangpur': 'RPR',
  'দিনাজপুর': 'DIN',
  'Dinajpur': 'DIN',
  'গাইবান্ধা': 'GAI',
  'Gaibandha': 'GAI',
  'কুড়িগ্রাম': 'KUR',
  'কুড়িগ্রাম': 'KUR',
  'Kurigram': 'KUR',
  'লালমনিরহাট': 'LAL',
  'Lalmonirhat': 'LAL',
  'নীলফামারী': 'NIL',
  'Nilphamari': 'NIL',
  'পঞ্চগড়': 'PAN',
  'পঞ্চগড়': 'PAN',
  'Panchagarh': 'PAN',
  'ঠাকুরগাঁও': 'THA',
  'Thakurgaon': 'THA',

  // Mymensingh Division
  'ময়মনসিংহ': 'MYM',
  'ময়মনসিংহ': 'MYM',
  'Mymensingh': 'MYM',
  'জামালপুর': 'JAM',
  'Jamalpur': 'JAM',
  'নেত্রকোণা': 'NET',
  'নেত্রকোনা': 'NET',
  'Netrokona': 'NET',
  'শেরপুর': 'SHE',
  'Sherpur': 'SHE',
};

export const getDistrictCode = (districtName: string): string => {
  if (!districtName) return 'GEN';
  const clean = districtName.trim();
  return DISTRICT_CODE_MAP[clean] || 'GEN';
};

/**
 * Generates official Jhadimadi unique tracking IDs according to Phase 4 rules:
 * - Service Provider: S-[District Code]-[Serial] (e.g., S-RNG-001, S-KHG-001)
 * - Product Seller: V-[District Code]-[Serial] (e.g., V-RNG-001, V-KHG-001)
 */
export const generateUniqueId = (
  role: 'seller' | 'vendor' | 'professional' | 'service',
  district: string,
  serial?: number | string
): string => {
  const prefix = (role === 'seller' || role === 'vendor') ? 'V' : 'S';
  const distCode = getDistrictCode(district);
  
  let serialStr = '001';
  if (typeof serial === 'number') {
    serialStr = String(serial).padStart(3, '0');
  } else if (typeof serial === 'string' && serial.trim()) {
    // If it's already a numeric string or formatted
    const num = parseInt(serial.replace(/[^0-9]/g, ''), 10);
    serialStr = !isNaN(num) ? String(num).padStart(3, '0') : '001';
  } else {
    // Generate a random 3-digit serial between 001 and 999
    const rand = Math.floor(1 + Math.random() * 999);
    serialStr = String(rand).padStart(3, '0');
  }

  return `${prefix}-${distCode}-${serialStr}`;
};

/**
 * Generates automated location-based Unique ID (UID):
 * Format: [Role]-[Division Code]-[District Code]-[Thana Code]-[001]
 * - Role: M for Product Merchants (e.g., M-DH-DHA-MIR-001), S for Service Professionals (e.g., S-CG-KHG-SDR-001)
 * - Division Code: 2 letters uppercase (DH, CG, SY, RJ, KH, BA, RP, MY)
 * - District Code: 3 letters uppercase (DHA, KHG, RNG, BND, CTG, etc.)
 * - Thana/Upazila Code: 3 letters uppercase (MIR, SDR, GUL, UTT, DGH, etc.)
 * - Sequential Counter: 3-digit counter (001, 002, ...)
 */
export const generateMerchantOrServiceUID = (
  role: 'merchant' | 'seller' | 'vendor' | 'M' | 'service' | 'professional' | 'S',
  division: string = 'ঢাকা',
  district: string = 'ঢাকা',
  thanaOrUpazila: string = 'মিরপুর',
  counter?: number | string
): string => {
  const rolePrefix = (role === 'merchant' || role === 'seller' || role === 'vendor' || role === 'M') ? 'M' : 'S';
  const codes = getLocationCodes(division, district, thanaOrUpazila);

  // Normalize Division Code to 2 letters (e.g. DH, CG)
  let divCode = codes.divCode || 'DH';
  if (divCode.length > 2) divCode = divCode.slice(0, 2);

  // Normalize District Code (e.g. DHA for Dhaka, KHG for Khagrachhari)
  let distCode = codes.distCode || 'DHA';
  if (distCode === 'DHK') distCode = 'DHA'; // Format match for DHA

  // Normalize Thana / Upazila Code (e.g. MIR, SDR)
  let thanaCode = codes.upazilaCode || 'SDR';
  if (!thanaCode || thanaCode.length < 2) thanaCode = 'SDR';
  thanaCode = thanaCode.toUpperCase().slice(0, 3);

  let counterStr = '001';
  if (typeof counter === 'number') {
    counterStr = String(counter).padStart(3, '0');
  } else if (typeof counter === 'string' && counter.trim()) {
    const num = parseInt(counter.replace(/[^0-9]/g, ''), 10);
    counterStr = !isNaN(num) ? String(num).padStart(3, '0') : '001';
  } else {
    // Generate or get sequential counter
    const key = `jhadimadi_seq_m_${divCode}_${distCode}_${thanaCode}`;
    let current = 1;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        current = parseInt(saved, 10) + 1;
      }
      localStorage.setItem(key, String(current));
    } catch {
      current = Math.floor(1 + Math.random() * 99);
    }
    counterStr = String(current).padStart(3, '0');
  }

  return `${rolePrefix}-${divCode}-${distCode}-${thanaCode}-${counterStr}`;
};

/**
 * Generates automated location-based clean Unique ID (UID) matching Jhadimadi standard:
 * Format: JH-[RoleCode]-[DistrictCode]-[Counter]
 * Example: JH-S-DHK-001 (Product Seller in Dhaka)
 * Example: JH-P-CTG-002 (Service Provider in Chittagong)
 * Example: JH-M-KHG-003 (Permanent Member in Khagrachhari)
 */
export const generateJhadimadiCleanUID = (
  role: 'seller' | 'merchant' | 'service' | 'provider' | 'permanent' | 'member' | string,
  district: string = 'Khagrachhari',
  counter?: number | string
): string => {
  let roleCode = 'S';
  const r = role.toLowerCase();
  if (r.includes('seller') || r.includes('merchant') || r === 's') {
    roleCode = 'S';
  } else if (r.includes('service') || r.includes('provider') || r === 'p') {
    roleCode = 'P';
  } else if (r.includes('perm') || r.includes('member') || r === 'm') {
    roleCode = 'M';
  }

  const distCode = DISTRICT_CODE_MAP[district] || DISTRICT_CODE_MAP[district.trim()] || 'KHG';

  let counterStr = '001';
  if (typeof counter === 'number') {
    counterStr = String(counter).padStart(3, '0');
  } else if (typeof counter === 'string' && counter.trim()) {
    const num = parseInt(counter.replace(/[^0-9]/g, ''), 10);
    counterStr = !isNaN(num) ? String(num).padStart(3, '0') : '001';
  } else {
    const key = `jhadimadi_clean_seq_${roleCode}_${distCode}`;
    let current = 1;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        current = parseInt(saved, 10) + 1;
      }
      localStorage.setItem(key, String(current));
    } catch {
      current = Math.floor(1 + Math.random() * 99);
    }
    counterStr = String(current).padStart(3, '0');
  }

  return `JH-${roleCode}-${distCode}-${counterStr}`;
};

/**
 * Generates an Auto-generated District Unique ID (e.g., KHC-001, CTG-002, DHA-003):
 */
export const generateDistrictUniqueId = (
  district: string = 'Khagrachhari',
  counter?: number | string
): string => {
  const distCode = DISTRICT_CODE_MAP[district] || DISTRICT_CODE_MAP[district.trim()] || 'KHC';
  let counterStr = '001';
  if (typeof counter === 'number') {
    counterStr = String(counter).padStart(3, '0');
  } else if (typeof counter === 'string' && counter.trim()) {
    const num = parseInt(counter.replace(/[^0-9]/g, ''), 10);
    counterStr = !isNaN(num) ? String(num).padStart(3, '0') : '001';
  } else {
    const key = `jhadimadi_dist_seq_${distCode}`;
    let current = 1;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        current = parseInt(saved, 10) + 1;
      }
      localStorage.setItem(key, String(current));
    } catch {
      current = Math.floor(1 + Math.random() * 99);
    }
    counterStr = String(current).padStart(3, '0');
  }
  return `${distCode}-${counterStr}`;
};

/**
 * Formats any existing user ID / member UID into a clean District Unique ID (e.g. KHC-001):
 */
export const formatToDistrictUniqueId = (uid?: string, district: string = 'Khagrachhari'): string => {
  if (!uid) return generateDistrictUniqueId(district, '001');
  const clean = uid.trim().toUpperCase();
  // Already in format like KHC-001 or CTG-002
  const directMatch = clean.match(/([A-Z]{3})-([0-9]{3})/);
  if (directMatch) {
    let code = directMatch[1];
    if (code === 'KHG') code = 'KHC';
    return `${code}-${directMatch[2]}`;
  }
  // If in JH-S-KHC-001 format
  const parts = clean.split('-');
  if (parts.length >= 3) {
    const lastPart = parts[parts.length - 1];
    const distPart = parts[parts.length - 2];
    const code = distPart === 'KHG' ? 'KHC' : (DISTRICT_CODE_MAP[distPart] || distPart);
    const num = parseInt(lastPart, 10);
    const numStr = !isNaN(num) ? String(num).padStart(3, '0') : '001';
    return `${code}-${numStr}`;
  }
  const distCode = DISTRICT_CODE_MAP[district] || 'KHC';
  return `${distCode}-001`;
};

/**
 * Mask phone number for privacy before order confirmation:
 * e.g., "01812345678" -> "018****-***78"
 */
export const maskPhoneNumber = (phone: string): string => {
  if (!phone) return '018****-***';
  const clean = phone.replace(/[^0-9]/g, '');
  if (clean.length < 7) return phone;
  const start = clean.slice(0, 3);
  const end = clean.slice(-2);
  return `${start}****-***${end}`;
};

/**
 * Mask exact address for privacy before order confirmation:
 * e.g. "Madhupur Bazar, House 24, Road 3, Khagrachari Sadar" -> "Madhupur Bazar, Khagrachari Sadar (Protected)"
 */
export const maskDetailedAddress = (area: string, upazila: string, district: string): string => {
  return `${area || 'স্থানীয় এলাকা'}, ${upazila || district} (সুরক্ষিত ও প্রাইভেট)`;
};

/**
 * Generates a structured ID for Permanent Member / Representative:
 * Format: [DIST]-[UPAZILA]-[SERIAL] (e.g., KHC-SADAR-001 or DHK-MIRPUR-001)
 */
export const generateRepresentativeStructuredId = (
  district: string = 'Khagrachhari',
  upazila: string = 'Sadar',
  counter?: number | string
): string => {
  const distCode = DISTRICT_CODE_MAP[district] || DISTRICT_CODE_MAP[district.trim()] || 'KHC';
  
  // Clean upazila name to a standard upper-case ASCII token
  let upazilaCode = 'SADAR';
  if (upazila) {
    const uClean = upazila.trim();
    if (uClean.includes('সদর') || uClean.toLowerCase().includes('sadar')) {
      upazilaCode = 'SADAR';
    } else if (uClean.includes('দীঘিনালা') || uClean.toLowerCase().includes('dighinala')) {
      upazilaCode = 'DIGHINALA';
    } else if (uClean.includes('পানছড়ি') || uClean.includes('পানছড়ি') || uClean.toLowerCase().includes('panchhari')) {
      upazilaCode = 'PANCHHARI';
    } else if (uClean.includes('মহালছড়ি') || uClean.includes('মহালছড়ি') || uClean.toLowerCase().includes('mahalchhari')) {
      upazilaCode = 'MAHALCHHARI';
    } else if (uClean.includes('মাটিরাঙ্গা') || uClean.toLowerCase().includes('matiranga')) {
      upazilaCode = 'MATIRANGA';
    } else if (uClean.includes('মানিকছড়ি') || uClean.includes('মানিকছড়ি') || uClean.toLowerCase().includes('manikchhari')) {
      upazilaCode = 'MANIKCHHARI';
    } else if (uClean.includes('রামগড়') || uClean.includes('রামগড়') || uClean.toLowerCase().includes('ramgarh')) {
      upazilaCode = 'RAMGARH';
    } else if (uClean.includes('গুইমারা') || uClean.toLowerCase().includes('guimara')) {
      upazilaCode = 'GUIMARA';
    } else if (uClean.includes('লক্ষ্মীছড়ি') || uClean.includes('লক্ষ্মীছড়ি') || uClean.toLowerCase().includes('lakshmichhari')) {
      upazilaCode = 'LAKSHMICHHARI';
    } else if (uClean.includes('বাঘাইছড়ি') || uClean.includes('বাঘাইছড়ি') || uClean.toLowerCase().includes('baghaichhari')) {
      upazilaCode = 'BAGHAICHHARI';
    } else if (uClean.includes('কাপ্তাই') || uClean.toLowerCase().includes('kaptai')) {
      upazilaCode = 'KAPTAI';
    } else if (uClean.includes('বরকল') || uClean.toLowerCase().includes('barkal')) {
      upazilaCode = 'BARKAL';
    } else if (uClean.includes('জুরাইছড়ি') || uClean.includes('জুরাইছড়ি') || uClean.toLowerCase().includes('juraichhari')) {
      upazilaCode = 'JURAICHHARI';
    } else if (uClean.includes('লংগদু') || uClean.toLowerCase().includes('langadu')) {
      upazilaCode = 'LANGADU';
    } else if (uClean.includes('নানিয়ারচর') || uClean.toLowerCase().includes('naniarchar')) {
      upazilaCode = 'NANIARCHAR';
    } else if (uClean.includes('রাজস্থলী') || uClean.toLowerCase().includes('rajasthali')) {
      upazilaCode = 'RAJASTHALI';
    } else if (uClean.includes('বিলাইছড়ি') || uClean.includes('বিলাইছড়ি') || uClean.toLowerCase().includes('belaichhari')) {
      upazilaCode = 'BELAICHHARI';
    } else if (uClean.includes('রোয়াংছড়ি') || uClean.includes('রোয়াংছড়ি') || uClean.toLowerCase().includes('rowangchhari')) {
      upazilaCode = 'ROWANGCHHARI';
    } else if (uClean.includes('রুমা') || uClean.toLowerCase().includes('ruma')) {
      upazilaCode = 'RUMA';
    } else if (uClean.includes('থানচি') || uClean.toLowerCase().includes('thanchi')) {
      upazilaCode = 'THANCHI';
    } else if (uClean.includes('লামা') || uClean.toLowerCase().includes('lama')) {
      upazilaCode = 'LAMA';
    } else if (uClean.includes('আলীকদম') || uClean.toLowerCase().includes('alikadam')) {
      upazilaCode = 'ALIKADAM';
    } else if (uClean.includes('নাইক্ষ্যংছড়ি') || uClean.includes('নাইক্ষ্যংছড়ি') || uClean.toLowerCase().includes('naikhyongchhari')) {
      upazilaCode = 'NAIKHYONG';
    } else if (uClean.includes('মিরপুর') || uClean.toLowerCase().includes('mirpur')) {
      upazilaCode = 'MIRPUR';
    } else if (uClean.includes('ধানমন্ডি') || uClean.toLowerCase().includes('dhanmondi')) {
      upazilaCode = 'DHANMONDI';
    } else if (uClean.includes('গুলশান') || uClean.toLowerCase().includes('gulshan')) {
      upazilaCode = 'GULSHAN';
    } else if (uClean.includes('উত্তরা') || uClean.toLowerCase().includes('uttara')) {
      upazilaCode = 'UTTARA';
    } else if (uClean.includes('সাভার') || uClean.toLowerCase().includes('savar')) {
      upazilaCode = 'SAVAR';
    } else if (uClean.includes('কেরানীগঞ্জ') || uClean.toLowerCase().includes('keraniganj')) {
      upazilaCode = 'KERANIGANJ';
    } else if (uClean.includes('কোতোয়ালী') || uClean.includes('কোতোয়ালী') || uClean.toLowerCase().includes('kotwali')) {
      upazilaCode = 'KOTWALI';
    } else if (uClean.includes('পাঁচলাইশ') || uClean.toLowerCase().includes('panchlaish')) {
      upazilaCode = 'PANCHLAISH';
    } else if (uClean.includes('টেকনাফ') || uClean.toLowerCase().includes('teknaf')) {
      upazilaCode = 'TEKNAF';
    } else if (uClean.includes('উখিয়া') || uClean.includes('উখিয়া') || uClean.toLowerCase().includes('ukhiya')) {
      upazilaCode = 'UKHIYA';
    } else if (uClean.includes('পটিয়া') || uClean.includes('পটিয়া') || uClean.toLowerCase().includes('patiya')) {
      upazilaCode = 'PATIYA';
    } else if (uClean.includes('হাতিয়া') || uClean.includes('হাতিয়া') || uClean.toLowerCase().includes('hatiya')) {
      upazilaCode = 'HATIYA';
    } else if (uClean.includes('রাউজান') || uClean.toLowerCase().includes('raozan')) {
      upazilaCode = 'RAOZAN';
    } else if (uClean.includes('ফটিকছড়ি') || uClean.includes('ফটিকছড়ি') || uClean.toLowerCase().includes('fatikchhari')) {
      upazilaCode = 'FATIKCHHARI';
    } else if (uClean.includes('হাটহাজারী') || uClean.toLowerCase().includes('hathazari')) {
      upazilaCode = 'HATHAZARI';
    } else {
      const latinOnly = uClean.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
      if (latinOnly.length >= 3) {
        upazilaCode = latinOnly.slice(0, 10);
      } else {
        // Simple Bengali phonetic transliteration fallback for clean uppercase token
        const charMap: Record<string, string> = {
          'ক': 'K', 'খ': 'KH', 'গ': 'G', 'ঘ': 'GH', 'ঙ': 'NG',
          'চ': 'CH', 'ছ': 'CHH', 'জ': 'J', 'ঝ': 'JH', 'ঞ': 'N',
          'ট': 'T', 'ঠ': 'TH', 'ড': 'D', 'ঢ': 'DH', 'ণ': 'N',
          'ত': 'T', 'থ': 'TH', 'দ': 'D', 'ধ': 'DH', 'ন': 'N',
          'প': 'P', 'ফ': 'F', 'ব': 'B', 'ভ': 'BH', 'ম': 'M',
          'য': 'Z', 'র': 'R', 'ল': 'L', 'শ': 'SH', 'ষ': 'SH',
          'স': 'S', 'হ': 'H', 'ড়': 'R', 'ঢ়': 'RH', 'য়': 'Y',
          'া': 'A', 'ি': 'I', 'ী': 'I', 'ু': 'U', 'ূ': 'U',
          'ে': 'E', 'ৈ': 'OI', 'ো': 'O', 'ৌ': 'OU'
        };
        let converted = '';
        for (let i = 0; i < uClean.length && converted.length < 8; i++) {
          const c = uClean[i];
          if (charMap[c]) converted += charMap[c];
        }
        upazilaCode = converted.length >= 3 ? converted : 'CENTRAL';
      }
    }
  }

  let counterStr = '001';
  if (typeof counter === 'number') {
    counterStr = String(counter).padStart(3, '0');
  } else if (typeof counter === 'string' && counter.trim()) {
    const num = parseInt(counter.replace(/[^0-9]/g, ''), 10);
    counterStr = !isNaN(num) ? String(num).padStart(3, '0') : '001';
  } else {
    const key = `jhadimadi_rep_seq_${distCode}_${upazilaCode}`;
    let current = 1;
    try {
      const saved = localStorage.getItem(key);
      if (saved) {
        current = parseInt(saved, 10) + 1;
      }
      localStorage.setItem(key, String(current));
    } catch {
      current = Math.floor(1 + Math.random() * 99);
    }
    counterStr = String(current).padStart(3, '0');
  }

  return `${distCode}-${upazilaCode}-${counterStr}`;
};
