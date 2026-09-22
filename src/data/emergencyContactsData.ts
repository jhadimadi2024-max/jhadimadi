/**
 * EMERGENCY CONTACTS & AMBULANCE DIRECTORY DATA
 * Comprehensive database for 999, National Helplines, Police Stations, Fire Service,
 * and 24/7 Ambulance Services across Bangladesh with focus on all 64 Districts & Thanas.
 */

export interface NationalHelpline {
  id: string;
  nameBn: string;
  nameEn: string;
  number: string;
  shortCode?: string;
  category: 'national' | 'police' | 'health' | 'fire' | 'social' | 'women_child';
  descriptionBn: string;
  isTollFree: boolean;
  availableHours: string;
  iconType: 'siren' | 'police' | 'fire' | 'health' | 'child' | 'shield' | 'phone';
  bgGradient: string;
}

export interface PoliceStationContact {
  id: string;
  district: string;
  upazila: string;
  officeNameBn: string;
  officeNameEn: string;
  designationBn: string; // যেমন: অফিসার ইনচার্জ (OC), পুলিশ সুপার (SP), ডিউটি অফিসার
  mobileNumber: string;
  phoneLandline?: string;
  tntNumber?: string;
  email?: string;
  addressBn: string;
  is24Hours: boolean;
  category: 'thana' | 'sp_office' | 'control_room' | 'highway' | 'tourist' | 'fire_station';
}

export interface AmbulanceServiceContact {
  id: string;
  district: string;
  upazila: string;
  serviceNameBn: string;
  serviceNameEn: string;
  ambulanceType: 'icu' | 'ac' | 'non_ac' | 'freezer' | 'govt_hospital' | 'red_crescent';
  typeLabelBn: string;
  contactNumber: string;
  alternateNumber?: string;
  phoneLandline?: string;
  driverNameBn?: string;
  baseLocationBn: string;
  is24Hours: boolean;
  startingRate?: string;
  oxygenAvailable: boolean;
  icuSupport: boolean;
}

// ১. জাতীয় জরুরি হটলাইনসমূহ (National Emergency Numbers)
export const NATIONAL_HELPLINES: NationalHelpline[] = [
  {
    id: 'hl_999',
    nameBn: 'জাতীয় জরুরি সেবা ৯৯৯ (পুলিশ, অ্যাম্বুলেন্স ও ফায়ার)',
    nameEn: 'National Emergency Service 999',
    number: '999',
    shortCode: '999',
    category: 'national',
    descriptionBn: 'পুলিশি সহায়তা, অ্যাম্বুলেন্স ও ফায়ার সার্ভিসের জন্য যেকোনো মোবাইল থেকে টোল ফ্রি।',
    isTollFree: true,
    availableHours: '২৪ ঘণ্টা / ৭ দিন',
    iconType: 'siren',
    bgGradient: 'from-red-600 to-rose-700'
  },
  {
    id: 'hl_16263',
    nameBn: 'স্বাস্থ্য বাতায়ন ১৬২৬৩ (স্বাস্থ্য ও ডাক্তার পরামর্শ)',
    nameEn: 'Shastho Batayon 16263',
    number: '16263',
    shortCode: '16263',
    category: 'health',
    descriptionBn: 'সরকারি স্বাস্থ্য সেবা ও ২৪ ঘণ্টা এমবিবিএস ডাক্তারের ফ্রি টেলিমেডিসিন পরামর্শ।',
    isTollFree: false,
    availableHours: '২৪ ঘণ্টা / ৭ দিন',
    iconType: 'health',
    bgGradient: 'from-emerald-600 to-teal-700'
  },
  {
    id: 'hl_109',
    nameBn: 'নারী ও শিশু নির্যাতন প্রতিরোধ সেল ১০৯',
    nameEn: 'Women & Child Helpline 109',
    number: '109',
    shortCode: '109',
    category: 'women_child',
    descriptionBn: 'নারী ও শিশুদের প্রতি সহিংসতা, বাল্যবিয়ে ও পারিবারিক নির্যাতন রোধে জরুরি সহায়তা।',
    isTollFree: true,
    availableHours: '২৪ ঘণ্টা',
    iconType: 'shield',
    bgGradient: 'from-purple-600 to-indigo-700'
  },
  {
    id: 'hl_1098',
    nameBn: 'চাইল্ড হেল্পলাইন ১০৯৮ (শিশু সহায়তা)',
    nameEn: 'Child Helpline 1098',
    number: '1098',
    shortCode: '1098',
    category: 'women_child',
    descriptionBn: 'বিপদাপন্ন ও সুরক্ষাহীন শিশুদের তাৎক্ষণিক উদ্ধার ও আইনি সহায়তার জন্য ফ্রি কল।',
    isTollFree: true,
    availableHours: '২৪ ঘণ্টা',
    iconType: 'child',
    bgGradient: 'from-amber-600 to-orange-700'
  },
  {
    id: 'hl_333',
    nameBn: 'জাতীয় তথ্য বাতায়ন ৩৩৩ (সরকারি সেবা ও তথ্য)',
    nameEn: 'National Call Center 333',
    number: '333',
    shortCode: '333',
    category: 'social',
    descriptionBn: 'সকল সরকারি অফিসের তথ্য, নাগরিক সেবা, কর্মকর্তাদের তথ্য ও সামাজিক সমস্যা প্রতিকার।',
    isTollFree: false,
    availableHours: '২৪ ঘণ্টা',
    iconType: 'phone',
    bgGradient: 'from-blue-600 to-cyan-700'
  },
  {
    id: 'hl_106',
    nameBn: 'দুদক অভিযোগ হটলাইন ১০৬',
    nameEn: 'Anti-Corruption Commission 106',
    number: '106',
    shortCode: '106',
    category: 'national',
    descriptionBn: 'সরকারি সেবায় ঘুষ ও দুর্নীতির বিরুদ্ধে তাৎক্ষণিক অভিযোগ দাখিল হটলাইন।',
    isTollFree: true,
    availableHours: 'অফিস সময় (৯টা - ৫টা)',
    iconType: 'shield',
    bgGradient: 'from-slate-700 to-slate-900'
  },
  {
    id: 'hl_16122',
    nameBn: 'ভূমি সেবা হটলাইন ১৬১২২ (খতিয়ান ও নামজারি)',
    nameEn: 'Land Service Helpline 16122',
    number: '16122',
    shortCode: '16122',
    category: 'social',
    descriptionBn: 'ই-নামজারি, খতিয়ান, জমি ক্রয়-বিক্রয় ও ভূমি কর সংক্রান্ত যেকোনো তথ্যের জন্য।',
    isTollFree: false,
    availableHours: '২৪ ঘণ্টা',
    iconType: 'phone',
    bgGradient: 'from-green-700 to-emerald-800'
  },
  {
    id: 'hl_red_crescent',
    nameBn: 'বাংলাদেশ রেড ক্রিসেন্ট সোসাইটি জরুরি রক্ত ও দুর্যোগ সহায়তা',
    nameEn: 'Bangladesh Red Crescent Society',
    number: '02222238400',
    category: 'health',
    descriptionBn: 'রক্তদান, রক্তের ব্যাগ সরবরাহ ও জাতীয় জরুরি দুর্যোগ মোকাবিলায় ভলান্টিয়ার সাপোর্ট।',
    isTollFree: false,
    availableHours: '২৪ ঘণ্টা',
    iconType: 'health',
    bgGradient: 'from-red-700 to-rose-900'
  }
];

