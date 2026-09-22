import React, { useState, useMemo, useRef } from 'react';
import { 
  Search, 
  MapPin, 
  Store, 
  Briefcase, 
  Filter, 
  ShieldCheck, 
  Star, 
  ArrowLeft, 
  ShoppingBag, 
  X, 
  SlidersHorizontal, 
  CheckCircle2, 
  DollarSign, 
  Phone,
  Layers,
  ChevronDown,
  Volume2,
  Camera
} from 'lucide-react';
import { BANGLADESH_GEO_DIRECTORY, ALL_PROFESSIONS_FLAT_LIST } from '../data/professionsMasterData';
import { INITIAL_VENDOR_STORES, VendorStore, VendorStoreProduct } from '../data/vendorsData';
import { StoreProduct } from '../data/productsData';
import { ServiceProvider } from '../types';
import { RegisteredProfessional } from './ProfessionalRegistrationWizard';
import { Language } from '../utils/translations';
import { maskPhoneNumber } from '../utils/uniqueIdGenerator';
import { startBanglaVoiceRecognition, ParsedSearchResult } from '../utils/aiSearchParser';
import { getProductPublicUrl } from '../utils/directSupabaseStorage';
import { NO_IMAGE_AVAILABLE_ICON } from '../constants/imageConstants';

interface EmbeddedSearchMatrixPageProps {
  onBack?: () => void;
  products?: StoreProduct[];
  vendors?: VendorStore[];
  professionals?: (ServiceProvider | RegisteredProfessional)[];
  onSelectProduct?: (product: StoreProduct) => void;
  onSelectProfessional?: (pro: ServiceProvider | RegisteredProfessional) => void;
  onVisitStore?: (storeId: string) => void;
  onAddToCart?: (product: StoreProduct, qty: number) => void;
  onBookService?: (pro: ServiceProvider | RegisteredProfessional) => void;
  initialQuery?: string;
  lang: Language;
}

