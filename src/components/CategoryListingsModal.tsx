import React, { useState } from 'react';
import { 
  X, Search, MapPin, Star, ShieldCheck, CheckCircle2, Phone, MessageSquare, 
  Wrench, Car, Zap, HeartPulse, Building2, Truck, ShoppingBag, Sparkles, Filter, AlertCircle,
  Shirt, UtensilsCrossed, Tv, Home
} from 'lucide-react';
import { ServiceProvider, OrganicProduct, PropertyListing, Language, District } from '../types';
import { useData } from '../context/DataContext';
import { getProductPublicUrl } from '../utils/directSupabaseStorage';
import { NO_IMAGE_AVAILABLE_ICON } from '../constants/imageConstants';

interface CategoryListingsModalProps {
  isOpen: boolean;
  categoryKey: string;
  categoryTitle: string;
  onClose: () => void;
  onSelectProvider: (provider: ServiceProvider) => void;
  onSelectProduct?: (product: OrganicProduct) => void;
  onSelectProperty?: (property: PropertyListing) => void;
  onBookService?: (provider: ServiceProvider) => void;
  lang: Language;
  district?: District;
  upazila?: string;
}

export const CategoryListingsModal: React.FC<CategoryListingsModalProps> = ({
  isOpen,
  categoryKey,
  categoryTitle,
  onClose,
  onSelectProvider,
  onSelectProduct,
  onSelectProperty,
  onBookService,
  lang,
  district = 'Rangamati',
  upazila = 'Rangamati Sadar',
}) => {
  const { professionals, products } = useData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubFilter, setSelectedSubFilter] = useState<'all' | 'verified' | 'top_rated' | 'available'>('all');

  if (!isOpen) return null;

  const getCategoryIcon = () => {
    switch (categoryKey.toLowerCase()) {
      case 'real_estate':
      case 'property':
      case 'rentals':
        return <Building2 className="w-5 h-5 text-indigo-600" />;
      case 'food':
        return <UtensilsCrossed className="w-5 h-5 text-amber-600" />;
      case 'car':
      case 'vehicle':
        return <Car className="w-5 h-5 text-blue-600" />;
      case 'delivery':
      case 'home_delivery':
        return <Truck className="w-5 h-5 text-cyan-600" />;
      case 'services':
      case 'electrician':
      case 'labor':
        return <Wrench className="w-5 h-5 text-emerald-600" />;
      case 'medical':
      case 'healthcare':
        return <HeartPulse className="w-5 h-5 text-rose-500" />;
      case 'electronics':
        return <Tv className="w-5 h-5 text-teal-600" />;
      case 'clothing':
        return <Shirt className="w-5 h-5 text-pink-600" />;
      default:
        return <Sparkles className="w-5 h-5 text-[#00A86B]" />;
    }
  };

  // Filter providers or products based on category
  const key = categoryKey.toLowerCase();

  // If Real Estate: show properties
  const isRealEstate = key.includes('real_estate') || key.includes('property') || key.includes('rent');
  // If Food: show food & organic products
  const isFood = key.includes('food') || key.includes('organic');
  // If Clothing: show clothing items
  const isClothing = key.includes('clothing') || key.includes('textile');

  const realProviders: ServiceProvider[] = professionals.map((p) => ({
    id: String(p.id),
    name: p.name,
    phone: p.phone,
    realPhone: p.phone,
    categoryBn: p.job,
    categoryEn: p.job,
    subCategory: p.job,
    district: (p.district as any) || 'Khagrachhari',
    upazila: p.upazila || '',
    mahalla: p.area || '',
    rating: p.rating || 0,
    reviewsCount: 0,
    jobsCompleted: p.completedJobs || 0,
    distanceKm: 0,
    hourlyRate: parseInt(String(p.dailyRate || p.rateAmount || '0').replace(/\D/g, '')) || 0,
    isAvailableNow: p.available ?? true,
    nidVerified: Boolean(p.verified),
    blueTickActive: Boolean(p.verified),
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
    bioBn: p.bio || `${p.job} হিসেবে কর্মরত`,
    bioEn: p.bio || `${p.job} specialist`,
    skills: Array.isArray(p.skills) ? p.skills : [],
    bloodGroup: p.bloodGroup as any,
    isBloodDonor: p.isBloodDonor,
    coveredAreas: [p.upazila || '', p.area || ''].filter(Boolean),
  }));

  const filteredProviders = realProviders.filter((p) => {
    const pCat = (p.categoryBn + ' ' + p.categoryEn + ' ' + p.subCategory).toLowerCase();
    let matchesCat = true;

    if (key === 'services' || key === 'all_services') {
      matchesCat = true;
    } else if (key.includes('car') || key.includes('vehicle')) {
      matchesCat = pCat.includes('মেকানিক') || pCat.includes('ড্রাইভার') || pCat.includes('বাইক') || pCat.includes('driver');
    } else if (key.includes('delivery')) {
      matchesCat = pCat.includes('ডেলিভারি') || pCat.includes('রাইডার') || pCat.includes('কুরিয়ার');
    } else if (key.includes('medical')) {
      matchesCat = pCat.includes('ডাক্তার') || pCat.includes('নার্স') || pCat.includes('কেয়ারটেকার');
    } else if (key.includes('electrician')) {
      matchesCat = pCat.includes('ইলেকট্রিক') || pCat.includes('electrician') || pCat.includes('সোলার');
    } else if (key.includes('labor')) {
      matchesCat = pCat.includes('লেবার') || pCat.includes('মিস্ত্রি') || pCat.includes('কামলা');
    } else if (key.includes('electronics')) {
      matchesCat = pCat.includes('ইলেকট্রিক') || pCat.includes('সার্ভিস') || pCat.includes('মেকানিক');
    }

    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || p.name.toLowerCase().includes(q) || pCat.includes(q) || p.bioBn.includes(q);

    let matchesSub = true;
    if (selectedSubFilter === 'verified') matchesSub = p.nidVerified || p.blueTickActive;
    if (selectedSubFilter === 'top_rated') matchesSub = p.rating >= 4.9;
    if (selectedSubFilter === 'available') matchesSub = p.isAvailableNow;

    return matchesCat && matchesSearch && matchesSub;
  });

  const filteredProperties: PropertyListing[] = [];

  const filteredFoodProducts = products.filter((prod) => {
    const q = searchQuery.toLowerCase();
    return !q || prod.nameBn.toLowerCase().includes(q) || prod.descriptionBn.toLowerCase().includes(q);
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-2.5 sm:p-4 overflow-y-auto">
      <div className="bg-slate-50 border border-slate-200 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl text-slate-800 my-auto flex flex-col max-h-[92vh] animate-in zoom-in-95">
        
        {/* Modal Header Bar */}
        <div className="bg-slate-900 text-white px-4 py-3.5 border-b border-slate-800 flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-slate-800 rounded-xl border border-slate-700">
              {getCategoryIcon()}
            </div>
            <div>
              <h3 className="font-extrabold text-xs sm:text-sm text-white">
                {categoryTitle}
              </h3>
              <p className="text-[10px] text-slate-400">📍 {district} ➔ {upazila} এরিয়া লিস্টিং</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Search Bar */}
        <div className="p-3 bg-white border-b border-slate-200/90 space-y-2 shrink-0">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
            <input
              type="text"
              placeholder={`${categoryTitle} সার্চ করুন...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#00A86B]"
            />
          </div>

          {/* Sub Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-[10px] no-scrollbar">
            {[
              { id: 'all', label: 'সব লিস্টিং' },
              { id: 'verified', label: '✓ ভেরিফাইড [✓]' },
              { id: 'top_rated', label: '⭐ টপ রেটেড' },
              { id: 'available', label: '🟢 দ্রুত ডেলিভারি / রেডি' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedSubFilter(f.id as any)}
                className={`px-2.5 py-1 rounded-lg font-bold transition-all whitespace-nowrap cursor-pointer ${
                  selectedSubFilter === f.id
                    ? 'bg-[#00A86B] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Items Content */}
        <div className="p-3.5 space-y-3 overflow-y-auto flex-1 bg-[#F8FAFC]">
          
          {/* 1. Real Estate Properties List */}
          {isRealEstate && (
            <div className="space-y-3">
              {filteredProperties.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold text-slate-700 mb-1">
                    এই ক্যাটাগরিতে এখনও কোনো প্রপার্টি লিস্টিং নেই
                  </p>
                  <p className="text-[10px] text-slate-500">
                    নতুন ফ্ল্যাট বা বাসা ভাড়ার লিস্টিং পরবর্তীতে যুক্ত করা হবে।
                  </p>
                </div>
              ) : (
                filteredProperties.map((prop) => (
                  <div
                    key={prop.id}
                    onClick={() => {
                      if (onSelectProperty) onSelectProperty(prop);
                    }}
                    className="bg-white border border-slate-200 rounded-2xl p-3 shadow-xs hover:border-[#00A86B] cursor-pointer flex gap-3 transition-all"
                  >
                    <img src={prop.images[0]} alt={prop.titleBn} className="w-20 h-20 rounded-xl object-cover shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded">
                          {prop.type === 'Rent' ? 'ভাড়া' : 'বিক্রয়'}
                        </span>
                        <span className="text-xs font-black text-[#00A86B]">৳{prop.price.toLocaleString()}</span>
                      </div>
                      <h4 className="font-extrabold text-xs text-slate-800 truncate mt-1">{prop.titleBn}</h4>
                      <p className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-[#00A86B]" />
                        <span>{prop.area}, {prop.upazila}</span>
                      </p>
                      <p className="text-[9px] text-slate-400 mt-1 line-clamp-1">{prop.descriptionBn}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* 2. Food & Organic Products List */}
          {(isFood || isClothing) && (
            filteredFoodProducts.length === 0 ? (
              <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 p-4">
                <p className="text-xs font-bold text-slate-700 mb-1">
                  কোনো পণ্য পাওয়া যায়নি
                </p>
                <p className="text-[10px] text-slate-500">
                  অন্য কোনো কীওয়ার্ড দিয়ে সার্চ করার চেষ্টা করুন।
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {filteredFoodProducts.map((prod) => (
                  <div
                    key={prod.id}
                    onClick={() => {
                      if (onSelectProduct) onSelectProduct(prod as unknown as OrganicProduct);
                    }}
                    className="bg-white border border-slate-200 rounded-2xl p-2.5 shadow-xs hover:border-[#00A86B] cursor-pointer flex flex-col justify-between transition-all"
                  >
                    <img 
                      src={getProductPublicUrl(prod.image)} 
                      alt={prod.nameBn} 
                      className="w-full h-24 rounded-xl object-cover mb-2"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.onerror = null;
                        target.src = NO_IMAGE_AVAILABLE_ICON;
                      }}
                    />
                    <div>
                      <h4 className="font-extrabold text-xs text-slate-800 line-clamp-1">{prod.nameBn}</h4>
                      <p className="text-[10px] text-slate-500 font-semibold">{prod.origin}</p>
                      <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                        <span className="text-xs font-black text-[#00A86B]">৳{prod.price}</span>
                        <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.5 rounded">অর্ডার</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {/* 3. Professional Service Providers */}
          {!isRealEstate && !isFood && !isClothing && (
            <div className="space-y-3">
              {filteredProviders.length === 0 ? (
                <div className="text-center py-10 bg-white rounded-2xl border border-slate-200 p-4">
                  <p className="text-xs font-bold text-slate-700 mb-1">
                    এই ক্যাটাগরিতে সরাসরি মেচ হওয়া প্রোভাইডার পাওয়া যায়নি
                  </p>
                  <p className="text-[10px] text-slate-500">
                    আমাদের সাপোর্ট নাম্বারে বা পোস্ট ফিডে রিকুয়েস্ট দিতে পারেন।
                  </p>
                </div>
              ) : (
                filteredProviders.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => {
                      onSelectProvider(p);
                    }}
                    className="bg-white border border-slate-200/90 rounded-2xl p-3.5 shadow-xs hover:border-[#00A86B] cursor-pointer flex flex-col gap-2 transition-all group"
                  >
                    <div className="flex items-start gap-3">
                      <div className="relative shrink-0">
                        <img src={p.avatar} alt={p.name} className="w-13 h-13 rounded-2xl object-cover border border-slate-200 shadow-2xs group-hover:scale-105 transition-transform" />
                        {p.nidVerified && (
                          <span className="absolute -bottom-1 -right-1 bg-[#00A86B] text-white p-0.5 rounded-full" title="NID Verified">
                            <CheckCircle2 className="w-3.5 h-3.5 fill-[#00A86B] text-white" />
                          </span>
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-black text-xs text-slate-900 truncate">{p.name}</h4>
                          <span className="text-xs font-black text-[#00A86B] bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                            ৳{p.hourlyRate}/ঘণ্টা
                          </span>
                        </div>
                        <p className="text-[10.5px] font-bold text-slate-700">{p.categoryBn}</p>
                        
                        <div className="flex items-center gap-2 mt-0.5 text-[9.5px] text-slate-500 flex-wrap">
                          <span className="flex items-center gap-0.5 text-amber-500 font-extrabold">
                            <Star className="w-3 h-3 fill-amber-400" />
                            {p.rating}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-0.5 text-slate-600 font-medium">
                            <MapPin className="w-3 h-3 text-[#00A86B]" />
                            {p.mahalla ? `${p.mahalla}, ` : ''}{p.upazila}
                          </span>
                          {p.coverageRadiusKm && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-700 font-bold">কাভারেজ {p.coverageRadiusKm} কিমি</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Serviceable Coverage Areas Pills */}
                    {p.coveredAreas && p.coveredAreas.length > 0 && (
                      <div className="flex flex-wrap gap-1 bg-[#F8FAFC] p-1.5 rounded-xl border border-slate-100">
                        <span className="text-[8.5px] text-slate-400 font-bold mr-1">কাভারেজ:</span>
                        {p.coveredAreas.slice(0, 4).map((area, aIdx) => (
                          <span key={aIdx} className="text-[8.5px] font-semibold bg-white text-slate-700 px-1.5 py-0.2 rounded border border-slate-200">
                            📍 {area}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Escrow & Google Map Action row */}
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-[9.5px]">
                      <span className="text-emerald-800 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-lg border border-emerald-200">
                        <ShieldCheck className="w-3 h-3 text-[#00A86B]" />
                        <span>১০% এসক্রো সুরক্ষিত পেআউট</span>
                      </span>
                      <span className="text-[#00A86B] font-extrabold flex items-center gap-0.5 group-hover:translate-x-0.5 transition-transform">
                        <span>প্রোফাইল ও বুকিং ➔</span>
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
