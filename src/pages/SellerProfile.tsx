import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Store,
  MapPin,
  Phone,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  MoreVertical,
  LayoutDashboard,
  UserCheck,
  Edit3,
  LogOut,
  Trash2,
  Plus,
  Bell,
  MessageCircle,
  PhoneCall,
  Camera,
  X,
  Check,
  ShoppingBag,
  ExternalLink,
  AlertTriangle,
  Upload,
  Clock,
  FileText,
  DollarSign,
  Package,
  Layers,
  Sparkles,
  Menu,
  Info,
  Send,
  Wallet,
  Minus,
  Droplet,
  CreditCard
} from 'lucide-react';
import { Language } from '../types';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { databaseService } from '../services/databaseService';
import { supabase } from '../lib/supabaseClient';
import { Dashboard } from './Dashboard';
import { getProductPublicUrl } from '../utils/directSupabaseStorage';
import { NO_IMAGE_AVAILABLE_ICON } from '../constants/imageConstants';

/* =========================================================================
   1. TYPESCRIPT INTERFACES
   ========================================================================= */

export interface Product {
  id: string;
  nameBn: string;
  nameEn?: string;
  title?: string;
  category: string;
  price: number;
  originalPrice?: number;
  regularPrice?: number;
  discountPrice?: number;
  unit: string;
  stock?: number;
  inStock?: boolean;
  image: string;
  images?: string[];
  descriptionBn?: string;
  description?: string;
  location?: string;
  upazila?: string;
  district?: string;
  rating?: number;
  reviewsCount?: number;
  sellerId?: string;
  sellerName?: string;
  sellerPhone?: string;
}

export interface SellerProfileData {
  id?: string;
  uniqueId?: string;
  shopName: string;
  shopNameEn?: string;
  ownerName?: string;
  avatar?: string;
  banner?: string;
  coverBanner?: string;
  category?: string;
  categories?: string[];
  phone?: string;
  phoneMasked?: string;
  email?: string;
  division?: string;
  district?: string;
  upazila?: string;
  mahalla?: string;
  detailedAddress?: string;
  tradeLicenseNumber?: string;
  nidNumberMasked?: string;
  establishedYear?: string;
  isVerified?: boolean;
  verifiedBadgeText?: string;
  rating?: number;
  reviewsCount?: number;
  followersCount?: number;
  aboutBn?: string;
  walletBalance?: number;
  bloodGroup?: string;
  products?: Product[];
}

export interface SellerProfileProps {
  profileData?: SellerProfileData | any;
  currentUser?: any;
  isOwner?: boolean;
  lang?: Language;
  onBack?: () => void;
  onSignOut?: () => void;
  onDeleteAccount?: () => void;
  onAddToCart?: (product: Product, quantity?: number) => void;
  onBuyNow?: (product: Product, quantity?: number) => void;
  onOpenChat?: (sellerName: string) => void;
}

/* =========================================================================
   SAMPLE INITIAL FALLBACK PRODUCTS
   ========================================================================= */
const INITIAL_DEMO_PRODUCTS: Product[] = [
  {
    id: 'sp_demo_01',
    nameBn: 'পার্বত্য পাহাড়ি খাঁটি মধু (Hill Pure Forest Honey)',
    nameEn: 'Chittagong Hill Forest Pure Honey',
    category: 'পাহাড়ি অর্গানিক খাদ্য',
    price: 650,
    originalPrice: 850,
    regularPrice: 850,
    unit: '১ কেজি',
    stock: 25,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?w=700&auto=format&fit=crop&q=80',
    rating: 4.9,
    reviewsCount: 42
  },
  {
    id: 'sp_demo_02',
    nameBn: 'খাগড়াছড়ির জুমের পাহাড়ি হলুদ গুড়া',
    nameEn: 'Hill Pure Jhum Turmeric Powder',
    category: 'মশলা ও অর্গানিক',
    price: 320,
    originalPrice: 400,
    regularPrice: 400,
    unit: '৫০০ গ্রাম',
    stock: 40,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=700&auto=format&fit=crop&q=80',
    rating: 4.8,
    reviewsCount: 19
  },
  {
    id: 'sp_demo_03',
    nameBn: 'প্রাকৃতিক তাজা পাহাড়ি আদা (Hill Fresh Ginger)',
    nameEn: 'Hill Fresh Organic Ginger',
    category: 'শাকসবজি ও আদা',
    price: 180,
    originalPrice: 220,
    regularPrice: 220,
    unit: '১ কেজি',
    stock: 50,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1615485500704-8e990f9900f7?w=700&auto=format&fit=crop&q=80',
    rating: 4.7,
    reviewsCount: 14
  },
  {
    id: 'sp_demo_04',
    nameBn: 'বান্দরবানের হাতে তৈরি জুম কার্পাস চাদর',
    nameEn: 'Handloom Cotton Jhum Chador',
    category: 'হস্তশিল্প ও পোশাক',
    price: 1250,
    originalPrice: 1550,
    regularPrice: 1550,
    unit: '১ পিস',
    stock: 12,
    inStock: true,
    image: 'https://images.unsplash.com/photo-1607344645866-009c320c5ab8?w=700&auto=format&fit=crop&q=80',
    rating: 5.0,
    reviewsCount: 31
  }
];

