import { 
  CORE_6_SERVICE_CATEGORIES, 
  MASTER_1000_PROFESSIONS, 
  ALL_1000_PROFESSIONS_FLAT_LIST,
  Profession1000Item,
  CoreCategoryConfig
} from "./professions1000Data";

export {
  CORE_6_SERVICE_CATEGORIES,
  MASTER_1000_PROFESSIONS,
  ALL_1000_PROFESSIONS_FLAT_LIST
};

export type {
  Profession1000Item,
  CoreCategoryConfig
};

// Master List of 1,000+ Professions and Skills across Bangladesh with Hyper-Local Categories
export interface MasterProfession {
  id: string;
  titleBn: string;
  titleEn: string;
  categoryBn: string;
  categoryEn: string;
  group: "Technical" | "Healthcare" | "Education" | "ManualLabor" | "CreativeMedia" | "Transport" | "FashionBeauty" | "Agriculture" | "CorporateAdmin" | "TraditionalCrafts" | "Hospitality" | "Security";
  popularSkills: string[];
}

export interface MasterProfessionCategory {
  categoryBn: string;
  categoryEn: string;
  iconName: string;
  color: string;
  jobs: string[];
}

// 6 Core Master Profession Categories mapped with all 1,000 jobs
export const MASTER_PROFESSION_CATEGORIES: MasterProfessionCategory[] = CORE_6_SERVICE_CATEGORIES.map(cat => ({
  categoryBn: cat.categoryBn,
  categoryEn: cat.categoryEn,
  iconName: cat.iconName,
  color: cat.color,
  jobs: MASTER_1000_PROFESSIONS
    .filter(p => p.categoryBn === cat.categoryBn)
    .map(p => p.name)
}));

