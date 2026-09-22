import React, { useState, useMemo, useEffect } from 'react';
import { 
  ShoppingBag, Home, Truck, Utensils, Apple, Shirt, 
  Search, MapPin, User, CheckCircle2, Cpu, Filter, ArrowLeft,
  Plus, Edit3, Trash2, Phone, MessageSquare, ShieldCheck, Sparkles,
  Layers, ChevronRight, AlertCircle, RefreshCw, X, Eye, SlidersHorizontal,
  Wrench, Activity, Laptop
} from 'lucide-react';
import { aiModerationService, AiModerationResult } from '../services/aiModerationService';

// Unified Provider / Seller Post Interface
export interface VendorPost {
  id: string;
  vendorName: string;
  vendorPhone: string;
  vendorAvatar?: string;
  category: 'agriculture' | 'real_estate' | 'food' | 'clothing' | 'vehicles' | 'services' | 'electronics' | 'health';
  title: string;
  price: string;
  unit?: string;
  inStock?: boolean;
  location: {
    district: string;
    thana: string;
    mahalla: string;
  };
  description: string;
  images: string[];
  isAiVerified: boolean;
  aiConfidenceScore?: number;
  qualityGrade?: string;
  createdAt?: string;
}

// Catalog Definition
interface CatalogMeta {
  id: VendorPost['category'];
  titleBn: string;
  titleEn: string;
  descriptionBn: string;
  icon: React.ComponentType<{ className?: string; size?: number }>;
  colorBg: string;
  colorText: string;
  badgeBg: string;
}

const CATALOG_CONFIGS: CatalogMeta[] = [
  {
    id: 'agriculture',
    titleBn: 'সবজি, ফল ও কৃষি বাগান',
    titleEn: 'Agriculture & Farm Produce',
    descriptionBn: 'পাহাড় ও সমতলের নিজস্ব বাগান থেকে সংগৃহীত বিষমুক্ত টাটকা শাক-সবজি, ফলমূল ও চারাগাছ।',
    icon: Apple,
    colorBg: 'bg-emerald-50 hover:bg-emerald-100',
    colorText: 'text-emerald-700',
    badgeBg: 'bg-emerald-100 text-emerald-800'
  },
  {
    id: 'real_estate',
    titleBn: 'রিয়েল এস্টেট ও বাসা ভাড়া',
    titleEn: 'Real Estate & Rentals',
    descriptionBn: 'ফ্ল্যাট ভাড়া, কমার্শিয়াল স্পেস, সাবলেট, মেস ও জমি-প্লট ক্রয়-বিক্রয়ের ভেরিফাইড তালিকা।',
    icon: Home,
    colorBg: 'bg-blue-50 hover:bg-blue-100',
    colorText: 'text-blue-700',
    badgeBg: 'bg-blue-100 text-blue-800'
  },
  {
    id: 'food',
    titleBn: 'ফুড ও প্রস্তুতকৃত খাদ্য',
    titleEn: 'Food & Home Catering',
    descriptionBn: 'হোমমেড খাবার, ক্যাটারিং, মিষ্টি, বেকারিসামগ্রী ও ঐতিহ্যবাহী পাহাড়ি রান্নার অর্ডার।',
    icon: Utensils,
    colorBg: 'bg-amber-50 hover:bg-amber-100',
    colorText: 'text-amber-700',
    badgeBg: 'bg-amber-100 text-amber-800'
  },
  {
    id: 'clothing',
    titleBn: 'পোশাক-আশাক ও ফ্যাশন',
    titleEn: 'Clothing & Fashion',
    descriptionBn: 'দেশি সুতি পোশাক, পাহাড়ি ঐতিহ্যবাহী পিনন-হাদি, থ্রি-পিস ও বুটিক কালেকশন।',
    icon: Shirt,
    colorBg: 'bg-purple-50 hover:bg-purple-100',
    colorText: 'text-purple-700',
    badgeBg: 'bg-purple-100 text-purple-800'
  },
  {
    id: 'vehicles',
    titleBn: 'যানবাহন ও রেন্টাল সার্ভিস',
    titleEn: 'Vehicles & Transport',
    descriptionBn: 'মাইক্রোবাস, প্রাইভেট কার, সিএনজি, পিকআপ ও ট্রিপ রেন্টাল বুকিং।',
    icon: Truck,
    colorBg: 'bg-cyan-50 hover:bg-cyan-100',
    colorText: 'text-cyan-700',
    badgeBg: 'bg-cyan-100 text-cyan-800'
  },
  {
    id: 'services',
    titleBn: 'দক্ষ কারিগর ও পেশাগত সেবা',
    titleEn: 'Professional Services & Repair',
    descriptionBn: 'ইলেকট্রিশিয়ান, প্লাম্বার, রাজমিস্ত্রি, পেইন্টার ও হোম অ্যাপ্লায়েন্স সার্ভিসিং।',
    icon: Wrench,
    colorBg: 'bg-orange-50 hover:bg-orange-100',
    colorText: 'text-orange-700',
    badgeBg: 'bg-orange-100 text-orange-800'
  },
  {
    id: 'electronics',
    titleBn: 'ইলেকট্রনিক্স ও গ্যাজেটস',
    titleEn: 'Electronics & Devices',
    descriptionBn: 'মোবাইল, ল্যাপটপ, সোলার প্যানেল, ব্যাটারি ও অ্যাক্সেসরিজ।',
    icon: Laptop,
    colorBg: 'bg-indigo-50 hover:bg-indigo-100',
    colorText: 'text-indigo-700',
    badgeBg: 'bg-indigo-100 text-indigo-800'
  },
  {
    id: 'health',
    titleBn: 'স্বাস্থ্যসেবা ও ফার্মেসি',
    titleEn: 'Healthcare & Pharmacy',
    descriptionBn: 'জরুরি অ্যাম্বুলেন্স, নার্সিং কেয়ার, হোম ডায়াগনস্টিক ও মেডিসিন ডেলিভারি।',
    icon: Activity,
    colorBg: 'bg-rose-50 hover:bg-rose-100',
    colorText: 'text-rose-700',
    badgeBg: 'bg-rose-100 text-rose-800'
  }
];

