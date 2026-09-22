/**
 * LOCATION MASTER TAXONOMY INDEX & MEMBER UID GENERATOR
 * Pre-defined static dataset for all Divisions, Districts, and Upazilas of Bangladesh
 * with explicit, non-conflicting 2-to-3 letter uppercase codes.
 */

export interface UpazilaItem {
  nameBn: string;
  nameEn: string;
  code: string; // 2-3 uppercase letters e.g., 'SDR', 'DGH', 'PNC'
}

export interface DistrictItem {
  nameBn: string;
  nameEn: string;
  code: string; // 3 uppercase letters e.g., 'KHG', 'RNG', 'BND', 'CTG', 'DHK'
  upazilas: UpazilaItem[];
}

export interface DivisionItem {
  nameBn: string;
  nameEn: string;
  code: string; // 2 uppercase letters e.g., 'CG', 'DH', 'SY', 'RJ', 'KH', 'BA', 'RP', 'MY'
  districts: DistrictItem[];
}

export const LOCATION_MASTER: DivisionItem[] = [
  {
    nameBn: 'চট্টগ্রাম',
    nameEn: 'Chattogram',
    code: 'CG',
    districts: [
      {
        nameBn: 'খাগড়াছড়ি',
        nameEn: 'Khagrachhari',
        code: 'KHG',
        upazilas: [
          { nameBn: 'খাগড়াছড়ি সদর', nameEn: 'Khagrachhari Sadar', code: 'SDR' },
          { nameBn: 'দীঘিনালা', nameEn: 'Dighinala', code: 'DGH' },
          { nameBn: 'মাটিরাঙ্গা', nameEn: 'Matiranga', code: 'MTR' },
          { nameBn: 'পানছড়ি', nameEn: 'Panchhari', code: 'PNC' },
          { nameBn: 'রামগড়', nameEn: 'Ramgarh', code: 'RMG' },
          { nameBn: 'মহালছড়ি', nameEn: 'Mahalchhari', code: 'MHL' },
          { nameBn: 'মানিকছড়ি', nameEn: 'Manikchhari', code: 'MNK' },
          { nameBn: 'লক্ষ্মীছড়ি', nameEn: 'Lakshmichhari', code: 'LXC' },
          { nameBn: 'গুইমারা', nameEn: 'Guimara', code: 'GMR' },
        ]
      },
      {
        nameBn: 'রাঙ্গামাটি',
        nameEn: 'Rangamati',
        code: 'RNG',
        upazilas: [
          { nameBn: 'রাঙ্গামাটি সদর', nameEn: 'Rangamati Sadar', code: 'SDR' },
          { nameBn: 'কাপ্তাই', nameEn: 'Kaptai', code: 'KPT' },
          { nameBn: 'বাঘাইছড়ি', nameEn: 'Baghaichhari', code: 'BGH' },
          { nameBn: 'বরকল', nameEn: 'Barkal', code: 'BRK' },
          { nameBn: 'নানিয়ারচর', nameEn: 'Naniarchar', code: 'NAN' },
          { nameBn: 'রাজস্থলী', nameEn: 'Rajasthali', code: 'RAJ' },
          { nameBn: 'জুরাছড়ি', nameEn: 'Jurachhari', code: 'JUR' },
          { nameBn: 'কাউখালী', nameEn: 'Kaukhali', code: 'KAU' },
          { nameBn: 'বিলাইছড়ি', nameEn: 'Belaichhari', code: 'BIL' },
          { nameBn: 'লংগদু', nameEn: 'Langadu', code: 'LNG' },
        ]
      },
      {
        nameBn: 'বান্দরবান',
        nameEn: 'Bandarban',
        code: 'BND',
        upazilas: [
          { nameBn: 'বান্দরবান সদর', nameEn: 'Bandarban Sadar', code: 'SDR' },
          { nameBn: 'রুমা', nameEn: 'Ruma', code: 'RUM' },
          { nameBn: 'থানচি', nameEn: 'Thanchi', code: 'THA' },
          { nameBn: 'রোয়াংছড়ি', nameEn: 'Rowangchhari', code: 'ROW' },
          { nameBn: 'লামা', nameEn: 'Lama', code: 'LAM' },
          { nameBn: 'আলীকদম', nameEn: 'Ali Kadam', code: 'ALK' },
          { nameBn: 'নাইক্ষ্যংছড়ি', nameEn: 'Naikhongchhari', code: 'NAI' },
        ]
      },
      {
        nameBn: 'চট্টগ্রাম',
        nameEn: 'Chattogram',
        code: 'CTG',
        upazilas: [
          { nameBn: 'কোতোয়ালী / সদর', nameEn: 'Kotwali / Sadar', code: 'SDR' },
          { nameBn: 'হাটহাজারী', nameEn: 'Hathazari', code: 'HAT' },
          { nameBn: 'রাউজান', nameEn: 'Rauzan', code: 'RAU' },
          { nameBn: 'সীতাকুণ্ড', nameEn: 'Sitakunda', code: 'SIT' },
          { nameBn: 'ফটিকছড়ি', nameEn: 'Fatikchhari', code: 'FTK' },
          { nameBn: 'মীরসরাই', nameEn: 'Mirsharai', code: 'MSR' },
          { nameBn: 'পটিয়া', nameEn: 'Patiya', code: 'PAT' },
          { nameBn: 'বোয়ালখালী', nameEn: 'Boalkhali', code: 'BOA' },
          { nameBn: 'চন্দনাইশ', nameEn: 'Chandanis', code: 'CDN' },
          { nameBn: 'আনোয়ারা', nameEn: 'Anwara', code: 'ANW' },
          { nameBn: 'বাঁশখালী', nameEn: 'Banshkhali', code: 'BNK' },
          { nameBn: 'লোহাগাড়া', nameEn: 'Lohagara', code: 'LOH' },
          { nameBn: 'সাতকানিয়া', nameEn: 'Satkania', code: 'STK' },
          { nameBn: 'সন্দ্বীপ', nameEn: 'Sandwip', code: 'SDP' },
          { nameBn: 'কর্ণফুলী', nameEn: 'Karnafuli', code: 'KRN' },
        ]
      },
      {
        nameBn: 'কক্সবাজার',
        nameEn: 'Cox\'s Bazar',
        code: 'CXB',
        upazilas: [
          { nameBn: 'কক্সবাজার সদর', nameEn: 'Cox\'s Bazar Sadar', code: 'SDR' },
          { nameBn: 'চকরিয়া', nameEn: 'Chakaria', code: 'CHK' },
          { nameBn: 'টেকনাফ', nameEn: 'Teknaf', code: 'TKN' },
          { nameBn: 'উখিয়া', nameEn: 'Ukhiya', code: 'UKH' },
          { nameBn: 'রামু', nameEn: 'Ramu', code: 'RAM' },
          { nameBn: 'মহেশখালী', nameEn: 'Maheshkhali', code: 'MHK' },
          { nameBn: 'কুতুবদিয়া', nameEn: 'Kutubdia', code: 'KUT' },
          { nameBn: 'পেকুয়া', nameEn: 'Pekua', code: 'PEK' },
          { nameBn: 'ঈদগাঁও', nameEn: 'Eidgaon', code: 'EDG' },
        ]
      },
      {
        nameBn: 'কুমিল্লা',
        nameEn: 'Cumilla',
        code: 'COM',
        upazilas: [
          { nameBn: 'কুমিল্লা আদর্শ সদর', nameEn: 'Cumilla Adarsha Sadar', code: 'SDR' },
          { nameBn: 'দাউদকান্দি', nameEn: 'Daudkandi', code: 'DAU' },
          { nameBn: 'চান্দিনা', nameEn: 'Chandina', code: 'CHD' },
          { nameBn: 'লাকসাম', nameEn: 'Laksam', code: 'LAK' },
          { nameBn: 'বুড়িচং', nameEn: 'Burichang', code: 'BUR' },
          { nameBn: 'চৌদ্দগ্রাম', nameEn: 'Chauddagram', code: 'CHG' },
          { nameBn: 'দেবীদ্বার', nameEn: 'Debidwar', code: 'DEB' },
          { nameBn: 'হোমনা', nameEn: 'Homna', code: 'HOM' },
          { nameBn: 'মুরাদনগর', nameEn: 'Muradnagar', code: 'MUR' },
          { nameBn: 'বরুড়া', nameEn: 'Barura', code: 'BAR' },
        ]
      },
      {
        nameBn: 'ফেনী',
        nameEn: 'Feni',
        code: 'FEN',
        upazilas: [
          { nameBn: 'ফেনী সদর', nameEn: 'Feni Sadar', code: 'SDR' },
          { nameBn: 'দাগনভূঞা', nameEn: 'Daganbhuiyan', code: 'DAG' },
          { nameBn: 'ছাগলনাইয়া', nameEn: 'Chhagalnaiya', code: 'CHG' },
          { nameBn: 'সোনাগাজী', nameEn: 'Sonagazi', code: 'SON' },
          { nameBn: 'পরশুরাম', nameEn: 'Parshuram', code: 'PAR' },
          { nameBn: 'ফুলগাজী', nameEn: 'Fulgazi', code: 'FUL' },
        ]
      },
      {
        nameBn: 'নোয়াখালী',
        nameEn: 'Noakhali',
        code: 'NOA',
        upazilas: [
          { nameBn: 'নোয়াখালী সদর (সুধারাম)', nameEn: 'Noakhali Sadar', code: 'SDR' },
          { nameBn: 'বেগমগঞ্জ', nameEn: 'Begumganj', code: 'BEG' },
          { nameBn: 'চাটখিল', nameEn: 'Chatkhil', code: 'CHK' },
          { nameBn: 'কোম্পানীগঞ্জ', nameEn: 'Companiganj', code: 'CPG' },
          { nameBn: 'হাতিয়া', nameEn: 'Hatiya', code: 'HAT' },
          { nameBn: 'সেনবাগ', nameEn: 'Senbagh', code: 'SEN' },
          { nameBn: 'সোনাইমুড়ী', nameEn: 'Sonaimuri', code: 'SNM' },
          { nameBn: 'সুবর্ণচর', nameEn: 'Subarnachar', code: 'SUB' },
          { nameBn: 'কবিরহাট', nameEn: 'Kabirhat', code: 'KAB' },
        ]
      },
      {
        nameBn: 'লক্ষ্মীপুর',
        nameEn: 'Lakshmipur',
        code: 'LAK',
        upazilas: [
          { nameBn: 'লক্ষ্মীপুর সদর', nameEn: 'Lakshmipur Sadar', code: 'SDR' },
          { nameBn: 'রায়পুর', nameEn: 'Raipur', code: 'RAI' },
          { nameBn: 'রামগঞ্জ', nameEn: 'Ramganj', code: 'RMG' },
          { nameBn: 'রামগতি', nameEn: 'Ramgati', code: 'RGT' },
          { nameBn: 'কমলনগর', nameEn: 'Kamalnagar', code: 'KML' },
        ]
      },
      {
        nameBn: 'চাঁদপুর',
        nameEn: 'Chandpur',
        code: 'CHN',
        upazilas: [
          { nameBn: 'চাঁদপুর সদর', nameEn: 'Chandpur Sadar', code: 'SDR' },
          { nameBn: 'হাজীগঞ্জ', nameEn: 'Hajiganj', code: 'HAJ' },
          { nameBn: 'ফরিদগঞ্জ', nameEn: 'Faridganj', code: 'FRD' },
          { nameBn: 'মতলব উত্তর', nameEn: 'Matlab North', code: 'MLN' },
          { nameBn: 'মতলব দক্ষিণ', nameEn: 'Matlab South', code: 'MLS' },
          { nameBn: 'কচুয়া', nameEn: 'Kachua', code: 'KCH' },
          { nameBn: 'শাহরাস্তি', nameEn: 'Shahrasti', code: 'SHA' },
          { nameBn: 'হাইমচর', nameEn: 'Haimchar', code: 'HMC' },
        ]
      },
      {
        nameBn: 'ব্রাহ্মণবাড়িয়া',
        nameEn: 'Brahmanbaria',
        code: 'BRB',
        upazilas: [
          { nameBn: 'ব্রাহ্মণবাড়িয়া সদর', nameEn: 'Brahmanbaria Sadar', code: 'SDR' },
          { nameBn: 'আশুগঞ্জ', nameEn: 'Ashuganj', code: 'ASH' },
          { nameBn: 'সরাইল', nameEn: 'Sarail', code: 'SAR' },
          { nameBn: 'নবীনগর', nameEn: 'Nabinagar', code: 'NAB' },
          { nameBn: 'কসবা', nameEn: 'Kasba', code: 'KAS' },
          { nameBn: 'আখাউড়া', nameEn: 'Akhaura', code: 'AKH' },
          { nameBn: 'নাসিরনগর', nameEn: 'Nasirnagar', code: 'NAS' },
          { nameBn: 'বাঞ্ছারামপুর', nameEn: 'Bancharampur', code: 'BAN' },
          { nameBn: 'বিজয়নগর', nameEn: 'Bijoynagar', code: 'BIJ' },
        ]
      },
    ]
  },
  {
    nameBn: 'ঢাকা',
    nameEn: 'Dhaka',
    code: 'DH',
    districts: [
      {
        nameBn: 'ঢাকা',
        nameEn: 'Dhaka',
        code: 'DHK',
        upazilas: [
          { nameBn: 'ধানমন্ডি', nameEn: 'Dhanmondi', code: 'DHN' },
          { nameBn: 'মিরপুর', nameEn: 'Mirpur', code: 'MIR' },
          { nameBn: 'গুলশান', nameEn: 'Gulshan', code: 'GUL' },
          { nameBn: 'উত্তরা', nameEn: 'Uttara', code: 'UTT' },
          { nameBn: 'সাভার', nameEn: 'Savar', code: 'SAV' },
          { nameBn: 'মোহাম্মদপুর', nameEn: 'Mohammadpur', code: 'MOH' },
          { nameBn: 'বাড্ডা', nameEn: 'Badda', code: 'BAD' },
          { nameBn: 'যাত্রাবাড়ী', nameEn: 'Jatrabari', code: 'JAT' },
          { nameBn: 'মতিঝিল', nameEn: 'Motijheel', code: 'MOT' },
          { nameBn: 'তেজগাঁও', nameEn: 'Tejgaon', code: 'TEJ' },
          { nameBn: 'বনানী', nameEn: 'Banani', code: 'BNI' },
          { nameBn: 'রমনা', nameEn: 'Ramna', code: 'RAM' },
          { nameBn: 'কেরানীগঞ্জ', nameEn: 'Keraniganj', code: 'KER' },
          { nameBn: 'ধামরাই', nameEn: 'Dhamrai', code: 'DHR' },
          { nameBn: 'দোহার', nameEn: 'Dohar', code: 'DOH' },
          { nameBn: 'নবাবগঞ্জ', nameEn: 'Nawabganj', code: 'NWB' },
        ]
      },
      {
        nameBn: 'গাজীপুর',
        nameEn: 'Gazipur',
        code: 'GAZ',
        upazilas: [
          { nameBn: 'গাজীপুর সদর / জয়দেবপুর', nameEn: 'Gazipur Sadar / Joydebpur', code: 'SDR' },
          { nameBn: 'টঙ্গী', nameEn: 'Tongi', code: 'TNG' },
          { nameBn: 'কালিয়াকৈর', nameEn: 'Kaliakair', code: 'KLK' },
          { nameBn: 'শ্রীপুর', nameEn: 'Sreepur', code: 'SRE' },
          { nameBn: 'কাপাসিয়া', nameEn: 'Kapasia', code: 'KAP' },
          { nameBn: 'কালীগঞ্জ', nameEn: 'Kaliganj', code: 'KAL' },
        ]
      },
      {
        nameBn: 'নারায়ণগঞ্জ',
        nameEn: 'Narayanganj',
        code: 'NAR',
        upazilas: [
          { nameBn: 'নারায়ণগঞ্জ সদর', nameEn: 'Narayanganj Sadar', code: 'SDR' },
          { nameBn: 'সিদ্ধিরগঞ্জ', nameEn: 'Siddhirganj', code: 'SID' },
          { nameBn: 'ফতুল্লা', nameEn: 'Fatullah', code: 'FAT' },
          { nameBn: 'বন্দর', nameEn: 'Bandar', code: 'BND' },
          { nameBn: 'সোনারগাঁও', nameEn: 'Sonargaon', code: 'SON' },
          { nameBn: 'রূপগঞ্জ', nameEn: 'Rupganj', code: 'RUP' },
          { nameBn: 'আড়াইহাজার', nameEn: 'Araihazar', code: 'ARA' },
        ]
      },
      {
        nameBn: 'টাঙ্গাইল',
        nameEn: 'Tangail',
        code: 'TAN',
        upazilas: [
          { nameBn: 'টাঙ্গাইল সদর', nameEn: 'Tangail Sadar', code: 'SDR' },
          { nameBn: 'মির্জাপুর', nameEn: 'Mirzapur', code: 'MIR' },
          { nameBn: 'ঘাটাইল', nameEn: 'Ghatail', code: 'GHT' },
          { nameBn: 'কালিহাতী', nameEn: 'Kalihati', code: 'KLH' },
          { nameBn: 'মধুপুর', nameEn: 'Madhupur', code: 'MDH' },
          { nameBn: 'সখিপুর', nameEn: 'Sakhipur', code: 'SAK' },
          { nameBn: 'গোপালপুর', nameEn: 'Gopalpur', code: 'GPL' },
          { nameBn: 'দেলদুয়ার', nameEn: 'Delduar', code: 'DEL' },
          { nameBn: 'নাগরপুর', nameEn: 'Nagarpur', code: 'NAG' },
          { nameBn: 'ভূঞাপুর', nameEn: 'Bhuapur', code: 'BHU' },
        ]
      },
      {
        nameBn: 'নরসিংদী',
        nameEn: 'Narsingdi',
        code: 'NSD',
        upazilas: [
          { nameBn: 'নরসিংদী সদর', nameEn: 'Narsingdi Sadar', code: 'SDR' },
          { nameBn: 'পলাশ', nameEn: 'Palash', code: 'PAL' },
          { nameBn: 'শিবপুর', nameEn: 'Shibpur', code: 'SHB' },
          { nameBn: 'মনোহরদী', nameEn: 'Monohardi', code: 'MON' },
          { nameBn: 'বেলাবো', nameEn: 'Belabo', code: 'BEL' },
          { nameBn: 'রায়পুরা', nameEn: 'Raipura', code: 'RAI' },
        ]
      },
      {
        nameBn: 'মানিকগঞ্জ',
        nameEn: 'Manikganj',
        code: 'MAN',
        upazilas: [
          { nameBn: 'মানিকগঞ্জ সদর', nameEn: 'Manikganj Sadar', code: 'SDR' },
          { nameBn: 'সিংগাইর', nameEn: 'Singair', code: 'SIN' },
          { nameBn: 'সাটুরিয়া', nameEn: 'Saturia', code: 'SAT' },
          { nameBn: 'ঘিওর', nameEn: 'Ghior', code: 'GHI' },
          { nameBn: 'শিবালয়', nameEn: 'Shibalaya', code: 'SHB' },
          { nameBn: 'হরিরামপুর', nameEn: 'Harirampur', code: 'HAR' },
          { nameBn: 'দৌলতপুর', nameEn: 'Daulatpur', code: 'DAU' },
        ]
      },
      {
        nameBn: 'মুন্সীগঞ্জ',
        nameEn: 'Munshiganj',
        code: 'MUN',
        upazilas: [
          { nameBn: 'মুন্সীগঞ্জ সদর', nameEn: 'Munshiganj Sadar', code: 'SDR' },
          { nameBn: 'শ্রীনগর', nameEn: 'Sreenagar', code: 'SRE' },
          { nameBn: 'সিরাজদিখান', nameEn: 'Sirajdikhan', code: 'SRJ' },
          { nameBn: 'লৌহজং', nameEn: 'Lohajang', code: 'LOH' },
          { nameBn: 'গজারিয়া', nameEn: 'Gajaria', code: 'GAJ' },
          { nameBn: 'টঙ্গীবাড়ী', nameEn: 'Tongibari', code: 'TNG' },
        ]
      },
      {
        nameBn: 'ফরিদপুর',
        nameEn: 'Faridpur',
        code: 'FAR',
        upazilas: [
          { nameBn: 'ফরিদপুর সদর', nameEn: 'Faridpur Sadar', code: 'SDR' },
          { nameBn: 'বোয়ালমারী', nameEn: 'Boalmari', code: 'BOA' },
          { nameBn: 'ভাঙ্গা', nameEn: 'Bhanga', code: 'BHN' },
          { nameBn: 'মধুখালী', nameEn: 'Madhukhali', code: 'MDH' },
          { nameBn: 'নগরকান্দা', nameEn: 'Nagarkanda', code: 'NAG' },
          { nameBn: 'আলফাডাঙ্গা', nameEn: 'Alfadanga', code: 'ALF' },
          { nameBn: 'সদরপুর', nameEn: 'Sadarpur', code: 'SDR' },
          { nameBn: 'চরভদ্রাসন', nameEn: 'Charbhadrasan', code: 'CHB' },
        ]
      },
      {
        nameBn: 'মাদারীপুর',
        nameEn: 'Madaripur',
        code: 'MAD',
        upazilas: [
          { nameBn: 'মাদারীপুর সদর', nameEn: 'Madaripur Sadar', code: 'SDR' },
          { nameBn: 'শিবচর', nameEn: 'Shibchar', code: 'SHB' },
          { nameBn: 'কালকিনি', nameEn: 'Kalkini', code: 'KLK' },
          { nameBn: 'রাজৈর', nameEn: 'Rajoir', code: 'RAJ' },
          { nameBn: 'ডাসার', nameEn: 'Dasar', code: 'DAS' },
        ]
      },
      {
        nameBn: 'গোপালগঞ্জ',
        nameEn: 'Gopalganj',
        code: 'GOP',
        upazilas: [
          { nameBn: 'গোপালগঞ্জ সদর', nameEn: 'Gopalganj Sadar', code: 'SDR' },
          { nameBn: 'টুঙ্গিপাড়া', nameEn: 'Tungipara', code: 'TUN' },
          { nameBn: 'কোটালীপাড়া', nameEn: 'Kotalipara', code: 'KOT' },
          { nameBn: 'কাশিয়ানী', nameEn: 'Kashiani', code: 'KAS' },
          { nameBn: 'মুকসুদপুর', nameEn: 'Muksudpur', code: 'MUK' },
        ]
      },
      {
        nameBn: 'রাজবাড়ী',
        nameEn: 'Rajbari',
        code: 'RJB',
        upazilas: [
          { nameBn: 'রাজবাড়ী সদর', nameEn: 'Rajbari Sadar', code: 'SDR' },
          { nameBn: 'পাংশা', nameEn: 'Pangsha', code: 'PNG' },
          { nameBn: 'বালিয়াকান্দি', nameEn: 'Baliakandi', code: 'BAL' },
          { nameBn: 'গোয়ালন্দ', nameEn: 'Goalanda', code: 'GOA' },
          { nameBn: 'কালুখালী', nameEn: 'Kalukhali', code: 'KLK' },
        ]
      },
      {
        nameBn: 'শরীয়তপুর',
        nameEn: 'Shariatpur',
        code: 'SHA',
        upazilas: [
          { nameBn: 'শরীয়তপুর সদর (পালং)', nameEn: 'Shariatpur Sadar', code: 'SDR' },
          { nameBn: 'জাজিরা', nameEn: 'Jajira', code: 'JAJ' },
          { nameBn: 'নড়িয়া', nameEn: 'Naria', code: 'NAR' },
          { nameBn: 'ভেদরগঞ্জ', nameEn: 'Bhedarganj', code: 'BHE' },
          { nameBn: 'ডামুড্যা', nameEn: 'Damudya', code: 'DAM' },
          { nameBn: 'গোসাইরহাট', nameEn: 'Gosairhat', code: 'GOS' },
        ]
      },
      {
        nameBn: 'কিশোরগঞ্জ',
        nameEn: 'Kishoreganj',
        code: 'KIS',
        upazilas: [
          { nameBn: 'কিশোরগঞ্জ সদর', nameEn: 'Kishoreganj Sadar', code: 'SDR' },
          { nameBn: 'ভৈরব', nameEn: 'Bhairab', code: 'BHA' },
          { nameBn: 'বাজিতপুর', nameEn: 'Bajitpur', code: 'BAJ' },
          { nameBn: 'করিমগঞ্জ', nameEn: 'Karimganj', code: 'KAR' },
          { nameBn: 'হোসেনপুর', nameEn: 'Hossainpur', code: 'HOS' },
          { nameBn: 'কটিয়াদী', nameEn: 'Katiadi', code: 'KAT' },
          { nameBn: 'পাকুন্দিয়া', nameEn: 'Pakundia', code: 'PAK' },
          { nameBn: 'নিকলী', nameEn: 'Nikli', code: 'NIK' },
          { nameBn: 'ইটনা', nameEn: 'Itna', code: 'ITN' },
          { nameBn: 'মিঠামইন', nameEn: 'Mithamoin', code: 'MIT' },
          { nameBn: 'অষ্টগ্রাম', nameEn: 'Austagram', code: 'AUS' },
        ]
      },
    ]
  },
  {
    nameBn: 'সিলেট',
    nameEn: 'Sylhet',
    code: 'SY',
    districts: [
      {
        nameBn: 'সিলেট',
        nameEn: 'Sylhet',
        code: 'SYL',
        upazilas: [
          { nameBn: 'সিলেট সদর', nameEn: 'Sylhet Sadar', code: 'SDR' },
          { nameBn: 'দক্ষিণ সুরমা', nameEn: 'South Surma', code: 'SSM' },
          { nameBn: 'গোলাপগঞ্জ', nameEn: 'Golapganj', code: 'GOL' },
          { nameBn: 'বিয়ানীবাজার', nameEn: 'Beanibazar', code: 'BEA' },
          { nameBn: 'জকিগঞ্জ', nameEn: 'Zakiganj', code: 'ZAK' },
          { nameBn: 'কানাইঘাট', nameEn: 'Kanaighat', code: 'KAN' },
          { nameBn: 'ফেঞ্চুগঞ্জ', nameEn: 'Fenchuganj', code: 'FEN' },
          { nameBn: 'বালাগঞ্জ', nameEn: 'Balaganj', code: 'BAL' },
          { nameBn: 'বিশ্বনাথ', nameEn: 'Bishwanath', code: 'BIS' },
          { nameBn: 'কোম্পানীগঞ্জ', nameEn: 'Companiganj', code: 'COM' },
          { nameBn: 'গোয়াইনঘাট', nameEn: 'Gowainghat', code: 'GOW' },
          { nameBn: 'জৈন্তাপুর', nameEn: 'Jaintiapur', code: 'JAI' },
          { nameBn: 'ওসমানীনগর', nameEn: 'Osmani Nagar', code: 'OSM' },
        ]
      },
      {
        nameBn: 'মৌলভীবাজার',
        nameEn: 'Moulvibazar',
        code: 'MOU',
        upazilas: [
          { nameBn: 'মৌলভীবাজার সদর', nameEn: 'Moulvibazar Sadar', code: 'SDR' },
          { nameBn: 'শ্রীমঙ্গল', nameEn: 'Sreemangal', code: 'SRE' },
          { nameBn: 'কমলগঞ্জ', nameEn: 'Kamalganj', code: 'KML' },
          { nameBn: 'কুলাউড়া', nameEn: 'Kulaura', code: 'KUL' },
          { nameBn: 'বড়লেখা', nameEn: 'Barlekha', code: 'BAR' },
          { nameBn: 'জুড়ী', nameEn: 'Juri', code: 'JUR' },
          { nameBn: 'রাজনগর', nameEn: 'Rajnagar', code: 'RAJ' },
        ]
      },
      {
        nameBn: 'হবিগঞ্জ',
        nameEn: 'Habiganj',
        code: 'HAB',
        upazilas: [
          { nameBn: 'হবিগঞ্জ সদর', nameEn: 'Habiganj Sadar', code: 'SDR' },
          { nameBn: 'মাধবপুর', nameEn: 'Madhabpur', code: 'MAD' },
          { nameBn: 'নবীগঞ্জ', nameEn: 'Nabiganj', code: 'NAB' },
          { nameBn: 'বাহুবল', nameEn: 'Bahubal', code: 'BAH' },
          { nameBn: 'চুনারুঘাট', nameEn: 'Chunarughat', code: 'CHU' },
          { nameBn: 'বানিয়াচং', nameEn: 'Baniachong', code: 'BAN' },
          { nameBn: 'লাখাই', nameEn: 'Lakhai', code: 'LAK' },
          { nameBn: 'আজমিরীগঞ্জ', nameEn: 'Ajmiriganj', code: 'AJM' },
          { nameBn: 'শায়েস্তাগঞ্জ', nameEn: 'Shayestaganj', code: 'SHA' },
        ]
      },
      {
        nameBn: 'সুনামগঞ্জ',
        nameEn: 'Sunamganj',
        code: 'SUN',
        upazilas: [
          { nameBn: 'সুনামগঞ্জ সদর', nameEn: 'Sunamganj Sadar', code: 'SDR' },
          { nameBn: 'ছাতক', nameEn: 'Chhatak', code: 'CHH' },
          { nameBn: 'জগন্নাথপুর', nameEn: 'Jagannathpur', code: 'JAG' },
          { nameBn: 'দিরাই', nameEn: 'Derai', code: 'DER' },
          { nameBn: 'তাহিরপুর', nameEn: 'Tahirpur', code: 'TAH' },
          { nameBn: 'ধর্মপাশা', nameEn: 'Dharmapasha', code: 'DHA' },
          { nameBn: 'জামালগঞ্জ', nameEn: 'Jamalganj', code: 'JAM' },
          { nameBn: 'শাল্লা', nameEn: 'Shalla', code: 'SHA' },
          { nameBn: 'দোয়ারাবাজার', nameEn: 'Dowarabazar', code: 'DOW' },
          { nameBn: 'বিশ্বম্ভরপুর', nameEn: 'Bishwambarpur', code: 'BIS' },
          { nameBn: 'শান্তিগঞ্জ', nameEn: 'Shantiganj', code: 'SHT' },
        ]
      },
    ]
  },
  {
    nameBn: 'রাজশাহী',
    nameEn: 'Rajshahi',
    code: 'RJ',
    districts: [
      {
        nameBn: 'রাজশাহী',
        nameEn: 'Rajshahi',
        code: 'RSH',
        upazilas: [
          { nameBn: 'বোয়ালিয়া / রাজশাহী সদর', nameEn: 'Boalia / Rajshahi Sadar', code: 'SDR' },
          { nameBn: 'পবা', nameEn: 'Paba', code: 'PAB' },
          { nameBn: 'গোদাগাড়ী', nameEn: 'Godagari', code: 'GOD' },
          { nameBn: 'তানোর', nameEn: 'Tanor', code: 'TAN' },
          { nameBn: 'বাঘা', nameEn: 'Bagha', code: 'BAG' },
          { nameBn: 'চারঘাট', nameEn: 'Charghat', code: 'CHA' },
          { nameBn: 'পুঠিয়া', nameEn: 'Puthia', code: 'PUT' },
          { nameBn: 'দুর্গাপুর', nameEn: 'Durgapur', code: 'DUR' },
          { nameBn: 'মোহনপুর', nameEn: 'Mohanpur', code: 'MOH' },
          { nameBn: 'বাগমারা', nameEn: 'Bagmara', code: 'BGM' },
        ]
      },
      {
        nameBn: 'বগুড়া',
        nameEn: 'Bogura',
        code: 'BOG',
        upazilas: [
          { nameBn: 'বগুড়া সদর', nameEn: 'Bogura Sadar', code: 'SDR' },
          { nameBn: 'শেরপুর', nameEn: 'Sherpur', code: 'SHE' },
          { nameBn: 'শিবগঞ্জ', nameEn: 'Shibganj', code: 'SHB' },
          { nameBn: 'ধুনট', nameEn: 'Dhunat', code: 'DHU' },
          { nameBn: 'গাবতলী', nameEn: 'Gabtali', code: 'GAB' },
          { nameBn: 'কাহালু', nameEn: 'Kahalu', code: 'KAH' },
          { nameBn: 'নন্দীগ্রাম', nameEn: 'Nandigram', code: 'NAN' },
          { nameBn: 'সারিয়াকান্দি', nameEn: 'Sariakandi', code: 'SAR' },
          { nameBn: 'শাজাহানপুর', nameEn: 'Shajahanpur', code: 'SHA' },
          { nameBn: 'দুপচাঁচিয়া', nameEn: 'Dupchanchia', code: 'DUP' },
          { nameBn: 'আদমদীঘি', nameEn: 'Adamdighi', code: 'ADA' },
          { nameBn: 'সোনাতলা', nameEn: 'Sonatala', code: 'SON' },
        ]
      },
      {
        nameBn: 'পাবনা',
        nameEn: 'Pabna',
        code: 'PAB',
        upazilas: [
          { nameBn: 'পাবনা সদর', nameEn: 'Pabna Sadar', code: 'SDR' },
          { nameBn: 'ঈশ্বরদী', nameEn: 'Ishwardi', code: 'ISH' },
          { nameBn: 'সাঁথিয়া', nameEn: 'Santhia', code: 'SAN' },
          { nameBn: 'বেড়া', nameEn: 'Bera', code: 'BER' },
          { nameBn: 'সুজানগর', nameEn: 'Sujanagar', code: 'SUJ' },
          { nameBn: 'চাটমোহর', nameEn: 'Chatmohar', code: 'CHT' },
          { nameBn: 'ভাঙ্গুড়া', nameEn: 'Bhangura', code: 'BHN' },
          { nameBn: 'ফরিদপুর', nameEn: 'Faridpur', code: 'FAR' },
          { nameBn: 'আটঘরিয়া', nameEn: 'Atgharia', code: 'ATG' },
        ]
      },
      {
        nameBn: 'সিরাজগঞ্জ',
        nameEn: 'Sirajganj',
        code: 'SIR',
        upazilas: [
          { nameBn: 'সিরাজগঞ্জ সদর', nameEn: 'Sirajganj Sadar', code: 'SDR' },
          { nameBn: 'শাহজাদপুর', nameEn: 'Shahjadpur', code: 'SHA' },
          { nameBn: 'উল্লাপাড়া', nameEn: 'Ullapara', code: 'ULL' },
          { nameBn: 'বেলকুচি', nameEn: 'Belkuchi', code: 'BEL' },
          { nameBn: 'রায়গঞ্জ', nameEn: 'Raiganj', code: 'RAI' },
          { nameBn: 'তাড়াশ', nameEn: 'Tarash', code: 'TAR' },
          { nameBn: 'কাজীপুর', nameEn: 'Kazipur', code: 'KAZ' },
          { nameBn: 'কামারখন্দ', nameEn: 'Kamarkhanda', code: 'KAM' },
          { nameBn: 'চৌহালী', nameEn: 'Chauhali', code: 'CHU' },
        ]
      },
      {
        nameBn: 'নওগাঁ',
        nameEn: 'Naogaon',
        code: 'NAO',
        upazilas: [
          { nameBn: 'নওগাঁ সদর', nameEn: 'Naogaon Sadar', code: 'SDR' },
          { nameBn: 'মহাদেবপুর', nameEn: 'Mohadevpur', code: 'MOH' },
          { nameBn: 'পত্নীতলা', nameEn: 'Patnitala', code: 'PAT' },
          { nameBn: 'ধামইরহাট', nameEn: 'Dhamoirhat', code: 'DHA' },
          { nameBn: 'বদলগাছী', nameEn: 'Badalgachhi', code: 'BAD' },
          { nameBn: 'মান্দা', nameEn: 'Manda', code: 'MAN' },
          { nameBn: 'রানীনগর', nameEn: 'Raninagar', code: 'RAN' },
          { nameBn: 'আত্রাই', nameEn: 'Atrai', code: 'ATR' },
          { nameBn: 'নিয়ামতপুর', nameEn: 'Niamatpur', code: 'NIA' },
          { nameBn: 'পোরশা', nameEn: 'Porsha', code: 'POR' },
          { nameBn: 'সপাহার', nameEn: 'Sapahar', code: 'SAP' },
        ]
      },
      {
        nameBn: 'নাটোর',
        nameEn: 'Natore',
        code: 'NAT',
        upazilas: [
          { nameBn: 'নাটোর সদর', nameEn: 'Natore Sadar', code: 'SDR' },
          { nameBn: 'সিংড়া', nameEn: 'Singra', code: 'SIN' },
          { nameBn: 'বড়াইগ্রাম', nameEn: 'Baraigram', code: 'BAR' },
          { nameBn: 'গুরুদাসপুর', nameEn: 'Gurudaspur', code: 'GUR' },
          { nameBn: 'লালপুর', nameEn: 'Lalpur', code: 'LAL' },
          { nameBn: 'বাগাতিপাড়া', nameEn: 'Bagatipara', code: 'BAG' },
          { nameBn: 'নলডাঙ্গা', nameEn: 'Naldanga', code: 'NAL' },
        ]
      },
      {
        nameBn: 'চাঁপাইনবাবগঞ্জ',
        nameEn: 'Chapainawabganj',
        code: 'CPN',
        upazilas: [
          { nameBn: 'চাঁপাইনবাবগঞ্জ সদর', nameEn: 'Chapainawabganj Sadar', code: 'SDR' },
          { nameBn: 'শিবগঞ্জ', nameEn: 'Shibganj', code: 'SHB' },
          { nameBn: 'গোমস্তাপুর', nameEn: 'Gomastapur', code: 'GOM' },
          { nameBn: 'নাচোল', nameEn: 'Nachole', code: 'NAC' },
          { nameBn: 'ভোলাহাট', nameEn: 'Bholahat', code: 'BHO' },
        ]
      },
      {
        nameBn: 'জয়পুরহাট',
        nameEn: 'Joypurhat',
        code: 'JOY',
        upazilas: [
          { nameBn: 'জয়পুরহাট সদর', nameEn: 'Joypurhat Sadar', code: 'SDR' },
          { nameBn: 'পাঁচবিবি', nameEn: 'Panchbibi', code: 'PAN' },
          { nameBn: 'কালাই', nameEn: 'Kalai', code: 'KAL' },
          { nameBn: 'ক্ষেতলাল', nameEn: 'Khetlal', code: 'KHE' },
          { nameBn: 'আক্কেলপুর', nameEn: 'Akkelpur', code: 'AKK' },
        ]
      },
    ]
  },
  {
    nameBn: 'খুলনা',
    nameEn: 'Khulna',
    code: 'KH',
    districts: [
      {
        nameBn: 'খুলনা',
        nameEn: 'Khulna',
        code: 'KHL',
        upazilas: [
          { nameBn: 'খুলনা সদর / খালিশপুর', nameEn: 'Khulna Sadar / Khalishpur', code: 'SDR' },
          { nameBn: 'দৌলতপুর', nameEn: 'Daulatpur', code: 'DAU' },
          { nameBn: 'সোনাডাঙ্গা', nameEn: 'Sonadanga', code: 'SON' },
          { nameBn: 'ডুমুরিয়া', nameEn: 'Dumuria', code: 'DUM' },
          { nameBn: 'পাইকগাছা', nameEn: 'Paikgachha', code: 'PAI' },
          { nameBn: 'কয়রা', nameEn: 'Koyra', code: 'KOY' },
          { nameBn: 'বটিয়াঘাটা', nameEn: 'Batiaghata', code: 'BAT' },
          { nameBn: 'রূপসা', nameEn: 'Rupsha', code: 'RUP' },
          { nameBn: 'তেরখাদা', nameEn: 'Terokhada', code: 'TER' },
          { nameBn: 'ফুলতলা', nameEn: 'Phultala', code: 'PHU' },
          { nameBn: 'দাকোপ', nameEn: 'Dacope', code: 'DAC' },
        ]
      },
      {
        nameBn: 'যশোর',
        nameEn: 'Jashore',
        code: 'JAS',
        upazilas: [
          { nameBn: 'যশোর সদর', nameEn: 'Jashore Sadar', code: 'SDR' },
          { nameBn: 'ঝিকরগাছা', nameEn: 'Jhikargachha', code: 'JHI' },
          { nameBn: 'শার্শা (বেনাপোল)', nameEn: 'Sharsha / Benapole', code: 'SHA' },
          { nameBn: 'মণিরামপুর', nameEn: 'Manirampur', code: 'MAN' },
          { nameBn: 'কেশবপুর', nameEn: 'Keshabpur', code: 'KES' },
          { nameBn: 'বাঘারপাড়া', nameEn: 'Bagherpara', code: 'BAG' },
          { nameBn: 'অভয়নগর', nameEn: 'Abhaynagar', code: 'ABH' },
          { nameBn: 'চৌগাছা', nameEn: 'Chaugachha', code: 'CHA' },
        ]
      },
      {
        nameBn: 'সাতক্ষীরা',
        nameEn: 'Satkhira',
        code: 'SAT',
        upazilas: [
          { nameBn: 'সাতক্ষীরা সদর', nameEn: 'Satkhira Sadar', code: 'SDR' },
          { nameBn: 'শ্যামনগর', nameEn: 'Shyamnagar', code: 'SHY' },
          { nameBn: 'কালীগঞ্জ', nameEn: 'Kaliganj', code: 'KAL' },
          { nameBn: 'আশাশুনি', nameEn: 'Assasuni', code: 'ASS' },
          { nameBn: 'কলারোয়া', nameEn: 'Kalaroa', code: 'KLR' },
          { nameBn: 'তালা', nameEn: 'Tala', code: 'TAL' },
          { nameBn: 'দেবহাটা', nameEn: 'Debhata', code: 'DEB' },
        ]
      },
      {
        nameBn: 'কুষ্টিয়া',
        nameEn: 'Kushtia',
        code: 'KUS',
        upazilas: [
          { nameBn: 'কুষ্টিয়া সদর', nameEn: 'Kushtia Sadar', code: 'SDR' },
          { nameBn: 'কুমারখালী', nameEn: 'Kumarkhali', code: 'KUM' },
          { nameBn: 'মিরপুর', nameEn: 'Mirpur', code: 'MIR' },
          { nameBn: 'ভেড়ামারা', nameEn: 'Bheramara', code: 'BHE' },
          { nameBn: 'খোকসা', nameEn: 'Khoksa', code: 'KHO' },
          { nameBn: 'দৌলতপুর', nameEn: 'Daulatpur', code: 'DAU' },
        ]
      },
      {
        nameBn: 'বাগেরহাট',
        nameEn: 'Bagerhat',
        code: 'BAG',
        upazilas: [
          { nameBn: 'বাগেরহাট সদর', nameEn: 'Bagerhat Sadar', code: 'SDR' },
          { nameBn: 'মোংলা', nameEn: 'Mongla', code: 'MON' },
          { nameBn: 'মোরেলগঞ্জ', nameEn: 'Morrelganj', code: 'MOR' },
          { nameBn: 'রামপাল', nameEn: 'Rampal', code: 'RAM' },
          { nameBn: 'শরণখোলা', nameEn: 'Sarankhola', code: 'SAR' },
          { nameBn: 'কচুয়া', nameEn: 'Kachua', code: 'KAC' },
          { nameBn: 'ফকিরহাট', nameEn: 'Fakirhat', code: 'FAK' },
          { nameBn: 'মোল্লাহাট', nameEn: 'Mollahat', code: 'MOL' },
          { nameBn: 'চিতলমারী', nameEn: 'Chitalmari', code: 'CHI' },
        ]
      },
      {
        nameBn: 'ঝিনাইদহ',
        nameEn: 'Jhenaidah',
        code: 'JHE',
        upazilas: [
          { nameBn: 'ঝিনাইদহ সদর', nameEn: 'Jhenaidah Sadar', code: 'SDR' },
          { nameBn: 'কালীগঞ্জ', nameEn: 'Kaliganj', code: 'KAL' },
          { nameBn: 'কোটচাঁদপুর', nameEn: 'Kotchandpur', code: 'KOT' },
          { nameBn: 'মহেশপুর', nameEn: 'Maheshpur', code: 'MAH' },
          { nameBn: 'শৈলকুপা', nameEn: 'Shailkupa', code: 'SHA' },
          { nameBn: 'হরিণাকুণ্ডু', nameEn: 'Harinakunda', code: 'HAR' },
        ]
      },
      {
        nameBn: 'চুয়াডাঙ্গা',
        nameEn: 'Chuadanga',
        code: 'CHU',
        upazilas: [
          { nameBn: 'চুয়াডাঙ্গা সদর', nameEn: 'Chuadanga Sadar', code: 'SDR' },
          { nameBn: 'আলমডাঙ্গা', nameEn: 'Alamdanga', code: 'ALA' },
          { nameBn: 'দামুড়হুদা', nameEn: 'Damurhuda', code: 'DAM' },
          { nameBn: 'জীবননগর', nameEn: 'Jibannagar', code: 'JIB' },
        ]
      },
      {
        nameBn: 'মেহেরপুর',
        nameEn: 'Meherpur',
        code: 'MEH',
        upazilas: [
          { nameBn: 'মেহেরপুর সদর', nameEn: 'Meherpur Sadar', code: 'SDR' },
          { nameBn: 'গাংনী', nameEn: 'Gangni', code: 'GAN' },
          { nameBn: 'মুজিবনগর', nameEn: 'Mujibnagar', code: 'MUJ' },
        ]
      },
      {
        nameBn: 'মাগুরা',
        nameEn: 'Magura',
        code: 'MAG',
        upazilas: [
          { nameBn: 'মাগুরা সদর', nameEn: 'Magura Sadar', code: 'SDR' },
          { nameBn: 'শ্রীপুর', nameEn: 'Sreepur', code: 'SRE' },
          { nameBn: 'মহম্মদপুর', nameEn: 'Mohammadpur', code: 'MOH' },
          { nameBn: 'শালিখা', nameEn: 'Shalikha', code: 'SHA' },
        ]
      },
      {
        nameBn: 'নড়াইল',
        nameEn: 'Narail',
        code: 'NRL',
        upazilas: [
          { nameBn: 'নড়াইল সদর', nameEn: 'Narail Sadar', code: 'SDR' },
          { nameBn: 'লোহাগড়া', nameEn: 'Lohagara', code: 'LOH' },
          { nameBn: 'কালিয়া', nameEn: 'Kalia', code: 'KAL' },
        ]
      },
    ]
  },
  {
    nameBn: 'বরিশাল',
    nameEn: 'Barishal',
    code: 'BA',
    districts: [
      {
        nameBn: 'বরিশাল',
        nameEn: 'Barishal',
        code: 'BAR',
        upazilas: [
          { nameBn: 'বরিশাল সদর (কোতোয়ালী)', nameEn: 'Barishal Sadar', code: 'SDR' },
          { nameBn: 'বাকেরগঞ্জ', nameEn: 'Bakerganj', code: 'BAK' },
          { nameBn: 'বাবুগঞ্জ', nameEn: 'Babuganj', code: 'BAB' },
          { nameBn: 'উজিরপুর', nameEn: 'Wazirpur', code: 'WAZ' },
          { nameBn: 'বানারীপাড়া', nameEn: 'Banaripara', code: 'BAN' },
          { nameBn: 'গৌরনদী', nameEn: 'Gournadi', code: 'GOU' },
          { nameBn: 'আগৈলঝাড়া', nameEn: 'Agailjhara', code: 'AGA' },
          { nameBn: 'মুলাদী', nameEn: 'Muladi', code: 'MUL' },
          { nameBn: 'হিজলা', nameEn: 'Hizla', code: 'HIZ' },
          { nameBn: 'মেহেন্দিগঞ্জ', nameEn: 'Mehendiganj', code: 'MEH' },
        ]
      },
      {
        nameBn: 'পটুয়াখালী',
        nameEn: 'Patuakhali',
        code: 'PAT',
        upazilas: [
          { nameBn: 'পটুয়াখালী সদর', nameEn: 'Patuakhali Sadar', code: 'SDR' },
          { nameBn: 'কলাপাড়া (কুয়াকাটা)', nameEn: 'Kalapara / Kuakata', code: 'KAL' },
          { nameBn: 'গলাচিপা', nameEn: 'Galachipa', code: 'GAL' },
          { nameBn: 'বাউফল', nameEn: 'Bauphal', code: 'BAU' },
          { nameBn: 'দুমকি', nameEn: 'Dumki', code: 'DUM' },
          { nameBn: 'মির্জাগঞ্জ', nameEn: 'Mirzaganj', code: 'MIR' },
          { nameBn: 'দশমিনা', nameEn: 'Dashmina', code: 'DAS' },
          { nameBn: 'রাঙ্গাবালী', nameEn: 'Rangabali', code: 'RAN' },
        ]
      },
      {
        nameBn: 'ভোলা',
        nameEn: 'Bhola',
        code: 'BHO',
        upazilas: [
          { nameBn: 'ভোলা সদর', nameEn: 'Bhola Sadar', code: 'SDR' },
          { nameBn: 'দৌলতখান', nameEn: 'Daulatkhan', code: 'DAU' },
          { nameBn: 'বোরহানউদ্দিন', nameEn: 'Borhanuddin', code: 'BOR' },
          { nameBn: 'তজুমদ্দিন', nameEn: 'Tazumuddin', code: 'TAZ' },
          { nameBn: 'লালমোহন', nameEn: 'Lalmohan', code: 'LAL' },
          { nameBn: 'চরফ্যাশন', nameEn: 'Charfasson', code: 'CHF' },
          { nameBn: 'মনপুরা', nameEn: 'Manpura', code: 'MAN' },
        ]
      },
      {
        nameBn: 'পিরোজপুর',
        nameEn: 'Pirojpur',
        code: 'PIR',
        upazilas: [
          { nameBn: 'পিরোজপুর সদর', nameEn: 'Pirojpur Sadar', code: 'SDR' },
          { nameBn: 'মঠবাড়িয়া', nameEn: 'Mathbaria', code: 'MAT' },
          { nameBn: 'ভাণ্ডারিয়া', nameEn: 'Bhandaria', code: 'BHA' },
          { nameBn: 'নাজিরপুর', nameEn: 'Nazirpur', code: 'NAZ' },
          { nameBn: 'কাউখালী', nameEn: 'Kaukhali', code: 'KAU' },
          { nameBn: 'স্বরূপকাঠি (নেছারাবাদ)', nameEn: 'Nesarabad / Swarupkathi', code: 'NES' },
          { nameBn: 'ইন্দুরকানী', nameEn: 'Indurkani', code: 'IND' },
        ]
      },
      {
        nameBn: 'বরগুনা',
        nameEn: 'Barguna',
        code: 'BRG',
        upazilas: [
          { nameBn: 'বরগুনা সদর', nameEn: 'Barguna Sadar', code: 'SDR' },
          { nameBn: 'আমতলী', nameEn: 'Amtali', code: 'AMT' },
          { nameBn: 'পাথরঘাটা', nameEn: 'Patharghata', code: 'PAT' },
          { nameBn: 'বেতাগী', nameEn: 'Betagi', code: 'BET' },
          { nameBn: 'বামনা', nameEn: 'Bamna', code: 'BAM' },
          { nameBn: 'তালতলী', nameEn: 'Taltali', code: 'TAL' },
        ]
      },
      {
        nameBn: 'ঝালকাঠি',
        nameEn: 'Jhalokathi',
        code: 'JHA',
        upazilas: [
          { nameBn: 'ঝালকাঠি সদর', nameEn: 'Jhalokathi Sadar', code: 'SDR' },
          { nameBn: 'নলছিটি', nameEn: 'Nalchity', code: 'NAL' },
          { nameBn: 'রাজাপুর', nameEn: 'Rajapur', code: 'RAJ' },
          { nameBn: 'কাঠালিয়া', nameEn: 'Kathalia', code: 'KAT' },
        ]
      },
    ]
  },
  {
    nameBn: 'রংপুর',
    nameEn: 'Rangpur',
    code: 'RP',
    districts: [
      {
        nameBn: 'রংপুর',
        nameEn: 'Rangpur',
        code: 'RPR',
        upazilas: [
          { nameBn: 'রংপুর সদর / কোতোয়ালী', nameEn: 'Rangpur Sadar', code: 'SDR' },
          { nameBn: 'পীরগঞ্জ', nameEn: 'Pirganj', code: 'PIR' },
          { nameBn: 'মিঠাপুকুর', nameEn: 'Mithapukur', code: 'MIT' },
          { nameBn: 'বদরগঞ্জ', nameEn: 'Badarganj', code: 'BAD' },
          { nameBn: 'কাউনিয়া', nameEn: 'Kaunia', code: 'KAU' },
          { nameBn: 'পীরগাছা', nameEn: 'Pirgachha', code: 'PRG' },
          { nameBn: 'তারাগঞ্জ', nameEn: 'Taraganj', code: 'TAR' },
          { nameBn: 'গঙ্গাচড়া', nameEn: 'Gangachhara', code: 'GAN' },
        ]
      },
      {
        nameBn: 'দিনাজপুর',
        nameEn: 'Dinajpur',
        code: 'DIN',
        upazilas: [
          { nameBn: 'দিনাজপুর সদর', nameEn: 'Dinajpur Sadar', code: 'SDR' },
          { nameBn: 'বীরগঞ্জ', nameEn: 'Birganj', code: 'BIR' },
          { nameBn: 'ফুলবাড়ী', nameEn: 'Phulbari', code: 'PHU' },
          { nameBn: 'পার্বতীপুর', nameEn: 'Parbatipur', code: 'PAR' },
          { nameBn: 'বিরামপুর', nameEn: 'Birampur', code: 'BRP' },
          { nameBn: 'নবাবগঞ্জ', nameEn: 'Nawabganj', code: 'NAW' },
          { nameBn: 'বোচাগঞ্জ', nameEn: 'Bochaganj', code: 'BOC' },
          { nameBn: 'চিরিরবন্দর', nameEn: 'Chirirbandar', code: 'CHI' },
          { nameBn: 'কাহারোল', nameEn: 'Kaharole', code: 'KAH' },
          { nameBn: 'ঘোড়াঘাট', nameEn: 'Ghoraghat', code: 'GHO' },
          { nameBn: 'হাকিমপুর (হিলি)', nameEn: 'Hakimpur / Hili', code: 'HAK' },
          { nameBn: 'খানসামা', nameEn: 'Khansama', code: 'KHA' },
          { nameBn: 'বীরল', nameEn: 'Birol', code: 'BRL' },
        ]
      },
      {
        nameBn: 'গাইবান্ধা',
        nameEn: 'Gaibandha',
        code: 'GAI',
        upazilas: [
          { nameBn: 'গাইবান্ধা সদর', nameEn: 'Gaibandha Sadar', code: 'SDR' },
          { nameBn: 'গোবিন্দগঞ্জ', nameEn: 'Gobindaganj', code: 'GOB' },
          { nameBn: 'পলাশবাড়ী', nameEn: 'Palashbari', code: 'PAL' },
          { nameBn: 'সুন্দরগঞ্জ', nameEn: 'Sundarganj', code: 'SUN' },
          { nameBn: 'সাদুল্লাপুর', nameEn: 'Sadullapur', code: 'SAD' },
          { nameBn: 'সাঘাটা', nameEn: 'Saghata', code: 'SAG' },
          { nameBn: 'ফুলছড়ি', nameEn: 'Fulchhari', code: 'FUL' },
        ]
      },
      {
        nameBn: 'কুড়িগ্রাম',
        nameEn: 'Kurigram',
        code: 'KUR',
        upazilas: [
          { nameBn: 'কুড়িগ্রাম সদর', nameEn: 'Kurigram Sadar', code: 'SDR' },
          { nameBn: 'নাগেশ্বরী', nameEn: 'Nageshwari', code: 'NAG' },
          { nameBn: 'ভূরুঙ্গামারী', nameEn: 'Bhurungamari', code: 'BHU' },
          { nameBn: 'উলিপুর', nameEn: 'Ulipur', code: 'ULI' },
          { nameBn: 'চিলমারী', nameEn: 'Chilmari', code: 'CHI' },
          { nameBn: 'রৌমারী', nameEn: 'Roumari', code: 'ROU' },
          { nameBn: 'রাজীবপুর', nameEn: 'Rajibpur', code: 'RAJ' },
          { nameBn: 'রাজারহাট', nameEn: 'Rajarhat', code: 'RJH' },
          { nameBn: 'ফুলবাড়ী', nameEn: 'Phulbari', code: 'PHU' },
        ]
      },
      {
        nameBn: 'নীলফামারী',
        nameEn: 'Nilphamari',
        code: 'NIL',
        upazilas: [
          { nameBn: 'নীলফামারী সদর', nameEn: 'Nilphamari Sadar', code: 'SDR' },
          { nameBn: 'সৈয়দপুর', nameEn: 'Saidpur', code: 'SAI' },
          { nameBn: 'ডোমার', nameEn: 'Domar', code: 'DOM' },
          { nameBn: 'ডিমলা', nameEn: 'Dimla', code: 'DIM' },
          { nameBn: 'জলঢাকা', nameEn: 'Jaldhaka', code: 'JAL' },
          { nameBn: 'কিশোরগঞ্জ', nameEn: 'Kishoreganj', code: 'KIS' },
        ]
      },
      {
        nameBn: 'পঞ্চগড়',
        nameEn: 'Panchagarh',
        code: 'PAN',
        upazilas: [
          { nameBn: 'পঞ্চগড় সদর', nameEn: 'Panchagarh Sadar', code: 'SDR' },
          { nameBn: 'তেঁতুলিয়া', nameEn: 'Tentulia', code: 'TEN' },
          { nameBn: 'বোদা', nameEn: 'Boda', code: 'BOD' },
          { nameBn: 'দেবীগঞ্জ', nameEn: 'Debiganj', code: 'DEB' },
          { nameBn: 'আটোয়ারী', nameEn: 'Atwari', code: 'ATW' },
        ]
      },
      {
        nameBn: 'ঠাকুরগাঁও',
        nameEn: 'Thakurgaon',
        code: 'THA',
        upazilas: [
          { nameBn: 'ঠাকুরগাঁও সদর', nameEn: 'Thakurgaon Sadar', code: 'SDR' },
          { nameBn: 'পীরগঞ্জ', nameEn: 'Pirganj', code: 'PIR' },
          { nameBn: 'বালিয়াডাঙ্গী', nameEn: 'Baliadangi', code: 'BAL' },
          { nameBn: 'রাণীশংকৈল', nameEn: 'Ranisankail', code: 'RAN' },
          { nameBn: 'হরিপুর', nameEn: 'Haripur', code: 'HAR' },
        ]
      },
      {
        nameBn: 'লালমনিরহাট',
        nameEn: 'Lalmonirhat',
        code: 'LAL',
        upazilas: [
          { nameBn: 'লালমনিরহাট সদর', nameEn: 'Lalmonirhat Sadar', code: 'SDR' },
          { nameBn: 'হাতীবান্ধা', nameEn: 'Hatibandha', code: 'HAT' },
          { nameBn: 'পাটগ্রাম', nameEn: 'Patgram', code: 'PAT' },
          { nameBn: 'কালীগঞ্জ', nameEn: 'Kaliganj', code: 'KAL' },
          { nameBn: 'আদিতমারী', nameEn: 'Aditmari', code: 'ADI' },
        ]
      },
    ]
  },
  {
    nameBn: 'ময়মনসিংহ',
    nameEn: 'Mymensingh',
    code: 'MY',
    districts: [
      {
        nameBn: 'ময়মনসিংহ',
        nameEn: 'Mymensingh',
        code: 'MYM',
        upazilas: [
          { nameBn: 'ময়মনসিংহ সদর', nameEn: 'Mymensingh Sadar', code: 'SDR' },
          { nameBn: 'মুক্তাগাছা', nameEn: 'Muktagachha', code: 'MUK' },
          { nameBn: 'ত্রিশাল', nameEn: 'Trishal', code: 'TRI' },
          { nameBn: 'ভালুকা', nameEn: 'Bhaluka', code: 'BHA' },
          { nameBn: 'গফরগাঁও', nameEn: 'Gafargaon', code: 'GAF' },
          { nameBn: 'ঈশ্বরগঞ্জ', nameEn: 'Ishwarganj', code: 'ISH' },
          { nameBn: 'নান্দাইল', nameEn: 'Nandail', code: 'NAN' },
          { nameBn: 'ফুলবাড়িয়া', nameEn: 'Phulbaria', code: 'PHU' },
          { nameBn: 'হালুয়াঘাট', nameEn: 'Haluaghat', code: 'HAL' },
          { nameBn: 'ধোবাউড়া', nameEn: 'Dhobaura', code: 'DHO' },
          { nameBn: 'গৌরীপুর', nameEn: 'Gouripur', code: 'GOU' },
          { nameBn: 'ফুলপুর', nameEn: 'Phulpur', code: 'PHP' },
          { nameBn: 'তারাকান্দা', nameEn: 'Tarakanda', code: 'TAR' },
        ]
      },
      {
        nameBn: 'জামালপুর',
        nameEn: 'Jamalpur',
        code: 'JAM',
        upazilas: [
          { nameBn: 'জামালপুর সদর', nameEn: 'Jamalpur Sadar', code: 'SDR' },
          { nameBn: 'সরিষাবাড়ী', nameEn: 'Sarishabari', code: 'SAR' },
          { nameBn: 'মেলান্দহ', nameEn: 'Melandaha', code: 'MEL' },
          { nameBn: 'ইসলামপুর', nameEn: 'Islampur', code: 'ISL' },
          { nameBn: 'দেওয়ানগঞ্জ', nameEn: 'Dewanganj', code: 'DEW' },
          { nameBn: 'বকশীগঞ্জ', nameEn: 'Bakshiganj', code: 'BAK' },
          { nameBn: 'মাদারগঞ্জ', nameEn: 'Madarganj', code: 'MAD' },
        ]
      },
      {
        nameBn: 'নেত্রকোণা',
        nameEn: 'Netrokona',
        code: 'NET',
        upazilas: [
          { nameBn: 'নেত্রকোণা সদর', nameEn: 'Netrokona Sadar', code: 'SDR' },
          { nameBn: 'দুর্গাপুর', nameEn: 'Durgapur', code: 'DUR' },
          { nameBn: 'পূর্বধলা', nameEn: 'Purbadhala', code: 'PUR' },
          { nameBn: 'কেন্দুয়া', nameEn: 'Kendua', code: 'KEN' },
          { nameBn: 'মদন', nameEn: 'Madan', code: 'MAD' },
          { nameBn: 'মোহনগঞ্জ', nameEn: 'Mohanganj', code: 'MOH' },
          { nameBn: 'কলমাকান্দা', nameEn: 'Kalmakanda', code: 'KAL' },
          { nameBn: 'বারহাট্টা', nameEn: 'Barhatta', code: 'BAR' },
          { nameBn: 'আটপাড়া', nameEn: 'Atpara', code: 'ATP' },
          { nameBn: 'খালিয়াজুরী', nameEn: 'Khaliajuri', code: 'KHA' },
        ]
      },
      {
        nameBn: 'শেরপুর',
        nameEn: 'Sherpur',
        code: 'SHE',
        upazilas: [
          { nameBn: 'শেরপুর সদর', nameEn: 'Sherpur Sadar', code: 'SDR' },
          { nameBn: 'নালিতাবাড়ী', nameEn: 'Nalitabari', code: 'NAL' },
          { nameBn: 'নকলা', nameEn: 'Nakla', code: 'NAK' },
          { nameBn: 'শ্রীবরদী', nameEn: 'Sreebardi', code: 'SRE' },
          { nameBn: 'ঝিনাইগাতী', nameEn: 'Jhenaigati', code: 'JHE' },
        ]
      },
    ]
  },
];

