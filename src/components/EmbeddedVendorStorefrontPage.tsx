import React, { useState } from 'react';
import { 
  Store, 
  MapPin, 
  Phone, 
  ShieldCheck, 
  Star, 
  ShoppingBag, 
  Plus, 
  Share2, 
  Camera, 
  CheckCircle2, 
  Upload, 
  DollarSign, 
  Clock, 
  Tag, 
  Sparkles, 
  ChevronRight, 
  AlertCircle, 
  ArrowLeft,
  Eye,
  TrendingUp,
  MessageSquare,
  Wallet,
  ExternalLink,
  QrCode,
  Flame,
  Award,
  Layers
} from 'lucide-react';
import { VendorStore, VendorStoreProduct, INITIAL_VENDOR_STORES } from '../data/vendorsData';
import { StoreProduct } from '../data/productsData';
import { Language } from '../utils/translations';
import { maskPhoneNumber } from '../utils/uniqueIdGenerator';
import { getProductPublicUrl } from '../utils/directSupabaseStorage';
import { NO_IMAGE_AVAILABLE_ICON } from '../constants/imageConstants';

interface EmbeddedVendorStorefrontPageProps {
  vendorStore: VendorStore;
  onBack: () => void;
  onUpdateVendorStore?: (updated: VendorStore) => void;
  onAddToCart?: (product: VendorStoreProduct | StoreProduct, qty: number) => void;
  onViewProductDetail?: (product: StoreProduct) => void;
  onPromoteProduct?: (productTitle: string) => void;
  isOwner?: boolean;
  lang: Language;
}