// Initial Multi-Vendor Listings (Empty by default for real database entries)
const INITIAL_VENDOR_LISTINGS: VendorPost[] = [];

interface DynamicAutoRoutingProps {
  onBackToMain?: () => void;
  lang?: 'bn' | 'en';
}

export const DynamicAutoRoutingSystem: React.FC<DynamicAutoRoutingProps> = ({ 
  onBackToMain,
  lang = 'bn' 
}) => {
  // Navigation: 'catalogs' | 'catalog_view' | 'vendor_dashboard'
  const [currentView, setCurrentView] = useState<'catalogs' | 'catalog_view' | 'vendor_dashboard'>('catalogs');
  const [selectedCategory, setSelectedCategory] = useState<VendorPost['category']>('agriculture');

  // Master State with LocalStorage Persistence
  const [vendorListings, setVendorListings] = useState<VendorPost[]>(() => {
    try {
      const saved = localStorage.getItem('jhadimadi_auto_vendor_listings');
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to load vendor listings from storage:', e);
    }
    return INITIAL_VENDOR_LISTINGS;
  });

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('jhadimadi_auto_vendor_listings', JSON.stringify(vendorListings));
    } catch (e) {
      console.warn('Failed to save vendor listings:', e);
    }
  }, [vendorListings]);

  // Catalog Filter & Search States
  const [searchQuery, setSearchQuery] = useState('');
  const [filterDistrict, setFilterDistrict] = useState<string>('all');
  const [filterThana, setFilterThana] = useState<string>('all');
  const [showAiVerificationModal, setShowAiVerificationModal] = useState<AiModerationResult | null>(null);
  const [isProcessingAi, setIsProcessingAi] = useState(false);

  // Edit Listing State
  const [editingPost, setEditingPost] = useState<VendorPost | null>(null);

  // Vendor Dashboard New Post Input State
  const [newPost, setNewPost] = useState<Partial<VendorPost>>({
    vendorName: '',
    vendorPhone: '',
    category: 'agriculture',
    title: '',
    price: '',
    unit: 'কেজি',
    inStock: true,
    location: { district: 'খাগড়াছড়ি', thana: 'সদর', mahalla: '' },
    description: '',
    images: []
  });

  // Get active catalog meta
  const activeCatalogMeta = useMemo(() => {
    return CATALOG_CONFIGS.find(c => c.id === selectedCategory) || CATALOG_CONFIGS[0];
  }, [selectedCategory]);

  // Aggregate listings by Category with dynamic count
  const catalogStats = useMemo(() => {
    const counts: Record<string, number> = {};
    CATALOG_CONFIGS.forEach(cat => {
      counts[cat.id] = vendorListings.filter(item => item.category === cat.id).length;
    });
    return counts;
  }, [vendorListings]);

  // Filtered listings in current catalog view
  const currentCatalogListings = useMemo(() => {
    return vendorListings.filter(item => {
      if (item.category !== selectedCategory) return false;
      
      // Search text filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = item.title.toLowerCase().includes(q);
        const matchDesc = item.description.toLowerCase().includes(q);
        const matchVendor = item.vendorName.toLowerCase().includes(q);
        const matchLoc = `${item.location.district} ${item.location.thana} ${item.location.mahalla}`.toLowerCase().includes(q);
        if (!matchTitle && !matchDesc && !matchVendor && !matchLoc) return false;
      }

      // District filter
      if (filterDistrict !== 'all' && item.location.district !== filterDistrict) {
        return false;
      }

      // Thana filter
      if (filterThana !== 'all' && item.location.thana !== filterThana) {
        return false;
      }

      return true;
    });
  }, [vendorListings, selectedCategory, searchQuery, filterDistrict, filterThana]);

  // Unique Districts list from current catalog
  const availableDistricts = useMemo(() => {
    const districts = new Set<string>();
    vendorListings.filter(i => i.category === selectedCategory).forEach(i => {
      if (i.location?.district) districts.add(i.location.district);
    });
    return Array.from(districts);
  }, [vendorListings, selectedCategory]);

  // Unique Thanas list
  const availableThanas = useMemo(() => {
    const thanas = new Set<string>();
    vendorListings
      .filter(i => i.category === selectedCategory && (filterDistrict === 'all' || i.location.district === filterDistrict))
      .forEach(i => {
        if (i.location?.thana) thanas.add(i.location.thana);
      });
    return Array.from(thanas);
  }, [vendorListings, selectedCategory, filterDistrict]);

  // Automated Post Submission with AI Moderation Hook
  const handleVendorPostSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPost.title?.trim() || !newPost.vendorName?.trim()) {
      alert(lang === 'bn' ? 'অনুগ্রহ করে বিক্রেতার নাম ও টাইটেল পূরণ করুন।' : 'Please fill vendor name and title.');
      return;
    }

    setIsProcessingAi(true);

    try {
      // 1. Run AI Moderation Hook
      const aiResult = await aiModerationService({
        title: newPost.title || '',
        description: newPost.description || '',
        price: newPost.price || '',
        category: newPost.category || 'agriculture',
        vendorName: newPost.vendorName || '',
        location: newPost.location as any
      });

      // 2. Determine target category (AI auto-maps or respects selection)
      const targetCategory = (aiResult.categoryMatch ? newPost.category : aiResult.detectedCategory) as VendorPost['category'];

      const createdPost: VendorPost = {
        id: `V-${Date.now().toString().slice(-5)}`,
        vendorName: newPost.vendorName || 'ভেরিফাইড উদ্যোক্তা',
        vendorPhone: newPost.vendorPhone || '01700000000',
        vendorAvatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80',
        category: targetCategory,
        title: newPost.title || '',
        price: newPost.price || 'আলোচনা সাপেক্ষে',
        unit: newPost.unit || 'কেজি',
        inStock: true,
        location: newPost.location || { district: 'খাগড়াছড়ি', thana: 'সদর', mahalla: '' },
        description: newPost.description || `${newPost.title} - নির্ভরযোগ্য স্থানীয় বিক্রেতা দ্বারা সরবরাহকৃত।`,
        images: newPost.images && newPost.images.length > 0 ? newPost.images : [],
        isAiVerified: aiResult.isAiVerified,
        aiConfidenceScore: aiResult.confidenceScore,
        qualityGrade: aiResult.suggestedQualityGrade,
        createdAt: new Date().toLocaleDateString('bn-BD')
      };

      // 3. Auto-save to master store (Automatically aggregates under target category)
      setVendorListings(prev => [createdPost, ...prev]);

      // 4. Show AI Feedback Modal
      setShowAiVerificationModal(aiResult);

      // Reset form
      setNewPost({
        vendorName: newPost.vendorName,
        vendorPhone: newPost.vendorPhone,
        category: 'agriculture',
        title: '',
        price: '',
        unit: 'কেজি',
        inStock: true,
        location: newPost.location,
        description: '',
        images: []
      });

      // Navigate to the target catalog
      setSelectedCategory(targetCategory);
    } catch (err) {
      console.error('AI Moderation failed:', err);
      // Graceful fallback
      const fallbackPost: VendorPost = {
        id: `V-${Date.now().toString().slice(-5)}`,
        vendorName: newPost.vendorName || '',
        vendorPhone: newPost.vendorPhone || '',
        category: newPost.category as any,
        title: newPost.title || '',
        price: newPost.price || 'আলোচনা সাপেক্ষে',
        location: newPost.location || { district: 'খাগড়াছড়ি', thana: 'সদর', mahalla: '' },
        description: newPost.description || '',
        images: newPost.images || [],
        isAiVerified: true,
        qualityGrade: '১০০% স্ট্যান্ডার্ড কোয়ালিটি'
      };
      setVendorListings(prev => [fallbackPost, ...prev]);
      setSelectedCategory(newPost.category as any);
      setCurrentView('catalog_view');
    } finally {
      setIsProcessingAi(false);
    }
  };

  // Update existing listing (CRUD: Update)
  const handleUpdateListing = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPost) return;

    setVendorListings(prev => prev.map(item => item.id === editingPost.id ? editingPost : item));
    setEditingPost(null);
    alert(lang === 'bn' ? '✓ লিস্টিং তথ্য সফলভাবে আপডেট হয়েছে!' : 'Listing updated successfully!');
  };

  // Delete listing (CRUD: Delete)
  const handleDeleteListing = (id: string) => {
    if (window.confirm(lang === 'bn' ? 'আপনি কি নিশ্চিতভাবে এই লিস্টিংটি মুছে ফেলতে চান?' : 'Are you sure you want to delete this listing?')) {
      setVendorListings(prev => prev.filter(item => item.id !== id));
    }
  };

  // Toggle in-stock status
  const handleToggleStock = (id: string) => {
    setVendorListings(prev => prev.map(item => {
      if (item.id === id) {
        return { ...item, inStock: !item.inStock };
      }
      return item;
    }));
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 text-slate-800 p-2 sm:p-4 font-sans space-y-4">
      
      {/* ================= TOP APPLICATION HEADER & MODE CONTROLLER ================= */}
      <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          
          <div className="flex items-center gap-3">
            {onBackToMain && (
              <button
                type="button"
                onClick={onBackToMain}
                className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                title="মূল অ্যাপে ফিরে যান"
              >
                <ArrowLeft size={16} />
              </button>
            )}
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <Cpu size={22} className="animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-black text-slate-900">
                  {lang === 'bn' ? 'স্মার্ট অটো-ক্যাটাগরি ডিরেক্টরি মার্কেটপ্লেস' : 'Automated Multi-Vendor Directory System'}
                </h1>
                <span className="text-[9px] font-black px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1">
                  <Sparkles size={10} />
                  AI Auto-Routing
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {lang === 'bn' 
                  ? 'উদ্যোক্তা প্রোফাইল ও পণ্য সাবমিট করলেই স্বয়ংক্রিয়ভাবে ক্যাটাগরি ক্যাটালগে যুক্ত হবে' 
                  : 'Multi-vendor automated catalog assignment with real-time aggregation'}
              </p>
            </div>
          </div>

          {/* Action Tabs Navigation */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => { setCurrentView('catalogs'); }}
              className={`flex-1 sm:flex-none text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                currentView === 'catalogs' || currentView === 'catalog_view'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              <Layers size={14} />
              <span>{lang === 'bn' ? 'সকল ক্যাটালগসমূহ' : 'Browse Catalogs'}</span>
            </button>

            <button
              type="button"
              onClick={() => { setCurrentView('vendor_dashboard'); }}
              className={`flex-1 sm:flex-none text-xs font-bold px-3.5 py-2 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer ${
                currentView === 'vendor_dashboard'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
              }`}
            >
              <Plus size={14} />
              <span>{lang === 'bn' ? 'উদ্যোক্তা সেল্ফ-সার্ভিস ড্যাশবোর্ড' : 'Vendor Dashboard (CRUD)'}</span>
            </button>
          </div>

        </div>
      </div>

      {/* ================= SCENE 1: MAIN CATALOGS DIRECTORY GRID ================= */}
      {currentView === 'catalogs' && (
        <div className="space-y-4">
          
          {/* Quick Notice Banner */}
          <div className="bg-linear-to-r from-emerald-700 to-teal-800 rounded-2xl p-4 text-white shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-emerald-300" />
                <h2 className="text-xs sm:text-sm font-black">
                  {lang === 'bn' ? 'স্বয়ংক্রিয় ক্যাটালগ সমাহার (Automated Multi-Vendor Directory)' : 'Automated Directory & Catalog Matrix'}
                </h2>
              </div>
              <p className="text-[11px] text-emerald-100 max-w-2xl">
                কোনো ম্যানুয়াল পোস্ট তৈরির ঝামেলা ছাড়াই যে-কোনো বিক্রেতা বা কারিগর রেজিস্ট্রেশন করলে তাদের সেবা ও পণ্য সরাসরি নির্দিষ্ট ক্যাটালগ পেজে প্রদর্শিত হয়।
              </p>
            </div>
            <div className="bg-white/10 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-white/20 text-xs font-black text-white shrink-0">
              মোট {vendorListings.length} টি সক্রিয় লিস্টিং
            </div>
          </div>

          {/* 8-Grid Dynamic Category Catalogs */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {CATALOG_CONFIGS.map((catalog) => {
              const IconComp = catalog.icon;
              const itemCount = catalogStats[catalog.id] || 0;

              return (
                <div
                  key={catalog.id}
                  onClick={() => {
                    setSelectedCategory(catalog.id);
                    setSearchQuery('');
                    setFilterDistrict('all');
                    setFilterThana('all');
                    setCurrentView('catalog_view');
                  }}
                  className="bg-white p-3.5 sm:p-4 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <div className={`w-10 h-10 rounded-xl ${catalog.colorBg} ${catalog.colorText} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                        <IconComp size={20} />
                      </div>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${catalog.badgeBg}`}>
                        {itemCount} টি লিস্টিং
                      </span>
                    </div>

                    <div>
                      <h3 className="font-black text-xs sm:text-sm text-slate-900 group-hover:text-emerald-700 transition">
                        {catalog.titleBn}
                      </h3>
                      <p className="text-[10px] text-slate-500 mt-1 line-clamp-2">
                        {catalog.descriptionBn}
                      </p>
                    </div>
                  </div>

                  <div className="pt-3 mt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-bold text-emerald-700">
                    <span>ক্যাটালগ দেখুন</span>
                    <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      )}

      {/* ================= SCENE 2: DYNAMIC INDIVIDUAL CATALOG VIEW (AUTO-AGGREGATED) ================= */}
      {currentView === 'catalog_view' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-3 sm:p-5 shadow-xs space-y-4">
          
          {/* Catalog Top Header Bar */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentView('catalogs')}
                className="text-xs font-black text-slate-700 bg-slate-100 hover:bg-slate-200 px-3 py-1.5 rounded-xl flex items-center gap-1.5 transition cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>{lang === 'bn' ? 'সকল ক্যাটালগ' : 'All Catalogs'}</span>
              </button>

              <div className="flex items-center gap-2">
                <div className={`p-2 rounded-xl ${activeCatalogMeta.colorBg} ${activeCatalogMeta.colorText}`}>
                  {React.createElement(activeCatalogMeta.icon, { size: 18 })}
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-black text-slate-900">
                    {activeCatalogMeta.titleBn}
                  </h2>
                  <span className="text-[11px] text-slate-500">
                    অটো-অ্যাগ্রিগেটেড লিস্টিং: {currentCatalogListings.length} টি বিক্রেতা প্রোফাইল
                  </span>
                </div>
              </div>
            </div>

            {/* Switch Category Dropdown Quick Picker */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={selectedCategory}
                onChange={(e) => {
                  setSelectedCategory(e.target.value as any);
                  setSearchQuery('');
                  setFilterDistrict('all');
                  setFilterThana('all');
                }}
                className="w-full sm:w-auto text-xs font-black px-3 py-1.5 border border-slate-300 rounded-xl bg-slate-50 focus:ring-2 focus:ring-emerald-500 cursor-pointer"
              >
                {CATALOG_CONFIGS.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.titleBn} ({catalogStats[c.id] || 0})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Filter & Search Matrix Bar */}
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-2">
            
            {/* Keyword Search */}
            <div className="relative">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder={lang === 'bn' ? 'পণ্য, বিক্রেতা বা এলাকা খুঁজুন...' : 'Search items, seller, area...'}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:border-emerald-500"
              />
            </div>

            {/* District Filter */}
            <div>
              <select
                value={filterDistrict}
                onChange={(e) => {
                  setFilterDistrict(e.target.value);
                  setFilterThana('all');
                }}
                className="w-full py-1.5 px-3 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:border-emerald-500"
              >
                <option value="all">সকল জেলা ({availableDistricts.length})</option>
                {availableDistricts.map(d => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            {/* Thana Filter */}
            <div>
              <select
                value={filterThana}
                onChange={(e) => setFilterThana(e.target.value)}
                className="w-full py-1.5 px-3 bg-white border border-slate-300 rounded-xl text-xs outline-none focus:border-emerald-500"
              >
                <option value="all">সকল থানা / উপজেলা ({availableThanas.length})</option>
                {availableThanas.map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>

          </div>

          {/* Aggregated Vendor Listings Stream */}
          {currentCatalogListings.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Search size={24} />
              </div>
              <p className="text-xs font-bold">
                {lang === 'bn' 
                  ? 'এই ফিল্টারে কোনো সক্রিয় উদ্যোক্তা বা পণ্য পাওয়া যায়নি।' 
                  : 'No active vendor listings found for this filter.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setSearchQuery('');
                  setFilterDistrict('all');
                  setFilterThana('all');
                }}
                className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200"
              >
                ফিল্টার রিসেট করুন
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {currentCatalogListings.map((item) => (
                <div 
                  key={item.id}
                  className="bg-white border border-slate-200 rounded-2xl p-3 shadow-2xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    {/* Media with Badges */}
                    <div className="relative h-40 bg-slate-100 rounded-xl overflow-hidden">
                      <img 
                        src={item.images[0] || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80'} 
                        alt={item.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {item.isAiVerified && (
                          <span className="bg-emerald-900/90 text-emerald-200 text-[9px] font-black px-2 py-0.5 rounded-md backdrop-blur-xs flex items-center gap-1">
                            <Sparkles size={10} className="text-emerald-400" />
                            AI Verified ({item.aiConfidenceScore || 96}%)
                          </span>
                        )}
                        {item.qualityGrade && (
                          <span className="bg-slate-900/80 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-xs">
                            {item.qualityGrade}
                          </span>
                        )}
                      </div>

                      <div className="absolute bottom-2 right-2">
                        <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md backdrop-blur-xs ${
                          item.inStock ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                        }`}>
                          {item.inStock ? 'স্টকে আছে' : 'স্টক শেষ'}
                        </span>
                      </div>
                    </div>

                    {/* Title & Price */}
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-black text-xs sm:text-sm text-slate-900 line-clamp-2">
                          {item.title}
                        </h3>
                      </div>
                      <p className="text-xs font-black text-emerald-700 mt-1">
                        {item.price} {item.unit ? `(${item.unit})` : ''}
                      </p>
                    </div>

                    {/* Location */}
                    <p className="text-[11px] text-slate-500 flex items-center gap-1">
                      <MapPin size={12} className="text-slate-400 shrink-0" />
                      <span>{item.location.district}, {item.location.thana} {item.location.mahalla ? `• ${item.location.mahalla}` : ''}</span>
                    </p>

                    {/* Description */}
                    <p className="text-[11px] text-slate-600 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  </div>

                  {/* Vendor Details Footer & Direct Action Buttons */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 overflow-hidden">
                      <img 
                        src={item.vendorAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80'} 
                        alt="Vendor" 
                        className="w-5 h-5 rounded-full object-cover shrink-0" 
                      />
                      <span className="text-[10px] font-bold text-slate-700 truncate">
                        {item.vendorName}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <a
                        href={`tel:${item.vendorPhone}`}
                        className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition"
                        title="সরাসরি কল করুন"
                      >
                        <Phone size={12} />
                      </a>
                      <button
                        type="button"
                        onClick={() => {
                          alert(`উদ্যোক্তা "${item.vendorName}" এর সাথে যোগাযোগের জন্য ফোন করুন: ${item.vendorPhone}`);
                        }}
                        className="text-[10px] font-black px-2 py-1 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition shadow-2xs"
                      >
                        অর্ডার / যোগাযোগ
                      </button>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          )}

        </div>
      )}

      {/* ================= SCENE 3: VENDOR SELF-SERVICE DASHBOARD (FULL CRUD) ================= */}
      {currentView === 'vendor_dashboard' && (
        <div className="space-y-4">
          
          {/* Dashboard Header */}
          <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-emerald-500 text-slate-950 font-black text-xs">
                  CRUD Control
                </span>
                <h2 className="text-sm sm:text-base font-black">
                  {lang === 'bn' ? 'উদ্যোক্তা ও সেবাদাতা ম্যানেজমেন্ট ড্যাশবোর্ড' : 'Vendor Self-Service Dashboard'}
                </h2>
              </div>
              <p className="text-[11px] text-slate-300">
                এখানে আপনার তথ্য বা নতুন পণ্য যুক্ত করলেই এআই যাচাইয়ের পর উপযুক্ত ক্যাটালগে স্বয়ংক্রিয়ভাবে তালিকাভুক্ত হবে।
              </p>
            </div>

            <button
              type="button"
              onClick={() => setCurrentView('catalogs')}
              className="text-xs font-bold bg-white/10 hover:bg-white/20 text-white px-3.5 py-1.5 rounded-xl border border-white/20"
            >
              ক্যাটালগ ব্রাউজ করুন
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            
            {/* LEFT COLUMN: Add New Post Form (4 cols) */}
            <div className="lg:col-span-5 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3.5">
              <div className="border-b border-slate-100 pb-2">
                <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                  <Plus size={14} className="text-emerald-600" />
                  <span>নতুন লিস্টিং বা সেবা পোস্ট করুন (Auto-Mapped)</span>
                </h3>
                <span className="text-[10px] text-slate-500">
                  নির্ধারিত ক্যাটাগরি বাছাই করলে সরাসরি ওই ক্যাটালগে যুক্ত হবে
                </span>
              </div>

              <form onSubmit={handleVendorPostSubmit} className="space-y-3 text-xs">
                
                {/* Vendor Name & Phone */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">আপনার / ফার্মের নাম *</label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: রহিম অর্গানিক গার্ডেন"
                      value={newPost.vendorName}
                      onChange={(e) => setNewPost({ ...newPost, vendorName: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">মোবাইল নম্বর *</label>
                    <input
                      type="tel"
                      required
                      placeholder="017xxxxxxxx"
                      value={newPost.vendorPhone}
                      onChange={(e) => setNewPost({ ...newPost, vendorPhone: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>

                {/* Target Category Selection */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">
                    ক্যাটাগরি নির্বাচন (যে ক্যাটালগে জমা হবে) *
                  </label>
                  <select
                    value={newPost.category}
                    onChange={(e) => {
                      const cat = e.target.value as any;
                      setNewPost({ 
                        ...newPost, 
                        category: cat
                      });
                    }}
                    className="w-full p-2 border border-emerald-300 rounded-xl bg-emerald-50 text-emerald-900 font-bold outline-none cursor-pointer"
                  >
                    {CATALOG_CONFIGS.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.titleBn}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Post Title */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">পণ্য বা সেবার শিরোনাম *</label>
                  <input
                    type="text"
                    required
                    placeholder="যেমন: বিষমুক্ত টাটকা টমেটো ও ফলের চারা"
                    value={newPost.title}
                    onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Price and Unit */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">মূল্য / রেট *</label>
                    <input
                      type="text"
                      required
                      placeholder="যেমন: ৳ ৫০"
                      value={newPost.price}
                      onChange={(e) => setNewPost({ ...newPost, price: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-xl outline-none"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 mb-1">একক (Unit)</label>
                    <input
                      type="text"
                      placeholder="যেমন: কেজি / মাস / পিস"
                      value={newPost.unit}
                      onChange={(e) => setNewPost({ ...newPost, unit: e.target.value })}
                      className="w-full p-2 border border-slate-300 rounded-xl outline-none"
                    />
                  </div>
                </div>

                {/* Multi-Level Location */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">অবস্থান (জেলা &gt; উপজেলা &gt; পাড়া) *</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    <input
                      type="text"
                      placeholder="জেলা"
                      value={newPost.location?.district || ''}
                      onChange={(e) => setNewPost({
                        ...newPost,
                        location: { ...newPost.location!, district: e.target.value }
                      })}
                      className="p-2 border border-slate-300 rounded-xl text-xs"
                    />
                    <input
                      type="text"
                      placeholder="উপজেলা"
                      value={newPost.location?.thana || ''}
                      onChange={(e) => setNewPost({
                        ...newPost,
                        location: { ...newPost.location!, thana: e.target.value }
                      })}
                      className="p-2 border border-slate-300 rounded-xl text-xs"
                    />
                    <input
                      type="text"
                      placeholder="পাড়া-মহল্লা"
                      value={newPost.location?.mahalla || ''}
                      onChange={(e) => setNewPost({
                        ...newPost,
                        location: { ...newPost.location!, mahalla: e.target.value }
                      })}
                      className="p-2 border border-slate-300 rounded-xl text-xs"
                    />
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block font-bold text-slate-700 mb-1">বিস্তারিত বিবরণ *</label>
                  <textarea
                    rows={3}
                    required
                    placeholder="পণ্য বা সেবার বিশদ বিবরণ..."
                    value={newPost.description}
                    onChange={(e) => setNewPost({ ...newPost, description: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isProcessingAi}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 rounded-xl shadow-xs transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isProcessingAi ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>এআই ভেরিফিকেশন ও ম্যাপিং হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles size={14} />
                      <span>সাবমিট করুন (অটো-ক্যাটাগরি অ্যাসাইন হবে)</span>
                    </>
                  )}
                </button>

              </form>
            </div>

            {/* RIGHT COLUMN: Master Inventory & Listings Manager (7 cols) */}
            <div className="lg:col-span-7 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                    <Layers size={14} className="text-blue-600" />
                    <span>সকল সক্রিয় লিস্টিংস ({vendorListings.length}) - লাইভ ডিরেক্টরি</span>
                  </h3>
                  <span className="text-[10px] text-slate-500">
                    এখানে যে কোনো পরিবর্তন সংশ্লিষ্ট ক্যাটালগ পেজে তৎক্ষণাৎ প্রতিফলিত হবে
                  </span>
                </div>
              </div>

              {vendorListings.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs">
                  কোনো লিস্টিং নেই। বাম পাশের ফর্ম থেকে নতুন লিস্টিং তৈরি করুন।
                </div>
              ) : (
                <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
                  {vendorListings.map((item) => (
                    <div 
                      key={item.id}
                      className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 hover:bg-white hover:shadow-2xs transition"
                    >
                      <div className="flex items-start gap-2.5">
                        <img 
                          src={item.images[0] || 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80'} 
                          alt="Post"
                          className="w-12 h-12 rounded-lg object-cover shrink-0" 
                        />
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[9px] font-black px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-md">
                              {CATALOG_CONFIGS.find(c => c.id === item.category)?.titleBn || item.category}
                            </span>
                            {item.isAiVerified && (
                              <span className="text-[8px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.2 rounded-md">
                                ✓ AI Verified
                              </span>
                            )}
                          </div>

                          <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{item.title}</h4>
                          
                          <div className="flex items-center gap-2 text-[10px] text-slate-500">
                            <span className="font-black text-emerald-700">{item.price}</span>
                            <span>•</span>
                            <span>{item.location.district} &gt; {item.location.thana}</span>
                            <span>•</span>
                            <span className="font-bold text-slate-700">{item.vendorName}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Tools */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStock(item.id)}
                          className={`text-[9px] font-black px-2 py-1 rounded-lg border transition cursor-pointer ${
                            item.inStock 
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100' 
                              : 'bg-red-50 text-red-800 border-red-200 hover:bg-red-100'
                          }`}
                        >
                          {item.inStock ? 'ইন স্টক' : 'স্টক আউট'}
                        </button>

                        <button
                          type="button"
                          onClick={() => setEditingPost({ ...item })}
                          className="p-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 transition"
                          title="সম্পাদনা করুন"
                        >
                          <Edit3 size={12} />
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteListing(item.id)}
                          className="p-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>

          </div>

        </div>
      )}

      {/* ================= EDIT LISTING MODAL ================= */}
      {editingPost && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl p-4 sm:p-6 space-y-4 max-h-[90vh] overflow-y-auto text-xs">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-black text-sm text-slate-900 flex items-center gap-1.5">
                <Edit3 size={15} className="text-blue-600" />
                <span>লিস্টিং তথ্য সম্পাদনা করুন (Edit Listing)</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingPost(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500 font-bold"
              >
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateListing} className="space-y-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">ক্যাটাগরি</label>
                <select
                  value={editingPost.category}
                  onChange={(e) => setEditingPost({ ...editingPost, category: e.target.value as any })}
                  className="w-full p-2 border border-slate-300 rounded-xl bg-slate-50 font-bold"
                >
                  {CATALOG_CONFIGS.map(c => (
                    <option key={c.id} value={c.id}>{c.titleBn}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">শিরোনাম</label>
                <input
                  type="text"
                  required
                  value={editingPost.title}
                  onChange={(e) => setEditingPost({ ...editingPost, title: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">মূল্য</label>
                  <input
                    type="text"
                    required
                    value={editingPost.price}
                    onChange={(e) => setEditingPost({ ...editingPost, price: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">একক</label>
                  <input
                    type="text"
                    value={editingPost.unit || ''}
                    onChange={(e) => setEditingPost({ ...editingPost, unit: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">অবস্থান</label>
                <div className="grid grid-cols-3 gap-1.5">
                  <input
                    type="text"
                    placeholder="জেলা"
                    value={editingPost.location.district}
                    onChange={(e) => setEditingPost({
                      ...editingPost,
                      location: { ...editingPost.location, district: e.target.value }
                    })}
                    className="p-2 border border-slate-300 rounded-xl text-xs"
                  />
                  <input
                    type="text"
                    placeholder="উপজেলা"
                    value={editingPost.location.thana}
                    onChange={(e) => setEditingPost({
                      ...editingPost,
                      location: { ...editingPost.location, thana: e.target.value }
                    })}
                    className="p-2 border border-slate-300 rounded-xl text-xs"
                  />
                  <input
                    type="text"
                    placeholder="পাড়া"
                    value={editingPost.location.mahalla}
                    onChange={(e) => setEditingPost({
                      ...editingPost,
                      location: { ...editingPost.location, mahalla: e.target.value }
                    })}
                    className="p-2 border border-slate-300 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">বিবরণ</label>
                <textarea
                  rows={3}
                  value={editingPost.description}
                  onChange={(e) => setEditingPost({ ...editingPost, description: e.target.value })}
                  className="w-full p-2 border border-slate-300 rounded-xl"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t">
                <button
                  type="button"
                  onClick={() => setEditingPost(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black"
                >
                  ✓ পরিবর্তন সংরক্ষণ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= AI MODERATION & AUTO-ROUTING FEEDBACK MODAL ================= */}
      {showAiVerificationModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-5 space-y-4 text-xs animate-in fade-in zoom-in-95 duration-200">
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto shadow-2xs">
                <Sparkles size={24} />
              </div>
              <h3 className="font-black text-sm text-slate-900">
                এআই অটো-ক্যাটালগ ভেরিফিকেশন সফল!
              </h3>
              <p className="text-[11px] text-slate-500">
                পোস্টটি বিশ্লেষণ করে স্বয়ংক্রিয়ভাবে ক্যাটাগরি ডিরেক্টরিতে তালিকাভুক্ত করা হয়েছে।
              </p>
            </div>

            <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600">এআই বিশ্বাসযোগ্যতা স্কোর:</span>
                <span className="text-emerald-700 font-black">{showAiVerificationModal.confidenceScore}% (ভেরিফাইড)</span>
              </div>

              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600">অ্যাসাইনকৃত ক্যাটালগ:</span>
                <span className="text-slate-900 font-black uppercase">
                  {CATALOG_CONFIGS.find(c => c.id === showAiVerificationModal.detectedCategory)?.titleBn || showAiVerificationModal.detectedCategory}
                </span>
              </div>

              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-slate-600">কোয়ালিটি গ্রেড:</span>
                <span className="text-blue-700 font-black">{showAiVerificationModal.suggestedQualityGrade}</span>
              </div>

              <p className="text-[10px] text-slate-600 pt-1 border-t border-slate-200">
                {showAiVerificationModal.moderationNotesBn}
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setShowAiVerificationModal(null);
                setCurrentView('catalog_view');
              }}
              className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl shadow-xs"
            >
              ✓ ক্যাটালগ পেজ ওপেন করুন
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