// 12 High-Demand Essential Professions explicitly required for quick-search & tags
export const FEATURED_12_CORE_PROFESSIONS = [
  {
    id: 9901,
    name: 'ইলেকট্রিশিয়ান (হাউজ ওয়্যারিং ও ইলেকট্রিক মেরামত)',
    category: 'ইলেকট্রিক, প্লাম্বিং ও গৃহস্থালী মেরামত সেবা',
    categoryEn: 'Electric, Plumbing & Home Repairs',
    subCategory: 'হাউজ ওয়্যারিং ও লাইটিং',
    keywords: 'electrician electric কারেন্ট ওয়্যারিং ফ্যান সুইচ সার্কিট ব্রেকার মিস্ত্রি'
  },
  {
    id: 9902,
    name: 'পেইন্টার (হোম ও দেয়াল রং মিস্ত্রি)',
    category: 'ইলেকট্রিক, প্লাম্বিং ও গৃহস্থালী মেরামত সেবা',
    categoryEn: 'Electric, Plumbing & Home Repairs',
    subCategory: 'রং ও পুটিং কাজ',
    keywords: 'painter paint ওয়াল পেইন্ট বার্নিশ এনামেল ডিসটেম্পার চুনকাম মিস্ত্রি'
  },
  {
    id: 9903,
    name: 'দৈনিক শ্রমিক (দিনমজুর ও নির্মাণ সহকারী)',
    category: 'গৃহস্থালী সহায়তা, রান্নাবান্না ও বিবিধ সেবা',
    categoryEn: 'Domestic Help, Cooking & Miscellaneous Services',
    subCategory: 'ম্যানুয়াল লেবার ও হেল্পার',
    keywords: 'daily laborer labor দিনমজুর শ্রমিক কায়িক মজুর মাটি কাটা মাল লোডিং হেল্পার'
  },
  {
    id: 9904,
    name: 'হোম কেয়ার নার্স (রোগীর সার্বক্ষণিক সেবা ও পরিচর্যা)',
    category: 'ব্যক্তিগত, ইভেন্ট ও কেয়ারগিভিং সেবা',
    categoryEn: 'Personal, Event & Caregiving Services',
    subCategory: 'পেশেন্ট কেয়ার নার্সিং',
    keywords: 'nurse nursing নার্স চিকিৎসা ইনজেকশন ড্রেসিং রোগীর সেবা ব্রাদার আয়া'
  },
  {
    id: 9905,
    name: 'ফুড ডেলিভারি রাইডার (খাবার ও রেস্টুরেন্ট পার্সেল)',
    category: 'পরিবহন, ড্রাইভিং ও লজিস্টিক হোম সার্ভিস',
    categoryEn: 'Transport, Driving & Logistics',
    subCategory: 'ডেলিভারি রাইডার',
    keywords: 'food delivery rider খাবার ডেলিভারি রাইডার মোটরসাইকেল বাইকার পার্সেল'
  },
  {
    id: 9906,
    name: 'রাইড শেয়ারিং ড্রাইভার (কার ও মোটরসাইকেল চালক)',
    category: 'পরিবহন, ড্রাইভিং ও লজিস্টিক হোম সার্ভিস',
    categoryEn: 'Transport, Driving & Logistics',
    subCategory: 'রাইড শেয়ারিং',
    keywords: 'ride-sharing driver uber পাঠাও কার ড্রাইভার বাইক রাইডার ট্যাক্সি পিকআপ'
  },
  {
    id: 9907,
    name: 'প্রফেশনাল ফটোগ্রাফার (ওয়েডিং, প্রোডাক্ট ও পোর্ট্রেট)',
    category: 'আইটি, ইলেকট্রনিক্স ও ডিজিটাল টেকনিক্যাল সাপোর্ট',
    categoryEn: 'IT, Electronics & Digital Support',
    subCategory: 'ফটোগ্রাফি ও মিডিয়া',
    keywords: 'photographer photo ছবি ক্যামেরা ডিএসএলআর ফটোশুট ইভেন্ট বিয়ে'
  },
  {
    id: 9908,
    name: 'ভিডিও এডিটর (সিনেমাটিক, রিলস ও ইউটিউব এডিটিং)',
    category: 'আইটি, ইলেকট্রনিক্স ও ডিজিটাল টেকনিক্যাল সাপোর্ট',
    categoryEn: 'IT, Electronics & Digital Support',
    subCategory: 'ভিডিও প্রোডাকশন',
    keywords: 'video editor editing প্রিমিয়ার প্রো আফটার ইফেক্টস রিলস শর্টস ইউটিউব'
  },
  {
    id: 9909,
    name: 'মসজিদের ইমাম ও খতিব (দোয়া, মিলাদ ও ধর্মীয় পরামর্শক)',
    category: 'ব্যক্তিগত, ইভেন্ট ও কেয়ারগিভিং সেবা',
    categoryEn: 'Personal, Event & Caregiving Services',
    subCategory: 'ধর্মীয় সেবা',
    keywords: 'imam imam-khatib ইমাম খতিব মিলাদ দোয়া জানাজা কোরআন শিক্ষা'
  },
  {
    id: 9910,
    name: 'হিন্দু পূজা ও বিবাহ পুরোহিত (ধর্মীয় আচার ও যজ্ঞ)',
    category: 'ব্যক্তিগত, ইভেন্ট ও কেয়ারগিভিং সেবা',
    categoryEn: 'Personal, Event & Caregiving Services',
    subCategory: 'ধর্মীয় সেবা',
    keywords: 'priest purohit পুরোহিত পূজা বিবাহ যজ্ঞ গীতা পাঠ ব্রাহ্মণ শ্রাদ্ধ'
  },
  {
    id: 9911,
    name: 'কৃষি ও খামার পরামর্শক (ফসল, সার, কীটনাশক ও ফলবাগান)',
    category: 'গৃহস্থালী সহায়তা, রান্নাবান্না ও বিবিধ সেবা',
    categoryEn: 'Domestic Help, Cooking & Miscellaneous Services',
    subCategory: 'কৃষি ও পশুপালন',
    keywords: 'agricultural consultant agriculture কৃষি চাষাবাদ সার কীটনাশক ফসল ফলবাগান খামার বীজ'
  },
  {
    id: 9912,
    name: 'হোম কেয়ার ডাক্তার (হোম ভিজিট ও প্রাথমিক স্বাস্থ্যসেবা)',
    category: 'ব্যক্তিগত, ইভেন্ট ও কেয়ারগিভিং সেবা',
    categoryEn: 'Personal, Event & Caregiving Services',
    subCategory: 'ডাক্তারি পরামর্শ ও ভিজিট',
    keywords: 'home care doctor doctor ডাক্তার চিকিৎসক এমবিবিএস প্রেসক্রিপশন হোম ভিজিট চেম্বার'
  }
];