// Helper: Normalize String for resilient matching
const normalize = (str: string = ''): string => {
  return str
    .replace(/[,\-_.\s()\/]/g, '')
    .replace(/ড়/g, 'ড়')
    .replace(/ঢ়/g, 'ঢ়')
    .replace(/য়/g, 'য়')
    .trim()
    .toLowerCase();
};

/**
 * Get all Divisions list
 */
export const getAllDivisions = (): DivisionItem[] => {
  return LOCATION_MASTER;
};

/**
 * Find Division by Code or Name
 */
export const findDivision = (divKey: string): DivisionItem | undefined => {
  if (!divKey) return LOCATION_MASTER[0]; // Default Chattogram
  const norm = normalize(divKey);
  return LOCATION_MASTER.find(
    d => d.code.toLowerCase() === norm ||
         normalize(d.nameBn) === norm ||
         normalize(d.nameEn) === norm ||
         norm.includes(normalize(d.nameBn)) ||
         norm.includes(normalize(d.nameEn))
  );
};

/**
 * Get all Districts under a specific Division
 */
export const getDistrictsByDivision = (divKey?: string): DistrictItem[] => {
  if (!divKey) {
    // Return all districts across all divisions
    return LOCATION_MASTER.flatMap(d => d.districts);
  }
  const division = findDivision(divKey);
  return division ? division.districts : LOCATION_MASTER[0].districts;
};

