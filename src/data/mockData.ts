import { ServiceModule, OrganicProduct, ServiceProvider, PropertyListing, District } from '../types';

export const SERVICE_MODULES: ServiceModule[] = [
  {
    id: 'organic_ecommerce',
    titleBn: 'ই-কমার্স ও অর্গানিক পসরা',
    titleEn: 'CHT Organic & E-Commerce',
    descBn: 'পাহাড়ি শুটকি, সিদোল, পাহাড়ি মসলা, বিশুদ্ধ মধু ও আগাম আম/কৃষিপণ্য বাগান বুকিং',
    descEn: 'Pahari Dried Fish, Sidol, CHT Spices, Organic Honey & Pre-Harvest Fruit Orchards',
    iconName: 'ShoppingBag',
    badgeBn: 'পাহাড়ি খাঁটি',
    badgeEn: 'Pure Organic',
    color: 'from-amber-600 to-emerald-700',
  },
  {
    id: 'home_healthcare',
    titleBn: 'হোম হেলথকেয়ার ও নার্সিং',
    titleEn: 'Home Healthcare & Nursing',
    descBn: 'ডাক্তার ভিজিট, ইনজেকশন/ড্রেসিং নার্সিং, বয়স্ক কেয়ারটেকার ও হাসপাতাল সহকারী',
    descEn: 'Doctor Home Visits, Injection/Dressing Nursing, Senior Caretakers & Hospital Escort',
    iconName: 'HeartPulse',
    badgeBn: '২৪/৭ সার্ভিস',
    badgeEn: '24/7 Service',
    color: 'from-rose-600 to-red-700',
  },
  {
    id: 'freelance_technician',
    titleBn: 'ফিজিক্যাল টেকনিশিয়ান ও মেকানিক',
    titleEn: 'Technicians & On-Spot Mechanics',
    descBn: 'ইলেকট্রিশিয়ান, প্লাম্বার, রাজমিস্ত্রি, কাঠমিস্ত্রি, সিভিল ও জরুরি বাইক/কার মেকানিক',
    descEn: 'Electricians, Plumbers, Masons, Carpenters & On-Spot Emergency Roadside Bike/Car Repair',
    iconName: 'Wrench',
    badgeBn: 'অন-স্পট',
    badgeEn: 'On-Spot Repair',
    color: 'from-blue-600 to-indigo-700',
  },
  {
    id: 'home_chores',
    titleBn: 'গৃহস্থালি কাজ ও কেয়ার',
    titleEn: 'Home Chores & Assistance',
    descBn: 'হোম টিউটর, বাবুর্চি/রান্নার লোক, ড্রাইভার, বাসা/ট্যাঙ্কি পরিষ্কার ও ফার্নিচার শিফটিং labor',
    descEn: 'Home Tutors, Chefs, Drivers, Water Tank Cleaners, Laundry & House Relocation Laborers',
    iconName: 'Home',
    badgeBn: 'বিশ্বস্ত লোক',
    badgeEn: 'Trusted Labor',
    color: 'from-teal-600 to-emerald-800',
  },
  {
    id: 'hyperlocal_logistics',
    titleBn: 'হাইপারলোকাল লজিস্টিকস',
    titleEn: 'Personal Shopper & Delivery',
    descBn: 'বাজার-সদাই, সুন্দরবন/এসএ পার্সেল এনে দেওয়া ও পাহাড়ি কৃষকের পণ্য সরাসরি পরিবহন',
    descEn: 'Grocery Personal Shopper, Courier Parcel Pickup (Sundarban/SA) & Direct Farm Transport',
    iconName: 'Truck',
    badgeBn: 'দ্রুত ডেলিভারি',
    badgeEn: 'Express Pickup',
    color: 'from-orange-600 to-amber-700',
  },
  {
    id: 'rental_realestate',
    titleBn: 'রেন্টাল ও রিয়েল এস্টেট',
    titleEn: 'Rentals & Property Sale',
    descBn: 'ওয়ার্ড ধরে বাসা ভাড়া, কমার্শিয়াল শপ ও পাহাড়ি জমি/সম্পত্তি কেনাবেচা',
    descEn: 'Ward-wise Apartment Rentals, Commercial Shops, and Hill Land & Property Buying/Selling',
    iconName: 'Building2',
    badgeBn: 'ভেরিফাইড প্রোপার্টি',
    badgeEn: 'Verified Ads',
    color: 'from-purple-600 to-indigo-800',
  },
];

export const MOCK_ORGANIC_PRODUCTS: OrganicProduct[] = [];

export const MOCK_SERVICE_PROVIDERS: ServiceProvider[] = [];