// Flat searchable array of 1,000+ professions with synonyms, aliases and skills
export const ALL_PROFESSIONS_FLAT_LIST = [
  ...FEATURED_12_CORE_PROFESSIONS,
  ...MASTER_1000_PROFESSIONS.map(p => ({
    id: p.id,
    name: p.name,
    category: p.categoryBn,
    categoryEn: p.categoryEn,
    subCategory: p.subCategoryBn,
    keywords: `${p.name} ${p.categoryBn} ${p.categoryEn} ${p.subCategoryBn}`.toLowerCase()
  }))
];

// All 64 Districts of Bangladesh with Divisions & Thanas/Upazilas
export const BANGLADESH_GEO_DIRECTORY: Record<string, { division: string; thanas: string[] }> = {
  // Chittagong Hill Tracts (CHT)
  'খাগড়াছড়ি': {
    division: 'Chittagong Division (চট্টগ্রাম)',
    thanas: ['খাগড়াছড়ি সদর', 'দীঘিনালা', 'পানছড়ি', 'মহালছড়ি', 'মাটিরাঙ্গা', 'মানিকছড়ি', 'রামগড়', 'গুইমারা', 'লক্ষ্মীছড়ি']
  },
  'রাঙ্গামাটি': {
    division: 'Chittagong Division (চট্টগ্রাম)',
    thanas: ['রাঙ্গামাটি সদর', 'কাপ্তাই', 'কাউখালী', 'বাঘাইছড়ি', 'বরকল', 'জুরাছড়ি', 'রাজস্থলী', 'বিলাইছড়ি', 'নানিয়ারচর', 'লংগদু']
  },
  'বান্দরবান': {
    division: 'Chittagong Division (চট্টগ্রাম)',
    thanas: ['বান্দরবান সদর', 'রুমা', 'থানচি', 'রোয়াংছড়ি', 'লামা', 'আলীকদম', 'নাইক্ষ্যংছড়ি']
  },
  'চট্টগ্রাম': {
    division: 'Chittagong Division (চট্টগ্রাম)',
    thanas: ['কোতোয়ালী', 'পাঁচলাইশ', 'পাহাড়তলী', 'হালিশহর', 'আগ্রাবাদ', 'সীতাকুণ্ড', 'মীরসরাই', 'পটিয়া', 'হাটহাজারী', 'রাঙ্গুনিয়া', 'চন্দনাইশ', 'সাতকানিয়া', 'লোহাগাড়া', 'বাঁশখালী', 'আনোয়ারা', 'বোয়ালখালী', 'ফটিকছড়ি', 'সন্দ্বীপ', 'কর্ণফুলী']
  },
  'কক্সবাজার': {
    division: 'Chittagong Division (চট্টগ্রাম)',
    thanas: ['কক্সবাজার সদর', 'রামু', 'উখিয়া', 'টেকনাফ', 'চকোরিয়া', 'পেকুয়া', 'মহেশখালী', 'কুতুবদিয়া']
  },
  'কুমিল্লা': {
    division: 'Chittagong Division (চট্টগ্রাম)',
    thanas: ['আদর্শ সদর', 'সদর দক্ষিণ', 'দাউদকান্দি', 'চান্দিনা', 'মুরাদনগর', 'দেবীদ্বার', 'হোমনা', 'বুড়িচং', 'ব্রাহ্মণপাড়া', 'লাকসাম', 'মনোহরগঞ্জ', 'চৌদ্দগ্রাম', 'নাঙ্গলকোট', 'বরুড়া', 'তিতাস', 'মেঘনা', 'লালমাই']
  },
  'ফেনী': {
    division: 'Chittagong Division (চট্টগ্রাম)',
    thanas: ['ফেনী সদর', 'দাগনভূঁইয়া', 'সোনাগাজী', 'ছাগলনাইয়া', 'পরশুরাম', 'ফুলগাজী']
  },
  'নোয়াখালী': {
    division: 'Chittagong Division (চট্টগ্রাম)',
    thanas: ['নোয়াখালী সদর', 'বেগমগঞ্জ', 'চাটখিল', 'সেনবাগ', 'কোম্পানীগঞ্জ', 'হাতিয়া', 'সুবর্ণচর', 'কবিরহাট', 'সোনাইমুড়ী']
  },
  'লক্ষ্মীপুর': {
    division: 'Chittagong Division (চট্টগ্রাম)',
    thanas: ['লক্ষ্মীপুর সদর', 'রায়পুর', 'রামগঞ্জ', 'রামগতি', 'কমলনগর']
  },
  'চাঁদপুর': {
    division: 'Chittagong Division (চট্টগ্রাম)',
    thanas: ['চাঁদপুর সদর', 'হাজীগঞ্জ', 'ফরিদগঞ্জ', 'শাহরাস্তি', 'কচুয়া', 'মতলব উত্তর', 'মতলব দক্ষিণ', 'হাইমচর']
  },
  'ব্রাহ্মণবাড়িয়া': {
    division: 'Chittagong Division (চট্টগ্রাম)',
    thanas: ['ব্রাহ্মণবাড়িয়া সদর', 'কসবা', 'নবীনগর', 'সরাইল', 'আশুগঞ্জ', 'নাসিরনগর', 'বাঞ্ছারামপুর', 'আখাউড়া', 'বিজয়নগর']
  },

  // Dhaka Division
  'ঢাকা': {
    division: 'Dhaka Division (ঢাকা)',
    thanas: ['মিরপুর', 'ধানমন্ডি', 'গুলশান', 'উত্তরা', 'মোহাম্মদপুর', 'মতিঝিল', 'বাড্ডা', 'বনানী', 'তেজগাঁও', 'পল্টন', 'রমনা', 'শাহবাগ', 'যাত্রাবাড়ী', 'ডেমরা', 'খিলগাঁও', 'রামপুরা', 'লালবাগ', 'কোতোয়ালী', 'সূত্রাপুর', 'কাফরুল', 'শ্যামপুর', 'তুরাগ', 'হাজারীবাগ', 'সাভার', 'ধামরাই', 'কেরানীগঞ্জ', 'নবাবগঞ্জ', 'দোহার']
  },
  'গাজীপুর': {
    division: 'Dhaka Division (ঢাকা)',
    thanas: ['গাজীপুর সদর', 'টঙ্গী', 'শ্রীপুর', 'কালিয়াকৈর', 'কাপাসিয়া', 'কালীগঞ্জ']
  },
  'নারায়ণগঞ্জ': {
    division: 'Dhaka Division (ঢাকা)',
    thanas: ['নারায়ণগঞ্জ সদর', 'সিদ্ধিরগঞ্জ', 'ফতুল্লা', 'বন্দর', 'রূপগঞ্জ', 'সোনারগাঁও', 'আড়াইহাজার']
  },
  'টাঙ্গাইল': {
    division: 'Dhaka Division (ঢাকা)',
    thanas: ['টাঙ্গাইল সদর', 'মির্জাপুর', 'কালিহাতী', 'ঘাটাইল', 'মধুপুর', 'সখিপুর', 'গোপালপুর', 'নাগরপুর', 'দেলদুয়ার', 'ভূঞাপুর', 'বাসাইল', 'ধনবাড়ী']
  },
  'নরসিংদী': {
    division: 'Dhaka Division (ঢাকা)',
    thanas: ['নরসিংদী সদর', 'পলাশ', 'রায়পুরা', 'শিবপুর', 'বেলাবো', 'মনোহরদী']
  },
  'মানিকগঞ্জ': {
    division: 'Dhaka Division (ঢাকা)',
    thanas: ['মানিকগঞ্জ সদর', 'সিংগাইর', 'শিবালয়', 'ঘিওরে', 'দৌলতপুর', 'সাটুরিয়া', 'হরিরামপুর']
  },
  'মুন্সিগঞ্জ': {
    division: 'Dhaka Division (ঢাকা)',
    thanas: ['মুন্সিগঞ্জ সদর', 'টঙ্গীবাড়ী', 'সিরাজদিখান', 'লৌহজং', 'শ্রীনগর', 'গজারিয়া']
  },
  'ফরিদপুর': {
    division: 'Dhaka Division (ঢাকা)',
    thanas: ['ফরিদপুর সদর', 'বোয়ালমারী', 'মধুখালী', 'নগরকান্দা', 'ভাঙ্গা', 'আলফাডাঙ্গা', 'সদরপুর', 'চরভদ্রাসন', 'সালথা']
  },
  'কিশোরগঞ্জ': {
    division: 'Dhaka Division (ঢাকা)',
    thanas: ['কিশোরগঞ্জ সদর', 'ভৈরব', 'বাজিতপুর', 'হোসেনপুর', 'করিমগঞ্জ', 'তাড়াইল', 'পাকুন্দিয়া', 'কটিয়াদী', 'কুলিয়ারচর', 'ইটনা', 'মিঠামইন', 'অষ্টগ্রাম', 'নিকলী']
  },

  // Sylhet Division
  'সিলেট': {
    division: 'Sylhet Division (সিলেট)',
    thanas: ['সিলেট সদর', 'দক্ষিণ সুরমা', 'গোলাপগঞ্জ', 'বিয়ানীবাজার', 'জকিগঞ্জ', 'কানাইঘাট', 'ফেঞ্চুগঞ্জ', 'বালাগঞ্জ', 'বিশ্বনাথ', 'গোয়াইনঘাট', 'জৈন্তাপুর', 'কোম্পানীগঞ্জ', 'ওসমানীনগর']
  },
  'মৌলভীবাজার': {
    division: 'Sylhet Division (সিলেট)',
    thanas: ['মৌলভীবাজার সদর', 'শ্রীমঙ্গল', 'কমলগঞ্জ', 'কুলাউড়া', 'বড়লেখা', 'রাজনগর', 'জুড়ী']
  },
  'হবিগঞ্জ': {
    division: 'Sylhet Division (সিলেট)',
    thanas: ['হবিগঞ্জ সদর', 'নবীগঞ্জ', 'বাহুবল', 'চুনারুঘাট', 'মাধবপুর', 'আজমিরীগঞ্জ', 'বানিয়াচং', 'লাখাই', 'শায়স্তাগঞ্জ']
  },
  'সুনামগঞ্জ': {
    division: 'Sylhet Division (সিলেট)',
    thanas: ['সুনামগঞ্জ সদর', 'ছাতক', 'জগন্নাথপুর', 'তাহিরপুর', 'ধর্মপাশা', 'জামালগঞ্জ', 'দিরাই', 'শাল্লা', 'বিশ্বম্ভরপুর', 'দোয়ারাবাজার', 'দক্ষিণ সুনামগঞ্জ']
  },

  // Rajshahi Division
  'রাজশাহী': {
    division: 'Rajshahi Division (রাজশাহী)',
    thanas: ['বোয়ালিয়া', 'মতিহার', 'রাজপাড়া', 'শাহমখদুম', 'পবা', 'গোদাগাড়ী', 'তানোর', 'বাগমারা', 'মোহনপুর', 'পুঠিয়া', 'বাঘা', 'চারঘাট', 'দুর্গাপুর']
  },
  'বগুড়া': {
    division: 'Rajshahi Division (রাজশাহী)',
    thanas: ['বগুড়া সদর', 'শেরপুর', 'শাজাহানপুর', 'গাবতলী', 'সারিয়াকান্দি', 'ধুনট', 'আদমদীঘি', 'দুপচাঁচিয়া', 'শিবগঞ্জ', 'কাহালু', 'সোনাতলা', 'নন্দীগ্রাম']
  },
  'পাবনা': {
    division: 'Rajshahi Division (রাজশাহী)',
    thanas: ['পাবনা সদর', 'ঈশ্বরদী', 'সাঁথিয়া', 'চাটমোহর', 'সুজানগর', 'ফরিদপুর', 'বেড়া', 'ভাঙ্গুড়া', 'আটঘরিয়া']
  },

  // Khulna Division
  'খুলনা': {
    division: 'Khulna Division (খুলনা)',
    thanas: ['খুলনা সদর', 'সোনাডাঙ্গা', 'খালিশপুর', 'দৌলতপুর', 'খানজাহান আলী', 'ডুমুরিয়া', 'পাইকগাছা', 'তেরখাদা', 'রূপসা', 'বটিয়াঘাটা', 'ফুলতলা', 'দিঘলিয়া', 'দাকোপ', 'কয়রা']
  },
  'যশোর': {
    division: 'Khulna Division (খুলনা)',
    thanas: ['যশোর সদর', 'ঝিকরগাছা', 'শার্শা', 'অভয়নগর', 'মণিরামপুর', 'কেশবপুর', 'বাঘারপাড়া', 'চৌগাছা']
  },
  'কুষ্টিয়া': {
    division: 'Khulna Division (খুলনা)',
    thanas: ['কুষ্টিয়া সদর', 'কুমারখালী', 'ভেড়ামারা', 'মিরপুর', 'খোকসা', 'দৌলতপুর']
  },

  // Barishal Division
  'বরিশাল': {
    division: 'Barishal Division (বরিশাল)',
    thanas: ['বরিশাল সদর', 'বাবুগঞ্জ', 'উজিরপুর', 'গৌরনদী', 'আগৈলঝাড়া', 'মেহেন্দিগঞ্জ', 'মুলাদী', 'বাকেরগঞ্জ', 'বানারীপাড়া', 'হিজলা']
  },
  'পটুয়াখালী': {
    division: 'Barishal Division (বরিশাল)',
    thanas: ['পটুয়াখালী সদর', 'গলাচিপা', 'বাউফল', 'কলাপাড়া', 'দশমিনা', 'মির্জাগঞ্জ', 'দুমকি', 'রাঙ্গাবালী']
  },

  // Rangpur Division
  'রংপুর': {
    division: 'Rangpur Division (রংপুর)',
    thanas: ['রংপুর সদর', 'গঙ্গাচড়া', 'তারাগঞ্জ', 'বদরগঞ্জ', 'মিঠাপুকুর', 'পীরগাছা', 'পীরগঞ্জ', 'কাউনিয়া']
  },
  'দিনাজপুর': {
    division: 'Rangpur Division (রংপুর)',
    thanas: ['দিনাজপুর সদর', 'বীরগঞ্জ', 'কাহারোল', 'বোচাগঞ্জ', 'ফুলবাড়ী', 'পার্বতীপুর', 'নবাবগঞ্জ', 'ঘোড়াঘাট', 'হাকিমপুর', 'চিরিরবন্দর', 'খানসামা', 'বিরল']
  },

  // Mymensingh Division
  'ময়মনসিংহ': {
    division: 'Mymensingh Division (ময়মনসিংহ)',
    thanas: ['ময়মনসিংহ সদর', 'মুক্তাগাছা', 'ত্রিশাল', 'ফুলবাড়িয়া', 'গফরগাঁও', 'ভালুকা', 'নান্দাইল', 'ঈশ্বরগঞ্জ', 'হালুয়াঘাট', 'ধোবাউড়া', 'ফুলপুর', 'তারাকান্দা']
  },
  'জামালপুর': {
    division: 'Mymensingh Division (ময়মনসিংহ)',
    thanas: ['জামালপুর সদর', 'সরিষাবাড়ী', 'মেলান্দহ', 'ইসলামপুর', 'দেওয়ানগঞ্জ', 'মাদারগঞ্জ', 'বকশীগঞ্জ']
  },
  'নেত্রকোণা': {
    division: 'Mymensingh Division (ময়মনসিংহ)',
    thanas: ['নেত্রকোণা সদর', 'কেন্দুয়া', 'মদন', 'মোহনগঞ্জ', 'বারহাট্টা', 'কলমাকান্দা', 'পূর্বধলা', 'দুর্গাপুর', 'আটপাড়া', 'খালিয়াজুরী']
  },
  'শেরপুর': {
    division: 'Mymensingh Division (ময়মনসিংহ)',
    thanas: ['শেরপুর সদর', 'নকলা', 'নালিতাবাড়ী', 'শ্রীবরদী', 'ঝিনাইগাতী']
  },

  // Additional Dhaka Division Districts
  'গোপালগঞ্জ': {
    division: 'Dhaka Division (ঢাকা)',
    thanas: ['গোপালগঞ্জ সদর', 'কাটালীপাড়া', 'টুঙ্গিপাড়া', 'কাশিয়ানী', 'মুকসুদপুর']
  },
  'মাদারীপুর': {
    division: 'Dhaka Division (ঢাকা)',
    thanas: ['মাদারীপুর সদর', 'শিবচর', 'কালকিনি', 'রাজৈর', 'ডাসার']
  },
  'রাজবাড়ী': {
    division: 'Dhaka Division (ঢাকা)',
    thanas: ['রাজবাড়ী সদর', 'পাংশা', 'বালিয়াকান্দি', 'গোয়ালন্দ', 'কালুখালী']
  },
  'শরীয়তপুর': {
    division: 'Dhaka Division (ঢাকা)',
    thanas: ['শরীয়তপুর সদর', 'নড়িয়া', 'জাজিরা', 'গোসাইরহাট', 'ভেদরগঞ্জ', 'ডামুড্যা']
  },

  // Additional Rajshahi Division Districts
  'সিরাজগঞ্জ': {
    division: 'Rajshahi Division (রাজশাহী)',
    thanas: ['সিরাজগঞ্জ সদর', 'শাহজাদপুর', 'উল্লাপাড়া', 'বেলকুচি', 'কামারখন্দ', 'কাজীপুর', 'রায়গঞ্জ', 'তাড়াশ', 'চৌহালী']
  },
  'নাটোর': {
    division: 'Rajshahi Division (রাজশাহী)',
    thanas: ['নাটোর সদর', 'সিংড়া', 'বড়াইগ্রাম', 'গুরুদাসপুর', 'লালপুর', 'বাগাতিপাড়া', 'নলডাঙ্গা']
  },
  'নওগাঁ': {
    division: 'Rajshahi Division (রাজশাহী)',
    thanas: ['নওগাঁ সদর', 'মহাদেবপুর', 'মান্দা', 'পত্নীতলা', 'ধামইরহাট', 'নিয়ামতপুর', 'আত্রাই', 'রানীনগর', 'সাপাহার', 'পোরশা', 'বদলগাছী']
  },
  'চাঁপাইনবাবগঞ্জ': {
    division: 'Rajshahi Division (রাজশাহী)',
    thanas: ['চাঁপাইনবাবগঞ্জ সদর', 'শিবগঞ্জ', 'গোমস্তাপুর', 'নাচোল', 'ভোলাহাট']
  },
  'জয়পুরহাট': {
    division: 'Rajshahi Division (রাজশাহী)',
    thanas: ['জয়পুরহাট সদর', 'পাঁচবিবি', 'কালাই', 'ক্ষেতলাল', 'আক্কেলপুর']
  },

  // Additional Rangpur Division Districts
  'গাইবান্ধা': {
    division: 'Rangpur Division (রংপুর)',
    thanas: ['গাইবান্ধা সদর', 'গোবিন্দগঞ্জ', 'সুন্দরগঞ্জ', 'সাদুল্লাপুর', 'পলাশবাড়ী', 'সাঘাটা', 'ফুলছড়ি']
  },
  'কুড়িগ্রাম': {
    division: 'Rangpur Division (রংপুর)',
    thanas: ['কুড়িগ্রাম সদর', 'নাগেশ্বরী', 'ভুরুঙ্গামারী', 'উলিপুর', 'চিলমারী', 'রৌমারী', 'রাজিবপুর', 'রাজারহাট', 'ফুলবাড়ী']
  },
  'লালমনিরহাট': {
    division: 'Rangpur Division (রংপুর)',
    thanas: ['লালমনিরহাট সদর', 'পাটগ্রাম', 'হাতীবান্ধা', 'কালীগঞ্জ', 'আদিতমারী']
  },
  'নীলফামারী': {
    division: 'Rangpur Division (রংপুর)',
    thanas: ['নীলফামারী সদর', 'সৈয়দপুর', 'ডোমার', 'ডিমলা', 'জলঢাকা', 'কিশোরগঞ্জ']
  },
  'পঞ্চগড়': {
    division: 'Rangpur Division (রংপুর)',
    thanas: ['পঞ্চগড় সদর', 'তেঁতুলিয়া', 'দেবীগঞ্জ', 'বোদা', 'আটোয়ারী']
  },
  'ঠাকুরগাঁও': {
    division: 'Rangpur Division (রংপুর)',
    thanas: ['ঠাকুরগাঁও সদর', 'পীরগঞ্জ', 'বালিয়াডাঙ্গী', 'রাণীশংকৈল', 'হরিপুর']
  },

  // Additional Khulna Division Districts
  'সাতক্ষীরা': {
    division: 'Khulna Division (খুলনা)',
    thanas: ['সাতক্ষীরা সদর', 'শ্যামনগর', 'কালীগঞ্জ', 'তালা', 'কলারোয়া', 'আশাশুনি', 'দেবহাটা']
  },
  'বাগেরহাট': {
    division: 'Khulna Division (খুলনা)',
    thanas: ['বাগেরহাট সদর', 'মংলা', 'মোরেলগঞ্জ', 'শরণখোলা', 'রামপাল', 'ফকিরহাট', 'কচুয়া', 'চিতলমারী', 'মোল্লাহাট']
  },
  'ঝিনাইদহ': {
    division: 'Khulna Division (খুলনা)',
    thanas: ['ঝিনাইদহ সদর', 'শৈলকুপা', 'হরিণাকুণ্ডু', 'কালীগঞ্জ', 'কোটচাঁদপুর', 'মহেশপুর']
  },
  'মাগুরা': {
    division: 'Khulna Division (খুলনা)',
    thanas: ['মাগুরা সদর', 'শ্রীপুর', 'মহম্মদপুর', 'শালিখা']
  },
  'মেহেরপুর': {
    division: 'Khulna Division (খুলনা)',
    thanas: ['মেহেরপুর সদর', 'গাংনী', 'মুজিবনগর']
  },
  'নড়াইল': {
    division: 'Khulna Division (খুলনা)',
    thanas: ['নড়াইল সদর', 'লোহাগড়া', 'কালিয়া']
  },
  'চুয়াডাঙ্গা': {
    division: 'Khulna Division (খুলনা)',
    thanas: ['চুয়াডাঙ্গা সদর', 'আলমডাঙ্গা', 'দামুড়হুদা', 'জীবননগর']
  },

  // Additional Barishal Division Districts
  'ভোলা': {
    division: 'Barishal Division (বরিশাল)',
    thanas: ['ভোলা সদর', 'বোরহানউদ্দিন', 'চরফ্যাশন', 'দৌলতখান', 'লালমোহন', 'তজুমদ্দিন', 'মনপুরা']
  },
  'পিরোজপুর': {
    division: 'Barishal Division (বরিশাল)',
    thanas: ['পিরোজপুর সদর', 'মঠবাড়িয়া', 'ভাণ্ডারিয়া', 'নাজিরপুর', 'নেছারাবাদ (স্বরূপকাঠি)', 'কাউখালী', 'ইন্দুরকানী']
  },
  'বরগুনা': {
    division: 'Barishal Division (বরিশাল)',
    thanas: ['বরগুনা সদর', 'আমতলী', 'পাথরঘাটা', 'বেতাগী', 'বামনা', 'তালতলী']
  },
  'ঝালকাঠি': {
    division: 'Barishal Division (বরিশাল)',
    thanas: ['ঝালকাঠি সদর', 'নলছিটি', 'রাজাপুর', 'কাঁঠালিয়া']
  }
};