/**
 * Find District by Code or Name
 */
export const findDistrict = (distKey: string, divKey?: string): { division: DivisionItem; district: DistrictItem } | undefined => {
  if (!distKey) return undefined;
  const normDist = normalize(distKey);

  // If division provided, check that division first
  if (divKey) {
    const division = findDivision(divKey);
    if (division) {
      const match = division.districts.find(
        d => d.code.toLowerCase() === normDist ||
             normalize(d.nameBn) === normDist ||
             normalize(d.nameEn) === normDist ||
             normDist.includes(normalize(d.nameBn)) ||
             normDist.includes(normalize(d.nameEn))
      );
      if (match) return { division, district: match };
    }
  }

  // Check all divisions
  for (const division of LOCATION_MASTER) {
    const match = division.districts.find(
      d => d.code.toLowerCase() === normDist ||
           normalize(d.nameBn) === normDist ||
           normalize(d.nameEn) === normDist ||
           normDist.includes(normalize(d.nameBn)) ||
           normDist.includes(normalize(d.nameEn))
    );
    if (match) return { division, district: match };
  }

  return undefined;
};

/**
 * Get Upazilas under a District
 */
export const getUpazilasByDistrict = (distKey: string, divKey?: string): UpazilaItem[] => {
  const result = findDistrict(distKey, divKey);
  if (result) return result.district.upazilas;

  // Fallback to Khagrachhari Upazilas
  return LOCATION_MASTER[0].districts[0].upazilas;
};