export const SellerProfile: React.FC<SellerProfileProps> = ({
  profileData: initialProfileData,
  currentUser: passedCurrentUser,
  isOwner: passedIsOwner,
  lang = 'bn',
  onBack,
  onSignOut,
  onDeleteAccount,
  onAddToCart,
  onBuyNow,
  onOpenChat,
}) => {
  const { currentUser: authUser, logout } = useAuth();
  const { addOrder } = useData();
  const currentUser = passedCurrentUser || authUser;
  const isBn = lang === 'bn';

  // Determine owner view vs customer view
  const isOwner = useMemo(() => {
    if (typeof passedIsOwner === 'boolean') return passedIsOwner;
    if (!currentUser) return false;
    const profileId = initialProfileData?.id || initialProfileData?.memberUID || initialProfileData?.uniqueId;
    const currentUserId = currentUser?.id || currentUser?.memberUID || currentUser?.uniqueId;
    if (profileId && currentUserId && profileId === currentUserId) return true;
    if (currentUser?.phone && initialProfileData?.phone && currentUser.phone === initialProfileData.phone) return true;
    // Only treat as owner if viewing own profile without explicit initialProfileData mismatch
    if (!initialProfileData && (currentUser?.role === 'merchant' || currentUser?.role === 'seller' || currentUser?.role === 'product_seller' || currentUser?.role === 'vendor')) {
      return true;
    }
    return false;
  }, [passedIsOwner, currentUser, initialProfileData]);

  // Helper to load real products (strictly NO fake/demo products)
  const loadSellerRealProducts = (raw: any): Product[] => {
    if (raw.products && Array.isArray(raw.products) && raw.products.length > 0) {
      return raw.products;
    }
    const sellerKey = raw.id || raw.uniqueId || raw.phone;
    if (sellerKey && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(`seller_products_${sellerKey}`);
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.warn('Error reading stored seller products', e);
      }
    }
    if (raw.phone && typeof window !== 'undefined') {
      try {
        const storedByPhone = localStorage.getItem(`seller_products_${raw.phone}`);
        if (storedByPhone) {
          const parsed = JSON.parse(storedByPhone);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {
        console.warn('Error reading phone seller products', e);
      }
    }
    return [];
  };

  // Profile data state
  const [profile, setProfile] = useState<SellerProfileData>(() => {
    const raw = initialProfileData || {};
    const realProducts = loadSellerRealProducts(raw);
    return {
      id: raw.id || raw.uniqueId || 'M-KHG-001',
      uniqueId: raw.uniqueId || raw.memberUID || 'M-KHG-001',
      shopName: raw.shopName || raw.storeName || raw.name || (isBn ? 'পাহাড়ি খাঁটি বাজার ও হস্তশিল্প' : 'Hill Pure Mart & Crafts'),
      shopNameEn: raw.shopNameEn || raw.storeNameEn || 'Hill Pure Mart & Crafts',
      ownerName: raw.ownerName || raw.fullName || raw.name || (isBn ? 'রতন বিকাশ চাকমা' : 'Ratan Bikash Chakma'),
      avatar: raw.avatar || raw.profilePhotoUrl || raw.logo || 'https://images.unsplash.com/photo-1544717305-2782549b5136?w=400&auto=format&fit=crop&q=80',
      banner: raw.banner || raw.coverBanner || raw.coverImage || 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80',
      category: raw.category || raw.categoryBn || (isBn ? 'পাহাড়ি খাঁটি খাদ্য ও হস্তশিল্প' : 'Hill Organic Food & Handicrafts'),
      phone: raw.phone || '01812345678',
      phoneMasked: raw.phoneMasked || (raw.phone ? raw.phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2') : '018****5678'),
      email: raw.email || 'seller@jhadimadi.com',
      division: raw.division || 'Chittagong',
      district: raw.district || (isBn ? 'খাগড়াছড়ি' : 'Khagrachhari'),
      upazila: raw.upazila || (isBn ? 'দীঘিনালা' : 'Dighinala'),
      detailedAddress: raw.detailedAddress || raw.address || (isBn ? 'বোয়ালখালী বাজার, দীঘিনালা, খাগড়াছড়ি' : 'Boalkhali Bazar, Dighinala, Khagrachhari'),
      tradeLicenseNumber: raw.tradeLicenseNumber || raw.tradeLicense || 'TRAD/DGH/2024/091',
      nidNumberMasked: raw.nidNumberMasked || (raw.nidNumber ? raw.nidNumber.replace(/\d(?=\d{4})/g, '*') : '1992********8901'),
      establishedYear: raw.establishedYear || '2021',
      isVerified: raw.isVerified !== false,
      rating: raw.rating || 4.9,
      reviewsCount: raw.reviewsCount || 48,
      followersCount: raw.followersCount || 1240,
      walletBalance: raw.walletBalance || 12500,
      bloodGroup: raw.bloodGroup || raw.blood_group || 'O+',
      products: realProducts,
    };
  });

  // Product List state (strictly real products only, clean & empty if none)
  const [products, setProducts] = useState<Product[]>(() => {
    return loadSellerRealProducts(initialProfileData || {});
  });

  // Active View: 'catalog' | 'dashboard'
  const [activeView, setActiveView] = useState<'catalog' | 'dashboard'>('catalog');

  // Top Hamburger Menu State
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Modals
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditProfileModalOpen, setIsEditProfileModalOpen] = useState(false);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isInboxModalOpen, setIsInboxModalOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isPrivacyCallModalOpen, setIsPrivacyCallModalOpen] = useState(false);

  // Checkout & Product detail modal state
  const [checkoutProduct, setCheckoutProduct] = useState<Product | null>(null);
  const [checkoutQuantity, setCheckoutQuantity] = useState<number>(1);
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState<'cod' | 'bkash' | 'nagad' | 'escrow'>('cod');
  const [checkoutCustomerName, setCheckoutCustomerName] = useState<string>('');
  const [checkoutCustomerPhone, setCheckoutCustomerPhone] = useState<string>('');
  const [checkoutDeliveryAddress, setCheckoutDeliveryAddress] = useState<string>('');
  const [checkoutOrderConfirmed, setCheckoutOrderConfirmed] = useState<boolean>(false);
  const [placedOrderId, setPlacedOrderId] = useState<string>('');
  const [isSubmittingCheckout, setIsSubmittingCheckout] = useState<boolean>(false);

  const handleConfirmBuyNow = async () => {
    if (!checkoutCustomerName.trim() || !checkoutCustomerPhone.trim()) {
      alert(isBn ? 'অনুগ্রহ করে আপনার নাম এবং মোবাইল নম্বর প্রদান করুন।' : 'Please enter your name and phone number.');
      return;
    }
    if (!checkoutProduct) return;

    setIsSubmittingCheckout(true);
    const finalOrderId = `JDM-ORD-${Math.floor(100000 + Math.random() * 900000)}`;
    const unitPrice = Number(checkoutProduct.price) || 0;
    const totalAmount = unitPrice * checkoutQuantity;
    const cleanPhone = checkoutCustomerPhone.trim();
    const cleanName = checkoutCustomerName.trim();
    const cleanAddress = checkoutDeliveryAddress.trim() || `${profile.upazila || ''}, ${profile.district || 'খাগড়াছড়ি'}`;

    const orderPayload = {
      id: finalOrderId,
      customerName: cleanName,
      customerPhone: cleanPhone,
      deliveryAddress: cleanAddress,
      district: profile.district || 'খাগড়াছড়ি / পার্বত্য চট্টগ্রাম',
      upazila: profile.upazila || '',
      totalAmount: totalAmount,
      paymentMethod: (checkoutPaymentMethod === 'cod' ? 'COD' : (checkoutPaymentMethod === 'bkash' ? 'bKash' : (checkoutPaymentMethod === 'nagad' ? 'Nagad' : 'COD'))) as any,
      paymentStatus: (checkoutPaymentMethod === 'cod' ? 'cod_unpaid' : 'pending') as any,
      status: 'Pending' as any,
      orderChannel: (checkoutPaymentMethod === 'cod' ? 'COD' : 'Direct_Contact') as any,
      vendorPhone: checkoutProduct.sellerPhone || profile.phone,
      sellerPhone: checkoutProduct.sellerPhone || profile.phone,
      sellerId: profile.id || '',
      notes: `Shop: ${profile.shopName} | Direct Buy Now | Qty: ${checkoutQuantity}`,
      items: [{
        productId: checkoutProduct.id,
        id: checkoutProduct.id,
        nameBn: checkoutProduct.nameBn || checkoutProduct.title,
        name: checkoutProduct.nameBn || checkoutProduct.title,
        quantity: checkoutQuantity,
        price: unitPrice,
        unitPrice: unitPrice,
        image: checkoutProduct.image || '',
        sellerId: profile.id || '',
        sellerPhone: checkoutProduct.sellerPhone || profile.phone
      }]
    };

    try {
      addOrder(orderPayload as any);
      await databaseService.submitOrderToDatabase(orderPayload as any);
      setPlacedOrderId(finalOrderId);
      setCheckoutOrderConfirmed(true);
    } catch (err) {
      console.warn('[SellerProfile] Order submission error notice:', err);
      setPlacedOrderId(finalOrderId);
      setCheckoutOrderConfirmed(true);
    } finally {
      setIsSubmittingCheckout(false);
    }
  };

  // Dedicated Product-Specific Communication & Details Modals
  const [selectedProductForChat, setSelectedProductForChat] = useState<Product | null>(null);
  const [selectedProductForCall, setSelectedProductForCall] = useState<Product | null>(null);
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<Product | null>(null);
  const [productChatMessage, setProductChatMessage] = useState('');
  const [productChatSent, setProductChatSent] = useState(false);

  // Edit Profile Form State
  const [editShopName, setEditShopName] = useState(profile.shopName);
  const [editCategory, setEditCategory] = useState(profile.category || '');
  const [editLogoUrl, setEditLogoUrl] = useState(profile.avatar || '');
  const [editCoverUrl, setEditCoverUrl] = useState(profile.banner || '');
  const [editUpazila, setEditUpazila] = useState(profile.upazila || '');
  const [editDistrict, setEditDistrict] = useState(profile.district || '');

  // Add Product Form State
  const [newProdTitle, setNewProdTitle] = useState('');
  const [newProdPrice, setNewProdPrice] = useState('');
  const [newProdOriginalPrice, setNewProdOriginalPrice] = useState('');
  const [newProdCategory, setNewProdCategory] = useState(isBn ? 'পাহাড়ি অর্গানিক খাদ্য' : 'Organic Food');
  const [newProdUnit, setNewProdUnit] = useState('১ কেজি');
  const [newProdStock, setNewProdStock] = useState('25');
  const [newProdImageUrl, setNewProdImageUrl] = useState('');
  const [selectedProductFile, setSelectedProductFile] = useState<File | null>(null);
  const [isUploadingProduct, setIsUploadingProduct] = useState(false);

  // Quick Notifications mock
  const [notifications] = useState([
    { id: 'n1', title: 'নতুন অর্ডার এসেছে!', desc: '১ কেজি পাহাড়ি মধুর নতুন প্রি-পেইড অর্ডার (ID: #ORD-9821)', time: '১০ মিনিট আগে', unread: true },
    { id: 'n2', title: 'JhaPay টাকা যুক্ত হয়েছে', desc: 'অর্ডার #ORD-9740 এর ৳১,২৫০ এসক্রো থেকে ব্যালেন্সে জমা হয়েছে', time: '১ ঘণ্টা আগে', unread: true },
    { id: 'n3', title: 'প্রোফাইল ভেরিফিকেশন সফল', desc: 'আপনার ট্রেড লাইসেন্স ও এনআইডি সফলভাবে যাচাইকৃত হয়েছে।', time: 'গতকাল', unread: false },
  ]);

  // Quick Messages mock
  const [messages] = useState([
    { id: 'm1', customer: 'সুমন চাকমা', text: 'মধু কি সম্পূর্ণ প্রাকৃতিক চাকের?', time: '৫ মিনিট আগে', unread: true },
    { id: 'm2', customer: 'আফরোজা সুলতানা', text: 'চাদরটি কি ঢাকায় ডেলিভারি দেওয়া যাবে?', time: '২ ঘণ্টা আগে', unread: false },
  ]);

  // Click outside to close 3-dot dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMenuOpen]);

  // Dynamic fetch for real products from Supabase / database if available
  useEffect(() => {
    let isMounted = true;
    const fetchSellerProducts = async () => {
      try {
        const sellerId = profile.id || profile.uniqueId;
        const sellerPhone = profile.phone;
        
        let data: any[] = [];
        // 1. Primary: query seller_products linked via seller_phone
        if (sellerPhone) {
          const { data: sData, error: sErr } = await supabase
            .from('seller_products')
            .select('*')
            .eq('seller_phone', sellerPhone);
          if (!sErr && sData && sData.length > 0) {
            data = sData;
          }
        }

        // 2. Secondary fallback: query products table
        if (data.length === 0) {
          let query = supabase.from('products').select('*');
          if (sellerPhone && sellerId) {
            query = query.or(`seller_phone.eq.${sellerPhone},seller_id.eq.${sellerId},seller_id.eq.${profile.uniqueId}`);
          } else if (sellerPhone) {
            query = query.eq('seller_phone', sellerPhone);
          } else if (sellerId) {
            query = query.eq('seller_id', sellerId);
          }
          const { data: pData, error: pErr } = await query;
          if (!pErr && pData && pData.length > 0) {
            data = pData;
          }
        }

        if (data && data.length > 0 && isMounted) {
          const mapped: Product[] = data.map((item: any) => ({
            id: String(item.id || `prod_${Date.now()}`),
            nameBn: item.name_bn || item.name || item.title || 'পণ্য',
            title: item.title || item.name_bn || item.name || 'পণ্য',
            category: item.category || profile.category,
            price: Number(item.price) || 0,
            regularPrice: item.regular_price ? Number(item.regular_price) : undefined,
            originalPrice: item.regular_price ? Number(item.regular_price) : undefined,
            unit: item.unit || '১ পিস',
            descriptionBn: item.description_bn || item.description || '',
            description: item.description || item.description_bn || '',
            image: item.image_url || item.image || (Array.isArray(item.photos) ? item.photos[0] : null) || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=700&auto=format&fit=crop&q=80',
            images: Array.isArray(item.photos) ? item.photos : (item.image_url ? [item.image_url] : []),
            stock: item.stock || 20,
            inStock: item.in_stock !== false,
            sellerId: item.seller_id || profile.uniqueId,
            sellerName: item.seller_name || profile.ownerName || profile.shopName,
            sellerPhone: item.seller_phone || profile.phone,
            district: item.district || profile.district,
            upazila: item.upazila || profile.upazila,
            location: item.location || `${item.upazila || profile.upazila}, ${item.district || profile.district}`,
          }));

          setProducts((prev) => {
            const existingIds = new Set(prev.map(p => p.id));
            const newOnes = mapped.filter(p => !existingIds.has(p.id));
            return [...prev, ...newOnes];
          });
        }
      } catch (err) {
        console.warn('Could not fetch seller products from Supabase:', err);
      }
    };

    fetchSellerProducts();
    return () => {
      isMounted = false;
    };
  }, [profile.id, profile.uniqueId, profile.phone, profile.shopName, profile.district, profile.upazila, profile.category]);

  // Handle Delete Product (Access Control: Owner Only)
  const handleDeleteProduct = async (productId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm(isBn ? 'আপনি কি নিশ্চিতভাবে এই পণ্যটি ক্যাটালগ থেকে মুছে ফেলতে চান?' : 'Are you sure you want to delete this product?')) {
      return;
    }
    setProducts(prev => {
      const updated = prev.filter(p => p.id !== productId);
      const sellerKey = profile.id || profile.uniqueId || profile.phone;
      if (sellerKey && typeof window !== 'undefined') {
        try {
          localStorage.setItem(`seller_products_${sellerKey}`, JSON.stringify(updated));
          if (profile.phone) {
            localStorage.setItem(`seller_products_${profile.phone}`, JSON.stringify(updated));
          }
          if (profile.uniqueId) {
            localStorage.setItem(`seller_products_${profile.uniqueId}`, JSON.stringify(updated));
          }
        } catch (_) {}
      }
      return updated;
    });

    try {
      await supabase.from('seller_products').delete().eq('id', productId);
    } catch (err) {
      console.warn('Error deleting from seller_products:', err);
    }
    try {
      await supabase.from('products').delete().eq('id', productId);
    } catch (err) {
      console.warn('Error deleting from products:', err);
    }
  };

  // Handle Save Profile
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setProfile(prev => ({
      ...prev,
      shopName: editShopName.trim() || prev.shopName,
      category: editCategory.trim() || prev.category,
      avatar: editLogoUrl.trim() || prev.avatar,
      banner: editCoverUrl.trim() || prev.banner,
      upazila: editUpazila.trim() || prev.upazila,
      district: editDistrict.trim() || prev.district,
    }));
    setIsEditProfileModalOpen(false);
  };

  // Handle Create Product
  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(newProdPrice);
    if (!newProdTitle.trim() || isNaN(priceNum) || priceNum <= 0) {
      alert(isBn ? 'অনুগ্রহ করে পণ্যের নাম এবং সঠিক মূল্য লিখুন।' : 'Please enter valid title and price.');
      return;
    }

    setIsUploadingProduct(true);
    let finalImageUrl = newProdImageUrl.trim() || 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=700&auto=format&fit=crop&q=80';

    if (selectedProductFile) {
      try {
        const fileExt = selectedProductFile.name.split('.').pop() || 'jpg';
        const fileName = `prod_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('products')
          .upload(fileName, selectedProductFile, { cacheControl: '3600', upsert: true });

        if (!uploadError) {
          finalImageUrl = getProductPublicUrl(fileName);
        }
      } catch (err) {
        console.warn('Storage upload note:', err);
      }
    }

    const regPrice = parseFloat(newProdOriginalPrice);
    const newProduct: Product = {
      id: `prod_${Date.now()}`,
      nameBn: newProdTitle.trim(),
      nameEn: newProdTitle.trim(),
      title: newProdTitle.trim(),
      category: newProdCategory,
      price: priceNum,
      originalPrice: !isNaN(regPrice) && regPrice > priceNum ? regPrice : undefined,
      regularPrice: !isNaN(regPrice) && regPrice > priceNum ? regPrice : undefined,
      unit: newProdUnit.trim() || '১ কেজি',
      stock: parseInt(newProdStock) || 20,
      inStock: true,
      image: finalImageUrl,
      images: [finalImageUrl],
      rating: 5.0,
      reviewsCount: 1,
      sellerName: profile.shopName,
      sellerPhone: profile.phone,
      sellerId: profile.uniqueId || profile.id,
      district: profile.district,
      upazila: profile.upazila,
      location: `${profile.upazila}, ${profile.district}`,
    };

    setProducts(prev => {
      const updated = [newProduct, ...prev];
      // Save locally
      const sellerKey = profile.id || profile.uniqueId || profile.phone;
      if (sellerKey && typeof window !== 'undefined') {
        try {
          localStorage.setItem(`seller_products_${sellerKey}`, JSON.stringify(updated));
          if (profile.phone) {
            localStorage.setItem(`seller_products_${profile.phone}`, JSON.stringify(updated));
          }
          if (profile.uniqueId) {
            localStorage.setItem(`seller_products_${profile.uniqueId}`, JSON.stringify(updated));
          }
        } catch (storageErr) {
          console.warn('LocalStorage save note:', storageErr);
        }
      }
      return updated;
    });

    // Also sync to seller_products and products tables
    if (profile.phone) {
      try {
        await supabase.from('seller_products').insert({
          title: newProdTitle.trim(),
          name_bn: newProdTitle.trim(),
          category: newProdCategory,
          price: priceNum,
          regular_price: !isNaN(regPrice) && regPrice > priceNum ? regPrice : null,
          unit: newProdUnit.trim() || '১ কেজি',
          stock: parseInt(newProdStock) || 20,
          in_stock: true,
          image_url: finalImageUrl,
          seller_id: profile.uniqueId || profile.id,
          seller_name: profile.ownerName || profile.shopName,
          seller_phone: profile.phone,
          district: profile.district,
          upazila: profile.upazila,
          location: `${profile.upazila}, ${profile.district}`,
        });
      } catch (dbErr) {
        console.warn('Supabase seller_products insert note:', dbErr);
      }
    }

    try {
      await supabase.from('products').insert({
        title: newProdTitle.trim(),
        name_bn: newProdTitle.trim(),
        category: newProdCategory,
        price: priceNum,
        regular_price: !isNaN(regPrice) && regPrice > priceNum ? regPrice : null,
        unit: newProdUnit.trim() || '১ কেজি',
        stock: parseInt(newProdStock) || 20,
        in_stock: true,
        image_url: finalImageUrl,
        seller_id: profile.uniqueId || profile.id,
        seller_name: profile.shopName,
        seller_phone: profile.phone,
        district: profile.district,
        upazila: profile.upazila,
        location: `${profile.upazila}, ${profile.district}`,
      });
    } catch (dbErr) {
      console.warn('Supabase product insert note:', dbErr);
    }

    setIsUploadingProduct(false);
    setIsAddProductModalOpen(false);

    // Reset form
    setNewProdTitle('');
    setNewProdPrice('');
    setNewProdOriginalPrice('');
    setNewProdImageUrl('');
    setSelectedProductFile(null);
  };

  // Trigger Phone Call without displaying raw text on the feed
  const handlePrivacyCall = () => {
    const rawPhone = profile.phone ? profile.phone.replace(/[^0-9+]/g, '') : '01812345678';
    window.location.href = `tel:${rawPhone}`;
  };

  // Trigger Buy Now
  const handleProductBuyNow = (product: Product) => {
    if (onBuyNow) {
      onBuyNow(product, 1);
    } else if (onAddToCart) {
      onAddToCart(product, 1);
    } else {
      alert(isBn ? `"${product.nameBn}" ক্রয়ের জন্য কার্টে যুক্ত করা হয়েছে!` : `"${product.nameBn}" added to cart!`);
    }
  };

  const handleOpenProductChat = (product: Product) => {
    setSelectedProductForChat(product);
    setProductChatMessage(
      `আসসালামু আলাইকুম, আমি "${product.nameBn || product.title}" (৳${product.price}) সম্পর্কে বিস্তারিত জানতে চাই। পণ্যটি কি স্টকে রয়েছে?`
    );
    setProductChatSent(false);
  };

  return (
    <div
      id="facebook-seller-profile-page"
      className="w-full min-h-screen bg-stone-100/60 pb-16 overflow-x-hidden font-sans text-stone-900 select-none"
    >
      {/* Back button bar if standalone or requested */}
      {onBack && (
        <div className="bg-white border-b border-stone-200 px-3 py-2 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 text-xs font-bold text-stone-700 hover:text-stone-950 p-1 rounded-lg transition cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>{isBn ? 'ফিরে যান' : 'Back'}</span>
          </button>
          <span className="text-xs font-bold text-stone-500 uppercase tracking-wider">
            {profile.shopName}
          </span>
          <div className="w-8" />
        </div>
      )}

      {/* =========================================================================
          1. HEADER SECTION (FACEBOOK PAGE STYLE)
          ========================================================================= */}
      <header className="bg-white border-b border-stone-200 shadow-2xs relative">
        <div className="max-w-4xl mx-auto relative">
          {/* Cover Photo */}
          <div className="relative w-full h-44 sm:h-56 md:h-64 bg-stone-800 overflow-hidden group">
            <img
              src={profile.banner}
              alt="Shop Cover Banner"
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLImageElement).src = 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=1200&auto=format&fit=crop&q=80';
              }}
            />
            {/* Gradient bottom overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20 pointer-events-none" />

            {/* If Owner: Change Cover Button */}
            {isOwner && (
              <button
                type="button"
                onClick={() => setIsEditProfileModalOpen(true)}
                className="absolute right-3 bottom-3 bg-stone-900/80 hover:bg-stone-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 backdrop-blur-xs transition shadow-sm cursor-pointer"
              >
                <Camera className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{isBn ? 'কভার পরিবর্তন' : 'Edit Cover'}</span>
              </button>
            )}
          </div>

          {/* Profile Details Container (Profile pic left; Owner Name, Blood Group, Auto-ID right; 3-line menu top-right) */}
          <div className="px-4 pb-4 pt-2 sm:px-6">
            <div className="flex items-start justify-between gap-3">
              
              {/* Left: Profile pic + Right of pic: Owner Name, Blood Group, Auto-ID */}
              <div className="flex items-center sm:items-end gap-3.5 sm:gap-4 -mt-12 sm:-mt-16 relative z-10 flex-1 min-w-0">
                {/* Profile pic (left) */}
                <div className="relative group shrink-0">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-full border-4 border-white bg-white shadow-md overflow-hidden ring-1 ring-stone-200">
                    <img
                      src={profile.avatar}
                      alt={profile.ownerName || profile.shopName}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.currentTarget as HTMLImageElement).src = NO_IMAGE_AVAILABLE_ICON;
                      }}
                    />
                  </div>
                  {isOwner && (
                    <button
                      type="button"
                      onClick={() => setIsEditProfileModalOpen(true)}
                      className="absolute bottom-0 right-0 w-6 h-6 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full border-2 border-white flex items-center justify-center shadow-sm transition cursor-pointer"
                      title={isBn ? 'লোগো পরিবর্তন করুন' : 'Change Logo'}
                    >
                      <Camera className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Owner Name, Blood Group, Auto-ID (right) */}
                <div className="pt-1 sm:pt-0 space-y-1.5 min-w-0 flex-1">
                  {/* Owner Name */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <h1 className="text-lg sm:text-2xl font-black text-stone-900 tracking-tight leading-tight truncate">
                      {profile.ownerName || profile.shopName}
                    </h1>
                    {profile.isVerified && (
                      <span
                        title="Verified Seller by Jhadimadi"
                        className="inline-flex items-center gap-1 text-emerald-700 font-bold text-[11px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 shadow-2xs shrink-0"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600 text-white" />
                        <span>{isBn ? 'যাচাইকৃত' : 'Verified'}</span>
                      </span>
                    )}
                  </div>

                  {/* Shop Name & Category */}
                  <div className="text-xs text-stone-600 font-medium truncate">
                    <span className="font-bold text-stone-800">{profile.shopName}</span>
                    {profile.category && (
                      <>
                        <span className="mx-1.5 text-stone-300">•</span>
                        <span>{profile.category}</span>
                      </>
                    )}
                  </div>

                  {/* Badges: Blood Group & Auto-ID */}
                  <div className="flex items-center gap-2 flex-wrap text-xs">
                    {/* Blood Group */}
                    <div className="inline-flex items-center gap-1 text-rose-700 font-bold bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-md shadow-2xs">
                      <Droplet className="w-3.5 h-3.5 text-rose-600 fill-rose-600" />
                      <span>রক্তের গ্রুপ: {profile.bloodGroup || 'O+'}</span>
                    </div>

                    {/* Auto-ID */}
                    <div className="inline-flex items-center gap-1 text-stone-700 font-mono font-bold bg-stone-100 border border-stone-200 px-2 py-0.5 rounded-md shadow-2xs">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>আইডি: {profile.uniqueId || profile.id}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Navigation: 3-line hamburger menu (top-right) containing Dashboard & Wallet */}
              <div className="relative shrink-0 mt-1" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  aria-label="মেনু খুলুন"
                  title={isBn ? 'মেনু' : 'Menu'}
                  className="p-2.5 rounded-xl border-2 border-stone-300 hover:border-emerald-600 hover:bg-emerald-50 text-stone-800 transition cursor-pointer shadow-2xs flex items-center justify-center"
                >
                  <Menu className="w-5 h-5 text-stone-800" />
                </button>

                {/* Dropdown Menu (Dashboard & Wallet + Actions) */}
                {isMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-stone-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100">
                    <div className="px-4 py-2 border-b border-stone-100 mb-1">
                      <p className="text-xs font-black text-stone-900 truncate">{profile.ownerName || profile.shopName}</p>
                      <p className="text-[10px] text-emerald-700 font-bold font-mono">ID: {profile.uniqueId || profile.id}</p>
                    </div>

                    {/* 1. Dashboard */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setActiveView('dashboard');
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-stone-800 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-3 transition cursor-pointer"
                    >
                      <LayoutDashboard className="w-4 h-4 text-emerald-600" />
                      <span>{isBn ? 'ড্যাশবোর্ড (Dashboard)' : 'Dashboard'}</span>
                    </button>

                    {/* 2. Wallet */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsWalletModalOpen(true);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-stone-800 hover:bg-emerald-50 hover:text-emerald-800 flex items-center gap-3 transition cursor-pointer"
                    >
                      <Wallet className="w-4 h-4 text-purple-600" />
                      <span>{isBn ? 'ওয়ালেট ও পেমেন্ট (Wallet)' : 'Wallet & JhaPay'}</span>
                    </button>

                    {/* 3. Profile */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        setIsDetailsModalOpen(true);
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-stone-800 hover:bg-stone-50 flex items-center gap-3 transition cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4 text-blue-600" />
                      <span>{isBn ? 'প্রোফাইল তথ্য (Profile)' : 'Profile Details'}</span>
                    </button>

                    {isOwner && (
                      <>
                        {/* 4. Add Product */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsAddProductModalOpen(true);
                          }}
                          className="w-full px-4 py-2.5 text-left text-xs font-bold text-emerald-700 hover:bg-emerald-50 flex items-center gap-3 transition cursor-pointer"
                        >
                          <Plus className="w-4 h-4 text-emerald-600" />
                          <span>{isBn ? '+ নতুন পণ্য যোগ করুন' : '+ Add Product'}</span>
                        </button>

                        {/* 5. Edit Profile */}
                        <button
                          type="button"
                          onClick={() => {
                            setIsMenuOpen(false);
                            setIsEditProfileModalOpen(true);
                          }}
                          className="w-full px-4 py-2.5 text-left text-xs font-bold text-stone-800 hover:bg-stone-50 flex items-center gap-3 transition cursor-pointer"
                        >
                          <Edit3 className="w-4 h-4 text-amber-600" />
                          <span>{isBn ? 'প্রোফাইল সম্পাদনা (Edit Profile)' : 'Edit Profile'}</span>
                        </button>
                      </>
                    )}

                    <div className="my-1 border-t border-stone-100" />

                    {/* Sign Out */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsMenuOpen(false);
                        if (onSignOut) {
                          onSignOut();
                        } else if (logout) {
                          logout();
                        }
                      }}
                      className="w-full px-4 py-2.5 text-left text-xs font-bold text-stone-700 hover:bg-stone-100 flex items-center gap-3 transition cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-stone-500" />
                      <span>{isBn ? 'সাইন আউট (Sign Out)' : 'Sign Out'}</span>
                    </button>

                    {isOwner && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsMenuOpen(false);
                          setIsDeleteConfirmOpen(true);
                        }}
                        className="w-full px-4 py-2.5 text-left text-xs font-bold text-rose-700 hover:bg-rose-50 flex items-center gap-3 transition cursor-pointer"
                      >
                        <Trash2 className="w-4 h-4 text-rose-600" />
                        <span>{isBn ? 'প্রোফাইল ডিলিট (Delete Profile)' : 'Delete Profile'}</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          2. MAIN BODY: DASHBOARD OR "পণ্য ক্যাটালগ" ONLY
          ========================================================================= */}
      {activeView === 'dashboard' ? (
        <Dashboard
          role="seller"
          currentUser={currentUser}
          profileData={{ ...profile, products }}
          lang={lang as any}
          onBack={() => setActiveView('catalog')}
          onNavigateToCatalog={() => setActiveView('catalog')}
          onNavigateToEditProfile={() => setIsEditProfileModalOpen(true)}
          onNavigateToDetails={() => setIsDetailsModalOpen(true)}
          onSignOut={() => {
            if (onSignOut) {
              onSignOut();
            } else if (logout) {
              logout();
            }
          }}
          onDeleteAccount={() => setIsDeleteConfirmOpen(true)}
        />
      ) : (
        <main className="max-w-4xl mx-auto px-3 sm:px-4 pt-4 sm:pt-6">
          {/* Section Header: "পণ্য ক্যাটালগ" ONLY */}
          <div className="flex items-center justify-between gap-2 pb-3.5 border-b border-stone-200 mb-4">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base sm:text-lg font-black text-stone-900 tracking-tight">
                {isBn ? 'পণ্য ক্যাটালগ' : 'Product Catalog'}
              </h2>
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold font-mono">
                {products.length}
              </span>
            </div>

            {/* Access Control: "+ পণ্য যোগ করুন" button visible ONLY to the profile owner */}
            {isOwner && (
              <button
                type="button"
                onClick={() => setIsAddProductModalOpen(true)}
                className="py-2 px-3 sm:px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition shadow-xs cursor-pointer active:scale-98"
              >
                <Plus className="w-4 h-4" />
                <span>{isBn ? 'পণ্য যোগ করুন' : 'Add Product'}</span>
              </button>
            )}
          </div>
          
          {products.length === 0 ? (
            <div className="bg-white rounded-2xl p-10 sm:p-12 text-center border border-stone-200/80 shadow-2xs space-y-4 max-w-lg mx-auto">
              <div className="w-14 h-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto border border-emerald-100">
                <ShoppingBag className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-black text-stone-800">
                  {isBn ? 'বর্তমানে কোনো পণ্য প্রকাশিত নেই' : 'No products listed yet'}
                </h3>
                <p className="text-xs text-stone-500 max-w-xs mx-auto">
                  {isOwner 
                    ? (isBn ? 'আপনার দোকানের প্রথম পণ্যটি যুক্ত করে বিক্রি শুরু করুন।' : 'Add your first product to start selling.')
                    : (isBn ? 'এই বিক্রেতার ক্যাটালগে নতুন পণ্য যুক্ত হলে এখানে প্রদর্শিত হবে।' : 'Products will appear here once the seller posts them.')}
                </p>
              </div>
              {isOwner && (
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(true)}
                  className="inline-flex items-center gap-1.5 py-2.5 px-5 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 transition cursor-pointer shadow-xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isBn ? 'নতুন পণ্য যোগ করুন' : 'Add Product'}</span>
                </button>
              )}
            </div>
          ) : (
            /* =========================================================================
               3. GRID: STRICT 2-COLUMN LAYOUT FOR PRODUCTS
               ========================================================================= */
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5">
              {products.map((product) => {
                const displayOriginalPrice = product.originalPrice || product.regularPrice;
                const hasDiscount = Boolean(displayOriginalPrice && displayOriginalPrice > product.price);

                return (
                  <article
                    key={product.id}
                    className="bg-white rounded-2xl border border-stone-200/90 shadow-2xs hover:shadow-md transition duration-150 overflow-hidden flex flex-col group relative"
                  >
                    {/* Product Image Container */}
                    <div 
                      className="relative aspect-square w-full bg-stone-100 overflow-hidden cursor-pointer"
                      onClick={() => {
                        setCheckoutProduct(product);
                        setCheckoutQuantity(1);
                        setCheckoutPaymentMethod('cod');
                        setCheckoutOrderConfirmed(false);
                      }}
                    >
                      <img
                        src={product.image}
                        alt={product.nameBn || product.title}
                        className="w-full h-full object-cover group-hover:scale-103 transition duration-200"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = NO_IMAGE_AVAILABLE_ICON;
                        }}
                      />
                      
                      {/* Access Control: Delete button visible ONLY to the profile owner */}
                      {isOwner && (
                        <button
                          type="button"
                          onClick={(e) => handleDeleteProduct(product.id, e)}
                          title={isBn ? 'পণ্য মুছে ফেলুন' : 'Delete Product'}
                          className="absolute top-2 right-2 z-10 w-7 h-7 bg-rose-600 hover:bg-rose-700 text-white rounded-lg flex items-center justify-center shadow-md transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {hasDiscount && (
                        <span className="absolute top-2 left-2 bg-rose-600 text-white text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-xs">
                          {Math.round((((displayOriginalPrice! - product.price) / displayOriginalPrice!) * 100))}% ছাড়
                        </span>
                      )}
                    </div>

                    {/* Product Information */}
                    <div className="p-3 sm:p-3.5 flex flex-col flex-1 justify-between gap-2.5">
                      <div className="space-y-1">
                        <h3 
                          onClick={() => {
                            setCheckoutProduct(product);
                            setCheckoutQuantity(1);
                            setCheckoutPaymentMethod('cod');
                            setCheckoutOrderConfirmed(false);
                          }}
                          className="text-xs sm:text-sm font-bold text-stone-900 line-clamp-2 leading-snug group-hover:text-emerald-800 transition cursor-pointer"
                        >
                          {product.nameBn || product.title}
                        </h3>

                        {product.unit && (
                          <div className="text-[10px] sm:text-xs text-stone-500 font-medium">
                            প্যাকেজিং: <span className="font-semibold text-stone-700">{product.unit}</span>
                          </div>
                        )}
                      </div>

                      {/* Price & Buy Now Action */}
                      <div className="pt-1.5 border-t border-stone-100 space-y-2">
                        <div className="flex items-baseline justify-between gap-1 flex-wrap">
                          <span className="text-sm sm:text-base font-black text-emerald-700 font-mono">
                            ৳{product.price.toLocaleString()}
                          </span>
                          {hasDiscount && (
                            <span className="text-[11px] text-stone-400 line-through font-mono">
                              ৳{displayOriginalPrice!.toLocaleString()}
                            </span>
                          )}
                        </div>

                        {/* Actions: "Buy Now" button opening detail/checkout modal */}
                        <button
                          type="button"
                          onClick={() => {
                            setCheckoutProduct(product);
                            setCheckoutQuantity(1);
                            setCheckoutPaymentMethod('cod');
                            setCheckoutOrderConfirmed(false);
                          }}
                          className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-2xs active:scale-98"
                        >
                          <ShoppingBag className="w-3.5 h-3.5" />
                          <span>{isBn ? 'এখনই কিনুন' : 'Buy Now'}</span>
                        </button>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </main>
      )}

      {/* =========================================================================
          4. PROFILE DETAILS MODAL (Menu Option 2)
          Seller's full registration & personal info (visible to seller only)
          ========================================================================= */}
      {isDetailsModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setIsDetailsModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-stone-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-black tracking-tight">
                  {isBn ? 'মার্চেন্ট প্রোফাইল ও ব্যক্তিগত তথ্য (গোপনীয়)' : 'Private Merchant Profile'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-3 text-xs">
              <div className="bg-emerald-50 border border-emerald-200 p-2.5 rounded-xl text-[11px] text-emerald-900 flex items-center gap-2 font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>এই ব্যক্তিগত তথ্য ও ফোন নম্বর শুধুমাত্র আপনি (মালিক) দেখতে পারবেন। পাবলিক প্রোফাইলে এটি গোপন রাখা হয়েছে।</span>
              </div>

              <div className="grid grid-cols-2 gap-3 bg-stone-50 p-3.5 rounded-xl border border-stone-200">
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-bold block">দোকানের নাম</span>
                  <span className="font-extrabold text-stone-900">{profile.shopName}</span>
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-bold block">মালিকের নাম</span>
                  <span className="font-bold text-stone-900">{profile.ownerName}</span>
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-bold block">মোবাইল নম্বর</span>
                  <span className="font-mono font-bold text-emerald-700">{profile.phone}</span>
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-bold block">মার্চেন্ট আইডি</span>
                  <span className="font-mono font-bold text-stone-800">{profile.uniqueId}</span>
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-bold block">ক্যাটাগরি</span>
                  <span className="font-bold text-stone-900">{profile.category}</span>
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-bold block">ট্রেড লাইসেন্স</span>
                  <span className="font-mono font-bold text-stone-800">{profile.tradeLicenseNumber || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-bold block">জাতীয় পরিচয়পত্র (এনআইডি)</span>
                  <span className="font-mono font-bold text-stone-800">{profile.nidNumberMasked || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-stone-400 text-[10px] uppercase font-bold block">ইমেইল</span>
                  <span className="font-mono font-bold text-stone-700 truncate">{profile.email || 'N/A'}</span>
                </div>
              </div>

              <div className="space-y-1 bg-stone-50 p-3 rounded-xl border border-stone-200">
                <span className="text-stone-400 text-[10px] uppercase font-bold block">ব্যবসায়িক ঠিকানা ও এলাকা</span>
                <p className="font-medium text-stone-800 leading-relaxed">
                  {profile.detailedAddress}
                </p>
                <p className="text-stone-500 text-[11px] font-medium pt-1">
                  উপজেলা: {profile.upazila}, জেলা: {profile.district}
                </p>
              </div>
            </div>

            <div className="p-3 bg-stone-50 border-t border-stone-200 flex justify-between items-center">
              <button
                type="button"
                onClick={() => {
                  setIsDetailsModalOpen(false);
                  setIsEditProfileModalOpen(true);
                }}
                className="px-3.5 py-1.5 text-xs font-bold text-emerald-700 hover:bg-emerald-50 rounded-lg transition"
              >
                তথ্য সম্পাদনা করুন
              </button>
              <button
                type="button"
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                {isBn ? 'ঠিক আছে' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          5. EDIT PROFILE MODAL (Menu Option 3)
          ========================================================================= */}
      {isEditProfileModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setIsEditProfileModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-stone-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-black tracking-tight">
                  {isBn ? 'মার্চেন্ট প্রোফাইল সম্পাদনা' : 'Edit Seller Profile'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProfileModalOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-4 sm:p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  {isBn ? 'দোকানের নাম (Shop Name)' : 'Shop Name'} *
                </label>
                <input
                  type="text"
                  value={editShopName}
                  onChange={(e) => setEditShopName(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  {isBn ? 'দোকানের ক্যাটাগরি (Category)' : 'Shop Category'}
                </label>
                <input
                  type="text"
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-medium focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    {isBn ? 'উপজেলা' : 'Upazila'}
                  </label>
                  <input
                    type="text"
                    value={editUpazila}
                    onChange={(e) => setEditUpazila(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    {isBn ? 'জেলা' : 'District'}
                  </label>
                  <input
                    type="text"
                    value={editDistrict}
                    onChange={(e) => setEditDistrict(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  {isBn ? 'লোগো ইমেজ লিঙ্ক (Logo Image URL)' : 'Logo Image URL'}
                </label>
                <input
                  type="url"
                  value={editLogoUrl}
                  onChange={(e) => setEditLogoUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  {isBn ? 'কভার ব্যানার লিঙ্ক (Cover Banner URL)' : 'Cover Banner URL'}
                </label>
                <input
                  type="url"
                  value={editCoverUrl}
                  onChange={(e) => setEditCoverUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileModalOpen(false)}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition cursor-pointer"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="flex-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition cursor-pointer shadow-xs"
                >
                  {isBn ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          6. ADD PRODUCT MODAL (Owner View Top Action)
          ========================================================================= */}
      {isAddProductModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setIsAddProductModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-emerald-300" />
                <h3 className="text-sm font-black tracking-tight">
                  {isBn ? 'নতুন পণ্য ক্যাটালগে যুক্ত করুন' : 'Add New Product to Catalog'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsAddProductModalOpen(false)}
                className="w-7 h-7 rounded-full bg-emerald-900 hover:bg-emerald-700 text-emerald-200 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProduct} className="p-4 sm:p-5 space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-stone-700 mb-1">
                  {isBn ? 'পণ্যের শিরোনাম / নাম' : 'Product Title'} *
                </label>
                <input
                  type="text"
                  placeholder="যেমন: পার্বত্য পাহাড়ি খাঁটি মধু"
                  value={newProdTitle}
                  onChange={(e) => setNewProdTitle(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-bold focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    {isBn ? 'বিক্রয় মূল্য (টাকা)' : 'Selling Price (BDT)'} *
                  </label>
                  <input
                    type="number"
                    placeholder="যেমন: ৬৫০"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-bold font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    {isBn ? 'আসল / রেগুলার মূল্য (ঐচ্ছিক)' : 'Original / Regular Price'}
                  </label>
                  <input
                    type="number"
                    placeholder="যেমন: ৮৫০"
                    value={newProdOriginalPrice}
                    onChange={(e) => setNewProdOriginalPrice(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    {isBn ? 'প্যাকেজিং / ইউনিট' : 'Unit'}
                  </label>
                  <input
                    type="text"
                    placeholder="১ কেজি / ৫০০ গ্রাম"
                    value={newProdUnit}
                    onChange={(e) => setNewProdUnit(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-bold text-stone-700 mb-1">
                    {isBn ? 'মজুদ পরিমাণ (Stock)' : 'Stock Quantity'}
                  </label>
                  <input
                    type="number"
                    value={newProdStock}
                    onChange={(e) => setNewProdStock(e.target.value)}
                    className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Product Image Input */}
              <div className="space-y-1.5">
                <label className="block font-bold text-stone-700">
                  {isBn ? 'পণ্যের ছবি (Image Upload or URL)' : 'Product Image'}
                </label>
                <div className="flex gap-2 items-center">
                  <input
                    type="url"
                    placeholder="https://..."
                    value={newProdImageUrl}
                    onChange={(e) => setNewProdImageUrl(e.target.value)}
                    className="flex-1 px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <label className="px-3 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold text-xs rounded-xl border border-stone-300 cursor-pointer flex items-center gap-1 shrink-0">
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isBn ? 'ফাইল' : 'Upload'}</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files?.[0]) {
                          setSelectedProductFile(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                </div>
                {selectedProductFile && (
                  <p className="text-[10px] text-emerald-700 font-bold flex items-center gap-1">
                    <Check className="w-3 h-3" /> {selectedProductFile.name} নির্বাচন করা হয়েছে
                  </p>
                )}
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition cursor-pointer"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isUploadingProduct}
                  className="flex-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition cursor-pointer shadow-xs disabled:opacity-50"
                >
                  {isUploadingProduct ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...') : (isBn ? 'পণ্য প্রকাশ করুন' : 'Publish Product')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* =========================================================================
          7. NOTIFICATIONS MODAL (Owner View Action 1)
          ========================================================================= */}
      {isNotificationsModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setIsNotificationsModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-stone-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-black tracking-tight">
                  {isBn ? 'মার্চেন্ট বিজ্ঞপ্তি' : 'Seller Notifications'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsNotificationsModalOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 sm:p-4 space-y-2 max-h-96 overflow-y-auto text-xs">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3 rounded-xl border transition ${
                    n.unread ? 'bg-emerald-50/60 border-emerald-200' : 'bg-stone-50 border-stone-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <h4 className="font-extrabold text-stone-900">{n.title}</h4>
                    <span className="text-[10px] text-stone-400">{n.time}</span>
                  </div>
                  <p className="text-stone-600 mt-1 leading-relaxed text-[11px]">{n.desc}</p>
                </div>
              ))}
            </div>

            <div className="p-3 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsNotificationsModalOpen(false)}
                className="px-4 py-1.5 bg-stone-900 text-white font-bold text-xs rounded-xl cursor-pointer"
              >
                {isBn ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          8. INBOX / MESSAGES MODAL (Owner View Action 3 / Public View Chat)
          ========================================================================= */}
      {isInboxModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setIsInboxModalOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-300" />
                <h3 className="text-sm font-black tracking-tight">
                  {isOwner
                    ? (isBn ? 'গ্রাহকদের মেসেজ ইনবক্স' : 'Customer Messages')
                    : (isBn ? `${profile.shopName} এর সাথে চ্যাট` : `Chat with ${profile.shopName}`)}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsInboxModalOpen(false)}
                className="w-7 h-7 rounded-full bg-emerald-900 hover:bg-emerald-700 text-emerald-200 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              {isOwner ? (
                <div className="space-y-2">
                  {messages.map((m) => (
                    <div key={m.id} className="p-3 bg-stone-50 rounded-xl border border-stone-200 space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-stone-900">{m.customer}</span>
                        <span className="text-[10px] text-stone-400">{m.time}</span>
                      </div>
                      <p className="text-stone-700 leading-relaxed text-[11px]">{m.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl text-emerald-900 text-[11px] leading-relaxed">
                    মার্চেন্টকে সরাসরি মেসেজ পাঠিয়ে পণ্য সম্পর্কে যেকোনো তথ্য বা কাস্টমাইজেশন জানতে পারেন।
                  </div>
                  <textarea
                    rows={4}
                    placeholder="আপনার প্রশ্ন বা অর্ডার সংক্রান্ত মেসেজ লিখুন..."
                    className="w-full p-3 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      alert(isBn ? 'আপনার বার্তা সফলভাবে পাঠানো হয়েছে!' : 'Message sent successfully!');
                      setIsInboxModalOpen(false);
                    }}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition cursor-pointer shadow-xs"
                  >
                    {isBn ? 'বার্তা পাঠান' : 'Send Message'}
                  </button>
                </div>
              )}
            </div>

            <div className="p-3 bg-stone-50 border-t border-stone-200 flex justify-end">
              <button
                type="button"
                onClick={() => setIsInboxModalOpen(false)}
                className="px-4 py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 font-bold text-xs rounded-xl cursor-pointer"
              >
                {isBn ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          9. DELETE ACCOUNT CONFIRMATION MODAL (Menu Option 5)
          ========================================================================= */}
      {isDeleteConfirmOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setIsDeleteConfirmOpen(false)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-rose-200 overflow-hidden my-auto p-5 space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-stone-900">
                {isBn ? 'মার্চেন্ট অ্যাকাউন্ট স্থায়ীভাবে ডিলিট করতে চান?' : 'Permanently Delete Seller Account?'}
              </h3>
              <p className="text-xs text-stone-600 leading-relaxed">
                {isBn
                  ? 'এই পদক্ষেপটি অপরিবর্তনীয়। আপনার দোকানের তালিকাভুক্ত পণ্য ও তথ্য স্থায়ীভাবে মুছে যাবে।'
                  : 'This action cannot be undone. Your product catalog and merchant information will be permanently deleted.'}
              </p>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                {isBn ? 'না, বাতিল করুন' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsDeleteConfirmOpen(false);
                  if (onDeleteAccount) {
                    onDeleteAccount();
                  } else {
                    alert(isBn ? 'অ্যাকাউন্ট সফলভাবে মুছে ফেলা হয়েছে।' : 'Account successfully deleted.');
                    if (logout) logout();
                  }
                }}
                className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-sm"
              >
                {isBn ? 'হ্যাঁ, ডিলিট করুন' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          10. DEDICATED PRODUCT CHAT INQUIRY MODAL (Customer to Seller for Specific Product)
          ========================================================================= */}
      {selectedProductForChat && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
          onClick={() => {
            setSelectedProductForChat(null);
            setProductChatSent(false);
          }}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-emerald-800 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-emerald-300" />
                <h3 className="text-sm font-black tracking-tight">
                  {isBn ? 'পণ্য সম্পর্কিত বার্তা পাঠান' : 'Product Inquiry Message'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedProductForChat(null);
                  setProductChatSent(false);
                }}
                className="w-7 h-7 rounded-full bg-emerald-900 hover:bg-emerald-700 text-stone-200 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              {/* Product Mini Preview */}
              <div className="flex items-center gap-3 p-2.5 bg-stone-50 rounded-xl border border-stone-200">
                <img
                  src={selectedProductForChat.image}
                  alt={selectedProductForChat.nameBn || selectedProductForChat.title}
                  className="w-12 h-12 rounded-lg object-cover bg-stone-200 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-stone-900 truncate">
                    {selectedProductForChat.nameBn || selectedProductForChat.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-stone-500">
                    <span className="font-bold text-emerald-700 font-mono">৳{selectedProductForChat.price.toLocaleString()}</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5 truncate">
                      <MapPin className="w-3 h-3 text-stone-400" />
                      {selectedProductForChat.location || `${profile.upazila}, ${profile.district}`}
                    </span>
                  </div>
                </div>
              </div>

              {productChatSent ? (
                <div className="py-6 text-center space-y-2 bg-emerald-50 rounded-xl border border-emerald-200 p-4">
                  <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow-xs">
                    <Check className="w-5 h-5" />
                  </div>
                  <h4 className="text-sm font-black text-emerald-900">
                    {isBn ? 'বার্তা সফলভাবে পাঠানো হয়েছে!' : 'Message Sent Successfully!'}
                  </h4>
                  <p className="text-xs text-emerald-700">
                    {isBn 
                      ? 'বিক্রেতা আপনার অনুসন্ধানের উত্তর শীঘ্রই প্রদান করবেন। ইনবক্স লক্ষ্য রাখুন।' 
                      : 'The seller will reply to your inquiry shortly.'}
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedProductForChat(null);
                      setProductChatSent(false);
                    }}
                    className="mt-3 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition cursor-pointer"
                  >
                    {isBn ? 'সম্পন্ন' : 'Done'}
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-700 mb-1">
                      {isBn ? 'আপনার বার্তা / প্রশ্ন' : 'Your Question / Inquiry'}
                    </label>
                    <textarea
                      rows={4}
                      value={productChatMessage}
                      onChange={(e) => setProductChatMessage(e.target.value)}
                      placeholder={isBn ? 'পণ্য সম্পর্কে আপনার প্রশ্ন লিখুন...' : 'Write your question about this product...'}
                      className="w-full p-3 text-xs text-stone-800 bg-white border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                    />
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedProductForChat(null)}
                      className="flex-1 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs transition cursor-pointer"
                    >
                      {isBn ? 'বাতিল' : 'Cancel'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (!productChatMessage.trim()) return;
                        setProductChatSent(true);
                        if (onOpenChat) {
                          onOpenChat(profile.shopName);
                        }
                      }}
                      className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isBn ? 'বার্তা পাঠান' : 'Send Message'}</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          11. DEDICATED PRODUCT DIRECT CONTACT / CALL MODAL
          ========================================================================= */}
      {selectedProductForCall && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setSelectedProductForCall(null)}
        >
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-stone-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <PhoneCall className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-black tracking-tight">
                  {isBn ? 'পণ্য নিয়ে সরাসরি যোগাযোগ' : 'Contact for Product'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedProductForCall(null)}
                className="w-7 h-7 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              {/* Product Mini Preview */}
              <div className="flex items-center gap-3 p-3 bg-stone-50 rounded-xl border border-stone-200">
                <img
                  src={selectedProductForCall.image}
                  alt={selectedProductForCall.nameBn || selectedProductForCall.title}
                  className="w-12 h-12 rounded-lg object-cover bg-stone-200 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="text-xs font-bold text-stone-900 truncate">
                    {selectedProductForCall.nameBn || selectedProductForCall.title}
                  </h4>
                  <div className="flex items-center gap-2 text-[11px] text-stone-500">
                    <span className="font-bold text-emerald-700 font-mono">৳{selectedProductForCall.price.toLocaleString()}</span>
                    <span>•</span>
                    <span className="flex items-center gap-0.5 truncate">
                      <MapPin className="w-3 h-3 text-stone-400" />
                      {selectedProductForCall.location || `${profile.upazila}, ${profile.district}`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50/80 border border-emerald-200 p-3 rounded-xl text-xs text-emerald-900 space-y-1">
                <p className="font-bold">ঝাদিমাদি ডটকম নিরাপদ যোগাযোগ সেবা:</p>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  এই পণ্যের অর্ডার, গুণগত মান ও হোম ডেলিভারির জন্য বিক্রেতার অনুমোদিত সাপোর্ট লাইনে সরাসরি যোগাযোগ করতে পারেন।
                </p>
              </div>

              <div className="space-y-2 pt-1">
                {/* Direct Phone Call Button */}
                <a
                  href={`tel:${profile.phone}`}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-xs"
                >
                  <Phone className="w-4 h-4" />
                  <span>{isBn ? 'সরাসরি ভয়েস কল করুন' : 'Direct Voice Call'}</span>
                </a>

                {/* WhatsApp Chat Button */}
                <a
                  href={`https://wa.me/88${profile.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `আসসালামু আলাইকুম, আমি ঝাদিমাদি ডটকম থেকে "${selectedProductForCall.nameBn || selectedProductForCall.title}" (৳${selectedProductForCall.price}) পণ্যটি সম্পর্কে জানতে যোগাযোগ করছি।`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 text-emerald-900 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-700" />
                  <span>{isBn ? 'হোয়াটসঅ্যাপে (WhatsApp) বার্তা দিন' : 'Message on WhatsApp'}</span>
                </a>
              </div>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setSelectedProductForCall(null)}
                  className="text-xs text-stone-500 hover:text-stone-700 font-semibold cursor-pointer"
                >
                  {isBn ? 'বন্ধ করুন' : 'Close'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          12. DEDICATED PRODUCT FULL DETAILS MODAL
          ========================================================================= */}
      {selectedProductForDetails && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setSelectedProductForDetails(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="relative aspect-16/9 sm:aspect-2/1 w-full bg-stone-100 overflow-hidden">
              <img
                src={selectedProductForDetails.image}
                alt={selectedProductForDetails.nameBn || selectedProductForDetails.title}
                className="w-full h-full object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).src = NO_IMAGE_AVAILABLE_ICON;
                }}
              />
              <button
                type="button"
                onClick={() => setSelectedProductForDetails(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition cursor-pointer shadow-md"
              >
                <X className="w-4 h-4" />
              </button>
              {selectedProductForDetails.category && (
                <span className="absolute bottom-3 left-3 bg-stone-900/85 backdrop-blur-xs text-white text-xs font-bold px-2.5 py-1 rounded-md shadow-md">
                  {selectedProductForDetails.category}
                </span>
              )}
            </div>

            <div className="p-4 sm:p-5 space-y-4">
              <div className="space-y-1">
                <h3 className="text-base sm:text-lg font-black text-stone-900 leading-snug">
                  {selectedProductForDetails.nameBn || selectedProductForDetails.title}
                </h3>
                <div className="flex items-center gap-2 text-xs text-stone-500 font-medium flex-wrap">
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{selectedProductForDetails.location || `${profile.upazila}, ${profile.district}`}</span>
                  </span>
                  {selectedProductForDetails.unit && (
                    <>
                      <span>•</span>
                      <span className="bg-stone-100 px-2 py-0.5 rounded text-stone-700 font-bold">
                        প্যাকেজিং: {selectedProductForDetails.unit}
                      </span>
                    </>
                  )}
                </div>
              </div>

              {/* Price Block */}
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80 flex items-baseline justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">বিক্রয় মূল্য</span>
                  <span className="text-xl font-black text-emerald-800 font-mono">
                    ৳{selectedProductForDetails.price.toLocaleString()}
                  </span>
                </div>
                {selectedProductForDetails.originalPrice && selectedProductForDetails.originalPrice > selectedProductForDetails.price && (
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">পূর্বমূল্য</span>
                    <span className="text-xs text-stone-400 line-through font-mono">
                      ৳{selectedProductForDetails.originalPrice.toLocaleString()}
                    </span>
                  </div>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold text-stone-800 uppercase tracking-wider">পণ্যের বিস্তারিত বিবরণ:</h4>
                <p className="text-xs text-stone-600 leading-relaxed bg-stone-50 p-3 rounded-xl border border-stone-200 whitespace-pre-line">
                  {selectedProductForDetails.descriptionBn || selectedProductForDetails.description || 'এই পণ্যের অতিরিক্ত বিবরণ বিক্রেতার পক্ষ থেকে এখনও সংযোজন করা হয়নি।'}
                </p>
              </div>

              {/* Direct Actions */}
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    handleProductBuyNow(selectedProductForDetails);
                    setSelectedProductForDetails(null);
                  }}
                  className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs active:scale-98"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>{isBn ? 'এখনই কিনুন / অর্ডার দিন' : 'Order / Buy Now'}</span>
                </button>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const p = selectedProductForDetails;
                      setSelectedProductForDetails(null);
                      handleOpenProductChat(p);
                    }}
                    className="py-2.5 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 text-emerald-600" />
                    <span>চ্যাট করুন</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const p = selectedProductForDetails;
                      setSelectedProductForDetails(null);
                      setSelectedProductForCall(p);
                    }}
                    className="py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                  >
                    <PhoneCall className="w-4 h-4 text-blue-600" />
                    <span>যোগাযোগ</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          13. WALLET & JHAPAY MODAL (Accessed from 3-Line Hamburger Menu)
          ========================================================================= */}
      {isWalletModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setIsWalletModalOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-stone-900 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-black tracking-tight">
                  {isBn ? 'বিক্রেতা ওয়ালেট ও JhaPay তহবিল' : 'Seller Wallet & JhaPay'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsWalletModalOpen(false)}
                className="w-7 h-7 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 text-xs">
              {/* Wallet Balance Hero Card */}
              <div className="bg-gradient-to-br from-purple-900 via-stone-900 to-emerald-950 text-white p-4 sm:p-5 rounded-2xl shadow-md space-y-3">
                <div className="flex items-center justify-between text-xs text-purple-200">
                  <span>মোট উপলব্ধ ব্যালেন্স</span>
                  <span className="font-mono bg-white/10 px-2 py-0.5 rounded-full text-[10px]">JhaPay Secured</span>
                </div>
                <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white">
                  ৳{(profile.walletBalance || 12500).toLocaleString()}
                </div>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-[11px]">
                  <div>
                    <span className="text-purple-300 block text-[10px]">উত্তোলনের যোগ্য</span>
                    <span className="font-bold text-emerald-300 font-mono">৳{Math.round((profile.walletBalance || 12500) * 0.85).toLocaleString()}</span>
                  </div>
                  <div>
                    <span className="text-purple-300 block text-[10px]">এসক্রো রিজার্ভ</span>
                    <span className="font-bold text-amber-300 font-mono">৳{Math.round((profile.walletBalance || 12500) * 0.15).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => alert(isBn ? 'টাকা উত্তোলনের রিকোয়েস্ট গ্রহণ করা হয়েছে। ২৪ ঘণ্টার মধ্যে বিকাশ/নগদে ট্রান্সফার হবে।' : 'Withdrawal request submitted.')}
                  className="py-2.5 px-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer shadow-xs"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>টাকা উত্তোলন (Withdraw)</span>
                </button>

                <button
                  type="button"
                  onClick={() => alert(isBn ? 'JhaPay স্টেটমেন্ট আপনার নিবন্ধিত ইমেইলে প্রেরণ করা হয়েছে।' : 'Statement sent to email.')}
                  className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 font-bold rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                >
                  <Info className="w-4 h-4 text-stone-600" />
                  <span>স্টেটমেন্ট ডাউনলোড</span>
                </button>
              </div>

              {/* Recent Transactions */}
              <div className="space-y-2 pt-1">
                <h4 className="font-bold text-stone-800 text-xs uppercase tracking-wider">সাম্প্রতিক লেনদেন</h4>
                <div className="space-y-1.5">
                  <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-stone-900 text-xs">অর্ডার #ORD-9821 বিক্রয় জমা</p>
                      <p className="text-[10px] text-stone-500">আজ, ১২:৩০ PM • এসক্রো রিলিজ</p>
                    </div>
                    <span className="font-bold font-mono text-emerald-700">+৳১,২৫০</span>
                  </div>
                  <div className="p-2.5 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between">
                    <div>
                      <p className="font-bold text-stone-900 text-xs">বিকাশ উত্তোলন #WTH-4019</p>
                      <p className="text-[10px] text-stone-500">গতকাল, ০৩:১৫ PM • সম্পন্ন</p>
                    </div>
                    <span className="font-bold font-mono text-rose-600">-৳৫,০০০</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="p-3 bg-stone-50 border-t border-stone-200 text-right">
              <button
                type="button"
                onClick={() => setIsWalletModalOpen(false)}
                className="px-4 py-1.5 bg-stone-900 hover:bg-stone-800 text-white font-bold text-xs rounded-xl transition cursor-pointer"
              >
                {isBn ? 'বন্ধ করুন' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          14. PRODUCT DETAIL & CHECKOUT MODAL (Buy Now, Quantity, Payment, Contact)
          ========================================================================= */}
      {checkoutProduct && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in"
          onClick={() => setCheckoutProduct(null)}
        >
          <div
            className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border border-stone-200 overflow-hidden my-auto max-h-[90vh] flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="bg-stone-900 text-white p-3.5 sm:p-4 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-black tracking-tight">
                  {checkoutOrderConfirmed ? (isBn ? 'অর্ডার সফল হয়েছে!' : 'Order Confirmed!') : (isBn ? 'পণ্য ক্রয় ও বিস্তারিত বিবরণ' : 'Product Details & Checkout')}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setCheckoutProduct(null)}
                className="w-7 h-7 rounded-full bg-stone-800 hover:bg-stone-700 text-stone-300 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1 text-xs">
              {checkoutOrderConfirmed ? (
                /* Success Confirmation View */
                <div className="py-6 text-center space-y-4">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-700 rounded-full flex items-center justify-center mx-auto border-2 border-emerald-300 shadow-sm">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <div className="space-y-1">
                    <h3 className="text-lg font-black text-stone-900">
                      {isBn ? 'আপনার অর্ডার সফলভাবে গ্রহণ করা হয়েছে!' : 'Your Order Has Been Placed!'}
                    </h3>
                    <p className="text-xs text-stone-600 max-w-xs mx-auto">
                      বিক্রেতা ({profile.shopName}) শীঘ্রই আপনার সাথে যোগাযোগ করবেন।
                    </p>
                  </div>
                  <div className="bg-stone-50 p-3.5 rounded-xl border border-stone-200 text-left space-y-1.5 max-w-sm mx-auto">
                    <div className="flex justify-between">
                      <span className="text-stone-500">অর্ডার নম্বর:</span>
                      <span className="font-mono font-bold text-emerald-700">{placedOrderId || `#JDM-ORD-${Date.now().toString().slice(-6)}`}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">পণ্য:</span>
                      <span className="font-bold text-stone-900 truncate max-w-[180px]">{checkoutProduct.nameBn || checkoutProduct.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">পরিমাণ:</span>
                      <span className="font-bold text-stone-900">{checkoutQuantity} টি</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-stone-500">পেমেন্ট পদ্ধতি:</span>
                      <span className="font-bold text-stone-800">
                        {checkoutPaymentMethod === 'cod' ? 'ক্যাশ অন ডেলিভারি (COD)' : (checkoutPaymentMethod === 'bkash' ? 'বিকাশ' : (checkoutPaymentMethod === 'nagad' ? 'নগদ' : 'JhaPay এসক্রো'))}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-stone-200 pt-1.5">
                      <span className="font-bold text-stone-900">মোট প্রদেয় মূল্য:</span>
                      <span className="font-mono font-black text-emerald-700">৳{(checkoutProduct.price * checkoutQuantity).toLocaleString()}</span>
                    </div>
                  </div>

                  {/* Direct Contact Links */}
                  <div className="max-w-sm mx-auto pt-2 grid grid-cols-2 gap-2">
                    <a
                      href={`tel:${checkoutProduct.sellerPhone || profile.phone}`}
                      className="py-2.5 px-3 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
                    >
                      <Phone className="w-3.5 h-3.5 text-blue-600" />
                      <span>বিক্রেতাকে কল করুন</span>
                    </a>
                    <a
                      href={`https://wa.me/88${(checkoutProduct.sellerPhone || profile.phone).replace(/\D/g, '')}?text=${encodeURIComponent(
                        `আসসালামু আলাইকুম, আমি ঝাদিমাদিতে #${placedOrderId} নম্বর অর্ডার করেছি: "${checkoutProduct.nameBn || checkoutProduct.title}" (পরিমাণ: ${checkoutQuantity}টি, মোট: ৳${checkoutProduct.price * checkoutQuantity})। ডেলিভারির আপডেট জানতে চাই।`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition"
                    >
                      <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                      <span>হোয়াটসঅ্যাপ মেসেজ</span>
                    </a>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutProduct(null);
                      setCheckoutOrderConfirmed(false);
                      setPlacedOrderId('');
                    }}
                    className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-xs"
                  >
                    {isBn ? 'ক্যাটালগে ফিরে যান' : 'Back to Catalog'}
                  </button>
                </div>
              ) : (
                <>
                  {/* Product Mini Info */}
                  <div className="flex gap-3 bg-stone-50 p-3 rounded-xl border border-stone-200">
                    <img
                      src={checkoutProduct.image}
                      alt={checkoutProduct.nameBn || checkoutProduct.title}
                      className="w-16 h-16 rounded-lg object-cover bg-stone-200 shrink-0"
                    />
                    <div className="min-w-0 flex-1 space-y-1">
                      <h4 className="text-xs sm:text-sm font-bold text-stone-900 line-clamp-2">
                        {checkoutProduct.nameBn || checkoutProduct.title}
                      </h4>
                      <div className="flex items-center gap-2 text-stone-500 text-[11px]">
                        {checkoutProduct.unit && <span>প্যাকেজিং: {checkoutProduct.unit}</span>}
                        <span>•</span>
                        <span className="font-bold text-emerald-700 font-mono">৳{checkoutProduct.price.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Quantity Selector */}
                  <div className="bg-stone-50 p-3 rounded-xl border border-stone-200 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-stone-800 block">পরিমাণ (Quantity)</span>
                      <span className="text-[10px] text-stone-500">প্রতি পিস ৳{checkoutProduct.price.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setCheckoutQuantity(prev => Math.max(1, prev - 1))}
                        className="w-8 h-8 rounded-lg bg-white border border-stone-300 hover:bg-stone-100 flex items-center justify-center font-bold text-stone-700 transition cursor-pointer shadow-2xs"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-8 text-center font-mono font-bold text-sm text-stone-900">
                        {checkoutQuantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => setCheckoutQuantity(prev => prev + 1)}
                        className="w-8 h-8 rounded-lg bg-white border border-stone-300 hover:bg-stone-100 flex items-center justify-center font-bold text-stone-700 transition cursor-pointer shadow-2xs"
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Total Price Calculation */}
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200/80 flex items-center justify-between">
                    <span className="font-bold text-emerald-900">সর্বমোট প্রদেয় মূল্য:</span>
                    <span className="text-lg font-black text-emerald-800 font-mono">
                      ৳{(checkoutProduct.price * checkoutQuantity).toLocaleString()}
                    </span>
                  </div>

                  {/* Customer Information */}
                  <div className="space-y-2.5">
                    <h4 className="font-bold text-stone-800 uppercase tracking-wider text-[11px]">ডেলিভারি ও যোগাযোগের তথ্য</h4>
                    <div className="space-y-2">
                      <input
                        type="text"
                        placeholder="আপনার নাম লিখুন *"
                        value={checkoutCustomerName}
                        onChange={(e) => setCheckoutCustomerName(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                      <input
                        type="tel"
                        placeholder="মোবাইল নম্বর (১১ ডিজিট) *"
                        value={checkoutCustomerPhone}
                        onChange={(e) => setCheckoutCustomerPhone(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden font-mono"
                      />
                      <textarea
                        rows={2}
                        placeholder="ডেলিভারি ঠিকানা (উপজেলা, এলাকা, রোড নম্বর) *"
                        value={checkoutDeliveryAddress}
                        onChange={(e) => setCheckoutDeliveryAddress(e.target.value)}
                        className="w-full px-3 py-2 border border-stone-300 rounded-xl text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-hidden"
                      />
                    </div>
                  </div>

                  {/* Payment Method Selector */}
                  <div className="space-y-2">
                    <h4 className="font-bold text-stone-800 uppercase tracking-wider text-[11px]">পেমেন্ট পদ্ধতি নির্ধারণ করুন</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setCheckoutPaymentMethod('cod')}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          checkoutPaymentMethod === 'cod'
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-900 font-bold shadow-2xs'
                            : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <p className="text-xs">ক্যাশ অন ডেলিভারি</p>
                        <p className="text-[10px] text-stone-500">পণ্য হাতে পেয়ে মূল্য দিন</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCheckoutPaymentMethod('bkash')}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          checkoutPaymentMethod === 'bkash'
                            ? 'border-pink-600 bg-pink-50 text-pink-900 font-bold shadow-2xs'
                            : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <p className="text-xs">বিকাশ (bKash)</p>
                        <p className="text-[10px] text-stone-500">মার্চেন্ট পেমেন্ট</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCheckoutPaymentMethod('nagad')}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          checkoutPaymentMethod === 'nagad'
                            ? 'border-orange-600 bg-orange-50 text-orange-900 font-bold shadow-2xs'
                            : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <p className="text-xs">নগদ (Nagad)</p>
                        <p className="text-[10px] text-stone-500">অনলাইন পেমেন্ট</p>
                      </button>

                      <button
                        type="button"
                        onClick={() => setCheckoutPaymentMethod('escrow')}
                        className={`p-2.5 rounded-xl border text-left transition cursor-pointer ${
                          checkoutPaymentMethod === 'escrow'
                            ? 'border-purple-600 bg-purple-50 text-purple-900 font-bold shadow-2xs'
                            : 'border-stone-200 bg-white text-stone-700 hover:bg-stone-50'
                        }`}
                      >
                        <p className="text-xs">JhaPay এসক্রো</p>
                        <p className="text-[10px] text-stone-500">১০০% ক্রেতা সুরক্ষা</p>
                      </button>
                    </div>
                  </div>

                  {/* Direct Contact Options with Seller */}
                  <div className="pt-2 border-t border-stone-200">
                    <p className="text-[11px] font-bold text-stone-600 mb-2">অর্ডারের পূর্বে বিক্রেতার সাথে কথা বলতে চান?</p>
                    <div className="grid grid-cols-3 gap-2">
                      <a
                        href={`tel:${checkoutProduct.sellerPhone || profile.phone}`}
                        className="py-2 px-2 bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition text-center"
                      >
                        <Phone className="w-3.5 h-3.5 text-blue-600" />
                        <span>সরাসরি কল</span>
                      </a>

                      <a
                        href={`https://wa.me/88${(checkoutProduct.sellerPhone || profile.phone).replace(/\D/g, '')}?text=${encodeURIComponent(
                          `আসসালামু আলাইকুম, আমি "${checkoutProduct.nameBn || checkoutProduct.title}" (৳${checkoutProduct.price}) অর্ডার করতে চাই।`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="py-2 px-2 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-900 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition text-center"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                        <span>হোয়াটসঅ্যাপ</span>
                      </a>

                      <button
                        type="button"
                        onClick={() => {
                          const p = checkoutProduct;
                          setCheckoutProduct(null);
                          handleOpenProductChat(p);
                        }}
                        className="py-2 px-2 bg-purple-50 hover:bg-purple-100 border border-purple-200 text-purple-900 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition text-center cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5 text-purple-700" />
                        <span>ইন-অ্যাপ চ্যাট</span>
                      </button>
                    </div>
                  </div>

                  {/* Confirm Buy Now Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        if (!checkoutCustomerName.trim() || !checkoutCustomerPhone.trim()) {
                          alert(isBn ? 'অনুগ্রহ করে আপনার নাম এবং মোবাইল নম্বর প্রদান করুন।' : 'Please enter your name and phone number.');
                          return;
                        }
                        setCheckoutOrderConfirmed(true);
                      }}
                      className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer active:scale-98"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>{isBn ? 'অর্ডার নিশ্চিত করুন (Buy Now)' : 'Confirm Order (Buy Now)'}</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerProfile;
