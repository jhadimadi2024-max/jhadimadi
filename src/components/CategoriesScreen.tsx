import React from 'react';
import { 
  ShoppingBag, 
  Wrench, 
  Utensils, 
  Sparkles, 
  HeartPulse, 
  Shirt, 
  Home, 
  Truck, 
  Building2, 
  BookOpen, 
  Camera, 
  Music, 
  TreePine, 
  Axe, 
  Zap, 
  Scissors, 
  Palette, 
  Layers,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { Language } from '../types';
import { useData } from '../context/DataContext';

interface CategoriesScreenProps {
  onSelectCategory: (catId: string, type: 'product' | 'service') => void;
  lang: Language;
  onPostClick?: () => void;
}

export const CategoriesScreen: React.FC<CategoriesScreenProps> = ({
  onSelectCategory,
  lang,
  onPostClick,
}) => {
  const { products, professionals } = useData();

  const getProductCountText = (catId: string) => {
    const matched = products.filter(p => {
      const pCat = (p.category || '').toLowerCase();
      if (catId === 'Food') return pCat.includes('food') || pCat.includes('খাবার') || pCat.includes('মধু') || pCat.includes('শুটকি');
      if (catId === 'Handloom') return pCat.includes('handloom') || pCat.includes('তাঁত') || pCat.includes('কাপড়');
      if (catId === 'Fruits') return pCat.includes('fruit') || pCat.includes('ফল');
      if (catId === 'Crafts') return pCat.includes('craft') || pCat.includes('হস্তশিল্প');
      if (catId === 'Electronics') return pCat.includes('electronic') || pCat.includes('ইলেকট্রনিক্স');
      if (catId === 'RealEstate') return pCat.includes('property') || pCat.includes('ভাড়া') || pCat.includes('ফ্ল্যাট');
      return pCat.includes(catId.toLowerCase());
    }).length;
    return `${matched} টি পণ্য`;
  };

  const getServiceCountText = (srvId: string) => {
    const matched = professionals.filter(p => {
      const job = (p.job || '').toLowerCase();
      const skills = (Array.isArray(p.skills) ? p.skills.join(' ') : (p.skills || '')).toLowerCase();
      return job.includes(srvId.toLowerCase()) || skills.includes(srvId.toLowerCase());
    }).length;
    return matched > 0 ? `${matched} জন রেজিস্টার্ড` : '০ জন রেজিস্টার্ড';
  };

  // 1. Indigenous Product Categories
  const PRODUCT_CATEGORIES = [
    {
      id: 'Food',
      nameBn: 'পাহাড়ি খাবার, শুটকি ও মধু',
      nameEn: 'Hill Foods, Sidol & Honey',
      descBn: 'বোম্বাই শুটকি, খাঁটি সিদোল, চাকের মধু ও ঐতিহ্যবাহী মসলা',
      icon: Utensils,
      count: getProductCountText('Food'),
      bgGradient: 'from-amber-500/10 to-emerald-600/10',
      borderColor: 'border-amber-200',
      iconBg: 'bg-amber-100 text-amber-800',
    },
    {
      id: 'Handloom',
      nameBn: 'ঐতিহ্যবাহী তাঁত ও পিনন-হাদি',
      nameEn: 'Tribal Handloom & Pinon-Hadi',
      descBn: 'চাকমা, মারমা ও ত্রিপুরা নিজস্ব হস্তচালিত তাঁতের পোশাক',
      icon: Shirt,
      count: getProductCountText('Handloom'),
      bgGradient: 'from-rose-500/10 to-orange-600/10',
      borderColor: 'border-rose-200',
      iconBg: 'bg-rose-100 text-rose-800',
    },
    {
      id: 'Fruits',
      nameBn: 'তাজা পাহাড়ি ফল ও বাগান লিজ',
      nameEn: 'Fresh Hill Fruits & Orchards',
      descBn: 'খাগড়াছড়ির আম্রপালি, ড্রাগন, রেডলেডি পেঁপে ও আনারস',
      icon: TreePine,
      count: getProductCountText('Fruits'),
      bgGradient: 'from-emerald-500/10 to-teal-600/10',
      borderColor: 'border-emerald-200',
      iconBg: 'bg-emerald-100 text-[#1E4D2B]',
    },
    {
      id: 'Crafts',
      nameBn: 'বাঁশ ও বেতের পাহাড়ি হস্তশিল্প',
      nameEn: 'Bamboo & Cane Hill Crafts',
      descBn: 'বাঁশের বোতল, ফুলদানি, জুড়ি ও আদিবাসী হোম ডেকর',
      icon: Sparkles,
      count: getProductCountText('Crafts'),
      bgGradient: 'from-amber-600/10 to-yellow-600/10',
      borderColor: 'border-amber-300',
      iconBg: 'bg-amber-200 text-amber-900',
    },
    {
      id: 'Electronics',
      nameBn: 'ইলেকট্রনিক্স ও মোবাইল পণ্য',
      nameEn: 'Electronics & Mobiles',
      descBn: 'মোবাইল এক্সেসরিজ, সোলার ব্যাটারি ও হোম গ্যাজেটস',
      icon: Zap,
      count: getProductCountText('Electronics'),
      bgGradient: 'from-blue-500/10 to-indigo-600/10',
      borderColor: 'border-blue-200',
      iconBg: 'bg-blue-100 text-blue-800',
    },
    {
      id: 'RealEstate',
      nameBn: 'বাসা ভাড়া ও পাহাড়ি প্রপার্টি',
      nameEn: 'House Rentals & Property',
      descBn: 'খাগড়াছড়ি ও রাঙামাটিতে পরিবার ও ব্যাচেলর ফ্ল্যাট',
      icon: Building2,
      count: getProductCountText('RealEstate'),
      bgGradient: 'from-purple-500/10 to-slate-600/10',
      borderColor: 'border-purple-200',
      iconBg: 'bg-purple-100 text-purple-800',
    },
  ];

  // 2. Local On-Demand Service Categories
  const SERVICE_CATEGORIES = [
    {
      id: 'electrician',
      nameBn: 'ইলেকট্রিশিয়ান ও সোলার মেকানিক',
      nameEn: 'Electrician & Solar Mechanic',
      descBn: 'বাসা ওয়্যারিং, ফ্যান মেরামত ও পাহাড়ি সোলার প্যানেল সেটআপ',
      icon: Zap,
      rate: '৳৩৫০ থেকে',
      registeredCount: getServiceCountText('electrician'),
      iconBg: 'bg-amber-500 text-white',
    },
    {
      id: 'tree_cutter',
      nameBn: 'গাছ কাটার মিস্ত্রি ও টিম্বার লেবার',
      nameEn: 'Tree Cutter & Timber Labour',
      descBn: 'পাহাড় ও বাগানের গাছ কাটা, ছাঁটাই ও কাঠ চেরাই কাজ',
      icon: Axe,
      rate: '৳৮০০ / দিন',
      registeredCount: getServiceCountText('tree_cutter'),
      iconBg: 'bg-[#1E4D2B] text-white',
    },
    {
      id: 'mason',
      nameBn: 'রাজমিস্ত্রি ও নির্মাণ শ্রমিক',
      nameEn: 'Masons & Construction Workers',
      descBn: 'পাহাড়ি রিটেইনিং ওয়াল, বিল্ডিং ঢালাই ও প্লাস্টার কাজ',
      icon: Wrench,
      rate: '৳১,০০০ / দিন',
      registeredCount: getServiceCountText('mason'),
      iconBg: 'bg-stone-700 text-white',
    },
    {
      id: 'healthcare',
      nameBn: 'ডাক্তার, নার্স ও হোম মেডিকেল',
      nameEn: 'Doctors, Nurses & Home Care',
      descBn: 'এমবিবিএস ডাক্তার পরামর্শ, ইনজেকশন/ড্রেসিং ও বয়স্ক কেয়ার',
      icon: HeartPulse,
      rate: '৳৫০০ থেকে',
      registeredCount: getServiceCountText('healthcare'),
      iconBg: 'bg-rose-600 text-white',
    },
    {
      id: 'tutor',
      nameBn: 'হোম টিউটর ও শিক্ষক',
      nameEn: 'Home Tutors & Academic Teachers',
      descBn: 'স্কুল-কলেজ শিক্ষার্থীদের গণিত, বিজ্ঞান ও ইংরেজি প্রাইভেট',
      icon: BookOpen,
      rate: '৳৩,০০০ / মাস',
      registeredCount: getServiceCountText('tutor'),
      iconBg: 'bg-blue-600 text-white',
    },
    {
      id: 'sound_photo',
      nameBn: 'সাউন্ড সিস্টেম ও ফটোগ্রাফার',
      nameEn: 'Sound System & Event Photographer',
      descBn: 'বিয়ে, বিজু উৎসব ও সামাজিক অনুষ্ঠানের সাউন্ড ও ক্যামেরা',
      icon: Music,
      rate: '৳২,৫০০ থেকে',
      registeredCount: getServiceCountText('sound_photo'),
      iconBg: 'bg-purple-600 text-white',
    },
    {
      id: 'transport',
      nameBn: 'চাঁদের গাড়ি, সিএনজি ও পিকআপ',
      nameEn: 'Chander Gari, CNG & Cargo Ride',
      descBn: 'সাজেক ট্যুরিজম জিপ, লোকাল সিএনজি ও পার্সেল পরিবহন',
      icon: Truck,
      rate: '৳২০০ থেকে',
      registeredCount: getServiceCountText('transport'),
      iconBg: 'bg-cyan-600 text-white',
    },
    {
      id: 'cleaner',
      nameBn: 'পরিচ্ছন্নতাকর্মী ও ট্যাংক ওয়াশ',
      nameEn: 'Cleaners & Water Tank Washers',
      descBn: 'বাসা-অফিস ডিপ ক্লিনিং, পানির রিজার্ভার পরিষ্কার',
      icon: Scissors,
      rate: '৳৬০০ থেকে',
      registeredCount: getServiceCountText('cleaner'),
      iconBg: 'bg-teal-600 text-white',
    },
  ];

  return (
    <div className="space-y-6 pb-8 animate-in fade-in duration-300">
      
      {/* Top Banner / Breadcrumb Header */}
      <div className="bg-gradient-to-r from-[#1E4D2B] via-[#2A653B] to-[#1E4D2B] text-white p-5 rounded-3xl shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pointer-events-none pr-4">
          <Layers className="w-48 h-48" />
        </div>
        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-[#D97706]/30 text-amber-200 rounded-full text-xs font-bold mb-2 border border-amber-400/30">
            <Sparkles className="w-3.5 h-3.5" />
            <span>পার্বত্য চট্টগ্রাম সুপার ক্যাটালগ</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black tracking-tight">
            ক্যাটাগরি সমূহ (Product & Service Categories)
          </h2>
          <p className="text-xs sm:text-sm text-emerald-100 mt-1">
            পাহাড়ের খাঁটি উৎপাদিত অর্গানিক খাদ্যপণ্য, ঐতিহ্যবাহী পোশাক এবং অন-ডিমান্ড ভেরিফায়েড স্থানীয় কারিগর বেছে নিন।
          </p>
        </div>
      </div>

      {/* SECTION 1: Indigenous Products Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#1E4D2B] flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-[#D97706]" />
              <span>১. পাহাড়ি অর্গানিক পণ্য ক্যাটাগরি</span>
            </h3>
            <p className="text-xs text-stone-600 font-medium">খাগড়াছড়ি ও রাঙামাটি পার্বত্য অঞ্চলের খাঁটি উৎপাদিত সম্ভার</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {PRODUCT_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <div
                key={cat.id}
                onClick={() => onSelectCategory(cat.id, 'product')}
                className={`group p-4 rounded-2xl border ${cat.borderColor} bg-white hover:border-[#1E4D2B] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-2xl ${cat.iconBg} group-hover:scale-110 transition-transform shadow-xs`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-sm text-stone-900 group-hover:text-[#1E4D2B] transition-colors">
                        {cat.nameBn}
                      </h4>
                      <p className="text-[11px] text-stone-500 font-medium">{cat.nameEn}</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-stone-100 text-stone-700 rounded-md shrink-0">
                    {cat.count}
                  </span>
                </div>

                <div className="mt-3 pt-2.5 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-600 line-clamp-1 text-[11.5px]">{cat.descBn}</span>
                  <span className="text-[#1E4D2B] font-bold flex items-center gap-0.5 group-hover:translate-x-1 transition-transform shrink-0">
                    পণ্য দেখুন →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 2: Local On-Demand Services & Freelancers */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#8B4513] flex items-center gap-2">
              <Wrench className="w-5 h-5 text-[#8B4513]" />
              <span>২. লোকাল পেশাজীবী ও কারিগর ডিরেক্টরি</span>
            </h3>
            <p className="text-xs text-stone-600 font-medium">ডাক্তার, ইলেকট্রিশিয়ান, গাছ কাটার শ্রমিক, সাউন্ড সিস্টেম ও মিস্ত্রি</p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {SERVICE_CATEGORIES.map((srv) => {
            const Icon = srv.icon;
            return (
              <div
                key={srv.id}
                onClick={() => onSelectCategory(srv.id, 'service')}
                className="group p-4 rounded-2xl border border-stone-200/80 bg-white hover:border-[#8B4513] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2.5 rounded-xl ${srv.iconBg} shadow-xs group-hover:scale-105 transition-transform`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-extrabold text-sm text-stone-900 group-hover:text-[#8B4513] truncate">
                      {srv.nameBn}
                    </h4>
                    <p className="text-[10px] text-stone-500 truncate">{srv.nameEn}</p>
                  </div>
                </div>

                <p className="text-[11px] text-stone-600 mt-2.5 line-clamp-2 leading-relaxed">
                  {srv.descBn}
                </p>

                <div className="mt-3 pt-2 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-stone-100 text-stone-700 rounded-md">{srv.registeredCount}</span>
                  <span className="text-[#8B4513] font-bold group-hover:translate-x-1 transition-transform">
                    খুঁজুন →
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Box to Post Listing */}
      <div className="bg-[#FAF6F0] border-2 border-dashed border-[#1E4D2B]/40 rounded-3xl p-5 sm:p-6 text-center space-y-3 shadow-xs">
        <div className="w-12 h-12 rounded-2xl bg-[#1E4D2B] text-white flex items-center justify-center mx-auto shadow-md">
          <Sparkles className="w-6 h-6 text-[#D97706]" />
        </div>
        <div className="max-w-md mx-auto">
          <h4 className="font-black text-base sm:text-lg text-stone-900">
            আপনি কি কোনো পাহাড়ি পণ্য বিক্রি বা সেবা দিতে চান?
          </h4>
          <p className="text-xs sm:text-sm text-stone-600 mt-1">
            খাগড়াছড়ি ও রাঙামাটির হাজারো গ্রাহকের কাছে আপনার অর্গানিক ফসল, হস্তশিল্প বা পেশাদার দক্ষতা পৌঁছে দিন।
          </p>
        </div>
        {onPostClick && (
          <button
            onClick={onPostClick}
            className="px-6 py-2.5 bg-[#1E4D2B] hover:bg-[#15371e] text-white font-black text-xs sm:text-sm rounded-xl shadow-md hover:shadow-lg transition-all inline-flex items-center gap-2 cursor-pointer active:scale-95"
          >
            <span>নতুন পোস্ট প্রকাশ করুন</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        )}
      </div>

    </div>
  );
};
