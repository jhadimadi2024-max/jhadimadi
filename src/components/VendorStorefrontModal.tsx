import React, { useState, useMemo } from 'react';
import { 
  X, Store, Star, MapPin, ShieldCheck, ShoppingBag, 
  Search, Filter, Plus, Phone, MessageSquare, Award, 
  Truck, CheckCircle2, ChevronRight, ArrowLeft, Heart, 
  Sparkles, DollarSign, Wallet, ArrowDownRight, Clock, 
  Layers, Package, Share2, Eye, QrCode, AlertCircle
} from 'lucide-react';
import { VendorStore, VendorStoreProduct, VendorEscrowSettlement, VendorCashoutTransaction } from '../data/vendorsData';
import { Language, getTranslation } from '../utils/translations';
import { maskPhoneNumber } from '../utils/uniqueIdGenerator';
import { getProductPublicUrl } from '../utils/directSupabaseStorage';
import { NO_IMAGE_AVAILABLE_ICON } from '../constants/imageConstants';

interface VendorStorefrontModalProps {
  isOpen: boolean;
  vendor: VendorStore | null;
  onClose: () => void;
  onSelectProduct?: (product: VendorStoreProduct) => void;
  onAddToCart: (product: VendorStoreProduct, qty?: number) => void;
  onBuyNow?: (product: VendorStoreProduct, qty?: number) => void;
  onOpenAddProductModal?: (vendorId: string) => void;
  lang?: Language;
  isOwner?: boolean;
}