/**
 * Find Upazila by Code or Name
 */
export const findUpazila = (upazilaKey: string, distKey?: string, divKey?: string): { division: DivisionItem; district: DistrictItem; upazila: UpazilaItem } | undefined => {
  const normUpazila = normalize(upazilaKey || 'সদর');

  if (distKey) {
    const distResult = findDistrict(distKey, divKey);
    if (distResult) {
      const match = distResult.district.upazilas.find(
        u => u.code.toLowerCase() === normUpazila ||
             normalize(u.nameBn) === normUpazila ||
             normalize(u.nameEn) === normUpazila ||
             normUpazila.includes(normalize(u.nameBn)) ||
             normalize(u.nameBn).includes(normUpazila) ||
             normUpazila.includes(normalize(u.nameEn)) ||
             normalize(u.nameEn).includes(normUpazila)
      );
      if (match) {
        return { division: distResult.division, district: distResult.district, upazila: match };
      }
      // If 'সদর' or generic matches
      if (normUpazila.includes('সদর') || normUpazila.includes('sadar')) {
        const sadar = distResult.district.upazilas.find(u => u.code === 'SDR') || distResult.district.upazilas[0];
        return { division: distResult.division, district: distResult.district, upazila: sadar };
      }
      // Return first upazila if no exact match found
      return { division: distResult.division, district: distResult.district, upazila: distResult.district.upazilas[0] };
    }
  }

  // Global search
  for (const division of LOCATION_MASTER) {
    for (const district of division.districts) {
      const match = district.upazilas.find(
        u => u.code.toLowerCase() === normUpazila ||
             normalize(u.nameBn) === normUpazila ||
             normalize(u.nameEn) === normUpazila
      );
      if (match) {
        return { division, district, upazila: match };
      }
    }
  }

  // Default fallback to Khagrachhari Sadar
  const defaultDiv = LOCATION_MASTER[0];
  const defaultDist = defaultDiv.districts[0];
  const defaultUpz = defaultDist.upazilas[0];
  return { division: defaultDiv, district: defaultDist, upazila: defaultUpz };
};

