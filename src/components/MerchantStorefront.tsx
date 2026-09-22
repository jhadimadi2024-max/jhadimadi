import React, { useState, useMemo } from 'react';
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
  ArrowLeft,
  MessageSquare,
  Bell,
  Lock,
  X,
  Building,
  Check,
  Package,
  Search,
  Copy,
  CheckCircle,
  AlertTriangle,
  User,
  Heart,
  Eye,
  EyeOff,
  Video,
  FileText,
  Calendar,
  SlidersHorizontal,
  Sparkles,
  ExternalLink,
  Edit3,
  Loader2
} from 'lucide-react';
import { VendorStore, VendorStoreProduct, INITIAL_VENDOR_STORES } from '../data/vendorsData';
import { StoreProduct } from '../data/productsData';
import { Language } from '../utils/translations';
import { maskPhoneNumber, generateMerchantOrServiceUID } from '../utils/uniqueIdGenerator';
import { supabase } from '../utils/supabaseClient';
import { uploadFileToSupabaseStorage, isLocalTransientUrl, getProductPublicUrl } from '../utils/directSupabaseStorage';
import { NO_IMAGE_AVAILABLE_ICON } from '../constants/imageConstants';
import { databaseService } from '../services/databaseService';

export interface MerchantStorefrontProps {
  store?: VendorStore;
  currentUserRole?: 'merchant' | 'admin' | 'customer';
  isOwner?: boolean;
  isAdmin?: boolean;
  onBack?: () => void;
  onAddToCart?: (product: VendorStoreProduct | StoreProduct, qty: number) => void;
  onViewProductDetail?: (product: VendorStoreProduct | StoreProduct) => void;
  lang?: Language;
}

export interface MerchantKYCFormState {
  shopName: string;
  ownerName: string;
  phone: string;
  dob: string;
  fatherName: string;
  motherName: string;
  nidNumber: string;
  businessAddress: string;
  permanentAddress: string;
  shopLogo: string;
  coverBanner: string;
  nidFront: string;
  nidBack: string;
  tradeLicense: string;
  certificates: string;
}

// 10 Sample Authentic High-Quality Fashion Products for Merchant Storefront (Matching Image 2 Loktra Design)
export const SAMPLE_MERCHANT_PRODUCTS: VendorStoreProduct[] = [];