export const EmbeddedVendorStorefrontPage: React.FC<EmbeddedVendorStorefrontPageProps> = ({
  vendorStore,
  onBack,
  onUpdateVendorStore,
  onAddToCart,
  onViewProductDetail,
  onPromoteProduct,
  isOwner = true,
  lang
}) => {
  const [store, setStore] = useState<VendorStore>(vendorStore);
  const [activeTab, setActiveTab] = useState<'storefront' | 'products_manage' | 'orders_wallet' | 'inbox'>('storefront');
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);
  const [showPromoteToast, setShowPromoteToast] = useState('');

  // Add Product Form State
  const [newTitle, setNewTitle] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newOriginalPrice, setNewOriginalPrice] = useState('');
  const [newUnit, setNewUnit] = useState('১ কেজি প্যাকেট');
  const [newCategory, setNewCategory] = useState('SpicesGrains');
  const [newDescription, setNewDescription] = useState('');
  const [newStock, setNewStock] = useState('30');
  const [newBadge, setNewBadge] = useState('১০০% অর্গানিক');
  const [newImages, setNewImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=600&q=80',
    'https://images.unsplash.com/photo-1596040033229-a9821ebd058d?auto=format&fit=crop&w=600&q=80',
  ]);

  // Cashout Modal State
  const [showCashoutModal, setShowCashoutModal] = useState(false);
  const [cashoutAmount, setCashoutAmount] = useState('');
  const [cashoutMethod, setCashoutMethod] = useState<'bKash' | 'Nagad'>('bKash');
  const [cashoutNumber, setCashoutNumber] = useState('');
  const [cashoutSuccess, setCashoutSuccess] = useState(false);

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2500);
  };

  const handleAddProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newPrice) return;

    const priceNum = parseFloat(newPrice) || 100;
    const originalPriceNum = parseFloat(newOriginalPrice) || Math.round(priceNum * 1.2);

    const newProd: VendorStoreProduct = {
      id: 'vprod_' + Date.now(),
      nameBn: newTitle.trim(),
      nameEn: newTitle.trim(),
      category: newCategory,
      categoryLabelBn: newCategory === 'SpicesGrains' ? 'পাহাড়ি মশলা ও শস্য' : 'অর্গানিক খাবার',
      price: priceNum,
      originalPrice: originalPriceNum,
      unit: newUnit,
      stock: parseInt(newStock, 10) || 20,
      origin: `${store.mahalla}, ${store.district}`,
      district: store.district,
      upazila: store.upazila,
      mahalla: store.mahalla,
      bazarName: store.bazarName,
      image: newImages[0],
      images: newImages,
      rating: 5.0,
      reviewsCount: 1,
      badge: newBadge,
      badgeColor: 'bg-emerald-600',
      descriptionBn: newDescription || `${store.shopName} এর নিজস্ব খামার ও বাগান থেকে উৎপাদিত শতভাগ নির্ভেজাল পণ্য।`,
      descriptionEn: 'Pure organic mountain product.',
      features: ['সম্পূর্ণ প্রাকৃতিক ও প্রিজারভেটিভমুক্ত', 'পাহাড়ি স্থানীয় উৎপাদন', 'সরাসরি কৃষক থেকে সংগৃহীত'],
      specifications: [
        { labelBn: 'উৎপাদন স্থান', valueBn: `${store.mahalla}, ${store.district}` },
        { labelBn: 'মান নিয়ন্ত্রণ', valueBn: '১০০% পরীক্ষিত ও কেমিক্যালমুক্ত' },
        { labelBn: 'প্যাকেজিং', valueBn: 'ফুড-গ্রেড এয়ারটাইট প্যাকেট' }
      ],
      verifiedSeller: true,
      sellerId: store.id,
      sellerUniqueId: store.uniqueId,
      sellerShopName: store.shopName,
      sellerOwnerName: store.ownerName,
      sellerPhoneMasked: maskPhoneNumber(store.phone),
    };

    const updatedStore: VendorStore = {
      ...store,
      products: [newProd, ...store.products]
    };

    setStore(updatedStore);
    if (onUpdateVendorStore) {
      onUpdateVendorStore(updatedStore);
    }

    setShowAddProductModal(false);
    // Reset Form
    setNewTitle('');
    setNewPrice('');
    setNewDescription('');
  };

  const handlePromoteItem = (prodId: string, prodTitle: string) => {
    const updatedProducts = store.products.map(p => {
      if (p.id === prodId) {
        return { ...p, featuredOnHome: true, badge: 'স্পন্সরড / ফিচারড' };
      }
      return p;
    });

    const updatedStore = { ...store, products: updatedProducts };
    setStore(updatedStore);
    if (onUpdateVendorStore) onUpdateVendorStore(updatedStore);

    setShowPromoteToast(`'${prodTitle}' হোমপেজে ৭ দিনের জন্য ফিচারড হিসেবে প্রমোট করা হয়েছে! (বিজ্ঞাপন ফি ৳৫০)`);
    setTimeout(() => setShowPromoteToast(''), 4000);
  };

  const handleCashout = (e: React.FormEvent) => {
    e.preventDefault();
    setCashoutSuccess(true);
    setTimeout(() => {
      setCashoutSuccess(false);
      setShowCashoutModal(false);
      setCashoutAmount('');
    }, 2000);
  };

  return (
    <div className="bg-slate-50 min-h-full rounded-2xl border border-slate-200 overflow-hidden flex flex-col justify-between shadow-xs relative pb-10 animate-fadeIn">
      
      {/* 1. Header Bar */}
      <div className="bg-white sticky top-0 z-20 px-3.5 py-2.5 border-b border-slate-200 flex items-center justify-between shadow-xs">
        <button
          type="button"
          onClick={onBack}
          className="flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 px-2.5 py-1.5 rounded-xl transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4 text-amber-600" />
          <span>{lang === 'bn' ? 'হোমে ফিরুন' : 'Back'}</span>
        </button>

        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-amber-600 text-white font-black text-xs flex items-center justify-center">
            V
          </div>
          <span className="font-extrabold text-xs text-slate-900 font-mono">
            {store.uniqueId}
          </span>
        </div>

        <button
          type="button"
          onClick={handleShare}
          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition cursor-pointer"
          title="Share Store Link"
        >
          <Share2 className="w-4 h-4" />
        </button>
      </div>

      {copiedToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] font-bold px-3 py-1.5 rounded-full shadow-lg z-50 animate-bounce">
          ✓ স্টোর লিঙ্ক কপি হয়েছে!
        </div>
      )}

      {showPromoteToast && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 bg-amber-600 text-white text-[10px] font-bold px-3.5 py-2 rounded-xl shadow-xl z-50 max-w-xs text-center">
          {showPromoteToast}
        </div>
      )}

      {/* 2. Facebook Page / Storefront Cover Banner */}
      <div className="relative">
        <div className="h-28 sm:h-36 w-full bg-slate-800 overflow-hidden relative">
          <img 
            src={store.coverBanner || 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1000&q=80'} 
            alt={store.shopName}
            className="w-full h-full object-cover opacity-85"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent"></div>
          
          <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/50 backdrop-blur-md px-2 py-0.5 rounded-full text-white text-[8px] font-bold">
            <MapPin className="w-3 h-3 text-amber-400" />
            <span>{store.mahalla}, {store.district}</span>
          </div>
        </div>

        {/* Avatar & Store Info Overlap */}
        <div className="px-3.5 -mt-10 relative z-10 flex items-end justify-between">
          <div className="flex items-end gap-2.5">
            <div className="relative">
              <img 
                src={store.avatar || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80'} 
                alt={store.shopName}
                className="w-20 h-20 rounded-2xl object-cover border-3 border-white shadow-md bg-white"
              />
              <div className="absolute -bottom-1 -right-1 bg-amber-500 text-white rounded-full p-1 border-2 border-white shadow-xs">
                <ShieldCheck className="w-3.5 h-3.5" />
              </div>
            </div>

            <div className="pb-1">
              <div className="flex items-center gap-1.5">
                <h1 className="text-xs font-black text-slate-900 leading-tight">
                  {store.shopName}
                </h1>
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="font-mono text-[8px] font-black bg-slate-900 text-white px-1.5 py-0.2 rounded-xs">
                  {store.uniqueId}
                </span>
                <span className="text-[8px] text-amber-700 bg-amber-100 font-bold px-1.5 py-0.2 rounded-xs flex items-center gap-0.5">
                  ★ {store.rating} ({store.reviewsCount} রিভিউ)
                </span>
              </div>
            </div>
          </div>

          {isOwner && (
            <button
              type="button"
              onClick={() => setShowAddProductModal(true)}
              className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 active:scale-95 text-white rounded-xl text-[10px] font-black shadow-sm flex items-center gap-1 transition cursor-pointer mb-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{lang === 'bn' ? 'নতুন পণ্য যোগ' : 'Add Product'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Bio and Trust Pills */}
      <div className="p-3.5 space-y-3">
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-2">
          <p className="text-[10px] text-slate-700 leading-relaxed">
            {store.bio || 'আমাদের পাহাড়ি নিজস্ব খামার ও বাগানের ১০০% রাসায়নিকমুক্ত ফলমূল, মশলা ও খাঁটি চালের গুঁড়া সরাসরি গ্রাহকের হাতে পৌঁছে দিই।'}
          </p>

          <div className="flex flex-wrap gap-1.5 pt-1 border-t border-slate-100 text-[8.5px]">
            <span className="bg-emerald-50 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-[#2EAA26]" />
              <span>এনআইডি ভেরিফাইড মার্চেন্ট</span>
            </span>
            <span className="bg-amber-50 text-amber-800 border border-amber-200 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
              <Award className="w-3 h-3 text-amber-600" />
              <span>পাহাড়ি অর্গানিক সনদ</span>
            </span>
            <span className="bg-slate-50 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-md font-bold flex items-center gap-1">
              <Clock className="w-3 h-3 text-slate-500" />
              <span>অর্ডারের ১-৩ দিনে ডেলিভারি</span>
            </span>
          </div>
        </div>

        {/* Tab Navigation Navigation (Storefront vs Management vs Wallet) */}
        {isOwner && (
          <div className="flex bg-slate-200 p-1 rounded-xl gap-1 text-[9.5px] font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('storefront')}
              className={`flex-1 py-1.5 rounded-lg transition text-center cursor-pointer ${
                activeTab === 'storefront' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🛍️ স্টোরফ্রন্ট ({store.products.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('products_manage')}
              className={`flex-1 py-1.5 rounded-lg transition text-center cursor-pointer ${
                activeTab === 'products_manage' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              ⚙️ পণ্য ম্যানেজমেন্ট
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('orders_wallet')}
              className={`flex-1 py-1.5 rounded-lg transition text-center cursor-pointer ${
                activeTab === 'orders_wallet' ? 'bg-white text-slate-900 shadow-xs font-black' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              💰 ওয়ালেট (৫% ফি)
            </button>
          </div>
        )}

        {/* TAB 1: STOREFRONT VIEW */}
        {activeTab === 'storefront' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Store className="w-4 h-4 text-amber-600" />
                <span>দোকানের পণ্য তালিকা ({store.products.length}টি)</span>
              </h3>
              <span className="text-[8.5px] text-slate-500">
                গ্রাহকদের জন্য উন্মুক্ত
              </span>
            </div>

            {store.products.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
                <ShoppingBag className="w-8 h-8 text-slate-300 mx-auto" />
                <p className="text-xs font-bold text-slate-600">এই দোকানে এখনও কোনো পণ্য যোগ করা হয়নি</p>
                {isOwner && (
                  <button
                    type="button"
                    onClick={() => setShowAddProductModal(true)}
                    className="px-3 py-1.5 bg-amber-600 text-white text-[10px] font-bold rounded-xl"
                  >
                    + প্রথম পণ্য যোগ করুন
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {store.products.map((prod) => (
                  <div
                    key={prod.id}
                    className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs hover:shadow-md transition flex flex-col justify-between group"
                  >
                    <div 
                      className="relative h-28 bg-slate-100 overflow-hidden cursor-pointer"
                      onClick={() => onViewProductDetail && onViewProductDetail(prod as any)}
                    >
                      <img 
                        src={getProductPublicUrl(prod.image)} 
                        alt={prod.nameBn} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          const target = e.currentTarget as HTMLImageElement;
                          target.onerror = null;
                          target.src = NO_IMAGE_AVAILABLE_ICON;
                        }}
                      />
                      {prod.badge && (
                        <div className="absolute top-1.5 left-1.5 bg-emerald-600 text-white text-[7px] font-black px-1.5 py-0.5 rounded-md shadow-xs">
                          {prod.badge}
                        </div>
                      )}
                      {prod.featuredOnHome && (
                        <div className="absolute top-1.5 right-1.5 bg-amber-500 text-white text-[7px] font-black px-1.5 py-0.5 rounded-md shadow-xs flex items-center gap-0.5">
                          <Flame className="w-2.5 h-2.5" />
                          <span>হোম ফিচারে</span>
                        </div>
                      )}
                    </div>

                    <div className="p-2.5 space-y-1.5 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 
                          onClick={() => onViewProductDetail && onViewProductDetail(prod as any)}
                          className="text-[10px] font-black text-slate-900 line-clamp-2 leading-tight group-hover:text-amber-700 cursor-pointer"
                        >
                          {prod.nameBn}
                        </h4>
                        <p className="text-[8px] text-slate-500 font-mono mt-0.5">{prod.unit}</p>
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
                          onClick={() => onAddToCart && onAddToCart(prod as any, 1)}
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

        {/* TAB 2: PRODUCTS MANAGEMENT (Visibility & Promotion Rules) */}
        {activeTab === 'products_manage' && isOwner && (
          <div className="space-y-3">
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl text-[9px] text-amber-900 space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Flame className="w-4 h-4 text-amber-600" />
                <span>মনিটাইজেশন ও হোমপেজ ফিচার নিয়মাবলী</span>
              </div>
              <p className="leading-relaxed">
                আপনার আপলোডকৃত পণ্যগুলো তাৎক্ষণিকভাবে এই ব্যক্তিগত শপে গ্রাহকরা দেখতে পাবেন। হোমপেজের গ্লোবাল ফিডে প্রদর্শনের জন্য স্বল্প মূল্যে "হোমপেজে ফিচার" সুবিধা গ্রহণ করতে পারেন।
              </p>
            </div>

            <div className="space-y-2">
              {store.products.map((prod) => (
                <div key={prod.id} className="bg-white p-3 rounded-2xl border border-slate-200 flex items-center justify-between gap-3 shadow-2xs">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <img 
                      src={getProductPublicUrl(prod.image)} 
                      alt={prod.nameBn} 
                      className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        target.onerror = null;
                        target.src = NO_IMAGE_AVAILABLE_ICON;
                      }}
                    />
                    <div className="min-w-0">
                      <h4 className="text-[10px] font-black text-slate-900 truncate">{prod.nameBn}</h4>
                      <p className="text-[8.5px] text-emerald-700 font-bold">৳{prod.price} • স্টক: {prod.stock}টি</p>
                      <div className="flex items-center gap-1 mt-0.5">
                        <span className="text-[7.5px] bg-slate-100 text-slate-600 px-1 py-0.2 rounded-xs">
                          {prod.featuredOnHome ? '✓ হোমপেজে লাইভ' : 'ব্যক্তিগত শপে লাইভ'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    {prod.featuredOnHome ? (
                      <span className="text-[8px] font-black bg-emerald-100 text-emerald-800 px-2 py-1 rounded-lg">
                        ফিচারড একটিভ
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handlePromoteItem(prod.id, prod.nameBn)}
                        className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-[8.5px] font-black shadow-xs flex items-center gap-1 cursor-pointer active:scale-95"
                      >
                        <Flame className="w-3 h-3" />
                        <span>হোমে ফিচারড (৳৫০)</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 3: WALLET & 5% COMMISSION LEDGER */}
        {activeTab === 'orders_wallet' && isOwner && (
          <div className="space-y-3">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-4 rounded-2xl shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">উপলব্ধ ব্যালেন্স (নেট ৯৫%)</span>
                  <div className="text-xl font-black text-emerald-400 font-mono mt-0.5">৳৪,৫৮০.০০</div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowCashoutModal(true)}
                  className="px-3 py-1.5 bg-[#2EAA26] hover:bg-emerald-700 text-white rounded-xl text-[10px] font-black shadow-sm flex items-center gap-1 cursor-pointer active:scale-95"
                >
                  <Wallet className="w-3.5 h-3.5" />
                  <span>ক্যাশআউট</span>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-700 text-[9px]">
                <div>
                  <span className="text-slate-400">মোট বিক্রয়:</span>
                  <span className="font-bold text-white ml-1">৳৪,৮২০</span>
                </div>
                <div>
                  <span className="text-slate-400">৫% প্ল্যাটফর্ম ফি:</span>
                  <span className="font-bold text-amber-300 ml-1">-৳২৪০</span>
                </div>
              </div>
            </div>

            {/* Recent Orders List */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 space-y-2">
              <h4 className="text-[10px] font-black text-slate-900 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-amber-600" />
                <span>সাম্প্রতিক গ্রাহক অর্ডার ও এসক্রো রেকর্ড</span>
              </h4>

              <div className="space-y-1.5 text-[9px]">
                <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">অর্ডার #JM-9021 • ২x পাহাড়ি হলুদ</div>
                    <div className="text-slate-500 text-[8px]">গ্রাহক: তাসনিম (018****442) • খাগড়াছড়ি সদর</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-emerald-700">৳৩৬০.০০</div>
                    <div className="text-[7.5px] text-emerald-600 font-bold">সম্পন্ন (৯৫% পেইড)</div>
                  </div>
                </div>

                <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900">অর্ডার #JM-8812 • ১x পাহাড়ি চালের গুঁড়া</div>
                    <div className="text-slate-500 text-[8px]">গ্রাহক: মোজাম্মেল (017****889) • মহাজনপাড়া</div>
                  </div>
                  <div className="text-right">
                    <div className="font-black text-emerald-700">৳১২০.০০</div>
                    <div className="text-[7.5px] text-emerald-600 font-bold">সম্পন্ন (৯৫% পেইড)</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* ADD PRODUCT MODAL (INSIDE VIEW) */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-sm rounded-3xl p-4 space-y-3 max-h-[90vh] overflow-y-auto animate-scaleUp shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-amber-600" />
                <span>স্টোরফ্রন্টে নতুন পণ্য যোগ করুন</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[9.5px] font-bold text-slate-700 mb-0.5">পণ্যের নাম (বাংলা) *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="যেমন: পাহাড়ি জুমের খাঁটি আদা"
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9.5px] font-bold text-slate-700 mb-0.5">বিক্রয় মূল্য (৳) *</label>
                  <input
                    type="number"
                    required
                    value={newPrice}
                    onChange={(e) => setNewPrice(e.target.value)}
                    placeholder="৳ 200"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[9.5px] font-bold text-slate-700 mb-0.5">আসল মূল্য (৳)</label>
                  <input
                    type="number"
                    value={newOriginalPrice}
                    onChange={(e) => setNewOriginalPrice(e.target.value)}
                    placeholder="৳ 250"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[9.5px] font-bold text-slate-700 mb-0.5">পরিমাণ / ইউনিট *</label>
                  <input
                    type="text"
                    required
                    value={newUnit}
                    onChange={(e) => setNewUnit(e.target.value)}
                    placeholder="১ কেজি প্যাকেট"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[9.5px] font-bold text-slate-700 mb-0.5">স্টক পরিমাণ</label>
                  <input
                    type="number"
                    value={newStock}
                    onChange={(e) => setNewStock(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[9.5px] font-bold text-slate-700 mb-0.5">বিবরণ ও গুণাগুণ</label>
                <textarea
                  rows={2}
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  placeholder="পাহাড়ি নিজস্ব বাগান থেকে সংগৃহীত..."
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition"
                >
                  স্টোরফ্রন্টে পণ্য প্রকাশ করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CASHOUT MODAL */}
      {showCashoutModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3">
          <div className="bg-white w-full max-w-xs rounded-3xl p-4 space-y-3 animate-scaleUp shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="text-xs font-black text-slate-900 flex items-center gap-1.5">
                <Wallet className="w-4 h-4 text-[#2EAA26]" />
                <span>ব্যালেন্স ক্যাশআউট রিকোয়েস্ট</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowCashoutModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-full"
              >
                ✕
              </button>
            </div>

            {cashoutSuccess ? (
              <div className="text-center py-4 space-y-2">
                <CheckCircle2 className="w-10 h-10 text-[#2EAA26] mx-auto animate-bounce" />
                <h4 className="text-xs font-black text-slate-900">ক্যাশআউট রিকোয়েস্ট সফল!</h4>
                <p className="text-[9px] text-slate-500">আপনার {cashoutMethod} নম্বরে ২৪ ঘণ্টার মধ্যে টাকা পাঠিয়ে দেওয়া হবে।</p>
              </div>
            ) : (
              <form onSubmit={handleCashout} className="space-y-2.5 text-xs">
                <div>
                  <label className="block text-[9.5px] font-bold text-slate-700 mb-0.5">উত্তোলন পরিমাণ (সর্বোচ্চ ৳৪,৫৮০)</label>
                  <input
                    type="number"
                    required
                    max={4580}
                    value={cashoutAmount}
                    onChange={(e) => setCashoutAmount(e.target.value)}
                    placeholder="৳ 1000"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>

                <div>
                  <label className="block text-[9.5px] font-bold text-slate-700 mb-0.5">পেমেন্ট মেথড</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCashoutMethod('bKash')}
                      className={`py-1.5 rounded-xl text-[10px] font-bold border transition ${
                        cashoutMethod === 'bKash' ? 'bg-pink-50 border-pink-500 text-pink-700' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      বিকাশ (bKash)
                    </button>
                    <button
                      type="button"
                      onClick={() => setCashoutMethod('Nagad')}
                      className={`py-1.5 rounded-xl text-[10px] font-bold border transition ${
                        cashoutMethod === 'Nagad' ? 'bg-orange-50 border-orange-500 text-orange-700' : 'bg-slate-50 border-slate-200'
                      }`}
                    >
                      নগদ (Nagad)
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[9.5px] font-bold text-slate-700 mb-0.5">{cashoutMethod} অ্যাকাউন্ট নম্বর *</label>
                  <input
                    type="tel"
                    required
                    value={cashoutNumber}
                    onChange={(e) => setCashoutNumber(e.target.value)}
                    placeholder="01XXXXXXXXX"
                    className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                  />
                </div>

                <div className="pt-2">
                  <button
                    type="submit"
                    className="w-full py-2.5 bg-[#2EAA26] hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md cursor-pointer transition"
                  >
                    ক্যাশআউট কনফার্ম করুন
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