/**
 * Resolves exact 2-to-3 letter codes without string truncation:
 * Output: { divCode: 'CG', distCode: 'KHG', upazilaCode: 'DGH' }
 */
export const getLocationCodes = (
  divisionNameOrCode: string = '',
  districtNameOrCode: string = '',
  upazilaNameOrCode: string = ''
): { divCode: string; distCode: string; upazilaCode: string; divisionBn: string; districtBn: string; upazilaBn: string } => {
  const match = findUpazila(upazilaNameOrCode, districtNameOrCode, divisionNameOrCode);

  if (match) {
    return {
      divCode: match.division.code,
      distCode: match.district.code,
      upazilaCode: match.upazila.code,
      divisionBn: match.division.nameBn,
      districtBn: match.district.nameBn,
      upazilaBn: match.upazila.nameBn,
    };
  }

  // Specific fallback lookups
  const div = findDivision(divisionNameOrCode) || LOCATION_MASTER[0];
  const dist = findDistrict(districtNameOrCode, div.code)?.district || div.districts[0];
  const upz = dist.upazilas.find(u => normalize(u.nameBn) === normalize(upazilaNameOrCode)) || dist.upazilas[0];

  return {
    divCode: div.code,
    distCode: dist.code,
    upazilaCode: upz.code,
    divisionBn: div.nameBn,
    districtBn: dist.nameBn,
    upazilaBn: upz.nameBn,
  };
};