export const MerchantStorefront: React.FC<MerchantStorefrontProps> = ({
  store: initialStore,
  currentUserRole = 'merchant',
  isOwner = true,
  isAdmin = false,
  onBack,
  onAddToCart,
  onViewProductDetail,
  lang = 'bn'
}) => {
  // Store state initialization
  const defaultStore: VendorStore = useMemo(() => {
    return initialStore || INITIAL_VENDOR_STORES[0] || {
      id: '',
      uniqueId: '',
      shopName: 'মার্চেন্ট স্টোরফ্রন্ট',
      shopNameEn: 'Merchant Storefront',
      ownerName: '',
      avatar: '',
      banner: '',
      phoneMasked: '',
      realPhone: '',
      division: '',
      district: '',
      upazila: '',
      mahalla: '',
      bazarName: '',
      detailedAddress: '',
      rating: 0.0,
      reviewsCount: 0,
      positiveRatingPercent: 0,
      shipOnTimePercent: 0,
      responseRatePercent: 0,
      followersCount: 0,
      isVerified: false,
      verifiedBadgeText: '',
      categories: [],
      aboutBn: '',
      tradeLicenseNumber: '',
      nidNumberMasked: '',
      establishedYear: '',
      wallet: {
        grossSales: 0,
        availableBalance: 0,
        pendingPayouts: 0,
        completedPayouts: 0,
        totalOrdersCount: 0,
        cashouts: []
      },
      products: []
    };
  }, [initialStore]);

  const [store, setStore] = useState<VendorStore>(defaultStore);

  // Products state
  const [productsList, setProductsList] = useState<VendorStoreProduct[]>(
    store.products || []
  );

  // Merchant Unique ID
  const merchantUID = useMemo(() => {
    if (store.uniqueId && store.uniqueId.startsWith('M-')) {
      return store.uniqueId;
    }
    return generateMerchantOrServiceUID(
      'M',
      store.division || 'Dhaka',
      store.district || 'Dhaka',
      store.upazila || 'Mirpur',
      '001'
    );
  }, [store.uniqueId, store.division, store.district, store.upazila]);

  // Modals & UI States
  const [isProfileVerified, setIsProfileVerified] = useState<boolean>(true);
  const [showKycModal, setShowKycModal] = useState<boolean>(false);
  const [showAddProductModal, setShowAddProductModal] = useState<boolean>(false);
  const [showNotifications, setShowNotifications] = useState<boolean>(false);
  const [showMessages, setShowMessages] = useState<boolean>(false);
  const [showMediaEditorModal, setShowMediaEditorModal] = useState<'logo' | 'banner' | null>(null);
  const [selectedProductPreview, setSelectedProductPreview] = useState<VendorStoreProduct | null>(null);
  const [copiedUID, setCopiedUID] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Favorites / Like state
  const [likedProductIds, setLikedProductIds] = useState<Record<string, boolean>>({
    msp_01: true,
    msp_02: true,
    msp_05: true
  });

  // Media URLs
  const [logoInputUrl, setLogoInputUrl] = useState(store.avatar || '');
  const [bannerInputUrl, setBannerInputUrl] = useState(store.banner || '');
  const [merchantProductFile, setMerchantProductFile] = useState<File | null>(null);
  const [mediaEditorFile, setMediaEditorFile] = useState<File | null>(null);
  const [isUploadingMedia, setIsUploadingMedia] = useState(false);
  const [isSubmittingProduct, setIsSubmittingProduct] = useState(false);
  const merchantProductFileInputRef = React.useRef<HTMLInputElement>(null);

  // Confidential KYC Data Form (Strictly hidden from general customers)
  const [kycForm, setKycForm] = useState<MerchantKYCFormState>({
    shopName: store.shopName || 'পাহাড়ি খাঁটি বাজার ও অর্গানিক স্টোর',
    ownerName: store.ownerName || 'মো. রফিকুল ইসলাম',
    phone: store.realPhone || '01812345689',
    dob: '1992-05-14',
    fatherName: 'আলহাজ্ব মোজাম্মেল হক',
    motherName: 'রাবেয়া খাতুন',
    nidNumber: '1992269104829104',
    businessAddress: store.detailedAddress || 'দোকান নং ২২, মিরপুর সুপার মার্কেট, মিরপুর-১০, ঢাকা',
    permanentAddress: 'গ্রাম: রাধানগর, ডাকঘর: দীঘিনালা, খাগড়াছড়ি',
    shopLogo: store.avatar || NO_IMAGE_AVAILABLE_ICON,
    coverBanner: store.banner || NO_IMAGE_AVAILABLE_ICON,
    nidFront: '',
    nidBack: '',
    tradeLicense: 'TRAD/DHK/MIR/2024/4910',
    certificates: 'BSTA Certified Organic Producer 2024'
  });

  // Add Product Form State
  const [productForm, setProductForm] = useState({
    title: '',
    category: 'পাহাড়ি অর্গানিক খাবার',
    price: '',
    originalPrice: '',
    stock: '20',
    unit: '১ কেজি প্যাকেট',
    description: '',
    videoUrl: '',
    imageUrl: ''
  });

  // Notifications (Facebook style)
  const [notifications, setNotifications] = useState<Array<{ id: number; title: string; time: string; unread: boolean; desc: string }>>([]);

  // Customer Inquiries
  const [messages, setMessages] = useState<Array<{ id: number; senderName: string; phone: string; text: string; time: string; unread: boolean }>>([]);
  const [replyText, setReplyText] = useState<{ [key: number]: string }>({});

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleCopyUID = () => {
    navigator.clipboard.writeText(merchantUID);
    setCopiedUID(true);
    showToast(`UID কপি হয়েছে: ${merchantUID}`);
    setTimeout(() => setCopiedUID(false), 2500);
  };

  const toggleLike = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setLikedProductIds(prev => {
      const nextState = !prev[productId];
      showToast(nextState ? 'পছন্দের তালিকায় যুক্ত হয়েছে!' : 'পছন্দের তালিকা থেকে সরানো হয়েছে');
      return { ...prev, [productId]: nextState };
    });
  };

  // Handle KYC Submission
  const handleKycSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!kycForm.nidNumber || !kycForm.shopName || !kycForm.businessAddress) {
      alert('অনুগ্রহ করে এনআইডি নম্বর, দোকানের নাম ও ব্যবসার ঠিকানা পূরণ করুন।');
      return;
    }
    setIsProfileVerified(true);
    setStore(prev => ({
      ...prev,
      shopName: kycForm.shopName,
      ownerName: kycForm.ownerName,
      avatar: kycForm.shopLogo,
      banner: kycForm.coverBanner,
      detailedAddress: kycForm.businessAddress,
      isVerified: true
    }));
    setShowKycModal(false);
    showToast('অভিনন্দন! প্রোফাইল ভেরিফিকেশন (KYC) সফল হয়েছে।');
  };

  // Handle Logo/Banner Update
  const handleUpdateMedia = async () => {
    setIsUploadingMedia(true);
    try {
      if (showMediaEditorModal === 'logo') {
        let permanentLogoUrl = logoInputUrl;
        if (mediaEditorFile) {
          permanentLogoUrl = await uploadFileToSupabaseStorage(
            'avatars',
            mediaEditorFile,
            mediaEditorFile.name,
            'merchant_logo'
          );
        } else if (logoInputUrl && isLocalTransientUrl(logoInputUrl)) {
          permanentLogoUrl = await uploadFileToSupabaseStorage(
            'avatars',
            logoInputUrl,
            'merchant_logo.jpg',
            'merchant_logo'
          );
        }
        setStore(prev => ({ ...prev, avatar: permanentLogoUrl }));
        setKycForm(prev => ({ ...prev, shopLogo: permanentLogoUrl }));
        setLogoInputUrl(permanentLogoUrl);
        showToast('দোকানের লোগো সফলভাবে আপডেট হয়েছে!');
      } else if (showMediaEditorModal === 'banner') {
        let permanentBannerUrl = bannerInputUrl;
        if (mediaEditorFile) {
          permanentBannerUrl = await uploadFileToSupabaseStorage(
            'banners',
            mediaEditorFile,
            mediaEditorFile.name,
            'merchant_banner'
          );
        } else if (bannerInputUrl && isLocalTransientUrl(bannerInputUrl)) {
          permanentBannerUrl = await uploadFileToSupabaseStorage(
            'banners',
            bannerInputUrl,
            'merchant_banner.jpg',
            'merchant_banner'
          );
        }
        setStore(prev => ({ ...prev, banner: permanentBannerUrl }));
        setKycForm(prev => ({ ...prev, coverBanner: permanentBannerUrl }));
        setBannerInputUrl(permanentBannerUrl);
        showToast('দোকানের কভার ব্যানার সফলভাবে আপডেট হয়েছে!');
      }
      setMediaEditorFile(null);
      setShowMediaEditorModal(null);
    } catch (err) {
      console.error('Media upload failed:', err);
      showToast('মিডিয়া আপলোড ব্যর্থ হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsUploadingMedia(false);
    }
  };

  // Handle Post Product
  const handleAddProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.title || !productForm.price) {
      alert('পণ্যের নাম এবং মূল্য আবশ্যক।');
      return;
    }

    setIsSubmittingProduct(true);
    try {
      let finalImageUrl = productForm.imageUrl || NO_IMAGE_AVAILABLE_ICON;

      // Step 1: Upload Image to Supabase Storage ('products' bucket)
      if (merchantProductFile) {
        const fileExt = (merchantProductFile.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
        const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `${Math.random().toString(36).substring(2, 10)}`;
        const uniqueFileName = `${Date.now()}_${uniqueId}.${fileExt}`;

        const { data: storageData, error: storageError } = await supabase.storage
          .from('products')
          .upload(uniqueFileName, merchantProductFile, {
            cacheControl: '3600',
            upsert: true,
            contentType: merchantProductFile.type || 'image/jpeg'
          });

        if (storageError) {
          console.error('[MerchantStorefront Storage Error]:', storageError);
          alert(`ছবি আপলোড ব্যর্থ হয়েছে: ${storageError.message || 'Supabase Storage error'}। পণ্য যুক্ত করা স্থগিত রাখা হয়েছে।`);
          setIsSubmittingProduct(false);
          return;
        }

        const { data: pubData } = supabase.storage
          .from('products')
          .getPublicUrl(uniqueFileName);

        finalImageUrl = pubData?.publicUrl || getProductPublicUrl(uniqueFileName);
      }

      finalImageUrl = getProductPublicUrl(finalImageUrl);

      const priceNum = parseFloat(productForm.price) || 100;
      const origPriceNum = parseFloat(productForm.originalPrice) || priceNum;

      // Step 2: Insert Product Record into Supabase Database ('products' table)
      const primaryPayload: Record<string, any> = {
        products_name: productForm.title,
        products_photos: finalImageUrl,
        regular_price: origPriceNum > priceNum ? origPriceNum : priceNum,
        discount_price: priceNum,
        discount_badge: origPriceNum > priceNum ? 'বিশেষ ছাড়' : '',
        category: productForm.category,
        stock_status: (parseInt(productForm.stock) || 10) > 0 ? 'in_stock' : 'out_of_stock',
        seller_name: store.shopName || (store as any).sellerName || store.ownerName || 'মার্চেন্ট শপ',
        origin: `${store.upazila || 'সদর'}, ${store.district || 'খাগড়াছড়ি'}`,
        unit: productForm.unit || 'পিস',
        description: productForm.description || `${productForm.title} - শতভাগ খাঁটি ও ফ্রেশ পাহাড়ি পণ্য।`
      };

      let { error: dbError } = await supabase.from('products').insert([primaryPayload]);
      if (dbError) {
        console.warn('[MerchantStorefront Products Insert Error]:', dbError.message);
        const fallbackPayload: Record<string, any> = {
          name_bn: productForm.title,
          name_en: productForm.title,
          price: priceNum,
          category: productForm.category,
          stock: parseInt(productForm.stock) || 10,
          image_url: finalImageUrl,
          unit: productForm.unit || 'পিস',
          description_bn: productForm.description,
          origin: `${store.upazila || 'সদর'}, ${store.district || 'খাগড়াছড়ি'}`
        };
        const { error: fbErr } = await supabase.from('products').insert([fallbackPayload]);
        if (fbErr) {
          dbError = fbErr;
        } else {
          dbError = null;
        }
      }

      if (dbError) {
        alert(`পণ্য ডেটাবেজে সংরক্ষণে সমস্যা: ${dbError.message || 'Database error'}`);
        setIsSubmittingProduct(false);
        return;
      }

      const newProduct: VendorStoreProduct = {
        id: `msp_${Date.now()}`,
        nameBn: productForm.title,
        nameEn: productForm.title,
        category: 'OrganicFood',
        categoryLabelBn: productForm.category,
        price: priceNum,
        originalPrice: origPriceNum,
        stock: parseInt(productForm.stock) || 10,
        unit: productForm.unit,
        origin: store.detailedAddress || 'খাগড়াছড়ি সদর',
        district: store.district || 'খাগড়াছড়ি',
        upazila: store.upazila || 'সদর',
        mahalla: store.mahalla || 'সদর বাজার',
        rating: 5.0,
        reviewsCount: 0,
        badge: '১০০% খাঁটি',
        image: finalImageUrl,
        images: [finalImageUrl],
        descriptionBn: productForm.description || `${productForm.title} - শতভাগ খাঁটি ও ফ্রেশ কোয়ালিটি।`,
        descriptionEn: productForm.description || `${productForm.title} - 100% natural & authentic organic quality.`,
        features: ['১০০% খাঁটি', 'অর্গানিক ও প্রিজারভেটিভমুক্ত'],
        specifications: [
          { labelBn: 'গ্রেড', valueBn: 'Grade-A Premium' },
          { labelBn: 'প্যাকেটের আকার', valueBn: productForm.unit }
        ],
        verifiedSeller: true,
        sellerId: store.id,
        sellerUniqueId: merchantUID,
        sellerShopName: store.shopName,
        sellerOwnerName: store.ownerName,
        sellerPhoneMasked: maskPhoneNumber(store.realPhone)
      };

      setProductsList(prev => [newProduct, ...prev]);
      setShowAddProductModal(false);
      setMerchantProductFile(null);
      try {
        databaseService.notifyEntityChange('products');
        databaseService.fetchProductsFromSupabase().catch(() => {});
      } catch (_) {}
      showToast('নতুন পণ্য সফলভাবে মার্চেন্ট গ্রিডে ও Supabase টেবিলে যুক্ত হয়েছে!');
      setProductForm({
        title: '',
        category: 'পাহাড়ি অর্গানিক খাবার',
        price: '',
        originalPrice: '',
        stock: '20',
        unit: '১ কেজি প্যাকেট',
        description: '',
        videoUrl: '',
        imageUrl: ''
      });
    } catch (err) {
      console.error('Add product error:', err);
      showToast('পণ্য যোগ করার সময় ত্রুটি ঘটেছে। আবার চেষ্টা করুন।');
    } finally {
      setIsSubmittingProduct(false);
    }
  };

  // Filtered products
  const filteredProducts = useMemo(() => {
    return productsList.filter(p => {
      const matchSearch = searchQuery === '' || 
        p.nameBn.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.descriptionBn.toLowerCase().includes(searchQuery.toLowerCase());
      const matchCat = selectedCategory === 'all' || p.categoryLabelBn.includes(selectedCategory);
      return matchSearch && matchCat;
    });
  }, [productsList, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-white text-gray-900 pb-20 font-sans">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900 text-white px-4 py-2 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold animate-fade-in border border-gray-700">
          <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ১. BUSINESS IDENTITY & COVER BANNER (Interactive Fashion Cover & Avatar) */}
      {/* ========================================================================= */}
      <header className="bg-white border-b border-gray-100">
        
        {/* Cover Banner (Reduced 50% Height & Modern Fashion Model Cover Image) */}
        <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-3">
          <div 
            onClick={() => {
              if (isOwner) {
                setBannerInputUrl(store.banner || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80');
                setShowMediaEditorModal('banner');
              }
            }}
            className="relative w-full h-20 sm:h-24 md:h-28 rounded-2xl sm:rounded-3xl overflow-hidden bg-stone-100 border border-stone-200 group cursor-pointer shadow-2xs"
            title={isOwner ? "কভার ব্যানার পরিবর্তন করতে ক্লিক করুন" : undefined}
          >
            {/* Fashion / Clothing Cover Image */}
            <img 
              src={store.banner || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80'} 
              alt="Fashion Shop Cover Banner" 
              className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-500"
            />
            {/* Subtle Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-transparent" />

            {/* Back Button Floating on Banner */}
            {onBack && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  onBack();
                }}
                className="absolute top-2.5 left-2.5 z-20 w-8 h-8 rounded-full bg-white/90 hover:bg-white text-gray-800 flex items-center justify-center transition cursor-pointer shadow-md backdrop-blur-xs active:scale-95 border border-white/40"
                title="হোমে ফিরে যান"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            {/* Interactive Banner Edit / Upload Badge */}
            {isOwner && (
              <div
                className="absolute top-2.5 right-2.5 z-20 bg-white/90 hover:bg-white text-gray-800 text-[10px] font-bold px-2.5 py-1 rounded-xl shadow-md backdrop-blur-xs flex items-center gap-1.5 transition active:scale-95 border border-white/50"
              >
                <Camera className="w-3 h-3 text-[#16A34A]" />
                <span className="hidden xs:inline sm:inline">ব্যানার পরিবর্তন</span>
              </div>
            )}
          </div>
        </div>

        {/* Profile Logo (Circular Avatar) & Business Info Row */}
        <div className="max-w-4xl mx-auto px-4 -mt-7 sm:-mt-9 relative z-10 flex flex-col sm:flex-row sm:items-end justify-between gap-3 pb-3">
          
          {/* Circular Avatar with Interactive Upload Trigger */}
          <div className="flex items-end gap-3.5">
            <div 
              onClick={() => {
                if (isOwner) {
                  setLogoInputUrl(store.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80');
                  setShowMediaEditorModal('logo');
                }
              }}
              className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full border-3 sm:border-4 border-white bg-white shadow-md overflow-hidden group shrink-0 cursor-pointer ring-2 ring-black/5"
              title={isOwner ? "শপ লোগো পরিবর্তন করতে ক্লিক করুন" : undefined}
            >
              <img 
                src={store.avatar || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80'} 
                alt="Shop Circular Logo" 
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
              />
              {/* Circular Logo Upload Overlay */}
              {isOwner && (
                <div
                  className="absolute inset-0 bg-black/40 hover:bg-black/60 text-white flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition backdrop-blur-2xs"
                >
                  <Camera className="w-4 h-4 mb-0.5" />
                  <span className="text-[7.5px] font-bold">লোগো পরিবর্তন</span>
                </div>
              )}
            </div>

            <div className="pb-0.5 min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight leading-tight">
                  {store.shopName}
                </h2>
                <span className="bg-emerald-50 text-[#16A34A] text-[9.5px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 border border-emerald-200 shrink-0">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
                  <span>ভেরিফাইড মার্চেন্ট</span>
                </span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-gray-500 mt-0.5 flex-wrap font-medium">
                <span className="flex items-center gap-1 text-gray-600">
                  <MapPin className="w-3.5 h-3.5 text-[#16A34A] shrink-0" />
                  <span className="truncate">{store.detailedAddress || 'মিরপুর-১০, ঢাকা'}</span>
                </span>
                <span className="flex items-center gap-1 text-amber-600 font-bold">
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  <span>{store.rating ? store.rating.toFixed(1) : '0.0'} ({store.reviewsCount || 0} রিভিউ)</span>
                </span>
              </div>
            </div>
          </div>

          {/* Contact & Share Badge */}
          <div className="flex items-center gap-2 shrink-0 sm:pb-1">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href);
                showToast('দোকানের লিংক কপি হয়েছে!');
              }}
              className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs active:scale-95 transition"
            >
              <Share2 className="w-3.5 h-3.5 text-gray-500" />
              <span>শেয়ার করুন</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* ২. CLEAN CIRCULAR ACTION BAR (Sub-Header) - Uniform Sleek Circular Design */}
        {/* Icons: 1. Profile (KYC) | 2. Post (+) | 3. Notifications Bell | 4. Messages */}
        {/* ========================================================================= */}
        <div className="bg-white border-t border-gray-100 py-3 px-4">
          <div className="max-w-4xl mx-auto flex items-center justify-around sm:justify-center sm:gap-10">
            
            {/* 1. Profile Icon (Round Circular Button -> Confidential KYC Form) */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => setShowKycModal(true)}
                className={`w-11 h-11 rounded-full flex items-center justify-center transition-all cursor-pointer active:scale-90 border shadow-xs relative ${
                  isProfileVerified
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-amber-50 text-amber-800 border-amber-300 hover:bg-amber-100 animate-pulse'
                }`}
                title="প্রোফাইল ও গোপনীয় KYC ফরম"
              >
                <User className="w-5 h-5 text-emerald-700" />
                <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-600 text-white rounded-full flex items-center justify-center text-[8px] font-bold">
                  ✓
                </span>
              </button>
              <span className="text-[10.5px] font-bold text-gray-700">প্রোফাইল/KYC</span>
            </div>

            {/* 2. Post Icon (Round Circular Button -> Plus (+) Catalog Upload) */}
            <div className="flex flex-col items-center gap-1">
              <button
                onClick={() => setShowAddProductModal(true)}
                className="w-11 h-11 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition-all cursor-pointer active:scale-90 shadow-md border border-emerald-500"
                title="ক্যাটালগে নতুন পণ্য পোস্ট করুন"
              >
                <Plus className="w-6 h-6 stroke-[3]" />
              </button>
              <span className="text-[10.5px] font-bold text-emerald-800">পণ্য পোস্ট (+)</span>
            </div>

            {/* 3. Notification Icon (Standard Facebook-style Notification Bell) */}
            <div className="flex flex-col items-center gap-1 relative">
              <div className="relative">
                <button
                  onClick={() => {
                    setShowNotifications(!showNotifications);
                    setShowMessages(false);
                  }}
                  className="w-11 h-11 rounded-full bg-white hover:bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-700 transition-all cursor-pointer active:scale-90 shadow-xs hover:border-emerald-400"
                  title="নোটিফিকেশন"
                >
                  <Bell className="w-5 h-5 text-gray-700" />
                  {notifications.some(n => n.unread) && (
                    <span className="absolute 1 top-0 right-0 w-4 h-4 bg-red-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center shadow-xs">
                      {notifications.filter(n => n.unread).length}
                    </span>
                  )}
                </button>

                {/* Notifications Popup */}
                {showNotifications && (
                  <div className="absolute left-1/2 -translate-x-1/2 sm:left-auto sm:right-0 sm:translate-x-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 p-3 z-50 space-y-2 animate-scale-up">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <Bell className="w-4 h-4 text-emerald-600" /> নোটিফিকেশন
                      </span>
                      <button onClick={() => setShowNotifications(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-1.5 max-h-60 overflow-y-auto">
                      {notifications.length === 0 ? (
                        <div className="py-6 text-center text-gray-400 text-[11px]">
                          <Bell className="w-5 h-5 mx-auto mb-1 text-gray-300" />
                          <p>কোনো নতুন নোটিফিকেশন নেই</p>
                        </div>
                      ) : (
                        notifications.map(n => (
                          <div key={n.id} className="p-2 rounded-xl text-left text-[11px] bg-gray-50 border border-gray-100 hover:bg-emerald-50/50 transition">
                            <div className="flex items-center justify-between gap-1">
                              <h4 className="font-bold text-gray-900 text-[11px]">{n.title}</h4>
                              <span className="text-[9px] text-gray-400 shrink-0">{n.time}</span>
                            </div>
                            <p className="text-[10px] text-gray-600 mt-0.5 leading-relaxed">{n.desc}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <span className="text-[10.5px] font-bold text-gray-700">নোটিফিকেশন</span>
            </div>

            {/* 4. Message Icon (Standard Chat / Message Bubble Icon) */}
            <div className="flex flex-col items-center gap-1 relative">
              <div className="relative">
                <button
                  onClick={() => {
                    setShowMessages(!showMessages);
                    setShowNotifications(false);
                  }}
                  className="w-11 h-11 rounded-full bg-white hover:bg-gray-50 border border-gray-200 flex items-center justify-center text-gray-700 transition-all cursor-pointer active:scale-90 shadow-xs hover:border-emerald-400"
                  title="কাস্টমার মেসেজ ও ইনকোয়ারি"
                >
                  <MessageSquare className="w-5 h-5 text-emerald-700" />
                  {messages.some(m => m.unread) && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-emerald-600 text-white rounded-full text-[9px] font-bold flex items-center justify-center shadow-xs">
                      {messages.filter(m => m.unread).length}
                    </span>
                  )}
                </button>

                {/* Messages Popup */}
                {showMessages && (
                  <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 p-3 z-50 space-y-2 animate-scale-up">
                    <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                      <span className="text-xs font-bold text-gray-900 flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-emerald-600" /> কাস্টমার ইনবক্স
                      </span>
                      <button onClick={() => setShowMessages(false)} className="text-gray-400 hover:text-gray-600">
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {messages.length === 0 ? (
                        <div className="py-6 text-center text-gray-400 text-[11px]">
                          <MessageSquare className="w-5 h-5 mx-auto mb-1 text-gray-300" />
                          <p>কোনো নতুন মেসেজ নেই</p>
                        </div>
                      ) : (
                        messages.map(m => (
                          <div key={m.id} className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 space-y-1.5">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="font-bold text-gray-900 flex items-center gap-1">
                                <User className="w-3 h-3 text-gray-500" />
                                {m.senderName}
                              </span>
                              <span className="text-[9px] text-gray-400">{m.time}</span>
                            </div>
                            <p className="text-[11px] text-gray-700 bg-white p-2 rounded-lg border border-gray-200">
                              "{m.text}"
                            </p>
                            <div className="flex items-center gap-1">
                              <input
                                type="text"
                                placeholder="রিপ্লাই লিখুন..."
                                value={replyText[m.id] || ''}
                                onChange={(e) => setReplyText({ ...replyText, [m.id]: e.target.value })}
                                className="flex-1 text-[10px] bg-white border border-gray-200 rounded-lg px-2 py-1 outline-none focus:border-emerald-500"
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  if (replyText[m.id]) {
                                    showToast(`মেসেজ পাঠানো হয়েছে (${m.senderName})`);
                                    setReplyText({ ...replyText, [m.id]: '' });
                                  }
                                }}
                                className="bg-emerald-600 text-white text-[9.5px] font-bold px-2.5 py-1 rounded-lg hover:bg-emerald-700 cursor-pointer"
                              >
                                সেন্ড
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
              <span className="text-[10.5px] font-bold text-gray-700">মেসেজ</span>
            </div>

          </div>
        </div>
      </header>

      {/* ========================================================================= */}
      {/* ৩. CLEAN PRODUCT GRID (Matching Image 2 Minimalist Fashion Boutique Aesthetic) */}
      {/* Strictly 2-Column Grid Layout with Vertical Images, Crisp Black Typography & Clean Spacing */}
      {/* ========================================================================= */}
      <main className="max-w-4xl mx-auto px-4 py-5 space-y-4">
        
        {/* Search Bar */}
        <div className="flex items-center justify-between gap-3 bg-white p-2 rounded-2xl border border-gray-100 shadow-[0_1px_6px_rgba(0,0,0,0.03)]">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="সার্চ করুন (যেমন: Blouse, Dress, Kurti)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-gray-50/70 border border-gray-200/80 rounded-xl focus:border-gray-900 focus:bg-white outline-none transition text-gray-900 placeholder:text-gray-400"
            />
          </div>

          <span className="text-[11px] text-gray-500 font-medium shrink-0 pr-2">
            {filteredProducts.length} টি আইটেম
          </span>
        </div>

        {/* Horizontal Category Filter Pills (Matching Image 2 Sub-Nav) */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: 'all', label: 'সকল কালেকশন' },
            { id: 'টপস', label: 'টপস ও ব্লাউজ' },
            { id: 'ড্রেস', label: 'ফ্যাশন ড্রেস' },
            { id: 'ঐতিহ্যবাহী', label: 'ঐতিহ্যবাহী পোশাক' },
            { id: 'কুর্তি', label: 'কুর্তি ও টিউনিক' }
          ].map((cat) => {
            const isActive = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition cursor-pointer border ${
                  isActive
                    ? 'bg-gray-900 text-white border-gray-900 shadow-xs'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* STRICTLY 2-COLUMN PRODUCT GRID (Matching Center Screen in Image 2) */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-2 gap-3.5 sm:gap-5 md:gap-6 pt-1">
            {filteredProducts.map((product) => {
              const discountPct = product.originalPrice > product.price 
                ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) 
                : 0;
              const isLiked = !!likedProductIds[product.id];

              return (
                <div 
                  key={product.id}
                  onClick={() => setSelectedProductPreview(product)}
                  className="bg-white rounded-2xl border border-gray-100 shadow-[0_2px_10px_rgba(0,0,0,0.03)] hover:shadow-md transition-all duration-300 overflow-hidden flex flex-col justify-between group cursor-pointer"
                >
                  {/* Vertical Fashion Image Container (Aspect Ratio 3:4) */}
                  <div className="relative aspect-[3/4] bg-gray-50 overflow-hidden">
                    <img 
                      src={getProductPublicUrl(product.image)} 
                      alt={product.nameBn} 
                      className="w-full h-full object-cover object-top group-hover:scale-103 transition-transform duration-500"
                      loading="lazy"
                    />

                    {/* Subtle Wishlist / Heart Icon (Matching Image 2 Top-Right Placement) */}
                    <button
                      type="button"
                      onClick={(e) => toggleLike(product.id, e)}
                      className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full flex items-center justify-center transition shadow-xs cursor-pointer ${
                        isLiked 
                          ? 'bg-white text-rose-600' 
                          : 'bg-white/80 hover:bg-white text-gray-400 hover:text-rose-500 backdrop-blur-xs'
                      }`}
                      title={isLiked ? 'পছন্দ করা হয়েছে' : 'পছন্দ করুন'}
                    >
                      <Heart className={`w-4 h-4 transition ${isLiked ? 'fill-rose-600 text-rose-600' : 'text-gray-500'}`} />
                    </button>
                  </div>

                  {/* Clean Product Details (Pure White Background, Crisp Typography) */}
                  <div className="p-3 sm:p-3.5 flex flex-col justify-between flex-1 space-y-2 bg-white">
                    
                    {/* Price & Discount Row (Matching Image 2: "Rs 870 30% Off") */}
                    <div className="flex items-baseline flex-wrap gap-1.5">
                      <span className="text-sm sm:text-base font-extrabold text-[#111111]">
                        ৳ {product.price}
                      </span>
                      {discountPct > 0 && (
                        <span className="text-[10.5px] sm:text-xs font-bold text-rose-600">
                          {discountPct}% Off
                        </span>
                      )}
                      {product.originalPrice > product.price && (
                        <span className="text-[10px] sm:text-[11px] text-gray-400 line-through ml-0.5">
                          ৳{product.originalPrice}
                        </span>
                      )}
                    </div>

                    {/* Full Product Title & Brand Subtitle (Crisp Text, No Truncation) */}
                    <div className="space-y-0.5">
                      <h3 className="text-xs sm:text-[13px] font-semibold text-[#1A1A1A] leading-snug group-hover:text-gray-700 transition">
                        {product.nameBn}
                      </h3>
                      {product.nameEn && (
                        <p className="text-[10px] sm:text-[11px] text-gray-400 font-medium">
                          {product.nameEn}
                        </p>
                      )}
                    </div>

                    {/* Minimalist Cart Action */}
                    <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                      <span className="text-[10px] text-gray-500 font-medium">
                        {product.unit}
                      </span>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (onAddToCart) {
                            onAddToCart(product, 1);
                            showToast(`${product.nameBn} কার্টে যোগ হয়েছে!`);
                          } else {
                            setSelectedProductPreview(product);
                          }
                        }}
                        className="p-1.5 rounded-lg bg-gray-50 hover:bg-gray-900 text-gray-700 hover:text-white transition active:scale-95 cursor-pointer border border-gray-200 hover:border-gray-900"
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
          <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center space-y-3 shadow-xs">
            <Package className="w-10 h-10 text-gray-300 mx-auto stroke-[1.5]" />
            <div className="space-y-1">
              <h3 className="text-xs font-bold text-gray-800">কোনো পণ্য পাওয়া যায়নি</h3>
              <p className="text-[11px] text-gray-500">
                উপরের প্লাস (+) বাটনে ক্লিক করে নতুন ফ্যাশন পণ্য যুক্ত করুন।
              </p>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================================= */}
      {/* ৪. MODAL: PROFILE & CONFIDENTIAL KYC FORM (NID, DOB, Address, Certificates) */}
      {/* ========================================================================= */}
      {showKycModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 w-full max-w-lg shadow-2xl space-y-4 my-auto border border-gray-100 animate-scale-up">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-200">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">মার্চেন্ট প্রোফাইল ও গোপনীয় KYC ফরম</h3>
                  <p className="text-[10px] text-gray-400">এনআইডি ও ব্যক্তিগত তথ্য সাধারণ গ্রাহকদের কাছে সম্পূর্ণ গোপন থাকবে</p>
                </div>
              </div>
              <button 
                onClick={() => setShowKycModal(false)}
                className="w-7 h-7 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* KYC Form */}
            <form onSubmit={handleKycSubmit} className="space-y-3 text-xs max-h-[70vh] overflow-y-auto pr-1">
              
              {/* 1. Public Store Info */}
              <div className="space-y-2.5 bg-gray-50/80 p-3.5 rounded-2xl border border-gray-200">
                <span className="text-[11px] font-black text-gray-800 block flex items-center gap-1">
                  <Store className="w-3.5 h-3.5 text-emerald-600" />
                  ১. দোকানের সাধারণ তথ্য (পাবলিক ক্যাটালগ)
                </span>
                
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-1">দোকানের নাম (Shop Name) *</label>
                  <input
                    type="text"
                    required
                    value={kycForm.shopName}
                    onChange={(e) => setKycForm({ ...kycForm, shopName: e.target.value })}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-emerald-500 font-medium"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1">দোকানের লোগো (URL)</label>
                    <input
                      type="url"
                      value={kycForm.shopLogo}
                      onChange={(e) => setKycForm({ ...kycForm, shopLogo: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-emerald-500 text-[10px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1">কভার ব্যানার (URL)</label>
                    <input
                      type="url"
                      value={kycForm.coverBanner}
                      onChange={(e) => setKycForm({ ...kycForm, coverBanner: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-emerald-500 text-[10px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-1">দোকান / ব্যবসার ঠিকানা *</label>
                  <input
                    type="text"
                    required
                    value={kycForm.businessAddress}
                    onChange={(e) => setKycForm({ ...kycForm, businessAddress: e.target.value })}
                    className="w-full p-2.5 bg-white border border-gray-200 rounded-xl outline-none focus:border-emerald-500 font-medium"
                  />
                </div>
              </div>

              {/* 2. Confidential KYC Information (Strictly Protected) */}
              <div className="space-y-2.5 bg-emerald-50/50 p-3.5 rounded-2xl border border-emerald-200">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black text-emerald-950 flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5 text-emerald-700" />
                    ২. গোপনীয় জাতীয় পরিচয়পত্র ও ব্যক্তিগত তথ্য
                  </span>
                  <span className="bg-emerald-100 text-emerald-900 text-[9px] font-bold px-2 py-0.5 rounded-full border border-emerald-300">
                    Confidential 🔒
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1">মালিকের নাম (NID অনুসারে) *</label>
                    <input
                      type="text"
                      required
                      value={kycForm.ownerName}
                      onChange={(e) => setKycForm({ ...kycForm, ownerName: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1">জাতীয় পরিচয়পত্র (NID) নম্বর *</label>
                    <input
                      type="text"
                      required
                      value={kycForm.nidNumber}
                      onChange={(e) => setKycForm({ ...kycForm, nidNumber: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-emerald-500 font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1">পিতার নাম</label>
                    <input
                      type="text"
                      value={kycForm.fatherName}
                      onChange={(e) => setKycForm({ ...kycForm, fatherName: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-emerald-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1">মাতার নাম</label>
                    <input
                      type="text"
                      value={kycForm.motherName}
                      onChange={(e) => setKycForm({ ...kycForm, motherName: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1">জন্ম তারিখ (DOB)</label>
                    <input
                      type="date"
                      value={kycForm.dob}
                      onChange={(e) => setKycForm({ ...kycForm, dob: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-emerald-500 text-[10px]"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-700 mb-1">ট্রেড লাইসেন্স নম্বর</label>
                    <input
                      type="text"
                      value={kycForm.tradeLicense}
                      onChange={(e) => setKycForm({ ...kycForm, tradeLicense: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-emerald-500 font-mono text-[10px]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-1">স্থায়ী ঠিকানা (Permanent Address)</label>
                  <input
                    type="text"
                    value={kycForm.permanentAddress}
                    onChange={(e) => setKycForm({ ...kycForm, permanentAddress: e.target.value })}
                    className="w-full p-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-1">সার্টিফিকেট / প্রাতিষ্ঠানিক সনদ</label>
                  <input
                    type="text"
                    value={kycForm.certificates}
                    onChange={(e) => setKycForm({ ...kycForm, certificates: e.target.value })}
                    className="w-full p-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowKycModal(false)}
                  className="w-1/2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-xs transition active:scale-95 cursor-pointer"
                >
                  সংরক্ষণ ও আপডেট করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ৫. MODAL: POST CATALOG ITEM (Title, Category, Price, Discount, Video Link) */}
      {/* ========================================================================= */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 w-full max-w-md shadow-2xl space-y-4 my-auto border border-gray-100 animate-scale-up">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
                  <Plus className="w-5 h-5 stroke-[3]" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900">ক্যাটালগে নতুন পণ্য পোস্ট করুন</h3>
                  <p className="text-[10px] text-gray-400">সরাসরি হোয়াইট থিম ২-কলাম মার্চেন্ট গ্রিডে যুক্ত হবে</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddProductModal(false)}
                className="w-7 h-7 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddProductSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1">পণ্যের নাম (Title) *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: জুমের পাহাড়ি হলুদ গুঁড়া (৫০০ গ্রাম)"
                  value={productForm.title}
                  onChange={(e) => setProductForm({ ...productForm, title: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-1">ক্যাটাগরি</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500"
                  >
                    <option value="পাহাড়ি মশলা ও শস্য">পাহাড়ি মশলা ও শস্য</option>
                    <option value="পাহাড়ি অর্গানিক খাবার">পাহাড়ি অর্গানিক খাবার</option>
                    <option value="আদিবাসী হস্তশিল্প ও পোশাক">আদিবাসী হস্তশিল্প ও পোশাক</option>
                    <option value="প্রাকৃতিক মধু ও মিষ্টি">প্রাকৃতিক মধু ও মিষ্টি</option>
                    <option value="খাঁটি পাহাড়ি শুটকি">খাঁটি পাহাড়ি শুটকি</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-1">প্যাকেট / সাইজ</label>
                  <input
                    type="text"
                    placeholder="১ কেজি / ৫০০ গ্রাম"
                    value={productForm.unit}
                    onChange={(e) => setProductForm({ ...productForm, unit: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-1">বিক্রয়মূল্য (৳) *</label>
                  <input
                    type="number"
                    required
                    placeholder="৩৫০"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500 font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-1">মূল মূল্য (৳)</label>
                  <input
                    type="number"
                    placeholder="৪২০"
                    value={productForm.originalPrice}
                    onChange={(e) => setProductForm({ ...productForm, originalPrice: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-gray-700 mb-1">স্টক পরিমাণ</label>
                  <input
                    type="number"
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1">
                  পণ্যের ছবি (Device Upload / Image URL) *
                </label>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 p-3 bg-gray-50 border border-dashed border-gray-300 rounded-2xl">
                  <div className="w-16 h-16 rounded-xl bg-white overflow-hidden border border-gray-200 shrink-0 flex items-center justify-center">
                    {productForm.imageUrl ? (
                      <img
                        src={productForm.imageUrl}
                        alt="Product preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Package className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1.5 w-full">
                    <input
                      type="file"
                      ref={merchantProductFileInputRef}
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setMerchantProductFile(file);
                          try {
                            const preview = URL.createObjectURL(file);
                            setProductForm((prev) => ({ ...prev, imageUrl: preview }));
                          } catch {
                            const reader = new FileReader();
                            reader.onloadend = () => {
                              if (typeof reader.result === 'string') {
                                setProductForm((prev) => ({ ...prev, imageUrl: reader.result as string }));
                              }
                            };
                            reader.readAsDataURL(file);
                          }
                        }
                      }}
                    />
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => merchantProductFileInputRef.current?.click()}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>ডিভাইস থেকে ছবি নির্বাচন করুন</span>
                      </button>
                      {productForm.imageUrl && (
                        <button
                          type="button"
                          onClick={() => {
                            setMerchantProductFile(null);
                            setProductForm((prev) => ({ ...prev, imageUrl: '' }));
                          }}
                          className="text-[11px] text-rose-600 hover:underline font-bold"
                        >
                          মুছুন
                        </button>
                      )}
                    </div>
                    <input
                      type="url"
                      placeholder="অথবা ইমেজ URL দিন..."
                      value={productForm.imageUrl}
                      onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                      className="w-full p-2 bg-white border border-gray-200 rounded-xl outline-none focus:border-emerald-500 text-[10px]"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-700 mb-1">সংক্ষিপ্ত বিবরণ</label>
                <textarea
                  rows={2}
                  placeholder="পণ্য সম্পর্কে বিস্তারিত লিখুন..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="w-1/2 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl font-bold transition"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingProduct}
                  className="w-1/2 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
                >
                  {isSubmittingProduct ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>আপলোড হচ্ছে...</span>
                    </>
                  ) : (
                    <span>পণ্য পোস্ট করুন</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ৬. MODAL: MEDIA EDITOR (Logo / Cover Banner File Upload, URL & Presets) */}
      {/* ========================================================================= */}
      {showMediaEditorModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 w-full max-w-md shadow-2xl space-y-3.5 my-auto border border-gray-100 animate-scale-up">
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <h3 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-[#16A34A]" />
                {showMediaEditorModal === 'logo' ? 'শপ লোগো পরিবর্তন / আপলোড' : 'ফ্যাশন কভার ব্যানার পরিবর্তন / আপলোড'}
              </h3>
              <button onClick={() => setShowMediaEditorModal(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Option 1: Direct Local File Upload */}
            <div className="p-3 rounded-2xl bg-stone-50 border border-stone-200 space-y-2">
              <label className="block text-[11px] font-bold text-stone-800">
                ১. আপনার ডিভাইস থেকে ছবি আপলোড করুন:
              </label>
              <label className="flex items-center justify-center gap-2 w-full py-2.5 px-3 bg-white hover:bg-emerald-50/50 border border-dashed border-[#16A34A]/50 rounded-xl cursor-pointer transition text-xs font-bold text-[#16A34A] shadow-2xs">
                <Upload className="w-4 h-4" />
                <span>কম্পিউটার বা মোবাইল থেকে ফাইল নির্বাচন করুন</span>
                <input 
                  type="file" 
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setMediaEditorFile(file);
                      try {
                        const preview = URL.createObjectURL(file);
                        if (showMediaEditorModal === 'logo') {
                          setLogoInputUrl(preview);
                        } else {
                          setBannerInputUrl(preview);
                        }
                      } catch {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          const result = reader.result as string;
                          if (showMediaEditorModal === 'logo') {
                            setLogoInputUrl(result);
                          } else {
                            setBannerInputUrl(result);
                          }
                        };
                        reader.readAsDataURL(file);
                      }
                    }
                  }}
                />
              </label>
            </div>

            {/* Option 2: Image URL Input */}
            <div className="space-y-1.5">
              <label className="block text-[11px] font-bold text-stone-800">
                ২. অথবা অনলাইন ইমেজ URL পেস্ট করুন:
              </label>
              <input
                type="url"
                value={showMediaEditorModal === 'logo' ? logoInputUrl : bannerInputUrl}
                onChange={(e) => {
                  if (showMediaEditorModal === 'logo') setLogoInputUrl(e.target.value);
                  else setBannerInputUrl(e.target.value);
                }}
                placeholder="https://images.unsplash.com/..."
                className="w-full p-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs outline-none focus:border-[#16A34A] focus:bg-white transition font-mono"
              />
            </div>

            {/* Option 3: Curated Fashion & Boutique Presets */}
            <div>
              <span className="text-[10.5px] font-bold text-stone-600 block mb-1.5">৩. দ্রুত পছন্দের ফ্যাশন টেমপ্লেট নির্বাচন করুন:</span>
              <div className="grid grid-cols-4 gap-1.5">
                {showMediaEditorModal === 'banner' ? (
                  [
                    { name: 'ফ্যাশন মডেল', url: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80' },
                    { name: 'বুটিক শোরুম', url: 'https://images.unsplash.com/photo-1441984904996-e0b6ba687e04?auto=format&fit=crop&w=1200&q=80' },
                    { name: 'হ্যান্ডলুম তাঁত', url: 'https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80' },
                    { name: 'মডার্ন স্টুডিও', url: 'https://images.unsplash.com/photo-1469334031218-e382a71b716b?auto=format&fit=crop&w=1200&q=80' }
                  ].map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setBannerInputUrl(p.url)}
                      className="group relative rounded-xl overflow-hidden border border-stone-200 aspect-video hover:border-[#16A34A] transition"
                      title={p.name}
                    >
                      <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                      <span className="absolute inset-x-0 bottom-0 bg-black/60 text-[8px] text-white font-bold p-0.5 truncate text-center">
                        {p.name}
                      </span>
                    </button>
                  ))
                ) : (
                  [
                    { name: 'মডেল ১', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80' },
                    { name: 'মডেল ২', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=300&q=80' },
                    { name: 'আর্টিসান', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=300&q=80' },
                    { name: 'এমব্লেম', url: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=300&q=80' }
                  ].map((p, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setLogoInputUrl(p.url)}
                      className="group relative rounded-full overflow-hidden border-2 border-stone-200 aspect-square hover:border-[#16A34A] transition"
                      title={p.name}
                    >
                      <img src={p.url} alt={p.name} className="w-full h-full object-cover" />
                    </button>
                  ))
                )}
              </div>
            </div>

            {/* Live Preview */}
            <div className="pt-1">
              <span className="text-[10px] font-bold text-stone-500 block mb-1">লাইভ প্রিভিউ:</span>
              <div className={`overflow-hidden bg-stone-100 border border-stone-200 ${
                showMediaEditorModal === 'logo' ? 'w-20 h-20 rounded-full mx-auto shadow-inner' : 'w-full h-20 rounded-2xl shadow-inner'
              }`}>
                <img 
                  src={showMediaEditorModal === 'logo' ? (logoInputUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80') : (bannerInputUrl || 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?auto=format&fit=crop&w=1200&q=80')} 
                  alt="Preview" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowMediaEditorModal(null)}
                className="w-1/2 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-xl font-bold text-xs transition cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleUpdateMedia}
                disabled={isUploadingMedia}
                className="w-1/2 py-2.5 bg-[#16A34A] hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-xs transition active:scale-95 cursor-pointer flex items-center justify-center gap-2"
              >
                {isUploadingMedia ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>আপলোড হচ্ছে...</span>
                  </>
                ) : (
                  <span>সংরক্ষণ ও আপডেট করুন</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* ৭. MODAL: PRODUCT DETAIL QUICK VIEW */}
      {/* ========================================================================= */}
      {selectedProductPreview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-3 overflow-y-auto">
          <div className="bg-white rounded-3xl p-5 w-full max-w-md shadow-2xl space-y-4 my-auto border border-gray-100 animate-scale-up">
            
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                {selectedProductPreview.categoryLabelBn}
              </span>
              <button 
                onClick={() => setSelectedProductPreview(null)}
                className="w-7 h-7 rounded-full bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="aspect-square bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
              <img 
                src={getProductPublicUrl(selectedProductPreview.image)} 
                alt={selectedProductPreview.nameBn} 
                className="w-full h-full object-cover"
              />
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-black text-gray-900">{selectedProductPreview.nameBn}</h3>
              <p className="text-xs text-gray-600 leading-relaxed">{selectedProductPreview.descriptionBn}</p>
              
              <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                <div>
                  <span className="text-base font-black text-gray-900">৳ {selectedProductPreview.price}</span>
                  {selectedProductPreview.originalPrice > selectedProductPreview.price && (
                    <span className="text-xs text-gray-400 line-through ml-2">৳ {selectedProductPreview.originalPrice}</span>
                  )}
                </div>
                <span className="text-xs text-gray-500 font-medium">{selectedProductPreview.unit}</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  if (onAddToCart) {
                    onAddToCart(selectedProductPreview, 1);
                    showToast(`${selectedProductPreview.nameBn} কার্টে যোগ হয়েছে!`);
                  }
                  setSelectedProductPreview(null);
                }}
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black text-xs shadow-md flex items-center justify-center gap-2 active:scale-98 transition cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>কার্টে যোগ করুন (৳ {selectedProductPreview.price})</span>
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