export const EmbeddedSearchMatrixPage: React.FC<EmbeddedSearchMatrixPageProps> = ({
  onBack,
  products = [],
  vendors = INITIAL_VENDOR_STORES,
  professionals = [],
  onSelectProduct,
  onSelectProfessional,
  onVisitStore,
  onAddToCart,
  onBookService,
  initialQuery = '',
  lang
}) => {
  const allProducts = products;
  const allVendors = vendors;
  const allProfessionals = professionals;

  const [searchMode, setSearchMode] = useState<'products' | 'services'>('products');
  const [query, setQuery] = useState(initialQuery);
  const [isListening, setIsListening] = useState(false);
  const matrixImageInputRef = useRef<HTMLInputElement>(null);

  const handleVoiceSearch = () => {
    startBanglaVoiceRecognition({
      onStart: () => setIsListening(true),
      onResult: (_transcript, parsed: ParsedSearchResult) => {
        setIsListening(false);
        setQuery(parsed.cleanedKeyword);
        if (parsed.searchType === 'product') {
          setSearchMode('products');
        } else if (parsed.searchType === 'service') {
          setSearchMode('services');
        }
        if (parsed.district && BANGLADESH_GEO_DIRECTORY[parsed.district]) {
          setSelectedDistrict(parsed.district);
        }
      },
      onError: () => setIsListening(false),
      onEnd: () => setIsListening(false)
    });
  };

  const handleImageUploaded = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const rawName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim();
    let term = rawName;
    const lower = rawName.toLowerCase();
    if (lower.includes('honey') || lower.includes('মধু')) term = 'মধু';
    else if (lower.includes('rice') || lower.includes('চাল') || lower.includes('জুম')) term = 'চাল';
    else if (lower.includes('halud') || lower.includes('হলুদ')) term = 'হলুদ';
    else if (lower.includes('cloth') || lower.includes('পিনন')) term = 'পিনন';
    setQuery(term);
  };

  const [selectedDistrict, setSelectedDistrict] = useState<string>('সব জেলা');
  const [selectedUpazila, setSelectedUpazila] = useState<string>('সব উপজেলা');
  const [selectedMahalla, setSelectedMahalla] = useState<string>('সব এলাকা');
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Available Cascading Dropdowns
  const upazilaOptions = useMemo(() => {
    if (selectedDistrict === 'সব জেলা' || !BANGLADESH_GEO_DIRECTORY[selectedDistrict]) {
      return ['সব উপজেলা'];
    }
    return ['সব উপজেলা', ...BANGLADESH_GEO_DIRECTORY[selectedDistrict].thanas];
  }, [selectedDistrict]);

  const mahallaOptions = useMemo(() => {
    return ['সব এলাকা', 'সদর বাজার', 'কলেজ রোড', 'মেইন রোড', 'শান্তিনগর', 'আবাসিক এলাকা', 'স্টেশন রোড', 'মধুপুর বাজার'];
  }, []);

  // Filter Products
  const filteredProducts = useMemo(() => {
    return allProducts.filter((p) => {
      // 1. Text Query
      const matchesQuery = !query.trim() || 
        p.nameBn.toLowerCase().includes(query.toLowerCase()) ||
        p.nameEn.toLowerCase().includes(query.toLowerCase()) ||
        p.sellerName.toLowerCase().includes(query.toLowerCase()) ||
        p.origin.toLowerCase().includes(query.toLowerCase());

      // 2. District filter
      const matchesDistrict = selectedDistrict === 'সব জেলা' || p.origin.includes(selectedDistrict);

      // 3. Category filter
      const matchesCat = selectedCategory === 'all' || p.category === selectedCategory;

      // 4. Verified seller
      const matchesVerified = !verifiedOnly || p.verifiedSeller;

      return matchesQuery && matchesDistrict && matchesCat && matchesVerified;
    });
  }, [allProducts, query, selectedDistrict, selectedCategory, verifiedOnly]);

  // Filter Services & Professionals
  const filteredServices = useMemo(() => {
    return allProfessionals.filter((pro: any) => {
      const proName = pro.name || '';
      const proJob = pro.job || pro.professionalHeadline || '';
      const proSkills = pro.skills || pro.selectedSkillsList?.join(' ') || '';
      const proDist = pro.district || '';
      const proUpazila = pro.upazila || '';
      const proArea = pro.area || pro.fullAddress || '';

      // 1. Text Query
      const matchesQuery = !query.trim() || 
        proName.toLowerCase().includes(query.toLowerCase()) ||
        proJob.toLowerCase().includes(query.toLowerCase()) ||
        proSkills.toLowerCase().includes(query.toLowerCase());

      // 2. District filter
      const matchesDistrict = selectedDistrict === 'সব জেলা' || proDist === selectedDistrict;

      // 3. Upazila filter
      const matchesUpazila = selectedUpazila === 'সব উপজেলা' || proUpazila === selectedUpazila;

      // 4. Verified only
      const matchesVerified = !verifiedOnly || pro.verified || pro.isNidVerified;

      return matchesQuery && matchesDistrict && matchesUpazila && matchesVerified;
    });
  }, [allProfessionals, query, selectedDistrict, selectedUpazila, verifiedOnly]);

  return (
    <div className="bg-slate-50 min-h-full rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between shadow-xs relative pb-10 animate-fadeIn">
      
      {/* 1. Top Header */}
      <div className="bg-white sticky top-0 z-20 px-3.5 py-2.5 border-b border-slate-200 flex items-center justify-between shadow-xs">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-[#2EAA26]" />
          <span>{lang === 'bn' ? 'হোমে ফিরুন' : 'Back'}</span>
        </button>

        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-[#2EAA26] text-white font-black text-xs flex items-center justify-center">
            <Search className="w-3 h-3" />
          </div>
          <span className="font-extrabold text-xs text-slate-900">
            {lang === 'bn' ? 'হাইপার-লোকাল সার্চ ম্যাট্রিক্স' : 'Hyper-Local Search Matrix'}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            setQuery('');
            setSelectedDistrict('সব জেলা');
            setSelectedUpazila('সব উপজেলা');
            setVerifiedOnly(false);
          }}
          className="text-[9px] font-bold text-slate-500 hover:text-slate-800"
        >
          রিসেট
        </button>
      </div>

      <div className="p-3.5 space-y-3">
        
        {/* Toggle Mode: [পণ্য (Products)] vs [সেবা (Services)] */}
        <div className="bg-slate-200 p-1 rounded-2xl flex gap-1 shadow-inner">
          <button
            type="button"
            onClick={() => setSearchMode('products')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              searchMode === 'products'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Store className="w-4 h-4 text-amber-600" />
            <span>১. পণ্য অনুসন্ধান (Products)</span>
            <span className="text-[9px] bg-amber-100 text-amber-900 px-1.5 py-0.2 rounded-md">
              {filteredProducts.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setSearchMode('services')}
            className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 cursor-pointer ${
              searchMode === 'services'
                ? 'bg-white text-slate-900 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Briefcase className="w-4 h-4 text-[#2EAA26]" />
            <span>২. পেশাদার ও সেবা (Services)</span>
            <span className="text-[9px] bg-emerald-100 text-emerald-900 px-1.5 py-0.2 rounded-md">
              {filteredServices.length}
            </span>
          </button>
        </div>

        {/* Search Input Bar */}
        <div className="relative">
          <input 
            type="file" 
            accept="image/*" 
            ref={matrixImageInputRef} 
            onChange={handleImageUploaded} 
            className="hidden" 
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              searchMode === 'products'
                ? (lang === 'bn' ? 'পাহাড়ি চাল, হলুদ, শুঁটকি, মধু বা বিক্রেতার নাম...' : 'Search products or vendors...')
                : (lang === 'bn' ? 'ইলেকট্রিশিয়ান, ড্রাইভার, রাজমিস্ত্রি বা কারিগর...' : 'Search services or professions...')
            }
            className="w-full pl-10 pr-20 py-2.5 bg-white border border-slate-300 rounded-2xl text-xs text-slate-900 shadow-xs focus:ring-2 focus:ring-[#2EAA26] focus:outline-hidden"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-16 top-3 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Camera Image Search */}
          <button
            type="button"
            onClick={() => matrixImageInputRef.current?.click()}
            className="absolute right-9 top-2 p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-emerald-700 transition cursor-pointer"
            title="ছবি দিয়ে খুঁজুন"
          >
            <Camera className="w-3.5 h-3.5" />
          </button>

          {/* Speaker Voice Search */}
          <button
            type="button"
            onClick={handleVoiceSearch}
            className={`absolute right-2 top-2 p-1.5 rounded-lg transition cursor-pointer ${
              isListening ? 'bg-red-600 text-white animate-bounce' : 'bg-emerald-50 text-[#2EAA26] hover:bg-emerald-100'
            }`}
            title="ভয়েস সার্চ (মুখে বলুন)"
          >
            <Volume2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Hyper-Local Cascading Filters (District ➔ Upazila ➔ Mahalla) */}
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
          <div className="flex items-center justify-between text-[10px] font-black text-slate-800">
            <span className="flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-[#2EAA26]" />
              <span>মাইক্রো-লোকেশন ফিল্টার (জেলা ➔ উপজেলা ➔ পাড়া)</span>
            </span>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(e) => setVerifiedOnly(e.target.checked)}
                className="accent-[#2EAA26] rounded-sm"
              />
              <span className="text-[9px] text-[#2EAA26] font-bold">শুধুমাত্র ভেরিফাইড</span>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {/* District */}
            <div>
              <label className="block text-[8.5px] font-bold text-slate-500 mb-0.5">জেলা (District)</label>
              <select
                value={selectedDistrict}
                onChange={(e) => {
                  setSelectedDistrict(e.target.value);
                  setSelectedUpazila('সব উপজেলা');
                  setSelectedMahalla('সব এলাকা');
                }}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-800"
              >
                <option value="সব জেলা">সব জেলা</option>
                {Object.keys(BANGLADESH_GEO_DIRECTORY).map((dist) => (
                  <option key={dist} value={dist}>{dist}</option>
                ))}
              </select>
            </div>

            {/* Upazila */}
            <div>
              <label className="block text-[8.5px] font-bold text-slate-500 mb-0.5">উপজেলা / থানা (Upazila)</label>
              <select
                value={selectedUpazila}
                onChange={(e) => setSelectedUpazila(e.target.value)}
                disabled={selectedDistrict === 'সব জেলা'}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-800 disabled:opacity-50"
              >
                {upazilaOptions.map((up) => (
                  <option key={up} value={up}>{up}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* RESULTS SECTION: 1. PRODUCTS */}
        {searchMode === 'products' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-700">
                পণ্য ফলাফল ({filteredProducts.length}টি পাওয়া গেছে)
              </span>
              <span className="text-[8.5px] text-slate-500">
                {selectedDistrict !== 'সব জেলা' ? `${selectedDistrict} এর ফলাফল` : 'সারাদেশ'}
              </span>
            </div>

            {filteredProducts.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
                <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">কোনো পণ্য পাওয়া যায়নি</p>
                <p className="text-[9px] text-slate-400">ফিল্টার পরিবর্তন করে আবার চেষ্টা করুন</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {filteredProducts.map((prod) => (
                  <div
                    key={prod.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition flex flex-col justify-between group"
                  >
                    <div 
                      className="relative h-28 bg-slate-100 overflow-hidden cursor-pointer"
                      onClick={() => onSelectProduct?.(prod)}
                    >
                      <img 
                        src={getProductPublicUrl(prod.image)} 
                        alt={prod.nameBn} 
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.onerror = null;
                          target.src = NO_IMAGE_AVAILABLE_ICON;
                        }}
                      />
                      {prod.badge && (
                        <span className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[7.5px] font-black px-1.5 py-0.5 rounded-md shadow-xs">
                          {prod.badge}
                        </span>
                      )}
                    </div>

                    <div className="p-2.5 space-y-1.5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 
                          onClick={() => onSelectProduct?.(prod)}
                          className="text-[10.5px] font-black text-slate-900 line-clamp-2 leading-tight group-hover:text-amber-700 cursor-pointer"
                        >
                          {prod.nameBn}
                        </h4>
                        
                        <p className="text-[8px] text-slate-500 font-mono mt-0.5 flex items-center gap-1">
                          <MapPin className="w-2.5 h-2.5 text-[#2EAA26]" />
                          <span>{prod.origin}</span>
                        </p>
                        
                        <p 
                          onClick={() => onVisitStore?.(prod.sellerUniqueId || 'V-KHG-001')}
                          className="text-[8px] text-slate-600 font-bold mt-0.5 truncate hover:text-[#2EAA26] hover:underline cursor-pointer"
                        >
                          দোকান: {prod.sellerName}
                        </p>
                      </div>

                      <div className="pt-1 border-t border-slate-100 flex items-center justify-between">
                        <div>
                          <span className="text-xs font-black text-emerald-700">৳{prod.price}</span>
                          {prod.originalPrice > prod.price && (
                            <span className="text-[8px] text-slate-400 line-through ml-1">৳{prod.originalPrice}</span>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => onAddToCart?.(prod, 1)}
                          className="p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-[9px] font-bold shadow-xs active:scale-95 transition cursor-pointer"
                          title="কার্টে যোগ করুন"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* RESULTS SECTION: 2. SERVICES & PROFESSIONALS */}
        {searchMode === 'services' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-black text-slate-700">
                পেশাদার ও সেবা ফলাফল ({filteredServices.length} জন)
              </span>
              <span className="text-[8.5px] text-slate-500 font-mono">
                ১০০% NID ভেরিফাইড
              </span>
            </div>

            {filteredServices.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
                <Briefcase className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">কোনো সার্ভিস প্রোভাইডার পাওয়া যায়নি</p>
                <p className="text-[9px] text-slate-400">অন্যান্য জেলা বা উপজেলায় সার্চ করুন</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {filteredServices.map((pro: any) => (
                  <div
                    key={pro.id}
                    className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2.5">
                      <div className="flex items-start gap-2.5 min-w-0">
                        <img 
                          src={pro.img || pro.avatar} 
                          alt={pro.name} 
                          className="w-13 h-13 rounded-2xl object-cover border border-slate-200 shrink-0 bg-slate-100"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5">
                            <h4 
                              onClick={() => onSelectProfessional?.(pro)}
                              className="text-xs font-black text-slate-900 truncate hover:text-[#2EAA26] cursor-pointer"
                            >
                              {pro.name}
                            </h4>
                            {(pro.verified || pro.isNidVerified) && (
                              <ShieldCheck className="w-3.5 h-3.5 text-[#2EAA26] shrink-0" />
                            )}
                          </div>

                          <p className="text-[9.5px] text-slate-600 line-clamp-1 font-bold mt-0.5">
                            {pro.professionalHeadline || pro.job}
                          </p>

                          <div className="flex items-center gap-2 text-[8px] text-slate-500 mt-1">
                            <span className="font-mono bg-slate-100 text-slate-800 px-1.5 py-0.2 rounded-xs font-black">
                              {pro.uniqueId || 'S-BD-01'}
                            </span>
                            <span className="flex items-center gap-0.5 text-amber-600 font-bold">
                              ★ {pro.rating || 4.9}
                            </span>
                            <span className="flex items-center gap-0.5">
                              <MapPin className="w-2.5 h-2.5 text-[#2EAA26]" />
                              <span>{pro.area || pro.upazila}, {pro.district}</span>
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="text-xs font-black text-emerald-700">৳{pro.rateAmount || 500}</div>
                        <div className="text-[7.5px] text-slate-400 font-bold">{pro.rateType || 'দৈনিক'}</div>
                      </div>
                    </div>

                    {/* Skills pills */}
                    <div className="flex flex-wrap gap-1">
                      {(pro.selectedSkillsList || [pro.job]).slice(0, 4).map((sk: string, sIdx: number) => (
                        <span key={sIdx} className="text-[7.5px] bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded-md font-bold">
                          {sk}
                        </span>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="text-[8px] text-slate-500 flex items-center gap-1 font-mono">
                        <Phone className="w-2.5 h-2.5 text-slate-400" />
                        <span>{maskPhoneNumber(pro.phone)} (সুরক্ষিত)</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onSelectProfessional?.(pro)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-800 text-[8.5px] font-bold rounded-lg transition cursor-pointer"
                        >
                          প্রোফাইল
                        </button>
                        <button
                          type="button"
                          onClick={() => onBookService?.(pro)}
                          className="px-3 py-1 bg-[#2EAA26] hover:bg-emerald-700 text-white text-[8.5px] font-black rounded-lg shadow-xs transition cursor-pointer"
                        >
                          এসক্রো বুকিং (৫% ফি)
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