/**
 * Sequential Counter Key generator for persistent sequence per Upazila:
 * e.g. "jhadimadi_seq_CG-KHG-DGH" -> increments 1, 2, 3...
 */
export const getNextUpazilaSequence = (
  divCode: string,
  distCode: string,
  upazilaCode: string
): string => {
  const storageKey = `jhadimadi_seq_${divCode}_${distCode}_${upazilaCode}`.toUpperCase();
  let currentSeq = 1;

  try {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed > 0) {
        currentSeq = parsed + 1;
      }
    }
    localStorage.setItem(storageKey, String(currentSeq));
  } catch (err) {
    // If localStorage unavailable, generate random 4-digit number
    currentSeq = Math.floor(1 + Math.random() * 999);
  }

  return String(currentSeq).padStart(4, '0');
};

/**
 * Master Member UID Synthesizer:
 * Format: [DivCode]-[DistCode]-[UpazilaCode]-[4-Digit Sequence] (e.g. CG-KHG-DGH-0001)
 */
export const generateMemberUID = (
  divisionNameOrCode: string = 'চট্টগ্রাম',
  districtNameOrCode: string = 'খাগড়াছড়ি',
  upazilaNameOrCode: string = 'দীঘিনালা',
  customSequence?: number | string
): string => {
  const codes = getLocationCodes(divisionNameOrCode, districtNameOrCode, upazilaNameOrCode);

  let seqStr = '';
  if (customSequence !== undefined && customSequence !== null && String(customSequence).trim()) {
    const cleanNum = parseInt(String(customSequence).replace(/[^0-9]/g, ''), 10);
    seqStr = !isNaN(cleanNum) ? String(cleanNum).padStart(4, '0') : '0001';
  } else {
    seqStr = getNextUpazilaSequence(codes.divCode, codes.distCode, codes.upazilaCode);
  }

  return `${codes.divCode}-${codes.distCode}-${codes.upazilaCode}-${seqStr}`;
};