export const MOCK_PROPERTIES: PropertyListing[] = [];

export const DIVISIONS = [
  'Chittagong Division (চট্টগ্রাম)',
  'Dhaka Division (ঢাকা)',
  'Sylhet Division (সিলেট)',
  'Rajshahi Division (রাজশাহী)',
  'Khulna Division (খুলনা)',
  'Barishal Division (বরিশাল)',
  'Rangpur Division (রংপুর)',
  'Mymensingh Division (ময়মনসিংহ)',
];

export const DIVISION_DISTRICTS: Record<string, string[]> = {
  'Chittagong Division (চট্টগ্রাম)': ['Rangamati', 'Khagrachhari', 'Bandarban', 'Chittagong', 'Cox\'s Bazar', 'Comilla', 'Feni'],
  'Dhaka Division (ঢাকা)': ['Dhaka', 'Gazipur', 'Narayanganj', 'Tangail', 'Faridpur', 'Manikganj'],
  'Sylhet Division (সিলেট)': ['Sylhet', 'Moulvibazar', 'Habiganj', 'Sunamganj'],
  'Rajshahi Division (রাজশাহী)': ['Rajshahi', 'Bogra', 'Pabna', 'Naogaon'],
  'Khulna Division (খুলনা)': ['Khulna', 'Jessore', 'Kushtia', 'Satkhira'],
  'Barishal Division (বরিশাল)': ['Barishal', 'Bhola', 'Patuakhali'],
  'Rangpur Division (রংপুর)': ['Rangpur', 'Dinajpur', 'Bogura'],
  'Mymensingh Division (ময়মনসিংহ)': ['Mymensingh', 'Jamalpur', 'Netrokona'],
};

export const DISTRICT_UPAZILAS: Record<string, string[]> = {
  'Rangamati': ['Rangamati Sadar', 'Kaptai', 'Baghaichhari', 'Barkal', 'Kawkhali', 'Langadu', 'Naniarchar', 'Rajasthali', 'Juraichhari', 'Belaichhari'],
  'Khagrachhari': ['Khagrachhari Sadar', 'Dighinala', 'Panchhari', 'Ramgarh', 'Matiranga', 'Manikchhari', 'Mahalchhari', 'Laxmichhari', 'Guimara'],
  'Bandarban': ['Bandarban Sadar', 'Ruma', 'Thanchi', 'Lama', 'Alikadam', 'Rowangchhari', 'Naikhongchhari'],
  'Chittagong': ['Kotwali', 'Panchlaish', 'Hathazari', 'Sitakunda', 'Anwara', 'Patiya', 'Agrabad'],
  'Dhaka': ['Mirpur', 'Dhanmondi', 'Gulshan', 'Uttara', 'Mohammadpur', 'Badda', 'Tejgaon', 'Banani'],
  'Sylhet': ['Kotwali', 'Zindabazar', 'Shahjalal Upazila', 'Beanibazar'],
  'All Bangladesh': ['All Upazilas'],
};

export const UPAZILA_MAHALLAS: Record<string, string[]> = {
  'Rangamati Sadar': ['তবলছড়ি পাড়া', 'বনরূপা', 'দেবাশীষ নগর', 'সংগ্রাম পরিষদ এলাকা', 'কলেজ রোড', 'রিজার্ভ বাজার'],
  'Kaptai': ['কাপ্তাই নতুন বাজার', 'চন্দ্রঘোনা পাড়া', 'রাইখালী বাজার'],
  'Khagrachhari Sadar': ['শাপলা চত্বর', 'নারকেল বাগান', 'পানখাইয়াপাড়া', 'চেঙ্গি স্কয়ার'],
  'Dighinala': ['দীঘিনালা বাজার', 'বোয়ালখালী পাড়া', 'কবাখালী'],
  'Bandarban Sadar': ['কালাঘাটা', 'বালাঘাটা', 'মেম্বারপাড়া', 'হাফেজঘোনা'],
  'Mirpur': ['মিরপুর ১০', 'মিরপুর ১১', 'মিরপুর ১২', 'মিরপুর ২ (স্টেডিয়াম সংলগ্ন)', 'পল্লবী'],
  'Uttara': ['উত্তরা সেক্টর ১', 'উত্তরা সেক্টর ৩', 'উত্তরা সেক্টর ৭', 'উত্তরা সেক্টর ১০', 'উত্তরা ১০ নং রোড'],
  'Kotwali': ['জিইসি মোড়', 'লালখান বাজার', 'চচকবাজার', 'আন্দরকিল্লা'],
  'All Upazilas': ['সকল পাড়া/মহল্লা'],
};

export const MOCK_FEED_POSTS: import('../types').FeedPost[] = [];