export const VendorStorefrontModal: React.FC<VendorStorefrontModalProps> = ({
  isOpen,
  vendor,
  onClose,
  onSelectProduct,
  onAddToCart,
  onBuyNow,
  onOpenAddProductModal,
  lang = 'bn',
  isOwner = false,
}) => {
  const [activeTab, setActiveTab] = useState<'products' | 'top_selling' | 'about' | 'reviews' | 'wallet'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(vendor?.followersCount || 1280);
  const [showWalletCashoutModal, setShowWalletCashoutModal] = useState(false);
  const [cashoutAmount, setCashoutAmount] = useState('');
  const [cashoutMethod, setCashoutMethod] = useState<'bKash' | 'Nagad' | 'Bank'>('bKash');
  const [cashoutAccount, setCashoutAccount] = useState('');
  const [cashoutSuccessToast, setCashoutSuccessToast] = useState('');

  const t = getTranslation(lang);

  if (!isOpen || !vendor) return null;

  const handleFollowToggle = () => {
    if (isFollowing) {
      setIsFollowing(false);
      setFollowersCount(prev => Math.max(0, prev - 1));
    } else {
      setIsFollowing(true);
      setFollowersCount(prev => prev + 1);
    }
  };

  const handleCashoutSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(cashoutAmount);
    if (!amountNum || amountNum <= 0) {
      alert(lang === 'bn' ? 'অনুগ্রহ করে সঠিক ক্যাশআউট এমাউন্ট লিখুন।' : 'Please enter a valid amount.');
      return;
    }
    if (amountNum > vendor.wallet.availableBalance) {
      alert(lang === 'bn' ? 'অপর্যাপ্ত ব্যালেন্স! আপনার মোট ৯৫% নেট ব্যালেন্স ৳' + vendor.wallet.availableBalance : 'Insufficient balance!');
      return;
    }
    if (!cashoutAccount.trim()) {
      alert(lang === 'bn' ? 'একাউন্ট বা মোবাইল ব্যাংকিং নম্বর দিন।' : 'Please provide account number.');
      return;
    }

    setCashoutSuccessToast(
      lang === 'bn'
        ? `৳${amountNum} টাকার ক্যাশআউট রিকোয়েস্ট সফল হয়েছে! ৩ ঘণ্টার মধ্যে ${cashoutMethod} একাউন্টে (${cashoutAccount}) পৌঁছে যাবে।`
        : `Cashout request for ৳${amountNum} placed successfully!`
    );
    setShowWalletCashoutModal(false);
    setCashoutAmount('');
    setTimeout(() => setCashoutSuccessToast(''), 4500);
  };

  // Filter products by search and category
  const filteredProducts = vendor.products.filter(p => {
    const matchesSearch = 
      p.nameBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.badge && p.badge.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategoryFilter === 'all' || p.category === selectedCategoryFilter;
    const matchesTopSelling = activeTab === 'top_selling' ? (p.rating >= 4.9 || p.reviewsCount > 50) : true;

    return matchesSearch && matchesCategory && matchesTopSelling;
  });

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-slate-50 w-full max-w-2xl max-h-[94vh] rounded-3xl overflow-hidden shadow-2xl flex flex-col relative animate-in fade-in zoom-in-95 duration-200">
        
        {/* Top Header & Sticky Navigation */}
        <div className="relative bg-slate-900 text-white shrink-0">
          {/* Banner Image */}
          <div className="relative h-28 sm:h-36 w-full overflow-hidden">
            <img 
              src={vendor.banner} 
              alt={vendor.shopName} 
              className="w-full h-full object-cover brightness-75"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />

            {/* Top Action Buttons */}
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-10">
              <span className="bg-emerald-600/90 text-white font-mono font-black text-[9px] px-2.5 py-1 rounded-full backdrop-blur-md flex items-center gap-1 shadow-md">
                <ShieldCheck className="w-3 h-3 text-emerald-200" />
                {vendor.uniqueId}
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center cursor-pointer transition-transform active:scale-90 shadow-md"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Store Info Card Overlay */}
          <div className="px-4 pb-3 pt-1 -mt-10 sm:-mt-12 relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="flex items-start sm:items-end gap-3">
              <div className="relative shrink-0">
                <img 
                  src={vendor.avatar} 
                  alt={vendor.shopName} 
                  className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-white shadow-xl bg-white"
                />
                {vendor.isVerified && (
                  <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white rounded-full p-1 shadow-md" title="ভেরিফাইড মার্চেন্ট">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  </div>
                )}
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <h2 className="text-sm sm:text-base font-black text-white leading-tight">
                    {vendor.shopName}
                  </h2>
                  <span className="bg-emerald-500/20 text-emerald-300 text-[8px] font-bold px-2 py-0.5 rounded-md border border-emerald-400/30 shrink-0">
                    {vendor.verifiedBadgeText}
                  </span>
                </div>

                <p className="text-[10px] text-gray-300 flex items-center gap-1 mt-0.5">
                  <Store className="w-2.5 h-2.5 text-amber-400" /> মালিক: {vendor.ownerName}
                </p>

                <p className="text-[9.5px] text-emerald-300 font-semibold flex items-center gap-1 mt-0.5">
                  <MapPin className="w-2.5 h-2.5 text-emerald-400 shrink-0" />
                  <span>{vendor.district} ➔ {vendor.upazila} ({vendor.mahalla})</span>
                </p>
              </div>
            </div>

            {/* Quick Action Button (Follow / Add Product) */}
            <div className="flex items-center gap-2 shrink-0">
              {onOpenAddProductModal && (
                <button
                  type="button"
                  onClick={() => onOpenAddProductModal(vendor.id)}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-[9.5px] font-black px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>পণ্য যোগ করুন</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleFollowToggle}
                className={`text-[9.5px] font-black px-3 py-1.5 rounded-xl shadow-md flex items-center gap-1 active:scale-95 transition-all cursor-pointer ${
                  isFollowing 
                    ? 'bg-white/20 text-white border border-white/30' 
                    : 'bg-amber-400 hover:bg-amber-300 text-slate-950 font-black'
                }`}
              >
                <Heart className={`w-3 h-3 ${isFollowing ? 'fill-red-500 text-red-500' : ''}`} />
                <span>{isFollowing ? 'ফলো করা আছে' : 'দোকান ফলো করুন'} ({followersCount})</span>
              </button>
            </div>
          </div>

          {/* Performance & Micro-Location Metric Badges */}
          <div className="grid grid-cols-4 gap-1 px-4 py-2 bg-slate-950/80 border-t border-white/10 text-center text-white">
            <div className="p-1">
              <div className="text-[11px] font-black text-amber-400 flex items-center justify-center gap-0.5">
                <Star className="w-2.5 h-2.5 fill-amber-400" />
                {vendor.rating}
              </div>
              <p className="text-[7.5px] text-gray-400">রেটিং ({vendor.reviewsCount})</p>
            </div>

            <div className="p-1 border-l border-white/10">
              <div className="text-[11px] font-black text-emerald-400">{vendor.positiveRatingPercent}%</div>
              <p className="text-[7.5px] text-gray-400">পজেটিভ রেটিং</p>
            </div>

            <div className="p-1 border-l border-white/10">
              <div className="text-[11px] font-black text-blue-400">{vendor.shipOnTimePercent}%</div>
              <p className="text-[7.5px] text-gray-400">অন-টাইম শিপিং</p>
            </div>

            <div className="p-1 border-l border-white/10">
              <div className="text-[11px] font-black text-purple-400">{vendor.products.length} টি</div>
              <p className="text-[7.5px] text-gray-400">স্টোর পণ্য</p>
            </div>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="bg-white border-b border-gray-200 px-3 py-1 flex items-center justify-between gap-1 overflow-x-auto scrollbar-none shrink-0 shadow-2xs">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab('products')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1 cursor-pointer transition-all ${
                activeTab === 'products'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Package className="w-3 h-3" />
              <span>সকল পণ্য ({vendor.products.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('top_selling')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1 cursor-pointer transition-all ${
                activeTab === 'top_selling'
                  ? 'bg-amber-600 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Sparkles className="w-3 h-3" />
              <span>টপ সেলিং</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('about')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1 cursor-pointer transition-all ${
                activeTab === 'about'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Store className="w-3 h-3" />
              <span>দোকানের বিবরণ ও লাইসেন্স</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('reviews')}
              className={`px-3 py-1.5 rounded-xl text-[10px] font-black flex items-center gap-1 cursor-pointer transition-all ${
                activeTab === 'reviews'
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Star className="w-3 h-3" />
              <span>রিভিউ ({vendor.reviewsCount})</span>
            </button>
          </div>

          {/* 5% Escrow Wallet Tab (Seller Dashboard) */}
          <button
            type="button"
            onClick={() => setActiveTab('wallet')}
            className={`px-2.5 py-1.5 rounded-xl text-[9.5px] font-black flex items-center gap-1 cursor-pointer transition-all shrink-0 ${
              activeTab === 'wallet'
                ? 'bg-slate-900 text-amber-300 shadow-xs'
                : 'bg-amber-50 text-amber-900 border border-amber-200 hover:bg-amber-100'
            }`}
          >
            <Wallet className="w-3 h-3 text-amber-600" />
            <span>এসক্রো ওয়ালেট (৫% কমিশন)</span>
          </button>
        </div>

        {/* Toast alert */}
        {cashoutSuccessToast && (
          <div className="bg-emerald-600 text-white text-[10px] font-bold p-2 text-center animate-in fade-in">
            {cashoutSuccessToast}
          </div>
        )}

        {/* Tab Body Contents */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
          
          {/* TAB 1 & 2: Store Products Grid & Search */}
          {(activeTab === 'products' || activeTab === 'top_selling') && (
            <div className="space-y-3">
              
              {/* In-Store Search Bar */}
              <div className="bg-white p-2 rounded-2xl border border-gray-200 shadow-2xs flex items-center gap-2">
                <Search className="w-3.5 h-3.5 text-gray-400 shrink-0 ml-1" />
                <input 
                  type="text"
                  placeholder={`${vendor.shopName}-এর পণ্য খুঁজুন...`}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full text-[10.5px] bg-transparent outline-hidden font-medium text-gray-800 placeholder-gray-400"
                />
                {searchQuery && (
                  <button 
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Escrow Guarantee Statement Banner */}
              <div className="bg-gradient-to-r from-emerald-50 via-teal-50 to-emerald-100 border border-emerald-200 p-2.5 rounded-2xl flex items-center gap-2.5 shadow-2xs">
                <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-[10px] font-black text-emerald-950 flex items-center gap-1">
                    ঝাদিমাদি ইন-অ্যাপ এসক্রো পেমেন্ট সুরক্ষা
                  </h4>
                  <p className="text-[8.5px] text-emerald-800 leading-tight mt-0.5">
                    সরাসরি ক্যাশ বা অফ-প্ল্যাটফর্ম লেনদেন নিষিদ্ধ। ডেলিভারি নিশ্চিত হওয়ার আগে অর্থ নিরাপদে সেন্ট্রাল এসক্রোতে জমা থাকে।
                  </p>
                </div>
              </div>

              {/* Product Grid */}
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {filteredProducts.map((prod) => {
                    const discount = Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100);
                    return (
                      <div
                        key={prod.id}
                        onClick={() => onSelectProduct(prod)}
                        className="bg-white rounded-2xl border border-gray-200 hover:border-emerald-400 shadow-2xs hover:shadow-md transition-all overflow-hidden flex flex-col cursor-pointer group"
                      >
                        {/* Product Image & Badges */}
                        <div className="relative h-32 sm:h-36 w-full bg-slate-100 overflow-hidden">
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
                            <span className={`absolute top-2 left-2 ${prod.badgeColor || 'bg-emerald-600'} text-white text-[7.5px] font-black px-1.5 py-0.5 rounded-md shadow-xs`}>
                              {prod.badge}
                            </span>
                          )}
                          {discount > 0 && (
                            <span className="absolute top-2 right-2 bg-red-600 text-white text-[7.5px] font-black px-1.5 py-0.5 rounded-md shadow-xs">
                              {discount}% OFF
                            </span>
                          )}
                        </div>

                        {/* Product Details */}
                        <div className="p-2.5 flex-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-1 text-[7.5px] text-gray-500 mb-0.5">
                              <MapPin className="w-2.5 h-2.5 text-gray-400" />
                              <span className="truncate">{prod.origin}</span>
                            </div>
                            <h4 className="text-[10px] font-black text-gray-900 line-clamp-2 leading-tight group-hover:text-emerald-700 transition-colors">
                              {prod.nameBn}
                            </h4>
                          </div>

                          <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
                            <div>
                              <div className="text-[12px] font-black text-emerald-700">
                                ৳{prod.price}
                              </div>
                              {prod.originalPrice > prod.price && (
                                <div className="text-[8px] text-gray-400 line-through">
                                  ৳{prod.originalPrice}
                                </div>
                              )}
                            </div>

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                onAddToCart(prod);
                              }}
                              className="w-7 h-7 rounded-xl bg-emerald-50 hover:bg-emerald-600 text-emerald-700 hover:text-white flex items-center justify-center transition-colors cursor-pointer shadow-2xs"
                              title="কার্টে যোগ করুন"
                            >
                              <ShoppingBag className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white p-8 rounded-3xl border border-gray-200 text-center space-y-2">
                  <Package className="w-8 h-8 text-gray-300 mx-auto" />
                  <p className="text-xs font-bold text-gray-600">কোনো পণ্য পাওয়া যায়নি।</p>
                  <p className="text-[9px] text-gray-400">অন্য কোনো নাম বা ফিল্টার দিয়ে চেষ্টা করুন।</p>
                </div>
              )}

            </div>
          )}

          {/* TAB 3: About & Trade License Verification */}
          {activeTab === 'about' && (
            <div className="space-y-3">
              {/* Store Details Card */}
              <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-2xs space-y-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black text-gray-900">দোকানের প্রাতিষ্ঠানিক বিবরণ</h3>
                    <p className="text-[8.5px] text-gray-500">প্রতিষ্ঠিত: {vendor.establishedYear}</p>
                  </div>
                </div>

                <p className="text-[10px] text-gray-700 leading-relaxed">
                  {vendor.aboutBn}
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-gray-100 text-[9.5px]">
                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-gray-500 font-bold block text-[8px]">ট্রেড লাইসেন্স নম্বর:</span>
                    <span className="font-mono font-black text-gray-900">{vendor.tradeLicenseNumber}</span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-gray-500 font-bold block text-[8px]">মালিকের এনআইডি স্ট্যাটাস:</span>
                    <span className="font-mono font-black text-emerald-700">{vendor.nidNumberMasked} (ভেরিফাইড [✓])</span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-gray-500 font-bold block text-[8px]">দোকানের সঠিক ঠিকানা:</span>
                    <span className="font-bold text-gray-900">{vendor.detailedAddress}</span>
                  </div>

                  <div className="bg-slate-50 p-2 rounded-xl">
                    <span className="text-gray-500 font-bold block text-[8px]">পণ্য ক্যাটাগরিসমূহ:</span>
                    <span className="font-bold text-gray-800">{vendor.categories.join(', ')}</span>
                  </div>
                </div>
              </div>

              {/* Privacy Notice on Phone and Address */}
              <div className="bg-amber-50 border border-amber-200 p-3 rounded-2xl flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div className="text-[9px] text-amber-950">
                  <strong className="block text-[10px] font-black mb-0.5">গ্রাহক ও বিক্রেতা সুরক্ষা নীতিমালা</strong>
                  অর্ডার প্লেস ও এসক্রো কনফার্মেশনের পূর্বে বিক্রেতার সঠিক ফোন নম্বর ও ব্যক্তিগত তথ্য সুরক্ষিত থাকে। সকল যোগাযোগ ঝাদিমাদির ইন-অ্যাপ চ্যাট বা কনফার্মড অর্ডারের মাধ্যমে সম্পন্ন করুন।
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: Customer Reviews */}
          {activeTab === 'reviews' && (
            <div className="space-y-3">
              <div className="bg-white p-4 rounded-3xl border border-gray-200 shadow-2xs space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                  <div className="flex items-center gap-2">
                    <div className="text-2xl font-black text-amber-500">{vendor.rating}</div>
                    <div>
                      <div className="flex items-center text-amber-400">
                        {'★'.repeat(5)}
                      </div>
                      <p className="text-[8.5px] text-gray-500">{vendor.reviewsCount} টি যাচাইকৃত ক্রেতার রিভিউ</p>
                    </div>
                  </div>
                  <span className="bg-emerald-50 text-emerald-800 text-[8.5px] font-black px-2.5 py-1 rounded-xl border border-emerald-200">
                    ৯৮% সন্তুষ্টি রেটিং
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="bg-slate-50 p-2.5 rounded-2xl">
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="font-black text-gray-900">তানজিনা আক্তার (ঢাকা)</span>
                      <span className="text-gray-400">৩ দিন আগে</span>
                    </div>
                    <div className="flex text-amber-400 text-[8px] my-0.5">★★★★★</div>
                    <p className="text-[9px] text-gray-600">খাগড়াছড়ির চালের গুঁড়া ও শুঁটকির মান অসাধারণ ছিল। প্যাকেজিং খুব ভালো হয়েছে।</p>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-2xl">
                    <div className="flex items-center justify-between text-[9px]">
                      <span className="font-black text-gray-900">ড. কামাল হোসেন (চট্টগ্রাম)</span>
                      <span className="text-gray-400">১ সপ্তাহ আগে</span>
                    </div>
                    <div className="flex text-amber-400 text-[8px] my-0.5">★★★★★</div>
                    <p className="text-[9px] text-gray-600">আসল পাহাড়ি কাঁচা মধু। পানিতে পরীক্ষা করে দেখেছি কোনো চিনি মেশানো নেই। ধন্যবাদ বিক্রেতাকে!</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: Vendor Escrow Wallet & 5% Platform Commission System */}
          {activeTab === 'wallet' && (
            <div className="space-y-3">
              
              {/* Earnings Overview Card */}
              <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 text-white p-4 rounded-3xl shadow-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-slate-950 flex items-center justify-center font-black">
                      <DollarSign className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-xs font-black text-amber-300">মার্চেন্ট আর্থিক ওয়ালেট</h3>
                      <p className="text-[8px] text-gray-300">ঝাদিমাদি ৫% স্বয়ংক্রিয় কমিশন ও ৯৫% নেট সেটেলমেন্ট</p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setShowWalletCashoutModal(true)}
                    className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-[9.5px] font-black px-3.5 py-1.5 rounded-xl shadow-md flex items-center gap-1 active:scale-95 transition-transform cursor-pointer"
                  >
                    <ArrowDownRight className="w-3.5 h-3.5" />
                    <span>ক্যাশআউট রিকোয়েস্ট</span>
                  </button>
                </div>

                {/* Wallet Balance Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-white/10">
                  <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-xs">
                    <span className="text-[7.5px] text-gray-300 block font-bold">মোট গ্রস বিক্রি</span>
                    <span className="text-xs sm:text-sm font-black text-white">৳{vendor.wallet.grossSales.toLocaleString()}</span>
                  </div>

                  <div className="bg-white/10 p-2.5 rounded-2xl backdrop-blur-xs">
                    <span className="text-[7.5px] text-amber-300 block font-bold">ঝাদিমাদি ৫% প্ল্যাটফর্ম ফি</span>
                    <span className="text-xs sm:text-sm font-black text-amber-400">৳{vendor.wallet.totalCommissionPaid.toLocaleString()}</span>
                  </div>

                  <div className="bg-emerald-500/20 border border-emerald-400/40 p-2.5 rounded-2xl backdrop-blur-xs">
                    <span className="text-[7.5px] text-emerald-300 block font-bold">৯৫% নেট উপলব্ধ ব্যালেন্স</span>
                    <span className="text-xs sm:text-sm font-black text-emerald-400">৳{vendor.wallet.availableBalance.toLocaleString()}</span>
                  </div>

                  <div className="bg-blue-500/20 border border-blue-400/40 p-2.5 rounded-2xl backdrop-blur-xs">
                    <span className="text-[7.5px] text-blue-300 block font-bold">চলমান এসক্রো তহবিল</span>
                    <span className="text-xs sm:text-sm font-black text-blue-300">৳{vendor.wallet.pendingEscrowBalance.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Escrow Settlement Table */}
              <div className="bg-white p-3.5 rounded-3xl border border-gray-200 shadow-2xs space-y-2.5">
                <h4 className="text-[10.5px] font-black text-gray-900 flex items-center justify-between">
                  <span>সাম্প্রতিক এসক্রো অর্ডার ও ৫% কমিশন সেটেলমেন্ট</span>
                  <span className="text-[8px] font-bold text-gray-500">স্বয়ংক্রিয় হিসাব</span>
                </h4>

                <div className="space-y-1.5">
                  {vendor.wallet.escrowSettlements.map((esc) => (
                    <div key={esc.id} className="p-2 bg-slate-50 rounded-2xl border border-gray-200/70 flex items-center justify-between text-[9px] gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono font-black text-emerald-700">{esc.orderId}</span>
                          <span className={`text-[7.5px] font-bold px-1.5 py-0.2 rounded-md ${
                            esc.status === 'Delivered_Settled' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {esc.status === 'Delivered_Settled' ? 'ডেলিভারি সম্পন্ন (৯৫% জমা)' : 'এসক্রোতে রক্ষিত'}
                          </span>
                        </div>
                        <p className="font-bold text-gray-800 truncate">{esc.productName}</p>
                        <p className="text-[8px] text-gray-500">ক্রেতা: {esc.customerName} ({esc.customerPhoneMasked})</p>
                      </div>

                      <div className="text-right shrink-0">
                        <div className="font-black text-gray-900">৳{esc.grossAmount}</div>
                        <div className="text-[7.5px] text-amber-700 font-bold">-৫% ফি: ৳{esc.platformFee5Percent}</div>
                        <div className="text-[8px] text-emerald-700 font-black">নেট: ৳{esc.netPayout95Percent}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Cashout History */}
              <div className="bg-white p-3.5 rounded-3xl border border-gray-200 shadow-2xs space-y-2">
                <h4 className="text-[10.5px] font-black text-gray-900">ক্যাশআউট ট্রানজেকশন হিস্ট্রি</h4>
                <div className="space-y-1.5">
                  {vendor.wallet.cashouts.map((csh) => (
                    <div key={csh.id} className="p-2 bg-slate-50 rounded-2xl border border-gray-100 flex items-center justify-between text-[9px]">
                      <div>
                        <div className="font-black text-gray-900">{csh.method} ({csh.accountNumber})</div>
                        <div className="text-[7.5px] text-gray-400 font-mono">TrxID: {csh.trxId} • {csh.date}</div>
                      </div>
                      <div className="text-right">
                        <div className="font-black text-emerald-700">৳{csh.amount.toLocaleString()}</div>
                        <span className="text-[7.5px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded-md">
                          {csh.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Cashout Modal */}
        {showWalletCashoutModal && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-3">
            <div className="bg-white w-full max-w-sm rounded-3xl p-4 shadow-2xl space-y-3 animate-in zoom-in-95">
              <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                <h3 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                  <ArrowDownRight className="w-4 h-4 text-emerald-600" />
                  ওয়ালেট ক্যাশআউট রিকোয়েস্ট
                </h3>
                <button 
                  type="button"
                  onClick={() => setShowWalletCashoutModal(false)}
                  className="w-6 h-6 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center"
                >
                  <X className="w-3 h-3 text-gray-600" />
                </button>
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-2xl text-[9.5px]">
                <div className="flex justify-between text-gray-600">
                  <span>উপলব্ধ নেট ব্যালেন্স (৯৫%):</span>
                  <strong className="text-emerald-700 font-black">৳{vendor.wallet.availableBalance.toLocaleString()}</strong>
                </div>
              </div>

              <form onSubmit={handleCashoutSubmit} className="space-y-2.5">
                <div>
                  <label className="block text-[8.5px] font-black text-gray-700 mb-1">ক্যাশআউট মেথড নির্বাচন করুন</label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(['bKash', 'Nagad', 'Bank'] as const).map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setCashoutMethod(m)}
                        className={`py-1.5 rounded-xl text-[9.5px] font-black border transition-all cursor-pointer ${
                          cashoutMethod === m
                            ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                            : 'bg-white text-gray-700 border-gray-200'
                        }`}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[8.5px] font-black text-gray-700 mb-1">একাউন্ট / মোবাইল নম্বর</label>
                  <input 
                    type="text"
                    placeholder="018XXXXXXXX বা ব্যাংক একাউন্ট নম্বর"
                    value={cashoutAccount}
                    onChange={(e) => setCashoutAccount(e.target.value)}
                    required
                    className="w-full text-[10px] p-2 bg-slate-50 border border-gray-200 rounded-xl font-medium outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[8.5px] font-black text-gray-700 mb-1">টাকার পরিমাণ (৳)</label>
                  <input 
                    type="number"
                    placeholder="উদাঃ 5000"
                    value={cashoutAmount}
                    onChange={(e) => setCashoutAmount(e.target.value)}
                    max={vendor.wallet.availableBalance}
                    min={100}
                    required
                    className="w-full text-[10px] p-2 bg-slate-50 border border-gray-200 rounded-xl font-medium outline-hidden focus:border-emerald-500"
                  />
                </div>

                <div className="pt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowWalletCashoutModal(false)}
                    className="flex-1 py-2 rounded-xl text-[10px] font-bold text-gray-600 bg-gray-100 hover:bg-gray-200 cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 rounded-xl text-[10px] font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-md cursor-pointer"
                  >
                    রিকোয়েস্ট পাঠান
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