/**
 * Form Validator & Parser for Member UID
 */
export const parseMemberUID = (uid: string): {
  isValid: boolean;
  divCode?: string;
  distCode?: string;
  upazilaCode?: string;
  sequence?: string;
  divisionNameBn?: string;
  districtNameBn?: string;
  upazilaNameBn?: string;
} => {
  if (!uid || typeof uid !== 'string') return { isValid: false };
  const parts = uid.trim().toUpperCase().split('-');
  if (parts.length < 4) return { isValid: false };

  const [divCode, distCode, upazilaCode, sequence] = parts;
  const div = LOCATION_MASTER.find(d => d.code === divCode);
  const dist = div?.districts.find(d => d.code === distCode);
  const upz = dist?.upazilas.find(u => u.code === upazilaCode);

  return {
    isValid: !!(div && dist && upz),
    divCode,
    distCode,
    upazilaCode,
    sequence,
    divisionNameBn: div?.nameBn,
    districtNameBn: dist?.nameBn,
    upazilaNameBn: upz?.nameBn,
  };
};

/**
 * Generates District-based Unique ID formatted with the first 3 letters of the district and a sequential number (e.g., "KSA-001" for Khagrachhari).
 */
export const generateDistrictFormattedUID = (
  districtName: string = 'খাগড়াছড়ি',
  sequenceNum: number | string = '001'
): string => {
  const norm = (districtName || '').trim().toLowerCase();
  let prefix = 'KSA';

  if (norm.includes('খাগড়াছড়ি') || norm.includes('khagrachhari') || norm.includes('khagrachari') || norm.includes('khg') || norm.includes('ksa')) {
    prefix = 'KSA';
  } else if (norm.includes('ঢাকা') || norm.includes('dhaka') || norm.includes('dhk')) {
    prefix = 'DHK';
  } else if (norm.includes('চট্টগ্রাম') || norm.includes('chattogram') || norm.includes('chittagong') || norm.includes('ctg')) {
    prefix = 'CTG';
  } else if (norm.includes('রাঙ্গামাটি') || norm.includes('rangamati') || norm.includes('rng')) {
    prefix = 'RNG';
  } else if (norm.includes('বান্দরবান') || norm.includes('bandarban') || norm.includes('bnd')) {
    prefix = 'BND';
  } else if (norm.includes('কক্সবাজার') || norm.includes('cox') || norm.includes('cxb')) {
    prefix = 'CXB';
  } else if (norm.includes('সিলেট') || norm.includes('sylhet') || norm.includes('syl')) {
    prefix = 'SYL';
  } else if (norm.includes('রাজশাহী') || norm.includes('rajshahi') || norm.includes('raj')) {
    prefix = 'RAJ';
  } else if (norm.includes('খুলনা') || norm.includes('khulna') || norm.includes('khl')) {
    prefix = 'KHL';
  } else if (norm.includes('বরিশাল') || norm.includes('barishal') || norm.includes('bar')) {
    prefix = 'BAR';
  } else if (norm.includes('ময়মনসিংহ') || norm.includes('mymensingh') || norm.includes('mym')) {
    prefix = 'MYM';
  } else if (norm.includes('রংপুর') || norm.includes('rangpur') || norm.includes('rpr')) {
    prefix = 'RPR';
  } else if (norm.includes('কুমিল্লা') || norm.includes('cumilla') || norm.includes('comilla') || norm.includes('cum')) {
    prefix = 'CUM';
  } else if (norm.includes('গাজীপুর') || norm.includes('gazipur') || norm.includes('gzp')) {
    prefix = 'GZP';
  } else if (norm.includes('নারায়ণগঞ্জ') || norm.includes('narayanganj') || norm.includes('nrg')) {
    prefix = 'NRG';
  } else if (norm.includes('বগুড়া') || norm.includes('bogura') || norm.includes('bogra') || norm.includes('bog')) {
    prefix = 'BOG';
  } else {
    const distMatch = findDistrict(districtName);
    if (distMatch?.district?.code) {
      prefix = distMatch.district.code.toUpperCase();
    } else {
      const clean = districtName.replace(/[^a-zA-Z]/g, '').toUpperCase();
      prefix = clean.length >= 3 ? clean.slice(0, 3) : 'KSA';
    }
  }

  const numPart = typeof sequenceNum === 'number'
    ? String(sequenceNum).padStart(3, '0')
    : String(sequenceNum).replace(/[^0-9]/g, '').padStart(3, '0') || '001';

  return `${prefix}-${numPart}`;
};