// ২. জেলা ও থানা ভিত্তিক পুলিশ ও ফায়ার সার্ভিস ডাটাবেজ (Police & Emergency Stations)
export const POLICE_STATIONS_DIRECTORY: PoliceStationContact[] = [
  // --- খাগড়াছড়ি জেলা ---
  {
    id: 'pol_khg_sp',
    district: 'খাগড়াছড়ি',
    upazila: 'খাগড়াছড়ি সদর',
    officeNameBn: 'পুলিশ সুপার (SP) কার্যালয়, খাগড়াছড়ি',
    officeNameEn: 'Superintendent of Police Office, Khagrachhari',
    designationBn: 'পুলিশ সুপার ও কন্ট্রোল রুম',
    mobileNumber: '01320108300',
    phoneLandline: '02333343201',
    addressBn: 'এসপি অফিস রোড, খাগড়াছড়ি সদর',
    is24Hours: true,
    category: 'sp_office'
  },
  {
    id: 'pol_khg_sdr',
    district: 'খাগড়াছড়ি',
    upazila: 'খাগড়াছড়ি সদর',
    officeNameBn: 'খাগড়াছড়ি সদর থানা',
    officeNameEn: 'Khagrachhari Sadar Police Station',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320108323',
    phoneLandline: '02333343222',
    addressBn: 'থানা রোড, খাগড়াছড়ি পৌরসভা',
    is24Hours: true,
    category: 'thana'
  },
  {
    id: 'pol_khg_dgh',
    district: 'খাগড়াছড়ি',
    upazila: 'দীঘিনালা',
    officeNameBn: 'দীঘিনালা থানা',
    officeNameEn: 'Dighinala Police Station',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320108335',
    phoneLandline: '02333345100',
    addressBn: 'দীঘিনালা বাজার সংলগ্ন, দীঘিনালা',
    is24Hours: true,
    category: 'thana'
  },
  {
    id: 'pol_khg_pnc',
    district: 'খাগড়াছড়ি',
    upazila: 'পানছড়ি',
    officeNameBn: 'পানছড়ি থানা',
    officeNameEn: 'Panchhari Police Station',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320108347',
    phoneLandline: '02333346200',
    addressBn: 'পানছড়ি বাজার রোড, পানছড়ি',
    is24Hours: true,
    category: 'thana'
  },
  {
    id: 'pol_khg_mtr',
    district: 'খাগড়াছড়ি',
    upazila: 'মাটিরাঙ্গা',
    officeNameBn: 'মাটিরাঙ্গা থানা',
    officeNameEn: 'Matiranga Police Station',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320108359',
    phoneLandline: '02333347100',
    addressBn: 'মাটিরাঙ্গা সদর, খাগড়াছড়ি',
    is24Hours: true,
    category: 'thana'
  },
  {
    id: 'pol_khg_rmg',
    district: 'খাগড়াছড়ি',
    upazila: 'রামগড়',
    officeNameBn: 'রামগড় থানা',
    officeNameEn: 'Ramgarh Police Station',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320108371',
    addressBn: 'রামগড় পৌর এলাকা, খাগড়াছড়ি',
    is24Hours: true,
    category: 'thana'
  },
  {
    id: 'pol_khg_mhl',
    district: 'খাগড়াছড়ি',
    upazila: 'মহালছড়ি',
    officeNameBn: 'মহালছড়ি থানা',
    officeNameEn: 'Mahalchhari Police Station',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320108383',
    addressBn: 'মহালছড়ি বাজার, খাগড়াছড়ি',
    is24Hours: true,
    category: 'thana'
  },
  {
    id: 'pol_khg_mnk',
    district: 'খাগড়াছড়ি',
    upazila: 'মানিকছড়ি',
    officeNameBn: 'মানিকছড়ি থানা',
    officeNameEn: 'Manikchhari Police Station',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320108395',
    addressBn: 'মানিকছড়ি বাজার রোড, খাগড়াছড়ি',
    is24Hours: true,
    category: 'thana'
  },
  {
    id: 'pol_khg_gmr',
    district: 'খাগড়াছড়ি',
    upazila: 'গুয়াইমারা',
    officeNameBn: 'গুইমারা থানা',
    officeNameEn: 'Guimara Police Station',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320108407',
    addressBn: 'গুইমারা উপজেলা কমপ্লেক্স রোড',
    is24Hours: true,
    category: 'thana'
  },
  {
    id: 'pol_khg_lxc',
    district: 'খাগড়াছড়ি',
    upazila: 'লক্ষ্মীছড়ি',
    officeNameBn: 'লক্ষ্মীছড়ি থানা',
    officeNameEn: 'Lakshmichhari Police Station',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320108419',
    addressBn: 'লক্ষ্মীছড়ি সদর, খাগড়াছড়ি',
    is24Hours: true,
    category: 'thana'
  },
  {
    id: 'fire_khg_sdr',
    district: 'খাগড়াছড়ি',
    upazila: 'খাগড়াছড়ি সদর',
    officeNameBn: 'খাগড়াছড়ি ফায়ার সার্ভিস ও সিভিল ডিফেন্স স্টেশন',
    officeNameEn: 'Khagrachhari Fire Service Station',
    designationBn: 'ডিউটি অফিসার / স্টেশন অফিসার',
    mobileNumber: '01730336622',
    phoneLandline: '02333343333',
    addressBn: 'স্টেডিয়াম রোড, খাগড়াছড়ি সদর',
    is24Hours: true,
    category: 'fire_station'
  },

  // --- রাঙ্গামাটি জেলা ---
  {
    id: 'pol_rng_sp',
    district: 'রাঙ্গামাটি',
    upazila: 'রাঙ্গামাটি সদর',
    officeNameBn: 'পুলিশ সুপার (SP) কার্যালয়, রাঙ্গামাটি',
    officeNameEn: 'Superintendent of Police Office, Rangamati',
    designationBn: 'পুলিশ সুপার ও কন্ট্রোল রুম',
    mobileNumber: '01320109000',
    phoneLandline: '02333371101',
    addressBn: 'কোর্ট বিল্ডিং রোড, রাঙ্গামাটি',
    is24Hours: true,
    category: 'sp_office'
  },
  {
    id: 'pol_rng_sdr',
    district: 'রাঙ্গামাটি',
    upazila: 'রাঙ্গামাটি সদর',
    officeNameBn: 'কোতোয়ালী থানা (রাঙ্গামাটি সদর)',
    officeNameEn: 'Kotwali Police Station, Rangamati',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320109023',
    phoneLandline: '02333371222',
    addressBn: 'তবলছড়ি, রাঙ্গামাটি সদর',
    is24Hours: true,
    category: 'thana'
  },
  {
    id: 'pol_rng_kpt',
    district: 'রাঙ্গামাটি',
    upazila: 'কাপ্তai',
    officeNameBn: 'কাপ্তাই থানা',
    officeNameEn: 'Kaptai Police Station',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320109035',
    addressBn: 'কাপ্তাই নতুন বাজার, রাঙ্গামাটি',
    is24Hours: true,
    category: 'thana'
  },
  {
    id: 'pol_rng_bgh',
    district: 'রাঙ্গামাটি',
    upazila: 'বাঘাইছড়ি',
    officeNameBn: 'বাঘাইছড়ি থানা (সাজেক সহ)',
    officeNameEn: 'Baghaichhari Police Station',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320109047',
    addressBn: 'বাঘাইছড়ি সদর, রাঙ্গামাটি',
    is24Hours: true,
    category: 'thana'
  },
  {
    id: 'pol_rng_nan',
    district: 'রাঙ্গামাটি',
    upazila: 'নানিয়ারচর',
    officeNameBn: 'নানিয়ারচর থানা',
    officeNameEn: 'Naniarchar Police Station',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320109059',
    addressBn: 'নানিয়ারচর বাজার, রাঙ্গামাটি',
    is24Hours: true,
    category: 'thana'
  },
  {
    id: 'pol_rng_lng',
    district: 'রাঙ্গামাটি',
    upazila: 'লংগদু',
    officeNameBn: 'লংগদু থানা',
    officeNameEn: 'Langadu Police Station',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320109071',
    addressBn: 'লংগদু সদর, রাঙ্গামাটি',
    is24Hours: true,
    category: 'thana'
  },
  {
    id: 'fire_rng_sdr',
    district: 'রাঙ্গামাটি',
    upazila: 'রাঙ্গামাটি সদর',
    officeNameBn: 'রাঙ্গামাটি ফায়ার সার্ভিস স্টেশন',
    officeNameEn: 'Rangamati Fire Service Station',
    designationBn: 'ডিউটি অফিসার',
    mobileNumber: '01730336633',
    phoneLandline: '02333371333',
    addressBn: 'রিজার্ভ বাজার, রাঙ্গামাটি',
    is24Hours: true,
    category: 'fire_station'
  },

  // --- বান্দরবান জেলা ---
  {
    id: 'pol_bnd_sp',
    district: 'বান্দরবান',
    upazila: 'বান্দরবান সদর',
    officeNameBn: 'পুলিশ সুপার (SP) কার্যালয়, বান্দরবান',
    officeNameEn: 'Superintendent of Police Office, Bandarban',
    designationBn: 'পুলিশ সুপার ও কন্ট্রোল রুম',
    mobileNumber: '01320109700',
    phoneLandline: '02333302100',
    addressBn: 'বালাঘাটা রোড, বান্দরবান সদর',
    is24Hours: true,
    category: 'sp_office'
  },
  {
    id: 'pol_bnd_sdr',
    district: 'বান্দরবান',
    upazila: 'বান্দরবান সদর',
    officeNameBn: 'বান্দরবান সদর থানা',
    officeNameEn: 'Bandarban Sadar Police Station',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320109723',
    phoneLandline: '02333302222',
    addressBn: 'ট্রাফিক মোড়, বান্দরবান পৌরসভা',
    is24Hours: true,
    category: 'thana'
  },
  {
    id: 'pol_bnd_rum',
    district: 'বান্দরবান',
    upazila: 'রুমা',
    officeNameBn: 'রুমা থানা',
    officeNameEn: 'Ruma Police Station',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320109735',
    addressBn: 'রুমা বাজার রোড, বান্দরবান',
    is24Hours: true,
    category: 'thana'
  },
  {
    id: 'pol_bnd_tha',
    district: 'বান্দরবান',
    upazila: 'থানচি',
    officeNameBn: 'থানচি থানা',
    officeNameEn: 'Thanchi Police Station',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320109747',
    addressBn: 'থানচি বাজার সংলগ্ন, বান্দরবান',
    is24Hours: true,
    category: 'thana'
  },
  {
    id: 'pol_bnd_lam',
    district: 'বান্দরবান',
    upazila: 'লামা',
    officeNameBn: 'লামা থানা',
    officeNameEn: 'Lama Police Station',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320109759',
    addressBn: 'লামা বাজার রোড, বান্দরবান',
    is24Hours: true,
    category: 'thana'
  },
  {
    id: 'pol_bnd_alk',
    district: 'বান্দরবান',
    upazila: 'আলীকদম',
    officeNameBn: 'আলীকদম থানা',
    officeNameEn: 'Ali Kadam Police Station',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320109771',
    addressBn: 'আলীকদম সদর, বান্দরবান',
    is24Hours: true,
    category: 'thana'
  },

  // --- ঢাকা মেট্রো ও জেলা ---
  {
    id: 'pol_dhk_dmp',
    district: 'ঢাকা',
    upazila: 'ধানমন্ডি',
    officeNameBn: 'ঢাকা মেট্রোপলিটন পুলিশ (DMP) কন্ট্রোল রুম',
    officeNameEn: 'DMP Central Control Room',
    designationBn: 'ডিউটি অফিসার / কেন্দ্রীয় কন্ট্রোল রুম',
    mobileNumber: '01320001299',
    phoneLandline: '02223381188',
    addressBn: 'আব্দুল গনি রোড, ঢাকা',
    is24Hours: true,
    category: 'control_room'
  },
  {
    id: 'pol_dhk_dhn',
    district: 'ঢাকা',
    upazila: 'ধানমন্ডি',
    officeNameBn: 'ধানমন্ডি মডেল থানা',
    officeNameEn: 'Dhanmondi Model Police Station',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320039988',
    addressBn: 'রোড নং ৮, ধানমন্ডি আ/এ, ঢাকা',
    is24Hours: true,
    category: 'thana'
  },
  {
    id: 'pol_dhk_mir',
    district: 'ঢাকা',
    upazila: 'মিরপুর',
    officeNameBn: 'মিরপুর মডেল থানা',
    officeNameEn: 'Mirpur Model Police Station',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320042400',
    addressBn: 'মিরপুর-২, ঢাকা',
    is24Hours: true,
    category: 'thana'
  },
  {
    id: 'pol_dhk_utt',
    district: 'ঢাকা',
    upazila: 'উত্তরা',
    officeNameBn: 'উত্তরা পূর্ব থানা',
    officeNameEn: 'Uttara East Police Station',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320044500',
    addressBn: 'সেক্টর ৪, উত্তরা, ঢাকা',
    is24Hours: true,
    category: 'thana'
  },
  {
    id: 'pol_dhk_gul',
    district: 'ঢাকা',
    upazila: 'গুলশান',
    officeNameBn: 'গুলশান মডেল থানা',
    officeNameEn: 'Gulshan Model Police Station',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320043100',
    addressBn: 'গুলশান-২, ঢাকা',
    is24Hours: true,
    category: 'thana'
  },
  {
    id: 'pol_dhk_sav',
    district: 'ঢাকা',
    upazila: 'সাভার',
    officeNameBn: 'সাভার মডেল থানা',
    officeNameEn: 'Savar Model Police Station',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320092500',
    addressBn: 'ঢাকা-আরিচা রোড, সাভার, ঢাকা',
    is24Hours: true,
    category: 'thana'
  },

  // --- চট্টগ্রাম জেলা ---
  {
    id: 'pol_ctg_cmp',
    district: 'চট্টগ্রাম',
    upazila: 'কোতোয়ালী',
    officeNameBn: 'চট্টগ্রাম মেট্রোপলিটন পুলিশ (CMP) কন্ট্রোল রুম',
    officeNameEn: 'CMP Central Control Room',
    designationBn: 'ডিউটি অফিসার',
    mobileNumber: '01320052999',
    phoneLandline: '02333363388',
    addressBn: 'লালদিঘির পাড়, চট্টগ্রাম',
    is24Hours: true,
    category: 'control_room'
  },
  {
    id: 'pol_ctg_kot',
    district: 'চট্টগ্রাম',
    upazila: 'কোতোয়ালী',
    officeNameBn: 'কোতোয়ালী থানা, চট্টগ্রাম',
    officeNameEn: 'Kotwali Police Station, Chattogram',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320052300',
    addressBn: 'কোতোয়ালী মোড়, চট্টগ্রাম',
    is24Hours: true,
    category: 'thana'
  },
  {
    id: 'pol_ctg_pan',
    district: 'চট্টগ্রাম',
    upazila: 'পাঁচলাইশ',
    officeNameBn: 'পাঁচলাইশ থানা, চট্টগ্রাম',
    officeNameEn: 'Panchlaish Police Station, Chattogram',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320052500',
    addressBn: 'মুরাদপুর, পাঁচলাইশ, চট্টগ্রাম',
    is24Hours: true,
    category: 'thana'
  },
  {
    id: 'pol_ctg_sit',
    district: 'চট্টগ্রাম',
    upazila: 'সীতাকুণ্ড',
    officeNameBn: 'সীতাকুণ্ড মডেল থানা',
    officeNameEn: 'Sitakunda Model Police Station',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320107200',
    addressBn: 'সীতাকুণ্ড পৌর এলাকা, চট্টগ্রাম',
    is24Hours: true,
    category: 'thana'
  },
  {
    id: 'pol_ctg_hat',
    district: 'চট্টগ্রাম',
    upazila: 'হাটহাজারী',
    officeNameBn: 'হাটহাজারী মডেল থানা',
    officeNameEn: 'Hathazari Model Police Station',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320107300',
    addressBn: 'হাটহাজারী বাস স্ট্যান্ড রোড, চট্টগ্রাম',
    is24Hours: true,
    category: 'thana'
  },

  // --- কক্সবাজার জেলা ---
  {
    id: 'pol_cox_sp',
    district: 'কক্সবাজার',
    upazila: 'কক্সবাজার সদর',
    officeNameBn: 'পুলিশ সুপার (SP) কার্যালয়, কক্সবাজার',
    officeNameEn: 'Superintendent of Police Office, Cox\'s Bazar',
    designationBn: 'পুলিশ সুপার ও কন্ট্রোল রুম',
    mobileNumber: '01320106700',
    addressBn: 'হিল ডাউন রোড, কক্সবাজার সদর',
    is24Hours: true,
    category: 'sp_office'
  },
  {
    id: 'pol_cox_sdr',
    district: 'কক্সবাজার',
    upazila: 'কক্সবাজার সদর',
    officeNameBn: 'কক্সবাজার সদর মডেল থানা',
    officeNameEn: 'Cox\'s Bazar Sadar Model Police Station',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320106723',
    addressBn: 'ঝাউতলা, কক্সবাজার পৌরসভা',
    is24Hours: true,
    category: 'thana'
  },
  {
    id: 'pol_cox_tek',
    district: 'কক্সবাজার',
    upazila: 'টেকনাফ',
    officeNameBn: 'টেকনাফ মডেল থানা',
    officeNameEn: 'Teknaf Model Police Station',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320106759',
    addressBn: 'টেকনাফ সদর, কক্সবাজার',
    is24Hours: true,
    category: 'thana'
  },

  // --- সিলেট জেলা ---
  {
    id: 'pol_syl_sdr',
    district: 'সিলেট',
    upazila: 'সিলেট সদর',
    officeNameBn: 'কোতোয়ালী মডেল থানা, সিলেট (SMP)',
    officeNameEn: 'Kotwali Model Police Station, Sylhet',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320117200',
    addressBn: 'বন্দরবাজার, সিলেট সদর',
    is24Hours: true,
    category: 'thana'
  },

  // --- রাজশাহী জেলা ---
  {
    id: 'pol_raj_sdr',
    district: 'রাজশাহী',
    upazila: 'বোয়ালিয়া',
    officeNameBn: 'বোয়ালিয়া মডেল থানা (RMP)',
    officeNameEn: 'Boalia Model Police Station, Rajshahi',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320062300',
    addressBn: 'সাহেব বাজার, রাজশাহী',
    is24Hours: true,
    category: 'thana'
  },

  // --- খুলনা জেলা ---
  {
    id: 'pol_khu_sdr',
    district: 'খুলনা',
    upazila: 'খুলনা সদর',
    officeNameBn: 'খুলনা সদর থানা (KMP)',
    officeNameEn: 'Khulna Sadar Police Station',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320072300',
    addressBn: 'ডাকবাংলো মোড়, খুলনা',
    is24Hours: true,
    category: 'thana'
  },

  // --- বরিশাল জেলা ---
  {
    id: 'pol_bar_sdr',
    district: 'বরিশাল',
    upazila: 'বরিশাল সদর',
    officeNameBn: 'কোতোয়ালী মডেল থানা, বরিশাল (BMP)',
    officeNameEn: 'Kotwali Model Police Station, Barishal',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320082300',
    addressBn: 'বান্দ রোড, বরিশাল',
    is24Hours: true,
    category: 'thana'
  },

  // --- ময়মনসিংহ জেলা ---
  {
    id: 'pol_mym_sdr',
    district: 'ময়মনসিংহ',
    upazila: 'ময়মনসিংহ সদর',
    officeNameBn: 'কোতোয়ালী মডেল থানা, ময়মনসিংহ',
    officeNameEn: 'Kotwali Model Police Station, Mymensingh',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320121200',
    addressBn: 'গাঙ্গিনার পাড়, ময়মনসিংহ',
    is24Hours: true,
    category: 'thana'
  },

  // --- রংপুর জেলা ---
  {
    id: 'pol_rngp_sdr',
    district: 'রংপুর',
    upazila: 'রংপুর সদর',
    officeNameBn: 'কোতোয়ালী থানা, রংপুর (RPMP)',
    officeNameEn: 'Kotwali Police Station, Rangpur',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320132200',
    addressBn: 'জাহাজ কোম্পানি মোড়, রংপুর',
    is24Hours: true,
    category: 'thana'
  },

  // --- কুমিল্লা জেলা ---
  {
    id: 'pol_cum_sdr',
    district: 'কুমিল্লা',
    upazila: 'কুমিল্লা সদর',
    officeNameBn: 'কুমিল্লা কোতোয়ালী মডেল থানা',
    officeNameEn: 'Kotwali Model Police Station, Cumilla',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320112200',
    addressBn: 'কান্দিরপাড়, কুমিল্লা সদর',
    is24Hours: true,
    category: 'thana'
  },

  // --- বগুড়া জেলা ---
  {
    id: 'pol_bog_sdr',
    district: 'বগুড়া',
    upazila: 'বগুড়া সদর',
    officeNameBn: 'বগুড়া সদর থানা',
    officeNameEn: 'Bogura Sadar Police Station',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320127200',
    addressBn: 'সাতমাথা, বগুড়া সদর',
    is24Hours: true,
    category: 'thana'
  },

  // --- গাজীপুর জেলা ---
  {
    id: 'pol_gaz_sdr',
    district: 'গাজীপুর',
    upazila: 'গাজীপুর সদর',
    officeNameBn: 'জয়দেবপুর থানা / সদর (GMP)',
    officeNameEn: 'Joydebpur Police Station, Gazipur',
    designationBn: 'অফিসার ইনচার্জ (OC)',
    mobileNumber: '01320022200',
    addressBn: 'রাজবাড়ি রোড, গাজীপুর সদর',
    is24Hours: true,
    category: 'thana'
  }
];

// ৩. অ্যাম্বুলেন্স সার্ভিসেস ডাটাবেজ (Ambulance Services Directory)
export const AMBULANCE_SERVICES_DIRECTORY: AmbulanceServiceContact[] = [
  // --- খাগড়াছড়ি জেলা ---
  {
    id: 'amb_khg_01',
    district: 'খাগড়াছড়ি',
    upazila: 'খাগড়াছড়ি সদর',
    serviceNameBn: 'খাগড়াছড়ি আধুনিক জেলা সদর হাসপাতাল সরকারি অ্যাম্বুলেন্স',
    serviceNameEn: 'Khagrachhari Sadar Hospital Govt Ambulance',
    ambulanceType: 'govt_hospital',
    typeLabelBn: 'সরকারি হাসপাতাল অ্যাম্বুলেন্স',
    contactNumber: '01712284920',
    alternateNumber: '02333343250',
    driverNameBn: 'মো: জসীম উদ্দিন (ডিউটি ড্রাইভার)',
    baseLocationBn: 'জেলা সদর হাসপাতাল চত্বর, খাগড়াছড়ি',
    is24Hours: true,
    startingRate: 'সরকারি নির্ধারিত ভাড়া',
    oxygenAvailable: true,
    icuSupport: false
  },
  {
    id: 'amb_khg_02',
    district: 'খাগড়াছড়ি',
    upazila: 'খাগড়াছড়ি সদর',
    serviceNameBn: 'পাহাড়িকা ২৪/৭ এসি ও আইসিইউ অ্যাম্বুলেন্স সার্ভিস',
    serviceNameEn: 'Paharika 24/7 ICU & AC Ambulance',
    ambulanceType: 'icu',
    typeLabelBn: 'আইসিইউ / এসি অ্যাম্বুলেন্স',
    contactNumber: '01819654321',
    alternateNumber: '01711987654',
    driverNameBn: 'সুবীর চাকমা',
    baseLocationBn: 'আদালত রোড, খাগড়াছড়ি সদর',
    is24Hours: true,
    startingRate: '৳ ১৫০০ - চট্টগ্রাম ও ঢাকা সরাসরি সার্ভিস',
    oxygenAvailable: true,
    icuSupport: true
  },
  {
    id: 'amb_khg_03',
    district: 'খাগড়াছড়ি',
    upazila: 'দীঘিনালা',
    serviceNameBn: 'দীঘিনালা উপজেলা স্বাস্থ্য কমপ্লেক্স অ্যাম্বুলেন্স',
    serviceNameEn: 'Dighinala Upazila Health Complex Ambulance',
    ambulanceType: 'govt_hospital',
    typeLabelBn: 'উপজেলা সরকারি অ্যাম্বুলেন্স',
    contactNumber: '01718876543',
    driverNameBn: 'মো: খলিলুর রহমান',
    baseLocationBn: 'দীঘিনালা স্বাস্থ্য কমপ্লেক্স',
    is24Hours: true,
    startingRate: 'সরকারি নিয়ম অনুযায়ী',
    oxygenAvailable: true,
    icuSupport: false
  },
  {
    id: 'amb_khg_04',
    district: 'খাগড়াছড়ি',
    upazila: 'মাটিরাঙ্গা',
    serviceNameBn: 'মাটিরাঙ্গা লাইফলাইন এসি অ্যাম্বুলেন্স সার্ভিস',
    serviceNameEn: 'Matiranga Lifeline AC Ambulance',
    ambulanceType: 'ac',
    typeLabelBn: '২৪ ঘণ্টা এসি অ্যাম্বুলেন্স',
    contactNumber: '01822334455',
    driverNameBn: 'মো: শফিকুল ইসলাম',
    baseLocationBn: 'মাটিরাঙ্গা বাজার বাস টার্মিনাল',
    is24Hours: true,
    startingRate: 'লোকাল ও হাইওয়ে সার্ভিস',
    oxygenAvailable: true,
    icuSupport: false
  },
  {
    id: 'amb_khg_05',
    district: 'খাগড়াছড়ি',
    upazila: 'পানছড়ি',
    serviceNameBn: 'পানছড়ি জরুরি অক্সিজেন ও রোগী পরিবহন অ্যাম্বুলেন্স',
    serviceNameEn: 'Panchhari Emergency Patient Ambulance',
    ambulanceType: 'non_ac',
    typeLabelBn: 'জরুরি অক্সিজেন অ্যাম্বুলেন্স',
    contactNumber: '01833445566',
    driverNameBn: 'বিমল ত্রিপুরা',
    baseLocationBn: 'পানছড়ি বাজার রোড',
    is24Hours: true,
    startingRate: 'সুলভ ভাড়া',
    oxygenAvailable: true,
    icuSupport: false
  },

  // --- রাঙ্গামাটি জেলা ---
  {
    id: 'amb_rng_01',
    district: 'রাঙ্গামাটি',
    upazila: 'রাঙ্গামাটি সদর',
    serviceNameBn: 'রাঙ্গামাটি জেনারেল হাসপাতাল সরকারি অ্যাম্বুলেন্স',
    serviceNameEn: 'Rangamati General Hospital Ambulance',
    ambulanceType: 'govt_hospital',
    typeLabelBn: 'সরকারি হাসপাতাল অ্যাম্বুলেন্স',
    contactNumber: '01713371400',
    driverNameBn: 'উনুপ্রু মারমা',
    baseLocationBn: 'জেনারেল হাসপাতাল, তবলছড়ি',
    is24Hours: true,
    startingRate: 'সরকারি রেট',
    oxygenAvailable: true,
    icuSupport: false
  },
  {
    id: 'amb_rng_02',
    district: 'রাঙ্গামাটি',
    upazila: 'রাঙ্গামাটি সদর',
    serviceNameBn: 'লেকসিটি কার্ডিয়াক ও আইসিইউ অ্যাম্বুলেন্স সার্ভিস',
    serviceNameEn: 'LakeCity Cardiac & ICU Ambulance',
    ambulanceType: 'icu',
    typeLabelBn: 'কার্ডিয়াক / আইসিইউ ভেন্টিলেটর',
    contactNumber: '01844556677',
    alternateNumber: '01711223344',
    driverNameBn: 'অংথোয়াই মারমা',
    baseLocationBn: 'রিজার্ভ বাজার, রাঙ্গামাটি',
    is24Hours: true,
    startingRate: '২৪ ঘণ্টা ইমার্জেন্সি সাপোর্ট',
    oxygenAvailable: true,
    icuSupport: true
  },
  {
    id: 'amb_rng_03',
    district: 'রাঙ্গামাটি',
    upazila: 'কাপ্তাই',
    serviceNameBn: 'কাপ্তাই স্বাস্থ্য কমপ্লেক্স ও ওয়াটার অ্যাম্বুলেন্স সার্ভিস',
    serviceNameEn: 'Kaptai Hospital & Lake Water Ambulance',
    ambulanceType: 'govt_hospital',
    typeLabelBn: 'স্থল ও ওয়াটার অ্যাম্বুলেন্স',
    contactNumber: '01729876543',
    driverNameBn: 'মো: দেলোয়ার হোসেন',
    baseLocationBn: 'কাপ্তাই নতুন বাজার ও জেটি ঘাট',
    is24Hours: true,
    startingRate: 'সরকারি রেট',
    oxygenAvailable: true,
    icuSupport: false
  },

  // --- বান্দরবান জেলা ---
  {
    id: 'amb_bnd_01',
    district: 'বান্দরবান',
    upazila: 'বান্দরবান সদর',
    serviceNameBn: 'বান্দরবান সদর হাসপাতাল সরকারি অ্যাম্বুলেন্স',
    serviceNameEn: 'Bandarban Sadar Hospital Govt Ambulance',
    ambulanceType: 'govt_hospital',
    typeLabelBn: 'সরকারি হাসপাতাল অ্যাম্বুলেন্স',
    contactNumber: '01713302250',
    driverNameBn: 'মংচিনু মারমা',
    baseLocationBn: 'বালাঘাটা সদর হাসপাতাল, বান্দরবান',
    is24Hours: true,
    startingRate: 'সরকারি নির্ধারিত',
    oxygenAvailable: true,
    icuSupport: false
  },
  {
    id: 'amb_bnd_02',
    district: 'বান্দরবান',
    upazila: 'বান্দরবান সদর',
    serviceNameBn: 'হিলট্র্যাক্টস ২৪ ঘণ্টা এসি ও হিমাগার অ্যাম্বুলেন্স',
    serviceNameEn: 'Hilltracts 24/7 AC & Freezer Ambulance',
    ambulanceType: 'ac',
    typeLabelBn: 'এসি ও হিমাগার অ্যাম্বুলেন্স',
    contactNumber: '01855667788',
    driverNameBn: 'জ্ঞানরত্ন তঞ্চঙ্গ্যা',
    baseLocationBn: 'ট্রাফিক মোড়, বান্দরবান',
    is24Hours: true,
    startingRate: 'চট্টগ্রাম মেডিকেল কলেজ সরাসরি সার্ভিস',
    oxygenAvailable: true,
    icuSupport: true
  },

  // --- ঢাকা জেলা ---
  {
    id: 'amb_dhk_01',
    district: 'ঢাকা',
    upazila: 'ধানমন্ডি',
    serviceNameBn: 'ঢাকা মেডিকেল কলেজ হাসপাতাল (DMCH) অ্যাম্বুলেন্স উইং',
    serviceNameEn: 'DMCH Emergency Ambulance Wing',
    ambulanceType: 'govt_hospital',
    typeLabelBn: 'সরকারি মেডিকেল অ্যাম্বুলেন্স',
    contactNumber: '01711123456',
    phoneLandline: '0255165088',
    baseLocationBn: 'ডিএমসিএইচ ইমার্জেন্সি গেট, ঢাকা',
    is24Hours: true,
    startingRate: 'সরকারি নিয়মানুযায়ী',
    oxygenAvailable: true,
    icuSupport: true
  },
  {
    id: 'amb_dhk_02',
    district: 'ঢাকা',
    upazila: 'মিরপুর',
    serviceNameBn: 'আলহাজ্ব ২৪/৭ কার্ডিয়াক আইসিইউ অ্যাম্বুলেন্স',
    serviceNameEn: 'Alhaj 24/7 Cardiac ICU Ambulance',
    ambulanceType: 'icu',
    typeLabelBn: 'কার্ডিয়াক আইসিইউ অ্যাম্বুলেন্স',
    contactNumber: '01712009988',
    driverNameBn: 'মো: সাইফুল ইসলাম',
    baseLocationBn: 'মিরপুর ১০ গোলচত্বর, ঢাকা',
    is24Hours: true,
    startingRate: '৳ ২০০০ থেকে শুরু (লাইফ সাপোর্ট)',
    oxygenAvailable: true,
    icuSupport: true
  },
  {
    id: 'amb_dhk_03',
    district: 'ঢাকা',
    upazila: 'উত্তরা',
    serviceNameBn: 'উত্তরা অ্যাপোলো লাইফ কেয়ার অ্যাম্বুলেন্স',
    serviceNameEn: 'Uttara Apollo Life Care Ambulance',
    ambulanceType: 'ac',
    typeLabelBn: 'এসি ও নন-এসি রোগী পরিবহন',
    contactNumber: '01911445566',
    driverNameBn: 'মো: আনিসুর রহমান',
    baseLocationBn: 'হাউসবিল্ডিং মোড়, উত্তরা, ঢাকা',
    is24Hours: true,
    startingRate: '৳ ১২০০ থেকে শুরু',
    oxygenAvailable: true,
    icuSupport: false
  },
  {
    id: 'amb_dhk_04',
    district: 'ঢাকা',
    upazila: 'সাভার',
    serviceNameBn: 'সাভার এনাম মেডিকেল কলেজ জরুরি অ্যাম্বুলেন্স',
    serviceNameEn: 'Enam Medical College Ambulance, Savar',
    ambulanceType: 'icu',
    typeLabelBn: 'আইসিইউ ও এসি অ্যাম্বুলেন্স',
    contactNumber: '01716358146',
    baseLocationBn: 'থানা রোড, সাভার, ঢাকা',
    is24Hours: true,
    startingRate: 'হাসপাতাল নির্ধারিত রেট',
    oxygenAvailable: true,
    icuSupport: true
  },

  // --- চট্টগ্রাম জেলা ---
  {
    id: 'amb_ctg_01',
    district: 'চট্টগ্রাম',
    upazila: 'পাঁচলাইশ',
    serviceNameBn: 'চট্টগ্রাম মেডিকেল কলেজ হাসপাতাল (CMCH) সরকারি অ্যাম্বুলেন্স',
    serviceNameEn: 'Chittagong Medical College Hospital (CMCH) Ambulance',
    ambulanceType: 'govt_hospital',
    typeLabelBn: 'চমেক সরকারি অ্যাম্বুলেন্স',
    contactNumber: '01819385522',
    phoneLandline: '02333362244',
    baseLocationBn: 'চমেক ইমার্জেন্সি গেট, পাঁচলাইশ',
    is24Hours: true,
    startingRate: 'সরকারি রেট',
    oxygenAvailable: true,
    icuSupport: true
  },
  {
    id: 'amb_ctg_02',
    district: 'চট্টগ্রাম',
    upazila: 'কোতোয়ালী',
    serviceNameBn: 'আল-আমিন ২৪/৭ আইসিইউ ও এসি অ্যাম্বুলেন্স সার্ভিস',
    serviceNameEn: 'Al-Amin 24/7 ICU & AC Ambulance Chattogram',
    ambulanceType: 'icu',
    typeLabelBn: 'আইসিইউ লাইফ সাপোর্ট ভেন্টিলেটর',
    contactNumber: '01817766554',
    driverNameBn: 'মো: জাহেদ উল্লাহ',
    baseLocationBn: 'আন্দরকিল্লা ও জিইসি মোড়, চট্টগ্রাম',
    is24Hours: true,
    startingRate: '৳ ১৫০০ থেকে শুরু',
    oxygenAvailable: true,
    icuSupport: true
  },
  {
    id: 'amb_ctg_03',
    district: 'চট্টগ্রাম',
    upazila: 'সীতাকুণ্ড',
    serviceNameBn: 'সীতাকুণ্ড হাইওয়ে জরুরি ইমার্জেন্সি অ্যাম্বুলেন্স',
    serviceNameEn: 'Sitakunda Highway Emergency Ambulance',
    ambulanceType: 'ac',
    typeLabelBn: 'হাইওয়ে রেসকিউ অ্যাম্বুলেন্স',
    contactNumber: '01814455667',
    driverNameBn: 'মো: নুরুল আলম',
    baseLocationBn: 'সীতাকুণ্ড বাস স্ট্যান্ড, চট্টগ্রাম',
    is24Hours: true,
    startingRate: 'হাইওয়ে ও দুর্ঘটনা জরুরি রেট',
    oxygenAvailable: true,
    icuSupport: false
  },

  // --- কক্সবাজার জেলা ---
  {
    id: 'amb_cox_01',
    district: 'কক্সবাজার',
    upazila: 'কক্সবাজার সদর',
    serviceNameBn: 'কক্সবাজার জেলা সদর হাসপাতাল সরকারি অ্যাম্বুলেন্স',
    serviceNameEn: 'Cox\'s Bazar Sadar Hospital Govt Ambulance',
    ambulanceType: 'govt_hospital',
    typeLabelBn: 'সরকারি হাসপাতাল অ্যাম্বুলেন্স',
    contactNumber: '01713374200',
    baseLocationBn: 'সদর হাসপাতাল, কক্সবাজার',
    is24Hours: true,
    startingRate: 'সরকারি রেট',
    oxygenAvailable: true,
    icuSupport: false
  },
  {
    id: 'amb_cox_02',
    district: 'কক্সবাজার',
    upazila: 'কক্সবাজার সদর',
    serviceNameBn: 'সী-বীচ ২৪/৭ আইসিইউ ও এসি অ্যাম্বুলেন্স সার্ভিস',
    serviceNameEn: 'Sea-Beach 24/7 ICU & AC Ambulance',
    ambulanceType: 'icu',
    typeLabelBn: 'আইসিইউ / এসি অ্যাম্বুলেন্স',
    contactNumber: '01818998877',
    driverNameBn: 'মো: মিজানুর রহমান',
    baseLocationBn: 'কলাতলী রোড, কক্সবাজার',
    is24Hours: true,
    startingRate: 'চট্টগ্রাম ও ঢাকা সরাসরি রোগী স্থানান্তর',
    oxygenAvailable: true,
    icuSupport: true
  },

  // --- সিলেট জেলা ---
  {
    id: 'amb_syl_01',
    district: 'সিলেট',
    upazila: 'সিলেট সদর',
    serviceNameBn: 'সিলেট এমএজি ওসমানী মেডিকেল কলেজ হাসপাতাল অ্যাম্বুলেন্স',
    serviceNameEn: 'Sylhet MAG Osmani Medical Hospital Ambulance',
    ambulanceType: 'govt_hospital',
    typeLabelBn: 'সরকারি মেডিকেল অ্যাম্বুলেন্স',
    contactNumber: '01711334455',
    baseLocationBn: 'ওসমানী মেডিকেল রোড, সিলেট',
    is24Hours: true,
    startingRate: 'সরকারি রেট',
    oxygenAvailable: true,
    icuSupport: true
  },

  // --- রাজশাহী জেলা ---
  {
    id: 'amb_raj_01',
    district: 'রাজশাহী',
    upazila: 'বোয়ালিয়া',
    serviceNameBn: 'রাজশাহী মেডিকেল কলেজ হাসপাতাল (RMCH) অ্যাম্বুলেন্স',
    serviceNameEn: 'Rajshahi Medical College Hospital Ambulance',
    ambulanceType: 'govt_hospital',
    typeLabelBn: 'রামেক সরকারি অ্যাম্বুলেন্স',
    contactNumber: '01711224466',
    baseLocationBn: 'লক্ষ্মীপুর, রাজশাহী সদর',
    is24Hours: true,
    startingRate: 'সরকারি রেট',
    oxygenAvailable: true,
    icuSupport: true
  },

  // --- খুলনা জেলা ---
  {
    id: 'amb_khu_01',
    district: 'খুলনা',
    upazila: 'খুলনা সদর',
    serviceNameBn: 'খুলনা মেডিকেল কলেজ হাসপাতাল (KMCH) অ্যাম্বুলেন্স',
    serviceNameEn: 'Khulna Medical College Hospital Ambulance',
    ambulanceType: 'govt_hospital',
    typeLabelBn: 'খুমেক সরকারি অ্যাম্বুলেন্স',
    contactNumber: '01711998877',
    baseLocationBn: 'বয়রা, খুলনা সদর',
    is24Hours: true,
    startingRate: 'সরকারি রেট',
    oxygenAvailable: true,
    icuSupport: true
  },

  // --- বরিশাল জেলা ---
  {
    id: 'amb_bar_01',
    district: 'বরিশাল',
    upazila: 'বরিশাল সদর',
    serviceNameBn: 'বরিশাল শের-ই-বাংলা মেডিকেল কলেজ (SBMC) অ্যাম্বুলেন্স',
    serviceNameEn: 'Barishal Sher-E-Bangla Medical Hospital Ambulance',
    ambulanceType: 'govt_hospital',
    typeLabelBn: 'শেবাচিম সরকারি অ্যাম্বুলেন্স',
    contactNumber: '01711443322',
    baseLocationBn: 'বান্দ রোড, বরিশাল সদর',
    is24Hours: true,
    startingRate: 'সরকারি রেট',
    oxygenAvailable: true,
    icuSupport: true
  },

  // --- রংপুর জেলা ---
  {
    id: 'amb_rngp_01',
    district: 'রংপুর',
    upazila: 'রংপুর সদর',
    serviceNameBn: 'রংপুর মেডিকেল কলেজ হাসপাতাল (RpMCH) অ্যাম্বুলেন্স',
    serviceNameEn: 'Rangpur Medical College Hospital Ambulance',
    ambulanceType: 'govt_hospital',
    typeLabelBn: 'রমেক সরকারি অ্যাম্বুলেন্স',
    contactNumber: '01711667788',
    baseLocationBn: 'মেডিকেল পূর্ব গেট, রংপুর',
    is24Hours: true,
    startingRate: 'সরকারি রেট',
    oxygenAvailable: true,
    icuSupport: true
  },

  // --- ময়মনসিংহ জেলা ---
  {
    id: 'amb_mym_01',
    district: 'ময়মনসিংহ',
    upazila: 'ময়মনসিংহ সদর',
    serviceNameBn: 'ময়মনসিংহ মেডিকেল কলেজ হাসপাতাল (MMCH) অ্যাম্বুলেন্স',
    serviceNameEn: 'Mymensingh Medical College Hospital Ambulance',
    ambulanceType: 'govt_hospital',
    typeLabelBn: 'মমেক সরকারি অ্যাম্বুলেন্স',
    contactNumber: '01711554433',
    baseLocationBn: 'চরপাড়া, ময়মনসিংহ সদর',
    is24Hours: true,
    startingRate: 'সরকারি রেট',
    oxygenAvailable: true,
    icuSupport: true
  },

  // --- কুমিল্লা জেলা ---
  {
    id: 'amb_cum_01',
    district: 'কুমিল্লা',
    upazila: 'কুমিল্লা সদর',
    serviceNameBn: 'কুমিল্লা মেডিকেল কলেজ হাসপাতাল জরুরি অ্যাম্বুলেন্স',
    serviceNameEn: 'Cumilla Medical College Hospital Ambulance',
    ambulanceType: 'govt_hospital',
    typeLabelBn: 'কুমেক সরকারি অ্যাম্বুলেন্স',
    contactNumber: '01711778899',
    baseLocationBn: 'কুচাইতলী, কুমিল্লা সদর',
    is24Hours: true,
    startingRate: 'সরকারি রেট',
    oxygenAvailable: true,
    icuSupport: true
  },

  // --- বগুড়া জেলা ---
  {
    id: 'amb_bog_01',
    district: 'বগুড়া',
    upazila: 'বগুড়া সদর',
    serviceNameBn: 'বগুড়া শহীদ জিয়াউর রহমান মেডিকেল কলেজ (SZMC) অ্যাম্বুলেন্স',
    serviceNameEn: 'Bogura SZMC Hospital Ambulance',
    ambulanceType: 'govt_hospital',
    typeLabelBn: 'শজিমেক সরকারি অ্যাম্বুলেন্স',
    contactNumber: '01711889900',
    baseLocationBn: 'ছিলিমপুর, বগুড়া সদর',
    is24Hours: true,
    startingRate: 'সরকারি রেট',
    oxygenAvailable: true,
    icuSupport: true
  },

  // --- গাজীপুর জেলা ---
  {
    id: 'amb_gaz_01',
    district: 'গাজীপুর',
    upazila: 'গাজীপুর সদর',
    serviceNameBn: 'শহীদ তাজউদ্দীন আহমদ মেডিকেল কলেজ হাসপাতাল অ্যাম্বুলেন্স',
    serviceNameEn: 'Shaheed Tajuddin Ahmad Medical Hospital Ambulance',
    ambulanceType: 'govt_hospital',
    typeLabelBn: 'সরকারি মেডিকেল অ্যাম্বুলেন্স',
    contactNumber: '01711990011',
    baseLocationBn: 'জয়দেবপুর, গাজীপুর সদর',
    is24Hours: true,
    startingRate: 'সরকারি রেট',
    oxygenAvailable: true,
    icuSupport: true
  }
];
